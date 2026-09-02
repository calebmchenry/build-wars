from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .models import Diagnostic, Evidence


@dataclass(frozen=True)
class RuneSemanticResult:
    records: list[dict[str, Any]]
    diagnostics: list[Diagnostic]


SEMANTICS_REVIEW_ID = "review:epic-10-effect-semantics:2026-09-02"
ATTRIBUTE_RANK_VALUES = {"minor": 1, "major": 2, "superior": 3}
ATTRIBUTE_HEALTH_PENALTIES = {"minor": 0, "major": -35, "superior": -75}
VIGOR_HEALTH_VALUES = {"minor": 30, "major": 41, "superior": 50}
ABSORPTION_VALUES = {"minor": 1, "major": 2, "superior": 3}
CONDITION_FACTS = {
    "condition:clarity": ("blind", "weakness"),
    "condition:purity": ("disease", "poison"),
    "condition:recovery": ("dazed", "deep-wound"),
    "condition:restoration": ("bleeding", "crippled"),
}


def normalize_rune_records(raw_records: list[dict[str, Any]]) -> RuneSemanticResult:
    records: list[dict[str, Any]] = []
    diagnostics: list[Diagnostic] = []
    for raw in sorted(raw_records, key=lambda item: (int(item["templateModifierId"]), str(item["name"]))):
        record, record_diagnostics = _normalize_record(raw)
        records.append(record)
        diagnostics.extend(record_diagnostics)
    return RuneSemanticResult(records=records, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


def _normalize_record(raw: dict[str, Any]) -> tuple[dict[str, Any], list[Diagnostic]]:
    diagnostics: list[Diagnostic] = []
    modifier_id = int(raw["templateModifierId"])
    family_kind = str(raw["familyKind"])
    effects = _effects_for_raw(raw, diagnostics)
    if not effects:
        diagnostics.append(
            _diag(
                "RUNE_EFFECTS_EMPTY",
                "Accepted rune record produced no structured, note-only, or unknown effects",
                modifier_id,
                str(raw["provenance"]["sourceIds"][0]),
                severity="critical",
                disposition="non-waivable",
            )
        )
        effects = [
            _unknown_effect(
                raw,
                source_field="/rawEffects/bonus",
                reason="No supported EPIC-10 semantic mapping was available.",
            )
        ]
    record = {
        "id": modifier_id,
        "templateModifierId": modifier_id,
        "name": raw["name"],
        "normalizedName": raw["normalizedName"],
        "wikiUrl": raw["wikiUrl"],
        "pageIdentity": raw["pageIdentity"],
        "familyKey": raw["familyKey"],
        "familyKind": family_kind,
        "familyRank": raw["familyRank"],
        "rarityTier": raw["rarityTier"],
        "eligibility": raw["eligibility"],
        "professionId": raw["professionId"],
        "affectedAttributeId": raw["affectedAttributeId"],
        "effects": effects,
        "headgearInteraction": "attribute-linked" if family_kind == "attribute" else "not-applicable",
        "displayState": "structured-only",
        "iconId": raw["iconId"],
        "provenance": raw["provenance"],
    }
    diagnostics.extend(_validate_record(record, raw))
    return record, diagnostics


def _effects_for_raw(raw: dict[str, Any], diagnostics: list[Diagnostic]) -> list[dict[str, Any]]:
    family_kind = str(raw["familyKind"])
    family_rank = raw.get("familyRank")
    modifier_id = int(raw["templateModifierId"])
    source_id = str(raw["provenance"]["sourceIds"][0])
    if family_kind == "attribute":
        rank = str(family_rank)
        amount = ATTRIBUTE_RANK_VALUES.get(rank)
        if amount is None:
            diagnostics.append(
                _diag("RUNE_ATTRIBUTE_RANK_UNKNOWN", "Attribute rune rank was not minor, major, or superior", modifier_id, source_id, severity="error")
            )
            return []
        effects = [
            _numeric_effect(
                raw,
                kind="attribute-rank",
                amount=amount,
                unit="rank",
                target="attribute",
                stacking_rule="highest",
                group_key=f"attribute:{raw['affectedAttributeId']}",
                extra={"attributeId": raw["affectedAttributeId"]},
            )
        ]
        penalty = ATTRIBUTE_HEALTH_PENALTIES[rank]
        if penalty < 0:
            effects.append(
                _numeric_effect(
                    raw,
                    kind="maximum-health-delta",
                    amount=penalty,
                    unit="health",
                    target="character",
                    stacking_rule="sum",
                    group_key=f"attribute-health-penalty:{modifier_id}",
                )
            )
        return effects
    if family_kind == "vigor":
        amount = VIGOR_HEALTH_VALUES.get(str(family_rank))
        if amount is None:
            return [_unknown_effect(raw, source_field="/familyRank", reason="Vigor rank was not recognized.")]
        return [
            _numeric_effect(
                raw,
                kind="maximum-health-delta",
                amount=amount,
                unit="health",
                target="character",
                stacking_rule="highest",
                group_key="health:vigor",
            )
        ]
    if family_kind == "vitae":
        return [
            _numeric_effect(
                raw,
                kind="maximum-health-delta",
                amount=10,
                unit="health",
                target="character",
                stacking_rule="sum",
                group_key="health:vitae",
            )
        ]
    if family_kind == "attunement":
        return [
            _numeric_effect(
                raw,
                kind="maximum-energy-delta",
                amount=2,
                unit="energy",
                target="character",
                stacking_rule="sum",
                group_key="energy:attunement",
            )
        ]
    if family_kind == "absorption":
        amount = ABSORPTION_VALUES.get(str(family_rank))
        if amount is None:
            return [_unknown_effect(raw, source_field="/familyRank", reason="Absorption rank was not recognized.")]
        return [
            _numeric_effect(
                raw,
                kind="physical-damage-reduction",
                amount=amount,
                unit="damage",
                target="physical-damage",
                stacking_rule="highest",
                group_key="physical-damage:absorption",
                extra={"damageScope": "physical"},
            )
        ]
    if family_kind == "condition-reduction":
        conditions = CONDITION_FACTS.get(str(raw["familyKey"]))
        if conditions is None:
            return [_unknown_effect(raw, source_field="/familyKey", reason="Condition rune family was not recognized.")]
        return [
            {
                "kind": "condition-duration-reduction",
                "percentage": 20,
                "unit": "percent",
                "target": "condition-duration",
                "conditions": list(conditions),
                "stacking": {
                    "rule": "highest",
                    "groupKey": f"condition-duration:{raw['familyKey']}",
                    "notes": "Same rune family is non-stacking; cross-system condition composition remains deferred.",
                },
                "provenance": _effect_provenance(raw, "condition-duration"),
            }
        ]
    return [
        {
            "kind": "note-only",
            "noteCode": "rune-effect-deferred",
            "text": "Rune behavior is accepted but not structured for arithmetic in schema v1.",
            "stacking": {"rule": "unknown", "groupKey": f"unknown:{modifier_id}", "notes": None},
            "provenance": _effect_provenance(raw, "note-only"),
        }
    ]


def _numeric_effect(
    raw: dict[str, Any],
    *,
    kind: str,
    amount: int,
    unit: str,
    target: str,
    stacking_rule: str,
    group_key: str,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    effect = {
        "kind": kind,
        "amount": amount,
        "unit": unit,
        "target": target,
        "stacking": {
            "rule": stacking_rule,
            "groupKey": group_key,
            "notes": None,
        },
        "provenance": _effect_provenance(raw, kind),
    }
    if extra:
        effect.update(extra)
    return effect


def _unknown_effect(raw: dict[str, Any], *, source_field: str, reason: str) -> dict[str, Any]:
    return {
        "kind": "unknown",
        "sourceField": source_field,
        "reason": reason,
        "stacking": {
            "rule": "unknown",
            "groupKey": f"unknown:{raw['templateModifierId']}",
            "notes": None,
        },
        "provenance": _effect_provenance(raw, "unknown"),
    }


def _validate_record(record: dict[str, Any], raw: dict[str, Any]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    modifier_id = int(record["templateModifierId"])
    source_id = str(record["provenance"]["sourceIds"][0])
    family_kind = str(record["familyKind"])
    if record["pageIdentity"].get("revisionId") is None:
        diagnostics.append(
            _diag(
                "RUNE_PAGE_REVISION_MISSING",
                "Rune record page identity is missing a source revision ID",
                modifier_id,
                source_id,
                severity="error",
            )
        )
    if family_kind == "attribute":
        if record["professionId"] is None or record["affectedAttributeId"] is None:
            diagnostics.append(
                _diag(
                    "RUNE_ATTRIBUTE_JOIN_INCOMPLETE",
                    "Attribute rune did not resolve both profession and attribute through EPIC-03",
                    modifier_id,
                    source_id,
                    severity="error",
                )
            )
        if not any(effect["kind"] == "attribute-rank" for effect in record["effects"]):
            diagnostics.append(
                _diag(
                    "RUNE_ATTRIBUTE_EFFECT_MISSING",
                    "Attribute rune did not emit an attribute-rank effect",
                    modifier_id,
                    source_id,
                    severity="error",
                )
            )
    if family_kind != "attribute" and record["affectedAttributeId"] is not None:
        diagnostics.append(
            _diag(
                "RUNE_NON_ATTRIBUTE_JOIN_LEAKED",
                "Non-attribute rune carried an affectedAttributeId",
                modifier_id,
                source_id,
                severity="error",
            )
        )
    for effect in record["effects"]:
        stack = effect.get("stacking")
        if not isinstance(stack, dict) or not stack.get("groupKey") or stack.get("rule") not in {"sum", "highest", "separate", "unknown"}:
            diagnostics.append(
                _diag(
                    "RUNE_EFFECT_STACKING_INVALID",
                    "Rune effect must carry a supported effect-level stacking rule and group key",
                    modifier_id,
                    source_id,
                    severity="error",
                )
            )
    if raw.get("rawEffects", {}).get("bonus") is None:
        diagnostics.append(
            _diag(
                "RUNE_RAW_BONUS_FIELD_MISSING",
                "Rune source page did not expose a bounded raw bonus field",
                modifier_id,
                source_id,
                severity="warning",
                disposition="accepted-risk",
            )
        )
    return diagnostics


def _effect_provenance(raw: dict[str, Any], field: str) -> dict[str, Any]:
    modifier_id = int(raw["templateModifierId"])
    source_ids = list(raw["provenance"]["sourceIds"])
    return {
        "sourceIds": source_ids,
        "claimIds": [f"claim:rune:{modifier_id}:effect:{field}"],
        "reviewIds": [SEMANTICS_REVIEW_ID],
        "notes": "Effect normalized from source-backed rune family/rank facts and reviewed Rune stacking rules.",
    }


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
