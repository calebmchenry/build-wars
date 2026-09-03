---
id: SPRINT-019
title: Focused Build Composer
status: draft
source_target: BACKLOG
source_epic: EPIC-18
source_epic_path: work/tickets/18-focused-build-composer/EPIC.md
tickets:
  - BW-1801
  - BW-1802
  - BW-1803
  - BW-1804
  - BW-1805
  - BW-1806
  - BW-1807
  - BW-1808
  - BW-1809
created: 2026-09-03
updated: 2026-09-03
---

# Sprint 019: Focused Build Composer

## Overview

This sprint refocuses Build Wars around the primary single-build authoring workflow: choose
professions, name the build, allocate attributes, fill the eight-slot skill bar, paste a skill
template code, and copy the current template code. The first screen should feel like a build
composer, not a combined library, equipment, build-set, party, validation, and browser workspace.

This is an app composition and interaction sprint, not a domain reset. Existing reducers,
template compatibility, raw-template overlays, validation, persistence, equipment, build-set,
party, library, backup/restore, and share behavior stay valuable and must not be deleted to make
the first screen simpler. Completed capabilities move behind secondary entry points, collapsed
surfaces, or contextual panels where they no longer compete with the one-build composer path.

The target information architecture is two primary panels:

- Left: the active build composer and source of truth for the selected loadout.
- Right: a catalog surface, beginning with a focused skills tab filtered by the current concrete
  profession selections and grouped by attribute.

Execution should prefer a dedicated composer layer over further growth in `App.tsx`. `App.tsx`
should remain the shell that wires catalogs, workspace persistence, storage banners, dialogs, and
high-level document state. Focused composer components and app-layer selectors should own the new
view model, while `src/domain/**` stays framework-neutral and generated catalog imports remain
isolated to `src/app/catalogs.ts`.

The main ambiguity is asset policy. EPIC-18 wants real profession and skill icons, but current
source policy allows remote icon metadata and forbids runtime hot-linking. Real icon binaries may
ship only if execution has an explicit source-policy-compliant local/static asset approval record.
If that approval is not present, BW-1808 should deliver policy-safe icon placeholders, local
product-owned resource glyphs, stable dimensions, and documented follow-up scope instead of adding
unapproved external media.

Planning assumptions for execution:

- The default blank boot opens a single-build focused composer.
- A restored single build opens directly in the composer.
- A restored build set or party opens the composer for its selected loadout when one exists, with
  build-set or party context moved to secondary controls.
- An empty selected party slot has no selected loadout. The composer shows a create/assign state
  and selected-loadout template/share actions remain disabled.
- "Any" profession is an app-layer unset/filtering convenience. It is not a new domain
  `ProfessionId`, and it must not make canonical template export succeed without concrete template
  profession facts.
- No new runtime dependency, backend service, route, worker, account model, analytics, source-data
  pipeline, or generated catalog import is planned.

## Use Cases

1. **Create a build immediately**: A first-time user lands on a single-build composer with visible
   profession pickers, build name, attributes, skill bar, inline template code, and skills catalog.
2. **Pick professions visually**: A user selects primary and secondary professions from compact
   icon-based controls with stable ordering, accessible names, keyboard support, and an explicit
   "Any" option.
3. **Leave a profession unset**: A user can keep one or both profession fields as "Any" while
   browsing or sketching, and the app clearly blocks validation/export paths that require concrete
   professions.
4. **Rename the active build**: A user edits the build name inline in the composer header and that
   name persists through existing draft, save, backup, and template wrapper behavior where those
   systems already persist `Build.name`.
5. **Allocate attributes like the game**: A user adjusts each visible attribute row with decrement
   and increment affordances that show refund cost, investment cost, allocated rank, and budget
   state using current point rules.
6. **Understand effective rank**: A user can distinguish authored allocated rank from effective
   rank when equipment or future bonuses affect the display, without changing authored rank state.
7. **Fill the skill bar from the catalog**: A user drags a skill from the right-panel catalog to
   any slot in the left-panel bar and receives visible placement feedback.
8. **Edit the skill bar directly**: A user reorders filled slots, replaces an occupied slot, moves a
   skill that is already on the bar, clears a slot through keyboard or pointer controls, and cannot
   accidentally corrupt unresolved imported raw slot facts.
9. **Respect the elite limit while composing**: A user placing a second resolved elite skill sees
   the previous resolved elite removed according to deterministic one-elite placement rules rather
   than discovering the issue only through later validation.
10. **Import a template inline**: A user pastes or types a supported skill template code into the
    inline template control, applies it transactionally, and keeps the previous build when parsing,
    decoding, or resolution fails.
11. **Copy a template inline**: A user copies the current exact-source or canonical template code
    from the composer when available, with selectable fallback text when clipboard access fails.
12. **Browse relevant skills first**: A user sees default skill results for concrete active
    professions, grouped by attribute with collapsible sections and compact cost/cast/recharge
    facts, without first configuring a dense filter panel.
13. **Recover existing advanced work**: A user with saved builds, build sets, parties, equipment,
    title overrides, notes, backups, and selected-loadout share URLs can still access those
    features through secondary surfaces without data loss.
14. **Use narrow screens**: A user on a narrow viewport sees the composer first, then catalog and
    secondary surfaces, with no horizontal overflow, text overlap, or unstable slot dimensions.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| App composition | Composer-first shell, left active-build panel, right catalog panel, secondary entry points for existing tools, restored document handling, responsive ordering. | New routes, marketing page, backend sync, accounts, collaboration, multi-editor layout, full rewrite of existing workspace state. |
