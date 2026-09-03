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

This sprint turns the current single-build workspace into a document workspace that can also hold an
ordered set of complete loadouts. A build set is deliberately neutral: it can represent variants,
comparisons, a future party, or an arbitrary collection, but it does not assign party slots, hero
identities, AI behavior, or team legality. Users continue to edit one loadout with the existing
profession, attribute, skill, title-rank, equipment, template, and validation surfaces while compact
summaries keep the other loadouts visible.

The key state decision is to represent the selected loadout as one live `EditorState` and every
non-selected loadout as a `PersistedBuildSnapshot`. Switching is one atomic reducer transition: the
outgoing editor is snapshotted, and the incoming snapshot is hydrated into the editor. There is no
second active copy that must be synchronized after every action. This preserves unsaved skills,
attributes, PvE budget facts, raw template overlays, title overrides, and equipment across repeated
switches while keeping the existing single-build reducer authoritative for editing.

The framework-neutral domain contract stores ordered entry metadata and a `Build`. The app-owned
persisted form substitutes the existing `PersistedBuildSnapshot` for that `Build`, so editor-only
facts remain durable without moving app types into `src/domain`. Stable set, entry, and nested build
IDs establish identity; array position establishes order; entry kind remains the lightweight
`build | variant | freeform` annotation. Set description and short entry notes are plain local text.

Build sets become a second local-library document kind rather than being disguised as saved builds.
The local-library envelope advances to schema version 2 under the existing `build-wars:v1` discovery
key. Schema-1 libraries migrate in memory by wrapping every old draft and saved record as a
single-build document. The normalized migration must not mark the draft dirty or trigger a write on
read alone. Older clients encountering schema 2 will follow the existing unsupported/write-blocked
path instead of silently dropping build sets.

The sprint retains explicit save/update semantics. Converting a single-build draft to a set or
copying a saved build into a set creates an unassociated set draft; it never changes the source saved
record. A set is saved and loaded as one record. Duplicating an entry creates an independent snapshot
and fresh entry/build identity. Removing or promoting an entry changes only the current set draft
until the user explicitly updates its associated saved record.

Current skill-template and share URLs remain single-build formats. Within a set they operate on the
selected loadout and retain the existing equipment/title omission warnings. Whole-library backup is
upgraded to preserve both document kinds, and a small native build-set JSON envelope provides
lossless set transfer without inventing a party/team-template codec. No backend, account, route,
runtime dependency, remote media, hero catalog, or external format is introduced.

Planning assumptions are that BW-1601 through BW-1606 are groomed and dependency ordered, the
completed EPIC-08/09/14/15 contracts are stable inputs, and one selected editor plus compact summary
cards is the smallest responsive implementation that meets the epic. The non-interactive planning
run therefore needs no interview. This draft changes planning artifacts only; implementation and
commits occur during sprint execution.

## Use Cases

1. **Keep the familiar editor**: A user who never creates a build set sees the current single-build
   editor, local saves, backup/restore, template, and sharing behavior without a new mandatory step.
2. **Create a set from current work**: A user turns the current draft or loaded saved build into a new
   unassociated set whose first entry is an independent copy of that loadout; the source record is
   unchanged.
3. **Start and recover an empty set**: A new or fully emptied set shows a focused empty state and can
   add its first blank or copied loadout without rendering a phantom editable build.
4. **Add a blank loadout**: A user adds and immediately selects a blank entry while every existing
   entry remains intact.
5. **Copy from the library**: While editing a set, a user can copy a saved single build into it. The
   new entry receives new identity and has no live link back to the saved source.
6. **Switch without losing work**: A user edits skills, attributes, PvE budget, raw template facts,
   title ranks, equipment, or the nested build name; switching away and back restores those unsaved
   changes exactly.
7. **Scan several loadouts**: Compact cards show entry label and kind, profession pair, mode, eight
   skill slots, concise equipment state, and per-loadout attention status while one editor remains
   active.
8. **Navigate accessibly**: Keyboard, pointer, and assistive-technology users can select entries,
   reach overflow actions, move entries earlier/later, and understand which loadout controls the
   editor.
9. **Duplicate a variant**: One action deep-copies the selected complete snapshot immediately after
   its source, assigns fresh entry/build IDs, chooses a deterministic `Variant N` label, marks it as
   `variant`, selects it, and leaves the source unchanged.
10. **Describe and organize entries**: A user can rename an entry, edit bounded notes, change its
    lightweight kind, or reorder it without changing its build content.
11. **Compare two entries**: A compact comparison reports deterministic profession, mode, skill-slot,
    attribute, PvE-budget, title-rank, equipment, and unresolved-overlay differences without opening
    a second editor or claiming combat synergy.
12. **Promote a variant**: Promotion changes the selected entry kind from `variant` to `build` while
    preserving its label, notes, order, IDs, and content; no other entry is demoted or deleted.
13. **Remove safely**: Removal requires an explicit confirmation, does not delete any standalone
    library record, chooses the next deterministic selection, and leaves a valid empty set when the
    final entry is removed.
14. **Save and reload the set**: Working-draft autosave, Save New, Update, Save As New, load,
    duplicate-record, browser reload, and pagehide flush preserve every entry and the last selected
    entry.
15. **Find records in one library**: Library search and filters handle both single builds and build
    sets, clearly label record kind, and match a set when any contained loadout satisfies the query or
    profession/mode filter.
16. **See group attention status**: An overview counts loadouts with errors, warnings, unresolved
    facts, or draft incompleteness and links each result to the relevant entry. It never applies
    party-wide rules.
17. **Share the selected loadout honestly**: Existing skill-template export and share URL controls
    target only the active entry and disclose local-only omissions using the current warnings.
18. **Transfer a complete set**: A user exports or imports bounded inert JSON containing set
    metadata and complete entry snapshots. Import previews diagnostics and replaces the current
    draft only through the dirty guard.
19. **Back up the mixed library**: Whole-library backup/restore preserves single-build and build-set
    records, remaps only conflicting library record IDs, and rejects malformed nested set data
    without wiping valid local records.
20. **Work with stale or partial data**: Empty sets, partial builds, unresolved catalog IDs, raw
    overlays, missing equipment, stale catalog facts, or unavailable storage stay visible and
    recoverable instead of crashing or being silently normalized away.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Domain | Framework-neutral build-set and entry contracts, stable IDs, ordered entries, set description, entry notes, lightweight kinds, nullable selection, constructors, clone/reorder/remove helpers, and empty/partial states. | Reusing `PartyBuild`, party positions, hero/henchman identities, NPC catalogs, portraits, behavior flags, role taxonomies, guide sections, recommendations. |
| Workspace | A discriminated single-build/build-set document state, exactly one active editor, inactive snapshots, atomic switching, set operations, dirty/durability behavior, and single-build preservation. | Multiple simultaneous full editors, real-time collaboration, undo history, linked records, cross-window synchronization beyond existing revision conflicts. |
| Persistence | Local-library schema 2, schema-1 migration, mixed saved records, build-set working drafts, bounded validation, stable fingerprints, local save/load, corrupt-data recovery, backup/restore, and native set transfer. | Backend storage, accounts, cloud sync, remote sharing, databases, migration of unsupported future schemas. |
| UI | Compact loadout navigator, summaries, selection, add/copy/duplicate/remove/reorder/rename/kind/notes/promote actions, comparison drawer, aggregate status, empty/single/overflow/narrow states. | Hero portraits, party formations, drag between full editors, advanced analytics, optimization, a new route, a new component library. |
| Validation | Existing `validateBuild` applied independently to each snapshot, deterministic aggregate counts, draft-completeness labeling, catalog-unavailable handling, and entry navigation. | Party composition, duplicate profession/skill rules across entries, synergy scoring, team legality, unlock/account validation. |
| Sharing | Existing selected-loadout skill-template and URL behavior, whole-library backup v2, build-set JSON transfer v1, precise omission/replacement copy. | Title/equipment in skill-template bytes, whole-set URL payloads, paw-ned2, team-template codes, hosted links, external compatibility claims. |

### Binding Decisions

1. Add `src/domain/build-set.ts`; do not extend or reuse `src/domain/party.ts`. EPIC-17 may adapt a
   build set into party semantics later, but EPIC-16 has no dependency on party or guide contracts.
