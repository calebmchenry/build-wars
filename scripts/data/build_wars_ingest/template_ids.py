from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .models import Diagnostic, Evidence, json_pointer_escape
from .wiki_tables import parse_index_list, safe_key, section_text, slug, strip_markup


@dataclass(frozen=True)
class TemplateCrosswalkExtraction:
    crosswalk: dict[str, Any]
    diagnostics: list[Diagnostic]
    candidate_rows: list[dict[str, Any]]


def extract_template_crosswalk(
    wikitext: str,
    *,
    source_reference: dict[str, Any],
) -> TemplateCrosswalkExtraction:
    source_id = str(source_reference["id"])
    diagnostics: list[Diagnostic] = []
    candidate_rows: list[dict[str, Any]] = []

    profession_section = section_text(wikitext, "Profession index")
    attribute_section = section_text(wikitext, "Attribute index")
    if not profession_section:
        diagnostics.append(_section_diag("TEMPLATE_PROFESSION_SECTION_MISSING", "Profession index section missing", source_id))
    if not attribute_section:
        diagnostics.append(_section_diag("TEMPLATE_ATTRIBUTE_SECTION_MISSING", "Attribute index section missing", source_id))

    profession_rows = _parse_rows(profession_section, "profession", source_id, diagnostics, candidate_rows)
    attribute_rows = _parse_rows(attribute_section, "attribute", source_id, diagnostics, candidate_rows)

    profession_records = []
    for template_id, name, line_number, raw in profession_rows:
        normalized_name = safe_key(name)
        status = "none" if template_id == 0 and normalized_name == "none" else "known"
        catalog_id = None if status == "none" else template_id
        profession_records.append(
            {
                "templateId": template_id,
                "catalogId": catalog_id,
                "name": strip_markup(name),
                "status": status,
                "normalizedName": normalized_name,
                "provenance": _provenance(
                    source_id,
                    [f"claim:epic-03:template-profession:{template_id}"],
                    f"Parsed from Skill template format profession index line {line_number}.",
                ),
                "sourceRow": {"sourceId": source_id, "lineNumber": line_number, "disposition": "record"},
            }
        )

    attribute_records = []
    for template_id, name, line_number, raw in attribute_rows:
        normalized_name = safe_key(name)
        attribute_records.append(
            {
                "templateId": template_id,
                "catalogId": template_id,
                "name": strip_markup(name),
                "status": "known",
                "normalizedName": normalized_name,
                "provenance": _provenance(
                    source_id,
                    [f"claim:epic-03:template-attribute:{template_id}"],
                    f"Parsed from Skill template format attribute index line {line_number}.",
                ),
                "sourceRow": {"sourceId": source_id, "lineNumber": line_number, "disposition": "record"},
            }
        )

    diagnostics.extend(_duplicate_diagnostics(profession_records, "profession", source_id))
    diagnostics.extend(_duplicate_diagnostics(attribute_records, "attribute", source_id))
    if not any(record["templateId"] == 0 and record["status"] == "none" for record in profession_records):
        diagnostics.append(
            Diagnostic(
                code="TEMPLATE_PROFESSION_NONE_SENTINEL_MISSING",
                severity="critical",
                message="Profession template id 0 did not map to the None sentinel",
                category="schema-shape-error",
                scope_kind="record",
                record_id=0,
                source_ids=(source_id,),
            )
        )

    reserved_records = _reserved_attribute_gap_facts(attribute_records, source_id)
    crosswalk = {
        "professionTemplateIds": sorted(profession_records, key=lambda record: int(record["templateId"])),
        "attributeTemplateIds": sorted(attribute_records, key=lambda record: int(record["templateId"])),
        "reservedTemplateIds": reserved_records,
    }
    return TemplateCrosswalkExtraction(crosswalk, sorted(diagnostics, key=lambda item: item.stable_key()), candidate_rows)


def _parse_rows(
    section: str,
    namespace: str,
    source_id: str,
    diagnostics: list[Diagnostic],
    candidate_rows: list[dict[str, Any]],
) -> list[tuple[int, str, int, str]]:
    rows = parse_index_list(section)
    parsed_lines = {line_number for _, _, line_number, _ in rows}
    for line_number, line in enumerate(section.splitlines(), start=1):
        stripped = line.strip()
        if not stripped.startswith("*"):
            continue
        candidate_rows.append(
            {
                "sourceId": source_id,
                "namespace": namespace,
                "lineNumber": line_number,
                "disposition": "record" if line_number in parsed_lines else "diagnostic",
            }
        )
        if line_number not in parsed_lines:
            diagnostics.append(
                Diagnostic(
                    code=f"TEMPLATE_{namespace.upper()}_MALFORMED_ROW",
                    severity="error",
                    message=f"Malformed {namespace} template-id row",
                    category="schema-shape-error",
                    scope_kind="record",
                    field_path=f"/{namespace}TemplateIds/{line_number}/{json_pointer_escape('raw')}",
                    source_ids=(source_id,),
                    evidence=(Evidence("source", f"Skill template format:{namespace}:L{line_number}", stripped[:120]),),
                )
            )
    return rows


def _duplicate_diagnostics(records: list[dict[str, Any]], namespace: str, source_id: str) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    seen_ids: set[int] = set()
    seen_names: set[str] = set()
    for record in records:
        template_id = int(record["templateId"])
        name = str(record["normalizedName"])
        if template_id in seen_ids:
            diagnostics.append(
                Diagnostic(
                    code=f"TEMPLATE_{namespace.upper()}_DUPLICATE_ID",
                    severity="critical",
                    message=f"Duplicate {namespace} template id {template_id}",
                    category="schema-shape-error",
                    scope_kind="record",
                    record_id=template_id,
                    source_ids=(source_id,),
                )
            )
        seen_ids.add(template_id)
        if name in seen_names:
            diagnostics.append(
                Diagnostic(
                    code=f"TEMPLATE_{namespace.upper()}_DUPLICATE_NAME",
                    severity="error",
                    message=f"Duplicate {namespace} template name {record['name']}",
                    category="schema-shape-error",
                    scope_kind="record",
                    record_id=template_id,
                    source_ids=(source_id,),
                )
            )
        seen_names.add(name)
    return diagnostics


def _reserved_attribute_gap_facts(attribute_records: list[dict[str, Any]], source_id: str) -> list[dict[str, Any]]:
    ids = sorted(int(record["templateId"]) for record in attribute_records)
    if not ids:
        return []
    present = set(ids)
    return [
        {
            "templateId": template_id,
            "namespace": "attribute",
            "status": "reserved",
            "reason": "Missing from the verified Skill template format attribute index; preserved as a gap.",
            "provenance": _provenance(
                source_id,
                [f"claim:epic-03:template-attribute-gap:{template_id}"],
                "Derived from the bounded template attribute index by preserving a non-contiguous numeric gap.",
            ),
        }
        for template_id in range(min(ids), max(ids) + 1)
        if template_id not in present
    ]


def _section_diag(code: str, message: str, source_id: str) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="critical",
        message=message,
        category="schema-shape-error",
        scope_kind="source",
        source_ids=(source_id,),
    )


def _provenance(source_id: str, claim_ids: list[str], notes: str) -> dict[str, Any]:
    return {"sourceIds": [source_id], "claimIds": claim_ids, "reviewIds": [], "notes": notes}


def normalized_template_name(value: str) -> str:
    return slug(strip_markup(value))
