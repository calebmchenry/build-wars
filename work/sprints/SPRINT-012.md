---
id: SPRINT-012
title: Insignias Catalog
status: done
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
updated: 2026-09-02
completed: 2026-09-02
---

# Sprint 012: Insignias Catalog

## Overview

This sprint turns `EPIC-11 Insignias` into a deterministic, runtime-eligible
Guild Wars armor-insignia catalog. It extends the completed source-policy and
profile-driven ingestion platform, uses the promoted EPIC-03
professions/attributes catalog for joins, models slot-scaled and conditional
insignia effects as framework-neutral data, and promotes exactly one catalog
JSON, one adjacent generated artifact manifest, and one bounded
machine-readable QA report.

The sprint is content and domain groundwork only. It does not add an equipment
editor, armor slot UI, local-library equipment persistence, share-url equipment
payloads, `src/app/catalogs.ts` insignia imports, remote icon fetching, armor
shell records, rune composition, semantic equipment-template resolution, guide
authoring, or full stat calculation. Existing `InsigniaId`, `ArmorSlot`, and
`ArmorPiece.insigniaId` remain downstream attachment boundaries for EPIC-13 and
EPIC-14.

The main planning decisions are binding unless implementation discovers a
source-shape blocker. Public `InsigniaId` remains schema-owned and distinct
from `TemplateEquipmentModifierId`; production v1 accepted player-usable
records require one unique active verified template-modifier crosswalk unless a
recorded sprint amendment changes that policy. Source authority is a bounded
hybrid, not a crawler. Slot-scaled arithmetic is stored as exact per-slot
outcomes, not prose or a universal multiplier. Conditional and combat-state
behavior is inert structured data only when source-clear; otherwise it remains
`note-only` or `unknown`.

Production promotion is required for completion. Fixture/offline work may land
usefully before live source access or review is available, but BW-1105,
BW-1106, EPIC-11, and SPRINT-012 stay incomplete or blocked until reviewed live
discovery, digest-confirmed fetch, one complete selected snapshot set, repeated
fixed-clock offline replay, exact-path allowlisting, passing QA gates, docs,
tickets, ledger, and result manifests all agree.

## Use Cases

1. **Offer legal insignia choices later**: EPIC-14 can list common and
   profession-specific insignias by armor profession, slot, mode facts, and
   restrictions without reading wiki pages or Python tooling.
2. **Resolve template modifiers later**: EPIC-17 can map decoded equipment
   modifier IDs to known insignia records through structured crosswalks while
   preserving unknown, ambiguous, or unsupported modifier outcomes.
3. **Display per-slot bonuses**: A future tooltip or equipment panel can show
   exact head, chest, hands, legs, and feet values for deterministic health,
   energy, armor, or damage effects without re-parsing prose.
4. **Preserve local armor behavior**: Later analysis can distinguish
   character-wide health/energy from armor-piece-local armor or incoming-damage
   effects.
5. **Explain conditional effects honestly**: Source-clear predicates can be
   displayed, while the current domain does not evaluate combat state.
6. **Avoid false totals**: Note-only, unknown, unresolved, non-stacking, and
   local-only effects remain visible and typed instead of being silently
   dropped or folded into unconditional totals.
7. **Audit and refresh data**: Maintainers can review a finite source-plan
   digest, fetch only confirmed pages and metadata, replay one complete
   snapshot set offline, and trace every promoted record/disposition to source
   and QA evidence.
8. **Preserve downstream ownership**: EPIC-13 owns armor shells/headgear,
   EPIC-14 owns equipment editing and legality, EPIC-20 owns search/tooltips,
   and EPIC-21 owns condition evaluation, hit-location behavior, and complete
   stat aggregation.

## Architecture

### Scope Boundary

| Area               | In Scope                                                                                                                                                                                                                                                                                           | Out Of Scope                                                                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain contracts   | `InsigniaCatalog`, generated record types, source-set summaries, dispositions, identity/crosswalk records, page identity, availability, restrictions, slot applicability, effect values, conditions, locality, combination, mode facts, metadata-only media refs, and narrow pure slot projection. | React, DOM/browser APIs, storage, app state, runtime fetches, generated manifest imports, QA report imports, source snapshots, data-script imports, legality engines, combat simulation, or full stat APIs.  |
| Ingestion          | EPIC-11 profile, source-shape checkpoint, source-plan digesting, bounded live discovery/fetch, selected offline replay, extraction, semantic normalization, QA, canonical artifact writing, and exact-path promotion.                                                                              | One-off insignia scraper, arbitrary source URLs, recursive crawl, browser automation, source-provided commands, live network in `npm run verify`, or runtime wiki access.                                    |
| Runtime data       | `data/generated/epic-11/insignias.catalog.json` with consumer-facing facts, compact source/provenance references, runtime-relevant dispositions, section digests, dependency summary, and metadata-only icon references.                                                                           | Raw page bodies, source plans, snapshot-set manifests, candidate outputs, QA summaries, full QA finding bodies, review scratch data, local paths, icon bytes, screenshots, thumbnails, or copied long prose. |
| Promotion evidence | Adjacent manifest and QA JSON containing artifact integrity, selected input digests, release gates, review records, bounded findings, and retention notes.                                                                                                                                         | App behavior, source fetching at runtime, broad generated-data exceptions, or hand-authored production JSON.                                                                                                 |
| Closeout           | README/data/script docs, compendium note, ticket linkage/status, sprint ledger, planning/execution manifests, and no-commit handoff.                                                                                                                                                               | Implementation commits or unrelated refactors.                                                                                                                                                               |

### Field-Level Source Authority

Phase 1 must approve a source-authority matrix before schema freeze. The
default authority is:

| Field                          | Preferred Evidence                                                                                | Conflict Outcome                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Candidate membership           | `Insignia` overview/index reconciled with `Equipment template format` insignia-like modifier rows | Unaccounted differences block source-plan approval.                                                                                        |
| Public identity                | Schema-owned immutable `InsigniaId` registry keyed by stable source/variant identity              | Source title or modifier changes never silently change public IDs. Rename, split, merge, or removal needs migration/tombstone review.      |
| Template modifier mapping      | `Equipment template format` plus corroborating detail or inventory evidence                       | Missing, duplicate, historical, mode-specific, or conflicting active mappings block promotion or require amendment.                        |
| Canonical page identity        | Verified detail page ID, revision ID, canonical title, redirect chain, and source timestamp       | Missing, cyclic, wrong-namespace, quest-shaped, disambiguated, or contradictory pages block or require explicit exclusion.                 |
| Common/profession availability | `Insignia` grouping and verified detail restrictions joined through EPIC-03                       | Common records require no profession restriction; profession-specific records require one exact EPIC-03 join. Conflicts block.             |
| Mode facts                     | Explicit approved PvE/PvP evidence                                                                | Unknown mode or mode-specific effect differences are typed; equipment-template presence alone does not prove both-mode behavior.           |
| Slot applicability/scaling     | Approved insignia mechanics and detail facts                                                      | Source `arms` normalizes once to domain `hands`; missing deterministic slot values block arithmetic claims.                                |
| Effects, locality, combination | Verified detail facts plus approved mechanics such as `Effect stacking` where applicable          | Item `Stackable` is not effect-combination evidence. Silence or conflict yields `unknown`, note-only, or blocker based on consumer impact. |
| Icon metadata                  | Verified image field plus MediaWiki `imageinfo` metadata                                          | Missing optional icons may be reviewed warnings; unsafe or source-policy-unclear media blocks media publication.                           |

