---
id: SPRINT-005
title: Skills Catalog
status: planned
source_target: BACKLOG
source_epic: EPIC-04
source_epic_path: work/tickets/04-skills/EPIC.md
tickets:
  - BW-0401
  - BW-0402
  - BW-0403
  - BW-0404
  - BW-0405
  - BW-0406
created: 2026-09-01
---

# Sprint 005: Skills Catalog

## Overview

This sprint turns `EPIC-04 Skills` into one runtime-eligible, provenance-bearing skills catalog that
later template, rule-engine, search, tooltip, and guide-authoring work can consume without reading
raw snapshots, parser output, or wiki APIs at runtime. It extends the existing EPIC-02 ingestion
spine and uses the approved EPIC-03 professions/attributes catalog as the authority for profession
and attribute joins.

The sequencing priority is to lock the catalog and profile contracts first, then solve dynamic
source-set resolution from the skill ID map, then extract core infobox fields, then normalize
progression and split behavior, then assemble and promote the exact-path artifacts, and only then
close docs and status records. That order keeps the largest uncertainty, page identity and fetch
scale, ahead of field extraction and QA closeout.

This sprint is intentionally bounded. It does not build UI search, runtime tooltips, template
import/export, rule-engine enforcement, balance-diff UX, attribution UI, local storage, or runtime
source fetching. Its job is to produce one approved skills catalog and the verification surfaces that
later epics depend on.

## Use Cases

1. A future template import/export feature can map numeric skill IDs to approved catalog records
   while preserving unknown authored IDs as explicit lookup misses instead of coercing them away.
2. A future search feature can index canonical names, accepted title variants, profession,
   attribute, type, and flag data directly from the catalog.
3. A future tooltip feature can render costs, activation, recharge, split variants, and green-number
   progression from catalog data without re-reading raw wiki text.
4. A future rule-engine feature can reason about elite, title, PvE-only, PvP-only, no-attribute,
   and special-skill classifications from normalized records instead of page-specific parsing logic.
5. A reviewer can trace every promoted skill record, field, icon reference, and QA finding back to
   bounded source references, revision facts, and manual review evidence.
6. A maintainer can rerun fixture mode offline, replay selected snapshots offline, and perform one
   bounded live refresh when promotion evidence is needed.
7. Later content work can consume the approved catalog path only, not snapshot manifests, QA
   summaries, or Python ingestion modules.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Domain contracts | Plain-data skill catalog records, lookup helpers, cost/progression/split contracts, and generated artifact wire shapes. | React state, UI rendering, template codecs, rule-engine behavior, and runtime network access. |
| Ingestion | Profile-driven snapshot fetch, source-set planning, infobox extraction, progression normalization, catalog assembly, QA, and promotion. | One-off scrapers, browser automation, arbitrary wiki crawling, or runtime parsing. |
| Generated data | Exact-path approved catalog JSON, adjacent manifest JSON, bounded QA JSON, and a synthetic golden fixture. | Broad generated commits, raw snapshots, QA text summaries, icon binaries, screenshots, or copied page bodies. |
| Verification | Offline fixture tests, deterministic replay, focused Vitest contract checks, and `npm run verify`. | Network-dependent CI, runtime fetch validation, or manual review replaced by automation. |
| Closeout | Documentation, exact-path allowlisting, ticket/sprint/ledger consistency, and no-commit execution. | App integration, release UI, or automated publishing. |

### Data Flow

```text
Guild Wars Wiki:Game integration/Skills/0
  -> skill ID enumeration
  -> normalized source-set records
  -> deterministic detail-page batch plan
  -> ignored raw payload + SourceSnapshotManifest
  -> skill infobox extraction
  -> progression and split extraction
  -> profession/attribute joins from EPIC-03 catalog
  -> canonical skill catalog assembly
  -> GeneratedArtifactManifest + QaReport
  -> exact-path promotion
```

The source-set record is a first-class intermediate boundary. It should capture `skillId`,
requested title, canonical title, redirect evidence, page disposition, and selected snapshot path so
later phases never need to re-solve page identity from raw text.

### Source Authority

