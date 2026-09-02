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

This sprint turns EPIC-11 into a deterministic, runtime-eligible catalog of player-usable armor
insignias. It extends the existing source-policy and profile-driven ingestion platform, uses the
promoted EPIC-03 catalog for profession and attribute joins, represents slot-dependent and
conditional effects as framework-neutral data, and promotes exactly one catalog JSON, one adjacent
generated artifact manifest, and one bounded machine-readable QA report.

The sprint supplies content and domain groundwork only. It does not add armor or insignia controls
to the current editor, import insignia data through `src/app/catalogs.ts`, alter the saved-build
schema, catalog armor shells or runes, interpret equipment templates semantically, fetch remote
icons at runtime, or calculate complete character statistics. `ArmorPiece.insigniaId` and
`ArmorPiece.slot` remain the future attachment points. EPIC-13 owns armor/headgear records, EPIC-14
owns equipment authoring and legality, EPIC-17 owns semantic equipment-template resolution,
EPIC-20 owns search and tooltip presentation, and EPIC-21 owns broad stat and combat analysis.

The following decisions are fixed for execution:

1. Schema-v1 identity is anchored to the insignia row's verified numeric modifier ID from
   `Equipment template format`. Each accepted record stores both `InsigniaId` and
   `TemplateEquipmentModifierId`; their numeric values may match in v1, but only the explicit
   record field relates them. IDs are never assigned by array position, alphabetical order, or a
   synthesized dense range. A currently player-usable insignia without one unique verified
   modifier ID blocks promotion rather than receiving a guessed public ID.
2. The authoritative source graph is a bounded hybrid. `Equipment template format` supplies
   modifier IDs and candidate names; `Insignia` supplies the inventory, profession grouping, and
   summary effects; `Effect stacking` supplies cross-piece locality and combination facts; verified
   detail pages supply canonical page identity, restrictions, effects, and icon candidates; and the
   promoted EPIC-03 catalog supplies `ProfessionId` and `AttributeId` joins. Category crawl, site
   search, PvX/community pages, acquisition pages, and arbitrary recursive links are excluded.
3. The current source baseline is expected to reconcile 45 insignias across modifier IDs 290-324
   and 358-367. That expectation is an independent review assertion, not a hard-coded substitute
   for discovery. Any missing, extra, renamed, duplicated, or newly player-usable candidate stops at
   the source-plan gate for review.
4. Slot variation, effect locality, and equipment combination are separate concepts. A numeric
   effect has either one fixed value or an explicit five-slot map; it also states whether it affects
   the character or only the equipped armor piece/hit location, and independently states how
   multiple equipped occurrences combine. No generic chest/legs multiplier and no record-level
   `stackable` boolean are allowed.
5. Source-clear fixed and per-slot values are structured. Conditions use a closed, declarative
   predicate vocabulary when the source shape is unambiguous, but EPIC-11 does not evaluate combat
   state. Unsupported conditions and interactions remain reviewed `note-only` or `unknown` effects;
   they are never converted from prose into invented arithmetic.
6. A narrow pure helper resolves one insignia record for one `ArmorSlot`. It expands a fixed or
   slot-valued effect into an exact per-piece projection while preserving condition, locality,
   combination, mode, and unresolved states. It does not select armor, validate profession
   legality, evaluate conditions, combine five pieces, or produce character totals.
7. The infobox field named `Stackable` describes item/inventory behavior unless source review proves
   otherwise. It must not drive effect combination. Effect semantics come from the approved
   mechanics sources and per-effect evidence.
8. Production promotion is required for completion. If live discovery, a complete reviewed snapshot
   set, deterministic offline replay, first-baseline review, or both release gates cannot be
   completed, fixture/offline implementation may remain useful but BW-1105 and SPRINT-012 stay
   blocked rather than weakening the gates or promoting synthetic data.

The non-interactive interview is skipped as directed. These decisions extend the shipped EPIC-03,
EPIC-04, and EPIC-10 patterns without introducing a new application architecture. Exact source
shapes, condition coverage, and final record counts remain execution checkpoints.

## Use Cases

1. **Offer legal insignia candidates later**: EPIC-14 can filter common and profession-specific
   insignias by primary armor profession, mode availability, and armor slot without parsing wiki
   names or importing ingestion artifacts.
2. **Resolve equipment modifiers later**: EPIC-17 can map a decoded
   `TemplateEquipmentModifierId` to an `InsigniaId` through an explicit crosswalk while preserving
   unknown authored modifier IDs.
3. **Display exact slot bonuses**: A caller can resolve Survivor, Radiant, Tormentor's, or another
   source-backed slot-valued effect for head, chest, hands, legs, or feet without remembering a
   prose rule or applying a generic multiplier.
4. **Preserve local armor behavior**: Later analysis can distinguish character-additive health or
   energy from armor-rating and incoming-damage effects that apply only to the struck armor piece.
5. **Explain conditional effects honestly**: Tooltips can show a structured bonus and its condition
   even when the current app cannot evaluate attacking, stance, enchantment, item-holding,
   attribute-threshold, minion-count, or similar combat state.
6. **Avoid false totals**: Note-only, unknown, non-stacking, and separately composed effects remain
   visible and typed instead of being silently dropped or included in an unconditional total.
7. **Represent mode evidence**: Records and effects can state both-mode, PvE-only, PvP-only, or
   unknown availability when the approved sources support that distinction, without duplicating an
   identity solely for presentation.
8. **Render truthful future tooltips**: A UI can assemble short display text from canonical names,
   restrictions, structured values, conditions, and reviewed Build Wars-authored notes without
   copying source-authored description paragraphs into runtime data.
9. **Audit and refresh safely**: A maintainer can review a finite source-plan digest, fetch only
   confirmed pages and icon metadata, replay one selected complete snapshot set without network,
   and trace every promoted record or disposition to source and QA evidence.
10. **Detect source drift**: Redirects, quest/article name collisions, duplicate normalized names,
    changed modifier rows, missing icons, restriction conflicts, malformed effects, new source
    conditions, and dependency changes produce stable findings rather than silent catalog changes.
11. **Preserve downstream ownership**: EPIC-13/14 receive enough facts to attach and validate an
    insignia, while EPIC-21 remains responsible for condition evaluation, hit-location math, and
    full stat aggregation.
12. **Close out traceably**: Reviewers can connect BW-1101 through BW-1106, EPIC-11, SPRINT-012, the
    ledger, the three exact promoted paths, and the ticket-burn result manifest to one consistent
    completed state.

## Architecture

### Scope And Ownership

| Area | Owns | Must Not Own |
| --- | --- | --- |
| `src/domain/catalog.ts` | Plain insignia catalog envelope, identity mapping, availability, restrictions, slot applicability, source-set summary, dispositions, effect values, conditions, locality, combination, display, and dependency contracts. | React, browser APIs, runtime fetches, source plans, snapshot paths, full QA bodies, generated manifest imports, or parser behavior. |
| `src/domain/catalog-lookup.ts` | Collision-safe lookup by `InsigniaId`, template modifier ID, and normalized name. | Armor legality, condition evaluation, totals, network access, or serialized lookup maps. |
| `src/domain/insignia-effects.ts` | Pure resolution of one catalog record for one `ArmorSlot`, with typed unresolved outcomes. | Armor selection, primary-profession validation, condition evaluation, hit-location probability, rune composition, or complete stats. |
| `scripts/data/build_wars_ingest` | Fixed-origin discovery/fetch, confined replay, extraction, EPIC-03 joins, semantic normalization, deterministic assembly, QA, and promotion support. | Runtime imports, one-off scraping, browser automation, recursive crawl, or UI policy. |
| `test/fixtures/data-ingestion/insignias` | Minimized synthetic source shapes, redirects, conflicts, malformed inputs, conditions, and metadata-only icon responses. | Authoritative live data, copied source prose, icon bytes, screenshots, or a production baseline. |
| `data/generated/epic-11/insignias.catalog.json` | Runtime-eligible semantic insignia facts and compact provenance references. | Raw fields, source plans, snapshot manifests, QA findings, review bodies, local paths, or source page bodies. |
| Adjacent manifest and QA JSON | Artifact integrity, selected inputs, source-plan/snapshot-set digests, review evidence, bounded findings, and release gates. | Runtime application behavior or imported catalog APIs. |
| Documentation and work records | Source authority, commands, schema boundaries, limitations, downstream handoffs, release evidence, and lifecycle state. | Semantics not represented and verified in code and generated data. |

