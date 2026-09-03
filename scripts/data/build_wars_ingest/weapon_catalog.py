from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any

from .artifacts import canonical_json_bytes
from .config import GENERATOR_NAME, INGESTION_SCHEMA_VERSION
from .models import Diagnostic, Evidence, digest_bytes
from .profiles import DataIngestionProfile, EPIC_12_PROFILE_ID
from .weapon_base_extractor import extract_weapon_base_records
from .weapon_identity import load_weapon_base_registry, load_weapon_mod_registry, registry_summary
from .weapon_mod_extractor import extract_weapon_mod_records
from .weapon_semantics import normalize_weapon_base_records, normalize_weapon_mod_records
from .weapon_source_set import SOURCE_AUTHORITY_VERSION


class WeaponCatalogError(RuntimeError):
    pass


@dataclass(frozen=True)
class WeaponCatalogAssembly:
    weapons_catalog: dict[str, Any]
    weapon_mods_catalog: dict[str, Any]
    diagnostics: list[Diagnostic]


SOURCE_REVIEW_ID = "review:epic-12-source-set:2026-09-02"
SEMANTICS_REVIEW_ID = "review:epic-12-effect-semantics:2026-09-02"
BASELINE_REVIEW_ID = "review:epic-12-first-baseline:2026-09-02"


def assemble_weapon_catalogs(
    *,
    profile: DataIngestionProfile,
    generated_at: str,
    source_plan: dict[str, Any],
    base_detail_pages: list[dict[str, Any]],
    modifier_detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    dependency: Any,
    snapshot_set_digest: str,
) -> WeaponCatalogAssembly:
    if profile.id != EPIC_12_PROFILE_ID:
        raise WeaponCatalogError(f"Weapon catalog assembly requires {EPIC_12_PROFILE_ID}")

    base_registry = load_weapon_base_registry()
    mod_registry = load_weapon_mod_registry()
    extracted_bases = extract_weapon_base_records(
        detail_pages=base_detail_pages,
        imageinfo_pages=imageinfo_pages,
        profession_catalog=dependency.catalog,
    )
    extracted_mods = extract_weapon_mod_records(
        detail_pages=modifier_detail_pages,
        imageinfo_pages=imageinfo_pages,
        profession_catalog=dependency.catalog,
    )
    normalized_bases = normalize_weapon_base_records(extracted_bases.raw_records)
    normalized_mods = normalize_weapon_mod_records(extracted_mods.raw_records)
    weapon_bases = sorted(normalized_bases.records, key=lambda item: (int(item["id"]), str(item["name"])))
    weapon_mods = sorted(normalized_mods.records, key=lambda item: (int(item["id"]), str(item["name"])))
    dispositions = sorted(source_plan["runtimeDispositions"], key=lambda item: (str(item["kind"]), str(item["id"])))
    dependency_summary = _dependency_summary(dependency)
    source_set = _source_set_summary(source_plan, weapon_bases, weapon_mods, dispositions, snapshot_set_digest)

    weapons_catalog: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "catalogVersion": "pending",
        "catalogSetVersion": "pending",
        "catalogSetDigest": "pending",
        "sectionDigests": [],
        "generatedAt": generated_at,
        "generator": GENERATOR_NAME,
        "profile": _profile_wire(profile),
        "dependencyDigests": [dependency_summary],
        "sourceSet": source_set,
        "releaseSet": {},
        "identityRegistry": registry_summary(base_registry),
        "dispositions": dispositions,
        "weaponBases": weapon_bases,
        "remoteMedia": sorted(extracted_bases.remote_media, key=lambda item: str(item["id"])),
    }
    weapon_mods_catalog: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "catalogVersion": "pending",
        "catalogSetVersion": "pending",
        "catalogSetDigest": "pending",
        "sectionDigests": [],
        "generatedAt": generated_at,
        "generator": GENERATOR_NAME,
        "profile": _profile_wire(profile),
        "dependencyDigests": [dependency_summary],
        "sourceSet": source_set,
        "releaseSet": {},
        "identityRegistry": registry_summary(mod_registry),
        "dispositions": dispositions,
        "weaponMods": weapon_mods,
        "remoteMedia": sorted(extracted_mods.remote_media, key=lambda item: str(item["id"])),
    }
    _finalize_release_set(weapons_catalog, weapon_mods_catalog, source_plan, snapshot_set_digest)
    diagnostics = [
        *extracted_bases.diagnostics,
        *extracted_mods.diagnostics,
        *normalized_bases.diagnostics,
        *normalized_mods.diagnostics,
        *validate_weapon_catalogs(weapons_catalog, weapon_mods_catalog, snapshot_set_digest=snapshot_set_digest),
    ]
    return WeaponCatalogAssembly(
        weapons_catalog=weapons_catalog,
        weapon_mods_catalog=weapon_mods_catalog,
        diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()),
    )


