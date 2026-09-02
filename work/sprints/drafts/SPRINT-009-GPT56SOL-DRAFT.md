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

This sprint delivers the first useful Build Wars editing loop: a user can author one in-memory
character build, choose professions and mode, allocate attributes, find and arrange eight skills,
inspect catalog-backed skill facts, import a skill template, see validation feedback, and export an
exact or proven canonical template code.

The implementation is a coordinated app layer over existing contracts. `src/domain` remains the
authority for build shapes, catalog lookups, purchased-rank costs, validation, effective attribute
ranks, and tooltip text projection. `src/template-compatibility` remains the only skill-template
codec boundary. A new `src/app/catalogs.ts` is the only runtime module that imports the two promoted
catalog JSON files. App state and workflow adapters translate those framework-neutral results into
React component props without changing domain or codec semantics.

The sprint is intentionally local and ephemeral. Refresh may discard the build. There is no local
library, storage schema, migration, tag, favorite, share URL, equipment editor, title ownership,
party model, guide model, analytics, authentication, or deployment work. Those boundaries are
important because template fidelity and unresolved-ID preservation must be correct before EPIC-09
adds persistence.

Five product decisions are fixed for execution:

1. Imported raw template identity is preserved in an app-side overlay alongside the semantic
   `Build`; it is never inferred from equal numeric catalog/template IDs.
2. Exact-source eligibility is derived by reconstructing the current template fields and comparing
   their semantic fingerprint, not by a one-way dirty flag. UI-only changes and edit-then-revert
   flows therefore do not unnecessarily destroy exact replay.
3. Catalog attribution appears before catalog-derived names or facts, and remote icon metadata is
   never converted to an image request. All icon-bearing surfaces use shared stable placeholders.
4. The skill browser filters the checked-in catalog synchronously but progressively renders bounded
   result batches. This controls DOM cost without introducing async catalog loading, a search
   backend, or a new dependency.
5. Exact-source export remains available for an unchanged import even when validation is incomplete
   or unresolved. Canonical export blocks only on proven validation errors, inability to represent
   current fields as a skill template, or the codec's typed encode/fidelity failure. Other result
   states remain visible warnings.

The promoted skills artifact is approximately 15 MB before bundling and contains 2,951 skill
records. Synchronous static import is an explicit EPIC-08 constraint, so this sprint measures the
production bundle and limits rendered results but does not invent catalog chunking. A later data or
performance ticket should own a compatible compact/runtime-index format if measured startup or
bundle cost is unacceptable.

The current promoted descriptions are structured-only and do not embed progression-reference
tokens, although progression series are present. Tooltips therefore render the approved
`renderSkillTooltipText` projection and a separate labeled structured-progression section at the
authored effective rank. They do not reconstruct or imitate unapproved source-authored prose.

## Use Cases

1. **Start a build from scratch**: A user opens the app, sees source attribution, selects PvE, PvP,
   or unknown mode and a profession pair, and can keep working through incomplete states.
2. **Allocate attributes**: A PvE user chooses a supported level and either no quest bonus or the
   catalog's maximum-applicable quest bonus, edits purchased ranks, and sees spent and remaining
   points calculated from catalog rules.
3. **Preserve imperfect imported state**: A template with unknown, reserved, unsupported, or
   dispositioned profession, attribute, or skill IDs displays stable placeholders and warnings
   without deleting or guessing those IDs.
4. **Find skills predictably**: A user searches names; filters by profession, attribute, type,
   elite status, mode availability, or supported resource-cost kinds; and switches among list,
   small-grid, and large-grid views.
5. **Build a bar with pointer input**: A user drags a browser result to a slot, drags filled slots to
   move or swap them, replaces a slot, and drags a slot to a visible remove target.
6. **Build a bar with keyboard input**: A user picks up a browser skill or filled slot, chooses a
   target slot, places or swaps it, clears a slot, cancels the operation, and hears concise live
   announcements without relying on pointer drag events.
7. **Inspect skill facts**: A user opens the same skill display from a list row, grid tile, or bar
   slot and sees name, classification, profession, attribute, mode, cost/timing facts, approved text,
   and rank-sensitive structured values.
8. **Import a template**: A user enters a bare code or `[name;code]` wrapper, sees typed failures in
   the dialog, and on success receives the decoded professions, ordered attributes, eight slots,
   preserved wrapper state, and unresolved placeholders.
9. **Re-export without loss**: An unchanged imported template returns its original bare code exactly,
   including after UI-only changes or a semantic edit that is fully reverted.
10. **Export an edited build**: A user receives a canonical code only after current editor fields can
    be projected to raw template IDs, validation has no proven errors, and encode/decode-back
    equality succeeds.
11. **Understand validation**: A user sees error/warning counts and the independent `valid`,
    `complete`, `resolved`, and `exhaustive` states globally, plus issues beside located profession,
    attribute, and skill-slot controls.
12. **Use the editor at constrained widths**: The desktop layout remains primary, while controls,
    results, the eight-slot bar, tooltips, and dialogs reflow or scroll without relying on captured
    screenshot dimensions.

## Architecture

### Scope And Ownership

| Layer | Owns | Must Not Own |
| --- | --- | --- |
| `data/generated/epic-03` and `epic-04` | The two promoted runtime catalog JSON artifacts. | UI state, React components, template workflow, or app-specific indexes. |
| `src/domain` | `Build`, catalog contracts/lookups, budget/rank helpers, validation results, effective ranks, and approved tooltip projection. | React, generated JSON imports, template codec calls, browser storage, network access, or app export policy. |
| `src/template-compatibility` | Bare/chat-wrapper parsing, decode, resolution, exact-source replay, canonical encode, and decode-back fidelity proof. | React, app state, generated imports, validation presentation, or persistence. |
| `src/app/catalogs.ts` | The only two generated JSON imports, bounded top-level assertions, catalog indexes/views, attribution, placeholder-icon policy, and domain input slices. | Live fetching, manifests, QA reports, snapshots, media bytes, storage, or leaf rendering. |
| `src/app/editor-state.ts` | Deterministic in-memory reducer, semantic `Build`, budget settings, raw template identity overlay, browser/dialog state, and atomic slot operations. | Codec calls, catalog loading, DOM behavior, persistence, or rule semantics. |
| `src/app/editor-selectors.ts` | Eligible attribute rows, budgets, browser results, validation projections, tooltip contexts/facts, and component-ready views. | State mutation, generated imports, source-policy decisions, or vendor calls. |
| `src/app/template-workflow.ts` | Decode/resolve-to-editor translation, editor-to-template projection, fingerprint-derived exact replay, and export gating. | Vendor imports, hidden ID guesses, persistence, or UI rendering. |
| `src/app/components/**` | Accessible presentation and event dispatch from typed props. | Generated JSON imports, template codec calls, catalog singleton access, or independent copies of domain rules. |
| `src/app/App.tsx` | Reducer/controller composition, selector memoization, focus/live-region coordination, and top-level ready/loading/error routing. | A second catalog boundary, ad hoc template conversion, or monolithic leaf markup. |

