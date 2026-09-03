---
id: SPRINT-015
title: Equipment Editor
status: draft
source_target: BACKLOG
source_epic: EPIC-14
source_epic_path: work/tickets/14-equipment-editor/EPIC.md
tickets:
  - BW-1401
  - BW-1402
  - BW-1403
  - BW-1404
  - BW-1405
  - BW-1406
  - BW-1407
  - BW-1408
created: 2026-09-03
updated: 2026-09-03
---

# Sprint 015: Equipment Editor

## Overview

This sprint turns `EPIC-14 Equipment Editor` into the first user-facing semantic equipment editor
inside the existing single-character Build Wars app. Users should be able to configure armor runes,
insignias, headgear attribute bonuses, four weapon sets, weapons, weapon modifiers, and requirement
facts using the EPIC-13 semantic loadout and the promoted EPIC-10, EPIC-11, and EPIC-12 catalogs.

This is primarily an app-integration sprint. EPIC-13 already owns the framework-neutral
`EquipmentLoadout`, fixed topology, semantic selection states, equipment validation, rank-adjustment
helpers, and weapon-set analysis. SPRINT-015 should reuse those contracts and modify `src/domain`
only for narrow defects or export gaps discovered while wiring the app. Runtime generated catalog
imports remain isolated to `src/app/catalogs.ts`; authored builds store semantic IDs and unresolved
placeholders, never generated catalog records.

The sprint owns app catalog adaptation, editor actions/selectors, a keyboard-accessible equipment
surface, searchable equipment pickers, armor controls, weapon-set controls, concise equipment
display, simple stat summaries, inline validation, local persistence, backup/restore, share/export
omission messaging, documentation, ticket records, ledger sync, and result manifests.

The sprint does not add raw Guild Wars equipment-template import/export, exact semantic replay from
equipment template codes, armor skins, weapon skins, dyes, color IDs, inventory identity,
acquisition facts, runtime remote icons, equipment recommendations, DPS/combat simulation, party
equipment, guide content, backend sync, hosted sharing, short links, search workers, dynamic catalog
loading, or full stat aggregation.

Binding planning defaults:

1. `Build.equipment` stays `null` until the first explicit equipment edit. The panel must not create
   equipment state merely by rendering.
2. The first equipment mutation initializes `createEmptyEquipmentLoadout()`. Ordinary clear actions
   leave an empty canonical loadout; an explicit reset action returns the build to `equipment: null`.
3. UI actions update only the requested semantic field. They do not silently delete conflicting
   selections; selectors and validation expose conflicts and provide clear controls.
4. Equipment catalog adaptation may fail independently of core profession/attribute and skill
   catalogs. A failed equipment catalog should disable equipment pickers and show an equipment
   catalog-error state without taking down the existing skill editor.
5. Equipment validation issues do not by themselves block skill-template share/export paths, because
   those paths cannot represent equipment. The UI must warn when equipment will be omitted.
6. No active weapon-set policy is introduced. Validation and display operate on all authored weapon
   sets, with per-set requirement notes.

## Use Cases

1. **Keep editing skills first**: a user with no equipment continues using profession, attribute,
   skill, template, library, share, backup, and restore workflows exactly as before.
2. **Discover equipment in context**: a user finds equipment editing in the existing editor without
   navigating to a new route or losing sight of the current build.
3. **Start equipment intentionally**: a user opens the equipment surface and makes the first armor
   or weapon edit, causing the build to receive a canonical empty loadout plus that edit.
4. **Configure armor upgrades**: a user assigns and clears one rune and one insignia per armor slot,
   plus a headgear attribute bonus on the head slot.
5. **Preserve unresolved armor**: stale or unresolved rune, insignia, or headgear selections remain
   visible after validation, save/load, backup/restore, and further edits.
6. **Configure weapon sets**: a user models empty sets, main-hand/off-hand sets, partial sets, and
   two-handed sets across four fixed weapon-set rows.
7. **Manage weapon modifiers**: a user adds, replaces, and clears compatible modifier selections
   while duplicate occupied slots and incompatible modifiers remain explainable.
8. **Understand simple effects**: a user sees health delta, energy delta, headgear/rune rank
   effects, armor notes, requirement notes, modifier notes, and unresolved states without the app
   pretending to simulate combat.
9. **See validation where it matters**: equipment issues appear in the global validation panel and
   near the relevant armor slot, weapon set, hand, modifier, or requirement control.
10. **Persist local equipment**: working drafts, saved records, backup JSON, restore previews, and
    restored records preserve bounded semantic equipment state.
11. **Share honestly**: skill-template exports and share URLs keep working, stay capped at 1,800
    characters, exclude equipment, and clearly warn when the current build has omitted equipment.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| App catalogs | Static runtime imports for promoted rune, insignia, weapon, and weapon-modifier catalog JSON in `src/app/catalogs.ts`; app-owned projections, validation views, versions, attribution additions, deterministic option records, placeholder icon descriptors, and partial equipment catalog-error state. | Generated imports in leaf components or `src/domain`, manifest/QA/source-plan imports, raw snapshots, Python tooling, wiki APIs, remote media rendering, dynamic loading, search workers, new ingestion work. |
| Editor state | Deterministic equipment actions that initialize, update, clear, and reset semantic loadout state for five armor slots and four weapon sets. | Raw equipment-template state, drag/drop-first equipment editing, inventory item identity, cosmetic fields, automatic destructive normalization of conflicting state. |
| Selectors | Validation input with optional equipment catalogs, equipment option filtering, issue grouping, display view models, simple stat summaries, equipment-aware attribute rank context, share/export omission state. | Generated record exposure to components, component-owned catalog filtering, full stat aggregation, active-set policy, recommendation ranking. |
| UI components | One equipment editor surface in the existing app layout, fixed armor controls, four weapon-set controls, searchable pickers, inline validation, empty/unresolved/catalog-error states, responsive behavior, placeholder icons. | New route, party equipment UI, mannequin/portrait rendering, runtime remote icons, equipment template import/export UI, guide prose. |
| Persistence | Local-library schema support for bounded canonical `EquipmentLoadout`, clone/serialize/parse/hydrate behavior, backup/restore preservation, catalog freshness facts, invalid payload diagnostics. | Hosted storage, IndexedDB, service worker persistence, backend sync, short links, accepting malformed or dangerous equipment payloads. |
| Sharing | Existing skill-template import/export and share URL grammar, plus warnings when semantic equipment cannot be represented. | Equipment encoded in `#bw=1` URLs, Guild Wars equipment-template export/import, party/team template formats, JSON single-build exchange. |
| Domain | Reference existing EPIC-13 helpers and tests; apply only narrow fixes if app wiring exposes a confirmed domain defect. | New app dependencies in `src/domain`, duplicated rune/insignia/weapon logic, new equipment schema version, source-derived armor catalog. |

