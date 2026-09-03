---
id: SPRINT-017
title: Multi-Build Workspace
status: completed
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
updated: 2026-09-03
---

# Sprint 017: Multi-Build Workspace

## Overview

This sprint turns the current durable single-build editor into a multi-build workspace. A build set
contains several complete authored loadouts, while exactly one loadout remains wired into the
existing profession, attribute, skill, title-rank, equipment, template, share, and validation
surfaces at a time.

The implementation is a workspace and persistence increment, not a party-builder increment. Build
sets are neutral containers for variants, comparisons, future party adapters, farming setups, or
freeform collections. EPIC-16 does not add hero catalogs, henchmen, NPC data, portraits, AI notes,
party slots, party legality, paw-ned2/team-template support, guide publishing, backend sync,
collaboration, routes, remote media, or new runtime dependencies.

The critical invariant is one active editor plus inactive snapshots. In build-set mode, the selected
entry is represented by the live `EditorState`; every non-selected entry is represented by a durable
`PersistedBuildSnapshot`. Switching entries materializes the outgoing editor snapshot and hydrates
the incoming snapshot in one pure transition. Save, autosave, validation, summaries, backup,
transfer, and library projections all consume the same materialized build-set view so the active
loadout cannot drift from persisted entries.

Local storage keeps the existing `build-wars:v1` discovery key but advances the local-library
payload to schema version 2. Schema-1 libraries migrate in memory into a discriminated saved
document model without dirtying the draft or writing on read. Older unsupported payloads remain
write-blocked instead of being overwritten. Current skill-template and share URL flows stay
selected-loadout-only; full build-set recovery and transfer use bounded inert JSON.

## Assumptions

1. EPIC-16 can be implemented as one sprint because BW-1601 through BW-1606 are groomed, ready, and
   dependency ordered.
2. The completed EPIC-08, EPIC-09, EPIC-14, and EPIC-15 contracts are stable enough to reuse for
   single-loadout editing, storage, equipment, title ranks, backup/restore, and validation.
3. A 16-entry cap is sufficient for the first multi-build workspace and keeps localStorage,
   summaries, validation, and responsive layout testable.
4. `build-wars:v1` is a stable storage key, not the payload schema version. Bumping the envelope to
   schema 2 under that key is safer than adding new schema-1 fields with ambiguous semantics.
5. Entry selection is app-owned durable resume state. The framework-neutral `BuildSet` model should
   not persist selected, collapsed, focused, or comparison UI state.
6. Promotion means changing a variant/freeform entry to `kind: build`; order changes remain explicit
   Move Earlier/Move Later actions.
7. One set name, saved-record notes, entry labels, entry kinds, and entry notes are enough for MVP
   metadata. Separate set and entry descriptions are deferred unless a later product use case
   requires them.
8. Planning skipped interview under the non-interactive ticket-burn contract because the material
   architecture choices are resolved in this sprint.
9. This planning run updates sprint, draft, ticket, ledger, run-state, and result-manifest records
   only; no implementation source change or commit is part of planning.

## Use Cases

1. **Stay single-build**: A user who never creates a build set keeps the existing editor, local
   library, template import/export, share URL, equipment editor, title controls, validation,
   backup, and restore behavior.
2. **Create a set from current work**: A user converts the current draft or loaded record into an
   unassociated build-set draft whose first entry is an independent copy of the visible loadout.
3. **Add loadouts**: A user adds a blank loadout or copies a saved single-build record into the
   current set without mutating the source saved record.
4. **Switch safely**: A user edits skills, professions, mode, attributes, PvE budget, raw template
   facts, title ranks, equipment, nested build name, or entry notes; switching away and back
   restores those unsaved changes.
5. **Scan the set**: Compact summaries show entry label, kind, profession pair, mode, eight skill
   slots, equipment/title indicators, notes indicator, and attention status while one editor remains
   active.
6. **Manage entries**: A user can select, rename, reorder, duplicate, remove, mark kind, edit notes,
   and promote entries with pointer and keyboard controls.
7. **Duplicate variants**: A user duplicates the selected loadout as a variant with fresh entry and
   nested build IDs, edits the copy independently, and keeps the source intact.
8. **Compare variants**: A user views deterministic differences between two entries for identity,
   professions, mode, skills, attributes, PvE budget, title ranks, semantic equipment, notes, and
   meaningful unresolved raw facts.
9. **Handle empty sets**: Removing the final entry leaves an empty build set with a clear add action
   and no phantom persisted build.
10. **Save and recover locally**: Working-draft autosave, pagehide flush, Save New, Update, Save As
    New, load, duplicate record, delete record, storage errors, backup, restore, and reload preserve
    both single builds and build sets.
11. **Understand group status**: Aggregate validation identifies entries with errors, warnings,
    unresolved facts, incomplete authoring, stale facts, or catalog unavailability without implying
    party legality.
12. **Share honestly**: Skill-template export and share URLs target only the selected loadout and
    warn when local-only facts such as sibling entries, entry notes, equipment, or title overrides
    are omitted.
13. **Transfer a set**: A user exports or imports one full build set through a versioned Build Wars
    JSON envelope with preview, bounds, dirty guard, and no external-template claims.

## Architecture

### Scope Boundary

