# Independent Critique: SPRINT-021 Drafts

## Review basis and evidence boundary

This critique reviews `SPRINT-021-GPT6ASTRA-DRAFT.md` and
`SPRINT-021-GPT55-DRAFT.md` against `SPRINT-021-INTENT.md`, the authoritative
`compendium/guide-workspace.md`, EPIC-20, and BW-2001 through BW-2012. The
excluded third draft was not consulted.

Selective code inspection verified the concrete integration points discussed
below: `src/domain/guide.ts`, `editor-state.ts`, `build-set-state.ts`,
`workspace-state.ts`, `persistence-schema.ts`, `local-storage.ts`,
`backup-restore.ts`, `library-selectors.ts`, `composer-selectors.ts`, `App.tsx`,
`drag-payload.ts`, `SkillBar.tsx`, `SkillTooltip.tsx`, and `package.json`.

No tests, package evaluation, browser interaction, or feasibility prototype was
run for this critique. The supervisor-reported baseline remains context only.
Neither reviewed draft invents passing implementation evidence; all of their
checkboxes and browser gates are correctly future work.

## Executive assessment

Both drafts understand the product milestone and preserve the twelve-ticket DAG,
the hard BW-2001 feasibility stop, the complete Build v4 ownership requirement,
the one-history rule, safe source recovery, local durability, and final real-browser
evidence. Either is materially better than a UI-first plan that treats Markdown,
build cards, persistence, and history as independent features.

The GPT6ASTRA draft is the stronger merge base. It finds more of the actual
failure modes in this repository, gives each ticket an explicit dependency and
gate, distinguishes applied content from recoverable source, and makes target and
identity rules concrete. The GPT55 draft is substantially easier to execute and
review because it is shorter and keeps proposed architecture provisional, but it
leaves several important behaviors implicit and makes one unsafe runtime choice:
following the build-set active-editor/null-snapshot pattern for a document in
which inactive builds must remain renderable and directly targetable.

Neither draft should be accepted unchanged. The merged sprint needs to correct
four blocking architecture assumptions before or within BW-2001/BW-2003:

1. Compare history and embed architectures, not only editor brands. Both drafts
   assume an external semantic history with vendor history disabled, without
   evaluating whether a vendor transaction history extended with build commands
   gives safer selection, IME, and native undo behavior.
2. Keep every guide-owned build snapshot populated in the authoritative applied
   document. A selected-card `EditorState` may be a temporary inspector projection,
   but it cannot replace the selected snapshot with `null` as build sets do.
3. Prove the chosen document/history limits against the existing single-key
   `localStorage` envelope and synchronous whole-envelope fingerprinting. The
   proposed 1–2 MiB per-guide buffers and 100-entry history are not credible
   defaults without that measurement.
4. Freeze one identity and durable-payload model. Both drafts risk introducing a
   guide build ID, semantic node ID, nested `Build.id`, session ID, record ID, and
   editor node ID without stating which are actually required or how invariants
   prevent drift.

## Cross-draft findings and required merge fixes

