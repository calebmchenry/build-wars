---
id: SPRINT-018
title: Party Semantics and Sharing
status: completed
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
updated: 2026-09-03
---

# Sprint 018: Party Semantics and Sharing

## Overview

This sprint lets a SPRINT-017 neutral build set opt into party semantics without changing what a
build-set entry means. Build-set entries remain complete authored loadouts and keep
`BuildSetEntryKind = "build" | "variant" | "freeform"` as neutral organization metadata. Party
behavior is a versioned annotation layer with ordered slots, nullable entry references, common party
size presets, member labels, roles, lightweight member-kind labels, party-context notes, structural
validation, native party JSON, and practical multi-code copying.

The central invariant is one active editor at most. An occupied selected party slot points to one
ordinary build-set entry and uses the existing materialize-and-hydrate transition. An empty selected
slot points to no entry, snapshots the outgoing active editor, leaves all entries inactive, and
shows create/assign actions instead of a placeholder build. Save, autosave, pagehide flush,
validation, summaries, backup, transfer, native party export, and sharing projections must all use
the same materialized snapshot path so the active loadout cannot drift from persisted party state.

Party mode is reversible and local-first. `party: null` means a build set has no party annotation.
`party.enabled: false` means valid party metadata is dormant while the user works in neutral
build-set mode. Confirmed Reset Party clears the annotation only; it never deletes loadouts. Existing
single-build and neutral build-set workflows must remain compatible for users who never enable party
mode.

Lossless exchange uses inert Build Wars JSON. General build-set transfer and whole-library backup
preserve party annotations when present. Explicit party import/export uses a distinct
`build-wars-party-transfer` envelope that embeds the same canonical persisted build-set snapshot and
requires an enabled party annotation. Multi-code text is a deterministic convenience projection in
party order; it includes every slot as a code, empty marker, or unavailable marker and never claims
to be lossless or externally compatible.

The sprint intentionally excludes BW-1701 paw-ned2/team-template compatibility, hero and henchman
catalogs, portraits, unlock tracking, hero AI behavior, guide publishing, hosted sharing, accounts,
backend sync, collaboration, external team codecs, whole-party URLs, recommendations, synergy
scoring, and new runtime dependencies.

## Assumptions

1. EPIC-17 can be implemented as one sprint because BW-1702 through BW-1706 are groomed, ready, and
   dependency ordered.
2. BW-1701 remains a backlog parking-lot ticket and is not required for the MVP party workflow.
3. SPRINT-017 build-set contracts, schema-2 local-library behavior, backup/restore, transfer,
   comparison, and aggregate validation are stable implementation inputs.
4. The existing 16-entry build-set cap is also the party slot cap for MVP.
5. Party slot order and neutral build-set entry order are independent authored orders.
6. Built-in party size presets are 2, 4, 6, 8, and 12; custom sizes span 1 through 16.
7. Party slot notes are party-context notes and stay separate from neutral build-set entry notes.
8. Planning skipped interview under the non-interactive ticket-burn contract because the material
   architecture choices are resolved in this sprint.
9. This planning run updates sprint, draft, ticket, ledger, run-state, and result-manifest records
   only; no implementation source change or commit is part of planning.

## Use Cases

1. **Stay neutral**: A user who never enables party mode keeps the existing single-build and neutral
   build-set editor, library, comparison, validation, backup, transfer, template, and share behavior.
2. **Enable party mode**: A user marks an existing build set as a party and receives slots seeded
   from current entries without rebuilding loadouts or changing neutral entry metadata.
3. **Start empty**: A user creates a party from an empty set and gets empty slots with create/assign
   actions, not fabricated builds.
4. **Choose a size**: A user selects 2, 4, 6, 8, 12, or custom 1-16 slots. Growing adds empty slots;
   shrinking is blocked unless removed slots are empty and have default metadata.
5. **Describe members**: A slot can carry member label, role, kind, freeform kind label, and
   party-context notes without requiring hero identity or rewriting the loadout label.
6. **Edit one member**: Selecting an occupied slot opens that member in the existing profession,
   attribute, skill, title, equipment, template, share, and validation surfaces.
7. **Plan with empty slots**: Selecting an empty slot preserves outgoing edits and disables
   selected-loadout actions until the user creates or assigns a loadout.
8. **Manage structure**: A user can select, create, assign, clear, duplicate, reorder, resize, and
   edit slot metadata without silently deleting loadouts.
9. **Keep unassigned work**: Clearing a slot detaches the member while preserving the underlying
   loadout as an unassigned build-set entry.
10. **Validate the party**: A user sees structural party issues and aggregate per-loadout status for
    empty slots, incomplete members, unresolved members, mixed modes, and stale references.
11. **Edit through issues**: Party validation explains problems but does not block single-member
    editing.
12. **Recover locally**: Working drafts, saved records, saved-record duplication, autosave,
    pagehide, backup, restore, build-set transfer, and native party transfer preserve party metadata.
13. **Copy codes**: A user previews and copies party-order text with one block per slot and explicit
    code, empty, unavailable, and omission facts.
14. **Share one member**: Existing share URLs still target the occupied selected member and warn that
    sibling members, party metadata, equipment, title overrides, and notes are omitted.

