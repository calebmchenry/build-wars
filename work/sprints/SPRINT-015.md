---
id: SPRINT-015
title: Equipment Editor
status: completed
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

This sprint turns the EPIC-13 semantic equipment shell into a user-facing editor. A user can set
armor runes, insignias, headgear attribute bonuses, weapons, weapon modifiers, and requirement
notes for one build while preserving existing skill-editor workflows.

EPIC-10, EPIC-11, and EPIC-12 remain the source of rune, insignia, weapon, and modifier facts.
Runtime generated imports stay behind the app catalog boundary, authored builds store only semantic
equipment selections, and unresolved or stale selections remain visible and recoverable.

The sprint does not add raw equipment-template import/export, exact template replay, equipment share
URL payloads, icons, skins, dyes, color IDs, acquisition facts, recommendations, DPS, party
equipment, or full combat/stat aggregation. Skill-template sharing remains skill-template-first and
must honestly warn when meaningful local equipment is omitted.

## Assumptions

1. EPIC-14 can be planned as one sprint because BW-1401 through BW-1408 are groomed, ready, and
   dependency ordered.
2. The existing app catalog boundary, reducer, selector, component, local-library, and validation
   patterns are the right architecture for this work.
3. No backend, new route, hosted service, or new runtime dependency is required for the MVP editor.
4. The non-interactive ticket-burn contract allows routine architecture defaults to be recorded here
   without an interview because no blocking high-risk choice was identified.

## Use Cases

1. **Open untouched builds**: Existing builds with `equipment: null` open without dirtying,
   autosaving, or showing equipment warnings.
2. **Start equipment editing**: The first meaningful equipment edit materializes canonical equipment
   state and applies only the requested change.
3. **Edit armor**: A user can set and clear runes, insignias, and the headgear attribute bonus across
   the five fixed armor slots.
4. **Edit weapons**: A user can set and clear main-hand, off-hand, two-handed, empty, unresolved, and
   stale weapon selections across four weapon sets.
5. **Edit modifiers**: A user can select compatible prefix, suffix, inscription, and other modifier
   slots where EPIC-12 data supports them, while retained incompatible modifiers remain visible and
   clearable.
6. **Recover stale choices**: A saved selection whose catalog ID is now missing or incompatible is
   displayed as retained authored state, not silently deleted.
7. **Understand legality**: Equipment validation issues appear inline near affected controls and in
   the existing validation surface without creating a second rules engine.
8. **See conservative effects**: The UI can show safe health, energy, armor notes, requirement notes,
   and attribute-rank adjustments without claiming unsupported full stats.
9. **Persist locally**: Autosave, saved builds, duplication, hydration, and backup/restore preserve
   canonical semantic equipment.
10. **Share honestly**: Skill-template URLs stay within the existing template envelope and warn when
    meaningful equipment is local-only.

## Architecture

### Binding Decisions

1. The app uses peer main-column workspace tabs: `Skills` and `Equipment`. `Skills` contains the
   existing `SkillBar` and `SkillBrowser`; `Equipment` contains the equipment editor. `Skills` is the
   default tab, and skill-specific tooltip UI is scoped to that tab.
2. `Build.equipment` remains nullable. Opening or rendering the equipment tab does not materialize
   equipment. The first meaningful edit creates a canonical loadout. Clearing ordinary fields leaves
   an empty canonical loadout. Explicit remove/reset returns to `null`.
3. Empty canonical equipment is not meaningful equipment for share/export omission warnings.
4. Reducers remain catalog-independent and structural. Selectors and view models own option
   filtering, retained invalid presentation, inline issue placement, and meaningful-equipment
   detection. Domain validation remains authoritative.
5. Generated JSON imports remain isolated to `src/app/catalogs.ts`. Leaf components receive
   app-owned catalog views and must not import generated data, manifests, source plans, QA reports,
   snapshots, wiki modules, or media bytes.
6. Catalog readiness degrades by family where practical: runes, insignias, weapons, and weapon
   modifiers. A failed modifier catalog does not disable armor editing, and every failure state keeps
   clear/reset actions available.
7. No selection is silently deleted because profession, mode, catalog, weapon, or compatibility facts
   change. Filtering can make a value invalid or retained, but authored state remains recoverable.
8. Weapon-set-local effects are not aggregated as character-wide totals until active-set semantics
   exist.
9. User-visible completion is gated on durable persistence. The editor is not done until autosave,
   hydration, duplication, backup/restore, and skill-template omission messaging are proven.
