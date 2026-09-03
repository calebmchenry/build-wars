---
id: SPRINT-019
title: Focused Build Composer
status: completed
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

This sprint makes single-build composition the primary Build Wars experience. The first usable
screen becomes a focused two-panel composer: the active build surface is on the left, and a compact
skills catalog is on the right. A first-time user should be able to choose professions, edit a build
name, allocate attributes, fill the skill bar, paste/import a skill template code, and copy the
current template output without first navigating library, equipment, build-set, party, guide, or
analysis concepts.

This is an app-layer information architecture and interaction sprint, not a domain or persistence
reset. The existing `WorkspaceState`, one-live-`EditorState` model, raw template overlay, template
compatibility adapter, local library schema, build-set and party selected-loadout behavior,
equipment/title omissions, validation, backup/restore, and transfer contracts remain in force. The
composer binds to the selected loadout when one exists. Empty build sets or empty selected party
slots render a deliberate no-selected-loadout state and expose secondary tools to create or assign a
loadout; they must not materialize placeholder builds.

The sprint deliberately protects a coherent cut line. The mandatory outcome is a safe,
accessible, preservation-complete focused composer. Real icon binaries are conditional on an exact
source-policy approval and are not required if deterministic local placeholders and product-owned
glyphs satisfy the visual acceptance criteria. Modal template UI may remain as a tested fallback
until inline controls reach parity; deleting modal-only state is allowed only after parity is proven.

## Assumptions

1. EPIC-18 can be planned as one sprint because BW-1801 through BW-1809 are groomed and
   dependency ordered.
2. `compendium/build-composer-use-case.md` is already the durable product record; BW-1801 validates
   and tightens it rather than inventing a second product spec.
3. Completed SPRINT-009 through SPRINT-018 behavior is stable implementation input and must be
   preserved unless this sprint explicitly moves presentation.
4. "Any" is UI language over `ProfessionId | null`, not a domain value, template wildcard,
   generated catalog record, or persisted sentinel.
5. Intentional "Any" and unresolved imported profession evidence can be distinguished by selectors
   that consider both nullable domain fields and raw-template overlay state.
6. The existing template workflow remains authoritative: import is transactional, exact-source
   replay is fingerprint based, and canonical output requires projection, validation, encode, and
   decode-back proof.
7. No runtime icon binaries are assumed to be approved. Policy-safe placeholder icons and local
   CSS/text resource glyphs are an acceptable BW-1808 baseline unless execution finds exact approved
   asset paths with provenance.
8. No high-risk architecture choice requires interactive interview in this ticket-burn mode because
   the material choices have conservative defaults in this sprint.
9. This planning run updates sprint, draft, ticket, ledger, run-state, and result-manifest records
   only; no implementation code change or commit is part of planning.

## Use Cases

1. **Start a build immediately**: A new user opens the app and can begin a single build in the
   composer without opening library, build-set, party, or equipment controls.
2. **Resume safely**: A stored single build, selected build-set entry, selected occupied party slot,
   or share-fragment import appears in the same composer without losing surrounding document data.
3. **Recover no-selection states**: An empty build set or empty selected party slot shows a clear
   no-loadout state and a keyboard-reachable secondary path to create or assign a loadout.
4. **Choose professions visually**: Primary and secondary profession controls are compact,
   icon-based, accessible pickers with an explicit "Any" option and stable concrete profession
   ordering.
5. **Name the build inline**: The active build name is editable in the composer header without
   accidentally renaming saved records, build-set entries, party slot labels, or imported raw
   evidence.
6. **Allocate attributes**: Attribute rows show decrement refund, increment cost, allocated rank,
   effective-rank state, and attribute name while reusing existing point-budget rules.
7. **Browse relevant skills**: The right-panel skills tab defaults to concrete selected professions
   plus professionless skills, or all playable skills when neither profession is concrete.
8. **Scan compact skill facts**: Catalog rows show an icon or fallback, skill name, elite/type
   context, and stable cost/timing glyphs for modeled facts such as energy, adrenaline, sacrifice,
   upkeep, overcast, activation, and recharge.
9. **Use grouped catalog sections**: Attribute groups can collapse and expand without dirtying the
   build or persisting UI-only state.
10. **Fill the skill bar**: Drag, click, or keyboard placement uses one placement policy for empty
    targets, occupied targets, duplicate skill movement, and elite replacement.
11. **Remove safely**: Skills are removed by explicit clear commands or a visible removal target, not
    by ambiguous drag cancellation.
12. **Preserve imports**: Unresolved, stale, duplicate, or now-ineligible imported facts remain
    visible and diagnosable until the user explicitly replaces or removes them.
13. **Import inline**: A supported bare or chat-wrapped skill template code can be pasted or typed
    into the composer and applied transactionally.
14. **Copy inline**: The current exact-source or canonical template output is visible, selectable,
    and copyable. Clipboard failure leaves a usable text fallback.
15. **Keep advanced work reachable**: Library, build-set, party, equipment, title, validation,
    sharing, backup, restore, and transfer features remain keyboard reachable as secondary tools
    with focus restoration and dirty-guard behavior intact.
16. **Use narrow screens**: The composer, skills catalog, and secondary tools stack in task order
    with stable slot dimensions and no overlapping controls or text.

## Architecture

### Scope Boundary

