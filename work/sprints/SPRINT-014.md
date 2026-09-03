---
id: SPRINT-014
title: Equipment Shell Model
status: completed
source_target: BACKLOG
source_epic: EPIC-13
source_epic_path: work/tickets/13-armor-and-equipment/EPIC.md
tickets:
  - BW-1301
  - BW-1302
  - BW-1303
  - BW-1304
  - BW-1305
created: 2026-09-03
updated: 2026-09-03
---

# Sprint 014: Equipment Shell Model

## Overview

This sprint turns `EPIC-13 Equipment Shell Model` into the framework-neutral semantic equipment
contract for one authored single-character `Build`. The shell represents five generic armor slots,
rune and insignia attachments, fixed headgear attribute-rank behavior, and up to four weapon sets
containing semantic weapon and modifier selections. Empty, partial, stale, and explicitly
unresolved choices remain recoverable.

EPIC-13 owns the authored loadout container, fixed slot topology, armor attachment semantics,
headgear/rune attribute-rank handoff, weapon-set occupancy, modifier-slot handoff, and structured
validation fixtures. EPIC-10, EPIC-11, and EPIC-12 remain authoritative for rune, insignia, weapon,
and modifier catalog facts. The loadout stores catalog IDs and unresolved semantic placeholders; it
does not copy generated catalog records into authored state.

The sprint does not add equipment editor UI, app catalog wiring, local-library non-null equipment
persistence, share-url equipment payloads, semantic equipment-template import/export, armor or
weapon skins, dyes, color IDs, inventory identity, acquisition facts, full stat totals, combat
simulation, DPS, party equipment, search/tooltips, or guide content. EPIC-14 owns app integration
and persistence migration, EPIC-17 owns raw equipment-template workflows, EPIC-20 owns search and
tooltips, and EPIC-21 owns broader effect/stat aggregation.

Binding planning decisions:

1. Introduce `EquipmentLoadout` as the preferred authored type. Keep `EquipmentTemplate` only as a
   documented compatibility alias if needed to avoid broad import churn.
2. Keep `Build.equipment` nullable. `equipment: null` means no semantic equipment is authored in
   the current workflow. An empty `EquipmentLoadout` means equipment state exists but has no selected
   upgrades or weapons. Both states are valid and must not emit equipment issues.
3. Authored equipment stores only semantic catalog selections, typed unresolved placeholders, and
   fixed topology. It must not store raw template item/modifier IDs, template color IDs, skin IDs,
   dye IDs, inventory IDs, acquisition facts, wiki URLs, generated catalog records, manifests, QA
   evidence, or media.
4. Armor piece identity is the canonical armor slot. `ArmorPieceId` may remain exported for
   compatibility, but it must not imply an armor-skin catalog.
5. Armor profession is derived from `Build.primaryProfessionId`; it is not duplicated in every armor
   row.
6. Numeric base armor rating is omitted in v1. A future source-policy-backed ticket must introduce
   base armor facts if a validated consumer needs them.
7. Headgear contributes a fixed +1 rank to one selected primary-profession attribute. Phase 2 must
   confirm the approved source-policy basis for this fact before implementation ships it.
8. Two-handed occupancy is derived from the resolved EPIC-12 weapon record, not from a separate
   authored flag that can drift from catalog truth.
9. Known unmet weapon requirements are advisory warnings. Unknown or unresolved requirement inputs
   make validation unresolved instead of producing false legality conclusions.
10. Equipment validation extends the existing `ValidationIssue` and `ValidationResult` contracts.
    No parallel validator or UI-specific result shape is introduced.

## Use Cases

1. **Preserve old builds**: Existing editor, library, template, and test fixtures with
   `equipment: null` continue to compile, validate, render, and persist as before.
2. **Create an empty loadout**: Domain callers can construct five empty armor slots and four empty
   weapon sets in canonical order without selecting any equipment.
3. **Edit armor incrementally later**: EPIC-14 can attach known or unresolved rune and insignia
   selections per armor slot without exposing raw template fields or cosmetic item choices.
4. **Apply headgear and rune rank facts**: Domain helpers can produce additive rank adjustments for
   `calculateEffectiveAttributeRank` while preserving unresolved selections and not owning full
   stat aggregation.
5. **Project insignia applicability**: Equipment validation can use the EPIC-11 per-slot insignia
   helper and caller-supplied catalog facts to distinguish legal, inapplicable, note-only, and
   unknown states.
6. **Represent weapon sets**: A build can distinguish empty hands, one-handed pairs, off-hand-only
   partial state, two-handed state, unresolved weapons, known modifiers, unresolved modifiers, and
   duplicate occupied modifier slots.
7. **Explain equipment problems**: `validateBuild` can emit deterministic equipment issues with the
   same severity, path, location, related-entity, ordering, completeness, and resolution semantics
   as existing profession, attribute, and skill validation.
8. **Keep raw templates separate**: EPIC-17 can later map raw equipment-template facts into semantic
   selections while EPIC-05 exact-source replay and raw field preservation remain isolated.
9. **Hand off future UI cleanly**: EPIC-14 receives clear contracts, fixtures, and validation
   categories before it builds equipment controls.

## Architecture

### Scope Boundary

