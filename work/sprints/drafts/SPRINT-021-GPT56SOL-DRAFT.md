---
id: SPRINT-021
title: Markdown Guide Workspace
status: draft
approval: pending
source_target: EPIC-20
source_epic: EPIC-20
source_epic_path: work/tickets/20-markdown-guide-workspace/EPIC.md
tickets:
  - BW-2001
  - BW-2002
  - BW-2003
  - BW-2004
  - BW-2005
  - BW-2006
  - BW-2007
  - BW-2008
  - BW-2009
  - BW-2010
  - BW-2011
  - BW-2012
created: 2026-09-26
updated: 2026-09-26
---

# Sprint 021: Markdown Guide Workspace

## Overview

Deliver the complete EPIC-20 local author/read milestone: a rendered Markdown guide workspace with ordinary rich text, self-contained Build v4 cards, generic and build-bound inline skill references, explicit multi-build placement, one chronological history, recoverable source editing, named local Save/Open, portable Markdown transfer, and a catalog-free read view. The existing focused composer remains available and compatible.

This sprint covers BW-2001 through BW-2012 from [EPIC-20](../../tickets/20-markdown-guide-workspace/EPIC.md). The authoritative product behavior is [Markdown Guide Workspace](../../../compendium/guide-workspace.md), with [Sprint 021 intent](SPRINT-021-INTENT.md) supplying execution constraints. The sprint is deliberately dependency-gated: BW-2001 must produce a working actual-browser paragraph/reference/build/history/source slice before the editor and parser dependencies become committed architecture. A candidate stack and syntax are specified below so execution can begin noninteractively, but neither is considered proven before that gate.

The twelve tickets form one coherent sprint because persistence, source recovery, editor ownership, embedded-build targeting, and browser proof cross the same unions and interaction boundaries. Splitting after a partial editor would create a misleading completion state and leave stored guide data exposed to unfinished migration or loss paths. If BW-2001 cannot establish a feasible editor/codec bridge after the bounded fallback evaluation, stop the sprint at that gate, record the exact gap, and leave all dependent tickets and EPIC-20 incomplete; do not call the feasibility slice a shipped guide workspace and do not reserve another sprint number from this draft.

### Observed code baseline

Planning inspection established the following code facts; these are not implementation or test evidence:

- `src/domain/guide.ts` is a 21-line, unpersisted text/build/party section scaffold. It has no codec, stable reference model, retained-source representation, or consumers beyond its domain export.
- `Build` is schema v4. The durable authored unit is already `PersistedBuildSnapshot`, containing the `Build`, PvE budget, and raw template overlay. That snapshot, rather than a new guide-only build schema or a template code, must remain the complete build payload.
- `EditorState` combines durable build inputs with catalog filters, dialogs, tooltip, selection, drag, keyboard placement, and messages. `workspace-state.ts` and `build-set-state.ts` materialize one active editor while inactive loadouts hold snapshots. This is reusable precedent, but guide transactions must not expose an unsynchronized active snapshot or inherit the build-set entry cap accidentally.
- `WorkspaceDocument` and `PersistedDocument` are exhaustive `build | build-set` unions. Hydration, materialization, naming, duplication/remapping, dirty fingerprints, saved records, backup/restore, selectors, transfer UI, and share helpers all branch on those kinds. Adding only a guide component would be incomplete.
- The local envelope is schema v2 under the stable `build-wars:v1` key; backup is schema v2. Existing readers are strict, migrations are explicit, and rejected/corrupt/newer payloads block overwrites. Those guarantees must survive the guide migration.
- `App.tsx` computes validation, attribute preview, and pinned tooltip from one selected `EditorState`, and returns a catalog-error screen before any recovery UI. A guide must remain recoverable/exportable without catalogs, so the app shell and saved-catalog-facts path need separation from catalog-dependent editing.
- `FocusedSkillCatalog` makes a click place into the selected or first empty bar slot. `BuildComposer` renders no usable catalog when no loadout is selected. Guide mode therefore needs an explicit catalog intent and insertion target; it cannot reuse the current click behavior unchanged.
- The drag payload is only `{kind, skillId}` or `{kind, slotIndex}`. `SkillBar` interprets a failed drag end as removal. This is insufficient and unsafe for multiple build cards, prose targets, document switches, cross-build copy, and canceled drags.
- `SkillTooltipTrigger` uses a block `div` trigger and a portaled tooltip. Guide inline references need an inline-safe trigger while reusing the portal, display, local icons, hover/focus/touch behavior, and accessible description.
- The dependency set contains React 19/Vite 6 and no rich editor or Markdown parser. Vitest/jsdom coverage exists, but there is no repository browser-test dependency that can substitute for the required real-browser evidence.
- The domain TypeScript target is strict ES2023 with no DOM or Node ambient types. The selected source codec must compile inside that boundary rather than pulling browser/vendor concerns into `src/domain`.

`SPRINT-021-INTENT.md` reports a passing supervisor-supplied baseline for formatting, lint, typechecking, tests, build, ingestion tests, and runner tests. This draft does not treat that report as evidence for any BW-20xx behavior. No product test, browser scenario, dependency installation, or feasibility experiment was run while preparing this document.

### Assumptions and boundaries

- Routine decisions are resolved by the defaults in this document without another product interview. Only a failed BW-2001 feasibility/dependency gate or a newly discovered destructive migration ambiguity stops execution for direction.
- The candidate editor is Lexical with custom inline and block nodes; the candidate portable codec is unified/remark with a directive extension and fenced JSON annotations. ProseMirror core and Tiptap are bounded editor fallbacks; markdown-it with a custom inline rule is the parser fallback. The actual choice and exact versions remain subject to BW-2001 actual-browser, compatibility, license, bundle, accessibility, and fidelity evidence.
- The semantic `GuideDocument` is authoritative. Editor-vendor state is an ephemeral rendering/selection/composition mirror and is never the public format, persistence payload, export payload, or independent undo owner.
- Guide build embeds reuse `PersistedBuildSnapshot` through an injected adapter. Domain modules stay framework-neutral and do not import `src/app` persistence or editor types.
- A guide is a third persisted document kind, not a build set, party, or component over the standalone draft. Guide IDs and build IDs are guide-local and stable; record duplication and cross-document fragment paste deliberately remap them.
- Public discovery, automated PvX intake, copied community prose, hosted publishing, accounts, collaboration, backend sync, live-linked library builds, full party embeds, full equipment UI, generic Markdown-product work, combat optimization, and remote image fetching remain out of scope.
- Current local skill/rune assets and catalogs are reused. The example is original interaction content with linked provenance and an explicit non-meta disclaimer; no PvX page body, rating, recommendation text, screenshot, or runtime request is copied.

## Use Cases

| Scenario | Expected result |
| --- | --- |
| Switch from a dirty standalone composer to Guide | The existing dirty-data guard offers cancellation; no build or guide draft is silently replaced. |
| Create a guide with no build | Rendered prose and a persistent catalog are usable; catalog insertion creates a generic skill reference, never a phantom slot edit. |
| Author ordinary Markdown | Paragraphs, headings, emphasis, strong text, ordered/unordered lists, links, blockquotes, inline code, and fenced code edit in rendered form with shortcuts and small insert commands. |
| Insert current/saved/template/blank builds | Each insert creates a guide-owned complete snapshot with a fresh stable identity. Later edits to a library or standalone build do not alter the guide. |
| Edit two variants | Skills, mode, purchased ranks, rune/headgear adjustments, title overrides, PvE budget, assumed effects, and raw overlays remain isolated to the explicitly addressed card. |
| Duplicate, rename, and reorder a build | Rename/reorder preserve identity; duplicate receives fresh identity and an independent snapshot; existing prose bindings still point to the original. |
| Delete a referenced build | The author sees affected mentions and can cancel or retain explicit unresolved bindings. Undo restores the build and references together without retargeting. |
| Mention the same skill in generic and two build contexts | Generic display is labeled as context-free and shows catalog/range information; each bound display uses only its named build even after a third card is selected. |
| Encounter missing catalogs, skills, icons, or build contexts | Text and stored identities remain visible and exportable. Dependent editing is disabled or repairable; no value is borrowed from another build and no rank zero is invented. |
| Drag a catalog skill into prose or between blocks | Exactly one generic reference is inserted at the visible caret; between blocks, a paragraph containing the reference is created. No build changes. |
| Drag a catalog skill onto an inactive card | The existing placement planner runs against that exact card and slot without first selecting it; sibling builds and prose remain unchanged. |
| Drag within or across bars | Same-bar move/swap and raw-overlay handling are preserved; cross-build drag copies into the target and keeps the source intact. |
| Drag a build skill into prose | A reference bound to the source build is inserted; the source bar remains unchanged. |
| Cancel a drag, switch documents, delete/reorder a card, or use malformed/external payload data | Stale internal payloads do nothing with accessible feedback; external text follows safe text behavior; a canceled drag never removes or redirects a skill. |
| Use only the keyboard | The author can reach the document and catalog, insert a generic or bound mention, choose an exact build slot, place/replace a skill, cancel, and return to the saved text caret. |
| Undo across text and builds | A prose edit, slot change, attribute adjustment, reorder/delete, and valid source Apply undo and redo in one chronological history with one meaningful step per gesture. |
| Paste a fragment containing builds and bound mentions | Internal build IDs and their references remap together. References to builds outside the fragment become explicitly unresolved across documents, never rebound by coincidental ID. |
| Apply valid source | The entire parsed/validated guide replaces the applied document atomically as one history entry, preserving complete snapshots, contexts, metadata, and supported Markdown meaning. |
| Apply invalid, unsupported, malicious, or over-limit source | The applied guide is unchanged; diagnostics and the exact raw source draft remain recoverable and autosavable. No partial build update occurs. |
| Leave source mode with unapplied changes | Apply, Keep Editing Source, and Discard are explicit choices. Read mode truthfully states that it shows the last applied guide. |
| Export with invalid/unapplied source | The user can separately download the raw draft or the last-valid serialized guide; the UI does not claim a failed parse is lossless. |
| Save, open, reload, back up, and restore | Complete guide state and any recoverable source draft survive. Existing build/build-set/party records and mixed backups remain valid and are not rewritten merely by reading. |
| Storage or catalogs are unavailable | Failure remains visible, the in-memory guide is not reported durable, and Markdown download stays available without replacing the document. |
| Read the guide | The same applied nodes render without catalog or mutation controls; variants have stable anchors, details can collapse, tooltips keep context, and template copying addresses the correct card without dirtying history. |
| Load the original example | Normal replacement handling protects an existing draft. The two-variant dagger-themed sample is original, source-linked, offline, and labeled as an interaction example rather than current meta advice. |

