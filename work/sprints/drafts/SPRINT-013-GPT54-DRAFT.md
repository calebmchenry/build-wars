---
id: SPRINT-013
title: Weapons and Mods Catalog
status: planned
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
---

# Sprint 013: Weapons and Mods Catalog

## Overview

This sprint turns `EPIC-12 Weapons and Mods` into deterministic, runtime-eligible weapon-base and
weapon-modifier catalogs built through the existing EPIC-02 ingestion spine. It uses the promoted
EPIC-03 professions/attributes catalog for requirement joins, preserves EPIC-05 raw
equipment-template decode/export as the exact-source boundary, and promotes separate runtime JSON
artifacts for weapon bases and weapon modifiers plus adjacent manifests and bounded QA reports.

The sprint is content, domain, and ingestion groundwork only. It does not add equipment-editor UI,
change `src/app/catalogs.ts`, alter local-library/share payloads, replace the raw equipment-template
codec, model full weapon-set legality, compute character stat totals, evaluate attribute-rank
satisfaction, simulate combat, or copy source-authored long prose. `src/domain/equipment.ts` keeps
its lightweight authored-build placeholders; the new work lives in generated catalogs, pure lookups,
and a narrow compatibility helper only.

These execution defaults are binding in non-interactive mode unless a phase gate proves one is
wrong:

1. Use one shared ingestion profile, `epic-12-weapons-mods`, with one reviewed source plan and one
   selected snapshot set, but promote two separate runtime catalogs by default:
   `data/generated/epic-12/weapons.catalog.json` and
   `data/generated/epic-12/weapon-mods.catalog.json`. Only a Phase 1 amendment may collapse them.
2. `WeaponId` and `WeaponModifierId` are schema-owned, registry-backed public IDs. Raw
   `TemplateEquipmentItemId` and `TemplateEquipmentModifierId` remain explicit crosswalk facts and
   lookup inputs, not the sole public identity.
3. `Equipment template format` is the numeric ID authority. A bounded reviewed set of weapon-base
   and weapon-modifier authority pages plus verified detail pages supplies semantic classification,
   damage, requirement, compatibility, and metadata-only icon facts. No category crawl, site search,
   recursive link walk, or ad hoc source expansion is allowed.
4. Runtime catalogs carry structured facts, compact dispositions, dependency summaries, semantic
   digests, and metadata-only remote media references. Source plans, snapshot manifests, QA bodies,
   review evidence, raw page bodies, and icon bytes remain non-runtime.
5. Deterministic compatibility is structured now. Chance-based, conditional, mastery, HCT/HSR,
   enchantment, stance, and other hard-to-verify modifier behavior stays `note-only` or `unknown`
   unless source review proves an exact closed wire shape.
6. `decodeEquipmentTemplate` and `exportEquipmentTemplate` remain raw exact-source APIs. BW-1205
   adds caller-side lookup coverage and regression tests, not a lossy semantic equipment-template
   resolver.

The interview is skipped per contract. If implementation discovers a high-risk architecture blocker,
record the assumption, amend the sprint/ticket state, and continue without waiting for interactive
approval.

## Use Cases

1. **Offer legal weapon bases later**: EPIC-14 can list main-hand, two-handed, offhand, bow,
   caster, shield, and focus options by family, handedness, requirement, and allowed modifier-slot
   facts without reading wiki pages or Python tooling.
2. **Explain modifier compatibility later**: a future equipment surface can tell the user why a
   modifier is compatible, incompatible, or unknown for a chosen weapon base without inventing full
   legality or build-state logic.
3. **Resolve raw template IDs safely**: EPIC-14 and EPIC-17 can map decoded raw
   `TemplateEquipmentItemId` and `TemplateEquipmentModifierId` values to known semantic records while
   preserving ambiguous, unsupported, and unknown raw IDs.
4. **Render truthful requirements and damage facts**: later UI can display requirement attribute,
   requirement rank, damage range, damage type, and handedness from runtime data rather than prose
   parsing or hard-coded tables.
5. **Preserve weapon-family differences**: bows, martial weapons, caster weapons, shields, and
   focuses can carry different slot and compatibility facts without collapsing into one generic
   “weapon” shape.
6. **Avoid false precision for chance-based effects**: HCT/HSR, mastery, conditional, and other
   non-deterministic behavior remains visible as reviewed notes or unknown states instead of guessed
   arithmetic.
7. **Support later search and discovery**: EPIC-20 can filter by weapon family, modifier family,
   handedness, requirement attribute, supported slot family, and note/effect presence without
   importing ingestion artifacts.
8. **Audit and refresh data safely**: maintainers can review one bounded source-plan digest, fetch
   only approved pages and icon metadata, replay one complete selected snapshot set offline, and
   trace every promoted record or disposition to source and QA evidence.
9. **Preserve downstream ownership**: EPIC-13 owns armor/equipment display metadata, EPIC-14 owns
   editor state and legality, EPIC-17 owns party/equipment application, EPIC-20 owns search
   presentation, and EPIC-21 owns deeper equipment analysis and chance-based interpretation.

## Architecture

### Scope And Ownership