| Fact | Primary Authority | Cross-check | Conflict Handling |
| --- | --- | --- | --- |
| Accepted skill IDs and initial titles | `Guild Wars Wiki:Game integration/Skills/0` | Redirect/canonical page metadata | Emit a blocking QA finding; do not renumber or silently drop IDs. |
| Canonical skill page identity | Verified snapshot/page metadata for the resolved detail page | ID map title and redirect evidence | Keep both requested and canonical title evidence; ambiguous pages do not promote. |
| Profession and attribute joins | `data/generated/epic-03/professions-attributes.catalog.json` | Skill infobox fields and template crosswalk facts | Block on unknown or conflicting joins instead of duplicating authority. |
| Core skill fields | `Skill infobox` and page-local structured templates | Page title, source-set record, and EPIC-03 catalog | Missing or malformed structured fields become QA findings, not guessed defaults. |
| Progression and split behavior | `Skill progression`, `gr`, `gr2`, title-rank progression, `PvE version`, `PvP version`, and morale-boost recharge templates | Related variant page links and source-set records | Unsupported forms remain structured evidence plus diagnostics until modeled or excluded. |
| Icon metadata | MediaWiki `imageinfo` and file-page metadata | Explicit `image=` values and default icon-name heuristics | Metadata-only or nullable with QA disposition; never cache media bytes. |
| Acquisition metadata | Deferred by default | Source-shape checkpoint only | Include only if the field is small, factual, and policy-safe enough for later guide work. |

### Contract And Profile Decisions

- `SkillCatalog` should mirror the EPIC-03 catalog envelope: `schemaVersion`, semantic
  `catalogVersion`, `sectionDigests`, `generatedAt`, `generator`, `profile`, aggregate `sources`,
  `snapshotManifestPaths`, `skills`, `remoteMedia`, `manualReviews`, `sourceShapeProof`, and
  `generatedArtifactManifest`.
- The existing `DataIngestionProfile` contract assumes static `detail_titles` and inherits a default
  `page_limit=200`. That is insufficient for EPIC-04. Phase 1 must extend the profile model so
  EPIC-04 can declare seed titles, dynamic detail-title planning, stable batch sizing, and explicit
  caps without regressing EPIC-02 or EPIC-03.
- The catalog should contain one record per accepted skill ID. PvE/PvP variants remain distinct
  records when they resolve to distinct accepted IDs, and split relationships are modeled explicitly
  between records rather than by merging IDs.
- Cost contracts must distinguish missing, zero, not-applicable, numeric, percent, pip-like upkeep,
  signet/no-cost, adrenaline, sacrifice, overcast, morale-boost recharge, and other special cases
  that matter for tooltips or rule work.
- Description handling must separate structured source facts from runtime-facing projections. The
  promoted catalog may contain structured description data and tooltip/search projections, but broad
  copied rendered prose stays review-gated and must not slip in as an opaque blob.
- Unknown authored skill IDs remain representable. Lookup helpers may return `known`, `reserved` if
  later introduced, or `unknown`, but they must never coerce or compact numeric IDs.

### Artifact Layout

Stable paths produced by this sprint:

- `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json`
- `data/generated/epic-04/skills.catalog.json`
- `data/generated/epic-04/skills.catalog.manifest.json`
- `data/qa/epic-04/skills.catalog.qa.json`
- `data/qa/epic-04/skills.catalog.summary.txt`

Only the production catalog JSON, adjacent manifest JSON, and machine-readable QA JSON should be
allowlisted. The `.summary.txt`, raw snapshots, snapshot manifests, live-run scratch output, and any
intermediate source-set artifacts stay ignored by default.

### Promotion Gate

Promotion requires:

- every accepted skill ID resolves to one catalog record or an explicit QA disposition
- deterministic fixture generation with a fixed clock
- offline replay from the selected EPIC-04 snapshot set
- complete source IDs, revision metadata, and field-level provenance where needed
- no cached icon bytes, screenshots, copied page bodies, or unreviewed broad prose
- no unresolved critical findings, no unresolved public-release error findings, and reviewed warnings
- `appConsumptionGate: pass` and `publicReleaseGate: pass`
- exact `.gitignore` allowlisting verified with `git check-ignore -v` and `git status --short`

## Implementation

