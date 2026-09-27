# Sprint 021 Draft Critique: GPT-6 Astra and GPT-5.6 Sol

Reviewed artifacts: `SPRINT-021-GPT6ASTRA-DRAFT.md`, `SPRINT-021-GPT56SOL-DRAFT.md`, `SPRINT-021-INTENT.md`, `SPRINT-021-PLANNING-EVIDENCE.md`, `compendium/guide-workspace.md`, and the EPIC-20 ticket order. I did not read or critique `SPRINT-021-GPT55-DRAFT.md`.

## Overall Assessment

Both drafts understand the core EPIC-20 shape: one local author/read milestone, all BW-2001 through BW-2012 included, BW-2001 as the rich-editor feasibility gate, semantic guide ownership rather than vendor-state ownership, complete Build v4 snapshots, explicit mention context, multi-build drag targeting, source recovery, local persistence, read mode, browser evidence, and no backend/discovery/PvX ingestion expansion. Both correctly avoid treating the supervisor baseline as evidence for guide behavior.

The merge should use Astra as the deeper risk and sequencing source, especially for source recovery, temporary non-durable storage guards, identity edge cases, and per-ticket browser gates. Use Sol as the tighter executable skeleton: sprint frontmatter, concise phase layout, code-baseline observations, explicit six-step feasibility slice, strict domain-compiler risk, and row-based closeout matrix.

Do not merge either editor/syntax preference as settled architecture. Astra leans Tiptap/ProseMirror plus directive syntax; Sol leans Lexical plus fenced JSON syntax. The final sprint should name bounded candidates and a concrete starting hypothesis, but BW-2001 must choose only after official-doc/license/version/bundle review and actual-browser slice evidence.

## Blockers to Fix Before Final Merge

1. **Browser evidence cannot be deferred only to BW-2012.**
   Sol repeatedly says actual browser evidence remains mandatory in Phase 12, while several earlier gates, especially BW-2004 and BW-2007, can appear passable with component tests. The intent says missing browser evidence blocks the affected completion gate. Final plan must require focused browser evidence at the browser-sensitive ticket gates, then require BW-2012 to replay or prove continuity in the final integrated product. Astra handles this better.

2. **Full-guide duplication/remapping must not rewrite portable guide-local IDs by default.**
   Sol proposes using `cloneGuideWithFreshIds` for saved-guide duplication and backup conflict remap. That is dangerous for a self-contained portable guide: record/library/session identities can change, but internal guide-local build IDs should remain stable inside an independent duplicated guide unless importing a fragment into an existing guide or resolving an actual in-document collision. Use Astra's distinction: fragment paste remaps included builds and references; full-guide duplication gets a new record/session identity while preserving portable local IDs and scoping live commands by session/document.

3. **The final sprint must explicitly resolve guide build identity versus nested `Build.id`.**
   Astra preserves nested `Build.id` independently; Sol implies the block `buildId` and `snapshot.build.id` should describe the same guide-local identity. The brief requires guide-local identities distinct from display name/document position and complete durable Build snapshots. Final fix: define one reference identity on the guide build node; make nested `Build.id` fresh and guide-owned on insertion/duplication, never a live library ID, but do not use it for prose reference resolution unless the ADR deliberately chooses equality and tests imported saved/current builds, duplicate, backup, and portable round trip.

4. **Source annotation syntax needs a conflict/literal-code proof before becoming a contract.**
   Astra's directive blocks and Sol's magic code fences are both plausible, but each has parser-fidelity traps. Sol's fenced `build-wars-build` syntax risks making a code fence semantic when a user may intend a literal example; Astra's directive syntax depends on current directive parser behavior and exact opaque retention. BW-2001 must prove annotation-looking fenced code, escaped directives, unsupported directives, comments/HTML, and unknown blocks before BW-2002 starts. The final sprint should call the syntax candidate provisional, not settled.

5. **The editor candidate must stay evidence-gated, not draft-preferred.**
   Astra prefers Tiptap/ProseMirror; Sol prefers Lexical. Neither draft has real official-doc/package/browser evidence. Merge the bounded comparison and six-step slice, but avoid language that commits dependencies, lockfile changes, or production architecture before the actual browser gate passes. Failed candidate code must be removable without leaving partial guide persistence or shipped UI.

