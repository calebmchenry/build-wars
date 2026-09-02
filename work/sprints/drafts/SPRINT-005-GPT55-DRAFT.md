---
id: SPRINT-005
title: Skills Catalog
status: draft
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

This sprint executes `EPIC-04 Skills` by extending the completed EPIC-02 ingestion spine and
EPIC-03 professions/attributes catalog into a runtime-eligible generated skills catalog. It covers
the full skill data path: skill ID source-set discovery, detail-page resolution, `Skill infobox`
extraction, cost and flag normalization, description handling, progression and split modeling,
metadata-only icon records, canonical artifact generation, QA, exact-path promotion, and closeout
documentation.

This is a content/data sprint. It does not build skill search UI, build-editor interactions,
template import/export, rule-engine enforcement, equipment behavior, title-track calculations,
runtime attribution display, guide content, PvX import, local storage, or runtime source fetching.
Later epics consume the approved generated catalog; they must not read raw snapshots, parser output,
QA reports, source manifests, Python modules, or wiki APIs at runtime.

The main architectural constraint is scale. EPIC-04 is the first high-volume source profile: a small
set of source-map pages fans out to many skill detail pages. Execution must keep live refreshes
manual-only, explicitly capped, batched, reproducible from snapshots, and ignored by default. The
profile should discover the source set from verified game-integration records instead of relying on
a hand-maintained title list or a one-off scraper.

The main policy constraint is skill description text. Numeric values, IDs, page titles, links,
flags, and file metadata are factual or metadata fields, but skill descriptions and rendered tooltip
wording may include publisher-owned game text or copied source text. The sprint must model
description fields deliberately, classify them field-by-field, and gate promoted runtime use on
review or explicit exclusion. Tooltip-ready output is required, but unreviewed copied page prose,
raw page bodies, screenshots, and cached media bytes are not.

## Use Cases

1. **Drive skill search later**: A future palette can filter and sort skills by ID, name,
   profession, attribute, campaign, type, elite status, PvE/PvP flags, cost kinds, activation,
   recharge, title dependency, and wiki URL from one approved catalog.
2. **Render dynamic tooltips later**: A future tooltip can read normalized costs, descriptions,
   progression blocks, split relationships, and metadata-only icon references without parsing
   wikitext or reading source snapshots.
3. **Decode templates later**: EPIC-05 can map authored skill template IDs to known skill records,
   explicit reserved/unsupported dispositions, or unknown authored IDs without compacting or
   inventing IDs.
4. **Validate builds later**: EPIC-06 can use profession/attribute joins, elite flags, PvE-only and
   PvP-only flags, common/no-attribute/special classifications, and cost metadata without scraping
   source pages.
5. **Support guide authoring later**: EPIC-19 can link to canonical wiki pages, inspect skill
   classifications, and optionally consume small reviewed acquisition facts if this sprint proves
   they are bounded and useful.
6. **Track balance-update diffs later**: Maintainers can compare semantic catalog versions, section
   digests, source revisions, and raw structured evidence after a wiki or game update.
7. **Refresh deliberately**: A maintainer can run a bounded live profile, inspect source revisions
   and QA findings, then replay offline from selected snapshots before promotion.
8. **Audit release evidence**: A reviewer can trace every promoted record and field to source IDs,
   snapshot manifests, transformation notes, manual reviews, QA dispositions, artifact digests, and
   the first-baseline review.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Domain contracts | Framework-neutral `SkillCatalog` contracts, branded skill/template IDs, cost unions, flag sets, description policy fields, progression references, split relationships, source-set records, and lookup helpers. | React state, UI components, DOM/browser APIs, local storage, template codecs, rule validation results, and imports from ingestion scripts. |
| Ingestion profile | EPIC-04 profile registration, source caps, source-map discovery, detail-page batching, exact snapshot selection, and fixture/offline/live orchestration through the existing pipeline. | A new scraper, arbitrary category crawling, browser automation, unbounded page expansion, ad hoc HTTP clients, or live network access during `npm run verify`. |
| Extraction | Snapshot-driven page resolution, infobox parsing, cost normalization, icon metadata resolution, progression parsing, PvE/PvP wrapper detection, diagnostics, and joins to the approved EPIC-03 catalog. | Runtime parsing, wiki-rendered HTML as the only source of truth, source facts inferred by array position, or duplicated profession/attribute catalogs. |
| Generated data | Exact promoted catalog, manifest, and machine-readable QA JSON under EPIC-04 paths after gates pass. | Broad generated-data commits, raw source snapshots, snapshot manifests, live run output, QA text summaries, icon bytes, thumbnails, screenshots, copied page bodies, or unreviewed prose. |
| Review and QA | Stable finding IDs, source-policy checks, copied-text risk checks, artifact integrity checks, baseline review, warning dispositions, and app/public release gates. | Public release by convention, reviewer-less manual overrides, `git add -f` as approval, or hidden acceptance of unsupported records. |
| Documentation and closeout | Profile commands, source authority, caps, artifact schema, exact paths, deferred behavior, verification, ticket status, sprint status, and ledger consistency. | Implementing downstream consumer UX or opening new epics inside this sprint. |

### Data Flow

