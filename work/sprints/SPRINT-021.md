---
id: SPRINT-021
title: Markdown Guide Workspace
status: in_progress
execution_status: blocked
approval: auto-approved
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
updated: 2026-09-27
---

# Sprint 021: Markdown Guide Workspace

## User-approved verification amendment — 2026-09-27 UTC

The user explicitly authorized skipping the remaining manual/native composition
verification and proceeding. The [user-authorized composition verification deferral](evidence/SPRINT-021/native-composition-deferral.md) is authoritative
for this sprint, its B01/Phase 1/4/12 checks, Definition of Done and linked tickets.
Record that evidence as unverified/deferred; do not claim it passed. Composition
handling and automated regression tests remain required. All other acceptance,
dependency, browser, validation and checklist requirements remain unchanged.
Historical blocked attempts below do not reinstate this deferred check.

## Current execution outcome

Implementation and independent browser checks are complete through the original local guide workflow; [final acceptance mapping](evidence/SPRINT-021/phase12.md) records the evidence. Actual file uploads/reimports remain blocked by the [browser security/permission gate](evidence/SPRINT-021/upload-permission-gap.md). BW-2001–BW-2007 are done; BW-2008–BW-2012 and EPIC-20 remain in progress. No native composition completion is claimed, no patch is re-archived in place of implementation, and no completed result is written with open items.

## Overview

Deliver the complete local author/read workflow from [EPIC-20](../tickets/20-markdown-guide-workspace/EPIC.md): rendered Markdown writing, independently owned interactive builds, generic and variant-bound skill mentions, the right-hand catalog, pointer and keyboard placement, chronological undo, safe source Apply, local Save/Open/recovery, portable Markdown and a clean reading view. The [guide workspace brief](../../compendium/guide-workspace.md) governs product behavior.

All twelve tickets belong to this dependency-gated sprint. BW-2001 must prove the paragraph/mention/editable-build slice before broad integration. A failed feasibility gate stops dependent work; a prototype does not complete the epic. Existing standalone composer, game templates, build-set/party records and storage protections remain compatible. Discovery, PvX intake, copied community prose, publishing, accounts, collaboration, backend sync, live library links, full party embeds, equipment management and an independent editor product remain follow-ups.

Planning used all three independent Codex drafts and all three cross-critiques. [Merge notes](drafts/SPRINT-021-MERGE-NOTES.md), [intent](drafts/SPRINT-021-INTENT.md) and [planning evidence](drafts/SPRINT-021-PLANNING-EVIDENCE.md) record decisions and observations. The routine interview is skipped and this internally consistent plan is auto-approved under the automation contract. The original planning pass left every implementation checkbox open. The current checklist below records verified execution progress; no commit was made.

## Assumptions

- One sprint covers BW-2001–BW-2012, with explicit stops rather than silent scope cuts. No additional sprint number is reserved.
- Editor/parser, syntax and capacity defaults below are starting hypotheses. BW-2001 records the evidence and freezes them before dependent implementation; routine choices require no new product interview.
- Use the existing single working-document model. Composer/Guide creation or opening is an explicit guarded replacement, not two silently persisted drafts. Offer Save/export or Cancel before discarding dirty data, including source-only changes.
- Use existing local storage and complete Build v4 snapshots. No storage-engine migration or new backend is assumed. If measured storage/editor feasibility requires a materially different architecture, record the blocker before expanding scope.
- The supplied baseline passed formatting, lint, types, 587 Vitest tests, production build, 149 ingestion tests and 21 runner tests. These are supervisor-reported results, not evidence produced by this planning pass.
- Actual browser and package access are execution dependencies. Missing evidence leaves the corresponding gate open; it cannot be replaced by jsdom or a claim based on source inspection.

## Use Cases

| Action                                                            | Required outcome                                                                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Write a guide before inserting builds                             | Rendered Markdown and generic catalog insertion work without a fabricated build or slot target.                               |
| Insert current, saved, blank or template-derived builds           | Complete independent snapshots; editing a guide never changes the source library/composer record.                             |
| Give two variants different ranks, gear, titles, mode and effects | Each card and its bound mentions use that variant even when another card is selected.                                         |
| Drag or insert a skill into prose                                 | One reference at the visible caret; catalog source defaults to generic, bar source binds its build; no bar changes.           |
| Place into an inactive card or move between bars                  | Explicit target placement; same-bar move/swap, cross-build copy, source and sibling isolation.                                |
| Duplicate, reorder, rename, delete or paste a fragment            | Stable identities, independent copies, reference-aware deletion and collision-safe remapping.                                 |
| Undo across prose, slot, attributes, deletion and source Apply    | One chronological guide history restores complete snapshots, identities and context.                                          |
| Make source invalid, change modes or export                       | Last-applied guide and exact raw draft remain separate; Apply is atomic; raw and applied downloads are clearly distinguished. |
| Save/Open/reload or restore a mixed backup                        | Complete guide and recovery state survive; old build/build-set/party records and rejected payloads remain protected.          |
| Read and follow a variant anchor                                  | Same applied content and context, correct template copy, hidden catalog/mutation controls, no authored change.                |

## Architecture

### Current integration boundaries

