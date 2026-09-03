---
id: SPRINT-018
title: Party Semantics and Sharing
status: planned
source_target: BACKLOG
source_epic: EPIC-17
source_epic_path: work/tickets/17-party-and-hero-builder/EPIC.md
tickets:
  - BW-1702
  - BW-1703
  - BW-1704
  - BW-1705
  - BW-1706
created: 2026-09-03
---

# Sprint 018: Party Semantics and Sharing

## Overview

This sprint adds optional party semantics on top of the SPRINT-017 neutral build-set workspace.
Single-build drafts and neutral build sets remain valid first-class workflows. Users who never opt
into party mode should continue to see the current build editor, local library, selected-loadout
sharing, build-set transfer, backup/restore, validation, equipment, and title-rank behavior with no
party-specific friction.

Implementation order is the main constraint. The sprint should freeze the party annotation contract
and persistence shape first, then land runtime slot assignment and preset actions, then add the
party workspace UI, then add deterministic party-level validation, then extend native transfer and
multi-code sharing, and only after those gates close update docs and traceability records. That
sequence keeps the highest-risk durability work ahead of UI polish and prevents share/export
surfaces from solidifying against an unstable data model.

These execution defaults are binding:

1. `src/domain/build-set.ts` remains the neutral loadout container. Party behavior is expressed as a
   separate framework-neutral annotation contract, owned by a rewritten `src/domain/party.ts`, and
   referenced from persisted build-set snapshots.
2. Build-set entries remain complete authored loadouts. Empty party positions are represented by
   ordered party slots whose `entryId` may be `null`; the sprint must not introduce nullable
   `Build` payloads or new build-set entry kinds.
3. Party metadata is additive on `PersistedBuildSetSnapshot`. `LOCAL_LIBRARY_SCHEMA_VERSION`
   remains `2`, and older schema-2 build-set documents without party metadata normalize to
   `party: null`.
4. Party mode is reversible. Once created, the party annotation persists and can be toggled on or
   off without losing underlying build-set entries; disabling party mode hides party behavior
   without downgrading or deleting loadouts.
5. Party slot order is authoritative for the party workspace. Occupied slots reference existing
   build-set entry IDs exactly once, and occupied-slot reorder actions must keep the underlying
   build-set entry array in the same relative order so neutral views, transfer, and persistence stay
   deterministic.
6. Member labels, freeform roles, and kind labels are party-owned metadata. Existing build-set
   entry labels and notes remain loadout-owned metadata and must continue to round-trip unchanged.
7. Selected-loadout share URLs and skill-template import/export remain selected-member-only. Party
   sharing adds native JSON and a practical multi-code clipboard format; it does not add a new URL
   grammar, hosted links, or external team-template support.
8. Party validation is narrow and structural: duplicate or stale slot assignments, preset/slot
   mismatches, empty required slots, unresolved or incomplete occupied members, and mixed member
   modes. The sprint must not add synergy scoring, build-quality advice, hero AI, unlock checks, or
   composition recommendations.
9. Runtime generated data remains isolated to `src/app/catalogs.ts`. No new runtime dependencies,
   source-data pipelines, backend services, accounts, or remote media are added.

## Use Cases

1. A user converts an existing neutral build set into party mode and gets ordered member slots
   without rebuilding the underlying loadouts.
2. A user keeps a build set neutral and continues to use it for variants or comparison with no
   party-specific UI or validation.
3. A user selects a party-size preset, sees the existing loadouts mapped into slots in order, and
   gets empty slots for the remaining positions.
4. A user edits one selected member in the existing editor while the rest of the party remains
   visible as compact member cards with labels, roles, professions, skills, equipment, and
   validation state.
5. A user leaves one or more slots empty intentionally while planning a party and sees that state
   reflected clearly without fabricating placeholder loadouts.
6. A user assigns a lightweight member kind such as player, hero, mercenary, guest, or a custom
   label without selecting a real hero identity from a catalog.
7. A user duplicates a member, clears a member, reorders members, or changes presets without losing
   unsaved edits on the currently selected member.
8. A user sees party-level structural issues such as preset mismatch, empty required slots, or
   mixed PvE/PvP member modes while still being able to continue editing individual loadouts.
9. A user saves a party-enabled build set locally, reloads the browser, duplicates a saved record,
   restores from backup, or imports native JSON and keeps member labels, roles, kind labels, slot
   order, and party enablement intact.
10. A user exports a party-enabled build set as native Build Wars JSON and later imports it without
    silent loss of party metadata, unresolved state, or loadout content.
11. A user copies a multi-code text block for the party and gets one code per representable member,
    explicit `Empty` rows for empty slots, and explicit `Unavailable` reasons for members that
    cannot be exported as skill templates.
12. A user shares the selected member through the existing share URL flow and sees explicit
    warnings that sibling members and party metadata are omitted.

## Architecture

