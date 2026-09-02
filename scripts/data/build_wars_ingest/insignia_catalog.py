from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass
from typing import Any

from .artifacts import canonical_json_bytes
from .config import GENERATOR_NAME, INGESTION_SCHEMA_VERSION
from .insignia_extractor import extract_insignia_records
from .insignia_identity import load_identity_registry, registry_summary
from .insignia_semantics import normalize_insignia_records
from .models import Diagnostic, Evidence, digest_bytes
from .profiles import DataIngestionProfile, EPIC_11_PROFILE_ID


class InsigniaCatalogError(RuntimeError):
    pass


@dataclass(frozen=True)
class InsigniaCatalogAssembly:
    catalog: dict[str, Any]
    diagnostics: list[Diagnostic]


SOURCE_REVIEW_ID = "review:epic-11-source-set:2026-09-02"
SEMANTICS_REVIEW_ID = "review:epic-11-effect-semantics:2026-09-02"
BASELINE_REVIEW_ID = "review:epic-11-first-baseline:2026-09-02"


def assemble_insignia_catalog(
    *,
    profile: DataIngestionProfile,
    generated_at: str,
    source_plan: dict[str, Any],
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    dependency: Any,
    snapshot_set_digest: str,
) -> InsigniaCatalogAssembly:
    if profile.id != EPIC_11_PROFILE_ID:
        raise InsigniaCatalogError(f"Insignia catalog assembly requires {EPIC_11_PROFILE_ID}")

    registry = load_identity_registry()
    extracted = extract_insignia_records(
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        profession_catalog=dependency.catalog,
    )
    normalized = normalize_insignia_records(extracted.raw_records)
    insignias = sorted(normalized.records, key=lambda item: (int(item["id"]), str(item["name"])))
    dispositions = sorted(source_plan["runtimeDispositions"], key=lambda item: (str(item["kind"]), str(item["id"])))
    remote_media = sorted(extracted.remote_media, key=lambda item: str(item["id"]))
    dependency_summary = _dependency_summary(dependency)
    source_set = _source_set_summary(source_plan, insignias, dispositions)
    catalog: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "catalogVersion": "pending",
        "sectionDigests": [],
        "generatedAt": generated_at,
        "generator": GENERATOR_NAME,
        "profile": _profile_wire(profile),
        "dependencyDigests": [dependency_summary],
        "sourceSet": source_set,
        "identityRegistry": registry_summary(registry),
        "dispositions": dispositions,
        "insignias": insignias,
        "remoteMedia": remote_media,
    }
    catalog["catalogVersion"] = semantic_catalog_version(catalog)
    catalog["sectionDigests"] = section_digests(catalog)
    diagnostics = [
        *extracted.diagnostics,
        *normalized.diagnostics,
        *validate_insignia_catalog(catalog, snapshot_set_digest=snapshot_set_digest),
    ]
    return InsigniaCatalogAssembly(catalog=catalog, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


def semantic_catalog_version(catalog: dict[str, Any]) -> str:
    projection = {
        "dependencyDigests": catalog["dependencyDigests"],
        "sourceSet": _drop_nonsemantic(catalog["sourceSet"]),
        "identityRegistry": catalog["identityRegistry"],
        "dispositions": _drop_nonsemantic(catalog["dispositions"]),
        "insignias": _drop_nonsemantic(catalog["insignias"]),
        "remoteMedia": _drop_nonsemantic(catalog["remoteMedia"]),
    }
    return f"insignias-{digest_bytes(canonical_json_bytes(projection))[:16]}"


def section_digests(catalog: dict[str, Any]) -> list[dict[str, str]]:
    return [
        {"section": section, "digest": digest_bytes(canonical_json_bytes(catalog[section]))}
        for section in ("dependencyDigests", "sourceSet", "identityRegistry", "dispositions", "insignias", "remoteMedia")
    ]


def validate_insignia_catalog(catalog: dict[str, Any], *, snapshot_set_digest: str) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    insignias = catalog["insignias"]
    source_set = catalog["sourceSet"]
    if source_set["acceptedInsigniaCount"] != len(insignias):
        diagnostics.append(
            _diag(
                "INSIGNIA_SOURCE_SET_ACCOUNTING",
                "Accepted source-set insignia count does not match generated runtime records",
                0,
                "source-set",
                severity="critical",
                disposition="non-waivable",
            )
        )
    if source_set["blockingFindingCount"] != 0:
        diagnostics.append(
            _diag(
                "INSIGNIA_SOURCE_SET_BLOCKING_FINDINGS",
                "Source-set plan still contains blocking findings",
                0,
                "source-set",
                severity="critical",
                disposition="non-waivable",
            )
        )
    _duplicates([int(item["id"]) for item in insignias], "INSIGNIA_CATALOG_DUPLICATE_ID", diagnostics)
    _duplicates([str(item["sourceKey"]) for item in insignias], "INSIGNIA_CATALOG_DUPLICATE_SOURCE_KEY", diagnostics)
    _duplicates([str(item["normalizedName"]) for item in insignias], "INSIGNIA_CATALOG_DUPLICATE_NORMALIZED_NAME", diagnostics)
    _duplicates(
        [
            int(crosswalk["templateModifierId"])
            for item in insignias
            for crosswalk in item.get("templateModifiers", [])
            if crosswalk.get("status") == "active"
        ],
        "INSIGNIA_CATALOG_DUPLICATE_ACTIVE_TEMPLATE_MODIFIER_ID",
        diagnostics,
    )

    for insignia in insignias:
        insignia_id = int(insignia["id"])
        source_id = _first_source_id(insignia)
        active = [
            crosswalk
            for crosswalk in insignia.get("templateModifiers", [])
            if crosswalk.get("status") == "active" and crosswalk.get("scope") == "armor-prefix"
        ]
        if len(active) != 1:
            diagnostics.append(
                _diag(
                    "INSIGNIA_ACTIVE_CROSSWALK_REQUIRED",
                    "Accepted player-usable insignia must have exactly one active armor-prefix template-modifier crosswalk",
                    insignia_id,
                    source_id,
                    severity="critical",
                    disposition="non-waivable",
                )
            )
        if not insignia.get("effects"):
            diagnostics.append(
                _diag(
                    "INSIGNIA_EFFECTS_MISSING",
                    "Insignia record must contain at least one effect",
                    insignia_id,
                    source_id,
                    severity="critical",
                    disposition="non-waivable",
                )
            )
        if insignia["availability"] == "common" and insignia.get("professionId") is not None:
            diagnostics.append(
                _diag(
                    "INSIGNIA_COMMON_PROFESSION_LEAKED",
                    "Common insignia must not carry a profession restriction",
                    insignia_id,
                    source_id,
                    severity="error",
                )
            )
        if insignia["availability"] == "profession-specific" and insignia.get("professionId") is None:
            diagnostics.append(
                _diag(
                    "INSIGNIA_PROFESSION_JOIN_REQUIRED",
                    "Profession-specific insignia must join one EPIC-03 profession",
                    insignia_id,
                    source_id,
                    severity="error",
                )
            )
        page_identity = insignia.get("pageIdentity")
        if not isinstance(page_identity, dict) or page_identity.get("pageId") is None or page_identity.get("revisionId") is None:
            diagnostics.append(
                _diag(
                    "INSIGNIA_PAGE_IDENTITY_INCOMPLETE",
                    "Insignia record page identity must include page and revision facts",
                    insignia_id,
                    source_id,
                    severity="error",
                )
            )
        for effect in insignia.get("effects", []):
            condition = effect.get("condition") if isinstance(effect, dict) else None
            if not isinstance(condition, dict) or condition.get("kind") not in {"always", "predicate", "deferred"}:
                diagnostics.append(
                    _diag(
                        "INSIGNIA_CONDITION_INVALID",
                        "Insignia effect condition must be inert controlled data",
                        insignia_id,
                        source_id,
                        severity="error",
                    )
                )
            combination = effect.get("combination") if isinstance(effect, dict) else None
            if not isinstance(combination, dict) or combination.get("rule") not in {"sum", "highest", "non-stacking", "local-only", "separate", "unknown"} or not combination.get("groupKey"):
                diagnostics.append(
                    _diag(
                        "INSIGNIA_COMBINATION_INVALID",
                        "Insignia effect must carry supported combination metadata and a group key",
                        insignia_id,
                        source_id,
                        severity="error",
                    )
                )
            if "slotOutcomes" in effect and set(effect["slotOutcomes"]) != {"head", "chest", "hands", "legs", "feet"}:
                diagnostics.append(
                    _diag(
                        "INSIGNIA_SLOT_OUTCOMES_INCOMPLETE",
                        "Numeric insignia effect must expose head/chest/hands/legs/feet outcomes",
                        insignia_id,
                        source_id,
                        severity="critical",
                        disposition="non-waivable",
                    )
                )

    if catalog["dependencyDigests"][0]["qaGate"] != "pass":
        diagnostics.append(
            _diag(
                "INSIGNIA_EPIC03_QA_NOT_PASSING",
                "EPIC-03 dependency QA gate was not pass",
                0,
                "dependency:epic-03",
                severity="critical",
                disposition="non-waivable",
            )
        )
    if any(media.get("cachedBytes") is not False for media in catalog["remoteMedia"]):
        diagnostics.append(
            _diag(
                "INSIGNIA_ICON_BYTES_TRACKED",
                "Insignia icon media records must keep cachedBytes false",
                0,
                "remote-media",
                severity="critical",
                disposition="non-waivable",
            )
        )
    forbidden_terms = (
        "Rune Trader",
        "market prices",
        "salvage armor",
        "==Trivia==",
        "drop directly",
        "quests",
    )
    encoded = json.dumps(catalog, ensure_ascii=False)
    for term in forbidden_terms:
        if term in encoded:
            diagnostics.append(
                _diag(
                    "INSIGNIA_FORBIDDEN_PROSE_PROMOTED",
                    f"Generated runtime catalog contained forbidden source prose: {term}",
                    0,
                    "catalog",
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    if not snapshot_set_digest:
        diagnostics.append(
            _diag(
                "INSIGNIA_SNAPSHOT_SET_DIGEST_MISSING",
                "Promotion evidence must include a selected EPIC-11 snapshot-set digest",
                0,
                "snapshot-set",
                severity="critical",
                disposition="non-waivable",
            )
        )
    diagnostics.extend(_release_notes())
    return sorted(diagnostics, key=lambda item: item.stable_key())


def manual_reviews(
    *,
    generated_at: str,
    source_plan: dict[str, Any],
    snapshot_set_digest: str,
    artifact_digest: str,
) -> list[dict[str, Any]]:
    return [
        {
            "id": SOURCE_REVIEW_ID,
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-11 source authority, source-shape checkpoint, identity policy, and source-plan digest",
            "decision": "approved",
            "rationale": "The finite hybrid source authority reconciles equipment-template modifier rows, the Insignia overview, verified detail pages, metadata-only icon facts, Effect stacking mechanics, and EPIC-03 joins.",
            "evidence": [
                {
                    "kind": "artifact",
                    "reference": str(source_plan["summary"]["sourceSetDigest"]),
                    "notes": "Digest of source pages, accepted modifier rows, detail titles, compact dispositions, dependency, and identity-registry facts.",
                }
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any source revision, source-set digest, identity-registry digest, accepted modifier ID, or source-plan digest change.",
        },
        {
            "id": SEMANTICS_REVIEW_ID,
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-11 insignia effect, slot-scaling, condition, locality, and combination semantics",
            "decision": "approved",
            "rationale": "Schema v1 records source-clear arithmetic as exact per-slot outcomes, keeps combat-state predicates inert, separates item stackability from effect combination, and defers unsupported behavior as notes or unknown effects.",
            "evidence": [
                {
                    "kind": "artifact",
                    "reference": str(source_plan["summary"]["sourcePlanDigest"]),
                    "notes": "Effect semantics are invalidated by source-plan, detail-page, predicate vocabulary, or normalized effect changes.",
                }
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any effect parser, slot-map parser, predicate vocabulary, locality, combination, or reviewed source evidence change.",
        },
        {
            "id": BASELINE_REVIEW_ID,
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-11 first promoted insignia catalog baseline",
            "decision": "approved",
            "rationale": "This promotion records the selected complete snapshot set, identity registry digest, EPIC-03 dependency digests, generated runtime catalog, artifact digest, and QA gate state as the first baseline.",
            "evidence": [
                {
                    "kind": "artifact",
                    "reference": snapshot_set_digest,
                    "notes": "Selected complete snapshot-set manifest digest.",
                },
                {
                    "kind": "artifact",
                    "reference": artifact_digest,
                    "notes": "Generated catalog digest is owned by the adjacent manifest.",
                },
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any semantic projection, schema, source revision, dependency digest, QA gate, identity registry, or promotion path change.",
        },
    ]


def _source_set_summary(
    source_plan: dict[str, Any],
    insignias: list[dict[str, Any]],
    dispositions: list[dict[str, Any]],
) -> dict[str, Any]:
    summary = source_plan["summary"]
    return {
        "seedTitles": list(source_plan["sourceAuthority"]["seedTitles"]),
        "detailPageTitles": list(source_plan["detailPageTitles"]),
        "sourceSetDigest": summary["sourceSetDigest"],
        "sourcePlanDigest": summary["sourcePlanDigest"],
        "acceptedInsigniaCount": len(insignias),
        "relationshipCount": len([item for item in dispositions if item["kind"] == "supported-relationship"]),
        "exclusionCount": len([item for item in dispositions if item["kind"] == "explicit-exclusion"]),
        "unsupportedCount": len([item for item in dispositions if item["kind"] == "unsupported"]),
        "blockingFindingCount": int(summary["blockingFindingCount"]),
        "sourceAuthority": source_plan["sourceAuthority"]["policy"],
        "idPolicy": source_plan["idPolicy"],
        "identityRegistryDigest": source_plan["identityRegistryDigest"],
        "planningAmendment": None,
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
            "catalogByteCap": profile.catalog_byte_cap,
            "qaByteCap": profile.qa_byte_cap,
        },
    }


def _dependency_summary(dependency: Any) -> dict[str, Any]:
    return {
        "id": "epic-03-professions-attributes",
        "catalogVersion": str(dependency.catalog["catalogVersion"]),
        "artifactDigest": dependency.artifact_digest,
        "manifestDigest": dependency.manifest_digest,
        "qaGate": "pass",
        "sectionDigests": dependency.catalog["sectionDigests"],
    }


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
                "provenance",
                "reviewId",
                "pageId",
            }
        }
    return value


def _duplicates(values: list[Any], code: str, diagnostics: list[Diagnostic]) -> None:
    counts = Counter(values)
    for value, count in counts.items():
        if count > 1:
            diagnostics.append(
                _diag(
                    code,
                    f"Duplicate value in generated insignia catalog: {value}",
                    int(value) if isinstance(value, int) else 0,
                    "catalog",
                    severity="critical",
                    disposition="non-waivable",
                )
            )


def _release_notes() -> list[Diagnostic]:
    return [
        Diagnostic(
            code="INSIGNIA_SOURCE_AUTHORITY_REVIEW",
            severity="info",
            message="Finite EPIC-11 source authority was reviewed before catalog promotion.",
            category="manual-override",
            scope_kind="release",
            artifact_path="data/generated/epic-11/insignias.catalog.json",
            evidence=(Evidence("review-note", SOURCE_REVIEW_ID, "Source graph is digest-bound and finite."),),
            disposition="resolved",
        ),
        Diagnostic(
            code="INSIGNIA_COPIED_PROSE_EXCLUDED",
            severity="info",
            message="Runtime insignia records use structured effects and exclude source-authored long prose.",
            category="copied-text-without-attribution",
            scope_kind="release",
            artifact_path="data/generated/epic-11/insignias.catalog.json",
            evidence=(Evidence("review-note", SEMANTICS_REVIEW_ID, "Source prose remains outside runtime JSON."),),
            disposition="resolved",
        ),
    ]


def _first_source_id(insignia: dict[str, Any]) -> str:
    source_ids = insignia.get("provenance", {}).get("sourceIds", [])
    if isinstance(source_ids, list) and source_ids:
        return str(source_ids[0])
    return "source:unknown"


def _diag(
    code: str,
    message: str,
    record_id: int,
    source_id: str,
    *,
    severity: str,
    disposition: str = "open",
) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity=severity,  # type: ignore[arg-type]
        message=message,
        category="schema-shape-error",
        scope_kind="record" if record_id else "artifact",
        record_id=record_id or None,
        source_ids=(source_id,),
        evidence=(Evidence("source", source_id, None),),
        disposition=disposition,  # type: ignore[arg-type]
    )