| Inspected boundary                                                                     | Required work                                                                               |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/domain/guide.ts` scaffold; exports and `test/domain/contracts.test.ts` consumer   | Evolve deliberately; no persisted legacy guide exists and no party embed is required.       |
| Build v4; `PersistedBuildSnapshot` includes budget and raw overlays                    | Reuse the complete payload, existing rules and source-fidelity checks.                      |
| Global `workspace.editor`, selected-card selectors and null active build-set snapshots | Guide reads must use complete addressed snapshots at all times.                             |
| Catalog clicks place into the current bar; no selected build disables catalog          | Introduce explicit prose/slot/no-target intent and generic display.                         |
| Div-root tooltip trigger, repeated fixed DOM IDs                                       | Provide valid inline triggers and unique card/control labels.                               |
| Slot-index drag payload; failed drag removes a source slot                             | Add session/build/slot identity and guide-specific cancellation behavior.                   |
| Build/build-set persistence unions; envelope and backup v2                             | Audit all branches, introduce explicit versioned guide support and old-schema write guards. |
| Catalog-error early return and null `savedWith` autosave/pagehide guards               | Keep recovery and durable source storage independent of successful catalog validation.      |
| Whole-envelope synchronous fingerprints                                                | Use revision-driven scheduling and measured serialization costs for guide edits.            |

### Semantic owner, build adapter and editor bridge

Evolve a framework-neutral `GuideDocument<BuildPayload>` in `src/domain/guide.ts`, following the existing generic BuildSet precedent. It owns metadata, Markdown blocks/marks, build embeds, skill references and inert opaque nodes. Domain code retains its strict no-DOM/no-React/no-app-import boundary.

Instantiate the guide in app code with the existing `PersistedBuildSnapshot`. An injected `guide-build-adapter.ts` provides structural validation, cloning, template expansion and control projection. Extract reusable existing snapshot validation if needed; do not maintain a second handwritten snapshot schema. A pure, vendor-independent codec under proposed `src/guide/` takes that adapter as an input and never imports app/editor/vendor state. Portable snapshot format v1 explicitly carries current Build v4, PvE budget and the complete raw overlay. Historical library Build versions keep their existing migrations; future unsupported guide/build payloads enter recovery instead of being stripped.

Every applied build node always contains its complete snapshot. Existing control `EditorState` is a derived cache keyed by session, build ID and snapshot revision. Reduce an addressed action and publish its complete durable result atomically before selectors, history, export or save observe it. Invalidate caches after Apply, undo, delete or replacement. Existing composer/build-set branches can retain their current implementation; unqualified global editor actions cannot mutate guides.

Start with an atomic build card in the rendered document, with its bar and summary visible, and one selected inspector outside the prose `contenteditable` region. The inspector reuses existing controls and updates the card immediately. Compare inline control hosting only if the simpler arrangement fails a required interaction. This avoids repeating full panels in every card while preserving direct build editing.

The vendor editor is a private projection/selection/composition adapter. Default to neutral guide transactions and one bounded guide history, with vendor-local history disabled. If that fails native undo or composition, evaluate vendor step/bookmark facilities as the implementation of that same unified history, including build commands. Vendor JSON still cannot become the portable/persisted authority. BW-2001 must choose and explain the integration design, not merely an editor brand. Distinguish local editor changes from app reconciliation to prevent feedback loops; do not remount/reset the entire editor on each keystroke. Finish or explicitly cancel composition before incompatible commands; never apply a partial composition.

Evaluate at most two editor stacks: Tiptap/ProseMirror first, Lexical if the first fails a documented criterion. Use a separate bounded Markdown parser/serializer; unified/remark with narrow directive handling is the starting codec candidate. This ordering is an experiment plan, not a claim of proven compatibility. After official-documentation/license precheck, provisional packages may be installed for the slice during execution. Record exact versions, dependency tree and production chunk delta; lazy-load authoring-only editor code. Select/pin only after the real slice passes; remove rejected packages, harnesses and enabled prototype routes. Do not build a bespoke general editor as a fallback.

### Identity, metadata and portable source

| Identity or value          | Owner and rule                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portable guide ID          | Serialized metadata; preserved on export/import and whole-guide Save As/backup copies.                                                                            |
| Runtime session/generation | New on open/replace; never serialized; distinguishes two open copies with identical portable IDs.                                                                 |
| Guide build ID             | Stable within a guide; used by mentions and variant anchors. Its serialized value equals nested `snapshot.build.id`; mismatch or duplicate is a structural error. |
| Build name                 | `snapshot.build.name` is the sole card label; rename changes it without changing identity. No second independently authored label.                                |
| Prose/vendor node IDs      | Transient mapping identities; excluded from portable semantic equality unless a future format explicitly needs them.                                              |
| Library record ID          | Separate storage identity; can remap on backup conflicts without rewriting guide/source content.                                                                  |
| Catalog skill ID           | Explicit catalog namespace; never inferred from names or treated as a game-template ID.                                                                           |

Blank/current/saved/template insertion and build-only duplication allocate a fresh guide build/nested Build ID together. Rename/reorder preserve it. Copying the current standalone build means capturing its complete snapshot at an explicit Composer → Guide action before guarded replacement; that in-memory copy buffer is not a second durable draft. It remains available for insertion in that guide session; after reload, use saved/template input when the buffer is absent. Never substitute the selected guide card for “current standalone build.”

Guide title and tags are the authored authority. Named Save/Save As changes the guide title through the same transaction boundary; library name/tags mirror it. Saved-guide rename updates the applied guide and marks an existing source draft as based on an older revision without rewriting its raw bytes. Reapplying such source requires explicit whole-document replacement acknowledgement; it never silently rebases. Record notes remain library-only. Metadata/source fields have visible edit controls. Source references are compact label/URL plus optional attribution, license text/URL, revision and notes; do not expose the full ingestion review contract or infer redistribution approval.

Use one provisional v1 grammar, to prove and freeze in BW-2001: strict JSON root metadata and build directives plus a namespaced inline skill directive. For example, this is a grammar illustration, not a validated game fixture:

```markdown
:::bw-guide
{"version":1,"id":"guide-example","title":"Practice notes","summary":null,"tags":[],"sources":[]}
:::

General: :bw-skill[]{skill="catalog:skill:123" context="generic"}.
Variant: :bw-skill[]{skill="catalog:skill:123" build="gb-main"}.

