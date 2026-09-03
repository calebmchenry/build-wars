---
id: EPIC-14
title: Equipment Editor
track: functional
status: ready
priority: medium
depends_on:
  - EPIC-06
  - EPIC-07
  - EPIC-08
  - EPIC-09
  - EPIC-10
  - EPIC-11
  - EPIC-12
  - EPIC-13
tickets:
  - BW-1401
  - BW-1402
  - BW-1403
  - BW-1404
  - BW-1405
  - BW-1406
  - BW-1407
  - BW-1408
updated: 2026-09-03
---

# Equipment Editor

## Goal

Let users configure build-affecting equipment: armor runes, insignias, headgear bonuses, weapon
sets, weapons, and weapon mods.

## Scope

* Armor slots with rune and insignia controls.
* Headgear attribute bonus control where mechanically relevant.
* Weapon sets with main hand, offhand, two-handed, and empty-slot states.
* Weapon prefix, suffix, inscription, requirement, and damage-type display from EPIC-12 data.
* Equipment tooltip/display for mechanical facts and selected upgrades.
* Stats display for health, energy, armor notes, and requirements.
* Local persistence of equipment as part of saved builds.

## Done When

* A user can model a practical PvE/PvP equipment setup.
* The editor does not ask users to choose armor skins, weapon skins, dyes, or color IDs.
* Equipment validation reports incompatible mods, missing requirements, and invalid armor upgrades.

## Notes

Equipment is more complex and less central than the first skill builder. Build this after the
semantic equipment shell is stable.

## Grooming Decisions

* EPIC-14 should implement the semantic EPIC-13 model. It should not require equipment-template-code
  import/export for the MVP editor.
* Existing EPIC-05 raw equipment-template compatibility remains available for a later explicit
  compatibility ticket, likely when party/team workflows need import/export polish.
* Armor/weapon skins, dyes, color IDs, inventory appearance, acquisition facts, and cosmetic
  equipment fidelity are out of scope.
* Actual runtime icons remain controlled by a future explicit media/icon ticket. Until then,
  equipment UI should use stable placeholders or approved metadata-only references.
* Equipment should live inside the existing editor surface as a panel, tab, or collapsible section,
  not as a separate route.
* Use searchable combobox/select controls for runes, insignias, weapons, and mods. Do not add
  equipment drag/drop in the MVP.
* Armor controls are five fixed rows or slots. Head can also expose a headgear attribute bonus.
* Weapon controls are four weapon-set rows. Each set supports empty, main-hand/off-hand, or
  two-handed state with compatible modifier pickers.
* Stats should be simple and explainable: health delta, energy delta, armor notes, requirement
  warnings, and unresolved state. Full combat math and DPS remain out of scope.
* Skill-template share URLs remain skill-template-first. Equipment persists in local/native build
  data and backup/restore, not in Guild Wars skill template codes.

## Ticket Breakdown

* `BW-1401`: App equipment catalog boundary, selectors, and editor-state integration.
* `BW-1402`: Equipment panel shell, navigation, layout, and responsive placement.
* `BW-1403`: Searchable equipment pickers for runes, insignias, weapons, and modifiers.
* `BW-1404`: Armor controls for five slots, rune/insignia attachments, and headgear bonus.
* `BW-1405`: Weapon-set controls for hand occupancy, weapon selection, modifiers, and requirements.
* `BW-1406`: Equipment display, tooltip content, and simple stat summaries.
* `BW-1407`: Equipment validation, persistence, backup/restore, and share/export boundaries.
* `BW-1408`: Accessibility, responsive polish, docs, verification, and closeout.