| Domain | Reuse existing `Build`, profession, attribute, skill-bar, validation, equipment, build-set, party, and title contracts. | New domain schema for composer UI, `AnyProfessionId`, generated catalog imports, React/browser/storage imports in `src/domain/**`. |
| Editor state | Add narrowly scoped app reducer actions or workflow helpers for build name, focused skill-bar placement, inline template input state, and catalog group collapse. | Persisting transient UI panels, changing local-library schema only for layout state, embedding catalog data in reducer state. |
| Profession header | Icon pickers, editable build name, compact mode control, accessible custom combobox behavior, placeholder-safe icons. | Saved-record naming redesign, party member labels, template export for non-concrete professions, remote icon fetching. |
| Attributes | Focused row view model with allocated rank, effective rank, next cost, refund amount, disabled/hidden states, retained raw rows, and budget status. | Rune/headgear editing, temporary effects, full stat totals, exact final in-game ordering if catalogs do not encode it. |
| Skill bar | Stable eight-slot composer bar, drag placement, replacement, duplicate movement, removal target, one-elite placement policy, keyboard parity, drag image hints. | Party-wide bars, hero AI ordering, saved hotkeys, mobile gesture-only behavior, equipment template changes. |
| Template code | Inline current-code display, copy fallback, paste/import transaction, exact-source replay, canonical export gates, selected-loadout warnings. | Saved template library, remote sharing, equipment templates, party/team template codecs, share URL grammar changes. |
| Skills catalog | Right-panel skills tab, selected-profession defaults, "Any" fallback, attribute grouping, collapsible sections, compact rows, cost glyphs, drag payloads. | Weapons/runes/insignias tabs, recommendations, broad discovery, advanced analysis, virtualized worker search. |
| Visual polish | Existing visual system refinement, local placeholders, policy-approved assets if available, product-owned cost glyphs, focus/hover states, no overlap. | Pixel-perfect game skin, external screenshots as runtime assets, unapproved icon binaries, one-note theme overhaul. |
| Persistence and sharing | Preserve existing local-first persistence, selected-loadout template/share behavior, build-set/party transfer, backup/restore, dirty guards. | New storage key, schema migration for UI-only state, hosted sharing, short links, equipment/title URL payloads. |

### Binding Decisions

1. Introduce a composer component boundary, preferably `BuildComposer`, instead of concentrating
   the full IA pivot in `App.tsx`.
2. Keep `App.tsx` responsible for catalogs, storage, top-level workspace reducer, share-fragment
   boot, autosave, pagehide flush, backup/restore, transfer dialogs, and readiness/error shells.
3. Keep generated catalog JSON imports centralized in `src/app/catalogs.ts`. New composer
   components receive `AppCatalogViews`, placeholder descriptors, and selector output.
4. Do not change `src/domain/build.ts` for "Any". `Build.primaryProfessionId` and
   `Build.secondaryProfessionId` remain `ProfessionId | null`.
5. Treat the picker label "Any" as the UI rendering of `null` unless execution proves a separate
   transient sentinel is necessary. If a sentinel is added, it must be app-only and normalized back
   to `null` before validation, persistence, and template projection.
6. Catalog default filtering uses concrete selected profession IDs. If neither profession is
   concrete, the default skills tab falls back to all playable player skills.
7. Attribute rows are derived from concrete selected professions plus retained authored/imported
   rows. "Any" does not create profession-specific attribute rows.
8. Purchased rank remains `Build.attributes[].rank`. Effective rank is selector-derived from
   `calculateEffectiveAttributeRank` plus existing equipment adjustment helpers.
9. Build name editing updates `EditorState.build.name` through a focused reducer action. Name
   normalization should reuse local-library name bounds where practical and not create a saved
   record by itself.
10. Current mode selection remains available in the focused composer, but it should be visually
    secondary to profession, name, attributes, skill bar, and template code.
11. Existing local-library, equipment, build-set, party, sharing, and validation surfaces remain
    reachable but are not first-screen primary panels.
12. In build-set and party modes, the composer operates only on the active selected loadout. Empty
    selected party slots have no active loadout and must not materialize placeholder builds.
13. Inline template import in build-set or party context replaces only the selected occupied
    loadout and preserves entry ID, entry metadata, party slot metadata, sibling entries, and party
    order through existing workspace transitions.
14. Template copy uses the existing export policy ordering: exact-source when available, otherwise
    proven canonical when available, otherwise blocked reasons and selectable text.
15. Editor reducer code remains catalog-free. Catalog-informed placement decisions should be made by
    a pure app workflow helper that receives `AppCatalogViews` and returns an explicit skill-bar
    mutation for the reducer to apply.
16. One-elite enforcement applies only to resolved catalog skills whose elite status is known.
    Unresolved, raw, unsupported, or ambiguous slots stay preserved and remain validation concerns.
17. Drag payloads remain opaque internal JSON under `BUILD_WARS_DRAG_MIME`; invalid payloads are
    no-ops with drag cancellation.
18. Dragging a filled bar slot moves that slot and its raw overlay together. Dragging a catalog
    skill is an authored semantic placement and clears raw overlay entries for affected target or
    removed duplicate slots.
19. Dropping a catalog skill already present on the bar removes the prior semantic occurrence before
    applying normal target replacement. If the prior occurrence is the target slot, the operation is
    a no-op except selection.
20. Dropping a resolved elite skill clears an existing different resolved elite slot after normal
    duplicate/removal rules. Do not clear a slot whose elite status cannot be proven.
21. A visible removal target is the authoritative pointer clear path. Drag-off-bar clearing may be
    supported where browser behavior is reliable but must not be the only clear mechanism.
22. Collapsed catalog groups are transient app UI state. They do not belong in persisted build
    snapshots or local-library records.
23. Real source-derived icon binaries are conditional. Without explicit source-policy approval,
    implement BW-1808 with placeholder descriptors and product-owned CSS/glyph iconography only.
24. No new runtime dependency is planned. If execution believes one is required, it must stop and
    record the architecture reason before adding it.

### State Flow

```text
App
  -> catalog load state
  -> workspace state
  -> focused composer shell

Focused composer shell
  -> left panel
       composer header
       focused attributes
       focused skill bar
       inline template code
       secondary validation/share affordances

  -> right panel
       catalog tabs
       skills tab
       grouped/collapsible skill rows

  -> secondary tools
       local library
       equipment
       build sets
       party
       backup/restore
       transfer
```

```text
Single build
  WorkspaceState.document.kind = "build"
  active editor = WorkspaceState.editor
  composer enabled

Build set
  selectedEntryId != null
  active editor = selected entry
  composer enabled for selected loadout
  build-set controls secondary

Party
  selected occupied slot
    active editor = referenced entry
    composer enabled for selected member

  selected empty slot
    active editor unavailable
    composer shows create/assign state
    selected-loadout template/share disabled
```

