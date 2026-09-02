---
id: SPRINT-009
title: Core Build Editor
status: done
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

This sprint turns `EPIC-08 Core Build Editor` into the first usable Build Wars editing loop. A user
can create one in-memory single-character build, select professions and mode, allocate attributes,
search and filter skills, assemble an eight-slot skill bar, inspect catalog-backed skill facts,
import a skill template, see validation feedback, and export exact-source or proven canonical skill
template output.

The implementation is an app-layer integration over completed foundations. `src/domain` remains the
authority for build shapes, catalog contracts/lookups, validation, effective attribute ranks, and
approved tooltip projection. `src/template-compatibility` remains the only skill-template codec
boundary. `src/app` owns the catalog import boundary, editor state, selectors, React components,
template workflow adaptation, export policy, attribution placement, and UI accessibility.

This is intentionally local and ephemeral. Refresh may discard the build. There is no local library,
storage migration, tags, favorites, backup/restore, share URL, equipment editor, title ownership,
allegiance selection, hero/party build, guide authoring, search backend, remote icon fetch, copied
source prose review, analytics, auth, deployment, or PWA work in this sprint.

The highest-risk part is import/export fidelity. The editor must not assume that template IDs and
catalog IDs are the same namespace. Imported raw template facts are preserved in an app-side
field-addressed overlay beside the semantic `Build`, and exact-source eligibility is derived from a
current reconstructed template fingerprint, not from a generic dirty flag.

The promoted skills catalog is a large static JSON artifact, currently about 15.4 MB with 2,951 skill
records. EPIC-08 keeps the mandated static app-side import, measures the production build result, and
uses bounded result rendering. It does not create a compact derived catalog, dynamic loader, search
worker, or virtualization dependency without a later evidence-backed ticket.

## Use Cases

1. **Start a build from scratch**: A user opens the app, sees attribution before catalog facts,
   selects PvE, PvP, or unknown mode, chooses a profession pair, and continues through incomplete
   states.
2. **Allocate attributes**: A user edits purchased ranks, sees spent and remaining points from
   EPIC-03 rules, and can keep retained imported rows visible even when they do not match the
   current professions.
3. **Find skills predictably**: A user searches by name; filters by profession, attribute, skill
   type, elite state, mode availability, and supported resource facts; and switches list,
   small-grid, and large-grid views.
4. **Build a skill bar**: A user places, replaces, moves, swaps, reorders, and clears exactly eight
   skill slots using pointer or keyboard flows.
5. **Preserve imperfect imports**: Unknown, reserved, unsupported, dispositioned, none, and empty
   template outcomes remain representable as explicit placeholders or warnings until the user
   targets the affected field.
6. **Inspect skill details**: A user opens the same skill display from browser rows, grid tiles, or
   bar slots and sees approved facts, cost/timing values, tooltip text, structured progression
   values, and non-crashing unresolved states.
7. **Import and export templates**: A user imports a bare skill template code or `[name;code]`
   wrapper, edits the result, exact-replays unchanged imports, and receives canonical output only
   after projection, validation policy, encode, and decode-back proof pass.
8. **Understand validation**: A user sees a compact global summary and inline located issues without
   ordinary editing being blocked by warnings, incomplete state, unresolved facts, or non-exhaustive
   results.
9. **Use the editor accessibly**: Desktop-browser use is primary, with narrow-screen layout, focus
   visibility, dialog overflow, tooltip access, and keyboard alternatives treated as implementation
   requirements rather than optional polish.

## Architecture

### Scope Boundary

| Area              | In Scope                                                                                                                                                                                   | Out Of Scope                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime data      | Import only the EPIC-03 professions/attributes catalog and EPIC-04 skills catalog through one app-owned boundary.                                                                          | Generated manifests, QA reports, source plans, snapshots, Python tooling, wiki APIs, candidate outputs, or remote media bytes.              |
| Catalog policy    | Visible attribution, catalog versions, source links activated only by the user, and stable placeholder icon descriptors.                                                                   | Automatic remote icon fetches, cached media, screenshot/runtime asset reuse, or copied source-authored skill prose.                         |
| Editor state      | One in-memory semantic `Build`, budget settings, field-addressed raw template overlay, browser state, dialog state, selection, drag/keyboard operation state, and transient messages.      | Persistence, local library, migrations, URL serialization, party/equipment/title/guide state, or analytics.                                 |
| UI surfaces       | Profession/mode controls, attribute editor, skill browser, eight-slot bar, shared skill display/tooltips, import/export dialogs, validation summary, inline issues, and responsive states. | Marketing pages, routing, deployment, PWA behavior, equipment editor, party builder, title ownership, guide authoring, or recommendations.  |
| Template fidelity | Bare/chat-wrapper import, exact-source replay, canonical projection, export policy, and typed user-safe errors.                                                                            | Equipment templates, paw-ned2/team templates, saved template library, clipboard permission complexity, or dependency-internal errors in UI. |
| Validation        | Existing `validateBuild` result display, structural issue routing, and canonical-export gating.                                                                                            | New rule families for equipment, titles, heroes, parties, guides, recommendations, or publish policy.                                       |

### Module Ownership

