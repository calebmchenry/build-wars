from __future__ import annotations

import re
from typing import Any

from .config import DEFAULT_LIMITS
from .models import Diagnostic, Evidence

try:
    import mwparserfromhell
except ModuleNotFoundError as exc:  # pragma: no cover - exercised by CLI setup checks.
    mwparserfromhell = None
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


class ParserUnavailable(RuntimeError):
    pass


DEFAULT_KNOWN_TEMPLATES = {
    "skill infobox",
    "skill progression",
    "gr",
    "gr2",
    "title-rank progression",
    "pveversion",
    "pvpversion",
    "morale-boost recharge",
    "redirect",
    "disambig",
    "disambiguation",
}

DEFAULT_KNOWN_PARAMS = {
    "skill infobox": {
        "name",
        "campaign",
        "profession",
        "attribute",
        "type",
        "energy",
        "activation",
        "recharge",
        "description",
        "concise description",
        "image",
        "pve-only",
        "pvp-only",
    },
    "skill progression": {"attribute", "rank", "value", "progression", "title", "recharge"},
    "gr": {"1", "2", "3"},
    "gr2": {"1", "2", "3", "4"},
    "title-rank progression": {"title", "max", "values"},
    "pveversion": {"1"},
    "pvpversion": {"1"},
    "morale-boost recharge": {"1", "2"},
}


def normalize_template_name(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("_", " ").strip()).lower()


def normalize_param_name(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("_", " ").strip()).lower()


def parse_wikitext(
    text: str,
    *,
    source_label: str,
    known_templates: set[str] | None = None,
    known_params: dict[str, set[str]] | None = None,
    max_bytes: int = DEFAULT_LIMITS.max_parser_bytes,
) -> dict[str, Any]:
    if mwparserfromhell is None:
        raise ParserUnavailable(f"mwparserfromhell is required: {_IMPORT_ERROR}")
    if len(text.encode("utf-8")) > max_bytes:
        return {
            "source": source_label,
            "templates": [],
            "redirectTarget": None,
            "disambiguationPreamble": None,
            "comments": [],
            "nowiki": [],
            "recommendation": "fallback-required",
            "diagnostics": [
                Diagnostic(
                    code="PARSER_INPUT_TOO_LARGE",
                    severity="error",
                    message="Wikitext exceeded the configured parser input size",
                    category="schema-shape-error",
                    artifact_path=source_label,
                )
            ],
        }

    known = known_templates or DEFAULT_KNOWN_TEMPLATES
    params_by_template = known_params or DEFAULT_KNOWN_PARAMS
    code = mwparserfromhell.parse(text)
    diagnostics: list[Diagnostic] = []
    templates = [
        _template_to_wire(template, index, diagnostics, known, params_by_template, source_label)
        for index, template in enumerate(code.filter_templates(recursive=False))
    ]
    rendered = str(code)
    if rendered != text:
        diagnostics.append(
            Diagnostic(
                code="PARSER_LOSSY_ROUNDTRIP",
                severity="warning",
                message="mwparserfromhell did not preserve a byte-identical string round trip",
                category="schema-shape-error",
                artifact_path=source_label,
                evidence=(Evidence("artifact", source_label, "round-trip comparison"),),
            )
        )

    recommendation = "accept-mwparserfromhell"
    if any(item.severity in {"critical", "error"} for item in diagnostics):
        recommendation = "hybrid-fallback-required"

    return {
        "source": source_label,
        "templates": templates,
        "redirectTarget": redirect_target(text),
        "disambiguationPreamble": disambiguation_preamble(text),
        "comments": re.findall(r"<!--.*?-->", text, flags=re.DOTALL),
        "nowiki": re.findall(r"<nowiki\b[^>]*>.*?</nowiki>", text, flags=re.IGNORECASE | re.DOTALL),
        "recommendation": recommendation,
        "diagnostics": diagnostics,
    }


def redirect_target(text: str) -> str | None:
    match = re.match(r"\s*#redirect\s*\[\[([^\]]+)]]", text, flags=re.IGNORECASE)
    return match.group(1).strip() if match else None


def disambiguation_preamble(text: str) -> str | None:
    first_template = text.find("{{")
    preamble = text[:first_template].strip() if first_template >= 0 else ""
    if "may refer to" in preamble.lower() or "{{disambig" in text.lower() or "{{disambiguation" in text.lower():
        return preamble
    return None


def _template_to_wire(
    template: Any,
    index: int,
    diagnostics: list[Diagnostic],
    known_templates: set[str],
    known_params: dict[str, set[str]],
    source_label: str,
) -> dict[str, Any]:
    original_name = str(template.name).strip()
    normalized_name = normalize_template_name(original_name)
    if normalized_name not in known_templates:
        diagnostics.append(
            Diagnostic(
                code="PARSER_UNKNOWN_TEMPLATE",
                severity="warning",
                message=f"Unknown template: {original_name}",
                category="schema-shape-error",
                artifact_path=source_label,
                field_path=f"/templates/{index}",
            )
        )

    seen_param_names: set[str] = set()
    duplicate_params: list[str] = []
    param_wires = []
    for param_index, param in enumerate(template.params):
        raw_name = str(param.name).strip()
        normalized_param = normalize_param_name(raw_name)
        if not param.showkey:
            normalized_param = str(param_index + 1)
        if normalized_param in seen_param_names:
            duplicate_params.append(normalized_param)
            diagnostics.append(
                Diagnostic(
                    code="PARSER_DUPLICATE_PARAM",
                    severity="warning",
                    message=f"Duplicate parameter {raw_name} in template {original_name}",
                    category="schema-shape-error",
                    artifact_path=source_label,
                    field_path=f"/templates/{index}/params/{param_index}",
                )
            )
        seen_param_names.add(normalized_param)
        allowed = known_params.get(normalized_name)
        if allowed is not None and normalized_param not in allowed:
            diagnostics.append(
                Diagnostic(
                    code="PARSER_UNKNOWN_PARAM",
                    severity="warning",
                    message=f"Unknown parameter {raw_name} in template {original_name}",
                    category="schema-shape-error",
                    artifact_path=source_label,
                    field_path=f"/templates/{index}/params/{param_index}",
                )
            )
        value = str(param.value)
        nested = [
            _template_to_wire(nested_template, nested_index, diagnostics, known_templates, known_params, source_label)
            for nested_index, nested_template in enumerate(param.value.filter_templates(recursive=False))
        ]
        param_wires.append(
            {
                "rawName": raw_name,
                "normalizedName": normalized_param,
                "rawValue": value,
                "isPositional": not bool(param.showkey),
                "nestedTemplates": nested,
            }
        )

    return {
        "index": index,
        "originalName": original_name,
        "normalizedName": normalized_name,
        "raw": str(template),
        "params": param_wires,
        "duplicateParams": duplicate_params,
    }
