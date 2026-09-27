# Markdown Guide Workspace Backlog Draft

## Overview

EPIC-20 adds a first-milestone guide workspace inside Build Wars: portable annotated Markdown, a rendered authoring experience, embedded build cards, inline skill mentions, direct build edits, source import/export, local draft persistence, and a read view. It keeps the current focused composer and game-folder workflows working.

This is backlog preparation for ticket-burn only. The proposed epic should omit `planned_sprint`, should not reserve a numbered sprint, and should not touch the sprint ledger during setup.

## Use Cases

- Author a guide with normal Markdown prose, headings, lists, and links.
- Insert skill mentions from the right catalog into prose by drag/drop and keyboard.
- Add multiple embedded build cards, duplicate/move/delete them, and edit each card independently.
- Drag a catalog skill onto prose as a mention or onto a specific embedded skill bar slot.
- Show skill tooltips using the mention’s explicit build context, or neutral catalog context when no build is referenced.
- Open a read view with the catalog hidden.
- Open source view, import/export Markdown, and preserve unsupported annotations without silent loss.
- Autosave, reload, recover, backup, and restore guide drafts through the local library.
- Verify one original two-variant example guide end to end.
- Defer published catalog search, PvX intake, hosted publishing, accounts, collaboration, and cross-guide live links.

## Architecture

The guide contract should replace the placeholder `src/domain/guide.ts` section model with a versioned, vendor-independent Markdown guide document. React, editor-library types, DOM nodes, and parser implementation details stay out of `src/domain`.

Markdown source is the durable source of truth. The parser creates a projection for rendering, embedded build cards, mentions, diagnostics, and editor transactions. Direct build edits rewrite the affected embedded build block through one guide transaction owner; supported source round trips are canonical, and unsupported source regions are retained as raw inert content.

Embedded build cards store full `PersistedBuildSnapshot` data, including `Build` v4, `attributeAdjustments`, title overrides, PvE budget, and unresolved raw template overlays. Derived effective ranks, game template codes, tooltip text, and catalog records are never persisted.

Every embedded build card has a stable guide build ID. Inline skill mentions store skill identity by ID and optional explicit build-context ID. Selection/focus is editor state only; it never rewrites persisted mention context. Names are display text, not identity.

The app should mirror the existing build-set discipline: one active embedded build editor at a time, inactive cards held as durable snapshots, and targeted transactions for drops or card edits. Drops must carry explicit target identity.

The skills catalog needs a context extraction before guide UI work: browser filters/view state and skill display context should not require the selected composer `EditorState`. A guide with no embedded build can still search and insert skills.

## Implementation

| Ticket | Work | Depends on |
| --- | --- | --- |
| BW-2001 | Guide Contracts, Syntax Spike, And Source Rules | Completed epic dependencies |
| BW-2002 | Markdown Codec And Guide Fixtures | BW-2001 |
| BW-2003 | Guide Persistence And Workspace Document Kind | BW-2001, BW-2002 |
| BW-2004 | Skill Catalog Context Isolation | BW-2001 |
| BW-2005 | Guide Workspace Shell, Read View, And Source View | BW-2002, BW-2003, BW-2004 |
| BW-2006 | Embedded Build Cards And Direct Build Editing | BW-2003, BW-2004, BW-2005 |
| BW-2007 | Skill Mentions, Drops, And Contextual Tooltips | BW-2004, BW-2006 |
| BW-2008 | Guide Transactions, Undo, And Round Trips | BW-2002, BW-2003, BW-2006, BW-2007 |
| BW-2009 | Example Guide, Documentation, And Regression Coverage | BW-2005, BW-2006, BW-2007, BW-2008 |
| BW-2010 | Browser Verification And Closeout | BW-2001 through BW-2009 |

### BW-2001: Guide Contracts, Syntax Spike, And Source Rules