No domain or template-compatibility production module changes are planned. If execution discovers a
genuine missing public primitive, it must first prove that the behavior cannot be expressed in the
app adapter; expanding those framework-neutral APIs is a sprint amendment, not an incidental edit.

### Catalog Boundary

`src/app/catalogs.ts` statically imports exactly:

- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-04/skills.catalog.json`

It performs bounded boot assertions for the expected profile IDs, schema version, non-empty catalog
versions, and required top-level arrays. These assertions catch an incompatible artifact at the app
boundary without duplicating the ingestion pipeline's full schema/QA system. A failed assertion
produces a product-owned catalog error view and does not render source-derived facts.

The ready value contains:

- the full typed profession/attribute and skill catalog objects for calls to existing domain and
  template-resolution APIs;
- numeric-ID and template-ID indexes built once for app selectors;
- small profession, attribute, skill, type, cost, and availability views containing only fields the
  editor displays;
- a composite app catalog version derived from both promoted catalog versions;
- attribution text, safe explicit source links, catalog versions, and generated/retrieved facts; and
- placeholder icon descriptors that contain no remote URL or byte field.

Attribution is a persistent banner placed in DOM and visual order before the catalog-backed editor.
It identifies Guild Wars Wiki as the source family, links only on explicit user navigation, and
shows both catalog versions in a compact details treatment. Leaf components receive attribution and
catalog views as props. The boundary does not pass `remoteMedia.canonicalUrl`, `wikiUrl`, or any
other source URL into placeholder icon props, CSS, `src`, `srcSet`, preloads, or background images.

The app shell accepts a discriminated `loading | error | ready` catalog view so all required states
are testable. Production initialization remains synchronous: the loading state is not implemented
by delaying or dynamically fetching the static catalogs, and error is reached only through boundary
failure. This preserves BW-0801's prohibition on async catalog loading.

A filesystem-level architecture test scans `src/app` and proves that only `catalogs.ts` contains a
`data/generated` import and that its paths are exactly the two approved catalog JSON files. It also
rejects app imports of manifests, QA, snapshots, source plans, ingestion scripts, or wiki clients.

### Editor State And Raw Identity

`EditorState` has four explicit concerns:

1. `build`: the current semantic `Build`, including exactly eight nullable skill slots and ordered
   authored attribute rows;
2. `budget`: app-only `{ level, questBonus }` settings used to construct the validation budget
   option for PvE without adding campaign progression to `Build`;
3. `template`: optional source document, wrapper-name state, and location-aligned raw template ID
   overlay for imported fields that are not resolved to catalog IDs; and
4. `ui`: browser filters/view/batch size, active tooltip, pending keyboard placement, drag state,
   dialog state, and transient operation messages.

Import conversion always uses `resolveSkillTemplateDocument` outcomes:

- known outcomes map to the returned catalog IDs;
- profession `none` and skill slot `empty` map to `null`;
- reserved, unsupported, dispositioned, and unknown outcomes retain the raw template ID in the
  overlay and project the same numeric authored value into the `Build` solely so the existing rule
  engine can report an unresolved reference; and
- attribute order and all eight slot positions remain unchanged.

That numeric projection is an app interoperability detail, not proof that template IDs and catalog
IDs share a namespace. The raw overlay remains authoritative for re-export. Selecting a known
replacement clears only the targeted overlay entry; clearing a field removes only that field;
moving or swapping slots moves their overlay entries atomically with the semantic slots. Changing a
profession does not silently clean attributes or skills that have become inaccessible.

Reducer actions are divided into semantic and UI actions, but exact fidelity does not rely on that
classification. `template-workflow.ts` reconstructs a `SkillTemplateDocument` from current fields:

- known catalog records map through their explicit `templateId` fields or crosswalks;
- null profession/skill values map to the documented `0` sentinel;
- unresolved imported locations use their preserved raw IDs;
- app-created current values with no template crosswalk produce a typed projection failure instead
  of a guess;
- template attributes use deterministic raw-template-ID order for canonical encoding; and
- the original source envelope is retained for an import, while a new build is exported only in
  canonical mode from an app-created document envelope.

`skillTemplateFingerprint` and `exportSkillTemplate` then decide whether current fields still match
the imported source. Mode, budget controls, filters, view mode, active tooltip, selection/focus, and
wrapper-name changes do not alter the skill-template field fingerprint. Profession, attribute, or
skill changes do. Reverting all template-representable fields restores exact-source eligibility.

New imports set build mode to `unknown` because skill templates do not encode mode. The imported
wrapper name is retained as `null`, empty, or non-empty exactly; wrapper naming remains separate
from the editor's local display name so a bare import is not silently converted to a chat wrapper.

### Profession, Mode, And Attribute Projection

Profession and mode changes are simple reducer actions. Attribute rows shown to the user are a
selector projection, not a destructive rewrite of `Build.attributes`:

- normal editable rows come from the selected primary and secondary professions;
- a secondary profession's primary-only attribute is not offered as a normal allocation;
- authored/imported rows outside the currently accessible set remain visible in a clearly labeled
  retained/unresolved section; and
- validation locations retain the authored row index needed for inline issue routing.

Purchased-rank choices and cumulative spend use `attributePointRules.purchasedRankCosts` and
`purchasedRankCost`; no maximum rank or point table is copied into a component. The PvE default is
level 20 with the maximum-applicable quest bonus. The user may select only levels present in
`levelPointTotals` and toggle `none | maximum-applicable`; this is one aggregate quest assumption,
not quest-log or campaign modeling. `attributeBudgetForLevel` calculates display totals, and the
same `{ kind: "level", level, questBonus }` option is passed to `validateBuild` to prevent display
and validation drift.

PvP and unknown mode display that attribute-point budget is not evaluated and pass the explicit
`none` policy. They never reuse the PvE 200-point assumption. Budget settings are retained if the
user switches back to PvE but do not affect template fidelity.

### Skill Browser Query Contract

Browser filtering is a pure selector with a stable, documented pipeline:

1. exclude catalog records explicitly classified as non-player or unsupported from normal results,
   while leaving imported instances representable elsewhere;
2. apply case-insensitive name substring search using the catalog's normalized name field;
3. apply profession scope (`current professions`, `all`, or one explicit profession), with current
   professions as the default when at least one is selected and `all` otherwise;
4. apply optional attribute, exact skill type, elite/non-elite, and availability filters;
5. apply selected resource-kind filters for energy, adrenaline, sacrifice, upkeep, and overcast;
6. group by attribute by default, or sort globally by name or type; and
7. break ties by normalized name and then numeric catalog ID using a deterministic code-point
   comparator rather than catalog order or locale behavior.

The build-mode availability default is `both + pve-only` for PvE, `both + pvp-only` for PvP, and all
availability states for unknown mode. The user may explicitly override that scope. A resource-kind
filter matches supported applicable states (`zero`, `number`, `percentage`, or `special`); absent,
not-applicable, and malformed facts do not masquerade as a supported resource cost.

All matching results remain available to the selector and count display, but the component renders
an initial bounded batch with a visible “Show more” action. Search or filter changes reset the batch
size. This keeps all three view modes responsive over the current 2,951-record catalog without
adding virtualization, pagination services, fuzzy ranking, or a package dependency.

### Skill-Bar Interaction Model

Pointer drag/drop and keyboard placement dispatch the same reducer operations:

- browser skill to slot: place or replace;
- slot to empty slot: move;
- filled slot to filled slot: swap;
- slot to remove target or explicit clear button: clear; and
- any invalid index or stale payload: no mutation plus a bounded status message.

Native drag events carry only an internal MIME marker and opaque operation token. The reducer's
current state, not deserialized `DataTransfer` data, is authoritative. Stable slot rendering is a
tuple of eight button-like controls with placeholder icon, slot number, name/state label, inline
issues, and adjacent clear/move actions as applicable.

Keyboard interaction uses a visible pick/place model rather than attempting to simulate pointer
dragging: Enter/Space on a browser action or filled slot starts placement, focus may move among the
eight slots, Enter/Space commits, Escape cancels, and clear remains a direct button. A polite live
region announces pickup, placement, replacement, swap, clear, and cancellation. Focus is restored
or advanced predictably after each action.

### Skill Facts And Tooltip Projection

One selector creates a renderer-neutral `SkillDisplayView` used by list rows, both grid densities,
bar slots, and tooltips. It includes stable placeholder-icon data, name/type/profession/attribute,
elite and mode labels, and supported cost/timing values. It preserves explicit zero and special
states and labels malformed or unavailable facts rather than coercing them.

Tooltip text uses two complementary approved projections:

- `renderSkillTooltipText` renders the catalog's approved description tokens with a context derived
  from current mode and ranks; and
- a structured progression list follows each `progressionSeriesId`, selects an exact row, and
  displays the catalog's value-slot labels and values without generating prose.

For attribute dependencies, `calculateEffectiveAttributeRank` supplies the authored/unallocated
rank with no equipment, rune, weapon, title, temporary, or manual adjustments. For title-rank
dependencies, the selector uses that series' declared `rankDomain.max`, labels the result “maximum
title rank assumption,” and does not claim ownership or eligibility. Conflicting or absent rank
domains, missing rows/value slots, unknown mode variants, unsupported descriptions, and catalog gaps
produce an explanatory unresolved state rather than a fabricated value.

Tooltips open from hover or focus and can be pinned/opened by an explicit control where necessary.
They are associated with their trigger using accessible descriptions, do not trap focus, and move
into normal flow or a bounded overlay on narrow screens. No functionality depends on hover alone.

### Template Workflow And Export Policy

The import dialog calls only `decodeSkillTemplate` and `resolveSkillTemplateDocument`. It keeps the
typed error code, field path, and safe message at the form boundary; vendor objects, stack traces,
and dependency messages never enter component state. Import is atomic: a failed parse/decode leaves
the existing editor untouched, while success replaces the semantic build and raw overlay together.

The export dialog derives one current validation result and one template projection result. Policy
is explicit:

| State | Exact-source export | Canonical export |
| --- | --- | --- |
| Unchanged imported fields; any warning/incomplete/unresolved state | Allowed if compatibility returns `exact-source`; show validation notices. | Available only if requested and all canonical gates pass. |
| Proven validation error (`valid === false`) | Still allowed for unchanged source preservation. | Blocked before encoding with located errors shown. |
| Edited fields; warnings, incomplete state, unresolved facts, or non-exhaustive validation but no proven error | Not labeled exact; `preserve-source` reports source changed. | Attempted with prominent non-blocking notices. |
| Current app field has no raw template representation/crosswalk | Allowed only if the unchanged imported document still proves exact. | Blocked with an app projection error; never guess an ID. |
| Codec encode or decode-back equality failure | Existing exact replay remains available when unchanged. | Blocked; return no code and show the typed compatibility failure. |

`resolved`, `complete`, and `exhaustive` are displayed independently and never collapsed into
`valid`. The UI does not invent an “all warnings safe” claim; it follows the epic's narrower rule
that only proven errors and failed representation/fidelity proof block canonical output.

Import/export dialogs share one accessible modal primitive with labeled title/description, initial
focus, Tab containment, Escape close, trigger-focus restoration, internal scrolling, wrapped input
and output, and bounded viewport height. Clipboard reads are never automatic. Copy is an explicit
best-effort action; denial or API absence leaves a selectable output field and a visible message.

### Validation And Presentation Flow

The current semantic `Build` and catalog slices feed `validateBuild` through a memoized selector.
PvE uses the same explicit level/quest budget as the attribute display; PvP/unknown use `none`.
Validation is recomputed from current inputs and is not stored as independently mutable reducer
state.

Issues route by structural location:

- profession locations attach to primary or secondary controls;
- attribute-row locations attach to the authored row, including retained imported rows;
- skill-slot locations attach to the corresponding one of eight slots;
- catalog/options or unlocated issues remain in the global summary; and
- template parse/projection/encode failures stay in their respective dialog while the global build
  summary remains visible.

Inline rendering preserves rule-engine severity and code. Components do not parse message prose to
infer location or policy. Warnings and unresolved states never disable ordinary editing, filtering,
placement, replacement, clearing, or dialog access.

### Responsive And Visual Strategy

`compendium/visual-prior-art.md` informs hierarchy, density, framing, selected states, grouped skill
views, stable slots, and tooltip information layers. It does not provide component dimensions,
breakpoints, focus styling, loading/error UI, validation design, or dialog overflow behavior.

The implementation uses an original Build Wars visual system with reusable CSS variables and
shared placeholder sizes. Desktop uses a profession/attribute column plus a skill-browser workspace,
with the skill bar and validation summary kept prominent. Narrow screens stack sections, keep the
skill bar horizontally scrollable or wrap it in an intentional four-by-two layout, move tooltip
content into available flow, and constrain dialogs to the viewport. No breakpoint or component size
is copied from screenshot dimensions.

## Implementation

### Phase 1: BW-0801 App Catalog Boundary, Attribution, And Privacy (~11% of effort)

**Goal:** Establish the only legal runtime path from promoted catalog artifacts into the app before
any source-derived name or fact reaches a leaf component.

**Tasks:**

- [ ] Add `src/app/catalogs.ts` with exactly the two approved static JSON imports, narrow top-level
      boot assertions, typed domain catalog values, app indexes/views, composite version, and a
      discriminated ready/error result.
- [ ] Define a compact attribution view for Guild Wars Wiki source identity, explicit safe links,
      both catalog versions, and relevant generated/retrieved facts. Fail closed to the catalog error
      state if the minimum attribution contract cannot be formed.
- [ ] Add shared placeholder icon descriptors/components for profession, skill list, small grid,
      large grid, skill bar, and tooltip contexts. Do not expose or render remote media URLs.
- [ ] Put attribution before the catalog-driven workspace in DOM and visual order. External links
      require deliberate activation and safe `rel` behavior when opening a new context.
- [ ] Add loading, empty-boundary, and catalog-error presentation contracts without converting the
      static imports to dynamic/async loading.
- [ ] Add architecture tests that scan `src/app` imports, allow `data/generated` only in
      `catalogs.ts`, and allow only the two exact catalog JSON paths there.
- [ ] Add boundary tests for profile/schema/version checks, representative views/indexes,
      attribution presence, stable placeholder shapes, and absence of remote URLs from icon props.

**Verification:**

- `npm run test:run -- src/app/catalogs.test.tsx test/app/catalog-boundary.test.ts`
- `npm run typecheck`
- `rg -n 'data/(generated|qa|source-snapshots)|scripts/data|wiki.*api' src/app`
- `npm run verify`

**Phase Gate:** Catalog facts cannot render without visible attribution, only the approved boundary
imports generated runtime JSON, and no browser path automatically requests remote icons.

### Phase 2: BW-0802 Editor State, Raw Identity, And Fixtures (~14% of effort)

**Goal:** Make every later control operate on one deterministic state model that can preserve
partial builds and raw imported identity without coupling the reducer to the codec.

**Tasks:**

- [ ] Add `src/app/editor-state.ts` with `EditorState`, blank-state construction, semantic/UI action
      unions, immutable reducer, eight-slot invariants, PvE level/quest settings, and typed transient
      operation states.
- [ ] Store the semantic `Build` plus a location-aligned template source/raw-ID overlay. Document
      that unresolved numeric projection into `Build` exists for rule-engine reporting and is never
      treated as a template/catalog crosswalk.
- [ ] Implement deterministic helpers for mode, profession, level/quest, attribute rank, skill
      place/replace/move/swap/clear, browser state, tooltip state, dialog state, and operation cancel.
- [ ] Preserve inaccessible attributes and invalid/unresolved skills through profession or mode
      changes. Only explicit replace/clear actions may discard the corresponding authored value.
- [ ] Make skill operations atomic across semantic slots and raw overlays; reject out-of-range or
      stale operations without partial mutation.
- [ ] Add small shared test fixtures for playable, incomplete, and imported-unresolved editor states.
- [ ] Cover frozen input/no-mutation behavior, exact eight-slot shape, null professions, unknown
      mode, partial allocation, empty slots, raw overlay movement, and deterministic repeated action
      sequences.

**Verification:**

- `npm run test:run -- src/app/editor-state.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Profession, attribute, browser, bar, tooltip, and template phases can share one
tested state contract, and no routine edit can silently compact or erase unresolved imported facts.

