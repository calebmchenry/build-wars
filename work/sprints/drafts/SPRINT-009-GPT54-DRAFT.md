---
id: SPRINT-009
title: Core Build Editor
status: planned
source_target: EPIC-08
source_epic: EPIC-08
source_epic_path: work/tickets/08-core-build-editor/EPIC.md
tickets:
  - BW-0801
  - BW-0802
  - BW-0803
  - BW-0804
  - BW-0805
  - BW-0806
  - BW-0807
  - BW-0808
created: 2026-09-02
---

# Sprint 009: Core Build Editor

## Overview

This sprint turns `EPIC-08 Core Build Editor` into the first usable in-memory authored-build
experience for Build Wars. The output is a desktop-browser-first React editor that can select
professions, allocate attributes, browse skills, build an eight-slot skill bar, render dynamic
tooltip text, import and export skill templates, and surface rule-engine validation without adding
storage, network fetching, or later-epic equipment/party scope.

The sequencing priority is to retire boundary risk before UI breadth. Execution should first lock a
single app-side catalog boundary and a deterministic editor state model, then layer profession/mode
and attribute editing, then the skill browser and skill-bar interactions, then skill presentation
and template dialogs, and only after those surfaces stabilize should it wire validation polish and
closeout. That ordering keeps generated-data policy, unresolved imported IDs, and shared UI state
from splintering across components.

This sprint is intentionally bounded. It must not add local persistence, share URLs, equipment
editing, title ownership controls, allegiance side controls, hero or party builds, guide authoring,
remote icon loading, copied source prose, or direct runtime imports of generated manifests, QA
reports, source plans, snapshots, or Python ingestion tooling.

## Use Cases

1. A user starts from an empty in-memory build, selects professions and mode, and allocates
   attributes with remaining-point feedback driven by catalog rules.
2. A user searches the promoted skill catalog by name and filters by profession, attribute, type,
   elite state, mode availability, and supported resource facts without leaving the editor.
3. A user assembles and rearranges a skill bar through drag/drop and keyboard-accessible placement,
   swap, reorder, and clear flows.
4. A user hovers or focuses a skill in the browser or skill bar and sees dynamic tooltip text that
   reflects authored effective attribute ranks and the documented max-title-rank assumption.
5. A user imports a bare template code or `[name;code]` wrapper, edits the imported build, and
   exports exact-source or canonical output according to the EPIC-05 fidelity rules.
6. A user keeps working through warnings, incomplete state, and unresolved imported IDs while still
   seeing a compact validation summary and inline issue locations.
7. A reviewer can verify that `src/app` consumes only the approved runtime catalog JSON files
   through one boundary and that the complete editor flow passes `npm run verify`.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Runtime data | Import only `data/generated/epic-03/professions-attributes.catalog.json` and `data/generated/epic-04/skills.catalog.json` through one app-owned boundary. | Direct UI imports from `data/generated/**`, generated manifests, QA reports, source plans, snapshots, wiki APIs, or Python data tooling. |
| Editor state | One deterministic in-memory editor state for the current build, browser filters/views, active slot, dialogs, imported-template provenance, and unresolved raw template IDs. | Local storage, migrations, saved libraries, tags, favorites, backup/restore, share URLs, party state, or equipment state. |
| UI surfaces | Profession selector, mode selector, attribute editor, skill browser list/grid views, eight-slot skill bar, tooltip/display surfaces, template dialogs, validation summary, inline issues, and responsive/dialog states. | Equipment editor, title controls, allegiance controls, hero/party editing, guide surfaces, or pixel-perfect prior-art cloning. |
| Template fidelity | Exact-source replay for unchanged imports plus canonical export from current editor state when encode proof succeeds. | paw-ned2/team templates, equipment templates, dependency-internal error leakage, or lossy export acceptance. |
| Source/media policy | Visible attribution before source-derived facts, metadata-only icon handling, and stable placeholder icon slots. | Automatic remote wiki icon fetches, cached media bytes, copied source-authored skill descriptions, or runtime prior-art assets. |
| Verification and records | Focused app tests, source scans, `npm run build`, `npm run verify`, sprint/epic/ticket closeout, and ticket-burn manifests. | New planning decisions, new data-ingestion work, or unrelated repo refactors. |

