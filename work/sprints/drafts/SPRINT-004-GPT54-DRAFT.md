---
id: SPRINT-004
title: Professions and Attributes Catalog
status: planned
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

This sprint turns `EPIC-03 Professions and Attributes` into one deterministic, provenance-bearing
catalog increment that later template, rule-engine, skill, and editor epics can consume. It extends
the EPIC-02 ingestion spine under `scripts/data/build_wars_ingest` instead of introducing a new
scraper, runtime fetch path, or parallel provenance model.

The sequencing priority is to lock identity semantics and domain shapes first, then normalize the
factual profession and attribute catalog, then add allocation rules, then close the only materially
ambiguous scope item: primary-attribute effect summaries. Promotion of any runtime-facing artifact
happens last, after deterministic verification and QA closeout.

This sprint is intentionally bounded. It does not build full skill ingestion, template import/export,
rule-engine enforcement, or editor UI. Its job is to commit stable profession and attribute data plus
the verification surfaces those later epics depend on.

## Use Cases

1. A template-compatibility feature can map profession template id `0` to `null`, map non-zero
   profession ids to playable professions, and map non-contiguous attribute ids without depending on
   array order.
2. A rule-engine feature can verify that an allocated attribute belongs to the selected profession
   pair, that a primary-only attribute is not used illegally, and that point totals are checked
   against level and quest assumptions.
3. A build editor can render profession and attribute selectors from generated data that includes
   names, abbreviations, primary attributes, and metadata-only icon references.
4. Later skill-display work can look up primary attributes and reviewed effect summaries without
   scraping source pages at runtime.
5. A reviewer can trace every generated profession and attribute field back to verified source pages,
   revisions, retrieval timestamps, and QA findings.
6. A maintainer can rerun fixture mode offline, compare deterministic output, and optionally perform
   one bounded live refresh against named Guild Wars Wiki pages before promoting updated catalog data.

## Architecture

### Boundary Rules

| Concern | Owner | Boundary |
| --- | --- | --- |
| Domain contracts | `src/domain` | Plain-data TypeScript contracts for catalog records and validation inputs. No React, DOM, network, or `scripts/data` imports. |
| Ingestion extractors | `scripts/data/build_wars_ingest` | Snapshot-driven normalization only. No one-off HTTP clients or profession-specific scrapers. |
| Raw snapshots | `data/source-snapshots` | Ignored local source payloads and snapshot manifests. Never runtime input. |
| Generated catalog | `data/generated/epic-03` | Canonical generated JSON plus manifest. Promote only exact paths after QA closeout. |
| QA reports | `data/qa/epic-03` | Ignored local QA JSON and summaries. Review input only, not runtime data. |
| Runtime consumers | Later epics | May consume only approved generated catalog paths, never raw snapshots or QA reports. |

### Source Authority

- `Skill template format` is the primary authority for profession and attribute template ids,
  including the profession `0` -> `None` sentinel and non-contiguous attribute ids.
- `Profession` is the primary authority for the playable profession set, names, abbreviations,
  campaign availability, and primary-attribute relationships, with individual profession pages used
  only when a required factual field is missing or ambiguous.
- `Attribute` is the primary authority for attribute names, profession ownership, and
  primary-only classification, cross-checked against the profession catalog.
- `Attribute point` is the primary authority for numeric allocation rules: rank costs, cumulative
  totals, level-based budgets, quest reward metadata, and default level-20 assumptions.
- Individual primary-attribute or profession pages may be consulted for effect facts needed to
  author reviewed derived summaries. Copied page prose is not a valid fallback.

### Data Model Decisions

- `ProfessionId` values in the committed catalog are the non-zero template-compatible ids for the
  ten playable professions only.
- Template profession id `0` is represented in crosswalk and template-compatibility helpers as
  `null`, not as an eleventh profession record.
- `AttributeId` values are the actual template-compatible ids and must preserve gaps exactly.
- Profession icon handling remains metadata-only through `RemoteMediaMetadata`-compatible records.
  No icon bytes, screenshots, or thumbnails are downloaded or committed.