### Phase 1: BW-0401 Contracts, Lookup Surface, And EPIC-04 Profile (~15% of effort)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/domain/skill-catalog.test.ts`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`

**Tasks:**

- [ ] Define the `SkillCatalog` envelope and `CatalogSkillRecord` wire shape in `src/domain` so the
      generated artifact has one durable contract before any extractor work begins.
- [ ] Replace the current minimal `Skill` catalog shape with explicit skill-record contracts for
      identity, page URLs, campaign, profession, attribute, type, cost fields, flags, descriptions,
      progression references, split relationships, acquisition metadata, and provenance.
- [ ] Add pure lookup helpers for skill ID and canonical-title lookups, unknown authored IDs, and
      split-variant relationship traversal without importing app or ingestion modules.
- [ ] Extend the EPIC-04 profile contract so it supports one seed page, dynamic detail-page
      planning, explicit higher page/request caps than the current default, fixture/offline/live
      paths, and deterministic offline snapshot selection.
- [ ] Keep EPIC-02 and EPIC-03 profile behavior stable and covered by tests before EPIC-04-specific
      changes land.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/skill-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles`

### Phase 2: BW-0402 Source-Set Resolution And Snapshot Planning (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_ids.py`
- `scripts/data/build_wars_ingest/skill_source_set.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_skill_source_set.py`
- `test/fixtures/data-ingestion/skills/`

**Tasks:**

- [ ] Reuse the existing skill-ID enumerator for the full game-integration map and preserve its
      duplicate, malformed, and gap diagnostics.
- [ ] Introduce a normalized source-set planner that turns the accepted skill-ID map into stable
      records with requested title, canonical title, redirect evidence, page disposition, and
      snapshot-selection identity.
- [ ] Resolve redirects, disambiguation preambles, missing pages, duplicate titles, PvE/PvP title
      variants, and non-contiguous high-ID gaps into explicit source-set outcomes instead of leaving
      them for later extractor phases.
- [ ] Teach live mode to fetch detail pages in title-sorted batches that respect explicit EPIC-04
      page, request, response-byte, parser-byte, continuation, and retry limits.
- [ ] Teach offline mode to replay only the EPIC-04 snapshot set rather than scanning all snapshot
      manifests under `data/source-snapshots`.
- [ ] Add minimized fixtures for redirects, duplicate IDs, duplicate titles, disambiguation pages,
      missing pages, malformed mappings, and split-title edge cases.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_source_set`
- `npm run data:test`
- One bounded live smoke or dry-run command during implementation if network conditions permit

### Phase 3: BW-0403 Infobox And Core Field Extraction (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_infobox.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_skill_infobox.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/skills/`
- `test/domain/skill-catalog.test.ts`

**Tasks:**

- [ ] Parse `Skill infobox` templates into one normalized core record per accepted skill ID using
      the phase-2 source-set records as the page-identity boundary.
- [ ] Normalize campaign, profession, attribute, type, activation, recharge, energy, adrenaline,
      sacrifice, upkeep, overcast, and elite/common/PvE/PvP/title/special flags into explicit
      structured fields.
- [ ] Resolve profession and attribute references only through the approved EPIC-03 catalog and its
      template-crosswalk semantics; do not duplicate those facts from free-text infobox values.
- [ ] Preserve structured description evidence and a bounded tooltip/search projection without
      promoting raw page bodies or opaque parser dumps.
- [ ] Resolve metadata-only icon records with `cachedBytes: false`, nullable when unresolved, and
      backed by QA findings instead of silent omissions.
- [ ] Keep acquisition metadata out of the first promoted artifact unless the source-shape checkpoint
      proves a small factual field can be included without copied-text risk.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_infobox`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_icons`
- `npm run test:run -- test/domain/skill-catalog.test.ts`

### Phase 4: BW-0404 Progression, Split Graph, And Tooltip Projection (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_progression.py`
- `scripts/data/build_wars_ingest/skill_infobox.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_skill_progression.py`
- `test/fixtures/data-ingestion/skills/`
- `test/domain/skill-catalog.test.ts`

**Tasks:**