## Architecture

### Scope Boundary

| Area        | In Scope                                                                                                                                        | Out of Scope                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Domain      | Framework-neutral party annotations, slot IDs, presets, member kinds, labels, roles, notes, normalization, structural validation helpers.       | Hero/henchman catalogs, portraits, unlocks, AI, recommendations, generated catalog imports, browser APIs. |
| Build sets  | Optional app/persistence party annotation referencing complete build-set entries by ID.                                                         | Changing `BuildSetEntryKind`, nullable build-set payloads, party-only build-set semantics.                |
| Workspace   | Enable/disable/reset party, occupied/empty selection, create/assign/clear/duplicate/reorder/resize, unassigned entries, comparison repair.      | Multiple full editors, routes, collaboration, undo history, backend sync.                                 |
| Persistence | Nested persisted build-set snapshot v2, v1 migration, selected party slot, cloning, fingerprints, local saves, backup/restore, transfers.       | New localStorage key, outer schema bump, IndexedDB, eager migration writes, destructive downgrade.        |
| UI          | Party workspace, slot cards, metadata dialogs, empty states, validation overview, multi-code/native export controls, responsive keyboard flows. | Portrait assets, full game UI clone, remote media, new UI library, simultaneous editors.                  |
| Validation  | Structural party issue codes and aggregate existing per-loadout validation.                                                                     | Synergy scoring, build quality, PvX/meta advice, hero legality, PvP format enforcement.                   |
| Sharing     | Native party JSON, party-preserving build-set transfer/backup, multi-code text, selected-member URL/template boundaries.                        | paw-ned2, external team codecs, whole-party URL fragments, hosted links, accounts, publishing.            |

### Binding Decisions

1. `src/domain/build-set.ts` remains party-neutral and framework-neutral.
2. `src/domain/party.ts` replaces the placeholder `PartyBuild` graph with annotation contracts. No
   party type embeds a `Build` or `PersistedBuildSnapshot`.
3. Party slots reference `BuildSetEntryId | null`; null is the only empty-slot representation.
4. A build-set entry may be referenced by at most one slot. Unreferenced entries are valid
   unassigned loadouts.
5. Party order is `party.slots` array order. Neutral entry order is unchanged by party reordering.
6. Member label, role, member kind, freeform kind label, and slot notes belong to slots. Entry label,
   entry kind, and entry notes remain neutral loadout metadata.
7. `party: null` means no annotation. `party.enabled: false` means dormant annotation. Reset Party
   requires confirmation and clears annotations only.
8. The domain `BuildSet` schema remains version 1. The app-owned persisted build-set snapshot
   advances to version 2 and migrates existing version-1 snapshots in memory to `party: null`.
9. The outer local-library envelope remains schema 2 under `build-wars:v1`. Reading migrated data
   must not dirty the draft, write storage, or increment revision.
10. `lastSelectedPartySlotId` is durable resume state. It is distinct from `lastSelectedEntryId`
    because empty slots can be selected.
11. Selected party slot, selected entry, comparison target, and active editor state are repaired
    together in one deterministic operation after clear, delete, shrink, import, restore, or stale
    persisted references.
12. Explicit party import fails closed on malformed or unsupported party data. Ambient local/backup
    data may preserve accessible loadouts, but unsupported future party versions must not be silently
    erased by load-and-save.
13. General build-set transfer preserves party annotations. Explicit party transfer uses
    `build-wars-party-transfer` and the same canonical nested snapshot parser.
14. Multi-code text is line-normalized, byte-bounded, deterministic, and not an import format.
15. No new npm package, Python package, network request, backend service, runtime data pipeline,
    route, image asset, worker, or environment variable is planned.

### Contract Shapes

Exact TypeScript names may follow local style, but these invariants are binding:

```text
PARTY_ANNOTATION_SCHEMA_VERSION = 1
MAX_PARTY_SLOTS = MAX_BUILD_SET_ENTRIES = 16
PARTY_SIZE_PRESETS = [2, 4, 6, 8, 12]

PartySlotId = branded string
PartySize =
  { kind: "preset", size: 2 | 4 | 6 | 8 | 12 }
  | { kind: "custom", size: number }

PartyMemberKind =
  "unspecified" | "player" | "hero" | "mercenary" | "guest" | "freeform"

PartySlotAnnotation
  id: PartySlotId
  entryId: BuildSetEntryId | null
  memberLabel: string
  role: string | null
  memberKind: PartyMemberKind
  memberKindLabel: string | null
  notes: string | null

PartyAnnotations
  schemaVersion: 1
  enabled: boolean
  size: PartySize
  slots: readonly PartySlotAnnotation[]
```

`memberKindLabel` is meaningful only for `memberKind: "freeform"`; otherwise it normalizes to null.
Labels are capped at 120 characters, roles at 120, freeform kind labels at 80, and notes at 1,000.
User mutations may normalize empty text to null. Unknown imported data is validated strictly and
never spread into runtime state.

```text
PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION = 2
LEGACY_PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION = 1

PersistedBuildSetSnapshotV2
  schemaVersion: 2
  id: AuthoredDocumentId
  name: string
  entries: readonly PersistedBuildSetEntrySnapshot[]
  lastSelectedEntryId: BuildSetEntryId | null
  party: PartyAnnotations | null
  lastSelectedPartySlotId: PartySlotId | null
```

