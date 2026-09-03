from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from .models import Diagnostic, Evidence
from .wikitext import normalize_param_name, normalize_template_name

try:
    import mwparserfromhell
except ModuleNotFoundError as exc:  # pragma: no cover - exercised by CLI setup checks.
    mwparserfromhell = None
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


class SkillProgressionError(RuntimeError):
    pass


@dataclass(frozen=True)
class SkillProgressionExtraction:
    series: list[dict[str, Any]]
    diagnostics: list[Diagnostic]


PROGRESSION_TEMPLATE_RE = re.compile(r"^skill progression(?:\s+max(?P<max>\d+))?$")
GR_TEMPLATE_RE = re.compile(r"\{\{\s*(gr2?|morale-boost recharge)\s*\|([^{}]+)}}", re.IGNORECASE)


def extract_skill_progressions(
    *,
    skill_id: int,
    wikitext: str,
    source_id: str,
    attribute_id: int | None,
    attribute_name: str | None,
    title_key: str | None,
) -> SkillProgressionExtraction:
    if mwparserfromhell is None:
        raise SkillProgressionError(f"mwparserfromhell is required: {_IMPORT_ERROR}")
    diagnostics: list[Diagnostic] = []
    code = mwparserfromhell.parse(wikitext)
    series: list[dict[str, Any]] = []
    for template in code.filter_templates(recursive=False):
        name = normalize_template_name(str(template.name))
        match = PROGRESSION_TEMPLATE_RE.fullmatch(name)
        if match is None:
            continue
        params = _template_params(template)
        max_rank = int(match.group("max") or _highest_rank(params) or (12 if title_key else 15))
        dependency = _dependency(
            params=params,
            attribute_id=attribute_id,
            attribute_name=attribute_name,
            title_key=title_key,
            max_rank=max_rank,
        )
        slots = _value_slots(params)
        rows = _value_rows(params, max_rank=max_rank, slot_count=len(slots))
        if not slots or not rows:
            diagnostics.append(
                _diag(
                    "SKILL_PROGRESSION_UNSUPPORTED",
                    "Skill progression template did not expose supported varN atM values",
                    skill_id,
                    source_id,
                    severity="warning",
                    disposition="accepted-risk",
                )
            )
            continue
        series.append(
            {
                "id": f"progression:skill:{skill_id}:{len(series) + 1}",
                "skillId": skill_id,
                "dependency": dependency,
                "valueSlots": slots,
                "values": rows,
                "sourceForm": name,
                "provenance": _provenance(source_id, skill_id),
            }
        )

    if not series:
        gr_series = _series_from_gr_templates(
            skill_id=skill_id,
            wikitext=wikitext,
            source_id=source_id,
            attribute_id=attribute_id,
            title_key=title_key,
        )
        series.extend(gr_series)

    return SkillProgressionExtraction(
        series=series,
        diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()),
    )


def split_evidence_from_title(title: str) -> tuple[str, str | None]:
    normalized = re.sub(r"\s+", " ", title.strip())
    match = re.fullmatch(r"(.+)\s+\((PvE|PvP)\)", normalized, flags=re.IGNORECASE)
    if match is None:
        return normalized.casefold(), None
    return match.group(1).strip().casefold(), match.group(2).lower()


def _template_params(template: Any) -> dict[str, str]:
    params: dict[str, str] = {}
    for index, param in enumerate(template.params):
        key = normalize_param_name(str(param.name))
        if not bool(param.showkey):
            key = str(index + 1)
        params[key] = str(param.value).strip()
    return params


def _dependency(
    *,
    params: dict[str, str],
    attribute_id: int | None,
    attribute_name: str | None,
    title_key: str | None,
    max_rank: int,
) -> dict[str, Any]:
    explicit_title = _clean(params.get("title track") or params.get("title"))
    explicit_attribute = _clean(params.get("attribute"))
    if title_key or (explicit_title and explicit_title.casefold().endswith("rank")):
        if title_key is not None and title_key.startswith("allegiance:"):
            key = title_key
        elif explicit_title is not None:
            key = _title_key(explicit_title)
        else:
            key = title_key or "title:title-rank"
        return {
            "kind": "title-rank",
            "attributeId": None,
            "titleKey": key,
            "mode": None,
            "rankDomain": {"min": 0, "max": max_rank},
        }
    if attribute_id is not None:
        return {
            "kind": "attribute",
            "attributeId": attribute_id,
            "titleKey": None,
            "mode": None,
            "rankDomain": {"min": 0, "max": max_rank},
        }
    if explicit_attribute and attribute_name and explicit_attribute.casefold() == attribute_name.casefold():
        return {
            "kind": "attribute",
            "attributeId": attribute_id,
            "titleKey": None,
            "mode": None,
            "rankDomain": {"min": 0, "max": max_rank},
        }
    return {
        "kind": "constant",
        "attributeId": None,
        "titleKey": None,
        "mode": None,
        "rankDomain": {"min": 0, "max": 0},
    }