Admitting additional source pages, raising caps, changing source families,
changing ID policy, widening effect semantics, adding dependencies, or
promoting without live/replay evidence requires a recorded sprint amendment.

### Identity And Crosswalk Policy

`InsigniaId` is the public runtime identity. It is schema-owned, opaque to
runtime consumers, never allocated from array order or API response order, and
never reused after first promotion. The first production baseline creates an
identity registry from reviewed source keys and variant keys; later refreshes
must preserve IDs across renames and redirects, create tombstones or
supersession records for removals, and require migration review for page
splits, merges, or variant reclassification.

Template modifiers are structured crosswalk facts, not public identity. The
runtime record stores a crosswalk list such as:

```text
InsigniaTemplateModifierCrosswalk
  templateModifierId: TemplateEquipmentModifierId
  status: active | historical | unsupported | ambiguous
  mode: pve | pvp | both | unknown
  scope: armor-prefix
  provenance: CatalogFieldProvenance
```

Production schema v1 requires exactly one active verified armor-prefix
template-modifier mapping per accepted player-usable insignia unless Phase 1
records an amendment. If the approved source graph cannot prove that mapping,
the affected candidate becomes a blocker or explicit disposition instead of
receiving a guessed ID or a quiet nullable mapping.

Same-page multi-variant records must use deterministic variant keys with
collision checks. Variant keys are part of source identity but are not public
IDs. Any collision, ambiguous variant boundary, or multi-record page without a
stable discriminator blocks source-plan approval.

### Data Flow

```text
promoted EPIC-03 catalog + manifest + passing QA
                          |
bounded EPIC-11 source-shape checkpoint
                          |
field-authority and identity policy approval
                          |
source plan digest and review
                          |
digest-confirmed seed/detail/icon metadata fetch
                          |
complete SourceSnapshotSetManifest
                          |
selected offline replay, no network
                          |
raw extraction and EPIC-03 joins
                          |
effect, slot, condition, locality, and crosswalk normalization
                          |
InsigniaCatalog semantic JSON
                          |
GeneratedArtifactManifest + bounded QaReport
                          |
first-baseline review and exact-path promotion
```

Fixture mode is synthetic and network-free. Live discovery/fetch is manual,
fixed-origin, and bounded. Offline replay rejects partial, missing, extra,
duplicate, edited, mixed-profile, plan-mismatched, dependency-mismatched,
path-escaping, and digest-mismatched inputs before extraction begins.

### Runtime Contract

The new contract extends `src/domain/catalog.ts` beside existing generated
skill and rune record contracts while preserving the lightweight `Insignia`
view:

```text
InsigniaCatalog
  schemaVersion: 1
  catalogVersion: semantic digest string
  sectionDigests: CatalogSectionDigest[]
  generatedAt: ISO timestamp
  generator: pinned generator identity
  profile: InsigniaCatalogProfile
  dependencyDigests: [EPIC-03 dependency summary]
  sourceSet: compact InsigniaSourceSetSummary
  dispositions: runtime-relevant InsigniaSourceSetDisposition[]
  insignias: CatalogInsigniaRecord[]
  remoteMedia: RemoteMediaMetadata[]

CatalogInsigniaRecord
  id: InsigniaId
  sourceKey: immutable reviewed source key
  variantKey: stable discriminator when one page yields multiple records
  name: canonical display name
  normalizedName: collision-safe lookup key
  wikiUrl: canonical HTTPS URL
  pageIdentity: requested/normalized/canonical title plus page/revision facts
  familyKey: schema-owned family key
  availability: common | profession-specific | unknown
  professionId: ProfessionId | null
  modeAvailability: both | pve-only | pvp-only | unknown
  applicableSlots: ArmorSlot[] in canonical order
  templateModifiers: InsigniaTemplateModifierCrosswalk[]
  effects: non-empty InsigniaEffect[]
  effectCompleteness: structured | mixed | note-only | unknown
  displayState: structured-only | reviewed-short-text | excluded
  iconId: string | null
  provenance: compact field provenance
```

The runtime catalog is intentionally leaner than the old audit-heavy
`ProfessionAttributeCatalog` shape. Full source plans, child snapshot paths,
manual approval bodies, QA finding evidence, release gates, raw fields, and
local paths belong in the manifest or QA report, not the runtime JSON.

### Effects And Slot Projection

Every numeric effect normalizes to tagged per-slot outcomes. A slot outcome is
one of `value`, `not-applicable`, or `unresolved`; `null` is not overloaded.
Fixed values may be represented internally during extraction, but the runtime
consumer projection must expose one canonical outcome for each of `head`,
`chest`, `hands`, `legs`, and `feet`.

Each structured effect keeps these independent dimensions:

- value outcomes with amount, unit, sign convention, precision, and provenance;
- application scope: `character`, `armor-piece-local`, `event-local`, or
  `unknown`;
- condition: `always`, a closed source-backed predicate object, or a reviewed
  deferred condition;
- combination: `sum`, `highest`, `non-stacking`, `local-only`, `separate`, or
  `unknown`, with stable group keys where comparison is meaningful;
- mode applicability for same/different PvE and PvP behavior.

Minimum v1 effect kinds:

| Effect Kind             | V1 Treatment                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `maximum-health-delta`  | Character-scoped health values. Survivor-style slot scaling must be source-backed and projected per slot. |
| `maximum-energy-delta`  | Character-scoped energy values. Radiant-style slot scaling must be source-backed and projected per slot.  |
| `armor-rating-delta`    | Armor-piece-local armor facts with damage filters and conditions where supported.                         |
| `incoming-damage-delta` | Event-local incoming-damage facts with damage scope, unit, and condition.                                 |
| `duration-delta`        | Duration percentage/seconds only where subject and scope are source-clear.                                |
| `outgoing-damage-delta` | Source-clear outgoing-damage modifiers, separate from armor and condition facts.                          |
| `note-only`             | Bounded reviewed Build Wars-authored note; no arithmetic.                                                 |
| `unknown`               | Accepted identity with unsupported or unresolved behavior; no arithmetic.                                 |

