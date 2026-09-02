---
id: SPRINT-009
title: Core Build Editor
status: draft
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
updated: 2026-09-02
---

# Sprint 009: Core Build Editor

## Overview

This sprint builds the first usable single-character Build Wars editor in `src/app`. A user should
be able to select professions and mode, allocate attributes, browse and place skills, reorder the
eight-slot skill bar, inspect skill facts and tooltip text, import a supported Guild Wars skill
template, validate the current build, and export either exact-source or canonical template output
according to the existing compatibility and validation contracts.

The sprint converts the completed domain and data foundation into an app workflow. It does not move
catalog authority into React components. `src/app` gets one catalog boundary that imports the two
promoted runtime JSON files from EPIC-03 and EPIC-04, projects them into app-ready views, exposes
visible attribution, and prevents leaf UI components from importing `data/generated/**` directly.
Domain contracts in `src/domain` remain framework-neutral. Template codec calls remain isolated in
`src/template-compatibility`.

The editor is in-memory only. Refreshing the page may discard the working build. Local library
persistence, schema migrations, tags, favorites, backup/restore, share URLs, hosted sharing, and
cross-build search belong to EPIC-09 or later. Equipment, runes, insignias, weapons, title ownership,
allegiance side, hero/party builds, guide authoring, recommendations, acquisition metadata, and PvX
content remain out of scope.

The key architectural ambiguity is that the existing `Build` domain contract represents authored
catalog-space professions, attributes, and skills, while imported templates may contain raw
template-space IDs that do not resolve to known catalog records. This sprint should not collapse
those concepts silently. The app state should wrap a domain `Build` projection with explicit
editor/import metadata for unresolved template facts, exact-source re-export, UI placeholders, and
import/export diagnostics.

The UI is desktop-browser-first but must include usable narrow-screen behavior, keyboard focus,
loading, empty, error, and dialog overflow states. `compendium/visual-prior-art.md` is reference
evidence, not a pixel-perfect implementation spec and not runtime media approval. Remote wiki icon
URLs must not be fetched automatically. Stable placeholder icon slots are required so later icon
work can improve visual fidelity without changing layout contracts.

`npm run verify` is the canonical final validation command. The execution sprint also owns planning
closeout records for BW-0801 through BW-0808, EPIC-08, `work/sprints/ledger.tsv`, and
`work/runs/ticket-burn/EPIC-08/20260902T154644Z/plan-EPIC-08-result.json`.

## Use Cases

1. **Create a fresh build**: A user opens the app, sees a blank in-memory build, selects a primary
   profession, optionally selects a secondary profession, chooses PvE, PvP, or unknown mode, and
   starts editing without needing a saved library.
2. **Allocate attributes**: A user sees profession-owned attributes, purchased ranks, total spent
   points, and remaining points under the EPIC-03 level-20 PvE default budget where applicable.
   Primary-only or inaccessible imported attributes remain visible and become warnings instead of
   being deleted.
3. **Find skills**: A user searches by skill name, filters by profession, attribute, type, elite
   status, mode availability, and cheap resource facts, then switches between list, small-grid, and
   large-grid views without losing filter state.
4. **Build an eight-slot bar**: A user places browser skills into slots, swaps slots, reorders
   filled slots, clears slots, preserves empty slots, and can perform equivalent operations with the
   keyboard.
5. **Inspect skill facts**: A user can read skill name, type, profession, attribute, elite marker,
   mode availability, cost/timing facts, and tooltip text for browser results and bar slots.
   Attribute-scaled tooltip values update when authored ranks change.
6. **Import a template**: A user pastes a bare skill template code or `[name;code]` chat wrapper,
   sees decoded professions, attributes, and skill slots in the editor, and receives typed,
   product-owned error messages for invalid input.
7. **Preserve unresolved imports**: Unknown, stale, dispositioned, reserved, unsupported, or empty
   template facts remain representable with clear placeholders until the user explicitly replaces or
   clears them.
8. **Export safely**: A user can re-export an unchanged imported template through exact-source
   replay. After semantic edits, the user can export a canonical template only when encode/decode
   proof succeeds and validation policy allows it.
9. **Validate while editing**: A user sees a compact global validation summary plus inline issues
   near professions, attributes, skill slots, and template dialogs where locations are available.
   Warnings, incomplete state, and unresolved imports do not block normal editing.
10. **Use the editor accessibly**: Pointer and keyboard users can complete the core desktop editing
    path. Narrow screens, long template names/codes, no-result filters, unsupported tooltip data,
    and dialog overflow degrade predictably rather than breaking layout.

## Architecture

### Layer Boundaries

| Layer | Owns | Must Not Own |
| --- | --- | --- |
| `data/generated/epic-03` and `data/generated/epic-04` | Promoted runtime catalog JSON only. | React components, UI copy, generated manifests in runtime, QA reports in runtime, source snapshots, wiki fetches, or icon bytes. |
| `src/domain` | Framework-neutral contracts, catalog lookup helpers, validation, effective-rank calculation, and tooltip text projection. | React, DOM APIs, storage, network, app modules, template codec dependency calls, generated manifests, QA reports, or data scripts. |
| `src/template-compatibility` | Skill template parse/decode/export and exact-source/canonical fidelity proof behind the pinned `@buildwars/gw-templates@1.1.1` adapter. | UI presentation, local library behavior, generated data imports, storage, network, or dependency-specific errors leaking to users. |
| `src/app/catalogs*` | The only app-side static imports of promoted catalog JSON; app-ready catalog views, attribution facts, placeholder-icon policy, validation-catalog projection, and reverse template crosswalk helpers. | Leaf UI rendering details, editor reducer mutation logic, direct imports of manifests/QA/source plans/snapshots/scripts, or remote media fetching. |
| `src/app/editor*` | In-memory editor state, reducer/actions, selectors, import metadata, unresolved placeholders, validation/export policy projection, fixtures, and tests. | Domain rule definitions, template codec internals, persistence, saved libraries, party/equipment/title semantics, or data ingestion. |
| `src/app/components*` | Accessible React controls for professions, attributes, browser, skill bar, tooltips, dialogs, validation, layout, and state presentation. | Direct `data/generated/**` imports, source-policy decisions, persistence, validation rules, or template codec internals. |

