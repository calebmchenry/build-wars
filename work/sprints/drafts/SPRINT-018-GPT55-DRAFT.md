---
id: SPRINT-018
title: Party Semantics and Sharing
status: draft
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

This sprint adds party/team semantics on top of the completed SPRINT-017 neutral build-set
workspace. A party is not a new loadout payload and not a replacement for build sets. It is an
optional annotation layer that gives an existing build set party intent: ordered member slots,
empty slots, member labels, freeform roles, lightweight member kind labels, party-size presets,
party validation summaries, native party JSON, and practical multi-code skill-template copying.

The primary architecture boundary is that build-set entries remain complete loadouts. Empty party
slots must not become nullable build-set entries, and `BuildSetEntryKind = "build" | "variant" |
"freeform"` must keep its neutral meaning. Party slots should reference build-set entry IDs when a
member has a loadout and use `entryId: null` for empty slots. This keeps the one-active-editor plus
inactive `PersistedBuildSnapshot` invariant from SPRINT-017 intact while allowing party layout and
metadata to exist independently.

This is a local-first product increment. It must preserve single-build and neutral build-set
workflows, local-library saved records, working-draft autosave, backup/restore, build-set transfer,
selected-loadout template import/export, and selected-loadout share URLs. Users who do not enable
party mode should not see build sets become party-only objects.

Explicitly out of scope: BW-1701 paw-ned2/team-template compatibility, external codecs, hero or
henchman catalogs, portrait media, unlock tracking, hero AI behavior, team composition advice,
synergy scoring, speed-clear/meta checks, guide publishing, hosted sharing, accounts, backend sync,
collaboration, remote media, generated-data pipeline changes, and new runtime dependencies.

Binding defaults for execution:

- Store party metadata as `party: PartyAnnotation | null` on persisted build-set snapshots.
- Keep local-library schema version 2 under `build-wars:v1`; add a party annotation schema version
  rather than bumping the outer storage key.
- Replace or isolate the placeholder `src/domain/party.ts` behind the new annotation contracts; do
  not let its nullable `PartyBuild` shape drive implementation.
- Use party slot order as the party order. Build-set entry order remains neutral loadout order.
- Use common presets of 4, 6, and 8 members, plus a bounded custom size from 1 through the existing
  16-entry cap.
- Treat member kind as presentation metadata only: `player`, `hero`, `mercenary`, `guest`, or
  `freeform`.
- Make structural party validation deterministic and narrow. It explains incompleteness, empty
  required slots, preset mismatch, invalid slot references, duplicate slot IDs, mode mismatch, and
  aggregate per-loadout issues without blocking member editing or judging build quality.
- Keep share URLs selected-loadout-only. Full party recovery uses native inert Build Wars JSON;
  multi-code copy is a practical clipboard/export view, not a round-trip external team codec.

## Use Cases

1. **Opt into party mode**: A user with an existing build set can mark it as a party and receive
   member slots initialized from the current entries without rebuilding or reimporting loadouts.
2. **Stay neutral**: A user who never enables party mode can keep using build sets as variants,
   comparison groups, farming sets, or freeform collections with no party validation or party UI
   requirements.
3. **Represent empty slots**: A user can create a party preset with empty member slots, label those
   slots, assign roles, and fill them later without creating fake loadouts.
4. **Label members independently**: A user can give a party slot a member label, role, kind label,
   and notes without changing the underlying loadout label or requiring a catalog-backed hero
   identity.
5. **Select and edit one member**: A user can select a linked party member and continue editing the
   same profession, attributes, skill bar, title ranks, equipment, template, and validation surfaces
   from SPRINT-017.
6. **Inspect the full party**: The party workspace shows slots, member labels, roles, kind labels,
   profession pairs, mode, eight skill slots, equipment summaries, title indicators, empty slots,
   validation state, and unresolved state while one member editor remains active.
7. **Manage structure safely**: A user can add empty slots, add linked member loadouts, duplicate a
   member, remove a party slot, reorder slots, change presets, and repair missing slot links without
   silently deleting underlying loadouts.
8. **Preserve unsaved state**: Switching between members or between a member and an empty slot first
   materializes the active editor snapshot, so unsaved loadout edits survive navigation, autosave,
   save, backup, export, and reload.
9. **Validate party structure**: A user can see party-level issues for empty required slots,
   incomplete linked members, preset-size mismatch, invalid links, duplicate slots, unresolved
   entries, mixed modes, and per-loadout errors or warnings.
10. **Keep editing through issues**: Party-level warnings and errors remain explanatory. They do not
    prevent selecting a member, editing a loadout, saving locally, or exporting native JSON.
11. **Share with native JSON**: A user can export and import a full party as bounded inert Build
    Wars JSON that preserves party annotations, loadouts, raw template facts, semantic equipment,
    title overrides, unresolved state, labels, roles, notes, and order.
12. **Copy practical template codes**: A user can copy one skill-template code per linked member
    when representable, with clear placeholder lines and warnings for empty, unresolved, or
    unrepresentable members.
13. **Use selected-loadout sharing honestly**: Existing share URLs and skill-template export still
    target only the selected member and warn that sibling members, party metadata, equipment, and
    title overrides are omitted.
