---
id: BW-0602
title: Build Catalog Validation Context
epic: EPIC-06
status: done
priority: high
depends_on:
  - BW-0601
planned_sprint: SPRINT-007
completed_sprint: SPRINT-007
created: 2026-09-01
updated: 2026-09-02
---

# BW-0602: Build Catalog Validation Context

## Goal

Create the lookup context the rule engine uses to validate authored builds against generated profession, attribute, and skill catalogs.

## Scope

- Accept a `Build` plus catalog slices for professions, attributes, and skills.
- Build deterministic lookup maps for ids used by the current validation pass.
- Track unresolved or unknown profession, attribute, skill, rune, insignia, armor, and weapon ids without losing the original authored value.
- Support game mode and catalog-version inputs where available.
- Keep the context independent from app storage, React state, and data-fetching scripts.

## Acceptance Criteria

- Validators can look up catalog records by id without repeating map-building logic.
- Unknown imported ids produce structured unresolved-reference issues rather than destructive coercion.
- The context can be constructed from small test fixtures.
- The API can be extended by later equipment/title epics without breaking existing callers.

## Verification

- `npm run verify`
- Context fixture tests added by the implementation sprint
