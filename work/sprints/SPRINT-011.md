---
id: SPRINT-011
title: Runes Catalog
status: done
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
completed: 2026-09-02
---

# Sprint 011: Runes Catalog

## Overview

This sprint turns `EPIC-10 Runes` into a runtime-eligible Guild Wars armor-rune
catalog. It extends the existing EPIC-02 ingestion platform and the EPIC-03/04
catalog pattern, joins profession and attribute facts through the promoted
EPIC-03 catalog, models rune effects as plain data, and promotes exactly one
catalog JSON, one adjacent generated artifact manifest, and one bounded
machine-readable QA report.

The sprint is content and domain groundwork. It does not add armor or equipment
editor UI, import rune data into the app, expand the saved-build schema,
interpret equipment templates semantically, fetch remote icons at runtime,
catalog armor shells or insignias, calculate complete character statistics, or
copy source-authored long prose. `ArmorPiece.runeId` remains the future
attachment point. EPIC-13 owns armor/headgear records, EPIC-14 owns equipment
editing and legality, EPIC-17 owns semantic equipment-template resolution,
EPIC-20 owns search presentation, and EPIC-21 owns broad stat analysis.

The plan makes four execution defaults explicit. First, v1 rune identity is
anchored to verified equipment-template modifier IDs through an explicit
`templateModifierId` field; accepted player-usable armor runes without unique
modifier IDs block promotion. Second, source authority starts as a bounded
hybrid of `Equipment template format`, `Rune`, `Attribute bonus`, verified
detail pages, and the promoted EPIC-03 catalog. Third, stacking is recorded per
effect, never as a single record-level `stackable` boolean. Fourth, production
promotion requires a reviewed source plan, a complete selected snapshot set,
deterministic offline replay, first-baseline review, and passing release gates.
If those production inputs cannot be qualified, fixture/offline implementation
may land, but this sprint remains blocked rather than weakening the gates.

## Use Cases

1. **Offer legal rune candidates later**: EPIC-14 can list runes by profession,
   affected attribute, family, rank, and armor-upgrade scope without reading
   wiki pages or QA reports.
2. **Resolve template modifiers later**: EPIC-17 can map a decoded
   `TemplateEquipmentModifierId` to a `RuneId` through an explicit catalog
   crosswalk while preserving unknown authored modifier IDs.
3. **Apply attribute rune bonuses later**: A caller can derive one highest
   rune bonus per affected attribute and pass it to the existing effective-rank
   helper as a rune adjustment.
4. **Preserve health penalties**: Repeated major or superior attribute runes
   keep one verified health-penalty occurrence per equipped rune even when only
   one attribute bonus applies.
5. **Represent common rune families**: Vigor, Vitae, Attunement, Absorption,
   and condition-related families carry typed values and verified stackability
   where source evidence supports it.
6. **Avoid false precision**: Ambiguous, conditional, or parser-unsupported
   behavior remains `note-only`, `unknown`, or dispositioned QA data instead
   of being converted into guessed arithmetic.
7. **Audit and refresh data**: Maintainers can review a bounded source-plan
   digest, fetch only confirmed pages and metadata, replay a complete snapshot
   set offline, and trace promoted records to source and QA evidence.
8. **Hand off headgear safely**: EPIC-13/14 can distinguish attribute-linked
   rune facts from armor-owned headgear bonuses without double-counting.

## Architecture

### Scope Boundary

| Area               | In Scope                                                                                                                                                                                         | Out Of Scope                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain contracts   | `RuneCatalog`, rune records, source-set summaries, compact dispositions, effect variants, stacking rules, dependency summaries, metadata-only media refs, and pure lookup/effect helpers.        | React, browser APIs, storage, runtime fetches, source plans, full QA bodies, generated manifest imports, source snapshots, or data-script imports. |
| Ingestion          | EPIC-10 profile, source-shape checkpoint, digest-bound source planning, bounded live fetch, selected offline replay, extraction, semantic normalization, QA, and deterministic artifact writing. | One-off rune scraper, arbitrary URL fetching, recursive category crawl, browser automation, or live network during `npm run verify`.               |
| Runtime data       | `data/generated/epic-10/runes.catalog.json` plus compact semantic facts and provenance references.                                                                                               | Raw page bodies, source plans, snapshot-set manifests, QA summaries, review scratch files, icon bytes, screenshots, or copied long prose.          |
| Promotion evidence | Adjacent manifest and QA JSON with artifact integrity, selected input digests, release gates, findings, and review evidence.                                                                     | App behavior, bundled runtime imports, or hand-authored production JSON.                                                                           |
| Rune semantics     | Attribute bonuses, health penalties, health bonuses, energy bonuses, verified stackability, unknown/note states, and headgear handoff facts.                                                     | Armor-slot legality, armor shell cataloging, insignia composition, weapons, title ranks, complete health/energy totals, or combat simulation.      |
| Closeout           | README/data docs, compendium note, ticket links/statuses, ledger sync, and ticket-burn manifest.                                                                                                 | Commit creation or unrelated implementation cleanup.                                                                                               |

### Source Authority

The Phase 1 source-shape checkpoint runs before final schema freeze. The
starting authority is:

- `Equipment template format` for rune-like equipment modifier IDs and initial
  candidate names.
- `Rune` for the armor-rune inventory, common family coverage, and broad rune
  mechanics.
- `Attribute bonus` for the headgear handoff fact.
- Verified rune detail pages for canonical page identity, redirects, revision
  facts, icon candidates, family/rank evidence, restrictions, and effect facts.
- The promoted EPIC-03 professions/attributes catalog for all `ProfessionId`
  and `AttributeId` joins.

The source graph is finite and reviewable. Category crawl, site search,
PvX/community pages, arbitrary recursive links, source-provided fetch URLs, and
runtime wiki access are excluded. If the checkpoint proves that the bounded
hybrid is incomplete or shaped differently than expected, execution records the
blocking source decision and amends the sprint instead of broadening silently.

Every rune-like modifier row and every armor-rune inventory entry must become
one of: accepted rune, supported relationship to an accepted rune, explicit
non-armor-rune exclusion, unsupported disposition, or blocking finding.
Container runes, insignias, weapon modifiers, removed/historical records, and
non-player records are not silently skipped.

### Data Flow