14. **Recover locally**: Saved records, working drafts, duplicate records, whole-library backup,
    restore, build-set transfer, and native party import/export preserve party metadata and never
    downgrade a party into a neutral build set without explicit diagnostics.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Domain | Framework-neutral party annotation contracts, slot IDs, presets, member labels, freeform roles, member kind labels, structural helpers, and deterministic issue codes. | Catalog-backed hero identity, henchmen, portraits, unlocks, AI behavior, recommendation logic, guide records, browser APIs, generated JSON imports. |
| Build-set model | Optional party annotation on `PersistedBuildSetSnapshot`; slots reference existing build-set entry IDs or remain empty. | Changing `BuildSetEntryKind`, allowing null build-set entry payloads, making build sets inherently party-only, or duplicating `Build` fields in party state. |
| Workspace state | Party mode actions, slot selection, member linking, member duplication, slot reorder, preset changes, and materialization before member/empty-slot switches. | Multiple full editors, new routes, cross-tab collaboration, backend sync, undo history, persisted transient UI panels. |
| Persistence | Schema-2 local-library parsing, saved records, working drafts, backup/restore, record duplication, fingerprints, migration defaults, and dangerous-key-safe party annotations. | New storage keys, IndexedDB, remote storage, account records, write-on-read migration, unbounded JSON import. |
| UI | Party workspace over the existing editor, member grid/list, slot controls, empty states, compact summaries, responsive behavior, keyboard/pointer support, and readable validation links. | Portrait fetching, full Guild Wars party-window clone, marketing page, simultaneous full editors, new UI dependency. |
| Validation | Existing per-loadout `validateBuild` aggregation plus party structural checks for slots, presets, empty required slots, unresolved links, member incompleteness, and mode mismatch. | Synergy scoring, build quality advice, optimal role checks, PvX/meta legality, hero AI recommendations, PvP format enforcement. |
| Sharing | Native Build Wars party JSON, multi-code skill-template text, selected-member share URLs, existing build-set transfer preservation, local backup/restore. | paw-ned2/team-template codec, hosted links, short links, equipment/title URL payloads, public publishing, guide export. |
| Data | Existing app catalog views through `src/app/catalogs.ts` for presentation summaries and per-loadout validation. | New source-data profile, runtime imports of manifests/QA/source snapshots, wiki network calls, remote icon/media loading. |

### Binding Decisions

1. `src/domain/party.ts` should become the framework-neutral home for party annotation contracts and
   structural helpers. The current placeholder `PartyBuild` shape can be removed, renamed, or left
   only as a non-runtime legacy type if TypeScript references require it, but implementation should
   not build a second nullable-loadout party document around it.
2. Party mode is represented by `PersistedBuildSetSnapshot.party !== null`. Neutral build sets have
   `party: null` or a missing party field during migration.
3. Party slots are separate ordered records. A populated slot references a `BuildSetEntryId`; an
   empty slot uses `entryId: null`.
4. Build-set entries remain the only durable loadout containers. Every linked member loadout is
   still a normal entry with a `PersistedBuildSnapshot`.
5. Party member metadata lives on slots: member label, role, kind label, notes, and required/empty
   status. Entry labels and notes remain neutral build-set metadata and should be displayed only
   where useful.
6. Reordering party members reorders party slots. It should not mutate neutral build-set entry order
   unless execution deliberately adds an explicit "sync entry order to party order" command.
7. Unassigned build-set entries are allowed. They are preserved in saved records, backup, restore,
   transfer, and native party JSON, but they are not counted as party members unless referenced by a
   party slot.
8. Applying a preset changes the party's declared size and required slot count. It must not delete
   linked loadouts or unassigned entries.
9. Turning party mode off removes or hides the annotation only after explicit confirmation and never
   deletes build-set entries.
10. Member kind labels have no mechanics. `hero` does not require a hero catalog, `mercenary` does
    not imply account unlocks, and `guest`/`freeform` do not change validation.
11. Empty selected party slots have no selected loadout. Existing selected-loadout controls must be
    disabled or route the user to create/link a loadout first.
12. Template import in party mode replaces only the selected linked entry's snapshot and preserves
    party slot ID, label, role, kind, notes, and slot order.
13. Native party export should use a distinct `build-wars-party-transfer` envelope for clarity, but
    existing build-set transfer and whole-library backup must also preserve `party` metadata when it
    exists.
14. No new npm, Python, backend, worker, route, environment variable, source-data profile, or
    generated catalog dependency is planned.

### Contract Shapes

Exact TypeScript names may follow local style, but the durable shape should be this explicit:

```text
PARTY_ANNOTATION_SCHEMA_VERSION = 1
MAX_PARTY_SLOTS = 16
MAX_PARTY_MEMBER_LABEL_LENGTH = 120
MAX_PARTY_ROLE_LENGTH = 80
MAX_PARTY_MEMBER_NOTES_LENGTH = 1000

PartyMemberKind = "player" | "hero" | "mercenary" | "guest" | "freeform"

PartySizePreset
  { kind: "preset", size: 4 | 6 | 8 }
  | { kind: "custom", size: number }

PartySlot
  id: PartySlotId
  entryId: BuildSetEntryId | null
  label: string
  role: string | null
  memberKind: PartyMemberKind
  notes: string | null
  required: boolean

PartyAnnotation
  schemaVersion: 1
  preset: PartySizePreset
  slots: readonly PartySlot[]
```

`PersistedBuildSetSnapshot` should be extended conservatively:

```text
PersistedBuildSetSnapshot
  schemaVersion: 1
  id: AuthoredDocumentId
  name: string
  entries: readonly PersistedBuildSetEntrySnapshot[]
  lastSelectedEntryId: BuildSetEntryId | null
  party: PartyAnnotation | null
```

The parser must accept missing `party` as `null` for all existing schema-2 data. It must reconstruct
party annotations from `unknown` input field by field, reject dangerous keys recursively, bound
strings and arrays, require dense arrays, repair stale linked entries with diagnostics rather than
dropping loadouts, and never spread unknown objects into runtime state.

### State Flow

```text
Workspace document
  -> single build
       -> existing EditorState

  -> build set without party
       -> RuntimeBuildSetDocument
       -> selected entry: EditorState
       -> inactive entries: PersistedBuildSnapshot

  -> build set with party annotation
       -> RuntimeBuildSetDocument + PartyRuntimeState
       -> selected linked slot: selected entry EditorState
       -> selected empty slot: no selected loadout actions
       -> inactive entries: PersistedBuildSnapshot
       -> materializeActiveBuildSetSnapshot()
       -> persistence, validation, summaries, backup, transfer, native party export
```

Runtime party state should keep only interaction state that is not durable authored content, such as
the currently focused slot, transient dialog input, and copy status. Durable party slot data belongs
inside the materialized build-set snapshot.

Every path that can leave a selected member must snapshot the active editor first:

- selecting another linked party slot
- selecting an empty slot
- adding a linked member
- duplicating a member
- removing or unlinking the selected member's slot
- changing preset in a way that changes selected-slot membership
- save, autosave, pagehide flush, backup, build-set transfer, native party export, validation, and
  library summary projection

### Validation Model

Party validation should be a separate deterministic app/domain layer that accepts:

- the materialized build-set snapshot
- the optional party annotation
- per-entry validation summaries from existing `validateBuild`
- entry modes and completeness/resolution flags derived through existing app selectors

Preferred issue-code set:

```text
party.disabled
party.no-slots
party.preset-size-mismatch
party.empty-required-slot
party.duplicate-slot-id
party.duplicate-linked-entry
party.missing-linked-entry
party.unassigned-entry
party.incomplete-member
party.unresolved-member
party.member-error
party.member-warning
party.mode-mismatch
party.slot-limit-exceeded
```

Severity should be conservative:

- Errors: malformed party structure that cannot be trusted, duplicate slot IDs, duplicate linked
  entry references, slot-limit overflow, or links to missing entries after parser repair fails.
- Warnings: empty required slots, preset mismatch, incomplete members, unresolved members,
  per-loadout warnings/errors surfaced at party level, mode mismatch, and unassigned entries.
- Info: party disabled or optional empty slots, if displayed at all.

`validateBuild` and `RULE_ENGINE_VERSION` should not change for party validation unless execution
finds that existing validation contracts must represent party-specific issue locations. The default
path is to keep party issue contracts separate and let the party UI link to per-loadout details.

### Sharing Model

Native party JSON should be inert, deterministic, byte-bounded, previewed before apply, and parsed
through the same dangerous-key and schema validation rules as local-library/build-set transfer:

```text
kind: build-wars-party-transfer
schemaVersion: 1
exportedAt: ISO timestamp
partyBuildSet: PersistedBuildSetSnapshot with party annotation
metadata:
  declaredEntryCount: number
  declaredSlotCount: number
```

Import should hydrate an unassociated build-set draft through the existing dirty guard. If the JSON
contains a valid neutral build-set snapshot but no party annotation, party import should either
offer to enable party mode from entries or report that the file is a build-set transfer, not a
party transfer.

Multi-code copy should be deterministic text, not a round-trip codec. It should iterate party slots
in party order and include one line per slot:

```text
1. <member label> [<kind>] <role>: <skill template text>
```

Empty slots, unlinked slots, selected members with unresolved template facts, unrepresentable skill
bars, unsupported equipment/title-only facts, or clipboard denial must produce visible warnings and
selectable text. Native party JSON is the only MVP format that promises full-fidelity party
recovery.

## Implementation

### Phase 0: Baseline, Decisions, and Guards (~5%)

Files:

- `work/sprints/SPRINT-018.md`
- `work/tickets/17-party-and-hero-builder/*.md`
- `src/domain/party.ts`
- `src/domain/build-set.ts`
- `src/app/build-set-state.ts`
- `src/app/workspace-state.ts`
- `src/app/persistence-schema.ts`
- `src/app/build-set-transfer.ts`
- `src/app/components/BuildSetNavigator.tsx`
- Existing SPRINT-017 regression tests

Tasks:

- [ ] Confirm `SPRINT-017`, EPIC-16, and BW-1601 through BW-1606 are complete and that
      `BuildSet`, `PersistedBuildSetSnapshot`, `materializeActiveBuildSetSnapshot`, schema-2
      local-library records, and build-set transfer are the implementation baseline.
- [ ] Record that BW-1701 remains backlog/parking-lot scope and is not pulled into SPRINT-018.
- [ ] Freeze the party annotation shape, preset list, slot/reference policy, turn-off behavior,
      native party export envelope, and party validation severity policy before UI work starts.
- [ ] Add focused baseline tests around neutral build-set save/load/backup/transfer, selected-entry
      template import, selected-loadout share warnings, remove-last-entry behavior, and malformed
      build-set parse behavior.
- [ ] Confirm no runtime generated catalog imports are needed outside `src/app/catalogs.ts`.