2. A domain `BuildSetEntry` contains a complete `Build`, not duplicated profession, skill,
   title-rank, or equipment fields. Entry metadata contains only stable ID, label, kind, and bounded
   notes.
3. `BuildSet.entries` is the canonical order. No separately persisted numeric order can drift from
   the array. `selectedEntryId` is nullable so empty and deliberately unselected partial sets are
   representable.
4. Selected entry is durable navigation state but is excluded from the authored-content dirty
   fingerprint. Changing selection autosaves the working draft and updates durability, but does not
   falsely report that build content needs Update.
5. Collapsed cards, the comparison target, open menus/dialogs, scroll position, and editor tab are
   ephemeral workspace/UI state. They are not domain or persistence fields.
6. The persisted build-set form mirrors domain metadata and replaces each entry's `Build` with one
   existing `PersistedBuildSnapshot`. Conversion helpers and parity tests prevent the domain and
   persisted representations from drifting.
7. Runtime workspace state is a discriminated document union. A build-set entry is either active
   with one `EditorState` or inactive with one `PersistedBuildSnapshot`; the same entry never stores
   both. Exactly one entry is active when `selectedEntryId` is non-null.
8. Switching entries snapshots the outgoing active editor and hydrates the incoming snapshot in one
   pure transition. The current browser filters/view may be copied forward as a workspace preference;
   dialogs, tooltip pins, drag state, keyboard placement, and slot focus are reset.
9. Persistent editor actions change the active entry and dirty the set document. Editor-only actions
   such as opening a dialog, selecting a browser result, or changing an ephemeral filter do not dirty
   content. Existing snapshot fingerprints remain the test for that distinction.
10. An empty set has no active editor. The app renders an empty-state action instead of exposing an
    editable blank `EditorState` that is absent from persistence.
11. Build-set mutation helpers address entries by stable ID, never by stale UI index. Reorder is
    implemented as Move Earlier/Move Later; selection and comparison remain attached to IDs.
12. Adding, duplicating, importing, or record-duplicating a loadout deep-clones all nested arrays and
    equipment objects and assigns fresh entry and nested `Build.id` values. IDs are generated by the
    caller so reducers remain deterministic and testable.
13. Entry IDs are unique within a set; set IDs and library record IDs are distinct identity scopes.
    A saved record owns a snapshot rather than links to other records. Copies cannot overwrite their
    sources.
14. Duplicate inserts immediately after the source, uses kind `variant`, selects the copy, and chooses
    the first available case-insensitive label in `Source Variant`, `Source Variant 2`, ... order.
15. Promotion means only `variant -> build`. It does not create a privileged base entry, reorder the
    array, mutate another kind, or imply party leadership. This keeps the base schema collection
    neutral.
16. Comparison is a selector over two persisted snapshots. It emits stable path-keyed rows for
    profession/mode, each of eight skill slots, canonical attribute ranks, PvE budget, canonical
    title overrides/effective title facts, semantic equipment selections, and meaningful raw-overlay
    differences. Missing catalog labels remain explicit numeric/raw values.
17. Comparison reports difference and resolution; it does not decide which side is better. Derived
    combat statistics, role inference, and party synergy remain deferred.
18. The navigator lives at the top of the main editor column. The existing library remains in the
    left column, avoiding a dense mixture of saved records and open loadouts. The same selected
    editor continues below the navigator in `EditorWorkspaceTabs`.
19. Summary selectors receive `AppCatalogViews` and call existing editor/equipment/title selectors.
    Generated JSON remains imported only by `src/app/catalogs.ts`; leaf components receive view
    models.
20. Summary cards are a labeled navigation list, not nested interactive tab buttons. Each card has a
    separate native selection button and menu/toolbar actions. Native buttons provide Tab/Enter/Space;
    optional ArrowLeft/ArrowRight movement must follow DOM order and preserve focus.
21. Per-loadout validation calls the existing `selectValidationView`/`validateBuild` path on each
    entry. The aggregate layer counts results and adds presentation-only draft completeness; it does
    not add rules to the domain rule engine or bump `RULE_ENGINE_VERSION`.
22. Draft incompleteness means the primary profession is missing, mode is `unknown`, or one or more
    skill-bar slots are empty. It is a neutral authoring status, not a validation error. Secondary
    profession, title overrides, equipment, and entry notes remain optional.
23. The local-library outer envelope advances from schema 1 to 2 while the storage key remains
    `build-wars:v1`. Schema 2 uses a discriminated `document` payload for working drafts and saved
    records, allowing future document types without another parallel top-level array.
24. Schema-1 libraries migrate every prior saved build and working draft to `document.kind = build`
    with all IDs, timestamps, tags, notes, snapshots, catalog facts, and revisions preserved. No
    write occurs until a user or autosave-authorized document mutation changes the normalized
    persistence fingerprint.
25. Whole-library backup advances to schema 2 and accepts/migrates schema-1 backups. Restore retains
    merge/replace preview, record-ID remapping, rejected-record reporting, draft opt-in, and
    anti-wipe behavior for both document kinds.
26. A separate `BuildSetTransferEnvelopeV1` is the only whole-set export/import format in this
    sprint. It contains one normalized set snapshot, export time, and saved-with facts; it excludes
    validation results/prose, component state, library favorites/tags, other records, generated
    catalogs, QA artifacts, and source files.
27. Set transfer import is a draft-replacement flow, not a merge algorithm. It parses and previews
    unknown JSON, requires the existing dirty guard, hydrates an unassociated set draft, and requires
    Save New before a named record exists.
28. Skill-template export and share URLs remain scoped to the selected loadout. UI labels must say
    `selected loadout`; whole-set controls say `build set JSON`. A set with no selected loadout
    disables single-build template/share controls with an explanation.
29. In-set template import replaces only the selected entry snapshot after confirmation and
    preserves entry ID/label/kind/notes. A share URL consumed at app startup continues to open an
    unassociated single-build draft rather than silently modifying a stored build set.
30. No new runtime or development dependency is needed. Existing React, reducers, selectors,
    `localStorage`, JSON downloads, Vitest, Testing Library, ESLint, and Prettier are sufficient.

### Domain and Persistence Contracts

Preferred shapes are shown below; exact TypeScript syntax may follow established repository style,
but the boundaries and discriminants are required.

```text
BUILD_SET_SCHEMA_VERSION = 1
MAX_BUILD_SET_ENTRIES = 24

BuildSetEntryKind = build | variant | freeform

BuildSetEntry
  id: BuildSetEntryId
  label: string
  kind: BuildSetEntryKind
  notes: string | null
  build: Build

BuildSet
  schemaVersion: 1
  catalogVersion: string | null
  id: AuthoredDocumentId
  name: string
  description: string | null
  entries: readonly BuildSetEntry[]
  selectedEntryId: BuildSetEntryId | null

PersistedBuildSetEntrySnapshot
  id: BuildSetEntryId
  label: string
  kind: BuildSetEntryKind
  notes: string | null
  snapshot: PersistedBuildSnapshot

PersistedBuildSetSnapshot
  schemaVersion: 1
  catalogVersion: string | null
  id: AuthoredDocumentId
  name: string
  description: string | null
  entries: readonly PersistedBuildSetEntrySnapshot[]
  selectedEntryId: BuildSetEntryId | null

PersistedDocument
  { kind: build, snapshot: PersistedBuildSnapshot }
  | { kind: build-set, snapshot: PersistedBuildSetSnapshot }

PersistedWorkingDraftV2
  document: PersistedDocument
  associatedRecordId: LocalLibraryRecordId | null
  savedWith: PersistedCatalogFacts

PersistedSavedRecordV2
  id, name, createdAt, updatedAt, favorite, tags, notes
  document: PersistedDocument
  savedWith: PersistedCatalogFacts

LocalLibraryEnvelopeV2
  schemaVersion: 2
  kind: build-wars-local-library
  revision, updatedAt, metadata
  workingDraft: PersistedWorkingDraftV2 | null
  savedRecords: readonly PersistedSavedRecordV2[]
```

Domain and persistence invariants:

- Set, entry, and record IDs are bounded non-empty strings with branded constructors. Entry IDs are
  unique after exact comparison; labels do not establish identity.
- Names and entry labels are trimmed and capped at 120 characters. Set descriptions are capped at
  2,048 characters and entry notes at 1,000 characters. Empty optional text normalizes to `null` on
  an authored mutation, not during an unsafe partial parse.
