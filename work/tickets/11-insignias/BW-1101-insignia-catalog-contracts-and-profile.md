---
id: BW-1101
title: Insignia Catalog Contracts and EPIC-11 Profile
epic: EPIC-11
status: ready
priority: critical
depends_on: []
created: 2026-09-02
updated: 2026-09-02
---

# BW-1101: Insignia Catalog Contracts and EPIC-11 Profile

## Goal

Define the framework-neutral insignia catalog contract and ingestion profile needed to represent
armor prefix upgrade facts.

## Scope

- Add an `InsigniaCatalog` envelope modeled after prior promoted content catalogs.
- Define insignia records with stable IDs, canonical names, common or profession-specific
  availability, profession restrictions, slot applicability, icon metadata references, source
  references, and structured effect fields.
- Represent deterministic health, energy, armor, damage-reduction, and note-only effects without
  requiring copied source prose.
- Add an EPIC-11 ingestion profile with fixture/offline/live modes and bounded source limits.
- Keep runtime catalog data separate from manifests, QA reports, snapshots, source plans, and review
  evidence.

## Out Of Scope

- Equipment editor UI, armor shell cataloging, rune cataloging, remote icon fetching, backend
  storage, party builds, and combat simulation.

## Acceptance Criteria

- `src/domain` remains plain-data and framework-neutral.
- Insignia records can distinguish deterministic fixed values, slot-scaled values, conditional
  effects, unknown effects, and policy-reviewed notes.
- Common and profession-specific availability can be represented without UI-specific logic.
- Runtime catalog consumers do not need ingestion scripts, source snapshots, manifests, QA reports,
  or wiki APIs.

## Verification

- `npm run typecheck`
- Focused Vitest contract tests for insignia catalog records and effect variants
- Focused Python profile tests proving existing content profiles still work
