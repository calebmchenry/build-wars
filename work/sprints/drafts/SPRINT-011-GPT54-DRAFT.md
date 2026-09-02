---
id: SPRINT-011
title: Runes Catalog
status: planned
source_target: BACKLOG
source_epic: EPIC-10
source_epic_path: work/tickets/10-runes/EPIC.md
tickets:
  - BW-1001
  - BW-1002
  - BW-1003
  - BW-1004
  - BW-1005
  - BW-1006
created: 2026-09-02
---

# Sprint 011: Runes Catalog

## Overview

This sprint turns `EPIC-10 Runes` into a runtime-eligible rune catalog and a repeatable EPIC-10
ingestion profile. The output is not armor UI. The output is a framework-neutral rune schema, a
bounded source-set plan, deterministic extraction and normalization, pure rule helpers for later
equipment work, promoted generated artifacts under exact paths, and closeout documentation that
keeps runtime imports and audit artifacts clearly separated.

The sequencing priority is to eliminate churn between the domain contract and the ingestion
pipeline. Execution should first lock the `RuneCatalog` wire shape and EPIC-10 profile, then freeze
the source-set and fixture corpus, then land raw extraction, then semantic normalization and pure
rule fixtures, then promotion and QA gates, and only after that update docs and traceability
records. That order keeps source-plan digests, catalog versions, finding IDs, and downstream helper
APIs from shifting late in the sprint.

This sprint remains content and domain groundwork only. It must not add armor editing UI, weapon or
headgear UI, template semantic equipment import, app runtime imports of manifests or QA reports,
remote icon fetching, cached media bytes, copied source-authored long prose, backend storage, or
full equipment/stat calculation.

## Use Cases

1. A data contributor can regenerate a synthetic rune fixture catalog offline, inspect deterministic
   QA output, and confirm that the same input corpus yields the same catalog, manifest, and finding
   IDs.
2. A future equipment or tooltip feature can consume a runtime-safe `RuneCatalog` JSON file with
   stable rune IDs, names, families, ranks, profession or attribute joins, structured effects, and
   icon metadata references without touching Python tooling or source snapshots.
3. A rule consumer can determine that only the highest applicable attribute bonus applies for a
   given attribute while verified health penalties from duplicate equipped runes remain
   independently countable.
4. A reviewer can see explicit dispositions for unsupported, ambiguous, duplicate, redirected, or
   malformed rune source records instead of silent omission.
5. A maintainer can run bounded EPIC-10 live discovery and digest-confirmed fetches, then replay a
   selected snapshot set offline before promoting exact generated paths.
6. A downstream epic owner can tell which rune facts are ready now, which remain note-only or
   review-required, and which are intentionally deferred to EPIC-13, EPIC-14, EPIC-15, EPIC-20,
   and EPIC-21.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Runtime data | `RuneCatalog` JSON, compact provenance references, source-set summary, dependency digests, dispositions, metadata-only icon references, and pure TS lookup/effect helpers. | Runtime imports of manifests, QA JSON, source plans, snapshot-set manifests, raw snapshots, Python tooling, or wiki APIs. |
| Domain modeling | Stable rune IDs, names, normalized lookup keys, family/rank, profession or attribute restrictions, structured effects, stacking semantics, and pure helper contracts. | React/UI state, browser APIs, equipment ownership state, full stat calculator logic, or non-deterministic helpers. |
| Ingestion profile | EPIC-10 fixture, offline, and manual live modes implemented through the existing profile/pipeline/CLI architecture with bounded caps. | A rune-specific scraper outside `scripts/data/build_wars_ingest`, unbounded category crawls, or browser automation. |
| Semantic rules | Attribute bonuses, health penalties, health bonuses, energy bonuses, verified stackability, note-only effects, and headgear handoff facts. | Armor-slot legality UI, armor shell cataloging, title ownership, allegiance semantics, or complete equipment validation. |
| Promotion | Exact-path promotion for `data/generated/epic-10/runes.catalog.json`, adjacent manifest, and machine-readable QA report, plus `.gitignore` allowlists. | Promotion of raw snapshots, source plans, QA summaries, icon bytes, screenshots, or copied source page bodies. |
| Closeout | Docs, compendium notes, ticket status sync, ledger sync, and ticket-burn manifest updates. | Implementation changes to the current app editor, saved-build schema expansion, or share/local-library behavior changes. |