| Area | Owns | Must Not Own |
| --- | --- | --- |
| `src/domain/catalog.ts` | Plain-data weapon-base and weapon-modifier catalog contracts, page identity, requirement facts, damage facts, allowed slot facts, effect variants, source-set summaries, compact dispositions, dependency summaries, template crosswalks, and metadata-only media refs. | React, browser APIs, storage, runtime fetches, source plans, snapshot paths, manifests, QA bodies, or Python imports. |
| `src/domain/catalog-lookup.ts` | Collision-safe lookup by public ID, name, template item ID, and template modifier ID with `known`, `ambiguous`, `dispositioned`, and `unknown` outcomes. | Build-state evaluation, editor mutations, cached lookup tables, or raw template decoding. |
| `src/domain/weapon-mod-compatibility.ts` | Narrow pure explanation of base/mod structural compatibility. | Character attribute satisfaction, set-wide legality, weapon-set selection, combat math, DPS, or export logic. |
| `src/template-compatibility` | Raw exact-source equipment-template decode/export only, plus regression proof that EPIC-12 lookup use does not weaken fidelity. | Semantic equipment-template ownership, lossy resolution, or runtime catalog imports in app code. |
| `scripts/data/build_wars_ingest` | Shared EPIC-12 profile, bounded discovery/fetch, selected offline replay, extraction, semantic normalization, QA, determinism, and exact-path promotion. | One-off scraping, arbitrary URLs, category crawl, browser automation, or runtime imports. |
| Runtime artifacts | `weapons.catalog.json` and `weapon-mods.catalog.json` only. | Source plans, snapshot sets, manifests, QA reports, review evidence, raw page bodies, or icon bytes. |
| Promotion evidence | One adjacent manifest and one bounded QA JSON per promoted catalog. | Runtime app behavior or a second public identity authority. |
| Closeout docs and work records | Commands, paths, source authority, schema boundaries, deferred scope, and handoffs. | New application behavior not implemented and verified elsewhere. |

### Shared Profile And Data Flow

The least risky execution path is one profile with shared discovery/fetch/replay and two catalog
writers. Do not refactor the generic profile model to arbitrary multi-artifact support unless the
change is small and regression-covered; a profile-specific EPIC-12 dual-write path is preferable to a
broad ingestion-platform rewrite.

```text
promoted EPIC-03 catalog + EPIC-05 raw equipment-template boundary
                              |
bounded EPIC-12 source-shape checkpoint
                              |
shared source plan + weapon/modifier identity registries
                              |
digest-confirmed fetch of reviewed detail pages + icon metadata
                              |
complete SourceSnapshotSetManifest
                              |
selected offline replay, no network
                              |
weapon-base extraction      weapon-modifier extraction
           \                     /
            \                   /
         semantic normalization + compatibility facts
                /                            \
         WeaponCatalog                 WeaponModifierCatalog
                \                            /
      manifest + QA for each exact promoted path
                              |
                     exact-path promotion
```

Live access is manual-only and never part of `npm run verify`. Offline replay is mandatory for
production promotion and must reject partial, mixed-profile, extra, missing, duplicate, edited,
digest-mismatched, or path-escaping inputs before extraction begins.

### Runtime Contract

The exact type names may adjust to local style, but these distinctions are acceptance requirements.

```text
WeaponsAndModsCatalogProfile
  id: "epic-12-weapons-mods"
  sourceTarget: "BACKLOG"
  sourceEpic: "EPIC-12"
  sourceCaps: shared seed/detail/media/request/retry/continuation/byte caps
```

```text
WeaponCatalog
  schemaVersion
  catalogVersion
  sectionDigests
  generatedAt
  generator
  profile
  dependencyDigests: [EPIC-03 summary]
  sourceSet
  dispositions
  weapons
  remoteMedia

CatalogWeaponRecord
  id: WeaponId
  sourceKey: string
  variantKey: string | null
  name
  normalizedName
  wikiUrl
  pageIdentity
  familyKey
  handedness
  damageType
  damageMin
  damageMax
  requirementAttributeId: AttributeId | null
  requirementAttributeName: string | null
  requirementRank: number | null
  requirementState: known | unresolved | none | unknown
  allowedModifierSlots: non-empty reviewed slot-family list
  templateItems: WeaponTemplateItemCrosswalk[]
  displayState
  iconId
  provenance
```

```text
WeaponModifierCatalog
  schemaVersion
  catalogVersion
  sectionDigests
  generatedAt
  generator
  profile
  dependencyDigests: [EPIC-03 summary]
  sourceSet
  dispositions
  weaponModifiers
  remoteMedia

CatalogWeaponModifierRecord
  id: WeaponModifierId
  sourceKey: string
  variantKey: string | null
  name
  normalizedName
  wikiUrl
  pageIdentity
  familyKey
  slotFamily
  applicableWeaponFamilies
  applicableHandedness
  templateModifiers: WeaponModifierTemplateCrosswalk[]
  effects: non-empty WeaponModifierEffect[]
  effectCompleteness: structured | mixed | note-only | unknown
  displayState
  iconId
  provenance
```

Minimum v1 structured modifier effect kinds are:

- `attribute-rank-delta`
- `requirement-rank-delta`
- `maximum-health-delta`
- `maximum-energy-delta`
- `armor-rating-delta`
- `damage-range-delta`
- `casting-time-delta`
- `recharge-time-delta`
- `enchantment-duration-delta`
- `stance-duration-delta`
- `note-only`
- `unknown`

The modifier catalog may use reviewed subject/scope fields where needed, but it must not encode
guessed probability math. HCT/HSR and similar chance-based behavior can be represented as
structured notes with stable codes and bounded Build Wars-authored text.

### Compatibility Helper Boundary

Add one narrow pure helper only if lookup-only consumers are insufficient:

```text
explainWeaponModifierCompatibility(weapon, modifier)
  -> { kind: compatible | incompatible | unknown, reasons: reason-code[] }
```

Reason codes should cover at least slot-family mismatch, weapon-family mismatch, handedness
mismatch, offhand/two-handed conflict, unresolved source facts, and unsupported semantics.

The helper does not:

- validate a full authored build
- decide weapon-set occupancy
- evaluate whether a character meets requirement rank
- aggregate stat totals
- interpret chance-based effects
- read files, manifests, or generated JSON paths
- import `src/app`, React, DOM APIs, browser storage, or Python code

## Implementation

### Phase 1: BW-1201 Contracts, Source Shape, And EPIC-12 Profile (~12% of effort)

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