| Area           | In Scope                                                                                                                                                                                          | Out Of Scope                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authored model | One single-character semantic `EquipmentLoadout`, five armor slots, four weapon sets, empty states, known catalog ID selections, unresolved semantic placeholders, and pure constructors/helpers. | Party equipment, guide equipment, backend sync, inventory identity, raw template exact replay, cosmetic skins, dye/color IDs, screenshots, icons, acquisition facts, economic data. |
| Armor          | Canonical slot ordering, rune/insignia attachment points, headgear attribute selection, armor profession derivation, malformed slot detection, and caller-supplied catalog validation.            | Armor skin catalogs, campaign/prestige appearance, source-derived armor catalog generation, hit-location math, base armor totals, full health/energy/armor totals.                  |
| Weapons        | Main-hand/off-hand/two-handed occupancy, semantic weapon/modifier selections, modifier occupied-slot checks, pairwise EPIC-12 compatibility handoff, and requirement warnings.                    | DPS, attack timing, damage simulation, unique item exhaustiveness, party weapon sets, raw template item IDs, weapon skins.                                                          |
| Validation     | Existing `ValidationIssue`, `ValidationResult`, ordering, truncation, `complete`, `resolved`, `exhaustive`, and catalog-version semantics extended for equipment.                                 | New result shapes, UI-specific validation objects, generated data imports in domain, app presentation logic.                                                                        |
| Runtime app    | Compile compatibility and null-equipment regression coverage.                                                                                                                                     | Equipment editor controls, non-null equipment persistence migration, backup/restore migration, share-url equipment encoding, app catalog wiring for EPIC-10/11/12.                  |

### Authored Contract

Exact TypeScript names may adjust to local style, but the final contract must preserve these
distinctions:

```text
EquipmentLoadout
  schemaVersion: 1
  armor: readonly ArmorPiece[]
  weaponSets: readonly WeaponSet[]

EquipmentSelection<Id>
  kind: "known"
  id: Id

UnresolvedEquipmentSelection
  kind: "unresolved"
  label: string | null
  reason: string
  candidateCatalogId: number | null

ArmorPiece
  slot: ArmorSlot
  rune: EquipmentSelection<RuneId> | UnresolvedEquipmentSelection | null
  insignia: EquipmentSelection<InsigniaId> | UnresolvedEquipmentSelection | null
  headgearAttribute:
    EquipmentSelection<AttributeId> | UnresolvedEquipmentSelection | null

WeaponSet
  slot: WeaponSetSlot
  mainHand: WeaponHandSelection | null
  offHand: WeaponHandSelection | null

WeaponHandSelection
  weapon: EquipmentSelection<WeaponId> | UnresolvedEquipmentSelection | null
  modifiers: readonly (EquipmentSelection<WeaponModifierId> | UnresolvedEquipmentSelection)[]
  requirement: AuthoredWeaponRequirement | null

AuthoredWeaponRequirement
  attribute: EquipmentSelection<AttributeId> | UnresolvedEquipmentSelection | null
  rank: number | null
  reason: "catalog-unresolved" | "user-visible-placeholder"
```

Contract rules:

- `schemaVersion` is the loadout schema version, not a generated catalog version.
- Empty attachment slots are `null`; unresolved selections are explicit discriminated values.
- `candidateCatalogId` may preserve a numeric semantic catalog candidate, but it is not treated as
  resolved without current catalog evidence.
- Unresolved labels and reasons are bounded strings for later UI display, but validation messages do
  not interpolate untrusted labels directly.
- `AuthoredWeaponRequirement` exists only for catalog-unresolved requirement facts. When the current
  weapon catalog has a resolved requirement, catalog truth wins.
- No raw template IDs or cosmetic fields appear in this authored contract.

### Canonical Structure

Use stable constants for topology:

```text
ARMOR_SLOTS = ["head", "chest", "hands", "legs", "feet"]
WEAPON_SET_SLOTS = ["set-1", "set-2", "set-3", "set-4"]
EQUIPMENT_LOADOUT_SCHEMA_VERSION = 1
HEADGEAR_ATTRIBUTE_BONUS = 1
MAX_ARMOR_ROWS_TO_VALIDATE = 32
MAX_WEAPON_SET_ROWS_TO_VALIDATE = 16
MAX_MODIFIERS_PER_HAND_TO_VALIDATE = 16
```

Default construction produces one row per canonical armor slot and one row per canonical weapon set,
in order. Validation must still handle malformed input arrays: missing rows, duplicate slots,
unknown slot strings, non-canonical ordering, over-limit arrays, invalid discriminants, unsafe
integers, and extra fields are reported or ignored according to the validation contract without
mutating caller objects.

### Armor Mechanics

Armor rules use only the authored loadout, the build's primary profession, and optional
caller-supplied profession/rune/insignia catalog views:

- A canonical loadout has exactly one armor row for each armor slot.
- A non-head row with a headgear attribute selection emits an error.
- A known headgear attribute must resolve to a primary attribute for the build's primary profession.
  Missing primary profession or unresolved attribute evidence emits unresolved or incomplete issues,
  not a guessed mismatch.
- The fixed headgear contribution is `+1` and is emitted as a caller-consumable effective-rank
  adjustment only after the headgear selection is valid.
- Rune rank effects reuse `summarizeAttributeRuneEffects` so EPIC-13 does not duplicate highest
  stacking behavior.
- Insignia applicability reuses `resolveInsigniaEffectsForArmorSlot` where relevant. EPIC-13 checks
  loadout placement and restrictions; EPIC-21 owns condition evaluation and full stat totals.
- Unknown rune and insignia IDs remain unresolved selections, not deleted or coerced.

### Weapon Mechanics

Weapon rules use only the authored loadout and optional caller-supplied profession/attribute/weapon
catalog views:

- A weapon set can be empty, partial, paired, two-handed, conflicting, or unresolved.
- Main-hand and off-hand placement is checked from EPIC-12 `equipRole` and `handedness` facts.
- A two-handed weapon in the main hand cannot silently coexist with an off-hand selection.
- A two-handed weapon authored in the off-hand is a wrong-hand error.
- A modifier attached to an unresolved or missing weapon emits a structured unresolved issue.
- A known modifier delegates pairwise compatibility to `explainWeaponModCompatibility`; EPIC-13
  separately checks duplicate occupied modifier slots on the selected weapon instance.
- Weapon and modifier catalog-set versions/digests must match before compatibility outcomes are
  trusted.
- Requirement checks use current weapon catalog facts first. Known unmet requirements are warnings.
  Unresolved requirements, unresolved attributes, missing rank-adjustment evidence, or catalog gaps
  make the validation result unresolved.
