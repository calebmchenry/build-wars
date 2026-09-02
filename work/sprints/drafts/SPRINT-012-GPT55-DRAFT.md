---
id: SPRINT-012
title: Insignias Catalog
status: draft
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
---

# Sprint 012: Insignias Catalog

## Overview

This sprint turns `EPIC-11 Insignias` into a runtime-eligible, framework-neutral insignia catalog
for Build Wars. The catalog covers player-usable armor prefix upgrades, common and
profession-specific availability, profession restrictions, slot applicability, metadata-only icons,
source references, structured effects, explicit per-slot deterministic values, compact QA
dispositions, section digests, and semantic catalog versioning.

This is a content, ingestion, and domain-contract sprint. It does not add equipment editor UI,
armor-piece selection, armor shell cataloging, rune composition, full stat totals, combat
simulation, source-derived icon bytes, backend storage, party builds, guide authoring, or runtime
wiki access. Current app behavior for the single-character skill editor, local saved-build library,
template-code sharing, backup/restore, promoted professions/attributes, promoted skills, and
promoted runes must remain unchanged.

The sprint extends the existing EPIC-02 ingestion platform and the EPIC-03/04/10 catalog pattern.
`src/domain` owns plain-data contracts and narrow pure helpers only. `scripts/data/build_wars_ingest`
owns source discovery, snapshot replay, extraction, semantic normalization, QA, and deterministic
artifact writing. Runtime app code may import promoted generated catalog JSON only through
`src/app/catalogs.ts`; this sprint documents that downstream boundary and should not wire insignias
into the current UI.

The main architectural ambiguities are source authority, stable identity, and effect semantics.
Guild Wars Wiki may expose insignias through an overview page, equipment-template modifier rows,
common/profession-specific detail pages, redirects, and related armor-upgrade pages. The sprint must
not assume a complete source graph until a bounded source-shape checkpoint accounts for every
candidate. `InsigniaId` should be schema-owned and stable from a reviewed source-key registry by
default, with a nullable or multi-value `TemplateEquipmentModifierId` crosswalk. If Phase 1 proves
that every accepted player-usable insignia has a unique verified equipment-template modifier ID, the
schema may strengthen that crosswalk before promotion; otherwise template resolution remains a later
EPIC-17 handoff. Deterministic health, energy, armor, and damage-reduction effects must expose
explicit head, chest, hands, legs, and feet values. Conditional or combat-state behavior must remain
typed and conservative until EPIC-21 owns complete stat analysis.

Production promotion is required for sprint completion. Fixture and offline work can land before
live source access is available, but `SPRINT-012` must not be marked complete until the selected
source set, offline replay, QA gates, exact-path allowlisting, documentation, tickets, ledger, and
ticket-burn result manifest agree.

## Use Cases

1. **Offer legal insignia choices later**: EPIC-14 can list common and profession-specific insignias
   by armor profession, availability, slot applicability, mode availability, and source-backed
   restrictions without reading wiki pages or QA reports.
2. **Display per-piece effects later**: Equipment UI can show the deterministic effect for a
   selected head, chest, hands, legs, or feet piece directly from the catalog instead of remembering
   Guild Wars armor-piece scaling rules in app code.
3. **Preserve conditional behavior**: Conditional armor, health, energy, damage-reduction, or
   combat-state effects remain visible as typed facts or note-only records without being converted
   into guessed arithmetic.
4. **Support template handoff later**: EPIC-17 can map decoded equipment modifier IDs to known
   insignia records when the catalog has verified crosswalk data, while preserving unknown authored
   modifier IDs.
5. **Keep runes separate**: EPIC-13/14 can compose `ArmorPiece.runeId` and `ArmorPiece.insigniaId`
   as independent attachment points without treating rune stacking or headgear facts as insignia
   behavior.
6. **Audit source-derived data**: Maintainers can trace every accepted insignia, excluded candidate,
   unsupported page, icon metadata record, slot value, warning, and blocking finding to source
   references, revision facts, artifact digests, QA evidence, and review decisions.
7. **Refresh deliberately**: Maintainers can discover the insignia source set, review the source-set
   digest and candidate accounting, fetch detail pages only after digest confirmation, replay a
   selected complete snapshot set offline, and promote only deterministic generated artifacts.
8. **Hand off full stats safely**: EPIC-21 can use structured values and typed unresolved states as
   inputs for future health, energy, armor, and combat-state analysis without reverse-engineering
   prose from the runtime catalog.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Domain contracts | `InsigniaCatalog`, insignia records, source-set summaries, dispositions, page identity, availability, slot applicability, structured effect variants, explicit slot value maps, template-modifier crosswalks, dependency summaries, metadata-only media refs, and narrow pure lookup/slot-effect helpers. | React state, DOM/browser APIs, browser storage, network clients, generated manifest imports, QA report imports, source snapshot imports, data-script imports, full stat APIs, armor legality engines, or UI-owned display decisions. |
| Ingestion | EPIC-11 profile, source-shape checkpoint, digest-bound source planning, bounded live fetch, selected offline replay, extraction, semantic normalization, QA, deterministic artifact writing, and exact-path promotion. | One-off insignia scraper, arbitrary source URLs, recursive category crawl, browser automation, source-provided fetch commands, runtime fetches, or live network during `npm run verify`. |
| Runtime data | `data/generated/epic-11/insignias.catalog.json` with compact semantic facts, source references, dispositions, and metadata-only media records. | Raw page bodies, source plans, snapshot-set manifests, candidate outputs, QA summaries, review scratch files, icon bytes, screenshots, thumbnails, copied long source prose, or local absolute paths. |
| Insignia semantics | Common/profession-specific classification, profession restrictions, PvE/PvP availability when source-backed, slot applicability, per-slot deterministic health/energy/armor/damage values, conditional states, non-stacking facts, note-only states, and unknown states. | Armor shell records, armor ratings, rune effects, weapon modifiers, title effects, complete health/energy/armor totals, final damage formulas, or combat simulation. |
| App integration | Documentation that future consumers must import through `src/app/catalogs.ts` and keep attribution/privacy boundaries. | Adding an insignia picker, equipment editor controls, local-library equipment persistence, share-url equipment payloads, remote icon rendering, or tooltip UI. |
| Closeout | README/data docs, compendium note, ticket status, sprint status, ledger sync, planning/execution manifests, and verification evidence. | Commit creation, unrelated implementation cleanup, or expanding current editor behavior. |

### Data Flow