Acceptance:
- Records the first-milestone guide contract in `compendium/guide-workspace.md`.
- Chooses a maintained Markdown parser and rich-editor approach after a small feasibility check.
- Defines the accepted guide syntax for embedded build blocks and skill mentions, or records the exact remaining syntax decision for BW-2002.
- Defines source ownership, invalid-source behavior, caps, stable IDs, dangling references, unknown annotations, and deferred PvX/publishing scope.
- Confirms no MDX, JSX execution, raw HTML execution, runtime remote asset loading, or copied PvX guide prose.

Verification:
- Typecheck any introduced contracts.
- Focused contract fixtures for syntax examples, stable IDs, and malformed source behavior.
- Markdown link review and `git diff --check`.

### BW-2002: Markdown Codec And Guide Fixtures

Acceptance:
- Implements domain/app-neutral guide parsing and serialization around normal Markdown plus Build Wars annotations.
- Supports embedded build snapshots, inline skill mentions, explicit build context, dangling references, unknown annotations, and source diagnostics.
- Round trips supported guide source without losing build metadata, raw template overlays, attribute adjustments, or guide-only metadata.
- Treats malformed embedded build blocks as recoverable diagnostics where possible, never silent deletion.

Verification:
- Vitest codec fixtures for a two-variant original example guide, guide with no builds, duplicate IDs, dangling refs, malformed JSON, unsupported annotations, and canonical serialization.
- Tests prove no derived ranks, tooltip text, or game codes are persisted.

### BW-2003: Guide Persistence And Workspace Document Kind

Acceptance:
- Extends local persistence with a `guide` document kind, using a schema migration that preserves existing build and build-set drafts/records.
- Working drafts, saved records, backup/restore, dirty guards, conflict handling, write-block recovery, and fingerprints include guide documents.
- Unknown future document kinds, dangerous keys, oversized guides, malformed guide snapshots, and invalid embedded snapshots use existing write-block or recovery behavior.
- Existing build, build-set, template import/export, and game-folder Load/Save behavior remains unchanged.

Verification:
- Persistence and workspace reducer tests for v2 migration, guide autosave/reload, saved guide records, backup/restore, corrupt guide recovery, quota/conflict states, and unchanged existing fixtures.
- `local-storage`, `workspace-state`, and `persistence-schema` regression tests.

### BW-2004: Skill Catalog Context Isolation

Acceptance:
- Extracts catalog browser state and skill display context so `FocusedSkillCatalog` can run with a selected build, a guide build card, or neutral context.
- Existing composer surfaces keep the same filters, previews, placement behavior, and tooltip output.
- Guide-neutral catalog mode can search and insert skills without an embedded build or selected loadout.
- Skill display and tooltip selectors accept explicit context and do not fall back to unrelated selected builds.

Verification:
- Focused selector/component tests for single build, build-set entry, party slot, guide build card, and guide with no build.
- Regression tests for current catalog filtering, placement, skill facts, and attribute preview behavior.

### BW-2005: Guide Workspace Shell, Read View, And Source View

Acceptance:
- Adds a guide workspace entry point without replacing the current default composer.
- Authoring view shows the Markdown editor on the left and persistent skill catalog on the right.
- Read view renders the guide with the catalog hidden.
- Source view supports export and import/apply; invalid source stays in the source buffer with diagnostics and does not replace the last valid guide.
- Existing storage banners, theme controls, and dirty guards apply to guide documents.

Verification:
- Component tests for creating/opening a guide, switching author/read/source modes, source apply failure, source apply success, reload, and current composer regression.
- Accessibility checks for focus return, keyboard source actions, and no selected build requirements.

### BW-2006: Embedded Build Cards And Direct Build Editing

Acceptance:
- Guide build cards can be created, duplicated, moved, renamed, and deleted with stable IDs.
- Each card edits professions, mode, attributes, rune/headgear/effect adjustments, title overrides, skill bar, and inline template code through existing reducer contracts where applicable.
- Two variants can be edited independently; switching selected cards snapshots the outgoing editor and hydrates the incoming card without state drift.
- Deleting a build card leaves related skill mentions as visible dangling references instead of rewriting or deleting prose.
- Drops and direct edits target build IDs, not display names or current selection.

