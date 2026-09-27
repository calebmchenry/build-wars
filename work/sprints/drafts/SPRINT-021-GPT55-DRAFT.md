# SPRINT-021: Markdown Guide Workspace

## Overview

Deliver EPIC-20 as one executable sprint, covering BW-2001 through BW-2012, with a mandatory feasibility stop after BW-2001. If the editor feasibility gate fails, stop before broad integration, record the exact blocker, and leave the epic incomplete rather than treating a prototype as delivered. If the gate passes, continue through the full local author/read guide milestone without reserving another sprint number.

This sprint creates a rendered Markdown guide workspace where authors can write prose, insert multiple self-contained Build v4 variants, reference skills inline with generic or variant-bound context, drag skills into prose or targeted build slots, edit safe Markdown source, save/reopen locally, export/import a portable guide, and read the applied guide without the authoring catalog.

Observed code state during this drafting pass:

- `src/domain/guide.ts` is only a scaffold with text/build/party sections and no persisted guide contract.
- `src/app/workspace-state.ts` and `src/app/persistence-schema.ts` currently model persisted documents as `build` or `build-set` only.
- `EditorState` owns one active `Build`, PvE budget, raw template overlay, catalog filters, drag state and template dialogs.
- `BuildComposer`, `FocusedSkillCatalog`, `SkillBar`, `InlineTemplateCode`, selectors and top-level tooltip logic are focused on the active editor, not explicit guide card targets.
- `src/app/drag-payload.ts` carries only browser skill or slot index, which is insufficient for multiple embedded builds.
- `App.tsx` returns an early catalog-error shell, which must be changed for guide recovery/export without catalogs.
- No browser or test evidence was produced by this draft; all verification below is future implementation work.

Assumptions recorded for execution:

- Routine product choices are noninteractive and follow `compendium/guide-workspace.md`.
- The guide owns complete durable build snapshots; it does not live-link library records.
- Current game template Load/Save remains build-specific and becomes explicitly card-targeted in guide mode.
- Public discovery, PvX intake, hosted publishing, collaboration, backend sync, full party embeds and restored equipment UI remain out of scope.

## Use Cases

1. Author starts a guide, writes rendered Markdown prose, inserts two named dagger-themed builds, edits each card's skills, ranks, rune/headgear bonuses, title overrides and supported effect assumptions, then saves locally.
2. Author drags a catalog skill into prose and gets a generic inline skill reference without mutating a build; the same catalog skill dropped onto a visible slot applies existing placement rules to that exact card.
3. Author drags a skill from one build card to another and copies it into the target, while dragging from a build bar into prose creates a reference bound to the source build.
4. Author mentions the same skill generically and under two different build contexts; tooltips keep their correct mode, ranks, title and effect assumptions even after selecting another card.
5. Author opens source, makes invalid or unsupported Markdown changes, sees diagnostics, keeps the last-valid guide intact, exports the raw draft separately if needed, and applies only when the semantic guide parses safely.
6. User saves, reloads, opens a named guide, restores from backup, exports Markdown, reimports Markdown and reads the guide without losing embedded builds, unresolved facts, source metadata, context bindings or recoverable source.
7. Reader uses read mode to navigate headings and variant anchors, inspect build summaries and skill tooltips, expand details, copy the correct game template, and return to editing without dirtying the document.

## Architecture

### Semantic Boundary

Add a framework-neutral guide document model in the domain layer. It owns metadata, block/inline nodes, guide-local build IDs, stable catalog skill IDs, explicit reference context, opaque raw content and versioned limits. It must not import React, editor-vendor types, app persistence, catalog views or `EditorState`.

The domain guide model stores authored facts, not derived tooltip values. Embedded builds are represented through a durable snapshot adapter that preserves the current `PersistedBuildSnapshot` facts: `Build` schema v4, PvE budget and raw template overlay. Base allocations, rune/headgear adjustments, title-rank overrides and supported assumed-effect preferences remain explicit inputs.

### App Runtime Boundary

Introduce guide runtime state beside the existing build and build-set documents. Follow the build-set precedent of one active `EditorState` plus inactive snapshots, but make guide selection and insertion state separate from persisted reference context. Card selection materializes a card for editing; it never rewrites inline reference bindings or generic context.

