---
id: EPIC-14
title: Equipment Editor
track: functional
status: backlog
priority: medium
depends_on:
  - EPIC-06
  - EPIC-10
  - EPIC-11
  - EPIC-12
  - EPIC-13
  - EPIC-07
---

# Equipment Editor

## Goal

Let users model armor, runes, insignias, weapons, weapon mods, and weapon sets with game-compatible import/export.

## Scope

* Armor slots with rune and insignia controls.
* Weapon sets with main hand, offhand, two-handed, and empty-slot states.
* Weapon prefix, suffix, inscription, requirement, damage type, and dye metadata.
* Equipment tooltip/display inspired by in-game screenshots.
* Equipment template import/export.
* Stats display for health, energy, armor notes, and requirements.

## Done When

* A user can model a practical PvE/PvP equipment setup.
* Unsupported equipment template ids are surfaced without losing the original imported code.
* Equipment validation reports incompatible mods, missing requirements, and invalid armor upgrades.

## Notes

Equipment is more complex and less central than the first skill builder. Build this after skill/attribute flows are stable.