### Phase 3: BW-0803 Profession, Mode, And Attribute Editor (~12% of effort)

**Goal:** Deliver catalog-backed character controls and one internally consistent PvE attribute
budget model without introducing campaign, equipment, or title scope.

**Tasks:**

- [ ] Add primary and secondary profession controls plus explicit PvE, PvP, and unknown mode
      controls using app catalog views and reducer actions.
- [ ] Derive normal attribute rows from the selected professions while retaining authored rows that
      are no longer accessible or resolved in a separate warning section.
- [ ] Use catalog purchased-rank rows for allowed rank choices, cumulative spend, and per-row cost;
      do not duplicate rank caps or cost constants in UI code.
- [ ] Add the bounded level control from catalog `levelPointTotals` and one aggregate
      none/maximum-applicable quest-bonus toggle, defaulting PvE to level 20 plus maximum bonus.
- [ ] Use the same explicit budget inputs for remaining-point display and `validateBuild`; show “not
      evaluated” rather than a fictitious remainder in PvP or unknown mode.
- [ ] Keep primary-only and wrong-profession policy in validation. Selectors may decide which normal
      rows to offer but must not hide retained authored conflicts or duplicate rule logic.
- [ ] Add keyboard-operable labels, groups, select/radio/button controls, focus-visible styles, and
      inline issue containers reserved without destabilizing row layout.