| Area | Owns | Must Not Own |
| --- | --- | --- |
| `src/domain/party.ts` | Framework-neutral party annotation types, stable slot IDs, preset helpers, normalization, and deterministic structural issue codes. | React, browser APIs, local-storage I/O, generated catalog imports, hero catalogs, or external codec logic. |
| `src/app/build-set-state.ts` | Runtime party annotation state over build sets, slot-to-entry assignment, selected-member switching, preset expansion, enable/disable behavior, and occupied-slot reorder logic. | Catalog adaptation, DOM behavior, or direct clipboard/file APIs. |
| `src/app/workspace-state.ts` | Workspace actions for party enablement, preset changes, add/clear/remove/duplicate/reorder member flows, save/update/load semantics, and dirty-guard interaction. | Presentational layout or party-specific validation rendering. |
| `src/app/persistence-schema.ts`, `src/app/local-storage.ts`, `src/app/backup-restore.ts`, `src/app/build-set-transfer.ts` | Additive parse/serialize/migrate behavior for party metadata in working drafts, saved records, backups, and Build Wars JSON transfer. | UI-only transient state, layout concerns, or source-data imports. |
| `src/app/party-selectors.ts` and `src/app/build-set-selectors.ts` | Party member card summaries, aggregate issue counts, clipboard/export view models, library badges, and selected-member projections. | Mutable reducer state or unsafe parsing. |
| `src/app/components/*` and `src/app/App.tsx` | Party workspace presentation, responsive layout, dialogs, copy/export affordances, warnings, and keyboard focus flow. | Validation authority, persistence parsing, or generated-data loading outside `catalogs.ts`. |

### Contract Shapes

Preferred shape, with exact TypeScript names allowed to follow local style:

```text
PARTY_ANNOTATION_SCHEMA_VERSION = 1
PARTY_SIZE_PRESETS = 4 | 6 | 8 | "custom"

PartyMemberKind =
  | "unspecified"
  | "player"
  | "hero"
  | "mercenary"
  | "guest"
  | "custom"

PartySlot
  id: PartySlotId
  entryId: BuildSetEntryId | null
  memberLabel: string | null
  roleLabel: string | null
  memberKind: PartyMemberKind
  customKindLabel: string | null

PartyAnnotations
  schemaVersion: 1
  enabled: boolean
  preset: 4 | 6 | 8 | "custom"
  slotCount: number
  slots: readonly PartySlot[]

PersistedBuildSetSnapshot
  schemaVersion: 1
  id: AuthoredDocumentId
  name: string
  entries: readonly PersistedBuildSetEntrySnapshot[]
  lastSelectedEntryId: BuildSetEntryId | null
  party: PartyAnnotations | null
```

Binding decisions:

1. The existing placeholder `PartyBuild` shape in `src/domain/party.ts` should be replaced. Party
   annotations reference build-set entry IDs; they do not own `Build | null` payloads.
2. `party: null` means the build set has never used party mode or the annotation was explicitly
   cleared from legacy/malformed input. `party.enabled = false` means the annotation exists and is
   preserved, but the workspace is currently operating in neutral mode.
3. Slot IDs are stable authored IDs, distinct from build-set entry IDs, so preset changes,
   reorders, and copy flows can preserve focus and member metadata even when occupancy changes.
4. Every occupied slot must reference an existing build-set entry ID exactly once. Unassigned
   entries or duplicate assignments are structural validation issues.
5. Presets are `4`, `6`, and `8`. `custom` allows any slot count from `1` through
   `MAX_BUILD_SET_ENTRIES`. Preset shrink operations that would strand assigned entries must be
   blocked or explicitly resolved before commit.
6. Existing build-set entry notes remain the only authored notes field for occupied members. Party
   mode reuses those notes in summaries instead of adding a second member-notes field.
7. Multi-code copy and native JSON export must preserve empty-slot position. Share URLs and skill
   templates remain scoped to the selected occupied member only.

### Runtime Model

Party mode extends the existing one-active-editor rule instead of replacing it:

```text
Workspace document kind: "build-set"
  -> neutral mode
       -> existing selectedEntryId and comparisonEntryId behavior

  -> party-enabled mode
       -> selectedEntryId still identifies the one live EditorState
       -> party.slots define display order and empty positions
       -> occupied non-selected members stay as PersistedBuildSnapshot
       -> empty slots carry no EditorState and no placeholder Build
```

Operational rules:

1. Enabling party mode seeds party slots from the current build-set entry order and selected entry,
   then appends empty slots to satisfy the chosen preset or custom size.
2. Selecting an occupied party slot reuses the existing materialize-and-hydrate transition from
   SPRINT-017. Selecting an empty slot does not fabricate a build; instead it exposes add/copy
   actions for that slot.
3. Adding a member fills the first selected empty slot when one exists; otherwise it appends a new
   occupied slot only when custom sizing still stays within `MAX_BUILD_SET_ENTRIES`.
