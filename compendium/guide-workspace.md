# Markdown Guide Workspace

Status: implemented in the isolated [SPRINT-021](../work/sprints/SPRINT-021.md) worktree; acceptance remains in progress for [EPIC-20](../work/tickets/20-markdown-guide-workspace/EPIC.md). Updated 2026-09-27. The controls below are implemented; final file-upload verification is still blocked.

SPRINT-021 resumes with the [user-authorized native composition verification
deferral](../work/sprints/evidence/SPRINT-021/native-composition-deferral.md).
Native Chrome access and menu Undo were observed. Native composition completion
remains unverified; that evidence gap no longer blocks the burn. All other
feasibility, contract, capacity, browser and validation checks remain required.
The [ADR](decisions/0003-guide-editor-and-markdown-contract.md) and
[evidence index](../work/sprints/SPRINT-021-EVIDENCE.md) retain the prior attempts.
The isolated implementation now includes rendered writing, addressed builds and
references, pointer/keyboard placement, atomic Source Apply and Markdown transfer,
library/backup v3 durability and recovery, and a read-only guide renderer with
namespaced section/variant anchors. The original dagger example opens only through
an explicit guarded action. Source buffers and complete independent snapshots are
preserved by local saves; missing catalogs and failed storage retain export paths.
The Guide library supports Save, Save As, Open, rename, duplicate and mixed backups.
Read shows the last applied guide and preserves unfinished source for return to Source.
Game template copying transfers only the game representation; Markdown/local saves
retain rune/headgear, title, effect and reference metadata.

BW-2001 through BW-2007 passed their phase gates. Remaining acceptance is in
progress: required file uploads are [unverified due to browser security/permission
restrictions](../work/sprints/evidence/SPRINT-021/upload-permission-gap.md), with the final integrated results tracked in the [acceptance matrix](../work/sprints/evidence/SPRINT-021/phase12.md).
The accepted ADR and dated evidence define the implementation contract. Clipboard fragments retain local external bindings only when session, generation and guide ID match; older or replaced origins become explicitly detached. Reader return preserves unfinished Source text and its selection. The frozen long fixture has 16 builds and 601 mentions.

## Product Intent