All semantic edits flow through guide transactions and one bounded chronological history. Vendor editor changes, build reducer results, slot placement, source Apply, duplicate/delete/reorder and import actions become guide transactions. Selection, hover, catalog filtering, view mode, collapse state and read navigation are UI state and do not dirty the guide.

### Editor And Codec Boundary

Candidate default, subject to the real BW-2001 feasibility gate:

- Rendered editor candidate: Lexical with a small adapter and custom inline/build nodes.
- Fallback candidates for BW-2001 comparison: ProseMirror/Tiptap and one lower-level ProseMirror configuration.
- Parser/serializer candidate: Markdown AST pipeline with explicit custom directive/fenced-block support; exact packages are not committed until BW-2001 verifies official docs, license, React/Vite compatibility, accessibility, bundle cost and browser behavior.

Candidate portable syntax, subject to BW-2001/BW-2002:

- Markdown dialect: CommonMark-compatible blocks for paragraphs, headings, emphasis, strong, ordered/unordered lists, links, blockquotes, inline code and fenced code.
- Metadata: YAML front matter with `bwGuide: 1`, title, optional summary, tags and source references.
- Inline skill mention: `:bw-skill[Death Blossom]{skill=1197 context=generic}` or `:bw-skill[Death Blossom]{skill=1197 build=gb-moebius}`. The label is fallback display text; the catalog ID is authoritative.
- Build embed: a fenced `buildwars-build` block containing JSON for a guide-local build ID, label and durable snapshot. Template-only shorthand is accepted as input, but once edited or exported as a full guide the authoritative payload is the snapshot plus preserved original template source facts, not conflicting parallel values.
- Unknown directives and unsupported constructs stay inert and exact when safe, or force recoverable source mode when safe round-trip is not possible.

Candidate limits, subject to BW-2001:

- Source size: 1 MiB per guide.
- Builds: 32 per guide.
- Skill references: 4,000 per guide.
- Parsed nodes: 8,000 with max nesting depth 16.
- History cap: 100 meaningful guide transactions, with typing grouped by editor adapter policy.
- Over-limit input becomes recoverable source with deterministic diagnostics; it is not partially applied.

### Persistence Boundary

Extend the strict local library envelope with a versioned `guide` persisted document kind. Audit every branch that assumes build/build-set: parse, migration, clone, fingerprint, selected preview, save/update/load/duplicate/delete, working drafts, backup/restore, library selectors, storage write results, dirty guard and App hydration. Migration must preserve existing build/build-set records and must not write on read.

### Rendering Boundary

Authoring and read mode share semantic guide nodes and build/skill projection helpers. Read mode hides mutation controls and the catalog while preserving contextual tooltips, compact build cards, template copy, headings, anchors, collapse state and safe links.

## Implementation

### Phase 0: BW-2001 Contracts And Feasibility Gate

Files:

- `compendium/guide-workspace.md`
- New `compendium/guide-workspace-contract.md` or an equivalent decision-record section in the existing brief
- Temporary feasibility code under `src/app/guide-feasibility.*` or deleted/absorbed before closeout
- `package.json` and `package-lock.json`, only after the gate justifies a dependency
- Focused feasibility tests near the future guide/editor adapter

Tasks:

- Audit current `src/domain/guide.ts`, `src/domain/build.ts`, `src/domain/ids.ts`, `src/domain/source.ts`, `src/app/editor-state.ts`, `workspace-state.ts`, `persistence-schema.ts`, `local-storage.ts`, `App.tsx`, `BuildComposer.tsx`, `FocusedSkillCatalog.tsx`, `SkillBar.tsx`, `SkillTooltip.tsx`, template workflow/files, drag payloads and existing tests.
- Freeze a contract for Markdown dialect, version marker, annotation grammar, ID namespaces, metadata fields, template-versus-build authority, escaping, limits, recoverable over-limit behavior, source Apply, history ownership, insertion bookmarks and explicit drop targets.
- Compare a small set of maintained editor/parser choices using official documentation, license, React 19/Vite compatibility, accessibility, bundle impact, Markdown fidelity and actual browser behavior.
- Build a bounded vertical slice: one paragraph, one atomic inline skill reference, one editable build embed, keyboard focus through boundaries, one shared undo sequence and semantic source round-trip.
- Record chosen approach and rejected alternatives. A candidate recommendation without the browser slice does not pass BW-2001.

