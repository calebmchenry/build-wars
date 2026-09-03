---
id: EPIC-17
title: Party Semantics and Sharing
track: functional
status: ready
priority: medium
depends_on:
  - EPIC-16
tickets:
  - BW-1702
  - BW-1703
  - BW-1704
  - BW-1705
  - BW-1706
updated: 2026-09-03
---

# Party Semantics and Sharing

## Goal

Let a multi-build workspace be treated as a party or team when the user wants party-specific labels,
ordering, validation, and sharing.

## Scope

* Party/team annotations on top of EPIC-16 build sets.
* Slot labels, ordering, party size presets, empty slots, and freeform roles.
* Lightweight member kind labels such as player, hero, mercenary, guest, or freeform when useful.
* Party-level overview and validation for incomplete members, mode consistency, and obvious
  build-set issues.
* Copy/export workflows using native Build Wars data and individual skill template codes.
* Party-specific save/load and backup/restore behavior through local-first storage.

## Done When

* Users can mark a build set as a party/team without rebuilding the underlying loadouts.
* Party labels and ordering are saved locally with the build set.
* Users can export or copy a party in a practical native/multi-code format.
* The implementation does not depend on paw-ned2 or a hero/henchman catalog.

## Notes

EPIC-17 should build on multi-build workspaces. Hero names, henchmen, portraits, AI advice, and
external team-template compatibility are optional later enhancements, not requirements for the first
party workflow.

## Grooming Decisions

* Do not build a hero/henchman catalog as a prerequisite for party workflows.
* Do not require paw-ned2 support. Existing deferral evidence remains in `BW-1701`, but it is parked
  outside the MVP party scope.
* Prefer a native Build Wars party export plus one-code-per-loadout skill-template copying over
  legacy team codec work.
* Keep party member identity lightweight and user-editable. Real hero identity, unlocks, portraits,
  and AI notes can be added later only if they become product requirements.
* Party-specific validation should be narrow and explainable. Deep synergy, team composition advice,
  and advanced analysis belong to EPIC-21 or later guide/recommendation work.
* Support common party sizes without designing around obscure external format limits.

## Ticket Breakdown

* `BW-1702`: Party annotations, member labels, slot kinds, ordering, and presets on build sets.
* `BW-1703`: Party workspace UI, member overview, selected member editing, and responsive behavior.
* `BW-1704`: Party-level validation, incomplete-member handling, and mode consistency.
* `BW-1705`: Native party export, multi-code copy/share, local save/load, and backup/restore.
* `BW-1706`: Docs, deferred hero catalog/template compatibility scope, verification, and closeout.
