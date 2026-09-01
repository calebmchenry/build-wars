---
id: SPRINT-004
title: Professions and Attributes Catalog
status: completed
source_target: BACKLOG
source_epic: EPIC-03
source_epic_path: work/tickets/03-professions-and-attributes/EPIC.md
tickets:
  - BW-0301
  - BW-0302
  - BW-0303
  - BW-0304
  - BW-0305
  - BW-0306
created: 2026-09-01
---

# Sprint 004: Professions and Attributes Catalog

## Overview

This sprint turns `EPIC-03 Professions and Attributes` into the first runtime-eligible source-derived Build Wars catalog. It extends the completed EPIC-02 ingestion spine to normalize professions, attributes, template ID crosswalks, attribute point rules, quest reward metadata, primary-attribute effect summaries, provenance, and QA evidence.

The sprint is a catalog and data-promotion increment. It does not build selector UI, a skill catalog, template import/export, rule-engine enforcement, equipment behavior, attribution UI, local storage, or runtime source fetching. Later epics consume the approved generated catalog, not raw snapshots or ingestion internals.

The key planning decisions are locked for execution: template IDs and catalog IDs are separate concepts joined by explicit crosswalk records; profession template ID `0` is the `None` sentinel and not a playable profession; attribute IDs preserve non-contiguous template values; `npm run verify` stays offline; production promotion requires one bounded live refresh followed by offline replay and QA closeout.

## Use Cases

1. **Generate selectors later**: A future UI can render the ten playable professions, abbreviations, campaign availability, primary attributes, owned attributes, and metadata-only icon references from one approved catalog.
2. **Decode template IDs later**: EPIC-05 can map profession and attribute template IDs to catalog records and back, including profession `0 -> None` and unknown numeric IDs.
3. **Validate attribute availability later**: EPIC-06 can determine which attributes are legal for a primary/secondary profession pair, including primary-only restrictions.
4. **Validate point spending later**: EPIC-06 can calculate purchased-rank cost and level-based budgets from catalog data rather than hard-coded UI constants.
5. **Review primary attribute context**: Future UI or rule work can use short reviewed summaries of inherent primary-attribute effects without copied source prose.
6. **Regenerate deterministically**: Maintainers can run fixture and offline modes with fixed inputs and clock to reproduce canonical JSON, manifests, QA reports, and finding IDs.
7. **Promote with evidence**: Reviewers can trace every promoted record and field to source references, revision metadata, transformation notes, manual reviews, QA findings, and artifact digests.

## Architecture

### Scope Boundary

| Area             | In Scope                                                                                                | Out Of Scope                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Domain contracts | Plain-data catalog, crosswalk, allocation-rule, icon-reference, review, and lookup types.               | React state, UI selectors, storage, template codecs, and rule-engine enforcement.                              |
| Ingestion        | EPIC-03 source profile, verified snapshots, extractors, normalizers, artifact assembly, and QA.         | A profession-specific scraper, browser automation, arbitrary wiki crawling, or runtime fetches.                |
| Generated data   | Exact-path approved catalog JSON, generated manifest, and bounded QA JSON.                              | Broad generated commits, raw snapshots, copied page bodies, icon bytes, screenshots, or full live run output.  |
| Verification     | Offline fixture tests, TypeScript contract tests, deterministic replay, QA gates, and `npm run verify`. | CI network access, release correctness based only on planning-time source metadata, or manual-only validation. |
| Closeout         | Ticket, epic, sprint, ledger, documentation, and manifest consistency.                                  | Implementation commits; the outer ticket-burn runner owns commits when enabled.                                |

### Data Flow

```text
bounded EPIC-03 source profile
  -> MediaWikiClient live fetch only when explicit
  -> ignored raw payload + SourceSnapshotManifest
  -> snapshot-driven source-shape proof
  -> template crosswalk extractor
  -> profession and attribute extractors
  -> attribute point and quest normalizers
  -> reviewed derived primary-effect summaries
  -> combined catalog envelope
  -> canonical JSON + GeneratedArtifactManifest
  -> QaReport + baseline review
  -> exact-path promotion
```

Extractors consume verified snapshots and source references. They do not perform network requests, write ad hoc artifacts, or import browser code. Runtime code may consume only the approved generated catalog after promotion.

### Source Authority