10. No new runtime dependency is planned for pickers. The custom combobox must stay narrow and tested.

### Data Flow

```text
generated EPIC-10/11/12 catalogs
  -> src/app/catalogs.ts
  -> app equipment catalog views and readiness slices
  -> equipment selectors and picker view models
  -> Equipment workspace components
  -> editor reducer actions
  -> Build.equipment semantic state
  -> validation input, persistence, library, backup/restore, share warnings
```

### State Boundaries

- `src/app/catalogs.ts` is the only runtime generated-data import boundary.
- `src/app/equipment-editor-state.ts` should own equipment mutations if local patterns allow it.
  `src/app/editor-state.ts` composes those actions into the existing reducer.
- `src/app/equipment-selectors.ts` should own equipment-specific view models, option filtering,
  retained-selection labels, issue grouping, summaries, and `selectHasMeaningfulEquipment()`.
- Existing editor selectors compose cross-feature workflows only: validation input, effective
  attribute-rank context, share/template status, and library freshness facts.
- Components render view models and dispatch intentful actions; they do not duplicate legality rules.

### Persistence And Sharing

Persistence accepts only canonical app-authored semantic equipment topology. Malformed equipment,
dangerous object keys, sparse arrays, duplicate topology, wrong bounds, and ambiguous structures are
rejected at the persistence boundary. Domain validation can still report malformed in-memory
equipment for non-persistence callers.

Skill-template URLs and exact-source skill template replay remain equipment-free. Meaningful
equipment triggers clear omission warnings; `equipment: null` and canonical empty equipment do not.
Equipment-only validation issues must not block skill-template export.

## Implementation

### Phase 0: Planning Baseline And Contract Freeze (~5%)

**Files:**

- `work/sprints/SPRINT-015.md` - Execution source of truth.
- `work/tickets/14-equipment-editor/*.md` - Ticket status and sprint traceability during execution.
- Existing test and build configuration - Baseline verification.

**Tasks:**

- [x] Mark `SPRINT-015` and BW-1401 through BW-1408 in progress when execution starts.
- [x] Run `npm run verify` before implementation and record any unrelated pre-existing failures.
- [x] Record the schema compatibility decision before enabling equipment writes. Default to schema
      version 1 only if old `equipment: null` records still parse and new non-null records have a
      clearly owned reader contract.
- [x] Freeze clear/reset semantics, meaningful-equipment detection, tab focus behavior, catalog
      readiness slices, modifier-array invariants, and no-new-dependency picker scope.
- [x] Capture a lightweight bundle/startup baseline before adding four static equipment catalog
      imports.

### Phase 1: BW-1401 Catalog Boundary, State, And Early Contracts (~14%)

**Files:**

- `src/app/catalogs.ts` - Add equipment catalog views, versions, attribution, and bounded readiness
  diagnostics.
- `src/app/equipment-editor-state.ts` - Create structural equipment mutation helpers if useful.
- `src/app/editor-state.ts` - Compose equipment actions into the existing reducer.
- `src/app/equipment-selectors.ts` - Create initial equipment selectors and meaningful-equipment
  predicate.
- `src/app/editor-selectors.ts` - Pass equipment catalogs into validation and effective-rank inputs.
- Tests near existing app catalog, reducer, selector, and persistence-schema tests.

**Tasks:**

- [x] Import promoted rune, insignia, weapon, and weapon-mod catalogs only through
      `src/app/catalogs.ts`.
- [x] Expose per-family readiness for rune, insignia, weapon, and modifier data, including catalog
      version and attribution facts where available.
- [x] Keep core profession, attribute, skill, library, and share workflows operational if an equipment
      catalog slice fails to adapt.
- [x] Add reducer actions for armor, headgear, weapon, modifier, authored unresolved, clear field,
      clear hand, clear set, and explicit remove/reset equipment.
- [x] Prove `equipment: null` stays untouched on render/open and first meaningful edit atomically
      materializes canonical loadout.
- [x] Add early contract tests for canonical non-null equipment parsing, cloning, fingerprints, and
      rejection of dangerous keys or malformed topology, even if full autosave wiring lands in
      Phase 7.
- [x] Pass equipment catalog facts to existing domain validation without introducing a UI-specific
      validator.

### Phase 2: BW-1402 Workspace Tabs And Panel Shell (~10%)

**Files:**