### State Flow

```text
Build-set workspace
  neutral mode
    selected entry -> live EditorState
    inactive entries -> PersistedBuildSnapshot

  party enabled
    selected occupied slot -> referenced entry -> live EditorState
    selected empty slot -> no active entry
    inactive entries -> PersistedBuildSnapshot
    unassigned entries -> preserved complete loadouts
```

All reducers are pure and ID-addressed. UI confirmation happens before dispatching destructive or
metadata-discarding actions. Reducers receive explicit confirmed intent and remain deterministic in
tests.

## Implementation

### Phase 0: Baseline and Contract Freeze (~5% of effort)

**Tickets:** BW-1702

**Files:**

- `work/sprints/SPRINT-018.md`
- `work/tickets/17-party-and-hero-builder/*.md`
- `src/domain/party.ts`
- `src/domain/build-set.ts`
- `src/app/build-set-state.test.ts`
- `src/app/workspace-state.test.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/build-set-transfer.test.ts`
- `src/app/backup-restore.test.ts`
- `src/app/share-url.test.ts`
- `src/app/App.test.tsx`

**Tasks:**

- [x] Mark SPRINT-018 and BW-1702 in progress when execution begins; leave BW-1701 backlog.
- [x] Run focused SPRINT-017 baseline tests for neutral build sets, switching, comparison,
      save/load, autosave, backup/restore, transfer, template import/export, share URLs, equipment,
      title overrides, and validation.
- [x] Freeze the party contract: annotation layer, nullable slot references, independent party
      order, dormant disable, reset behavior, presets, selected slot state, snapshot v2 migration,
      native party transfer, and multi-code grammar.
- [x] Add immutable fixtures for legacy neutral build-set snapshots, current neutral snapshots,
      transfer envelopes, mixed backups, and saved-record duplication before changing parsers.
- [x] Confirm `src/domain/party.ts` is a placeholder to replace, not a compatibility shape to
      preserve.
- [x] Confirm no new dependency, generated-data import, portrait/media fetch, external codec, route,
      backend, or account model enters the sprint.

**Verification:**

- `npm run test:run -- src/app/build-set-state.test.ts src/app/workspace-state.test.ts src/app/persistence-schema.test.ts src/app/local-storage.test.ts src/app/build-set-transfer.test.ts src/app/backup-restore.test.ts src/app/share-url.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Gate:** Baseline behavior is green and every binding decision above is represented by a fixture,
test, or explicit implementation task.

### Phase 1: BW-1702 Party Contracts and Nested Migration (~20% of effort)

**Files:**

- `src/domain/party.ts`
- `src/domain/index.ts`
- `src/domain/build-set.ts`
- `test/domain/party.test.ts`
- `test/domain/contracts.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/library-fixtures.ts`

**Tasks:**

- [x] Replace `PartyBuild` with exported annotation contracts, branded slot IDs, presets, member
      kinds, text bounds, normalizers, constructors, clone helpers, and structural validation.
- [x] Keep `BuildSet`, `BuildSetEntry`, and `BuildSetEntryKind` unchanged and test that party
      annotations contain references only.
- [x] Implement deterministic enable-from-set behavior for entry counts 0 through 16, including
      non-preset counts, exact preset matching, custom sizing, four-slot empty default, and
      caller-supplied stable slot IDs.
- [x] Implement slot helpers for label, role, kind, freeform label, notes, assign, clear, move,
      resize, duplicate metadata, reset metadata, and unassigned-entry projection.
- [x] Enforce one declared size authority: `party.slots.length` must match `party.size`.
- [x] Add persisted build-set snapshot v2 with `party` and `lastSelectedPartySlotId`; migrate
      version-1 snapshots in memory to v2 with `party: null`.
- [x] Keep the outer local-library schema and `build-wars:v1` storage key unchanged.
- [x] Reject or diagnose unsupported versions, sparse arrays, duplicate slot IDs, duplicate entry
      assignments, dangling references, invalid enums, over-limit strings, dangerous keys, and
      oversized slot collections.
- [x] Preserve all existing loadout data, raw overlays, equipment, title overrides, record metadata,
      saved-with facts, timestamps, revision, and associations during migration.
- [x] Prove valid migration does not dirty, write, increment revision, or become write-blocked by
      itself.

**Verification:**

- `npm run test:run -- test/domain/party.test.ts test/domain/contracts.test.ts src/app/persistence-schema.test.ts`
- `npm run typecheck`

**Gate:** Version-1 neutral snapshots migrate losslessly and current party snapshots round-trip
before runtime party actions are added. BW-1702 remains open until Phase 2 durability passes.

### Phase 2: BW-1702 Runtime State and Durability (~17% of effort)

**Files:**

- `src/app/party-state.ts`
- `src/app/party-state.test.ts`
- `src/app/build-set-state.ts`
- `src/app/build-set-state.test.ts`
- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/local-storage.ts`
- `src/app/local-storage.test.ts`
- `src/app/library-fixtures.ts`

**Tasks:**

