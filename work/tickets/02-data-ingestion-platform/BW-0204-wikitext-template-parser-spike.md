---
id: BW-0204
title: Wikitext Template Parser Spike
epic: EPIC-02
status: done
priority: critical
depends_on:
  - BW-0201
  - BW-0202
planned_sprint: SPRINT-003
completed_sprint: SPRINT-003
created: 2026-09-01
updated: 2026-09-01
---

# BW-0204: Wikitext Template Parser Spike

## Goal

Prove the parser approach for extracting structured MediaWiki templates before the skills epic depends on it.

## Scope

- Evaluate Python `mwparserfromhell` as the default local parser for source wikitext.
- Extract top-level and nested templates without regex-only parsing.
- Cover `Skill infobox`, `Skill progression`, `gr`, `gr2`, title-rank progression templates, `pveversion`, `pvpversion`, disambiguation preambles, and redirects.
- Preserve unknown template parameters for QA reporting.
- Normalize template names and parameter names without destroying original raw values.
- Identify when `action=parse` or `action=expandtemplates` is needed as a fallback for hard cases.
- Keep the parser generic enough for later rune, insignia, weapon, title, hero, and equipment extractors.

## Acceptance Criteria

- The spike includes minimized fixtures for ordinary skills, PvP split pages, quoted skill names, title-rank progression, morale-boost recharge, and disambiguation preambles.
- Extracted templates preserve source order and raw parameter values where useful.
- Unknown or unhandled templates are surfaced in QA output.
- The implementation records a recommendation to continue with `mwparserfromhell`, switch to another parser, or use a hybrid fallback.
- No full skill catalog extraction is attempted in this ticket.

## Verification

- `npm run verify`
- Focused parser fixture tests added by the implementation sprint
