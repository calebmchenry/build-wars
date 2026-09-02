---
id: BW-1006
title: Rune Runtime Docs and Closeout
epic: EPIC-10
status: ready
priority: high
depends_on:
  - BW-1005
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
