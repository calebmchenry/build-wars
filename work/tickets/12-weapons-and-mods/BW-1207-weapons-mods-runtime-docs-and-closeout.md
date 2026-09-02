---
id: BW-1207
title: Weapons/Mods Runtime Docs and Closeout
epic: EPIC-12
status: ready
priority: high
depends_on:
  - BW-1206
created: 2026-09-02
updated: 2026-09-02
---

# BW-1207: Weapons/Mods Runtime Docs and Closeout

## Goal

Document the promoted weapon/mod catalogs, downstream integration contract, and EPIC-12 deferred
scope.

## Scope

- Update README, data docs, compendium notes, and ticket statuses as required by the execution
  sprint.
- Document exact promoted artifact paths, fixture/offline/live regenerate commands, QA gates, and
  source-policy decisions.
- Describe how EPIC-13 and EPIC-14 should consume weapon and modifier records without importing
  ingestion-only artifacts.
- Record unresolved or intentionally note-only weapon/mod behaviors for EPIC-21 analysis work.
- Confirm existing skill editor and EPIC-05 template compatibility behavior is unchanged.

## Out Of Scope

- Equipment editor UI, complete stat analysis, backend sync, party builder work, and guide authoring.

## Acceptance Criteria

- The weapon/mod catalogs are documented as runtime-eligible only through promoted JSON paths.
- Downstream epics have clear contracts for weapon base facts, modifier compatibility, template
  crosswalks, unresolved IDs, and note-only effects.
- EPIC-12 is ready to mark done only after all promoted artifacts and docs pass verification.

## Verification

- `npm run verify`
