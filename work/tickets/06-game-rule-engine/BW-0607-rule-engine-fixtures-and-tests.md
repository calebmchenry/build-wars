---
id: BW-0607
title: Rule Engine Fixtures and Tests
epic: EPIC-06
status: backlog
priority: high
depends_on:
  - BW-0601
  - BW-0602
  - BW-0603
  - BW-0604
  - BW-0605
  - BW-0606
created: 2026-09-01
---

# BW-0607: Rule Engine Fixtures and Tests

## Goal

Create focused fixtures that prove the MVP rule engine behaves predictably across valid builds, invalid builds, partial edits, and catalog gaps.

## Scope

- Add small profession, attribute, and skill fixtures that do not depend on full generated data.
- Cover a known-valid build, incomplete in-progress build, invalid profession pair, overspent attributes, wrong-profession skill, duplicate elite, too many PvE-only skills, and unresolved imported ids.
- Assert deterministic issue ordering so UI snapshots and tests stay stable.
- Include regression fixtures for attribute point spending and effective-rank calculations.
- Document which fixture cases are MVP validation rules versus placeholders for later equipment/title epics.

## Acceptance Criteria

- Rule tests can run without live network access or generated wiki snapshots.
- Fixture records are minimal but representative of real Guild Wars data shapes.
- Issue ordering, severity, codes, and affected paths are asserted.
- Later rule groups can add fixtures without rewriting the original MVP cases.

## Verification

- `npm run verify`
- Focused rule-engine fixture tests added by the implementation sprint