## Architecture

### Semantic ownership and adapters

Replace the current section scaffold with a framework-neutral, generic semantic document in `src/domain/guide.ts`. The generic payload prevents a domain-to-app dependency while allowing the app to bind the existing durable snapshot without inventing a second build schema:

```ts
interface GuideDocument<BuildPayload> extends AuthoredDocumentRoot {
  readonly id: GuideDocumentId;
  readonly metadata: GuideMetadata;
  readonly blocks: readonly GuideBlock<BuildPayload>[];
}

type GuideInline =
  | GuideText
  | GuideEmphasis
  | GuideStrong
  | GuideLink
  | GuideInlineCode
  | {
      readonly kind: "skill-reference";
      readonly id: GuideNodeId;
      readonly skillId: SkillId;
      readonly context:
        | { readonly kind: "generic" }
        | { readonly kind: "build"; readonly buildId: GuideBuildId };
    }
  | GuideOpaqueInline;

type GuideBlock<BuildPayload> =
  | GuideParagraph
  | GuideHeading
  | GuideList
  | GuideBlockquote
  | GuideCodeBlock
  | {
      readonly kind: "build";
      readonly id: GuideNodeId;
      readonly buildId: GuideBuildId;
      readonly payload: BuildPayload;
    }
  | GuideOpaqueBlock;
```

`GuideDocument<PersistedBuildSnapshot>` is the application instantiation. `src/app/guide-build-adapter.ts` injects parsing, validation, cloning, materialization, template shorthand expansion, canonical template projection, and identity extraction for the snapshot payload. The adapter enforces that the block `buildId` and `snapshot.build.id` describe the same guide-local identity, and it remaps both together. It reuses `createPersistedBuildSnapshot`, `hydrateEditorFromSnapshot`, `clonePersistedBuildSnapshot`, template workflows, validation selectors, and the current placement planner. The domain never imports `EditorState`, persistence schema, catalogs, React, or the selected editor package.

The applied semantic document owns all authored meaning. A vendor adapter converts semantic nodes to an ephemeral editor tree and converts accepted editor changes back into typed `GuideTransaction`s. Vendor JSON is not stored. Composition, DOM selection, caret geometry, and decorator lifecycle may live in the adapter, but every accepted prose or embed edit commits the semantic document before it is considered authored. The vendor's independent history plugin must remain disabled; Ctrl/Cmd-Z and redo route to guide history.

`GuideWorkspaceState` is the guide-specific runtime owned by the existing outer workspace/library state:

```ts
interface GuideWorkspaceState {
  readonly applied: GuideDocument<PersistedBuildSnapshot>;
  readonly sourceDraft: {
    readonly text: string;
    readonly basedOnFingerprint: string;
    readonly status: "synchronized" | "unapplied" | "invalid" | "unsupported";
    readonly diagnostics: readonly GuideDiagnostic[];
  };
  readonly history: GuideHistory;
  readonly ui: GuideUiState;
}
```

`applied` is always the last-valid guide. The recoverable source buffer coexists with it and is never a second silently synchronized owner. `history` and focus/selection are transient. Persistence stores `applied`, `sourceDraft`, and enough status/fingerprint data to explain an unfinished source draft, but not vendor state, history, hover, catalog filters unless already shared intentionally, insertion geometry, or DOM selection.

All authored mutations enter one `applyGuideTransaction` boundary. Build actions carry `documentId` and `buildId`, hydrate the named snapshot through the adapter, apply existing reducer/planner behavior, immediately materialize the durable snapshot, and replace only that build node in the same transaction. The transaction refuses missing/stale targets rather than falling back to the selected card. Card selection, reading expansion, catalog filtering, hovering, focus, and view switches remain UI actions and do not dirty or enter history.

### Candidate portable syntax and limits

The following is the executable candidate contract for BW-2001. It is concrete enough to implement and test, but the feasibility gate may revise delimiters or the editor/parser combination if the decision record proves a specific conflict. Any revision must preserve the same namespaces, authority rules, inertness, recovery behavior, and examples before BW-2002 begins.

````markdown
<!-- build-wars-guide:v1 -->
```build-wars-meta
{"title":"Dagger Practice","summary":"Two local variants.","tags":["daggers","pve"],"sources":[]}
```

# Dagger Practice

Use :bw-skill[]{skill="catalog-skill:986" context="generic"} for the generic discussion.
With this bar, :bw-skill[]{skill="catalog-skill:986" context="build:main"} uses the Main build.

```build-wars-build
{
  "annotationVersion": 1,
  "id": "build:main",
  "snapshot": {
    "build": {
      "schemaVersion": 4,
      "catalogVersion": null,
      "id": "build:main",
      "name": "Main",
      "mode": "pve",
      "primaryProfessionId": null,
      "secondaryProfessionId": null,
      "attributes": [],
      "skillBar": [null, null, null, null, null, null, null, null],
      "titleRankOverrides": [],
      "attributeAdjustments": null
    },
    "pveBudget": {"level": 20, "questBonus": "maximum-applicable"},
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
```

Input-only shorthand for the same block kind is concrete and mutually exclusive with `snapshot`:

```build-wars-build
{"annotationVersion":1,"id":"build:alternate","name":"Alternate","templateCode":"OAAQIAAAAAAAAAAAAAAA"}
```
````

Rules:

- The exact leading marker selects guide syntax version 1 and is consumed as metadata, never emitted as executable HTML. The following `build-wars-meta` JSON fence is required exactly once. Metadata fields are exactly `title`, nullable `summary`, `tags`, and `sources`. A source record has `id`, `name`, `family`, `canonicalUrl`, nullable `revisionId`, nullable `retrievedAt`, nullable `licenseName`, and nullable `notes`; source policy validation remains separate from link rendering. Profession/mode discovery facts are derived from embedded builds rather than stored as one invented guide-wide classification.
- Skill references use directive syntax outside code only. `catalog-skill:<safe integer>` is a runtime catalog identity, never a game-template identity. `context` is exactly `generic` or a namespaced guide-local `build:<id>`. The empty directive label prevents author-cached display names from competing with the catalog; unresolved UI shows the stored identity.
- Build annotations are fenced JSON and require `annotationVersion`, `id`, and exactly one of `snapshot` or `templateCode`. A shorthand may also carry a bounded `name`, but no competing skill/attribute payload. Applying shorthand uses the existing template adapter and produces a semantic snapshot; serialization always emits the complete snapshot form so title overrides, adjustments, PvE budget, effects, and unresolved raw facts are retained.
- Within a full snapshot, `Build` plus guide-only durable input fields are authoritative. Raw template overlay/source facts remain provenance and unresolved evidence, not an independently editable competing build. Canonical game code is derived; exact-source output is used only when the existing equivalence rules allow it.
- Directive-looking text in inline/fenced code is literal. A leading backslash escapes directive punctuation in ordinary text. Duplicate document, node, or build IDs; a mismatched block/snapshot ID; a bound reference to a duplicate ID; and a snapshot plus template conflict are deterministic diagnostics.
- Supported ordinary Markdown may normalize delimiter choice, indentation, and whitespace according to the recorded serializer rules. Opaque nodes retain their exact source slices. If an unknown structure cannot be safely isolated and reinserted, parsing returns a recoverable-source-only result and visual editing stays blocked; source is never silently stripped.
- Candidate limits are fixed before implementation: 1,048,576 UTF-8 source bytes; 10,000 semantic nodes; semantic and annotation-JSON depth 32; 64 embedded builds; 5,000 skill references; 64 source records; title/build names 120 characters; summary 2,000; 24 tags of 40 characters; URLs 2,048. Apply/import rejects the whole candidate above a limit while retaining the raw source. Boundary fixtures exercise every exact limit. The representative browser long-document fixture contains at least 200 paragraphs, 20 headings, 12 builds, 500 references, and 128 KiB of source without being misrepresented as a maximum-size benchmark.
- Guide history keeps the newest 100 authored transactions or 16 MiB of serialized before/after material, whichever limit is reached first, pruning oldest whole transactions. Consecutive typing in the same text node groups across at most 750 ms; selection moves, formatting, paste/drop, composition boundaries, build controls, and source Apply end a group. One IME composition is one step.