### View Model Shapes

Exact TypeScript names may follow local style, but execution should keep these projections explicit:

```text
ComposerShellView
  documentContext: "single-build" | "build-set" | "party" | "empty-party-slot"
  hasSelectedLoadout: boolean
  secondaryTools: readonly ComposerSecondaryToolView[]
  banners: catalog/storage/validation summaries from existing selectors

ComposerHeaderView
  buildName: string
  mode: GameMode
  primary: ComposerProfessionChoice
  secondary: ComposerProfessionChoice
  professionOptions: readonly ComposerProfessionOption[]
  exportConcreteProfessionState: "ready" | "missing-primary" | "missing-secondary" | "missing-both"

ComposerProfessionChoice
  kind: "any" | "concrete"
  professionId: ProfessionId | null
  label: string
  placeholder: PlaceholderIconDescriptor
```

```text
FocusedAttributeRowView
  key: string
  attributeId: AttributeId | null
  buildIndex: number | null
  label: string
  professionLabel: string
  allocatedRank: number
  effectiveRank: number | null
  effectiveRankState: "same" | "augmented" | "reduced" | "unresolved"
  spend: number | null
  decrementRefund: number | null
  incrementCost: number | null
  canDecrement: boolean
  canIncrement: boolean
  retained: boolean
  raw: RawTemplateOverlayEntry | null
  issues: readonly ValidationIssue[]
```

```text
FocusedSkillCatalogView
  totalCount: number
  matchingCount: number
  renderedCount: number
  hasMore: boolean
  activeProfessionScope: readonly ProfessionId[]
  groups: readonly FocusedSkillCatalogGroupView[]
  emptyState: "none" | "no-professions" | "no-results" | "catalog-unavailable"

FocusedSkillCatalogGroupView
  id: string
  label: string
  collapsed: boolean
  skills: readonly FocusedSkillRowView[]

FocusedSkillRowView
  skillId: SkillId
  name: string
  typeLabel: string
  attributeLabel: string
  professionLabel: string
  elite: boolean
  placeholder: PlaceholderIconDescriptor
  compactFacts: readonly SkillCompactFactView[]
  draggable: boolean
```

```text
SkillBarPlacementPlan
  nextSkillBar: SkillBar
  nextRawSkillBarOverlay: RawSkillBarOverlay
  selectedSlotIndex: number
  clearedDuplicateSlotIndex: number | null
  clearedEliteSlotIndex: number | null
  replacedSlotIndex: number | null
  message: string | null
```

## Implementation

### Phase 0: BW-1801 IA Freeze and Baseline

**Files:**

- `work/sprints/SPRINT-019.md`
- `compendium/build-composer-use-case.md`
- `compendium/README.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/multi-build-workspace.md`
- `compendium/visual-prior-art.md`
- `compendium/source-policy.md`
- `README.md`
- `src/app/App.test.tsx`
- `src/app/editor-state.test.ts`
- `src/app/template-workflow.test.ts`
- `src/app/skill-bar.test.tsx`
- `src/app/skill-browser.test.tsx`
- `src/app/catalog-boundary.test.ts`

**Tasks:**

- [ ] Mark SPRINT-019 and BW-1801 in progress when execution begins.
- [ ] Review `compendium/build-composer-use-case.md` against EPIC-18 and update only durable
      product context that is wrong, stale, or missing.
- [ ] Confirm `compendium/README.md` links the focused composer use case.
- [ ] Record the first-screen IA map from current surfaces to focused primary and secondary
      surfaces.
- [ ] Freeze the "Any" profession rule as app-layer unset/filtering behavior unless a maintainer
      chooses a different explicit product decision.
- [ ] Freeze the source-policy asset decision for BW-1808 before visual work begins.
- [ ] Run focused baseline tests for app boot, template import/export, skill bar, skill browser,
      catalog boundary, persistence, selected-loadout sharing, build sets, party, equipment, and
      title ranks.
- [ ] Confirm no domain schema, local-library schema, source-data pipeline, new runtime dependency,
      or implementation-code deletion is required for the IA pivot.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/editor-state.test.ts src/app/template-workflow.test.ts src/app/skill-bar.test.tsx src/app/skill-browser.test.tsx src/app/catalog-boundary.test.ts`
- `npm run typecheck`
- Markdown review of `compendium/build-composer-use-case.md` and `compendium/README.md`

**Gate:** The product use case, deferrals, "Any" semantics, asset policy path, and first-screen IA
are explicit before shell work starts.

### Phase 1: BW-1802 Two-Panel Composer Shell

**Files:**

- `src/app/App.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/components/ComposerSecondaryTools.tsx`
- `src/app/components/EditorWorkspaceTabs.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/components/ShareControls.tsx`
- `src/app/components/ValidationPanel.tsx`
- `src/app/composer-selectors.ts`
- `src/app/composer-selectors.test.ts`
- `src/app/build-composer.test.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Add a `BuildComposer` composition boundary with left composer panel, right catalog panel, and
      secondary tools area.
- [ ] Move the default first screen from the current dense workspace into the focused composer
      without removing underlying library, equipment, build-set, party, share, or validation
      capabilities.
- [ ] Keep catalog attribution before catalog-derived controls in DOM and visual order, but make it
      compact enough not to dominate the composer.
- [ ] Keep `StorageBanner` visible when durability or parse state requires attention.
- [ ] Put library, build-set, party, backup/restore, transfer, equipment, share, and detailed
      validation behind collapsed/contextual secondary controls.
- [ ] Ensure single-build boot, restored single-build draft, restored build-set draft, restored
      party draft, share URL boot, catalog error, and write-blocked storage states render coherent
      first screens.
- [ ] Keep selected-loadout actions disabled or replaced with create/assign actions when no active
      loadout exists.
- [ ] On narrow screens, order content as composer, skills catalog, then secondary tools; prevent
      horizontal overflow and text overlap.
- [ ] Keep existing modal primitives for backup/restore/transfer where they remain secondary.

**Verification:**

