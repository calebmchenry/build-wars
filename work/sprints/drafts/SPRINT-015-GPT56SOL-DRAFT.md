---
id: SPRINT-015
title: Equipment Editor
status: planned
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
---

# Sprint 015: Equipment Editor

## Overview

This sprint turns the completed semantic equipment shell into a durable, accessible equipment editor inside the existing single-build workspace. Users can configure runes, insignias, a headgear attribute bonus, and four weapon sets without choosing cosmetic or inventory-specific facts. The app consumes the promoted EPIC-10, EPIC-11, and EPIC-12 catalogs through `src/app/catalogs.ts`, stores only EPIC-13 semantic selections in `Build.equipment`, delegates legality and requirement conclusions to the existing rule engine, and presents explainable facts without claiming full combat simulation.

The equipment editor is a peer tab to the existing Skills workspace in the main column. Skills remain the initial tab, the left-column library/profession/attribute/template/share/validation workflow remains in place, and no route is added. This contains the feature's visual weight and gives armor and weapon controls enough width without extending the already dense left column.

Catalog readiness is fault-isolated. Profession/attribute or skill catalog failure may continue to use the existing app-level error boundary, but a rune, insignia, weapon, or modifier adaptation failure disables only the affected equipment controls and produces an equipment catalog-error state. Structural equipment validation and unaffected editor workflows continue to run.

The sprint is one release unit. Intermediate phase gates are development checkpoints, not safe deployment points: user-visible equipment controls must not ship until non-null equipment survives snapshot cloning, autosave, saved-record hydration, backup/restore, and validation. This avoids a cross-phase state in which the editor appears to save equipment while persistence silently drops it.

Binding planning decisions:

1. Keep `equipment: null` until the first committed equipment edit. Rendering or opening the Equipment tab must not mutate the build or trigger autosave.
2. Render a virtual canonical empty loadout for `equipment: null`. The first non-empty field update materializes `createEmptyEquipmentLoadout()` and applies the edit atomically.
3. Clearing an individual selection preserves the materialized loadout. A separate explicit “Remove equipment from build” action returns the field to `null`; it requires confirmation when the loadout contains authored selections.
4. Address armor and weapon-set edits by canonical slot identifiers, not rendered array positions. Reducers remain catalog-independent and never infer legality, handedness, or modifier slots.
5. Preserve incompatible, stale-ID, and explicitly unresolved selections until the user clears or replaces them. Changes to profession or mode re-filter future choices but never erase existing equipment.
6. Offer only known-compatible choices for new rune, insignia, weapon, and modifier selections. Keep catalog-indeterminate modifier choices available with an explicit warning. Existing invalid choices remain visible and clearable even when absent from the current option set.
7. Do not auto-clear an off-hand, modifier, or requirement when another field changes. Prevent newly selected two-handed/off-hand conflicts through option filtering and surface any imported or persisted conflict through validation.
8. Keep skill-template encoding, template fingerprints, and share URL payloads unchanged. When a target build contains authored equipment, export and share surfaces warn that only skill-template fields are represented; the warning does not block an otherwise valid skill-template export.
9. Limit numeric summaries to source-clear, unconditional, safely composable deltas. Armor health and energy deltas are shown separately from per-weapon-set deltas; armor-local, conditional, unknown, non-stacking, and combat-state-dependent effects remain labeled notes.
10. Keep generated JSON imports in `src/app/catalogs.ts`. Components receive app-owned catalog slices, option view models, fact views, and placeholder descriptors; authored state contains catalog IDs or unresolved semantic placeholders, never generated records.
11. Keep the local-library envelope and storage key at version 1 because the build already has the nullable equipment field and `EquipmentLoadout` is independently versioned. The parser accepts old `equipment: null` records, normalizes absent new catalog-freshness fields to `null`, and strictly validates non-null equipment before hydration.
12. Add no runtime or test dependency. The searchable picker uses React and the ARIA combobox pattern already available to the app.

## Use Cases

1. **Open equipment without changing a build**: A user opens the Equipment tab on an old or blank build, sees five armor slots and four weapon sets, then returns to Skills without creating a persistence change.
2. **Author the first selection**: Choosing a rune, insignia, headgear attribute, weapon, modifier, or authored requirement atomically creates the canonical loadout and updates the selected build.
3. **Configure armor**: A user selects or clears one rune and one insignia on each of head, chest, hands, legs, and feet and selects a primary-profession attribute for the headgear bonus.
4. **Search large catalogs**: A user searches by stable equipment name, navigates options by keyboard, observes a bounded no-results state, selects an option without typing its numeric ID, and can clear the result.
5. **Retain a stale selection**: A saved unresolved placeholder or catalog ID that no longer resolves remains labeled, located, persisted, and clearable instead of disappearing during hydration or option filtering.
6. **React to profession and mode changes**: Existing equipment remains authored when the build's primary profession or mode changes; options update and validation explains any newly incompatible rune, insignia, weapon, or modifier.
7. **Configure weapon occupancy**: A user creates empty, main-hand-only, off-hand-only, paired, and two-handed sets while the UI avoids creating a new two-handed/off-hand contradiction.
8. **Configure weapon modifiers**: Modifier choices are filtered by resolved weapon family, occupied modifier slot, mode, and EPIC-12 compatibility. Indeterminate choices are distinguished from compatible choices, and retained invalid modifiers can still be removed.
9. **Understand requirements**: Catalog-backed weapon requirements show their attribute, required rank, effective rank, and met/unmet/unresolved status. Authored requirement inputs appear only when the selected catalog weapon explicitly has unresolved requirement facts.
10. **Understand equipment effects**: The editor shows unconditional armor health/energy deltas, armor notes, headgear/rune attribute adjustments, weapon damage and damage type, per-set modifier deltas, conditional notes, and unresolved facts with their source selection.
11. **Validate in context**: Equipment issues appear beside the relevant armor piece, weapon set, hand, or modifier and remain included in the existing global validation counts and flags.
12. **Persist locally**: Materialized equipment survives draft autosave, pagehide flush, Save New, Update, duplicate, load, local-library serialization, and app restart.
13. **Back up and restore**: Native backup JSON round-trips known and unresolved equipment. Unsafe, unsupported, oversized, or malformed equipment causes the affected record or backup to be rejected with a bounded diagnostic rather than partially hydrated.
14. **Share honestly**: A user can still copy a Guild Wars skill-template code or skill-template share URL for a build with equipment and sees a clear warning that equipment is not included.
15. **Preserve skill workflows**: Skill authoring, skill tooltips, raw skill-template exact-source replay, canonical export, URL import, library filtering, and old null-equipment records retain their existing behavior.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Catalog boundary | Runtime adaptation of promoted rune, insignia, weapon, and weapon-modifier JSON; independent readiness; deterministic records/options; validation views; versions; attribution; metadata-only placeholder descriptors. | Manifests, QA reports, snapshots, source plans, Python modules, runtime wiki access, remote image bytes, or leaf-component generated JSON imports. |
| Editor state | Canonical slot-addressed armor and weapon mutations, first-edit initialization, explicit removal, partial states, unresolved-state retention, selected workspace tab, and dirty/autosave integration. | Catalog legality in reducers, party state, inventory state, active combat weapon set, or raw equipment-template state. |
| UI | Skills/Equipment tabs, five armor controls, four weapon sets, searchable comboboxes, concise facts, inline issues, catalog/empty/unresolved states, keyboard behavior, and responsive layout. | Separate route, mannequin/portrait, drag/drop, multi-build panes, skins, dyes, colors, equipment acquisition, or remote icons. |
| Analysis | Existing equipment validation, effective-rank handoff, requirement status, unconditional health/energy deltas, armor notes, per-set modifier facts, and conservative note handling. | Full armor totals, hit-location math, DPS, damage simulation, conditional-state evaluation, recommendations, party synergy, or complete stat aggregation. |
| Persistence | Strict versioned `EquipmentLoadout` parsing, deep cloning, local draft/saved-record round trip, native backup/restore, equipment freshness facts, and old-null compatibility. | Hosted sync, equipment presets, local schema redesign, backend storage, or importing semantic equipment from raw template codes. |
| Sharing | Honest omission warning around the unchanged skill-template and URL payloads. | Guild Wars equipment-template encode/decode integration, equipment in the URL fragment, short links, hosted sharing, or party template formats. |