- Requirement evaluation may consider all authored sets for warnings. Active-set policy remains an
  EPIC-14 UI decision unless implementation finds a stronger existing convention.

### Validation Catalog Views

`BuildValidationInput` gains optional minimal equipment catalog views. Exact names may adjust, but
the final shape must avoid importing generated JSON into `src/domain`:

```text
equipmentCatalogs?: {
  runes?: {
    catalogVersion: string | null
    records: readonly CatalogRuneRecord[]
  }
  insignias?: {
    catalogVersion: string | null
    records: readonly CatalogInsigniaRecord[]
  }
  weapons?: {
    catalogVersion: string | null
    catalogSetVersion: string | null
    catalogSetDigest: string | null
    records: readonly CatalogWeaponBaseRecord[]
  }
  weaponModifiers?: {
    catalogVersion: string | null
    catalogSetVersion: string | null
    catalogSetDigest: string | null
    records: readonly CatalogWeaponModRecord[]
  }
}
```

View rules:

- Structural equipment validation runs without catalog views.
- Missing views emit bounded unresolved issues only when selected equipment needs those facts.
- Duplicate catalog IDs are reported and excluded from resolved lookups.
- Weapon and modifier catalog-set mismatch makes modifier compatibility indeterminate and unresolved.
- `ValidationResult.validatedAgainst` includes nullable equipment catalog version facts only if the
  implementation can add them without breaking existing callers; otherwise the compendium must
  document the deliberate deferral.

### Validation Semantics

Equipment validation appends after the existing profession, attribute, and skill rules so current
null-equipment issue ordering remains stable.

Severity and result semantics:

| Condition                                                        | Severity                   | `valid`                       | `complete`                                  | `resolved`                                       | Notes                                              |
| ---------------------------------------------------------------- | -------------------------- | ----------------------------- | ------------------------------------------- | ------------------------------------------------ | -------------------------------------------------- |
| Duplicate/malformed armor slot or weapon-set topology            | error or warning by impact | false for contradictions      | false for missing/incomplete authored state | unchanged unless unresolved evidence is involved | Preserve malformed state; do not reorder silently. |
| Missing optional equipment selections in canonical empty loadout | none                       | true                          | unchanged                                   | unchanged                                        | Null and empty loadouts are allowed.               |
| Explicit unresolved selection or unknown selected catalog ID     | warning                    | true                          | usually true                                | false                                            | User-recoverable unresolved state.                 |
| Missing required catalog view for selected equipment             | warning                    | true                          | true                                        | false                                            | Do not treat unavailable evidence as legal.        |
| Rune/insignia profession, slot, or mode contradiction            | error                      | false                         | true                                        | true unless evidence is ambiguous                | Catalog-backed contradiction.                      |
| Headgear on non-head slot or non-primary attribute               | error                      | false                         | true                                        | true when evidence is resolved                   | Fixed topology/mechanic error.                     |
| Two-handed/off-hand or wrong-hand weapon conflict                | error                      | false                         | true                                        | true when evidence is resolved                   | Catalog-backed occupancy contradiction.            |
| Incompatible known modifier                                      | error                      | false                         | true                                        | true                                             | Delegated EPIC-12 pairwise compatibility.          |
| Indeterminate modifier compatibility                             | warning                    | true                          | true                                        | false                                            | Unresolved catalog or applicability evidence.      |
| Known unmet weapon requirement                                   | warning                    | true                          | true                                        | true                                             | Advisory, not equip legality.                      |
| Unsafe numeric values, oversized arrays, unsupported schema      | warning or error by impact | false only when contradictory | false for unsupported/malformed loadout     | false                                            | Must remain bounded.                               |

Issue code names may adjust, but the implementation must cover these families:

- `equipment.schema-unsupported`
- `equipment.catalog-unavailable`
- `equipment.catalog-duplicate-id`
- `equipment.catalog-set-mismatch`
- `equipment.armor-slot-missing`
- `equipment.armor-slot-duplicate`
- `equipment.armor-slot-malformed`
- `equipment.armor-selection-unresolved`
- `equipment.rune-unresolved`
- `equipment.rune-restricted`
- `equipment.insignia-unresolved`
- `equipment.insignia-restricted`
- `equipment.insignia-slot-inapplicable`
- `equipment.headgear-unresolved`
- `equipment.headgear-slot-invalid`
- `equipment.headgear-attribute-invalid`
- `equipment.weapon-set-missing`
- `equipment.weapon-set-duplicate`
- `equipment.weapon-set-malformed`
- `equipment.weapon-unresolved`
- `equipment.weapon-wrong-hand`
- `equipment.weapon-occupancy-conflict`
- `equipment.weapon-modifier-unresolved`
- `equipment.weapon-modifier-without-weapon`
- `equipment.weapon-modifier-duplicate-slot`
- `equipment.weapon-modifier-incompatible`
- `equipment.weapon-modifier-compatibility-unresolved`
- `equipment.weapon-requirement-unmet`
- `equipment.weapon-requirement-unresolved`

## Implementation

### Phase 1: BW-1301 Equipment Contract and Compatibility Boundary (~20%)

**Files:**

- `src/domain/equipment.ts`
- `src/domain/build.ts`
- `src/domain/index.ts`
- `src/domain/ids.ts` - reference only
- `test/domain/equipment-contracts.test.ts`
- `test/domain/contracts.test.ts`
- `src/app/persistence-schema.test.ts` - regression reference
- `test/template-compatibility/equipment-template.test.ts` - regression reference

**Tasks:**

- [x] Mark BW-1301 and SPRINT-014 in progress before implementation.
- [x] Confirm EPIC-03, EPIC-06, EPIC-10, EPIC-11, EPIC-12, and current tests are present.
- [x] Introduce `EQUIPMENT_LOADOUT_SCHEMA_VERSION`, `EquipmentLoadout`, `EquipmentSelection`,
      `UnresolvedEquipmentSelection`, canonical slot constants, default constructors, and revised
      armor/weapon-set types.