The exact file split can remain small, but responsibilities should stay separate:

- `src/app/catalogs.ts` or `src/app/catalogs/index.ts` is the static runtime catalog boundary.
- `src/app/editor-state.ts` or `src/app/editor/state.ts` owns reducer data and pure actions.
- `src/app/editor-selectors.ts` or `src/app/editor/selectors.ts` owns derived views for UI,
  validation, tooltip ranks, browser filtering, and export.
- `src/app/editor-fixtures.ts` or test-local fixtures cover playable, incomplete, and unresolved
  imported states.
- React components should be decomposed by workflow surface only after state and selector contracts
  are clear. Avoid over-abstracting into a design system during this sprint.

### Catalog Boundary

Only one app-owned module should statically import:

- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-04/skills.catalog.json`

That module should cast or validate those imports against `ProfessionAttributeCatalog` and
`SkillCatalog` contracts, then expose app-facing views rather than raw JSON paths. Expected views:

- catalog version and generation facts for visible attribution;
- source names, canonical URLs, and source family facts needed for a minimal attribution strip or
  footer before source-derived names/facts appear;
- profession options and secondary-profession options, including the `None` semantic where needed;
- attributes grouped by profession, with primary-only and primary-attribute markers;
- attribute point rules and `attributeBudgetForLevel`/`purchasedRankCost` access through selectors;
- skill records indexed by catalog ID, normalized search key, profession, attribute, type, mode
  availability, elite flag, and resource facts;
- placeholder icon view data for profession, browser, grid, skill-bar, and tooltip contexts;
- validation catalog projections matching `BuildValidationInput`;
- reverse template crosswalk helpers from known catalog records to template IDs for canonical
  export; and
- source-scan tests proving no other app module imports generated artifacts directly.

Remote icon metadata may be retained for later decisions, but the browser must not request remote
icon URLs automatically in EPIC-08. Placeholder icon slots should have stable dimensions across
list, grid, slot, tooltip, loading, empty, unresolved, hover, focus, and invalid states.

### Editor State Model

The app should use a single in-memory editor state with a domain `Build` projection plus app-only
metadata. The reducer should be pure and deterministic. A suitable shape is:

- `build`: the current catalog-space `Build` projection used by domain APIs whenever facts are
  resolved or intentionally authored as stale catalog IDs;
- `mode`: either inside `build.mode` or updated through the same reducer action so selectors do not
  fork mode semantics;
- `templateSource`: the last imported `SkillTemplateDocument`, source fingerprint, name, and
  exact-source eligibility when present;
- `slotMetadata`: per-slot source metadata for unresolved template IDs, empty-slot sentinel `0`,
  dispositioned records, known template IDs, user-edited state, and placeholder labels;
- `attributeMetadata`: per-attribute imported template ID, lookup outcome, and unresolved or
  inaccessible status;
- `professionMetadata`: imported primary/secondary template lookup outcomes, including `none`,
  reserved, unsupported, and unknown;
- `ui`: selected browser filters, browser view, focused/selected slot, drag state, active dialog,
  parse/export diagnostics, and non-persistent transient state; and
- `revision`: a deterministic counter or semantic fingerprint input used to invalidate exact-source
  export when relevant fields change.

The reducer should expose narrowly named actions:

- initialize empty editor;
- set build name;
- set game mode;
- set primary profession;
- set secondary profession;
- set purchased attribute rank;
- clear attribute row or unresolved imported attribute;
- place skill into slot from browser;
- place unresolved imported skill placeholder from template resolution;
- swap or move slots;
- clear slot;
- import decoded template resolution;
- update template name;
- mark semantic edit for exact-source invalidation; and
- reset editor to empty.

Do not force every unresolved raw template ID into a `SkillId`, `AttributeId`, or `ProfessionId` just
to satisfy the `Build` type. If validation cannot faithfully represent a template-space unresolved
fact, preserve it in app metadata and show an app-level import/export warning alongside rule-engine
issues. If execution decides to project a raw numeric template ID into a branded catalog ID for
validation, the helper must be explicit, tested, and documented as an EPIC-08 compatibility shim.

### Validation And Issue Presentation

Validation should be selector-driven:

1. build a `BuildValidationInput` from the current `EditorState`;
2. pass the app catalog boundary's validation catalog projections to `validateBuild`;
3. retain the domain result's `valid`, `complete`, `resolved`, `exhaustive`, `counts`,
   `validatedAgainst`, and `truncation` fields without redefining them in React;
4. map issue `location` values to profession controls, attribute rows, skill slots, global catalog
   alerts, options, and dialogs; and
5. merge app-level import/export diagnostics only at the presentation layer, with distinct labels so
   users can tell rule-engine validation from template compatibility warnings.

Editing is not blocked by warnings, incomplete builds, unresolved imports, or non-exhaustive
warnings. Canonical export is blocked by proven validation errors, lossy encode failures, and
missing required template mappings. Exact-source re-export remains available for semantically
unchanged imported templates even when unresolved placeholders are still present, because fidelity is
owned by EPIC-05's source replay contract.

### Template Import And Export

Import flow:

1. accept user input in a dialog with bounded fields and overflow handling;
2. call `decodeSkillTemplate`;
3. call `resolveSkillTemplateDocument` with app catalog boundary data;
4. convert known professions, attributes, and skill slots into the editor state;
5. preserve `none`, empty slot `0`, unknown, reserved, unsupported, and dispositioned outcomes as
   explicit metadata and placeholders;
6. retain `source.originalInput`, `source.originalBareCode`, `templateName`, and
   `semanticFingerprint` for exact-source replay; and
7. show typed parse/decode/resolution diagnostics as product messages without dependency internals.

Export flow:

1. if the current semantic template facts still match the imported document, prefer
   `exportSkillTemplate` with source preservation unless the user explicitly requests canonical;
2. after semantic edits, construct a skill template document from editor state using app-boundary
   reverse crosswalk helpers and preserved unresolved raw template IDs where they are still valid
   template-space facts;
3. block canonical export when a selected catalog fact has no template mapping, a required template
   field is unresolved in the wrong namespace, validation has proven errors, or encode/decode-back
   proof fails;
4. display exact-source versus field-complete-normalized fidelity in the export dialog; and
5. keep saved template library, persisted names, share URLs, paw-ned2/team templates, and equipment
   templates out of scope.

### Browser, Skill Bar, And Tooltip Flow

The browser and bar should share selectors over the same editor state:

- browser filters produce deterministic result sets independent of object insertion order;
- grouping defaults to attribute, with sort by name or type where current catalog fields support it;
- list, small-grid, and large-grid views reuse the same result model and placement actions;
- selecting or dragging a browser skill places that catalog skill into a chosen skill-bar slot;
- slot-to-slot operations move, swap, reorder, or clear without corrupting empty/unresolved slots;
- keyboard alternatives use explicit commands rather than hidden drag-only behavior;
- tooltips use `renderSkillTooltipText` with a context built from current mode and effective ranks;
- attribute-scaled rank keys use authored effective attribute rank;
- title-scaled progression uses the documented max-title-rank display assumption until EPIC-15; and
- unsupported descriptions, missing progression rows, unknown mode variants, or unresolved IDs
  produce stable non-crashing tooltip states.

The sprint may use native HTML drag/drop or pointer events for the limited eight-slot model. Adding a
drag/drop dependency is a scope and dependency decision; it should happen only if execution proves
the native approach cannot meet keyboard parity, testability, and stable state semantics within this
sprint.

### UI Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| App shell | Replace the minimal shell with the actual editor workspace, attribution surface, validation summary, and dialogs. | Marketing/landing page, routing, deployment, auth, analytics, or PWA behavior. |
| Catalog facts | Profession, attribute, skill, mode availability, cost/timing, classification, progression, version, source, and attribution facts from promoted catalogs. | Manifests, QA reports, raw snapshots, source plans, wiki APIs, media bytes, copied guide prose, acquisition data, or unreviewed copied descriptions. |
| Editor state | One in-memory working single-character build with unresolved import metadata and deterministic actions. | Local storage, persisted library, multi-build tabs, party/hero state, equipment state, guide state, migrations, or share links. |
| Professions/attributes | Primary, secondary, mode, purchased ranks, point budget display, primary-only warnings, unresolved imported rows. | Campaign unlocks, quest-log state, hero attribute policy, runes, headgear, titles, equipment-derived ranks, or account constraints. |
| Skill browser | Name search, filters available from current catalog fields, grouping, sort, list/small-grid/large-grid views, no-result/loading/error states. | Recommendations, fuzzy ranking, community search, backend indexing, acquisition search, guide search, or icon fetching. |
| Skill bar | Eight stable slots, empty slots, known skills, unresolved placeholders, placement, replace, swap, reorder, clear, pointer and keyboard flows. | Party-wide bars, hero AI ordering, persisted hotkeys, mobile-first gesture design, equipment templates, or team templates. |
| Tooltips | Catalog facts, cost/timing display, tooltip text projection, effective authored ranks, title max-rank assumption, unresolved states. | Runtime source-prose review, title ownership controls, allegiance selection, equipment/rune/weapon effects, or copied media. |
| Templates | Skill template import/export dialogs for bare codes and chat wrappers, exact-source replay, canonical proof, error/overflow/focus states. | Saved template library, clipboard permission complexity, local storage, equipment templates, paw-ned2/team templates, or share URLs. |
| Validation | Global summary, inline locations, issue counts/status fields, export policy wiring, responsive/accessibility closeout. | New validation rules for equipment, titles, heroes, parties, guides, recommendations, or publishing policy. |

## Implementation

### Phase 1: BW-0801 App Catalog Boundary, Attribution, And Import Enforcement

**Goal:** Create the only app-side runtime catalog import boundary before any UI component consumes
source-derived facts.

**Files:**

- `src/app/catalogs.ts` or `src/app/catalogs/index.ts`
- `src/app/catalogs.test.ts` or equivalent app test
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`
- optional test helper under `src/app` or test-local fixtures
- `work/tickets/08-core-build-editor/BW-0801-app-catalog-boundary-and-attribution.md`