`src/app/catalogs.ts`, `src/domain/equipment.ts`, and the current persistence/share modules are
integration boundaries but have no planned implementation change. If execution cannot integrate
through the existing branded IDs and `ArmorSlot`, the relevant phase stops for a plan amendment
instead of widening the editor, build schema, or equipment model.

### Data Flow

```text
promoted EPIC-03 catalog + manifest + passing QA
                          |
fixed seed snapshots: Equipment template format + Insignia + Effect stacking
  -> independent modifier-row and insignia-inventory accounting
  -> candidate modifier IDs, profession groups, expected detail titles, and dispositions
  -> canonical source-set projection + source-plan digest
  -> explicit digest-confirmed detail-page and imageinfo fetch
  -> complete SourceSnapshotSetManifest
  -> selected, network-free offline replay
  -> raw insignia extraction + canonical page resolution + metadata-only icons
  -> EPIC-03 profession/attribute joins
  -> per-effect value, condition, locality, combination, and mode normalization
  -> InsigniaCatalog semantic JSON
  -> GeneratedArtifactManifest + bounded QaReport
  -> first-baseline review + exact-path promotion
```

Live access is never part of `npm run verify`. Fixture mode is synthetic and network-free.
Production bytes are generated from one selected complete snapshot set in offline mode after the
live source plan has been reviewed and its digest explicitly confirmed.

### Identity, Coverage, And Source Authority

| Fact | Primary authority | Cross-check | Failure behavior |
| --- | --- | --- | --- |
| Insignia/template modifier identity | Insignia rows in `Equipment template format` | `Insignia` inventory and canonical detail page | Duplicate IDs, conflicting names, or a player-usable insignia without one modifier ID block promotion. |
| Player-usable inventory | `Insignia` common/profession sections | Modifier rows and the reviewed 45-record baseline | Every input becomes a record, supported relationship, explicit exclusion, unsupported disposition, or blocker. |
| Canonical name and page identity | Resolved detail-page title, page ID, revision ID, and revision timestamp | Inventory label, modifier-row label, redirect chain, and infobox type | Missing, cyclic, multiply resolved, quest-shaped, disambiguated, or contradictory pages block or require explicit exclusion. |
| Common/profession availability | `Insignia` section grouping and detail profession field | Modifier-row profession suffix and EPIC-03 profession join | Common records require `professionId: null`; profession-specific records require one exact EPIC-03 join. Conflicts block. |
| PvE/PvP availability | Explicit approved availability evidence | Equipment-template presence proves only the template/PvP side; item/detail evidence must prove PvE | Unsupported claims remain `unknown`; mode-specific effects require per-effect evidence. |
| Slot applicability | `Insignia` mechanics and detail-page facts | Existing `ArmorSlot` vocabulary and representative pages | Map source `arms` to domain `hands`; collector-armor exceptions remain armor-shell facts for EPIC-13/14. |
| Numeric values and conditions | Inventory/detail structured facts | Family invariants and representative detail pages | Conflicts or malformed source-clear arithmetic block; unsupported combat semantics become typed notes/unknowns. |
| Locality and combination | `Effect stacking` plus source-clear detail mechanics | Effect family and targeted review | Never infer from item `Stackable`; unknown cross-piece behavior is non-arithmetic and review-required. |
| Icon metadata | Detail-page icon candidate plus MediaWiki `imageinfo` | File identity and source policy | `iconId` is nullable with a stable finding; no media bytes are fetched or promoted. |
| Short display note | Build Wars-authored projection from structured facts | Digest-bound manual review | Copied or lightly edited source prose is excluded; unknown copied material is non-waivable. |

The source planner parses the modifier table and the insignia inventory independently. A candidate
does not disappear merely because a name filter fails. The current expected modifier ranges and
common/profession grouping are explicit review assertions. Generic rows for runes, weapon modifiers,
and inscriptions are excluded from the insignia projection with bounded rules, not copied into
runtime dispositions merely to reproduce the entire equipment-modifier table.

Catalog order is numeric `InsigniaId`. Numeric gaps are preserved and never filled. Display names,
modifier labels with parenthetical profession suffixes, requested titles, and canonical titles are
kept as separate facts. Normalized names use the repository's collision-safe case/whitespace policy;
aliases may aid lookup only when they are reviewed and collision-free. Serialized forward/reverse
lookup maps are prohibited because they create a second identity authority.

### Staged Source And Snapshot Protocol

The profile ID is `epic-11-insignias`. Initial ceilings are three seed pages, 72 total article
pages, 64 detail titles, 64 media titles, 48 requests, three retries, ten continuation pages, a
5 MiB response cap, a 750 KiB parser-input cap, a 10 MiB aggregate cap, a 2 MiB catalog cap, and a
1 MiB QA cap. The Phase 1 source-shape checkpoint may tighten these values. Raising a ceiling,
adding a seed, or adding a source family requires a recorded sprint amendment before another live
fetch.

The profile follows the EPIC-04/10 two-stage safety model:

1. `discover` fetches only the fixed seed pages, validates their identity and supported shapes,
   loads and verifies the promoted EPIC-03 dependency, reconciles the two candidate inventories,
   records aliases/exclusions/conflicts, writes a canonical ignored source plan, prints a bounded
   summary, and stops.
2. `fetch` requires `--allow-live-network`, the exact `--source-plan` path, and the exact
   `--confirm-source-set-digest`. It revalidates the plan, caps, dependency, and seed digests;
   fetches only planned titles at the pinned Guild Wars Wiki origin; resolves redirects; requests
   bounded image metadata only; and writes a complete or explicitly partial snapshot-set manifest.
3. `offline` requires `--snapshot-set`. It rejects partial, extra, missing, duplicate,
   mixed-profile, path-escaping, digest-mismatched, plan-mismatched, dependency-mismatched, or edited
   inputs before extraction. It performs no DNS or network operation.

The third staged catalog profile should not create a third copy of security-sensitive confinement
and manifest validation. Add a small `source_set_protocol.py` containing profile-neutral canonical
plan hashing, digest confirmation, confined child loading, and complete snapshot-set validation for
new consumers. EPIC-11 uses it through an insignia-specific adapter. Existing EPIC-04/10 modules do
not migrate in this sprint; regression tests instead prove the new primitive obeys their established
wire and rejection contracts. A later maintenance sprint may migrate old profiles with byte-for-byte
baselines and a smaller semantic scope.

The source-plan digest covers schema/profile identity, caps, seed identities and content digests,
the EPIC-03 semantic dependency identity, candidate modifier IDs/names/classifications, expected
detail titles, aliases, exclusions, and planned media titles. It excludes its own value and
operational output path. Fetch rejects plans created for another profile, source revision, or
dependency version.

### Runtime Catalog Contract

`InsigniaCatalog` schema version 1 follows the promoted catalog boundary while keeping audit bodies
out of runtime imports:

```text
InsigniaCatalog
  schemaVersion: 1
  catalogVersion: semantic digest
  sectionDigests: CatalogSectionDigest[]
  generatedAt: ISO timestamp
  generator: pinned generator identity
  profile: InsigniaCatalogProfile
  dependencyDigests: [EPIC-03 dependency summary]
  sourceSet: InsigniaSourceSetSummary
  dispositions: InsigniaSourceSetDisposition[]
  insignias: CatalogInsigniaRecord[]
  remoteMedia: RemoteMediaMetadata[]

CatalogInsigniaRecord
  id: InsigniaId
  templateModifierId: TemplateEquipmentModifierId
  name: canonical display name
  normalizedName: collision-safe lookup key
  wikiUrl: canonical HTTPS URL
  pageIdentity: requested/normalized/canonical title plus page/revision facts
  availability: common | profession-specific
  professionId: ProfessionId | null
  modeAvailability: both | pve-only | pvp-only | unknown
  applicableSlots: non-empty ArmorSlot[] in canonical order
  effects: non-empty InsigniaEffect[]
  effectCompleteness: structured | mixed | note-only | unknown
  displayState: structured-only | reviewed-short-text | excluded
  iconId: string | null
  provenance: compact field provenance
```

