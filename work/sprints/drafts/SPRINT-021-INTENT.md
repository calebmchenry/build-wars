# Sprint 021 Intent: Markdown Guide Workspace

## Seed

Create an executable sprint from `work/tickets/20-markdown-guide-workspace/EPIC.md`
for EPIC-20 in noninteractive ticket-burn mode. The authoritative product brief is
`compendium/guide-workspace.md`; read it and all twelve BW-20xx tickets. Also read
`work/sprints/drafts/EPIC-020-INTENT.md` for original product intent, recognizing
that its earlier prohibition on assigning a sprint number applied to backlog
preparation and is superseded by this planning request.

Deliver a rendered Markdown author/read workspace with owned interactive builds,
generic and variant-bound inline skills, catalog insertion/dragging, one history,
safe source Apply, local recovery and portable export. Keep all explicit epic
requirements and out-of-scope boundaries. Prefer a complete, dependency-gated
SPRINT-021 for BW-2001–BW-2012 if executable; flag any necessary split explicitly,
without calling a prototype complete or reserving additional sprint numbers.

## Context / Orientation Summary

- Clean starting HEAD is `bbc162f` (Plan EPIC-20 markdown guide workspace).
  Sprints 001–020 are completed in the ledger; 021 is next. EPIC-20 is ready,
  with twelve backlog tickets and prior epic dependencies completed.
- React 19/TypeScript/Vite app; current `Build` is schema v4. Recent work retired
  prototype equipment, added compact rune/headgear/effect adjustments, expanded
  preview effects and adopted classic Guild Wars colors. Do not copy obsolete
  Build v3 assumptions from SPRINT-020.
- `BuildComposer` and `FocusedSkillCatalog` depend on one `EditorState`.
  `App.tsx` computes tooltip context globally and has an early catalog-error
  return. Guide mode needs explicit target/context and recovery without catalogs.
- `src/domain/guide.ts` is an unpersisted text/build/party scaffold. Workspace and
  persistence currently support build/build-set only. Durable build snapshots
  include Build, PvE budget and raw template facts; use an adapter instead of
  importing application persistence/editor types into the domain.
- Existing strict local storage, dirty/recovery/conflict behavior, template
  boundaries, placement rules, preview selectors and local assets are reusable
  constraints. A real-browser feasibility gate must settle the editor before
  its choice becomes committed implementation architecture.

## Recent Sprint Context

SPRINT-020 completed EPIC-19. Subsequent commits evolved Build to v4, removed
prototype equipment and expanded effects/tooltip previews. EPIC-20 backlog
preparation deliberately created no active sprint. Prior speculative search
epics do not expand the accepted local guide milestone.

## Relevant Codebase Areas

- `src/domain/guide.ts`, `build.ts`, `ids.ts`, `source.ts`, `index.ts` and domain
  validation/attribute-preview/title contracts: semantic document and identities.
- `src/app/editor-state.ts`, `workspace-state.ts`, `build-set-state.ts`,
  `persistence-schema.ts`, `local-storage.ts`: transactions, durable adapters,
  materialization, cloning, fingerprints, schema migration and recovery.
- `src/app/App.tsx`, `components/BuildComposer.tsx`, `FocusedSkillCatalog.tsx`,
  `SkillBar.tsx`, `SkillTooltip.tsx`, `ComposerHeader.tsx`,
  `FocusedAttributeEditor.tsx`, `TitleRankPanel.tsx`, `InlineTemplateCode.tsx`:
  explicit build targeting, prose insertion, context and reusable controls.
- `src/app/drag-payload.ts`, placement helpers, editor/composer/attribute-preview
  selectors, `template-workflow.ts`, `template-files.ts`, `template-import.ts`:
  safe multi-build drag and targeted game-template IO.
- Library selectors/dialogs, backup/restore, build-set/party transfer code and
  existing workspace/persistence/composer tests require exhaustive union audit.
- Proposed guide codec/state/adapter/components/tests should have cohesive
  boundaries; proposed filenames in drafts are recommendations, not existing code.
- `package.json`, `package-lock.json`, `compendium/guide-workspace.md`,
  `compendium/source-policy.md`, sprint/ticket records and execution evidence.

## Constraints

- This invocation is planning only: write assigned planning Markdown artifacts;
  no product code, package edits, dependency installation, implementation, commits,
  recursive planning, skills or sub-agents in model lanes. Work only in the current
  isolated worktree; do not modify `/Users/calebmchenry/code/build-wars`.
