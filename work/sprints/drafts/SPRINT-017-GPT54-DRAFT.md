---
id: SPRINT-017
title: Multi-Build Workspace
status: planned
source_target: BACKLOG
source_epic: EPIC-16
source_epic_path: work/tickets/16-heroes-and-henchmen/EPIC.md
tickets:
  - BW-1601
  - BW-1602
  - BW-1603
  - BW-1604
  - BW-1605
  - BW-1606
created: 2026-09-03
---

# Sprint 017: Multi-Build Workspace

## Overview

This sprint extends the current single-build local-first editor into a build-set workspace that can
hold several complete loadouts together without introducing party semantics, hero data, or a new
sharing format. The current single-build editor, saved-build library, share URL flow, template
import/export workflow, equipment editor, and title-rank behavior remain the compatibility baseline.

Implementation order is the main constraint. The sprint should freeze the framework-neutral build-set
contract and durable snapshot shape first, then extend workspace state and storage, then add
navigation and summaries, then land variant workflows, then add aggregate validation and export
boundaries, and only then close with docs and full verification. That sequencing minimizes
durability regressions and keeps the highest-risk state-mirroring work ahead of UI polish.

The sprint does not add hero or henchman catalogs, party slots, portrait rendering, AI behavior,
party legality, paw-ned2, team-template import/export, backend sync, account state, collaboration,
or a second full editor pane.

Binding execution defaults:

1. Create a new framework-neutral `BuildSet` contract under `src/domain`; do not reuse
   `src/domain/party.ts` as the base shape.
2. Keep exactly one active `EditorState`. Non-selected loadouts are stored as durable snapshots, not
   hidden secondary editors.
3. A durable build-set entry stores app-owned editor facts through `PersistedBuildSnapshot` plus
   entry metadata. It must not collapse back to `Build` only, because PvE budget and raw template
   overlays are required for faithful switching and persistence.
4. `workspaceReducer` mirrors the current selected editor snapshot back into the active build-set
   entry on every editor mutation and before any selected-entry switch.
5. Keep `LOCAL_LIBRARY_STORAGE_KEY = "build-wars:v1"` and `LOCAL_LIBRARY_SCHEMA_VERSION = 1`.
   Extend the existing envelope additively with build-set fields rather than creating a second key
   or a schema-version bump.
6. Persist at most one working draft kind at a time: either the existing single-build draft or a
   build-set draft. Switching modes must not silently erase saved records of either kind.
7. Build-set editing lives in the existing main column above the current `Skills` and `Equipment`
   tabs. Multi-pane full editing is deferred.
8. Share URLs and skill-template import/export remain selected-loadout-only. Whole build-set
   transfer uses inert JSON backup/export, not a new fragment grammar.
9. Aggregate validation reuses per-loadout `validateBuild` results. No party-wide legality or
   synergy rules are introduced.
10. Duplicate variant actions must create fresh build-set entry IDs and fresh nested `Build.id`
    values. Saved-record IDs remain separate from build-set IDs and entry IDs.
11. Bound one build set to a maximum of 16 entries for MVP so selectors, summaries, backup payloads,
    and responsive layouts stay testable without virtualization.

## Use Cases

1. A user can convert the current single build into a new build set and continue editing it as the
   first selected loadout.
2. A user can keep several related loadouts open at once and switch between them without losing
   unsaved changes to skills, attributes, equipment, title ranks, PvE budget, raw template overlay,
   or notes.
3. A user can add a blank loadout to a build set, fill it in later, and keep incomplete or
   unresolved entries visible without validation crashes.
4. A user can duplicate the selected loadout as a variant, rename it, promote it, reorder it, and
   compare it to another entry while preserving the original independently.
5. A user can scan compact summaries for sibling loadouts while editing one selected loadout in the
   existing editor.
6. A user can save a build set locally, reload the browser, and continue with the same selected
   loadout and durable entry state.
7. A user with older single-build library data can keep using the current save/load/share flow
   without being forced into build-set mode.
8. A user can restore a backup containing single builds, build sets, or both, and see accepted,
   skipped, and remapped records before applying anything.
9. A user can share or export the selected loadout with the current skill-template flow while
   keeping sibling loadouts and build-set metadata local or JSON-export-only.