- [ ] Mark `EPIC-12` and `BW-1201` in progress when implementation starts.
- [ ] Run a bounded source-shape checkpoint against `Equipment template format` plus the proposed
      weapon-base and weapon-modifier authority pages and representative detail pages for one-handed,
      two-handed, bow, caster, shield, focus, prefix, suffix, inscription, staff, and offhand
      cases.
- [ ] Freeze the exact seed titles, field-level source authority, dual-artifact strategy, caps,
      crosswalk policy, source-key/variant-key rules, and non-waivable blockers before schema freeze.
- [ ] Define schema-v1 `WeaponCatalog`, `WeaponModifierCatalog`, page identity, requirement,
      template crosswalk, disposition, source-set summary, effect, display, and compact dependency
      contracts.
- [ ] Define lookup outcomes for public ID, normalized-name, template item ID, and template
      modifier ID resolution, including `known`, `ambiguous`, `dispositioned`, and `unknown`.
- [ ] Define the narrow compatibility-helper input/output and unresolved reason contracts in
      `src/domain/weapon-mod-compatibility.ts`.
- [ ] Reuse existing `WeaponId`, `WeaponModifierId`, `TemplateEquipmentItemId`,
      `TemplateEquipmentModifierId`, and `AttributeId`. Do not modify `src/domain/ids.ts` or
      `src/domain/equipment.ts` unless the checkpoint proves a concrete deficiency.
- [ ] Preserve the authored-build placeholder `Weapon` and `WeaponModifier` interfaces instead of
      retrofitting catalog-only fields into them.
- [ ] Register `epic-12-weapons-mods` with fixture/offline/live modes, shared caps, and the six
      exact promoted artifact paths.
- [ ] Prefer a narrow EPIC-12 dual-output path in `pipeline.py` over a broad generic profile-model
      rewrite unless a generalization is small, obvious, and regression-covered.
- [ ] Keep existing EPIC-02, EPIC-03, EPIC-04, EPIC-10, and EPIC-11 profile behavior, exit codes,
      and network-free verification unchanged.

**Phase Gate:**

- [ ] Exact seed authority, public-ID policy, shared-profile strategy, runtime/audit split, and raw
      equipment-template boundary are settled.
- [ ] The contract can represent required base/mod facts without editor state, runtime manifest
      imports, full-stat APIs, or guessed chance-based math.
- [ ] `BW-1201` is marked done only after focused verification and its acceptance criteria pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/weapon-mod-compatibility.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_cli`

### Phase 2: BW-1202 Weapon Base Source Set, Identity, And Extraction (~16% of effort)

**Files:**

- `scripts/data/build_wars_ingest/source_set_protocol.py`
- `scripts/data/build_wars_ingest/equipment_template_rows.py`
- `scripts/data/build_wars_ingest/weapon_source_set.py`
- `scripts/data/build_wars_ingest/weapon_identity.py`
- `scripts/data/build_wars_ingest/weapon_base_identity_registry.json`
- `scripts/data/build_wars_ingest/weapon_base_extractor.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_source_set_protocol.py`
- `scripts/data/build_wars_ingest/tests/test_equipment_template_rows.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_identity.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_base_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/weapons-and-mods/`
- `work/tickets/12-weapons-and-mods/BW-1202-weapon-base-type-extractors.md`

**Tasks:**

- [ ] Mark `BW-1202` in progress only after the contract/profile gate passes.
- [ ] Build the shared EPIC-12 source planner so weapon-base candidates are derived from bounded seed
      pages and `Equipment template format` item rows, not ad hoc page lists.
- [ ] Allocate stable `WeaponId` values from registry-backed source keys and variant keys that are
      independent of request order, page order, filesystem order, and future page renames.
- [ ] Account for every base candidate as accepted weapon, supported relationship, explicit
      exclusion, unsupported disposition, or blocking finding.
- [ ] Preserve requested, normalized, redirected, canonical, page ID, revision ID, source revision
      timestamp, retrieval timestamp, source family, and dependency facts.
- [ ] Extract deterministic raw base records for one-handed martial, two-handed, bow variants,
      caster weapons, shields, focuses, unresolved requirements, and malformed source shapes.
- [ ] Normalize and retain requirement labels, damage types, damage ranges, handedness terms, and
      base item ID crosswalk evidence without pulling UI-specific logic into extraction.
- [ ] Produce a canonical ignored source plan section with base-family counts, accepted/excluded
      counts, planned detail/media titles, identity-registry digest, `sourceSetDigest`, and
      `sourcePlanDigest`.
- [ ] Implement digest-confirmed fetch and selected snapshot-set replay checks for the base side
      without allowing source drift or partial replay.
- [ ] Keep fixtures synthetic and bounded. Store no live page bodies, copied long prose, icon bytes,
      thumbnails, or screenshots.

**Phase Gate:**

- [ ] The base-weapon source graph is finite, reviewable, digest-bound, and every candidate is
      accounted for.
- [ ] `WeaponId` allocation is stable, collision-checked, and separated from raw template item IDs.
- [ ] Replay rejects incomplete, duplicate, mixed-profile, path-escaping, and digest-mismatched
      base inputs before extraction.
- [ ] `BW-1202` is marked done only after focused verification and its acceptance criteria pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_source_set_protocol build_wars_ingest.tests.test_equipment_template_rows build_wars_ingest.tests.test_weapon_source_set build_wars_ingest.tests.test_weapon_identity build_wars_ingest.tests.test_weapon_base_extractor build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_source_set build_wars_ingest.tests.test_rune_source_set build_wars_ingest.tests.test_insignia_source_set`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-mods --root work/runs/data-ingestion/epic-12-fixture-a --fixture-root test/fixtures/data-ingestion`

### Phase 3: BW-1203 Weapon Modifier Sources, Identity, And Extraction (~16% of effort)

**Files:**

- `scripts/data/build_wars_ingest/equipment_template_rows.py`
- `scripts/data/build_wars_ingest/weapon_source_set.py`
- `scripts/data/build_wars_ingest/weapon_identity.py`
- `scripts/data/build_wars_ingest/weapon_modifier_identity_registry.json`
- `scripts/data/build_wars_ingest/weapon_modifier_extractor.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_identity.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_modifier_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `test/fixtures/data-ingestion/weapons-and-mods/`
- `work/tickets/12-weapons-and-mods/BW-1203-upgrade-component-and-inscription-sources.md`

