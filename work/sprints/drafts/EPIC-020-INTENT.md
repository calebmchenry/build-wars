# EPIC-20 Intent: Markdown Guide Workspace

## Seed

The user wants Build Wars to make useful Guild Wars builds and their guides easier
to reach than PvX/Fandom. We inspected
<https://gwpvx.fandom.com/wiki/Build:A/any_Dagger_Spammer> and discussed Markdown
with custom annotations for builds/template codes, rune/headgear attribute
bonuses, and inline skill references. The proposed authoring experience keeps the
right-hand skill catalog and replaces the left pane with an Obsidian/Notion-like
document editor. Skills can be dragged into prose or onto embedded build bars.

The current request is to write down and organize the work so
`scripts/ticket-burn.py` can pick it up. Produce a design brief, epic, and concrete
dependency-ordered tickets. Do not implement the feature or run the burn. The
runner owns numbered sprints and ledger updates; this preparation must not create
an active sprint or preassign a sprint number.

## Orientation Summary

- The app is React/TypeScript/Vite. `BuildComposer` already has a left build panel
  and a right `FocusedSkillCatalog`; skill tooltips and previews share selectors.
- The current domain Build is schema v4, with base attributes, skill IDs, title
  overrides, and direct attribute adjustments. The prototype equipment model is
  retired. Reuse current contracts and avoid restoring armor/weapon management.
- Multi-build workspaces use one live editor and durable inactive snapshots.
  Catalog placement and tooltips currently assume that selected build, so guide
  references require explicit context and drops require explicit target identity.
- Persistence supports drafts, strict validation, recovery/conflict behavior,
  complete-document backups, and game template operations. The new document kind
  must not silently discard existing drafts or guide-only metadata.
- EPIC-00 through EPIC-19 are done; SPRINT-020 is completed. EPIC-20 is the next
  available epic. Ticket-burn discovers EPIC.md files and gates on dependencies;
  it subsequently plans numbered sprints itself.

## Recent Context

Baseline HEAD: `f644b25` (expanded assumed boosts and tooltip previews), preceded
by the classic Guild Wars palette and replacement of prototype equipment with
compact attribute controls. Existing uncommitted skill-data/code changes and
`work/ideas.md` edits belong to other work and must be preserved.

## Relevant Codebase Areas

- `src/app/components/BuildComposer.tsx`, `FocusedSkillCatalog.tsx`, `SkillBar.tsx`
- `src/app/App.tsx`, `editor-state.ts`, `workspace-state.ts`, `drag-payload.ts`
- `src/app/skill-bar-actions.ts`, `skill-bar-workflow.ts`, `editor-selectors.ts`
- `src/app/attribute-preview-selectors.ts`, `persistence-schema.ts`, `local-storage.ts`
- `src/domain/build.ts`, `build-set.ts`, `attribute-adjustments.ts`
- `src/domain/guide.ts` is an existing section-based Guide scaffold to evolve;
  current persistence has no guide document kind.
- `compendium/core-build-editor.md`, `multi-build-workspace.md`,
  `attribute-adjustments.md`, `local-library-and-sharing.md`, `source-policy.md`
- `work/tickets/19-composer-attribute-adjustments/EPIC.md` for backlog conventions
- `scripts/ticket-burn.py` for actual selection and noninteractive planning rules

## Product Scope and Defaults

User direction: portable annotated Markdown, a rendered writing experience inside
Build Wars, persistent right catalog while authoring, drag-to-prose and
drag-to-build. Recommendation to carry forward as an executable default: Guide
workspace inside the app, modular editor implementation, self-contained embedded
build snapshots, read view with catalog hidden, explicit stable variant IDs and
skill context. These are planning defaults, not claims of additional user quotes.

Include a bounded first-milestone guide editor and reader: multiple build cards,
normal Markdown prose, skill mentions, direct build edits, contextual tooltips,
keyboard equivalents, coherent undo, Markdown source access/import/export,
durable local save/recovery, and actual-browser acceptance. Use one original
two-variant example guide to verify the workflow. Specify the draft/source/model
ownership and invalid-source behavior rather than maintaining competing copies.

