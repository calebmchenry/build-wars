---
id: BW-1302
title: Armor Slot and Headgear Mechanics
epic: EPIC-13
status: done
priority: high
depends_on:
  - BW-1301
  - EPIC-03
  - EPIC-10
  - EPIC-11
planned_sprint: SPRINT-014
completed_sprint: SPRINT-014
created: 2026-09-03
updated: 2026-09-03
---

# BW-1302: Armor Slot and Headgear Mechanics

## Goal

Define the generic armor-slot model needed to attach runes, insignias, and headgear attribute
bonuses.

## Scope

- Model armor slots as `head`, `chest`, `hands`, `legs`, and `feet`.
- Define rune and insignia attachment points per armor piece using EPIC-10/11 catalog IDs.
- Represent headgear attribute bonus behavior where it affects authored or effective attribute
  ranks.
- Represent base armor/profession armor facts only where needed for validation or stat display.
- Add fixtures for legal attachments, duplicate or missing slots, invalid profession restrictions,
  headgear attribute changes, and incomplete armor.

## Out Of Scope

- Armor skins, armor campaigns, prestige/normal appearance, dyes, color IDs, vendor/drop/quest
  acquisition, mannequin rendering, equipment-template-code import/export, and full stat
  aggregation.

## Acceptance Criteria

- Armor pieces can attach known rune and insignia IDs without importing generated catalogs directly
  into UI components.
- Headgear bonus state is explicit and can be consumed by existing effective-attribute calculations
  or a documented later handoff.
- Base armor facts are minimal and mechanically justified.
- Invalid or incomplete armor state produces structured validation fixtures, not crashes.

## Closeout

- Implemented in SPRINT-014.
- Added target-aware equipment rank-adjustment helpers for validated headgear and attribute-rune
  selections.
- Reused `summarizeAttributeRuneEffects` for highest-per-attribute rune stacking.
- Documented source-policy evidence for the fixed headgear fact in sprint execution notes; numeric
  base armor remains deferred because EPIC-13 has no totals consumer.

## Verification

- `npm run typecheck`
- Focused Vitest coverage for armor slot and headgear fixtures