Source-clear slot examples must be confirmed or amended during Phase 1/2
discovery. Expected fixture checks include Survivor `5/15/5/10/5`, Radiant
`1/3/1/2/1`, and Tormentor's incoming holy damage `2/6/2/4/2` across
head/chest/hands/legs/feet. These are exemplar assertions, not a universal
multiplier.

Add `resolveInsigniaEffectsForArmorSlot(record, slot)` only as a narrow pure
helper. It accepts one `CatalogInsigniaRecord` and one `ArmorSlot`, returns
slot-resolved effects plus note-only/unknown facts and typed unresolved
reasons, and does not choose armor, validate profession/mode legality, evaluate
conditions, combine records, apply rune/title/weapon effects, use hit-location
probabilities, calculate totals, read files, fetch data, or mutate inputs.

### Source Protocol And Retention

The profile ID is `epic-11-insignias`. Initial caps are three seed pages, 72
total article pages, 64 detail titles, 64 media titles, 48 requests, three
retries, ten continuation pages, 5 MiB response cap, 750 KiB parser cap, 10 MiB
aggregate cap, 2 MiB catalog cap, and 1 MiB QA cap. Phase 1 may tighten caps;
raising them requires amendment.

`discover` fetches only fixed seed pages, verifies EPIC-03 dependency state,
reconciles candidate inventories, writes an ignored source plan, prints a
bounded summary, and stops. `fetch` requires `--allow-live-network`, exact
`--source-plan`, and exact `--confirm-source-set-digest`; it revalidates plan,
caps, source drift, dependency identity, and fetches only planned detail pages
and metadata-only icons. `offline` requires one complete selected snapshot-set
manifest and performs no network access.

If EPIC-11 would otherwise duplicate security-sensitive replay validation, add
a small `source_set_protocol.py` for profile-neutral plan hashing, digest
confirmation, and confined complete snapshot-set validation. Do not migrate
EPIC-04 or EPIC-10 to that helper in this sprint; use regression tests to prove
their behavior and bytes are unchanged.

Because source snapshots remain ignored, promotion must record a retention
decision. If selected source evidence is retained only in the local ignored
worktree, docs must state that future exact reproduction requires the retained
local snapshot set or a fresh bounded live acquisition and review. The sprint
must not claim stronger long-term reproducibility than the retained evidence
supports.

### Alternatives Considered

- **Use template modifier IDs as public IDs**: rejected. They are required
  crosswalk evidence for production v1, but public identity stays schema-owned
  to survive source/title/modifier churn.
- **Allow nullable production crosswalks quietly**: rejected. Missing active
  player-usable modifier identity blocks or requires amendment.
- **Use only an overview page or only modifier rows**: rejected. Source facts
  differ by field and must be reconciled.
- **Use category crawl or arbitrary link expansion**: rejected for v1 because
  it is not digest-reviewable enough for promotion.
- **Use formula-only slot scaling**: rejected. Runtime consumers get exact
  source-backed per-slot outcomes.
- **Use record-level `stackable`**: rejected. Item stacking, effect
  combination, locality, and later aggregation are distinct.
- **Build a condition evaluator or stat calculator**: deferred to EPIC-21.
- **Import insignias into the app now**: deferred to later equipment/search
  epics after attribution and UI behavior are planned.
- **Hand-author production JSON**: rejected. Production artifacts must be
  generated from reviewed source inputs.

## Implementation

### Phase 1: BW-1101 Contracts, Source Shape, And Profile (~15% of effort)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/insignia-effects.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/insignia-catalog.test.ts`
- `test/domain/insignia-effects.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `work/tickets/11-insignias/BW-1101-insignia-catalog-contracts-and-profile.md`

**Tasks:**

- [x] Mark EPIC-11 and BW-1101 in progress when implementation starts.
- [x] Run a bounded source-shape checkpoint against the proposed seeds and
      representative detail pages for common, profession-specific, fixed,
      slot-scaled, conditional, same-page, redirect, mode-specific, and icon
      cases.
- [x] Approve or amend the field-level source authority, conflict precedence,
      caps, identity/crosswalk policy, source-key and variant-key rules, and
      non-waivable blockers before schema freeze.
- [x] Define schema-v1 `InsigniaCatalog`, generated record, profile,
      dependency, source-set, disposition, page identity, identity registry,
      crosswalk, availability, mode, slot, effect, tagged slot-outcome,
      condition, locality, combination, completeness, display, and unresolved
      contracts.
- [x] Reuse `InsigniaId`, `TemplateEquipmentModifierId`, `ProfessionId`,
      `AttributeId`, and `ArmorSlot`. Do not modify `src/domain/ids.ts` or
      `src/domain/equipment.ts` unless the checkpoint proves a concrete
      contract deficiency.
- [x] Add lookup contracts only for catalog ID, normalized name, and structured
      template-modifier crosswalk outcomes.
- [x] Register `epic-11-insignias` with fixture/offline/live modes, initial
      caps, exact output paths, EPIC-03 dependency, and metadata-only icon
      policy.
- [x] Preserve existing EPIC-02, EPIC-03, EPIC-04, and EPIC-10 profile choices,
      default fixture behavior, exit codes, and network-free verification.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/insignia-catalog.test.ts test/domain/insignia-effects.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`

### Phase 2: BW-1102 Source Set, Identity Registry, And Fixtures (~18% of effort)

**Files:**