- Entry arrays are dense and capped at 24. The library retains its 250-record cap and additionally
  caps the aggregate number of nested loadouts parsed from untrusted input so one backup cannot
  multiply validation work without bound.
- `selectedEntryId: null` is valid for an empty or partial set. A non-null selection must reference
  exactly one entry. App-authored nonempty sets always select an entry; malformed stale references
  reject the containing record or draft through existing bounded recovery behavior.
- Duplicate entry IDs, unsupported set/build/envelope versions, sparse arrays, extra dangerous keys,
  invalid enums, malformed snapshots, non-finite values, and over-limit collections never hydrate.
- Structurally valid unresolved catalog IDs and raw template overlays remain preserved. Parser logic
  validates structure, not current catalog membership.
- Stable serialization sorts object keys but preserves entry, attribute, skill-slot, title-override,
  armor-slot, weapon-set, and raw-overlay array order where order is semantically defined.
- Domain conversion from a persisted set must reconstruct each `BuildSetEntry.build` from the entry
  snapshot and prove metadata/entry ordering parity. It must not import app types into `src/domain`.

### Workspace State and Transition Invariants

```text
WorkspaceDocumentState
  SingleBuildDocumentState
    kind: build
    editor: EditorState

  BuildSetDocumentState
    kind: build-set
    set metadata
    selectedEntryId
    entries:
      ActiveEntry { metadata, state: { kind: active, editor: EditorState } }
      | InactiveEntry { metadata, state: { kind: inactive, snapshot: PersistedBuildSnapshot } }
    comparisonEntryId: BuildSetEntryId | null
    collapsedEntryIds: readonly BuildSetEntryId[]
```

The state layer must enforce these transitions:

- `selectBuildSetEntry(targetId)` returns the same state for the current/missing ID; otherwise it
  snapshots the one active entry, hydrates the target, updates selection, retains only safe shared
  editor preferences, and clears transient interaction state.
- `reduceActiveEditor(action)` delegates to `editorReducer`; it does not know catalog facts. Existing
  before/after snapshot fingerprints determine whether document content changed.
- `addBlankEntry(ids, label)` inserts after the selected entry or at the end of an empty set and
  selects it. The former active editor is first converted to a snapshot.
- `copySavedBuild(record, ids)` accepts only a single-build library document, deep-copies its
  snapshot, re-keys entry/build identity, inserts and selects it, and leaves the source record and
  its metadata unchanged.
- `duplicateEntry(sourceId, ids)` works for active or inactive sources through one snapshot helper;
  it deep-copies nested state, inserts after source, selects the copy, and sets comparison target to
  the source.
- `removeEntry(id)` requires confirmed UI intent. If removing the active entry, selection becomes the
  following entry at the same index, otherwise the preceding entry, otherwise `null`. Comparison is
  cleared if either side disappears.
- `moveEntry(id, delta)`, `renameEntry`, `setEntryNotes`, `setEntryKind`, and `promoteEntry` mutate
  metadata/order only and preserve active/inactive state and selection by ID.
- `createSetFromCurrent(ids)` snapshots the current single editor, re-keys the copied nested build,
  creates an unassociated dirty set document, and does not mutate the source library record.
- `serializeWorkspaceDocument` handles active and inactive entries uniformly. Hydration creates at
  most one active editor. All save, backup, pagehide, fingerprint, and test-fixture paths use these
  two functions rather than hand-building variants.
- Authored-content fingerprints include set name/description, ordered entry metadata/notes, and all
  entry snapshots, but exclude selected/collapsed/comparison state. Workspace-persistence
  fingerprints include the durable selection so navigation survives reload.

### Library Migration, Durability, and Recovery

The schema-2 migration is a compatibility boundary, not a cosmetic rename:

1. `parseLocalLibraryJson` rejects over-limit input before expensive traversal, rejects dangerous
   keys recursively, then dispatches by outer schema version.
2. Schema 1 is parsed with its existing field rules. Each `savedBuilds[]` item becomes a schema-2
   common record with `document.kind = build`; the optional working draft is wrapped the same way.
3. Schema 2 accepts only the discriminated `savedRecords` and document shapes. Unknown document
   kinds and unsupported nested set/build versions are rejected with bounded path diagnostics.
4. Invalid individual records are skipped and place the library in existing write-blocked recovery;
   an invalid working draft is skipped without hiding valid records. Duplicate library IDs and
   aggregate entry overflow also block writes.
5. `createInitialWorkspaceState` derives both the runtime document and its normalized durable
   fingerprint from the same migrated envelope. Read-only migration therefore produces no autosave.
6. The first later authorized write stores schema 2 at `build-wars:v1` with the current revision
   conflict check. No second key, double-write window, or destructive key deletion is introduced.
7. A schema-2 record copied by an older deployment is unsupported and write-blocked, which is safer
   than down-converting or dropping build sets.

Named save behavior is document-kind aware. Save New and Save As New create a new common library
record from the whole active document. Update requires an associated record of the same document
kind. Loading replaces the whole current document through the dirty guard. Duplicating a set record
deep-copies and re-keys set, entry, and nested build identity; duplicating a single-build record keeps
existing behavior but also deep-copies nested state. Deleting an associated record leaves the full
document open, clears association, and marks it dirty.

Library row summaries use a discriminated selector. A build row preserves its current output. A set
row shows `Build set`, entry count, selected-or-first profession/mode preview, aggregate attention
state, and a bounded skill preview. Search considers record/set names, description, tags, record
notes, entry labels/notes, resolved skill names, and unresolved raw labels. Profession/mode filters
match any entry; favorites and tags remain record-level. Sort remains record-level and deterministic.

### Navigation, Summaries, and Responsive Layout

`BuildSetNavigator` appears only for a build-set document. Its header contains the set name,
description affordance, entry count, aggregate status, Add Loadout, and set overflow menu. Below it,
an ordered horizontally scrollable card list remains visible above the selected editor on desktop.
At narrow widths cards stack in a bounded vertical list above the editor; the page does not require
horizontal viewport scrolling.

Each summary card exposes:

- entry label, `build | variant | freeform` badge, notes indicator, and selected state;
- resolved profession pair and mode, retaining raw/unresolved labels where present;
- eight ordered compact skill cells with known, empty, and unresolved states;
- concise equipment status from `selectEquipmentSummary`, including configured and unresolved
  counts rather than a second equipment editor;
- title-override count and PvE-budget facts only when meaningful;
- validation/draft-completeness status with errors, warnings, unresolved, or incomplete counts;
- separate Select and More Actions controls, with Move Earlier/Later disabled at bounds.

Cards do not render interactive skill tooltips or full controls. Summary selectors may hydrate an
inactive snapshot into a blank editor for existing selector reuse, but they are memoized by snapshot
fingerprint and the 24-entry cap bounds the work. Selected and inactive cards use the same summary
pipeline so their facts cannot diverge.

Selection focus moves to the selected card after add/duplicate/remove only when the initiating action
would otherwise remove or invalidate focus. Normal selection does not steal focus from pointer or
assistive-technology users. Status and reorder operations use the existing polite live region. Long
labels wrap or ellipsize with an accessible full name, action menus escape-close and restore focus,
touch targets remain usable, color is not the only state cue, and reduced-motion preferences are
honored.

### Variant and Comparison Semantics

Variants remain ordinary entries. No parent pointer, variant tree, base-entry ID, or inheritance is
persisted. This prevents later edits to a source from unexpectedly mutating copies and avoids a
schema that conflicts with future parties or arbitrary collections.

The comparison target is ephemeral and can be any non-selected entry. After duplication it defaults
to the source; otherwise the user chooses it. A pure comparison selector returns ordered groups and
path-stable rows:

```text
identity: build name, profession pair, mode
skills: skillBar[0] ... skillBar[7]
attributes: union by attribute ID, sorted by catalog label then ID
pve-budget: level and quest-bonus policy
title-ranks: union by canonical key with implicit/configured/unresolved status
equipment: armor slots, runes, insignias, headgear, weapon-set hands/modifiers/requirements
raw-overlay: only unresolved or source-fidelity differences that change interpretation
```

