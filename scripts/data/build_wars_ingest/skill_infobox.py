from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from .icons import candidate_file_titles
from .models import Diagnostic, Evidence, digest_bytes
from .wikitext import normalize_param_name, normalize_template_name

try:
    import mwparserfromhell
except ModuleNotFoundError as exc:  # pragma: no cover - exercised by CLI setup checks.
    mwparserfromhell = None
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


class SkillInfoboxError(RuntimeError):
    pass


@dataclass(frozen=True)
class SkillInfoboxExtraction:
    record: dict[str, Any]
    icon_file_title: str | None
    attribute_name: str | None
    title_key: str | None
    description_source_text: str | None
    source_text_digest: str | None
    diagnostics: list[Diagnostic]
    exclusion_reason: str | None = None


PROFESSION_ALIASES = {
    "warrior": "Warrior",
    "ranger": "Ranger",
    "monk": "Monk",
    "necromancer": "Necromancer",
    "mesmer": "Mesmer",
    "elementalist": "Elementalist",
    "assassin": "Assassin",
    "ritualist": "Ritualist",
    "paragon": "Paragon",
    "dervish": "Dervish",
}

CAMPAIGN_ALIASES = {
    "core": "core",
    "prophecies": "prophecies",
    "factions": "factions",
    "nightfall": "nightfall",
    "eye of the north": "eye-of-the-north",
    "eotn": "eye-of-the-north",
    "bonus mission pack": "bonus-mission-pack",
}

NO_ATTRIBUTE_NAMES = {"", "none", "no attribute", "n/a", "na"}
INLINE_TEXT_TEMPLATE_NAMES = {"gray", "grey", "sic"}
MUTED_START_MARKER = "\x1eBW_MUTED_START\x1e"
MUTED_END_MARKER = "\x1eBW_MUTED_END\x1e"
KNOWN_SKILL_TYPE_IDS = {
    "base-skill",
    "skill",
    "attack",
    "melee-attack",
    "axe-attack",
    "dagger-attack",
    "lead-attack",
    "off-hand-attack",
    "dual-attack",
    "hammer-attack",
    "pet-attack",
    "scythe-attack",
    "sword-attack",
    "ranged-attack",
    "bow-attack",
    "spear-attack",
    "ritual",
    "binding-ritual",
    "nature-ritual",
    "ebon-vanguard-ritual",
    "spell",
    "enchantment-spell",
    "flash-enchantment-spell",
    "hex-spell",
    "item-spell",
    "touch-spell",
    "touch-enchantment-spell",
    "touch-hex-spell",
    "ward-spell",
    "weapon-spell",
    "well-spell",
    "signet",
    "touch-signet",
    "touch",
    "touch-skill",
    "chant",
    "echo",
    "form",
    "glyph",
    "preparation",
    "shout",
    "stance",
    "trap",
}


def extract_skill_infobox_ids(wikitext: str) -> list[int]:
    templates = _skill_infobox_templates(wikitext)
    if not templates:
        return []
    params = _template_params(templates[0])
    return _infobox_ids(params.get("id"))


def extract_skill_icon_candidates(wikitext: str, skill_id: int, canonical_title: str) -> list[str]:
    templates = _skill_infobox_templates(wikitext)
    params = _template_params(templates[0]) if templates else {}
    label = _infobox_id_label(params.get("id"), skill_id)
    if label in {"kurzick", "luxon"}:
        name = _clean_markup(params.get("name")) or canonical_title
        return [f"File:{name} ({label.title()}).jpg"]
    return candidate_file_titles(canonical_title, _file_title(params.get("image")))


