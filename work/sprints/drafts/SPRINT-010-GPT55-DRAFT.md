---
id: SPRINT-010
title: Local Library and Sharing
status: draft
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
---

# Sprint 010: Local Library and Sharing

## Overview

This sprint turns the EPIC-08 in-memory single-character editor into a local-first editor with a working draft, explicit saved-build library, template-code sharing, share URLs, whole-library backup/restore, and catalog-freshness warnings.

The architecture separates active editor state from persisted snapshots and library workflow state. Persisted data must preserve both the semantic `Build` and EPIC-08 raw template overlay/source data. `src/domain` remains storage-free, and `src/template-compatibility` remains the skill template codec boundary.

Out of scope: IndexedDB, backend sync, accounts, auth, analytics, hosted sharing, short links, service workers, PWA behavior, parties, guide records, folders, historical revision analysis, automatic stale-skill replacement, and generated-data pipeline changes.

## Use Cases

1. Recover a working draft after browser refresh without creating a saved record.
2. Save the current draft intentionally as a named local record.
3. Choose explicitly between updating an associated saved record and saving as new.
4. Duplicate, rename, favorite, tag, note, and delete saved records.
5. Search saved builds by build name or skill name.
6. Filter by profession, mode, favorite, and tag; sort by updated date, name, or profession pair.
7. Load a saved record without losing unresolved raw template facts.
8. Share a single build through Guild Wars/Reforged skill template codes.
9. Open a share URL into the working draft without silently saving it.
10. Export and restore the whole library through versioned JSON with preview and reports.
11. Handle unavailable storage, malformed JSON, unsupported versions, and quota errors safely.
12. Show stale/unresolved catalog warnings without automatic migration.

## Architecture

`src/app/library*` should own storage contracts, library reducer state, selectors, backup/restore, freshness views, and localStorage access.

Recommended split:

- `src/app/library-types.ts`: serializable envelope, saved record, draft, snapshot, diagnostics, restore preview/report contracts.
- `src/app/library-storage.ts`: `build-wars:v1` key, schema version, parse/migrate/validate, serialize, localStorage adapter, backup helpers.
- `src/app/library-state.ts`: pure library reducer/actions for draft association, saved-record operations, storage status, restore flow.
- `src/app/library-selectors.ts`: deterministic search/filter/sort, facets, freshness summaries, save/share/restore derived views.
- `src/app/library-fixtures.ts`: valid, stale, unresolved, invalid, duplicate, and conflict fixtures.
- `src/app/share-url.ts`: template-code-first share URL encode/decode and size-cap helpers.

The persisted v1 envelope should include `schemaVersion`, `storageKey`, `updatedAt`, `savedBuilds`, `workingDraft`, and metadata. Each saved record includes local `id`, `name`, timestamps, `tags`, `favorite`, `notes`, and a persisted snapshot. Each snapshot includes `Build`, `PveBudgetState`, `RawTemplateOverlay`, catalog-version facts, and optional validation timestamp.

Persisted snapshots must exclude browser filters, dialog open state, tooltip state, drag state, keyboard placement, transient messages, selected slot focus, and implementation-only counters.

Draft semantics:

- autosave writes only the working draft;
- save new creates and associates a saved record;
- update requires an existing association;
- save as new creates a new association;
- template/share import clears saved-record association;
- duplicate does not change the active draft unless loaded;
- saved-record identity is local ID, not build equality or template wrapper name.

Share URLs are template-code-first and single-build only. They may include an optional display name, but must exclude tags, notes, favorites, local IDs, backup metadata, party data, guide data, and whole-library JSON.

Backup/restore uses versioned JSON. Restore must preview counts, skipped records, conflicts, ID remaps, draft presence, and merge/replace impact before apply.

## Implementation

### Phase 1: BW-0901 Versioned Local Storage Contracts

Define the storage key, v1 contracts, parse/migrate/validate helpers, localStorage adapter, failure diagnostics, and storage fixtures. Gate: valid data round-trips, invalid data is reported, and corrupt payloads are not deleted.

### Phase 2: BW-0902 Working Draft Autosave

Initialize from a valid stored draft, autosave durable snapshots after meaningful editor changes, skip invalid drafts safely, and surface storage warnings. Gate: refresh restores the draft without creating a saved record.

### Phase 3: BW-0903 Saved Build Record Actions

Implement save new, update, save as new, duplicate, delete protection, favorite, rename, tags, notes, deterministic ID/timestamp helpers, and draft association. Gate: all saved-record actions survive reload.

### Phase 4: BW-0904 Library Panel Search, Filters, Sorting, And Selection

Add a compact responsive library panel with deterministic search/filter/sort, metadata display, freshness summary, empty/no-result states, and load-to-draft behavior. Gate: saved records are findable and selectable without routing or network dependencies.

### Phase 5: BW-0905 Template Code Sharing And Share URLs

Reuse `template-workflow.ts`, add share URL helpers, define a conservative URL cap, import URLs into the working draft only, and provide selectable text fallback. Gate: single-build sharing follows existing template fidelity policy.

### Phase 6: BW-0906 Library Backup And Restore

Export whole-library JSON, validate imports, preview restore impact, implement merge/replace with confirmation, remap ID conflicts, and report skipped records. Gate: users can recover the library safely.

### Phase 7: BW-0907 Freshness, Validation, Docs, And Closeout

Store catalog-version facts, derive freshness warnings, validate loaded records against current catalogs, update README/compendium/sprint/ticket/ledger/run records during execution closeout, and run `npm run verify`. Gate: EPIC-09 is documented, traceable, and verified.

## Files Summary

