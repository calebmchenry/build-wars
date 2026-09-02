---
id: SPRINT-010
title: Local Library and Sharing
status: planned
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
---

# Sprint 010: Local Library and Sharing

## Overview

This sprint turns `EPIC-09 Local Library and Sharing` into the persistence and exchange layer for
the EPIC-08 editor. The implementation must preserve the existing semantic `Build` plus the raw
template overlay and source envelope so imported unresolved facts remain recoverable through
reloads, saves, shares, and backup/restore.

The sequencing priority is to lock the storage contract and boot rules before expanding UI. The
default execution order should be `BW-0901 -> BW-0902 -> BW-0903 -> BW-0905 -> BW-0904 ->
BW-0906 -> BW-0907`. `BW-0904` and `BW-0905` can overlap after saved-record semantics land, but
share URL precedence and draft hydration should stabilize before the library panel becomes the main
workflow surface.

This sprint stays local-first and single-character only. It must not add IndexedDB, backend sync,
accounts, hosted sharing, routing, equipment editing, party/guide persistence, analytics, service
workers, or runtime imports from generated manifests, QA outputs, source snapshots, Python tooling,
or remote media bytes.

## Use Cases

1. A user refreshes the page and resumes the current working draft, including unresolved imported
   professions, attributes, skills, and raw template-source facts.
2. A user saves the current draft as a named local record, later chooses explicit `Update` or
   `Save as new`, and can duplicate, favorite, rename, tag, annotate, or delete that record.
3. A user browses a compact local library, searches by build name or skill names, filters by
   profession, mode, favorite, or tag, sorts deterministically, and loads a selected record into
   the working draft.
4. A user shares one build through a template-code-first URL or copyable template text without
   saving it to any backend or silently creating a library record.
5. A user exports a whole-library JSON backup, previews an import, and restores with merge or
   replace while receiving explicit reports for invalid or conflicting records.
6. A user sees clear warnings when storage is unavailable, quota-limited, stale, malformed, or
   unsupported, but the editor remains usable in memory.
7. A reviewer can verify that persistence, sharing, restore, freshness, and responsive flows pass
   focused tests and the final `npm run verify` gate.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Persistence | One browser `localStorage` key, versioned envelope, saved build records, separate working draft, typed read/write failures, and migration hooks. | IndexedDB, backend sync, accounts, auth, analytics, service workers, or cross-device state. |
| Editor ownership | Preserve current `Build`, raw template overlay, source envelope, and explicit saved-record association without persisting browser-only UI state. | Persisting dialogs, hover state, search batch size, drag state, tooltip state, or transient toasts. |
| Library workflows | Save new, update associated record, save as new, duplicate, delete, favorite, rename, tags, notes, selection, and deterministic search/filter/sort. | Auto-deduplication, folders, collaboration, shared ownership, guide libraries, or party libraries. |
| Sharing | Template-code-first single-build export/import, share URL fragment, oversized fallback to selectable text, and share-to-draft loading. | Single-build JSON exchange, hosted sharing, short links, network upload, equipment or team template sharing. |
| Backup/restore | Whole-library JSON export/import, preview, merge/replace confirmation, skipped-record reports, and local ID conflict handling. | Cloud backup, encryption, compression, telemetry, remote recovery, or generated audit artifacts in backups. |
| Validation and freshness | Store catalog-version facts, validate loaded draft/records against current catalogs, and show stale or unresolved warnings without auto-migration. | Historical revision analysis, replacement-skill suggestions, title/equipment/party validation expansion, or EPIC-21 freshness history. |

### State And Storage Model

The sprint should keep the current editor reducer focused on the working draft and move library
collection concerns beside it.

- `EditorState` should continue to own the current semantic `Build`, raw template overlay, and
  current template dialog state. It should gain only draft-specific persistence fields such as
  `associatedRecordId` and a small hydration-source flag needed for share-URL precedence.
- A new app-local library state should own saved records, selected record ID, library query state,
  restore preview/report state, and storage capability warnings.
- Persisted working draft data should include only the semantic `Build`, raw template overlay,
  associated record ID, and structured catalog-version facts. Browser filters, tooltips, dialog
  open state, drag state, and transient messages should not be serialized.