### Contract Shape

`src/domain/catalog.ts` should extend the existing catalog vocabulary rather than introduce a
parallel rune schema. The runtime contract should mirror the EPIC-04 pattern where practical:

- `RuneCatalog`
- `RuneCatalogProfile`
- `RuneCatalogDependencySummary`
- `RuneSourceSetSummary`
- `RuneSourceSetDisposition`
- `CatalogRuneRecord`
- `RuneEffect`
- `RuneStackingRule`

The rune record should stay plain-data and JSON-compatible. The expected semantic shape is:

- Stable `RuneId` from `src/domain/ids.ts`, never derived from array position.
- `name` plus a normalized lookup key for collision-safe lookups.
- `family` and `rank` so profession attribute runes, Vigor/Vitae/Attunement families, and future
  downstream UI grouping do not need to infer variants from names.
- `professionId` and `attributeId` joins through the promoted EPIC-03 catalog where applicable.
- `pageIdentity` and `wikiUrl` fields comparable to the EPIC-04 skill contract.
- `effects` as a discriminated union, not copied prose.
- `stacking` or per-effect stacking facts that distinguish verified additive behavior, highest-only
  behavior, verified non-stacking behavior, and unknown behavior.
- `iconId` pointing only to metadata records in `remoteMedia`.
- Compact provenance references and source-set dispositions instead of runtime snapshot or manifest
  paths.

The preferred effect model is one that preserves independent facts instead of baking them into a
single aggregate number:

- `attribute-bonus`
- `health-penalty`
- `health-bonus`
- `energy-bonus`
- `note`

Each effect should be able to express `known`, `absent`, `unknown`, or `malformed` states where
needed. The important rule is that attribute-bonus selection and health-penalty counting must stay
separate. A consumer should be able to apply a highest-per-attribute rule without losing the fact
that multiple equipped runes can still contribute multiple health penalties.

### Module Ownership

| Module | Responsibility |
| --- | --- |
| `src/domain/catalog.ts` | Own the `RuneCatalog` wire contract, effect unions, source-set summaries, and dependency summary types. |
| `src/domain/catalog-lookup.ts` | Add pure rune lookup helpers by ID and collision-safe name where downstream callers need them. |
| `src/domain/rune-effects.ts` | Own pure helpers for highest-applicable attribute bonus selection, verified health-penalty counting, and compact effect summaries. |
| `src/domain/index.ts` | Export the new rune contracts and helper APIs. |
| `scripts/data/build_wars_ingest/config.py` | Add EPIC-10 bounded caps only if the existing limits are insufficient or too broad. |
| `scripts/data/build_wars_ingest/profiles.py` | Register `epic-10-runes`, exact artifact paths, fixture path, source titles, and caps. |
| `scripts/data/build_wars_ingest/rune_source_set.py` | Own source discovery, bounded page resolution, digest-bound source plans, and snapshot-set validation. |
| `scripts/data/build_wars_ingest/rune_extractors.py` | Parse accepted rune detail pages into deterministic raw intermediate records and diagnostics. |
| `scripts/data/build_wars_ingest/rune_catalog.py` | Normalize raw rune records into the runtime catalog, dependency summary, section digests, semantic version, and QA-facing diagnostics. |
| `scripts/data/build_wars_ingest/pipeline.py` | Wire fixture, offline, and live modes for the EPIC-10 profile. |
| `scripts/data/build_wars_ingest/cli.py` | Expose EPIC-10 commands and summaries through the shared CLI. |
| `scripts/data/build_wars_ingest/qa.py` | Reuse the existing QA framework and extend it with rune-specific diagnostic coverage. |

`src/app` should remain unchanged by default. If the implementation needs to mention future runtime
consumption, it should do so in docs only and preserve the existing rule that generated catalog JSON
enters the app solely through `src/app/catalogs.ts` in a later epic.

