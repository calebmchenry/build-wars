---
id: EPIC-06
title: Game Rule Engine
track: functional
status: backlog
priority: high
depends_on:
  - EPIC-00
  - EPIC-03
  - EPIC-04
tickets:
  - BW-0601
  - BW-0602
  - BW-0603
  - BW-0604
  - BW-0605
  - BW-0606
  - BW-0607
updated: 2026-09-01
---

# Game Rule Engine

## Goal

Represent enough Guild Wars rules to warn users when a build is invalid, incomplete, or misleading.

## Scope

* Validate primary and secondary profession combinations.
* Enforce primary-only attribute availability.
* Validate attribute point spending by level and attribute quest state.
* Validate skill bar limits: eight slots, one elite, PvE-only limits, PvP restrictions, allegiance conflicts.
* Provide extension points for rune, insignia, armor, weapon, and modifier compatibility as equipment content arrives.
* Compute effective attribute ranks from points, headgear, runes, title ranks, and manual overrides.
* Provide structured validation messages that UI can render.

## Technical Direction

* Keep the rule engine in the domain layer. It should not depend on React components, browser storage, or view-specific state.
* Expose pure validation and calculation APIs that accept a `Build`, catalog records from the generated data layer, and optional rule configuration.
* Return deterministic validation issues instead of throwing for normal user-authored invalid builds.
* Use stable issue fields: severity, code, message, affected path or slot, related ids, and source rule where practical.
* Treat unknown imported ids as warnings or unresolved references where possible so template import/export can preserve data without destructive rejection.
* Split MVP validation into profession pair rules, attribute allocation rules, skill-bar composition rules, skill eligibility rules, and effective-rank calculations.
* Leave explicit extension points for equipment, title-track, and advanced analysis rules without requiring those later epics to be complete.
* Keep validation messages explainable and suitable for UI rendering, but do not make this epic responsible for final UI copy or layout.

## Initial Grooming Targets

* Validation issue and result contracts.
* Build/catalog validation context assembly.
* Profession pair and attribute allocation rules.
* Skill-bar composition rules.
* Skill eligibility and game-mode rules.
* Effective attribute rank calculation.
* Focused fixture coverage for valid builds, invalid builds, unknown ids, and catalog gaps.

## Done When

* A build can be validated without depending on UI state.
* Validation covers MVP skill and attribute rules.
* Equipment validation can be enabled incrementally as content coverage arrives.
* Tests cover common valid builds and known invalid edge cases.

## Notes

This should be a domain service, not UI logic. Prefer explainable warnings over silent coercion.
