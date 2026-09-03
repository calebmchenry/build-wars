---
id: SPRINT-013
title: Weapons and Mods Catalog
status: draft
source_target: BACKLOG
source_epic: EPIC-12
source_epic_path: work/tickets/12-weapons-and-mods/EPIC.md
tickets:
  - BW-1201
  - BW-1202
  - BW-1203
  - BW-1204
  - BW-1205
  - BW-1206
  - BW-1207
created: 2026-09-02
updated: 2026-09-02
---

# Sprint 013: Weapons and Mods Catalog

## Overview

This sprint turns `EPIC-12 Weapons and Mods` into deterministic, runtime-eligible weapon base and
weapon modifier catalogs for Build Wars. It extends the existing source-policy and EPIC-02 ingestion
platform, uses the promoted EPIC-03 professions/attributes catalog for requirement and attribute
joins, preserves EPIC-05 raw equipment-template fidelity, and promotes weapon base records separately
from weapon modifier records.

The sprint is content, ingestion, and domain-contract work. It does not add equipment editor UI,
weapon set controls, inventory persistence, share-url equipment payloads, dynamic catalog loading,
remote icon rendering, combat simulation, DPS/stat totals, acquisition guides, PvE skin
exhaustiveness, unique-item cataloging, economic data, party building, guide authoring, or runtime
wiki access. Current app behavior for the skill editor, local library, sharing, backup/restore,
promoted professions/attributes, skills, runes, insignias, and raw equipment template decode/export
must remain unchanged.

The default promotion shape is two runtime catalog artifacts:

- `data/generated/epic-12/weapons.catalog.json`
- `data/generated/epic-12/weapon-mods.catalog.json`

Each gets an adjacent generated manifest, and each gets a bounded QA report under
`data/qa/epic-12/`. Phase 1 may record a sprint amendment to use one combined catalog only if source
shape, QA accounting, and runtime contract clarity are demonstrably better. Even then, weapon base
records and modifier records must remain separate sections and separate domain concepts.

`src/domain` owns plain-data contracts, lookup outcomes, and at most a narrow pure compatibility
helper. `scripts/data/build_wars_ingest` owns source discovery, digest-bound fetch, selected offline
replay, extraction, semantic normalization, QA, and deterministic artifact writing. Runtime app code
may import promoted generated catalog JSON only through `src/app/catalogs.ts`; this sprint should not
wire EPIC-12 data into `src/app/catalogs.ts` or any current UI.

The non-interactive ticket-burn contract is executable without user interview. Source authority,
artifact split, identity policy, compatibility vocabulary, and non-waivable QA gates are resolved by
Phase 1 checkpoints. If a high-risk architecture choice cannot be settled from source evidence and
existing project policy, the executor records the blocker or amendment in the ticket/sprint/run
artifacts instead of broadening scope silently.

## Use Cases

1. **Offer legal weapon base choices later**: EPIC-14 can list weapon families, handedness,
   requirement attributes, damage facts, and allowed modifier slots without reading wiki pages or
   ingestion tooling.
2. **Offer legal modifier choices later**: EPIC-14 can filter prefixes, suffixes, inscriptions,
   staff heads, staff wrappings, shield/offhand modifiers, and caster-specific modifiers by
   source-backed compatibility facts.
3. **Warn about incompatible mods later**: A domain helper can explain wrong-family, wrong-slot,
   offhand/main-hand, missing-compatibility, duplicate-slot, and unknown-behavior cases without
   owning editor state or stat math.
4. **Resolve raw equipment template IDs later**: Known `TemplateEquipmentItemId` and
   `TemplateEquipmentModifierId` values can map to semantic catalog records while unknown,
   unsupported, ambiguous, or future IDs remain visible and preservable.
5. **Preserve exact raw template behavior**: EPIC-05 decode/export keeps raw slot, item, color, and
   modifier facts unchanged; EPIC-12 adds derived catalog lookups only.
6. **Represent requirements honestly**: Weapon requirements map to EPIC-03 attributes where possible
   and preserve unresolved or unsupported requirement facts rather than guessing from names.
7. **Represent hard effects conservatively**: Chance-based, conditional, HCT/HSR, mastery,
   enchantment, stance, and other hard-to-verify behavior can be structured notes or conservative
   typed facts until later analysis owns exact semantics.
8. **Audit and refresh data**: Maintainers can review one bounded source-plan digest, fetch only
   planned pages and icon metadata, replay one complete snapshot set offline, and trace every
   promoted record/disposition to source, manifest, QA, and review evidence.
9. **Hand off downstream ownership cleanly**: EPIC-13 owns armor/equipment shells, EPIC-14 owns
   equipment editor legality, EPIC-17 owns broader template resolution, EPIC-20 owns search/tooltips,
   and EPIC-21 owns complete stat/combat analysis.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Domain contracts | Weapon base and weapon modifier catalog envelopes, records, dependency summaries, source-set summaries, compact dispositions, identity registry summaries, template item/modifier crosswalks, requirement facts, damage facts, compatibility facts, effect variants, metadata-only media references, lookup outcomes, and a narrow pure compatibility explainer. | React, DOM/browser APIs, browser storage, network clients, app modules, generated manifest imports, QA report imports, source snapshots, data scripts, runtime source access, editor state, persisted equipment schema expansion, DPS, complete stat totals, or combat simulation. |
| Ingestion | One EPIC-12 profile, source-shape checkpoint, bounded source planning, source-plan digest review, digest-confirmed fetch, selected offline replay, extraction, semantic normalization, QA, deterministic artifacts, and exact-path promotion. | One-off weapon scraper, arbitrary crawler, source-provided URLs, recursive category expansion, browser automation, live network in `npm run verify`, source fetching from runtime code, or hand-authored production JSON. |
| Runtime data | Compact weapon and modifier records, structured facts, compact provenance references, runtime-relevant dispositions, section digests, semantic catalog versions, EPIC-03 dependency summaries, and metadata-only media records. | Raw page bodies, source plans, snapshot-set manifests, child snapshot paths, candidate outputs, QA summaries, full QA finding bodies, review scratch files, local absolute paths, icon bytes, thumbnails, screenshots, copied long source prose, or MediaWiki HTML. |
| Weapon bases | Player-usable weapon families, practical PvP equipment-template base coverage, bow variants, martial/caster weapons, shields, focuses, handedness, damage range/type, requirement attributes, allowed modifier slots, and item ID crosswalks. | Named PvE skin exhaustiveness, unique-item variants, acquisition/drop/vendor/collector data, campaign unlock prose, economy data, cosmetic dye behavior beyond raw pass-through, or armor shell records. |
| Weapon modifiers | Prefixes, suffixes, inscriptions, staff heads, staff wrappings, shield/offhand modifiers, caster modifier families, applicability, deterministic compatibility, structured effects, note-only effects, unknown effects, and modifier ID crosswalks. | Final equipment UI workflows, full damage formulas, chance simulation, skill-specific optimization, guide recommendations, or PvX/community prose. |
| Template integration | Non-mutating lookup/resolution views over decoded raw equipment template item and modifier IDs. | Replacing `src/template-compatibility/equipment-template.ts`, changing exact-source replay, lossy canonical export, or forcing every raw ID into a semantic record. |
| Closeout | README/data/script docs, compendium note, ticket status, sprint status, ledger sync, planning/execution manifests, and no-commit handoff. | Implementation commits or unrelated cleanup. |

### Source Authority

Phase 1 must approve a field-level source-authority matrix before schema freeze. The starting
authority is a bounded hybrid, not a crawler:

| Field | Preferred Evidence | Conflict Outcome |
| --- | --- | --- |
| Candidate membership | `Equipment template format` item/modifier rows, reviewed weapon/weapon-upgrade overview pages, planned detail pages, and explicit exclusions | Every candidate becomes an accepted record, supported relationship, exclusion, unsupported disposition, or blocker. Silent skips block promotion. |
| Weapon family and handedness | Verified base-type/detail pages and PvP template evidence | Conflicts become blockers unless one source class is explicitly preferred by amendment. |
| Damage range/type | Verified base weapon source fields or approved table rows | Missing optional facts may be unresolved; contradictory numeric damage facts block accepted structured values. |
| Requirement attributes | Verified source requirement labels joined through EPIC-03 | Unique joins become `AttributeId`; missing or ambiguous joins remain unresolved facts or blockers based on consumer impact. |
| Allowed modifier slots | Source-backed weapon/mod family rules and detail restrictions | Do not infer slots from prose-only assumptions; unknown slot behavior stays typed. |
| Modifier family/applicability | Prefix, suffix, inscription, staff-head, staff-wrapping, shield/offhand, and caster source evidence | Ambiguous family or applicability blocks compatibility claims but may permit note-only records. |
| Structured effects | Source-clear deterministic fields, reviewed transformation rules, and compact provenance | Chance-based or conditional behavior remains typed notes unless exact semantics are source-backed and needed now. |
| Template item crosswalks | `Equipment template format`, EPIC-05 raw equipment fixtures, and reviewed source fingerprints | Unknown, unsupported, historical, duplicate, or ambiguous IDs remain visible and do not mutate raw template documents. |
| Template modifier crosswalks | `Equipment template format`, modifier source evidence, and reviewed source fingerprints | Missing or conflicting mappings block only the affected crosswalk claim, not exact-source preservation. |
| Icon metadata | Verified source image fields plus MediaWiki `imageinfo` metadata | Metadata-only records may be warnings; media bytes, thumbnails, and screenshots are prohibited. |
| Display text | Build Wars-authored short text from structured facts or reviewed note codes | Copied source-authored prose is excluded unless a future explicit source-policy ticket approves it. |

Expected source families include PvP template weapon bases, player-usable weapon families, bow
variants, martial and caster weapons, shields/focuses, prefixes, suffixes, inscriptions, staff heads,
staff wrappings, shield/offhand modifiers, icon metadata, unsupported rows, and malformed source
shapes. Phase 1 owns exact seed titles, caps, source-plan structure, and any amendment.

### Identity And Crosswalk Policy

`WeaponId` and `WeaponModifierId` are schema-owned public catalog identities. They are keyed by
reviewed source identity and variant identity, not by template item/modifier IDs, source ordering,
array position, filesystem ordering, or API response ordering. After first promotion, ID reuse or
unreviewed ID churn is a blocking generated-data diff.

`TemplateEquipmentItemId` and `TemplateEquipmentModifierId` are crosswalk facts. Crosswalk records
must carry status such as `active`, `historical`, `unsupported`, `ambiguous`, or `excluded`, mode
scope where known, provenance, and source fingerprints. A raw equipment template ID can remain
unknown forever and still be preserved by EPIC-05 exact-source replay.

Weapon base records and modifier records stay separate even if one source plan generates both. Base
records own family, handedness, damage, requirements, allowed modifier slots, and item ID crosswalks.
Modifier records own modifier family, applicable weapon families, slot kind, structured effects, and
modifier ID crosswalks.

### Data Flow

```text
promoted EPIC-03 catalog + passing QA
        +
EPIC-05 raw equipment-template boundary
        +
bounded EPIC-12 source-shape checkpoint
  -> source authority, artifact split, ID policy, and caps approval
  -> source-plan digest and review
  -> digest-confirmed source/detail/icon metadata fetch
  -> complete EPIC-12 SourceSnapshotSetManifest
  -> selected offline replay with no network
  -> weapon base extraction and EPIC-03 joins
  -> modifier extraction and EPIC-03 joins
  -> semantic effects, requirements, compatibility, and crosswalk normalization
  -> weapons catalog JSON + weapon-mods catalog JSON
  -> generated manifests + bounded QA reports
  -> first-baseline review, exact-path promotion, docs, tickets, ledger, manifests
```

Fixture mode is synthetic and network-free. Live discovery/fetch is manual-only, fixed-origin, and
requires `--allow-live-network`. Offline replay requires one complete selected EPIC-12 snapshot-set
manifest and rejects partial, mixed-profile, extra, missing, duplicate, edited, dependency-mismatched,
plan-mismatched, path-escaping, or digest-mismatched inputs before extraction begins.

### Runtime Contract

Add contracts in `src/domain/catalog.ts` using local catalog style. Exact names may adjust to match
implementation, but these distinctions are acceptance requirements:

```text
WeaponBaseCatalog
  schemaVersion
  catalogVersion
  sectionDigests
  generatedAt
  generator
  profile: epic-12-weapons-mods
  dependencyDigests: EPIC-03 dependency summary
  sourceSet: compact EPIC-12 source-set summary
  identityRegistry: weapon identity registry summary
  dispositions: compact runtime-relevant base dispositions
  weapons: CatalogWeaponBaseRecord[]
  remoteMedia: RemoteMediaMetadata[]

WeaponModCatalog
  schemaVersion
  catalogVersion
  sectionDigests
  generatedAt
  generator
  profile: epic-12-weapons-mods
  dependencyDigests: EPIC-03 dependency summary
  sourceSet: compact EPIC-12 source-set summary
  identityRegistry: modifier identity registry summary
  dispositions: compact runtime-relevant modifier dispositions
  modifiers: CatalogWeaponModifierRecord[]
  remoteMedia: RemoteMediaMetadata[]
```

`CatalogWeaponBaseRecord` should include `WeaponId`, `sourceKey`, optional `variantKey`, canonical
name, normalized name, wiki URL, page identity, family key, handedness/equipment kind, damage
range/type facts, requirement facts, allowed modifier slot facts, item ID crosswalks, mode/support
facts, display state, nullable icon ID, and compact field provenance.

`CatalogWeaponModifierRecord` should include `WeaponModifierId`, `sourceKey`, optional `variantKey`,
canonical name, normalized name, wiki URL, page identity, modifier family, slot kind, applicable and
excluded weapon families, requirement/attribute references where source-backed, structured effects,
effect completeness, compatibility facts, modifier ID crosswalks, display state, nullable icon ID,
and compact field provenance.

The runtime catalogs may contain compact `sourceSet` and runtime-relevant dispositions, matching
EPIC-04/10/11 precedent. Full source plans, snapshot-set manifests, child snapshot paths, generated
manifests, QA bodies, review records, local paths, raw fields, and copied source prose stay outside
runtime imports.

### Effect And Compatibility Model

Model deterministic facts as data, not source prose. Minimum v1 effect families:

| Effect Kind | V1 Treatment |
| --- | --- |
| `damage-delta` / `damage-range` | Source-clear weapon or modifier numeric facts only; no DPS. |
| `attribute-rank-delta` | EPIC-03 `AttributeId` joins where source-clear; no effective-rank aggregation. |
| `maximum-health-delta` | Signed health facts where deterministic. |
| `maximum-energy-delta` | Signed energy facts where deterministic. |
| `armor-delta` / `armor-penetration` | Structured only when scope and subject are source-clear. |
| `casting-time-chance` / `skill-recharge-chance` | Preserve chance, subject, and scope as inert structured facts or note-only if exact semantics are unclear. |
| `enchantment-duration` / `stance-duration` / conditional facts | Typed notes or conservative structured effects unless source evidence supports exact semantics. |
| `mastery` / hard-to-verify effects | Start as note-only or unknown. |
| `note-only` | Build Wars-authored bounded note code; no arithmetic. |
| `unknown` | Accepted identity with unsupported or unresolved behavior; no arithmetic. |

A narrow pure helper may be added, for example
`explainWeaponModifierCompatibility(baseRecord, modifierRecord)`. It can return `compatible`,
`incompatible`, or `unresolved` with stable reason codes for family mismatch, slot mismatch,
handedness/offhand conflicts, duplicate/mutually exclusive slot facts when representable, missing
requirement data, unsupported modifier family, note-only effect, unknown effect, or malformed catalog
record. It must not select equipment, mutate weapon sets, evaluate attribute-rank satisfaction,
calculate stats, read generated files, fetch network data, import app modules, or own UI wording.