### App Catalog Boundary and Failure Isolation

`src/app/catalogs.ts` remains the only production module that imports generated JSON. Add the four approved paths to `APPROVED_RUNTIME_CATALOG_IMPORTS` and adapt them into independently validated equipment slices:

```text
EquipmentCatalogSlice<Record, ValidationView>
  | ready
      catalogVersion
      generatedAt
      records: deterministic app-owned ordering
      recordsById: duplicate-safe read-only index
      validationView
  | error
      issues: bounded app-owned diagnostics

AppEquipmentCatalogViews
  runes: EquipmentCatalogSlice<CatalogRuneRecord, EquipmentRuneCatalogView>
  insignias: EquipmentCatalogSlice<CatalogInsigniaRecord, EquipmentInsigniaCatalogView>
  weapons: EquipmentCatalogSlice<CatalogWeaponBaseRecord, EquipmentWeaponCatalogView>
  weaponModifiers: EquipmentCatalogSlice<CatalogWeaponModRecord,
                                         EquipmentWeaponModifierCatalogView>
  weaponCatalogSet: ready(version, digest) | mismatch(issues)
```

Core catalog adaptation remains the outer `AppCatalogLoadState`. A malformed core catalog still uses the existing whole-app error state because the current editor cannot operate without it. An equipment slice error is stored inside otherwise-ready `AppCatalogViews`; it does not prevent skills, attributes, library access, or template workflows from rendering.

Each equipment adapter checks the expected profile, supported schema version, non-empty version and timestamp, expected record array, bounded record count, safe unique IDs, and fields needed by its consumer. The weapon pair additionally compares `catalogSetVersion` and `catalogSetDigest` on both artifacts. Records are copied into deterministic name-then-ID order without mutating imported JSON. Duplicate IDs make the affected slice erroneous rather than producing first-record-wins UI.

The catalog boundary exposes only metadata IDs through placeholder descriptors. It never returns an image URL for rendering. Attribution gains bounded rune, insignia, weapon, and modifier source links and the latest generated timestamp from ready slices. A failed slice contributes an availability note, not untrusted catalog text, to the equipment panel.

`selectValidationInput` supplies only ready slice validation views. If a selected item needs a failed or missing slice, the EPIC-13 rule engine emits its existing catalog-unavailable/unresolved issue. A weapon/modifier set mismatch is still passed through when both structures are readable so the domain remains the authority for the compatibility conclusion; modifier choice controls are disabled until the pair matches.

### Editor State and Mutation Contract

Add UI-only `activeEditorSurface: "skills" | "equipment"` to `EditorState`. It defaults to `skills`, is not part of `PersistedBuildSnapshot`, and returns to the default on hydration unless a future UI-state persistence ticket deliberately changes that policy.

Equipment actions are narrow and typed:

```text
set-active-editor-surface
set-armor-upgrade(slot, field: rune | insignia, selection | null)
set-headgear-attribute(slot: head, selection | null)
set-weapon(setSlot, hand, selection | null)
append-weapon-modifier(setSlot, hand, selection)
set-weapon-modifier(setSlot, hand, modifierIndex, selection)
remove-weapon-modifier(setSlot, hand, modifierIndex)
set-authored-weapon-requirement(setSlot, hand, requirement | null)
clear-weapon-hand(setSlot, hand)
remove-equipment
```

The reducer delegates immutable loadout patching to `equipment-editor-state.ts`. Helpers locate canonical armor and weapon rows by slot value, validate action indices, preserve untouched object identity where practical, and return the original state for invalid or semantic no-op actions. They do not receive catalog records.

For a null loadout, a null/clear action is a no-op; a non-null selection or requirement first creates the canonical empty loadout. Creating a modifier also creates the addressed hand. Clearing a weapon does not delete its modifiers or authored requirement because EPIC-13 explicitly represents that recoverable incomplete state. `clear-weapon-hand` is the deliberate action that removes the hand and its children.

The app does not repair malformed topology silently. Local persistence accepts only the canonical editor topology, while non-persistence callers may still give the domain malformed equipment for validation. If a typed in-memory state somehow lacks a canonical row, the editor renders a recovery error and offers only explicit whole-loadout removal; it does not guess which duplicate row to edit.

### Workspace Composition and Navigation

Create an `EditorWorkspaceTabs` component in the main column. It owns an ARIA `tablist` with Skills and Equipment tabs and two named tab panels. Click, Left/Right Arrow, Home, and End switch tabs; focus stays on the selected tab. Inactive content may unmount because skill browser filters, selected slot, and authored state live above the panel.

The Skills panel contains the current `SkillBar` and `SkillBrowser` without structural changes. The Equipment panel contains:

```text
EquipmentPanel
  status and remove/reset affordance
  EquipmentSummary
  ArmorEquipmentEditor
    head
    chest
    hands
    legs
    feet
  WeaponSetEditor
    set-1
    set-2
    set-3
    set-4
```

Armor rows use responsive cards rather than a wide table. Weapon sets use native disclosure sections with concise summaries so four sets do not overwhelm the page. On narrow viewports, control grids collapse to one column, long names wrap, popover/listbox widths stay within the viewport, and no control depends on horizontal scrolling. The existing third-column skill tooltip renders only for the Skills tab; equipment details live inside its panel rather than competing for that sticky column.

### Equipment Option and Selection Views

`equipment-selectors.ts` owns compatibility filtering and presentation view models. Components do not search generated records or recreate domain rules. A normalized option includes a stable key, numeric catalog ID, primary label, concise secondary facts, placeholder descriptor, and status:

```text
EquipmentOptionView
  key
  catalogId
  label
  normalizedLabel
  description
  placeholder
  status: compatible | indeterminate
  statusNote: string | null
```

Selector policy:

- Runes: include universal runes and resolved primary-profession runes; do not claim compatibility when primary profession is unresolved.
- Insignias: filter by canonical armor slot, build mode, common/profession availability, and primary profession. Unknown mode/applicability remains indeterminate rather than silently accepted.
- Weapons: filter by build mode, target hand, `equipRole`, and `handedness`. When the counterpart hand is occupied, exclude choices that would create a new two-handed/off-hand contradiction.
- Modifiers: require a resolved selected weapon, matching weapon catalog set, an available occupied slot, non-duplication with other selected modifiers, mode overlap, and `explainWeaponModCompatibility`. Include compatible options and visibly marked indeterminate options; exclude known-incompatible new choices.
- Headgear attributes: include attributes belonging to the resolved primary profession. Existing invalid or unresolved selection is retained separately from the offered choices.
- Authored requirements: expose inputs only when the resolved weapon catalog record has `requirement.kind === "unresolved"`.

Filtering governs new choices, not retained state. Every picker receives a separate selected-value view so a stale ID, explicit unresolved placeholder, or now-incompatible known record stays visible and clearable even when it is not in `options`.

### Searchable Combobox Contract

Implement one controlled `EquipmentCombobox` shared by runes, insignias, weapons, and modifiers. The selected catalog ID remains owned by the build; open state, query text, and active option index remain local ephemeral UI state.

The control follows the ARIA combobox/listbox pattern:

- a labeled text input with `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, and `aria-activedescendant`;
- a `role="listbox"` containing stable `role="option"` IDs;
- Arrow Up/Down, Home/End, Enter, Escape, Tab, pointer selection, and an independently labeled clear button;
- deterministic focus and selection behavior without hover-only interaction;
- explicit unavailable, no-results, catalog-error, retained-unresolved, and disabled states.

Search normalizes whitespace and case and matches app-owned label/family text. Query length is bounded to 120 characters and rendered results are capped at 100 with a count message. Sorting is already stable at the catalog/selector boundary, so filtering cannot depend on source order. The component never treats typed text as an ID and never silently promotes an unresolved candidate ID.

### Validation and Effective Attribute Ranks

The app continues to call the single domain `validateBuild`. No UI validator or competing legality vocabulary is introduced. `selectValidationInput` adds all ready equipment views and the existing editing options. `selectEquipmentEditorView` groups `ValidationIssue` values by armor piece, weapon set, hand, and modifier location while leaving global catalog/topology issues in the existing Validation panel.

Controls use validation as explanation, not mutation. Errors and warnings have stable nearby text, are connected with `aria-describedby`, and do not cause the selection to disappear. The global validation panel adds equipment catalog version/set facts but retains existing counts, flags, ordering, and truncation behavior.

Call `collectEquipmentAttributeRankAdjustments` once per selector pass. Valid headgear and rune adjustments feed:

- effective-rank text beside authored attribute ranks;
- skill tooltip progression rank context; and
- weapon requirement views through the existing domain analysis.

If adjustment inputs are unresolved, known applied contributions may still be displayed as a partial breakdown, but the UI labels the effective result as incomplete and does not present it as the final requirement conclusion. Domain requirement validation remains authoritative and already suppresses false unmet conclusions when equipment rank evidence is unresolved.

### Explainable Equipment Summary

`equipment-summary.ts` projects selected structured records into display facts. It may compose existing pure domain helpers, but it does not widen their contracts or import generated JSON.

Summary lanes are deliberately separate:

1. **Always-on armor**: source-clear unconditional character-scoped maximum-health and maximum-energy deltas from resolved legal rune/insignia selections. `sum` groups add and `highest` groups choose the greatest numeric contribution. Unsupported, separate, non-stacking, local-only, and unknown combination rules become notes.
2. **Attribute effects**: applied headgear and highest-per-attribute rune adjustments with target, amount, source label, and unresolved reasons.
3. **Armor notes**: per-piece armor-rating, incoming-damage, duration, conditional, note-only, and unknown effects. Armor-local values are never presented as a character-wide armor total.
4. **Weapon sets**: damage range/type and requirement facts from each resolved base weapon, plus modifier facts for that set. Because EPIC-13 has no active-set state, no modifier value is added across different weapon sets.
5. **Per-set deltas**: unconditional fixed health/energy modifier amounts may be shown for one structurally valid set. Conditional, chance, damage, armor, attribute, duration, unknown, or unresolved modifier effects remain facts/notes.

Every arithmetic contribution retains a selection path and human-readable source label so the total can be explained. A summary excludes a selection from arithmetic if its record is missing, ambiguous, mode-incompatible, structurally conflicting, or semantically indeterminate. Exclusion is visible as a note. Numeric values are never parsed from display prose.

Equipment fact details use approved structured names, families, requirement/damage fields, effect tags, and bounded reviewed short text already present in runtime catalogs. They do not copy wiki prose or navigate to/fetch source pages. Placeholder surfaces use `iconId` only as inert metadata.

### Persistence and Native Backup Contract

The local envelope stays `build-wars-local-library` schema 1 and the key remains `build-wars:v1`. `Build.equipment` is already nullable and `EquipmentLoadout.schemaVersion` owns its own evolution. Add a dedicated parser and deep clone for equipment rather than casting parsed JSON.

The durable editor contract accepts:

- `equipment: null`; or
- schema version 1 with exactly one row for each canonical armor slot and exactly one row for each canonical weapon-set slot, in canonical order;
- nullable known or unresolved selections in the correct catalog namespace;
- nullable hands, bounded modifier arrays, and the EPIC-13 authored requirement discriminants.

Known IDs and candidate IDs must be non-negative safe integers. Unresolved labels are nullable and bounded to 120 characters; reasons are required and bounded to 240. Requirement ranks are safe integers in the supported editor range. Armor, weapon-set, and modifier array sizes are checked before child traversal. Unexpected ordinary keys are discarded by reconstruction; dangerous keys, non-plain objects, unsupported schema versions, invalid discriminants, invalid slot topology, oversized collections, or invalid primitives reject the containing persisted snapshot with bounded path diagnostics.

Strict canonical persisted topology is intentional. The domain accepts malformed arrays so it can validate untrusted callers, but this app creates fixed rows and should not write ambiguous slot identity into durable data. Semantic uncertainty remains recoverable through unresolved selection objects; structural ambiguity is rejected rather than silently reordered or repaired.

`cloneBuild` deep-copies equipment rows, selections, hands, modifiers, and requirements. Snapshot fingerprints therefore observe equipment edits, and workspace dirty state/autosave behavior works without special cases. Backup creation already serializes the local envelope, and restore already uses the persistence parser; change those modules only where tests expose a missing deep-copy or diagnostic handoff.

Extend `PersistedCatalogFacts` with nullable rune, insignia, weapon, weapon-modifier, and weapon-set version/digest fields mirrored from `ValidationResult.validatedAgainst`. When parsing older envelope v1 records, absent fields normalize to `null`. Freshness compares only facts available on both sides: a different known version is stale, a missing side is unknown, and matching known values are fresh.

### Skill-Template and Share Boundary

Define one pure `hasAuthoredEquipment` selector. It returns true only when a loadout contains a non-null armor attachment/headgear selection, weapon, modifier, or authored requirement; a materialized but empty canonical loadout does not trigger an omission warning.

When true:

- the export dialog states that both exact-source and canonical outputs omit equipment;
- Share Controls states that the URL and copied template text include skill-template fields only;
- importing a skill template over the current draft uses the existing dirty guard and explicitly names equipment among the replaced fields when equipment is present.

The warning does not alter export availability, template projection diagnostics, exact-source fingerprints, code bytes, share URL payloads, or the 1,800-character limit. A share URL imported on startup still creates a skill-template draft with `equipment: null`.

### Cross-Phase Invariants

The following invariants apply to every implementation phase:

- No generated catalog record is stored inside `Build`, `EditorState`, snapshots, or backups.
- No leaf component imports generated JSON or remote media URLs.
- No reducer consults catalog facts or silently deletes related selections.
- No option filter changes retained authored state.
- No total combines mutually exclusive weapon sets or conditional/unknown effects.
- No equipment edit changes raw skill-template overlays or exact-source fingerprints.
- No equipment UI is considered release-ready before Phase 7 persistence gates pass.
- Existing null-equipment behavior is asserted at each relevant regression gate.
- `src/domain` remains framework-neutral and receives no app or generated-data imports.

## Implementation

### Phase 1: BW-1401 Equipment Catalog Boundary, State, and Selector Foundation (~16%)

**Files:**

- `src/app/catalogs.ts`
- `src/app/catalogs.test.ts`
- `src/app/catalog-boundary.test.ts`
- `src/app/editor-state.ts`
- `src/app/equipment-editor-state.ts` - create
- `src/app/editor-state.test.ts`
- `src/app/equipment-editor-state.test.ts` - create
- `src/app/editor-selectors.ts`
- `src/app/equipment-selectors.ts` - create
- `src/app/equipment-selectors.test.ts` - create
- `src/domain/equipment.ts` - reference only
- `src/domain/validation-context.ts` - reference only
- `data/generated/epic-10/runes.catalog.json` - read-only runtime input
- `data/generated/epic-11/insignias.catalog.json` - read-only runtime input
- `data/generated/epic-12/weapons.catalog.json` - read-only runtime input
- `data/generated/epic-12/weapon-mods.catalog.json` - read-only runtime input

**Tasks:**

- [ ] Mark SPRINT-015 and BW-1401 in progress; confirm EPIC-10 through EPIC-13 outputs and all four promoted equipment catalogs are present.
- [ ] Extend `APPROVED_RUNTIME_CATALOG_IMPORTS` with the exact promoted equipment paths and keep the generated-import scan limited to `catalogs.ts`.
- [ ] Add independently validated rune, insignia, weapon, and modifier app catalog slices with bounded diagnostics and deterministic name-then-ID ordering.
- [ ] Verify unique safe IDs, supported profiles/schema versions, required record arrays, version facts, and matching weapon catalog-set version/digest without importing manifest or QA files.
- [ ] Extend catalog versions, attribution, and placeholder descriptors while exposing no remote render URL.
- [ ] Build duplicate-safe indexes once at adaptation time and expose minimal domain validation views without copying generated records into authored data.
- [ ] Add `activeEditorSurface` and typed equipment actions to `EditorState`.
- [ ] Implement immutable canonical slot-addressed update helpers, first-nonempty-edit initialization, clear-without-cascade behavior, invalid-action no-ops, and explicit removal.
- [ ] Preserve `equipment: null` for render-only activity and null clear operations.
- [ ] Add selector scaffolding for virtual empty state, selected-value resolution, catalog slice readiness, and validation input wiring.
- [ ] Prove profession/mode/skill/attribute edits preserve equipment and equipment edits preserve raw skill-template overlays and unrelated build fields.
- [ ] Mark BW-1401 done only after boundary, reducer, and type gates pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/catalogs.test.ts src/app/catalog-boundary.test.ts src/app/editor-state.test.ts src/app/equipment-editor-state.test.ts src/app/equipment-selectors.test.ts
```