### App Boundary And Module Shape

The app-side module split should stay small and explicit:

| Module | Responsibility |
| --- | --- |
| `src/app/catalogs.ts` | The only `src/app` module allowed to import promoted generated JSON. It exposes app-ready profession, attribute, skill, attribution, catalog-version, and placeholder-icon views. |
| `src/app/editor-state.ts` | Pure editor state, actions/reducer helpers, imported-template overlay, and deterministic mutation rules. |
| `src/app/editor-selectors.ts` | Derived views for visible attributes, remaining points, filtered skills, skill-bar display, tooltip rank context, validation view models, and export eligibility. |
| `src/app/editor-fixtures.ts` | Small playable, incomplete, and unresolved-import fixtures for tests and story-like setup. |
| `src/app/*.tsx` | Editor container plus profession/attribute, skill-browser, skill-bar, tooltip, template-dialog, and validation presentation components. |
| `src/app/*.test.tsx` | Focused component and integration tests that exercise the app boundary rather than reaching into generated data directly. |

Leaf UI components should consume app-ready views and selectors, not raw generated catalog shapes and
not template-compatibility or rule-engine internals directly. `src/domain` and
`src/template-compatibility` remain the authoritative pure boundaries; `src/app` should adapt their
results into UI state rather than recreate their logic.

### Editor State Model

The editor state should treat the authored `Build` as the canonical resolved document and keep
import fidelity in a separate overlay. The expected shape is:

- `build`: the current authored `Build`, including selected professions, mode, attribute rows, and
  eight skill-bar slots for known or user-authored resolved IDs.
- `importedTemplate`: the last imported `SkillTemplateDocument`, its resolved view, template name,
  semantic fingerprint, and untouched raw template IDs that still need preservation for exact-source
  replay or canonical reconstruction.
- `browser`: search text, selected filters, grouped/sorted results settings, and the current list,
  small-grid, or large-grid view mode.
- `selection`: active skill-bar slot, hovered or focused skill target, and the current placement
  intent for keyboard alternatives.
- `dialogs`: import and export dialog open state, field text, error state, and last export result.

The key rule is separation of concerns:

- The `Build` remains the input to `validateBuild`.
- Untouched unresolved template IDs remain in `importedTemplate`, not coerced into catalog IDs.
- Replacing or clearing an unresolved profession, attribute row, or skill slot removes the
  corresponding raw overlay entry explicitly.
- Exact-source export remains available only while the imported template fingerprint is still
  semantically unchanged.
- Canonical export rebuilds a `SkillTemplateDocument` from current editor state plus any untouched
  raw overlay entries that are still representable.

### Validation, Tooltip, And Export Policy

- `validateBuild` should run against the current `build` using catalog views derived from the app
  boundary, not ad hoc UI constants.
- `renderSkillTooltipText` should own description projection. The app supplies authored attribute
  ranks and a max-title-rank assumption map for title-dependent progressions until `EPIC-15`.
- Validation summary UI should show `valid`, `complete`, `resolved`, `exhaustive`, counts, and
  issue severity without collapsing them into one pass/fail flag.
- Inline issues should use `ValidationLocation` when available so profession, attribute, skill-slot,
  and dialog-adjacent messages stay localized.
- Warnings, incomplete states, and unresolved imports must not block editing.
- Exact-source export stays available for unchanged imports even if warnings remain.
- Canonical export should disable only when the current state has validation errors or
  `exportSkillTemplate(..., { mode: "canonical" })` fails its proof. Warnings, incomplete state,
  and unresolved imported IDs may still permit canonical export if reconstruction and proof succeed.

### Execution Topology

```text
BW-0801 app catalog boundary and attribution
  -> BW-0802 editor state model and fixtures
BW-0802
  -> BW-0803 profession, mode, and attribute editor
  -> BW-0804 skill browser search, filters, and views
BW-0803 + BW-0804
  -> BW-0805 drag and drop skill bar
BW-0803 + BW-0805
  -> BW-0806 skill display and tooltips
BW-0802 + BW-0805 + EPIC-05 template boundary
  -> BW-0807 template import/export dialogs
BW-0803 + BW-0804 + BW-0805 + BW-0806 + BW-0807
  -> BW-0808 validation, responsive polish, and closeout
```

