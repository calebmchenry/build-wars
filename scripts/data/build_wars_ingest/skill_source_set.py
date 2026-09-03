from __future__ import annotations

import html
import json
import re
import urllib.parse
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .artifacts import canonical_json_bytes, confined_path, write_canonical_json
from .config import INGESTION_SCHEMA_VERSION
from .models import Diagnostic, Evidence, digest_bytes, digest_wire
from .profiles import (
    DataIngestionProfile,
    EPIC_04_PROFESSION_SKILL_LISTS,
    EPIC_04_PROFILE_ID,
    EPIC_04_SOURCE_INDEX_TITLE,
)
from .skill_infobox import extract_skill_infobox_ids
from .skill_ids import SkillIdSource, enumerate_skill_ids
from .snapshots import LoadedSnapshot, SnapshotError, SnapshotStore
from .wikitext import disambiguation_preamble

RANGE_LINK_RE = re.compile(r"\[\[(/(?P<start>\d+)-(?P<end>\d+))\|[^\]]+]]")
SKILL_RANGE_TITLE_RE = re.compile(
    r"^Guild Wars Wiki:Game integration/Skills/(?P<start>\d+)-(?P<end>\d+)$"
)
PROFESSION_LIST_ROW_RE = re.compile(
    r"<tr\b(?=[^>]*\bdata-name=)[^>]*>(?P<row>.*?)</tr>",
    flags=re.IGNORECASE | re.DOTALL,
)
HTML_TH_RE = re.compile(r"<th\b[^>]*>(?P<content>.*?)</th>", flags=re.IGNORECASE | re.DOTALL)
HTML_LINK_RE = re.compile(
    r"<a\b(?P<attrs>[^>]*)\s*>(?P<label>.*?)</a\s*>",
    flags=re.IGNORECASE | re.DOTALL,
)
PROFESSION_LIST_TITLE_BY_ID = {
    profession_id: title for profession_id, _slug, title in EPIC_04_PROFESSION_SKILL_LISTS
}


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
    profession_list_snapshots: list[dict[str, Any]] | None = None,
    supplemental_seed_snapshots: list[dict[str, Any]] | None = None,
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

    range_seeds: list[dict[str, Any]] = []
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
        range_seeds.extend(_seed_record(record, source_kind="game-integration-range") for record in parsed)
        seed_diagnostics.extend(_downgrade_source_diagnostic(item) for item in parsed_diagnostics)

    profession_list_snapshots = profession_list_snapshots or []
    supplemental_seed_snapshots = supplemental_seed_snapshots or []
    profession_rows, profession_list_diagnostics = _profession_skill_rows_from_snapshots(
        profession_list_snapshots
    )
    diagnostics.extend(profession_list_diagnostics)
    accepted_seeds, unresolved_profession_titles, supplemental_diagnostics = _profession_list_seeds(
        range_seeds=range_seeds,
        profession_rows=profession_rows,
        supplemental_seed_snapshots=supplemental_seed_snapshots,
    )
    diagnostics.extend(supplemental_diagnostics)
    if not profession_rows:
        diagnostics.append(
            Diagnostic(
                code="SKILL_PROFESSION_LISTS_MISSING",
                severity="critical",
                message="EPIC-04 source plan did not include profession skill list rows.",
                category="invalid-source-reference",
                scope_kind="source",
                source_ids=tuple(PROFESSION_LIST_TITLE_BY_ID.values()),
                disposition="non-waivable",
            )
        )
    diagnostics.extend(seed_diagnostics)
    duplicate_id_diagnostics = _duplicate_id_diagnostics(accepted_seeds)
    diagnostics.extend(duplicate_id_diagnostics)
    accepted_seeds = _dedupe_seed_ids(accepted_seeds)
    accepted_seeds.sort(key=_seed_sort_key)

    coverage_gaps = _coverage_gaps([int(seed["skillId"]) for seed in range_seeds])
    accepted_seed_ids = {int(seed["skillId"]) for seed in accepted_seeds}
    supplemental_seed_count = sum(
        1 for seed in accepted_seeds if seed.get("idSourceKind") == "supplemental-infobox"
    )
    duplicate_title_count = _duplicate_count(
        str(seed["requestedTitle"]).strip().casefold() for seed in accepted_seeds
    )
    profession_list_page_identities = [
        {**_snapshot_identity(snapshot), "professionId": int(snapshot["professionId"])}
        for snapshot in profession_list_snapshots
    ]
    supplemental_seed_page_identities = [
        _snapshot_identity(snapshot) for snapshot in supplemental_seed_snapshots
    ]
    source_set_projection = {
        "index": _snapshot_identity(index_snapshot),
        "ranges": [_snapshot_identity(snapshots_by_title[title]) for title in ranged_titles if title in snapshots_by_title],
        "professionLists": profession_list_page_identities,
        "professionSkillRows": profession_rows,
        "rangeSeeds": range_seeds,
        "supplementalSeedPages": supplemental_seed_page_identities,
        "acceptedSeeds": accepted_seeds,
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
        "professionListPages": profession_list_page_identities,
        "professionSkillRows": profession_rows,
        "rangeSeeds": range_seeds,
        "supplementalSeedPages": supplemental_seed_page_identities,
        "acceptedSeeds": accepted_seeds,
        "unresolvedProfessionListTitles": unresolved_profession_titles,
        "summary": {
            "acceptedSeedCount": len(accepted_seeds),
            "minimumAcceptedId": min((int(seed["skillId"]) for seed in accepted_seeds), default=None),
            "maximumAcceptedId": max((int(seed["skillId"]) for seed in accepted_seeds), default=None),
            "numericGapCount": len(coverage_gaps),
            "duplicateRequestedTitleCount": duplicate_title_count,
            "professionListPageCount": len(profession_list_snapshots),
            "professionSkillRowCount": len(profession_rows),
            "rangeSeedCount": len(range_seeds),
            "rangeOnlySeedCount": len([seed for seed in range_seeds if int(seed["skillId"]) not in accepted_seed_ids]),
            "supplementalSeedCount": supplemental_seed_count,
            "unresolvedProfessionListTitleCount": len(unresolved_profession_titles),
            "sourceSetDigest": source_set_digest,
            "sourcePlanDigest": "pending",
        },
        "coverageGaps": coverage_gaps,
        "diagnostics": [_diagnostic_summary(item) for item in sorted(diagnostics, key=lambda item: item.stable_key())],
        "caps": {
            "seedPageLimit": len(ranged_titles) + 1 + len(profession_list_snapshots) + len(supplemental_seed_snapshots),
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
    summary = plan.get("summary")
    if isinstance(summary, dict) and int(summary.get("unresolvedProfessionListTitleCount", 0)) > 0:
        raise SkillSourceSetError("Source plan contains unresolved profession-list skill rows")


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


def profession_skill_rows_from_rendered_html(
    rendered_html: str,
    *,
    list_title: str,
    profession_id: int,
    source_reference: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[Diagnostic]]:
    rows: list[dict[str, Any]] = []
    diagnostics: list[Diagnostic] = []
    source_id = str(source_reference["id"])
    seen: dict[str, int] = {}
    for row_number, match in enumerate(PROFESSION_LIST_ROW_RE.finditer(rendered_html), start=1):
        table_headers = [item.group("content") for item in HTML_TH_RE.finditer(match.group("row"))]
        if len(table_headers) < 2:
            diagnostics.append(
                Diagnostic(
                    code="SKILL_PROFESSION_LIST_ROW_SHAPE",
                    severity="warning",
                    message="Profession skill list row did not include an icon and name header cell",
                    category="schema-shape-error",
                    scope_kind="source",
                    source_ids=(source_id,),
                    disposition="accepted-risk",
                )
            )
            continue
        link = _first_wiki_link(table_headers[1])
        if link is None:
            diagnostics.append(
                Diagnostic(
                    code="SKILL_PROFESSION_LIST_ROW_MISSING_LINK",
                    severity="warning",
                    message="Profession skill list row did not include a wiki skill link",
                    category="schema-shape-error",
                    scope_kind="source",
                    source_ids=(source_id,),
                    disposition="accepted-risk",
                )
            )
            continue
        requested_title = link["title"]
        key = _title_key(requested_title)
        if key in seen:
            diagnostics.append(
                Diagnostic(
                    code="SKILL_PROFESSION_LIST_DUPLICATE_ROW",
                    severity="warning",
                    message=f"Profession skill list duplicated row title: {requested_title}",
                    category="schema-shape-error",
                    scope_kind="source",
                    record_id=requested_title,
                    source_ids=(source_id,),
                    disposition="accepted-risk",
                )
            )
            continue
        seen[key] = row_number
        rows.append(
            {
                "professionId": profession_id,
                "name": link["label"] or requested_title,
                "requestedTitle": requested_title,
                "sourcePage": list_title,
                "sourceId": source_id,
                "rowNumber": row_number,
            }
        )
    return rows, sorted(diagnostics, key=lambda item: item.stable_key())


def _seed_record(record: dict[str, Any], *, source_kind: str) -> dict[str, Any]:
    return {
        "skillId": int(record["skillId"]),
        "templateId": int(record["skillId"]),
        "requestedTitle": str(record["title"]).strip(),
        "sourcePage": str(record["sourcePage"]),
        "sourceId": record["provenance"]["sources"][0]["id"],
        "lineNumber": int(record["lineNumber"]),
        "sourceKind": source_kind,
    }


def _profession_skill_rows_from_snapshots(
    profession_list_snapshots: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[Diagnostic]]:
    rows: list[dict[str, Any]] = []
    diagnostics: list[Diagnostic] = []
    seen_titles: set[str] = set()
    for snapshot in profession_list_snapshots:
        profession_id = int(snapshot["professionId"])
        list_title = str(snapshot["title"])
        parsed, parsed_diagnostics = profession_skill_rows_from_rendered_html(
            str(snapshot["content"]),
            list_title=list_title,
            profession_id=profession_id,
            source_reference=snapshot["sourceReference"],
        )
        diagnostics.extend(parsed_diagnostics)
        for row in parsed:
            global_key = f"{profession_id}:{_title_key(str(row['requestedTitle']))}"
            if global_key in seen_titles:
                continue
            seen_titles.add(global_key)
            rows.append(row)
    rows.sort(key=lambda item: (int(item["professionId"]), _title_key(str(item["requestedTitle"]))))
    return rows, sorted(diagnostics, key=lambda item: item.stable_key())


def _profession_list_seeds(
    *,
    range_seeds: list[dict[str, Any]],
    profession_rows: list[dict[str, Any]],
    supplemental_seed_snapshots: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[Diagnostic]]:
    range_seeds_by_title = _range_seeds_by_title(range_seeds)
    supplemental_pages = _supplemental_pages_by_title(supplemental_seed_snapshots)
    accepted: list[dict[str, Any]] = []
    accepted_ids: set[int] = set()
    unresolved: list[dict[str, Any]] = []
    diagnostics: list[Diagnostic] = []
    for row in profession_rows:
        title_key = _title_key(str(row["requestedTitle"]))
        range_seed = range_seeds_by_title.get(title_key)
        if range_seed is not None:
            seed = _profession_seed_from_range(row, range_seed)
        else:
            page = supplemental_pages.get(title_key)
            if page is None:
                unresolved.append(_unresolved_profession_row(row, "No supplemental detail page was fetched."))
                continue
            ids = extract_skill_infobox_ids(str(page["content"]))
            if len(ids) != 1:
                diagnostics.append(
                    Diagnostic(
                        code="SKILL_PROFESSION_LIST_ID_UNRESOLVED",
                        severity="error",
                        message=(
                            f"Profession-list skill {row['requestedTitle']} did not expose exactly "
                            f"one infobox id: {ids}"
                        ),
                        category="schema-shape-error",
                        scope_kind="record",
                        record_id=str(row["requestedTitle"]),
                        source_ids=(str(row["sourceId"]), str(page["sourceReference"]["id"])),
                    )
                )
                unresolved.append(
                    _unresolved_profession_row(row, "Supplemental detail page did not expose exactly one skill id.")
                )
                continue
            seed = _profession_seed_from_supplemental(row, page, skill_id=int(ids[0]))

        skill_id = int(seed["skillId"])
        if skill_id in accepted_ids:
            diagnostics.append(
                Diagnostic(
                    code="SKILL_PROFESSION_LIST_DUPLICATE_ID",
                    severity="warning",
                    message=f"Profession skill list row resolved to duplicate skill ID {skill_id}: {row['requestedTitle']}",
                    category="schema-shape-error",
                    scope_kind="record",
                    record_id=skill_id,
                    source_ids=(str(row["sourceId"]),),
                    disposition="accepted-risk",
                )
            )
            continue
        accepted.append(seed)
        accepted_ids.add(skill_id)
    accepted.sort(key=_seed_sort_key)
    unresolved.sort(key=lambda item: (int(item["professionId"]), str(item["requestedTitle"])))
    return accepted, unresolved, sorted(diagnostics, key=lambda item: item.stable_key())


def _range_seeds_by_title(range_seeds: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    selected: dict[str, dict[str, Any]] = {}
    for seed in sorted(range_seeds, key=_seed_sort_key):
        selected.setdefault(_title_key(str(seed["requestedTitle"])), seed)
    return selected


def _profession_seed_from_range(row: dict[str, Any], range_seed: dict[str, Any]) -> dict[str, Any]:
    return {
        "skillId": int(range_seed["skillId"]),
        "templateId": int(range_seed["templateId"]),
        "requestedTitle": str(row["requestedTitle"]),
        "sourcePage": str(row["sourcePage"]),
        "sourceId": str(row["sourceId"]),
        "lineNumber": int(row["rowNumber"]),
        "sourceKind": "profession-skill-list",
        "professionId": int(row["professionId"]),
        "idSourceKind": "game-integration-range",
        "idSourceId": str(range_seed["sourceId"]),
        "idSourcePage": str(range_seed["sourcePage"]),
        "idSourceLineNumber": int(range_seed["lineNumber"]),
        "idSourceRequestedTitle": str(range_seed["requestedTitle"]),
    }


def _profession_seed_from_supplemental(
    row: dict[str, Any],
    page: dict[str, Any],
    *,
    skill_id: int,
) -> dict[str, Any]:
    return {
        "skillId": skill_id,
        "templateId": skill_id,
        "requestedTitle": str(row["requestedTitle"]),
        "sourcePage": str(row["sourcePage"]),
        "sourceId": str(row["sourceId"]),
        "lineNumber": int(row["rowNumber"]),
        "sourceKind": "profession-skill-list",
        "professionId": int(row["professionId"]),
        "idSourceKind": "supplemental-infobox",
        "detailSourceId": str(page["sourceReference"]["id"]),
        "detailSourcePage": str(page["title"]),
    }


def _supplemental_pages_by_title(snapshots: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_title: dict[str, dict[str, Any]] = {}
    for snapshot in snapshots:
        titles = [
            snapshot.get("requestedTitle"),
            snapshot.get("normalizedTitle"),
            snapshot.get("canonicalTitle"),
            snapshot.get("title"),
        ]
        for title in titles:
            if isinstance(title, str) and title.strip():
                by_title[_title_key(title)] = snapshot
    return by_title


def _unresolved_profession_row(row: dict[str, Any], reason: str) -> dict[str, Any]:
    return {
        "professionId": int(row["professionId"]),
        "requestedTitle": str(row["requestedTitle"]),
        "sourcePage": str(row["sourcePage"]),
        "sourceId": str(row["sourceId"]),
        "rowNumber": int(row["rowNumber"]),
        "reason": reason,
    }


def _first_wiki_link(html_fragment: str) -> dict[str, str] | None:
    for match in HTML_LINK_RE.finditer(html_fragment):
        attrs = match.group("attrs")
        href = _html_attr(attrs, "href")
        if href is None or not href.startswith("/wiki/"):
            continue
        title = _wiki_href_to_title(href)
        if title is None:
            continue
        label = _html_text(match.group("label"))
        if title.casefold().endswith("/skill history") and label:
            title = label
        return {"title": title, "label": label}
    return None


def _html_attr(attrs: str, name: str) -> str | None:
    match = re.search(rf"""\b{re.escape(name)}\s*=\s*(["'])(?P<value>.*?)\1""", attrs, flags=re.IGNORECASE | re.DOTALL)
    if match is None:
        return None
    return html.unescape(match.group("value")).strip()


def _wiki_href_to_title(href: str) -> str | None:
    if not href.startswith("/wiki/"):
        return None
    path = href[len("/wiki/") :].split("#", 1)[0].split("?", 1)[0]
    if not path:
        return None
    return urllib.parse.unquote(path).replace("_", " ")


def _html_text(value: str) -> str:
    text = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def _title_key(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().replace("_", " ")).casefold()


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
    for seed in sorted(seeds, key=_seed_sort_key):
        skill_id = int(seed["skillId"])
        if skill_id in seen:
            continue
        seen.add(skill_id)
        selected.append(seed)
    return selected


def _seed_sort_key(seed: dict[str, Any]) -> tuple[int, int, str]:
    source_priority = 0 if str(seed.get("sourceKind")) == "game-integration-range" else 1
    return (int(seed["skillId"]), source_priority, str(seed["requestedTitle"]))


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