### Editor feasibility and fallback rule

The candidate stack is Lexical (`lexical`, `@lexical/react`, and only required first-party packages) with custom inline skill and block build nodes, plus unified/remark (`unified`, `remark-parse`, `remark-stringify`, `remark-directive`, and required mdast utilities) for the independent source codec. The adapter must not make Lexical's Markdown transforms the public codec. The gate compares this combination against ProseMirror core and Tiptap for editing, and against markdown-it with a custom inline rule for parsing. The comparison is limited to the required slice rather than a general editor platform.

For each candidate, record from current official documentation and actual resolved packages: maintenance/release state, React 19 and Vite 6 compatibility, license and transitive license review, production bundle delta, SSR/test constraints, accessibility APIs, IME/composition behavior, custom inline/block node support, clipboard/drag hooks, selection restoration, history interception, and Markdown source fidelity. Do not infer compatibility from an old blog post or package popularity.

The chosen candidate must demonstrate in an actual browser, in the production-shaped adapter boundary:

1. Type and format a paragraph, including IME composition and keyboard Markdown shortcut behavior.
2. Insert, move across text, focus, and delete an atomic inline reference without corrupting adjacent characters or producing invalid paragraph DOM.
3. Insert a block build embed, change one real build control, and return focus/caret to text across both sides of the embed.
4. Undo and redo a text edit and the build edit through the single application history, with no vendor-history disagreement.
5. Serialize to candidate source, parse it back to equivalent semantic meaning, and retain one opaque segment exactly.
6. Preserve a saved insertion bookmark while focus enters the right catalog, and invalidate it rather than redirect after a document switch.

If Lexical/remark passes, pin exact compatible versions and continue. If it fails a documented criterion, evaluate the bounded ProseMirror/remark fallback through the same slice; evaluate Tiptap or markdown-it only for a specific failed dimension. If no combination passes, record results and stop before broad model, persistence, or UI integration. A passing list of package features, jsdom component test, or textarea/preview does not satisfy BW-2001.

### Identity, context, transfer, and history invariants

- Guide document, semantic node, guide build, runtime catalog skill, and game-template identifiers use distinct branded or serialized namespaces. Names, positions, selected cards, and local saved-record IDs are not reference identity.
- An embedded build is a deep-cloned complete snapshot. Rename and reorder retain its ID. Build-only duplication creates a fresh build/node ID and does not change existing references. Saved-guide duplication and backup ID conflict remapping use one shared `cloneGuideWithFreshIds` helper to re-key the document, build nodes, nested `Build.id` values, and internal contexts atomically.
- Fragment clipboard data includes an origin document ID and a manifest of contained nodes/builds/references. Paste always creates fresh node IDs. Builds contained in the fragment and references to them remap together. On same-document paste, references to builds outside the fragment retain their existing binding. On cross-document paste, those external references become dangling contexts with their original identity recorded; they never bind to an equal destination string without explicit repair.
- A bound skill reference resolves its tooltip inputs directly from the named snapshot: mode, purchased/base ranks, rune/headgear adjustments, title overrides, PvE budget, supported assumed effects, and raw uncertainty. Card selection is irrelevant. A generic reference invokes a new explicit generic display context that shows catalog facts/ranges and the label “Generic — no build context”; it never passes an empty or unrelated `EditorState` as rank zero.
- The same applied semantic nodes feed edit and read rendering. Read-only selection, anchor navigation, expansion, tooltip opening, and template copy do not create a transaction or dirty fingerprint.
- History snapshots the complete materialized applied guide at transaction boundaries. There is no independent build or vendor undo stack. A delete transaction includes the build removal and retained dangling references, so undo restores both. Valid source Apply is one transaction; invalid Apply is none.

### Explicit drag and insertion protocol

Replace the slot-index payload with a versioned internal payload containing a per-page session nonce, origin guide document ID, origin semantic revision, source kind, source build ID and slot when present, skill ID, and a fingerprint of the source slot/raw overlay facts. The target handler supplies its own document ID, build ID, slot, or prose bookmark; target identity is never inferred from active selection.

Before applying, verify MIME/version, exact keys, safe integers/IDs, session/document continuity, current source existence, source slot skill/raw fingerprint, target existence, and allowed source/target pair. A stale internal payload is a visible no-op. A nested slot handler prevents default and stops propagation after it accepts/rejects the internal payload so the document surface cannot also insert prose. `dragend` only clears transient drag UI; it never deletes a skill. Removal remains an explicit command.

Catalog-to-slot and same-bar behavior continue through `planSkillBarWorkflow`. Cross-build bar-to-bar creates a copy plan for the target snapshot and retains the source. Catalog/bar-to-prose bypasses skill-bar legality and never mutates a bar. The editor adapter exposes drop-caret geometry as UI state and converts a between-block target to a paragraph containing one reference. Keyboard pick/place carries the same validated semantic intent, target IDs, cancellation, and accessible announcement as pointer drag.

### Persistence and catalog-failure boundary

Advance the local-library envelope to schema v3 while retaining the `build-wars:v1` storage key and explicit v1/v2 migrations. Add a `guide` member to `PersistedDocument` containing the applied versioned guide and recoverable source draft. The guide payload validates independently of current catalogs so missing catalogs do not erase IDs or block recovery/export. Catalog-dependent editing and preview may be disabled with diagnostics.

Restructure `App.tsx` so storage read, workspace hydration, storage diagnostics, Guide source/export recovery, and theme controls mount before catalog readiness is required. Composer and catalog-dependent guide controls receive a ready/error capability instead of the whole app returning early. `savedWith` facts for a guide may preserve stored facts or explicit nulls while catalogs are unavailable; it must not require validation of a selected build merely to autosave raw guide source.

Audit every `PersistedDocument` and `WorkspaceDocument` branch: parsing/migration, exact validation, clone, identity-remap, fingerprint, selected-build helpers, active naming, save/update/load/duplicate/delete, draft replacement, autosave/pagehide, local write conflict, library selectors, backup creation/parse/preview/apply, build-set/party transfer boundaries, share/template helpers, and UI filters. A helper that needs one selected build must return null or require an explicit guide `buildId`; it must never silently choose the active/first guide card.

Persist no history or vendor state. Persist the applied semantic guide, complete snapshots, IDs/contexts, metadata, and recoverable source draft/status. Migration is pure and does not write or dirty on read. Corrupt/newer/over-limit guide payloads preserve the existing rejected-payload/write-blocked behavior. Quota/denial/conflict never reports success and leaves Markdown download available.

## Implementation

### Phase 1: BW-2001 — Freeze contracts and pass the editor feasibility gate

**Depends on:** completed EPIC dependencies only.

**Files:** `compendium/guide-workspace.md`; new `compendium/decisions/0003-guide-editor-and-markdown-contract.md`; initial target-shaped `src/domain/guide.ts`, new `src/domain/guide-codec.ts`, `src/app/guide-build-adapter.ts`, `src/app/guide-editor-adapter.ts`, and `src/app/components/GuideEditor.tsx`; focused tests under `test/domain/guide-codec.test.ts` and `src/app/guide-editor-feasibility.test.tsx`; candidate dependency changes to `package.json` and `package-lock.json` only after the official-doc/license precheck, with rejected packages removed and the final set pinned only after the actual slice passes; future evidence under `work/runs/SPRINT-021/feasibility/` and durable summary in `work/sprints/SPRINT-021-EVIDENCE.md`.

- [ ] Audit and record the current Guide scaffold, Build v4/durable snapshot/raw-overlay authority, editor/catalog/tooltip active-build assumptions, persistence/backup unions, drag behavior, template boundaries, and inline DOM constraints listed in the observed baseline.
- [ ] Record the candidate v1 marker, metadata/build/reference grammar, namespace and escaping rules, template shorthand versus full snapshot authority, source locations, supported Markdown vocabulary, opaque/recoverable behavior, normalization, limits, fragment remapping, deletion/duplication, insertion bookmark, source Apply, and one-history rules.
- [ ] Inspect current official docs and resolved packages for the bounded editor/parser candidates. Record current compatibility, exact package/version set, licenses/transitive licenses, production bundle delta, accessibility/IME support, and rejected-alternative rationale.
- [ ] Build the six-step production-shaped feasibility slice. Keep it behind the Guide entry path and reuse its target adapter/modules; do not grow a throwaway generic editor platform.
- [ ] Run focused semantic/history assertions and record actual-browser paragraph, inline reference, editable build, focus/IME, shared undo, bookmark, and round-trip results. Clearly distinguish passed, failed, and unrun cases.
- [ ] Select and pin a stack only if the actual slice passes. If the candidate fails, run only the documented fallback necessary to decide. Stop dependent phases if none passes.