```text
promoted EPIC-03 professions/attributes catalog
        +
completed EPIC-10 rune catalog as implementation precedent
        +
bounded insignia source authority checkpoint
  -> source-plan digest and review
  -> digest-confirmed detail-page and metadata-only icon snapshot fetch
  -> complete SourceSnapshotSetManifest
  -> selected offline replay
  -> insignia source extraction
  -> EPIC-03 profession joins and optional template-modifier crosswalks
  -> semantic effect normalization and explicit per-slot value derivation
  -> InsigniaCatalog JSON
  -> GeneratedArtifactManifest + QaReport
  -> exact-path promotion and docs closeout
```

Fixture mode is synthetic and network-free. Live discovery/fetch is manual-only, fixed-origin, and
bounded by the registered EPIC-11 profile. Offline replay requires one complete selected snapshot
set and rejects partial, mixed-profile, extra, missing, duplicate, edited, path-escaping, or
digest-mismatched inputs before extraction begins.

### Source Authority

Phase 1 must run a source-shape checkpoint before locking the schema and source graph. The preferred
default is a bounded hybrid:

- `Equipment template format` for equipment-modifier evidence and candidate crosswalks when rows can
  be confidently classified as insignias rather than runes, weapons, colors, or unrelated modifiers.
- `Insignia` or a verified insignia overview/index page for common rules, armor-piece scaling
  evidence, common/profession-specific families, and candidate detail-page enumeration.
- Verified common and profession-specific insignia detail pages for canonical title, redirects,
  revision facts, icon candidates, restrictions, availability, raw effect facts, and source-backed
  notes.
- The promoted EPIC-03 catalog for all `ProfessionId` joins and profession-name normalization.
- The promoted EPIC-10 catalog only as a precedent and exclusion aid, not as runtime dependency for
  insignia records.

Category crawl, site search, PvX/community pages, arbitrary recursive links, source-provided fetch
URLs, wiki access from runtime code, and copied source prose are excluded. If the checkpoint proves
that the default hybrid is incomplete, ambiguous, or too broad to review, execution records the
blocking source decision and amends the sprint instead of silently adding crawl behavior.

Every seed row, index entry, detail page, redirect, same-name candidate, and armor-prefix-like source
record must become one of: accepted insignia, supported relationship to an accepted insignia,
explicit non-insignia exclusion, unsupported disposition, or blocking finding. Runes, armor shells,
weapons, dyes, historical/non-player records, and malformed records are not silently skipped.

### Stable Insignia Identity

`InsigniaId` already exists as the branded public catalog ID. EPIC-11 should not add a parallel
public ID namespace. The v1 default is:

- each accepted insignia has a stable `sourceKey` derived from canonical page identity plus variant
  identity when one page represents multiple records;
- `id: InsigniaId` comes from a reviewed schema-owned registry or deterministic allocation strategy
  keyed by `sourceKey`, never from array position, fixture order, filesystem order, or API response
  order;
- `templateModifierIds: TemplateEquipmentModifierId[]` or an equivalent crosswalk is present when
  verified equipment-template evidence exists, and duplicates/conflicts are QA-blocking;
- source-clear one-to-one modifier coverage may allow Phase 1 to strengthen this to a required
  `templateModifierId`, but missing modifier evidence should not be silently invented;
- after first promotion, changing an existing `InsigniaId` is a blocking generated-data diff unless
  an explicit migration review approves it;
- runtime consumers treat `InsigniaId` as opaque and use catalog lookup helpers rather than numeric
  ranges.

This default keeps the catalog useful for legal choice lists and slot-effect display even if template
modifier coverage is incomplete, while preserving a clean handoff for EPIC-17 template resolution.

### Runtime Catalog Contract

`InsigniaCatalog` should mirror the durable shape of the existing promoted catalogs:

```text
InsigniaCatalog
  schemaVersion
  catalogVersion
  sectionDigests
  generatedAt
  generator
  profile: epic-11-insignias
  dependencyDigests: EPIC-03 dependency summary
  sourceSet
  dispositions
  insignias
  remoteMedia
```

Each `CatalogInsigniaRecord` should include at least:

- `id`, `sourceKey`, canonical `name`, `normalizedName`, `wikiUrl`, and page identity facts;
- common/profession-specific availability, nullable `professionId`, and PvE/PvP availability when
  source-backed;
- armor-upgrade scope as armor prefix, applicable armor slots, and slot-scaling policy;
- optional verified template modifier crosswalk data with stable lookup outcomes;
- non-empty structured `effects`, nullable `iconId`, compact field provenance, and display state;
- source-owned description text excluded by default unless a bounded source-policy review approves a
  short runtime display field.

Compact `sourceSet` and runtime-relevant `dispositions` may remain in the catalog, matching EPIC-04
and EPIC-10 precedent. Full source plans, child snapshot paths, raw page bodies, review records, QA
finding bodies, release gates, local paths, and artifact manifests stay outside runtime imports.

### Effect And Slot-Scaling Model

Insignia effects should be structured as independent facts, not parsed strings. Numeric
deterministic effects must carry explicit slot values:

```text
SlotValueMap
  head: number | null
  chest: number | null
  hands: number | null
  legs: number | null
  feet: number | null
```

The value map records the value a later consumer should display or apply for an insignia placed on
that slot. A value can be `null` only when the effect does not apply to that slot or deterministic
source-backed scaling is unavailable. Promotion blocks if a core deterministic effect lacks required
slot values for an applicable slot.

Minimum v1 effect variants:

| Effect kind | Required facts | V1 behavior |
| --- | --- | --- |
| `maximum-health-delta` | signed value map, target, condition, stacking rule, provenance | Health bonuses are displayable per slot only where deterministic. Conditional health remains conditional or note-only. |
| `maximum-energy-delta` | signed value map, target, condition, stacking rule, provenance | Energy bonuses are displayable per slot only where deterministic. |
| `armor-delta` | signed value map, armor scope, condition, stacking rule, provenance | Armor bonuses can be structured for source-clear always-on or conditional states, but final armor totals stay deferred. |
| `damage-reduction` | value map or fixed value, damage scope, condition, stacking rule, provenance | Structured only when source evidence supports a fixed interpretation. Broader combat math remains deferred. |
| `condition-state` | controlled condition key, operator/value where safe, provenance | Describes when another effect applies. It does not simulate combat state. |
| `non-stacking-note` | stable group key, bounded reviewed text, provenance | Records source-clear non-stacking or same-family behavior without becoming a calculator. |
| `note-only` | stable note code, bounded reviewed text, provenance | No arithmetic. Used for ambiguous, conditional, or intentionally deferred behavior. |
| `unknown` | source-field reference, bounded reason, provenance | No arithmetic. Used when a record is accepted but a field cannot be modeled safely yet. |