### Dependency Direction

```text
EPIC-03 professions/attributes promoted catalog
  -> rune contract joins for professionId and attributeId

BW-1001 contract/profile
  -> BW-1002 source-set planning and fixtures
BW-1002
  -> BW-1003 raw extraction
BW-1001 + BW-1003
  -> BW-1004 semantic normalization and pure rune helpers
BW-1002 + BW-1003 + BW-1004
  -> BW-1005 QA, determinism, and exact-path promotion
BW-1005
  -> BW-1006 docs, handoff notes, and closeout
```

`BW-1004` can start small TS fixture work once the contract is stable, but semantic normalization
should not finalize until `BW-1003` has locked the intermediate extraction fields. That keeps the
Python extraction layer and the TypeScript domain helpers from drifting apart.

### Source-Set Strategy

The source-set should follow the EPIC-04 pattern: discovery first, fetch only after a reviewed
digest, and offline replay from one selected complete snapshot set.

The expected planning rules are:

- Prefer the smallest bounded page graph that still covers all player-usable armor runes.
- Record redirects, shared pages, duplicate names, unsupported rune families, and missing detail
  pages as explicit dispositions.
- Keep fixture mode fully synthetic and small, but cover both profession attribute families and
  non-attribute families.
- Resolve profession and attribute joins through EPIC-03 records instead of string-only runtime
  links wherever possible.
- Keep source-authored long prose out of the runtime catalog; only reviewed short factual notes or
  structured effect records belong in v1.

### Verification Contract

Every implementation phase should end with focused checks before the sprint runs the broad repo
gate.

- TypeScript contract phases should use focused Vitest plus `npm run typecheck`.
- Ingestion phases should use focused `unittest discover` patterns against new EPIC-10 test files.
- Determinism phases should rerun fixed-clock fixture generation and compare catalog, manifest, and
  QA bytes.
- Promotion phases should verify exact-path `.gitignore` behavior for promoted files and
  representative ignored byproducts.
- Final closeout should use `npm run verify` as the canonical repository gate.

## Implementation

### Execution Bookkeeping

- [ ] Confirm `SPRINT-010` is completed in `work/sprints/ledger.tsv` and `SPRINT-011` is the next
      sprint ID before implementation begins.
- [ ] Create or update `work/sprints/SPRINT-011.md` before execution and keep its frontmatter
      aligned with `source_target: BACKLOG`, `source_epic: EPIC-10`, and tickets `BW-1001` through
      `BW-1006`.
- [ ] Move `EPIC-10` and the active BW ticket to `in-progress` as work starts, then to `done` only
      after each phase gate and final verification pass.
- [ ] Keep `work/tickets/10-runes/*.md`, `work/sprints/ledger.tsv`, and
      `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-10-result.json` consistent with the
      final execution state.
- [ ] Do not modify unrelated implementation areas and do not create a commit unless separately
      requested.

### Phase 1: BW-1001 Rune Catalog Contracts And EPIC-10 Profile (~15%)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `test/domain/rune-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`

**Tasks:**

- [ ] Define the runtime `RuneCatalog` contract and supporting effect, stacking, source-set, and
      dependency summary types in `src/domain/catalog.ts`.
- [ ] Keep `RuneId` branded ID ownership in `src/domain/ids.ts` and avoid any framework or app
      imports in `src/domain`.
- [ ] Add pure rune lookup helpers only where they are already justified by downstream tests or
      contract ergonomics.
- [ ] Register an `epic-10-runes` profile with exact promoted artifact paths, fixture artifact
      path, bounded page/request/byte caps, and manual live-mode expectations.
- [ ] Wire EPIC-10 through the shared pipeline and CLI entry points so fixture, offline, and live
      modes have one consistent execution surface.
- [ ] Make EPIC-03 dependency loading a first-class requirement for profession and affected
      attribute joins.
- [ ] Add focused TypeScript and Python contract tests proving the profile is registered, the new
      catalog surface is runtime-safe, and existing EPIC-02/03/04 profiles remain compatible.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/rune-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_profiles.py'`