| Area        | In Scope                                                                                                                                                                                           | Out Of Scope                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Domain      | Framework-neutral build-set and entry contracts, ordered entries, stable IDs, set name, entry labels, entry notes, lightweight kinds, bounds, and structural helpers.                              | `PartyBuild` reuse, party slots, primary party member, hero/henchman identity, portraits, AI behavior, guide sections, recommendations. |
| Workspace   | Discriminated active document kind, one live `EditorState`, inactive entry snapshots, atomic switch/materialize transitions, entry actions, dirty guards, and document associations.               | Multiple full editors, undo history, cross-tab sync beyond existing revision conflict handling, collaboration, account state.           |
| Persistence | Local-library schema 2 under `build-wars:v1`, schema-1 migration, mixed saved documents, build-set working drafts, bounds, corrupt-data recovery, fingerprints, backup, restore, and set transfer. | New storage keys, IndexedDB, backend storage, hosted links, destructive downgrade, unbounded JSON import.                               |
| UI          | Main-column build-set navigator, compact summaries, accessible actions, empty/single/multi states, overflow, comparison, group status, and selected-editor integration.                            | New route, marketing page, hero portraits, party formation layout, full multi-pane editing, new UI package.                             |
| Validation  | Existing `validateBuild` per entry, aggregate app-level status, incomplete authoring labels, entry navigation, and catalog-unavailable handling.                                                   | Cross-entry party legality, synergy scoring, mode harmonization errors, unlock/account validation, rule-engine version bump.            |
| Sharing     | Selected-loadout skill templates and share URLs, inert build-set JSON transfer, mixed whole-library backup/restore, and precise omission warnings.                                                 | Whole-set URL fragments, paw-ned2/team-template codecs, short links, hosted sharing, external compatibility claims.                     |

### Binding Decisions

1. Add `src/domain/build-set.ts` and export it from `src/domain/index.ts`. The domain module must not
   import React, browser APIs, app modules, generated JSON, data scripts, party, or guide modules.
2. Domain `BuildSetEntry` reuses `Build` as its loadout payload. It does not duplicate profession,
   skill, attribute, title-rank, or equipment fields.
3. Domain `BuildSet` owns authored set structure: schema version, ID, name, and ordered entries. It
   does not own selected entry, collapsed cards, focus, comparison target, or library record notes.
4. Entry metadata is stable entry ID, label, `build | variant | freeform` kind, and bounded notes.
   Labels do not establish identity. Duplicate labels are allowed; duplicate entry IDs are not.
5. Array position is the only ordering source. Reorder works by stable entry ID and Move
   Earlier/Move Later actions.
6. App persistence stores entries as metadata plus `PersistedBuildSnapshot`, not bare `Build`, so
   PvE budget and raw template overlays survive for inactive entries.
7. Runtime build-set state stores either one active `EditorState` for the selected entry or one
   inactive `PersistedBuildSnapshot` for every other entry. The same entry never stores both.
8. `lastSelectedEntryId` is app-owned durable resume state in the persisted build-set snapshot. It
   is included in the workspace persistence fingerprint but excluded from authored-content dirty
   status.
9. `comparisonEntryId`, open menus/dialogs, collapsed card state, scroll position, editor tab, drag
   state, tooltip pins, and keyboard placement are transient UI state and are not persisted.
10. Empty sets are real documents: `entries: []`, no active editor, single-build template/share
    controls disabled, and Add Loadout available.
11. Last-entry removal leaves an empty set. It does not create a replacement build automatically.
12. Duplicating or copying a loadout deep-clones all nested build, pveBudget, raw-template,
    title-rank, equipment, and modifier arrays and assigns fresh entry and nested `Build.id` values.
13. Save/update associations are document-kind aware. Updating a build set cannot overwrite a saved
    single build with the same record ID after restore/corruption; kind mismatch clears association
    and requires Save New.
14. Promotion changes an entry kind to `build` and leaves order unchanged. It does not create
    primary/base semantics, demote other entries, or delete sibling entries.
15. Compact comparison is required but informational. It reports stable field differences and never
    ranks, recommends, optimizes, or infers party roles.
16. The initial cap is 16 entries per build set. All ingress paths enforce the same cap: UI add,
    duplicate, copy, local storage, backup restore, and set transfer import.
17. `LOCAL_LIBRARY_SCHEMA_VERSION` advances to 2 while `LOCAL_LIBRARY_STORAGE_KEY` remains
    `build-wars:v1`.
18. Schema-1 local libraries migrate in memory to schema 2 with exact preservation of working draft,
    saved builds, IDs, associations, timestamps, tags, favorites, record notes, snapshots, savedWith
    facts, revision, and metadata.
19. Reading schema-1 data does not dirty the document, increment revision, call `setItem`, or write
    schema 2. The first later authorized mutation writes schema 2 through the existing conflict
    checks.
20. Runtime persistence normalizes to one discriminated saved-document list and one discriminated
    working draft. Components do not infer record kind from object shape.
21. Whole-library backup advances to schema 2 and can import/migrate schema-1 backups through the
    same single-build wrapper rules.
22. `BuildSetTransferEnvelopeV1` is the only whole-set transfer format. It is not a Guild Wars team
    template and is not encoded into share fragments.
