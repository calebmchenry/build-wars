from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .artifacts import canonical_json_bytes, write_canonical_json
from .config import INGESTION_SCHEMA_VERSION
from .insignia_identity import (
    InsigniaIdentityRegistry,
    identity_for_source_key,
    load_identity_registry,
    validate_registry_against_source_keys,
)
from .models import Diagnostic, Evidence, digest_bytes, digest_wire
from .profiles import DataIngestionProfile, EPIC_11_PROFILE_ID, EPIC_11_SOURCE_TITLES
from .rune_source_set import modifier_rows_from_equipment_template
from .snapshots import LoadedSnapshot, SnapshotError, SnapshotStore
from .source_set_protocol import (
    SourceSetProtocolError,
    confined_child_path,
    require_matching_digest,
    require_unique_values,
)
from .wikitext import disambiguation_preamble


class InsigniaSourceSetError(RuntimeError):
    def __init__(self, message: str, diagnostics: list[Diagnostic] | None = None) -> None:
        super().__init__(message)
        self.diagnostics = diagnostics or []


@dataclass(frozen=True)
class InsigniaSourceSetBuildResult:
    plan: dict[str, Any]
    diagnostics: list[Diagnostic]


@dataclass(frozen=True)
class InsigniaSnapshotSetReplay:
    manifest: dict[str, Any]
    loaded_snapshots: list[LoadedSnapshot]


SOURCE_REVIEW_ID = "review:epic-11-source-set:2026-09-02"
AUTHORITY_POLICY = (
    "Equipment template modifier rows identify player-usable armor-prefix insignia candidates; "
    "the Insignia overview supplies common/profession grouping and source-visible bonuses; "
    "verified detail pages supply page identity, restrictions, slot/effect facts, and optional "
    "metadata-only media references; Effect stacking supplies locality and combination mechanics."
)
ID_POLICY = (
    "Public InsigniaId values are schema-owned registry allocations. Production v1 accepted "
    "player-usable records require exactly one active verified armor-prefix TemplateEquipmentModifierId crosswalk."
)
WIKI_LINK_RE = re.compile(r"\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]+))?]]")
OVERVIEW_HEADING_RE = re.compile(r"^==={{[^}]+}}\s*(?P<label>[^=]+?)\s*===$")


def source_plan_path(root: Path, digest: str) -> Path:
    return root / "work/runs/data-ingestion/epic-11/source-plans" / f"insignias-{digest[:16]}.source-plan.json"


def snapshot_set_path(root: Path, digest: str) -> Path:
    return root / "work/runs/data-ingestion/epic-11/snapshot-sets" / f"insignias-{digest[:16]}.snapshot-set.json"


