---
id: SPRINT-014
title: Equipment Shell Model
status: draft
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

This sprint turns `EPIC-13 Equipment Shell Model` into a framework-neutral semantic equipment
contract for one authored single-character `Build`. The result should let later UI attach runes,
insignias, weapons, and weapon modifiers by promoted catalog IDs while preserving empty, partial,
stale, and unresolved selections as first-class authored states.

The sprint is domain and validation groundwork. It does not build the equipment editor UI, wire
equipment catalogs into app leaf components, change raw equipment-template import/export fidelity,
persist equipment in local library records, include share-url equipment payloads, add armor or weapon
skin catalogs, model dyes/colors, fetch icons, simulate combat, calculate DPS, aggregate full
health/energy/armor totals, or author guides.

Execution should prefer small pure modules under `src/domain`, focused Vitest coverage, and closeout
docs that make downstream ownership explicit. Existing builds with `equipment: null`, the current
skill editor, local library, sharing, backup/restore, and EPIC-05 template compatibility behavior
must remain compatible.

## Use Cases

1. **Start from no equipment**: existing and new builds can keep `equipment: null` or create an
   empty semantic loadout without changing skill editing behavior.
2. **Edit armor incrementally later**: EPIC-14 can represent five armor slots, missing slots,
   duplicate malformed slots, known rune/insignia IDs, and unresolved imported selections.
3. **Apply headgear rank facts**: a head slot can express the selected headgear attribute bonus and
   expose it as an additive `headgear` adjustment for `calculateEffectiveAttributeRank`.
4. **Bridge rune effects**: armor rune attachments can produce stable equipped-source keys for
   `summarizeAttributeRuneEffects` without making the rune helper own armor legality.
5. **Bridge insignia effects**: armor insignia attachments can be checked against
   `resolveInsigniaEffectsForArmorSlot` without making the insignia helper own loadout validation.
6. **Edit weapon sets incrementally later**: up to four weapon sets can represent empty hands,
   main-hand/off-hand selections, a two-handed weapon occupying the set, partial sets, modifiers,
   stale IDs, and unresolved placeholders.
7. **Explain invalid equipment**: `validateBuild` and/or a direct equipment helper can emit the
   existing `ValidationIssue` shape for armor slot, attachment, occupancy, modifier, requirement,
   and unresolved-selection problems.
8. **Preserve semantic uncertainty**: unknown semantic equipment remains visible to users, while raw
   template IDs, colors, skins, and exact replay stay in EPIC-05/17 boundaries.
9. **Hand off cleanly**: EPIC-14 receives editable contracts and fixtures; EPIC-17 receives raw
   template workflow gaps; EPIC-20 receives search/tooltip scope; EPIC-21 receives full aggregation.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Authored model | One single-character semantic equipment loadout, five armor slots, four weapon sets, empty states, known catalog IDs, unresolved semantic placeholders, and pure constructors/helpers. | Party equipment, guide equipment, backend sync, inventory identity, exact raw template replay, cosmetic skins, dye/color IDs, screenshots, icons, acquisition facts. |
| Armor | Slot ordering, rune/insignia attachment points, headgear attribute bonus state, minimal base armor-rating field shape, malformed slot detection, and caller-supplied catalog validation. | Armor skin catalogs, campaign/prestige appearance, source-derived armor catalog generation, hit-location math, full armor totals. |
| Weapons | Main-hand/off-hand/two-handed occupancy, weapon/modifier catalog ID attachments, modifier slot/cardinality validation via EPIC-12 facts, and requirement handoff warnings. | DPS, attack timing, damage simulation, unique-item economy, party weapon sets, template item IDs, weapon skins. |
| Validation | Existing `ValidationIssue`, `ValidationResult`, ordering, truncation, `complete`, `resolved`, and `exhaustive` semantics extended for equipment. | New result shapes, UI-specific validation objects, generated data imports in domain, app-only presentation logic. |
| Runtime app | Compile compatibility and `equipment: null` regression coverage. | Equipment editor controls, local-library equipment persistence migration, share-url equipment encoding, app catalog wiring for EPIC-10/11/12. |

### Binding Decisions

- Introduce `EquipmentLoadout` as the canonical semantic name and retain `EquipmentTemplate` as a
  compatibility alias only if needed to avoid broad app churn.
