# SPRINT-003 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-003-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-003-GPT55-DRAFT.md`

`work/sprints/drafts/SPRINT-003-GPT54-DRAFT.md` was intentionally not reviewed per instruction.

## Overall Assessment

Use the GPT56SOL draft as the merge base. It is materially stronger on dependency discipline,
verification specificity, deterministic artifact requirements, and Definition of Done coverage.
The GPT55 draft is still useful, but mainly as a source of simplifications: it has a cleaner
standalone scaffold/traceability phase and a more readable phase-by-phase file inventory.

The biggest difference is that GPT56SOL resolves critical execution decisions early, while GPT55
leaves several of them as open questions even though later phases depend on those answers.

## GPT56SOL Draft Critique

### Strengths

- Sequencing is mostly coherent and respects the ticket dependency chain instead of letting later
  phases pull infrastructure work forward implicitly.
- Dependency ordering is explicit: client before snapshots, snapshots before extractors, parser and
  skill-ID work before icon resolution, artifacts before QA, and command closeout last.
- Verification strategy is strong. The draft distinguishes unit, integration, CLI, contract, and
  end-to-end fixture verification instead of collapsing everything into `npm run verify`.
- Determinism is treated as a first-class requirement rather than a nice-to-have. The draft
  separates semantic identity from clock metadata and requires repeated fixture runs.
- Definition of Done is the most complete of the two drafts. It covers boundaries, snapshot
  integrity, parser behavior, icon constraints, cross-language contract checks, QA gates, and
  command behavior in a way that is close to execution-ready.
- Risk analysis is concrete and tied to mitigations that match the implementation phases.

### Weaknesses

- Phase 1 is overloaded. It combines tool boundary decisions, Python environment setup, dependency
  locking, package layout, and BW-0201 client delivery. That is a lot of failure surface for the
  first implementation phase.
- The parser stop condition is directionally correct, but it may be broader than necessary. If the
  parser spike is inconclusive, the current wording risks blocking reusable artifact/QA plumbing
  that could still be completed against synthetic inputs or skill-ID-only data.
- Documentation is heavily back-loaded into the final phase. Some setup, artifact-root, and
  retention guidance should stabilize earlier so later phases are not building against moving local
  conventions.
- Manual live validation is intentionally bounded, but the draft does not define one compact
  evidence checklist for that manual step. That makes closeout review slightly subjective.

### Gaps In Risk Analysis

- It does not explicitly call out repository verification time growth as the Python toolchain and
  fixture pipeline are added to `npm run verify`.
- It only indirectly covers stage-composition risk. The draft is excellent at per-phase checks, but
  it should acknowledge the possibility that individually correct stages still fail when composed
  before the final closeout phase.

### Missing Edge Cases

- Symlink escape testing is implied by the security section, but it is not called out clearly in
  phase verification or phase acceptance.
- Baseline-path abuse and unreadable baseline artifacts are covered late, but the earlier artifact
  and QA phases do not state that those path and readability failures must be exercised directly.
- The draft is strong on duplicate and ambiguity cases, but it does not clearly call out empty or
  zero-record success/failure semantics for the skill-ID pipeline.
- Live-mode recovery after partial snapshot writes is not described beyond atomic file handling.

### Definition Of Done Completeness

This is the stronger DoD by a wide margin. Nearly every important invariant is stated explicitly and
is testable. The main issue is density, not missing coverage. A merged final draft should keep most
of this DoD, but trim duplicate statements where the same invariant appears in ticket acceptance,
phase acceptance, and sprint DoD.

## GPT55 Draft Critique

### Strengths

- It has a cleaner entry sequence than GPT56SOL. A dedicated scaffold/traceability phase is easier
  to execute and review than combining bootstrap work with BW-0201 delivery.
- The dependency chain is stated clearly and the note that BW-0206 should wait for the minimal
  parser/icon outputs it serializes is useful.
- The per-phase file lists are practical. They make scope inspection and closeout review easier.
- The draft stays readable. A human executor can scan the implementation order quickly without
  decoding a large amount of supporting architecture text.

### Weaknesses

- Several later phases depend on decisions that the draft leaves unresolved. The biggest examples
  are parser accept/reject criteria, deterministic timestamp behavior, QA mapping strategy, and the
  exact failure threshold for regenerate.
- The QA framework arrives too late relative to the rest of the plan. Earlier phases are already
  supposed to emit findings, but the draft does not lock the shared diagnostic-to-`QaFinding`
  strategy before those phases begin.