### Source Protocol And Retention

Register profile `epic-12-weapons-mods` with fixture/offline/live modes, EPIC-03 dependency checks,
metadata-only icon policy, exact output paths, and code-owned caps. Initial caps should be explicit
ceilings, for example ten seed pages, 160 detail pages, 160 media titles, 96 requests, three retries,
twelve continuation pages, 5 MiB response cap, 1 MiB parser cap, 24 MiB aggregate cap, 2 MiB per
runtime catalog cap, and 2 MiB per QA report cap. Phase 1 may tighten caps; raising them requires a
recorded amendment.

Because raw snapshots remain ignored, promotion must record retention limits. Future exact replay
requires the retained local selected snapshot set or a fresh bounded live discover/fetch and review.
The sprint must not claim stronger long-term reproducibility than retained evidence supports.

## Implementation

### Phase 1: BW-1201 Contracts, Source Shape, And Profile

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/weapon-mod-compatibility.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/weapon-catalog.test.ts`
- `test/domain/weapon-mod-catalog.test.ts`
- `test/domain/weapon-mod-compatibility.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `work/tickets/12-weapons-and-mods/BW-1201-weapon-mod-catalog-contracts-and-profile.md`

**Tasks:**

- [ ] Mark EPIC-12 and BW-1201 in progress when implementation starts; confirm SPRINT-001 through
      SPRINT-012 are complete and EPIC-01/02/03/05 dependencies are available.
- [ ] Run a bounded source-shape checkpoint for expected weapon base, modifier, inscription, staff,
      shield/offhand, caster, template ID, icon metadata, redirect, duplicate, unsupported, and
      malformed cases.
- [ ] Approve or amend source authority, artifact split, profile ID, caps, identity policy,
      crosswalk statuses, source-key/variant-key rules, compatibility vocabulary, and blocking QA
      classes before schema freeze.
- [ ] Define schema-v1 contracts for weapon base catalogs and weapon modifier catalogs, including
      profiles, dependency summaries, source-set summaries, dispositions, identity registry
      summaries, page identity, requirements, damage, compatibility, effects, display state,
      template crosswalks, and media metadata.
- [ ] Reuse `WeaponId`, `WeaponModifierId`, `TemplateEquipmentItemId`,
      `TemplateEquipmentModifierId`, `ProfessionId`, and `AttributeId`; do not create parallel ID
      namespaces.
- [ ] Preserve existing lightweight `Weapon`, `WeaponModifier`, and `WeaponSet` authored-build
      placeholders in `src/domain/equipment.ts` unless Phase 1 proves a narrow compatibility gap.
- [ ] Add lookup outcome contracts for weapon item IDs and weapon modifier IDs, including known,
      ambiguous, dispositioned, unsupported, and unknown outcomes.
- [ ] Add only a narrow compatibility helper contract if source facts justify it.
- [ ] Register `epic-12-weapons-mods` with fixture/offline/live modes, exact output paths, EPIC-03
      dependency checks, metadata-only icon policy, no runtime source access, and bounded caps.
- [ ] Preserve existing EPIC-02/03/04/10/11 profile behavior, output paths, default fixture
      regeneration, exit codes, and network-free verification.

**Phase Gate:**

- [ ] Source authority, artifact split, domain contracts, profile registration, runtime/audit split,
      and ID/crosswalk policy are settled or explicitly blocked.
- [ ] `src/domain` remains framework-neutral and imports no app modules, browser APIs, generated
      manifests, QA reports, source snapshots, or Python tooling.
- [ ] BW-1201 is marked done only after acceptance criteria and focused verification pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/weapon-mod-compatibility.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`

### Phase 2: BW-1202 Weapon Base Source Resolution And Extractors

**Files:**

- `scripts/data/build_wars_ingest/source_set_protocol.py`
- `scripts/data/build_wars_ingest/weapon_source_set.py`
- `scripts/data/build_wars_ingest/weapon_identity.py`
- `scripts/data/build_wars_ingest/weapon_identity_registry.json`
- `scripts/data/build_wars_ingest/weapon_extractor.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/wiki_tables.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_identity.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `test/fixtures/data-ingestion/weapons/`
- `work/tickets/12-weapons-and-mods/BW-1202-weapon-base-type-extractors.md`

**Tasks:**

- [ ] Mark BW-1202 in progress only after the Phase 1 gate passes.
- [ ] Build deterministic source-plan records for PvP template weapon bases, player-usable weapon
      families, bow variants, martial one-handed and two-handed weapons, caster weapons, shields,
      focuses, exclusions, and planned media metadata titles.
- [ ] Give every base candidate one terminal state: accepted weapon base, supported relationship,
      explicit exclusion, unsupported disposition, or blocking finding.
- [ ] Implement weapon identity registry allocation, non-reuse, tombstone, rename, split, merge,
      variant-key, and collision rules.
- [ ] Preserve requested, normalized, redirected, canonical, page ID, revision ID, source revision
      timestamp, retrieval timestamp, source family, source order, and dependency facts.
- [ ] Extract deterministic raw weapon base records with name, aliases, family, handedness,
      equipment kind, damage range/type, requirement labels, requirement rank where source-backed,
      allowed modifier slot evidence, template item ID evidence, page identity, icon candidate, and
      field-level provenance.
- [ ] Join requirement attributes through EPIC-03 unique attribute records; preserve unresolved
      labels instead of substring-only matching or numeric coincidence.
- [ ] Detect duplicate source keys, duplicate normalized names, duplicate item IDs, conflicting
      families, impossible handedness, invalid damage ranges, missing requirements, ambiguous
      attributes, unsupported rows, wrong-page shapes, redirects, missing icons, and parser loss.
- [ ] Resolve icons through metadata-only `imageinfo`; keep `iconId` nullable and never fetch media
      bytes.
- [ ] Add minimized synthetic fixtures for axe, sword, hammer, bow variants, dagger, scythe, spear,
      wand, staff, focus, shield, missing requirement, malformed damage, duplicate names, redirects,
      missing icons, unsupported base rows, and unknown source fields.
- [ ] Sort raw records and dispositions by stable registry/source keys regardless of request order,
      page order, batch order, filesystem order, or concurrent completion.

**Phase Gate:**

- [ ] Weapon base extraction accounts for every fixture and source-plan candidate.
- [ ] Accepted records have stable identity, source-traceable base facts, EPIC-03 joins or explicit
      unresolved requirement facts, and no copied long prose.
- [ ] BW-1202 is marked done only after acceptance criteria and focused verification pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_source_set build_wars_ingest.tests.test_weapon_identity build_wars_ingest.tests.test_weapon_extractor build_wars_ingest.tests.test_pipeline`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-mods --root work/runs/data-ingestion/epic-12-fixture-a --fixture-root test/fixtures/data-ingestion`
- `npm run test:run -- test/domain/weapon-catalog.test.ts`

### Phase 3: BW-1203 Modifier And Inscription Source Resolution

**Files:**