### Layer Ownership

`src/app/catalogs.ts` is the only runtime generated-catalog boundary. It should import and validate:

- `data/generated/epic-10/runes.catalog.json`
- `data/generated/epic-11/insignias.catalog.json`
- `data/generated/epic-12/weapons.catalog.json`
- `data/generated/epic-12/weapon-mods.catalog.json`

The adapted app surface should expose an `equipment` catalog view that is either ready or failed:

```text
AppEquipmentCatalogViews
  status: ready
  runes: AppEquipmentOption<RuneId>[]
  insignias: AppEquipmentOption<InsigniaId>[]
  weapons: AppEquipmentOption<WeaponId>[]
  weaponModifiers: AppEquipmentOption<WeaponModifierId>[]
  validation: EquipmentValidationCatalogs
  versions: rune/insignia/weapon/modifier/catalog-set facts
  placeholders: icon descriptor factories

AppEquipmentCatalogViews
  status: error
  issues: string[]
```

Leaf components receive only app-owned option/display records, domain selection values, validation
issues, and placeholder descriptors. They must not import generated JSON, generated manifests, QA
reports, source snapshots, Python tooling, wiki APIs, `remoteMedia` URLs, or source-authored prose.

`src/app/editor-state.ts` owns semantic equipment mutations. It should add explicit actions for:

- resetting all equipment to `null`
- setting or clearing armor rune selections
- setting or clearing armor insignia selections
- setting or clearing headgear attribute selection
- setting or clearing main-hand and off-hand weapon selections
- adding, replacing, and removing weapon modifiers by hand and modifier index
- setting or clearing authored requirement fallback fields only where the catalog requirement is
  unresolved

Actions should use `ARMOR_SLOTS`, `WEAPON_SET_SLOTS`, and EPIC-13 constructors. Invalid slot, set,
hand, or modifier indexes are typed no-ops. Changing profession, mode, attributes, skills, template
fields, or library metadata does not clear equipment.

`src/app/editor-selectors.ts` owns app-level interpretation:

- `selectValidationInput` passes equipment validation views only when equipment catalogs are ready.
- Attribute editor and skill tooltip rank context include valid equipment rank adjustments from
  `collectEquipmentAttributeRankAdjustments`.
- Equipment selectors group validation issues by `armor-piece`, `weapon-set`, `weapon-hand`, and
  `weapon-modifier` locations.
- Option selectors perform deterministic filtering and sorting before data reaches components.
- Display selectors produce simple stat summaries and note-only facts without requiring components
  to understand generated catalog schemas.
- Template/share selectors expose `hasSemanticEquipment` and equipment omission warnings separately
  from skill-template export-blocking reasons.

### UI Surface

Use a single `EquipmentPanel` integrated into `App.tsx` without a new route. Default placement is in
the main editor column below `SkillBar` and above `SkillBrowser`, implemented as an accessible
disclosure whose summary is always visible. If that placement proves cramped during execution, move
only the shell placement while preserving one in-page surface and documenting the reason.

The panel should render these states:

- `equipment: null`: concise empty state plus a user action that starts editing
- empty canonical loadout: five empty armor rows and four empty weapon-set rows
- non-empty loadout: editable controls plus summaries
- unresolved selections: retained rows with clear labels and clear actions
- equipment catalog error: controls disabled or degraded, current semantic IDs still visible
- validation issues: inline issue lists near affected controls plus global panel entries

Searchable pickers should use existing React and CSS only. No picker dependency is planned. The
control can be a combobox/listbox style component or an equivalent accessible search/select control,
but it must support direct text search, arrow-key movement, Enter selection, Escape close, clearing,
empty results, no-result messages, retained selected unresolved values, and deterministic ordering.

### Option Filtering Policy

Default option lists should prefer choices that are known to be usable in the current context:

- runes by selected primary profession when eligibility is `profession-armor`
- insignias by mode, selected primary profession when profession-specific, and armor slot
- weapons by mode and hand/equip role when resolved
- modifiers by mode, selected weapon family, applicable weapon families, occupied modifier slot,
  and EPIC-12 compatibility helper output
- headgear attributes by selected primary profession attributes

Filtering must never delete existing authored state. If the current selection is stale, unresolved,
incompatible, or filtered out by a new profession/mode/weapon choice, it remains visible as the
current selection with validation or unresolved messaging and a clear action.

### Stat Summary Policy

Simple summaries are allowed only when the result is explainable from selected records:

- health and energy deltas from unconditional numeric rune/insignia effects with clear combination
  rules
- headgear and attribute-rune rank effects from EPIC-13 helpers
- armor rating changes as per-slot notes unless the effect is unambiguously character-wide
- weapon requirements as per-set notes or warnings
- weapon and modifier effects as structured facts or notes
- unresolved, conditional, local-only, chance, mastery, unknown, and note-only facts as notes, not
  totals

The sprint must not introduce full health/energy/armor totals, hit-location behavior, condition
evaluation, duration math, damage math, DPS, chance aggregation, party synergy, or recommendation
scoring.

### Persistence And Sharing Boundary

Durable app data should accept only schema-version-1, bounded, canonical `EquipmentLoadout` values
written by the app. It should preserve explicit unresolved selections and known semantic catalog IDs.
It should reject unsupported schema versions, dangerous keys, invalid discriminants, unsafe IDs,
noncanonical armor/weapon topology, over-limit modifier arrays, invalid requirement payloads, and
oversized strings. Domain validation can still diagnose malformed in-memory test data; local
persistence does not need to recover hostile malformed equipment.