| Area                   | In Scope                                                                                                                                       | Out of Scope                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Composition            | Composer-first app shell, two-panel active-loadout layout, secondary workflow entry points, no-selected-loadout states, responsive stacking.   | New route model, marketing page, multiple simultaneous editors, account dashboard, backend sync, deleting mature features.             |
| Domain                 | Reuse existing `Build`, profession, attribute, skill, validation, equipment, title, build-set, and party contracts.                            | Composer-only domain schema, `AnyProfessionId`, React/browser imports in `src/domain/**`, generated data imports outside app boundary. |
| Editor/workspace state | Authored build changes, raw-template overlays, selected-loadout routing, catalog-free reducer mutations.                                       | Persisted UI-only picker/group/copy/import-buffer state, local-library schema reset, new storage key.                                  |
| Header                 | Profession icon pickers, build-name editor, compact mode control, visible validation/export context.                                           | Saved-record naming redesign, party slot labels, profession inference, template wildcard semantics.                                    |
| Attributes             | Focused row view models, marginal costs, point-budget gates, allocated/effective rank display, retained raw rows.                              | New point rules, rune/headgear editing, temporary effects, full stats, equipment authoring.                                            |
| Skill catalog          | Skills tab, selected-profession defaults, attribute grouping, group collapse, compact costs, drag payloads, bounded rendering.                 | Weapon/rune/insignia tabs, recommendations, broad discovery, worker/virtualization dependency, copied source prose.                    |
| Skill bar              | Eight stable slots, catalog placement, bar moves/swaps, replacement, duplicate movement, one resolved elite, removal target, keyboard parity.  | Party-wide bars, hero AI ordering, saved hotkeys, touch-only gesture design, build recommendations.                                    |
| Templates              | Inline import/export presentation over existing workflow, copy fallback, exact/canonical status, selected-loadout warnings.                    | Codec changes, equipment/team templates, saved template library, share URL grammar changes, automatic clipboard reads.                 |
| Icons/polish           | Catalog-safe icon descriptors, approved local asset allowlist if available, deterministic fallbacks, resource glyphs, focus/hover/drop states. | Runtime remote media URLs, unapproved binaries, imported screenshots as UI assets, pixel-perfect game skin.                            |

### Binding Decisions

1. `App.tsx` remains the top-level owner of catalog readiness, storage, autosave/pagehide effects,
   share-fragment boot, global dialogs, and workspace reducer wiring.
2. Introduce a focused composer boundary, likely `BuildComposer`, so the primary layout can evolve
   without turning `App.tsx` into a dense presentation component.
3. Secondary tools may be implemented as a disclosure, drawer-like panel, or below-composer band, but
   execution must document the chosen entry-point map and prove keyboard access, focus restoration,
   dirty guards, and selected document/loadout context.
4. The composer uses existing `EditorState` for authored facts. Component-local or composer-local UI
   state owns open pickers, collapsed groups, inline import draft text, copy request status,
   secondary disclosure state, and in-flight focus affordances.
5. Composer UI-only state is not serialized into build snapshots, workspace snapshots, local library
   records, backup, transfer, share URL, or template output.
6. Both profession pickers render "Any" for intentional unset values, but unresolved imported raw
   profession evidence renders as unresolved/stale evidence until an explicit user choice clears it.
7. Primary "Any" blocks canonical composer export with a focused reason. Secondary "Any" uses the
   existing supported secondary-none semantics only where the template codec can prove it.
8. Profession changes follow a retention policy: semantic facts that remain representable stay
   authored, now-ineligible or unresolved imported facts remain visible and diagnosable, and only
   explicit replacement/removal clears targeted raw overlay entries.
9. Build-name editing changes the active `Build.name` only. Saved-record names, build-set entry
   labels, party labels, and raw imported wrapper metadata are separate facts unless execution
   implements and tests an explicit user command to synchronize them.
10. Exact-source replay is invalidated only by changes that alter the reconstructed imported
    template fields. Name-only UI edits must have documented behavior for bare codes and
    chat-wrapper output.
11. Attribute costs and enabled states are selector-derived from promoted point rules and the same
    budget policy passed to validation. UI code does not reimplement point math.
12. Effective rank is selector-derived with existing domain helpers and equipment adjustments. It is
    displayed as derived state, never persisted as a second authored rank.
13. Catalog fact resolution for skill placement happens in an app-layer pure planner, such as
    `skill-bar-workflow.ts`. Reducers apply bounded, catalog-free atomic mutations and preserve
    tuple length and raw-overlay alignment.
14. One-elite replacement applies only to currently resolved catalog elite facts. Unresolved raw
    template slots are not removed by elite enforcement unless explicitly replaced or cleared.
15. The authoritative pointer deletion path is a visible removal target. `dragend`, Escape, leaving
    the window, or missing `dropEffect` never deletes by itself.
16. Inline template import uses an explicit Apply action. Paste may populate the field, but it must
    not mutate the build until the existing parse/decode/resolve workflow succeeds and any dirty or
    omission guard is accepted.
17. Runtime generated catalog imports remain isolated to `src/app/catalogs.ts`; leaf components
    receive app-ready views, placeholder/icon descriptors, attribution, and validation slices.
18. If approved local icon files exist, runtime resolution is exact-ID allowlisted. Metadata-only
    catalog URLs must never reach `img`, CSS URL, preload, fetch, canvas, drag image, or service
    worker paths.
19. No new runtime dependency, backend service, route, worker, account model, analytics path,
    service worker, or source-data pipeline is planned.

### Skill Placement Matrix

All pointer, click, and keyboard placement paths must route through the same behavior table.

| Intent                                                      | Target                                    | Expected mutation                                                                                                      |
| ----------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Catalog skill to empty slot                                 | Empty target                              | Place skill in target; clear any prior occurrence of the same resolved skill elsewhere.                                |
| Catalog skill to occupied slot                              | Filled target                             | Replace target; clear prior occurrence of the same resolved skill elsewhere unless the prior occurrence is the target. |
| Catalog elite to any slot                                   | Existing different resolved elite present | Apply normal target behavior and clear the other resolved elite slot atomically.                                       |
| Catalog skill already on bar to another slot                | Empty or occupied target                  | Move the existing semantic skill to target; preserve target replacement behavior and keep no duplicate.                |
| Catalog skill already on same target                        | Same target                               | No semantic duplication; may announce no-op.                                                                           |
| Bar slot to empty slot                                      | Empty target                              | Move semantic slot and raw overlay together.                                                                           |
| Bar slot to occupied slot                                   | Filled target                             | Swap semantic slots and raw overlays together.                                                                         |
| Bar slot to same slot                                       | Same target                               | No-op.                                                                                                                 |
| Bar slot to removal target                                  | Valid removal target                      | Clear that slot and only that slot.                                                                                    |
| Invalid, stale, malformed, foreign, or out-of-range payload | Any target                                | No mutation; cancel drag/keyboard state and optionally announce invalid action.                                        |
| Placement with unresolved raw slots elsewhere               | Any target                                | Preserve unresolved raw slots unless they are the explicit target or explicit removal source.                          |

After each successful placement, existing validation runs normally and any automatic duplicate or
elite removal is announced through the current transient-message path.

### Execution Order