**Tasks:**

- [ ] Mark `BW-1203` in progress only after the shared source-set/base gate passes.
- [ ] Extend the shared EPIC-12 source plan so modifier candidates come from bounded template rows,
      reviewed overview pages, and planned detail pages rather than free-form discovery.
- [ ] Allocate stable `WeaponModifierId` values from registry-backed source keys and variant keys,
      independent of template row order or title normalization drift.
- [ ] Account for every modifier candidate as accepted modifier, supported relationship, explicit
      exclusion, unsupported disposition, or blocking finding.
- [ ] Extract deterministic raw records for prefixes, suffixes, inscriptions, staff heads, staff
      wrappings, shield/offhand modifiers, caster-specific modifiers, missing icons, and malformed
      source shapes.
- [ ] Preserve raw effect fields, applicable weapon-family evidence, handedness evidence, detail-page
      identity, icon candidates, and template modifier crosswalk evidence without forcing early
      semantic collapse.
- [ ] Distinguish active, historical, unsupported, and ambiguous modifier crosswalks where source
      evidence requires it.
- [ ] Resolve metadata-only icons through bounded `imageinfo` lookups only and keep `iconId`
      nullable with stable QA findings.
- [ ] Keep live refresh manual-only, digest-confirmed, and replayable from one selected complete
      snapshot set.
- [ ] Keep fixtures synthetic and bounded. Store no copied long prose, no icon bytes, and no runtime
      media assets.

**Phase Gate:**

- [ ] The shared source plan now accounts for both base and modifier inventories without duplicate or
      drifting candidate identity.
- [ ] Raw modifier extraction is deterministic, source-traceable, and preserves unsupported or
      ambiguous source fields as QA/disposition evidence.
- [ ] Public `WeaponModifierId` allocation is stable and distinct from raw template modifier IDs.
- [ ] `BW-1203` is marked done only after focused verification and its acceptance criteria pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_source_set build_wars_ingest.tests.test_weapon_identity build_wars_ingest.tests.test_weapon_modifier_extractor build_wars_ingest.tests.test_icons build_wars_ingest.tests.test_pipeline`
- `npm run data:test`

### Phase 4: BW-1204 Semantics, Compatibility, And Domain Helper (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/weapon_semantics.py`
- `scripts/data/build_wars_ingest/weapon_base_extractor.py`
- `scripts/data/build_wars_ingest/weapon_modifier_extractor.py`
- `scripts/data/build_wars_ingest/weapon_catalog.py`
- `scripts/data/build_wars_ingest/weapon_modifier_catalog.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_semantics.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_modifier_catalog.py`
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

- [ ] Mark `BW-1204` in progress only after both extraction gates pass.
- [ ] Freeze the reviewed vocabularies for handedness, slot families, modifier families,
      compatibility reason codes, and supported effect kinds from the Phase 1-3 source census.
- [ ] Normalize weapon-base facts into framework-neutral family, handedness, damage, requirement,
      allowed slot, display, and provenance records.
- [ ] Normalize modifier facts into framework-neutral slot-family, applicability, effect,
      completeness, display, and provenance records.
- [ ] Encode deterministic numeric effects only where subject, sign, unit, and applicability are
      source-clear.
- [ ] Route HCT/HSR, mastery, chance-based, conditional, enchantment, stance, and similar uncertain
      behavior to reviewed `note-only` or `unknown` effects unless a closed structured wire form is
      proven safe.
- [ ] Implement `explainWeaponModifierCompatibility` or an equivalent pure API that explains
      compatible, incompatible, and unknown outcomes without owning build/editor state.
- [ ] Add fixtures for two-handed/offhand conflicts, bow-variant restrictions, caster-only
      modifiers, shield/focus-only modifiers, unresolved requirements, incompatible slot families,
      note-only effects, unknown effects, and same-page multi-variant records.
- [ ] Require every accepted modifier record to have a non-empty effect list, even when the result is
      reviewed `note-only` or `unknown`.
- [ ] Keep requirement facts explicit. Do not evaluate whether a character satisfies the requirement
      in this sprint.

**Phase Gate:**

- [ ] Structured semantics can explain base/mod structural compatibility and requirement facts without
      overclaiming attribute satisfaction, set legality, or combat behavior.
- [ ] Chance-based and unsupported behaviors remain typed and visible instead of guessed arithmetic.
- [ ] The helper boundary stays pure, deterministic, and small.
- [ ] `BW-1204` is marked done only after focused verification and its acceptance criteria pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/weapon-mod-compatibility.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_semantics build_wars_ingest.tests.test_weapon_catalog build_wars_ingest.tests.test_weapon_modifier_catalog`

### Phase 5: BW-1205 Equipment Template ID Mapping And Raw-Boundary Regression (~14% of effort)

**Files:**

- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/weapon-catalog.test.ts`
- `test/domain/weapon-mod-catalog.test.ts`
- `test/template-compatibility/catalog-resolution.test.ts`
- `test/template-compatibility/equipment-catalog-resolution.test.ts`
- `test/template-compatibility/equipment-template.test.ts`
- `scripts/data/build_wars_ingest/equipment_template_rows.py`
- `scripts/data/build_wars_ingest/weapon_catalog.py`
- `scripts/data/build_wars_ingest/weapon_modifier_catalog.py`
- `work/tickets/12-weapons-and-mods/BW-1205-equipment-template-id-mapping.md`

**Tasks:**

- [ ] Mark `BW-1205` in progress only after the semantics/compatibility gate passes.
- [ ] Add collision-safe lookup coverage for template item IDs and template modifier IDs over the new
      catalogs, including `known`, `ambiguous`, `dispositioned`, and `unknown` outcomes.