| Path | Planned Action |
| --- | --- |
| `src/app/library-types.ts` | Add storage/library contracts. |
| `src/app/library-storage.ts` | Add schema, migration, validation, localStorage, backup helpers. |
| `src/app/library-state.ts` | Add library reducer/actions. |
| `src/app/library-selectors.ts` | Add search/filter/sort, facets, freshness, restore views. |
| `src/app/library-fixtures.ts` | Add test fixtures. |
| `src/app/share-url.ts` | Add share URL helpers. |
| `src/app/components/LibraryPanel.tsx` | Add saved-build panel. |
| `src/app/components/LibraryDialogs.tsx` | Add save/delete/backup/restore dialogs. |
| `src/app/components/ShareControls.tsx` | Add or fold into `TemplateDialogs.tsx`. |
| `src/app/App.tsx` | Compose editor/library state, restore/share startup, warnings. |
| `src/app/editor-state.ts` | Modify only for minimal snapshot/action support if needed. |
| `src/app/editor-selectors.ts` | Integrate freshness/saved-record views where appropriate. |
| `src/app/template-workflow.ts` | Reuse/extend for share policy. |
| `src/app/styles.css` | Add library, dialog, warning, responsive styles. |
| `src/app/*test*.ts[x]` | Add focused coverage. |
| `src/domain/**` | Avoid changes. |
| `src/template-compatibility/**` | Avoid codec changes. |
| `README.md` | Closeout docs. |
| `compendium/core-build-editor.md` | Closeout architecture docs. |
| `work/sprints/SPRINT-010.md` | Execution closeout only. |
| `work/tickets/09-local-library-and-sharing/*.md` | Execution closeout only. |
| `work/sprints/ledger.tsv` | Execution closeout only. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-09-result.json` | Execution closeout only. |

## Definition of Done

- One documented `localStorage` key stores a versioned envelope.
- Storage parse, migration, validation, corrupt-data, unsupported-version, invalid-record, unavailable-storage, and quota-error paths are tested.
- Working draft autosave preserves `Build`, `pveBudget`, raw template overlay/source facts, unresolved IDs, and catalog-version facts.
- Autosave never creates saved records.
- Saved operations cover save new, update, save as new, duplicate, delete protection, favorite, rename, tags, and notes.
- Library panel supports deterministic search, filters, sorting, selection, empty/no-result states, and responsive access.
- Template-code sharing reuses EPIC-05/08 fidelity policy.
- Share URLs import into the working draft only and have oversize/lossy fallbacks.
- Backup/restore supports preview, merge, replace, conflict remap, skipped-record reports, and explicit confirmation.
- Loaded records validate against current catalogs and show stale/unresolved warnings without automatic replacement.
- README, compendium, sprint, ticket, ledger, and run-manifest closeout records are synchronized during execution.
- Final `npm run verify` passes.

## Risks

| Risk | Mitigation |
| --- | --- |
| Persisting full `EditorState` saves brittle UI state. | Persist explicit snapshots only. |
| Raw template overlay/source data is lost. | Centralize snapshot conversion and test unresolved fixtures through every workflow. |
| Library and editor reducers become tangled. | Keep `LibraryState` beside `EditorState` unless a smaller tested extension is clearly better. |
| Autosave overwrites share-URL import. | Define startup precedence and test it. |
| Corrupt storage is accidentally deleted. | Never rewrite/delete corrupt payloads automatically. |
| Save/update semantics are unclear. | Model `associatedSavedBuildId` explicitly. |
| Restore overwrites data unexpectedly. | Require preview, confirmation, deterministic remap, and report. |
| Freshness warnings become migration policy. | Preserve stale data and defer replacement logic to EPIC-21. |

## Security

All persistence remains local in browser `localStorage`. No backend, telemetry, auth, analytics, or sync is introduced.

Imported backup JSON must be parsed as data only. Names, tags, notes, and diagnostics must not render as HTML.

Share URLs must exclude local IDs, tags, notes, favorite state, backup metadata, and whole-library JSON.

Runtime app code must continue importing promoted generated catalogs only through `src/app/catalogs.ts`; no generated manifests, QA reports, source snapshots, data scripts, wiki APIs, or remote media bytes may enter runtime.

## Dependencies

- Completed `SPRINT-009` / `EPIC-08` editor and raw template overlay invariants.
- Completed EPIC-05 template compatibility APIs and `@buildwars/gw-templates@1.1.1`.
- Completed EPIC-06 validation APIs.
- Completed EPIC-03/04 promoted runtime catalogs through `src/app/catalogs.ts`.
- React, Vite, Vitest, TypeScript, and browser `localStorage`.
- `npm run verify`.

No new runtime dependency is planned.

## Open Questions

1. Should `LibraryState` live beside `EditorState`, or should `EditorState` gain association fields?
   Sprint default: keep `LibraryState` beside `EditorState`.
2. Should delete protection use confirmation, undo, or both?
   Sprint default: confirmation.
3. What share URL parameter names and cap should ship?
   Sprint default: simple query parameter contract with one documented conservative cap.
4. Should backup restore include the working draft by default?
   Sprint default: export it when present, preview it explicitly, and restore it in replace mode only after confirmation.
5. How much freshness state should be stored versus derived?
   Sprint default: store catalog-version and last-validated facts; derive current warnings.
6. Should invalid records in an otherwise valid envelope be hidden or shown as broken rows?
   Sprint default: skip editable rows, report diagnostics, preserve original payload.
7. Can share URLs preserve unresolved raw template facts after semantic edits?
   Sprint default: only when existing template workflow proves exact replay or canonical representation.
8. Should closeout docs stay in `compendium/core-build-editor.md` or move to a new compendium note?
   Sprint default: update `core-build-editor.md` unless storage details become too large.