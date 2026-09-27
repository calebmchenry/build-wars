# Sprint 021: Markdown Guide Workspace

Independent executable draft for EPIC-20, BW-2001–BW-2012. Planning date:
2026-09-26. Status: proposed; no implementation or verification gates have passed
as a result of this draft.

## Overview

Deliver one complete local guide authoring and reading workflow: rendered
Markdown, independently owned Build v4 variants, generic and variant-bound skill
references, catalog insertion and dragging, chronological undo, safe source Apply,
named local Save/Open, recovery, and self-contained Markdown interchange. Retain
the existing compact composer and its game-template workflow.

The authority is [the product brief](../../../compendium/guide-workspace.md),
[the sprint intent](SPRINT-021-INTENT.md),
[the original intent](EPIC-020-INTENT.md), and
[EPIC-20 and its twelve tickets](../../tickets/20-markdown-guide-workspace/EPIC.md).
The original backlog-only restriction on assigning a sprint number is superseded
by this sprint request. No other SPRINT-021 draft informs this document.

Plan all twelve tickets in this sprint, with dependency gates between phases.
There is no evidence yet requiring a scope split. The principal uncertainty is
editor integration, so BW-2001 must demonstrate the smallest rendered vertical
slice before the dependency or syntax becomes committed architecture. If both
bounded candidate attempts fail, stop dependent work and record the failed gate
and remaining tickets. Do not substitute a textarea, close the epic around a
prototype, waive browser evidence, or reserve another sprint number.

This draft records static inspection in the current isolated worktree at
`bbc162f`. It does not report executed tests, browser interaction, package
evaluation, or new baseline evidence. The intent supplies a supervisor-reported
baseline of format/lint/types/build, 587 Vitest tests, 149 ingestion tests and 21
runner tests passing; those are context, not results obtained here. Every
checkbox and verification action below is future execution work.

Observed code establishes these integration constraints:

| Current code | Consequence for this sprint |
| --- | --- |
| `src/domain/guide.ts` is a text/build/party scaffold; consumers found include the domain barrel and `test/domain/contracts.test.ts`. | Evolve the scaffold deliberately. There are no persisted guides to migrate; do not add party embeds. |
| `Build` has schema version 4, title overrides and direct attribute adjustments. `PersistedBuildSnapshot` also has PvE budget and raw template overlays. | Preserve the complete snapshot through a neutral contract and app adapter; a `Build` alone is insufficient. |
| Build-set state uses one active editor and null snapshots for the selected entry. | Reuse conversion functions, but keep all guide snapshots populated to avoid active-card materialization races. |
| `BuildComposer`, `FocusedSkillCatalog`, `SkillBar` and `selectSkillDisplay` take one `EditorState`. | Make build targets, catalog intent and tooltip context explicit. Do not let prose inherit the last selected build. |
| `SkillTooltipTrigger` renders a `div` and portals the tooltip body. | Add an inline-safe trigger; do not put the existing block wrapper inside a paragraph. |
| Drag payloads identify a catalog skill or only a slot index; `SkillBar` removes a slot on drag end with `dropEffect === "none"`. | Guide drag needs scoped identities and explicit outcomes; cancellation must never remove the source. |
| The library envelope and backup are version 2; persisted documents are build/build-set only. Party metadata belongs to build sets. Several helpers assume non-build means build-set. | Audit exhaustive unions, clone/remap/fingerprint paths and mixed backups, not just the new screen. |
| `App.tsx` has an early catalog-error return; autosave/pagehide depend on catalog-derived `savedWith`. | Keep guide recovery/export reachable without catalogs and decouple durable source storage from successful game validation. |
| Existing placement plans preserve raw overlays for moves/swaps and enforce duplicate/elite replacement. | Reuse them on the exact target snapshot. Do not implement a second rules engine. |

Out of scope: public guide discovery/search or ranking, automated PvX intake,
copied community guide publication, hosted URLs/storage, accounts, backend sync,
collaboration, live-linked library builds, full party embeds, full equipment
management, analytics, combat optimization, and a generic editor application or
package. Keep discovery, source-reviewed intake and publishing visible as later
work in the brief. Historical speculative epic references do not expand scope.

## Use Cases

| User action | Required result |
| --- | --- |
| Enter Guide from the composer; later return. | Explicit document-kind transition; preserve the current draft or apply existing dirty-data replacement handling. Cancel leaves the original document untouched. |
| Write a guide with no builds. | Rendered paragraphs, headings, emphasis/strong, lists, links, blockquotes, inline/fenced code; usable catalog and generic skill insertion without a fabricated build. |
| Insert blank, current, saved or template-derived builds. | Independent complete owned snapshots, compact labeled eight-slot cards, and one selected card's detailed controls. |
| Give two variants different ranks, runes, headgear, titles, mode and effects. | Each card and its explicitly bound mentions use that variant's inputs, including when a different card is selected. |
| Insert a catalog skill or move a bar skill into prose. | Catalog defaults to generic; bar-to-prose binds the source build. Both have pointer, click and keyboard routes. No bar changes. |
| Drop onto an inactive card or move between cards. | Address the visible target card/slot. Same-bar move/swap; cross-build copy; source and siblings preserved. |
| Rename/reorder/duplicate/delete a build or paste a fragment. | Stable bindings for rename/reorder; fresh independent duplicate; reference-aware deletion; internal fragment remapping and explicitly detached external references. |
| Undo prose, slot placement, attributes and deletion. | One chronological guide history, including IDs, raw overlays and references. Selection and reading actions create no history entries. |
| Edit invalid or unsupported source, switch views, or export. | Keep raw draft and last-valid guide; explicit atomic Apply; clear last-applied reading; separate raw and applied exports. |
| Save, reopen, reload, restore a mixed backup or lose storage/catalog access. | Preserve supported authored data and recoverable source; visible failures and export fallback; old build/build-set/party data survives. |
| Read and navigate variants. | Same applied meaning and projections, stable variant anchors, accessible headings, optional detail expansion and correct template copying; no catalog or mutation controls. |
| Load the original dagger-themed example. | An explicitly loaded interaction sample that honors draft replacement, with no copied PvX prose, remote asset dependency or current-meta claim. |

## Architecture

### Ownership and module boundaries

Use a framework-neutral semantic tree as the applied document owner. The editor
is an interaction adapter; annotated Markdown is interchange; persistence stores
validated authored state and source recovery. These are conversions of one
document, not independent sources of truth.

Recommended module boundaries, with new paths marked as proposed:

| Layer | Responsibility |
| --- | --- |
| `src/domain/guide.ts`, `guide-references.ts` (new), `ids.ts`, `index.ts` | Versioned guide metadata/nodes, branded guide-local identities, generic/bound/detached references, structural validation and pure resolution/remapping. No React, editor vendor, browser storage or catalog lookup dependency. |
| `src/guide/build-snapshot.ts` (new) | Framework-neutral durable payload using existing `Build` and template source contracts; mirrors authored budget/raw-overlay facts explicitly without importing app types. |
| `src/guide/markdown.ts`, `validation.ts`, `limits.ts` (new) | Bounded parse/serialize, syntax/version diagnostics and locations, semantic equivalence, inert exact raw segments. Inject template-shorthand resolution at the application boundary. |
| `src/app/guide-build-adapter.ts` (new) | Translate complete guide payloads to/from existing persisted/editor snapshots; invoke existing reducers, template codec, validation and preview selectors on an explicit target. |
| `src/app/guide-state.ts`, `guide-history.ts`, `guide-transfer.ts` (new) | Applied state, source recovery, atomic transactions, one history, identity remapping and explicit target validation. |
| `src/app/guide-editor-adapter.ts` (new) | Vendor schema, transaction/selection mapping, composition, bookmarks, clipboard/drop boundary, reconciliation after guide undo/Apply. No vendor JSON in public data. |
| `src/app/guide-selectors.ts` and shared display components | Resolve a mention's declared context; share projections between author/read surfaces; retain missing identities. |
| Existing workspace/persistence/storage/backup modules | Integrate guide as a real document kind through all materialization, migration, cloning, dirty/recovery and transfer branches. |

