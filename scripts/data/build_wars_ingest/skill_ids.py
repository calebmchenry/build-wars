from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from .models import Diagnostic, Evidence, json_pointer_escape, provenance_claim, record_provenance

GAME_LINK_RE = re.compile(r"Game link:Skill\s+([^|\]#<>{}\s]+)", flags=re.IGNORECASE)
WIKI_LINK_RE = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?]]")


@dataclass(frozen=True)
class SkillIdSource:
    source_page: str
    source_url: str
    source_revision_id: int | str
    source_revision_timestamp: str
    source_id: str
    source_reference: dict[str, Any]


def enumerate_skill_ids(
    wikitext: str,
    *,
    source: SkillIdSource,
    min_id: int = 1,
    max_id: int = 100_000,
    emit_gap_diagnostics: bool = True,
) -> tuple[list[dict[str, Any]], list[Diagnostic]]:
    records: list[dict[str, Any]] = []
    diagnostics: list[Diagnostic] = []
    seen_ids: dict[int, int] = {}
    seen_titles: dict[str, int] = {}

    for line_number, line in enumerate(wikitext.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("<!--"):
            continue
        match = GAME_LINK_RE.search(line)
        if not match:
            if "Game link:" in line:
                diagnostics.append(_diagnostic("SKILL_ID_MALFORMED_CANDIDATE", "Malformed game-link candidate", source, line_number, line))
            elif "[[" in line:
                diagnostics.append(_diagnostic("SKILL_ID_UNEXPECTED_LINE", "Unexpected non-skill mapping line", source, line_number, line, severity="info"))
            continue

        raw_id = match.group(1)
        try:
            skill_id = int(raw_id)
        except ValueError:
            diagnostics.append(_diagnostic("SKILL_ID_NON_INTEGER", f"Skill id was not an integer: {raw_id}", source, line_number, line))
            continue
        if not (min_id <= skill_id <= max_id):
            diagnostics.append(_diagnostic("SKILL_ID_OUT_OF_RANGE", f"Skill id out of range: {skill_id}", source, line_number, line))
            continue

        target_title = _target_title(line, match.end())
        if target_title is None:
            diagnostics.append(_diagnostic("SKILL_ID_MISSING_TARGET", "Skill id mapping did not include a target title", source, line_number, line))
            continue
        if "redirect" in stripped.lower() and "redirect=no" not in stripped.lower():
            diagnostics.append(
                _diagnostic(
                    "SKILL_ID_REDIRECT_AMBIGUITY",
                    f"Skill id target may be a redirect: {target_title}",
                    source,
                    line_number,
                    line,
                    severity="warning",
                )
            )
        if skill_id in seen_ids:
            diagnostics.append(
                _diagnostic(
                    "SKILL_ID_DUPLICATE_ID",
                    f"Duplicate skill id {skill_id}",
                    source,
                    line_number,
                    line,
                    severity="critical",
                    record_id=skill_id,
                )
            )
        else:
            seen_ids[skill_id] = line_number
        normalized_title = target_title.casefold()
        if normalized_title in seen_titles:
            diagnostics.append(
                _diagnostic(
                    "SKILL_ID_DUPLICATE_TITLE",
                    f"Duplicate skill target title {target_title}",
                    source,
                    line_number,
                    line,
                    severity="error",
                    record_id=skill_id,
                )
            )
        else:
            seen_titles[normalized_title] = line_number

        records.append(
            {
                "id": skill_id,
                "skillId": skill_id,
                "title": target_title,
                "sourcePage": source.source_page,
                "sourceUrl": source.source_url,
                "sourceRevisionId": source.source_revision_id,
                "sourceRevisionTimestamp": source.source_revision_timestamp,
                "lineNumber": line_number,
                "provenance": record_provenance(
                    source.source_reference,
                    [
                        provenance_claim(
                            claim_id=f"claim:skill-id:{skill_id}",
                            field_path="",
                            source_ids=[source.source_id],
                            transformation_notes="Parsed from Guild Wars Wiki game integration skill mapping.",
                        ),
                        provenance_claim(
                            claim_id=f"claim:skill-id:{skill_id}:title",
                            field_path="/title",
                            source_ids=[source.source_id],
                            transformation_notes="Normalized page title link target without copying page body prose.",
                        ),
                    ],
                ),
            }
        )

    unique_records = _dedupe_by_first_id(records)
    unique_records.sort(key=lambda record: (int(record["skillId"]), str(record["title"])))
    if emit_gap_diagnostics:
        diagnostics.extend(_gap_diagnostics(unique_records, source, min_id=min_id))
    return unique_records, sorted(diagnostics, key=lambda item: item.stable_key())


def _target_title(line: str, offset: int) -> str | None:
    for match in WIKI_LINK_RE.finditer(line):
        target = match.group(1).strip()
        if target.lower().startswith("game link:skill"):
            continue
        if match.start() >= offset or "Game link:Skill" in line[: match.start()]:
            return target
    tail = line[offset:]
    plain = re.search(r"(?:=|->|:)\s*([^<[{|]+)", tail)
    if plain:
        title = plain.group(1).strip(" '\"\t")
        return title or None
    return None


def _dedupe_by_first_id(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    seen: set[int] = set()
    for record in records:
        skill_id = int(record["skillId"])
        if skill_id in seen:
            continue
        seen.add(skill_id)
        result.append(record)
    return result


def _gap_diagnostics(records: list[dict[str, Any]], source: SkillIdSource, *, min_id: int) -> list[Diagnostic]:
    if not records:
        return []
    ids = [int(record["skillId"]) for record in records]
    missing = [skill_id for skill_id in range(min_id, max(ids) + 1) if skill_id not in set(ids)]
    return [
        Diagnostic(
            code="SKILL_ID_GAP",
            severity="warning",
            message=f"Skill id map is non-contiguous at {skill_id}",
            category="schema-shape-error",
            scope_kind="record",
            record_id=skill_id,
            source_ids=(source.source_id,),
            evidence=(Evidence("source", f"{source.source_page}#{skill_id}", None),),
        )
        for skill_id in missing
    ]


def _diagnostic(
    code: str,
    message: str,
    source: SkillIdSource,
    line_number: int,
    line: str,
    *,
    severity: str = "error",
    record_id: int | None = None,
) -> Diagnostic:
    excerpt = line.strip()
    if len(excerpt) > 120:
        excerpt = f"{excerpt[:117]}..."
    return Diagnostic(
        code=code,
        severity=severity,  # type: ignore[arg-type]
        message=message,
        category="schema-shape-error",
        scope_kind="record",
        record_id=record_id,
        field_path=f"/lines/{line_number}/{json_pointer_escape('mapping')}",
        source_ids=(source.source_id,),
        evidence=(Evidence("source", f"{source.source_page}:L{line_number}", excerpt),),
    )
