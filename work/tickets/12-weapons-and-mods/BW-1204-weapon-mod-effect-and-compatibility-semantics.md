---
id: BW-1204
title: Weapon/Mod Effect and Compatibility Semantics
epic: EPIC-12
status: done
priority: high
depends_on:
  - BW-1201
  - BW-1202
  - BW-1203
planned_sprint: SPRINT-013
completed_sprint: SPRINT-013
created: 2026-09-02
updated: 2026-09-03
---

# BW-1204: Weapon/Mod Effect and Compatibility Semantics

## Goal

Represent deterministic weapon and upgrade compatibility rules precisely enough for later equipment
validation.

## Scope

- Normalize raw fields into structured effects for damage, requirement, attribute bonus, energy,
  health, armor, casting/recharge chance, enchantment, stance, inscription, and note-only families.
- Model deterministic compatibility between weapon base families and prefix, suffix, inscription,
  staff-head, staff-wrapping, shield/offhand, and caster modifier families.
- Represent chance-based and conditional effects as structured notes or conservative effect rules
  where exact calculations are not needed by the equipment editor.
- Add domain fixtures for incompatible mods, missing requirements, two-handed/offhand conflicts,
  caster weapon special cases, unsupported effects, and preserved unknowns.
- Keep raw template preservation separate from semantic compatibility.

## Out Of Scope

- Full combat simulation, DPS calculation, equipment editor UI, and guide recommendations.

## Acceptance Criteria

- Consumers can explain whether a modeled upgrade is compatible with a modeled weapon base.
- Requirement facts remain explicit and do not depend on UI labels.
- Unknown or unsupported modifier behavior remains visible and non-blocking.
- Fixtures document edge cases later EPIC-14 validation must preserve.

## Verification

- `npm run typecheck`
- Focused domain tests for weapon/mod compatibility fixtures
- Focused Python tests for semantic normalization

## Closeout Evidence

- SPRINT-013 added semantic normalization for numeric, damage-type conversion, chance, note-only,
  and unknown weapon modifier effects.
- Added `explainWeaponModCompatibility(base, modifier)` with reason-coded compatible,
  incompatible, and indeterminate outcomes for one-base/one-modifier family, mode, slot, and
  applicability facts.
- Validation passed: `npm run typecheck`, focused compatibility Vitest tests, and focused Python
  semantic-normalization tests.