Verification:

- `npm run test:run -- src/app/build-set-state.test.ts src/app/workspace-state.test.ts src/app/persistence-schema.test.ts src/app/build-set-transfer.test.ts src/app/build-set-navigator.test.tsx`
- `npm run typecheck`

### Phase 1: BW-1702 Party Contracts, Presets, and Persistence Shape (~18%)

Files:

- `src/domain/party.ts`
- `src/domain/build-set.ts`
- `src/domain/index.ts`
- `test/domain/party.test.ts`
- `test/domain/build-set.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/library-fixtures.ts`

Tasks:

- [ ] Replace or isolate the placeholder party contract with `PartyAnnotation`, `PartySlot`,
      `PartySlotId`, `PartyMemberKind`, `PartySizePreset`, constants, normalization helpers, and
      structural diagnostics.
- [ ] Add helper coverage for enabling party mode from current build-set entries, disabling party
      mode without deleting entries, applying presets, appending empty slots, linking/unlinking
      slots, reordering slots, normalizing labels/roles/notes, and repairing missing links.
- [ ] Extend `PersistedBuildSetSnapshot` parsing, cloning, fingerprinting, selected snapshot
      helpers, and fixture builders to preserve `party: null | PartyAnnotation`.
- [ ] Accept missing party metadata as `null` for old schema-2 neutral build sets without dirtying
      or rewriting storage on read.
- [ ] Reject or diagnose malformed party data: unsupported annotation version, duplicate slot IDs,
      duplicate linked entry IDs, non-dense arrays, dangerous keys, unsafe sizes, invalid member
      kinds, over-limit slots, oversized labels/roles/notes, and missing linked entries.
- [ ] Ensure all build-set entry helpers remain party-neutral and do not gain nullable build
      payloads or party-specific entry kinds.

Verification:

- `npm run test:run -- test/domain/party.test.ts test/domain/build-set.test.ts src/app/persistence-schema.test.ts`
- `npm run typecheck`

### Phase 2: BW-1703 Party Workspace State and UI (~22%)

Files:

- `src/app/party-state.ts`
- `src/app/party-state.test.ts`
- `src/app/party-selectors.ts`
- `src/app/party-selectors.test.ts`
- `src/app/build-set-state.ts`
- `src/app/build-set-state.test.ts`
- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/components/PartyDialogs.tsx`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/App.tsx`
- `src/app/styles.css`
- `src/app/App.test.tsx`

Tasks:

- [ ] Add workspace actions for enable party mode, disable party mode, set preset, add empty slot,
      add linked member, link selected/copy/blank loadout to slot, unlink slot, select party slot,
      duplicate linked member, remove slot, reorder slot, set member label, set role, set member
      kind, and set party notes if needed.
- [ ] Keep selected loadout identity as the existing selected build-set entry ID. Selecting an
      empty party slot clears selected loadout actions after materializing the outgoing editor.
- [ ] Ensure all member navigation, empty-slot selection, member duplication, and slot removal paths
      snapshot the active editor before mutating selection or links.
- [ ] Build party selectors that project member cards from materialized snapshots using existing
      catalog views, skill display selectors, equipment summaries, title indicators, and
      per-loadout validation status.
- [ ] Render a party workspace when `party !== null`: party name/set name, preset control, slot
      count, member cards, empty slots, role/kind controls, member labels, skill strips,
      profession/mode summaries, equipment/title indicators, validation indicators, and action
      menus.
- [ ] Keep neutral build-set controls available where needed for unassigned entries, transfer, and
      fallback management without making the page read as two competing workspaces.
- [ ] Preserve keyboard selection, focus restoration, live-region messages, dirty guards,
      confirmation prompts, long-label wrapping, narrow-width behavior, and no horizontal page
      scroll.
- [ ] Add tests for converting neutral sets to parties, existing set with no party annotation,
      empty slots, selected empty slot, add/remove/reorder, duplicate member, slot label/role/kind
      editing, unassigned entries, long strings, one-member, 4/6/8 preset, custom size, cap
      handling, and switching between party and neutral views.

Verification:

- `npm run test:run -- src/app/party-state.test.ts src/app/party-selectors.test.ts src/app/build-set-state.test.ts src/app/workspace-state.test.ts src/app/App.test.tsx`
- `npm run test:run -- src/app/build-set-navigator.test.tsx`
- `npm run typecheck`

### Phase 3: BW-1704 Party Validation (~16%)

Files:

- `src/domain/party.ts`
- `test/domain/party.test.ts`
- `src/app/party-validation.ts`
- `src/app/party-validation.test.ts`
- `src/app/party-selectors.ts`
- `src/app/party-selectors.test.ts`
- `src/app/components/PartyValidationSummary.tsx`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/components/ValidationPanel.tsx`
- `src/app/App.test.tsx`

Tasks:

- [ ] Implement deterministic party validation over a materialized build-set snapshot plus party
      annotation and per-entry validation summaries.
- [ ] Emit stable party issue codes for empty required slots, preset mismatch, malformed/duplicate
      slots, missing linked entries, duplicate linked entries, incomplete linked members, unresolved
      linked members, per-loadout error/warning summaries, unassigned entries, and mode mismatch.
- [ ] Keep party validation separate from build validation unless a narrow issue-location contract
      change is explicitly needed. Avoid unnecessary `RULE_ENGINE_VERSION` changes.
- [ ] Display aggregate party status with links/actions that select the affected slot or member and
      keep detailed per-loadout issues in the existing validation panel.
- [ ] Treat mixed PvE/PvP/unknown modes as an explainable party warning, not a hard legality model.
- [ ] Ensure party validation never recommends builds, judges role quality, scores synergy, checks
      hero unlocks, infers AI behavior, or consults community/meta data.
- [ ] Test deterministic issue ordering, severity, counts, selected-slot navigation, empty optional
      vs required slots, no slots, one-member parties, preset over/under counts, malformed imports,
      catalog-unavailable states, stale facts, unresolved raw template facts, equipment/title
      validation aggregation, and editing through party warnings/errors.

Verification:

- `npm run test:run -- test/domain/party.test.ts src/app/party-validation.test.ts src/app/party-selectors.test.ts src/app/App.test.tsx`
- `npm run test:run -- src/app src/domain`
- `npm run typecheck`

### Phase 4: BW-1705 Native Party Export, Multi-Code Copy, and Durability (~21%)

Files:

- `src/app/party-transfer.ts`
- `src/app/party-transfer.test.ts`
- `src/app/components/PartyTransferDialog.tsx`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/components/ShareControls.tsx`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/build-set-transfer.ts`
- `src/app/build-set-transfer.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.ts`
- `src/app/local-storage.test.ts`
- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/library-fixtures.ts`
- `src/app/components/LibraryDialogs.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/App.test.tsx`

Tasks:

- [ ] Add `build-wars-party-transfer` envelope creation, stable serialization, filename
      sanitization, byte caps, parse diagnostics, preview, apply-once behavior, and dirty-guarded
      import into an unassociated party build-set draft.
- [ ] Ensure existing build-set transfer serializes and parses party annotations when present, but
      UI copy distinguishes neutral build-set transfer from party transfer.
- [ ] Add multi-code party copy projection using existing skill-template export policy per linked
      member. Include empty/unavailable placeholder lines and aggregate warnings for omitted
      equipment/title state, unresolved data, unrepresentable skill bars, oversized output, and
      clipboard denial.
- [ ] Preserve selected-loadout share URL behavior exactly. In party mode, share URL export targets
      the selected linked member only and warns that sibling members and party metadata require
      party JSON or backup.
- [ ] Ensure selected-loadout template import replaces only the selected linked member's loadout
      snapshot and preserves slot label, role, member kind, notes, slot ID, and order.
- [ ] Preserve party annotations through working-draft autosave, pagehide flush, Save New, Update,
      Save As New, load, duplicate record, delete associated record, library search/filter/sort,
      backup, restore merge/replace, restore draft opt-in, local storage write blocking, and stale
      revision conflicts.
- [ ] Add fixture coverage for neutral build sets, party build sets, old schema-2 data without
      party metadata, malformed party metadata, max-size parties, empty slots, unassigned entries,
      restored ID remapping, duplicate party records, and all-invalid anti-wipe restore behavior.

Verification:

- `npm run test:run -- src/app/party-transfer.test.ts src/app/template-workflow.test.ts src/app/build-set-transfer.test.ts src/app/persistence-schema.test.ts src/app/local-storage.test.ts src/app/backup-restore.test.ts src/app/library-selectors.test.ts src/app/App.test.tsx`
- `npm run typecheck`

### Phase 5: BW-1706 Docs, Regression, and Closeout (~18%)