- [ ] Prove that decoded raw equipment-template items can be mapped by caller-supplied lookups while
      raw slot IDs, raw color IDs, raw item IDs, and raw modifier IDs remain unchanged.
- [ ] Keep unknown, unsupported, ambiguous, and duplicate raw IDs visible and exact-source
      preservable for later EPIC-13/14/17 handling.
- [ ] Add regression fixtures for known weapon item IDs, known modifier IDs, unknown item IDs,
      unknown modifier IDs, ambiguous/dispositioned IDs, duplicate modifier entries, and mixed
      weapon/non-weapon template payloads.
- [ ] Do not change `decodeEquipmentTemplate`, `exportEquipmentTemplate`, raw field ordering,
      fidelity proofs, or canonical export rules.
- [ ] Document and test that EPIC-12 stops at pure catalog lookups and does not introduce a lossy
      semantic equipment-template resolver in this sprint.

**Phase Gate:**

- [ ] EPIC-05 raw equipment-template behavior is unchanged.
- [ ] Known IDs resolve through caller-supplied catalogs; unresolved IDs remain visible and
      preservable.
- [ ] The lookup layer is sufficient for this sprint without taking ownership of semantic weapon-set
      resolution.
- [ ] `BW-1205` is marked done only after focused verification and its acceptance criteria pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/template-compatibility/catalog-resolution.test.ts test/template-compatibility/equipment-catalog-resolution.test.ts test/template-compatibility/equipment-template.test.ts`
- `npm run test:run -- test/template-compatibility/compatibility-matrix.test.ts`

### Phase 6: BW-1206 Assembly, QA, Review, And Exact-Path Promotion (~14% of effort)

**Files:**

- `scripts/data/build_wars_ingest/weapon_catalog.py`
- `scripts/data/build_wars_ingest/weapon_modifier_catalog.py`
- `scripts/data/build_wars_ingest/weapon_semantics.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_modifier_catalog.py`
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

- [ ] Mark `BW-1206` in progress only after source-set, extraction, semantics, and raw-mapping
      gates pass.
- [ ] Assemble canonical `WeaponCatalog` and `WeaponModifierCatalog` outputs from one selected
      complete EPIC-12 snapshot set.
- [ ] Emit one adjacent generated-artifact manifest and one bounded QA JSON per promoted catalog.
- [ ] Define semantic digest inputs separately for the base and modifier catalogs so consumer-visible
      mutations change the owning `catalogVersion` and audit-only path/timestamp changes do not.
- [ ] Add QA for source accounting, zero-output rejection, ID uniqueness, normalized-name
      collisions, page identity, EPIC-03 requirement joins, base-slot facts, modifier applicability,
      template item crosswalks, template modifier crosswalks, effect completeness, compatibility
      gaps, copied-text policy, icon metadata, output caps, section digests, dual-artifact
      consistency, baseline diffs, and artifact integrity.
- [ ] Treat unaccounted player-usable candidates, ambiguous public-ID allocation, missing required
      accepted crosswalks, invalid EPIC-03 joins, digest mismatch, unreadable artifacts, and copied
      text leakage as blocking.
- [ ] Generate the synthetic EPIC-12 fixture outputs twice under a fixed clock and prove byte
      identity for both catalogs, both manifests, both QA reports, section digests, ordering, and
      finding IDs.
- [ ] Run bounded live `discover`; review source identities, candidate counts, family/slot coverage,
      template crosswalk coverage, caps, registry digests, and `sourceSetDigest` before fetch.
- [ ] Run digest-confirmed `fetch` only with the reviewed source plan, then replay the selected
      complete snapshot set offline twice under a fixed clock.
- [ ] Perform first-baseline review across both catalogs together: accepted counts, family coverage,
      requirement coverage, slot-family coverage, crosswalk coverage, dispositions, icon decisions,
      digest values, and both release gates.
- [ ] Generate approved production bytes only from selected offline inputs. Never hand-edit promoted
      JSON.
- [ ] Add exact `.gitignore` parent and file exceptions only for the six EPIC-12 promoted files and
      verify representative source plans, snapshot sets, raw snapshots, source-plan QA, summaries,
      logs, and media bytes remain ignored or absent.

**Phase Gate:**

- [ ] The six exact EPIC-12 promoted files are byte-reproducible, mutually consistent, and exactly
      allowlisted.
- [ ] Both `appConsumptionGate` and `publicReleaseGate` pass for both catalogs.
- [ ] Runtime consumers can import the catalog JSON files without reading manifests, QA reports,
      source plans, snapshot sets, Python tooling, or wiki APIs.
- [ ] If live source access, selected replay inputs, or review capacity is unavailable, leave
      `BW-1206` and the sprint blocked rather than promoting fixture data.
- [ ] `BW-1206` is marked done only after focused verification and its acceptance criteria pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-mods --root work/runs/data-ingestion/epic-12-fixture-a --fixture-root test/fixtures/data-ingestion`
- Repeat fixture generation into `work/runs/data-ingestion/epic-12-fixture-b` and compare both
  catalogs, both manifests, and both QA JSON files byte-for-byte.
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-12-weapons-mods --root work/runs/data-ingestion/epic-12-live --allow-live-network --stage discover`
- Run `fetch` with the reviewed `--source-plan` and exact `--confirm-source-set-digest`, then run
  `offline --profile epic-12-weapons-mods --snapshot-set <selected-manifest>` twice under a fixed
  clock.
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_catalog build_wars_ingest.tests.test_weapon_modifier_catalog build_wars_ingest.tests.test_artifacts build_wars_ingest.tests.test_qa build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `npm run test:run -- test/domain/data-ingestion-contracts.test.ts test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/weapon-mod-compatibility.test.ts`
- `git check-ignore -v data/generated/epic-12/weapons.catalog.json data/generated/epic-12/weapons.catalog.manifest.json data/generated/epic-12/weapon-mods.catalog.json data/generated/epic-12/weapon-mods.catalog.manifest.json data/qa/epic-12/weapons.catalog.qa.json data/qa/epic-12/weapon-mods.catalog.qa.json`
- `git status --short`

### Phase 7: BW-1207 Runtime Docs, Full Verification, And Closeout (~8% of effort)

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `data/source-snapshots/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/template-compatibility.md`
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

- [ ] Mark `BW-1207` in progress only after promotion passes.
- [ ] Document the final source authority, shared EPIC-12 profile, registry policy, crosswalk policy,
      exact commands, exact promoted paths, replay rules, semantic digest scope, QA gates, and known
      deferred behaviors.
- [ ] State that only `data/generated/epic-12/weapons.catalog.json` and
      `data/generated/epic-12/weapon-mods.catalog.json` are runtime-eligible, and only through later
      app-owned imports in `src/app/catalogs.ts`.
- [ ] Document that manifests, QA reports, source plans, snapshot sets, raw snapshots, QA summaries,
      review evidence, Python tooling, and icon bytes remain non-runtime.
- [ ] Document the EPIC-05 raw-template boundary: decode/export remains exact-source and unknown IDs
      stay preservable.
- [ ] Explain downstream handoffs to EPIC-13, EPIC-14, EPIC-17, EPIC-20, and EPIC-21.
- [ ] Confirm that the current editor UI, local persistence/share flows, raw template codec, and
      previously promoted EPIC-03/04/10/11 artifacts remain unchanged.
- [ ] Run full repository verification with `npm run verify`.
- [ ] Sync ticket status, sprint status, ledger state, and ticket-burn result manifests so every
      record agrees on IDs, paths, commands, scope, and completion state.
- [ ] Do not create a commit as part of the sprint execution.

**Phase Gate:**

- [ ] Documentation, promoted artifacts, ticket states, sprint state, ledger state, and result
      manifests are internally consistent.
- [ ] `npm run verify` passes without live network access.
- [ ] `BW-1207`, `EPIC-12`, and `SPRINT-013` are marked complete only after all gates pass.
- [ ] No commit is created by the sprint executor.

**Verification:**

- `npm run verify`

## Files Summary

| File or Area | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts`, `src/domain/catalog-lookup.ts`, `src/domain/weapon-mod-compatibility.ts`, `src/domain/index.ts` | Create/modify | Add framework-neutral catalog contracts, lookups, and the narrow compatibility helper. |
| `scripts/data/build_wars_ingest/config.py`, `profiles.py`, `pipeline.py`, `cli.py` | Modify | Register `epic-12-weapons-mods`, shared caps, staged discover/fetch/offline flows, and dual-output promotion. |
| `scripts/data/build_wars_ingest/source_set_protocol.py` | Modify narrowly | Reuse or extend digest confirmation and confined replay validation only if EPIC-12 needs shared helpers. |
| `scripts/data/build_wars_ingest/equipment_template_rows.py` | Create | Parse bounded `Equipment template format` item/modifier rows for shared EPIC-12 use. |
| `scripts/data/build_wars_ingest/weapon_source_set.py`, `weapon_identity.py`, `weapon_base_identity_registry.json`, `weapon_modifier_identity_registry.json` | Create | Plan the reviewed source graph and allocate stable public IDs for weapons and modifiers. |
| `scripts/data/build_wars_ingest/weapon_base_extractor.py`, `weapon_modifier_extractor.py`, `weapon_semantics.py` | Create | Extract and normalize raw facts, compatibility signals, and conservative effect semantics. |
| `scripts/data/build_wars_ingest/weapon_catalog.py`, `weapon_modifier_catalog.py`, `artifacts.py`, `qa.py` | Create/modify | Assemble deterministic catalogs, manifests, QA reports, digests, and release gates. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Cover rows, source planning, identity, extraction, semantics, QA, artifacts, pipeline, and CLI behavior. |
| `test/domain/weapon-catalog.test.ts`, `weapon-mod-catalog.test.ts`, `weapon-mod-compatibility.test.ts`, `data-ingestion-contracts.test.ts` | Create/modify | Validate TypeScript wire contracts, lookups, compatibility outcomes, and Python/TS alignment. |
| `test/template-compatibility/catalog-resolution.test.ts`, `equipment-catalog-resolution.test.ts`, `equipment-template.test.ts` | Modify/create | Prove EPIC-12 mapping works over decoded raw equipment templates without weakening exact-source fidelity. |
| `test/fixtures/data-ingestion/weapons-and-mods/`, `test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json`, `fixture-weapon-mods.catalog.json` | Create | Add minimized synthetic EPIC-12 fixtures and deterministic golden catalogs. |
| `.gitignore` | Modify narrowly | Allowlist only the six approved EPIC-12 promoted files and required parent directories. |
| `data/generated/epic-12/*.json`, `data/qa/epic-12/*.json` | Create/allowlist | Promote the two runtime catalogs, their manifests, and their machine-readable QA reports. |
| `README.md`, `scripts/data/README.md`, `data/**/README.md`, `compendium/*.md` | Modify/create | Document EPIC-12 commands, paths, boundaries, source policy, and downstream handoffs. |
| `work/tickets/12-weapons-and-mods/*.md`, `work/sprints/SPRINT-013.md`, `work/sprints/ledger.tsv`, `work/runs/ticket-burn/BACKLOG/20260902T192541Z/*.json` | Modify/create | Track planning, execution, traceability, status, and result-manifest consistency. |

