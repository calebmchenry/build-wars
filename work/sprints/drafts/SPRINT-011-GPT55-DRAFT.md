---
id: SPRINT-011
title: Runes Catalog
status: draft
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
updated: 2026-09-02
---

# Sprint 011: Runes Catalog

## Overview

This sprint turns `EPIC-10 Runes` into a runtime-eligible, framework-neutral rune catalog for Build
Wars. The catalog covers player-usable armor runes, including profession attribute runes, common
health and energy runes, rank variants, restrictions, source references, metadata-only icons,
structured effects, stackability facts, QA dispositions, section digests, and semantic catalog
versioning.

This is a content, ingestion, and domain-contract sprint. It does not build armor editing UI,
equipment template semantic import, armor shell cataloging, headgear selection, full stat
calculation, combat simulation, title-rank controls, remote icon fetching, backend storage, guide
authoring, party builds, or runtime wiki access. Current app behavior for the single-character skill
editor, local library, sharing, and backup/restore must remain unchanged.

The sprint extends the existing EPIC-02 ingestion platform and the EPIC-03/EPIC-04 catalog pattern.
`src/domain` owns plain-data contracts and pure helpers only. `scripts/data/build_wars_ingest`
owns source discovery, snapshot replay, extraction, semantic normalization, QA, and deterministic
artifact writing. Runtime app code may consume a promoted rune catalog only through
`src/app/catalogs.ts`, but this sprint should document that downstream boundary rather than wiring
runes into the current UI.