10. A user can export one whole build set for recovery and later restore it without inventing a
    party or external team-template format.
11. A user can see which entries are invalid, unresolved, incomplete, or stale without the app
    implying that the set is a legal Guild Wars party.
12. A user can delete all entries from a build set and remain in a safe empty-set state with a
    clear path to add a new loadout.

## Architecture

| Area | Owns | Must Not Own |
| --- | --- | --- |
| `src/domain/build-set.ts` | Framework-neutral `BuildSet` and `BuildSetEntry` contracts, ordered entry identity, lightweight kind, optional description/notes, selected-entry normalization helpers, and empty/single/multi/partial classification. | React, browser storage, local library record metadata, generated catalog imports, party slots, hero semantics, or UI-only collapsed/compare state. |
| `src/app/persistence-schema.ts` | Durable build-set entry snapshot types, JSON validation, clone/hydrate/fingerprint helpers, bounded metadata, legacy single-build compatibility, and additive storage-envelope fields. | DOM behavior, comparison UI, or direct validation rendering. |
| `src/app/workspace-state.ts` | Active document kind, build-set draft state, selected-entry mirroring, save/update/load semantics, dirty guards, autosave eligibility, and local record association. | Generated catalog imports, leaf-component presentation, or party legality rules. |
| `src/app/build-set-selectors.ts` and `src/app/library-selectors.ts` | Summary cards, aggregate validation status, comparison view models, library rows, filter behavior across build/set records, and selected-entry/compare-target projections. | Mutable reducer state, raw localStorage I/O, or direct generated JSON imports outside `catalogs.ts`. |
| `src/app/App.tsx`, `src/app/components/BuildSetPanel.tsx`, `src/app/components/LibraryPanel.tsx`, `src/app/styles.css` | Build-set toolbar, summary strip, accessible selection, empty states, overflow behavior, responsive layout, and record-level entry points. | Validation authority, persistence parsing, or template/share encoding. |
| `src/app/backup-restore.ts`, `src/app/components/ShareControls.tsx`, `src/app/components/TemplateDialogs.tsx`, `src/app/template-workflow.ts` | Build-set backup/export boundaries, restore preview/apply behavior, selected-loadout-only share/template messaging, and draft-replacement warnings. | New remote sharing systems, party/team codecs, or build-set URL grammar. |
| `src/app/catalogs.ts`, `src/app/editor-selectors.ts`, `src/domain/validation.ts`, `src/domain/title-rank.ts`, `src/domain/equipment.ts` | Existing single-loadout catalog adaptation, validation, title, and equipment logic reused for each build-set entry. | Build-set-specific storage or party semantics. |

### Durable Shapes

The framework-neutral authored model should separate build-set structure from app persistence:

- `BuildSet` owns set-level `id`, `name`, optional `description`, optional `notes`, ordered
  `entries`, and `selectedEntryId`.
- `BuildSetEntry` owns entry `id`, `label`, optional `description`, optional `notes`, lightweight
  `kind`, and a reused `Build`.
- Empty build sets are represented by `entries: []` and `selectedEntryId: null`.
- Partial state means one or more entries are incomplete, unresolved, or invalid according to the
  existing build contracts; it does not require nullable entry payloads.
- UI-only state such as collapsed cards, compare target, hover/focus hints, and scroll position
  stays in app workspace state and is never persisted.

The durable app model should wrap the existing single-build snapshot rather than redefining it:

- `PersistedBuildSetEntrySnapshot` should contain entry metadata plus one `PersistedBuildSnapshot`.
- `PersistedWorkingBuildSetDraft` should mirror the current `PersistedWorkingDraft` pattern.
- `PersistedSavedBuildSetRecord` should mirror the current saved-record metadata pattern.
- Record-scoped build-set export should reuse the existing inert backup envelope shape, extended to
  carry saved build sets and an optional build-set draft, so restore logic stays shared.

### Active Editor Mirroring

The current `EditorState` remains the only fully interactive editor. In build-set mode:

- the selected entry hydrates into `workspace.editor`
- every `editor` action produces a new selected-entry snapshot immediately
- switching selected entries first commits the outgoing snapshot, then hydrates the incoming one
- non-selected entries keep only durable snapshots and summary projections
- empty build sets render a dedicated empty-state panel instead of mutating a phantom build