def extract_skill_infobox(
    *,
    skill_id: int,
    template_id: int,
    requested_title: str,
    canonical_title: str,
    page_identity: dict[str, Any],
    wikitext: str,
    source_reference: dict[str, Any],
    profession_catalog: dict[str, Any],
    review_id: str,
) -> SkillInfoboxExtraction:
    diagnostics: list[Diagnostic] = []
    templates = _skill_infobox_templates(wikitext)
    source_id = str(source_reference["id"])
    if not templates:
        diagnostics.append(
            _diag(
                "SKILL_INFOBOX_MISSING",
                "Skill page did not contain a supported Skill infobox template",
                skill_id,
                source_id,
                severity="warning",
                disposition="accepted-risk",
            )
        )
        record = _unsupported_record(
            skill_id=skill_id,
            template_id=template_id,
            requested_title=requested_title,
            canonical_title=canonical_title,
            page_identity=page_identity,
            source_id=source_id,
            review_id=review_id,
        )
        return SkillInfoboxExtraction(
            record=record,
            icon_file_title=None,
            attribute_name=None,
            title_key=None,
            description_source_text=None,
            source_text_digest=None,
            diagnostics=diagnostics,
        )
    if len(templates) > 1:
        diagnostics.append(
            _diag(
                "SKILL_INFOBOX_MULTIPLE",
                "Skill page contained multiple Skill infobox templates; the first supported one was used",
                skill_id,
                source_id,
                severity="warning",
                disposition="accepted-risk",
            )
        )

    params = _template_params(templates[0])
    name = _clean_markup(params.get("name")) or canonical_title
    campaign = _campaign(params.get("campaign"))
    skill_type = _clean_markup(params.get("type")) or "Unknown"
    skill_type_id = skill_type_id_from_label(skill_type)
    if skill_type_id is None:
        skill_type_id = "base-skill"
        diagnostics.append(
            _diag(
                "SKILL_TYPE_UNKNOWN",
                f"Skill type did not resolve to a known Build Wars skill type: {skill_type}",
                skill_id,
                source_id,
                severity="error",
                field_path="/typeId",
            )
        )
    raw_profession = _clean_markup(params.get("profession"))
    raw_attribute = _clean_markup(params.get("attribute"))
    profession_id, profession_name, profession_diagnostics = _join_profession(
        raw_profession,
        profession_catalog,
        skill_id=skill_id,
        source_id=source_id,
    )
    attribute_id, attribute_name, attribute_diagnostics = _join_attribute(
        raw_attribute,
        profession_catalog,
        skill_id=skill_id,
        source_id=source_id,
    )
    diagnostics.extend(profession_diagnostics)
    diagnostics.extend(attribute_diagnostics)

    infobox_ids = _infobox_ids(params.get("id"))
    infobox_id_label = _infobox_id_label(params.get("id"), skill_id)
    exclusion_reason = None
    if skill_id not in infobox_ids:
        exclusion_reason = f"Source-set skill ID {skill_id} was not listed in infobox IDs {infobox_ids}"
        diagnostics.append(
            _diag(
                "SKILL_INFOBOX_ID_MISMATCH",
                exclusion_reason,
                skill_id,
                source_id,
                severity="warning",
                disposition="excluded",
                field_path="/id",
            )
        )
    elif infobox_id_label == "non-player":
        exclusion_reason = f"Infobox explicitly identifies skill ID {skill_id} as NPC or monster only."

    if infobox_id_label in {"kurzick", "luxon"}:
        name = f"{name} ({infobox_id_label.title()})"

    classification = _classification(
        name=name,
        skill_type=skill_type,
        profession_name=profession_name,
        attribute_name=attribute_name,
        params=params,
        requested_title=requested_title,
    )
    classification["nonPlayer"] = classification["nonPlayer"] or infobox_id_label == "non-player"
    classification["unsupported"] = exclusion_reason is not None
    description = _description_projection(
        skill_id=skill_id,
        name=name,
        skill_type=skill_type,
        profession_name=profession_name,
        attribute_name=attribute_name,
        raw_description=params.get("concise description") or params.get("description"),
        review_id=review_id,
        unsupported=False,
    )
    provenance = _provenance(source_id, skill_id, review_id, None)
    record = {
        "id": skill_id,
        "templateId": template_id,
        "name": name,
        "normalizedName": _lookup_key(name),
        "wikiUrl": f"https://wiki.guildwars.com/wiki/{canonical_title.replace(' ', '_')}",
        "pageIdentity": page_identity,
        "campaign": campaign,
        "professionId": profession_id,
        "attributeId": attribute_id,
        "type": skill_type,
        "typeId": skill_type_id,
        "classification": classification,
        "costs": {
            "energy": _value_state(params.get("energy")),
            "adrenaline": _value_state(params.get("adrenaline")),
            "sacrifice": _value_state(params.get("sacrifice"), unit_default="percent"),
            "upkeep": _value_state(params.get("upkeep")),
            "overcast": _value_state(params.get("overcast")),
        },
        "timings": {
            "activation": _value_state(params.get("activation")),
            "recharge": _value_state(params.get("recharge")),
            "moraleBoostRecharge": _value_state(params.get("morale boost recharge")),
        },
        "description": description,
        "progressionSeriesIds": [],
        "splitGroupId": None,
        "iconId": None,
        "provenance": provenance,
    }
    return SkillInfoboxExtraction(
        record=record,
        icon_file_title=(f"File:{name}.jpg" if infobox_id_label in {"kurzick", "luxon"} else _file_title(params.get("image"))),
        attribute_name=attribute_name,
        title_key=_rank_title_key(attribute_name, infobox_id_label),
        description_source_text=params.get("concise description") or params.get("description"),
        source_text_digest=description["sourceTextDigest"],
        diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()),
        exclusion_reason=exclusion_reason,
    )