| Fact                                                          | Primary Authority                                     | Cross-check                                                    | Conflict Handling                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Template profession IDs and `None`                            | `Skill template format`                               | `Profession` and bounded profession pages                      | Blocking QA finding; do not renumber.                                       |
| Template attribute IDs and gaps                               | `Skill template format`                               | `Attribute`                                                    | Blocking QA finding; preserve gaps.                                         |
| Playable profession set, names, abbreviations, campaign facts | `Profession`                                          | Template crosswalk and bounded profession pages                | Blocking QA finding or manual override with evidence.                       |
| Attribute ownership and primary-only status                   | `Attribute`                                           | Profession primary-attribute facts and bounded attribute pages | Blocking QA finding or manual override with evidence.                       |
| Rank costs, level totals, quest rewards                       | `Attribute point` and exact quest pages when needed   | Arithmetic validators                                          | Blocking QA finding for missing, malformed, or inconsistent rows.           |
| Icon metadata                                                 | Profession page file facts plus MediaWiki `imageinfo` | Metadata validator                                             | Nullable with QA disposition unless policy or integrity is violated.        |
| Primary effect summaries                                      | Bounded factual inputs from primary-attribute pages   | Manual review                                                  | Must be original derived text; copied or unsupported text blocks promotion. |

Planning-time wiki API checks identified `Profession`, `Attribute`, `Skill template format`, and `Attribute point` as source candidates. Implementation must fetch fresh snapshots and revision metadata before treating any value as release evidence.

### Catalog Contract

Add distinct template ID concepts such as `TemplateProfessionId` and `TemplateAttributeId` alongside existing catalog IDs. The first catalog version may intentionally use the same numeric values for catalog IDs and template IDs, but only crosswalk records define compatibility.

The generated `ProfessionAttributeCatalog` envelope should contain:

- `schemaVersion`, `catalogVersion`, `sectionDigests`, `generatedAt`, `generator`, and `profile`
- aggregate `sources` and `snapshotManifestPaths`
- `templateCrosswalk` with profession sentinel `0`, profession mappings, attribute mappings, and reserved/gap facts
- `professions` with ten playable records
- `attributes` with every template-listed attribute record
- `attributePointRules` with marginal costs, cumulative costs, level totals, quest rewards, quest grouping, maximum applicable quest bonus, and default PvE level-20 assumptions
- `remoteMedia` with metadata-only icon records
- record and field provenance claims that reference aggregate source IDs instead of repeating whole source objects on every field

`catalogVersion` is derived from a canonical semantic projection of gameplay/display fields. It excludes retrieval timestamps, generation timestamps, QA paths, manifest paths, raw provenance timing, and its own value. The manifest digest still changes whenever artifact bytes change. Section digests allow downstream consumers to detect changes to only the sections they depend on.

### Identity And Lookup Semantics

- Profession template ID `0` maps to `None` and has `catalogId: null`.
- The playable profession catalog contains exactly ten records and never includes ID `0`.
- Attribute ID `0` remains a valid attribute-namespace value if present in the verified template source.
- Attribute IDs are numeric, non-compacted, and never inferred from array position.
- Known, none, reserved, unsupported, and unknown IDs are distinct lookup outcomes.
- Reverse lookups use canonical names and explicit abbreviations only. Collisions block promotion; there is no fuzzy or substring matching.
- Unknown authored numeric IDs remain representable and are not coerced or dropped by lookup helpers.

### Allocation Semantics

Allocation rules are static catalog facts, not validation results. They belong in catalog/reference contracts and pure helpers, while EPIC-06 owns validation result behavior.

The catalog must distinguish:

- purchased rank from effective rank after runes, equipment, skills, consumables, blessings, or effects
- marginal cost from cumulative cost
- base level points from quest bonus points
- individual quest facts from the maximum applicable quest bonus
- default PvE level-20 assumptions from PvP, hero, progression, and account/character-state behavior

The MVP default is a level-20 PvE player with maximum applicable attribute quest rewards. Level 20 without quest rewards and level 20 with the maximum applicable reward must evaluate to the expected 170 and 200 point budgets unless fresh source evidence blocks the sprint for review.

### Review, QA, And Promotion

The first EPIC-03 production candidate has no prior approved EPIC-03 baseline. Promotion must record a first-baseline review event that names the selected snapshots, generated artifact, manifest, QA report, semantic projection, reviewer, timestamp, and rationale. Future refreshes compare against this approved baseline and classify diffs as semantic, provenance-only, formatting/order, or schema changes.

Exact promoted paths:

- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`
- `data/qa/epic-03/professions-attributes.catalog.qa.json`

Fixture path:

- `test/fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json`

Ignored by default:

- raw source payloads
- snapshot manifests
- candidate live/offline outputs outside the exact promoted paths
- text QA summaries unless a later ticket approves them
- icon binaries, thumbnails, screenshots, copied page bodies, and unreviewed prose

Promotion requires:

- one bounded live refresh from the locked source profile
- offline replay from the selected snapshots with fixed clock/configuration
- byte-identical repeated generation of catalog, manifest, QA report, and finding IDs
- complete source IDs and provenance
- all primary-effect summaries reviewed as original derived summaries
- no unresolved critical or error findings
- every warning either resolved, excluded, or accepted with named bounded review evidence
- `appConsumptionGate: pass` and `publicReleaseGate: pass`
- exact `.gitignore` allowlisting verified with `git check-ignore -v` and `git status --short`

## Implementation

### Phase 1: BW-0301 Source Shape, Contracts, And Profile Groundwork (~15% of effort)

**Files:**

- `src/domain/ids.ts`
- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/source.ts`
- `src/domain/index.ts`
- `test/fixtures/foundation.ts`
- `test/domain/contracts.test.ts`
- `test/domain/profession-attribute-catalog.test.ts`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `work/tickets/03-professions-and-attributes/BW-0301-catalog-contract-extensions.md`

**Tasks:**

- [x] Confirm EPIC-00 through EPIC-02 and SPRINT-001 through SPRINT-003 are complete.
- [x] Perform a bounded source-shape checkpoint for `Skill template format`, `Profession`, `Attribute`, and `Attribute point`; record whether structured wikitext/table parsing is sufficient or a bounded table helper is needed.
- [x] Define distinct template ID contracts and crosswalk records for professions and attributes.
- [x] Define `ProfessionAttributeCatalog`, section digests, semantic `catalogVersion`, profession campaign semantics, icon references, allocation rules, quest groups, and default PvE assumptions.
- [x] Add pure lookup helper contracts for `none`, `known`, `reserved`, `unsupported`, and `unknown` outcomes without implementing full template codecs.
- [x] Add or adapt a profile registry so EPIC-02 fixture behavior remains registered and unchanged, and EPIC-03 can select exact snapshot manifests instead of scanning all snapshots.
- [x] Migrate synthetic fixtures and TypeScript contract tests for sentinel `0`, attribute ID `0`, ID gaps, unknown IDs, campaign fields, icon nullability, and allocation-rule shapes.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/profession-attribute-catalog.test.ts`
- Focused Python profile tests proving EPIC-02 fixture output remains compatible

### Phase 2: BW-0302 Template ID Crosswalk (~15% of effort)

**Files:**

- `scripts/data/build_wars_ingest/template_ids.py`
- `scripts/data/build_wars_ingest/wiki_tables.py` if required by the source-shape checkpoint
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_template_ids.py`
- `test/fixtures/data-ingestion/professions-attributes/skill-template-format.wiki`
- `test/domain/profession-attribute-catalog.test.ts`
- `work/tickets/03-professions-and-attributes/BW-0302-template-id-crosswalk.md`

**Tasks:**