23. Startup share URLs continue to open unassociated single-build drafts. They never silently edit a
    stored build set.
24. In-set skill-template import replaces only the selected entry snapshot after confirmation and
    preserves entry ID, label, kind, and notes.
25. No new npm, Python, network, backend, worker, route, environment variable, or generated-data
    dependency is planned.

### Contract Shapes

Preferred shape, with exact TypeScript names allowed to follow local style:

```text
BUILD_SET_SCHEMA_VERSION = 1
MAX_BUILD_SET_ENTRIES = 16

BuildSetEntryKind = "build" | "variant" | "freeform"

BuildSetEntry
  id: BuildSetEntryId
  label: string
  kind: BuildSetEntryKind
  notes: string | null
  build: Build

BuildSet
  schemaVersion: 1
  id: AuthoredDocumentId
  name: string
  entries: readonly BuildSetEntry[]

PersistedBuildSetEntrySnapshot
  id: BuildSetEntryId
  label: string
  kind: BuildSetEntryKind
  notes: string | null
  snapshot: PersistedBuildSnapshot

PersistedBuildSetSnapshot
  schemaVersion: 1
  id: AuthoredDocumentId
  name: string
  entries: readonly PersistedBuildSetEntrySnapshot[]
  lastSelectedEntryId: BuildSetEntryId | null

PersistedDocument
  { kind: "build", snapshot: PersistedBuildSnapshot }
  | { kind: "build-set", snapshot: PersistedBuildSetSnapshot }

PersistedWorkingDraftV2
  document: PersistedDocument
  associatedRecordId: LocalBuildRecordId | null
  savedWith: PersistedCatalogFacts

PersistedSavedDocumentRecordV2
  id: LocalBuildRecordId
  name: string
  createdAt: string
  updatedAt: string
  favorite: boolean
  tags: readonly string[]
  notes: string | null
  document: PersistedDocument
  savedWith: PersistedCatalogFacts
```

### State Flow

```text
Active Workspace
  -> single build document
       -> existing EditorState

  -> build-set document
       -> selected entry: EditorState
       -> inactive entries: PersistedBuildSnapshot
       -> materializeActiveBuildSetSnapshot()
       -> persistence, validation, summaries, backup, transfer, save/update
```

All save, autosave, pagehide, validation, summary, comparison, transfer, restore preview, and
library row paths must call a shared materialization/projection helper instead of hand-building
snapshots.

## Implementation

### Phase 0: Planning Baseline and Contract Freeze (~5%)

**Files:**

- `work/sprints/SPRINT-017.md`
- `work/tickets/16-heroes-and-henchmen/*.md`
- `src/app/workspace-state.test.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/backup-restore.test.ts`
- `src/app/App.test.tsx`

**Tasks:**

- [x] Mark `SPRINT-017` and BW-1601 through BW-1606 in progress when execution starts.
- [x] Run focused baseline tests for single-build open/edit/save/load/share, template import/export,
      local library parsing, backup/restore, equipment persistence, title-rank persistence, and
      validation.
- [x] Freeze schema 2 under `build-wars:v1`, one active editor, app-owned `lastSelectedEntryId`,
      16-entry cap, empty-set delete-last behavior, kind-only promotion, selected-loadout sharing,
      and required build-set JSON transfer.
- [x] Add frozen schema-1 local library and backup fixtures before changing parser behavior.
- [x] Confirm `src/domain/party.ts` and `src/domain/guide.ts` are not implementation inputs for
      EPIC-16.

**Verification:**

- `npm run test:run -- src/app/workspace-state.test.ts src/app/persistence-schema.test.ts src/app/local-storage.test.ts src/app/backup-restore.test.ts src/app/App.test.tsx`
- `npm run typecheck`

### Phase 1: BW-1601 Build Set Contracts (~14%)

**Files:**

- `src/domain/build-set.ts`
- `src/domain/index.ts`
- `test/domain/build-set.test.ts`
- `test/domain/contracts.test.ts`
- `src/app/library-fixtures.ts`

**Tasks:**

- [x] Add branded build-set entry IDs, constants, `BuildSetEntryKind`, `BuildSetEntry`, and
      `BuildSet`.
- [x] Add pure structural helpers for blank sets, entry label/notes normalization, insert, remove,
      reorder, kind change, promote, duplicate metadata, and selected-entry repair inputs.
- [x] Keep domain helpers generic over entry payload where practical so app snapshot reducers do not
      reimplement subtly different ordering and ID rules.
- [x] Represent empty, single-entry, multi-entry, variant, freeform, partial, and unresolved states
      without nullable entry payloads.
- [x] Reject duplicate IDs, unsupported versions, invalid kinds, sparse arrays, dangerous keys,
      oversized strings, and over-limit entries at appropriate validation boundaries.
- [x] Prove duplicate/re-key creates independent nested `Build`, skill, attribute, title,
      equipment, and modifier arrays while preserving semantic values.

**Verification:**

- `npm run test:run -- test/domain/build-set.test.ts test/domain/contracts.test.ts`
- `npm run typecheck`

### Phase 2: BW-1602 Core State and Persistence (~21%)

**Files:**