4. Clearing a member removes the build-set entry assignment from the slot while leaving the slot
   metadata intact. Removing a slot is separate from removing a member and is allowed only when the
   resulting slot count still satisfies preset or custom rules.
5. Reordering occupied slots updates both slot order and the relative order of the corresponding
   build-set entries so transfer, neutral navigation, and duplicate flows remain deterministic.

### Validation Topology

Party validation should stay pure and layered:

```text
per-loadout validateBuild()
  -> member summary projection
       -> party structural validation input
            -> deterministic party issue codes
                 -> UI aggregate banners + member-card attention rows
```

The party validator should accept reduced facts, not full app state. Suggested inputs are slot
shape, slot count, preset, occupied member IDs, and per-member `mode`, `complete`, `resolved`,
`stale`, and `catalogUnavailable` flags derived from existing selectors.

Suggested structural issue families:

- `party:slot-count-mismatch`
- `party:preset-size-mismatch`
- `party:duplicate-slot-id`
- `party:duplicate-entry-assignment`
- `party:missing-entry-assignment`
- `party:unknown-entry-assignment`
- `party:empty-required-slot`
- `party:member-incomplete`
- `party:member-unresolved`
- `party:mode-mismatch`

The validator must not rank builds, recommend replacements, or conflate unresolved catalog data with
illegal party composition.

### Storage and Transfer Strategy

`build-wars:v1` remains the only browser-local storage key. Party support is additive inside the
current schema-2 envelope:

1. Working drafts and saved records keep the same discriminated `build | build-set` document model.
   Party metadata exists only inside the `build-set` branch.
2. Schema-2 build-set records missing `party` normalize to `party: null` and remain writable on the
   next authorized change.
3. Malformed party metadata from ambient local storage or mixed backups should degrade to a neutral
   build set with diagnostics when the underlying build-set snapshot is still valid.
4. Explicit Build Wars JSON party import should be stricter: malformed party metadata blocks apply
   and surfaces diagnostics, because the user intentionally requested a party import.
5. The existing `build-wars-build-set-transfer` envelope remains the native JSON carrier. Party
   export/import is a context-specific use of that envelope when `snapshot.party?.enabled === true`.
6. Neutral build-set transfer JSON without `party` remains importable and should hydrate as a
   neutral build set.

### Execution Topology

```text
Phase 0 baseline and regression freeze
  -> BW-1702 party annotations, presets, and persistence contract
BW-1702
  -> BW-1703 party workspace UI
BW-1702 + BW-1703
  -> BW-1704 structural party validation
BW-1702 + BW-1703 + BW-1704
  -> BW-1705 native JSON, multi-code copy, save/load, backup/restore
BW-1703 + BW-1704 + BW-1705
  -> BW-1706 docs, traceability, and final verification
```

`BW-1702` is the hard prerequisite. `BW-1703` should not start until the persisted annotation shape
and reducer actions stop moving. `BW-1705` depends on validation settling so multi-code copy and
party export can reflect final blocked/unavailable reasons instead of transient placeholder rules.

## Implementation

### Execution Bookkeeping

- [ ] Keep `SPRINT-018`, `EPIC-17`, and `BW-1702` through `BW-1706` aligned across the draft, final
      sprint, ticket records, ledger, and run manifest.
- [ ] Preserve `BW-1701` as a parked external-codec ticket and do not pull it into MVP scope.
- [ ] Treat current single-build and neutral build-set behavior as the regression baseline for every
      phase gate.
- [ ] Keep runtime generated-data imports isolated to `src/app/catalogs.ts`.
- [ ] Add no new runtime dependency, backend service, account model, hosted share surface, or
      external team-template codec.

### Phase 0: Baseline and Regression Freeze (~5%)

**Files:**

- `work/sprints/SPRINT-017.md`
- `work/tickets/17-party-and-hero-builder/*.md`
- `src/app/build-set-state.test.ts`
- `src/app/workspace-state.test.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/share-url.test.ts`
- `src/app/template-workflow.test.ts`
- `src/app/build-set-transfer.test.ts`
- `src/app/backup-restore.test.ts`

**Tasks:**

- [ ] Freeze the binding decisions in this draft before party UI work begins: additive build-set
      annotations, no nullable build payloads, selected-loadout-only share URLs, and no new codec.
- [ ] Capture the current neutral build-set durability baseline around selection switching, duplicate
      entry IDs, transfer JSON, autosave, restore preview, and share/template omission warnings.
- [ ] Add or tighten regression tests where SPRINT-017 behavior is currently implied but not
      explicit, especially around selected-entry switching and build-set transfer import.

**Verification:**

- `npm run test:run -- src/app/build-set-state.test.ts src/app/workspace-state.test.ts src/app/persistence-schema.test.ts src/app/local-storage.test.ts src/app/share-url.test.ts src/app/template-workflow.test.ts src/app/build-set-transfer.test.ts src/app/backup-restore.test.ts`
- `npm run typecheck`