- [x] Extract profession and attribute template ID tables from verified `Skill template format` snapshots.
- [x] Emit explicit crosswalk records for profession template ID `0`, all playable professions, every parsed attribute ID, and reserved/gap facts.
- [x] Preserve candidate row scope, source references, normalized title evidence, and diagnostics.
- [x] Never infer IDs from row position, dense ranges, or display order.
- [x] Build collision-safe forward and reverse lookup indexes from records in tests, not serialized duplicate maps.
- [x] Emit QA diagnostics for duplicate IDs, duplicate names, malformed rows, missing sentinel, unexpected gaps, unresolved redirects, lossy parsing, and name drift.
- [x] Add minimized synthetic fixtures for sentinel `0`, attribute `0`, non-contiguous IDs, reordered rows, redirects, duplicate rows, malformed values, unknown columns, and punctuation variants.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_template_ids`
- `npm run data:test`
- `npm run test:run -- test/domain/profession-attribute-catalog.test.ts`

### Phase 3: BW-0303 Profession And Attribute Extractors (~25% of effort)

**Files:**

- `scripts/data/build_wars_ingest/professions_attributes.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_professions_attributes.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/professions-attributes/profession.wiki`
- `test/fixtures/data-ingestion/professions-attributes/attribute.wiki`
- `test/fixtures/data-ingestion/professions-attributes/imageinfo.json`
- `work/tickets/03-professions-and-attributes/BW-0303-profession-attribute-extractors.md`

**Tasks:**

- [x] Lock the exact EPIC-03 source profile after the source-shape checkpoint, including page caps, request caps, byte caps, title lists, and allowed detail pages.
- [x] Extract exactly ten playable professions with catalog ID, template ID, name, abbreviation, profession family, primary character-creation campaign availability, primary attribute ID, provenance, and nullable icon reference.
- [x] Extract every template-listed attribute with catalog ID, template ID, name, owning profession, primary flag, primary-only availability, provenance, and nullable reviewed effect summary.
- [x] Join source facts by explicit IDs/titles and source identity, never by array position.
- [x] Retain every candidate source row as a normalized record, evidence-backed exclusion, or scoped diagnostic.
- [x] Validate exactly one primary attribute per profession, valid bidirectional primary references, no orphaned owners, no duplicate abbreviations, and no name collisions.
- [x] Reuse metadata-only icon resolution with `cachedBytes: false`; do not download, cache, commit, or bundle icon bytes.
- [x] Add fixtures for core and campaign-specific professions, ownership conflicts, primary flag conflicts, redirects, unknown rows, missing facts, ambiguous icons, and copied-text risk.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_professions_attributes`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_icons`
- `npm run data:test`

### Phase 4: BW-0304 Attribute Points And Quest Metadata (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/attribute_points.py`
- `scripts/data/build_wars_ingest/professions_attributes.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_attribute_points.py`
- `test/fixtures/data-ingestion/professions-attributes/attribute-point.wiki`
- `test/domain/profession-attribute-catalog.test.ts`
- `work/tickets/03-professions-and-attributes/BW-0304-attribute-points-and-quests.md`

**Tasks:**

