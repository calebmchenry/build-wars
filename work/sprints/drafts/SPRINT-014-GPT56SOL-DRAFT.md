---
id: SPRINT-014
title: Equipment Shell Model
status: planned
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
---

# Sprint 014: Equipment Shell Model

## Overview

This sprint replaces the thin equipment placeholder with a framework-neutral semantic loadout model
for one character. A build can represent five generic armor pieces, rune and insignia attachments,
a headgear attribute bonus, and up to four weapon sets containing catalog-backed weapons and
modifiers. Empty, partial, stale, and explicitly unresolved selections remain recoverable.

EPIC-13 owns the authored equipment container, fixed slot topology, headgear rank adjustment,
weapon-hand occupancy, pure equipment projections, and structured validation rules. EPIC-10,
EPIC-11, and EPIC-12 remain authoritative for rune, insignia, weapon, and modifier facts. The
loadout stores references to their public catalog IDs; it does not copy catalog records into authored
state.

The sprint does not add equipment UI, app catalog imports, local-library equipment persistence,
share-url equipment payloads, semantic equipment-template import, armor or weapon skins, dyes,
colors, inventory identity, acquisition facts, full stat totals, combat simulation, DPS, party
equipment, or guide content. EPIC-14 owns app integration and persistence, EPIC-17 owns semantic
template workflows, EPIC-20 owns search and tooltips, and EPIC-21 owns broad effect aggregation.

The following decisions are binding:

1. Introduce `EquipmentLoadout` as the preferred authored type and change `Build.equipment` to
   `EquipmentLoadout | null`. Retain `EquipmentTemplate` as a deprecated type alias through the
   first equipment-editor migration so existing domain imports do not break abruptly.
2. `equipment: null` means equipment has not been authored or is outside the current workflow. An
   empty `EquipmentLoadout` means equipment state exists but contains no selected upgrades or
   weapons. Both states are valid and must not generate equipment issues.
3. The loadout is versioned plain data. It retains the existing authored-root fields for wire
   compatibility, but validation trusts caller-supplied catalog versions rather than the authored
   `catalogVersion`.
4. Catalog selections use a discriminated semantic reference: a selected catalog ID or an explicit
   unresolved placeholder. Raw template item/modifier IDs, skin IDs, dye IDs, and color IDs are
   prohibited.
5. Armor piece identity is its slot. `ArmorPieceId` remains exported for compatibility but is not
   required by the v1 loadout and must not imply an armor-skin catalog.
6. The armor profession is derived from `Build.primaryProfessionId`; it is not duplicated in the
   loadout. Numeric base armor rating is not authored or calculated because no EPIC-13 rule or
   display requires it. Adding such values later requires an explicit source-policy-backed
   mechanical contract.
7. The headgear adjustment is a fixed `+1` rank applied to its selected primary-profession
   attribute. Phase 2 must connect this fact to already approved EPIC-10 `Attribute bonus` evidence
   and record the provenance in closeout documentation. It must not create a new generated catalog.
8. A two-handed weapon occupies the main-hand position and derives its occupancy from the resolved
   EPIC-12 weapon record. There is no separate authored `twoHand` field that can drift from the
   catalog.
9. Weapon requirement satisfaction is advisory rather than equip legality. A known unmet
   requirement emits a warning but does not make the build invalid. Unknown requirements or
   incomplete rank adjustments make validation unresolved.
10. `validateBuild` gains optional caller-supplied equipment catalog views and delegates to a new
    equipment rule module. Structural validation runs without catalogs; catalog-dependent checks
    become unresolved when required views are unavailable.
11. The rule-engine contract remains one `ValidationResult`. Equipment adds stable issue codes,
    locations, entity references, version facts, and truncation kinds rather than creating a second
    result vocabulary.
12. `RULE_ENGINE_VERSION` advances to `rule-engine:v2`. Existing null-equipment builds retain their
    prior validation behavior apart from the reported engine version.
13. No production generated JSON is imported by `src/domain`. `src/app/catalogs.ts` and leaf
    components remain unchanged in this sprint.
14. Local persistence continues to accept only `equipment: null` until EPIC-14 adds a bounded schema
    migration. This sprint must document that handoff and prove existing saved records still load
    without changes.

## Use Cases

1. **Start from a safe default**: A caller creates a canonical loadout with five ordered armor rows
   and four ordered empty weapon sets.
2. **Edit incrementally**: Armor pieces, weapon sets, hands, and attachments can remain empty or
   partial while an editor is in progress.
3. **Attach catalog selections**: Armor references `RuneId` and `InsigniaId`; weapon hands reference
   `WeaponId` and `WeaponModifierId`.
4. **Recover stale data**: Unknown catalog IDs and explicit unresolved placeholders remain in the
   authored object and produce located warnings instead of being deleted or replaced.
5. **Validate armor topology**: Missing, duplicate, malformed, or non-canonically ordered armor
   slots produce deterministic structured outcomes.
6. **Apply armor restrictions**: Rune profession eligibility and insignia profession, mode, and slot
   applicability are checked from caller-supplied catalog records.
7. **Calculate attribute adjustments**: The selected highest attribute-rune contribution and the
   independent headgear `+1` contribution can be passed to `calculateEffectiveAttributeRank`.
8. **Represent weapon occupancy**: Empty, main-hand-only, off-hand-only, paired one-handed, and
   two-handed sets are distinguishable without duplicating catalog handedness.
9. **Explain weapon errors**: Wrong-hand weapons, two-handed/off-hand conflicts, duplicate modifier
   slots, incompatible modifiers, and catalog-indeterminate compatibility have stable reason codes.
10. **Evaluate requirements conservatively**: Known weapon requirements are compared with effective
    attribute rank; unmet and unresolved cases remain distinguishable.
11. **Preserve existing workflows**: Skill editing, skill-template import/export, share URLs, and
    existing local-library records continue to operate with `equipment: null`.
