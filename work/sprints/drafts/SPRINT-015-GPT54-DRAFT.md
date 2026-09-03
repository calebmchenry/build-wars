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

This sprint turns `EPIC-14 Equipment Editor` into the first app-owned equipment workflow for the
existing single-character editor. It extends the approved runtime catalog boundary to promoted
EPIC-10, EPIC-11, and EPIC-12 data, wires EPIC-13 semantic equipment into app reducer and selector
flows, adds an in-editor equipment surface with searchable controls, and makes semantic equipment
durable in local saves and backups without changing the skill-template share contract.

Implementation order is the main constraint. The sprint should stabilize catalog adaptation, editor
actions, validation input, and equipment view models before building component-heavy controls.
Armor and weapon editing should land only after the shared picker primitive and panel shell are in
place. Persistence, backup/restore, and share/export messaging should land late, after UI and
selector contracts stop moving, because that is the highest compatibility-risk phase.

The sprint does not add equipment template-code import/export, raw template exact replay for
equipment, armor or weapon skins, dyes, color IDs, runtime icon fetching, party equipment, hosted
sharing, recommendations, DPS/combat simulation, or full equipment stat aggregation. Share URLs
remain skill-template-first and must not encode equipment.

Binding execution defaults:

1. `src/app/catalogs.ts` remains the only runtime generated-catalog import boundary. Equipment UI
   code receives app-owned views, versions, attribution, and placeholder descriptors only.
2. `Build.equipment` stays `null` until the first equipment edit. Rendering may treat `null` and an
   authored empty loadout similarly, but reducer actions must lazily initialize with
   `createEmptyEquipmentLoadout()` on write, not on first render.
3. Equipment option filtering, grouped inline issues, share-omission detection, and simple stat
   summaries belong in selector/view-model code, not leaf components. A dedicated
   `src/app/equipment-selectors.ts` module is preferred over overloading `editor-selectors.ts`.
4. The equipment surface should be an `editor-panel` in the existing `main-column`, between the
   skill bar and skill browser, with internal armor, weapon, and summary sections. This gives the
   controls horizontal space without overloading the current left-column stack.
5. Searchable pickers should use an app-owned accessible combobox/listbox pattern and must not add
   a new runtime dependency.
6. Equipment summaries are intentionally bounded to explainable effects: headgear and rune
   attribute-rank adjustments, deterministic health/energy deltas, armor notes, requirement notes,
   modifier notes, and unresolved state. Conditional or note-only effects stay as notes.
7. Local-library schema version should remain `1` unless implementation proves the existing envelope
   cannot absorb equipment safely. Backward-compatible parse and write behavior is the default.
8. Share and template export remain available when the skill-template path is otherwise valid, but
   both surfaces must explicitly warn when meaningful equipment state will be omitted.
9. Each phase must end with focused typecheck and Vitest gates. `npm run verify` is reserved for
   closeout after docs and durability work land.

## Use Cases

1. A user editing one build can open an equipment panel in the current app without navigating to a
   separate route or losing the skill-first workflow.
2. A user can set rune, insignia, and headgear choices for the five fixed armor slots while keeping
   empty, partial, and unresolved states recoverable.
3. A user can configure four weapon sets with main-hand, off-hand, two-handed, empty, and partial
   states, plus compatible modifier selections and visible requirement notes.
4. A user can search for runes, insignias, weapons, and modifiers by name without entering raw
   catalog IDs and can clear a choice without breaking loadout shape.
5. A user can understand selected equipment from concise summaries and note-based stats without the
   app pretending it has full combat or armor-total simulation.
6. Equipment validation issues appear near the affected armor slot or weapon set and still flow into
   the existing validation result contract.
7. A saved draft, saved record, or backup can round-trip valid semantic equipment, while malformed
   or unsafe payloads are rejected without corrupting the rest of the library.
8. A user can still export or share a skill template, but the app clearly states that equipment is
   saved locally and in backups only, not in the skill-template URL or template text.

## Architecture

