---
id: BW-1304
title: Equipment Validation Fixtures
epic: EPIC-13
status: done
priority: high
depends_on:
  - BW-1301
  - BW-1302
  - BW-1303
  - EPIC-06
planned_sprint: SPRINT-014
completed_sprint: SPRINT-014
created: 2026-09-03
updated: 2026-09-03
---

# BW-1304: Equipment Validation Fixtures

## Goal

Prepare the rule-engine handoffs and fixtures EPIC-14 needs for clear equipment validation.

## Scope

- Define structured validation cases for armor slot counts, duplicate slots, missing slots,
  invalid rune/insignia restrictions, incompatible weapon modifiers, two-handed/off-hand conflicts,
  missing requirements, and unresolved semantic equipment.
- Decide which issues are errors, warnings, incomplete states, or unresolved states.
- Keep validation deterministic and based on caller-supplied runtime catalog views.
- Add focused domain tests or fixtures without importing generated manifests, QA reports, snapshots,
  Python ingestion modules, or wiki APIs.
- Document the difference between semantic equipment validation and deferred raw template-code
  compatibility.

## Out Of Scope

- Equipment editor UI, full stat aggregation, combat analysis, equipment template exact replay,
  color/skin validation, and party-wide equipment validation.

## Acceptance Criteria

- EPIC-14 can present validation messages without inventing new issue categories.
- Invalid build-affecting equipment state is surfaced without blocking unrelated skill editing.
- Unknown semantic equipment remains recoverable and visibly unresolved.
- Raw equipment template compatibility is explicitly deferred from these fixtures.

## Closeout

- Implemented in SPRINT-014.
- Added optional equipment validation catalog views, duplicate-safe indexes, equipment issue codes,
  equipment locations, bounded traversal, and rule-engine composition after skill rules.
- Added focused validation fixtures for null/empty equipment, topology issues, unresolved
  selections, catalog gaps, restrictions, weapon occupancy, modifiers, requirements, mismatched
  catalog sets, truncation, ordering, and no-mutation behavior.

## Verification

- `npm run typecheck`
- Focused Vitest coverage for equipment validation fixtures