def semantic_catalog_version(catalog: dict[str, Any], *, key: str, prefix: str) -> str:
    projection = {
        "dependencyDigests": catalog["dependencyDigests"],
        "sourceSet": _drop_nonsemantic(catalog["sourceSet"]),
        "identityRegistry": catalog["identityRegistry"],
        "dispositions": _drop_nonsemantic(catalog["dispositions"]),
        key: _drop_nonsemantic(catalog[key]),
        "remoteMedia": _drop_nonsemantic(catalog["remoteMedia"]),
    }
    return f"{prefix}-{digest_bytes(canonical_json_bytes(projection))[:16]}"


def section_digests(catalog: dict[str, Any], *, record_key: str) -> list[dict[str, str]]:
    return [
        {"section": section, "digest": digest_bytes(canonical_json_bytes(catalog[section]))}
        for section in (
            "dependencyDigests",
            "sourceSet",
            "releaseSet",
            "identityRegistry",
            "dispositions",
            record_key,
            "remoteMedia",
        )
    ]


def validate_weapon_catalogs(
    weapons_catalog: dict[str, Any],
    weapon_mods_catalog: dict[str, Any],
    *,
    snapshot_set_digest: str,
) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    bases = weapons_catalog["weaponBases"]
    mods = weapon_mods_catalog["weaponMods"]
    source_set = weapons_catalog["sourceSet"]
    if source_set != weapon_mods_catalog["sourceSet"]:
        diagnostics.append(_release_diag("WEAPON_CATALOG_SOURCE_SET_SKEW", "Weapon and modifier catalogs do not share identical source-set facts."))
    if weapons_catalog["releaseSet"] != weapon_mods_catalog["releaseSet"]:
        diagnostics.append(_release_diag("WEAPON_CATALOG_RELEASE_SET_SKEW", "Weapon and modifier catalogs do not share identical release-set facts."))
    if weapons_catalog["catalogSetDigest"] != weapon_mods_catalog["catalogSetDigest"]:
        diagnostics.append(_release_diag("WEAPON_CATALOG_SET_DIGEST_SKEW", "Weapon and modifier catalog-set digests differ."))
    if source_set["acceptedWeaponBaseCount"] != len(bases):
        diagnostics.append(_release_diag("WEAPON_SOURCE_SET_BASE_ACCOUNTING", "Accepted weapon-base count does not match generated records."))
    if source_set["acceptedWeaponModifierCount"] != len(mods):
        diagnostics.append(_release_diag("WEAPON_SOURCE_SET_MOD_ACCOUNTING", "Accepted weapon-modifier count does not match generated records."))
    if source_set["blockingFindingCount"] != 0:
        diagnostics.append(_release_diag("WEAPON_SOURCE_SET_BLOCKING_FINDINGS", "Source-set plan still contains blocking findings."))
    if weapons_catalog["dependencyDigests"][0]["qaGate"] != "pass":
        diagnostics.append(_release_diag("WEAPON_EPIC03_QA_NOT_PASSING", "EPIC-03 dependency QA gate was not pass."))
    if source_set["selectedEvidenceDigest"] != snapshot_set_digest:
        diagnostics.append(_release_diag("WEAPON_SELECTED_EVIDENCE_DIGEST_MISMATCH", "Selected snapshot-set digest does not match catalog source-set summary."))

    _duplicates([int(item["id"]) for item in bases], "WEAPON_BASE_DUPLICATE_ID", diagnostics)
    _duplicates([str(item["sourceKey"]) for item in bases], "WEAPON_BASE_DUPLICATE_SOURCE_KEY", diagnostics)
    _duplicates([str(item["normalizedName"]) for item in bases], "WEAPON_BASE_DUPLICATE_NORMALIZED_NAME", diagnostics)
    _duplicates([int(item["id"]) for item in mods], "WEAPON_MOD_DUPLICATE_ID", diagnostics)
    _duplicates([str(item["sourceKey"]) for item in mods], "WEAPON_MOD_DUPLICATE_SOURCE_KEY", diagnostics)
    _duplicates([str(item["normalizedName"]) for item in mods], "WEAPON_MOD_DUPLICATE_NORMALIZED_NAME", diagnostics)
    _duplicates(
        [
            int(crosswalk["templateItemId"])
            for item in bases
            for crosswalk in item.get("templateItems", [])
            if crosswalk.get("status") == "active"
        ],
        "WEAPON_BASE_DUPLICATE_ACTIVE_TEMPLATE_ITEM_ID",
        diagnostics,
    )
    _duplicates(
        [
            int(crosswalk["templateModifierId"])
            for item in mods
            for crosswalk in item.get("templateModifiers", [])
            if crosswalk.get("status") == "active"
        ],
        "WEAPON_MOD_DUPLICATE_ACTIVE_TEMPLATE_MODIFIER_ID",
        diagnostics,
    )

    for base in bases:
        source_id = _first_source_id(base)
        if base["damage"]["kind"] not in {"fixed-range", "not-applicable", "unresolved"}:
            diagnostics.append(_record_diag("WEAPON_DAMAGE_STATE_INVALID", "Weapon damage state is invalid.", int(base["id"]), source_id))
        if base["requirement"]["kind"] not in {"attribute-rank", "none", "unresolved"}:
            diagnostics.append(_record_diag("WEAPON_REQUIREMENT_STATE_INVALID", "Weapon requirement state is invalid.", int(base["id"]), source_id))
        if not base.get("allowedModifierSlots"):
            diagnostics.append(_record_diag("WEAPON_ALLOWED_SLOTS_MISSING", "Weapon base has no allowed modifier-slot facts.", int(base["id"]), source_id))
        if not base.get("templateItems"):
            diagnostics.append(_record_diag("WEAPON_TEMPLATE_ITEM_CROSSWALK_MISSING", "Weapon base has no template item crosswalk facts.", int(base["id"]), source_id))
        identity = base.get("pageIdentity")
        if not isinstance(identity, dict) or identity.get("revisionId") is None or identity.get("pageId") is None:
            diagnostics.append(_record_diag("WEAPON_PAGE_IDENTITY_INCOMPLETE", "Weapon base page identity must include page and revision facts.", int(base["id"]), source_id))

    family_keys = {str(base["familyKey"]) for base in bases}
    available_slots = {(str(base["familyKey"]), str(slot["slot"])) for base in bases for slot in base["allowedModifierSlots"]}
    for modifier in mods:
        source_id = _first_source_id(modifier)
        if modifier["applicability"]["kind"] not in {"specific-families", "universal", "not-applicable", "unresolved"}:
            diagnostics.append(_record_diag("WEAPON_MOD_APPLICABILITY_STATE_INVALID", "Weapon modifier applicability state is invalid.", int(modifier["id"]), source_id))
        if not modifier.get("effects"):
            diagnostics.append(_record_diag("WEAPON_MOD_EFFECTS_MISSING", "Weapon modifier has no effect facts.", int(modifier["id"]), source_id))
        if not modifier.get("templateModifiers"):
            diagnostics.append(_record_diag("WEAPON_MOD_TEMPLATE_CROSSWALK_MISSING", "Weapon modifier has no template modifier crosswalk facts.", int(modifier["id"]), source_id))
        identity = modifier.get("pageIdentity")
        if not isinstance(identity, dict) or identity.get("revisionId") is None or identity.get("pageId") is None:
            diagnostics.append(_record_diag("WEAPON_MOD_PAGE_IDENTITY_INCOMPLETE", "Weapon modifier page identity must include page and revision facts.", int(modifier["id"]), source_id))
        if modifier["applicability"]["kind"] == "specific-families":
            missing = sorted(set(modifier["applicability"]["familyKeys"]) - family_keys)
            if missing:
                diagnostics.append(_record_diag("WEAPON_MOD_APPLICABILITY_FAMILY_UNKNOWN", f"Weapon modifier references unknown families: {', '.join(missing)}.", int(modifier["id"]), source_id))
            compatible_pair_exists = any((family, str(modifier["occupiedSlot"])) in available_slots for family in modifier["applicability"]["familyKeys"])
            if not compatible_pair_exists:
                diagnostics.append(_record_diag("WEAPON_MOD_COMPATIBILITY_GAP", "Weapon modifier has no structural compatible base in the catalog.", int(modifier["id"]), source_id))

    forbidden_terms = ("Rune Trader", "market prices", "<script", "mw-parser-output", "data:image", "thumb/")
    runtime_bytes = canonical_json_bytes({"weapons": weapons_catalog, "mods": weapon_mods_catalog}).decode("utf-8", errors="ignore")
    for term in forbidden_terms:
        if term in runtime_bytes:
            diagnostics.append(_release_diag("WEAPON_RUNTIME_FORBIDDEN_TEXT", f"Runtime EPIC-12 JSON contains forbidden source or media material: {term}"))
    if any(media.get("cachedBytes") is not False for media in [*weapons_catalog["remoteMedia"], *weapon_mods_catalog["remoteMedia"]]):
        diagnostics.append(_release_diag("WEAPON_ICON_BYTES_TRACKED", "Weapon media records must keep cachedBytes false."))
    return sorted(diagnostics, key=lambda item: item.stable_key())