- `src/app/build-set-state.ts`
- `src/app/build-set-state.test.ts`
- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.ts`
- `src/app/local-storage.test.ts`
- `src/app/library-fixtures.ts`

**Tasks:**

- [x] Add `PersistedDocument`, schema-2 saved document records, schema-2 working drafts,
      `PersistedBuildSetSnapshot`, and `PersistedBuildSetEntrySnapshot`.
- [x] Migrate schema-1 local libraries into schema 2 in memory with no write-on-read and no
      dirty-state change.
- [x] Validate unknown input with bounded diagnostics: dangerous keys, unsupported schema versions,
      unknown document kinds, malformed snapshots, duplicate library IDs, duplicate entry IDs, stale
      `lastSelectedEntryId`, oversized documents, aggregate loadout overflow, and sparse arrays.
- [x] Refactor `WorkspaceState` around a document-kind union while preserving one active
      `EditorState` for current components.
- [x] Implement `materializeActiveBuildSetSnapshot(state)` and route save, autosave, dirty
      fingerprinting, pagehide, validation input, library projection, backup, and transfer through it.
- [x] Implement create set from current, new empty set, add blank entry, select entry, remove entry,
      move earlier/later, rename entry, set entry notes, set entry kind, and promote.
- [x] Preserve dirty guards, durability states, revision conflicts, write-blocked recovery,
      quota/unavailable handling, and explicit association semantics for both document kinds.
- [x] Test edit-switch-edit, edit-save-without-switch, rapid switch, pagehide, empty-set, cap,
      both-draft conflict, associated-record kind mismatch, and no-selection command behavior.

**Verification:**

- `npm run test:run -- src/app/build-set-state.test.ts src/app/workspace-state.test.ts src/app/persistence-schema.test.ts src/app/local-storage.test.ts`
- `npm run typecheck`

### Phase 3: BW-1602 Library and App Integration (~13%)

**Files:**

- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/components/LibraryPanel.tsx`
- `src/app/components/LibraryDialogs.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Convert library selectors to consume discriminated saved document records.
- [x] Preserve existing single-build rows, filters, sorting, tags, favorites, notes, duplicate,
      delete, rename, save, load, backup, restore, and share behavior.
- [x] Add build-set rows with clear kind badge, entry count, selected-or-first preview, aggregate
      attention summary, freshness, tags, favorites, notes preview, and deterministic sort.
- [x] Define filters for build sets as any-entry matching for professions, modes, skills, raw
      labels, entry labels, record name, tags, and record notes.
- [x] Add Copy Into Set and Load Set flows with dirty guard and source-record preservation.
- [x] Ensure loading a single-build record exits build-set mode only through the dirty guard.
- [x] Ensure startup share URLs remain unassociated single-build drafts and never silently mutate an
      existing stored set.

**Verification:**

- `npm run test:run -- src/app/library-selectors.test.ts src/app/workspace-state.test.ts src/app/App.test.tsx`
- `npm run typecheck`

### Phase 4: BW-1603 Navigation, Summaries, and Responsive UI (~18%)

**Files:**

- `src/app/build-set-selectors.ts`
- `src/app/build-set-selectors.test.ts`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/build-set-navigator.test.tsx`
- `src/app/components/BuildSetDialogs.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Build selector-backed summaries for active and inactive entries using app catalog views and
      existing editor, equipment, title, and validation selectors.
- [x] Prove inactive-summary generation cannot mutate snapshots, fingerprints, dirty state, or
      active editor state.
- [x] Render a compact build-set navigator above the selected editor in the main column.
- [x] Show set name, entry count, aggregate status, Add Loadout, entry label/kind, notes indicator,
      profession pair, mode, eight compact skill states, equipment/title indicators, validation
      status, unresolved state, and selected state.
- [x] Support native Select, More Actions, Add, Duplicate, Remove, Move Earlier/Later, Rename,
      Notes, Kind, Promote, and Compare controls with deterministic accessible names.
- [x] Keep empty and one-entry states simple and disable unsupported selected-loadout
      template/share actions with a concise explanation.
- [x] Cover keyboard activation, focus restoration, live-region messages, escape-close menus,
      long labels, many-entry overflow, narrow stacked layout, no page-level horizontal scroll, and
      non-color status cues.
- [x] Keep generated catalog imports behind `src/app/catalogs.ts` and enforce with the existing
      catalog-boundary test.

**Verification:**

- `npm run test:run -- src/app/build-set-selectors.test.ts src/app/build-set-navigator.test.tsx src/app/App.test.tsx src/app/catalog-boundary.test.ts`
- `npm run typecheck`

### Phase 5: BW-1604 Variant Workflows and Comparison (~14%)

**Files:**

- `src/app/build-set-state.ts`
- `src/app/build-set-state.test.ts`
- `src/app/build-set-comparison.ts`
- `src/app/build-set-comparison.test.ts`
- `src/app/components/BuildSetComparison.tsx`
- `src/app/build-set-comparison.test.tsx`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Duplicate the selected entry as a variant with fresh entry ID, fresh nested `Build.id`,
      complete deep-copied snapshot, deterministic unique label, insertion after source, and source
      comparison target.
- [x] Prove later edits to duplicate and source cannot share object references, raw overlays, title
      overrides, equipment, PvE budget, or nested IDs.
- [x] Implement rename, notes, reorder, remove, kind change, and promote as separate deterministic
      operations.
- [x] Clear or repair comparison target after removal, restore, import, entry switch, and
      no-selection states.
- [x] Compare two entries with stable path-keyed rows for build name, professions, mode, skill
      slots, canonical attributes, PvE budget, title ranks, armor/equipment selections, weapon sets,
      entry notes, and meaningful unresolved raw facts.
- [x] Distinguish empty, configured, stale, retained, and unresolved values. Use catalog labels only
      for presentation; equality uses normalized IDs and values.
- [x] Render changed groups by default, include a no-differences state, and avoid better/worse,
      role, synergy, party, or recommendation language.

**Verification:**

- `npm run test:run -- src/app/build-set-state.test.ts src/app/build-set-comparison.test.ts src/app/build-set-comparison.test.tsx src/app/build-set-navigator.test.tsx`
- `npm run typecheck`

### Phase 6: BW-1605 Aggregate Validation, Transfer, Backup, and Share Boundaries (~20%)

**Files:**

- `src/app/build-set-selectors.ts`
- `src/app/build-set-selectors.test.ts`
- `src/app/build-set-transfer.ts`
- `src/app/build-set-transfer.test.ts`
- `src/app/components/BuildSetTransferDialog.tsx`
- `src/app/build-set-transfer-dialog.test.tsx`
- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/components/ShareControls.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/template-dialogs.test.tsx`
- `src/app/share-url.ts`
- `src/app/share-url.test.ts`

