# SPRINT-006 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-006-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-006-GPT55-DRAFT.md`

Notes:

- Both requested draft artifacts were present.
- `work/sprints/drafts/SPRINT-006-GPT54-DRAFT.md` was intentionally not read or reviewed.

## `SPRINT-006-GPT56SOL-DRAFT.md`

### Strengths

- The sequencing is dependency-correct. Phase 1 fully qualifies the pinned package before later
  phases depend on it (`:346-394`), which matches the draft's own dependency-first strategy.
- Verification is the strongest of the two drafts. The qualification matrix (`:281-297`), explicit
  phase gates, `npm run build` checks, offline fixture strategy, and final repeatability checks
  (`:632-659`) give this draft a credible way to prove behavior instead of asserting it.
- Definition of Done completeness is materially better than the GPT55 draft. It covers runtime
  floor, fidelity guarantees, typed error boundaries, deterministic fixtures, ship-or-defer
  paw-ned2 handling, and closeout consistency (`:709-801`).
- Risk analysis is concrete and operational. It names the real failure modes: runtime mismatch,
  vendor normalization, unknown-ID regeneration failure, type confusion, stale equipment mapping,
  and optional team-scope explosion (`:803-854`).

### Weaknesses

- The plan is over-front-loaded. Phases 1 and 2 (`:346-455`) build a large amount of boundary,
  policy, and generic fidelity machinery before the first end-to-end skill slice lands in Phase 3
  (`:457-508`). That is technically coherent, but it delays the first proof that the core path is
  actually workable.
- Phase 2 hardens generic `preserve-source`, `canonical`, and fingerprint behavior (`:437-442`)
  before one concrete format has fully proven those abstractions. That creates rework risk if
  equipment or wrapper behavior forces a narrower model.
- The draft still depends on manual review at the riskiest points: paw-ned2 disposition
  (`:591-596`) and final closeout (`:654-659`). Those checks are sensible, but too much of the
  optional-format gate remains procedural rather than executable.
- The document is extremely thorough, but the execution surface is large. There is a real sprint
  risk of spending too much time on boundary hardening and documentation before mandatory
  skill/equipment support is fully closed.

### Gaps In Risk Analysis

- The draft covers technical risks better than delivery risk. It does not explicitly call out the
  schedule risk created by front-loading general infrastructure before a thin vertical slice.
- It underplays the consistency risk of manual gate reviews across different executors, especially
  for paw-ned2 ship/defer decisions and final bundle/runtime review.

### Missing Edge Cases

- Browser-runtime proof is described in the qualification matrix, but there is no single explicit
  browser-like execution command beyond `npm run build` (`:374-375`, `:386-389`, `:446-451`).
  If browser-like behavior matters independently of bundling, that check should be made concrete.
- The plan does not say how to narrow scope if the generic fingerprint/canonical model proves clean
  for skills but awkward for equipment. The current structure assumes the shared abstraction will
  survive both formats without needing a staged fallback.

### Definition Of Done Completeness

- This is the more complete DoD and is close to execution-ready.
- The remaining issue is measurability, not coverage. A few DoD items are policy assertions rather
  than testable outcomes, so they should point to a specific test suite or named review artifact
  where possible.

## `SPRINT-006-GPT55-DRAFT.md`

### Strengths

- The implementation sequence is more incremental. It reaches skill-template work in Phase 2
  (`:248-284`) instead of reserving the first two phases for infrastructure, which gives the sprint
  a faster path to real output.
- The draft keeps uncertainty visible. The dependency gate (`:191-205`) and open questions
  (`:551-573`) correctly surface the Node floor mismatch, missing types, wrapper grammar, fidelity
  policy, and `Build` projection ambiguity as decisions that materially affect the design.
- The scope is easier to scan and less likely to drift into architecture-heavy churn before the
  first codec path exists.

### Weaknesses

- The biggest sequencing flaw is an internal dependency-order bug. Phase 2 says
  `decodeSkillTemplate` handles wrapped skill chat codes (`:263`), but wrapper classification and
  wrapper emission are only implemented in Phase 3 (`:301-307`). A phase cannot rely on behavior
  scheduled for a later phase.
- Phase 1 defines DTOs, wrapper metadata, normalized-code metadata, and error codes (`:233-235`)
  before several contract-shaping questions are resolved. The open questions on empty-slot
  representation, normalized output exposure, accepted round-trip equivalence, wrapper grammar, and
  partial `Build` projection (`:555-566`) are too central to leave unresolved after contract work
  begins.
- The dependency gate says bundler/runtime compatibility must be proven (`:202-205`), but Phase 1
  verification omits `npm run build` and any explicit browser/bundler proof (`:239-242`).