Supported stacking rules should be effect-level, not record-level: `sum`, `highest`, `separate`,
`non-stacking`, and `unknown`. The rule describes what a future calculator may do; this sprint only
records source-backed facts and tests deterministic helper output where helpers are added.

Slot scaling has one non-negotiable rule: downstream callers must not need to remember a hidden
formula. If the source supports a deterministic armor-piece rule, the generated record exposes
explicit head, chest, hands, legs, and feet values. If a page provides prose but not enough evidence
to produce a safe value map, the effect becomes `note-only`, `unknown`, or a blocking QA finding
depending on severity.

### Helper Boundary

Add pure helper APIs only where raw lookup helpers are not enough for later equipment work. The
expected narrow helper is:

```text
summarizeInsigniaSlotEffects(catalog, equippedEntries)
```

It accepts caller-owned equipped entries with unique source keys, `ArmorSlot` values, and
`InsigniaId` values. It returns deterministic slot-specific effect facts, displayable per-piece
values, and typed unresolved reasons for unknown IDs, duplicate source keys, malformed records,
slot-inapplicable insignias, note-only effects, unknown effects, and unsupported semantics.

It does not choose armor pieces, validate primary-profession legality, join armor shell records,
compose rune effects, calculate total health/energy/armor, simulate conditions, read files, import
app modules, fetch data, or mutate inputs. Tests should prove that a slot-scaled fixture produces
different chest, legs, and minor-slot values from the same `InsigniaId` without requiring the app to
apply a formula.

### Alternatives Considered

- **Using only an insignia overview page**: rejected as a default until Phase 1 proves it contains
  complete, current, and reviewable coverage for player-usable records, redirects, icons,
  restrictions, and PvE/PvP differences.
- **Using only equipment-template modifier rows**: rejected as a default because template rows may be
  incomplete, ambiguous, or shared with non-insignia modifiers. They are strong crosswalk evidence,
  not assumed catalog authority until proven.
- **Formula-only slot scaling**: rejected. Runtime records must include explicit per-slot values for
  deterministic effects to avoid duplicating rules across future UI and stat code.
- **Record-level `stackable`**: rejected. Stacking and non-stacking behavior can differ by effect
  and may be conditional.
- **Runtime import of manifests or QA reports**: rejected. Runtime consumers get catalog JSON only.
- **Full stat calculator**: deferred to EPIC-21. EPIC-11 records facts and narrow helper outcomes.
- **Armor editor integration during EPIC-11**: deferred to EPIC-13/14. Validate through domain,
  generated-data, and ingestion tests.
- **Hand-authored production JSON**: rejected. Production bytes must be generated from reviewed
  source inputs.

## Implementation

### Phase 1: BW-1101 Insignia Contracts And EPIC-11 Profile (~15% of effort)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/equipment.ts`
- `src/domain/ids.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/insignia-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `work/tickets/11-insignias/BW-1101-insignia-catalog-contracts-and-profile.md`

**Tasks:**

- [ ] Mark EPIC-11 and BW-1101 in progress when implementation starts; do not advance dependent
      tickets before the Phase 1 gate.
- [ ] Run a bounded source-shape checkpoint over candidate overview/index pages, equipment-template
      modifier evidence, representative common insignias, representative profession-specific
      insignias, redirects, slot-scaling evidence, PvE/PvP differences, icon fields, and conditional
      effect text.
- [ ] Confirm or amend the source authority and identity policy before freezing the runtime schema.
      If source authority or identity cannot be finite, complete, and reviewable, stop for a
      recorded sprint amendment.
- [ ] Define schema-v1 `InsigniaCatalog`, `CatalogInsigniaRecord`, profile, dependency,
      source-set, disposition, page identity, availability, PvE/PvP availability, slot
      applicability, slot value maps, display state, effect, condition, stacking, and template
      crosswalk types.
- [ ] Reuse existing `InsigniaId`, `TemplateEquipmentModifierId`, `ProfessionId`, and `ArmorSlot`
      brands/types. Do not add a parallel public insignia ID namespace or duplicate armor-slot enum.
- [ ] Lock the v1 identity default: source-key-backed `InsigniaId` plus verified template modifier
      crosswalks, with promotion-blocking QA for crosswalk conflicts and a possible Phase 1
      amendment if one-to-one modifier coverage is proven.
- [ ] Add collision-safe insignia lookup contracts by catalog ID, normalized name, and verified
      template modifier ID where supported by the schema.
- [ ] Add `epic-11-insignias` profile registration with fixture, offline, discover, and fetch modes;
      exact output paths; metadata-only media policy; EPIC-03 dependency requirement; and code-owned
      caps for pages, media titles, requests, retries, response bytes, parser bytes, aggregate bytes,
      catalog bytes, and QA bytes.
- [ ] Preserve existing EPIC-02, EPIC-03, EPIC-04, and EPIC-10 profile behavior and command
      compatibility.

**Phase Gate:**

- [ ] Source authority, identity policy, domain contract, profile registration, runtime/audit split,
      and existing profile compatibility are settled.
- [ ] The contract can represent deterministic per-slot effects, conditional states, unsupported
      states, and crosswalk uncertainty without app imports or a full-stat API.
- [ ] BW-1101 is marked done only after its acceptance criteria and focused verification pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/insignia-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`

### Phase 2: BW-1102 Source Set, Page Resolution, And Fixtures (~18% of effort)

**Files:**

- `scripts/data/build_wars_ingest/insignia_source_set.py`
- `scripts/data/build_wars_ingest/api.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_insignia_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_rune_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/insignias/`
- `work/tickets/11-insignias/BW-1102-insignia-source-set-and-page-resolution.md`

**Tasks:**

- [ ] Mark BW-1102 in progress only after the Phase 1 gate passes.
- [ ] Build deterministic source-plan records over candidate modifier rows, overview/index entries,
      common insignia pages, profession-specific insignia pages, redirects, expected profession
      coverage, PvE/PvP availability evidence, icon metadata titles, exclusions, and unsupported
      records.
- [ ] Account for every candidate as accepted insignia, supported relationship, explicit exclusion,
      unsupported disposition, or blocking finding.
- [ ] Preserve requested, normalized, redirected, canonical, page ID, revision ID, revision
      timestamp, missing-page, duplicate-title, duplicate-canonical, duplicate-name, namespace,
      source-order, and source-family facts.