def build_source_plan(
    *,
    profile: DataIngestionProfile,
    generated_at: str,
    source_snapshots: list[dict[str, Any]],
    dependency: Any,
    registry: InsigniaIdentityRegistry | None = None,
) -> InsigniaSourceSetBuildResult:
    if profile.id != EPIC_11_PROFILE_ID:
        raise InsigniaSourceSetError(f"Insignia source plans are only supported for {EPIC_11_PROFILE_ID}")

    registry = registry or load_identity_registry()
    diagnostics: list[Diagnostic] = []
    snapshots_by_title = {str(snapshot["title"]): snapshot for snapshot in source_snapshots}
    for title in EPIC_11_SOURCE_TITLES:
        if title not in snapshots_by_title:
            diagnostics.append(
                _diag(
                    "INSIGNIA_SOURCE_AUTHORITY_PAGE_MISSING",
                    f"Required EPIC-11 source page was missing: {title}",
                    source_ids=(title,),
                    severity="critical",
                    disposition="non-waivable",
                )
            )

    equipment_snapshot = snapshots_by_title.get("Equipment template format")
    overview_snapshot = snapshots_by_title.get("Insignia")
    stacking_snapshot = snapshots_by_title.get("Effect stacking")
    if equipment_snapshot is None or overview_snapshot is None or stacking_snapshot is None:
        plan = _empty_plan(profile, generated_at, source_snapshots, diagnostics, registry)
        return InsigniaSourceSetBuildResult(plan=plan, diagnostics=diagnostics)

    modifier_rows = modifier_rows_from_equipment_template(str(equipment_snapshot["content"]))
    insignia_rows = [row for row in modifier_rows if _looks_insignia_like(str(row["name"]))]
    overview_entries = overview_insignia_entries(str(overview_snapshot["content"]))
    overview_by_key = {_title_key(str(entry["title"])): entry for entry in overview_entries}
    accepted: list[dict[str, Any]] = []
    matched_overview_keys: set[str] = set()

    for row in insignia_rows:
        source_key = f"equipment-modifier:{int(row['modifierId'])}"
        registry_id = identity_for_source_key(registry, source_key)
        if registry_id is None:
            diagnostics.append(
                _diag(
                    "INSIGNIA_REGISTRY_ID_MISSING",
                    f"Insignia source key is missing from the identity registry: {source_key}",
                    source_ids=(str(equipment_snapshot["sourceReference"]["id"]),),
                    record_id=int(row["modifierId"]),
                    severity="critical",
                    disposition="non-waivable",
                )
            )
            continue
        overview = overview_by_key.get(_title_key(str(row["name"])))
        if overview is None:
            diagnostics.append(
                _diag(
                    "INSIGNIA_OVERVIEW_MEMBERSHIP_MISSING",
                    f"Equipment modifier insignia did not appear in the Insignia overview: {row['name']}",
                    source_ids=(str(equipment_snapshot["sourceReference"]["id"]), str(overview_snapshot["sourceReference"]["id"])),
                    record_id=int(row["modifierId"]),
                    severity="error",
                )
            )
        else:
            matched_overview_keys.add(_title_key(str(overview["title"])))
        profession = _profession_for_row(row, overview)
        availability = "common" if profession is None else "profession-specific"
        accepted.append(
            {
                "sourceKey": source_key,
                "id": registry_id,
                "variantKey": None,
                "templateModifierId": int(row["modifierId"]),
                "requestedTitle": str(row["name"]),
                "detailTitle": str(overview["title"]) if overview is not None else str(row["name"]),
                "normalizedName": _lookup_key(str(overview["title"]) if overview is not None else str(row["name"])),
                "familyKey": _family_key(str(overview["title"]) if overview is not None else str(row["name"])),
                "availability": availability,
                "professionName": profession,
                "modeAvailability": "both",
                "rawOverviewBonus": overview.get("bonus") if overview is not None else None,
                "sourceId": str(equipment_snapshot["sourceReference"]["id"]),
                "overviewSourceId": str(overview_snapshot["sourceReference"]["id"]),
                "mechanicsSourceId": str(stacking_snapshot["sourceReference"]["id"]),
                "sourceLine": int(row["sourceLine"]),
            }
        )

    equipment_keys = {_title_key(str(row["name"])) for row in insignia_rows}
    for entry in overview_entries:
        key = _title_key(str(entry["title"]))
        if key not in equipment_keys and key not in matched_overview_keys:
            diagnostics.append(
                _diag(
                    "INSIGNIA_MODIFIER_ROW_MISSING",
                    f"Insignia overview entry has no template modifier row: {entry['title']}",
                    source_ids=(str(overview_snapshot["sourceReference"]["id"]),),
                    record_id=str(entry["title"]),
                    severity="error",
                )
            )

    accepted = sorted(accepted, key=lambda item: (int(item["id"]), str(item["detailTitle"])))
    diagnostics.extend(validate_registry_against_source_keys(registry, [str(seed["sourceKey"]) for seed in accepted]))
    diagnostics.extend(_source_set_diagnostics(accepted, profile, source_snapshots, dependency.catalog))
    dispositions = [
        _disposition(
            insignia_id=None,
            template_modifier_id=None,
            requested_title="Effect stacking",
            kind="supported-relationship",
            reason="Mechanics source approved for effect locality and combination policy; not a catalog record.",
            source_id=str(stacking_snapshot["sourceReference"]["id"]),
            review_id=SOURCE_REVIEW_ID,
        )
    ]
    dispositions.extend(
        _explicit_non_insignia_exclusions(
            modifier_rows=modifier_rows,
            source_id=str(equipment_snapshot["sourceReference"]["id"]),
        )
    )
    dispositions = sorted(dispositions, key=lambda item: (str(item["kind"]), str(item["requestedTitle"])))
    detail_titles = sorted({str(seed["detailTitle"]) for seed in accepted})
    source_set_projection = {
        "sourcePages": [_snapshot_identity(snapshot) for snapshot in sorted(source_snapshots, key=lambda item: str(item["title"]))],
        "dependency": _dependency_digest_projection(dependency),
        "acceptedSeeds": _drop_source_only(accepted),
        "runtimeDispositions": _drop_source_only(dispositions),
        "detailPageTitles": detail_titles,
        "identityRegistryDigest": registry.digest,
        "authorityPolicy": AUTHORITY_POLICY,
        "idPolicy": ID_POLICY,
    }
    source_set_digest = digest_bytes(canonical_json_bytes(source_set_projection))
    blocking_count = len(
        [item for item in diagnostics if item.severity in {"critical", "error"} and item.disposition in {"open", "non-waivable"}]
    )
    plan: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "profile": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "generatedAt": generated_at,
        "sourceAuthority": {
            "seedTitles": list(EPIC_11_SOURCE_TITLES),
            "policy": AUTHORITY_POLICY,
            "fieldMatrixVersion": "epic-11-source-authority-v1",
            "approvedReviewId": SOURCE_REVIEW_ID,
            "excludedAuthorities": [
                "category crawl",
                "site search",
                "arbitrary source URLs",
                "source-provided commands",
                "runtime wiki access",
                "media byte fetching",
            ],
        },
        "idPolicy": ID_POLICY,
        "identityRegistryDigest": registry.digest,
        "sourcePages": [_snapshot_identity(snapshot) for snapshot in sorted(source_snapshots, key=lambda item: str(item["title"]))],
        "dependencyDigests": [_dependency_digest_projection(dependency)],
        "acceptedSeeds": accepted,
        "runtimeDispositions": dispositions,
        "overviewEntries": overview_entries,
        "detailPageTitles": detail_titles,
        "sourceShapeCheckpoint": {
            "reviewId": SOURCE_REVIEW_ID,
            "decision": "approved",
            "representativeCases": [
                "common",
                "profession-specific",
                "fixed armor",
                "slot-scaled health",
                "slot-scaled energy",
                "conditional armor",
                "same-page variants",
                "redirects",
                "mode facts",
                "metadata-only icon references",
            ],
            "nonWaivableBlockers": [
                "missing source authority page",
                "unregistered source key",
                "missing active template modifier crosswalk",
                "missing deterministic source-clear slot values",
                "unknown copied material in runtime JSON",
                "snapshot-set digest mismatch",
            ],
        },
        "summary": {
            "modifierRowCount": len(modifier_rows),
            "insigniaLikeModifierCount": len(insignia_rows),
            "overviewEntryCount": len(overview_entries),
            "acceptedInsigniaCount": len(accepted),
            "relationshipCount": len([item for item in dispositions if item["kind"] == "supported-relationship"]),
            "exclusionCount": len([item for item in dispositions if item["kind"] == "explicit-exclusion"]),
            "unsupportedCount": len([item for item in dispositions if item["kind"] == "unsupported"]),
            "blockingFindingCount": blocking_count,
            "detailPageCount": len(detail_titles),
            "sourceSetDigest": source_set_digest,
            "sourcePlanDigest": "pending",
        },
        "diagnostics": [_diagnostic_summary(item) for item in sorted(diagnostics, key=lambda item: item.stable_key())],
        "caps": {
            "seedPageLimit": len(EPIC_11_SOURCE_TITLES),
            "detailPageLimit": profile.page_limit,
            "mediaTitleLimit": profile.media_title_limit,
            "requestLimit": profile.request_limit,
            "responseByteCap": profile.response_byte_cap,
            "parserByteCap": profile.parser_byte_cap,
            "aggregateByteCap": profile.aggregate_byte_cap,
            "catalogByteCap": profile.catalog_byte_cap,
            "qaByteCap": profile.qa_byte_cap,
        },
    }
    plan["summary"]["sourcePlanDigest"] = source_plan_digest(plan)
    return InsigniaSourceSetBuildResult(plan=plan, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


def source_plan_digest(plan: dict[str, Any]) -> str:
    projection = json.loads(json.dumps(plan))
    if isinstance(projection.get("summary"), dict):
        projection["summary"]["sourcePlanDigest"] = "pending"
    return digest_bytes(canonical_json_bytes(projection))


def write_source_plan(root: Path, plan: dict[str, Any]) -> Path:
    digest = str(plan["summary"]["sourcePlanDigest"])
    path = source_plan_path(root.resolve(), digest)
    write_canonical_json(root.resolve(), path.resolve().relative_to(root.resolve()), plan)
    return path


def load_source_plan(path: Path) -> dict[str, Any]:
    try:
        plan = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise InsigniaSourceSetError(f"Insignia source plan could not be read: {exc}") from exc
    if not isinstance(plan, dict):
        raise InsigniaSourceSetError("Insignia source plan root must be an object")
    return plan


def validate_source_plan(
    plan: dict[str, Any],
    *,
    profile: DataIngestionProfile,
    confirm_source_set_digest: str,
) -> None:
    if plan.get("profile") != profile.id:
        raise InsigniaSourceSetError("Insignia source plan profile does not match the selected profile")
    summary = plan.get("summary")
    if not isinstance(summary, dict):
        raise InsigniaSourceSetError("Insignia source plan summary is missing")
    if summary.get("sourcePlanDigest") != source_plan_digest(plan):
        raise InsigniaSourceSetError("Insignia source plan digest does not match its current contents")
    try:
        require_matching_digest(
            label="Insignia source-set",
            actual=str(summary.get("sourceSetDigest")),
            expected=confirm_source_set_digest,
        )
    except SourceSetProtocolError as exc:
        raise InsigniaSourceSetError(str(exc)) from exc
    seeds = plan.get("acceptedSeeds")
    if not isinstance(seeds, list) or not seeds:
        raise InsigniaSourceSetError("Insignia source plan does not contain accepted insignia seeds")
    if len(seeds) > profile.page_limit:
        raise InsigniaSourceSetError("Insignia source plan exceeds the profile detail page cap")
    if int(summary.get("blockingFindingCount") or 0) > 0:
        raise InsigniaSourceSetError("Insignia source plan has blocking findings")


def overview_insignia_entries(text: str) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    current_group: str | None = None
    for line_number, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        heading = OVERVIEW_HEADING_RE.match(stripped)
        if heading is not None:
            current_group = _clean_markup(heading.group("label"))
            continue
        if "||" not in stripped or "[[" not in stripped:
            continue
        left, bonus = stripped.split("||", 1)
        link = WIKI_LINK_RE.search(left)
        if link is None:
            continue
        title = link.group(1).strip()
        if "insignia" not in title.casefold():
            continue
        profession = None if current_group is None or current_group.casefold() == "common" else current_group
        entries.append(
            {
                "title": title,
                "displayLabel": _clean_markup(link.group(2) or title),
                "group": current_group,
                "professionName": profession,
                "availability": "common" if profession is None else "profession-specific",
                "bonus": _clean_bonus(bonus),
                "sourceLine": line_number,
            }
        )
    return sorted(entries, key=lambda item: (_lookup_key(str(item["title"])), int(item["sourceLine"])))


def resolution_records_from_pages(
    *,
    plan: dict[str, Any],
    pages: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[Diagnostic]]:
    diagnostics: list[Diagnostic] = []
    by_requested: dict[str, dict[str, Any]] = {}
    for page in pages:
        requested = str(page.get("_buildWarsRequestedTitle") or page.get("title"))
        by_requested[requested] = page
    records: list[dict[str, Any]] = []
    for seed in plan["acceptedSeeds"]:
        requested = str(seed["detailTitle"])
        page = by_requested.get(requested)
        if page is None:
            diagnostics.append(
                _diag(
                    "INSIGNIA_DETAIL_PAGE_MISSING",
                    f"Insignia detail page was missing for {requested}",
                    source_ids=(requested,),
                    record_id=int(seed["id"]),
                    severity="error",
                )
            )
            continue
        revision = _first_revision(page)
        content = _revision_content(revision)
        canonical_title = str(page.get("_buildWarsCanonicalTitle") or page.get("title"))
        records.append(
            {
                **seed,
                "normalizedTitle": str(page.get("_buildWarsNormalizedTitle") or requested),
                "canonicalTitle": canonical_title,
                "redirectedFrom": page.get("_buildWarsRedirectedFrom"),
                "pageId": page.get("pageid"),
                "revisionId": revision.get("revid"),
                "sourceRevisionTimestamp": revision.get("timestamp"),
                "responseIndex": page.get("_buildWarsResponseIndex"),
                "content": content,
                "disambiguationPreamble": disambiguation_preamble(content),
            }
        )
    return records, sorted(diagnostics, key=lambda item: item.stable_key())


def write_snapshot_set_manifest(
    *,
    root: Path,
    profile: DataIngestionProfile,
    source_plan: dict[str, Any],
    child_manifest_paths: list[str],
    snapshot_store: SnapshotStore,
    completion_state: str,
    generated_at: str,
    notes: str | None,
    detail_records: list[dict[str, Any]] | None = None,
) -> Path:
    if completion_state not in {"complete", "partial", "superseded"}:
        raise InsigniaSourceSetError("Invalid insignia snapshot-set completion state")
    try:
        require_unique_values(sorted(child_manifest_paths), label="Insignia snapshot child manifest list")
    except SourceSetProtocolError as exc:
        raise InsigniaSourceSetError(str(exc)) from exc
    children = []
    aggregate_payload_bytes = 0
    for manifest_path in sorted(set(child_manifest_paths)):
        loaded = snapshot_store.load_snapshot(_snapshot_store_manifest_path(manifest_path))
        source_ref = loaded.manifest.get("sourceReference")
        digest = loaded.manifest.get("digest")
        if not isinstance(source_ref, dict) or not isinstance(digest, dict):
            raise InsigniaSourceSetError("Child insignia snapshot manifest lacked source reference or digest")
        aggregate_payload_bytes += len(loaded.payload)
        children.append(
            {
                "manifestPath": manifest_path,
                "artifactPath": str(loaded.manifest["artifactPath"]),
                "digest": digest,
                "sourceId": str(source_ref.get("id")),
                "pageTitle": source_ref.get("pageTitle"),
                "revisionId": source_ref.get("revisionId"),
            }
        )

    aggregate_digest = digest_bytes(canonical_json_bytes(children))
    manifest = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "profile": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "generatedAt": generated_at,
        "sourcePlanDigest": source_plan["summary"]["sourcePlanDigest"],
        "sourceSetDigest": source_plan["summary"]["sourceSetDigest"],
        "identityRegistryDigest": source_plan["identityRegistryDigest"],
        "completionState": completion_state,
        "expectedChildCount": len(children),
        "childSnapshots": children,
        "sourcePlan": source_plan,
        "detailRecords": _detail_record_manifest(detail_records or []),
        "aggregatePayloadBytes": aggregate_payload_bytes,
        "aggregateDigest": digest_wire(aggregate_digest),
        "notes": notes,
    }
    path = snapshot_set_path(root.resolve(), aggregate_digest)
    write_canonical_json(root.resolve(), path.resolve().relative_to(root.resolve()), manifest)
    return path


