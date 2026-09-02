from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .artifacts import canonical_json_bytes, confined_path, write_canonical_json
from .config import INGESTION_SCHEMA_VERSION
from .models import Diagnostic, Evidence, digest_bytes, digest_wire
from .profiles import DataIngestionProfile, EPIC_04_PROFILE_ID, EPIC_04_SOURCE_INDEX_TITLE
from .skill_ids import SkillIdSource, enumerate_skill_ids
from .snapshots import LoadedSnapshot, SnapshotError, SnapshotStore
from .wikitext import disambiguation_preamble

RANGE_LINK_RE = re.compile(r"\[\[(/(?P<start>\d+)-(?P<end>\d+))\|[^\]]+]]")
SKILL_RANGE_TITLE_RE = re.compile(
    r"^Guild Wars Wiki:Game integration/Skills/(?P<start>\d+)-(?P<end>\d+)$"
)


class SkillSourceSetError(RuntimeError):
    def __init__(self, message: str, diagnostics: list[Diagnostic] | None = None) -> None:
        super().__init__(message)
        self.diagnostics = diagnostics or []


@dataclass(frozen=True)
class SourceSetBuildResult:
    plan: dict[str, Any]
    diagnostics: list[Diagnostic]


@dataclass(frozen=True)
class SnapshotSetReplay:
    manifest: dict[str, Any]
    loaded_snapshots: list[LoadedSnapshot]


def source_plan_path(root: Path, digest: str) -> Path:
    return root / "work/runs/data-ingestion/epic-04/source-plans" / f"skills-{digest[:16]}.source-plan.json"


def snapshot_set_path(root: Path, digest: str) -> Path:
    return root / "work/runs/data-ingestion/epic-04/snapshot-sets" / f"skills-{digest[:16]}.snapshot-set.json"


def ranged_titles_from_index(index_wikitext: str) -> tuple[list[str], list[Diagnostic]]:
    titles: list[str] = []
    diagnostics: list[Diagnostic] = []
    seen: set[str] = set()
    for match in RANGE_LINK_RE.finditer(index_wikitext):
        title = f"{EPIC_04_SOURCE_INDEX_TITLE}{match.group(1)}"
        if title in seen:
            diagnostics.append(
                Diagnostic(
                    code="SKILL_SOURCE_DUPLICATE_RANGE_LINK",
                    severity="error",
                    message=f"Duplicate ranged source-set page link: {title}",
                    category="invalid-source-reference",
                    scope_kind="source",
                    source_ids=(EPIC_04_SOURCE_INDEX_TITLE,),
                )
            )
            continue
        seen.add(title)
        titles.append(title)

    unexpected = [
        link
        for link in re.findall(r"\[\[(/[^|\]]+)", index_wikitext)
        if not re.fullmatch(r"/\d+-\d+", link)
    ]
    for link in unexpected:
        diagnostics.append(
            Diagnostic(
                code="SKILL_SOURCE_UNEXPECTED_INDEX_LINK",
                severity="error",
                message=f"Unexpected skill source-set index link: {link}",
                category="invalid-source-reference",
                scope_kind="source",
                source_ids=(EPIC_04_SOURCE_INDEX_TITLE,),
            )
        )
    if not titles:
        diagnostics.append(
            Diagnostic(
                code="SKILL_SOURCE_INDEX_EMPTY",
                severity="critical",
                message="The EPIC-04 source-set index did not contain ranged skill links",
                category="invalid-source-reference",
                scope_kind="source",
                source_ids=(EPIC_04_SOURCE_INDEX_TITLE,),
                disposition="non-waivable",
            )
        )
    return sorted(titles, key=range_sort_key), sorted(diagnostics, key=lambda item: item.stable_key())


def range_sort_key(title: str) -> tuple[int, int, str]:
    bounds = range_bounds(title)
    if bounds is None:
        return (10**9, 10**9, title)
    return (*bounds, title)


def range_bounds(title: str) -> tuple[int, int] | None:
    match = SKILL_RANGE_TITLE_RE.fullmatch(title)
    if match is None:
        return None
    return int(match.group("start")), int(match.group("end"))


