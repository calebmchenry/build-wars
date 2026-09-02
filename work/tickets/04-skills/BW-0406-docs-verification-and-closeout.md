---
id: BW-0406
title: Skills Docs, Verification, and Closeout
epic: EPIC-04
status: done
priority: high
depends_on:
  - BW-0405
planned_sprint: SPRINT-005
completed_sprint: SPRINT-005
created: 2026-09-01
updated: 2026-09-02
---

# BW-0406: Skills Docs, Verification, and Closeout

## Goal

Document how the EPIC-04 skills catalog is generated, verified, promoted, and consumed by later template, rule-engine, search, tooltip, and guide-authoring work.

## Scope

- Update data and ingestion docs with EPIC-04 profile commands, exact promoted paths, source-set limits, fixture/offline/live behavior, and regeneration expectations.
- Document source-policy decisions for raw descriptions, rendered descriptions, icons, split relationships, progression metadata, and optional acquisition metadata.
- Record deferred behavior for acquisition metadata, template import/export, UI search, runtime attribution display, equipment/rune/title effects, hero-only or monster-only handling, and balance-update diff UX.
- Update ticket and sprint planning records after the implementation verifies all acceptance criteria.
- Keep `npm run verify` as the canonical offline validation command.

## Acceptance Criteria

- README and data docs name the EPIC-04 generated catalog status and consumption boundaries.
- Future EPIC-05, EPIC-06, EPIC-08, EPIC-15, EPIC-19, and EPIC-20 implementers can identify the approved skills data path and its known limitations.
- Documentation clearly states that schema v1 excludes acquisition metadata and that runtime app code consumes only `skills.catalog.json`.
- Ticket statuses, epic status, sprint checklist, ledger, and run manifest are internally consistent after execution.
- No unreviewed source-derived prose, raw snapshots, icon bytes, or QA summaries are promoted accidentally.

## Verification

- `npm run verify`
- `git status --short`
- `git check-ignore -v` checks for ignored raw outputs and exact-path promoted catalog exceptions