- [ ] Test normal profession pairs, null/duplicate pairs, mode switches, rank zero/nonzero,
      level/quest budgets, overspend, primary-only rows, inaccessible imported rows, and
      non-destructive profession changes.

**Verification:**

- `npm run test:run -- src/app/profession-attribute-editor.test.tsx src/app/editor-selectors.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** A user can configure the character-side inputs for a normal level-20 PvE build, and
displayed budget facts cannot diverge from domain validation inputs.

### Phase 4: BW-0804 Skill Browser Search, Filters, And Views (~14% of effort)

**Goal:** Make the full promoted skill catalog discoverable with deterministic filters and bounded
rendering before placement interactions depend on the result model.

**Tasks:**

- [ ] Implement the pure browser query pipeline and explicit defaults defined in Architecture,
      including deterministic tie-breaking and current-profession/build-mode scopes.
- [ ] Add name search; profession, attribute, type, elite, and availability filters; and energy,
      adrenaline, sacrifice, upkeep, and overcast resource-kind filters using supported value-state
      semantics.
- [ ] Add grouped-by-attribute, name-sort, and type-sort modes. Keep the no-attribute group explicit
      and use stable IDs rather than display names as control values.
- [ ] Add list, small-grid, and large-grid views over one `SkillDisplayView` contract with stable
      placeholder boxes and consistent selection/add actions.
- [ ] Render total/matching counts and an initial bounded result batch with “Show more”; reset the
      batch when query/filter/sort/view dependencies require it.
- [ ] Provide product-owned empty catalog, no-result, loading, and error states. No-result must retain
      filters and offer a clear-filters action rather than appearing as catalog failure.
- [ ] Ensure the browser can select or start placement for a skill without independently mutating
      the bar.
- [ ] Test each filter alone, meaningful combinations, special/zero/absent/malformed resource
      states, mode defaults and overrides, stable sorting, group boundaries, batch expansion, and
      no-result recovery against small fixtures plus a promoted-catalog smoke case.

**Verification:**

- `npm run test:run -- src/app/skill-browser.test.tsx src/app/editor-selectors.test.ts`
- `npm run typecheck`
- `npm run build`
- `npm run verify`

**Phase Gate:** All requested browser modes and filters produce deterministic app views, and the
current 2,951-record catalog does not require mounting every matching result at once.

### Phase 5: BW-0805 Eight-Slot Pointer And Keyboard Skill Bar (~13% of effort)

**Goal:** Provide one lossless slot-operation model with game-like pointer behavior and equivalent
keyboard controls.

**Tasks:**

- [ ] Build the eight-slot bar from the Phase 2 tuple state with stable empty, known, unresolved,
      invalid, hover, focus, drag-source, drop-target, and selected states.
- [ ] Wire browser-to-slot placement/replacement, slot-to-empty move, filled-slot swap, remove-target
      clear, and explicit clear actions to the shared reducer helpers.
- [ ] Keep `DataTransfer` payloads opaque and internal; validate operation kind and indices against
      current state before dispatch and ignore foreign/stale drags safely.
- [ ] Implement the keyboard pick/place/cancel flow, direct clear actions, roving or predictable slot
      focus, visible instructions, and polite live announcements.
- [ ] Ensure moving/swapping/clearing known, unresolved, dispositioned, and empty slots updates raw
      overlays atomically and preserves slot positions.
- [ ] Make non-drag actions remain fully usable on narrow screens where pointer drag gestures may be
      unavailable or awkward.
- [ ] Test all operation combinations through pure reducer tests and component events, including
      replacement confirmation treatment, cancel/no-op paths, invalid payloads, focus movement,
      announcements, and exact slot/overlay outcomes.

**Verification:**

- `npm run test:run -- src/app/skill-bar.test.tsx src/app/editor-state.test.ts`
- `npm run typecheck`
- Manual pointer and keyboard walkthrough for place, replace, move, swap, clear, and cancel
- `npm run verify`

**Phase Gate:** Pointer and keyboard users can construct and rearrange the same eight-slot bar, and
no interaction corrupts empty positions or unresolved imported raw IDs.

### Phase 6: BW-0806 Shared Skill Display, Structured Values, And Tooltips (~11% of effort)

**Goal:** Give every skill surface consistent approved facts and rank-sensitive values without
copying source media or synthesizing unreviewed description prose.

**Tasks:**

- [ ] Complete the shared `SkillDisplayView` for name, type, profession, attribute, elite state,
      availability, costs, timings, placeholder icon, and supported/unresolved labels.
- [ ] Build tooltip context from selected mode and `calculateEffectiveAttributeRank` for each
      attribute dependency, with no deferred equipment/title adjustments.
- [ ] Call `renderSkillTooltipText` for approved token projection and render structured progression
      series separately using exact value-slot labels and rank rows.
- [ ] Apply each title series' declared maximum rank with a visible maximum-title-rank assumption.
      Refuse to guess when a key/domain/row is absent or internally conflicting.
- [ ] Present unknown skill, unknown mode variant, missing effective rank, missing progression row,
      unsupported description, and catalog gap as stable explanatory states.
- [ ] Reuse one tooltip trigger/panel behavior for list, grid, and bar contexts; support focus and an
      explicit open path in addition to hover, and prevent viewport/dialog overflow.
- [ ] Test attribute-rank updates, known unallocated rank zero, title maximum assumption, future
      progression-reference tokens, current structured-only runtime records, special cost/timing
      states, and every unresolved outcome without source prose reconstruction.

**Verification:**

- `npm run test:run -- src/app/skill-display.test.tsx src/app/editor-selectors.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Browser rows/tiles and bar slots share consistent facts, authored attribute changes
update structured tooltip values, title values are explicitly assumed, and gaps never crash or
produce invented copy.