- [x] Extract marginal and cumulative costs for purchased ranks, including explicit rank `0` and the verified maximum purchased-rank boundary.
- [x] Extract level-based base point totals for the supported PvE player level range.
- [x] Extract factual quest reward metadata: stable normalized ID, canonical quest name, campaign or eligibility grouping, reward points, source references, and provenance.
- [x] Represent maximum applicable quest bonus separately from individual quest records so mutually exclusive origin paths cannot be double-counted.
- [x] Derive default level-20 PvE budgets from the level table and maximum quest reward policy.
- [x] Document deferred contexts for PvP characters, heroes, actual quest logs, campaign progression, runes, equipment, consumables, blessings, and temporary effects.
- [x] Validate unique keys, bounded nonnegative integers, monotonic costs/totals, arithmetic consistency, quest grouping, missing rows, duplicate rows, and malformed table values.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_attribute_points`
- `npm run data:test`
- `npm run test:run -- test/domain/profession-attribute-catalog.test.ts`

### Phase 5: BW-0305 Catalog Assembly, QA, Review, And Promotion (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/profession_attribute_catalog.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profession_attribute_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json`
- `test/domain/data-ingestion-contracts.test.ts`
- `.gitignore`
- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`
- `data/qa/epic-03/professions-attributes.catalog.qa.json`
- `work/tickets/03-professions-and-attributes/BW-0305-generated-catalog-qa-and-promotion.md`

**Tasks:**

- [x] Assemble one canonical catalog envelope with source references, section digests, template crosswalks, professions, attributes, allocation rules, remote media, and provenance.
- [x] Calculate semantic `catalogVersion` from schema-owned runtime fields and full artifact digest from canonical bytes.
- [x] Add profile validators for record counts, sentinel handling, namespace separation, ID gaps, reverse lookup collisions, source row coverage, ownership, primary restrictions, campaign semantics, icons, summaries, allocation rules, quest grouping, provenance, schema shape, and artifact integrity.
- [x] Author original derived summaries for all primary attributes, with field-level provenance and named manual review records. Do not copy or lightly edit source prose.
- [x] Record first-promotion baseline review when no prior approved EPIC-03 artifact exists.
- [x] Classify later baseline diffs as semantic, provenance-only, formatting/order, or schema changes.
- [x] Run a bounded live refresh from the locked source profile, then replay offline from the selected snapshots with fixed clock/configuration.
- [x] Prove byte-identical repeated generation for catalog, manifest, QA JSON, source/finding ordering, and finding IDs.
- [x] Promote only the exact catalog JSON, manifest JSON, and bounded QA JSON paths after both QA gates pass and warnings are dispositioned.
- [x] Verify `.gitignore` allowlisting with `git check-ignore -v` and `git status --short`.

**Verification:**

- `npm run data:regenerate`
- `npm run data:test`
- Focused artifact, QA, pipeline, CLI, and generated-contract tests
- One bounded manual live refresh followed by deterministic offline replay

### Phase 6: BW-0306 Documentation, Verification, And Closeout (~10% of effort)

**Files:**

- `package.json`
- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/professions-and-attributes.md`
- `compendium/README.md`
- `work/tickets/03-professions-and-attributes/EPIC.md`
- `work/tickets/03-professions-and-attributes/BW-0301-catalog-contract-extensions.md`
- `work/tickets/03-professions-and-attributes/BW-0302-template-id-crosswalk.md`
- `work/tickets/03-professions-and-attributes/BW-0303-profession-attribute-extractors.md`
- `work/tickets/03-professions-and-attributes/BW-0304-attribute-points-and-quests.md`
- `work/tickets/03-professions-and-attributes/BW-0305-generated-catalog-qa-and-promotion.md`
- `work/tickets/03-professions-and-attributes/BW-0306-docs-verification-and-closeout.md`
- `work/sprints/SPRINT-004.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [x] Document source authority, source caps, source-shape proof results, artifact schema, ID semantics, sentinel behavior, allocation assumptions, profile modes, exact paths, QA gates, baseline review, and refresh procedure.
- [x] Document that the catalog is runtime-eligible but not yet imported by `src/app`; future UI work must separately handle attribution and remote media/privacy decisions.
- [x] Document raw snapshot and snapshot-manifest replay limits because full source payloads remain ignored.
- [x] Make canonical fixture regeneration include EPIC-03 while remaining offline and deterministic.
- [x] Run focused checks, run fixture regeneration twice, and then run `npm run verify`.
- [x] Inspect the diff for unrelated code, raw snapshots, broad generated paths, copied prose, icon bytes, screenshots, secrets, absolute machine paths, and nondeterministic timestamps.
- [x] Mark BW-0301 through BW-0306 done only after phase acceptance passes. Mark EPIC-03, SPRINT-004, and the ledger done only after the full Definition of Done passes.
- [x] Do not create a commit.

**Verification:**

- `npm run data:regenerate`
- `npm run verify`
- Manual review of ticket, epic, sprint, ledger, manifest, generated artifact, QA report, docs, and status consistency

## Files Summary

| File                                                                                 | Action                  | Purpose                                                                                                  |
| ------------------------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/domain/ids.ts`                                                                  | Modify                  | Add distinct template ID concepts and preserve catalog ID branding.                                      |
| `src/domain/catalog.ts`                                                              | Modify                  | Add profession/attribute catalog envelope, campaign, icon, crosswalk, summary, and allocation contracts. |
| `src/domain/catalog-lookup.ts`                                                       | Create                  | Pure lookup and budget helpers for catalog consumers.                                                    |
| `src/domain/source.ts`                                                               | Modify narrowly         | Use existing provenance, media, review, manifest, and QA contracts; extend only if required.             |
| `src/domain/index.ts`                                                                | Modify                  | Export new public domain contracts and helpers.                                                          |
| `scripts/data/build_wars_ingest/profiles.py`                                         | Create                  | Registered profile definitions and exact snapshot selection.                                             |
| `scripts/data/build_wars_ingest/template_ids.py`                                     | Create                  | Template profession/attribute crosswalk extraction.                                                      |
| `scripts/data/build_wars_ingest/professions_attributes.py`                           | Create                  | Profession and attribute source normalization.                                                           |
| `scripts/data/build_wars_ingest/attribute_points.py`                                 | Create                  | Attribute point, level, quest, and default assumption extraction.                                        |
| `scripts/data/build_wars_ingest/profession_attribute_catalog.py`                     | Create                  | Catalog assembly, semantic projection, and section digests.                                              |
| `scripts/data/build_wars_ingest/wiki_tables.py`                                      | Create if required      | Bounded table framing for verified source shapes.                                                        |
| `scripts/data/build_wars_ingest/icons.py`                                            | Modify                  | Integrate metadata-only profession icon records and diagnostics.                                         |
| `scripts/data/build_wars_ingest/artifacts.py`                                        | Modify                  | Support EPIC-03 artifact metadata, first baseline, and diff classification.                              |
| `scripts/data/build_wars_ingest/qa.py`                                               | Modify                  | Add profile-specific validators while preserving shared QA wire format.                                  |
| `scripts/data/build_wars_ingest/pipeline.py`                                         | Modify                  | Profile-driven fixture, offline, and live orchestration.                                                 |
| `scripts/data/build_wars_ingest/cli.py`                                              | Modify                  | Profile selection, bounded live source plan, and summaries.                                              |
| `scripts/data/build_wars_ingest/tests/`                                              | Create/modify           | Offline Python tests for profiles, extraction, artifacts, QA, pipeline, and CLI.                         |
| `test/domain/contracts.test.ts`                                                      | Modify                  | Domain contract regressions for sentinel, gaps, and JSON compatibility.                                  |
| `test/domain/profession-attribute-catalog.test.ts`                                   | Create                  | Catalog lookup, allocation, and versioning tests.                                                        |
| `test/domain/data-ingestion-contracts.test.ts`                                       | Modify                  | Cross-language generated artifact alignment.                                                             |
| `test/fixtures/foundation.ts`                                                        | Modify                  | Synthetic fixture migration.                                                                             |
| `test/fixtures/data-ingestion/professions-attributes/`                               | Create                  | Minimized synthetic source-shape fixtures.                                                               |
| `test/fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json` | Create                  | Synthetic golden generated artifact.                                                                     |
| `data/generated/epic-03/professions-attributes.catalog.json`                         | Create/allowlist        | Runtime-eligible generated catalog.                                                                      |
| `data/generated/epic-03/professions-attributes.catalog.manifest.json`                | Create/allowlist        | Generated artifact manifest and digest evidence.                                                         |
| `data/qa/epic-03/professions-attributes.catalog.qa.json`                             | Create/allowlist        | Bounded machine-readable QA and gate evidence.                                                           |
| `.gitignore`                                                                         | Modify narrowly         | Exact-path generated/QA allowlisting.                                                                    |
| `package.json`                                                                       | Modify narrowly         | Keep regeneration and verify commands offline and deterministic.                                         |
| `README.md`                                                                          | Modify                  | Document catalog boundary and commands.                                                                  |
| `scripts/data/README.md`                                                             | Modify                  | Document profile sources, modes, caps, replay, and refresh.                                              |
| `data/README.md`                                                                     | Modify                  | Document lifecycle exception for EPIC-03 promoted artifacts.                                             |
| `data/generated/README.md`                                                           | Modify                  | Document exact catalog/manifest promotion.                                                               |
| `data/qa/README.md`                                                                  | Modify                  | Document exact QA report promotion and non-runtime use.                                                  |
| `compendium/data-ingestion-platform.md`                                              | Modify                  | Record registered-profile extension conventions.                                                         |
| `compendium/professions-and-attributes.md`                                           | Create                  | Durable catalog assumptions, source authority, and deferred contexts.                                    |
| `compendium/README.md`                                                               | Modify                  | Index the EPIC-03 catalog note.                                                                          |
| `work/tickets/03-professions-and-attributes/*.md`                                    | Modify                  | Ticket status, sprint linkage, and closeout evidence.                                                    |
| `work/sprints/SPRINT-004.md`                                                         | Modify during execution | Sprint execution state.                                                                                  |
| `work/sprints/ledger.tsv`                                                            | Modify                  | Sprint lifecycle record.                                                                                 |