`BW-0804` and `BW-0806` can partially parallelize after the state model is stable, but the default
single-threaded execution order should remain `0801 -> 0802 -> 0803 -> 0804 -> 0805 -> 0806 ->
0807 -> 0808`. That order reduces duplicate work across browser rows, bar slots, tooltip anchors,
and import/export policy wiring.

### Verification Contract

- Keep each phase backed by focused app tests before running broad repo verification.
- Re-run source scans after `BW-0801` and again before closeout so forbidden imports do not creep
  back into `src/app`.
- Treat narrow-screen, dialog overflow, empty/no-result, and validation-location states as explicit
  test targets rather than manual-only polish.
- `npm run verify` remains the canonical closeout gate.
- If `npm run verify` fails for an unrelated existing reason, record the exact command, failure, and
  sprint-scoped clean diff evidence instead of silently marking the sprint complete.

## Implementation

### Execution Bookkeeping

- [ ] Confirm `SPRINT-001` through `SPRINT-008` are complete before execution starts.
- [ ] Create or update `work/sprints/SPRINT-009.md` and the `SPRINT-009` row in
      `work/sprints/ledger.tsv` before implementation begins.
- [ ] Move `EPIC-08` and the active BW ticket to `in-progress` as work starts, then advance them to
      `done` only after their phase gates pass.
- [ ] Keep `source_target: EPIC-08`, `source_epic: EPIC-08`, and `source_epic_path:
      work/tickets/08-core-build-editor/EPIC.md` consistent across sprint, epic, ticket, ledger,
      and run-manifest records.
- [ ] Preserve unrelated working-tree changes and do not create a commit from sprint execution
      unless separately requested.

### Phase 1: BW-0801 App Catalog Boundary And Attribution (~14%)

**Files:**

- `src/app/catalogs.ts`
- `src/app/catalogs.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Create `src/app/catalogs.ts` as the only app-owned import site for the promoted EPIC-03 and
      EPIC-04 catalog JSON files.
- [ ] Expose app-ready profession, attribute, skill, catalog-version, and attribution views so leaf
      components do not need to understand raw generated catalog structure.
- [ ] Preserve remote icon metadata only as data and define stable placeholder icon-slot behavior
      for profession selectors, browser rows/tiles, skill-bar slots, and tooltips.
- [ ] Render visible attribution before any source-derived profession, attribute, or skill facts are
      shown in the editor shell.
- [ ] Add a small app-owned ready/error boundary for catalog initialization rather than assuming
      generated data can never fail adaptation.
- [ ] Add a source-scan test or phase check that ensures only the approved JSON files are imported
      and that no QA reports, manifests, source plans, snapshots, or data scripts enter `src/app`.

**Verification:**

- `rg -n 'data/generated/' src/app`
- `rg -n '(data/qa|data/source-snapshots|scripts/data|wiki\\.guildwars|api\\.php)' src/app`
- `npm run test:run -- src/app/App.test.tsx src/app/catalogs.test.ts`
- `npm run typecheck`

**Phase Acceptance:**

The app has exactly one generated-data boundary, the only allowed runtime JSON imports are the two
approved catalog files, attribution is visibly rendered, and no remote icon request is required for
basic layout.

### Phase 2: BW-0802 Editor State Model And Fixtures (~16%)

**Files:**

- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/editor-fixtures.ts`

**Tasks:**

- [ ] Define the core editor state around the authored `Build`, imported-template overlay, browser
      controls, current selection, and dialog state.
- [ ] Implement pure state helpers for selecting professions, setting mode, changing attribute
      ranks, placing/replacing/clearing skills, selecting the active slot, opening/closing dialogs,
      and adopting imported template data.
- [ ] Preserve null professions, empty skill slots, unresolved raw template IDs, and partially
      allocated attributes without destructive normalization.
- [ ] Keep untouched imported raw template IDs separate from resolved authored IDs so exact-source
      re-export and later canonical reconstruction remain possible.
