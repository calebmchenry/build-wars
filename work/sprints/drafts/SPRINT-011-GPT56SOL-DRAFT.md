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

This sprint turns EPIC-10 into a deterministic, runtime-eligible armor-rune catalog. It extends the
existing source-policy and profile-driven ingestion platform, joins profession and attribute facts
through the promoted EPIC-03 catalog, models rune effects and stacking as plain domain data, and
promotes exactly one catalog JSON, one adjacent artifact manifest, and one bounded QA report.

The sprint is catalog groundwork for later equipment features. It does not add rune controls to the
current editor, import rune data through `src/app/catalogs.ts`, interpret equipment templates,
catalog armor shells or insignias, calculate complete character statistics, fetch remote icons at
runtime, or change the local saved-build schema. `ArmorPiece.runeId` remains the future attachment
point; EPIC-13 owns armor/headgear records, EPIC-14 owns editor and equipment legality, and EPIC-21
owns broader analysis.

The following decisions are fixed for execution:

1. The v1 identity authority is the rune row's numeric modifier ID from `Equipment template format`.
   A record stores both a branded `RuneId` and a branded `TemplateEquipmentModifierId`; their numeric
   values may match in v1, but only the explicit record mapping relates them. IDs are never assigned
   from array position, alphabetical order, or a synthesized dense range.
