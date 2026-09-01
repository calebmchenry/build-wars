from __future__ import annotations

import html
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class WikiTable:
    index: int
    raw: str
    rows: tuple[tuple[str, ...], ...]


def section_text(wikitext: str, heading: str) -> str:
    pattern = re.compile(rf"^(=+)\s*{re.escape(heading)}\s*\1\s*$", flags=re.IGNORECASE | re.MULTILINE)
    match = pattern.search(wikitext)
    if match is None:
        return ""
    level = len(match.group(1))
    body_start = match.end()
    next_heading = re.compile(r"^(=+)\s*[^=\n].*?\s*\1\s*$", flags=re.MULTILINE)
    for candidate in next_heading.finditer(wikitext, body_start):
        if len(candidate.group(1)) <= level:
            return wikitext[body_start : candidate.start()]
    return wikitext[body_start:]


def extract_wiki_tables(wikitext: str) -> list[WikiTable]:
    tables: list[WikiTable] = []
    start = 0
    while True:
        table_start = wikitext.find("{|", start)
        if table_start < 0:
            return tables
        table_end = wikitext.find("|}", table_start)
        if table_end < 0:
            raw = wikitext[table_start:]
            start = len(wikitext)
        else:
            raw = wikitext[table_start : table_end + 2]
            start = table_end + 2
        tables.append(WikiTable(index=len(tables), raw=raw, rows=tuple(_parse_table_rows(raw))))


def parse_index_list(section: str) -> list[tuple[int, str, int, str]]:
    rows: list[tuple[int, str, int, str]] = []
    for line_number, line in enumerate(section.splitlines(), start=1):
        match = re.match(r"^\s*\*\s*([+-]?\d+)\s*[-–:]\s*(.+?)\s*$", line)
        if match is None:
            continue
        name = first_wiki_link(match.group(2)) or strip_markup(match.group(2))
        rows.append((int(match.group(1)), name, line_number, line.strip()))
    return rows


def first_wiki_link(value: str) -> str | None:
    links = wiki_links(value)
    return links[0] if links else None


def wiki_links(value: str) -> list[str]:
    links: list[str] = []
    for match in re.finditer(r"\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?]]", value):
        target = strip_markup(match.group(2) or match.group(1))
        if target:
            links.append(target)
    return links


def strip_markup(value: str) -> str:
    cleaned = re.sub(r"<!--.*?-->", "", value, flags=re.DOTALL)
    cleaned = re.sub(r"<br\s*/?>", "\n", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"</?[^>]+>", "", cleaned)
    cleaned = re.sub(r"\{\{[^{}]*}}", " ", cleaned)
    cleaned = re.sub(r"\[\[([^\]|#]+)(?:#[^\]|]+)?\|([^\]]+)]]", r"\2", cleaned)
    cleaned = re.sub(r"\[\[([^\]|#]+)(?:#[^\]|]+)?]]", r"\1", cleaned)
    cleaned = re.sub(r"'''?", "", cleaned)
    cleaned = html.unescape(cleaned)
    cleaned = cleaned.replace("\xa0", " ")
    return re.sub(r"\s+", " ", cleaned).strip()


def safe_key(value: str) -> str:
    return re.sub(r"\s+", " ", strip_markup(value)).casefold()


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-") or "unknown"


def _parse_table_rows(table: str) -> list[tuple[str, ...]]:
    rows: list[tuple[str, ...]] = []
    current: list[str] = []

    def flush() -> None:
        nonlocal current
        cells = _split_cells(current)
        if cells:
            rows.append(tuple(cells))
        current = []

    for raw_line in table.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("{|") or line == "|}":
            continue
        if line.startswith("|-"):
            flush()
            continue
        if line.startswith("!") or line.startswith("|+"):
            continue
        if line.startswith("|"):
            current.append(line[1:].strip())
            continue
        if current:
            current[-1] = f"{current[-1]}\n{line}".strip()
    flush()
    return rows


def _split_cells(lines: list[str]) -> list[str]:
    if not lines:
        return []
    if len(lines) == 1 and "||" in lines[0]:
        return [cell.strip() for cell in lines[0].split("||")]
    cells: list[str] = []
    for line in lines:
        if "||" in line:
            cells.extend(cell.strip() for cell in line.split("||"))
        elif line:
            cells.append(line.strip())
    return cells