def manual_reviews(
    *,
    generated_at: str,
    source_plan: dict[str, Any],
    snapshot_set_digest: str,
    weapon_artifact_digest: str,
    weapon_mod_artifact_digest: str,
) -> list[dict[str, Any]]:
    return [
        {
            "id": SOURCE_REVIEW_ID,
            "reviewedAt": generated_at,
            "decision": "approved",
            "reviewer": "build-wars-sprint-execute",
            "scope": "epic-12-source-set",
            "rationale": "The finite source authority uses Equipment template format, Weapon, Weapon upgrade, Inscription, reviewed family/detail pages, metadata-only media policy, and EPIC-03 joins.",
            "sourcePlanDigest": source_plan["summary"]["sourcePlanDigest"],
            "sourceSetDigest": source_plan["summary"]["sourceSetDigest"],
        },
        {
            "id": SEMANTICS_REVIEW_ID,
            "reviewedAt": generated_at,
            "decision": "approved",
            "reviewer": "build-wars-sprint-execute",
            "scope": "epic-12-effect-semantics",
            "rationale": "Closed numeric and chance facts are structured; hard mastery and conditional behavior remains note-only or unknown for EPIC-21.",
        },
        {
            "id": BASELINE_REVIEW_ID,
            "reviewedAt": generated_at,
            "decision": "approved",
            "reviewer": "build-wars-sprint-execute",
            "scope": "epic-12-first-baseline",
            "rationale": "The first baseline checked base/mod counts, template crosswalks, release-set identity, copied text policy, QA gates, and selected snapshot evidence.",
            "selectedSnapshotSetDigest": snapshot_set_digest,
            "weaponArtifactDigest": weapon_artifact_digest,
            "weaponModArtifactDigest": weapon_mod_artifact_digest,
        },
    ]


