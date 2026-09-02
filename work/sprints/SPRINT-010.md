---
id: SPRINT-010
title: Local Library and Sharing
status: completed
source_target: BACKLOG
source_epic: EPIC-09
source_epic_path: work/tickets/09-local-library-and-sharing/EPIC.md
tickets:
  - BW-0901
  - BW-0902
  - BW-0903
  - BW-0904
  - BW-0905
  - BW-0906
  - BW-0907
created: 2026-09-02
updated: 2026-09-02
completed: 2026-09-02
---

# Sprint 010: Local Library and Sharing

## Overview

This sprint turns the EPIC-08 in-memory single-character editor into a durable local workspace. The
current draft survives reloads, explicitly saved builds form a manageable local library, and users
can import, export, share, back up, and restore builds without an account, backend, hosted link, or
network dependency.

Persistence remains an app-layer concern. `src/domain` stays the framework-neutral authority for the
semantic `Build` and validation contracts, while `src/template-compatibility` stays the only skill
template codec boundary. EPIC-09 stores a durable editor projection that preserves the semantic
`Build`, PvE budget settings, EPIC-08 raw template overlay/source facts, and catalog-version facts
together. Persisting only the `Build` is prohibited because it would lose unresolved imported
template IDs and exact-source replay evidence.

The implementation is deliberately local and single-character only. It does not add IndexedDB,
backend sync, accounts, hosted sharing, short links, routing, service workers, PWA behavior,
analytics, auth, equipment/rune/insignia state, party or guide records, generated-data pipeline
changes, remote icon loading, or historical skill revision analysis.

## Use Cases

1. **Resume a working draft**: A user refreshes the browser and recovers the active draft, including
   unresolved imported professions, attributes, skills, raw template overlay entries, source
   envelopes, and PvE budget controls.
2. **Save intentionally**: A user saves the current draft as a named local record and later chooses
   explicitly between updating that record or saving a new copy.
3. **Manage local records**: A user duplicates, renames, favorites, tags, annotates, and deletes
   saved builds without automatic deduplication or backend identity.
4. **Find saved builds**: A user searches by build name or skill names, filters by profession, mode,
   favorite, and tag, sorts deterministically, and loads a selected build into the draft.
5. **Share one build**: A user creates a template-code-first share URL or copyable template text for
   one build, and a recipient opens it into the working draft without silently saving it.
6. **Recover a library**: A user exports a whole-library JSON backup, previews an import, and
   restores with merge or replace after explicit confirmation.
7. **Survive failures**: Storage unavailable, quota errors, malformed JSON, unsupported versions,
   invalid records, clipboard denial, history failure, and download failure leave the editor usable
   in memory with clear warnings.
8. **Understand freshness**: Loaded drafts and saved records validate against current catalogs and
   show stale or unresolved warnings without automatically replacing or migrating skills.
9. **Verify the sprint**: A reviewer can connect BW-0901 through BW-0907, `EPIC-09`, `SPRINT-010`,
   the ledger, and the ticket-burn manifests to the same implementation state.

## Architecture

### Scope Boundary

| Area              | In Scope                                                                                                                                                                          | Out Of Scope                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistence       | One browser `localStorage` key, versioned envelope, working draft, saved records, migration hooks, typed failures, write-blocked recovery, and best-effort stale-write detection. | IndexedDB, backend sync, account storage, cloud backup, auth, analytics, service workers, or cross-tab merge.                                                  |
| Editor ownership  | Durable projection of `Build`, `PveBudgetState`, raw template overlay/source, draft association, and catalog-version facts.                                                       | Persisting full `EditorState`, browser filters, open dialogs, tooltip state, drag state, selected slot, transient messages, or responsive panel state.         |
| Library workflows | Save new, update, save as new, duplicate, delete with confirmation, favorite, rename, tags, notes, load, search, filters, sorting, and responsive panel access.                   | Auto-deduplication, folders, collaboration, shared ownership, recommendations, guide libraries, party libraries, or remote search.                             |
| Sharing           | Skill-template-code-first single-build copy/export, versioned URL fragment, URL import into the draft, one-time fragment consumption, and length-cap fallback.                    | Single-build JSON as normal exchange, hosted sharing, short links, backend upload, equipment templates, paw-ned2/team templates, or automatic clipboard reads. |
| Backup/restore    | Whole-library inert JSON export/import, schema validation, preview, merge/replace confirmation, skipped-record reports, ID remaps, and separately opted-in draft restore.         | Encryption, compression, telemetry, remote recovery, executable content, screenshots, remote media bytes, generated audit artifacts, or source snapshots.      |
| Freshness         | Store saved-with catalog/version facts, derive current freshness warnings, and keep validation/resolution diagnostics separate.                                                   | Historical revision timelines, automatic skill replacement, equipment/title/party validation expansion, or EPIC-21 build analysis.                             |

### Durable Data Model

Use one app-owned localStorage key for MVP:

```text
build-wars:v1
```

The value is a plain JSON envelope with an internal schema version. The exact TypeScript names can
adjust during execution, but the model must keep these durable boundaries:

```text
LocalLibraryEnvelopeV1
  schemaVersion: 1
  kind: "build-wars-local-library"
  revision: integer
  updatedAt: ISO timestamp
  workingDraft: PersistedWorkingDraft | null
  savedBuilds: PersistedSavedBuildRecord[]
  metadata: bounded storage metadata only

PersistedWorkingDraft
  snapshot: PersistedBuildSnapshot
  associatedRecordId: LocalBuildRecordId | null
  savedWith: PersistedCatalogFacts

PersistedSavedBuildRecord
  id: LocalBuildRecordId
  name: string
  createdAt: ISO timestamp
  updatedAt: ISO timestamp
  favorite: boolean
  tags: string[]
  notes: string | null
  snapshot: PersistedBuildSnapshot
  savedWith: PersistedCatalogFacts

PersistedBuildSnapshot
  build: Build
  pveBudget: PveBudgetState
  rawTemplate: RawTemplateOverlay
```

The persisted snapshot must exclude browser filters, dialog open state, import/export textarea
drafts unless they are part of the template source envelope, tooltip state, drag state, keyboard
placement state, selected slot focus, transient messages, result batch size, and implementation
counters. Hydration merges durable data into current UI defaults rather than trusting an old UI
state tree.

`PersistedCatalogFacts` should be sourced from current app/catalog validation facts, including
profession/attribute catalog version, skill catalog version, build catalog version when available,
and rule-engine version. Freshness compares these saved-with facts to current catalog facts.
Freshness does not imply validity, and validity does not imply freshness.

Saved-record identity is the opaque local record ID. `Build.id`, build equality, normalized
template code, template wrapper name, and display name are never record identity. Duplicate names and
duplicate build contents are allowed.

### State Ownership

Add an app-level workspace state above the existing editor reducer:

```text
WorkspaceState
  editor: EditorState
  draftSession:
    associatedRecordId: LocalBuildRecordId | null
    hydrationSource: "blank" | "storage" | "saved-record" | "template-import" | "share-url" | "restore"
    dirtyState: "clean" | "dirty" | "unknown"
    durability: "durable" | "pending" | "memory-only" | "write-blocked" | "conflict"
  library:
    records: PersistedSavedBuildRecord[]
    selectedRecordId: LocalBuildRecordId | null
    query/filter/sort UI state
  storage:
    read/write diagnostics
    rejected payload summary
  restore:
    preview/apply state
```

`EditorState` should remain focused on the current draft and existing editor interactions. Avoid
moving saved-record collections, restore plans, or storage diagnostics into `EditorState`.
Workspace commands coordinate cross-concern transitions such as load record, save new, update, save
as new, import template, open share URL, confirm restore, clear association, and replace draft.

### Module Ownership