```text
EPIC-04 profile
  -> accepted game-integration skill ID source map
  -> source-set resolver with redirects, gaps, duplicates, and dispositions
  -> explicit live fetch plan with batches, caps, retries, and fixed origin
  -> SourceSnapshotManifest records + ignored raw payloads
  -> offline/fixture snapshot loader
  -> detail-page extraction from verified snapshots
  -> EPIC-03 profession/attribute catalog joins
  -> progression, split, description, and icon normalization
  -> canonical SkillCatalog JSON + GeneratedArtifactManifest
  -> QaReport JSON + first-baseline review
  -> exact-path promotion after review and deterministic replay
```

Live mode owns network access and snapshot creation. Extractors consume loaded snapshot payloads and
source references. The same extraction, normalization, artifact, and QA code paths must run in
fixture, offline, and live modes.

### Source Authority

| Fact | Primary Authority | Cross-check | Conflict Handling |
| --- | --- | --- | --- |
| Skill IDs and initial page targets | `Guild Wars Wiki:Game integration/Skills/0` accepted source set | Detail page infobox ID and canonical title | Duplicate or conflicting IDs are blocking QA findings; IDs are never compacted. |
| Canonical page title and redirect target | MediaWiki page metadata from live snapshots | Source-map title and detail page title | Preserve requested, normalized, redirect, and canonical title evidence; ambiguous pages cannot become records silently. |
| Profession and attribute joins | Approved EPIC-03 generated catalog and crosswalks | Skill infobox profession/attribute fields | Unknown or conflicting joins produce QA findings; do not duplicate EPIC-03 facts in EPIC-04. |
| Campaign, type, elite, common, no-attribute, and mode flags | `Skill infobox` template fields | Categories or wrapper templates only as bounded diagnostics | Missing or contradictory fields are diagnosed; no UI-only inference. |
| Costs, activation, recharge, upkeep, overcast, sacrifice, adrenaline, and morale-boost recharge | `Skill infobox` plus supported cost/progression templates | Progression templates and fixture cases | Unsupported value forms block or require explicit reviewed disposition. |
| Description and tooltip wording | Structured skill page fields after source-policy classification | Raw template evidence and manual review | Public/runtime copied wording requires review; unreviewed prose is excluded or blocks promotion. |
| Progression values and rank dependencies | `Skill progression`, `gr`, `gr2`, title-rank progression, and related templates | Description placeholders and known fixture cases | Unsupported forms become QA findings rather than guessed scaling. |
| PvE/PvP split relationships | Explicit PvE/PvP wrapper templates and linked variant pages | Matching names, IDs, and reciprocal page evidence | Store bidirectional relationships where proven; ambiguous relationships block tooltip-ready promotion for affected records. |
| Icon metadata | Skill page image field plus MediaWiki `imageinfo` | File title, MIME type, dimensions, remote hash/timestamp | Metadata-only and nullable with QA disposition; cached bytes remain prohibited. |

Planning-time source assumptions are not release evidence. Execution must fetch or select fresh
verified snapshots before treating any source value as authoritative.

### Catalog Contract

Add a generated `SkillCatalog` envelope parallel to the EPIC-03 `ProfessionAttributeCatalog`.
Recommended top-level sections:

- `schemaVersion`, `catalogVersion`, `sectionDigests`, `generatedAt`, `generator`, and `profile`
- `sources`, `snapshotManifestPaths`, and source-set metadata
- `skillTemplateIds` or equivalent source-set records for accepted IDs, gaps, exclusions, and
  explicit dispositions
- `skills` for one promoted record per known catalog skill ID
- `progressions` or embedded progression blocks with stable IDs and normalized tooltip projections
- `remoteMedia` for metadata-only icon records
- `manualReviews` for release-scope decisions
- `generatedArtifactManifest` for the adjacent manifest shape

Skill identity should keep authored/template identity separate from catalog identity even if the
first catalog uses the same numeric value for both. If execution introduces `TemplateSkillId`, the
default mapping is `templateId == id` for known skills, with lookup outcomes for `known`,
`reserved`, `unsupported`, and `unknown`. Unknown authored IDs must remain representable without
creating fake `Skill` records.

Each skill record should include:

- stable numeric ID and template ID
- canonical name, normalized lookup key, canonical wiki URL, source page identity, and page revision
  facts
- campaign, profession ID/template ID, attribute ID/template ID, type, and classification fields
- costs and timings as explicit unions that distinguish missing, zero, not-applicable, numeric,
  percent, and special values
- flags for elite, PvE-only, PvP-only, PvE/PvP split, common, no-attribute, title, special, and
  non-player or unsupported behavior where source evidence requires it
- description fields classified by source policy, including raw structured field references,
  reviewed runtime text where allowed, and an explicit exclusion state where not allowed
- progression references and tooltip substitution metadata
- split relationship metadata
- nullable metadata-only icon reference
- field-level provenance claims and related QA/manual-review IDs

`catalogVersion` should derive from schema-owned runtime fields and exclude retrieval timestamps,
generation timestamps, raw source timing, QA paths, manifest paths, source ordering noise,
provenance-only timing, and its own value. Section digests should let later consumers detect changes
to identity, search fields, costs, descriptions, progressions, splits, and media independently.

### Description Policy