- The outer runner owns execution/commits. Preserve dependencies, checklist,
  browser-evidence and validation gates. No manufactured evidence.
- Noninteractive: skip routine interview, record assumptions; escalate only a
  genuinely high-risk unresolved product/architecture choice. Auto-approve an
  internally consistent executable final sprint.
- BW-2001 must compare a small set of maintained editors/parsers using official
  documentation, license, current compatibility, bundle cost and actual-browser
  paragraph/inline mention/editable build/history/round-trip evidence. A candidate
  recommendation is not a proven choice. No generic editor platform.
- Guide owns independent complete Build v4 snapshots. Durable input values,
  overlays and title/effect preferences round-trip; no derived tooltip values or
  redundant authoritative game code. Stable catalog IDs differ from template IDs.
- One chronological bounded history; no unsynchronized editor and build histories.
  Source buffer and last-valid document coexist safely. Unsupported content is
  opaque or recoverable source, never silently stripped.
- Context bindings survive card selection, reorder and rename; fragment paste
  remaps internal identities and cannot accidentally bind to destination IDs.
- No raw HTML/MDX execution, remote image fetch, PvX scraping/copied runtime prose,
  hosted publishing, backend, collaboration, full party embeds or equipment UI.

## Success Criteria

1. All twelve tickets have executable phased tasks, dependencies, concrete files
   and acceptance gates, with no unjustified scope omissions.
2. Feasibility produces a real rendered vertical slice before broad integration.
3. Two variants stay isolated across edits, references, drag, history, targeted
   template IO, source Apply, local persistence and Markdown interchange.
4. Save/Open/reload/mixed backup preserve old documents and recoverable source;
   catalog/storage failures retain user data and visible recovery options.
5. Read view shares the same applied meaning and context without dirtying state.
6. Original example, long-document fixtures, security boundaries, browser matrix
   and regression commands make completion verifiable.

## Verification Strategy

- Unit/golden tests: supported semantic codec round trips; exact opaque segments;
  IDs/escaping/limits/duplicate/conflicting/malicious inputs; full snapshots;
  remapping/context resolution; atomic transactions and history.
- Integration: caret bookmarks, isolated inactive-target placement, source Apply,
  view transitions, autosave/pagehide, named records, mixed migrations and restore,
  unavailable catalogs/storage and existing standalone/template/party behavior.
- Actual browser: paragraph/mention/build feasibility; full brief matrix including
  native pointer drops, keyboard equivalence, focus/IME, both themes, narrow layout,
  200% zoom, long scrolling, save/open/reload/download/import and read navigation.
  Missing browser evidence blocks the affected completion gate.
- At implementation closeout: pinned npm `work/runs/toolchain/node_modules/.bin/npm`
  (npm >=11.10.1; login shell may expose npm 10), full `npm run verify`, and
  `git diff --check`. Ensure npm child scripts also resolve the pinned npm via PATH.
- Supervisor-reported baseline: format, lint, types, 587 Vitest tests, production
  build, 149 ingestion tests and 21 runner tests passed. This is supplied baseline
  context, not newly executed evidence. Planning should only check its artifacts.

## Uncertainty Assessment

- Correctness: Medium — source recovery, raw overlays, paste remapping and context
  require explicit invariants and hostile/unknown input fixtures.
- Scope: Low — detailed brief and twelve tickets define one local author/read
  milestone; implementation volume is substantial and must be phased.
- Architecture: Medium — rich editor bridge is new, but an explicit bounded
  feasibility gate resolves vendor/history concerns without changing product scope.

## Open Questions for Drafts

1. What exact semantic/editable boundary avoids duplicate state and histories?
2. Which candidate editor strategy can demonstrate the required slice, and what
   constitutes a stop/fallback condition if it fails?
3. How should source recovery, limits, snapshots and persistence versions fit the
   current strict envelope without leaving unsupported switch branches?
4. What phasing and validation matrix makes all twelve tickets executable while
   preserving every required actual-browser gate?

## Planning Checklist

- [x] Resolve permission-preserving Codex command set and inspect conventions.
- [x] Orient and write shared intent.
- [x] Receive all available independent drafts.
- [x] Receive cross-critiques of other models' drafts.
- [x] Assess uncertainty; skip routine interview under automation contract.
- [x] Write merge notes and final sprint; audit executable consistency.
- [x] Update ticket planning records and ledger.
- [x] Validate artifacts, auto-approve final sprint and write result manifest.