| Severity | Finding | Concrete risk | Required fix and owner |
| --- | --- | --- | --- |
| **Blocker** | The proposed feasibility work compares Lexical, Tiptap, and ProseMirror, but not the more consequential state/history designs. | Disabling editor history and replaying an external semantic tree can break `beforeinput` undo, composition, selection mapping, and collaborative node-view transactions even if a simple round trip passes. Conversely, making vendor JSON authoritative violates the brief. | **BW-2001:** prototype two bounded integration designs: (A) semantic patch/history owner with vendor history disabled, and (B) vendor transaction/step history adapted to emit and restore framework-neutral guide transactions. Require keyboard/native undo, IME, selection restoration, and build edits in the same sequence. The decision record must explain why the losing history design failed, not merely why an editor package lost. |
| **Blocker** | Both drafts assume an interactive build control must live inside a rich-editor node view. | The brief requires an editable embedded build, but says selecting a card reveals existing controls. Putting the full inspector inside `contenteditable` adds focus islands, nested controls, selection traps, remount risk, and much harder IME/undo behavior. | **BW-2001:** test the lower-complexity alternative first: an atomic, `contenteditable=false` build card in the document that selects a separately mounted inspector. Compare it with an interactive node view only if needed. Either design must produce the same single guide transaction and visible in-document result. |
| **Blocker** | GPT55 follows the build-set pattern of one active `EditorState` plus inactive snapshots; that pattern stores the selected entry's snapshot as `null`. | `build-set-state.ts` deliberately relies on `workspace.editor` to materialize the active entry. A guide must render, serialize, resolve mentions against, drag to, and undo every card concurrently. A null selected snapshot creates two authorities and makes an inactive-target action race selection/materialization. | **BW-2003:** the applied guide owns complete snapshots for every card at all times. The selected inspector is derived from `{sessionId, buildId, snapshotRevision}`; a build action reduces that projection and atomically writes a complete snapshot back to the addressed guide build. Reject stale revisions. Never route guide build actions through an unqualified global `workspace.editor`. |
| **Blocker** | Proposed document limits are disconnected from the actual durability path. | The app stores the whole library under one `build-wars:v1` key. `workspacePersistenceFingerprint` serializes the entire envelope, and autosave runs after workspace changes. A 2 MiB recovery buffer plus applied tree, complete snapshots, saved copies, and a 100-entry history can exceed browser quota and cause synchronous typing stalls well before the advertised per-guide limit. The library permits up to 250 records. | **BW-2001** must measure serialized guide size, retained history, fingerprint cost, autosave cost, and pagehide behavior on the representative document. **BW-2003/BW-2009** must replace per-keystroke whole-envelope comparison with revision/dirty tracking and debounced serialization, or document a measured alternative. Keep `localStorage` only with per-record and aggregate-library budgets plus preflight/export behavior; moving guides to IndexedDB is an explicit alternative requiring a scoped decision, not an implicit implementation detail. |
| **High** | The durable snapshot boundary duplicates app-owned types. | `Build` is domain-owned, but `PveBudgetState` and `RawTemplateOverlay` currently live in `editor-state.ts`. Mirroring them in a new neutral guide payload can drift from `PersistedBuildSnapshot`; importing the persisted type into the domain reverses the dependency. | **BW-2002:** move only durable budget/raw-overlay contracts to a persistence-independent shared module, or define one neutral `OwnedBuildSnapshot` and make persistence/editor adapters consume it. Require compile-time construction plus round-trip fixtures covering every field. Do not maintain two hand-written complete snapshot shapes. |
| **High** | The identity model is more complex than the brief requires and is not justified. | GPT6ASTRA explicitly keeps guide-local build ID and nested `Build.id` independent; GPT55 implies the same. Existing build sets have both entry and build IDs, but that is precedent, not proof that guide references need both. Every duplicate, fragment paste, backup remap, anchor, deletion, and undo must then preserve or regenerate the correct one. | **BW-2001/BW-2002:** write an identity table containing namespace, owner, persistence, copy behavior, equality role, and consumers. Prefer one stable embed/build identity for mentions and anchors. Retain a separate nested `Build.id` only if a named invariant or existing API needs it; test mismatched/colliding pairs as invalid rather than tolerating drift. Transient editor node IDs must never enter authored equality. |
| **High** | Persistence is deferred until BW-2009 while runtime guide integration begins in BW-2003, but only GPT6ASTRA defines an interim write block. | Extending `WorkspaceDocument` before `PersistedDocument` is safe only if no autosave/pagehide path serializes a guide as v2 or overwrites the prior durable draft. Current autosave is globally mounted. | Merge GPT6ASTRA's explicit non-durable development guard into **BW-2003**. Do not hard-code “v3” until migration inspection confirms it, but require that old-envelope guide writes fail closed and preserve the previous working draft. **BW-2009** owns the actual next-version parser, migration, write activation, backup version, and removal of the guard. |
| **High** | Catalog-unavailable recovery is described but its current write dependency is not fully owned in GPT55. | `App.tsx` returns the catalog error shell early. Autosave and pagehide also return when `savedWith` is `null`, so merely exposing guide text/export will not preserve new recovery edits. | **BW-2009**, with a contract established in **BW-2003**, must make durable source/applied-guide storage independent of successful game validation. Preserve prior catalog audit facts, represent newly unknown facts explicitly, and never claim a fresh validation. Test autosave and pagehide while catalogs are unavailable, not only rendering/export. |
| **High** | The format candidates are treated as near-designs before parser/editor feasibility. | GPT55 combines YAML front matter, unquoted directive attributes, and fenced JSON without defining duplicate keys, escaping, detached bindings, or exact raw slices. GPT6ASTRA is safer and more precise, but its directive grammar is still unproven with the candidate Markdown pipelines. | **BW-2001:** carry strict-JSON metadata/directive blocks as the preferred candidate because exact keys and inert parsing are easier to bound, but keep the syntax provisional. The gate must include literal annotation text, code fences, escaping, duplicate JSON keys, unknown directives, detached external bindings, and source span regeneration. Freeze grammar only after both editor reconciliation and parser fidelity pass. |
| **High** | The plan does not make autosave/source-Apply concurrency a first-class integration contract in both drafts. | Source parsing, template file reads, and editor reconciliation can complete after a document switch or newer edit. Applying by build ID alone is unsafe when two copies contain equal portable IDs. | Adopt GPT6ASTRA's `{workspace/session, document, target, expectedRevision}` command boundary in **BW-2003**, **BW-2005**, and **BW-2008**. All asynchronous results must either commit once against the captured revision or return a visible stale/no-op result while retaining the input for recovery. |
| **High** | GPT55's drag plan misses the most dangerous current behavior. | `SkillBar.tsx` removes the source slot whenever `dragend.dropEffect === "none"`. Guide prose drops, browser cancellation, and some cross-browser drops can report `none`, so adding guide targets without changing outcome ownership can delete the source. | Use GPT6ASTRA's explicit drag outcome/session token and source fingerprint in **BW-2007**. A guide drag never removes on generic `dragend`; removal is a separate command. Test prose drop, cross-build copy, outside drop, Escape, document switch, target unmount, and browser-reported `none`, while keeping standalone behavior under explicit regression coverage. |
| **Medium** | Reusing the full domain `SourceReference` as guide metadata is scope-heavy. | That type includes internal ingestion/review fields such as material class, rights basis, use decision, review facts, and many required nullable fields. It is inappropriate as a hand-authored portable guide contract and risks implying rights conclusions from user-entered metadata. | **BW-2002:** define a compact `GuideSourceReference` containing only stable ID, label/URL, optional family, attribution, license text/URL, revision, and notes. Map to internal provenance structures only where facts are actually known. Presence of a link never implies approval. |
| **Medium** | Build label versus nested build name is unresolved. | GPT6ASTRA defaults rename to both; GPT55 does not state a policy. Silent coupling can mutate template-export names, while divergence can make the selected inspector and card appear to describe different builds. | **BW-2001/BW-2005:** choose one user-facing rule. Prefer card label as the guide title and preserve snapshot build name unless the author explicitly chooses “rename build too,” or formally make them one field. Add rename/duplicate/export tests. |
| **Medium** | Clipboard “authentication” is overstated. | A custom MIME payload or origin token is still untrusted and may be stripped by the browser. An in-memory token proves only that the current session issued a drag/copy, not that arbitrary clipboard JSON is safe. | **BW-2002/BW-2007:** validate every structured fragment. Use a session nonce only to distinguish same-session moves from external copies. If the nonce is absent/stale, treat the fragment as external, remap included builds, and detach outside references. Test plain-text fallback and browsers that omit custom clipboard data. |
| **Medium** | Both drafts list measured bundle impact but no acceptance rule. | An editor/parser stack can pass behavior while eagerly inflating the standalone composer or duplicating Markdown parsers. | **BW-2001:** record before/after production chunks, lazy-load proof, and dependency tree. Freeze an explicit acceptable outcome or a documented exception before package commitment. Standalone composer startup must not eagerly load authoring-only editor code. |
| **Optional** | GPT6ASTRA adds a mandatory Chromium + Firefox + WebKit/Safari release matrix and specific viewports/input requirements beyond the authoritative ticket text. | This may turn environment availability into a new product gate rather than evidence for the agreed feature. | Keep one current supported browser for the full required matrix, real IME, pointer, keyboard, themes, narrow layout, and zoom. Add targeted second-engine smoke coverage when available or when BW-2001 exposes an engine-sensitive risk. Any broader support matrix must be explicitly frozen in BW-2001 with an owner and available infrastructure. |