**Phase Gate:** Neutral build-set behavior is locked as the compatibility baseline, and the party
contract decisions are stable enough that downstream UI and sharing work will not need to re-open
core persistence questions.

### Phase 1: BW-1702 Party Annotations and Presets (~25%)

**Files:**

- `src/domain/party.ts`
- `src/domain/index.ts`
- `src/app/persistence-schema.ts`
- `src/app/build-set-state.ts`
- `src/app/workspace-state.ts`
- `src/app/local-storage.ts`
- `src/app/library-fixtures.ts`
- `src/domain/party.test.ts`
- `src/app/build-set-state.test.ts`
- `src/app/workspace-state.test.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.test.ts`

**Tasks:**

- [ ] Replace the placeholder `PartyBuild` contract in `src/domain/party.ts` with annotation-first
      types, preset helpers, stable slot IDs, normalization helpers, and structural parse/repair
      utilities.
- [ ] Add additive optional `party` metadata to `PersistedBuildSetSnapshot`, with precise defaults
      for legacy build sets and bounded validation for malformed slot data.
- [ ] Extend runtime build-set state to support enabling party mode, disabling it without deleting
      annotations, seeding presets from existing entry order, and keeping party selection aligned
      with `selectedEntryId`.
- [ ] Add reducer actions for preset changes, custom slot count changes, member assignment, empty
      slot creation, occupied-slot clear, slot removal, slot reorder, member label edits, role
      edits, and member kind updates.
- [ ] Keep occupied slot order and build-set entry order synchronized so neutral mode remains
      deterministic after party edits.
- [ ] Preserve build-set entry labels and notes as independent loadout metadata; party member labels
      and roles must not overwrite them.
- [ ] Add fixture coverage for legacy neutral build sets, newly-enabled parties, disabled-but-kept
      annotations, duplicate slot IDs, duplicate entry assignments, oversized custom parties, and
      missing referenced entry IDs.

**Verification:**

- `npm run test:run -- src/domain/party.test.ts src/app/build-set-state.test.ts src/app/workspace-state.test.ts src/app/persistence-schema.test.ts src/app/local-storage.test.ts`
- `npm run typecheck`

**Phase Gate:** Party annotations, presets, migration defaults, and reducer/state invariants are
stable enough that UI work can project member cards and actions without reworking the persisted
contract.

### Phase 2: BW-1703 Party Workspace UI (~25%)

**Files:**

- `src/app/party-selectors.ts`
- `src/app/build-set-selectors.ts`
- `src/app/library-selectors.ts`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/components/BuildSetDialogs.tsx`
- `src/app/components/BuildSetComparison.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/App.tsx`
- `src/app/styles.css`
- `src/app/build-set-selectors.test.ts`
- `src/app/library-selectors.test.ts`
- `src/app/build-set-navigator.test.tsx`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Add a party-focused projection layer that converts a materialized build set plus party
      annotations into member cards, aggregate counts, copy/export badges, and actionable empty-slot
      view models.
- [ ] Render a dedicated `PartyWorkspace` view for party-enabled build sets while keeping the
      existing neutral `BuildSetNavigator` path intact for non-party workspaces.
- [ ] Show slot order, member labels, roles, member kind labels, profession pairs, skill strips,
      equipment summaries, title indicators, notes indicators, and current validation status without
      requiring portraits or hero catalogs.
- [ ] Support keyboard and pointer flows for selecting members, selecting empty slots, preset
      changes, add/copy into empty slot, duplicate selected member, clear member, remove slot,
      reorder slot, and rename/edit metadata actions.
- [ ] Keep the current one-editor model explicit: one selected occupied member edits in the existing
      editor column, while empty-slot selection renders add/copy guidance instead of a phantom
      editor.
- [ ] Add responsive behavior for narrow widths so slot cards, labels, badges, and actions wrap
      cleanly without page-level horizontal scroll.
- [ ] Surface a simple library badge or row summary that distinguishes party-enabled build sets from
      neutral build sets without changing single-build library behavior.

**Verification:**

- `npm run test:run -- src/app/build-set-selectors.test.ts src/app/library-selectors.test.ts src/app/build-set-navigator.test.tsx src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** Users can assemble and inspect a readable party workspace from existing loadouts,
empty members are explicit, selection preserves unsaved state, and responsive layout is stable
before validation and sharing logic attach to the UI.

### Phase 3: BW-1704 Party Validation (~18%)

**Files:**

- `src/domain/party.ts`
- `src/app/party-selectors.ts`
- `src/app/build-set-selectors.ts`
- `src/app/components/PartyWorkspace.tsx`
- `src/domain/party.test.ts`
- `src/app/build-set-selectors.test.ts`
- `src/app/build-set-navigator.test.tsx`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Add a pure structural party validator with deterministic issue codes and stable paths suitable
      for app display and tests.
