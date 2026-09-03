---
id: BW-1503
title: Title Tooltip and Display Integration
epic: EPIC-15
status: ready
priority: high
depends_on:
  - BW-1501
  - BW-1502
created: 2026-09-03
updated: 2026-09-03
---

# BW-1503: Title Tooltip and Display Integration

## Goal

Render title-scaled skill descriptions from selected title ranks instead of hard-coded max-rank
assumptions.

## Scope

- Feed selected/default title ranks into `renderSkillTooltipText`.
- Replace current maximum-title-rank assumption copy with configured-rank display where useful.
- Update skill rows, skill bar slots, and tooltip panels consistently.
- Preserve structured-only description behavior and unresolved progression diagnostics.
- Add tests for title-scaled skills at max rank, lowered rank, missing progression data, and alias
  handling.

## Out Of Scope

- Copied source-authored skill prose, title acquisition display, runtime icon media, and full guide
  rendering.

## Acceptance Criteria

- A title-scaled skill renders at max rank by default.
- Lowering a rank updates every relevant skill display path deterministically.
- The UI no longer presents max rank as an assumption when it is represented by explicit default
  behavior.
- Unsupported title progression data remains visible as a structured unresolved state.

## Verification

- `npm run test:run -- src/app src/domain`
- Focused selector and tooltip tests for title-rank rendering