2. The authoritative source set is a bounded hybrid:
   [Equipment template format](https://wiki.guildwars.com/wiki/Equipment_template_format) supplies
   modifier IDs and candidate names, [Rune](https://wiki.guildwars.com/wiki/Rune) supplies the
   armor-rune inventory and broad mechanics, and
   [Attribute bonus](https://wiki.guildwars.com/wiki/Attribute_bonus) supplies the headgear handoff
   fact. Detail pages supply canonical identity and icon/effect evidence, and the promoted EPIC-03
   catalog supplies profession and attribute IDs. Category crawl, search-result expansion,
   PvX/community pages, and arbitrary recursive links are excluded.
3. Catalog schema v1 separates family rank from rarity tier. Minor/major/superior attribute,
   Absorption, and Vigor variants use a family rank; unranked families such as Vitae and Attunement
   may still have a rarity tier without being presented as rank variants.
4. Stacking is attached to each structured effect, not inferred from the rune family as a whole. An
   attribute rune can therefore use `highest` for its attribute bonus and `sum` for its maximum-health
   penalty. A single record-level `stackable` boolean is insufficient and is prohibited.
5. Unknown and conditional mechanics remain explicit `note-only` or `unknown` effect states backed
   by QA and review. They are never converted from prose into invented arithmetic. Empty effect lists
   are invalid for accepted records.
6. A pure domain helper covers only the high-risk handoff: highest attribute bonus per attribute and
   independently countable health penalties for equipped attribute runes. Other rune effects remain
   structured catalog facts until an equipment/stat-calculation epic owns eligibility and full
   composition.
7. Headgear behavior is a handoff fact, not a rune effect. EPIC-10 records whether a rune is an
   attribute-linked candidate for rune-aware headgear, but it does not add `+1` to the rune or compute
   the bonus without an EPIC-13 armor record.
8. Production promotion is part of completion. If a complete reviewed snapshot set, deterministic
   offline replay, first-baseline review, or passing release gates cannot be obtained, useful fixture
   work may land but the sprint remains blocked rather than weakening the gates.

The source-shape interview is skipped as directed. The decisions above extend proven EPIC-03/04
patterns and do not introduce a new app architecture. Source-page shape and exact catalog counts are
execution checkpoints, not reasons to leave identity or stacking policy ambiguous.

## Use Cases

1. **Offer legal candidates later**: EPIC-14 can list cataloged armor runes by primary profession,
   affected attribute, family, and rank without reading wikitext or using name conventions as rules.
2. **Resolve equipment template modifiers later**: EPIC-17 can map a decoded
   `TemplateEquipmentModifierId` to a `RuneId` through an explicit catalog field while preserving
   unknown modifier IDs.
3. **Calculate attribute contributions later**: A caller can derive one highest rune bonus for each
   affected attribute and pass it to `calculateEffectiveAttributeRank` as a rune adjustment.
4. **Preserve health penalties**: Equipping repeated major or superior attribute runes keeps one
   health-delta occurrence per armor entry even when only one attribute bonus applies.
5. **Represent common rune mechanics**: Vigor, Vitae, Attunement, Absorption, and condition-reduction
   families carry typed values and verified effect-level stacking rules; unresolved behavior stays
   visible rather than silently disappearing.
6. **Render truthful tooltips later**: A UI can assemble a short display from canonical names,
   structured effects, restrictions, and reviewed original summaries without copying source-authored
   description paragraphs into runtime data.
7. **Audit and refresh the catalog**: A maintainer can discover a bounded source set, approve its
   digest, fetch only planned pages and metadata, replay a complete selected snapshot set offline,
   and trace every promoted record or disposition to source and QA evidence.
8. **Detect source drift safely**: Redirects, duplicate IDs or names, missing pages/icons, malformed
   effect shapes, new rune-like modifier rows, and changed dependency digests produce stable findings
   instead of silently altering runtime semantics.
9. **Hand off headgear correctly**: EPIC-13/14 can distinguish attribute-linked rune facts from the
   armor shell's inherent or rune-linked headgear bonus without double-counting either.
10. **Verify process state**: Reviewers can connect BW-1001 through BW-1006, EPIC-10, SPRINT-011, the
    sprint ledger, promoted paths, and the ticket-burn result manifest to the same completed state.

## Architecture

### Scope And Ownership

| Area | Owns | Must Not Own |
| --- | --- | --- |
| `src/domain/catalog.ts` | Plain rune catalog envelope, record, identity mapping, family/rank, eligibility, source-set summary, disposition, effect, stacking, display, dependency, and headgear-handoff contracts. | React, browser APIs, runtime fetches, source plans, snapshot paths, QA bodies, generated manifests, or parsing logic. |
| `src/domain/catalog-lookup.ts` | Collision-safe rune lookup by branded catalog ID, template modifier ID, and normalized name. | Equipment legality, stat totals, network access, or serialized duplicate lookup maps. |
| `src/domain/rune-effects.ts` | Pure summary of attribute-rune maxima and per-occurrence health penalties, with typed unresolved outcomes. | Armor-slot validation, profession eligibility, Vigor/Vitae/condition aggregation, base health, headgear bonuses, title effects, or complete stats. |
| `scripts/data/build_wars_ingest` | Fixed-origin snapshots, source planning, page resolution, extraction, EPIC-03 joins, semantic normalization, deterministic assembly, QA, and promotion support. | Runtime imports, one-off scraping, browser automation, recursive crawling, or UI policy. |
| `test/fixtures/data-ingestion/runes` | Minimized synthetic source shapes, redirects, errors, and metadata-only icon responses. | Authoritative live data, copied source prose, icon bytes, screenshots, or production baselines. |
| `data/generated/epic-10/runes.catalog.json` | Runtime-eligible semantic rune data and compact provenance references. | Full source plans, snapshot manifests, raw page bodies, review evidence, QA findings, or local paths. |
| Adjacent manifest and QA JSON | Artifact integrity, selected inputs, source-plan/snapshot-set digests, full release evidence, findings, dispositions, and gates. | Runtime app behavior or imported catalog APIs. |
| Documentation and work records | Source authority, commands, limitations, downstream contracts, release evidence, and lifecycle state. | New implementation semantics not represented and tested in code/data. |

`src/app/catalogs.ts`, `src/domain/equipment.ts`, and `src/domain/effective-attribute-rank.ts` are
integration boundaries but have no planned production change. If execution finds that the catalog
cannot integrate through the existing branded IDs and adjustment input, stop at the relevant phase
gate and amend the plan rather than widening the editor, equipment schema, or rule engine.

### Data Flow

```text
promoted EPIC-03 catalog + manifest + passing QA
                          |
fixed seed snapshots: Equipment template format + Rune + Attribute bonus
  -> source-shape and armor-rune inventory checks
  -> candidate modifier IDs, expected families, exclusions, and requested detail titles
  -> canonical source-set projection + source-plan digest
  -> explicit digest-confirmed detail-page and imageinfo fetch
  -> complete SourceSnapshotSetManifest
  -> selected, network-free offline replay
  -> raw rune extraction + page resolution + metadata-only icons
  -> EPIC-03 profession/attribute joins
  -> effect-level semantic normalization + headgear handoff facts
  -> RuneCatalog semantic JSON
  -> GeneratedArtifactManifest + bounded QaReport
  -> first-baseline/diff review + exact-path promotion
```

Live access is never part of `npm run verify`. Fixture mode is entirely synthetic. Production data
is generated from a selected complete snapshot set in offline mode after the live source plan has
been reviewed and confirmed.

### Identity, Coverage, And Source Authority

| Fact | Primary Authority | Cross-check | Failure Behavior |
| --- | --- | --- | --- |
| Rune/template modifier identity | Rune-like rows in `Equipment template format` | Canonical detail page and armor-rune inventory | Duplicate IDs, conflicting names, or a verified player-usable armor rune without a unique modifier ID block promotion. |
| Armor-rune scope | `Rune` armor-rune table and classifications | Modifier-row inventory and explicit family expectations | Container runes, insignias, and weapon modifiers are excluded with bounded reasons; unmatched rune-like rows require a disposition. |
| Canonical name and page identity | Resolved detail-page title, page ID, revision ID, and timestamp | Modifier-row name and redirect chain | Missing, disambiguated, cyclic, multiply resolved, or contradictory pages block or require explicit exclusion. |
| Profession and attribute restrictions | Promoted EPIC-03 profession/attribute records | Rune/detail labels and family pattern | Unknown, cross-profession, ambiguous, or duplicate joins block accepted attribute-rune records. |
| Numeric effects and stacking | Structured armor-rune table/detail facts supported by fixtures | Family invariants and targeted source notes | Malformed core effects or unknown stacking for mechanically required families block; conditional peripheral behavior becomes reviewed note-only data. |
| Headgear handoff | `Attribute bonus` plus the rune's verified attribute link | EPIC-03 attribute join | Record only `attribute-linked`, `not-applicable`, or `unknown`; never synthesize a rune `+1`. |
| Icon metadata | Detail-page image field plus MediaWiki `imageinfo` | File identity and source policy | Icon ID is nullable with a stable finding and review disposition; bytes are never downloaded. |
| Short display text | Build Wars-authored projection from structured facts | Digest-bound manual review | Copied or lightly edited source prose is excluded; unknown copied material is non-waivable. |

The source-set planner treats every row containing a rune marker and every armor-rune inventory entry
as accounted input. Each becomes an accepted candidate, a same-family/page relationship, an explicit
out-of-scope container-rune exclusion, an unsupported record, or a blocking disposition. Rows that
are plainly insignias or weapon modifiers are outside the candidate projection, but the planner also
derives an expected attribute-rune matrix from the EPIC-03 attributes and the three ranks so a
malformed or renamed rune row cannot evade coverage merely by failing the name filter.

Catalog order is numeric `RuneId`. Numeric gaps are preserved as source-set facts and never filled.
Forward and reverse indexes are derived at runtime or in tests; serialized duplicate maps are not a
second authority. Normalized names use the repository's collision-safe case-fold/whitespace policy,
while family keys and stacking keys are schema-owned stable strings rather than display names.

### Source-Set And Snapshot-Set Protocol

The EPIC-10 profile ID is `epic-10-runes`. It starts with these hard ceilings: three seed pages, 160
detail pages, 160 media titles, 128 requests, two retries per retryable request, eight continuation
pages, a 2 MiB response cap, a 1 MiB parser-input cap, a 32 MiB aggregate cap, a 4 MiB catalog cap,
and a 2 MiB QA cap. The Phase 1 source-shape checkpoint may tighten these ceilings. Any increase or
new seed/source family requires a recorded sprint amendment before another live fetch.

EPIC-10 uses the EPIC-04 two-stage safety model:

1. `discover` fetches only the fixed seed pages, validates their page identity and supported shapes,
   loads and validates the promoted EPIC-03 dependency, enumerates candidate modifier IDs and detail
   titles, records expected/missing/extra family facts, writes a canonical ignored source plan, prints
   a bounded summary, and stops.
2. `fetch` requires `--allow-live-network`, the exact source-plan path, and the exact
   `--confirm-source-set-digest`. It revalidates the plan, dependency identity, caps, and seed
   digests; fetches only the planned titles at the fixed Guild Wars Wiki origin; resolves redirects;
   requests bounded image metadata only; and writes a complete or partial snapshot-set manifest.
3. `offline` requires `--snapshot-set`. It rejects partial, extra, missing, duplicate, mixed-profile,
   path-escaping, digest-mismatched, plan-mismatched, dependency-mismatched, or edited inputs before
   extraction. It performs no DNS or network operation.

Protocol-neutral canonical plan hashing, digest confirmation, confined child loading, and complete
snapshot-set validation should be shared with EPIC-04 where this can preserve its wire output and
tests. Keep the existing skill-specific wrapper and bytes stable. If byte preservation cannot be
proven at the Phase 2 gate, leave EPIC-04 unchanged and have EPIC-10 use new shared primitives rather
than performing a risky migration inside this sprint.

The source-plan digest covers schema/profile identity, caps, seed snapshot identities/content
digests, EPIC-03 semantic dependency identity, candidate IDs/titles/classifications, exclusions, and
planned detail/media titles. It excludes its own value and operational output path. Fetch never
accepts a plan produced for another profile or dependency version.

### Rune Catalog Contract

`RuneCatalog` schema version 1 follows the promoted skill-catalog boundary:

```text
RuneCatalog
  schemaVersion: 1
  catalogVersion: semantic digest
  sectionDigests: CatalogSectionDigest[]
  generatedAt: ISO timestamp
  generator: pinned generator identity
  profile: RuneCatalogProfile
  dependencyDigests: [EPIC-03 dependency summary]
  sourceSet: RuneSourceSetSummary
  dispositions: RuneSourceSetDisposition[]
  runes: CatalogRuneRecord[]
  remoteMedia: RemoteMediaMetadata[]

CatalogRuneRecord
  id: RuneId
  templateModifierId: TemplateEquipmentModifierId
  name: canonical display name
  normalizedName: collision-safe lookup key
  familyKey: stable schema-owned string
  familyKind: attribute | vigor | vitae | attunement | absorption |
              condition-reduction | other
  familyRank: minor | major | superior | null
  rarityTier: minor | major | superior | null
  professionId: ProfessionId | null
  affectedAttributeId: AttributeId | null
  eligibility: profession-armor | universal-armor
  effects: non-empty RuneEffect[]
  headgearInteraction: attribute-linked | not-applicable | unknown
  display: structured-only | reviewed-original | excluded
  wikiUrl: canonical HTTPS URL
  pageIdentity: requested/normalized/canonical title plus page/revision facts
  iconId: string | null
  provenance: compact field provenance
```

The exact TypeScript type names may adjust to existing naming conventions, but the distinctions and
wire fields above are acceptance requirements. `CatalogRuneRecord` is added alongside the existing
lightweight `Rune` interface, as `CatalogSkillRecord` is alongside `Skill`, so unrelated foundation
fixtures do not become generated-catalog records accidentally.

`RuneSourceSetSummary` records seed/source-plan digests, accepted/disposition counts, modifier-ID
range and gaps, counts by family/rank/profession, excluded container-rune count, and the locked source
authority. Dispositions retain a stable candidate ID, requested name/title, modifier ID when known,
kind, bounded reason, nullable review ID, and compact provenance. Raw rows and page bodies do not
enter the runtime artifact.

The EPIC-03 dependency summary records catalog version, artifact and manifest digests, passing QA
gate, and the profession/attribute section digests used for joins. EPIC-04 skills are not a rune
catalog dependency.

### Effect And Stacking Semantics

Every numeric effect carries an explicit unit, signed or directionally named value, and a stacking
contract with a stable group key. Supported stacking rules are:

- `sum`: every equipped occurrence contributes its signed value;
- `highest`: one greatest value contributes within the exact group key;
- `separate`: occurrences compose independently and cannot truthfully be reduced to one scalar by
  this catalog; and
- `unknown`: the source does not support a calculation, so a review/note reference is required.

The structured effect union and required v1 mapping are:

| Effect kind | Required fields | Required v1 stacking behavior |
| --- | --- | --- |
| `attribute-rank` | `attributeId`, positive integer `amount` | `highest` with `attribute:<id>`; minor/major/superior are `+1/+2/+3` only after source verification. |
| `maximum-health-delta` | signed integer `amount` | Attribute-rune `-35/-75` penalties use `sum`; Vigor variants use `highest` in `health:vigor`; Vitae uses `sum`. |
| `maximum-energy-delta` | signed integer `amount` | Attunement uses `sum` when verified. |
| `physical-damage-reduction` | positive integer `amount` and supported damage scope | Absorption uses `highest` in its family group; unsupported damage-calculation details remain out of scope. |
| `condition-duration-reduction` | controlled condition keys and positive percentage | Use the verified rune-family non-stacking key; interaction/rounding with non-rune modifiers is `separate` or note-only for later analysis. |
| `note-only` | stable note code, reviewed original short text or structured limitation, provenance | No arithmetic; requires an explicit review state and cannot masquerade as complete. |
| `unknown` | stable source-field reference/digest, bounded reason, provenance | `unknown`; raw or copied effect prose is not emitted. |

Absence is also explicit: a minor attribute rune has no health-delta effect, rather than a fabricated
zero penalty. Accepted records must have at least one modeled or note-only effect. Unknown required
values, unknown family classification, and malformed effect text are not represented as zero.

The semantic normalizer is table-driven by verified family/rank facts and rejects contradictory
records. It must not use free-form display prose as the sole authority for a numeric calculation.
Each effect has field-level provenance to the factual input and transformation claim.

### Attribute-Rune Summary Helper

`summarizeAttributeRuneEffects(catalog, entries)` accepts bounded entries with a caller-owned unique
`sourceKey` and `runeId`. It performs catalog lookup and returns deterministic plain data:

- one maximum attribute-rank contribution per `AttributeId`, including all contributing source keys
  and the selected amount;
- `EffectiveAttributeRankAdjustment`-compatible entries with `kind: "rune"`;
- one health-penalty occurrence for each equipped attribute rune that has a negative health delta,
  plus the summed penalty delta;
- unknown rune IDs, duplicate source keys, malformed/contradictory records, and unsupported effects
  as typed unresolved reasons; and
- evidence references sufficient to explain why a duplicate bonus was suppressed while its penalty
  remained counted.

Input order does not change the semantic output; arrays sort by numeric attribute ID and source key.
Equal maximum bonuses do not double-apply. The helper does not decide whether the rune is legal for a
character, whether two entries occupy the same armor slot, whether a headgear bonus applies, or how
Vigor, Vitae, energy, damage reduction, conditions, base health, titles, weapons, and temporary
effects combine. EPIC-14/21 can add a broader resolver without changing the catalog wire shape.

Required fixtures include two superior runes for one attribute (`+3`, health `-150`), minor plus
superior for one attribute (`+3`, health `-75`), duplicate major runes (`+2`, health `-70`), runes for
two attributes (independent maxima and all penalties), unknown IDs, and an attribute-rune/headgear
handoff case proving the helper does not synthesize the headgear `+1`.

### Runtime Boundary, Determinism, And Release

Only `data/generated/epic-10/runes.catalog.json` is runtime-eligible. This sprint does not import it
into the app. A later runtime consumer must do so only through `src/app/catalogs.ts` and must never
import the adjacent manifest, QA report, source plan, snapshot-set manifest, source snapshot, Python
module, or wiki API.

Canonical JSON is UTF-8, LF-terminated, two-space indented, sorted-key output with finite numbers and
stable array order. The semantic `catalogVersion` hashes schema-owned identity, names, lookup keys,
families/ranks, eligibility, structured effects/stacking, headgear handoff, reviewed display fields,
runtime media fields, source-set semantic dispositions, and EPIC-03 semantic dependency facts. It
excludes `generatedAt`, its own value, output/local paths, source-plan and snapshot-set paths,
retrieval-only timestamps, QA/manifest bodies, review bodies, and other audit-only provenance.

Section digests separately cover `identity-and-eligibility`, `effects-and-stacking`,
`headgear-handoff`, `display-and-media`, `source-set`, and `dependencies`. A provenance-only change
may alter artifact bytes and review evidence without falsely changing the semantic catalog version;
a consumer-visible change must change the relevant section digest and catalog version. The artifact
manifest hashes final canonical catalog bytes and records all selected inputs without being embedded
back into the catalog.

Promotion requires:

- complete candidate accounting and unique modifier/catalog IDs;
- complete page/revision/retrieval provenance for every accepted source-derived record;
- exact EPIC-03 dependency digest and passing gate validation;
- mechanically complete effects and stacking for attribute runes, Vigor, Vitae, Attunement, and
  other accepted families, or an allowed reviewed note-only disposition where arithmetic is not
  claimed;
- byte-identical repeated fixture and selected offline generation under a fixed clock;
- first-baseline or generated-diff review bound to artifact and section digests;
- no open critical/error findings, with every warning resolved, excluded, or accepted by a named
  bounded review; and
- `appConsumptionGate: pass` and `publicReleaseGate: pass` for the exact three promoted paths.

Unknown copied material, unreadable artifacts, digest mismatch, path escape, dependency mismatch,
and an incomplete snapshot set are non-waivable. Missing optional icon metadata may be a reviewed
warning because `iconId` is nullable; it may not be hidden or replaced with fetched bytes.

## Implementation

### Phase 1: BW-1001 Catalog Contracts And Profile (~15% of effort)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/rune-effects.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/rune-catalog.test.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `work/tickets/10-runes/BW-1001-rune-catalog-contracts-and-profile.md`

**Tasks:**

- [ ] Mark EPIC-10, SPRINT-011, and BW-1001 in progress without advancing dependent tickets.
- [ ] Add the schema-v1 rune catalog, record, profile, dependency, source-set, disposition, page
      identity, family/rank/tier, eligibility, display, effect, stacking, and headgear-handoff types.
- [ ] Preserve the lightweight `Rune` type and use the existing `RuneId`,
      `TemplateEquipmentModifierId`, `ProfessionId`, and `AttributeId` brands; do not add a parallel
      numeric ID type.
- [ ] Add rune lookups by catalog ID, template modifier ID, and normalized name. Return `null` on a
      missing or colliding name rather than selecting by array order.
- [ ] Establish `src/domain/rune-effects.ts` with public input/output/error contracts, but defer the
      actual semantic resolver to Phase 4.
- [ ] Register `epic-10-runes` with the three fixed seeds, exact output paths, fixture/offline/live
      support, metadata-only media policy, and the initial hard caps stated in Architecture.
- [ ] Generalize CLI help and validation from “EPIC-04 only” to profiles that declare planned-source
      stages. Preserve EPIC-02/03/04 arguments, defaults, exit codes, and behavior.
- [ ] Add fixture profile dispatch without allowing EPIC-10 to fall through to a legacy or skill
      pipeline.
- [ ] Add TypeScript wire-shape tests and Python profile/CLI compatibility tests, including rejection
      of live mode without opt-in, fetch without digest confirmation, offline without a snapshot set,
      and output-path overlap.
- [ ] Perform a read-only source-shape checkpoint against bounded current snapshots or API metadata.
      Record supported table/template names, candidate count, and whether the initial ceilings can be
      tightened; do not broaden them without an amendment.

**Phase Gate:**

- [ ] The domain contract can represent every required effect distinction without a record-level
      stackable flag, framework import, runtime audit path, or full-stat API.
- [ ] Profile tests prove existing registered profiles are unchanged, and the source-shape
      checkpoint supports the fixed hybrid authority. Otherwise stop before source-plan work.
- [ ] Mark BW-1001 done only after its acceptance criteria and focused verification pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/rune-catalog.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`

### Phase 2: BW-1002 Source Set, Resolution, And Fixtures (~18% of effort)

**Files:**

- `scripts/data/build_wars_ingest/source_set_protocol.py`
- `scripts/data/build_wars_ingest/skill_source_set.py`
- `scripts/data/build_wars_ingest/rune_source_set.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_skill_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_rune_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/runes/equipment-template-format.wiki`
- `test/fixtures/data-ingestion/runes/rune.wiki`
- `test/fixtures/data-ingestion/runes/attribute-bonus.wiki`
- `test/fixtures/data-ingestion/runes/source-resolution.json`
- `work/tickets/10-runes/BW-1002-rune-source-set-and-page-resolution.md`

**Tasks:**

- [ ] Mark BW-1002 in progress only after the Phase 1 gate passes.
- [ ] Extract protocol-neutral source-plan hashing, explicit digest confirmation, confined child
      loading, and complete snapshot-set checks where EPIC-04 bytes and public behavior can remain
      identical; retain skill-specific adapters and regression coverage.
- [ ] Build the EPIC-10 discover planner from the three fixed seed snapshots and the verified
      EPIC-03 dependency, with deterministic modifier-ID candidates, expected attribute/rank matrix,
      common/special family inventory, container-rune exclusions, detail titles, and bounded
      diagnostics.
- [ ] Classify every rune-like modifier row and armor-rune inventory entry as accepted, related,
      excluded, unsupported, or blocked. Preserve duplicate names/IDs, missing expected variants,
      extra families, malformed rows, and ambiguous source shapes as stable findings.
- [ ] Resolve requested titles through MediaWiki normalization/redirect evidence. Reject cycles,
      disambiguation, missing pages, duplicate canonical pages with conflicting identities, and
      source-family/origin drift.
- [ ] Include caps, candidate/disposition counts, EPIC-03 dependency facts, seed revision/content
      digests, requested detail/media titles, and the canonical source-set digest in the ignored
      source plan.
- [ ] Require exact digest-confirmed fetch and write a snapshot-set manifest with expected/observed
      child counts, aggregate digest, source-plan projection, completion state, and bounded failure
      details. Partial acquisition must remain inspectable but unreplayable.
- [ ] Add fully synthetic fixtures for three ranks of an attribute family, profession restrictions,
      Vigor, Vitae, Attunement, Absorption, one condition family, a container-rune exclusion,
      redirects, duplicate names/IDs, missing pages, malformed candidate rows, gaps, and unexpected
      families.
- [ ] Prove fixture discovery is network-free, stable under reordered rows, and bounded under
      oversized/malicious input.
- [ ] Document the exact direct fixture command in the ticket execution evidence; do not alter the
      production artifact yet.

**Phase Gate:**

- [ ] A reviewer can inspect one canonical plan and account for every rune-like seed entry before a
      detail-page request is authorized.
- [ ] EPIC-04 source-plan/snapshot-set tests and fixture bytes remain compatible. If shared
      extraction would change them, revert that refactor and isolate only the new protocol helper.
- [ ] Offline replay rejects every incomplete or mismatched manifest case before parsing a page.
- [ ] Mark BW-1002 done only after its acceptance criteria and focused verification pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_source_set build_wars_ingest.tests.test_skill_source_set`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-10-runes --root work/runs/data-ingestion/epic-10-fixture-a --fixture-root test/fixtures/data-ingestion`

### Phase 3: BW-1003 Rune Extraction And Joins (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/rune_extractor.py`
- `scripts/data/build_wars_ingest/rune_source_set.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_rune_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/runes/minor-attribute-rune.wiki`
- `test/fixtures/data-ingestion/runes/major-attribute-rune.wiki`
- `test/fixtures/data-ingestion/runes/superior-attribute-rune.wiki`
- `test/fixtures/data-ingestion/runes/non-attribute-runes.wiki`
- `test/fixtures/data-ingestion/runes/malformed-rune.wiki`
- `test/fixtures/data-ingestion/runes/imageinfo.json`
- `work/tickets/10-runes/BW-1003-rune-extractors.md`

**Tasks:**

- [ ] Mark BW-1003 in progress only after the Phase 2 source-set gate passes.
- [ ] Parse verified seed/detail snapshots with `mwparserfromhell` and supported table/template
      adapters; do not use regex-only nested-template parsing or live clients inside extractors.
- [ ] Produce an internal raw rune record containing modifier ID, source/canonical names, family
      label, family-rank token, rarity token, profession/attribute labels, source restriction facts,
      raw structured effect fields, headgear-relevance evidence, detail-page identity, icon candidate,
      and field-level source references.
- [ ] Preserve raw effect field identity and a digest/bounded diagnostic for unsupported content, but
      do not copy raw effect or description prose into the runtime record.
- [ ] Join profession and affected attribute through unique EPIC-03 records and section digests,
      never through numeric coincidence, array position, or unchecked display-name matching.
- [ ] Distinguish Restoration the condition-reduction family from the Ritualist Restoration Magic
      attribute through IDs, family kind, and full candidate identity rather than substring rules.
- [ ] Normalize family rank independently from rarity tier and reject impossible combinations,
      contradictory profession labels, and an attribute that does not belong to the rune's armor
      profession.
- [ ] Resolve metadata-only icon records through verified image fields and `imageinfo`, recording
      `cachedBytes: false`. Do not fetch or persist image bytes, thumbnails, or arbitrary URLs.
- [ ] Emit stable finding IDs for duplicate IDs/names, lookup-key collisions, missing restrictions,
      missing pages/revisions/icons, unknown templates/parameters/families, malformed numeric fields,
      lossy parsing, and copied-text risk.
- [ ] Guarantee every fixture candidate becomes one deterministic raw record or one explicit
      disposition, and sort records by numeric modifier ID regardless of page/request order.

**Phase Gate:**

- [ ] Raw extraction is loss-aware and source-traceable, but contains no inferred stacking or
      copied long-form display text.
- [ ] Every accepted attribute record has a unique EPIC-03 profession/attribute join and every
      unresolved candidate has a stable disposition.
- [ ] Mark BW-1003 done only after its acceptance criteria and focused verification pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_extractor build_wars_ingest.tests.test_icons`
- `npm run data:test`
- Repeat the EPIC-10 fixture command with a fixed clock and inspect stable raw/disposition ordering.

### Phase 4: BW-1004 Effect Semantics And Domain Fixtures (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/rune_semantics.py`
- `scripts/data/build_wars_ingest/rune_extractor.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_rune_semantics.py`
- `src/domain/rune-effects.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/rune-effects.test.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `work/tickets/10-runes/BW-1004-rune-effect-semantics-and-validation-fixtures.md`

**Tasks:**

- [ ] Mark BW-1004 in progress only after deterministic raw extraction passes.
- [ ] Implement a table-driven semantic normalizer for attribute-rank bonuses, health deltas, energy
      deltas, physical-damage reduction, condition-duration reduction, reviewed notes, and unknown
      effects using the required effect-level stacking contracts.
- [ ] Validate rank families against their expected effects: minor `+1` with no penalty, major `+2`
      with independently summed `-35` health, and superior `+3` with independently summed `-75`
      health, all subject to verified source facts rather than hard-coded trust.
- [ ] Encode verified Vigor as highest-in-family health, Vitae as summed health, Attunement as summed
      energy, and Absorption/condition families with only the supported scope and stacking claims.
      Route ambiguous rounding, cross-system composition, or conditional exceptions to reviewed
      note-only/unknown effects.
- [ ] Require a stable stacking group for every numeric effect, a review reference for every
      note-only/unknown effect, and non-empty effects for every accepted record.
- [ ] Derive `attribute-linked` headgear handoff only for accepted attribute runes. Do not emit a
      headgear adjustment or fold `+1` into the rune effect.
- [ ] Implement `summarizeAttributeRuneEffects` with collision-safe lookup, unique caller source
      keys, input-order-independent output, one maximum per attribute, every negative attribute-rune
      health occurrence, a summed penalty, adjustment-compatible output, and bounded unresolved
      reasons.
- [ ] Add fixtures for duplicate/equal/mixed-rank attribute runes, two attributes, negative-health
      preservation, unknown rune IDs, duplicate source keys, malformed catalog records, non-attribute
      deferral, and headgear non-application.
- [ ] Feed the helper's resolved rune adjustment into `calculateEffectiveAttributeRank` in a test to
      prove compatibility without changing that calculator or teaching it stacking rules.
- [ ] Prove the helper does not mutate the catalog/entries and never silently drops an unresolved
      occurrence.

**Phase Gate:**

- [ ] Two superior runes for one attribute produce one `+3` adjustment and two `-75` occurrences
      totaling `-150`; all other required edge cases pass.
- [ ] Structured semantics do not overclaim full equipment legality, base health, condition rounding,
      or headgear behavior.
- [ ] Mark BW-1004 done only after its acceptance criteria and focused verification pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/rune-effects.test.ts test/domain/effective-attribute-rank.test.ts test/domain/rune-catalog.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_semantics`

### Phase 5: BW-1005 Assembly, QA, Review, And Promotion (~17% of effort)

**Files:**

- `scripts/data/build_wars_ingest/rune_catalog.py`
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
- `test/domain/data-ingestion-contracts.test.ts`
- `.gitignore`
- `data/generated/epic-10/runes.catalog.json`
- `data/generated/epic-10/runes.catalog.manifest.json`
- `data/qa/epic-10/runes.catalog.qa.json`
- `work/tickets/10-runes/BW-1005-rune-catalog-qa-and-promotion.md`

**Tasks:**

- [ ] Mark BW-1005 in progress only after the source-set, extraction, and semantics gates pass.
- [ ] Assemble the canonical catalog envelope with dependency facts, source-set summary,
      dispositions, records, structured effects, headgear handoffs, remote media, compact provenance,
      section digests, and semantic catalog version.
- [ ] Validate the Python output against the same schema-v1 distinctions asserted by TypeScript
      golden-contract tests; do not maintain divergent hand-authored fixture shapes.
- [ ] Add QA for candidate accounting, expected family/rank coverage, modifier/catalog ID uniqueness,
      normalized-name collisions, page/revision/retrieval facts, EPIC-03 joins, restrictions,
      family/rank/tier consistency, required effects, stacking keys/rules, penalty preservation,
      headgear classification, copied text, icons, source references, output caps, section/version
      digests, and artifact integrity.
- [ ] Make finding IDs independent of request order, absolute path, and wall-clock time. Cap findings,
      evidence strings, summaries, and unsupported raw-field excerpts.
- [ ] Generate the fixture catalog twice into separate ignored roots under the fixed clock and prove
      byte identity for catalog, manifest, QA JSON, section digests, source/disposition order, and
      finding IDs.
- [ ] Run bounded live `discover`; review source identities, candidate counts, family coverage, caps,
      EPIC-03 dependency facts, and the digest before running digest-confirmed `fetch`.
- [ ] Replay the resulting complete selected snapshot set offline into an ignored candidate root.
      Prove repeated fixed-clock output is byte-identical and network-free.
- [ ] Perform the first-promotion baseline review: record expected ID/count/family/rank ranges,
      dispositions, section digests, runtime text states, missing-icon decisions, dependency digests,
      and app/public gate evidence. Later baselines classify semantic, provenance-only,
      formatting/order, or schema changes.
- [ ] Treat unknown copied material, unreadable output, artifact/source/dependency digest mismatch,
      incomplete replay, unaccounted player-usable runes, and missing required core semantics as
      non-waivable. Resolve/exclude errors and bind any accepted warning to named review evidence.
- [ ] Generate the approved production bytes from the same selected offline inputs; never hand-edit
      promoted JSON.
- [ ] Add only the exact EPIC-10 parent-directory and three-file `.gitignore` exceptions. Verify
      representative source plans, snapshots, partial/candidate outputs, QA summaries, icon bytes,
      screenshots, and other generated files remain ignored.
- [ ] Mark BW-1005 done only after all three exact artifacts exist, both release gates pass, and every
      verification/evidence item is recorded.

**Phase Gate:**

- [ ] `data/generated/epic-10/runes.catalog.json`, its adjacent manifest, and the bounded QA JSON are
      byte-reproducible, internally consistent, exactly allowlisted, and approved.
- [ ] The runtime catalog can be imported in a TypeScript test without reading any adjacent audit or
      ingestion artifact.
- [ ] If current live access or a complete reviewed snapshot set is unavailable, leave BW-1005 and
      the sprint blocked; do not promote fixture data as production data.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-10-runes --root work/runs/data-ingestion/epic-10-fixture-a --fixture-root test/fixtures/data-ingestion`
- Repeat into `work/runs/data-ingestion/epic-10-fixture-b` with the same fixed clock and compare the
  three JSON outputs byte-for-byte.
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-10-runes --root work/runs/data-ingestion/epic-10-live --allow-live-network --stage discover --clock now`
- Run `fetch` with the reviewed `--source-plan` and exact `--confirm-source-set-digest`, then run
  `offline --profile epic-10-runes --snapshot-set <selected-manifest> --clock fixed` twice.
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_catalog build_wars_ingest.tests.test_artifacts build_wars_ingest.tests.test_qa build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `npm run test:run -- test/domain/data-ingestion-contracts.test.ts test/domain/rune-catalog.test.ts test/domain/rune-effects.test.ts`
- `git check-ignore -v` for all three promoted paths and representative ignored byproducts.
- `git status --short`

### Phase 6: BW-1006 Documentation, Verification, And Closeout (~10% of effort)

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

- [ ] Mark BW-1006 in progress only after exact-path promotion passes.
- [ ] Document source authority, locked caps, source-shape results, identity/crosswalk semantics,
      profile modes, digest-confirmed refresh, selected offline replay, artifact schema, effect and
      stacking vocabulary, semantic versioning, QA gates, first-baseline review, and exact paths.
- [ ] State that only the catalog JSON is runtime-eligible and that this sprint deliberately does not
      import it through `src/app/catalogs.ts`; manifests, QA, snapshots, plans, and scripts remain
      non-runtime.
- [ ] Document metadata-only icons and the attribution/privacy work a later UI must complete before
      displaying remote media.
- [ ] Document EPIC-13/14 handoffs: use `ArmorPiece.runeId`, join legality against the primary armor
      profession, keep armor-owned headgear bonuses separate, and preserve unknown modifier IDs.
- [ ] Document EPIC-15/20/21 handoffs for title separation, future rune search/tooltip presentation,
      and unresolved condition/health/energy composition without treating note-only data as complete.
- [ ] Document that the current persisted build/editor/share behavior is unchanged and that the saved
      schema still defers authored equipment/rune state beyond its existing passive domain field.
- [ ] Record replay-retention limits: production snapshots remain ignored, so future refreshes need
      retained local selected inputs or a new bounded live acquisition and review.
- [ ] Run fixture regeneration, focused test suites, and `npm run verify`; inspect the complete diff
      for unrelated implementation, copied prose, raw pages, icon bytes, screenshots, QA summaries,
      broad allowlists, secrets, absolute machine paths, and nondeterministic timestamps.
- [ ] Add final verification and artifact evidence to BW-1001 through BW-1006. Mark each done only
      after its own phase gate; then mark EPIC-10, SPRINT-011, and ledger row completed together.
- [ ] Write the ticket-burn result manifest with matching sprint/epic/ticket IDs, statuses, paths,
      verification result, and `commit_created: false`; validate it before closeout.
- [ ] Do not create a commit.

**Phase Gate:**

- [ ] Documentation, tickets, sprint, ledger, and result manifest agree with the exact promoted bytes
      and verification result.
- [ ] Existing skill editor, local library, sharing, template compatibility, rule-engine, and prior
      ingestion profiles remain behaviorally unchanged.
- [ ] Mark BW-1006, EPIC-10, and SPRINT-011 complete only after the full Definition of Done passes.

**Verification:**

- `npm run data:regenerate`
- Direct EPIC-10 fixed-clock fixture regeneration
- `npm run verify`
- Manual inspection of generated artifacts, QA gates, docs, tickets, sprint, ledger, result manifest,
  `git status --short`, and the final diff

## Files Summary

| File or path | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Add schema-v1 rune catalog, record, source-set, dependency, effect, stacking, display, and headgear contracts while preserving the lightweight `Rune`. |
| `src/domain/catalog-lookup.ts` | Modify | Add collision-safe rune lookup by catalog ID, template modifier ID, and normalized name. |
| `src/domain/rune-effects.ts` | Create | Implement the narrow attribute-rune maximum and health-penalty summary helper. |
| `src/domain/index.ts` | Modify | Export the new catalog contracts, lookups, helper, and result types. |
| `src/domain/ids.ts` | Reference only | Reuse existing `RuneId` and `TemplateEquipmentModifierId`; no new ID namespace is planned. |
| `src/domain/equipment.ts` | Reference only | Preserve `ArmorPiece.runeId` as the downstream attachment contract. |
| `src/domain/effective-attribute-rank.ts` | Reference only | Consume compatible rune adjustments in tests without adding stacking logic. |
| `scripts/data/build_wars_ingest/config.py` | Modify | Add bounded EPIC-10 request/parser/artifact ceilings. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register the fixed EPIC-10 seeds, modes, policy, caps, dependencies, and exact paths. |
| `scripts/data/build_wars_ingest/source_set_protocol.py` | Create if byte-safe | Share canonical plan confirmation and complete snapshot-set validation primitives. |
| `scripts/data/build_wars_ingest/skill_source_set.py` | Modify narrowly if byte-safe | Use shared protocol primitives while preserving all EPIC-04 bytes and behavior. |
| `scripts/data/build_wars_ingest/rune_source_set.py` | Create | Discover candidates, account coverage, resolve pages, and build source/snapshot-set manifests. |
| `scripts/data/build_wars_ingest/rune_extractor.py` | Create | Parse source-backed identity, family, restriction, raw effect, headgear, and icon facts. |
| `scripts/data/build_wars_ingest/rune_semantics.py` | Create | Convert verified raw facts into typed effects and effect-level stacking contracts. |
| `scripts/data/build_wars_ingest/rune_catalog.py` | Create | Assemble canonical output, semantic version, and section digests. |
| `scripts/data/build_wars_ingest/models.py` | Modify narrowly | Generalize source-plan/snapshot-set support only where shared wire contracts require it. |
| `scripts/data/build_wars_ingest/icons.py` | Modify narrowly | Reuse metadata-only icon resolution for rune records. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Add rune semantic projection, first-baseline evidence, and diff classification support. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add bounded rune coverage, semantics, provenance, policy, dependency, and integrity findings. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate EPIC-10 fixture, discover, fetch, selected offline replay, and promotion outputs. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Generalize staged-profile validation/help while retaining explicit network and digest gates. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Cover compatibility, planning, resolution, extraction, semantics, assembly, QA, determinism, and CLI behavior. |
| `test/domain/contracts.test.ts` | Modify | Protect lightweight contracts and new rune wire distinctions. |
| `test/domain/rune-catalog.test.ts` | Create | Verify catalog shape, IDs, lookups, collisions, families, effects, and semantic version fixtures. |
| `test/domain/rune-effects.test.ts` | Create | Prove highest-per-attribute bonuses and independently counted health penalties. |
| `test/domain/effective-attribute-rank.test.ts` | Modify | Prove the summarized rune adjustment works with the existing helper. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Validate Python-generated rune JSON against TypeScript expectations and runtime isolation. |
| `test/fixtures/data-ingestion/runes/` | Create | Store minimized synthetic, non-authoritative source and failure fixtures. |
| `test/fixtures/data-ingestion/generated/fixture-runes.catalog.json` | Create | Commit the deterministic synthetic golden catalog. |
| `data/generated/epic-10/runes.catalog.json` | Create/allowlist | Promote the only runtime-eligible rune artifact. |
| `data/generated/epic-10/runes.catalog.manifest.json` | Create/allowlist | Promote artifact, selected-input, dependency, digest, and review evidence. |
| `data/qa/epic-10/runes.catalog.qa.json` | Create/allowlist | Promote bounded machine-readable QA and app/public gate evidence. |
| `.gitignore` | Modify narrowly | Allowlist only the EPIC-10 directory parents and exact three approved files. |
| `README.md` | Modify | Document the new catalog boundary, current/deferred scope, and commands. |
| `scripts/data/README.md` | Modify | Document EPIC-10 sources, caps, modes, planning/fetch/replay protocol, and troubleshooting. |
| `data/README.md` | Modify | Add EPIC-10 lifecycle, runtime boundary, and retained/ignored artifact rules. |
| `data/generated/README.md` | Modify | Document exact catalog/manifest promotion and determinism. |
| `data/qa/README.md` | Modify | Document the exact QA report, gates, dispositions, and non-runtime boundary. |
| `compendium/data-ingestion-platform.md` | Modify | Record the staged-profile reuse and EPIC-10 extension decisions. |
| `compendium/runes-catalog.md` | Create | Preserve identity, source authority, effects, stacking, review, and downstream handoffs. |
| `compendium/README.md` | Modify | Index the rune catalog note. |
| `work/tickets/10-runes/*.md` | Modify | Maintain phase status, sprint linkage, decisions, and closeout evidence. |
| `work/sprints/SPRINT-011.md` | Create/update during execution | Track the approved sprint and execution checkboxes/status. |
| `work/sprints/ledger.tsv` | Modify | Add and synchronize the SPRINT-011 lifecycle row. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-10-result.json` | Create/update | Record the non-interactive planning result and no-commit state. |

`src/app/**`, the saved-library schema, template codec implementation, and generated EPIC-03/04
artifacts have no planned changes. `package.json` changes only if execution proves the canonical
offline regeneration command cannot include the new profile through existing scripts; a new
dependency or live-network verification script is not allowed.

## Definition of Done

- [ ] BW-1001 through BW-1006 are linked to SPRINT-011, executed in dependency order, and carry
      focused verification evidence before being marked done.
- [ ] EPIC-10, SPRINT-011, and the ledger are completed only after all technical, review, promotion,
      documentation, and process gates pass.
- [ ] The result manifest names EPIC-10, SPRINT-011, BW-1001 through BW-1006, the expected paths,
      final verification result, and `commit_created: false` consistently.
- [ ] `src/domain` remains framework-neutral and imports no React, DOM/browser, storage, network,
      filesystem, app, generated artifact, QA, source snapshot, or Python module.
- [ ] Existing `RuneId`, `TemplateEquipmentModifierId`, and `ArmorPiece.runeId` remain the identity
      boundaries; the catalog contains an explicit one-to-one modifier-to-rune mapping and never
      relies on numeric coincidence.
- [ ] The rune catalog has schema version 1, a semantic catalog version, required section digests,
      one EPIC-03 dependency summary, deterministic source-set/disposition records, and stable numeric
      record ordering.
- [ ] The bounded hybrid source authority is documented and enforced. No category crawl, community
      source, arbitrary link expansion, one-off scraper, or runtime wiki fetch is introduced.
- [ ] Every rune-like modifier row and armor-rune inventory fact is an accepted record, supported
      relationship, explicit exclusion, unsupported disposition, or blocking finding; no candidate
      is silently dropped.
- [ ] All player-usable armor runes in the approved source set have unique stable IDs, canonical
      names/lookup keys, family kind/key, family rank, rarity tier, eligibility, profession/attribute
      restrictions, page identity, source references, non-empty structured effects, headgear state,
      display state, and nullable metadata-only icon reference.
- [ ] Container runes, insignias, weapon modifiers, acquisition prose, guide content, and other
      non-armor-rune records are excluded explicitly from runtime scope.
- [ ] Attribute-rune effects use highest bonus per affected attribute while all verified negative
      maximum-health effects remain summed per equipped occurrence.
- [ ] Vigor, Vitae, Attunement, Absorption, and condition-reduction families have verified effect
      and stacking facts or explicit reviewed note-only limitations; unknown values are never zeroed
      or guessed.
- [ ] Two superior duplicate attribute runes produce `+3` once and `-150` health delta, with the full
      mixed-rank, equal-rank, multi-attribute, unknown-ID, and headgear non-application fixture set
      passing.
- [ ] `summarizeAttributeRuneEffects` is deterministic, non-mutating, preserves each unresolved
      occurrence, and composes with `calculateEffectiveAttributeRank` without expanding into a full
      stat or equipment-legality calculator.
- [ ] Headgear facts remain separate from rune effects and do not add `+1` without a future armor
      shell record.
- [ ] Fixture mode is synthetic and network-free; live mode is explicit and fixed-origin; fetch is
      digest-confirmed; offline mode requires one complete, confined, digest-valid selected snapshot
      set.
- [ ] Existing EPIC-02, EPIC-03, and EPIC-04 profiles, outputs, CLI behavior, and tests remain
      compatible after staged-profile/source-protocol changes.
- [ ] Python extraction and TypeScript tests validate one authoritative rune wire shape; no second
      hand-maintained production schema or serialized lookup map is introduced.
- [ ] Catalog, manifest, QA JSON, section digests, source/disposition ordering, and finding IDs are
      byte-identical across repeated fixed-clock fixture and selected offline runs.
- [ ] Semantic changes alter the relevant section digest and catalog version; provenance-only or
      operational path/timestamp changes do not masquerade as semantic changes.
- [ ] The first production baseline review records counts, ID/family/rank coverage, dispositions,
      section/dependency digests, display states, icon decisions, and gate evidence.
- [ ] Required source IDs, page/revision/retrieval facts, field provenance, dependency digests, and
      artifact integrity checks are complete. Unknown copied material and digest/integrity failures
      remain non-waivable.
- [ ] No source-authored long prose, raw page body, source plan, snapshot manifest, QA body, review
      body, local path, icon byte, thumbnail, screenshot, secret, or unbounded evidence enters the
      runtime catalog.
- [ ] Exactly the catalog JSON, adjacent manifest JSON, and bounded QA JSON are promoted and
      allowlisted; representative byproducts remain ignored.
- [ ] Both `appConsumptionGate` and `publicReleaseGate` pass, with no open critical/error findings and
      every warning carrying a valid bounded disposition.
- [ ] Documentation explains exact paths and commands, source policy, runtime boundaries, replay
      limits, effect/stacking semantics, headgear separation, and handoffs to EPIC-13, EPIC-14,
      EPIC-15, EPIC-17, EPIC-20, and EPIC-21.
- [ ] `src/app/catalogs.ts`, editor behavior, local persistence/sharing, equipment UI, and full stat
      analysis remain unchanged.
- [ ] `npm run verify` passes after production promotion and documentation closeout.
- [ ] The final diff contains no unrelated implementation or generated artifacts, and no commit is
      created.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Modifier tables mix runes with unrelated equipment modifiers. | Silent over-inclusion or missing rune IDs. | Use the `Rune` inventory and EPIC-03-derived expected matrix as independent bounded cross-checks; account for every rune-like row and explicitly exclude containers. |
| The wiki's generic rune table and detail pages use different naming/shape conventions. | Duplicate records, failed joins, or unstable IDs. | Keep modifier ID as identity, resolve canonical page identity separately, preserve aliases only as reviewed lookup inputs, and block collisions. |
| Restoration naming collides with Restoration Magic. | Wrong family or attribute semantics. | Join full normalized identities to EPIC-03 and use controlled family kinds/IDs, never substrings. |
| A single stackable flag collapses composite semantics. | Duplicate attribute runes lose health penalties or double-apply ranks. | Store stacking per effect and prove the exact duplicate-rune cases in Python and TypeScript. |
| Free-form effect text is interpreted too aggressively. | Incorrect mechanics become runtime facts. | Normalize only supported structured shapes, require field provenance, and keep ambiguous cases note-only/unknown with review. |
| The narrow helper is mistaken for a full stat calculator. | Later consumers omit eligibility, headgear, or other modifiers. | Name and document its boundary, return unresolved/deferred facts, and exclude non-attribute aggregation and base totals. |
| Headgear `+1` is encoded as a rune effect. | Double counting when armor records arrive. | Store only an attribute-linked handoff classification; require an EPIC-13 armor fact before applying a bonus. |
| Source-protocol refactoring regresses the shipped skills pipeline. | EPIC-04 replay or generated bytes change unexpectedly. | Preserve thin skill wrappers, run existing golden tests, and abandon the refactor if byte equivalence cannot be proven at Phase 2. |
| Source drift exceeds caps or introduces new families. | Partial catalog or unreviewed scope expansion. | Stop at discover, record the diff, and require a sprint amendment before raising caps or adding sources. |
| Production snapshots are ignored. | Future exact replay may be unavailable on another machine. | Document retention limits and require either retained selected inputs or a fresh bounded live acquisition/review. Never pretend the manifest embeds raw inputs. |
| Optional icons are missing or ambiguous. | Incomplete future presentation. | Keep `iconId` nullable, emit stable warnings, and require review; do not download bytes or guess a file. |
| Semantic versioning includes audit noise or omits consumer data. | Needless cache churn or stale downstream behavior. | Define named semantic sections and mutation tests for every included/excluded field class. |
| First promotion has no prior production baseline. | Large coverage errors are hard to spot. | Require a named first-baseline review of counts, ID ranges/gaps, families/ranks, dispositions, section digests, and representative records. |
| Catalog work expands into equipment/UI/persistence work. | Cross-phase inconsistency and oversized sprint. | Treat current attachment IDs as interfaces only; defer legality, authoring, storage changes, icons, and total stats to their owning epics. |

## Security

- Live network access is manual-only, GET-only, and requires `--allow-live-network`. All requests use
  the existing pinned Guild Wars Wiki origin, redirect/final-origin checks, User-Agent, timeouts,
  retries, `Retry-After`/`maxlag` handling, batching, continuation limits, and byte/request caps.
- Source-derived URLs and page values are provenance data, not trusted fetch targets. The fetch stage
  derives requests only from the reviewed canonical source plan and rejects scheme, host, namespace,
  title, and digest drift.
- Wikitext, API JSON, redirect data, image metadata, selected manifests, dependency artifacts, and
  generated baselines are untrusted input. Validate types, finite safe integers, sizes, controlled
  vocabularies, counts, digests, and path confinement before use; never evaluate templates or HTML.
- Snapshot/source-plan/output paths must stay under explicit roots. Reject absolute child paths,
  `..` traversal, symlink escape, duplicate children, mixed roots, and manifest/artifact digest
  mismatch. Preserve atomic write and collision behavior from the ingestion platform.
- Offline and fixture tests must fail if a network path is reached. `npm run verify` must remain
  network-free and must not depend on current wiki availability.
- Terminal and QA output is bounded and sanitized. Do not print raw page bodies, arbitrary control
  characters, full untrusted URLs, local absolute paths, exception traces, or unbounded effect prose.
- Runtime JSON is inert data and is never rendered as HTML. Future UI must render display values as
  text and make remote icon loading/attribution a separate privacy-aware decision.
- Icon handling is metadata-only. No file bytes, thumbnails, screenshots, data URLs, or source media
  enter fixtures, generated runtime data, or the application bundle.
- Source-policy classification remains field-level. Unknown copied material cannot be accepted as
  risk; exclude it or obtain a future explicit ticket and named approval for the exact scope.
- Canonical SHA-256 digests provide integrity and reproducibility evidence, not authenticity. Manual
  review still verifies the source identity, source-set scope, dependency, and release decision.
- No new package or Python dependency is planned. Continue using the pinned parser environment and
  repository lockfile; any newly required dependency triggers a separate supply-chain review and
  plan amendment.

## Dependencies

### Required Inputs

- Completed EPIC-01 source-policy and QA contracts, especially field provenance, media restrictions,
  non-waivable findings, manual review, and exact-path promotion rules.
- Completed EPIC-02 ingestion platform: fixed-origin MediaWiki client, snapshot store,
  `mwparserfromhell` adapter, canonical artifact writer, metadata-only icons, QA reports, and
  fixture/offline/live orchestration.
- Promoted EPIC-03 files:
  `data/generated/epic-03/professions-attributes.catalog.json`, its adjacent manifest, and
  `data/qa/epic-03/professions-attributes.catalog.qa.json`, with verified digests and passing gates.
- Existing branded `RuneId` and `TemplateEquipmentModifierId`, `ArmorPiece.runeId`,
  `EffectiveAttributeRankAdjustment`, and `calculateEffectiveAttributeRank` contracts.
- Node.js 22.11.0 or newer, npm 11.10.1 or newer, Python 3, the repository lockfile, and the prepared
  `.venv-data` environment.

EPIC-04 skill data, the React app, the local library, and template codec are regression surfaces but
not semantic inputs to the rune catalog.

### Downstream Handoffs

- EPIC-13 consumes stable rune IDs and headgear interaction classifications while owning armor shell
  and inherent headgear facts.
- EPIC-14 consumes catalog eligibility/effects and the narrow attribute-rune summary while owning
  armor selection, one-rune-per-piece constraints, primary-profession legality, and UI feedback.
- EPIC-15 remains the owner of title identity/rank; rune effects must not encode title behavior.
- EPIC-17 may use `templateModifierId` for semantic equipment-template resolution while preserving
  unknown authored modifier IDs.
- EPIC-20 may build rune search/tooltips from the promoted catalog after attribution and remote-media
  privacy behavior are implemented.
- EPIC-21 owns full health/energy/condition/stat composition, conditional mechanics, and analysis of
  note-only effects.

## Open Questions

1. **Verified source shapes and final count:** Do the three seed pages expose all accepted armor
   runes and unique modifier IDs within the initial 160-detail-page ceiling? Resolve at the Phase 1/2
   source-shape gate. Missing coverage blocks or requires an amendment; it is not filled by guessing.
2. **Detail-page granularity:** Are rank variants separate canonical pages or sections of one family
   page? The source plan may represent many records pointing to one verified page, but it must not
   duplicate fetches or collapse record IDs. Lock this in the Phase 2 plan.
3. **Condition-rune duplicate semantics:** Which same-family duplicates are explicitly non-stacking,
   and which reductions compose separately only with other modifier sources? Model only the verified
   within-rune rule in Phase 4 and leave cross-system rounding/composition note-only for EPIC-21.
4. **Non-standard or historical armor runes:** If discovery finds a player-usable armor rune outside
   the expected attribute, Absorption, Vigor, Vitae, Attunement, and condition families, does it have
   a unique modifier ID and supported effect source? It requires an explicit family addition and
   review; otherwise disposition it and block completeness if it is currently player-usable.
5. **Headgear evidence shape:** Can one source-backed classification cover ordinary fixed-attribute
   headgear and rune-linked common/hero headgear without encoding armor behavior on the rune? If not,
   keep the rune field to `attribute-linked`/`not-applicable` and defer the finer distinction to
   EPIC-13 rather than expanding this catalog.
6. **Production replay availability:** Will execution retain a complete reviewed live snapshot set
   long enough to run and verify fixed-clock offline promotion? If not, BW-1005 and SPRINT-011 remain
   blocked; synthetic fixtures cannot be promoted as production data.