## Critique of `SPRINT-021-GPT6ASTRA-DRAFT.md`

### Strengths

- It is the only draft that makes the exact ticket dependencies visible in one
  table and then repeats them accurately at each phase. That matters because
  BW-2008 intentionally does not depend on drag/drop, while BW-2011 and BW-2012
  are integration and evidence gates rather than places to finish omitted core
  behavior.
- It correctly treats the semantic guide, applied source projection, unapplied
  source recovery, vendor state, workspace session, and persisted envelope as
  different concerns. Its source transition table is particularly strong: view
  entry does not dirty, invalid Apply retains the last-valid guide, read mode is
  truthful about unapplied source, and raw versus applied export is explicit.
- It identifies repository-specific risks rather than generic editor concerns:
  the selected build-set entry's null snapshot, the global `workspace.editor`,
  block-level tooltip triggers, slot-index-only drag payloads, `dropEffect ===
  "none"` deletion, two-kind persistence fallthroughs, the catalog-error early
  return, and `savedWith` coupling.
- It gives excellent transaction semantics: commands include session/revision,
  invalid and stale operations are no-ops, one gesture is one history entry, redo
  is cleared by a new edit, and undo of Apply retains the source input. That is a
  credible ownership model for the hard parts of BW-2003.
- Its reference semantics are much more complete than GPT55's: generic, local
  bound, missing-local, and explicitly detached external bindings do not silently
  collapse into one another. The cross-document collision rules match the brief.