Gate:

- Continue only if the slice demonstrates typing, embed editing, shared undo, focus retention and semantic round-trip in an actual browser.
- If no candidate passes, stop the sprint, document the exact blocker and leave BW-2001/EPIC-20 incomplete.

### Phase 1: BW-2002 Guide Model And Markdown Codec

Files:

- `src/domain/guide.ts`
- New `src/domain/guide-codec.ts`
- New `src/domain/guide-validation.ts`
- New `src/domain/guide-remap.ts`
- `src/domain/index.ts`
- New domain fixtures under `src/domain/__fixtures__` or existing fixture conventions
- New `src/domain/guide*.test.ts`
- New app adapter file such as `src/app/guide-build-adapter.ts`

Tasks:

- Replace the scaffold with versioned guide types: guide ID, metadata, block nodes, inline nodes, build embed nodes, skill reference nodes, source locations, raw opaque nodes and diagnostics.
- Add guide-local ID generation/validation helpers with namespaces distinct from runtime catalog IDs and game-template IDs.
- Add a durable build snapshot adapter that maps between domain guide embeds and app `PersistedBuildSnapshot` without importing `EditorState` or React into the domain.
- Implement parse/serialize/parse semantic equivalence for supported Markdown, metadata, inline references, build embeds, template shorthand, title/effect preferences, raw overlays, source metadata and opaque content.
- Diagnose duplicate IDs, conflicting template/payload fields, malformed JSON, unknown skill/build IDs, unsupported versions, unsafe links and oversized/deep documents.
- Implement pure helpers for duplication, deletion impact, fragment paste, cross-document remapping and explicit unresolved external references.

Gate:

- Golden tests cover plain prose, two variants, incomplete and unresolved builds, rich metadata, escaping, code fences containing annotation-looking text, unknown syntax, conflicting fields, duplicate IDs, missing IDs, hostile HTML/URLs, deep/oversized inputs and exact opaque-content preservation.
- Domain codec tests assert authored meaning, not vendor editor JSON or byte-identical ordinary whitespace.

### Phase 2: BW-2003 Guide Workspace Transactions And History

Files:

- New `src/app/guide-state.ts`
- New `src/app/guide-history.ts`
- New `src/app/guide-selectors.ts`
- New `src/app/guide-insertion.ts`
- `src/app/workspace-state.ts`
- `src/app/editor-state.ts`, only for reusable editor/build actions if needed
- `src/app/workspace-state.test.ts`
- New `src/app/guide-state.test.ts`

Tasks:

- Extend `WorkspaceDocument` with `guide` runtime state while preserving standalone build and build-set behavior.
- Model active build card ID, inactive snapshots, document editor state, insertion bookmarks, recoverable source draft, last-valid guide and mode (`edit`, `source`, `read`) separately from the persisted guide document.
- Route prose edits, build reducer results, build insert/copy/duplicate/delete/reorder/rename, template import, source Apply and fragment paste through atomic guide transactions.
- Add one chronological bounded undo/redo history spanning prose, slot edits, attribute changes, deletion, source Apply and imports. Disable or bridge vendor-local history so it cannot disagree with guide history.
- Define typing grouping and gesture grouping. UI-only changes do not create history entries or dirty fingerprints.
- Implement deletion impact diagnostics for referenced builds, independent duplicate snapshots, undo restoration and cross-document fragment remapping.
- Preserve insertion bookmarks across catalog focus, no selected build, document switches and source-mode transitions; stale bookmarks become invalid instead of redirecting to a selected card.

Gate:

- Reducer tests prove two variants remain isolated across repeated switching, editing and materialization.
- Undo/redo restores a prose -> slot -> attribute -> delete sequence with IDs, references, raw overlays and source draft state intact.
- Dirty fingerprints ignore selection/filter/view changes and change for every authored transaction.
- Existing standalone build, build-set and party workspace tests still pass.

### Phase 3: BW-2004 Rendered Editor And Catalog Shell

Files:

- New `src/app/components/GuideWorkspace.tsx`
- New `src/app/components/GuideEditor.tsx`
- New `src/app/components/GuideToolbar.tsx`
- New `src/app/components/GuideCatalogShell.tsx`
- `src/app/components/FocusedSkillCatalog.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/App.tsx`
- `src/app/styles.css`
- New `src/app/guide-editor-adapter.ts`
- New `src/app/guide-editor.test.tsx`

