---
id: EPIC-13
title: Armor and Equipment
track: content
status: backlog
priority: high
depends_on:
  - EPIC-01
  - EPIC-03
  - EPIC-10
  - EPIC-11
  - EPIC-12
  - EPIC-02
---

# Armor and Equipment

## Goal

Catalog armor slots, base armor behavior, equipment template ids, dye ids, and display metadata needed by the equipment editor.

## Scope

* Armor slots: head, chest, hands, legs, feet.
* Profession armor families and base armor values.
* Headgear attribute bonus behavior.
* Equipment template item ids.
* Dye color ids from equipment template format.
* Unknown/unsupported equipment representation.
* Tooltip display fields from in-game screenshots.

## Done When

* Equipment template item ids can map to useful display records.
* Armor editor can represent all five armor pieces.
* Dye and armor slot metadata are available to UI and validators.

## Notes

Separate this from runes and insignias so armor shell data does not get tangled with upgrade data.