**Gate:** The ADR and brief contain a complete executable contract, and one actual editor/parser combination has passed the real-browser slice with focused semantic/history evidence. Package installation, compatibility, license, and bundle results are recorded. A package comparison alone, jsdom, source textarea/preview, or prototype without shared history cannot open Phase 2.

### Phase 2: BW-2002 — Implement the semantic guide model and annotated Markdown codec

**Depends on:** Phase 1/BW-2001 gate.

**Files:** `src/domain/guide.ts`, `ids.ts`, `index.ts`; new `src/domain/guide-codec.ts`, `guide-validation.ts`, and `guide-transfer.ts`; `src/app/guide-build-adapter.ts`; `src/app/persistence-schema.ts` only for reuseable exact snapshot validation extraction if needed; new `test/domain/guide.test.ts`, `guide-codec.test.ts`, `guide-transfer.test.ts`; new guide fixtures under `test/fixtures/guides/`.

- [ ] Replace the text/build/party scaffold with the versioned generic semantic tree, metadata/source references, stable node/build identities, generic/bound skill references, build nodes, and exact opaque nodes. Remove the unused party-section fiction; full party embeds stay out of scope.
- [ ] Add pure construction, validation, resolution, duplication, deletion-impact, remapping, source-range, and semantic-equality helpers. Domain resolution retains missing skill/build IDs without catalogs and never imports application types.
- [ ] Implement the chosen independent Markdown parser/serializer for the frozen dialect. Recognize annotations only outside code/escapes; preserve exact opaque slices or return recoverable-source-only; normalize only documented supported Markdown.
- [ ] Bind build annotation JSON to `PersistedBuildSnapshot` through the adapter. Validate Build v4, PvE budget, raw overlays, title/effect/adjustment inputs, duplicate/mismatched IDs, exact object keys, dangerous keys, and template/snapshot conflicts. Expand shorthand through the existing template codec without making a template code co-authoritative.
- [ ] Enforce the fixed byte/node/depth/build/reference/source/metadata limits before recursive conversion or rendering. Return bounded deterministic diagnostics with source locations; never partially return a replacement guide after a fatal error.
- [ ] Sanitize/validate link schemes as data and represent raw HTML/MDX, image embeds, and unsupported directives inertly. Parsing or rendering performs no remote request, dynamic import, JSX/HTML execution, or asset lookup.
- [ ] Add golden semantic round trips for plain prose, every supported construct, two different snapshots, incomplete/unresolved builds, explicit adjustments/title/effect values, raw overlays, generic/bound/missing references, rich metadata, escaping, code fences, exact opaque content, conflicts, duplicate IDs, dangerous keys, unsupported versions, and boundary/over-limit inputs.

**Gate:** Supported source parses/serializes/parses to equivalent authored meaning; opaque content is exact or visual editing is recoverably blocked; complete snapshot facts and namespaces survive; malicious/conflicting/oversized inputs produce deterministic whole-document rejection without execution or data loss.

### Phase 3: BW-2003 — Establish guide transactions, targeting, and one bounded history

**Depends on:** Phase 2/BW-2002 gate.

**Files:** new `src/app/guide-workspace-state.ts`, `guide-history.ts`, `guide-selectors.ts`, and `guide-clipboard.ts`; `src/app/workspace-state.ts`, `editor-state.ts`, `build-set-state.ts` only at shared adapter seams; new `src/app/guide-workspace-state.test.ts`, `guide-history.test.ts`, and `guide-clipboard.test.ts`; extend `workspace-state.test.ts` for union regressions.

- [ ] Add a runtime guide document to `WorkspaceDocument` with applied semantic state, source recovery state, UI state, and transient history. Keep selected build and insertion bookmark independent from persisted reference contexts.
- [ ] Implement `applyGuideTransaction` with materialization-before-compare, authored dirty fingerprinting, past/future pruning at 100 entries or 16 MiB, typing grouping at 750 ms, composition grouping, and redo invalidation. UI-only actions must preserve the document object/fingerprint.
- [ ] Add explicit document/build-targeted adapters for existing build actions, import results, placement plans, rename/reorder/duplicate/delete, and source Apply. Never route a missing target to the active card.
- [ ] Define insertion bookmarks with origin document ID, semantic revision, stable node/path/offset, and vendor selection token. Restore after catalog focus when still valid; invalidate on document replacement, source-mode transition, or removed/rebased content instead of guessing.
- [ ] Implement reference-aware deletion with cancel/retain-unresolved choices, fresh identities for duplication, and shared fragment remapping rules. A build-only duplicate leaves old bindings unchanged.
- [ ] Materialize complete snapshots before history, export, validation, persistence, or target switch. Add invariants/tests that no active editor cache can diverge from its semantic build node.
- [ ] Test chronological prose → slot → attribute/effect → reorder/delete → source Apply undo/redo, two-variant switching, raw-overlay retention, canceled/stale commands, dirty fingerprints, generic context, delete/undo, build duplication, same/cross-document paste, history pruning, and existing build/build-set reducer regressions.

**Gate:** One history restores the full ordered cross-feature sequence and identities; two variants cannot cross-contaminate; selection/filter/view actions create neither dirty state nor history; stale targets are rejected; no second authoritative editor/build snapshot remains observable.

### Phase 4: BW-2004 — Mount the rendered Guide shell and intent-aware catalog

**Depends on:** Phases 1–3/BW-2001–BW-2003.

**Files:** `src/app/App.tsx`, `styles.css`, `components/BuildComposer.tsx`, `FocusedSkillCatalog.tsx`, `SkillTooltip.tsx`, `StorageBanner.tsx`; new `components/AppWorkspaceSwitcher.tsx`, `GuideWorkspace.tsx`, `GuideToolbar.tsx`, `GuideEditor.tsx`, `GuideCatalog.tsx`, and `InlineSkillTooltipTrigger.tsx`; `src/app/guide-editor-adapter.ts`; new/extended `App.test.tsx`, `guide-workspace.test.tsx`, `guide-editor.test.tsx`, `focused-skill-catalog.test.tsx`, and `build-composer.test.tsx`.

- [ ] Add clear Composer and Guide entry points. Create/replace/open transitions use the existing dirty guard and preserve both document kinds; switching the visible surface does not masquerade as replacing the current draft.
- [ ] Mount the chosen rendered editor for the full required block/mark vocabulary, normal safe paste, list editing, keyboard Markdown shortcuts, and small insert commands. A textarea remains only the explicit Source mode.
- [ ] Refactor catalog presentation from mutation intent. Composer keeps selected-slot behavior; Guide catalog takes an explicit prose/build-slot intent, shows the saved target, defaults catalog-to-prose to generic, and remains usable with zero builds.
- [ ] Preserve a guide insertion bookmark while catalog search/filter/scroll receives focus. A click cannot edit the last active bar unless the visible target explicitly names that bar/slot.
- [ ] Implement desktop document-left/catalog-right independent scrolling and a dismissible narrow catalog sheet/tab with focus and caret restoration. Keep visible target feedback, empty guide/no-build states, both themes, long-document behavior, and standalone composer layout.
- [ ] Split app hydration/recovery from catalog readiness. On catalog error, retain source/raw export, storage diagnostics, text, and stored IDs while disabling catalog-dependent insertion/build preview; do not replace the app with the current terminal error screen.
- [ ] Use an inline-safe reference trigger and the existing tooltip portal/display assets. No block element or tooltip body may be nested in paragraph phrasing content.
- [ ] Add component coverage for intent routing, no-build catalog insertion, entry/exit dirty guards, unavailable catalogs, focus restoration, rendered editing, commands, and responsive sheet state. Prepare, but do not claim, the actual-browser checks completed in Phase 12.

**Gate:** Rendered text—not a source/preview pair—is editable; catalog interaction preserves the exact prose or explicit card target; zero-build and catalog-failure recovery paths work; composer behavior remains intact; keyboard/narrow access has testable focus restoration.

### Phase 5: BW-2005 — Add complete, explicitly targeted embedded build cards

**Depends on:** Phases 3–4/BW-2003–BW-2004.

**Files:** new `components/GuideBuildCard.tsx`, `GuideBuildDetails.tsx`, and `GuideBuildInsertDialog.tsx`; `src/app/guide-build-adapter.ts`, `guide-workspace-state.ts`, `guide-selectors.ts`, `template-import.ts`, `template-workflow.ts`; reuse/refactor `ComposerHeader.tsx`, `SkillBar.tsx`, `FocusedAttributeEditor.tsx`, `TitleRankPanel.tsx`, `AssumedAttributeEffects.tsx`, `InlineTemplateCode.tsx`, `TemplateFileControls.tsx`, and `TemplateBrowserDialog.tsx`; new `guide-build-card.test.tsx`, `guide-build-adapter.test.ts`, and targeted template regression extensions.