- `scripts/data/build_wars_ingest/source_set_protocol.py`
- `scripts/data/build_wars_ingest/insignia_source_set.py`
- `scripts/data/build_wars_ingest/insignia_identity.py`
- `scripts/data/build_wars_ingest/insignia_identity_registry.json`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/tests/test_source_set_protocol.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_identity.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/insignias/`
- `work/tickets/11-insignias/BW-1102-insignia-source-set-and-page-resolution.md`

**Tasks:**

- [x] Mark BW-1102 in progress only after Phase 1 passes.
- [x] Build source-plan records from independent modifier-row, overview/index,
      detail-page, mode, mechanics, and icon projections.
- [x] Give every candidate one terminal state: accepted insignia, supported
      relationship, explicit non-insignia/non-player exclusion, unsupported
      disposition, or blocking finding.
- [x] Implement identity registry allocation, non-reuse, tombstone,
      supersession, rename, split, merge, variant-key, and collision rules.
- [x] Require production v1 accepted records to have one unique active verified
      `TemplateEquipmentModifierId` crosswalk unless an amendment changes the
      policy.
- [x] Preserve requested, normalized, redirected, canonical, page ID, revision
      ID, source timestamp, retrieval timestamp, source family, source order,
      and dependency facts.
- [x] Detect duplicate IDs, duplicate source keys, duplicate normalized names,
      duplicate canonical pages, conflicting source facts, unsupported
      families, missing restrictions, missing deterministic slot evidence,
      malformed rows, source drift, and unexpected source shapes.
- [x] Implement discover-only output with profile, caps, seed digests,
      dependency digest, authority-policy version, candidate counts, family and
      profession counts, dispositions, planned detail/media titles,
      `sourceSetDigest`, and `sourcePlanDigest`.
- [x] Implement digest-confirmed fetch and complete snapshot-set writing with
      plan/dependency/cap/source-drift validation.
- [x] Add minimized synthetic fixtures covering common/profession-specific
      insignias, all slots, fixed and per-slot values, structured and deferred
      conditions, same-page variants, redirects, parenthetical profession
      suffixes, mode differences, missing icons, duplicate names/IDs,
      malformed effect text, unsupported pages, ambiguous source shapes, and
      copied-text risk.
- [x] Keep fixtures synthetic and bounded. Store no live page bodies, icon
      bytes, thumbnails, screenshots, or copied long prose in committed
      fixtures.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_source_set_protocol build_wars_ingest.tests.test_insignia_source_set build_wars_ingest.tests.test_insignia_identity build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_source_set build_wars_ingest.tests.test_rune_source_set build_wars_ingest.tests.test_skill_catalog build_wars_ingest.tests.test_rune_catalog`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-11-insignias --root work/runs/data-ingestion/epic-11-fixture-a --fixture-root test/fixtures/data-ingestion`

### Phase 3: BW-1103 Extraction And Joins (~17% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_extractor.py`
- `scripts/data/build_wars_ingest/insignia_source_set.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/insignias/`
- `work/tickets/11-insignias/BW-1103-insignia-extractors.md`

**Tasks:**

- [x] Mark BW-1103 in progress only after Phase 2 passes.
- [x] Parse verified snapshots with `mwparserfromhell` and bounded table/list
      helpers. Extractors consume snapshots, not live clients.
- [x] Produce deterministic raw records with source key, variant key, registry
      ID, modifier crosswalk evidence, names, aliases, availability,
      profession label, mode evidence, slot terms, raw effect fields, raw
      slot-scaling evidence, page identity, icon candidate, and field-level
      provenance.
- [x] Support same-page multi-variant extraction without duplicate page fetches,
      ID collapse, or provenance loss.
- [x] Join profession and attribute references through the promoted EPIC-03
      catalog and dependency digests.
- [x] Normalize source `arms`, `gloves`, or equivalent approved terms to domain
      `hands` at one documented extraction boundary.
- [x] Separate item `Stackable` extraction from effect-combination evidence and
      assert that item stackability cannot populate runtime combination fields.
- [x] Reject or disposition cycles, ambiguous canonical targets, wrong content
      types, quest/disambiguation pages, conflicting redirects, impossible slot
      names, contradictory restrictions, invalid mode states, malformed effect
      rows, unsafe units, non-finite values, overflow, and unsupported condition
      syntax.
- [x] Resolve icons through metadata-only `imageinfo`; keep `iconId` nullable
      and never fetch or retain media bytes.
- [x] Sort raw records and dispositions by stable registry/source keys
      regardless of request order, page order, batch order, filesystem order,
      or concurrent completion.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_extractor build_wars_ingest.tests.test_icons`
- `npm run test:run -- test/domain/insignia-catalog.test.ts`
- `npm run data:test`

### Phase 4: BW-1104 Semantics, Slot Scaling, And Pure Helper (~22% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_semantics.py`
- `scripts/data/build_wars_ingest/insignia_extractor.py`
- `scripts/data/build_wars_ingest/insignia_catalog.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_semantics.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_catalog.py`
- `src/domain/insignia-effects.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/insignia-catalog.test.ts`
- `test/domain/insignia-effects.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json`
- `work/tickets/11-insignias/BW-1104-insignia-effect-semantics-and-slot-scaling.md`

**Tasks:**

- [x] Mark BW-1104 in progress only after Phase 3 passes.
- [x] Implement table-driven semantic normalization for health, energy, armor
      rating, incoming damage, duration, outgoing damage, note-only, and
      unknown effects.
- [x] Convert fixed and source-backed slot-scaled values into one canonical
      tagged per-slot projection for every numeric effect.
- [x] Validate slot coverage, safe integers or approved decimal precision, sign,
      unit, application scope, mode applicability, condition linkage,
      combination group keys, and provenance.
- [x] Freeze a closed predicate vocabulary from the source census. Store only
      inert controlled operands, comparators, counts, damage/effect kinds, and
      EPIC-03 IDs; unsupported expressions become deferred conditions or
      unknown effects.
- [x] Encode source-clear tiered effects as multiple thresholded effects and
      source-clear compound penalties as separate effects.
- [x] Preserve armor-piece-local and event-local effects. Do not sum local
      armor/damage facts into character totals or apply hit-location
      probabilities.
- [x] Give every accepted record a non-empty effect list and accurate
      completeness state. Failed source-clear arithmetic, incomplete required
      slot maps, missing required restrictions, or false locality claims block
      promotion until resolved or the numeric claim is removed.
- [x] Implement `resolveInsigniaEffectsForArmorSlot(record, slot)` only within
      the narrow projection boundary described above.
- [x] Add TypeScript and Python fixtures for all five slots, fixed values,
      negative values, local armor, structured/deferred conditions, tiers,
      common/profession restrictions, mode-limited effects, note-only/unknown
      effects, missing slot keys, non-finite values, malformed conditions,
      unsupported kinds, inapplicable slots, and unchanged input objects.
- [x] Prove expected slot maps for Survivor, Radiant, and Tormentor-style
      examples, or replace those expectations with source-reviewed fixtures
      during Phase 1/2 if source evidence differs.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/insignia-catalog.test.ts test/domain/insignia-effects.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_semantics build_wars_ingest.tests.test_insignia_catalog`

### Phase 5: BW-1105 Assembly, QA, Review, And Exact-Path Promotion (~18% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_catalog.py`
- `scripts/data/build_wars_ingest/insignia_semantics.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/domain/insignia-catalog.test.ts`
- `test/domain/insignia-effects.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json`
- `.gitignore`
- `data/generated/epic-11/insignias.catalog.json`
- `data/generated/epic-11/insignias.catalog.manifest.json`
- `data/qa/epic-11/insignias.catalog.qa.json`
- `work/tickets/11-insignias/BW-1105-insignia-catalog-qa-and-promotion.md`