- `npm run test:run -- src/app/build-composer.test.tsx src/app/composer-selectors.test.ts src/app/App.test.tsx src/app/workspace-state.test.ts src/app/build-set-state.test.ts src/app/party-state.test.ts`
- `npm run typecheck`

**Gate:** First boot and restored document states open into a composer-first experience while
existing document workflows remain reachable and data-preserving.

### Phase 2: BW-1803 Composer Header, Profession Pickers, and Build Name

**Files:**

- `src/app/components/ComposerHeader.tsx`
- `src/app/components/ProfessionIconPicker.tsx`
- `src/app/components/ProfessionModeEditor.tsx`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/composer-selectors.ts`
- `src/app/composer-selectors.test.ts`
- `src/app/catalogs.ts`
- `src/app/catalogs.test.ts`
- `src/app/profession-picker.test.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Add a focused build-name editor that updates `EditorState.build.name` without changing saved
      record identity or creating a saved record.
- [ ] Render primary and secondary profession choices as compact icon buttons that open accessible
      custom listbox or combobox menus.
- [ ] Include ten profession options plus "Any" in stable order for each picker.
- [ ] Use catalog placeholder descriptors for profession icons unless approved local icon assets
      are available through the catalog boundary.
- [ ] Keep pointer, keyboard, focus restoration, Escape, Tab, and screen-reader labels coherent.
- [ ] Wire concrete profession choices to existing validation, attribute rows, skill eligibility,
      selected-profession catalog defaults, and template export projection.
- [ ] Render "Any" as unset. It contributes no concrete profession to validation or template
      projection and must expose blocked export reasons when concrete professions are required.
- [ ] Keep mode selection available as a compact segmented control or equivalent in the composer
      header area.
- [ ] Preserve raw profession overlay clearing behavior when a user changes a profession manually.

**Verification:**

- `npm run test:run -- src/app/profession-picker.test.tsx src/app/composer-selectors.test.ts src/app/editor-state.test.ts src/app/catalogs.test.ts src/app/App.test.tsx src/app/template-workflow.test.ts`
- `npm run typecheck`

**Gate:** Profession and name editing are compact, accessible, connected to existing state, and do
not introduce a domain-level "Any" profession.

### Phase 3: BW-1804 Focused Attribute Allocation Editor

**Files:**

- `src/app/components/FocusedAttributeEditor.tsx`
- `src/app/components/AttributeEditor.tsx`
- `src/app/composer-selectors.ts`
- `src/app/composer-selectors.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/attribute-editor.test.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Build focused attribute row selectors with allocated rank, effective rank, spend, increment
      cost, decrement refund, budget status, retained state, raw overlay, and validation issues.
- [ ] Reuse existing point rules through `purchasedRankCost`, `attributeBudgetForLevel`, and
      `selectAttributeBudgetView`.
- [ ] Use `calculateEffectiveAttributeRank`, `collectEquipmentAttributeRankAdjustments`, and
      `equipmentAdjustmentsForAttribute` for effective-rank display without mutating authored rank.
- [ ] Hide decrement controls when allocated rank is zero or the row cannot be decremented.
- [ ] Hide increment controls when cap or remaining budget prevents investment.
- [ ] Keep retained unresolved/imported rows visible and removable without compacting unrelated raw
      template overlay rows.
- [ ] Keep PvE budget controls available but visually subordinate; PvP and unknown mode should use
      the existing non-evaluated budget policy.
- [ ] Ensure long attribute names, unresolved labels, primary-only attributes, zero ranks, max
      ranks, overspend, and equipment-derived effective-rank differences do not shift the layout.

**Verification:**

- `npm run test:run -- src/app/attribute-editor.test.tsx src/app/composer-selectors.test.ts src/app/editor-selectors.test.ts src/app/editor-state.test.ts test/domain/effective-attribute-rank.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Gate:** Attribute editing uses current rules, clearly separates allocated and effective rank, and
remains stable for retained and unresolved imported rows.

### Phase 4: BW-1807 Right-Panel Skills Catalog

**Files:**

- `src/app/components/FocusedSkillCatalog.tsx`
- `src/app/components/SkillBrowser.tsx`
- `src/app/components/SkillDisplay.tsx`
- `src/app/components/SkillTooltip.tsx`
- `src/app/composer-selectors.ts`
- `src/app/composer-selectors.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/editor-state.ts`
- `src/app/skill-browser.test.tsx`
- `src/app/focused-skill-catalog.test.tsx`
- `src/app/drag-payload.ts`
- `src/app/drag-payload.test.ts`
- `src/app/styles.css`

**Tasks:**

- [ ] Add the right-panel catalog surface with Skills as the initial implemented tab.
- [ ] Reuse existing deterministic browser filtering and sorting where possible, but expose a
      focused view model that defaults to concrete selected professions.
- [ ] Define "Any" fallback behavior: unset professions contribute no scope; no concrete
      professions means all playable player skills.
- [ ] Group default results by attribute, using group labels that remain unambiguous when all
      professions are visible.
- [ ] Add transient collapsed/expanded state for attribute groups.
- [ ] Render compact rows with icon placeholder or approved icon, skill name, type/elite indicator,
      and right-aligned cost/cast/recharge facts.
- [ ] Include energy, adrenaline, sacrifice, upkeep, overcast, activation, recharge, morale
      recharge, and other already-modeled values only when the catalog record represents them.
- [ ] Keep search and maybe one concise advanced-filter disclosure if needed; do not preserve the
      current full filter wall as the default first-screen catalog.
- [ ] Keep drag payload creation centralized through `drag-payload.ts` and compatible with the
      skill-bar placement workflow.
- [ ] Provide useful empty states for no concrete professions, no results, catalog errors, hidden
      unsupported records, and exhausted result batches.

**Verification:**

- `npm run test:run -- src/app/focused-skill-catalog.test.tsx src/app/skill-browser.test.tsx src/app/composer-selectors.test.ts src/app/editor-selectors.test.ts src/app/drag-payload.test.ts src/app/catalog-boundary.test.ts`
- `npm run typecheck`

**Gate:** The skills catalog is compact, grouped, draggable, useful by default, and does not add
runtime catalog imports outside `src/app/catalogs.ts`.