- [ ] Support blank insertion, compact template-code insertion, copying the current standalone build, and copying an explicitly chosen saved build. Every path deep-clones a complete snapshot, creates fresh guide-local identity, and leaves the source independent.
- [ ] Render compact labeled cards with professions/mode, eight slots, unresolved/empty states, stable anchor seed, and copy-template. Expand only the active card's existing profession, attribute, rune/headgear, title, assumed-effect, PvE-budget, skill, and template controls; do not repeat a full tool panel in every card.
- [ ] Adapt existing editor controls and validation through explicit `documentId/buildId` dispatch. Reuse current game rules and preview selectors; add no duplicate placement, attribute, title, effect, or export arithmetic.
- [ ] Implement rename, reorder, independent duplicate, and reference-aware delete as guide transactions. Incomplete, blank, or unresolved snapshots remain editable even when canonical game code is unavailable.
- [ ] Route pasted game code, game-folder Load/Save, inline code import, and copy output to the named card. Preserve current warning, cancellation, permission, read/write failure, exact-source/canonical, and truthful omission behavior. A game code never claims to contain guide prose or guide-only metadata.
- [ ] Preserve raw overlays through unrelated edits and same-bar moves. Keep retired armor/weapon UI and full equipment recommendations out; recommendations remain prose.
- [ ] Test two variants with different skills, purchased ranks, rune/headgear adjustments, title/effect values, PvE budgets, raw facts, incomplete templates, independent duplicate/reorder/rename/delete, explicit current/saved copies, targeted/canceled imports, and targeted Load/Save/copy.

**Gate:** Every build operation addresses one stable guide-local card, all durable Build v4 snapshot facts survive, sibling cards/prose stay unchanged, incomplete cards remain usable, and existing controls/rules retain behavior without reintroducing equipment management.

### Phase 6: BW-2006 — Implement atomic skill references and explicit context resolution

**Depends on:** Phases 2, 4, and 5/BW-2002, BW-2004, BW-2005.

**Files:** new `components/GuideSkillReference.tsx`, `GuideReferenceDialog.tsx`, and `GuideSkillCompletion.tsx`; `src/app/guide-selectors.ts`, `editor-selectors.ts`, `attribute-preview-selectors.ts`, `App.tsx`, `components/SkillDisplay.tsx`, `SkillTooltip.tsx`, `InlineSkillTooltipTrigger.tsx`, `GuideCatalog.tsx`; new `guide-references.test.ts`, `guide-skill-reference.test.tsx`, and focused tooltip/selector regressions.

- [ ] Add completion/insert/edit commands for atomic references using runtime `SkillId`. Catalog-to-prose defaults to generic; bar-to-prose binds the source build; authors can explicitly choose Generic or a named build.
- [ ] Introduce explicit `generic` and `build` skill-display contexts. Generic shows shared catalog facts/progression/ranges with a clear label and no assumed rank. Bound context derives mode, base/bonus ranks, title overrides, PvE budget, effects, and unresolved facts from the named snapshot even when another card is active.
- [ ] Render missing skill and missing/deleted build contexts visibly with their stored identities, explanation, and repair/rebind action. Do not silently retarget, convert bound to generic, or borrow active-build data.
- [ ] Preserve atomicity and context while typing around, moving, cutting, or copying a mention. Card selection/reorder/rename must not change serialized context. Undoing build deletion restores the previous rendered context.
- [ ] Reuse local icon/fallback, display facts, portaled tooltip content, and hover/focus/touch dismissal with valid inline DOM and accessible names. Long names and missing icons remain readable and wrap safely.
- [ ] Test zero-build generic insertion; two mentions of one skill under different mode/rank/bonus/title/effect contexts; selection of another card; missing skill/build; explicit rebind; surrounding character edits; move/copy; delete/undo; hover, keyboard focus, and touch-capable opening.

**Gate:** Reference identity and context are authored data independent of UI selection; generic never invents a build rank; bound values come only from the named snapshot; unresolved data remains recoverable; inline editing and tooltip DOM remain valid and accessible.

### Phase 7: BW-2007 — Complete the pointer/click/keyboard placement matrix

**Depends on:** Phases 5–6/BW-2005–BW-2006.

**Files:** `src/app/drag-payload.ts`, `skill-bar-actions.ts`, `skill-bar-workflow.ts`, `guide-workspace-state.ts`, `guide-editor-adapter.ts`; `components/SkillBar.tsx`, `FocusedSkillCatalog.tsx`, `GuideCatalog.tsx`, `GuideEditor.tsx`, `GuideBuildCard.tsx`; extend `drag-payload.test.ts`, `skill-bar-workflow.test.ts`, `skill-bar.test.tsx`; new `guide-placement.test.tsx` and `guide-drag-integration.test.tsx`.

- [ ] Replace the internal payload with the versioned nonce/document/revision/source-build/source-slot/skill/raw-fingerprint contract. Validate exact keys and current facts at each target; carry target identity in the handler command, not active selection.
- [ ] Implement all seven brief rows: catalog→prose, catalog→between blocks, catalog→slot, same-bar move/swap, cross-build copy, source-bar→bound prose, and external/malformed safe text/no-op.
- [ ] Use the existing placement planner against the exact target snapshot, including inactive cards, elite/duplicate rules, and raw-overlay movement. Cross-build copy retains source; same-bar move preserves current behavior.
- [ ] Show prose caret/between-block indicator or exact slot target before drop. Stop accepted/rejected nested slot drops from bubbling. Change drag end to transient cleanup only; deletion is explicit.
- [ ] Reject stale source slots, deleted/reordered builds, changed raw facts, document/session switches, and canceled drags with accessible feedback and no mutation. Applying to an inactive card must not select or alter a sibling unless the gesture explicitly includes selection as a separate UI action.
- [ ] Add click/keyboard insert, pick exact build/slot, place/replace, and cancel controls using the same semantic intents. Announce source, target, copy/move result, and errors without requiring pointer use.
- [ ] Test exactly-one-transaction behavior, target isolation, stale/malformed boundaries, nested propagation, scrolling, raw overlays, elite/duplicate rules, cancellation, document switch, and keyboard parity. Actual native pointer and keyboard evidence remains a Phase 12 gate.

**Gate:** Every matrix row produces exactly one intended transaction; inactive targets are isolated; stale/canceled input cannot mutate any document; same-bar/raw rules are preserved; equivalent keyboard workflows are complete.

### Phase 8: BW-2008 — Add safe Source mode and self-contained Markdown transfer

**Depends on:** Phases 2–6/BW-2002–BW-2006.

**Files:** new `components/GuideSourceEditor.tsx`, `GuideTransferDialog.tsx`, and `GuideModeGuardDialog.tsx`; new `src/app/guide-files.ts`; `src/domain/guide-codec.ts`, `guide-validation.ts`; `src/app/guide-workspace-state.ts`, `guide-editor-adapter.ts`, `App.tsx`; new `guide-source-editor.test.tsx`, `guide-files.test.ts`, and `guide-source-integration.test.tsx`; extend codec/security fixtures.

- [ ] Add a plain source buffer with line/column diagnostics and explicit Apply. Parse, validate, adapt every build, and check all limits before committing the entire semantic guide as one transaction.
- [ ] Retain applied/last-valid guide, exact raw buffer, diagnostics, and based-on fingerprint after malformed, unsupported, unsafe, conflicting, or over-limit source. Invalid Apply changes no build or history.
- [ ] Implement Source→Visual/Read choices: Apply, Keep Editing Source, or explicit Discard. Visual edits cannot silently overwrite an unapplied buffer. Read mode labels that it shows last applied content.
- [ ] Provide validated Markdown upload and paste import with preview/confirmation where replacement is dirty. Cancellation, file-read failure, decode failure, or validation failure keeps the previous applied document and raw draft.
- [ ] Provide self-contained last-valid Markdown download and, when different/invalid, a separately named raw-draft download. Explain supported dialect/normalization and do not claim failed source is a lossless guide.
- [ ] Preserve complete snapshots, explicit adjustments/title/effect inputs, raw overlays, metadata, bindings, and exact opaque slices across visual→source→Apply→download→upload. Annotation-looking content inside code remains literal.
- [ ] Enforce inert raw HTML/MDX/images, safe link schemes, dangerous-key rejection, document limits, and no remote fetch equally across source, file import, paste, editor clipboard, and read rendering.
- [ ] Test semantic equality for valid whitespace normalization and exact equality for opaque segments; cover partial/malformed JSON, unsupported guide/annotation/build versions, escaping, duplicate/conflicting IDs, hostile HTML/URLs, images, dangerous keys, boundary-size files, failed/canceled file operations, and mode guard choices.

**Gate:** Valid Apply is atomic and complete; invalid source is fully recoverable and never partially applied; unknown content is exact or safely locks visual editing; upload/download and paste share the same validation/security boundary.