| Module                          | Responsibility                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/persistence-schema.ts` | Durable envelope, snapshot, saved record, catalog facts, bounded validators, migration hooks, deterministic serialization, and fixture factories.            |
| `src/app/local-storage.ts`      | Browser `localStorage` port, feature detection, read/write outcomes, quota/unavailable handling, revision check, and storage-key ownership.                  |
| `src/app/workspace-state.ts`    | Pure workspace reducer/commands over editor state, draft session, library records, storage status, dirty guards, and association rules.                      |
| `src/app/library-selectors.ts`  | Library search/filter/sort, facets, deterministic tie-breakers, row summaries, freshness chips, and skill-name lookup inputs.                                |
| `src/app/share-url.ts`          | Versioned URL fragment grammar, encode/decode, cap enforcement, one-time consumption helpers, and typed failures.                                            |
| `src/app/backup-restore.ts`     | Backup envelope, import validation, immutable restore preview plan, merge/replace application, ID remaps, draft restore options, and skipped-record reports. |
| `src/app/library-fixtures.ts`   | Valid, stale, unresolved, corrupt, duplicate, conflict, large-library, and restore fixtures for tests.                                                       |
| `src/app/template-workflow.ts`  | Existing skill-template fidelity boundary; extend only where share controls need existing exact/canonical export decisions.                                  |
| `src/app/editor-selectors.ts`   | Existing validation/export selectors plus current-draft saved/freshness diagnostics where they fit.                                                          |
| `src/app/App.tsx`               | Thin composition of catalogs, workspace reducer, boot sequence, persistence effects, warnings, library panel, dialogs, share handling, and live regions.     |
| `src/app/components/**`         | Library panel, save controls, storage banner, restore/share dialogs, status chips, and narrow-screen controls.                                               |

`src/domain/**` and `src/template-compatibility/**` are read-only by default. If execution proves an
app task cannot be represented through existing public APIs, stop for an architecture checkpoint in
the active ticket, keep any change minimal and semantics-preserving, and update protected-path
verification explicitly before continuing.

### Boot And Write Flow

Boot order is required and testable:

1. Adapt promoted catalogs through `src/app/catalogs.ts`.
2. Parse the current URL hash fragment for a Build Wars share payload.
3. Read and validate `build-wars:v1`.
4. Hydrate accepted saved records and storage diagnostics.
5. Select the starting draft:
   - valid share payload with no stored draft: hydrate an unassociated share draft and consume the
     fragment;
   - valid share payload with a stored draft: hydrate an unassociated transient share draft, consume
     the fragment, preserve the stored draft in storage, and require an explicit `Use as draft` or
     `Save new` action before overwriting the stored draft;
   - invalid share payload: keep the URL unchanged for diagnosis, fall back to the stored draft when
     valid, otherwise start blank;
   - no share payload: hydrate the valid stored draft, otherwise start blank.
6. Enable autosave only when the current draft is allowed to replace the stored working draft.
7. Persist through one storage write path that can report pending, durable, memory-only,
   write-blocked, or conflict state.

Writes are best-effort because localStorage has no atomic compare-and-swap. Store a revision and
check the latest envelope before writing so observable stale writes fail closed to `conflict`, but do
not claim perfect multi-tab protection. Cross-tab synchronization and merge remain deferred.

Root-corrupt, unsupported, or partially recovered storage enters `write-blocked`. Autosave must not
rewrite the stored value in that state. Normal writes resume only after an explicit user action such
as confirmed replacement with the recovered in-memory library, confirmed restore replace, or browser
site-data clearing outside the app. This prevents an autosave from silently deleting skipped
records.

### Draft Replacement And Association Rules

- `Save new` creates a new local record, writes the current durable snapshot, and associates the
  draft to that record.
- `Update` is available only when the draft is associated to an existing saved record and the user
  explicitly chooses overwrite.
- `Save as new` always creates a new local record and associates the draft to the new record.
- Template import and share import always clear association. `Update` is unavailable until the user
  saves or loads a record.
- Loading a saved record replaces the editor draft and raw overlay together, associates the draft to
  that record, and uses the shared dirty-draft guard when the current draft is not clean.
- Deleting an associated record keeps the in-memory draft loaded, clears association, and requires
  explicit confirmation for MVP.
- Duplicate clones a saved record to a fresh local ID without changing the active draft unless the
  user explicitly loads the duplicate.
- Rename makes the saved record name authoritative. If the renamed record is currently associated
  and the draft is clean, the draft name updates with it; if dirty, the UI must make the divergence
  visible and require an explicit save/update choice.

The dirty-draft guard applies to saved-record load, new blank draft, template import, share import
over an existing draft, backup draft restore, and destructive restore replace.

### Sharing

Single-build user exchange uses skill template codes. Share URLs are a convenience wrapper around
proven template output, not a new JSON build codec.

Use a versioned hash-fragment grammar built with `URL` and `URLSearchParams`:

```text
#bw=1&code=<percent-encoded-bare-skill-template-code>&mode=pve|pvp|unknown
```

`mode` is optional and may be omitted when unknown. Tags, favorite state, notes, local IDs,
backup metadata, whole-library JSON, equipment, runes, insignias, weapon mods, party data, guide
data, validation prose, and catalog snapshots are excluded.

Share export prefers exact-source bare code when available. If exact-source is unavailable, it may
use canonical bare code only when the existing template workflow proves representation, validation,
encode, and decode-back fidelity. If no proven template code is available, or the full encoded URL
would exceed 1,800 characters, the UI must provide selectable template text or a clear blocked
reason instead of inventing a lossy format.

After a valid share URL is consumed, use `history.replaceState` to remove the fragment where
available. If fragment consumption fails, the app must still avoid repeated silent overwrites and
surface a warning.

### Backup And Restore

Whole-library backup uses inert JSON and may preserve library-only metadata. It is separate from
single-build template sharing.

The backup envelope should contain:

- backup schema version and discriminator
- exported timestamp
- accepted saved records
- optional working draft
- saved-with catalog/version facts
- bounded metadata needed for restore preview

Restore must parse from `unknown`, validate through the same durable snapshot/record validators, and
produce an immutable preview plan before applying anything. The plan records accepted records,
skipped records with bounded reasons, duplicate IDs inside the backup, conflicts with current IDs,
ID remaps, association rewrites, whether an imported draft is available, and final merge/replace
counts.

Merge preserves current records and imports valid backup records, re-keying every incoming ID
collision even if contents are equal. Replace requires destructive confirmation and cannot wipe a
nonempty library from a declared-nonempty backup whose records all failed validation. Imported
working-draft restoration is separately opt-in in both merge and replace modes and uses the same
dirty-draft guard.

### Execution Topology

```text
BW-0901 storage contract, schema, validation, and failure handling
  -> BW-0902 working draft autosave and restore
BW-0902
  -> BW-0903 saved build record actions and dirty guards
BW-0903
  -> BW-0905 template-code sharing and share URLs
BW-0903 + BW-0905
  -> BW-0904 library panel, search, filters, sorting, and selection
BW-0903 + BW-0904
  -> BW-0906 backup and restore
BW-0902 + BW-0903 + BW-0904 + BW-0905 + BW-0906
  -> BW-0907 freshness, validation, docs, and closeout
```

Default execution order is `0901, 0902, 0903, 0905, 0904, 0906, 0907`. Pure backup parser work can
begin after the durable record schema is stable, but UI integration waits until saved-record and
dirty-guard behavior exists.

### Alternatives Considered

- **IndexedDB**: Deferred. One-key localStorage is enough for the single-character MVP and keeps
  storage behavior auditable. IndexedDB requires a later measured migration ticket.
- **Two localStorage keys**: Deferred. A separate draft key would reduce write blast radius, but
  EPIC-09 asks for one namespaced storage key. The merged plan uses one envelope and explicit
  write-blocked/conflict behavior.
- **Persist full `EditorState`**: Rejected because it would bake transient UI state into durable
  schema and complicate migrations.
- **Put library state inside `EditorState`**: Rejected. A workspace wrapper keeps collection,
  restore, durability, and association semantics app-owned without disrupting existing editor
  components.
- **Schema-validation dependency**: Rejected for MVP. Use bounded validators and focused fixtures;
  add a dependency only if execution proves hand-written validators are unsafe or unmaintainable.
- **Share single-build JSON**: Rejected. Single-build exchange remains skill-template-code-first;
  versioned JSON is reserved for whole-library backup/restore.
- **Hosted sharing or short links**: Rejected. Sharing is accountless and backend-free.

## Implementation

### Execution Bookkeeping

- [x] Confirm `SPRINT-009` is complete in `work/sprints/ledger.tsv`.
- [x] Confirm `EPIC-09` and BW-0901 through BW-0907 are linked to `SPRINT-010` before execution
      starts.
- [x] Move `EPIC-09` and active BW tickets to `in-progress` as work starts, then to `done` only
      after their gates pass.
- [x] Keep `source_target: BACKLOG`, `source_epic: EPIC-09`, and
      `source_epic_path: work/tickets/09-local-library-and-sharing/EPIC.md` consistent across
      sprint, ticket, epic, ledger, and run-manifest records.
- [x] Preserve unrelated worktree changes and do not commit unless separately requested.

### Phase 1: BW-0901 Versioned Local Storage Contracts (~16% of effort)

**Files:**

- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.ts`
- `src/app/local-storage.test.ts`
- `src/app/library-fixtures.ts`

**Tasks:**

- [x] Define the `build-wars:v1` key, v1 envelope, durable snapshot, saved-record, working-draft,
      catalog-facts, and metadata contracts as plain JSON data.
- [x] Add validators that reconstruct whitelisted fields from `unknown`, reject dangerous prototype
      keys, non-finite numbers, oversized strings/collections, duplicate IDs, malformed timestamps,
      unsupported schema versions, and invalid record subsets with bounded diagnostics.
- [x] Add migration hooks even if v1 is the only supported schema.
- [x] Add deterministic serialization so durable fingerprints and dirty checks are stable.
- [x] Add a browser storage adapter with feature detection, typed read/write results, quota and
      unavailable-storage handling, best-effort revision checks, and no automatic deletion of corrupt
      payloads.
- [x] Define `write-blocked` behavior for root-corrupt, unsupported, or partially recovered data.
- [x] Add fixtures for valid, unresolved, stale, corrupt, unsupported, duplicate-ID, oversized, and
      quota/unavailable cases.

**Verification:**

- `npm run test:run -- src/app/persistence-schema.test.ts src/app/local-storage.test.ts`
- `npm run typecheck`

**Phase Gate:** Storage reads and writes are versioned, deterministic, bounded, safe to fail, and
incapable of silently deleting corrupt or rejected stored data.

### Phase 2: BW-0902 Working Draft Autosave And Restore (~14% of effort)

**Files:**

- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/local-storage.ts`

**Tasks:**

- [x] Add durable draft projection and hydration helpers that merge `Build`, `PveBudgetState`, and
      raw template overlay/source into fresh editor defaults.
- [x] Restore a valid stored working draft on boot when no valid share URL takes precedence.
- [x] Persist the working draft only when the durable snapshot changes, using coalesced autosave and
      immediate flush for explicit save/update/restore operations.
- [x] Preserve unresolved imported IDs, raw template overlay entries, source envelopes, template
      names, and catalog-version facts across reload.
- [x] Keep autosave separate from saved records; it must not create a library record.
- [x] Handle React Strict Mode double effects, rapid editor actions, pagehide flush attempts, and
      storage failures without stale writes.
- [x] Surface non-blocking restore/autosave warnings and visible memory-only/write-blocked/conflict
      durability states.

**Verification:**

- `npm run test:run -- src/app/workspace-state.test.ts src/app/editor-state.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** A valid draft survives reload with raw-template fidelity, invalid drafts are skipped
without breaking the editor, and failed persistence is visible without claiming durability.

### Phase 3: BW-0903 Saved Build Record Actions And Dirty Guards (~18% of effort)

**Files:**

- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/components/LibraryDialogs.tsx`
- `src/app/components/StorageBanner.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Implement save new, update associated record, save as new, duplicate, delete confirmation,
      favorite, rename, tags, and notes as pure workspace commands.
- [x] Generate local IDs and timestamps through injectable helpers for deterministic tests.
- [x] Track draft association outside `EditorState`; clear association after external imports and
      associated-record deletion.
- [x] Allow duplicate build contents and duplicate names; normalize tag matching without losing
      display casing.
- [x] Make record name authoritative on save/load and handle associated-record rename for clean and
      dirty drafts.
- [x] Implement a shared dirty-draft guard for record load, new draft, template import, share import
      over an existing draft, restore draft, and destructive replace.
- [x] Persist library mutations through the same storage adapter and report in-memory success
      separately from durable write success.
- [x] Keep delete confirmation accessible, specific to the record, and safe by default.

**Verification:**

- `npm run test:run -- src/app/workspace-state.test.ts src/app/library-selectors.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** Saved-record actions are explicit, duplicate-safe, association-safe, dirty-guarded,
and reload-stable.

### Phase 4: BW-0905 Template Code Sharing And Share URLs (~12% of effort)

**Files:**

- `src/app/share-url.ts`
- `src/app/share-url.test.ts`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/components/ShareControls.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/template-dialogs.test.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`

**Tasks:**

- [x] Define and document the exact versioned hash-fragment grammar:
      `#bw=1&code=<bare-code>&mode=<optional-mode>`.
- [x] Build share URLs with `URL` and `URLSearchParams`; cap the complete encoded URL at 1,800
      characters.
- [x] Reuse existing exact-source and canonical export decisions; do not add a second build codec.
- [x] Prefer exact-source bare code when eligible, otherwise proven canonical bare code, otherwise
      show blocked reasons or selectable template text fallback.
- [x] Parse valid share URLs on boot into an unassociated draft and never mutate saved records
      implicitly.
- [x] Consume valid share fragments with `history.replaceState` where possible and handle failure
      without repeated silent overwrite.
- [x] Preserve stored drafts when a share URL opens over one; require explicit `Use as draft` or
      `Save new` before overwriting that stored draft.
- [x] Add typed failures for malformed percent encoding, duplicate/unknown params, unsupported
      version, invalid mode, oversized URL, invalid template code, and lossy/unrepresentable share.
- [x] Keep clipboard writes explicit and fallback to selectable text when copy fails.

**Verification:**

- `npm run test:run -- src/app/share-url.test.ts src/app/template-workflow.test.ts src/app/template-dialogs.test.tsx src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** Single-build sharing remains template-code-first, accountless, metadata-minimal, and
safe against share-fragment reapplication or accidental saved-record updates.

### Phase 5: BW-0904 Library Panel Search, Filters, Sorting, And Selection (~15% of effort)

**Files:**

- `src/app/components/LibraryPanel.tsx`
- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/workspace-state.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Add a compact desktop side panel that can collapse into accessible controls on narrower
      screens without routing or a multi-page shell.
- [x] Show saved build name, profession pair, mode, updated date, favorite marker, tags, notes
      affordance, and distinct freshness/validation/resolution summaries.
- [x] Search by build name, resolved skill names, and unresolved raw skill labels.
- [x] Filter by profession, mode, favorite, and tag.
- [x] Sort by updated date, name, and profession pair with stable tie-breakers by normalized name,
      updated timestamp, and local ID.
- [x] Support load, save new, update, save as new, duplicate, rename, favorite, tags, notes, delete,
      share, backup, and restore entry points without hiding destructive context.
- [x] Include empty-library, no-results, storage-warning, write-blocked, conflict, and memory-only
      states.
- [x] Keep keyboard access, focus return, live announcements, long text wrapping, and narrow-width
      layout usable.

**Verification:**

- `npm run test:run -- src/app/library-selectors.test.ts src/app/App.test.tsx`
- `npm run build`
- Manual keyboard and narrow-screen walkthrough recorded in the execution notes.

**Phase Gate:** Users can find, select, and manage saved builds from the editor screen with
deterministic selectors and no network or routing dependency.

### Phase 6: BW-0906 Library Backup And Restore (~13% of effort)

**Files:**

- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/components/LibraryDialogs.tsx`
- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [x] Add a versioned backup envelope using inert JSON with exported timestamp, accepted saved
      records, optional working draft, and saved-with catalog facts.
- [x] Export the current library through explicit user action, with selectable/download fallback and
      Blob URL revocation.
- [x] Validate backup imports from `unknown`, rejecting oversized, malformed, unsupported, dangerous,
      or invalid roots with bounded diagnostics.
- [x] Generate an immutable restore preview plan with accepted/skipped counts, duplicate IDs,
      current-ID conflicts, ID remaps, association rewrites, optional draft availability, and
      merge/replace final counts.
- [x] Implement merge by preserving current records and re-keying every incoming ID collision.
- [x] Implement replace with destructive confirmation and all-invalid declared-nonempty protection.
- [x] Make imported working-draft restoration separately opt-in in both merge and replace modes.
- [x] Apply the confirmed plan exactly once and report imported, remapped, skipped, draft, memory-only,
      and durable-write outcomes separately.
- [x] Preserve user text as plain data and never render imported backup content as HTML or markdown.

**Verification:**

- `npm run test:run -- src/app/backup-restore.test.ts src/app/workspace-state.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** A user can recover the saved library from a backup without silent overwrite,
unexpected draft replacement, ID collision loss, or executable/imported-content risk.

### Phase 7: BW-0907 Freshness, Validation, Docs, And Closeout (~12% of effort)

**Files:**

- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/App.test.tsx`
- `README.md`
- `compendium/local-library-and-sharing.md`
- `compendium/core-build-editor.md`
- `compendium/README.md`
- `work/tickets/09-local-library-and-sharing/EPIC.md`
- `work/tickets/09-local-library-and-sharing/BW-090*.md`
- `work/sprints/SPRINT-010.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-010-result.json`

**Tasks:**

- [x] Store saved-with catalog and rule-engine facts whenever a draft or saved record is persisted
      from current data.
- [x] Validate loaded working drafts and saved records against current EPIC-03/04 catalogs and
      EPIC-06 rule-engine facts.
- [x] Show catalog freshness, validation validity, and resolution state as separate diagnostics.
- [x] Preserve stale, unknown, invalid, and unresolved IDs without automatic replacement.
- [x] Add focused tests for freshness transitions, stale-but-valid records, fresh-but-invalid
      records, unresolved raw IDs, and loaded-record summaries.
- [x] Update README and compendium notes with the storage key, durable schema summary, share URL
      limit, backup/restore behavior, browser-profile limitations, source/media boundaries, and
      deferred EPIC-21 analysis.
- [x] Run protected-path scans to confirm no runtime imports from generated manifests, QA reports,
      source snapshots, data scripts, wiki APIs, or remote media bytes, and no unplanned changes to
      `src/domain/**` or `src/template-compatibility/**`.
- [x] Run `npm run verify`.
- [x] Mark BW-0901 through BW-0907, EPIC-09, SPRINT-010, ledger, and required ticket-burn manifests
      complete only after every phase gate and Definition of Done item passes.

**Verification:**

- `npm run test:run -- src/app/library-selectors.test.ts src/app/App.test.tsx`
- `rg -n 'data/generated/' src/app`
- `rg -n '(data/qa|data/source-snapshots|scripts/data|api\\.php|wiki\\.guildwars)' src/app`
- `npm run verify`

**Phase Gate:** Local library and sharing behavior is documented, traceable, validated, and ready to
close EPIC-09.

## Files Summary

| File                                                                            | Action                  | Purpose                                                                                                 |
| ------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/app/persistence-schema.ts`                                                 | Create                  | Durable envelope, snapshot, saved-record, migration, validation, and serialization contracts.           |
| `src/app/persistence-schema.test.ts`                                            | Create                  | Schema, migration, parser, bounds, corruption, and raw-overlay round-trip coverage.                     |
| `src/app/local-storage.ts`                                                      | Create                  | Browser storage adapter, key ownership, feature detection, typed failures, and revision checks.         |
| `src/app/local-storage.test.ts`                                                 | Create                  | Unavailable, quota, stale revision, malformed data, and write-blocked storage coverage.                 |
| `src/app/workspace-state.ts`                                                    | Create                  | App-level editor/library/draft-session reducer and atomic workflow commands.                            |
| `src/app/workspace-state.test.ts`                                               | Create                  | Autosave, save/update/save-as-new, dirty guards, associations, restore, and failure states.             |
| `src/app/library-selectors.ts`                                                  | Create                  | Library query, filters, sorting, facets, row summaries, and freshness diagnostics.                      |
| `src/app/library-selectors.test.ts`                                             | Create                  | Deterministic search/filter/sort/freshness/resolution coverage.                                         |
| `src/app/share-url.ts`                                                          | Create                  | Share fragment encode/decode, length cap, boot policy helpers, and typed errors.                        |
| `src/app/share-url.test.ts`                                                     | Create                  | URL grammar, cap, invalid fragment, one-time consumption, and metadata exclusion coverage.              |
| `src/app/backup-restore.ts`                                                     | Create                  | Backup envelope, preview plan, merge/replace, ID remaps, skipped reports, and apply behavior.           |
| `src/app/backup-restore.test.ts`                                                | Create                  | Backup round-trip, corrupt import, restore preview/apply, conflict, replace, and draft opt-in coverage. |
| `src/app/library-fixtures.ts`                                                   | Create                  | Reusable valid/stale/unresolved/duplicate/corrupt/large fixtures.                                       |
| `src/app/components/LibraryPanel.tsx`                                           | Create                  | Saved-build panel with search, filters, sorting, record rows, and responsive access.                    |
| `src/app/components/LibraryDialogs.tsx`                                         | Create                  | Save, rename, delete, backup, restore, and confirmation dialogs.                                        |
| `src/app/components/StorageBanner.tsx`                                          | Create                  | Storage durability, write-blocked, conflict, and recovery warnings.                                     |
| `src/app/components/ShareControls.tsx`                                          | Create                  | Share URL and template text controls if not folded into template dialogs.                               |
| `src/app/components/TemplateDialogs.tsx`                                        | Modify                  | Reuse template import/export policy for share controls and dirty guard entry points.                    |
| `src/app/template-workflow.ts`                                                  | Modify if needed        | Expose existing exact/canonical decisions for share flows without adding a new codec.                   |
| `src/app/editor-state.ts`                                                       | Modify if needed        | Add only durable projection helpers if they cannot live cleanly in workspace modules.                   |
| `src/app/editor-selectors.ts`                                                   | Modify                  | Integrate current-draft freshness and saved-record diagnostics where appropriate.                       |
| `src/app/App.tsx`                                                               | Modify                  | Compose workspace state, boot hydration, persistence effects, library panel, banners, and dialogs.      |
| `src/app/App.test.tsx`                                                          | Modify                  | Cover integrated storage, share boot, library, restore, and warning flows.                              |
| `src/app/styles.css`                                                            | Modify                  | Add library, storage, dialog, share, restore, and responsive styles.                                    |
| `README.md`                                                                     | Modify                  | Document shipped local library/sharing behavior and current deferred scope.                             |
| `compendium/local-library-and-sharing.md`                                       | Create                  | Durable architecture, storage schema, share URL, backup/restore, and limits note.                       |
| `compendium/core-build-editor.md`                                               | Modify                  | Replace EPIC-09 deferral with concise handoff to local-library behavior.                                |
| `compendium/README.md`                                                          | Modify                  | Index the new local-library compendium note.                                                            |
| `work/tickets/09-local-library-and-sharing/*.md`                                | Modify during execution | Track planned/completed sprint metadata and completion evidence.                                        |
| `work/sprints/SPRINT-010.md`                                                    | Modify during execution | Execution checklist and closeout state.                                                                 |
| `work/sprints/ledger.tsv`                                                       | Modify                  | Sprint lifecycle tracking.                                                                              |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-010-result.json` | Create during execution | Required ticket-burn execution result manifest.                                                         |

## Definition of Done

- [x] Exactly one MVP localStorage key, `build-wars:v1`, stores a versioned plain-data envelope.
- [x] The durable snapshot round-trips `Build`, `PveBudgetState`, raw template overlay/source,
      unresolved imported IDs, template name/source facts, and saved-with catalog/version facts.
- [x] Full UI state is not persisted; hydration reconstructs browser/dialog/tooltip/drag/selection
      state from current defaults.
- [x] Storage parsing, migration, deterministic serialization, corrupt root, unsupported version,
      invalid subset, duplicate ID, oversized payload, quota error, unavailable storage, stale
      revision, write-blocked, conflict, and memory-only paths are tested.
- [x] Corrupt or unsupported local data is not automatically deleted or overwritten by autosave.
- [x] Working draft autosave is separate from saved records and never creates a library record
      implicitly.
- [x] Autosave coalescing, explicit flushes, React Strict Mode behavior, pagehide attempts, and
      stale-write handling are covered by focused tests.
- [x] Saved operations cover save new, update, save as new, duplicate, delete confirmation, favorite,
      rename, tags, notes, and associated-record deletion.
- [x] Dirty-draft guards protect saved-record load, new blank draft, template import, share import
      over an existing draft, backup draft restore, and destructive restore replace.
- [x] Record identity uses local IDs only; duplicate build contents and names are allowed.
- [x] Library panel supports deterministic search by build and skill names, unresolved raw label
      search, profession/mode/favorite/tag filters, updated/name/profession sorting, stable
      tie-breakers, empty/no-result states, and responsive access.
- [x] Catalog freshness, build validation, and resolution/unresolved status are separate diagnostics.
- [x] Share URL export uses only proven exact-source or canonical skill template output.
- [x] Share URLs use the documented hash-fragment grammar, exclude library-only metadata, enforce
      the 1,800-character full-URL cap, and fall back safely when blocked, oversized, or copy-denied.
- [x] Share URL import hydrates an unassociated draft, consumes valid fragments where possible,
      preserves existing stored drafts unless explicitly replaced, and never mutates saved records
      implicitly.
- [x] Backup export writes inert JSON with no HTML, executable content, remote media bytes,
      screenshots, generated audit artifacts, source snapshots, or code-evaluation paths.
- [x] Restore import validates before apply, previews accepted/skipped/conflict/remap/draft counts,
      applies an immutable confirmed plan once, supports merge and replace, re-keys conflicts, and
      reports skipped records.
- [x] Backup working-draft restoration is separately opt-in and uses the same dirty guard in merge
      and replace modes.
- [x] User-authored names, tags, notes, template inputs, share fragments, backup contents, raw labels,
      and diagnostics render as escaped plain text.
- [x] Clipboard, download, history, storage, and URL API failures degrade without breaking editing.
- [x] No backend, account, auth, analytics, service worker, IndexedDB, hosted sharing, short-link,
      remote icon/media fetch, or new runtime dependency is introduced.
- [x] Runtime app code still imports generated catalogs only through `src/app/catalogs.ts`; no
      generated manifests, QA reports, source snapshots, data scripts, wiki APIs, or remote media
      bytes enter runtime paths.
- [x] `src/domain/**` and `src/template-compatibility/**` remain unchanged unless a documented
      architecture checkpoint justifies a minimal public-contract change.
- [x] README, compendium, tickets, sprint, ledger, and run manifests agree on shipped behavior,
      storage key, share limit, backup format, assumptions, deferred scope, and status.
- [x] `npm run verify` passes before EPIC-09, BW-0901 through BW-0907, SPRINT-010, and the ledger are
      marked complete.

## Risks & Mitigations

| Risk                                                                              | Likelihood | Impact   | Mitigation                                                                                                                                     |
| --------------------------------------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Persisting only `Build` loses raw template identity and exact replay after reload | Medium     | Critical | Make `PersistedBuildSnapshot` include `Build`, `PveBudgetState`, and raw template overlay/source; test unresolved fixtures through every path. |
| Persisting full `EditorState` creates brittle schema and stale UI state           | Medium     | High     | Persist a whitelist durable projection and assert transient UI fields are absent.                                                              |
| Corrupt storage is silently destroyed by the next autosave                        | Medium     | Critical | Enter write-blocked mode after corrupt/partial recovery and require explicit user replacement before writing.                                  |
| localStorage race handling is overtrusted                                         | Medium     | High     | Use best-effort revision checks and visible conflict state; document that cross-tab merge/sync is deferred.                                    |
| Whole-envelope autosave causes main-thread, quota, or stale-write issues          | Medium     | High     | Coalesce draft writes, avoid derived data, bound payloads, flush explicit commands, and test large fixtures.                                   |
| A share URL overwrites an existing stored draft                                   | Medium     | High     | Preserve stored draft when share opens over one and require explicit `Use as draft` or save action before replacing it.                        |
| Share fragment reapplies on refresh after edits                                   | Medium     | High     | Consume valid fragments with history replacement where possible and guard repeated application when it fails.                                  |
| Save/update semantics accidentally overwrite the wrong record                     | Medium     | Critical | Keep association outside `EditorState`, clear it after imports/deletes, and expose `Update` only for existing associated records.              |
| Dirty work is lost when loading, importing, restoring, or creating                | Medium     | High     | Route all replacement flows through one dirty-draft guard with tested Save/Discard/Cancel outcomes.                                            |
| Restore merge or replace loses records through ID conflicts or invalid subsets    | Medium     | Critical | Generate immutable preview plans, re-key every incoming collision, block all-invalid destructive replace, and report skips.                    |
| Freshness warnings become automatic migration policy                              | Medium     | High     | Keep freshness, validation, and resolution as separate diagnostics; preserve stale data until explicit save.                                   |
| Manual schema validators drift from durable types                                 | Medium     | High     | Centralize validators, serialization, fixture factories, and round-trip tests; consider a later dependency only with evidence.                 |
| User text or backup JSON becomes executable content                               | Medium     | Critical | Parse from `unknown`, whitelist data, reject dangerous keys, render via React escaping, and never eval/render HTML.                            |
| Library UI grows beyond the editor surface                                        | Medium     | Medium   | Keep a compact panel/dialog design, no routing, no nested cards, and focused responsive checks.                                                |
| Scope creeps into backend, equipment, party, guide, PWA, or historical analysis   | Medium     | High     | Enforce the scope table and name downstream epic owners for deferred behavior.                                                                 |

## Security Considerations

- Treat localStorage values, backup files, share fragments, template input, names, tags, notes, raw
  overlay labels, validation messages, browser exception text, clipboard results, and download
  filenames as untrusted input.
- Parse JSON from `unknown`, reconstruct whitelisted fields, reject dangerous prototype keys, bound
  strings and arrays, require finite safe numbers, and cap diagnostics.
- Render user-authored and imported text through normal React escaping only. Do not introduce HTML
  rendering, markdown rendering, `dangerouslySetInnerHTML`, dynamic import, eval, executable URLs, or
  code evaluation.
- Do not expose full raw payloads, stack traces, local filesystem paths, dependency internals, or
  full rejected template codes in user-facing warnings.
- Do not automatically delete or rewrite corrupt/unsupported storage.
- Share fragments are public user-distributed data. A hash fragment reduces ordinary HTTP request
  and referrer exposure, but it does not protect against browser history, extensions, clipboard
  access, screen capture, or recipient forwarding.
- Clipboard writes, file downloads, and restore applies require explicit user action. Clipboard
  reads are never automatic.
- Backup Blob URLs are short-lived and revoked. Suggested filenames use fixed ASCII prefixes and
  validated UTC date facts, not user-controlled build names or paths.
- Keep all operation local and offline. Add no analytics, telemetry, crash upload, backend API, auth
  token, cookie, service worker, sync client, remote icon fetch, or remote recovery path.
- Existing attribution and remote-media restrictions remain in force: source links are user-activated
  anchors, and remote media metadata must not become an image, CSS URL, preload, canvas, service
  worker, or fetch source.

## Dependencies

- `SPRINT-001` / EPIC-00: React/Vite/TypeScript/Vitest foundation, strict checks, accessible
  baseline, repo layout, and canonical `npm run verify`.
- `SPRINT-002` / EPIC-01: source policy, attribution, privacy, media, and artifact restrictions.
- `SPRINT-004` / EPIC-03: promoted profession/attribute catalog, template crosswalks, budget facts,
  and catalog version.
- `SPRINT-005` / EPIC-04: promoted skill catalog, skill names and facts, template mappings,
  dispositions, and catalog version.
- `SPRINT-006` / EPIC-05: skill-template parse/decode/export, exact-source replay, canonical
  encode/decode-back proof, source envelopes, and typed errors.
- `SPRINT-007` / EPIC-06: `validateBuild`, structural issue locations, validation result
  `validatedAgainst` facts, unresolved-ID behavior, and PvE budget policy.
- `SPRINT-008` / EPIC-07: visual and interaction reference notes for compact editor surfaces,
  dialogs, focus, responsive layout, and missing states.
- `SPRINT-009` / EPIC-08: in-memory single-character editor, raw template overlay/source
  invariants, app catalog boundary, validation selectors, skill browser/bar, template dialogs, and
  responsive editor shell.
- Existing browser APIs: `localStorage`, `URL`, `URLSearchParams`, `history.replaceState`,
  `Blob`/object URL, file input/download controls, and optional clipboard writes. Every capability
  must degrade safely.
- No new npm runtime dependency is planned.

## Open Questions

No open question blocks execution in non-interactive mode. Use these defaults unless implementation
finds a narrower, clearly safer option:

1. Store one localStorage key, `build-wars:v1`, with an internal v1 envelope and documented future
   migration path.
2. Keep library and persistence state in an app-level workspace wrapper beside `EditorState`.
3. Persist only the durable snapshot, association, saved-record metadata, and catalog facts.
4. Treat localStorage revision checks as best-effort conflict detection, not atomic locking.
5. Enter write-blocked mode after corrupt or partial recovery and require explicit user recovery
   before writing.
6. Use explicit delete confirmation for MVP rather than undo history.
7. Use a hash-fragment share URL with `bw`, `code`, and optional `mode` params and a 1,800-character
   full encoded URL cap.
8. Preserve an existing stored draft when opening a share URL over it until the user explicitly uses
   or saves the shared draft.
9. Re-key every incoming restore ID collision, even for equal content.
10. Keep backup working-draft restore separately opt-in.
11. Add `compendium/local-library-and-sharing.md` for durable storage/share/backup documentation.
12. Defer IndexedDB, cross-tab merge, encryption, compression, folders, hosted sharing, sync, PWA,
    equipment, title, party, guide, community, and historical revision analysis to later epics.
