---
id: SPRINT-017
title: Multi-Build Workspace
status: draft
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

This sprint extends the current local-first single-character editor into a multi-build workspace:
one document can contain several complete authored loadouts, and one selected loadout remains wired
to the existing editor at a time. Each loadout keeps the durable facts that already make a single
build useful: `Build`, PvE budget controls, raw template overlay/source facts, title-rank overrides,
semantic equipment, and local notes.

The implementation should be a workspace/document-model increment, not a party-builder increment.
Build sets are neutral containers for variants, comparisons, future parties, farming setups, or
freeform groups. This sprint does not add hero catalogs, henchmen, portraits, AI behavior, party
slots, party-wide legality, paw-ned2/team templates, guide publishing, collaboration, routes,
backend sync, or remote media.

The critical architectural rule is to keep the domain model and the app persistence model separate.
`src/domain/build-set.ts` should describe framework-neutral build-set identity, entry ordering, entry
metadata, selected-entry identity, and `Build` payload semantics. App persistence should store a
`PersistedBuildSnapshot` per entry so non-selected loadouts keep their PvE budget and raw-template
facts even though the visible editor only hydrates one entry.

Single-build users must not pay a complexity cost. A blank app open, single saved build load, skill
template import, share URL import, equipment editing, title controls, and current local library
flows continue to behave as one-build workflows unless the user explicitly creates or loads a build
set.

Binding defaults for execution:

- Add build sets as a first-class local document kind beside saved single builds.
- Keep one browser storage key, `build-wars:v1`.
- Advance the local-library envelope to schema version 2 if execution confirms that saved build-set
  records and build-set working drafts are too large a shape change for version 1; otherwise record
  why optional version-1 fields are safer before implementation.
- Prefer `PersistedBuildSnapshot` as the per-entry durable payload, not bare `Build`.
- Mirror active editor changes into the selected build-set entry after every durable editor
  mutation and before every selected-entry switch, save, autosave, backup, export, or validation
  pass.
- Keep build-set entry kinds limited to neutral labels such as `build`, `variant`, and `freeform`.
- Keep share URLs skill-template-only. Whole build-set transfer is native inert JSON and local
  backup/restore only.

## Use Cases

1. **Stay single-build**: A user who never creates a build set can keep using the existing editor,
   save/load library records, share a skill-template URL, import templates, edit equipment, and edit
   title ranks without seeing required build-set decisions.
2. **Create a set from the current build**: A user can turn the current draft into a build set with
   one selected entry and continue editing the same visible loadout.
3. **Add another loadout**: A user can add a blank or copied loadout to the current set, label it,
   and switch to it without losing unsaved edits in the previous entry.
4. **Duplicate a variant**: A user can duplicate the selected loadout, get a new entry ID and label,
   edit skills, attributes, equipment, title ranks, notes, or PvE budget independently, and keep the
   original intact.
5. **Scan several loadouts**: A user can see compact summaries for non-selected entries: label,
   kind, profession pair, mode, skill bar, equipment presence, title override presence, notes
   indicator, and validation status.
6. **Reorder and rename**: A user can rename, reorder, remove, and retag entries through explicit
   controls that work by pointer and keyboard.
7. **Promote a variant**: A user can promote a selected variant to the primary entry without
   overwriting or deleting the other entries or any separately saved single-build record.
8. **Compare variants**: A user can open a compact deterministic comparison for selected entries
   that highlights skill-slot, profession, mode, attribute, title-rank, and equipment differences
   without recommending an optimized build.
9. **Validate the group**: A user can see aggregate build-set status and drill into each loadout's
   existing `validateBuild` issues without any party-wide legality claims.
10. **Save and recover locally**: Working-draft autosave, save new, update, save as new, duplicate,
    load, backup, restore, corrupt-data recovery, and storage failure states preserve build sets
    and remain explicit about write-blocked data.
11. **Export honestly**: A user can share the selected loadout through the existing skill-template
    URL path and receives clear warnings that equipment, title overrides, notes, and the rest of the
    build set are not included.
12. **Restore malformed data safely**: A bad build-set record in storage or backup is skipped or
    quarantined without corrupting valid single-build records or other accepted build sets.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Domain model | Framework-neutral build-set contracts, ordered entries, stable IDs, selected entry ID, labels, descriptions, notes, neutral entry kind, empty/single/multi/partial states, and helpers for normalization. | Party slots, party size presets, hero names, henchmen, mercenary rules, portraits, AI notes, party composition legality, guide records, recommendations. |
