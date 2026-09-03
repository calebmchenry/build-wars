---
id: SPRINT-013
title: Weapons and Mods Catalog
status: completed
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
updated: 2026-09-03
---

# Sprint 013: Weapons and Mods Catalog

## Overview

This sprint turns `EPIC-12 Weapons and Mods` into deterministic, runtime-eligible weapon base and
weapon modifier catalogs. It extends the existing EPIC-02 ingestion platform, uses the promoted
EPIC-03 professions/attributes catalog for requirement and attribute joins, preserves EPIC-05 raw
equipment-template fidelity, and promotes structured facts that later equipment editing can consume
without reading wiki pages, manifests, QA reports, or Python tooling.

The sprint is content, ingestion, and framework-neutral domain groundwork. It does not add equipment
editor UI, weapon-set controls, inventory persistence, share-url equipment payloads, dynamic catalog
loading, remote icon rendering, combat simulation, DPS/stat totals, acquisition guides, PvE skin
exhaustiveness, unique-item cataloging, economic data, party building, guide authoring, or runtime
wiki access. Current app behavior for the skill editor, local library, sharing, backup/restore,
promoted professions/attributes, skills, runes, insignias, and raw equipment template decode/export
must remain unchanged.

The profile ID is `epic-12-weapons-and-mods`. It produces one reviewed source plan and one selected
snapshot set, then promotes two separate runtime catalogs as one atomic release set:

- `data/generated/epic-12/weapons.catalog.json`
- `data/generated/epic-12/weapons.catalog.manifest.json`
- `data/generated/epic-12/weapon-mods.catalog.json`
- `data/generated/epic-12/weapon-mods.catalog.manifest.json`
- `data/qa/epic-12/weapons.catalog.qa.json`
- `data/qa/epic-12/weapon-mods.catalog.qa.json`

`WeaponId` and `WeaponModifierId` remain schema-owned public runtime IDs. Raw
`TemplateEquipmentItemId` and `TemplateEquipmentModifierId` values are explicit crosswalk facts and
lookup inputs, not public identity. Unknown, unsupported, ambiguous, historical, or future raw IDs
must remain visible and preservable for exact-source replay and downstream EPIC-14/17 handling.

Production promotion is required for completion. Fixture/offline implementation may land usefully,
but BW-1206, BW-1207, EPIC-12, and SPRINT-013 stay incomplete or blocked until reviewed live
discovery, digest-confirmed fetch, one complete selected snapshot set, repeated fixed-clock offline
replay, exact-path allowlisting, passing QA gates, docs, ticket records, ledger, and result
manifests agree. The non-interactive executor must not weaken gates or substitute synthetic output
for production evidence.

## Use Cases

1. **Offer legal weapon bases later**: EPIC-14 can list axes, swords, hammers, bow variants,
   daggers, scythes, spears, wands, staves, focuses, shields, and reviewed PvP template bases by
   family, equip role, requirement, damage, and allowed modifier-slot facts.
2. **Offer compatible modifiers later**: EPIC-14 can filter prefixes, suffixes, inscriptions, staff
   heads, staff wrappings, shield/offhand modifiers, caster modifiers, and other verified modifier
   families from declarative compatibility facts.
3. **Explain incompatible choices**: Domain consumers can explain family mismatch, occupied slot,
   wrong component family, missing applicability evidence, mode conflict, or unresolved data without
   UI-specific logic.
4. **Resolve known template IDs**: A decoded equipment-template item or modifier ID can map to a
   known catalog record through explicit crosswalks.
5. **Preserve imperfect imports**: Unknown, ambiguous, unsupported, historical, armor-owned, or
   dispositioned raw item/modifier IDs remain present in the decoded template document and lookup
   outcomes.
6. **Display truthful weapon facts**: Future UI can show handedness, equip role, damage range/type,
   requirement attribute/rank, mode availability, and allowed upgrade slots from structured runtime
   data.
7. **Represent hard effects conservatively**: Chance-based HCT/HSR, mastery, enchantment, stance,
   conditional, and difficult weapon-mod behavior can be retained as source-backed probability
   facts, `note-only`, or `unknown` instead of guessed arithmetic.
8. **Audit and refresh data**: Maintainers can review a finite source-plan digest, fetch only
   confirmed pages and metadata, replay one complete snapshot set offline, and trace promoted
   records to source and QA evidence.
9. **Hand off downstream ownership cleanly**: EPIC-13 owns armor/headgear, EPIC-14 owns equipment
   editing and loadout legality, EPIC-17 owns broader semantic template import workflows, EPIC-20
   owns search/tooltips, and EPIC-21 owns full stat/effect aggregation.

## Architecture

### Scope Boundary

| Area                   | In Scope                                                                                                                                                                                                                                                                     | Out Of Scope                                                                                                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain contracts       | `WeaponBaseCatalog`, `WeaponModCatalog`, generated record types, source-set summaries, release-set summaries, compact dispositions, identity/crosswalk records, tagged damage/requirement/applicability/effect states, lookup outcomes, and one narrow compatibility helper. | React, DOM/browser APIs, storage, app modules, generated manifests, QA report imports, source snapshots, data scripts, equipment editor state, loadout validation, character stat totals, combat simulation, or effect evaluation.                 |
| Ingestion              | EPIC-12 profile, source-shape checkpoint, bounded live discover/fetch, source-plan digesting, selected offline replay, source extraction, semantic normalization, catalog assembly, QA, deterministic artifact writing, and exact-path promotion.                            | One-off scrapers, arbitrary source URLs, recursive crawls, category expansion without review, browser automation, source-provided commands, live network during `npm run verify`, or runtime wiki access.                                          |
| Runtime data           | Two runtime JSON catalogs with structured facts, compact provenance, compact runtime dispositions, release-set identity, semantic digests, EPIC-03 dependency summaries, and metadata-only media references.                                                                 | Raw page bodies, source plans, snapshot-set manifests, candidate inventories, QA summary text, full QA finding evidence, review bodies, local absolute paths, icon bytes, thumbnails, screenshots, copied long prose, or source-authored commands. |
| Template compatibility | Pure lookups from decoded raw equipment-template item/modifier IDs to known, ambiguous, dispositioned, or unknown catalog facts, plus regression coverage for exact-source replay.                                                                                           | Replacing the EPIC-05 codec, mutating decoded raw documents, lossy canonical export, paw-ned2/team templates, equipment-set interpretation, or broad semantic template import UI.                                                                  |
| Promotion evidence     | Adjacent manifests and QA JSON for both catalogs, with shared release-set identity, counterpart digest checks, artifact integrity, selected input digests, review records, bounded findings, gates, and retention notes.                                                     | Independent promotion of only one catalog, generated-data broad allowlists, hand-authored production JSON, or app behavior changes.                                                                                                                |
| Closeout               | README/data/script docs, compendium note, ticket linkage/status, sprint ledger, planning/execution manifests, and no-commit handoff.                                                                                                                                         | Implementation commits by the sprint executor or unrelated refactors.                                                                                                                                                                              |

### Binding Decisions

- The profile ID is exactly `epic-12-weapons-and-mods`.
- The promoted artifact shape is exactly the six files listed in the Overview. A combined catalog is
  out of scope for this sprint unless execution blocks before implementation and records a planning
  amendment for a future sprint.
- Weapon bases and weapon modifiers are separate domain concepts and separate generated catalogs,
  even though they share one source plan and one release-set lifecycle.
- Both catalogs include the same `catalogSetVersion`, `catalogSetDigest`, source-set digest,
  source-plan digest, source-authority policy version, selected evidence identity, and EPIC-03
  dependency identity. Each catalog also has an independent semantic `catalogVersion`.