### Phase 9: BW-2009 — Persist, save, open, migrate, back up, and recover guides

**Depends on:** Phases 3 and 8/BW-2003 and BW-2008.

**Files:** `src/app/persistence-schema.ts`, `local-storage.ts`, `workspace-state.ts`, `backup-restore.ts`, `library-selectors.ts`, `library-fixtures.ts`, `App.tsx`, `components/StorageBanner.tsx`; new `components/GuideSaveOpenDialog.tsx`; extend `persistence-schema.test.ts`, `local-storage.test.ts`, `workspace-state.test.ts`, `backup-restore.test.ts`, `App.test.tsx`; new `guide-persistence.test.ts`.

- [ ] Add strict schema-v3 `guide` persisted documents and pure v1/v2 migration while retaining the storage key. Validate/clone/fingerprint/remap applied guide and source draft without requiring current catalogs.
- [ ] Audit and update every exhaustive document union and selected-build assumption identified in Architecture. Share one guide remapper between saved-record duplication and backup conflict remap so internal references cannot collide after cloning.
- [ ] Extend working-draft autosave/pagehide, associated saves, Save As, named guide Save/Open, rename/delete, dirty/conflict guards, and active document naming. Use a minimal guide dialog/menu; do not mount obsolete library, equipment, party, or secondary tool panels.
- [ ] Persist complete snapshots, stable IDs/bindings, metadata, applied document, and unfinished invalid/unapplied source with truthful status. Exclude history, vendor JSON, DOM selection, hover, catalog sheet state, and transient drag/bookmark geometry.
- [ ] Preserve storage denial, quota, corruption, newer schema, dangerous keys, cross-tab revision conflict, rejected payload, no-write-on-read, and failed-save truthfulness. A failed write cannot overwrite recoverable data or report durability.
- [ ] Extend mixed backup/export/restore parsing, preview, merge/replace, record conflict remap, and draft association for guides while preserving existing build/build-set/party data and anti-wipe behavior.
- [ ] Keep game-folder templates card-specific and separate from guide Markdown. Under unavailable storage/catalogs, keep source/export and stored identities accessible while dependent editing is disabled.
- [ ] Add v1/v2/v3, old/new/mixed-record, working-draft, invalid-source, active/inactive snapshot, duplicate/remap, conflict, quota/denial, corrupt/newer, backup/restore, catalog-unavailable, and no-write-on-read fixtures.

**Gate:** Named Save/Open and reload restore two isolated variants plus recoverable source; legacy and mixed data remain compatible without read-time writes; duplication/restore remaps identities correctly; failed storage/catalogs never destroy or falsely claim durability; export fallback remains reachable.

### Phase 10: BW-2010 — Render the same applied guide for reading and navigation

**Depends on:** Phases 5, 6, 8, and 9/BW-2005, BW-2006, BW-2008, BW-2009.

**Files:** new `components/GuideReader.tsx`, `GuideTableOfContents.tsx`, and shared `GuideDocumentView.tsx`; `components/GuideBuildCard.tsx`, `GuideSkillReference.tsx`, `GuideWorkspace.tsx`; `src/app/guide-selectors.ts`, `styles.css`; new `guide-reader.test.tsx` and `guide-navigation.test.tsx`.

- [ ] Share semantic node/build/reference renderers between editor decorations and reader where behavior is common. Reader hides catalog, insertion affordances, build mutation controls, and source/editor chrome.
- [ ] Keep contextual/generic/missing tooltips, complete compact summaries, bonus details, template copy, accessible headings, and local asset fallbacks. Template copy reads the anchored card snapshot and never active selection.
- [ ] Generate deterministic collision-safe heading anchors and stable direct build anchors from applied identities. Add section/variant navigation and keyboard focus movement without treating navigation as authored selection.
- [ ] Add expand/collapse for detailed build information and responsive wrapping. Expansion, anchor navigation, tooltip use, and copy are non-authoring actions and create no dirty state/history.
- [ ] Show truthful last-valid messaging when source is unapplied/invalid. Return to Visual/Source with applied content and a reasonable restored bookmark while retaining the raw buffer.
- [ ] Test read-only action boundaries, semantic parity with edit, two variants, correct template copies, bound/generic/missing references, stable anchors, duplicate headings, long names, narrow layout, and 200% zoom constraints at component level. Actual browser evidence remains mandatory in Phase 12.

**Gate:** Read and edit express the same applied meaning; catalog and mutation controls are absent; contextual values and template copies address the correct card; reading/navigation never dirty or enter history; source recovery remains visible.

### Phase 11: BW-2011 — Add the original example and integrated workflow fixtures

**Depends on:** Phases 5–10/BW-2005 through BW-2010.

**Files:** new `src/app/examples/dagger-practice-guide.md`, `src/app/guide-examples.ts`, `components/GuideExampleDialog.tsx`; new long/hostile fixtures under `test/fixtures/guides/`; new `guide-workflow.test.tsx`; extend `App.test.tsx`, relevant domain/integration tests, `test/domain/source-policy.test.ts`, and fixture validation.

- [ ] Write an original, offline dagger-themed interaction guide with two named variants, headings, original prose, generic and bound references, optional/blank slots, verified template input, different purchased/rune/headgear/title/effect values, usage, recommendations, counters, and related linked-only sources.
- [ ] Use promoted runtime catalog IDs and approved local assets; decode/verify any template code through the existing compatibility adapter. Label the sample as an interaction fixture, not a current meta recommendation.
- [ ] Record source/provenance metadata without copied PvX prose, ratings, page bodies, remote images, or a live request. Validate against the repository source policy.
- [ ] Add an explicit Load Example action through normal dirty replacement handling. Never replace an existing draft on app boot or merely by opening the dialog.
- [ ] Add the representative 200-paragraph/20-heading/12-build/500-reference/128-KiB long-document fixture, separate exact-boundary fixtures, and focused fixtures for unresolved skill/context and raw template facts.
- [ ] Build integrated scenarios for write/format, generic and bound insertion, catalog→text, catalog→slot, cross-build copy, bonus change, context after selection, history, valid/invalid source, named save/reload, read, download/upload, and export/reimport semantic equality.
- [ ] Include generic insertion with no builds and fragment remapping with internal/external references. Prefer semantic/behavior assertions over snapshots of generated markup.

**Gate:** A repeatable original example exercises the full promise, export/reimport preserves both variants and different contextual values, loading is non-destructive, long/unresolved/raw cases are covered, and no prohibited copied/runtime-fetched content is introduced.

### Phase 12: BW-2012 — Run production verification, browser matrix, regressions, and closeout

**Depends on:** Phases 1–11/BW-2001 through BW-2011.

**Files:** future `work/sprints/SPRINT-021-EVIDENCE.md`; future raw evidence under `work/runs/SPRINT-021/`; `compendium/guide-workspace.md`, `compendium/README.md`, `README.md` if the mounted workflow warrants it; EPIC-20 tickets, executing sprint, ledger, and runner-owned result manifest. Product/test files change here only to resolve discovered defects.

- [ ] Run focused suites during implementation, then run the final repository gate with the pinned npm (`work/runs/toolchain/node_modules/.bin/npm`, npm >=11.10.1) first on `PATH` so child scripts use it: `npm run verify`. Run `git diff --check`. Record exact commands, revision, results, failures, and fixes; do not convert the supplied baseline into new evidence.
- [ ] Regress the standalone composer, skill placement, attribute preview/adjustments, title/effects, game template code, folder Load/Save/cancellation/failure, build-set/party persistence and transfer, local storage, mixed backup/restore, share boundaries, and catalog-error recovery.
- [ ] Use the production build from the final verify run and an actual installed browser against production preview. Record browser/version, OS, revision, URL, viewport, theme, zoom, fixture, actions, expected/actual result, and durable artifact path for every row below. jsdom, CSS inspection, or source review does not satisfy a browser row.