- [x] Add runtime party state and selected-slot state to build-set documents while preserving
      single-build and neutral build-set discriminants.
- [x] Generalize active/inactive invariants to zero or one active entry and remove any unsafe
      materialization fallback that could persist a placeholder editor as a member.
- [x] Implement enable, disable, confirmed reset, select occupied slot, select empty slot, rename
      slot, set role, set kind/freeform label, set slot notes, resize, move, assign existing, create
      member, clear member, duplicate member, and reset-slot-metadata transitions.
- [x] Keep mutations stable-ID-addressed, immutable, deterministic, cap-aware, and supplied with
      caller-generated IDs.
- [x] Materialize the active editor before every member navigation, empty-slot selection, slot
      mutation, entry removal, duplication, import, save, autosave, pagehide, validation, backup,
      transfer, export, and library projection.
- [x] Make Clear Member detach-only; make Delete Loadout a separate confirmed operation that also
      clears party references atomically.
- [x] Define selection repair for selected slot, selected entry, comparison target, and no-active
      editor after clear, delete, shrink, import, restore, and stale persisted references.
- [x] Re-key set, entry, nested build, slot, slot reference, selected slot, selected entry, and
      comparison IDs during saved-record duplication and restore remaps.
- [x] Preserve dormant annotations through neutral entry operations or block operations that would
      silently corrupt hidden references.
- [x] Ensure editor/template/share actions target only an occupied selected member while party mode
      is enabled.

**Verification:**

- `npm run test:run -- src/app/party-state.test.ts src/app/build-set-state.test.ts src/app/workspace-state.test.ts src/app/local-storage.test.ts`
- `npm run typecheck`

**Gate:** Party transitions survive materialize/hydrate/save/load/autosave/pagehide round trips and
the neutral build-set state suite remains green. BW-1702 can close after this gate.

### Phase 3: BW-1703 Party Workspace UI (~19% of effort)

**Files:**

- `src/app/party-selectors.ts`
- `src/app/party-selectors.test.ts`
- `src/app/build-set-selectors.ts`
- `src/app/build-set-selectors.test.ts`
- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/components/PartyDialogs.tsx`
- `src/app/party-workspace.test.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/template-dialogs.test.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Build one party view model that joins slots to materialized loadout summaries through existing
      app catalog views and reports occupied, empty, selected, unassigned, disabled, and action
      states.
- [x] Branch `BuildSetNavigator` between neutral and enabled-party presentation while preserving
      neutral transfer, comparison, and disable/reset entry points.
- [x] Render ordered slot cards with ordinal, member label, role, kind label, profession pair, mode,
      eight skill states, equipment/title indicators, entry-note indicator, slot-note indicator, and
      non-color status text.
- [x] Render empty selected-slot and no-selected-member states with Create Member and Assign Existing
      actions. Do not render the placeholder editor as a member.
- [x] Add focused dialogs or disclosures for metadata, preset/custom sizing, unassigned loadouts,
      assign, clear, reset, duplicate failures, and destructive confirmations.
- [x] Keep profession, attribute, skill, title, equipment, template, share, and validation controls
      bound to the occupied selected member and disabled for empty selected slots.
- [x] Keep Copy Into Set explicit: it assigns a chosen empty slot or creates an unassigned loadout;
      it never guesses party placement.
- [x] Preserve comparison access in party mode and repair comparison display when selected,
      compared, empty, cleared, deleted, or reordered members change.
- [x] Support keyboard and pointer flows with unique accessible names, visible focus, focus
      containment/restoration, polite announcements, Escape close, wrapping long text, stable card
      dimensions, and no page-level horizontal overflow.
- [x] Use local CSS placeholders and compact text summaries only. Do not add portraits or prior-art
      screenshot assets.

**Verification:**

- `npm run test:run -- src/app/party-selectors.test.ts src/app/party-workspace.test.tsx src/app/build-set-selectors.test.ts src/app/library-selectors.test.ts src/app/build-set-navigator.test.tsx src/app/template-dialogs.test.tsx src/app/App.test.tsx`
- `npm run typecheck`

**Gate:** Empty, one-member, mixed occupied/empty, unassigned, and 16-slot parties are operable by
keyboard and pointer at desktop and narrow widths without losing active edits.

### Phase 4: BW-1704 Party Validation (~14% of effort)

**Files:**