- `src/app/App.tsx` - Add main-column `Skills` and `Equipment` workspace tabs.
- `src/app/components/EditorWorkspaceTabs.tsx` - Create or extend a tab wrapper for the main editor
  surface.
- `src/app/components/EquipmentPanel.tsx` - Add the equipment panel shell and top-level degraded
  states.
- App component tests.

**Tasks:**

- [x] Keep `Skills` as the default tab and preserve existing skill search, skill bar, tooltip, share,
      validation, and left-column workflows.
- [x] Render the equipment panel without materializing equipment or marking the build dirty.
- [x] Show high-level equipment readiness, selected-build context, and validation count without using
      generated records directly in the component.
- [x] Keep clear/reset operations reachable when one or more equipment catalog slices fail.
- [x] Verify responsive layout across desktop and mobile widths without horizontal overflow or text
      overlap.

### Phase 3: BW-1403 Searchable Equipment Pickers (~12%)

**Files:**

- `src/app/components/EquipmentCombobox.tsx` - Shared narrow picker primitive.
- `src/app/equipment-selectors.ts` - Option view models for runes, insignias, weapons, modifiers,
  attributes, retained selections, and unresolved placeholders.
- Component and selector tests.

**Tasks:**

- [x] Implement keyboard, pointer, touch, outside-click, focus restoration, IME composition,
      long-label, no-result, and disabled-option behavior.
- [x] Give every option a stable ID, accessible label, bounded metadata, and deterministic ordering.
- [x] Preserve already-authored invalid, stale, or unresolved selections as selected and clearable.
- [x] Prefer disabled options with reasons where discoverability matters; filter only where the
      option is clearly irrelevant or too noisy.
- [x] Cap rendered results and test the active-option behavior when the full result set is larger
      than the rendered subset.
- [x] Avoid adding a generic picker framework beyond the equipment editor's current needs.

### Phase 4: BW-1404 Armor Controls (~13%)

**Files:**

- `src/app/components/ArmorEquipmentEditor.tsx` - Five fixed armor rows or slots.
- `src/app/equipment-selectors.ts` - Armor view models, effective-rank adjustments, and inline issue
  grouping.
- `src/app/editor-selectors.ts` - Compose equipment rank adjustments into existing skill tooltip and
  validation inputs.
- App and domain-adjacent tests.

**Tasks:**

- [x] Render exactly five fixed armor slots in canonical EPIC-13 order.
- [x] Support rune and insignia selection, clearing, retained stale IDs, unresolved selections, and
      per-slot validation messages.
- [x] Support headgear attribute bonus selection for the primary profession and preserve unresolved
      or stale choices without false certainty.
- [x] Feed equipment attribute-rank adjustments into existing effective-rank display without changing
      base attribute allocation semantics.
- [x] Keep armor behavior independent from weapon and modifier catalog failures.
- [x] Avoid armor skins, dyes, color IDs, icons, inventory identity, or acquisition facts.

### Phase 5: BW-1405 Weapon Set Controls (~14%)

**Files:**

- `src/app/components/WeaponSetEditor.tsx` - Four weapon-set rows and hand/modifier controls.
- `src/app/equipment-selectors.ts` - Weapon, modifier, occupancy, requirement, and compatibility
  view models.
- Reducer and component tests.

**Tasks:**

- [x] Render exactly four weapon sets with stable set identities and no array-position leakage beyond
      the canonical EPIC-13 topology.
- [x] Support empty, main-hand, off-hand, two-handed, off-hand-only, unresolved, and stale selections.
- [x] Preserve modifiers when a weapon is changed or cleared unless the user explicitly clears the
      modifier or set.
- [x] Enforce modifier-array invariants: no sparse entries, bounded lengths, deterministic ordering,
      exact occupied-slot semantics, and clear errors for duplicates.
- [x] Show two-handed/off-hand conflicts, wrong-hand retained weapons, missing weapon with modifiers,
      weapon/modifier catalog-set mismatch, and requirement warnings through validation and inline
      messages.
- [x] Keep authored requirement fallback data schema-capable, but expose visible fallback controls
      only for a verified unresolved requirement case.
- [x] Do not aggregate set-local weapon effects as global build stats.

### Phase 6: BW-1406 Equipment Display And Conservative Stats (~10%)

**Files:**

- `src/app/components/EquipmentSummary.tsx` - Concise equipment summary and selected-value facts.
- `src/app/equipment-selectors.ts` - Summary, validation-unavailable, and attribution view models.
- Existing validation display components.
- Tests for conservative summaries.