- Saved library records should store local ID, name, created/updated timestamps, favorite state,
  normalized tag list, optional short notes, semantic `Build`, raw template overlay/source, and
  last-known profession/attribute and skill catalog versions.
- Duplicate build contents are allowed. Saved-record identity is the local record ID, never build
  equality or template wrapper name.

The versioned storage envelope should stay plain-data and migration-friendly. The default v1 shape
should be one storage document under `build-wars:v1` with:

- `schemaVersion`
- `savedBuilds`
- `workingDraft`
- `metadata` for write timestamps and implementation-owned diagnostics

Backup files should reuse the same record shapes and add export metadata such as `exportedAt`
without creating a second semantic model for saved builds.

### Module Ownership

| Module | Responsibility |
| --- | --- |
| `src/app/library-storage.ts` | Storage key constant, envelope validation, migration hooks, parse/serialize helpers, typed read/write failures, and `localStorage` access boundary. |
| `src/app/library-state.ts` | Pure saved-record and draft-association operations: save new, update, save as new, duplicate, delete, favorite, rename, tags, notes, and conflict-safe record replacement. |
| `src/app/library-selectors.ts` | Deterministic library search/filter/sort projections, profession/mode labels, freshness chips, and skill-name search inputs. |
| `src/app/share-url.ts` | URL fragment build/parse, conservative length cap enforcement, and share-on-boot precedence helpers. |
| `src/app/backup-restore.ts` | Backup export/import parsing, preview counts, merge/replace planning, ID conflict handling, and skipped-record reports. |
| `src/app/editor-state.ts` | Current working draft reducer plus small persisted-draft fields, not the whole library collection. |
| `src/app/editor-selectors.ts` | Existing validation/export selectors extended with saved-record freshness and loaded-draft diagnostics. |
| `src/app/template-workflow.ts` | Remains the single-build template fidelity boundary. Share URLs must reuse its exact-source and canonical export decisions. |
| `src/app/App.tsx` | Boot orchestration, hydration order, autosave effects, storage warnings, library panel, dialogs, and responsive composition. |
| `src/app/components/**` | Library panel, save/delete/restore dialogs, storage warning banner, and any added status chips or controls. |

`src/domain/**` and `src/template-compatibility/**` should remain read-only by default. If
execution proves a blocking public-contract gap, keep the change minimal, semantics-preserving, and
explicitly justified in the owning ticket before continuing.

### Boot, Persistence, And Sharing Flow

The boot sequence should be explicit and testable:

1. Adapt the promoted catalogs through the existing app boundary.
2. Parse the current URL fragment for a share payload.
3. Read and validate the `build-wars:v1` storage envelope.
4. Hydrate the saved library from valid stored records.
5. Choose the working draft in this order: valid share URL, else valid stored working draft, else a
   blank editor state.
6. If a share URL wins, keep the saved library untouched and suspend draft autosave until the first
   local mutation or explicit save/update action.
7. Persist draft and library changes through one storage adapter that can fail without breaking
   editing.

Record association semantics should be equally explicit:

- `Save new` creates a new local record ID and associates the working draft to that record.
- `Update` is available only when the working draft is associated to an existing record and the user
  explicitly chooses overwrite.
- `Save as new` always creates a new local record, even when the draft is associated to another
  record.
- `Duplicate` clones an existing saved record to a new local ID without modifying the original.
- `Delete` uses explicit confirmation for MVP. If the deleted record is currently associated, the
  in-memory draft remains loaded and the association is cleared.

### Library Query And Restore Rules

- Search should include build name, resolved skill names, and unresolved raw skill labels when
  present.
- Tag matching should be case-insensitive and deterministic, while stored display casing remains
  stable.
- Default sort should be most recently updated first, with stable tie-breakers by normalized name
  and local ID.
- Loading a saved record replaces the working draft and its raw overlay together, then restores the
  saved-record association.
- Backup restore `merge` should preserve existing records and assign fresh IDs for imported ID
  conflicts.
- Backup restore `replace` should require explicit confirmation and swap in only validated imported
  records plus the imported working draft when present.

### Execution Topology