Tasks:

- Add accessible entry points for standalone composer and Guide workspace. Switching surfaces uses existing dirty guard behavior and never replaces a draft silently.
- Bind the rendered editor to the semantic guide through a small adapter; vendor state is private and cannot become the portable format.
- Support required Markdown blocks/marks, keyboard shortcuts, ordinary paste and insert commands for builds and skills.
- Keep the catalog on the right in desktop authoring mode, including zero-build guides.
- Refactor `FocusedSkillCatalog` so click/keyboard/drag intents can target prose insertion or an explicit build slot; existing click-to-slot behavior remains for standalone composer.
- Preserve text caret/bookmark while interacting with catalog search/filter/scroll.
- Add responsive catalog sheet/tab behavior with focus restoration and independent document/catalog scrolling.
- Ensure non-editable embed shells and inline references produce valid DOM inside paragraphs; do not put block tooltip markup inside inline content.
- Change `App.tsx` catalog-error behavior so stored guide text, source draft and export/recovery options remain reachable when catalogs are unavailable; dependent build/skill editing can be disabled.

Gate:

- Component tests cover shell state wiring, dirty guard, catalog target mode, empty/no-build states and focus restoration.
- Actual browser checks cover typing, formatting, list editing, normal paste, IME/composition, focus at inline/block embed boundaries, long-document scrolling, both themes and responsive catalog behavior.

### Phase 4: BW-2005 Embedded Build Cards

Files:

- New `src/app/components/GuideBuildCard.tsx`
- New `src/app/components/GuideBuildInspector.tsx`
- New `src/app/components/GuideBuildList.tsx`
- `src/app/components/SkillBar.tsx`
- `src/app/components/ComposerHeader.tsx`
- `src/app/components/FocusedAttributeEditor.tsx`
- `src/app/components/TitleRankPanel.tsx`
- `src/app/components/InlineTemplateCode.tsx`
- `src/app/template-import.ts`
- `src/app/template-workflow.ts`
- `src/app/template-files.ts`
- New `src/app/guide-build-card.test.tsx`

Tasks:

- Insert blank builds, template-code builds and copied current/saved builds as self-contained guide snapshots.
- Render compact cards with label, professions/mode, eight-slot bar, copy-template action and unresolved/incomplete state.
- Reuse current build validation, attribute/rune/headgear controls, title controls, assumed-effect controls, preview selectors and template export through explicit card adapters.
- Show full controls for the active card without repeating the entire tool panel inside every card.
- Implement rename, reorder, independent duplicate and reference-aware deletion, all through guide history.
- Route template import/Load/Save/download actions to an explicit card; preserve sibling cards/prose and current cancellation/error semantics.
- Keep equipment recommendations as prose; do not restore retired armor/weapon UI.

Gate:

- Tests cover two cards with different skills, base ranks, rune/headgear choices, title overrides, effect assumptions, raw overlays and template facts.
- Import/copy/export tests prove target-card behavior and cancellation do not affect siblings or guide text.
- Browser checks verify expanded controls, copy-template action and incomplete/unresolved card editing.

### Phase 5: BW-2006 Inline Skill References And Context

Files:

- New `src/app/components/GuideSkillReference.tsx`
- New `src/app/components/GuideReferenceEditor.tsx`
- `src/app/components/SkillTooltip.tsx`
- `src/app/components/SkillDisplay.tsx`
- `src/app/editor-selectors.ts`
- New or updated `src/app/guide-selectors.ts`
- New `src/app/guide-reference.test.tsx`

Tasks:

- Implement atomic inline references with stable catalog skill IDs, local icons, accessible labels and shared display data.
- Support generic and named-build context selection. Catalog-to-prose defaults to generic; build-bar-to-prose binds to the source build.
- Resolve bound tooltips from the referenced build's mode, base ranks, bonuses, title overrides and assumed effects, independent of selected card.
- Implement a clearly indicated generic catalog/range display that never borrows active-build ranks.
- Keep missing skill IDs and deleted/missing build context visible, recoverable and repairable without silent retargeting.
- Preserve atomic references when editing surrounding text, moving text, copying fragments and returning focus from the catalog.

Gate:

- Tests cover generic/bound/missing context, two different build projections for the same skill, mode/title/bonus differences, move/copy, delete/undo and explicit rebind.
- Browser checks cover hover, keyboard focus and touch-capable tooltip interaction with inline wrapping and long skill names.

### Phase 6: BW-2007 Drag, Drop And Keyboard Placement

Files:

- `src/app/drag-payload.ts`
- `src/app/components/FocusedSkillCatalog.tsx`
- `src/app/components/SkillBar.tsx`
- `src/app/components/GuideEditor.tsx`
- `src/app/components/GuideBuildCard.tsx`
- `src/app/skill-bar-actions.ts`
- `src/app/skill-bar-workflow.ts`
- New `src/app/guide-drag-drop.ts`
- `src/app/drag-payload.test.ts`
- New `src/app/guide-drag-drop.test.tsx`

Tasks:

- Version drag payloads and include document identity, source kind, source build ID, source slot, target build ID where applicable, skill ID and stale-source facts.
- Implement every drop matrix row from the brief with visible prose caret or slot target.
- Route slot drops through existing placement planner for the addressed target snapshot, including inactive cards.
- Preserve same-bar move/swap behavior and raw-overlay movement; copy from one build to another; bar-to-prose leaves source bar unchanged.
- Stop nested drop propagation so one gesture creates exactly one transaction.
- Handle document switch, deleted/reordered cards, changed source slot, malformed MIME payload, external text and canceled drag as documented.
- Add keyboard pick-place-cancel controls for mention insertion and slot placement with accessible feedback.

Gate:

- Integration tests prove catalog-to-prose, catalog-to-slot, same-bar move/swap, cross-build copy, source-bar-to-bound-mention, inactive target and stale/canceled drag behavior.
- Actual browser evidence covers pointer drops, keyboard equivalents, nested slot target, inactive card, stale source, scrolling and cancellation.

### Phase 7: BW-2008 Source Editing And Markdown Transfer

Files:

- New `src/app/components/GuideSourceEditor.tsx`
- New `src/app/components/GuideTransferControls.tsx`
- New `src/app/guide-source-state.ts`
- New `src/app/guide-file-transfer.ts`
- `src/domain/guide-codec.ts`
- `src/app/guide-state.ts`
- New `src/app/guide-source.test.tsx`

Tasks:

- Add source view with raw draft buffer, diagnostics, last-valid guide, explicit Apply and clear visual/read transition prompts: Apply, Keep Editing Source and Discard.
- Make valid source Apply atomic; invalid source never partially changes embedded builds.
- Preserve raw draft and diagnostics across autosave/reload once BW-2009 lands.
- Provide Markdown download, upload/paste import, cancellation handling and dirty-draft replacement behavior.
- Distinguish last-valid guide export from raw invalid/unapplied draft export.
- Preserve complete supported state across visual edit -> source -> Apply -> export -> import, including snapshots, adjustments, title/effect preferences, raw overlays, reference bindings and metadata.
- Apply inert content, unsafe-link handling and size/depth/count limits consistently for source, upload and paste.

Gate:

- Tests cover malformed/partial source, unsupported versions, escaping, annotations in code fences, opaque segments, hostile HTML/URLs, boundary-size files and semantic equality.
- Browser evidence covers valid Apply, invalid Apply, visual/source/read transitions, download and reimport.

### Phase 8: BW-2009 Local Guide Save And Recovery

Files:

- `src/app/persistence-schema.ts`
- `src/app/workspace-state.ts`
- `src/app/local-storage.ts`
- `src/app/backup-restore.ts`
- `src/app/library-selectors.ts`
- `src/app/components/LibraryPanel.tsx`
- `src/app/components/StorageBanner.tsx`
- `src/app/App.tsx`
- `src/app/persistence-schema.test.ts`
- `src/app/workspace-state.test.ts`
- `src/app/backup-restore.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/library-selectors.test.ts`

Tasks:

- Add a versioned persisted guide document and bump/migrate the local library envelope as needed while preserving existing v1/v2 build and build-set data.
- Persist guide metadata, semantic document, embedded snapshots, stable bindings, last-valid guide, recoverable source draft and diagnostics summary. Do not persist transient focus or undo unless explicitly justified.
- Audit all materialize, hydrate, clone, fingerprint, save-new, update-associated, save-as, load-record, duplicate-record, delete-record, rename, backup, restore, selected preview and library row branches for `guide`.
- Add minimal named guide Save/Open controls without resurrecting obsolete general equipment/library panels.
- Preserve storage denial/quota/corruption/newer-schema/cross-tab conflict behavior and rejected payload recovery.
- Make unavailable catalogs recoverable: guide text and stored IDs remain visible/exportable, while dependent editing is disabled.
- Keep game template folder/files separate from guide Markdown.

Gate:

- Fixtures prove old build/build-set envelopes, new guide envelopes and mixed backups restore without write-on-read.
- Storage failure/conflict tests prove failed saves do not report durability or overwrite newer/corrupt recoverable data.
- Browser evidence covers named save/open, reload, invalid-source recovery and export fallback when storage is unavailable.

### Phase 9: BW-2010 Reading And Variant Navigation

Files:

- New `src/app/components/GuideReader.tsx`
- New `src/app/components/GuideReadBuildCard.tsx`
- New `src/app/components/GuideNavigation.tsx`
- `src/app/components/GuideWorkspace.tsx`
- `src/app/guide-selectors.ts`
- `src/app/styles.css`
- New `src/app/guide-reader.test.tsx`

Tasks:

- Render the same applied guide nodes in read mode with catalog and mutation controls hidden.
- Preserve contextual tooltips, compact build summaries, template copying, headings, anchors and stable direct variant links.
- Add expand/collapse of detailed build information as UI-only state.
- Keep last-valid/unapplied-source messaging truthful and preserve reasonable edit selection when returning to author mode.
- Use local assets/fallbacks and safe external links. Do not add hosted publishing.

Gate:

- Tests prove read-only actions do not dirty the guide or create history entries.
- Browser evidence covers reading/navigation/copy flows with two variants, bound/generic mentions, missing references, narrow layout and 200% zoom.

### Phase 10: BW-2011 Example Guide And Workflow Coverage

Files:

- New `src/app/guide-fixtures.ts`
- New fixture Markdown under `test/fixtures/guide-workspace/`
- `src/app/App.test.tsx`
- New integrated guide workflow tests
- `compendium/source-policy.md`, only for reference/compliance if content decisions need updates

Tasks:

- Create an original dagger-themed two-variant guide with headings, prose, generic and contextual mentions, optional slots, template input, rune/headgear bonuses, usage, recommendations, counters and source links.
- Use approved local catalog identities/assets and existing codecs; mark fixture as interaction sample, not current meta advice.
- Record provenance metadata for links without copying PvX prose, ratings or page bodies into runtime content.
- Expose sample loading non-destructively through normal replacement handling.
- Add integrated scenarios for write/edit/reference/drop/undo/source/save/reload/read/export-reimport and a long-document fixture.
- Cover unresolved references, raw template facts, context after card selection changes and generic mentions with no build.

Gate:

- End-to-end tests prove export/reimport preserves both variants and their differing contextual skill values.
- Source policy review confirms original content and no live PvX request or remote image is required.
- Browser fixture/script is ready for BW-2012.

### Phase 11: BW-2012 Browser Verification And Closeout

Files:

- Browser evidence artifacts under the repository's established evidence/run location
- `work/tickets/20-markdown-guide-workspace/*.md`
- Executing sprint record and ledger files owned by the burn runner
- `compendium/guide-workspace.md`
- `README.md`, only if the feature needs user-facing setup notes

Tasks:

- Execute the full browser matrix from the brief using the original two-variant fixture and long-document fixture.
- Cover typing/formatting/IME, inline/block boundary focus, independent scrolling, every supported pointer drop, keyboard placement, target switching, stale drag handling, generic/bound tooltips, cross-feature undo/redo, invalid source recovery, named save/open/reload, download/reimport and read/edit navigation.
- Verify both themes, narrow viewport, 200% zoom, long scrolling and accessible keyboard flows.
- Run existing composer, game-template/folder, attribute preview, build-set/party persistence and backup regressions.
- Run `work/runs/toolchain/node_modules/.bin/npm run verify` with PATH resolving the pinned npm for child scripts, then run `git diff --check`.
- Update tickets, executing sprint records, ledger and burn result manifest consistently. Link durable evidence.

Gate:

- All BW-2001 through BW-2011 acceptance criteria have implementation and verification evidence.
- If any required browser scenario cannot run, record the exact gap and leave the affected ticket/epic incomplete.

## Files Summary

Primary domain changes:

- `src/domain/guide.ts`
- New `src/domain/guide-codec.ts`
- New `src/domain/guide-validation.ts`
- New `src/domain/guide-remap.ts`
- `src/domain/index.ts`

Primary app state and adapter changes:

- New `src/app/guide-state.ts`
- New `src/app/guide-history.ts`
- New `src/app/guide-selectors.ts`
- New `src/app/guide-insertion.ts`
- New `src/app/guide-build-adapter.ts`
- New `src/app/guide-editor-adapter.ts`
- New `src/app/guide-source-state.ts`
- New `src/app/guide-file-transfer.ts`
- New `src/app/guide-drag-drop.ts`
- `src/app/workspace-state.ts`
- `src/app/editor-state.ts`
- `src/app/persistence-schema.ts`
- `src/app/local-storage.ts`
- `src/app/backup-restore.ts`
- `src/app/library-selectors.ts`
- `src/app/drag-payload.ts`
- `src/app/skill-bar-actions.ts`
- `src/app/skill-bar-workflow.ts`
- `src/app/template-import.ts`
- `src/app/template-workflow.ts`
- `src/app/template-files.ts`
- `src/app/App.tsx`

Primary component changes:

- New `src/app/components/GuideWorkspace.tsx`
- New `src/app/components/GuideEditor.tsx`
- New `src/app/components/GuideToolbar.tsx`
- New `src/app/components/GuideCatalogShell.tsx`
- New `src/app/components/GuideBuildCard.tsx`
- New `src/app/components/GuideBuildInspector.tsx`
- New `src/app/components/GuideBuildList.tsx`
- New `src/app/components/GuideSkillReference.tsx`
- New `src/app/components/GuideReferenceEditor.tsx`
- New `src/app/components/GuideSourceEditor.tsx`
- New `src/app/components/GuideTransferControls.tsx`
- New `src/app/components/GuideReader.tsx`
- New `src/app/components/GuideReadBuildCard.tsx`
- New `src/app/components/GuideNavigation.tsx`
- Existing composer/catalog/build controls refactored for explicit target/context props
- `src/app/styles.css`

Tests and fixtures:

- New domain codec/model tests and fixtures
- New guide state/history/source/reader/drag/reference/card tests
- Updated persistence, workspace, backup/restore, local-storage, library selector, drag payload, template workflow, composer, skill-bar and App tests
- New original guide fixture and long-document fixture under established fixture conventions
- Actual browser evidence artifacts produced only during implementation closeout

Package files:

- `package.json`
- `package-lock.json`

Package edits are allowed only after BW-2001 proves the selected editor/parser dependencies and records the decision.

## Definition of Done

- BW-2001 records concrete contracts, syntax examples, limits, ownership rules, editor/parser evaluation and actual-browser feasibility for paragraph + inline reference + editable build embed + shared undo + source round-trip.
- BW-2002 provides a framework-neutral versioned guide model and codec with deterministic diagnostics, opaque-content recovery, semantic round trips, snapshot preservation and pure remapping helpers.
- BW-2003 routes all authored guide changes through one transaction/history model with correct dirty fingerprints, identity preservation, deletion handling and source recovery state.
- BW-2004 delivers rendered authoring, required Markdown editing, guide/composer entry points, right-hand catalog shell, responsive catalog access, stable insertion bookmarks and usable catalog-unavailable recovery.
- BW-2005 embeds complete editable Build v4 snapshots, reuses existing build controls through adapters, preserves raw template facts and targets game-template IO to explicit cards.
- BW-2006 supports generic and build-bound inline skill references with stable catalog IDs, correct tooltip context, unresolved states, repair actions and accessible inline behavior.
- BW-2007 implements the full drop matrix and keyboard equivalents with explicit document/build/slot targets and stale-drag protection.
- BW-2008 implements safe source view, atomic Apply, raw draft recovery, Markdown download/upload/import and exact or recoverable handling of unknown content.
- BW-2009 persists guides locally with named Save/Open, autosave/reload, backup/restore, mixed migration and storage failure recovery without damaging existing build/build-set/party data.
- BW-2010 provides read mode with matching applied content, variant anchors, contextual tooltips, template copying, responsive navigation and no dirty/history side effects.
- BW-2011 supplies an original two-variant dagger-themed guide fixture and integrated workflow coverage without copied PvX prose, live PvX requests or remote images.
- BW-2012 records actual browser evidence for the full matrix, passes repository verification and updates all ticket/sprint/ledger/result records consistently.
- Existing standalone composer, build-set, party transfer, template file, share URL, attribute preview, title/rune/effect, storage and backup behavior remain compatible.
- Public discovery, PvX intake, hosted publishing, accounts, collaboration, backend sync, live-linked library builds, full party embeds and restored equipment UI remain explicitly out of scope.
- `work/runs/toolchain/node_modules/.bin/npm run verify` and `git diff --check` pass at closeout.