- [ ] Detect duplicate IDs, duplicate source keys, duplicate normalized names, conflicting
      overview/detail/modifier evidence, unsupported families, missing expected profession-specific
      coverage, missing slot-scaling evidence, malformed rows, source drift, and unexpected source
      shapes.
- [ ] Implement discover-only mode that writes an ignored canonical source plan with profile
      identity, caps, EPIC-03 dependency facts, source revisions, candidate counts, family counts,
      profession counts, slot-scaling evidence, dispositions, and digest.
- [ ] Implement digest-confirmed fetch that revalidates profile identity, dependency identity,
      source-plan digest, source-set digest, caps, and source drift before writing detail snapshots.
- [ ] Write complete or partial EPIC-11 snapshot-set manifests with child digests, aggregate
      counts/bytes, source-plan identity, completion state, and bounded failure detail. Partial sets
      cannot replay or promote.
- [ ] Reject offline replay for partial, extra, missing, duplicate, edited, mixed-profile,
      plan-mismatched, dependency-mismatched, path-escaping, or digest-mismatched inputs.
- [ ] Add minimized synthetic fixtures for common health and energy insignias, profession-specific
      armor bonuses, slot-scaled values across head/chest/hands/legs/feet, conditional effects,
      non-stacking notes, PvE/PvP availability differences when supported, redirects, duplicate
      names, missing icons, malformed effect text, missing restrictions, unsupported pages, and
      ambiguous source shapes.
- [ ] Prove fixture discovery is network-free, deterministic under reordered input, and bounded
      under oversized or malicious input.

**Phase Gate:**

- [ ] A reviewer can inspect one canonical source plan and account for every armor-prefix-like seed
      entry before any detail-page request is authorized.
- [ ] Existing EPIC-04 and EPIC-10 source-set/snapshot-set behavior remains compatible if helpers
      are shared. Otherwise keep EPIC-11 source planning isolated.
- [ ] BW-1102 is marked done only after its acceptance criteria and focused verification pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_source_set build_wars_ingest.tests.test_rune_source_set`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-11-insignias --root work/runs/data-ingestion/epic-11-fixture-a --fixture-root test/fixtures/data-ingestion`

### Phase 3: BW-1103 Insignia Extraction And Joins (~18% of effort)

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
- `test/domain/insignia-catalog.test.ts`
- `work/tickets/11-insignias/BW-1103-insignia-extractors.md`

**Tasks:**

- [ ] Mark BW-1103 in progress only after the Phase 2 source-set gate passes.
- [ ] Parse verified seed/detail snapshots with `mwparserfromhell` and bounded table/template
      adapters. Do not use live clients inside extractors.
- [ ] Produce deterministic raw insignia records containing source key, names, aliases, availability
      class, profession label, PvE/PvP availability facts, slot applicability, raw effect fields,
      raw slot-scaling evidence, optional template modifier IDs, page identity, icon candidate, and
      field-level source references.
- [ ] Support same-page multi-variant extraction without duplicate page fetches, ID collapse, or
      provenance loss.
- [ ] Preserve unsupported raw effect field identity as bounded evidence for QA, but do not copy raw
      effect paragraphs or page bodies into runtime records.
- [ ] Join profession restrictions through unique EPIC-03 catalog records and dependency digests,
      never through unchecked numeric coincidence, array position, or substring-only matching.
- [ ] Distinguish common insignias from profession-specific records through controlled source facts
      and explicit availability fields, not inferred name prefixes alone.
- [ ] Reject impossible slot names, contradictory profession labels, invalid PvE/PvP states,
      positive/negative sign mismatches, zero values where invalid, unsafe units, overflow,
      non-finite values, and unsupported condition syntax.
- [ ] Resolve metadata-only icon records from verified image fields and `imageinfo`; record
      `cachedBytes: false` and nullable `iconId`. Do not fetch or persist bytes, thumbnails, or
      arbitrary URLs.
- [ ] Emit stable findings for duplicate IDs/names/source keys, lookup-key collisions, missing
      restrictions, missing revisions, missing icons, unknown templates/parameters/families,
      malformed numeric fields, lossy parsing, unsafe text, copied-text risk, and unsupported
      slot-scaling evidence.
- [ ] Sort raw records and dispositions by stable numeric/source keys regardless of request order,
      page order, or filesystem order.

**Phase Gate:**

- [ ] Raw extraction is loss-aware and source-traceable, contains no inferred arithmetic beyond raw
      field capture, and accounts for every fixture candidate.
- [ ] Every accepted profession-specific record has a unique EPIC-03 profession join, or it blocks
      promotion with a stable finding.
- [ ] BW-1103 is marked done only after its acceptance criteria and focused verification pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_extractor build_wars_ingest.tests.test_icons`
- `npm run test:run -- test/domain/insignia-catalog.test.ts`
- `npm run data:test`

### Phase 4: BW-1104 Effect Semantics, Slot Scaling, And Domain Fixtures (~22% of effort)

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
- `test/domain/insignia-effects.test.ts`
- `test/domain/insignia-catalog.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json`
- `work/tickets/11-insignias/BW-1104-insignia-effect-semantics-and-slot-scaling.md`

**Tasks:**

- [ ] Mark BW-1104 in progress only after deterministic raw extraction passes.
- [ ] Implement table-driven semantic normalization for health, energy, armor, damage reduction,
      conditional effects, non-stacking notes, note-only effects, and unknown effects.
- [ ] Convert source-backed armor-piece scaling into explicit head, chest, hands, legs, and feet
      value maps for every deterministic numeric effect where the source supports safe values.
- [ ] Validate value maps for complete slot coverage, safe integers or approved decimal precision,
      sign correctness, unit correctness, slot applicability, condition linkage, and stable
      provenance.
- [ ] Represent combat-state predicates as controlled condition values such as always, while
      enchanted, while in stance, while attacking, while health-thresholded, while holding item, or
      unknown only when source evidence supports that classification.
- [ ] Model verified non-stacking or same-family behavior at effect level with stable group keys.
      Route ambiguous stacking, rounding, or cross-system composition to note-only or unknown
      effects.
- [ ] Require every accepted record to have at least one structured, note-only, or unknown effect.
      Unknown required core mechanics block promotion when they would make the runtime catalog
      misleading.
- [ ] Implement `summarizeInsigniaSlotEffects` only within the narrow helper boundary if tests need
      an executable consumer contract for per-slot values.
- [ ] Add fixtures for one insignia applied to all five slots, duplicate equipped entries, unknown
      IDs, duplicate source keys, slot-inapplicable records, common versus profession-specific
      restrictions, conditional armor, note-only behavior, unknown behavior, malformed records, and
      PvE/PvP availability differences.
- [ ] Prove helpers do not mutate catalogs or entries and do not silently drop unresolved equipped
      occurrences.

**Phase Gate:**

- [ ] A slot-scaled fixture exposes distinct head/chest/hands/legs/feet values from a single
      catalog record without app-side formula inference.
- [ ] Structured semantics do not overclaim equipment legality, base armor, rune interaction,
      title effects, condition truth, damage formulas, or full stat totals.
- [ ] BW-1104 is marked done only after its acceptance criteria and focused verification pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/insignia-effects.test.ts test/domain/insignia-catalog.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_semantics build_wars_ingest.tests.test_insignia_catalog`