**Tasks:**

- [x] Mark BW-1105 in progress only after source-set, extraction, and semantic
      gates pass.
- [x] Assemble canonical sections with dependency facts, source-set summary,
      compact dispositions, identity registry facts, crosswalks, insignia
      records, effects, conditions, remote media, provenance, section digests,
      and semantic catalog version.
- [x] Define semantic digest inputs: consumer-visible identity, names, lookup
      keys, availability, restrictions, mode facts, slot applicability,
      template crosswalks, effects, slot outcomes, conditions, locality,
      combination, display fields, runtime media, runtime-relevant
      dispositions, and EPIC-03 dependency facts.
- [x] Exclude generatedAt, version value, local paths, manifest paths, QA paths,
      retrieval-only timestamps, raw snapshots, full QA bodies, review bodies,
      source plans, and ignored evidence from semantic digest inputs.
- [x] Add QA for source accounting, zero-output rejection, ID non-reuse,
      source-key uniqueness, variant-key collisions, normalized-name
      collisions, template crosswalk conflicts, referential integrity, page
      resolution, EPIC-03 joins, availability, restrictions, mode-specific
      effects, slot applicability, slot scaling, effect completeness, condition
      operands, locality, combination rules/group keys, item-stackable
      separation, copied-text policy, icon metadata, output caps, section
      digests, semantic digest scope, baseline diffs, and artifact integrity.
- [x] Keep stable finding IDs independent of request order, absolute paths, and
      wall-clock time. QA overflow or material truncation is blocking.
- [x] Generate the synthetic EPIC-11 fixture twice into separate ignored roots
      under a fixed clock and prove byte identity for catalog, manifest, QA
      JSON, section digests, source/disposition/effect order, and finding IDs.
- [x] Run bounded live `discover`; review source identities, current counts and
      ID ranges, grouping, same-page variants, profession/mode coverage,
      condition vocabulary, slot-map families, caps, dependency facts, and the
      source-set digest before fetch.
- [x] Run digest-confirmed `fetch` only with reviewed source plan and exact
      digest, retain or document the selected evidence set, then replay the
      complete snapshot set offline twice under a fixed clock.
- [x] Perform first-baseline review with counts, ID gaps, registry/tombstones,
      crosswalks, group/profession/mode coverage, dispositions, slot families,
      completeness states, representative conditions/local effects, icon
      decisions, section/dependency digests, artifact digest, QA digest, and
      both gate results.
- [x] Generate approved production bytes only from selected offline inputs.
      Never hand-edit promoted catalog, manifest, or QA JSON.
- [x] Add exact `.gitignore` parent and file exceptions only for the three
      EPIC-11 artifacts, then verify representative source plans, snapshot
      sets, raw snapshots, candidates, QA summaries, logs, media bytes, and
      arbitrary siblings remain ignored or absent.
- [x] Mark BW-1105 done only after all exact files exist, both release gates
      pass, every warning has a bounded disposition, and evidence is recorded.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-11-insignias --root work/runs/data-ingestion/epic-11-fixture-a --fixture-root test/fixtures/data-ingestion`
- Repeat fixture generation into `work/runs/data-ingestion/epic-11-fixture-b`
  with the same fixed clock and compare catalog, manifest, and QA JSON
  byte-for-byte.
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-11-insignias --root work/runs/data-ingestion/epic-11-live --allow-live-network --stage discover`
- Run `fetch` with the reviewed `--source-plan` and exact
  `--confirm-source-set-digest`, then run
  `offline --profile epic-11-insignias --snapshot-set <selected-manifest>` twice
  under a fixed clock.
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_catalog build_wars_ingest.tests.test_artifacts build_wars_ingest.tests.test_qa build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `npm run test:run -- test/domain/data-ingestion-contracts.test.ts test/domain/insignia-catalog.test.ts test/domain/insignia-effects.test.ts`
- `git check-ignore -v data/generated/epic-11/insignias.catalog.json data/generated/epic-11/insignias.catalog.manifest.json data/qa/epic-11/insignias.catalog.qa.json`
- `git status --short`