- [ ] Parse `Skill progression`, `gr`, `gr2`, title-rank progression, morale-boost recharge, and
      split wrapper templates into normalized progression structures and raw structured evidence.
- [ ] Model attribute-scaled, title-rank-scaled, constant, multi-value, and split-specific
      progression forms without forcing them into one lossy numeric shape.
- [ ] Build explicit bidirectional split relationships between related skill records where source
      evidence identifies PvE/PvP variants.
- [ ] Derive tooltip-ready projections from the structured fields so later runtime work can show
      dynamic values without re-reading wikitext or replaying parser logic.
- [ ] Emit QA diagnostics for malformed ranges, impossible dependencies, unsupported progression
      forms, duplicate split links, missing reciprocal split links, and contradictory wrappers.
- [ ] Add fixtures for standard scaling, title-rank scaling, morale-boost recharge, multi-value
      progressions, no-progression skills, split wrappers, and malformed progression templates.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_progression`
- `npm run data:test`
- `npm run test:run -- test/domain/skill-catalog.test.ts`

### Phase 5: BW-0405 Catalog Assembly, QA, And Exact-Path Promotion (~15% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_catalog.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_skill_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json`
- `test/domain/data-ingestion-contracts.test.ts`
- `.gitignore`
- `data/generated/epic-04/skills.catalog.json`
- `data/generated/epic-04/skills.catalog.manifest.json`
- `data/qa/epic-04/skills.catalog.qa.json`

**Tasks:**

- [ ] Assemble one canonical skills catalog with stable record order, section digests, semantic
      `catalogVersion`, source references, snapshot manifest paths, source-shape proof, remote
      media, manual reviews, and a nullable generated artifact manifest field.
- [ ] Add profile-specific validators for unresolved IDs, duplicate IDs, duplicate canonical names,
      missing costs, missing descriptions, missing progressions, missing split relationships, unknown
      joins, missing source references, stale revision metadata, copied-text risk, and artifact
      integrity mismatches.
- [ ] Keep the fixed-clock fixture artifact byte-identical across repeated runs, including finding
      IDs, section order, and manifest/report output.
- [ ] Run one bounded live refresh for the EPIC-04 profile, then replay from the selected snapshots
      offline before allowlisting the production paths.
- [ ] Promote only the catalog JSON, adjacent manifest JSON, and machine-readable QA JSON. Keep QA
      text summaries, live output, raw snapshots, and intermediate source-set output ignored.
- [ ] Validate exact-path allowlisting with `git check-ignore -v` and inspect the working tree for
      accidental generated byproducts or copied content before closeout.

**Verification:**

- `npm run data:regenerate`
- `npm run data:test`
- `npm run verify`
- Run EPIC-04 fixture regeneration twice and prove byte-identical output
- Run EPIC-04 offline replay from the selected snapshots
- Run one bounded live refresh before production promotion

