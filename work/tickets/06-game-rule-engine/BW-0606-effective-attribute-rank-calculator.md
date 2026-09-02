---
id: BW-0606
title: Effective Attribute Rank Calculator
epic: EPIC-06
status: done
priority: high
depends_on:
  - BW-0603
planned_sprint: SPRINT-007
completed_sprint: SPRINT-007
created: 2026-09-01
updated: 2026-09-02
---

# BW-0606: Effective Attribute Rank Calculator

## Goal

Compute the effective attribute ranks used by skill descriptions, validation messages, and later equipment/title features.

## Scope

- Calculate base rank from authored attribute allocations.
- Accept manual overrides for previewing skill scaling where the UI needs them.
- Define extension inputs for headgear, rune, weapon, title-rank, and temporary-effect bonuses.
- Keep equipment-derived bonuses optional until equipment content epics are complete.
- Return both the final effective rank and the contributing parts where practical.
- Handle missing or unresolved attributes without crashing validation.

## Acceptance Criteria

- Attribute rank lookup works for allocated, unallocated, and unresolved attributes.
- Manual overrides can be applied deterministically for tooltip previews.
- Future equipment/title bonuses can be added without changing the basic validation API.
- Tests cover base rank, missing rank, override rank, and unresolved attribute cases.

## Verification

- `npm run verify`
- Effective-rank tests added by the implementation sprint
