# Sprint 010 Intent: Local Library and Sharing

## Seed

Create a ticket-burn sprint from `work/tickets/09-local-library-and-sharing/EPIC.md` for
`EPIC-09 Local Library and Sharing`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-09`
- source_epic_path: `work/tickets/09-local-library-and-sharing/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-010.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-09` and BW-0901 through BW-0907, ledger
sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-09-result.json`.

## Context

- `SPRINT-001` through `SPRINT-009` are completed in `work/sprints/ledger.tsv`; `SPRINT-010` is the
  next sprint ID.
- `EPIC-09` is `ready`, depends on completed `EPIC-08`, and already has seven ready tickets:
  BW-0901 through BW-0907.
- `SPRINT-009` shipped the in-memory single-character editor in `src/app`; persistence, local
  library records, tags, favorites, backup/restore, and share URLs were explicitly deferred here.
- The key inherited invariant is that persistence must preserve the semantic `Build` plus
  EPIC-08's raw template overlay/source data. Persisting only the domain `Build` would lose
  import/export fidelity and unresolved template facts.
- The sprint must plan documentation and traceability updates but must not change implementation
  code during planning.

## Recent Sprint Context

- `SPRINT-006` introduced framework-neutral skill template parse/decode/export behavior under
  `src/template-compatibility`, including exact-source replay and canonical encode/decode-back proof.
- `SPRINT-007` introduced the domain validation engine, validation inputs/results, and effective
  attribute-rank helpers.
- `SPRINT-008` recorded UI reference notes and product presentation guidance in
  `compendium/visual-prior-art.md`.
- `SPRINT-009` integrated the promoted EPIC-03/04 catalogs into a React editor with one app-side
  catalog boundary, deterministic skill search/filtering, an eight-slot skill bar, template
  import/export dialogs, validation presentation, and raw template overlay invariants.

## Relevant Codebase Areas

- `src/app/App.tsx` composes the current editor and will need to initialize storage-backed state,
  show storage/library warnings, and place a library panel without introducing routing.
- `src/app/editor-state.ts` owns `EditorState`, `Build`, raw template overlay state, browser/dialog
  state, and reducer actions. EPIC-09 should extend this conservatively or compose a library state
  beside it.
- `src/app/template-workflow.ts` adapts skill-template import/export and must remain the sharing
  fidelity boundary for single-build exchange.
- `src/app/editor-selectors.ts` owns validation/export policy and should be extended with saved-build
  metadata, freshness, and deterministic library search/filter/sort selectors where appropriate.
- `src/app/components/**` currently contains compact editor panels, dialogs, skill browser/bar, and
  validation UI. New library, save, share, and backup/restore controls should fit this app surface.
- `src/domain/**` remains framework-neutral and should not import React, DOM APIs, browser storage,
  network clients, or app modules. Domain changes should be avoided unless execution proves a plain
  contract gap.
- `src/template-compatibility/**` is the existing skill-template codec boundary and should not gain
  app-local persistence concerns.
- `README.md` and `compendium/core-build-editor.md` currently name local library/sharing as deferred
  EPIC-09 scope and will need closeout updates after implementation.
- `work/tickets/09-local-library-and-sharing/*.md`, `work/sprints/ledger.tsv`, and the ticket-burn
  run manifest must stay status/path consistent.

## Constraints

- Follow project instructions in `AGENTS.md`: keep communication concise and direct.
- Runtime app code may import promoted generated catalogs only through `src/app/catalogs.ts`.
- Runtime code must not import generated manifests, QA reports, source snapshots, Python data
  tooling, wiki APIs, or remote media bytes.
- `src/domain` must remain free of React, DOM/browser APIs, browser storage, network clients, app
  modules, and data scripts.
- Storage must use one namespaced browser `localStorage` key for MVP; IndexedDB, backend sync,
  accounts, hosted sharing, analytics, and service workers are out of scope.
- Corrupt or unsupported local data must not be automatically deleted and must not make the editor
  unusable.
- Working draft autosave is separate from the saved build library; a refresh restore must not
  silently create a saved build.
- Saved-record identity is a local ID, not normalized build equality. Duplicate builds are allowed.
- Share URLs are template-code-first, accountless, and single-build only. Whole-library JSON is only
  for backup/restore.