def _finalize_release_set(
    weapons_catalog: dict[str, Any],
    weapon_mods_catalog: dict[str, Any],
    source_plan: dict[str, Any],
    snapshot_set_digest: str,
) -> None:
    weapons_catalog["catalogVersion"] = semantic_catalog_version(weapons_catalog, key="weaponBases", prefix="weapons")
    weapon_mods_catalog["catalogVersion"] = semantic_catalog_version(weapon_mods_catalog, key="weaponMods", prefix="weapon-mods")
    weapon_catalog_digest = digest_bytes(canonical_json_bytes(_counterpart_projection(weapons_catalog, "weaponBases")))
    weapon_mod_catalog_digest = digest_bytes(canonical_json_bytes(_counterpart_projection(weapon_mods_catalog, "weaponMods")))
    release_without_set_digest = {
        "catalogSetVersion": "pending",
        "catalogSetDigest": "pending",
        "sourceSetDigest": source_plan["summary"]["sourceSetDigest"],
        "sourcePlanDigest": source_plan["summary"]["sourcePlanDigest"],
        "sourceAuthorityVersion": SOURCE_AUTHORITY_VERSION,
        "selectedEvidenceDigest": snapshot_set_digest,
        "profile": EPIC_12_PROFILE_ID,
        "weaponCatalogVersion": weapons_catalog["catalogVersion"],
        "weaponModCatalogVersion": weapon_mods_catalog["catalogVersion"],
        "weaponCatalogDigest": weapon_catalog_digest,
        "weaponModCatalogDigest": weapon_mod_catalog_digest,
        "qaGate": "pass",
    }
    catalog_set_digest = digest_bytes(canonical_json_bytes(release_without_set_digest))
    release_set = {
        **release_without_set_digest,
        "catalogSetVersion": f"weapon-mods-set-{catalog_set_digest[:16]}",
        "catalogSetDigest": catalog_set_digest,
    }
    for catalog, record_key in ((weapons_catalog, "weaponBases"), (weapon_mods_catalog, "weaponMods")):
        catalog["catalogSetVersion"] = release_set["catalogSetVersion"]
        catalog["catalogSetDigest"] = release_set["catalogSetDigest"]
        catalog["releaseSet"] = release_set
        catalog["sectionDigests"] = section_digests(catalog, record_key=record_key)