- `scripts/data/build_wars_ingest/weapon_mod_source_set.py`
- `scripts/data/build_wars_ingest/weapon_mod_identity.py`
- `scripts/data/build_wars_ingest/weapon_mod_identity_registry.json`
- `scripts/data/build_wars_ingest/weapon_mod_extractor.py`
- `scripts/data/build_wars_ingest/weapon_source_set.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/wiki_tables.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_mod_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_mod_identity.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_mod_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `test/fixtures/data-ingestion/weapon-mods/`
- `work/tickets/12-weapons-and-mods/BW-1203-upgrade-component-and-inscription-sources.md`

**Tasks:**

- [ ] Mark BW-1203 in progress only after the Phase 1 gate passes and coordinate with BW-1202
      source-plan structure.
- [ ] Build deterministic source-plan records for prefixes, suffixes, inscriptions, staff heads,
      staff wrappings, shield/offhand modifiers, caster HCT/HSR-style modifiers, exclusions, and
      planned media metadata titles.
- [ ] Give every modifier candidate one terminal state: accepted modifier, supported relationship,
      explicit exclusion, unsupported disposition, or blocking finding.
- [ ] Implement modifier identity registry allocation, non-reuse, tombstone, rename, split, merge,
      variant-key, and collision rules.
- [ ] Extract deterministic raw modifier records with name, aliases, modifier family, slot kind,
      applicable weapon families, excluded families, raw effect fields, requirement/attribute labels,
      template modifier ID evidence, page identity, icon candidate, and field-level provenance.
- [ ] Preserve unsupported source fields as bounded evidence for QA without copying source paragraphs
      into runtime artifacts.
- [ ] Join attribute references through EPIC-03 where possible and preserve unresolved labels
      otherwise.
- [ ] Detect duplicate source keys, duplicate normalized names, duplicate modifier IDs, ambiguous
      family names, incompatible applicability rows, missing icons, conflicting redirects,
      malformed effect rows, unsafe units, unsupported templates, and copied-text risk.
- [ ] Add minimized synthetic fixtures for martial prefixes/suffixes, inscriptions, staff
      heads/wrappings, caster HCT/HSR records, shield and focus modifiers, incompatible modifiers,
      duplicate IDs, ambiguous names, missing icons, malformed effect text, unsupported rows, and
      note-only effects.
- [ ] Keep live refresh manual-only, bounded, and replayable through selected snapshots.

**Phase Gate:**

- [ ] Modifier extraction accounts for every fixture and source-plan candidate.
- [ ] Accepted records have stable identity, source-traceable modifier facts, applicability facts,
      crosswalk evidence or explicit unresolved status, and no copied long prose.
- [ ] BW-1203 is marked done only after acceptance criteria and focused verification pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_mod_source_set build_wars_ingest.tests.test_weapon_mod_identity build_wars_ingest.tests.test_weapon_mod_extractor build_wars_ingest.tests.test_pipeline`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-mods --root work/runs/data-ingestion/epic-12-fixture-a --fixture-root test/fixtures/data-ingestion`
- `npm run test:run -- test/domain/weapon-mod-catalog.test.ts`

### Phase 4: BW-1204 Effect And Compatibility Semantics

**Files:**

- `scripts/data/build_wars_ingest/weapon_semantics.py`
- `scripts/data/build_wars_ingest/weapon_mod_semantics.py`
- `scripts/data/build_wars_ingest/weapon_catalog.py`
- `scripts/data/build_wars_ingest/weapon_mod_catalog.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_semantics.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_mod_semantics.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_mod_catalog.py`
- `src/domain/weapon-mod-compatibility.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/weapon-catalog.test.ts`
- `test/domain/weapon-mod-catalog.test.ts`
- `test/domain/weapon-mod-compatibility.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json`
- `test/fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json`
- `work/tickets/12-weapons-and-mods/BW-1204-weapon-mod-effect-and-compatibility-semantics.md`

**Tasks:**

- [ ] Mark BW-1204 in progress only after deterministic base and modifier extraction passes.
- [ ] Implement table-driven semantic normalization for damage, requirement, attribute bonus,
      health, energy, armor, casting-time chance, recharge chance, enchantment, stance, condition,
      mastery, inscription, note-only, and unknown effect families.
- [ ] Validate safe numeric ranges, sign, unit, precision, chance values, subject, mode scope,
      condition linkage, compatibility group keys, and provenance.
- [ ] Model deterministic compatibility between weapon base families and prefix, suffix,
      inscription, staff-head, staff-wrapping, shield/offhand, caster, and other verified modifier
      families.
- [ ] Keep chance-based, conditional, mastery, HCT/HSR, enchantment, stance, and hard-to-verify
      behavior as inert structured facts or note-only/unknown effects unless exact semantics are
      source-backed and accepted by QA.
- [ ] Give every accepted modifier a non-empty effect list or explicit note-only/unknown effect.
- [ ] Add `explainWeaponModifierCompatibility` only within the narrow base/mod compatibility
      boundary; do not evaluate equipped character attributes, choose weapon sets, calculate totals,
      or mutate records.
- [ ] Add TypeScript and Python fixtures for compatible/incompatible base-mod combinations, duplicate
      or mutually exclusive slot facts, two-handed/offhand conflicts, caster special cases, missing
      requirements, unsupported effect kinds, note-only/unknown effects, malformed records, and
      unchanged input objects.
- [ ] Prove compatibility output is deterministic under input ordering and stable across repeated
      fixed-clock fixture generation.

**Phase Gate:**

- [ ] Consumers can explain source-backed weapon/mod compatibility without editor state or stat math.
- [ ] Semantics do not overclaim chance, conditional, HCT/HSR, mastery, DPS, or combat behavior.
- [ ] BW-1204 is marked done only after acceptance criteria and focused verification pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/weapon-mod-compatibility.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_semantics build_wars_ingest.tests.test_weapon_mod_semantics build_wars_ingest.tests.test_weapon_catalog build_wars_ingest.tests.test_weapon_mod_catalog`

### Phase 5: BW-1205 Equipment Template ID Mapping

**Files:**

- `src/domain/catalog-lookup.ts`
- `src/domain/template.ts`
- `src/template-compatibility/equipment-template.ts`
- `src/template-compatibility/equipment-template-resolution.ts`
- `test/template-compatibility/equipment-template.test.ts`
- `test/template-compatibility/equipment-template-resolution.test.ts`
- `test/fixtures/template-compatibility/equipment-cases.json`
- `test/fixtures/data-ingestion/weapons/`
- `test/fixtures/data-ingestion/weapon-mods/`
- `scripts/data/build_wars_ingest/template_ids.py`
- `scripts/data/build_wars_ingest/weapon_template_ids.py`
- `scripts/data/build_wars_ingest/weapon_catalog.py`
- `scripts/data/build_wars_ingest/weapon_mod_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_template_ids.py`
- `scripts/data/build_wars_ingest/tests/test_template_ids.py`
- `work/tickets/12-weapons-and-mods/BW-1205-equipment-template-id-mapping.md`

**Tasks:**

- [ ] Mark BW-1205 in progress only after BW-1202, BW-1203, and BW-1204 gates pass.
- [ ] Use EPIC-05 raw equipment-template documents and fixtures as mapping inputs only; do not
      replace the codec or weaken exact-source replay.
- [ ] Add crosswalk records for verified weapon item IDs, verified weapon modifier IDs, slot
      families, dye/color pass-through facts when relevant, unsupported IDs, ambiguous IDs, and
      unresolved IDs.
- [ ] Add pure lookup outcomes for `TemplateEquipmentItemId` and `TemplateEquipmentModifierId` that
      distinguish known, ambiguous, dispositioned, unsupported, and unknown.
- [ ] Create a derived resolver beside the raw codec only if useful; it must accept caller-supplied
      catalogs and return a non-mutating view over decoded raw equipment template documents.
- [ ] Preserve raw numeric IDs, source fingerprints, original modifier ordering, slot IDs, color IDs,
      and source envelope facts whenever semantic lookup is unavailable or ambiguous.
- [ ] Add fixtures covering known weapon item IDs, known modifier IDs, unknown item IDs, unknown
      modifier IDs, duplicate/invalid slots, incompatible base/mod combinations, ambiguous
      crosswalks, unsupported IDs, and canonical-export guardrails.
- [ ] Prove EPIC-05 skill and raw equipment template compatibility tests remain compatible and that
      exact-source export still works for unchanged inputs.

**Phase Gate:**

