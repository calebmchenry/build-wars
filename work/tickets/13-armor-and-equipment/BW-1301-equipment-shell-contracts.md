---
id: BW-1301
title: Equipment Shell Contracts
epic: EPIC-13
status: done
priority: critical
depends_on:
  - EPIC-03
  - EPIC-10
  - EPIC-11
  - EPIC-12
planned_sprint: SPRINT-014
completed_sprint: SPRINT-014
created: 2026-09-03
updated: 2026-09-03
---

# BW-1301: Equipment Shell Contracts

## Goal

Define the semantic equipment loadout contract that EPIC-14 can edit without exposing raw equipment
template fields or cosmetic item choices.

## Scope

- Define or revise framework-neutral equipment types for one single-character build loadout.
- Represent five armor slots, up to four weapon sets, empty states, partial states, and selected
  catalog IDs for runes, insignias, weapons, and weapon modifiers.
- Keep armor and weapon skin identity, dye/color IDs, inventory item identity, and acquisition facts
  out of the semantic model.
- Provide constructors, fixtures, or test helpers for empty/default loadouts if useful to the app
  and rule engine.
- Preserve enough nullable or unresolved semantic state for users to recover incomplete edits.

## Out Of Scope

- Equipment editor UI, equipment template-code import/export, raw template exact replay, armor/weapon
  skin catalogs, dye/color controls, remote icons, backend storage, and party equipment.

## Acceptance Criteria

- `src/domain` remains plain-data and framework-neutral.
- Equipment contracts attach only build-relevant catalog IDs and mechanical fields.
- Color IDs and skin IDs are absent from semantic equipment contracts.
- Empty and partial equipment loadouts are representable without validation crashes.
- Existing build, local library, and skill-template behavior remains compatible.

## Closeout

- Implemented in SPRINT-014.
- Added `EquipmentLoadout` as the preferred semantic authored equipment type while retaining
  `EquipmentTemplate` as a deprecated alias.
- Verified default topology, nullable equipment compatibility, JSON-compatible known and unresolved
  selections, and current null-equipment app/template regressions.

## Verification

- `npm run typecheck`
- Focused Vitest coverage for equipment shell fixtures and empty/partial loadouts
