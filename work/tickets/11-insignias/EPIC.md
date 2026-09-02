---
id: EPIC-11
title: Insignias
track: content
status: done
priority: high
depends_on:
  - EPIC-01
  - EPIC-02
  - EPIC-03
planned_sprint: SPRINT-012
completed_sprint: SPRINT-012
tickets:
  - BW-1101
  - BW-1102
  - BW-1103
  - BW-1104
  - BW-1105
  - BW-1106
updated: 2026-09-02
---

# Insignias

## Goal

Catalog all insignias and their armor effects for equipment editing, stats notes, and validation.

## Scope

* Common and profession-specific insignias.
* Icons, names, descriptions, restrictions, conditions, and effects.
* Slot scaling for chest, legs, and other armor pieces.
* Non-stacking and conditional-effect notes.
* PvP/PvE availability differences if relevant.

## Done When

* Armor slots can offer legal insignia choices.
* Insignia tooltip data is complete.
* Stats display can show slot-scaled health, energy, armor, and conditional notes.

## Notes

Insignias often depend on combat state. Treat many effects as notes unless a reliable stat calculation is practical.

## Grooming Decisions

* EPIC-11 is a content/catalog epic. It does not add equipment editing UI, armor slot UI, guide
  authoring, backend storage, remote icon fetching, or full combat simulation.
* Build the insignia catalog through the EPIC-02 ingestion platform and EPIC-01 source-policy
  gates. Fixture, offline replay, QA, and exact-path promotion should follow the EPIC-03/04 model.
* Promote only an approved runtime catalog JSON under `data/generated/epic-11/`; keep snapshots,
  source plans, manifests, QA reports, review evidence, and media bytes outside runtime app
  imports.
* Model insignias as armor prefix upgrades with stable IDs, canonical names, common versus
  profession-specific availability, profession restrictions, icon metadata, source references, and
  structured effects.
* Slot-scaled bonuses must be represented explicitly enough for later armor/equipment UI to show
  per-piece health, energy, armor, and other deterministic values.
* Conditional, combat-state, or non-stacking behavior should be represented as typed notes or
  conservative effect rules until a later stat calculator can verify exact runtime semantics.
* Rune, armor-shell, dye, and weapon data stay out of EPIC-11 except for cross-reference facts needed
  to prevent catalog ambiguity.
* Copied source-authored description prose is not required for the first runtime catalog. Prefer
  structured facts and source-policy-reviewed short display text.

## Ticket Breakdown

* `BW-1101`: Insignia catalog contracts and EPIC-11 ingestion profile.
* `BW-1102`: Insignia source set, page resolution, fixture coverage, and source-policy limits.
* `BW-1103`: Insignia extractors for names, restrictions, icons, slot applicability, and raw effect
  fields.
* `BW-1104`: Insignia effect semantics, slot scaling, conditional notes, and validation fixtures.
* `BW-1105`: Insignia catalog QA, deterministic generation, review gates, and exact-path promotion.
* `BW-1106`: Runtime integration notes, downstream contracts for equipment/stat work, docs, and
  closeout.

## Completion Evidence

SPRINT-012 completed BW-1101 through BW-1106. It promoted the runtime insignia catalog at
`data/generated/epic-11/insignias.catalog.json` with its adjacent manifest and machine-readable QA
report, backed by source authority review, digest-confirmed live fetch, selected complete
snapshot-set replay, two byte-identical fixed-clock offline replays, and `npm run verify`.

The catalog contains 45 runtime-eligible insignia records with schema-owned registry IDs, verified
equipment template modifier crosswalks, EPIC-03 profession joins, exact tagged per-slot outcomes,
typed conditions/locality/combination facts, and metadata-only icon references. Armor legality,
equipment UI, semantic template resolution, condition evaluation, rune/insignia composition, and
full stat aggregation remain delegated to later epics.
