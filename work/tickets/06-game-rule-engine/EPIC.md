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

## Done When

* A build can be validated without depending on UI state.
* Validation covers MVP skill and attribute rules.
* Equipment validation can be enabled incrementally as content coverage arrives.
* Tests cover common valid builds and known invalid edge cases.

## Notes

This should be a domain service, not UI logic. Prefer explainable warnings over silent coercion.