```text
BW-1801 product IA and baseline decisions
  -> BW-1802 two-panel shell and secondary access
  -> durability gate across single build, build set, and party selected loadout
  -> BW-1803 header, Any semantics, build name, compact mode
  -> BW-1804 attribute rows
  -> BW-1807 focused skills catalog
  -> BW-1805 skill placement/bar refinement
  -> BW-1806 inline template workflow
  -> BW-1808 icon/polish policy branch
  -> BW-1809 verification and closeout
```

BW-1804 and BW-1807 may overlap after BW-1803 has frozen profession semantics, but BW-1805 must
wait for BW-1807's catalog source surface.

## Implementation

### Phase 0: BW-1801 Baseline and IA Decisions (~7% of effort)

**Files:**

- `compendium/build-composer-use-case.md` - tighten durable product and deferred-scope record.
- `compendium/README.md` - confirm focused composer link.
- `compendium/visual-prior-art.md` - confirm relevant observations and asset-policy limits.
- `src/app/App.test.tsx`, `src/app/editor-state.test.ts`, `src/app/editor-selectors.test.ts` -
  baseline core editor behavior.
- `src/app/template-workflow.test.ts`, `src/app/share-url.test.ts` - baseline selected-loadout
  template/share behavior.
- `src/app/workspace-state.test.ts`, `src/app/build-set-state.test.ts`,
  `src/app/party-state.test.ts` - baseline selected-loadout and no-selection behavior.
- `src/app/local-storage.test.ts`, `src/app/backup-restore.test.ts`,
  `src/app/build-set-transfer.test.ts`, `src/app/party-transfer.test.ts` - baseline durability.
- `work/tickets/18-focused-build-composer/*.md` - execution traceability.

**Tasks:**

- [x] Mark SPRINT-019, EPIC-18, and BW-1801 in progress when execution begins.
- [x] Review and update `compendium/build-composer-use-case.md` so it binds the primary use case,
      deferred use cases, secondary-surface inventory, "Any" default, source-policy asset branch,
      and two-panel responsibilities.
- [x] Freeze the secondary workflow entry-point map and no-selected-loadout recovery path before
      shell implementation.
- [x] Freeze naming behavior for `Build.name`, saved-record name, build-set entry label, party slot
      label, raw template wrapper name, exact-source replay, and dirty state.