Equal groups collapse by default. Partial, retained, or unresolved facts display as such and are
never equated to empty. Catalog labels are presentational; equality uses normalized semantic IDs and
values, so catalog reordering or localization cannot change whether a difference exists. Notes and
entry kind appear as metadata outside semantic comparison. Comparison never writes either entry.

### Validation and Group Status

`selectBuildSetValidationView` serializes the active entry if needed, hydrates each entry snapshot,
and invokes the same existing validation selector with the same `AppCatalogViews`. It returns one
ordered row per entry plus aggregate counts:

```text
loadoutCount
entriesWithErrors
entriesWithWarnings
entriesUnresolved
entriesIncomplete
totalErrors
totalWarnings
catalogStatus: ready | unavailable
overall: error | unresolved | incomplete | warning | ready | empty | unavailable
```

Overall precedence is `unavailable`, `empty`, `error`, `unresolved`, `incomplete`, `warning`, then
`ready`. A loadout may contribute to several counts; the UI states this and never sums categories as
if they were mutually exclusive. The group panel navigates to an entry and the existing
`ValidationPanel` then shows its detailed located issues.

No validation input combines two builds. No issue compares professions, skills, equipment, modes,
or title ranks across entries. `RULE_ENGINE_VERSION` and issue codes remain unchanged because this
sprint composes existing results rather than changing game rules. Catalog unavailability returns a
bounded unavailable result rather than trying to validate with empty catalogs.

### Sharing, Set Transfer, and Backup

The existing template/share pipeline receives the selected `EditorState` and keeps its current
payload grammar, 1,800-character URL cap, exact-source behavior, and equipment/title omission copy.
Labels become explicit that only the selected loadout is exported. If a template import replaces a
selected set entry, the confirmation names all local-only entry content that the existing import
cannot encode while preserving the entry's metadata.

Native set transfer uses:

```text
BuildSetTransferEnvelopeV1
  schemaVersion: 1
  kind: build-wars-build-set
  exportedAt: ISO timestamp
  snapshot: PersistedBuildSetSnapshot
  savedWith: PersistedCatalogFacts
```

Export serializes deterministic inert JSON and downloads it with a sanitized local filename. Import
has parse, preview, and apply steps; it uses the same build-set snapshot validator and limits as local
storage, reports bounded paths, refuses unsupported versions, and applies once. It does not accept
HTML, execute fields, fetch referenced resources, merge entries, or claim external compatibility.

Whole-library backup schema 2 contains common saved records and an optional discriminated working
draft. Backup schema 1 migrates through the same single-build wrapper as local storage. Restore
preview counts accepted single builds, accepted sets, contained loadouts, skipped records, record-ID
conflicts, and optional draft availability. Merge/replace behavior and the declared-nonempty
anti-wipe rule remain unchanged; internal set IDs are scoped to their record and are validated but
do not participate in library-record conflict remapping.

## Implementation

### Phase 0: BW-1601 Baseline and Contract Freeze (~5% of effort)

**Files:**

- `work/sprints/SPRINT-017.md` and `work/tickets/16-heroes-and-henchmen/*.md` - Execution state and
  ticket traceability.
- `src/app/workspace-state.test.ts`, `src/app/persistence-schema.test.ts`,
  `src/app/backup-restore.test.ts`, `src/app/App.test.tsx` - Current single-build behavior baseline.
- `src/domain/party.ts`, `src/domain/guide.ts` - Explicit non-reuse boundary only.

**Tasks:**

- [ ] Mark SPRINT-017 and BW-1601 through BW-1606 in progress when implementation begins.
- [ ] Run the existing workspace, persistence, backup/restore, template/share, equipment, title, and
      App tests before changing contracts; record any pre-existing failures.
- [ ] Freeze the document union, set/entry ID scopes, 24-entry cap, selected-versus-authored
      fingerprint distinction, atomic active/inactive entry model, promotion semantics, storage-key
      strategy, backup migration, and set-transfer envelope.
- [ ] Add hand-authored schema-1 library and backup fixtures before migration code changes, including
      a working draft associated to a saved record.
- [ ] Confirm `src/domain/build-set.ts` has no import from party/guide/app modules and no hero/party
      vocabulary beyond documentation of deferred scope.
- [ ] Verify with `npm run test:run -- src/app/workspace-state.test.ts
      src/app/persistence-schema.test.ts src/app/backup-restore.test.ts src/app/App.test.tsx` and
      `npm run typecheck`.

**Gate:** Do not begin durable schema changes until old single-build records, dirty guards, and
read-only hydration have executable baseline coverage.

### Phase 1: BW-1601 Build Set Contracts and Fixtures (~15% of effort)

**Files:**

- `src/domain/build-set.ts` - New framework-neutral contracts and pure structural helpers.
- `src/domain/index.ts` - Public exports.
- `test/domain/build-set.test.ts` - Domain invariants, operations, and edge cases.
- `src/app/build-set-fixtures.ts` - Reusable app snapshot fixtures without production catalog imports.

**Tasks:**

- [ ] Add branded entry IDs, schema/version constants, `BuildSetEntryKind`, `BuildSetEntry`, and
      `BuildSet`, reusing `Build` as the semantic loadout.
- [ ] Add pure constructors and helpers for blank sets, labels/notes, selection, insert, move,
      remove, kind change, promotion, clone/re-key, and domain/persisted conversion boundaries.
- [ ] Keep order solely in the dense entry array; enforce stable ID addressing and no in-place
      mutation.
- [ ] Define deterministic selection after insert/remove and represent empty, single, multi,
      variant, freeform, nullable-selection, and partial-build states.
- [ ] Prove duplicate/re-key produces independent `Build`, skill, attribute, title, equipment, and
      nested modifier arrays while preserving semantic values.
- [ ] Test duplicate IDs, missing/stale selection, boundary reorder, duplicate labels, long text,
      unsupported kinds/schema versions, empty sets, and input-order stability.
- [ ] Export no party/hero adapter and leave `PartyBuild`/`Guide` unchanged.
- [ ] Verify with `npm run test:run -- test/domain/build-set.test.ts test/domain/contracts.test.ts`
      and `npm run typecheck`.

**Gate:** The domain model must represent every required state without app types or party semantics
before persistence or UI builds on it.

### Phase 2: BW-1602 Workspace State, Persistence, and Library Integration (~25% of effort)

**Files:**

- `src/app/build-set-state.ts` and `src/app/build-set-state.test.ts` - Active/inactive entry state and
  pure transitions.
- `src/app/workspace-state.ts`, `src/app/workspace-state.test.ts` - Document union, associations,
  dirty state, durability, save/load, and record operations.
- `src/app/persistence-schema.ts`, `src/app/persistence-schema.test.ts` - Schema-2 envelope,
  discriminated records, validators, migration, cloning, and fingerprints.
- `src/app/local-storage.ts`, `src/app/local-storage.test.ts` - Schema-2 read/write and conflict
  behavior under the unchanged key.
- `src/app/library-selectors.ts`, `src/app/library-selectors.test.ts`,
  `src/app/library-fixtures.ts` - Mixed-record summaries, search, filters, sorting, and fixtures.
- `src/app/components/LibraryPanel.tsx`, `src/app/components/LibraryDialogs.tsx` - Record-kind labels,
  document-aware save/load/duplicate/delete, and Copy Into Set action.
- `src/app/App.tsx`, `src/app/App.test.tsx` - Document-aware editor composition and autosave.

**Tasks:**

- [ ] Introduce `PersistedDocument`, common schema-2 working draft/saved record contracts, build-set
      snapshot types, and one validator/clone/fingerprint path per document kind.
- [ ] Migrate valid schema-1 local libraries to schema 2 in memory with exact preservation of prior
      build snapshots, record metadata, associations, catalog facts, timestamps, and revision.
- [ ] Prove migration alone leaves dirty state clean, computes matching normalized durable
      fingerprints, performs no `setItem`, and writes schema 2 only after a later authorized change.
- [ ] Reject dangerous keys, sparse/oversized arrays, duplicate IDs, stale non-null selection,
      unknown discriminants, unsupported nested versions, malformed entries, aggregate-loadout
      overflow, and invalid snapshots with bounded diagnostics and write-blocked recovery.
- [ ] Refactor `WorkspaceState` around the discriminated document union and generalize build record
      IDs/names without weakening the existing save/update/dirty/durability invariants.