**Tasks:**

- [ ] Add an app catalog module that statically imports only the EPIC-03 professions/attributes
      catalog JSON and EPIC-04 skills catalog JSON.
- [ ] Type the imports against `ProfessionAttributeCatalog` and `SkillCatalog` without moving JSON
      imports into domain or template-compatibility modules.
- [ ] Expose app-ready views for professions, attributes, skill records, catalog versions,
      generated timestamps, source attribution facts, remote media metadata, and placeholder icon
      policy.
- [ ] Expose validation-catalog projections expected by `validateBuild`.
- [ ] Expose reverse template crosswalk helpers needed later for canonical export.
- [ ] Render minimal visible attribution in the editor before source-derived names or facts appear.
- [ ] Render stable placeholder icon slots for professions, skill browser rows/tiles, skill-bar
      slots, and tooltips without requesting remote image URLs.
- [ ] Add a source-scan test that fails if leaf app components directly import `data/generated/**`
      or forbidden generated artifacts.
- [ ] Keep generated manifests, QA reports, source plans, snapshots, Python data tooling, wiki APIs,
      and remote media bytes out of runtime app imports.

**Verification:**

- `npm run verify`
- Targeted test for the app catalog boundary views and attribution facts
- Source scan confirming only the approved boundary imports the two promoted catalog JSON files
- Browser/network review, or test-level assertion where practical, that placeholder icons do not
  fetch remote wiki URLs