Evolve `Guide` as a typed tree with a generic embedded payload, following the
existing generic `BuildSet<Payload>` precedent. The public codec specializes it
with the neutral complete payload. Pure domain helpers take clone/remap callbacks
where payload internals matter; they must not import `PersistedBuildSnapshot` or
`EditorState`. The adapter must have field-coverage tests so the neutral boundary
does not drift when Build evolves. Keep one Build v4 contract and existing game
validation rules; do not create guide-specific attributes or skill schemas.

Every applied build node owns a populated complete snapshot. Card selection is a
session field. Hydrating an existing control's `EditorState` is a temporary
projection from the addressed snapshot; reduce its action and write its complete
durable result back in the same guide transaction. Never keep an unflushed second
build in the rich editor or a null active snapshot. Any memoized projection is
keyed by guide session, build ID and snapshot revision and is replaceable.

For guide branches, `workspace.editor` is not the authoritative selected card.
Branch before composer selectors and global tooltips consume it. Existing
standalone/build-set branches can retain their current active-editor convention.
The guide adapter is the sole route for guide build actions, including async
template results; this avoids a repository-wide rewrite of existing editors.

### Candidate editor and feasibility decision

The preferred *candidate* is a small Tiptap/ProseMirror schema with custom atomic
inline skill nodes and editable-control block node views, backed by a separate
unified/remark Markdown codec with narrowly scoped directive support. Evaluate
Lexical with equivalent custom nodes against the same neutral codec as the second
candidate. These are concrete starting hypotheses, not verified claims about
current maintenance, licensing, bundle size, compatibility or browser behavior.
BW-2001 must research current official documentation and licenses and record exact
versions before choosing. Do not assume an editor's built-in Markdown import
preserves unknown nodes or complete builds.

Prefer the first candidate only if a paragraph, mention and build control can
share caret/composition behavior, guide-owned undo and a semantic source round
trip. Disable independent vendor history for accepted document changes; use its
transaction/selection facilities through the bridge. Vendor build nodes carry
identity handles, not another copy of skills, attributes or template code. The
bridge applies semantic deltas and reconciles external changes without resetting
the whole editor for each keystroke. Prove this behavior rather than relying on
the package's advertised node-view support.

Bound exploration to two candidate stacks and the required small slice. Compare
official maintenance/release evidence, license obligations, React 19/Vite 6 and
TypeScript compatibility, accessibility, Markdown fidelity, browser support,
installed dependency tree and measured production bundle delta. Use only needed
extensions; measure a lazily loaded authoring bundle and ensure standalone use
does not eagerly pay for the editor. The decision record must state rejected
alternatives and defects, not only the winner.

Stop BW-2001 if no candidate can preserve focus/composition, one history, opaque
content and complete snapshots. A fallback is the second evaluated candidate,
with the same browser gate. A bespoke general rich-text framework, a source-only
editor, or two histories is not an acceptable fallback. Dependency/package
changes described here belong to future execution, not this drafting task.

### Candidate portable contract, to freeze in BW-2001

Use guide format version 1 independently of Build v4 and the local-library
version. Candidate syntax is a CommonMark subset plus reserved `bw-*` directives:

````markdown
:::bw-guide
{"version":1,"id":"guide-example","title":"Dagger practice notes","summary":"An original interaction example","tags":["example"],"sources":[]}
:::

## Before engaging

Inspect :bw-skill[]{skill="catalog:skill:123"} for general information.
Compare :bw-skill[]{skill="catalog:skill:123" build="gb-main"} in this variant.

:::bw-build
{"id":"gb-main","label":"Main variant","template":"<game-template-code>"}
:::
````

`123` and `<game-template-code>` above illustrate grammar, not verified fixture
identities or a valid game code. BW-2001/BW-2011 must supply verified examples.
An ordinary fenced code block containing these strings remains ordinary code.
Escaped directives remain text. Unmarked plain Markdown imports as a new guide;
export emits the versioned metadata block. A reserved marker with an unsupported
version forces recovery, never a best-effort downgrade to plain Markdown.

Full export replaces the template shorthand with exactly one complete payload:

````markdown
:::bw-build
{
  "id": "gb-main",
  "label": "Main variant",
  "snapshot": {
    "build": {
      "schemaVersion": 4,
      "catalogVersion": null,
      "id": "build:example-main",
      "name": "Main variant",
      "mode": "pve",
      "primaryProfessionId": null,
      "secondaryProfessionId": null,
      "attributes": [],
      "skillBar": [null, null, null, null, null, null, null, null],
      "titleRankOverrides": [],
      "attributeAdjustments": null
    },
    "pveBudget": {"level":20,"questBonus":"maximum-applicable"},
    "rawTemplate": {
      "source": null,
      "templateName": null,
      "primaryProfession": null,
      "secondaryProfession": null,
      "attributes": [],
      "skillBar": [null, null, null, null, null, null, null, null]
    }
  }
}
:::
````

This intentionally incomplete card is editable without a canonical game export.
Non-empty full payloads preserve base allocations separately from
`attributeAdjustments.headgearAttributeId`, rune catalog IDs, explicit
`effectPreferences` including off/strength values, title overrides and PvE budget.
The raw overlay preserves source fidelity/projection facts, unresolved template
profession/attribute/skill facts, labels and reasons through the existing adapter.
Do not serialize derived effective ranks, tooltip text, computed effects or an
independently authoritative game code.

Contract decisions to implement and test:

- `snapshot` and `template` are mutually exclusive. Their coexistence yields a
  deterministic `conflicting-build-representations` diagnostic and blocks Apply,
  even if they appear equivalent. Never choose one silently. A shorthand may
  accept validated title/adjustment/budget inputs outside the code's expressible
  fields; specify those exact keys in the decision record. Full output always
  uses the normalized snapshot. Historical raw source within `rawTemplate` is
  retained evidence governed by existing export-fidelity checks, not a second
  editable payload or something reapplied after snapshot edits.
- Catalog identities are tagged in inline syntax (`catalog:skill:N`) and parsed
  into branded catalog IDs. Numeric fields inside the existing Build retain their
  established namespaces; `rawTemplate.*.templateId` always means a game-template
  ID. No conversion by name, no assumption that equal numbers across namespaces
  identify the same skill. Unknown catalog IDs are valid recoverable identities.
- Guide IDs, guide-local build IDs and transient semantic node IDs use separate
  branded types. Guide/build IDs survive portable round trips; a build ID is not
  a label, array index or library-record ID. Nested `Build.id` is independently
  preserved and freshly allocated when copying. Prose-node/mention instance IDs
  serve editor mapping and may regenerate on source parse; exclude them, source
  spans and selection from authored semantic equality. Stable variant anchors
  use guide-local build IDs, never title slugs.
  Candidate portable guide/build IDs are 1–80 ASCII characters matching
  `[A-Za-z0-9_-]+`, with generated `guide-`/`gb-` UUID prefixes. Allocation belongs
  to the app boundary, is injectable in tests and checks document-local uniqueness;
  domain helpers do not call browser APIs. Missing local targets are diagnosed,
  not assigned a fresh ID during parse.
- Metadata includes title, optional summary, tags and source references. Reuse
  `SourceReference` vocabulary for URL, family, attribution/license/revision facts
  and unknown values; retain linked-only provenance explicitly. Do not infer a
  rights approval from the presence of a URL or invent a shared profession/mode
  classification for all variants. Derive per-build facts for future discovery.
- JSON bodies have exact keys, reject duplicate keys and dangerous object keys,
  and permit no YAML tags, aliases or evaluators. Directive attributes use quoted,
  escaped values. Freeze escaping for quotes, braces, brackets, backslashes,
  colons, delimiters and newlines; parse through Markdown tokens, not a global
  replacement over code, links and text. Known block directives are top-level
  only in v1; unsupported nesting is retained raw or source-only.
- Plain prose supports paragraphs, ATX/setext headings, emphasis/strong,
  ordered/unordered lists, links, blockquotes, inline code and fenced code.
  Normalize supported ordinary whitespace, fence style, list markers and JSON
  formatting as documented. Resolve reference-style links semantically. Preserve
  code content and link destinations; do not promise byte identity for supported
  ordinary Markdown. Tables, footnotes, images, HTML and other unimplemented
  constructs must be opaque/recoverable, not silently dropped.