- [ ] Implement atomic select/add/copy/duplicate/remove/reorder/rename/notes/kind/promote operations,
      including empty-set state and transient reset behavior.
- [ ] Ensure serialization snapshots the active entry exactly once and hydration activates at most
      one selected entry; fuzz operation sequences in tests and check the invariant after every step.
- [ ] Keep selection autosaved but outside content dirty checks; ensure content edits in any entry
      dirty the set and pagehide persists the latest active editor.
- [ ] Make create-from-current and Copy Into Set create independent unassociated set content without
      overwriting the source single-build record.
- [ ] Make Save New, Update, Save As New, load, record duplicate, delete, restore handoff, storage
      conflict, quota failure, unavailable storage, and retry work for both document kinds.
- [ ] Convert library rows to a mixed-document selector with clear kind badges, set entry counts,
      any-entry search/filter semantics, aggregate diagnostics, and unchanged record-level sorting,
      favorites, tags, and notes.
- [ ] Retain the current single-build UI and behavior when `document.kind === build`; no empty
      navigator shell appears for those users.
- [ ] Verify with `npm run test:run -- src/app/build-set-state.test.ts
      src/app/workspace-state.test.ts src/app/persistence-schema.test.ts
      src/app/local-storage.test.ts src/app/library-selectors.test.ts src/app/App.test.tsx` and
      `npm run typecheck`.

**Gate:** Do not build variant or transfer UI until repeated switching, reload, save/update, and old
schema migration prove that no selected or inactive loadout data can be lost.

### Phase 3: BW-1603 Navigation, Summaries, and Selected Editor (~19% of effort)

**Files:**

- `src/app/build-set-selectors.ts`, `src/app/build-set-selectors.test.ts` - Entry summaries and
  navigator view model.
- `src/app/components/BuildSetNavigator.tsx`,
  `src/app/build-set-navigator.test.tsx` - Accessible selection, actions, overflow, and states.
- `src/app/components/BuildSetDialogs.tsx` - Rename, notes, kind, add/copy, and remove confirmation.
- `src/app/App.tsx`, `src/app/App.test.tsx` - Navigator placement, nullable active editor, and existing
  editor handoff.
- `src/app/styles.css` - Desktop strip, narrow list, selected/focus/status styles, and overflow.
- Existing editor/equipment/title selectors and components - Reuse/test only unless a small adapter
  is required.

**Tasks:**

- [ ] Build one memoizable summary selector for active and inactive entries using app catalog views
      and existing profession, skill, equipment, title, and validation semantics.
- [ ] Render set header and ordered summary cards above the main editor, with native selection and
      separately focusable action controls.
- [ ] Show label/kind, profession pair, mode, eight skill cells, equipment configured/unresolved
      counts, title/PvE facts when meaningful, notes indicator, and attention status.
- [ ] Add selection, Add Blank, Copy Saved Build, Move Earlier/Later, Rename, Edit Notes, Change Kind,
      Duplicate, Promote, Compare, and Remove entry points with unavailable actions disabled and
      explained.
- [ ] Render a focused empty state with no phantom editor; keep the one-entry state visually simple
      and hide inapplicable comparison/reorder actions.
- [ ] Preserve the selected editor's existing skills/equipment tabs and components rather than
      forking a second build editor.
- [ ] Keep generated imports behind `src/app/catalogs.ts`; enforce with the catalog-boundary test.
- [ ] Cover keyboard activation, focus restoration, live announcements, long labels, many-entry
      overflow, empty/single states, unresolved summaries, and DOM order.
- [ ] Add responsive tests or stable data attributes for desktop scrolling and narrow stacked
      layout, then manually smoke-test supported narrow widths with no page-level horizontal scroll.
- [ ] Verify with `npm run test:run -- src/app/build-set-selectors.test.ts
      src/app/build-set-navigator.test.tsx src/app/App.test.tsx
      src/app/catalog-boundary.test.ts` and `npm run typecheck`.

**Gate:** Navigation must preserve unsaved state and remain operable at narrow width with keyboard
alone before comparison increases card/action density.

### Phase 4: BW-1604 Variant and Comparison Workflows (~13% of effort)

**Files:**

- `src/app/build-set-comparison.ts`, `src/app/build-set-comparison.test.ts` - Semantic diff model and
  deterministic ordering.
- `src/app/components/BuildSetComparison.tsx`,
  `src/app/build-set-comparison.test.tsx` - Compact comparison UI and partial/unresolved states.
- `src/app/build-set-state.ts`, `src/app/build-set-state.test.ts` - Duplicate, promote, comparison
  target, identity, and remove/reorder interactions.
- `src/app/components/BuildSetNavigator.tsx`, `src/app/components/BuildSetDialogs.tsx`,
  `src/app/styles.css` - Variant actions and responsive comparison drawer.

**Tasks:**

- [ ] Implement one-action duplicate with complete deep copy, fresh entry/build IDs, deterministic
      label, insertion after source, `variant` kind, source comparison target, and new selection.
- [ ] Prove editing the duplicate cannot mutate the source in memory, a saved source record, raw
      overlay, title overrides, armor pieces, weapon hands/modifiers, or PvE budget.
- [ ] Implement rename, notes, reorder, remove, kind change, and promote semantics exactly as bound;
      promotion changes no other entry and removal deletes no unrelated library record.
- [ ] Normalize snapshots into stable comparison keys and emit deterministic grouped differences for
      identity, skills, attributes, PvE budget, title ranks, equipment, and meaningful unresolved raw
      state.
- [ ] Distinguish empty from unresolved/retained selections and use numeric/raw fallbacks when
      catalogs cannot resolve a label.
- [ ] Render only changed groups by default, permit equal-group disclosure, and provide a clear
      no-differences state without ranking or recommendation language.
- [ ] Clear or repair comparison target deterministically after selection/removal and never persist
      it in the build-set snapshot.
- [ ] Cover reordered catalog inputs, partial equipment, alias-normalized title ranks, raw template
      remnants, duplicate labels, repeated duplication, first/last reorder, promotion, and source
      removal.
- [ ] Verify with `npm run test:run -- src/app/build-set-state.test.ts
      src/app/build-set-comparison.test.ts src/app/build-set-comparison.test.tsx
      src/app/build-set-navigator.test.tsx`.

**Gate:** Variants are not complete until identity independence and deterministic partial-state
comparison are both proven.

### Phase 5: BW-1605 Group Validation, Transfer, Backup, and Share Boundaries (~17% of effort)

**Files:**

- `src/app/build-set-selectors.ts`, `src/app/build-set-selectors.test.ts` - Per-entry validation and
  aggregate status.
- `src/app/components/BuildSetValidationOverview.tsx`,
  `src/app/build-set-validation.test.tsx` - Group overview and entry navigation.
- `src/app/build-set-transfer.ts`, `src/app/build-set-transfer.test.ts` - Native set JSON parse,
  preview, apply, and serialization.
- `src/app/components/BuildSetTransferDialog.tsx`,
  `src/app/build-set-transfer-dialog.test.tsx` - Export/import UI and dirty guard.
- `src/app/backup-restore.ts`, `src/app/backup-restore.test.ts` - Backup schema 2, schema-1 migration,
  mixed restore, and anti-wipe behavior.
- `src/app/components/LibraryDialogs.tsx`, `src/app/components/ShareControls.tsx`,
  `src/app/components/TemplateDialogs.tsx`, `src/app/template-workflow.ts`,
  `src/app/share-url.ts` and tests - Explicit selected-loadout/set boundaries.

**Tasks:**

- [ ] Validate every entry independently through the current validation path and derive ordered
      aggregate entry/issue counts without adding cross-entry rule-engine inputs or issue codes.
- [ ] Add draft-completeness and catalog-unavailable presentation states with explicit precedence;
      ensure overlapping counts are labeled rather than misleadingly summed.
- [ ] Let aggregate rows select the corresponding entry, then defer detail rendering to the existing
      selected `ValidationPanel`.
- [ ] Implement `BuildSetTransferEnvelopeV1` deterministic serialization, filename sanitization,
      input bounds, unknown-JSON parsing, dangerous-key rejection, preview diagnostics, single-use
      apply, dirty guard, and unassociated-draft hydration.
- [ ] Upgrade whole-library backup to schema 2, migrate schema-1 backups, preserve mixed documents
      and optional working drafts, and report accepted sets/loadouts separately.