### Phase 6: BW-1106 Documentation, Verification, And Closeout (~10% of effort)

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
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-012-result.json`

**Tasks:**

- [x] Mark BW-1106 in progress only after Phase 5 promotion passes.
- [x] Document source authority, final caps, source-shape results, identity and
      crosswalk policy, profile modes, digest-confirmed refresh, selected
      offline replay, retention limits, artifact schema, effect/condition
      vocabulary, slot outcomes, semantic digests, QA gates, first-baseline
      review, and exact paths.
- [x] State that only `data/generated/epic-11/insignias.catalog.json` is
      runtime-eligible. Manifests, QA reports, source plans, snapshot sets, raw
      snapshots, QA summaries, review evidence, Python tooling, and media bytes
      remain non-runtime.
- [x] Document metadata-only icons and the attribution/privacy work a later UI
      must complete before rendering remote media.
- [x] Document EPIC-13/14 handoffs: use `ArmorPiece.insigniaId` and
      `ArmorPiece.slot`, validate armor-shell and primary-profession legality,
      resolve per-slot facts, preserve unknowns, and never treat note-only
      conditions as satisfied.
- [x] Document EPIC-17/20/21 handoffs for template modifier resolution,
      search/tooltips, condition evaluation, local armor/hit-location
      semantics, rune/insignia composition, and full stat aggregation.
- [x] Confirm current editor, local persistence, sharing, backup/restore,
      template compatibility, EPIC-03/04/10 catalogs, and app import boundaries
      are unchanged.
- [x] Inspect the worktree for raw snapshots, source plans, snapshot-set
      manifests, candidate outputs, QA summaries, media bytes, screenshots,
      copied prose, broad allowlists, secrets, absolute machine paths,
      nondeterministic timestamps, and unrelated changes.
- [x] Add verification and artifact evidence to BW-1101 through BW-1106. Mark
      tickets done only after phase gates pass. Mark EPIC-11, SPRINT-012, and
      ledger completed together only after the full Definition of Done passes.
- [x] Write the ticket-burn execution result manifest with matching sprint,
      epic, ticket IDs, changed-file summary, validation results, blockers,
      followups, and `commit_created: false`.
- [x] Do not create a commit.

**Verification:**

- `npm run data:regenerate`
- Direct EPIC-11 fixed-clock fixture regeneration
- `npm run verify`
- `rg -n 'EPIC-11|BW-110[1-6]|SPRINT-012' work/tickets/11-insignias work/sprints`
- `git status --short`
- Manual consistency review across docs, generated files, QA state, tickets,
  sprint, ledger, and result manifests

## Files Summary

| File                                                                            | Action                  | Purpose                                                                                                                                                                         |
| ------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/catalog.ts`                                                         | Modify                  | Add insignia catalog, generated record, source-set, dependency, identity, crosswalk, availability, slot, effect, condition, locality, combination, mode, and display contracts. |
| `src/domain/catalog-lookup.ts`                                                  | Modify                  | Add collision-safe insignia lookup outcomes by ID, normalized name, and structured template-modifier crosswalk.                                                                 |
| `src/domain/insignia-effects.ts`                                                | Create                  | Resolve one insignia record for one armor slot without legality, condition evaluation, aggregation, or totals.                                                                  |
| `src/domain/index.ts`                                                           | Modify                  | Export insignia contracts and helper APIs.                                                                                                                                      |
| `src/domain/ids.ts`                                                             | Reference only          | Reuse existing `InsigniaId` and `TemplateEquipmentModifierId`; avoid ID churn unless Phase 1 proves a gap.                                                                      |
| `src/domain/equipment.ts`                                                       | Reference only          | Reuse `ArmorSlot` and `ArmorPiece.insigniaId`; no equipment schema/UI expansion.                                                                                                |
| `src/app/catalogs.ts`                                                           | Reference only          | Preserve current runtime import boundary; do not import EPIC-11 data in this sprint.                                                                                            |
| `scripts/data/build_wars_ingest/config.py`                                      | Modify                  | Add EPIC-11 caps.                                                                                                                                                               |
| `scripts/data/build_wars_ingest/profiles.py`                                    | Modify                  | Register `epic-11-insignias`, fixed seeds, paths, caps, dependency, and mode support.                                                                                           |
| `scripts/data/build_wars_ingest/source_set_protocol.py`                         | Create if justified     | Share new-profile plan/replay safety primitives without migrating EPIC-04/10.                                                                                                   |
| `scripts/data/build_wars_ingest/insignia_identity.py`                           | Create                  | Own identity registry allocation, tombstones, migration checks, and crosswalk validation.                                                                                       |
| `scripts/data/build_wars_ingest/insignia_identity_registry.json`                | Create                  | Persist reviewed public ID/source-key/variant-key registry and tombstones.                                                                                                      |
| `scripts/data/build_wars_ingest/insignia_source_set.py`                         | Create                  | Reconcile source authority, write source plans, resolve pages, and validate snapshot sets.                                                                                      |
| `scripts/data/build_wars_ingest/insignia_extractor.py`                          | Create                  | Parse identity, restrictions, slots, raw effects, mode facts, page facts, and metadata-only icons.                                                                              |
| `scripts/data/build_wars_ingest/insignia_semantics.py`                          | Create                  | Normalize effects, per-slot outcomes, conditions, locality, combination, modes, notes, and unknowns.                                                                            |
| `scripts/data/build_wars_ingest/insignia_catalog.py`                            | Create                  | Assemble canonical catalog, semantic digest, section digests, QA diagnostics, and review records.                                                                               |
| `scripts/data/build_wars_ingest/models.py`                                      | Modify narrowly         | Add shared staged-source or identity types only where existing wire contracts are insufficient.                                                                                 |
| `scripts/data/build_wars_ingest/snapshots.py`                                   | Modify only if needed   | Reuse confined snapshot loading/writing without changing existing profile behavior.                                                                                             |
| `scripts/data/build_wars_ingest/icons.py`                                       | Modify narrowly         | Reuse metadata-only icon resolution for insignia records.                                                                                                                       |
| `scripts/data/build_wars_ingest/artifacts.py`                                   | Modify                  | Support EPIC-11 semantic projection, first-baseline evidence, and diff classification.                                                                                          |
| `scripts/data/build_wars_ingest/qa.py`                                          | Modify                  | Add bounded insignia coverage, policy, semantics, dependency, gate, and integrity findings.                                                                                     |
| `scripts/data/build_wars_ingest/pipeline.py`                                    | Modify                  | Orchestrate EPIC-11 fixture, discover, fetch, selected offline replay, and promotion.                                                                                           |
| `scripts/data/build_wars_ingest/cli.py`                                         | Modify                  | Expose EPIC-11 profile/stage/confirmation/snapshot-set options safely.                                                                                                          |
| `scripts/data/build_wars_ingest/tests/`                                         | Create/modify           | Cover protocol safety, profile compatibility, planning, identity, extraction, semantics, assembly, QA, determinism, and CLI behavior.                                           |
| `test/domain/contracts.test.ts`                                                 | Modify                  | Protect lightweight contracts and new insignia wire distinctions.                                                                                                               |
| `test/domain/insignia-catalog.test.ts`                                          | Create                  | Verify catalog shape, identity, crosswalks, restrictions, slots, effects, lookups, collisions, and digest rules.                                                                |
| `test/domain/insignia-effects.test.ts`                                          | Create                  | Verify per-slot projection, tagged outcomes, note/unknown preservation, and malformed-record handling.                                                                          |
| `test/domain/data-ingestion-contracts.test.ts`                                  | Modify                  | Validate Python-generated EPIC-11 JSON against TypeScript expectations.                                                                                                         |
| `test/fixtures/data-ingestion/insignias/`                                       | Create                  | Store minimized synthetic source, redirect, condition, malformed, and icon metadata fixtures.                                                                                   |
| `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json`         | Create                  | Store deterministic synthetic golden insignia catalog.                                                                                                                          |
| `data/generated/epic-11/insignias.catalog.json`                                 | Create/allowlist        | Promote the only runtime-eligible EPIC-11 artifact.                                                                                                                             |
| `data/generated/epic-11/insignias.catalog.manifest.json`                        | Create/allowlist        | Promote selected-input, dependency, digest, retention, and review evidence.                                                                                                     |
| `data/qa/epic-11/insignias.catalog.qa.json`                                     | Create/allowlist        | Promote bounded QA findings and release-gate evidence.                                                                                                                          |
| `.gitignore`                                                                    | Modify narrowly         | Allowlist only the EPIC-11 parent directories and exact three approved files.                                                                                                   |
| `README.md`                                                                     | Modify                  | Document the new catalog boundary, commands, and unchanged app scope.                                                                                                           |
| `scripts/data/README.md`                                                        | Modify                  | Document EPIC-11 sources, caps, staged commands, replay protocol, and troubleshooting.                                                                                          |
| `data/README.md`                                                                | Modify                  | Add EPIC-11 lifecycle, runtime boundary, and retained/ignored artifact rules.                                                                                                   |
| `data/generated/README.md`                                                      | Modify                  | Document exact catalog/manifest promotion and determinism.                                                                                                                      |
| `data/qa/README.md`                                                             | Modify                  | Document exact QA report, gate/disposition policy, and non-runtime boundary.                                                                                                    |
| `compendium/data-ingestion-platform.md`                                         | Modify                  | Record EPIC-11 profile, replay behavior, and source-protocol limits.                                                                                                            |
| `compendium/insignias-catalog.md`                                               | Create                  | Preserve identity, source authority, slot/effect semantics, review evidence, and downstream handoffs.                                                                           |
| `compendium/README.md`                                                          | Modify                  | Index the insignias catalog note.                                                                                                                                               |
| `work/tickets/11-insignias/*.md`                                                | Modify                  | Track sprint linkage, status, assumptions, and closeout evidence.                                                                                                               |
| `work/sprints/SPRINT-012.md`                                                    | Create/update           | Executable sprint plan and later execution checklist state.                                                                                                                     |
| `work/sprints/ledger.tsv`                                                       | Modify                  | Track sprint lifecycle.                                                                                                                                                         |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-11-result.json`       | Create during planning  | Required ticket-burn planning manifest.                                                                                                                                         |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-012-result.json` | Create during execution | Required ticket-burn execution manifest.                                                                                                                                        |

