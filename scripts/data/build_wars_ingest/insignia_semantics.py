from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Any

from .models import Diagnostic, Evidence


@dataclass(frozen=True)
class InsigniaSemanticResult:
    records: list[dict[str, Any]]
    diagnostics: list[Diagnostic]


SEMANTICS_REVIEW_ID = "review:epic-11-effect-semantics:2026-09-02"
SLOT_ORDER = ("head", "chest", "hands", "legs", "feet")
DAMAGE_TYPES = ("physical", "elemental", "cold", "fire", "lightning", "earth", "piercing", "slashing", "blunt", "holy")


def normalize_insignia_records(raw_records: list[dict[str, Any]]) -> InsigniaSemanticResult:
    records: list[dict[str, Any]] = []
    diagnostics: list[Diagnostic] = []
    for raw in sorted(raw_records, key=lambda item: (int(item["id"]), str(item["name"]))):
        record, record_diagnostics = _normalize_record(raw)
        records.append(record)
        diagnostics.extend(record_diagnostics)
    return InsigniaSemanticResult(records=records, diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()))


def _normalize_record(raw: dict[str, Any]) -> tuple[dict[str, Any], list[Diagnostic]]:
    diagnostics: list[Diagnostic] = []
    insignia_id = int(raw["id"])
    effects = _effects_for_raw(raw, diagnostics)
    if not effects:
        diagnostics.append(
            _diag(
                "INSIGNIA_EFFECTS_EMPTY",
                "Accepted insignia record produced no structured, note-only, or unknown effects",
                insignia_id,
                _first_source_id(raw),
                severity="critical",
                disposition="non-waivable",
            )
        )
        effects = [_unknown_effect(raw, source_field="/rawEffects/bonus", reason="No supported EPIC-11 semantic mapping was available.")]

    record = {
        "id": insignia_id,
        "sourceKey": raw["sourceKey"],
        "variantKey": raw["variantKey"],
        "name": raw["name"],
        "normalizedName": raw["normalizedName"],
        "wikiUrl": raw["wikiUrl"],
        "pageIdentity": raw["pageIdentity"],
        "familyKey": raw["familyKey"],
        "availability": raw["availability"],
        "professionId": raw["professionId"],
        "modeAvailability": raw["modeAvailability"],
        "applicableSlots": raw["applicableSlots"],
        "templateModifiers": [
            {
                "templateModifierId": int(raw["templateModifierId"]),
                "status": "active",
                "mode": raw["modeAvailability"],
                "scope": "armor-prefix",
                "provenance": _effect_provenance(raw, "template-modifier-crosswalk"),
            }
        ],
        "effects": effects,
        "effectCompleteness": _effect_completeness(effects),
        "displayState": "structured-only" if all(effect["kind"] not in {"note-only", "unknown"} for effect in effects) else "reviewed-short-text",
        "iconId": raw["iconId"],
        "provenance": raw["provenance"],
    }
    diagnostics.extend(_validate_record(record, raw))
    return record, diagnostics