## Definition of Done

- [x] BW-0301 through BW-0306 are linked to SPRINT-004 and completed in dependency order.
- [x] EPIC-03, SPRINT-004, and `work/sprints/ledger.tsv` are marked complete only after all technical and process criteria pass.
- [x] Existing EPIC-02 fixture behavior remains compatible after profile registration.
- [x] `src/domain` remains plain-data and does not import React, DOM/browser APIs, storage, network clients, filesystem APIs, app modules, or data scripts.
- [x] One authoritative generated wire shape is validated by Python output and TypeScript tests.
- [x] The generated catalog contains exactly ten playable professions and no profession record for template ID `0`.
- [x] Profession template ID `0` maps to the `None` sentinel with `catalogId: null`.
- [x] Attribute ID `0` remains separate from profession sentinel `0` and is handled in the attribute namespace.
- [x] Every template-listed attribute ID is represented exactly once or has a blocking, explicitly resolved exclusion.
- [x] Attribute ID gaps are preserved and no ID is inferred from array position, row order, or dense ranges.
- [x] Known, none, reserved, unsupported, and unknown lookup outcomes are distinct and tested.
- [x] Profession and attribute reverse lookups are collision-safe and deterministic.
- [x] Profession records include IDs, names, abbreviations, profession family, primary character-creation campaign availability, primary attributes, provenance, and nullable metadata-only icon references.
- [x] Attribute records include IDs, names, ownership, primary flags, primary-only availability, provenance, and reviewed primary-effect summaries.
- [x] Each profession has exactly one matching primary attribute and each primary attribute belongs to exactly one profession.
- [x] Metadata-only icon records have `cachedBytes: false`; no icon binaries, thumbnails, screenshots, or media bytes are tracked.
- [x] Purchased-rank, effective-rank, marginal-cost, cumulative-cost, base-level-points, quest-bonus, and default-budget concepts are distinct in data and tests.
- [x] Rank costs and level point totals cover the verified domains with unique, monotonic, bounded integer values.
- [x] Quest reward metadata cannot be double-counted across mutually exclusive campaign-origin paths.
- [x] Default level-20 PvE no-quest and maximum-reward budgets derive to 170 and 200 unless fresh source evidence blocks the sprint for review.
- [x] PvP, hero, rune, equipment, consumable, blessing, temporary-effect, progression, and actual quest-log behavior is explicitly deferred.
- [x] Every generated record, rule, media record, summary, manifest, and QA report has resolvable source/provenance references.
- [x] Primary-effect summaries are original derived Build Wars wording with field-level provenance and complete named manual review records.
- [x] No copied contributor prose, game-description prose, quest walkthrough, community prose, raw page body, screenshot, or external media binary is tracked.
- [x] The EPIC-03 profile is bounded by named source pages, request/page/byte caps, and exact snapshot selection.
- [x] Every candidate source row is retained as a record, evidence-backed exclusion, or scoped QA diagnostic.
- [x] QA covers counts, crosswalks, sentinels, namespaces, gaps, collisions, ownership, campaigns, icons, summaries, point tables, quests, provenance, source freshness, schema shape, copied-text risk, media policy, baseline diffs, and artifact integrity.
- [x] First-promotion baseline behavior is recorded when no prior approved EPIC-03 artifact exists.
- [x] Future baseline diffs classify semantic, provenance-only, formatting/order, and schema changes.
- [x] Repeated fixture/offline generation with fixed inputs and clock produces byte-identical catalog, manifest, QA JSON, source ordering, and finding IDs.
- [x] A bounded live refresh is completed for production promotion, then replayed offline from the selected snapshots.
- [x] The promoted catalog, manifest, QA report, baseline review, and documentation all reference the same selected snapshot set and source revisions.
- [x] `appConsumptionGate` and `publicReleaseGate` are `pass`; critical/error findings are closed; warnings are resolved, excluded, or accepted with bounded review evidence.
- [x] Only the three exact promoted paths are allowlisted: catalog JSON, manifest JSON, and QA JSON.
- [x] `git check-ignore -v` and `git status --short` prove raw snapshots, snapshot manifests, candidates, live logs, text summaries, and media bytes remain ignored or absent.
- [x] The catalog alone is runtime-eligible; app code does not import manifests, QA reports, snapshots, Python tooling, or wiki APIs.
- [x] `npm run data:regenerate` passes offline and is deterministic.
- [x] `npm run verify` passes with network access unnecessary.
- [x] README, data docs, script docs, compendium, generated artifacts, QA report, tickets, sprint, ledger, and result manifest agree on IDs, paths, modes, assumptions, and status.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                                                | Likelihood | Impact | Mitigation                                                                                                                                     |
| ------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Wiki source shape differs from planning assumptions                 | Medium     | High   | Add the source-shape checkpoint before extractor boundaries and block on unsupported structures.                                               |
| Raw page revisions rely on transcluded or template-expanded content | Medium     | High   | Capture relevant dependencies and diagnostics; add a bounded fallback only with explicit evidence.                                             |
| Template IDs are treated as catalog IDs by convention               | Medium     | High   | Use distinct types and explicit crosswalk records; test sentinel and namespace behavior.                                                       |
| Attribute gaps are compacted                                        | Medium     | High   | Key by explicit numeric ID, preserve gap facts, and reject dense-range inference.                                                              |
| `Profession` and `Attribute` sources disagree                       | Medium     | High   | Use source authority rules, retain evidence, and block or require manual override with review.                                                 |
| Campaign availability semantics are ambiguous                       | Medium     | Medium | Store profession family and primary creation availability only; defer travel and secondary unlock rules.                                       |
| Quest rewards are over-counted                                      | Medium     | High   | Model quest grouping and maximum applicable bonus separately from individual quest rows.                                                       |
| Point costs mix purchased and effective rank                        | Medium     | High   | Store purchased-rank costs only and explicitly defer bonuses/effects.                                                                          |
| Primary-effect summaries copy source prose                          | Medium     | High   | Require original derived summaries, field provenance, manual review, and copied-text QA gates.                                                 |
| Manual review blocks closeout late                                  | Medium     | Medium | Make review evidence a Phase 5 promotion gate and keep unsupported summaries from shipping.                                                    |
| First baseline has no previous artifact                             | High       | Medium | Record first-promotion baseline review as an explicit release event.                                                                           |
| Python and TypeScript wire contracts drift                          | Medium     | High   | Validate generated artifacts from both Python and Vitest against one documented shape.                                                         |
| Semantic `catalogVersion` omits a runtime field                     | Medium     | High   | Use schema-owned projection fields, section digests, and mutation tests for every runtime field.                                               |
| Existing EPIC-02 profile regresses                                  | Medium     | High   | Register existing behavior first and retain golden-output tests before EPIC-03 extraction changes.                                             |
| Exact `.gitignore` allowlist leaks generated byproducts             | Low        | High   | Use parent re-ignore patterns, exact-file exceptions, `git check-ignore -v`, and Git status inspection.                                        |
| Live refresh is unavailable during execution                        | Medium     | Medium | Keep implementation and offline verification complete; leave production promotion blocked with a manifest if live evidence cannot be produced. |
| Ignored snapshots limit historical replay                           | Medium     | Medium | Record source revisions, digests, dependency facts, and external-history limitations in docs and QA.                                           |