def build_source_plan(
    *,
    profile: DataIngestionProfile,
    generated_at: str,
    index_snapshot: dict[str, Any],
    range_snapshots: list[dict[str, Any]],
) -> SourceSetBuildResult:
    if profile.id != EPIC_04_PROFILE_ID:
        raise SkillSourceSetError(f"Source plans are only supported for {EPIC_04_PROFILE_ID}")

    diagnostics: list[Diagnostic] = []
    ranged_titles, index_diagnostics = ranged_titles_from_index(str(index_snapshot["content"]))
    diagnostics.extend(index_diagnostics)
    snapshots_by_title = {str(snapshot["title"]): snapshot for snapshot in range_snapshots}
    missing_ranges = [title for title in ranged_titles if title not in snapshots_by_title]
    if missing_ranges:
        diagnostics.append(
            Diagnostic(
                code="SKILL_SOURCE_RANGE_MISSING",
                severity="critical",
                message=f"Source-set range pages were not fetched: {', '.join(missing_ranges)}",
                category="invalid-source-reference",
                scope_kind="source",
                source_ids=tuple(missing_ranges),
                disposition="non-waivable",
            )
        )

    seeds: list[dict[str, Any]] = []
    seed_diagnostics: list[Diagnostic] = []
    for title in ranged_titles:
        snapshot = snapshots_by_title.get(title)
        if snapshot is None:
            continue
        bounds = range_bounds(title)
        min_id = bounds[0] if bounds else 1
        max_id = bounds[1] if bounds else profile.page_limit
        source_ref = snapshot["sourceReference"]
        parsed, parsed_diagnostics = enumerate_skill_ids(
            str(snapshot["content"]),
            source=SkillIdSource(
                source_page=title,
                source_url=str(source_ref["canonicalUrl"]),
                source_revision_id=source_ref["revisionId"],
                source_revision_timestamp=str(source_ref["sourceRevisionTimestamp"]),
                source_id=str(source_ref["id"]),
                source_reference=source_ref,
            ),
            min_id=min_id,
            max_id=max_id,
            emit_gap_diagnostics=False,
        )
        seeds.extend(_seed_record(record) for record in parsed)
        seed_diagnostics.extend(_downgrade_source_diagnostic(item) for item in parsed_diagnostics)

    diagnostics.extend(seed_diagnostics)
    duplicate_id_diagnostics = _duplicate_id_diagnostics(seeds)
    diagnostics.extend(duplicate_id_diagnostics)
    seeds = _dedupe_seed_ids(seeds)
    seeds.sort(key=lambda item: (int(item["skillId"]), str(item["requestedTitle"])))

    coverage_gaps = _coverage_gaps([int(seed["skillId"]) for seed in seeds])
    duplicate_title_count = _duplicate_count(str(seed["requestedTitle"]).strip().casefold() for seed in seeds)
    source_set_projection = {
        "index": _snapshot_identity(index_snapshot),
        "ranges": [_snapshot_identity(snapshots_by_title[title]) for title in ranged_titles if title in snapshots_by_title],
        "acceptedSeeds": seeds,
        "coverageGaps": coverage_gaps,
    }
    source_set_digest = digest_bytes(canonical_json_bytes(source_set_projection))
    plan: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "profile": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "generatedAt": generated_at,
        "sourceIndex": _snapshot_identity(index_snapshot),
        "rangedPages": [
            _snapshot_identity(snapshots_by_title[title]) for title in ranged_titles if title in snapshots_by_title
        ],
        "acceptedSeeds": seeds,
        "summary": {
            "acceptedSeedCount": len(seeds),
            "minimumAcceptedId": min((int(seed["skillId"]) for seed in seeds), default=None),
            "maximumAcceptedId": max((int(seed["skillId"]) for seed in seeds), default=None),
            "numericGapCount": len(coverage_gaps),
            "duplicateRequestedTitleCount": duplicate_title_count,
            "sourceSetDigest": source_set_digest,
            "sourcePlanDigest": "pending",
        },
        "coverageGaps": coverage_gaps,
        "diagnostics": [_diagnostic_summary(item) for item in sorted(diagnostics, key=lambda item: item.stable_key())],
        "caps": {
            "seedPageLimit": len(ranged_titles) + 1,
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
    plan_digest = source_plan_digest(plan)
    plan["summary"]["sourcePlanDigest"] = plan_digest
    return SourceSetBuildResult(plan=plan, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


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
        raise SkillSourceSetError(f"Source plan could not be read: {exc}") from exc
    if not isinstance(plan, dict):
        raise SkillSourceSetError("Source plan root must be an object")
    return plan


def validate_source_plan(
    plan: dict[str, Any],
    *,
    profile: DataIngestionProfile,
    confirm_digest: str,
) -> None:
    if plan.get("profile") != profile.id:
        raise SkillSourceSetError("Source plan profile does not match the selected profile")
    summary = plan.get("summary")
    if not isinstance(summary, dict):
        raise SkillSourceSetError("Source plan summary is missing")
    digest = summary.get("sourcePlanDigest")
    if digest != source_plan_digest(plan):
        raise SkillSourceSetError("Source plan digest does not match its current contents")
    if digest != confirm_digest:
        raise SkillSourceSetError("Source plan digest confirmation did not match")
    seeds = plan.get("acceptedSeeds")
    if not isinstance(seeds, list) or not seeds:
        raise SkillSourceSetError("Source plan does not contain accepted skill seeds")
    if len(seeds) > profile.page_limit:
        raise SkillSourceSetError("Source plan exceeds the profile detail page cap")


def page_snapshot_from_loaded(loaded: LoadedSnapshot) -> dict[str, Any]:
    payload = json.loads(loaded.payload.decode("utf-8"))
    if not isinstance(payload, dict):
        raise SkillSourceSetError("Snapshot payload root was not an object")
    source_ref = loaded.manifest.get("sourceReference")
    if not isinstance(source_ref, dict):
        raise SkillSourceSetError("Snapshot manifest was missing sourceReference")
    return {
        "title": str(payload.get("title")),
        "content": str(payload.get("content", "")),
        "pageId": payload.get("pageId"),
        "revisionId": payload.get("revisionId"),
        "timestamp": payload.get("timestamp"),
        "sourceReference": source_ref,
        "manifestPath": loaded.manifest.get("artifactPath"),
    }


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
        requested = str(seed["requestedTitle"])
        page = by_requested.get(requested)
        if page is None:
            diagnostics.append(
                Diagnostic(
                    code="SKILL_DETAIL_PAGE_MISSING",
                    severity="error",
                    message=f"Detail page was missing for {requested}",
                    category="invalid-source-reference",
                    scope_kind="record",
                    record_id=int(seed["skillId"]),
                    source_ids=(requested,),
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
        raise SkillSourceSetError("Invalid snapshot-set completion state")
    children = []
    aggregate_payload_bytes = 0
    for manifest_path in sorted(set(child_manifest_paths)):
        loaded = snapshot_store.load_snapshot(_snapshot_store_manifest_path(manifest_path))
        source_ref = loaded.manifest.get("sourceReference")
        digest = loaded.manifest.get("digest")
        if not isinstance(source_ref, dict) or not isinstance(digest, dict):
            raise SkillSourceSetError("Child snapshot manifest lacked source reference or digest")
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


def _detail_record_manifest(detail_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = []
    for record in detail_records:
        result.append(
            {
                "skillId": int(record["skillId"]),
                "templateId": int(record["templateId"]),
                "requestedTitle": str(record["requestedTitle"]),
                "normalizedTitle": str(record.get("normalizedTitle") or record["requestedTitle"]),
                "canonicalTitle": str(record["canonicalTitle"]),
                "redirectedFrom": record.get("redirectedFrom"),
                "pageId": record.get("pageId"),
                "revisionId": record.get("revisionId"),
                "sourceRevisionTimestamp": record.get("sourceRevisionTimestamp"),
                "responseIndex": record.get("responseIndex"),
                "disambiguationPreamble": record.get("disambiguationPreamble"),
            }
        )
    return sorted(result, key=lambda item: (int(item["skillId"]), str(item["canonicalTitle"])))


def load_snapshot_set(
    *,
    snapshot_set_manifest_path: Path,
    snapshot_root: Path,
    profile: DataIngestionProfile,
) -> SnapshotSetReplay:
    try:
        manifest = json.loads(snapshot_set_manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SkillSourceSetError(f"Snapshot-set manifest could not be read: {exc}") from exc
    if not isinstance(manifest, dict):
        raise SkillSourceSetError("Snapshot-set manifest root must be an object")
    if manifest.get("profile") != profile.id:
        raise SkillSourceSetError("Snapshot-set profile does not match the selected profile")
    if manifest.get("completionState") != "complete":
        raise SkillSourceSetError("Only complete EPIC-04 snapshot sets can replay or promote")
    children = manifest.get("childSnapshots")
    if not isinstance(children, list) or not children:
        raise SkillSourceSetError("Snapshot-set manifest has no child snapshots")
    if len(children) != manifest.get("expectedChildCount"):
        raise SkillSourceSetError("Snapshot-set child count does not match expectedChildCount")
    manifest_paths = [str(child.get("manifestPath")) for child in children if isinstance(child, dict)]
    if len(set(manifest_paths)) != len(manifest_paths):
        raise SkillSourceSetError("Snapshot-set manifest contains duplicate child snapshots")

    store = SnapshotStore(snapshot_root)
    loaded: list[LoadedSnapshot] = []
    for manifest_path in manifest_paths:
        try:
            loaded.append(store.load_snapshot(_snapshot_store_manifest_path(manifest_path)))
        except SnapshotError as exc:
            raise SkillSourceSetError(f"Snapshot-set child failed validation: {exc}") from exc
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
        raise SkillSourceSetError("Snapshot-set aggregate digest mismatch")
    return SnapshotSetReplay(manifest=manifest, loaded_snapshots=loaded)


def _snapshot_store_manifest_path(manifest_path: str) -> Path:
    path = Path(manifest_path)
    parts = path.parts
    prefix = ("data", "source-snapshots")
    if len(parts) >= 2 and parts[:2] == prefix:
        return Path(*parts[2:])
    return path


def _seed_record(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "skillId": int(record["skillId"]),
        "templateId": int(record["skillId"]),
        "requestedTitle": str(record["title"]).strip(),
        "sourcePage": str(record["sourcePage"]),
        "sourceId": record["provenance"]["sources"][0]["id"],
        "lineNumber": int(record["lineNumber"]),
    }


def _snapshot_identity(snapshot: dict[str, Any]) -> dict[str, Any]:
    source_ref = snapshot["sourceReference"]
    content = str(snapshot["content"])
    return {
        "title": str(snapshot["title"]),
        "sourceId": str(source_ref["id"]),
        "pageId": source_ref.get("pageId"),
        "revisionId": source_ref.get("revisionId"),
        "sourceRevisionTimestamp": source_ref.get("sourceRevisionTimestamp"),
        "contentDigest": digest_bytes(content.encode("utf-8")),
        "contentBytes": len(content.encode("utf-8")),
    }


def _coverage_gaps(ids: list[int]) -> list[int]:
    if not ids:
        return []
    id_set = set(ids)
    return [skill_id for skill_id in range(min(ids), max(ids) + 1) if skill_id not in id_set]


def _duplicate_count(values: Any) -> int:
    counts = Counter(values)
    return sum(1 for count in counts.values() if count > 1)


def _duplicate_id_diagnostics(seeds: list[dict[str, Any]]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    counts = Counter(int(seed["skillId"]) for seed in seeds)
    for skill_id, count in counts.items():
        if count <= 1:
            continue
        diagnostics.append(
            Diagnostic(
                code="SKILL_SOURCE_DUPLICATE_ID",
                severity="critical",
                message=f"Skill ID {skill_id} appeared {count} times in the accepted source set",
                category="schema-shape-error",
                scope_kind="record",
                record_id=skill_id,
                disposition="non-waivable",
            )
        )
    return diagnostics


def _dedupe_seed_ids(seeds: list[dict[str, Any]]) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    seen: set[int] = set()
    for seed in sorted(seeds, key=lambda item: (int(item["skillId"]), str(item["requestedTitle"]))):
        skill_id = int(seed["skillId"])
        if skill_id in seen:
            continue
        seen.add(skill_id)
        selected.append(seed)
    return selected


def _downgrade_source_diagnostic(diagnostic: Diagnostic) -> Diagnostic:
    if diagnostic.code in {
        "SKILL_ID_DUPLICATE_TITLE",
        "SKILL_ID_UNEXPECTED_LINE",
        "SKILL_ID_MALFORMED_CANDIDATE",
    }:
        return Diagnostic(
            code=diagnostic.code,
            severity="info",
            message=diagnostic.message,
            category=diagnostic.category,
            scope_kind=diagnostic.scope_kind,
            artifact_path=diagnostic.artifact_path,
            record_id=diagnostic.record_id,
            field_path=diagnostic.field_path,
            source_ids=diagnostic.source_ids,
            evidence=diagnostic.evidence,
            disposition="resolved",
        )
    return diagnostic


def _diagnostic_summary(diagnostic: Diagnostic) -> dict[str, Any]:
    return {
        "code": diagnostic.code,
        "severity": diagnostic.severity,
        "recordId": diagnostic.record_id,
        "fieldPath": diagnostic.field_path,
        "disposition": diagnostic.disposition,
        "message": diagnostic.message,
    }


def _first_revision(page: dict[str, Any]) -> dict[str, Any]:
    revisions = page.get("revisions")
    if isinstance(revisions, list) and revisions and isinstance(revisions[0], dict):
        return revisions[0]
    raise SkillSourceSetError(f"MediaWiki page did not include revision metadata: {page.get('title')}")


def _revision_content(revision: dict[str, Any]) -> str:
    slots = revision.get("slots")
    if isinstance(slots, dict):
        main = slots.get("main")
        if isinstance(main, dict) and isinstance(main.get("content"), str):
            return main["content"]
    if isinstance(revision.get("content"), str):
        return revision["content"]
    raise SkillSourceSetError("MediaWiki revision did not include content")