- [ ] Retain merge/replace, record-ID remaps, imported-draft opt-in, skipped-record diagnostics,
      current-record preservation, and declared-nonempty anti-wipe behavior.
- [ ] Label skill-template/share actions as selected-loadout only; disable them for empty/no-selection
      sets and retain all current equipment/title/template omission warnings.
- [ ] Make in-set template import replace only the selected snapshot while preserving entry metadata;
      keep startup share URLs as unassociated single-build drafts.
- [ ] Prove set JSON and backup output include complete semantic snapshots and raw recovery facts but
      exclude validation output, generated catalogs, component state, comparison state, library data
      outside the chosen envelope, and external party/template artifacts.
- [ ] Test malformed JSON, unsupported versions/kinds, duplicate/dangerous IDs, over-limit entries,
      invalid nested builds, duplicate incoming library IDs, quota/unavailable storage, conflict,
      empty sets, mixed backups, and all-record-invalid replace.
- [ ] Verify with `npm run test:run -- src/app/build-set-selectors.test.ts
      src/app/build-set-validation.test.tsx src/app/build-set-transfer.test.ts
      src/app/build-set-transfer-dialog.test.tsx src/app/backup-restore.test.ts
      src/app/template-workflow.test.ts src/app/share-url.test.ts`.

**Gate:** No whole-set control may emit a skill/team template or imply external compatibility, and no
restore/import path may bypass the existing preview, dirty, or anti-wipe safeguards.

### Phase 6: BW-1606 Regression, Documentation, and Closeout (~6% of effort)

**Files:**

- `README.md` - Product capability and local-first boundary.
- `compendium/multi-build-workspace.md` - New authoritative behavior, contracts, workflows, and
  EPIC-17 handoff.
- `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`,
  `compendium/equipment-editor.md`, `compendium/title-ranks.md` - Cross-feature compatibility.
- `work/tickets/16-heroes-and-henchmen/EPIC.md`, `work/tickets/16-heroes-and-henchmen/BW-160*.md`,
  `work/sprints/SPRINT-017.md`, `work/sprints/ledger.tsv`, and ticket-burn result manifest - Closeout
  records.

**Tasks:**

- [ ] Run focused regressions for single-build new/save/update/save-as/load/duplicate/delete,
      working-draft reload, dirty guards, storage failures, template import/export, share URLs,
      equipment editing, title ranks, validation, backup, and restore.
- [ ] Manually smoke-test empty, single, 24-entry overflow, repeated unsaved switching, duplicate and
      source independence, removal focus, compare partial equipment, narrow layout, keyboard-only
      operation, and storage-unavailable mode.
- [ ] Document the set/domain/persistence shapes, schema-1 migration, unchanged storage key,
      active/inactive invariant, save association, variants, promotion, summaries, validation,
      transfer, backup, and selected-loadout sharing.
- [ ] State explicitly that hero/henchman catalogs, portraits, AI behavior, party slots/rules,
      paw-ned2/team-template formats, synergy, guide authoring, accounts, backend sync, and
      collaboration remain deferred.
- [ ] Record EPIC-17 handoff as an adapter over build sets rather than a reason to retrofit party
      fields into the EPIC-16 contract.
- [ ] Run `npm run test:run -- src/app test/domain`, then `npm run verify`, then `git diff --check`.
- [ ] Record exact verification evidence, reconcile SPRINT-017/BW-1601 through BW-1606/EPIC-16
      statuses, sync `work/sprints/ledger.tsv`, and write the ticket-burn result manifest only after
      every Definition of Done item passes.

**Gate:** EPIC-16 closes only when mixed-library migration and all existing single-build workflows
pass the full repository verification command.

## Files Summary

| File or Area | Change | Purpose |
| --- | --- | --- |
| `src/domain/build-set.ts` | Create | Framework-neutral set/entry contracts, stable IDs, limits, constructors, structural helpers, and conversion inputs. |
| `src/domain/index.ts` | Modify | Export build-set contracts and helpers. |
| `src/domain/party.ts`, `src/domain/guide.ts` | No production change expected | Preserve explicit EPIC-17/guide boundaries and prove no dependency from build sets. |
| `test/domain/build-set.test.ts`, `test/domain/contracts.test.ts` | Create/modify | Cover domain invariants, empty/partial states, clone identity, order, and public contracts. |
| `src/app/build-set-fixtures.ts` | Create | Central app fixtures for set snapshots and runtime state. |
| `src/app/build-set-state.ts` | Create | Own active/inactive entry representation and deterministic structural transitions. |
| `src/app/build-set-state.test.ts` | Create | Cover switching, preservation, operations, identity, dirty-relevant snapshots, and transition invariants. |
| `src/app/persistence-schema.ts` | Modify | Add schema-2 document union, set snapshots, v1 migration, bounds, validation, cloning, serialization, and fingerprints. |
| `src/app/persistence-schema.test.ts` | Modify | Cover old/new envelopes, malformed sets, read-only migration, limits, dangerous keys, and stable output. |
| `src/app/local-storage.ts`, `src/app/local-storage.test.ts` | Modify | Read/write schema 2 under the existing key and preserve conflict/write-block behavior. |
| `src/app/workspace-state.ts`, `src/app/workspace-state.test.ts` | Modify | Use document-aware state, associations, dirty/durability rules, save/load, restore, and pagehide serialization. |
| `src/app/library-fixtures.ts` | Modify | Add common build/build-set record and migrated-v1 fixtures. |
| `src/app/library-selectors.ts`, `src/app/library-selectors.test.ts` | Modify | Summarize/search/filter/sort mixed document records and set aggregates. |
| `src/app/build-set-selectors.ts`, `src/app/build-set-selectors.test.ts` | Create | Build summary/navigation/aggregate-validation view models through app catalog boundaries. |
| `src/app/build-set-comparison.ts`, `src/app/build-set-comparison.test.ts` | Create | Produce deterministic semantic differences with partial/unresolved handling. |
| `src/app/build-set-transfer.ts`, `src/app/build-set-transfer.test.ts` | Create | Own native set JSON envelope, parse, preview, apply, bounds, and serialization. |
| `src/app/backup-restore.ts`, `src/app/backup-restore.test.ts` | Modify | Upgrade/migrate backup envelopes and restore mixed records/drafts safely. |
| `src/app/components/BuildSetNavigator.tsx` | Create | Render set header, compact entry cards, navigation, and actions. |
| `src/app/components/BuildSetDialogs.tsx` | Create | Add/copy, rename, notes, kind, and remove confirmation flows. |
| `src/app/components/BuildSetComparison.tsx` | Create | Render compact deterministic two-entry differences. |
| `src/app/components/BuildSetValidationOverview.tsx` | Create | Render group attention status and entry navigation. |
| `src/app/components/BuildSetTransferDialog.tsx` | Create | Provide native set import/export preview and apply UI. |
| `src/app/build-set-navigator.test.tsx`, `src/app/build-set-comparison.test.tsx`, `src/app/build-set-validation.test.tsx`, `src/app/build-set-transfer-dialog.test.tsx` | Create | Cover accessible UI, focus, responsive states, partial data, and transfer safeguards. |
| `src/app/components/LibraryPanel.tsx`, `src/app/components/LibraryDialogs.tsx` | Modify | Display record kinds and provide document-aware save/load/copy/backup/restore actions. |
| `src/app/components/ShareControls.tsx`, `src/app/components/TemplateDialogs.tsx` | Modify | Make selected-loadout scope and no-selection behavior explicit. |
| `src/app/template-workflow.ts`, `src/app/share-url.ts` and tests | Modify/test | Preserve formats while defining selected-entry replacement and startup single-build behavior. |
| `src/app/App.tsx`, `src/app/App.test.tsx` | Modify | Compose the document union, navigator, active editor, summaries, aggregate status, autosave, and empty state. |
| `src/app/styles.css` | Modify | Add compact desktop/narrow set navigation, comparison, focus, and status styling. |
| Existing editor, equipment, title, and validation selectors/components/tests | Reuse/test; modify only for adapters | Preserve one canonical editor and current per-build behavior. |
| `README.md`, `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`, `compendium/equipment-editor.md`, `compendium/title-ranks.md` | Modify | Document cross-feature compatibility and schema/share changes. |
| `compendium/multi-build-workspace.md` | Create | Document build-set contracts, workflows, durability, validation, transfer, and deferrals. |
| `work/tickets/16-heroes-and-henchmen/*.md` | Modify during execution | Record implementation state, acceptance evidence, and closeout. |
| `work/sprints/SPRINT-017.md`, `work/sprints/ledger.tsv`, result manifest | Create/modify during planning/closeout | Maintain authoritative sprint, ledger, and ticket-burn traceability. |

