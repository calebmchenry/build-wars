---
id: SPRINT-005
title: Skills Catalog
status: completed
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
updated: 2026-09-02
completed: 2026-09-02
---

# Sprint 005: Skills Catalog

## Planning Amendment

SPRINT-005 was blocked at the Phase 1 source-authority go/no-go gate because the originally locked
seed title `Guild Wars Wiki:Game integration/Skills/0` returned `API_MISSING_PAGE` from the live
Guild Wars Wiki MediaWiki API. The approved amendment is to use
`Guild Wars Wiki:Game integration/Skills` as the source-set index and the linked ranged skill pages
under `Guild Wars Wiki:Game integration/Skills/*` as the authoritative seed set for skill IDs and
initial titles. The missing `/Skills/0` page is retained only as blocker history and must not be
required by the implementation.

## Overview

This sprint turns `EPIC-04 Skills` into the first runtime-eligible Guild Wars skills catalog for Build Wars. It extends the completed EPIC-02 ingestion spine, consumes the promoted EPIC-03 professions/attributes catalog for profession and attribute joins, and promotes exactly one skills catalog, one adjacent generated artifact manifest, and one bounded machine-readable QA report.

This is a data and domain-contract sprint. It does not build UI search, build-editor controls, template import/export, rule validation, runtime mode selection, title eligibility, attribution UI, guide content, local storage, PvX/community imports, or runtime wiki fetching. Later epics consume `data/generated/epic-04/skills.catalog.json`; runtime app code must not read raw snapshots, source plans, snapshot-set manifests, parser output, Python ingestion modules, generated manifests, QA reports, or wiki APIs.

The sprint locks five planning decisions:

- `SkillId` and `TemplateSkillId` are distinct concepts. Version 1 may use equal numeric values for known skills, but unknown authored IDs stay representable and IDs are never inferred from array position or dense ranges.
- `Guild Wars Wiki:Game integration/Skills` is the source-set index, and its linked ranged skill pages under `Guild Wars Wiki:Game integration/Skills/*` are the authoritative seed set for this sprint. Bounded cross-checks may report omissions, but source-set expansion outside that ranged-page family requires an explicit recorded amendment.
- Live refresh is two-step: discover the seed set and write a source plan/digest, then fetch detail pages only when the exact digest is supplied back to the CLI.
- EPIC-04 offline replay uses one complete `SourceSnapshotSetManifest`; it must reject partial, extra, missing, duplicated, mixed-profile, or digest-mismatched inputs.
- Schema v1 defers acquisition metadata. Guide-specific acquisition facts belong to a later bounded guide-authoring ticket.

Production promotion is mandatory for sprint completion. If the bounded live refresh, selected offline replay, description/review closeout, or first-baseline review cannot complete, implementation may leave useful fixture/offline work, but `SPRINT-005` must remain blocked rather than relaxing release gates.

## Use Cases

1. **Decode skill template IDs later**: EPIC-05 can map authored numeric skill IDs to known catalog records, unsupported/dispositioned source entries, or unknown authored IDs without compacting or coercing values.
2. **Search local skills later**: EPIC-20 can index IDs, names, titles, campaign, profession, attribute, type, cost states, elite/common/title/special flags, and mode availability from one approved catalog.
3. **Render dynamic tooltips later**: Future UI can combine safe description tokens, costs, timings, progression tables, split relationships, and caller-supplied ranks without reading wikitext.
4. **Validate skill bars later**: EPIC-06 can consume profession, attribute, elite, common, no-attribute, title, PvE-only, PvP-only, and special classifications as catalog facts.
5. **Support title work later**: EPIC-15 can consume stable title-rank dependency keys and value tables while owning title identity, allegiance, eligibility, and effective-rank rules.
6. **Audit source-derived data**: Reviewers can trace promoted records to seed entries, canonical pages, revision facts, source/provenance IDs, description review, QA findings, and artifact digests.
7. **Refresh deliberately**: Maintainers can discover a source set, review the digest and counts, fetch a complete snapshot set, replay it offline, and promote only after deterministic QA passes.

## Architecture

### Scope Boundary

| Area           | In Scope                                                                                                                                                                                                        | Out of Scope                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain         | Plain-data skill catalog contracts, branded IDs, source-set/disposition records, cost/timing value states, description tokens, progression series, split groups, dependency summaries, and pure lookup helpers. | React state, DOM/browser APIs, storage, runtime fetches, template codecs, rule results, or attribution presentation.                                |
| Ingestion      | EPIC-04 profile, source-shape checkpoint, digest-confirmed source planning, batched snapshot fetch, selected offline replay, structured extraction, catalog assembly, QA, and promotion.                        | One-off scrapers, arbitrary categories, recursive crawling, browser automation, source-provided URLs, or live network in `npm run verify`.          |
| Generated data | `skills.catalog.json`, adjacent manifest JSON, bounded QA JSON, and minimized synthetic fixtures.                                                                                                               | Raw pages, source plans, snapshot-set manifests, candidate outputs, QA summaries, icon bytes, screenshots, copied page bodies, or unreviewed prose. |
| Review         | Description corpus review, exceptional ID dispositions, warning dispositions, first-baseline review, and source-policy gates.                                                                                   | Reviewer-less overrides, `git add -f` as approval, or accepting unknown copied material as public-release risk.                                     |
| Closeout       | Docs, tickets, sprint status, ledger sync, manifest, and no-commit handoff.                                                                                                                                     | Commit creation or downstream feature implementation.                                                                                               |

### Data Flow