**Tasks:**

- [x] Show selected upgrades, unresolved selections, retained stale choices, health/energy deltas,
      armor notes, requirement notes, and attribution where supported by catalogs.
- [x] Display "validation unavailable" or equivalent degraded messaging when catalog-backed equipment
      validation cannot run completely.
- [x] Keep global validation results complete while also rendering location-specific messages near
      affected controls.
- [x] Avoid parsing numeric effects from prose or inventing stacking rules.
- [x] Distinguish character-wide facts from weapon-set-local notes in data structures and UI copy.
- [x] Keep summaries useful but secondary to correct editing, validation, and persistence.

### Phase 7: BW-1407 Persistence, Durability, Validation, And Sharing (~18%)

**Files:**

- `src/app/persistence-schema.ts` - Accept strict canonical semantic equipment and remove the current
  `unsupported-equipment` rejection for valid app-authored loadouts.
- `src/app/local-library.ts` and related selectors/tests - Persist, duplicate, hydrate, fingerprint,
  and report freshness for equipment-aware builds.
- `src/app/components/ShareControls.tsx` and template import/export components - Add omission and
  import-discard warnings.
- Backup/restore modules and tests.

**Tasks:**

- [x] Round-trip `equipment: null`, canonical empty equipment, one armor edit, one weapon edit, mixed
      armor/weapon edits, unresolved selections, and retained stale selections through autosave,
      saved builds, duplicate, reload, and backup/restore.
- [x] Reject malformed persisted equipment with bounded diagnostics: dangerous keys, noncanonical
      topology, sparse arrays, duplicate slots, unbounded strings, invalid indexes, and ambiguous
      modifier structures.
- [x] Ensure one invalid restored record does not corrupt valid restored records; document whether
      backup import is per-record partial success or atomic rejection.
- [x] Handle localStorage quota/write failures and interrupted writes through existing error paths.
- [x] Include equipment catalog freshness facts without making old saves noisy or invalid.
- [x] Keep share URLs equipment-free, within the existing 1,800-character cap, and blocked only by
      skill-template constraints, not equipment-only validation issues.
- [x] Warn before skill-template import replaces authored meaningful equipment with `null`.
- [x] Add raw-template, cosmetic-field, generated-import, and remote-media `rg` scans to verification.
- [x] Treat this phase as the release gate for the equipment editor.

### Phase 8: BW-1408 Accessibility, Verification, Documentation, And Closeout (~4%)

**Files:**

- User-facing docs or existing README notes if the project has an appropriate local place.
- `work/tickets/14-equipment-editor/*.md` - Execution status and completion notes.
- `work/sprints/SPRINT-015.md` and `work/sprints/ledger.tsv` - Sprint status after execution.

**Tasks:**

- [x] Run the full verification suite: `npm run verify`.
- [x] Run focused app/component/domain persistence tests added during the sprint.
- [x] Verify keyboard-only editing, screen-reader labels, focus order, mobile layout, and long labels
      for armor, weapon, and picker controls.
- [x] Verify generated data, manifests, source plans, QA reports, snapshots, media bytes, and wiki API
      helpers do not leak into runtime leaf components.
- [x] Update ticket records with completed sprint traceability and closeout notes.
- [x] Mark `SPRINT-015` complete only after all BW-1401 through BW-1408 acceptance criteria pass.

## Files Summary

