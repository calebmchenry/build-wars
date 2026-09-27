# Independent combined critique: Sprint 021

Reviewed: [GPT56SOL draft](SPRINT-021-GPT56SOL-DRAFT.md) and [GPT55 draft](SPRINT-021-GPT55-DRAFT.md). References below use **SOL** and **55**, with draft line numbers where useful.

Scope authority: [shared sprint intent](SPRINT-021-INTENT.md), [guide workspace brief](../../../compendium/guide-workspace.md), [original epic intent](EPIC-020-INTENT.md), and EPIC-20's twelve ticket contracts. Selective local code inspection verified the integration risks cited below. The GPT6ASTRA draft was not read or reviewed. Both requested drafts and the scope artifacts were available. No implementation, package installation, tests, or browser checks were performed for this critique. The supplied baseline is not evidence that guide behavior works.

## Judgment

Use **SOL as the merge backbone**, particularly its semantic ownership, targeted build adapters, explicit fallback rule, persistence audit, and evidence matrix. Carry forward **55's browser checks at individual ticket gates** and its explicit allowance for unfinished work to remain unfinished. Neither draft should be adopted unchanged: their strongest guarantees still lack contracts at the intersections of source recovery, identity remapping, asynchronous operations, and resource limits.

The drafts agree on the product and most boundaries. Their main disagreement is architectural specificity: SOL makes the semantic document authoritative immediately after each transaction; 55 proposes the existing active-editor/inactive-snapshot pattern without settling when its active snapshot becomes authoritative. Their portable syntaxes and numerical limits are alternatives, not compatible pieces to combine.

Severity used here:

- **P1 — blocker:** resolve the stated contract before the affected implementation gate can pass. This does not require another user interview; record a concrete default and verify it during execution.
- **P2 — required correction:** address in the merged sprint or affected ticket before completion; it need not stop unrelated work.
- **P3 — optional improvement:** useful simplification or future flexibility, outside the completion gate.

The absence of browser proof in a planning draft is expected. The defect would be a plan that permits architecture commitment or ticket completion without that future proof.

## Draft-specific assessment

### GPT56SOL

**Strengths.** SOL is substantially more executable. Its injected snapshot adapter avoids importing app persistence into the domain while preserving Build v4 and raw overlays. Immediate build materialization and disabling independent vendor history provide a clear direction for avoiding stale contextual tooltips. It identifies concrete current hazards: destructive drag-end behavior, block tooltip wrappers, catalog-error recovery, strict domain compilation, and the exhaustive persistence unions. Its browser matrix specifies production preview, revision and environment, actual outcomes, durable evidence, and inspection of downloaded bytes. Its original-content and future-scope boundaries are appropriately narrow.

**Weaknesses.** Its precision sometimes exceeds its supporting contract. The displayed reference union cannot express the explicitly unresolved cross-document binding it promises. The source syntax has no document/node identity encoding despite asserting those identities and duplicate diagnostics. The proposed generic snapshot payload keeps dependencies clean at compile time, but makes the app's current persistence shape the exported build format unless a separate wire-version contract is defined. Full-document history and full JSON fingerprints also carry significant synchronous work beyond the stated memory cap.

**Risk-analysis gaps and missing edge cases.** SOL recognizes source divergence but does not define source-only dirty state, Apply/undo synchronization, cloning invalid source, or what happens when an accepted edit produces source larger than the import limit. Its detailed stale-drag protocol does not carry through to asynchronous template/file operations. Globally changing `SkillBar` drag-end semantics contradicts its broad standalone-compatibility claim unless explicitly scoped. Opaque nodes can retain bytes while still changing interpretation when serialized into a different Markdown context; the feasibility fixture must prove safe reinsertion, not just extraction.

**Definition of Done.** Coverage of all twelve tickets and exclusions is strong. However, the Phase 4 and Phase 7 implementation gates defer browser work to Phase 12 even though BW-2004 and BW-2007 already require it. BW-2008's DoD includes reload recovery supplied by BW-2009, which depends on BW-2008. Those are manageable forward integration obligations, but the merged plan must distinguish them from prerequisites for starting the next phase. Checkboxes are useful only if their evidence and status semantics are consistent.