def _skill_infobox_templates(wikitext: str) -> list[Any]:
    if mwparserfromhell is None:
        raise SkillInfoboxError(f"mwparserfromhell is required: {_IMPORT_ERROR}")
    code = mwparserfromhell.parse(wikitext)
    return [
        template
        for template in code.filter_templates(recursive=False)
        if normalize_template_name(str(template.name)) == "skill infobox"
    ]


def _template_params(template: Any) -> dict[str, str]:
    params: dict[str, str] = {}
    for index, param in enumerate(template.params):
        key = normalize_param_name(str(param.name))
        if not bool(param.showkey):
            key = str(index + 1)
        params[key] = str(param.value).strip()
    return params


def _unsupported_record(
    *,
    skill_id: int,
    template_id: int,
    requested_title: str,
    canonical_title: str,
    page_identity: dict[str, Any],
    source_id: str,
    review_id: str,
) -> dict[str, Any]:
    return {
        "id": skill_id,
        "templateId": template_id,
        "name": canonical_title or requested_title,
        "normalizedName": _lookup_key(canonical_title or requested_title),
        "wikiUrl": f"https://wiki.guildwars.com/wiki/{(canonical_title or requested_title).replace(' ', '_')}",
        "pageIdentity": page_identity,
        "campaign": "unknown",
        "professionId": None,
        "attributeId": None,
        "type": "Unknown",
        "typeId": "base-skill",
        "classification": {
            "elite": False,
            "common": False,
            "title": False,
            "special": True,
            "noAttribute": True,
            "pveOnly": False,
            "pvpOnly": False,
            "sharedPage": False,
            "split": False,
            "unsupported": True,
            "nonPlayer": True,
            "modeAvailability": "unknown",
        },
        "costs": _empty_costs(),
        "timings": _empty_timings(),
        "description": _description_projection(
            skill_id=skill_id,
            name=canonical_title or requested_title,
            skill_type="Unknown",
            profession_name=None,
            attribute_name=None,
            raw_description=None,
            review_id=review_id,
            unsupported=True,
        ),
        "progressionSeriesIds": [],
        "splitGroupId": None,
        "iconId": None,
        "provenance": _provenance(source_id, skill_id, review_id, "Unsupported source shape."),
    }


def _empty_costs() -> dict[str, Any]:
    return {
        "energy": _value_state(None),
        "adrenaline": _value_state(None),
        "sacrifice": _value_state(None),
        "upkeep": _value_state(None),
        "overcast": _value_state(None),
    }


def _empty_timings() -> dict[str, Any]:
    return {
        "activation": _value_state(None),
        "recharge": _value_state(None),
        "moraleBoostRecharge": _value_state(None),
    }


def _join_profession(
    raw_profession: str | None,
    catalog: dict[str, Any],
    *,
    skill_id: int,
    source_id: str,
) -> tuple[int | None, str | None, list[Diagnostic]]:
    if raw_profession is None or raw_profession.casefold() in NO_ATTRIBUTE_NAMES:
        return None, None, []
    normalized = PROFESSION_ALIASES.get(raw_profession.casefold(), raw_profession)
    for profession in catalog.get("professions", []):
        if _lookup_key(str(profession.get("name"))) == _lookup_key(normalized):
            return int(profession["id"]), str(profession["name"]), []
    return (
        None,
        raw_profession,
        [
            _diag(
                "SKILL_PROFESSION_JOIN_UNKNOWN",
                f"Skill profession did not resolve through EPIC-03: {raw_profession}",
                skill_id,
                source_id,
                severity="warning",
                disposition="accepted-risk",
                field_path="/professionId",
            )
        ],
    )