### Phase 7: BW-0807 Template Import, Exact Replay, And Canonical Export (~13% of effort)

**Goal:** Expose the proven EPIC-05 compatibility behavior without weakening its raw-ID, error, or
fidelity guarantees at the app boundary.

**Tasks:**

- [ ] Add pure import workflow helpers that decode bare/chat-wrapper input, resolve against the two
      app catalogs, and atomically construct semantic build state plus raw identity overlay.
- [ ] Preserve source envelope, original bare code, normalized dependency evidence, and wrapper name
      null/empty/non-empty semantics. Set imported build mode to unknown rather than guessing.
- [ ] Add editor-to-template projection using explicit record/crosswalk `templateId` facts, raw
      imported overlays, documented zero sentinels, stable attribute ordering, and typed failures
      for values with no representation.
- [ ] Derive exact-source eligibility from the reconstructed document fingerprint. Cover UI-only
      changes, wrapper rename, semantic edit, edit-then-revert, unresolved raw IDs, slot swaps, and
      targeted replace/clear behavior.
- [ ] Implement the export policy matrix: unchanged exact replay despite validation errors;
      canonical block on proven errors or projection failure; warnings/incomplete/unresolved/
      non-exhaustive states shown but non-blocking; codec failure returns no code.
- [ ] Add accessible import and export dialogs with shared modal behavior, bounded text areas,
      typed field errors, long name/code wrapping, explicit close/cancel, and focus restoration.
- [ ] Add explicit best-effort copy support with selectable fallback and no automatic clipboard read.
- [ ] Test bare and wrapped success, null/empty/named wrappers, empty/oversized/invalid/wrong-kind
      input, unresolved/dispositioned IDs, exact source, canonical success, projection failure,
      validation error gate, lossy encode, long content, dialog focus/Escape/overflow, and atomic
      failure behavior.

**Verification:**