```text
promoted EPIC-03 catalog + manifest + passing QA
                          |
bounded rune source-shape checkpoint
                          |
source plan digest and review
                          |
digest-confirmed seed/detail/icon metadata fetch
                          |
complete SourceSnapshotSetManifest
                          |
selected offline replay, no network
                          |
raw rune extraction and EPIC-03 joins
                          |
effect-level semantic normalization
                          |
RuneCatalog semantic JSON
                          |
GeneratedArtifactManifest + bounded QaReport
                          |
first-baseline review and exact-path promotion
```

Fixture mode is synthetic and network-free. Live discovery/fetch is manual-only
and fixed-origin. Offline replay requires one complete selected snapshot set and
rejects partial, mixed-profile, extra, missing, duplicate, edited, path-escaping,
or digest-mismatched inputs before extraction begins.

### Runtime Contract

`RuneCatalog` mirrors the existing promoted catalog style while keeping audit
detail out of runtime imports:

```text
RuneCatalog
  schemaVersion: 1
  catalogVersion: semantic digest
  sectionDigests: CatalogSectionDigest[]
  generatedAt: ISO timestamp
  generator: pinned generator identity
  profile: RuneCatalogProfile
  dependencyDigests: [EPIC-03 dependency summary]
  sourceSet: compact source-set summary
  dispositions: compact runtime-relevant dispositions
  runes: CatalogRuneRecord[]
  remoteMedia: RemoteMediaMetadata[]

CatalogRuneRecord
  id: RuneId
  templateModifierId: TemplateEquipmentModifierId
  name: canonical display name
  normalizedName: collision-safe lookup key
  wikiUrl: canonical HTTPS URL
  pageIdentity: requested/normalized/canonical title and page/revision facts
  familyKey: stable schema-owned family key
  familyKind: attribute | vigor | vitae | attunement | absorption |
              condition-reduction | other
  familyRank: minor | major | superior | null
  rarityTier: minor | major | superior | null
  eligibility: profession-armor | universal-armor | unknown
  professionId: ProfessionId | null
  affectedAttributeId: AttributeId | null
  effects: non-empty RuneEffect[]
  headgearInteraction: attribute-linked | not-applicable | unknown
  displayState: structured-only | reviewed-short-text | excluded
  iconId: string | null
  provenance: compact field provenance
```

Exact TypeScript names may adjust to local style, but these distinctions are
acceptance requirements. The existing lightweight `Rune` interface should remain
available beside the generated-catalog record type, as `Skill` sits beside
`CatalogSkillRecord`.

Compact `sourceSet` and `dispositions` may remain in the runtime catalog because
that is the established EPIC-04 pattern. Full source plans, child snapshot
paths, review records, QA findings, release gates, and local paths stay in the
manifest or QA report only.

### Effects And Stacking

Supported numeric effects carry value, unit, target, provenance, and an
effect-level stacking rule. Supported stacking rules are:

- `sum`: every equipped occurrence contributes its signed value.
- `highest`: one greatest value contributes within the effect group key.
- `separate`: the catalog can state the fact, but a later calculator must own
  cross-system composition.
- `unknown`: source evidence is insufficient for arithmetic.

Minimum v1 effect kinds are:

| Effect kind                    | Required fields                                           | V1 behavior                                                                                                   |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `attribute-rank`               | `attributeId`, positive integer `amount`                  | Uses `highest` for `attribute:<id>`. Minor/major/superior values are accepted only after source verification. |
| `maximum-health-delta`         | signed integer `amount`                                   | Attribute-rune penalties use `sum`; Vigor uses `highest` when verified; Vitae uses `sum` when verified.       |
| `maximum-energy-delta`         | signed integer `amount`                                   | Attunement uses `sum` when verified.                                                                          |
| `physical-damage-reduction`    | value and supported damage scope                          | Absorption can be structured only where source evidence is clear; broader combat math stays deferred.         |
| `condition-duration-reduction` | controlled condition keys and percentage                  | Structured only for source-clear fixed facts; rounding and cross-system composition stay deferred.            |
| `note-only`                    | stable note code, bounded reviewed text, provenance       | No arithmetic. Used for ambiguous or deferred behavior.                                                       |
| `unknown`                      | stable source-field reference, bounded reason, provenance | No arithmetic. Used when a record is accepted but an effect cannot safely be modeled yet.                     |

Malformed parser data is not a normal runtime effect. It becomes QA or a
disposition. Accepted records must have at least one structured, `note-only`, or
`unknown` effect, and unknown required core mechanics block promotion.

The critical handoff rule is explicit: for a given affected attribute, only the
highest applicable attribute-rune bonus contributes to effective attribute rank,
while every verified health penalty from equipped runes remains independently
countable. Equal highest bonuses do not double-apply. Input order must not
change helper output.

### Helper Boundary

Add a narrow pure helper only if raw lookups are insufficient:

```text
summarizeAttributeRuneEffects(catalog, equippedEntries)
```

It accepts caller-owned equipped entries with unique source keys and `RuneId`
values. It returns:

- selected attribute-rank contributions sorted by attribute ID;
- `EffectiveAttributeRankAdjustment`-compatible rune adjustments;
- one negative health occurrence per equipped attribute rune that carries a
  verified penalty;
- summed attribute-rune health delta;
- typed unresolved reasons for unknown IDs, duplicate source keys, malformed
  catalog records, note-only/unknown effects, and unsupported semantics.

It does not choose armor slots, validate primary-profession legality, apply
headgear bonuses, aggregate Vigor/Vitae/Attunement/Absorption into full stats,
read files, import app modules, fetch data, or mutate inputs. A focused test
must prove that two superior runes for one attribute produce one `+3` rank
adjustment and two `-75` health occurrences totaling `-150`.

### Alternatives Considered

- **Category crawl as authority**: rejected for v1 because it is not bounded
  enough for digest review. Categories can be source-shape evidence, not an
  unbounded expansion rule.
- **Record-level `stackable`**: rejected because one rune can have a highest
  attribute bonus and a summed health penalty.
- **Runtime import of manifest or QA data**: rejected. Runtime consumers get
  catalog JSON only.
- **App import during EPIC-10**: deferred. Validate via domain and generated
  contract tests instead of adding an unused `src/app/catalogs.ts` import.
- **Hand-authored production JSON**: rejected. Promoted artifacts must be
  generated from reviewed source inputs.
- **Full stat calculator**: deferred to equipment and analysis epics.
- **Headgear `+1` as a rune effect**: rejected. Headgear remains armor-owned.
- **Broad shared ingestion refactor as a required milestone**: rejected. Shared
  source-plan helpers are allowed only when EPIC-04 bytes and behavior remain
  unchanged under tests.

