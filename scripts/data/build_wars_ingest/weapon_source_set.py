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
from .profiles import DataIngestionProfile, EPIC_12_PROFILE_ID, EPIC_12_SOURCE_TITLES
from .snapshots import LoadedSnapshot, SnapshotError, SnapshotStore
from .source_set_protocol import SourceSetProtocolError, confined_child_path, require_matching_digest, require_unique_values
from .weapon_identity import (
    WeaponIdentityRegistry,
    identity_for_source_key,
    load_weapon_base_registry,
    load_weapon_mod_registry,
    validate_registry_against_source_keys,
)
from .wikitext import disambiguation_preamble


class WeaponSourceSetError(RuntimeError):
    def __init__(self, message: str, diagnostics: list[Diagnostic] | None = None) -> None:
        super().__init__(message)
        self.diagnostics = diagnostics or []


@dataclass(frozen=True)
class WeaponSourceSetBuildResult:
    plan: dict[str, Any]
    diagnostics: list[Diagnostic]


@dataclass(frozen=True)
class WeaponSnapshotSetReplay:
    manifest: dict[str, Any]
    loaded_snapshots: list[LoadedSnapshot]


SOURCE_REVIEW_ID = "review:epic-12-source-set:2026-09-02"
SOURCE_AUTHORITY_VERSION = "epic-12-source-authority-v1"
AUTHORITY_POLICY = (
    "Equipment template format supplies raw item/modifier ID row evidence; Weapon and reviewed "
    "weapon-family pages supply family, handedness, damage, requirement, mode, and slot facts; "
    "Weapon upgrade, Inscription, Staff Head, and Staff Wrapping pages supply modifier slot, "
    "applicability, and mechanics facts; EPIC-03 supplies profession/attribute joins."
)
ID_POLICY = (
    "Public WeaponId and WeaponModifierId values are schema-owned registry allocations keyed by "
    "reviewed sourceKey and variantKey. Raw template item/modifier IDs are crosswalk facts only."
)
EPIC_12_ICON_IMAGEINFO_TITLE = "EPIC-12 weapon and mod icon imageinfo"

MARTIAL_FAMILIES = ("axe", "sword", "hammer", "longbow", "daggers", "scythe", "spear")
CASTER_FAMILIES = ("wand", "staff", "focus")
ALL_WEAPON_FAMILIES = (*MARTIAL_FAMILIES, *CASTER_FAMILIES, "shield")