## GPT-6 Astra Draft

### Strengths

- Strongly aligns with the product brief and intent, including no prototype closeout, no invented evidence, no obsolete Build v3 assumptions, and no expansion into discovery, PvX intake, publishing, parties, or equipment UI.
- The observed-code table is useful and mostly verified by the tree: `src/domain/guide.ts` is only a scaffold, persisted documents are `build | build-set`, `App.tsx` has catalog-readiness coupling, current drag payloads are too small, and `SkillBar` cancellation/removal semantics need isolation.
- Sequencing is careful. BW-2001 blocks editor/package commitment; BW-2002 creates the semantic/codec contract; BW-2003 establishes transactions/history before UI; BW-2009 owns real persistence activation after source Apply exists; BW-2012 is final evidence and closeout.
- The source recovery section is excellent: applied guide and raw source coexist, Apply is atomic, invalid source is durable and exportable, source mode has explicit Apply/Keep/Discard choices, and undoing Apply preserves prior recovery state.
- Identity handling is strong. It distinguishes generic/local/detached references, internal fragment remap, cross-document detached references, deletion with retained unresolved mentions, stale bookmark invalidation, and session scoping.
- The verification strategy is substantive: focused unit/golden tests, integration tests, native browser drops, keyboard parity, real IME, themes, zoom, long scrolling, storage/catalog failures, old workflow regressions, pinned npm, and `git diff --check`.

### Weaknesses and Risk Gaps

- The draft is long enough that the final sprint could become harder to execute than necessary. Several candidate decisions, filenames, regexes, and limits are described at contract depth before BW-2001 has evidence.
- It does not call out the strict domain TypeScript environment as explicitly as Sol. Parser/codec dependencies must not smuggle DOM or Node assumptions into domain modules.
- The `src/guide/*` module proposal may be fine, but the final plan should avoid a new architectural layer if the existing `src/domain` and `src/app` boundaries can hold the contract cleanly.
- Its preferred Tiptap/ProseMirror ordering is not supported by actual evidence in the draft. Planning evidence only records preliminary documentation observations, not approval.
- The candidate source syntax and snapshot example leave a subtle identity question: block ID `gb-main` and nested `Build.id` differ, while future adapters still need a crisp invariant for guide-local identity and copied saved/current builds.

### Missing Edge Cases to Add

- Explicit `tsconfig.domain.json` or equivalent domain-build compatibility check for the selected parser/codec boundary.
- A final-sprint rule for failed BW-2001 candidate cleanup: failed packages, temporary harnesses, and partial source syntax experiments must not remain as production dependencies.
- A more concise ADR naming rule based on existing `compendium/decisions/0001-*` and `0002-*`; Astra's `0021-*` filename may not match repository convention.
- A browser gate for actual download bytes plus reimport, not just successful click, should be repeated in BW-2008 and BW-2012.

### Definition of Done Completeness

Astra's DoD is broadly complete. The strongest items to preserve are "a required gap leaves the affected ticket/epic incomplete," exact opaque/recoverable source behavior, old build/build-set/party compatibility, catalog/storage failure recovery, native pointer and keyboard evidence, and final pinned-toolchain verification. Tighten it by adding domain-build compatibility and failed-candidate cleanup.

## GPT-5.6 Sol Draft

### Strengths

- The frontmatter and phase structure are closer to a ready sprint artifact. It clearly lists the twelve tickets, status, source epic, assumptions, files, gates, risks, dependencies, and open questions.
- The observed code baseline is concise and high-value. It adds important details Astra underplays: no browser-test dependency exists, and domain TypeScript has no DOM/Node ambient types.
- The six-step feasibility slice is excellent: paragraph formatting, atomic reference, editable build, single app history, semantic source round trip, opaque retention, and bookmark preservation/invalidation.
- The persistence/catalog-failure boundary is crisp: mount storage, recovery, source/export, and theme shell before catalog readiness; preserve stored facts or explicit nulls; do not require selected-build validation just to autosave guide source.
- The drag and insertion protocol is concrete and maps well to the brief: nonce/document/revision/source fingerprint, target supplied by the handler, stale payload as no-op, nested propagation stop, and no dragend deletion.
- Risk analysis is compact but useful, especially parser environment, package license/bundle gates, full-document history size, active-editor assumptions, and component-tests masquerading as completion.