Retain the larger discovery/replacement vision in explicit follow-up scope:
searchable published catalog, PvX intake/source review, hosted publishing, accounts,
collaboration, and cross-guide live links. Do not silently schedule a wholesale
site scraper or hosted community site as part of the editor milestone.

## Constraints

- No product code changes during this preparation; preserve the current dirty tree.
- Domain and Markdown document contracts stay independent of React/editor vendor.
- Preserve authoring metadata separately from derived effective ranks and game
  template codes. Reuse full Build snapshots and unresolved template overlays.
- Support stable IDs, moves/duplication/deletion, dangling references, catalog gaps,
  and unknown annotations without silent loss. Names are display text, not identity.
- Selection context for editing is distinct from persisted prose-reference context.
- Keep catalog usable in a guide with no embedded build; mentioning a skill is not
  governed by that build's skill-bar legality. Slot changes still use existing rules.
- Treat Markdown as inert data: no arbitrary JSX/MDX execution, raw HTML execution,
  automatic remote requests, or asset imports. Use existing approved local assets.
- Use original fixture prose and source links. Existing PvX copied-content policy
  is not authority to copy/publish whole pages; any future intake has its own scope.
- Do not require a separate generic Markdown app, backend, accounts, or full
  equipment editor. Current composer and game-folder workflows must keep working.
- The execution planner can choose a maintained editor after a small feasibility
  check. Do not prematurely bind the backlog to a library or a finalized syntax.

## Success Criteria

- The design brief distinguishes agreed direction, implementation defaults, and
  follow-ups, and supplies defaults for currently unresolved behavior.
- Each required area has a ticket with scope, dependencies, acceptance, and
  meaningful verification. The final ticket requires browser evidence and regression
  coverage, not merely component tests.
- Two variants can be edited independently; drops and tooltips never affect or
  borrow attributes from the wrong variant. Undo includes rich text and build edits.
- Source/visual/save/export round trips preserve supported semantics, extra build
  metadata, reference context, and recoverable unsupported content.
- Actual runner parsing/dry-run recognizes EPIC-20 as the next eligible epic.
- Numbered sprints, ledger, script, app code, generated catalogs, and existing
  unrelated working changes remain untouched by this preparation.

## Verification Strategy

Preparation: use the real ticket-burn parser/selector, verify ticket/epic metadata,
dependency DAG, relative links, exact listed coverage, targeted formatting and
`git diff --check`; run targeted and untargeted dry runs without execution.

Implementation: semantic codec fixtures, migration/recovery tests, target/context
isolation, drag/keyboard/undo integration tests, existing composer/template
regressions, and actual browser flows for writing, reading, import/export, reload,
themes, narrow layout and zoom. Require `npm run verify` at closeout.

## Uncertainty Assessment

- Correctness: medium; contracts for context, copy/move, template ownership,
  unresolved facts and round trips need explicit coverage.
- Scope: low for backlog preparation; the broader discovery platform is a later
  milestone and must remain visible in the brief.
- Architecture: medium; rich editing introduces a new document layer and requires
  a bounded editor integration spike before implementation commits to a framework.

## Questions for Draft Review

1. What is the smallest complete vertical slice that tests the proposed writing
   experience while preserving source portability and correct build semantics?
2. How should source buffers, rich editor transactions, build reducers, persistence,
   selection, and history have one owner without losing unknown annotations?
3. How should skill context be authored/serialized so moving text or selecting a
   different card cannot silently change a guide's stated values?
4. Which ticket boundaries keep the runner executable across multiple sprints?

## Workflow Adaptation

The conversation supplies the product interview. Resolve routine details with
documented defaults; no repeat permission gate is needed for authorized backlog
preparation. Independent drafts/critique feed the final epic and brief instead of
a numbered sprint. The skill weather report was unavailable through web access;
fallback reviewer models are Claude opus-4.8/max and Codex gpt-5.5/xhigh, using
permission-preserving CLI modes. Record reviewer availability honestly.
