---
id: BW-1101
title: Insignia Catalog Contracts and EPIC-11 Profile
epic: EPIC-11
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-012
completed_sprint: SPRINT-012
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

## Closeout Evidence

- SPRINT-012 added the framework-neutral `InsigniaCatalog`, `CatalogInsigniaRecord`, source-set,
  identity-registry, crosswalk, effect, condition, locality, combination, display, and unresolved
  contracts under `src/domain`.
- The EPIC-11 profile `epic-11-insignias` is registered for fixture/offline/live modes with bounded
  caps, EPIC-03 dependency handling, and metadata-only icon policy.
- Validation passed: `npm run typecheck`,
  `npm run test:run -- test/domain/contracts.test.ts test/domain/insignia-catalog.test.ts test/domain/insignia-effects.test.ts test/domain/data-ingestion-contracts.test.ts`,
  and `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`.
