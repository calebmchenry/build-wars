from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .artifacts import canonical_json_bytes, write_canonical_json
from .config import INGESTION_SCHEMA_VERSION
from .models import Diagnostic, Evidence, digest_bytes, digest_wire
from .profiles import (
    DataIngestionProfile,
    EPIC_10_PROFILE_ID,
    EPIC_10_RUNE_ICON_IMAGEINFO_TITLE,
    EPIC_10_SOURCE_TITLES,
)
from .snapshots import LoadedSnapshot, SnapshotError, SnapshotStore
from .wikitext import disambiguation_preamble


class RuneSourceSetError(RuntimeError):
    def __init__(self, message: str, diagnostics: list[Diagnostic] | None = None) -> None:
        super().__init__(message)
        self.diagnostics = diagnostics or []


@dataclass(frozen=True)
class RuneSourceSetBuildResult:
    plan: dict[str, Any]
    diagnostics: list[Diagnostic]


@dataclass(frozen=True)
class RuneSnapshotSetReplay:
    manifest: dict[str, Any]
    loaded_snapshots: list[LoadedSnapshot]


MODIFIER_ROW_RE = re.compile(r"^\*(?P<id>\d+)\s*-\s*(?P<value>.+?)\s*$", re.MULTILINE)
WIKI_LINK_RE = re.compile(r"\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]+))?]]")
RANKS = {"minor": "minor", "major": "major", "superior": "superior"}
COMMON_RUNE_FACTS = {
    "Rune of Attunement": {
        "familyKey": "attunement",
        "familyKind": "attunement",
        "familyRank": None,
        "rarityTier": "minor",
        "eligibility": "universal-armor",
    },
    "Rune of Vitae": {
        "familyKey": "vitae",
        "familyKind": "vitae",
        "familyRank": None,
        "rarityTier": "minor",
        "eligibility": "universal-armor",
    },
    "Rune of Recovery": {
        "familyKey": "condition:recovery",
        "familyKind": "condition-reduction",
        "familyRank": None,
        "rarityTier": "major",
        "eligibility": "universal-armor",
    },
    "Rune of Restoration": {
        "familyKey": "condition:restoration",
        "familyKind": "condition-reduction",
        "familyRank": None,
        "rarityTier": "major",
        "eligibility": "universal-armor",
    },
    "Rune of Clarity": {
        "familyKey": "condition:clarity",
        "familyKind": "condition-reduction",
        "familyRank": None,
        "rarityTier": "major",
        "eligibility": "universal-armor",
    },
    "Rune of Purity": {
        "familyKey": "condition:purity",
        "familyKind": "condition-reduction",
        "familyRank": None,
        "rarityTier": "major",
        "eligibility": "universal-armor",
    },
}
CONTAINER_RUNE_TITLES = ("Rune of Belt Holding", "Rune of Holding", "Superior Rune of Holding")


def source_plan_path(root: Path, digest: str) -> Path:
    return root / "work/runs/data-ingestion/epic-10/source-plans" / f"runes-{digest[:16]}.source-plan.json"


def snapshot_set_path(root: Path, digest: str) -> Path:
    return root / "work/runs/data-ingestion/epic-10/snapshot-sets" / f"runes-{digest[:16]}.snapshot-set.json"