**Phase Acceptance:**

The rune wire contract is stable, profile registration is deterministic, and the shared ingestion
entry points recognize EPIC-10 without regressing EPIC-02/03/04.

### Phase 2: BW-1002 Rune Source Set And Page Resolution (~18%)

**Files:**

- `scripts/data/build_wars_ingest/rune_source_set.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_rune_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/runes/**`

**Tasks:**

- [ ] Choose and encode the bounded EPIC-10 source authority, keeping the page graph small enough
      to review but complete enough to cover player-usable armor runes.
- [ ] Implement digest-bound source-plan generation for EPIC-10, including accepted source seeds,
      source-set summary fields, and drift detection before fetch.
- [ ] Resolve redirects, duplicate requested titles, shared pages, missing detail pages, malformed
      source links, and unsupported candidates into deterministic diagnostics and dispositions.
- [ ] Add minimized synthetic fixtures for profession attribute runes, common non-attribute runes,
      duplicate names, missing icons, redirects, and malformed page shapes.
- [ ] Define the complete snapshot-set requirements for offline replay and reject partial or mixed
      EPIC-10 snapshot sets before catalog assembly starts.
- [ ] Keep fixture mode synthetic and network-free; live discovery must remain manual and bounded.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_rune_source_set.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_cli.py'`

**Phase Acceptance:**

The accepted rune source set is digest-bound, reviewable before fetch, fully replayable offline,
and covered by synthetic fixtures that represent the expected failure modes.

### Phase 3: BW-1003 Rune Extractors (~20%)

**Files:**

- `scripts/data/build_wars_ingest/rune_extractors.py`
- `scripts/data/build_wars_ingest/rune_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_rune_extractors.py`
- `test/fixtures/data-ingestion/runes/**`

**Tasks:**

- [ ] Parse accepted rune detail pages into deterministic intermediate records that preserve
      requested title, canonical title, family, rank, profession restriction, affected attribute,
      icon file reference, raw effect text fields, and source identity.
- [ ] Normalize lookup keys and duplicate-name handling without collapsing distinct rank or family
      variants into one record.
- [ ] Preserve unsupported infobox fields, malformed effect text, ambiguous family labels, and
      missing icon data as stable diagnostics rather than dropping them.
- [ ] Exclude copied long source prose from the runtime path; intermediate extraction may retain
      only the minimum raw fields needed for semantic normalization and QA evidence.
- [ ] Keep extracted record ordering stable across repeated fixture runs.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_rune_extractors.py'`

**Phase Acceptance:**

Every accepted fixture rune resolves to either a deterministic intermediate record or an explicit
disposition, with stable diagnostics for malformed or ambiguous inputs.

### Phase 4: BW-1004 Rune Effect Semantics And Validation Fixtures (~18%)

**Files:**

- `src/domain/rune-effects.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/rune-effects.test.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `scripts/data/build_wars_ingest/rune_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_rune_catalog.py`
- `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json`

**Tasks:**

- [ ] Normalize extracted raw fields into structured runtime effects for attribute bonuses, health
      penalties, health bonuses, energy bonuses, and note-only or unknown behavior.
- [ ] Encode the rule that the highest applicable attribute-rune bonus wins per affected attribute
      while verified health penalties remain independently countable across equipped copies.
- [ ] Model verified non-attribute stackability only where supported by source evidence; ambiguous
      cases should remain explicit `unknown` or `note` states rather than implied calculations.
- [ ] Add pure domain helpers for rune effect summaries so later equipment validation can consume a
      stable API without coupling itself to raw catalog arrays.
- [ ] Extend domain fixtures and tests to prove duplicate attribute runes do not erase duplicate
      health penalties, and to show how rune adjustments fit the existing effective attribute rank
      helper without implementing armor ownership rules.
- [ ] Record headgear interaction as structured handoff facts or note effects only; do not build
      headgear or armor-shell state.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/rune-catalog.test.ts test/domain/rune-effects.test.ts test/domain/effective-attribute-rank.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_rune_catalog.py'`

**Phase Acceptance:**

