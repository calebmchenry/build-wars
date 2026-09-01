---
id: EPIC-03
title: Professions and Attributes
track: content
status: done
priority: critical
depends_on:
  - EPIC-01
  - EPIC-02
planned_sprint: SPRINT-004
completed_sprint: SPRINT-004
tickets:
  - BW-0301
  - BW-0302
  - BW-0303
  - BW-0304
  - BW-0305
  - BW-0306
updated: 2026-09-01
---

# Professions and Attributes

## Goal

Catalog all professions and attributes needed for build validation, template compatibility, UI display, and skill scaling.

## Scope

* Ten professions with names, abbreviations, ids, icons, campaign availability, and primary attributes.
* All attributes with ids from the skill template format.
* Profession ownership and primary-only restrictions.
* Attribute point cost table and level-based point totals.
* Attribute quest metadata and default level-20 assumptions.
* Inherent primary attribute effect summaries.

## Done When

* Profession and attribute selectors can be generated from data.
* Template ids map correctly to names and back.
* Attribute validation has enough data to enforce legal allocations.

## Notes

This is a dependency for almost every functional epic.

Consume the shared snapshot/provenance and normalized-output contracts from `EPIC-02`; do not introduce a profession-specific scraper. Cross-check profession and attribute ids against template compatibility needs before treating the catalog as complete.