- Promotion is all-or-nothing across both catalogs. A cross-catalog compatibility, digest,
  counterpart, QA, or review failure blocks both artifacts.
- Runtime app wiring is deferred. `src/app/catalogs.ts` remains unchanged during this sprint.
- No new npm or Python dependency is planned. Any dependency need is a blocker or sprint amendment.

### Field-Level Source Authority

Phase 1 must validate exact canonical titles and field precedence before schema freeze. The starting
source graph is finite:

- `Equipment template format` for raw equipment item IDs, raw modifier IDs, slot/color/modifier row
  shape, and initial PvP template coverage.
- `Weapon` and explicitly planned weapon-family/detail pages for base family, equip role,
  handedness, damage, requirement, and display facts.
- `Weapon upgrade`, `Inscription`, and explicitly planned component/detail/mechanics pages for
  prefix, suffix, inscription, staff-head, staff-wrapping, shield/offhand, caster, HCT/HSR, mastery,
  and other modifier facts.
- Verified detail pages for canonical title, page ID, revision ID, redirects, source timestamp,
  icon candidates, restrictions, effects, and source-visible variants.
- Metadata-only `imageinfo` for icon facts.
- The promoted EPIC-03 catalog for `ProfessionId` and `AttributeId` joins.
- EPIC-05 raw equipment-template fixtures and adapter contracts as decode/export regression inputs,
  not semantic source authority.

| Field                    | Preferred Evidence                                                                                        | Conflict Outcome                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate membership     | Equipment-template item/modifier rows reconciled with weapon and upgrade authority lists                  | Unaccounted player-usable template or authority-list entries block source-plan approval or become explicit dispositions.                                               |
| Public identity          | Reviewed registry keyed by source family, canonical title, variant key, and stable raw crosswalk evidence | IDs are not derived from array order, API order, names, or raw template IDs. Rename, split, merge, removal, or reappearance needs migration review.                    |
| Raw template crosswalks  | `Equipment template format` plus corroborating detail/source evidence where available                     | Missing, duplicate, historical, mode-specific, unsupported, or conflicting mappings are typed crosswalk states or blockers.                                            |
| Weapon family/equip role | Weapon-family/detail pages plus equipment-template row context                                            | Ambiguous family or equip role blocks accepted weapon-base records.                                                                                                    |
| Damage facts             | Verified weapon-family/detail facts                                                                       | Damaging weapons need tagged source-backed range/type or `unresolved`; shields/focuses use explicit `not-applicable`, not missing data.                                |
| Requirement facts        | Verified detail/family facts joined to EPIC-03 attributes                                                 | Missing, zero, variable, unknown, or unresolved requirements are tagged states with QA coverage.                                                                       |
| Modifier family and slot | Upgrade/component/detail pages and template row context                                                   | Empty applicability must distinguish `universal`, `not-applicable`, and `unknown`; conflicts block or disposition.                                                     |
| Effect facts             | Verified detail/mechanics facts                                                                           | Deterministic values become structured effects; chance/conditional behavior is structured only when closed and source-clear; otherwise note-only, unknown, or blocker. |
| Compatibility            | Source-backed slot/family/applicability facts                                                             | Pairwise structural compatibility can be computed; set-level duplicate-slot, weapon-set, attribute-rank, and effect evaluation stay deferred.                          |
| Display text             | Build Wars-authored short text with review IDs                                                            | Copied source-authored long prose is excluded from runtime JSON. Unknown copied material blocks public release.                                                        |
| Media                    | Detail page image candidates plus metadata-only `imageinfo`                                               | Missing optional icons can be reviewed warnings; unsafe media or cached bytes block.                                                                                   |

Broadening sources, raising caps beyond Phase 1 limits, changing artifact shape, changing identity
policy, changing runtime import behavior, or changing EPIC-05 codec behavior requires a recorded
blocker or a future sprint. The non-interactive executor may tighten caps or disposition candidates
inside the approved source graph, but may not silently broaden it.

### Identity And Release Set

`WeaponId` and `WeaponModifierId` are public runtime identities. They are schema-owned, opaque,
registry-backed, source-order independent, non-reused, and guarded by migration review. The first
production baseline may bootstrap reviewed registries; later refreshes normally run read-only and
block on unreviewed registry churn.

Use separate reviewed registries for base and modifier identities. Crosswalks are facts on records,
not the record ID:

```text
WeaponTemplateItemCrosswalk
  templateItemId: TemplateEquipmentItemId
  status: active | historical | unsupported | ambiguous
  mode: both | pve-only | pvp-only | unknown
  sourceScope: weapon-base | pvp-template-base | unknown
  provenance: CatalogFieldProvenance

WeaponModTemplateModifierCrosswalk
  templateModifierId: TemplateEquipmentModifierId
  status: active | historical | unsupported | ambiguous
  mode: both | pve-only | pvp-only | unknown
  sourceScope: weapon-prefix | weapon-suffix | inscription | staff-head |
               staff-wrapping | shield-offhand | caster | unknown
  provenance: CatalogFieldProvenance
```

Both catalogs and manifests carry release-set facts:

```text
WeaponCatalogSetSummary
  catalogSetVersion
  catalogSetDigest
  sourceSetDigest
  sourcePlanDigest
  profile: epic-12-weapons-and-mods
  weaponCatalogVersion
  weaponModCatalogVersion
  weaponCatalogDigest
  weaponModCatalogDigest
  qaGate: pass
```

Generated bytes are valid only when counterpart digests and catalog-set facts match. A valid weapon
catalog paired with a stale modifier catalog is a release-blocking error.

### Runtime Contract

Exact TypeScript names may adjust to local style, but the following distinctions are acceptance
requirements:

```text
WeaponBaseCatalog
  schemaVersion
  catalogVersion
  catalogSetVersion
  catalogSetDigest
  sectionDigests
  generatedAt
  generator
  profile: WeaponAndModCatalogProfile
  dependencyDigests: EPIC-03 dependency summary
  sourceSet
  releaseSet
  identityRegistry
  dispositions
  weaponBases
  remoteMedia

CatalogWeaponBaseRecord
  id: WeaponId
  sourceKey
  variantKey
  name
  normalizedName
  wikiUrl
  pageIdentity
  familyKey
  family
  variant
  equipRole
  handedness
  modeAvailability
  damage
  requirement
  allowedModifierSlots
  templateItems
  displayState
  iconId
  provenance

WeaponModCatalog
  schemaVersion
  catalogVersion
  catalogSetVersion
  catalogSetDigest
  sectionDigests
  generatedAt
  generator
  profile: WeaponAndModCatalogProfile
  dependencyDigests: EPIC-03 dependency summary
  sourceSet
  releaseSet
  identityRegistry
  dispositions
  weaponMods
  remoteMedia

CatalogWeaponModRecord
  id: WeaponModifierId
  sourceKey
  variantKey
  name
  normalizedName
  wikiUrl
  pageIdentity
  familyKey
  family
  occupiedSlot
  applicableWeaponFamilies
  applicability
  modeAvailability
  templateModifiers
  effects
  effectCompleteness
  displayState
  iconId
  provenance
```

Damage, requirement, applicability, and effect fields use tagged states. `null` must not mean
multiple things. Minimum tagged states:

- Damage: `fixed-range`, `not-applicable`, `unresolved`.
- Requirement: `attribute-rank`, `none`, `unresolved`.
- Applicability: `specific-families`, `universal`, `not-applicable`, `unresolved`.
- Compatibility result: `compatible`, `incompatible`, `indeterminate`.
- Lookup result: `known`, `ambiguous`, `dispositioned`, `unknown`; unsupported and historical cases
  live in disposition/crosswalk reasons instead of a parallel result vocabulary.