- Its persistence audit is appropriately broad. Current code has many helpers
  where “not build” means build set, including library previews, backup remapping,
  selected snapshot extraction, clone/hydrate/materialize paths, and transfer
  features. The draft explicitly calls for exhaustive outcomes instead of merely
  adding a union member.
- Its Definition of Done maps every ticket to behavior and evidence. It also
  correctly requires replay or validation of early prototype evidence against the
  final product, rather than treating BW-2001 screenshots as BW-2012 proof.
- It clearly assigns commit, ledger, sprint, and result-manifest ownership to the
  outer runner and never claims that planning completed implementation gates.

### Weaknesses and scope creep

- At 1,000-plus lines, it approaches an implementation specification rather than
  an executable sprint. Exact ID regexes, diagnostic offset encodings, a 2 MiB
  recovery ceiling, 20,000 nodes, 16 MiB history, 750 ms grouping, three browser
  engines, particular viewport sizes, and a detailed URL-scheme allowlist are all
  presented before feasibility evidence. Some are sensible candidates; making
  them release requirements now creates work not required by the brief.
- It overcommits to Tiptap/ProseMirror with separate remark/unified parsing as the
  preferred stack while simultaneously saying the gate selects the architecture.
  Two independent tree models and a separate Markdown AST increase reconciliation
  complexity. The plan should compare integration shapes first and package brands
  second.