- [ ] Feed the validator only reduced member facts derived from existing per-loadout validation:
      `mode`, `complete`, `resolved`, `stale`, `catalogUnavailable`, and selected slot occupancy.
- [ ] Aggregate current per-loadout validation results with new party-specific issue families
      without hiding member-level validation details.
- [ ] Flag empty required slots, invalid preset/slot-count combinations, duplicate or missing
      assignments, unresolved or incomplete occupied members, and mixed member modes.
- [ ] Keep all party-level issues non-blocking for editing; users must still be able to select and
      modify individual members while the party remains incomplete or mixed.
- [ ] Make attention rows, summary text, and member-card badges deterministic so copy/export and
      docs can rely on stable wording classes.

**Verification:**

- `npm run test:run -- src/domain/party.test.ts src/app/build-set-selectors.test.ts src/app/build-set-navigator.test.tsx src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** Party validation is explainable, deterministic, and clearly separated from build
quality or team-optimization advice.

### Phase 4: BW-1705 Party Export and Sharing (~20%)

**Files:**

- `src/app/build-set-transfer.ts`
- `src/app/components/BuildSetTransferDialog.tsx`
- `src/app/backup-restore.ts`
- `src/app/local-storage.ts`
- `src/app/persistence-schema.ts`
- `src/app/template-workflow.ts`
- `src/app/components/ShareControls.tsx`
- `src/app/components/LibraryDialogs.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/library-fixtures.ts`
- `src/app/build-set-transfer.test.ts`
- `src/app/build-set-transfer-dialog.test.tsx`
- `src/app/backup-restore.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/template-workflow.test.ts`
- `src/app/share-url.test.ts`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Extend native Build Wars build-set transfer to round-trip party metadata, empty slots, member
      labels, roles, kind labels, and disabled-but-preserved annotations while remaining compatible
      with neutral build-set JSON.
- [ ] Keep explicit bounds on transfer bytes, slot counts, entry counts, string lengths, and
      diagnostics; malformed explicit party imports must fail closed with preview diagnostics.
- [ ] Add a practical multi-code clipboard export that emits one numbered member block per slot with
      slot/member label, role or kind text when present, `Code: <template>` for representable
      members, `Empty` for empty slots, and `Unavailable: <reason>` for blocked members.
- [ ] Preserve the existing selected-loadout share URL and template export workflows exactly; in
      party mode they should continue to target only the selected occupied member and warn about
      omitted sibling members and party metadata.
- [ ] Keep selected-loadout template import scoped to the selected occupied member and preserve party
      slot metadata when import replaces the member snapshot.
- [ ] Ensure local library save/update/load, saved-record duplication, working-draft autosave,
      backup export, and backup restore all preserve party metadata without silently downgrading
      party-enabled build sets.
- [ ] Keep external team-template support absent and explicit in UI copy and docs. No `paw-ned2`
      import/export path should appear in this sprint.

**Verification:**

- `npm run test:run -- src/app/build-set-transfer.test.ts src/app/build-set-transfer-dialog.test.tsx src/app/backup-restore.test.ts src/app/local-storage.test.ts src/app/template-workflow.test.ts src/app/share-url.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** Party metadata survives every supported local-first durability path, selected-member
sharing remains honest about omissions, and native JSON plus multi-code copy provide the intended
MVP sharing boundary without external codecs.

### Phase 5: BW-1706 Docs and Closeout (~7%)

**Files:**

- `README.md`
- `compendium/multi-build-workspace.md`
- `compendium/local-library-and-sharing.md`
- `compendium/core-build-editor.md`
- `compendium/game-rule-engine.md`
- `compendium/visual-prior-art.md`
- `work/tickets/17-party-and-hero-builder/*.md`
- `work/sprints/SPRINT-018.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-17-result.json`

**Tasks:**

- [ ] Document party annotations as a lightweight overlay on build sets, including presets, empty
      slots, member labels, roles, kind labels, validation scope, native JSON transfer, and
      multi-code copy behavior.
- [ ] Record the explicit deferrals: hero/henchman catalogs, portraits, hero AI, unlock tracking,
      team-template codecs, hosted sharing, backend sync, collaboration, and recommendation engines.
- [ ] Update closeout records so `EPIC-17`, `BW-1702` through `BW-1706`, `SPRINT-018`, the ledger,
      and the run manifest agree on scope, evidence, and deferred work.
- [ ] Re-run full verification and capture any residual UX or durability caveats in docs or ticket
      notes rather than leaving them implicit.

**Verification:**

- `npm run verify`
- `git diff --check`