**Tasks:**

- [x] Validate every entry independently through the current `validateBuild` path and derive
      aggregate counts for errors, warnings, unresolved entries, incomplete entries, stale facts,
      and catalog-unavailable states.
- [x] Keep draft incompleteness as neutral authoring status, not a party or game-legality issue.
- [x] Add aggregate rows that select the affected entry and leave detailed issue rendering to the
      existing selected-entry `ValidationPanel`.
- [x] Keep `RULE_ENGINE_VERSION` unchanged unless implementation actually changes domain issue
      contracts.
- [x] Implement `BuildSetTransferEnvelopeV1` with deterministic inert JSON serialization, sanitized
      filename, byte/string/entry bounds, dangerous-key rejection, preview diagnostics, single-use
      apply, dirty guard, and unassociated-draft hydration.
- [x] Upgrade whole-library backup to schema 2 and migrate schema-1 backups to mixed schema-2
      documents.
- [x] Preserve restore preview, merge/replace, record-ID remapping, skipped-record diagnostics,
      optional draft restore, current-data preservation, single-use apply, and all-invalid
      anti-wipe behavior.
- [x] Label all template/share actions as selected-loadout-only, disable them for empty/no-selection
      sets, and retain equipment/title omission warnings.
- [x] Make in-set template import replace only the selected snapshot after confirmation and preserve
      entry metadata.
- [x] Test localStorage quota/write failure, pagehide failure, revision conflict, malformed set
      transfer, mixed backups, duplicate IDs, all ingress paths, and maximum-size valid sets.

**Verification:**

- `npm run test:run -- src/app/build-set-selectors.test.ts src/app/build-set-transfer.test.ts src/app/build-set-transfer-dialog.test.tsx src/app/backup-restore.test.ts src/app/template-workflow.test.ts src/app/template-dialogs.test.tsx src/app/share-url.test.ts`
- `npm run typecheck`

### Phase 7: BW-1606 Docs, Verification, and Closeout (~5%)

**Files:**

- `README.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/equipment-editor.md`
- `compendium/title-ranks.md`
- `compendium/multi-build-workspace.md`
- `work/tickets/16-heroes-and-henchmen/EPIC.md`
- `work/tickets/16-heroes-and-henchmen/BW-160*.md`
- `work/tickets/17-party-and-hero-builder/EPIC.md`
- `work/sprints/SPRINT-017.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/*`

**Tasks:**

- [x] Document build sets as multiple complete loadouts, not party members.
- [x] Document build-set contracts, storage schema 2, schema-1 migration, one active editor,
      materialized snapshots, variants, comparison, aggregate validation, backup/restore, transfer,
      and selected-loadout sharing.
- [x] Record explicit deferrals for hero catalogs, henchmen, portraits, AI behavior, party slots,
      party validation, paw-ned2/team templates, guide authoring, backend sync, collaboration, and
      remote media.
- [x] Add EPIC-17 handoff notes stating that party-specific labels, validation, and sharing adapt
      build sets rather than changing the neutral EPIC-16 base.
- [x] Measure representative and 16-entry maximum serialized sizes, summary rendering, validation,
      autosave, pagehide, reload, and switch interaction behavior.
- [x] Manually smoke-test single-build flow, create set, empty set, duplicate variant, edit-switch,
      comparison, save/load set, backup/restore, set transfer, share selected loadout, keyboard
      actions, long labels, storage unavailable/quota failure, and narrow width.
- [x] Run `npm run test:run -- src/app test/domain`.
- [x] Run `npm run verify`.
- [x] Run `git diff --check`.
- [x] Mark BW-1601 through BW-1606, EPIC-16, SPRINT-017, ledger, and result manifest complete only
      after docs and verification pass.

**Verification:**

- `npm run test:run -- src/app test/domain`
- `npm run verify`
- `git diff --check`