| Browser scenario | Required future evidence |
| --- | --- |
| Feasibility continuity | Reconfirm the chosen editor's paragraph, inline reference, editable build, source round-trip, shared undo, focus, and IME behavior in the integrated product. |
| Rendered authoring | Type/format every required construct; edit lists; paste safe text; use shortcuts/commands; move across inline/block embed boundaries without cursor corruption. |
| Catalog and layout | Desktop independent document/catalog scrolling; preserved visible caret while filtering; zero-build insertion; narrow dismissible catalog with focus return; long-document scrolling. |
| Pointer drop matrix | Native catalog→prose, between blocks, catalog→inactive slot, same-bar move/swap, cross-build copy, source-bar→bound prose, nested slot propagation stop, stale source, canceled drag, document switch, and external/malformed data. |
| Keyboard equivalence | Insert generic/bound mentions, select exact card/slot, place/replace, cancel, traverse commands/catalog/document, and return to caret with visible focus and announcements. |
| Variant/context isolation | Two builds with different mode/ranks/rune/headgear/title/effects; select another card and prove generic plus both bound tooltips remain correct; delete/undo/rebind missing context. |
| Cross-feature history | Undo/redo prose → drop/slot → attribute/effect → reorder/delete → source Apply in chronological order with identities/raw overlays intact. |
| Source and security | Valid Apply, invalid/unsupported/over-limit recovery, opaque retention, code-fence literal annotations, unapplied mode guard, hostile HTML/URL/image input, raw versus last-valid export. |
| Durability and transfer | Named Save/Open, autosave/pagehide/reload, unfinished source recovery, mixed backup/restore, download/upload reimport, canceled/failed import, storage unavailable/quota/conflict export fallback. |
| Targeted game template I/O | Paste and copy code for an explicitly named card; native folder Load/Save and fallback file paths target only that card; cancellation/permission/read/write failures leave the card, siblings, and prose unchanged; copied/downloaded bytes retain truthful base-only boundaries. |
| Read mode | Catalog/control absence, same applied content, section and two variant anchors, correct template copy, generic/bound/missing tooltips, expand/collapse, unapplied-source notice, return to edit. |
| Accessibility/responsiveness | Both themes; desktop and narrow viewport; 200% browser zoom; long names; keyboard focus; hover/focus/touch tooltip access; basic IME/composition; no clipping or unreachable controls. |
| Catalog failure | Simulate unavailable/adaptation-failed catalogs and demonstrate retained guide text/source/IDs, visible diagnostics, disabled dependent editing, and successful raw/last-valid export without replacement. |

- [ ] Validate the original two-variant and long-document fixtures throughout the matrix. Inspect downloaded Markdown/template bytes and reimport rather than assuming a download click proves content.
- [ ] Fix attributable failures and rerun affected focused cases plus the final gate when code changed. Preserve exact unresolved gaps; if a required browser scenario cannot run, leave its checkbox, BW-2012, affected earlier ticket, sprint, and epic incomplete.
- [ ] Update durable documentation with only shipped behavior, final syntax/editor decision, ownership/history, limits, recovery, security, migration, source normalization, target/context semantics, and explicit follow-ups. Retain public discovery, PvX intake, publishing, collaboration, live links, parties, and richer annotations as future work.
- [ ] Update all BW-2001–BW-2012 acceptance records, EPIC-20, executing sprint, ledger, durable evidence, and burn result manifest consistently. Link evidence; do not claim a feasibility prototype, jsdom check, or unrun browser row as completion. The outer runner owns commits and final result records.

**Gate:** Every earlier acceptance criterion has implementation and recorded evidence; the full actual-browser matrix, regressions, `npm run verify`, and `git diff --check` pass; documentation and completion metadata agree. Any missing required evidence keeps the affected ticket and epic open.

## Files Summary

Paths are executable recommendations based on the inspected tree. BW-2001 may change editor-specific filenames or package names only if its ADR records the equivalent boundary; it may not collapse semantic, vendor, codec, and persistence layers.

| Area | Add | Change/audit |
| --- | --- | --- |
| Domain model/codec | `src/domain/guide-codec.ts`, `guide-validation.ts`, `guide-transfer.ts`; guide fixtures/tests | `src/domain/guide.ts`, `ids.ts`, `index.ts` |
| Editor bridge | `src/app/guide-editor-adapter.ts`, `guide-build-adapter.ts` | Selected packages in `package.json`/`package-lock.json` only after BW-2001; no vendor state in domain/persistence |
| Guide state/history | `src/app/guide-workspace-state.ts`, `guide-history.ts`, `guide-selectors.ts`, `guide-clipboard.ts` and tests | `workspace-state.ts`, narrowly `editor-state.ts`/`build-set-state.ts` at adapter seams |
| Authoring UI | `AppWorkspaceSwitcher.tsx`, `GuideWorkspace.tsx`, `GuideToolbar.tsx`, `GuideEditor.tsx`, `GuideCatalog.tsx`, `InlineSkillTooltipTrigger.tsx` | `App.tsx`, `BuildComposer.tsx`, `FocusedSkillCatalog.tsx`, `SkillTooltip.tsx`, `styles.css` |
| Build embeds | `GuideBuildCard.tsx`, `GuideBuildDetails.tsx`, `GuideBuildInsertDialog.tsx` and tests | Existing composer header, bar, attributes, title/effects, inline template, template file/dialog components and workflows |
| References | `GuideSkillReference.tsx`, `GuideReferenceDialog.tsx`, `GuideSkillCompletion.tsx` and tests | `editor-selectors.ts`, preview/display/tooltip components |
| Placement | `guide-placement.test.tsx`, `guide-drag-integration.test.tsx` | `drag-payload.ts`, placement planner/actions, `SkillBar.tsx`, catalog/editor/card targets |
| Source/files | `GuideSourceEditor.tsx`, `GuideTransferDialog.tsx`, `GuideModeGuardDialog.tsx`, `guide-files.ts` and tests | Guide codec/state, `App.tsx` |
| Persistence/recovery | `GuideSaveOpenDialog.tsx`, guide persistence fixtures/tests | `persistence-schema.ts`, `local-storage.ts`, `workspace-state.ts`, `backup-restore.ts`, library selectors/fixtures, storage banner, all document-union consumers |
| Reading | `GuideReader.tsx`, `GuideTableOfContents.tsx`, `GuideDocumentView.tsx` and tests | Shared card/reference/workspace renderers and styles |
| Examples/integration | `src/app/examples/dagger-practice-guide.md`, `guide-examples.ts`, `GuideExampleDialog.tsx`, `test/fixtures/guides/*`, `guide-workflow.test.tsx` | `App.test.tsx`, source-policy and relevant integration suites |
| Decisions/docs/evidence | `compendium/decisions/0003-guide-editor-and-markdown-contract.md`, future `work/sprints/SPRINT-021-EVIDENCE.md`, raw `work/runs/SPRINT-021/*` | `compendium/guide-workspace.md`, indexes/README as warranted, tickets/sprint/ledger/runner records at closeout |

## Definition of Done

- [ ] **BW-2001:** The final syntax, ownership, limits, context, transfer, history, and recovery contract is recorded; one maintained editor/parser stack has passed the actual-browser paragraph/reference/editable-build/shared-history/semantic-round-trip slice; package compatibility, license, accessibility, and bundle evidence is durable.
- [ ] **BW-2002:** The framework-neutral guide model and codec preserve supported semantic meaning, complete durable snapshots, explicit contexts, metadata, namespaces, escaping, exact opaque content or recoverable source lock, and deterministic hostile/conflicting/over-limit diagnostics.
- [ ] **BW-2003:** Every authored prose/build/source mutation uses one bounded chronological history; two variants remain isolated; selection/filter/view changes are non-authoring; deletion/undo, duplication, materialization, and cross-document fragment remapping follow stable identity rules.
- [ ] **BW-2004:** Authors edit rendered required Markdown with the right catalog, explicit target, stable bookmark, commands/shortcuts, responsive sheet, keyboard/focus support, no-build behavior, catalog-error recovery, and intact standalone composer.
- [ ] **BW-2005:** Blank/template/current/saved inserts own independent complete Build v4 snapshots; cards expose compact summary and one active details panel; targeted template/file operations, rename/reorder/duplicate/delete, incomplete state, raw overlays, and existing validation/control behavior are proven.
- [ ] **BW-2006:** Generic and named-build atomic references use runtime catalog IDs, correct context after other-card selection, visible/repairable missing states, inline-safe accessible local-asset displays, and no invented rank or silent retarget.
- [ ] **BW-2007:** Every drop-matrix row and keyboard/click equivalent produces exactly one target-isolated transaction; inactive targets, raw overlays, placement legality, cross-build copy, stale/canceled/document-switch input, caret/slot indicators, and propagation boundaries are verified in an actual browser.
- [ ] **BW-2008:** Source Apply is atomic; invalid/unapplied raw source and diagnostics survive transitions/reload; unknown content is exact or safely blocks visual editing; last-valid versus raw export is truthful; Markdown download/upload/paste round-trips complete meaning and enforces inert/limit rules.
- [ ] **BW-2009:** Schema-v3 migration, named Save/Open, autosave/pagehide/reload, clone/fingerprint/remap, mixed backup/restore, storage conflict/quota/denial/corruption/newer-schema handling, catalog failure, and export fallback preserve existing and guide data without write-on-read or false durability.
- [ ] **BW-2010:** Read mode renders the same applied nodes and contexts with catalog/mutation controls hidden, correct template copies, accessible headings and stable anchors, responsive details/navigation, truthful source status, and no dirty/history effects.
- [ ] **BW-2011:** The original offline two-variant dagger-themed example, no-build/unresolved/raw fixtures, and long-document fixture exercise write/edit/reference/drop/history/source/save/reload/read/export-reimport without copied PvX prose, runtime remote assets, or destructive auto-load.
- [ ] **BW-2012:** All earlier acceptance criteria link concrete implementation/test evidence; actual browser evidence covers both themes, narrow layout, 200% zoom, keyboard, pointer drag, focus/IME, long scrolling, source recovery, catalog/storage failure, transfer, reload, and read navigation; required regressions, pinned `npm run verify`, and `git diff --check` pass.
- [ ] Existing standalone build, build-set, party, template code/file, attribute/title/effect preview, local storage, backup/restore, and sharing boundaries remain compatible.
- [ ] No backend, hosted publishing, accounts, collaboration, public discovery, PvX ingestion/copying, live build links, full party embeds, full equipment editor, remote image fetch, raw HTML/MDX execution, or generic editor product enters the delivered scope.
- [ ] Documentation describes the shipped implementation and retains all follow-ups; tickets, sprint, EPIC-20, ledger, durable evidence, and runner result agree. Missing browser/dependency/validation evidence leaves the corresponding checkbox and status open.