- “Disable independent vendor history” is treated as the answer rather than a
  hypothesis. Rich editors' history plugins often own selection bookmarks and
  composition-sensitive steps. The feasibility gate must prove the history
  bridge against native undo/redo events, not just call a custom Undo button.
- It assumes node views contain editable build controls. The authoritative brief
  permits a simpler atomic card plus external inspector, which better matches the
  current composer controls and reduces nested-contenteditable risk.
- The proposed neutral build payload still mirrors `PersistedBuildSnapshot`
  fields. Field-coverage tests reduce drift but do not eliminate two definitions.
  A shared durable contract is cleaner than parallel neutral and app contracts.
- Reusing the full `SourceReference` vocabulary imports ingestion governance into
  user-authored documents. This is unnecessary for the local author/read milestone.
- It chooses library envelope version 3 and backup version 3 before the migration
  design is implemented. Those are likely next versions, but should remain
  candidates until BW-2009 confirms whether guide recovery fields require one or
  more independently versioned shapes.
- It introduces “authenticated” clipboard origins without defining the trust
  limit. Clipboard and drag payloads remain untrusted; session tokens are freshness
  evidence only.

### Gaps in risk analysis and missing edge cases

- It recognizes local-storage quota but not the current synchronous
  whole-envelope fingerprint and 150 ms autosave behavior. Long-document evidence
  must include typing latency and serialization, not only editor rendering and
  scrolling.
- It does not make an aggregate library budget concrete. A per-guide maximum is
  insufficient when saved records and the working draft share one key.
- The separate guide-build ID and nested `Build.id` model lacks an invariant for
  mismatched IDs. A test suite can preserve both perfectly and still preserve an
  incoherent document.
- It does not clearly choose whether card label and `Build.name` are one authored
  fact or two. The suggested default to rename both is an unverified product rule.
- It should require failure cleanup at the BW-2001 stop: no committed speculative
  dependency, no enabled incomplete guide route, and a decision record containing
  the failed evidence. “Stop dependent work” is correct but not enough to prevent
  prototype residue from becoming accidental architecture.
- Its security section is strong, but testing “no remote requests” needs a named
  observation mechanism in BW-2012; otherwise it is a prose assertion. This is an
  optional evidence improvement, not a reason to expand the editor scope.

### Definition of Done assessment

The Definition of Done is comprehensive and substantially complete. Its main
problem is not omission but premature specificity. Retain the per-ticket behavior,
failure honesty, final verification, and status-consistency requirements. Move
unmeasured numeric limits, browser-engine breadth, offset representations, and
package preferences into BW-2001 decision outputs. Add explicit acceptance for
storage/fingerprint latency, aggregate quota behavior, failure cleanup, and the
identity invariant.

## Critique of `SPRINT-021-GPT55-DRAFT.md`

### Strengths

- It is concise, readable, and maps every BW-20xx ticket to a distinct phase with
  files, tasks, and a gate. The plan is easier for an executor to navigate than
  the GPT6ASTRA draft.
- Its opening code observations are accurate. In particular, it notices the two
  persisted document kinds, the mixed durable/transient `EditorState`, global
  selector context, insufficient drag payload, and catalog-error shell.
- It preserves the central architectural boundaries: framework-neutral semantic
  guide, adapter-owned complete snapshots, private vendor state, versioned
  persistence, and shared author/read projections.
- It keeps syntax and editor packages explicitly provisional and does not claim
  maintenance, licensing, compatibility, or browser facts without future
  research.
- Its gates cover the core acceptance story: rendered editing, two isolated
  variants, generic and bound mentions, atomic source Apply, named durability,
  reader parity, final browser coverage, and regressions for existing workflows.
- It correctly leaves all evidence in the future and assigns closeout records to
  BW-2012/the runner.

### Weaknesses

- The runtime boundary's instruction to follow the build-set active-editor plus
  inactive-snapshot pattern is unsafe for guides. Current build-set state makes
  the selected snapshot `null`; guide cards, mentions, drag targets, source export,
  and history require every snapshot simultaneously. This is the draft's largest
  architectural defect.