- Preserve unknown directive/Markdown segments with their exact source slice,
  including line endings. Inert raw nodes may move as a unit but are never parsed
  as executable content. If surrounding structure cannot be safely separated or
  recreated, return whole-document recoverable source with an explanation and
  block visual editing. Diagnostics carry stable codes, paths and original
  line/column plus UTF-16 offsets; byte-size limits use UTF-8. Recompute locations
  after serialization; do not store stale locations as authored data.
- Template shorthand resolution uses an injected app adapter. Full snapshots
  parse structurally without catalogs. If required catalogs are unavailable for
  shorthand, preserve it in recoverable source and retain the last-valid guide;
  never create a blank replacement or guess catalog mappings.

### Limits and representative documents

Candidate limits below must be measured and frozen in BW-2001 before broad
integration. They are not browser performance evidence. Use a fixture below the
limits and boundary cases at the limit and just beyond it. Guide build counts are
independent of `MAX_BUILD_SET_ENTRIES = 16`.

| Boundary | Candidate default |
| --- | --- |
| Applied Markdown UTF-8 size | 1 MiB |
| Recoverable source buffer/file admitted into the workspace | 2 MiB |
| Semantic nodes / nesting | 20,000 total nodes / depth 32, including inline nodes |
| Embedded builds / skill mentions | 32 / 2,000 |
| Metadata | 64 KiB total, title/label 120 characters, summary 2,048, 24 tags of 40 characters, 64 source references |
| Diagnostics | First 100 with an explicit additional-diagnostics count |
| History | 100 meaningful entries and a conservative 16 MiB retained-state budget; evict oldest entries, never current state or recovery source |
| Typing grouping | Adjacent typing within 750 ms in the same text context; close on composition completion, selection move, blur or any non-typing command |
| Long-document fixture | Approximately 400 prose/list/code blocks, 16 builds and 600 mentions; measure exact node/byte totals before adopting it |

Use existing per-build shape/array limits as well. Check limits before mutation,
before expensive recursive traversal, and while tokenizing; JSON depth/duplicate
key checks must not happen only after an unbounded recursive validation walk.
Source over the applied limit but within the recovery limit remains exact in
source recovery, with raw download. Intake beyond the recovery ceiling rejects
the whole edit/import without replacing the existing buffer/document; keep the
original file untouched and explain the limit. Never truncate a draft to fit.
Storage quota is a separate failure path and must never be equated with these
accepted format limits.

Record long-document typing/composition, scrolling, history memory, source Apply
and rendering observations in the feasibility decision; freeze any numerical
performance target there, not after implementation. At minimum there must be no
lost characters, caret reset on catalog scrolling, whole-document remount on each
edit, or incorrect context after long scrolling.

### Transactions, source recovery and history

`GuideSession` owns the applied document, an optional exact source buffer with its
base revision, diagnostics, and transient editor/read state. The transaction
boundary accepts an explicit session/document identity, expected relevant
revision and operation. Validate the entire candidate result, then commit once.
Invalid/no-op/stale commands do not modify siblings, dirty state or history.
Selection, hover, filters, viewport, catalog sheet visibility, expanded reader
details and active card are transient.

One guide history stores before/after semantic states with structural sharing
and optional ephemeral selection mementos. Accepted typing, mention insertion,
slot plans, attribute/title/effect changes, rename/reorder/duplicate/delete,
fragment insertion and successful source Apply use it. Non-typing gestures form
one step; a drag is one step even if placement removes another elite. Undo/redo
restores the entire transaction, not only the text skeleton. New authored edits
after undo clear redo. No independent build history or vendor document history
is enabled. Undo restoration reconciles the vendor view without recording a new
transaction or interrupting composition.

Source typing edits a recoverable buffer, not the applied guide; it changes the
durability/dirty fingerprint and is autosaved. Native text-buffer correction is
not a second history of applied guide builds. Label document Undo distinctly in
source mode; while source is unapplied, resolving that buffer is required before
an applied-document undo or a return to visual editing can replace its basis.
Apply validates and resolves the whole buffer first, then commits one guide
history entry. Capture the prior recovery state with that entry so undoing Apply
does not lose its source input. Include one composition as one typing group and
do not serialize or apply midway through a composition event.

| Transition | Required behavior |
| --- | --- |
| Visual to source with no existing draft | Serialize applied state into the source editor; do not dirty just by viewing it. |
| Source typing or parse failure | Retain exact raw buffer, its base revision and diagnostics; applied document unchanged. |
| Valid Apply | Atomically replace applied content and complete snapshots; one undo entry; mark the source as applied. |
| Invalid/unsupported Apply | No partial replacement; preserve buffer and last-valid guide; offer diagnostic locations and raw download. |
| Unapplied source to visual | Offer Apply, Keep Editing Source, and explicit Discard Source Draft. Failed Apply stays in source. |
| Unapplied source to read | Show the last-applied guide with a visible notice and a route back to the retained source; reading performs no mutation. |
| Export with unapplied/invalid source | Offer separately labeled raw-source download and last-applied guide export; never claim failed parsing is a lossless semantic export. |
| Source operation completes after session/revision changes | Reject stale completion and retain its input for recovery; do not apply to a newly selected document. |

Named save, working draft and mixed backups retain both applied content and any
unapplied source. Regenerate diagnostics on hydration; raw source/base state are
durable, transient UI and undo stacks are not. Separate authored/recovery dirty
fingerprints from storage revision/catalog audit metadata. Selection and reading
must not trigger an authored dirty state or an autosave just because of focus.
An applied source buffer is a projection: discard or regenerate that clean buffer
when visual edits resume, so reopening source cannot show an older applied
revision. An unapplied buffer is never regenerated. Recovery strings need their
own byte-aware validators; do not run them through the existing 2,048-character
generic persistence string bound or any truncating name/notes normalizer.

### Identity, insertion intent and context

References are a discriminated union: generic; local build-bound; or explicitly
detached with original guide/build identity and reason. Missing local targets
retain the original binding, so undoing deletion restores resolution. Detached
external references remain detached after save/Apply/reload even if the
destination contains an equal-looking ID; repair requires explicit rebind.
Candidate syntax for the latter adds
`origin="guide-source" unresolved="external-fragment"` alongside `build`.
BW-2001 must freeze this syntax with a golden fixture.

Rename/reorder preserves all identities. Duplicating a build creates new local
and nested build IDs and deep-copies its complete snapshot; existing prose stays
bound to the original. Before deletion show the count/locations of affected
mentions with Cancel or Delete and Retain Unresolved Mentions. One undo restores
the build and its prior contextual displays together.

Structured clipboard fragments carry a format version and origin session/guide.
Allocate a fresh ID map for every copied build and contained reference together;
do not resolve by labels. Same-document moves preserve IDs/bindings. Same-document
copies remap included builds/references while references outside the copied
fragment keep their existing local target. On cross-document paste, references to
builds outside the fragment become detached even on ID collision. If origin
cannot be authenticated by the local clipboard session, treat it as external.
Plain Markdown fragment paste uses the same structural safety and detachment
rules; file Open imports a whole validated document, not a fragment. Full-guide
duplication/remapping must also preserve raw recovery source without rewriting
arbitrary invalid text: allocate a new session/library identity while keeping the
portable guide and its local IDs intact within that independent document. Scope
all live commands by session identity as well as portable ID, so opening two
copies cannot authorize cross-document placement. This differs from copying a
fragment into an existing guide, which always remaps included build identities.
Never regex-rewrite IDs inside opaque or invalid source.

Catalog intent is `prose(bookmark)`, `slot(buildId, slotIndex)`, or no valid
target. It is separate from the card whose details happen to be open. Selecting
text establishes a prose bookmark; choosing a slot explicitly changes intent.
Show the target label next to insertion controls. Generic is the default for
catalog-to-prose and name-completion insertion; an insert/edit context picker can
choose a named build. Bar-to-prose binds that bar's source build.

Bookmarks identify the workspace session, guide, semantic position and revision;
map them through accepted editor transactions. Catalog focus and independent
scrolling preserve them. Deleted positions, whole-document Apply/replacement and
document switches invalidate them unless an exact mapping exists. Do not fall
back to the last selected slot or append to an arbitrary paragraph. With no
valid bookmark, require a new target; an explicit Insert at End command may
create one. Narrow catalog sheets return focus to the initiating insertion
position or command.