```text
promoted EPIC-03 catalog + manifest + passing QA
                        |
verified skill-integration index and ranged-page seed snapshots
  -> source-shape checkpoint
  -> source-set planner + source plan digest
  -> digest-confirmed batched detail-page fetch
  -> verified page snapshots + icon metadata snapshots
  -> complete SourceSnapshotSetManifest
  -> selected offline replay
  -> infobox, cost, description, progression, and split extraction
  -> EPIC-03 profession/attribute joins
  -> SkillCatalog semantic JSON
  -> GeneratedArtifactManifest + QaReport
  -> description/disposition/baseline review
  -> exact-path promotion
```

### Source Authority

| Fact                           | Primary Authority                                                                                                                 | Cross-check                                                          | Conflict Behavior                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Skill IDs and initial titles   | Verified `Guild Wars Wiki:Game integration/Skills` index plus linked ranged `Guild Wars Wiki:Game integration/Skills/*` snapshots | Source-set digest and detail-page identity                           | Duplicate/conflicting IDs block; numeric gaps are coverage facts, not synthesized records.                     |
| Canonical page identity        | MediaWiki title normalization, redirect result, page ID, revision ID, and page snapshot                                           | Seed requested title and page-local redirect/disambiguation evidence | Missing, ambiguous, cyclic, disambiguated, or duplicate canonical pages block unless explicitly dispositioned. |
| Profession and attribute joins | Promoted EPIC-03 catalog, manifest digest, relevant section digests, and QA state                                                 | Skill infobox labels                                                 | Unknown or contradictory joins block unless the classification legitimately allows `null`.                     |
| Core skill fields              | `Skill infobox` structured fields                                                                                                 | Page identity, accepted ID, controlled vocabularies, and fixtures    | Missing or malformed required fields produce QA findings; no prose fallback.                                   |
| Costs and timings              | `Skill infobox` plus supported special templates                                                                                  | Cost invariants and progression/timing fixtures                      | Unsupported value forms block or require explicit disposition.                                                 |
| Description text               | Bounded infobox description fields after source-policy classification                                                             | Tokenization, digest-bound review, and QA                            | Unknown copied material is non-waivable; runtime text is reviewed or excluded before promotion.                |
| Progression values             | `Skill progression`, `gr`, `gr2`, title-rank progression, morale-boost recharge, and approved wrappers                            | Description token references and rank-domain tests                   | Unsupported source-indicated progression blocks tooltip-complete promotion for affected records.               |
| PvE/PvP variants               | Explicit wrapper/link/page evidence                                                                                               | Mode flags, source-set records, counterpart existence                | Store one normalized group with one member per mode; ambiguous relationships block.                            |
| Icon metadata                  | Skill infobox image fact plus MediaWiki `imageinfo`                                                                               | File identity, MIME, dimensions, hash, timestamp, and policy         | Nullable with QA disposition; media bytes are never fetched.                                                   |

### Runtime Catalog Versus Audit Artifacts

`data/generated/epic-04/skills.catalog.json` is the runtime-eligible artifact. It contains semantic skill facts, compact source/provenance IDs, EPIC-03 dependency digests, source-set summary/dispositions, skills, progression series, split groups, and metadata-only remote media references.

The adjacent manifest and QA report own the operational evidence: artifact digest, generator/config identity, child snapshot paths, selected snapshot-set digest, full source-plan identity, full review evidence, release gates, and finding details. The runtime catalog must not embed the adjacent generated artifact manifest, local snapshot paths, full source-shape proof blobs, raw parser output, QA report bodies, or complete manual-review records. This avoids circular hashing and keeps future runtime consumers independent of repository-local audit paths.

### Source-Set And Snapshot-Set Protocol

The EPIC-04 profile adds a two-stage live flow:

1. **Discover** fetches the source-set index, verifies the linked ranged skill pages, enumerates accepted IDs/titles from those pages, validates hard ceilings, computes counts and a source-plan digest, writes an ignored source plan, prints a bounded summary, and stops.
2. **Fetch** requires `--allow-live-network`, the generated source-plan path, and the exact `--confirm-source-set-digest`. It revalidates the seed-set and plan digests, fetches only planned titles in deterministic batches, derives bounded icon candidates from verified pages, fetches metadata only, and writes a complete or partial `SourceSnapshotSetManifest`.

Offline EPIC-04 replay requires `--snapshot-set` and one complete manifest. It rejects mixed profiles, edited plans, extra child manifests, missing child manifests, duplicated children, digest mismatches, path escapes, partial acquisition state, and source-set drift. Logical records sort by skill ID; API request title ordering is only a transport detail and cannot affect canonical bytes.

### Skill Contract

Each cataloged skill record includes:

- `id`, `templateId`, canonical name, normalized lookup key, canonical wiki URL, and page identity facts
- campaign, profession ID, attribute ID, skill type, and classification fields
- independent cost components for energy, adrenaline, sacrifice, upkeep, and overcast
- timing fields for activation, recharge, and recognized special recharge behavior
- explicit states for numeric, percentage, zero, absent, not-applicable, and special values
- elite, common, title, special, no-attribute, PvE-only, PvP-only, shared, split, unsupported, or non-player classification as controlled state plus validated derived flags
- safe description tokens and a plain-text search projection only when source-policy review permits it
- progression series IDs, split group ID when applicable, nullable icon ID, and compact field provenance references

Costs and timings are not one mutually exclusive union. Skills may have multiple cost components, and timings have their own value states. Signets and legitimate no-cost skills use explicit `not-applicable` or no-cost states, not malformed `null`.

### Description, Progression, And Tooltip Semantics

Description handling has three layers:

1. **Source evidence** stays in ignored snapshots or bounded QA evidence.
2. **Structured tooltip data** stores safe tokens, progression references, value slots, and dependencies.
3. **Runtime display/search text** ships only after source-policy classification and digest-bound review.

