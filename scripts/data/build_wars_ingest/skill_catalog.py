from __future__ import annotations

import json
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .artifacts import canonical_json_bytes
from .config import GENERATOR_NAME, INGESTION_SCHEMA_VERSION
from .icons import resolve_icon_metadata
from .models import Diagnostic, Evidence, digest_bytes
from .profiles import DataIngestionProfile, EPIC_04_PROFESSION_SKILL_LISTS, EPIC_04_PROFILE_ID
from .skill_infobox import extract_skill_infobox
from .skill_progression import extract_skill_progressions, split_evidence_from_title


class SkillCatalogError(RuntimeError):
    pass


@dataclass(frozen=True)
class Epic03Dependency:
    catalog: dict[str, Any]
    artifact_digest: str
    manifest_digest: str
    qa_gate: str


@dataclass(frozen=True)
class SkillCatalogAssembly:
    catalog: dict[str, Any]
    diagnostics: list[Diagnostic]


DESCRIPTION_REVIEW_ID = "review:epic-04-description-structured-only:2026-09-01"
BASELINE_REVIEW_ID = "review:epic-04-first-baseline:2026-09-01"
PROGRESSION_REVIEW_ID = "review:epic-04-structured-progressions:2026-09-01"


def load_epic03_dependency(root: Path) -> Epic03Dependency:
    generated = root / "data/generated/epic-03/professions-attributes.catalog.json"
    manifest_path = root / "data/generated/epic-03/professions-attributes.catalog.manifest.json"
    qa_path = root / "data/qa/epic-03/professions-attributes.catalog.qa.json"
    try:
        catalog_bytes = generated.read_bytes()
        manifest_bytes = manifest_path.read_bytes()
        qa = json.loads(qa_path.read_text(encoding="utf-8"))
        catalog = json.loads(catalog_bytes.decode("utf-8"))
        manifest = json.loads(manifest_bytes.decode("utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SkillCatalogError(f"EPIC-03 dependency artifacts could not be read: {exc}") from exc
    if qa.get("appConsumptionGate") != "pass" or qa.get("publicReleaseGate") != "pass":
        raise SkillCatalogError("EPIC-03 QA gates must pass before EPIC-04 joins")
    digest = manifest.get("digest")
    if not isinstance(digest, dict) or digest.get("value") != digest_bytes(catalog_bytes):
        raise SkillCatalogError("EPIC-03 catalog digest does not match its manifest")
    return Epic03Dependency(
        catalog=catalog,
        artifact_digest=digest_bytes(catalog_bytes),
        manifest_digest=digest_bytes(manifest_bytes),
        qa_gate="pass",
    )


def assemble_skill_catalog(
    *,
    profile: DataIngestionProfile,
    generated_at: str,
    source_plan: dict[str, Any],
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    dependency: Epic03Dependency,
    snapshot_set_digest: str,
) -> SkillCatalogAssembly:
    if profile.id != EPIC_04_PROFILE_ID:
        raise SkillCatalogError(f"Skill catalog assembly requires {EPIC_04_PROFILE_ID}")

    diagnostics: list[Diagnostic] = []
    details_by_skill_id = {int(page["skillId"]): page for page in detail_pages}
    skills: list[dict[str, Any]] = []
    progression_series: list[dict[str, Any]] = []
    remote_media_by_id: dict[str, dict[str, Any]] = {}
    dispositions: list[dict[str, Any]] = []

    for seed in source_plan["acceptedSeeds"]:
        skill_id = int(seed["skillId"])
        detail = details_by_skill_id.get(skill_id)
        if detail is None:
            diagnostics.append(
                _diag(
                    "SKILL_SOURCE_SEED_UNRESOLVED",
                    f"Accepted seed {skill_id} did not have a detail snapshot",
                    skill_id,
                    str(seed.get("sourceId", "source:unknown")),
                    severity="error",
                    disposition="excluded",
                )
            )
            dispositions.append(_disposition(seed, "excluded", "Detail snapshot was missing.", BASELINE_REVIEW_ID))
            continue
        source_reference = detail["sourceReference"]
        source_id = str(source_reference["id"])
        page_identity = {
            "requestedTitle": str(seed["requestedTitle"]),
            "normalizedTitle": str(detail.get("normalizedTitle") or seed["requestedTitle"]),
            "canonicalTitle": str(detail["canonicalTitle"]),
            "pageId": detail.get("pageId"),
            "revisionId": detail.get("revisionId"),
            "sourceRevisionTimestamp": detail.get("sourceRevisionTimestamp"),
            "redirectedFrom": detail.get("redirectedFrom"),
        }
        infobox = extract_skill_infobox(
            skill_id=skill_id,
            template_id=int(seed["templateId"]),
            requested_title=str(seed["requestedTitle"]),
            canonical_title=str(detail["canonicalTitle"]),
            page_identity=page_identity,
            wikitext=str(detail["content"]),
            source_reference=source_reference,
            profession_catalog=dependency.catalog,
            review_id=DESCRIPTION_REVIEW_ID,
        )
        diagnostics.extend(infobox.diagnostics)
        record = infobox.record
        progression = extract_skill_progressions(
            skill_id=skill_id,
            wikitext=str(detail["content"]),
            source_id=source_id,
            attribute_id=record["attributeId"],
            attribute_name=infobox.attribute_name,
            title_key=infobox.title_key,
        )
        diagnostics.extend(progression.diagnostics)
        progression_series.extend(progression.series)
        record["progressionSeriesIds"] = [series["id"] for series in progression.series]
        if not record["classification"]["unsupported"] and len(remote_media_by_id) < profile.media_title_limit:
            metadata, icon_diagnostics = resolve_icon_metadata(
                page_title=record["name"],
                source_id=source_id,
                source_reference=source_reference,
                imageinfo_pages=imageinfo_pages,
                explicit_image=infobox.icon_file_title,
            )
            diagnostics.extend(_review_icon_diagnostic(item) for item in icon_diagnostics)
            if metadata is not None:
                clean_metadata = _runtime_media(metadata)
                remote_media_by_id[str(clean_metadata["id"])] = clean_metadata
                record["iconId"] = clean_metadata["id"]
        skills.append(record)

    duplicate_dispositions = _same_page_dispositions(skills)
    dispositions.extend(duplicate_dispositions)
    _apply_split_groups(skills)
    split_groups = _split_groups(skills)
    for group in split_groups:
        for member in group["members"]:
            skill = next((item for item in skills if int(item["id"]) == int(member["skillId"])), None)
            if skill is not None:
                skill["splitGroupId"] = group["id"]
                skill["classification"]["split"] = True

    skills.sort(key=lambda item: (int(item["id"]), str(item["name"])))
    progression_series.sort(key=lambda item: str(item["id"]))
    dispositions.sort(key=lambda item: (int(item["skillId"]), str(item["id"])))
    remote_media = [remote_media_by_id[key] for key in sorted(remote_media_by_id)]
    source_set = _source_set_summary(source_plan, skills, dispositions)
    dependency_summary = _dependency_summary(dependency)
    catalog: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "catalogVersion": "pending",
        "sectionDigests": [],
        "generatedAt": generated_at,
        "generator": GENERATOR_NAME,
        "profile": _profile_wire(profile),
        "dependencyDigests": [dependency_summary],
        "sourceSet": source_set,
        "dispositions": dispositions,
        "skills": skills,
        "progressionSeries": progression_series,
        "splitGroups": split_groups,
        "remoteMedia": remote_media,
    }
    catalog["catalogVersion"] = semantic_catalog_version(catalog)
    catalog["sectionDigests"] = section_digests(catalog)
    diagnostics.extend(validate_skill_catalog(catalog, snapshot_set_digest=snapshot_set_digest))
    return SkillCatalogAssembly(catalog=catalog, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


def semantic_catalog_version(catalog: dict[str, Any]) -> str:
    projection = {
        "dependencyDigests": catalog["dependencyDigests"],
        "sourceSet": _drop_nonsemantic(catalog["sourceSet"]),
        "dispositions": _drop_nonsemantic(catalog["dispositions"]),
        "skills": _drop_nonsemantic(catalog["skills"]),
        "progressionSeries": _drop_nonsemantic(catalog["progressionSeries"]),
        "splitGroups": _drop_nonsemantic(catalog["splitGroups"]),
        "remoteMedia": _drop_nonsemantic(catalog["remoteMedia"]),
    }
    return f"skills-{digest_bytes(canonical_json_bytes(projection))[:16]}"


def section_digests(catalog: dict[str, Any]) -> list[dict[str, str]]:
    return [
        {"section": section, "digest": digest_bytes(canonical_json_bytes(catalog[section]))}
        for section in (
            "dependencyDigests",
            "sourceSet",
            "dispositions",
            "skills",
            "progressionSeries",
            "splitGroups",
            "remoteMedia",
        )
    ]


def validate_skill_catalog(catalog: dict[str, Any], *, snapshot_set_digest: str) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    skills = catalog["skills"]
    source_set = catalog["sourceSet"]
    if source_set["acceptedSeedCount"] != len(skills) + _excluded_disposition_count(catalog["dispositions"]):
        diagnostics.append(
            _diag(
                "SKILL_SOURCE_SET_ACCOUNTING",
                "Accepted source-set seeds do not match catalog records plus excluded dispositions",
                0,
                "source-set",
                severity="critical",
                disposition="non-waivable",
            )
        )
    ids = [int(skill["id"]) for skill in skills]
    for value, count in Counter(ids).items():
        if count > 1:
            diagnostics.append(
                _diag(
                    "SKILL_CATALOG_DUPLICATE_ID",
                    f"Generated catalog duplicated skill ID {value}",
                    value,
                    "catalog",
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    if any(media.get("cachedBytes") is not False for media in catalog["remoteMedia"]):
        diagnostics.append(
            _diag(
                "SKILL_ICON_BYTES_TRACKED",
                "Skill icon media records must keep cachedBytes false",
                0,
                "remote-media",
                severity="critical",
                disposition="non-waivable",
            )
        )
    forbidden_terms = ("== Acquisition ==", "Skill trainer", "Profession changer", "vendor", "drop location")
    encoded = json.dumps(catalog, ensure_ascii=False)
    for term in forbidden_terms:
        if term in encoded:
            diagnostics.append(
                _diag(
                    "SKILL_FORBIDDEN_PROSE_PROMOTED",
                    f"Generated runtime catalog contained forbidden source prose: {term}",
                    0,
                    "catalog",
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    if catalog["dependencyDigests"][0]["qaGate"] != "pass":
        diagnostics.append(
            _diag(
                "SKILL_EPIC03_QA_NOT_PASSING",
                "EPIC-03 dependency QA gate was not pass",
                0,
                "dependency:epic-03",
                severity="critical",
                disposition="non-waivable",
            )
        )
    if not snapshot_set_digest:
        diagnostics.append(
            _diag(
                "SKILL_SNAPSHOT_SET_DIGEST_MISSING",
                "Promotion evidence must include a selected snapshot-set digest",
                0,
                "snapshot-set",
                severity="critical",
                disposition="non-waivable",
            )
        )
    diagnostics.append(
        Diagnostic(
            code="SKILL_DESCRIPTION_STRUCTURED_ONLY_REVIEW",
            severity="info",
            message="Runtime skill descriptions are structured-only unless a later digest-bound text review approves copied prose.",
            category="copied-text-without-attribution",
            scope_kind="release",
            artifact_path="data/generated/epic-04/skills.catalog.json",
            evidence=(
                Evidence("review-note", DESCRIPTION_REVIEW_ID, "Source-authored descriptions excluded from runtime text."),
            ),
            disposition="resolved",
        )
    )
    return diagnostics


def _source_set_summary(
    source_plan: dict[str, Any],
    skills: list[dict[str, Any]],
    dispositions: list[dict[str, Any]],
) -> dict[str, Any]:
    summary = source_plan["summary"]
    profession_list_pages = source_plan.get("professionListPages", [])
    profession_list_rows = source_plan.get("professionSkillRows", [])
    return {
        "indexTitle": "Guild Wars Wiki:Game integration/Skills",
        "rangedPageTitles": [page["title"] for page in source_plan["rangedPages"]],
        "professionListTitles": [page["title"] for page in profession_list_pages],
        "sourceSetDigest": summary["sourceSetDigest"],
        "sourcePlanDigest": summary["sourcePlanDigest"],
        "acceptedSeedCount": int(summary["acceptedSeedCount"]),
        "catalogRecordCount": len(skills),
        "dispositionCount": len(dispositions),
        "minimumAcceptedId": summary["minimumAcceptedId"],
        "maximumAcceptedId": summary["maximumAcceptedId"],
        "numericGapCount": int(summary["numericGapCount"]),
        "professionListRowCount": len(profession_list_rows),
        "rangeSeedCount": int(summary.get("rangeSeedCount", 0)),
        "rangeOnlySeedCount": int(summary.get("rangeOnlySeedCount", 0)),
        "supplementalSeedCount": int(summary.get("supplementalSeedCount", 0)),
        "professionListUnsupportedCount": 0,
        "planningAmendment": (
            "SPRINT-005 replaced the missing Guild Wars Wiki:Game integration/Skills/0 "
            "source with the live index and linked ranged skill pages for ID lookup. The "
            "Guild Wars Wiki profession skill list pages now define the runtime profession-skill catalog."
        ),
    }


def _profile_wire(profile: DataIngestionProfile) -> dict[str, Any]:
    return {
        "id": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "sourceCaps": {
            "seedPageLimit": 8 + len(EPIC_04_PROFESSION_SKILL_LISTS),
            "detailPageLimit": profile.page_limit,
            "mediaTitleLimit": profile.media_title_limit,
            "requestLimit": profile.request_limit,
            "retryLimit": 3,
            "continuationLimit": 20,
            "responseByteCap": profile.response_byte_cap,
            "parserByteCap": profile.parser_byte_cap,
            "aggregateByteCap": profile.aggregate_byte_cap,
            "catalogByteCap": profile.catalog_byte_cap,
            "qaByteCap": profile.qa_byte_cap,
        },
    }


def _dependency_summary(dependency: Epic03Dependency) -> dict[str, Any]:
    return {
        "id": "epic-03-professions-attributes",
        "catalogVersion": str(dependency.catalog["catalogVersion"]),
        "artifactDigest": dependency.artifact_digest,
        "manifestDigest": dependency.manifest_digest,
        "qaGate": "pass",
        "sectionDigests": dependency.catalog["sectionDigests"],
    }


def _runtime_media(metadata: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": metadata["id"],
        "kind": metadata["kind"],
        "sourceId": metadata["sourceId"],
        "fileTitle": metadata["fileTitle"],
        "canonicalUrl": metadata["canonicalUrl"],
        "mimeType": metadata["mimeType"],
        "width": metadata["width"],
        "height": metadata["height"],
        "sizeBytes": metadata["sizeBytes"],
        "remoteTimestamp": metadata["remoteTimestamp"],
        "remoteSha1": metadata["remoteSha1"],
        "cachedBytes": False,
        "useDecision": metadata["useDecision"],
        "notes": metadata["notes"],
    }


def _review_icon_diagnostic(diagnostic: Diagnostic) -> Diagnostic:
    return Diagnostic(
        code=diagnostic.code,
        severity=diagnostic.severity,
        message=diagnostic.message,
        category=diagnostic.category,
        scope_kind=diagnostic.scope_kind,
        artifact_path=diagnostic.artifact_path,
        record_id=diagnostic.record_id,
        field_path=diagnostic.field_path,
        source_ids=diagnostic.source_ids,
        evidence=diagnostic.evidence,
        disposition="accepted-risk",
    )


def _same_page_dispositions(skills: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_canonical: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for skill in skills:
        by_canonical[str(skill["pageIdentity"]["canonicalTitle"]).casefold()].append(skill)
    dispositions: list[dict[str, Any]] = []
    for members in by_canonical.values():
        if len(members) <= 1:
            continue
        for skill in sorted(members, key=lambda item: int(item["id"]))[1:]:
            dispositions.append(
                {
                    "id": f"disposition:skill:{skill['id']}:same-page-variant",
                    "skillId": skill["id"],
                    "templateId": skill["templateId"],
                    "requestedTitle": skill["pageIdentity"]["requestedTitle"],
                    "kind": "same-page-variant",
                    "reason": "Multiple accepted seed IDs resolve to the same canonical page; each ID remains a separate catalog record.",
                    "reviewId": BASELINE_REVIEW_ID,
                    "provenance": {
                        "sourceIds": skill["provenance"]["sourceIds"],
                        "claimIds": [f"claim:skill:{skill['id']}:same-page-variant"],
                        "reviewIds": [BASELINE_REVIEW_ID],
                        "notes": None,
                    },
                }
            )
    return dispositions


def _disposition(
    seed: dict[str, Any],
    kind: str,
    reason: str,
    review_id: str,
) -> dict[str, Any]:
    return {
        "id": f"disposition:skill:{seed['skillId']}:{kind}",
        "skillId": int(seed["skillId"]),
        "templateId": int(seed["templateId"]),
        "requestedTitle": str(seed["requestedTitle"]),
        "kind": kind,
        "reason": reason,
        "reviewId": review_id,
        "provenance": {
            "sourceIds": [str(seed.get("sourceId", "source:unknown"))],
            "claimIds": [f"claim:skill:{seed['skillId']}:disposition"],
            "reviewIds": [review_id],
            "notes": None,
        },
    }


def _apply_split_groups(skills: list[dict[str, Any]]) -> None:
    by_base: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for skill in skills:
        base, mode = split_evidence_from_title(str(skill["name"]))
        if mode is not None:
            skill["_splitMode"] = mode
            by_base[base].append(skill)
    for members in by_base.values():
        modes = {skill["_splitMode"] for skill in members}
        if {"pve", "pvp"}.issubset(modes):
            group_id = f"split:skill:{min(int(skill['id']) for skill in members)}"
            for skill in members:
                skill["_splitGroupId"] = group_id


def _split_groups(skills: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for skill in skills:
        group_id = skill.pop("_splitGroupId", None)
        skill.pop("_splitMode", None)
        if group_id is not None:
            groups[str(group_id)].append(skill)
    result: list[dict[str, Any]] = []
    for group_id, members in sorted(groups.items()):
        group_members = []
        for skill in sorted(members, key=lambda item: int(item["id"])):
            _, mode = split_evidence_from_title(str(skill["name"]))
            if mode in {"pve", "pvp"}:
                group_members.append({"mode": mode, "skillId": skill["id"]})
        if len({member["mode"] for member in group_members}) < 2:
            ambiguity = "incomplete-counterpart"
        else:
            ambiguity = "none"
        result.append(
            {
                "id": group_id,
                "members": group_members,
                "ambiguity": ambiguity,
                "provenance": {
                    "sourceIds": sorted({source_id for skill in members for source_id in skill["provenance"]["sourceIds"]}),
                    "claimIds": [f"claim:{group_id}:mode-variant"],
                    "reviewIds": [BASELINE_REVIEW_ID],
                    "notes": "Split relationship inferred only from explicit PvE/PvP title suffix evidence.",
                },
            }
        )
    return result


def _excluded_disposition_count(dispositions: list[dict[str, Any]]) -> int:
    return sum(1 for disposition in dispositions if disposition["kind"] in {"excluded", "blocked"})


def _drop_nonsemantic(value: Any) -> Any:
    if isinstance(value, list):
        return [_drop_nonsemantic(item) for item in value]
    if isinstance(value, dict):
        return {
            key: _drop_nonsemantic(item)
            for key, item in value.items()
            if key
            not in {
                "generatedAt",
                "sourceRevisionTimestamp",
                "revisionId",
                "retrievedAt",
                "sourceTextDigest",
                "provenance",
                "reviewId",
            }
        }
    return value


def _diag(
    code: str,
    message: str,
    skill_id: int,
    source_id: str,
    *,
    severity: str,
    disposition: str,
) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity=severity,  # type: ignore[arg-type]
        message=message,
        category="schema-shape-error",
        scope_kind="record" if skill_id else "artifact",
        record_id=skill_id or None,
        source_ids=(source_id,),
        evidence=(Evidence("source", source_id, None),),
        disposition=disposition,  # type: ignore[arg-type]
    )