- `npm run test:run -- src/app/template-workflow.test.ts src/app/template-dialogs.test.tsx`
- `npm run test:run -- test/template-compatibility/skill-template.test.ts test/template-compatibility/catalog-resolution.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Supported templates import without raw-ID loss, unchanged sources replay exactly,
and no edited canonical code is shown unless representation, validation policy, encode, and
decode-back fidelity gates all pass.

### Phase 8: BW-0808 Validation, Responsive Integration, Documentation, And Closeout (~12% of effort)

**Goal:** Integrate all surfaces into one accessible workflow, prove the stated policy and boundary
invariants, and close EPIC-08 without absorbing later epics.

**Tasks:**

- [ ] Add the global validation summary with counts plus separate `valid`, `complete`, `resolved`,
      and `exhaustive` states; do not reduce them to one success/failure badge.
- [ ] Route structural locations to profession controls, authored attribute rows, and skill slots;
      retain catalog/options/unlocated issues globally and template workflow errors in dialogs.
- [ ] Verify that warnings, incomplete state, unresolved imports, and non-exhaustive results never
      disable ordinary editing and follow the Phase 7 export policy exactly.
- [ ] Compose the full desktop workspace in `App.tsx`, preserve attribution-first ordering, and
      finish narrow-screen stacking/wrapping/scroll behavior, stable placeholder dimensions,
      focus-visible states, live announcements, tooltips, loading/empty/error states, and modal
      overflow.
- [ ] Add end-to-end component scenarios for blank authoring to playable build, incomplete build,
      imported unresolved build, pointer placement, keyboard placement, rank-sensitive tooltip,
      exact replay, edited canonical export, blocked canonical export, and no-result recovery.
- [ ] Measure and record the production JS/CSS asset sizes produced with the promoted static
      catalogs. Do not add chunking, compression infrastructure, or a second runtime artifact in
      this sprint; record a follow-up if the measured payload or startup behavior is unacceptable.
- [ ] Add `compendium/core-build-editor.md` documenting catalog ownership, editor/raw-ID state,
      filters, budget assumptions, interaction model, tooltip limitations, export policy, bundle
      observation, and deferred scope; link it from `compendium/README.md` and update stale root
      README current/deferred scope.
- [ ] Run source-policy and protected-path diff reviews. Confirm no domain, compatibility, generated
      catalog, QA, snapshot, ingestion, prior-art, dependency, or build-configuration file changed.
- [ ] During execution, mark BW-0801 through BW-0808, EPIC-08, SPRINT-009, and the ledger complete
      only after every phase gate and Definition of Done item passes. Ensure the outer run writes
      `work/runs/ticket-burn/EPIC-08/20260902T154644Z/plan-EPIC-08-result.json`; do not commit.

**Verification:**

- `npm run test:run -- src/app test/app`
- `npm run format:check`
- `npm run verify`
- `git diff --exit-code -- src/domain src/template-compatibility data/generated data/qa data/source-snapshots scripts/data prior-art package.json package-lock.json vite.config.ts eslint.config.js`
- `git status --short`
- Manual desktop and narrow-screen pointer/keyboard/dialog/tooltip walkthrough

**Phase Gate:** The full single-character workflow is usable, policy and source boundaries are
documented and tested, canonical verification passes, planning records agree, the required result
manifest exists, and no later-epic or protected file changed.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/app/catalogs.ts` | Create | Sole approved generated-catalog imports, boot assertions, typed app catalogs/indexes/views, attribution, versions, and placeholder policy. |
| `src/app/editor-state.ts` | Create | In-memory semantic build, raw template identity overlay, UI state, reducer, and atomic editor actions. |
| `src/app/editor-selectors.ts` | Create | Attribute/budget, browser, validation, skill-display, progression, and inline-issue projections. |
| `src/app/template-workflow.ts` | Create | Import resolution, editor/template translation, fingerprint-derived exact replay, and canonical export gates. |
| `src/app/test-fixtures.ts` | Create | Small playable, incomplete, and unresolved-import app fixtures used only by tests. |
| `src/app/components/**` | Create | Attribution, controls, attribute editor, browser, skill bar, skill display/tooltip, dialogs, validation, modal, and workspace components. |
| `src/app/App.tsx` | Replace/modify | Compose the catalog state, reducer, selectors, workflows, accessible status regions, and full editor workspace. |
| `src/app/styles.css` | Replace/modify | Original responsive editor layout, stable placeholder/slot dimensions, view densities, focus, validation, tooltip, modal, and narrow-screen states. |
| `src/app/App.test.tsx` | Modify | Retain shell coverage and add integrated ready/loading/error and primary workflow scenarios. |
| `src/app/*.test.ts(x)` | Create | Focused catalog, state, selector, profession/attribute, browser, bar, tooltip, workflow, and dialog tests. |
| `test/app/catalog-boundary.test.ts` | Create | Filesystem source scan enforcing the sole boundary and two exact generated JSON imports. |
| `compendium/core-build-editor.md` | Create | Durable app architecture, state/fidelity, filter, interaction, validation/export, performance, and deferred-scope note. |
| `compendium/README.md` | Modify | Link the core editor note. |
| `README.md` | Modify | Update current and deferred scope after the catalog-backed editor ships. |
| `data/generated/epic-03/professions-attributes.catalog.json` | Read only | Approved runtime profession, attribute, budget, provenance, and metadata input. |
| `data/generated/epic-04/skills.catalog.json` | Read only | Approved runtime skill, cost/timing, structured description/progression, split, and disposition input. |
| `src/domain/**` | Read only | Existing build, catalog, validation, effective-rank, and tooltip contracts/helpers. |
| `src/template-compatibility/**` | Read only | Existing decode, resolve, exact-source, canonical encode, and fidelity APIs. |
| `work/tickets/08-core-build-editor/BW-0801-*.md` through `BW-0808-*.md` | Modify during execution | Record ticket completion and verification evidence only after corresponding gates pass. |
| `work/tickets/08-core-build-editor/EPIC.md` | Modify during execution | Mark EPIC-08 complete only after the full sprint passes. |
| `work/sprints/SPRINT-009.md` | Create/modify during execution | Track the executable sprint and checked Definition of Done. |
| `work/sprints/ledger.tsv` | Modify during execution | Record SPRINT-009 lifecycle consistently with prior sprints. |
| `work/runs/ticket-burn/EPIC-08/20260902T154644Z/plan-EPIC-08-result.json` | Write by outer run | Record the non-interactive EPIC-08 planning result. |

No manifest, QA report, source plan, snapshot, ingestion module, icon binary, screenshot, package
dependency, domain contract, template-compatibility implementation, local-storage schema, service
worker, share route, or deployment file is added or changed.

## Definition of Done

### Catalog Boundary, Attribution, And Privacy

- [ ] `src/app/catalogs.ts` is the only `src/app` module importing generated data, and it imports
      exactly the two promoted catalog JSON files.
- [ ] No runtime app import reaches generated manifests, QA reports, source plans, snapshots,
      ingestion/Python tooling, wiki APIs, or candidate outputs.
- [ ] Incompatible/malformed top-level catalog identity fails to a product-owned error state before
      catalog-derived facts render.
- [ ] Visible Guild Wars Wiki attribution and both catalog versions precede all catalog-derived names
      and facts in DOM and visual order.
- [ ] Profession and skill placeholders have stable list/grid/bar/tooltip dimensions and accessible
      labels where needed.
- [ ] No remote icon URL is assigned to `img`, `picture`, `source`, CSS `url()`, preload, or fetch;
      remote media bytes are never requested automatically.
- [ ] Loading, catalog error, empty catalog, and ready states have explicit accessible presentation,
      without adding async catalog loading.

### Editor State And Character Controls

- [ ] Editor state uses one semantic `Build` with exactly eight slots plus an app-side raw template
      overlay; template and catalog IDs are never mapped by numeric equality.
- [ ] Blank, incomplete, playable, and imported-unresolved states are deterministic, immutable, and
      fixture-covered.
- [ ] Null professions, unknown mode, empty slots, partial attributes, inaccessible imported rows,
      and unresolved IDs remain representable until targeted replace/clear actions.
- [ ] Profession or mode changes do not silently remove attributes or skills.
- [ ] A user can select primary/secondary professions and PvE/PvP/unknown mode with pointer and
      keyboard input.
- [ ] Attribute rows and rank choices derive from the app catalog boundary; primary-only and
      ownership conflicts remain validation-owned.
- [ ] PvE level/quest controls and remaining points derive from catalog rules, use the same explicit
      validation budget, and default to level 20 with maximum-applicable quest bonus.
- [ ] PvP and unknown mode do not inherit the PvE point budget and clearly state that remaining
      points are not evaluated.

### Browser, Skill Bar, And Tooltips

- [ ] Name, profession, attribute, type, elite, availability, and five resource-kind filters have
      documented deterministic semantics and combined/no-result tests.
- [ ] Group-by-attribute, name sort, type sort, list, small-grid, and large-grid modes use one result
      contract with stable ordering and placeholder layout.
- [ ] Browser defaults follow current professions/build mode without hiding the ability to select all
      records, and explicit user overrides remain stable.
- [ ] Matching counts include the whole result while component rendering expands in bounded batches;
      search/filter changes reset the batch predictably.
- [ ] Pointer users can place, replace, move, swap, and clear all eight slots.
- [ ] Keyboard users can perform equivalent pick, place, replace, move, swap, clear, and cancel
      operations with visible instructions, focus feedback, and live announcements.