- [ ] Add deterministic fixtures for a playable build, an incomplete build, and an imported build
      with unresolved profession, attribute, and skill IDs.
- [ ] Add selector helpers for visible attribute rows, remaining attribute points, filtered browser
      inputs, tooltip rank context, and export-eligibility state.

**Verification:**

- `npm run test:run -- src/app/editor-state.test.ts src/app/editor-selectors.test.ts`
- `npm run typecheck`

**Phase Acceptance:**

State transitions are deterministic and test-covered, unresolved imported IDs remain representable
until explicit user replacement or clearing, and the selector layer is ready for UI composition.

### Phase 3: BW-0803 Profession, Mode, And Attribute Editor (~14%)

**Files:**

- `src/app/App.tsx`
- `src/app/profession-attribute-editor.tsx`
- `src/app/profession-attribute-editor.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Replace the placeholder shell with a real editor workspace rooted in the Phase 2 state model.
- [ ] Render primary and secondary profession selectors backed by app catalog views and placeholder
      icons.
- [ ] Add PvE, PvP, and unknown mode selection that flows directly into editor state and later
      validation.
- [ ] Render profession-owned attribute rows with editable purchased ranks and visible remaining
      points driven by EPIC-03 attribute-point rules rather than duplicated UI constants.
- [ ] Preserve imported inaccessible or unresolved attribute rows as visible warnings instead of
      deleting them from the editor.
- [ ] Ensure keyboard and pointer flows work for profession selection, mode changes, and attribute
      rank editing in a desktop browser window.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/profession-attribute-editor.test.tsx`
- `npm run typecheck`

**Phase Acceptance:**

A user can author profession pair, mode, and attribute allocations from catalog-backed rules, and
imported unresolved attribute rows still remain visible and non-destructive.

### Phase 4: BW-0804 Skill Browser Search, Filters, And Views (~14%)

**Files:**

- `src/app/skill-browser.tsx`
- `src/app/skill-browser.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Build a skill browser driven by Phase 2 selectors and Phase 1 catalog views.
- [ ] Implement deterministic name search plus filters for profession, attribute, skill type,
      elite state, mode availability, and supported resource facts: energy, adrenaline, sacrifice,
      upkeep, and overcast.
- [ ] Default to grouping by attribute and support list, small-grid, and large-grid view modes with
      optional sort by name or type.
- [ ] Keep row, tile, and placeholder-icon geometry stable across views so later drag, focus, and
      tooltip states do not shift layout unexpectedly.
- [ ] Add explicit empty, no-result, loading, and error branches owned by Build Wars rather than
      inferred from prior-art screenshots.
- [ ] Wire browser selection events into the skill-bar placement flow without skipping the editor
      state boundary.

**Verification:**

- `npm run test:run -- src/app/skill-browser.test.tsx`
- `npm run typecheck`

**Phase Acceptance:**

Browser results change deterministically with filter updates, all required view modes render with
stable geometry, and no-result/loading/error branches are explicit and test-covered.

### Phase 5: BW-0805 Drag And Drop Skill Bar (~14%)

**Files:**

- `src/app/skill-bar.tsx`
- `src/app/skill-bar.test.tsx`
- `src/app/App.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Implement placement from browser result to skill slot, including replace behavior for filled
      slots.
- [ ] Implement slot-to-slot reorder and swap behavior while preserving exactly eight slots at all
      times.
- [ ] Add an obvious accessible clear action and keyboard-accessible alternatives for place, move,
      swap, reorder, and clear.
- [ ] Preserve empty slots, unresolved placeholders, and untouched imported raw template IDs during
      drag/drop and keyboard mutations.
- [ ] Keep slot dimensions stable for empty, filled, focused, hovered, invalid, dragged, and
      unresolved states.
- [ ] Expose clear slot labels and active-slot state so later tooltip and template flows have one
      stable interaction model.

**Verification:**

- `npm run test:run -- src/app/skill-bar.test.tsx src/app/App.test.tsx`
- `npm run typecheck`

**Phase Acceptance:**

The editor supports game-like eight-slot placement and rearrangement without corrupting unresolved
imports, and keyboard users can perform equivalent operations.