Bound displays project mode, base/bonus ranks, titles and effects from the named
snapshot, independent of selected card. Generic displays show labeled catalog
descriptions/progression ranges and available mode variants without passing an
empty build that fabricates rank zero. Unknown skill/target/catalog states show
stored identities and repair options without guessing. Shared catalog lookup,
local icons and preview functions feed both author and reader. Inline-safe
triggers use spans/buttons with portal tooltips and hover/focus/touch behavior;
do not nest interactive controls illegally or introduce duplicate DOM IDs across
cards. Long names and missing icons remain readable.

### Explicit drag and keyboard contract

Use a versioned internal payload plus an in-memory drag-session token. Include
origin workspace/session/document, source kind, catalog ID or source build/slot,
and a source snapshot/slot fingerprint including raw overlay facts. Target
document/build/slot or mapped text caret comes from validated hit testing and is
included in the command, not trusted from arbitrary external MIME data. Recheck
all identities/fingerprints on commit and on async completion. Reorder is safe
through IDs; deletion, document replacement, changed source facts or lost target
mapping is a clear no-op. Do not use an app-wide active-card fallback.

| Source / target | One committed result |
| --- | --- |
| Catalog to prose | One generic atomic mention at visible drop caret; no build mutation. |
| Catalog between blocks | One paragraph with one generic mention. |
| Catalog to build slot | Existing placement plan on that exact target, selected or inactive. |
| Within one build bar | Existing move/swap including raw-overlay movement. |
| Between build bars | Copy resolved skill through target placement plan; source unchanged. Unresolved raw-only sources that cannot satisfy existing placement rules receive an explicit no-op, never a guessed catalog ID. |
| Build bar to prose | Bound mention for the source build; all bars unchanged. A source without a catalog skill identity is explained as unavailable for a skill mention. |
| External text / malformed payload | Safe ordinary text paste/drop or explicit no-op; never a guessed slot edit. |

Show the caret/slot before drop; consume a slot drop once and stop propagation
before prose handlers. Track success/cancel explicitly. Guide `dragend` must not
inherit the current remove-on-`none` behavior. Slot removal is a separate explicit
action. Keep legacy standalone behavior under its own handler and regression
coverage rather than accidentally changing it while adding guide semantics.
Keyboard/click pick-place-cancel uses the same commands and announcements, with
Escape cancellation and focus restoration. Mention insertion does not run
skill-bar legality or unrelated profession filters.

### Durability and integration sequencing

Use a guide snapshot version 1 within library envelope version 3 and backup
version 3 as candidate execution defaults. Continue reading historical library
v1/v2 and backup v1/v2, including Build migrations and build-set v1/v2/party data.
Keep `build-wars:v1` as the existing storage key unless inspection reveals a
necessary compatibility change; the key is not the schema version. No legacy
guide records exist. Older clients must reject a newer envelope rather than
partially writing it. Migration is read-only until a deliberate write and does
not dirty the loaded draft.

BW-2003 may introduce runtime guide types and clone/fingerprint contracts needed
by transactions. Until BW-2009 completes versioned storage, guide writes through
the old envelope are explicitly blocked and labeled non-durable in development;
preserve the preceding durable draft. Do not serialize a guide under library v2
or ship the intermediate authoring surface as complete. BW-2009 owns the full
version bump, migration/write activation and storage acceptance. Temporary
guards must be removed or replaced by real durability state before closeout.

Audit document-kind branches in workspace state, composer selectors, library
selectors/dialogs, backup ID remapping, build-set/party transfer and template
controls. Use exhaustive switches and explicit unsupported-operation outcomes.
Generic backup supports mixed documents; build-set/party-only transfer remains
scoped and must never coerce a guide. Record/library IDs can remap independently
of a guide's portable local identities. Reuse the fragment/guide remapper only
when actually duplicating authored identity.

Autosave and pagehide include all snapshots plus recoverable source. Preserve
prior catalog audit facts when catalogs are unavailable; use explicit unknown
facts for new guides and do not claim fresh game validation. Storage denial,
quota exhaustion, corruption, newer schemas, stale revision and cross-tab
conflict retain data and visible banners; failed writes never report durability.
Keep rejected stored payloads intact, provide raw recovery/download where
available, and require existing explicit recovery choices before overwriting.
The recovery shell must remain mounted on catalog errors. Full guide text and
stored IDs stay readable/exportable; disable dependent catalog/build operations
without substituting an empty guide.

Guide Markdown upload/download is separate from game-folder files. Template
Load/Save/Copy binds an explicit card identity and opening revision; cancellation,
rejection or stale completion changes nothing. Copy reports existing exact-source
versus canonical fidelity and the fact that a game code omits guide prose and
bonus metadata. Incomplete cards remain useful when either export path is blocked.

## Implementation

All tasks below are future work. Proposed filenames are cohesive boundaries, not
claims that these files exist. Complete each ticket's incoming dependencies and
its gate before marking it done or advancing dependent ticket acceptance. Reuse
early evidence at closeout only if it still matches the final implementation.

### Phase 1 — Contracts and rendered feasibility (BW-2001)

Dependencies: completed EPIC-01, 04, 05, 06, 09, 16, 18 and 19; confirm their
recorded completion through runner preflight. Do not bypass clean-tree or active
sprint checks. The outer runner owns execution and commits.

Files: `compendium/guide-workspace.md`; new
`compendium/decisions/0021-guide-document-editor.md`; a bounded development-only
slice under `src/app/guide-feasibility/`; focused fixtures/tests; eventual
`package.json` and `package-lock.json` only after selection; evidence under
`work/runs/sprint-021/` using repository retention conventions.

- [ ] Recheck scaffold consumers, full Build v4/raw-overlay fields, inline DOM,
  active editor assumptions, placement and cancellation semantics, all persistence
  unions, catalog failure and save-without-catalog behavior.
- [ ] Compare the two candidate stacks using official current docs/license files,
  concrete package versions, compatibility, accessibility and measured bundle
  impact. Record source URLs/retrieval date and unresolved restrictions.
- [ ] Implement only the feasibility paragraph, atomic inline mention and one
  editable build control; bridge one history across typing and build changes.
  Include no-build catalog insertion, unknown ID and unsupported-content probes.
- [ ] Freeze dialect/syntax/version, snapshot/code authority, detached reference
  encoding, escaping/spans, source Apply, bookmark mapping, ID generation, limits,
  history grouping and the long-document fixture with concrete examples.
- [ ] Record ownership rules and why the selected stack passes; consolidate the
  successful slice into production modules later, removing temporary harness code.

Gate: actual browser typing, focus traversal into/out of the build control,
mention boundary navigation, a basic IME composition, editing the build, undo
through both build and prose, and semantic serialize/parse/reconcile must work
without loss or duplicate authority. Add focused codec/history assertions. Record
browser/version, actions, results and evidence paths. No package commitment or
BW-2002 completion on a library comparison alone. If required browser access is
unavailable, BW-2001 remains incomplete.

### Phase 2 — Semantic model and loss-preserving codec (BW-2002)

Dependencies: BW-2001 passed.

Files: evolve `src/domain/guide.ts`, `ids.ts`, `index.ts` and
`test/domain/contracts.test.ts`; add `src/domain/guide-references.ts`,
`src/guide/{build-snapshot,markdown,validation,limits}.ts`,
`src/app/guide-build-adapter.ts`, `test/domain/guide.test.ts`,
`src/guide/markdown.test.ts`, `src/app/guide-build-adapter.test.ts` and
`test/fixtures/guides/`.

- [ ] Replace the unused section scaffold with the versioned neutral tree and
  metadata, preserving the established Build contract and barrel boundaries.
- [ ] Implement full payload conversion with field-complete deep clone/hydration;
  preserve adjustments, title/effect preferences, budget and every raw overlay.
- [ ] Implement bounded parse/serialize with atomic success or recoverable-source
  outcomes, shorthand injection, deterministic conflict/duplicate diagnostics,
  stable namespaces and precise source locations.
- [ ] Implement opaque segments and safe whole-source fallback for unsupported
  structure, including annotation-looking code and escaped text.
