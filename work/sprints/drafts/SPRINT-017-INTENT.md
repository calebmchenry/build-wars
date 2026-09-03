# Sprint 017 Intent: Multi-Build Workspace

## Seed

Create a ticket-burn sprint from `work/tickets/16-heroes-and-henchmen/EPIC.md` for
`EPIC-16 Multi-Build Workspace`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-16`
- source_epic_path: `work/tickets/16-heroes-and-henchmen/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-017.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-16` and BW-1601 through BW-1606,
ledger sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-16-result.json`.

## Context

- `SPRINT-001` through `SPRINT-016` are completed in `work/sprints/ledger.tsv`; `SPRINT-017` is the
  next sprint ID.
- `EPIC-16` is `ready`, depends on completed EPIC-08, EPIC-09, EPIC-14, and EPIC-15, and has six
  groomed ready BW tickets from build-set contracts through closeout.
- The current app is a durable single-character editor: `WorkspaceState` owns one `EditorState`,
  local saved-build records, dirty/durability state, storage diagnostics, backup/restore, and share
  workflows.
- A persisted single-build snapshot is `PersistedBuildSnapshot` containing `Build`, `PveBudgetState`,
  and raw template overlay. `Build` already includes skill bar, professions, mode, attributes,
  title-rank overrides, and nullable semantic equipment.
- `EPIC-16` replaces the old hero/henchman catalog direction. No hero, henchman, NPC, portrait,
  AI-behavior, party-slot, or external team-template knowledge is required.

## Recent Sprint Context

- `SPRINT-009` shipped the core single-build editor, app catalog boundary, accessible skill bar,
  browser, validation, and responsive shell.
- `SPRINT-010` shipped the local library and sharing model: one `build-wars:v1` key, working-draft
  autosave, saved build records, dirty guards, backup/restore, share URLs, catalog freshness, and
  storage failure handling.
- `SPRINT-014` added the framework-neutral semantic equipment shell for one `Build`.
- `SPRINT-015` added the user-facing equipment editor and integrated semantic equipment with
  persistence, validation, backup/restore, and omission warnings.
- `SPRINT-016` added per-build title-rank override state, title controls, validation cleanup, and
  backup/share warning behavior.

## Relevant Codebase Areas

- `src/domain/build.ts` defines the single-build contract and should remain the loadout payload used
  inside a build set.
- `src/domain/party.ts` and `src/domain/guide.ts` contain early party/guide placeholders. EPIC-16
  should not reuse `PartyBuild` as the base shape because party semantics are EPIC-17 scope.
- `src/app/editor-state.ts` owns the current single-build reducer and editor UI state.
- `src/app/workspace-state.ts` owns draft/session state, saved build actions, dirty guards,
  snapshot fingerprints, and local library composition.
- `src/app/persistence-schema.ts`, `src/app/local-storage.ts`, `src/app/backup-restore.ts`, and
  associated tests own durable browser-local data.
- `src/app/library-selectors.ts`, `src/app/components/LibraryPanel.tsx`, and
  `src/app/components/LibraryDialogs.tsx` own local library rows, actions, backup, and restore UI.
- `src/app/editor-selectors.ts`, `src/app/equipment-selectors.ts`, and
  `src/app/title-rank-selectors.ts` already compose validation, summaries, skill display,
  equipment summary, and title-rank views for one selected build.
- `src/app/App.tsx` composes the left-column library/controls/validation with one main-column
  active editor. This is the natural host for build-set navigation and selected-loadout editing.
- `README.md`, `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`,
  `compendium/equipment-editor.md`, and a new multi-build workspace compendium note are closeout
  documentation candidates.

## Constraints

- Follow `AGENTS.md`: keep human-facing communication concise and direct.
- This planning run may write planning, ticket, ledger, run-state, and manifest artifacts only. It
  must not modify implementation code or create a commit.
- Use `work/sprints`, not `docs/sprints`, for final and draft sprint artifacts.
- Preserve existing single-build workflows for users who never create a build set.
- Treat a build-set entry as one complete authored loadout: `Build` plus the persisted editor facts
  needed to keep PvE budget, raw template overlays, title ranks, semantic equipment, and notes
  durable.
- Keep `BuildSet` framework-neutral and party-neutral. Party slots, hero names, henchmen, portraits,
  AI notes, team-template import/export, paw-ned2, and party-wide legality are deferred to EPIC-17.
- Reuse EPIC-09 local-first storage, backup/restore, corrupt-data handling, dirty guards, and
  explicit save/update semantics.
- Keep generated data imports behind `src/app/catalogs.ts`; summaries may consume app-owned catalog
  views but must not import generated JSON in leaf components.
- Prefer one active editor with compact persistent summaries for other loadouts. Multi-pane full
  editing is optional only if it remains simple, responsive, and testable.
- No backend, account sync, collaboration, new route, new runtime dependency, or remote media fetch
  is planned.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-1601 through BW-1606 in dependency order with file-level tasks, verification gates, and
  closeout records.
- Framework-neutral build-set contracts with ordered entries, stable entry IDs, labels, optional
  description/notes, lightweight entry kind, selected entry ID, and empty/single/multi/partial
  states.