Files:

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
- `work/sprints/SPRINT-018.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-17-result.json`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/execute-SPRINT-018-result.json`

Tasks:

- [ ] Update product docs to explain party annotations over build sets, empty slots, presets,
      labels, roles, member kind labels, local persistence, validation, native party JSON, multi-code
      copy, selected-loadout share limits, and no external team codec claim.
- [ ] Record deferred scope clearly: BW-1701, paw-ned2/team templates, hero/henchman catalogs,
      portraits, AI advice, unlock tracking, guide authoring, backend sync, collaboration, and
      recommendations.
- [ ] Run focused regressions for single-build editor, neutral build sets, local library,
      backup/restore, build-set transfer, template dialogs, share URLs, equipment editor, title
      controls, and validation panel.
- [ ] Run layout/accessibility smoke tests or component tests for long labels, 16-slot parties,
      empty parties, narrow widths, keyboard order, focus restoration, dialogs, and no text overlap.
- [ ] Run `npm run verify` and `git diff --check`.
- [ ] During execution, update BW-1702 through BW-1706, EPIC-17, SPRINT-018, ledger, and result
      manifests together only after all Definition of Done items pass. Leave BW-1701 backlog unless
      a future sprint explicitly prioritizes it.

Verification:

- `npm run test:run -- src/app src/domain test/domain`
- `npm run verify`
- `git diff --check`
- `rg -n 'EPIC-17|BW-170[2-6]|SPRINT-018|paw-ned2|party transfer|party annotation' README.md compendium work/tickets/17-party-and-hero-builder work/sprints`

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/party.ts` | Replace/modify | Party annotation contracts, slot helpers, presets, member kind labels, normalization, structural diagnostics, and deferred old `PartyBuild` handling. |
| `src/domain/build-set.ts` | Modify | Keep build-set contracts neutral while allowing safe helper integration with party annotations where needed. |
| `src/domain/index.ts` | Modify | Export party annotation contracts and helpers. |
| `test/domain/party.test.ts` | Create | Cover annotation invariants, presets, empty slots, malformed input, normalization, repair, and validation issue codes. |
| `test/domain/build-set.test.ts` | Modify | Regress that build-set entries remain complete, neutral, ordered loadout containers. |
| `src/app/party-state.ts` | Create | Runtime party actions and reducers that coordinate slots with existing build-set selection/materialization. |
| `src/app/party-selectors.ts` | Create | Party member summaries, slot projections, aggregate status, multi-code projections, and view models. |
| `src/app/party-validation.ts` | Create | App/domain bridge for deterministic party structural validation over materialized build-set snapshots. |
| `src/app/party-transfer.ts` | Create | Native `build-wars-party-transfer` export/import envelope, bounds, parsing, preview, and apply helpers. |
| `src/app/*party*.test.ts` | Create | Focused tests for state, selectors, validation, transfer, import/export, and UI flows. |
| `src/app/build-set-state.ts` | Modify | Preserve party annotations while adding member/empty-slot selection paths that materialize active editor state first. |
| `src/app/build-set-selectors.ts` | Modify | Share summary projections with party selectors without adding party semantics to neutral build-set views. |
| `src/app/build-set-transfer.ts` | Modify | Preserve optional party metadata in native build-set transfer while keeping neutral transfer semantics clear. |
| `src/app/workspace-state.ts` | Modify | Add party-related workspace actions, dirty/fingerprint handling, selected empty-slot behavior, and durable materialization. |
| `src/app/persistence-schema.ts` | Modify | Parse, clone, serialize, fingerprint, migrate, and diagnose optional party annotations in schema-2 build-set documents. |
| `src/app/local-storage.ts` | Modify/test | Preserve party metadata under existing local-library write/read failure behavior. |
| `src/app/backup-restore.ts` | Modify | Preserve party metadata in whole-library backup/restore, merge/replace previews, ID remapping, and anti-wipe safeguards. |
| `src/app/library-fixtures.ts` | Modify | Add party, neutral, malformed, max-size, legacy, backup, and restore fixtures. |
| `src/app/library-selectors.ts` | Modify | Include party labels/roles/kinds in search/summaries while preserving neutral build-set rows. |
| `src/app/components/PartyWorkspace.tsx` | Create | Party member layout, slot cards, preset controls, summaries, validation links, and member actions. |
| `src/app/components/PartyDialogs.tsx` | Create | Focused dialogs for enabling/disabling party mode, preset changes, linking, unlinking, removing, and metadata edits as needed. |
| `src/app/components/PartyValidationSummary.tsx` | Create | Render party-level issue summaries and links to affected slots/members. |
| `src/app/components/PartyTransferDialog.tsx` | Create | Native party JSON export/import UI plus preview/apply behavior. |
| `src/app/components/BuildSetNavigator.tsx` | Modify | Add party-mode entry points and avoid duplicating party semantics in the neutral navigator. |
| `src/app/components/ShareControls.tsx` | Modify | Keep selected-loadout share URLs and skill-template export honest in party mode; add party JSON/multi-code cues. |
| `src/app/components/TemplateDialogs.tsx` | Modify/test | Preserve selected-member metadata during template import in party mode. |
| `src/app/components/LibraryPanel.tsx` | Modify | Display party records distinctly and expose party-aware actions without breaking neutral records. |
| `src/app/components/LibraryDialogs.tsx` | Modify | Show party metadata in backup/restore previews and diagnostics. |
| `src/app/App.tsx` | Modify | Compose party workspace, transfer dialog, validation summary, selected-loadout controls, and empty-slot states. |
| `src/app/styles.css` | Modify | Add responsive party layout, stable card dimensions, wrapping, focus styles, empty-slot styling, and no-overlap behavior. |
| Existing `src/app/*test*` and `test/domain/*test*` | Modify | Preserve single-build, neutral build-set, persistence, sharing, equipment, title, and validation regressions. |
| `README.md` and `compendium/*.md` | Modify | Document party semantics, storage/sharing behavior, validation limits, and deferred scope. |
| `work/tickets/17-party-and-hero-builder/BW-1702` through `BW-1706` | Modify during execution | Track implementation evidence and acceptance criteria completion. |
| `work/tickets/17-party-and-hero-builder/EPIC.md` | Modify during execution | Track EPIC-17 closeout and BW-1701 parking-lot boundary. |
| `work/sprints/SPRINT-018.md`, `work/sprints/ledger.tsv`, run manifests | Create/modify during execution | Maintain sprint source of truth, ledger status, and ticket-burn result state. |

## Definition of Done

- [ ] BW-1702 through BW-1706 are implemented in dependency order and traceable to EPIC-17.
- [ ] BW-1701 remains outside MVP scope and no paw-ned2/team-template codec is introduced.
- [ ] Single-build editor, local library, template import/export, share URLs, equipment editor,
      title controls, validation, backup, restore, and neutral build-set workflows remain
      compatible.
- [ ] `src/domain/party.ts` owns framework-neutral party annotation contracts and does not import
      React, DOM/browser APIs, app modules, generated JSON, data scripts, template adapters,
      network clients, or storage.
- [ ] Party mode is optional on build-set snapshots and missing party metadata hydrates as neutral
      build-set state without dirtying or writing storage on read.
- [ ] Build-set entries remain complete loadout containers; empty party slots are represented by
      party slots with `entryId: null`, not by null entry payloads.