Exact TypeScript names may adjust to established local naming, but these wire distinctions are
acceptance requirements. `CatalogInsigniaRecord` remains beside the existing lightweight
`Insignia` interface, as generated rune and skill records remain beside their lightweight
foundation contracts. Reuse `InsigniaId`, `TemplateEquipmentModifierId`, `ProfessionId`,
`AttributeId`, and `ArmorSlot`; do not introduce parallel public ID or slot vocabularies.

`InsigniaSourceSetSummary` records seed/source-plan digests, accepted/disposition counts, current
ID ranges/gaps, counts by common/profession grouping and mode state, blocking count, and the locked
source and ID policies. A compact disposition records a stable candidate ID, requested label/title,
modifier ID when known, kind, bounded reason, nullable review ID, and provenance. Raw source rows,
candidate bodies, and snapshot paths stay outside the runtime artifact.

The dependency summary records the EPIC-03 catalog version, artifact and manifest digests, passing
QA gate, and section digests used for profession/attribute joins. EPIC-10 rune data is a regression
precedent, not a semantic input to the insignia catalog.

### Effect, Slot, Condition, And Combination Contract

Each structured numeric effect has four independent dimensions:

- `value`: either `fixed` with one finite amount or `by-slot` with an exact map for `head`, `chest`,
  `hands`, `legs`, and `feet`;
- `applicationScope`: `character`, `armor-piece-local`, `event-local`, or `unknown`;
- `condition`: `always`, a closed source-backed predicate, or a reviewed/deferred condition; and
- `combination`: `sum`, `highest`, `non-stacking`, `local-only`, `separate`, or `unknown`, with a
  stable group key where cross-record comparison is meaningful.

Effect mode applicability is explicit (`pve`, `pvp`, or both). Units are effect-specific; signed
values preserve direction. Zero is valid only when the source literally defines zero, never as a
replacement for absent or unknown data.

Minimum schema-v1 effect kinds are:

| Effect kind | Required semantic fields | V1 treatment |
| --- | --- | --- |
| `maximum-health-delta` | signed health value, character scope | Survivor uses a verified five-slot map and sums per equipped occurrence. |
| `maximum-energy-delta` | signed energy value, character scope | Radiant uses a verified five-slot map and sums per equipped occurrence. |
| `armor-rating-delta` | signed armor value and controlled damage filters | Preserve piece-local scope; unconditional and conditional variants share this effect kind. |
| `incoming-damage-delta` | signed amount, unit, and controlled damage filters | Preserve piece/event locality. Knight's and Tormentor's are structured only to the degree source evidence supports exact behavior. |
| `duration-delta` | signed seconds or percentage plus controlled subject | Hex and knockdown facts may be structured; later runtime composition remains deferred. |
| `outgoing-damage-delta` | signed percentage and controlled scope | Preserve source-clear penalties separately from armor/condition facts; do not fold them into another effect. |
| `note-only` | stable note code, bounded reviewed original text, provenance | No arithmetic. Used for visible behavior that the closed schema cannot safely calculate. |
| `unknown` | source-field reference or digest, bounded reason, provenance | No arithmetic. Used when identity is accepted but an effect cannot yet be normalized. |

The condition vocabulary is closed after the Phase 1 census. It may include source-clear predicates
such as attacking, moving, stance/enchantment state, holding an item, controlled-minion count,
equipped-skill-type count, recharging-skill count, nearby spirit state, and minimum attribute rank.
Each predicate carries controlled operands and referenced catalog IDs where applicable. There is no
general expression language, source-authored executable text, or condition evaluator in EPIC-11.
Tiered insignias are represented as multiple independently evidenced effects/thresholds rather than
an opaque formula.

Source-clear examples must establish these exact per-slot maps:

| Family | Head | Chest | Hands | Legs | Feet |
| --- | ---: | ---: | ---: | ---: | ---: |
| Survivor health | +5 | +15 | +5 | +10 | +5 |
| Radiant energy | +1 | +3 | +1 | +2 | +1 |
| Tormentor's incoming holy damage | +2 | +6 | +2 | +4 | +2 |

These are independent source-backed maps, not evidence for a universal multiplier. Other fixed or
slot-varying families must carry their own facts. Missing one slot in a source-clear `by-slot` map is
invalid; it is never filled from chest or legs by convention.

Unknown behavior is allowed to remain visible without blocking the entire catalog when its identity,
restriction, and non-arithmetic state are safe. By contrast, a parser failure for a source-clear
deterministic value, an incomplete five-slot map, or a locality claim that would yield a false total
blocks promotion until resolved or explicitly removes the numeric claim. This distinction satisfies
the ticket's non-blocking unknown requirement without allowing silent partial arithmetic.

### Pure Slot Resolver

Add one narrow helper:

```text
resolveInsigniaEffectsForArmorSlot(insignia, slot)
```

It returns deterministic resolved numeric effects in stable source order, each retaining kind,
amount, unit, application scope, condition, combination, mode applicability, and provenance. It
also returns note-only/unknown effects and typed unresolved reasons for an invalid slot, missing
slot map entry, non-finite amount, malformed condition, unsupported effect, or malformed catalog
record.

The helper does not inspect a `Build` or `EquipmentTemplate`, choose insignias, validate profession
or mode legality, evaluate predicates, combine records across armor pieces, apply hit-location
probabilities, add armor-shell or rune facts, or mutate input. Tests freeze inputs and prove output
is independent of object/record order where order is not semantically meaningful.

### Determinism, Versioning, And Promotion Boundary

Canonical JSON remains UTF-8, LF-terminated, two-space-indented, sorted-key output with stable
record/effect/source ordering and finite numeric values. Section digests cover at least
`dependencyDigests`, `sourceSet`, `dispositions`, `insignias`, and `remoteMedia`.
`catalogVersion` is a semantic digest over runtime-consumer meaning and excludes itself,
`generatedAt`, operational paths, revision/retrieval timestamps, full provenance/review bodies, and
other audit-only noise. Mutation tests prove that an effect amount, slot map, restriction,
condition, mode, locality, or combination change alters the relevant section digest and version,
while a retrieval timestamp alone does not.

Only these exact paths may be promoted:

- `data/generated/epic-11/insignias.catalog.json`
- `data/generated/epic-11/insignias.catalog.manifest.json`
- `data/qa/epic-11/insignias.catalog.qa.json`

Only the catalog JSON is runtime-eligible. The adjacent manifest and QA report are committed release
evidence but remain forbidden runtime imports. Source plans, snapshot-set manifests, raw snapshots,
candidate outputs, QA summaries, review scratch data, icon bytes, thumbnails, and screenshots remain
ignored.

### Alternatives Considered

- **Use names or dense generated IDs**: rejected because equipment templates already expose a
  stable numeric modifier namespace and downstream EPIC-17 needs an explicit crosswalk.
- **Use the modifier table as the only source**: rejected because it does not independently prove
  complete inventory, effect semantics, profession restrictions, locality, or icon/page identity.
- **Use the `Insignia` page as the only source**: rejected because it does not own template modifier
  identity and cannot by itself prove all detail/media facts.
- **Use a generic 3/2/1 slot multiplier**: rejected because slot-varying families have different
  base units and some effects are fixed or local. Exact maps are clearer and safer.
- **Use record-level `stackable`**: rejected because item stacking, cross-piece effect combination,
  piece-local armor, and tier accumulation are different questions.
- **Build a general condition evaluator**: deferred to EPIC-21. This sprint stores source-clear
  predicates and reviewed limitations but has no complete character/combat context.
- **Import production data into the app now**: deferred. Domain and generated-contract tests prove
  the runtime boundary without adding unused UI behavior or attribution/privacy work.
- **Migrate all existing source-set modules now**: rejected due to regression risk. EPIC-11 adds a
  new profile-neutral safety primitive for new work and leaves byte-sensitive EPIC-04/10 migration
  to a dedicated maintenance scope.
- **Hand-author production JSON**: rejected. Promoted bytes must come from reviewed source inputs and
  selected offline replay.

## Implementation

### Phase 1: BW-1101 Source Shape, Contracts, And Profile (~13% of effort)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/insignia-effects.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/insignia-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `work/tickets/11-insignias/BW-1101-insignia-catalog-contracts-and-profile.md`

**Tasks:**

- [ ] Mark EPIC-11 and BW-1101 in progress when implementation starts; do not advance dependent
      tickets before the Phase 1 gate.