:::bw-build
{"version":1,"id":"gb-main","template":"<game-template-code>","mode":"pve"}
:::
```

Full export replaces input-only `template` shorthand with `snapshotVersion: 1` and one complete `snapshot`; it emits no co-authoritative game code. `template` and `snapshot` together are a fatal conflict even if apparently equivalent. Shorthand may accept validated explicit budget/title/adjustment inputs that a game code cannot express; freeze exact allowed keys. Mode is explicit (default PvE for new shorthand), never inherited from an unrelated selected card. Preserve original raw template facts as historical fidelity evidence governed by current export rules, not as a second build to reapply.

Freeze exact escaping, allowed keys, directive delimiters, duplicate JSON-key detection, ID syntax, source spans and normalization with golden examples. Known block directives are top-level only. Unmarked ordinary Markdown imports with new metadata; reserved annotations lacking a supported version require recovery rather than a silent downgrade. Code fences, inline code and escaped annotation-looking text remain literal. Minimum supported vocabulary is paragraphs, headings, emphasis/strong, ordered/unordered lists, links, blockquotes and inline/fenced code. Normalize only documented ordinary whitespace/markers. Retain opaque source slices exactly, including line endings, and prove safe reinsertion after neighboring edits; if context cannot be preserved, keep the whole raw document in source recovery and block visual editing. No regex substitutions over arbitrary Markdown.

Skill context is a durable union: generic; local build-bound; or detached external context carrying original guide/build identity and a reason. Missing local targets remain local and resolve again on deletion undo. Detached contexts have explicit serialized annotation fields and remain unresolved even if a destination has an equal build ID, until the author rebinds. Unknown skills are recoverable lookup failures; duplicate IDs, malformed shapes and conflicting representations block Apply.

Same-document moves preserve identity. Fragment copies allocate fresh IDs for contained builds and remap their contained mentions together. Same-document references to builds outside the fragment retain local bindings; cross-document or untrusted-origin external references become detached. Validate structured clipboard data regardless of nonce; an absent/stale nonce means external copy, not trusted move. Whole-guide Save As/backup collision copies get new library/session identities but preserve internal portable IDs and exact source. Never regex-rewrite invalid or opaque source. Test repairing and applying a copied invalid draft after reload.

### Transactions, source recovery and bounded durability

All commands carry runtime session/generation, addressed guide/build where applicable and the relevant expected revision. Successful changed gestures commit one transaction; no-op, canceled, rejected or stale operations commit zero. Store semantic states with structural sharing or equivalent tested patches; new edits after undo clear redo. UI selection, hover, filters, reading, collapse and mode visibility are not authored changes. Guide Undo/Redo must work from prose and embed controls, including native supported undo events.

| Event                                                   | Applied document, recovery and history                                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open Source                                             | Generate a clean projection; no dirty/history change.                                                                                                               |
| Type in Source                                          | Keep exact raw buffer with base revision; mark recovery dirty and autosave it; applied guide stays unchanged. Native source-text undo operates only on that buffer. |
| Successful Apply                                        | Parse/validate/resolve the entire candidate, recheck revision, then commit once; capture prior recovery state for undo.                                             |
| Failed/unsupported Apply                                | No partial mutation or history; keep raw input, diagnostics and last-applied guide.                                                                                 |
| Apply → Undo/Redo                                       | Restore the document and captured recovery state together; no stale synchronized source may overwrite the restored document.                                        |
| Semantic undo or return to visual with unapplied source | Offer Apply, Keep Editing Source, or explicit Discard first. Failed Apply remains in Source.                                                                        |
| Read with unapplied source                              | Show last-applied content with a visible notice and return path; preserve raw draft.                                                                                |
| Visual editing after a clean Apply                      | Invalidate/regenerate the clean source projection; never regenerate an unapplied draft.                                                                             |
| Save/Open/clone/restore                                 | Preserve applied state, raw source and its stable base/status facts; rederive diagnostics on hydration. History/focus are transient.                                |
| Export                                                  | Distinguish last-applied portable guide from exact raw draft download; never claim failed parsing is lossless semantic export.                                      |

Use small revision tokens, not full serialized document strings as embedded `basedOnFingerprint` values. Semantic equality and recovery dirtiness are distinct; source-only edits trigger replacement guards and durability. Schedule guide autosave from durable revisions and debounce serialization; do not serialize the whole library on selection/hover or every text keystroke. Cache per-revision projections/fingerprints and measure the actual edit/save path before accepting the design.

Initial capacity candidates are 1 MiB canonical applied source, 2 MiB retained raw source, 10,000 semantic nodes, depth 32, 32 builds, 2,000 mentions, 64 source references, 64 KiB metadata and 100 diagnostics with an omitted-count indicator. Start with 100 history entries / 16 MiB retained history and 750 ms adjacent typing groups; composition is one group and gestures close typing groups. Start aggregate admission review at 8 MiB serialized library and 16 MiB backup, measuring both UTF-8 file bytes and JS/storage string cost. These are hypotheses, not demonstrated capacity or browser quota guarantees.

BW-2001 must measure and freeze applied/raw/aggregate/history budgets against a representative fixture (about 400 prose/list/code blocks, 16 builds and 600 mentions), existing legacy fixtures, envelope serialization, autosave and pagehide. Record exact resulting sizes and acceptable observed behavior before broad integration. Apply limits before expensive recursion and before visual/paste/build commits, including canonical serialization growth from shorthand. Accepted supported documents must export and reimport under the same limits. Reject oversized single history transactions before mutation; prune oldest whole entries without discarding current state or recovery. Above-limit external intake leaves the existing document/buffer intact and the original file untouched; no truncation or false autosave claim. Valid in-memory work survives quota failure with download available. Aggregate overflow never silently drops old records; do not introduce IndexedDB implicitly to make the gate pass.

### Catalog intent, projections and placement

Catalog intent is prose(bookmark), slot(build ID, slot index), or no valid target, separate from the expanded card. Show the intended target. Bookmarks map through accepted editor transactions and survive catalog focus/scroll. Replacement, document switches or unmappable deletion invalidate them; never fall back to the last slot or an arbitrary paragraph. Provide an explicit Insert at End action when no caret exists. Narrow catalog access restores focus.

Bound tooltips resolve the named snapshot's mode, base/bonus ranks, title overrides, effects and raw uncertainty. Generic display explicitly uses catalog facts/ranges and available mode variants, without an empty Build masquerading as rank zero. Selection never changes persisted context. Author/read share projections, local icons, inline-safe hover/focus/touch tooltips and visible unresolved/repair states; reader repair controls are disabled.

| Source / target                   | Result                                                                  |
| --------------------------------- | ----------------------------------------------------------------------- |
| Catalog → prose                   | Generic mention at visible drop caret; no build change.                 |
| Catalog → between blocks          | Paragraph containing one generic mention.                               |
| Catalog → build slot              | Existing placement planner against that exact card/slot, even inactive. |
| Same bar                          | Existing move/swap and raw-overlay behavior.                            |
| Another bar                       | Copy resolved skill through target placement rules; source unchanged.   |
| Bar → prose                       | Mention bound to source build; source unchanged.                        |
| External text / malformed payload | Safe text behavior or clear no-op; never guessed slot placement.        |

Version internal MIME and validate exact keys, session nonce, source document/build/slot, current skill/raw-overlay fingerprint and target existence. Target identity comes from the handler/hit test, not arbitrary payload or selected card. Reordering with unchanged stable source facts can remain valid; deletion, changed slot or document generation invalidates it. Unresolved raw-only bar entries retain same-bar move behavior but cannot be guessed into a catalog skill for cross-build/prose insertion; show an explicit unavailable result. Consume nested slot drops once and stop propagation. Guide dragend only clears transient state; it never uses legacy remove-on-`none`. Preserve standalone drag behavior under a separate explicit policy and regression test. Click/keyboard pick-place-cancel uses the same commands, Escape cancellation and announcements.

### Persistence, asynchronous IO and reading

Use guide snapshot v1, next library envelope v3 and backup v3, retaining `build-wars:v1` as the storage key. Confirm current versions again before implementation. Read historical library/backup v1/v2 through existing migrations, preserving build/build-set/party records, drafts and associations. No read-time writes or invented legacy guides. Newer unsupported payloads remain recoverable and write-blocked; older app versions must reject the newer envelope rather than partially overwrite it.

BW-2003 introduces exhaustive runtime/materialization/clone contracts and an explicit development write guard: until BW-2009 implements valid serialization/migration, guide autosave/pagehide/named writes cannot reach a v2 envelope or replace the previous durable draft. Show memory-only state. All intermediate phases remain typecheckable. BW-2009 activates real storage and removes the temporary guard only after its tests pass.

Audit hydration, materialization, cloning, dirty fingerprints, selected snapshot, library summaries/facets, record save/update/duplicate, backup merge/replace/remap, and build-set/party transfer branches. Build-set/party-only operations explicitly reject guide input. Preserve stored catalog audit facts or explicit unknowns without claiming fresh validation. Catalog failure must retain guide text/source/IDs, autosave/pagehide and export; disable only dependent editing. Quota, denial, corrupt/newer payloads and cross-tab revision conflicts stay visible, preserve rejected data and never report a failed save as durable.

Template Load/Save/Copy addresses an explicit card. Capture session, card and revision plus the exact snapshot being saved; after permission/read/write awaits, revalidate before any app mutation or rename. Selection alone does not redirect; target edits/deletion, Apply/undo replacement or document switch make stale completion a no-op with a message. Bytes already written externally are not undone by guide history; report which captured snapshot was written. Apply the same stale guards to Markdown reads/parsing. Copy retains current exact-source/canonical fidelity and states that game codes omit guide/bonus metadata. Incomplete builds remain editable.

Read mode uses the same applied tree and projections, without catalog or mutation shortcuts. Headings and stable build anchors support navigation, details and correct template copy without dirty/history changes. Namespace local guide anchors separately from existing game-template share fragments; reload resolves only against the matching restored guide. No hosted publishing is implied. Return to edit with reasonable selection and retained source recovery.

## Implementation

Complete incoming ticket dependencies and the phase gate before accepting a ticket. Proposed new filenames may be refined in BW-2001 while preserving boundaries. Focused evidence belongs to its ticket; BW-2012 verifies the final integrated product. BW-2008 proves in-memory source behavior, BW-2009 adds reload durability, and BW-2011/2012 prove the combined flow—do not create a circular dependency.

### Phase 1: Contracts and editor feasibility — BW-2001

**Files:** `compendium/guide-workspace.md`; new `compendium/decisions/0003-guide-editor-and-markdown-contract.md`; bounded production-shaped guide adapter/editor slice and focused fixtures; provisional `package.json`/lockfile changes during execution; future evidence index.

- [x] Audit current code seams above; record the identity/metadata mapping, single-draft transition, source/history table, exact grammar, snapshot wire version, limits and failure outcomes in the ADR.
- [x] Review current official editor/parser documentation, versions, licenses, React/Vite/strict-domain compatibility and dependency tree. Provision only the bounded experiment; measure chunk delta and verify authoring lazy loading.
- [x] Prove paragraph formatting, atomic mention, visible build card and one real inspector edit, context projection, catalog bookmark, keyboard/native undo from both surfaces, automated composition-handling regressions and external semantic replacement. Native composition verification is deferred by the user-approved amendment above. Compare alternative history/hosting design when the default fails; explain the chosen/rejected designs.
- [x] Prove semantic source round trip, literal/escaped annotations, exact opaque reinsertion and unsupported fallback. Bring the representative long fixture forward; measure serialization/fingerprinting, history, autosave/pagehide and capacity behavior and freeze budgets/acceptance observations.
- [x] Record actual browser/version/input method and focused codec/history results; pin the passing dependency set, remove rejected experiment residue and consolidate the successful slice. If neither candidate passes or required browser access is unavailable, stop dependent work with exact evidence and keep the epic open.

**Gate:** A demonstrated rendered paragraph/mention/editable build shares correct focus, context, one history and source round trip. Official/package/bundle/capacity findings and concrete contracts are recorded. A list of candidate packages or a textarea preview does not pass.

### Phase 2: Guide model and annotated Markdown codec — BW-2002

**Files:** `src/domain/guide.ts`, `ids.ts`, `index.ts`, `test/domain/contracts.test.ts`; proposed `src/domain/guide-references.ts`, `src/guide/{markdown,validation,limits}.ts`, `src/app/guide-build-adapter.ts`; `test/domain/guide*.test.ts`, codec/adapter tests and `test/fixtures/guides/`.

- [x] Implement generic semantic nodes, compact metadata, one embed/nested-build identity, generic/local/detached references, structural validation and injectable ID/payload operations without app/vendor imports in the domain.
- [x] Reuse complete snapshot validation/cloning and existing template expansion. Preserve base ranks, rune/headgear choices, title/effect preferences, budget and all unresolved raw source facts; export one versioned snapshot representation.
- [x] Implement frozen grammar, bounded token/JSON processing, diagnostics/spans, canonical serializer, opaque retention and whole-source fallback. Structural conflicts are fatal; missing catalog identities are recoverable.
- [x] Implement deletion impact, duplication and fragment remapping. Golden tests cover every supported construct, two variants, blank/unresolved builds, metadata, escaping/code, duplicate keys/IDs, detached collisions, conflicts, unsafe links, unsupported versions and exact/over-limit canonical expansion.

**Gate:** Supported parse/serialize/parse preserves authored meaning; opaque bytes survive unrelated edits or visual editing is recoverably blocked. Full snapshots parse without catalogs; unresolved shorthand preserves source. Strict domain/app typechecks pass.

### Phase 3: Workspace transactions and history — BW-2003

**Files:** proposed `src/app/guide-{state,history,clipboard}.ts` and tests; `workspace-state.ts`, `composer-selectors.ts`, `persistence-schema.ts`, `App.tsx` at union/write-guard seams.

- [x] Add a true guide runtime kind, populated snapshots, revision-scoped commands, derived inspector caches and explicit prose/slot/no-target state. Reject untargeted guide editor actions.
- [x] Implement one bounded history, native/keyboard undo routing, typing/composition grouping, zero-history no-ops, redo invalidation and cache reconciliation without feedback or caret resets.
- [x] Implement source-only dirtiness, recovery/base revisions, Apply undo/redo states, explicit buffer resolution, delete/cancel/retain-unresolved and fragment/full-guide copy policies.
- [x] Introduce revision-driven serialization scheduling and explicit old-envelope write guards preserving the prior durable draft. Update all newly exposed union branches so intermediate code compiles and fails closed.
- [x] Test two-variant isolation, inactive edits, prose → slot → attribute → delete → Apply undo/redo, source-only dirty guards, ID collisions, copied invalid source repair, count/byte limits and old workspace behavior.

**Gate:** Every guide read sees complete current snapshots; one history owns all accepted edits; stale/no-op/UI actions cannot dirty or mutate content. Guide data cannot be written under v2 or overwrite a protected draft.

### Phase 4: Rendered document and catalog shell — BW-2004

**Files:** proposed `components/GuideWorkspace.tsx`, `GuideEditor.tsx`, `GuideToolbar.tsx`, `GuideCatalog.tsx`, `guide-editor-adapter.ts`; `App.tsx`, `BuildComposer.tsx`, `FocusedSkillCatalog.tsx`, `styles.css`; editor/catalog/app integration tests.

- [x] Promote the proven adapter for all required Markdown blocks/marks, shortcuts, list editing, safe paste and insert commands; expose title/summary/tags/source metadata controls.
- [x] Add explicit guarded Composer/Guide create/open transitions and capture-current-build action. Preserve dirty source and cancellation; show memory-only status until real persistence lands.
- [x] Separate catalog filtering/display from slot mutation; support zero-build generic insertion and visible target/bookmark, desktop independent scrolling and narrow dismissible catalog with focus return.
- [x] Keep recovery/text/export shell reachable under catalog failure; use valid inline atoms and unique DOM/ARIA IDs for repeated cards.
- [x] Run component coverage and actual browser writing/formatting/list/paste/cursor/keyboard checks and automated composition regressions (native composition verification is deferred), catalog focus/scroll, both themes, narrow access and long fixture.

**Gate:** Rendered writing and caret restoration work in the browser. Catalog use while writing cannot alter the previously selected bar. The standalone composer remains usable.

### Phase 5: Embedded build cards — BW-2005

**Files:** proposed `GuideBuildCard.tsx`, `GuideBuildInspector.tsx`, insert dialog; guide adapter/state; shared `ComposerHeader.tsx`, `SkillBar.tsx`, `FocusedAttributeEditor.tsx`, `TitleRankPanel.tsx`, `InlineTemplateCode.tsx`, template file/dialog/workflow/import seams and card tests.

- [x] Insert blank, captured-current, saved and template builds as independent complete snapshots with fresh identities. Use Build.name as the single card label.
- [x] Render compact professions/mode/eight-slot/copy cards and one selected inspector using existing attributes, runes/headgear, titles, budget, effects, validation and preview functions. Keep incomplete/unresolved cards editable.
- [x] Implement rename/reorder/duplicate/reference-aware delete in unified history, preserving raw overlays on unrelated edits and all siblings/prose.
- [x] Address template paste/Load/Save/Copy by captured session/card/revision. Test delayed IO after target changes, selection, delete, Apply, undo and document switch; inspect saved bytes and truthful fidelity/omission messages.
- [x] Verify two independently adjusted variants, current/saved copy independence and canceled/failed template operations in tests and actual browser controls/copy/file workflows.

**Gate:** Existing rules and complete durable facts survive every card operation. No global editor fallback, duplicate game-rules implementation, stale rename or restored equipment UI.

### Phase 6: Inline references and contextual values — BW-2006

**Files:** proposed `guide-selectors.ts`, `GuideSkillMention.tsx`, reference/context dialog; `editor-selectors.ts`, `SkillTooltip.tsx`, `SkillDisplay.tsx`, guide editor bridge and reference tests.

- [x] Provide completion or equivalent insert command, atomic inline mentions, Generic/named-build choice and explicit unresolved repair/rebind.
- [x] Factor generic catalog/range and addressed-build projections, preserving mode/title/bonus/effect behavior without borrowing active selection or inventing zero ranks.
- [x] Preserve local/deleted/detached identity through surrounding edits, move/copy, save/source representation and deletion undo; support readable long names/local icon fallbacks and inline-safe tooltips.
- [x] Test the same skill in two distinct bound contexts after selecting a third card, generic/no-build and missing/detached cases. Record browser hover/focus/touch, wrapping, atomic editing and focus return.

**Gate:** Authored context remains stable and portable; generic/bound/unresolved displays are truthful and browser interaction preserves neighboring characters.

### Phase 7: Pointer, click and keyboard placement — BW-2007

**Files:** `drag-payload.ts`, `skill-bar-actions.ts`, `skill-bar-workflow.ts`, `SkillBar.tsx`, catalog/editor/card targets; proposed `guide-placement.ts` and payload/placement integration tests.

- [x] Implement every placement-table row with versioned validated MIME, session freshness, source raw/skill fingerprint, explicit inactive targets and visible caret/slot feedback.
- [x] Reuse target placement plans for duplicate/elite behavior and raw moves; preserve copy/mention sources and consume nested slot drops at most once.
- [x] Separate guide cancellation from standalone remove-on-failed-drag behavior. Reject stale/deleted/changed sources, document switches, malformed inputs and canceled drags without authored transactions.
- [x] Provide equivalent click/keyboard pick/place/replace/cancel, Escape and announcements; prose insertion ignores bar legality/profession restrictions.
- [x] Record meaningful integration assertions plus actual native pointer and keyboard runs for all valid rows, no-ops, inactive/nested targets, scrolling, reorder, cancellation and browser-reported dropEffect none.

**Gate:** Changed accepted gestures create one transaction; unchanged/rejected gestures create zero. Source/sibling isolation and standalone drag regressions pass in the real browser and focused tests.

### Phase 8: Source editing and Markdown transfer — BW-2008

**Files:** proposed `GuideSourceEditor.tsx`, transfer/mode guard dialogs, `guide-files.ts`; codec, guide state/adapter and source/file tests.

- [x] Implement all source lifecycle transitions with explicit Apply/Keep Editing/Discard and line/column diagnostics. Validate the whole candidate, canonical growth and captured revision before one commit.
- [x] Add validated Markdown upload/paste and self-contained download. Preserve prior document/buffer on cancellation, failed/stale reads or unsupported input; distinguish raw versus last-applied export.
- [x] Apply identical inert-content, size/depth/count, clipboard and URL rules to every entry path. Preserve exact opaque content or keep recoverable source mode; never partially apply.
- [ ] Test visual → source → Apply → undo/redo → reopen source and export/reimport, malformed/unknown/conflicting inputs, canonical size growth, code literalness and invalid-source repair. Browser evidence must inspect downloaded bytes and reimport them, including canceled import and unapplied read/visual transitions.

**Gate:** In-memory source recovery and portable semantic/opaque fidelity pass. Reload/autosave integration is explicitly completed by BW-2009, not a circular prerequisite for this ticket.

Implementation validation: 674 tests/lint/build passed. [Phase 8 evidence](evidence/SPRINT-021/phase8.md) records source/download checks; required browser file reimport is pending a dismissed upload permission. Ticket acceptance remains open.

### Phase 9: Named local save, migration and recovery — BW-2009

**Files:** `persistence-schema.ts`, `local-storage.ts`, `workspace-state.ts`, `backup-restore.ts`, library selectors/fixtures/dialog seams, build-set/party transfer, `App.tsx`, `StorageBanner.tsx`; proposed minimal Guide Save/Open dialog and migration/recovery tests.

- [x] Implement strict guide snapshot v1 and library/backup v3, historical v1/v2 readers, unchanged storage key and no-write-on-read. Preserve records, associations, old drafts and party data; no invented guide migration.
- [x] Complete the exhaustive union audit, named Save/Open/Save As/rename mapping, working draft, clone/fingerprint, mixed backup merge/replace/ID conflict and anti-wipe behavior. Regenerate diagnostics; never rewrite invalid source during whole-guide copies.
- [x] Persist applied snapshots/context/metadata plus recoverable raw/base/status state, excluding history/vendor/DOM state. Activate debounced revision-driven autosave/pagehide only after valid new-schema paths pass; remove interim guards.
- [x] Prove catalog-independent storage with preserved/unknown audit facts. Enforce measured per-record/aggregate limits and visible quota/denial/corruption/newer-schema/conflict failures, retaining data and export fallback without false durability.
- [x] Test old/new/mixed envelopes and backups, duplicated invalid source → repair → Apply, stale writes, pagehide and two-tab conflicts. Browser evidence covers named save/open, reload of unfinished source, missing catalogs and unavailable-storage download.

**Gate:** Complete guide/source state and legacy records survive all durability paths. No protected stored payload is overwritten and no old-envelope guide write remains possible.

Own Phase 9 evidence: [durability validation](evidence/SPRINT-021/phase9.md). Upstream BW-2008 upload acceptance remains open; dependent ticket statuses stay in progress.

### Phase 10: Reading and variant navigation — BW-2010

**Files:** proposed `GuideReader.tsx`, `GuideNavigation.tsx`; shared cards/mentions/selectors, guide workspace, `share-url.ts`/hydration boundary if needed, styles and reader/navigation tests.

- [x] Render the applied document through shared projections with catalog/mutation controls and mutation shortcuts absent; retain compact builds, details, contextual tooltips and correct template copying.
- [x] Add accessible headings, collision-safe section anchors and stable namespaced variant anchors; separate them from game-template share hydration.
- [x] Preserve raw source/last-applied messaging and reasonable selection on read/edit return; navigation, collapse, tooltips and copy remain UI-only.
- [x] Test parity and action boundaries; record browser two-variant navigation/copy, generic/bound/missing mentions, unapplied source, keyboard, long names, narrow layout and 200% zoom.

**Gate:** Read mode expresses the same applied meaning, has useful direct navigation and cannot dirty or mutate the document through reused controls.

### Phase 11: Original example and integrated coverage — BW-2011

**Files:** proposed `src/app/examples/dagger-guide.md`, example loader, `test/fixtures/guides/`, `guide-workflow.test.tsx`, App/source-policy fixture tests and repeatable browser instructions.

- [x] Author original two-variant dagger-themed prose with headings, generic/bound references, optional slots, template input, distinct rune/headgear/title/effect values, usage, recommendations, counters and source links. Verify real IDs/codes; label it an interaction example rather than current meta advice.
- [x] Load the example only through an explicit guarded action, preserving existing drafts. Use approved local assets and linked-only provenance without copied PvX prose/ratings, remote images or live requests.
- [ ] Integrate write → reference/drop → build edits → undo → source → save/reload → read → export/reimport, including zero-build, raw/unresolved/detached, ID collision, delayed IO and copied-invalid-source cases.
- [ ] Finalize the frozen long fixture and representative actual-browser end-to-end run for BW-2012. Assert meaningful state/context equality and inspect transfer bytes.

**Gate:** One repeatable original workflow proves both independent variants and differing reference values survive the full local author/read/transfer journey. Source policy and non-destructive loading pass.

### Phase 12: Browser verification and closeout — BW-2012

**Files:** future `work/sprints/SPRINT-021-EVIDENCE.md`, selected durable captures under `work/sprints/evidence/SPRINT-021/`, raw logs under `work/runs/SPRINT-021/`; compendium/README as warranted, source tickets/epic, sprint, ledger and execution result records.

- [x] Map every ticket acceptance criterion to implementation and focused evidence. Re-run early browser scenarios against the final integrated production preview, or document why unchanged evidence still applies.
- [ ] Execute every non-deferred scenario in the browser matrix below; record environment, fixture, actions, expected/actual outcomes and artifact paths. Fix regressions and repeat affected checks.
- [x] Run final pinned-toolchain `npm run verify` and `git diff --check`; record actual results. Re-run final verification after any resulting code fixes.
- [x] Update shipped documentation and retain discovery/PvX intake/publishing follow-ups. Mark tickets done only with their evidence; check completed sprint items individually and synchronize epic/sprint/ledger/result status through the execution contract. The outer runner owns commits.

**Gate:** Every required checklist/evidence item passes. If a required browser case or validation cannot run, record the exact gap and leave affected ticket/sprint/epic incomplete. No completed execution manifest with actionable unchecked sprint items.

## Verification and Browser Evidence

Use one current supported installed browser for the complete matrix against production preview. Freeze actual browser/version, OS and available native folder/fallback paths in BW-2001. Add second-engine smoke checks when available or a discovered defect requires them; three engines are not a new mandatory release requirement. Record timestamp, revision/build, URL, input method, fixture, viewport, theme, zoom, actions, expected/actual result and durable capture/download/log path. Synthetic component events supplement actual pointer/IME/focus evidence.

| Evidence                     | Required scenarios                                                                                                                                                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B01 Writing and feasibility  | Real paragraph/mention/build control; formatting/shortcuts/lists/paste; native/keyboard undo; cursor at inline/block boundaries; external reconciliation. Native composition/IME verification is explicitly deferred; automated composition coverage remains required. |
| B02 Catalog/layout           | Zero-build generic insertion; visible target/bookmark; independent scrolling; long fixture; both themes; narrow catalog open/close and focus return; 200% zoom.                                                                                                        |
| B03 Pointer and keyboard     | Every placement row; nested and inactive slots; same-bar raw moves; cross-build copy; source-bar mention; external/malformed input; stale source, reorder/delete, Escape/outside cancel and document switch; click/keyboard equivalents.                               |
| B04 Context/identity         | Two bound values plus generic after third-card selection; hover/focus/touch; missing/deleted/detached references; delete/undo/rebind; same/cross-document paste with colliding IDs.                                                                                    |
| B05 History/source           | Cross-feature chronological undo/redo; source-only dirty guard; valid/invalid Apply; Apply undo/redo and source reopen; unapplied read/visual transitions; exact opaque retention.                                                                                     |
| B06 Transfer/limits/security | Real download bytes and reimport; raw/applied export; canceled/stale upload; shorthand expansion and boundaries; unsafe HTML/URL/image/clipboard samples. Observe browser network traffic to confirm no input-triggered remote fetch.                                  |
| B07 Durability               | Named save/open/reload; invalid-source recovery; copied invalid source repair; autosave/pagehide; mixed backup/restore; quota/denial/newer/corrupt/two-tab conflict; missing catalogs with recovery/export.                                                            |
| B08 Game files               | Explicit-card paste/copy/Load/Save, native folder path where supported and existing upload/download fallback; delayed reads/writes after target change; cancellation/permission failures; inspect actual bytes and unchanged siblings.                                 |
| B09 Reading                  | Section/variant anchors and reload/share-fragment separation; details/copy/tooltips; no catalog/mutation/dirty changes; unapplied notice and return focus.                                                                                                             |
| B10 Existing workflows       | Standalone composer and drag behavior; template compatibility/share URLs; attribute/title/effect previews; build-set/party storage and transfers; backups and recovery.                                                                                                |

Use focused domain/codec/state/component and existing regression suites as each phase lands. The final command includes formatting, lint, types, all Vitest tests, production build, ingestion and runner tests. Ensure child npm commands resolve the pinned npm as well:

```sh
PATH="$PWD/work/runs/toolchain/node_modules/.bin:$PATH" work/runs/toolchain/node_modules/.bin/npm run verify
git diff --check
```

Do not treat the supplied baseline, a successful download click, static screenshot or parser dry-run as implementation acceptance. Retain durable evidence summaries/captures; raw ignored run logs alone are insufficient for review.

## Files Summary

| Area                        | Create / modify / audit                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semantic contract and codec | Domain Guide/IDs/barrel/contract fixture; guide references; pure `src/guide/` codec/limits/validation with injected payload adapter.                                                     |
| State and history           | Guide state/history/clipboard/selectors/editor bridge; workspace/composer branches and early write guards.                                                                               |
| Author/build/reference UI   | Guide workspace/editor/toolbar/catalog, compact cards and inspector, inline mention/context controls; shared composer/catalog/bar/tooltip/control adapters and styles.                   |
| Transfer and persistence    | Guide source/files/dialogs; existing template workflows/file controls, strict persistence/local storage, backup/restore, library selectors and build-set/party-only transfer boundaries. |
| Reading/examples            | Shared read renderer/navigation; share-fragment routing; original Markdown example and guarded loader.                                                                                   |
| Verification                | `test/domain/guide*.test.ts`, codec/app integration tests, legacy regression suites, `test/fixtures/guides/`, actual browser evidence.                                                   |
| Dependencies and records    | Package/lockfile only during execution after precheck; ADR 0003, guide compendium, source tickets, executing sprint/ledger/result and evidence index.                                    |

## Definition of Done

- [x] BW-2001 actual-browser feasibility, architecture/grammar/identity decisions, official dependency/license/bundle checks and measured capacity gates pass; failed experiment residue is removed.
- [x] BW-2002 neutral model/codec preserves full Build v4 snapshot meaning, metadata, reference context, exact opaque content or recoverable whole source; deterministic hostile/conflicting/oversized outcomes are tested.
- [x] BW-2003 complete authoritative snapshots, one bounded chronological history, source-only dirtiness, stale guards, remapping and intermediate storage protection pass.
- [x] BW-2004 rendered Markdown vocabulary, metadata controls, guarded workspace entry, no-build catalog, target/caret, responsive/focus browser evidence pass; native composition verification remains explicitly deferred.
- [x] BW-2005 independent complete cards and existing control/rule reuse work; identity/name, targeted async template IO, cancellation and raw-fact preservation pass.
- [x] BW-2006 generic/bound/local-missing/detached references remain portable and correct through selection, moves, delete/undo, explicit repair and accessible tooltips.
- [x] BW-2007 every drop/keyboard/click behavior passes with at most one authored transaction, safe cancellation, explicit inactive targeting and preserved standalone behavior.
- [ ] BW-2008 atomic source Apply/recovery and inspected Markdown export/reimport preserve supported meaning and opaque bytes; no partial or stale replacement occurs.
- [ ] BW-2009 named durability, migration, mixed backups, source recovery, catalog-independent autosave/pagehide and truthful failure/aggregate-capacity behavior preserve existing records.
- [ ] BW-2010 reading/navigation/copy uses the same applied meaning, preserves source recovery and has no mutation/dirty/history side effects.
- [ ] BW-2011 original two-variant and long fixtures prove the integrated local workflow with approved assets, verified identities and no copied runtime prose or remote fetch.
- [ ] BW-2012 all non-deferred B01–B10 actual-browser evidence and existing regressions pass against the final implementation; no required scenario is substituted or silently waived.
- [x] Pinned `npm run verify` and `git diff --check` pass after final fixes, with actual results linked.
- [x] All ticket acceptance, epic/sprint checklists, ledger and execution result agree; the outer runner retains commit ownership and explicit future scope remains open.

## Risks and Mitigations

| Risk                                               | Mitigation / stop gate                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Editor/history/composition incompatibility         | Production-shaped slice, simpler inspector hosting, native undo and bounded alternate design; stop BW-2001 if no passing stack.                              |
| Stale or duplicate authoritative state             | Populated snapshots, single identity/name, revisioned projections/commands, reconciliation and delayed IO tests.                                             |
| Source or reference loss during copy/Apply         | Durable detached contexts, exact raw buffer, full-guide versus fragment distinction and lifecycle/collision fixtures.                                        |
| Library union/version regression                   | Exhaustive branch audit, early write guards, separate envelope/backup versions, mixed legacy fixtures and anti-wipe checks.                                  |
| Large guides stall or exceed storage               | Measured representative/aggregate budgets, revision-driven scheduling, bounded history/intake and visible exportable failures; no silent database expansion. |
| Drag cancellation deletes or edits the wrong build | Guide-specific outcomes, current source fingerprints, inactive target tests, native pointer evidence and separate standalone policy.                         |
| Broad milestone closes with missing evidence       | One ticket gate per phase, evidence matrix and unchecked-item enforcement; keep affected work incomplete.                                                    |

## Security Considerations

Treat source, annotations, clipboard, uploads and stored data as inert data. Render no executable HTML/MDX/JSX or arbitrary event/style attributes; unsafe or unsupported content remains escaped/opaque/source-only. Share one URL policy for user-activated HTTP(S), mailto and valid local anchors; reject unsafe/obfuscated schemes and external content-supplied blob/data/file URLs. Remote image/media/embed syntax never triggers a fetch. Use approved local icon mappings and safe external opener behavior.

Enforce byte/depth/count/metadata/diagnostic limits before expensive processing; reject dangerous and duplicate JSON keys, malformed numbers/IDs and invalid slot indexes. Session nonces establish freshness, not trusted clipboard content. Validate every imported structure and retain previous documents on error. Bound filenames and revoke download object URLs. Provenance metadata is descriptive, not a rights approval. No backend upload, crawler or automatic remote document fetch is introduced.

## Dependencies

All eight prerequisite epics were inspected as done: EPIC-01, EPIC-04, EPIC-05, EPIC-06, EPIC-09, EPIC-16, EPIC-18 and EPIC-19. Preserve their behavior and normal runner preflight. Execute phases in order; the source-ticket DAG remains:

| Ticket / phase | Required predecessors                                |
| -------------- | ---------------------------------------------------- |
| BW-2001 / 1    | Completed epic dependencies                          |
| BW-2002 / 2    | BW-2001                                              |
| BW-2003 / 3    | BW-2002                                              |
| BW-2004 / 4    | BW-2001, BW-2002, BW-2003                            |
| BW-2005 / 5    | BW-2003, BW-2004                                     |
| BW-2006 / 6    | BW-2002, BW-2004, BW-2005                            |
| BW-2007 / 7    | BW-2005, BW-2006                                     |
| BW-2008 / 8    | BW-2002, BW-2003, BW-2004, BW-2005, BW-2006          |
| BW-2009 / 9    | BW-2003, BW-2008                                     |
| BW-2010 / 10   | BW-2005, BW-2006, BW-2008, BW-2009                   |
| BW-2011 / 11   | BW-2005, BW-2006, BW-2007, BW-2008, BW-2009, BW-2010 |
| BW-2012 / 12   | BW-2001 through BW-2011                              |

Execution needs the existing Node >=22.11.0, pinned npm >=11.10.1 and provisioned `.venv-data`, approved catalogs/local assets, browser access and permission-preserving dependency installation. Reuse `--approve-for-me` for any execution lanes as supported; never bypass approval/sandbox controls or change authentication to force a gate. Stay in the isolated guide-workspace-burn worktree; do not modify the main checkout. The outer runner owns commits.

## Open Questions

No routine human answer blocks starting BW-2001. Its ADR must settle the tested editor/history/inspector integration, exact v1 grammar, safe opaque reinsertion, measured limits/serialization acceptance and installed-browser evidence setup. These are finite execution gates with the defaults and stop conditions above. A required failure remains explicit and incomplete; it does not authorize scope cuts, fabricated evidence or premature epic completion.

## Initial execution attempt: BW-2001 gate blocked (historical)

Execution used the requested orchestrated strategy without commits. The bounded
editor/codec/history slice passed five focused tests and preliminary Chrome tab
checks, but native Chrome app control was denied. Approved tab input did not
establish actual IME composition, and native undo proof remains unavailable.
Under Phase 1's explicit stop gate, no dependent phase was started and no ticket
was completed. All actionable checkboxes remain open.

[Execution evidence](SPRINT-021-EVIDENCE.md) and the
[deferred ADR](../../compendium/decisions/0003-guide-editor-and-markdown-contract.md)
record the exact gap, partial results, dependency/build measurements and archived
experiment. The temporary route, product edits and provisional dependencies were
removed; the recoverable patch remains in evidence. The sprint/ledger and epic
remain in progress; the execution result is blocked. Resume BW-2001 with authorized
native composition/undo verification before advancing its dependency gate.

## First resumed execution (historical): native access restored, completion evidence open

The 2026-09-27 UTC resume verified native Chrome access and menu Undo. It restored
the archived slice, fixed intermediate composition history and double shortcut
routing, and passed seven focused tests plus the production slice build. The
input trace still ends with an untrusted `compositionend`, including in a passive
plain-textarea control without the editor framework. Fully native completion
remains unverified, so Phase 1's explicit browser gate still stops dependent work.

The [dated resume evidence](evidence/SPRINT-021/resume-20260927.md) records exact
observations and the resumption question. Both fixes and the probe are preserved
in a new combined patch; product code/dependencies were restored. Initial failure
evidence remains historical. No ticket is done, all 68 actionable items remain
open, and sprint/ledger/epic remain in progress with execution blocked. Native
Chrome permission does not need to be requested again. No commits were made.

## Current execution progress — 2026-09-27 UTC

Orchestrated strategy, no commits. BW-2001 passed its non-deferred feasibility
gate; [current evidence](evidence/SPRINT-021/resume2-phase1.md) and the accepted ADR
record exact contracts, browser observations and capacity results. The temporary
pagehide/capacity keys were removed after measurements. Native composition remains
unverified/deferred by user decision. Subsequent tickets and final browser
reverification remain open; no completed sprint/epic/result claim is made.