| App state | One active `EditorState`, an optional active build-set draft, selected-entry mirroring, add/duplicate/remove/reorder/rename/promote actions, dirty guards, and storage durability. | Multiple full editors rendered at once, cross-tab sync, realtime collaboration, account sync, new routes. |
| Persistence | Single-build compatibility, build-set working drafts, saved build-set records, schema migration, bounded parsing, backup/restore, record remapping, and corrupt-data recovery. | IndexedDB, backend records, hosted shares, source snapshots in runtime storage, unbounded JSON import. |
| UI | Compact build-set navigator, summaries, entry actions, empty and one-entry states, overflow handling, responsive layout, keyboard controls, and selected editor integration. | Marketing pages, party member portraits, remote images, drag/drop between full editor panes, route-level party builder. |
| Variants | Duplicate, compare, rename, reorder, remove, promote, entry notes, deterministic diff facts, and independent local IDs. | Optimization, synergy analysis, community build metadata, guide authoring, automated recommendations. |
| Validation | Existing per-loadout `validateBuild`, aggregate counts/status, unresolved/incomplete indicators, and clear no-party-rules language. | Party-wide legality, mode harmonization as an error, hero ownership, PvX/community legality. |
| Sharing | Selected-loadout skill-template sharing plus native inert JSON export/import or backup recovery for full build sets. | Encoding build sets into `#bw=1` URLs, paw-ned2/team-code export, short links, hosted collaboration. |

### Domain Contract

Add `src/domain/build-set.ts` and export it from `src/domain/index.ts`. The exact TypeScript names
can follow local style, but the durable concepts should be explicit:

```text
BUILD_SET_SCHEMA_VERSION = 1

BuildSetEntryKind = "build" | "variant" | "freeform"

BuildSetEntry
  id: BuildSetEntryId
  label: string
  kind: BuildSetEntryKind
  description: string | null
  notes: string | null
  build: Build

BuildSet
  schemaVersion: 1
  id: AuthoredDocumentId
  name: string
  selectedEntryId: BuildSetEntryId | null
  entries: readonly BuildSetEntry[]
```

Domain helpers should cover:

- bounded ID, label, description, and notes normalization
- duplicate entry ID detection
- selected-entry repair policy for empty sets and stale selected IDs
- entry count bounds, with a planning default cap of 16 entries
- deterministic add, duplicate, remove, reorder, rename, kind change, notes, and promote semantics
- projection from app snapshots to domain `BuildSet` for validation and summaries

`src/domain/party.ts` and `src/domain/guide.ts` remain untouched except for any documentation
comments needed to make the deferral clear. Do not reuse `PartyBuild` as the base shape for
EPIC-16.

### App Snapshot Contract

App persistence should not force `src/domain` to import app editor types. Store build-set entries as
app-owned snapshots that embed the existing single-build durable snapshot:

```text
PersistedBuildSetEntrySnapshot
  id: BuildSetEntryId
  label: string
  kind: BuildSetEntryKind
  description: string | null
  notes: string | null
  snapshot: PersistedBuildSnapshot

PersistedBuildSetSnapshot
  schemaVersion: 1
  id: AuthoredDocumentId
  name: string
  selectedEntryId: BuildSetEntryId | null
  entries: readonly PersistedBuildSetEntrySnapshot[]
```

This keeps raw template overlays and PvE budget state durable per entry without leaking app-specific
state into `Build`. Transient UI state remains transient: browser filters, selected skill slot,
dialogs, tooltip state, drag state, keyboard placement, batch size, and collapsed/overflow UI
preferences are reconstructed from defaults unless execution records a specific reason to persist a
small preference.

### Workspace State

`WorkspaceState` should continue to expose one active `EditorState` to existing editor components.
Build-set mode adds a build-set draft beside that editor:

```text
WorkspaceState
  editor: EditorState
  activeDocumentKind: "build" | "build-set"
  activeBuildSet: BuildSetWorkspaceDraft | null
  draftSession: DraftSessionState
  library: WorkspaceLibraryState
  storage: WorkspaceStorageState
  restore: WorkspaceRestoreState

BuildSetWorkspaceDraft
  snapshot: PersistedBuildSetSnapshot
  selectedEntryId: BuildSetEntryId | null
```

Reducer invariants:

- In single-build mode, `activeBuildSet` is `null` and current behavior remains the baseline.
- In build-set mode, `editor` is always the hydrated selected entry. If no entry is selected, the
  editor is a blank inert editor used only to keep components safe.
- Every editor mutation in build-set mode writes `createPersistedBuildSnapshot(nextEditor)` into
  the selected entry before dirty/fingerprint calculations complete.
- Every selected-entry switch first snapshots the current editor into the current entry, then
  hydrates the target entry through `hydrateEditorFromSnapshot`.
- Save, autosave, update, backup, restore preview, export, validation, and library summary paths
  call one shared `materializeActiveBuildSetSnapshot(state)` helper so they cannot read stale entry
  data.
- Loading a single-build record exits build-set mode only through the existing dirty guard.
- Loading a build-set record enters build-set mode, repairs or selects the stored selected entry,
  and hydrates exactly one active editor.

### Persistence And Library

Execution must choose and record one storage migration strategy before implementation:

- **Preferred**: keep `LOCAL_LIBRARY_STORAGE_KEY = "build-wars:v1"` and migrate the outer envelope
  to schema version 2, where old schema-1 records become version-2 single-build records in memory.
- **Fallback**: keep outer schema version 1 and add optional build-set fields only if tests prove
  this is less risky and the parser can still reject malformed build-set data deterministically.

The saved-record surface should become kind-aware:

```text
PersistedSavedDocumentRecord =
  | PersistedSavedBuildRecord
  | PersistedSavedBuildSetRecord

PersistedSavedBuildSetRecord
  id: LocalBuildRecordId
  kind: "build-set"
  name: string
  createdAt: string
  updatedAt: string
  favorite: boolean
  tags: readonly string[]
  notes: string | null
  snapshot: PersistedBuildSetSnapshot
  savedWith: PersistedCatalogFacts
```

If local implementation cost is lower with parallel `savedBuilds` and `savedBuildSets` arrays, that
is acceptable only if selectors, backup/restore, IDs, duplicate handling, and dirty associations
remain type-safe and documented. Do not make components infer record kind from the shape of
`snapshot`.

Library selectors should summarize single builds and build sets in one panel. Build-set rows show
document kind, entry count, selected/primary profession pair, aggregate validation state, freshness,
tags, favorite, notes preview, and current saved-with facts. Existing single-build filters remain
valid; build sets match a query by set name, entry labels, notes, tags, professions, skill names,
and unresolved raw labels across entries.

### UI Composition

`src/app/App.tsx` remains the single route and shell. The left column keeps library, profession/mode,
attributes, template controls, share controls, and validation for the active editor. Build-set
navigation should live above or near the main `EditorWorkspaceTabs` so several loadouts stay visible
while the selected loadout is edited.

Recommended components:

- `BuildSetNavigator` for entry selection, add, duplicate, remove, reorder, rename, kind, notes,
  promote, and overflow actions.
- `BuildSetEntrySummary` for compact per-entry labels, skill strip, profession/mode, equipment and
  title indicators, validation/freshness status, and unresolved state.
- `BuildSetComparePanel` only if a compact deterministic selector can drive it without broad UI
  complexity.

Accessible behavior is part of the architecture, not polish. Entry selection, reordering,
renaming, duplicate, remove, and promote actions need deterministic labels, keyboard operation,
focus restoration, and no horizontal overflow at narrow widths.

### Validation And Export

Aggregate validation is a projection over existing per-entry validation:

```text
PersistedBuildSetSnapshot.entries
  -> hydrate each PersistedBuildSnapshot as needed
  -> selectValidationView / validateBuild per loadout
  -> BuildSetValidationSummary
  -> navigator badges, aggregate ValidationPanel group, library row diagnostics, backup/export warnings
```

The aggregate result can count errors, warnings, unresolved entries, incomplete entries, stale
catalog facts, and storage warnings. It must not add party-level errors. Mixed modes can be
reported as informational comparison facts, not legality failures.

Sharing boundaries stay explicit:

- Current `#bw=1&code=...` URLs remain selected-loadout skill-template URLs.
- Selecting Share on a build-set row either targets the selected entry or asks the user to choose an
  entry; it does not serialize the whole set into the fragment.
- Whole build-set recovery/export uses inert JSON validated by the same backup/restore schema.
- Export/import warnings compose with existing equipment and title-rank omission warnings.

## Implementation

### Phase 0: Baseline, Decisions, And Traceability

**Files:**

- `work/sprints/SPRINT-017.md`
- `work/tickets/16-heroes-and-henchmen/*.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/*`
- Current workspace, persistence, library, and app tests

**Tasks:**

- [ ] Mark `SPRINT-017` and BW-1601 through BW-1606 in progress when execution starts.
- [ ] Run a focused baseline for single-build open/edit/save/load/share, local library parsing,
      backup/restore, equipment persistence, title-rank persistence, and validation.
- [ ] Record the binding decision for outer envelope schema version 2 versus optional schema-1
      fields before writing persistence code.
- [ ] Freeze entry count cap, selected-entry repair policy, delete-last-entry behavior, duplicate
      build-ID behavior, promote behavior, native JSON export boundary, and library row strategy.
- [ ] Confirm no hero, henchman, party-slot, paw-ned2, guide, backend, route, or generated-data
      pipeline work is needed for this sprint.

### Phase 1: BW-1601 Build-Set Contracts

**Files:**

- `src/domain/build-set.ts`
- `src/domain/index.ts`
- `src/domain/build.ts`
- `src/domain/party.ts`
- `src/domain/guide.ts`
- `test/domain/build-set.test.ts`
- `test/domain/contracts.test.ts`

**Tasks:**

- [ ] Add framework-neutral `BuildSet`, `BuildSetEntry`, `BuildSetEntryId`,
      `BuildSetEntryKind`, schema version, constants, and fixtures.