This is the critical correctness rule for EPIC-16. It keeps all current editor features intact
while ensuring loadout switches do not drop unsaved state.

### Storage Strategy

`build-wars:v1` remains the only browser-local storage key. The sprint should extend the existing
envelope additively:

- keep `workingDraft` and `savedBuilds` for single-build compatibility
- add `workingBuildSetDraft` and `savedBuildSets` for EPIC-16
- enforce that at most one working-draft field is populated at a time
- keep existing record-name/tag/favorite/notes limits and reuse them where build-set metadata has
  the same semantics
- validate build-set payloads from `unknown`, reject dangerous keys, duplicate entry IDs,
  oversized entry arrays, malformed selected IDs, and malformed snapshots with bounded diagnostics

The same additive approach should extend backup/restore. One malformed build-set record must not
invalidate unrelated single-build or build-set records in the same restore preview.

### Execution Topology

```text
BW-1601 build-set contracts and durable snapshot wrappers
  -> BW-1602 workspace mode, reducer mirroring, autosave, and persistence
BW-1602
  -> BW-1603 navigation, summaries, and responsive build-set UI
BW-1602 + BW-1603
  -> BW-1604 variant duplication, compare, reorder, and promote flows
BW-1602 + BW-1603
  -> BW-1605 aggregate validation, backup/export boundaries, and share/template rules
BW-1602 + BW-1603 + BW-1604 + BW-1605
  -> BW-1606 docs, verification, and closeout
```

`BW-1601` and `BW-1602` are hard prerequisites. `BW-1604` and `BW-1605` may proceed in parallel
only after the state shape and navigation contracts stop moving.

## Implementation

### Execution Bookkeeping

- [ ] Keep `SPRINT-017`, `EPIC-16`, and `BW-1601` through `BW-1606` consistent across the draft,
      final sprint, ticket records, ledger entry, and closeout notes.
- [ ] Preserve existing single-build verification behavior as the regression baseline for every
      phase gate.
- [ ] Treat `src/domain/party.ts` and `src/domain/guide.ts` as reference-only for this sprint.
- [ ] Keep `src/app/catalogs.ts` as the only runtime generated-data import boundary.

### Phase 0: Baseline and Contract Freeze (~5%)

**Files:**

- `work/tickets/16-heroes-and-henchmen/*.md`
- `src/app/workspace-state.test.ts`
- `src/app/share-url.test.ts`
- `src/app/template-workflow.test.ts`
- `src/app/backup-restore.test.ts`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Freeze the one-active-editor rule, additive schema-v1 storage plan, selected-loadout-only
      share/template rule, and 16-entry cap before any broader UI work starts.
- [ ] Tighten current regression coverage for single-build save/load, share import/export, template
      import/export, equipment omission warnings, and title-rank omission warnings.
- [ ] Capture current dirty-guard and reload behavior so later build-set changes prove only
      intentional differences.
- [ ] Confirm that build-set work does not reuse `PartyBuild`, party slots, or party legality as a
      shortcut.

**Verification:**

- `npm run test:run -- src/app/workspace-state.test.ts src/app/share-url.test.ts src/app/template-workflow.test.ts src/app/backup-restore.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** The single-build baseline is locked, and the core EPIC-16 architectural decisions
are fixed before the durable state shape starts changing.

### Phase 1: BW-1601 Build-Set Contracts (~18%)

**Files:**

- `src/domain/build-set.ts`
- `src/domain/index.ts`
- `src/app/persistence-schema.ts`
- `src/app/library-fixtures.ts`
- `test/domain/build-set.test.ts`
- `src/app/persistence-schema.test.ts`

**Tasks:**

- [ ] Add a framework-neutral `BuildSet` contract with ordered entries, selected-entry identity,
      set-level name, optional description, and optional notes.
- [ ] Add a `BuildSetEntry` contract with stable entry ID, label, lightweight kind
      (`build | variant | freeform`), optional description, optional notes, and reused `Build`
      payload.
- [ ] Add pure helpers for effective selected-entry normalization, empty/single/multi/partial
      classification, duplicate-entry-ID rejection, and bounded entry-array validation.
- [ ] Keep collapsed state, compare target, and similar presentation concerns out of the domain
      model.
- [ ] Add app durable snapshot wrappers that pair entry metadata with one `PersistedBuildSnapshot`
      instead of redefining `Build`, `PveBudgetState`, or raw-template fields.
- [ ] Add fixtures for empty sets, one-entry sets, incomplete entries, unresolved entries,
      duplicate entry IDs, stale selected-entry IDs, and oversized sets.

**Verification:**

- `npm run test:run -- test/domain/build-set.test.ts src/app/persistence-schema.test.ts`
- `npm run typecheck`

**Phase Gate:** Build-set structure, durable snapshot wrappers, and invalid-shape handling are
stable enough that workspace-state work does not need to revisit the data model.

### Phase 2: BW-1602 Workspace State and Persistence (~24%)

**Files:**

- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/local-storage.ts`
- `src/app/local-storage.test.ts`
- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/library-fixtures.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Extend `WorkspaceState` with an active document kind and build-set draft state while keeping
      one active `editor`.