- [ ] Semantic mapping is a derived view over raw template facts, not a lossy rewrite.
- [ ] Unknown and unsupported raw equipment template IDs remain visible and preservable.
- [ ] BW-1205 is marked done only after acceptance criteria and focused verification pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/template-compatibility/equipment-template.test.ts test/template-compatibility/equipment-template-resolution.test.ts test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_template_ids build_wars_ingest.tests.test_template_ids`

### Phase 6: BW-1206 Assembly, QA, Review, And Exact-Path Promotion

**Files:**

- `scripts/data/build_wars_ingest/weapon_catalog.py`
- `scripts/data/build_wars_ingest/weapon_mod_catalog.py`
- `scripts/data/build_wars_ingest/weapon_semantics.py`
- `scripts/data/build_wars_ingest/weapon_mod_semantics.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_mod_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/domain/weapon-catalog.test.ts`
- `test/domain/weapon-mod-catalog.test.ts`
- `test/domain/weapon-mod-compatibility.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json`
- `test/fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json`
- `.gitignore`
- `data/generated/epic-12/weapons.catalog.json`
- `data/generated/epic-12/weapons.catalog.manifest.json`
- `data/generated/epic-12/weapon-mods.catalog.json`
- `data/generated/epic-12/weapon-mods.catalog.manifest.json`
- `data/qa/epic-12/weapons.catalog.qa.json`
- `data/qa/epic-12/weapon-mods.catalog.qa.json`
- `work/tickets/12-weapons-and-mods/BW-1206-weapons-mods-catalog-qa-and-promotion.md`

**Tasks:**

- [ ] Mark BW-1206 in progress only after source-set, extraction, semantics, and template mapping
      gates pass.
- [ ] Assemble canonical weapon and modifier catalog sections with dependency facts, source-set
      summaries, compact dispositions, identity registry facts, crosswalks, records, effects,
      compatibility facts, remote media, provenance, section digests, and semantic catalog versions.
- [ ] Define semantic digest inputs: consumer-visible identity, names, lookup keys, families,
      handedness, damage, requirements, slots, compatibility, effects, template crosswalks,
      display fields, runtime media, runtime-relevant dispositions, identity summaries, and EPIC-03
      dependency facts.
- [ ] Exclude generatedAt, version values, local paths, manifest paths, QA paths, retrieval-only
      timestamps, raw snapshots, source plans, snapshot-set manifests, full QA bodies, review bodies,
      source page bodies, and ignored evidence from semantic digest inputs.
- [ ] Add QA for source accounting, zero-output rejection, ID non-reuse, source-key uniqueness,
      variant collisions, duplicate normalized names, page resolution, EPIC-03 joins, damage and
      requirement facts, handedness, modifier slots, compatibility gaps, effects, note-only/unknown
      behavior, template crosswalk integrity, unresolved template IDs, copied-text policy, icon
      metadata, output caps, section digests, semantic digest scope, baseline diffs, and artifact
      integrity.
- [ ] Keep stable finding IDs independent of request order, absolute paths, and wall-clock time. QA
      overflow or material truncation is blocking.
- [ ] Generate the synthetic EPIC-12 fixture twice into separate ignored roots under a fixed clock
      and prove byte identity for catalog, manifest, QA JSON, section digests, source/disposition
      order, identity registry summaries, effect order, and finding IDs.
- [ ] Run bounded live `discover`; review source identities, candidate counts, base/mod family
      coverage, template ID ranges, unresolved/disposition counts, icon decisions, caps, dependency
      facts, artifact split, and source-set digest before fetch.
- [ ] Run digest-confirmed `fetch` only with the reviewed source plan and exact
      `--confirm-source-set-digest`; retain or document the selected evidence set.
- [ ] Replay the selected complete snapshot set offline twice under a fixed clock and require
      byte-identical catalog, manifest, QA report, section digests, and finding IDs.
- [ ] Perform first-baseline review with counts, ID gaps, registry/tombstones, crosswalks,
      family/slot coverage, compatibility findings, note-only/unknown classes, section/dependency
      digests, artifact digests, QA digests, and app/public gate evidence.
- [ ] Generate approved production bytes only from selected offline inputs. Never hand-edit promoted
      catalog, manifest, or QA JSON.
- [ ] Add exact `.gitignore` parent and file exceptions only for approved EPIC-12 artifacts. Verify
      source plans, snapshot sets, raw snapshots, candidates, QA summaries, logs, media bytes, and
      arbitrary siblings remain ignored or absent.
- [ ] Mark BW-1206 done only after exact files exist, both release gates pass, every warning has a
      bounded disposition, and evidence is recorded.

**Phase Gate:**

- [ ] Catalogs, manifests, QA, exact paths, source retention notes, and allowlist behavior are
      internally consistent.
- [ ] Both `appConsumptionGate` and `publicReleaseGate` pass for the promoted runtime catalog scope.
- [ ] BW-1206 is marked done only after acceptance criteria and focused verification pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-mods --root work/runs/data-ingestion/epic-12-fixture-a --fixture-root test/fixtures/data-ingestion`
- Repeat fixture generation into `work/runs/data-ingestion/epic-12-fixture-b` with the same fixed
  clock and compare weapon catalog, modifier catalog, manifests, and QA JSON byte-for-byte.
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-12-weapons-mods --root work/runs/data-ingestion/epic-12-live --allow-live-network --stage discover`
- Run `fetch` with reviewed `--source-plan` and exact `--confirm-source-set-digest`, then run
  `offline --profile epic-12-weapons-mods --snapshot-set <selected-manifest>` twice under a fixed
  clock.
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_catalog build_wars_ingest.tests.test_weapon_mod_catalog build_wars_ingest.tests.test_artifacts build_wars_ingest.tests.test_qa build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `npm run test:run -- test/domain/data-ingestion-contracts.test.ts test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/weapon-mod-compatibility.test.ts`
- `git check-ignore -v data/generated/epic-12/weapons.catalog.json data/generated/epic-12/weapons.catalog.manifest.json data/generated/epic-12/weapon-mods.catalog.json data/generated/epic-12/weapon-mods.catalog.manifest.json data/qa/epic-12/weapons.catalog.qa.json data/qa/epic-12/weapon-mods.catalog.qa.json`
- `git status --short`

### Phase 7: BW-1207 Documentation, Verification, And Closeout

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `data/source-snapshots/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/weapons-and-mods-catalog.md`
- `compendium/README.md`
- `work/tickets/12-weapons-and-mods/EPIC.md`
- `work/tickets/12-weapons-and-mods/BW-1201-weapon-mod-catalog-contracts-and-profile.md`
- `work/tickets/12-weapons-and-mods/BW-1202-weapon-base-type-extractors.md`
- `work/tickets/12-weapons-and-mods/BW-1203-upgrade-component-and-inscription-sources.md`
- `work/tickets/12-weapons-and-mods/BW-1204-weapon-mod-effect-and-compatibility-semantics.md`
- `work/tickets/12-weapons-and-mods/BW-1205-equipment-template-id-mapping.md`
- `work/tickets/12-weapons-and-mods/BW-1206-weapons-mods-catalog-qa-and-promotion.md`
- `work/tickets/12-weapons-and-mods/BW-1207-weapons-mods-runtime-docs-and-closeout.md`
- `work/sprints/SPRINT-013.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-12-result.json`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-013-result.json`

**Tasks:**

- [ ] Mark BW-1207 in progress only after Phase 6 promotion passes.
- [ ] Document source authority, final caps, artifact split, identity and crosswalk policy, staged
      commands, selected offline replay, retention limits, metadata-only icon policy, QA gates,
      first-baseline review, semantic digest scope, and exact promoted paths.
- [ ] State that only the approved EPIC-12 runtime catalog JSON paths are runtime-eligible. Manifests,
      QA reports, source plans, snapshot sets, raw snapshots, candidate outputs, QA summaries, review
      evidence, Python tooling, and media bytes remain non-runtime.