- [ ] Empty, unresolved, invalid, selected, hover, focus, drag-source, and drop-target slot states do
      not change slot geometry or corrupt raw overlays.
- [ ] Rows, tiles, slots, and tooltips share consistent name/classification/profession/attribute,
      availability, cost/timing, and placeholder facts.
- [ ] Approved tooltip text uses `renderSkillTooltipText`; structured progression values update from
      authored effective attribute ranks without reconstructing source-authored descriptions.
- [ ] Title-scaled values use and visibly label the declared maximum-title-rank assumption; no title
      ownership, allegiance, or eligibility is inferred.
- [ ] Unknown skill/mode, missing rank/value, unsupported description/progression, malformed fact,
      and catalog-gap states remain readable and non-crashing.
- [ ] Tooltips work through focus/explicit controls as well as hover and remain usable at narrow
      widths.

### Template Fidelity And Export Policy

- [ ] Bare codes and exact `[name;code]` wrappers import only through EPIC-05 APIs; typed empty,
      oversized, unsafe, malformed, wrong-kind, dependency, and fidelity failures render safely.
- [ ] Import failure is atomic and leaves the prior editor state unchanged.
- [ ] Successful imports preserve the raw primary/secondary profession IDs, ordered attribute/rank
      pairs, eight raw skill IDs, source envelope, and wrapper name null/empty/non-empty state.
- [ ] Known IDs map only through explicit crosswalk/template-ID facts; none/empty sentinels and
      reserved/unsupported/dispositioned/unknown outcomes remain distinct.
- [ ] Imported mode is unknown until the user selects a mode.
- [ ] Exact-source eligibility comes from reconstructed template fields/fingerprint, not a dirty bit;
      UI-only changes and full semantic reversion retain/regain exact replay.
- [ ] Unchanged imports can exact-replay even with proven validation errors, warnings, incomplete
      state, unresolved facts, or non-exhaustive validation.
- [ ] Canonical export blocks on `valid === false`, app projection failure, or any typed codec/fidelity
      failure and never returns a partial/unproven code.
- [ ] Warnings, incomplete state, unresolved facts, and non-exhaustive validation remain visible but
      do not alone block a representable canonical encode.
- [ ] Long names/codes wrap or scroll inside bounded dialogs; modal focus enters, stays contained,
      closes with Escape, and returns to its trigger.
- [ ] Clipboard access occurs only after an explicit action; denial/unavailability leaves selectable
      output and a useful message.

### Validation, Accessibility, Responsive Behavior, And Closeout

- [ ] The global summary separately presents counts, `valid`, `complete`, `resolved`, and
      `exhaustive`; no combined badge misstates those semantics.
- [ ] Profession, authored attribute-row, and skill-slot issues appear at their structural locations;
      catalog/options/unlocated issues remain globally discoverable.
- [ ] Components route by `ValidationLocation`/path and severity rather than parsing message prose.
- [ ] Warnings and unresolved imports never block ordinary editing or hide retained values.
- [ ] The main desktop workflow and narrow-screen layout remain operable without screenshot-derived
      hard-coded dimensions or hover-only actions.
- [ ] Interactive controls have programmatic names, visible focus, appropriate group/dialog/status
      semantics, and predictable focus after placement and modal actions.
- [ ] Loading, empty, error, no-result, invalid, overflow, and narrow-screen states are covered by
      focused tests or an explicit manual walkthrough where layout cannot be proven in JSDOM.
- [ ] End-to-end app tests cover blank-to-playable authoring, incomplete state, unresolved import,
      both placement modes, dynamic structured values, exact replay, canonical success, canonical
      block, and filter recovery.
- [ ] Production build asset sizes are measured and documented; any unacceptable static catalog cost
      gets a bounded follow-up rather than an unplanned artifact/chunking redesign.
- [ ] `compendium/core-build-editor.md`, its compendium index link, and root README accurately reflect
      shipped behavior and all EPIC-09/15/equipment/party/guide deferrals.
- [ ] `npm run verify` passes, and protected-path diff review confirms no domain, compatibility,
      generated/QA/snapshot/data-tool, prior-art, dependency, or build-config changes.
- [ ] BW-0801 through BW-0808, EPIC-08, SPRINT-009, the ledger, and the exact ticket-burn result
      manifest agree before completion; no commit is created by the run.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Static 15 MB source JSON creates a large production asset or slow startup | High | High | Keep the mandated single static boundary, measure build assets, build indexes once, render bounded result batches, and create a later compact-artifact/chunking ticket only from measured evidence. |
| App code assumes catalog IDs equal template IDs because current numeric values often match | High | Critical | Require explicit `templateId`/crosswalk mapping, retain raw overlays, add mismatched-ID fixtures, and fail canonical projection when no mapping exists. |
| A generic dirty flag permanently loses exact-source replay or incorrectly preserves it | High | High | Reconstruct current template fields and use semantic fingerprints; test UI-only actions, every semantic field, edit/revert, wrapper rename, and unresolved overlays. |
| `Build` cannot itself distinguish an unresolved template ID namespace | Medium | High | Keep the semantic unknown-ID projection and raw template overlay together in app state; never persist or export projected unknowns without the overlay/crosswalk. EPIC-09 must migrate this whole contract, not `Build` alone. |
| Profession/mode changes destructively “fix” imported state | Medium | High | Derive accessible rows and browser defaults without rewriting authored arrays/slots; make replace/clear the only destructive field actions and test non-destructive transitions. |
| Browser filtering mounts thousands of rich tooltip nodes | High | Medium | Keep selectors complete but render bounded batches; create tooltips on demand and reset expansion when the query changes. |
| Filter semantics hide unsupported or unusual cost facts unpredictably | Medium | Medium | Define exact value-state matching, show counts/clear controls, keep imported records visible in the bar, and fixture-test zero/special/malformed/absent states. |
| Native pointer drag/drop becomes the only usable bar interaction | Medium | High | Use shared reducer operations, direct clear/add controls, keyboard pick/place, live announcements, focus tests, and a manual keyboard walkthrough. |
| Pointer payloads or stale drag state corrupt slots | Medium | High | Treat `DataTransfer` as an opaque hint, validate against current app state, bound indices, make operations atomic, and no-op invalid/foreign drags. |
| Current structured-only descriptions cannot satisfy a literal in-game prose expectation | High | High | Render approved token text plus labeled structured progression values; do not synthesize prose; document the limitation and leave copied-description review to a later explicit ticket. |
| Maximum title-rank display is mistaken for owned/equipped title state | Medium | High | Label the assumption at every title-derived value, use declared rank domains only, and preserve EPIC-15 warnings/ownership deferral. |
| UI treats `valid` as equivalent to complete/resolved/exhaustive or silently blocks warnings | High | High | Display all four flags, centralize the export matrix, test each combination, and keep rule messages out of policy decisions. |
| Boundary casting masks a future generated schema change | Medium | High | Add profile/schema/top-level boot assertions, generated-catalog smoke tests, error state, and source-import architecture scan without duplicating ingestion schema validation. |
| Attribution is present but appears after the facts it covers | Medium | High | Make attribution-first DOM order a component contract and integration assertion; fail closed when minimum attribution cannot be formed. |
| Remote metadata accidentally becomes browser media traffic | Medium | Critical | Do not expose URL fields to icon props, prohibit image/CSS/preload wiring, test rendered markup, and inspect browser/network behavior manually. |
| Dialog focus, long codes, or tooltip overlays fail on narrow screens | Medium | High | Share one tested modal primitive, constrain internal overflow, wrap/select long text, restore focus, provide in-flow tooltip fallback, and manually test narrow widths. |
| EPIC-08 absorbs storage, equipment, title, party, or guide behavior | Medium | High | Keep state ephemeral, list explicit deferrals in UI docs, avoid new schemas/dependencies, and protect scope in phase gates and diff review. |

