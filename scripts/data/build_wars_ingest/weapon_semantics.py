from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .models import Diagnostic, Evidence


@dataclass(frozen=True)
class WeaponSemanticResult:
    records: list[dict[str, Any]]
    diagnostics: list[Diagnostic]


SEMANTICS_REVIEW_ID = "review:epic-12-effect-semantics:2026-09-02"


def normalize_weapon_base_records(raw_records: list[dict[str, Any]]) -> WeaponSemanticResult:
    diagnostics: list[Diagnostic] = []
    records: list[dict[str, Any]] = []
    for raw in sorted(raw_records, key=lambda item: (int(item["id"]), str(item["name"]))):
        records.append(dict(raw))
    return WeaponSemanticResult(records=records, diagnostics=diagnostics)


def normalize_weapon_mod_records(raw_records: list[dict[str, Any]]) -> WeaponSemanticResult:
    diagnostics: list[Diagnostic] = []
    records: list[dict[str, Any]] = []
    for raw in sorted(raw_records, key=lambda item: (int(item["id"]), str(item["name"]))):
        effects: list[dict[str, Any]] = []
        for index, fact in enumerate(raw.get("rawEffects", []), start=1):
            effect = _effect_from_fact(raw, fact, index=index)
            if effect is None:
                effects.append(_unknown_effect(raw, source_field=f"/rawEffects/{index - 1}", reason="No supported EPIC-12 semantic mapping was available."))
            else:
                effects.append(effect)
        if not effects:
            diagnostics.append(
                _diag(
                    "WEAPON_MOD_EFFECTS_EMPTY",
                    "Accepted weapon modifier produced no structured, note-only, or unknown effects",
                    int(raw["id"]),
                    _first_source_id(raw),
                    severity="critical",
                    disposition="non-waivable",
                )
            )
            effects = [_unknown_effect(raw, source_field="/rawEffects", reason="No raw effect facts were provided.")]
        record = {
            key: value
            for key, value in raw.items()
            if key not in {"rawEffects"}
        }
        record["effects"] = effects
        record["effectCompleteness"] = _effect_completeness(effects)
        record["displayState"] = "structured-only" if record["effectCompleteness"] == "structured" else "reviewed-short-text"
        records.append(record)
    return WeaponSemanticResult(records=records, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


def _effect_from_fact(raw: dict[str, Any], fact: dict[str, Any], *, index: int) -> dict[str, Any] | None:
    kind = str(fact.get("kind"))
    if kind in {
        "damage-delta",
        "attribute-rank",
        "maximum-health-delta",
        "maximum-energy-delta",
        "armor-rating-delta",
        "armor-penetration",
        "enchantment-duration-delta",
        "stance-duration-delta",
        "condition-duration-delta",
    }:
        amount = fact.get("amount")
        if not isinstance(amount, (int, float)):
            return None
        return {
            "kind": kind,
            "amount": amount,
            "unit": str(fact.get("unit") or "percent"),
            "target": str(fact.get("target") or "weapon"),
            "condition": _always(raw),
            "provenance": _effect_provenance(raw, kind, index),
        }
    if kind == "damage-type-conversion":
        return {
            "kind": "damage-type-conversion",
            "damageType": str(fact.get("damageType") or "unknown"),
            "scope": str(fact.get("scope") or "weapon-damage"),
            "condition": _always(raw),
            "provenance": _effect_provenance(raw, kind, index),
        }
    if kind in {"casting-time-chance", "skill-recharge-chance"}:
        probability = fact.get("probabilityPercent")
        magnitude = fact.get("magnitudePercent")
        if not isinstance(probability, (int, float)) or not isinstance(magnitude, (int, float)):
            return None
        return {
            "kind": kind,
            "probabilityPercent": probability,
            "magnitudePercent": magnitude,
            "subject": str(fact.get("subject") or "unknown"),
            "scope": str(fact.get("scope") or "unknown"),
            "condition": _always(raw),
            "provenance": _effect_provenance(raw, kind, index),
        }
    if kind == "note-only":
        return {
            "kind": "note-only",
            "noteCode": str(fact.get("noteCode") or "weapon-mod-effect-deferred"),
            "text": _bounded_note(str(fact.get("text") or "Weapon modifier behavior is accepted but not structured in schema v1.")),
            "provenance": _effect_provenance(raw, kind, index),
        }
    if kind == "unknown":
        return _unknown_effect(
            raw,
            source_field=str(fact.get("sourceField") or f"/rawEffects/{index - 1}"),
            reason=str(fact.get("reason") or "Source behavior is unresolved."),
        )
    return None


def _effect_completeness(effects: list[dict[str, Any]]) -> str:
    kinds = {str(effect["kind"]) for effect in effects}
    if kinds == {"unknown"}:
        return "unknown"
    if kinds == {"note-only"}:
        return "note-only"
    if kinds.intersection({"note-only", "unknown"}):
        return "mixed"
    return "structured"


def _always(raw: dict[str, Any]) -> dict[str, Any]:
    return {
        "kind": "always",
        "text": None,
        "provenance": _effect_provenance(raw, "condition", 0),
    }


def _unknown_effect(raw: dict[str, Any], *, source_field: str, reason: str) -> dict[str, Any]:
    return {
        "kind": "unknown",
        "sourceField": source_field,
        "reason": reason,
        "provenance": _effect_provenance(raw, "unknown", 0),
    }


def _effect_provenance(raw: dict[str, Any], suffix: str, index: int) -> dict[str, Any]:
    return {
        "sourceIds": list(raw["provenance"]["sourceIds"]),
        "claimIds": [f"claim:epic-12-weapon-mod:{raw['sourceKey']}:{suffix}:{index}"],
        "reviewIds": [SEMANTICS_REVIEW_ID],
        "notes": "Effect semantics are normalized from reviewed EPIC-12 raw facts.",
    }


def _bounded_note(value: str) -> str:
    text = " ".join(value.split())
    return text[:240]


def _first_source_id(raw: dict[str, Any]) -> str:
    source_ids = raw.get("provenance", {}).get("sourceIds")
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
        scope_kind="record",
        record_id=record_id,
        source_ids=(source_id,),
        evidence=(Evidence("source", source_id, None),),
        disposition=disposition,  # type: ignore[arg-type]
    )