Every accepted runtime skill that needs tooltip text must end in a deterministic state: `reviewed-text`, `structured-only`, `excluded`, or `unsupported`. `reviewed-text` is required for complete tooltip text. `structured-only` is allowed only when the record still has truthful costs/progressions and documents display limitations. `excluded` or `unsupported` must have QA disposition and cannot be presented as complete tooltip coverage. A change to source revision, normalized text, tokenizer version, parser behavior, or description-section digest invalidates the relevant review.

Progressions are normalized into explicit series with dependency kind (`attribute`, `title-rank`, `mode`, `constant`, or recognized special timing), rank domain, value slots, finite values, source form, and provenance. A pure domain/test helper may resolve a mode variant and render plain-text tooltip tokens from supplied ranks. It must not fetch data, calculate effective ranks, decide build legality, inject HTML, or interpret wikitext at runtime.

PvE/PvP variants use one `SkillModeVariantGroup` with exactly one member per proven mode. Unknown mode returns an explicit ambiguous outcome when variants differ; EPIC-06 and UI work own runtime selection policy.

## Implementation

### Phase 1: BW-0401 Source Shape, Contracts, And Profile Foundation (~15% of effort)

**Files:**

- `src/domain/ids.ts`
- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/source.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/skill-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/foundation.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `work/tickets/04-skills/BW-0401-skill-catalog-contracts-and-profile.md`

**Tasks:**

- [x] Confirm EPIC-01 through EPIC-03, SPRINT-002 through SPRINT-004, and the promoted EPIC-03 catalog/manifest/QA state are complete and usable.
- [x] Run a bounded source-shape checkpoint for the approved seed set, representative skill pages, infobox aliases, description markup, progression forms, PvE/PvP wrappers, special skills, icon fields, API limits, and estimated output/QA size.
- [x] Record go/no-go results: if the approved ranged skill page seed set is incomplete for known template IDs, if the index links unexpected non-ranged skill pages, or if representative source forms contradict the planned schema, block for planning amendment instead of broadening the source graph.
- [x] Size the description corpus and non-catalog disposition review early; record whether exhaustive review is feasible inside the sprint.
- [x] Add `TemplateSkillId`, `SkillCatalog`, `CatalogSkillRecord`, source-set summary, disposition, typed value-state, classification, description-state, progression, split-group, dependency, and lookup outcome contracts.
- [x] Define semantic section projections, canonical sort keys, catalog version inputs, source/provenance reference compression, output byte caps, and cross-language JSON field names.
- [x] Add `SourceSnapshotSetManifest` and EPIC-04 profile cap contracts without breaking existing individual snapshot manifests or EPIC-02/EPIC-03 profile behavior.
- [x] Register `epic-04-skills`; allow CLI options to lower smoke-test limits but not raise code-owned ceilings.
- [x] Keep acquisition metadata absent from schema v1.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/skill-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_pipeline`

**Phase Gate:** Source-shape, review volume, profile caps, identity semantics, and catalog ownership are settled enough that later phases do not invent alternate wire forms or broaden the source graph.

### Phase 2: BW-0402 Source Discovery, Page Resolution, And Snapshot-Set Replay (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/api.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/skill_ids.py`
- `scripts/data/build_wars_ingest/skill_source_set.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_api.py`
- `scripts/data/build_wars_ingest/tests/test_snapshots.py`
- `scripts/data/build_wars_ingest/tests/test_skill_ids.py`
- `scripts/data/build_wars_ingest/tests/test_skill_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/skills/`
- `work/tickets/04-skills/BW-0402-skill-source-set-and-page-resolution.md`

**Tasks:**