def _value_slots(params: dict[str, str]) -> list[dict[str, Any]]:
    indexes = sorted(
        {
            int(match.group(1))
            for key in params
            if (match := re.fullmatch(r"var(\d+) name", key)) is not None
        }
    )
    if not indexes:
        indexes = sorted(
            {
                int(match.group(1))
                for key in params
                if (match := re.fullmatch(r"var(\d+) at\d+", key)) is not None
            }
        )
    return [
        {
            "index": index - 1,
            "label": _clean(params.get(f"var{index} name")) or f"value {index}",
            "unit": None,
        }
        for index in indexes
    ]


def _value_rows(params: dict[str, str], *, max_rank: int, slot_count: int) -> list[dict[str, Any]]:
    endpoints_by_slot: list[dict[int, float]] = []
    for slot in range(1, slot_count + 1):
        points: dict[int, float] = {}
        for key, raw_value in params.items():
            match = re.fullmatch(rf"var{slot} at(\d+)", key)
            if match is None:
                continue
            number = _number(_clean(raw_value))
            if number is not None:
                points[int(match.group(1))] = number
        endpoints_by_slot.append(points)
    if not endpoints_by_slot or any(not points for points in endpoints_by_slot):
        return []
    ranks = sorted({rank for points in endpoints_by_slot for rank in points})
    if 0 not in ranks:
        ranks.insert(0, 0)
    if max_rank not in ranks:
        ranks.append(max_rank)
    rows: list[dict[str, Any]] = []
    for rank in range(0, max_rank + 1):
        values = [_interpolate(points, rank) for points in endpoints_by_slot]
        rows.append({"rank": rank, "values": values})
    return rows


def _series_from_gr_templates(
    *,
    skill_id: int,
    wikitext: str,
    source_id: str,
    attribute_id: int | None,
    title_key: str | None,
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for match in GR_TEMPLATE_RE.finditer(wikitext):
        name = match.group(1).casefold()
        values = [_number(part.strip()) for part in match.group(2).split("|")]
        numeric_values = [value for value in values if value is not None]
        if len(numeric_values) < 2:
            continue
        max_rank = 12 if title_key or name == "gr2" else 15
        dependency = {
            "kind": "title-rank" if title_key else "attribute" if attribute_id is not None else "constant",
            "attributeId": attribute_id,
            "titleKey": title_key,
            "mode": None,
            "rankDomain": {"min": 0, "max": max_rank},
        }
        rows = [
            {"rank": rank, "values": [_interpolate({0: numeric_values[0], max_rank: numeric_values[-1]}, rank)]}
            for rank in range(0, max_rank + 1)
        ]
        result.append(
            {
                "id": f"progression:skill:{skill_id}:{len(result) + 1}",
                "skillId": skill_id,
                "dependency": dependency,
                "valueSlots": [{"index": 0, "label": "value", "unit": None}],
                "values": rows,
                "sourceForm": name,
                "provenance": _provenance(source_id, skill_id),
            }
        )
    return result


def _highest_rank(params: dict[str, str]) -> int | None:
    ranks = [
        int(match.group(1))
        for key in params
        if (match := re.fullmatch(r"var\d+ at(\d+)", key)) is not None
    ]
    return max(ranks) if ranks else None


def _interpolate(points: dict[int, float], rank: int) -> int | float:
    if rank in points:
        return _clean_number(points[rank])
    ordered = sorted(points)
    lower = max((candidate for candidate in ordered if candidate < rank), default=ordered[0])
    upper = min((candidate for candidate in ordered if candidate > rank), default=ordered[-1])
    if lower == upper:
        return _clean_number(points[lower])
    low_value = points[lower]
    high_value = points[upper]
    ratio = (rank - lower) / (upper - lower)
    return _clean_number(round(low_value + ((high_value - low_value) * ratio), 3))


def _number(value: str | None) -> float | None:
    if value is None:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", value)
    if match is None:
        return None
    return float(match.group(0))


def _clean_number(value: float) -> int | float:
    return int(value) if float(value).is_integer() else value


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    text = re.sub(r"\[\[([^|\]]+)\|([^\]]+)]]", r"\2", value)
    text = re.sub(r"\[\[([^\]]+)]]", r"\1", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def _title_key(value: str) -> str:
    cleaned = _clean(value) or value
    return "title:" + re.sub(r"[^a-z0-9]+", "-", cleaned.casefold()).strip("-")


def _provenance(source_id: str, skill_id: int) -> dict[str, Any]:
    return {
        "sourceIds": [source_id],
        "claimIds": [f"claim:skill:{skill_id}:progression"],
        "reviewIds": ["review:epic-04-structured-progressions:2026-09-01"],
        "notes": "Progression values are normalized from bounded structured templates.",
    }


def _diag(
    code: str,
    message: str,
    skill_id: int,
    source_id: str,
    *,
    severity: str,
    disposition: str,
) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity=severity,  # type: ignore[arg-type]
        message=message,
        category="schema-shape-error",
        scope_kind="record",
        record_id=skill_id,
        source_ids=(source_id,),
        evidence=(Evidence("source", source_id, None),),
        disposition=disposition,  # type: ignore[arg-type]
    )