| Area | Owns | Must Not Own |
| --- | --- | --- |
| `src/app/catalogs.ts` | Approved EPIC-10/11/12 JSON imports, equipment catalog validation, deterministic option arrays, equipment validation views, catalog versions, attribution additions, and placeholder icon descriptors. | Generated manifest imports, QA reports, source snapshots, Python tooling, wiki APIs, remote media fetches, or leaf-component-specific filtering logic. |
| `src/app/editor-state.ts` | Deterministic equipment actions, lazy loadout initialization, clear/reset helpers, and state preservation across unrelated build edits. | Catalog adaptation, search filtering, UI-only combobox state, or direct generated-data access. |
| `src/app/equipment-selectors.ts` plus `src/app/editor-selectors.ts` | Equipment panel view models, filtered picker options, issue grouping by armor slot and weapon set, simple stat summaries, validation input wiring, and share-omission policy. | Direct DOM behavior, mutable editor state, or raw generated catalog imports. |
| `src/app/components/*`, `src/app/App.tsx`, `src/app/styles.css` | Equipment panel layout, armor rows, weapon-set rows, picker interactions, inline summaries, responsive behavior, and accessibility semantics. | Domain rule ownership, persistence parsing, or generated artifact imports. |
| `src/app/persistence-schema.ts`, `src/app/local-storage.ts`, `src/app/backup-restore.ts` | Safe parse/clone/serialize/hydrate of semantic equipment, saved-with version facts, autosave compatibility, and restore preview/apply behavior. | UI-specific omission messaging or template export logic. |
| `src/app/template-workflow.ts`, `src/app/components/ShareControls.tsx`, `src/app/components/TemplateDialogs.tsx` | Detection and presentation of equipment omission from skill-template export/share paths. | Equipment serialization into template text or share URLs. |
| `src/domain/*` | Reused semantic equipment contracts, validation helpers, weapon compatibility, rune effects, and insignia effects. | React, browser APIs, storage, runtime JSON imports, or app presentation state. |

### Data Flow

```text
approved EPIC-03/04/10/11/12 runtime JSON
                  |
             src/app/catalogs.ts
                  |
   app-owned equipment catalog and validation views
                  |
  reducer actions <-> equipment selectors/view models
                  |
   equipment panel components + validation presentation
                  |
 persistence / backup / template-share omission messaging
```

### Catalog Boundary

The catalog boundary should grow by adaptation, not by leakage. `AppCatalogViews` should add an
equipment section that exposes:

- sorted rune, insignia, weapon, and weapon-modifier option collections
- lookup helpers keyed by numeric catalog ID
- validation slices matching `BuildValidationInput.equipmentCatalogs`
- version facts for runes, insignias, weapons, weapon modifiers, and weapon/mod catalog-set digest
- attribution/source-link additions for the newly promoted catalogs
- placeholder descriptors for equipment surfaces without rendering remote images

Filtering by profession, mode, armor slot, handedness, weapon family, and modifier-slot rules
should happen after adaptation, in selectors, using these app-owned views.

### Editor-State Contract

`createBlankBuild()` should continue to return `equipment: null`. New reducer actions should be
granular enough to preserve existing state invariants and to avoid sparse array mutation:

- initialize and clear whole-equipment state
- set or clear one armor-slot rune
- set or clear one armor-slot insignia
- set or clear the headgear attribute for the head slot
- set or clear one weapon hand selection
- set or clear one modifier entry for one weapon hand
- set or clear one authored fallback requirement field when EPIC-13 allows it

The reducer should preserve `equipment: null` for untouched builds, preserve authored unresolved
state, and treat invalid indexes or slot mismatches as typed no-ops, matching current reducer
conventions.

### UI Placement

The equipment surface should live in the existing `main-column`, not the left column. The current
left-column stack already owns library, profession/mode, attributes, templates, sharing, and
validation. Equipment controls need width for five armor rows, four weapon-set rows, search results,
and inline notes. A main-column `EquipmentPanel` placed between `SkillBar` and `SkillBrowser`
preserves one-screen editing and gives the new work the same panel styling and responsive behavior
already used elsewhere.

Internal panel structure should be:

1. panel header and status
2. armor section
3. weapon-set section
4. simple stats and notes section

On narrow widths, sections may collapse or stack, but the equipment panel should remain on the same
route and in the same DOM order.

### Validation, Freshness, and Share Boundaries

`selectValidationInput()` should begin passing `equipmentCatalogs` from app-owned validation views.
`selectValidationView()` and equipment-specific selectors should group location-based issues for
armor pieces, weapon sets, weapon hands, and weapon modifiers so inline UI can reuse the existing
domain result rather than inventing a parallel error model.

`PersistedCatalogFacts` and freshness comparison should expand to include equipment catalog versions
that affect durable authored state. At minimum, saved-with facts should include rune, insignia,
weapon, and weapon-modifier catalog versions, plus weapon/mod catalog-set alignment facts if those
are already available from validation without new duplication.