- [ ] Add reducer actions for creating a build set from the current draft, saving a build set,
      updating an associated build-set record, saving a build set as new, loading a saved build set,
      adding a blank loadout, selecting an entry, removing an entry, and reordering entries.
- [ ] Mirror the current editor snapshot into the selected build-set entry after every `editor`
      action and before any entry-selection change.
- [ ] Keep explicit save/update semantics so editing a build set never overwrites a source
      single-build record or another saved build set implicitly.
- [ ] Extend the `build-wars:v1` envelope with `workingBuildSetDraft` and `savedBuildSets` while
      preserving current `workingDraft` and `savedBuilds` behavior.
- [ ] Enforce that only one working draft kind is durable at a time and that unsupported or corrupt
      build-set payloads fall back without breaking the rest of the library.
- [ ] Extend autosave, pagehide flush, restore preview/apply, and best-effort revision checks to
      cover build-set drafts.
- [ ] Preserve familiar single-build behavior for users who never create a build set.

**Verification:**

- `npm run test:run -- src/app/workspace-state.test.ts src/app/local-storage.test.ts src/app/backup-restore.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** Build sets round-trip through in-memory state and local storage, selected-loadout
switches do not lose unsaved edits, and legacy single-build libraries still hydrate cleanly.

### Phase 3: BW-1603 Workspace Navigation and Summaries (~20%)

**Files:**

- `src/app/build-set-selectors.ts`
- `src/app/build-set-selectors.test.ts`
- `src/app/components/BuildSetPanel.tsx`
- `src/app/build-set-panel.test.tsx`
- `src/app/App.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/styles.css`

**Tasks:**

- [ ] Add selector-backed build-set summary views derived from durable snapshots through existing
      app selectors and `hydrateEditorFromSnapshot`.
- [ ] Render a build-set toolbar and compact summary strip above `EditorWorkspaceTabs` in the
      existing main column.
- [ ] Show each entry's label, kind, profession pair, mode, mini skill-bar summary, key
      equipment/title indicators, validation badge, and selected state without importing generated
      catalogs outside `src/app/catalogs.ts`.
- [ ] Support accessible keyboard and pointer selection, overflow scrolling, add-entry actions,
      move-left/right actions, explicit remove actions, and narrow-width layout behavior.
- [ ] Keep single-entry sets simple and render a dedicated empty-set state when there is no selected
      entry.
- [ ] Extend library rows so saved build sets are discoverable alongside saved single builds with a
      type badge, entry count, selected-entry preview, and aggregate status.

**Verification:**

- `npm run test:run -- src/app/build-set-selectors.test.ts src/app/build-set-panel.test.tsx src/app/library-selectors.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** Users can see and select multiple loadouts while editing one active loadout, and
every summary path stays inside the existing app catalog boundary.

### Phase 4: BW-1604 Variant Workflows (~18%)

**Files:**

- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/build-set-selectors.ts`
- `src/app/build-set-selectors.test.ts`
- `src/app/components/BuildSetPanel.tsx`
- `src/app/build-set-panel.test.tsx`
- `src/app/components/LibraryPanel.tsx`

**Tasks:**

- [ ] Duplicate the selected entry as a variant with a fresh entry ID, fresh nested `Build.id`,
      copied snapshot state, and deterministic label suffixing.
- [ ] Add entry rename, optional description editing, and short local notes editing with bounded
      lengths.
- [ ] Define `promote` as moving the selected entry to index `0` while preserving selection.
- [ ] Add a compare target in app UI state only, then render a deterministic compact diff summary
      for skill bar, professions, mode, attributes, title-rank overrides, semantic equipment, and
      entry notes.
- [ ] Keep difference output useful when equipment is partial, unresolved, or absent; do not invent
      party-wide analytics.
- [ ] Require explicit behavior for remove and promote actions so variants cannot silently delete or
      overwrite unrelated saved records.

**Verification:**

- `npm run test:run -- src/app/workspace-state.test.ts src/app/build-set-selectors.test.ts src/app/build-set-panel.test.tsx`
- `npm run typecheck`

**Phase Gate:** Variant duplication, comparison, rename, reorder, remove, and promote behavior are
deterministic, independently editable, and free of record-identity confusion.

### Phase 5: BW-1605 Group Validation and Export Boundaries (~10%)

**Files:**

- `src/app/build-set-selectors.ts`
- `src/app/build-set-selectors.test.ts`
- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/components/ShareControls.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/template-dialogs.test.tsx`
- `src/app/share-url.test.ts`

**Tasks:**

- [ ] Reuse `validateBuild` per entry and expose aggregate counts for valid/invalid, resolved/
      unresolved, and complete/incomplete loadouts without inventing party legality.
- [ ] Add a build-set overview summary to the active workspace and library rows so users can see
      which entries need attention.
- [ ] Extend backup/restore envelopes, preview plans, and apply behavior to include saved build
      sets and an optional working build-set draft.
- [ ] Add record-scoped build-set export using the same inert backup envelope machinery rather than
      inventing a second JSON codec or a URL format.
- [ ] Keep share URLs, share-fragment boot handling, and canonical skill-template export scoped to
      the active selected loadout only.
- [ ] In build-set mode, keep in-app template import/export behavior scoped to the selected entry
      with the same discard and omission warnings already used for equipment and title overrides.
- [ ] Make the whole-set transfer boundary explicit in UI copy: loadout sharing is skill-template
      based, build-set transfer is JSON backup/export based.

**Verification:**

- `npm run test:run -- src/app/build-set-selectors.test.ts src/app/library-selectors.test.ts src/app/backup-restore.test.ts src/app/template-workflow.test.ts src/app/template-dialogs.test.tsx src/app/share-url.test.ts`
- `npm run typecheck`

**Phase Gate:** Aggregate status is accurate, restore/export behavior is durable, and sharing does
not imply support for whole-set URLs or external team-template formats.

### Phase 6: BW-1606 Docs and Closeout (~5%)

**Files:**

