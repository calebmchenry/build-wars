---
id: BW-0805
title: Drag and Drop Skill Bar
epic: EPIC-08
status: ready
priority: critical
depends_on:
  - BW-0802
  - BW-0804
created: 2026-09-02
updated: 2026-09-02
---

# BW-0805: Drag and Drop Skill Bar

## Goal

Implement the game-like eight-slot skill bar interaction model for placement, swapping, reordering,
and clearing.

## Scope

- Drag a skill from the browser onto a skill slot to place or replace it.
- Drag filled skill slots to reorder or swap skills.
- Support clearing a slot through drag/remove behavior and an obvious accessible clear action.
- Preserve empty slots, unresolved placeholders, and imported raw IDs until the user replaces or
  clears them.
- Add keyboard-accessible alternatives for placing, moving, swapping, and clearing skills.
- Keep slot dimensions stable for hover, focus, dragging, empty, invalid, and unresolved states.

## Out Of Scope

- Party-wide skill ordering, hero AI preferred ordering, persisted hotkeys, equipment templates,
  and mobile-first gesture design.

## Acceptance Criteria

- A user can build and rearrange an eight-skill bar using game-like drag/drop behavior.
- Keyboard users can perform equivalent slot operations.
- Drag/drop state does not corrupt unresolved imported IDs or empty slots.
- Skill-bar behavior is covered by focused component or integration tests.

## Verification

- `npm run verify`