## Files Summary

| File                                                                  | Action        | Purpose                                                                                               |
| --------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `src/domain/build-set.ts`                                             | Create        | Framework-neutral build-set contracts, entry metadata, bounds, and structural helpers.                |
| `src/domain/index.ts`                                                 | Modify        | Export build-set contracts and helpers.                                                               |
| `test/domain/build-set.test.ts`                                       | Create        | Cover domain invariants, edge cases, clone identity, ordering, and bounds.                            |
| `src/app/build-set-state.ts`                                          | Create        | Own active/inactive entry transitions, materialization, and structural actions.                       |
| `src/app/build-set-selectors.ts`                                      | Create        | Entry summaries, aggregate validation, library projections, and navigator views.                      |
| `src/app/build-set-comparison.ts`                                     | Create        | Deterministic two-entry difference model.                                                             |
| `src/app/build-set-transfer.ts`                                       | Create        | Versioned inert build-set JSON export/import and preview/apply helpers.                               |
| `src/app/workspace-state.ts`                                          | Modify        | Add document-kind state, associations, dirty guards, save/update/load, and entry actions.             |
| `src/app/persistence-schema.ts`                                       | Modify        | Add schema-2 document records, build-set snapshots, migration, validators, cloning, and fingerprints. |
| `src/app/local-storage.ts`                                            | Modify        | Read/write schema 2 under `build-wars:v1` with existing failure behavior.                             |
| `src/app/backup-restore.ts`                                           | Modify        | Upgrade mixed backup/restore, schema-1 backup migration, preview, remap, and anti-wipe behavior.      |
| `src/app/library-selectors.ts`                                        | Modify        | Summarize/search/filter/sort mixed build and build-set records.                                       |
| `src/app/library-fixtures.ts`                                         | Modify        | Add build-set, migrated-v1, malformed, max-size, and mixed-library fixtures.                          |
| `src/app/components/BuildSetNavigator.tsx`                            | Create        | Render set header, compact entries, navigation, and actions.                                          |
| `src/app/components/BuildSetDialogs.tsx`                              | Create        | Add/copy, rename, notes, kind, remove, and transfer dialogs as needed.                                |
| `src/app/components/BuildSetComparison.tsx`                           | Create        | Render compact deterministic differences.                                                             |
| `src/app/components/BuildSetTransferDialog.tsx`                       | Create        | Provide set JSON preview, export, import, and apply UI.                                               |
| `src/app/components/LibraryPanel.tsx`                                 | Modify        | Add mixed-record rows and build-set entry points.                                                     |
| `src/app/components/LibraryDialogs.tsx`                               | Modify        | Include build sets in backup/restore previews and actions.                                            |
| `src/app/components/ShareControls.tsx`                                | Modify        | Keep sharing selected-loadout-only and explain whole-set transfer boundary.                           |
| `src/app/components/TemplateDialogs.tsx`                              | Modify        | Keep template import/export scoped to selected entry in build-set mode.                               |
| `src/app/template-workflow.ts`                                        | Modify/test   | Preserve selected-loadout import/export fidelity and replacement warnings.                            |
| `src/app/share-url.ts`                                                | Test/modify   | Preserve existing URL grammar and startup single-build import behavior.                               |
| `src/app/App.tsx`                                                     | Modify        | Compose document kind, navigator, active editor, autosave, and empty-set behavior.                    |
| `src/app/styles.css`                                                  | Modify        | Add responsive navigator, summary, comparison, transfer, focus, and overflow styles.                  |
| `src/app/*build-set*.test.tsx?`                                       | Create        | Cover state, selectors, navigator, comparison, transfer, aggregate validation, and UI flows.          |
| Existing `src/app/*test*` and `test/domain/*test*`                    | Modify        | Preserve single-build, persistence, backup, share, equipment, title, and validation regressions.      |
| `README.md`, `compendium/*.md`                                        | Modify        | Document behavior, schema, compatibility, verification, and deferred scope.                           |
| `work/tickets/16-heroes-and-henchmen/*.md`                            | Modify        | Track sprint planning and later execution evidence.                                                   |
| `work/sprints/SPRINT-017.md`, `work/sprints/ledger.tsv`, run manifest | Create/modify | Maintain sprint and ticket-burn records.                                                              |

## Definition of Done

- [x] BW-1601 through BW-1606 are implemented in dependency order and traceable to EPIC-16.
- [x] Single-build editor, local library, template import/export, share URLs, equipment editor,
      title controls, validation, backup, and restore behavior remain compatible.
- [x] `src/domain/build-set.ts` is framework-neutral, party-neutral, app-neutral, exported, and does
      not import generated data or browser/UI modules.
- [x] Build-set entries reuse `Build` as the semantic loadout payload and do not duplicate skill,
      attribute, title, or equipment fields.
- [x] Entry metadata has stable ID, bounded label, `build | variant | freeform` kind, and bounded
      notes; set metadata has stable ID and bounded name.
- [x] Empty, single-entry, multi-entry, partial, unresolved, duplicate-ID, stale-selection,
      over-limit, and malformed states are deterministic and tested.
- [x] Runtime build-set state has exactly one active `EditorState` when an entry is selected and no
      persisted active snapshot copy for that entry.
