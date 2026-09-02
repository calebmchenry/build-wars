---
id: SPRINT-012
title: Insignias Catalog
status: planned
source_target: BACKLOG
source_epic: EPIC-11
source_epic_path: work/tickets/11-insignias/EPIC.md
tickets:
  - BW-1101
  - BW-1102
  - BW-1103
  - BW-1104
  - BW-1105
  - BW-1106
created: 2026-09-02
---

# Sprint 012: Insignias Catalog

## Overview

This sprint turns `EPIC-11 Insignias` into a runtime-eligible insignia catalog
and a repeatable EPIC-11 ingestion profile. The output is not equipment UI. The
output is a framework-neutral insignia schema, a bounded source-set plan,
deterministic extraction and normalization, explicit slot-scaled effect data,
promoted generated artifacts under exact paths, and closeout documentation that
keeps runtime imports separate from audit and review artifacts.

The sequencing priority is to remove ambiguity before large fixture or catalog
churn happens. Execution should first prove the source shape and freeze the
catalog contract, then lock the source set and fixture corpus, then land raw
extraction, then normalize effects and slot scaling, then run promotion and QA
gates, and only after that update docs and traceability records. That order
keeps source-plan digests, finding IDs, effect unions, and output versions from
shifting late in the sprint.

The plan makes four defaults explicit. First, runtime identity stays anchored to
schema-owned `InsigniaId`; verified `templateModifierId` values are preserved as
crosswalk facts when available, but catalog completeness does not depend on
assuming template coverage before Phase 1 proves it. Second, slot-scaled
arithmetic is stored as explicit per-slot values, not as prose that downstream
callers must reinterpret. Third, conditional, combat-state, or non-stacking
behavior is structured only when the condition vocabulary is small, exact, and
testable; otherwise it stays `note-only` or `unknown`. Fourth, production
promotion requires a reviewed source-plan digest, one complete selected
snapshot-set manifest, deterministic offline replay, and exact-path allowlists.
If those production inputs cannot be qualified, fixture and offline
implementation may land, but the sprint stays blocked rather than weakening the
gate.

This sprint remains catalog and domain groundwork only. It must not add armor
selection UI, equipment editing behavior, saved-build schema changes, runtime
imports of manifests or QA reports, remote icon fetching, copied source-authored
long prose, backend storage, or a full stat calculator.

## Use Cases

1. A future equipment editor can list legal common and profession-specific
   insignias by profession and armor slot without reading wiki pages or Python
   tooling.
2. A future tooltip or stats surface can show deterministic per-slot health,
   energy, armor, or reduction values for one insignia without re-parsing prose
   or remembering Guild Wars armor-piece scaling rules.
3. A future equipment-template or modifier-resolution workflow can join a
   verified `templateModifierId` to a runtime insignia record when that source
   fact exists, while still surfacing records whose modifier mapping is absent
   or unresolved.
4. A maintainer can run bounded EPIC-11 discovery, review a source-plan digest,
   fetch only approved pages and metadata, and replay one selected snapshot set
   offline before promoting exact generated paths.
5. A reviewer can see explicit dispositions for unsupported, duplicate,
   redirected, malformed, or policy-limited insignia records instead of silent
   omission.
6. A downstream domain consumer can project one insignia's effects for `head`,
   `chest`, `hands`, `legs`, or `feet` without owning armor legality, stat
   aggregation, or combat-state evaluation.
7. A later validation epic can distinguish universal insignias from
   profession-specific insignias and preserve conditional or note-only behavior
   without pretending all effects are additive arithmetic.
8. A documentation reader can tell which insignia facts are ready now and which
   remain deferred to EPIC-13, EPIC-14, EPIC-20, and EPIC-21.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Runtime data | `InsigniaCatalog` JSON, compact provenance references, source-set summary, dependency digests, dispositions, metadata-only icon references, and narrow pure TS lookup or slot-projection helpers. | Runtime imports of manifests, QA JSON, source plans, snapshot-set manifests, raw snapshots, Python tooling, or wiki APIs. |
| Domain modeling | Stable insignia IDs, names, normalized lookup keys, availability, profession restriction, optional template modifier crosswalks, slot applicability, structured effects, and explicit slot-scaled values. | React/UI state, browser APIs, equipment ownership state, full stat totals, or combat simulation. |
| Ingestion profile | EPIC-11 fixture, offline, and manual live modes through the existing profile, pipeline, and CLI architecture with bounded caps. | An insignia-specific scraper outside `scripts/data/build_wars_ingest`, unbounded category crawls, browser automation, or live network use during `npm run verify`. |
| Semantic rules | Deterministic health, energy, armor, and reduction facts; explicit per-slot scaling; controlled conditional codes where source phrasing is exact; note-only and unknown states. | Armor legality resolution, rune interactions, title or allegiance effects, full equipment aggregation, or a generic combat rule engine. |
| Promotion | Exact-path promotion for the EPIC-11 catalog JSON, adjacent manifest, and machine-readable QA report, plus `.gitignore` allowlists. | Promotion of raw snapshots, source plans, QA summaries, icon bytes, screenshots, copied page bodies, or ad hoc review scratch files. |
| Closeout | Docs, compendium notes, ticket status sync, ledger sync, and ticket-burn manifest updates. | Commit creation or unrelated implementation cleanup. |