- The editor comparison is not actually bounded to two independent candidates:
  it names Lexical, Tiptap/ProseMirror, and lower-level ProseMirror. Tiptap and
  lower-level ProseMirror are variations of one stack, while the more important
  external-inspector and history-ownership alternatives are omitted.
- The candidate Markdown syntax is underdefined. YAML front matter expands parser
  and type-coercion behavior; unquoted inline attributes do not define escaping;
  numeric skill IDs do not visibly encode the catalog namespace; detached
  references have no portable form; and no duplicate-key strategy is stated.
- The source/history contract lacks GPT6ASTRA's base revision, stale Apply result,
  applied-buffer regeneration, Apply-undo recovery state, and clear distinction
  between native source-text undo and guide-document undo.
- Persistence is introduced late without an interim write-block contract. A guide
  runtime added to `WorkspaceDocument` can reach global autosave unless the plan
  explicitly prevents v2 serialization.
- “Persist diagnostics summary” risks stale locations and messages. Persist the
  source and stable status facts; regenerate diagnostics with the current codec on
  hydration.
- The drag phase mentions cancellation but misses the existing
  `dropEffect === "none"` removal path, the exact source raw-overlay fingerprint,
  and the need for a live in-memory session outcome separate from untrusted MIME.
- The proposed limits are arbitrary and less complete than GPT6ASTRA's: there is
  no distinct recovery admission limit, metadata/diagnostic bound, or history
  byte budget. More importantly, neither its 1 MiB source nor 100-history default
  is related to local-storage and serialization measurements.
- Its browser closeout references the brief but gives less evidence metadata than
  GPT6ASTRA. Durable evidence should identify commit, browser/version, input
  method, viewport/zoom/theme, exact action/result, and artifact path.

### Gaps in risk analysis and missing edge cases

- It does not explicitly preserve autosave/pagehide when catalog validation is
  unavailable, even though current code skips both when `savedWith` is null.
- It does not call out current “non-build means build-set” fallthroughs in backup
  remap and library preview helpers as concrete negative tests. The general audit
  instruction is correct but easy to satisfy incompletely.
- It does not cover local variant anchors colliding with the existing share-URL
  fragment handling. Reader anchors must never be parsed as a game-template share.
- Async template Load/Save/download operations need captured session, card, and
  revision checks. Explicit target props alone do not prevent a result from
  landing after a document switch.
- Cross-document clipboard behavior is named, but same-document move versus copy,
  external/stale origin, and ID collision outcomes are not specified enough to
  test.
- It does not require a no-build generic projection to avoid constructing a blank
  contextual `Build`; the task says it must not borrow ranks, but the concrete
  implementation trap should be stated.
- It does not address whole-envelope serialization cost or aggregate storage
  capacity at all.

### Definition of Done assessment

The Definition of Done covers all twelve tickets and the product's primary
out-of-scope boundaries, but it is too high-level for the riskiest integration
points. Add explicit completion clauses for populated authoritative snapshots,
session/revision-scoped async commands, catalog-independent autosave/pagehide,
guide-disabled v2 writes, canceled-drag source preservation, exact detached
references, aggregate storage limits, and replayable evidence metadata.

## Merge recommendation

Use the GPT6ASTRA draft as the factual and risk-analysis base, then reduce it to
the GPT55 draft's phase-oriented shape. Do not merge by concatenation. The final
sprint should keep one architecture section, one phase per ticket, one evidence
matrix, and one severity-ranked risk table.

### Take unchanged or nearly unchanged

- The exact EPIC-20 ticket DAG and the mandatory BW-2001 stop.
- Complete, guide-owned Build v4 snapshots and no live library links.
- Framework-neutral authored meaning; vendor JSON is never the portable format.
- Generic/local-bound/detached reference outcomes and collision-safe fragment
  remapping.