## Definition of Done

### Source And Identity

- [x] The field-level source authority and conflict-precedence matrix is
      approved before schema freeze.
- [x] Every source candidate becomes an accepted record, supported
      relationship, explicit exclusion, unsupported disposition, or blocking
      finding.
- [x] Stable `InsigniaId` assignment is registry-backed, source-order
      independent, collision checked, non-reused, and guarded by rename,
      tombstone, split, merge, supersession, and migration rules.
- [x] Every production v1 accepted player-usable insignia has one unique active
      verified armor-prefix template-modifier crosswalk, or promotion blocks
      pending amendment.
- [x] Same-page multi-variant records have stable variant keys and collision
      QA.
- [x] Source drift in counts, modifier ranges, groups, restrictions, modes,
      redirects, page identity, icon facts, or condition/effect phrasing stops
      at discovery or review, not after promotion.

### Runtime Contract

- [x] `InsigniaCatalog` is framework-neutral, JSON-compatible,
      schema-versioned, and exported through `src/domain`.
- [x] `src/domain` imports no React, DOM/browser APIs, storage, network,
      filesystem, app modules, generated manifests, QA reports, source
      snapshots, or Python modules.
- [x] Runtime records include stable ID, source key, variant key, name,
      normalized key, wiki URL, page identity, family, availability, profession
      restriction, mode facts, applicable slots, structured crosswalks,
      non-empty effects, completeness/display states, nullable icon ID, and
      compact provenance.
- [x] Runtime JSON excludes raw page bodies, source plans, snapshot-set
      manifests, local paths, full QA bodies, review bodies, copied long prose,
      MediaWiki HTML, icon bytes, screenshots, thumbnails, and source-provided
      commands.

### Effects And Projection

- [x] Health, energy, armor, incoming damage, duration, outgoing damage,
      note-only, and unknown effects are distinct typed states.
- [x] Every numeric effect exposes tagged per-slot outcomes for head, chest,
      hands, legs, and feet, distinguishing value, not-applicable, and
      unresolved.
- [x] Survivor, Radiant, Tormentor-style, fixed-value, conditional, local,
      tiered, compound, negative, mode-specific, note-only, unknown, malformed,
      and inapplicable-slot fixtures are covered.
- [x] Source-clear deterministic arithmetic is never synthesized from a generic
      multiplier, prose-only rule, unknown value, or item `Stackable` field.
- [x] Condition predicates are inert controlled data attached to effects; no
      condition evaluator or expression language is introduced.
- [x] The slot helper, if added, resolves one record for one slot and does not
      validate legality, evaluate conditions, aggregate pieces, compose runes,
      or calculate totals.

### Determinism, QA, And Promotion

- [x] Fixture mode is synthetic and network-free.
- [x] Live fetch requires `--allow-live-network`, registered
      `epic-11-insignias`, exact source-plan path, exact source-set digest, and
      fixed Guild Wars Wiki API origin.
- [x] Offline replay requires one complete EPIC-11 snapshot-set manifest and
      rejects unsafe, incomplete, duplicate, mixed, plan-mismatched,
      dependency-mismatched, path-escaping, or digest-mismatched inputs.
- [x] Catalog, manifest, QA JSON, section digests, semantic digest,
      source/disposition/effect ordering, registry output, and finding IDs are
      byte-identical across repeated fixed-clock fixture and selected offline
      runs.
- [x] Semantic digest inputs and audit-only exclusions are documented and
      mutation-tested.
- [x] QA covers source accounting, zero-output rejection, ID/crosswalk
      integrity, page resolution, EPIC-03 joins, restrictions, modes, slots,
      effects, conditions, locality, combination, copied text, media metadata,
      caps, baselines, gate predicates, and artifact integrity.
- [x] QA overflow, silent truncation, unresolved core identity, failed
      source-clear deterministic values, unknown copied material, unsafe paths,
      incomplete replay, and digest/integrity mismatch are release-blocking.
- [x] Both `appConsumptionGate` and `publicReleaseGate` are `pass`.
- [x] Only the exact EPIC-11 catalog, manifest, and QA JSON paths are
      allowlisted; representative raw/candidate/byproduct paths remain ignored.

### Closeout

- [x] Documentation explains source authority, exact paths/commands, runtime
      boundaries, identity/crosswalk policy, per-slot values, locality,
      combination, conditions, modes, media policy, retention limits, QA gates,
      and downstream handoffs.
- [x] `src/app/catalogs.ts`, editor behavior, local persistence/sharing,
      template compatibility, EPIC-03/04/10 promoted artifacts, rune behavior,
      equipment UI, and full stat analysis remain unchanged.
- [x] BW-1101 through BW-1106, EPIC-11, SPRINT-012, ledger, and result
      manifests are status-consistent.