### Source Authority

Phase 1 begins with a source-shape checkpoint before the effect union and live
profile behavior are treated as frozen. The starting authority is:

- `Insignia` for the bounded insignia inventory and broad insignia mechanics.
- `Equipment template format` for modifier-name and template-ID cross-checks
  where that authority is present and reviewable.
- Verified insignia detail pages for canonical page identity, redirects,
  restriction facts, slot applicability, effect text, and icon candidates.
- Metadata-only icon `imageinfo` records.
- The promoted EPIC-03 professions and attributes catalog for all
  `ProfessionId` and any attribute-linked joins.

Profession pages or other bounded verification pages may be admitted only if the
checkpoint proves the four sources above cannot represent profession-specific
availability or restriction facts cleanly. Category crawl, site search,
community pages, arbitrary recursive links, source-provided fetch URLs, and
runtime wiki access are excluded.

Every insignia candidate discovered from seed authority must become one of:

- accepted catalog record
- same-page or same-family supported relationship
- explicit non-player or non-insignia exclusion
- unsupported disposition
- blocking finding

Duplicate names, missing detail pages, missing restrictions, ambiguous family
membership, missing icon metadata, malformed effect text, and unresolved
template-ID relationships are not silently dropped.

### Data Flow

```text
promoted EPIC-03 catalog + manifest + passing QA
                          |
bounded EPIC-11 source-shape checkpoint
                          |
source-plan digest and review
                          |
digest-confirmed seed/detail/icon metadata fetch
                          |
complete SourceSnapshotSetManifest
                          |
selected offline replay, no network
                          |
raw insignia extraction and EPIC-03 joins
                          |
effect normalization and slot-value expansion
                          |
InsigniaCatalog semantic JSON
                          |
GeneratedArtifactManifest + bounded QaReport
                          |
first-baseline review and exact-path promotion
```

Fixture mode stays synthetic and network-free. Live discovery and fetch remain
manual-only and bounded. Offline replay requires one complete selected
snapshot-set manifest and rejects partial, duplicate, mixed-profile, extra,
missing, edited, path-escaping, or digest-mismatched inputs before extraction
begins.

### Runtime Contract

`src/domain/catalog.ts` should extend the existing catalog vocabulary rather
than introduce an app-specific parallel schema. The expected runtime envelope is
close to EPIC-04 and EPIC-10:

```text
InsigniaCatalog
  schemaVersion: 1
  catalogVersion: semantic digest
  sectionDigests: CatalogSectionDigest[]
  generatedAt: ISO timestamp
  generator: pinned generator identity
  profile: InsigniaCatalogProfile
  dependencyDigests: [EPIC-03 dependency summary]
  sourceSet: compact source-set summary
  dispositions: compact runtime-relevant dispositions
  insignias: CatalogInsigniaRecord[]
  remoteMedia: RemoteMediaMetadata[]

CatalogInsigniaRecord
  id: InsigniaId
  templateModifierId: TemplateEquipmentModifierId | null
  name: canonical display name
  normalizedName: collision-safe lookup key
  wikiUrl: canonical HTTPS URL
  pageIdentity: requested/normalized/canonical title and page/revision facts
  familyKey: stable schema-owned family key
  availability: universal-armor | profession-armor | unknown
  professionId: ProfessionId | null
  affectedAttributeId: AttributeId | null
  applicableSlots: readonly ArmorSlot[]
  effects: non-empty InsigniaEffect[]
  displayState: structured-only | reviewed-short-text | excluded
  iconId: string | null
  provenance: compact field provenance
```

Exact TypeScript names may adjust to local style, but these distinctions are
acceptance requirements. The existing lightweight `Insignia` interface should
either remain as a small compatibility view or be expanded compatibly beside the
generated-catalog record type.

The runtime catalog may keep compact `sourceSet` and `dispositions`, matching
the established catalog pattern. Full source plans, snapshot manifests, review
records, QA finding evidence, local paths, and raw page bodies stay in the
manifest or QA report only.

### Effect Model And Slot Scaling

The effect model needs to preserve deterministic arithmetic separately from
restricted or unresolved behavior. Supported v1 effect kinds are:

| Effect kind | Required fields | V1 behavior |
| --- | --- | --- |
| `maximum-health-delta` | signed integer amount or explicit per-slot values, optional bounded condition code, provenance | Structured when fixed or slot-scaled arithmetic is source-clear. |
| `maximum-energy-delta` | signed integer amount or explicit per-slot values, optional bounded condition code, provenance | Structured when exact values are deterministic. |
| `armor-delta` | signed integer amount or explicit per-slot values, supported scope, optional bounded condition code, provenance | Structured for clear armor bonuses such as universal or conditional armor gains. |
| `damage-reduction` | signed integer or percentage, supported damage scope, optional bounded condition code, provenance | Structured only when scope and value are unambiguous. |
| `note-only` | stable note code, bounded reviewed text, provenance | No arithmetic. Used for conditional or non-stacking behavior that should remain visible. |
| `unknown` | stable source-field reference, bounded reason, provenance | No arithmetic. Used when a record is accepted but a safe structured model is not yet proven. |

Slot scaling must not be implicit. If an effect changes by armor piece, the
runtime record stores the explicit values for `head`, `chest`, `hands`, `legs`,
and `feet`. The catalog does not rely on downstream callers remembering
Guild Wars armor scaling from prose.

Condition codes should stay narrow and code-owned. Only exact, repeatable source
phrases should become structured conditions. Any phrase that needs natural
language interpretation, game-engine timing assumptions, or cross-system
composition should remain `note-only` or `unknown` and surface through QA.

### Helper Boundary

Add narrow pure helpers only where direct record consumption becomes repetitive.
The preferred helper boundary is:

```text
resolveInsigniaEffectsForSlot(record, slot)
```

It accepts one `CatalogInsigniaRecord` and one `ArmorSlot`, then returns:

- slot-resolved structured numeric effects for that slot
- unchanged `note-only` and `unknown` effects
- typed unresolved reasons when the record is malformed for the requested slot

It does not choose legal professions, aggregate multiple insignias, apply rune
or title interactions, calculate full stats, or read external files. The
acceptance tests should prove that the same slot-scaled insignia projects
different deterministic values for `head`, `chest`, and `feet` while preserving
identical note-only effects across slots.

## Implementation

### Execution Bookkeeping

- [ ] Confirm `SPRINT-011` is complete in `work/sprints/ledger.tsv` and
      `SPRINT-012` is the next sprint ID before implementation begins.
- [ ] Create or update `work/sprints/SPRINT-012.md` before execution and keep
      its frontmatter aligned with `source_target: BACKLOG`,
      `source_epic: EPIC-11`, and tickets `BW-1101` through `BW-1106`.
- [ ] Move `EPIC-11` and the active BW ticket to `in-progress` as work starts,
      then to `done` only after the relevant phase gate and final verification
      pass.
- [ ] Keep `work/tickets/11-insignias/*.md`, `work/sprints/ledger.tsv`, and
      `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-11-result.json`
      consistent with the final execution state.
- [ ] Do not modify unrelated implementation areas and do not create a commit
      unless separately requested.

### Phase 1: BW-1101 Source Shape, Contracts, And Profile (~15% of effort)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `test/domain/insignia-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`

**Tasks:**

- [ ] Run the EPIC-11 source-shape checkpoint against the planned seed pages
      before freezing the effect union or modifier-ID policy.
- [ ] Define the runtime `InsigniaCatalog` envelope, insignia record shape,
      source-set summary, disposition types, and effect unions in
      `src/domain/catalog.ts`.
- [ ] Keep `InsigniaId` branded-ID ownership in `src/domain/ids.ts`; do not
      introduce framework, browser, app, or script imports into `src/domain`.
- [ ] Decide whether `templateModifierId` is required, optional, or disallowed
      for specific accepted record classes, and encode that policy explicitly in
      the contract and QA expectations.
- [ ] Add pure lookup helpers only where downstream tests justify them; prefer
      collision-safe ID and normalized-name helpers over app-specific selectors.
- [ ] Register an `epic-11-insignias` profile with exact promoted artifact
      paths, fixture artifact path, bounded page and byte caps, and explicit
      manual live-mode expectations.
- [ ] Wire EPIC-11 through the shared pipeline and CLI entry points so fixture,
      offline, and live modes share one execution surface.
- [ ] Make EPIC-03 dependency loading a first-class requirement for profession
      restrictions and any attribute-linked joins.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/insignia-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_profiles.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_pipeline.py'`

**Phase Acceptance:**

The source authority is proven finite enough to proceed, the EPIC-11 profile is
registered without regressing existing profiles, and the runtime wire contract
is stable enough for fixture and extractor work to start.

### Phase 2: BW-1102 Source Set, Page Resolution, And Fixtures (~18% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_source_set.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `test/fixtures/data-ingestion/insignias/**`

**Tasks:**

- [ ] Implement deterministic EPIC-11 source-set planning from the bounded seed
      authority, including source-plan digest generation and drift checks.
- [ ] Resolve common versus profession-specific insignias, redirects, duplicate
      names, same-page variant relationships, missing detail pages, missing
      restrictions, missing modifier IDs, and missing icon metadata as explicit
      source-set outcomes.