12. **Enable EPIC-14**: The equipment editor receives stable constructors, selection types,
    occupancy projections, adjustment summaries, validation locations, and fixtures without
    recreating domain rules in React.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Authored model | Versioned single-character loadout, five armor slots, up to four weapon sets, semantic catalog selections, unresolved placeholders, constructors, and canonical constants. | Skins, dyes, color IDs, inventory item identity, acquisition data, raw template IDs, equipment presets, party state, or app reducer state. |
| Armor | Rune and insignia attachment points, primary armor profession derivation, headgear attribute selection, fixed `+1` adjustment, slot topology, and restriction validation. | Armor-skin catalogs, numeric base armor totals, hit-location math, condition evaluation, or full health/energy/armor aggregation. |
| Weapons | Per-hand weapon state, modifiers, optional unresolved-requirement fallback, derived occupancy, modifier cardinality, and requirement handoff. | Named skins, unique items, damage/DPS calculation, recommendations, inventory management, or raw equipment-template rows. |
| Validation | Optional caller-supplied catalog views, deterministic issue emission, inline locations, result flags, catalog versions, and bounded traversal. | UI presentation, persistence parsing, automatic correction, catalog fetching, or export/publish policy. |
| Runtime boundaries | Pure TypeScript modules under `src/domain` and synthetic test fixtures. | React, DOM, storage, network clients, app imports, generated JSON imports, manifests, QA reports, snapshots, scripts, or wiki APIs. |
| Compatibility | Null-equipment regressions, deprecated type alias, and documented handoffs. | Equipment-template semantic conversion, local equipment persistence, backup migration, or equipment share formats. |

### Authored Contract

The v1 contract uses these semantic distinctions:

```text
EQUIPMENT_LOADOUT_SCHEMA_VERSION = 1

EquipmentSelection<Id>
  | catalog-id
      id: Id
  | unresolved
      candidateCatalogId: number | null
      label: string | null
      reason:
        unknown-catalog-id
        ambiguous-selection
        unsupported-selection
        incomplete-edit

ArmorPiece
  slot: head | chest | hands | legs | feet
  rune: EquipmentSelection<RuneId> | null
  insignia: EquipmentSelection<InsigniaId> | null
  headgearAttribute: EquipmentSelection<AttributeId> | null

AuthoredWeaponRequirement
  kind: attribute-rank
  attribute: EquipmentSelection<AttributeId>
  rank: number

WeaponHandLoadout
  weapon: EquipmentSelection<WeaponId> | null
  modifiers: readonly EquipmentSelection<WeaponModifierId>[]
  requirement: AuthoredWeaponRequirement | null

WeaponSet
  slot: set-1 | set-2 | set-3 | set-4
  mainHand: WeaponHandLoadout | null
  offHand: WeaponHandLoadout | null

EquipmentLoadout
  schemaVersion: 1
  catalogVersion: string | null
  armor: readonly ArmorPiece[]
  weaponSets: readonly WeaponSet[]
```

`headgearAttribute` is permitted only on the `head` row. Keeping it on the plain armor-piece shape
allows malformed persisted or imported objects to be reported instead of crashing, while
constructors expose it only for headgear.

A non-null hand with no weapon can preserve modifiers or a requirement during an incomplete edit.
It is incomplete but recoverable. An authored requirement is used only when the resolved weapon
record has an unresolved requirement and the user is describing the concrete selected item. It must
not override a catalog record whose requirement is already `attribute-rank` or `none`.

The unresolved placeholder is semantic. `candidateCatalogId` is an optional non-negative safe
integer in the relevant catalog namespace; it is never a raw template ID. Validators do not
silently promote a placeholder if that number later resolves.

### Canonical Structure

Export immutable constants:

```text
ARMOR_SLOTS = [head, chest, hands, legs, feet]
WEAPON_SET_SLOTS = [set-1, set-2, set-3, set-4]
HEADGEAR_ATTRIBUTE_BONUS = 1
```

Provide pure constructors for an empty armor piece, hand, weapon set, and complete loadout.
`createEmptyEquipmentLoadout` returns one armor row for each canonical armor slot and four empty
weapon sets in canonical order.

Authored arrays remain arrays rather than fixed tuples so partial or malformed data can be validated
and repaired. Validation never reorders or mutates them. Duplicate armor or weapon-set slots are
errors; missing armor slots are incomplete warnings; omitted weapon sets are allowed because the
model supports up to four sets. Non-canonical relative ordering is informational.

### Armor Mechanics

`Build.primaryProfessionId` is the armor profession. Rune and insignia restrictions compare their
catalog `professionId` with that primary profession:

- `universal-armor` runes accept any resolved primary profession.
- `profession-armor` runes require an exact primary-profession match.
- `unknown` rune eligibility is unresolved.
- Common insignias require no profession match.
- Profession-specific insignias require an exact match.
- Insignia `applicableSlots` and `modeAvailability` are enforced.
- Missing primary profession suppresses mismatch cascades and produces unresolved restriction
  outcomes.

Headgear behavior is deliberately narrow:

- Only the head row may select `headgearAttribute`.
- The selected attribute must resolve uniquely and belong to the primary profession.
- A valid selection contributes one `headgear` adjustment.
- A known unallocated target starts from authored rank zero, consistent with
  `calculateEffectiveAttributeRank`.
- Headgear and the selected highest attribute-rune contribution are additive when they target the
  same attribute.
- Attribute-rune stacking remains owned by `summarizeAttributeRuneEffects`; EPIC-13 must not
  reimplement highest-per-attribute behavior.
- Invalid or unresolved armor attachments do not contribute optimistic rank adjustments.

Create a pure equipment adjustment helper that returns target-aware entries:

```text
EquipmentAttributeRankAdjustment
  attributeId
  adjustment: EffectiveAttributeRankAdjustment

EquipmentAttributeRankSummary
  adjustments
  runeContributions
  headgearContribution
  unresolved
```

The helper accepts only the loadout, the minimal rune record view, the profession/attribute view,
and the resolved primary profession. It performs no file reads, generated-data imports, totals, or
mutation.

Numeric base armor rating remains deferred. The only base-armor fact needed by current rules is the
primary armor profession. Storing a user-authored `armorRating` would duplicate a mechanical fact
without an authoritative runtime source and create long-term drift.