### Phase 5: BW-1805 Skill Bar Placement, Removal, and One-Elite Policy

**Files:**

- `src/app/skill-bar-workflow.ts`
- `src/app/skill-bar-workflow.test.ts`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/drag-payload.ts`
- `src/app/drag-payload.test.ts`
- `src/app/components/SkillBar.tsx`
- `src/app/skill-bar.test.tsx`
- `src/app/components/FocusedSkillCatalog.tsx`
- `src/app/focused-skill-catalog.test.tsx`
- `src/app/components/SkillDisplay.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Add a pure catalog-informed placement planner that computes the next eight-slot skill bar and
      raw overlay tuple before dispatching a reducer mutation.
- [ ] Keep editor reducer mutation deterministic, catalog-free, index-bounded, and tuple-length
      preserving.
- [ ] Cover catalog-to-empty-slot placement, catalog-to-filled-slot replacement, filled-slot move,
      filled-slot swap, duplicate semantic skill movement, invalid payload no-ops, and selected slot
      updates.
- [ ] Preserve raw overlays when moving slots from the bar; clear raw overlays when a user authors
      resolved catalog placements into affected slots.
- [ ] Implement one-elite replacement for resolved elite skills without clearing unresolved or
      unproven elite-like raw slots.
- [ ] Add a visible removal target that clears dropped filled slots and cancels invalid payloads.
- [ ] Support reliable drag-off-bar clearing only as a progressive enhancement; keyboard clear and
      explicit removal target are required.
- [ ] Use `setDragImage` or an equivalent browser-supported path to show a skill icon or placeholder
      drag image where available.
- [ ] Preserve keyboard alternatives for pick, place, move, replace, clear, cancel, and focus
      recovery.
- [ ] Ensure layout dimensions stay fixed during hover, focus, drag, drop, validation changes, long
      skill names, unresolved raw slots, and empty slots.

**Verification:**

- `npm run test:run -- src/app/skill-bar-workflow.test.ts src/app/editor-state.test.ts src/app/skill-bar.test.tsx src/app/focused-skill-catalog.test.tsx src/app/drag-payload.test.ts src/app/App.test.tsx test/domain/skill-bar-rules.test.ts`
- `npm run typecheck`

**Gate:** Bar interactions enforce composer placement policy while preserving existing validation
and raw-template invariants.

### Phase 6: BW-1806 Inline Template Import and Export

**Files:**

- `src/app/components/InlineTemplateCode.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/composer-selectors.ts`
- `src/app/composer-selectors.test.ts`
- `src/app/inline-template-code.test.tsx`
- `src/app/template-dialogs.test.tsx`
- `src/app/share-url.test.ts`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Replace the modal-first template access in the primary composer with an inline template code
      control under the skill bar.
- [ ] Keep existing dialogs only if they remain secondary, test-covered, and no longer required for
      the core import/export path.
- [ ] Derive visible export text from existing `evaluateTemplateExport` and
      `selectShareTemplateExport` policies.
- [ ] Prefer exact-source replay when available, then canonical export only after validation,
      projection, encode, and decode-back gates pass.
- [ ] Maintain separate derived export text and user import draft text so typing invalid input does
      not overwrite the current representable code.
- [ ] Copy only the current available export code. On clipboard failure, leave the code visible and
      selectable with an accurate status message.
- [ ] Import pasted or typed codes transactionally through `importSkillTemplateToEditor`.
- [ ] Preserve dirty-guard behavior and warnings before replacing meaningful equipment or authored
      title-rank overrides.
- [ ] In build-set or party context, replace only the selected occupied loadout and preserve sibling
      entries plus party metadata.
- [ ] Render blocked exact/canonical reasons compactly without moving validation ownership out of
      the existing validation and template workflow.

**Verification:**

- `npm run test:run -- src/app/inline-template-code.test.tsx src/app/template-workflow.test.ts src/app/template-dialogs.test.tsx src/app/editor-state.test.ts src/app/share-url.test.ts src/app/App.test.tsx test/template-compatibility`
- `npm run typecheck`

**Gate:** Users can copy and import template codes inline without weakening exact-source,
canonical, dirty-guard, or selected-loadout semantics.

### Phase 7: BW-1808 Icon Assets and Visual Polish

**Files:**

- `src/app/catalogs.ts`
- `src/app/catalogs.test.ts`
- `src/app/components/SkillDisplay.tsx`
- `src/app/components/ComposerHeader.tsx`
- `src/app/components/ProfessionIconPicker.tsx`
- `src/app/components/FocusedSkillCatalog.tsx`
- `src/app/components/SkillBar.tsx`
- `src/app/components/FocusedAttributeEditor.tsx`
- `src/app/icon-assets.ts` if policy-approved static assets exist
- `src/app/icon-assets.test.ts` if policy-approved static assets exist
- `src/app/catalog-boundary.test.ts`
- `src/app/build-composer.test.tsx`
- `src/app/styles.css`
- `compendium/source-policy.md`
- `compendium/visual-prior-art.md`
- approved local asset paths only if a source-policy record explicitly allows them

**Tasks:**

- [ ] Before adding any image asset, verify whether BW-1808 has explicit source-policy approval for
      source-derived icon binaries and exact local/static paths.
- [ ] If approval exists, route icon descriptors through `src/app/catalogs.ts` or a small app-owned
      asset adapter without exposing remote URLs to leaf components.
- [ ] If approval does not exist, use existing placeholder descriptors, initials, catalog media IDs
      as metadata, and product-owned CSS/glyph symbols for costs.
- [ ] Add accessible resource/cost glyphs for energy, adrenaline, sacrifice, upkeep, overcast,
      activation, recharge, and morale recharge without copying unapproved game art.
- [ ] Tighten spacing, slot frames, hover, focus, active, invalid, retained, empty, selected,
      dragging, blocked, and narrow-screen states.
- [ ] Keep card radii, controls, icon buttons, and dense tool surfaces consistent with existing app
      conventions.
- [ ] Avoid adding runtime `<img>`, `<source>`, `<picture>`, preload, canvas, fetch, wiki URLs, or
      source-snapshot references unless the catalog-boundary test is deliberately updated with
      approved local-only behavior.