- `README.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/multi-build-workspace.md`
- `work/tickets/16-heroes-and-henchmen/*.md`
- `work/sprints/SPRINT-017.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Document the build-set contract, one-active-editor model, save/load behavior, summary strip,
      variant rules, selected-loadout share behavior, and JSON recovery/export path.
- [ ] Document deferred scope explicitly: no hero names, henchmen, NPC data, party slots, party
      legality, paw-ned2, external team templates, hosted sync, or collaboration.
- [ ] Add manual verification notes for keyboard-only entry switching, narrow-width overflow,
      compare readability, empty-set recovery, and restore-preview behavior.
- [ ] Update ticket records, sprint status, and ledger status only after every phase gate and the
      full verification suite pass.
- [ ] Run the repository-wide verification suite as the release gate for EPIC-16.

**Verification:**

- `npm run verify`

**Phase Gate:** Documentation, verification, and closeout records all agree on EPIC-16 scope,
compatibility guarantees, and deferred party-specific work.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/build-set.ts` | Create | Framework-neutral build-set and entry contracts plus normalization/classification helpers. |
| `src/domain/index.ts` | Modify | Export the new build-set contracts and helpers. |
| `src/app/persistence-schema.ts` | Modify | Add durable build-set snapshot/record types, validators, clone/hydrate helpers, and schema-v1 additive fields. |
| `src/app/local-storage.ts` | Modify | Persist and hydrate build-set working drafts and saved build-set records under the existing storage key. |
| `src/app/backup-restore.ts` | Modify | Extend backup/export and restore preview/apply flows to carry build-set records safely. |
| `src/app/workspace-state.ts` | Modify | Add build-set mode, selected-entry mirroring, entry actions, and explicit save/update/load semantics. |
| `src/app/build-set-selectors.ts` | Create | Build-set summary, comparison, aggregate validation, and overview view models. |
| `src/app/library-selectors.ts` | Modify | Surface saved build sets alongside saved builds with shared filtering and status summaries. |
| `src/app/App.tsx` | Modify | Compose build-set mode, the summary strip, and selected-loadout editing into the current app shell. |
| `src/app/components/BuildSetPanel.tsx` | Create | Active build-set toolbar, summary cards, compare summary, and empty-state UI. |
| `src/app/components/LibraryPanel.tsx` | Modify | Add build-set entry points and mixed build/build-set library rows. |
| `src/app/components/ShareControls.tsx` | Modify | Keep share behavior selected-loadout-only and explain build-set JSON export boundaries. |
| `src/app/components/TemplateDialogs.tsx` | Modify | Keep template import/export scoped to the selected loadout inside a build set. |
| `src/app/template-workflow.ts` | Modify | Preserve selected-loadout import/export fidelity and warnings in build-set mode. |
| `src/app/styles.css` | Modify | Add responsive build-set strip, card, compare, and empty-state styling. |
| `src/app/library-fixtures.ts` | Modify | Add build-set fixtures for persistence, restore, and library tests. |
| `test/domain/build-set.test.ts` | Create | Cover build-set contract rules, normalization, and edge cases. |
| `src/app/*.test.ts(x)` | Modify/Create | Cover reducer, selectors, components, persistence, restore, and share/template regressions. |
| `compendium/multi-build-workspace.md` | Create | Durable note for EPIC-16 workspace behavior and deferred scope. |
| `README.md` and compendium notes | Modify | Document the new workspace behavior and compatibility boundaries. |

## Definition of Done

- [ ] `src/domain/build-set.ts` exists and stays framework-neutral, party-neutral, and app-neutral.
- [ ] Build sets have ordered stable entry IDs, selected-entry identity, lightweight kinds, and
      bounded optional description/notes fields.
- [ ] Partial state is representable through existing incomplete/unresolved `Build` semantics
      without nullable entry payloads or validation crashes.
- [ ] The active workspace still uses one `EditorState`; non-selected loadouts persist as snapshots
      only.
- [ ] Switching selected entries preserves unsaved in-memory changes to skills, attributes,
      equipment, title ranks, PvE budget, raw template overlays, and entry notes.
- [ ] Duplicating a variant creates fresh entry and nested build IDs so later saves cannot confuse
      original and copy identity.
- [ ] `build-wars:v1` remains the only storage key, and `LOCAL_LIBRARY_SCHEMA_VERSION` remains `1`.
- [ ] Existing single-build libraries, working drafts, share URLs, template dialogs, equipment
      editor, and title-rank workflows remain compatible.
- [ ] Saved build sets and working build-set drafts round-trip through autosave, reload, save new,
      update, save as new, backup/export, and restore.
- [ ] Corrupt or unsupported build-set payloads are rejected with bounded diagnostics without
      corrupting unrelated saved builds or build sets.
- [ ] Build-set summaries and library rows consume generated catalog data only through
      `src/app/catalogs.ts`.
- [ ] The main column shows compact persistent summaries for sibling loadouts and one selected
      editor; no second full editor pane is required.
- [ ] Entry add, duplicate, remove, rename, reorder, promote, compare, and empty-set recovery
      flows work with keyboard and pointer interactions.
- [ ] Aggregate validation reuses per-entry `validateBuild` results and does not invent party
      legality, synergy scoring, or hero rules.
- [ ] Share URLs and skill-template import/export remain selected-loadout-only; whole build-set
      transfer uses inert JSON backup/export only.
- [ ] Restore preview shows accepted/skipped build-set records, duplicate IDs, current-ID
      conflicts, remaps, and optional working-draft availability before apply.
- [ ] Documentation explicitly defers hero, henchman, portrait, party-slot, party-validation,
      paw-ned2, and external team-template scope to later epics.