def load_snapshot_set(
    *,
    snapshot_set_manifest_path: Path,
    snapshot_root: Path,
    profile: DataIngestionProfile,
) -> InsigniaSnapshotSetReplay:
    try:
        manifest = json.loads(snapshot_set_manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise InsigniaSourceSetError(f"Insignia snapshot-set manifest could not be read: {exc}") from exc
    if not isinstance(manifest, dict):
        raise InsigniaSourceSetError("Insignia snapshot-set manifest root must be an object")
    if manifest.get("profile") != profile.id:
        raise InsigniaSourceSetError("Insignia snapshot-set profile does not match the selected profile")
    if manifest.get("completionState") != "complete":
        raise InsigniaSourceSetError("Only complete EPIC-11 snapshot sets can replay or promote")
    source_plan = manifest.get("sourcePlan")
    if not isinstance(source_plan, dict) or source_plan.get("profile") != profile.id:
        raise InsigniaSourceSetError("Insignia snapshot-set source plan is missing or mismatched")
    if manifest.get("sourcePlanDigest") != source_plan_digest(source_plan):
        raise InsigniaSourceSetError("Insignia snapshot-set source-plan digest mismatch")
    if manifest.get("sourceSetDigest") != source_plan.get("summary", {}).get("sourceSetDigest"):
        raise InsigniaSourceSetError("Insignia snapshot-set source-set digest mismatch")
    children = manifest.get("childSnapshots")
    if not isinstance(children, list) or not children:
        raise InsigniaSourceSetError("Insignia snapshot-set manifest has no child snapshots")
    if len(children) != manifest.get("expectedChildCount"):
        raise InsigniaSourceSetError("Insignia snapshot-set child count does not match expectedChildCount")
    manifest_paths = [str(child.get("manifestPath")) for child in children if isinstance(child, dict)]
    try:
        require_unique_values(manifest_paths, label="Insignia snapshot-set manifest")
    except SourceSetProtocolError as exc:
        raise InsigniaSourceSetError(str(exc)) from exc

    store = SnapshotStore(snapshot_root)
    loaded: list[LoadedSnapshot] = []
    for manifest_path in manifest_paths:
        try:
            loaded.append(store.load_snapshot(_snapshot_store_manifest_path(manifest_path)))
        except SnapshotError as exc:
            raise InsigniaSourceSetError(f"Insignia snapshot-set child failed validation: {exc}") from exc

    _validate_snapshot_set_children(manifest, loaded)
    child_projection = [
        {
            "manifestPath": str(child.get("manifestPath")),
            "artifactPath": str(child.get("artifactPath")),
            "digest": child.get("digest"),
            "sourceId": str(child.get("sourceId")),
            "pageTitle": child.get("pageTitle"),
            "revisionId": child.get("revisionId"),
        }
        for child in children
        if isinstance(child, dict)
    ]
    expected_digest = manifest.get("aggregateDigest", {}).get("value")
    if expected_digest != digest_bytes(canonical_json_bytes(child_projection)):
        raise InsigniaSourceSetError("Insignia snapshot-set aggregate digest mismatch")
    return InsigniaSnapshotSetReplay(manifest=manifest, loaded_snapshots=loaded)


def page_snapshot_from_loaded(loaded: LoadedSnapshot) -> dict[str, Any]:
    payload = json.loads(loaded.payload.decode("utf-8"))
    if not isinstance(payload, dict):
        raise InsigniaSourceSetError("Insignia snapshot payload root was not an object")
    source_ref = loaded.manifest.get("sourceReference")
    if not isinstance(source_ref, dict):
        raise InsigniaSourceSetError("Insignia snapshot manifest was missing sourceReference")
    return {
        "title": str(payload.get("title")),
        "content": str(payload.get("content", "")),
        "pageId": payload.get("pageId"),
        "revisionId": payload.get("revisionId"),
        "timestamp": payload.get("timestamp"),
        "sourceReference": source_ref,
        "manifestPath": loaded.manifest.get("artifactPath"),
    }


def _validate_snapshot_set_children(manifest: dict[str, Any], loaded: list[LoadedSnapshot]) -> None:
    source_plan = manifest["sourcePlan"]
    detail_records = manifest.get("detailRecords")
    if not isinstance(detail_records, list) or not detail_records:
        raise InsigniaSourceSetError("Insignia snapshot-set detail records are missing")
    required_titles = {str(page["title"]) for page in source_plan.get("sourcePages", []) if isinstance(page, dict)}
    required_titles.update(str(record["canonicalTitle"]) for record in detail_records if isinstance(record, dict))
    child_titles = set()
    for child in manifest.get("childSnapshots", []):
        if isinstance(child, dict) and child.get("pageTitle") is not None:
            child_titles.add(str(child["pageTitle"]))
        if isinstance(child, dict):
            confined_child_path(Path("data/source-snapshots"), str(child.get("manifestPath", "")))
    extra = sorted(child_titles - required_titles - {"EPIC-11 insignia icon imageinfo"})
    if extra:
        raise InsigniaSourceSetError(f"Insignia snapshot-set contains extra child page titles: {', '.join(extra)}")
    missing = sorted(required_titles - child_titles)
    if missing:
        raise InsigniaSourceSetError(f"Insignia snapshot-set is missing required child page titles: {', '.join(missing)}")
    if not loaded:
        raise InsigniaSourceSetError("Insignia snapshot-set loaded no child snapshots")
    payload_total = sum(len(item.payload) for item in loaded)
    if int(manifest.get("aggregatePayloadBytes") or -1) != payload_total:
        raise InsigniaSourceSetError("Insignia snapshot-set aggregate payload byte count mismatch")


def _detail_record_manifest(detail_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = []
    for record in detail_records:
        result.append(
            {
                "sourceKey": str(record["sourceKey"]),
                "id": int(record["id"]),
                "variantKey": record.get("variantKey"),
                "templateModifierId": int(record["templateModifierId"]),
                "requestedTitle": str(record["requestedTitle"]),
                "detailTitle": str(record["detailTitle"]),
                "normalizedName": str(record["normalizedName"]),
                "familyKey": str(record["familyKey"]),
                "availability": str(record["availability"]),
                "professionName": record.get("professionName"),
                "modeAvailability": str(record["modeAvailability"]),
                "normalizedTitle": str(record.get("normalizedTitle") or record["detailTitle"]),
                "canonicalTitle": str(record["canonicalTitle"]),
                "redirectedFrom": record.get("redirectedFrom"),
                "pageId": record.get("pageId"),
                "revisionId": record.get("revisionId"),
                "sourceRevisionTimestamp": record.get("sourceRevisionTimestamp"),
                "responseIndex": record.get("responseIndex"),
                "disambiguationPreamble": record.get("disambiguationPreamble"),
            }
        )
    return sorted(result, key=lambda item: (int(item["id"]), str(item["canonicalTitle"])))


def _source_set_diagnostics(
    accepted: list[dict[str, Any]],
    profile: DataIngestionProfile,
    source_snapshots: list[dict[str, Any]],
    dependency_catalog: dict[str, Any],
) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    if not accepted:
        diagnostics.append(
            _diag(
                "INSIGNIA_SOURCE_SET_ZERO_ACCEPTED",
                "EPIC-11 source plan produced no accepted insignia records",
                source_ids=tuple(str(snapshot.get("title")) for snapshot in source_snapshots),
                severity="critical",
                disposition="non-waivable",
            )
        )
    if len(accepted) > profile.page_limit:
        diagnostics.append(
            _diag(
                "INSIGNIA_DETAIL_PAGE_CAP_EXCEEDED",
                "EPIC-11 source plan exceeded the detail page cap",
                source_ids=tuple(str(snapshot.get("title")) for snapshot in source_snapshots),
                severity="critical",
                disposition="non-waivable",
            )
        )
    for field, code in (
        ("id", "INSIGNIA_SOURCE_DUPLICATE_ID"),
        ("sourceKey", "INSIGNIA_SOURCE_DUPLICATE_SOURCE_KEY"),
        ("templateModifierId", "INSIGNIA_SOURCE_DUPLICATE_TEMPLATE_MODIFIER_ID"),
        ("normalizedName", "INSIGNIA_SOURCE_DUPLICATE_NORMALIZED_NAME"),
    ):
        diagnostics.extend(_duplicates([seed[field] for seed in accepted], code))
    profession_names = {_lookup_key(str(profession["name"])) for profession in dependency_catalog.get("professions", [])}
    for seed in accepted:
        if seed["availability"] == "profession-specific" and _lookup_key(str(seed.get("professionName") or "")) not in profession_names:
            diagnostics.append(
                _diag(
                    "INSIGNIA_PROFESSION_JOIN_MISSING_IN_PLAN",
                    f"Profession-specific insignia does not join EPIC-03: {seed.get('professionName')}",
                    source_ids=(str(seed["sourceId"]),),
                    record_id=int(seed["id"]),
                    severity="error",
                )
            )
        if not seed.get("templateModifierId"):
            diagnostics.append(
                _diag(
                    "INSIGNIA_TEMPLATE_MODIFIER_REQUIRED",
                    "Accepted insignia seed is missing its active template modifier crosswalk",
                    source_ids=(str(seed["sourceId"]),),
                    record_id=int(seed["id"]),
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    return sorted(diagnostics, key=lambda item: item.stable_key())


def _explicit_non_insignia_exclusions(
    *,
    modifier_rows: list[dict[str, Any]],
    source_id: str,
) -> list[dict[str, Any]]:
    dispositions: list[dict[str, Any]] = []
    for row in modifier_rows:
        name = str(row["name"])
        if name.startswith('"') and 277 <= int(row["modifierId"]) <= 389:
            dispositions.append(
                _disposition(
                    insignia_id=None,
                    template_modifier_id=int(row["modifierId"]),
                    requested_title=name,
                    kind="explicit-exclusion",
                    reason="Inscription-like armor or weapon modifier row is outside EPIC-11 insignia scope.",
                    source_id=source_id,
                    review_id=SOURCE_REVIEW_ID,
                )
            )
    return dispositions


def _empty_plan(
    profile: DataIngestionProfile,
    generated_at: str,
    source_snapshots: list[dict[str, Any]],
    diagnostics: list[Diagnostic],
    registry: InsigniaIdentityRegistry,
) -> dict[str, Any]:
    plan: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "profile": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "generatedAt": generated_at,
        "sourceAuthority": {"seedTitles": list(EPIC_11_SOURCE_TITLES), "policy": "missing", "excludedAuthorities": []},
        "idPolicy": ID_POLICY,
        "identityRegistryDigest": registry.digest,
        "sourcePages": [_snapshot_identity(snapshot) for snapshot in source_snapshots],
        "dependencyDigests": [],
        "acceptedSeeds": [],
        "runtimeDispositions": [],
        "overviewEntries": [],
        "detailPageTitles": [],
        "sourceShapeCheckpoint": {"reviewId": SOURCE_REVIEW_ID, "decision": "blocked"},
        "summary": {
            "modifierRowCount": 0,
            "insigniaLikeModifierCount": 0,
            "overviewEntryCount": 0,
            "acceptedInsigniaCount": 0,
            "relationshipCount": 0,
            "exclusionCount": 0,
            "unsupportedCount": 0,
            "blockingFindingCount": len(diagnostics),
            "detailPageCount": 0,
            "sourceSetDigest": digest_bytes(canonical_json_bytes([])),
            "sourcePlanDigest": "pending",
        },
        "diagnostics": [_diagnostic_summary(item) for item in diagnostics],
        "caps": {},
    }
    plan["summary"]["sourcePlanDigest"] = source_plan_digest(plan)
    return plan


def _profession_for_row(row: dict[str, Any], overview: dict[str, Any] | None) -> str | None:
    row_profession = row.get("professionLabel")
    if isinstance(row_profession, str) and row_profession:
        return _clean_markup(row_profession)
    if overview is not None and overview.get("professionName") is not None:
        return _clean_markup(str(overview["professionName"]))
    return None


def _looks_insignia_like(value: str) -> bool:
    return "insignia" in value.casefold()


def _title_key(value: str) -> str:
    clean = _lookup_key(value)
    return re.sub(r"-s-insignia$", "-insignia", clean)


def _lookup_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", _clean_markup(value).lower()).strip("-")


def _family_key(value: str) -> str:
    family = re.sub(r"\binsignia\b", "", _clean_markup(value), flags=re.IGNORECASE)
    family = family.replace("'s", "")
    return _lookup_key(family)


def _clean_bonus(value: str) -> str:
    return _clean_markup(value.replace("<br>", "\n").replace("<br />", "\n").replace("<br/>", "\n"))


def _clean_markup(value: str) -> str:
    value = re.sub(r"\[\[([^|\]]+)\|([^\]]+)]]", r"\2", value)
    value = re.sub(r"\[\[([^\]]+)]]", r"\1", value)
    value = re.sub(r"\{\{[^}]+}}", "", value)
    value = value.replace("&nbsp;", " ")
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def _snapshot_identity(snapshot: dict[str, Any]) -> dict[str, Any]:
    source = snapshot.get("sourceReference")
    source_id = source.get("id") if isinstance(source, dict) else None
    revision_id = source.get("revisionId") if isinstance(source, dict) else snapshot.get("revisionId")
    return {
        "title": str(snapshot.get("title")),
        "sourceId": source_id,
        "pageId": source.get("pageId") if isinstance(source, dict) else snapshot.get("pageId"),
        "revisionId": revision_id,
        "sourceRevisionTimestamp": source.get("sourceRevisionTimestamp") if isinstance(source, dict) else snapshot.get("timestamp"),
        "contentDigest": digest_bytes(str(snapshot.get("content", "")).encode("utf-8")),
    }


def _dependency_digest_projection(dependency: Any) -> dict[str, Any]:
    return {
        "id": "epic-03-professions-attributes",
        "catalogVersion": str(dependency.catalog["catalogVersion"]),
        "artifactDigest": dependency.artifact_digest,
        "manifestDigest": dependency.manifest_digest,
        "qaGate": dependency.qa_gate,
    }


def _drop_source_only(value: Any) -> Any:
    if isinstance(value, list):
        return [_drop_source_only(item) for item in value]
    if isinstance(value, dict):
        return {
            key: _drop_source_only(item)
            for key, item in value.items()
            if key not in {"sourceLine", "sourceId", "overviewSourceId", "mechanicsSourceId"}
        }
    return value


def _diagnostic_summary(diagnostic: Diagnostic) -> dict[str, Any]:
    return {
        "code": diagnostic.code,
        "severity": diagnostic.severity,
        "message": diagnostic.message,
        "scope": diagnostic.scope_wire(),
        "disposition": diagnostic.disposition,
    }


def _duplicates(values: list[Any], code: str) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    counts = Counter(str(value) for value in values)
    for value, count in counts.items():
        if count > 1:
            diagnostics.append(
                _diag(
                    code,
                    f"Duplicate value in insignia source plan: {value}",
                    source_ids=("source-plan",),
                    record_id=value,
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    return diagnostics


def _disposition(
    *,
    insignia_id: int | None,
    template_modifier_id: int | None,
    requested_title: str,
    kind: str,
    reason: str,
    source_id: str,
    review_id: str | None,
) -> dict[str, Any]:
    identifier = template_modifier_id if template_modifier_id is not None else _lookup_key(requested_title)
    return {
        "id": f"insignia-disposition:{identifier}",
        "insigniaId": insignia_id,
        "templateModifierId": template_modifier_id,
        "requestedTitle": requested_title,
        "kind": kind,
        "reason": reason,
        "reviewId": review_id,
        "provenance": _provenance(source_id, str(identifier), reason),
    }


def _provenance(source_id: str, claim_key: str, notes: str | None) -> dict[str, Any]:
    return {
        "sourceIds": [source_id],
        "claimIds": [f"claim:epic-11-source-set:{claim_key}"],
        "reviewIds": [SOURCE_REVIEW_ID],
        "notes": notes,
    }


def _first_revision(page: dict[str, Any]) -> dict[str, Any]:
    revisions = page.get("revisions")
    if not isinstance(revisions, list) or not revisions or not isinstance(revisions[0], dict):
        raise InsigniaSourceSetError(f"Insignia page missing revision payload: {page.get('title')}")
    return revisions[0]


def _revision_content(revision: dict[str, Any]) -> str:
    slots = revision.get("slots")
    main = slots.get("main") if isinstance(slots, dict) else None
    if isinstance(main, dict):
        return str(main.get("content", ""))
    return str(revision.get("content", ""))


def _snapshot_store_manifest_path(manifest_path: str) -> Path:
    if manifest_path.startswith("data/source-snapshots/"):
        return Path(manifest_path).relative_to("data/source-snapshots")
    return Path(manifest_path)


def _diag(
    code: str,
    message: str,
    *,
    source_ids: tuple[str, ...],
    severity: str,
    record_id: str | int | None = None,
    disposition: str = "open",
) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity=severity,  # type: ignore[arg-type]
        message=message,
        category="schema-shape-error",
        scope_kind="record" if record_id is not None else "source",
        record_id=record_id,
        source_ids=source_ids,
        evidence=tuple(Evidence("source", source_id, None) for source_id in source_ids),
        disposition=disposition,  # type: ignore[arg-type]
    )