Share and template flows should use one shared selector such as `selectHasMeaningfulEquipment()` so
the omission warning rule is stable across `TemplateControls` and `ShareControls`. A non-null but
entirely empty loadout should not trigger a warning; any known or unresolved meaningful selection
should.

## Implementation

1. **Phase 0: Baseline and contract freeze.** Freeze the panel-placement decision, lazy-init policy,
   omission-warning rule, saved-with version fields, and simple-stat boundary before code churn
   starts. Add or tighten regression coverage for `equipment: null`, catalog-boundary isolation,
   current share/template behavior, and current storage rejection of non-null equipment so later
   phases prove each compatibility change intentionally. Verify with `npm run typecheck` and
   targeted Vitest runs for `src/app/catalog-boundary.test.ts`, `src/app/editor-state.test.ts`,
   `src/app/persistence-schema.test.ts`, `src/app/template-workflow.test.ts`, and
   `src/app/share-url.test.ts`.

2. **Phase 1: BW-1401 catalog boundary and state integration.** Expand `src/app/catalogs.ts` to
   import and validate the approved EPIC-10, EPIC-11, and EPIC-12 runtime catalogs and expose
   app-owned equipment views, versions, attribution, and placeholders. Add reducer helpers and
   equipment actions in `src/app/editor-state.ts`, plus selector wiring so `validateBuild` receives
   equipment catalogs and saved-with facts can later include equipment versions. Verify with
   `npm run typecheck` and targeted Vitest runs for `src/app/catalogs.test.ts`,
   `src/app/catalog-boundary.test.ts`, `src/app/editor-state.test.ts`, and
   `src/app/editor-selectors.test.ts`.

3. **Phase 2: BW-1402 equipment panel shell and responsive placement.** Add an equipment panel
   container in `src/app/App.tsx`, wire catalog-error and empty-state handling, and extend
   `src/app/styles.css` with panel layout rules that preserve the current skill workflow on desktop
   and narrow viewports. Land the non-interactive shell before picker or row-level logic so later
   component work builds against stable placement and section structure. Verify with targeted app
   component tests for render placement, empty state, catalog-error state, and responsive stacking.

4. **Phase 3: BW-1403 shared searchable picker primitive.** Build one reusable equipment picker
   component and one selector contract for search results, keyboard navigation, clear actions,
   unresolved badges, and no-result states. Do not start armor- or weapon-specific UI until this
   primitive is stable; it is the main dependency reducer for the rest of the sprint. Verify with
   focused Vitest coverage for search normalization, deterministic result ordering, clear behavior,
   and keyboard interaction.

5. **Phase 4: BW-1404 armor controls.** Implement the five fixed armor rows, rune and insignia
   pickers, headgear attribute control for the head slot, and concise per-slot summaries and inline
   issues. Reuse EPIC-13 helpers for headgear and rune attribute-rank adjustments, and keep invalid
   or unresolved choices recoverable rather than silently coercing them away. Verify with focused
   app and domain coverage for slot editing, profession/mode filtering, headgear restrictions,
   attribute-rank handoff, state preservation, and unresolved-state display.

6. **Phase 5: BW-1405 weapon-set controls.** Implement the four weapon-set sections, main/off-hand
   occupancy, two-handed conflict handling, weapon pickers, modifier pickers, and visible
   requirement notes. The selector layer should own compatibility filtering and explanatory notes so
   component logic remains simple and generated records stay behind the app boundary. Verify with
   focused app and domain coverage for occupancy transitions, modifier compatibility, duplicate
   occupied slots, unresolved weapons or modifiers, and requirement presentation.

7. **Phase 6: BW-1406 equipment summaries and note-based stats.** Add selector-driven equipment
   display rows and a simple stats section for deterministic health/energy deltas, headgear/rune
   attribute effects, requirement notes, armor notes, modifier notes, and unresolved warnings.
   Keep anything conditional, probabilistic, or source-incomplete as note-only text instead of
   silently folding it into totals. Verify with selector and component tests for summary rendering,
   note-only effects, tooltip/display consistency, and zero regression to skill tooltip behavior.

8. **Phase 7: BW-1407 validation presentation, persistence, backup/restore, and share boundaries.**
   Replace the current `unsupported-equipment` durability rejection with bounded semantic equipment
   parsing and cloning in `src/app/persistence-schema.ts`, then carry that support through autosave,
   saved records, restore preview/apply, and saved-with freshness logic. Add explicit omission
   warnings to both template export and share surfaces while keeping skill-template URL grammar and
   export eligibility unchanged. Verify with targeted Vitest runs for persistence, local storage,
   backup/restore, template workflow, share controls, and inline validation grouping.