## Definition of Done

### Source, Profile, And Identity Gates

- [ ] The final EPIC-12 source authority is finite, documented, digest-bound, and approved before
      detail fetch or promotion.
- [ ] One shared `epic-12-weapons-mods` profile owns discovery, fetch, and offline replay for both
      catalogs.
- [ ] Every weapon-base and weapon-modifier candidate becomes an accepted record, supported
      relationship, explicit exclusion, unsupported disposition, or blocking finding.
- [ ] Stable `WeaponId` and `WeaponModifierId` allocation is registry-backed, source-order
      independent, collision-checked, and distinct from raw template IDs.
- [ ] Existing EPIC-02/03/04/10/11 profiles, outputs, CLI behavior, and tests remain compatible.

### Runtime Contract Gates

- [ ] `WeaponCatalog` and `WeaponModifierCatalog` are framework-neutral, JSON-compatible,
      schema-versioned, and exported through `src/domain`.
- [ ] `src/domain` imports no React, DOM/browser APIs, storage, network, filesystem, app modules,
      generated manifests, QA reports, source snapshots, or Python modules.
- [ ] Weapon records include stable ID, source/variant keys, canonical name, normalized lookup key,
      wiki URL, page identity, family, handedness, damage facts, requirement facts, allowed modifier
      slots, template item crosswalks, display state, nullable icon ID, and compact provenance.
