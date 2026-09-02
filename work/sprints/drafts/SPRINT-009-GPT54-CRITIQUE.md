# SPRINT-009 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-009-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-009-GPT55-DRAFT.md`

Both requested drafts were present. `work/sprints/drafts/SPRINT-009-GPT54-DRAFT.md` was not reviewed.

## Executive Assessment

`GPT56SOL` is the stronger execution draft. It fixes more product-policy decisions up front, sequences the work with clearer phase gates, and defines a substantially more complete Definition of Done. `GPT55` is still useful, but it reads more like a high-quality planning draft than an execution-ready sprint because several decisions that affect state shape, export fidelity, and validation behavior remain open or only partially resolved.

The best combined plan should use `GPT56SOL` as the base document, then selectively absorb `GPT55`'s more concise scope framing and a few of its execution cautions. It should not inherit `GPT55`'s unresolved questions as open execution-time ambiguity.

## Critique: `SPRINT-009-GPT56SOL-DRAFT.md`

### Strengths

- Sequencing is mostly disciplined: catalog boundary first, then state, then character controls, then discovery, then slot interactions, then tooltip/detail surfaces, then template workflow, then final integration and closeout.
- Dependency ordering is explicit. The draft correctly treats catalog imports, raw template identity preservation, and exact-source export policy as foundational rather than incidental UI details.
- Verification strategy is strong. Each phase has targeted tests, typecheck coverage, and an explicit phase gate instead of relying only on one final `npm run verify`.
- Definition of Done is the most complete of the two drafts. It covers policy semantics, accessibility, responsive behavior, exact replay rules, canonical export gates, attribution, protected-path review, and closeout consistency.
- Risk analysis is concrete and execution-relevant. The highest-risk failures are the right ones: namespace leakage, dirty-flag export logic, remote media fetches, validation-state conflation, and bundle size from static catalogs.

### Weaknesses

- Validation work is conceptually foundational but is scheduled too late as an implementation phase. Earlier phases already depend on validation semantics for budget display, inline issues, and export gating, so the selector/routing layer should be established earlier even if the final presentation lands in Phase 8.
- Template import/export arrives after skill bar and tooltip implementation even though unresolved imported state is a primary source of edge cases for both surfaces. The draft mitigates this with fixtures, but it still increases the chance of rework once real import-driven states are wired through.
- Verification includes `git diff --exit-code` and `git status --short` as hard gates without acknowledging pre-existing worktree noise. In a non-pristine branch, those checks can fail for reasons unrelated to sprint execution.
- The draft is very dense. That is not a content problem, but it increases the chance that implementers treat some phase tasks as optional because the boundary between "must prove" and "nice design detail" is occasionally too granular.

### Gaps In Risk Analysis

- There is no explicit risk for test runtime and feedback-loop cost. Re-running broad verification plus multiple targeted suites after every phase may slow execution enough that teams defer checks until late.
- There is no explicit risk for fixture drift between synthetic unresolved states and actual `resolveSkillTemplateDocument` outputs. Because import is phased later, earlier tests may validate unrealistic placeholder states.
- There is no explicit risk for DOM-order regressions introduced during responsive/layout work. Attribution-first ordering is called out, but the risk of visually correct yet semantically reordered markup is not singled out.

### Missing Edge Cases

- Re-import behavior is under-specified: importing a second template over an edited unresolved state should explicitly preserve atomic replace semantics and reset transient UI state cleanly.
- Mixed known/unresolved slot swaps after edit-then-revert deserve explicit coverage in the slot and exact-replay matrix.
- The draft covers long names/codes, but not repeated export attempts across alternating exact-source and canonical states within one dialog session.
- Batch-reset behavior is defined for filter changes, but not for profession/mode changes that alter default availability scope while a user has explicit overrides active.

### Definition Of Done Completeness

- Overall completeness is high and execution-grade.
- The main missing exit criterion is an explicit proof that validation selectors and export gating are exercised together before final integration, not only indirectly through Phase 7 and Phase 8 tests.
- The DoD would also benefit from one explicit criterion for re-import/replacement behavior and one for preserving user-overridden browser filters across unrelated UI actions.

## Critique: `SPRINT-009-GPT55-DRAFT.md`

### Strengths

- The document has a clear high-level structure and a useful scope narrative. The catalog boundary, app-owned unresolved import metadata, and source-policy constraints are all identified correctly.
- Phase order is broadly sensible and follows the same major dependency chain as the stronger draft.
- The UI scope boundary table is concise and useful. It makes out-of-scope areas easy to audit during execution.
- The draft does a good job identifying the namespace problem between catalog-space `Build` data and raw template-space IDs.
- The risk list is directionally good and hits most of the same architectural concerns as `GPT56SOL`.

### Weaknesses

- Too many execution-shaping decisions remain unresolved. Open questions around unresolved template projection, exact replay invalidation source, canonical export with unresolved raw IDs, drag/drop strategy, and level/quest UI are not small implementation details; they change state shape, selector behavior, and test design.
- Dependency ordering is weaker because the draft leaves those decisions open while still asking early phases to define reducer structure, selector contracts, and exact-source invalidation behavior.
- Validation policy is not sequenced tightly enough. Phase 8 still "wires export policy" even though earlier phases and Phase 7 already depend on settled validation semantics.
- Verification strategy is thinner. It often falls back to `npm run verify` plus broad manual smoke checks without the same phase-specific precision and policy assertions found in `GPT56SOL`.
- Definition of Done is materially less complete. It captures the large outcomes but omits several of the hard-to-regress invariants needed for a sprint this stateful.

