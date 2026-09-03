---
id: EPIC-16
title: Multi-Build Workspace
track: functional
status: ready
priority: medium
depends_on:
  - EPIC-08
  - EPIC-09
  - EPIC-14
  - EPIC-15
tickets:
  - BW-1601
  - BW-1602
  - BW-1603
  - BW-1604
  - BW-1605
  - BW-1606
updated: 2026-09-03
---

# Multi-Build Workspace

## Goal

Let users view, compare, edit, duplicate, and save multiple complete build loadouts together.

## Scope

* Build set model containing multiple complete build loadouts.
* Each loadout includes skills, attributes, title ranks, armor, weapons, and notes where already
  supported by earlier epics.
* Workspace controls for adding, duplicating, removing, reordering, labeling, and selecting loadouts.
* Variant workflows for comparing related builds without forcing party semantics.
* Compact summaries so several loadouts stay visible while one is being edited.
* Local save/load of build sets using EPIC-09 storage patterns.
* Per-loadout validation status and group-level overview.

## Done When

* Users can keep several complete builds open in one workspace.
* Users can duplicate a build as a variant and edit it without losing the original.
* Users can scan each loadout's skill bar and equipment summary while editing a selected loadout.
* Build sets can be saved and loaded locally.
* No hero, henchman, NPC, or external team-template knowledge is required.

## Notes

This epic replaces the old hero/henchman catalog direction. A build set can later represent a party,
hero team, variant group, farming setup, or comparison set, but EPIC-16 should stay neutral.

## Grooming Decisions

* Treat "skills + armor + weapons + title ranks" as one complete loadout. EPIC-16 owns multiple
  loadouts, not new game content.
* Do not catalog heroes, henchmen, NPC portraits, unlocks, hero AI behavior, acquisition, or
  campaign/location prose in this epic.
* Do not require party slots, real hero names, mercenary hero rules, paw-ned2, or any other external
  team-template format.
* A build set entry may have a user label and lightweight kind such as `build`, `variant`, or
  `freeform`, but party-specific semantics belong to EPIC-17.
* Prefer one active editor with persistent visible summaries for the other loadouts. Full multi-pane
  editing can be added only if the implementation remains usable at desktop and narrow widths.
* Build sets should use local-first storage and backup/restore patterns from EPIC-09 rather than a
  backend or account model.
* Validation should run per loadout and surface an aggregate summary. Party-wide rules are deferred
  until a build set is explicitly treated as a party.

## Ticket Breakdown

* `BW-1601`: Build set contracts, entry metadata, default state, and migration shape.
* `BW-1602`: Multi-build workspace reducer/state, local persistence, and library integration.
* `BW-1603`: Build set navigation, compact summaries, selected editor integration, and responsive
  layout.
* `BW-1604`: Variant duplication, comparison, labeling, and promotion workflows.
* `BW-1605`: Per-loadout validation, group overview, backup/restore, and share/export boundaries.
* `BW-1606`: Docs, deferred hero/party/template scope, verification, and closeout.