**Phase Gate:** Documentation, ticket state, sprint records, and verification evidence agree on the
implemented party boundary and the explicitly deferred hero/catalog/external-codec work.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/party.ts` | Modify | Replace the placeholder party shape with annotation contracts, preset helpers, slot normalization, and structural validation issue types. |
| `src/domain/index.ts` | Modify | Export party contracts and helpers for app and test use. |
| `src/app/persistence-schema.ts` | Modify | Add additive `party` snapshot parsing, normalization, clone, and fingerprint support. |
| `src/app/build-set-state.ts` | Modify | Extend runtime build-set state with party enablement, slot assignment, preset changes, empty slots, and reorder helpers. |
| `src/app/workspace-state.ts` | Modify | Add workspace actions and persistence wiring for party flows. |
| `src/app/local-storage.ts` | Modify | Preserve party metadata in working drafts and saved records under `build-wars:v1`. |
| `src/app/backup-restore.ts` | Modify | Carry party metadata through backup preview, merge, replace, and restore apply. |
| `src/app/build-set-transfer.ts` | Modify | Round-trip party metadata inside the native Build Wars build-set transfer envelope. |
| `src/app/party-selectors.ts` | Create | Project party slots and member summaries from materialized build sets plus annotations. |
| `src/app/build-set-selectors.ts` | Modify | Reuse neutral summaries and add party-aware aggregate status integration. |
| `src/app/library-selectors.ts` | Modify | Distinguish party-enabled build sets in library projections and search/filter summaries. |
| `src/app/components/PartyWorkspace.tsx` | Create | Render party preset controls, slot cards, empty-slot actions, and selected-member guidance. |
| `src/app/components/BuildSetNavigator.tsx` | Modify | Preserve neutral build-set navigation and route party-enabled sets to the party workspace. |
| `src/app/components/BuildSetDialogs.tsx` | Modify | Add dialogs or menus for member label, role, kind, clear/remove, and preset-changing flows. |
| `src/app/components/BuildSetComparison.tsx` | Modify | Keep comparison available in party mode with party/member labels where relevant. |
| `src/app/components/BuildSetTransferDialog.tsx` | Modify | Preview and apply native JSON that may carry party annotations. |
| `src/app/components/ShareControls.tsx` | Modify | Keep selected-member sharing intact and add explicit party omission and multi-code copy messaging. |
| `src/app/components/LibraryPanel.tsx` | Modify | Surface party-enabled saved records without changing single-build behavior. |
| `src/app/components/LibraryDialogs.tsx` | Modify | Preserve party metadata in backup and restore dialog flows. |
| `src/app/App.tsx` | Modify | Compose the party workspace, empty-slot behavior, dialogs, and existing selected-editor shell. |
| `src/app/template-workflow.ts` | Modify | Keep selected-member template import/export scoped correctly inside party mode. |
| `src/app/styles.css` | Modify | Add responsive party slot-card, badge, and action layout styles. |
| `src/app/library-fixtures.ts` | Modify | Add neutral, enabled, disabled, malformed, and max-size party-enabled build-set fixtures. |
| `src/domain/party.test.ts` | Create | Cover presets, slot normalization, assignment invariants, and structural issue codes. |
| `src/app/build-set-state.test.ts` | Modify | Verify party enablement, slot assignment, clear/remove behavior, and selected-member switching. |
| `src/app/workspace-state.test.ts` | Modify | Verify workspace actions, save/load, duplicate, dirty-guard, and party-mode transitions. |
| `src/app/persistence-schema.test.ts` | Modify | Verify additive parse/serialize behavior, malformed-party recovery, and explicit import rejection. |
| `src/app/local-storage.test.ts` | Modify | Verify autosave, saved-record persistence, and recovery with party-enabled build sets. |
| `src/app/backup-restore.test.ts` | Modify | Verify backup/restore preview and apply for neutral and party-enabled build sets. |
| `src/app/build-set-transfer.test.ts` | Modify | Verify native JSON export/import bounds and party metadata round-trip. |
| `src/app/build-set-transfer-dialog.test.tsx` | Modify | Verify import preview/apply UI for valid and malformed party transfer data. |
| `src/app/build-set-selectors.test.ts` | Modify | Verify member summaries, aggregate statuses, and party-aware selection projections. |
| `src/app/library-selectors.test.ts` | Modify | Verify library filtering and summaries for party-enabled records. |
| `src/app/build-set-navigator.test.tsx` | Modify | Verify member selection, empty-slot actions, reorder, preset changes, and responsive states. |
| `src/app/template-workflow.test.ts` | Modify | Verify selected-member-only template import/export behavior in party mode. |
| `src/app/share-url.test.ts` | Modify | Verify share URLs remain selected-member-only and party metadata stays omitted. |
| `src/app/App.test.tsx` | Modify | Verify end-to-end editor, party UI, validation, and sharing flows at the app shell level. |
| `README.md` and compendium docs | Modify | Document party semantics, sharing boundaries, and explicit deferred scope. |
| Sprint, ticket, ledger, and manifest artifacts | Modify | Record final scope, evidence, and closeout traceability for `SPRINT-018`. |

## Definition of Done

- [ ] `BW-1702` through `BW-1706` are implemented in dependency order and traceable to `EPIC-17`.
- [ ] Single-build workflows and neutral build-set workflows remain compatible and verified.
- [ ] Party semantics are an annotation over build sets, not a new loadout payload model and not a
      redefinition of `BuildSetEntryKind`.
- [ ] Empty party positions are represented by slots with `entryId: null`; no nullable `Build`
      payload is introduced.
- [ ] Party metadata has a stable framework-neutral contract with bounded preset, slot, label, role,
      and member-kind state.
- [ ] `src/domain/party.ts` is framework-neutral and imports no React, DOM, browser-storage, or
      generated-data modules.
- [ ] `PersistedBuildSetSnapshot` preserves party metadata additively, and schema-2 build sets
      without party data still load as neutral build sets.
- [ ] Party mode can be enabled and disabled without losing underlying build-set entries or corrupting
      selected-member editing.
- [ ] Occupied party slots reference existing build-set entries exactly once, and duplicate/missing
      assignments are detected deterministically.
- [ ] Presets `4`, `6`, `8`, and `custom` work within the `MAX_BUILD_SET_ENTRIES` cap, including
      empty-slot seeding and guarded shrink behavior.
- [ ] Member labels, freeform roles, and kind labels survive save/load, duplicate record,
      backup/restore, transfer import/export, and selected-member template import.
- [ ] Existing build-set entry labels and notes survive party enable/disable and are not overwritten
      by member labels or roles.
- [ ] The current one-active-editor model remains intact: one selected occupied member uses the live
      `EditorState`, non-selected occupied members use persisted snapshots, and empty slots use no
      fabricated build.
- [ ] Selecting a member, switching away, and switching back preserves unsaved professions, mode,
      attributes, skills, title overrides, equipment, raw template data, and nested build name.
- [ ] Empty slots are visually clear and actionable in the party workspace.
- [ ] Party workspace UI shows slot order, member labels, roles, member kind labels, profession
      pairs, skill strips, equipment/title indicators, and validation state without portrait assets.
- [ ] Keyboard and pointer flows cover member selection, empty-slot selection, add/copy, duplicate,
      clear/remove, reorder, preset changes, and metadata edits with stable focus order.
- [ ] Responsive layout avoids overlapping controls and page-level horizontal scroll at supported
      widths.
- [ ] Party-level validation adds deterministic structural issue codes and does not judge build
      quality or block single-member editing.
- [ ] Per-loadout validation details remain accessible from the party workspace.
- [ ] Mixed member modes, incomplete occupied members, unresolved occupied members, empty required
      slots, preset mismatch, duplicate slot IDs, duplicate assignments, and stale references are
      covered by tests.
- [ ] Native Build Wars JSON export/import preserves party metadata and remains compatible with
      neutral build-set JSON.
- [ ] Malformed explicit party import fails closed with diagnostics and does not partially apply.
- [ ] Ambient malformed local or backup party metadata degrades safely to neutral build-set behavior
      when the underlying build-set snapshot is still valid.
- [ ] Multi-code clipboard output preserves slot order, includes explicit empty or unavailable rows,
      and keeps blocked reasons deterministic.
- [ ] Selected-member share URLs and skill-template export remain unchanged in grammar, caps, and
      selected-loadout-only scope.
- [ ] Selected-member template import preserves party slot metadata when replacing the member
      snapshot.
- [ ] Local library working drafts, saved records, saved-record duplication, autosave, backup, and
      restore preserve party metadata without silent downgrade.
- [ ] No `paw-ned2` or other external team-template import/export path is added.
- [ ] Docs explicitly defer hero/henchman catalogs, portraits, hero AI, unlock tracking, hosted
      sharing, backend sync, collaboration, and recommendation systems.
- [ ] `npm run test:run -- src/app src/domain` passes.
- [ ] `npm run verify` passes.
- [ ] `git diff --check` passes.
- [ ] `EPIC-17`, `BW-1702` through `BW-1706`, `SPRINT-018`, `work/sprints/ledger.tsv`, and the
      ticket-burn manifest agree on status, scope, and evidence.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Party slot order and build-set entry order diverge, causing inconsistent neutral views, transfer output, or duplicate behavior. | Medium | High | Make party slot order authoritative, centralize reorder helpers, and assert occupied-slot and entry-order alignment in reducer and persistence tests. |
| Persisted party metadata corrupts valid build-set data on parse or migration. | Medium | Critical | Keep party support additive, reconstruct from `unknown`, default missing `party` to `null`, and distinguish safe degradation from explicit import rejection. |
| Empty-slot behavior leaks into the selected-editor path and creates phantom or partially initialized builds. | Medium | High | Keep empty slots annotation-only, render action guidance instead of a build editor, and guard all selected-member code paths against `selectedEntryId: null`. |
| Preset shrink or custom size changes strand existing member assignments. | Medium | High | Block destructive size changes until the user clears or reassigns affected members, and cover preset transitions with focused state tests. |
| Member labels, roles, and entry labels are conflated, causing user-visible data loss or confusing rename behavior. | Medium | High | Keep build-set entry metadata and party member metadata separate in types, reducers, dialogs, and file formats. |
| Party validation expands into recommendation logic or hero-specific semantics. | Medium | Medium | Keep validation inputs structural, own issue codes in the domain layer, and document deferred scope clearly. |
| Multi-code clipboard output becomes too brittle or too large for practical use. | Medium | Medium | Use a simple numbered plain-text format, cap clipboard text size, include explicit unavailable reasons, and keep native JSON as the complete fidelity path. |
| Reusing the existing build-set transfer envelope creates user confusion about whether party export is distinct. | Medium | Medium | Keep the envelope kind stable for compatibility, but label the UI and docs explicitly as party export/import when party mode is enabled. |
| Library, autosave, or backup flows silently drop party metadata during mixed document handling. | Medium | Critical | Add round-trip tests for every durability path, keep discriminated `build | build-set` storage branches, and verify party metadata survives duplicate and restore flows. |
| UI density makes the party workspace hard to scan or inaccessible at narrow widths. | Medium | High | Favor compact but explicit member cards, separate primary from secondary actions, and gate the phase on responsive and keyboard-navigation tests. |

## Security

- Treat party metadata, build-set transfer JSON, backup JSON, local-storage payloads, labels, roles,
  and custom kind labels as untrusted input.
- Reject dangerous keys recursively before migration, hydration, preview, or apply.
- Reconstruct accepted party annotations, slots, and build-set snapshots field by field instead of
  spreading unknown objects into runtime state.
- Bound slot counts, entry counts, string lengths, clipboard text size, JSON byte size, diagnostic
  counts, and validation work.
- Require dense arrays, supported schema versions, supported member-kind discriminants, unique slot
  IDs, and valid build-set entry references.
- Render all user-authored labels, roles, notes, and diagnostics as escaped React text. Do not add
  HTML execution, markdown execution, or `dangerouslySetInnerHTML`.
- Keep native party export/import inert and local-first. No network requests, uploads, or embedded
  resource dereferences are added.
- Preserve explicit confirmation for destructive restore/replace flows, member-clearing flows, and
  any action that would discard local party annotations.
- Keep generated catalogs, manifests, QA reports, source snapshots, filesystem paths, and other
  non-runtime artifacts out of native party export payloads.

## Dependencies

- `EPIC-08` / `SPRINT-009`: single-build editor shell, validation panel, template UI, responsive
  patterns, and app catalog projections.
- `EPIC-09` / `SPRINT-010`: local library schema, working drafts, saved records, dirty guards,
  backup/restore, revision conflict handling, and selected-loadout share URLs.
- `EPIC-13` / `SPRINT-014`: semantic equipment contracts and persistence that party member summaries
  must continue to reuse.
- `EPIC-14` / `SPRINT-015`: equipment editor, equipment summaries, and equipment omission warnings
  that remain selected-member-only.
- `EPIC-15` / `SPRINT-016`: title-rank overrides, title controls, validation, and omission warnings
  that remain selected-member-only.
- `EPIC-16` / `SPRINT-017`: neutral build-set contracts, one-active-editor workspace model,
  build-set selectors, comparison, schema-2 mixed documents, build-set transfer, and backup/restore
  support.
- Existing promoted EPIC-03, EPIC-04, EPIC-10, EPIC-11, and EPIC-12 catalogs through
  `src/app/catalogs.ts`.
- Existing React, TypeScript, Vite, Vitest, Testing Library, ESLint, Prettier, npm, and ticket-burn
  tooling.
- No new dependency on hero catalogs, portraits, remote media, backend services, hosted share
  infrastructure, or external team-template codecs.

## Open Questions

No open question should block execution. This draft binds the material planning decisions:

1. Party metadata lives as an additive optional annotation on `PersistedBuildSetSnapshot`, with pure
   contracts in `src/domain/party.ts`. It is not a separate top-level document kind or wrapper.
2. Empty party positions are represented by ordered slots with `entryId: null`, not by nullable
   build payloads or synthetic empty build-set entries.
3. MVP presets are `4`, `6`, and `8`, with `custom` allowed from `1` through `16`.
4. Lightweight member kinds are `unspecified`, `player`, `hero`, `mercenary`, `guest`, and
   `custom`, with a bounded custom label for freeform cases.
5. Party validation codes stay structural and deterministic. Recommendation, synergy, and hero-AI
   analysis remain deferred.
6. Native party export reuses the existing `build-wars-build-set-transfer` envelope carrying party
   annotations when present. No second party-specific envelope is required for MVP.
7. Multi-code copy uses numbered plain text with explicit `Code`, `Empty`, or `Unavailable` lines
   per slot so partial representability remains practical and honest.