def _join_attribute(
    raw_attribute: str | None,
    catalog: dict[str, Any],
    *,
    skill_id: int,
    source_id: str,
) -> tuple[int | None, str | None, list[Diagnostic]]:
    if raw_attribute is None or raw_attribute.casefold() in NO_ATTRIBUTE_NAMES:
        return None, None, []
    if raw_attribute.casefold().endswith("rank"):
        return None, raw_attribute, []
    for attribute in catalog.get("attributes", []):
        if _lookup_key(str(attribute.get("name"))) == _lookup_key(raw_attribute):
            return int(attribute["id"]), str(attribute["name"]), []
    return (
        None,
        raw_attribute,
        [
            _diag(
                "SKILL_ATTRIBUTE_JOIN_UNKNOWN",
                f"Skill attribute did not resolve through EPIC-03: {raw_attribute}",
                skill_id,
                source_id,
                severity="warning",
                disposition="accepted-risk",
                field_path="/attributeId",
            )
        ],
    )


def skill_type_id_from_label(value: str) -> str | None:
    skill_type_id = re.sub(r"[^a-z0-9]+", "-", value.strip().casefold()).strip("-")
    if skill_type_id in KNOWN_SKILL_TYPE_IDS:
        return skill_type_id
    return None


def _classification(
    *,
    name: str,
    skill_type: str,
    profession_name: str | None,
    attribute_name: str | None,
    params: dict[str, str],
    requested_title: str,
) -> dict[str, Any]:
    type_key = skill_type.casefold()
    title_key = (attribute_name or "").casefold()
    pve_only = _truthy(params.get("pve-only") or params.get("pve only"))
    pvp_only = _truthy(params.get("pvp-only") or params.get("pvp only")) or "(pvp)" in requested_title.casefold()
    elite = "elite" in type_key or _truthy(params.get("elite"))
    title = title_key.endswith("rank")
    no_attribute = attribute_name is None
    special = title or "monster" in requested_title.casefold() or "monster" in type_key or "special" in type_key
    common = profession_name is None and not title and not special
    non_player = "monster" in requested_title.casefold() or "monster" in type_key
    if pve_only and not pvp_only:
        mode_availability = "pve-only"
    elif pvp_only and not pve_only:
        mode_availability = "pvp-only"
    elif pve_only and pvp_only:
        mode_availability = "unknown"
    else:
        mode_availability = "both"
    return {
        "elite": elite,
        "common": common,
        "title": title,
        "special": special,
        "noAttribute": no_attribute,
        "pveOnly": pve_only,
        "pvpOnly": pvp_only,
        "sharedPage": False,
        "split": False,
        "unsupported": False,
        "nonPlayer": non_player,
        "modeAvailability": mode_availability,
    }


def _description_projection(
    *,
    skill_id: int,
    name: str,
    skill_type: str,
    profession_name: str | None,
    attribute_name: str | None,
    raw_description: str | None,
    review_id: str,
    unsupported: bool,
) -> dict[str, Any]:
    if unsupported:
        return {
            "state": "unsupported",
            "tokens": [],
            "searchText": _search_text([name, skill_type, profession_name, attribute_name]),
            "sourceTextDigest": None,
            "reviewId": review_id,
            "limitations": ["No supported Skill infobox was present in the selected snapshot."],
        }
    source_text_digest = digest_bytes((raw_description or "").encode("utf-8")) if raw_description else None
    concise_tokens = _description_text_tokens(raw_description, skill_id=skill_id)
    if concise_tokens:
        return {
            "state": "reviewed-text",
            "tokens": concise_tokens,
            "searchText": _search_text(
                [
                    name,
                    skill_type,
                    profession_name,
                    attribute_name,
                    _clean_markup(raw_description),
                ]
            ),
            "sourceTextDigest": source_text_digest,
            "reviewId": review_id,
            "limitations": [],
        }
    tokens = [
        {"kind": "reviewed-factual-marker", "value": "Skill type: "},
        {"kind": "literal", "value": skill_type},
    ]
    if profession_name:
        tokens.extend(
            [
                {"kind": "whitespace"},
                {"kind": "reviewed-factual-marker", "value": "Profession: "},
                {"kind": "literal", "value": profession_name},
            ]
        )
    if attribute_name:
        tokens.extend(
            [
                {"kind": "whitespace"},
                {"kind": "reviewed-factual-marker", "value": "Attribute: "},
                {"kind": "literal", "value": attribute_name},
            ]
        )
    return {
        "state": "structured-only",
        "tokens": tokens,
        "searchText": _search_text([name, skill_type, profession_name, attribute_name]),
        "sourceTextDigest": source_text_digest,
        "reviewId": review_id,
        "limitations": [
            "Runtime text excludes source-authored descriptions until a digest-bound description review approves copied prose."
        ],
    }