## Risks

| Risk / hidden cost | Mitigation and blocking gate |
| --- | --- |
| Editor focus, IME, decorator boundaries, or controlled reconciliation conflicts with semantic ownership | BW-2001 proves the exact bridge in an actual browser before package/architecture commitment; fallback receives the same test. |
| Vendor and application undo both act | Disable vendor history, route undo/redo to guide commands, test cross-feature sequences in feasibility and full browser closeout. |
| Semantic document, source buffer, active build editor, and persisted payload diverge | Applied guide is the only last-valid owner; build adapters materialize immediately; source is explicitly unapplied; invariants compare snapshots before history/export/save. |
| Unknown Markdown is normalized away | Store exact source slices for isolatable opaque nodes; if safe reinsertion is impossible, block visual editing and retain raw source. Never best-effort strip. |
| Complete snapshot JSON makes Markdown verbose or exposes conflicts with template code | Compact shorthand accepts no competing build payload; successful Apply expands it; serializer emits one complete authoritative snapshot; canonical code is derived. |
| Persistence change misses an exhaustive union branch | Maintain the explicit branch audit from Architecture and compile under `noFallthroughCasesInSwitch`; add guide/mixed fixtures to persistence, workspace, backup, selectors, and transfers. |
| App catalog failure still prevents recovery | Move hydration/source/export outside catalog readiness in Phase 4 and include a dedicated browser closeout row. |
| Generic references accidentally use active build rank zero | Add an explicit generic selector context with range output; forbid `EditorState` fallback; test zero-build and selected-third-card cases. |
| Drag payload replays against another build/document or cancellation deletes a source | Nonce/document/revision/source fingerprint validation; explicit target handlers; drag end only clears transient state; native browser stale/cancel matrix. |
| Fragment or saved-record duplication creates identity collisions | One pure remapper handles semantic nodes, build IDs, nested Build IDs, internal contexts, saved duplication, and backup conflict copies; external contexts stay unresolved. |
| Full-document history consumes excessive memory or causes long-doc lag | Fixed 100-entry/16-MiB cap, typing grouping, preselected document limits, long fixture, bundle/runtime observation during real browser tests; do not invent a benchmark after implementation. |
| Local storage quota is exceeded by guides and history/source | History is transient; source/doc limits are fixed; write failure is recoverable and truthful; Markdown export remains available. |
| Reusing composer controls imports active-editor assumptions | All guide adapters require document/build IDs; targeted selectors hydrate the named snapshot; inactive-target tests cover every imported control/workflow. |
| Package versions, licenses, or bundle impact are unacceptable | No dependency is committed as final until official-doc, resolved-version, transitive-license, build, and measured bundle review passes BW-2001. |
| The parser stack requires DOM/Node globals in the strict domain build | Include `tsconfig.domain.json` compatibility in BW-2001; choose an environment-neutral parser boundary or relocate only the injected codec implementation without moving semantic contracts into React/app state. |
| Example content infringes or implies current recommendations | Original prose, linked-only provenance, explicit interaction/non-meta label, local assets only, and source-policy tests. |
| The epic is marked done from component tests while browser interactions remain broken | BW-2012 requires a row-by-row actual-browser artifact and keeps tickets/sprint/epic open for any missing scenario. |

## Security

- Treat Markdown, metadata, annotations, clipboard text, dropped data, uploaded files, saved records, and restored backups strictly as data. Never evaluate MDX/JSX, scripts, event attributes, style HTML, template expressions, or guide text as application instructions.
- Recognize only the exact v1 marker, metadata/build fences, and skill directive grammar. Other raw HTML/directives remain escaped inert content or recoverable opaque source. Rendering uses React text nodes, not `dangerouslySetInnerHTML`.
- Allow user-activated `https:`, `http:`, `mailto:`, and internal fragment links after URL parsing. Reject or render inert `javascript:`, `data:`, `file:`, blob supplied by content, protocol-relative, malformed, and control-character-obfuscated targets. External links use safe opener isolation.
- Markdown images and remote embeds render as inert alt/link text in this milestone. Parsing, previewing, reading, or opening a guide performs no automatic remote fetch. Skill/rune/profession media resolves only through approved bundled/local asset maps with readable fallbacks.
- Enforce UTF-8 byte, node, depth, build, reference, source, metadata, JSON nesting, and string limits before recursive adaptation. Use dense arrays, exact keys, safe integers, duplicate detection, dangerous-key rejection, and bounded diagnostics to resist prototype pollution and resource exhaustion.
- The internal drag/clipboard MIME is versioned, exact-key validated, session/document scoped, and source-fingerprinted. Never trust DOM target, MIME kind, source slot, or skill ID without current state/catalog checks. External HTML drops/pastes degrade to safe supported text/Markdown or a clear no-op.
- File import validates complete contents before replacement and retains the prior guide on error/cancel. Downloads use locally created object URLs, revoke them, and distinguish raw-draft from validated-guide filenames/content. Game-folder access remains explicitly user initiated and build-targeted.
- Missing catalogs cannot relax structural validation. Catalog lookup enriches or disables dependent UI; it does not decide whether stored IDs and text survive.
- Keep source/provenance links metadata-only. The runtime example performs no PvX fetch and includes no copied community prose, ratings, body content, or unapproved remote media.

## Dependencies

- EPIC-20's declared dependencies (EPIC-01, 04, 05, 06, 09, 16, 18, and 19) are treated as completed inputs. This sprint must preserve their build editor, catalog, templates, library, build-set/party, tooltip, title, and attribute-adjustment contracts.
- Build v4, `PersistedBuildSnapshot`, the current placement/template adapters, preview/resolution selectors, strict local storage, backup/restore, and approved local assets are required internal dependencies. No guide-specific replacement of these systems is allowed.
- The editor/parser package set is an explicit BW-2001 dependency gate. Candidate default is Lexical plus unified/remark directives; exact packages/versions, lockfile changes, license acceptance, React 19/Vite 6 compatibility, and bundle impact must be proven before dependent implementation. Network/package unavailability leaves the gate open rather than authorizing vendored or unreviewed code.
- Actual installed browser access is required for BW-2001 and BW-2012. A File System Access-capable browser is required for native folder cases; the fallback upload/download path must also be tested. No browser dependency needs to be permanently added merely to collect manual/automated UI evidence.
- Final verification uses the repository-pinned npm at `work/runs/toolchain/node_modules/.bin/npm` with its directory first on `PATH`, the existing Python data environment, `npm run verify`, and `git diff --check`.
- No backend, database, remote document service, live PvX endpoint, remote image host, account, collaboration provider, or hosted publishing dependency is introduced.

## Open Questions

These are execution gates or recorded defaults, not routine questions for the user:

1. **Which editor/parser combination actually passes?** Candidate default is Lexical plus unified/remark. BW-2001 must settle this with current official documentation, resolved package/license/bundle facts, and the actual-browser slice. Failure invokes the bounded fallback rule; it does not permit broad integration on an unproven stack.
2. **Does the proposed directive/fence syntax conflict with the chosen parser or editor clipboard behavior?** The candidate syntax is the implementation starting point. BW-2001 may adjust delimiters only while preserving readable Markdown, namespaced IDs, code literalness, exact opaque recovery, one-of template/snapshot authority, and recorded examples before BW-2002.
3. **Which unknown constructs can remain visually editable?** The codec should isolate exact opaque inline/block nodes where safe. Any construct that cannot survive neighboring edits exactly forces recoverable Source mode. The default is data preservation over visual editability.
4. **Can the vendor adapter remain a transient mirror without focus or IME regression?** This is the central feasibility question. The application history/semantic owner is non-negotiable; if the candidate cannot support it, choose a passing fallback rather than persisting vendor JSON or accepting dual histories.
5. **Are the fixed 1-MiB/10,000-node/64-build/5,000-reference and 100-entry/16-MiB history limits practical?** They are the selected contract defaults and must be exercised with exact boundary fixtures plus the separate representative long-document fixture during BW-2001/BW-2002/BW-2011. Change them only in the decision record before broad implementation, not post hoc to make closeout pass.
6. **What if required browser, dependency, or native folder evidence is unavailable?** Continue safe independent unit/integration work, record the exact gap, and leave every affected gate/ticket/sprint/epic incomplete. No component test, code inspection, or simulated success substitutes for required actual-browser evidence.