### Phase 5: BW-1105 Assembly, QA, Review, And Exact-Path Promotion (~17% of effort)

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

- [ ] Mark BW-1105 in progress only after source-set, extraction, and semantics gates pass.
- [ ] Assemble canonical catalog sections with dependency facts, source-set summary, compact
      dispositions, insignia records, template crosswalks, slot applicability, structured effects,
      condition facts, remote media, compact provenance, section digests, and semantic catalog
      version.
- [ ] Define semantic-version inputs: consumer-visible identity, names, lookup keys, availability,
      profession restrictions, mode availability, slot applicability, template crosswalk facts,
      effects, slot values, conditions, stacking facts, display fields, runtime media, compact
      source dispositions, and EPIC-03 dependency facts.
- [ ] Exclude `generatedAt`, the version value itself, local paths, manifest paths, QA paths,
      retrieval-only timestamps, raw snapshots, QA bodies, review bodies, and ignored source plans
      from semantic version inputs.
- [ ] Add mutation tests proving every runtime-semantic field changes its owning section digest and
      `catalogVersion`, while audit-only path/timestamp changes do not masquerade as semantic
      changes.
- [ ] Add QA for source accounting, zero-output rejection, stable IDs, source-key uniqueness,
      normalized-name collisions, template crosswalk conflicts, referential integrity, page
      resolution, EPIC-03 joins, profession restrictions, slot applicability, slot-scaling coverage,
      required effects, condition vocabulary, stacking keys/rules, copied-text policy, icons, output
      caps, section/version digests, baseline diffs, and artifact integrity.
- [ ] Make stable finding IDs independent of request order, absolute path, and wall clock. QA
      overflow or evidence truncation that could hide material errors is itself blocking.
- [ ] Generate the synthetic EPIC-11 fixture twice into separate ignored roots under a fixed clock
      and prove byte identity for catalog, manifest, QA JSON, section digests, source/disposition
      order, and finding IDs.
- [ ] Run bounded live `discover`; review source identities, candidate counts, family/profession
      coverage, slot-scaling evidence, caps, dependency facts, and digest before fetch.
- [ ] Run digest-confirmed `fetch` only with the reviewed source plan and exact
      `--confirm-source-set-digest`, then retain the complete selected snapshot-set manifest for
      production replay.
- [ ] Replay the selected complete snapshot set offline twice under a fixed clock and require
      byte-identical catalog, manifest, QA report, section digests, and finding IDs.
- [ ] Perform first-baseline review bound to expected counts, ID coverage, profession coverage,
      common/profession-specific split, slot value coverage, additions/removals, dispositions,
      section digests, dependency digests, display states, icon decisions, artifact digest, QA
      digest, and app/public gate evidence.
- [ ] Resolve or exclude all critical/error findings according to policy. Every warning must have a
      named bounded disposition or reviewed finding class.
- [ ] Generate approved production bytes from selected offline inputs only. Never hand-edit promoted
      JSON.
- [ ] Add only exact EPIC-11 `.gitignore` parent-directory and three-file exceptions. Verify source
      plans, raw snapshots, snapshot-set manifests, candidate outputs, QA summaries, icon bytes,
      screenshots, logs, and other byproducts remain ignored or absent.
- [ ] Mark BW-1105 done only after all three exact artifacts exist, both release gates pass, and
      evidence is recorded.

**Phase Gate:**

- [ ] `data/generated/epic-11/insignias.catalog.json`, its adjacent manifest, and
      `data/qa/epic-11/insignias.catalog.qa.json` are byte-reproducible, mutually consistent,
      exactly allowlisted, and approved.
- [ ] The runtime catalog can be imported in TypeScript tests without reading any adjacent audit or
      ingestion artifact.
- [ ] If live source access, selected replay inputs, or review capacity is unavailable, leave
      BW-1105 and the sprint blocked rather than promoting fixture data as production.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-11-insignias --root work/runs/data-ingestion/epic-11-fixture-a --fixture-root test/fixtures/data-ingestion`
- Repeat fixture generation into `work/runs/data-ingestion/epic-11-fixture-b` with the same fixed
  clock and compare the three JSON outputs byte-for-byte.
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-11-insignias --root work/runs/data-ingestion/epic-11-live --allow-live-network --stage discover`
- Run `fetch` with the reviewed `--source-plan` and exact `--confirm-source-set-digest`, then run
  `offline --profile epic-11-insignias --snapshot-set <selected-manifest>` twice under a fixed
  clock.
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_insignia_catalog build_wars_ingest.tests.test_artifacts build_wars_ingest.tests.test_qa build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `npm run test:run -- test/domain/data-ingestion-contracts.test.ts test/domain/insignia-catalog.test.ts test/domain/insignia-effects.test.ts`
- `git check-ignore -v` for the three promoted paths and representative ignored byproducts.
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

- [ ] Mark BW-1106 in progress only after exact-path promotion passes.
- [ ] Document source authority, final caps, source-shape results, identity/crosswalk policy,
      profile modes, digest-confirmed refresh, selected offline replay, artifact schema, effect and
      condition vocabulary, slot-scaling semantics, semantic versioning, QA gates, first-baseline
      review, exact paths, and retention limits.
- [ ] State that only `data/generated/epic-11/insignias.catalog.json` is runtime-eligible.
      Manifests, QA reports, source plans, snapshot sets, raw snapshots, QA summaries, review
      evidence, and Python tooling remain non-runtime.
- [ ] Document metadata-only icons and the attribution/privacy work a later UI must complete before
      displaying remote media.
- [ ] Document EPIC-13/14 handoffs: use `ArmorPiece.insigniaId`, join legality against armor
      profession facts, preserve slot applicability, and combine with rune choices without merging
      semantics.
- [ ] Document EPIC-17/20/21 handoffs for template modifier resolution, search/tooltips, and
      unresolved full-stat composition.