### Weapon Mechanics

A weapon set stores main-hand and off-hand state. Occupancy is derived from resolved weapon records:

| Resolved State | Meaning |
| --- | --- |
| `empty` | Neither hand contains a weapon selection. |
| `main-hand-only` | One main-hand weapon is selected. |
| `off-hand-only` | One off-hand item is selected; valid as a recoverable partial set. |
| `paired` | A one-handed main-hand weapon and an off-hand item coexist. |
| `two-handed` | A two-handed weapon occupies main hand and off hand is empty. |
| `incomplete` | A hand contains dependent authored state but no weapon. |
| `conflict` | Known equip roles contradict their hand or a two-handed weapon coexists with an off-hand weapon. |
| `unresolved` | Occupancy cannot be proven because a required weapon reference or catalog fact is unresolved. |

A pure `resolveWeaponSetOccupancy` helper returns this projection without altering the authored set.

Each resolved modifier is checked with `explainWeaponModCompatibility`. EPIC-13 additionally checks
set-level concerns outside that helper’s EPIC-12 boundary:

- Multiple modifiers occupying a `zero-or-one` or `one` slot are errors.
- `zero-or-more` slots may repeat when the catalog permits them.
- Modifiers on a hand without a weapon are incomplete.
- An `incompatible` EPIC-12 result is an error.
- An `indeterminate` result is unresolved.
- Base and modifier mode restrictions are evaluated against the build mode.
- Unknown weapon or modifier IDs remain authored and unresolved.

Requirements resolve in this order:

1. Use a catalog `attribute-rank` or `none` requirement when present.
2. If the catalog requirement is `unresolved`, use a valid authored requirement when supplied.
3. Otherwise report the requirement as unresolved.
4. Reject an authored requirement that contradicts an already resolved catalog requirement.
5. Calculate effective rank from authored allocation plus valid headgear and selected attribute-rune
   adjustments.
6. Emit a warning when the effective rank is below the requirement. This warning does not make the
   build invalid.
7. Emit an unresolved warning instead of an unmet warning if the effective rank or relevant
   equipment adjustments cannot be resolved.

### Validation Catalog Views

Extend `BuildValidationInput` with an optional `equipmentCatalogs` object. Each namespace is
optional so structural validation and independently available catalogs can still be used:

```text
EquipmentValidationCatalogs
  runes?
    catalogVersion
    runes
  insignias?
    catalogVersion
    insignias
  weapons?
    catalogVersion
    catalogSetVersion
    catalogSetDigest
    weaponBases
  weaponModifiers?
    catalogVersion
    catalogSetVersion
    catalogSetDigest
    weaponMods
```

The views expose only fields needed by the rules. Full runtime catalogs satisfy them structurally,
but the validator does not require manifests, QA reports, dispositions, source plans, or media.

If a selected namespace has no supplied view, emit one catalog-unavailable warning for that
namespace and skip dependent conclusions. If both weapon views are supplied, their
`catalogSetVersion` and `catalogSetDigest` must match before compatibility checks are trusted.
Duplicate IDs are catalog-integrity warnings and are excluded from resolved lookups; validation
must never use first-record-wins behavior.

`ValidationCatalogVersions` gains a nullable nested equipment version summary containing the four
catalog versions and weapon catalog-set identity. Existing app code may continue displaying only
profession/attribute and skill versions until EPIC-14.

### Validation Semantics

Append equipment rules after existing profession, attribute, and skill rules so existing issue
ordering remains stable:

```text
equipment.catalog-integrity
equipment.structure
equipment.armor
equipment.headgear
equipment.weapon-occupancy
equipment.weapon-modifier
equipment.weapon-requirement
```

Paths and locations are suitable for future inline UI:

```text
["equipment", "armor", armorIndex, "rune"]
  location: armor-slot(index, slot, field)

["equipment", "weaponSets", setIndex, "mainHand", "modifiers", modifierIndex]
  location: weapon-set(index, slot, hand, field, modifierIndex)
```

Extend `ValidationEntityKind` with equipment, armor-slot, weapon-set, weapon, rune, insignia, and
weapon-modifier references. Extend catalog locations with rune, insignia, weapon-base, and
weapon-modifier namespaces.

Issue classification is binding:

| Outcome | Severity | Result Effect | Examples |
| --- | --- | --- | --- |
| Proven contradiction | `error` | `valid: false` | Duplicate slot, wrong profession, inapplicable insignia slot, wrong-hand weapon, two-handed/off-hand conflict, incompatible or duplicate-slot modifier. |
| Structurally incomplete edit | `warning` | `complete: false` | Missing armor row, malformed loadout row, modifier or requirement without a weapon. |
| Unknown or unavailable fact | `warning` | `resolved: false` | Explicit unresolved selection, stale ID, missing catalog view, duplicate catalog ID, unknown eligibility, indeterminate modifier compatibility, unresolved requirement. |
| Known unmet weapon requirement | `warning` | Flags unchanged | Effective rank is below a known requirement. |
| Non-canonical but equivalent order | `info` | Flags unchanged | Unique rows appear in a non-canonical relative order. |

Minimum stable issue families are:

- `catalog.rune-duplicate-id`
- `catalog.insignia-duplicate-id`
- `catalog.weapon-duplicate-id`
- `catalog.weapon-modifier-duplicate-id`
- `catalog.weapon-set-mismatch`
- `equipment.catalog-unavailable`
- `equipment.schema-unsupported`
- `equipment.armor-slot-duplicate`
- `equipment.armor-slot-missing`
- `equipment.armor-slot-unsupported`
- `equipment.armor-order-noncanonical`
- `equipment.rune-unresolved`
- `equipment.rune-wrong-profession`
- `equipment.rune-eligibility-unresolved`
- `equipment.insignia-unresolved`
- `equipment.insignia-wrong-profession`
- `equipment.insignia-inapplicable-slot`
- `equipment.insignia-mode-restricted`
- `equipment.insignia-eligibility-unresolved`
- `equipment.headgear-wrong-slot`
- `equipment.headgear-unresolved`
- `equipment.headgear-wrong-profession`
- `equipment.weapon-set-duplicate`
- `equipment.weapon-set-unsupported`
- `equipment.weapon-set-limit`
- `equipment.weapon-order-noncanonical`
- `equipment.weapon-incomplete`
- `equipment.weapon-unresolved`
- `equipment.weapon-wrong-hand`
- `equipment.weapon-mode-restricted`
- `equipment.weapon-occupancy-conflict`
- `equipment.weapon-modifier-unresolved`
- `equipment.weapon-modifier-without-weapon`
- `equipment.weapon-modifier-duplicate-slot`
- `equipment.weapon-modifier-incompatible`
- `equipment.weapon-modifier-compatibility-unresolved`
- `equipment.weapon-requirement-conflict`
- `equipment.weapon-requirement-unmet`
- `equipment.weapon-requirement-unresolved`

Validation traverses at most 32 armor rows, 16 weapon-set rows, and 16 modifiers per hand before
reporting an equipment truncation. Add corresponding `ValidationTruncationKind` values. The existing
global issue cap remains authoritative, and the earliest truncation in rule order wins when the
single-result contract can report only one.

## Implementation

### Phase 1: BW-1301 Equipment Contract and Compatibility Boundary (~20%)

**Files:**

- `src/domain/equipment.ts`
- `src/domain/build.ts`
- `src/domain/index.ts`
- `src/domain/ids.ts` — reference only
- `test/domain/equipment-contracts.test.ts`
- `test/domain/contracts.test.ts`

**Tasks:**

- [ ] Mark BW-1301 and SPRINT-014 in progress before implementation.
- [ ] Confirm EPIC-03, EPIC-10, EPIC-11, EPIC-12, and the current rule-engine contracts are present
      and passing.
- [ ] Introduce `EQUIPMENT_LOADOUT_SCHEMA_VERSION`, `EquipmentLoadout`,
      `EquipmentSelection`, `UnresolvedEquipmentSelection`, `ArmorPiece`,
      `WeaponHandLoadout`, `AuthoredWeaponRequirement`, and revised `WeaponSet`.
- [ ] Change `Build.equipment` to `EquipmentLoadout | null`.
- [ ] Retain `EquipmentTemplate` as a documented deprecated alias.
- [ ] Keep `ArmorPieceId` exported but remove it from semantic armor-piece identity.
- [ ] Add canonical slot constants and pure empty/default constructors.
- [ ] Ensure default construction produces five armor rows and four weapon sets in canonical order.
- [ ] Prove null, empty, partial, known-ID, stale-ID, and explicit unresolved states are
      JSON-compatible.
- [ ] Add source scans proving the semantic types contain no template item/modifier, color, dye,
      skin, acquisition, or inventory fields.
- [ ] Do not modify app state, persistence, sharing, generated data, or template codecs.
- [ ] Mark BW-1301 done only after its focused checks and acceptance criteria pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/equipment-contracts.test.ts test/domain/contracts.test.ts
```

### Phase 2: BW-1302 Armor, Headgear, and Attribute Adjustments (~20%)

**Files:**

- `src/domain/equipment.ts`
- `src/domain/equipment-attribute-rank.ts` — create
- `src/domain/rune-effects.ts` — narrow its accepted catalog input if needed
- `src/domain/effective-attribute-rank.ts` — reference or narrow integration only
- `src/domain/insignia-effects.ts` — reference only
- `src/domain/index.ts`
- `test/domain/armor-equipment.test.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `test/domain/rune-effects.test.ts`
- `test/fixtures/rule-engine/equipment.ts` — create
- `test/fixtures/rule-engine/equipment-catalogs.ts` — create

**Tasks:**

- [ ] Begin BW-1302 only after Phase 1 passes.
- [ ] Verify and document the approved source-policy basis for the fixed headgear `+1` fact using
      existing EPIC-10 evidence; block rather than guessing if that evidence is insufficient.
- [ ] Implement the target-aware equipment attribute-adjustment summary.
- [ ] Reuse `summarizeAttributeRuneEffects` for highest-per-attribute rune stacking.
- [ ] Apply a valid headgear adjustment separately so headgear and rune contributions can stack.
- [ ] Treat a known unallocated headgear target as base rank zero.
- [ ] Derive armor profession from the build primary profession without copying it into every piece.
- [ ] Preserve invalid and unresolved selections in output reasons; do not apply optimistic
      adjustments.
- [ ] Cover all five canonical armor slots, missing and duplicate slots, non-canonical order,
      profession-restricted runes and insignias, slot-inapplicable insignias, headgear on non-head
      rows, unresolved attributes, and headgear-plus-rune stacking.
- [ ] Confirm no numeric base armor fact is needed by EPIC-13 and document its deferral.
- [ ] Mark BW-1302 done only after the armor contract and adjustment checks pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/armor-equipment.test.ts test/domain/effective-attribute-rank.test.ts test/domain/rune-effects.test.ts
```

### Phase 3: BW-1303 Weapon Sets, Modifiers, and Requirements (~20%)

**Files:**

- `src/domain/equipment.ts`
- `src/domain/weapon-set.ts` — create
- `src/domain/weapon-mod-compatibility.ts` — reference only unless a narrow input type is needed
- `src/domain/index.ts`
- `test/domain/weapon-set.test.ts`
- `test/domain/weapon-mod-compatibility.test.ts`
- `test/fixtures/rule-engine/equipment.ts`
- `test/fixtures/rule-engine/equipment-catalogs.ts`

**Tasks:**

- [ ] Begin BW-1303 only after Phase 1 passes; it may proceed independently of Phase 2 until the
      shared validation phase.
- [ ] Implement the pure weapon-set occupancy projection.
- [ ] Derive two-handed occupancy from EPIC-12 `equipRole` and `handedness`; do not add a duplicate
      authored occupancy flag.
- [ ] Preserve empty hands, off-hand-only partial sets, and hand state whose weapon remains
      unresolved.
- [ ] Validate main-hand, off-hand, and two-handed placement without auto-moving selections.
- [ ] Resolve each modifier record and delegate pairwise compatibility to
      `explainWeaponModCompatibility`.
- [ ] Enforce modifier occupied-slot cardinality across the selected weapon instance.
- [ ] Implement catalog-first requirement resolution and the restricted authored fallback for
      catalog-unresolved requirements.
- [ ] Cover empty sets, one-handed pairs, off-hand-only sets, two-handed sets, two-handed/off-hand
      conflict, wrong-hand weapons, modifiers without weapons, incompatible modifiers, duplicate
      occupied slots, missing requirements, authored requirement conflicts, and unresolved IDs.
- [ ] Confirm the helpers are deterministic under shuffled catalog and authored array order.
- [ ] Mark BW-1303 done only after occupancy, modifier, and requirement checks pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/weapon-set.test.ts test/domain/weapon-mod-compatibility.test.ts
```