- [x] Harden seed enumeration so every candidate line becomes an accepted entry, ignored evidence, or scoped diagnostic with stable finding identity.
- [x] Build deterministic source-plan records over accepted numeric IDs and requested titles; include counts, caps, source revision, digest, and profile identity.
- [x] Extend title-query handling to preserve requested, normalized, redirect, canonical, page, revision, missing-page, and response-order facts for every requested title.
- [x] Detect duplicate IDs, duplicate titles, duplicate canonical pages, malformed mappings, missing targets, high-ID outliers, redirects, disambiguation preambles, same-page variants, and title normalization collisions.
- [x] Implement discover-only live mode and digest-confirmed fetch mode; reject wrong-profile plans, stale seed-set digests, edited plans, source-set drift, and cap overflow.
- [x] Fetch only confirmed titles in deterministic batches, count retries against request caps, and enforce response, parser, page, aggregate-byte, media-title, and output-plan limits.
- [x] Write complete or partial `SourceSnapshotSetManifest` records with child manifest digests, aggregate counts, aggregate bytes, source-plan digest, completion state, and deterministic order.
- [x] Require `--snapshot-set` for EPIC-04 offline replay; reject shared-tree scanning, partial runs, extra/missing snapshots, digest mismatches, duplicate children, mixed profiles, and path escapes.
- [x] Define partial-run recovery: interrupted runs cannot promote; a rerun must either reuse validated prior children through manifest identity or explicitly supersede the partial set.
- [x] Add minimized fixtures for duplicates, redirects, disambiguation, missing pages, duplicate canonical targets, wrong confirmation digests, stale plans, partial runs, batch reordering, cap failures, and stable findings.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_api build_wars_ingest.tests.test_snapshots build_wars_ingest.tests.test_skill_ids build_wars_ingest.tests.test_skill_source_set build_wars_ingest.tests.test_cli`
- `npm run data:test`
- One discover-only manual live smoke if Guild Wars Wiki is available

**Phase Gate:** Every fixture seed ID has deterministic page-resolution evidence or a blocking diagnostic, and one complete fixture snapshot set replays without consulting unrelated files.

### Phase 3: BW-0403 Infobox, Cost, Description, Join, And Icon Extraction (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_infobox.py`
- `scripts/data/build_wars_ingest/skill_catalog.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_skill_infobox.py`
- `scripts/data/build_wars_ingest/tests/test_skill_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/skills/`
- `test/domain/skill-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `work/tickets/04-skills/BW-0403-skill-infobox-and-field-extractors.md`

**Tasks:**

- [x] Load EPIC-03 through one validated adapter; verify catalog digest, relevant section digests, schema, manifest decision, and QA gate state before production joins.
- [x] Extract exactly one supported skill infobox per resolved page, or emit a scoped diagnostic for missing/multiple/unsupported infoboxes.
- [x] Normalize name, wiki URL, campaign, type, profession, attribute, activation, recharge, energy, adrenaline, sacrifice, upkeep, overcast, elite/common/title/special/no-attribute/mode classifications, explicit icon fact, and field provenance.
- [x] Join professions and attributes only through EPIC-03 lookup semantics. Permit `null` only for verified common, no-attribute, title, special, non-player, or dispositioned classifications.
- [x] Keep costs and timings as independent value states; preserve malformed values as diagnostics, not sentinel numbers or silent `null`.
- [x] Tokenize bounded infobox description fields into safe literal, whitespace, line-break, progression-reference, and reviewed factual-marker tokens. Reject HTML, unrecognized nested templates, lossy flattening, and page-body fallback.
- [x] Generate a deterministic plain-text search projection only from approved tokens.
- [x] Resolve metadata-only skill icon records from explicit or bounded default candidates; enforce media-title caps and `cachedBytes: false`.
- [x] Keep acquisition metadata, guide prose, strategy, vendor/drop/quest instructions, and community text out of generated schema v1.
- [x] Add fixtures for elite, signet/no-cost, energy, adrenaline, sacrifice, upkeep, overcast, title, no-attribute, common, PvE-only, PvP-only, special, malformed costs, unknown types, missing fields, unsafe markup, ambiguous icons, and copied-text risk.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_infobox build_wars_ingest.tests.test_skill_catalog build_wars_ingest.tests.test_icons`
- `npm run test:run -- test/domain/skill-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `npm run data:test`

**Phase Gate:** The synthetic catalog accounts for every fixture seed ID, core fields round-trip through Python and TypeScript, all non-null joins resolve through EPIC-03, and no raw page body, HTML, acquisition prose, or media bytes appear in generated JSON.

### Phase 4: BW-0404 Progression, Split Groups, And Renderer-Neutral Tooltip Data (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_progression.py`
- `scripts/data/build_wars_ingest/skill_catalog.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_skill_progression.py`
- `scripts/data/build_wars_ingest/tests/test_skill_catalog.py`
- `test/fixtures/data-ingestion/skills/`
- `src/domain/skill-tooltip.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/skill-catalog.test.ts`
- `work/tickets/04-skills/BW-0404-skill-progression-splits-and-tooltip-data.md`

**Tasks:**