Verification:
- Reducer and component tests for two-card independent edits, duplicate IDs, move/delete, stale references, raw overlay preservation, attribute adjustments, title overrides, and existing `SkillBar` regressions.

### BW-2007: Skill Mentions, Drops, And Contextual Tooltips

Acceptance:
- Dragging or keyboard-inserting a catalog skill into prose creates an inline skill mention.
- Dropping a skill onto an embedded build bar edits that card only and uses existing skill-bar legality rules.
- Skill mentions are not governed by the referenced build’s bar legality.
- Mention tooltips use the mention’s explicit build context; if absent, missing, or dangling, they render neutral/unresolved context without borrowing the selected card’s attributes.
- Moving prose or selecting another card does not change mention context.

Verification:
- Drag-payload and keyboard tests for prose insertion, card-slot insertion, invalid payloads, no-build guides, dangling refs, unresolved skills, and variant context isolation.
- Tooltip tests prove effective ranks come from the referenced card only.

### BW-2008: Guide Transactions, Undo, And Round Trips

Acceptance:
- One guide transaction owner coordinates rich text edits, source apply, build edits, drops, and persistence fingerprints.
- Undo/redo covers prose edits, mention insertion, build card edits, card moves, and mixed text/build sequences coherently.
- Visual edit -> source export -> source import -> visual edit preserves supported semantics and recoverable unsupported content.
- Undo history remains ephemeral and is not persisted as guide data.

Verification:
- Integration tests for Ctrl/Cmd-Z and redo across text edits, skill mentions, skill bar edits, build duplication, source apply, and reload after saved state.
- Round-trip fixtures comparing semantic projections and persisted snapshots.

### BW-2009: Example Guide, Documentation, And Regression Coverage

Acceptance:
- Adds one original two-variant example guide fixture with source links only; no copied PvX/Fandom guide prose, ratings, usage notes, or page bodies.
- Updates `core-build-editor`, `multi-build-workspace`, `local-library-and-sharing`, `source-policy`, and new guide docs with the implemented behavior and deferred discovery/publishing scope.
- Existing composer, template, build-set, party, attribute adjustment, and local-library tests remain green.

Verification:
- Focused guide test suite plus affected existing suites.
- Documentation link/path review, source-policy audit, `npm run test:run`, and `git diff --check`.

### BW-2010: Browser Verification And Closeout

Acceptance:
- Real browser evidence covers authoring, read view, source import/export, reload, two variants, drag-to-prose, drag-to-build, keyboard insertion, undo/redo, dangling references, no-build guide catalog use, both themes, narrow layout, and 200% zoom.
- `npm run verify` and `git diff --check` pass.
- Ticket-burn dry-run recognizes EPIC-20 as eligible, with dependency order intact.
- Runner-owned sprint, ticket, epic, evidence, and manifest updates are accurate; no required browser item is marked complete without evidence.

Verification:
- `npm run verify`.
- `python3 scripts/ticket-burn.py EPIC-20 --dry-run`.
- Actual browser evidence matrix with browser name, viewport, scenario, and result/screenshots.

## Files Summary

Likely new files:
- `work/tickets/20-markdown-guide-workspace/EPIC.md`
- `work/tickets/20-markdown-guide-workspace/BW-2001-*.md` through `BW-2010-*.md`
- `compendium/guide-workspace.md`
- `src/domain/guide.ts` or adjacent `guide-markdown.ts`
- `src/app/guide-state.ts`, `guide-codec.ts`, `guide-selectors.ts`
- `src/app/components/GuideWorkspace.tsx`, `GuideEditor.tsx`, `GuideBuildCard.tsx`, `GuideReader.tsx`, `GuideSourceDialog.tsx`
- Focused guide fixture and test files under `src/domain` and `src/app`