- [ ] `npm run verify` passes at closeout.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Selected-entry snapshots drift from the active editor, causing silent data loss on loadout switch. | Medium | Critical | Mirror the selected entry on every `editor` action, commit before selection changes, and add reducer tests for edit-switch-edit, edit-revert-switch, and rapid selection sequences. |
| Additive schema-v1 changes break existing single-build storage or restore behavior. | Medium | High | Keep legacy fields intact, add parallel build-set fields, and run legacy-fixture, mixed-backup, and old-library hydration tests before UI rollout. |
| Record IDs, build-set IDs, entry IDs, and nested build IDs are confused during duplicate/save/update flows. | Medium | High | Keep each ID scope explicit in types and reducers, rotate entry/build IDs on duplicate, and test overwrite prevention paths. |
| Summary selectors become too expensive when every entry is revalidated on each edit. | Medium | Medium | Cap sets at 16 entries, key summary recalculation by snapshot fingerprint, and keep full validation detail scoped to selected or compared entries. |
| EPIC-16 UI leaks party semantics through labels or validation language. | Low | High | Use neutral language such as `loadout`, `build set`, and `variant`, and explicitly ban party legality or slot assumptions in selectors and docs. |
| Sharing and import behavior becomes ambiguous in build-set mode. | Medium | High | Keep UI copy explicit that template/share actions target the selected loadout only, and cover boot-time share import separately from in-app build-set import. |

## Security

- Treat build-set library JSON, backup/export JSON, and restore input as untrusted. Parse from
  `unknown`, reject dangerous keys, and bound strings, arrays, and diagnostics.
- Keep build-set export inert JSON only. Do not add executable URLs, HTML payloads, scriptable rich
  text, or remote fetch requirements.
- Preserve the one-key local-first storage model. No backend, account sync, collaboration channel,
  analytics, or remote media fetch should be introduced.
- Keep build-set metadata, notes, and sibling loadouts out of share fragments and skill-template
  bytes. Selected-loadout sharing must remain intentionally narrow.
- Ensure restore preview is mandatory before destructive apply so malformed or conflicting records
  cannot silently overwrite good local data.

## Dependencies

- `SPRINT-001` / `EPIC-00` provides the project layout, module ownership, test conventions, and
  verification command expectations.
- `SPRINT-002` / `EPIC-01` provides source-policy and documentation conventions; EPIC-16 should not
  widen runtime data or media boundaries.
- `SPRINT-009` / `EPIC-08` provides the active single-build editor, raw-template overlay, template
  fidelity boundary, validation panel, and responsive shell.
- `SPRINT-010` / `EPIC-09` provides the workspace reducer, `build-wars:v1` storage contract,
  dirty-guard model, local library, backup/restore, and share URL behavior that EPIC-16 must reuse.
- `SPRINT-014` / `EPIC-13` provides nullable semantic equipment on `Build`.
- `SPRINT-015` / `EPIC-14` provides the equipment editor, semantic equipment persistence, and
  equipment omission warnings.
- `SPRINT-016` / `EPIC-15` provides title-rank overrides, title controls, title validation, and
  title omission warnings.
- Ticket dependency order inside this sprint is `BW-1601 -> BW-1602 -> BW-1603 -> (BW-1604,
  BW-1605) -> BW-1606`.
- No new runtime dependency is planned.

## Open Questions

1. The draft assumes a hard cap of 16 entries per build set. If product scope requires more than
   that, the team should confirm whether virtualization or a different summary layout belongs in
   EPIC-16 or a later performance-focused epic.
2. The draft assumes build-set records appear in the existing library list with type badges rather
   than in a separate library tab. If the mixed list proves too dense, the fallback should be a
   shallow view filter, not a second persistence model.
3. The draft assumes `promote` means moving the selected entry to index `0`. If product wants a
   different semantic meaning, that should be clarified before BW-1604 implementation starts.
4. The draft assumes entry `description` is a short secondary label and entry `notes` is the longer
   local text field. If only one field is wanted in MVP, remove `description` early rather than
   carrying both through persistence and UI.
5. The draft defers importing an arbitrary saved single-build record directly into an already-open
   build set. If that workflow is required in EPIC-16, it should be added explicitly to BW-1602 or
   BW-1604 before execution begins.