- [x] Normalize verified `Skill progression`, `gr`, `gr2`, title-rank progression, morale-boost recharge, `pveversion`, `pvpversion`, and source-shape-approved wrappers.
- [x] Resolve progression dependencies to EPIC-03 attribute IDs or stable unresolved title dependency keys; defer title ownership, allegiance, eligibility, and effective rank to EPIC-15.
- [x] Expand recognized formulas into explicit finite per-rank value tables over verified domains, preserving normalized source parameters as bounded structured evidence.
- [x] Validate value-slot arity, rank coverage, duplicate ranks, formula boundaries, expected direction, intentionally non-monotonic evidence, and every description-token-to-series reference.
- [x] Build one normalized split group per evidenced PvE/PvP relationship; validate counterpart existence, unique mode roles, reciprocal traversal, wrapper/page consistency, no self-links, no duplicate membership, and mode flags.
- [x] Add a pure domain/test helper only for renderer-neutral token resolution and plain-text tooltip output from supplied ranks. It must return structured unresolved outcomes for unknown IDs, unknown mode, missing rank, title dependency, or unsupported domain.
- [x] Keep rendering plain text and framework-neutral. Do not calculate effective ranks, validate builds, choose PvE/PvP mode defaults, fetch data, or interpret raw templates at runtime.
- [x] Add fixtures for standard scaling, multiple value slots, constants, explicit zero, title-rank scaling, morale-boost recharge, shared pages, separate PvE/PvP pages, wrappers, no-progression skills, non-monotonic evidence, malformed templates, missing counterparts, and contradictory flags.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_progression build_wars_ingest.tests.test_skill_catalog`
- `npm run test:run -- test/domain/skill-catalog.test.ts`
- `npm run data:test`

**Phase Gate:** Fixture tooltips render from safe catalog tokens for supported ranks and modes without reading wikitext; unsupported source-indicated progression and ambiguous splits produce blocking findings rather than guessed output.

### Phase 5: BW-0405 Catalog Assembly, QA, Review, Determinism, And Promotion (~17% of effort)

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
- `data/generated/epic-04/skills.catalog.json`
- `data/generated/epic-04/skills.catalog.manifest.json`
- `data/qa/epic-04/skills.catalog.qa.json`
- `.gitignore`
- `package.json` only if needed to keep all-profile fixture regeneration explicit and offline
- `work/tickets/04-skills/BW-0405-skills-catalog-qa-and-promotion.md`

**Tasks:**

- [x] Assemble canonical skill catalog sections with stable ordering, compact source/provenance references, dependency summaries, source-set summary/dispositions, skill records, progression series, split groups, media references, section digests, and semantic `catalogVersion`.
- [x] Keep child snapshot paths, source-plan paths, full review evidence, artifact digest ownership, and release gates in the adjacent manifest/QA artifacts, not embedded in the runtime catalog.
- [x] Add profile-specific QA for source-set accounting, resolution, joins, infobox fields, costs, descriptions, progressions, variants, icons, provenance, freshness, schema, versions, size caps, baseline, deterministic order, and artifact integrity.
- [x] Add mutation tests proving every runtime-semantic field changes its owning section digest and `catalogVersion`, while retrieval/review timestamps and other provenance-only changes do not.
- [x] Run a mid-sprint size checkpoint after first synthetic assembly; fail early if catalog bytes, QA bytes, parse time, or verification time exceed named budgets.
- [x] Generate the synthetic EPIC-04 fixture twice from clean output roots and compare catalog, manifest, QA JSON, finding IDs, source order, section digests, and summary counts byte-for-byte.
- [x] Run live discovery, review count/title digest and computed budget, then run digest-confirmed bounded detail/icon refresh. Do not proceed on source-set drift.
- [x] Retain the reviewed snapshot set through promotion and first-baseline signoff; partial or superseded sets cannot be selected.
- [x] Replay the complete live snapshot set offline twice with fixed generation time and require byte-identical catalog, manifest, QA report, section digests, and finding IDs.
- [x] Record description-corpus, exceptional disposition, warning, and first-baseline reviews bound to exact digests, source revisions, dependency digests, artifact digest, QA report, reviewer, timestamp, scope, and rationale.
- [x] Resolve or exclude all critical/error findings and disposition every warning with bounded named evidence. Require `appConsumptionGate: pass` and `publicReleaseGate: pass`.
- [x] Allowlist only `data/generated/epic-04/skills.catalog.json`, `data/generated/epic-04/skills.catalog.manifest.json`, and `data/qa/epic-04/skills.catalog.qa.json`; verify representative ignored raw/candidate paths.

**Verification:**

- `npm run data:regenerate` twice with fixed-clock byte comparisons
- EPIC-04 offline replay twice from the reviewed `SourceSnapshotSetManifest`
- `npm run data:test`
- `npm run verify`
- `git check-ignore -v` for promoted paths and representative ignored raw/candidate paths
- `git status --short` plus catalog/manifest/QA digest and size inspection

**Phase Gate:** The three production files refer to one reviewed source/dependency set, pass both QA gates, reproduce byte-for-byte offline, and are the only new generated paths eligible for tracking.

### Phase 6: BW-0406 Documentation, Verification, And Closeout (~8% of effort)

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
- `work/tickets/04-skills/BW-0401-skill-catalog-contracts-and-profile.md`
- `work/tickets/04-skills/BW-0402-skill-source-set-and-page-resolution.md`
- `work/tickets/04-skills/BW-0403-skill-infobox-and-field-extractors.md`
- `work/tickets/04-skills/BW-0404-skill-progression-splits-and-tooltip-data.md`
- `work/tickets/04-skills/BW-0405-skills-catalog-qa-and-promotion.md`
- `work/tickets/04-skills/BW-0406-docs-verification-and-closeout.md`
- `work/sprints/SPRINT-005.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [x] Document EPIC-04 profile commands, source-shape checkpoint, two-step live confirmation, exact snapshot-set replay, caps, output paths, exit behavior, and deterministic regeneration.
- [x] Document catalog identity, EPIC-03 dependency semantics, cost/timing states, description policy, progression domains, split groups, title dependency boundary, and excluded acquisition metadata.
- [x] Document downstream boundaries for EPIC-05, EPIC-06, EPIC-08, EPIC-15, EPIC-19, and EPIC-20, including unknown-ID preservation and runtime manifest/QA prohibition.
- [x] Inspect the worktree for raw content, icon bytes, unreviewed prose, live logs, accidental broad allowlists, unrelated changes, local paths, and generated byproducts.
- [x] Mark BW-0401 through BW-0406 complete only after their phase gates pass. Mark EPIC-04, SPRINT-005, and the ledger complete only after every DoD gate passes.
- [x] Do not create a commit; the outer ticket-burn executor owns commit behavior.

**Verification:**

- `npm run verify`
- `git status --short`
- `git check-ignore -v` checks documented in Phase 5
- Manual consistency review across docs, generated files, QA state, tickets, sprint, ledger, and result manifest

## Files Summary