- Primary-attribute effect summaries are stored as bounded derived summaries with field-level
  provenance and manual review metadata, not copied contributor or publisher prose.
- The runtime-facing output should be one combined artifact containing `professions`, `attributes`,
  `templateCrosswalks`, and `attributePointRules` so downstream consumers do not need multi-file
  joins for core validation.

### Data Flow

```text
Skill template format snapshot
  -> template id crosswalk
Profession snapshot
  -> profession normalizer
Attribute snapshot
  -> attribute normalizer
Attribute point snapshot
  -> allocation-rule normalizer
Primary attribute / profession pages (only if needed)
  -> reviewed derived summaries
all normalized records
  -> combined EPIC-03 catalog artifact
  -> QA report and summary
  -> exact-path promotion gate
```

### Artifact Layout

The sprint should produce these stable paths:

- `test/fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`
- `data/qa/epic-03/professions-attributes.catalog.qa.json`
- `data/qa/epic-03/professions-attributes.catalog.summary.txt`

Only the promoted generated catalog JSON and its manifest should become tracked runtime-facing
artifacts. Raw snapshots and QA outputs stay ignored by default.

## Implementation

### Execution Bookkeeping

- [ ] Ensure `BW-0301` through `BW-0306` ticket files exist and are linked from `EPIC-03` before
      implementation begins.
- [ ] Move `SPRINT-004`, `EPIC-03`, and only the active BW ticket through the status vocabulary as
      each phase starts and closes.
- [ ] Preserve unrelated working tree changes and avoid destructive git operations or sprint-created
      commits.

**Verification**

- Manual review of sprint, ticket, and ledger status consistency before and after execution.

### Phase 1: `BW-0301` Catalog Contracts And Template Identity Surface (~15%)

**Files**

- `src/domain/catalog.ts`
- `src/domain/build.ts`
- `src/domain/ids.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/foundation.ts`

**Tasks**

- [ ] Extend `src/domain/catalog.ts` with durable profession and attribute shapes that can express
      campaign availability, metadata-only icon references, primary attributes, profession
      ownership, primary-only flags, and nullable reviewed effect summaries.
- [ ] Add plain-data validation-input types for attribute point costs, cumulative totals,
      level-based budgets, quest reward metadata, and default allocation assumptions in the narrowest
      compatible domain location.
- [ ] Decide and codify id semantics: playable profession ids are non-zero template ids, profession
      template `0` maps to `null`, and attribute ids preserve template gaps exactly.
- [ ] Define the generated artifact envelope and catalog-version shape so Python output and
      TypeScript consumers target one stable wire format.
- [ ] Keep `src/domain` JSON-compatible and independent from runtime state, browser APIs, source
      fetch logic, or filesystem concerns.

**Verification**

- `npm run test:run`
- Focused Vitest contract tests for `0` sentinel handling, gap-preserving attribute ids, and
  JSON-serializable rule tables

**Phase Acceptance**

- The domain layer can represent every required EPIC-03 fact without coupling to app code or data
  scripts.
- No downstream extractor or consumer needs to infer identity from array position or display order.

### Phase 2: `BW-0302` Snapshot Coverage And Template Crosswalk Extraction (~15%)

**Files**

- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/template_ids.py`
- `scripts/data/build_wars_ingest/tests/test_template_ids.py`
- `test/fixtures/data-ingestion/`
- `scripts/data/README.md`

**Tasks**

- [ ] Add fixture, offline, and live coverage for `Skill template format`, `Profession`,
      `Attribute`, and `Attribute point`, keeping live refresh bounded to named titles only.
- [ ] Implement a template-crosswalk extractor from verified `Skill template format` snapshots.
- [ ] Emit deterministic profession and attribute id crosswalks, including `0 -> null`,
      gap-preserving attribute ids, and reverse lookup by normalized name.
- [ ] Report duplicate ids, duplicate names, malformed rows, missing `None` sentinel, redirect
      ambiguity, and name drift between template-format rows and catalog-page rows.
- [ ] Keep `Skill template format` authoritative for ids and use the other pages as completeness and
      consistency checks only.

**Verification**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_template_ids`
- `npm run data:test`