### Phase 2: BW-1402 Equipment Workspace Shell and Responsive Placement (~9%)

**Files:**

- `src/app/App.tsx`
- `src/app/components/EditorWorkspaceTabs.tsx` - create
- `src/app/components/EquipmentPanel.tsx` - create
- `src/app/styles.css`
- `src/app/App.test.tsx`
- `src/app/equipment-panel.test.tsx` - create

**Tasks:**

- [ ] Begin BW-1402 only after Phase 1 passes.
- [ ] Replace the direct main-column skill composition with accessible Skills and Equipment tabs; keep Skills selected by default and preserve the existing Skill Bar/Browser subtree.
- [ ] Implement click and Arrow/Home/End tab behavior with stable tab/panel labels and focus.
- [ ] Render five virtual armor rows and four virtual weapon-set sections for null equipment without dispatching an edit.
- [ ] Add clear null/empty, materialized-empty, unresolved, partial slice-error, and topology-error panel states.
- [ ] Add the explicit remove-equipment affordance and confirmation boundary without conflating it with per-field clear.
- [ ] Keep equipment details inside the main panel and suppress the skill tooltip column when the Equipment tab is selected.
- [ ] Add card/disclosure layouts that stack cleanly below 760px, wrap long labels, and do not introduce horizontal overflow or crowd the left column.
- [ ] Test switching tabs does not reset authored build state, browser filters, selection state, or library association.
- [ ] Mark BW-1402 done only after component and responsive-state checks pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/App.test.tsx src/app/equipment-panel.test.tsx
```

### Phase 3: BW-1403 Searchable Equipment Pickers and Context Filtering (~12%)

**Files:**

- `src/app/components/EquipmentCombobox.tsx` - create
- `src/app/equipment-selectors.ts`
- `src/app/equipment-combobox.test.tsx` - create
- `src/app/equipment-selectors.test.ts`
- `src/app/styles.css`
- `src/domain/weapon-mod-compatibility.ts` - reference only

**Tasks:**

- [ ] Begin BW-1403 only after BW-1401 and BW-1402 pass.
- [ ] Implement the reusable ARIA combobox/listbox with stable IDs, controlled selected value, bounded local query state, explicit clear, and no numeric-ID entry path.
- [ ] Support Arrow Up/Down, Home/End, Enter, Escape, Tab, pointer choice, focus restoration, and active-option scrolling without trapping focus.
- [ ] Cap query length and rendered matches, announce result counts, and cover empty, no-result, disabled, catalog-error, retained-invalid, and unresolved-selected views.
- [ ] Implement deterministic rune filtering by armor profession and known eligibility.
- [ ] Implement insignia filtering by armor slot, profession/common availability, and mode facts.
- [ ] Implement weapon filtering by mode, target hand, handedness/equip role, and counterpart occupancy.
- [ ] Implement modifier filtering with resolved weapon facts, occupied-slot availability, catalog set identity, current selected modifiers, and `explainWeaponModCompatibility`.
- [ ] Include indeterminate choices with an explicit status note; exclude known-incompatible new options while retaining already-authored incompatible selections.
- [ ] Prove catalog/source order does not change options or keyboard order and no picker fetches or renders remote media.
- [ ] Mark BW-1403 done only after picker and option-policy tests pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/equipment-combobox.test.tsx src/app/equipment-selectors.test.ts src/app/catalog-boundary.test.ts
```

### Phase 4: BW-1404 Armor Controls and Effective-Rank Handoff (~14%)

**Files:**

- `src/app/components/ArmorEquipmentEditor.tsx` - create
- `src/app/components/EquipmentPanel.tsx`
- `src/app/components/AttributeEditor.tsx`
- `src/app/equipment-selectors.ts`
- `src/app/editor-selectors.ts`
- `src/app/armor-equipment-editor.test.tsx` - create
- `src/app/equipment-selectors.test.ts`
- `src/app/editor-selectors.test.ts`
- `src/domain/equipment-attribute-rank.ts` - reference only
- `src/domain/effective-attribute-rank.ts` - reference only

**Tasks:**

- [ ] Begin BW-1404 only after the shared picker gate passes.
- [ ] Render head, chest, hands, legs, and feet in canonical order with rune and insignia pickers and concise selected-value summaries.
- [ ] Render the headgear attribute picker only on the head row and source its options from resolved primary-profession attributes.
- [ ] Dispatch slot-addressed actions and prove selecting the first armor field initializes one canonical loadout without modifying weapon rows.
- [ ] Preserve and label stale IDs, explicit unresolved selections, invalid profession/mode choices, and catalog-error state; keep each clearable.
- [ ] Attach armor-piece validation issues to the correct row and field description without duplicating validation logic.
- [ ] Collect equipment attribute adjustments once, add effective-rank/breakdown text to attribute rows, and pass the same valid adjustments to skill tooltip progression context.
- [ ] Label incomplete effective-rank evidence instead of presenting a known subset as a final requirement conclusion.
- [ ] Prove changing armor leaves skills, raw overlays, attributes, and weapon sets unchanged; prove profession/mode changes retain authored armor.
- [ ] Mark BW-1404 done only after armor and effective-rank tests pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/armor-equipment-editor.test.tsx src/app/equipment-selectors.test.ts src/app/editor-selectors.test.ts test/domain/armor-equipment.test.ts test/domain/effective-attribute-rank.test.ts
```

### Phase 5: BW-1405 Weapon-Set Controls, Occupancy, Modifiers, and Requirements (~15%)

**Files:**

- `src/app/components/WeaponSetEditor.tsx` - create
- `src/app/components/EquipmentPanel.tsx`
- `src/app/equipment-selectors.ts`
- `src/app/equipment-editor-state.ts`
- `src/app/weapon-set-editor.test.tsx` - create
- `src/app/equipment-selectors.test.ts`
- `src/app/equipment-editor-state.test.ts`
- `src/domain/weapon-set.ts` - reference only
- `src/domain/weapon-mod-compatibility.ts` - reference only

**Tasks:**

- [ ] Begin BW-1405 only after BW-1403 and the Phase 1 state foundation pass.
- [ ] Render four canonical weapon-set disclosures with occupancy and unresolved summaries.
- [ ] Add main-hand and off-hand weapon pickers that allow empty and off-hand-only partial state but do not offer a new choice that conflicts with the occupied counterpart hand.
- [ ] Preserve imported/persisted two-handed plus off-hand contradictions and show the domain issue rather than auto-clearing either side.
- [ ] Render selected modifiers as stable indexed rows, allow individual replacement/removal, and expose an add-modifier picker only when a resolved weapon has an available compatible slot.
- [ ] Prevent the UI from adding a second known modifier for an already occupied slot while retaining duplicate or unresolved authored arrays for explicit removal.
- [ ] Display catalog requirement facts and effective-rank status near each weapon.
- [ ] Show bounded authored attribute/rank controls only for catalog-unresolved requirements; never let authored input override a known catalog requirement or `none`.
- [ ] Keep clearing a weapon non-destructive to modifiers/requirement, and provide a separate clear hand action for deliberate cascading removal.
- [ ] Cover all occupancy kinds, wrong-hand retained state, catalog-set mismatch, compatible, incompatible, and indeterminate modifiers, missing weapon with modifiers, met/unmet/unresolved requirements, and no mutation of other sets.
- [ ] Mark BW-1405 done only after weapon-set and domain-regression gates pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/weapon-set-editor.test.tsx src/app/equipment-selectors.test.ts src/app/equipment-editor-state.test.ts test/domain/weapon-set.test.ts test/domain/weapon-mod-compatibility.test.ts test/domain/equipment-validation.test.ts
```