- [ ] Run a bounded source-shape checkpoint against the three proposed seed pages and representative
      common, profession-specific, fixed, slot-scaled, conditional, tiered, redirect, and
      metadata-only icon detail pages.
- [ ] Reconcile the current 45-record/ID-range expectation and inspect how canonical pages encode
      profession, effect, icon, campaign/mode, `arms` terminology, and item `Stackable`. If the
      finite source graph or identity policy fails, stop for a recorded sprint amendment before
      freezing schema.
- [ ] Define schema-v1 `InsigniaCatalog`, `CatalogInsigniaRecord`, profile, dependency, page identity,
      source-set, disposition, availability, slot, effect, numeric-value, condition, locality,
      combination, mode, completeness, and display contracts.
- [ ] Reuse existing `InsigniaId`, `TemplateEquipmentModifierId`, `ProfessionId`, `AttributeId`, and
      `ArmorSlot`. Keep the lightweight `Insignia` interface compatible and do not create a parallel
      ID/slot namespace.
- [ ] Lock the one-to-one ID policy and collision-safe lookup outcomes for catalog ID, template
      modifier ID, and normalized name, including dispositioned and unknown modifier outcomes.
- [ ] Define the pure slot-resolver input/output and unresolved contracts in
      `src/domain/insignia-effects.ts`; implementation follows in Phase 4.
- [ ] Register `epic-11-insignias` with the fixed seeds, fixture/offline/live modes, initial caps,
      EPIC-03 dependency, and exact generated/QA/fixture paths.
- [ ] Reject ad hoc `--title` expansion for this profile. Keep live access explicit and preserve all
      existing profile choices, default fixture behavior, exit codes, and network-free verification.
- [ ] Add TypeScript contract fixtures for a common slot-scaled record, a profession-specific
      conditional record, a note-only record, and an unknown record; assert that runtime contracts
      contain no audit-only paths or bodies.

**Phase Gate:**

- [ ] Identity, source precedence, profile caps, runtime/audit boundary, and the value/locality/
      combination separation are recorded and executable.