The runtime catalog and pure helpers make rune semantics explicit enough for downstream equipment
work, while preserving uncertainty and avoiding a premature full stat calculator.

### Phase 5: BW-1005 Rune Catalog QA And Exact-Path Promotion (~19%)

**Files:**

- `scripts/data/build_wars_ingest/rune_catalog.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_rune_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json`
- `.gitignore`
- `data/generated/epic-10/runes.catalog.json`
- `data/generated/epic-10/runes.catalog.manifest.json`
- `data/qa/epic-10/runes.catalog.qa.json`

**Tasks:**

- [ ] Assemble the canonical EPIC-10 runtime catalog with dependency digests, source-set summary,
      dispositions, section digests, semantic `catalogVersion`, and metadata-only remote media
      references.
- [ ] Generate the adjacent manifest and machine-readable QA report under the exact approved paths.
- [ ] Extend QA coverage for duplicate IDs, duplicate names, missing profession or attribute joins,
      missing icon metadata, missing revision facts, malformed effect shapes, stackability gaps,
      copied-text policy violations, and source-set accounting mismatches.
- [ ] Add `.gitignore` exact-path allowlist entries for the EPIC-10 catalog, manifest, and QA JSON
      plus required parent-directory unignore rules, while keeping source plans, snapshot sets, QA
      summaries, raw snapshots, and icon bytes ignored.
- [ ] Prove fixed-clock determinism for fixture generation and exact offline replay from a selected
      complete snapshot set.