### GPT55

**Strengths.** 55 retains the complete local author/read milestone without expanding into discovery or publishing. Its layer boundaries, explicit variant targeting, generic context, source Apply, catalog recovery, original example, and existing regression obligations are coherent. Browser checks appear directly in the authoring, card, reference, placement, source, persistence, and reader phases. It explicitly acknowledges that source durability arrives with BW-2009 and that incomplete execution must leave the epic open.

**Weaknesses.** Several consequential choices remain instructions to “define” something later: transaction publication, vendor-history bridging, grouping, metadata grammar, snapshot wire shape, dependency fallback, and the final migration version. The active `EditorState` precedent is treated as the architecture, while the brief calls it only a precedent. The fallback list repeats overlapping ProseMirror choices without a bounded evaluation order. YAML front matter, fallback mention labels, and separate build labels introduce parsing and authority decisions absent from the risk section.

**Risk-analysis gaps and missing edge cases.** The 100-entry history cap does not bound memory. The drag tasks do not explicitly replace the current cancellation-as-removal path. No rule handles a pending file load completing after target replacement, an unapplied source-only edit being discarded as “clean,” or a raw source buffer surviving clone/remap. Catalog failure is handled at the UI level without SOL's additional attention to `savedWith` and autosave eligibility. Missing IDs are listed as diagnostics without distinguishing recoverable lookup failures from fatal structural errors.

**Definition of Done.** The twelve-ticket checklist covers the promised features, but needs testable contracts for the preceding edge cases, explicit ticket dependencies, and durable evidence locations. “Actual browser evidence artifacts produced only during implementation closeout” (55:481) conflicts with its own BW-2001 feasibility gate and per-phase browser gates. Likewise, allowing package edits only after BW-2001 proves dependencies (55:488) leaves the real-package experiment's setup unspecified. These are execution-order problems, not evidence that the proposed editor cannot work.

## Blockers and concrete merge fixes

### 1. P1 — Settle transaction publication and the editor bridge in BW-2001

**Affected:** both; especially 55:46, 151–154 versus SOL:138–160.

SOL's immediately materialized semantic document and 55's live active editor cannot both be independent authorities. In the latter design, a reference to card A, autosave, or history can observe the stored A snapshot while a control is still editing a newer live A. “Materialization tests” do not specify which read paths are allowed to see that state. Conversely, rebuilding the vendor tree from the semantic document after every keystroke could destroy composition, selection, or editor normalization behavior.

**Merge fix:** adopt SOL's single applied authority, with an active editor only as a cache whose durable changes publish atomically before any guide selector, save, or history read. Allow a cache for existing controls, but require a revision match and refresh/invalidation after undo, source Apply, deletion, or replacement. Define how vendor updates distinguish local edits from application reconciliation and avoid feedback transactions. Specify pending IME composition behavior when a build control, undo, or source transition is invoked; routing Ctrl/Cmd-Z alone is insufficient if browser/editor undo commands take another path.

**Gate:** the production-shaped feasibility slice must demonstrate text composition, a real durable build edit, contextual projection, undo/redo, and an external semantic replacement without a stale cache or selection loss. Include undo initiated while focus is inside an embed control and via the editor's supported undo event path. Reuse the proven bridge; do not approve a throwaway prototype with materially different ownership.

### 2. P1 — Define a complete source-recovery lifecycle, including cloning

**Affected:** SOL:145–158, 246, 250, 390–409; 55:151–162, 300–305, 334–335.

Both drafts separate source from the applied guide but leave important transitions undefined. A source-only edit may make no semantic transaction; it must nevertheless trigger recovery persistence and dirty replacement protection. SOL histories the applied guide only, whereas 55's history gate promises source draft state intact. Neither specifies the state after Apply → Undo → Redo, or undo while an invalid buffer exists. A stale “synchronized” source buffer can overwrite the restored guide on the next Apply.