### Phase 6: BW-1406 Equipment Details and Conservative Stat Summaries (~13%)

**Files:**

- `src/app/equipment-summary.ts` - create
- `src/app/components/EquipmentSummary.tsx` - create
- `src/app/components/EquipmentFactDetails.tsx` - create
- `src/app/components/ArmorEquipmentEditor.tsx`
- `src/app/components/WeaponSetEditor.tsx`
- `src/app/components/EquipmentPanel.tsx`
- `src/app/equipment-summary.test.ts`
- `src/app/equipment-display.test.tsx` - create
- `src/app/styles.css`
- `src/domain/rune-effects.ts` - reference only
- `src/domain/insignia-effects.ts` - reference only
- `src/domain/equipment-attribute-rank.ts` - reference only
- `src/domain/weapon-set.ts` - reference only

**Tasks:**

- [ ] Begin BW-1406 only after armor and weapon controls pass.
- [ ] Define app-owned fact, arithmetic contribution, note, provenance-path, and unresolved view models without adding a second domain rule engine.
- [ ] Show selected rune, insignia, weapon, and modifier names, family/slot facts, placeholder descriptors, and accessible expandable details from approved structured fields.
- [ ] Aggregate only source-clear unconditional character-scoped armor health/energy contributions with supported `sum` and `highest` semantics.
- [ ] Reuse rune and insignia helpers where their contracts apply; never parse values from display text or duplicate headgear/rune stacking rules.
- [ ] Show headgear/rune attribute adjustments separately from authored base ranks.
- [ ] Keep armor-local and conditional insignia/rune effects as per-piece notes and do not publish a global base-armor or damage-reduction total.
- [ ] Show weapon damage range/type, requirement state, modifier slot/family, and structured effect facts per hand/set.
- [ ] Compute fixed unconditional health/energy modifier deltas only within one valid weapon set; never sum across sets or fold conditional/chance/unknown effects into totals.
- [ ] Include a reason whenever a selected effect is excluded from arithmetic and keep unresolved facts visible.
- [ ] Prove row summaries, fact details, and top-level totals derive from the same view model and remain deterministic under source record order.
- [ ] Mark BW-1406 done only after selector/display and domain-helper regression gates pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/equipment-summary.test.ts src/app/equipment-display.test.tsx src/app/equipment-selectors.test.ts test/domain/rune-effects.test.ts test/domain/insignia-effects.test.ts test/domain/weapon-set.test.ts
```

### Phase 7: BW-1407 Validation Presentation, Durable Persistence, Backup, and Sharing (~15%)

**Files:**

- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/library-fixtures.ts`
- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/local-storage.ts` - reference or narrow modify
- `src/app/local-storage.test.ts`
- `src/app/workspace-state.ts` - reference or narrow modify
- `src/app/workspace-state.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/editor-selectors.ts`
- `src/app/components/EquipmentPanel.tsx`
- `src/app/components/ValidationPanel.tsx`
- `src/app/components/ShareControls.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/template-workflow.ts` - preserve projection bytes; narrow helper change only if needed
- `src/app/template-workflow.test.ts`
- `src/app/share-url.ts` - unchanged contract
- `src/app/share-url.test.ts`

**Tasks:**

- [ ] Begin BW-1407 only after BW-1404, BW-1405, and BW-1406 pass; do not release the equipment UI before this entire phase passes.
- [ ] Implement strict, bounded, reconstructing parsers for equipment loadout, armor rows, selections, weapon sets, hands, modifiers, and authored requirements.
- [ ] Accept old `equipment: null` snapshots unchanged and reject unsupported versions, noncanonical topology, invalid discriminants, unsafe IDs/ranks, oversized arrays/strings, non-plain objects, and dangerous keys with bounded precise diagnostics.
- [ ] Deep-clone all nested equipment in snapshot creation/hydration and prove fingerprints change for each equipment mutation.
- [ ] Prove draft autosave, pagehide flush, Save New, Update, load, duplicate, and app restart preserve known, empty, partial-selection, stale-ID, and explicit unresolved equipment.
- [ ] Extend persisted catalog facts and freshness comparison with nullable equipment and weapon-set versions/digests; normalize absent fields in old envelope-v1 records to `null`.
- [ ] Round-trip equipment through native backup serialize/parse, merge/replace preview, ID remap, and restore apply; reject an invalid record without partially applying it.
- [ ] Group equipment validation issues into inline armor/set/hand/modifier views, retain global catalog/topology issues, and display equipment catalog versions in Validation.
- [ ] Add `hasAuthoredEquipment` and one shared omission-warning view so Template Export and Share Controls use identical language and gating.
- [ ] Warn before a skill-template import replaces authored equipment; preserve the existing dirty guard and keep successful import output at `equipment: null`.
- [ ] Prove equipment never enters skill-template projection, exact-source fingerprinting, share URL payloads, URL length calculation, or raw equipment-template compatibility state.
- [ ] Run the full app/domain focused suite before marking BW-1407 done.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/persistence-schema.test.ts src/app/backup-restore.test.ts src/app/local-storage.test.ts src/app/workspace-state.test.ts src/app/template-workflow.test.ts src/app/share-url.test.ts src/app/App.test.tsx src/app/equipment-panel.test.tsx
npm run test:run -- test/domain/equipment-validation.test.ts test/domain/rule-engine.test.ts test/template-compatibility/equipment-template.test.ts
```

### Phase 8: BW-1408 Accessibility, Documentation, Regression, and Closeout (~6%)

**Files:**

