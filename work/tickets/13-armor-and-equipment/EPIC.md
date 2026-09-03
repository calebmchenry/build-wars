---
id: EPIC-13
title: Equipment Shell Model
track: functional
status: done
priority: high
depends_on:
  - EPIC-01
  - EPIC-02
  - EPIC-03
  - EPIC-06
  - EPIC-10
  - EPIC-11
  - EPIC-12
planned_sprint: SPRINT-014
completed_sprint: SPRINT-014
tickets:
  - BW-1301
  - BW-1302
  - BW-1303
  - BW-1304
  - BW-1305
updated: 2026-09-03
---

# Equipment Shell Model

## Goal

Define the semantic equipment shell that lets builds attach runes, insignias, weapons, and weapon
mods without cataloging armor skins, weapon skins, dyes, color IDs, or cosmetic equipment-template
fidelity.

## Scope

* Armor slots: head, chest, hands, legs, feet.
* Generic armor pieces with rune and insignia attachment points.
* Headgear attribute bonus behavior where it affects authored attribute ranks.
* Base armor/profession armor facts only where needed for validation or stat display.
* Weapon sets with main-hand, off-hand, two-handed, and empty-slot semantics.
* Weapon and weapon-mod attachment points backed by EPIC-12 catalog IDs.
* Empty, partial, and unresolved semantic equipment states needed by the editor.
* Equipment validation fixtures for duplicate slots, invalid attachments, headgear, and weapon-set
  occupancy.

## Done When

* A build can represent practical build-affecting equipment without skin, dye, or color data.
* Armor slots can attach known rune and insignia IDs from EPIC-10/11 catalogs.
* Weapon sets can attach known weapon and modifier IDs from EPIC-12 catalogs.
* EPIC-14 has clear domain contracts and validation fixtures for the user-facing equipment editor.

## Closeout

Completed in SPRINT-014. The semantic equipment shell, armor/headgear helpers, weapon-set analyzer,
equipment validation fixtures, optional catalog views, documentation, and downstream handoffs are
implemented and verified.

## Notes

Keep this epic focused on what affects builds. Existing raw equipment-template compatibility remains
a low-level EPIC-05/EPIC-17 concern and should not drive the MVP equipment model.

## Grooming Decisions

* EPIC-13 is a semantic equipment-model epic, not an armor-skin catalog.
* Armor skins, weapon skins, inventory appearance, dye/color IDs, screenshots, acquisition
  instructions, vendor/drop/quest facts, and cosmetic display metadata are out of scope.
* The semantic equipment model should not expose color IDs. Raw color facts may continue to exist
  inside the EPIC-05 compatibility layer, but EPIC-13 and EPIC-14 should ignore them.
* Equipment template-code import/export is deferred. EPIC-13 may leave compatibility handoff notes,
  but it must not require users or implementers to understand raw equipment template fields.
* Runes, insignias, weapons, and weapon mods stay owned by EPIC-10/11/12. EPIC-13 owns the loadout
  container, slot rules, and attachment semantics around those catalogs.
* Source-derived base armor or headgear facts still require EPIC-01 source-policy treatment. If the
  implementation can avoid a new generated catalog, fixed mechanical facts may live in domain code
  with provenance documented in the closeout notes.
* Unknown semantic equipment states should be recoverable and visible, but preserving every unknown
  raw template field is not an EPIC-13 requirement.

## Ticket Breakdown

* `BW-1301`: Equipment shell contracts, default/empty loadouts, and catalog ID attachment points.
* `BW-1302`: Armor slot, rune/insignia attachment, headgear, and base armor mechanics.
* `BW-1303`: Weapon-set shell, hand occupancy, weapon/mod attachment, and requirement handoff.
* `BW-1304`: Equipment validation fixtures and rule-engine handoffs for EPIC-14.
* `BW-1305`: Runtime docs, deferred compatibility scope, index updates, and closeout.