**Phase Acceptance**

- Crosswalk output is deterministic and independent of profession or attribute table ordering.
- The repo has an explicit transport-level representation for template sentinel values that is
  separate from runtime catalog records.

### Phase 3: `BW-0303` Profession Catalog Normalization (~20%)

**Files**

- `scripts/data/build_wars_ingest/professions.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_professions.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/`

**Tasks**

- [ ] Add `professions.py` to parse the profession source table or tables into ten playable
      profession records.
- [ ] Normalize name, abbreviation, campaign availability, primary attribute id, and icon metadata
      reference for each profession.
- [ ] Reconcile each profession record against the phase-2 crosswalk and fail loudly on count, id,
      or normalized-name drift.
- [ ] Reuse `icons.py` for metadata-only icon resolution; do not download binaries or add screenshot
      fallbacks.
- [ ] Keep profession-derived factual data free of copied prose. Descriptive fields remain `null`
      until a reviewed derived summary exists.

**Verification**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_professions`
- `npm run data:test`
- Optional bounded live smoke for `Profession` plus only the profession pages required to fill
  missing factual fields

**Phase Acceptance**

- Exactly ten playable professions are emitted.
- Every profession has a stable id, primary-attribute link, and either one resolved icon metadata
  record or a visible QA finding.

### Phase 4: `BW-0304` Attribute Catalog And Allocation Rules (~25%)

**Files**

- `scripts/data/build_wars_ingest/attributes.py`
- `scripts/data/build_wars_ingest/attribute_points.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_attributes.py`
- `scripts/data/build_wars_ingest/tests/test_attribute_points.py`
- `test/fixtures/data-ingestion/`
- `test/domain/data-ingestion-contracts.test.ts`

**Tasks**

- [ ] Add `attributes.py` to parse attribute source tables into template-id keyed attribute records.
- [ ] Add `attribute_points.py` to extract numeric rank costs, cumulative totals, level-based point
      budgets, quest reward metadata, and default level-20 assumptions from `Attribute point`.
- [ ] Preserve non-contiguous attribute ids and explicit missing ids. Never compact, renumber, or
      infer ids from list position.
- [ ] Cross-check profession ownership and primary-only flags against the profession catalog and its
      primary-attribute relationships.
- [ ] Model deferred cases explicitly: if PvP-only, hero, or exceptional quest assumptions are out
      of scope, record bounded flags or notes rather than guessed totals.
- [ ] Add fixtures and tests for malformed rows, duplicate ids, missing owners, primary-only
      mismatches, level-20 with and without quests, and rank `0` / rank `12` boundaries.

**Verification**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_attributes`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_attribute_points`
- `npm run data:test`
- `npm run test:run`

**Phase Acceptance**

- Every template attribute id from the crosswalk resolves to one attribute record or a blocking QA
  finding.
- The numeric allocation tables are deterministic and sufficient for later validation work without
  reopening source parsing.

### Phase 5: `BW-0305` Provenance, QA, And Reviewed Primary-Attribute Effect Summaries (~15%)

**Files**

- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `test/fixtures/data-ingestion/`
- `src/domain/source.ts`

**Tasks**

- [ ] Extend the EPIC-03 generated artifact so each profession, attribute, crosswalk entry, and
      allocation-rule block carries record-level provenance, with field-level claims where source
      classes differ.
- [ ] Fetch or parse only the additional pages needed to derive primary-attribute effect summaries
      and author bounded derived summaries with manual review records.
- [ ] Do not copy wiki prose into runtime-facing fields. If a summary cannot be derived and reviewed
      cleanly, keep the field unset and raise a QA finding instead of copying ambiguous text.
- [ ] Add QA diagnostics for missing revision facts, crosswalk/catalog mismatches, missing icon
      metadata, ambiguous source classification, missing manual review on derived summaries, and
      allocation-rule inconsistencies.
- [ ] Keep app-consumption and public-release gates aligned with the existing EPIC-01 and EPIC-02
      policy vocabulary.

**Verification**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_qa`
- `npm run data:test`
- Manual review of the ten primary-attribute summaries with evidence links, reviewer metadata, and
  dispositioned findings where needed