- [ ] Existing EPIC-02/03/04/10 profile and domain tests still pass.
- [ ] Mark BW-1101 done only after focused verification and its acceptance criteria pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/insignia-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`

### Phase 2: BW-1102 Source Set, Replay Protocol, And Fixtures (~18% of effort)

**Files:**

- `scripts/data/build_wars_ingest/source_set_protocol.py`
- `scripts/data/build_wars_ingest/insignia_source_set.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/tests/test_source_set_protocol.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/insignias/equipment-template-format.wiki`
- `test/fixtures/data-ingestion/insignias/insignia.wiki`
- `test/fixtures/data-ingestion/insignias/effect-stacking.wiki`
- `test/fixtures/data-ingestion/insignias/*.wiki`
- `test/fixtures/data-ingestion/insignias/imageinfo.json`
- `work/tickets/11-insignias/BW-1102-insignia-source-set-and-page-resolution.md`

**Tasks:**

- [ ] Mark BW-1102 in progress only after the contract/profile gate passes.
- [ ] Add profile-neutral canonical plan/digest confirmation and confined complete snapshot-set
      validation primitives. Test partial, extra, missing, duplicate, mixed-profile, path-escaping,
      symlink-escaping, digest-mismatched, plan-mismatched, and dependency-mismatched inputs.
- [ ] Build the insignia source planner from independent modifier-row and inventory projections.
      Account for common/profession groups, current ID expectations, aliases, redirects, duplicate
      names, missing pages, quest/article collisions, non-insignia rows, and newly discovered
      candidates.
- [ ] Give every candidate one terminal state: accepted insignia, supported alias/relationship,
      explicit out-of-scope exclusion, unsupported disposition, or blocking finding. Do not silently
      discard malformed rows or inventory entries.
- [ ] Produce a canonical ignored source plan with source/profile/dependency facts, caps, seed
      digests, candidate IDs/titles, classifications, dispositions, planned detail/media titles,
      counts, and `sourceSetDigest`/`sourcePlanDigest`.
- [ ] Implement digest-confirmed fetch and complete snapshot-set writing without allowing source
      values to become arbitrary URLs or recursive title expansion.
- [ ] Add minimized synthetic fixtures for common and profession-specific records, all five slots,
      fixed and per-slot effects, structured/deferred conditions, tier thresholds, same-page or
      redirect relationships, parenthetical profession suffixes, PvE/PvP states, missing icons,
      duplicate names/IDs, malformed rows, and unsupported fields.
- [ ] Keep fixtures synthetic and bounded. Store no copied long prose, live page body, image bytes,
      thumbnail, or production source revision as a fixture baseline.
- [ ] Prove fixture discovery output is independent of seed/request order and that an unreviewed
      source-set change stops before detail fetch.
- [ ] Compare the new protocol's rejection and canonicalization behavior with existing EPIC-04/10
      regression fixtures without changing their source-set modules or generated bytes.

**Phase Gate:**

- [ ] The source graph is finite, reviewable, digest-bound, and every candidate is accounted.
- [ ] Fixture mode is entirely synthetic/network-free and selected offline replay rejects every
      incomplete or unsafe snapshot-set shape before extraction.
- [ ] Existing EPIC-04/10 source-plan, replay, and golden-output tests remain unchanged.
- [ ] Mark BW-1102 done only after focused verification and its acceptance criteria pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_source_set_protocol build_wars_ingest.tests.test_insignia_source_set build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_source_set build_wars_ingest.tests.test_rune_source_set build_wars_ingest.tests.test_skill_catalog build_wars_ingest.tests.test_rune_catalog`
- Direct fixed-clock `epic-11-insignias` fixture discovery/regeneration into an ignored root.

### Phase 3: BW-1103 Loss-Aware Extraction And Joins (~17% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_extractor.py`
- `scripts/data/build_wars_ingest/insignia_source_set.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/insignias/*.wiki`
- `test/fixtures/data-ingestion/insignias/imageinfo.json`
- `work/tickets/11-insignias/BW-1103-insignia-extractors.md`

**Tasks:**

- [ ] Mark BW-1103 in progress only after the source-set/replay gate passes.
- [ ] Parse modifier identity/label, canonical display name, inventory group, profession field,
      applicable slot terms, campaign/mode evidence, raw effect fields, detail-page identity,
      redirects, icon title, and field-level source references into an internal raw record.
- [ ] Keep raw extraction loss-aware: preserve supported token/row structure and bounded digests or
      finding references for unsupported fields, but do not copy source-authored description prose
      into the runtime projection.
- [ ] Join common records to `professionId: null`; join profession-specific records to exactly one
      promoted EPIC-03 profession. Resolve attribute names found in conditions through EPIC-03 rather
      than retaining normalized free-text IDs.
- [ ] Normalize source `arms`, `gloves`, or equivalent verified terms to domain `hands` at one
      documented boundary. Preserve unknown slot terms as findings instead of guessing.
- [ ] Separate item-level `Stackable` extraction from effect-combination evidence and assert that it
      cannot populate runtime combination fields.
- [ ] Resolve requested/normalized/canonical titles and page/revision facts explicitly. Reject
      cycles, ambiguous canonical targets, wrong infobox/content type, quest pages, and conflicting
      redirects.
- [ ] Resolve icon metadata through the existing metadata-only pipeline. Keep `iconId` nullable;
      never download or retain bytes.
- [ ] Emit stable findings for duplicate IDs/names, missing restrictions, contradictory common/
      profession grouping, missing page/revision facts, missing icons, unknown modes, malformed
      effect rows, unsupported conditions, and unusual formatting.
- [ ] Guarantee every accepted fixture candidate produces one deterministic raw record or explicit
      disposition, sorted by numeric modifier ID regardless of request/page order.

**Phase Gate:**

- [ ] Extraction is deterministic, loss-aware, source-traceable, and contains no inferred
      arithmetic, condition evaluation, effect combination, or copied long prose.
- [ ] Every profession/attribute reference joins uniquely to EPIC-03 or produces a stable blocking
      or deferred outcome appropriate to its semantic importance.
- [ ] Mark BW-1103 done only after focused verification and its acceptance criteria pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_extractor build_wars_ingest.tests.test_icons`
- `npm run data:test`
- Repeat fixed-clock EPIC-11 fixture extraction with shuffled input order and compare raw/disposition
  projections.

### Phase 4: BW-1104 Semantics, Slot Resolution, And Domain Fixtures (~25% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_semantics.py`
- `scripts/data/build_wars_ingest/insignia_extractor.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_semantics.py`
- `src/domain/insignia-effects.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/insignia-catalog.test.ts`
- `test/domain/insignia-effects.test.ts`
- `work/tickets/11-insignias/BW-1104-insignia-effect-semantics-and-slot-scaling.md`

**Tasks:**

- [ ] Mark BW-1104 in progress only after deterministic raw extraction passes.
- [ ] Implement table-driven semantic normalization for health, energy, armor rating, incoming
      damage, duration, outgoing damage, reviewed notes, and unknown effects using independent
      value, application-scope, condition, combination, and mode fields.
- [ ] Freeze a closed predicate vocabulary from the source census. Store only controlled operands,
      comparators, counts, damage/effect kinds, and EPIC-03 IDs; unsupported expressions become
      reviewed deferred conditions or unknowns, never executable strings.
- [ ] Encode source-clear tiered effects as multiple thresholded effects and source-clear compound
      penalties as separate effects. Do not collapse a record such as Lieutenant's into one string
      or one scalar.
- [ ] Encode and test exact five-slot maps for Survivor, Radiant, Tormentor's, and every other
      source-backed slot-valued effect. Require all five canonical keys and reject multiplier-based
      synthesis.
- [ ] Preserve armor rating and incoming-damage locality. Do not sum piece-local effects into a
      character armor total or apply hit-location probabilities.
- [ ] Assign equipment-combination rules only from approved mechanics evidence. Explicitly test that
      item `Stackable: No` has no semantic authority over an effect rule.
- [ ] Give every accepted record a non-empty effect list and an accurate completeness state. A safe
      unknown/note-only effect may proceed with a warning and named review; a failed parser for
      source-clear arithmetic must block or remove the arithmetic claim.
- [ ] Implement `resolveInsigniaEffectsForArmorSlot` with exact fixed/by-slot projection, stable
      output, input immutability, retained condition/locality/combination/mode data, and typed
      unresolved outcomes.
- [ ] Add domain fixtures for all five slots, fixed values, negative values, local armor, structured
      and deferred conditions, tiers, common/profession restrictions, mode-limited effects,
      note-only/unknown effects, missing slot keys, non-finite values, malformed conditions,
      unsupported kinds, and an inapplicable slot.
- [ ] Prove the resolver yields Survivor `5/15/5/10/5`, Radiant `1/3/1/2/1`, and Tormentor's
      `2/6/2/4/2` in canonical head/chest/hands/legs/feet order while never producing a five-piece
      total.

**Phase Gate:**

- [ ] Every deterministic slot-valued fixture resolves exactly for all five slots, and conditional
      or local effects retain the facts a later calculator must evaluate.
- [ ] No test or helper overclaims profession legality, combat-state truth, armor-shell effects,
      hit-location math, rune interaction, or complete character totals.
- [ ] Mark BW-1104 done only after focused verification and its acceptance criteria pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/insignia-catalog.test.ts test/domain/insignia-effects.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_semantics`

### Phase 5: BW-1105 Assembly, QA, Review, And Promotion (~17% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_catalog.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json`
- `test/domain/data-ingestion-contracts.test.ts`
- `.gitignore`
- `data/generated/epic-11/insignias.catalog.json`
- `data/generated/epic-11/insignias.catalog.manifest.json`
- `data/qa/epic-11/insignias.catalog.qa.json`
- `work/tickets/11-insignias/BW-1105-insignia-catalog-qa-and-promotion.md`

**Tasks:**

- [ ] Mark BW-1105 in progress only after source-set, extraction, and semantic gates pass.
- [ ] Assemble the canonical envelope with dependency facts, source-set summary, dispositions,
      insignia records, structured effects, remote media, compact provenance, section digests, and
      semantic catalog version.
- [ ] Validate Python output against the same schema-v1 distinctions asserted by TypeScript golden
      tests. Do not maintain a divergent hand-authored production or fixture schema.
- [ ] Add bounded QA for source accounting, expected ID/count/group coverage, ID and normalized-name
      uniqueness, canonical page/revision/retrieval facts, EPIC-03 joins, restrictions, mode state,
      applicable slots, effect completeness, exact slot maps, condition operands, locality,
      combination rules/group keys, item-stackable separation, copied-text policy, icons, source
      references, caps, section/version digests, and artifact integrity.
- [ ] Treat unaccounted player-usable candidates, missing/duplicate modifier identity, incomplete
      required restrictions, failed source-clear deterministic arithmetic, incomplete slot maps,
      unsafe paths, incomplete replay, unknown copied material, and digest/integrity mismatch as
      non-waivable or release-blocking. Keep safe note-only/unknown semantics and missing optional
      icons as reviewed warnings with bounded evidence.
- [ ] Make finding IDs independent of request order, absolute paths, and wall-clock time. Cap finding
      counts, evidence strings, raw-field excerpts, summary output, and candidate diagnostics.
- [ ] Generate fixture catalog, manifest, and QA JSON twice into separate ignored roots under one
      fixed clock; prove byte identity for all JSON, section digests, source/disposition/effect order,
      and finding IDs.
- [ ] Run bounded live `discover`; review source identities, current count/ID ranges, common and
      profession grouping, condition vocabulary, mode evidence, caps, EPIC-03 dependency, and the
      source-set digest before digest-confirmed `fetch`.
- [ ] Replay the resulting selected complete snapshot set offline twice under one fixed clock and
      prove network-free byte identity.
- [ ] Perform the first-promotion review: record counts and ID gaps, group/profession/mode coverage,
      dispositions, slot-map families, structured/note/unknown completeness, section/dependency
      digests, icon decisions, representative local/conditional effects, and both gate results.
- [ ] Generate approved production bytes only from the selected reviewed offline inputs. Never
      hand-edit the promoted catalog, manifest, or QA report.
- [ ] Add exact `.gitignore` parent and file exceptions only for the three EPIC-11 artifacts. Verify
      source plans, snapshot sets, raw snapshots, candidates, QA summaries, icon bytes, screenshots,
      and arbitrary sibling files remain ignored.
- [ ] Mark BW-1105 done only after the exact files exist, both gates pass, all warnings carry valid
      dispositions, and all verification/review evidence is recorded.

**Phase Gate:**

- [ ] The exact catalog, adjacent manifest, and QA JSON are byte-reproducible, internally
      consistent, exactly allowlisted, and approved.
- [ ] A TypeScript test can consume the runtime catalog shape without reading the manifest, QA,
      snapshot, source plan, Python module, or wiki API.
- [ ] If current live access or a complete reviewed snapshot set is unavailable, leave BW-1105 and
      SPRINT-012 blocked; do not promote synthetic fixture data.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-11-insignias --root work/runs/data-ingestion/epic-11-fixture-a --fixture-root test/fixtures/data-ingestion`
- Repeat into `work/runs/data-ingestion/epic-11-fixture-b` with the same fixed clock and compare the
  catalog, manifest, and QA JSON byte-for-byte.
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-11-insignias --root work/runs/data-ingestion/epic-11-live --allow-live-network --stage discover --clock now`
- Run `fetch` with the reviewed `--source-plan` and exact `--confirm-source-set-digest`, then run
  `offline --profile epic-11-insignias --snapshot-set <selected-manifest> --clock fixed` twice.
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_catalog build_wars_ingest.tests.test_artifacts build_wars_ingest.tests.test_qa build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `npm run test:run -- test/domain/data-ingestion-contracts.test.ts test/domain/insignia-catalog.test.ts test/domain/insignia-effects.test.ts`
- `git check-ignore -v` for all exact promoted paths and representative ignored siblings/byproducts.
- `git status --short`

### Phase 6: BW-1106 Documentation, Verification, And Closeout (~10% of effort)

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/insignias-catalog.md`
- `compendium/README.md`
- `work/tickets/11-insignias/EPIC.md`
- `work/tickets/11-insignias/BW-1101-insignia-catalog-contracts-and-profile.md`
- `work/tickets/11-insignias/BW-1102-insignia-source-set-and-page-resolution.md`
- `work/tickets/11-insignias/BW-1103-insignia-extractors.md`
- `work/tickets/11-insignias/BW-1104-insignia-effect-semantics-and-slot-scaling.md`
- `work/tickets/11-insignias/BW-1105-insignia-catalog-qa-and-promotion.md`
- `work/tickets/11-insignias/BW-1106-insignia-runtime-docs-and-closeout.md`
- `work/sprints/SPRINT-012.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-11-result.json`

**Tasks:**

- [ ] Mark BW-1106 in progress only after exact-path promotion passes.
- [ ] Document source authority, locked caps, source-shape results, current baseline counts/IDs,
      identity mapping, profile modes, digest-confirmed refresh, selected replay, schema/effect
      vocabulary, semantic versioning, QA gates, first-baseline review, and exact artifact paths.
- [ ] State that only `insignias.catalog.json` is runtime-eligible and that this sprint deliberately
      does not import it through `src/app/catalogs.ts`. Manifests, QA, snapshots, plans, scripts, and
      icon bytes remain non-runtime.
- [ ] Document exact per-slot behavior, `arms` to `hands` normalization, application locality,
      equipment-combination rules, mode states, condition deferral, and why item `Stackable` is not
      an effect rule.
- [ ] Document metadata-only icons and the attribution/privacy work a later UI must complete before
      displaying remote media.
- [ ] Document EPIC-13/14 handoffs: use `ArmorPiece.insigniaId` and `ArmorPiece.slot`, validate the
      armor shell's insignia capability and primary profession, resolve per-slot facts, preserve
      unknowns, and never treat note-only conditions as satisfied.
- [ ] Document EPIC-17/20/21 handoffs for template modifier lookup, search/tooltips, condition
      evaluation, local armor/hit-location semantics, and full health/energy/stat aggregation.
- [ ] Confirm the current editor, saved library, sharing, skill-template behavior, and rune catalog
      remain unchanged; no authored equipment data is added to current persistence/share formats.
- [ ] Record replay-retention limits: production snapshots remain ignored, so future refreshes need
      retained local selected inputs or a new bounded live acquisition and review.
- [ ] Run fixture regeneration, focused tests, and `npm run verify`; inspect the final diff for
      unrelated implementation, source prose, raw pages, icon bytes, screenshots, QA summaries,
      broad allowlists, secrets, machine-local absolute paths, and nondeterministic values.
- [ ] Add focused verification and artifact evidence to BW-1101 through BW-1106. Mark each done only
      after its phase gate, then synchronize EPIC-11, SPRINT-012, and the ledger completion state.
- [ ] Write and validate the ticket-burn result manifest with matching sprint/epic/ticket IDs,
      statuses, paths, verification outcome, and `commit_created: false`.
- [ ] Do not create a commit.

**Phase Gate:**

- [ ] Documentation, ticket files, final sprint, ledger, and result manifest agree with the exact
      promoted bytes and verification result.
- [ ] Existing editor, library, sharing, template compatibility, rule engine, rune behavior, and
      prior ingestion profiles remain behaviorally unchanged.
- [ ] Mark BW-1106, EPIC-11, and SPRINT-012 complete only after the full Definition of Done passes.

**Verification:**

- `npm run data:regenerate`
- Direct EPIC-11 fixed-clock fixture regeneration.
- `npm run verify`
- Manual inspection of promoted artifacts, QA gates, docs, tickets, sprint, ledger, result manifest,
  `git status --short`, and the complete final diff.

## Files Summary

| File or path | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Add schema-v1 insignia catalog, record, source-set, dependency, slot, effect, condition, locality, combination, mode, and display contracts while preserving lightweight `Insignia`. |
| `src/domain/catalog-lookup.ts` | Modify | Add collision-safe insignia lookup by catalog ID, template modifier ID, and normalized name. |
| `src/domain/insignia-effects.ts` | Create | Resolve one insignia's exact fixed/by-slot effects for one armor slot without totals or condition evaluation. |
| `src/domain/index.ts` | Modify | Export insignia catalog/lookups/resolver and result contracts. |
| `src/domain/ids.ts` | Reference only | Reuse `InsigniaId` and `TemplateEquipmentModifierId`; no new identity namespace. |
| `src/domain/equipment.ts` | Reference only | Reuse `ArmorSlot` and preserve `ArmorPiece.insigniaId`; no equipment schema/UI expansion. |
| `src/app/catalogs.ts` | Reference only | Preserve the single runtime import boundary; do not import EPIC-11 data in this sprint. |
| `scripts/data/build_wars_ingest/config.py` | Modify | Add bounded EPIC-11 request/parser/artifact ceilings. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register fixed seeds, paths, caps, dependency, and modes for `epic-11-insignias`. |
| `scripts/data/build_wars_ingest/source_set_protocol.py` | Create | Provide profile-neutral canonical plan confirmation and confined complete snapshot-set validation for new staged catalogs. |
| `scripts/data/build_wars_ingest/insignia_source_set.py` | Create | Reconcile candidate inventories, resolve pages, write source plans, and compose the shared snapshot protocol. |
| `scripts/data/build_wars_ingest/insignia_extractor.py` | Create | Parse identity, restrictions, slots, raw effects, mode evidence, page facts, and metadata-only icons. |
| `scripts/data/build_wars_ingest/insignia_semantics.py` | Create | Normalize values, slot maps, conditions, locality, combination, mode, notes, and unknowns. |
| `scripts/data/build_wars_ingest/insignia_catalog.py` | Create | Assemble canonical output, validate semantic sections, and compute section/catalog digests. |
| `scripts/data/build_wars_ingest/models.py` | Modify narrowly | Add shared staged-source internal types only where existing public wire contracts are insufficient. |
| `scripts/data/build_wars_ingest/snapshots.py` | Modify narrowly | Reuse confined snapshot loading/writing while preserving current profile behavior. |
| `scripts/data/build_wars_ingest/icons.py` | Modify narrowly | Reuse metadata-only icon resolution for insignia records. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Add insignia semantic projection, first-baseline evidence, and diff classification. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add bounded insignia coverage, policy, semantics, dependency, and integrity findings. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate EPIC-11 fixture, discover, fetch, selected offline replay, and promotion outputs. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Add the profile to staged validation/help while preserving explicit network and digest gates. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Cover protocol safety, profile compatibility, planning, resolution, extraction, semantics, assembly, QA, determinism, and CLI behavior. |
| `test/domain/contracts.test.ts` | Modify | Protect lightweight contracts and new insignia wire distinctions. |
| `test/domain/insignia-catalog.test.ts` | Create | Verify catalog shape, identity mapping, restrictions, slots, effects, lookups, and collision behavior. |
| `test/domain/insignia-effects.test.ts` | Create | Prove exact five-slot resolution, retained conditions/locality, typed unknowns, and non-aggregation. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Validate Python-generated insignia JSON against TypeScript expectations and runtime isolation. |
| `test/fixtures/data-ingestion/insignias/` | Create | Store minimized synthetic source, redirect, condition, malformed, and icon-metadata fixtures. |
| `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json` | Create | Commit the deterministic synthetic golden catalog. |
| `data/generated/epic-11/insignias.catalog.json` | Create/allowlist | Promote the only runtime-eligible EPIC-11 artifact. |
| `data/generated/epic-11/insignias.catalog.manifest.json` | Create/allowlist | Promote artifact, selected-input, dependency, digest, and review evidence. |
| `data/qa/epic-11/insignias.catalog.qa.json` | Create/allowlist | Promote bounded QA findings and app/public release gate evidence. |
| `.gitignore` | Modify narrowly | Allowlist only the EPIC-11 parent directories and exact three approved files. |
| `README.md` | Modify | Document the new catalog boundary, commands, and unchanged/deferred application scope. |
| `scripts/data/README.md` | Modify | Document EPIC-11 sources, caps, staged commands, replay protocol, and troubleshooting. |
| `data/README.md` | Modify | Add EPIC-11 lifecycle, runtime boundary, and retained/ignored artifact rules. |
| `data/generated/README.md` | Modify | Document exact catalog/manifest promotion and determinism. |
| `data/qa/README.md` | Modify | Document the exact QA report, gate/disposition policy, and non-runtime boundary. |
| `compendium/data-ingestion-platform.md` | Modify | Record the shared new-profile source protocol and EPIC-11 extension. |
| `compendium/insignias-catalog.md` | Create | Preserve identity, source authority, slot/effect semantics, review evidence, and downstream handoffs. |
| `compendium/README.md` | Modify | Index the insignia catalog note. |
| `work/tickets/11-insignias/*.md` | Modify | Maintain sprint links, decisions, phase status, and closeout evidence. |
| `work/sprints/SPRINT-012.md` | Create/update during execution | Track the approved sprint and execution checkboxes/status. |
| `work/sprints/ledger.tsv` | Modify | Add and synchronize the SPRINT-012 lifecycle row. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-11-result.json` | Create/update | Record the non-interactive planning result, paths, statuses, verification, and no-commit state. |

`src/app/**`, the saved-library/share schema, template codec implementation, rune helper/catalog,
and promoted EPIC-03/04/10 artifacts have no planned changes. `package.json` changes only if the
existing default fixture orchestration cannot include the registered profile without a script
change; no new dependency, live-network verification script, or runtime import is allowed.

## Definition of Done

- [ ] BW-1101 through BW-1106 are linked to SPRINT-012, executed in dependency order, and carry
      focused verification evidence before being marked done.
- [ ] EPIC-11, SPRINT-012, and the ledger are completed only after technical, review, production
      promotion, documentation, and process gates all pass.
- [ ] The result manifest names EPIC-11, SPRINT-012, BW-1101 through BW-1106, the exact outputs,
      verification result, and `commit_created: false` consistently.
- [ ] `src/domain` remains framework-neutral and imports no React, DOM/browser, storage, network,
      filesystem, app, generated artifact, QA, source snapshot, or Python module.
- [ ] Existing `InsigniaId`, `TemplateEquipmentModifierId`, `ArmorSlot`, and
      `ArmorPiece.insigniaId` remain the identity/attachment boundaries; every accepted record has
      one explicit modifier mapping and never relies on numeric coincidence.
- [ ] The catalog has schema version 1, a semantic catalog version, named section digests, one
      verified EPIC-03 dependency summary, deterministic source-set/disposition records, and stable
      numeric record ordering.
- [ ] The bounded hybrid source authority is documented and enforced. No category crawl, arbitrary
      link expansion, community source, one-off scraper, or runtime wiki fetch is introduced.
- [ ] The independent modifier and inventory projections reconcile. Every candidate becomes an
      accepted record, supported relationship, explicit exclusion, unsupported disposition, or
      blocker; no malformed or filter-resistant candidate is silently dropped.
- [ ] The current expected 45-record baseline and modifier ID ranges are confirmed or replaced by a
      named reviewed source-plan decision before production fetch.
- [ ] Every accepted insignia has stable ID/mapping, canonical name/lookup key, page identity,
      common/profession availability, valid profession join, mode state, non-empty applicable slots,
      non-empty typed effects, completeness/display states, nullable icon ID, and compact field
      provenance.
- [ ] Source `arms` terminology maps once to domain `hands`; all public slot facts use the existing
      five-value `ArmorSlot` contract.
- [ ] Every numeric effect distinguishes fixed versus exact-by-slot value, application locality,
      condition, equipment combination, mode applicability, unit, and provenance.
- [ ] Survivor resolves to `5/15/5/10/5`, Radiant to `1/3/1/2/1`, and Tormentor's to
      `2/6/2/4/2` across head/chest/hands/legs/feet; no universal multiplier is present.
- [ ] Fixed, conditional, tiered, compound, local, non-stacking, note-only, and unknown behaviors
      have tests. Missing or unknown facts are never synthesized as zero or unconditional.
- [ ] Item/inventory `Stackable` cannot populate effect-combination rules; each such rule has
      approved mechanics evidence or remains `unknown`.
- [ ] `resolveInsigniaEffectsForArmorSlot` is deterministic and non-mutating, resolves exact values,
      preserves condition/locality/combination/mode, and returns typed unresolved states without
      calculating a character total.
- [ ] The helper and catalog do not choose armor, validate full equipment legality, evaluate combat
      state, apply hit-location probabilities, combine runes, or implement full stat analysis.
- [ ] Safe unknown/note-only semantics remain visible with bounded warning/review evidence, while
      failed source-clear arithmetic and incomplete slot maps block or remove the numeric claim.
- [ ] Fixture mode is synthetic/network-free; live mode is manual and fixed-origin; fetch is
      source-digest-confirmed; offline replay requires one complete, confined, digest-valid selected
      snapshot set.
- [ ] The new shared source-set protocol rejects unsafe paths and incomplete/mismatched inputs; prior
      EPIC-04/10 source modules, profile behavior, tests, and generated bytes remain unchanged.
- [ ] Python output and TypeScript tests validate one authoritative insignia wire shape. No second
      hand-maintained production schema or serialized lookup index is introduced.
- [ ] Catalog, manifest, QA JSON, section digests, source/disposition/effect ordering, and finding IDs
      are byte-identical across repeated fixed-clock fixture and selected offline runs.
- [ ] Semantic changes to values, slots, restrictions, conditions, modes, locality, combination, or
      runtime media alter the relevant digest/version; operational/audit-only changes do not.
- [ ] The first production baseline review records counts/ID gaps, group/profession/mode coverage,
      dispositions, slot families, completeness states, representative conditions/local effects,
      icons, section/dependency digests, and gate evidence.
- [ ] Required source IDs, page/revision/retrieval facts, field provenance, dependency digests, and
      artifact integrity checks are complete. Unknown copied material and integrity/digest failures
      remain non-waivable.
- [ ] No source-authored long prose, raw page body, source plan, snapshot manifest, QA body, review
      body, absolute local path, icon byte, thumbnail, screenshot, secret, or unbounded evidence
      enters the runtime catalog.
- [ ] Exactly the catalog JSON, adjacent manifest JSON, and bounded QA JSON are promoted and
      allowlisted; representative sibling and intermediate artifacts remain ignored.
- [ ] Both `appConsumptionGate` and `publicReleaseGate` pass, with no open critical/error findings and
      every warning carrying a valid bounded disposition.
- [ ] Documentation explains exact paths/commands, source and replay limits, identity, per-slot
      values, locality/combination, condition/mode states, runtime boundaries, and handoffs to
      EPIC-13, EPIC-14, EPIC-17, EPIC-20, and EPIC-21.
- [ ] `src/app/catalogs.ts`, editor behavior, local persistence/sharing, equipment UI, rune behavior,
      and complete stat analysis remain unchanged.
- [ ] `npm run verify` passes after production promotion and documentation closeout.
- [ ] The final diff contains no unrelated implementation or generated artifacts, and no commit is
      created.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| The modifier table mixes insignias with runes, inscriptions, and weapon upgrades. | Over-inclusion, missing IDs, or wrong crosswalks. | Reconcile it with the independent `Insignia` inventory and current reviewed ID/count expectation; explicitly account for every candidate. |
| Canonical naming collides with quest or disambiguation pages. | Wrong source page, provenance, or content type. | Resolve page IDs/revisions and verify insignia content shape; preserve redirects and reject quest-shaped targets. |
| Parenthetical professions in modifier labels are treated as display-name text or ignored. | Unstable names or missing legality facts. | Parse label, suffix, canonical page name, and EPIC-03 restriction as separate claims and block contradictions. |
| A universal 3/2/1 multiplier is inferred from chest/legs behavior. | Incorrect health, energy, damage, or future families. | Store complete per-effect five-slot maps and test representative families with different units/bases. |
| Wiki `arms` and domain `hands` become two slot vocabularies. | Failed lookups and silent missing values. | Normalize once during extraction and require exact `ArmorSlot` keys in runtime data/tests. |
| Item `Stackable: No` is interpreted as effect non-stacking. | Health/energy or local armor mechanics are calculated incorrectly. | Keep item-stack evidence ingestion-only and require independent per-effect combination evidence. |
| Piece-local armor/damage effects are treated as global additive stats. | Grossly incorrect defensive totals. | Encode application scope separately, keep the helper per-piece, and defer hit-location/full aggregation to EPIC-21. |
| Conditional prose is normalized too aggressively. | Runtime claims bonuses in states where they do not apply. | Use a closed predicate vocabulary, preserve review/provenance, and route unsupported expressions to deferred notes/unknowns. |
| A condition schema becomes an accidental combat expression language. | Security, complexity, and long-term compatibility risk. | Permit only inert controlled predicates and operands; no evaluable strings, callbacks, nested arbitrary AST, or evaluator in this sprint. |
| Safe unknowns are either hidden or made globally blocking. | False completeness or inability to ship useful catalog facts. | Keep explicit completeness states; warn/review conservative unknowns, but block failed source-clear deterministic claims. |
| PvP template presence is treated as proof of both-mode availability. | Incorrect PvE/PvP filtering. | Require separate evidence for each mode; preserve `unknown` rather than infer the missing side. |
| Shared source-protocol work regresses shipped catalogs. | EPIC-04/10 replay or promoted bytes change unexpectedly. | Do not migrate old modules; add profile-neutral primitives for EPIC-11 and test their contracts against existing rejection cases. |
| Source drift changes count, IDs, families, or conditions beyond caps. | Partial catalog or silent scope expansion. | Stop at discovery, report the digest diff, and require a sprint amendment before raising caps or widening authority. |
| Production snapshots are ignored. | Exact future replay may be unavailable on another machine. | Document retention limits and require retained selected inputs or a fresh bounded live acquisition/review; never imply manifests embed raw inputs. |
| Missing or ambiguous icons delay otherwise safe records. | Incomplete future presentation. | Keep `iconId` nullable with stable reviewed warnings; do not guess file identity or download bytes. |
| Semantic versioning includes audit noise or omits consumer data. | Cache churn or stale downstream semantics. | Define named semantic sections and mutation tests for included and excluded field classes. |
| First promotion has no prior production baseline. | Large coverage or semantic mistakes are hard to notice. | Require named review of counts, ID gaps, groups, slot maps, conditions, completeness, icons, and representative records. |
| Catalog work expands into armor UI, persistence, or full stats. | Oversized sprint and cross-epic inconsistency. | Treat existing attachment types as interfaces only and enforce explicit downstream ownership at every phase gate. |

## Security

- Live network access is manual-only, GET-only, and requires `--allow-live-network`. Requests use the
  pinned Guild Wars Wiki API origin, final-origin checks, descriptive User-Agent, timeouts, bounded
  retries/delays, `maxlag`, batching, continuation ceilings, and byte/request/page caps.
- Source-provided URLs, titles, redirects, and file names are untrusted provenance values, not fetch
  targets. Fetch derives requests only from the confirmed canonical source plan and rejects scheme,
  host, namespace, title, dependency, cap, and digest drift.
- Wikitext, API JSON, redirects, image metadata, source plans, snapshot manifests, dependency
  artifacts, and generated baselines are untrusted input. Validate types, controlled vocabularies,
  finite safe numbers, counts, lengths, encodings, and digests; never evaluate templates, HTML,
  condition strings, or source-authored expressions.
- All source-plan, snapshot, child-manifest, dependency, and output paths stay under explicit roots.
  Reject absolute children, `..` traversal, symlink escape, duplicate children, mixed roots, and
  manifest/artifact digest mismatch. Preserve atomic writes and collision refusal.
- Offline and fixture tests fail if a network path is reached. `npm run verify` remains network-free
  and independent of current source availability.
- Terminal and QA output is bounded and sanitized. Do not print full page bodies, arbitrary control
  characters, unbounded effect prose, sensitive local paths, raw exception dumps, or attacker-chosen
  URLs.
- Runtime JSON is inert data and is never rendered as HTML. Future UI renders names/notes as text and
  treats remote icon loading/attribution as a separate privacy-aware decision.
- Icon handling is metadata-only. No image bytes, thumbnails, screenshots, data URLs, or source media
  enter fixtures, promoted runtime data, or the application bundle.
- Source-policy classification remains field-level. Unknown copied material cannot be accepted as
  risk; exclude it or obtain a future explicit ticket and named approval for the exact scope.
- Canonical SHA-256 digests provide integrity and reproducibility evidence, not source authenticity.
  Manual review still verifies source identity, source-set scope, semantic interpretation,
  dependency, and release decision.
- No new package or Python dependency is planned. Continue using the pinned parser environment and
  repository lockfile; any newly required dependency triggers supply-chain review and a plan
  amendment.

## Dependencies

### Required Inputs

- Completed EPIC-01 source-policy and QA contracts, including field provenance, copied-text rules,
  media restrictions, manual review, non-waivable findings, and exact-path promotion.
- Completed EPIC-02 ingestion platform: fixed-origin MediaWiki client, snapshot store, pinned
  `mwparserfromhell` adapter, canonical artifact writer, metadata-only icons, QA reports, and
  fixture/offline/live orchestration.
- Promoted EPIC-03 files:
  `data/generated/epic-03/professions-attributes.catalog.json`, its adjacent manifest, and
  `data/qa/epic-03/professions-attributes.catalog.qa.json`, with verified digests and passing gates.
- Existing EPIC-04/10 staged source/replay and catalog patterns as regression precedents; their
  promoted artifacts are not semantic inputs.
- Existing `InsigniaId`, `TemplateEquipmentModifierId`, `ProfessionId`, `AttributeId`, `ArmorSlot`,
  and `ArmorPiece.insigniaId` contracts.
- Node.js 22.11.0 or newer, npm 11.10.1 or newer, Python 3, the repository lockfile, and a prepared
  `.venv-data` environment.

The React app, local library, template codec, skills catalog, and runes catalog are regression
surfaces rather than semantic dependencies.

### Downstream Handoffs

- EPIC-13 consumes stable IDs, applicable slots, profession restrictions, and piece-local semantics
  while owning armor-shell identity, base armor, headgear facts, and whether a shell accepts an
  insignia.
- EPIC-14 uses `ArmorPiece.insigniaId` and `ArmorPiece.slot`, performs primary-profession/mode/shell
  legality, calls the per-slot resolver for display, and preserves unresolved authored choices.
- EPIC-17 maps decoded equipment modifier IDs through the explicit insignia crosswalk while
  preserving unknown modifiers and distinguishing them from rune/weapon namespaces.
- EPIC-20 may index names, restrictions, slots, structured effect tags, conditions, and reviewed
  display facts only from the runtime catalog after attribution and remote-media privacy behavior
  exist.
- EPIC-21 owns cross-piece aggregation, conditional-state evaluation, hit-location mechanics, full
  health/energy/armor/damage totals, rune/insignia composition, and interpretation of deferred
  note-only/unknown effects.

## Open Questions

1. **Final coverage and current baseline:** Do live seed revisions still reconcile exactly 45
   player-usable insignias at modifier IDs 290-324 and 358-367? Resolve during Phase 1/2 discovery.
   Any difference requires explicit review; it is not silently accepted or forced to the old count.
2. **Canonical detail-page mapping:** Which candidates resolve through redirects, aliases, or shared
   pages, and do any names collide with quest/disambiguation content? Lock the one-record/one-ID
   mapping in the reviewed source plan before fetch.
3. **Condition vocabulary completeness:** Which source-clear predicates can be represented by the
   initial closed vocabulary without implying runtime evaluation? Add only bounded controlled forms
   during Phase 4; leave all other behavior reviewed and deferred to EPIC-21.
4. **Effect combination evidence:** Which local, non-stacking, summed, or separately composed rules
   are explicitly established by the approved mechanics sources? Missing evidence stays `unknown`;
   item `Stackable` cannot answer this question.
5. **Mode availability evidence:** Do the approved sources prove both PvE and PvP availability and
   identical effects for every current insignia, or are any records/effects mode-limited? Preserve
   `unknown` or per-effect mode facts rather than extrapolating from equipment-template presence.
6. **Damage and duration units:** For Knight's, Tormentor's, Lieutenant's, Stonefist, and other
   non-armor scalar effects, which units and application scopes are source-clear enough for
   structured display? Anything not supported by the source-shape review remains note-only rather
   than forcing a generic numeric contract.
7. **Optional icon findings:** Are missing or nonstandard icon metadata cases bounded enough for one
   reviewed warning class, as in EPIC-10, or do they indicate incorrect page resolution? Decide in
   first-baseline review from record-scoped evidence.
8. **Production replay availability:** Will execution retain one complete reviewed live snapshot set
   long enough to perform two fixed-clock offline promotion runs? If not, BW-1105 and SPRINT-012
   remain blocked; synthetic fixture data cannot become the production catalog.