**Phase Gate:** App UI can display catalog-derived names/facts only through the catalog boundary,
with visible attribution and no remote media fetches.

### Phase 2: BW-0802 In-Memory Editor State, Selectors, And Fixtures

**Goal:** Establish deterministic editor state before building workflow components on top of it.

**Files:**

- `src/app/editor-state.ts` or `src/app/editor/state.ts`
- `src/app/editor-selectors.ts` or `src/app/editor/selectors.ts`
- `src/app/editor-fixtures.ts` or test-local fixtures
- `src/app/editor-state.test.ts` or equivalent
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `work/tickets/08-core-build-editor/BW-0802-editor-state-model-and-fixtures.md`

**Tasks:**

- [ ] Define an `EditorState` that wraps a domain `Build` projection with app-only import metadata,
      unresolved placeholders, exact-source eligibility, UI state, and deterministic revision data.
- [ ] Define a pure reducer or action helpers for initializing, selecting professions, setting
      mode, editing attributes, placing skills, moving/swapping slots, clearing slots, importing
      template resolution, and resetting the editor.
- [ ] Preserve null professions, empty skill slots, partially allocated attributes, unknown mode,
      unresolved raw template IDs, dispositioned skills, and stale catalog IDs until explicit user
      replacement or clearing.
- [ ] Add selectors for validation input, attribution display, browser filter inputs, tooltip rank
      context, slot labels, unresolved placeholders, and export eligibility.
- [ ] Add fixtures for a playable build, an incomplete build, and an imported build with unresolved
      profession/attribute/skill facts.
- [ ] Test reducer determinism, non-mutating updates, exact-source invalidation on semantic edits,
      and preservation of unresolved import metadata.
- [ ] Document any intentional compatibility shim that projects raw unresolved numeric IDs into a
      domain `Build`; prefer app-level unresolved metadata when catalog/template namespaces differ.

**Verification:**

- `npm run verify`
- Focused reducer/selector tests for playable, incomplete, and unresolved imported states
- Tests proving slot count remains `SKILL_BAR_SLOT_COUNT` and browser refresh is allowed to lose
  in-memory state

**Phase Gate:** The app has a tested state core that can represent all EPIC-08 in-progress and
imported states without persistence or namespace loss.

### Phase 3: BW-0803 Profession, Mode, And Attribute Editor

**Goal:** Build the profession, mode, and attribute controls on top of the catalog boundary and
editor state.

**Files:**

- `src/app/App.tsx`
- `src/app/styles.css`
- profession/mode/attribute components under `src/app`
- editor selectors and tests from Phase 2
- `src/app/App.test.tsx` or focused component tests
- `work/tickets/08-core-build-editor/BW-0803-profession-mode-and-attribute-editor.md`

**Tasks:**

- [ ] Add primary and secondary profession selectors backed by catalog-boundary profession options.
- [ ] Model secondary `None` distinctly from unresolved or unsupported imported secondary facts.
- [ ] Add PvE, PvP, and unknown mode controls.
- [ ] Display profession-owned attributes for the selected profession pair, including primary
      attribute treatment and primary-only markers.
- [ ] Support purchased rank editing with keyboard-accessible numeric controls.
- [ ] Calculate spent and remaining attribute points through catalog rules and
      `purchasedRankCost`/`attributeBudgetForLevel`, using the EPIC-03 level-20 PvE maximum quest
      budget default where applicable.
- [ ] Keep level and attribute-quest UI minimal: display the default assumption and add controls
      only if needed to satisfy validation/export policy.
- [ ] Preserve inaccessible imported attributes as rows with warnings rather than dropping them when
      professions change.
- [ ] Surface primary-only, wrong-profession, duplicate, invalid-rank, and unresolved attribute
      issues near affected controls when validation is available.
- [ ] Verify controls with pointer and keyboard interactions in desktop-sized and narrow layouts.

**Verification:**

- `npm run verify`
- Component/integration tests for selecting profession pair, changing mode, editing ranks, and
  preserving unresolved imported attributes
- Tests or assertions that attribute totals use catalog rules rather than duplicated UI constants

**Phase Gate:** A user can configure professions, mode, and level-20 attribute ranks for a normal
single-character build while retaining unresolved imported rows.

### Phase 4: BW-0804 Skill Browser Search, Filters, Grouping, And Views

**Goal:** Provide a deterministic browser for finding and selecting skills from the promoted skill
catalog.

**Files:**

- browser components under `src/app`
- `src/app/editor-selectors.ts` or browser-specific selectors
- `src/app/App.tsx`
- `src/app/styles.css`
- browser/component tests
- `work/tickets/08-core-build-editor/BW-0804-skill-browser-search-filters-and-views.md`