- [x] `npm run verify` passes without live network access.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                                                                 | Likelihood | Impact | Mitigation                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| Source authority is incomplete, inconsistent, or too broad.                          | High       | High   | Make source-shape proof and field-authority approval the first gate; require amendment before broadening.             |
| Template modifier evidence is incomplete or conflicting.                             | Medium     | High   | Keep public IDs schema-owned, require structured crosswalk QA, and block production v1 unless the policy is amended.  |
| Stable identity breaks on page rename, split, merge, removal, or same-page variants. | Medium     | High   | Use reviewed registry/source/variant keys, non-reuse, tombstones, supersession, and migration checks.                 |
| Slot scaling is over-inferred.                                                       | Medium     | High   | Generate tagged exact per-slot outcomes and block missing deterministic values.                                       |
| Conditional behavior becomes unsafe arithmetic.                                      | High       | High   | Use closed inert predicates, note-only/unknown states, and no evaluator.                                              |
| Item `Stackable` is misread as effect combination.                                   | Medium     | High   | Keep it separate from effect combination and require approved mechanics evidence for group rules.                     |
| Local armor/damage facts are treated as character totals.                            | Medium     | High   | Encode application scope and keep helper slot-local; defer aggregation to EPIC-21.                                    |
| Shared source-protocol work regresses EPIC-04/10.                                    | Medium     | High   | Add shared primitives only if justified, do not migrate old profiles, and run regression tests.                       |
| Fixture data misses live anomalies.                                                  | Medium     | High   | Run live discovery before production promotion and require first-baseline review.                                     |
| Source-authored prose leaks into runtime JSON.                                       | Medium     | High   | Default to structured facts and reviewed Build Wars-authored short notes; QA blocks unknown copied material.          |
| QA caps hide material errors.                                                        | Low        | High   | Treat overflow and material truncation as blocking.                                                                   |
| Exact allowlists expose non-runtime artifacts.                                       | Low        | High   | Use parent re-ignore rules, exact exceptions, `git check-ignore -v`, and final diff inspection.                       |
| Selected source evidence is not retained.                                            | Medium     | Medium | Record retention limits and require retained selected inputs or a fresh bounded acquisition/review for future replay. |
| Review capacity or live source access is unavailable.                                | Medium     | Medium | Leave BW-1105/BW-1106 and the sprint blocked rather than promoting fixture-only data.                                 |
| Helper scope drifts into equipment/stat logic.                                       | Medium     | Medium | Keep it one-record/one-slot and document deferred legality, composition, and totals.                                  |

## Security Considerations

- Treat source titles, redirects, page bodies, templates, parameters, icon
  names, source plans, snapshot manifests, generated catalogs, QA evidence,
  baselines, and review notes as untrusted input.
- Permit network access only in explicit live mode with `--allow-live-network`,
  the registered profile, GET-only JSON requests, fixed Guild Wars Wiki API
  origin, final-origin checks, finite timeouts, retry caps, continuation caps,
  and response/request/page byte caps.
- Reject arbitrary endpoints, source-provided fetch URLs, recursive crawls,
  credentials, cookies, tokens, environment secrets, absolute child paths,
  `..` traversal, symlink escape, mixed roots, duplicate children, and digest
  mismatch.
- Parse wiki content as inert data. Never execute templates, Lua, HTML,
  JavaScript, CSS, links, shell snippets, or source-authored expressions.
- Runtime JSON is inert data and future UI must render names/notes as escaped
  text, never `innerHTML`.
- Bound accepted pages, title lengths, parser bytes, template traversal,
  numeric ranges, effect counts, condition counts, evidence excerpts, output
  bytes, and QA findings.
- Query icon metadata only and keep every runtime media record
  `cachedBytes: false`; do not store media bytes, thumbnails, screenshots, data
  URLs, or source media in fixtures or runtime bundles.
- Source-policy classification remains field-level. Unknown copied material,
  digest mismatch, and unreadable artifacts remain non-waivable for public
  release.
- No new package or Python dependency is planned. Any required dependency
  triggers supply-chain review and a sprint amendment.

## Dependencies

- `EPIC-01` / `SPRINT-002`: source policy, provenance, media restrictions,
  manual review, QA gates, exact-path promotion, and artifact retention.
- `EPIC-02` / `SPRINT-003`: MediaWiki client, snapshots, parser adapter,
  metadata-only icons, canonical artifact writing, fixture/offline/live modes,
  and QA report format.
- `EPIC-03` / `SPRINT-004`: promoted profession/attribute catalog, dependency
  digests, section digests, and passing QA gates.
- `EPIC-04` / `SPRINT-005`: source-set planning, selected offline replay,
  semantic digests, compact runtime dispositions, and exact-path allowlisting
  precedent.
- `EPIC-10` / `SPRINT-011`: closest armor-upgrade catalog precedent,
  metadata-only media pattern, effect-level stacking pattern, and blocked
  promotion semantics. It is not a semantic runtime dependency for insignias.
- Future `EPIC-13`, `EPIC-14`, `EPIC-17`, `EPIC-20`, and `EPIC-21` consume the
  catalog for armor records, equipment authoring, template modifier resolution,
  search/tooltips, and full stat analysis.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and `npm run data:setup` for
  the pinned parser environment.
- Guild Wars Wiki availability is required only for production live
  discovery/fetch. Fixture generation, tests, build, and `npm run verify`
  remain offline.
- Maintainer review capacity is required for source-plan approval,
  source-policy dispositions, warning dispositions, first-baseline review, and
  any copied-text exception.

## Open Questions

No open question blocks execution in this non-interactive plan. Use these
defaults unless a phase gate disproves them:

1. The bounded source authority is `Equipment template format`, `Insignia`,
   approved mechanics evidence such as `Effect stacking`, verified detail
   pages, metadata-only `imageinfo`, and EPIC-03 joins.
2. `InsigniaId` is schema-owned and registry-backed; template modifier IDs are
   structured crosswalk facts.
3. Production v1 requires one unique active verified modifier crosswalk per
   accepted player-usable insignia unless Phase 1 records an amendment.
4. Slot-scaled values belong directly in runtime per-slot outcomes, not hidden
   formulas.
5. Only source-clear conditional phrases become controlled predicate objects.
   Everything else remains `note-only`, `unknown`, or a blocker based on
   consumer impact.
6. `src/app` remains unchanged; catalog consumption is deferred.
7. If live source acquisition, selected replay, or review cannot complete,
   leave the sprint blocked rather than promoting fixture-only data.

## Planning Assumptions

1. EPIC-11 can be planned as one sprint because BW-1101 through BW-1106 are
   groomed, ready, and dependency ordered.
2. No high-risk architecture choice requires human interview before planning;
   the work extends the existing EPIC-02/03/04/10 catalog architecture.
3. Planning updates may touch sprint, draft, ticket, ledger, run-state, and
   result-manifest records, but not implementation code or commits.
4. Final approval is auto-granted because this sprint is internally consistent,
   executable, and bounded by explicit phase and promotion gates.