- Atomic source Apply with last-valid content and separate raw/applied exports.
- Explicit prose/slot/no-target insertion intent and no selected-card fallback.
- The full drop matrix, keyboard equivalents, and actual pointer evidence.
- Catalog-independent recovery/export, mixed old/new backup coverage, reader
  parity, original fixture/source-policy boundary, and runner-owned closeout.
- GPT6ASTRA's rule that early evidence is reused only when it still represents the
  final implementation.

### Amend before approval

1. **BW-2001 — decide integration shape.** Compare atomic card plus external
   inspector against interactive node view; compare semantic external history
   against adapted vendor transactions. Then evaluate at most two editor stacks
   against the winning shapes. Include native undo, IME, focus, unsupported raw
   nodes, lazy loading, bundle output, and failed-gate cleanup.
2. **BW-2001/BW-2002 — simplify contracts.** Freeze a minimal identity table, a
   single durable build snapshot contract, and a compact guide source-reference
   type. Prefer strict JSON candidate syntax over YAML unless the chosen parser
   proves exact safe front-matter behavior. Keep numeric limits provisional until
   measurement.
3. **BW-2003 — enforce ownership.** Store all complete snapshots in the applied
   guide. Treat inspector/editor state as ephemeral. All guide commands carry
   session/document/target/revision, and one history records semantic patches or
   structurally shared states with a measured byte cap. Add an explicit old-schema
   write block.
4. **BW-2003/BW-2009 — make durability affordable.** Replace synchronous
   whole-library fingerprinting on every edit with revision-driven dirty tracking
   and debounced serialization. Define record and aggregate capacity. Verify
   pagehide and quota fallback with catalogs both present and absent.
5. **BW-2005/BW-2007/BW-2008 — guard asynchronous work.** Template IO, drag/drop,
   file import, parsing, and Apply must validate captured session and revision.
   Remove guide dependence on `dragend.dropEffect` for source deletion.
6. **BW-2009 — regenerate, do not trust stale diagnostics.** Persist raw source,
   applied guide, base/applied revision, and stable recovery status. Reparse on
   hydration. Audit every helper that currently falls through from build to build
   set, including backup remap, selected preview, library facets, clone, hydrate,
   fingerprint, transfer, and share-fragment routing.
7. **BW-2012 — retain authoritative evidence, trim added scope.** Require the full
   brief matrix in an actual supported browser with real IME and native pointer
   actions, plus focused engine smoke tests if BW-2001 identifies a risk. Record
   exact evidence metadata. Do not add a three-engine release requirement without
   available infrastructure and an explicit decision.

### Reject from the merged plan

- The GPT55 null-active-snapshot runtime design for guides.
- Treating Lexical as the default before the architecture slice.
- Treating disabled vendor history as decided rather than tested.
- Requiring full build controls inside a rich-editor node view without comparing
  the external-inspector design.
- Reusing the full ingestion `SourceReference` shape as user-authored metadata.
- Hard-coded format/storage/history limits or browser-engine breadth presented as
  accepted requirements without measured evidence.
- Any guide write using the current v2 envelope, any silent fallback from guide
  to build-set behavior, and any canceled guide drag that removes a source slot.

## Recommended severity disposition

The merged sprint is **conditionally executable**. No product interview or sprint
split is required now, and both drafts are correct to keep BW-2001 through BW-2012
in SPRINT-021 with a stop gate. However, BW-2001 cannot pass until editor/history,
embed/inspector, format, bundle, and storage-feasibility evidence is recorded.
BW-2003 cannot pass with null authoritative snapshots or an unguarded v2 autosave
path. BW-2007 cannot pass while a canceled guide drag can trigger the current
remove-on-`none` behavior. BW-2009 cannot pass without catalog-independent
autosave/pagehide and aggregate-capacity behavior. Those are blockers.

The remaining recommendations—compact source metadata, label/name policy,
clipboard terminology, additional engine smoke coverage, and evidence formatting—
are important improvements but do not independently block starting BW-2001.
