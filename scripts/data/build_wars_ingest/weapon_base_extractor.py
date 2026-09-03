from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass
from typing import Any

from .models import Diagnostic, Evidence


@dataclass(frozen=True)
class WeaponBaseExtractionResult:
    raw_records: list[dict[str, Any]]
    remote_media: list[dict[str, Any]]
    diagnostics: list[Diagnostic]


WEAPON_REVIEW_ID = "review:epic-12-source-set:2026-09-02"


def extract_weapon_base_records(
    *,
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    profession_catalog: dict[str, Any],
) -> WeaponBaseExtractionResult:
    diagnostics: list[Diagnostic] = []
    records: list[dict[str, Any]] = []
    attributes_by_name = {_lookup_key(str(attribute["name"])): attribute for attribute in profession_catalog.get("attributes", [])}

    for detail in sorted(detail_pages, key=lambda item: (int(item["id"]), str(item["name"]))):
        source_reference = detail["sourceReference"]
        source_id = str(source_reference["id"])
        weapon_id = int(detail["id"])
        params = _buildwars_weapon_fact_params(str(detail.get("content", "")))
        requirement = dict(detail["requirement"])
        if params.get("requirement") == "none":
            requirement = {"kind": "none", "reason": "Fixture detail explicitly has no requirement."}
        elif params.get("requirement"):
            requirement = _requirement_from_text(params["requirement"], fallback=requirement)
        requirement_wire, requirement_diagnostics = _requirement_wire(
            requirement,
            attributes_by_name,
            weapon_id=weapon_id,
            source_id=source_id,
        )
        diagnostics.extend(requirement_diagnostics)
        damage_wire = _damage_wire(
            dict(detail["damage"]),
            weapon_id=weapon_id,
            source_id=source_id,
        )
        record = {
            "id": weapon_id,
            "sourceKey": str(detail["sourceKey"]),
            "variantKey": str(detail["variantKey"]),
            "name": str(detail["name"]),
            "normalizedName": str(detail["normalizedName"]),
            "wikiUrl": f"https://wiki.guildwars.com/wiki/{str(detail['canonicalTitle']).replace(' ', '_')}",
            "pageIdentity": {
                "requestedTitle": str(detail["detailTitle"]),
                "normalizedTitle": str(detail.get("normalizedTitle") or detail["detailTitle"]),
                "canonicalTitle": str(detail["canonicalTitle"]),
                "pageId": detail.get("pageId"),
                "revisionId": detail.get("revisionId"),
                "sourceRevisionTimestamp": detail.get("sourceRevisionTimestamp"),
                "redirectedFrom": detail.get("redirectedFrom"),
            },
            "familyKey": str(detail["familyKey"]),
            "family": str(detail["family"]),
            "variant": detail.get("variant"),
            "equipRole": str(detail["equipRole"]),
            "handedness": str(detail["handedness"]),
            "modeAvailability": str(detail["modeAvailability"]),
            "damage": damage_wire,
            "requirement": requirement_wire,
            "allowedModifierSlots": _allowed_slots(detail),
            "templateItems": [
                {
                    "templateItemId": int(item["templateItemId"]),
                    "status": str(item["status"]),
                    "mode": str(item["mode"]),
                    "sourceScope": str(item["sourceScope"]),
                    "provenance": _provenance(detail, f"template-item:{item['templateItemId']}"),
                }
                for item in detail["templateItems"]
            ],
            "displayState": "structured-only",
            "iconId": None,
            "provenance": _provenance(detail, "record"),
        }
        records.append(record)

    diagnostics.extend(_duplicate_diagnostics(records))
    return WeaponBaseExtractionResult(
        raw_records=sorted(records, key=lambda item: (int(item["id"]), str(item["name"]))),
        remote_media=[],
        diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()),
    )


def icon_titles_from_detail_pages(detail_pages: list[dict[str, Any]], limit: int) -> list[str]:
    titles = sorted(
        {
            str(detail["iconFileTitle"])
            for detail in detail_pages
            if isinstance(detail.get("iconFileTitle"), str) and detail["iconFileTitle"]
        }
    )
    return titles[:limit]


def _allowed_slots(detail: dict[str, Any]) -> list[dict[str, Any]]:
    family_key = str(detail["familyKey"])
    slots: list[dict[str, Any]]
    if family_key == "staff":
        slots = [
            _slot(detail, "staff-head", ["staff-head"]),
            _slot(detail, "staff-wrapping", ["staff-wrapping"]),
            _slot(detail, "inscription", ["inscription"]),
        ]
    elif family_key == "shield":
        slots = [_slot(detail, "shield-handle", ["shield-offhand"]), _slot(detail, "inscription", ["inscription"])]
    elif family_key == "focus":
        slots = [_slot(detail, "focus-core", ["caster"]), _slot(detail, "inscription", ["inscription"])]
    else:
        slots = [
            _slot(detail, "prefix", ["weapon-prefix"]),
            _slot(detail, "suffix", ["weapon-suffix"]),
            _slot(detail, "inscription", ["inscription"]),
        ]
    return slots


def _slot(detail: dict[str, Any], slot: str, families: list[str]) -> dict[str, Any]:
    return {
        "slot": slot,
        "cardinality": "zero-or-one",
        "compatibleModifierFamilies": families,
        "provenance": _provenance(detail, f"slot:{slot}"),
    }