- [ ] Modifier records include stable ID, source/variant keys, canonical name, normalized lookup
      key, wiki URL, page identity, family, slot family, applicability facts, template modifier
      crosswalks, non-empty effects, completeness state, display state, nullable icon ID, and
      compact provenance.
- [ ] Runtime JSON excludes source plans, snapshot manifests, manifests, QA bodies, review bodies,
      raw page bodies, copied long prose, MediaWiki HTML, icon bytes, screenshots, thumbnails, and
      source-provided commands.

### Semantics, Compatibility, And Mapping Gates

- [ ] Deterministic base/mod structural compatibility can be explained through a pure helper or
      equivalent lookup-based API.
- [ ] Requirement facts are explicit and joined through EPIC-03 where source-clear; requirement
      satisfaction is not evaluated in this sprint.
- [ ] Deterministic numeric modifier behavior is structured only where source-clear.
- [ ] Chance-based, conditional, mastery, HCT/HSR, enchantment, stance, and similarly uncertain
      behaviors remain `note-only` or `unknown` unless exact semantics are proven.
- [ ] Template item and modifier ID lookups distinguish `known`, `ambiguous`, `dispositioned`, and
      `unknown` outcomes.
- [ ] Decoded raw equipment-template documents remain exact-source preservable and continue to expose
      unresolved raw IDs without lossy coercion.

### Determinism, QA, And Promotion Gates

- [ ] Fixture mode is synthetic and network-free.
- [ ] Live fetch requires `--allow-live-network`, registered `epic-12-weapons-mods`, exact
      `--source-plan`, exact `--confirm-source-set-digest`, and fixed Guild Wars Wiki API origin.
- [ ] Offline replay requires one complete selected EPIC-12 snapshot-set manifest and rejects
      partial, extra, missing, duplicate, mixed-profile, digest-mismatched, plan-mismatched,
      dependency-mismatched, or path-escaping inputs.
- [ ] Repeated fixed-clock fixture and selected offline runs are byte-identical for both catalogs,
      both manifests, both QA reports, section digests, ordering, and finding IDs.
- [ ] QA covers source accounting, ID uniqueness, page identity, EPIC-03 joins, crosswalk coverage,
      compatibility gaps, effect completeness, copied-text policy, icon metadata, output caps,
      baseline diffs, and artifact integrity.
- [ ] Unaccounted player-usable candidates, ambiguous public IDs, missing required accepted
      crosswalks, copied-text leakage, digest mismatch, unreadable artifacts, and QA overflow are
      blocking.
- [ ] `data/generated/epic-12/weapons.catalog.json`,
      `data/generated/epic-12/weapons.catalog.manifest.json`,
      `data/generated/epic-12/weapon-mods.catalog.json`,
      `data/generated/epic-12/weapon-mods.catalog.manifest.json`,
      `data/qa/epic-12/weapons.catalog.qa.json`, and
      `data/qa/epic-12/weapon-mods.catalog.qa.json` are the only promoted EPIC-12 exact paths.
- [ ] `appConsumptionGate` and `publicReleaseGate` pass for both catalogs.

### Closeout Gates

- [ ] Documentation explains source authority, exact paths and commands, runtime boundaries,
      crosswalk policy, compatibility-helper scope, mapping boundaries, deferred semantics, and
      downstream handoffs.
- [ ] `src/app/catalogs.ts`, current editor behavior, local persistence/sharing, raw template codec,
      and previously promoted EPIC-03/04/10/11 artifacts remain unchanged.
- [ ] `npm run verify` passes without live network access.
- [ ] Ticket, epic, sprint, ledger, and result-manifest records are status-consistent and path
      consistent.
- [ ] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Shared EPIC-12 profile plus dual outputs creates avoidable ingestion-platform churn. | Medium | High | Prefer a profile-specific dual-write path unless a generic refactor is small and regression-covered. |
| Source authority is broader or more inconsistent than expected. | High | High | Make the source-shape checkpoint the first gate and require a recorded amendment before broadening. |
| Weapon-base public identity drifts because multiple template item IDs map to one semantic base. | High | High | Use registry-backed `WeaponId` allocation with explicit crosswalks and stable source/variant keys. |
| Modifier identity or applicability is ambiguous across families or slots. | High | High | Preserve ambiguous crosswalks/dispositions and block promotion for unresolved accepted records. |
| Requirement facts do not join cleanly to EPIC-03 attributes. | Medium | High | Keep explicit unresolved requirement states and block accepted structured claims that cannot be sourced safely. |
| Chance-based behavior gets over-modeled as arithmetic. | High | High | Route HCT/HSR/mastery/conditional behavior to `note-only` or `unknown` unless exact closed semantics are proven. |
| Shared source-plan or replay helper changes regress EPIC-04/10/11. | Medium | High | Change `source_set_protocol.py` only narrowly and rerun existing profile regressions. |
| EPIC-05 raw-template fidelity is weakened by semantic mapping work. | Medium | High | Keep mapping in caller-side lookups and regression tests; do not change decode/export contracts. |
| Missing icon metadata or unsupported media handling leaks into runtime assets. | Medium | Medium | Keep metadata-only `imageinfo`, nullable `iconId`, `cachedBytes: false`, and blocking QA for icon-byte leakage. |
| QA caps or summaries hide material errors across two catalogs. | Low | High | Treat overflow and material truncation as blocking and keep machine-readable QA JSON exact-path promoted. |
| One catalog passes while the other fails, producing an inconsistent EPIC-12 promotion. | Medium | High | Gate completion on both catalogs, both manifests, both QA reports, and both release gates together. |
| Live source access or review capacity is unavailable. | Medium | Medium | Allow fixture/offline implementation to land, but leave `BW-1206` and the sprint blocked rather than promoting fixture data. |