- [ ] Implement pure generic/local/detached resolution and reference-aware
  duplication/fragment remapping, including colliding destination IDs.

Gate: semantic parse/serialize/parse equality for plain prose, two variants,
complete/incomplete/unresolved builds, rich metadata and bonuses; exact opaque
segments after unrelated edits; no catalog dependency for full snapshots. Golden
fixtures cover duplicate keys/IDs, conflicting code/payload, unsafe links,
malformed/unknown versions, annotation escaping, UTF-8 boundaries, source spans,
deep/oversized input and collision-safe remapping. Existing domain contracts pass.

### Phase 3 — Guide workspace, transactions and history (BW-2003)

Dependencies: BW-2002 passed.

Files: new `src/app/guide-state.ts`, `guide-history.ts`, `guide-transfer.ts` and
their tests; modify `workspace-state.ts`, `composer-selectors.ts`,
`persistence-schema.ts` for runtime/materialization contracts and exhaustive
temporary write guards; extend workspace/dirty regression tests.

- [ ] Add runtime guide documents with explicit selected build and independent
  text intent; keep every owned snapshot complete. Reject untargeted guide
  `editor` actions and mismatched session/revision operations.
- [ ] Route text deltas, build reducer results, imports, duplication, deletion,
  reorder and Apply through one atomic transaction entry point.
- [ ] Implement bounded chronological undo/redo, typing/composition grouping,
  gesture boundaries, no-op handling and UI-only exclusions.
- [ ] Implement delete impact/Cancel/retain-unresolved behavior and fragment
  transfer identity rules. Add stable bookmark mapping/invalidation contracts.
- [ ] Implement last-valid/source-buffer state and semantic/recovery fingerprints;
  selection cannot contaminate either. Gate old-envelope writes as described
  above until Phase 9; keep earlier durable drafts protected.

Gate: reducers restore a prose → slot → attribute → delete sequence and redo it
with IDs, overlays and references intact. Two variants remain isolated across
repeated selection, targeted inactive edits, duplicate/reorder and undo. Test
history count/byte eviction, source Apply boundaries, rebind, cross-document
collisions, stale/canceled commands and prior standalone/build-set workspace
behavior. No active snapshot can disappear from materialization.

### Phase 4 — Rendered editor and authoring catalog shell (BW-2004)

Dependencies: BW-2001, BW-2002 and BW-2003 passed.

Files: new `src/app/guide-editor-adapter.ts`,
`components/GuideWorkspace.tsx`, `GuideEditor.tsx`, `GuideInsertMenu.tsx`;
modify `App.tsx`, `BuildComposer.tsx`, `FocusedSkillCatalog.tsx`, shared filter
selectors/controls and `styles.css`; add editor/workspace/catalog integration tests.

- [ ] Promote the selected feasibility bridge; implement required blocks/marks,
  keyboard Markdown shortcuts, list editing, normal safe paste and small insert
  commands. Preserve semantic deltas without rebuilding the editor per keystroke.
- [ ] Add clear composer/Guide entry points using current replacement guards;
  preserve drafts on cancel. Expose temporary non-durability honestly until Phase 9.
- [ ] Decouple searchable catalog UI/filter state from slot placement; support
  prose/slot/no-target intent and zero-build guides with generic display.
- [ ] Retain bookmarks while the catalog gains focus/scrolls. Add independent
  desktop scrolling and a narrow dismissible catalog sheet/tab with focus return.
- [ ] Keep editable prose and non-editable build/mention shells structurally
  valid. Audit unique control/ARIA IDs when components repeat.

Gate: component tests cover intent and state wiring; actual browser evidence
shows typing/formatting, lists, paste, keyboard insertion, no-build catalog use,
composition and cursor movement around embeds, catalog focus return, long-document
scrolling, both themes and narrow layout. A textarea plus preview does not pass.
Catalog clicks while writing must never edit the previously selected bar.

### Phase 5 — Complete editable build cards (BW-2005)

Dependencies: BW-2003 and BW-2004 passed.

Files: new `components/GuideBuildCard.tsx`, `GuideBuildInspector.tsx` and build-card
tests; extend `guide-build-adapter.ts`, `guide-state.ts`; adapt shared
`SkillBar.tsx`, `ComposerHeader.tsx`, `FocusedAttributeEditor.tsx`,
`TitleRankPanel.tsx`, `InlineTemplateCode.tsx`, template dialogs/file controls,
`template-import.ts` and `template-workflow.ts` only where explicit targeting needs it.

- [ ] Insert blank builds, template shorthand, copied current builds and saved
  build records; allocate new identities and deep-copy full durable snapshots.
- [ ] Render label, professions/mode, eight slots and truthful copy-template
  status for every card. Show one selected inspector with current attributes,
  rune/headgear, title and assumed-effect controls; no repeated full panels.
- [ ] Use existing reducers/validation/preview functions on addressed snapshots.
  Keep incomplete/unresolved builds editable and preserve overlays on unrelated edits.
- [ ] Add rename/reorder/independent duplicate/reference-aware delete to shared
  guide history. Synchronize card label/build-name policy explicitly; default to
  renaming both for user-facing consistency without changing IDs.
- [ ] Bind Load/Save/paste/copy to the named card and captured revision. Check
  cancellation/errors and stale async results before mutation; retain existing
  omission/fidelity messages and all siblings/prose.

Gate: two variants with different base ranks, runes/headgear, title overrides,
mode, budget and effects survive all card actions and targeted imports. Test
incomplete/unresolved templates, duplicate independence and canceled Load/Save.
Browser evidence covers expanded controls and template copy for each addressed
card. Existing standalone controls/template regression tests continue to pass.

### Phase 6 — Inline references and explicit tooltip context (BW-2006)

Dependencies: BW-2002, BW-2004 and BW-2005 passed.

Files: new `src/app/guide-selectors.ts`, `components/GuideSkillMention.tsx`,
`GuideReferenceDialog.tsx` and reference tests; adapt `editor-selectors.ts`,
`SkillTooltip.tsx`, `SkillDisplay.tsx` and the editor bridge.

- [ ] Add atomic inline mentions, name completion or equivalent insert command,
  Generic/named-build picker and explicit repair/rebind actions.
- [ ] Factor shared display projection so generic ranges and bound-build values
  have explicit inputs; retain shared mode/title/bonus/effect logic and local icons.
- [ ] Preserve missing skill/context identities and visible unresolved reasons.
  Catalog selection and card selection cannot persistently retarget a mention.
- [ ] Provide valid inline wrapping and accessible hover/focus/touch tooltips,
  readable long names and missing-icon fallback.

Gate: the same skill under two different bound contexts retains distinct values
after selecting another/third card; generic never borrows a rank and works with
zero builds. Test move/copy, text editing around atoms, delete/undo, catalog focus
return, missing context and explicit repair. Browser checks cover keyboard,
hover, touch-capable interaction and wrapping without character corruption.

### Phase 7 — Multi-build drag and keyboard placement (BW-2007)

Dependencies: BW-2005 and BW-2006 passed.

Files: modify `drag-payload.ts`, `SkillBar.tsx`, `FocusedSkillCatalog.tsx`,
`skill-bar-actions.ts`/`skill-bar-workflow.ts` only as needed; add
`src/app/guide-placement.ts` and integration tests; extend guide state/editor bridge.

- [ ] Implement every architecture drop-matrix row with versioned bounded MIME,
  live session validation, source fingerprints and explicit target commands.
- [ ] Show insertion caret/slot before drop, route inactive-card placement through
  that snapshot's existing planner, and consume nested drops exactly once.
- [ ] Preserve same-bar overlays, duplicates/elites and cross-build source state.
  Guide canceled drags never invoke the legacy drag-end removal path.
- [ ] Add equivalent click/keyboard pick-place/cancel with announcements and
  focus restoration. Treat external text/malformed/stale/deleted sources safely.

Gate: target-isolation and payload-boundary cases include reordered/deleted cards,
changed source slots, document switches, cancel, raw overlays and an inactive
target. Actual native pointer drops and keyboard equivalents cover every matrix
row, nested slot targets and scrolling. Synthetic jsdom drop events alone cannot
complete this ticket.

### Phase 8 — Source editing and Markdown interchange (BW-2008)