def build_source_plan(
    *,
    profile: DataIngestionProfile,
    generated_at: str,
    source_snapshots: list[dict[str, Any]],
    dependency: Any,
) -> RuneSourceSetBuildResult:
    if profile.id != EPIC_10_PROFILE_ID:
        raise RuneSourceSetError(f"Rune source plans are only supported for {EPIC_10_PROFILE_ID}")

    diagnostics: list[Diagnostic] = []
    snapshots_by_title = {str(snapshot["title"]): snapshot for snapshot in source_snapshots}
    for title in EPIC_10_SOURCE_TITLES:
        if title not in snapshots_by_title:
            diagnostics.append(
                _diag(
                    "RUNE_SOURCE_AUTHORITY_PAGE_MISSING",
                    f"Required EPIC-10 source page was missing: {title}",
                    source_ids=(title,),
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    equipment_snapshot = snapshots_by_title.get("Equipment template format")
    rune_snapshot = snapshots_by_title.get("Rune")
    attribute_bonus_snapshot = snapshots_by_title.get("Attribute bonus")
    if equipment_snapshot is None or rune_snapshot is None or attribute_bonus_snapshot is None:
        plan = _empty_plan(profile, generated_at, source_snapshots, diagnostics)
        return RuneSourceSetBuildResult(plan=plan, diagnostics=diagnostics)

    attribute_index = _attribute_index(dependency.catalog)
    modifier_rows = modifier_rows_from_equipment_template(str(equipment_snapshot["content"]))
    accepted: list[dict[str, Any]] = []
    dispositions: list[dict[str, Any]] = []
    for row in modifier_rows:
        seed, seed_diagnostics = _seed_from_modifier_row(
            row,
            source_id=str(equipment_snapshot["sourceReference"]["id"]),
            attribute_index=attribute_index,
        )
        diagnostics.extend(seed_diagnostics)
        if seed is not None:
            accepted.append(seed)
        elif _looks_rune_like(row["name"]):
            dispositions.append(
                _disposition(
                    template_modifier_id=int(row["modifierId"]),
                    requested_title=str(row["name"]),
                    kind="unsupported",
                    reason="Rune-like equipment modifier row could not be represented by EPIC-10 schema v1.",
                    source_id=str(equipment_snapshot["sourceReference"]["id"]),
                    review_id="review:epic-10-source-set:2026-09-02",
                )
            )

    inventory_entries = armor_rune_inventory_entries(str(rune_snapshot["content"]))
    dispositions.extend(
        _inventory_relationships(
            inventory_entries=inventory_entries,
            accepted_titles={str(seed["requestedTitle"]) for seed in accepted},
            rune_source_id=str(rune_snapshot["sourceReference"]["id"]),
        )
    )
    dispositions.extend(
        _container_exclusions(
            rune_text=str(rune_snapshot["content"]),
            source_id=str(rune_snapshot["sourceReference"]["id"]),
        )
    )

    diagnostics.extend(_source_set_diagnostics(accepted, modifier_rows, dependency.catalog, source_snapshots))
    accepted = sorted(accepted, key=lambda item: (int(item["templateModifierId"]), str(item["requestedTitle"])))
    dispositions = sorted(dispositions, key=lambda item: (str(item["kind"]), str(item["requestedTitle"])))

    detail_titles = sorted({str(seed["detailTitle"]) for seed in accepted})
    source_set_projection = {
        "sourcePages": [_snapshot_identity(snapshot) for snapshot in sorted(source_snapshots, key=lambda item: str(item["title"]))],
        "dependency": _dependency_digest_projection(dependency),
        "acceptedSeeds": _drop_source_only(accepted),
        "runtimeDispositions": _drop_source_only(dispositions),
        "detailPageTitles": detail_titles,
    }
    source_set_digest = digest_bytes(canonical_json_bytes(source_set_projection))
    plan: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "profile": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "generatedAt": generated_at,
        "sourceAuthority": {
            "seedTitles": list(EPIC_10_SOURCE_TITLES),
            "policy": (
                "Equipment template modifier rows are the ID authority; Rune and Attribute bonus pages "
                "provide finite inventory, stacking, and headgear evidence; detail pages provide page identity."
            ),
            "excludedAuthorities": [
                "category crawl",
                "site search",
                "source-provided fetch URLs",
                "runtime wiki access",
            ],
        },
        "idPolicy": "Accepted player-usable armor runes require a unique verified templateModifierId.",
        "sourcePages": [_snapshot_identity(snapshot) for snapshot in sorted(source_snapshots, key=lambda item: str(item["title"]))],
        "dependencyDigests": [_dependency_digest_projection(dependency)],
        "acceptedSeeds": accepted,
        "runtimeDispositions": dispositions,
        "inventoryEntries": inventory_entries,
        "detailPageTitles": detail_titles,
        "summary": {
            "modifierRowCount": len(modifier_rows),
            "runeLikeModifierCount": len([row for row in modifier_rows if _looks_rune_like(row["name"])]),
            "acceptedRuneCount": len(accepted),
            "relationshipCount": len([item for item in dispositions if item["kind"] == "supported-relationship"]),
            "exclusionCount": len([item for item in dispositions if item["kind"] == "explicit-exclusion"]),
            "unsupportedCount": len([item for item in dispositions if item["kind"] == "unsupported"]),
            "blockingFindingCount": len(
                [item for item in diagnostics if item.severity in {"critical", "error"} and item.disposition in {"open", "non-waivable"}]
            ),
            "detailPageCount": len(detail_titles),
            "sourceSetDigest": source_set_digest,
            "sourcePlanDigest": "pending",
        },
        "diagnostics": [_diagnostic_summary(item) for item in sorted(diagnostics, key=lambda item: item.stable_key())],
        "caps": {
            "seedPageLimit": len(EPIC_10_SOURCE_TITLES),
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
    return RuneSourceSetBuildResult(plan=plan, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


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
        raise RuneSourceSetError(f"Rune source plan could not be read: {exc}") from exc
    if not isinstance(plan, dict):
        raise RuneSourceSetError("Rune source plan root must be an object")
    return plan


def validate_source_plan(
    plan: dict[str, Any],
    *,
    profile: DataIngestionProfile,
    confirm_source_set_digest: str,
) -> None:
    if plan.get("profile") != profile.id:
        raise RuneSourceSetError("Rune source plan profile does not match the selected profile")
    summary = plan.get("summary")
    if not isinstance(summary, dict):
        raise RuneSourceSetError("Rune source plan summary is missing")
    if summary.get("sourcePlanDigest") != source_plan_digest(plan):
        raise RuneSourceSetError("Rune source plan digest does not match its current contents")
    if summary.get("sourceSetDigest") != confirm_source_set_digest:
        raise RuneSourceSetError("Rune source-set digest confirmation did not match")
    seeds = plan.get("acceptedSeeds")
    if not isinstance(seeds, list) or not seeds:
        raise RuneSourceSetError("Rune source plan does not contain accepted rune seeds")
    if len(seeds) > profile.page_limit:
        raise RuneSourceSetError("Rune source plan exceeds the profile detail page cap")
    if int(summary.get("blockingFindingCount") or 0) > 0:
        raise RuneSourceSetError("Rune source plan has blocking findings")


def modifier_rows_from_equipment_template(text: str) -> list[dict[str, Any]]:
    section = _section(text, "Modifier IDs")
    rows: list[dict[str, Any]] = []
    for match in MODIFIER_ROW_RE.finditer(section):
        raw_value = match.group("value").strip()
        profession = _parenthetical_wiki_link(raw_value)
        name = _clean_markup(re.sub(r"\s*\(\[\[[^\]]+]]\)\s*$", "", raw_value)).strip()
        rows.append(
            {
                "modifierId": int(match.group("id")),
                "name": name,
                "rawName": raw_value,
                "professionLabel": profession,
                "sourceLine": _line_number(text, match.start()),
            }
        )
    return rows


def armor_rune_inventory_entries(text: str) -> list[dict[str, Any]]:
    section = _section(text, "List of armor runes", stop_heading="Container runes")
    entries: list[dict[str, Any]] = []
    for line_number, line in enumerate(section.splitlines(), start=1):
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        first_cell = stripped.split("||", 1)[0].strip("| ").strip()
        if "<Profession>" in first_cell:
            entries.append(
                {
                    "title": first_cell,
                    "kind": "abstract-attribute-family",
                    "sourceLine": line_number,
                }
            )
            continue
        link = WIKI_LINK_RE.search(first_cell)
        if link is None:
            continue
        title = link.group(1).strip()
        if "Rune" not in title:
            continue
        entries.append(
            {
                "title": title,
                "kind": "linked-rune-family",
                "sourceLine": line_number,
            }
        )
    return sorted(entries, key=lambda item: (str(item["kind"]), str(item["title"])))


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
                    "RUNE_DETAIL_PAGE_MISSING",
                    f"Rune detail page was missing for {requested}",
                    source_ids=(requested,),
                    record_id=int(seed["templateModifierId"]),
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
        raise RuneSourceSetError("Invalid rune snapshot-set completion state")
    children = []
    aggregate_payload_bytes = 0
    for manifest_path in sorted(set(child_manifest_paths)):
        loaded = snapshot_store.load_snapshot(_snapshot_store_manifest_path(manifest_path))
        source_ref = loaded.manifest.get("sourceReference")
        digest = loaded.manifest.get("digest")
        if not isinstance(source_ref, dict) or not isinstance(digest, dict):
            raise RuneSourceSetError("Child rune snapshot manifest lacked source reference or digest")
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


def load_snapshot_set(
    *,
    snapshot_set_manifest_path: Path,
    snapshot_root: Path,
    profile: DataIngestionProfile,
) -> RuneSnapshotSetReplay:
    try:
        manifest = json.loads(snapshot_set_manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuneSourceSetError(f"Rune snapshot-set manifest could not be read: {exc}") from exc
    if not isinstance(manifest, dict):
        raise RuneSourceSetError("Rune snapshot-set manifest root must be an object")
    if manifest.get("profile") != profile.id:
        raise RuneSourceSetError("Rune snapshot-set profile does not match the selected profile")
    if manifest.get("completionState") != "complete":
        raise RuneSourceSetError("Only complete EPIC-10 snapshot sets can replay or promote")
    source_plan = manifest.get("sourcePlan")
    if not isinstance(source_plan, dict) or source_plan.get("profile") != profile.id:
        raise RuneSourceSetError("Rune snapshot-set source plan is missing or mismatched")
    if manifest.get("sourcePlanDigest") != source_plan_digest(source_plan):
        raise RuneSourceSetError("Rune snapshot-set source-plan digest mismatch")
    children = manifest.get("childSnapshots")
    if not isinstance(children, list) or not children:
        raise RuneSourceSetError("Rune snapshot-set manifest has no child snapshots")
    if len(children) != manifest.get("expectedChildCount"):
        raise RuneSourceSetError("Rune snapshot-set child count does not match expectedChildCount")
    manifest_paths = [str(child.get("manifestPath")) for child in children if isinstance(child, dict)]
    if len(set(manifest_paths)) != len(manifest_paths):
        raise RuneSourceSetError("Rune snapshot-set manifest contains duplicate child snapshots")

    store = SnapshotStore(snapshot_root)
    loaded: list[LoadedSnapshot] = []
    for manifest_path in manifest_paths:
        try:
            loaded.append(store.load_snapshot(_snapshot_store_manifest_path(manifest_path)))
        except SnapshotError as exc:
            raise RuneSourceSetError(f"Rune snapshot-set child failed validation: {exc}") from exc

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
        raise RuneSourceSetError("Rune snapshot-set aggregate digest mismatch")
    return RuneSnapshotSetReplay(manifest=manifest, loaded_snapshots=loaded)


def page_snapshot_from_loaded(loaded: LoadedSnapshot) -> dict[str, Any]:
    payload = json.loads(loaded.payload.decode("utf-8"))
    if not isinstance(payload, dict):
        raise RuneSourceSetError("Rune snapshot payload root was not an object")
    source_ref = loaded.manifest.get("sourceReference")
    if not isinstance(source_ref, dict):
        raise RuneSourceSetError("Rune snapshot manifest was missing sourceReference")
    return {
        "title": str(payload.get("title")),
        "content": str(payload.get("content", "")),
        "pageId": payload.get("pageId"),
        "revisionId": payload.get("revisionId"),
        "timestamp": payload.get("timestamp"),
        "sourceReference": source_ref,
        "manifestPath": loaded.manifest.get("artifactPath"),
    }


def _seed_from_modifier_row(
    row: dict[str, Any],
    *,
    source_id: str,
    attribute_index: dict[str, dict[str, Any]],
) -> tuple[dict[str, Any] | None, list[Diagnostic]]:
    name = str(row["name"])
    if not name.startswith("Rune of "):
        return None, []
    diagnostics: list[Diagnostic] = []
    rank: str | None = None
    family_label = name.removeprefix("Rune of ")
    rank_match = re.match(r"^(Minor|Major|Superior)\s+(.+)$", family_label)
    if rank_match is not None:
        rank = RANKS[rank_match.group(1).casefold()]
        family_label = rank_match.group(2).strip()

    common = COMMON_RUNE_FACTS.get(name)
    if family_label == "Vigor" and rank is not None:
        fact = {
            "familyKey": "vigor",
            "familyKind": "vigor",
            "familyRank": rank,
            "rarityTier": rank,
            "eligibility": "universal-armor",
        }
        return _seed(row, name, family_label, fact, source_id, None, None), diagnostics
    if family_label == "Absorption" and rank is not None:
        fact = {
            "familyKey": "absorption",
            "familyKind": "absorption",
            "familyRank": rank,
            "rarityTier": rank,
            "eligibility": "profession-armor",
        }
        return _seed(row, name, family_label, fact, source_id, "Warrior", None), diagnostics
    if common is not None:
        return _seed(row, name, family_label, common, source_id, None, None), diagnostics

    attribute = attribute_index.get(_lookup_key(family_label))
    if attribute is None or rank is None:
        diagnostics.append(
            _diag(
                "RUNE_MODIFIER_UNSUPPORTED_FAMILY",
                f"Rune modifier row was not a supported armor-rune family: {name}",
                source_ids=(source_id,),
                record_id=int(row["modifierId"]),
                severity="warning",
                disposition="accepted-risk",
            )
        )
        return None, diagnostics
    profession = _profession_name_for_attribute(attribute)
    fact = {
        "familyKey": f"attribute:{_lookup_key(family_label)}",
        "familyKind": "attribute",
        "familyRank": rank,
        "rarityTier": rank,
        "eligibility": "profession-armor",
    }
    return _seed(row, name, family_label, fact, source_id, profession, str(attribute["name"])), diagnostics


def _seed(
    row: dict[str, Any],
    name: str,
    family_label: str,
    fact: dict[str, Any],
    source_id: str,
    profession_name: str | None,
    attribute_name: str | None,
) -> dict[str, Any]:
    return {
        "sourceKey": f"equipment-modifier:{int(row['modifierId'])}",
        "templateModifierId": int(row["modifierId"]),
        "requestedTitle": name,
        "detailTitle": name,
        "normalizedName": _lookup_key(name),
        "familyLabel": family_label,
        "familyKey": fact["familyKey"],
        "familyKind": fact["familyKind"],
        "familyRank": fact["familyRank"],
        "rarityTier": fact["rarityTier"],
        "eligibility": fact["eligibility"],
        "professionName": profession_name,
        "affectedAttributeName": attribute_name,
        "sourceId": source_id,
        "sourceLine": int(row["sourceLine"]),
    }


def _inventory_relationships(
    *,
    inventory_entries: list[dict[str, Any]],
    accepted_titles: set[str],
    rune_source_id: str,
) -> list[dict[str, Any]]:
    dispositions: list[dict[str, Any]] = []
    for entry in inventory_entries:
        title = str(entry["title"])
        if title in accepted_titles:
            continue
        if title.startswith("<Profession> Rune"):
            dispositions.append(
                _disposition(
                    template_modifier_id=None,
                    requested_title=title,
                    kind="supported-relationship",
                    reason="Rune inventory row is an abstract family pattern resolved through equipment-template modifier rows.",
                    source_id=rune_source_id,
                    review_id="review:epic-10-source-set:2026-09-02",
                )
            )
        elif title.startswith("Warrior Rune of"):
            dispositions.append(
                _disposition(
                    template_modifier_id=None,
                    requested_title=title,
                    kind="supported-relationship",
                    reason="Rune inventory display title maps to Rune-of form used by equipment-template modifier IDs.",
                    source_id=rune_source_id,
                    review_id="review:epic-10-source-set:2026-09-02",
                )
            )
    return dispositions


def _container_exclusions(rune_text: str, source_id: str) -> list[dict[str, Any]]:
    found = {link.group(1).strip() for link in WIKI_LINK_RE.finditer(_section(rune_text, "Container runes"))}
    titles = sorted(found.intersection(CONTAINER_RUNE_TITLES))
    return [
        _disposition(
            template_modifier_id=None,
            requested_title=title,
            kind="explicit-exclusion",
            reason="Container rune upgrades bags or belt pouches and is not a player armor rune.",
            source_id=source_id,
            review_id="review:epic-10-source-set:2026-09-02",
        )
        for title in titles
    ]


def _source_set_diagnostics(
    accepted: list[dict[str, Any]],
    modifier_rows: list[dict[str, Any]],
    dependency_catalog: dict[str, Any],
    source_snapshots: list[dict[str, Any]],
) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    if not accepted:
        diagnostics.append(
            _diag(
                "RUNE_SOURCE_SET_EMPTY",
                "Rune source-set planning produced zero accepted armor runes",
                severity="critical",
                disposition="non-waivable",
            )
        )
    _duplicates(
        [int(seed["templateModifierId"]) for seed in accepted],
        "RUNE_SOURCE_DUPLICATE_TEMPLATE_MODIFIER_ID",
        "Duplicate accepted template modifier ID in rune source set",
        diagnostics,
    )
    _duplicates(
        [str(seed["normalizedName"]) for seed in accepted],
        "RUNE_SOURCE_DUPLICATE_NORMALIZED_NAME",
        "Duplicate accepted rune lookup key in rune source set",
        diagnostics,
    )
    if len(accepted) > len(modifier_rows):
        diagnostics.append(
            _diag(
                "RUNE_SOURCE_ACCOUNTING_OVERFLOW",
                "Accepted rune count exceeded parsed modifier rows",
                severity="critical",
                disposition="non-waivable",
            )
        )
    missing_attribute_variants = _missing_attribute_variants(accepted, dependency_catalog)
    if missing_attribute_variants:
        fixture_mode = any("fixture" in str(snapshot["sourceReference"].get("id", "")) for snapshot in source_snapshots)
        diagnostics.append(
            _diag(
                "RUNE_SOURCE_EXPECTED_ATTRIBUTE_VARIANTS",
                f"Attribute-rune source set is missing expected variants: {', '.join(missing_attribute_variants[:8])}",
                severity="info" if fixture_mode else "critical",
                disposition="resolved" if fixture_mode else "non-waivable",
            )
        )
    diagnostics.append(
        _diag(
            "RUNE_SOURCE_SHAPE_CHECKPOINT",
            "Bounded EPIC-10 source authority contains equipment modifier IDs, rune inventory/stacking evidence, and headgear handoff evidence.",
            severity="info",
            disposition="resolved",
        )
    )
    return diagnostics


def _missing_attribute_variants(accepted: list[dict[str, Any]], dependency_catalog: dict[str, Any]) -> list[str]:
    present = {
        (str(seed.get("affectedAttributeName")), str(seed.get("familyRank")))
        for seed in accepted
        if seed.get("familyKind") == "attribute"
    }
    missing = []
    for attribute in dependency_catalog.get("attributes", []):
        name = str(attribute.get("name"))
        for rank in ("minor", "major", "superior"):
            if (name, rank) not in present:
                missing.append(f"{rank}:{name}")
    return missing


def _detail_record_manifest(detail_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = []
    for record in detail_records:
        result.append(
            {
                "sourceKey": str(record["sourceKey"]),
                "templateModifierId": int(record["templateModifierId"]),
                "requestedTitle": str(record["requestedTitle"]),
                "detailTitle": str(record["detailTitle"]),
                "normalizedName": str(record["normalizedName"]),
                "familyLabel": str(record["familyLabel"]),
                "familyKey": str(record["familyKey"]),
                "familyKind": str(record["familyKind"]),
                "familyRank": record.get("familyRank"),
                "rarityTier": record.get("rarityTier"),
                "eligibility": str(record["eligibility"]),
                "professionName": record.get("professionName"),
                "affectedAttributeName": record.get("affectedAttributeName"),
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
    return sorted(result, key=lambda item: (int(item["templateModifierId"]), str(item["canonicalTitle"])))


def _validate_snapshot_set_children(manifest: dict[str, Any], loaded: list[LoadedSnapshot]) -> None:
    source_plan = manifest["sourcePlan"]
    detail_records = manifest.get("detailRecords")
    if not isinstance(detail_records, list) or not detail_records:
        raise RuneSourceSetError("Rune snapshot-set detail records are missing")
    required_titles = {str(page["title"]) for page in source_plan.get("sourcePages", []) if isinstance(page, dict)}
    required_titles.update(str(record["canonicalTitle"]) for record in detail_records if isinstance(record, dict))
    required_titles.add(EPIC_10_RUNE_ICON_IMAGEINFO_TITLE)
    child_titles = set()
    for child in manifest.get("childSnapshots", []):
        if isinstance(child, dict) and child.get("pageTitle") is not None:
            child_titles.add(str(child["pageTitle"]))
    extra = sorted(child_titles - required_titles)
    if extra:
        raise RuneSourceSetError(f"Rune snapshot-set contains extra child page titles: {', '.join(extra)}")
    missing = sorted(required_titles - child_titles)
    if missing:
        raise RuneSourceSetError(f"Rune snapshot-set is missing required child page titles: {', '.join(missing)}")
    if not loaded:
        raise RuneSourceSetError("Rune snapshot-set loaded no child snapshots")


def _empty_plan(
    profile: DataIngestionProfile,
    generated_at: str,
    source_snapshots: list[dict[str, Any]],
    diagnostics: list[Diagnostic],
) -> dict[str, Any]:
    plan: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "profile": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "generatedAt": generated_at,
        "sourceAuthority": {"seedTitles": list(EPIC_10_SOURCE_TITLES), "policy": "missing", "excludedAuthorities": []},
        "idPolicy": "Accepted player-usable armor runes require a unique verified templateModifierId.",
        "sourcePages": [_snapshot_identity(snapshot) for snapshot in source_snapshots],
        "dependencyDigests": [],
        "acceptedSeeds": [],
        "runtimeDispositions": [],
        "inventoryEntries": [],
        "detailPageTitles": [],
        "summary": {
            "modifierRowCount": 0,
            "runeLikeModifierCount": 0,
            "acceptedRuneCount": 0,
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


def _attribute_index(catalog: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {_lookup_key(str(attribute["name"])): attribute for attribute in catalog.get("attributes", [])}


def _profession_name_for_attribute(attribute: dict[str, Any]) -> str | None:
    profession_id = attribute.get("professionId")
    return str(attribute.get("professionName") or _profession_name_by_id(attribute, profession_id))


def _profession_name_by_id(attribute: dict[str, Any], profession_id: object) -> str | None:
    # Live and fixture EPIC-03 records carry only the profession ID; the caller joins the exact
    # profession name later through the dependency catalog.
    names_by_id = {
        1: "Warrior",
        2: "Ranger",
        3: "Monk",
        4: "Necromancer",
        5: "Mesmer",
        6: "Elementalist",
        7: "Assassin",
        8: "Ritualist",
        9: "Paragon",
        10: "Dervish",
    }
    try:
        return names_by_id[int(profession_id)]  # type: ignore[arg-type]
    except (TypeError, ValueError, KeyError):
        return None


def _dependency_digest_projection(dependency: Any) -> dict[str, Any]:
    return {
        "id": "epic-03-professions-attributes",
        "catalogVersion": str(dependency.catalog["catalogVersion"]),
        "artifactDigest": dependency.artifact_digest,
        "manifestDigest": dependency.manifest_digest,
        "qaGate": dependency.qa_gate,
        "sectionDigests": dependency.catalog["sectionDigests"],
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


def _drop_source_only(value: Any) -> Any:
    if isinstance(value, list):
        return [_drop_source_only(item) for item in value]
    if isinstance(value, dict):
        return {key: _drop_source_only(item) for key, item in value.items() if key not in {"sourceLine"}}
    return value


def _disposition(
    *,
    template_modifier_id: int | None,
    requested_title: str,
    kind: str,
    reason: str,
    source_id: str,
    review_id: str,
) -> dict[str, Any]:
    key = _lookup_key(requested_title)
    return {
        "id": f"disposition:rune:{template_modifier_id if template_modifier_id is not None else key}:{kind}",
        "templateModifierId": template_modifier_id,
        "requestedTitle": requested_title,
        "kind": kind,
        "reason": reason,
        "reviewId": review_id,
        "provenance": {
            "sourceIds": [source_id],
            "claimIds": [f"claim:rune-source-set:{key}:{kind}"],
            "reviewIds": [review_id],
            "notes": None,
        },
    }


def _section(text: str, heading: str, *, stop_heading: str | None = None) -> str:
    start = re.search(rf"^==\s*{re.escape(heading)}\s*==\s*$", text, flags=re.MULTILINE | re.IGNORECASE)
    if start is None:
        return ""
    remaining = text[start.end() :]
    if stop_heading is not None:
        stop = re.search(rf"^==\s*{re.escape(stop_heading)}\s*==\s*$", remaining, flags=re.MULTILINE | re.IGNORECASE)
    else:
        stop = re.search(r"^==[^=].*==\s*$", remaining, flags=re.MULTILINE)
    return remaining[: stop.start()] if stop is not None else remaining


def _clean_markup(value: str) -> str:
    def replace_link(match: re.Match[str]) -> str:
        return (match.group(2) or match.group(1)).strip()

    result = WIKI_LINK_RE.sub(replace_link, value)
    result = re.sub(r"<[^>]+>", "", result)
    result = re.sub(r"\{\{[^{}]*}}", "", result)
    result = re.sub(r"''+", "", result)
    return re.sub(r"\s+", " ", result).strip()


def _parenthetical_wiki_link(value: str) -> str | None:
    match = re.search(r"\(\[\[([^|\]]+)(?:\|[^\]]+)?]]\)", value)
    if match is None:
        return None
    return match.group(1).strip()


def _looks_rune_like(name: str) -> bool:
    return "rune" in name.casefold()


def _lookup_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")


def _line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def _duplicates(values: list[Any], code: str, message: str, diagnostics: list[Diagnostic]) -> None:
    counts = Counter(values)
    for value, count in counts.items():
        if count > 1:
            diagnostics.append(
                _diag(
                    code,
                    f"{message}: {value} appeared {count} times",
                    record_id=value,
                    severity="critical",
                    disposition="non-waivable",
                )
            )


def _diagnostic_summary(diagnostic: Diagnostic) -> dict[str, Any]:
    return {
        "code": diagnostic.code,
        "severity": diagnostic.severity,
        "recordId": diagnostic.record_id,
        "fieldPath": diagnostic.field_path,
        "disposition": diagnostic.disposition,
        "message": diagnostic.message,
    }


def _diag(
    code: str,
    message: str,
    *,
    source_ids: tuple[str, ...] = (),
    record_id: str | int | None = None,
    severity: str,
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


def _snapshot_store_manifest_path(manifest_path: str) -> Path:
    path = Path(manifest_path)
    parts = path.parts
    prefix = ("data", "source-snapshots")
    if len(parts) >= 2 and parts[:2] == prefix:
        return Path(*parts[2:])
    return path


def _first_revision(page: dict[str, Any]) -> dict[str, Any]:
    revisions = page.get("revisions")
    if isinstance(revisions, list) and revisions and isinstance(revisions[0], dict):
        return revisions[0]
    raise RuneSourceSetError(f"MediaWiki page did not include revision metadata: {page.get('title')}")


def _revision_content(revision: dict[str, Any]) -> str:
    slots = revision.get("slots")
    if isinstance(slots, dict):
        main = slots.get("main")
        if isinstance(main, dict) and isinstance(main.get("content"), str):
            return main["content"]
    if isinstance(revision.get("content"), str):
        return revision["content"]
    raise RuneSourceSetError("MediaWiki revision did not include content")
