---
id: EPIC-17
title: Party Semantics and Sharing
track: functional
status: done
priority: medium
planned_sprint: SPRINT-018
completed_sprint: SPRINT-018
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

SPRINT-017/EPIC-16 provides the neutral base: ordered build-set entries, one active loadout editor,
inactive durable snapshots, variant comparison, per-entry aggregate validation, schema-2 mixed local
documents, whole-library backup, and native build-set transfer JSON. EPIC-17 should add
party-specific labels, party validation, party sharing, hero/henchman identity, and any external
team format adapters on top of that base instead of changing build-set entry semantics.

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

## Planning

Planned in `SPRINT-018`. BW-1701 remains a backlog parking-lot ticket for future external
team-template compatibility and is not part of the MVP party workflow.

## Closeout Evidence

Completed in `SPRINT-018`.

- Build sets can opt into party semantics through versioned annotations without redefining
  `BuildSetEntryKind` or embedding a second loadout graph.
- Party workspace supports ordered nullable slots, labels, roles, member-kind labels, slot notes,
  presets/custom sizes, unassigned loadouts, selected occupied-member editing, and empty-slot
  create/assign flows.
- Party validation is structural and aggregate only; it remains separate from the game rule engine
  and adds no recommendation, synergy, hero legality, or meta-quality rules.
- Native party JSON and general build-set transfer/backup preserve party metadata; multi-code copy
  is explicit, bounded, and non-lossless.
- BW-1701 remains backlog for future paw-ned2/team-template compatibility.
- Passed `npm run test:run -- src/app test/domain test/template-compatibility`.
- Passed `npm run verify`.
