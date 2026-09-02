# SPRINT-011 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-011-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-011-GPT55-DRAFT.md`

Both requested drafts were present. `work/sprints/drafts/SPRINT-011-GPT54-DRAFT.md` was intentionally not reviewed.

## Overall Assessment

`SPRINT-011-GPT56SOL-DRAFT.md` is the stronger execution draft. It resolves the highest-risk architectural decisions early, keeps later phases tightly gated, and treats verification and promotion as first-class work instead of cleanup. `SPRINT-011-GPT55-DRAFT.md` is still useful, but it leaves too many identity and source-authority decisions open for too long, which weakens dependency ordering and increases rework risk.

The best merge direction is to use GPT56SOL as the base plan, then borrow GPT55's clearer section grouping and a few of its framing notes around source-authority uncertainty and downstream boundaries.

## Critique: GPT56SOL Draft

### Strengths

- Sequencing is disciplined. The draft fixes the major identity, source-authority, stacking, headgear, and promotion rules up front, then carries those decisions through six gated phases without reopening them later.
- Dependency ordering is strong. Phase 1 settles contracts and profile shape before Phase 2 source planning, Phase 3 extraction depends on source-set resolution, Phase 4 semantics depends on deterministic raw extraction, and Phase 5 promotion depends on all earlier gates.
- Verification strategy is the most mature of the two drafts. It uses focused test suites by phase, fixed-clock determinism checks, repeated offline replay, explicit `git check-ignore -v` checks, and a first-baseline review tied to digests and promoted bytes.
- Definition of Done is comprehensive. It covers artifact boundaries, semantic versioning, source accounting, exact-path allowlisting, warning disposition policy, release gates, ticket/ledger closeout, and the requirement to leave the sprint blocked if promotion prerequisites are not met.
- The draft handles shared dependency risk well. The EPIC-04 protocol-sharing work is explicitly conditional on preserving existing bytes and behavior, which is the right guardrail for a cross-profile refactor.

### Weaknesses

- The draft overcommits early. Locking the bounded hybrid authority and modifier-ID identity before the source-shape checkpoint is defensible, but it means a bad early assumption would force plan amendment after a lot of surrounding detail has already been specified.
- Phase 1 is heavy. It combines domain-contract work, CLI/profile generalization, regression protection for other profiles, and a source-shape checkpoint. That is a large amount of risk concentration in the opening phase.
- The verification burden may be higher than necessary in-flight. The quality bar is good, but the draft does not distinguish clearly between per-phase smoke checks and end-of-sprint full-gate reruns, so execution could spend time repeatedly paying the full verification tax.
- Cross-language validation is strongest in Phases 1 and 5. Phase 3 extraction and join work would benefit from one more explicit TypeScript-side assertion that the generated candidate shape still matches the intended runtime contract boundary.

### Gaps In Risk Analysis

- Reviewer bandwidth is not treated as an execution risk. This draft requires multiple named reviews, warning dispositions, a first-baseline review, and promotion approval. If that human review capacity is unavailable, the sprint blocks just as surely as when live inputs are unavailable.
- The risk table does not explicitly call out fixture-to-live divergence. The draft is strong on determinism, but it could say more directly that synthetic fixtures may fail to expose live anomalies until discover/fetch work is attempted.
- The early fixed-decision strategy is not itself modeled as a risk. The document has amendment language, but it does not explicitly acknowledge the cost of having to unwind an early source-authority or identity assumption.

### Missing Edge Cases

- One canonical detail page representing multiple rune records across ranks should be an explicit fixture and gate case, not just an open question.
- Conflicting evidence between modifier-row inventory and rune inventory deserves a named fixture path beyond general candidate accounting.
- Professionless or universal common runes with incomplete restriction text should be called out more explicitly as a fixture case.
- Equal-maximum attribute bonuses from multiple source keys are discussed in the helper contract, but the phase-level fixture lists could be more explicit about proving the exact output evidence shape for ties.

### Definition of Done Completeness

The DoD is very close to complete. It is materially better than the GPT55 version on source accounting, promotion rigor, semantic-version boundaries, and exact-path controls. The only meaningful gap is operational rather than technical: the DoD could explicitly require that the selected reviewed source-plan and snapshot-set references be captured in the final closeout evidence or result manifest, not only in adjacent artifacts and documentation.

## Critique: GPT55 Draft

### Strengths

- The draft identifies the right problem areas: source authority, runtime-vs-audit separation, deterministic regeneration, metadata-only icons, and keeping equipment/UI work out of scope.
- Phase structure is understandable and easier to scan than the GPT56SOL draft. The grouped Definition of Done sections are also easier to read quickly.
- The draft is appropriately cautious about source completeness. It does not pretend the source graph is solved before a checkpoint proves it.
- It has reasonable downstream-boundary awareness, especially around not widening the current app behavior and preserving the runtime import boundary.