Build Wars should make useful Guild Wars builds, variations, and instructions easy
to explore together. The motivating reference is the
[PvX Dagger Spammer page](https://gwpvx.fandom.com/wiki/Build:A/any_Dagger_Spammer):
the user wants access to meaningful builds without ads and repeated navigation.
The first milestone establishes authoring and reading; public discovery and
content ingestion remain explicit follow-ups below.

The user's direction is:

- Markdown with annotations for build/template data and attribute bonuses.
- Skill references embedded in the guide text.
- A writing experience resembling Obsidian or Notion, with rendered text and
  interactive embeds instead of requiring authors to hand-edit annotations.
- Integration with Build Wars: document on the left, existing skill catalog on
  the right, with skills draggable into prose or embedded builds.
- Document this work as actionable input to the ticket-burn script.

The following are executable planning defaults developed from that discussion:
an integrated Guide workspace, self-contained build copies, explicit variant
context, local save/import/export, source access, and a reading view with the
catalog hidden. Exact syntax and editor library were not user-selected. BW-2001
settles those implementation choices with a bounded feasibility check.

## First Milestone

Deliver one complete local author/read workflow. A user can create a guide, write
ordinary Markdown, insert two or more named builds, edit their skills and bonuses,
refer to skills in sentences, save and reopen, export/reimport the guide, and read
it without the authoring catalog. The compact standalone composer stays available.

### Workspace and writing

- Provide clear entry points for the existing composer and the Guide workspace.
  Switching surfaces must not replace a draft without the existing dirty-data
  handling. A guide is a document kind, not a component pasted over the build draft.
- The desktop authoring layout has a document on the left and persistent catalog
  on the right. The document and catalog can scroll without losing the text cursor.
- Minimum rich-text vocabulary: paragraphs, headings, emphasis, strong text,
  ordered/unordered lists, links, blockquotes, inline code and fenced code.
- Authors write into rendered content; keyboard Markdown shortcuts and small
  insert commands cover common operations. A textarea with a separate preview
  alone does not meet the writing requirement.
- Build and skill inserts have keyboard and click equivalents. Catalog clicks
  must not unexpectedly replace a skill on the last selected bar while the author
  is writing prose. Preserve and indicate the intended insertion target.
- Build cards show a label, professions/mode, eight-slot bar and copy-template
  action. Selecting a card reveals the existing attribute/rune/headgear and
  supported assumed-effect controls. Avoid repeating a full tool panel in every card.
- On narrow screens, use a dismissible catalog sheet/tab with focus restoration;
  retain the same target semantics. Read mode hides the catalog and edit controls.

### Embedding and ownership

- A guide owns its embedded builds; inserting the current or a saved build copies
  its complete durable state. Subsequent changes elsewhere do not silently change
  the guide. Live links to library records are outside this milestone.
- Each build has a stable guide-local identity distinct from its display name and
  the document position. Rename and reorder preserve identity; duplicate creates
  new identity and an independent snapshot. Imported duplicate IDs are diagnosed.
- Use the existing Build v4 and durable snapshot adapter, including title ranks,
  authored adjustments, PvE budget and unresolved raw template facts. Evolve the
  `src/domain/guide.ts` scaffold; do not create a competing build schema.
- Preserve base allocation, rune and headgear contributions separately. Preserve
  explicit assumed-effect preferences and title-rank overrides. Effective ranks
  and rendered tooltip values are derived, never a replacement for those inputs.
- Template codes are an import/export representation. Do not independently author
  both a code and a conflicting skill/attribute payload. The codec contract must
  choose an authoritative representation and a deterministic conflict diagnostic.
  A compact template-code input must be supported, while full guide export must
  preserve facts that a game code cannot express. Blank/incomplete/unresolved
  builds remain editable even when canonical template export is unavailable.
- Equipment recommendations beyond current attribute adjustments remain prose.
  This milestone does not restore the retired armor/weapon editor.

### Skill references and context

- Inline references store a stable catalog identity; labels/icons come from the
  shared catalog. Name completion is an authoring convenience, not identity.
  Explicitly distinguish runtime catalog IDs from game-template IDs.
- A reference can be generic or explicitly associated with a guide-local build.
  Generic is the default for prose insertion. An author can choose a named build
  when inserting or editing the mention; the choice is stored in the document.
- A contextual reference uses its named build's base ranks, bonuses, title ranks,
  mode and supported effects even when another card is selected for editing.
  Card selection is never a persisted reference-context change.
- Generic references use a clearly indicated shared catalog/range presentation,
  without borrowing ranks from an unrelated active build or inventing rank zero.
- Missing skill IDs or deleted target builds remain visible and recoverable, with
  their stored identity/context intact. Do not retarget to a different variant or
  convert an unresolved contextual mention silently to a generic one.
- Moving text preserves its reference bindings. Deleting a referenced build
  identifies affected mentions; the author can cancel or delete and retain
  unresolved mentions. Undo restores the build and its references together.
- Duplicating a build alone leaves existing prose bindings unchanged. Copy/pasting
  a selected fragment containing builds and references remaps internal IDs together;
  references to builds outside that fragment become explicit unresolved references
  on cross-document paste unless the author chooses a target. Never link by a
  coincidentally matching ID in the destination.
- Mentioning a skill does not apply skill-bar legality or profession filtering to
  the prose. In a guide with no build, the catalog still supports reference insertion.

### Drop behavior

| Source / target                   | Required result                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Catalog skill into prose          | Insert one inline reference at the visible drop caret; no build changes.        |
| Catalog skill between blocks      | Insert a paragraph containing a reference; no additional card type is required. |
| Catalog skill onto a build slot   | Apply the existing placement planner to that exact build and slot.              |
| Skill moved within one build bar  | Preserve existing move/swap behavior and raw-overlay handling.                  |
| Skill from one build to another   | Copy into the target using existing placement rules; keep the source intact.    |
| Skill from a build bar into prose | Insert a reference bound to the source build; leave its bar intact.             |
| External text / malformed payload | Normal safe text paste/drop or a clear no-op; never a guessed slot edit.        |

Show the insertion caret or slot target before dropping. A slot drop must not also
bubble into a prose insertion. Carry and validate document, source/target build,
slot, and current identity facts where needed; the present slot-index-only payload
is insufficient across multiple build cards. Stale drags, deletion during drag,
document switches and canceled drags must not mutate another document or build.
Apply target rules even if the card was not previously selected.

### Document, source and history

- A framework-neutral, versioned guide document is the semantic owner. Markdown
  with custom annotations is its portable representation. Keep parser/serializer,
  pure reference resolution and rendering contracts separate from editor-vendor
  state and app persistence. Do not store the vendor's JSON as the public format.
- Guide metadata includes title, optional summary, tags and source/provenance
  references. Profession/mode facts for future discovery can be derived from
  embedded builds; do not force every variant to share an invented classification.
- Freeze the minimum Markdown dialect, annotation syntax, version marker, limits,
  reference-ID namespaces, escaping and source locations in BW-2001/BW-2002.
  Plain Markdown and fenced code containing annotation-looking text must stay plain.
- Accepted visual edits, build edits and valid source application are guide
  transactions. They feed one bounded history for the guide. Selection, hovering,
  catalog filtering and view changes are not authored changes or history entries.
- Undo/redo spans prose, skill insertion, slot replacement, attribute changes,
  duplicate/delete/reorder, and valid source application in chronological order.
  One gesture is one meaningful undo step; no independent build history can
  disagree with the document. Define typing grouping and a practical history cap.
- Source editing uses a separate draft buffer and an explicit Apply action.
  Invalid source never partially updates embedded builds. Keep diagnostics,
  last-valid document and raw draft; autosave the recoverable draft. Read mode
  clearly identifies when it shows the last applied document.
- Entering visual edit while source changes are unapplied offers Apply or Keep
  Editing Source (and an explicit discard choice); never silently overwrites them.
  Export of an invalid/unapplied draft offers the raw draft separately from the
  last-valid guide. Lossless export is not claimed for failed parsing.
- Unknown annotations or Markdown constructs are retained as inert raw nodes
  where possible. Preserve their contents through edits elsewhere. If a structure
  cannot safely round-trip, keep the raw document in recoverable source mode and
  explain the unsupported feature; never save a stripped or partially parsed guide.
- Supported content must round-trip semantically, including metadata and context.
  Document allowed whitespace normalization. Unknown raw segments must retain
  their exact content; editor selection/focus/history need not survive export.

### Local durability and reading

- Add a versioned guide document to the existing persistence boundary with
  migration for older library envelopes, preserving existing build/build-set
  records and working drafts. Audit every clone, fingerprint, backup and restore
  branch rather than adding only a new UI state field.
- Provide a minimal named guide Save/Open experience and draft autosave. Reuse the
  existing persistence/recovery mechanisms; do not reintroduce all historical
  library/party panels merely to reach guide controls.
- Reload restores the guide, complete embedded builds, mention context and any
  recoverable source draft. Storage denial, quota failure, corrupt data, newer
  versions and cross-tab conflict stay visible without overwriting recoverable data.
- Unavailable catalogs must not destroy or prevent recovery/export of guide text
  and stored identities. Disable dependent editing, preserve the data and show
  unresolved displays rather than replacing the document with an empty guide.
- Markdown download/upload is the self-contained guide interchange path. Validate
  before replacing a draft and preserve the current document on cancellation/error.
  No automatic server upload, folder synchronization or remote document fetch.
- The existing game template Load/Save remains build-specific. In guide mode it
  addresses an explicit card and preserves sibling builds/prose. Copying a game
  code does not claim to include the guide or bonus metadata.
- Read mode uses the same nodes, skill displays, contextual projections and
  copy-template behavior, with accessible headings and direct variant anchors.
  Collapse/expand and reading actions do not dirty the document. Returning to
  editing preserves the document and reasonable cursor/selection context.
- Use at least one original two-variant dagger-themed guide to demonstrate prose,
  generic and contextual mentions, optional slots, rune/headgear contributions,
  recommendations, usage, counters and related source links. It is an interaction
  fixture, not a claim that a build is currently meta or a copy of PvX's guide.

## Current Code and Integration Boundaries

`BuildComposer.tsx` is already divided into a build pane and
`FocusedSkillCatalog.tsx`, but both are bound to one `EditorState`.
`App.tsx` also computes tooltip views from that active editor. Reuse the display
components and domain functions while making target/context inputs explicit.
`workspace-state.ts` and multi-build snapshot transitions provide a useful
precedent for one active editor and inactive snapshots, not a requirement to turn
the guide into a party or to use the existing build-set size cap without review.

The domain Guide scaffold currently holds text/build/party sections. Audit its
exports/consumers and evolve it deliberately; no persisted guide kind currently
exists. The full authored snapshot also contains app raw-template facts not in
the domain Build. Put that mapping in an adapter rather than importing app or
editor packages into the domain.

BW-2001 must prove one text paragraph, one inline reference and one editable build
embed can share focus/history and round-trip before the editor choice is fixed.
Evaluate maintained dependencies against that test, the existing Vite/React app,
accessibility, license, bundle impact and supported Markdown constructs. Record
the choice; do not spend the milestone building a generic rich-text framework.

## Verification and Release Gate

Pure tests cover semantic round trips, escaping, ID remapping, target isolation,
malformed/unknown content, template conflicts, direct bonus inputs and unresolved
facts. Integration tests cover focus/insertion bookmarks, source Apply,
history, migration, autosave and recovery. Run existing composer, template,
attribute-preview and storage regressions.

Actual browser evidence must show authoring a two-build document; catalog-to-text
and catalog-to-slot drops; same-bar move and cross-build copy; keyboard equivalents;
generic versus bound tooltips after switching builds; undo across prose/build
changes; invalid source recovery; named Save/Open and export/reimport/reload;
read/edit transition; long-document scrolling; both themes; narrow viewport; 200%
zoom; and cursor behavior around inline and block embeds. Native IME/composition
verification is deferred by the linked user decision; automated composition
regressions and correct composition handling remain required.
Component tests alone do not prove a usable writing or drag experience.

At implementation closeout require `npm run verify`, `git diff --check`, recorded
browser evidence and completed ticket acceptance. Select representative limits
in the contract ticket and test boundary behavior; do not invent performance
benchmarks after implementation just to declare success.

## Content and Rendering Boundary

Treat guide inputs as data. Render no executable MDX/JSX or raw HTML, sanitize link
schemes, bound document size/depth/counts and metadata parsing, and do not interpret
guide content as instructions. Remote images and embeds remain inert links/text;
skills and runes reuse existing approved local assets. External navigation is
user-activated, not a parsing side effect.

The reference page is a product example, not an imported runtime dataset.
[Source policy](source-policy.md) governs any future copied contributor text.
Original fixture prose and links suffice for this milestone. Source metadata
can retain attribution/license/revision fields without implementing a crawler or
claiming that source content is approved for redistribution.

## Follow-up Work Kept Visible

These requirements belong to later scoped epics, not the EPIC-20 completion gate:

- **Discovery:** searchable guide/build cards; profession, mode and use-case
  filters; variants and skill bars visible before opening; direct guide/variant
  navigation; favorites and useful ranking/freshness criteria.
- **PvX intake:** assess live page and structured-source access, source revisions,
  mapping variants and optional slots, human review, attribution/rights, update
  detection and preservation of local edits. The live page differed from search's
  older extraction; never treat cached search content as an authoritative import.
- **Publishing:** stable public URLs, hosted content storage/index, author workflow,
  versioning and moderation. Accounts, remote sync and collaboration need their
  own scope and are not prerequisites for the local editor.
- **Richer documents:** explicit live-linked builds, full party embeds, block-level
  comparisons, additional game references and broader equipment annotations.
- **Independent editor product:** keep modules reusable, but do not create another
  application or public editor package before there is a concrete need.

Older docs mention hypothetical EPIC-20 search and EPIC-21 analysis work. This
epic is the current guide milestone; those historical references do not add
equipment search, stat analysis or a recommendation engine to its scope.