| Module                                                 | Responsibility                                                                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/catalogs.ts`                                  | Sole generated JSON import site and public app facade for catalog views, attribution, placeholder icon policy, validation catalog slices, and template crosswalk helpers. |
| `src/app/editor-state.ts`                              | Pure `EditorState`, sub-state contracts, reducer/actions, raw overlay mutation, eight-slot invariants, and transient operation state.                                     |
| `src/app/editor-selectors.ts`                          | Derived views for attributes, budgets, browser results, validation inputs/views, skill display, tooltip rank context, inline issue routing, and export policy inputs.     |
| `src/app/template-workflow.ts`                         | Decode/resolve-to-editor conversion, editor-to-template projection, exact replay detection, canonical export decision matrix, and safe user-facing workflow diagnostics.  |
| `src/app/editor-fixtures.ts`                           | App fixtures for playable, incomplete, and unresolved-import states used by tests.                                                                                        |
| `src/app/components/**` or small local component files | Accessible presentation for attribution, character controls, browser, skill bar, tooltips, dialogs, validation, modal behavior, and workspace layout.                     |
| `src/app/App.tsx`                                      | Thin composition root for catalog boundary, reducer, selectors, workflow callbacks, focus/live-region coordination, and ready/error/empty branches.                       |

`src/domain/**` and `src/template-compatibility/**` are read-only by default for SPRINT-009. If
execution proves an app task cannot be represented through existing public APIs, stop for an
architecture checkpoint in the active ticket, keep any change minimal and semantics-preserving, and
adjust protected-path verification explicitly before continuing.

### Binding Product Decisions

- Use one app-side catalog boundary; leaf components never import `data/generated/**`.
- Render attribution in DOM and visual order before source-derived profession, attribute, or skill
  facts.
- Do not pass remote icon URLs into image, CSS, preload, canvas, fetch, or placeholder props in
  EPIC-08.
- Keep raw imported template facts in a location-aligned overlay beside the semantic `Build`.
- Map known catalog facts to template facts only through explicit `templateId` fields or crosswalks.
  Never rely on numeric equality between namespaces.
- Replacing or clearing a profession, attribute row, or skill slot clears only the targeted raw
  overlay entry. Moving or swapping slots moves their overlay entries atomically.
- Import is transactional: failed parse/decode/resolve or cancel leaves the previous editor state
  unchanged; successful import replaces the semantic build and overlay together.
- Exact-source eligibility is derived from the current reconstructed template field fingerprint.
  UI-only changes and full semantic reversion must retain or regain exact replay.
- Import sets build mode to `unknown` because skill templates do not encode mode.
- PvE budget display and validation use the same explicit level/quest settings. The default is
  level 20 with maximum-applicable quest bonus. PvP and unknown mode do not inherit a PvE point
  budget.
- Title-scaled tooltip values use the progression series `rankDomain.max` as a visible
  maximum-title-rank assumption until EPIC-15 owns title state.
- Browser search is exact name substring with deterministic filters, grouping, sorting, counts, and
  bounded "Show more" rendering. Fuzzy search, recommendations, backend search, workers, and
  virtualization are deferred.
- Native pointer drag/drop plus explicit keyboard pick/place controls are the default. A new UI or
  drag/drop dependency requires a recorded architecture checkpoint and must not weaken tests,
  accessibility, or bundle policy.

### Raw Template Overlay Invariants

The semantic `Build` is the input to domain validation and most UI selectors. The raw template
overlay is the app-owned fidelity record for imported facts that may not resolve to catalog IDs or
that must replay exactly.

- Overlay keys are field addresses, not array object identities: `primaryProfession`,
  `secondaryProfession`, `attributes[index]`, and `skillBar[index]`.
- Skill slot operations update the semantic slot and overlay entry as one atomic operation.
- Attribute operations preserve authored/imported order unless an explicit user action removes a
  row. Duplicates and inaccessible rows remain representable and validation-owned.
- App-created known values canonicalize through explicit catalog `templateId` or crosswalk facts.
  Missing mappings produce projection diagnostics.
- Overlay-only unresolved facts may produce app-level diagnostics in addition to domain validation.
  Export policy must consider both sources; UI must not pretend `validateBuild` saw every raw
  template fact if the fact exists only in the overlay.
- No future EPIC-09 storage work may persist only the `Build` and drop the overlay/source contract
  without a deliberate migration decision.

### Export Decision Matrix

| Current State                                                                             | Exact-Source Export                                                                            | Canonical Export                                                             |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Unchanged imported template, including unresolved raw facts                               | Allowed when `exportSkillTemplate` returns `exact-source`; show validation notices separately. | Optional only if all canonical gates pass.                                   |
| Unchanged import with proven validation errors                                            | Still allowed for source preservation.                                                         | Blocked before encode with located validation errors.                        |
| Edited import or fresh authored build, all fields representable, no validation errors     | Not exact unless reconstructed fields match the imported fingerprint.                          | Allowed only after app projection and EPIC-05 encode/decode-back proof pass. |
| Warnings, incomplete state, unresolved facts, or non-exhaustive validation without errors | Not exact unless the imported fields are unchanged.                                            | Non-blocking if representation and codec proof pass; notices stay visible.   |
| Missing crosswalk/template representation or namespace conflict                           | Allowed only for unchanged exact replay.                                                       | Blocked with app projection diagnostics; never guess IDs.                    |
| Codec encode, decode, or field-complete proof failure                                     | Allowed only for unchanged exact replay.                                                       | Blocked; no partial or unproven code is shown.                               |

### Browser Query Semantics

The browser selector is pure and deterministic:

1. exclude unsupported and non-player catalog records from normal browser results while keeping
   imported instances representable in the editor;
2. normalize query whitespace/case and search skill names using catalog-provided normalized names or
   a documented app fallback;
3. default profession scope to current selected professions when present and to all otherwise;
4. default mode availability to `both + pve-only` for PvE, `both + pvp-only` for PvP, and all
   availability states for unknown mode, while preserving explicit user overrides;
5. apply attribute, skill type, elite/non-elite, and availability filters by stable IDs/values;
6. apply resource-kind filters for energy, adrenaline, sacrifice, upkeep, and overcast where the
   value state is explicitly present (`zero`, `number`, `percentage`, or `special`);
7. group by attribute by default, including an explicit no-attribute group, or sort by name/type;
8. break ties by normalized name and numeric catalog ID using deterministic code-point comparison;
9. report total and matching counts over the whole result set; and
10. render an initial bounded batch, expand with "Show more", and reset expansion on meaningful
    query/filter/sort/view/default-scope changes.

### Validation And Presentation Flow

Validation is derived, not independently stored. Selectors build `BuildValidationInput` from the
current `Build`, app catalog validation slices, and the same PvE budget controls used by the
attribute editor. PvP and unknown mode pass an explicit non-evaluated budget policy.

The global summary shows counts plus `valid`, `complete`, `resolved`, `exhaustive`,
`validatedAgainst`, and truncation state distinctly. Components route issues by structural
`ValidationLocation` and path, not by parsing message prose. App-level template projection and
unresolved-overlay diagnostics remain distinct in presentation but feed the same export policy
selector.

### Execution Topology

```text
BW-0801 app catalog boundary and attribution
  -> BW-0802 editor state, raw identity, selectors, fixtures, validation/export policy inputs
BW-0802
  -> BW-0803 profession, mode, and attribute editor
  -> BW-0804 skill browser search, filters, grouping, and views
BW-0803 + BW-0804
  -> BW-0805 eight-slot skill bar pointer and keyboard operations
BW-0803 + BW-0805
  -> BW-0806 shared skill display, structured values, and tooltips
BW-0802 + BW-0805 + EPIC-05
  -> BW-0807 template import/export dialogs
BW-0803 + BW-0804 + BW-0805 + BW-0806 + BW-0807
  -> BW-0808 validation presentation, responsive integration, docs, and closeout
```

`BW-0804` and `BW-0806` may overlap after the state contract is stable, but the default execution
order is `0801 -> 0802 -> 0803 -> 0804 -> 0805 -> 0806 -> 0807 -> 0808`.

## Implementation

### Execution Bookkeeping

- [x] Confirm `SPRINT-001` through `SPRINT-008` are completed in `work/sprints/ledger.tsv`.
- [x] Confirm `SPRINT-009` is planned and linked from EPIC-08 and BW-0801 through BW-0808 before
      implementation begins.
- [x] Move `EPIC-08` and active BW tickets to `in-progress` as execution starts, then to `done` only
      after their gates pass.
- [x] Keep `source_target: EPIC-08`, `source_epic: EPIC-08`, and
      `source_epic_path: work/tickets/08-core-build-editor/EPIC.md` consistent across sprint,
      ticket, epic, ledger, and run-manifest records.
- [x] Preserve unrelated worktree changes and do not commit unless separately requested.

### Phase 1: BW-0801 App Catalog Boundary, Attribution, And Privacy (~11% of effort)

**Files:**

- `src/app/catalogs.ts`
- `src/app/catalogs.test.ts`
- `src/app/catalog-boundary.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Add `src/app/catalogs.ts` with exactly the two approved static JSON imports:
      `data/generated/epic-03/professions-attributes.catalog.json` and
      `data/generated/epic-04/skills.catalog.json`.
- [x] Add bounded top-level boot assertions for profile IDs, schema/catalog version presence,
      required arrays, and minimum attribution facts; fail to a product-owned catalog error state if
      adaptation cannot proceed.
- [x] Expose app-ready profession, attribute, skill, catalog-version, attribution, validation-slice,
      placeholder-icon, and template-crosswalk views.
- [x] Render a persistent attribution notice before the catalog-driven workspace in DOM and visual
      order, with deliberate source links and safe new-context `rel` attributes where applicable.
- [x] Define stable placeholder icon descriptors for profession selectors, browser rows/tiles,
      skill-bar slots, and tooltips without exposing remote URLs to rendering props.
- [x] Add loading, empty-boundary, ready, and catalog-error presentation contracts without adding
      async catalog loading or network fetching.
- [x] Add architecture tests/source scans proving only `catalogs.ts` imports generated data and only
      the two exact catalog JSON paths are allowed in runtime app code.
- [x] Add rendered-markup or browser-level checks where practical to prove remote media URLs are not
      placed in image, CSS, preload, canvas, or fetch paths.

**Verification:**

- `npm run test:run -- src/app/catalogs.test.ts src/app/catalog-boundary.test.ts src/app/App.test.tsx`
- `npm run typecheck`
- `rg -n 'data/generated/' src/app`
- `rg -n '(data/qa|data/source-snapshots|scripts/data|api\\.php|wiki\\.guildwars)' src/app`

**Phase Gate:** Catalog facts cannot render without visible attribution, only the approved app
boundary imports generated runtime JSON, and no browser path automatically requests remote icons.

### Phase 2: BW-0802 Editor State, Raw Identity, Selectors, And Fixtures (~15% of effort)

**Files:**

- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/editor-fixtures.ts`

**Tasks:**

- [x] Define `EditorState` as sub-states for semantic `Build`, PvE budget controls, raw template
      overlay/source, browser filters/view/batch, dialogs, tooltip/selection, pointer drag, keyboard
      placement, and transient status messages.
- [x] Add blank-state construction, immutable reducer/actions, exactly eight slot invariants, and
      typed no-op behavior for stale or invalid operations.
- [x] Implement deterministic helpers for profession, mode, level/quest, attribute rank, browser
      controls, tooltip state, dialog state, skill place/replace/move/swap/clear, and cancel/reset.
- [x] Preserve null professions, unknown mode, empty skill slots, partial attributes, duplicate or
      inaccessible rows, stale IDs, and unresolved raw template facts until targeted replace/clear.
- [x] Move or swap semantic skill slots and raw overlay entries atomically.
- [x] Add selector-built validation input, app-level unresolved/projection diagnostics, inline issue
      routing inputs, and export-policy inputs before UI phases depend on them.
- [x] Add early `template-workflow.ts` projection/fingerprint helpers and the export decision table
      as pure tests, even before dialogs are polished.
- [x] Add playable, incomplete, and imported-unresolved fixtures based on real
      `resolveSkillTemplateDocument` outcome shapes where practical.
- [x] Test no-mutation behavior, edit/revert exact eligibility, UI-only actions, wrapper-name
      changes, import failure atomicity, sequential imports, mixed resolved/unresolved overlays,
      fresh canonical projection success/failure, and validation/export policy combinations.

**Verification:**

- `npm run test:run -- src/app/editor-state.test.ts src/app/editor-selectors.test.ts src/app/template-workflow.test.ts`
- `npm run typecheck`
- `npm run build`

**Phase Gate:** Later UI work has one tested state and policy contract, exact replay is
fingerprint-derived, import is transactional, and export gating considers validation plus app
projection diagnostics without namespace guessing.

### Phase 3: BW-0803 Profession, Mode, And Attribute Editor (~12% of effort)

**Files:**

- `src/app/components/ProfessionModeEditor.tsx` or equivalent
- `src/app/components/AttributeEditor.tsx` or equivalent
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/styles.css`

**Tasks:**

- [x] Add primary and secondary profession controls backed by app catalog views, including `None`
      semantics distinct from unresolved/unsupported imports.
- [x] Add explicit PvE, PvP, and unknown mode controls wired to editor state.
- [x] Derive visible normal attribute rows from selected professions while retaining authored rows
      that are duplicated, inaccessible, stale, or unresolved.
- [x] Use catalog purchased-rank rows for allowed rank choices, cumulative spend, and per-row cost;
      do not copy rank caps or cost tables into components.
- [x] Add catalog-supported level control and aggregate `none | maximum-applicable` quest-bonus
      control only for the bounded EPIC-08 budget model. Default PvE to level 20 plus maximum
      applicable quest bonus.
- [x] Pass the same budget inputs to remaining-point display and `validateBuild`.
- [x] Show PvP/unknown remaining points as not evaluated rather than reusing PvE defaults.
- [x] Add accessible labels, groups, focus-visible states, and reserved inline issue containers.
- [x] Test normal pairs, null/duplicate pairs, mode switches, PvE/PvP/unknown budgets, rank zero and
      nonzero rows, overspend, primary-only rows, retained inaccessible imports, and
      non-destructive profession changes.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/editor-selectors.test.ts`
- `npm run typecheck`

**Phase Gate:** A user can configure professions, mode, and level-20 PvE attribute allocations, and
displayed budget facts cannot drift from validation inputs.

### Phase 4: BW-0804 Skill Browser Search, Filters, Grouping, And Views (~14% of effort)

**Files:**

- `src/app/components/SkillBrowser.tsx` or equivalent
- `src/app/components/SkillDisplay.tsx` or equivalent shared shell
- `src/app/skill-browser.test.tsx`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/App.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Implement the pure browser query pipeline from the Architecture section with deterministic
      filtering, grouping, sorting, counts, and batch expansion.
- [x] Add name search; profession, attribute, skill type, elite, and availability filters; and
      energy, adrenaline, sacrifice, upkeep, and overcast resource-kind filters using explicit
      value-state semantics.
- [x] Add group-by-attribute, sort-by-name, and sort-by-type modes with stable IDs and explicit
      no-attribute grouping.
- [x] Add list, small-grid, and large-grid views over one `SkillDisplayView` contract with stable
      placeholder boxes and consistent add/place actions.
- [x] Render empty catalog, no-result, loading, and error states. No-result preserves filters and
      offers a clear-filters action.
- [x] Avoid eager mounting of every matching rich row/tooltip. Render bounded batches and create
      tooltip panels on demand.
- [x] Preserve explicit browser filter overrides across unrelated UI actions; reset batch size only
      when meaningful query/filter/sort/view/default-scope inputs change.
- [x] Test individual and combined filters, special/zero/absent/malformed resource facts, duplicate
      names, missing normalized names, mode defaults and overrides, stable ordering, batch reset and
      expansion, no-result recovery, and promoted-catalog smoke behavior.

**Verification:**

- `npm run test:run -- src/app/skill-browser.test.tsx src/app/editor-selectors.test.ts`
- `npm run typecheck`
- `npm run build`

**Phase Gate:** The full promoted skill catalog is discoverable through deterministic views without
mounting every matching result or introducing new data/search dependencies.

### Phase 5: BW-0805 Eight-Slot Pointer And Keyboard Skill Bar (~13% of effort)

**Files:**

- `src/app/components/SkillBar.tsx` or equivalent
- `src/app/skill-bar.test.tsx`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/App.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Render exactly eight stable slots from `SKILL_BAR_SLOT_COUNT` with empty, known, unresolved,
      invalid, selected, hover, focus, drag-source, and drop-target states.
- [x] Wire browser-to-slot placement/replacement, slot-to-empty move, filled-slot swap, remove-target
      clear, and explicit clear actions to shared reducer operations.
- [x] Treat `DataTransfer` as an opaque internal token only; validate operation kind and indices
      against current state before dispatch and ignore foreign or stale drags safely.
- [x] Implement keyboard pick/place/cancel, direct clear actions, predictable slot focus, visible
      instructions, and polite live announcements.
- [x] Keep resolved, unresolved, dispositioned, and empty slot overlays synchronized through move,
      swap, replace, clear, cancel, and invalid no-op paths.
- [x] Keep non-drag actions fully usable on narrow screens.
- [x] Test replacement policy, mixed resolved/unresolved swaps, edit/revert slot sequences,
      reorder-back exact eligibility, invalid payloads, drop outside target, cancel/no-op paths,
      focus movement, announcements, and exact slot/overlay outcomes.

**Verification:**

- `npm run test:run -- src/app/skill-bar.test.tsx src/app/editor-state.test.ts`
- `npm run typecheck`
- Manual pointer and keyboard walkthrough for place, replace, move, swap, clear, cancel, and focus
  return/advance

**Phase Gate:** Pointer and keyboard users can construct and rearrange the same eight-slot bar, and
no slot operation corrupts empty positions or unresolved imported raw IDs.

### Phase 6: BW-0806 Shared Skill Display, Structured Values, And Tooltips (~11% of effort)

**Files:**

- `src/app/components/SkillDisplay.tsx` or equivalent
- `src/app/components/SkillTooltip.tsx` or equivalent
- `src/app/skill-display.test.tsx`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/App.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Complete `SkillDisplayView` for name, type, profession, attribute, elite state, availability,
      costs, timings, placeholder icon, and supported/unresolved labels.
- [x] Build tooltip context from selected mode and `calculateEffectiveAttributeRank` for attribute
      dependencies, with no equipment, rune, weapon, title, temporary, or manual adjustments.
- [x] Call `renderSkillTooltipText` for approved token projection.
- [x] Render structured progression series separately using exact value-slot labels and rank rows,
      without synthesizing source-authored prose.
- [x] Use `rankDomain.max` for title-rank dependencies and visibly label it as a maximum-title-rank
      assumption. Do not infer title ownership, rank configuration, or allegiance.
- [x] Present unknown skill, unknown mode variant, missing rank/value, unsupported description,
      unsupported progression, malformed facts, and catalog gaps as stable explanatory states.
- [x] Support hover, focus, and explicit open/pin paths where needed. Tooltips must not trap focus
      and must remain usable in dialogs and narrow viewports.
- [x] Test attribute-rank updates, known unallocated rank zero, title maximum assumption, current
      structured-only records, future progression-reference tokens, special cost/timing states, and
      every unresolved outcome.

**Verification:**

- `npm run test:run -- src/app/skill-display.test.tsx src/app/editor-selectors.test.ts`
- `npm run typecheck`

**Phase Gate:** Browser rows/tiles and bar slots share consistent facts, authored attribute changes
update structured tooltip values, title values are explicitly assumed, and gaps never crash or
produce invented copy.

### Phase 7: BW-0807 Template Import And Export Dialogs (~13% of effort)

**Files:**

- `src/app/components/TemplateDialogs.tsx` or equivalent
- `src/app/template-dialogs.test.tsx`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/editor-state.ts`
- `src/app/editor-selectors.ts`
- `src/app/App.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Add accessible import and export dialogs sharing a tested modal primitive with initial focus,
      Tab containment, Escape close, trigger-focus restoration, internal scrolling, and bounded
      viewport height.
- [x] Decode bare codes and `[name;code]` wrappers only through `decodeSkillTemplate`, then resolve
      with `resolveSkillTemplateDocument` and app catalog boundary data.
- [x] Preserve source envelope, original bare code, normalized dependency evidence, ordered
      attribute/rank pairs, eight raw skill IDs, and wrapper name null/empty/non-empty semantics.
- [x] Atomically replace state on successful import, set mode to unknown, and leave prior state
      unchanged on parse/decode/resolve failure or cancel.
- [x] Convert known outcomes through explicit crosswalk/template-ID facts; keep none, empty,
      reserved, unsupported, dispositioned, and unknown outcomes distinct in placeholders and
      diagnostics.
- [x] Implement editor-to-template projection with typed failures for missing mappings,
      wrong-namespace unresolved facts, invalid field values, or unrepresentable app state.
- [x] Surface exact-source and canonical options with fidelity labels, validation notices,
      projection errors, codec errors, and selectable output.
- [x] Add explicit best-effort copy behavior. No automatic clipboard reads; denial or unsupported
      APIs leave selectable text and a visible message.
- [x] Test bare/wrapped success, wrapper rename/clear/restore, empty/oversized/unsafe/malformed/
      wrong-kind input, unresolved/dispositioned IDs, repeated imports, failed second import,
      unchanged exact replay, semantic edit/revert, canonical success, projection failure,
      validation error gate, codec/fidelity failure, long content, dialog focus, Escape, overflow,
      and repeated export attempts in one dialog session.

**Verification:**

- `npm run test:run -- src/app/template-workflow.test.ts src/app/template-dialogs.test.tsx`
- `npm run test:run -- test/template-compatibility/skill-template.test.ts test/template-compatibility/catalog-resolution.test.ts`
- `npm run typecheck`

**Phase Gate:** Supported skill templates import without raw-ID loss, unchanged sources replay
exactly, and no edited canonical code is shown unless representation, validation policy, encode, and
decode-back fidelity gates all pass.

### Phase 8: BW-0808 Validation Presentation, Responsive Integration, Docs, And Closeout (~12% of effort)

**Files:**

- `src/app/components/ValidationPanel.tsx` or equivalent
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`
- `src/app/*.test.ts(x)`
- `compendium/core-build-editor.md`
- `compendium/README.md`
- `README.md`
- `work/tickets/08-core-build-editor/*.md`
- `work/tickets/08-core-build-editor/EPIC.md`
- `work/sprints/SPRINT-009.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/EPIC-08/20260902T154644Z/execute-SPRINT-009-result.json`

**Tasks:**

- [x] Add the global validation summary with counts plus separate `valid`, `complete`, `resolved`,
      and `exhaustive` states, catalog versions, and truncation.
- [x] Route structural locations to profession controls, authored attribute rows, and skill slots;
      retain catalog/options/unlocated issues globally and template workflow errors in dialogs.
- [x] Verify warnings, incomplete state, unresolved imports, and non-exhaustive results never
      disable ordinary editing and follow the Phase 2/7 export policy exactly.
- [x] Compose the full desktop workspace in `App.tsx` with attribution-first ordering, prominent
      skill bar and validation summary, and bounded browser/dialog/tooltip surfaces.
- [x] Finish narrow-screen stacking/wrapping/scroll behavior, stable placeholder dimensions,
      focus-visible states, live announcements, loading/empty/error/no-result states, tooltip
      overflow behavior, and modal overflow.
- [x] Add integrated app tests for blank-to-playable authoring, incomplete state, unresolved import,
      pointer placement, keyboard placement, rank-sensitive tooltip values, exact replay, canonical
      success, canonical block, no-result recovery, and catalog error/empty states.
- [x] Measure and record production JS/CSS asset sizes from `npm run build`; if static catalog cost
      is unacceptable, create a bounded follow-up instead of redesigning runtime data in this
      sprint.
- [x] Add `compendium/core-build-editor.md` documenting catalog ownership, editor/raw-ID state,
      filters, budget assumptions, interaction model, tooltip limitations, export policy,
      performance observation, and deferred scope. Link it from `compendium/README.md`.
- [x] Update root `README.md` current/deferred scope to match the shipped core editor behavior.
- [x] Run source-policy and baseline-aware protected-path diff review. Pre-existing unrelated
      worktree changes may be documented, but sprint completion requires no unapproved changes to
      protected paths.
- [x] During execution, mark BW-0801 through BW-0808, EPIC-08, SPRINT-009, and the ledger complete
      only after every phase gate and Definition of Done item passes.
- [x] Write the ticket-burn execution result manifest and do not commit.

**Verification:**

- `npm run test:run -- src/app`
- `npm run format:check`
- `npm run build`
- `npm run verify`
- `rg -n 'data/generated/' src/app`
- `rg -n '(data/qa|data/source-snapshots|scripts/data|api\\.php|wiki\\.guildwars)' src/app`
- Baseline-aware protected-path diff review for `src/domain`, `src/template-compatibility`,
  `data/generated`, `data/qa`, `data/source-snapshots`, `scripts/data`, `prior-art`,
  dependency files, and build configuration
- Manual desktop and narrow-screen pointer/keyboard/dialog/tooltip walkthrough

**Phase Gate:** The full single-character workflow is usable, policy and source boundaries are
documented and tested, `npm run verify` passes, planning/execution records agree, and no later-epic
or protected file changed without an explicit checkpoint.

## Files Summary

| File                                                                            | Action                            | Purpose                                                                                                                                         |
| ------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/catalogs.ts`                                                           | Create                            | Sole approved generated-catalog import boundary, app catalog facade, attribution, validation slices, placeholder policy, and crosswalk helpers. |
| `src/app/editor-state.ts`                                                       | Create                            | In-memory semantic build, raw template overlay, reducer/actions, eight-slot invariants, and transient operation state.                          |
| `src/app/editor-selectors.ts`                                                   | Create                            | Attribute/budget, browser, validation, issue-routing, skill-display, tooltip, and export-policy projections.                                    |
| `src/app/template-workflow.ts`                                                  | Create                            | Import resolution, editor/template translation, exact replay, canonical export decisions, and workflow diagnostics.                             |
| `src/app/editor-fixtures.ts`                                                    | Create                            | Playable, incomplete, and unresolved-import app fixtures for tests.                                                                             |
| `src/app/components/**` or equivalent `src/app/*.tsx` files                     | Create                            | Attribution, character controls, browser, skill bar, display/tooltip, dialogs, modal, validation, and workspace components.                     |
| `src/app/App.tsx`                                                               | Modify                            | Compose catalog state, reducer, selectors, workflows, live regions, and editor workspace.                                                       |
| `src/app/styles.css`                                                            | Modify                            | Original desktop-first and narrow-screen editor layout, stable placeholders, focus, validation, tooltip, modal, and overflow states.            |
| `src/app/App.test.tsx`                                                          | Modify                            | Expand shell tests into integrated editor workflow and state coverage.                                                                          |
| `src/app/*.test.ts(x)`                                                          | Create/modify                     | Focused app tests for catalog boundary, state, selectors, browser, bar, display, tooltips, workflow, dialogs, validation, and import scans.     |
| `compendium/core-build-editor.md`                                               | Create during execution           | Durable implementation note for future EPIC-09/15/equipment/party/guide work.                                                                   |
| `compendium/README.md`                                                          | Modify during execution           | Link the core editor note.                                                                                                                      |
| `README.md`                                                                     | Modify during execution           | Update current/deferred scope after EPIC-08 ships.                                                                                              |
| `data/generated/epic-03/professions-attributes.catalog.json`                    | Read only                         | Approved runtime profession, attribute, budget, provenance, and metadata input.                                                                 |
| `data/generated/epic-04/skills.catalog.json`                                    | Read only                         | Approved runtime skill, cost/timing, structured description/progression, split, and disposition input.                                          |
| `src/domain/**`                                                                 | Read only by default              | Existing build, catalog, validation, effective-rank, and tooltip contracts/helpers.                                                             |
| `src/template-compatibility/**`                                                 | Read only by default              | Existing decode, resolve, exact-source, canonical encode, and fidelity APIs.                                                                    |
| `work/tickets/08-core-build-editor/*.md`                                        | Modify planning/execution records | Link planned sprint now; record status/completion evidence during execution.                                                                    |
| `work/tickets/08-core-build-editor/EPIC.md`                                     | Modify planning/execution records | Link planned sprint now; mark complete only after all EPIC-08 criteria pass.                                                                    |
| `work/sprints/SPRINT-009.md`                                                    | Create/modify                     | Executable sprint plan and later execution checklist/closeout state.                                                                            |
| `work/sprints/ledger.tsv`                                                       | Modify                            | Sprint lifecycle tracking.                                                                                                                      |
| `work/sprints/drafts/SPRINT-009-*.md`                                           | Create                            | Planning intent, model drafts, critiques, and merge notes.                                                                                      |
| `work/runs/ticket-burn/EPIC-08/20260902T154644Z/plan-EPIC-08-result.json`       | Create during planning            | Required ticket-burn planning result manifest.                                                                                                  |
| `work/runs/ticket-burn/EPIC-08/20260902T154644Z/execute-SPRINT-009-result.json` | Create during execution           | Required ticket-burn execution result manifest.                                                                                                 |

No generated manifest, QA report, source plan, snapshot, ingestion module, icon binary, screenshot,
package dependency, storage schema, service worker, route/deployment file, equipment/title/party
model, or copied source-prose artifact is added in this sprint.

## Definition of Done

### Catalog Boundary, Attribution, And Privacy

- [x] `src/app/catalogs.ts` is the only runtime app module importing generated data, and it imports
      exactly the two promoted catalog JSON files.
- [x] No runtime app path imports generated manifests, QA reports, source plans, snapshots,
      ingestion/Python tooling, wiki APIs, candidate outputs, or remote media bytes.
- [x] Incompatible top-level catalog identity fails to a product-owned error state before
      catalog-derived facts render.
- [x] Guild Wars Wiki attribution and both catalog versions precede all catalog-derived names and
      facts in DOM and visual order.
- [x] Profession and skill placeholder slots have stable list/grid/bar/tooltip dimensions and useful
      accessible labels where needed.
- [x] Remote icon URLs are not assigned to images, CSS URLs, preload hints, canvas, fetch calls, or
      placeholder render props.

### Editor State And Character Controls

- [x] Editor state uses one semantic `Build` plus a field-addressed raw template overlay; template
      and catalog IDs are never mapped by numeric equality.
- [x] Blank, incomplete, playable, and imported-unresolved states are deterministic,
      immutable-update safe, and fixture-covered.
- [x] Null professions, unknown mode, empty slots, partial attributes, inaccessible imported rows,
      stale IDs, and unresolved raw IDs remain representable until targeted replace/clear actions.
- [x] Import is transactional and failed/cancelled imports preserve the previous editor document.
- [x] Exact-source eligibility is fingerprint-derived, unaffected by UI-only changes, and restored
      by full semantic reversion.
- [x] Profession and mode changes do not silently remove attributes or skills.
- [x] A user can select primary/secondary professions and PvE/PvP/unknown mode with pointer and
      keyboard input.
- [x] Attribute rows and rank choices derive from app catalog views; point totals use EPIC-03 rules
      and the same budget inputs as validation.
- [x] PvP and unknown mode do not inherit the PvE point budget.

### Browser, Skill Bar, And Tooltips

- [x] Name, profession, attribute, type, elite, availability, and five resource-kind filters have
      documented deterministic semantics and combined/no-result tests.
- [x] Group-by-attribute, name sort, type sort, list, small-grid, and large-grid modes use one result
      contract with stable ordering and placeholder layout.
- [x] Browser defaults follow current professions/build mode, explicit overrides remain stable, and
      matching counts cover the whole result set while rendering remains batched.
- [x] Pointer users can place, replace, move, swap, reorder, and clear all eight slots.
- [x] Keyboard users can perform equivalent pick, place, replace, move, swap, clear, and cancel
      operations with focus feedback and live announcements.
- [x] Empty, unresolved, invalid, selected, hover, focus, drag-source, and drop-target slot states do
      not change slot geometry or corrupt raw overlays.
- [x] Rows, tiles, slots, and tooltips share consistent catalog facts, placeholder policy, and
      unresolved-state labels.
- [x] Approved tooltip text uses `renderSkillTooltipText`; structured values update from authored
      effective attribute ranks without reconstructing unreviewed source descriptions.
- [x] Title-scaled values visibly use `rankDomain.max` as a maximum-title-rank assumption; no title
      ownership or allegiance state is inferred.
- [x] Unknown, missing, unsupported, malformed, mode-ambiguous, and catalog-gap states remain
      readable and non-crashing.
- [x] Tooltips work through focus/explicit controls as well as hover and remain usable at narrow
      widths.

### Template Fidelity And Export Policy

- [x] Bare codes and exact `[name;code]` wrappers import only through EPIC-05 APIs; typed empty,
      oversized, unsafe, malformed, wrong-kind, dependency, and fidelity failures render safely.
- [x] Successful imports preserve source envelope, original bare code, normalized dependency
      evidence, raw professions, ordered attributes, eight raw skill slots, and wrapper name
      null/empty/non-empty state.
- [x] Known template outcomes map only through explicit crosswalk/template-ID facts; none/empty
      sentinels and reserved/unsupported/dispositioned/unknown outcomes remain distinct.
- [x] Imported mode is unknown until the user selects a mode.
- [x] Every row in the export decision matrix has a policy-selector test and a user-visible disabled
      or notice reason.
- [x] Unchanged imports can exact-replay even with validation errors, warnings, incomplete state,
      unresolved facts, or non-exhaustive validation.
- [x] Canonical export blocks on `valid === false`, app projection failure, or any typed
      codec/fidelity failure and never returns a partial or unproven code.
- [x] Warnings, incomplete state, unresolved facts, and non-exhaustive validation remain visible but
      do not alone block a representable canonical encode.
- [x] Long names/codes wrap or scroll inside bounded dialogs; modal focus enters, stays contained,
      closes with Escape, and returns to its trigger.
- [x] Clipboard reads are never automatic; copy happens only on explicit action and has selectable
      fallback text.

### Validation, Accessibility, Responsive Behavior, And Closeout

- [x] The global summary separately presents counts, `valid`, `complete`, `resolved`, `exhaustive`,
      catalog versions, and truncation.
- [x] Profession, authored attribute-row, and skill-slot issues appear at structural locations;
      catalog/options/unlocated issues remain globally discoverable.
- [x] Components route by `ValidationLocation`, path, and severity rather than parsing message
      prose.
- [x] Warnings and unresolved imports never block ordinary editing or hide retained values.
- [x] The main desktop workflow and narrow-screen layout are operable without screenshot-derived
      hard-coded dimensions or hover-only actions.
- [x] Interactive controls have programmatic names, visible focus, appropriate group/dialog/status
      semantics, and predictable focus after placement and modal actions.
- [x] Loading, empty, error, no-result, invalid, overflow, and narrow-screen states are covered by
      focused tests or an explicit manual walkthrough where JSDOM cannot prove layout behavior.
- [x] End-to-end app tests cover blank-to-playable authoring, incomplete state, unresolved import,
      pointer placement, keyboard placement, dynamic structured values, exact replay, canonical
      success, canonical block, and filter recovery.
- [x] Production build asset sizes are measured and documented; any unacceptable static catalog cost
      gets a bounded follow-up rather than an unplanned runtime-data redesign.
- [x] `compendium/core-build-editor.md`, `compendium/README.md`, and `README.md` accurately reflect
      shipped behavior and EPIC-09/15/equipment/party/guide deferrals.
- [x] `npm run verify` passes. If it fails and cannot be fixed within the sprint, the sprint is
      blocked or failed with exact evidence, not marked complete.
- [x] Baseline-aware protected-path review confirms no unapproved changes to domain,
      template-compatibility, generated/QA/snapshot/data-tool, prior-art, dependency, or
      build-configuration files.
- [x] BW-0801 through BW-0808, EPIC-08, SPRINT-009, the ledger, and ticket-burn manifests agree
      before completion; no commit is created by the run.

## Risks & Mitigations

| Risk                                                                                                       | Likelihood | Impact   | Mitigation                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App code assumes catalog IDs equal template IDs because current values often align                         | High       | Critical | Require explicit `templateId`/crosswalk mapping, retain raw overlays, add mismatched-ID fixtures, and fail canonical projection when no mapping exists.                                     |
| Dual `Build` plus raw-overlay state drifts after reorder, replace, profession changes, or repeated imports | Medium     | High     | Define field-addressed overlay invariants, atomic reducer operations, transactional imports, edit/revert tests, and export policy over combined diagnostics.                                |
| Static skills JSON causes large bundles, slow startup, or expensive filtering                              | High       | High     | Keep the mandated boundary, build indexes once, render bounded batches, avoid eager tooltips, measure production assets, and create a later compact/chunked data ticket only from evidence. |
| Validation is backfilled too late and export policy forks from validation presentation                     | Medium     | High     | Build validation/export policy selectors in Phase 2, then render/polish them in later UI phases.                                                                                            |
| Direct generated-data imports spread into leaf components                                                  | Medium     | High     | Create `catalogs.ts` first, add architecture scans/tests, and keep the import boundary in phase gates and DoD.                                                                              |
| Remote media metadata becomes browser network traffic                                                      | Medium     | Critical | Do not expose URL fields to icon render props, test rendered markup, manually inspect network behavior, and keep placeholder icons for EPIC-08.                                             |
| Exact-source replay is implemented as a dirty bit                                                          | Medium     | High     | Derive exact eligibility from reconstructed template fields/fingerprint and test UI-only changes, semantic edits, edit/revert, wrapper changes, and slot reorder-back.                      |
| Browser filters hide unusual cost facts unpredictably                                                      | Medium     | Medium   | Define value-state semantics for zero/number/percentage/special/absent/not-applicable/malformed states and test them.                                                                       |
| Pointer drag/drop becomes inaccessible or corrupts state through stale payloads                            | Medium     | High     | Use reducer-backed operations, opaque tokens, current-state validation, keyboard pick/place, live announcements, focus tests, and manual walkthroughs.                                      |
| Current structured-only descriptions do not satisfy in-game prose expectations                             | High       | Medium   | Render approved token text and structured progression facts only; document limitation and defer copied-description review to a later explicit ticket.                                       |
| Title max-rank display is mistaken for ownership or allegiance state                                       | Medium     | High     | Use declared `rankDomain.max`, label the assumption, and leave title eligibility to EPIC-15.                                                                                                |
| Scope creeps into EPIC-09 or later systems                                                                 | Medium     | High     | Keep state in memory, protect files, record deferrals, and require an architecture checkpoint for storage, equipment, title, party, guide, media, or dependency additions.                  |
| JSDOM tests miss layout, focus, tooltip, or drag/drop behavior                                             | Medium     | Medium   | Pair focused tests with browser/manual walkthroughs for pointer, keyboard, modal, tooltip, narrow-screen, and remote-media checks.                                                          |
| Final verification fails for an unrelated reason                                                           | Low        | Medium   | Run focused tests throughout; if final `npm run verify` cannot pass, record the exact failure and leave the sprint blocked/failed rather than complete.                                     |

## Security Considerations

- Treat template input, template names, decoded values, catalog strings, drag payloads, validation
  messages, and clipboard failures as untrusted plain text.
- Render through React text escaping. Do not use `dangerouslySetInnerHTML`, Markdown/HTML parsing, or
  executable URLs for catalog/template content.
- Preserve EPIC-05 input and field bounds. Do not add a second parser with weaker limits.
- Show typed compatibility errors only. Do not expose vendor objects, exception stacks, dependency
  internals, filesystem paths, or raw thrown messages.
- Do not automatically read clipboard contents. Copy only after explicit user action and provide a
  manual selectable fallback on denial/unavailability.
- Use a private internal drag operation token. Do not parse arbitrary dropped HTML, URLs, files,
  JSON, or cross-origin data.
- Do not place remote media URLs in image attributes, CSS, preload hints, canvas, fetch calls,
  service workers, or test snapshots.
- External attribution links navigate only after explicit activation and use safe relationship
  attributes when opening new contexts.
- Keep all editor state in memory. Do not write template codes, names, skill selections, search
  text, or validation results to local/session storage, IndexedDB, URLs, analytics, logs, or remote
  services.

## Dependencies

- `SPRINT-001` / EPIC-00: React/Vite/TypeScript shell, strict tooling, accessible baseline,
  repository boundaries, and `npm run verify`.
- `SPRINT-002` / EPIC-01: source vocabulary, attribution requirements, media restrictions, and
  development-reference-only screenshot policy.
- `SPRINT-004` / EPIC-03: promoted professions/attributes catalog, template crosswalks, purchased
  rank costs, level totals, quest-bonus policy, and metadata-only profession icons.
- `SPRINT-005` / EPIC-04: promoted skills catalog, classifications, costs/timings, structured
  descriptions/progressions, dispositions, mode facts, split groups, and metadata-only skill icons.
- `SPRINT-006` / EPIC-05: skill template parse/decode/export, chat-wrapper handling, exact-source
  replay, canonical encode/decode-back proof, typed errors, and paw-ned2/team deferral.
- `SPRINT-007` / EPIC-06: `validateBuild`, `calculateEffectiveAttributeRank`, validation locations,
  separate result states, unresolved-ID semantics, and PvE budget defaults.
- `SPRINT-008` / EPIC-07: `compendium/visual-prior-art.md` hierarchy/density references and
  explicit UI gaps for focus, responsive layout, loading/error, search/filter, validation, and
  dialog overflow.
- Existing React 19, Testing Library, Vitest, JSDOM, Vite, TypeScript, ESLint, and Prettier are
  sufficient. No new runtime, state, drag/drop, modal, search, virtualization, schema-validation,
  icon, storage, or clipboard package is planned.
- Immediate downstream owner: EPIC-09 must preserve or deliberately migrate the semantic build plus
  raw template overlay/source contract when adding local persistence.
- Deferred semantic owners: EPIC-13/14 for equipment-derived display/ranks, EPIC-15 for titles and
  allegiance, EPIC-17 for party/hero/team templates, EPIC-18/19 for community/guide workflows, and a
  future evidence-backed data/performance ticket for compact or chunked runtime catalogs.

## Alternatives Considered

- **Expand `Build` to model raw template identity directly**: Deferred. EPIC-08 can preserve raw
  imports in app state; EPIC-09 should revisit serialization when persistence exists.
- **Use one large reducer for every app concern**: Allowed only with clear sub-state boundaries and
  pure helpers. The sprint prefers one `EditorState` with separated semantic, import, browser,
  dialog, tooltip, and interaction sub-states.
- **Vertical slice before catalog/state boundaries**: Rejected. Source policy, raw-ID fidelity, and
  export policy are high-risk enough that boundary-first sequencing is safer.
- **Dynamic import, worker indexing, compact runtime artifact, or virtualization**: Deferred. Static
  import is the EPIC-08 constraint; this sprint measures and bounds rendering before creating data
  or dependency work.
- **Fuzzy search or recommendations**: Deferred to later search/discovery work. Exact deterministic
  filtering is enough for EPIC-08.
- **Drag/drop or modal/tooltip dependency**: Not planned. Native interactions plus explicit keyboard
  controls are the default; a dependency requires a recorded architecture checkpoint.
- **Pixel-perfect prior-art clone**: Rejected. `compendium/visual-prior-art.md` informs hierarchy and
  density, but screenshots are not runtime assets or layout specifications.
- **Persistent template library or share URLs**: Deferred to EPIC-09. This sprint exposes only
  in-memory import/export dialogs.

## Open Questions

No open question blocks execution. The sprint adopts the binding decisions above and records these
planning assumptions:

1. Existing domain and template-compatibility public APIs are sufficient for EPIC-08 app work unless
   execution proves a blocking gap and records an architecture checkpoint.
2. A single implementation sprint can cover BW-0801 through BW-0808 because the groomed tickets
   sequence the shared app boundary/state work before UI breadth and closeout.
3. Planning updates may touch sprint, draft, ticket, ledger, run-state, and result-manifest records,
   but not application implementation code.
4. Final approval is auto-granted because the sprint is internally consistent, executable, and
   bounded by clear phase gates.