- Keep `Build.equipment` nullable. Existing `equipment: null` records remain valid and unchanged.
- Store authored equipment as plain JSON-compatible data in `src/domain/equipment.ts`.
- Do not store `TemplateEquipmentItemId`, `TemplateEquipmentModifierId`,
  `TemplateEquipmentColorId`, skin IDs, dye IDs, wiki URLs, generated record copies, or catalog
  snapshots in the semantic loadout.
- Use catalog IDs only for resolved semantic selections: `RuneId`, `InsigniaId`, `WeaponId`,
  `WeaponModifierId`, and `AttributeId`.
- Use explicit tagged unresolved selections for imported/stale/unsupported semantic facts that cannot
  be represented by a current catalog ID.
- Keep arrays for `armor` and `weaponSets` so duplicate, missing, over-limit, and malformed authored
  states remain representable and testable. Constructors produce canonical five-slot/four-set arrays.
- Domain code may hardcode slot order, slot count, weapon-set count, hand names, and headgear bonus
  shape. Any new source-derived armor/headgear fact table is out of scope and should block or defer.
- Requirement satisfaction is a validation handoff, not full stat aggregation. Emit deterministic
  warnings for fixed catalog requirements that cannot be met or resolved; do not calculate DPS or
  effect totals.

### Contract Shape

Implementation may adjust exact names to local style, but the sprint should preserve these
distinctions:

```text
EquipmentSelection<Id>
  kind: empty | known | unresolved
  id: Id only when known
  unresolvedKey/label/reason only when unresolved

EquipmentLoadout
  schemaVersion
  catalogVersion
  armor: ArmorPieceLoadout[]
  weaponSets: WeaponSetLoadout[]

ArmorPieceLoadout
  slot: head | chest | hands | legs | feet
  rune: EquipmentSelection<RuneId>
  insignia: EquipmentSelection<InsigniaId>
  headgearAttribute: EquipmentSelection<AttributeId> only meaningful on head
  armorRating: tagged optional/authored/unresolved state

WeaponSetLoadout
  slot: set-1 | set-2 | set-3 | set-4
  mainHand: EquippedWeapon | null
  offHand: EquippedWeapon | null

EquippedWeapon
  weapon: EquipmentSelection<WeaponId>
  modifiers: EquipmentSelection<WeaponModifierId>[]
  requirementAttributeOverride: EquipmentSelection<AttributeId> | null
```

### Validation Integration

Add equipment validation in the existing rule-engine pattern, preferably as a small
`src/domain/rules/equipment.ts` module plus a direct pure helper if that keeps tests clearer.
`validateBuild` should delegate to it only when `build.equipment` is non-null.

`BuildValidationInput` should accept optional caller-supplied equipment catalog views:

- runes: `catalogVersion`, `runes`, `dispositions`
- insignias: `catalogVersion`, `insignias`, `dispositions`
- weapons: `catalogVersion`, `weaponBases`, `dispositions`
- weapon modifiers: `catalogVersion`, `weaponMods`, `dispositions`

Catalog views remain data passed by the caller. `src/domain` must not import generated catalog JSON
or `src/app/catalogs.ts`.

Extend validation types narrowly:

- issue codes for equipment slot shape, missing/duplicate armor slots, unresolved rune/insignia,
  invalid rune/insignia profession or slot restriction, unresolved headgear attribute,
  weapon-set shape, two-handed/off-hand conflict, unresolved weapon/modifier, incompatible modifier,
  duplicate modifier occupied slot, and unresolved/unmet fixed requirements
- locations for armor slot, weapon set, hand, and modifier positions
- entity kinds for rune, insignia, weapon, weapon modifier, armor slot, and weapon set
- catalog-version fields for optional rune, insignia, weapon, and weapon-modifier validation inputs
- incomplete and unresolved code sets so `complete` and `resolved` remain meaningful

## Implementation

### Phase 1: BW-1301 Equipment Contracts And Constructors

**Files:**

- `src/domain/equipment.ts`
- `src/domain/build.ts`
- `src/domain/index.ts`
- `test/domain/equipment.test.ts`
- `test/domain/contracts.test.ts`

**Tasks:**

