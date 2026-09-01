---
id: EPIC-21
title: Advanced Analysis
track: functional
status: backlog
priority: low
depends_on:
  - EPIC-06
  - EPIC-08
  - EPIC-14
  - EPIC-17
---

# Advanced Analysis

## Goal

Provide higher-value build analysis after the builder and data model are stable.

## Scope

* Skill revision/history awareness.
* Build freshness warnings after game updates.
* Attribute and title breakpoint helpers.
* Energy pressure warnings.
* Duplicate unique-effect warnings.
* Missing resurrection warnings.
* Enchantment, stance, damage-type, and support-synergy warnings.
* Optional dated decoding behavior inspired by existing decoders.

## Done When

* Analysis rules are data-driven where practical.
* Warnings are explainable and dismissible.
* Users can tell when a build may be outdated because source skill data changed.

## Notes

This should not block MVP. The rule engine should leave room for it.