The sharper conflict is duplication/backup remapping. SOL rekeys the applied guide's document/build IDs while promising exact invalid raw source retention. Invalid or opaque source cannot safely be rewritten by the semantic remapper. After repair and Apply, that buffer could restore the old identities or conflicting bindings. Regenerating source instead would destroy the user's unfinished work.

The current implementation makes this concrete: `needsDirtyGuard` reads `draftSession.dirtyState` in `src/app/workspace-state.ts`, while `fingerprintPersistedDocument` serializes the complete persisted payload in `src/app/persistence-schema.ts:395`. The new buffer needs an explicit durable mutation path; adding it to a runtime field is insufficient.

**Merge fix:** record a transition table for source keystrokes, validation, successful/failed Apply, discard, undo/redo, Save/Open, clone, restore conflict, and mode changes. Separate semantic history/fingerprint from recovery-buffer revision and persistence dirtiness. Merely opening source or recomputing diagnostics must not dirty the guide. Preserve exact raw text through cloning; either retain a durable origin/remap context and apply it only after successful parsing, or keep the copied buffer explicitly detached pending a safe import/rebase operation. Do not regex-rewrite invalid source or silently discard it. Define native source-text undo relative to semantic Apply undo.

**Gate:** cover source-only edit → cancel replacement → save/reload; Apply → Undo/Redo → reopen source; invalid source → semantic undo; duplicate and conflicting backup restore with invalid source → repair → Apply → export/reimport. Verify both buffer bytes and intended identities. BW-2003 owns the state contract, BW-2008 its UI/Apply behavior, and BW-2009 durability; avoid making BW-2008 completion circularly depend on BW-2009's storage implementation.

### 3. P1 — Make unresolved reference identity representable and portable

**Affected:** SOL:113–119, 217–221, 245–247; 55:62–64, 124–128.

SOL's proposed context is only `generic` or `{ kind: "build", buildId }`. A pasted reference from document A to `build:main`, without its build, must stay unresolved when document B already contains `build:main`. Storing the original string in that union cannot distinguish “foreign unresolved” from a valid local binding. 55 requests explicit unresolved external references but provides no representation either. The distinction must survive Markdown export, persistence, clone, and later explicit repair, not just the clipboard event.

Both also omit the relationship between portable document IDs and runtime editing sessions. SOL requires a document ID in clipboard origin and stale-event checks, but its metadata keys exclude a document ID and its syntax does not encode node IDs. A reimport of the same exported guide can be a different editing instance even if its authored ID matches. Node IDs need not survive export under the brief, but that must be an explicit choice rather than an accidental serializer loss.

**Merge fix:** add a durable context form for an unresolved foreign target, recording original document/build identity and requiring explicit rebind. Define missing-local-target behavior separately so delete/undo restores local references naturally. Specify document identity on import, duplicate, Save As, and source Apply; use a runtime session/generation distinct from authored identity for stale actions. Choose which node IDs are ephemeral and which are serialized. Preserve build IDs needed for stable variant anchors. Freeze one catalog-ID grammar; 55's numeric IDs are acceptable only if the field is unambiguously catalog-scoped and never guessed to be template IDs.

**Gate:** paste a reference-only fragment into a destination with the same build ID; save/reload/export/reimport it; confirm it remains unresolved. Also test internal build-plus-reference paste, copying between two editing instances of the same guide, same-document cut/move, and deletion/undo. UUID uniqueness alone does not replace these semantics for user-authored/imported IDs.

### 4. P1 — Bound recovery and authoring, not just successful parsing

**Affected:** SOL:223–224, 297, 390, 532–533; 55:66–73, 306, 525.

Both reject over-limit semantic input while promising exact raw recovery/autosave. Neither sets a raw-recovery byte budget distinct from the semantic document limit. Retaining arbitrary rejected files defeats resource bounds; applying the semantic limit to the persisted raw buffer makes a promised recoverable draft unreadable on reload. Per-guide limits also do not bound an entire mixed backup or library.

