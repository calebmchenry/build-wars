---
id: BW-1805
title: Skill Bar Drag Drop Refinement
epic: EPIC-18
status: done
priority: critical
planned_sprint: SPRINT-019
completed_sprint: SPRINT-019
depends_on:
  - BW-1802
  - BW-1807
created: 2026-09-03
updated: 2026-09-03
---

# BW-1805: Skill Bar Drag Drop Refinement

## Goal

Refine the eight-slot skill bar so it feels closer to Guild Wars skill-bar
editing and handles the focused composer rules explicitly.

## Scope

- Render eight stable in-game-inspired skill slots in the left composer panel.
- Drag skills from the catalog onto the bar with visible icon feedback.
- Drag filled slots to reorder.
- Drag off the bar or onto an explicit removal target to clear.
- Dropping a skill already on the bar removes it from the previous slot.
- Dropping onto an occupied slot replaces that slot.
- Enforce one elite skill by removing the existing elite when another elite is
  placed.
- Preserve keyboard-accessible alternatives for place, move, replace, and clear.

## Out Of Scope

- Hero AI ordering, party-wide bars, saved hotkeys, mobile-first gesture design,
  and equipment template behavior.

## Acceptance Criteria

- Skill bar placement, replacement, reordering, removal, duplicate movement,
  and one-elite replacement are covered by focused tests.
- Drag feedback shows the skill icon rather than a generic browser ghost where
  the platform allows it.
- Invalid or unresolved slot state cannot corrupt the editor reducer.

## Verification

- `npm run verify`

## Closeout Evidence

- Completed in `SPRINT-019`.
- Added `skill-bar-workflow.ts` plus a catalog-informed `skill-bar-actions.ts` apply path used by
  pointer drop, click placement, and keyboard placement.
- Covered duplicate movement, occupied replacement, bar move/swap, explicit removal, invalid/stale
  payload rejection, raw-overlay preservation, and one resolved elite enforcement.
- Validation evidence: `npm run test:run -- src/app test/domain test/template-compatibility`,
  `npm run verify`, and `git diff --check`.

## Planning

Planned in `SPRINT-019`.