- [ ] Mark BW-1301 and SPRINT-014 in progress.
- [ ] Replace the placeholder equipment shape with the semantic loadout contract.
- [ ] Add canonical constants for armor slots and weapon-set slots.
- [ ] Add `EquipmentSelection<Id>` or equivalent tagged selection types.
- [ ] Add constructors for empty loadouts, empty armor pieces, and empty weapon sets.
- [ ] Preserve `equipment: null` compatibility and avoid broad app changes.
- [ ] Export the new public types and helpers from `src/domain/index.ts`.
- [ ] Test JSON compatibility, default/empty loadouts, partial loadouts, and absence of skin/color/raw
      template fields.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/equipment.test.ts test/domain/contracts.test.ts`

### Phase 2: BW-1302 Armor Slot, Rune, Insignia, And Headgear Mechanics

**Files:**

- `src/domain/equipment.ts`
- `src/domain/effective-attribute-rank.ts` reference only unless a type export is needed
- `src/domain/rune-effects.ts` reference only
- `src/domain/insignia-effects.ts` reference only
- `test/domain/equipment-armor.test.ts`
- `test/fixtures/rule-engine/equipment.ts`
- `test/fixtures/rule-engine/README.md`

**Tasks:**

- [ ] Add armor slot normalization/inspection helpers that preserve malformed authored arrays.
- [ ] Emit stable equipped rune source keys such as `armor:head` for known rune selections.
- [ ] Expose known headgear bonuses as `EffectiveAttributeRankAdjustment` values with
      `kind: "headgear"` and amount `1`.
- [ ] Validate that headgear attribute state is meaningful only for the head slot.
- [ ] Model armor rating as minimal tagged authored state; do not introduce a source-derived armor
      catalog.
- [ ] Add armor fixtures for canonical loadout, partial loadout, duplicate slot, missing slot,
      unresolved rune, unresolved insignia, invalid insignia slot, invalid profession restriction,
      headgear adjustment, and unresolved headgear attribute.
- [ ] Keep rune stacking and insignia effect arithmetic delegated to existing EPIC-10/11 helpers.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/equipment-armor.test.ts test/domain/rune-effects.test.ts test/domain/insignia-effects.test.ts`

### Phase 3: BW-1303 Weapon Set Shell And Occupancy

**Files:**

- `src/domain/equipment.ts`
- `src/domain/weapon-mod-compatibility.ts` reference only unless a tiny adapter is needed
- `test/domain/equipment-weapon-set.test.ts`
- `test/domain/weapon-mod-compatibility.test.ts`
- `test/fixtures/rule-engine/equipment.ts`

**Tasks:**

- [ ] Add weapon-set helpers for empty sets, partial sets, hand occupancy, and canonical ordering.
- [ ] Represent known weapon IDs and modifier IDs without copying EPIC-12 catalog records into build
      state.
- [ ] Add unresolved weapon and unresolved modifier placeholders that remain visible but do not expose
      raw template item/modifier IDs.
- [ ] Validate two-handed weapons in main hand against occupied off-hand state using caller-supplied
      weapon catalog records.
- [ ] Validate modifier compatibility by reusing `explainWeaponModCompatibility` for each known
      base/modifier pair.
- [ ] Detect duplicate occupied modifier slots when catalog facts are resolved.
- [ ] Add requirement handoff logic for fixed catalog requirements: unresolved facts are warnings,
      below-rank facts are warnings, and not-applicable facts do not emit issues.
- [ ] Add fixtures for empty sets, one-handed plus off-hand, two-handed legal set, two-handed/off-hand
      conflict, incompatible modifier, duplicate modifier slot, missing requirement, unknown weapon
      ID, and unresolved modifier.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/equipment-weapon-set.test.ts test/domain/weapon-mod-compatibility.test.ts`

### Phase 4: BW-1304 Equipment Validation Fixtures And Rule-Engine Handoff

**Files:**

- `src/domain/rules/equipment.ts`
- `src/domain/rule-engine.ts`
- `src/domain/validation.ts`
- `src/domain/validation-context.ts`
- `src/domain/index.ts`
- `test/domain/equipment-validation.test.ts`
- `test/domain/rule-engine.test.ts`
- `test/domain/validation-context.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `test/fixtures/rule-engine/equipment.ts`

**Tasks:**

- [ ] Add narrow equipment validation catalog views to `BuildValidationInput`.
- [ ] Index optional rune, insignia, weapon, and modifier records by numeric catalog ID with duplicate
      detection consistent with existing catalog indexing.
- [ ] Extend validation issue codes, rule ordering, locations, entity kinds, unresolved codes, and
      incomplete codes.
- [ ] Ensure `validateBuild` still produces identical results for existing fixture builds with
      `equipment: null`.
- [ ] Add validation matrix coverage for all EPIC-13 edge cases without importing app modules or
      generated runtime catalogs into domain code.
- [ ] Cap malformed equipment traversal so hostile or corrupt authored arrays cannot produce
      unbounded issues.
