---
id: BW-1405
title: Weapon Set Controls
epic: EPIC-14
status: done
priority: high
depends_on:
  - BW-1401
  - BW-1402
  - BW-1403
  - EPIC-12
  - EPIC-13
planned_sprint: SPRINT-015
completed_sprint: SPRINT-015
created: 2026-09-03
updated: 2026-09-03
---

# BW-1405: Weapon Set Controls

## Goal

Let users configure practical weapon sets using EPIC-12 weapon and modifier data.

## Scope

- Render four weapon-set rows or sections.
- Support empty set, main-hand/off-hand set, and two-handed weapon set states.
- Let users select weapons, requirements where authored input is needed, and compatible modifiers.
- Prevent or warn on impossible hand occupancy, such as two-handed plus off-hand in one set.
- Show requirement and modifier-slot state near the selected weapon.
- Avoid weapon skin, dye/color, unique item, and acquisition controls.

## Out Of Scope

- DPS calculations, weapon recommendations, drag/drop-first weapon editing, equipment template-code
  import/export, party weapon assignment, and inventory management.

## Acceptance Criteria

- Users can configure four weapon sets with clear hand occupancy.
- Modifier choices are constrained or warned by EPIC-12 compatibility facts.
- Missing or unmet requirements are visible.
- Empty and partial weapon sets remain recoverable editor state.

## Closeout Evidence

- Implemented in SPRINT-015.
- Added four canonical weapon-set sections with main-hand and off-hand controls.
- Added weapon and modifier option models for empty, stale, unresolved, wrong-hand, two-handed,
  off-hand-only, and compatibility states.
- Enforced dense bounded modifier writes and preserved modifiers unless the user explicitly clears
  the modifier, hand, or set.

## Verification

- `npm run verify`