- [ ] Implement normalization and mutation helpers for create, add, duplicate metadata, remove,
      reorder, rename, kind change, notes, selected-entry repair, and promote.
- [ ] Ensure entries reuse `Build` rather than duplicating profession, skill, title, or equipment
      fields.
- [ ] Represent empty sets with no selected entry, single-entry sets without special cases, and
      partial loadouts through ordinary partial `Build` state.
- [ ] Reject or diagnose duplicate IDs, stale selected IDs, unsafe keys, oversized strings,
      over-limit entries, and malformed entry order.
- [ ] Keep party/guide placeholder types out of the build-set payload and document the deferral if
      necessary.
- [ ] Verify with focused domain and contract tests plus `npm run typecheck`.

### Phase 2: BW-1602 Workspace State, Persistence, And Library Records

**Files:**

- `src/app/build-set-state.ts`
- `src/app/workspace-state.ts`
- `src/app/persistence-schema.ts`
- `src/app/local-storage.ts`
- `src/app/backup-restore.ts`
- `src/app/library-fixtures.ts`
- `src/app/library-selectors.ts`
- `src/app/editor-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/backup-restore.test.ts`
- `src/app/library-selectors.test.ts`

**Tasks:**

- [ ] Add app-owned `PersistedBuildSetSnapshot` and `PersistedBuildSetEntrySnapshot` contracts
      whose entry payload is `PersistedBuildSnapshot`.
- [ ] Add kind-aware saved records and working drafts while preserving old single-build records and
      the `build-wars:v1` storage key.
- [ ] Implement migration from existing local-library data, including old working drafts, old saved
      records, schema-1 nested builds, and existing equipment/title state.
- [ ] Add workspace actions for create build set from draft, new blank set, add entry, duplicate
      entry, select entry, remove entry, reorder entries, rename entry, set kind, set notes, promote
      entry, save new set, update associated set, save set as new, and load set record.
- [ ] Implement active-editor mirroring so editor mutations, entry switching, saves, autosave,
      restore, export, and validation always materialize current selected-entry changes.
- [ ] Preserve dirty guards and saved-record association semantics across single-build and build-set
      document kinds.
- [ ] Bound and validate build-set storage: entry count, IDs, labels, descriptions, notes, nested
      snapshots, duplicate IDs, stale selected IDs, unknown record kinds, dangerous keys, and
      unsupported schema versions.
- [ ] Extend backup/restore preview, merge, replace, ID remapping, skipped-record accounting, and
      optional draft restore to include build sets.
- [ ] Verify focused reducer, migration, persistence, local-storage, backup/restore, and library
      tests.

### Phase 3: BW-1603 Navigation, Summaries, And Responsive Editor Integration

**Files:**

- `src/app/build-set-selectors.ts`
- `src/app/editor-selectors.ts`
- `src/app/equipment-selectors.ts`
- `src/app/title-rank-selectors.ts`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/components/BuildSetEntrySummary.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/components/LibraryDialogs.tsx`
- `src/app/App.tsx`
- `src/app/styles.css`
- `src/app/App.test.tsx`
- `src/app/build-set-selectors.test.ts`
- `src/app/build-set-navigator.test.tsx`
- Existing selector/component tests touched by summaries

**Tasks:**

- [ ] Build summary selectors for each entry using app catalog views, raw overlay labels, equipment
      summary selectors, title override facts, and per-entry validation.
- [ ] Render a compact navigator above or beside the main editor tabs without changing routes or
      nesting major editor panels inside decorative cards.
- [ ] Show empty, one-entry, multi-entry, selected, invalid, unresolved, stale, and overflow states.
- [ ] Support add, duplicate, select, move earlier/later, rename, notes, kind, remove, and promote
      actions with accessible labels and deterministic focus behavior.
- [ ] Keep the selected loadout wired into existing profession/mode, attributes, title, skills,
      equipment, template, share, and validation controls.
- [ ] Ensure long labels, compact skill strips, validation badges, and action controls do not
      overlap at desktop or narrow widths.
- [ ] Extend library rows/dialogs to show build-set records without degrading existing single-build
      row actions.
- [ ] Verify with selector, component, keyboard, pointer, empty-state, overflow, and responsive
      tests.

### Phase 4: BW-1604 Variant Workflows And Comparison

**Files:**

- `src/app/build-set-state.ts`
- `src/app/build-set-selectors.ts`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/components/BuildSetComparePanel.tsx`
- `src/app/components/BuildSetEntrySummary.tsx`
- `src/app/styles.css`
- `src/app/build-set-state.test.ts`
- `src/app/build-set-selectors.test.ts`
- `src/app/build-set-compare.test.tsx`

**Tasks:**

