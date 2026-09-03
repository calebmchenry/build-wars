---
id: BW-1303
title: Weapon Set Shell
epic: EPIC-13
status: ready
priority: high
depends_on:
  - BW-1301
  - EPIC-03
  - EPIC-12
created: 2026-09-03
updated: 2026-09-03
---

# BW-1303: Weapon Set Shell

## Goal

Define the semantic weapon-set container needed to attach EPIC-12 weapons and modifiers to a build.

## Scope

- Represent up to four weapon sets with main-hand, off-hand, two-handed, and empty-slot occupancy.
- Attach selected EPIC-12 weapon IDs and weapon modifier IDs without copying weapon/mod catalog data
  into authored build state.
- Represent requirement attribute selection or override only where the selected catalog record needs
  authored input.
- Add fixtures for two-handed/off-hand conflicts, empty sets, partial sets, incompatible modifier
  slots, missing requirements, and unresolved semantic selections.
- Leave detailed compatibility checks to the EPIC-12 helper and EPIC-14 validation UI where
  appropriate.

## Out Of Scope

- Equipment template item IDs, dye/color IDs, weapon skins, unique item variants, acquisition facts,
  DPS calculations, party weapon sets, and equipment-template-code import/export.

## Acceptance Criteria

- Weapon sets can represent practical PvE/PvP equipment choices without cosmetic state.
- A two-handed weapon cannot silently coexist with an off-hand item in the same set.
- Weapon/mod attachments preserve catalog IDs and unresolved semantic placeholders where needed.
- The contract is sufficient for EPIC-14 controls and validation messages.

## Verification

- `npm run typecheck`
- Focused Vitest coverage for weapon-set fixtures and occupancy rules