- [ ] Keep manual live refresh optional, bounded, and digest-confirmed; never make it part of the
      default verification path.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_rune_catalog.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_pipeline.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-10-runes --root work/runs/data-ingestion --fixture-root test/fixtures/data-ingestion`
- Confirm repeated fixed-clock fixture regeneration is byte-identical for `runes.catalog.json`, `runes.catalog.manifest.json`, and `runes.catalog.qa.json`
- Confirm approved EPIC-10 paths are not ignored and representative byproducts remain ignored
- `npm run verify`

**Phase Acceptance:**

EPIC-10 produces deterministic promoted artifacts under exact paths, passes QA and release gates,
and does not leak non-runtime artifacts into app-consumable paths.

### Phase 6: BW-1006 Rune Runtime Docs And Closeout (~10%)

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `data/source-snapshots/README.md`
- `compendium/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/runes-catalog.md`
- `compendium/game-rule-engine.md`
- `work/tickets/10-runes/EPIC.md`
- `work/tickets/10-runes/BW-1001-rune-catalog-contracts-and-profile.md`
- `work/tickets/10-runes/BW-1002-rune-source-set-and-page-resolution.md`
- `work/tickets/10-runes/BW-1003-rune-extractors.md`
- `work/tickets/10-runes/BW-1004-rune-effect-semantics-and-validation-fixtures.md`
- `work/tickets/10-runes/BW-1005-rune-catalog-qa-and-promotion.md`
- `work/tickets/10-runes/BW-1006-rune-runtime-docs-and-closeout.md`
- `work/sprints/SPRINT-011.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-10-result.json`

**Tasks:**

- [ ] Document EPIC-10 as runtime-eligible only through `data/generated/epic-10/runes.catalog.json`
      and keep manifests, QA, source plans, snapshot sets, raw snapshots, and Python tooling out
      of runtime imports.
- [ ] Add `compendium/runes-catalog.md` covering source authority, contract boundaries, effect and
      stacking semantics, fixture/offline/live commands, QA expectations, and downstream handoff
      notes.
- [ ] Update `README.md`, `scripts/data/README.md`, and the data-directory READMEs with EPIC-10
      paths and regenerate commands, while preserving current statements that equipment, runes,
      insignias, and armor state remain deferred in the app runtime schema.
- [ ] Update `compendium/data-ingestion-platform.md` with the EPIC-10 profile, discovery/fetch
      pattern, replay contract, and promoted artifact boundaries.
- [ ] Update `compendium/game-rule-engine.md` only as needed to clarify the new pure rune helper
      boundary and the continued deferral of full equipment validation.
- [ ] Close BW tickets, `EPIC-10`, the sprint record, the ledger row, and the ticket-burn manifest
      only after the promoted artifacts and verification results are complete.
- [ ] Confirm the current skill editor, local library, and sharing behavior remain unchanged.

**Verification:**

- `rg -n 'EPIC-10|BW-100[1-6]|SPRINT-011' work/tickets/10-runes work/sprints`
- `npm run verify`
- Manual review that docs, sprint records, and promoted EPIC-10 paths all agree

**Phase Acceptance:**

The runtime and audit boundaries are documented, downstream epics have a clear handoff contract,
and every EPIC-10 planning and closeout record points at the same final artifact set.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Add the `RuneCatalog` runtime contract, effect unions, source-set summary, and dependency summary types |
| `src/domain/catalog-lookup.ts` | Modify | Add collision-safe rune lookup helpers where downstream code needs them |
| `src/domain/rune-effects.ts` | Create | Hold pure highest-bonus and health-penalty helper logic for later equipment work |
| `src/domain/index.ts` | Modify | Export rune catalog and helper APIs |
| `test/domain/rune-catalog.test.ts` | Create | Verify the runtime rune wire contract and lookup behavior |
| `test/domain/rune-effects.test.ts` | Create | Verify stacking semantics and health-penalty preservation |
| `test/domain/effective-attribute-rank.test.ts` | Modify | Prove rune adjustments compose with the existing effective-rank helper |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Assert the Python-generated EPIC-10 fixture matches the TypeScript contract |
| `scripts/data/build_wars_ingest/config.py` | Modify | Add EPIC-10-specific bounded caps if needed |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register the EPIC-10 profile, paths, and source limits |
| `scripts/data/build_wars_ingest/rune_source_set.py` | Create | Implement source-plan building, drift checks, and snapshot-set replay validation |
| `scripts/data/build_wars_ingest/rune_extractors.py` | Create | Parse rune detail pages into deterministic raw fields and diagnostics |
| `scripts/data/build_wars_ingest/rune_catalog.py` | Create | Normalize runes into the runtime catalog and emit QA-facing diagnostics |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Add fixture, offline, and live EPIC-10 execution paths |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Add EPIC-10 CLI routing and command summaries |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Reuse the shared QA engine with rune-specific finding coverage |
| `scripts/data/build_wars_ingest/tests/test_profiles.py` | Modify | Prove profile registration and path/cap invariants |
| `scripts/data/build_wars_ingest/tests/test_cli.py` | Modify | Cover EPIC-10 CLI summaries and option handling |
| `scripts/data/build_wars_ingest/tests/test_pipeline.py` | Modify | Cover EPIC-10 fixture and offline pipeline behavior |
| `scripts/data/build_wars_ingest/tests/test_rune_source_set.py` | Create | Cover source planning, digest binding, and replay preconditions |
| `scripts/data/build_wars_ingest/tests/test_rune_extractors.py` | Create | Cover extraction of names, families, restrictions, effects, and icon metadata |
| `scripts/data/build_wars_ingest/tests/test_rune_catalog.py` | Create | Cover semantic normalization, catalog assembly, and version behavior |
| `test/fixtures/data-ingestion/runes/**` | Create | Hold synthetic rune source fixtures for source-set and extraction tests |
| `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json` | Create | Track the synthetic golden runtime rune catalog fixture |
| `.gitignore` | Modify | Add exact EPIC-10 allowlists while keeping non-runtime artifacts ignored |
| `data/generated/epic-10/runes.catalog.json` | Create | Promote the runtime-eligible EPIC-10 catalog |
| `data/generated/epic-10/runes.catalog.manifest.json` | Create | Promote the adjacent EPIC-10 audit manifest |
| `data/qa/epic-10/runes.catalog.qa.json` | Create | Promote the machine-readable EPIC-10 QA report |
| `README.md` | Modify | Document EPIC-10 scope and verification expectations |
| `scripts/data/README.md` | Modify | Document EPIC-10 fixture, offline, and live commands |
| `data/README.md` | Modify | Record EPIC-10 promoted artifact policy |
| `data/generated/README.md` | Modify | Record EPIC-10 generated-path allowlists and runtime boundaries |
| `data/qa/README.md` | Modify | Record EPIC-10 QA artifact policy |
| `data/source-snapshots/README.md` | Modify | Record EPIC-10 snapshot retention and replay expectations |
| `compendium/data-ingestion-platform.md` | Modify | Extend the shared platform docs with the EPIC-10 profile and replay flow |
| `compendium/runes-catalog.md` | Create | Durable implementation and handoff note for the rune catalog |
| `compendium/game-rule-engine.md` | Modify | Clarify pure rune helper scope and deferred equipment validation |
| `compendium/README.md` | Modify | Index the new rune catalog compendium note |
| `work/tickets/10-runes/*.md` | Modify | Keep ticket status, acceptance, and closeout records aligned |
| `work/sprints/SPRINT-011.md` | Create/Modify | Final execution record for the sprint |
| `work/sprints/ledger.tsv` | Modify | Mark sprint state consistently with ticket-burn records |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-10-result.json` | Modify | Keep the ticket-burn result manifest synchronized with the final sprint outcome |

## Definition of Done

- [ ] `SPRINT-011` exists as an execution-ready sprint tied to `EPIC-10` and `BW-1001` through
      `BW-1006`.
- [ ] `src/domain/catalog.ts` exposes a plain-data `RuneCatalog` contract with stable IDs, names,
      normalized lookup keys, family/rank, profession or attribute joins, metadata-only icon
      references, compact provenance references, and structured effects.
- [ ] The rune effect model distinguishes attribute bonuses, health penalties, health bonuses,
      energy bonuses, and note-only or unknown behavior without requiring copied source prose.
- [ ] The highest applicable attribute-rune bonus can be selected per affected attribute without
      losing independently countable verified health penalties.
- [ ] Pure rune lookup and effect helpers exist in `src/domain` and remain framework-neutral.
- [ ] An `epic-10-runes` ingestion profile is registered in the shared pipeline with fixture,
      offline, and manual live modes plus bounded caps.
- [ ] The EPIC-10 source set is digest-bound, reviewable before fetch, and replayable offline from
      one selected complete snapshot set.
- [ ] Synthetic rune fixtures cover profession attribute runes, non-attribute rune families,
      duplicate names, redirects, missing icons, malformed effect text, and unsupported source
      shapes.
- [ ] Raw extraction preserves source identity, effect evidence, and ambiguous cases as
      deterministic diagnostics or dispositions.
- [ ] Semantic normalization produces deterministic `RuneCatalog` records, section digests, and a
      semantic `catalogVersion`.
- [ ] `data/generated/epic-10/runes.catalog.json`,
      `data/generated/epic-10/runes.catalog.manifest.json`, and
      `data/qa/epic-10/runes.catalog.qa.json` are the only promoted EPIC-10 exact paths.
- [ ] `.gitignore` allowlists only those approved EPIC-10 files and keeps source plans, snapshot
      sets, QA summaries, raw snapshots, and icon bytes ignored.
- [ ] Fixed-clock fixture regeneration is byte-identical for the EPIC-10 catalog, manifest, and QA
      report.
- [ ] Offline replay from the selected snapshot set reproduces the promoted EPIC-10 catalog output.
- [ ] QA covers duplicate IDs, duplicate names, missing joins, missing icon metadata, missing
      revision facts, copied-text policy risk, malformed effect data, stackability gaps, and
      source-set accounting.
- [ ] Runtime app code still does not import EPIC-10 audit artifacts, and no app UI or saved-build
      schema changes are introduced by this sprint.
- [ ] `compendium/runes-catalog.md` documents source authority, runtime boundaries, regenerate
      commands, QA gates, deferred scope, and downstream handoff notes.
- [ ] README, data READMEs, and ticket-burn records are consistent with the final EPIC-10 promoted
      artifact set.
- [ ] `npm run typecheck` succeeds.
- [ ] Focused EPIC-10 Vitest and Python tests succeed.
- [ ] `npm run verify` succeeds.
- [ ] `EPIC-10`, `BW-1001` through `BW-1006`, `SPRINT-011`, the ledger row, and the ticket-burn
      result manifest all reflect the same final status.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The chosen rune source graph is too broad or too weak, causing late source-plan churn | Medium | High | Freeze the authority in `BW-1002`, keep discovery digest-bound, and reject unplanned source expansion without an explicit amendment |
| Rune semantics overfit early assumptions and become hard to use for later equipment work | Medium | High | Use effect unions and pure helpers that preserve uncertainty instead of one aggregate stat result |
| Duplicate attribute runes accidentally erase duplicate health penalties | Medium | High | Separate attribute-bonus selection from health-penalty counting and prove the rule with focused TS fixtures |
| Non-attribute families have ambiguous or mixed stacking behavior | High | Medium | Keep verified stackability explicit and leave unresolved cases as note or unknown states with QA findings |
| Source-authored prose leaks into runtime artifacts through extraction shortcuts | Medium | High | Restrict the runtime schema to structured effects and reviewed short factual notes only, with QA checks for copied-text risk |
| Exact-path allowlists drift and accidentally expose non-runtime artifacts | Medium | High | Update `.gitignore`, docs, and promotion verification together, then confirm approved versus ignored paths explicitly |
| Live refresh becomes a hidden dependency for verification | Low | Medium | Keep fixture and offline replay as the default gates and make live refresh manual-only and optional |

## Security

- Treat all source pages, page titles, image metadata, and extracted text as untrusted input.
- Keep `src/domain` and runtime JSON free of React, browser APIs, network clients, Python tooling,
  raw snapshots, manifests, and QA reports.
- Keep icon handling metadata-only; do not commit icon bytes, screenshots, thumbnails, or other
  external media payloads.
- Do not copy long source-authored prose into runtime records, fixtures, or promoted artifacts.
- Preserve path confinement, digest validation, and exact-path promotion rules already established
  by the ingestion platform.
- Keep manual live refreshes explicit with `--allow-live-network`; they must never run as part of
  the default repo verification path.

## Dependencies

- `SPRINT-003` provides the snapshot, parser, artifact, and QA ingestion spine.
- `SPRINT-004` provides the promoted profession and attribute catalog required for rune joins.
- `SPRINT-005` provides the closest source-set, digest-confirmed fetch, and promotion precedent.
- `SPRINT-007` provides the existing effective attribute rank helper and validation-result semantics
  that EPIC-10 should extend without replacing.
- `SPRINT-010` is already complete and establishes that current runtime persistence and sharing
  intentionally exclude runes and equipment state.
- `BW-1001` must complete before `BW-1002`, `BW-1003`, and `BW-1004` can finalize, because the
  contract and profile define the schema and pipeline surface they depend on.
- `BW-1002` must complete before `BW-1003` and `BW-1005`, because extraction and promotion depend
  on a locked source set and replay contract.
- `BW-1003` must complete before `BW-1004` and `BW-1005`, because semantic normalization and QA
  need stable extracted fields.
- `BW-1004` must complete before `BW-1005`, because promotion needs the final runtime effect model
  and downstream fixtures.
- `BW-1005` must complete before `BW-1006`, because docs and closeout should describe only the
  final promoted artifact set and verified boundaries.
- Node.js, npm, Python 3, and the pinned `mwparserfromhell` environment remain required for full
  repository verification.

## Open Questions

- Which bounded EPIC-10 source authority yields complete rune coverage with the smallest reviewable
  graph: one index page, a category-family hybrid, or a family-page seed set?
- Should headgear interaction be modeled as a dedicated structured handoff field, or is a typed
  note effect sufficient until EPIC-13 owns armor shell records?
- Which non-attribute rune families have enough verified evidence to mark as additive or
  non-stacking in v1, and which should remain explicit `unknown` states for EPIC-21?
- Do downstream callers need only lookup plus effect-summary helpers, or is a slightly richer pure
  `rune-effects.ts` API the cleaner long-term boundary?
- Is there enough policy-reviewed evidence to include short factual display notes for ambiguous rune
  behaviors in v1, or should the first promotion stay structured-only except for explicit note
  states?