- `src/app/equipment-combobox.test.tsx`
- `src/app/equipment-panel.test.tsx`
- `src/app/armor-equipment-editor.test.tsx`
- `src/app/weapon-set-editor.test.tsx`
- `src/app/equipment-display.test.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`
- `README.md`
- `compendium/equipment-editor.md` - create
- `compendium/equipment-shell.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/game-rule-engine.md`
- `compendium/README.md`
- `work/tickets/14-equipment-editor/*.md`
- `work/sprints/SPRINT-015.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-14-result.json`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/execute-SPRINT-015-result.json`

**Tasks:**

- [ ] Begin BW-1408 only after all functional and persistence gates pass.
- [ ] Audit tab, disclosure, combobox, clear/remove, inline issue, and fact-detail controls for names, roles, focus order, focus visibility, keyboard-only completion, and status announcements.
- [ ] Test 320px-class narrow layout, long labels, long unresolved text, listbox clipping, nested disclosures, touch targets, and absence of horizontal page overflow.
- [ ] Confirm partial equipment catalog failure leaves the Skills editor, attributes, library, backup recovery, template flows, and unaffected equipment slices usable.
- [ ] Document catalog ownership, null-versus-empty behavior, state transitions, picker filtering, persistence grammar, validation presentation, arithmetic exclusions, and share omission policy.
- [ ] Record the handoff to EPIC-16: `Build.equipment` travels with each build, while active editor tab and combobox UI state do not.
- [ ] Record deferred skins/dyes/colors, equipment-template conversion, remote icons, global search and rich tooltips, active-set combat state, full analysis, party equipment, and backend sync.
- [ ] Run prohibited-import/media scans and confirm no generated catalog, manifest, QA report, snapshot, ingestion script, domain contract, or template codec changed unexpectedly.
- [ ] Run `npm run verify`, inspect `git status --short`, and reconcile every intended file.
- [ ] Update BW-1401 through BW-1408, EPIC-14, SPRINT-015, the ledger, planning manifest, and execution manifest to one consistent final state.
- [ ] Mark BW-1408 and EPIC-14 done only after full verification passes; do not create a commit.

**Verification:**

```sh
rg -n "data/generated|data/qa|source-snapshots|scripts/data|api\\.php|wiki\\.guildwars|fetch\\(|<(img|source|picture|canvas)\\b" src/app --glob '!catalogs.ts' --glob '!*.test.ts' --glob '!*.test.tsx'
rg -n "react|localStorage|sessionStorage|fetch\\(|data/generated|data/qa|source-snapshots|scripts/data|api\\.php|wiki" src/domain
npm run verify
git status --short
```

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/app/catalogs.ts` | Modify | Import and fault-isolate the four promoted equipment catalogs; expose app views, versions, indexes, attribution, validation slices, and placeholders. |
| `src/app/catalogs.test.ts` | Modify | Verify profile/schema/set checks, deterministic adaptation, partial failures, versions, attribution, and metadata-only placeholders. |
| `src/app/catalog-boundary.test.ts` | Modify | Keep all generated imports in `catalogs.ts` and prohibit remote media/runtime source leakage. |
| `src/app/editor-state.ts` | Modify | Add the active workspace surface and typed equipment actions while preserving existing state behavior. |
| `src/app/equipment-editor-state.ts` | Create | Apply immutable canonical slot/hand/modifier/requirement updates and first-edit initialization without catalog coupling. |
| `src/app/editor-state.test.ts` | Modify | Cover equipment preservation across unrelated actions and unchanged skill/raw-template behavior. |
| `src/app/equipment-editor-state.test.ts` | Create | Cover null initialization, slot identity, partial hands, non-cascading clears, removal, no-ops, and immutability. |
| `src/app/editor-selectors.ts` | Modify | Supply equipment validation views and apply equipment rank adjustments to attribute/skill displays. |
| `src/app/equipment-selectors.ts` | Create | Own canonical editor views, retained selections, context option filtering, occupancy/requirement projections, and inline issue grouping. |
| `src/app/equipment-selectors.test.ts` | Create | Verify deterministic filters, retained invalid state, partial catalog readiness, effective ranks, and issue locations. |
| `src/app/equipment-summary.ts` | Create | Build conservative health/energy, attribute, armor-note, weapon, requirement, and unresolved summary views. |
| `src/app/equipment-summary.test.ts` | Create | Verify safe aggregation, combination semantics, per-set separation, exclusions, and deterministic provenance paths. |
| `src/app/App.tsx` | Modify | Compose tabbed skill/equipment workspace and preserve autosave, library, template, validation, and tooltip behavior. |
| `src/app/components/EditorWorkspaceTabs.tsx` | Create | Provide accessible Skills/Equipment tab navigation and tab panels. |
| `src/app/components/EquipmentPanel.tsx` | Create | Compose equipment status, summaries, armor, weapons, removal, and catalog/topology errors. |
| `src/app/components/EquipmentCombobox.tsx` | Create | Provide bounded searchable, keyboard-accessible equipment selection with retained unresolved state. |
| `src/app/components/ArmorEquipmentEditor.tsx` | Create | Render five armor slots, rune/insignia controls, headgear attribute, concise facts, and inline issues. |
| `src/app/components/WeaponSetEditor.tsx` | Create | Render four sets, hands, occupancy, weapons, modifiers, requirements, facts, and inline issues. |
| `src/app/components/EquipmentSummary.tsx` | Create | Present separated armor totals, attribute effects, per-set deltas, notes, and unresolved state. |
| `src/app/components/EquipmentFactDetails.tsx` | Create | Render consistent accessible structured facts for runes, insignias, weapons, and modifiers. |
| `src/app/components/AttributeEditor.tsx` | Modify | Show effective ranks and equipment contribution/incomplete status beside authored ranks. |
| `src/app/components/ValidationPanel.tsx` | Modify | Retain global issues and add equipment catalog version/set evidence. |
| `src/app/components/TemplateDialogs.tsx` | Modify | Warn when import replaces or export omits authored equipment without changing template bytes. |
| `src/app/components/ShareControls.tsx` | Modify | Warn that skill-template URLs/text omit equipment for the selected draft or saved record. |
| `src/app/styles.css` | Modify | Style tabs, responsive equipment cards, combobox/listbox, facts, notes, issues, and narrow layouts. |
| `src/app/*equipment*.test.tsx` | Create | Cover shell, combobox, armor, weapon, display, accessibility, errors, and responsive class/state behavior. |
| `src/app/App.test.tsx` | Modify | Cover tab integration, catalog isolation, persistence, omission warnings, and skill workflow regressions. |
| `src/app/persistence-schema.ts` | Modify | Strictly parse and deep-clone semantic equipment and persist nullable equipment catalog freshness facts. |
| `src/app/persistence-schema.test.ts` | Modify | Cover null compatibility, full/unresolved equipment round trips, bounds, topology, discriminants, dangerous keys, and old metadata. |
| `src/app/library-fixtures.ts` | Modify | Add canonical known, empty, and unresolved equipment snapshots for app persistence tests. |
| `src/app/backup-restore.ts` | Reference or narrow modify | Reuse the canonical parser and preserve equipment through backup preview/apply. |
| `src/app/backup-restore.test.ts` | Modify | Verify equipment merge/replace round trip and atomic rejection of invalid payloads. |
| `src/app/local-storage.ts` | Reference or narrow modify | Preserve revision, quota, corruption, and write-block behavior with larger equipment snapshots. |
| `src/app/local-storage.test.ts` | Modify | Verify equipment autosave/read and existing recovery semantics. |
| `src/app/workspace-state.ts` | Reference or narrow modify | Continue deriving dirty state and fingerprints from complete persisted snapshots. |
| `src/app/workspace-state.test.ts` | Modify | Verify save/load/duplicate/restore and dirty transitions preserve equipment. |
| `src/app/template-workflow.ts` | Reference or narrow modify | Preserve skill-only projection and exact-source behavior; host a shared omission view only if appropriate. |
| `src/app/template-workflow.test.ts` | Modify | Prove equipment is omitted without changing export availability, code, or fingerprint behavior. |
| `src/app/share-url.ts` | No production change expected | Preserve the skill-template-only payload and 1,800-character cap. |
| `src/app/share-url.test.ts` | Modify | Prove equipment cannot enter share fragments and existing URL behavior is byte-compatible. |
| `src/domain/equipment*.ts` | Reference only | Reuse semantic loadout, constructors, rank adjustment, and unresolved contracts. |
| `src/domain/weapon-set.ts` | Reference only | Reuse occupancy, modifier, and requirement analysis. |
| `src/domain/rules/equipment.ts` | Reference/test only | Keep domain validation authoritative for legality and issue locations. |
| `data/generated/epic-{10,11,12}/**/*.catalog.json` | Read-only | Supply approved runtime facts; no regeneration or promotion occurs in this sprint. |
| `README.md` | Modify | Document the equipment editor in current scope and retain explicit exclusions. |
| `compendium/equipment-editor.md` | Create | Record durable app architecture, interactions, summaries, persistence, validation, and sharing boundaries. |
| `compendium/equipment-shell.md` | Modify | Replace EPIC-14 handoff language with implemented app consumers and retain domain boundaries. |
| `compendium/core-build-editor.md` | Modify | Document tab composition, effective ranks, equipment state, and unchanged skill behavior. |
| `compendium/local-library-and-sharing.md` | Modify | Document non-null equipment persistence, backup/restore, freshness, and skill-only sharing. |
| `compendium/game-rule-engine.md` | Modify | Document app-supplied equipment views and inline presentation without changing domain semantics. |
| `compendium/README.md` | Modify | Index the equipment editor note. |
| `work/tickets/14-equipment-editor/*.md` | Modify during execution | Track dependencies, evidence, acceptance, status, and closeout for EPIC-14 and BW-1401 through BW-1408. |
| `work/sprints/SPRINT-015.md` | Create/update during execution | Store the merged sprint and execution checklist state. |
| `work/sprints/ledger.tsv` | Modify during execution | Track the SPRINT-015 lifecycle consistently. |
| `work/runs/ticket-burn/BACKLOG/20260903T014346Z/*SPRINT-015-result.json` | Create during workflow | Record planning and execution outcomes required by the ticket-burn contract. |

## Definition of Done