### Phase 6: BW-0406 Docs, Verification, And Closeout (~10% of effort)

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/skills-catalog.md`
- `compendium/README.md`
- `work/tickets/04-skills/EPIC.md`
- `work/tickets/04-skills/*.md`
- `work/sprints/SPRINT-005.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Document EPIC-04 profile commands, dynamic source-set behavior, batch limits, exact promoted
      paths, fixture/offline/live expectations, and the rule that `npm run verify` remains offline.
- [ ] Document the source-policy decisions for description handling, tooltip projections, icon
      metadata, split relationships, progression evidence, and deferred acquisition metadata.
- [ ] Record deferred behavior for runtime search UX, tooltip rendering, template import/export,
      balance-diff UX, attribution display, hero/monster special handling, and cached-media policy.
- [ ] Update the sprint, ticket, epic, and ledger records only after all technical and process gates
      pass.
- [ ] Verify that no commit is created and that unrelated working tree changes are preserved.

**Verification:**

- `npm run verify`
- `git check-ignore -v data/generated/epic-04/skills.catalog.json data/generated/epic-04/skills.catalog.manifest.json data/qa/epic-04/skills.catalog.qa.json`
- `git status --short`

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Define the durable skills catalog envelope and normalized skill record contracts. |
| `src/domain/catalog-lookup.ts` | Modify | Add pure skill lookup and split-relationship helpers for later runtime consumers. |
| `src/domain/index.ts` | Modify | Export the new public skill catalog contracts and helpers. |
| `test/domain/contracts.test.ts` | Modify | Regress `src/domain` JSON compatibility and catalog invariants. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Keep Python-generated skill artifacts aligned with the TypeScript wire contract. |
| `test/domain/skill-catalog.test.ts` | Create | Cover skill lookup, cost variants, progression projections, and split relationships. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register the EPIC-04 profile and support dynamic detail-page planning. |
| `scripts/data/build_wars_ingest/skill_source_set.py` | Create | Resolve canonical skill pages, redirects, disambiguation outcomes, and fetch batches. |
| `scripts/data/build_wars_ingest/skill_infobox.py` | Create | Extract core skill fields from verified page snapshots. |
| `scripts/data/build_wars_ingest/skill_progression.py` | Create | Normalize progression templates, split wrappers, and tooltip-ready projections. |
| `scripts/data/build_wars_ingest/skill_catalog.py` | Create | Assemble the final EPIC-04 catalog, section digests, and semantic version. |
| `scripts/data/build_wars_ingest/skill_ids.py` | Modify | Reuse and harden full-map skill ID enumeration. |
| `scripts/data/build_wars_ingest/icons.py` | Modify | Reuse metadata-only icon resolution for skills. |
| `scripts/data/build_wars_ingest/wikitext.py` | Modify narrowly | Add parser helpers needed for infobox and progression extraction. |
| `scripts/data/build_wars_ingest/models.py` | Modify | Add normalized source-set and skill extraction data structures. |
| `scripts/data/build_wars_ingest/snapshots.py` | Modify narrowly | Support deterministic EPIC-04 offline snapshot selection. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Write canonical EPIC-04 artifact and manifest metadata. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add EPIC-04-specific validators and promotion gates while preserving shared QA wire format. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate EPIC-04 fixture, offline, and live runs in dependency order. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Expose EPIC-04 profile selection, bounded live refresh, and replay controls. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Add focused Python tests for profile, source-set, infobox, progression, assembly, QA, pipeline, and CLI behavior. |
| `test/fixtures/data-ingestion/skills/` | Create | Store minimized synthetic source fixtures for EPIC-04 edge cases. |
| `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json` | Create | Store the synthetic golden EPIC-04 generated artifact. |
| `data/generated/epic-04/skills.catalog.json` | Create/allowlist | Provide the runtime-eligible skills catalog. |
| `data/generated/epic-04/skills.catalog.manifest.json` | Create/allowlist | Provide digest, input snapshot, and generator evidence for the catalog. |
| `data/qa/epic-04/skills.catalog.qa.json` | Create/allowlist | Provide the bounded machine-readable QA and gate evidence. |
| `.gitignore` | Modify narrowly | Allowlist only the approved EPIC-04 production files. |
| `README.md` | Modify | Document EPIC-04 catalog status and consumption boundaries. |
| `scripts/data/README.md` | Modify | Document EPIC-04 commands, limits, and replay expectations. |
| `data/README.md` | Modify | Record the EPIC-04 lifecycle exception and promotion gate. |
| `data/generated/README.md` | Modify | Record the exact EPIC-04 generated-file allowlist. |
| `data/qa/README.md` | Modify | Record the exact EPIC-04 QA-report allowlist and non-runtime status. |
| `compendium/data-ingestion-platform.md` | Modify | Extend the shared ingestion-platform notes with EPIC-04 profile rules. |
| `compendium/skills-catalog.md` | Create | Capture durable source authority, policy decisions, and deferred skill behavior. |
| `compendium/README.md` | Modify | Index the EPIC-04 skills catalog note. |
| `work/tickets/04-skills/*.md` | Modify | Record execution status and closeout evidence. |
| `work/sprints/SPRINT-005.md` | Modify during execution | Track sprint execution state. |
| `work/sprints/ledger.tsv` | Modify | Record sprint lifecycle status. |

## Definition of Done

- [ ] BW-0401 through BW-0406 are completed in dependency order.
- [ ] `src/domain` remains plain-data and does not import React, DOM/browser APIs, storage,
      network clients, filesystem APIs, or `scripts/data`.
- [ ] The EPIC-04 profile supports dynamic detail-page planning and does not silently inherit the
      insufficient default `page_limit=200` behavior.
- [ ] Every accepted skill ID from `Guild Wars Wiki:Game integration/Skills/0` resolves to exactly
      one catalog record or an explicit QA disposition.
- [ ] Skill IDs remain numeric, non-compacted, and safe for unknown authored IDs.
- [ ] Core skill records include stable ID, canonical name, canonical wiki URL, campaign,
      profession, attribute, type, costs, flags, description/projection fields, progression data,
      split relationships, provenance, and nullable metadata-only icon references.
- [ ] Cost fields distinguish missing, zero, not-applicable, numeric, adrenaline, sacrifice,
      upkeep, overcast, signet/no-cost, and morale-boost recharge cases where applicable.
- [ ] Profession and attribute joins are sourced from the approved EPIC-03 catalog rather than
      duplicated from free text.
- [ ] Tooltips and search can be driven from catalog data without reading raw snapshots or parser
      output at runtime.
- [ ] Progression metadata preserves enough structured evidence for tooltip projection and later
      balance-diff work without committing raw page bodies.
- [ ] PvE/PvP split relationships are explicit and bidirectional where source evidence exists.
- [ ] Unsupported or malformed progression/split forms produce diagnostics instead of guessed data.
- [ ] Every skill icon record remains metadata-only with `cachedBytes: false`; no icon binaries,
      thumbnails, screenshots, or external media bytes are promoted.
- [ ] Description handling does not smuggle copied broad prose into the runtime-facing artifact.
- [ ] Acquisition metadata is either explicitly included as bounded factual data with provenance or
      explicitly deferred from the promoted catalog.
- [ ] Source references, revision IDs, source revision timestamps, and retrieval timestamps are
      present wherever required by source policy.
- [ ] QA flags missing icons, costs, descriptions, progressions, split relationships, duplicate IDs,
      duplicate names, malformed templates, missing source references, stale revision metadata,
      copied-text risk, and artifact integrity mismatches.
- [ ] Repeated fixed-clock fixture generation is byte-identical for the EPIC-04 catalog, manifest,
      QA report, and finding IDs.
- [ ] EPIC-04 offline replay is deterministic from the selected snapshot set.
- [ ] One bounded live refresh is completed before exact-path production promotion.
- [ ] Only `data/generated/epic-04/skills.catalog.json`,
      `data/generated/epic-04/skills.catalog.manifest.json`, and
      `data/qa/epic-04/skills.catalog.qa.json` are allowlisted.
- [ ] `appConsumptionGate` and `publicReleaseGate` are `pass`; unresolved critical findings are
      absent; unresolved public-release error findings are absent.
- [ ] `npm run verify` passes without requiring live network access.
- [ ] README, data docs, compendium notes, tickets, sprint, ledger, and promoted artifact paths are
      consistent.
- [ ] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The current default `page_limit=200` is too small for the full skill detail set. | High | High | Extend the profile contract up front, preflight the resolved source-set size, and fail before any live fetch if the planned batch set exceeds configured caps. |
| Redirects, disambiguation pages, and PvE/PvP title variants collapse into the wrong canonical page. | Medium | High | Make source-set resolution a dedicated phase with explicit disposition records and blocking QA diagnostics. |
| Description handling drifts into copied broad prose. | Medium | High | Separate structured evidence from runtime-facing projections, require field-level review where needed, and keep opaque rendered blobs out of promotion. |
| Progression template diversity is larger than the planned fixture corpus. | Medium | High | Preserve raw structured evidence, add exhaustive edge fixtures, and emit diagnostics instead of lossy normalization when unsupported. |
| EPIC-03 profession or attribute authority conflicts with skill infobox values. | Medium | High | Treat EPIC-03 as authoritative for joins, retain conflict evidence, and block promotion until resolved or explicitly excluded. |
| Full-catalog artifact size or test cost makes `npm run verify` slow or unstable. | Medium | Medium | Keep fixture data minimized, keep live work out of `verify`, and test focused modules directly instead of replaying full live refreshes. |
| Missing icon metadata is common across the catalog. | Medium | Medium | Keep icons nullable, surface QA findings, and do not block the whole catalog on optional metadata unless policy or integrity requires it. |
| Deterministic output drifts because batch order or source ordering changes. | Medium | High | Sort titles, sort records, fix the fixture clock, and assert byte-identical repeated generation plus stable finding IDs. |
| Exact-path allowlisting leaks extra generated files. | Low | High | Use parent re-ignore rules, exact-file exceptions only, and verify with `git check-ignore -v` plus working-tree inspection. |
| Live refresh is unavailable during implementation. | Medium | Medium | Complete contracts, extractors, and offline verification first; leave production promotion blocked until a bounded live refresh can be recorded. |

## Security Considerations

- Treat titles, redirects, page bodies, template parameters, file names, revision metadata, and QA
  evidence as untrusted input.
- Keep network access limited to explicit live mode, the fixed Guild Wars Wiki API origin, and the
  bounded EPIC-04 profile.
- Do not accept arbitrary source URLs, recursive crawls, or unbounded link expansion from source
  content.
- Bound page batches, request counts, continuation pages, response bytes, parser bytes, source-set
  size, and QA evidence excerpts.
- Parse wiki content as data only. Do not execute source-provided templates, HTML, JavaScript, Lua,
  shell content, or links.
- Preserve safe path confinement, canonical JSON writing, atomic artifact writes, and digest
  verification for snapshots and generated artifacts.
- Do not log or promote raw page bodies, copied descriptions, local secrets, cookies, or machine-
  specific paths.
- Keep remote media handling metadata-only; never download or cache icon bytes in this sprint.
- Keep raw snapshots, intermediate source-set output, QA text summaries, and live scratch output
  ignored unless a future exact-path ticket explicitly promotes them.

## Dependencies

- `EPIC-00` / `SPRINT-001` for repository structure, verification commands, synthetic fixtures, and
  the plain-data domain boundary.
- `EPIC-01` / `SPRINT-002` for source policy, provenance contracts, media restrictions, QA gates,
  and exact-path promotion rules.
- `EPIC-02` / `SPRINT-003` for the MediaWiki client, verified snapshots, parser adapter,
  metadata-only icon resolution, canonical artifact writing, and fixture/offline/live modes.
- `EPIC-03` / `SPRINT-004` for the approved professions/attributes catalog and template-crosswalk
  semantics used to normalize skill profession and attribute joins.
- Existing environment prerequisites remain Node.js `>=22.11.0`, npm `>=11.10.1`, Python `>=3.11`,
  and `npm run data:setup` for the pinned `mwparserfromhell` dependency.
- Guild Wars Wiki availability is required only for the bounded live refresh used for production
  promotion, not for routine verification.
- Manual review capacity is required for description-policy decisions, source contradictions, warning
  dispositions, and first-promotion review evidence.
- This sprint directly unblocks later work in EPIC-05 Template Compatibility, EPIC-06 Game Rule
  Engine, EPIC-08 Core Build Editor, and later search/tooltip/guide-authoring epics.

## Open Questions

No open question blocks execution. Defaults for this sprint:

1. EPIC-04 source discovery starts from `Guild Wars Wiki:Game integration/Skills/0`, resolves the
   full canonical detail-page set first, then fetches detail pages in deterministic title-sorted
   batches under explicit profile caps.
2. The promoted catalog stores structured description facts and tooltip/search projections; broad
   copied rendered prose remains review-gated and must not be required for baseline promotion.
3. One accepted skill ID produces one catalog record. PvE/PvP variants remain explicit linked
   records rather than merged overlays when the accepted source set yields distinct IDs.
4. Unsupported progression forms that would make tooltip or split behavior materially wrong block the
   affected record until resolved or excluded; less critical unsupported shapes may remain as raw
   structured evidence plus QA findings when the promoted projection stays correct.
5. Acquisition metadata is deferred unless the source-shape checkpoint proves a small factual field
   is both useful and policy-safe for later guide work.
6. EPIC-03 remains the authority for profession and attribute joins even when infobox wording differs
   or is incomplete.
7. `npm run verify` remains fully offline; live refresh is a separate manual promotion gate only.