def _effects_for_raw(raw: dict[str, Any], diagnostics: list[Diagnostic]) -> list[dict[str, Any]]:
    bonus = _normalized_bonus(raw)
    effects: list[dict[str, Any]] = []
    health = _slot_scaled_amounts(bonus, "health", sign=1)
    if health is not None:
        effects.append(
            _numeric_effect(
                raw,
                suffix="health",
                kind="maximum-health-delta",
                unit="health",
                amounts=health,
                application_scope="character",
                condition=_always(raw),
                combination_rule="sum",
                group_key="health:insignia",
            )
        )
    energy = _slot_scaled_amounts(bonus, "energy", sign=1)
    if energy is not None:
        effects.append(
            _numeric_effect(
                raw,
                suffix="energy",
                kind="maximum-energy-delta",
                unit="energy",
                amounts=energy,
                application_scope="character",
                condition=_always(raw),
                combination_rule="sum",
                group_key="energy:insignia",
            )
        )
    holy = _holy_damage_amounts(bonus)
    if holy is not None:
        effects.append(
            _numeric_effect(
                raw,
                suffix="incoming-holy-damage",
                kind="incoming-damage-delta",
                unit="damage",
                amounts=holy,
                application_scope="event-local",
                condition=_predicate(
                    raw,
                    "incoming-damage-type",
                    "equal",
                    None,
                    None,
                    "holy",
                    "incoming-damage",
                    "incoming holy damage",
                ),
                combination_rule="sum",
                group_key="incoming-damage:holy",
                extra={"damageScope": "holy"},
            )
        )

    incoming_physical = re.search(r"(?:received\s+)?physical\s+damage\s*-\s*(\d+)", bonus, flags=re.IGNORECASE)
    if incoming_physical is not None:
        amount = -int(incoming_physical.group(1))
        effects.append(
            _numeric_effect(
                raw,
                suffix="incoming-physical-damage",
                kind="incoming-damage-delta",
                unit="damage",
                amounts=_fixed_amounts(amount),
                application_scope="event-local",
                condition=_predicate(
                    raw,
                    "incoming-damage-type",
                    "equal",
                    None,
                    None,
                    "physical",
                    "incoming-damage",
                    "incoming physical damage",
                ),
                combination_rule="local-only",
                group_key=f"incoming-damage:physical:{raw['id']}",
                extra={"damageScope": "physical"},
            )
        )

    for index, armor in enumerate(_armor_clauses(bonus), start=1):
        amount = int(armor["amount"])
        clause = str(armor.get("clause") or "")
        damage_scope = _damage_scope(clause)
        effects.append(
            _numeric_effect(
                raw,
                suffix=f"armor-{index}",
                kind="armor-rating-delta",
                unit="armor",
                amounts=_fixed_amounts(amount),
                application_scope="armor-piece-local",
                condition=_condition_from_clause(raw, clause, diagnostics),
                combination_rule="local-only",
                group_key=f"armor:{raw['id']}:{index}",
                extra={"damageScope": damage_scope},
            )
        )

    duration_effect = _duration_effect(raw, bonus)
    if duration_effect is not None:
        effects.append(duration_effect)
    outgoing_effect = _outgoing_damage_effect(raw, bonus)
    if outgoing_effect is not None:
        effects.append(outgoing_effect)

    if not effects and "casting time" in bonus.casefold() and "corpse" in bonus.casefold():
        effects.append(
            _note_only_effect(
                raw,
                suffix="corpse-casting-time",
                code="activation-time-deferred",
                text="Casting-time modifier for corpse-exploiting spells is retained as a reviewed note in schema v1.",
                combination_rule="non-stacking" if "non-stacking" in bonus.casefold() else "unknown",
            )
        )
    if not effects and bonus:
        effects.append(
            _unknown_effect(
                raw,
                source_field="/rawEffects/bonus",
                reason="The source effect text was accepted but outside EPIC-11 schema-v1 structured arithmetic.",
            )
        )
    return effects


def _slot_scaled_amounts(text: str, label: str, *, sign: int) -> dict[str, int] | None:
    pattern = re.compile(
        rf"{label}\s*\+?\s*(?P<chest>\d+)\s*\(on chest armor\).*?"
        rf"{label}\s*\+?\s*(?P<legs>\d+)\s*\(on leg armor\).*?"
        rf"{label}\s*\+?\s*(?P<other>\d+)\s*\(on other armor\)",
        flags=re.IGNORECASE | re.DOTALL,
    )
    match = pattern.search(text)
    if match is None:
        return None
    chest = sign * int(match.group("chest"))
    legs = sign * int(match.group("legs"))
    other = sign * int(match.group("other"))
    return {"head": other, "chest": chest, "hands": other, "legs": legs, "feet": other}


def _holy_damage_amounts(text: str) -> dict[str, int] | None:
    pattern = re.compile(
        r"holy damage .*? by\s*(?P<chest>\d+)\s*\(on chest armor\).*?"
        r"holy damage .*? by\s*(?P<legs>\d+)\s*\(on leg armor\).*?"
        r"holy damage .*? by\s*(?P<other>\d+)\s*\(on other armor\)",
        flags=re.IGNORECASE | re.DOTALL,
    )
    match = pattern.search(text)
    if match is None:
        return None
    chest = int(match.group("chest"))
    legs = int(match.group("legs"))
    other = int(match.group("other"))
    return {"head": other, "chest": chest, "hands": other, "legs": legs, "feet": other}