`PersistedCatalogFacts` should grow nullable equipment catalog version and weapon catalog-set facts.
Freshness messaging should compare those facts separately from validity. Missing equipment catalog
facts remain `unknown`, not stale.

Skill-template export and share URL construction stay skill-template-first. The URL grammar remains
`#bw=1&code=<bare-skill-template-code>&mode=<optional-mode>`, capped at 1,800 characters. Equipment
is not encoded. Share and export views should warn when equipment is present and will be omitted,
while preserving exact-source and canonical skill-template export behavior.

## Implementation

### Phase 1: BW-1401 App Catalog Boundary, State, And Selector Foundation (~18%)

**Files:**

- `src/app/catalogs.ts`
- `src/app/catalogs.test.ts`
- `src/app/catalog-boundary.test.ts`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/domain/equipment.ts` - reference only
- `src/domain/equipment-attribute-rank.ts` - reference only
- `src/domain/weapon-set.ts` - reference only
- `test/fixtures/rule-engine/equipment-catalogs.ts` - reference for app test inputs if useful

**Tasks:**

- [ ] Mark BW-1401 and SPRINT-015 in progress before implementation.
- [ ] Extend `APPROVED_RUNTIME_CATALOG_IMPORTS` and `loadAppCatalogs()` to include the four
      promoted equipment runtime JSON files.
- [ ] Add equipment catalog validation that checks profile IDs, schema versions, catalog versions,
      expected record arrays, source-set facts, weapon catalog-set version/digest, and counterpart
      consistency.
- [ ] Represent equipment catalog adaptation as a partial app state so core skill editing remains
      ready when only equipment catalog adaptation fails.
- [ ] Add app-owned equipment option/display types with stable labels, normalized search keys,
      semantic IDs, icon placeholders, mode/profession/slot/family facts needed by selectors, and no
      generated record exposure to components.
- [ ] Add equipment validation catalog views using EPIC-13 shapes:
      `records: runeCatalog.runes`, `records: insigniaCatalog.insignias`,
      `records: weaponCatalog.weaponBases`, and `records: weaponModCatalog.weaponMods`.
- [ ] Extend catalog versions, attribution, and placeholder descriptor factories for equipment
      without rendering remote media URLs.
- [ ] Add editor reducer actions for armor, weapon, modifier, requirement, and reset-equipment
      updates. First edit must initialize `createEmptyEquipmentLoadout()`.
- [ ] Keep invalid action indexes as no-ops and preserve unrelated build, raw-template, browser,
      dialog, tooltip, drag, keyboard, and transient state.
- [ ] Update `selectValidationInput()` to include equipment catalogs only when ready.
- [ ] Add selector primitives for `hasSemanticEquipment`, equipment issue grouping, equipment rank
      adjustment summaries, and retained unresolved selected values.
- [ ] Update skill tooltip and attribute-display rank calculations to pass equipment-generated
      adjustments when they are resolved.
- [ ] Add import-boundary scans proving leaf app components and `src/domain` do not import
      equipment generated JSON, manifests, QA reports, snapshots, or Python tooling.
- [ ] Mark BW-1401 done only after focused catalog, reducer, and selector tests pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/catalogs.test.ts src/app/catalog-boundary.test.ts src/app/editor-state.test.ts src/app/editor-selectors.test.ts
rg -n "data/generated/epic-(10|11|12)" src/app src/domain -g '!src/app/catalogs.ts'
rg -n "data/qa|source-snapshots|scripts/data|api\\.php" src/app src/domain
rg -n "remoteMedia|wikiUrl" src/app/components src/app/*.tsx
```

### Phase 2: BW-1402 Equipment Panel Shell And Layout (~12%)

**Files:**

- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/components/EquipmentPanel.tsx` - create
- `src/app/components/ValidationPanel.tsx`
- `src/app/styles.css`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`

**Tasks:**

- [ ] Begin BW-1402 only after Phase 1 passes.
- [ ] Add `EquipmentPanel` to the existing editor layout without a new route.
- [ ] Use an accessible disclosure or equivalent in-page shell whose summary remains visible and
      whose expanded content does not initialize equipment by render side effect.
- [ ] Render null, empty loadout, non-empty loadout, unresolved selection, and equipment
      catalog-error states.
- [ ] Pass only app-owned views, domain selections, validation slices, and dispatch actions to the
      panel.
- [ ] Preserve skill bar and skill browser workflows; any layout movement must be limited and
      documented.
- [ ] Add responsive CSS for desktop and narrow viewports using existing `editor-panel`,
      `panel-heading`, focus, spacing, and color conventions.
- [ ] Update `ValidationPanel` catalog/version messaging to include equipment facts when present
      without crowding current validation flags.
- [ ] Test panel visibility, null state, empty state, catalog-error state, disclosure behavior,
      keyboard focus behavior, and narrow-layout class behavior.
- [ ] Mark BW-1402 done only after the shell is usable and existing app tests remain compatible.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/App.test.tsx src/app/editor-selectors.test.ts
```

### Phase 3: BW-1403 Searchable Equipment Pickers (~13%)

**Files:**

- `src/app/components/EquipmentPicker.tsx` - create
- `src/app/components/EquipmentPanel.tsx`
- `src/app/equipment-picker.test.tsx` - create
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/styles.css`

**Tasks:**

- [ ] Begin BW-1403 only after Phases 1 and 2 pass.
- [ ] Add a reusable searchable picker for runes, insignias, weapons, weapon modifiers, and
      headgear attributes using existing React/CSS only.
- [ ] Support typing, deterministic result filtering, keyboard navigation, pointer selection,
      clearing, Escape close, retained current value, empty catalog, no-result, unsupported, and
      unresolved states.
- [ ] Add selector-owned option filters for profession, mode, armor slot, weapon hand, weapon
      family, occupied modifier slot, and modifier compatibility where current catalog facts support
      them.
- [ ] Ensure selected stale or incompatible values remain visible even when they are not in the
      current filtered option set.
- [ ] Render placeholder icon descriptors or text/icon surfaces only; do not fetch or render remote
      media.
- [ ] Keep generated catalog records behind app selectors. Picker props should be small app-owned
      option records.
- [ ] Test search, sorting, selected-value retention, clearing, no-result state, catalog-error
      degradation, keyboard movement, Enter selection, Escape close, and disabled behavior.