- [ ] Confirm the current editor, local persistence, sharing, backup/restore, template
      compatibility, EPIC-03/04/10 catalogs, and app import boundaries are unchanged.
- [ ] Inspect the worktree for raw snapshots, source plans, snapshot-set manifests, candidate
      outputs, QA summaries, media bytes, screenshots, copied prose, broad allowlists, secrets,
      absolute machine paths, nondeterministic timestamps, and unrelated changes.
- [ ] Add verification and artifact evidence to BW-1101 through BW-1106. Mark tickets done only
      after their phase gates pass. Mark EPIC-11, SPRINT-012, and ledger completed together only
      after the full Definition of Done.
- [ ] Write the ticket-burn planning and execution result manifests with matching sprint, epic,
      ticket IDs, changed-file summary, validation results, `blocked_reason`, followups, and no
      commit creation.
- [ ] Do not create a commit.

**Phase Gate:**

- [ ] Documentation, tickets, sprint, ledger, promoted artifacts, QA state, and result manifests
      agree on IDs, paths, commands, versions, review scope, assumptions, limitations, and status.
- [ ] `npm run verify` passes without live network access.
- [ ] BW-1106, EPIC-11, and SPRINT-012 are complete only after all gates pass.

**Verification:**

- `npm run data:regenerate`
- Direct EPIC-11 fixed-clock fixture regeneration
- `npm run verify`
- `rg -n 'EPIC-11|BW-110[1-6]|SPRINT-012' work/tickets/11-insignias work/sprints`
- `git status --short`
- Manual consistency review across docs, generated files, QA state, tickets, sprint, ledger, and
  result manifests.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Add insignia catalog, record, source-set, dependency, availability, slot, effect, condition, display, and crosswalk contracts. |
| `src/domain/catalog-lookup.ts` | Modify | Add collision-safe insignia lookup helpers by ID, name, and verified template modifier where supported. |
| `src/domain/insignia-effects.ts` | Create if needed | Implement the narrow per-slot effect summary helper without creating a stat calculator. |
| `src/domain/index.ts` | Modify | Export new insignia contracts and helper APIs. |
| `src/domain/ids.ts` | Reference only | Reuse existing `InsigniaId` and `TemplateEquipmentModifierId`. |
| `src/domain/equipment.ts` | Reference only | Preserve `ArmorPiece.insigniaId` and existing `ArmorSlot` as downstream attachment points. |
| `scripts/data/build_wars_ingest/config.py` | Modify | Add EPIC-11 caps where current defaults are not precise enough. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register `epic-11-insignias` and exact output paths. |
| `scripts/data/build_wars_ingest/insignia_source_set.py` | Create | Plan, resolve, digest, and validate insignia source sets. |
| `scripts/data/build_wars_ingest/insignia_extractor.py` | Create | Parse source-backed identity, availability, restrictions, raw effects, slot evidence, and icon facts. |
| `scripts/data/build_wars_ingest/insignia_semantics.py` | Create | Convert raw facts into typed effects, conditions, non-stacking notes, and explicit slot value maps. |
| `scripts/data/build_wars_ingest/insignia_catalog.py` | Create | Assemble canonical output, semantic version, section digests, and QA inputs. |
| `scripts/data/build_wars_ingest/api.py` | Modify only if needed | Preserve page-resolution facts without regressing existing profiles. |
| `scripts/data/build_wars_ingest/snapshots.py` | Modify only if needed | Reuse complete snapshot-set replay and path confinement. |
| `scripts/data/build_wars_ingest/wikitext.py` | Modify | Support bounded insignia templates/tables and diagnostics. |
| `scripts/data/build_wars_ingest/icons.py` | Modify | Resolve metadata-only insignia icon records. |
| `scripts/data/build_wars_ingest/models.py` | Modify narrowly | Add shared source/disposition models only where needed. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Support EPIC-11 artifact paths, caps, digests, and diff checks. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add insignia-specific QA rules in the shared QA format. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate EPIC-11 fixture, discover, fetch, offline replay, and promotion. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Expose safe EPIC-11 profile/stage/confirmation/snapshot-set options. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Cover profile, source-set, extraction, semantics, QA, artifacts, pipeline, and CLI behavior. |
| `test/domain/insignia-catalog.test.ts` | Create | Validate catalog shape, IDs, lookups, collisions, effects, slot values, and semantic versions. |
| `test/domain/insignia-effects.test.ts` | Create if helper exists | Prove deterministic per-slot effect summary and unresolved handling. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Validate Python-generated insignia JSON against TypeScript expectations. |
| `test/fixtures/data-ingestion/insignias/` | Create | Store minimized synthetic insignia source fixtures. |
| `test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json` | Create | Store deterministic synthetic golden insignia catalog. |
| `.gitignore` | Modify narrowly | Allowlist only approved EPIC-11 production artifacts and parent directories. |
| `data/generated/epic-11/insignias.catalog.json` | Create/allowlist | Runtime-eligible generated insignia catalog. |
| `data/generated/epic-11/insignias.catalog.manifest.json` | Create/allowlist | Adjacent artifact, dependency, digest, and review evidence. |
| `data/qa/epic-11/insignias.catalog.qa.json` | Create/allowlist | Bounded machine-readable QA and release gates. |
| `README.md`, `scripts/data/README.md`, `data/**/README.md` | Modify | Document commands, exact paths, runtime boundaries, and retention. |
| `compendium/data-ingestion-platform.md` | Modify | Record EPIC-11 profile and replay behavior. |
| `compendium/insignias-catalog.md` | Create | Durable source authority, schema, effects, slot scaling, QA, and handoff note. |
| `compendium/README.md` | Modify | Index the insignia catalog note. |
| `work/tickets/11-insignias/*.md` | Modify | Track sprint linkage, status, assumptions, and closeout evidence. |
| `work/sprints/SPRINT-012.md` | Create/update | Sprint plan and execution checklist. |
| `work/sprints/ledger.tsv` | Modify | Track SPRINT-012 lifecycle. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-11-result.json` | Create during planning | Required ticket-burn planning manifest. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-012-result.json` | Create during execution | Required ticket-burn execution manifest. |

## Definition of Done

### Source And Identity Gates

- [ ] The final source authority is finite, documented, digest-bound, and approved before detail
      fetch or promotion.
- [ ] Every armor-prefix-like modifier row, overview/index entry, detail page, redirect, and
      duplicate-name candidate becomes an accepted insignia, supported relationship, explicit
      exclusion, unsupported disposition, or blocking finding.