- The parser phase records a recommendation, but it does not create a hard go/no-go gate for BW-0205
  and BW-0206. That leaves downstream dependency behavior ambiguous if `mwparserfromhell` is not
  accepted cleanly.
- Verification is too generic. Repeating “focused tests” plus `npm run verify` does not prove the
  hard properties this sprint cares about: deterministic bytes, stable IDs, no network in offline
  paths, and cross-language contract alignment.
- The live/offline/fixture mode boundaries are present, but much less rigorously specified than in
  GPT56SOL. That increases the risk of accidental drift between supported modes.

### Gaps In Risk Analysis

- It does not call out silent data-loss risk when unknown mappings, unknown template parameters, or
  unresolved redirects are mishandled.
- It does not explicitly cover path traversal, symlink escape, integrity collision, or interrupted
  write risks, even though snapshot safety is central to the sprint.
- It does not cover QA-bypass risk well enough. Accepted-risk handling and non-waivable cases are
  mentioned in policy language, but not elevated as a sprint execution risk.
- It does not call out end-to-end composition risk or verification runtime growth risk.

### Missing Edge Cases

- Continuation cycles, multi-key continuation tokens, malformed `Retry-After`, HTTP-200 `maxlag`
  errors, final-origin validation, and oversized response bodies are not specified strongly enough.
- Snapshot idempotent refetch behavior, changed-revision identity changes, interrupted writes, and
  non-ASCII payload handling are under-specified compared with the sprint’s determinism goals.
- The draft does not clearly require stable finding ID/order tests, explicit baseline-diff behavior,
  or central gate-matrix validation.
- Parser failure semantics are not strong enough: the draft does not say what must stop if the spike
  is lossy.
- Icon ambiguity handling is weaker than GPT56SOL because it does not insist on “no silent winner”
  language.

### Definition Of Done Completeness

The DoD covers the major capability buckets, but it leaves too many critical guarantees implicit.
It is weaker on atomicity, path confinement, idempotency, stale-environment detection, repeated
determinism proof, stable finding IDs/order, explicit baseline semantics, and strict offline test
behavior. As written, the sprint could plausibly be marked done while the hardest replay and QA
guarantees are only partially demonstrated.

## Comparison

### Sequencing And Dependency Ordering

- GPT56SOL is better at turning the ticket graph into a real execution graph.
- GPT55 is better at isolating bootstrap work into its own early phase.
- GPT56SOL should contribute the dependency discipline.
- GPT55 should contribute the standalone scaffold/setup phase shape.

### Verification Strategy

- GPT56SOL is substantially better. It names the exact properties that must be verified and ties
  them to specific phases.
- GPT55 is acceptable at the unit-test level but too weak at proving stage composition, determinism,
  and QA gate behavior.

### Definition Of Done

- GPT56SOL has the complete DoD.
- GPT55 has the shorter DoD, but the brevity comes from omitted guarantees rather than better
  prioritization.

## Merge Recommendations

1. Use GPT56SOL as the base draft.
2. Split GPT56SOL Phase 1 into two steps by importing GPT55’s cleaner bootstrap approach:
   `Scaffold/traceability/setup` first, then `BW-0201 MediaWiki client`.
3. Keep GPT56SOL’s phase acceptance criteria and most of its DoD language. That is the stronger
   execution contract.
4. Resolve GPT55’s open questions up front using GPT56SOL’s defaults instead of carrying those
   questions into downstream phases.
5. Add one explicit mid-sprint integration checkpoint after BW-0206 or BW-0207 so stage-composition
   failures are caught before the final closeout phase.
6. Narrow the parser failure gate: block parser-dependent icon extraction and final sprint closeout,
   but allow reusable QA/artifact infrastructure work to continue on synthetic or skill-ID-only
   inputs if that still produces meaningful platform value.
7. Define one bounded live-smoke checklist for manual verification so closeout evidence is objective:
   explicit profile/titles, no target-page crawl, ignored artifacts only, no response-body logging,
   and no network dependence in canonical verification.
8. Keep GPT55’s per-phase file inventory only if the final sprint document benefits from that level
   of execution scoping; otherwise prefer GPT56SOL’s cleaner narrative structure.

## Final Recommendation

Merge toward a GPT56SOL-led final sprint with one major structural change: introduce GPT55’s
dedicated scaffold/setup phase before BW-0201. That yields the strongest result on sequencing,
dependency ordering, verification, and Definition of Done completeness without carrying GPT55’s
unresolved execution decisions into the final plan.