- `src/domain/party.ts`
- `test/domain/party.test.ts`
- `src/app/party-validation.ts`
- `src/app/party-validation.test.ts`
- `src/app/party-selectors.ts`
- `src/app/party-selectors.test.ts`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/party-workspace.test.tsx`
- `src/app/components/ValidationPanel.tsx`
- `src/app/editor-selectors.ts`

**Tasks:**

- [x] Implement deterministic party structural issue codes, severity/state meanings, paths, slot and
      entry locations, sorting, count bounds, and truncation behavior.
- [x] Aggregate existing `selectValidationView` or `validateBuild` results independently for each
      occupied slot and preserve underlying issue details.
- [x] Distinguish structural errors, loadout errors, warnings, incomplete state, unresolved state,
      empty state, stale facts, and catalog-unavailable state with documented display precedence.
- [x] Add checks for empty declared slots, incomplete members, unresolved members, unknown mode,
      mixed known PvE/PvP modes, preset mismatch, missing references, duplicate assignments, and
      duplicate slot IDs.
- [x] Keep parser errors fail-closed at explicit import boundaries while authored party validation
      remains non-blocking for editing.
- [x] Keep `validateBuild`, existing game-rule issue codes, and `RULE_ENGINE_VERSION` unchanged for
      party composition.
- [x] Prove no role inference, hero legality, duplicate-skill advice, composition constraint,
      synergy score, meta check, or recommendation enters validation.
- [x] Render party attention rows that select occupied members or focus empty slot actions while the
      selected member Validation Panel keeps detailed per-loadout issues.

**Verification:**

- `npm run test:run -- test/domain/party.test.ts src/app/party-validation.test.ts src/app/party-selectors.test.ts src/app/party-workspace.test.tsx test/domain/rule-engine.test.ts src/app/build-set-selectors.test.ts`
- `npm run typecheck`

**Gate:** Party validation is narrow, deterministic, non-blocking, and demonstrably separate from
the game rule engine.

### Phase 5: BW-1705 Native Party Transfer, Multi-Code Copy, and Recovery (~20% of effort)

**Files:**

- `src/app/party-transfer.ts`
- `src/app/party-transfer.test.ts`
- `src/app/party-sharing.ts`
- `src/app/party-sharing.test.ts`
- `src/app/components/PartyTransferDialog.tsx`
- `src/app/party-transfer-dialog.test.tsx`
- `src/app/components/PartySharePanel.tsx`
- `src/app/party-share-panel.test.tsx`
- `src/app/build-set-transfer.ts`
- `src/app/build-set-transfer.test.ts`
- `src/app/components/BuildSetTransferDialog.tsx`
- `src/app/build-set-transfer-dialog.test.tsx`
- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/components/LibraryPanel.tsx`
- `src/app/components/ShareControls.tsx`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/share-url.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`

**Tasks:**

- [x] Implement `build-wars-party-transfer` create/serialize/parse/preview/apply helpers using one
      normalized persisted build-set snapshot with an enabled party annotation.
- [x] Reuse canonical persisted-build-set parsing, cloning, migration, stable serialization, ID
      remapping, and byte/string/diagnostic caps across party transfer, build-set transfer, backup,
      restore, and local storage.
- [x] Add an internal gate proving parser/serializer parity across party transfer, general
      build-set transfer, backup export, restore preview, restore apply, saved-record duplication,
      and local storage before library/search/share UI changes land.
- [x] Preserve every loadout field, unresolved raw fact, unassigned entry, empty slot, party label,
      role, member kind, freeform kind label, slot note, party order, preset, enabled state, and
      durable selection through native export/import.
- [x] Extend general build-set transfer to round-trip enabled and dormant party annotations and
      migrate legacy neutral payloads without making external-team-template claims.
- [x] Prove whole-library backup/restore preserves party metadata in merge and replace modes,
      including ID remaps, skipped records, draft opt-in, all-invalid anti-wipe, stale revisions, and
      write-blocked recovery.
- [x] Implement multi-code projection by materializing every occupied member and applying existing
      skill-template export policy independently.
- [x] Include every slot in deterministic text with code/fidelity, empty marker, unavailable reason
      codes, and equipment/title/party-note omission markers. Normalize line breaks and control
      characters in user text.
- [x] Cap multi-code text at 32,000 UTF-8 bytes. Block oversized output and leave preview text
      selectable on clipboard denial.
- [x] Present available, empty, unavailable, and lossy counts before copy; allow transparent partial
      copy only with accurate button text.
- [x] Keep selected-member share URLs and template exports byte/grammar compatible and expand
      omission warnings for sibling members and party metadata.
- [x] Update library summaries/search to identify enabled and dormant parties, occupied and empty
      counts, member labels, roles, kind labels, and notes without breaking neutral rows.

**Verification:**

- `npm run test:run -- src/app/party-transfer.test.ts src/app/party-transfer-dialog.test.tsx src/app/party-sharing.test.ts src/app/party-share-panel.test.tsx src/app/build-set-transfer.test.ts src/app/build-set-transfer-dialog.test.tsx src/app/backup-restore.test.ts src/app/persistence-schema.test.ts src/app/library-selectors.test.ts src/app/template-workflow.test.ts src/app/share-url.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Gate:** Native JSON is lossless across every local/transfer path, multi-code loss is explicit, and
all previous neutral transfer, backup, template, and share fixtures still pass.

### Phase 6: BW-1706 Documentation, Regression, and Closeout (~5% of effort)

**Files:**