This sprint should not treat wiki-rendered descriptions alone as sufficient or automatically safe.
The implementation should define three separate concepts:

1. **Source evidence**: raw wikitext/template values and rendered source text used by extractors.
   This stays in ignored snapshots or bounded QA evidence unless explicitly reviewed.
2. **Structured tooltip data**: normalized costs, progression placeholders, rank dependencies,
   split selectors, and field references that Build Wars can compute from factual values.
3. **Runtime display text**: copied or near-copied description wording that may ship only after
   source-policy classification, provenance, and manual review for the release scope.

Promotion should require either reviewed runtime display text for every accepted skill that needs a
description, or explicit QA dispositions excluding unsafe text and documenting the resulting tooltip
limitations. Do not copy page bodies, notes, trivia, usage prose, community prose, or walkthrough
text into generated artifacts.

### Split And Progression Semantics

Represent one record per accepted skill ID. PvE/PvP variants remain separate records when they have
separate source IDs or pages, linked by a split relationship such as a stable group ID, mode, related
skill IDs, source evidence, and confidence/disposition. The catalog should not decide which variant
a build uses at runtime; EPIC-06 or later UI work owns mode selection.

Progression data should separate raw structured evidence from normalized tooltip projections. A
normalized progression block should identify its dependency kind (`attribute`, `title-rank`,
`mode`, `constant`, or `special`), rank domain, value sequences, value labels if source-supported,
and unsupported parse details. Non-monotonic progressions are allowed only when source evidence and
QA disposition say they are intentional.

### QA And Promotion

Exact promoted paths:

- `data/generated/epic-04/skills.catalog.json`
- `data/generated/epic-04/skills.catalog.manifest.json`
- `data/qa/epic-04/skills.catalog.qa.json`

Default ignored paths:

- raw source payloads and snapshot manifests
- live/offline candidate output outside the exact promoted paths
- text QA summaries
- icon binaries, thumbnails, screenshots, and other media bytes
- copied page bodies, unreviewed descriptions, broad parser output, and debug logs

Promotion requires:

- a locked EPIC-04 source profile with page, request, response-byte, parser-byte, continuation,
  retry, batch, and source-family limits
- one bounded live refresh when network/source conditions permit
- offline replay from the selected snapshots with fixed clock/configuration
- byte-identical repeated generation of catalog, manifest, QA JSON, source ordering, and finding IDs
- complete source references and field-level provenance for promoted records
- first-baseline review for the approved EPIC-04 artifact
- no open critical findings
- no open error findings for public release
- all warnings resolved, excluded, or accepted with named bounded review evidence
- `appConsumptionGate: pass` and `publicReleaseGate: pass`
- exact `.gitignore` allowlisting verified with `git check-ignore -v` and `git status --short`

## Implementation

### Phase 1: BW-0401 Skill Catalog Contracts And Profile Groundwork (~15% of effort)

**Files:**

- `src/domain/ids.ts`
- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/source.ts` only if existing provenance/QA vocabulary is insufficient
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/foundation.ts`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `work/tickets/04-skills/BW-0401-skill-catalog-contracts-and-profile.md`

**Tasks:**

- [ ] Confirm `SPRINT-001` through `SPRINT-004` and `EPIC-00` through `EPIC-03` are complete.
- [ ] Define `SkillCatalog`, skill records, source-set records, cost unions, description policy
      fields, progression references, split relationship records, manual review references, and
      section digest semantics.
- [ ] Add or confirm a `TemplateSkillId` concept so authored IDs can be represented separately from
      known catalog records; preserve non-contiguous IDs and unknown authored IDs.
- [ ] Keep skill records plain-data, JSON-compatible, and framework-neutral.
- [ ] Register an EPIC-04 profile without regressing EPIC-02 default behavior or EPIC-03 fixture,
      offline, and live profile behavior.
- [ ] Define profile caps for page count, request count, response bytes, parser bytes,
      continuation pages, detail-page batch size, retry budget, and source family.
- [ ] Define source-policy classification defaults for names, IDs, costs, flags, descriptions,
      progression values, icons, and optional acquisition metadata.
- [ ] Add focused TypeScript and Python tests for catalog wire shape, ID lookups, cost variants,
      split records, description review states, and profile selection.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles`

### Phase 2: BW-0402 Skill Source Set And Page Resolution (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_ids.py`
- `scripts/data/build_wars_ingest/skill_source_set.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/tests/test_skill_source_set.py`
- `test/fixtures/data-ingestion/skills/source-set/`
- `work/tickets/04-skills/BW-0402-skill-source-set-and-page-resolution.md`

**Tasks:**

- [ ] Reuse and harden the existing game-integration skill ID enumerator for the full accepted
      EPIC-04 source set.
- [ ] Resolve every accepted skill ID to a canonical detail-page target or explicit QA disposition.
- [ ] Preserve requested title, normalized title, redirect target, canonical title, page ID,
      revision ID, source revision timestamp, retrieval timestamp, source ID, and snapshot manifest
      path.
- [ ] Detect duplicate IDs, duplicate titles, missing targets, malformed mappings, unexpected ID
      gaps, high-ID outliers, redirects, disambiguation pages, missing detail pages, PvE/PvP title
      variants, and ambiguous split pages.