## Definition of Done

- [ ] `BuildSet` and `BuildSetEntry` are framework-neutral, ordered, versioned, exported, and reuse
      `Build` rather than duplicating its semantic fields.
- [ ] Set, entry, nested build, and library record identity scopes are explicit and tested.
- [ ] Entry metadata supports a stable ID, bounded label, `build | variant | freeform` kind, and
      bounded notes; sets support a bounded name/description and nullable selected entry.
- [ ] Empty, single, multi, variant, freeform, partial, and unresolved states are representable and do
      not import or require `PartyBuild`, hero, henchman, or guide contracts.
- [ ] Entry array order is canonical; duplicate IDs, stale selection, sparse arrays, invalid kinds,
      unsupported versions, and over-limit entries have deterministic outcomes.
- [ ] Runtime build sets contain exactly one active `EditorState` for a non-null selection and one
      snapshot for every inactive entry, with no duplicate active snapshot copy.
- [ ] Repeated switching preserves unsaved professions, mode, attributes, all eight skills, PvE
      budget, raw template overlay/source, title ranks, semantic equipment, and nested build name.
- [ ] Switching resets unsafe transient dialog/tooltip/drag/keyboard state and retains only explicitly
      chosen workspace-level editor preferences.
- [ ] Empty sets expose no phantom editor; adding the first entry establishes a valid selection and
      active editor.
- [ ] Add blank, copy saved build, duplicate, remove, move earlier/later, rename, notes, kind change,
      promote, and selection transitions are pure, ID-addressed, bounded, and tested.
- [ ] Create Set From Current and Copy Into Set never mutate or associate with the source saved
      single-build record.
- [ ] Duplicate produces independent entry/build identity and deep-copies all nested semantic and raw
      state; later edits cannot affect the source.
- [ ] Promotion changes only `variant` to `build`; it does not reorder, demote, delete, or imply a
      privileged party/base slot.
- [ ] Removing the selected entry chooses the following, preceding, or null selection in that order,
      restores focus safely, and deletes no standalone library record.
- [ ] Local-library schema 2 stores discriminated single-build and build-set working drafts/records
      under the existing `build-wars:v1` key.
- [ ] Valid schema-1 libraries migrate in memory to schema 2 with snapshots, metadata, association,
      catalog facts, revision, timestamps, tags, favorites, and notes preserved exactly.
- [ ] Reading migrated schema-1 data does not dirty the document, call `setItem`, increment revision,
      or write schema 2 until a later authorized mutation.
- [ ] Unsupported schema versions, unknown document kinds, malformed nested snapshots, duplicate or
      dangerous IDs/keys, aggregate over-limit data, and corrupt records follow bounded write-blocked
      recovery without crashing the editor.
- [ ] Working autosave, pagehide flush, explicit Save New, Update, Save As New, load, record duplicate,
      delete, quota/unavailable storage, conflict, and recovery work for both document kinds.
- [ ] Selection survives reload but is excluded from authored-content dirty status; set content and
      order changes are included.
- [ ] Single-build users retain the pre-sprint workspace, record operations, dirty guards,
      persistence, template/share, validation, equipment/title editing, backup, and restore behavior.
- [ ] Library rows clearly distinguish builds from sets and retain deterministic record-level sort,
      favorites, tags, notes, and timestamps.
- [ ] Set search covers set/entry text, resolved skills, and unresolved raw labels; profession and
      mode filters match any contained entry with documented semantics.
- [ ] The build-set navigator appears above the selected editor and keeps all loadout summaries
      visible through bounded desktop/narrow overflow behavior.
- [ ] Summary cards consistently expose label/kind, profession pair, mode, eight ordered skill
      states, equipment configured/unresolved state, meaningful title/PvE facts, and attention status.
- [ ] Active and inactive summaries use the same selector pipeline and do not directly import
      generated JSON outside `src/app/catalogs.ts`.
- [ ] Empty and one-entry sets remain simple; 24-entry sets remain navigable without page-level
      horizontal overflow or inaccessible actions.
- [ ] Selection and every structural action work with keyboard and pointer, have explicit accessible
      names/states, restore focus after destructive/menu actions, and announce meaningful results.
- [ ] Long labels/notes, touch targets, visible focus, non-color status cues, and reduced-motion
      behavior are manually and automatically covered where practical.
- [ ] Variant duplication inserts after source, uses a deterministic unique label, selects the copy,
      and defaults comparison to the source.
- [ ] Comparison deterministically covers identity, eight skill slots, canonical attributes, PvE
      budget, title ranks, semantic equipment, and meaningful unresolved raw facts.
- [ ] Comparison distinguishes empty, configured, retained, and unresolved states, remains stable
      under catalog ordering changes, and never ranks or recommends a side.
- [ ] Per-entry validation uses the existing build validation path with no cross-entry input, new game
      rule, issue-code change, or `RULE_ENGINE_VERSION` bump.
- [ ] Aggregate validation reports ordered per-entry results, overlapping error/warning/unresolved/
      incomplete counts, empty/catalog-unavailable states, and deterministic overall precedence.
- [ ] Draft incompleteness is presented as neutral authoring status and is not mislabeled as party or
      game legality.
- [ ] Aggregate rows navigate to the relevant entry and the existing `ValidationPanel` shows its
      detailed issues.
- [ ] Skill-template export and share URLs remain byte/grammar compatible, remain capped as before,
      and explicitly operate on only the selected loadout.
- [ ] Empty/no-selection sets cannot invoke single-build template/share actions and receive a concise
      explanation.
- [ ] In-set template import replaces only the selected snapshot after confirmation and preserves
      entry metadata; startup share URLs remain unassociated single-build drafts.
- [ ] Native set JSON is versioned, deterministic, inert, bounded, validated from unknown input,
      previewed before apply, and hydrated only as an unassociated draft through the dirty guard.
- [ ] Set transfer preserves complete entry snapshots and metadata while excluding validation prose,
      generated catalogs/source files, component/comparison state, and external party/template
      semantics.
- [ ] Whole-library backup schema 2 preserves mixed records and optional mixed working drafts;
      schema-1 backups migrate without data loss.
- [ ] Restore retains preview, merge/replace, library-record ID remapping, skipped-record diagnostics,
      draft opt-in, single-use apply, current-data preservation, and all-invalid anti-wipe behavior.
- [ ] No backend, network request, account, telemetry, new route, remote media fetch, runtime package,
      external team codec, hero/henchman catalog, or party-wide rule is added.
- [ ] Focused domain, reducer, persistence, local-storage, library, selector, component, comparison,
      transfer, backup, template, share, and App suites pass.
- [ ] `npm run test:run -- src/app test/domain` passes.
- [ ] `npm run verify` passes.
- [ ] `git diff --check` passes.
- [ ] README and compendium documentation describe build sets, state/persistence invariants, schema
      migration, local save/load, variants, comparison, validation, transfer, selected-loadout share,
      single-build compatibility, and deferred scope.
- [ ] BW-1601 through BW-1606, EPIC-16, SPRINT-017, `work/sprints/ledger.tsv`, and the ticket-burn
      result manifest agree on scope, status, evidence, deferrals, and completion.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Active editor and persisted selected entry diverge, losing the last unsaved edit during switch/save/pagehide. | Medium | Critical | Store either active editor or inactive snapshot per entry, never both; centralize switch/serialize/hydrate helpers; run transition-sequence and pagehide tests. |
