---
id: BW-0803
title: Profession Mode and Attribute Editor
epic: EPIC-08
status: ready
priority: high
depends_on:
  - BW-0801
  - BW-0802
created: 2026-09-02
updated: 2026-09-02
---

# BW-0803: Profession Mode and Attribute Editor

## Goal

Build the primary, secondary, mode, and attribute controls for the single-character editor.

## Scope

- Add primary and secondary profession selectors backed by the app catalog boundary.
- Add PvE/PvP/unknown mode selection.
- Show profession-owned attributes and support editable purchased ranks.
- Show remaining attribute points using the EPIC-03 level-20 PvE default budget where applicable.
- Include level and attribute-quest display or controls only to the extent needed by EPIC-08; avoid
  broader campaign progression modeling.
- Preserve inaccessible or unresolved attribute rows imported from a template as warnings rather
  than deleting them.

## Out Of Scope

- Rune/headgear/title/equipment-derived rank adjustments, actual character quest-log state, campaign
  unlock modeling, hero attribute policy, and account constraints.

## Acceptance Criteria

- A user can select profession pair and mode, then allocate attributes for a normal level-20 build.
- Attribute totals are calculated from catalog rules rather than duplicated UI constants.
- Primary-only and profession-mismatch issues can be surfaced through validation.
- Controls are usable with pointer and keyboard input in a desktop browser window.

## Verification

- `npm run verify`