## Security Considerations

- Treat source titles, redirects, wikitext, table cells, template parameters, file titles, URLs, revision metadata, baselines, manifests, and QA evidence as untrusted input.
- Network access is allowed only in explicit live mode with `--allow-live-network`, the locked EPIC-03 source profile, and the fixed Guild Wars Wiki API origin.
- Do not accept arbitrary source URLs, source-provided fetch targets, recursive category crawls, or unbounded link expansion.
- Do not use credentials, cookies, tokens, environment secrets, or local machine-specific configuration in ingestion.
- Bound title batches, requests, continuation pages, response bytes, snapshot counts, parser input, table rows/cells, nested parsing work, output bytes, and QA evidence excerpts.
- Parse wiki content as data. Do not execute templates, Lua, HTML, JavaScript, shell snippets, links, or source-provided commands.
- Preserve path confinement, safe slugs, symlink-escape checks where practical, atomic writes, finite-number checks, and SHA-256 verification.
- Do not log raw page bodies, unbounded wikitext, headers, secrets, local environment values, or copied source descriptions.
- Never request or cache remote icon media URLs returned by `imageinfo`; store metadata only.
- Keep source snapshots, live outputs, candidate artifacts, and review work files ignored unless a future explicit ticket names exact paths and scope.

## Dependencies