## Implementation

### Phase 1: BW-1001 Source Shape, Contracts, And Profile (~15% of effort)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/rune-effects.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/rune-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `work/tickets/10-runes/BW-1001-rune-catalog-contracts-and-profile.md`

**Tasks:**

- [x] Mark EPIC-10 and BW-1001 in progress when implementation starts; do not
      advance dependent tickets before the Phase 1 gate.
- [x] Run a bounded source-shape checkpoint for the proposed seed pages,
      representative attribute-rune pages, common rune pages, redirects,
      same-page/multi-rank variants, icon fields, and stackability evidence.
- [x] Confirm or amend the bounded source authority. If the source graph cannot
      be finite, complete, and reviewable, stop for a recorded amendment before
      freezing schema.
- [x] Define schema-v1 `RuneCatalog`, `CatalogRuneRecord`, profile,
      dependency, source-set, disposition, page identity, family/rank/tier,
      eligibility, display, effect, stacking, and headgear-handoff types.
- [x] Reuse existing `RuneId`, `TemplateEquipmentModifierId`, `ProfessionId`,
      and `AttributeId` brands. Do not add a parallel public rune ID namespace.
- [x] Lock the ID policy: accepted player-usable armor runes require unique
      verified `templateModifierId` values; post-promotion ID changes are
      generated-data diffs requiring explicit review.
- [x] Add collision-safe rune lookup contracts by catalog ID, template modifier
      ID, and normalized name where tests need them.
- [x] Add `src/domain/rune-effects.ts` contracts for the narrow attribute-rune
      summary helper, leaving implementation detail for Phase 4.
- [x] Register `epic-10-runes` with exact output paths, fixture/offline/live
      support, metadata-only media policy, EPIC-03 dependency requirement, and
      code-owned page/request/byte/artifact caps.
- [x] Generalize CLI/profile routing only as much as needed for EPIC-10 while
      preserving existing EPIC-02, EPIC-03, and EPIC-04 behavior.
- [x] Add TypeScript wire-shape tests and Python profile/CLI tests, including
      live without opt-in, fetch without digest confirmation, offline without a
      snapshot set, and output-path overlap.

**Phase Gate:**

- [x] The source authority, ID policy, domain contract, profile registration,
      runtime/audit split, and existing profile compatibility are settled.
- [x] The contract can represent required rune semantics without a record-level
      stackable flag, framework import, runtime audit path, or full-stat API.
- [x] BW-1001 is marked done only after its acceptance criteria and focused
      verification pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/rune-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`

### Phase 2: BW-1002 Source Set, Page Resolution, And Fixtures (~18% of effort)

**Files:**

- `scripts/data/build_wars_ingest/rune_source_set.py`
- `scripts/data/build_wars_ingest/api.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_rune_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_skill_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/runes/`
- `work/tickets/10-runes/BW-1002-rune-source-set-and-page-resolution.md`

**Tasks:**

- [x] Mark BW-1002 in progress only after the Phase 1 gate passes.
- [x] Build deterministic source-plan records over modifier-row candidates,
      armor-rune inventory entries, expected attribute/rank matrix facts,
      common family candidates, exclusions, and requested detail/media titles.
- [x] Account for every candidate as accepted, supported relationship,
      explicit exclusion, unsupported disposition, or blocking finding.
- [x] Preserve requested, normalized, redirected, canonical, page ID, revision
      ID, revision timestamp, missing-page, duplicate-title, duplicate-canonical,
      disambiguation, namespace, and source-order facts.
- [x] Detect duplicate IDs, duplicate source keys, duplicate normalized names,
      same-page multi-variant records, conflicting modifier-row versus rune
      inventory evidence, unsupported families, missing expected variants,
      malformed rows, gaps, source drift, and unexpected source shapes.
- [x] Implement discover-only mode that writes an ignored canonical source plan
      with profile identity, caps, EPIC-03 dependency facts, source revisions,
      candidate counts, family/rank counts, dispositions, and digest.
- [x] Implement digest-confirmed fetch that revalidates source-plan digest,
      profile identity, dependency identity, source-set digest, caps, and source
      drift before writing detail snapshots.
- [x] Write complete or partial EPIC-10 snapshot-set manifests with child
      digests, aggregate counts/bytes, source-plan identity, completion state,
      and bounded failure detail. Partial sets cannot replay or promote.
- [x] Reject offline replay for partial, extra, missing, duplicate, edited,
      mixed-profile, plan-mismatched, dependency-mismatched, path-escaping, or
      digest-mismatched inputs.
- [x] Add minimized synthetic fixtures for three ranks of an attribute family,
      same-page multi-rank records, Vigor, Vitae, Attunement, Absorption,
      one condition family, universal/common runes, container exclusions,
      redirects, duplicate names/IDs, missing pages, missing icons, malformed
      rows, conflicting source evidence, Restoration versus Restoration Magic,
      gaps, and unexpected families.
- [x] Prove fixture discovery is network-free, deterministic under reordered
      input, and bounded under oversized or malicious input.

**Phase Gate:**

- [x] A reviewer can inspect one canonical source plan and account for every
      rune-like seed entry before any detail-page request is authorized.
- [x] Existing EPIC-04 source-set/snapshot-set tests and bytes remain compatible
      if any helper is shared. Otherwise keep EPIC-10 source planning isolated.
- [x] BW-1002 is marked done only after its acceptance criteria and focused
      verification pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_source_set build_wars_ingest.tests.test_skill_source_set`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-10-runes --root work/runs/data-ingestion/epic-10-fixture-a --fixture-root test/fixtures/data-ingestion`

### Phase 3: BW-1003 Rune Extraction And Joins (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/rune_extractor.py`
- `scripts/data/build_wars_ingest/rune_source_set.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_rune_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/runes/`
- `test/domain/rune-catalog.test.ts`
- `work/tickets/10-runes/BW-1003-rune-extractors.md`

**Tasks:**

- [x] Mark BW-1003 in progress only after the Phase 2 source-set gate passes.
- [x] Parse verified seed/detail snapshots with `mwparserfromhell` and bounded
      table/template adapters. Do not use live clients inside extractors.
- [x] Produce deterministic raw rune records containing modifier ID, names,
      aliases, family label, family-rank token, rarity token, profession and
      affected-attribute labels, raw structured effect fields, restriction
      facts, headgear-relevance evidence, page identity, icon candidate, and
      field-level source references.
