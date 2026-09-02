---
id: BW-1006
title: Rune Runtime Docs and Closeout
epic: EPIC-10
status: done
priority: high
depends_on:
  - BW-1005
planned_sprint: SPRINT-011
completed_sprint: SPRINT-011
created: 2026-09-02
updated: 2026-09-02
---

# BW-1006: Rune Runtime Docs and Closeout

## Goal

Document the promoted rune catalog, downstream integration contract, and EPIC-10 deferred scope.

## Scope

- Update README, data docs, compendium notes, and ticket statuses as required by the execution
  sprint.
- Document exact promoted artifact paths, fixture/offline/live regenerate commands, QA gates, and
  source-policy decisions.
- Describe how EPIC-13 and EPIC-14 should consume rune records without importing ingestion-only
  artifacts.
- Record unresolved or intentionally note-only rune behaviors for EPIC-21 analysis work.
- Confirm existing skill editor behavior is unchanged.

## Out Of Scope

- Equipment editor UI, title rank controls, complete stat analysis, backend sync, and guide authoring.

## Acceptance Criteria

- The rune catalog is documented as runtime-eligible only through the promoted JSON path.
- Downstream epics have clear contracts for attribute bonuses, health penalties, stackability, and
  unresolved effects.
- EPIC-10 is ready to mark done only after all promoted artifacts and docs pass verification.

## Verification

- `npm run verify`

## Closeout Evidence

- SPRINT-011 updated README/data/script/compendium docs, created
  `compendium/runes-catalog.md`, recorded downstream EPIC-13/14/15/17/20/21 handoffs, and kept
  `src/app`, editor behavior, local persistence, sharing, backup/restore, template compatibility,
  and EPIC-03/04 promoted artifacts unchanged.
- Validation passed: `npm run data:regenerate`, direct fixed-clock EPIC-10 fixture regeneration,
  `npm run verify`, `rg -n 'EPIC-10|BW-100[1-6]|SPRINT-011' work/tickets/10-runes work/sprints`,
  and `git status --short`.