- [ ] Implement duplicate-as-variant from the selected entry with a new entry ID, new build ID,
      deterministic label, copied snapshot facts, independent notes, and no saved-record overwrite.
- [ ] Define promote as an explicit metadata/order operation: selected entry becomes the primary
      entry and kind `build` while other entries remain present unless the user removes them.
- [ ] Add deterministic compare facts for profession/mode, skill slots, attributes, title
      overrides, equipment presence/details where modeled, PvE budget, notes, and unresolved raw
      facts.
- [ ] Keep comparison informational. Do not infer better/worse choices, party roles, build synergy,
      hero behavior, or guide recommendations.
- [ ] Ensure remove-last-entry behavior is explicit and leaves either an empty set or a new blank
      entry according to the Phase 0 decision.
- [ ] Test duplicate, edit independence, compare, rename, reorder, remove, promote, notes, selected
      entry after removal, and saved-record association behavior.

### Phase 5: BW-1605 Aggregate Validation, Backup/Restore, And Export Boundaries

**Files:**

- `src/domain/validation.ts`
- `src/domain/rule-engine.ts`
- `src/app/build-set-selectors.ts`
- `src/app/editor-selectors.ts`
- `src/app/library-selectors.ts`
- `src/app/components/ValidationPanel.tsx`
- `src/app/components/ShareControls.tsx`
- `src/app/components/LibraryDialogs.tsx`
- `src/app/backup-restore.ts`
- `src/app/template-workflow.ts`
- `src/app/share-url.ts`
- `test/domain/rule-engine.test.ts`
- `src/app/build-set-validation.test.ts`
- `src/app/share-url.test.ts`
- `src/app/template-workflow.test.ts`
- `src/app/backup-restore.test.ts`

**Tasks:**

- [ ] Reuse existing `validateBuild` for every build-set entry and produce an aggregate app-level
      summary for counts, unresolved state, incomplete loadouts, freshness, and blocked export
      reasons.
- [ ] Add validation and library presentation that points to the affected entry and selected
      loadout without inventing party-wide legality rules.
- [ ] Preserve rule-engine behavior for a single build; do not advance `RULE_ENGINE_VERSION` unless
      domain issue contracts actually change.
- [ ] Extend backup/restore schema tests to cover build sets, malformed nested entries, duplicate
      entry IDs, duplicate incoming records, current-ID conflicts, optional working drafts, and
      merge/replace previews.
- [ ] Keep current share URL grammar and skill-template export path single-build. Share selected
      entry only, with warnings that the rest of the set, notes, equipment, and title overrides are
      local-only where applicable.
- [ ] Add native JSON export/import or reuse backup recovery for current build sets only after
      proving the same parser, dangerous-key checks, bounds, preview, and confirmation behavior
      apply.
- [ ] Verify with focused app/domain tests for aggregate status, selected-entry share warnings,
      backup/restore, and single-build share regressions.

### Phase 6: BW-1606 Docs, Verification, And Closeout

**Files:**

- `README.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/equipment-editor.md`
- `compendium/title-ranks.md`
- `compendium/multi-build-workspace.md`
- `work/tickets/16-heroes-and-henchmen/*.md`
- `work/tickets/17-party-and-hero-builder/EPIC.md`
- `work/sprints/SPRINT-017.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/*`

**Tasks:**

- [ ] Document build sets as multiple complete loadouts, not party members.
- [ ] Document domain/app snapshot separation, storage schema decision, migration behavior,
      selected-entry mirroring, library behavior, aggregate validation, backup/restore, and share
      boundaries.
- [ ] Record explicit deferrals for hero catalogs, henchmen, portraits, party slots, paw-ned2/team
      templates, party validation, guide authoring, backend sync, and remote media.
- [ ] Add or update EPIC-17 handoff notes only to clarify party-specific labels, validation, and
      sharing ownership.
- [ ] Run manual smoke checks for single-build flow, create set, duplicate variant, switch entries,
      edit equipment/title/skills per entry, save/load set, backup/restore, share selected entry,
      keyboard actions, long labels, empty set, and narrow width.
- [ ] Run `npm run test:run -- src/app test/domain`.
- [ ] Run `npm run verify`.
- [ ] Run `git diff --check`.
- [ ] Mark BW-1601 through BW-1606, EPIC-16, SPRINT-017, ledger, and run manifest complete only
      after docs and verification pass.

## Files Summary