9. **Phase 8: BW-1408 accessibility, documentation, and closeout.** Sweep keyboard traversal,
   focus restoration, labels, section headings, overflow behavior, and narrow-width interaction
   across the completed equipment workflow. Update `README.md`, compendium notes, ticket records,
   sprint records, and ledger/manifests as required by the execution run, then run the full
   repository gate. Verify first with focused app tests for accessibility and responsive regressions,
   then finish with `npm run verify`.

## Files Summary

| Area | Files | Planned work |
| --- | --- | --- |
| Catalog boundary | `src/app/catalogs.ts`, `src/app/catalogs.test.ts`, `src/app/catalog-boundary.test.ts` | Import and validate promoted EPIC-10/11/12 runtime JSON, expose app-owned equipment views, versions, attribution, placeholders, and preserve the single runtime import boundary. |
| Reducer and selectors | `src/app/editor-state.ts`, `src/app/editor-state.test.ts`, `src/app/editor-selectors.ts`, new `src/app/equipment-selectors.ts`, `src/app/editor-selectors.test.ts` | Add lazy-init equipment actions, validation input wiring, picker option filtering, grouped issues, share-omission detection, and simple stats projections. |
| App shell and components | `src/app/App.tsx`, `src/app/styles.css`, new `src/app/components/EquipmentPanel.tsx`, new `src/app/components/EquipmentPicker.tsx`, new `src/app/components/ArmorControls.tsx`, new `src/app/components/WeaponSetControls.tsx`, new `src/app/components/EquipmentSummary.tsx`, `src/app/App.test.tsx` | Place the equipment panel in the main column, implement responsive sections, searchable controls, inline summaries, and accessible keyboard interactions. |
| Persistence and sharing | `src/app/persistence-schema.ts`, `src/app/persistence-schema.test.ts`, `src/app/local-storage.ts`, `src/app/local-storage.test.ts`, `src/app/backup-restore.ts`, `src/app/backup-restore.test.ts`, `src/app/template-workflow.ts`, `src/app/template-workflow.test.ts`, `src/app/components/ShareControls.tsx`, `src/app/components/TemplateDialogs.tsx` | Accept bounded semantic equipment in durable snapshots, expand saved-with freshness facts, preserve backup/restore behavior, and surface omission warnings without changing share URL grammar. |
| Domain reuse and fixtures | `src/domain/equipment-attribute-rank.ts`, `src/domain/weapon-set.ts`, `src/domain/rune-effects.ts`, `src/domain/insignia-effects.ts`, `test/domain/armor-equipment.test.ts`, `test/domain/equipment-validation.test.ts`, `test/domain/weapon-set.test.ts`, `test/fixtures/rule-engine/equipment-catalogs.ts`, `test/fixtures/rule-engine/equipment.ts` | Reuse EPIC-13/10/11/12 helpers where selectors or app tests need authoritative behavior and extend fixtures for equipment-heavy UI and durability cases. |
| Docs and records | `README.md`, `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`, `compendium/equipment-shell.md`, `compendium/game-rule-engine.md`, `work/tickets/14-equipment-editor/*.md`, `work/sprints/ledger.tsv`, execution manifest paths | Record the new editor surface, persistence behavior, share boundary, deferred scope, verification evidence, and sprint/ticket closeout facts. |

## Definition of Done

- `src/app/catalogs.ts` imports the approved EPIC-10, EPIC-11, and EPIC-12 runtime catalogs and
  remains the only generated-data import boundary for runtime app code.
- The editor reducer can initialize, update, clear, and preserve semantic equipment deterministically
  while keeping `equipment: null` for untouched builds.
- The app exposes an equipment panel inside the existing editor surface with fixed armor rows, four
  weapon-set sections, searchable pickers, empty/unresolved/catalog-error states, and narrow-width
  usability.
- Equipment selectors provide filtered options, grouped inline issues, omission warnings, and simple
  explainable summaries without moving domain logic into components.
- Validation input includes equipment catalog views and equipment issues are visible both inline and
  through the existing validation contract.
- Local working draft autosave, saved records, backup/restore, and hydration round-trip valid
  semantic equipment while rejecting malformed or unsafe payloads without corrupting unrelated data.
- Template export and share flows remain skill-template-first, do not encode equipment, and clearly
  warn when meaningful equipment state will be omitted.