- [ ] Teach live mode to fetch large detail-page sets in deterministic batches under explicit caps
      while writing ignored snapshots.
- [ ] Teach offline mode to select only EPIC-04 snapshot manifests and fail clearly when the selected
      source set is incomplete.
- [ ] Add minimized fixtures for duplicates, redirects, disambiguation preambles, missing pages,
      malformed game links, PvE/PvP variants, non-contiguous IDs, and stable finding IDs.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_source_set`
- `npm run data:test`
- One bounded live dry-run or smoke command if network/source conditions permit

### Phase 3: BW-0403 Skill Infobox And Field Extractors (~25% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_infobox.py`
- `scripts/data/build_wars_ingest/skills_catalog.py`
- `scripts/data/build_wars_ingest/profession_attribute_catalog.py` only for read/adapter helpers if needed
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_skill_infobox.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/skills/infobox/`
- `test/domain/skill-catalog.test.ts`
- `work/tickets/04-skills/BW-0403-skill-infobox-and-field-extractors.md`

**Tasks:**

- [ ] Parse `Skill infobox` fields for name, ID, campaign, profession, attribute, type, image,
      elite/common flags, PvE/PvP flags, special classifications, costs, activation, recharge, and
      raw structured description fields.
- [ ] Normalize profession and attribute references through the approved EPIC-03 catalog and
      crosswalks, never by duplicated local tables or array position.
- [ ] Model cost fields as explicit unions for numeric, percent, zero, missing, not-applicable, and
      special cases including signets, adrenaline, sacrifice, upkeep, overcast, activation,
      recharge, and morale-boost recharge.
- [ ] Classify description-related fields by source policy and separate source evidence, structured
      tooltip data, reviewed runtime text, and excluded unsafe text.
- [ ] Resolve skill icon metadata through `imageinfo` with `cachedBytes: false`; do not download,
      cache, bundle, or commit media bytes.
- [ ] Keep acquisition metadata deferred unless the source-shape checkpoint proves a small factual
      field is useful, bounded, provenance-friendly, and reviewable.
- [ ] Emit diagnostics for missing infoboxes, malformed parameters, unknown cost forms, unknown
      professions, unknown attributes, unknown skill types, ambiguous flags, missing icons, copied
      text risk, source-reference gaps, and stale revision metadata.
- [ ] Add fixtures for elite, signet, adrenaline, sacrifice, upkeep, overcast, title, no-attribute,
      common, PvE-only, PvP-only, special, missing-cost, missing-icon, and malformed-infobox cases.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_infobox`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_icons`
- `npm run test:run -- test/domain/skill-catalog.test.ts`
- `npm run data:test`

### Phase 4: BW-0404 Skill Progression, Splits, And Tooltip Data (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_progression.py`
- `scripts/data/build_wars_ingest/skills_catalog.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_skill_progression.py`
- `test/fixtures/data-ingestion/skills/progression/`
- `test/domain/skill-catalog.test.ts`
- `work/tickets/04-skills/BW-0404-skill-progression-splits-and-tooltip-data.md`

**Tasks:**

- [ ] Parse supported `Skill progression`, `gr`, `gr2`, title-rank progression, morale-boost
      recharge, `PvE version`, `PvP version`, and related wrapper templates from verified snapshots.
- [ ] Represent attribute-rank, title-rank, mode-specific, constant, and special progressions with
      explicit dependency kind, rank domain, value sequences, labels where known, and provenance.
- [ ] Preserve raw structured progression evidence separately from normalized tooltip projections
      without committing copied page bodies.
- [ ] Link PvE/PvP split records bidirectionally when source evidence proves the relationship.
- [ ] Detect malformed green-number ranges, unsupported progression templates, duplicate split
      relationships, missing reciprocal variants, impossible dependencies, title-rank limit issues,
      and intentionally non-monotonic values.
- [ ] Make unsupported progression forms produce QA findings instead of guessed tooltip values.
- [ ] Add fixtures for standard attribute scaling, multi-value progressions, title-rank scaling,
      morale-boost recharge, split pages, wrappers, constant descriptions, no-progression skills,
      malformed progressions, and ambiguous variants.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_progression`
- `npm run test:run -- test/domain/skill-catalog.test.ts`
- `npm run data:test`

### Phase 5: BW-0405 Catalog Assembly, QA, Baseline, And Exact-Path Promotion (~15% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skills_catalog.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_skills_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json`
- `test/domain/data-ingestion-contracts.test.ts`
- `.gitignore`
- `data/generated/epic-04/skills.catalog.json`
- `data/generated/epic-04/skills.catalog.manifest.json`
- `data/qa/epic-04/skills.catalog.qa.json`
- `work/tickets/04-skills/BW-0405-skills-catalog-qa-and-promotion.md`

**Tasks:**

- [ ] Assemble one canonical `SkillCatalog` envelope with source-set records, skill records,
      progression data, split relationships, remote media, manual reviews, section digests, semantic
      catalog version, and generated artifact manifest.
- [ ] Validate all accepted skill template IDs resolve to catalog records or explicit QA
      dispositions.
- [ ] Add profile-specific QA for missing icons, costs, descriptions, progressions, split
      relationships, duplicate IDs, duplicate names, source references, revision facts, copied-text
      risk, malformed templates, artifact digests, schema shape, and release gates.