- Effect completeness: `structured`, `mixed`, `note-only`, `unknown`.

### Effects And Compatibility

Minimum v1 weapon/mod effect kinds:

| Effect Kind                  | Treatment                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `damage-delta`               | Fixed source-backed damage changes only.                                                   |
| `damage-type-conversion`     | Structured when the source clearly names the damage type and scope.                        |
| `attribute-rank`             | EPIC-03 joined attribute facts where source-clear.                                         |
| `maximum-health-delta`       | Signed health facts only; no full stat total.                                              |
| `maximum-energy-delta`       | Signed energy facts only; no full stat total.                                              |
| `armor-rating-delta`         | Structured armor facts for shields/offhand or local weapon effects where source-clear.     |
| `armor-penetration`          | Structured percentage/fact only when source-clear.                                         |
| `casting-time-chance`        | Probability, magnitude, subject, and scope when source-clear; otherwise note-only/unknown. |
| `skill-recharge-chance`      | Probability, magnitude, subject, and scope when source-clear; otherwise note-only/unknown. |
| `enchantment-duration-delta` | Structured only where subject and duration semantics are source-clear.                     |
| `stance-duration-delta`      | Structured only where subject and duration semantics are source-clear.                     |
| `condition-duration-delta`   | Structured only for closed, source-backed condition facts.                                 |
| `note-only`                  | Bounded reviewed Build Wars-authored note; no arithmetic.                                  |
| `unknown`                    | Accepted identity with unsupported or unresolved behavior; no arithmetic.                  |

The compatibility helper, if added, is intentionally narrow:

```text
explainWeaponModCompatibility(base, modifier)
  input: one CatalogWeaponBaseRecord and one CatalogWeaponModRecord
  output: compatible | incompatible | indeterminate plus stable reason codes
```

It checks only structural base-family, occupied-slot, mode, and applicability facts from the two
records. It does not choose weapon sets, validate main/offhand occupancy, evaluate attribute-rank
satisfaction, evaluate conditions, combine effects, check duplicate active modifiers on a weapon,
calculate damage, calculate DPS, aggregate stats, import app modules, read files, fetch data, or
mutate inputs. Duplicate-slot and mutual-exclusion facts may be recorded for EPIC-14 but are not
loadout validation in this sprint.

### Source Protocol And Retention

Initial profile caps are ceilings, not source facts. Phase 1 may tighten them. Raising them requires
a recorded blocker or future sprint.

```text
seedPageLimit: 4
detailPageLimit: 220
mediaTitleLimit: 220
requestLimit: 120
retryLimit: 3
continuationLimit: 10
responseByteCap: 5 MiB
parserByteCap: 750 KiB
aggregateByteCap: 25 MiB
weaponCatalogByteCap: 4 MiB
weaponModCatalogByteCap: 4 MiB
qaByteCap: 2 MiB per QA report
```

Live refresh is two-step:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-12-weapons-and-mods --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-12-weapons-and-mods --root . --allow-live-network --stage fetch --source-plan <path> --confirm-source-set-digest <source-set-digest>
```

Offline replay is network-free and requires one selected complete snapshot set:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-12-weapons-and-mods --root . --snapshot-set <path>
```

Selected raw source evidence remains ignored by default. If it is retained only in the local ignored
worktree, docs must state that future exact reproduction requires the retained local selected
snapshot set or a fresh bounded live acquisition and review.

## Implementation

### Phase 1: BW-1201 Contracts, Source Shape, Profile, And Release-Set Support (~14% of effort)

**Files:**

- `src/domain/catalog.ts` - Add weapon base/mod catalog profiles, release-set summaries, source-set
  summaries, record contracts, crosswalks, dispositions, tagged states, and effect types.
- `src/domain/catalog-lookup.ts` - Add lookup outcome types and pure item/modifier lookup helpers.
- `src/domain/index.ts` - Export new weapon/mod catalog contracts and helper APIs.
- `src/domain/ids.ts` - Reference only; reuse existing IDs unless a narrow gap is proven.
- `src/domain/equipment.ts` - Reference only; preserve lightweight authored-build placeholders.
- `scripts/data/build_wars_ingest/config.py` - Add EPIC-12 caps.
- `scripts/data/build_wars_ingest/profiles.py` - Register `epic-12-weapons-and-mods`, exact paths,
  source titles, fixture paths, and caps.
- `scripts/data/build_wars_ingest/pipeline.py` - Add narrow EPIC-12 multi-artifact orchestration.
- `scripts/data/build_wars_ingest/cli.py` - Expose the EPIC-12 profile through existing
  fixture/offline/live modes.
- `scripts/data/build_wars_ingest/tests/test_profiles.py` - Cover profile registration and choices.
- `test/domain/contracts.test.ts` - Protect framework-neutral JSON-compatible contracts.

**Tasks:**

- [x] Mark BW-1201 and SPRINT-013 in progress before implementation begins.
- [x] Confirm all dependencies in EPIC-12 are completed and the promoted EPIC-03 catalog/manifest/QA
      files are readable.
- [x] Freeze the exact profile ID `epic-12-weapons-and-mods` across TypeScript, Python, fixture
      paths, generated paths, docs, tickets, QA reports, and CLI tests.
- [x] Record the field-level source authority and conflict-precedence matrix before schema freeze.
- [x] Keep the six promoted EPIC-12 files binding for this sprint; block instead of collapsing
      artifacts in-flight.
- [x] Add release-set types that require shared catalog-set version/digest and counterpart digest
      linkage across both catalogs and manifests.
- [x] Add tagged damage, requirement, applicability, crosswalk, disposition, lookup, effect, and
      compatibility state types.
- [x] Add only profile-specific dual-output orchestration unless a tiny shared helper is needed and
      EPIC-02/03/04/10/11 bytes and behavior remain unchanged under regression tests.
- [x] Keep runtime/audit boundaries explicit: no generated manifest, QA report, source snapshot,
      source plan, or Python module may be imported by `src/domain` or `src/app`.
- [x] Do not add dependencies, runtime app imports, equipment UI state, template codec changes, or
      generated production data in this phase.
- [x] Mark BW-1201 done only after focused verification and its acceptance criteria pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`

### Phase 2: BW-1202 Weapon Base Source Set, Identity, And Extraction (~16% of effort)

**Files:**

- `scripts/data/build_wars_ingest/weapon_base_identity_registry.json` - Create reviewed base ID
  registry.
- `scripts/data/build_wars_ingest/weapon_identity.py` - Create shared registry load/validate helpers
  for weapon and modifier namespaces.
- `scripts/data/build_wars_ingest/weapon_source_set.py` - Create EPIC-12 source-plan and selected
  snapshot-set logic with weapon and modifier sections.
- `scripts/data/build_wars_ingest/weapon_base_extractor.py` - Create base extraction from verified
  snapshots.
- `scripts/data/build_wars_ingest/tests/test_weapon_source_set.py` - Cover source accounting,
  digest confirmation, and replay validation.
- `scripts/data/build_wars_ingest/tests/test_weapon_base_extractor.py` - Cover weapon base parsing.
- `test/fixtures/data-ingestion/weapons-and-mods/` - Add minimized source fixtures for weapon bases.

**Tasks:**

- [x] Mark BW-1202 in progress only after Phase 1 passes.
- [x] Implement one source plan with separate weapon-base and modifier candidate sections; Phase 3
      consumes the same plan instead of creating a second source graph.
- [x] Reconcile equipment-template item rows, weapon authority entries, and verified detail pages
      into accepted base records, supported relationships, explicit exclusions, unsupported
      dispositions, or blockers.
- [x] Bootstrap or validate `WeaponId` registry entries from reviewed source keys and variant keys.
- [x] Extract canonical names, normalized names, family keys, variants, equip roles, handedness,
      mode facts, damage facts, requirement facts, allowed modifier slots, item crosswalks, page
      identities, icon candidates, and compact provenance.
- [x] Distinguish damaging weapons, shields, focuses, missing damage, and not-applicable damage with
      tagged states.
- [x] Join requirement attributes to EPIC-03 attributes where possible and emit stable findings for
      unresolved, missing, contradictory, or unsupported requirements.
- [x] Add fixtures for one-handed martial weapons, two-handed weapons, bows, caster weapons,
      shields, focuses, missing requirements, unresolved attributes, malformed damage, redirects,
      duplicate names, and unsupported source shapes.
- [x] Ensure extraction order, source IDs, finding IDs, and registry checks are independent of API
      order, request order, local paths, and wall-clock time.
- [x] Mark BW-1202 done only after focused verification and its acceptance criteria pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_source_set build_wars_ingest.tests.test_weapon_base_extractor`
- Direct EPIC-12 fixture regeneration under a fixed clock.

