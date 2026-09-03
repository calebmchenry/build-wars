---
id: BW-1804
title: Attribute Allocation Editor
epic: EPIC-18
status: backlog
priority: high
depends_on:
  - BW-1802
  - BW-1803
created: 2026-09-03
updated: 2026-09-03
---

# BW-1804: Attribute Allocation Editor

## Goal

Render active profession attributes in an in-game-inspired allocation list with
clear point investment and refund controls.

## Scope

- List available primary and secondary profession attributes in a stable order.
- For each row, show decrement cost/refund, increment cost, allocated rank, and
  attribute name.
- Hide decrement affordance when no points are allocated.
- Hide increment affordance when the rank cannot be increased because of rank
  cap or remaining-point constraints.
- Preserve the distinction between allocated rank and effective rank so future
  rune/headgear bonuses can render blue modified ranks.
- Reuse existing attribute point and validation rules.

## Out Of Scope

- Rune and headgear editing, exact final in-game attribute ordering, temporary
  attribute effects, and equipment-driven rank changes.

## Acceptance Criteria

- A user can allocate and refund attribute points from the composer panel.
- Cost/refund numbers match the existing point-budget rules.
- Rank rendering has an explicit normal-vs-augmented visual path, even if
  augmentation is not fully editable in this ticket.
- Attribute changes update validation and template export eligibility.

## Verification

- `npm run verify`
