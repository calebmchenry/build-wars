---
id: EPIC-10
title: Runes
track: content
status: backlog
priority: high
depends_on:
  - EPIC-01
  - EPIC-03
  - EPIC-02
---

# Runes

## Goal

Catalog all runes and their effects so armor, attributes, health, and equipment validation can be modeled.

## Scope

* Profession-specific attribute runes.
* Vigor, Vitae, Attunement, and other non-attribute runes.
* Minor, major, and superior ranks where applicable.
* Icons, names, descriptions, restrictions, bonuses, and penalties.
* Stacking rules, especially highest attribute rune applies while health penalties still matter.
* Headgear interaction notes.

## Done When

* Armor slots can offer legal rune choices.
* Attribute and health totals can account for rune effects.
* Rune tooltips can be rendered from data.

## Notes

Rune behavior is mechanically important and easy to get subtly wrong. Keep explicit tests for duplicate runes and health penalties.