### Phase 4: BW-1304 Equipment Validation and Rule-Engine Handoff (~28%)

**Files:**

- `src/domain/validation.ts`
- `src/domain/validation-context.ts`
- `src/domain/rule-engine.ts`
- `src/domain/rules/equipment.ts` — create
- `src/domain/equipment-attribute-rank.ts`
- `src/domain/weapon-set.ts`
- `src/domain/index.ts`
- `test/domain/equipment-validation.test.ts`
- `test/domain/rule-engine.test.ts`
- `test/domain/rule-engine-contracts.test.ts`
- `test/domain/validation-context.test.ts`
- `test/fixtures/rule-engine/builds.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/equipment.ts`
- `test/fixtures/rule-engine/equipment-catalogs.ts`
- `test/fixtures/rule-engine/README.md`

**Tasks:**

- [ ] Begin BW-1304 only after BW-1302 and BW-1303 pass.
- [ ] Add minimal optional equipment catalog views to `BuildValidationInput`.
- [ ] Add duplicate-safe catalog indexes; ambiguous IDs must not resolve first-record-wins.
- [ ] Verify weapon and modifier catalog-set identity before using compatibility conclusions.
- [ ] Add equipment issue codes, rule IDs, entity kinds, inline locations, catalog versions, and
      traversal truncation kinds.
- [ ] Advance the rule engine to `rule-engine:v2`.
- [ ] Append equipment rules after existing skill rules to preserve prior issue ordering.
- [ ] Make `validateBuild` skip equipment rules entirely for `equipment: null`.
- [ ] Make a canonical empty loadout produce no equipment issues even without equipment catalogs.
- [ ] Run structural rules without catalogs and emit bounded catalog-unavailable issues only when a
      selected value requires that catalog.
- [ ] Emit errors, incomplete warnings, unresolved warnings, requirement warnings, and information
      according to the Architecture table.
- [ ] Use valid equipment adjustments when checking weapon requirements; suppress false unmet
      conclusions when rank-affecting selections are unresolved.
- [ ] Apply the global issue cap once after existing and equipment issues are combined.
- [ ] Prove validation never mutates builds or catalogs and remains stable under input ordering.
- [ ] Cover the full required matrix: null equipment, empty equipment, partial armor, missing and
      duplicate slots, restrictions, headgear, occupancy, modifiers, requirements, unresolved
      selections, missing views, duplicate catalog IDs, catalog-set mismatch, ordering, and
      truncation.