### Phase 3: BW-1203 Weapon Modifier Sources, Identity, Extraction, And Media (~16% of effort)

**Files:**

- `scripts/data/build_wars_ingest/weapon_mod_identity_registry.json` - Create reviewed modifier ID
  registry.
- `scripts/data/build_wars_ingest/weapon_mod_extractor.py` - Create modifier and inscription
  extraction from verified snapshots.
- `scripts/data/build_wars_ingest/tests/test_weapon_mod_extractor.py` - Cover modifier parsing.
- `test/fixtures/data-ingestion/weapons-and-mods/` - Add minimized fixtures for modifiers,
  inscriptions, caster facts, malformed rows, and icon metadata.

**Tasks:**

- [x] Mark BW-1203 in progress only after Phase 1 passes and the shared source-plan schema is
      stable.
- [x] Consume the Phase 2 source plan and extract modifier candidates from upgrade, inscription,
      component, mechanics, detail, and metadata-only icon snapshots.
- [x] Reconcile template modifier rows and upgrade authority entries into accepted modifier records,
      supported relationships, explicit exclusions, unsupported dispositions, or blockers.
- [x] Bootstrap or validate `WeaponModifierId` registry entries from reviewed source keys and
      variant keys.
- [x] Extract canonical names, normalized names, family keys, occupied slots, applicable weapon
      families, applicability states, mode facts, modifier crosswalks, raw effect fields, page
      identities, icon candidates, and compact provenance.
- [x] Distinguish empty applicability as `universal`, `not-applicable`, or `unresolved`; silence must
      not mean universal support.
- [x] Preserve source uncertainty for HCT, HSR, mastery, chance, enchantment, stance, damage-type,
      conditional, and variable-magnitude behavior for Phase 4.
- [x] Add fixtures for prefixes, suffixes, inscriptions, staff heads, staff wrappings,
      shield/offhand modifiers, caster modifiers, incompatible modifiers, same-name/different-slot
      cases, missing icons, redirected icons, malformed rows, unsupported fields, and unknown raw
      modifier IDs.
- [x] Keep icon handling metadata-only with `cachedBytes: false`; do not store icon bytes or
      thumbnails.
- [x] Mark BW-1203 done only after focused verification and its acceptance criteria pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_source_set build_wars_ingest.tests.test_weapon_mod_extractor build_wars_ingest.tests.test_icons`
- Direct EPIC-12 fixture regeneration under a fixed clock.

### Phase 4: BW-1204 Effect Semantics, Compatibility, And Domain Helper (~18% of effort)

**Files:**

- `scripts/data/build_wars_ingest/weapon_semantics.py` - Create table-driven semantic
  normalization.
- `scripts/data/build_wars_ingest/weapon_catalog.py` - Create catalog assembly projections if not
  introduced earlier.
- `scripts/data/build_wars_ingest/tests/test_weapon_semantics.py` - Cover effect and compatibility
  normalization.
- `src/domain/weapon-mod-compatibility.ts` - Create only if lookup tests need a shared helper.
- `test/domain/weapon-catalog.test.ts` - Create catalog contract and golden-shape tests.
- `test/domain/weapon-mod-catalog.test.ts` - Create modifier contract and golden-shape tests.
- `test/domain/weapon-mod-compatibility.test.ts` - Create if the helper is added.

**Tasks:**

- [x] Mark BW-1204 in progress only after deterministic raw extraction passes for representative
      base and modifier fixtures.
- [x] Normalize deterministic source-clear values into closed effect variants; convert uncertain
      facts to `note-only`, `unknown`, or QA blockers based on consumer impact.
- [x] Represent HCT/HSR and similar chance facts as probability, magnitude, subject, and scope only
      when source evidence is closed. Otherwise preserve them as notes/unknowns.
- [x] Model compatibility as structural base-family, occupied-slot, mode, and applicability facts.
- [x] Keep catalog validity, structural compatibility, and effect semantic completeness separate.
- [x] Implement `explainWeaponModCompatibility(base, modifier)` only if it removes meaningful
      duplication in tests or downstream contracts. If added, keep it one-base/one-modifier and
      pure.
- [x] Add reason codes for compatible, incompatible, and indeterminate outcomes, including family
      mismatch, unavailable slot, mode mismatch, unresolved applicability, and unsupported modifier
      family.
- [x] Record duplicate-slot, mutual-exclusion, intrinsic-modifier, and slot-cardinality facts for
      later EPIC-14 validation without evaluating active loadouts.
- [x] Add domain fixtures for tagged damage, no damage, unresolved requirements, fixed
      requirements, family-specific applicability, universal applicability, note-only effects,
      unknown effects, source-clear chance facts, incompatible families, and indeterminate data.
- [x] Ensure helper/tests do not read files, import app modules, fetch data, mutate records, evaluate
      character attribute ranks, combine weapon sets, or calculate totals.
- [x] Mark BW-1204 done only after focused verification and its acceptance criteria pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/weapon-mod-compatibility.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_semantics`

### Phase 5: BW-1205 Equipment Template ID Mapping And Raw-Boundary Regression (~12% of effort)

**Files:**

- `src/domain/catalog-lookup.ts` - Add template item/modifier lookup helpers and outcomes.
- `test/domain/weapon-template-lookup.test.ts` - Create lookup tests for known, ambiguous,
  dispositioned, and unknown IDs.
- `test/template-compatibility/equipment-template.test.ts` - Modify only for regression assertions
  if needed.
- `test/template-compatibility/compatibility-matrix.test.ts` - Modify only to protect existing
  codec behavior if needed.
- `test/fixtures/template-compatibility/equipment-cases.json` - Reference existing cases; add
  minimized new cases only if required.

**Tasks:**

- [x] Mark BW-1205 in progress only after Phase 4 passes.
- [x] Implement pure catalog lookups for `TemplateEquipmentItemId` and
      `TemplateEquipmentModifierId`.
- [x] Return only `known`, `ambiguous`, `dispositioned`, or `unknown`. Unsupported and historical
      facts are represented through disposition/crosswalk payloads.
- [x] Do not add a broad semantic equipment-template resolver in this sprint. EPIC-17 owns broader
      semantic import workflows.
- [x] Add tests that decode raw equipment templates, call weapon/mod lookup helpers externally, and
      prove every raw slot, item ID, color ID, modifier ID, modifier order, and source fingerprint
      remains unchanged.
