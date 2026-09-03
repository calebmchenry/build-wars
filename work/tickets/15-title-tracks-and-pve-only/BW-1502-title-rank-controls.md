---
id: BW-1502
title: Title Rank Controls
epic: EPIC-15
status: ready
priority: high
depends_on:
  - BW-1501
  - EPIC-08
created: 2026-09-03
updated: 2026-09-03
---

# BW-1502: Title Rank Controls

## Goal

Provide precise, low-noise controls for changing title ranks from their max-rank defaults.

## Scope

- Add a compact title-rank panel, popover, or editor section consistent with the existing UI.
- Show controls for title ranks used by the current skill bar by default.
- Support an optional expanded view for all discovered title ranks.
- Use integer stepper/number input controls with decrement, increment, direct entry, and reset to
  max.
- Display each control's max rank quietly, such as `8 / 12`.
- Preserve keyboard and screen-reader usability.

## Out Of Scope

- Slider-only controls, account profile management, title acquisition guides, backend sync, and
  broad dashboard-style title tracking.

## Acceptance Criteria

- Users can change a relevant title rank without leaving the core build editor.
- Ranks cannot be set outside the discovered min/max range.
- Resetting a title removes the override and returns to implicit max-rank behavior.
- The controls do not dominate builds that have no title-scaled skills.

## Verification

- `npm run test:run -- src/app`
- Focused component tests for keyboard entry, increment/decrement, reset-to-max, and relevant-title
  filtering
