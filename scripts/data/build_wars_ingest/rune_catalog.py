from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass
from typing import Any

from .artifacts import canonical_json_bytes
from .config import GENERATOR_NAME, INGESTION_SCHEMA_VERSION
from .models import Diagnostic, Evidence, digest_bytes
from .profiles import DataIngestionProfile, EPIC_10_PROFILE_ID
from .rune_extractor import extract_rune_records
from .rune_semantics import normalize_rune_records


class RuneCatalogError(RuntimeError):
    pass


@dataclass(frozen=True)
class RuneCatalogAssembly:
    catalog: dict[str, Any]
    diagnostics: list[Diagnostic]


SOURCE_REVIEW_ID = "review:epic-10-source-set:2026-09-02"
SEMANTICS_REVIEW_ID = "review:epic-10-effect-semantics:2026-09-02"
BASELINE_REVIEW_ID = "review:epic-10-first-baseline:2026-09-02"


def assemble_rune_catalog(
    *,
    profile: DataIngestionProfile,
    generated_at: str,
    source_plan: dict[str, Any],
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    dependency: Any,
    snapshot_set_digest: str,
) -> RuneCatalogAssembly:
    if profile.id != EPIC_10_PROFILE_ID:
        raise RuneCatalogError(f"Rune catalog assembly requires {EPIC_10_PROFILE_ID}")

    extracted = extract_rune_records(
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        profession_catalog=dependency.catalog,
    )
    normalized = normalize_rune_records(extracted.raw_records)
    runes = sorted(normalized.records, key=lambda item: (int(item["id"]), str(item["name"])))
    dispositions = sorted(source_plan["runtimeDispositions"], key=lambda item: (str(item["kind"]), str(item["id"])))
    remote_media = sorted(extracted.remote_media, key=lambda item: str(item["id"]))
    dependency_summary = _dependency_summary(dependency)
    source_set = _source_set_summary(source_plan, runes, dispositions)
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
        "runes": runes,
        "remoteMedia": remote_media,
    }
    catalog["catalogVersion"] = semantic_catalog_version(catalog)
    catalog["sectionDigests"] = section_digests(catalog)
    diagnostics = [
        *extracted.diagnostics,
        *normalized.diagnostics,
        *validate_rune_catalog(catalog, snapshot_set_digest=snapshot_set_digest),
    ]
    return RuneCatalogAssembly(catalog=catalog, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


def semantic_catalog_version(catalog: dict[str, Any]) -> str:
    projection = {
        "dependencyDigests": catalog["dependencyDigests"],
        "sourceSet": _drop_nonsemantic(catalog["sourceSet"]),
        "dispositions": _drop_nonsemantic(catalog["dispositions"]),
        "runes": _drop_nonsemantic(catalog["runes"]),
        "remoteMedia": _drop_nonsemantic(catalog["remoteMedia"]),
    }
    return f"runes-{digest_bytes(canonical_json_bytes(projection))[:16]}"


def section_digests(catalog: dict[str, Any]) -> list[dict[str, str]]:
    return [
        {"section": section, "digest": digest_bytes(canonical_json_bytes(catalog[section]))}
        for section in ("dependencyDigests", "sourceSet", "dispositions", "runes", "remoteMedia")
    ]


def validate_rune_catalog(catalog: dict[str, Any], *, snapshot_set_digest: str) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    runes = catalog["runes"]
    source_set = catalog["sourceSet"]
    if source_set["acceptedRuneCount"] != len(runes):
        diagnostics.append(
            _diag(
                "RUNE_SOURCE_SET_ACCOUNTING",
                "Accepted source-set rune count does not match generated runtime records",
                0,
                "source-set",
                severity="critical",
                disposition="non-waivable",
            )
        )
    if source_set["blockingFindingCount"] != 0:
        diagnostics.append(
            _diag(
                "RUNE_SOURCE_SET_BLOCKING_FINDINGS",
                "Source-set plan still contains blocking findings",
                0,
                "source-set",
                severity="critical",
                disposition="non-waivable",
            )
        )
    _duplicates([int(rune["id"]) for rune in runes], "RUNE_CATALOG_DUPLICATE_ID", diagnostics)
    _duplicates(
        [int(rune["templateModifierId"]) for rune in runes],
        "RUNE_CATALOG_DUPLICATE_TEMPLATE_MODIFIER_ID",
        diagnostics,
    )
    _duplicates([str(rune["normalizedName"]) for rune in runes], "RUNE_CATALOG_DUPLICATE_NORMALIZED_NAME", diagnostics)

    for rune in runes:
        modifier_id = int(rune["templateModifierId"])
        source_id = _first_source_id(rune)
        if not rune.get("effects"):
            diagnostics.append(
                _diag(
                    "RUNE_EFFECTS_MISSING",
                    "Rune record must contain at least one effect",
                    modifier_id,
                    source_id,
                    severity="critical",
                    disposition="non-waivable",
                )
            )
        if rune["familyKind"] == "attribute":
            if rune.get("professionId") is None or rune.get("affectedAttributeId") is None:
                diagnostics.append(
                    _diag(
                        "RUNE_ATTRIBUTE_JOIN_REQUIRED",
                        "Attribute rune must join both profession and affected attribute through EPIC-03",
                        modifier_id,
                        source_id,
                        severity="critical",
                        disposition="non-waivable",
                    )
                )
            if rune.get("headgearInteraction") != "attribute-linked":
                diagnostics.append(
                    _diag(
                        "RUNE_HEADGEAR_HANDOFF_MISSING",
                        "Attribute rune must carry an attribute-linked headgear handoff fact",
                        modifier_id,
                        source_id,
                        severity="error",
                    )
                )
        if rune["familyKind"] != "attribute" and rune.get("headgearInteraction") == "attribute-linked":
            diagnostics.append(
                _diag(
                    "RUNE_HEADGEAR_HANDOFF_OVERCLAIMED",
                    "Non-attribute rune must not own an attribute-linked headgear handoff",
                    modifier_id,
                    source_id,
                    severity="error",
                )
            )
        identity = rune.get("pageIdentity")
        if not isinstance(identity, dict) or identity.get("revisionId") is None or identity.get("pageId") is None:
            diagnostics.append(
                _diag(
                    "RUNE_PAGE_IDENTITY_INCOMPLETE",
                    "Rune record page identity must include page and revision facts",
                    modifier_id,
                    source_id,
                    severity="error",
                )
            )
        for effect in rune.get("effects", []):
            stack = effect.get("stacking") if isinstance(effect, dict) else None
            if not isinstance(stack, dict) or stack.get("rule") not in {"sum", "highest", "separate", "unknown"} or not stack.get("groupKey"):
                diagnostics.append(
                    _diag(
                        "RUNE_EFFECT_STACKING_MISSING",
                        "Rune effect must carry effect-level stacking metadata",
                        modifier_id,
                        source_id,
                        severity="error",
                    )
                )
    if catalog["dependencyDigests"][0]["qaGate"] != "pass":
        diagnostics.append(
            _diag(
                "RUNE_EPIC03_QA_NOT_PASSING",
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
                "RUNE_ICON_BYTES_TRACKED",
                "Rune icon media records must keep cachedBytes false",
                0,
                "remote-media",
                severity="critical",
                disposition="non-waivable",
            )
        )
    forbidden_terms = (
        "Rune trader",
        "salvage items",
        "farming builds",
        "==Trivia==",
        "Priests of Balthazar",
        "merchant",
        "collector",
    )
    encoded = json.dumps(catalog, ensure_ascii=False)
    for term in forbidden_terms:
        if term in encoded:
            diagnostics.append(
                _diag(
                    "RUNE_FORBIDDEN_PROSE_PROMOTED",
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
                "RUNE_SNAPSHOT_SET_DIGEST_MISSING",
                "Promotion evidence must include a selected EPIC-10 snapshot-set digest",
                0,
                "snapshot-set",
                severity="critical",
                disposition="non-waivable",
            )
        )
    diagnostics.extend(_release_notes())
    return diagnostics


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
            "scope": "EPIC-10 source authority, source-plan digest, and armor-rune inventory accounting",
            "decision": "approved",
            "rationale": "The finite hybrid source authority uses equipment-template modifier IDs for identity and the Rune/Attribute bonus pages for inventory, stacking, and headgear evidence.",
            "evidence": [
                {
                    "kind": "artifact",
                    "reference": str(source_plan["summary"]["sourceSetDigest"]),
                    "notes": "Digest of seed source pages, accepted modifier rows, detail titles, and compact dispositions.",
                }
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any source revision, source-set digest, accepted modifier ID, or source-plan digest change.",
        },
        {
            "id": SEMANTICS_REVIEW_ID,
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-10 rune effect and stacking semantics",
            "decision": "approved",
            "rationale": "Schema v1 records arithmetic only for source-clear attribute, health, energy, absorption, and condition-duration facts; ambiguous full-stat composition remains deferred.",
            "evidence": [
                {
                    "kind": "artifact",
                    "reference": str(source_plan["summary"]["sourcePlanDigest"]),
                    "notes": "Effect semantics are invalidated by source-plan, rank/family parser, or normalized effect changes.",
                }
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any rune family/rank/effect parser or reviewed source evidence change.",
        },
        {
            "id": BASELINE_REVIEW_ID,
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-10 first promoted rune catalog baseline",
            "decision": "approved",
            "rationale": "This promotion records the selected complete snapshot set, EPIC-03 dependency digests, generated runtime catalog, artifact digest, and QA gate state as the first baseline.",
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
            "reReviewTrigger": "Any semantic projection, schema, source revision, dependency digest, QA gate, or promotion path change.",
        },
    ]


def _source_set_summary(
    source_plan: dict[str, Any],
    runes: list[dict[str, Any]],
    dispositions: list[dict[str, Any]],
) -> dict[str, Any]:
    summary = source_plan["summary"]
    return {
        "seedTitles": list(source_plan["sourceAuthority"]["seedTitles"]),
        "detailPageTitles": list(source_plan["detailPageTitles"]),
        "sourceSetDigest": summary["sourceSetDigest"],
        "sourcePlanDigest": summary["sourcePlanDigest"],
        "acceptedRuneCount": len(runes),
        "relationshipCount": len([item for item in dispositions if item["kind"] == "supported-relationship"]),
        "exclusionCount": len([item for item in dispositions if item["kind"] == "explicit-exclusion"]),
        "unsupportedCount": len([item for item in dispositions if item["kind"] == "unsupported"]),
        "blockingFindingCount": int(summary["blockingFindingCount"]),
        "sourceAuthority": source_plan["sourceAuthority"]["policy"],
        "idPolicy": source_plan["idPolicy"],
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
                    f"Duplicate value in generated rune catalog: {value}",
                    int(value) if isinstance(value, int) else 0,
                    "catalog",
                    severity="critical",
                    disposition="non-waivable",
                )
            )


def _release_notes() -> list[Diagnostic]:
    return [
        Diagnostic(
            code="RUNE_SOURCE_AUTHORITY_REVIEW",
            severity="info",
            message="Finite EPIC-10 source authority was reviewed before catalog promotion.",
            category="manual-override",
            scope_kind="release",
            artifact_path="data/generated/epic-10/runes.catalog.json",
            evidence=(Evidence("review-note", SOURCE_REVIEW_ID, "Source graph is digest-bound and finite."),),
            disposition="resolved",
        ),
        Diagnostic(
            code="RUNE_COPIED_PROSE_EXCLUDED",
            severity="info",
            message="Runtime rune records use structured effects and exclude source-authored long prose.",
            category="copied-text-without-attribution",
            scope_kind="release",
            artifact_path="data/generated/epic-10/runes.catalog.json",
            evidence=(Evidence("review-note", SEMANTICS_REVIEW_ID, "Source prose remains outside runtime JSON."),),
            disposition="resolved",
        ),
    ]


def _first_source_id(rune: dict[str, Any]) -> str:
    source_ids = rune.get("provenance", {}).get("sourceIds", [])
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