### Weaknesses and Risk Gaps

- It overcommits to Lexical as the candidate default. That may be the eventual answer, but the planning evidence does not establish it. The final sprint should not imply Lexical is preferred over Tiptap/ProseMirror before BW-2001.
- It starts BW-2001 in production-shaped files and package changes earlier than Astra. This can be acceptable if tightly gated, but the final plan must prevent partial product state, failed dependencies, or guide persistence branches from surviving a failed feasibility gate.
- Browser evidence is too centralized in BW-2012. Browser-specific tickets need their own evidence or must stay open until the evidence exists.
- The full-guide remap rule is wrong or at least underspecified, as noted above. Record duplication and backup conflict handling should not rewrite arbitrary invalid source or portable local guide IDs.
- The candidate code-fence syntax conflicts with the requirement that fenced code containing annotation-looking text stay plain unless the exact semantic fence language is intentionally reserved and literal examples have an escape path.
- It lacks Astra's separate applied-source versus recoverable-source size thinking. A raw source buffer may need a larger recovery ceiling than the applied semantic guide; oversized raw input should be retainable or rejectable without truncation or replacement according to a frozen rule.

### Missing Edge Cases to Add

- Full-guide duplication with invalid/unapplied source: new record/session identity, unchanged portable source, no regex rewriting, no accidental command authorization between two open copies.
- Catalog unavailable during shorthand template Apply: full snapshots parse structurally, shorthand stays recoverable if catalog/template expansion cannot run.
- Existing `SkillBar` remove-on-drag-cancel behavior should remain preserved for standalone regressions while guide dragend only clears guide transient state.
- Actual browser IME must name the input method; synthetic composition is additional, not equivalent.
- File System Access native path and upload/download fallback need both coverage and truthful unavailability handling.

### Definition of Done Completeness

Sol's DoD is concise and mostly complete. It should add explicit per-ticket evidence links, not only final evidence; it should say failed browser/dependency gates keep earlier tickets open, not just BW-2012; and it should include separate recovery-source limits plus failed-candidate cleanup.

## Comparison and Merge Recommendations

### Use from Astra

- Source recovery transition table and source/history interaction.
- Temporary non-durable guide write guards before BW-2009.
- Detailed identity semantics for detached references, fragment paste, source recovery, session scoping, and no regex rewriting of invalid source.
- Per-ticket browser gates for rich editor, drag/drop, source transfer, read mode, and storage/catalog recovery.
- The stronger final verification matrix language: browser artifacts need timestamp, commit, browser/version, viewport, zoom, theme, fixture, actions, expected/actual, and durable paths.

### Use from Sol

- Sprint frontmatter and tighter phase prose.
- Observed code baseline, especially domain compiler constraints and absence of browser-test dependency.
- Six-step BW-2001 feasibility gate.
- Compact files summary grouped by area.
- Row-based Phase 12 browser matrix.
- Risk table entries for package/license/bundle, strict domain parser boundary, and component tests being insufficient.

### Severity-Labeled Fixes for the Final Sprint