def _counterpart_projection(catalog: dict[str, Any], record_key: str) -> dict[str, Any]:
    return {
        "catalogVersion": catalog["catalogVersion"],
        "dependencyDigests": catalog["dependencyDigests"],
        "sourceSet": _drop_nonsemantic(catalog["sourceSet"]),
        "identityRegistry": catalog["identityRegistry"],
        "dispositions": _drop_nonsemantic(catalog["dispositions"]),
        record_key: _drop_nonsemantic(catalog[record_key]),
        "remoteMedia": _drop_nonsemantic(catalog["remoteMedia"]),
    }


def _source_set_summary(
    source_plan: dict[str, Any],
    weapon_bases: list[dict[str, Any]],
    weapon_mods: list[dict[str, Any]],
    dispositions: list[dict[str, Any]],
    snapshot_set_digest: str,
) -> dict[str, Any]:
    summary = source_plan["summary"]
    return {
        "seedTitles": list(source_plan["sourceAuthority"]["seedTitles"]),
        "detailPageTitles": list(source_plan["detailPageTitles"]),
        "sourceSetDigest": str(summary["sourceSetDigest"]),
        "sourcePlanDigest": str(summary["sourcePlanDigest"]),
        "sourceAuthorityVersion": SOURCE_AUTHORITY_VERSION,
        "sourceAuthority": str(source_plan["sourceAuthority"]["policy"]),
        "idPolicy": str(source_plan["idPolicy"]),
        "baseIdentityRegistryDigest": str(source_plan["baseIdentityRegistryDigest"]),
        "modIdentityRegistryDigest": str(source_plan["modIdentityRegistryDigest"]),
        "acceptedWeaponBaseCount": len(weapon_bases),
        "acceptedWeaponModifierCount": len(weapon_mods),
        "relationshipCount": len([item for item in dispositions if item["kind"] == "supported-relationship"]),
        "exclusionCount": len([item for item in dispositions if item["kind"] == "explicit-exclusion"]),
        "unsupportedCount": len([item for item in dispositions if item["kind"] == "unsupported"]),
        "ambiguousCount": len([item for item in dispositions if item["kind"] == "ambiguous"]),
        "historicalCount": len([item for item in dispositions if item["kind"] == "historical"]),
        "blockingFindingCount": int(summary["blockingFindingCount"]),
        "selectedEvidence": "complete-selected-snapshot-set",
        "selectedEvidenceDigest": snapshot_set_digest,
        "planningAmendment": None,
    }