- [ ] Verify long build names, long skill names, long attribute names, missing cost facts,
      special/zero costs, and validation messages do not overlap or resize fixed-format controls.
- [ ] Document any asset approval gap as a BW-1808 closeout note and follow-up ticket instead of
      bypassing policy.

**Verification:**

- `npm run test:run -- src/app/catalogs.test.ts src/app/catalog-boundary.test.ts src/app/build-composer.test.tsx src/app/focused-skill-catalog.test.tsx src/app/skill-bar.test.tsx src/app/attribute-editor.test.tsx`
- `npm run typecheck`
- Manual desktop and narrow-screen smoke review for no overlap, stable slots, keyboard focus,
  drag feedback, and readable cost glyphs.

**Gate:** Visual polish improves the focused composer without remote media, unapproved assets,
layout shifts, or source-policy regressions.

### Phase 8: BW-1809 Verification, Documentation, and Closeout

**Files:**

- `README.md`
- `compendium/build-composer-use-case.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/multi-build-workspace.md`
- `compendium/visual-prior-art.md`
- `work/tickets/18-focused-build-composer/EPIC.md`
- `work/tickets/18-focused-build-composer/BW-1801-product-use-case-and-ia.md`
- `work/tickets/18-focused-build-composer/BW-1802-two-panel-composer-shell.md`
- `work/tickets/18-focused-build-composer/BW-1803-build-header-profession-pickers.md`
- `work/tickets/18-focused-build-composer/BW-1804-attribute-allocation-editor.md`
- `work/tickets/18-focused-build-composer/BW-1805-skill-bar-drag-drop-refinement.md`
- `work/tickets/18-focused-build-composer/BW-1806-inline-template-import-export.md`
- `work/tickets/18-focused-build-composer/BW-1807-skill-catalog-tab.md`
- `work/tickets/18-focused-build-composer/BW-1808-icon-assets-and-visual-polish.md`
- `work/tickets/18-focused-build-composer/BW-1809-verification-and-closeout.md`
- `work/sprints/SPRINT-019.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T141222Z/plan-EPIC-18-result.json`

**Tasks:**

- [ ] Run focused regression suites for composer shell, profession pickers, attributes, skill
      catalog, skill bar, inline templates, storage, build sets, party, equipment, title ranks,
      share URLs, backup/restore, transfer, and catalog boundaries.
- [ ] Run `npm run verify`.
- [ ] Run `git diff --check`.
- [ ] Manually smoke-test blank boot, restored draft, restored saved single build, restored build
      set, restored party, empty selected party slot, share URL boot, catalog error, storage
      write-blocked state, inline import failure, inline import success, copy fallback, drag/drop,
      keyboard placement, narrow viewport, and long text cases.
- [ ] Update README and compendium docs to describe the focused composer as the primary app
      experience and name secondary/deferred capabilities accurately.
- [ ] Record asset-policy outcome for real icons versus placeholder/glyph fallback.
- [ ] Confirm deferred use cases remain deferred: equipment-first editing, saved build management,
      build sets, party tools, guide authoring, broad discovery, advanced analysis, external team
      codecs, backend sync, accounts, collaboration, hosted sharing, PWA, analytics.
- [ ] Reconcile BW-1801 through BW-1809, EPIC-18, SPRINT-019, ledger, and ticket-burn result
      manifest only after verification passes.

**Verification:**

- `npm run test:run -- src/app test/domain test/template-compatibility`
- `npm run verify`
- `git diff --check`

**Gate:** EPIC-18 closes only when the focused composer is shipped, documented, verified, and clear
about intentionally deferred scope and asset-policy constraints.

## Files Summary

| File or Area | Action | Purpose |
| --- | --- | --- |
| `src/app/App.tsx` | Modify | Keep top-level catalog, storage, workspace, dialog, autosave, share-fragment, and readiness wiring while delegating focused composer UI. |
| `src/app/components/BuildComposer.tsx` | Create | Own the composer-first two-panel layout and selected-loadout empty states. |
| `src/app/components/ComposerSecondaryTools.tsx` | Create | Provide secondary access to library, equipment, build-set, party, share, validation, backup, restore, and transfer features. |
| `src/app/components/ComposerHeader.tsx` | Create | Render build name, primary/secondary profession pickers, mode, and compact export-readiness context. |
| `src/app/components/ProfessionIconPicker.tsx` | Create | Accessible icon/listbox picker for ten professions plus "Any". |
| `src/app/components/FocusedAttributeEditor.tsx` | Create | In-game-style attribute rows with cost/refund/effective-rank affordances. |
| `src/app/components/FocusedSkillCatalog.tsx` | Create | Right-panel skills tab with selected-profession defaults, grouping, collapse, compact costs, empty states, and drag payloads. |
| `src/app/components/InlineTemplateCode.tsx` | Create | Inline exact/canonical code display, copy fallback, import draft, and transactional paste/import. |
| `src/app/components/SkillBar.tsx` | Modify | Composer slot framing, removal target, drag image feedback, replacement, duplicate movement, one-elite policy, and keyboard parity. |
| `src/app/components/SkillBrowser.tsx` | Modify/reuse | Reuse existing filtering behavior or keep as secondary/advanced browser behind focused catalog. |
| `src/app/components/SkillDisplay.tsx`, `SkillTooltip.tsx` | Modify | Shared icon, compact facts, cost glyphs, long-name behavior, and tooltip consistency. |
| `src/app/components/ProfessionModeEditor.tsx`, `AttributeEditor.tsx`, `TemplateDialogs.tsx` | Modify/reuse | Preserve legacy/secondary behavior or extract shared controls into focused composer components. |
| `src/app/components/LibraryPanel.tsx`, `BuildSetNavigator.tsx`, `PartyWorkspace.tsx`, `ShareControls.tsx`, `ValidationPanel.tsx`, transfer dialogs | Modify minimally | Keep existing advanced workflows reachable without making them first-screen primary surfaces. |
| `src/app/composer-selectors.ts` | Create | Focused composer, header, attribute, catalog, secondary-tool, and empty-state view models. |
| `src/app/skill-bar-workflow.ts` | Create | Pure catalog-informed skill placement planner for duplicate movement, replacement, removal, and one-elite enforcement. |
| `src/app/editor-state.ts` | Modify | Add narrow actions for build name, inline template UI state, group collapse, and applying planned skill-bar mutations as needed. |
| `src/app/editor-selectors.ts` | Modify | Reuse and extend existing validation, budget, skill display, and browser projections without absorbing all composer-specific views. |
| `src/app/template-workflow.ts` | Modify/reuse | Preserve exact-source, canonical, import, projection, and share export policy for inline template controls. |
| `src/app/drag-payload.ts` | Modify/test | Keep opaque internal drag payload parsing strict and support removal/drag-image metadata if needed. |
| `src/app/catalogs.ts` | Modify cautiously | Add policy-safe icon descriptors or approved local asset mappings while preserving generated-import isolation. |
| `src/app/styles.css` | Modify | Implement focused two-panel layout, stable slots, icon controls, compact catalog rows, responsive stacking, and no-overlap states. |
| `src/app/*composer*.test.tsx`, `src/app/*composer*.test.ts`, `src/app/skill-bar-workflow.test.ts` | Create | Cover focused composer selectors, shell, header, attributes, catalog, inline template, and skill placement planning. |
| Existing `src/app/*.test.tsx`, `src/app/*.test.ts` | Modify | Update tests for the composer-first UI while preserving regressions for storage, build sets, parties, equipment, sharing, and templates. |
| `src/domain/**` | Preserve | No planned domain changes for EPIC-18; keep framework-neutral contracts stable. |
| `src/template-compatibility/**` | Preserve | No planned template codec changes; inline UI consumes existing adapter/workflow behavior. |
| `compendium/*.md`, `README.md` | Modify during execution | Document focused composer behavior, secondary surfaces, template/export policy, asset policy, and deferred scope. |
| `work/tickets/18-focused-build-composer/*.md` | Modify during execution | Track ticket status, evidence, and closeout notes. |
| `work/sprints/SPRINT-019.md`, `work/sprints/ledger.tsv`, run manifest | Modify during execution | Record final sprint lifecycle and ticket-burn result consistency. |

