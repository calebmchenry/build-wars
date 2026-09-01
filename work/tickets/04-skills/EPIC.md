---
id: EPIC-04
title: Skills
track: content
status: backlog
priority: critical
depends_on:
  - EPIC-01
  - EPIC-03
  - EPIC-02
---

# Skills

## Goal

Catalog every Guild Wars skill with enough structured data for search, display, scaling, validation, import/export, and guide authoring.

## Scope

* Skill id, name, icon, campaign, profession, attribute, type, and wiki URL.
* Energy, adrenaline, sacrifice, upkeep, overcast, activation, and recharge.
* Elite, PvE-only, PvP-only, PvE/PvP split, common, no-attribute, title, and special-skill flags.
* Raw and rendered descriptions.
* Progression data for green-number scaling.
* Skill acquisition metadata only if it proves useful for guides.
* Revision metadata so balance-update diffs are possible.

## Done When

* All known skill template ids resolve.
* Skill search and tooltips can be driven from catalog data.
* QA reports flag missing icons, costs, descriptions, progressions, and split relationships.

## Notes

Skill data is the largest MVP content effort. Use fixtures for tricky cost types: elite, signet, adrenaline, sacrifice, upkeep, overcast, title, and morale-boost recharge.