### Gaps In Risk Analysis

- The draft understates the risk created by its own open questions. The plan should explicitly acknowledge that unresolved decisions around export eligibility and raw-ID projection can force redesign of Phases 2, 5, and 7.
- There is little risk treatment for verification blind spots. For example, remote-media non-fetching, attribution DOM order, and exact-source edit-then-revert behavior are mentioned as goals but not elevated as likely regression areas.
- Performance risk is present, but less operationalized. The draft notes the large data footprint only indirectly and does not turn it into a hard measurement/closeout requirement with the same rigor.

### Missing Edge Cases

- Exact-source replay after semantic revert is named, but the draft does not define enough concrete cases for swaps, targeted clears, wrapper-name edits, or mixed resolved/unresolved slot transitions.
- Import failure atomicity is not promoted strongly enough into the DoD even though it is critical for a modal workflow over mutable editor state.
- The level/quest control ambiguity leaves edge cases around PvE-to-PvP-to-PvE switching, stale remaining-point displays, and validation-input drift under-specified.
- Browser batching and large-result behavior are weaker. The draft does not push as hard on batch-reset semantics, on-demand tooltip instantiation, or measurement of static-catalog cost.

### Definition Of Done Completeness

- The DoD is adequate as a product summary, but not complete enough as an execution contract.
- It lacks several important invariants that `GPT56SOL` captures explicitly:
  - exact-source eligibility must be fingerprint-derived rather than dirty-bit-derived;
  - unresolved/raw overlay movement must stay atomic with slot movement;
  - attribution must precede catalog facts in DOM and visual order;
  - canonical export must block on typed projection/fidelity failures, not just generic policy failure;
  - protected-path review and bundle-size measurement must be part of closeout.
- It also leaves too much room for interpretation around level/quest controls, dialog failure behavior, and cross-phase regression checks.

## Comparison

### Sequencing And Dependency Ordering

- `GPT56SOL` resolves the critical product-policy questions early enough to let state, selector, and export work proceed without major redefinition.
- `GPT55` identifies the same major dependencies but does not fully settle them before those dependencies become implementation inputs.
- `GPT56SOL` still has one sequencing flaw: validation and import-driven unresolved-state wiring should move slightly earlier because multiple later phases depend on them directly.
- `GPT55` has the larger dependency-ordering problem because its Phase 2 and Phase 3 contracts are partly built on unresolved Phase 7 and Open Questions decisions.

### Verification Strategy

- `GPT56SOL` is substantially stronger. It combines targeted tests, architecture scans, phase gates, and final protected-path review.
- `GPT55` relies more on broad final verification and manual smoke paths, which is riskier for a sprint with complex fidelity and state-preservation rules.
- Neither draft fully addresses dirty-worktree-safe verification. `GPT56SOL` is closer, but its closeout commands should be baseline-aware instead of assuming a clean tree.

### Definition Of Done

- `GPT56SOL` is clearly more complete and less ambiguous.
- `GPT55` has a reasonable summary DoD, but it is missing several implementation-critical invariants and therefore would allow "done" states that still regress export fidelity, unresolved-state preservation, or source-policy behavior.

## Merge Recommendations

### Use `GPT56SOL` As The Base

- Keep its fixed product decisions, phase structure, phase gates, risk table, and detailed DoD.
- Preserve its stronger separation of catalog boundary, editor state, selectors, template workflow, and protected-path closeout.

### Pull Forward A Small Set Of `GPT55` Elements

- Add the concise UI scope boundary table near the top of the merged draft. It is a good audit aid and complements the denser `GPT56SOL` architecture sections.
- Keep `GPT55`'s explicit warning that changes to `src/domain` or `src/template-compatibility` should trigger an architecture checkpoint rather than casual scope creep.
- Reuse `GPT55`'s compact phase file lists only if they are treated as execution aids, not as substitutes for `GPT56SOL`'s stronger phase gates.

### Do Not Merge These `GPT55` Traits Unchanged

- Do not carry forward the open questions as unresolved execution-time choices. They should be converted into explicit merged-plan decisions before implementation starts.
- Do not keep the ambiguous "add controls only if needed" treatment for level/quest UI. The merged plan should state the validation-input model up front.
- Do not weaken the export-fidelity contract into generic "policy permits it" language. Keep the `GPT56SOL` specificity around projection, validation, encode, and decode-back gates.

### Specific Improvements For The Merged Draft

- Move base validation selector/routing work earlier, ideally by the end of the state/character-control phases, so later inline issues and export gating are not backfilled.
- Pull a minimal import-driven unresolved-state slice earlier than full template dialog polish, so skill bar and retained-attribute behavior are exercised against real resolution shapes sooner.
- Replace hard clean-tree assumptions in closeout verification with baseline-aware protected-path review.
- Add explicit merged-plan edge cases for re-import over edited state, mixed resolved/unresolved slot swaps, repeated exact-source versus canonical export attempts, and persistence of explicit browser overrides across mode/profession changes.

## Bottom Line

If only one draft should drive execution, it should be `SPRINT-009-GPT56SOL-DRAFT.md`. It is closer to an executable sprint because its sequencing, verification, and Definition of Done are materially tighter. The merged critique recommendation is not to average the two drafts, but to keep `GPT56SOL` as the spine and import only the best framing aids from `GPT55` while resolving `GPT55`'s open ambiguities before work begins.