def _description_text_tokens(raw_description: str | None, *, skill_id: int) -> list[dict[str, Any]]:
    if raw_description is None:
        return []
    text = raw_description.strip()
    if not text:
        return []
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    text = re.sub(r"\[\[([^|\]]+)\|([^\]]+)]]", r"\2", text)
    text = re.sub(r"\[\[([^\]]+)]]", r"\1", text)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = _unwrap_inline_text_templates(text, mark_tone=True)

    tokens: list[dict[str, Any]] = []
    position = 0
    progression_index = 0
    muted_depth = 0
    token_pattern = re.compile(
        re.escape(MUTED_START_MARKER)
        + "|"
        + re.escape(MUTED_END_MARKER)
        + r"|\{\{\s*gr2?\s*\|[^{}]+}}",
        flags=re.IGNORECASE,
    )
    for match in token_pattern.finditer(text):
        tone = "muted" if muted_depth > 0 else "normal"
        tokens.extend(_literal_description_tokens(text[position : match.start()], tone=tone))
        matched = match.group(0)
        if matched == MUTED_START_MARKER:
            muted_depth += 1
        elif matched == MUTED_END_MARKER:
            muted_depth = max(0, muted_depth - 1)
        else:
            progression_index += 1
            tokens.append(
                _description_token(
                    {
                        "kind": "progression-reference",
                        "seriesId": f"progression:skill:{skill_id}:{progression_index}",
                        "valueSlot": 0,
                    },
                    tone=tone,
                )
            )
        position = match.end()
    tokens.extend(
        _literal_description_tokens(
            text[position:],
            tone="muted" if muted_depth > 0 else "normal",
        )
    )
    return _trim_description_tokens(tokens)


def _literal_description_tokens(value: str, *, tone: str = "normal") -> list[dict[str, Any]]:
    if not value:
        return []
    tokens: list[dict[str, Any]] = []
    for part in re.split(r"(\n+|\s+)", value):
        if not part:
            continue
        if "\n" in part:
            tokens.append(_description_token({"kind": "line-break"}, tone=tone))
        elif part.isspace():
            tokens.append(_description_token({"kind": "whitespace"}, tone=tone))
        else:
            tokens.append(_description_token({"kind": "literal", "value": part}, tone=tone))
    return tokens


def _description_token(token: dict[str, Any], *, tone: str) -> dict[str, Any]:
    if tone == "normal":
        return token
    return {**token, "tone": tone}


def _trim_description_tokens(tokens: list[dict[str, Any]]) -> list[dict[str, Any]]:
    while tokens and tokens[0]["kind"] in {"whitespace", "line-break"}:
        tokens.pop(0)
    while tokens and tokens[-1]["kind"] in {"whitespace", "line-break"}:
        tokens.pop()
    return tokens


def _value_state(raw: str | None, *, unit_default: str | None = None) -> dict[str, Any]:
    if raw is None or raw.strip() == "":
        return {"state": "absent", "value": None, "unit": None, "text": None, "source": raw}
    clean = _clean_markup(raw) or raw.strip()
    key = clean.casefold()
    if key in {"none", "n/a", "na", "-", "—"}:
        return {"state": "not-applicable", "value": None, "unit": None, "text": clean, "source": raw}
    if "{{" in raw or "}}" in raw:
        return {"state": "special", "value": None, "unit": unit_default, "text": clean, "source": raw}
    number_match = re.fullmatch(r"-?\d+(?:\.\d+)?", clean)
    percent_match = re.fullmatch(r"(-?\d+(?:\.\d+)?)\s*%", clean)
    if percent_match:
        return {
            "state": "percentage",
            "value": _number(percent_match.group(1)),
            "unit": "percent",
            "text": clean,
            "source": raw,
        }
    if number_match:
        value = _number(clean)
        return {
            "state": "zero" if value == 0 else "number",
            "value": value,
            "unit": unit_default,
            "text": clean,
            "source": raw,
        }
    return {"state": "special", "value": None, "unit": unit_default, "text": clean, "source": raw}


def _number(value: str) -> int | float:
    parsed = float(value)
    return int(parsed) if parsed.is_integer() else parsed