## Security Considerations

- Treat source titles, redirects, page bodies, template rows, icon names, source plans, snapshot
  manifests, generated catalogs, QA evidence, and review notes as untrusted input.
- Permit network access only in explicit live mode with `--allow-live-network`, the registered
  profile, GET-only JSON requests, fixed Guild Wars Wiki API origin, finite timeouts, retry caps,
  continuation caps, and shared byte caps.
- Reject arbitrary endpoints, source-provided fetch URLs, category crawl, recursive link expansion,
  credentials, cookies, tokens, absolute child paths, `..` traversal, symlink escape, duplicate
  snapshot children, and digest mismatch.
- Parse wiki content as inert data. Never execute templates, Lua, HTML, JavaScript, CSS, links, or
  source-authored commands.
- Runtime JSON is inert data. Future UI must render names and notes as escaped text, never
  `innerHTML`.
- Bound accepted pages, title lengths, parser bytes, numeric ranges, effect counts, evidence
  excerpts, output bytes, and QA finding counts.
- Query icon metadata only and keep every runtime media record `cachedBytes: false`; do not store
  media bytes, thumbnails, screenshots, or data URLs in fixtures or runtime bundles.
- Keep source-policy classification field-level. Unknown copied material, digest mismatch, and
  unreadable artifacts remain non-waivable for public release.
- Do not introduce new package or Python dependencies without separate review and a recorded sprint
  amendment.

## Dependencies

- `EPIC-01` / `SPRINT-002` for source policy, provenance, media restrictions, manual review, exact
  path promotion, artifact retention, and QA gates.
- `EPIC-02` / `SPRINT-003` for the MediaWiki client, snapshots, parser adapter, icon metadata,
  canonical artifact writing, fixture/offline/live modes, and QA-report format.
- `EPIC-03` / `SPRINT-004` for promoted profession/attribute IDs, requirement joins, dependency
  digests, section digests, and passing QA gates.
- `EPIC-04` / `SPRINT-005` for source-plan digests, selected offline replay, semantic
  `catalogVersion`, compact runtime dispositions, and exact-path allowlisting precedent.
- `EPIC-05` / `SPRINT-006` for the exact-source raw equipment-template codec and unresolved-ID
  preservation boundary.
- `EPIC-06` / `SPRINT-007` for pure domain-rule-engine extension points and deterministic unresolved
  handling.
- `EPIC-10` / `SPRINT-011` and `EPIC-11` / `SPRINT-012` as the closest catalog precedents for
  bounded source authority, metadata-only media, registry/crosswalk handling, staged live discovery,
  offline replay, QA gates, and blocked promotion semantics.
- Future `EPIC-13`, `EPIC-14`, `EPIC-17`, `EPIC-20`, and `EPIC-21` consume the resulting catalogs
  for equipment metadata, editor flows, party/equipment use, search, and deeper analysis.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and `npm run data:setup` for the pinned parser
  environment.
- Guild Wars Wiki availability is required only for production `discover`/`fetch`; fixture
  generation, tests, build, and `npm run verify` remain offline.
- Maintainer review capacity is required for source-plan approval, warning dispositions, first
  baseline review, and any copied-text exception.

## Open Questions

No open question blocks non-interactive execution. Use these defaults unless a phase gate proves they
are wrong:

1. Keep separate `weapons.catalog.json` and `weapon-mods.catalog.json` artifacts. Only collapse to a
   combined artifact if Phase 1 shows it materially simplifies implementation without weakening
   runtime-import, exact-path, or QA boundaries.
2. Use one shared `epic-12-weapons-mods` profile and one shared source plan/snapshot set. Do not
   fork into two independent discovery graphs unless the reviewed source shape makes the shared graph
   unworkable.
3. Treat `Equipment template format` as the raw numeric ID authority, but require a bounded reviewed
   set of semantic authority pages for names, requirements, damage, slot facts, compatibility, and
   icon metadata. No crawl or site-search fallback is allowed.
4. The minimum weapon-base wire shape is family, handedness, damage facts, requirement facts,
   allowed modifier-slot facts, template item crosswalks, display state, icon metadata reference,
   and provenance. Named skin exhaustiveness is deferred.
5. The minimum modifier wire shape is slot family, applicability facts, template modifier crosswalks,
   deterministic structured effects, reviewed note-only/unknown states for chance-based behavior,
   display state, icon metadata reference, and provenance.
6. EPIC-12 owns only static structural compatibility between one weapon base and one modifier.
   Requirement satisfaction, set-wide legality, full editor resolution, duplicate-mod policy across
   sets, stat totals, and chance-based interpretation stay with EPIC-14, EPIC-17, and EPIC-21.
7. The following findings are non-waivable for EPIC-12 promotion: unaccounted player-usable base or
   modifier candidates, ambiguous public ID allocation for accepted records, missing required
   accepted crosswalks, invalid EPIC-03 joins on structured requirement claims, copied-text leakage,
   digest mismatch, unreadable artifacts, and incomplete selected offline replay.