- [x] Cover one-to-many, many-to-one, mode-specific, ambiguous, unsupported, historical, and unknown
      crosswalk cases.
- [x] Keep `src/template-compatibility/**` isolated from generated catalog imports and app modules.
- [x] Prove `exportEquipmentTemplate` exact-source and canonical guardrails remain unchanged.
- [x] Document what EPIC-12 maps now and what EPIC-13/14/17 must still own.
- [x] Mark BW-1205 done only after focused verification and its acceptance criteria pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/weapon-template-lookup.test.ts test/template-compatibility/equipment-template.test.ts test/template-compatibility/compatibility-matrix.test.ts`
- Existing EPIC-05 template compatibility tests from `npm run test:run`.

### Phase 6: BW-1206 Assembly, QA, Review, And Exact-Path Promotion (~16% of effort)

**Files:**

- `scripts/data/build_wars_ingest/weapon_catalog.py` - Assemble both canonical runtime catalogs,
  manifests, semantic digests, release-set digests, and QA inputs.
- `scripts/data/build_wars_ingest/artifacts.py` - Modify narrowly for EPIC-12 companion digest and
  release-set metadata.
- `scripts/data/build_wars_ingest/qa.py` - Add bounded EPIC-12 QA findings and gate predicates.
- `scripts/data/build_wars_ingest/pipeline.py` - Orchestrate fixture, discover, fetch, offline
  replay, and promotion for both artifacts.
- `scripts/data/build_wars_ingest/tests/test_weapon_catalog.py` - Cover assembly and digests.
- `scripts/data/build_wars_ingest/tests/test_qa.py` - Extend for EPIC-12 gate behavior.
- `scripts/data/build_wars_ingest/tests/test_pipeline.py` - Extend for dual output, determinism,
  and existing-profile regression.
- `scripts/data/build_wars_ingest/tests/test_cli.py` - Extend for profile/stage/snapshot options.
- `test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json` - Create synthetic golden
  base catalog.
- `test/fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json` - Create synthetic
  golden modifier catalog.
- `data/generated/epic-12/weapons.catalog.json` - Promote exact runtime base catalog.
- `data/generated/epic-12/weapons.catalog.manifest.json` - Promote adjacent base manifest.
- `data/generated/epic-12/weapon-mods.catalog.json` - Promote exact runtime modifier catalog.
- `data/generated/epic-12/weapon-mods.catalog.manifest.json` - Promote adjacent modifier manifest.
- `data/qa/epic-12/weapons.catalog.qa.json` - Promote bounded base QA report.
- `data/qa/epic-12/weapon-mods.catalog.qa.json` - Promote bounded modifier QA report.
- `.gitignore` - Add exact parent and file allowlists only for promoted EPIC-12 artifacts.

**Tasks:**

- [x] Mark BW-1206 in progress only after source-set, extraction, semantics, and lookup gates pass.
- [x] Assemble both catalogs from the same selected source plan and snapshot set.
- [x] Ensure both catalogs include matching release-set facts and counterpart digests.
- [x] Compute semantic digests from runtime-relevant semantic facts only, excluding timestamps,
      local paths, manifest paths, QA paths, generated version fields, review bodies, and source
      bodies.
- [x] Add QA for source accounting, zero-output rejection, identity registry churn, crosswalk
      integrity, counterpart skew, page resolution, EPIC-03 joins, damage/requirement facts,
      modifier applicability, compatibility gaps, effect completeness, copied text, media metadata,
      caps, baseline diffs, artifact integrity, and gate predicates.
- [x] Treat unresolved core family/equip-role identity, unaccounted player-usable candidates,
      missing selected snapshot data, path escape, digest mismatch, counterpart mismatch, unknown
      copied material, unsafe media, QA overflow, or material truncation as release-blocking.
- [x] Require every warning in promoted QA reports to be resolved, excluded, or accepted with
      bounded review evidence and re-review triggers.
- [x] Generate fixture catalogs, manifests, and QA reports twice into separate ignored roots under
      one fixed clock and prove byte identity within fixture mode.
- [x] Run bounded live `discover`; review source identities, counts, raw ID ranges, planned detail
      pages, media titles, conflicts, caps, and blockers.
- [x] Run digest-confirmed live `fetch` from the reviewed source plan and exact source-set digest.
- [x] Replay the selected complete snapshot set offline twice under a fixed clock and prove byte
      identity within offline mode for both catalogs, manifests, QA reports, section digests,
      finding IDs, registry output, and release-set facts.
- [x] Perform first-baseline review for record counts, base/mod family coverage, PvP template
      coverage, accepted/dispositioned counts, unresolved raw IDs, effects, compatibility, icons,
      copied-text policy, caps, and downstream handoffs.
- [x] Promote approved production bytes only from selected reviewed offline inputs.
- [x] Add exact `.gitignore` allowlist entries only for the six promoted EPIC-12 files and required
      parent directories.
- [x] Verify promoted files are Git-visible while source plans, snapshot-set manifests, raw
      snapshots, QA summaries, candidate outputs, icon bytes, and review scratch files remain
      ignored.
- [x] Mark BW-1206 done only after exact files exist, both app/public gates pass for both QA reports,
      counterpart checks pass, and all accepted warnings have review evidence.

**Verification:**

- `npm run data:regenerate`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-and-mods --root work/runs/data-ingestion/epic-12-fixture-a --fixture-root test/fixtures/data-ingestion`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-and-mods --root work/runs/data-ingestion/epic-12-fixture-b --fixture-root test/fixtures/data-ingestion`
- `cmp -s work/runs/data-ingestion/epic-12-fixture-a/data/generated/epic-12/weapons.catalog.json work/runs/data-ingestion/epic-12-fixture-b/data/generated/epic-12/weapons.catalog.json`
- `cmp -s work/runs/data-ingestion/epic-12-fixture-a/data/generated/epic-12/weapon-mods.catalog.json work/runs/data-ingestion/epic-12-fixture-b/data/generated/epic-12/weapon-mods.catalog.json`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-12-weapons-and-mods --root . --snapshot-set <selected-snapshot-set>`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_catalog build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_qa build_wars_ingest.tests.test_cli`
- `git check-ignore -v data/generated/epic-12/weapons.catalog.json` must return non-zero because
  the promoted file is allowlisted.
- `git check-ignore -v work/runs/data-ingestion/epic-12/source-plans/example.source-plan.json`
  must return zero because intermediate source plans remain ignored.

### Phase 7: BW-1207 Runtime Docs, Full Verification, And Closeout (~8% of effort)

**Files:**

- `README.md` - Document EPIC-12 runtime catalog status, commands, and unchanged app scope.
- `scripts/data/README.md` - Document EPIC-12 profile, staged live commands, replay protocol, caps,
  and troubleshooting.
- `data/README.md` - Document EPIC-12 artifact lifecycle and non-runtime boundaries.
- `data/generated/README.md` - Document exact EPIC-12 catalog/manifest promotion and determinism.
- `data/qa/README.md` - Document exact EPIC-12 QA reports and gate behavior.
- `data/source-snapshots/README.md` - Document retained/ignored EPIC-12 snapshot behavior if needed.
- `compendium/data-ingestion-platform.md` - Add EPIC-12 profile and replay notes.
- `compendium/weapons-and-mods-catalog.md` - Create source authority, schema, identity, effect,
  compatibility, QA, and downstream handoff note.
- `compendium/README.md` - Index the new compendium note.
- `work/tickets/12-weapons-and-mods/EPIC.md` - Track status, completion evidence, and sprint links.
- `work/tickets/12-weapons-and-mods/BW-120*.md` - Track planned/completed sprint links and closeout
  evidence.
- `work/sprints/SPRINT-013.md` - Update execution checklist and final status.
- `work/sprints/ledger.tsv` - Track sprint lifecycle.
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-013-result.json` - Required
  execution manifest.