| Severity | Recommendation | Concrete fix |
| --- | --- | --- |
| Blocker | Do not mark browser-sensitive tickets complete without real browser evidence. | Add browser gates to BW-2001, BW-2004, BW-2007, BW-2008, BW-2009, BW-2010, and BW-2011 where relevant; BW-2012 replays final integrated evidence. |
| Blocker | Preserve portable guide identity on full-guide duplicate/backup unless importing into another guide. | Adopt Astra's record/session versus portable-ID distinction; reserve remapping for fragments and actual in-document collisions. |
| Blocker | Keep editor/parser/syntax choice evidence-gated. | Final BW-2001 compares Lexical, ProseMirror/Tiptap, and parser options through official docs, license/version/bundle review, and the actual slice before dependency commitment. |
| Blocker | Define guide build identity invariant. | Decide whether nested `Build.id` mirrors guide build ID or is separate fresh snapshot identity; reference resolution must use one documented guide-local identity and tests must cover saved/current copy, duplicate, import, backup, and export/reimport. |
| High | Prevent partial persistence during early phases. | Keep guide writes blocked/non-durable until BW-2009; failed saves remain visible and exportable; no guide under library schema v2. |
| High | Prove annotation syntax literalness and opaque recovery. | BW-2001/BW-2002 fixtures cover semantic annotations, literal examples in code, escaped markers, unknown directives/fences, HTML/comments, malformed JSON, duplicate keys, dangerous keys, and unsupported versions. |
| High | Separate applied guide limits from recoverable raw source limits. | Freeze measured limits in BW-2001; retain/reject over-limit raw input atomically without truncation or replacing the last-valid guide. |
| High | Add domain-build compatibility for parser dependencies. | Include a focused compile/typecheck gate ensuring domain contracts stay framework-neutral and parser implementation either compiles in the domain target or is injected from app code. |
| High | Ensure candidate cleanup. | If a candidate fails BW-2001, remove its packages, temp files, routes, and lockfile changes before evaluating fallback or stopping. |
| Medium | Use repository decision numbering convention. | Prefer `compendium/decisions/0003-guide-editor-and-markdown-contract.md` unless the project has a new convention. |
| Medium | Keep Phase 8 independent from BW-2007 but execute in a safe sequence. | Do not add BW-2007 as a formal dependency of BW-2008; note that execution may run Phase 7 before Phase 8 for workflow coherence, while preserving the source-ticket DAG. |
| Medium | Avoid over-prescriptive filenames. | Present proposed areas and required boundaries; allow BW-2001 to adjust names if semantic/vendor/codec/persistence boundaries remain separate. |
| Optional | Shorten final prose. | Keep detailed edge cases in acceptance bullets and evidence matrix, but avoid duplicating every rule in Overview, Architecture, Gates, DoD, and Risks. |

## Final Merge Shape

The final sprint should be a single SPRINT-021 covering BW-2001 through BW-2012, with no planned split unless BW-2001 or later evidence fails. It should open with Sol-style frontmatter and a concise overview, then a short verified code-baseline table. Architecture should state the non-negotiables: semantic guide owner, vendor as transient projection, complete Build v4 snapshot adapter, one history, explicit target/context, recoverable source, catalog-independent recovery shell, and no guide persistence activation before the storage ticket.

BW-2001 should be the hard gate: official-doc/license/version/bundle review, strict domain boundary check, bounded editor/parser comparison, provisional syntax proof, and actual browser paragraph/reference/build/history/source slice. Package and syntax commitment only happen after that evidence.

The implementation phases should follow the EPIC DAG exactly. Sol's phase headings are good; Astra's gate contents are stronger. Preserve ticket dependencies:

- BW-2001 first.
- BW-2002 after BW-2001.
- BW-2003 after BW-2002.
- BW-2004 after BW-2001, BW-2002, BW-2003.
- BW-2005 after BW-2003, BW-2004.
- BW-2006 after BW-2002, BW-2004, BW-2005.
- BW-2007 after BW-2005, BW-2006.
- BW-2008 after BW-2002, BW-2003, BW-2004, BW-2005, BW-2006.
- BW-2009 after BW-2003, BW-2008.
- BW-2010 after BW-2005, BW-2006, BW-2008, BW-2009.
- BW-2011 after BW-2005 through BW-2010.
- BW-2012 after BW-2001 through BW-2011.

The closeout DoD should require linked implementation and evidence for every ticket, the full browser matrix replayed against the final integrated product, existing workflow regressions, pinned-toolchain `npm run verify`, `git diff --check`, and matching ticket/epic/sprint/ledger/burn-result statuses. Any missing dependency, browser, source-recovery, storage, or validation evidence keeps the relevant ticket and EPIC-20 open.