### Weaknesses

- Sequencing is too open on the two most important decisions: source authority and stable rune identity. The draft says Phase 1 must define identity policy, but it still leaves the actual authority for numeric IDs and the final source graph unresolved well into later phases.
- Dependency ordering is weaker than GPT56SOL. Extraction, QA, determinism, and diff review all depend on stable identity semantics, yet the draft still allows multiple ID strategies and keeps the source-authority question open in the architecture and open-questions sections.
- Verification strategy is materially weaker. Phase 2 relies in part on `npm run data:test` and one manual discover-only live smoke, which is not enough for a source-planning protocol that is supposed to be deterministic, bounded, and digest-confirmed.
- Shared-ingestion regression risk is under-specified. The draft says existing profile behavior must be preserved, but it does not include the stronger byte-preservation gate that GPT56SOL adds around EPIC-04-adjacent protocol work.
- Scope control is less crisp. The optional language around `src/app/catalogs.ts` leaves room for avoidable runtime integration creep in a sprint that is otherwise framed as catalog-only.
- Too much critical uncertainty survives until Phase 5. Live discover/fetch, offline replay, promotion, and final QA all converge there, which means late discovery of authority or identity problems can invalidate a large amount of prior work.

### Gaps In Risk Analysis

- There is no explicit risk covering refactor fallout in shared ingestion code. That is one of the highest-likelihood ways for this sprint to create regressions outside EPIC-10.
- Reviewer capacity is listed as a dependency, but it is not treated as a risk with mitigation.
- The risk table does not call out name-collision edge cases such as common-family naming colliding with attribute names.
- Multi-record-per-page source shapes are acknowledged as open questions but not treated as a concrete planning or QA risk.

### Missing Edge Cases

- Same-page multi-rank or multi-variant records are not promoted into the phase fixture lists strongly enough.
- Cross-checking both sides of the source graph is weaker. The draft does not emphasize accounting for every modifier-row candidate and every rune-inventory entry with the same force as GPT56SOL.
- The Restoration vs Restoration Magic collision should be a named fixture and QA case.
- Equal-rank ties that should preserve multiple contributing sources while suppressing duplicate attribute gain are not described precisely enough.
- The blocked-sprint outcome when live replay inputs are unavailable is implied in tasks and risks, but it is not turned into a crisp DoD gate.

### Definition of Done Completeness

The DoD is readable and mostly sound, but it is thinner than GPT56SOL in several important places:

- It does not explicitly require result-manifest completeness, including the final path set and `commit_created: false`.
- It does not require a first-promotion baseline review with concrete expected coverage artifacts.
- It does not define source accounting as strongly because the candidate set is still somewhat under-specified.
- It does not make the blocked-until-promotion outcome as explicit as the stronger draft does.

## Comparison

### Where GPT56SOL Is Better

- It resolves the identity model instead of postponing it.
- It gives the source-set protocol a tighter dependency chain and stronger regression gates.
- It treats verification as part of implementation, not just end-stage confirmation.
- It has a fuller and more enforceable Definition of Done.

### Where GPT55 Is Better

- It is easier to scan quickly.
- It frames source-authority uncertainty in a way that is slightly more approachable for reviewers who want to see the ambiguity acknowledged before execution starts.
- Its grouped DoD sections are cleaner to navigate than one long flat checklist.

## Merge Recommendations

1. Use `SPRINT-011-GPT56SOL-DRAFT.md` as the base execution plan.
2. Keep GPT56SOL's fixed modifier-ID identity, effect-level stacking model, EPIC-04 byte-preservation gate, and promotion-blocking rules unchanged.
3. Reformat the final merged draft with GPT55's clearer grouped sectioning where that improves readability without reopening settled decisions.
4. Add an explicit operational risk for reviewer bandwidth and manual disposition/baseline-review availability.
5. Add explicit fixture and QA cases for:
   - one canonical page backing multiple rune records;
   - conflicting modifier-row vs rune-inventory evidence;
   - professionless/common runes with incomplete restriction text;
   - equal-maximum attribute ties with multiple contributing sources;
   - Restoration vs Restoration Magic naming collisions.
6. Split verification into phase-local smoke gates versus end-of-sprint full regression/promotion gates so the stronger plan stays rigorous without becoming unnecessarily expensive to execute.
7. Carry GPT56SOL's stronger closeout requirements into the merged draft, especially exact result-manifest contents, blocked-if-no-production-replay language, and first-baseline review evidence.

## Recommendation

If only one draft is advanced, advance `SPRINT-011-GPT56SOL-DRAFT.md`. It is the better execution document. Merge in GPT55 selectively for readability and for a clearer presentation of unresolved source-shape discovery, but not for core sequencing or identity policy.