**Tasks:**

- [x] Mark BW-1207 in progress only after Phase 6 promotion passes.
- [x] Document source authority, final caps, source-shape result, profile modes, digest-confirmed
      refresh, selected replay, artifact schema, release-set identity, identity/crosswalk policy,
      damage/requirement states, effect vocabulary, compatibility outcomes, semantic digests, QA
      gates, media policy, retention limits, and exact paths.
- [x] State that only `data/generated/epic-12/weapons.catalog.json` and
      `data/generated/epic-12/weapon-mods.catalog.json` are runtime-eligible.
- [x] State that manifests, QA reports, source plans, snapshot sets, raw snapshots, QA summaries,
      review evidence, Python tooling, and media bytes are non-runtime.
- [x] Document EPIC-14 and EPIC-17 handoffs for equipment editing, template ID lookups, unknown raw
      preservation, compatibility, and exact-source replay.
- [x] Document EPIC-20 and EPIC-21 handoffs for search/tooltips and full stat/effect aggregation.
- [x] Confirm current editor, local persistence, sharing, backup/restore, EPIC-03/04/10/11
      catalogs, and EPIC-05 template compatibility behavior are unchanged.
- [x] Inspect the worktree for source bodies, source plans, snapshot sets, QA summaries, media
      bytes, copied prose, broad allowlists, secrets, absolute machine paths, nondeterministic
      timestamps, generated byproducts, and unrelated changes.
- [x] Add verification and artifact evidence to BW-1201 through BW-1207. Mark tickets done only
      after phase gates pass.
- [x] Mark EPIC-12, SPRINT-013, and ledger completed together only after the full Definition of Done
      passes.
- [x] Write the ticket-burn execution result manifest with matching sprint, epic, ticket IDs,
      changed-file summary, validation results, blockers, followups, and `commit_created: false`.
- [x] Do not create a commit.

**Verification:**

- `npm run data:regenerate`
- Direct EPIC-12 fixed-clock fixture regeneration twice
- Direct EPIC-12 selected offline replay twice
- `npm run verify`
- `rg -n 'EPIC-12|BW-120[1-7]|SPRINT-013' work/tickets/12-weapons-and-mods work/sprints`
- `git status --short`
- Manual consistency review across docs, generated files, QA state, tickets, sprint, ledger, and
  result manifests

## Files Summary