The main architectural ambiguity is source authority. Guild Wars Wiki has candidate source pages
such as [`Rune`](https://wiki.guildwars.com/wiki/Rune),
[`Category:Runes`](https://wiki.guildwars.com/wiki/Category:Runes),
[`Rune of Vitae`](https://wiki.guildwars.com/wiki/Rune_of_Vitae),
[`Rune of Attunement`](https://wiki.guildwars.com/wiki/Rune_of_Attunement), and individual
profession-attribute rune pages such as
[`Rune of Restoration Magic`](https://wiki.guildwars.com/wiki/Rune_of_Restoration_Magic). The
implementation must not assume that any one page is complete until a bounded source-shape checkpoint
proves coverage. If the source graph cannot be made deterministic and reviewable, the sprint blocks
for amendment instead of broadening into an unbounded crawl.

Production promotion is mandatory for sprint completion. Fixture and offline work can land before
live source access is available, but `SPRINT-011` must not be marked complete until the selected
source set, offline replay, QA gates, exact-path allowlisting, documentation, tickets, ledger, and
ticket-burn result manifest agree.

## Use Cases

1. **Offer legal rune choices later**: EPIC-14 can list rune records by profession restriction,
   affected attribute, family, rank, and supported armor-upgrade scope without reading source
   snapshots or QA reports.
2. **Apply attribute rune rules later**: EPIC-21 or rule-engine work can apply the highest verified
   attribute bonus per affected attribute while still counting every verified health penalty from
   equipped runes.
3. **Represent common rune families**: Vigor, Vitae, Attunement, Restoration, and similar
   non-attribute families have explicit effect families and stackability facts where verified,
   with ambiguous behavior preserved as typed notes.
4. **Render tooltips later**: Runtime UI can render names, short reviewed display text or structured
   effect summaries, restrictions, rank, icon placeholder metadata, and source links from the
   promoted catalog only.
5. **Carry headgear handoff facts**: The catalog can record source-backed headgear interaction notes
   needed by EPIC-13 and EPIC-14 without owning armor shell records or headgear UI behavior.
6. **Audit source-derived data**: Reviewers can trace every accepted rune, disposition, effect,
   icon metadata record, and warning to source references, revision facts, artifact digests, QA
   findings, and review decisions.
7. **Refresh deliberately**: Maintainers can discover the rune source set, review the digest and
   counts, fetch detail pages only after digest confirmation, replay selected snapshots offline, and
   promote only deterministic artifacts.
8. **Close ticket-burn cleanly**: The run can update BW-1001 through BW-1006, EPIC-10,
   `SPRINT-011`, `work/sprints/ledger.tsv`, and
   `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-10-result.json` with one consistent
   execution record.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Domain contracts | `RuneCatalog`, rune records, source-set summaries, dispositions, effect variants, stack groups, dependency summaries, metadata-only media refs, and pure lookup/effect summary helpers. | React state, DOM/browser APIs, storage, network clients, generated manifests, QA report imports, source snapshots, or data-script imports. |
| Ingestion | EPIC-10 profile, source-shape checkpoint, digest-bound source planning, bounded live fetch, selected offline replay, rune extraction, semantic normalization, QA, and deterministic artifact writing. | One-off rune scraper, arbitrary source URLs, recursive category crawl, browser automation, runtime fetches, or live network during `npm run verify`. |
| Runtime data | `data/generated/epic-10/runes.catalog.json`, adjacent manifest, bounded QA JSON, and minimized synthetic fixtures. | Raw page bodies, source plans, snapshot-set manifests, candidate outputs, QA summaries, review scratch files, icon binaries, screenshots, or copied long prose. |
| Rune semantics | Attribute bonuses, health penalties, health bonuses, energy bonuses, verified stackability, unsupported effect states, and headgear handoff notes. | Full equipment validation, armor-piece availability, armor ratings, insignias, weapon mods, title ranks, total health/energy calculators, or combat math. |
| App integration | Documentation that future app consumers must import through `src/app/catalogs.ts` and keep attribution/privacy boundaries. | Adding rune picker UI, equipment editor controls, local-library equipment persistence, share-url equipment payloads, or remote icon display. |
| Closeout | README, data docs, compendium note, ticket status, sprint status, ledger sync, and result manifest. | Commit creation or unrelated implementation cleanup. |

### Data Flow

```text
promoted EPIC-03 professions/attributes catalog
        +
bounded rune source authority checkpoint
  -> source-plan digest and review
  -> digest-confirmed detail-page and metadata-only icon snapshot fetch
  -> complete SourceSnapshotSetManifest
  -> selected offline replay
  -> rune source extraction
  -> EPIC-03 profession/attribute joins
  -> semantic effect and stackability normalization
  -> RuneCatalog JSON
  -> GeneratedArtifactManifest + QaReport
  -> exact-path promotion and docs closeout
```

### Source Authority

Phase 1 must inventory candidate Guild Wars Wiki source shapes before locking the source graph.
The preferred default is a bounded hybrid:

- use an overview or category/index page only to enumerate candidate player-usable rune pages;
- use detail page snapshots as the authority for canonical title, redirects, revision facts, rune
  family, rank, profession restriction, affected attribute, effects, and icon metadata;
- use compact overview-page rule text only as review evidence for stackability and headgear
  handoff facts, not as copied runtime prose;
- keep every unsupported, duplicate, redirected, missing, ambiguous, or malformed candidate as a
  source-set disposition with stable QA finding identity.

If an authoritative index does not exist, the implementation may use a reviewed explicit source plan
containing finite detail pages discovered from the candidate pages above. That amendment must record
why the plan is complete, which pages are excluded, and which future ticket owns newly discovered
or non-player records.

### Stable Rune Identity

`RuneId` already exists as a branded numeric catalog ID, but EPIC-10 has no existing external rune
template ID equivalent to `TemplateSkillId`. The sprint must make identity explicit before
promotion:

- rune IDs are never derived from array position, fixture order, filesystem order, or API response
  order;
- each accepted rune has a source-stable `sourceKey` derived from canonical page identity plus
  normalized family/rank when a page represents multiple variants;
- the generator owns a reviewed numeric ID registry or deterministic allocation strategy that is
  stable across refreshes and collision-checked by QA;
- after first promotion, changing an existing rune ID is a blocking generated-data diff unless a
  named migration review approves it;
- runtime consumers treat `RuneId` as opaque and use catalog lookup helpers, not numeric ranges.

### Runtime Catalog Contract

`RuneCatalog` should mirror the durable shape of the existing promoted catalogs:

```text
RuneCatalog
  schemaVersion
  catalogVersion
  sectionDigests
  generatedAt
  generator
  profile: epic-10-runes
  dependencyDigests: EPIC-03 catalog/manifest/section/QA facts
  sourceSet
  dispositions
  runes
  stackGroups
  remoteMedia
```

Each `CatalogRuneRecord` should include at least:

- `id`, `sourceKey`, canonical `name`, `normalizedName`, `wikiUrl`, and page identity facts;
- rune `familyId`, family display name, rank state, rarity/value tier if source-backed, and armor
  upgrade scope;
- profession restriction as `any` or an EPIC-03 `ProfessionId`;
- affected attribute as an EPIC-03 `AttributeId` when the rune is an attribute rune;
- structured `effects`, stack group IDs, nullable `iconId`, compact field provenance, and
  policy-reviewed note state;
- source-owned description text excluded by default unless a bounded review explicitly approves a
  short runtime display field.

### Effect And Stackability Model

Rune effects should be structured as independent facts rather than a single string description.
The minimum supported variants are:

- `attribute-bonus`: affected attribute ID, fixed bonus value, rank, profession restriction, and
  stack group;
- `health-penalty`: fixed negative health value, independently countable when each source-equipped
  rune is present;
- `health-bonus`: fixed positive health value plus verified stackability behavior;
- `energy-bonus`: fixed positive energy value plus verified stackability behavior;
- `condition-modifier` or `duration-modifier`: only when the source shape is clear enough to avoid
  free-form prose semantics;
- `note-only` and `unsupported`: typed records for ambiguous, conditional, or deferred effects.

Attribute-rune stacking has one non-negotiable rule: for a given affected attribute, only the highest
applicable attribute bonus contributes to effective attribute rank, while every verified health
penalty from equipped runes remains independently countable. This distinction must be visible in
types, fixtures, helper output, and QA findings.

Pure domain helpers may summarize rune lookup, effective attribute rune contribution, and countable
health or energy effects from caller-supplied equipped rune instances. They must not choose armor
pieces, validate armor availability, calculate full character stats, apply insignias, read catalogs
from disk, fetch data, or import app modules.

### Source And Audit Separation

The runtime catalog contains compact source IDs and semantic facts. The adjacent manifest and QA
report own operational evidence: source-plan paths and digests, snapshot-set paths and digests,
child snapshot manifests, dependency artifact digests, QA finding detail, review records, release
gate state, artifact digest, generator identity, and commit decision.

Runtime catalog JSON must not embed raw page bodies, source plans, local absolute paths, full
review evidence, QA bodies, snapshot-set manifests, icon bytes, thumbnails, screenshots, MediaWiki
HTML, source-authored long descriptions, or generated text summaries.

## Implementation

### Phase 1: BW-1001 Rune Contracts And EPIC-10 Profile

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/source.ts`
- `src/domain/index.ts`
- `test/domain/rune-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`

**Tasks:**

- [ ] Confirm EPIC-01 through EPIC-04 generated data and EPIC-07 rule-helper assumptions are
  available and compatible.
- [ ] Define `RuneCatalog`, `CatalogRuneRecord`, `RuneCatalogProfile`, source-set summary,
  disposition, stack group, effect variant, dependency summary, rank state, and note-state
  contracts.
- [ ] Define stable rune identity policy, including source keys, numeric ID assignment, collision
  handling, and generated-data diff behavior.
- [ ] Add pure lookup/effect helper contracts only where raw arrays are insufficient for later
  equipment work.
- [ ] Register `epic-10-runes` with fixture, offline, discover, and fetch modes plus code-owned
  caps for pages, media titles, requests, retries, response bytes, parser bytes, aggregate bytes,
  catalog bytes, and QA bytes.
- [ ] Preserve existing EPIC-02, EPIC-03, and EPIC-04 profile behavior and command compatibility.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/rune-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_pipeline`

**Phase Gate:** Domain shape, profile registration, stable ID policy, runtime/audit separation, and
existing profile compatibility are settled before source discovery expands.

### Phase 2: BW-1002 Source Set, Page Resolution, And Fixtures

**Files:**

- `scripts/data/build_wars_ingest/rune_source_set.py`
- `scripts/data/build_wars_ingest/api.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_rune_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/runes/`
- `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json`
- `work/tickets/10-runes/BW-1002-rune-source-set-and-page-resolution.md`

**Tasks:**

- [ ] Run a source-shape checkpoint over candidate rune index/category/detail pages, redirects,
  multi-rank pages, profession-specific pages, common rune pages, icon fields, and stackability
  evidence.
- [ ] Lock a finite source authority or record a planning amendment if no candidate page provides
  complete player-usable coverage.
- [ ] Implement discover-only mode that writes a bounded source plan with profile identity, counts,
  requested titles, canonical titles, accepted candidates, excluded candidates, caps, and digest.
- [ ] Implement digest-confirmed fetch that revalidates the source-plan digest, source-set digest,
  profile identity, page caps, and source drift before detail snapshots are written.
- [ ] Preserve requested, normalized, redirected, canonical, page ID, revision ID, revision
  timestamp, missing-page, duplicate-title, duplicate-canonical, and disambiguation facts.
- [ ] Add minimized synthetic fixtures for attribute rune ranks, common health/energy runes,
  stackable and non-stackable families, redirects, duplicate names, missing icons, malformed text,
  unsupported fields, and incomplete pages.
- [ ] Keep fixture mode fully offline and synthetic.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_source_set build_wars_ingest.tests.test_cli`
- `npm run data:test`
- One manual discover-only live smoke when Guild Wars Wiki is available

**Phase Gate:** Every fixture candidate becomes a catalog seed or explicit disposition, and the
production source graph is finite, digest-bound, and reviewable.

### Phase 3: BW-1003 Rune Extraction

**Files:**

- `scripts/data/build_wars_ingest/rune_infobox.py`
- `scripts/data/build_wars_ingest/rune_catalog.py`
- `scripts/data/build_wars_ingest/rune_source_set.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_rune_infobox.py`
- `scripts/data/build_wars_ingest/tests/test_rune_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/runes/`
- `test/domain/rune-catalog.test.ts`
- `work/tickets/10-runes/BW-1003-rune-extractors.md`

**Tasks:**

- [ ] Extract canonical rune name, normalized lookup key, source URL, page identity, family, rank,
  rarity/value tier when source-backed, profession restriction, affected attribute, icon metadata
  candidate, raw effect fields, and field provenance.
- [ ] Join profession and attribute names only through the promoted EPIC-03 catalog and verified
  section digests.
- [ ] Emit diagnostics for unknown professions, unknown attributes, malformed ranks, duplicate
  source names, duplicate source keys, multiple candidate icon fields, missing icons, unsupported
  templates, lossy parsing, and unsafe text.
- [ ] Preserve raw effect evidence as bounded structured values for Phase 4; do not collapse
  unsupported text into runtime prose.
- [ ] Resolve metadata-only icon records from verified page fields or bounded default candidates,
  with `cachedBytes: false` and no media byte fetch.
- [ ] Produce deterministic fixture catalog candidates with stable ordering and finite JSON values.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_infobox build_wars_ingest.tests.test_rune_catalog build_wars_ingest.tests.test_icons`
- `npm run test:run -- test/domain/rune-catalog.test.ts`
- `npm run data:test`

**Phase Gate:** Synthetic extraction accounts for every fixture seed, all non-null joins resolve
through EPIC-03, and generated candidates contain no raw page bodies, HTML, copied long prose, or
media bytes.

### Phase 4: BW-1004 Rune Effect Semantics And Validation Fixtures

**Files:**

- `scripts/data/build_wars_ingest/rune_semantics.py`
- `scripts/data/build_wars_ingest/rune_catalog.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_rune_semantics.py`
- `scripts/data/build_wars_ingest/tests/test_rune_catalog.py`
- `src/domain/rune-effects.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/rune-catalog.test.ts`
- `test/domain/rune-effects.test.ts`
- `test/fixtures/data-ingestion/runes/`
- `work/tickets/10-runes/BW-1004-rune-effect-semantics-and-validation-fixtures.md`

**Tasks:**

- [ ] Normalize raw extracted fields into structured attribute bonus, health penalty, health bonus,
  energy bonus, condition/duration modifier, note-only, and unsupported effect variants.
- [ ] Encode stack groups and stack behavior as explicit states: verified stackable, verified
  non-stackable highest value, applies once per affected attribute, independently countable, and
  unknown.
- [ ] Add pure domain fixtures proving duplicate attribute runes preserve one highest attribute
  bonus while retaining every verified health penalty.
- [ ] Add fixtures for multiple rune families affecting health or energy, unsupported effects,
  conditional notes, missing stackability evidence, and headgear handoff facts.
- [ ] Keep helper inputs as caller-supplied rune instances; do not model armor availability, rune
  slot legality, equipment-template decoding, or full stat totals.
- [ ] Convert ambiguous semantics into QA findings with affected rune IDs and follow-up ownership.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/rune-catalog.test.ts test/domain/rune-effects.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_semantics build_wars_ingest.tests.test_rune_catalog`
- `npm run data:test`

**Phase Gate:** The highest-attribute-bonus rule and independently countable health penalties are
represented in contracts, generated fixture data, pure helpers, and tests without drifting into a
full equipment calculator.

### Phase 5: BW-1005 QA, Determinism, And Exact-Path Promotion

**Files:**

- `scripts/data/build_wars_ingest/rune_catalog.py`
- `scripts/data/build_wars_ingest/rune_semantics.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_rune_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json`
- `data/generated/epic-10/runes.catalog.json`
- `data/generated/epic-10/runes.catalog.manifest.json`
- `data/qa/epic-10/runes.catalog.qa.json`
- `.gitignore`
- `package.json` only if needed for explicit offline fixture orchestration
- `work/tickets/10-runes/BW-1005-rune-catalog-qa-and-promotion.md`

**Tasks:**

- [ ] Assemble canonical `RuneCatalog` sections with stable ordering, source-set summary,
  dispositions, dependency digests, rune records, stack groups, media metadata, section digests,
  semantic catalog version, and compact provenance.
- [ ] Keep full snapshot paths, source-plan paths, selected snapshot-set identity, review records,
  release gates, and QA finding details in the adjacent manifest or QA report rather than runtime
  catalog JSON.
- [ ] Add QA for source-set accounting, page resolution, stable IDs, EPIC-03 joins, ranks,
  restrictions, effects, stackability, headgear notes, icon metadata, provenance, source-policy
  state, schema shape, section digests, output caps, baseline diffs, and artifact integrity.
- [ ] Add mutation tests proving every runtime-semantic field changes its owning section digest and
  `catalogVersion`, while retrieval timestamps and manifest/QA paths do not.
- [ ] Generate EPIC-10 fixture output twice under a fixed clock and prove byte-identical catalog,
  manifest, QA report, finding IDs, section digests, source ordering, and summary counts.
- [ ] Run live discovery, review the source-plan digest, then run digest-confirmed bounded fetch
  when source/network conditions permit.
- [ ] Replay the selected complete live snapshot set offline twice under a fixed clock and require
  byte-identical promoted outputs.
- [ ] Resolve or exclude all critical/error findings and disposition every warning with named,
  bounded review evidence.
- [ ] Add exact `.gitignore` allowlist entries only for the three approved EPIC-10 production
  paths and required parent directories.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-10-runes --root work/runs/data-ingestion --fixture-root test/fixtures/data-ingestion`
- EPIC-10 fixture regeneration twice with fixed-clock byte comparisons
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-10-runes --root . --snapshot-set <selected-snapshot-set>`
- EPIC-10 selected offline replay twice with fixed-clock byte comparisons
- `npm run data:test`
- `npm run verify`
- `git check-ignore -v` for promoted EPIC-10 paths and representative ignored raw/candidate paths
- `git status --short`

**Phase Gate:** The promoted catalog, manifest, and QA report refer to one reviewed source and
dependency set, pass app/public release gates, reproduce offline, and are the only new generated
EPIC-10 paths eligible for tracking.

### Phase 6: BW-1006 Runtime Docs And Closeout

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/runes-catalog.md`
- `compendium/README.md`
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

- [ ] Document EPIC-10 profile commands, source-set decision, live discover/fetch flow, offline
  replay, exact promoted paths, deterministic regeneration, QA gates, and source-policy decisions.
- [ ] Document `RuneCatalog` schema boundaries, stable ID policy, effect variants, stackability,
  health penalty behavior, dependency digests, icon metadata, and note-only states.
- [ ] Document downstream handoffs to EPIC-13, EPIC-14, EPIC-15, EPIC-20, and EPIC-21, including
  what runtime consumers may and may not import.
- [ ] Confirm no UI behavior changed and no app module imports the rune catalog unless explicitly
  required by the final plan as a non-UI catalog boundary.
- [ ] Inspect the worktree for raw snapshots, source plans, snapshot-set manifests, candidate
  outputs, QA summaries, media bytes, copied prose, broad allowlists, local absolute paths, and
  unrelated changes.
- [ ] Mark BW-1001 through BW-1006, EPIC-10, SPRINT-011, ledger, and result manifest complete only
  after all phase gates and DoD items pass.
- [ ] Do not create a commit; the outer ticket-burn executor owns commit behavior.

**Verification:**

- `npm run verify`
- `git status --short`
- `git check-ignore -v` checks documented in Phase 5
- Manual consistency review across docs, generated files, QA state, tickets, sprint, ledger, and
  result manifest

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/ids.ts` | Verify only unless needed | Keep `RuneId` as the branded ID source; do not add parallel rune ID types unnecessarily. |
| `src/domain/catalog.ts` | Modify | Add `RuneCatalog`, rune records, effects, stack groups, source-set summaries, dispositions, and dependency summaries. |
| `src/domain/catalog-lookup.ts` | Modify | Add pure rune lookup and effect summary helpers where raw arrays are insufficient. |
| `src/domain/rune-effects.ts` | Create if needed | Isolate pure rune stack/effect helper logic if it would overcrowd catalog contracts. |
| `src/domain/source.ts` | Modify only if needed | Reuse existing provenance, QA, media, and manifest contracts; extend only for shared missing shape. |
| `src/domain/index.ts` | Modify | Export framework-neutral rune contracts and helpers. |
| `src/app/catalogs.ts` | Avoid by default | Future runtime import boundary for runes; do not wire UI in this sprint unless the final plan narrows this to catalog adaptation only. |
| `scripts/data/build_wars_ingest/config.py` | Modify | Add EPIC-10 caps and profile defaults. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register `epic-10-runes`. |
| `scripts/data/build_wars_ingest/models.py` | Modify | Add shared rune source, extraction, disposition, and semantic models where appropriate. |
| `scripts/data/build_wars_ingest/rune_source_set.py` | Create | Discover, plan, resolve, and verify bounded rune source sets. |
| `scripts/data/build_wars_ingest/rune_infobox.py` | Create | Extract rune page fields, restrictions, rank/family facts, raw effects, icon candidates, and provenance. |
| `scripts/data/build_wars_ingest/rune_semantics.py` | Create | Normalize raw effect evidence into structured rune effects and stackability states. |
| `scripts/data/build_wars_ingest/rune_catalog.py` | Create | Assemble catalog sections, section digests, semantic version inputs, QA inputs, and dispositions. |
| `scripts/data/build_wars_ingest/api.py` | Modify only if needed | Preserve page-resolution facts needed by EPIC-10 without regressing existing profiles. |
| `scripts/data/build_wars_ingest/snapshots.py` | Modify only if needed | Reuse complete snapshot-set replay and path confinement for EPIC-10. |
| `scripts/data/build_wars_ingest/wikitext.py` | Modify | Support bounded rune templates and diagnostics for unsupported forms. |
| `scripts/data/build_wars_ingest/icons.py` | Modify | Resolve metadata-only rune icon records without fetching bytes. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Support EPIC-10 canonical artifact paths, caps, manifests, and digest checks. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add rune-specific QA rules while preserving shared QA wire format. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate EPIC-10 fixture, live discover/fetch, offline replay, extraction, assembly, QA, and promotion. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Expose safe EPIC-10 profile, stage, digest confirmation, and snapshot-set options. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Cover profile registration, source-set planning, extraction, semantics, QA, artifacts, pipeline, and CLI behavior. |
| `test/domain/rune-catalog.test.ts` | Create | Validate TypeScript catalog contracts, lookup, source-set summary, effects, stack groups, and JSON fixture compatibility. |
| `test/domain/rune-effects.test.ts` | Create | Prove highest attribute bonus and independently countable health penalty behavior. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Prove Python-generated rune JSON satisfies TypeScript contracts. |
| `test/fixtures/data-ingestion/runes/` | Create | Store minimized synthetic rune source fixtures. |
| `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json` | Create | Store deterministic synthetic golden rune catalog. |
| `data/generated/epic-10/runes.catalog.json` | Create/allowlist | Runtime-eligible generated rune catalog. |
| `data/generated/epic-10/runes.catalog.manifest.json` | Create/allowlist | Artifact digest, source/dependency, generator, and review evidence summary. |
| `data/qa/epic-10/runes.catalog.qa.json` | Create/allowlist | Bounded QA findings and release gate report. |
| `.gitignore` | Modify narrowly | Allowlist only approved EPIC-10 production artifacts and required parent dirs. |
| `package.json` | Modify only if needed | Include EPIC-10 in explicit offline fixture orchestration. |
| `README.md`, `scripts/data/README.md`, `data/**/README.md` | Modify | Document commands, exact paths, runtime boundaries, and artifact retention. |
| `compendium/data-ingestion-platform.md` | Modify | Record EPIC-10 profile behavior and source-set/replay constraints. |
| `compendium/runes-catalog.md` | Create | Durable EPIC-10 source authority, schema, policy, stackability, and downstream handoff note. |
| `compendium/README.md` | Modify | Index the rune catalog note. |
| `work/tickets/10-runes/*.md` | Modify during execution | Record ticket status, evidence, assumptions, and closeout. |
| `work/sprints/SPRINT-011.md` | Create/finalize during execution | Track sprint execution state and checked DoD. |
| `work/sprints/ledger.tsv` | Modify during execution | Record SPRINT-011 lifecycle status. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-10-result.json` | Create/modify during execution | Store ticket-burn result manifest. |

## Definition of Done

### Source And Identity Gates

- [ ] The final source authority is finite, documented, digest-bound, and approved before detail
  fetch or promotion.
- [ ] Every accepted source candidate becomes exactly one rune record or an explicit disposition.
- [ ] Redirects, duplicate names, duplicate source keys, duplicate canonical pages, missing pages,
  malformed pages, unsupported records, and source drift are resolved or blocking.
- [ ] Stable `RuneId` assignment is reviewed, source-order-independent, collision-checked, and
  guarded by generated-data diff tests.
- [ ] Existing EPIC-02, EPIC-03, and EPIC-04 profiles remain compatible.

### Catalog Contract Gates

- [ ] `RuneCatalog` is framework-neutral and JSON-compatible.
- [ ] `src/domain` imports no React, DOM/browser APIs, browser storage, app modules, data scripts,
  source snapshots, generated manifests, QA reports, filesystem APIs, or network clients.
- [ ] Rune records include stable ID, source key, name, normalized key, wiki URL, page identity,
  family, rank, profession restriction, affected attribute, structured effects, stack groups,
  nullable icon ID, and compact provenance.
- [ ] Profession and affected-attribute joins resolve through EPIC-03 catalog facts and dependency
  digests.
- [ ] Runtime catalog data excludes raw page bodies, source plans, local paths, full QA bodies,
  review scratch evidence, copied long prose, MediaWiki HTML, icon bytes, screenshots, and
  thumbnails.

### Effect And Stackability Gates

- [ ] Attribute bonuses, health penalties, health bonuses, energy bonuses, verified condition or
  duration modifiers, note-only effects, and unsupported effects are distinct typed states.
- [ ] Duplicate attribute-rune fixtures prove the highest applicable attribute bonus wins per
  affected attribute.
- [ ] The same fixtures prove every verified health penalty from equipped runes remains
  independently countable.
- [ ] Verified non-attribute stackability is encoded explicitly; ambiguous behavior remains visible
  through typed notes and QA findings.
- [ ] Headgear interaction facts are recorded only as handoff facts and do not create armor shell or
  equipment UI ownership.
- [ ] Pure helpers do not become a full armor/stat calculator.

### Determinism And QA Gates

- [ ] Fixture mode is fully offline and synthetic.
- [ ] Live detail fetch requires `--allow-live-network`, a registered EPIC-10 profile, exact source
  plan path, exact source-set digest confirmation, and fixed Guild Wars Wiki API origin.
- [ ] Offline replay requires one complete EPIC-10 `SourceSnapshotSetManifest` and rejects partial,
  missing, extra, duplicated, mixed-profile, digest-mismatched, or path-escaping inputs.
- [ ] Canonical output is stable under input ordering, API response ordering, filesystem ordering,
  batch boundaries, and concurrent completion.
- [ ] Repeated fixed-clock fixture generation is byte-identical for catalog, manifest, QA report,
  source ordering, section digests, finding IDs, and summary counts.
- [ ] Selected production snapshot-set replay is byte-identical across two fixed-clock offline runs.
- [ ] Semantic section digests and `catalogVersion` change for every runtime-semantic mutation and
  remain stable for retrieval timestamp, manifest path, QA path, and version value changes.
- [ ] QA covers source accounting, page resolution, stable IDs, EPIC-03 joins, ranks, restrictions,
  effects, stackability, headgear notes, icons, provenance, source-policy state, schema shape,
  output caps, baselines, and artifact integrity.

### Promotion And Closeout Gates

- [ ] Only `data/generated/epic-10/runes.catalog.json`,
  `data/generated/epic-10/runes.catalog.manifest.json`, and
  `data/qa/epic-10/runes.catalog.qa.json` are allowlisted for EPIC-10.
- [ ] `appConsumptionGate` and `publicReleaseGate` are `pass`.
- [ ] Critical and error findings are resolved or excluded according to policy; every warning has a
  named bounded disposition.
- [ ] `git check-ignore -v` proves promoted paths are trackable and representative raw/candidate
  outputs remain ignored.
- [ ] `npm run verify` passes without live network access.
- [ ] README, data docs, script docs, compendium, generated files, QA report, tickets, sprint,
  ledger, and result manifest agree on IDs, paths, commands, versions, review scope, assumptions,
  limitations, and status.
- [ ] BW-1001 through BW-1006, EPIC-10, SPRINT-011, and `work/sprints/ledger.tsv` are marked
  complete only after all gates pass.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Rune source authority is incomplete or ambiguous | High | High | Make source-shape proof a Phase 1/2 gate; block for amendment rather than broadening silently. |
| Stable rune IDs are accidentally derived from ordering | Medium | High | Define source keys, reviewed numeric ID allocation, collision checks, and ID mutation QA before promotion. |
| Attribute bonus stacking loses duplicate health penalties | Medium | High | Model bonus contribution and countable penalties as separate effects; require explicit domain fixtures. |
| Non-attribute rune semantics are over-inferred from prose | Medium | High | Encode only verified stackability; keep ambiguous effects as note-only/unsupported findings. |
| Source-authored prose enters runtime JSON | Medium | High | Default to structured effects and reviewed short display text only; QA blocks unknown copied material. |
| Live source discovery turns into a crawl | Medium | High | Use finite source plans, fixed API origin, digest confirmation, and code-owned page/media/request caps. |
| EPIC-03 catalog drift breaks joins | Medium | High | Verify EPIC-03 catalog version, artifact digest, section digests, manifest digest, and QA gate before joins. |
| Runtime catalog grows with audit evidence | Medium | Medium | Keep source plans, snapshot paths, review records, QA bodies, and release gates in manifest/QA artifacts. |
| Exact-path allowlisting leaks byproducts | Low | High | Use parent re-ignore rules, exact-file exceptions, `git check-ignore -v`, and worktree inspection. |
| Helper scope drifts into equipment/stat calculator | Medium | Medium | Keep helpers pure and instance-based; defer armor shell, equipment UI, insignias, weapons, and full totals. |
| Live network unavailable during execution | Medium | Medium | Complete fixture/offline implementation, but leave production promotion and sprint completion blocked. |
| Generated QA is too noisy to review | Medium | Medium | Use stable finding IDs, bounded evidence, affected-rune scopes, summaries, and early systematic-finding checks. |

## Security

- Treat source titles, redirects, page bodies, templates, parameters, icon names, source plans,
  manifests, generated catalogs, QA evidence, and review notes as untrusted input.
- Permit network access only in explicit live mode with `--allow-live-network`, registered
  `epic-10-runes` profile, GET-only JSON requests, fixed Guild Wars Wiki API origin, finite
  timeouts, retry caps, continuation caps, and response byte caps.
- Reject arbitrary endpoints, source-provided fetch URLs, final redirects outside the configured
  API origin, recursive crawls, credentials, cookies, tokens, and environment secrets.
- Parse wiki content as inert data. Do not execute templates, Lua, HTML, JavaScript, CSS, links,
  shell snippets, or source-provided commands.
- Store rune display data as structured facts or reviewed plain text only. Runtime UI must escape
  text and must not inject source text into `innerHTML`.
- Bound accepted pages, title lengths, parser bytes, template traversal, evidence excerpts, output
  bytes, QA findings, stack groups, effect counts, and numeric ranges.
- Preserve path confinement, safe slugs, symlink-escape checks where practical, atomic writes,
  finite-number checks, stable ordering, and SHA-256 verification.
- Do not use source titles, rune names, or IDs directly as filesystem paths.
- Do not log or promote raw page bodies, complete unbounded source dumps, response headers, local
  environment values, absolute machine paths, copied descriptions, or media bytes.
- Query icon metadata only and keep every runtime media record `cachedBytes: false`.
- Keep raw snapshots, source plans, snapshot-set manifests, candidate artifacts, QA summaries, logs,
  review scratch files, thumbnails, screenshots, and icon binaries ignored or absent.

## Dependencies

- `EPIC-01` / `SPRINT-002` for source policy, provenance, manual review, media restrictions, QA
  gates, exact-path promotion, and artifact retention rules.
- `EPIC-02` / `SPRINT-003` for the MediaWiki client, verified snapshots, parser adapter,
  metadata-only icon resolution, canonical artifact writing, fixture/offline/live modes, and QA
  report format.
- `EPIC-03` / `SPRINT-004` for the promoted professions/attributes catalog, attribute IDs,
  profession IDs, template crosswalks, section digests, and source-profile pattern.
- `EPIC-04` / `SPRINT-005` for the closest precedent on high-volume source-set planning, selected
  offline replay, section digests, semantic catalog versioning, and exact-path allowlisting.
- `EPIC-07` / `SPRINT-007` for validation result semantics and the effective attribute-rank helper
  boundary.
- `EPIC-09` / `SPRINT-010` for the current local-library/share schema boundary that should continue
  to exclude equipment, runes, insignias, and weapons.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and `npm run data:setup` for the pinned parser
  environment.
- Guild Wars Wiki availability is required for production live discovery/fetch only. Fixture
  regeneration, tests, build, and `npm run verify` remain offline.
- Maintainer review capacity is required for source-set digest approval, source-policy
  dispositions, warning dispositions, first-baseline review, and any copied-text exception.
- Downstream consumers include EPIC-13 Armor Catalog, EPIC-14 Equipment Editor, EPIC-15 Title Tracks
  and PvE-only, EPIC-20 Search and Discovery, and EPIC-21 Build Analysis.

## Open Questions

1. **Source authority:** Which exact Guild Wars Wiki source set gives complete player-usable rune
   coverage with the smallest reviewable graph: `Rune`, `Category:Runes`, individual family pages,
   profession-attribute pages, or a bounded hybrid? Default: start with the bounded hybrid above and
   block promotion until source-shape proof closes coverage.
2. **Stable ID allocation:** Should numeric `RuneId` values come from a reviewed registry, a
   deterministic source-key hash with collision handling, or a manually assigned finite range?
   Default: decide in Phase 1 before writing production records; never use array position.
3. **Multi-rank page shape:** Do source pages represent minor, major, and superior variants as
   separate pages, shared pages, templates, or text sections? Default: support shared-page variants
   only after page identity and provenance can still distinguish records.
4. **Non-attribute stackability:** Which common rune families have source-backed stackability or
   non-stackability semantics, and which must remain note-only? Default: encode only verified
   behavior and preserve the rest as QA warnings for EPIC-21.
5. **Condition/duration effects:** Should families such as Restoration be structured in EPIC-10 or
   left note-only until a broader status-effect model exists? Default: structure only fixed,
   source-clear values without building combat semantics.
6. **Headgear facts:** What exact headgear interaction facts are useful now without stealing scope
   from EPIC-13 and EPIC-14? Default: record source-backed handoff notes and defer equipment
   behavior.
7. **Display text:** Is any short runtime rune tooltip text approved in EPIC-10, or should the first
   catalog be structured-only? Default: structured effects first; copied or source-authored prose
   requires bounded review.
8. **App import boundary:** Should `src/app/catalogs.ts` add a rune import during EPIC-10 if no UI
   consumes it yet? Default: document the future import boundary and defer app wiring unless final
   execution discovers a concrete verification need.
