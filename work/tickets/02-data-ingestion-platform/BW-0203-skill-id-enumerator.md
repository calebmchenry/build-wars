---
id: BW-0203
title: Skill ID Enumerator
epic: EPIC-02
status: backlog
priority: critical
depends_on:
  - BW-0201
  - BW-0202
created: 2026-09-01
---

# BW-0203: Skill ID Enumerator

## Goal

Extract a canonical skill-id-to-page-title map from the Guild Wars Wiki game-integration pages for later skill catalog generation and template compatibility checks.

## Scope

- Fetch `Guild Wars Wiki:Game integration/Skills/*` pages through the shared API client.
- Parse rows linking `Game link:Skill N` to target skill/effect pages.
- Preserve numeric skill id, target title, source page, source revision id, and source URL.
- Handle gaps, non-contiguous IDs, punctuation, parenthetical PvP pages, and special/effect entries without dropping them silently.
- Emit deterministic normalized output under `data/generated/` when source policy allows.
- Produce QA output for duplicate ids, duplicate target titles, parse failures, and unexpected line shapes.
- Use profession/category pages only as QA cross-checks, not the primary ID authority.

## Acceptance Criteria

- The enumerator can parse a minimized fixture containing ordinary, PvP, quoted, and special/effect mappings.
- Duplicate or malformed mappings are reported instead of silently ignored.
- The generated map is sorted by numeric skill id.
- Each mapping includes source provenance.
- Later EPIC-04 and EPIC-05 work can consume the output without re-fetching the same source pages.

## Verification

- `npm run verify`
- Focused skill-id enumeration tests added by the implementation sprint