| The persistence refactor silently drops old single-build data or eagerly rewrites it. | Medium | Critical | Capture schema-1 fixtures first, migrate field-for-field, compute normalized durable fingerprints at hydration, assert no write on read, and retain write-blocked recovery. |
| Keeping schema 2 under a key named `build-wars:v1` is confusing or permits downgrade loss. | Medium | High | Document that the key is a stable discovery key, dispatch by envelope schema, and rely on old clients' unsupported/write-blocked behavior; do not dual-write or delete the old key. |
| Entry duplication shares nested references or identity with the source. | Medium | High | Use one deep snapshot clone/re-key helper, caller-supplied deterministic IDs, frozen fixtures, and mutate-after-duplicate regression tests for every nested structure. |
| Selection dirties saved content merely by browsing entries. | High | Medium | Separate authored-content and workspace-persistence fingerprints; autosave durable selection while leaving named-record dirty status unchanged. |
| A mixed record union spreads conditionals throughout the app and regresses single-build flows. | Medium | High | Centralize document serialization/hydration and record selectors, use exhaustive discriminant switches, retain build-specific adapters, and make single-build regressions a closeout gate. |
| Library and summary validation of many entries becomes sluggish. | Medium | Medium | Cap entries and aggregate loadouts, memoize by snapshot/catalog fingerprint, reuse precomputed catalog views, and avoid rendering full tooltips/editors in cards. |
| Navigator cards become an inaccessible nest of interactive controls. | Medium | High | Use a navigation list with separate native selection/actions, explicit labels, deterministic DOM/focus order, escape-close/focus restoration, and keyboard component tests. |
| Set navigation overwhelms narrow layouts or the existing editor. | Medium | Medium | Keep one editor, place a bounded list above it, stack cards at narrow width, avoid full multi-pane editing, and smoke-test maximum-entry overflow. |
| `variant`, promotion, or comparison accidentally establishes base/party semantics. | Medium | Medium | Persist no parent/base pointer, define promotion as kind-only, compare any two entries, and reserve all party adaptation for EPIC-17. |
| Comparison hides meaningful partial/raw differences or changes with catalog ordering. | Medium | High | Compare normalized IDs/values and unresolved overlays, use labels only for presentation, path-key rows deterministically, and test missing/stale catalogs. |
| Aggregate status is mistaken for party legality. | High | High | Invoke validation independently, label completeness as authoring status, add no cross-entry rule codes, keep rule-engine version fixed, and document the boundary in UI/docs. |
| Whole-set export is confused with Guild Wars team-template compatibility. | High | Medium | Use an unmistakable Build Wars JSON kind/extension/copy, keep template/share buttons selected-loadout only, and make external codecs an explicit deferral. |
| Large or malformed imported sets multiply parsing, cloning, and validation work. | Medium | High | Bound input bytes, records, aggregate loadouts, entries, strings, arrays, and diagnostics before hydration; reject dangerous keys and unsupported discriminants. |
| Backup schema changes weaken restore anti-wipe or ID-conflict behavior. | Low | Critical | Extend the current preview/apply path rather than replacing it, remap only library IDs, migrate v1 fixtures, and keep all-invalid replace tests as a phase gate. |
| Scope expands into multi-pane editing, hero content, party rules, or external codecs. | Medium | High | Treat one active editor, compact summaries, neutral kinds, native JSON, and EPIC-17 handoff as binding scope limits. |

## Security

- Treat local-storage values, backup files, build-set transfers, set/entry labels and notes, IDs, raw
  template overlays, and nested build/equipment/title state as untrusted input.
- Bound raw JSON byte length before `JSON.parse`, then bound record count, aggregate loadout count,
  entries per set, nested collections, string lengths, diagnostics, and comparison/validation work.
- Reject prototype-dangerous keys recursively before migration or stable serialization. Reconstruct
  accepted envelopes, records, sets, entries, and snapshots field by field; use null-prototype maps or
  `Map` for untrusted-key indexes.
- Require dense arrays, supported discriminants/versions/enums, finite safe integers, exact ID
  uniqueness, and valid selected-entry references. Never evaluate imported strings or dynamically
  import paths/URLs named in JSON.
- Render names, labels, notes, raw labels, diagnostics, and comparison values as escaped React text.
  Do not use `dangerouslySetInnerHTML`, markdown execution, inline event attributes, or source HTML.
- Native export and backup are inert JSON downloads. Sanitize filenames, create/revoke object URLs,
  and never upload files, fetch embedded resources, or expose local filesystem paths.
- Preserve explicit confirmation for removal, whole-document replacement, in-set template
  replacement, and replace restore. Preserve restore preview, single-use apply, all-invalid anti-wipe,
  storage revision conflicts, and write-blocked recovery.
- Do not let malformed one-entry data erase valid sibling records silently. Bound diagnostics,
  identify skipped paths, block writes after partial recovery, and require explicit recovery before
  replacing stored bytes.
- Re-key copies with locally generated opaque IDs. Do not derive object keys, DOM IDs, filenames, or
  trusted identity directly from user labels.
- Keep generated catalog imports behind `src/app/catalogs.ts`; do not embed generated catalogs, QA
  reports, source snapshots, validation prose, or source paths in build-set transfer files.
- Add no network request, backend, account identifier, authentication, telemetry, collaboration
  channel, remote image, environment secret, or new dependency.
- Local JSON export is recovery/transfer data, not proof of game validity, authorship, account
  ownership, or external-template compatibility.

## Dependencies

- **EPIC-08 / SPRINT-009**: `Build`, the single `EditorState`/reducer, one-editor app shell,
  profession/attribute/skill controls, catalog boundary, selectors, accessibility patterns, and
  responsive layout.
- **EPIC-09 / SPRINT-010**: the `build-wars:v1` discovery key, working-draft versus named-save model,
  local record metadata, dirty guards, durability states, revision conflicts, backup/restore,
  corruption recovery, skill-template sharing, and library selectors/components.
- **EPIC-13 / SPRINT-014**: framework-neutral nullable semantic equipment carried by every nested
  `Build` and existing validation/summary contracts.
- **EPIC-14 / SPRINT-015**: equipment editor, equipment summary selectors, workspace tabs,
  persistence/backup integration, and omission warnings.
- **EPIC-15 / SPRINT-016**: `Build` schema 2 title overrides, title-rank selectors/controls,
  `PersistedBuildSnapshot`, local migration behavior, rule-engine v3, and title share warnings.
- `src/app/editor-state.ts`, `workspace-state.ts`, `persistence-schema.ts`, `local-storage.ts`,
  `backup-restore.ts`, `library-selectors.ts`, `App.tsx`, and their tests are direct implementation
  foundations.
- Existing React 19, React DOM 19, TypeScript 5.9, Vite 6, Vitest 4, Testing Library, ESLint 9,
  Prettier 3, and npm 11 toolchain.
- Existing app-owned promoted catalog views only; no new generated data set or ingestion work.
- EPIC-17 is a downstream consumer, not an implementation dependency. It should add party-specific
  adapters, labels, rules, and external formats without changing the EPIC-16 neutral base.
- No new npm/Python package, service, API, database, worker, route, environment variable, runtime
  media, or external reference implementation is required.

## Open Questions

No open question blocks execution. The sprint resolves the intent questions with these defaults:

1. A domain entry stores `Build`; the persisted/app entry stores the existing complete
   `PersistedBuildSnapshot`. This keeps PvE budget and raw overlay durable without coupling domain
   code to app state.
2. The local-library envelope advances to schema 2 while retaining the `build-wars:v1` discovery
   key. Schema-1 libraries migrate in memory, and read-only migration does not write.
3. Runtime entries use an exclusive active-editor/inactive-snapshot union. Switching performs an
   atomic snapshot/hydrate transition, so no eager mirrored copy can drift.
4. The local library becomes a discriminated saved-document list. Build-set navigation lives above
   the main editor, not inside the already dense saved-record panel.
5. Compact summaries include label/kind, profession/mode, all eight skill states, concise equipment,
   meaningful title/PvE facts, and attention status. Full derived stats, roles, synergy, and party
   facts remain deferred.
6. Existing whole-library backup becomes mixed-document schema 2, and one native Build Wars set JSON
   envelope supplies lossless whole-set transfer. Skill-template/share URLs remain selected-loadout
   only.
7. Aggregate validation is a selector over independent existing validation results plus neutral
   draft completeness. It adds no party rules or rule-engine version change.
8. Selection is durable resume state but not authored content for dirty-status purposes. Comparison
   target and collapsed-card state remain ephemeral.
9. Promotion is a kind-only `variant -> build` transition; no base-entry relationship is added.
10. The default structural limit is 24 entries per set, subject only to a Phase 0 reduction if
    measured serialized-size or selector-cost evidence shows that value cannot safely fit existing
    local-storage and rendering constraints.
