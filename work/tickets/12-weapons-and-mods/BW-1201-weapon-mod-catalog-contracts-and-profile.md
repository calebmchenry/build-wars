---
id: BW-1201
title: Weapon and Mod Catalog Contracts and EPIC-12 Profile
epic: EPIC-12
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-013
completed_sprint: SPRINT-013
created: 2026-09-02
updated: 2026-09-03
---

# BW-1201: Weapon and Mod Catalog Contracts and EPIC-12 Profile

## Goal

Define the framework-neutral catalog contracts and ingestion profile for weapon base types,
requirements, upgrade components, inscriptions, and modifier constraints.

## Scope

- Add weapon base-type and weapon upgrade catalog envelopes modeled after prior promoted content
  catalogs.
- Define weapon records for family, handedness, requirement attribute families, damage ranges,
  damage types, mod-slot compatibility, template mapping references, icon/display metadata, source
  references, and QA dispositions.
- Define upgrade records for prefix, suffix, inscription, staff-head, staff-wrapping, shield/offhand,
  and other verified modifier families.
- Represent deterministic effects, requirements, compatibility constraints, chance-based notes, and
  unknown effects without requiring copied source prose.
- Add an EPIC-12 ingestion profile with fixture/offline/live modes and bounded source limits.

## Out Of Scope

- Equipment editor UI, named unique-item exhaustiveness, acquisition guides, vendor/drop/quest
  instructions, remote icon fetching, backend storage, party builds, and combat simulation.

## Acceptance Criteria

- `src/domain` remains plain-data and framework-neutral.
- Weapon base facts are separate from upgrade/modifier facts.
- Unknown raw equipment-template item and modifier IDs remain representable instead of being forced
  into invented semantic records.
- Runtime catalog consumers do not need ingestion scripts, source snapshots, manifests, QA reports,
  or wiki APIs.

## Verification

- `npm run typecheck`
- Focused Vitest contract tests for weapon, upgrade, effect, and compatibility variants
- Focused Python profile tests proving existing content profiles still work

## Closeout Evidence

- SPRINT-013 added framework-neutral `WeaponBaseCatalog` and `WeaponModCatalog` contracts,
  registry-backed public ID summaries, release-set facts, tagged damage/requirement/applicability
  states, raw template crosswalk states, runtime dispositions, lookup outcomes, and effect variants.
- Added the `epic-12-weapons-and-mods` ingestion profile with fixture, discover, fetch, and selected
  offline replay support.
- Validation passed: `npm run typecheck`, focused EPIC-12 Vitest contract coverage, and focused
  Python profile/CLI/pipeline coverage.