Dependencies: BW-2002, BW-2003, BW-2004, BW-2005 and BW-2006 passed.
Phase 7 precedes this phase in this execution sequence, although it is not an
additional source-ticket dependency.

Files: new `components/GuideSourceEditor.tsx`, `GuideTransferDialog.tsx`,
`src/app/guide-files.ts` and source/file tests; extend `guide-state.ts`,
`guide-transfer.ts`, codec and workspace replacement handling.

- [ ] Implement exact source buffer, location diagnostics and explicit atomic
  Apply; implement every transition in the architecture table.
- [ ] Provide validated Markdown upload/paste import and self-contained download
  with separate raw/applied choices, safe filenames and cancellation/error handling.
- [ ] Preserve metadata, independent snapshots, context and opaque bytes through
  visual/source/export/import; explain permitted normalization.
- [ ] Apply identical limits and inert-content rules to file, clipboard, source
  and drag-text paths. Do not allow vendor HTML paste to bypass the codec boundary.

Gate: visual → source → Apply → export → import equality for independently
modified variants; invalid or unsupported source cannot partially alter either
build. Test malformed/partial source, hostile URLs/HTML, unknown content, escaped
annotations/code fences, stale async input and boundary-size files. Actual browser
download/reimport, cancellation and valid/invalid view transitions must be recorded.

### Phase 9 — Local guide Save/Open, migration and recovery (BW-2009)

Dependencies: BW-2003 and BW-2008 passed.

Files: `persistence-schema.ts`, `local-storage.ts`, `workspace-state.ts`,
`backup-restore.ts`, `library-selectors.ts`, `composer-selectors.ts`,
`build-set-transfer.ts`, `party-transfer.ts`, `App.tsx`, storage/library dialogs;
new minimal `components/GuideLibraryDialog.tsx`; extend persistence, backup,
workspace, local-storage and app tests with old/new/mixed fixtures.

- [ ] Introduce guide snapshot v1 and library/backup v3; migrate historical
  envelopes without writes on read or false dirty state. Preserve build/build-set
  snapshots, party annotations, record associations and working drafts.
- [ ] Audit and implement every hydrate/materialize/clone/fingerprint/name/filter/
  duplicate/remap/restore branch, including helpers with non-build fallthrough.
  Make build-set/party-only operations explicitly unavailable for guides.
- [ ] Expose minimal named guide Save/Open and autosave/pagehide using existing
  storage mechanisms. Save both applied document and recoverable source; exclude
  history/focus. Remove Phase 3 temporary storage guards only after real support.
- [ ] Correct catalog-error recovery and catalog-dependent `savedWith` handling;
  preserve stored text/IDs and audit facts, disable dependent editing, retain
  source/raw/applied exports and safe plain-text recovery.
- [ ] Preserve quota/denial/corruption/newer-schema/conflict protections and
  rejected payloads. Failed writes keep pending in-memory work and offer download;
  never show a successful save or overwrite protected data.
- [ ] Keep Markdown transfers separate from game-folder templates and avoid
  restoring obsolete general library/equipment/party UI merely for guide access.

Gate: named Save/Open/reload restore every variant, context and invalid/unapplied
buffer; catalog failures retain recovery/export. Old build/build-set/party drafts
and mixed backups survive migration/merge/restore, ID collisions and cancellation.
Test active snapshots, pagehide flush, read-only migration, quota/denial, malformed
and newer envelopes and two-tab revision conflicts. Browser evidence must include
Save/Open, reload with invalid source and storage-unavailable download fallback.

### Phase 10 — Reading and variant navigation (BW-2010)

Dependencies: BW-2005, BW-2006, BW-2008 and BW-2009 passed.

Files: new `components/GuideReader.tsx`, `GuideNavigation.tsx`; shared guide
selectors/build-card/mention renderers, workspace view state and `styles.css`;
reader/action-boundary tests.

- [ ] Render the same applied tree and snapshot projections with catalog/mutation
  controls hidden; retain complete compact cards, tooltips and template copying.
- [ ] Add accessible heading navigation and stable direct variant anchors,
  keyboard focus management and read-only expand/collapse of detailed inputs.
- [ ] Preserve source draft and reasonable editor selection on return; display
  last-applied notice when source is unapplied. Do not serialize reading choices.
- [ ] Share local asset fallback, safe external links and responsive long-name
  behavior. Local anchors must not be mistaken for hosted publishing or trigger
  the existing game-template share-fragment hydration path.

Gate: reader can visit both variants, inspect bonuses and copy each correct
template. Read navigation, collapse, tooltips and copying leave fingerprints and
history unchanged. Browser evidence covers generic/bound/missing references,
unapplied source, edit/read return, headings/anchors, narrow layouts and 200% zoom.

### Phase 11 — Original example and integrated workflow coverage (BW-2011)

Dependencies: BW-2005, BW-2006, BW-2007, BW-2008, BW-2009 and BW-2010 passed.

Files: new original runtime sample under `src/app/examples/dagger-guide.md`,
fixture variants in `test/fixtures/guides/`, integrated
`src/app/guide-workflow.test.tsx`, example loading entry point, and repeatable
browser scenario instructions under `work/runs/sprint-021/` or a durable linked
repository evidence path.

- [ ] Author two original dagger-themed variants with headings, prose, generic
  and bound mentions, optional slots described in prose, template input, differing
  rune/headgear contributions, recommendations, usage, counters and related links.
- [ ] Validate real fixture catalog IDs and codes through existing codecs; mark
  the sample as an interaction example, not a current-meta recommendation.
- [ ] Include linked-only provenance without copied PvX prose/ratings/page bodies,
  new remote images or any live PvX request. Do not fabricate revisions/licenses.
- [ ] Add an explicit non-destructive Load Example action with normal draft
  replacement handling; never install it over a draft during app startup.
- [ ] Integrate write/reference/drop/build/undo/source/save/reload/read/export/
  reimport scenarios and the frozen long-document fixture. Include unresolved
  raw template facts, detached/missing contexts and a separate zero-build guide.

Gate: repeatable end-to-end sample authors prose, inserts one skill in text and
one in a build, changes bonuses, saves, reloads and reads. Export/reimport
preserves both snapshots and contextual values. Integrated tests assert meaning,
identity and source policy rather than snapshots of generated markup. Prepare
the exact browser data and steps for Phase 12.

### Phase 12 — Actual browser matrix and closeout (BW-2012)

Dependencies: every BW-2001–BW-2011 ticket has passed its gate.

Files: final fixes in the affected modules; evidence index under
`work/runs/sprint-021/`; update `compendium/guide-workspace.md`, README if needed,
all twelve ticket records, EPIC-20, executing sprint, ledger and runner-owned burn
result manifest through the normal closeout process. This planning lane changes
none of those records.

- [ ] Execute the following matrix on the implemented product; record timestamp,
  commit, browser/version, OS/input method, viewport, zoom, theme, fixture,
  actions, expected/actual result and screenshot/video/log/download paths.
- [ ] Resolve regressions and rerun affected scenarios. Associate each acceptance
  criterion with implementation and evidence. Early slice evidence is not proof
  of the final integrated workflow unless replayed or demonstrably unchanged.
- [ ] Run full repository verification with the pinned npm on PATH, so npm child
  scripts do not silently use the login shell's older npm.
- [ ] Update status and follow-up documentation consistently. Keep discovery,
  PvX intake and publishing explicitly deferred. Only the outer runner owns
  execution commits and final result/ledger authority.