- [x] Change `Build.equipment` to the preferred semantic loadout type while preserving
      `equipment: null`.
- [x] Retain `EquipmentTemplate` as a documented deprecated alias only if current imports need it.
- [x] Keep `ArmorPieceId` exported but remove it from semantic armor-piece identity.
- [x] Prove default construction produces five armor rows and four empty weapon sets in canonical
      order.
- [x] Prove null, empty, partial, known-ID, stale-ID, and explicit unresolved states are
      JSON-compatible.
- [x] Add source/type scans proving the semantic type contains no template item/modifier IDs, color
      IDs, skin IDs, dye IDs, acquisition facts, inventory facts, catalog record copies, or media.
- [x] Run early app and template regression tests around null-equipment persistence, share URLs,
      backup/restore, template workflows, and raw equipment-template exact replay.
- [x] Do not make app persistence accept non-null equipment during this phase unless compile
      compatibility requires a narrow rejection-path update.
- [x] Mark BW-1301 done only after focused checks and acceptance criteria pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/equipment-contracts.test.ts test/domain/contracts.test.ts
npm run test:run -- src/app/persistence-schema.test.ts src/app/share-url.test.ts src/app/backup-restore.test.ts src/app/template-workflow.test.ts test/template-compatibility/equipment-template.test.ts
```

### Phase 2: BW-1302 Armor, Headgear, and Attribute Adjustments (~20%)

**Files:**

- `src/domain/equipment.ts`
- `src/domain/equipment-attribute-rank.ts` - create
- `src/domain/rune-effects.ts` - reference or narrow view type only
- `src/domain/effective-attribute-rank.ts` - reference only
- `src/domain/insignia-effects.ts` - reference only
- `src/domain/index.ts`
- `test/domain/armor-equipment.test.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `test/domain/rune-effects.test.ts`
- `test/domain/insignia-effects.test.ts`
- `test/fixtures/rule-engine/equipment.ts` - create
- `test/fixtures/rule-engine/equipment-catalogs.ts` - create

**Tasks:**

- [x] Begin BW-1302 only after Phase 1 passes.
- [x] Verify and document the approved source-policy basis for the fixed headgear +1 fact using
      existing project evidence; block rather than guessing if evidence is insufficient.
- [x] Implement target-aware equipment attribute-adjustment helpers.
- [x] Reuse `summarizeAttributeRuneEffects` for highest-per-attribute rune stacking.
- [x] Apply valid headgear adjustment separately so headgear and rune contributions can stack.
- [x] Treat a known unallocated headgear target as base rank zero through the existing effective-rank
      API.
- [x] Derive armor profession from build primary profession without copying it into armor rows.
- [x] Preserve invalid and unresolved selections in output reasons; do not apply optimistic
      adjustments.
- [x] Cover all five canonical armor slots, missing and duplicate slots, non-canonical order,
      unresolved rune/insignia/headgear selections, profession-restricted runes and insignias,
      slot-inapplicable insignias, headgear on non-head rows, non-primary headgear attributes, and
      headgear-plus-rune stacking.
- [x] Confirm numeric base armor is not needed by EPIC-13 and document its deferral.
- [x] Mark BW-1302 done only after armor contract and adjustment checks pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/armor-equipment.test.ts test/domain/effective-attribute-rank.test.ts test/domain/rune-effects.test.ts test/domain/insignia-effects.test.ts
```

### Phase 3: BW-1303 Weapon Sets, Modifiers, and Requirements (~20%)

**Files:**

- `src/domain/equipment.ts`
- `src/domain/weapon-set.ts` - create
- `src/domain/weapon-mod-compatibility.ts` - reference only unless a narrow input type is needed
- `src/domain/index.ts`
- `test/domain/weapon-set.test.ts`
- `test/domain/weapon-mod-compatibility.test.ts`
- `test/domain/weapon-template-lookup.test.ts` - regression reference
- `test/fixtures/rule-engine/equipment.ts`
- `test/fixtures/rule-engine/equipment-catalogs.ts`

**Tasks:**

- [x] Begin BW-1303 only after Phase 1 passes. Requirement evaluation joins Phase 4 after Phase 2's
      rank-adjustment behavior is available.
- [x] Implement pure weapon-set occupancy projection.
- [x] Derive two-handed occupancy from EPIC-12 `equipRole` and `handedness`; do not add duplicate
      authored occupancy flags.
- [x] Preserve empty hands, off-hand-only partial sets, two-handed authored state, and unresolved
      weapon selections.
- [x] Validate main-hand, off-hand, and two-handed placement without auto-moving selections.
- [x] Resolve modifiers by catalog ID and delegate pairwise compatibility to
      `explainWeaponModCompatibility`.
- [x] Enforce modifier occupied-slot cardinality across the selected weapon instance.
- [x] Implement catalog-first requirement resolution and a restricted authored fallback for
      catalog-unresolved requirements.
- [x] Cover empty sets, one-handed pairs, off-hand-only sets, legal two-handed sets,
      two-handed/off-hand conflicts, wrong-hand weapons, modifiers without weapons, incompatible
      modifiers, indeterminate modifiers, duplicate occupied slots, missing requirements, authored
      requirement conflicts, unresolved IDs, and shuffled authored/catalog order.
- [x] Mark BW-1303 done only after occupancy, modifier, and requirement checks pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/weapon-set.test.ts test/domain/weapon-mod-compatibility.test.ts test/domain/weapon-template-lookup.test.ts
```

### Phase 4: BW-1304 Equipment Validation and Rule-Engine Handoff (~28%)

**Files:**

