---
id: BW-1001
title: Rune Catalog Contracts and EPIC-10 Profile
epic: EPIC-10
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-011
completed_sprint: SPRINT-011
created: 2026-09-02
updated: 2026-09-02
---

# BW-1001: Rune Catalog Contracts and EPIC-10 Profile

## Goal

Define the framework-neutral rune catalog contract and ingestion profile needed to represent armor
rune facts without adding equipment UI.

## Scope

- Add a `RuneCatalog` envelope modeled after prior promoted content catalogs.
- Define rune records with stable IDs, canonical names, rune family, profession or attribute
  restrictions, icon metadata references, source references, and structured effect fields.
- Represent attribute bonuses, health penalties, health bonuses, energy bonuses, stackability facts,
  and unknown or policy-reviewed display text without requiring copied source prose.
- Add an EPIC-10 ingestion profile with fixture/offline/live modes and bounded source limits.
- Keep runtime catalog data separate from manifests, QA reports, snapshots, source plans, and review
  evidence.

## Out Of Scope

- Armor editor UI, equipment template semantic import, armor shell cataloging, remote icon fetching,
  backend storage, party builds, and guide prose.

## Acceptance Criteria

- `src/domain` remains plain-data and framework-neutral.
- Rune effects can distinguish absent, unknown, fixed numeric, attribute-rank, health, energy, and
  policy-reviewed note values.
- Attribute-rune records can express rank family and affected profession attribute.
- Runtime catalog consumers do not need ingestion scripts, source snapshots, manifests, QA reports,
  or wiki APIs.
- Existing EPIC-02, EPIC-03, and EPIC-04 profiles remain compatible.

## Verification

- `npm run typecheck`
- Focused Vitest contract tests for rune catalog records and effect variants
- Focused Python profile tests proving existing content profiles still work

## Closeout Evidence

- SPRINT-011 added the framework-neutral `RuneCatalog`/`CatalogRuneRecord` contracts, effect-level
  stacking types, rune lookup helpers, and `epic-10-runes` profile/CLI routing.
- Validation passed: `npm run typecheck`,
  `npm run test:run -- test/domain/contracts.test.ts test/domain/rune-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`,
  and `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`.