| Evidence group | Required browser scenarios |
| --- | --- |
| Feasibility and writing | Paragraph/mention/editable-build shared history and round trip; headings/marks/lists/link/code editing; normal paste; keyboard entry commands; real composition/cursor behavior before/after inline and block embeds. |
| Targets and dragging | Every drop-matrix row using native pointer interaction; visible text caret and between-block insertion; nested/inactive slot; same-bar move/swap/raw overlay; cross-build copy; bar-to-bound-mention; malformed/external text; cancellation, changed/deleted/reordered source and document switch. Replay valid actions using keyboard/click equivalents. |
| Context and history | Two distinct bound values, generic range and missing context after selecting another/third card; hover/focus/touch tooltip interaction; chronological prose/slot/attribute/duplicate/delete/Apply undo and redo; surrounding character integrity. |
| Source and interchange | Valid/invalid Apply, unknown/opaque content, source-to-read last-applied notice, raw versus applied export, actual downloaded Markdown reimport, failed/canceled upload, full snapshots and identity preservation. |
| Durability and failures | Named Save/Open, reload, invalid-source recovery, autosave/pagehide, unavailable storage export, quota/conflict protections, unavailable catalogs with retained text/IDs/recovery, mixed backup/restore without damage to old records. |
| Reading and access | Direct heading/variant navigation, detail collapse, correct template copy, edit/read return; keyboard-only navigation, focus restoration, readable long names/missing icons and no dirty changes from reading. |
| Layout and long documents | Both themes; desktop document/catalog independent scrolling; narrow catalog sheet/tab; 200% zoom; long document before/after insertion, selection, undo and navigation. |
| Existing workflows | Compact standalone composer, game template Load/Save/folder fallback and cancellation, attributes/runes/headgear/titles/effects, build-set/party persistence and backups. |

Candidate browser coverage to freeze in BW-2001: full workflow in a current
Chromium browser, plus actual focus/composition/clipboard/read and pointer smoke
coverage in Firefox and WebKit/Safari where supported. Record installed versions,
do not infer compatibility from an engine name. Exercise the native folder path
in a supporting browser and the existing upload/download fallback where it is
unavailable. Use desktop around 1440×900 and narrow around 390×844 as reproducible
starting viewports; record actual values and whether touch is emulated or physical.
Real IME testing must identify the input method; synthetic composition events are
additional coverage, not equivalent evidence. Once the matrix is fixed, missing
required browser/input scenarios leave their ticket and the epic incomplete.

Future focused validation uses the pinned toolchain and real relevant suites,
for example after the indicated new files exist:

```sh
PATH="$PWD/work/runs/toolchain/node_modules/.bin:$PATH" work/runs/toolchain/node_modules/.bin/npm run test:run -- test/domain/guide.test.ts src/guide/markdown.test.ts src/app/guide-state.test.ts src/app/guide-workflow.test.tsx
```

Also run affected existing composer, template compatibility/workflow/files,
attribute preview/adjustment/title, workspace, persistence, backup, build-set and
party tests at their integration phases. Final required commands:

```sh
PATH="$PWD/work/runs/toolchain/node_modules/.bin:$PATH" work/runs/toolchain/node_modules/.bin/npm run verify
git diff --check
```

Confirm the pinned tool exists and is npm >=11.10.1 under Node >=22.11.0 before
execution. An unavailable toolchain is a recorded gate, not permission to install
or bypass sandbox restrictions in this planning lane. `verify` includes
format/lint/typecheck/Vitest/build, ingestion tests and ticket-runner tests. No
passing test count is prescribed; record actual outcomes and failures. Component
tests, screenshots of static CSS, dry-run selection and backlog preparation
cannot substitute for the browser evidence above.

## Files Summary

| Files / area | Planned change and owning phases |
| --- | --- |
| `src/domain/guide.ts`, `guide-references.ts` (new), `ids.ts`, `index.ts` | Neutral semantic tree and identity/context contracts; Phase 2. |
| `src/guide/{build-snapshot,markdown,validation,limits}.ts` (new) | Complete neutral payload, bounded codec and opaque recovery; Phases 1–2, 8. |
| `src/app/guide-{build-adapter,state,history,transfer,editor-adapter,selectors,placement,files}.ts` (new) | Explicit targeting, one history, editor bridge, context, transfer and IO; Phases 2–9. |
| `src/app/components/Guide*.tsx` (new) | Workspace/editor/insertion, cards/inspector, mentions/rebind, source/transfer/library, reader/navigation; Phases 4–10. |
| `App.tsx`, `workspace-state.ts`, `composer-selectors.ts` | Document entry points, guide routing, dirty/recovery/materialization and catalog-independent shell; Phases 3–4, 9–10. |
| `BuildComposer.tsx`, `FocusedSkillCatalog.tsx`, `SkillBar.tsx`, `SkillTooltip.tsx`, shared filters/display/selectors | Explicit intent/context, inline-safe tooltips, addressed drag/control reuse; Phases 4–7. |
| `ComposerHeader.tsx`, `FocusedAttributeEditor.tsx`, `TitleRankPanel.tsx`, template controls/dialogs/workflow/import | Reusable addressed card controls and truthful template IO; Phase 5. Existing adjustment/effect/preview modules remain the rule authority. |
| `persistence-schema.ts`, `local-storage.ts`, `backup-restore.ts`, library selectors/dialogs, build-set/party transfer | New guide variant, exhaustive branches, migration and mixed recovery; groundwork in Phase 3, complete support Phase 9. |
| `src/app/styles.css` | Guide layout, inline/atomic boundaries, themes, responsive catalog and reading; Phases 4–10. |
| `test/domain/guide.test.ts`, `test/domain/contracts.test.ts`, new guide unit/component tests and existing regression suites | Semantic, boundary, history, identity, integration and compatibility coverage throughout. |
| `test/fixtures/guides/`, `src/app/examples/dagger-guide.md` (new) | Golden/hostile/unresolved/migration/long fixtures and original runtime example; Phases 1–2, 9, 11. |
| `package.json`, `package-lock.json` | Only editor/parser packages selected by the real BW-2001 gate; no speculative platform dependencies. |
| `compendium/decisions/0021-guide-document-editor.md` (new), guide brief, optional README, ticket/sprint/ledger/result records and evidence index | Frozen contracts and truthful evidence/closeout; Phases 1, 12. |

This draft itself is the only artifact written by this assignment. The table
describes future execution changes, not changes made while planning.

## Definition of Done

- [ ] BW-2001 official-doc/package evaluation and actual-browser slice pass;
  editor, syntax, limits and history contracts are frozen with rejected options
  documented. No untested dependency assumption becomes completion evidence.
- [ ] BW-2002 neutral semantic codec preserves supported authored meaning and
  exact opaque segments, or returns recoverable whole source without replacement;
  namespace/conflict/duplicate/hostile/oversized cases have deterministic outcomes.
- [ ] BW-2003 one bounded chronological history includes prose and complete build
  edits, Apply and structural operations; UI-only actions stay clean; snapshots,
  IDs and references survive undo/redo and remapping.
- [ ] BW-2004 rendered writing, required Markdown vocabulary, explicit catalog
  intent, no-build insertion, bookmarks, responsive access and keyboard/focus/IME
  gates pass while the standalone composer remains available.
- [ ] BW-2005 complete Build v4 ownership and existing adjustment/title/effect
  controls work for independent variants; card lifecycle and addressed template
  operations preserve siblings and unresolved raw facts.
- [ ] BW-2006 generic/bound/missing/detached references retain identity and correct
  context through selection, text moves, deletion/undo and explicit repair; inline
  tooltips work through hover, keyboard and touch.
- [ ] BW-2007 every drop-matrix action and keyboard equivalent passes with visible
  targets, inactive-card isolation, exactly one transaction and safe stale/cancel
  handling; duplicate/elite/raw-overlay behavior stays intact.
- [ ] BW-2008 atomic Apply, raw/applied export and validated import preserve full
  supported state and unknown source; all view transitions are explicit and
  cancellation/errors leave the previous guide intact.
- [ ] BW-2009 Save/Open/reload/autosave/pagehide and mixed backup/restore preserve
  guide snapshots/context/source and old build/build-set/party records. Migration
  does not write on read. Quota/denial/corruption/newer-version/conflict/catalog
  failures remain visible, recoverable and exportable.
- [ ] BW-2010 read view shares applied meaning, contextual displays and template
  fidelity; anchors, details and read/edit return work without dirty/history edits.
- [ ] BW-2011 original two-variant example, zero-build/unresolved cases and the
  frozen long-document fixture exercise the complete workflow without copied
  community prose, meta claims or unauthorized assets/network requests.
- [ ] BW-2012 final actual-browser evidence covers the full agreed matrix, both
  themes, narrow screens, 200% zoom, native pointer drops, keyboard, real IME,
  source/storage/transfer recovery and existing workflow regressions.
- [ ] Inputs remain inert; safe links, parser/clipboard limits and local-asset
  boundaries are covered by tests and browser/network observation where relevant.