An input-byte limit alone does not guarantee export/reimport: compact template shorthand expands, supported text may require escaping, and repeated visual insertions or fragment paste can grow a previously valid guide past the serialization limit. SOL's 16-MiB history cap bounds retained material but not repeated full-document serialization or an oversized single transaction. Existing fingerprints are full stable JSON strings, not compact hashes, so embedding one as `basedOnFingerprint` has measurable storage/memory consequences if used literally.

**Merge fix:** define separate semantic, retained-raw, aggregate-import, and history budgets, with checks before expensive recursion/adaptation and before committing visual/paste/build transactions. For an external file above the recovery budget, leave the current guide intact and report rejection without pretending the file was autosaved. Preserve already accepted in-memory source and a raw-download path when storage fails. Specify serialization growth behavior so accepted supported documents can be exported and reimported under the same contract. Choose an explicit bound for diagnostics and annotation JSON as well as Markdown. Define what happens when one history transaction exceeds its byte budget.

**Gate:** exercise just-under/at/over limits through source, visual authoring, fragment paste, persistence reload, and mixed backup import. Test shorthand expansion and canonical export size. Measure representative long-document typing, build edits, undo, and autosave early enough to adjust the design before broad integration. Neither draft's arbitrary larger/smaller numbers should be treated as established capacity evidence.

### 5. P1 — Extend target validation across asynchronous template and file operations

**Affected:** SOL:311, 346, 348; 55:221, 227; source file transfer in both.

Both correctly require explicit card targeting, but an explicit ID captured before an asynchronous read is not sufficient. `src/app/components/TemplateBrowserDialog.tsx:209–260` awaits file reads/permissions/writes, resumes with captured `state` and `dispatch`, and checks component mounting. Load applies a replacement; Save can dispatch a build rename after writing. An editor adapter can remain mounted while its target changes. A source Apply or undo can also replace a card under the same ID while a read is outstanding.

**Merge fix:** capture operation identity, runtime document generation, addressed build ID, and an appropriate target revision at initiation. At completion, revalidate against current state and apply one transaction to that target or reject with a stale-operation message. Selection change alone must never redirect the operation. Define whether target edits invalidate a pending replacement, and ensure a completed Save cannot rename a different/replaced card. File Save should export a clearly defined snapshot; cancellation and undo cannot be claimed to reverse an external write. Use the same replacement protections for Markdown file reads.

**Gate:** delay a read/write, then select another card, delete the target, Apply source, undo/redo, or switch documents before completion. Check both the document result and the bytes/name of any file written. These are required extensions of the explicit-target contract, not a request for a new file subsystem.

### 6. P1 — Freeze one portable grammar and its version/migration boundary

**Affected:** SOL:162–224, 262–268; 55:58–77, 333–335.

SOL's leading marker plus JSON metadata, namespaced empty skill directives, `build-wars-build` fences, and 64-build limit conflict with 55's YAML front matter, fallback labels, `buildwars-build` fences, and 32-build limit. They cannot both be described as v1. Supporting both would add migration and ambiguity before a format has shipped.

Prefer SOL's JSON-oriented candidate for this milestone: it reuses the snapshot validation approach and avoids an additional YAML data-model contract. That is a maintenance trade-off, not a finding that YAML is unsafe. If YAML wins feasibility, specify its restricted types, duplicate-key policy, aliases/tags, and bounded parsing. Decide whether labels are derived, fallback-only, or independently authored; likewise choose between a separate card label and `Build.name` so rename has one meaning.

The merge also needs recognition rules. Markerless plain Markdown must remain ordinary content with sensible default metadata. Reserved-looking fences inside code examples or unsupported wrappers must remain literal/opaque. Missing catalog records are recoverable resolution diagnostics, not whole-document parse failures; structural conflicts can be fatal. Template shorthand that cannot be resolved without catalogs needs a recoverable outcome rather than invented empty build data.