- [ ] Party annotations include bounded ordered slots, preset/custom size, member labels, roles,
      member kind labels, notes, required/empty state, and stable slot IDs.
- [ ] Common presets of 4, 6, and 8 plus bounded custom sizes work without exceeding the existing
      16-entry build-set cap.
- [ ] Enabling party mode from a neutral build set initializes slots from existing entries without
      changing underlying loadout data.
- [ ] Disabling party mode never deletes build-set entries and requires clear user confirmation if
      party-only metadata will be removed.
- [ ] Party slot reorder changes party order without accidentally rewriting neutral entry order.
- [ ] Unassigned build-set entries are preserved, visible or discoverable, and not silently
      included in party validation.
- [ ] Member selection, empty-slot selection, add, duplicate, unlink, remove, reorder, preset
      change, save, autosave, backup, transfer, export, import, and validation all materialize the
      active editor before reading or changing durable party/build-set state.
- [ ] Selecting an empty slot disables or blocks selected-loadout editor/template/share controls
      until a loadout is linked or created.
- [ ] Template import in party mode replaces only the selected linked loadout and preserves slot
      label, role, kind, notes, slot ID, and order.
- [ ] Party workspace displays slot labels, roles, member kind labels, profession pairs, mode,
      eight skill states, equipment summaries, title indicators, validation state, empty slots,
      unresolved state, unassigned entries where relevant, action states, and responsive layouts.
- [ ] Keyboard and pointer flows support selecting members, adding/linking/unlinking slots,
      reordering, editing metadata, copying/exporting, importing, dismissing dialogs, and restoring
      focus.
- [ ] Long labels, roles, notes indicators, badges, action controls, validation copy, skill strips,
      dialogs, and 16-slot parties do not overlap or cause page-level horizontal scroll at supported
      widths.
- [ ] Party validation emits deterministic structural issue codes, counts, severities, paths, and
      member/slot links.
- [ ] Party validation aggregates existing per-loadout validation and keeps detailed build issues
      accessible through the existing selected-member validation panel.
- [ ] Party validation does not score synergy, recommend compositions, judge quality, infer hero AI,
      check unlocks, enforce PvX/meta rules, or require a hero/henchman catalog.
- [ ] Native party JSON export/import is inert, stable, bounded, previewed, dangerous-key safe,
      one-apply, dirty-guarded, and full-fidelity for party annotations and all nested Build Wars
      loadout data.
- [ ] Existing build-set transfer and whole-library backup/restore preserve party annotations when
      present and distinguish party files from neutral build-set files in UI copy/diagnostics.
- [ ] Multi-code copy emits deterministic party-order text, copies representable member skill
      template codes, reports skipped/empty/unrepresentable members, and never claims full-fidelity
      round-trip recovery.
- [ ] Selected-loadout share URLs remain `#bw=1` skill-template shares capped at 1,800 characters
      and omit sibling members, party metadata, equipment, title overrides, notes, and local record
      metadata with clear warnings.
- [ ] Local-library saved records, working drafts, duplicate records, backup/restore, restored ID
      remapping, storage errors, stale revisions, write-blocked recovery, and pagehide flushes
      preserve or explicitly reject party metadata without silent downgrade.
- [ ] Runtime generated catalog imports remain isolated to `src/app/catalogs.ts`; party UI consumes
      app catalog views only.
- [ ] No new runtime dependency, backend service, account concept, auth, analytics, service worker,
      remote media fetch, source-data pipeline, route, or environment variable is added.
- [ ] Documentation covers party annotations, presets, empty slots, local persistence, validation,
      native party JSON, multi-code copy, selected-loadout share limits, and deferred BW-1701 scope.
- [ ] `npm run test:run -- src/app src/domain test/domain` passes.
- [ ] `npm run verify` passes.
- [ ] `git diff --check` passes.
- [ ] BW-1702 through BW-1706, EPIC-17, SPRINT-018, `work/sprints/ledger.tsv`, and ticket-burn
      manifests agree on status, evidence, assumptions, and deferred scope before final closeout.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Party slots are modeled as nullable build-set entries and weaken SPRINT-017 loadout invariants. | Medium | Critical | Keep party slots separate, reference entries by ID, and test that build-set entries always hold complete snapshots. |
| Active member edits are lost when selecting another member or empty slot. | Medium | Critical | Centralize materialization before every party navigation/action and add edit-switch-save-reload regression tests. |
| Party metadata is silently dropped by persistence, backup, restore, build-set transfer, or template import. | Medium | High | Extend parser/clone/fingerprint/transfer paths together and add round-trip tests for every durable workflow. |
| Party slot order and build-set entry order become confusing. | Medium | Medium | Treat party slot order as authoritative for party UI, preserve entry order, and show unassigned entries explicitly when needed. |
| Preset changes delete loadouts or hide over-limit data. | Medium | High | Preset changes resize required slots only; never delete linked entries without explicit destructive confirmation. |
| Validation expands into subjective team advice. | Medium | High | Limit issue codes to structural checks and per-loadout aggregation; defer synergy/meta/recommendations to later analysis work. |
| Member kind labels imply unavailable hero catalog or unlock semantics. | High | Medium | Label kind fields as user-authored presentation metadata and document no hero/henchman catalog in MVP. |
| Native party JSON is confused with paw-ned2/team-template support. | High | Medium | Use a Build Wars-specific envelope name, explicit UI copy, and docs that mark BW-1701 as deferred. |
| Multi-code copy appears full-fidelity even though equipment/title/party metadata is omitted. | Medium | High | Keep native JSON as the full-fidelity path and show per-member omission/unrepresentable warnings in copy output. |
| Parser changes accidentally write migrated data on read or clear write-blocked storage. | Low | Critical | Preserve schema-2 no-write-on-read behavior, dangerous-key guards, anti-wipe restore, and write-blocked tests. |
| Party UI becomes too dense or inaccessible at 8 to 16 slots. | Medium | High | Use compact cards, responsive grids, stable dimensions, menus for secondary actions, keyboard tests, and narrow-width layout checks. |
| Scope grows into guide publishing, external codecs, or catalog ingestion. | Medium | High | Keep tickets mapped to BW-1702 through BW-1706 and require separate future tickets for BW-1701 or guide/data work. |