- App workspace state that keeps one selected loadout wired into the existing editor while safely
  preserving non-selected loadout snapshots and unsaved in-memory edits.
- Local persistence, migration, saved build-set records, backup/restore, corruption recovery, and
  single-build compatibility using existing EPIC-09 storage patterns.
- UI navigation and compact summaries for several loadouts, with accessible selection, add,
  duplicate, remove, reorder, rename, overflow, empty, single-loadout, and narrow-width states.
- Variant workflows with deterministic duplicate, compare, promote, rename, reorder, remove, and
  notes behavior without party semantics.
- Per-loadout validation and aggregate group status that reuses existing `validateBuild` behavior
  without inventing party-wide legality rules.
- Share/export boundaries that keep current skill-template share URLs single-build and add native
  JSON backup/recovery where build sets need durable transfer.
- Docs, tickets, sprint records, ledger, and run manifest that agree on `SPRINT-017`, `EPIC-16`,
  the covered BW tickets, assumptions, deferred scope, and no-code-change planning boundary.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-16 grooming decisions, BW-1601
  through BW-1606 acceptance criteria, existing single-build behavior, and the prior sprint
  contracts for editor, storage, title ranks, equipment, validation, and backup/restore.
- Spec/documentation: `work/tickets/16-heroes-and-henchmen/EPIC.md`,
  `work/tickets/16-heroes-and-henchmen/BW-160*.md`, `work/sprints/SPRINT-009.md`,
  `work/sprints/SPRINT-010.md`, `work/sprints/SPRINT-014.md`, `work/sprints/SPRINT-015.md`,
  `work/sprints/SPRINT-016.md`, `compendium/core-build-editor.md`,
  `compendium/local-library-and-sharing.md`, `compendium/equipment-editor.md`, and current
  app/domain tests.
- Edge cases identified:
  - empty build sets, one-entry sets, missing selected entry, duplicate entry IDs, stale selected ID,
    malformed entry arrays, dangerous keys, over-limit entry counts, and unsupported schema versions
  - switching selected loadouts after unsaved edits to skills, attributes, equipment, title ranks,
    raw template overlays, PvE budget, or notes
  - duplicating a loadout with unresolved raw template facts, semantic equipment, and title
    overrides, then editing one copy independently
  - saving a build set without overwriting the original single-build record or source variant
  - loading an existing single-build record and preserving the familiar one-build editor flow
  - backup/restore containing single builds, build sets, malformed records, ID conflicts, duplicate
    incoming IDs, and optional working drafts
  - compact summaries for unresolved professions/skills/equipment, catalog freshness, invalid
    loadouts, incomplete loadouts, long labels, reordered entries, collapsed entries, and narrow
    widths
  - aggregate validation with invalid, unresolved, incomplete, and catalog-unavailable loadouts
  - share/export controls for active selected loadout versus whole build-set recovery/export
  - storage unavailable, quota failure, conflict, corrupt library, and write-blocked recovery states
- Testing approach:
  - focused domain tests for build-set contracts, fixtures, constructors, validation helpers, empty
    and malformed states
  - app reducer/state tests for selection, mirroring active editor state, add/duplicate/remove,
    reorder, rename, promote, notes, and dirty/durability behavior
  - persistence/local-storage/backup tests for schema migration, saved build sets, working build
    sets, corrupt data, dangerous keys, duplicate IDs, bounds, hydration, backup, restore, and
    single-build compatibility
  - selector/component tests for build-set navigation, compact summaries, aggregate validation,
    variant compare output, keyboard/pointer flows, overflow, and responsive states
  - regression tests for existing single-build save/load, share URL, template import/export,
    equipment editor, title controls, and validation panels
  - final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium - the domain model is straightforward, but state mirroring between
  the active editor and non-selected loadout snapshots needs careful tests.
- Scope uncertainty: Medium - the epic spans domain, reducer, persistence, UI, validation, backup,
  and docs, but the BW tickets are groomed and dependency ordered.
- Architecture uncertainty: Medium - adding build-set persistence is a durable storage-shape change,
  but it extends existing EPIC-09 patterns and does not require external integration.

## Open Questions

Questions for the draft lanes to answer without blocking planning:

1. Should the durable build-set entry payload store a domain `Build` only, a `PersistedBuildSnapshot`,
   or a build-set-specific snapshot type that mirrors existing single-build persistence?
2. Should local library schema version advance for saved build sets, or can optional fields be added
   safely under the current envelope version while still rejecting malformed data?
3. How should the active editor mirror writes back into the selected build-set entry so switching
   loadouts never loses unsaved changes?
4. What is the minimal library UI for saved build sets that preserves current single-build saved
   records without making the left column too dense?
5. Which compact summary fields are necessary for EPIC-16, and which comparison or party-oriented
   fields should be deferred to EPIC-17, EPIC-20, or EPIC-21?
6. What native JSON export/import or backup behavior is needed for build sets beyond the existing
   whole-library backup/restore envelope?
7. How should aggregate validation communicate per-loadout errors, warnings, unresolved state, and
   incompleteness without implying party legality?