| File                                                                 | Action                  | Purpose                                                                                                                                                        |
| -------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/ids.ts`                                                  | Modify                  | Add `TemplateSkillId` and preserve unknown authored numeric skill IDs.                                                                                         |
| `src/domain/catalog.ts`                                              | Modify                  | Define `SkillCatalog`, skill records, source-set summaries, dispositions, costs, descriptions, progressions, split groups, dependencies, and media references. |
| `src/domain/catalog-lookup.ts`                                       | Modify                  | Add pure skill/template/name/mode lookup helpers and structured unresolved outcomes.                                                                           |
| `src/domain/skill-tooltip.ts`                                        | Create if needed        | Resolve safe description/progression tokens into plain text for tests and future UI use.                                                                       |
| `src/domain/source.ts`                                               | Modify                  | Add snapshot-set/dependency/review reference contracts where shared types are insufficient.                                                                    |
| `src/domain/index.ts`                                                | Modify                  | Export the new framework-neutral domain contracts.                                                                                                             |
| `scripts/data/build_wars_ingest/config.py`                           | Modify                  | Add EPIC-04 hard ceilings and run-budget defaults.                                                                                                             |
| `scripts/data/build_wars_ingest/profiles.py`                         | Modify                  | Register `epic-04-skills` and dynamic source-set profile metadata.                                                                                             |
| `scripts/data/build_wars_ingest/models.py`                           | Modify                  | Add source-set, disposition, skill extraction, and snapshot-set helpers.                                                                                       |
| `scripts/data/build_wars_ingest/api.py`                              | Modify                  | Preserve requested/normalized/redirect/canonical association across batches.                                                                                   |
| `scripts/data/build_wars_ingest/snapshots.py`                        | Modify                  | Write and verify run-level `SourceSnapshotSetManifest` records.                                                                                                |
| `scripts/data/build_wars_ingest/skill_ids.py`                        | Modify                  | Harden complete seed candidate accounting.                                                                                                                     |
| `scripts/data/build_wars_ingest/skill_source_set.py`                 | Create                  | Build source plans, resolve pages, enforce caps, and assemble replay manifests.                                                                                |
| `scripts/data/build_wars_ingest/skill_infobox.py`                    | Create                  | Extract infobox fields, costs, descriptions, classifications, joins, icons, and provenance.                                                                    |
| `scripts/data/build_wars_ingest/skill_progression.py`                | Create                  | Normalize progression tables, wrappers, special recharge, and split evidence.                                                                                  |
| `scripts/data/build_wars_ingest/skill_catalog.py`                    | Create                  | Assemble catalog sections, semantic projection, section digests, QA inputs, and dispositions.                                                                  |
| `scripts/data/build_wars_ingest/wikitext.py`                         | Modify                  | Support verified bounded skill templates and diagnostics for unsupported forms.                                                                                |
| `scripts/data/build_wars_ingest/icons.py`                            | Modify                  | Resolve bounded metadata-only skill icon records.                                                                                                              |
| `scripts/data/build_wars_ingest/artifacts.py`                        | Modify                  | Support EPIC-04 canonical output caps, manifest metadata, and diff classification.                                                                             |
| `scripts/data/build_wars_ingest/qa.py`                               | Modify                  | Add EPIC-04 validators while preserving shared QA wire format.                                                                                                 |
| `scripts/data/build_wars_ingest/pipeline.py`                         | Modify                  | Orchestrate EPIC-04 fixture, discover, fetch, offline replay, extraction, assembly, and QA.                                                                    |
| `scripts/data/build_wars_ingest/cli.py`                              | Modify                  | Expose safe EPIC-04 profile/stage/confirmation/snapshot-set options.                                                                                           |
| `scripts/data/build_wars_ingest/tests/`                              | Create/modify           | Cover source-set, replay, extraction, progression, QA, artifacts, pipeline, and CLI behavior.                                                                  |
| `test/domain/skill-catalog.test.ts`                                  | Create                  | Validate JSON contract, lookup, value states, descriptions, progressions, variants, and versioning.                                                            |
| `test/domain/contracts.test.ts`                                      | Modify                  | Cover branded IDs and authored unknown-ID compatibility.                                                                                                       |
| `test/domain/data-ingestion-contracts.test.ts`                       | Modify                  | Prove Python-generated skill JSON matches TypeScript contracts.                                                                                                |
| `test/fixtures/data-ingestion/skills/`                               | Create                  | Store minimized synthetic source fixtures for EPIC-04 edge cases.                                                                                              |
| `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json` | Create                  | Store deterministic synthetic golden catalog.                                                                                                                  |
| `data/generated/epic-04/skills.catalog.json`                         | Create/allowlist        | Runtime-eligible generated skills catalog.                                                                                                                     |
| `data/generated/epic-04/skills.catalog.manifest.json`                | Create/allowlist        | Artifact digest, generator/config, selected source-set, and replay evidence.                                                                                   |
| `data/qa/epic-04/skills.catalog.qa.json`                             | Create/allowlist        | Bounded QA findings, review references, and release gates.                                                                                                     |
| `.gitignore`                                                         | Modify narrowly         | Allowlist only approved EPIC-04 production files.                                                                                                              |
| `package.json`                                                       | Modify only if needed   | Keep fixture regeneration explicit, deterministic, and offline.                                                                                                |
| `README.md`, `scripts/data/README.md`, `data/**/README.md`           | Modify                  | Document EPIC-04 commands, lifecycle, exact paths, and runtime boundaries.                                                                                     |
| `compendium/data-ingestion-platform.md`                              | Modify                  | Record high-volume source-set and snapshot-set rules.                                                                                                          |
| `compendium/skills-catalog.md`                                       | Create                  | Record durable EPIC-04 source authority, schema, policy, and deferred behavior.                                                                                |
| `compendium/README.md`                                               | Modify                  | Index the skills catalog note.                                                                                                                                 |
| `work/tickets/04-skills/*.md`                                        | Modify during execution | Record execution state and closeout evidence.                                                                                                                  |
| `work/sprints/SPRINT-005.md`                                         | Modify during execution | Track sprint execution state and checked DoD.                                                                                                                  |
| `work/sprints/ledger.tsv`                                            | Modify                  | Record sprint lifecycle status.                                                                                                                                |

## Definition of Done

### Identity And Source-Set Gates

- [x] `TemplateSkillId` and `SkillId` are distinct; unknown authored IDs remain representable without fake catalog records.
- [x] `/Skills/0` source-shape assumption was checked and rejected; the recorded amendment replaces it with the live index plus linked ranged skill pages.
- [x] Every accepted seed ID appears exactly once as a catalog record or reviewed disposition; numeric gaps are coverage facts only.
- [x] Duplicate IDs, duplicate titles, duplicate canonical pages, missing pages, disambiguation pages, unexplained redirects, and source-set drift are resolved or blocking.
- [x] Source-set plans are digest-bound, profile-bound, cap-checked, and cannot be edited or reused across profiles silently.

### Live And Replay Gates

- [x] Live discovery fetches only the approved source-set index plus linked ranged skill pages, then stops after writing a bounded source plan/digest.
- [x] Detail/icon live fetch requires explicit network opt-in, exact plan path, and exact confirmation digest.
- [x] Code-owned caps cover IDs, pages, media titles, batches, requests, retries, continuation, response bytes, parser bytes, aggregate bytes, catalog bytes, QA bytes, and evidence excerpts.
- [x] A complete `SourceSnapshotSetManifest` verifies every selected child manifest and payload digest; partial, extra, missing, duplicated, mixed-profile, or path-escaping inputs cannot replay or promote.
- [x] Interrupted/partial live runs are either superseded or resumed through explicit manifest identity; they cannot be selected accidentally.

### Catalog Content Gates

- [x] Existing EPIC-02 and EPIC-03 profiles, generated outputs, and tests remain compatible unless a documented migration is implemented.
- [x] Production joins verify the promoted EPIC-03 catalog, adjacent manifest digest, relevant section digests, and QA gate state before use.
- [x] `src/domain` remains JSON-compatible and framework-neutral with no React, DOM, storage, network, filesystem, app, Python, manifest, or QA imports.
- [x] Skill records include ID, template ID, canonical name, normalized key, wiki URL, campaign, type, classification, costs, timings, descriptions or states, progressions, split group, provenance references, and nullable icon ID.
- [x] Profession and attribute IDs come from EPIC-03 lookups; `null` joins occur only for verified common, no-attribute, title, special, non-player, or dispositioned classifications.
- [x] Cost and timing fields distinguish simultaneous components, explicit zero, absent, not-applicable, numeric, percentage, and recognized special values.
- [x] Acquisition metadata, guide prose, strategy, usage notes, vendor/drop/quest instructions, community content, raw page bodies, and MediaWiki HTML are absent from schema v1 and generated output.
- [x] Icon records are metadata-only with `cachedBytes: false`; no icon binaries, thumbnails, screenshots, or media payloads are fetched, cached, committed, or bundled.

### Description, Progression, And Split Gates

- [x] Description states are explicit and tested: `reviewed-text`, `structured-only`, `excluded`, or `unsupported`.
- [x] Runtime description/search text is derived only from safe tokens and digest-bound review; unknown copied material is resolved or excluded and cannot pass as public-release risk.
- [x] Review invalidates on source revision, normalized text, tokenizer/projection version, parser behavior, or description-section digest change.
- [x] Supported progressions cover attribute ranks, title ranks, constants, multiple value slots, mode variants, and morale-boost recharge where source evidence supports them.
- [x] Unsupported or malformed source-indicated progressions produce blocking findings rather than guessed values.
- [x] PvE/PvP split groups have exactly one proven member per mode, reciprocal traversal, consistent flags, no self-links, no duplicate membership, and explicit ambiguity for unknown mode.
- [x] Pure lookup/tooltip helpers return structured unresolved outcomes for unknown ID, unknown mode, missing rank, title dependency, or unsupported progression.

### Determinism, QA, And Version Gates

- [x] Canonical output is stable under input ordering, API response ordering, batch boundaries, filesystem ordering, and concurrent completion.
- [x] Repeated fixed-clock fixture generation is byte-identical for catalog, manifest, QA JSON, source ordering, section digests, summary counts, and finding IDs.
- [x] Complete live snapshot-set replay is byte-identical across two fixed-clock offline runs before promotion.
- [x] Semantic section digests and `catalogVersion` change for every runtime-semantic mutation and stay stable for retrieval/review timestamp-only changes.
- [x] QA covers source-set accounting, page resolution, EPIC-03 joins, infobox fields, costs, descriptions, progressions, variants, icons, provenance, freshness, schema, versioning, output caps, baseline, and artifact integrity.
- [x] QA findings remain bounded but addressable by affected skill ID; systematic findings cannot silently drop records or evidence.

### Promotion And Closeout Gates

- [x] Production promotion uses one complete bounded live refresh, selected offline replay, description/disposition/warning reviews, and first-baseline review.
- [x] `appConsumptionGate` and `publicReleaseGate` are `pass`; critical/error findings are closed or excluded according to policy and every warning has bounded named disposition.
- [x] The first-baseline review binds seed/source-set/snapshot-set/dependency/description/catalog/artifact/QA digests to one named release decision.
- [x] Only `data/generated/epic-04/skills.catalog.json`, `data/generated/epic-04/skills.catalog.manifest.json`, and `data/qa/epic-04/skills.catalog.qa.json` are allowlisted.
- [x] `git check-ignore -v` and `git status --short` prove raw snapshots, source plans, snapshot-set manifests, candidates, summaries, logs, page bodies, media bytes, and unrelated generated files remain ignored or absent.
- [x] `npm run data:regenerate`, `npm run data:test`, and `npm run verify` pass without live network access.
- [x] README, data docs, script docs, compendium, generated files, QA state, tickets, sprint, ledger, and result manifest agree on IDs, paths, versions, modes, caps, review scope, assumptions, limitations, and status.
- [x] BW-0401 through BW-0406, EPIC-04, SPRINT-005, and `work/sprints/ledger.tsv` are marked complete only after all gates pass.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                                                             | Likelihood | Impact | Mitigation                                                                                                                                                              |
| -------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approved ranged-page source set is incomplete or shaped differently than assumed | Medium     | High   | Phase 1 source-shape checkpoint; block for amendment instead of broadening source set silently.                                                                         |
| Large detail fetch accidentally turns into an unbounded crawl                    | Medium     | High   | Discover/fetch split, exact digest confirmation, fixed API origin, code-owned caps, and no source-provided URL expansion.                                               |
| Source revisions drift during a long refresh                                     | Medium     | High   | Recheck seed-set digest, capture per-page revisions, record snapshot-set coherence, review drift, and reject source-set changes before promotion.                       |
| Partial or mixed snapshot sets replay as complete                                | Medium     | High   | Complete/partial state, child digests, exact counts, profile identity, path confinement, and strict offline `--snapshot-set` requirement.                               |
| Page normalization loses requested-to-canonical association                      | Medium     | High   | Preserve requested, normalized, redirect, canonical, page, revision, and response-order facts; test reordered responses and duplicate canonical targets.                |
| Description review becomes the critical path                                     | High       | High   | Size corpus in Phase 1, bind reviews to section digests, permit explicit excluded/structured-only states where truthful, and block promotion if review cannot complete. |
| Copied or near-copied prose enters runtime data                                  | High       | High   | Safe token model, source-policy classification, digest-bound review, no HTML/page bodies, and non-waivable unknown copied material.                                     |
| Progression template diversity exceeds parser support                            | Medium     | High   | Source-shape inventory, minimized fixtures, bounded supported forms, explicit raw structured evidence, and blocking diagnostics for unsupported tooltip-critical forms. |
| Costs collapse special cases into ambiguous nulls                                | Medium     | High   | Independent cost/timing components, typed value states, cross-language tests, and fixtures for signet, adrenaline, sacrifice, upkeep, overcast, and special recharge.   |
| EPIC-03 dependency drift breaks joins                                            | Medium     | High   | Verify EPIC-03 artifact digest, section digests, schema, and QA state before production joins; force regeneration/review on dependency changes.                         |
| Audit data makes the runtime catalog too large                                   | Medium     | Medium | Keep full snapshot paths, review evidence, and release gates in manifest/QA; measure catalog and QA byte caps before promotion.                                         |
| Semantic version omits a runtime field                                           | Medium     | High   | Schema-owned projections and mutation tests for identity, search, cost, description, progression, split, media, and dependency sections.                                |
| Generated QA becomes too noisy to review                                         | Medium     | Medium | Stable finding IDs, code/category summaries, bounded excerpts, affected-skill addressability, and early systematic-finding checks.                                      |
| Profile changes regress EPIC-02 or EPIC-03                                       | Medium     | High   | Preserve registered profile tests, all-profile fixture orchestration, and compatibility checks before EPIC-04 promotion.                                                |
| Live network unavailable during implementation                                   | Medium     | Medium | Complete fixture/offline implementation, but leave production promotion and sprint completion blocked until bounded live refresh succeeds.                              |
| Exact-path allowlisting leaks extra artifacts                                    | Low        | High   | Parent re-ignore rules, exact-file exceptions, `git check-ignore -v`, status inspection, and no force-add workflow.                                                     |

## Security Considerations

- Treat seed lines, titles, redirects, canonical titles, wikitext, templates, parameters, description text, file names, URLs, revision metadata, source plans, manifests, baselines, catalogs, and QA evidence as untrusted input.
- Permit network access only in explicit live mode with `--allow-live-network`, the fixed Guild Wars Wiki API origin, a registered profile, finite timeouts, retry/continuation caps, and code-owned ceilings.
- Reject arbitrary endpoints, source-provided URLs, final redirects outside the configured API origin, recursive category crawling, credentials, cookies, tokens, and environment secrets.
- Parse wiki content as inert data. Never execute templates, Lua, HTML, JavaScript, CSS, shell snippets, links, or source-provided commands.
- Store description tokens and tooltip output as plain text. Runtime UI must escape them and must not inject token text into `innerHTML`.
- Bound accepted IDs, titles, batches, requests, response bytes, parser bytes, template traversal, progression ranks/value slots, output bytes, findings, and evidence excerpts.
- Preserve path confinement, safe slugs, symlink-escape checks where practical, atomic writes, finite-number checks, stable ordering, and SHA-256 verification.
- Do not use source titles or IDs directly as filesystem paths.
- Do not log or promote raw page bodies, complete title sets, copied descriptions, response headers, local environment values, absolute machine paths, or unbounded QA excerpts.
- Never request remote icon URLs returned by `imageinfo`; query metadata only and keep `cachedBytes: false`.
- Keep raw snapshots, source plans, snapshot-set manifests, candidate artifacts, QA summaries, logs, review scratch files, and media files ignored.

## Dependencies

- `EPIC-00` / `SPRINT-001` for repository layout, TypeScript/Vite tooling, domain boundaries, synthetic fixtures, and `npm run verify`.
- `EPIC-01` / `SPRINT-002` for source policy, provenance, manual review, media restrictions, artifact retention, QA gates, and exact-path promotion rules.
- `EPIC-02` / `SPRINT-003` for the MediaWiki client, verified snapshots, `mwparserfromhell`, skill-ID enumeration proof, metadata-only icon resolution, canonical artifact writing, QA reports, and fixture/offline/live modes.
- `EPIC-03` / `SPRINT-004` for the promoted professions/attributes catalog, template crosswalks, section digests, generated-data QA practices, and source-profile pattern.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and `npm run data:setup` for the pinned parser environment.
- Guild Wars Wiki availability is required for production live refresh only. Routine fixture regeneration, tests, build, and `npm run verify` remain offline.
- Maintainer review capacity is required for source-set digest, description corpus, exceptional dispositions, warning dispositions, and first-baseline promotion.
- Downstream consumers include EPIC-05 Template Compatibility, EPIC-06 Game Rule Engine, EPIC-08 Core Build Editor, EPIC-15 Title Tracks and PvE-only, EPIC-19 Guide Authoring, and EPIC-20 Search and Discovery.

## Open Questions

No open question blocks execution. Defaults for this sprint:

1. `Guild Wars Wiki:Game integration/Skills` is the source-set index, and its linked ranged skill pages are the seed authority; source-shape proof can block but cannot silently expand the accepted source set.
2. Production promotion requires live refresh and selected offline replay. If live source access is unavailable, the sprint blocks before completion.
3. Schema v1 excludes acquisition metadata.
4. Runtime description text requires digest-bound review; otherwise records use explicit structured-only/excluded/unsupported states with QA disposition.
5. Title-rank progression values and stable dependency keys are included, but title identity, allegiance, eligibility, and effective rank are deferred to EPIC-15.
6. Runtime catalog excludes adjacent manifest content, local snapshot paths, full QA bodies, full review evidence, and raw parser output.
7. `npm run verify` remains offline; live refresh is a separate manual promotion gate.