def _armor_clauses(text: str) -> list[dict[str, Any]]:
    clauses: list[dict[str, Any]] = []
    pattern = re.compile(r"armor\s*([+-])\s*(\d+)\s*(?:\(([^)]*)\))?", flags=re.IGNORECASE)
    for match in pattern.finditer(text):
        sign = -1 if match.group(1) == "-" else 1
        clauses.append({"amount": sign * int(match.group(2)), "clause": match.group(3) or ""})
    return clauses


def _duration_effect(raw: dict[str, Any], text: str) -> dict[str, Any] | None:
    if "hex" in text.casefold() and "duration" in text.casefold():
        match = re.search(r"by\s*(\d+)%", text)
        amount = -int(match.group(1)) if match is not None else -20
        return _numeric_effect(
            raw,
            suffix="hex-duration",
            kind="duration-delta",
            unit="percent",
            amounts=_fixed_amounts(amount),
            application_scope="character",
            condition=_predicate(raw, "affected-by-hex", None, None, None, None, "hex", "hex durations on you"),
            combination_rule="non-stacking",
            group_key="duration:hex:insignia",
            extra={"subject": "hex-duration"},
        )
    if "knockdown" in text.casefold() and "second" in text.casefold():
        match = re.search(r"by\s*(\d+)\s*second", text, flags=re.IGNORECASE)
        amount = int(match.group(1)) if match is not None else 1
        return _numeric_effect(
            raw,
            suffix="knockdown-duration",
            kind="duration-delta",
            unit="seconds",
            amounts=_fixed_amounts(amount),
            application_scope="event-local",
            condition=_predicate(raw, "knockdown-duration-cap", "at-least", 3, None, None, "knockdown", "knockdown duration; maximum source cap retained"),
            combination_rule="non-stacking",
            group_key="duration:knockdown:insignia",
            extra={"subject": "knockdown"},
        )
    return None


def _outgoing_damage_effect(raw: dict[str, Any], text: str) -> dict[str, Any] | None:
    if "damage dealt by you" not in text.casefold():
        return None
    match = re.search(r"damage dealt by you by\s*(\d+)%", text, flags=re.IGNORECASE)
    amount = -int(match.group(1)) if match is not None else -5
    return _numeric_effect(
        raw,
        suffix="outgoing-damage",
        kind="outgoing-damage-delta",
        unit="percent",
        amounts=_fixed_amounts(amount),
        application_scope="character",
        condition=_always(raw),
        combination_rule="non-stacking",
        group_key="outgoing-damage:insignia",
        extra={"subject": "all-damage"},
    )