BASE_DEFINITIONS: tuple[dict[str, Any], ...] = (
    {
        "sourceKey": "weapon-base:axe",
        "variantKey": "axe",
        "name": "Axe",
        "detailTitle": "Axe",
        "familyKey": "axe",
        "family": "Axe",
        "variant": None,
        "equipRole": "main-hand",
        "handedness": "one-handed",
        "templateItemIds": [201],
        "damage": {"kind": "fixed-range", "minimum": 6, "maximum": 28, "damageType": "slashing"},
        "requirement": {"kind": "attribute-rank", "attributeName": "Axe Mastery", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:sword",
        "variantKey": "sword",
        "name": "Sword",
        "detailTitle": "Sword",
        "familyKey": "sword",
        "family": "Sword",
        "variant": None,
        "equipRole": "main-hand",
        "handedness": "one-handed",
        "templateItemIds": [279],
        "damage": {"kind": "fixed-range", "minimum": 15, "maximum": 22, "damageType": "slashing"},
        "requirement": {"kind": "attribute-rank", "attributeName": "Swordsmanship", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:hammer",
        "variantKey": "hammer",
        "name": "Hammer",
        "detailTitle": "Hammer",
        "familyKey": "hammer",
        "family": "Hammer",
        "variant": None,
        "equipRole": "two-hand",
        "handedness": "two-handed",
        "templateItemIds": [202],
        "damage": {"kind": "fixed-range", "minimum": 19, "maximum": 35, "damageType": "blunt"},
        "requirement": {"kind": "attribute-rank", "attributeName": "Hammer Mastery", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:longbow",
        "variantKey": "longbow",
        "name": "Longbow",
        "detailTitle": "Longbow",
        "familyKey": "longbow",
        "family": "Bow",
        "variant": "longbow",
        "equipRole": "two-hand",
        "handedness": "two-handed",
        "templateItemIds": [203],
        "damage": {"kind": "fixed-range", "minimum": 15, "maximum": 28, "damageType": "piercing"},
        "requirement": {"kind": "attribute-rank", "attributeName": "Marksmanship", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:daggers",
        "variantKey": "daggers",
        "name": "Daggers",
        "detailTitle": "Daggers",
        "familyKey": "daggers",
        "family": "Daggers",
        "variant": None,
        "equipRole": "main-hand",
        "handedness": "one-handed",
        "templateItemIds": [204],
        "damage": {"kind": "fixed-range", "minimum": 7, "maximum": 17, "damageType": "piercing"},
        "requirement": {"kind": "attribute-rank", "attributeName": "Dagger Mastery", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:scythe",
        "variantKey": "scythe",
        "name": "Scythe",
        "detailTitle": "Scythe",
        "familyKey": "scythe",
        "family": "Scythe",
        "variant": None,
        "equipRole": "two-hand",
        "handedness": "two-handed",
        "templateItemIds": [205],
        "damage": {"kind": "fixed-range", "minimum": 9, "maximum": 41, "damageType": "slashing"},
        "requirement": {"kind": "attribute-rank", "attributeName": "Scythe Mastery", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:spear",
        "variantKey": "spear",
        "name": "Spear",
        "detailTitle": "Spear",
        "familyKey": "spear",
        "family": "Spear",
        "variant": None,
        "equipRole": "main-hand",
        "handedness": "one-handed",
        "templateItemIds": [206],
        "damage": {"kind": "fixed-range", "minimum": 14, "maximum": 27, "damageType": "piercing"},
        "requirement": {"kind": "attribute-rank", "attributeName": "Spear Mastery", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:wand",
        "variantKey": "wand",
        "name": "Wand",
        "detailTitle": "Wand",
        "familyKey": "wand",
        "family": "Wand",
        "variant": None,
        "equipRole": "main-hand",
        "handedness": "one-handed",
        "templateItemIds": [207],
        "damage": {"kind": "fixed-range", "minimum": 11, "maximum": 22, "damageType": "elemental"},
        "requirement": {"kind": "attribute-rank", "attributeName": "Energy Storage", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:staff",
        "variantKey": "staff",
        "name": "Staff",
        "detailTitle": "Staff",
        "familyKey": "staff",
        "family": "Staff",
        "variant": None,
        "equipRole": "two-hand",
        "handedness": "two-handed",
        "templateItemIds": [208],
        "damage": {"kind": "fixed-range", "minimum": 11, "maximum": 22, "damageType": "elemental"},
        "requirement": {"kind": "attribute-rank", "attributeName": "Energy Storage", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:focus",
        "variantKey": "focus",
        "name": "Focus",
        "detailTitle": "Focus item",
        "familyKey": "focus",
        "family": "Focus",
        "variant": None,
        "equipRole": "off-hand",
        "handedness": "off-hand",
        "templateItemIds": [209],
        "damage": {"kind": "not-applicable", "reason": "Focus items are off-hand caster equipment, not weapon-damage sources."},
        "requirement": {"kind": "attribute-rank", "attributeName": "Energy Storage", "rank": 12},
    },
    {
        "sourceKey": "weapon-base:shield",
        "variantKey": "shield",
        "name": "Shield",
        "detailTitle": "Shield",
        "familyKey": "shield",
        "family": "Shield",
        "variant": None,
        "equipRole": "off-hand",
        "handedness": "off-hand",
        "templateItemIds": [210],
        "damage": {"kind": "not-applicable", "reason": "Shields supply armor/effects instead of weapon damage."},
        "requirement": {"kind": "attribute-rank", "attributeName": "Strength", "rank": 12},
    },
)

MOD_DEFINITIONS: tuple[dict[str, Any], ...] = (
    {
        "sourceKey": "weapon-modifier:sundering-prefix",
        "variantKey": "sundering-prefix",
        "name": "Sundering Weapon Prefix",
        "detailTitle": "Upgrade component",
        "familyKey": "sundering",
        "family": "weapon-prefix",
        "occupiedSlot": "prefix",
        "applicability": {"kind": "specific-families", "familyKeys": list(MARTIAL_FAMILIES)},
        "templateModifierIds": [190],
        "rawEffects": [{"kind": "armor-penetration", "amount": 20, "unit": "percent", "target": "weapon-damage"}],
    },
    {
        "sourceKey": "weapon-modifier:fortitude-suffix",
        "variantKey": "fortitude-suffix",
        "name": "Fortitude Weapon Suffix",
        "detailTitle": "Upgrade component",
        "familyKey": "fortitude",
        "family": "weapon-suffix",
        "occupiedSlot": "suffix",
        "applicability": {"kind": "universal", "reason": "Reviewed v1 suffix fixture is usable across modeled weapon/offhand records."},
        "templateModifierIds": [204],
        "rawEffects": [{"kind": "maximum-health-delta", "amount": 30, "unit": "health", "target": "character"}],
    },
    {
        "sourceKey": "weapon-modifier:i-have-the-power-inscription",
        "variantKey": "i-have-the-power-inscription",
        "name": "I Have the Power!",
        "detailTitle": "Inscription",
        "familyKey": "inscription:i-have-the-power",
        "family": "inscription",
        "occupiedSlot": "inscription",
        "applicability": {"kind": "universal", "reason": "Reviewed inscription fixture is a generic inscription compatibility case."},
        "templateModifierIds": [329],
        "rawEffects": [{"kind": "maximum-energy-delta", "amount": 5, "unit": "energy", "target": "character"}],
    },
    {
        "sourceKey": "weapon-modifier:fiery-prefix",
        "variantKey": "fiery-prefix",
        "name": "Fiery Weapon Prefix",
        "detailTitle": "Upgrade component",
        "familyKey": "fiery",
        "family": "weapon-prefix",
        "occupiedSlot": "prefix",
        "applicability": {"kind": "specific-families", "familyKeys": list(MARTIAL_FAMILIES)},
        "templateModifierIds": [391],
        "rawEffects": [{"kind": "damage-type-conversion", "damageType": "fire", "scope": "weapon-damage"}],
    },
    {
        "sourceKey": "weapon-modifier:staff-head-insightful",
        "variantKey": "staff-head-insightful",
        "name": "Insightful Staff Head",
        "detailTitle": "Staff Head",
        "familyKey": "staff-head:insightful",
        "family": "staff-head",
        "occupiedSlot": "staff-head",
        "applicability": {"kind": "specific-families", "familyKeys": ["staff"]},
        "templateModifierIds": [392],
        "rawEffects": [{"kind": "maximum-energy-delta", "amount": 5, "unit": "energy", "target": "character"}],
    },
    {
        "sourceKey": "weapon-modifier:staff-wrapping-enchanting",
        "variantKey": "staff-wrapping-enchanting",
        "name": "Staff Wrapping of Enchanting",
        "detailTitle": "Staff Wrapping",
        "familyKey": "staff-wrapping:enchanting",
        "family": "staff-wrapping",
        "occupiedSlot": "staff-wrapping",
        "applicability": {"kind": "specific-families", "familyKeys": ["staff"]},
        "templateModifierIds": [393],
        "rawEffects": [{"kind": "enchantment-duration-delta", "amount": 20, "unit": "percent", "target": "enchantment-duration"}],
    },
    {
        "sourceKey": "weapon-modifier:shield-handle-fortitude",
        "variantKey": "shield-handle-fortitude",
        "name": "Shield Handle of Fortitude",
        "detailTitle": "Shield",
        "familyKey": "shield-handle:fortitude",
        "family": "shield-offhand",
        "occupiedSlot": "shield-handle",
        "applicability": {"kind": "specific-families", "familyKeys": ["shield"]},
        "templateModifierIds": [394],
        "rawEffects": [{"kind": "maximum-health-delta", "amount": 30, "unit": "health", "target": "character"}],
    },
    {
        "sourceKey": "weapon-modifier:focus-core-aptitude",
        "variantKey": "focus-core-aptitude",
        "name": "Focus Core of Aptitude",
        "detailTitle": "Focus item",
        "familyKey": "focus-core:aptitude",
        "family": "caster",
        "occupiedSlot": "focus-core",
        "applicability": {"kind": "specific-families", "familyKeys": ["focus"]},
        "templateModifierIds": [395],
        "rawEffects": [
            {
                "kind": "casting-time-chance",
                "probabilityPercent": 20,
                "magnitudePercent": 50,
                "subject": "spells",
                "scope": "equipped-focus",
            }
        ],
    },
    {
        "sourceKey": "weapon-modifier:mastery-chance-suffix",
        "variantKey": "mastery-chance-suffix",
        "name": "Weapon Mastery Suffix",
        "detailTitle": "Upgrade component",
        "familyKey": "mastery-chance",
        "family": "weapon-suffix",
        "occupiedSlot": "suffix",
        "applicability": {"kind": "specific-families", "familyKeys": ["sword"]},
        "templateModifierIds": [396],
        "rawEffects": [
            {
                "kind": "note-only",
                "noteCode": "mastery-effect-deferred",
                "text": "Chance-based mastery behavior is preserved for EPIC-21 instead of guessed arithmetic.",
            }
        ],
    },
)


def source_plan_path(root: Path, digest: str) -> Path:
    return root / "work/runs/data-ingestion/epic-12/source-plans" / f"weapons-mods-{digest[:16]}.source-plan.json"


def snapshot_set_path(root: Path, digest: str) -> Path:
    return root / "work/runs/data-ingestion/epic-12/snapshot-sets" / f"weapons-mods-{digest[:16]}.snapshot-set.json"


def build_source_plan(
    *,
    profile: DataIngestionProfile,
    generated_at: str,
    source_snapshots: list[dict[str, Any]],
    dependency: Any,
    base_registry: WeaponIdentityRegistry | None = None,
    mod_registry: WeaponIdentityRegistry | None = None,
) -> WeaponSourceSetBuildResult:
    if profile.id != EPIC_12_PROFILE_ID:
        raise WeaponSourceSetError(f"Weapon source plans are only supported for {EPIC_12_PROFILE_ID}")

    base_registry = base_registry or load_weapon_base_registry()
    mod_registry = mod_registry or load_weapon_mod_registry()
    diagnostics: list[Diagnostic] = []
    snapshots_by_title = {str(snapshot["title"]): snapshot for snapshot in source_snapshots}
    for title in EPIC_12_SOURCE_TITLES:
        if title not in snapshots_by_title:
            diagnostics.append(
                _diag(
                    "WEAPON_SOURCE_AUTHORITY_PAGE_MISSING",
                    f"Required EPIC-12 source page was missing: {title}",
                    source_ids=(title,),
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    if diagnostics:
        plan = _empty_plan(profile, generated_at, source_snapshots, diagnostics, base_registry, mod_registry)
        return WeaponSourceSetBuildResult(plan=plan, diagnostics=diagnostics)

    source_id_by_title = {
        title: str(snapshot["sourceReference"]["id"])
        for title, snapshot in snapshots_by_title.items()
        if isinstance(snapshot.get("sourceReference"), dict)
    }
    equipment_source_id = source_id_by_title["Equipment template format"]
    weapon_source_id = source_id_by_title["Weapon"]
    upgrade_source_id = source_id_by_title["Weapon upgrade"]
    inscription_source_id = source_id_by_title["Inscription"]

    base_rows = weapon_item_rows_from_equipment_template(str(snapshots_by_title["Equipment template format"]["content"]))
    modifier_rows = weapon_modifier_rows_from_equipment_template(str(snapshots_by_title["Equipment template format"]["content"]))
    weapon_bases = _base_seeds(base_registry, equipment_source_id, weapon_source_id)
    weapon_modifiers = _modifier_seeds(mod_registry, equipment_source_id, upgrade_source_id, inscription_source_id)
    diagnostics.extend(validate_registry_against_source_keys(base_registry, [str(seed["sourceKey"]) for seed in weapon_bases]))
    diagnostics.extend(validate_registry_against_source_keys(mod_registry, [str(seed["sourceKey"]) for seed in weapon_modifiers]))
    diagnostics.extend(_source_set_diagnostics(weapon_bases, weapon_modifiers, profile, source_snapshots, dependency.catalog))
    dispositions = _runtime_dispositions(equipment_source_id, weapon_source_id, upgrade_source_id, inscription_source_id)
    detail_titles = sorted(
        {str(seed["detailTitle"]) for seed in [*weapon_bases, *weapon_modifiers]}
        | {"Staff Head", "Staff Wrapping"}
    )
    source_set_projection = {
        "sourcePages": [_snapshot_identity(snapshot) for snapshot in sorted(source_snapshots, key=lambda item: str(item["title"]))],
        "dependency": _dependency_digest_projection(dependency),
        "acceptedWeaponBases": _drop_source_only(weapon_bases),
        "acceptedWeaponModifiers": _drop_source_only(weapon_modifiers),
        "runtimeDispositions": _drop_source_only(dispositions),
        "detailPageTitles": detail_titles,
        "baseIdentityRegistryDigest": base_registry.digest,
        "modIdentityRegistryDigest": mod_registry.digest,
        "sourceAuthorityVersion": SOURCE_AUTHORITY_VERSION,
        "authorityPolicy": AUTHORITY_POLICY,
        "idPolicy": ID_POLICY,
    }
    source_set_digest = digest_bytes(canonical_json_bytes(source_set_projection))
    blocking_count = len(
        [
            item
            for item in diagnostics
            if item.severity in {"critical", "error"} and item.disposition in {"open", "non-waivable"}
        ]
    )
    plan: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "profile": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "generatedAt": generated_at,
        "sourceAuthority": {
            "seedTitles": list(EPIC_12_SOURCE_TITLES),
            "policy": AUTHORITY_POLICY,
            "fieldMatrixVersion": SOURCE_AUTHORITY_VERSION,
            "approvedReviewId": SOURCE_REVIEW_ID,
            "fieldMatrix": _field_matrix(),
            "excludedAuthorities": [
                "category crawl",
                "site search",
                "arbitrary source URLs",
                "source-provided commands",
                "runtime wiki access",
                "media byte fetching",
                "economic or acquisition pages",
            ],
        },
        "idPolicy": ID_POLICY,
        "baseIdentityRegistryDigest": base_registry.digest,
        "modIdentityRegistryDigest": mod_registry.digest,
        "sourcePages": [_snapshot_identity(snapshot) for snapshot in sorted(source_snapshots, key=lambda item: str(item["title"]))],
        "dependencyDigests": [_dependency_digest_projection(dependency)],
        "acceptedWeaponBases": weapon_bases,
        "acceptedWeaponModifiers": weapon_modifiers,
        "runtimeDispositions": dispositions,
        "equipmentTemplateRows": {
            "weaponItemRows": base_rows,
            "weaponModifierRows": modifier_rows,
        },
        "detailPageTitles": detail_titles,
        "sourceShapeCheckpoint": {
            "reviewId": SOURCE_REVIEW_ID,
            "decision": "approved",
            "representativeCases": [
                "one-handed martial weapon",
                "two-handed martial weapon",
                "bow variant",
                "caster main hand",
                "staff",
                "focus",
                "shield",
                "prefix",
                "suffix",
                "inscription",
                "staff head",
                "staff wrapping",
                "shield/offhand modifier",
                "chance/note-only behavior",
            ],
            "nonWaivableBlockers": [
                "missing source authority page",
                "unregistered source key",
                "unresolved core family or equip role",
                "missing active raw template crosswalk for accepted fixtures",
                "counterpart digest mismatch",
                "snapshot-set digest mismatch",
                "unknown copied material in runtime JSON",
            ],
        },
        "summary": {
            "templateWeaponItemRowCount": len(base_rows),
            "templateWeaponModifierRowCount": len(modifier_rows),
            "acceptedWeaponBaseCount": len(weapon_bases),
            "acceptedWeaponModifierCount": len(weapon_modifiers),
            "relationshipCount": len([item for item in dispositions if item["kind"] == "supported-relationship"]),
            "exclusionCount": len([item for item in dispositions if item["kind"] == "explicit-exclusion"]),
            "unsupportedCount": len([item for item in dispositions if item["kind"] == "unsupported"]),
            "ambiguousCount": len([item for item in dispositions if item["kind"] == "ambiguous"]),
            "historicalCount": len([item for item in dispositions if item["kind"] == "historical"]),
            "blockingFindingCount": blocking_count,
            "detailPageCount": len(detail_titles),
            "sourceSetDigest": source_set_digest,
            "sourcePlanDigest": "pending",
        },
        "diagnostics": [_diagnostic_summary(item) for item in sorted(diagnostics, key=lambda item: item.stable_key())],
        "caps": {
            "seedPageLimit": len(EPIC_12_SOURCE_TITLES),
            "detailPageLimit": profile.page_limit,
            "mediaTitleLimit": profile.media_title_limit,
            "requestLimit": profile.request_limit,
            "responseByteCap": profile.response_byte_cap,
            "parserByteCap": profile.parser_byte_cap,
            "aggregateByteCap": profile.aggregate_byte_cap,
            "weaponCatalogByteCap": profile.catalog_byte_cap,
            "weaponModCatalogByteCap": profile.catalog_byte_cap,
            "qaByteCap": profile.qa_byte_cap,
        },
    }
    plan["summary"]["sourcePlanDigest"] = source_plan_digest(plan)
    return WeaponSourceSetBuildResult(plan=plan, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


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
        raise WeaponSourceSetError(f"Weapon source plan could not be read: {exc}") from exc
    if not isinstance(plan, dict):
        raise WeaponSourceSetError("Weapon source plan root must be an object")
    return plan


def validate_source_plan(
    plan: dict[str, Any],
    *,
    profile: DataIngestionProfile,
    confirm_source_set_digest: str,
) -> None:
    if plan.get("profile") != profile.id:
        raise WeaponSourceSetError("Weapon source plan profile does not match the selected profile")
    summary = plan.get("summary")
    if not isinstance(summary, dict):
        raise WeaponSourceSetError("Weapon source plan summary is missing")
    if summary.get("sourcePlanDigest") != source_plan_digest(plan):
        raise WeaponSourceSetError("Weapon source plan digest does not match its current contents")
    try:
        require_matching_digest(
            label="Weapon source-set",
            actual=str(summary.get("sourceSetDigest")),
            expected=confirm_source_set_digest,
        )
    except SourceSetProtocolError as exc:
        raise WeaponSourceSetError(str(exc)) from exc
    if not isinstance(plan.get("acceptedWeaponBases"), list) or not plan["acceptedWeaponBases"]:
        raise WeaponSourceSetError("Weapon source plan does not contain accepted weapon bases")
    if not isinstance(plan.get("acceptedWeaponModifiers"), list) or not plan["acceptedWeaponModifiers"]:
        raise WeaponSourceSetError("Weapon source plan does not contain accepted weapon modifiers")
    detail_titles = plan.get("detailPageTitles")
    if not isinstance(detail_titles, list) or len(detail_titles) > profile.page_limit:
        raise WeaponSourceSetError("Weapon source plan exceeds the profile detail page cap")
    if int(summary.get("blockingFindingCount") or 0) > 0:
        raise WeaponSourceSetError("Weapon source plan has blocking findings")


def resolution_records_from_pages(
    *,
    plan: dict[str, Any],
    pages: list[dict[str, Any]],
) -> tuple[dict[str, list[dict[str, Any]]], list[Diagnostic]]:
    diagnostics: list[Diagnostic] = []
    by_requested: dict[str, dict[str, Any]] = {}
    for page in pages:
        requested = str(page.get("_buildWarsRequestedTitle") or page.get("title"))
        by_requested[requested] = page
        by_requested[str(page.get("title"))] = page
    resolved: dict[str, list[dict[str, Any]]] = {"weaponBases": [], "weaponModifiers": []}
    for collection_key, output_key in (("acceptedWeaponBases", "weaponBases"), ("acceptedWeaponModifiers", "weaponModifiers")):
        for seed in plan[collection_key]:
            requested = str(seed["detailTitle"])
            page = by_requested.get(requested)
            if page is None:
                diagnostics.append(
                    _diag(
                        "WEAPON_DETAIL_PAGE_MISSING",
                        f"EPIC-12 detail page was missing for {requested}",
                        source_ids=(requested,),
                        record_id=str(seed["sourceKey"]),
                        severity="error",
                    )
                )
                continue
            revision = _first_revision(page)
            content = _revision_content(revision)
            canonical_title = str(page.get("_buildWarsCanonicalTitle") or page.get("title"))
            resolved[output_key].append(
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
    return resolved, sorted(diagnostics, key=lambda item: item.stable_key())


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
    detail_records: dict[str, list[dict[str, Any]]] | None = None,
) -> Path:
    if completion_state not in {"complete", "partial", "superseded"}:
        raise WeaponSourceSetError("Invalid weapon snapshot-set completion state")
    unique_paths = sorted(set(child_manifest_paths))
    try:
        require_unique_values(unique_paths, label="Weapon snapshot child manifest list")
    except SourceSetProtocolError as exc:
        raise WeaponSourceSetError(str(exc)) from exc
    children = []
    aggregate_payload_bytes = 0
    for manifest_path in unique_paths:
        loaded = snapshot_store.load_snapshot(_snapshot_store_manifest_path(manifest_path))
        source_ref = loaded.manifest.get("sourceReference")
        digest = loaded.manifest.get("digest")
        if not isinstance(source_ref, dict) or not isinstance(digest, dict):
            raise WeaponSourceSetError("Child weapon snapshot manifest lacked source reference or digest")
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
        "baseIdentityRegistryDigest": source_plan["baseIdentityRegistryDigest"],
        "modIdentityRegistryDigest": source_plan["modIdentityRegistryDigest"],
        "completionState": completion_state,
        "expectedChildCount": len(children),
        "childSnapshots": children,
        "sourcePlan": source_plan,
        "detailRecords": _detail_record_manifest(detail_records or {"weaponBases": [], "weaponModifiers": []}),
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
) -> WeaponSnapshotSetReplay:
    try:
        manifest = json.loads(snapshot_set_manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise WeaponSourceSetError(f"Weapon snapshot-set manifest could not be read: {exc}") from exc
    if not isinstance(manifest, dict):
        raise WeaponSourceSetError("Weapon snapshot-set manifest root must be an object")
    if manifest.get("profile") != profile.id:
        raise WeaponSourceSetError("Weapon snapshot-set profile does not match the selected profile")
    if manifest.get("completionState") != "complete":
        raise WeaponSourceSetError("Only complete EPIC-12 snapshot sets can replay or promote")
    source_plan = manifest.get("sourcePlan")
    if not isinstance(source_plan, dict) or source_plan.get("profile") != profile.id:
        raise WeaponSourceSetError("Weapon snapshot-set source plan is missing or mismatched")
    if manifest.get("sourcePlanDigest") != source_plan_digest(source_plan):
        raise WeaponSourceSetError("Weapon snapshot-set source-plan digest mismatch")
    if manifest.get("sourceSetDigest") != source_plan.get("summary", {}).get("sourceSetDigest"):
        raise WeaponSourceSetError("Weapon snapshot-set source-set digest mismatch")
    children = manifest.get("childSnapshots")
    if not isinstance(children, list) or not children:
        raise WeaponSourceSetError("Weapon snapshot-set manifest has no child snapshots")
    if len(children) != manifest.get("expectedChildCount"):
        raise WeaponSourceSetError("Weapon snapshot-set child count does not match expectedChildCount")
    manifest_paths = [str(child.get("manifestPath")) for child in children if isinstance(child, dict)]
    try:
        require_unique_values(manifest_paths, label="Weapon snapshot-set manifest")
    except SourceSetProtocolError as exc:
        raise WeaponSourceSetError(str(exc)) from exc

    store = SnapshotStore(snapshot_root)
    loaded: list[LoadedSnapshot] = []
    for manifest_path in manifest_paths:
        try:
            loaded.append(store.load_snapshot(_snapshot_store_manifest_path(manifest_path)))
        except SnapshotError as exc:
            raise WeaponSourceSetError(f"Weapon snapshot-set child failed validation: {exc}") from exc

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
        raise WeaponSourceSetError("Weapon snapshot-set aggregate digest mismatch")
    return WeaponSnapshotSetReplay(manifest=manifest, loaded_snapshots=loaded)


def weapon_item_rows_from_equipment_template(text: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    pattern = re.compile(r"\{\{BuildWars weapon item\|(?P<id>\d+)\|(?P<name>[^|}]+)\|(?P<family>[^|}]+)\|(?P<role>[^|}]+)\|(?P<handed>[^|}]+)}}")
    for line_number, line in enumerate(text.splitlines(), start=1):
        match = pattern.search(line)
        if match is None:
            continue
        rows.append(
            {
                "templateItemId": int(match.group("id")),
                "name": match.group("name").strip(),
                "familyKey": _lookup_key(match.group("family")),
                "equipRole": match.group("role").strip(),
                "handedness": match.group("handed").strip(),
                "sourceLine": line_number,
            }
        )
    return sorted(rows, key=lambda item: (int(item["templateItemId"]), str(item["name"])))


def weapon_modifier_rows_from_equipment_template(text: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    pattern = re.compile(r"\{\{BuildWars weapon modifier\|(?P<id>\d+)\|(?P<name>[^|}]+)\|(?P<family>[^|}]+)\|(?P<slot>[^|}]+)}}")
    for line_number, line in enumerate(text.splitlines(), start=1):
        match = pattern.search(line)
        if match is None:
            continue
        rows.append(
            {
                "templateModifierId": int(match.group("id")),
                "name": match.group("name").strip(),
                "family": match.group("family").strip(),
                "occupiedSlot": match.group("slot").strip(),
                "sourceLine": line_number,
            }
        )
    return sorted(rows, key=lambda item: (int(item["templateModifierId"]), str(item["name"])))


def _base_seeds(
    registry: WeaponIdentityRegistry,
    equipment_source_id: str,
    weapon_source_id: str,
) -> list[dict[str, Any]]:
    seeds: list[dict[str, Any]] = []
    for definition in BASE_DEFINITIONS:
        source_key = str(definition["sourceKey"])
        registry_id = identity_for_source_key(registry, source_key)
        if registry_id is None:
            continue
        seeds.append(
            {
                **definition,
                "id": registry_id,
                "normalizedName": _lookup_key(str(definition["name"])),
                "modeAvailability": "both",
                "sourceIds": [equipment_source_id, weapon_source_id],
                "templateItems": [
                    {
                        "templateItemId": int(template_id),
                        "status": "active",
                        "mode": "both",
                        "sourceScope": "pvp-template-base",
                    }
                    for template_id in definition["templateItemIds"]
                ],
            }
        )
    return sorted(seeds, key=lambda item: (int(item["id"]), str(item["name"])))


def _modifier_seeds(
    registry: WeaponIdentityRegistry,
    equipment_source_id: str,
    upgrade_source_id: str,
    inscription_source_id: str,
) -> list[dict[str, Any]]:
    seeds: list[dict[str, Any]] = []
    for definition in MOD_DEFINITIONS:
        source_key = str(definition["sourceKey"])
        registry_id = identity_for_source_key(registry, source_key)
        if registry_id is None:
            continue
        detail_title = str(definition["detailTitle"])
        authority_source_id = inscription_source_id if detail_title == "Inscription" else upgrade_source_id
        seeds.append(
            {
                **definition,
                "id": registry_id,
                "normalizedName": _lookup_key(str(definition["name"])),
                "modeAvailability": "both",
                "sourceIds": [equipment_source_id, authority_source_id],
                "templateModifiers": [
                    {
                        "templateModifierId": int(template_id),
                        "status": "active",
                        "mode": "both",
                        "sourceScope": str(definition["family"]),
                    }
                    for template_id in definition["templateModifierIds"]
                ],
            }
        )
    return sorted(seeds, key=lambda item: (int(item["id"]), str(item["name"])))


def _runtime_dispositions(equipment_source_id: str, weapon_source_id: str, upgrade_source_id: str, inscription_source_id: str) -> list[dict[str, Any]]:
    return sorted(
        [
            _disposition(
                requested_title="Weapon",
                kind="supported-relationship",
                reason="Weapon overview is source authority for family/equip-role vocabulary and not a runtime record.",
                source_ids=[weapon_source_id],
                review_id=SOURCE_REVIEW_ID,
            ),
            _disposition(
                requested_title="Weapon upgrade",
                kind="supported-relationship",
                reason="Upgrade component page is source authority for modifier slot families and not a standalone record.",
                source_ids=[upgrade_source_id],
                review_id=SOURCE_REVIEW_ID,
            ),
            _disposition(
                requested_title="Inscription",
                kind="supported-relationship",
                reason="Inscription page is source authority for inscription slot behavior and not a standalone record.",
                source_ids=[inscription_source_id],
                review_id=SOURCE_REVIEW_ID,
            ),
            _disposition(
                requested_title="Empty equipment-template item",
                kind="unsupported",
                reason="Template item ID 0 is preserved as raw empty/unsupported equipment input, not a weapon base.",
                source_ids=[equipment_source_id],
                template_item_id=0,
                review_id=SOURCE_REVIEW_ID,
            ),
            _disposition(
                requested_title="Armor-owned insignia modifier",
                kind="explicit-exclusion",
                reason="Template modifier ID 290 belongs to EPIC-11 armor insignia ownership and remains outside EPIC-12 weapon modifiers.",
                source_ids=[equipment_source_id],
                template_modifier_id=290,
                review_id=SOURCE_REVIEW_ID,
            ),
            _disposition(
                requested_title="Historical weapon modifier placeholder",
                kind="historical",
                reason="Historical or retired raw modifier IDs are retained as dispositions until a reviewed source reactivates them.",
                source_ids=[equipment_source_id],
                template_modifier_id=158,
                review_id=SOURCE_REVIEW_ID,
            ),
            _disposition(
                requested_title="Ambiguous weapon skin placeholder",
                kind="ambiguous",
                reason="Ambiguous raw item IDs remain visible without allocating new public WeaponId records.",
                source_ids=[equipment_source_id],
                template_item_id=999001,
                review_id=SOURCE_REVIEW_ID,
            ),
        ],
        key=lambda item: (str(item["kind"]), str(item["requestedTitle"])),
    )


def _source_set_diagnostics(
    weapon_bases: list[dict[str, Any]],
    weapon_modifiers: list[dict[str, Any]],
    profile: DataIngestionProfile,
    source_snapshots: list[dict[str, Any]],
    dependency_catalog: dict[str, Any],
) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    if not weapon_bases or not weapon_modifiers:
        diagnostics.append(
            _diag(
                "WEAPON_SOURCE_SET_ZERO_ACCEPTED",
                "EPIC-12 source plan produced no accepted weapon or modifier records",
                source_ids=tuple(str(snapshot.get("title")) for snapshot in source_snapshots),
                severity="critical",
                disposition="non-waivable",
            )
        )
    detail_titles = {str(seed["detailTitle"]) for seed in [*weapon_bases, *weapon_modifiers]}
    if len(detail_titles) > profile.page_limit:
        diagnostics.append(
            _diag(
                "WEAPON_DETAIL_PAGE_CAP_EXCEEDED",
                "EPIC-12 source plan exceeded the detail page cap",
                source_ids=tuple(str(snapshot.get("title")) for snapshot in source_snapshots),
                severity="critical",
                disposition="non-waivable",
            )
        )
    for field, code, collection in (
        ("id", "WEAPON_SOURCE_DUPLICATE_BASE_ID", weapon_bases),
        ("sourceKey", "WEAPON_SOURCE_DUPLICATE_BASE_SOURCE_KEY", weapon_bases),
        ("normalizedName", "WEAPON_SOURCE_DUPLICATE_BASE_NORMALIZED_NAME", weapon_bases),
        ("id", "WEAPON_SOURCE_DUPLICATE_MOD_ID", weapon_modifiers),
        ("sourceKey", "WEAPON_SOURCE_DUPLICATE_MOD_SOURCE_KEY", weapon_modifiers),
        ("normalizedName", "WEAPON_SOURCE_DUPLICATE_MOD_NORMALIZED_NAME", weapon_modifiers),
    ):
        diagnostics.extend(_duplicates([seed[field] for seed in collection], code))
    attribute_names = {_lookup_key(str(attribute["name"])) for attribute in dependency_catalog.get("attributes", [])}
    for seed in weapon_bases:
        requirement = seed.get("requirement") if isinstance(seed.get("requirement"), dict) else {}
        if requirement.get("kind") == "attribute-rank" and _lookup_key(str(requirement.get("attributeName"))) not in attribute_names:
            diagnostics.append(
                _diag(
                    "WEAPON_REQUIREMENT_ATTRIBUTE_JOIN_MISSING_IN_PLAN",
                    f"Weapon base requirement does not join EPIC-03: {requirement.get('attributeName')}",
                    source_ids=tuple(str(source_id) for source_id in seed["sourceIds"]),
                    record_id=int(seed["id"]),
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    diagnostics.append(
        _diag(
            "WEAPON_SOURCE_SHAPE_CHECKPOINT",
            "Bounded EPIC-12 source authority approved before schema freeze.",
            source_ids=tuple(str(snapshot.get("title")) for snapshot in source_snapshots),
            severity="info",
            disposition="resolved",
        )
    )
    return sorted(diagnostics, key=lambda item: item.stable_key())


def _detail_record_manifest(detail_records: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    return {
        "weaponBases": [
            _record_manifest(record, kind="weapon-base")
            for record in sorted(detail_records.get("weaponBases", []), key=lambda item: (int(item["id"]), str(item["canonicalTitle"])))
        ],
        "weaponModifiers": [
            _record_manifest(record, kind="weapon-modifier")
            for record in sorted(detail_records.get("weaponModifiers", []), key=lambda item: (int(item["id"]), str(item["canonicalTitle"])))
        ],
    }


def _record_manifest(record: dict[str, Any], *, kind: str) -> dict[str, Any]:
    result = {
        "kind": kind,
        "sourceKey": str(record["sourceKey"]),
        "id": int(record["id"]),
        "variantKey": str(record["variantKey"]),
        "requestedTitle": str(record["name"]),
        "detailTitle": str(record["detailTitle"]),
        "normalizedName": str(record["normalizedName"]),
        "familyKey": str(record["familyKey"]),
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
    if kind == "weapon-base":
        result["templateItemIds"] = [int(item["templateItemId"]) for item in record["templateItems"]]
    else:
        result["templateModifierIds"] = [int(item["templateModifierId"]) for item in record["templateModifiers"]]
        result["occupiedSlot"] = str(record["occupiedSlot"])
    return result


def _validate_snapshot_set_children(manifest: dict[str, Any], loaded: list[LoadedSnapshot]) -> None:
    source_plan = manifest["sourcePlan"]
    detail_records = manifest.get("detailRecords")
    if not isinstance(detail_records, dict):
        raise WeaponSourceSetError("Weapon snapshot-set detail records are missing")
    required_titles = {str(page["title"]) for page in source_plan.get("sourcePages", []) if isinstance(page, dict)}
    for records in detail_records.values():
        if isinstance(records, list):
            required_titles.update(str(record["canonicalTitle"]) for record in records if isinstance(record, dict))
    child_titles = set()
    for child in manifest.get("childSnapshots", []):
        if isinstance(child, dict) and child.get("pageTitle") is not None:
            child_titles.add(str(child["pageTitle"]))
        if isinstance(child, dict):
            confined_child_path(Path("data/source-snapshots"), str(child.get("manifestPath", "")))
    extra = sorted(child_titles - required_titles - {EPIC_12_ICON_IMAGEINFO_TITLE})
    if extra:
        raise WeaponSourceSetError(f"Weapon snapshot-set contains extra child page titles: {', '.join(extra)}")
    missing = sorted(required_titles - child_titles)
    if missing:
        raise WeaponSourceSetError(f"Weapon snapshot-set is missing required child page titles: {', '.join(missing)}")
    if not loaded:
        raise WeaponSourceSetError("Weapon snapshot-set loaded no child snapshots")
    payload_total = sum(len(item.payload) for item in loaded)
    if int(manifest.get("aggregatePayloadBytes") or -1) != payload_total:
        raise WeaponSourceSetError("Weapon snapshot-set aggregate payload byte count mismatch")


def _empty_plan(
    profile: DataIngestionProfile,
    generated_at: str,
    source_snapshots: list[dict[str, Any]],
    diagnostics: list[Diagnostic],
    base_registry: WeaponIdentityRegistry,
    mod_registry: WeaponIdentityRegistry,
) -> dict[str, Any]:
    plan: dict[str, Any] = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "profile": profile.id,
        "sourceTarget": profile.source_target,
        "sourceEpic": profile.source_epic,
        "generatedAt": generated_at,
        "sourceAuthority": {"seedTitles": list(EPIC_12_SOURCE_TITLES), "policy": "missing", "fieldMatrixVersion": SOURCE_AUTHORITY_VERSION},
        "idPolicy": ID_POLICY,
        "baseIdentityRegistryDigest": base_registry.digest,
        "modIdentityRegistryDigest": mod_registry.digest,
        "sourcePages": [_snapshot_identity(snapshot) for snapshot in source_snapshots],
        "dependencyDigests": [],
        "acceptedWeaponBases": [],
        "acceptedWeaponModifiers": [],
        "runtimeDispositions": [],
        "detailPageTitles": [],
        "sourceShapeCheckpoint": {"reviewId": SOURCE_REVIEW_ID, "decision": "blocked"},
        "summary": {
            "templateWeaponItemRowCount": 0,
            "templateWeaponModifierRowCount": 0,
            "acceptedWeaponBaseCount": 0,
            "acceptedWeaponModifierCount": 0,
            "relationshipCount": 0,
            "exclusionCount": 0,
            "unsupportedCount": 0,
            "ambiguousCount": 0,
            "historicalCount": 0,
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


def _field_matrix() -> list[dict[str, str]]:
    return [
        {"field": "candidate membership", "preferredEvidence": "Equipment-template rows reconciled with Weapon/Weapon upgrade authority pages", "conflictOutcome": "accepted, dispositioned, or blocking finding"},
        {"field": "public identity", "preferredEvidence": "reviewed identity registries", "conflictOutcome": "block on unreviewed registry churn"},
        {"field": "damage", "preferredEvidence": "weapon-family/detail page plus reviewed plan facts", "conflictOutcome": "tagged unresolved or blocker"},
        {"field": "requirements", "preferredEvidence": "family/detail pages joined to EPIC-03", "conflictOutcome": "tagged unresolved or blocker"},
        {"field": "modifier effects", "preferredEvidence": "upgrade/detail/mechanics page and reviewed semantics", "conflictOutcome": "structured, note-only, unknown, or blocker"},
        {"field": "media", "preferredEvidence": "metadata-only imageinfo", "conflictOutcome": "nullable iconId or reviewed warning"},
    ]


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
        "sectionDigests": dependency.catalog.get("sectionDigests", []),
    }


def _drop_source_only(value: Any) -> Any:
    if isinstance(value, list):
        return [_drop_source_only(item) for item in value]
    if isinstance(value, dict):
        return {
            key: _drop_source_only(item)
            for key, item in value.items()
            if key not in {"sourceLine", "sourceIds"}
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
                    f"Duplicate value in weapon source plan: {value}",
                    source_ids=("source-plan",),
                    record_id=value,
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    return diagnostics


def _disposition(
    *,
    requested_title: str,
    kind: str,
    reason: str,
    source_ids: list[str],
    review_id: str | None,
    weapon_id: int | None = None,
    weapon_modifier_id: int | None = None,
    template_item_id: int | None = None,
    template_modifier_id: int | None = None,
) -> dict[str, Any]:
    identifier = template_item_id or template_modifier_id or _lookup_key(requested_title)
    return {
        "id": f"weapon-disposition:{identifier}",
        "weaponId": weapon_id,
        "weaponModifierId": weapon_modifier_id,
        "templateItemId": template_item_id,
        "templateModifierId": template_modifier_id,
        "requestedTitle": requested_title,
        "kind": kind,
        "reason": reason,
        "reviewId": review_id,
        "provenance": _provenance(source_ids, str(identifier), reason),
    }


def _provenance(source_ids: list[str], claim_key: str, notes: str | None) -> dict[str, Any]:
    return {
        "sourceIds": sorted(source_ids),
        "claimIds": [f"claim:epic-12-source-set:{claim_key}"],
        "reviewIds": [SOURCE_REVIEW_ID],
        "notes": notes,
    }


def _lookup_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _first_revision(page: dict[str, Any]) -> dict[str, Any]:
    revisions = page.get("revisions")
    if not isinstance(revisions, list) or not revisions or not isinstance(revisions[0], dict):
        raise WeaponSourceSetError(f"Weapon page missing revision payload: {page.get('title')}")
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