## Definition of Done

- [ ] BW-1801 through BW-1809 are implemented in dependency order and traceable to EPIC-18.
- [ ] The first screen opens into a focused two-panel composer for blank and single-build drafts.
- [ ] Restored build-set and party drafts preserve their data and expose the composer only for the
      selected active loadout.
- [ ] Empty selected party slots do not materialize placeholder builds and selected-loadout actions
      remain disabled until a loadout is created or assigned.
- [ ] Existing library, equipment, build-set, party, backup/restore, transfer, validation, and share
      workflows remain reachable as secondary surfaces and pass regression tests.
- [ ] Runtime generated catalog imports remain isolated to `src/app/catalogs.ts`.
- [ ] `src/domain/**` stays framework-neutral and receives no composer-only UI state.
- [ ] The profession header provides accessible icon pickers for primary and secondary professions,
      ten profession choices, "Any", compact mode control, and inline build-name editing.
- [ ] "Any" is app-layer unset/filtering behavior and cannot silently produce invalid canonical
      template output.
- [ ] Attribute rows show decrement refund, increment cost, allocated rank, effective-rank state,
      attribute label, budget status, retained imported rows, and accessible increment/decrement
      controls.
- [ ] Attribute point costs and budget behavior match existing point-rule selectors and validation.
- [ ] The right-panel skills tab defaults to selected concrete professions, groups by attribute,
      supports collapse/expand, renders compact cost facts, handles "Any", and exposes useful empty
      states.
- [ ] The skill bar supports catalog placement, filled-slot movement, replacement, duplicate
      movement, removal target clearing, keyboard alternatives, invalid payload no-ops, drag
      feedback, and one-elite replacement for resolved elite skills.
- [ ] Skill-bar mutations preserve unresolved raw overlays when moving slots and clear only the raw
      overlay entries affected by explicit semantic authoring or clearing.
- [ ] Inline template controls show current exact/canonical output or blocked reasons, copy available
      code, leave selectable fallback text, import valid input transactionally, and preserve previous
      state on invalid input.
- [ ] Exact-source replay and canonical export gates remain unchanged in meaning.
- [ ] Selected-loadout template/share warnings remain accurate for build sets, parties, equipment,
      title overrides, sibling entries, and party metadata.
- [ ] Visual polish uses approved local/static assets only, or policy-safe placeholders and
      product-owned glyphs when approval is absent.
- [ ] No runtime remote media URL, wiki fetch, image preload, source snapshot import, or unapproved
      icon binary enters app rendering.
- [ ] Desktop and narrow-screen layouts have stable dimensions, visible focus states, readable cost
      facts, no horizontal overflow, no overlapping text, and no drag-induced layout shift.
- [ ] Documentation names deferred use cases explicitly and does not imply equipment, build-set,
      party, guide, discovery, or analysis workflows are primary EPIC-18 scope.
- [ ] No new runtime dependency, backend service, route, worker, account model, analytics,
      source-data profile, generated catalog import, or storage key is added.
- [ ] Focused reducer, selector, component, workflow, and regression tests pass.
- [ ] `npm run test:run -- src/app test/domain test/template-compatibility` passes.
- [ ] `npm run verify` passes.
- [ ] `git diff --check` passes.
- [ ] BW-1801 through BW-1809, EPIC-18, SPRINT-019, ledger, result manifest, README, and compendium
      docs agree before closeout.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The IA pivot deletes or weakens completed library, equipment, build-set, party, or persistence behavior. | Medium | Critical | Treat the sprint as composition and interaction work; gate on existing regression suites and secondary access paths. |