| File                                                                            | Action                                   | Purpose                                                                                                                       |
| ------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/catalog.ts`                                                         | Modify                                   | Add weapon base/mod catalog, release-set, source-set, crosswalk, tagged state, effect, disposition, and dependency contracts. |
| `src/domain/catalog-lookup.ts`                                                  | Modify                                   | Add pure lookup outcomes for template item and modifier IDs.                                                                  |
| `src/domain/weapon-mod-compatibility.ts`                                        | Create if justified                      | Explain one-base/one-modifier structural compatibility without loadout or stat logic.                                         |
| `src/domain/index.ts`                                                           | Modify                                   | Export new contracts and helper APIs.                                                                                         |
| `src/domain/ids.ts`                                                             | Reference only                           | Reuse existing `WeaponId`, `WeaponModifierId`, `TemplateEquipmentItemId`, and `TemplateEquipmentModifierId`.                  |
| `src/domain/equipment.ts`                                                       | Reference only                           | Preserve authored weapon placeholders; no equipment UI/schema expansion.                                                      |
| `src/app/catalogs.ts`                                                           | Reference only                           | Preserve current runtime import boundary; do not import EPIC-12 data in this sprint.                                          |
| `src/template-compatibility/**`                                                 | Reference or narrow test-only regression | Preserve EPIC-05 raw template decode/export behavior and dependency isolation.                                                |
| `scripts/data/build_wars_ingest/config.py`                                      | Modify                                   | Add EPIC-12 caps.                                                                                                             |
| `scripts/data/build_wars_ingest/profiles.py`                                    | Modify                                   | Register `epic-12-weapons-and-mods` and exact fixture/generated/QA paths.                                                     |
| `scripts/data/build_wars_ingest/weapon_identity.py`                             | Create                                   | Manage reviewed base/mod identity registries and migration validation.                                                        |
| `scripts/data/build_wars_ingest/weapon_base_identity_registry.json`             | Create                                   | Persist reviewed public `WeaponId` source keys and tombstones.                                                                |
| `scripts/data/build_wars_ingest/weapon_mod_identity_registry.json`              | Create                                   | Persist reviewed public `WeaponModifierId` source keys and tombstones.                                                        |
| `scripts/data/build_wars_ingest/weapon_source_set.py`                           | Create                                   | Build source plans, source-set digests, selected snapshot-set manifests, and replay checks.                                   |
| `scripts/data/build_wars_ingest/weapon_base_extractor.py`                       | Create                                   | Extract base family, handedness, damage, requirements, slots, item IDs, page facts, and icons.                                |
| `scripts/data/build_wars_ingest/weapon_mod_extractor.py`                        | Create                                   | Extract modifier families, occupied slots, applicability, raw effects, modifier IDs, page facts, and icons.                   |
| `scripts/data/build_wars_ingest/weapon_semantics.py`                            | Create                                   | Normalize effect, requirement, applicability, and compatibility semantics.                                                    |
| `scripts/data/build_wars_ingest/weapon_catalog.py`                              | Create                                   | Assemble both catalogs, manifests, semantic digests, release-set facts, and diagnostics.                                      |
| `scripts/data/build_wars_ingest/artifacts.py`                                   | Modify narrowly                          | Support companion/release-set metadata while preserving existing profile output.                                              |
| `scripts/data/build_wars_ingest/qa.py`                                          | Modify                                   | Add EPIC-12 QA findings, gates, and bounded report behavior.                                                                  |
| `scripts/data/build_wars_ingest/pipeline.py`                                    | Modify                                   | Orchestrate EPIC-12 fixture, discover, fetch, selected offline replay, and dual promotion.                                    |
| `scripts/data/build_wars_ingest/cli.py`                                         | Modify                                   | Expose EPIC-12 profile safely through existing modes and options.                                                             |
| `scripts/data/build_wars_ingest/tests/`                                         | Create/modify                            | Cover profile, source-set, extraction, semantics, catalog, QA, determinism, CLI, and regressions.                             |
| `test/domain/contracts.test.ts`                                                 | Modify                                   | Protect framework-neutral JSON-compatible wire contracts.                                                                     |
| `test/domain/data-ingestion-contracts.test.ts`                                  | Modify                                   | Validate Python-generated EPIC-12 JSON against TypeScript expectations.                                                       |
| `test/domain/weapon-catalog.test.ts`                                            | Create                                   | Verify base catalog shape, tagged facts, identity, crosswalks, and digests.                                                   |
| `test/domain/weapon-mod-catalog.test.ts`                                        | Create                                   | Verify modifier catalog shape, effects, applicability, crosswalks, and digests.                                               |
| `test/domain/weapon-mod-compatibility.test.ts`                                  | Create if helper added                   | Verify compatible, incompatible, and indeterminate outcomes.                                                                  |
| `test/domain/weapon-template-lookup.test.ts`                                    | Create                                   | Verify template item/modifier lookups and unresolved raw ID preservation.                                                     |
| `test/fixtures/data-ingestion/weapons-and-mods/`                                | Create                                   | Store minimized synthetic source, redirect, malformed, compatibility, and icon metadata fixtures.                             |
| `test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json`           | Create                                   | Store deterministic synthetic golden weapon base catalog.                                                                     |
| `test/fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json`       | Create                                   | Store deterministic synthetic golden weapon modifier catalog.                                                                 |
| `data/generated/epic-12/weapons.catalog.json`                                   | Create/allowlist                         | Promote runtime-eligible weapon base catalog.                                                                                 |
| `data/generated/epic-12/weapons.catalog.manifest.json`                          | Create/allowlist                         | Promote base catalog manifest.                                                                                                |
| `data/generated/epic-12/weapon-mods.catalog.json`                               | Create/allowlist                         | Promote runtime-eligible weapon modifier catalog.                                                                             |
| `data/generated/epic-12/weapon-mods.catalog.manifest.json`                      | Create/allowlist                         | Promote modifier catalog manifest.                                                                                            |
| `data/qa/epic-12/weapons.catalog.qa.json`                                       | Create/allowlist                         | Promote bounded base catalog QA report.                                                                                       |
| `data/qa/epic-12/weapon-mods.catalog.qa.json`                                   | Create/allowlist                         | Promote bounded modifier catalog QA report.                                                                                   |
| `.gitignore`                                                                    | Modify narrowly                          | Allowlist only EPIC-12 promoted files and required parents.                                                                   |
| `README.md`                                                                     | Modify                                   | Document new runtime catalogs and unchanged app scope.                                                                        |
| `scripts/data/README.md`                                                        | Modify                                   | Document EPIC-12 profile, commands, caps, replay, and troubleshooting.                                                        |
| `data/README.md`                                                                | Modify                                   | Document artifact lifecycle and runtime boundaries.                                                                           |
| `data/generated/README.md`                                                      | Modify                                   | Document exact catalog/manifest promotion and determinism.                                                                    |
| `data/qa/README.md`                                                             | Modify                                   | Document exact QA reports and gate behavior.                                                                                  |
| `data/source-snapshots/README.md`                                               | Modify if needed                         | Document retained/ignored selected snapshot behavior.                                                                         |
| `compendium/data-ingestion-platform.md`                                         | Modify                                   | Record EPIC-12 profile and source/replay behavior.                                                                            |
| `compendium/weapons-and-mods-catalog.md`                                        | Create                                   | Preserve source authority, identity, schema, effects, compatibility, QA, and handoffs.                                        |
| `compendium/README.md`                                                          | Modify                                   | Index the new compendium note.                                                                                                |
| `work/tickets/12-weapons-and-mods/*.md`                                         | Modify                                   | Track sprint linkage, status, assumptions, and closeout evidence.                                                             |
| `work/sprints/SPRINT-013.md`                                                    | Create/update                            | Executable sprint plan and later execution checklist state.                                                                   |
| `work/sprints/ledger.tsv`                                                       | Modify                                   | Track sprint lifecycle.                                                                                                       |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-12-result.json`       | Create during planning                   | Required ticket-burn planning manifest.                                                                                       |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-013-result.json` | Create during execution                  | Required ticket-burn execution manifest.                                                                                      |

## Definition of Done

### Source, Identity, And Release Set

- [x] The exact profile ID is `epic-12-weapons-and-mods` everywhere.
- [x] Field-level source authority and conflict precedence are approved before schema freeze.
- [x] Every source candidate becomes an accepted record, supported relationship, explicit exclusion,
      unsupported disposition, ambiguous disposition, historical disposition, or blocking finding.
- [x] `WeaponId` and `WeaponModifierId` assignment is registry-backed, source-order independent,
      collision checked, non-reused, and guarded by rename, tombstone, split, merge, supersession,
      and migration rules.
- [x] Normal regeneration does not silently allocate or churn public IDs after the first reviewed
      production baseline.
- [x] Template item and modifier crosswalks distinguish active, historical, unsupported, ambiguous,
      mode-specific, and unknown facts without changing public IDs.
- [x] Both catalogs share matching catalog-set version/digest, source-set digest, source-plan digest,
      source-authority version, selected evidence identity, and EPIC-03 dependency identity.
- [x] Counterpart digest/version mismatch blocks both catalogs.
- [x] Source drift in counts, raw ID ranges, groups, variants, requirements, modes, redirects, page
      identity, icon facts, compatibility, or effect phrasing stops at discovery/review, not after
      promotion.

### Runtime Contract

- [x] `WeaponBaseCatalog` and `WeaponModCatalog` are framework-neutral, JSON-compatible,
      schema-versioned, and exported through `src/domain`.
- [x] `src/domain` imports no React, DOM/browser APIs, storage, network, filesystem, app modules,
      generated manifests, QA reports, source snapshots, or Python modules.
- [x] Runtime records include stable ID, source key, variant key, name, normalized key, wiki URL,
      page identity, family, mode facts, crosswalks, display state, nullable icon ID, and compact
      provenance.
- [x] Weapon base records include family, variant, equip role, handedness, tagged damage, tagged
      requirement, and allowed modifier slot capabilities.
- [x] Modifier records include family, occupied slot, applicability, template modifier crosswalks,
      effects, and effect completeness.
- [x] Damage, requirement, applicability, lookup, compatibility, and effect fields use tagged states;
      `null` does not carry ambiguous meaning.
- [x] Runtime JSON excludes raw page bodies, source plans, snapshot-set manifests, local paths, full
      QA bodies, review bodies, copied long prose, MediaWiki HTML, icon bytes, screenshots,
      thumbnails, and source-provided commands.
- [x] Runtime app imports remain unchanged; EPIC-12 generated data is not wired into `src/app`.

### Effects, Compatibility, And Template Boundary

- [x] Deterministic source-clear effects are structured and covered by fixtures.
- [x] Chance, conditional, HCT/HSR, mastery, enchantment, stance, and variable behavior is structured
      only when source evidence provides closed probability/magnitude/subject/scope facts; otherwise
      it is note-only, unknown, or blocking.
- [x] Compatibility evaluates only static one-base/one-modifier structural facts and returns
      compatible, incompatible, or indeterminate with stable reason codes.
- [x] Compatibility does not validate weapon-set state, duplicate active modifiers, attribute-rank
      satisfaction, conditions, effect aggregation, damage totals, DPS, or full stats.
- [x] Duplicate-slot, intrinsic, mutual-exclusion, and cardinality facts are represented for
      downstream EPIC-14 without active loadout validation.
- [x] Template item/modifier lookups distinguish known, ambiguous, dispositioned, and unknown raw IDs.
- [x] Existing EPIC-05 raw equipment-template decode/export, exact-source replay, and canonical
      guardrails remain unchanged.
- [x] `src/template-compatibility/**` does not import generated catalogs or app modules.

### Determinism, QA, And Promotion

- [x] Fixture mode is synthetic, fixed-clock, and network-free.
- [x] Live fetch requires `--allow-live-network`, registered `epic-12-weapons-and-mods`, exact source
      plan path, exact source-set digest, and fixed Guild Wars Wiki API origin.
- [x] Offline replay requires one complete EPIC-12 snapshot-set manifest and rejects unsafe,
      incomplete, duplicate, mixed, plan-mismatched, dependency-mismatched, counterpart-mismatched,
      path-escaping, or digest-mismatched inputs.
- [x] Catalogs, manifests, QA JSON, section digests, semantic digests, catalog-set digests,
      source/disposition/effect ordering, registry output, and finding IDs are byte-identical across
      repeated fixed-clock fixture runs.
- [x] The same outputs are byte-identical across repeated selected offline replays under one fixed
      clock. Fixture bytes and production bytes do not need to equal each other.
- [x] Semantic digest inputs and audit-only exclusions are documented and mutation-tested.
- [x] QA covers source accounting, zero-output rejection, ID/crosswalk integrity, counterpart skew,
      page resolution, EPIC-03 joins, requirements, damage, applicability, effects, compatibility,
      copied text, media metadata, caps, baselines, gates, and artifact integrity.
- [x] QA overflow, silent truncation, unresolved core identity, unaccounted player-usable
      candidates, failed deterministic source facts, unknown copied material, unsafe paths,
      incomplete replay, and digest/integrity mismatch are release-blocking.
- [x] Both app and public release gates pass for both QA reports, and set-level findings block both
      catalogs.
- [x] Only the exact six EPIC-12 promoted paths are allowlisted; representative raw/candidate/byproduct
      paths remain ignored.

### Closeout

- [x] Documentation explains source authority, exact paths/commands, runtime boundaries, identity and
      crosswalk policy, tagged damage/requirements, effect semantics, compatibility outcomes, media
      policy, retention limits, QA gates, and downstream handoffs.
- [x] `src/app/catalogs.ts`, editor behavior, local persistence/sharing, template compatibility,
      EPIC-03/04/10/11 promoted artifacts, equipment UI, and full stat analysis remain unchanged.
- [x] BW-1201 through BW-1207, EPIC-12, SPRINT-013, ledger, and result manifests are
      status-consistent.
- [x] `npm run verify` passes without live network access.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                                           | Likelihood | Impact | Mitigation                                                                                                                |
| -------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Source authority is incomplete, inconsistent, or too broad.    | High       | High   | Make source-shape proof and field-authority approval the first gate; block instead of broadening silently.                |
| The source census invalidates the planned schema shape.        | Medium     | High   | Treat material source/schema changes as blockers or future-sprint amendments before extraction proceeds.                  |
| Two catalogs become version-skewed.                            | Medium     | High   | Add shared catalog-set version/digest, counterpart digests, set-level QA, and all-or-nothing promotion.                   |
| Template item/modifier mappings are incomplete or conflicting. | High       | High   | Keep raw IDs as crosswalk facts, type active/historical/unsupported/ambiguous states, and block unresolved core mappings. |
| Public ID registry churn breaks downstream consumers.          | Medium     | High   | Use reviewed registries, read-only refresh behavior, tombstones, non-reuse, and migration review.                         |
| Shields/focuses are forced into damaging-weapon fields.        | Medium     | Medium | Use discriminated/tagged damage and requirement states with per-kind completeness rules.                                  |
| Compatibility helper drifts into equipment validation.         | Medium     | High   | Keep it one-base/one-modifier and static; defer set occupancy, attribute ranks, and totals.                               |
| Chance and HCT/HSR effects become guessed arithmetic.          | High       | High   | Structure only source-clear closed facts; otherwise use note-only, unknown, or blockers.                                  |
| Runtime JSON leaks source-authored prose or audit artifacts.   | Medium     | High   | Default to structured facts, compact provenance, reviewed notes, exact scans, and QA copied-text gates.                   |
| Profile-specific dual output regresses older profiles.         | Medium     | High   | Keep changes narrow and run EPIC-02/03/04/10/11 regression tests and byte checks.                                         |
| Live source access or review capacity is unavailable.          | Medium     | Medium | Allow fixture/offline code to land but leave promotion tickets and sprint blocked.                                        |
| QA caps hide material findings.                                | Low        | High   | Treat QA overflow and material truncation as blocking.                                                                    |
| Exact allowlists expose non-runtime artifacts.                 | Low        | High   | Use parent re-ignore rules, exact exceptions, `git check-ignore -v`, and final worktree inspection.                       |
| Selected source evidence is not retained.                      | Medium     | Medium | Document retention limits and require retained selected inputs or fresh bounded acquisition/review for exact replay.      |
| New dependency pressure appears during parsing.                | Low        | Medium | No dependency is planned; dependency needs trigger amendment and supply-chain review.                                     |

## Security Considerations

- Treat source titles, redirects, page bodies, templates, parameters, icon names, source plans,
  snapshot manifests, generated catalogs, QA evidence, baselines, and review notes as untrusted
  input.
- Permit network access only in explicit live mode with `--allow-live-network`, the registered
  profile, GET-only JSON requests, fixed Guild Wars Wiki API origin, final-origin checks, finite
  timeouts, retry caps, continuation caps, request caps, page caps, and byte caps.
- Reject arbitrary endpoints, source-provided fetch URLs, recursive crawls, credentials, cookies,
  tokens, environment secrets, absolute child paths, `..` traversal, symlink escape, mixed roots,
  duplicate children, and digest mismatch.
- Parse wiki content as inert data. Never execute templates, Lua, HTML, JavaScript, CSS, links,
  shell snippets, or source-authored expressions.
- Runtime JSON is inert data and future UI must render names/notes as escaped text, never
  `innerHTML`.
- Bound accepted pages, title lengths, parser bytes, template traversal, numeric ranges, probability
  ranges, effect counts, compatibility reason counts, evidence excerpts, output bytes, and QA
  findings.
- Query icon metadata only and keep runtime media records `cachedBytes: false`; do not store media
  bytes, thumbnails, screenshots, data URLs, or source media in fixtures or runtime bundles.
- Source-policy classification remains field-level. Unknown copied material, digest mismatch, and
  unreadable artifacts remain non-waivable for public release.
- No new package or Python dependency is planned. Any required dependency triggers supply-chain
  review and a sprint amendment.

## Dependencies

- `EPIC-01` / `SPRINT-002`: source policy, provenance, media restrictions, manual review, QA gates,
  exact-path promotion, and artifact retention.
- `EPIC-02` / `SPRINT-003`: MediaWiki client, snapshots, parser adapter, metadata-only icons,
  canonical artifact writing, fixture/offline/live modes, and QA report format.
- `EPIC-03` / `SPRINT-004`: promoted profession/attribute catalog, dependency digests, section
  digests, template attribute crosswalks, and passing QA gates.
- `EPIC-05` / `SPRINT-006`: raw equipment-template decode/export contracts, branded template item
  and modifier IDs, color/slot facts, and exact-source fidelity.
- `EPIC-10` / `SPRINT-011`: armor-upgrade catalog precedent, effect-level conservative modeling,
  metadata-only media pattern, and blocked promotion semantics. It is not a runtime dependency for
  EPIC-12.
- `EPIC-11` / `SPRINT-012`: identity registry, crosswalk, source-set replay, per-record effect
  semantics, and selected-evidence retention precedent. It is not a runtime dependency for EPIC-12.
- Future `EPIC-13`, `EPIC-14`, `EPIC-17`, `EPIC-20`, and `EPIC-21` consume the catalog for armor
  records, equipment authoring, semantic template workflows, search/tooltips, and stat/effect
  analysis.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and `npm run data:setup` for data-ingestion
  tests.

## Open Questions

These do not block planning. They are Phase 1/implementation checkpoints with explicit blocker
outcomes:

1. Do the initial source titles (`Equipment template format`, `Weapon`, `Weapon upgrade`,
   `Inscription`) provide enough bounded authority for practical PvP template coverage, or does
   Phase 1 need to block for a future source-authority amendment?
2. What exact source rows prove every accepted weapon base has a stable semantic variant boundary
   without requiring named skin exhaustiveness?
3. Which modifier families have closed source-backed effects in v1, and which must remain
   note-only/unknown for EPIC-21?
4. How many raw equipment-template item/modifier IDs are unresolved after the first source census,
   and which unresolved classes are acceptable dispositions versus promotion blockers?
5. Can EPIC-12 dual output remain profile-specific, or does the implementation discover a small
   shared artifact helper that is lower risk and regression-covered?