**Tasks:**

- [ ] Add text search by skill name using normalized catalog names and stable ordering.
- [ ] Add filters for profession, attribute, skill type, elite/non-elite, and PvE/PvP/both
      availability.
- [ ] Add cheap resource filters for energy, adrenaline, sacrifice, upkeep, and overcast only where
      existing `SkillCostProfile` fields support them.
- [ ] Implement grouped-by-attribute results by default, with optional sort by name or type.
- [ ] Implement list, small-grid, and large-grid views over one shared result model.
- [ ] Include empty catalog, no-result, loading, and error states owned by Build Wars product copy
      rather than screenshot inference.
- [ ] Keep row/tile/icon dimensions stable across view mode, hover, focus, selected, loading,
      placeholder, and no-result states.
- [ ] Connect browser selection to the Phase 5 placement flow without duplicating slot mutation
      logic.
- [ ] Cover common filter combinations and no-result behavior in tests.

**Verification:**

- `npm run verify`
- Selector tests for search, filters, grouping, sort, and no-result cases
- Component tests for switching list/small-grid/large-grid views without losing filter state

**Phase Gate:** A user can narrow the skill catalog predictably and choose skills for placement
without direct generated-data imports or new data requirements.

### Phase 5: BW-0805 Eight-Slot Skill Bar Placement, Reorder, Clear, And Keyboard Parity

**Goal:** Implement the game-like eight-slot bar interaction model without corrupting unresolved
state.

**Files:**

- skill-bar components under `src/app`
- `src/app/editor-state.ts` or slot reducer helpers
- `src/app/editor-selectors.ts`
- `src/app/App.tsx`
- `src/app/styles.css`
- skill-bar/component tests
- `work/tickets/08-core-build-editor/BW-0805-drag-drop-skill-bar.md`

**Tasks:**

- [ ] Render exactly eight stable slots using `SKILL_BAR_SLOT_COUNT`.
- [ ] Support placing a browser skill into an empty or filled slot.
- [ ] Support replacing a filled slot with another selected browser skill.
- [ ] Support dragging or otherwise moving filled slots to reorder or swap them.
- [ ] Support clearing a slot through an obvious accessible clear action.
- [ ] Preserve empty slots, unresolved placeholders, imported raw IDs, and exact-source metadata
      until the user explicitly edits the affected semantic field.
- [ ] Provide keyboard equivalents for placing, moving, swapping, and clearing skills.
- [ ] Keep slot dimensions stable for empty, known, unresolved, invalid, hover, focus, active-drag,
      and disabled states.
- [ ] Ensure slot operations share reducer actions rather than manipulating component-local arrays.
- [ ] Test drag/drop or pointer behavior where practical and always test the underlying reducer and
      keyboard alternatives.

**Verification:**

- `npm run verify`
- Reducer tests for place, replace, swap, move, clear, empty slot preservation, and unresolved
  placeholder preservation
- Component/integration tests for pointer and keyboard slot operations

**Phase Gate:** A user can assemble and rearrange a skill bar with pointer or keyboard input, and
unresolved imported slots remain safe until explicit replacement or clearing.

### Phase 6: BW-0806 Skill Display, Tooltip Text, And Effective Rank Context

**Goal:** Render catalog skill facts and dynamic tooltip text consistently across browser, grid, and
bar surfaces.

**Files:**

- skill display and tooltip components under `src/app`
- `src/app/editor-selectors.ts`
- `src/app/catalogs.ts`
- `src/app/App.tsx`
- `src/app/styles.css`
- tooltip/display tests
- `work/tickets/08-core-build-editor/BW-0806-skill-display-and-tooltips.md`

**Tasks:**

- [ ] Display skill name, type, profession, attribute, elite marker, mode availability, cost facts,
      and timing facts from catalog-boundary views.
- [ ] Use placeholder icon slots rather than remote icon URLs.
- [ ] Build tooltip rank context from authored attributes using `calculateEffectiveAttributeRank`
      or equivalent domain-backed selector behavior.
- [ ] Pass selected mode and rank context into `renderSkillTooltipText`.
- [ ] Use a documented max-title-rank display assumption for title-scaled progression until EPIC-15
      owns title ranks and allegiance.
- [ ] Show unresolved tooltip states for unknown skills, unknown mode variants, missing rank values,
      title dependencies, unsupported descriptions, and missing progression series.
- [ ] Make tooltip access available from browser rows, grid tiles, and skill-bar slots for pointer
      and keyboard flows.
- [ ] Follow `compendium/visual-prior-art.md` hierarchy guidance without copying screenshots, icon
      assets, exact geometry, or unreviewed long-form source prose.
- [ ] Test that attribute-scaled tooltip values update when purchased ranks change.

**Verification:**

- `npm run verify`
- Tests for rendered tooltip text, unresolved tooltip states, title-rank assumption, and rank-change
  updates
- Manual or component-level check that tooltip content does not require remote media

**Phase Gate:** Skill facts and tooltip text are dynamic, source-policy-safe, and consistent across
all skill display surfaces.

### Phase 7: BW-0807 Skill Template Import And Export Dialogs

**Goal:** Add user-facing skill template import/export while preserving EPIC-05 fidelity guarantees.

**Files:**

- template dialog components under `src/app`
- `src/app/editor-state.ts`
- `src/app/editor-selectors.ts`
- `src/app/catalogs.ts`
- `src/app/App.tsx`
- `src/app/styles.css`
- import/export tests
- `work/tickets/08-core-build-editor/BW-0807-template-import-export-dialogs.md`

**Tasks:**