- [ ] Mark BW-1403 done only after the picker is reusable by armor and weapon controls.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/equipment-picker.test.tsx src/app/editor-selectors.test.ts
```

### Phase 4: BW-1404 Armor Controls (~13%)

**Files:**

- `src/app/components/ArmorEquipmentEditor.tsx` - create
- `src/app/components/EquipmentPanel.tsx`
- `src/app/armor-equipment-editor.test.tsx` - create
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/components/AttributeEditor.tsx`
- `src/app/styles.css`
- `test/domain/armor-equipment.test.ts` - regression reference
- `test/domain/equipment-validation.test.ts` - regression reference

**Tasks:**

- [ ] Begin BW-1404 only after picker behavior is available.
- [ ] Render exactly five armor rows for `head`, `chest`, `hands`, `legs`, and `feet` from the
      canonical loadout shape.
- [ ] Let each armor row select and clear one rune and one insignia.
- [ ] Let only the head row select and clear a headgear attribute bonus.
- [ ] Show concise row summaries, selected placeholders, unresolved/stale labels, clear actions,
      and inline validation issues.
- [ ] Filter rune and insignia options by selected primary profession, mode, and slot where facts
      are resolved; retained invalid selections remain visible.
- [ ] Filter headgear attributes to selected primary-profession attributes; unresolved primary
      profession should show an explicit disabled or unresolved state.
- [ ] Preserve armor state across unrelated skill, attribute, profession, mode, template, and
      weapon edits. Profession and mode changes should update filtering and validation, not erase
      selections.
- [ ] Feed valid headgear and rune rank adjustments into attribute display and skill tooltip rank
      contexts.
- [ ] Avoid armor skin, dye, color, inventory, base armor catalog, and acquisition controls.
- [ ] Test first-edit initialization, all armor slot edits, clearing, reset behavior, headgear
      restriction, unresolved selections, invalid retained selections, inline issues, and attribute
      rank display effects.
- [ ] Mark BW-1404 done only after armor controls and rank handoff pass focused tests.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/armor-equipment-editor.test.tsx src/app/editor-state.test.ts src/app/editor-selectors.test.ts
npm run test:run -- test/domain/armor-equipment.test.ts test/domain/equipment-validation.test.ts
```

### Phase 5: BW-1405 Weapon Set Controls (~15%)

**Files:**

- `src/app/components/WeaponSetEditor.tsx` - create
- `src/app/components/EquipmentPanel.tsx`
- `src/app/weapon-set-editor.test.tsx` - create
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/styles.css`
- `test/domain/weapon-set.test.ts` - regression reference
- `test/domain/weapon-mod-compatibility.test.ts` - regression reference
- `test/domain/equipment-validation.test.ts` - regression reference

**Tasks:**

- [ ] Begin BW-1405 only after shared picker behavior is stable.
- [ ] Render four weapon-set rows for `set-1` through `set-4`.
- [ ] Represent empty hands, main-hand-only, off-hand-only, paired, two-handed, conflict, and
      unresolved occupancy states.
- [ ] Let users select and clear main-hand and off-hand weapons without storing copied weapon
      records.
- [ ] Let users add, replace, and remove modifier selections for each selected hand with bounded
      indexes and deterministic state updates.
- [ ] Filter weapons by mode, hand, equip role, and handedness where resolved.
- [ ] Filter modifiers by selected weapon, mode, occupied slot, applicability, and
      `explainWeaponModCompatibility` results where resolved.
- [ ] Surface two-handed/off-hand conflicts, wrong-hand weapons, unresolved weapons, modifiers
      without weapons, incompatible modifiers, duplicate occupied modifier slots, and catalog-set
      mismatch near the relevant controls.
- [ ] Support authored requirement fallback controls only for catalog-unresolved requirement facts;
      catalog-resolved requirements are displayed as facts and warnings.
- [ ] Preserve partial and invalid loaded state rather than auto-moving or auto-deleting selections.
- [ ] Avoid DPS, attack timing, weapon recommendations, drag/drop-first editing, unique item
      identity, skin, dye/color, and acquisition controls.
- [ ] Test weapon selection, clearing, partial sets, two-handed conflicts, off-hand-only state,
      modifier compatibility, duplicate modifier slots, requirement notes, unresolved selections,
      catalog-set mismatch, and first-edit initialization.
- [ ] Mark BW-1405 done only after weapon controls pass focused app and domain regression tests.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/weapon-set-editor.test.tsx src/app/editor-state.test.ts src/app/editor-selectors.test.ts
npm run test:run -- test/domain/weapon-set.test.ts test/domain/weapon-mod-compatibility.test.ts test/domain/equipment-validation.test.ts
```

### Phase 6: BW-1406 Equipment Display And Simple Stats (~10%)

**Files:**

- `src/app/components/EquipmentSummary.tsx` - create or fold into `EquipmentPanel.tsx`
- `src/app/equipment-summary.test.tsx` - create
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/components/SkillTooltip.tsx` - reference or narrow update
- `src/app/components/SkillDisplay.tsx` - reference only
- `src/app/styles.css`
- `test/domain/rune-effects.test.ts` - regression reference
- `test/domain/insignia-effects.test.ts` - regression reference
- `test/domain/weapon-set.test.ts` - regression reference

**Tasks:**

- [ ] Begin BW-1406 after armor and weapon controls can produce meaningful state.
- [ ] Add selector-owned equipment summary views for armor rows, weapon sets, selected upgrades,
      unresolved state, requirement state, and placeholder descriptors.
- [ ] Show explainable health delta, energy delta, headgear/rune rank effects, armor notes,
      requirement notes, modifier notes, and unresolved/catalog-error notes.
- [ ] Count only unconditional numeric facts with safe combination rules in totals.
- [ ] Keep conditional, local-only, chance, mastery, unknown, and note-only facts as notes.
- [ ] Ensure summaries are consistent between row displays, panel summary, validation messaging, and
      tooltip/detail surfaces.
- [ ] Use Build Wars-authored concise labels derived from structured facts; do not copy source
      prose or render wiki URLs as effect text.
- [ ] Test stat summaries, no-total note handling, unresolved state, conditional/note-only facts,
      placeholder displays, and equipment-aware skill tooltip rank assumptions.
