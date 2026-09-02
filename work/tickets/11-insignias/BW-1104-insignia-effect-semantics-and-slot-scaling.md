---
id: BW-1104
title: Insignia Effect Semantics and Slot Scaling
epic: EPIC-11
status: done
priority: high
depends_on:
  - BW-1101
  - BW-1103
planned_sprint: SPRINT-012
completed_sprint: SPRINT-012
created: 2026-09-02
updated: 2026-09-02
---

# BW-1104: Insignia Effect Semantics and Slot Scaling

## Goal

Represent insignia effects and slot-scaled behavior precisely enough for later equipment validation
and stat display.

## Scope

- Normalize extracted raw fields into structured effects for health, energy, armor, damage
  reduction, conditional bonuses, and policy-reviewed notes.
- Represent armor-piece scaling explicitly for head, chest, hands, legs, and feet where the source
  data supports deterministic values.
- Model verified non-stacking and conditional behavior conservatively without pretending to simulate
  combat state.
- Add domain fixtures that cover slot-scaled values, profession restrictions, conditional effects,
  unsupported effects, and note-only records.
- Leave armor-piece selection and equipment UI to EPIC-13/14.

## Out Of Scope

- Full character stat calculator, combat simulation, equipment editor UI, rune behavior, and armor
  shell cataloging.

## Acceptance Criteria

- Consumers can display per-piece deterministic bonuses from insignia records.
- Conditional or combat-state-dependent effects remain visible and explainable.
- Unknown insignia behavior remains non-blocking and appears in QA.
- Fixtures document the edge cases later EPIC-14 validation must preserve.

## Verification

- `npm run typecheck`
- Focused domain tests for insignia effect and slot-scaling fixtures
- Focused Python tests for semantic normalization

## Closeout Evidence

- SPRINT-012 added table-driven insignia semantic normalization for health, energy, armor rating,
  incoming damage, duration, outgoing damage, note-only, and unknown effects.
- Numeric effects expose tagged outcomes for all five armor slots, and
  `resolveInsigniaEffectsForArmorSlot(record, slot)` projects one record/slot without legality,
  condition evaluation, aggregation, rune composition, or totals.
- Validation passed: `npm run typecheck`,
  `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest
build_wars_ingest.tests.test_insignia_semantics build_wars_ingest.tests.test_insignia_catalog`,
  and the focused insignia domain Vitest subset.
