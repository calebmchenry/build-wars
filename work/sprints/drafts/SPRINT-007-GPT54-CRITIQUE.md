# SPRINT-007 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-007-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-007-GPT55-DRAFT.md`

Notes:

- Both requested draft artifacts were present.
- `work/sprints/drafts/SPRINT-007-GPT54-DRAFT.md` was intentionally not read or reviewed.

## `SPRINT-007-GPT56SOL-DRAFT.md`

### Strengths

- The sequencing is dependency-correct. It locks the contract, then the context/orchestrator, then
  profession and attribute rules, then skill structure, then skill eligibility, then the separate
  rank calculator, and only then does the integration/documentation closeout (`:151-353`,
  `:362-585`).
- Dependency boundaries are the strongest of the two drafts. Narrow catalog-slice inputs, fixed
  rule-order bands, a separate rank calculator, and an explicitly internal extension strategy reduce
  accidental coupling and keep later epics from reshaping the MVP API (`:109-148`, `:216-353`).
- Verification is strong on the hard failure modes for a rule engine: ambiguous IDs, catalog
  reordering, frozen-input purity, bounds, deterministic ordering, and generated-catalog
  compatibility smoke coverage are all planned (`:393-423`, `:546-585`, `:710-726`).
- Definition of Done completeness is materially better than the GPT55 draft. It covers contract
  shape, severity semantics, deterministic ordering, bounds, non-mutation, rule behavior,
  effective-rank behavior, and final verification/closeout consistency (`:622-726`).
- Risk analysis is concrete and aligned with the real domain hazards: false legality errors,
  duplicate-skill uncertainty, split substitution, title/allegiance deferral, version ambiguity,
  hardcoded maxima drift, and runtime-cast input shape failures (`:728-747`).

### Weaknesses

- Early delivery feedback is later than it should be. Phase 1 and Phase 2 invest heavily in
  contracts, ordering, bounds, and context before the first concrete legality slice lands in Phase 3
  (`:364-423`). That is architecturally clean, but it delays proof that the main validation path is
  landing cleanly.
- Repository-wide verification is back-loaded. Phases 1, 3, 4, 5, and 6 stop at focused tests plus
  `npm run typecheck`, while `npm run verify` does not appear until Phase 7 (`:364-544`,
  `:578-581`). For a new domain surface with several files and strict import boundaries, that is
  late.
- Phase 7 mixes behavior acceptance with administrative bookkeeping such as compendium indexing,
  ledger updates, and a timestamped ticket-burn result manifest (`:546-585`, `:710-726`). That
  makes sprint acceptance depend on process artifacts that are adjacent to, but not part of, the
  rule engine itself.
- The document is very execution-ready, but it locks a large amount of policy up front. If a late
  contract correction is needed, the rework surface is larger than it needs to be.

### Gaps In Risk Analysis

- It does not explicitly call out delivery risk from front-loading architecture work before one thin
  end-to-end validation slice is proven.
- It does not explicitly call out process risk from deferring `npm run verify` until the final
  phase.
- It does not explicitly call out brittleness risk around the hard-coded ticket-burn output path and
  other closeout artifacts.

### Missing Edge Cases

- Invalid non-budget option inputs are not covered as clearly as budget-policy validation.
  `maxPveOnlySkills`, future configuration growth, and other option-shape failures should have
  explicit rejection or warning semantics (`:393-423`, `:694-706`).
- The plan mentions issue caps, but it does not spell out whether truncated runs report emitted
  counts only or discovered counts, which matters for deterministic callers and tests
  (`:257-259`, `:655-656`).
- The scenario matrix does not explicitly call out multi-rule collisions involving title-classified
  PvE-only skills or split-skill ambiguity combined with duplicate/unsupported status.

### Definition Of Done Completeness

- This is the more complete DoD and is close to execution-ready.
- The main improvement is structural, not substantive: split implementation acceptance from
  administrative closeout so contract correctness and verification evidence remain the primary pass/
  fail criteria.

## `SPRINT-007-GPT55-DRAFT.md`

### Strengths

- The phase sequence is easy to follow and mostly dependency-sound: contract, then context, then
  profession/attribute rules, then skill-bar rules, then skill eligibility, then the rank
  calculator, then integration/closeout (`:137-236`, `:298-584`).
- Verification cadence is better than the GPT56SOL draft. Every phase gates on focused tests,
  `npm run typecheck`, and `npm run verify`, which creates earlier integration pressure (`:300-584`).
- The document is shorter and easier to execute operationally. It is less likely to spend too long
  in architecture-only work before the team starts shipping rule behavior.
- The open-questions section keeps unresolved policy visible instead of burying it in prose
  defaults (`:740-762`).

### Weaknesses

