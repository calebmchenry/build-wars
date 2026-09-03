from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass
from typing import Any

from .models import Diagnostic, Evidence


@dataclass(frozen=True)
class WeaponModExtractionResult:
    raw_records: list[dict[str, Any]]
    remote_media: list[dict[str, Any]]
    diagnostics: list[Diagnostic]


WEAPON_MOD_REVIEW_ID = "review:epic-12-source-set:2026-09-02"


def extract_weapon_mod_records(
    *,
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    profession_catalog: dict[str, Any],
) -> WeaponModExtractionResult:
    diagnostics: list[Diagnostic] = []
    records: list[dict[str, Any]] = []

    for detail in sorted(detail_pages, key=lambda item: (int(item["id"]), str(item["name"]))):
        source_reference = detail["sourceReference"]
        source_id = str(source_reference["id"])
        modifier_id = int(detail["id"])
        applicability = dict(detail["applicability"])
        record = {
            "id": modifier_id,
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
            "occupiedSlot": str(detail["occupiedSlot"]),
            "applicableWeaponFamilies": list(applicability.get("familyKeys", [])),
            "applicability": _applicability_wire(applicability, detail),
            "modeAvailability": str(detail["modeAvailability"]),
            "templateModifiers": [
                {
                    "templateModifierId": int(item["templateModifierId"]),
                    "status": str(item["status"]),
                    "mode": str(item["mode"]),
                    "sourceScope": _source_scope(str(item["sourceScope"])),
                    "provenance": _provenance(detail, f"template-modifier:{item['templateModifierId']}"),
                }
                for item in detail["templateModifiers"]
            ],
            "rawEffects": list(detail.get("rawEffects", [])),
            "displayState": "structured-only",
            "iconId": None,
            "provenance": _provenance(detail, "record"),
        }
        if not record["rawEffects"]:
            diagnostics.append(
                _diag(
                    "WEAPON_MOD_RAW_EFFECTS_MISSING",
                    "Weapon modifier source record did not contain raw effect facts",
                    modifier_id,
                    source_id,
                    severity="warning",
                    disposition="accepted-risk",
                )
            )
        records.append(record)

    diagnostics.extend(_duplicate_diagnostics(records))
    return WeaponModExtractionResult(
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


def _applicability_wire(applicability: dict[str, Any], detail: dict[str, Any]) -> dict[str, Any]:
    kind = str(applicability.get("kind"))
    if kind == "specific-families":
        return {
            "kind": "specific-families",
            "familyKeys": list(applicability.get("familyKeys", [])),
            "provenance": _provenance(detail, "applicability"),
        }
    if kind == "universal":
        return {
            "kind": "universal",
            "reason": str(applicability.get("reason") or "Universal applicability was reviewed for this modifier."),
            "provenance": _provenance(detail, "applicability"),
        }
    if kind == "not-applicable":
        return {
            "kind": "not-applicable",
            "reason": str(applicability.get("reason") or "Applicability is not applicable."),
            "provenance": _provenance(detail, "applicability"),
        }
    return {
        "kind": "unresolved",
        "reason": str(applicability.get("reason") or "Applicability facts were not resolved."),
        "sourceText": applicability.get("sourceText"),
        "provenance": _provenance(detail, "applicability"),
    }


def _source_scope(family: str) -> str:
    if family in {
        "weapon-prefix",
        "weapon-suffix",
        "inscription",
        "staff-head",
        "staff-wrapping",
        "shield-offhand",
        "caster",
    }:
        return family
    return "unknown"


def _duplicate_diagnostics(records: list[dict[str, Any]]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    for field, code in (
        ("id", "WEAPON_MOD_DUPLICATE_ID"),
        ("sourceKey", "WEAPON_MOD_DUPLICATE_SOURCE_KEY"),
        ("normalizedName", "WEAPON_MOD_DUPLICATE_NORMALIZED_NAME"),
    ):
        counts = Counter(str(record[field]) for record in records)
        for value, count in counts.items():
            if count > 1:
                diagnostics.append(
                    _diag(code, f"Duplicate weapon modifier {field}: {value}", value, "weapon-modifier", severity="critical", disposition="non-waivable")
                )
    template_counts = Counter(
        str(item["templateModifierId"])
        for record in records
        for item in record["templateModifiers"]
        if item["status"] == "active"
    )
    for value, count in template_counts.items():
        if count > 1:
            diagnostics.append(
                _diag(
                    "WEAPON_MOD_DUPLICATE_ACTIVE_TEMPLATE_MODIFIER_ID",
                    f"Duplicate active weapon modifier template ID: {value}",
                    value,
                    "weapon-modifier",
                    severity="critical",
                    disposition="non-waivable",
                )
            )
    return diagnostics


def _provenance(detail: dict[str, Any], claim_key: str) -> dict[str, Any]:
    source_ids = sorted({*[str(source_id) for source_id in detail.get("sourceIds", [])], str(detail["sourceReference"]["id"])})
    return {
        "sourceIds": source_ids,
        "claimIds": [f"claim:epic-12-weapon-mod:{detail['sourceKey']}:{claim_key}"],
        "reviewIds": [WEAPON_MOD_REVIEW_ID],
        "notes": "Parsed from digest-bound EPIC-12 source snapshot and reviewed source-plan facts.",
    }


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