- [x] Support same-page multi-rank or multi-variant extraction without duplicate
      page fetches, ID collapse, or provenance loss.
- [x] Preserve unsupported raw effect field identity as bounded evidence for QA,
      but do not copy raw effect paragraphs or page bodies into runtime records.
- [x] Join professions and affected attributes through unique EPIC-03 catalog
      records and dependency digests, never through unchecked numeric
      coincidence, array position, or substring-only matching.
- [x] Distinguish Restoration condition-family records from the Ritualist
      Restoration Magic attribute through full candidate identity, controlled
      family kind, and EPIC-03 joins.
- [x] Reject impossible rank/tier combinations, contradictory profession labels,
      positive health penalties, negative bonuses, zero values where invalid,
      unsafe units, overflow, non-finite values, and attribute/profession
      mismatches.
- [x] Resolve metadata-only icon records from verified image fields and
      `imageinfo`; record `cachedBytes: false` and nullable `iconId`. Do not
      fetch or persist bytes, thumbnails, or arbitrary URLs.
- [x] Emit stable findings for duplicate IDs/names/source keys, lookup-key
      collisions, missing restrictions, missing revisions, missing icons,
      unknown templates/parameters/families, malformed numeric fields, lossy
      parsing, unsafe text, and copied-text risk.
- [x] Sort raw records and dispositions by stable numeric/source keys regardless
      of request order, page order, or filesystem order.

**Phase Gate:**

- [x] Raw extraction is loss-aware and source-traceable, contains no inferred
      stacking or copied long-form display text, and accounts for every fixture
      candidate.
- [x] Every accepted attribute-rune record has a unique EPIC-03
      profession/attribute join, or it blocks promotion with a stable finding.
- [x] BW-1003 is marked done only after its acceptance criteria and focused
      verification pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_extractor build_wars_ingest.tests.test_icons`
- `npm run test:run -- test/domain/rune-catalog.test.ts`
- `npm run data:test`

### Phase 4: BW-1004 Effect Semantics And Validation Fixtures (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/rune_semantics.py`
- `scripts/data/build_wars_ingest/rune_extractor.py`
- `scripts/data/build_wars_ingest/rune_catalog.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_rune_semantics.py`
- `scripts/data/build_wars_ingest/tests/test_rune_catalog.py`
- `src/domain/rune-effects.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/rune-effects.test.ts`
- `test/domain/rune-catalog.test.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json`
- `work/tickets/10-runes/BW-1004-rune-effect-semantics-and-validation-fixtures.md`

**Tasks:**

- [x] Mark BW-1004 in progress only after deterministic raw extraction passes.
- [x] Implement table-driven semantic normalization for attribute-rank bonuses,
      health deltas, energy deltas, verified damage/condition facts, note-only
      effects, and unknown effects.
- [x] Validate attribute rune ranks against verified source facts: minor `+1`
      with no penalty, major `+2` with independently summed `-35` health, and
      superior `+3` with independently summed `-75` health.
- [x] Encode verified Vigor as highest-in-family health, Vitae as summed health,
      Attunement as summed energy, and Absorption/condition families only where
      the source supports fixed semantics. Route ambiguous rounding, conditions,
      and cross-system composition to note-only or unknown effects.
- [x] Require a stable effect group for every numeric effect, field provenance
      for every modeled value, a review reference for every note-only/unknown
      effect, and non-empty effects for every accepted record.
- [x] Derive `attribute-linked` headgear handoff only for accepted attribute
      runes. Do not emit a headgear adjustment or fold headgear `+1` into rune
      effects.
- [x] Implement the narrow `summarizeAttributeRuneEffects` helper with
      collision-safe lookup, unique caller source keys, deterministic output,
      one maximum per attribute, every negative attribute-rune health occurrence,
      summed penalty, adjustment-compatible output, and bounded unresolved
      reasons.
- [x] Add fixtures for duplicate superior runes, duplicate major runes,
      minor-plus-superior mixes, equal maximum ties, two affected attributes,
      same `RuneId` repeated, unknown IDs, duplicate source keys, note-only
      effects, malformed records, non-attribute deferral, and headgear
      non-application.
- [x] Feed a resolved rune adjustment into `calculateEffectiveAttributeRank` in
      a test without changing that calculator or teaching it stacking rules.
- [x] Prove helpers do not mutate catalogs or entries and do not silently drop
      unresolved equipped occurrences.

**Phase Gate:**

- [x] Two superior runes for one attribute produce one `+3` adjustment and two
      `-75` occurrences totaling `-150`.
- [x] Structured semantics do not overclaim equipment legality, base health,
      title effects, condition rounding, cross-system composition, or headgear
      behavior.