Finally, the exported `PersistedBuildSnapshot` is still a public wire contract even when passed through a generic domain adapter. Build schema, guide annotation version, local envelope version, and backup version are separate compatibility axes. SOL names local schema v3 but leaves backup version policy implicit; 55 leaves both open. Current `src/app/backup-restore.ts:21–22, 147–189` accepts its own versions and constructs a local envelope using the current library version. An envelope bump alone does not define how old backup readers should treat new guide records.

**Merge fix:** freeze a single v1 grammar and authoritative label/identity rules before BW-2002. Version the portable snapshot adapter and enumerate accepted Build versions without introducing a competing Build schema. Record local-envelope and backup version/migration policies separately, including strict rejection/recovery for unsupported future guide/build data. Avoid treating an unknown new guide record as permission to restore a partially stripped library.

**Gate:** fixture coverage for plain Markdown, escaped/nested annotation examples, missing catalog IDs, unavailable-catalog shorthand, conflicting label/payload fields, old library and backup forms, new mixed backups, and newer unsupported data. Preserve the existing anti-wipe and no-write-on-read guarantees.

## Required execution corrections

### 7. P2 — Reconcile dependency, package, and evidence gates

SOL's explicit dependencies match the epic ticket DAG; 55's order is compatible but should carry those dependencies explicitly. Neither needs a new product split merely because the sprint is large. Both correctly stop broad integration when BW-2001 fails.

Adopt SOL's distinction between provisional candidate installation after documentation/license precheck and accepting/pinning the final dependency after the actual-browser slice. 55's “package edits only after proof” needs that distinction or a specified isolated experiment. Keep setup within the existing approval/sandbox controls; lack of package or browser access leaves the gate open.

Use 55's per-ticket browser gates and SOL's detailed evidence format. BW-2004's browser verification is part of that ticket, not something its “done” status can defer entirely to BW-2012. BW-2012 should consolidate and repeat representative flows in the final integrated build. Explicitly distinguish “implementation ready for integration,” “ticket accepted with evidence,” and “final regression complete” where downstream integration is needed; do not create a dependency loop with forward obligations such as source reload.

Record browser/OS, revision/build, fixture, actions, expected/actual results, and durable evidence paths. A blocked or unrun case must remain visibly open. Feasibility documentation, baseline tests, jsdom, and screenshots without an exercised interaction do not prove the browser matrix. Preserve runner ownership: implementation supplies artifacts and acceptance results; the outer runner owns commits and final ledger/result transitions. Keep SOL's explicit ownership sentence and remove any ambiguous independent closeout authority.

### 8. P2 — Resolve the standalone drag compatibility contradiction

SOL makes `dragend` cleanup-only globally (SOL:256, 376), while promising existing standalone behavior remains intact. Local code confirms `src/app/components/SkillBar.tsx:126–137` removes a skill when `dropEffect` is `none`; `src/app/skill-bar.test.tsx:55–64` intentionally tests that behavior. 55 mentions cancellation but never identifies this existing side effect.

For guide mode, cancellation must preserve the source and removal must be explicit. Scope that behavior through an explicit interaction policy or deliberately document a standalone behavior change with updated acceptance/regression evidence. Do not erase the existing regression test and claim compatibility. Also distinguish a rejected/no-op drop from a successful mutation: “every row produces exactly one transaction” should mean **at most one**, with zero authored transactions for invalid, canceled, same-position, or otherwise unchanged operations. Document whether harmless build reorder during drag invalidates the gesture or preserves its stable-ID target; both are defensible if predictable.

### 9. P2 — Clarify workspace switching and metadata ownership

SOL says switching visible surfaces preserves both document kinds without replacing the current draft (SOL:325); 55 uses the existing dirty replacement guard. The current `WorkspaceState` has one `document`, one `editor`, and one `draftSession`; persistence has one `workingDraft`. Two independently recoverable surface drafts would be a real persistence expansion, not a UI toggle.

Choose and state a minimal policy: a single working document with explicit guarded create/open/replace transitions is sufficient if it meets the brief. If both surface drafts are retained, specify their storage and recovery lifecycle. In either case, define “insert current standalone build” when the guide is active so it does not accidentally mean “insert the selected guide card.”