- [ ] Add an import dialog that accepts bare skill template codes and `[name;code]` chat wrappers.
- [ ] Call `decodeSkillTemplate` and show typed parse/decode failures with product-owned messages.
- [ ] Resolve decoded templates through `resolveSkillTemplateDocument` using the app catalog
      boundary.
- [ ] Convert known template outcomes into editor state while preserving unknown, reserved,
      unsupported, dispositioned, none, and empty-slot outcomes as explicit metadata.
- [ ] Preserve imported wrapper names where supported by the parser contract.
- [ ] Preserve exact-source re-export eligibility while semantic fields remain unchanged.
- [ ] Invalidate exact-source eligibility when profession, attribute, or skill-slot semantics
      change, while still retaining enough source metadata for user explanation.
- [ ] Add an export dialog that can show exact-source and canonical paths, fidelity labels, errors,
      and copied output.
- [ ] Allow canonical export only when reverse template mappings exist, validation policy permits
      it, and `exportSkillTemplate` returns a field-complete-normalized code.
- [ ] Handle long names, long codes, empty input, invalid wrappers, copy failures, dialog focus,
      overflow, and narrow screens.
- [ ] Keep saved template libraries, local storage, share URLs, equipment templates, and paw-ned2
      team templates out of scope.

**Verification:**

- `npm run verify`
- Tests for valid import, invalid input, wrapper name preservation, unresolved ID placeholders,
  exact-source re-export, canonical export, and lossy/error states
- Dialog accessibility tests for focus management, escape/close behavior, overflow, and keyboard
  submission

**Phase Gate:** A user can import and export supported skill templates without losing unresolved raw
IDs or leaking codec internals.

### Phase 8: BW-0808 Validation Presentation, Responsive Polish, Verification, And Closeout

**Goal:** Integrate rule-engine feedback, finish UX states, and close EPIC-08 cleanly.

**Files:**