- `README.md`
- `compendium/multi-build-workspace.md`
- `compendium/local-library-and-sharing.md`
- `compendium/core-build-editor.md`
- `compendium/game-rule-engine.md`
- `compendium/visual-prior-art.md`
- `work/tickets/17-party-and-hero-builder/EPIC.md`
- `work/tickets/17-party-and-hero-builder/BW-1702-party-annotations-and-presets.md`
- `work/tickets/17-party-and-hero-builder/BW-1703-party-workspace-ui.md`
- `work/tickets/17-party-and-hero-builder/BW-1704-party-validation.md`
- `work/tickets/17-party-and-hero-builder/BW-1705-party-export-and-sharing.md`
- `work/tickets/17-party-and-hero-builder/BW-1706-party-docs-and-closeout.md`
- `work/tickets/17-party-and-hero-builder/BW-1701-pawned2-template-integration.md`
- `work/sprints/SPRINT-018.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-17-result.json`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/execute-SPRINT-018-result.json`

**Tasks:**

- [x] Document party annotations, independent party order, nullable slot references, reversible
      mode, presets, slot notes versus entry notes, unassigned loadouts, selected-editor behavior,
      structural validation, persistence migration, native party JSON, multi-code limits, and
      selected-member URLs.
- [x] Document that the local-library outer schema/key, domain `BuildSet` schema, build-entry kinds,
      single-build behavior, neutral build-set behavior, and game rule engine remain stable.
- [x] State explicitly that hero/henchman catalogs, portraits, AI behavior, unlocks, paw-ned2/team
      templates, whole-party URLs, hosted sharing, guides, backend sync, collaboration, and
      recommendations remain deferred.
- [x] Preserve BW-1701 as backlog with SPRINT-006 evidence; do not mark it done or imply native
      Build Wars JSON supplies external compatibility.
- [x] Run focused regressions, full verification, and diff checks.
- [x] Manually smoke-test single build, neutral build set, enabled/dormant party, empty selected
      slot, maximum slots, narrow layout, keyboard actions, comparison, reload, local save,
      backup/restore, native party transfer, partial multi-code copy, and selected-member share URL.
- [x] Reconcile BW-1702 through BW-1706, EPIC-17, SPRINT-018, ledger, execution manifest, and
      documentation only after every Definition of Done item passes.

**Verification:**

- `npm run test:run -- src/app test/domain test/template-compatibility`
- `npm run verify`
- `git diff --check`

**Gate:** EPIC-17 closes only after verification passes, docs match shipped behavior, and BW-1701
remains explicitly parked.

## Files Summary

| File or Area                                                                    | Action                  | Purpose                                                                                                        |
| ------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/domain/party.ts`                                                           | Replace                 | Party annotations, slot IDs, presets, member metadata, bounds, helpers, and structural validation.             |
| `src/domain/index.ts`                                                           | Modify                  | Export party contracts and helpers.                                                                            |
| `src/domain/build-set.ts`                                                       | Preserve/minimal modify | Keep neutral build-set semantics and caps separate from party annotations.                                     |
| `test/domain/party.test.ts`, `test/domain/contracts.test.ts`                    | Create/modify           | Prove annotation invariants and absence of a second loadout graph.                                             |
| `src/app/party-state.ts`, `src/app/party-state.test.ts`                         | Create                  | Party construction, transitions, selection repair, resizing, assignment, duplication, and defensive no-ops.    |
| `src/app/build-set-state.ts`, tests                                             | Modify                  | Support zero/one active entry, empty-slot selection, party-aware entry removal, and complete materialization.  |
| `src/app/workspace-state.ts`, tests                                             | Modify                  | Add party workspace actions, dirty/durable behavior, selected-loadout guards, and identity remapping.          |
| `src/app/persistence-schema.ts`, tests                                          | Modify                  | Add persisted build-set snapshot v2, v1 migration, party validation, cloning, fingerprints, and selected slot. |
| `src/app/local-storage.ts`, tests                                               | Reuse/modify            | Preserve party metadata under existing storage, conflict, quota, and write-block behavior.                     |
| `src/app/library-fixtures.ts`                                                   | Modify                  | Add legacy neutral, enabled, dormant, malformed, empty, max-size, backup, and restore fixtures.                |
| `src/app/party-selectors.ts`, tests                                             | Create                  | Party header, slot cards, unassigned rows, actions, validation summary, and sharing view models.               |
| `src/app/party-validation.ts`, tests                                            | Create                  | Structural and aggregate party validation over materialized build sets.                                        |
| `src/app/components/PartyWorkspace.tsx`, tests                                  | Create                  | Render party workspace, slot cards, empty states, validation links, actions, and dialogs.                      |
| `src/app/components/PartyDialogs.tsx`                                           | Create                  | Metadata, sizing, assignment, clear/reset, and destructive confirmation flows.                                 |
| `src/app/components/BuildSetNavigator.tsx`, tests                               | Modify                  | Add party entry points while preserving neutral navigator behavior.                                            |
| `src/app/components/TemplateDialogs.tsx`, tests                                 | Modify                  | Bind template import/export to occupied selected members.                                                      |
| `src/app/library-selectors.ts`, `LibraryPanel.tsx`, `LibraryDialogs.tsx`, tests | Modify                  | Summarize/search party records and preserve party metadata in backup/restore UI.                               |
| `src/app/party-transfer.ts`, transfer dialog/tests                              | Create                  | Native party JSON envelope, parse, preview, apply, bounds, and filenames.                                      |
| `src/app/build-set-transfer.ts`, dialog/tests                                   | Modify                  | Preserve party annotations in general set transfer and legacy migrations.                                      |
| `src/app/party-sharing.ts`, share panel/tests                                   | Create                  | Deterministic bounded multi-code text and copy availability summaries.                                         |
| `src/app/components/ShareControls.tsx`, `template-workflow.ts`, tests           | Modify                  | Keep selected-member sharing/template behavior honest and metadata-preserving.                                 |
| `src/app/App.tsx`, `App.test.tsx`                                               | Modify                  | Compose party workspace, empty-slot behavior, dialogs, validation, autosave, and share flows.                  |
| `src/app/styles.css`                                                            | Modify                  | Add compact responsive party layouts, focus, wrapping, cards, and dialogs.                                     |
| `README.md`, `compendium/*.md`                                                  | Modify during execution | Document party contracts, validation, persistence, transfer/share limits, and deferrals.                       |
| `work/tickets/17-party-and-hero-builder/*.md`                                   | Modify                  | Track planned/completed sprint evidence while leaving BW-1701 backlog.                                         |
| `work/sprints/ledger.tsv`, run manifests                                        | Modify                  | Track sprint lifecycle and ticket-burn results.                                                                |