Also define authority between guide metadata and `PersistedSavedDocumentRecord.name/tags/notes`. Both drafts add title/tags/source metadata and named library actions without saying whether a record rename changes guide title or only its library label. Choose a mapping and test Save As, library rename, export, and reopen. Avoid accidental dual ownership that later discovery work would inherit.

## Definition of Done merge audit

| Ticket area | Existing coverage worth retaining | Necessary completion clarification |
| --- | --- | --- |
| BW-2001 | Both require a real rendered paragraph/reference/build/history/source slice; SOL gives a bounded fallback. | Resolve the ownership bridge and grammar; allow provisional setup; include composition and external replacement; record actual dependency and browser facts. |
| BW-2002 | Both cover full snapshots, semantic round trips, unknown content, limits, and remapping. | Add durable foreign-unresolved contexts, identity import policy, plain-Markdown recognition, wire versions, and explicit diagnostic severity. |
| BW-2003 | Both cover isolated variants and chronological history. | Define publication, source-only dirtiness, Apply/undo/recovery interactions, cache invalidation, clone/raw-source behavior, and memory bounds. |
| BW-2004 | Both require rendered writing, caret preservation, zero-build catalog use, and responsive access. | Settle single/multiple draft switching; collect the ticket's browser evidence before acceptance; verify composition and catalog recovery beyond UI mounting. |
| BW-2005–2007 | Both cover cards, explicit contexts, complete drop behavior, and keyboard equivalents. | Add delayed I/O target validation, copy/cancel semantics, durable unresolved-reference transfer, and standalone drag compatibility. |
| BW-2008–2009 | Both cover atomic Apply, separate raw export, local recovery, legacy data, and mixed backups. | Establish recovery/aggregate budgets, canonical export/reimport closure, source clone/restore handling, metadata authority, and separate backup migration policy. |
| BW-2010 | Both preserve applied meaning and non-dirty reading. | Verify read mode cannot mutate through reused controls/shortcuts or unresolved-reference repair actions; retain unapplied source and stable variant identity through return to edit. |
| BW-2011 | Both provide original two-variant content and integrated scenarios. | Bring a representative long fixture forward to feasibility; add identity-collision, invalid-source clone, and delayed-operation fixtures to the final workflow suite. |
| BW-2012 | Both require repository verification, browser evidence, and truthful incomplete status. | Consolidate per-ticket evidence, repeat against the final product, tie artifacts to a revision, and retain the runner's ownership of closeout records. |

## Strategic trade-offs and optional improvements

- **P3 — Keep genericity narrow.** SOL's `GuideDocument<BuildPayload>` is a reasonable dependency inversion. It does not justify a plugin system or reusable editor package. Limit the adapter to the actual Build snapshot operations; public discovery and collaboration remain future work.
- **P3 — Start with simple history, measure the whole edit path.** Full snapshots are easy to reason about and reasonable for a bounded first milestone. Add structural sharing, targeted projection caching, or patches only if the preselected representative fixture exposes a problem. A memory cap alone is not responsiveness evidence, but a benchmark framework is unnecessary.
- **P3 — Preserve flexibility without prebuilding later products.** A versioned portable adapter and explicit provenance fields protect future migrations. They do not require hosted identities, globally stable URLs, ingestion, or publication infrastructure now. Build anchors may be local to the document, as the brief intends.
- **P3 — Reduce duplicated plan text after synthesis.** SOL repeats many guarantees in use cases, architecture, tasks, risks, browser rows, and DoD. Keep one authoritative contract and cross-reference it from ticket gates. This reduces contradictions when BW-2001 revises a provisional syntax or limit.

The recommended merge is one complete, dependency-gated sprint with SOL's architectural boundaries, 55's timely browser acceptance, and the explicit corrections above. Preserve the option to stop with truthful unfinished status; neither a successful feasibility slice nor a large set of component tests completes the author/read milestone.