- [ ] Classify baseline diffs as first-baseline, semantic, provenance-only, formatting/order,
      schema, or unchanged.
- [ ] Run fixed-clock fixture generation twice and prove byte-identical catalog, manifest, QA JSON,
      source ordering, and finding IDs.
- [ ] Run an EPIC-04 offline replay from selected snapshots after a bounded live refresh when
      network/source conditions permit.
- [ ] Promote only the exact EPIC-04 catalog, manifest, and QA JSON paths after QA gates and review
      dispositions pass.
- [ ] Verify `.gitignore` allowlisting with parent re-ignore patterns, exact-file exceptions,
      `git check-ignore -v`, and `git status --short`.

**Verification:**

- `npm run data:regenerate`
- `npm run data:test`
- Focused artifact, QA, pipeline, CLI, and generated-contract tests
- One bounded manual live refresh followed by deterministic offline replay when available

### Phase 6: BW-0406 Documentation, Verification, And Closeout (~5% of effort)

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/skills-catalog.md`
- `compendium/README.md`
- `package.json` only if existing commands cannot expose the needed profile cleanly
- `work/tickets/04-skills/EPIC.md`
- `work/tickets/04-skills/BW-0401-skill-catalog-contracts-and-profile.md`
- `work/tickets/04-skills/BW-0402-skill-source-set-and-page-resolution.md`
- `work/tickets/04-skills/BW-0403-skill-infobox-and-field-extractors.md`
- `work/tickets/04-skills/BW-0404-skill-progression-splits-and-tooltip-data.md`
- `work/tickets/04-skills/BW-0405-skills-catalog-qa-and-promotion.md`
- `work/tickets/04-skills/BW-0406-docs-verification-and-closeout.md`
- `work/sprints/SPRINT-005.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Document EPIC-04 profile commands, source-set discovery, caps, fixture/offline/live modes,
      selected snapshot replay, exact promoted paths, QA gates, baseline review, and refresh steps.
- [ ] Document source-policy decisions for skill descriptions, raw structured fields, rendered
      tooltip text, progression data, split relationships, icons, and optional acquisition fields.
- [ ] Document that the catalog is runtime-eligible data, not a runtime app import completed by this
      sprint.
- [ ] Document deferred behavior for template import/export, UI search, runtime attribution display,
      PvE/PvP mode selection, rule enforcement, equipment/rune/title effects, hero/monster-only
      behavior, guide prose, PvX data, and balance-update diff UX.
- [ ] Run focused checks, fixture regeneration, offline replay when snapshots exist, and
      `npm run verify`.
- [ ] Inspect the diff for raw snapshots, broad generated paths, source manifests, copied prose,
      icon bytes, screenshots, secrets, absolute machine paths, nondeterministic timestamps, and
      unrelated changes.
- [ ] Mark BW-0401 through BW-0406 done only after phase acceptance passes. Mark EPIC-04,
      SPRINT-005, and the ledger done only after the full Definition of Done passes.
- [ ] Do not create a commit.

**Verification:**