**Phase Acceptance**

- Every emitted summary field is either review-complete or intentionally absent with a visible QA
  disposition.
- No copied contributor or publisher prose enters the promoted runtime artifact.

### Phase 6: `BW-0306` Runtime Artifact Promotion And Verification Closeout (~10%)

**Files**

- `test/fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`
- `data/qa/epic-03/`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/README.md`
- `data/generated/README.md`
- `.gitignore`
- `work/tickets/03-professions-and-attributes/*.md`
- `work/sprints/SPRINT-004.md`
- `work/sprints/ledger.tsv`

**Tasks**

- [ ] Write a synthetic golden artifact at
      `test/fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json` for
      offline regression coverage.
- [ ] Write the production candidate artifact at
      `data/generated/epic-03/professions-attributes.catalog.json` plus the paired manifest, with
      QA output kept local under `data/qa/epic-03/`.
- [ ] Add exact-path `.gitignore` unignore rules for the promoted artifact and manifest only if
      provenance, QA, and manual review closeout pass. Keep raw snapshots and QA JSON ignored.
- [ ] Expand `test/domain/data-ingestion-contracts.test.ts` to validate the promoted catalog shape,
      template crosswalk behavior, reviewed summary fields, and numeric allocation tables.
- [ ] Run `npm run data:regenerate` twice to confirm no fixture diff, then run `npm run verify`.
- [ ] Perform one bounded manual live refresh against the named source pages and review diffs before
      closing the sprint.

**Verification**

- `npm run data:regenerate`
- `npm run verify`
- Manual live diff review for `Skill template format`, `Profession`, `Attribute`, `Attribute point`,
  and only the extra pages required for reviewed primary-attribute summaries

**Phase Acceptance**

- Later epics have one explicit runtime-facing catalog path and do not need to consume ignored QA or
  snapshot artifacts.
- Exact-path promotion either lands with clean QA closeout or the sprint remains open.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Durable profession and attribute record shapes |
| `src/domain/build.ts` | Modify | Attribute budget and allocation-assumption contracts |
| `src/domain/ids.ts` | Modify | Explicit template-id and sentinel semantics |
| `src/domain/index.ts` | Modify | Export the new catalog and validation types |
| `src/domain/source.ts` | Verify/modify narrowly | Provenance and review compatibility for derived summaries |
| `scripts/data/build_wars_ingest/template_ids.py` | Create | Template-format profession and attribute crosswalk extractor |
| `scripts/data/build_wars_ingest/professions.py` | Create | Profession normalization from verified snapshots |
| `scripts/data/build_wars_ingest/attributes.py` | Create | Attribute normalization from verified snapshots |
| `scripts/data/build_wars_ingest/attribute_points.py` | Create | Numeric attribute-point and quest-assumption extraction |
| `scripts/data/build_wars_ingest/icons.py` | Modify | Metadata-only profession icon resolution |
| `scripts/data/build_wars_ingest/models.py` | Modify | Shared source references, claims, and diagnostics for EPIC-03 records |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Combined EPIC-03 artifact and manifest writing |
| `scripts/data/build_wars_ingest/qa.py` | Modify | EPIC-03-specific findings, gates, and summaries |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Fixture, offline, and live orchestration for the new catalog flow |
| `scripts/data/build_wars_ingest/wikitext.py` | Modify narrowly | Summary-support parsing only where verified source facts require it |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Focused offline Python coverage for crosswalks, professions, attributes, rules, and QA |
| `test/fixtures/data-ingestion/` | Create/modify | Minimized source fixtures and golden generated artifacts |
| `test/domain/contracts.test.ts` | Modify | Domain-shape and sentinel/gap regression tests |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Generated-artifact alignment tests for EPIC-03 |
| `scripts/data/README.md` | Modify | Document source pages, artifact paths, and bounded live-refresh behavior |
| `data/generated/README.md` | Modify narrowly | Record the exact-path promotion decision for EPIC-03 artifacts |
| `.gitignore` | Modify narrowly | Allowlist only the promoted EPIC-03 catalog artifact and manifest |
| `data/generated/epic-03/professions-attributes.catalog.json` | Create/allowlist | Runtime-facing generated catalog |
| `data/generated/epic-03/professions-attributes.catalog.manifest.json` | Create/allowlist | Provenance-bearing manifest for the promoted catalog |
| `data/qa/epic-03/` | Local only | Ignored QA JSON and text summaries |
| `work/tickets/03-professions-and-attributes/*.md` | Create/modify | Ticket traceability, status, and acceptance closeout |
| `work/sprints/SPRINT-004.md` | Modify | Execution copy of the final sprint |
| `work/sprints/ledger.tsv` | Modify | Sprint status and closeout bookkeeping |

## Definition of Done

- [ ] A combined EPIC-03 artifact exists with ten playable professions, all template-format
      attributes, template crosswalks, and attribute-point rules.
- [ ] Profession template id `0` is preserved as a `null` sentinel in template crosswalk behavior
      and is not emitted as a playable profession record.
- [ ] Attribute ids match template-compatible ids and preserve gaps exactly.
- [ ] Profession and attribute reverse lookups are deterministic and do not depend on array order.
- [ ] Profession records include stable ids, names, abbreviations, campaign availability, primary
      attributes, and metadata-only icon references or visible QA findings.
- [ ] Attribute records include stable ids, names, profession ownership, and primary-only flags.
- [ ] Attribute allocation inputs include rank costs, cumulative totals, level-based budgets, quest
      reward metadata, and documented default level-20 assumptions.
- [ ] Primary-attribute effect summaries are present only as reviewed derived summaries with
      provenance and manual review metadata, never as copied wiki prose.
- [ ] Every generated record or artifact has provenance that includes source identity, canonical URL,
      revision facts, retrieval facts, material class, rights basis, and use decision.
- [ ] EPIC-03 QA findings cover missing provenance, stale or missing revisions, crosswalk drift,
      copied-summary risk, icon metadata gaps, schema mismatches, and generated diffs.
- [ ] Fixture regeneration is deterministic across repeated runs under fixed inputs and clock.
- [ ] `npm run data:regenerate` runs twice without unexpected fixture diffs.
- [ ] `npm run verify` passes and remains fast and offline by default.
- [ ] Any manual live refresh is explicit, bounded to named Guild Wars Wiki pages, and reviewed
      before promotion.
- [ ] Raw snapshots, QA JSON, icon binaries, screenshots, copied community prose, and unreviewed
      publisher or contributor text remain untracked.
- [ ] The promoted runtime-facing artifact path is explicit and exact-path allowlisted only after QA
      closeout.
- [ ] Runtime app code still does not import `scripts/data`, fetch raw wiki pages, or consume raw
      snapshots or QA reports.
- [ ] `BW-0301` through `BW-0306`, `EPIC-03`, `SPRINT-004`, and `work/sprints/ledger.tsv` are
      status-consistent at close.
- [ ] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `Skill template format`, `Profession`, and `Attribute` disagree on ids or names | Medium | High | Make `Skill template format` the id authority, cross-check the others, and fail loudly with QA findings instead of silently reconciling drift. |
| The profession `0` sentinel is accidentally emitted as a real catalog record | Medium | High | Lock sentinel semantics in Phase 1, test them at the domain and generated-artifact layers, and keep crosswalks separate from catalog arrays. |
| Attribute gaps are lost through sorting, map compaction, or reverse-lookup generation | Medium | High | Key crosswalks by explicit template id, add gap tests, and reject inferred sequential ids. |
| Primary-attribute effect summaries slip into copied prose | Medium | High | Use reviewed derived summaries only, require field-level provenance and manual review, and leave the field unset when evidence is ambiguous. |
| Profession icon metadata is missing or ambiguous | Medium | Medium | Reuse metadata-only icon resolution, surface ambiguity as QA, and avoid blocking core factual records on a guessed icon. |
| Attribute-point rules vary by mode or character type beyond MVP assumptions | Medium | Medium | Capture default PvE level-20 assumptions now, record explicit deferred cases, and avoid invented totals for PvP or hero flows. |
| Generated artifact promotion becomes noisy because live source revisions change | Medium | Medium | Keep fixture mode deterministic, use bounded live refresh only for review, and inspect generated diffs before allowlisting updated artifacts. |
| Sprint scope expands into skill catalog or rule-engine implementation | Medium | High | Limit the sprint output to professions, attributes, allocation rules, provenance, QA, and artifact promotion only. |

## Security Considerations

- Treat source titles, URLs, raw payloads, tables, wikitext fragments, and QA evidence as untrusted
  input.
- Keep live network access explicit and bounded to the configured Guild Wars Wiki MediaWiki API
  origin.
- Do not use credentials, cookies, tokens, or any runtime secret material in ingestion flows.
- Keep writes beneath approved roots, preserve snapshot and artifact path confinement, and rely on
  the existing atomic-write and digest-verification behavior from EPIC-02.
- Do not execute source HTML, templates, JavaScript, Lua, shell fragments, or untrusted URLs.
- Bound QA evidence excerpts and logs; do not dump unbounded page bodies or raw snapshot payloads
  into tracked files.
- Keep icon handling metadata-only and continue to prohibit cached icon binaries, screenshots, and
  prior-art images.
- Preserve field-level provenance and manual review when summary content could otherwise blur
  factual data and expressive source material.

## Dependencies

- `EPIC-00` / `SPRINT-001`, `EPIC-01` / `SPRINT-002`, and `EPIC-02` / `SPRINT-003` must already be
  complete.
- Repo prerequisites remain Node.js `22.11.0+`, npm `11.10.1+`, Python 3, and
  `npm run data:setup` for the pinned parser dependency.
- The sprint depends on the existing EPIC-02 ingestion spine: shared MediaWiki client, snapshot
  manifests, `mwparserfromhell` adapter, artifact writer, QA framework, and regenerate command.
- Manual live verification depends on Guild Wars Wiki availability only for the named pages used by
  this catalog. Automated verification must not depend on live network access.

Internal ticket sequencing:

```text
BW-0301 Catalog Contracts And Template Identity Surface
  -> BW-0302 Snapshot Coverage And Template Crosswalk Extraction
BW-0302
  -> BW-0303 Profession Catalog Normalization
  -> BW-0304 Attribute Catalog And Allocation Rules
BW-0303 + BW-0304
  -> BW-0305 Provenance, QA, And Reviewed Primary-Attribute Effect Summaries
BW-0305
  -> BW-0306 Runtime Artifact Promotion And Verification Closeout
```

Downstream epics unblocked directly by this sprint:

- `EPIC-04 Skills`
- `EPIC-05 Template Compatibility`
- `EPIC-06 Game Rule Engine`
- `EPIC-08 Core Build Editor`

## Open Questions

1. Should PvP-only and hero attribute-point variants receive separate rule tables in EPIC-03, or
   should they stay explicitly deferred until `EPIC-06` defines the concrete validation surface?
2. Should later runtime consumers import the promoted catalog directly from
   `data/generated/epic-03/`, or should a later ticket mirror it into a narrower app-owned data
   module while preserving provenance and release-gate behavior?
3. Are profession abbreviations and campaign-availability facts fully reliable on the shared
   `Profession` page, or should all ten profession pages become mandatory sources before closeout?