- `EPIC-00` / `SPRINT-001` for repository shape, domain boundaries, synthetic fixtures, and `npm run verify`.
- `EPIC-01` / `SPRINT-002` for source policy, provenance, manual review, media restrictions, artifact retention, and QA gates.
- `EPIC-02` / `SPRINT-003` for MediaWiki API access, source snapshots, `mwparserfromhell`, metadata-only icon resolution, canonical artifact writing, QA reports, and regenerate modes.
- Existing prerequisites remain Node.js `>=22.11.0`, npm `>=11.10.1`, Python `>=3.11`, and the pinned data parser setup through `npm run data:setup`.
- Guild Wars Wiki availability is required for production promotion only; automated verification remains offline.
- Manual review capacity is required for primary-effect summaries, source contradictions, baseline creation, warning dispositions, and exact-path promotion.
- Downstream consumers are EPIC-04 Skills, EPIC-05 Template Compatibility, EPIC-06 Game Rule Engine, and EPIC-08 Core Build Editor.

## Open Questions

No open question blocks execution. Defaults for this sprint:

1. Primary-effect summaries ship only as original derived summaries with complete review evidence.
2. Exact promoted paths are the catalog JSON, adjacent manifest JSON, and bounded QA JSON named in Architecture.
3. A live refresh is required for production promotion, but never for `npm run verify`.
4. PvP, hero, rune, equipment, consumable, blessing, temporary-effect, campaign-progression, and actual quest-log behavior are deferred.
5. Campaign data records profession family and primary character-creation availability, not travel or secondary-profession unlock behavior.
6. Template compatibility is represented through crosswalk data and lookup helpers, not a full template encoder/decoder.
7. Raw snapshots remain ignored; source revision metadata and QA records document the replay limitation.
