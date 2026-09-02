---
id: BW-0806
title: Skill Display and Tooltips
epic: EPIC-08
status: ready
priority: high
depends_on:
  - BW-0801
  - BW-0802
  - BW-0803
created: 2026-09-02
updated: 2026-09-02
---

# BW-0806: Skill Display and Tooltips

## Goal

Render skill rows, tiles, bar slots, and tooltip text from the promoted skill catalog and current
effective-rank context.

## Scope

- Display skill name, type, profession, attribute, elite marker, mode availability, and available
  cost/timing facts.
- Use `renderSkillTooltipText` or equivalent domain helpers for description text projection.
- Use authored effective attribute ranks for attribute-scaled skill text.
- Use a max-title-rank display assumption for title-scaled skill text.
- Show unresolved tooltip states for unknown skills, missing progression values, unsupported
  descriptions, and catalog gaps.
- Follow the visual hierarchy documented in `compendium/visual-prior-art.md` without copying source
  media or exact screenshot geometry.

## Out Of Scope

- Title-rank controls, title ownership validation, allegiance side selection, copied source-authored
  prose review, remote icon loading, and equipment/rune/weapon effects.

## Acceptance Criteria

- Normal attribute-scaled skill text updates when the relevant attribute rank changes.
- Title-scaled skill text renders with the documented max-rank assumption.
- Unsupported or unresolved descriptions render an explainable non-crashing state.
- Tooltips work for browser rows, grid tiles, and skill-bar slots in pointer and keyboard flows.

## Verification

- `npm run verify`
