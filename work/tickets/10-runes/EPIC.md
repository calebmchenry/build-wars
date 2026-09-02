---
id: EPIC-10
title: Runes
track: content
status: ready
priority: high
depends_on:
  - EPIC-01
  - EPIC-02
  - EPIC-03
tickets:
  - BW-1001
  - BW-1002
  - BW-1003
  - BW-1004
  - BW-1005
  - BW-1006
updated: 2026-09-02
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

## Grooming Decisions

* EPIC-10 is a content/catalog epic. It does not add armor editing UI, weapon editing UI, party
  editing, guide authoring, remote icon fetching, backend storage, or full equipment-template
  semantic import.
* Build the rune catalog through the existing EPIC-02 ingestion platform and source-policy gates.
  Do not add a rune-specific live scraper outside the profile/fixture/offline replay pattern.
* Promote only an approved runtime catalog JSON under `data/generated/epic-10/`; keep source
  snapshots, source plans, manifests, QA reports, review evidence, and icon bytes out of runtime
  app imports.
* Model rune records as armor suffix upgrades with stable IDs, canonical names, rune family,
  profession/attribute restrictions, icon metadata, source references, and structured effects.
* Attribute-rune semantics must distinguish the applied attribute bonus from health penalties.
  Highest applicable attribute bonus wins for an affected attribute, while verified health
  penalties remain independently countable.
* Non-attribute runes such as health and energy families should be modeled as explicit effect
  families with stackability rules only where verified. Ambiguous or conditional behavior stays as
  structured notes until a later stat calculator has enough evidence.
* Headgear interaction facts may be recorded where needed, but EPIC-13 owns armor shell/headgear
  cataloging and EPIC-14 owns the equipment editor UI.
* Copied source-authored description prose is not required for the first runtime catalog. Prefer
  structured effects plus policy-reviewed short display text.

## Ticket Breakdown

* `BW-1001`: Rune catalog contracts and EPIC-10 ingestion profile.
* `BW-1002`: Rune source set, page resolution, fixture coverage, and source-policy limits.
* `BW-1003`: Rune extractors for names, families, restrictions, icons, template facts, and raw
  effect fields.
* `BW-1004`: Rune effect semantics, stacking, health penalties, attribute bonuses, and validation
  fixtures.
* `BW-1005`: Rune catalog QA, deterministic generation, review gates, and exact-path promotion.
* `BW-1006`: Runtime integration notes, downstream contracts for equipment/title work, docs, and
  closeout.