- [x] Switching selected entries is one atomic transition that materializes the outgoing editor
      before hydrating the incoming snapshot.
- [x] Save, autosave, dirty fingerprinting, validation, summaries, comparison, backup, transfer,
      restore preview, and library rows consume one shared materialized build-set view.
- [x] Switching never loses unsaved professions, mode, attributes, skill bar, PvE budget, raw
      template overlay/source facts, title ranks, semantic equipment, nested build name, or entry
      notes.
- [x] Transient dialog, tooltip, drag, keyboard, compare, collapsed, focus, scroll, and tab state is
      not persisted unless explicitly documented as workspace resume state.
- [x] Duplicating or copying loadouts creates fresh entry and nested build IDs and deep-copies all
      durable nested state.
- [x] Create-from-current, Copy Into Set, Save New, Update, Save As New, load, duplicate record, and
      delete record cannot overwrite a source single-build record or a different document kind
      implicitly.
- [x] Promotion is kind-only and does not create primary/base/party semantics.
- [x] Removing the last entry leaves a safe empty-set state with unsupported controls disabled.
- [x] `LOCAL_LIBRARY_SCHEMA_VERSION` is 2 under the unchanged `build-wars:v1` key.
- [x] Valid schema-1 libraries and backups migrate in memory without dirtying state, writing on
      read, incrementing revision, or losing IDs, metadata, savedWith facts, equipment, title ranks,
      or raw template overlays.
- [x] Unsupported versions, unknown document kinds, malformed nested snapshots, dangerous keys,
      duplicate IDs, sparse arrays, aggregate over-limit data, corrupt records, both-working-draft
      conflicts, quota failures, stale revisions, pagehide failures, and invalid drafts follow
      bounded recovery behavior.
- [x] Library rows distinguish builds from build sets and keep deterministic sort, favorites, tags,
      record notes, freshness, validation, search, filters, load, duplicate, delete, share, backup,
      and restore behavior.
- [x] Build-set summaries use app catalog views through `src/app/catalogs.ts` and do not import
      generated JSON in leaf components.
- [x] The navigator shows labels, kinds, profession/mode, eight skill states, equipment/title
      indicators, validation status, unresolved state, notes indicator, selected state, empty state,
      one-entry state, overflow, and narrow-width states.
- [x] Selection, add, duplicate, remove, move, rename, notes, kind, promote, compare, transfer, and
      menu/dialog flows work with keyboard and pointer interactions, explicit labels, focus
      restoration, and live-region messaging where appropriate.
- [x] Long labels, badges, action controls, comparison text, and transfer diagnostics do not overlap
      or cause page-level horizontal scroll at supported widths.
- [x] Representative 16-entry sets meet documented serialized-size, autosave, pagehide, reload,
      validation, summary, and switch-interaction budgets.
- [x] Comparison is deterministic under catalog ordering changes and distinguishes empty,
      configured, stale, retained, and unresolved facts without recommendations.
- [x] Aggregate validation reuses existing per-entry `validateBuild`, adds no party rules, and does
      not bump `RULE_ENGINE_VERSION` unless domain issue contracts change.
- [x] Share URLs and skill-template bytes remain one selected skill-template loadout and keep the
      existing URL grammar and cap.
- [x] Empty/no-selection build sets cannot invoke selected-loadout template/share actions.
- [x] In-set template import replaces only the selected entry snapshot after confirmation and
      preserves entry metadata.
- [x] Build-set transfer JSON is versioned, deterministic, inert, bounded, previewed, dangerous-key
      safe, and hydrated as an unassociated draft through the dirty guard.
- [x] Whole-library backup schema 2 preserves mixed records and optional mixed working drafts, and
      schema-1 backup restore still works.
- [x] Restore keeps preview, merge/replace, library-record ID remapping, skipped-record diagnostics,
      draft opt-in, single-use apply, current-data preservation, and all-invalid anti-wipe behavior.
- [x] Documentation explicitly defers hero catalogs, henchmen, portraits, AI behavior, party slots,
      party validation, paw-ned2/team templates, guide authoring, backend sync, collaboration, and
      remote media.
- [x] `npm run test:run -- src/app test/domain` passes.
- [x] `npm run verify` passes.
- [x] `git diff --check` passes.
- [x] BW-1601 through BW-1606, EPIC-16, SPRINT-017, `work/sprints/ledger.tsv`, and ticket-burn
      manifests agree on status, scope, evidence, and deferred work.

## Risks & Mitigations