```text
BW-0901 storage contract and failure handling
  -> BW-0902 working draft autosave and restore
BW-0902
  -> BW-0903 saved build record actions
BW-0903
  -> BW-0905 template-code sharing and share URLs
  -> BW-0904 library panel, search, filters, and sorting
BW-0904 + BW-0903
  -> BW-0906 backup and restore UI integration
BW-0902 + BW-0903 + BW-0904 + BW-0905 + BW-0906
  -> BW-0907 freshness, validation, docs, and closeout
```

Pure parser work for `BW-0906` can start after `BW-0903`, but the default execution order should
remain `0901, 0902, 0903, 0905, 0904, 0906, 0907` so boot semantics settle before the panel and
restore UI depend on them.

## Implementation

### Execution Bookkeeping

- [ ] Confirm `SPRINT-009` is complete in `work/sprints/ledger.tsv` and `EPIC-09` plus
      `BW-0901` through `BW-0907` are still the next ready ticket set before execution starts.
- [ ] Create or update `work/sprints/SPRINT-010.md` before implementation and keep its frontmatter
      aligned with `source_target: BACKLOG`, `source_epic: EPIC-09`, and the seven-ticket list.
- [ ] Move `EPIC-09` and the active BW ticket to `in-progress` as work begins, then to `done` only
      after each phase gate and final verification pass.
- [ ] Keep sprint, ticket, epic, ledger, and ticket-burn manifest records consistent; do not create
      a commit unless separately requested.

### Phase 1: BW-0901 Versioned Local Storage Contracts (~16%)

**Files:**

- `src/app/library-storage.ts`
- `src/app/library-storage.test.ts`

**Tasks:**

- [ ] Add one app-owned storage adapter with the constant key `build-wars:v1`.
- [ ] Define the v1 envelope, saved-record shape, and working-draft shape as plain data with an
      explicit schema version and migration entry point.
- [ ] Serialize semantic `Build`, raw template overlay/source, saved-record metadata, associated
      record ID, and structured catalog-version facts while excluding browser-only UI state.
- [ ] Return typed read/write outcomes for storage unavailable, quota exceeded, malformed JSON,
      unsupported schema version, and invalid record subsets.
- [ ] Preserve corrupt or unsupported raw payloads for diagnostics and fallback behavior; never
      auto-delete them.
- [ ] Cover parser, migration, serialization, quota, and invalid-record behavior with focused tests.

**Verification:**

- `npm run test:run -- src/app/library-storage.test.ts`
- `npm run typecheck`

**Phase Gate:**

Storage reads and writes are deterministic, versioned, and safe to fail without taking down the
editor.

### Phase 2: BW-0902 Working Draft Autosave And Restore (~14%)

**Files:**

- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/library-storage.ts`

**Tasks:**

- [ ] Add persisted-draft projection and hydration helpers for the current editor state.
- [ ] Restore a valid stored working draft on app boot when no valid share URL takes precedence.
- [ ] Persist the working draft only when its serialized snapshot changes, keeping autosave separate
      from the saved library list.
- [ ] Preserve unresolved imported IDs and raw template overlay/source data across reload.
- [ ] Surface non-blocking restore and autosave warnings while keeping the editor usable in memory.
- [ ] Skip invalid stored draft data cleanly and continue with a blank editor session.

**Verification:**

- `npm run test:run -- src/app/editor-state.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:**

A refresh restores the working draft when possible, never creates a saved record implicitly, and
falls back safely when storage fails.

### Phase 3: BW-0903 Saved Build Record Actions (~18%)

**Files:**

- `src/app/library-state.ts`
- `src/app/library-state.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/components/LibraryDialogs.tsx`
- `src/app/components/StorageBanner.tsx`

**Tasks:**

- [ ] Implement pure saved-record operations for save new, update associated record, save as new,
      duplicate, delete, favorite, rename, tags, and short notes.
- [ ] Generate local IDs and timestamps through one helper and allow duplicate build contents.
- [ ] Track `associatedRecordId` on the working draft so `Update` and `Save as new` remain explicit
      and testable.
- [ ] Use delete confirmation rather than silent removal or implicit undo.
- [ ] Clear association but keep the working draft loaded when the associated saved record is
      deleted.