## Definition of Done

- [x] BW-1702 through BW-1706 are implemented in dependency order and traceable to EPIC-17.
- [x] BW-1701 remains backlog and no paw-ned2 or external team-template codec is added.
- [x] Single-build and neutral build-set workflows remain compatible and verified.
- [x] Party mode is an optional annotation over build sets and does not redefine
      `BuildSetEntryKind` or embed loadouts.
- [x] Empty party positions are slots with `entryId: null`; no nullable build-set payload or phantom
      build is introduced.
- [x] Party annotations have stable slot IDs, one size authority, array order, labels, roles,
      member kinds, freeform kind labels, slot notes, and strict bounds.
- [x] Presets 2/4/6/8/12 and custom 1-16 work for creation, growth, mismatch, cap, and
      non-destructive shrink behavior.
- [x] Party order and neutral entry order remain independent and both reorder paths are tested.
- [x] Enabling, disabling, and resetting party mode preserve all underlying loadouts according to
      the bound lifecycle rules.
- [x] Each entry is assigned to at most one slot; duplicate, stale, or missing references are
      deterministic diagnostics or import blockers.
- [x] Unassigned loadouts remain visible/recoverable and are preserved through every durable path.
- [x] Selecting occupied and empty slots preserves dirty active editor state and repairs selected
      entry, selected slot, comparison target, and focus deterministically.
- [x] Template import targets only an occupied selected member and preserves entry/slot identity,
      labels, roles, kinds, notes, and order.
- [x] Saved-record duplication and restore remap set, entry, nested build, slot, reference,
      selection, and comparison IDs atomically.
- [x] Domain `BuildSet` remains schema 1; persisted build-set snapshot v2 migrates v1 neutral data
      in memory without dirtying or writing on read.
- [x] Unsupported future party versions are not silently erased by an older load-and-save path.
- [x] Local storage, working drafts, saved records, autosave, pagehide, conflicts, quota/unavailable
      storage, write-blocked recovery, backup, restore, and transfer preserve or explicitly reject
      party metadata.
- [x] Party UI shows occupied, empty, selected, disabled, dormant, and unassigned states with stable
      keyboard/pointer behavior and no responsive overlap.
- [x] Comparison remains deterministic and non-destructive in party mode, including empty selected
      slots, clear, delete, reorder, import, restore, and stale comparison targets.
- [x] Party validation is structural, deterministic, path-addressed, bounded, non-blocking for
      editing, and separate from the game rule engine.
- [x] Per-loadout validation details remain accessible and retain existing issue codes.
- [x] No synergy, quality, optimal role, PvP format, hero AI, unlock, recommendation, or meta rule is
      added.
- [x] Native `build-wars-party-transfer` JSON is inert, deterministic, byte-bounded,
      dangerous-key-safe, previewed, single-apply, dirty-guarded, and full-fidelity for parties.
- [x] General build-set transfer and whole-library backup/restore preserve enabled and dormant party
      annotations.
- [x] Multi-code projection includes every slot in party order with explicit code, empty,
      unavailable, and omission facts; it is byte-bounded and not an import format.
- [x] Selected-member share URLs remain the existing `#bw=1` skill-template shares and warn about
      omitted party/sibling/local-only state.
- [x] Runtime generated catalog imports remain isolated to `src/app/catalogs.ts`.
- [x] No new runtime dependency, backend service, account, auth, analytics, service worker, remote
      media fetch, source-data pipeline, route, or environment variable is added.
- [x] README and compendium docs match shipped behavior and deferred scope.
- [x] `npm run test:run -- src/app test/domain test/template-compatibility` passes.
- [x] `npm run verify` passes.
- [x] `git diff --check` passes.
- [x] BW-1702 through BW-1706, EPIC-17, SPRINT-018, ledger, execution manifest, and docs agree before
      closeout.

## Risks & Mitigations