Likely updated files:
- `src/app/App.tsx`
- `src/app/workspace-state.ts`
- `src/app/persistence-schema.ts`
- `src/app/local-storage.ts`
- `src/app/editor-selectors.ts`
- `src/app/attribute-preview-selectors.ts`
- `src/app/drag-payload.ts`
- `src/app/skill-bar-workflow.ts`
- `src/app/components/FocusedSkillCatalog.tsx`
- `src/app/components/SkillBar.tsx`
- `src/app/styles.css`
- `compendium/core-build-editor.md`
- `compendium/multi-build-workspace.md`
- `compendium/local-library-and-sharing.md`
- `compendium/source-policy.md`
- `package.json` only if BW-2001 approves editor/parser dependencies

Files not touched during backlog preparation:
- Product code
- Generated catalogs
- Numbered sprint files
- `work/sprints/ledger.tsv`

## Definition of Done

- EPIC-20 and BW-2001 through BW-2010 exist as dependency-ordered backlog tickets with no reserved sprint.
- Guide authoring, reading, source import/export, local save/reload, and browser recovery work for an original two-variant guide.
- Skill mention context, card editing, drops, and tooltips never borrow state from the wrong variant.
- Existing composer, build-set, party, attribute adjustment, template, and local-library workflows keep working.
- Unsupported Markdown annotations and malformed-but-recoverable guide content are visible and preserved, not silently discarded.
- Security constraints are enforced for Markdown rendering, source import, links, images, drag payloads, and embedded JSON.
- `npm run verify`, `git diff --check`, ticket-burn dry-run, and actual-browser evidence all pass.

## Risks

- Rich editor integration could fight the current reducer/persistence architecture.
- Source/projection divergence could lose unknown annotations or guide-only metadata.
- Tooltip and drop behavior could accidentally use selected build context instead of explicit guide references.
- Local storage migration could write-block legitimate existing drafts if schema handling is too strict.
- Scope could expand into PvX scraping, hosted publishing, accounts, or generic Markdown-app work.
- New dependencies may add bundle weight or unsafe Markdown rendering defaults.

## Security

Markdown is inert data. Do not execute JSX, MDX, raw HTML, scripts, event handlers, or imported assets.

Render Markdown through a whitelist AST-to-React path or equivalent safe renderer. Escape raw HTML as text or show it as unsupported source. Markdown images should not trigger automatic remote requests; render them as blocked placeholders or explicit user-activated links unless a later asset ticket approves local assets.

External links are user-activated anchors with safe new-context attributes. `bw-skill:` or equivalent internal annotations are parsed as data, not browser navigation.

Embedded build JSON must pass bounded validators, reject dangerous keys, preserve unresolved supported facts, and write-block malformed future contracts rather than dropping data.

Drag payloads remain opaque internal JSON under an internal MIME type and must include explicit target identity for guide build drops.

## Dependencies

Proposed EPIC-20 depends on completed Build Wars foundations, especially:
- EPIC-01 source policy and QA
- EPIC-03 professions/attributes
- EPIC-04 skills catalog
- EPIC-05 template compatibility
- EPIC-06 validation
- EPIC-08 core editor
- EPIC-09 local library and sharing
- EPIC-16 multi-build workspace
- EPIC-18 focused composer
- EPIC-19 attribute adjustments

Runtime dependency choices are deferred to BW-2001. Current dependencies are React, Vite, TypeScript, Vitest, and the existing Guild Wars template package; any Markdown/editor package must be selected, justified, and tested inside the ticket.

No backend, account system, hosted publishing, crawler, community import, or full equipment editor is required.

## Open Questions

- Which maintained rich editor and Markdown parser best satisfy source round trips, annotations, accessibility, and small bundle impact?
- What exact annotation syntax should BW-2001 freeze for build blocks and skill mentions?
- What size caps should apply to guide source, embedded build count, and mention count?
- Should browser evidence be manual, Playwright-backed, or both if a new dev dependency is approved?