| Path | Action | Purpose |
| --- | --- | --- |
| `src/domain/build-set.ts` | Create | Framework-neutral build-set contracts, entry metadata, bounds, normalization, and mutation helpers. |
| `src/domain/index.ts` | Modify | Export build-set contracts and helpers. |
| `src/domain/build.ts` | Test/modify only if needed | Keep `Build` as the reusable loadout payload without duplicating fields. |
| `src/domain/party.ts`, `src/domain/guide.ts` | Leave or document | Keep party and guide placeholders out of EPIC-16 build-set semantics. |
| `src/app/build-set-state.ts` | Create | App reducer helpers for build-set operations and selected-entry snapshot mirroring. |
| `src/app/build-set-selectors.ts` | Create | Entry summaries, compare facts, aggregate validation summaries, share/export warnings, and library projections. |
| `src/app/workspace-state.ts` | Modify | Add document-kind state, active build-set draft, actions, dirty guards, save/update/load, and materialization helpers. |
| `src/app/editor-state.ts` | Modify/test | Preserve existing editor reducer behavior while supporting mirrored build-set entry edits. |
| `src/app/persistence-schema.ts` | Modify | Add build-set persisted snapshots, kind-aware records or parallel arrays, schema migration, validation, clone, serialize, and fingerprints. |
| `src/app/local-storage.ts` | Modify/test | Preserve one storage key and write/read migrated build-set-capable envelopes. |
| `src/app/backup-restore.ts` | Modify | Include build sets in backup JSON, restore previews, merge/replace, ID remapping, and skipped-record reporting. |
| `src/app/library-selectors.ts` | Modify | Summarize and filter saved single-build and build-set records together. |
| `src/app/library-fixtures.ts` | Modify | Add saved build-set and malformed build-set fixtures. |
| `src/app/components/BuildSetNavigator.tsx` | Create | Compact accessible build-set navigation and entry actions. |
| `src/app/components/BuildSetEntrySummary.tsx` | Create | Per-entry summary row/card for labels, skill strip, status, and metadata. |
| `src/app/components/BuildSetComparePanel.tsx` | Create if simple | Deterministic comparison view for selected variants without recommendations. |
| `src/app/components/LibraryPanel.tsx` | Modify | Show build-set saved records and route kind-aware actions. |
| `src/app/components/LibraryDialogs.tsx` | Modify | Preview, import, and restore build-set records safely. |
| `src/app/components/ShareControls.tsx` | Modify/test | Share selected loadout only and warn about omitted build-set data. |
| `src/app/components/ValidationPanel.tsx` | Modify/test | Surface aggregate build-set status while preserving selected-build validation. |
| `src/app/App.tsx` | Modify | Compose build-set navigator with the existing single-route editor shell. |
| `src/app/styles.css` | Modify | Responsive build-set navigator, summary, status, comparison, and overflow styles. |
| `src/app/template-workflow.ts`, `src/app/share-url.ts` | Test/modify | Keep template/share grammar single-build and add replacement/omission warnings if needed. |
| `src/app/equipment-selectors.ts`, `src/app/title-rank-selectors.ts`, `src/app/editor-selectors.ts` | Modify/test | Reuse existing summaries and validation inputs per loadout. |
| `test/domain/build-set.test.ts` | Create | Cover domain contracts, normalization, bounds, entry order, selected repair, and mutations. |
| `src/app/*build-set*.test.tsx?` | Create | Cover state, selectors, navigator, comparison, aggregate validation, and UI flows. |
| Existing `src/app/*test*` and `test/domain/*test*` | Modify | Preserve single-build, persistence, backup, share, equipment, title, and validation regressions. |
| `README.md`, `compendium/*.md` | Modify | Document shipped multi-build behavior and deferred party/hero/template scope. |
| `work/tickets/16-heroes-and-henchmen/*.md` | Modify during execution | Track ticket status, evidence, and closeout. |
| `work/sprints/SPRINT-017.md`, `work/sprints/ledger.tsv`, run manifest | Create/modify during execution | Authoritative sprint, ledger, and ticket-burn records. |

## Definition of Done

- [ ] BW-1601 through BW-1606 are implemented in dependency order and traceable to EPIC-16.
- [ ] Single-build editor, save/load, share URL, template import/export, equipment editor, title
      controls, validation, backup, and restore behavior remain compatible.
- [ ] `src/domain/build-set.ts` defines framework-neutral build-set contracts without importing
      React, DOM/browser APIs, storage, app modules, generated JSON, or data scripts.
- [ ] Build-set entries use `Build` as the semantic loadout payload and do not duplicate skill,
      attribute, title, or equipment fields.
- [ ] App persisted build-set entries store `PersistedBuildSnapshot` so PvE budget and raw template
      overlays survive for non-selected entries.
- [ ] Empty, single-entry, multi-entry, partial, malformed, stale-selected-ID, duplicate-ID, and
      over-limit build-set states are deterministic and tested.
- [ ] One active `EditorState` drives the selected loadout in build-set mode.
- [ ] Editor mutations are mirrored into the selected build-set entry before dirty-state,
      autosave, save, validation, backup, export, or selection-switch reads occur.
- [ ] Switching selected entries never loses unsaved skill, profession, mode, attribute, PvE budget,
      raw template, title-rank, equipment, or notes changes.
- [ ] Add, duplicate, remove, reorder, rename, kind, notes, and promote actions are implemented,
      bounded, accessible, and tested.