| Risk                                                                                                       | Likelihood | Impact   | Mitigation                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active editor changes are not materialized before switch, save, autosave, validation, backup, or transfer. | Medium     | Critical | Centralize materialization, make switching atomic, and test every durable editor field across edit-switch-save-reload sequences.                                     |
| Schema migration drops old single-build data or writes schema 2 on read.                                   | Medium     | Critical | Freeze schema-1 fixtures first, preserve every field, compare fingerprints, assert no `setItem`, and write only after authorized mutation.                           |
| Keeping schema 2 under `build-wars:v1` confuses downgrade behavior.                                        | Medium     | High     | Treat the key as discovery only, dispatch by payload schema, document unsupported/write-blocked behavior, and avoid dual writes.                                     |
| Document, record, set, entry, and nested build IDs are confused during duplicate/save/restore.             | Medium     | High     | Use explicit types/scopes, re-key copies deterministically, clear kind-mismatched associations, and test restore/remap cases.                                        |
| Valid large sets exceed localStorage or slow summary/validation paths.                                     | Medium     | High     | Cap sets at 16 entries, bound aggregate loadouts, measure representative/max payloads, memoize by snapshot fingerprint, and handle quota/pagehide failure.           |
| Mixed document records spread conditionals through the app.                                                | Medium     | Medium   | Normalize at persistence boundaries, use exhaustive discriminant switches, centralize selectors/actions, and keep single-build regressions as phase gates.           |
| Navigator actions become inaccessible or too dense.                                                        | Medium     | High     | Use native controls, stable focus order, menus for secondary actions, focus restoration, live messages, responsive wrapping, and component tests.                    |
| Comparison expands into recommendations or party analysis.                                                 | Medium     | Medium   | Keep comparison read-only and field-based; defer roles, synergy, primary semantics, and optimization.                                                                |
| Aggregate validation is mistaken for party legality.                                                       | High       | High     | Validate each entry independently, label completeness as authoring status, add no cross-entry rule inputs, and document EPIC-17 handoff.                             |
| Build-set transfer is confused with external team-template support.                                        | High       | Medium   | Use a Build Wars JSON kind, keep share/template selected-loadout-only, and explicitly defer paw-ned2/team formats.                                                   |
| Imported or restored JSON is malicious or oversized.                                                       | Medium     | High     | Bound bytes/arrays/strings/diagnostics, reject dangerous keys recursively, reconstruct fields from `unknown`, preview before apply, and preserve anti-wipe behavior. |
| Scope expands into party builder or multi-pane editing.                                                    | Medium     | High     | Keep one active editor, neutral entry kinds, compact summaries, no party fields, no hero data, and no new dependencies.                                              |

## Security Considerations

- Treat local storage, backups, build-set transfer files, labels, notes, IDs, raw template overlays,
  title overrides, equipment selections, and nested snapshots as untrusted input.
- Reject prototype-dangerous keys recursively before migration, preview, hydration, stable
  serialization, or restore apply.
- Reconstruct accepted records, documents, sets, entries, and snapshots field by field; do not
  spread unknown objects into runtime state.
- Bound input bytes, record count, set count, entries per set, aggregate nested loadouts, strings,
  arrays, diagnostics, validation work, and comparison output.
- Require dense arrays, supported versions, supported discriminants, finite safe integers, unique
  IDs in each scope, and valid `lastSelectedEntryId` repair or rejection.
- Render all user-controlled text as escaped React text. Do not add source-authored HTML,
  markdown execution, `dangerouslySetInnerHTML`, dynamic imports, or URL dereferencing.
- Native export and backup are inert JSON downloads. Sanitize filenames, create/revoke object URLs,
  and do not upload data or fetch embedded resources.
- Preserve explicit confirmations for destructive replacement, restore replace, record delete,
  meaningful entry removal, and template import over local-only state.
- Keep generated catalogs, manifests, QA reports, source snapshots, source plans, and local
  filesystem paths out of build-set transfer files.
- Add no backend, account identifiers, auth, telemetry, analytics, service workers, collaboration
  channel, remote media, network request, or dependency.

## Dependencies

- `EPIC-08` / `SPRINT-009`: single-build editor shell, `EditorState`, reducers, selectors, catalog
  boundary, validation panel, template UI, and responsive patterns.
- `EPIC-09` / `SPRINT-010`: `build-wars:v1`, working draft, saved records, dirty guards, local
  library, backup/restore, revision conflicts, freshness, and skill-template share URLs.
- `EPIC-13` / `SPRINT-014`: nullable semantic `EquipmentLoadout` on `Build` and equipment
  validation contracts.
- `EPIC-14` / `SPRINT-015`: equipment editor, equipment summaries, equipment persistence, and
  omission warnings.
- `EPIC-15` / `SPRINT-016`: `Build.schemaVersion = 2`, title-rank overrides, title controls,
  title validation, and title omission warnings.
- Existing promoted EPIC-03, EPIC-04, EPIC-10, EPIC-11, and EPIC-12 catalogs through
  `src/app/catalogs.ts`.
- Existing React, TypeScript, Vite, Vitest, Testing Library, ESLint, Prettier, npm, and ticket-burn
  tooling.
- EPIC-17 is downstream. It should add party-specific labels, validation, sharing, and external
  formats on top of EPIC-16 build sets.

## Open Questions

No open question blocks execution. The final sprint binds the routine planning choices:

1. Build-set domain entries use `Build`; app persistence uses `PersistedBuildSnapshot`.
2. Envelope schema advances to version 2 under `build-wars:v1`.
3. Saved and working documents normalize to a discriminated `build | build-set` model.
4. Selection is app-owned `lastSelectedEntryId`, not domain authored content.
5. Entry cap is 16.
6. Last-entry removal leaves an empty set.
7. Promotion is kind-only and ordering is separate.
8. Entry metadata ships as label, kind, and notes only.
9. Library filters match build sets by any contained entry.
10. Compact comparison and inert build-set JSON transfer are in scope, after durability gates.