| File                                          | Action        | Purpose                                                                                                 |
| --------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `src/app/catalogs.ts`                         | Modify        | Add runtime equipment catalog views behind the existing app boundary.                                   |
| `src/app/equipment-editor-state.ts`           | Create        | Keep structural equipment mutation helpers out of the main reducer.                                     |
| `src/app/equipment-selectors.ts`              | Create        | Own equipment option, retained selection, summary, issue, and meaningful-equipment view models.         |
| `src/app/editor-state.ts`                     | Modify        | Compose equipment reducer actions without importing catalogs.                                           |
| `src/app/editor-selectors.ts`                 | Modify        | Compose validation, rank, freshness, and share inputs from equipment selectors.                         |
| `src/app/App.tsx`                             | Modify        | Add main-column `Skills` and `Equipment` workspace tabs.                                                |
| `src/app/components/EditorWorkspaceTabs.tsx`  | Create/Modify | Provide the tabbed editor surface.                                                                      |
| `src/app/components/EquipmentPanel.tsx`       | Create        | Top-level equipment editor shell and degraded states.                                                   |
| `src/app/components/EquipmentCombobox.tsx`    | Create        | Narrow accessible equipment picker primitive.                                                           |
| `src/app/components/ArmorEquipmentEditor.tsx` | Create        | Armor rune, insignia, and headgear controls.                                                            |
| `src/app/components/WeaponSetEditor.tsx`      | Create        | Weapon-set, hand, modifier, and requirement controls.                                                   |
| `src/app/components/EquipmentSummary.tsx`     | Create        | Conservative selected equipment facts and validation-unavailable messaging.                             |
| `src/app/persistence-schema.ts`               | Modify        | Accept strict canonical non-null semantic equipment and reject malformed persisted equipment.           |
| `src/app/local-library.ts`                    | Modify        | Persist, clone, hydrate, fingerprint, and restore equipment-aware saved builds.                         |
| `src/app/share-url.ts`                        | Modify/Test   | Preserve equipment-free skill-template URL behavior and the existing size cap.                          |
| `src/app/components/ShareControls.tsx`        | Modify        | Warn when meaningful equipment is omitted from skill-template sharing.                                  |
| `test/**` and app `*.test.ts(x)` files        | Modify/Create | Cover catalog, reducer, selector, component, persistence, restore, sharing, and accessibility behavior. |
| `work/tickets/14-equipment-editor/*.md`       | Modify        | Track execution and closeout against BW-1401 through BW-1408.                                           |

## Definition Of Done

- [x] Equipment generated imports are isolated to `src/app/catalogs.ts`; leaf components do not import
      generated catalogs, manifests, QA reports, snapshots, source plans, wiki helpers, or media.
- [x] Equipment catalog readiness degrades independently enough that unrelated skill editing and
      unaffected equipment families remain usable.
- [x] `equipment: null` remains untouched by render/open and by no-op clears.
- [x] First meaningful edit materializes canonical equipment exactly once.
- [x] Clearing the last ordinary field leaves canonical empty equipment; explicit remove/reset returns
      to `null` with confirmation when authored meaningful equipment would be lost.
- [x] Empty canonical equipment does not trigger share/export omission warnings.
- [x] Armor UI renders five canonical slots and supports runes, insignias, headgear attribute bonus,
      unresolved selections, stale selections, inline issues, and clear/reset recovery.
- [x] Weapon UI renders four canonical sets and supports main hand, off hand, two-handed, off-hand-only,
      empty, unresolved, stale, modifier, compatibility, and requirement states.
- [x] Modifier arrays cannot become sparse, unbounded, duplicated, or ambiguously ordered.
- [x] Profession, mode, catalog, weapon, and compatibility changes never silently delete authored
      equipment.
- [x] Equipment rank adjustments integrate with existing effective-rank display without changing base
      attribute allocation semantics.
- [x] Summaries are conservative and distinguish global character facts from set-local notes.
- [x] Domain validation remains authoritative; UI filtering does not become a parallel legality engine.
- [x] Missing catalog-backed validation produces explicit degraded or unavailable messaging.
- [x] Valid semantic equipment persists through autosave, saved builds, duplicate, hydration, reload,
      backup, and restore.
- [x] Malformed persisted equipment is rejected with bounded diagnostics and cannot pollute valid
      restored records.
- [x] LocalStorage write failures and interrupted writes use existing user-visible error paths.
- [x] Equipment catalog freshness facts are recorded without making old `equipment: null` saves stale
      or invalid.
- [x] Skill-template share URLs stay equipment-free, respect the existing size cap, and are not blocked
      by equipment-only validation issues.
- [x] Skill-template import warns before discarding meaningful authored equipment.
- [x] Keyboard, focus, ARIA labels, mobile layout, IME composition, long labels, and no-result picker
      behavior are verified.
- [x] Boundary scans find no raw equipment-template exact-replay, cosmetic, generated-data, remote
      media, or wiki API leaks into the EPIC-14 runtime surface.
- [x] `npm run verify` passes, or any unrelated pre-existing failure is documented before and after
      with no regression.
- [x] BW-1401 through BW-1408 have completion notes and traceability to `SPRINT-015`.

## Verification Plan

- `npm run verify`
- Focused catalog-boundary and generated-import tests.
- Reducer tests for null/empty/materialize/clear/reset and non-cascading equipment changes.
- Selector tests for meaningful equipment, retained invalid values, degraded catalog slices,
  validation issue grouping, summaries, and omission warnings.