- [ ] Redirects, duplicate IDs, duplicate source keys, duplicate names, duplicate canonical pages,
      missing pages, malformed pages, unsupported records, conflicting source evidence, and source
      drift are resolved or blocking.
- [ ] Stable `InsigniaId` assignment is source-order-independent, collision-checked, source-key
      backed, and guarded by generated-data diff review.
- [ ] Verified template modifier crosswalk facts are represented where available, and conflicting
      crosswalks block promotion.
- [ ] Existing EPIC-02, EPIC-03, EPIC-04, and EPIC-10 profiles, outputs, CLI behavior, and tests
      remain compatible.

### Contract And Runtime Gates

- [ ] `InsigniaCatalog` is framework-neutral, JSON-compatible, schema-versioned, and exported
      through `src/domain`.
- [ ] `src/domain` imports no React, DOM/browser APIs, browser storage, network clients, app
      modules, generated manifests, QA reports, source snapshots, filesystem APIs, or Python
      modules.
- [ ] Insignia records include stable ID, source key, name, normalized key, wiki URL, page identity,
      availability, profession restriction, PvE/PvP availability where source-backed, applicable
      slots, template crosswalk facts, non-empty structured effects, display state, nullable icon ID,
      and compact provenance.
- [ ] Profession joins resolve through EPIC-03 catalog facts and dependency digests.
- [ ] Runtime catalog JSON excludes raw page bodies, source plans, local paths, full QA bodies,
      review scratch evidence, copied long prose, MediaWiki HTML, icon bytes, screenshots,
      thumbnails, and source-provided commands.

### Effect And Slot-Scaling Gates

- [ ] Health, energy, armor, damage-reduction, condition, non-stacking, note-only, and unknown
      effects are distinct typed states.
- [ ] Stacking and non-stacking behavior is effect-level and uses stable group keys. A record-level
      `stackable` boolean is not used as the source of truth.
- [ ] Every deterministic numeric effect that applies by armor piece exposes explicit head, chest,
      hands, legs, and feet values or has a blocking QA finding.
- [ ] Slot value maps are source-backed, safe-number checked, unit checked, sign checked, and stable
      across fixture/live/offline generation.
- [ ] Conditional combat-state behavior is represented as controlled predicates or note-only facts;
      no helper pretends to know whether a condition is active.
- [ ] Unknown or unsupported effects remain visible through typed states and QA; they are not dropped
      or converted into free-form runtime prose.
- [ ] Pure helpers, if added, do not choose armor slots, validate legality, compose runes, aggregate
      full stats, simulate combat, fetch data, or mutate inputs.

### Determinism, QA, And Promotion Gates

- [ ] Fixture mode is synthetic and network-free.
- [ ] Live fetch requires `--allow-live-network`, registered `epic-11-insignias`, exact source-plan
      path, exact source-set digest confirmation, and fixed Guild Wars Wiki API origin.
- [ ] Offline replay requires one complete EPIC-11 `SourceSnapshotSetManifest` and rejects partial,
      missing, extra, duplicate, mixed-profile, digest-mismatched, plan-mismatched,
      dependency-mismatched, or path-escaping inputs.
- [ ] Canonical output is stable under input ordering, API response ordering, filesystem ordering,
      batch boundaries, and concurrent completion.
- [ ] Repeated fixed-clock fixture generation is byte-identical for catalog, manifest, QA report,
      source ordering, section digests, finding IDs, and summary counts.
- [ ] Selected production snapshot-set replay is byte-identical across two fixed-clock offline runs
      for all three promoted artifacts.
- [ ] Semantic section digests and `catalogVersion` change for every consumer-visible mutation and
      remain stable for retrieval timestamp, local path, manifest path, QA path, and version-field
      changes.
- [ ] QA covers source accounting, expected coverage, zero-output rejection, stable IDs, crosswalks,
      referential integrity, page resolution, EPIC-03 joins, availability, restrictions, slot
      applicability, slot scaling, effects, conditions, stacking, icons, provenance, copied-text
      policy, schema shape, output caps, baselines, and artifact integrity.
- [ ] QA overflow or material truncation is blocking.
- [ ] `data/generated/epic-11/insignias.catalog.json`,
      `data/generated/epic-11/insignias.catalog.manifest.json`, and
      `data/qa/epic-11/insignias.catalog.qa.json` are the only promoted EPIC-11 exact paths.
- [ ] `appConsumptionGate` and `publicReleaseGate` are `pass`.
- [ ] Critical and error findings are resolved or excluded according to policy; every warning has a
      named bounded disposition or reviewed finding class.
- [ ] `git check-ignore -v` proves promoted paths are trackable and representative raw/candidate
      byproducts remain ignored.

### Closeout Gates

- [ ] Documentation explains exact paths and commands, source policy, runtime boundaries, replay
      limits, ID policy, template crosswalks, effect semantics, slot scaling, conditional behavior,
      metadata-only icons, and handoffs to EPIC-13, EPIC-14, EPIC-17, EPIC-20, and EPIC-21.
- [ ] `src/app/catalogs.ts`, editor behavior, local persistence/sharing, equipment UI, template
      compatibility, EPIC-03/04/10 promoted artifacts, and full stat analysis remain unchanged
      unless a documented blocker forces a separate planning amendment.
- [ ] `npm run verify` passes without live network access.
- [ ] README, data docs, script docs, compendium, generated files, QA state, tickets, sprint,
      ledger, and result manifests agree on IDs, paths, commands, versions, review scope,
      assumptions, limitations, and status.
- [ ] BW-1101 through BW-1106, EPIC-11, SPRINT-012, and `work/sprints/ledger.tsv` are marked
      complete only after all gates pass.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Source authority is incomplete, inconsistent, or too broad. | High | High | Make source-shape proof the first gate; require bounded hybrid approval and block for amendment before broadening. |