### Catalog and Runtime Boundaries

- [ ] `src/app/catalogs.ts` is the only app production file importing generated catalogs.
- [ ] Promoted rune, insignia, weapon, and modifier catalogs have app-owned slices, deterministic ordering, duplicate-safe indexes, versions, validation views, attribution, and placeholders.
- [ ] Equipment catalog failure is isolated by family and does not make the skill editor, local library, or unaffected equipment controls unusable.
- [ ] Weapon/modifier catalog-set mismatch disables new modifier choices and remains visible to domain validation.
- [ ] No leaf component receives manifests, QA reports, snapshots, source plans, Python modules, wiki clients, image URLs, or imported JSON modules.
- [ ] No generated catalog, manifest, QA report, snapshot, ingestion code, or identity registry is modified.

### Editor State and Workspace

- [ ] Skills and Equipment are accessible peer tabs in the existing main editor column; Skills is the default and no route is added.
- [ ] Merely rendering, opening, or leaving Equipment preserves `equipment: null` and does not dirty or autosave the build.
- [ ] The first non-empty equipment edit atomically creates the canonical five-slot/four-set loadout.
- [ ] Armor, hand, modifier, and requirement actions address stable canonical slots and are deterministic immutable no-ops for invalid targets.
- [ ] Per-field clear preserves other authored state; clearing a weapon preserves its recoverable modifier/requirement state; explicit clear-hand and remove-equipment actions are distinct.
- [ ] Profession and mode changes never delete equipment; equipment edits never alter skill, attribute, title/template overlay, or library association state.
- [ ] Existing malformed in-memory topology is not silently reordered, deduplicated, or repaired.

### Pickers and Armor

- [ ] Rune, insignia, weapon, and modifier selection uses a shared searchable combobox with no exact-ID entry requirement.
- [ ] Search, result caps, stable ordering, clear, no-results, disabled, error, unresolved, pointer, and keyboard behavior are test-covered.
- [ ] New options respect known profession, mode, armor-slot, hand, weapon-family, modifier-slot, catalog-set, and compatibility facts.
- [ ] Indeterminate options are labeled; known-incompatible options cannot be newly selected; old invalid/unresolved choices remain visible, persisted, and clearable.
- [ ] Exactly five armor rows appear in canonical order, each with one rune and one insignia attachment point.
- [ ] Only the head row offers a headgear attribute, and offered attributes belong to the resolved primary profession.
- [ ] Valid headgear/rune adjustments feed effective attribute and skill tooltip rank displays; unresolved evidence is labeled incomplete.

### Weapons and Requirements

- [ ] Exactly four weapon-set sections appear in canonical order.
- [ ] Empty, main-hand-only, off-hand-only, paired, two-handed, conflict, incomplete, and unresolved states have distinct summaries.
- [ ] New choices cannot create a two-handed/off-hand contradiction, while retained contradictions remain visible and non-destructively repairable.
- [ ] Modifier options use the selected weapon, catalog-set identity, occupied slots, existing modifiers, mode, and EPIC-12 compatibility helper.
- [ ] The UI cannot add a duplicate known occupied modifier slot but can display and clear duplicate or unresolved retained data.
- [ ] Known requirements show attribute, required rank, effective rank, and status.
- [ ] Authored requirement inputs appear only for a catalog-unresolved requirement and cannot override known catalog facts.
- [ ] Occupancy, modifier, and requirement conclusions reuse EPIC-13 domain helpers rather than UI reimplementations.

### Display, Summaries, and Validation

- [ ] Selected equipment has consistent names, placeholders, concise facts, expandable details, and unresolved labels across pickers, rows, and summaries.
- [ ] Always-on armor health/energy deltas include only resolved legal unconditional character-scoped effects with supported composition rules.
- [ ] Headgear/rune attribute effects are separate and explainable.
- [ ] Armor-local, conditional, note-only, non-stacking, unknown, and unresolved effects remain notes and are never silently included in totals.
- [ ] Weapon damage/type, modifier effects, and requirements are shown per hand/set.
- [ ] Weapon modifier deltas are never summed across mutually exclusive weapon sets.
- [ ] Every included arithmetic value and excluded selection has an explainable source label/path or reason.
- [ ] Equipment catalog views are passed to the existing `validateBuild`; no parallel UI legality engine exists.
- [ ] Issues appear beside the applicable armor piece, set, hand, or modifier and remain represented in global counts, flags, ordering, catalog facts, and truncation.

### Persistence, Backup, and Sharing

- [ ] Old local-library and backup records with `equipment: null` parse, hydrate, save, and restore unchanged.
- [ ] Canonical empty, known, partial-selection, stale-ID, and explicit unresolved equipment round-trip through snapshot clone, fingerprint, autosave, pagehide, saved records, duplicate, load, backup, preview, and restore.
- [ ] The persistence parser reconstructs equipment into typed plain data and never trusts a cast.
- [ ] Unsupported schema versions, invalid slot topology/discriminants/types, unsafe IDs/ranks, oversized arrays/strings, non-plain objects, and dangerous keys are rejected with bounded diagnostics before hydration.
- [ ] An invalid backup is not partially applied.
- [ ] Nullable equipment catalog/set facts participate in freshness without rejecting older envelope-v1 records that omit them.
- [ ] A build containing authored equipment shows consistent omission warnings in template export and Share Controls; an empty materialized loadout does not.
- [ ] Skill-template codes, exact-source replay, projection fingerprints, share URL payload/version, URL limit, and startup URL import remain equipment-free and backward compatible.
- [ ] Importing a skill template over authored equipment explicitly warns that the loadout will be replaced.

### Accessibility, Regression, and Closeout

- [ ] Tabs, comboboxes, disclosures, clear/remove actions, inline issues, and detail views have programmatic labels, visible focus, logical focus order, keyboard behavior, and appropriate live/status announcements.
- [ ] The equipment editor remains usable without horizontal page overflow at narrow widths and with long catalog/unresolved labels.
- [ ] No equipment interaction requires drag/drop, hover, remote media, or pointer input.
- [ ] Existing skill, profession, attribute, template, sharing, library, storage recovery, backup, and raw equipment-template compatibility tests pass.
- [ ] Documentation records implemented behavior, security limits, arithmetic caveats, and deferred skins/dyes/colors, raw equipment-template conversion, runtime icons, advanced analysis, party equipment, and backend sync.
- [ ] EPIC-16 can carry `Build.equipment` with each build without adopting single-editor tab or combobox state.
- [ ] BW-1401 through BW-1408, EPIC-14, SPRINT-015, ledger, and run manifests agree.
- [ ] `npm run verify` passes without runtime network access.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Adding four catalogs makes one bad equipment artifact take down the skill editor. | Medium | High | Keep core readiness outermost and model each equipment family as an independent ready/error slice. |
| Reducer logic becomes coupled to changing catalog facts. | Medium | High | Address semantic slots only; keep handedness, eligibility, and compatibility in selectors/domain helpers. |
| Context filters erase or hide old invalid selections. | High | High | Separate selected-value resolution from offered options and test profession/mode/catalog changes with retained state. |
| Selecting a two-handed weapon silently deletes an off-hand or vice versa. | Medium | High | Filter conflicting new choices and never cascade authored-state deletion; preserve existing conflicts for repair. |
| Modifier controls create duplicate occupied slots. | Medium | Medium | Filter add options against current resolved slots and retain domain validation for malformed/imported arrays. |
| Effective-rank display overstates a result when a rune is unresolved. | Medium | High | Label partial evidence, expose unresolved reasons, and defer requirement conclusions to domain validation. |
| Health/energy totals imply unsupported full simulation. | High | High | Separate armor and per-set lanes; include only unconditional structured effects with explicit composition semantics. |
| Mutually exclusive weapon sets are summed together. | Medium | High | Never create a cross-set weapon total until an explicit active-set/combat-state model exists. |
| Persistence silently drops equipment after a visible edit. | Medium | Critical | Treat the sprint as one release unit; block release until deep clone, autosave, hydration, backup, and restart tests pass. |
| Strict persistence rejects useful semantic uncertainty. | Medium | Medium | Reject structural/type ambiguity but explicitly accept bounded unresolved selection objects and unknown catalog IDs. |
| Keeping local envelope v1 makes migration behavior ambiguous. | Low | Medium | Treat equipment as an already-declared optional build field with its own version; normalize absent additive freshness keys and test old bytes. |
| Searchable custom combobox behavior is inaccessible or fragile. | Medium | High | Use one tested ARIA pattern, native focus semantics, bounded options, no focus trap, and keyboard-only end-to-end tests. |
| Selector work turns `editor-selectors.ts` into an unmaintainable monolith. | High | Medium | Put equipment-specific filtering and summary projections in dedicated app modules and keep orchestration in `editor-selectors.ts`. |
| UI option filtering and domain validation disagree. | Medium | High | Use filters only to constrain new edits, reuse domain helpers, preserve validation as authority, and test retained contradictions. |
| Equipment omission warnings accidentally block or alter template exports. | Medium | High | Derive one presentation warning outside codec/projection logic and assert byte/fingerprint compatibility. |
| Equipment catalog versions make every old save appear invalid. | Medium | Medium | Normalize absent metadata to null/unknown; freshness remains advisory and separate from parse validity. |
| Large result lists or crafted persisted arrays degrade responsiveness. | Low | High | Pre-index catalogs, cap query/render counts, check collection bounds before traversal, and retain diagnostic/issue caps. |
| The sprint absorbs EPIC-20 or EPIC-21 scope. | Medium | High | Limit search to MVP equipment selection, details to structured facts, and arithmetic to explicitly safe deltas; document richer search/tooltips/analysis handoffs. |