- [ ] Mark BW-1406 done only after display outputs remain explainable and bounded.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/equipment-summary.test.tsx src/app/editor-selectors.test.ts
npm run test:run -- test/domain/rune-effects.test.ts test/domain/insignia-effects.test.ts test/domain/weapon-set.test.ts
```

### Phase 7: BW-1407 Validation, Persistence, Backup/Restore, And Sharing (~14%)

**Files:**

- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/local-storage.ts`
- `src/app/local-storage.test.ts`
- `src/app/library-fixtures.ts`
- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/share-url.ts`
- `src/app/share-url.test.ts`
- `src/app/components/ShareControls.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/components/ValidationPanel.tsx`
- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Begin BW-1407 only after user-facing equipment controls and summaries exist.
- [ ] Add a bounded persistence validator for canonical `EquipmentLoadout` schema version 1,
      semantic known selections, unresolved selections, weapon hands, modifiers, and authored
      requirement fallback values.
- [ ] Preserve old `equipment: null` records and backups without migration prompts.
- [ ] Replace the deliberate `unsupported-equipment` rejection for valid non-null semantic
      equipment.
- [ ] Reject dangerous keys, unsupported equipment schema versions, invalid discriminants, unsafe
      IDs, negative candidate IDs, invalid slots, noncanonical topology, oversized modifier arrays,
      invalid requirement payloads, and oversized unresolved labels/reasons.
- [ ] Clone equipment deeply in persisted snapshots and hydrated editor state instead of collapsing
      non-null equipment back to `null`.
- [ ] Extend saved-with catalog facts and freshness comparisons with nullable rune, insignia,
      weapon, weapon-modifier, and weapon catalog-set facts.
- [ ] Ensure autosave, explicit save, update, duplicate, load, dirty checking, fingerprinting,
      backup export, backup parse, restore preview, merge, replace, and optional draft restore all
      preserve valid equipment.
- [ ] Surface equipment validation issues inline and through `ValidationPanel`.
- [ ] Adjust template export policy so equipment-only validation errors do not block skill-template
      exact-source or canonical export. Preserve blocking for skill-template field errors.
- [ ] Add share/export warnings when `hasSemanticEquipment` is true and the chosen path omits
      equipment.
- [ ] Confirm share URLs do not grow new equipment parameters and remain capped at 1,800 characters.
- [ ] Confirm skill-template import replaces the current draft according to existing dirty-guard
      behavior and results in `equipment: null`.
- [ ] Test persistence, hydration, autosave, saved records, backup/restore, freshness, malformed
      payload rejection, share warnings, export warnings, import behavior, and current skill-only
      compatibility.
- [ ] Mark BW-1407 done only after local durability and sharing boundaries pass focused tests.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/persistence-schema.test.ts src/app/backup-restore.test.ts src/app/local-storage.test.ts src/app/workspace-state.test.ts src/app/library-selectors.test.ts
npm run test:run -- src/app/template-workflow.test.ts src/app/share-url.test.ts src/app/App.test.tsx
```

### Phase 8: BW-1408 Accessibility, Responsive Polish, Docs, And Closeout (~5%)

**Files:**

