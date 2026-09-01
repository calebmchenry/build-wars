from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any

from .artifacts import canonical_json_bytes
from .attribute_points import AttributePointExtraction
from .models import Diagnostic, digest_bytes
from .professions_attributes import ProfessionAttributeExtraction
from .profiles import DataIngestionProfile, EPIC_03_PROFILE_ID
from .template_ids import TemplateCrosswalkExtraction


@dataclass(frozen=True)
class CatalogAssemblyResult:
    catalog: dict[str, Any]
    diagnostics: list[Diagnostic]


def assemble_profession_attribute_catalog(
    *,
    profile: DataIngestionProfile,
    generated_at: str,
    snapshot_manifest_paths: list[str],
    template_extraction: TemplateCrosswalkExtraction,
    profession_attribute_extraction: ProfessionAttributeExtraction,
    attribute_point_extraction: AttributePointExtraction,
) -> CatalogAssemblyResult:
    sources = _unique_sources(profession_attribute_extraction.sources)
    source_ids = [str(source["id"]) for source in sources]
    catalog: dict[str, Any] = {
        "schemaVersion": 1,
        "catalogVersion": "pending",
        "sectionDigests": [],
        "generatedAt": generated_at,
        "generator": "build-wars-ingest/0.1.0",
        "profile": {
            "id": EPIC_03_PROFILE_ID,
            "sourceTarget": profile.source_target,
            "sourceEpic": profile.source_epic,
            "sourceCaps": {
                "pageLimit": profile.page_limit,
                "requestLimit": profile.request_limit,
                "responseByteCap": profile.response_byte_cap,
                "parserByteCap": profile.parser_byte_cap,
            },
        },
        "sources": sources,
        "snapshotManifestPaths": sorted(snapshot_manifest_paths),
        "templateCrosswalk": template_extraction.crosswalk,
        "professions": profession_attribute_extraction.professions,
        "attributes": profession_attribute_extraction.attributes,
        "attributePointRules": attribute_point_extraction.rules,
        "remoteMedia": profession_attribute_extraction.remote_media,
        "manualReviews": [
            *profession_attribute_extraction.manual_reviews,
            _first_baseline_review(source_ids, generated_at),
        ],
        "generatedArtifactManifest": None,
        "sourceShapeProof": {
            "checkpointAt": generated_at,
            "parserDecision": "mwparserfromhell plus bounded wiki-table/list framing is sufficient for the locked EPIC-03 profile.",
            "requiredHelper": "bounded-wiki-table-helper",
            "sourcePages": list(profile.source_titles),
            "detailPages": list(profile.detail_titles),
            "candidateRowCounts": {
                "templateCrosswalk": len(template_extraction.candidate_rows),
                "attributeOwnership": len(profession_attribute_extraction.candidate_rows),
                "attributePoints": len(attribute_point_extraction.candidate_rows),
            },
        },
    }
    catalog["catalogVersion"] = semantic_catalog_version(catalog)
    catalog["sectionDigests"] = section_digests(catalog)
    diagnostics = [
        *template_extraction.diagnostics,
        *profession_attribute_extraction.diagnostics,
        *attribute_point_extraction.diagnostics,
        *validate_profession_attribute_catalog(catalog),
    ]
    return CatalogAssemblyResult(catalog=catalog, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


def semantic_catalog_version(catalog: dict[str, Any]) -> str:
    projection = {
        "templateCrosswalk": _crosswalk_projection(catalog["templateCrosswalk"]),
        "professions": _drop_provenance(catalog["professions"]),
        "attributes": _drop_provenance(catalog["attributes"]),
        "attributePointRules": _drop_provenance(catalog["attributePointRules"]),
        "remoteMedia": _drop_provenance(catalog["remoteMedia"]),
    }
    return f"pa-{digest_bytes(canonical_json_bytes(projection))[:16]}"


def section_digests(catalog: dict[str, Any]) -> list[dict[str, str]]:
    return [
        {"section": section, "digest": digest_bytes(canonical_json_bytes(catalog[section]))}
        for section in ("templateCrosswalk", "professions", "attributes", "attributePointRules", "remoteMedia")
    ]


def validate_profession_attribute_catalog(catalog: dict[str, Any]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    source_ids = {str(source["id"]) for source in catalog["sources"]}
    professions = catalog["professions"]
    attributes = catalog["attributes"]
    crosswalk = catalog["templateCrosswalk"]
    rules = catalog["attributePointRules"]

    if len(professions) != 10:
        diagnostics.append(_diag("PA_PROFESSION_COUNT", "Generated catalog must contain exactly ten playable professions"))
    if any(int(profession["templateId"]) == 0 for profession in professions):
        diagnostics.append(_diag("PA_PROFESSION_SENTINEL_RECORD", "Profession template id 0 must not be a playable profession"))
    sentinel = next((record for record in crosswalk["professionTemplateIds"] if int(record["templateId"]) == 0), None)
    if sentinel is None or sentinel.get("status") != "none" or sentinel.get("catalogId") is not None:
        diagnostics.append(_diag("PA_PROFESSION_NONE_SENTINEL", "Profession template id 0 must map to None with catalogId null"))
    if not any(int(attribute["templateId"]) == 0 for attribute in attributes):
        diagnostics.append(_diag("PA_ATTRIBUTE_ZERO_MISSING", "Attribute template id 0 must remain in the attribute namespace"))

    _duplicates([int(record["templateId"]) for record in crosswalk["professionTemplateIds"]], "PA_DUPLICATE_TEMPLATE_PROFESSION_ID", diagnostics)
    _duplicates([int(record["templateId"]) for record in crosswalk["attributeTemplateIds"]], "PA_DUPLICATE_TEMPLATE_ATTRIBUTE_ID", diagnostics)
    _duplicates([str(profession["abbreviation"]).casefold() for profession in professions], "PA_DUPLICATE_PROFESSION_ABBREVIATION", diagnostics)
    _duplicates([str(profession["name"]).casefold() for profession in professions], "PA_DUPLICATE_PROFESSION_NAME", diagnostics)
    _duplicates([str(attribute["name"]).casefold() for attribute in attributes], "PA_DUPLICATE_ATTRIBUTE_NAME", diagnostics)

    attribute_ids = {int(attribute["id"]) for attribute in attributes}
    crosswalk_attribute_ids = {int(record["templateId"]) for record in crosswalk["attributeTemplateIds"]}
    if attribute_ids != crosswalk_attribute_ids:
        diagnostics.append(_diag("PA_ATTRIBUTE_CROSSWALK_MISMATCH", "Every template-listed attribute must have exactly one generated attribute record"))
    reserved_ids = {int(record["templateId"]) for record in crosswalk["reservedTemplateIds"] if record["namespace"] == "attribute"}
    if not {26, 27, 28}.issubset(reserved_ids):
        diagnostics.append(_diag("PA_ATTRIBUTE_GAPS_NOT_PRESERVED", "Attribute template ID gaps must be preserved as reserved facts"))

    attributes_by_id = {int(attribute["id"]): attribute for attribute in attributes}
    for profession in professions:
        primary = attributes_by_id.get(int(profession["primaryAttributeId"]))
        if primary is None or primary["professionId"] != profession["id"] or not primary["isPrimary"]:
            diagnostics.append(_diag("PA_PRIMARY_ATTRIBUTE_LINK", f"Profession {profession['name']} must reference one owned primary attribute"))
    primary_counts = Counter(int(attribute["professionId"]) for attribute in attributes if attribute["isPrimary"])
    for profession in professions:
        if primary_counts[int(profession["id"])] != 1:
            diagnostics.append(_diag("PA_PRIMARY_ATTRIBUTE_COUNT", f"Profession {profession['name']} must own exactly one primary attribute"))
    for attribute in attributes:
        if attribute["isPrimary"] and not attribute["isPrimaryOnly"]:
            diagnostics.append(_diag("PA_PRIMARY_ATTRIBUTE_AVAILABILITY", f"Primary attribute {attribute['name']} must be primary-only"))
        if attribute["isPrimary"] and attribute.get("primaryEffectSummary") is None:
            diagnostics.append(_diag("PA_PRIMARY_SUMMARY_MISSING", f"Primary attribute {attribute['name']} must have a reviewed summary"))

    if any(media.get("cachedBytes") is not False for media in catalog["remoteMedia"]):
        diagnostics.append(_diag("PA_ICON_BYTES_TRACKED", "Remote media records must keep cachedBytes false"))
    if len(catalog["remoteMedia"]) != 10:
        diagnostics.append(_diag("PA_ICON_METADATA_COUNT", "Each profession should have one metadata-only icon record"))

    rank_0 = next((item for item in rules["purchasedRankCosts"] if item["purchasedRank"] == 0), None)
    rank_12 = next((item for item in rules["purchasedRankCosts"] if item["purchasedRank"] == 12), None)
    if rank_0 is None or rank_0["cumulativeCost"] != 0 or rank_12 is None or rank_12["cumulativeCost"] != 97:
        diagnostics.append(_diag("PA_RANK_COST_BOUNDARIES", "Purchased-rank costs must include rank 0 and rank 12 boundaries"))
    default = rules["defaultPveLevel20"]
    if default["totalWithoutQuestBonus"] != 170 or default["totalWithMaximumQuestBonus"] != 200:
        diagnostics.append(_diag("PA_DEFAULT_BUDGETS", "Default level-20 PvE budgets must derive to 170 and 200"))
    if len(rules["questRewards"]) != 6 or any(reward["rewardPoints"] != 15 for reward in rules["questRewards"]):
        diagnostics.append(_diag("PA_QUEST_REWARDS", "Attribute quest metadata must contain two 15-point quests per campaign"))

    referenced_source_ids = _referenced_source_ids(catalog)
    missing_source_ids = sorted(referenced_source_ids - source_ids)
    if missing_source_ids:
        diagnostics.append(_diag("PA_SOURCE_REFERENCE_MISSING", f"Catalog referenced unknown source IDs: {', '.join(missing_source_ids)}"))
    return diagnostics


def _first_baseline_review(source_ids: list[str], generated_at: str) -> dict[str, Any]:
    return {
        "id": "review:epic-03-first-baseline:2026-09-01",
        "reviewer": "Build Wars sprint executor",
        "reviewedAt": generated_at,
        "scope": "EPIC-03 first promoted profession/attribute catalog baseline",
        "decision": "approved",
        "rationale": "No prior approved EPIC-03 baseline exists; this promotion records the selected bounded snapshot set and generated artifact as the initial baseline.",
        "evidence": [
            {"kind": "source", "reference": source_id, "notes": "Selected EPIC-03 snapshot/source reference."}
            for source_id in source_ids
        ],
        "relatedFindingIds": [],
        "followUpTicketIds": [],
        "expiresAt": None,
        "reReviewTrigger": "Any semantic projection, schema, source revision, or promotion path change.",
    }


def _crosswalk_projection(crosswalk: dict[str, Any]) -> dict[str, Any]:
    return {
        "professionTemplateIds": _drop_provenance(crosswalk["professionTemplateIds"]),
        "attributeTemplateIds": _drop_provenance(crosswalk["attributeTemplateIds"]),
        "reservedTemplateIds": _drop_provenance(crosswalk["reservedTemplateIds"]),
    }


def _drop_provenance(value: Any) -> Any:
    if isinstance(value, list):
        return [_drop_provenance(item) for item in value]
    if isinstance(value, dict):
        return {
            key: _drop_provenance(item)
            for key, item in value.items()
            if key not in {"provenance", "sources", "snapshotManifestPaths", "sourceRow", "manualReviews", "generatedAt"}
        }
    return value


def _unique_sources(sources: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id = {str(source["id"]): source for source in sources}
    return [by_id[source_id] for source_id in sorted(by_id)]


def _duplicates(values: list[Any], code: str, diagnostics: list[Diagnostic]) -> None:
    counts = Counter(values)
    for value, count in counts.items():
        if count > 1:
            diagnostics.append(_diag(code, f"Duplicate value in generated catalog: {value}"))


def _referenced_source_ids(value: Any) -> set[str]:
    if isinstance(value, list):
        result: set[str] = set()
        for item in value:
            result.update(_referenced_source_ids(item))
        return result
    if isinstance(value, dict):
        result = set()
        source_ids = value.get("sourceIds")
        if isinstance(source_ids, list):
            result.update(str(item) for item in source_ids)
        source_id = value.get("sourceId")
        if isinstance(source_id, str):
            result.add(source_id)
        for item in value.values():
            result.update(_referenced_source_ids(item))
        return result
    return set()


def _diag(code: str, message: str) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="critical",
        message=message,
        category="schema-shape-error",
        scope_kind="artifact",
        artifact_path="data/generated/epic-03/professions-attributes.catalog.json",
    )