- `src/domain/validation.ts`
- `src/domain/validation-context.ts`
- `src/domain/rule-engine.ts`
- `src/domain/rules/equipment.ts` - create
- `src/domain/equipment-attribute-rank.ts`
- `src/domain/weapon-set.ts`
- `src/domain/index.ts`
- `test/domain/equipment-validation.test.ts`
- `test/domain/rule-engine.test.ts`
- `test/domain/rule-engine-contracts.test.ts`
- `test/domain/validation-context.test.ts`
- `test/domain/weapon-mod-catalog.test.ts` - regression reference
- `test/fixtures/rule-engine/builds.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/equipment.ts`
- `test/fixtures/rule-engine/equipment-catalogs.ts`
- `test/fixtures/rule-engine/README.md`

**Tasks:**

- [x] Begin BW-1304 only after BW-1302 and BW-1303 pass.
- [x] Add optional minimal equipment catalog views to `BuildValidationInput`.
- [x] Add duplicate-safe catalog indexes; ambiguous catalog IDs must not resolve first-record-wins.
- [x] Verify weapon and modifier catalog-set identity before using compatibility conclusions.
- [x] Add equipment issue codes, rule IDs, entity kinds, locations, catalog-version evidence if
      feasible, and bounded traversal/truncation behavior.
- [x] Advance the rule engine version only if validation behavior changes require it; if advanced,
      document `rule-engine:v2` and update focused expectations.
- [x] Append equipment rules after existing skill rules to preserve prior issue ordering.
- [x] Skip equipment rules entirely for `equipment: null`.
- [x] Make a canonical empty loadout produce no equipment issues even without equipment catalogs.
- [x] Run structural rules without catalogs and emit bounded catalog-unavailable issues only when
      selected values require that catalog.
- [x] Classify equipment errors, incomplete warnings, unresolved warnings, requirement warnings, and
      informational findings according to the Architecture table.
- [x] Use valid equipment rank adjustments when checking weapon requirements; suppress unmet
      warnings when rank-affecting selections are unresolved.
- [x] Apply the global issue cap once after existing and equipment issues are combined.
- [x] Prove validation never mutates builds or catalogs and remains stable under input ordering.
- [x] Cover null equipment, empty equipment, partial armor, missing and duplicate slots, unsupported
      schema versions, unsafe numeric inputs, unresolved placeholders that later match records,
      restrictions, headgear, occupancy, modifiers, requirements, missing views, duplicate catalog
      IDs, authored-vs-supplied version mismatch, weapon catalog-set mismatch, ordering, and
      truncation.