- [ ] Document that `src/app/catalogs.ts` is the only allowed future runtime generated-catalog import
      boundary and that this sprint intentionally leaves app imports/UI unchanged.
- [ ] Document EPIC-13/14/17/20/21 handoffs for equipment shells, weapon set editing, compatibility
      warnings, raw equipment-template resolution, search/tooltips, and full stat/combat analysis.
- [ ] Record unresolved or intentionally note-only weapon/mod behavior, especially chance-based,
      conditional, HCT/HSR, mastery, enchantment, stance, and hard-to-verify effects.
- [ ] Confirm current editor, local persistence, sharing, backup/restore, template compatibility,
      promoted EPIC-03/04/10/11 catalogs, app import boundaries, and raw equipment template
      exact-source behavior are unchanged.
- [ ] Inspect the worktree for raw snapshots, source plans, snapshot-set manifests, candidate
      outputs, QA summaries, media bytes, screenshots, copied prose, broad allowlists, secrets,
      absolute machine paths, nondeterministic timestamps, and unrelated changes.
- [ ] Add verification and artifact evidence to BW-1201 through BW-1207. Mark tickets done only after
      their phase gates pass. Mark EPIC-12, SPRINT-013, and the ledger completed together only after
      the full Definition of Done passes.
- [ ] Write the ticket-burn execution result manifest with matching sprint, epic, ticket IDs, changed
      file summary, validation results, blockers, follow-ups, and `commit_created: false`.
- [ ] Do not create a commit.

**Phase Gate:**

- [ ] Docs, promoted artifacts, QA state, tickets, sprint, ledger, and result manifests agree on IDs,
      paths, commands, versions, review scope, assumptions, limitations, and status.
- [ ] `npm run verify` passes without live network access.
- [ ] BW-1207 is marked done only after acceptance criteria and focused verification pass.

**Verification:**

- `npm run data:regenerate`
- Direct EPIC-12 fixed-clock fixture regeneration
- `npm run verify`
- `rg -n 'EPIC-12|BW-120[1-7]|SPRINT-013' work/tickets/12-weapons-and-mods work/sprints`
- `git status --short`
- Manual consistency review across docs, generated files, QA state, tickets, sprint, ledger, and
  result manifests

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Add weapon base and weapon modifier catalog contracts, records, dependencies, source-set summaries, dispositions, identity summaries, crosswalks, requirements, damage, compatibility, effects, display states, and media refs. |
| `src/domain/catalog-lookup.ts` | Modify | Add lookup outcomes for weapon item IDs, weapon modifier IDs, catalog IDs, names, dispositions, ambiguity, unsupported, and unknown states. |
| `src/domain/weapon-mod-compatibility.ts` | Create if justified | Explain source-backed base/mod compatibility without editor state, attribute satisfaction, or stat totals. |
| `src/domain/index.ts` | Modify | Export EPIC-12 contracts and helper APIs. |
| `src/domain/ids.ts` | Reference only | Reuse existing `WeaponId`, `WeaponModifierId`, `TemplateEquipmentItemId`, and `TemplateEquipmentModifierId`. |
| `src/domain/equipment.ts` | Reference only | Preserve lightweight authored weapon-set placeholders; avoid equipment schema/UI expansion unless Phase 1 proves a narrow gap. |
| `src/app/catalogs.ts` | Reference only | Preserve current runtime import boundary; do not import EPIC-12 data during this sprint. |
| `src/domain/template.ts` | Reference only or narrow type use | Preserve raw equipment template document shape and ID brands. |
| `src/template-compatibility/equipment-template.ts` | Reference only | Preserve decode/export fidelity and exact-source replay. |
| `src/template-compatibility/equipment-template-resolution.ts` | Create only if needed | Add a pure derived resolution view over decoded raw equipment template docs and caller-supplied catalogs. |
| `scripts/data/build_wars_ingest/config.py` | Modify | Add EPIC-12 source/profile/output caps. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register `epic-12-weapons-mods`, fixed sources, paths, dependency, modes, and caps. |
| `scripts/data/build_wars_ingest/source_set_protocol.py` | Reuse/modify narrowly | Share plan/replay safety primitives without regressing EPIC-04/10/11. |
| `scripts/data/build_wars_ingest/weapon_source_set.py` | Create | Plan, digest, resolve, and account for weapon base source candidates. |
| `scripts/data/build_wars_ingest/weapon_identity.py` | Create | Own weapon identity registry allocation, tombstones, and migration checks. |
| `scripts/data/build_wars_ingest/weapon_identity_registry.json` | Create | Persist reviewed weapon public ID/source-key/variant-key registry. |
| `scripts/data/build_wars_ingest/weapon_extractor.py` | Create | Extract weapon family, handedness, damage, requirements, item crosswalks, page facts, and icon metadata. |
| `scripts/data/build_wars_ingest/weapon_semantics.py` | Create | Normalize base weapon facts, requirements, damage, slots, dispositions, and semantic validation. |
| `scripts/data/build_wars_ingest/weapon_catalog.py` | Create | Assemble weapon catalog, section digests, semantic version, QA diagnostics, and manifest evidence. |
| `scripts/data/build_wars_ingest/weapon_mod_source_set.py` | Create | Plan, digest, resolve, and account for modifier/inscription source candidates. |
| `scripts/data/build_wars_ingest/weapon_mod_identity.py` | Create | Own modifier identity registry allocation, tombstones, and migration checks. |
| `scripts/data/build_wars_ingest/weapon_mod_identity_registry.json` | Create | Persist reviewed modifier public ID/source-key/variant-key registry. |
| `scripts/data/build_wars_ingest/weapon_mod_extractor.py` | Create | Extract modifier families, applicability, raw effects, modifier crosswalks, page facts, and icon metadata. |
| `scripts/data/build_wars_ingest/weapon_mod_semantics.py` | Create | Normalize effects, compatibility, note-only/unknown behavior, and semantic validation. |
| `scripts/data/build_wars_ingest/weapon_mod_catalog.py` | Create | Assemble modifier catalog, section digests, semantic version, QA diagnostics, and manifest evidence. |
| `scripts/data/build_wars_ingest/weapon_template_ids.py` | Create | Parse and validate template item/modifier crosswalk evidence for EPIC-12. |
| `scripts/data/build_wars_ingest/template_ids.py` | Modify narrowly | Reuse shared template row parsing where existing contracts are insufficient. |
| `scripts/data/build_wars_ingest/models.py` | Modify narrowly | Add shared staged-source, identity, crosswalk, or QA models only where needed. |
| `scripts/data/build_wars_ingest/icons.py` | Modify narrowly | Reuse metadata-only icon resolution for weapon and modifier records. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Support EPIC-12 artifact writing, manifests, semantic projections, and baseline comparisons. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add EPIC-12 coverage, policy, compatibility, crosswalk, digest, and gate findings. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate EPIC-12 fixture, discover, fetch, offline replay, generation, QA, and promotion. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Expose EPIC-12 profile/stage/source-plan/confirmation/snapshot-set options safely. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Cover profile compatibility, source planning, identity, extraction, semantics, crosswalks, QA, determinism, replay, and CLI behavior. |
| `test/domain/contracts.test.ts` | Modify | Protect catalog wire shape and domain boundary expectations. |
| `test/domain/weapon-catalog.test.ts` | Create | Verify weapon base catalog shape, IDs, requirements, damage, slots, crosswalks, lookups, and digests. |
| `test/domain/weapon-mod-catalog.test.ts` | Create | Verify modifier catalog shape, families, effects, applicability, crosswalks, lookups, and digests. |
| `test/domain/weapon-mod-compatibility.test.ts` | Create | Verify compatibility outcomes, reason codes, unresolved behavior, and no mutation. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Validate Python-generated EPIC-12 JSON against TypeScript expectations. |
| `test/template-compatibility/equipment-template-resolution.test.ts` | Create if resolver exists | Prove semantic resolution is non-mutating and preserves raw IDs. |
| `test/fixtures/template-compatibility/equipment-cases.json` | Modify narrowly | Add known/unknown weapon and modifier ID mapping cases while preserving EPIC-05 fixtures. |
| `test/fixtures/data-ingestion/weapons/` | Create | Store minimized synthetic source, redirect, malformed, compatibility, and icon metadata fixtures for base weapons. |
| `test/fixtures/data-ingestion/weapon-mods/` | Create | Store minimized synthetic source, malformed, applicability, effect, and icon metadata fixtures for modifiers. |
| `test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json` | Create | Store deterministic synthetic golden weapon catalog. |
| `test/fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json` | Create | Store deterministic synthetic golden modifier catalog. |
| `data/generated/epic-12/weapons.catalog.json` | Create/allowlist | Promote runtime-eligible weapon base catalog. |
| `data/generated/epic-12/weapons.catalog.manifest.json` | Create/allowlist | Promote selected-input, dependency, digest, retention, and review evidence for weapons. |
| `data/generated/epic-12/weapon-mods.catalog.json` | Create/allowlist | Promote runtime-eligible weapon modifier catalog. |
| `data/generated/epic-12/weapon-mods.catalog.manifest.json` | Create/allowlist | Promote selected-input, dependency, digest, retention, and review evidence for modifiers. |
| `data/qa/epic-12/weapons.catalog.qa.json` | Create/allowlist | Promote bounded QA findings and release-gate evidence for weapons. |
| `data/qa/epic-12/weapon-mods.catalog.qa.json` | Create/allowlist | Promote bounded QA findings and release-gate evidence for modifiers. |
| `.gitignore` | Modify narrowly | Allowlist only approved EPIC-12 parent directories and exact promoted artifacts. |
| `README.md` | Modify | Document EPIC-12 catalog boundary, commands, and unchanged app scope. |
| `scripts/data/README.md` | Modify | Document EPIC-12 profile, sources, caps, staged commands, replay, and troubleshooting. |
| `data/README.md` | Modify | Add EPIC-12 lifecycle, runtime boundary, and retained/ignored artifact rules. |
| `data/generated/README.md` | Modify | Document exact EPIC-12 catalog/manifest promotion and determinism. |
| `data/qa/README.md` | Modify | Document EPIC-12 QA reports, gates, dispositions, and non-runtime boundary. |
| `data/source-snapshots/README.md` | Modify | Document EPIC-12 snapshot retention and selected replay limits. |
| `compendium/data-ingestion-platform.md` | Modify | Record EPIC-12 profile, replay behavior, source protocol, and promoted paths. |
| `compendium/weapons-and-mods-catalog.md` | Create | Preserve source authority, schema, compatibility, crosswalk, QA, and downstream handoffs. |
| `compendium/README.md` | Modify | Index the weapons and mods catalog note. |
| `work/tickets/12-weapons-and-mods/*.md` | Modify during execution | Track status, sprint linkage, assumptions, evidence, blockers, and closeout. |
| `work/sprints/SPRINT-013.md` | Create/update | Executable sprint plan and later execution checklist state. |
| `work/sprints/ledger.tsv` | Modify | Track SPRINT-013 lifecycle. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-12-result.json` | Create during planning | Required non-interactive ticket-burn planning manifest. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-013-result.json` | Create during execution | Required non-interactive ticket-burn execution manifest. |

