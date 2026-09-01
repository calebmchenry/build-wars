---
id: EPIC-18
title: Community Build Knowledge
track: content
status: backlog
priority: medium
depends_on:
  - EPIC-01
  - EPIC-04
---

# Community Build Knowledge

## Goal

Model the non-code information players expect from PvX-style build pages and modern build archives.

## Scope

* Build modes: PvE, PvP, farming, running, hero, team, speed-clear, GvG, HA, RA, AB, FA, JQ, quest, and general.
* Status/rating concepts: testing, working, great, archived, needs update.
* Guide sections: overview, attributes and skills, variants, optional skills, equipment, usage, synergy, counters, and related builds.
* Source attribution and external links.
* PvX markup patterns such as `[build]`, `Variantbar`, skill icons, and guide sections.
* Optional metadata import from PvX or GW1 Builds without copying large prose bodies.

## Done When

* Guide authoring has a stable metadata model.
* Imported or linked community builds can be categorized consistently.
* The project has a clear policy for what community content is copied, linked, or summarized.

## Notes

PvX appears to render build bars through a custom parser extension rather than a separate visual builder. Treat it primarily as a display and content-model reference.