- [ ] Preserve PvE/PvP availability differences only when the chosen authority
      contains source-clear evidence; otherwise record a neutral or unknown
      state instead of inferring it.
- [ ] Add minimized synthetic fixtures for universal insignias,
      profession-specific insignias, slot-scaled effects, conditional effects,
      duplicate source names, missing icons, malformed source shapes, and
      unsupported records.
- [ ] Keep fixture mode fully offline and synthetic; live discovery must stop
      after writing a reviewable source plan and must not fetch detail pages
      until the digest is confirmed.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_insignia_source_set.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_cli.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_pipeline.py'`

**Phase Acceptance:**

The EPIC-11 source set is digest-bound, replayable, and fully represented by a
small synthetic fixture corpus before extractor behavior is finalized.

### Phase 3: BW-1103 Insignia Extraction And Raw Joins (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_extractor.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/template_ids.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `scripts/data/build_wars_ingest/tests/test_template_ids.py`

**Tasks:**

- [ ] Parse canonical insignia identity, normalized names, profession
      restrictions, availability, slot applicability, page identity, icon
      candidates, and raw effect fields from accepted source pages.
- [ ] Join EPIC-03 profession and attribute facts through catalog IDs rather
      than string-only runtime links.
- [ ] Capture verified `templateModifierId` evidence when present and preserve
      absence or ambiguity as explicit typed diagnostics instead of inferred
      numeric matches.
- [ ] Preserve unsupported effect text, malformed source fields, duplicate
      source names, and icon gaps as stable findings or dispositions rather than
      dropping them.
- [ ] Keep raw extracted ordering deterministic and independent of API response,
      filesystem enumeration, or fetch batch ordering.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_insignia_extractor.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_icons.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_template_ids.py'`

**Phase Acceptance:**

Every accepted fixture record resolves to deterministic raw identity and effect
facts or to an explicit QA disposition, with enough preserved evidence for the
semantic phase to stay pure and non-lossy.

### Phase 4: BW-1104 Effect Semantics, Slot Scaling, And Pure Helpers (~18% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_semantics.py`
- `scripts/data/build_wars_ingest/insignia_catalog.py`
- `src/domain/insignia-effects.ts`
- `src/domain/catalog.ts`
- `src/domain/index.ts`
- `test/domain/insignia-effects.test.ts`
- `test/domain/insignia-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/tests/test_insignia_semantics.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_catalog.py`
- `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json`

**Tasks:**

- [ ] Normalize raw effect fields into structured health, energy, armor,
      reduction, `note-only`, and `unknown` effects.
- [ ] Materialize explicit slot values for `head`, `chest`, `hands`, `legs`,
      and `feet` wherever source-backed scaling exists.
- [ ] Keep conditional and combat-state semantics conservative: only bounded,
      exact condition phrases become structured condition codes; other behavior
      stays `note-only` or `unknown`.
- [ ] Add a narrow `resolveInsigniaEffectsForSlot` helper in `src/domain` for
      later equipment and tooltip work without aggregating multiple records or
      calculating full stats.
- [ ] Add TypeScript fixtures that prove deterministic slot expansion,
      profession restrictions, crosswalk preservation, malformed-record
      handling, and note-only behavior.