- [x] BW-1004 is marked done only after its acceptance criteria and focused
      verification pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/rune-effects.test.ts test/domain/effective-attribute-rank.test.ts test/domain/rune-catalog.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_semantics build_wars_ingest.tests.test_rune_catalog`

### Phase 5: BW-1005 Assembly, QA, Review, And Exact-Path Promotion (~17% of effort)

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
- `test/domain/data-ingestion-contracts.test.ts`
- `test/domain/rune-catalog.test.ts`
- `test/domain/rune-effects.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json`
- `.gitignore`
- `data/generated/epic-10/runes.catalog.json`
- `data/generated/epic-10/runes.catalog.manifest.json`
- `data/qa/epic-10/runes.catalog.qa.json`
- `work/tickets/10-runes/BW-1005-rune-catalog-qa-and-promotion.md`

**Tasks:**

- [x] Mark BW-1005 in progress only after source-set, extraction, and semantics
      gates pass.
- [x] Assemble canonical catalog sections with dependency facts, source-set
      summary, compact dispositions, rune records, structured effects,
      headgear handoffs, remote media, compact provenance, section digests, and
      semantic catalog version.
- [x] Define semantic-version inputs: consumer-visible identity, names, lookup
      keys, families/ranks, eligibility, effects/stacking, display fields,
      runtime media, compact source dispositions, and EPIC-03 dependency facts.
      Exclude `generatedAt`, the version value itself, local paths, manifest/QA
      paths, retrieval-only timestamps, raw snapshots, QA bodies, and review
      bodies.
- [x] Add mutation tests proving every runtime-semantic field changes its owning
      section digest and `catalogVersion`, while audit-only path/timestamp
      changes do not masquerade as semantic changes.
- [x] Add QA for source accounting, expected family/rank coverage, zero-output
      rejection, modifier/catalog ID uniqueness, normalized-name collisions,
      referential integrity, page/revision/retrieval facts, EPIC-03 joins,
      restrictions, ranks, required effects, stacking keys/rules, penalty
      preservation, headgear classification, copied-text risk, icons, output
      caps, section/version digests, baseline diffs, and artifact integrity.
- [x] Make stable finding IDs independent of request order, absolute path, and
      wall clock. QA overflow or evidence truncation that could hide material
      errors is itself blocking.
- [x] Generate the synthetic EPIC-10 fixture twice into separate ignored roots
      under a fixed clock and prove byte identity for catalog, manifest, QA JSON,
      section digests, source/disposition order, and finding IDs.
- [x] Run bounded live `discover`; review source identities, candidate counts,
      family/rank coverage, caps, dependency facts, and digest before fetch.
- [x] Run digest-confirmed `fetch` only with the reviewed source plan and exact
      source-set digest; retain the complete selected snapshot-set manifest for
      production replay.
- [x] Replay the selected complete snapshot set offline twice under a fixed
      clock and require byte-identical catalog, manifest, QA report, section
      digests, and finding IDs.
- [x] Perform first-baseline review bound to expected counts, ID/family/rank
      coverage, additions/removals, dispositions, section digests, dependency
      digests, display states, icon decisions, artifact digest, QA digest, and
      app/public gate evidence.
- [x] Resolve or exclude all critical/error findings according to policy. Every
      warning must have a named bounded disposition or reviewed finding class.
- [x] Generate approved production bytes from selected offline inputs only.
      Never hand-edit promoted JSON.
- [x] Add only exact EPIC-10 `.gitignore` parent-directory and three-file
      exceptions. Verify source plans, raw snapshots, snapshot-set manifests,
      candidate outputs, QA summaries, icon bytes, screenshots, logs, and other
      byproducts remain ignored or absent.
- [x] Mark BW-1005 done only after all three exact artifacts exist, both release
      gates pass, and evidence is recorded.

**Phase Gate:**

- [x] `data/generated/epic-10/runes.catalog.json`, its adjacent manifest, and
      `data/qa/epic-10/runes.catalog.qa.json` are byte-reproducible, mutually
      consistent, exactly allowlisted, and approved.
- [x] The runtime catalog can be imported in TypeScript tests without reading
      any adjacent audit or ingestion artifact.
- [x] If live source access, selected replay inputs, or review capacity is
      unavailable, leave BW-1005 and the sprint blocked rather than promoting
      fixture data as production.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-10-runes --root work/runs/data-ingestion/epic-10-fixture-a --fixture-root test/fixtures/data-ingestion`
- Repeat fixture generation into `work/runs/data-ingestion/epic-10-fixture-b`
  with the same fixed clock and compare the three JSON outputs byte-for-byte.
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-10-runes --root work/runs/data-ingestion/epic-10-live --allow-live-network --stage discover`
- Run `fetch` with the reviewed `--source-plan` and exact
  `--confirm-source-set-digest`, then run `offline --profile epic-10-runes
--snapshot-set <selected-manifest>` twice under a fixed clock.
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_catalog build_wars_ingest.tests.test_artifacts build_wars_ingest.tests.test_qa build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `npm run test:run -- test/domain/data-ingestion-contracts.test.ts test/domain/rune-catalog.test.ts test/domain/rune-effects.test.ts`
- `git check-ignore -v` for the three promoted paths and representative ignored
  byproducts.
- `git status --short`

### Phase 6: BW-1006 Documentation, Verification, And Closeout (~10% of effort)

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `data/source-snapshots/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/game-rule-engine.md`
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
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-011-result.json`

**Tasks:**

- [x] Mark BW-1006 in progress only after exact-path promotion passes.
- [x] Document source authority, final caps, source-shape results, identity and
      crosswalk semantics, profile modes, digest-confirmed refresh, selected
      offline replay, artifact schema, effect/stacking vocabulary, semantic
      versioning, QA gates, first-baseline review, exact paths, and retention
      limits.
- [x] State that only `data/generated/epic-10/runes.catalog.json` is
      runtime-eligible. Manifests, QA reports, source plans, snapshot sets,
      raw snapshots, QA summaries, review evidence, and Python tooling remain
      non-runtime.
- [x] Document metadata-only icons and the attribution/privacy work a later UI
      must complete before displaying remote media.
- [x] Document EPIC-13/14 handoffs: use `ArmorPiece.runeId`, join legality
      against primary armor profession, keep armor-owned headgear bonuses
      separate, and preserve unknown template modifier IDs.
- [x] Document EPIC-15/17/20/21 handoffs for title separation, template modifier
      resolution, search/tooltips, and unresolved full-stat composition.
- [x] Confirm the current editor, local persistence, sharing, backup/restore,
      template compatibility, EPIC-03/04 catalogs, and app import boundaries are
      unchanged.
- [x] Inspect the worktree for raw snapshots, source plans, snapshot-set
      manifests, candidate outputs, QA summaries, media bytes, screenshots,
      copied prose, broad allowlists, secrets, absolute machine paths,
      nondeterministic timestamps, and unrelated changes.
- [x] Add verification and artifact evidence to BW-1001 through BW-1006. Mark
      tickets done only after their phase gates pass. Mark EPIC-10, SPRINT-011,
      and ledger completed together only after the full Definition of Done.
- [x] Write the ticket-burn execution result manifest with matching sprint,
      epic, ticket IDs, changed-file summary, validation results,
      `blocked_reason`, followups, and no commit creation.
- [x] Do not create a commit.

**Phase Gate:**

- [x] Documentation, tickets, sprint, ledger, promoted artifacts, QA state, and
      result manifest agree on IDs, paths, commands, versions, review scope,
      assumptions, limitations, and status.
- [x] `npm run verify` passes without live network access.
- [x] BW-1006, EPIC-10, and SPRINT-011 are complete only after all gates pass.

**Verification:**

- `npm run data:regenerate`
- Direct EPIC-10 fixed-clock fixture regeneration
- `npm run verify`
- `rg -n 'EPIC-10|BW-100[1-6]|SPRINT-011' work/tickets/10-runes work/sprints`
- `git status --short`
- Manual consistency review across docs, generated files, QA state, tickets,
  sprint, ledger, and result manifest.

## Files Summary