## Definition of Done

### Source And Identity

- [ ] Field-level source authority, exact seed titles, caps, artifact split, identity policy,
      crosswalk statuses, and compatibility vocabulary are approved before schema freeze.
- [ ] Every source candidate becomes an accepted record, supported relationship, explicit exclusion,
      unsupported disposition, or blocking finding.
- [ ] `WeaponId` and `WeaponModifierId` assignment is registry-backed or otherwise explicitly
      reviewed, source-order independent, collision checked, non-reused, and guarded by rename,
      tombstone, split, merge, supersession, and migration rules.
- [ ] Template item and modifier IDs are structured crosswalk facts, not public identity.
- [ ] Unknown, unsupported, ambiguous, historical, or future raw template item/modifier IDs remain
      visible and preservable.

### Runtime Contract

- [ ] Weapon and modifier catalogs are framework-neutral, JSON-compatible, schema-versioned, and
      exported through `src/domain`.
- [ ] `src/domain` imports no React, DOM/browser APIs, browser storage, network clients, app modules,
      generated manifests, QA reports, source snapshots, or Python modules.
- [ ] Weapon records include stable ID, source key, name, lookup key, page identity, family,
      handedness, damage facts, requirement facts, allowed modifier slots, template item crosswalks,
      display state, nullable icon ID, and compact provenance.
- [ ] Modifier records include stable ID, source key, name, lookup key, page identity, family, slot
      kind, applicability, compatibility facts, structured/note/unknown effects, template modifier
      crosswalks, display state, nullable icon ID, and compact provenance.
- [ ] Runtime JSON excludes raw page bodies, source plans, snapshot-set manifests, local paths, full
      QA bodies, review bodies, copied long prose, MediaWiki HTML, icon bytes, screenshots,
      thumbnails, and source-provided commands.
- [ ] `src/app/catalogs.ts` and current UI behavior remain unchanged.

### Ingestion And Replay

- [ ] EPIC-12 is implemented through the existing ingestion profile, fixture, live discover/fetch,
      selected offline replay, artifact, and QA framework.
- [ ] Fixture mode is synthetic, minimized, deterministic, and network-free.
- [ ] Live fetch requires `--allow-live-network`, registered `epic-12-weapons-mods`, exact
      source-plan path, exact source-set digest, fixed Guild Wars Wiki API origin, and bounded caps.
- [ ] Offline replay requires one complete EPIC-12 snapshot-set manifest and rejects unsafe,
      incomplete, duplicate, mixed, plan-mismatched, dependency-mismatched, path-escaping, or
      digest-mismatched inputs.
- [ ] Existing EPIC-02/03/04/10/11 profile behavior, fixture generation, promoted artifacts, and
      tests remain compatible.

### Semantics And Compatibility

- [ ] Damage, requirement, handedness, modifier slots, template crosswalks, compatibility, and effects
      are source-traceable typed facts.
- [ ] Deterministic compatibility can be explained for known base/mod pairs without editor state,
      attribute-rank satisfaction, or stat totals.
- [ ] Chance-based, conditional, mastery, HCT/HSR, enchantment, stance, and hard-to-verify behavior
      remains conservative structured data, note-only, unknown, or blocking based on source evidence.
- [ ] Structured effects do not claim DPS, full damage formulas, complete health/energy totals, title
      effects, or combat simulation.
- [ ] Pure helpers do not mutate catalogs, read files, fetch data, import app modules, or cache
      catalog truth without version context.

### QA And Promotion

- [ ] Weapon and modifier fixture catalogs, production catalogs, manifests, QA JSON, section digests,
      semantic catalog versions, source/disposition/effect order, identity registry summaries, and
      finding IDs are byte-identical across repeated fixed-clock fixture and selected offline runs.
- [ ] Semantic digest inputs and audit-only exclusions are documented and mutation-tested.
- [ ] QA covers source accounting, zero-output rejection, ID/crosswalk integrity, page resolution,
      EPIC-03 joins, family/handedness/damage/requirement facts, modifier slot compatibility,
      effects, copied text, media metadata, caps, baselines, gate predicates, and artifact integrity.
- [ ] QA overflow, silent truncation, unresolved core identity, failed source-clear deterministic
      values, unknown copied material, unsafe paths, incomplete replay, unreadable artifacts, and
      digest/integrity mismatch are release-blocking.
- [ ] Both `appConsumptionGate` and `publicReleaseGate` pass for the promoted scope.
- [ ] Only exact EPIC-12 catalog, manifest, and QA JSON paths are allowlisted; representative raw,
      candidate, summary, media, and sibling byproduct paths remain ignored.

### Closeout

