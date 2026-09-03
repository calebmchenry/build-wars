---
id: BW-1408
title: Equipment Editor Closeout
epic: EPIC-14
status: ready
priority: high
depends_on:
  - BW-1402
  - BW-1403
  - BW-1404
  - BW-1405
  - BW-1406
  - BW-1407
created: 2026-09-03
updated: 2026-09-03
---

# BW-1408: Equipment Editor Closeout

## Goal

Close out EPIC-14 with accessibility, responsive polish, documentation, and verification.

## Scope

- Verify keyboard, focus, labels, empty states, overflow, and narrow-width behavior across equipment
  controls.
- Update README, compendium notes, ticket statuses, and sprint records as required by the execution
  sprint.
- Document the semantic equipment editor scope and deferred exclusions: skins, dyes, color IDs,
  equipment template-code import/export, runtime icons, full stat analysis, and party equipment.
- Confirm EPIC-16 multi-build workspace can treat a completed build loadout as skills, attributes,
  title ranks, armor, and weapons together.
- Run the canonical repository verification.

## Out Of Scope

- New content ingestion, runtime icon media approval, party builder UI, guide authoring, backend
  sync, and advanced analysis.

## Acceptance Criteria

- Equipment editor workflows are documented and test-covered.
- Deferred compatibility/cosmetic scope is explicit.
- EPIC-14 is ready to mark done only after full verification passes.

## Verification

- `npm run verify`