def _condition_from_clause(raw: dict[str, Any], clause: str, diagnostics: list[Diagnostic]) -> dict[str, Any]:
    text = re.sub(r"\s+", " ", clause).strip()
    lower = text.casefold()
    if not text:
        return _always(raw)
    if "requires" in lower:
        match = re.search(r"requires\s+(\d+)\s+([A-Za-z ]+?)(?:,|$)", text, flags=re.IGNORECASE)
        if match is not None:
            attribute = _attribute_reference(raw, match.group(2))
            if attribute is None:
                diagnostics.append(
                    _diag(
                        "INSIGNIA_CONDITION_ATTRIBUTE_JOIN_MISSING",
                        f"Insignia condition attribute could not be joined through EPIC-03: {match.group(2)}",
                        int(raw["id"]),
                        _first_source_id(raw),
                        severity="error",
                    )
                )
            return _predicate(
                raw,
                "attribute-rank-at-least",
                "at-least",
                int(match.group(1)),
                attribute,
                _damage_scope(text),
                "attribute-rank",
                text,
            )
    if "for each equipped signet" in lower:
        return _predicate(raw, "equipped-signet-count", "per", 1, None, None, "armor", text)
    count_patterns = (
        ("recharging-skills-at-least", r"recharging\s+(\d+)\s+or more skills", "skill"),
        ("controlling-minions-at-least", r"control\s+(\d+)\s+or more minions", "minion"),
        ("controlling-spirits-at-least", r"control\s+(\d+)\s+or more spirits", "spirit"),
        ("health-percent-below", r"health is below\s+(\d+)%", "health"),
        ("affected-by-enchantment", r"affected by\s+(\d+)\s+or more enchantment", "enchantment"),
    )
    for predicate, pattern, effect_kind in count_patterns:
        match = re.search(pattern, lower)
        if match is not None:
            comparator = "below" if predicate == "health-percent-below" else "at-least"
            return _predicate(raw, predicate, comparator, int(match.group(1)), None, None, effect_kind, text)
    text_predicates = (
        ("not-affected-by-enchantment", ("not affected by an enchantment", "not affected by an enchantment spell"), "enchantment"),
        ("affected-by-enchantment", ("affected by an enchantment", "affected by an enchantment spell"), "enchantment"),
        ("while-attacking", ("while attacking",), "attack"),
        ("holding-bundle", ("holding an item", "holding a bundle"), "bundle"),
        ("in-stance", ("in a stance",), "stance"),
        ("using-preparation", ("using a preparation",), "preparation"),
        ("pet-alive", ("pet is alive",), "pet"),
        ("affected-by-condition", ("affected by a condition",), "condition"),
        ("affected-by-hex", ("affected by a hex", "affected by a hex spell"), "hex"),
        ("affected-by-weapon-spell", ("affected by a weapon spell",), "weapon-spell"),
        ("activating-skills", ("activating skills",), "skill"),
        ("affected-by-shout-echo-or-chant", ("affected by a shout", "echo", "chant"), "paragon-vocal"),
    )
    for predicate, needles, effect_kind in text_predicates:
        if any(needle in lower for needle in needles):
            return _predicate(raw, predicate, None, None, None, _damage_scope(text), effect_kind, text)
    damage_scope = _damage_scope(text)
    if damage_scope is not None:
        return _predicate(raw, "incoming-damage-type", "equal", None, None, damage_scope, "incoming-damage", text)
    return {
        "kind": "deferred",
        "code": "unsupported-condition",
        "text": text,
        "reason": "Condition text is retained but not in the EPIC-11 schema-v1 predicate vocabulary.",
        "provenance": _effect_provenance(raw, "condition-deferred"),
    }


def _attribute_reference(raw: dict[str, Any], label: str) -> dict[str, Any] | None:
    wanted = _lookup_key(label)
    for attribute in raw.get("attributeReferences", []):
        if _lookup_key(str(attribute.get("name"))) == wanted:
            return {"attributeId": int(attribute["id"]), "attributeName": str(attribute["name"])}
    return None


def _damage_scope(text: str) -> str | None:
    lower = text.casefold()
    for damage_type in DAMAGE_TYPES:
        if damage_type in lower:
            return damage_type
    return None