- Equipment fidelity is weaker than skill fidelity. Phase 4 asks for raw DTOs and decode-back
  equivalence (`:333-339`), but it does not make exact-source preservation, lossy refusal, or
  unchanged-source passthrough as explicit as they need to be for a loss-aware boundary.
- paw-ned2 feasibility remains relatively loose. The phase does not bind charset behavior,
  Node/browser proof, bounded termination, and no-partial-support rules as tightly as the stronger
  draft does.

### Gaps In Risk Analysis

- No explicit risk is called out for stateful vendor instance leakage, even though repeated
  operations are relevant to the package evaluation work.
- No explicit risk is called out for skill/equipment type confusion or header misclassification.
- No explicit risk is called out for CJS/ESM or browser-bundling failure, despite the dependency
  gate naming that concern.
- No explicit risk is called out for nondeterministic fixture behavior across process, locale, or
  filesystem-order differences.
- No explicit risk is called out for API churn caused by defining contracts before the open
  questions are settled.

### Missing Edge Cases

- Empty-slot semantics are still unresolved (`:555-556`), but skill DTO and DoD commitments depend
  on them.
- Wrapper behavior is still open on several meaningful cases: empty names, newline/control
  handling, delimiter ambiguity, and the exact policy for normalized versus original wrapper/code
  exposure (`:557-562`).
- Equipment edge cases are under-specified compared with skills: unchanged-source passthrough for
  nonencodable facts, filtered modifiers, item-to-slot disagreement, and lossy canonical refusal
  are not strongly driven by the phase plan.
- The draft leaves the partial `Build` projection decision open (`:563-564`), which directly affects
  whether the public API stays lossless.
- The fallback if the dependency fails mandatory compatibility is still open-ended (`:571-573`),
  which is too late for a plan that already starts defining contracts in Phase 1.

### Definition Of Done Completeness

- The DoD is incomplete relative to the plan's ambition (`:480-502`).
- It does not explicitly require proof at the repository Node minimum plus Vite build target,
  deterministic fixture behavior, code-owned limits, fresh vendor instances, explicit
  exact-source-versus-semantic-equivalent fidelity rules, or a no-partial-support paw-ned2 outcome.
- The ten open questions at the end are the clearest signal that the contract policy and acceptance
  criteria are not fully closed.

## Comparison

### Where `GPT56SOL` Is Stronger

- Dependency ordering is cleaner. It never lets public contracts rest on an unqualified package.
- Verification strategy is materially stronger, with better gates, better runtime proof, and a
  better model for determinism and fidelity.
- Definition of Done completeness is better aligned with the actual risks and optional-scope
  hazards.

### Where `GPT55` Is Stronger

- Delivery sequencing is better. It tries to land the first useful skill-template behavior earlier.
- Readability is better. The document is shorter and exposes unresolved decisions directly instead of
  burying them inside architecture defaults.

### Key Tradeoff

- `GPT56SOL` is the stronger execution document, but it is heavier than it needs to be before the
  first mandatory slice lands.
- `GPT55` has the better instinct on incremental delivery, but it is not yet internally consistent
  enough to execute without reordering and policy closure.

## Merge Recommendations

- Use `SPRINT-006-GPT56SOL-DRAFT.md` as the baseline for dependency policy, fidelity model,
  verification rigor, and Definition of Done structure.
- Rework the implementation sequence to keep `GPT55`'s earlier vertical slice: Phase 1 dependency
  qualification and explicit go/no-go; Phase 2 minimal boundary plus end-to-end skill
  decode/export; Phase 3 wrappers unless wrapped skill input remains in scope for Phase 2; Phase 4
  equipment on top of the already-proven skill/fidelity boundary; Phase 5 paw-ned2 ship-or-defer
  assessment; Phase 6 matrix consolidation, documentation, and closeout.
- Resolve `GPT55`'s open questions before execution using `GPT56SOL`'s defaults unless the team
  explicitly wants a different policy: no runtime-floor change, exact-source for unchanged imports,
  semantic-equivalent only after re-decode proof, raw-only equipment, no persisted `Build`
  creation, and explicit paw-ned2 ship-or-defer.
- Add one explicit browser-like runtime smoke test or documented equivalent. `npm run build` alone
  is weaker than the stated dependency risk justifies.
- Convert as many manual gates as possible into executable checks or named checklist artifacts,
  especially for paw-ned2 disposition and final closeout.
- Keep the DoD objective. Scope-policy statements should live in architecture/scope sections; the
  DoD should remain mostly pass/fail.