| Risk                                                                             | Likelihood | Impact   | Mitigation                                                                                                 |
| -------------------------------------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| Party annotations become a second loadout graph.                                 | Medium     | Critical | Store only slot references and test that no party type embeds builds.                                      |
| Empty-slot selection overwrites a real entry with placeholder editor state.      | Medium     | Critical | Support zero active entries explicitly and remove unsafe materialization fallback.                         |
| Nested schema v2 causes silent older-client party data loss.                     | Medium     | Critical | Fail closed or write-block unsupported future versions; test no silent erase.                              |
| Party reorder mutates neutral organization unexpectedly.                         | Medium     | High     | Keep party slot order independent from entry order and label the two orders distinctly.                    |
| Clear, shrink, or reset drops loadouts or metadata.                              | Medium     | Critical | Make clear detach-only, block lossy shrink, require confirmed reset, and keep unassigned loadouts visible. |
| Selected slot, selected entry, share target, and comparison target diverge.      | Medium     | Critical | Use one selected-loadout resolver and one selection-repair helper.                                         |
| ID remapping leaves copied/restored slots pointing at source entries.            | Medium     | High     | Build explicit old-to-new maps and assert graph independence after mutation.                               |
| Party validation becomes recommendation or legality advice.                      | Medium     | High     | Limit validation inputs and issue codes to structural facts and per-loadout aggregation.                   |
| Native party and build-set transfers drift.                                      | Medium     | High     | Share canonical nested snapshot parser, serializer, limits, and diagnostics.                               |
| Multi-code copy hides omitted members or local-only state.                       | High       | High     | Include every slot, explicit unavailable/omitted facts, counts, and native JSON as the lossless path.      |
| Dense party UI is inaccessible or overlaps at max size.                          | Medium     | High     | Use compact cards, dialogs/disclosures for secondary actions, stable dimensions, and responsive tests.     |
| Scope expands into hero catalogs, portraits, external codecs, or hosted sharing. | Medium     | High     | Keep BW-1701 parked and gate closeout on explicit deferral docs.                                           |

## Security Considerations

- Treat local storage, backups, transfers, party JSON, clipboard text, labels, roles, notes, IDs, raw
  template overlays, equipment, title overrides, diagnostics, and validation facts as untrusted.
- Reject dangerous keys recursively before migration, preview, import, restore, clone, fingerprint,
  or serialization.
- Reconstruct accepted party and build-set objects field by field; do not spread unknown objects
  into state, React props, or exports.
- Bound UTF-8 bytes, slot count, entry count, nested arrays, strings, diagnostics, validation issues,
  rendered rows, and clipboard output.
- Require supported versions, dense arrays, finite safe integers, unique IDs, valid references, and
  one assignment per entry.
- Normalize CR/LF and control characters in multi-code text so labels and roles cannot forge
  structural lines.
- Render user-authored and diagnostic text as escaped React text. Do not add HTML/Markdown
  execution, `dangerouslySetInnerHTML`, dynamic imports, `eval`, or URL dereferencing from party
  data.
- Native transfers and backups are inert JSON. Sanitize filenames, revoke object URLs, never upload
  data, and never include local filesystem paths.
- Preserve explicit preview/apply, dirty guards, single-use apply, restore anti-wipe, revision
  conflict, and write-blocked recovery behavior.
- Add no network request, remote media, backend, secret, account identifier, telemetry,
  collaboration channel, service worker, or new dependency.

## Dependencies

- EPIC-08 / SPRINT-009: core one-loadout editor, validation panel, template UI, catalog boundary,
  accessibility, and responsive shell.
- EPIC-09 / SPRINT-010: local library, `build-wars:v1`, working drafts, saved records, dirty guards,
  backup/restore, share URLs, storage diagnostics, and write-blocking.
- EPIC-13 / SPRINT-014 and EPIC-14 / SPRINT-015: semantic equipment contracts, editor, summaries,
  validation, persistence, backup/restore, and omission warnings.
- EPIC-15 / SPRINT-016: durable title-rank overrides, title controls, validation, persistence, and
  title omission warnings.
- EPIC-16 / SPRINT-017: neutral build sets, 16-entry cap, one active editor plus inactive snapshots,
  schema-2 mixed documents, saved-record duplication, comparison, aggregate validation, backup,
  restore, transfer, and selected-loadout sharing.
- Existing promoted EPIC-03, EPIC-04, EPIC-10, EPIC-11, and EPIC-12 catalogs through
  `src/app/catalogs.ts` only.
- Existing `@buildwars/gw-templates@1.1.1` skill-template workflow for individual member codes.
- Existing React, TypeScript, Vite, Vitest, Testing Library, ESLint, Prettier, npm, Python, and
  ticket-burn tooling.

## Open Questions

No open question blocks execution. The sprint binds these answers:

1. Party metadata lives as an optional annotation on app-owned persisted/runtime build-set state, not
   as a top-level document kind.
2. Empty slots are represented by `entryId: null`, not nullable build-set entries.
3. Party mode disable preserves dormant annotations; Reset Party explicitly discards annotations.
4. Presets are 2, 4, 6, 8, and 12, with custom 1-16.
5. Member kinds are display-only user annotations and do not imply catalogs or account ownership.
6. Party validation is structural and aggregate only.
7. Explicit party exchange uses `build-wars-party-transfer`; general build-set transfer also
   preserves party annotations.
8. Multi-code text is a lossy convenience projection and not an import codec.
9. Party slot order remains independent from neutral build-set entry order.