## Security

- Treat local storage, backups, build-set transfers, party transfers, member labels, roles, notes,
  IDs, raw template overlays, equipment selections, title overrides, and clipboard text as
  untrusted input.
- Reject prototype-dangerous keys recursively before parsing, migration, preview, import, restore,
  materialization, fingerprinting, or stable serialization.
- Reconstruct accepted party annotations field by field. Do not spread unknown objects into domain,
  app state, React props, or exported JSON.
- Bound bytes, party slots, build-set entries, aggregate nested loadouts, strings, arrays,
  diagnostics, validation issues, clipboard output, and preview text.
- Require supported schema versions, supported discriminants, dense arrays, finite safe integers,
  unique slot IDs, unique entry IDs, and valid or diagnosed slot-to-entry references.
- Render all user-controlled labels, roles, notes, diagnostics, raw template facts, and filenames as
  escaped React text. Do not add `dangerouslySetInnerHTML`, markdown execution, remote URL
  dereferencing, dynamic imports, or source-authored HTML.
- Native party export, build-set transfer, and backup are inert JSON downloads. Sanitize filenames,
  create and revoke object URLs, and never upload local data.
- Preserve explicit confirmations for disabling party mode, destructive slot/loadout removal,
  template import over local-only state, transfer import over dirty drafts, restore replace, and
  record deletion.
- Keep manifests, QA reports, source snapshots, source plans, local filesystem paths, catalog
  provenance internals, and wiki/API data out of runtime party transfer files unless a future source
  policy ticket explicitly allows them.
- Add no backend, auth, account identifiers, telemetry, analytics, service worker, collaboration
  channel, remote media, or new dependency.

## Dependencies

- `EPIC-16` / `SPRINT-017`: neutral build sets, `BuildSet`, `PersistedBuildSetSnapshot`, one active
  editor plus inactive snapshots, materialization, schema-2 local documents, build-set navigator,
  comparison, aggregate per-entry validation, backup/restore, and build-set transfer.
- `EPIC-08` / `SPRINT-009`: selected-loadout editor shell, profession/mode controls, skill bar,
  skill browser, template dialogs, validation panel, catalog boundary, and responsive component
  patterns.
- `EPIC-09` / `SPRINT-010`: `build-wars:v1` local storage key, working-draft autosave, saved
  records, dirty guards, share URLs, backup/restore, storage diagnostics, write-blocking, and stale
  revision behavior.
- `EPIC-13` / `SPRINT-014`: semantic equipment contracts and equipment validation inputs.
- `EPIC-14` / `SPRINT-015`: equipment editor, summaries, persistence, backup/restore, and
  share-omission warnings.
- `EPIC-15` / `SPRINT-016`: `Build.schemaVersion = 2`, title-rank overrides, title controls,
  title validation, persistence, and title share-omission warnings.
- Existing EPIC-03, EPIC-04, EPIC-10, EPIC-11, and EPIC-12 promoted catalogs through
  `src/app/catalogs.ts` only.
- Existing `src/template-compatibility` skill-template workflow for individual member code copy.
- Existing React, TypeScript, Vite, Vitest, Testing Library, ESLint, Prettier, npm, Python unit-test
  runner, and ticket-burn tooling.

## Open Questions

1. Should the final sprint keep the draft recommendation that `party` is an optional field on
   `PersistedBuildSetSnapshot`, or should party mode be a wrapper document kind around build sets?
   The optional annotation is simpler and better preserves neutral build-set semantics.
2. When a user disables party mode, should the annotation be deleted after confirmation or retained
   as disabled metadata for possible later restore? The draft recommends deletion with explicit
   confirmation and no loadout deletion.
3. Are 4, 6, and 8 sufficient built-in presets for MVP, with custom 1 through 16 covering all other
   cases? Adding more presets is easy but risks implying external-format support.
4. Should native party export be a distinct `build-wars-party-transfer` envelope, or should the
   existing build-set transfer envelope be the only JSON exchange path? The draft recommends a
   distinct party envelope plus party preservation in build-set transfer.
5. How should unassigned build-set entries appear in party mode? The draft recommends preserving and
   surfacing them as unassigned loadouts without counting them as party members.
6. Should mode mismatch ever be an error? The draft recommends warning-only behavior because MVP has
   no party legality engine or PvP format model.
7. Should selected empty party slot state survive reload? The draft recommends keeping empty-slot
   focus transient and persisting only `lastSelectedEntryId` for linked loadouts.
8. Should member label edits also update the neutral build-set entry label by default? The draft
   recommends keeping party labels independent to avoid changing neutral loadout organization by
   accident.