- The biggest sequencing flaw is that Phase 1 does not really freeze the public contract. The draft
  explicitly says names may change (`:162`), and Phase 6 later wires `ValidationResult.calculations`
  into the result “where useful” (`:508`). Later phases can still reshape the supposedly stable API.
- `extensionRules` exposes caller-supplied validators in the public options before determinism and
  boundary concerns are fully settled (`:198-210`). That complicates verification and weakens the
  otherwise pure-domain boundary.
- The implementation structure is more coupled than it should be. Putting orchestration and all MVP
  rules in `src/domain/build-validation.ts` makes later phases less modular and raises the cost of
  isolated verification (`:107-116`, `:588-594`).
- Too many contract-shaping questions remain open for a sprint that starts implementation
  immediately: default profile, unresolved severity overrides, missing-secondary behavior, PvP
  budget default, final-rank cap, and generated-catalog smoke-test policy (`:740-762`).
- Determinism and defensive behavior are materially less locked down than in the stronger draft.
  Duplicate catalog IDs, explicit issue/output bounds, catalog reorder stability, and non-mutation
  guarantees are not driven early enough by the phase plan or DoD (`:216-236`, `:640-676`).

### Gaps In Risk Analysis

- No explicit risk is called out for ambiguous or duplicate catalog IDs causing first-record-wins
  behavior.
- No explicit risk is called out for caller-supplied `extensionRules` eroding determinism, purity,
  or offline guarantees.
- No explicit risk is called out for late public-contract churn caused by `calculations` and the
  unresolved defaults in the open-questions section.
- No explicit risk is called out for oversized or hostile runtime inputs producing too many issues
  or unstable output.

### Missing Edge Cases

- Invalid option shapes are under-specified: negative `maxPveOnlySkills`, unsupported `profile` or
  `mode`, and contradictory severity overrides do not have explicit behavior (`:198-210`).
- Ambiguous catalog IDs and duplicate split-group membership are not turned into concrete
  verification cases, even though the context layer depends on stable lookup behavior (`:216-236`).
- The draft does not define whether `ValidationResult.calculations` is present for invalid or
  partial builds, which makes verification and caller expectations ambiguous (`:154-158`, `:508`).
- Combined-failure ordering cases are pushed late to Phase 7 instead of being asserted as soon as
  issue ordering becomes part of the public contract.

### Definition Of Done Completeness

- The DoD is materially less complete than the GPT56SOL draft (`:640-676`).
- It covers the broad rule areas, but it does not explicitly require non-mutation, ambiguous-catalog
  handling, code-owned bounds, catalog reorder stability, issue-cap behavior, static rule
  composition, or a clear contract for result-side calculations.
- The open questions at the end are the clearest sign that acceptance criteria are not fully closed
  before execution.

## Comparison

### Where `GPT56SOL` Is Stronger

- Contract closure and dependency ordering are much tighter.
- Determinism, ambiguity handling, bounds, and non-mutation are specified in a directly testable
  way.
- The DoD and risk analysis are materially more complete.

### Where `GPT55` Is Stronger

- Verification cadence is better because `npm run verify` is part of every phase gate.
- The execution plan is easier to scan and less front-loaded with architecture work.
- It is more willing to keep unresolved policy decisions visible instead of silently assuming them.

### Shared Weaknesses

- Both drafts mix implementation acceptance with administrative closeout work such as ticket
  updates, sprint records, ledger edits, and a timestamped ticket-burn result path
  (`GPT56SOL :546-585`, `GPT55 :523-584`).
- Both drafts would benefit from a cleaner split between the stable public validation contract and
  optional future extension surfaces.

## Merge Recommendations

- Use `SPRINT-007-GPT56SOL-DRAFT.md` as the baseline for contract rigor, dependency boundaries,
  determinism, risk analysis, and Definition of Done structure.
- Pull `GPT55`'s per-phase verification discipline into the merged plan: add `npm run verify` to
  each implementation phase, not just the closeout phase.
- Keep GPT56SOL's internal static rule composition and narrow catalog/context design. Do not expose
  `extensionRules` as a public callback surface unless there is a concrete near-term consumer and a
  deterministic contract for it.
- Tighten early sequencing by landing one thin end-to-end validation slice sooner. After contracts
  and minimal context exist, prove a happy-path profession/attribute validation flow before
  expanding all ordering, bounds, and documentation work.
- Lock the public result shape in Phase 1. Decide once on `valid` vs `ok`, whether calculations live
  inside `ValidationResult` or stay in a separate rank API, and whether deferred/unsupported facts
  are warnings or info before later phases start.
- Move ticket/ledger/burn-manifest bookkeeping into a final execution checklist or appendix so the
  core DoD stays focused on rule-engine behavior and verification evidence.
- Add explicit coverage for invalid configuration inputs, ambiguous catalog IDs and split groups,
  issue-cap semantics, and multi-rule collision cases that stress deterministic ordering.
