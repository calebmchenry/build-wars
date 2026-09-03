---
id: BW-1404
title: Armor Controls
epic: EPIC-14
status: done
priority: high
depends_on:
  - BW-1401
  - BW-1402
  - BW-1403
  - EPIC-10
  - EPIC-11
  - EPIC-13
planned_sprint: SPRINT-015
completed_sprint: SPRINT-015
created: 2026-09-03
updated: 2026-09-03
---

# BW-1404: Armor Controls

## Goal

Let users configure build-affecting armor upgrades across the five armor slots.

## Scope

- Render fixed controls for head, chest, hands, legs, and feet.
- Let each armor slot select or clear one rune and one insignia.
- Add headgear attribute bonus selection for the head slot where mechanically relevant.
- Show concise slot summaries and unresolved state.
- Preserve armor state when changing unrelated skill, attribute, title, or weapon fields.
- Avoid skin, dye, color, inventory, and acquisition controls.

## Out Of Scope

- Armor skin cataloging, mannequin rendering, dye/color UI, equipment template-code import/export,
  full stat aggregation, and armor acquisition data.

## Acceptance Criteria

- Users can configure all five armor slots without cosmetic choices.
- Rune and insignia options respect known slot/profession/mode facts where available.
- Headgear bonus changes feed effective attribute display or produce a documented handoff.
- Invalid or incomplete armor state is visible and recoverable.

## Closeout Evidence

- Implemented in SPRINT-015.
- Added five canonical armor rows for rune, insignia, and headgear bonus controls.
- Preserved stale and unresolved selections as selected, clearable authored state.
- Fed headgear and rune rank adjustments into the existing effective-rank display path.

## Verification

- `npm run verify`