| File                                                                            | Action                  | Purpose                                                                                              |
| ------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/domain/catalog.ts`                                                         | Modify                  | Add rune catalog, record, source-set, dependency, effect, stacking, display, and headgear contracts. |
| `src/domain/catalog-lookup.ts`                                                  | Modify                  | Add collision-safe rune lookup helpers.                                                              |
| `src/domain/rune-effects.ts`                                                    | Create                  | Implement narrow attribute-rune max/penalty helper.                                                  |
| `src/domain/index.ts`                                                           | Modify                  | Export new rune contracts and helper APIs.                                                           |
| `src/domain/ids.ts`                                                             | Reference only          | Reuse existing `RuneId` and `TemplateEquipmentModifierId`.                                           |
| `src/domain/equipment.ts`                                                       | Reference only          | Preserve `ArmorPiece.runeId` as downstream attachment.                                               |
| `src/domain/effective-attribute-rank.ts`                                        | Reference only          | Verify compatibility through tests, not new stacking logic.                                          |
| `scripts/data/build_wars_ingest/config.py`                                      | Modify                  | Add EPIC-10 caps where current defaults are not precise enough.                                      |
| `scripts/data/build_wars_ingest/profiles.py`                                    | Modify                  | Register `epic-10-runes` and exact output paths.                                                     |
| `scripts/data/build_wars_ingest/rune_source_set.py`                             | Create                  | Plan, resolve, digest, and validate rune source sets.                                                |
| `scripts/data/build_wars_ingest/rune_extractor.py`                              | Create                  | Parse source-backed identity, family, restriction, raw effect, headgear, and icon facts.             |
| `scripts/data/build_wars_ingest/rune_semantics.py`                              | Create                  | Convert raw facts into typed effects and effect-level stacking.                                      |
| `scripts/data/build_wars_ingest/rune_catalog.py`                                | Create                  | Assemble canonical output, semantic version, section digests, and QA inputs.                         |
| `scripts/data/build_wars_ingest/api.py`                                         | Modify only if needed   | Preserve page-resolution facts without regressing existing profiles.                                 |
| `scripts/data/build_wars_ingest/snapshots.py`                                   | Modify only if needed   | Reuse complete snapshot-set replay and path confinement.                                             |
| `scripts/data/build_wars_ingest/wikitext.py`                                    | Modify                  | Support bounded rune templates/tables and diagnostics.                                               |
| `scripts/data/build_wars_ingest/icons.py`                                       | Modify                  | Resolve metadata-only rune icon records.                                                             |
| `scripts/data/build_wars_ingest/models.py`                                      | Modify narrowly         | Add shared source/disposition models only where needed.                                              |
| `scripts/data/build_wars_ingest/artifacts.py`                                   | Modify                  | Support EPIC-10 artifact paths, caps, digests, and diff checks.                                      |
| `scripts/data/build_wars_ingest/qa.py`                                          | Modify                  | Add rune-specific QA rules in the shared QA format.                                                  |
| `scripts/data/build_wars_ingest/pipeline.py`                                    | Modify                  | Orchestrate EPIC-10 fixture, discover, fetch, offline replay, and promotion.                         |
| `scripts/data/build_wars_ingest/cli.py`                                         | Modify                  | Expose safe EPIC-10 profile/stage/confirmation/snapshot-set options.                                 |
| `scripts/data/build_wars_ingest/tests/`                                         | Create/modify           | Cover profile, source-set, extraction, semantics, QA, artifacts, pipeline, and CLI behavior.         |
| `test/domain/rune-catalog.test.ts`                                              | Create                  | Validate catalog shape, IDs, lookups, collisions, effects, and semantic versions.                    |
| `test/domain/rune-effects.test.ts`                                              | Create                  | Prove highest attribute bonus and independent health penalty behavior.                               |
| `test/domain/effective-attribute-rank.test.ts`                                  | Modify                  | Prove rune adjustments compose with the existing helper.                                             |
| `test/domain/data-ingestion-contracts.test.ts`                                  | Modify                  | Validate Python-generated rune JSON against TypeScript expectations.                                 |
| `test/fixtures/data-ingestion/runes/`                                           | Create                  | Store minimized synthetic rune source fixtures.                                                      |
| `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json`             | Create                  | Store deterministic synthetic golden rune catalog.                                                   |
| `.gitignore`                                                                    | Modify narrowly         | Allowlist only approved EPIC-10 production artifacts and parent directories.                         |
| `data/generated/epic-10/runes.catalog.json`                                     | Create/allowlist        | Runtime-eligible generated rune catalog.                                                             |
| `data/generated/epic-10/runes.catalog.manifest.json`                            | Create/allowlist        | Adjacent artifact, dependency, digest, and review evidence.                                          |
| `data/qa/epic-10/runes.catalog.qa.json`                                         | Create/allowlist        | Bounded machine-readable QA and release gates.                                                       |
| `README.md`, `scripts/data/README.md`, `data/**/README.md`                      | Modify                  | Document commands, exact paths, runtime boundaries, and retention.                                   |
| `compendium/data-ingestion-platform.md`                                         | Modify                  | Record EPIC-10 profile and replay behavior.                                                          |
| `compendium/game-rule-engine.md`                                                | Modify narrowly         | Clarify rune helper boundary and deferred equipment validation.                                      |
| `compendium/runes-catalog.md`                                                   | Create                  | Durable source authority, schema, effects, stacking, QA, and handoff note.                           |
| `compendium/README.md`                                                          | Modify                  | Index the rune catalog note.                                                                         |
| `work/tickets/10-runes/*.md`                                                    | Modify                  | Track sprint linkage, status, assumptions, and closeout evidence.                                    |
| `work/sprints/SPRINT-011.md`                                                    | Create/update           | Sprint plan and execution checklist.                                                                 |
| `work/sprints/ledger.tsv`                                                       | Modify                  | Track SPRINT-011 lifecycle.                                                                          |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-10-result.json`       | Create during planning  | Required ticket-burn planning manifest.                                                              |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-011-result.json` | Create during execution | Required ticket-burn execution manifest.                                                             |

## Definition of Done

### Source And Identity Gates

- [x] The final source authority is finite, documented, digest-bound, and
      approved before detail fetch or promotion.
- [x] Every rune-like modifier row and armor-rune inventory entry becomes an
      accepted rune, supported relationship, explicit exclusion, unsupported
      disposition, or blocking finding.
- [x] Redirects, duplicate IDs, duplicate source keys, duplicate names,
      duplicate canonical pages, missing pages, malformed pages, unsupported
      records, conflicting source evidence, and source drift are resolved or
      blocking.
- [x] Stable `RuneId` assignment is source-order-independent,
      collision-checked, anchored to verified `templateModifierId`, and guarded
      by generated-data diff review.
- [x] Existing EPIC-02, EPIC-03, and EPIC-04 profiles, outputs, CLI behavior,
      and tests remain compatible.

### Contract And Runtime Gates

- [x] `RuneCatalog` is framework-neutral, JSON-compatible, schema-versioned,
      and exported through `src/domain`.
- [x] `src/domain` imports no React, DOM/browser APIs, browser storage,
      network clients, app modules, generated manifests, QA reports, source
      snapshots, filesystem APIs, or Python modules.
- [x] Rune records include stable ID, template modifier ID, name, normalized
      key, wiki URL, page identity, family, rank/tier, eligibility, profession
      restriction, affected attribute, non-empty structured effects, headgear
      state, display state, nullable icon ID, and compact provenance.
- [x] Profession and affected-attribute joins resolve through EPIC-03 catalog
      facts and dependency digests.
- [x] Runtime catalog JSON excludes raw page bodies, source plans, local paths,
      full QA bodies, review scratch evidence, copied long prose, MediaWiki
      HTML, icon bytes, screenshots, thumbnails, and source-provided commands.

### Effect And Stacking Gates

- [x] Attribute bonuses, health penalties, health bonuses, energy bonuses,
      verified damage/condition facts, note-only effects, and unknown effects
      are distinct typed states.
- [x] Stacking is effect-level and uses stable group keys. A record-level
      `stackable` boolean is not used as the source of truth.
- [x] Duplicate attribute-rune fixtures prove the highest applicable attribute
      bonus wins per affected attribute.
- [x] The same fixtures prove every verified health penalty from equipped
      runes remains independently countable.
- [x] Equal-maximum ties, same-ID duplicate instances, mixed ranks, multi-
      attribute entries, unknown IDs, duplicate source keys, note-only effects,
      and malformed records have deterministic helper outcomes.
- [x] Verified non-attribute stackability is encoded explicitly. Ambiguous
      behavior remains visible through typed notes, unknown states, and QA.
- [x] Headgear interaction facts remain handoff facts and do not create armor
      shell, equipment UI, or headgear `+1` ownership.
- [x] Pure helpers do not become a full armor/stat calculator.

### Determinism, QA, And Promotion Gates

- [x] Fixture mode is synthetic and network-free.
- [x] Live fetch requires `--allow-live-network`, registered `epic-10-runes`,
      exact source-plan path, exact source-set digest confirmation, and fixed
      Guild Wars Wiki API origin.
- [x] Offline replay requires one complete EPIC-10 `SourceSnapshotSetManifest`
      and rejects partial, missing, extra, duplicate, mixed-profile,
      digest-mismatched, plan-mismatched, dependency-mismatched, or
      path-escaping inputs.
- [x] Canonical output is stable under input ordering, API response ordering,
      filesystem ordering, batch boundaries, and concurrent completion.
- [x] Repeated fixed-clock fixture generation is byte-identical for catalog,
      manifest, QA report, source ordering, section digests, finding IDs, and
      summary counts.
- [x] Selected production snapshot-set replay is byte-identical across two
      fixed-clock offline runs for all three promoted artifacts.
- [x] Semantic section digests and `catalogVersion` change for every
      consumer-visible mutation and remain stable for retrieval timestamp,
      local path, manifest path, QA path, and version-field changes.
- [x] QA covers source accounting, expected coverage, zero-output rejection,
      stable IDs, referential integrity, page resolution, EPIC-03 joins, ranks,
      restrictions, effects, stackability, headgear notes, icons, provenance,
      copied-text policy, schema shape, output caps, baselines, and artifact
      integrity.
- [x] QA overflow or material truncation is blocking.
- [x] `data/generated/epic-10/runes.catalog.json`,
      `data/generated/epic-10/runes.catalog.manifest.json`, and
      `data/qa/epic-10/runes.catalog.qa.json` are the only promoted EPIC-10
      exact paths.
- [x] `appConsumptionGate` and `publicReleaseGate` are `pass`.
- [x] Critical and error findings are resolved or excluded according to policy;
      every warning has a named bounded disposition or reviewed finding class.
- [x] `git check-ignore -v` proves promoted paths are trackable and
      representative raw/candidate byproducts remain ignored.

### Closeout Gates

- [x] Documentation explains exact paths and commands, source policy, runtime
      boundaries, replay limits, ID policy, effect/stacking semantics, headgear
      separation, and handoffs to EPIC-13, EPIC-14, EPIC-15, EPIC-17, EPIC-20,
      and EPIC-21.
- [x] `src/app/catalogs.ts`, editor behavior, local persistence/sharing,
      equipment UI, template compatibility, EPIC-03/04 promoted artifacts, and
      full stat analysis remain unchanged unless a documented blocker forces a
      separate planning amendment.
- [x] `npm run verify` passes without live network access.
- [x] README, data docs, script docs, compendium, generated files, QA state,
      tickets, sprint, ledger, and result manifests agree on IDs, paths,
      commands, versions, review scope, assumptions, limitations, and status.
- [x] BW-1001 through BW-1006, EPIC-10, SPRINT-011, and `work/sprints/ledger.tsv`
      are marked complete only after all gates pass.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                                                         | Likelihood | Impact | Mitigation                                                                                                                        |
| ---------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Source authority is incomplete, inconsistent, or too broad.                  | High       | High   | Make source-shape proof the first gate; require bounded hybrid approval and block for amendment before broadening.                |
| Equipment template modifier IDs do not cover every player-usable armor rune. | Medium     | High   | Treat unique verified `templateModifierId` as required for accepted v1 records; block promotion for missing or conflicting IDs.   |
| One source page represents multiple ranks or variants.                       | Medium     | High   | Add explicit same-page multi-variant fixtures and preserve per-record provenance without duplicate fetches.                       |
| Attribute-rune stacking loses duplicate health penalties.                    | Medium     | High   | Store stacking per effect and require duplicate major/superior fixtures proving rank suppression and penalty preservation.        |
| Non-attribute rune behavior is over-inferred from prose.                     | Medium     | High   | Structure only source-clear fixed facts; route ambiguous behavior to `note-only` or `unknown` with QA evidence.                   |
| Restoration condition family collides with Restoration Magic attribute.      | Medium     | High   | Use controlled family keys and EPIC-03 joins, with a named fixture and QA case.                                                   |
| Source-authored prose leaks into runtime JSON.                               | Medium     | High   | Default to structured effects and bounded reviewed short text only; QA blocks unknown copied material.                            |
| Shared source-plan refactor regresses EPIC-04.                               | Medium     | High   | Make reuse optional, require byte/behavior preservation tests, and isolate EPIC-10 helpers if equivalence is not trivial.         |
| Fixture data misses live source anomalies.                                   | Medium     | High   | Source-shape checkpoint and live discover gate must sample representative real pages before production promotion.                 |
| Reviewer bandwidth or live source access is unavailable.                     | Medium     | High   | Allow fixture/offline implementation to land, but leave BW-1005/SPRINT-011 blocked until production source and review gates pass. |
| QA caps hide material errors.                                                | Low        | High   | Treat overflow or material truncation as blocking and keep findings scoped to affected rune IDs.                                  |
| Exact-path allowlisting exposes non-runtime artifacts.                       | Low        | High   | Use parent re-ignore rules, exact exceptions, `git check-ignore -v`, and final diff inspection.                                   |
| Runtime payload churn follows audit-only changes.                            | Medium     | Medium | Keep full audit detail in manifest/QA and make semantic version inputs explicit and tested.                                       |
| Helper API drifts into a full equipment/stat calculator.                     | Medium     | Medium | Keep helper instance-based and narrow; defer slots, legality, headgear, titles, insignias, weapons, and totals.                   |
| Production snapshots remain ignored and are not retained.                    | Medium     | Medium | Document retention limits and require retained selected inputs or a fresh bounded live acquisition/review for future refreshes.   |

## Security Considerations

- Treat source titles, redirects, page bodies, templates, parameters, icon names,
  source plans, snapshot manifests, generated catalogs, QA evidence, baselines,
  and review notes as untrusted input.
- Permit network access only in explicit live mode with `--allow-live-network`,
  registered profile, GET-only JSON requests, fixed Guild Wars Wiki API origin,
  finite timeouts, retry caps, continuation caps, and response/request byte caps.
- Reject arbitrary endpoints, source-provided fetch URLs, final redirects
  outside the configured API origin, recursive crawls, credentials, cookies,
  tokens, and environment secrets.
- Parse wiki content as inert data. Never execute templates, Lua, HTML,
  JavaScript, CSS, links, shell snippets, or source-provided commands.
- Store rune display data as structured facts or reviewed plain text only.
  Runtime UI must escape text and must not inject source text into `innerHTML`.
- Bound accepted pages, title lengths, parser bytes, template traversal,
  numeric ranges, effect counts, evidence excerpts, output bytes, and QA
  findings.
- Preserve path confinement, safe slugs, symlink-escape checks where practical,
  atomic writes, finite-number checks, stable ordering, and SHA-256 verification.
- Do not use source titles, rune names, or IDs directly as filesystem paths.
- Do not log or promote raw page bodies, response headers, absolute machine
  paths, local environment values, copied descriptions, or media bytes.
- Query icon metadata only and keep every runtime media record
  `cachedBytes: false`.
- Keep raw snapshots, source plans, snapshot-set manifests, candidate artifacts,
  QA summaries, logs, review scratch files, thumbnails, screenshots, and icon
  binaries ignored or absent.

## Dependencies

- `EPIC-01` / `SPRINT-002` for source policy, provenance, manual review, media
  restrictions, QA gates, exact-path promotion, and artifact retention rules.
- `EPIC-02` / `SPRINT-003` for the MediaWiki client, verified snapshots,
  `mwparserfromhell`, metadata-only icon resolution, canonical artifact writing,
  fixture/offline/live modes, and QA report format.
- `EPIC-03` / `SPRINT-004` for promoted profession and attribute IDs, template
  crosswalks, section digests, artifact/manifest digests, and passing QA gates.
- `EPIC-04` / `SPRINT-005` for the closest precedent on source-set planning,
  selected offline replay, section digests, semantic catalog versioning, compact
  runtime dispositions, and exact-path allowlisting.
- `EPIC-06` / `SPRINT-007` for validation-result semantics and the effective
  attribute-rank helper boundary.
- `EPIC-09` / `SPRINT-010` for the current local-library/share schema boundary
  that continues to exclude authored equipment and rune state.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and `npm run data:setup` for
  the pinned parser environment.
- Guild Wars Wiki availability is required for production discovery/fetch only.
  Fixture generation, tests, build, and `npm run verify` remain offline.
- Maintainer review capacity is required for source-set digest approval,
  source-policy dispositions, warning dispositions, first-baseline review, and
  any copied-text exception.

## Open Questions

No open question blocks execution in non-interactive mode. Use these defaults
unless implementation proves they are wrong at a phase gate:

1. The bounded hybrid source authority is sufficient. If it is not, block for a
   recorded amendment rather than adding crawl behavior.
2. V1 public rune identity is anchored to unique verified equipment-template
   modifier IDs. Missing or conflicting IDs block accepted production records.
3. Compact source-set summaries and runtime-relevant dispositions may remain in
   the catalog, matching EPIC-04, while full audit evidence remains in
   manifest/QA.
4. Headgear is a dedicated handoff field, not a rune effect.
5. Attribute, health, and energy effects are arithmetic only when source-clear;
   damage/condition semantics can remain note-only or unknown if a safe fixed
   model is not proven.
6. `src/app` remains unchanged; catalog consumption is deferred until a UI or
   equipment epic needs it.
7. If production live acquisition or review cannot complete, leave BW-1005 and
   the sprint blocked after fixture/offline implementation rather than
   promoting fixture data.

## Execution Evidence

SPRINT-011 completed BW-1001 through BW-1006 for EPIC-10. The production runtime catalog is
`data/generated/epic-10/runes.catalog.json` with 138 records and
`catalogVersion: runes-58a277f62fe92f2a`; its adjacent manifest and
`data/qa/epic-10/runes.catalog.qa.json` are the only promoted audit artifacts.

Promotion used live discover/fetch with
`sourceSetDigest: 904d3d4133966e6104fdd460d549982fec27375f4b96fa20a5340d0f5493d504`, selected
snapshot-set digest `98fea6b02b64cef1c156ffa633ed9101b53bf5b0e174862f220e13d2f684ea2d`, two
byte-identical fixed-clock offline replays, exact `.gitignore` allowlist checks, and
`npm run verify`.