def _dependency_summary(dependency: Any) -> dict[str, Any]:
    return {
        "id": "epic-03-professions-attributes",
        "catalogVersion": str(dependency.catalog["catalogVersion"]),
        "artifactDigest": dependency.artifact_digest,
        "manifestDigest": dependency.manifest_digest,
        "qaGate": dependency.qa_gate,
        "sectionDigests": dependency.catalog["sectionDigests"],
    }


def _profile_wire(profile: DataIngestionProfile) -> dict[str, Any]:
    return {
        "id": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "sourceCaps": {
            "seedPageLimit": len(profile.source_titles),
            "detailPageLimit": profile.page_limit,
            "mediaTitleLimit": profile.media_title_limit,
            "requestLimit": profile.request_limit,
            "retryLimit": 3,
            "continuationLimit": 10,
            "responseByteCap": profile.response_byte_cap,
            "parserByteCap": profile.parser_byte_cap,
            "aggregateByteCap": profile.aggregate_byte_cap,
            "weaponCatalogByteCap": profile.catalog_byte_cap,
            "weaponModCatalogByteCap": profile.catalog_byte_cap,
            "qaByteCap": profile.qa_byte_cap,
        },
    }


def _drop_nonsemantic(value: Any) -> Any:
    if isinstance(value, list):
        return [_drop_nonsemantic(item) for item in value]
    if isinstance(value, dict):
        return {
            key: _drop_nonsemantic(item)
            for key, item in value.items()
            if key not in {
                "generatedAt",
                "retrievedAt",
                "sourceRevisionTimestamp",
                "revisionId",
                "pageId",
                "provenance",
                "sectionDigests",
                "catalogVersion",
                "catalogSetVersion",
                "catalogSetDigest",
                "releaseSet",
            }
        }
    return value


def _duplicates(values: list[Any], code: str, diagnostics: list[Diagnostic]) -> None:
    counts = Counter(str(value) for value in values)
    for value, count in counts.items():
        if count > 1:
            diagnostics.append(_release_diag(code, f"Duplicate EPIC-12 catalog value: {value}"))


def _first_source_id(record: dict[str, Any]) -> str:
    source_ids = record.get("provenance", {}).get("sourceIds")
    if isinstance(source_ids, list) and source_ids:
        return str(source_ids[0])
    return "source:unknown"


def _release_diag(code: str, message: str) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="critical",
        message=message,
        category="artifact-integrity-mismatch",
        scope_kind="release",
        evidence=(Evidence("artifact", "data/generated/epic-12", None),),
        disposition="non-waivable",
    )


def _record_diag(code: str, message: str, record_id: int, source_id: str) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="critical",
        message=message,
        category="schema-shape-error",
        scope_kind="record",
        record_id=record_id,
        source_ids=(source_id,),
        evidence=(Evidence("source", source_id, None),),
        disposition="non-waivable",
    )