def _clean_markup(value: str | None) -> str | None:
    if value is None:
        return None
    text = value.strip()
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    text = re.sub(r"\[\[([^|\]]+)\|([^\]]+)]]", r"\2", text)
    text = re.sub(r"\[\[([^\]]+)]]", r"\1", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = _unwrap_inline_text_templates(text)
    text = re.sub(r"\{\{[^{}]+}}", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def _unwrap_inline_text_templates(value: str, *, mark_tone: bool = False) -> str:
    if "{{" not in value:
        return value
    if mwparserfromhell is None:
        return _unwrap_simple_inline_text_templates(value, mark_tone=mark_tone)
    code = mwparserfromhell.parse(value)
    changed = True
    while changed:
        changed = False
        for template in list(code.filter_templates(recursive=True)):
            if normalize_template_name(str(template.name)) not in INLINE_TEXT_TEMPLATE_NAMES:
                continue
            replacement = str(template.params[0].value) if template.params else ""
            if mark_tone and normalize_template_name(str(template.name)) in {"gray", "grey"}:
                replacement = f"{MUTED_START_MARKER}{replacement}{MUTED_END_MARKER}"
            code.replace(template, replacement)
            changed = True
            break
    return str(code)


def _unwrap_simple_inline_text_templates(value: str, *, mark_tone: bool = False) -> str:
    previous = None
    text = value
    while previous != text:
        previous = text
        if mark_tone:
            text = re.sub(
                r"\{\{gr[ae]y\|([^{}]+)}}",
                rf"{MUTED_START_MARKER}\1{MUTED_END_MARKER}",
                text,
                flags=re.IGNORECASE,
            )
        else:
            text = re.sub(r"\{\{gr[ae]y\|([^{}]+)}}", r"\1", text, flags=re.IGNORECASE)
        text = re.sub(r"\{\{sic\|([^{}]+)}}", r"\1", text, flags=re.IGNORECASE)
    return text


def _file_title(value: str | None) -> str | None:
    clean = _clean_markup(value)
    if clean is None:
        return None
    clean = re.sub(r"^(?:Image|File):", "", clean, flags=re.IGNORECASE).strip()
    if not clean:
        return None
    return f"File:{clean}"


def _campaign(value: str | None) -> str:
    clean = _clean_markup(value)
    if clean is None:
        return "unknown"
    return CAMPAIGN_ALIASES.get(clean.casefold(), "unknown")


def _truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().casefold() in {"y", "yes", "true", "1", "pve", "pvp"}


def _infobox_ids(value: str | None) -> list[int]:
    if value is None:
        return []
    return [int(match) for match in re.findall(r"\d+", re.sub(r"<!--.*?-->", "", value, flags=re.DOTALL))]


def _infobox_id_label(value: str | None, skill_id: int) -> str | None:
    if value is None:
        return None
    for part in value.split(","):
        if skill_id not in _infobox_ids(part):
            continue
        labels = [label.strip().casefold() for label in re.findall(r"<!--\s*([^>]+?)\s*-->", part)]
        if any(re.search(r"\b(npc|monster)\b", label) for label in labels):
            return "non-player"
        if any("kurzick" in label for label in labels):
            return "kurzick"
        if any("luxon" in label for label in labels):
            return "luxon"
    return None


def _rank_title_key(attribute_name: str | None, infobox_id_label: str | None) -> str | None:
    if attribute_name is None or not attribute_name.casefold().endswith("rank"):
        return None
    if attribute_name.casefold() == "allegiance rank" and infobox_id_label in {"kurzick", "luxon"}:
        return f"allegiance:{infobox_id_label}"
    return _title_key(attribute_name)


def _search_text(values: list[str | None]) -> str:
    return " ".join(value for value in values if value).strip()


def _lookup_key(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip()).casefold()


def _title_key(value: str) -> str:
    return "title:" + re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")


def _provenance(source_id: str, skill_id: int, review_id: str, notes: str | None) -> dict[str, Any]:
    return {
        "sourceIds": [source_id],
        "claimIds": [f"claim:skill:{skill_id}:infobox"],
        "reviewIds": [review_id],
        "notes": notes,
    }


def _diag(
    code: str,
    message: str,
    skill_id: int,
    source_id: str,
    *,
    severity: str,
    disposition: str = "open",
    field_path: str | None = None,
) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity=severity,  # type: ignore[arg-type]
        message=message,
        category="schema-shape-error",
        scope_kind="record",
        record_id=skill_id,
        field_path=field_path,
        source_ids=(source_id,),
        evidence=(Evidence("source", source_id, None),),
        disposition=disposition,  # type: ignore[arg-type]
    )
