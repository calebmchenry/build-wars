---
id: BW-1106
title: Insignia Runtime Docs and Closeout
epic: EPIC-11
status: done
priority: high
depends_on:
  - BW-1105
planned_sprint: SPRINT-012
completed_sprint: SPRINT-012
created: 2026-09-02
updated: 2026-09-02
---

# BW-1106: Insignia Runtime Docs and Closeout

## Goal

Document the promoted insignia catalog, downstream integration contract, and EPIC-11 deferred
scope.

## Scope

- Update README, data docs, compendium notes, and ticket statuses as required by the execution
  sprint.
- Document exact promoted artifact paths, fixture/offline/live regenerate commands, QA gates, and
  source-policy decisions.
- Describe how EPIC-13 and EPIC-14 should consume insignia records without importing ingestion-only
  artifacts.
- Record unresolved or intentionally note-only insignia behaviors for EPIC-21 analysis work.
- Confirm existing skill editor behavior is unchanged.

## Out Of Scope

- Equipment editor UI, complete stat analysis, backend sync, and guide authoring.

## Acceptance Criteria

- The insignia catalog is documented as runtime-eligible only through the promoted JSON path.
- Downstream epics have clear contracts for slot-scaled bonuses, restrictions, conditional notes,
  and unresolved effects.
- EPIC-11 is ready to mark done only after all promoted artifacts and docs pass verification.

## Verification

- `npm run verify`

## Closeout Evidence

- SPRINT-012 updated README, data/script docs, `compendium/data-ingestion-platform.md`,
  `compendium/game-rule-engine.md`, created `compendium/insignias-catalog.md`, recorded
  downstream EPIC-13/14/17/20/21 handoffs, and kept `src/app`, editor behavior, local persistence,
  sharing, backup/restore, template compatibility, and EPIC-03/04/10 promoted artifacts unchanged.
- Validation passed: `npm run data:regenerate`, direct fixed-clock EPIC-11 fixture regeneration,
  `npm run verify`, `rg -n 'EPIC-11|BW-110[1-6]|SPRINT-012' work/tickets/11-insignias
work/sprints`, and `git status --short`.