- [ ] Generate and validate a synthetic golden EPIC-11 fixture catalog in
      `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json`.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/insignia-catalog.test.ts test/domain/insignia-effects.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_insignia_semantics.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_insignia_catalog.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-11-insignias --root .`

**Phase Acceptance:**

The runtime catalog can represent deterministic slot-scaled effects without a
full stat calculator, and the TypeScript and Python contracts agree on one
stable synthetic EPIC-11 output shape.

### Phase 5: BW-1105 Assembly, QA, Review, And Exact-Path Promotion (~19% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_catalog.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `.gitignore`
- `data/generated/epic-11/insignias.catalog.json`
- `data/generated/epic-11/insignias.catalog.manifest.json`
- `data/qa/epic-11/insignias.catalog.qa.json`
- `scripts/data/build_wars_ingest/tests/test_insignia_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`

**Tasks:**

- [ ] Assemble canonical EPIC-11 output with stable ordering, section digests,
      semantic `catalogVersion`, dependency digests, compact source-set summary,
      and runtime-relevant dispositions.
- [ ] Emit the adjacent manifest with source-plan path and digest, selected
      snapshot-set path and digest, child snapshot manifests, artifact digests,
      review records, and commit decision metadata.
- [ ] Extend QA to cover source accounting, duplicate IDs, duplicate names,
      missing restrictions, missing icon metadata, missing revision facts,
      copied-text risk, malformed effects, slot-scaling gaps, unresolved
      template crosswalks, and artifact integrity mismatches.
- [ ] Add exact `.gitignore` allowlist entries only for the approved EPIC-11
      catalog, manifest, and QA JSON paths plus required parent-directory rules.
- [ ] Run fixed-clock fixture regeneration twice and confirm byte-identical
      catalog, manifest, QA report, section digests, and finding IDs.
- [ ] Run offline replay from one selected complete EPIC-11 snapshot-set
      manifest and confirm exact reproduction of the promoted artifacts.
- [ ] Run bounded live discovery and fetch only if source and reviewer
      conditions are available; if not, leave the sprint blocked after
      documenting the missing production gate.

**Verification:**

- `npm run test:run -- test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_insignia_catalog.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_qa.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest discover -s scripts/data/build_wars_ingest/tests -p 'test_pipeline.py'`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-11-insignias --root .`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-11-insignias --root . --snapshot-set work/runs/data-ingestion/epic-11/snapshot-sets/<selected>.snapshot-set.json`
- `git check-ignore -v data/generated/epic-11/insignias.catalog.json data/generated/epic-11/insignias.catalog.manifest.json data/qa/epic-11/insignias.catalog.qa.json`

**Phase Acceptance:**

The only promoted EPIC-11 paths are the exact catalog, manifest, and QA JSON
files, QA gates pass for runtime consumption, and the sprint is marked blocked
instead of weakening promotion requirements when source review or live inputs
remain unavailable.

### Phase 6: BW-1106 Runtime Docs, Verification, And Closeout (~10% of effort)

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `data/source-snapshots/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/insignias-catalog.md`
- `compendium/README.md`
- `work/tickets/11-insignias/*.md`
- `work/sprints/SPRINT-012.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-11-result.json`

**Tasks:**

- [ ] Document EPIC-11 regenerate commands, exact promoted paths, runtime import
      boundaries, source authority, review gates, and retention limits.
- [ ] Create `compendium/insignias-catalog.md` describing the schema,
      slot-scaling model, conditional-note policy, template crosswalk policy,
      QA gates, and downstream handoffs.
- [ ] Record how EPIC-13, EPIC-14, EPIC-20, and EPIC-21 should consume or defer
      insignia facts without importing manifests, QA reports, or raw snapshots.
- [ ] Confirm current app editor behavior, local persistence, sharing, rune
      behavior, and template compatibility remain unchanged.
- [ ] Sync ticket, epic, sprint, ledger, and manifest statuses only after all
      required phase gates pass.

**Verification:**

- `npm run verify`

**Phase Acceptance:**

Docs, promoted artifacts, tickets, sprint state, and ledger status all agree on
the final EPIC-11 outcome, and the repository passes the canonical offline
verification command.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Add the `InsigniaCatalog` runtime contract, effect unions, source-set summary, disposition, and dependency summary types. |
| `src/domain/catalog-lookup.ts` | Modify | Add collision-safe insignia lookup helpers where downstream callers need them. |
| `src/domain/insignia-effects.ts` | Create | Hold narrow pure slot-resolution helpers for later equipment and tooltip work. |
| `src/domain/index.ts` | Modify | Export insignia catalog and helper APIs. |
| `src/domain/ids.ts` | Reference only | Reuse existing `InsigniaId` and `TemplateEquipmentModifierId` branded IDs. |
| `src/domain/equipment.ts` | Reference only | Preserve `ArmorPiece.insigniaId` and `ArmorSlot` as downstream attachment points. |
| `scripts/data/build_wars_ingest/config.py` | Modify | Add EPIC-11-specific bounded caps only where current defaults are too broad. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register the `epic-11-insignias` profile, output paths, and source limits. |
| `scripts/data/build_wars_ingest/insignia_source_set.py` | Create | Implement source-plan building, drift checks, and snapshot-set validation. |
| `scripts/data/build_wars_ingest/insignia_extractor.py` | Create | Parse insignia identity, restriction, slot, raw effect, modifier, and icon facts. |
| `scripts/data/build_wars_ingest/insignia_semantics.py` | Create | Convert raw fields into typed effects and explicit slot-scaled values. |
| `scripts/data/build_wars_ingest/insignia_catalog.py` | Create | Assemble canonical output, semantic version, section digests, and QA-facing diagnostics. |
| `scripts/data/build_wars_ingest/template_ids.py` | Modify only if needed | Reuse shared modifier-ID parsing without inventing new ID rules. |
| `scripts/data/build_wars_ingest/icons.py` | Modify | Resolve metadata-only insignia icon records. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Support EPIC-11 artifact paths, digests, baselines, and promotion metadata. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add insignia-specific QA rules in the shared QA format. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate EPIC-11 fixture, discover, fetch, offline replay, and promotion. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Expose safe EPIC-11 profile, stage, confirmation, and replay options. |
| `scripts/data/build_wars_ingest/tests/test_profiles.py` | Modify | Prove profile registration and path or cap invariants. |
| `scripts/data/build_wars_ingest/tests/test_cli.py` | Modify | Cover EPIC-11 CLI routing and option handling. |
| `scripts/data/build_wars_ingest/tests/test_pipeline.py` | Modify | Cover EPIC-11 fixture and offline pipeline behavior. |
| `scripts/data/build_wars_ingest/tests/test_insignia_source_set.py` | Create | Cover source planning, digest binding, and replay preconditions. |
| `scripts/data/build_wars_ingest/tests/test_insignia_extractor.py` | Create | Cover extraction of names, restrictions, slots, modifiers, effects, and icons. |
| `scripts/data/build_wars_ingest/tests/test_insignia_semantics.py` | Create | Cover effect normalization, slot scaling, and condition or note policy. |
| `scripts/data/build_wars_ingest/tests/test_insignia_catalog.py` | Create | Cover catalog assembly, section digests, and semantic version behavior. |
| `test/domain/insignia-catalog.test.ts` | Create | Verify the runtime insignia wire contract and lookup behavior. |
| `test/domain/insignia-effects.test.ts` | Create | Verify slot projection, scaling, note-only preservation, and malformed-record handling. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Assert the Python-generated EPIC-11 fixture matches the TypeScript contract. |
| `test/fixtures/data-ingestion/insignias/**` | Create | Hold synthetic insignia source fixtures for source-set and extraction tests. |
| `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json` | Create | Track the synthetic golden runtime insignia catalog fixture. |
| `.gitignore` | Modify | Add exact EPIC-11 allowlists while keeping non-runtime artifacts ignored. |
| `data/generated/epic-11/insignias.catalog.json` | Create | Promote the runtime-eligible EPIC-11 catalog. |
| `data/generated/epic-11/insignias.catalog.manifest.json` | Create | Promote the adjacent EPIC-11 audit manifest. |
| `data/qa/epic-11/insignias.catalog.qa.json` | Create | Promote the machine-readable EPIC-11 QA report. |
| `README.md` | Modify | Document EPIC-11 scope and verification expectations. |
| `scripts/data/README.md` | Modify | Document EPIC-11 fixture, offline, and live commands. |
| `data/**/README.md` | Modify | Record EPIC-11 artifact policy, runtime boundaries, and retention rules. |
| `compendium/data-ingestion-platform.md` | Modify | Extend the shared platform docs with the EPIC-11 profile and replay flow. |
| `compendium/insignias-catalog.md` | Create | Durable implementation and handoff note for the insignia catalog. |
| `compendium/README.md` | Modify | Index the new insignias catalog compendium note. |
| `work/tickets/11-insignias/*.md` | Modify | Keep ticket status, acceptance, and closeout records aligned. |
| `work/sprints/SPRINT-012.md` | Create/Modify | Final execution record for the sprint. |
| `work/sprints/ledger.tsv` | Modify | Mark sprint state consistently with ticket-burn records. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-11-result.json` | Modify | Keep the ticket-burn result manifest synchronized with the final sprint outcome. |

## Definition of Done

### Source And Identity Gates

- [ ] The final EPIC-11 source authority is finite, documented, digest-bound,
      and approved before detail fetch or promotion.
- [ ] Every insignia candidate becomes an accepted catalog record, supported
      relationship, explicit exclusion, unsupported disposition, or blocking
      finding.
- [ ] Redirects, duplicate source names, duplicate canonical pages, missing
      pages, malformed pages, missing restrictions, missing icons, unresolved
      modifier IDs, and source drift are resolved or blocking.
- [ ] Stable `InsigniaId` assignment is source-order-independent,
      collision-checked, and guarded by generated-data diff review.
- [ ] Existing EPIC-02, EPIC-03, EPIC-04, and EPIC-10 profiles, outputs, CLI
      behavior, and tests remain compatible.

### Contract And Runtime Gates

- [ ] `InsigniaCatalog` is framework-neutral, JSON-compatible, schema-versioned,
      and exported through `src/domain`.
- [ ] `src/domain` imports no React, DOM or browser APIs, browser storage,
      network clients, app modules, generated manifests, QA reports, source
      snapshots, filesystem APIs, or Python modules.
- [ ] Insignia records include stable ID, canonical name, normalized key,
      wiki URL, page identity, family, availability, profession restriction,
      slot applicability, non-empty structured effects, nullable icon ID, and
      compact provenance.
- [ ] `templateModifierId` policy is explicit: required, optional, or forbidden
      states are encoded in contract and QA behavior rather than assumed by
      numeric coincidence.
- [ ] Profession and any attribute-linked joins resolve through EPIC-03 catalog
      facts and dependency digests.
- [ ] Runtime catalog JSON excludes raw page bodies, source plans, local paths,
      full QA bodies, review scratch evidence, copied long prose, MediaWiki
      HTML, icon bytes, screenshots, thumbnails, and source-provided commands.

### Effect And Scaling Gates

- [ ] Health, energy, armor, damage-reduction, `note-only`, and `unknown`
      effects are distinct typed states.
- [ ] Slot-scaled arithmetic is explicit for `head`, `chest`, `hands`, `legs`,
      and `feet`; downstream callers do not need prose-derived scaling rules.
- [ ] Controlled condition codes are used only for source-clear phrases with
      exact test coverage; ambiguous conditional behavior remains visible through
      `note-only`, `unknown`, and QA findings.
- [ ] TypeScript fixtures prove the same insignia can project different slot
      values while preserving the same note-only or unknown effects.
- [ ] Pure helpers do not become a full equipment or stat calculator.

### Determinism, QA, And Promotion Gates

- [ ] Fixture mode is synthetic and network-free.
- [ ] Live fetch requires `--allow-live-network`, the registered
      `epic-11-insignias` profile, exact source-plan path, exact source-set
      digest confirmation, and the fixed Guild Wars Wiki API origin.
- [ ] Offline replay requires one complete EPIC-11
      `SourceSnapshotSetManifest` and rejects partial, missing, extra,
      duplicate, mixed-profile, digest-mismatched, or path-escaping inputs.
- [ ] Canonical output is stable under input ordering, API response ordering,
      filesystem ordering, batch boundaries, and concurrent completion.
- [ ] Repeated fixed-clock fixture generation is byte-identical for the EPIC-11
      catalog, manifest, QA report, section digests, source ordering, and
      finding IDs.
- [ ] Selected production snapshot replay is byte-identical across two
      fixed-clock offline runs for all promoted EPIC-11 artifacts.
- [ ] Semantic section digests and `catalogVersion` change for every
      consumer-visible mutation and remain stable for retrieval timestamp, local
      path, manifest path, QA path, and version-field changes.
- [ ] QA covers source accounting, expected coverage, stable IDs, referential
      integrity, page resolution, EPIC-03 joins, slot applicability, effect
      semantics, slot scaling, modifier crosswalk policy, icon metadata,
      provenance, copied-text policy, schema shape, output caps, baselines, and
      artifact integrity.
- [ ] QA overflow or material truncation is blocking.
- [ ] `data/generated/epic-11/insignias.catalog.json`,
      `data/generated/epic-11/insignias.catalog.manifest.json`, and
      `data/qa/epic-11/insignias.catalog.qa.json` are the only promoted EPIC-11
      exact paths.
- [ ] `appConsumptionGate` and `publicReleaseGate` are `pass`, or the sprint
      remains blocked with the reason recorded.
- [ ] `git check-ignore -v` proves promoted paths are trackable and
      representative raw or candidate byproducts remain ignored.

### Closeout Gates

- [ ] Documentation explains exact paths and commands, source policy, runtime
      boundaries, slot-scaling policy, condition-note policy, modifier
      crosswalk policy, and handoffs to EPIC-13, EPIC-14, EPIC-20, and EPIC-21.
- [ ] `src/app/catalogs.ts`, editor behavior, local persistence and sharing,
      rune behavior, template compatibility, and current promoted catalogs
      remain unchanged unless a documented blocker forces a separate amendment.
- [ ] `npm run verify` passes without live network access.
- [ ] README, data docs, script docs, compendium, generated files, QA state,
      tickets, sprint, ledger, and result manifests agree on IDs, paths,
      commands, versions, review scope, assumptions, limitations, and status.
- [ ] BW-1101 through BW-1106, EPIC-11, SPRINT-012, and `work/sprints/ledger.tsv`
      are marked complete only after all gates pass.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The bounded source authority does not fully cover profession-specific or conditional insignias | Medium | High | Make the source-shape checkpoint the first gate and block for amendment instead of widening the source graph silently |
| Modifier-ID coverage is incomplete or inconsistent across accepted insignias | Medium | High | Keep `InsigniaId` schema-owned, preserve `templateModifierId` as explicit evidence, and make the QA and downstream handoff policy explicit |
| Slot scaling is over-inferred from prose and later disagrees with game expectations | Medium | High | Require explicit per-slot values backed by source evidence and prove them with synthetic and replay fixtures |
| Conditional or non-stacking effects are forced into unsafe arithmetic | High | High | Allow structured conditions only for bounded exact phrases; keep the rest as `note-only` or `unknown` with QA visibility |
| Shared ingestion refactors regress EPIC-10 or earlier profiles | Medium | High | Reuse the shared pipeline narrowly, keep new helpers EPIC-11-specific where equivalence is not trivial, and rerun profile and pipeline tests |
| Source-authored prose leaks into runtime artifacts through extraction shortcuts | Medium | High | Restrict runtime schema to structured effects and reviewed short factual notes only, with QA checks for copied-text risk |
| Exact-path allowlists expose non-runtime artifacts | Low | High | Update `.gitignore`, promoted paths, and docs together, then verify approved versus ignored paths explicitly |
| Live discovery or reviewer bandwidth is unavailable during promotion | Medium | Medium | Allow fixture and offline implementation to land, but keep BW-1105 and the sprint blocked until production review gates pass |
| Future consumers depend on helper behavior that is too narrow or too broad | Medium | Medium | Keep the helper slot-local and pure, and document that aggregation, legality, and totals remain deferred |

## Security

- Treat source titles, redirects, page bodies, icon metadata, source plans,
  snapshot manifests, generated catalogs, QA evidence, baselines, and review
  notes as untrusted input.
- Permit network access only in explicit live mode with
  `--allow-live-network`, the registered profile, GET-only JSON requests, the
  fixed Guild Wars Wiki API origin, finite timeouts, retry caps, continuation
  caps, and response or request byte caps.
- Reject arbitrary endpoints, source-provided fetch URLs, final redirects
  outside the configured API origin, recursive crawls, credentials, cookies,
  tokens, and environment secrets.
- Parse wiki content as inert data. Never execute templates, Lua, HTML,
  JavaScript, CSS, links, shell snippets, or source-provided commands.
- Store insignia display data as structured facts or reviewed plain text only.
  Runtime UI must escape text and must not inject source text into `innerHTML`.
- Bound accepted pages, title lengths, parser bytes, numeric ranges, effect
  counts, evidence excerpts, output bytes, and QA findings.
- Preserve path confinement, safe slugs, symlink-escape checks where practical,
  atomic writes, finite-number checks, stable ordering, and SHA-256
  verification.
- Do not use source titles, insignia names, or IDs directly as filesystem
  paths.
- Do not log or promote raw page bodies, response headers, absolute machine
  paths, local environment values, copied descriptions, or media bytes.
- Query icon metadata only and keep every runtime media record
  `cachedBytes: false`.
- Keep raw snapshots, source plans, snapshot-set manifests, candidate
  artifacts, QA summaries, logs, review scratch files, thumbnails, screenshots,
  and icon binaries ignored or absent.

## Dependencies

- `EPIC-01` / `SPRINT-002` for source policy, provenance, manual review, media
  restrictions, QA gates, exact-path promotion, and artifact retention rules.
- `EPIC-02` / `SPRINT-003` for the MediaWiki client, verified snapshots,
  `mwparserfromhell`, metadata-only icon resolution, canonical artifact writing,
  fixture, offline, and live modes, and QA report format.
- `EPIC-03` / `SPRINT-004` for promoted profession and attribute IDs, template
  crosswalk conventions, section digests, artifact or manifest digests, and
  passing QA gates.
- `EPIC-04` / `SPRINT-005` for the closest precedent on source-set planning,
  selected offline replay, section digests, semantic catalog versioning,
  compact runtime dispositions, and exact-path allowlisting.
- `EPIC-10` / `SPRINT-011` for the closest armor-upgrade catalog precedent,
  especially metadata-only icons, promoted manifest structure, and blocked
  promotion semantics when source review gates fail.
- `BW-1101` must complete before `BW-1102`, `BW-1103`, and `BW-1104` can
  finalize because the contract and profile define the schema and pipeline
  surface they depend on.
- `BW-1102` must complete before `BW-1103` and `BW-1105` because extraction and
  promotion depend on a locked source set and replay contract.
- `BW-1103` must complete before `BW-1104` and `BW-1105` because semantic
  normalization and QA need stable raw extracted fields.
- `BW-1104` must complete before `BW-1105` because promotion needs the final
  runtime effect model and slot-scaling contract.
- `BW-1105` must complete before `BW-1106` because docs and closeout should
  describe only the final promoted artifact set and verified boundaries.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and `npm run data:setup`
  remain required for full repository verification.
- Guild Wars Wiki availability is required for production discovery and fetch
  only. Fixture generation, tests, build, and `npm run verify` remain offline.
- Maintainer review capacity is required for source-plan digest approval,
  source-policy dispositions, warning dispositions, first-baseline review, and
  any copied-text exception.

## Open Questions

No open question blocks non-interactive execution. Use these defaults unless a
phase gate disproves them:

1. The bounded source authority above is sufficient. If it is not, block for a
   recorded amendment rather than adding crawl behavior.
2. `InsigniaId` remains the public runtime identity even if some accepted
   records lack verified template modifier crosswalks.
3. Slot-scaled values belong directly in the runtime record, not in downstream
   prose or inferred formulas.
4. Only source-clear conditional phrases become structured condition codes; the
   rest remain visible through `note-only` or `unknown`.
5. `src/app` remains unchanged; catalog consumption is deferred until a later
   equipment or stats epic needs it.
6. If production live acquisition or review cannot complete, leave BW-1105 and
   the sprint blocked after fixture and offline implementation rather than
   promoting fixture-only data.