- [ ] Final pinned-toolchain `npm run verify` and `git diff --check` pass, defects
  are resolved, and durable evidence links explain any limitation. A required gap
  leaves the affected ticket/epic incomplete.
- [ ] Ticket/epic/sprint/ledger/burn-result status agrees; the outer runner owns
  commits/closeout; follow-up discovery/intake/publishing remains explicitly open.

## Risks

| Risk / long-range trade-off | Mitigation and stop condition |
| --- | --- |
| Rich editor and React controls disagree on focus, composition or history. | Test the real paragraph/mention/build slice first. Keep one bridge/history and no per-keystroke remount. Failure of both candidates blocks downstream commitment. |
| Canonical tree and vendor projection drift over time. | Vendor nodes hold handles; all changes cross a revisioned transaction boundary. Test bidirectional mapping, unknown content and undo; never publish vendor JSON. |
| Neutral complete payload duplicates app field definitions. | Limit duplication to a boundary contract with field-complete adapter tests. Build v4 remains the one game model; future schema changes must update round-trip fixtures. |
| Active-card convenience mutates or previews the wrong variant. | Populated canonical snapshots, explicit target/context union, stale async guards and same-skill/different-context fixtures. No implicit selected-card fallback. |
| Format becomes impossible to evolve without losing unfamiliar syntax. | Independent versioning, exact opaque slices, detached identity encoding and source-only recovery. Reject unsupported known payload versions instead of projecting a subset. |
| Fragment/backup duplication retargets by coincidental ID or destroys invalid source. | Separate library/session/portable identities; one validated remap path for supported fragments; preserve invalid raw text unchanged and detach uncertain context. |
| Large history/source/library amplifies memory or localStorage cost. | Frozen representative limits, structural sharing, count/byte history caps, measured long fixture and honest quota/export path. Do not impose the unrelated build-set cap. |
| Library version change harms older documents or cross-tab sessions. | Read-only migrations, exhaustive unions, mixed fixture coverage and revision/write-block gates. No v2 guide writes; older app versions reject newer envelopes. |
| Catalog loss removes the recovery UI or blocks autosave. | Recovery shell independent of validation; retain catalog audit facts/unknowns and exact source; structurally parse full snapshots without catalog access. |
| Generic range rendering accidentally uses zero or active-build ranks. | Explicit generic projection and no-build tests. Any fallback that invents ranks fails context acceptance. |
| Legacy drag-end deletion leaks into prose/cross-build/canceled drags. | Guide outcome-specific callbacks and native browser cancellation tests; source snapshots must remain equal for copy/mention/cancel. |
| Volume encourages closing a prototype or skipping accessibility/browser work. | Twelve ticket gates remain intact; no epic closeout without full evidence. If a split becomes necessary, report completed/pending gates explicitly without naming another sprint. |
| Source fixtures drift into unreviewed copied community content. | Original prose, linked-only references, approved local assets and existing source-policy review boundaries; no crawler or automatic remote fetch. |

## Security

Treat every guide, clipboard payload, stored envelope and file as untrusted data.
Render no executable HTML, JSX or MDX; do not evaluate annotations or source
metadata. The ordinary rich editor's HTML paste path must be converted to the
same bounded safe vocabulary, or plain text, before mutation. Unknown HTML is
inert raw/source; never mount it with `dangerouslySetInnerHTML`.

Allow user-activated `https:`, `http:`, `mailto:` and valid local fragment links
under a single shared URL policy; reject encoded/control-character attempts at
unsafe schemes, `javascript:`, `data:`, `file:` and protocol-relative remote
embeds. Source text remains recoverable even when a link is not clickable.
External new-tab links use safe opener behavior. Remote image/iframe/media/embed
syntax is inert text/link, never a request; skill/rune imagery uses existing
approved local assets and fallback labels. Test parsing/rendering hostile samples
does not initiate remote network requests.

Bound bytes, nesting, arrays, metadata, diagnostics and clipboard MIME before
recursive processing. Reject duplicate JSON keys, prototype-pollution keys,
non-finite/unsafe numbers, invalid slot indexes and conflicting identity fields.
Missing catalog facts differ from malformed shape: preserve the former rather
than discarding user data. Validate drag-session tokens and live source/target
facts; custom MIME is not trusted authority. Use safe download filenames and
release generated object URLs. No backend upload, remote fetch or folder sync is
introduced. Follow [source policy](../../../compendium/source-policy.md); provenance
metadata records facts, not redistribution approval.

## Dependencies

External epic dependencies are EPIC-01, EPIC-04, EPIC-05, EPIC-06, EPIC-09,
EPIC-16, EPIC-18 and EPIC-19, reported completed by the intent and to be checked
through normal execution preflight. Preserve the exact source-ticket DAG:

| Ticket | Required predecessor tickets | Execution phase |
| --- | --- | --- |
| BW-2001 | Completed epic dependencies | 1 |
| BW-2002 | BW-2001 | 2 |
| BW-2003 | BW-2002 | 3 |
| BW-2004 | BW-2001, BW-2002, BW-2003 | 4 |
| BW-2005 | BW-2003, BW-2004 | 5 |
| BW-2006 | BW-2002, BW-2004, BW-2005 | 6 |
| BW-2007 | BW-2005, BW-2006 | 7 |
| BW-2008 | BW-2002, BW-2003, BW-2004, BW-2005, BW-2006 | 8 |
| BW-2009 | BW-2003, BW-2008 | 9 |
| BW-2010 | BW-2005, BW-2006, BW-2008, BW-2009 | 10 |
| BW-2011 | BW-2005, BW-2006, BW-2007, BW-2008, BW-2009, BW-2010 | 11 |
| BW-2012 | BW-2001 through BW-2011 | 12 |

Implementation uses the current React 19/TypeScript/Vite application, Build v4,
approved catalogs/local assets, existing game-template compatibility boundary and
strict local-storage machinery. Candidate editor/parser dependencies have no
chosen version until BW-2001 proves compatibility/license/bundle/browser gates.
No backend, new data promotion, remote content service or equipment UI is needed.
Actual browser access, real IME/input testing and the pinned npm/Node plus existing
Python ingestion environment are release prerequisites; unavailable tools are
reported gaps, not waived gates.

## Open Questions

These are execution questions with recorded defaults, not a new product interview.
Resolve routine choices in BW-2001 and update its decision record before dependent
implementation. No human response is required merely to choose among the bounded
candidates or adjust measured limits consistently with the brief.

| Question | Default / required resolution |
| --- | --- |
| Which maintained editor/parser versions satisfy the real app? | Start with the Tiptap/ProseMirror plus separate remark codec candidate; compare Lexical. Only official-doc/license review, measured bundle impact and the actual-browser slice can select it. |
| Can node handles and external semantic history preserve composition/focus without full resets? | Guide owns all accepted history; vendor stores transient projection/selection only. Prove in Phase 1. If neither candidate meets it, stop and explicitly report the architectural blocker. |
| Does directive syntax preserve opaque segments, detached context and ordinary Markdown safely? | Use the concrete v1 proposal as the starting point; freeze exact grammar/escaping/normalization and source-only fallback with golden fixtures in BW-2001/BW-2002. |
| What limits are usable on representative devices? | Start with the stated byte/node/depth/build/reference/history limits and long fixture. Measure and freeze before integration; never change the benchmark after the fact just to pass. |
| How should a copied record with invalid raw source be identified? | New library/session identity, unchanged portable source until valid Apply; no regex remapping. Supported fragment copies always allocate fresh build IDs and explicitly detach external references. Prove collision safety in Phase 3/9. |
| How much existing catalog UI must be generalized? | Extract intent/filter/display inputs only; keep standalone adapters. Generic ranges cannot be implemented by passing a blank Build to contextual selectors. |
| Which concrete browsers/input methods are available to execution? | Freeze the required matrix in Phase 1, including actual pointer, keyboard, IME, themes/narrow/zoom and file/folder fallback coverage. Any later missing required evidence leaves completion open. |
| Is one sprint still executable after feasibility? | Default is all twelve phases. If a gate fails or the complete milestone cannot be finished, record the necessary split with exact remaining ticket/dependency/evidence gates; keep the epic open and assign no additional sprint number here. |