- validation components/selectors under `src/app`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`
- relevant component/reducer tests
- `compendium` notes only if execution records an enduring implementation decision
- `work/tickets/08-core-build-editor/*.md`
- `work/tickets/08-core-build-editor/EPIC.md`
- `work/sprints/SPRINT-009.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/EPIC-08/20260902T154644Z/plan-EPIC-08-result.json`

**Tasks:**

- [ ] Run `validateBuild` against the current editor state through selector-built validation input.
- [ ] Render a compact global summary using `valid`, `complete`, `resolved`, `exhaustive`, counts,
      catalog versions, and truncation.
- [ ] Render inline located issues near primary/secondary profession controls, attribute rows,
      skill slots, catalog/options alerts, and template dialogs where location data supports it.
- [ ] Keep warnings, incomplete state, and unresolved imports non-blocking for normal editing.
- [ ] Wire export policy so canonical export blocks on proven validation errors, missing template
      mappings, or lossy encode failures; exact-source replay remains available for semantically
      unchanged imports.
- [ ] Verify desktop-browser-first layout, narrow screens, keyboard focus, loading states, empty
      states, error states, no-result states, placeholder icon slots, long text, long template
      codes, and dialog overflow.
- [ ] Add focused tests for the end-to-end create/edit/validate/import/export workflow.
- [ ] Review app imports for forbidden generated artifacts, source plans, QA reports, source
      snapshots, data scripts, wiki APIs, and remote media fetches.
- [ ] Update BW-0801 through BW-0808 status records, EPIC-08 status, `work/sprints/SPRINT-009.md`,
      `work/sprints/ledger.tsv`, and the ticket-burn result JSON according to project planning
      conventions.
- [ ] Record deferred work for EPIC-09, EPIC-15, equipment, party/hero, guide, media, and
      recommendation epics in closeout notes.
- [ ] Run final `npm run verify`.

**Verification:**

- `npm run verify`
- Source scan for forbidden app imports and remote media usage
- Manual smoke pass of create, edit, validate, import, exact-source export, canonical export, narrow
  layout, keyboard slot operations, and dialog overflow

**Phase Gate:** EPIC-08 is complete, closeout records agree on source target/epic/sprint/tickets,
and no deferred scope was pulled into the MVP.

## Files Summary

Expected implementation files:

- `src/app/App.tsx`: replace the minimal shell with the composed editor workspace.
- `src/app/App.test.tsx`: expand app-level workflow and accessibility coverage.
- `src/app/styles.css`: editor layout, controls, placeholder icons, responsive states, dialogs,
  validation, and tooltip styling.
- `src/app/catalogs.ts` or `src/app/catalogs/index.ts`: the only app-side promoted catalog JSON
  import boundary.
- `src/app/editor-state.ts` or `src/app/editor/state.ts`: pure editor reducer/actions and state
  contracts.
- `src/app/editor-selectors.ts` or `src/app/editor/selectors.ts`: derived app views for validation,
  browser results, tooltips, slots, attribution, and export policy.
- `src/app/editor-fixtures.ts` or test-local fixtures: playable, incomplete, and unresolved import
  fixture states.
- Additional `src/app` component files as needed for professions, attributes, browser, skill bar,
  skill display, tooltips, template dialogs, and validation.
- Focused test files under `src/app` or existing test conventions for catalog boundary, editor
  state, browser selectors, skill-bar interactions, tooltips, dialogs, and validation.

Expected planning/closeout files during execution:

- `work/tickets/08-core-build-editor/BW-0801-app-catalog-boundary-and-attribution.md`
- `work/tickets/08-core-build-editor/BW-0802-editor-state-model-and-fixtures.md`
- `work/tickets/08-core-build-editor/BW-0803-profession-mode-and-attribute-editor.md`
- `work/tickets/08-core-build-editor/BW-0804-skill-browser-search-filters-and-views.md`
- `work/tickets/08-core-build-editor/BW-0805-drag-drop-skill-bar.md`
- `work/tickets/08-core-build-editor/BW-0806-skill-display-and-tooltips.md`
- `work/tickets/08-core-build-editor/BW-0807-template-import-export-dialogs.md`
- `work/tickets/08-core-build-editor/BW-0808-validation-responsive-polish-and-closeout.md`
- `work/tickets/08-core-build-editor/EPIC.md`
- `work/sprints/SPRINT-009.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/EPIC-08/20260902T154644Z/plan-EPIC-08-result.json`

Files that must not be modified for this sprint unless a new explicit ticket changes scope:

- `data/generated/**` other than reading the two promoted catalog JSON files at runtime
- `data/qa/**`
- `data/source-snapshots/**`
- `scripts/data/**`
- generated manifests
- source plans
- raw snapshots
- remote media bytes or icon caches
- package dependency files solely for optional UI polish
- `src/domain/**` unless execution proves an app task cannot be represented with public domain APIs
- `src/template-compatibility/**` unless execution finds a bug in an existing public compatibility
  contract

Any proposed modification to `src/domain` or `src/template-compatibility` during execution should be
treated as an architecture checkpoint, because EPIC-08 is expected to consume those layers rather
than redefine them.

## Definition of Done

- BW-0801 through BW-0808 are implemented in dependency order and marked complete according to
  project ticket conventions.
- `src/app` imports promoted catalog JSON only through one app-owned catalog boundary.
- Leaf UI components do not import `data/generated/**`, generated manifests, QA reports, source
  plans, snapshots, Python data tooling, wiki APIs, or remote media bytes.
- Catalog attribution is visible before source-derived profession, attribute, and skill facts are
  shown.
- Remote wiki icon URLs are not fetched automatically; placeholder icon slots are stable across
  browser, grid, skill-bar, and tooltip contexts.
- A user can create and edit a single-character in-memory build with primary profession, optional
  secondary profession, mode, attributes, and an eight-slot skill bar.
- Empty skill slots, null professions, unknown mode, stale IDs, unresolved raw template IDs, and
  dispositioned imports remain representable until explicit replacement or clearing.
- Attribute point totals use catalog rules, not duplicated UI constants.
- Browser search/filter/grouping/list/grid behavior is deterministic and covered by tests.
- Skill placement, replacement, swapping, reordering, and clearing work with pointer and keyboard
  input.
- Skill facts and tooltip text render from catalog/domain helpers, with authored effective attribute
  ranks and the documented max-title-rank assumption.
- Unsupported descriptions, missing progression values, unknown mode variants, and unresolved
  skills render explainable non-crashing states.
- Template import accepts supported bare codes and chat wrappers, preserves wrapper names where
  supported, and displays typed failures without dependency internals.
- Exact-source re-export is available for semantically unchanged imported templates.
- Canonical export is available only when validation/export policy permits it and encode/decode-back
  proof succeeds.
- Validation is visible globally and inline, using `valid`, `complete`, `resolved`, `exhaustive`,
  counts, locations, catalog versions, and truncation from `validateBuild`.
- Warnings, incomplete builds, and unresolved imports do not block normal editing.
- Desktop-browser workflows, narrow screens, keyboard focus, loading, empty, error, no-result,
  tooltip, and dialog overflow states are usable.
- Deferred work for EPIC-09, EPIC-15, equipment, party/hero, guide, media, and recommendation scope
  is recorded in closeout.
- `work/sprints/SPRINT-009.md`, EPIC-08 ticket records, `work/sprints/ledger.tsv`, and
  `work/runs/ticket-burn/EPIC-08/20260902T154644Z/plan-EPIC-08-result.json` agree on source target,
  source epic, sprint ID, tickets, assumptions, and status.
- Final `npm run verify` passes.

## Risks

- **Catalog namespace leakage:** Template IDs and catalog IDs are numerically similar today but are
  separate contracts. Collapsing unresolved template IDs into catalog IDs can hide data loss and
  corrupt export behavior.
- **App boundary erosion:** Once UI work starts, leaf components may be tempted to import generated
  JSON directly. The sprint needs an explicit source-scan guard, not just convention.
- **Scope creep from adjacent epics:** Persistence, title rank ownership, equipment-derived ranks,
  party/hero builds, guide authoring, media caching, and recommendations are natural follow-ons but
  would make EPIC-08 too broad.
- **Template fidelity edge cases:** Exact-source replay, wrapper name handling, semantic edits,
  unresolved raw IDs, and canonical proof can diverge if the editor state does not retain enough
  import metadata.
- **Validation policy confusion:** `valid`, `complete`, `resolved`, and `exhaustive` are not the
  same. UI copy and export gating must preserve those distinctions.
- **Drag/drop complexity:** Pointer interactions can become hard to test or inaccessible if not
  backed by reducer-level slot actions and keyboard alternatives.
- **Tooltip progression gaps:** Missing rank rows, title dependencies, mode variants, and
  structured-only descriptions can produce unresolved states that need clear UI instead of crashes.
- **Source policy mistakes:** Source-derived facts require visible attribution, and remote media
  metadata must not become automatic browser fetches.
- **Responsive density:** Prior art favors dense panels, but web controls need accessible targets,
  focus visibility, overflow behavior, and narrow-screen layout that screenshots do not specify.
- **Broad final verification:** `npm run verify` covers formatting, lint, typecheck, tests, build,
  data tests, and ticket-burn tests; late failures can expose issues outside the immediate component
  being edited.

## Security

- The editor remains local-first and in-memory. Do not add network calls, auth, analytics, hosted
  sharing, persistence, or background sync in EPIC-08.
- Do not fetch remote wiki icon URLs automatically. Keep icon facts as metadata and render local
  placeholders.
- Do not import generated manifests, QA reports, source plans, raw snapshots, Python ingestion
  modules, wiki APIs, or remote media bytes into runtime app code.
- Treat template input as untrusted text. Enforce existing parser limits, show typed errors, and do
  not expose dependency stack traces or internals.
- Do not render catalog or template text through `dangerouslySetInnerHTML`; render plain React text
  nodes and controlled line breaks.
- Clipboard behavior, if implemented, should be a direct user action with clear success/failure
  feedback. Do not build background clipboard polling or broad permission flows.
- Source-derived names and facts must include visible attribution before display. Copied
  source-authored prose, guide text, ratings, recommendations, screenshots, and media bytes remain
  prohibited unless a later explicit ticket approves them.
- Keep domain and template modules free of DOM, storage, network, app, and generated-data imports.
- Dialogs should manage focus and escape/close behavior predictably so keyboard users are not
  trapped outside active controls or left in hidden content.
- Avoid persisting pasted template codes, imported names, or build state to storage in this sprint.

## Dependencies

- EPIC-03 promoted `data/generated/epic-03/professions-attributes.catalog.json`, including
  profession/attribute records, template crosswalks, attribution/provenance facts, icon metadata,
  and attribute point rules.
- EPIC-04 promoted `data/generated/epic-04/skills.catalog.json`, including skill records,
  dispositions, costs, timings, descriptions, progression series, split groups, source-set summary,
  attribution/provenance facts, and remote media metadata.
- EPIC-05 provides `decodeSkillTemplate`, `exportSkillTemplate`,
  `resolveSkillTemplateDocument`, `parseTemplateInput`, `formatTemplateChatCode`, exact-source
  replay, canonical encode proof, and typed template errors.
- EPIC-06 provides `validateBuild`, `calculateEffectiveAttributeRank`, validation result semantics,
  validation locations, and unresolved/stale ID handling.
- EPIC-07 provides `compendium/visual-prior-art.md` as development-reference-only UI evidence and
  names gaps that EPIC-08 must implement itself.
- `src/domain/build.ts` provides `Build`, `GameMode`, `SkillBar`, `AttributeAllocation`, and
  `SKILL_BAR_SLOT_COUNT`.
- `src/domain/catalog.ts` and `src/domain/catalog-lookup.ts` provide catalog contracts, lookup
  outcomes, mode variant resolution, purchased rank costs, and attribute budget helpers.
- `src/domain/skill-tooltip.ts` provides tooltip text projection.
- `src/template-compatibility` isolates the pinned `@buildwars/gw-templates@1.1.1` dependency.
- React 19, Vite, TypeScript strict mode, Vitest, Testing Library, ESLint, and Prettier are the
  existing frontend/tooling stack.
- No new runtime dependency is required by the sprint plan. A drag/drop library or UI package should
  require an explicit execution-time justification and must not weaken keyboard accessibility,
  source policy, or bundle/runtime boundaries.
- `npm run verify` is the final validation dependency.

## Open Questions

1. **Unresolved template projection:** Should unresolved raw template IDs ever be projected into
   branded catalog IDs for `validateBuild`, or should they remain app-level import diagnostics until
   the domain contract explicitly supports template-space unresolved facts? Default: keep namespaces
   separate and project only with a named, tested compatibility shim.
2. **Exact attribution treatment:** What is the minimum visible attribution UI that satisfies source
   policy before showing catalog facts: a persistent footer/strip, a compact catalog notice, or
   per-surface attribution? Default: one persistent editor-level notice with catalog source/version
   access, plus no remote media fetches.
3. **Template semantic fingerprint source:** Should exact-source invalidation compare against the
   original `SkillTemplateDocument` fingerprint directly, or against an app-derived semantic
   fingerprint of editor state? Default: derive from editor state using the same field set as
   `skillTemplateFingerprint` and keep tests for every semantic edit action.
4. **Canonical export with unresolved raw IDs:** If a template still contains unresolved raw IDs
   after semantic edits, should canonical export attempt encode/decode proof using those raw IDs or
   block until the user resolves them? Default: allow only when the app can construct a complete
   skill template document and `exportSkillTemplate` proves field completeness; otherwise block with
   a clear reason.
5. **Drag/drop implementation:** Is native drag/drop or pointer-event handling enough for the
   eight-slot bar, or is a dependency justified? Default: implement reducer-backed native
   interactions first and add no dependency unless testing or accessibility requirements cannot be
   met.
6. **Level and quest UI:** Should EPIC-08 expose editable level and attribute-quest controls, or
   only display the level-20 PvE maximum-quest default assumption? Default: display the assumption
   and avoid broader progression modeling unless validation UX requires explicit controls.
7. **Cheap resource filters:** Which `SkillValueState` cases count as present for energy,
   adrenaline, sacrifice, upkeep, and overcast filters: only numeric values, or also special/text
   states? Default: filter numeric/special presence explicitly and avoid inventing numeric ranges
   not supported by catalog fields.
8. **Title-scaled tooltip rank:** Which max-title-rank value should be used for title progression
   before EPIC-15? Default: derive from the progression series rank domain when present and document
   the assumption in UI/test fixtures.
9. **Closeout compendium note:** Does EPIC-08 need a durable compendium implementation note, or are
   ticket/sprint closeout records enough? Default: add a compendium note only for enduring
   architecture decisions that future epics must depend on.