- Component tests for tabs, panel shell, armor controls, weapon controls, picker keyboard behavior,
  focus restoration, and inline validation.
- Persistence tests for strict parsing, cloning, fingerprints, autosave, duplicate, hydration,
  backup/restore, malformed records, quota/write failures, and mixed valid/invalid restore inputs.
- Share/template tests for equipment-free payloads, warnings, import discard behavior, URL size cap,
  and equipment-only validation independence.
- Boundary scans with `rg` for generated imports, raw equipment-template fields, cosmetics, remote
  fetch/media paths, and source-policy artifacts.

## Risks And Mitigations

| Risk                                                 | Likelihood | Impact | Mitigation                                                                                                                            |
| ---------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Static equipment catalogs increase startup cost.     | Medium     | Medium | Capture a baseline in Phase 0 and compare after Phase 1; keep adapters lean and avoid importing non-runtime artifacts.                |
| Picker accessibility becomes larger than expected.   | Medium     | High   | Keep the combobox primitive narrow, test keyboard/ARIA/IME/touch behavior, and avoid adding generalized features.                     |
| Selector logic becomes a monolith.                   | Medium     | Medium | Put equipment-specific filtering, summaries, issues, and predicates in `equipment-selectors.ts`; keep editor selectors compositional. |
| UI filtering disagrees with domain validation.       | Medium     | High   | Treat validation as authoritative and test retained invalid options plus inline/global issue consistency.                             |
| Catalog failures disable too much of the editor.     | Medium     | High   | Use per-family readiness where practical and always keep clear/reset operations available.                                            |
| Persistence compatibility is discovered too late.    | Medium     | High   | Add early parser/clone/fingerprint/schema contract tests and block release until Phase 7 durability passes.                           |
| Weapon edits silently drop modifiers or stale state. | Medium     | High   | Define reducer invariants for clear hand, clear weapon, clear set, replacement, and explicit reset.                                   |
| Share/export warnings become noisy.                  | Low        | Medium | Use a single `selectHasMeaningfulEquipment()` predicate that excludes `null` and canonical empty equipment.                           |
| Conservative stats imply unsupported certainty.      | Medium     | Medium | Limit summaries to safe catalog facts and label set-local notes separately from global facts.                                         |

## Security Considerations

- Persisted equipment parsing must reject dangerous object keys, prototype-pollution shapes,
  unbounded strings, unexpected arrays, and noncanonical topology.
- Equipment labels, unresolved placeholders, source names, and diagnostics must render as text, never
  HTML.
- Runtime app code must not fetch remote icons or media as part of EPIC-14.
- Backup/restore must isolate malformed records and provide bounded diagnostics without leaking raw
  imported payloads into the UI.
- Share URLs must not include semantic equipment payloads or generated catalog records.

## Dependencies

- EPIC-06 through EPIC-13 are complete enough for planning, with EPIC-13 providing the semantic
  equipment shell.
- EPIC-10, EPIC-11, and EPIC-12 provide promoted runtime catalog facts for runes, insignias, weapons,
  and modifiers.
- The canonical validation command remains `npm run verify`.

## Open Questions

These are implementation checkpoints, not planning blockers:

1. Phase 0 must record whether accepting non-null equipment requires a persistence envelope version
   bump or can remain schema version 1 with strict app-authored topology.
2. Visible authored requirement fallback controls should ship only if current catalog data proves
   there is a user-facing unresolved requirement case.
3. If measured startup cost is too high after static imports, decide whether to split app-owned
   equipment catalog views without leaking generated artifacts into components.

## Execution Closeout

- Completed in SPRINT-015.
- Schema compatibility decision: local-library schema version remains `1`; old `equipment: null`
  records still parse, and new non-null records are accepted only through the strict app-authored
  semantic equipment reader contract.
- Clear/reset semantics: no-op clears preserve `equipment: null`; first meaningful edits
  materialize canonical topology; ordinary clears leave canonical empty equipment; explicit reset
  returns to `null` with confirmation when meaningful equipment exists.
- Bundle/startup observation: baseline build before equipment imports was `8,988.09 kB` JS and
  `702.31 kB` gzip. Final SPRINT-015 build was `9,741.07 kB` JS and `762.09 kB` gzip, with the
  existing Vite large chunk warning still present.
- Validation completed with `npm run verify`.