## Risks

- Editor feasibility may fail on shared history, inline atomic nodes, focus around embeds, IME or browser drag behavior. Mitigation: BW-2001 is a hard stop before broad integration.
- Guide state could accidentally duplicate build authority between semantic document, active `EditorState`, raw template source and vendor editor state. Mitigation: adapter boundaries, materialization tests and one transaction history.
- Persistence union changes can miss build/build-set/party branches. Mitigation: exhaustive switch audit, mixed schema fixtures and backup/restore tests.
- Inline references may borrow selected-card context if selectors remain globally editor-focused. Mitigation: explicit reference context selectors and tests that select a third card.
- Unknown Markdown can be silently normalized or stripped. Mitigation: exact opaque segment tests and recoverable source mode when safe round-trip is impossible.
- Drag/drop can double-apply because build slots live inside document drop zones. Mitigation: target preview, stop propagation and one-transaction assertions.
- Catalog failure currently blocks the app. Mitigation: App-level recovery path that preserves guide text/source/export while disabling catalog-dependent editing.
- Browser-only APIs for file download/import, local storage, touch and drag have environment differences. Mitigation: actual-browser matrix is required for closeout.

## Security

- Treat guides as inert data, never instructions or executable content.
- Do not execute raw HTML, MDX, JSX, scripts or event handlers from Markdown/source.
- Sanitize and constrain link schemes; external navigation is user-activated only.
- Do not fetch remote images, embeds or guide sources during render/import.
- Bound source size, node depth, build count, reference count, metadata size and diagnostics count.
- Reject dangerous object keys such as `__proto__`, `constructor` and `prototype` in guide/persistence JSON.
- Preserve unknown content as inert raw nodes or recoverable source; never partially apply unsafe input.
- Keep catalog IDs distinct from game-template IDs to prevent confused identity lookups.
- Use local approved assets for icons and fallback displays.
- Original sample content must be newly authored and source-linked; no copied PvX runtime prose, ratings or page bodies.
- Failed storage, corrupt/newer payloads and conflicts remain visible and recoverable; do not overwrite rejected data on read.

## Dependencies

- Completed epic dependencies listed by EPIC-20: EPIC-01, EPIC-04, EPIC-05, EPIC-06, EPIC-09, EPIC-16, EPIC-18 and EPIC-19.
- Existing Build v4 domain, validation, template compatibility, attribute preview, rune/headgear adjustments, title-rank controls, assumed-effect projections, skill catalog display, build-set snapshot materialization, strict local storage and backup/restore mechanisms.
- Future editor/parser dependencies are gated by BW-2001. No package dependency is accepted until official documentation, license, compatibility, bundle cost and actual-browser feasibility are recorded.
- Browser platform dependencies: localStorage, Blob/download, file upload, pointer drag/drop, keyboard events, focus, IME/composition and responsive layout behavior.
- Verification dependency: pinned npm at `work/runs/toolchain/node_modules/.bin/npm` with npm >= 11.10.1.

## Open Questions

- BW-2001 must settle the final editor/parser packages and exact syntax after real-browser proof; the Lexical/directive/fenced-block defaults above are provisional.
- BW-2001 must finalize numeric limits using representative documents and the long-document fixture.
- If source Apply cannot safely preserve a specific unsupported Markdown construct, implementation must choose recoverable source mode and document the unsupported feature rather than claiming lossless visual editing.
- If guide implementation volume exceeds the runner's safe closeout window after BW-2008, leave EPIC-20 open with completed evidence for finished tickets; do not mark BW-2012 done without the browser matrix and full verification.