- [ ] Mark BW-1304 done only after focused rule-engine verification passes.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/equipment-validation.test.ts test/domain/rule-engine.test.ts test/domain/rule-engine-contracts.test.ts test/domain/validation-context.test.ts
npm run test:run -- src/app/App.test.tsx src/app/editor-selectors.test.ts src/app/persistence-schema.test.ts
```

### Phase 5: BW-1305 Documentation, Regression, and Closeout (~12%)

**Files:**

- `README.md`
- `compendium/equipment-shell.md` — create
- `compendium/game-rule-engine.md`
- `compendium/template-compatibility.md`
- `compendium/runes-catalog.md`
- `compendium/insignias-catalog.md`
- `compendium/weapons-and-mods-catalog.md`
- `compendium/core-build-editor.md`
- `compendium/README.md`
- `work/tickets/13-armor-and-equipment/*.md`
- `work/sprints/SPRINT-014.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-13-result.json`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/execute-SPRINT-014-result.json`

**Tasks:**

- [ ] Begin BW-1305 only after all focused domain gates pass.
- [ ] Document the authored schema, null-versus-empty semantics, unresolved references,
      constructors, armor profession derivation, headgear/rune adjustment behavior, occupancy,
      requirements, issue classification, catalog views, and runtime boundaries.
- [ ] Record the reviewed provenance for fixed slot topology, weapon-set count, hand occupancy, and
      headgear adjustment.
- [ ] Document that numeric base armor values were intentionally omitted because EPIC-13 has no
      authoritative consumer for them.
- [ ] Update rune, insignia, and weapon notes from “deferred to EPIC-13” to the implemented shell and
      validation handoff.
- [ ] State explicitly that EPIC-14 must add app catalog views, reducer actions, UI, non-null local
      persistence, backup migration, validation presentation, and honest share omission warnings.
- [ ] State that EPIC-17 must keep raw equipment-template state separate from semantic selections.
- [ ] State that EPIC-20 consumes only approved runtime display facts and EPIC-21 owns complete
      effect/stat aggregation.
- [ ] Confirm `src/app/catalogs.ts`, leaf UI, share-url payloads, persistence acceptance of non-null
      equipment, generated data, and template codecs did not change.
- [ ] Run source scans for prohibited imports and semantic references to raw template or cosmetic
      fields.
- [ ] Run the complete offline verification suite.
- [ ] Update BW-1301 through BW-1305, EPIC-13, SPRINT-014, the ledger, and result manifests to one
      consistent final state.
- [ ] Mark the sprint complete only after every Definition of Done item passes.
- [ ] Do not create a commit.

**Verification:**

```sh
rg -n "TemplateEquipment(Item|Modifier|Color|Slot)Id|skin|dye|colorId" src/domain/equipment.ts src/domain/equipment-attribute-rank.ts src/domain/weapon-set.ts src/domain/rules/equipment.ts
rg -n "react|localStorage|sessionStorage|fetch\\(|data/generated|data/qa|source-snapshots|scripts/data|api\\.php|wiki" src/domain
npm run verify
```

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/equipment.ts` | Modify | Define the semantic loadout, selection states, armor and weapon containers, constants, constructors, and deprecated alias. |
| `src/domain/build.ts` | Modify | Point `Build.equipment` at `EquipmentLoadout | null`. |
| `src/domain/equipment-attribute-rank.ts` | Create | Resolve target-aware headgear and attribute-rune rank adjustments. |
| `src/domain/weapon-set.ts` | Create | Resolve hand occupancy, per-instance modifier slots, and requirement handoffs. |
| `src/domain/rules/equipment.ts` | Create | Emit deterministic equipment validation issues from authored state and caller-supplied views. |
| `src/domain/validation.ts` | Modify | Add equipment issue codes, locations, entities, versions, truncation kinds, rule ordering, and rule-engine v2. |
| `src/domain/validation-context.ts` | Modify | Accept optional equipment catalog views and expose validation inputs safely. |
| `src/domain/rule-engine.ts` | Modify | Compose equipment issues into the existing capped `ValidationResult`. |
| `src/domain/rune-effects.ts` | Modify narrowly if needed | Accept the minimum rune record view while retaining current callers and stacking behavior. |
| `src/domain/effective-attribute-rank.ts` | Reference or test-only | Consume caller-consolidated equipment adjustments without taking ownership of equipment. |
| `src/domain/insignia-effects.ts` | Reference only | Preserve the one-record/one-slot projection boundary. |
| `src/domain/weapon-mod-compatibility.ts` | Reference only | Preserve EPIC-12 pairwise compatibility semantics. |
| `src/domain/catalog.ts` | Reference only | Reuse existing catalog record facts without copying or widening them. |
| `src/domain/catalog-lookup.ts` | Reference only | Follow existing duplicate-safe ID lookup conventions. |
| `src/domain/ids.ts` | Reference only | Reuse catalog IDs; keep `ArmorPieceId` exported without requiring it in the new shell. |
| `src/domain/index.ts` | Modify | Export the new contracts, constants, constructors, projections, and validation views. |
| `test/domain/equipment-contracts.test.ts` | Create | Verify plain-data contracts, defaults, partial states, unresolved states, and prohibited-field absence. |
| `test/domain/armor-equipment.test.ts` | Create | Verify armor topology, restrictions, headgear, rune stacking, and adjustment outputs. |
| `test/domain/weapon-set.test.ts` | Create | Verify occupancy, modifier cardinality, compatibility, and requirements. |
| `test/domain/equipment-validation.test.ts` | Create | Verify issue semantics, ordering, locations, versions, caps, and no mutation. |
| `test/domain/rule-engine*.test.ts` | Modify | Verify rule-engine v2 composition and null-equipment regressions. |
| `test/domain/validation-context.test.ts` | Modify | Verify optional catalog-view normalization and integrity behavior. |
| `test/domain/effective-attribute-rank.test.ts` | Modify | Verify equipment-generated adjustments and unallocated targets. |
| `test/fixtures/rule-engine/equipment.ts` | Create | Provide reusable empty, partial, invalid, unresolved, and legal loadouts. |
| `test/fixtures/rule-engine/equipment-catalogs.ts` | Create | Provide synthetic rune, insignia, weapon, and modifier records. |
| `test/fixtures/rule-engine/builds.ts` | Modify | Add builds containing semantic equipment while preserving null defaults. |
| `test/fixtures/rule-engine/catalogs.ts` | Modify narrowly | Add profession/attribute facts needed by equipment fixtures. |
| `test/fixtures/rule-engine/README.md` | Modify | Document synthetic equipment scenarios and non-authoritative mechanics. |
| `src/app/catalogs.ts` | Reference only | Preserve the sole generated-data import boundary; no equipment catalogs are wired yet. |
| `src/app/persistence-schema.ts` | Reference only | Preserve current null-equipment persistence until EPIC-14 migration. |
| `src/app/share-url.ts` | Reference only | Preserve skill-template-first share payloads. |
| `src/template-compatibility/**` | Reference/test only | Preserve raw equipment-template decode/export without semantic integration. |
| `README.md` | Modify | Add the equipment domain shell and clarify unchanged app scope. |
| `compendium/equipment-shell.md` | Create | Record the durable architecture, mechanics, validation, provenance, and handoffs. |
| `compendium/game-rule-engine.md` | Modify | Document equipment rules and rule-engine v2. |
| `compendium/template-compatibility.md` | Modify | Clarify the raw/semantic equipment boundary and EPIC-17 ownership. |
| `compendium/runes-catalog.md` | Modify | Record the implemented armor attachment and adjustment consumer. |
| `compendium/insignias-catalog.md` | Modify | Record the implemented slot/restriction consumer. |
| `compendium/weapons-and-mods-catalog.md` | Modify | Record the implemented occupancy, modifier, and requirement consumer. |
| `compendium/core-build-editor.md` | Modify | Clarify that the current app still authors `equipment: null` pending EPIC-14. |
| `compendium/README.md` | Modify | Index the equipment-shell note. |
| `work/tickets/13-armor-and-equipment/*.md` | Modify | Track sprint linkage, decisions, status, and verification evidence. |
| `work/sprints/SPRINT-014.md` | Create/update | Store the executable sprint and execution checklist state. |
| `work/sprints/ledger.tsv` | Modify | Track the SPRINT-014 lifecycle. |
| `work/runs/ticket-burn/BACKLOG/20260903T014346Z/*.json` | Create/update | Record planning and execution outcomes. |

## Definition of Done

### Equipment Contract

- [ ] `EquipmentLoadout` is the preferred public type and `EquipmentTemplate` is a documented
      deprecated alias.
- [ ] `Build.equipment` accepts `EquipmentLoadout | null`.
- [ ] The loadout is framework-neutral, versioned, readonly, and JSON-compatible.
- [ ] Canonical constructors produce five armor rows and four empty weapon sets.
- [ ] Null, empty, partial, known-ID, stale-ID, and explicitly unresolved states are representable.
- [ ] Authored semantic state contains no raw equipment-template IDs, skins, dyes, colors,
      acquisition facts, inventory identity, catalog record copies, or media.
- [ ] Armor identity is slot-based; no armor catalog is implied.
- [ ] Existing null-equipment builds compile, validate, render, and persist as before.

### Armor and Headgear

- [ ] Armor supports exactly the canonical logical slots `head`, `chest`, `hands`, `legs`, and
      `feet`.
- [ ] Missing, duplicate, malformed, and non-canonically ordered slots have deterministic outcomes.
- [ ] Each armor piece can independently attach one rune and one insignia selection.
- [ ] Rune eligibility and insignia profession, mode, and slot restrictions come only from supplied
      catalog records.
- [ ] Armor profession is derived from the build primary profession.
- [ ] Headgear selection is restricted to the head row and a primary-profession attribute.
- [ ] The fixed headgear `+1` fact has documented approved provenance.
- [ ] Headgear and highest-per-attribute rune contributions compose without duplicating rune
      stacking logic.
- [ ] A valid unallocated target resolves from rank zero.
- [ ] Invalid or unresolved armor selections do not contribute optimistic adjustments.
- [ ] Numeric base armor rating is omitted and its ownership is documented.

### Weapons and Requirements

- [ ] A loadout supports up to four uniquely identified weapon sets.
- [ ] Empty, main-hand-only, off-hand-only, paired, two-handed, incomplete, conflict, and unresolved
      occupancy states are distinguishable.
- [ ] Two-handed occupancy is derived from the weapon catalog and cannot silently coexist with an
      off-hand weapon.
- [ ] Weapon and modifier state stores semantic catalog selections, not copied records or template
      IDs.
- [ ] Modifier compatibility delegates to the EPIC-12 helper and set-level occupied-slot
      cardinality is enforced separately.
- [ ] Wrong-hand, mode-restricted, incompatible, indeterminate, duplicate-slot, and unresolved
      selections remain distinct.
- [ ] Catalog requirements take precedence over authored fallback requirements.
- [ ] Authored requirements are accepted only for catalog-unresolved requirement facts.
- [ ] Known unmet requirements are advisory warnings; unresolved requirements make the result
      unresolved.
- [ ] Requirement evaluation consumes valid equipment rank adjustments and avoids false conclusions
      when adjustment inputs are unresolved.

### Validation

- [ ] `validateBuild` accepts optional minimal equipment catalog views.
- [ ] Structural validation does not require runtime catalogs.
- [ ] Missing catalog views produce bounded unresolved issues only when selected data needs them.
- [ ] Duplicate catalog IDs and mismatched weapon catalog sets never resolve first-record-wins.
- [ ] Equipment issues use the existing `ValidationIssue` and `ValidationResult` contracts.
- [ ] Issue paths and locations identify the relevant armor row, weapon set, hand, field, and
      modifier index where possible.
- [ ] Error, incomplete, unresolved, advisory, and informational classifications match the
      Architecture table.
- [ ] Equipment rule ordering is deterministic and appended after existing rules.
- [ ] Equipment issues participate in the same global issue cap.
- [ ] Oversized armor, weapon-set, and modifier collections are bounded and mark validation
      non-exhaustive.
- [ ] `equipment: null` and a canonical empty loadout produce no equipment issues.
- [ ] Validation does not coerce, reorder, remove, replace, or mutate authored selections or catalog
      records.
- [ ] `RULE_ENGINE_VERSION` is `rule-engine:v2`, and catalog-version evidence includes nullable
      equipment catalog facts.

### Boundaries and Regression

- [ ] `src/domain` imports no React, DOM/browser APIs, browser storage, network clients, app modules,
      generated JSON, manifests, QA reports, snapshots, data scripts, wiki APIs, or template codec.
- [ ] `src/app/catalogs.ts` remains the only permitted generated-catalog import boundary and is not
      expanded during this sprint.
- [ ] Equipment editor state, UI, and leaf-component wiring remain deferred to EPIC-14.
- [ ] Local-library non-null equipment persistence, backup/restore migration, and share omission
      presentation remain deferred to EPIC-14.
- [ ] Raw equipment-template decode/export and exact-source replay remain unchanged.
- [ ] Existing profession, attribute, skill, rune, insignia, weapon, modifier, editor, persistence,
      and sharing tests pass.
- [ ] No generated data, ingestion scripts, production catalogs, manifests, QA reports, or source
      snapshots change.

### Closeout

- [ ] Documentation records the schema, constructors, mechanics, validation semantics, provenance,
      runtime boundaries, and downstream ownership.
- [ ] EPIC-14 receives explicit catalog, editor-state, persistence, validation-presentation, and
      share-boundary handoffs.
- [ ] EPIC-17 receives an explicit raw-template versus semantic-loadout handoff.
- [ ] EPIC-20 and EPIC-21 receive explicit display and aggregation boundaries.
- [ ] BW-1301 through BW-1305, EPIC-13, SPRINT-014, the ledger, and ticket-burn manifests agree.
- [ ] `npm run verify` passes without network access.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The new authored shape becomes coupled to EPIC-10/11/12 record layouts. | Medium | High | Store only semantic selections; keep catalog facts in caller-supplied validation views. |
| A generic numeric ID is mistaken for a raw template ID. | Medium | High | Use discriminated selection types, branded known IDs, explicit `candidateCatalogId` naming, and prohibited-field tests. |
| `EquipmentTemplate` is confused with raw `EquipmentTemplateDocument`. | High | Medium | Prefer `EquipmentLoadout`, retain only a deprecated compatibility alias, and document the namespace boundary. |
| Derived mechanics are copied into authored state and become stale. | Medium | High | Derive armor profession, handedness, modifier slots, requirements, and restrictions from current catalogs. |
| Headgear `+1` is encoded without adequate source-policy evidence. | Low | High | Make provenance confirmation a Phase 2 gate; block rather than introducing an unsupported fact. |
| Numeric base armor scope expands into a new catalog or totals system. | Medium | Medium | Omit numeric base armor because no current rule needs it; require a future source-backed ticket. |
| Typed unions prevent recovery of malformed persisted data. | Medium | High | Keep array containers and validate unknown runtime values defensively without mutation. |
| Optional catalog views lead to false legality or requirement conclusions. | Medium | High | Emit unresolved outcomes, suppress dependent conclusions, and never treat missing data as compatible. |
| Duplicate catalog IDs make resolution order-dependent. | Low | High | Build duplicate-safe indexes and exclude ambiguous IDs from resolved lookups. |
| Weapon and modifier catalogs become version-skewed. | Low | High | Require matching catalog-set version and digest before compatibility is trusted. |
| Requirement warnings are treated as equip-legality errors. | Medium | Medium | Define unmet requirements as advisory warnings and test `valid`, `complete`, and `resolved` separately. |
| Headgear or rune uncertainty causes false requirement warnings. | Medium | High | Evaluate requirements only from validated adjustments; emit unresolved when contributing state is uncertain. |
| Validation issue volume or oversized arrays cause poor behavior. | Low | High | Use fixed traversal ceilings, duplicate-safe linear indexes, deterministic truncation, and the existing issue cap. |
| `equipment: null` begins producing incomplete warnings in existing workflows. | Medium | High | Treat null as an explicit opt-out and add app, persistence, and rule-engine regression tests. |
| EPIC-14 assumes non-null equipment already persists. | High | Medium | Document that persistence remains null-only and name the required EPIC-14 migration and bounds. |
| Compatibility helpers and validation duplicate each other. | Medium | Medium | Reuse rune stacking and pairwise modifier helpers; keep only loadout-level topology in EPIC-13. |
| Rule-engine v2 changes unrelated issue ordering. | Low | High | Append equipment rules after existing rules and snapshot null-equipment results. |

## Security

- Treat builds, equipment selections, catalog views, unresolved labels, catalog IDs, modifier
  arrays, and authored requirements as untrusted values at the validation boundary.
- Accept only non-negative safe integers for known and candidate catalog IDs. Authored ranks must be
  finite safe integers within the established domain policy.
- Bound unresolved labels before future persistence and never interpolate them into validation
  messages. Future UI must render them as escaped text, not HTML.
- Do not execute or interpret labels, catalog names, notes, URLs, template fields, or modifier
  effects as code, markup, CSS, shell input, or source expressions.
- Bound armor rows, weapon sets, modifiers per hand, related entities, issue messages, total issues,
  and validation traversal.
- Build duplicate-safe maps in linear passes; avoid repeated whole-catalog scans for every
  attachment.
- Never fetch catalogs or source data from domain validation. Callers provide inert catalog views.
- Do not accept arbitrary file paths, URLs, manifests, QA reports, snapshot paths, or source
  commands in the equipment contract.
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
- `EPIC-02` / `SPRINT-003`: established catalog artifact boundaries; no ingestion work is required
  in this sprint.
- `EPIC-03` / `SPRINT-004`: `ProfessionId`, `AttributeId`, profession ownership, attribute joins,
  and attribute validation views.
- `EPIC-05` / `SPRINT-006`: isolated raw equipment-template contracts and exact-source preservation;
  these remain a compatibility boundary, not a semantic input.
- `EPIC-06` / `SPRINT-007`: `validateBuild`, validation contexts, issue/result semantics, truncation,
  and effective attribute rank.
- `EPIC-08` / `SPRINT-009`: current app catalog boundary and null-equipment editor behavior used for
  regression checks.
- `EPIC-09` / `SPRINT-010`: local persistence and skill-template-first sharing boundaries; non-null
  equipment persistence remains downstream.
- `EPIC-10` / `SPRINT-011`: `RuneId`, rune eligibility/effects, headgear interaction evidence, and
  `summarizeAttributeRuneEffects`.
- `EPIC-11` / `SPRINT-012`: `InsigniaId`, profession/mode/slot applicability, and
  `resolveInsigniaEffectsForArmorSlot`.
- `EPIC-12` / `SPRINT-013`: `WeaponId`, `WeaponModifierId`, handedness, equip roles, requirements,
  modifier slots, catalog-set identity, and `explainWeaponModCompatibility`.
- Future `EPIC-14`: app catalog imports, equipment editor state and UI, inline issue presentation,
  local persistence, backups, and share-boundary warnings.
- Future `EPIC-17`: semantic resolution from raw equipment templates while retaining exact raw
  compatibility state separately.
- Future `EPIC-20`: equipment search, display projections, and tooltips.
- Future `EPIC-21`: full health, energy, armor, damage, duration, condition, and effect aggregation.
- Node.js `>=22.11.0`, npm `>=11.10.1`, and the repository’s existing Vitest/TypeScript toolchain.

## Open Questions

These are implementation checkpoints and do not block the sprint plan:

1. Which retained EPIC-10 review record should be cited as the canonical provenance for the fixed
   headgear `+1` constant? If no approved evidence exists, Phase 2 must block arithmetic rather than
   silently choosing a value.
2. Should the deprecated `EquipmentTemplate` alias be removed during EPIC-14 persistence migration
   or retained until a later domain-schema major version? The current sprint retains it.
3. Do any reviewed future weapon records require authored requirement selection despite having a
   resolved catalog requirement? EPIC-13 permits authored fallback only for catalog-unresolved
   requirements; broader overrides require an EPIC-12 schema amendment.
4. Should EPIC-14 persist all four canonical empty weapon-set rows or compact trailing empty rows?
   Both validate equivalently, but the default constructor and recommended native representation use
   all four rows.
5. What future ticket should introduce source-backed numeric base armor facts if EPIC-21 needs them?
   They remain intentionally absent from the v1 authored shell.