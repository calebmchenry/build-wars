---
id: BW-0603
title: Profession and Attribute Rules
epic: EPIC-06
status: done
priority: high
depends_on:
  - BW-0602
planned_sprint: SPRINT-007
completed_sprint: SPRINT-007
created: 2026-09-01
updated: 2026-09-02
---

# BW-0603: Profession and Attribute Rules

## Goal

Validate profession selection and attribute allocations for the MVP build editor.

## Scope

- Validate required and optional primary/secondary profession states.
- Reject impossible primary/secondary combinations while allowing incomplete in-progress builds to surface as warnings where appropriate.
- Enforce primary-only attribute availability.
- Validate that allocated attributes belong to one of the selected professions or to common/no-profession rules where applicable.
- Validate attribute ranks and point spending by level and attribute quest state.
- Report duplicate attribute allocations and unresolved attribute ids.

## Acceptance Criteria

- Legal profession pairs and incomplete profession selections are distinguished.
- Attribute point totals use the canonical point-cost table and level assumptions from the profession/attribute catalog work.
- Primary-only restrictions are enforced without UI-specific logic.
- Tests cover valid allocation, overspending, duplicate attributes, wrong-profession attributes, and unresolved ids.

## Verification

- `npm run verify`
- Profession and attribute rule tests added by the implementation sprint