### Phase 6: BW-0806 Skill Display And Tooltips (~10%)

**Files:**

- `src/app/skill-presentation.tsx`
- `src/app/skill-presentation.test.tsx`
- `src/app/skill-tooltip.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Create shared presentation helpers for browser rows, grid tiles, skill-bar slots, and tooltip
      shells so skill facts render consistently across surfaces.
- [ ] Render skill name, type, profession, attribute, elite marker, mode availability, and supported
      cost/timing facts from the promoted skill catalog.
- [ ] Use `renderSkillTooltipText` and selector-produced rank context for attribute-scaled and
      title-scaled text projection.
- [ ] Apply the documented max-title-rank assumption for title-scaled skills until `EPIC-15` adds
      title ownership and configuration.
- [ ] Render explainable unresolved states for unknown skills, unsupported descriptions, missing
      progression values, and ambiguous mode-dependent variants.
- [ ] Ensure tooltip behavior works for pointer and keyboard flows in browser rows, grid tiles, and
      skill-bar slots.

**Verification:**

- `npm run test:run -- src/app/skill-presentation.test.tsx`
- `npm run typecheck`

**Phase Acceptance:**

Dynamic skill text updates as authored ranks change, title-dependent skills use the documented
assumption, and unresolved tooltip states are explicit and non-crashing.

### Phase 7: BW-0807 Template Import And Export Dialogs (~10%)

**Files:**

- `src/app/template-dialogs.tsx`
- `src/app/template-dialogs.test.tsx`
- `src/app/editor-state.ts`
- `src/app/editor-selectors.ts`
- `src/app/styles.css`

**Tasks:**

- [ ] Build import and export dialogs for bare skill codes and `[name;code]` chat wrappers using
      the existing template-compatibility boundary.
- [ ] Convert decoded known template fields into editor state while preserving unresolved raw
      profession, attribute, and skill IDs in the imported-template overlay.
- [ ] Preserve template names where supported by the wrapper contract and surface typed parse,
      decode, resolve, and encode failures without leaking dependency internals.
- [ ] Keep exact-source re-export available while the imported template remains semantically
      unchanged.
- [ ] Reconstruct a canonical `SkillTemplateDocument` from current editor state plus untouched raw
      overlay entries and allow canonical export only when encode/decode-back proof succeeds and the
      validation policy allows it.
- [ ] Cover long template names, long codes, empty input, invalid wrappers, narrow screens, dialog
      overflow, and keyboard focus management.

**Verification:**

- `npm run test:run -- src/app/template-dialogs.test.tsx`
- `npm run typecheck`

**Phase Acceptance:**

A user can import supported skill templates, preserve unresolved raw IDs until replacement or
clearing, and export exact-source or canonical output according to the EPIC-05 fidelity rules.

### Phase 8: BW-0808 Validation, Responsive Polish, And Closeout (~8%)

**Files:**

- `src/app/validation-panel.tsx`
- `src/app/validation-panel.test.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`
- `work/tickets/08-core-build-editor/*.md`
- `work/tickets/08-core-build-editor/EPIC.md`
- `work/sprints/SPRINT-009.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Run `validateBuild` against the current editor state and catalog boundary data on every
      meaningful authored change.
- [ ] Render a compact global validation summary that keeps `valid`, `complete`, `resolved`, and
      `exhaustive` separate from one another.
- [ ] Render inline issue messages near profession selectors, attribute rows, skill slots, and
      template dialogs when `ValidationLocation` data is available.
- [ ] Keep editing non-blocking for warnings, incomplete state, and unresolved imports while clearly
      disabling canonical export on validation errors or lossy encode failures.
- [ ] Finish narrow-screen behavior, focus states, dialog overflow, loading/empty/error states, and
      keyboard-only desktop flows without hard-coding screenshot dimensions.
- [ ] Run final source scans, app tests, `npm run build`, and `npm run verify`.
- [ ] Update tickets, epic, sprint record, ledger, and ticket-burn execution manifest with the
      delivered scope and explicit deferred work for `EPIC-09`, `EPIC-15`, equipment, and party
      epics.

**Verification:**

- `rg -n 'data/generated/' src/app`
- `rg -n '(data/qa|data/source-snapshots|scripts/data|wiki\\.guildwars|api\\.php)' src/app`
- `npm run build`
- `npm run verify`

**Phase Acceptance:**

The editor supports the complete create/edit/validate/import/export workflow for a single-character
skill bar, responsive and focus states are usable, and all planning/execution records agree on the
sprint outcome.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `data/generated/epic-03/professions-attributes.catalog.json` | Read only | Approved runtime profession and attribute catalog consumed only through the app boundary. |
| `data/generated/epic-04/skills.catalog.json` | Read only | Approved runtime skill catalog consumed only through the app boundary. |
| `src/app/catalogs.ts` | Create | Single app-side generated-data boundary, attribution views, and placeholder icon policy. |
| `src/app/catalogs.test.ts` | Create | Prove allowed imports, attribution facts, and app-ready catalog adaptation. |
| `src/app/editor-state.ts` | Create | Pure editor state, imported-template overlay, and deterministic mutation helpers. |
| `src/app/editor-state.test.ts` | Create | Cover profession, attribute, skill-slot, dialog, and unresolved-import state transitions. |
| `src/app/editor-selectors.ts` | Create | Derived browser, budget, tooltip-rank, validation, and export selectors. |
| `src/app/editor-selectors.test.ts` | Create | Prove selector determinism and edge-case handling. |
| `src/app/editor-fixtures.ts` | Create | Playable, incomplete, and unresolved-import fixtures for app tests. |
| `src/app/App.tsx` | Modify | Replace the foundation shell with the assembled build editor. |
| `src/app/App.test.tsx` | Modify | Expand top-level integration coverage across the editor flow. |
| `src/app/*.tsx` | Create | Profession/attribute, browser, skill-bar, tooltip, template-dialog, and validation surfaces. |
| `src/app/*.test.tsx` | Create | Focused component and integration tests for the new editor surfaces. |
| `src/app/styles.css` | Modify | Prior-art-informed desktop-first layout, placeholder icon slots, dialog states, and responsive/focus styling. |
| `src/domain/**/*.ts` | Read only by default | Existing pure build, validation, catalog, and tooltip contracts consumed by the app. |
| `src/template-compatibility/**/*.ts` | Read only by default | Existing skill-template parse/decode/export boundary consumed by the app. |
| `compendium/visual-prior-art.md` | Read only | Visual reference for hierarchy and states, not pixel-perfect dimensions. |
| `compendium/source-policy.md` | Read only | Attribution, source-derived data, and remote-media restrictions. |
| `compendium/template-compatibility.md` | Read only | Template fidelity rules and unresolved-ID handling constraints. |
| `compendium/game-rule-engine.md` | Read only | Validation semantics and effective-rank behavior. |
| `work/tickets/08-core-build-editor/*.md` | Modify during execution | Record BW-0801 through BW-0808 evidence, status, and completion. |
| `work/tickets/08-core-build-editor/EPIC.md` | Modify during closeout | Mark EPIC-08 complete and record deferred work. |
| `work/sprints/SPRINT-009.md` | Create/modify | Approved sprint execution record. |
| `work/sprints/ledger.tsv` | Modify | Sprint lifecycle tracking. |
| `work/runs/ticket-burn/EPIC-08/20260902T154644Z/plan-EPIC-08-result.json` | Create | Required ticket-burn planning result manifest. |
| `work/runs/ticket-burn/EPIC-08/20260902T154644Z/execute-SPRINT-009-result.json` | Create during execution | Required ticket-burn execution result manifest. |

## Definition of Done

### App Boundary And Data Policy

- [ ] `src/app/catalogs.ts` is the only `src/app` module that imports `data/generated/**`.
- [ ] The only runtime generated-data imports are
      `data/generated/epic-03/professions-attributes.catalog.json` and
      `data/generated/epic-04/skills.catalog.json`.
- [ ] No app code imports generated manifests, QA reports, source plans, snapshots, wiki APIs, or
      Python ingestion tooling.
- [ ] Visible attribution appears before source-derived profession, attribute, and skill facts are
      shown.
- [ ] Remote icon URLs are not fetched automatically by the browser.
- [ ] Placeholder icon slots stay stable across profession selectors, browser rows/tiles, skill-bar
      slots, and tooltip shells.

### Editor Workflows

- [ ] Editor state mutations are deterministic and covered by focused tests.
- [ ] A user can select primary and secondary professions, choose mode, and allocate attributes
      using catalog-backed rules.
- [ ] Remaining attribute points come from EPIC-03 rules rather than duplicated UI constants.
- [ ] The skill browser supports required search, filters, grouping, and list/small-grid/large-grid
      views.
- [ ] A user can place, replace, swap, reorder, and clear skills across exactly eight slots.
- [ ] Keyboard users can perform equivalent skill-bar operations.
- [ ] Unknown or stale imported profession, attribute, and skill IDs remain representable until the
      user explicitly replaces or clears them.

### Tooltips, Templates, And Validation

- [ ] Dynamic skill text updates from authored effective attribute ranks.
- [ ] Title-scaled skill text uses the documented max-title-rank assumption and no title control is
      added.
- [ ] Unsupported or unresolved tooltip states are explicit and non-crashing.
- [ ] Template import accepts supported bare codes and `[name;code]` wrappers.
- [ ] Exact-source export remains available for unchanged imports.
- [ ] Canonical export is allowed only when encode/decode-back proof succeeds and the current editor
      state has no validation errors.
- [ ] Validation summary UI exposes `valid`, `complete`, `resolved`, and `exhaustive` distinctly.
- [ ] Inline issues appear near professions, attributes, skill slots, and dialogs when location data
      exists.
- [ ] Warnings, incomplete state, and unresolved imports do not block editing.

### UX And Accessibility

- [ ] Desktop-browser usability is strong for the main profession, attribute, browser, skill-bar,
      template, and validation flows.
- [ ] Narrow-screen behavior is usable and does not rely on screenshot dimensions as layout specs.
- [ ] Focus-visible, empty, no-result, loading, error, and dialog-overflow states are explicit.
- [ ] Pointer and keyboard tooltip flows are both usable.
- [ ] Prior art informs layout and hierarchy, but no UI depends on hard-coded screenshot dimensions
      or copied source assets.

### Verification And Closeout

- [ ] Focused app tests cover catalog boundary, state, browser, skill bar, tooltip, template, and
      validation flows.
- [ ] Source scans confirm the generated-data and no-data-script import restrictions.
- [ ] `npm run build` passes.
- [ ] `npm run verify` passes, or a clearly documented unrelated blocker prevents sprint completion.
- [ ] Ticket, epic, sprint, ledger, and run-manifest records agree on `SPRINT-009`, `EPIC-08`, the
      source target, ticket list, and deferred follow-up scope.
- [ ] No commit is created unless separately requested.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Direct generated-data imports leak into multiple UI files | Medium | High | Create `src/app/catalogs.ts` first, add source scans, and fail the phase if additional import sites appear. |
| Imported unresolved template IDs are lost during editing | High | High | Keep a separate imported-template overlay and require explicit replacement/clear semantics per field. |
| Browser, bar, and tooltip surfaces duplicate view logic | Medium | High | Use shared selectors and shared skill presentation helpers before final tooltip polish. |
| Filter scope grows beyond what current catalog fields can prove | Medium | Medium | Limit filters to the ticket-defined fields and resource facts already present in the promoted skill catalog. |
| Drag/drop behavior is pointer-only or hard to verify | Medium | High | Make keyboard alternatives first-class, keep state mutations pure, and cover reorder/swap logic with targeted tests. |
| Validation becomes a binary block instead of nuanced editor feedback | Medium | High | Preserve `valid`, `complete`, `resolved`, and `exhaustive` separately and block only canonical export on actual error conditions. |
| Exact-source export eligibility drifts after small edits | Medium | Medium | Tie exact-source replay strictly to the imported template fingerprint and clear overlay entries only on explicit semantic change. |
| Responsive and dialog-overflow states are deferred too long | Medium | Medium | Reserve explicit Phase 8 work and add narrow-screen and overflow test coverage before closeout. |
| Prior-art screenshots are mistaken for pixel-perfect requirements | Medium | Medium | Treat `compendium/visual-prior-art.md` as structural guidance only and keep dimensions out of acceptance criteria. |
| Final `npm run verify` fails for an unrelated repo reason | Low | Medium | Run focused tests throughout the sprint, then document any unrelated blocker with exact command output and sprint-scoped clean diff evidence. |
| Remote icon metadata accidentally turns into network fetch behavior | Low | High | Preserve metadata only in the catalog boundary and render placeholder icon slots everywhere in EPIC-08. |
| Template dialog policy grows into persistence or sharing scope | Medium | Medium | Keep dialogs in-memory only and defer saved library, storage, backup, and share URLs to `EPIC-09`. |

## Security

- Treat catalog values, template codes, wrapper names, validation messages, and unresolved imported
  IDs as untrusted plain text.
- Do not fetch remote wiki icon URLs, wiki pages, QA artifacts, or Python data outputs from the
  browser.
- Keep template parse/decode/export failures bounded to the existing app and template-compatibility
  contracts; do not expose dependency internals, stack traces, or local paths in UI messages.
- Render source-derived names, template names, and unresolved placeholders as escaped text only; do
  not introduce HTML injection paths.
- Keep all editor state in memory for this sprint; do not add local storage, URL serialization, or
  network sync behavior.
- Use only the approved promoted catalog JSON files and existing pure domain/template boundaries.
- Keep placeholder icons and prior-art references metadata-only; no remote media bytes or screenshot
  assets enter runtime code.
- Ensure source scans and tests stay local and credential-free.

## Dependencies

- `SPRINT-001` / `EPIC-00` for the React/Vite/TypeScript foundation, current app shell, shared
  `src/domain` exports, and `npm run verify`.
- `SPRINT-002` / `EPIC-01` for source policy, attribution, and runtime media restrictions.
- `SPRINT-004` / `EPIC-03` for the promoted professions/attributes catalog, template crosswalks,
  and attribute point rules.
- `SPRINT-005` / `EPIC-04` for the promoted skills catalog, skill classification, cost/timing
  facts, structured description tokens, and unresolved skill lookup behavior.
- `SPRINT-006` / `EPIC-05` for skill-template parse/decode/export, chat-wrapper handling,
  exact-source replay, canonical encode proof, and unresolved template resolution.
- `SPRINT-007` / `EPIC-06` for `validateBuild`, `calculateEffectiveAttributeRank`, validation
  locations, and non-binary result semantics.
- `SPRINT-008` / `EPIC-07` for structural prior-art guidance and explicit UI gaps.
- Approved runtime catalog inputs:
  `data/generated/epic-03/professions-attributes.catalog.json` and
  `data/generated/epic-04/skills.catalog.json`.
- No new npm packages, Python tooling, live wiki access, or remote media dependencies are required.

## Open Questions

No open question blocks execution. The sprint should use these defaults:

1. `src/app/catalogs.ts` is the only allowed generated-data import site for runtime app code.
2. The authored `Build` remains the canonical resolved editor document; imported raw template IDs
   live in a separate overlay until explicit replacement or clearing.
3. The browser filter set is exactly: name, profession, attribute, skill type, elite state, mode
   availability, and supported resource facts already present in the promoted skill catalog.
4. Default execution order remains `BW-0801 -> BW-0802 -> BW-0803 -> BW-0804 -> BW-0805 ->
   BW-0806 -> BW-0807 -> BW-0808`, even though parts of `BW-0804` and `BW-0806` can overlap after
   Phase 2.
5. Validation never blocks editing. Exact-source export remains available for unchanged imports.
   Canonical export disables only for validation errors or lossy encode proof failure.
6. Title-scaled text uses the documented max-title-rank assumption until `EPIC-15`; no title-rank
   control, ownership state, or allegiance selector is added here.
7. Catalog loading remains local-first and app-owned. Loading and error states are UI branches, not
   permission to add network fetching.
8. `src/domain` and `src/template-compatibility` are consumed as existing pure boundaries; any
   blocking fix there must remain minimal, semantics-preserving, and explicitly recorded in the
   owning ticket.