- Backup JSON must not contain HTML, executable content, remote media bytes, screenshots, generated
  audit artifacts, or source snapshots.
- Final implementation verification should use `npm run verify`, with focused test commands listed
  at phase gates where useful.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-0901 through BW-0907 in dependency order with file-level tasks, phase gates, and verification.
- A versioned local storage contract for saved builds plus the working draft.
- Working draft autosave and restore that preserves unresolved raw template overlay/source facts.
- Explicit saved-build operations: save new, update associated record, save as new, duplicate,
  delete, favorite, rename, tags, and short notes.
- A compact responsive library panel with deterministic search, filters, sorting, and selection.
- Template-code sharing and share URLs that load into the working draft without silently saving.
- Whole-library backup/restore with preview, merge/replace confirmation, skipped-record reports, and
  safe conflict handling.
- Freshness/catalog-version validation on load and closeout docs/ticket status requirements.
- Clear out-of-scope boundaries for backend sync, accounts, hosted sharing, IndexedDB, equipment,
  party/guide state, historical revision analysis, and PWA behavior.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-09 grooming decisions, BW-0901
  through BW-0907 acceptance criteria, and the already-shipped EPIC-08 editor/template behavior.
- Spec/documentation: `work/tickets/09-local-library-and-sharing/EPIC.md`,
  `work/tickets/09-local-library-and-sharing/BW-090*.md`, `README.md`, and
  `compendium/core-build-editor.md`.
- Edge cases identified:
  - storage unavailable or throws on read/write
  - localStorage quota exceeded during draft or library write
  - malformed JSON, unsupported schema version, invalid saved records, invalid working draft
  - preserving unresolved imported professions/attributes/skills and raw overlay entries
  - save/update/save-as-new association semantics
  - duplicate build contents and local ID conflicts during restore merge
  - delete confirmation or undo behavior
  - share URL parse failures, oversized URLs, lossy canonical projection, exact-source replay
  - restore replace requiring explicit confirmation and never deleting corrupt data implicitly
  - catalog-version mismatch warnings without automatic skill replacement
  - narrow-screen library access without broken editor layout
- Testing approach:
  - focused pure tests for storage envelope parsing, migration, validation, serialization, import,
    restore merge/replace, conflict handling, and library selectors
  - reducer/selector tests for draft association, save actions, freshness diagnostics, and URL
    import/export policy
  - React component tests for autosave/restore warnings, library panel flows, save/update/delete,
    share URL controls, backup/restore preview/report, and responsive access where practical
  - source scans for forbidden generated-data or remote-media/browser-network regressions as needed
  - final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium — browser localStorage and template sharing are well-understood,
  but preserving unresolved EPIC-08 raw overlay fidelity through storage/share/restore needs careful
  schema and tests.
- Scope uncertainty: Medium — EPIC-09 is groomed, but it spans storage, UI, sharing URLs, and backup
  restore. The sprint must keep IndexedDB, backend, equipment, party, guide, and account features
  out.
- Architecture uncertainty: Medium — localStorage and app-layer ownership are already decided, but
  the exact module split between storage adapters, library selectors, reducer actions, and UI
  composition should be chosen to fit the existing `src/app` style during implementation.

## Open Questions

1. What is the smallest stable storage schema that preserves `Build`, raw template overlay/source,
   library metadata, draft association, and catalog version facts without coupling storage to UI-only
   browser/dialog state?
2. Should saved-build/library state live inside `EditorState` or beside it at `App.tsx` composition,
   and what reducer boundary keeps tests simple?
3. What URL cap should be conservative enough for share URLs, and when should the UI fall back to
   selectable template text?
4. What delete protection is preferable for MVP: confirmation, undo, or both?
5. Which closeout docs need enduring storage schema/share/backup details versus a short deferred
   scope update?

## Non-Interactive Interview Decision

Interview is skipped under the ticket-burn contract. No high-risk architecture choice blocks
planning because the EPIC already fixes the main architecture decisions: single-character MVP,
localStorage, no backend/account/routing, template-code-first sharing, and versioned JSON only for
whole-library backup/restore.
