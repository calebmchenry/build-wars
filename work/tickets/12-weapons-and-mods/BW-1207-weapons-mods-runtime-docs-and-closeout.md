---
id: BW-1207
title: Weapons/Mods Runtime Docs and Closeout
epic: EPIC-12
status: done
priority: high
depends_on:
  - BW-1206
planned_sprint: SPRINT-013
completed_sprint: SPRINT-013
created: 2026-09-02
updated: 2026-09-03
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

## Closeout Evidence

- SPRINT-013 updated README, data docs, data-script docs, source-snapshot/QA/generated artifact
  docs, compendium data-ingestion notes, and added `compendium/weapons-and-mods-catalog.md`.
- Documentation records exact runtime artifact paths, fixture/live/offline commands, runtime/audit
  boundaries, source authority, identity policy, lookup outcomes, compatibility helper scope, and
  EPIC-13/14/17/20/21 handoffs.
- Current editor, local persistence, sharing, backup/restore, EPIC-03/04/10/11 runtime catalogs, and
  EPIC-05 raw equipment-template decode/export behavior remain unchanged.