- [ ] Duplicating a loadout creates a new entry ID and independent build identity while preserving
      copied authored facts.
- [ ] Promoting a variant has explicit order/kind behavior and does not overwrite saved single
      builds, delete other entries, or mutate unrelated records.
- [ ] Local persistence supports build-set working drafts and saved build-set records while reading
      existing single-build libraries.
- [ ] The storage key remains `build-wars:v1`; any schema-version change has migration tests and
      documented fallback behavior.
- [ ] Corrupt roots, unsupported schema versions, dangerous keys, malformed records, malformed
      nested snapshots, duplicate IDs, oversized arrays, and invalid working drafts have bounded
      recovery behavior.
- [ ] Backup and restore include build sets in previews, merge, replace, ID remapping, skipped
      record counts, optional draft restore, and write-blocked recovery.
- [ ] Library rows support saved single builds and build sets with clear document kind, entry count,
      freshness, validation, resolution, tags, favorite, notes, load, duplicate, delete, rename,
      backup, restore, and share behavior.
- [ ] Build-set summaries use app catalog views through `src/app/catalogs.ts` and do not import
      generated JSON in leaf components.
- [ ] The navigator shows labels, kind, profession/mode, compact skill bars, equipment/title
      indicators, validation status, unresolved state, notes indicator, selected state, empty state,
      one-entry state, overflow, and narrow-width states.
- [ ] Long labels, action controls, badges, summaries, and comparison text do not overlap or cause
      horizontal scrolling at supported viewport widths.
- [ ] Keyboard and pointer flows cover selection, reorder, duplicate, remove, promote, rename,
      dialog close, focus restoration, and live-region messaging where appropriate.
- [ ] Aggregate validation reuses existing per-loadout `validateBuild` behavior and never invents
      party-wide legality rules.
- [ ] Aggregate status identifies invalid, unresolved, incomplete, stale, and catalog-unavailable
      loadouts by entry.
- [ ] Share URL grammar remains `#bw=1&code=...` for one selected skill-template loadout.
- [ ] Sharing or exporting from build-set context warns when the rest of the set, notes, equipment,
      title overrides, or other local-only facts are omitted.
- [ ] Native JSON export/import, if added, is recovery-focused, inert, bounded, previewed, and
      parsed by the same dangerous-key-safe validators as backup/restore.
- [ ] No hero catalog, henchman catalog, portrait media, AI behavior, party slot, party preset,
      paw-ned2/team template codec, guide authoring, backend, account, route, analytics, service
      worker, remote media fetch, or new runtime dependency is introduced.
- [ ] README and compendium docs describe build sets, storage, migration, selected-entry mirroring,
      variant workflows, aggregate validation, backup/restore, share boundaries, and deferred
      scope.
- [ ] Manual smoke checks cover single-build flow, create set, load set, duplicate variant, switch
      entries, edit selected entry, save/update, backup/restore, share selected entry, empty set,
      long labels, keyboard controls, and narrow width.
- [ ] `npm run test:run -- src/app test/domain` passes.
- [ ] `npm run verify` passes.
- [ ] `git diff --check` passes.
- [ ] Work tickets, sprint record, ledger, and run manifest agree on status, scope, decisions,
      commands, and outcomes.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Active editor changes are not written back to the selected entry before switching, saving, or autosave. | Medium | Critical | Centralize `materializeActiveBuildSetSnapshot(state)` and call it from reducer, save, validation, backup, export, and switch paths; test every mutable editor field. |
| Domain build-set contracts absorb app-only snapshot or UI concerns. | Medium | High | Keep `BuildSet` framework-neutral and put `PersistedBuildSetSnapshot` in `src/app/persistence-schema.ts`; review imports in tests. |
| Storage migration breaks existing single-build libraries. | Medium | High | Baseline current records, preserve `build-wars:v1`, migrate old shapes in memory, avoid eager writes on read, and test schema-1 build/title/equipment records. |
| Kind-aware library records create accidental overwrite between a single build and build set. | Medium | High | Use explicit record kind, unique ID generation, typed actions, and save/update guards scoped to the active document kind. |
| Build-set summaries repeatedly hydrate and validate many entries on every render. | Medium | Medium | Bound entry count, memoize summary selectors, reuse app catalog views, and keep validation projection deterministic. |
| UI grows too dense for the current single-route layout. | Medium | Medium | Keep one active editor, compact summaries, overflow controls, responsive stacking, and defer full multi-pane editing. |
| Variant compare expands into recommendations or party analysis. | Medium | Medium | Limit comparison to deterministic field differences and defer synergy, roles, and optimization. |
| Share/export language implies a whole set is represented by the skill-template URL. | High | Medium | Label share actions as selected-loadout sharing and compose omission warnings with equipment/title warnings. |
| Backup restore accepts malicious or malformed nested build-set JSON. | Low | High | Reuse dangerous-key checks, bounded schema validators, preview-first restore, and skipped-record isolation. |
| Removing the last entry surprises users or leaves invalid selected state. | Medium | Medium | Freeze behavior in Phase 0, expose confirmation, repair selection deterministically, and cover empty-set UI. |
| Existing component tests assume only one document kind. | High | Medium | Update fixtures and selectors early, keep single-build tests as regression gates, and add build-set fixtures. |