| Equipment template modifier IDs do not cover every accepted player-usable insignia. | Medium | High | Use schema-owned `InsigniaId` plus verified crosswalks by default; strengthen to required one-to-one IDs only if Phase 1 proves coverage. |
| One source page represents multiple insignias or mode variants. | Medium | High | Add same-page multi-variant fixtures and preserve per-record source keys, IDs, and provenance without duplicate fetches. |
| Slot scaling is inferred inconsistently by later callers. | Medium | High | Generate explicit head/chest/hands/legs/feet value maps and block promotion for missing deterministic slot values. |
| Conditional combat-state behavior is over-modeled as arithmetic. | Medium | High | Use controlled condition facts, note-only effects, unknown effects, and QA gates; defer truth evaluation to EPIC-21. |
| Profession-specific restrictions are joined by fragile name matching. | Medium | High | Join through EPIC-03 catalog records and dependency digests; block missing or ambiguous joins. |
| Source-authored prose leaks into runtime JSON. | Medium | High | Default to structured facts and bounded reviewed short text only; QA blocks unknown copied material. |
| Shared ingestion refactors regress EPIC-04 or EPIC-10. | Medium | High | Make reuse optional, require compatibility tests, and isolate EPIC-11 helpers if equivalence is not straightforward. |
| Fixture data misses live source anomalies. | Medium | High | Source-shape checkpoint and live discover gate must sample representative real pages before production promotion. |
| Reviewer bandwidth or live source access is unavailable. | Medium | High | Allow fixture/offline implementation to land, but leave BW-1105 and SPRINT-012 blocked until production source and review gates pass. |
| QA caps hide material errors. | Low | High | Treat overflow or material truncation as blocking and keep findings scoped to affected source keys and IDs. |
| Exact-path allowlisting exposes non-runtime artifacts. | Low | High | Use parent re-ignore rules, exact exceptions, `git check-ignore -v`, and final diff inspection. |
| Runtime payload churn follows audit-only changes. | Medium | Medium | Keep full audit detail in manifest/QA and make semantic version inputs explicit and tested. |
| Helper API drifts into a full equipment/stat calculator. | Medium | Medium | Keep helper instance-based and narrow; defer legality, armor shells, runes, titles, weapons, and totals. |
| Production snapshots remain ignored and are not retained. | Medium | Medium | Document retention limits and require retained selected inputs or a fresh bounded live acquisition/review for future refreshes. |

## Security

- Treat source titles, redirects, page bodies, templates, parameters, icon names, source plans,
  snapshot manifests, generated catalogs, QA evidence, baselines, and review notes as untrusted
  input.
- Permit network access only in explicit live mode with `--allow-live-network`, registered profile,
  GET-only JSON requests, fixed Guild Wars Wiki API origin, finite timeouts, retry caps,
  continuation caps, and response/request byte caps.
- Reject arbitrary endpoints, source-provided fetch URLs, final redirects outside the configured API
  origin, recursive crawls, credentials, cookies, tokens, and environment secrets.
- Parse wiki content as inert data. Never execute templates, Lua, HTML, JavaScript, CSS, links,
  shell snippets, or source-provided commands.
- Store insignia display data as structured facts or reviewed plain text only. Runtime UI must
  escape text and must not inject source text into `innerHTML`.
- Bound accepted pages, title lengths, parser bytes, template traversal, numeric ranges, slot value
  maps, effect counts, condition counts, evidence excerpts, output bytes, and QA findings.
- Preserve path confinement, safe slugs, symlink-escape checks where practical, atomic writes,
  finite-number checks, stable ordering, and SHA-256 verification.
- Do not use source titles, insignia names, source keys, or IDs directly as filesystem paths.
- Do not log or promote raw page bodies, response headers, absolute machine paths, local
  environment values, copied descriptions, or media bytes.
- Query icon metadata only and keep every runtime media record `cachedBytes: false`.
- Keep raw snapshots, source plans, snapshot-set manifests, candidate artifacts, QA summaries, logs,
  review scratch files, thumbnails, screenshots, and icon binaries ignored or absent.

## Dependencies

- `EPIC-01` / `SPRINT-002` for source policy, provenance, manual review, media restrictions, QA
  gates, exact-path promotion, and artifact retention rules.
- `EPIC-02` / `SPRINT-003` for the MediaWiki client, verified snapshots, `mwparserfromhell`,
  metadata-only icon resolution, canonical artifact writing, fixture/offline/live modes, and QA
  report format.
- `EPIC-03` / `SPRINT-004` for promoted profession IDs, section digests, artifact/manifest digests,
  and passing QA gates.
- `EPIC-04` / `SPRINT-005` for source-set planning, selected offline replay, section digests,
  semantic catalog versioning, compact runtime dispositions, and exact-path allowlisting precedent.
- `EPIC-10` / `SPRINT-011` for the closest armor-upgrade catalog precedent, metadata-only media
  pattern, effect-level stacking pattern, and blocked-promotion semantics. EPIC-10 is not a runtime
  data dependency for insignia records.
- `EPIC-09` / `SPRINT-010` for the current local-library/share schema boundary that continues to
  exclude authored equipment and insignia state.
- Future `EPIC-13` for armor shell and headgear records, `EPIC-14` for equipment editing and
  legality, `EPIC-17` for semantic equipment-template modifier resolution, `EPIC-20` for search and
  tooltip presentation, and `EPIC-21` for broad stat analysis.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and `npm run data:setup` for the pinned parser
  environment.
- Guild Wars Wiki availability is required for production discovery/fetch only. Fixture generation,
  tests, build, and `npm run verify` remain offline.
- Maintainer review capacity is required for source-set digest approval, source-policy
  dispositions, warning dispositions, first-baseline review, and any copied-text exception.

## Open Questions

No open question blocks drafting in non-interactive mode. Use these defaults unless implementation
proves they are wrong at a phase gate:

1. **Which source authority is complete?** Default to a bounded hybrid of equipment-template
   modifier evidence, an insignia overview/index, verified detail pages, and EPIC-03 joins. If this
   is incomplete, block for a recorded amendment rather than adding crawl behavior.
2. **Should `InsigniaId` anchor to equipment-template modifier IDs?** Default to schema-owned stable
   `InsigniaId` plus verified template modifier crosswalks. Strengthen to required one-to-one
   modifier IDs only if Phase 1 proves complete coverage and no conflicts.
3. **Which slot-scaling facts are source-clear enough for arithmetic?** Default to explicit
   per-slot value maps only when source evidence supports deterministic head/chest/hands/legs/feet
   values. Otherwise use note-only, unknown, or blocking QA based on consumer impact.
4. **How much conditional behavior should be structured?** Default to controlled condition facts
   when the predicate is source-clear, with condition truth and final stat application deferred to
   EPIC-21.
5. **How should PvE/PvP availability differences be represented?** Default to a mode availability
   field only when source-backed; otherwise `unknown` with QA evidence rather than inferred
   availability.
6. **Which QA findings block promotion?** Default to blocking critical/error findings for identity,
   source accounting, profession joins, deterministic slot scaling, required effects, artifact
   integrity, copied-text risk, release gates, and material QA truncation.
7. **Should a pure slot-effect helper be added?** Default to adding it only if contract tests need
   an executable boundary for per-slot values. The helper must remain lookup/display oriented and
   must not become an equipment legality or stat-total engine.