def _damage_wire(damage: dict[str, Any], *, weapon_id: int, source_id: str) -> dict[str, Any]:
    kind = str(damage.get("kind"))
    if kind == "fixed-range":
        return {
            "kind": "fixed-range",
            "minimum": int(damage["minimum"]),
            "maximum": int(damage["maximum"]),
            "damageType": str(damage["damageType"]),
            "provenance": _field_provenance(source_id, weapon_id, "damage"),
        }
    if kind == "not-applicable":
        return {
            "kind": "not-applicable",
            "reason": str(damage.get("reason") or "Damage is not applicable to this weapon base."),
            "provenance": _field_provenance(source_id, weapon_id, "damage"),
        }
    return {
        "kind": "unresolved",
        "reason": str(damage.get("reason") or "Damage facts were not resolved."),
        "sourceText": damage.get("sourceText"),
        "provenance": _field_provenance(source_id, weapon_id, "damage"),
    }


def _requirement_wire(
    requirement: dict[str, Any],
    attributes_by_name: dict[str, dict[str, Any]],
    *,
    weapon_id: int,
    source_id: str,
) -> tuple[dict[str, Any], list[Diagnostic]]:
    kind = str(requirement.get("kind"))
    if kind == "none":
        return (
            {
                "kind": "none",
                "reason": str(requirement.get("reason") or "No requirement applies."),
                "provenance": _field_provenance(source_id, weapon_id, "requirement"),
            },
            [],
        )
    if kind == "attribute-rank":
        attribute_name = str(requirement.get("attributeName") or "")
        attribute = attributes_by_name.get(_lookup_key(attribute_name))
        if attribute is None:
            return (
                {
                    "kind": "unresolved",
                    "reason": "Requirement attribute did not join EPIC-03.",
                    "attributeName": attribute_name or None,
                    "rank": int(requirement.get("rank") or 0) or None,
                    "provenance": _field_provenance(source_id, weapon_id, "requirement"),
                },
                [
                    _diag(
                        "WEAPON_REQUIREMENT_ATTRIBUTE_JOIN_MISSING",
                        f"Weapon requirement attribute could not be joined through EPIC-03: {attribute_name}",
                        weapon_id,
                        source_id,
                        severity="warning",
                        disposition="accepted-risk",
                    )
                ],
            )
        return (
            {
                "kind": "attribute-rank",
                "attributeId": int(attribute["id"]),
                "attributeName": str(attribute["name"]),
                "rank": int(requirement["rank"]),
                "provenance": _field_provenance(source_id, weapon_id, "requirement"),
            },
            [],
        )
    return (
        {
            "kind": "unresolved",
            "reason": str(requirement.get("reason") or "Requirement facts were not resolved."),
            "attributeName": requirement.get("attributeName"),
            "rank": requirement.get("rank"),
            "provenance": _field_provenance(source_id, weapon_id, "requirement"),
        },
        [],
    )


def _requirement_from_text(text: str, *, fallback: dict[str, Any]) -> dict[str, Any]:
    match = re.search(r"(?:requires|requirement)\s*(?P<rank>\d+)\s+(?P<attribute>[A-Za-z ]+)", text, flags=re.IGNORECASE)
    if match is None:
        return fallback
    return {
        "kind": "attribute-rank",
        "attributeName": match.group("attribute").strip(),
        "rank": int(match.group("rank")),
    }


def _buildwars_weapon_fact_params(text: str) -> dict[str, str]:
    params: dict[str, str] = {}
    match = re.search(r"\{\{BuildWars weapon facts\|(?P<body>[^}]*)}}", text)
    if match is None:
        return params
    for part in match.group("body").split("|"):
        if "=" not in part:
            continue
        key, value = part.split("=", 1)
        params[key.strip()] = value.strip()
    return params


def _duplicate_diagnostics(records: list[dict[str, Any]]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    for field, code in (
        ("id", "WEAPON_BASE_DUPLICATE_ID"),
        ("sourceKey", "WEAPON_BASE_DUPLICATE_SOURCE_KEY"),
        ("normalizedName", "WEAPON_BASE_DUPLICATE_NORMALIZED_NAME"),
    ):
        counts = Counter(str(record[field]) for record in records)
        for value, count in counts.items():
            if count > 1:
                diagnostics.append(
                    _diag(code, f"Duplicate weapon base {field}: {value}", value, "weapon-base", severity="critical", disposition="non-waivable")
                )
    return diagnostics


def _provenance(detail: dict[str, Any], claim_key: str) -> dict[str, Any]:
    source_ids = sorted({*[str(source_id) for source_id in detail.get("sourceIds", [])], str(detail["sourceReference"]["id"])})
    return {
        "sourceIds": source_ids,
        "claimIds": [f"claim:epic-12-weapon-base:{detail['sourceKey']}:{claim_key}"],
        "reviewIds": [WEAPON_REVIEW_ID],
        "notes": "Parsed from digest-bound EPIC-12 source snapshot and reviewed source-plan facts.",
    }


def _field_provenance(source_id: str, weapon_id: int, field: str) -> dict[str, Any]:
    return {
        "sourceIds": [source_id],
        "claimIds": [f"claim:epic-12-weapon-base:{weapon_id}:{field}"],
        "reviewIds": [WEAPON_REVIEW_ID],
        "notes": "Field uses source-plan precedence approved in EPIC-12 source-shape checkpoint.",
    }


def _lookup_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _diag(
    code: str,
    message: str,
    record_id: str | int,
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
        scope_kind="record",
        record_id=record_id,
        source_ids=(source_id,),
        evidence=(Evidence("source", source_id, None),),
        disposition=disposition,  # type: ignore[arg-type]
    )