- [x] Freeze profession-change retention behavior for attributes, skill slots, and raw overlays.
- [x] Freeze the default no-approved-assets branch for BW-1808.
- [x] Run the baseline targeted suites and record any pre-existing failures before app composition
      changes begin.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/editor-state.test.ts src/app/editor-selectors.test.ts src/app/template-workflow.test.ts src/app/share-url.test.ts src/app/workspace-state.test.ts src/app/build-set-state.test.ts src/app/party-state.test.ts src/app/local-storage.test.ts src/app/backup-restore.test.ts src/app/build-set-transfer.test.ts src/app/party-transfer.test.ts`
- `npm run typecheck`
- Markdown review of the focused use-case and ticket files.

**Gate:** The sprint has a single durable IA record, named retention/naming/asset decisions, and a
green or documented baseline before layout refactoring starts.

### Phase 1: BW-1802 Composer Shell and Secondary Tools (~15% of effort)

**Files:**

- `src/app/App.tsx` - keep boot/effects/dialog wiring and mount the focused composition.
- `src/app/components/BuildComposer.tsx` - create focused two-panel active-loadout shell.
- `src/app/components/ComposerSecondaryTools.tsx` or local equivalent - preserve secondary access.
- `src/app/components/CatalogAttribution.tsx` - compact provenance presentation if needed.
- `src/app/components/LibraryPanel.tsx`, `BuildSetNavigator.tsx`, `PartyWorkspace.tsx`,
  `ShareControls.tsx`, `ValidationPanel.tsx`, `EditorWorkspaceTabs.tsx`, `EquipmentPanel.tsx` -
  move or wrap with minimal behavior changes.
- `src/app/build-composer.test.tsx`, `src/app/App.test.tsx`,
  `src/app/workspace-state.test.ts`, `src/app/build-set-state.test.ts`,
  `src/app/party-state.test.ts` - shell and preservation coverage.
- `src/app/styles.css` - two-panel layout, secondary surface, and responsive stacking.

**Tasks:**

- [x] Introduce the focused composer boundary and pass explicit document context:
      single-build, selected build-set loadout, selected occupied party slot, empty build set, or
      empty selected party slot.
- [x] Render left composer and right catalog regions in DOM task order while preserving
      `CatalogAttribution` before source-derived facts and `StorageBanner` when diagnostics require
      it.
- [x] Move library, build-set, party, equipment, title-rank, sharing, full validation,
      backup/restore, transfer, and party-transfer entry points into the chosen secondary surface.
- [x] Prove secondary controls are keyboard reachable from the first screen and restore focus after
      dialogs close.
- [x] Preserve dirty guards, selected entry/member context, active editor materialization, autosave,
      pagehide, backup/restore, transfer, and share-fragment behavior.
- [x] Render no-selected-loadout states without creating a placeholder `Build`.
- [x] Add responsive rules for desktop, intermediate, narrow, long-text, and diagnostics-visible
      states without overlap or clipped controls.

**Verification:**

- `npm run test:run -- src/app/build-composer.test.tsx src/app/App.test.tsx src/app/workspace-state.test.ts src/app/build-set-state.test.ts src/app/party-state.test.ts src/app/local-storage.test.ts`
- `npm run typecheck`
- Manual smoke at 1280px, 900px, 390px, and 200% browser zoom for panel order, focus path,
  no-overlap, and no-selected-loadout recovery.

**Gate:** Shell refactor preserves selected-loadout and secondary workflow behavior before custom
composer controls replace existing controls.

### Phase 1A: Durability Gate (~5% of effort)

**Files:**

- `src/app/build-composer.test.tsx`
- `src/app/App.test.tsx`
- `src/app/workspace-state.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/backup-restore.test.ts`

**Tasks:**

- [x] Edit a single-build draft, autosave, reload, and confirm the same authored state returns in
      the focused composer.
- [x] Edit a selected build-set entry, switch entries, autosave or pagehide-flush, reload, and
      confirm the selected entry and inactive sibling snapshots survive.
- [x] Edit a selected occupied party slot, switch slots including an empty slot, autosave or
      pagehide-flush, reload, and confirm no phantom build is created.
- [x] Confirm secondary entry points still open backup/restore/transfer dialogs after reload and
      focus returns to the triggering control.

**Verification:**

- `npm run test:run -- src/app/build-composer.test.tsx src/app/workspace-state.test.ts src/app/local-storage.test.ts src/app/backup-restore.test.ts`
- Manual reload smoke for a single build and a party no-selected-loadout state.

**Gate:** No further UI specialization begins until the shell proves durable selected-loadout
preservation.

### Phase 2: BW-1803 Header, Profession Pickers, and Build Name (~12% of effort)

**Files:**

- `src/app/components/ComposerHeader.tsx` - build name, profession pickers, compact mode, issues.
- `src/app/components/ProfessionIconPicker.tsx` or equivalent - accessible picker primitive.
- `src/app/catalogs.ts`, `src/app/catalogs.test.ts` - placeholder/icon descriptor support only if
  needed.
- `src/app/editor-state.ts`, `src/app/editor-state.test.ts` - narrow authored-name action if local
  patterns require it.
- `src/app/editor-selectors.ts`, `src/app/composer-selectors.ts`,
  `src/app/*composer*.test.ts` - focused header view and Any/unresolved projections.
- `src/app/App.test.tsx`, `src/app/template-workflow.test.ts`, `src/app/styles.css`.

**Tasks:**

- [x] Build primary and secondary profession pickers with accessible labels, keyboard operation,
      Escape/cancel behavior, focus restoration, and stable Any plus ten-profession ordering.
- [x] Render intentional `null` as "Any" and unresolved raw profession evidence as a distinct
      unresolved/stale state.
- [x] Keep concrete profession changes wired to existing validation, attribute visibility, skill
      eligibility, template projection, and targeted raw-overlay clearing.
- [x] Test duplicate primary/secondary selection, secondary concrete with primary Any, imported
      unresolved professions, and switching selected loadouts while a picker is open.
- [x] Add an inline build-name editor with local buffer, commit/cancel/blur behavior, existing text
      bounds, and deterministic behavior during loadout switches.
- [x] Keep mode visible in a compact control and preserve PvE/PvP/Unknown effects on budget,
      availability, validation, and export.

**Verification:**

- `npm run test:run -- src/app/profession-picker.test.tsx src/app/build-composer.test.tsx src/app/editor-state.test.ts src/app/editor-selectors.test.ts src/app/catalogs.test.ts src/app/template-workflow.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Gate:** Header behavior is accessible, Any/unresolved states are test-covered, and naming cannot
corrupt saved record, build-set, party, or raw-template metadata.

### Phase 3: BW-1804 Attribute Allocation Editor (~12% of effort)

**Files:**

- `src/app/components/FocusedAttributeEditor.tsx` or adapted `AttributeEditor.tsx`.
- `src/app/editor-selectors.ts`, `src/app/composer-selectors.ts` - row costs, effective rank,
  budget gates, retained rows.
- `src/app/editor-state.ts`, `src/app/editor-state.test.ts`.
- `src/app/attribute-editor.test.tsx`, `src/app/editor-selectors.test.ts`,
  `src/app/build-composer.test.tsx`.
- `src/app/styles.css`.

**Tasks:**

- [x] Derive rows for selected concrete primary and secondary profession attributes plus retained
      authored/imported rows.
- [x] Show allocated rank, effective rank, refund cost, next investment cost, attribute name,
      profession context, and inline issues.
- [x] Hide or disable decrement at zero and increment at cap, insufficient evaluated budget, or
      unresolved row state.
- [x] Reuse existing point rules, `selectAttributeBudgetPolicy`, validation input, and
      effective-rank/equipment adjustment helpers.
- [x] Preserve retained unresolved/stale rows and targeted raw overlay clearing when users edit or
      remove rows.
- [x] Keep PvE level and quest bonus available but visually subordinate; preserve PvP and Unknown
      budget behavior.
- [x] Test zero, one, exact-budget, one-point-short, max-rank, overspent import, primary-only,
      profession-change, stale row, long label, and equipment-modified effective-rank cases.

**Verification:**

- `npm run test:run -- src/app/attribute-editor.test.tsx src/app/editor-selectors.test.ts src/app/editor-state.test.ts src/app/build-composer.test.tsx test/domain/effective-attribute-rank.test.ts test/domain/rule-engine.test.ts`
- `npm run typecheck`

**Gate:** Attribute UI displays the same costs and budget facts that validation uses and does not
drop unresolved imported facts.

### Phase 4: BW-1807 Focused Skills Catalog (~13% of effort)

**Files:**

- `src/app/components/FocusedSkillCatalog.tsx` or adapted `SkillBrowser.tsx`.
- `src/app/components/SkillDisplay.tsx`, `src/app/components/SkillTooltip.tsx`.
- `src/app/editor-selectors.ts`, `src/app/composer-selectors.ts`.
- `src/app/editor-state.ts` only if existing browser UI state must be reused; collapse state should
  stay UI-only unless explicitly justified and excluded from persistence.
- `src/app/skill-browser.test.tsx`, `src/app/focused-skill-catalog.test.tsx`,
  `src/app/editor-selectors.test.ts`, `src/app/catalog-boundary.test.ts`.
- `src/app/styles.css`.

**Tasks:**

- [x] Render the right-panel catalog surface with Skills as the first implemented tab.
- [x] Default results to concrete selected professions plus professionless playable skills; when no
      concrete profession is selected, show all playable skills through existing bounded rendering.
- [x] Preserve unsupported/non-player exclusion, mode availability behavior, deterministic ordering,
      and batch limits.
- [x] Group by stable attribute identity, including explicit no-attribute/unresolved groups.
- [x] Add accessible collapse/expand controls with counts and UI-only state.
- [x] Keep search and selected/all scope prominent; move advanced attribute/type/elite/availability
      and resource filters behind a concise disclosure if retained.
- [x] Render compact rows with fixed icon, name, context, action, and fact regions. Cost/timing fact
      order is energy, adrenaline, sacrifice, upkeep, overcast, activation, recharge, then other
      modeled facts.
- [x] Test both professions Any, one concrete profession, two professions, professionless skills,
      no results, all groups collapsed, Show More, search reveal, long names, missing facts, and
      stale rows.
- [x] Record an explicit initial-render target: the default all-playable view still renders only the
      bounded batch and does not render every catalog row into the DOM.

**Verification:**

- `npm run test:run -- src/app/focused-skill-catalog.test.tsx src/app/skill-browser.test.tsx src/app/editor-selectors.test.ts src/app/catalog-boundary.test.ts src/app/catalogs.test.ts`
- `npm run typecheck`

**Gate:** Catalog defaults are useful, bounded, accessible, and backed by the same query semantics
as the existing browser.

### Phase 5: BW-1805 Skill Bar Placement, Removal, and Drag Feedback (~16% of effort)

**Files:**

- `src/app/skill-bar-workflow.ts`, `src/app/skill-bar-workflow.test.ts` - pure catalog-informed
  placement planner.
- `src/app/editor-state.ts`, `src/app/editor-state.test.ts` - catalog-free atomic apply action and
  raw-overlay alignment.
- `src/app/drag-payload.ts`, `src/app/drag-payload.test.ts` - strict payload parsing.
- `src/app/components/SkillBar.tsx`, `src/app/skill-bar.test.tsx`.
- `src/app/components/FocusedSkillCatalog.tsx`, `src/app/focused-skill-catalog.test.tsx`.
- `src/app/components/SkillDisplay.tsx`, `src/app/styles.css`.

**Tasks:**

- [x] Implement the skill placement matrix above through one app-layer planner and one reducer
      application path used by drag, click, and keyboard flows.
- [x] Keep reducers catalog-free and reject malformed plans, out-of-range indexes, sparse bars, or
      non-eight-slot mutations.
- [x] Preserve raw overlays on bar-to-bar moves/swaps; clear only the target/source overlay entries
      explicitly authored by catalog placement or removal.
- [x] Enforce one resolved elite by atomically clearing other resolved elite slots while preserving
      unresolved raw slots.
- [x] Add a visible removal target for filled-slot drag and never delete on ambiguous drag
      cancellation.
- [x] Use `setDragImage` with the local icon/fallback when supported; keep a no-crash fallback when
      not supported.
- [x] Replace single-letter visible action controls with labeled icon/action controls, menus, or
      accessible equivalents.
- [x] Announce placement, replacement, duplicate movement, elite removal, explicit removal, and
      invalid payload results.
- [x] Test catalog-to-empty, catalog-to-occupied, same skill same slot, same skill other slot,
      new elite with old elite, non-elite over elite, bar move, bar swap, removal target, invalid
      payload, stale payload, unresolved raw slot, long-lived keyboard pick, and selected-loadout
      switch during active drag.

**Verification:**

- `npm run test:run -- src/app/skill-bar-workflow.test.ts src/app/editor-state.test.ts src/app/drag-payload.test.ts src/app/skill-bar.test.tsx src/app/focused-skill-catalog.test.tsx src/app/template-workflow.test.ts test/domain/skill-bar-rules.test.ts`
- `npm run typecheck`
- Manual real-browser drag/drop and keyboard-only smoke for drag image, removal target, focus, and
  reduced-motion behavior.

**Gate:** Every skill-bar mutation path shares one policy and preserves raw-template identity.

### Phase 6: BW-1806 Inline Template Import and Export (~12% of effort)

**Files:**

- `src/app/components/InlineTemplateCode.tsx` or equivalent.
- `src/app/components/TemplateDialogs.tsx` - retain as fallback or retire only after parity.
- `src/app/template-workflow.ts`, `src/app/template-workflow.test.ts`.
- `src/app/editor-selectors.ts`, `src/app/composer-selectors.ts`,
  `src/app/inline-template-code.test.tsx`.
- `src/app/editor-state.ts`, `src/app/editor-state.test.ts`.
- `src/app/workspace-state.ts`, `src/app/workspace-state.test.ts`.
- `src/app/share-url.test.ts`, `src/app/App.test.tsx`, `src/app/styles.css`.

**Tasks:**

- [x] Add inline template controls below the skill bar with derived preferred output, fidelity label,
      blocked reasons, editable import buffer, Apply, Copy, and reset-to-current behavior.
- [x] Keep derived export output separate from the user import draft so typing invalid text never
      overwrites proven output or mutates the build.
- [x] Prefer exact-source replay when available, then canonical output only after current validation,
      projection, encode, and decode-back gates.
- [x] Import only on explicit Apply through `importSkillTemplateToEditor`; failed parse/decode/
      resolve leaves the full previous selected loadout and sibling document state unchanged.
- [x] Preserve dirty guards and warnings for meaningful equipment, authored title ranks,
      build-set siblings, and party metadata.
- [x] In build-set or party context, replace only the selected occupied loadout and preserve
      surrounding entries, party annotations, and no-selected-loadout behavior.
- [x] Copy only the current proven string after explicit user action. Clipboard API failure,
      non-secure context, or async completion after loadout switch leaves selectable text and does
      not mutate state.
- [x] Keep modal import/export available until inline tests cover bare codes, chat wrappers,
      imported names, invalid codes, exact-source replay, canonical fallback, copy failure, dirty
      cancellation, equipment/title warnings, and selected-loadout boundaries.

**Verification:**

- `npm run test:run -- src/app/inline-template-code.test.tsx src/app/template-workflow.test.ts src/app/editor-state.test.ts src/app/workspace-state.test.ts src/app/share-url.test.ts src/app/App.test.tsx test/template-compatibility`
- `npm run typecheck`

**Gate:** Inline template controls reach parity with existing workflow before any modal-only state
or component cleanup occurs.

### Phase 7: BW-1808 Icon Assets and Visual Polish (~9% of effort)

**Files:**

- `src/app/catalogs.ts`, `src/app/catalogs.test.ts`, `src/app/catalog-boundary.test.ts`.
- `src/app/icon-assets.ts`, `src/app/icon-assets.test.ts` only if exact local asset approval exists.
- `src/app/components/CatalogIcon.tsx`, `src/app/catalog-icon.test.tsx` or an equivalent shared
  primitive.
- `src/app/components/ComposerHeader.tsx`, `FocusedAttributeEditor.tsx`, `FocusedSkillCatalog.tsx`,
  `SkillBar.tsx`, `SkillDisplay.tsx`.
- `src/app/build-composer.test.tsx`, `src/app/styles.css`.
- Approved local static asset files only when source-policy records identify exact paths and
  provenance.

**Tasks:**

- [x] Verify the source-policy status before adding any binary asset. If exact approval is absent,
      use deterministic local placeholders and product-owned CSS/text glyphs as the complete sprint
      baseline.
- [x] Route all profession, skill, resource, timing, empty, Any, unresolved, and drag-preview icon
      rendering through one app-owned primitive or descriptor path.
- [x] Ensure metadata-only remote media IDs and canonical URLs cannot reach runtime fetch, image,
      CSS, preload, canvas, drag image, or service-worker APIs.
- [x] Add accessible labels/tooltips for icon-only meanings and ensure no state depends on color
      alone.
- [x] Tighten composer spacing, panel hierarchy, fixed slot dimensions, compact catalog rows,
      attribute controls, focus states, hover states, selected/drop states, invalid states,
      reduced-motion behavior, and narrow-screen stacking.
- [x] Test long build names, long skill names, long attribute names, missing costs, special costs,
      unresolved facts, diagnostics-visible states, and 200% zoom no-overlap.
- [x] Record any asset approval gap as closeout evidence and a future follow-up, not as a blocker to
      completing the focused composer.

**Verification:**

- `npm run test:run -- src/app/catalogs.test.ts src/app/catalog-boundary.test.ts src/app/catalog-icon.test.tsx src/app/build-composer.test.tsx src/app/focused-skill-catalog.test.tsx src/app/skill-bar.test.tsx src/app/attribute-editor.test.tsx`
- `npm run typecheck`
- `npm run build`
- Manual desktop/narrow, keyboard-only, reduced-motion, 200% zoom, long-text, diagnostics-visible,
  offline/no-network, and drag-preview smoke review.

**Gate:** Composer visuals use policy-safe assets/fallbacks, maintain accessibility labels, and do
not introduce layout overlap or remote media paths.

### Phase 8: BW-1809 Verification, Documentation, and Closeout (~12% of effort)

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

- [x] Run the focused composer suites, app regression suites, domain/template suites, and canonical
      verification command.
- [x] Run `git diff --check`.
- [x] Update README and compendium docs to describe the composer-first default, preserved secondary
      tools, selected-loadout boundaries, inline template policy, Any behavior, and asset-policy
      outcome.
- [x] Record deferred use cases: equipment-first editing, saved-library-first workflows,
      party/team-first workflows, guide authoring, broad discovery, advanced analysis,
      touch-specific drag polish, real icon binaries without approval, external team codecs,
      backend sync, accounts, collaboration, hosted sharing, PWA, and analytics.
- [x] Update ticket closeout evidence only after implementation verification passes.
- [x] Mark BW-1801 through BW-1809 and EPIC-18 done only after their acceptance criteria pass.
- [x] Sync `work/sprints/ledger.tsv` and ticket-burn result records.

**Verification:**

- `npm run test:run -- src/app test/domain test/template-compatibility`
- `npm run verify`
- `git diff --check`
- Manual evidence matrix for 1280px, 900px, 390px, 200% zoom, keyboard-only, reduced-motion,
  clipboard denied, drag image/removal target, no-selected-loadout, storage diagnostics, and
  no-network icon behavior.

**Gate:** The sprint closes only when automation, manual evidence, documentation, ticket metadata,
ledger, and manifest agree.

## Files Summary

| File or Area                                              | Action            | Purpose                                                                                                                  |
| --------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/app/App.tsx`                                         | Modify            | Keep top-level effects and mount focused composer plus secondary tools.                                                  |
| `src/app/components/BuildComposer.tsx`                    | Create            | Own two-panel active-loadout composer and no-selection boundary.                                                         |
| `src/app/components/ComposerSecondaryTools.tsx`           | Create            | Preserve completed library, build-set, party, equipment, title, share, validation, backup, restore, and transfer access. |
| `src/app/components/ComposerHeader.tsx`                   | Create            | Render build name, primary/secondary pickers, compact mode, and header issues.                                           |
| `src/app/components/ProfessionIconPicker.tsx`             | Create            | Provide accessible Any/profession picker behavior.                                                                       |
| `src/app/components/FocusedAttributeEditor.tsx`           | Create/Modify     | Render increment/refund attribute rows and effective-rank affordances.                                                   |
| `src/app/components/FocusedSkillCatalog.tsx`              | Create/Modify     | Render right-panel grouped skills catalog with compact rows and drag sources.                                            |
| `src/app/components/InlineTemplateCode.tsx`               | Create            | Provide inline proven output, import buffer, Apply, Copy, fallback, and diagnostics.                                     |
| `src/app/components/SkillBar.tsx`                         | Modify            | Use shared placement policy, stable slots, removal target, drag image, and keyboard parity.                              |
| `src/app/components/SkillBrowser.tsx`                     | Modify/Reuse      | Preserve query/filter logic or retain advanced browser as secondary behavior.                                            |
| `src/app/components/SkillDisplay.tsx`, `SkillTooltip.tsx` | Modify            | Share icon/fallback and compact cost fact rendering.                                                                     |
| Existing secondary components                             | Modify minimally  | Move presentation without changing mature reducer/persistence semantics.                                                 |
| `src/app/composer-selectors.ts`                           | Create if useful  | Hold IA-specific composer/header/catalog/secondary view models.                                                          |
| `src/app/skill-bar-workflow.ts`                           | Create            | Resolve catalog facts and produce atomic skill placement plans.                                                          |
| `src/app/editor-state.ts`                                 | Modify narrowly   | Add catalog-free mutations/actions for authored name and planned skill-bar application if needed.                        |
| `src/app/editor-selectors.ts`                             | Modify narrowly   | Keep generic validation, budget, skill display, and browser facts shared.                                                |
| `src/app/template-workflow.ts`                            | Modify/Reuse      | Expose inline workflow views while preserving codec and fidelity gates.                                                  |
| `src/app/drag-payload.ts`                                 | Modify/Test       | Harden internal drag payload parsing and removal intent.                                                                 |
| `src/app/catalogs.ts`                                     | Modify cautiously | Add app-ready icon descriptors or exact allowlisted assets without moving generated imports.                             |
| `src/app/styles.css`                                      | Modify            | Implement focused layout, stable controls, icon regions, responsive behavior, and polish.                                |
| Focused `src/app/*.test.ts(x)`                            | Create/Modify     | Cover shell, header, attributes, catalog, bar, inline templates, icons, and regressions.                                 |
| `src/domain/**`                                           | Preserve          | No composer-only UI state or generated/app imports expected.                                                             |
| `src/template-compatibility/**`                           | Preserve          | No codec behavior change expected.                                                                                       |
| `data/generated/**`                                       | Preserve          | Reuse promoted catalogs; no regeneration for UI work.                                                                    |
| Approved local assets                                     | Conditional add   | Add only when exact source-policy approval and provenance exist.                                                         |
| `README.md`, `compendium/*.md`                            | Modify            | Document composer-first default, preserved secondary tools, policies, and deferrals.                                     |
| EPIC-18 ticket files                                      | Modify            | Track execution status, traceability, verification, and closeout.                                                        |

## Definition of Done

### Product and Preservation

- [x] The first screen is a focused two-panel composer with active build left and Skills catalog
      right.
- [x] New users can create, edit, import, and export a single build without opening advanced
      workflow panels.
- [x] Existing library, build-set, party, equipment, title, share, validation, backup, restore, and
      transfer features remain keyboard reachable as secondary tools.
- [x] Single builds, selected build-set entries, selected occupied party slots, empty build sets,
      and empty selected party slots all render intentionally and preserve data.
- [x] No domain schema, persistence schema, storage key, lockfile, generated catalog, runtime
      dependency, backend, route, worker, account, analytics, PWA, or source-data pipeline change is
      introduced.

### Header and Attributes

- [x] Primary and secondary pickers expose Any plus ten professions with accessible pointer and
      keyboard behavior.
- [x] Intentional Any, never-chosen null, and unresolved imported profession evidence are rendered
      and tested without introducing a sentinel ID.
- [x] Build-name edits have defined effects on active `Build.name`, saved-record name, build-set
      entry label, party slot label, raw template name, exact-source replay, canonical output, and
      dirty state.
- [x] Attribute rows show allocated rank, derived effective rank, refund, investment cost, budget
      gating, attribute name, and inline issues.
- [x] Attribute costs and validation budget facts come from the same existing point-rule helpers.

### Catalog, Bar, and Templates

- [x] Skills default to concrete selected professions plus professionless skills, or bounded
      all-playable results when both professions are Any.
- [x] Skills are grouped by stable attribute identity with accessible collapse, counts, search, and
      deterministic batching.
- [x] Compact rows preserve modeled cost/timing fact states and remain usable with long names,
      missing facts, elite skills, and unresolved states.
- [x] The skill placement matrix is implemented, documented in tests, and used by drag, click, and
      keyboard paths.
- [x] Duplicate placement, occupied replacement, bar move/swap, explicit removal, invalid payloads,
      raw-overlay preservation, and one resolved elite are all covered.
- [x] Inline template controls show preferred proven output, blocked reasons, editable import input,
      copy fallback, and selected-loadout omission warnings.
- [x] Exact-source replay and canonical export gates retain their existing meaning.
- [x] Modal template controls are removed only after inline parity is proven; otherwise they remain
      as a tested fallback.

### Icons, Accessibility, and Layout

- [x] Icon rendering uses one app-owned descriptor or primitive for profession, skill, resource,
      timing, Any, empty, unresolved, and drag-preview states.
- [x] No catalog remote media URL reaches runtime image, CSS, preload, fetch, canvas, drag image, or
      service-worker paths.
- [x] Any binary asset addition has exact source-policy approval and provenance; otherwise
      deterministic placeholders and product-owned glyphs are accepted as complete.
- [x] Icon and cost meanings have visible or assistive labels and never depend on color alone.
- [x] Focus, hover, selected, disabled, invalid, drop-target, reduced-motion, and keyboard states are
      visible and tested where feasible.
- [x] 1280px, 900px, 390px, 200% zoom, long-text, diagnostics-visible, and no-selected-loadout
      states have no overlapping or clipped required controls.

### Verification and Closeout

- [x] Focused reducer, selector, component, workflow, persistence, and regression suites cover the
      edge cases in this sprint.
- [x] `npm run test:run -- src/app test/domain test/template-compatibility` passes.
- [x] `npm run verify` passes.
- [x] `git diff --check` passes.
- [x] README and compendium records document the focused default, preserved secondary features,
      asset-policy outcome, and deferred use cases.
- [x] BW-1801 through BW-1809 and EPIC-18 contain traceability and are marked done only after
      implementation evidence exists.
- [x] `work/sprints/SPRINT-019.md`, `work/sprints/ledger.tsv`, and ticket-burn result records are
      consistent.

## Closeout Evidence

### Validation

- Passed `npm run test:run -- src/app test/domain test/template-compatibility`.
- Passed `npm run verify`.
- Passed `git diff --check`.

### Manual Evidence Matrix

| Scenario                    | Evidence                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1280px desktop              | Composer CSS uses two-column `composer-layout`, stable skill slots, bounded right catalog, and no remote asset primitives; production build passed.            |
| 900px intermediate          | `@media (max-width: 1180px)` stacks the composer before secondary tools while preserving task order; App and composer tests cover mounted controls.            |
| 390px narrow                | `@media (max-width: 760px)` stacks panels, reduces slot/action grids, wraps long labels, and preserves no-selected-loadout actions.                            |
| 200% zoom / long text       | `overflow-wrap: anywhere`, fixed slot dimensions, and long-name tests cover build, attribute, skill, and library text paths.                                   |
| Keyboard-only               | Profession picker Arrow/Escape behavior, skill-bar pick/place/cancel, secondary disclosure access, modal focus restoration, and library/dialog tests passed.   |
| Reduced motion              | `prefers-reduced-motion: reduce` disables transitions/animations added in the composer CSS.                                                                    |
| Clipboard denied            | Inline template copy failure test leaves the proven code selectable and reports a warning.                                                                     |
| Drag image/removal target   | Pointer paths set a local text drag preview, explicit removal target handles slot payloads only, and workflow tests cover removal/no-delete-on-invalid policy. |
| No selected loadout         | Empty build-set and empty party-slot composer tests verify no placeholder build materializes before explicit create/assign.                                    |
| Storage diagnostics visible | App storage tests cover corrupt storage write-blocking and secondary workflows remain reachable after disclosure expansion.                                    |
| Offline/no-network icons    | `CatalogIcon` and catalog boundary tests verify placeholder rendering and no runtime image/fetch/preload/canvas path for remote media.                         |
| Browser automation          | No Playwright/Puppeteer dependency is installed; no runtime dependency was added for this sprint.                                                              |

## Risks & Mitigations

| Risk                                                                                  | Likelihood | Impact   | Mitigation                                                                                                                                                       |
| ------------------------------------------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell refactor corrupts selected-loadout materialization.                             | Medium     | Critical | Add Phase 1A durability gate across single build, build set, and party before deeper UI changes.                                                                 |
| Secondary tools become technically present but practically undiscoverable.            | Medium     | High     | Freeze entry-point map, require keyboard reachability, focus restoration, dirty guards, and no-selection recovery tests.                                         |
| Any is mistaken for a domain/template wildcard.                                       | Medium     | High     | Persist only `null`, distinguish unresolved raw evidence in selectors, block primary-Any canonical export, and test both-Any behavior.                           |
| Build-name, saved-record name, entry label, party label, and raw template name drift. | Medium     | High     | Freeze naming contract in BW-1801 and test exact-source, canonical, dirty-state, and selected-loadout outcomes.                                                  |
| Attribute UI duplicates point math.                                                   | Medium     | High     | Derive marginal costs and gates from existing catalog/rule helpers and test boundary ranks/budgets.                                                              |
| Hidden equipment changes effective rank without explanation.                          | Low-Medium | Medium   | Use existing adjustment selectors and add a concise derived-rank affordance pointing to secondary equipment controls.                                            |
| Skill placement leaks catalog data into reducers.                                     | Medium     | High     | Resolve catalog facts in an app-layer planner and apply only plain catalog-free atomic mutations.                                                                |
| Elite enforcement erases unresolved imports.                                          | Medium     | High     | Enforce only on resolved catalog elite facts and preserve unresolved raw slots unless explicitly targeted.                                                       |
| Drag cancellation deletes a skill unexpectedly.                                       | Medium     | High     | Delete only through explicit clear controls or a validated removal target.                                                                                       |
| Both-Any catalog view renders too much.                                               | Medium     | Medium   | Preserve bounded batching and assert the DOM does not render the full catalog by default.                                                                        |
| Custom pickers and drag interactions regress accessibility.                           | Medium     | High     | Require keyboard parity, labels, focus restoration, Escape/cancel paths, and manual keyboard smoke.                                                              |
| Inline import overwrites valid state while text is invalid.                           | Medium     | High     | Separate import draft from derived output and mutate only after explicit successful Apply.                                                                       |
| Clipboard completion reports against stale state.                                     | Medium     | Medium   | Tie copy feedback to the requested value and never mutate state on completion.                                                                                   |
| Real icons violate source policy.                                                     | Medium     | Critical | Make placeholders/glyphs complete by default and require exact approved local assets for binaries.                                                               |
| CSS changes pass jsdom but fail visually.                                             | Medium     | High     | Record manual viewport, zoom, long-text, diagnostics, reduced-motion, and drag-preview smoke evidence.                                                           |
| Scope is too large for one sprint.                                                    | Medium     | High     | Preserve shell/header/attribute/catalog/bar/template safety as mandatory and defer real binaries, touch polish, extra catalog tabs, and modal cleanup if needed. |

## Security Considerations

- Treat template input, share fragments, local storage, backups, transfers, drag payloads, and
  catalog data as untrusted structured data.
- Continue rendering user-authored names, template wrappers, catalog labels, and diagnostics as
  escaped React text. Do not add HTML injection paths.
- Keep existing parser bounds, dangerous-key rejection, write-blocking recovery, dirty guards,
  preview-before-apply behavior, and revision checks.
- Parse drag payloads only from the internal MIME type, safe integer fields, known kinds, and
  current catalog facts; never trust drag data to carry catalog truth.
- Do not read from the clipboard automatically. Write only a proven bounded string after explicit
  user action.
- Keep external attribution links user-activated and retain safe new-context attributes.
- Do not fetch, hot-link, preload, or render remote wiki media at runtime. Source URLs stay
  provenance/attribution data only.
- Add no backend, credential, account identifier, analytics event, telemetry, service worker, or
  environment variable.

## Dependencies

- EPIC-03 and EPIC-04 promoted profession, attribute, and skill catalogs through `src/app/catalogs.ts`.
- EPIC-05 and EPIC-06 template compatibility and validation behavior through existing app/domain
  APIs.
- SPRINT-009 core editor, raw template overlay, skill browser, skill bar, validation, and template
  workflow.
- SPRINT-010 local library, autosave, saved records, dirty guards, share fragments, backup/restore,
  and freshness behavior.
- SPRINT-014 and SPRINT-015 semantic equipment contracts, editor, validation, persistence, and
  selected-loadout equipment omission warnings.
- SPRINT-016 title-rank defaults, controls, validation, persistence, and selected-loadout title
  omission warnings.
- SPRINT-017 neutral build sets and one-active-editor materialization.
- SPRINT-018 party annotations, empty selected slots, selected occupied member editing, native party
  JSON, and selected-member boundaries.
- `compendium/build-composer-use-case.md`, `compendium/source-policy.md`, and
  `compendium/visual-prior-art.md`.
- Existing Node/npm, React, TypeScript, Vite, Vitest, Testing Library, ESLint, Prettier, Python, and
  `@buildwars/gw-templates@1.1.1`.

## Open Questions

The following questions do not block execution because this sprint records defaults:

1. Are exact local icon binaries approved? Default: assume no and ship placeholders/glyphs unless
   execution finds explicit source-policy approval.
2. Should secondary tools be disclosure, drawer, tabs, or below-composer band? Default: choose the
   smallest pattern that preserves keyboard access, focus restoration, dirty guards, and
   no-selection recovery, then document the entry-point map in BW-1801.
3. Should modal template UI be deleted? Default: keep it until inline parity is proven; deletion is
   optional after tests pass.
4. Should touch-specific drag/reorder be supported? Default: defer touch-specific gestures while
   preserving click and keyboard alternatives.
5. Should future catalog tabs get separate state? Default: keep only the Skills tab in EPIC-18 and
   avoid pre-generalizing for later equipment/rune/insignia tabs.