def _numeric_effect(
    raw: dict[str, Any],
    *,
    suffix: str,
    kind: str,
    unit: str,
    amounts: dict[str, int],
    application_scope: str,
    condition: dict[str, Any],
    combination_rule: str,
    group_key: str,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    effect = {
        "id": f"insignia:{raw['id']}:{suffix}",
        "kind": kind,
        "unit": unit,
        "modeAvailability": raw["modeAvailability"],
        "applicationScope": application_scope,
        "condition": condition,
        "combination": {
            "rule": combination_rule,
            "groupKey": group_key,
            "notes": None,
        },
        "slotOutcomes": _slot_outcomes(raw, amounts, unit),
        "provenance": _effect_provenance(raw, kind),
    }
    if extra:
        effect.update(extra)
    return effect


def _note_only_effect(
    raw: dict[str, Any],
    *,
    suffix: str,
    code: str,
    text: str,
    combination_rule: str,
) -> dict[str, Any]:
    return {
        "id": f"insignia:{raw['id']}:{suffix}",
        "kind": "note-only",
        "noteCode": code,
        "text": text,
        "modeAvailability": raw["modeAvailability"],
        "condition": _always(raw),
        "combination": {"rule": combination_rule, "groupKey": f"note:{raw['id']}:{suffix}", "notes": None},
        "provenance": _effect_provenance(raw, "note-only"),
    }


def _unknown_effect(raw: dict[str, Any], *, source_field: str, reason: str) -> dict[str, Any]:
    return {
        "id": f"insignia:{raw['id']}:unknown",
        "kind": "unknown",
        "sourceField": source_field,
        "reason": reason,
        "modeAvailability": raw["modeAvailability"],
        "condition": _always(raw),
        "combination": {
            "rule": "unknown",
            "groupKey": f"unknown:{raw['id']}",
            "notes": None,
        },
        "provenance": _effect_provenance(raw, "unknown"),
    }


def _slot_outcomes(raw: dict[str, Any], amounts: dict[str, int], unit: str) -> dict[str, Any]:
    outcomes: dict[str, Any] = {}
    applicable = set(str(slot) for slot in raw.get("applicableSlots", []))
    for slot in SLOT_ORDER:
        if slot not in applicable:
            outcomes[slot] = {"kind": "not-applicable", "reason": "Insignia source does not apply to this armor slot."}
            continue
        if slot not in amounts:
            outcomes[slot] = {
                "kind": "unresolved",
                "reason": f"Source-clear amount for {slot} armor was unavailable.",
                "provenance": _effect_provenance(raw, f"slot:{slot}:unresolved"),
            }
            continue
        outcomes[slot] = {
            "kind": "value",
            "amount": amounts[slot],
            "unit": unit,
            "precision": "integer",
            "provenance": _effect_provenance(raw, f"slot:{slot}"),
        }
    return outcomes


def _fixed_amounts(amount: int) -> dict[str, int]:
    return {slot: amount for slot in SLOT_ORDER}


def _always(raw: dict[str, Any]) -> dict[str, Any]:
    return {"kind": "always", "provenance": _effect_provenance(raw, "condition:always")}


def _predicate(
    raw: dict[str, Any],
    predicate: str,
    comparator: str | None,
    count: int | None,
    attribute: dict[str, Any] | None,
    damage_type: str | None,
    effect_kind: str | None,
    text: str,
) -> dict[str, Any]:
    return {
        "kind": "predicate",
        "predicate": predicate,
        "comparator": comparator,
        "count": count,
        "attributeId": attribute.get("attributeId") if attribute is not None else None,
        "attributeName": attribute.get("attributeName") if attribute is not None else None,
        "damageType": damage_type,
        "effectKind": effect_kind,
        "text": text,
        "provenance": _effect_provenance(raw, f"condition:{predicate}"),
    }


def _effect_completeness(effects: list[dict[str, Any]]) -> str:
    kinds = {str(effect["kind"]) for effect in effects}
    if kinds == {"note-only"}:
        return "note-only"
    if kinds == {"unknown"}:
        return "unknown"
    if "note-only" in kinds or "unknown" in kinds:
        return "mixed"
    return "structured"


def _validate_record(record: dict[str, Any], raw: dict[str, Any]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    insignia_id = int(record["id"])
    source_id = _first_source_id(raw)
    identity = record.get("pageIdentity")
    if not isinstance(identity, dict) or identity.get("revisionId") is None or identity.get("pageId") is None:
        diagnostics.append(
            _diag(
                "INSIGNIA_PAGE_IDENTITY_INCOMPLETE",
                "Insignia record page identity must include page and revision facts",
                insignia_id,
                source_id,
                severity="error",
            )
        )
    if len(record.get("templateModifiers", [])) != 1:
        diagnostics.append(
            _diag(
                "INSIGNIA_TEMPLATE_MODIFIER_CROSSWALK_REQUIRED",
                "Accepted insignia record must contain exactly one active template modifier crosswalk",
                insignia_id,
                source_id,
                severity="critical",
                disposition="non-waivable",
            )
        )
    if record["availability"] == "profession-specific" and record["professionId"] is None:
        diagnostics.append(
            _diag(
                "INSIGNIA_PROFESSION_RESTRICTION_MISSING",
                "Profession-specific insignia must join one EPIC-03 profession",
                insignia_id,
                source_id,
                severity="error",
            )
        )
    if not record.get("effects"):
        diagnostics.append(
            _diag(
                "INSIGNIA_EFFECTS_MISSING",
                "Insignia record must contain at least one effect",
                insignia_id,
                source_id,
                severity="critical",
                disposition="non-waivable",
            )
        )
    for effect in record.get("effects", []):
        if "slotOutcomes" not in effect:
            continue
        outcomes = effect.get("slotOutcomes")
        if not isinstance(outcomes, dict) or set(outcomes) != set(SLOT_ORDER):
            diagnostics.append(
                _diag(
                    "INSIGNIA_SLOT_OUTCOME_KEYS_INVALID",
                    "Numeric insignia effect must expose all five armor slot outcomes",
                    insignia_id,
                    source_id,
                    severity="error",
                )
            )
            continue
        for slot, outcome in outcomes.items():
            if not isinstance(outcome, dict) or outcome.get("kind") not in {"value", "not-applicable", "unresolved"}:
                diagnostics.append(
                    _diag(
                        "INSIGNIA_SLOT_OUTCOME_INVALID",
                        f"Slot outcome was malformed for {slot}",
                        insignia_id,
                        source_id,
                        severity="error",
                    )
                )
                continue
            if outcome.get("kind") == "value":
                amount = outcome.get("amount")
                if not isinstance(amount, int) or not math.isfinite(amount):
                    diagnostics.append(
                        _diag(
                            "INSIGNIA_SLOT_OUTCOME_AMOUNT_INVALID",
                            f"Slot outcome amount was not a safe integer for {slot}",
                            insignia_id,
                            source_id,
                            severity="error",
                        )
                    )
    diagnostics.extend(_expected_slot_map_diagnostics(record, raw))
    return sorted(diagnostics, key=lambda item: item.stable_key())


def _expected_slot_map_diagnostics(record: dict[str, Any], raw: dict[str, Any]) -> list[Diagnostic]:
    expected: dict[str, dict[str, int]] = {
        "Survivor Insignia": {"head": 5, "chest": 15, "hands": 5, "legs": 10, "feet": 5},
        "Radiant Insignia": {"head": 1, "chest": 3, "hands": 1, "legs": 2, "feet": 1},
        "Tormentor's Insignia": {"head": 2, "chest": 6, "hands": 2, "legs": 4, "feet": 2},
    }
    wanted = expected.get(str(record["name"]))
    if wanted is None:
        return []
    effect_kind = "incoming-damage-delta" if str(record["name"]) == "Tormentor's Insignia" else (
        "maximum-energy-delta" if str(record["name"]) == "Radiant Insignia" else "maximum-health-delta"
    )
    effect = next((item for item in record["effects"] if item["kind"] == effect_kind), None)
    actual = {
        slot: outcome.get("amount")
        for slot, outcome in (effect or {}).get("slotOutcomes", {}).items()
        if isinstance(outcome, dict) and outcome.get("kind") == "value"
    }
    if actual != wanted:
        return [
            _diag(
                "INSIGNIA_EXPECTED_SLOT_MAP_MISMATCH",
                f"Expected slot map did not match for {record['name']}",
                int(record["id"]),
                _first_source_id(raw),
                severity="critical",
                disposition="non-waivable",
            )
        ]
    return []


def _normalized_bonus(raw: dict[str, Any]) -> str:
    value = raw.get("rawEffects", {}).get("bonus") or raw.get("rawEffects", {}).get("overviewBonus") or ""
    value = str(value).replace("&nbsp;", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def _lookup_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _effect_provenance(raw: dict[str, Any], claim_key: str) -> dict[str, Any]:
    source_ids = list(raw.get("provenance", {}).get("sourceIds", []))
    return {
        "sourceIds": source_ids,
        "claimIds": [f"claim:epic-11-effect:{raw['id']}:{claim_key}"],
        "reviewIds": [SEMANTICS_REVIEW_ID],
        "notes": "Source-clear arithmetic is projected per armor slot; conditions remain inert data.",
    }


def _first_source_id(raw: dict[str, Any]) -> str:
    source_ids = raw.get("provenance", {}).get("sourceIds", [])
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
