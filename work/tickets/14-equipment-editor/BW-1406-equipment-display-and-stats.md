---
id: BW-1406
title: Equipment Display and Stats
epic: EPIC-14
status: ready
priority: high
depends_on:
  - BW-1404
  - BW-1405
created: 2026-09-03
updated: 2026-09-03
---

# BW-1406: Equipment Display and Stats

## Goal

Show selected equipment and simple build-affecting stat summaries without pretending to simulate
combat.

## Scope

- Render concise equipment summaries for armor slots and weapon sets.
- Add tooltip/display content for selected runes, insignias, weapons, and modifiers using approved
  structured facts.
- Show simple health delta, energy delta, armor notes, headgear/rune attribute effects, requirement
  notes, and unresolved state.
- Keep conditional effects visible as notes when exact evaluation is out of scope.
- Preserve placeholder icon treatment until a future media/icon ticket approves runtime images.

## Out Of Scope

- Full DPS, damage, duration, hit-location, condition, enchantment, stance, hero AI, or party synergy
  calculations; copied source prose; remote image fetching.

## Acceptance Criteria

- Users can understand what selected equipment contributes at a glance.
- Simple stat summaries are explainable and traceable to selected records.
- Conditional or unknown effects are not silently folded into totals.
- Equipment display remains consistent across editor rows, summaries, and tooltips.

## Verification

- `npm run test:run -- src/app src/domain`
- Focused selector/display tests for summaries, tooltip facts, simple stat deltas, and note-only
  effects
