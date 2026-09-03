---
id: BW-1604
title: Variant Workflows
epic: EPIC-16
status: done
priority: high
planned_sprint: SPRINT-017
completed_sprint: SPRINT-017
depends_on:
  - BW-1601
  - BW-1602
  - BW-1603
created: 2026-09-03
updated: 2026-09-03
---

# BW-1604: Variant Workflows

## Goal

Support common "try another version" workflows without forcing party semantics.

## Scope

- Duplicate the selected loadout as a variant with a clear label.
- Let users rename, reorder, remove, and promote variants inside a build set.
- Provide a compact comparison view for skill-bar, attribute, title-rank, and equipment differences
  where practical.
- Preserve original and variant build identities so saving one does not unexpectedly overwrite the
  other.
- Keep variant notes short and local-first.

## Out Of Scope

- Recommendation engines, automatic build optimization, guide authoring, community metadata import,
  party role analysis, and external team-template compatibility.

## Acceptance Criteria

- Users can create and edit a variant from an existing build in one action.
- Difference display is deterministic and useful even when equipment is partial.
- Removing or promoting a variant has explicit behavior and does not silently delete unrelated
  saved builds.
- Variants remain plain build set entries.

## Verification

- `npm run test:run -- src/app`
- Focused tests for duplicate, compare, rename, remove, reorder, and promote flows

## Closeout Evidence

- Implemented in `SPRINT-017`.
- Passed `npm run test:run -- src/app/build-set-state.test.ts src/app/build-set-comparison.test.ts src/app/build-set-comparison.test.tsx src/app/build-set-navigator.test.tsx`.
- Passed `npm run verify`.