## Security

- Treat local storage, backup JSON, URL-derived drafts, catalog JSON, unresolved labels/reasons, selection IDs, authored requirements, search text, and validation messages as untrusted at their respective boundaries.
- Reject dangerous keys recursively before migration or hydration. Reconstruct accepted plain objects field by field so unknown properties, prototypes, accessors, and catalog-record copies do not enter editor state.
- Validate all known/candidate catalog IDs as non-negative safe integers. Validate schema versions, enum discriminants, slot identifiers, modifier indices, and requirement ranks against closed bounds.
- Check armor, weapon-set, modifier, record, string, and diagnostic limits before recursive work. Do not use repeated whole-catalog scans inside row rendering; adapt duplicate-safe indexes once.
- Bound combobox query length and rendered results. Use literal case-folded string matching only; do not construct regular expressions, selectors, URLs, HTML, CSS, or code from user input.
- Render all names, labels, reasons, notes, and messages through React text nodes. Do not use `dangerouslySetInnerHTML` or interpret catalog/source prose as markup.
- Never fetch or render remote equipment media. Placeholder descriptors may carry inert `iconId` metadata but no runtime URL, `img`, preload, canvas, or background-image path.
- Do not navigate to catalog `wikiUrl` from picker/detail controls in this sprint. Attribution links remain bounded, HTTPS, `noopener noreferrer`, and created at the catalog boundary.
- Do not put semantic equipment, unresolved text, or catalog records into skill-template/share URL fragments. This preserves the existing 1,800-character, skill-template-only attack surface.
- Keep backup restore atomic: parse and validate the whole candidate envelope/plan before applying merge or replace operations. A rejected payload must not overwrite the durable library.
- Preserve local-storage corruption and revision-conflict write blocks so an equipment autosave cannot overwrite data that failed parsing or freshness checks.
- Reducers, selectors, parsers, and summaries must not mutate imported catalogs, caller arrays, snapshots, builds, or unresolved objects.
- Keep `src/domain` free of React, DOM/browser APIs, storage, app imports, generated data, source artifacts, wiki APIs, and template codec imports.
- Add no dependency. Any proposed combobox, schema, or state package requires a sprint amendment, license/supply-chain review, bundle review, and revised verification plan.

## Dependencies

- `EPIC-01` / `SPRINT-002`: source-policy rules and metadata-only media decisions.
- `EPIC-03` / `SPRINT-004`: promoted profession/attribute catalog, primary-profession attributes, and template crosswalks.
- `EPIC-04` / `SPRINT-005`: promoted skill catalog and current app catalog boundary precedent.
- `EPIC-05` / `SPRINT-006`: raw skill/equipment template compatibility and exact-source replay that must remain isolated.
- `EPIC-06` / `SPRINT-007`: rule engine, validation locations/results, effective attribute ranks, issue caps, and editing profile.
- `EPIC-07` / `SPRINT-008`: visual prior-art direction and placeholder/media constraints.
- `EPIC-08` / `SPRINT-009`: editor reducer, selectors, app composition, accessible component conventions, skill tooltips, and responsive shell.
- `EPIC-09` / `SPRINT-010`: local-library envelope, autosave, snapshot fingerprints, backup/restore, skill-template sharing, dirty guards, and storage failure behavior.
- `EPIC-10` / `SPRINT-011`: promoted rune catalog and attribute-rune summary semantics.
- `EPIC-11` / `SPRINT-012`: promoted insignia catalog and per-armor-slot effect projection.
- `EPIC-12` / `SPRINT-013`: matched weapon/modifier catalogs, compatibility helper, weapon facts, and template crosswalk boundary.
- `EPIC-13` / `SPRINT-014`: `EquipmentLoadout`, canonical topology, constructors, unresolved selections, rank adjustments, weapon-set analysis, optional validation catalogs, and equipment issue locations.
- Future `EPIC-16`: multi-build workspace should persist the complete `Build`, including equipment, while defining its own selected-build and UI-navigation state.
- Future `EPIC-17`: semantic conversion between raw equipment templates and `EquipmentLoadout` with exact-source preservation.
- Future `EPIC-20`: broader cross-catalog search and richer tooltip/media behavior beyond MVP equipment pickers and structured fact details.
- Future `EPIC-21`: active-set/condition evaluation, complete armor/effect/stat aggregation, combat analysis, and recommendations.
- React 19, TypeScript 5.9, Vitest 4, Testing Library, Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and existing repository setup for `npm run verify`.
- No new runtime, development, data, or network dependency is planned.

## Open Questions

These are implementation checkpoints, not planning blockers. Use the stated default unless code or test evidence requires a recorded sprint amendment.

1. **Equipment tab state**: Should the active Skills/Equipment tab persist across reloads? Default: no. It is ephemeral editor UI state and hydration returns to Skills.
2. **Partial catalog errors**: Should one broken equipment catalog disable the whole equipment tab? Default: no. Disable only dependent controls; retain structural display, validation, and ready catalog families.
3. **Null versus empty**: Should visiting Equipment initialize a loadout? Default: no. Materialize on the first non-empty edit; individual clears keep an empty loadout; explicit removal returns to null.
4. **Known-incompatible choices**: Should pickers allow users to create invalid state for experimentation? Default: no for new choices. Offer compatible and labeled indeterminate options; preserve existing incompatible state for validation and repair.
5. **Persisted topology**: Should local data preserve duplicate/missing armor or weapon-set rows? Default: no. The app writes and accepts canonical fixed topology; semantic unresolved selections remain recoverable, while structural ambiguity is rejected.
6. **Envelope version**: Does adding equipment require local-library schema 2? Default: no. The existing build field is nullable and the loadout has its own schema version; additive freshness fields normalize missing values to null. Bump only if implementation reveals a wire-incompatible change.
7. **Arithmetic scope**: Should unconditional modifier deltas be combined with armor totals? Default: present always-on armor separately and show modifier deltas per weapon set. Do not imply an active set or add across sets.
8. **Equipment details**: Should this sprint add a sticky equipment tooltip analogous to skills? Default: no. Use accessible inline/expandable structured details and leave rich global tooltip behavior to EPIC-20.
9. **Template import**: Should importing a skill template preserve current equipment? Default: no. Preserve the established replace-draft meaning, explicitly warn when authored equipment will be replaced, and hydrate the imported skill-template draft with `equipment: null`.
10. **Requirement input range**: What authored rank range should the unresolved requirement editor allow? Default: reuse the current supported effective-attribute editor range and persistence bound; block wider values rather than inventing new requirement semantics.