- `README.md`
- `compendium/equipment-shell.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/game-rule-engine.md`
- `compendium/runes-catalog.md`
- `compendium/insignias-catalog.md`
- `compendium/weapons-and-mods-catalog.md`
- `compendium/README.md`
- `work/tickets/14-equipment-editor/*.md`
- `work/sprints/SPRINT-015.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-14-result.json`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/execute-SPRINT-015-result.json`

**Tasks:**

- [ ] Begin closeout only after all focused app, persistence, share, and domain regression gates
      pass.
- [ ] Verify keyboard operation, focus order, labels, disclosure state, picker navigation, clear
      actions, inline issues, validation panel entries, live-region messages, and modal interactions.
- [ ] Verify narrow viewport behavior through component tests and manual/screenshot inspection if a
      dev server is used during execution.
- [ ] Run import-boundary scans for prohibited generated/source/runtime imports outside
      `src/app/catalogs.ts`.
- [ ] Update README and compendium notes with implemented equipment editor scope, null-versus-empty
      behavior, local persistence support, share omission policy, simple stat boundaries, catalog
      boundaries, and deferred work.
- [ ] Update BW-1401 through BW-1408, EPIC-14, SPRINT-015, the ledger, and result manifests so they
      agree on final status and verification evidence.
- [ ] Run `npm run verify`.
- [ ] Inspect `git status --short` and do not create a commit.
- [ ] Mark BW-1408 and SPRINT-015 complete only after canonical verification passes or record a
      precise blocker.

**Verification:**

```sh
rg -n "data/generated/epic-(10|11|12)" src/app src/domain -g '!src/app/catalogs.ts'
rg -n "data/qa|source-snapshots|scripts/data|api\\.php" src/app src/domain
rg -n "remoteMedia|wikiUrl" src/app/components src/app/*.tsx
rg -n "TemplateEquipment(Item|Modifier|Color|Slot)Id|skin|dye|colorId|inventory|acquisition" src/app/components/Equipment*.tsx src/app/components/ArmorEquipmentEditor.tsx src/app/components/WeaponSetEditor.tsx src/app/editor-state.ts src/app/editor-selectors.ts src/app/persistence-schema.ts src/domain/equipment.ts
npm run verify
git status --short
```

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/app/catalogs.ts` | Modify | Import/adapt equipment catalogs, expose partial equipment catalog state, validation views, versions, attribution, options, and placeholders. |
| `src/app/catalogs.test.ts` | Modify | Verify equipment catalog adaptation, partial failure behavior, versions, and validation-view shapes. |
| `src/app/catalog-boundary.test.ts` | Modify | Enforce runtime generated-catalog import boundaries and metadata-only media behavior. |
| `src/app/editor-state.ts` | Modify | Add deterministic equipment update/reset actions and first-edit loadout initialization. |
| `src/app/editor-state.test.ts` | Modify | Cover armor, weapon, modifier, requirement, null/empty, clear, reset, and invalid-index reducer behavior. |
| `src/app/editor-selectors.ts` | Modify | Add equipment validation input, option filtering, issue grouping, summaries, rank adjustments, freshness inputs, and share omission selectors. |
| `src/app/editor-selectors.test.ts` | Modify | Cover option filtering, retained unresolved selections, validation input, rank handoff, summaries, and omission warnings. |
| `src/app/App.tsx` | Modify | Mount the equipment editor in the existing app layout without a new route. |
| `src/app/App.test.tsx` | Modify | Verify equipment panel integration, compatibility with existing workflows, and share/export warning surfaces. |
| `src/app/components/EquipmentPanel.tsx` | Create | Own the equipment editor shell, disclosure, null/empty/catalog-error states, composition, and reset action. |
| `src/app/components/EquipmentPicker.tsx` | Create | Provide the reusable searchable equipment picker. |
| `src/app/components/ArmorEquipmentEditor.tsx` | Create | Render five armor slots with rune, insignia, headgear, inline issue, and clear controls. |
| `src/app/components/WeaponSetEditor.tsx` | Create | Render four weapon sets with hand, weapon, modifier, requirement, occupancy, and inline issue controls. |
| `src/app/components/EquipmentSummary.tsx` | Create or fold in | Show selected equipment and simple stat/note summaries. |
| `src/app/equipment-picker.test.tsx` | Create | Cover picker search, keyboard, clearing, retained values, no-result, and disabled states. |
| `src/app/armor-equipment-editor.test.tsx` | Create | Cover armor row behavior, picker integration, first-edit initialization, and inline issues. |
| `src/app/weapon-set-editor.test.tsx` | Create | Cover weapon-set behavior, modifier editing, requirements, conflicts, and unresolved state. |
| `src/app/equipment-summary.test.tsx` | Create | Cover simple stat summaries, notes, unresolved facts, and placeholder display. |
| `src/app/components/AttributeEditor.tsx` | Modify narrowly | Display equipment-aware effective ranks if selector outputs require component changes. |
| `src/app/components/SkillTooltip.tsx` | Reference or narrow modify | Preserve tooltip rendering while consuming equipment-aware rank context. |
| `src/app/components/SkillDisplay.tsx` | Reference only | Keep shared skill display behavior compatible. |
| `src/app/components/ValidationPanel.tsx` | Modify | Include equipment catalog facts and global equipment issues without changing result semantics. |
| `src/app/components/ShareControls.tsx` | Modify | Warn when semantic equipment is omitted from share URLs. |
| `src/app/components/TemplateDialogs.tsx` | Modify | Warn when semantic equipment is omitted from skill-template exports. |
| `src/app/template-workflow.ts` | Modify | Keep skill-template export blocking scoped to skill-template representability and non-equipment validation errors. |
| `src/app/template-workflow.test.ts` | Modify | Cover equipment omission warning inputs and equipment errors not blocking skill-only export. |
| `src/app/share-url.ts` | Reference or narrow modify | Preserve current URL grammar and 1,800 character cap. |
| `src/app/share-url.test.ts` | Modify | Prove no equipment parameters are parsed or emitted. |
| `src/app/persistence-schema.ts` | Modify | Validate, clone, serialize, parse, and hydrate bounded semantic equipment; extend catalog facts. |
| `src/app/persistence-schema.test.ts` | Modify | Cover valid equipment, old null records, unresolved selections, malformed rejection, dangerous keys, and clone behavior. |
| `src/app/backup-restore.ts` | Modify narrowly | Preserve equipment through backup/restore using the updated persistence validator. |
| `src/app/backup-restore.test.ts` | Modify | Cover equipment backup export, parse, restore preview/apply, skipped invalid records, and draft restore. |
| `src/app/local-storage.ts` | Reference or narrow modify | Preserve autosave/write-blocked behavior with non-null equipment. |
| `src/app/local-storage.test.ts` | Modify | Cover local read/write behavior for equipment-bearing envelopes. |
| `src/app/workspace-state.ts` | Reference or narrow modify | Ensure dirty checks, load, duplicate, save, and replace flows preserve equipment snapshots. |
| `src/app/workspace-state.test.ts` | Modify | Cover workspace actions with equipment-bearing drafts and records. |
| `src/app/library-fixtures.ts` | Modify | Add semantic equipment fixture builders for app tests. |
| `src/app/library-selectors.ts` | Reference or narrow modify | Preserve library search/freshness behavior with equipment catalog facts. |
| `src/app/library-selectors.test.ts` | Modify | Cover freshness and search regressions for equipment-bearing records. |
| `src/app/styles.css` | Modify | Add accessible, responsive equipment panel, picker, armor row, weapon row, issue, and summary styles. |
| `src/domain/equipment.ts` | Reference only | Reuse EPIC-13 loadout constants, constructors, and selection types. |
| `src/domain/equipment-attribute-rank.ts` | Reference only | Reuse equipment rank adjustment summaries. |
| `src/domain/weapon-set.ts` | Reference only | Reuse weapon occupancy, compatibility, and requirement analysis. |
| `src/domain/rules/equipment.ts` | Reference only | Reuse domain validation issues and locations. |
| `src/domain/validation-context.ts` | Reference only | Reuse `EquipmentValidationCatalogs` and validatedAgainst equipment facts. |
| `test/domain/*equipment*` | Regression reference | Ensure app work does not weaken semantic equipment validation. |
| `test/domain/weapon-set.test.ts` | Regression reference | Ensure weapon-set analysis remains stable. |
| `test/domain/rune-effects.test.ts` | Regression reference | Ensure rune effect summaries remain stable. |
| `test/domain/insignia-effects.test.ts` | Regression reference | Ensure insignia per-slot projection remains stable. |
| `README.md` | Modify | Record completed equipment editor scope and deferred exclusions. |
| `compendium/equipment-shell.md` | Modify | Update EPIC-14 app handoff from deferred to implemented where appropriate. |
| `compendium/core-build-editor.md` | Modify | Document equipment panel, catalog boundary, and skill workflow compatibility. |
| `compendium/local-library-and-sharing.md` | Modify | Document non-null equipment persistence, backup/restore, and share omission policy. |
| `compendium/game-rule-engine.md` | Modify | Document app consumption of equipment validation and simple stat boundaries if needed. |
| `compendium/runes-catalog.md` | Modify | Update downstream EPIC-14 status and app usage. |
| `compendium/insignias-catalog.md` | Modify | Update downstream EPIC-14 status and app usage. |
| `compendium/weapons-and-mods-catalog.md` | Modify | Update downstream EPIC-14 status and app usage. |
| `compendium/README.md` | Modify | Keep compendium index current if new or renamed notes are added. |
| `work/tickets/14-equipment-editor/*.md` | Modify during execution | Track BW-1401 through BW-1408 status, assumptions, evidence, and closeout. |
| `work/sprints/SPRINT-015.md` | Create/update during planning/execution | Store the canonical sprint plan and execution checklist state. |
| `work/sprints/ledger.tsv` | Modify during execution | Track the SPRINT-015 lifecycle. |
| `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-14-result.json` | Create/update | Store the planning result manifest. |
| `work/runs/ticket-burn/BACKLOG/20260903T014346Z/execute-SPRINT-015-result.json` | Create/update | Store the execution result manifest if the ticket-burn executor runs the sprint. |

## Definition of Done

- [ ] BW-1401 through BW-1408 are completed in dependency order with status-consistent ticket,
      sprint, ledger, and result-manifest records.
- [ ] `src/app/catalogs.ts` imports and adapts promoted rune, insignia, weapon, and weapon-modifier
      catalogs while preserving the generated-catalog import boundary.
- [ ] Equipment catalog errors degrade only the equipment surface; the existing skill editor remains
      available when core profession/attribute and skill catalogs are ready.
- [ ] Leaf components receive app-owned option/display records and never import generated JSON,
      manifests, QA reports, source snapshots, Python tooling, wiki APIs, or remote media directly.
- [ ] Editor actions initialize, update, clear, and reset semantic equipment state for five armor
      slots and four weapon sets without mutating unrelated editor state.
- [ ] `equipment: null` remains valid for untouched builds, and first explicit equipment edit
      creates a canonical empty loadout plus the requested change.
- [ ] Armor controls support five fixed slots, rune selection, insignia selection, headgear
      attribute selection on head only, clear actions, unresolved state, and inline validation.
- [ ] Weapon controls support four fixed weapon sets, empty/partial/paired/two-handed states,
      weapon selection, modifier editing, requirement notes, unresolved state, and inline
      validation.
- [ ] Searchable pickers support keyboard navigation, direct text search, clearing, retained current
      selections, no-result states, disabled/catalog-error states, and deterministic ordering.
- [ ] Equipment validation issues are passed through `selectValidationInput`, shown globally, and
      grouped near relevant equipment controls.
- [ ] Attribute displays and skill tooltips use valid equipment rank adjustments where supported and
      report unresolved equipment rank effects conservatively.
- [ ] Simple equipment summaries show explainable health delta, energy delta, armor notes,
      headgear/rune effects, requirement notes, modifier notes, and unresolved state without full
      stat aggregation.
- [ ] Working-draft autosave, saved records, duplicate/load/update flows, backup export, restore
      preview/apply, and hydration preserve valid semantic equipment.
- [ ] Local persistence preserves old `equipment: null` records and rejects unsupported, unsafe,
      noncanonical, oversized, or malformed equipment payloads.
- [ ] Saved-with freshness facts include nullable equipment catalog versions and weapon catalog-set
      facts.
- [ ] Skill-template import/export and share URLs remain skill-template-first, omit equipment,
      preserve the 1,800 character URL cap, and warn when equipment will be omitted.
- [ ] Equipment-only validation errors do not block otherwise valid skill-template export/share
      paths.
- [ ] UI behavior is keyboard accessible, labeled, focus-visible, responsive, and does not crowd or
      regress existing skill/attribute workflows.
- [ ] Docs record implemented scope, null-versus-empty semantics, catalog boundaries, persistence
      behavior, share omission policy, simple stat limits, and deferred work.
- [ ] No armor skins, weapon skins, dyes, color IDs, inventory identity, acquisition facts, raw
      equipment-template import/export, runtime remote icons, recommendations, party equipment, or
      full stat/combat simulation are introduced.
- [ ] Focused phase gates pass and final `npm run verify` passes.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Equipment catalog adaptation failure takes down the whole app. | Medium | High | Model equipment catalog readiness separately from core catalog readiness and test partial failure states. |
| Generated equipment records leak into component props or persisted builds. | Medium | High | Use app-owned option/display records, semantic selection IDs, clone tests, and import-boundary scans. |
| First render creates non-null equipment and changes old autosave behavior. | Medium | High | Initialize equipment only inside explicit reducer actions and test untouched draft fingerprints. |
| Reducer actions silently delete incompatible user selections. | Medium | Medium | Keep actions field-scoped; expose conflicts through selectors and validation with explicit clear controls. |
| Picker filtering hides the current invalid/stale selection. | Medium | High | Always retain the current authored selection as a visible selected value outside the filtered option set. |
| UI grows too large for the existing editor layout. | High | Medium | Use an accessible disclosure, existing panel patterns, responsive stacking, and phase-gated layout tests. |
| Equipment rank adjustments change skill tooltip assumptions incorrectly. | Medium | High | Route rank changes through EPIC-13 helpers and regression-test unresolved adjustment behavior. |
| Simple stats drift into EPIC-21 full aggregation. | Medium | High | Count only unconditional, source-structured, safe-combination facts and render all other effects as notes. |
| Weapon requirement policy appears to imply an active weapon set. | Medium | Medium | Show requirement notes per authored set and avoid active-set UI/state in this sprint. |
| Equipment validation errors accidentally block skill-template sharing. | Medium | High | Split omission warnings from skill-template export blockers and test equipment-only error cases. |
| Persistence accepts hostile or malformed equipment JSON. | Medium | High | Reuse dangerous-key checks, enforce canonical topology, bound arrays/strings, and reject invalid discriminants. |
| Backup/restore skips whole libraries because one equipment record is invalid. | Medium | Medium | Preserve existing per-record skipped diagnostics and test merge/replace behavior with mixed valid/invalid records. |
| Catalog freshness facts become noisy or required for old records. | Medium | Medium | Make equipment facts nullable and compare missing values as unknown rather than stale. |
| Raw equipment-template scope sneaks into the MVP editor. | Medium | High | Keep EPIC-17 handoff explicit and scan for raw template item/modifier/color field usage in app-authored state. |
| Runtime icon metadata is mistaken for approved image rendering. | Low | Medium | Use only placeholder descriptors and assert no remote media URL rendering or fetch paths are introduced. |
| New UI tests become brittle because they assert layout details too tightly. | Medium | Medium | Assert behaviors, labels, states, and class-level responsive hooks rather than pixel-perfect layout. |

## Security

- Treat localStorage envelopes, backup JSON, restored records, semantic equipment selections,
  unresolved labels/reasons, catalog IDs, modifier arrays, authored requirements, and catalog views
  as untrusted input.
- Preserve the existing dangerous-key rejection for `__proto__`, `constructor`, and `prototype`
  before hydrating equipment-bearing data.
- Accept only bounded schema-version-1 equipment payloads with canonical armor slots, canonical
  weapon-set slots, valid discriminants, safe non-negative semantic IDs, bounded modifier arrays,
  and bounded unresolved strings.
- Reject malformed or unsupported persisted equipment records rather than coercing them into
  trusted editor state.
- Do not execute, interpret, or render catalog names, unresolved labels, notes, URLs, or effect text
  as HTML, CSS, code, shell input, source expressions, or fetch targets.
- Do not fetch wiki pages, manifests, QA reports, snapshots, icon bytes, thumbnails, or remote media
  from runtime app code.
- Keep source URLs and remote media metadata out of image, CSS background, preload, canvas, and
  network request paths.
- Keep `src/domain` framework-neutral and free of React, DOM/browser APIs, browser storage, network
  clients, app modules, generated JSON, manifests, QA reports, snapshots, Python tooling, wiki APIs,
  and template adapter imports.
- Keep picker search local, bounded, deterministic, and catalog-backed. No network search,
  source-provided query execution, or arbitrary expression parsing is introduced.
- Bound validation issue rendering and persistence diagnostics so hostile equipment payloads cannot
  create unbounded UI or storage work.
- No new npm or Python dependency is planned. Any dependency need should block for explicit review.

## Dependencies

- `EPIC-03` / `SPRINT-004`: promoted profession/attribute IDs, primary-profession attribute facts,
  rank-cost data, and app catalog precedent.
- `EPIC-04` / `SPRINT-005`: promoted skill catalog, skill display, progression, and template
  projection facts that must remain compatible.
- `EPIC-05` / `SPRINT-006`: skill-template import/export and raw equipment-template compatibility
  boundaries. SPRINT-015 must not replace raw equipment-template workflows.
- `EPIC-06` / `SPRINT-007`: `validateBuild`, `ValidationIssue`, `ValidationResult`,
  `calculateEffectiveAttributeRank`, rule ordering, and issue semantics.
- `EPIC-07` / `SPRINT-008`: prior-art notes for editor layout direction, without pixel-matching or
  mannequin requirements.
- `EPIC-08` / `SPRINT-009`: core build editor, app catalog boundary, reducer/selector/component
  patterns, validation presentation, and skill tooltip behavior.
- `EPIC-09` / `SPRINT-010`: local library, autosave, saved records, backup/restore, share URLs, and
  persistence security posture.
- `EPIC-10` / `SPRINT-011`: runtime rune catalog, `RuneId`, rune effects, attribution, and
  attribute-rune summaries.
- `EPIC-11` / `SPRINT-012`: runtime insignia catalog, `InsigniaId`, slot applicability, and
  insignia effect projection.
- `EPIC-12` / `SPRINT-013`: runtime weapon and modifier catalogs, release-set identity,
  `WeaponId`, `WeaponModifierId`, requirements, and modifier compatibility helper.
- `EPIC-13` / `SPRINT-014`: semantic equipment loadout, validation, rank adjustments, weapon-set
  analysis, and null-versus-empty semantics.
- Future `EPIC-15`: title ownership, title rank controls, and allegiance state remain separate from
  equipment.
- Future `EPIC-17`: raw equipment-template semantic import/export and exact replay polish.
- Future `EPIC-20`: broader search/tooltips and approved runtime icon/media behavior.
- Future `EPIC-21`: full stat/effect aggregation, condition evaluation, combat math, DPS, and
  cross-system analysis.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and the existing `npm run verify` toolchain.

## Open Questions

These should not block sprint execution unless implementation proves the default unsafe.

1. **Panel placement**: Should the equipment surface live in the main column, left column, or a
   tabbed area? Default: place a disclosure panel in the main column below `SkillBar` and above
   `SkillBrowser`; adjust only if phase tests show crowding.
2. **Persistence strictness**: Should local persistence accept bounded but noncanonical equipment for
   recovery? Default: accept only canonical app-written loadouts; let domain tests cover malformed
   in-memory validation.
3. **Picker filtering**: Should incompatible options be hidden or shown with warnings? Default:
   filter option lists to compatible choices where facts are resolved, but always retain and warn on
   the current authored selection.
4. **Share/export gating**: Should equipment validation errors block canonical skill-template
   export? Default: no; show equipment omission warnings separately and block only on
   skill-template-relevant errors or projection failures.
5. **Stat totals**: How much arithmetic is safe before EPIC-21? Default: total only unconditional
   numeric health/energy facts with clear combination rules and render everything else as notes.
6. **Weapon requirements**: Should requirements apply to all sets or only an active set? Default:
   no active-set state; display per-set requirement notes and warnings for all authored sets.
7. **Catalog adaptation failure**: Should an invalid equipment catalog make validation omit
   equipment catalogs or make the whole app error? Default: omit equipment catalogs, show equipment
   catalog-error UI, and keep the skill editor ready.
8. **Authored requirement fallback UI**: Should users edit fallback requirements directly? Default:
   expose it only when the selected weapon's catalog requirement is unresolved; otherwise display
   catalog facts read-only.
9. **Clear-all semantics**: Should clearing the last equipment field return to `equipment: null`?
   Default: no; ordinary clear actions keep the empty loadout, and only explicit reset returns to
   `null`.
10. **Catalog freshness display**: How much equipment freshness belongs in library rows? Default:
    include concise equipment catalog facts in freshness messages and avoid expanding row layouts
    unless needed for stale/unknown diagnostics.