- [ ] Persist library mutations through the storage adapter and degrade to in-memory warnings on
      write failure.

**Verification:**

- `npm run test:run -- src/app/library-state.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:**

Saved-record semantics are explicit, duplicate-safe, reload-stable, and independent from the
working draft autosave path.

### Phase 4: BW-0905 Template Code Sharing And Share URLs (~12%)

**Files:**

- `src/app/share-url.ts`
- `src/app/share-url.test.ts`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/template-dialogs.test.tsx`
- `src/app/App.tsx`

**Tasks:**

- [ ] Define one share URL fragment format using bare template code plus optional mode, reusing the
      existing template fidelity boundary for exact-source or canonical export.
- [ ] Prefer exact-source bare code when available; otherwise use canonical bare code only when the
      current projection and proof already allow it.
- [ ] Enforce a conservative URL-length cap and fall back to selectable template text when a share
      URL would be too large or lossy.
- [ ] Parse valid share URLs on boot into the working draft only; never create or mutate saved
      library records implicitly.
- [ ] Suspend draft autosave after share-URL hydration until the first local mutation or explicit
      save/update action so an existing local draft is not overwritten just by opening a link.
- [ ] Surface safe, typed failures for invalid or unsupported share payloads and keep the previous
      local draft/library intact.

**Verification:**

- `npm run test:run -- src/app/share-url.test.ts src/app/template-workflow.test.ts src/app/template-dialogs.test.tsx`
- `npm run typecheck`

**Phase Gate:**

Share URLs are template-code-first, draft-only, length-bounded, and faithful to the existing
import/export policy.

### Phase 5: BW-0904 Library Panel Search, Filters, And Sorting (~14%)

**Files:**

- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/components/LibraryPanel.tsx`
- `src/app/library-panel.test.tsx`
- `src/app/App.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Add a compact library side panel integrated with the current editor and collapsible on
      narrower screens.
- [ ] Implement a pure selector pipeline for search by build name and skill names, filters by
      profession, mode, favorite, and tag, and sorting by updated date, name, or profession pair.
- [ ] Use deterministic tie-breakers and selector tests so result ordering does not depend on array
      insertion accidents.
- [ ] Show saved build name, profession pair, mode, updated date, favorite marker, tags, and a
      neutral placeholder for later freshness status chips.
- [ ] Load a selected saved record into the working draft together with its raw template overlay and
      restored record association.
- [ ] Expose manage actions from the panel without introducing routing or any network dependency.

**Verification:**

- `npm run test:run -- src/app/library-selectors.test.ts src/app/library-panel.test.tsx`
- `npm run typecheck`
- `npm run build`

**Phase Gate:**

The library panel is usable on desktop and narrow screens, and its query behavior is deterministic
under test.

### Phase 6: BW-0906 Library Backup And Restore (~14%)

**Files:**

- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/components/LibraryDialogs.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/library-panel.test.tsx`
- `src/app/App.tsx`

**Tasks:**

- [ ] Export the full library as versioned JSON using the same saved-record and working-draft record
      shapes plus backup export metadata.
- [ ] Import backup text through schema validation and build a preview that reports record counts,
      working draft presence, conflicts, skipped invalid records, and unsupported schema versions.
- [ ] Support `merge` and `replace` restore modes with explicit confirmation for `replace`.
- [ ] Preserve imported local IDs when safe and generate new IDs for merge conflicts with a visible
      restore report.
- [ ] Keep user-authored tags and notes plain-text only and reject any non-plain-data structure that
      falls outside the documented envelope.
- [ ] Leave the current editor usable when backup parsing or restore application fails.

**Verification:**

- `npm run test:run -- src/app/backup-restore.test.ts src/app/library-panel.test.tsx`
- `npm run typecheck`

**Phase Gate:**

Backup and restore are explicit, previewed, conflict-safe, and never destructive without confirmed
user intent.

### Phase 7: BW-0907 Freshness, Validation, Docs, And Closeout (~12%)

**Files:**

- `src/app/editor-selectors.ts`
- `src/app/library-selectors.ts`
- `src/app/components/LibraryPanel.tsx`
- `src/app/components/ValidationPanel.tsx`
- `src/app/App.tsx`
- `README.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/README.md`
- `work/tickets/09-local-library-and-sharing/*.md`
- `work/tickets/09-local-library-and-sharing/EPIC.md`
- `work/sprints/SPRINT-010.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-09-result.json`

**Tasks:**

- [ ] Compare saved and draft catalog-version facts against the current promoted catalog versions
      and surface `current`, `stale`, or `unknown` status without mutating the loaded data.
- [ ] Validate loaded drafts and saved records against current catalogs while preserving unresolved
      or stale facts and avoiding automatic skill replacement.
- [ ] Update `README.md` and `compendium/core-build-editor.md` to remove the EPIC-09 deferral and
      add one durable compendium note that documents the storage key, envelope shape, share-URL
      rules, and backup/restore format.
- [ ] Re-run focused tests across storage, library selectors, sharing, restore, and app integration
      before the final repo-wide verification gate.
- [ ] Close out sprint, ticket, epic, ledger, and manifest records only after code, docs, and tests
      agree on the shipped scope.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/library-selectors.test.ts src/app/backup-restore.test.ts src/app/template-dialogs.test.tsx`
- `npm run build`
- `npm run verify`

**Phase Gate:**

Freshness warnings, documentation, and execution records are aligned, and the sprint is ready to be
marked complete only after `npm run verify` passes.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/app/library-storage.ts` | Create | Single localStorage boundary, v1 envelope parsing/serialization, migration hooks, and typed storage failures. |
| `src/app/library-storage.test.ts` | Create | Covers parse, migrate, invalid data, unavailable storage, and quota failure behavior. |
| `src/app/library-state.ts` | Create | Pure saved-record operations and working-draft association semantics. |
| `src/app/library-state.test.ts` | Create | Proves save/update/save-as-new/duplicate/delete/favorite/tag/note behavior. |
| `src/app/library-selectors.ts` | Create | Deterministic search/filter/sort, profession/mode labels, and freshness chips for library records. |
| `src/app/library-selectors.test.ts` | Create | Covers selector determinism, tie-breaks, tag matching, and skill-name search. |
| `src/app/share-url.ts` | Create | Share URL fragment build/parse helpers and length-cap policy. |
| `src/app/share-url.test.ts` | Create | Covers valid, invalid, oversized, and precedence cases for share URLs. |
| `src/app/backup-restore.ts` | Create | Backup export/import, preview, merge/replace planning, and restore reports. |
| `src/app/backup-restore.test.ts` | Create | Covers invalid backups, conflict handling, replace confirmation inputs, and skipped-record reporting. |
| `src/app/editor-state.ts` | Modify | Add working-draft persistence fields without turning the editor reducer into the whole library store. |
| `src/app/editor-selectors.ts` | Modify | Extend validation and diagnostics to reflect stored catalog freshness and loaded-record warnings. |
| `src/app/template-workflow.ts` | Modify | Reuse exact-source and canonical export decisions for share workflows. |
| `src/app/App.tsx` | Modify | Compose boot order, autosave effects, warning banner, library panel, restore dialogs, and responsive layout. |
| `src/app/components/LibraryPanel.tsx` | Create | Main local-library surface for search, filters, sort, selection, and record actions. |
| `src/app/components/LibraryDialogs.tsx` | Create | Save/update/delete/backup/restore confirmation and preview dialogs. |
| `src/app/components/StorageBanner.tsx` | Create | Non-blocking warnings for storage unavailable, quota, malformed data, or restore/share failures. |
| `src/app/components/TemplateDialogs.tsx` | Modify | Add share URL and copyable template-text actions without changing template-fidelity ownership. |
| `src/app/components/ValidationPanel.tsx` | Modify | Surface stale or unresolved loaded-record warnings beside current validation output. |
| `src/app/App.test.tsx` | Modify | Expand top-level integration coverage for boot order, autosave, library actions, and warnings. |
| `src/app/template-dialogs.test.tsx` | Modify | Verify share controls, fallback behavior, and URL-import safety. |
| `src/app/library-panel.test.tsx` | Create | Covers panel selection, query controls, and responsive/collapse behavior where practical. |
| `src/app/styles.css` | Modify | Layout, collapse behavior, panel styling, status chips, dialogs, and warning-banner states. |
| `README.md` | Modify during closeout | Update shipped scope and remove EPIC-09 from deferred items. |
| `compendium/core-build-editor.md` | Modify during closeout | Update the editor note so persistence and sharing are no longer described as deferred. |
| `compendium/local-library-and-sharing.md` | Create during closeout | Durable storage/share/backup contract note for later epics. |
| `compendium/README.md` | Modify during closeout | Link the new local-library note. |
| `src/domain/**` | Read only by default | Existing framework-neutral build and validation contracts consumed by the app. |
| `src/template-compatibility/**` | Read only by default | Existing skill-template codec and fidelity boundary reused for sharing. |
| `work/tickets/09-local-library-and-sharing/*.md` | Modify during execution | Record ticket evidence, statuses, and closeout notes. |
| `work/tickets/09-local-library-and-sharing/EPIC.md` | Modify during execution | Mark EPIC-09 complete only after all ticket gates pass. |
| `work/sprints/SPRINT-010.md` | Create/modify during execution | Executable sprint record and closeout state. |
| `work/sprints/ledger.tsv` | Modify during execution | Sprint lifecycle tracking. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-09-result.json` | Modify during execution | Required ticket-burn result manifest for the sprint plan. |

## Definition of Done

### Storage Contract

- [ ] One namespaced `localStorage` key and one documented versioned envelope are used for the MVP.
- [ ] Saved records and the working draft preserve semantic `Build` data plus raw template
      overlay/source fidelity and structured catalog-version facts.
- [ ] Invalid, corrupt, unsupported, unavailable, or quota-limited storage falls back to in-memory
      editing with a clear warning.
- [ ] Corrupt local payloads are never auto-deleted.
- [ ] Migration hooks and parse/validation behavior are covered by focused tests.

### Working Draft And Saved Records

- [ ] A valid working draft survives refresh and is restored separately from the saved library.
- [ ] Refresh restore never silently creates a saved build.
- [ ] Users explicitly choose `Update` versus `Save as new`.
- [ ] Duplicate saved builds are allowed and saved-record identity is always local-ID based.
- [ ] Delete is confirmation-protected, and deleting an associated record does not destroy the
      current in-memory draft.
- [ ] Favorite, rename, tags, and short notes survive reload through the storage envelope.

### Sharing, Library UI, And Backup

- [ ] Single-build import/export UX stays template-code based and reuses the existing fidelity
      rules.
- [ ] Share URLs populate the working draft only and never silently save to the library.
- [ ] Oversized or lossy share attempts fall back to selectable template text with a clear reason.
- [ ] The library panel supports deterministic search, filters, sorting, and selection from the
      editor screen.
- [ ] Whole-library backup/restore supports preview, merge/replace confirmation, skipped-record
      reports, and local-ID conflict handling.
- [ ] Backup JSON remains plain data and excludes remote media bytes, screenshots, generated audit
      artifacts, and executable content.

### Freshness, UX, And Safety

- [ ] Saved and draft records show current, stale, or unresolved status against the current promoted
      catalogs without auto-migration.
- [ ] Unknown or stale imported data remains visible and recoverable.
- [ ] Storage/share/restore warnings are explicit and do not make the app unusable.
- [ ] Narrow-screen access to the library remains usable without routing or broken layout.
- [ ] User-authored names, tags, notes, and template inputs are rendered as escaped plain text only.
- [ ] No network/backend dependency, IndexedDB, service worker, analytics, or remote icon/media
      fetch is introduced.

### Verification And Closeout

- [ ] Focused tests cover storage, draft hydration, saved-record actions, library selectors, share
      URLs, backup/restore, and top-level app integration.
- [ ] `npm run build` passes after the panel and again at closeout.
- [ ] `npm run verify` passes as the final repository gate.
- [ ] `README.md`, `compendium/core-build-editor.md`, and the new local-library compendium note
      accurately describe the shipped behavior and deferred scope.
- [ ] Ticket, epic, sprint, ledger, and manifest records agree before completion.
- [ ] No commit is created unless separately requested.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Persisting only the semantic `Build` drops unresolved raw template fidelity | High | High | Make the raw template overlay and source envelope part of every saved-record and working-draft contract from Phase 1 onward. |
| `localStorage` is unavailable or quota-limited in real browsers | Medium | High | Keep one adapter with typed failures, in-memory fallback, and warning-banner coverage under test. |
| Share URL boot behavior overwrites a user's local draft unexpectedly | Medium | High | Give valid share URLs in-session precedence but suspend autosave until the first local mutation or explicit save/update action. |
| Library search and sorting become nondeterministic | Medium | Medium | Keep selectors pure, add stable tie-breakers, and test equal-name, equal-date, and unresolved-label cases directly. |
| Restore replace mode feels destructive or ambiguous | Medium | High | Require preview plus explicit confirmation, report skipped/conflicting records, and never perform silent replacement. |
| Library concerns bloat the existing editor reducer | Medium | Medium | Keep the working draft in `editor-state.ts` and move collection/query/restore concerns into dedicated library modules. |
| Freshness checks mutate or auto-repair stale builds | Medium | High | Treat freshness as diagnostics only in EPIC-09 and preserve stale/unresolved IDs until later explicit revision work. |
| Final verification catches late regressions across UI, storage, and docs | Medium | Medium | Use per-phase tests and `npm run build` gates before the final `npm run verify` run. |

## Security

- Treat template codes, share URLs, backup JSON, saved names, tags, notes, validation messages, and
  raw overlay labels as untrusted plain text.
- Render all user-authored or imported text through normal React escaping. Do not introduce HTML or
  Markdown rendering paths for storage, sharing, or restore content.
- Validate share URL and backup payload shapes and schema versions before applying them to app
  state.
- Keep `localStorage` access behind one adapter and avoid exposing raw thrown exceptions, stack
  traces, or local paths in user-facing messages.
- Do not add network fetches, remote media loading, analytics, or backend upload paths to implement
  sharing or restore.
- Keep clipboard behavior explicit and opt-in only. Copy actions may fail safely, but clipboard
  contents should never be read automatically.
- Treat backup files as local plain-data imports only; no executable code, HTML blobs, or file-path
  trust should be introduced.

## Dependencies

- `SPRINT-009` / `EPIC-08` for the current editor, raw template overlay model, app catalog
  boundary, validation presentation, and template dialogs.
- `SPRINT-006` / `EPIC-05` for skill-template parse/decode/export, exact-source replay, canonical
  encode proof, and chat-wrapper handling.
- `SPRINT-007` / `EPIC-06` for `validateBuild`, `ValidationLocation`, and effective attribute-rank
  helpers used during load-time freshness and validation.
- `SPRINT-004` / `EPIC-03` and `SPRINT-005` / `EPIC-04` for the promoted catalog data and version
  facts saved with draft and library records.
- `SPRINT-002` / `EPIC-01` for attribution, source-policy, and remote-media restrictions that still
  apply to stored or shared data.
- No new npm packages, browser-storage libraries, schema-validation packages, state libraries, or
  networking dependencies are required for this sprint.
- In-sprint dependency order is `BW-0901 -> BW-0902 -> BW-0903 -> { BW-0905, BW-0904 } ->
  BW-0906 -> BW-0907`, with the default execution order `0901, 0902, 0903, 0905, 0904, 0906,
  0907`.

## Open Questions

No open question blocks execution. The sprint should use these defaults:

1. `EditorState` owns only the current working draft plus minimal persistence fields such as
   `associatedRecordId`; saved-record collections, query state, and restore UI state live beside it
   in app-owned library modules.
2. The share URL format uses a fragment with bare template code plus optional mode and enforces a
   conservative cap of about 1,500 characters before falling back to copyable template text.
3. A valid share URL takes precedence over a stored working draft for the current session, but it
   does not arm autosave until the user actually mutates the draft or explicitly saves it.
4. Delete protection uses explicit confirmation for MVP rather than undo history.
5. Closeout should add one durable note at `compendium/local-library-and-sharing.md` and keep
   `README.md` plus `compendium/core-build-editor.md` shorter.
6. `src/domain/**` and `src/template-compatibility/**` stay unchanged unless execution finds a
   narrow public-contract gap that cannot be solved in app code.