---
id: EPIC-12
title: Weapons and Mods
track: content
status: ready
priority: high
depends_on:
  - EPIC-01
  - EPIC-02
  - EPIC-03
  - EPIC-05
tickets:
  - BW-1201
  - BW-1202
  - BW-1203
  - BW-1204
  - BW-1205
  - BW-1206
  - BW-1207
updated: 2026-09-02
---

# Weapons and Mods

## Goal

Catalog weapon types, requirements, upgrade components, inscriptions, and mod constraints for equipment editing and template compatibility.

## Scope

* Weapon types: axe, sword, hammer, bow variants, dagger, scythe, spear, wand, staff, focus, shield, and other relevant PvP template items.
* Damage ranges, handedness, damage types, and requirement attributes.
* Prefix upgrades.
* Suffix upgrades.
* Inscriptions.
* Staff heads/wrappings and caster weapon HCT/HSR behavior.
* Attribute-modifying weapon suffixes and chance-based mastery effects.
* Equipment template item ids and modifier ids where applicable.

## Done When

* Weapon sets can be populated with legal choices.
* The editor can warn about incompatible mods.
* Equipment template import can resolve known weapon and mod ids.

## Notes

Weapon data is one of the more complicated content areas. Start with PvP equipment template coverage, then expand to broader PvE descriptive support.

## Grooming Decisions

* EPIC-12 is a content/catalog epic. It does not add the equipment editor UI, party builder, guide
  authoring, backend storage, remote icon fetching, or full item-acquisition coverage.
* Build weapon and mod catalogs through the EPIC-02 ingestion platform and EPIC-01 source-policy
  gates. Use EPIC-05 raw equipment-template facts only as mapping inputs; do not make raw imports
  lossy by forcing every numeric ID into a semantic record.
* Promote only approved runtime catalog JSON under `data/generated/epic-12/`; keep snapshots, source
  plans, manifests, QA reports, review evidence, and media bytes outside runtime app imports.
* Separate weapon base-type records from upgrade-component records. Weapon records own family,
  handedness, requirement attribute families, damage ranges/types, mod-slot compatibility, and
  display metadata. Upgrade records own prefix, suffix, inscription, staff-head, staff-wrapping,
  shield/offhand, and other verified modifier families.
* Prioritize PvP equipment-template coverage and practical build-editor resolution before broader
  PvE skin, unique-item, drop-source, collector, vendor, or campaign-completion metadata.
* Model deterministic compatibility rules and requirement facts. Chance-based, conditional, or
  hard-to-verify effects can start as structured effect notes with explicit QA findings.
* Equipment template IDs and modifier IDs should be mapped where verified, but unknown and
  unsupported raw IDs must remain preservable for EPIC-14.
* Copied source-authored description prose is not required for the first runtime catalog. Prefer
  structured effects and policy-reviewed short display text.

## Ticket Breakdown

* `BW-1201`: Weapon and mod catalog contracts plus EPIC-12 ingestion profile.
* `BW-1202`: Weapon base-type source resolution, extractors, requirements, damage facts, and
  handedness.
* `BW-1203`: Upgrade component and inscription source resolution, families, restrictions, and icon
  metadata.
* `BW-1204`: Weapon/mod effect parsing, compatibility rules, requirement semantics, and validation
  fixtures.
* `BW-1205`: Equipment-template ID and modifier mapping against EPIC-05 raw equipment-template
  facts.
* `BW-1206`: Weapons/mods catalog QA, deterministic generation, review gates, and exact-path
  promotion.
* `BW-1207`: Runtime integration notes, downstream contracts for EPIC-13/14, docs, and closeout.