## Security

- Treat local storage, backup JSON, build-set export/import JSON, record IDs, entry IDs, labels,
  descriptions, notes, raw template overlays, and nested snapshots as untrusted input.
- Reject dangerous keys recursively before migration, hydration, preview, or restore apply.
- Reconstruct build-set records field by field; do not spread untrusted objects into runtime state.
- Bound entry count, saved record count, string lengths, notes, tags, diagnostics, nested snapshot
  size, and traversal work.
- Require dense arrays where order is semantic. Reject sparse arrays, duplicate entry IDs, stale
  selected IDs that cannot be repaired, unsupported kinds, unsupported schema versions, and unknown
  record kinds.
- Render all user labels, notes, diagnostics, skill facts, equipment facts, and raw labels as React
  text. Do not add source-authored HTML or `dangerouslySetInnerHTML`.
- Keep generated catalog imports isolated to `src/app/catalogs.ts`; build-set components receive
  app-owned view models only.
- Do not fetch remote media, wiki pages, external templates, share payloads, or hosted records.
- Keep JSON export/import inert: no script execution, no dynamic import, no URL dereference, and no
  implicit overwrite without preview and confirmation.
- Preserve explicit destructive-action confirmations for draft replacement, restore replace,
  delete record, remove meaningful entry data, and template import over local-only state.
- Do not introduce accounts, auth identifiers, telemetry, analytics, service workers, backend
  services, new npm dependencies, new Python dependencies, or environment variables.

## Dependencies

- **EPIC-08 / SPRINT-009**: current single-build editor shell, `EditorState`, skill bar/browser,
  selectors, tooltips, validation presentation, responsive app layout, and component patterns.
- **EPIC-09 / SPRINT-010**: local-library storage key, working draft, explicit saved records,
  dirty guards, backup/restore, duplicate/delete/rename/tags/notes, share URLs, freshness, and
  corrupt-data recovery.
- **EPIC-14 / SPRINT-015**: semantic equipment editor, nullable `Build.equipment`, equipment
  summaries, equipment persistence, validation inputs, and omission warnings.
- **EPIC-15 / SPRINT-016**: `Build.schemaVersion = 2`, sparse title-rank overrides, title selectors,
  title validation behavior, and title share omission warnings.
- **EPIC-06 / SPRINT-007**: `validateBuild`, validation result contracts, rule-engine versions,
  issue ordering, unresolved/complete/resolved flags, and rule-engine tests.
- **EPIC-05 / SPRINT-006**: skill-template import/export boundaries and paw-ned2 deferral evidence.
- Existing promoted EPIC-03, EPIC-04, EPIC-10, EPIC-11, and EPIC-12 catalogs through
  `src/app/catalogs.ts`.
- Existing React, TypeScript, Vite, Vitest, Testing Library, ESLint, Prettier, and ticket-burn
  tooling.
- No new package, service, database, worker, route, environment variable, source snapshot,
  generated-data profile, or external API is planned.

## Open Questions

No question should block sprint execution if Phase 0 records a conservative default, but these
decisions must be made before the affected implementation begins:

1. Should the outer local-library envelope advance to schema version 2, or should build-set fields
   be optional schema-1 additions under the existing `build-wars:v1` key?
2. Should saved documents use one kind-aware `savedRecords` array or parallel `savedBuilds` and
   `savedBuildSets` arrays?
3. What is the first-release entry cap: the planned default of 16 entries, a party-sized cap of 8,
   or a larger variant/comparison cap?
4. When the last build-set entry is removed, should the document become an empty set or immediately
   create a blank replacement entry?
5. Should duplicate-as-variant preserve raw template source facts for exact-source replay, or clear
   template source association to avoid confusing variant identity?
6. Is `Promote` only "move selected entry first and set kind to `build`", or should it also rename
   the build set and selected loadout?
7. Should entry `description` and `notes` both ship now, or should execution keep one `notes` field
   to avoid duplicating saved-record notes?
8. Should collapsed entry state remain transient UI state, or is there a specific durable
   user-preference reason to persist it?
9. Does current build-set JSON export need a standalone command, or is whole-library backup/restore
   plus selected-loadout sharing enough for EPIC-16?
10. How should library profession/mode filters match build sets: selected entry only, primary entry
    only, or any entry in the set?
11. Should mixed-mode build sets produce only comparison info, or a non-blocking warning in the
    aggregate validation panel?
