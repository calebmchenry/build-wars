---
id: BW-1606
title: Multi-Build Docs and Closeout
epic: EPIC-16
status: done
priority: high
planned_sprint: SPRINT-017
completed_sprint: SPRINT-017
depends_on:
  - BW-1602
  - BW-1603
  - BW-1604
  - BW-1605
created: 2026-09-03
updated: 2026-09-03
---

# BW-1606: Multi-Build Docs and Closeout

## Goal

Document the multi-build workspace behavior, deferred hero/party scope, and verification record.

## Scope

- Update README, compendium notes, ticket statuses, and sprint records as required by the execution
  sprint.
- Document build set storage, local backup/restore, variant workflows, aggregate validation, and
  single-build compatibility.
- Record that EPIC-16 does not add hero catalogs, henchmen, portraits, AI notes, party semantics, or
  external team-template compatibility.
- Hand off party-specific labels, validation, and sharing to EPIC-17.
- Confirm skill editor, equipment editor, title controls, local library, and share workflows remain
  compatible.

## Out Of Scope

- Party builder UI, guide authoring, runtime icon media approval, backend sync, collaboration, and
  account profile management.

## Acceptance Criteria

- Product docs describe build sets as multiple complete loadouts.
- Deferred scope is explicit enough that party/hero/template-code work does not leak into EPIC-16.
- EPIC-16 is ready to mark done only after verification and docs closeout pass.

## Verification

- `npm run verify`

## Closeout Evidence

- Implemented in `SPRINT-017`.
- Documented build sets in `README.md`, `compendium/multi-build-workspace.md`,
  `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`,
  `compendium/equipment-editor.md`, and `compendium/title-ranks.md`.
- Passed `npm run test:run -- src/app test/domain`.
- Passed `npm run verify`.
- Passed `git diff --check`.