- `npm run data:regenerate`
- `npm run verify`
- `git status --short`
- `git check-ignore -v` checks for raw outputs and exact-path promoted exceptions

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/ids.ts` | Modify | Add or confirm skill/template ID brands and unknown authored ID support. |
| `src/domain/catalog.ts` | Modify | Add generated `SkillCatalog`, skill records, costs, flags, descriptions, progressions, splits, source-set records, and section digests. |
| `src/domain/catalog-lookup.ts` | Modify | Add pure skill/template lookup helpers and collision-safe name lookup behavior. |
| `src/domain/source.ts` | Modify narrowly if needed | Reuse source, provenance, media, manifest, QA, and review contracts; extend vocabulary only when required. |
| `src/domain/index.ts` | Modify | Export new public domain contracts and helpers. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register EPIC-04 profile with source pages, generated paths, QA paths, fixture paths, and caps. |
| `scripts/data/build_wars_ingest/skill_ids.py` | Modify | Harden game-integration ID enumeration for full source-set discovery. |
| `scripts/data/build_wars_ingest/skill_source_set.py` | Create | Resolve accepted skill IDs to canonical detail pages, redirects, gaps, and dispositions. |
| `scripts/data/build_wars_ingest/skill_infobox.py` | Create | Extract skill infobox fields, costs, flags, descriptions, and source diagnostics. |
| `scripts/data/build_wars_ingest/skill_progression.py` | Create | Extract progressions, wrappers, split relationships, and tooltip-ready normalized values. |
| `scripts/data/build_wars_ingest/skills_catalog.py` | Create | Assemble canonical catalog, semantic projection, section digests, baseline data, and QA inputs. |
| `scripts/data/build_wars_ingest/icons.py` | Modify | Resolve metadata-only skill icon records and related diagnostics. |
| `scripts/data/build_wars_ingest/wikitext.py` | Modify | Add bounded helper behavior for skill infobox/progression template shapes. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Support EPIC-04 artifact metadata, semantic diff classification, and deterministic writes. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add profile-specific QA checks while preserving shared QA report wire format. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate EPIC-04 fixture, offline, and live profile modes from snapshots. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Expose profile selection, live caps, bounded source plans, and summaries. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Python unit tests for source sets, infobox extraction, progressions, catalog assembly, artifacts, QA, pipeline, and CLI. |
| `test/domain/contracts.test.ts` | Modify | Contract regressions for skill IDs, cost unions, flags, descriptions, progressions, and split relationships. |
| `test/domain/skill-catalog.test.ts` | Create | Generated skill catalog lookup, serialization, tooltip data, and versioning tests. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Cross-language generated artifact compatibility for EPIC-04. |
| `test/fixtures/data-ingestion/skills/` | Create | Minimized source-shape fixtures for source sets, infoboxes, descriptions, progressions, splits, and icons. |
| `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json` | Create | Synthetic golden fixture catalog for fixture regeneration and contract tests. |
| `data/generated/epic-04/skills.catalog.json` | Create/allowlist | Runtime-eligible generated skills catalog. |
| `data/generated/epic-04/skills.catalog.manifest.json` | Create/allowlist | Generated artifact manifest and digest evidence. |
| `data/qa/epic-04/skills.catalog.qa.json` | Create/allowlist | Machine-readable QA and release-gate evidence. |
| `.gitignore` | Modify narrowly | Exact-path allowlisting for the promoted catalog, manifest, and QA JSON while keeping broad outputs ignored. |
| `package.json` | Modify only if necessary | Prefer existing regenerate/verify commands; change only if profile access cannot be documented otherwise. |
| `README.md` | Modify | Document EPIC-04 catalog status, commands, and runtime consumption boundary. |
| `scripts/data/README.md` | Modify | Document EPIC-04 profile, source-set caps, modes, replay, live refresh, and troubleshooting. |
| `data/README.md` | Modify | Document generated-data lifecycle and EPIC-04 exact-path exception. |
| `data/generated/README.md` | Modify | Document promoted skill catalog and manifest paths. |
| `data/qa/README.md` | Modify | Document promoted EPIC-04 QA JSON and non-runtime status. |
| `compendium/data-ingestion-platform.md` | Modify | Record profile extension and high-volume source-set conventions. |
| `compendium/skills-catalog.md` | Create | Durable EPIC-04 assumptions, source authority, description policy, split/progression semantics, and deferred behavior. |
| `compendium/README.md` | Modify | Index the skills catalog note. |
| `work/tickets/04-skills/*.md` | Modify during execution | Ticket status, sprint linkage, acceptance evidence, and closeout notes. |
| `work/sprints/SPRINT-005.md` | Modify during execution | Sprint execution state and checklist. |
| `work/sprints/ledger.tsv` | Modify during execution | Sprint lifecycle record. |

## Definition of Done

- [ ] BW-0401 through BW-0406 are linked to SPRINT-005 and completed in dependency order.
- [ ] EPIC-04, SPRINT-005, and `work/sprints/ledger.tsv` are marked complete only after all
      technical and process criteria pass.
- [ ] Existing EPIC-02 default fixture behavior and EPIC-03 profile behavior remain compatible.
- [ ] `src/domain` remains plain-data and does not import React, DOM/browser APIs, storage, network
      clients, filesystem APIs, app modules, or data scripts.
- [ ] The generated `SkillCatalog` wire shape is validated by Python output and TypeScript tests.
- [ ] Skill IDs and authored/template IDs are numeric, non-compacted, and never inferred from array
      position, source row order, or dense ranges.
- [ ] Unknown authored skill IDs remain representable without fake catalog records.
- [ ] Every accepted skill ID from the EPIC-04 source set resolves to one catalog record or an
      explicit QA disposition.
- [ ] Duplicate skill IDs, duplicate titles, redirects, missing targets, disambiguation pages,
      malformed mappings, PvE/PvP title variants, and non-contiguous gaps are represented as records,
      exclusions, or stable diagnostics.
- [ ] The EPIC-04 profile is bounded by named source pages, source family, page limits, request
      limits, response byte caps, parser byte caps, continuation limits, retry limits, and
      detail-page batch limits.
- [ ] Fixture mode is synthetic, minimized, offline, and deterministic.
- [ ] Live mode requires explicit opt-in and `--allow-live-network`; automated verification does not
      require network access.
- [ ] Offline replay selects EPIC-04 snapshots explicitly and does not scan unrelated EPIC-02 or
      EPIC-03 snapshots.
- [ ] Skill records include IDs, names, normalized names, canonical wiki URLs, campaign, profession,
      attribute, type, costs, flags, descriptions or exclusions, progression references, split
      relationships, provenance, and nullable metadata-only icon references.
- [ ] Profession and attribute references are joined through the approved EPIC-03 catalog and
      crosswalks.
- [ ] Cost fields distinguish missing, zero, not-applicable, numeric, percent, and special values.
- [ ] Elite, PvE-only, PvP-only, PvE/PvP split, common, no-attribute, title, special, and
      non-player/unsupported classifications are representable without UI logic.
- [ ] Description fields are classified by source policy; runtime display text is reviewed or
      explicitly excluded with QA disposition.
- [ ] No unreviewed copied page prose, guide prose, notes, trivia, walkthrough text, source page
      bodies, screenshots, or external media bytes are promoted.
- [ ] Progression metadata can drive dynamic tooltips without reading source wikitext.
- [ ] Supported progressions cover attribute ranks, title ranks, constants, multiple values,
      morale-boost recharge, and mode-specific variants.
- [ ] Unsupported or malformed progression forms produce QA findings rather than guessed values.
- [ ] PvE/PvP split relationships are explicit and bidirectional where source evidence exists.
- [ ] The catalog does not implement runtime mode selection, rule validation, template codecs, or UI
      tooltip rendering.
- [ ] Metadata-only icon records have `cachedBytes: false`; no icon binaries, thumbnails,
      screenshots, or cached media are tracked.
- [ ] Every generated record, field claim, media record, review, manifest, and QA report has
      resolvable source/provenance references.
- [ ] QA flags missing icons, costs, descriptions, progressions, split relationships, malformed
      templates, duplicate IDs, duplicate titles, missing source references, stale revision metadata,
      copied-text risk, source-family drift, schema shape errors, and artifact integrity mismatches.
- [ ] Unknown copied material, unreadable artifacts, digest mismatches, and cached media bytes are
      non-waivable for public release.
- [ ] A first-baseline review is recorded for the approved EPIC-04 catalog.
- [ ] Future baseline diffs classify semantic, provenance-only, formatting/order, schema, and
      unchanged cases.
- [ ] Repeated fixture/offline generation with fixed inputs and clock produces byte-identical
      catalog, manifest, QA JSON, source ordering, and finding IDs.
- [ ] A bounded live refresh is completed for production promotion when network/source conditions
      permit, then replayed offline from the selected snapshots.
- [ ] The promoted catalog, manifest, QA report, baseline review, and documentation reference the
      same selected snapshot set and source revisions.
- [ ] `appConsumptionGate` and `publicReleaseGate` are `pass`; critical/error findings are closed;
      warnings are resolved, excluded, or accepted with bounded review evidence.
- [ ] Only the exact EPIC-04 catalog JSON, manifest JSON, and QA JSON paths are allowlisted.
- [ ] `git check-ignore -v` and `git status --short` prove raw snapshots, snapshot manifests,
      candidates, live logs, text summaries, broad generated outputs, and media bytes remain ignored
      or absent.
- [ ] The catalog alone is runtime-eligible; app code does not import manifests, QA reports,
      snapshots, parser output, Python tooling, or wiki APIs.
- [ ] `npm run data:regenerate` passes offline and is deterministic.
- [ ] `npm run verify` passes with network access unnecessary.
- [ ] README, data docs, script docs, compendium, generated artifacts, QA report, tickets, sprint,
      ledger, and result manifest agree on IDs, paths, modes, assumptions, gates, and status.
- [ ] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Full skill catalog volume exceeds existing profile assumptions | High | High | Add source-set batching, explicit caps, selected snapshot manifests, fixture minimization, and deterministic offline replay before full live promotion. |
| Source-map pages are incomplete or shaped differently than expected | Medium | High | Make BW-0402 a source-shape gate; preserve every accepted ID, exclusion, and diagnostic instead of silently crawling. |
| Redirects, disambiguation pages, or split pages map to the wrong skill | Medium | High | Store requested/canonical title evidence, reject ambiguous detail targets, and require reciprocal split evidence. |
| Skill descriptions violate source policy if copied into runtime data | High | High | Separate evidence, structured tooltip data, reviewed runtime text, and exclusions; block or exclude unreviewed copied prose. |
| Progression parsing misses rare templates or malformed values | High | High | Build a dedicated progression phase with minimized fixtures, unsupported-form diagnostics, and promotion blockers for tooltip-critical fields. |
| Cost semantics collapse special cases into numbers | Medium | High | Use explicit unions for missing, zero, not-applicable, numeric, percent, and special values; test signets, adrenaline, sacrifice, upkeep, and overcast. |
| Profession/attribute facts drift from EPIC-03 | Medium | High | Treat EPIC-03 as the join authority and surface unknown or conflicting source values as QA findings. |
| Template IDs are mistaken for dense array indexes | Medium | High | Preserve non-contiguous IDs, add lookup outcomes, and test unknown authored IDs and high-ID gaps. |
| PvE/PvP split modeling leaks rule-engine behavior into the catalog | Medium | Medium | Store relationships and mode metadata only; defer runtime selection and validation to later epics. |
| Acquisition metadata expands the sprint into guide content | Medium | Medium | Default to deferred; include only small factual fields after source-shape proof and review. |
| Live wiki refresh is unavailable or too slow during execution | Medium | Medium | Keep fixture and offline implementation complete; leave production promotion blocked with clear QA evidence if live refresh cannot be run. |
| Generated-data allowlisting accidentally commits broad outputs | Low | High | Use exact parent re-ignore rules, exact-file exceptions, `git check-ignore -v`, and manual diff inspection. |
| QA reports or summaries include source payload or local sensitive data | Medium | High | Bound evidence excerpts, keep summaries ignored unless explicitly approved, avoid raw page bodies, and inspect artifacts before promotion. |
| Semantic catalog version excludes a runtime field | Medium | High | Define schema-owned semantic projection fields and add mutation tests for identity, search, cost, description, progression, split, and media sections. |
| Existing regenerate commands become slow | Medium | Medium | Keep `npm run verify` on minimized fixture data; require full live/offline refreshes only through explicit profile commands. |

## Security Considerations

- Treat source titles, redirects, wikitext, template parameters, rendered text, file titles, URLs,
  revision metadata, snapshots, manifests, generated artifacts, baselines, and QA evidence as
  untrusted input.
- Network access is allowed only in explicit live mode with `--allow-live-network`, the locked
  EPIC-04 profile, bounded request parameters, fixed Guild Wars Wiki API origin, finite timeouts,
  retry limits, continuation limits, response byte caps, and a descriptive User-Agent.
- Do not accept arbitrary source URLs, source-provided fetch targets, recursive category crawls,
  unbounded link expansion, credentials, cookies, tokens, environment secrets, or local
  machine-specific configuration.
- Parse wiki content as data. Do not execute templates, Lua, HTML, JavaScript, shell snippets,
  command examples, links, or source-provided instructions.
- Bound title batches, page counts, request counts, continuation pages, response bytes, parser input,
  template traversal, table/list rows, output bytes, QA evidence excerpts, and log summaries.
- Preserve path confinement, safe slugs, symlink-escape checks where practical, atomic writes,
  finite-number checks, stable ordering, and SHA-256 verification for artifacts.
- Do not log raw page bodies, unbounded wikitext, headers, secrets, local environment values,
  copied descriptions, or complete QA evidence dumps.
- Store skill icon metadata only. Do not fetch, cache, transform, commit, bundle, or test against
  remote icon bytes, thumbnails, screenshots, or other media assets.
- Keep source snapshots, snapshot manifests, live outputs, candidate artifacts, parser dumps, QA
  summaries, and review scratch files ignored unless an explicit later ticket names exact paths and
  scope.
- Runtime app code must not read QA reports, manifests, snapshots, ignored artifacts, parser output,
  source APIs, or Python tooling.

## Dependencies

- `EPIC-00` / `SPRINT-001` for repository shape, TypeScript/Vite tooling, domain boundaries,
  synthetic fixtures, and `npm run verify`.
- `EPIC-01` / `SPRINT-002` for source policy, provenance, manual review, media restrictions,
  artifact retention, QA gates, exact-path promotion rules, and copied-content handling.
- `EPIC-02` / `SPRINT-003` for the Guild Wars Wiki MediaWiki client, snapshots,
  `mwparserfromhell`, skill ID enumeration proof, metadata-only icon resolution, canonical artifact
  writing, QA reports, and fixture/offline/live regenerate modes.
- `EPIC-03` / `SPRINT-004` for the approved professions/attributes catalog, template profession and
  attribute crosswalks, allocation assumptions, source-profile patterns, exact-path promotion, and
  generated-data QA practices.
- Existing prerequisites remain Node.js `>=22.11.0`, npm `>=11.10.1`, Python `>=3.11`, and
  `npm run data:setup` for the pinned data parser dependency.
- Guild Wars Wiki availability is required only for production live refresh and promotion; automated
  verification remains offline.
- Manual review capacity is required for description text, copied-text risk, source contradictions,
  unsupported progression dispositions, warning dispositions, baseline creation, and exact-path
  promotion.
- Downstream consumers are EPIC-05 Template Compatibility, EPIC-06 Game Rule Engine, EPIC-08 Core
  Build Editor, EPIC-15 Title Tracks and PvE-only, EPIC-19 Guide Authoring, and EPIC-20 Search and
  Discovery.

## Open Questions

1. **Exact profile caps**: What are the final page, request, byte, continuation, retry, and batch
   limits for EPIC-04 live refreshes? Default: BW-0401/BW-0402 must lock conservative values before
   the first full live run; no unbounded fallback is allowed.
2. **Description release policy**: Which description fields are safe for runtime tooltip/search use?
   Default: include runtime display text only after field-level source-policy classification and
   manual review; otherwise exclude with QA disposition and document tooltip limitations.
3. **Source-set completeness**: Is `Guild Wars Wiki:Game integration/Skills/0` sufficient as the
   accepted source set, or are additional game-integration skill pages required? Default: the profile
   starts from the accepted intent source and may add named bounded source pages only if the
   source-shape checkpoint proves they are part of the same authoritative map.
4. **PvE/PvP split shape**: Should one variant be marked canonical for display? Default: no runtime
   canonical mode is selected in this sprint; records remain separate by ID and link bidirectionally
   with mode metadata.
5. **Unsupported progressions**: Which unsupported progression forms block promotion? Default:
   unsupported forms block promotion when they affect accepted tooltip-ready fields; non-tooltip
   evidence can be excluded or accepted with reviewed QA disposition.
6. **Acquisition metadata**: Should skill acquisition facts ship in EPIC-04? Default: defer entirely
   unless implementation proves a small factual field is guide-useful, source-policy safe,
   deterministic, and reviewable.
7. **Special and non-player skills**: Should monster-only, environmental, or otherwise unsupported
   skills in the accepted ID map become catalog records? Default: include accepted IDs with explicit
   classification and downstream-eligibility flags, or exclude with QA disposition if the source
   shape cannot support safe runtime use.