| `App.tsx` becomes an unmaintainable composition dump. | Medium | High | Create focused composer components and selector/workflow modules; leave `App.tsx` as top-level wiring. |
| "Any" becomes a hidden pseudo-domain profession. | Medium | High | Bind "Any" to app-layer unset/filtering semantics and test template export blocking. |
| Build-set or party restored states conflict with the single-build first-screen goal. | Medium | High | Composer binds to the selected loadout only and keeps document context in secondary tools. |
| Empty selected party slots accidentally persist placeholder builds. | Low-Medium | Critical | Reuse SPRINT-018 zero-active-entry invariant and add app-shell tests for empty slot boot. |
| Inline template input overwrites valid current state while a user types invalid text. | Medium | High | Keep import draft separate from derived export text and apply only through transactional import. |
| One-elite enforcement clears unresolved raw imported slots incorrectly. | Medium | High | Enforce only for resolved catalog elite facts and keep unproven slots in validation. |
| Catalog-informed placement leaks catalog dependencies into the reducer or domain. | Medium | High | Use a pure app workflow planner and reducer-applied mutations; keep domain and reducer catalog-free. |
| Skill catalog becomes another dense advanced browser instead of a focused right panel. | Medium | Medium | Default to profession scope, attribute groups, compact rows, search, and a small advanced disclosure only if needed. |
| Visual polish pulls in unapproved Guild Wars icon binaries or remote URLs. | Medium | Critical | Gate BW-1808 on source policy; keep catalog-boundary tests strict; use placeholders when approval is absent. |
| Long names, validation messages, or dynamic costs overlap compact controls. | Medium | High | Define stable grid tracks, min/max widths, overflow wrapping, and responsive tests/smoke review. |
| Accessibility regresses with custom pickers and drag interactions. | Medium | High | Require keyboard parity, focus states, labels, Escape/cancel paths, and Testing Library assertions for core workflows. |
| Scope expands into deferred equipment, party, guide, or analysis work. | Medium | High | Keep deferred use cases in Overview, DoD, docs, and closeout; reject new primary surfaces in EPIC-18. |

## Security

- Treat template input, share fragments, local storage, backups, transfers, drag payloads, build
  names, labels, notes, diagnostics, and catalog-adapted values as untrusted.
- Keep all imported template changes transactional. Parse, decode, resolve, and plan state changes
  before replacing the active editor.
- Render user-authored and diagnostic text as escaped React text. Do not add
  `dangerouslySetInnerHTML`, HTML/Markdown execution, dynamic imports, `eval`, or URL
  dereferencing from user input.
- Keep drag payload parsing strict to `BUILD_WARS_DRAG_MIME`, safe integers, known kinds, and
  bounded slot indexes. Invalid payloads are no-ops.
- Do not trust `dataTransfer` payloads to carry catalog truth. Catalog-derived placement facts come
  from current `AppCatalogViews`.
- Bound build names, inline template text, status messages, rendered diagnostics, group lists, and
  any new transient UI arrays.
- Clipboard writes are best-effort. Failure leaves selectable text and never triggers hidden
  network or storage behavior.
- Do not fetch, hot-link, preload, or render remote wiki media. Source URLs remain attribution
  references, not runtime fetch targets.
- Do not add source snapshots, QA artifacts, manifests, Python scripts, or wiki API URLs to runtime
  app imports.
- If local/static icon assets are approved, route them through explicit app-owned descriptors and
  test that no remote URL or unreviewed path reaches rendering primitives.
- Preserve local-library write-blocking, dirty guards, restore previews, transfer previews, revision
  checks, and dangerous-key rejection in existing JSON workflows.
- Add no backend, secret, account identifier, telemetry, service worker, collaboration channel,
  hosted share, or new runtime dependency.

## Dependencies

- EPIC-03 and EPIC-04 promoted profession, attribute, and skill catalogs through
  `src/app/catalogs.ts`.
- EPIC-05 and EPIC-06 template compatibility and validation behavior through
  `src/template-compatibility` and `src/domain`.
- SPRINT-009 core build editor: app catalog boundary, raw template overlay, profession/mode
  controls, attributes, skill browser, skill bar, template dialogs, validation, accessibility, and
  responsive integration.
- SPRINT-010 local library and sharing: `build-wars:v1`, autosave, saved records, dirty guards,
  backup/restore, share URLs, storage diagnostics, and selected-loadout omission warnings.
- SPRINT-014 and SPRINT-015 semantic equipment contracts, editor, validation, persistence, and
  selected-loadout equipment omission warnings.
- SPRINT-016 title-rank controls, defaults, validation, persistence, and selected-loadout title
  omission warnings.
- SPRINT-017 neutral build sets: one active editor plus inactive snapshots, mixed saved documents,
  comparison, transfer, aggregate validation, backup/restore, and selected-loadout sharing.
- SPRINT-018 party annotations: empty selected slots, occupied member selection, native party JSON,
  multi-code copy, party validation, and selected-member sharing boundaries.
- `compendium/build-composer-use-case.md` as durable product context.
- `compendium/source-policy.md` and `compendium/visual-prior-art.md` for media and visual
  constraints.
- Existing React, TypeScript, Vite, Vitest, Testing Library, ESLint, Prettier, npm, Python, and
  ticket-burn tooling.

## Open Questions

1. Does BW-1808 have an explicit source-policy approval record for local/static profession and skill
   icon binaries, or must execution use placeholders and product-owned glyphs only?
2. Should "Any" remain exactly the UI label for `null`, or does the product need a separate
   transient "unset" versus "browse all" state in the picker?
3. For restored build sets and parties, should the first viewport show a small document-context
   strip above the composer, inside secondary tools, or only as a collapsed affordance?
4. Should inline template import happen only through an explicit import button, or should paste
   attempt import immediately after validating a full code? The safer default is explicit apply.
5. Which existing secondary surfaces must remain visible in the first viewport on desktop:
   validation summary, share controls, library save controls, or document context?
6. Should the right-panel skills catalog keep any manual filters beyond search and group collapse
   for the first release, or should advanced filters move entirely behind a disclosure?
7. Should one-elite placement report a transient message naming the removed elite slot, or is the
   visible bar mutation sufficient?
8. If a dropped catalog skill replaces a slot containing an unresolved raw overlay, should the
   transient message explicitly mention that imported raw slot evidence was cleared?
9. Do cost glyphs need to be product-owned CSS/text symbols for this sprint, or can approved local
   source-derived resource icons be included under the same asset decision as profession/skill
   icons?
10. What manual smoke viewport widths should execution record for closeout beyond the automated
    component tests?
