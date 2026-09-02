---
id: BW-1004
title: Rune Effect Semantics and Validation Fixtures
epic: EPIC-10
status: ready
priority: high
depends_on:
  - BW-1001
  - BW-1003
created: 2026-09-02
updated: 2026-09-02
---

# BW-1004: Rune Effect Semantics and Validation Fixtures

## Goal

Represent rune effects and stacking behavior precisely enough for later equipment validation and
stat display.

## Scope

- Normalize extracted raw fields into structured effects for attribute bonuses, health penalties,
  health bonuses, energy bonuses, and policy-reviewed notes.
- Model attribute-rune stacking as a per-attribute highest-bonus rule while keeping verified health
  penalties independently countable.
- Model verified non-attribute rune stackability and non-stackability without inventing unsupported
  calculations.
- Add rule-engine or domain fixtures that cover duplicate attribute runes, multiple health
  penalties, common non-attribute runes, unsupported effects, and headgear handoff facts.
- Leave armor-piece selection and equipment UI to EPIC-13/14.

## Out Of Scope

- Full character stat calculator, combat simulation, equipment editor UI, and armor shell cataloging.

## Acceptance Criteria

- Consumers can compute or explain the effective attribute contribution from rune records.
- Health penalties are not lost when duplicate attribute runes are present.
- Unknown or conditional rune behavior remains visible and non-blocking.
- Fixtures document the edge cases later EPIC-14 validation must preserve.

## Verification

- `npm run typecheck`
- Focused domain tests for rune effect and stacking fixtures
- Focused Python tests for semantic normalization