- [ ] Documentation explains source authority, exact paths, commands, runtime boundaries, ID/crosswalk
      policy, compatibility facts, effect vocabulary, metadata-only media, retention limits, QA
      gates, and downstream handoffs.
- [ ] Current editor, local persistence, sharing, backup/restore, template compatibility, promoted
      EPIC-03/04/10/11 catalogs, app import boundaries, and raw equipment template exact-source
      behavior are unchanged.
- [ ] BW-1201 through BW-1207, EPIC-12, SPRINT-013, `work/sprints/ledger.tsv`, and result manifests
      are status-consistent.
- [ ] `npm run verify` passes without live network access.
- [ ] The ticket-burn execution manifest records `commit_created: false`.
- [ ] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Source authority for weapon bases or modifiers is incomplete, inconsistent, or too broad. | High | High | Make source-shape proof and authority approval the first gate; require amendment before adding sources or raising caps. |
| Weapon bases and named weapon skins get conflated. | Medium | High | Scope v1 to practical base/PvP template coverage and item ID crosswalks; exclude named skin exhaustiveness and acquisition data. |
| Template item IDs or modifier IDs are mistaken for stable public catalog IDs. | Medium | High | Keep `WeaponId` and `WeaponModifierId` schema-owned; model template IDs as crosswalks with statuses and provenance. |
| Raw equipment template exact-source behavior becomes lossy. | Low | High | Keep EPIC-05 codec unchanged and add only non-mutating derived lookup/resolution views. |
| Compatibility rules overclaim source evidence. | Medium | High | Require source-backed slot/family rules, typed unresolved outcomes, and fixtures for unknown/incompatible cases. |
| HCT/HSR, mastery, chance, or conditional behavior becomes false arithmetic. | High | High | Default to inert structured chance facts, note-only effects, or unknown effects unless exact semantics are reviewed. |
| Requirement joins mis-map attributes by name similarity. | Medium | High | Join through EPIC-03 unique records with collision tests and unresolved labels. |
| Artifact split creates duplicated source-plan or QA logic. | Medium | Medium | Use one EPIC-12 profile/source plan by default and two runtime artifact assemblies; amend only if combined catalog is cleaner. |
| Shared source protocol changes regress prior profiles. | Medium | High | Reuse helpers narrowly and run EPIC-04/10/11 regression tests. |
| Fixture data misses live source anomalies. | Medium | High | Require live discovery, source-plan review, selected snapshot replay, and first-baseline review before production promotion. |
| Source-authored prose leaks into runtime JSON. | Medium | High | Prefer structured facts and Build Wars-authored notes; QA blocks unknown copied material. |
| QA caps hide material errors. | Low | High | Treat QA overflow and material truncation as blocking. |
| Exact allowlists expose ignored byproducts. | Low | High | Use exact parent/file exceptions, `git check-ignore -v`, and final diff inspection. |
| Review capacity or live source access is unavailable. | Medium | Medium | Leave BW-1206/BW-1207 and SPRINT-013 blocked rather than promoting fixture-only data. |
| Future app work imports manifests or QA reports. | Low | High | Document `src/app/catalogs.ts` as the only runtime catalog import boundary and keep app code unchanged now. |

## Security Considerations

- Treat source titles, redirects, page bodies, templates, parameters, source plans, snapshot
  manifests, generated catalogs, QA evidence, baselines, review notes, item IDs, modifier IDs, and
  icon metadata as untrusted input.
- Permit network access only in explicit live mode with `--allow-live-network`, the registered
  profile, GET-only JSON requests, fixed Guild Wars Wiki API origin, final-origin checks, finite
  timeouts, retry caps, continuation caps, and response/request/page byte caps.
- Reject arbitrary endpoints, source-provided fetch URLs, recursive crawls, credentials, cookies,
  tokens, environment secrets, absolute child paths, `..` traversal, symlink escape, mixed roots,
  duplicate children, and digest mismatch.
- Parse wiki content as inert data. Never execute templates, Lua, HTML, JavaScript, CSS, links, shell
  snippets, or source-authored expressions.
- Runtime JSON is inert data. Future UI must render names, notes, and source-derived text as escaped
  text, never `innerHTML`.
- Bound accepted pages, title lengths, parser bytes, template traversal, numeric ranges, chance
  values, effect counts, compatibility facts, evidence excerpts, output bytes, and QA findings.
- Query icon metadata only and keep runtime media records `cachedBytes: false`; do not store media
  bytes, thumbnails, screenshots, data URLs, or source media in fixtures or runtime bundles.
- Source-policy classification remains field-level. Unknown copied material, digest mismatch, and
  unreadable artifacts remain non-waivable for public release.
- No new npm or Python dependency is planned. Any required dependency triggers supply-chain review
  and a sprint amendment.

## Dependencies

- `EPIC-01` / `SPRINT-002`: source policy, provenance, media restrictions, manual review, QA gates,
  exact-path promotion, and artifact retention.
- `EPIC-02` / `SPRINT-003`: MediaWiki client, snapshots, parser adapter, metadata-only icons,
  canonical artifact writing, fixture/offline/live modes, and QA report framework.
- `EPIC-03` / `SPRINT-004`: promoted profession/attribute catalog, dependency digests, section
  digests, requirement/attribute joins, and passing QA gates.
- `EPIC-04` / `SPRINT-005`: source-set planning, selected offline replay, semantic digests, compact
  runtime dispositions, and exact-path allowlisting precedent.
- `EPIC-05` / `SPRINT-006`: raw skill/equipment template decode/export contracts, exact-source
  fidelity, raw item/modifier ID namespaces, and non-lossy resolution boundary.
- `EPIC-10` / `SPRINT-011`: armor-upgrade catalog precedent for source authority, metadata-only
  media, effect semantics, QA, and blocked promotion.
- `EPIC-11` / `SPRINT-012`: closest precedent for registry-backed identity, crosswalks, selected
  replay checks, exact-path promotion, and inert conditional effects.
- Future `EPIC-13`, `EPIC-14`, `EPIC-17`, `EPIC-20`, and `EPIC-21` consume EPIC-12 outputs for
  equipment shells, editor legality, semantic template resolution, search/tooltips, and stat/combat
  analysis.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and `npm run data:setup` for the pinned parser
  environment.
- Guild Wars Wiki availability is required only for production live discover/fetch. Fixture
  generation, tests, build, and `npm run verify` remain offline.
- Maintainer review capacity is required for source-plan approval, source-policy dispositions,
  warning dispositions, first-baseline review, and any copied-text exception.

## Open Questions

No open question blocks execution in this non-interactive plan. Use these defaults unless a phase
gate disproves them:

1. Promote separate `weapons.catalog.json` and `weapon-mods.catalog.json` artifacts. Amend to one
   combined catalog only if Phase 1 proves it improves runtime and QA clarity.
2. Use one profile, `epic-12-weapons-mods`, with one reviewed source plan and two default runtime
   artifact assemblies.
3. Keep `WeaponId` and `WeaponModifierId` schema-owned and registry-backed; keep template item and
   modifier IDs as crosswalk facts.
4. Prioritize practical PvP equipment-template coverage and player-usable weapon/mod families over
   PvE skin exhaustiveness, acquisition data, unique items, recommendations, and economy data.
5. Start HCT/HSR, mastery, chance-based, conditional, enchantment, and stance behavior as inert
   structured facts, note-only effects, or unknown effects unless exact source evidence supports a
   deterministic claim.
6. Add a pure compatibility helper only if it can stay within base/mod family and slot explanation;
   leave equipment set state, legality, attribute satisfaction, and totals to later epics.
7. If live source acquisition, selected replay, first-baseline review, or QA closeout cannot complete,
   mark the affected ticket and sprint blocked rather than promoting fixture-only data.
8. Planning and execution may update sprint, draft, ticket, ledger, run-state, and result-manifest
   records under the ticket-burn contract; implementation must not create commits.