- [ ] Confirm unresolved semantic equipment affects `resolved` and incomplete missing slots affect
      `complete` without blocking unrelated skill editing.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/equipment-validation.test.ts test/domain/rule-engine.test.ts test/domain/validation-context.test.ts`
- `npm run test:run -- test/domain/*equipment*`

### Phase 5: BW-1305 Docs, Traceability, Verification, And Closeout

**Files:**

- `README.md`
- `compendium/game-rule-engine.md`
- `compendium/template-compatibility.md`
- `compendium/runes-catalog.md`
- `compendium/insignias-catalog.md`
- `compendium/weapons-and-mods-catalog.md`
- `compendium/core-build-editor.md`
- `compendium/equipment-shell.md`
- `compendium/README.md`
- `src/app/persistence-schema.test.ts` reference only unless compatibility assertions need updates
- `work/tickets/13-armor-and-equipment/*.md`
- `work/sprints/SPRINT-014.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-13-result.json`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/execute-SPRINT-014-result.json`

**Tasks:**

- [ ] Document the semantic equipment boundary and explicitly exclude skins, dyes, colors, raw
      template IDs, acquisition facts, editor UI, and full stat aggregation.
- [ ] Document how EPIC-14 should consume loadouts, armor slots, headgear adjustments, weapon sets,
      and validation catalog views.
- [ ] Document EPIC-17 ownership for raw equipment-template semantic import/export workflows.
- [ ] Document EPIC-20 ownership for search/tooltips and EPIC-21 ownership for full stat/effect
      aggregation.
- [ ] Record any hardcoded mechanical facts and provenance assumptions.
- [ ] Confirm app persistence still rejects or drops non-null equipment according to the current app
      schema until EPIC-14 owns migration.
- [ ] Update BW-1301 through BW-1305, EPIC-13, SPRINT-014, ledger, and result manifests with matching
      statuses and verification evidence.
- [ ] Run full verification and inspect the worktree for unrelated changes.
- [ ] Do not create a commit.

**Verification:**

- `npm run verify`
- `rg -n 'EPIC-13|BW-130[1-5]|SPRINT-014' work/tickets/13-armor-and-equipment work/sprints`
- `git status --short`

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/equipment.ts` | Modify | Define semantic equipment loadout contracts, constants, constructors, selection states, armor helpers, weapon-set helpers, and adjustment extraction. |
| `src/domain/build.ts` | Modify narrowly | Point `Build.equipment` at the canonical semantic type while preserving nullable compatibility. |
| `src/domain/rules/equipment.ts` | Create | Emit deterministic equipment validation issues in the existing rule-module style. |
| `src/domain/rule-engine.ts` | Modify | Delegate equipment validation when a build has semantic equipment. |
| `src/domain/validation.ts` | Modify | Add equipment issue codes, locations, entity kinds, ordering, incomplete/unresolved classification, and any bounded truncation kinds. |
| `src/domain/validation-context.ts` | Modify | Accept optional equipment catalog views and expose indexed lookup state. |
| `src/domain/index.ts` | Modify | Export equipment contracts, helpers, and validation input types. |
| `src/domain/catalog.ts` | Reference only | Reuse EPIC-10/11/12 catalog record types and weapon modifier slot facts. |
| `src/domain/catalog-lookup.ts` | Reference only | Reuse pure catalog lookup style; avoid broad new template resolution. |
| `src/domain/effective-attribute-rank.ts` | Reference only | Consume existing additive adjustment API for headgear and rune outputs. |
| `src/domain/rune-effects.ts` | Reference only | Preserve rune stacking helper boundary. |
| `src/domain/insignia-effects.ts` | Reference only | Preserve per-slot insignia projection helper boundary. |
| `src/domain/weapon-mod-compatibility.ts` | Reference only | Reuse one-base/one-modifier compatibility explanations. |
| `src/app/catalogs.ts` | Reference only | Do not wire EPIC-10/11/12 equipment catalogs into app runtime in this sprint. |
| `src/app/persistence-schema.ts` | Reference only | Preserve current `equipment: null` local-library behavior unless compile compatibility requires a narrow type update. |
| `test/domain/equipment.test.ts` | Create | Cover shell constructors, constants, empty/default loadouts, partial loadouts, and JSON shape. |
| `test/domain/equipment-armor.test.ts` | Create | Cover armor slots, rune/insignia attachment states, headgear adjustments, and malformed armor arrays. |
| `test/domain/equipment-weapon-set.test.ts` | Create | Cover weapon-set occupancy, modifier attachment, unresolved states, and requirement handoff behavior. |
| `test/domain/equipment-validation.test.ts` | Create | Cover validation issue emission, result semantics, and catalog-view edge cases. |
| `test/fixtures/rule-engine/equipment.ts` | Create | Provide small synthetic equipment fixtures for domain tests. |
| `test/fixtures/rule-engine/catalogs.ts` | Modify | Add minimal rune, insignia, weapon, and modifier slices for validation tests. |
| `test/fixtures/rule-engine/builds.ts` | Modify | Add optional equipment fixture builders while keeping default builds at `equipment: null`. |
| `test/fixtures/rule-engine/README.md` | Modify | Document synthetic equipment fixture scope. |
| `README.md` | Modify | Record EPIC-13 status and unchanged app/runtime boundaries. |
| `compendium/equipment-shell.md` | Create | Long-lived architecture note for semantic equipment contracts and handoffs. |
| `compendium/*.md` | Modify | Update rule-engine, template, rune, insignia, weapon, core-editor, and index notes. |
| `work/tickets/13-armor-and-equipment/*.md` | Modify during execution | Track ticket status, assumptions, evidence, and closeout. |
| `work/sprints/SPRINT-014.md` | Create/update during planning/execution | Canonical sprint plan and checklist state. |
| `work/sprints/ledger.tsv` | Modify during execution | Track sprint lifecycle. |
| `work/runs/ticket-burn/BACKLOG/20260903T014346Z/*.json` | Create/update | Planning and execution result manifests. |

## Definition of Done

- [ ] BW-1301 through BW-1305 are completed in dependency order with status-consistent ticket,
      sprint, ledger, and result-manifest records.
- [ ] `EquipmentLoadout` or equivalent represents one single-character semantic equipment shell with
      five armor slots, four weapon sets, empty loadouts, partial loadouts, known catalog IDs, and
      typed unresolved placeholders.
- [ ] Semantic equipment contracts exclude raw template item IDs, raw modifier IDs, color IDs, dye
      IDs, armor skins, weapon skins, inventory identity, acquisition facts, copied wiki prose, and
      generated record copies.
- [ ] Existing `Build` records with `equipment: null` continue to typecheck, validate, persist,
      render, import/export skill templates, share, backup, and restore as before.
- [ ] Armor helpers cover canonical slot ordering, duplicate/missing slot handling, rune and insignia
      attachments, headgear attribute adjustments, minimal armor-rating state, and unresolved
      selections.
- [ ] Weapon helpers cover four-set ordering, main-hand/off-hand/two-handed occupancy, empty and
      partial sets, known weapon/modifier attachments, unresolved selections, modifier compatibility,
      duplicate modifier occupied slots, and requirement handoff warnings.
- [ ] Equipment validation emits the existing `ValidationIssue`/`ValidationResult` shape and keeps
      deterministic ordering, issue caps, `valid`, `complete`, `resolved`, and `exhaustive`
      semantics coherent.
- [ ] Domain validation uses only caller-supplied catalog views and imports no generated JSON,
      manifests, QA reports, app modules, React, DOM/browser APIs, storage, network clients, data
      scripts, snapshots, or wiki APIs.
- [ ] Focused Vitest coverage includes empty equipment, existing `equipment: null` builds, partial
      armor, duplicate/missing slots, invalid rune/insignia restrictions, headgear adjustments,
      two-handed/off-hand conflicts, incompatible modifiers, duplicate modifier slots, missing or
      unresolved requirements, unresolved catalog IDs, stale IDs, and malformed authored arrays.
- [ ] Documentation clearly hands EPIC-14 the editor/validation UI, EPIC-17 semantic template
      workflows, EPIC-20 search/tooltips, and EPIC-21 full stat/effect aggregation.
- [ ] `npm run verify` passes without live network access.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `EquipmentTemplate` naming conflicts with raw equipment templates. | High | Medium | Introduce `EquipmentLoadout` and keep `EquipmentTemplate` only as a compatibility alias or deprecated export. |
| Domain contracts accidentally preserve raw template/cosmetic fields. | Medium | High | Use tagged semantic selections only; add tests that reject raw item, modifier, color, dye, and skin fields from public helpers. |
| Hardcoded armor facts exceed source-policy authority. | Medium | High | Hardcode only slot/order/count/headgear shape; defer source-derived armor/headgear tables unless reviewed. |
| Validation requires catalogs the app does not yet load. | Medium | Medium | Make equipment catalog views optional and keep `equipment: null` behavior unchanged; EPIC-14 owns app catalog wiring. |
| Requirement validation drifts into full stat aggregation. | Medium | High | Emit only fixed requirement warnings from existing effective-rank inputs; defer DPS and full stat totals to EPIC-21. |
| Modifier validation duplicates EPIC-12 compatibility logic. | Medium | Medium | Reuse `explainWeaponModCompatibility`; add only loadout-level occupancy/cardinality checks. |
| Missing/duplicate malformed arrays are normalized away too early. | Medium | Medium | Keep authored arrays inspectable and separate constructors from validation normalization. |
| App persistence silently starts saving equipment before UI migration. | Low | High | Preserve current persistence tests and document EPIC-14 migration ownership. |
| Issue-code expansion breaks `complete`/`resolved` semantics. | Medium | Medium | Update validation classification tests alongside every new equipment code. |
| Scope expands into equipment editor UI. | Medium | High | Restrict app files to compile/reference/regression needs and keep all user-facing controls out of this sprint. |

## Security

- Treat authored equipment, restored local-library JSON, imported semantic placeholders, and catalog
  views as untrusted data.
- Bound armor pieces, weapon sets, modifiers, labels, unresolved reasons, paths, related entities,
  and emitted issues before validation result creation.
- Do not execute, fetch, parse HTML, render source text as HTML, or import source/generated/audit
  artifacts in domain code.
- Keep runtime strings deterministic, short, and escaped by future UI consumers.
- Reject unsafe numeric values such as non-integers, `NaN`, infinities, negative ranks where
  unsupported, and unsafe integer IDs.
- Preserve framework-neutral TypeScript boundaries: no React, DOM/browser globals, browser storage,
  network clients, app modules, template adapter imports, Python modules, manifests, QA reports, or
  source snapshots in `src/domain`.
- No new npm or Python dependency is planned. Any dependency need should block for explicit review.

## Dependencies

- `EPIC-03` / `SPRINT-004`: promoted profession and attribute IDs, attribute ownership, rank-cost
  facts, and validation catalog precedent.
- `EPIC-05` / `SPRINT-006`: raw skill/equipment template compatibility boundary and exact-source
  equipment replay ownership.
- `EPIC-06` / `SPRINT-007`: `validateBuild`, validation context, issue/result semantics, rule order,
  truncation, and effective attribute rank API.
- `EPIC-10` / `SPRINT-011`: `RuneId`, rune catalog contract, `summarizeAttributeRuneEffects`, and
  rune unresolved/effect modeling precedent.
- `EPIC-11` / `SPRINT-012`: `InsigniaId`, insignia catalog contract,
  `resolveInsigniaEffectsForArmorSlot`, slot applicability, and identity/crosswalk precedent.
- `EPIC-12` / `SPRINT-013`: `WeaponId`, `WeaponModifierId`, weapon/modifier catalog contracts,
  modifier slot facts, requirements, and `explainWeaponModCompatibility`.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and the existing `npm run verify` toolchain.
- Future `EPIC-14`, `EPIC-17`, `EPIC-20`, and `EPIC-21` depend on this sprint’s boundaries and
  fixtures.

## Open Questions

1. Should the exported public type be `EquipmentLoadout` with `EquipmentTemplate` as a compatibility
   alias, or should the sprint keep the existing name and document the semantic/raw distinction?
2. What is the smallest useful unresolved-selection payload that remains user-visible without
   leaking raw template IDs or cosmetic data?
3. Should `validateBuild` emit an unresolved warning when `build.equipment` is non-null but equipment
   catalog views are omitted, or should validation require an explicit option to enforce equipment?
4. Which base armor-rating facts, if any, can be safely represented without a reviewed source-derived
   armor catalog?
5. Should unmet weapon requirements be `warning` because the weapon can still be equipped, or `error`
   because the authored build does not satisfy intended use?
6. Should weapon requirement checks consider all four weapon sets equally, or only expose per-set
   facts for EPIC-14 to decide active-set policy?
7. Do unresolved modifiers need an authored slot hint, or is a label/reason placeholder enough until
   EPIC-17 semantic template workflows?
8. How should headgear and rune adjustments be combined for display: one helper returning only
   headgear adjustments plus caller-owned rune summaries, or one equipment helper that composes both
   when a rune catalog is supplied?
9. Which equipment issue codes should mark `complete: false` versus only `resolved: false` under the
   existing validation contract?