- README, compendium notes, ticket records, sprint records, ledger/manifests, and verification
  evidence agree on the EPIC-14 boundary and deferred scope.
- `npm run verify` passes after focused phase gates have already passed.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Static runtime catalog imports substantially increase the bundle or adaptation work. | Medium | Keep equipment views compact, build lookup indexes once in `catalogs.ts`, and avoid duplicating normalization work in components or per-render selectors. |
| Shared picker behavior becomes the main source of UI regressions or accessibility failures. | High | Land one primitive before armor and weapon controls, keep its API narrow, and gate each later phase on keyboard and no-result regression coverage. |
| Persistence migration silently drops or blocks old libraries. | High | Keep local-library schema v1 if possible, add explicit validators and clone helpers, preserve `equipment: null` fixtures, and verify restore preview/apply against malformed payloads before enabling writes. |
| Scope drifts into full stat aggregation, raw equipment-template workflows, or runtime icon loading. | High | Freeze the bounded summary set up front, keep equipment-template import/export explicitly deferred, and continue using placeholder icon descriptors only. |
| Inline equipment validation becomes noisy or duplicates too much global messaging. | Medium | Group location-based issues in selectors, keep global-only issues in the existing validation panel, and tune unresolved vs warning behavior using existing domain semantics. |

## Security

- Runtime app code must continue to import generated data only through `src/app/catalogs.ts`; no QA
  reports, manifests, snapshots, scripts, wiki APIs, or remote media URLs may leak into components.
- Equipment persistence validators must keep dangerous-key rejection, plain-object checks,
  safe-integer bounds, bounded strings, bounded modifier-array lengths, and exact slot/discriminant
  validation for semantic equipment payloads.
- Equipment labels, unresolved text, and note content should be rendered as plain text only; no HTML
  injection or media rendering paths should be introduced.
- Share URLs and template exports must remain equipment-free so authored equipment is not copied into
  uncontrolled fragments or presented as representable when it is not.
- Backup and restore must continue to validate before apply and must not overwrite valid current
  data with malformed equipment payloads.

## Dependencies

1. `BW-1401` is the first hard gate. Catalog adaptation and reducer wiring must land before any
   equipment UI, persistence, or share-boundary work.
2. `BW-1402` depends on `BW-1401` and should land before detailed control work so panel placement,
   section structure, and responsive rules stop moving.
3. `BW-1403` depends on `BW-1401` and `BW-1402` and is the shared primitive for both armor and
   weapon editing.
4. `BW-1404` and `BW-1405` both depend on the shared boundary, panel shell, and picker primitive.
   They can execute in parallel after that contract stabilizes, but both must finish before summary
   and durability work.
5. `BW-1406` depends on `BW-1404` and `BW-1405` because summary accuracy depends on the final armor
   and weapon selector contracts.
6. `BW-1407` depends on `BW-1404`, `BW-1405`, and `BW-1406` because persistence, validation
   presentation, and omission warnings should key off stable authored state and final summary rules.
7. `BW-1408` closes the sprint after all feature tickets land and after docs, accessibility, and
   `npm run verify` complete.
8. Technical dependencies are EPIC-06 validation contracts, EPIC-09 local-library/share workflows,
   EPIC-10 rune data and rank summaries, EPIC-11 insignia applicability, EPIC-12 weapon/modifier
   facts and compatibility, and EPIC-13 semantic equipment contracts.

## Open Questions

1. Should the equipment panel default expanded on desktop and collapsed only on narrow widths, or
   should it always stay fully expanded? Default recommendation: expanded on desktop, collapsible on
   narrow viewports if testing shows crowding.
2. Should `PersistedCatalogFacts` store only per-catalog versions, or also weapon/mod catalog-set
   digest alignment facts for more accurate freshness reporting? Default recommendation: include the
   set facts if already present in `validatedAgainst`; otherwise do not duplicate them elsewhere.
3. Which deterministic health or energy effects from promoted rune, insignia, and weapon-modifier
   records are safe to total in v1 summaries? Default recommendation: total only explicit structured
   unconditional deltas and keep everything else as notes.
4. Should an authored fallback requirement editor be exposed in the MVP, or should the UI remain
   catalog-truth-only until a real unresolved requirement case demands manual input? Default
   recommendation: keep the control hidden unless EPIC-13 contract coverage shows a user-visible
   need.
5. How much location-specific issue duplication is acceptable between inline equipment UI and the
   existing `ValidationPanel` before the panel becomes noisy? Default recommendation: inline group
   all equipment location issues and leave the validation panel focused on global issues plus counts.