- [x] Mark BW-1304 done only after focused rule-engine verification passes.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/equipment-validation.test.ts test/domain/rule-engine.test.ts test/domain/rule-engine-contracts.test.ts test/domain/validation-context.test.ts
npm run test:run -- test/domain/*equipment* test/domain/weapon-mod-catalog.test.ts
```

### Phase 5: BW-1305 Documentation, Regression, and Closeout (~12%)

**Files:**

- `README.md`
- `compendium/equipment-shell.md` - create
- `compendium/game-rule-engine.md`
- `compendium/template-compatibility.md`
- `compendium/runes-catalog.md`
- `compendium/insignias-catalog.md`
- `compendium/weapons-and-mods-catalog.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/README.md`
- `work/tickets/13-armor-and-equipment/*.md`
- `work/sprints/SPRINT-014.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-13-result.json`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/execute-SPRINT-014-result.json`

**Tasks:**

- [x] Begin BW-1305 only after all focused domain gates pass.
- [x] Document the authored schema, null-versus-empty semantics, unresolved references,
      constructors, armor profession derivation, headgear/rune adjustment behavior, occupancy,
      requirements, issue classification, catalog views, and runtime boundaries.
- [x] Record provenance or project evidence for fixed slot topology, weapon-set count, hand
      occupancy, and headgear adjustment.
- [x] Document that numeric base armor values were intentionally omitted because EPIC-13 has no
      authoritative consumer for them.
- [x] Update rune, insignia, and weapon notes from deferred equipment ownership to the implemented
      shell and validation handoff.
- [x] State explicitly that EPIC-14 must add app catalog views, reducer actions, UI, non-null local
      persistence, backup/restore migration, validation presentation, and share-boundary messaging.
- [x] State that EPIC-17 must keep raw equipment-template state separate from semantic selections.
- [x] State that EPIC-20 consumes approved runtime display facts and EPIC-21 owns complete
      effect/stat aggregation.
- [x] Confirm `src/app/catalogs.ts`, leaf UI, share-url payloads, generated data, and template
      codecs did not change.
- [x] Confirm local-library behavior for non-null equipment remains deliberately unsupported unless
      a recorded implementation gate changed it.
- [x] Run source scans for prohibited imports and semantic references to raw template or cosmetic
      fields.
- [x] Run the complete offline verification suite.
- [x] Update BW-1301 through BW-1305, EPIC-13, SPRINT-014, the ledger, and execution result manifest
      to one consistent final state.
- [x] Do not create a commit.

**Verification:**

```sh
rg -n "TemplateEquipment(Item|Modifier|Color|Slot)Id|skin|dye|colorId|wikiUrl|acquisition" src/domain/equipment.ts src/domain/equipment-attribute-rank.ts src/domain/weapon-set.ts src/domain/rules/equipment.ts
rg -n "react|localStorage|sessionStorage|fetch\\(|data/generated|data/qa|source-snapshots|scripts/data|api\\.php|wiki" src/domain
npm run verify
git status --short
```

## Files Summary

| File                                                                            | Action                     | Purpose                                                                                                                         |
| ------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/equipment.ts`                                                       | Modify                     | Define the semantic loadout, selection states, armor and weapon containers, constants, constructors, and compatibility alias.   |
| `src/domain/build.ts`                                                           | Modify                     | Point `Build.equipment` at the semantic loadout while preserving nullable state.                                                |
| `src/domain/equipment-attribute-rank.ts`                                        | Create                     | Resolve headgear and attribute-rune rank adjustments for existing effective-rank APIs.                                          |
| `src/domain/weapon-set.ts`                                                      | Create                     | Resolve hand occupancy, per-instance modifier slots, and weapon requirement handoffs.                                           |
| `src/domain/rules/equipment.ts`                                                 | Create                     | Emit deterministic equipment validation issues from authored state and caller-supplied views.                                   |
| `src/domain/validation.ts`                                                      | Modify                     | Add equipment issue codes, locations, entities, rule ordering, result classification, and truncation/version support as needed. |
| `src/domain/validation-context.ts`                                              | Modify                     | Accept optional equipment catalog views and expose duplicate-safe lookup state.                                                 |
| `src/domain/rule-engine.ts`                                                     | Modify                     | Compose equipment issues into the existing capped `ValidationResult`.                                                           |
| `src/domain/rune-effects.ts`                                                    | Reference or narrow modify | Reuse rune stacking behavior without duplicating EPIC-10 semantics.                                                             |
| `src/domain/effective-attribute-rank.ts`                                        | Reference/test only        | Consume caller-consolidated equipment adjustments.                                                                              |
| `src/domain/insignia-effects.ts`                                                | Reference only             | Preserve one-record/one-slot projection boundary.                                                                               |
| `src/domain/weapon-mod-compatibility.ts`                                        | Reference only             | Preserve EPIC-12 pairwise compatibility semantics.                                                                              |
| `src/domain/catalog.ts`                                                         | Reference only             | Reuse existing catalog record facts without copying or widening them.                                                           |
| `src/domain/catalog-lookup.ts`                                                  | Reference only             | Follow existing lookup and duplicate-safety patterns.                                                                           |
| `src/domain/ids.ts`                                                             | Reference only             | Reuse catalog IDs and keep raw template IDs out of semantic equipment.                                                          |
| `src/domain/index.ts`                                                           | Modify                     | Export the new contracts, constants, constructors, projections, and validation types.                                           |
| `test/domain/equipment-contracts.test.ts`                                       | Create                     | Verify plain-data contracts, defaults, partial states, unresolved states, and prohibited-field absence.                         |
| `test/domain/armor-equipment.test.ts`                                           | Create                     | Verify armor topology, restrictions, headgear, rune stacking, and adjustment outputs.                                           |
| `test/domain/weapon-set.test.ts`                                                | Create                     | Verify occupancy, modifier cardinality, compatibility, and requirements.                                                        |
| `test/domain/equipment-validation.test.ts`                                      | Create                     | Verify issue semantics, ordering, locations, catalog views, caps, and no mutation.                                              |
| `test/domain/rule-engine*.test.ts`                                              | Modify                     | Verify rule-engine composition and null-equipment regressions.                                                                  |
| `test/domain/validation-context.test.ts`                                        | Modify                     | Verify optional catalog-view normalization and integrity behavior.                                                              |
| `test/domain/effective-attribute-rank.test.ts`                                  | Modify                     | Verify equipment-generated adjustments and unallocated targets.                                                                 |
| `test/fixtures/rule-engine/equipment.ts`                                        | Create                     | Provide reusable empty, partial, invalid, unresolved, and legal loadouts.                                                       |
| `test/fixtures/rule-engine/equipment-catalogs.ts`                               | Create                     | Provide synthetic rune, insignia, weapon, and modifier records.                                                                 |
| `test/fixtures/rule-engine/builds.ts`                                           | Modify                     | Add builds containing semantic equipment while preserving null defaults.                                                        |
| `test/fixtures/rule-engine/catalogs.ts`                                         | Modify narrowly            | Add profession/attribute facts needed by equipment fixtures.                                                                    |
| `test/fixtures/rule-engine/README.md`                                           | Modify                     | Document synthetic equipment scenarios and non-authoritative mechanics.                                                         |
| `src/app/persistence-schema.ts`                                                 | Reference or narrow modify | Preserve non-null equipment rejection until EPIC-14 unless a compile-safe parser adjustment is required.                        |
| `src/app/share-url.ts`                                                          | Reference only             | Preserve skill-template-only share payloads.                                                                                    |
| `src/app/backup-restore.ts`                                                     | Reference only             | Preserve current local-library behavior pending EPIC-14 migration.                                                              |
| `src/template-compatibility/**`                                                 | Reference/test only        | Preserve raw equipment-template decode/export and exact-source replay.                                                          |
| `README.md`                                                                     | Modify                     | Add the equipment domain shell and clarify unchanged app scope.                                                                 |
| `compendium/equipment-shell.md`                                                 | Create                     | Record durable architecture, mechanics, validation, provenance, and handoffs.                                                   |
| `compendium/*.md`                                                               | Modify                     | Update rule-engine, template, rune, insignia, weapon, core-editor, local-library, and index notes.                              |
| `work/tickets/13-armor-and-equipment/*.md`                                      | Modify                     | Track sprint linkage, execution status, assumptions, evidence, and closeout.                                                    |
| `work/sprints/SPRINT-014.md`                                                    | Create/update              | Store sprint plan and execution checklist state.                                                                                |
| `work/sprints/ledger.tsv`                                                       | Modify                     | Track the SPRINT-014 lifecycle.                                                                                                 |
| `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-13-result.json`       | Create during planning     | Required ticket-burn planning manifest.                                                                                         |
| `work/runs/ticket-burn/BACKLOG/20260903T014346Z/execute-SPRINT-014-result.json` | Create during execution    | Required ticket-burn execution manifest.                                                                                        |

## Definition of Done

### Equipment Contract

- [x] `EquipmentLoadout` is the preferred public type and `EquipmentTemplate` is documented only as
      a compatibility alias if retained.
- [x] `Build.equipment` accepts `EquipmentLoadout | null`.
- [x] The loadout is framework-neutral, readonly, versioned, and JSON-compatible.
- [x] Canonical constructors produce five armor rows and four empty weapon sets.
- [x] Null, empty, partial, known-ID, stale-ID, and explicitly unresolved states are representable.
- [x] Authored semantic equipment contains no raw template IDs, skins, dyes, colors, acquisition
      facts, inventory identity, catalog record copies, generated artifact paths, or media.
- [x] Armor identity is slot-based; no armor catalog is implied.
- [x] Existing null-equipment builds compile, validate, render, share, and persist as before.

### Armor and Headgear

- [x] Armor supports exactly the canonical slots `head`, `chest`, `hands`, `legs`, and `feet`.
- [x] Missing, duplicate, malformed, over-limit, and non-canonically ordered slots have
      deterministic validation outcomes.
- [x] Each armor piece can independently attach one rune and one insignia selection.
- [x] Rune eligibility and insignia profession, mode, and slot restrictions come only from supplied
      catalog records.
- [x] Armor profession is derived from the build primary profession.
- [x] Headgear selection is restricted to the head row and a primary-profession attribute.
- [x] The fixed headgear +1 fact has documented project/source-policy evidence.
- [x] Headgear and highest-per-attribute rune contributions compose without duplicating rune
      stacking logic.
- [x] A valid unallocated target resolves from rank zero through the existing effective-rank API.
- [x] Invalid or unresolved armor selections do not contribute optimistic adjustments.
- [x] Numeric base armor rating is omitted and its ownership is documented.

### Weapons and Requirements

- [x] A loadout supports up to four uniquely identified weapon sets.
- [x] Empty, main-hand-only, off-hand-only, paired, two-handed, incomplete, conflict, and unresolved
      occupancy states are distinguishable.
- [x] Two-handed occupancy is derived from the weapon catalog and cannot silently coexist with an
      off-hand weapon.
- [x] Weapon and modifier state stores semantic catalog selections, not copied records or raw
      template IDs.
- [x] Modifier compatibility delegates to the EPIC-12 helper and set-level occupied-slot
      cardinality is enforced separately.
- [x] Wrong-hand, mode-restricted, incompatible, indeterminate, duplicate-slot, and unresolved
      selections remain distinct.
- [x] Catalog requirements take precedence over authored fallback requirements.
- [x] Authored requirements are accepted only for catalog-unresolved requirement facts.
- [x] Known unmet requirements are advisory warnings; unresolved requirements make the result
      unresolved.
- [x] Requirement evaluation consumes valid equipment rank adjustments and avoids false conclusions
      when adjustment inputs are unresolved.

### Validation

- [x] `validateBuild` accepts optional minimal equipment catalog views.
- [x] Structural equipment validation does not require runtime catalogs.
- [x] Missing catalog views produce bounded unresolved issues only when selected data needs them.
- [x] Duplicate catalog IDs and mismatched weapon catalog sets never resolve first-record-wins.
- [x] Equipment issues use the existing `ValidationIssue` and `ValidationResult` contracts.
- [x] Issue paths and locations identify the relevant armor row, weapon set, hand, field, and
      modifier index where possible.
- [x] Error, incomplete, unresolved, advisory, and informational classifications match this sprint.
- [x] Equipment rule ordering is deterministic and appended after existing rules.
- [x] Equipment issues participate in the same global issue cap.
- [x] Oversized armor, weapon-set, and modifier collections are bounded and mark validation
      non-exhaustive.
- [x] `equipment: null` and a canonical empty loadout produce no equipment issues.
- [x] Validation does not coerce, reorder, remove, replace, or mutate authored selections or catalog
      records.

### Boundaries and Regression

- [x] `src/domain` imports no React, DOM/browser APIs, browser storage, network clients, app
      modules, generated JSON, manifests, QA reports, snapshots, data scripts, wiki APIs, or
      template codec.
- [x] `src/app/catalogs.ts` remains the only generated-catalog import boundary and is not expanded
      during this sprint.
- [x] Equipment editor state, UI, and leaf-component wiring remain deferred to EPIC-14.
- [x] Local-library non-null equipment persistence, backup/restore migration, and share omission
      presentation remain deferred to EPIC-14 unless a narrow rejection-path compatibility change is
      required.
- [x] Raw equipment-template decode/export and exact-source replay remain unchanged.
- [x] Existing profession, attribute, skill, rune, insignia, weapon, modifier, editor, persistence,
      sharing, backup, and template tests pass.
- [x] No generated data, ingestion scripts, production catalogs, manifests, QA reports, or source
      snapshots change.

### Closeout

- [x] Documentation records the schema, constructors, mechanics, validation semantics, provenance,
      runtime boundaries, and downstream ownership.
- [x] EPIC-14 receives explicit catalog, editor-state, persistence, validation-presentation, and
      share-boundary handoffs.
- [x] EPIC-17 receives an explicit raw-template versus semantic-loadout handoff.
- [x] EPIC-20 and EPIC-21 receive explicit display and aggregation boundaries.
- [x] BW-1301 through BW-1305, EPIC-13, SPRINT-014, the ledger, and ticket-burn manifests agree.
- [x] `npm run verify` passes without network access.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                                                          | Likelihood | Impact | Mitigation                                                                                                             |
| ----------------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| The authored shape becomes coupled to EPIC-10/11/12 record layouts.           | Medium     | High   | Store only semantic selections; keep catalog facts in caller-supplied validation views.                                |
| A semantic candidate ID is mistaken for a raw template ID.                    | Medium     | High   | Use branded known IDs, explicit `candidateCatalogId`, and prohibited-field scans/tests.                                |
| `EquipmentTemplate` is confused with raw `EquipmentTemplateDocument`.         | High       | Medium | Prefer `EquipmentLoadout`, retain only a deprecated alias if needed, and document the namespace boundary.              |
| Derived mechanics are copied into authored state and become stale.            | Medium     | High   | Derive armor profession, handedness, modifier slots, requirements, and restrictions from current catalogs.             |
| Headgear +1 is encoded without adequate evidence.                             | Low        | High   | Make provenance confirmation a Phase 2 gate; block rather than shipping an unsupported fact.                           |
| Base armor scope expands into a new catalog or totals system.                 | Medium     | Medium | Omit numeric base armor in v1 and require a future source-backed ticket.                                               |
| Optional catalog views lead to false legality or requirement conclusions.     | Medium     | High   | Emit unresolved outcomes, suppress dependent conclusions, and never treat missing data as compatible.                  |
| Duplicate catalog IDs make resolution order-dependent.                        | Low        | High   | Build duplicate-safe indexes and exclude ambiguous IDs from resolved lookups.                                          |
| Weapon and modifier catalogs become version-skewed.                           | Low        | High   | Require matching catalog-set version/digest before compatibility is trusted.                                           |
| Requirement warnings are treated as equip-legality errors.                    | Medium     | Medium | Define unmet requirements as advisory warnings and test `valid`, `complete`, and `resolved` separately.                |
| Headgear or rune uncertainty causes false requirement warnings.               | Medium     | High   | Evaluate requirements only from validated adjustments; emit unresolved when contributing state is uncertain.           |
| Validation issue volume or oversized arrays cause poor behavior.              | Low        | High   | Use traversal ceilings, duplicate-safe linear indexes, deterministic truncation, and the existing issue cap.           |
| `equipment: null` begins producing incomplete warnings in existing workflows. | Medium     | High   | Treat null as an explicit opt-out and add app, persistence, share, backup, template, and rule-engine regression tests. |
| EPIC-14 assumes non-null equipment already persists.                          | High       | Medium | Document persistence as deferred and name EPIC-14 migration requirements.                                              |
| Compatibility helpers and validation duplicate each other.                    | Medium     | Medium | Reuse rune stacking, insignia projection, and pairwise modifier helpers; keep only loadout-level topology in EPIC-13.  |
| Rule-engine changes reorder unrelated issues.                                 | Low        | High   | Append equipment rules after existing rules and snapshot null-equipment results.                                       |

## Security Considerations

- Treat builds, equipment selections, catalog views, unresolved labels, catalog IDs, modifier arrays,
  and authored requirements as untrusted values at the validation boundary.
- Accept only non-negative safe integers for known and candidate catalog IDs. Authored ranks must be
  finite safe integers within existing domain policy.
- Bound unresolved labels and reasons before future persistence/UI display. Validation messages must
  remain deterministic and must not interpolate untrusted labels directly.
- Do not execute or interpret labels, catalog names, notes, URLs, template fields, modifier effects,
  or authored strings as code, markup, CSS, shell input, or source expressions.
- Bound armor rows, weapon sets, modifiers per hand, related entities, issue messages, total issues,
  and validation traversal.
- Build duplicate-safe maps in linear passes and avoid repeated whole-catalog scans for every
  attachment.
- Domain validation must not fetch catalogs, source pages, icons, manifests, QA reports, snapshots,
  or remote media. Callers provide inert catalog views.
- Pure constructors and helpers must not mutate caller arrays, builds, catalog records, or
  unresolved placeholders.
- Preserve unknown values for user recovery, but never infer that an unknown reference is legal,
  compatible, or requirement-satisfying.
- Keep raw template IDs and exact-source data in the isolated compatibility layer so semantic
  validation cannot accidentally expose color, skin, or unsupported raw fields.
- No new npm or Python dependency is planned. Any dependency request requires a sprint amendment
  and supply-chain review.
- EPIC-14 persistence must independently reject dangerous object keys, oversized collections,
  invalid discriminants, and unsupported equipment schema versions before hydrating editor state.

## Dependencies

- `EPIC-01` / `SPRINT-002`: source-policy decisions and provenance requirements for fixed mechanical
  facts such as headgear behavior.
- `EPIC-02` / `SPRINT-003`: established generated-data and source-artifact boundaries. No ingestion
  work is required in EPIC-13.
- `EPIC-03` / `SPRINT-004`: promoted profession/attribute catalog IDs and effective-rank inputs.
- `EPIC-06` / `SPRINT-007`: validation result contract, rule-engine composition,
  `calculateEffectiveAttributeRank`, and issue semantics.
- `EPIC-10` / `SPRINT-011`: runtime rune catalog IDs and `summarizeAttributeRuneEffects`.
- `EPIC-11` / `SPRINT-012`: runtime insignia catalog IDs and `resolveInsigniaEffectsForArmorSlot`.
- `EPIC-12` / `SPRINT-013`: runtime weapon/modifier catalog IDs,
  `explainWeaponModCompatibility`, and template item/modifier lookup precedent.
- Future `EPIC-14`: equipment catalog views, editor controls, local persistence migration,
  validation presentation, backup/restore equipment handling, and share-boundary UX.
- Future `EPIC-17`: semantic import/export workflows from raw equipment templates while preserving
  exact-source replay.
- Future `EPIC-20` and `EPIC-21`: search/tooltips and complete stat/effect aggregation.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and repository setup for `npm run verify`.

## Open Questions

These do not block planning. They are implementation checkpoints with explicit defaults:

1. **Alias lifetime**: How long should `EquipmentTemplate` remain as an alias? Default: keep through
   EPIC-14 migration and remove only with a later compatibility ticket.
2. **Catalog versions in results**: Should `validatedAgainst` grow nullable equipment catalog
   version fields in this sprint? Default: add them only if non-breaking and fully regression
   tested; otherwise document deferral.
3. **Headgear evidence**: Is existing project evidence sufficient for fixed +1 headgear behavior?
   Default: Phase 2 blocks BW-1302 until the closeout note can cite approved evidence.
4. **Requirement policy**: Should requirement warnings apply to all four weapon sets or only an
   active set? Default: warn for all authored sets because EPIC-13 has no active-set UI state.
5. **Non-null persistence**: Should app persistence accept `EquipmentLoadout` before EPIC-14?
   Default: no; preserve the existing unsupported-equipment rejection until UI and migration are
   owned together.