## Security

- Treat template input, template names, decoded values, catalog strings, drag payloads, and clipboard
  failures as untrusted. Render text through React escaping; do not use `dangerouslySetInnerHTML`,
  HTML parsing, Markdown rendering, or executable URLs.
- Preserve the compatibility layer's existing 4,096-character input, 2,048-character bare-code,
  256-code-point name, eight-slot, and sixteen-attribute bounds. Do not add a second parser with
  weaker or inconsistent limits.
- Catch and display typed compatibility failures only. Do not expose vendor objects, exception
  stacks, dependency internals, raw thrown messages, filesystem paths, or unrelated state.
- Do not automatically read the clipboard. Write only after an explicit user action, handle denied
  permissions and unavailable APIs, and retain a selectable manual-copy fallback.
- Use a private internal drag MIME type and an opaque token. Never parse arbitrary dropped HTML,
  URLs, files, JSON, or cross-origin data, and never trust a payload-provided skill ID or slot index
  without current-state validation.
- Remote media metadata remains data-only. Do not place remote icon URLs in image attributes, CSS,
  preload hints, canvas, fetch calls, service workers, or test snapshots. External attribution links
  navigate only after explicit activation and use safe new-context relationship attributes.
- Catalog boot validation must be bounded and synchronous. Do not recursively clone or validate the
  full 15 MB artifact on every render, log the full catalog on failure, or include source data in
  error messages.
- Keep imported builds in memory only. Do not write template codes, names, skill selections, search
  text, or validation results to local/session storage, IndexedDB, URLs, analytics, logs, or remote
  services.
- Modal and tooltip IDs are app-generated bounded identifiers, not interpolated user strings. All
  control values use stable IDs and are checked against the current catalog/state before mutation.
- Review diffs by explicit protected paths. A dirty worktree or outer ticket-burn artifacts do not
  authorize cleanup, deletion, resets, edits to promoted data, or changes outside the execution
  sprint's declared files.

## Dependencies

- `SPRINT-001` / EPIC-00 provides the React/Vite/TypeScript shell, strict compiler settings,
  accessible baseline, repository boundaries, and canonical `npm run verify` command.
- `SPRINT-002` / EPIC-01 provides source vocabulary, attribution requirements, media restrictions,
  and the development-reference-only status of screenshots.
- `SPRINT-004` / EPIC-03 provides the promoted professions/attributes catalog, explicit template
  crosswalks, purchased-rank costs, level totals, quest-bonus policy, and metadata-only profession
  icons.
- `SPRINT-005` / EPIC-04 provides the promoted skills catalog, names/types/classifications,
  structured costs/timings/descriptions/progressions, disposition records, mode facts, and
  metadata-only skill icons.
- `SPRINT-006` / EPIC-05 provides bare/chat-wrapper parsing, skill decode, catalog resolution,
  source envelopes, semantic fingerprints, exact replay, canonical encode/decode-back proof, typed
  errors, and the paw-ned2/team deferral.
- `SPRINT-007` / EPIC-06 provides deterministic `validateBuild`, structural issue locations,
  independent result states, unresolved-ID semantics, PvE budget defaults, and
  `calculateEffectiveAttributeRank`.
- `SPRINT-008` / EPIC-07 provides `compendium/visual-prior-art.md`, including hierarchy/density
  evidence and explicit implementation-owned gaps for focus, responsive layout, loading/error,
  search/filter, validation, and dialog overflow.
- Existing React 19, Testing Library, Vitest, JSDOM, Vite, TypeScript, ESLint, and Prettier are
  sufficient. No state, drag/drop, modal, search, virtualization, schema-validation, icon, storage,
  or clipboard dependency is added.
- Immediate downstream owner: EPIC-09 must preserve or deliberately migrate the semantic build plus
  raw template identity/source contract when adding local persistence.
- Deferred semantic owners: EPIC-13/14 for equipment-derived display/ranks, EPIC-15 for titles and
  allegiance, EPIC-17 for party/hero/team templates, EPIC-18/19 for community/guide workflows, and a
  future evidence-backed data/performance ticket for compact or chunked runtime catalogs.

## Open Questions

No open question blocks execution. This draft resolves the intent questions with these defaults:

1. The app split is `catalogs`, `editor-state`, `editor-selectors`, `template-workflow`, leaf
   components, and a thin `App` composition root. A service layer, global context framework, or
   third-party state library is not justified for one in-memory editor.
2. Unresolved imported identity uses a location-aligned raw template overlay beside the semantic
   `Build`. Known mapping always uses crosswalk/record `templateId`; unknown projection into `Build`
   exists only for validation and never substitutes for raw identity.
3. Exact replay is fingerprint-derived from reconstructed fields, not revision/dirty state.
   Wrapper-name and non-template UI/build settings do not invalidate the original bare code.
4. Minimum attribution is a persistent pre-workspace Guild Wars Wiki banner with explicit source
   links and both catalog versions. Remote icon metadata is not a display source in this sprint.
5. Browser MVP uses exact name substring plus the ticketed filters, explicit value-state semantics,
   stable deterministic sorting, and bounded “Show more” rendering. There is no fuzzy rank,
   recommendation, backend, or virtualization dependency.
6. Import sets mode to unknown because the format carries no mode. The user must choose mode before
   mode-specific validation can become conclusive.
7. PvE budget controls model only a catalog-supported level and aggregate none/maximum quest bonus;
   PvP/unknown budgets are not evaluated. Actual campaign/quest state remains deferred.
8. Current structured-only tooltip text is supplemented by labeled progression facts, not
   reconstructed description sentences. A later digest-bound content review may enrich approved
   text without changing the editor state or tooltip context contracts.
9. Canonical export blocks on proven errors, missing raw representation, or failed codec/fidelity
   proof. Warnings, incomplete state, unresolved facts, and non-exhaustive validation stay visible
   but non-blocking; unchanged exact-source preservation remains available even when errors exist.
10. The current static promoted catalogs remain the runtime source despite their size. This sprint
    measures the built result and avoids mounting all records; it does not create an unauthorized
    derived catalog or async loader.
