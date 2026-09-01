# Sprint 004 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-004-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-004-GPT55-DRAFT.md`

`work/sprints/drafts/SPRINT-004-GPT54-DRAFT.md` was intentionally not reviewed.

## Overall Assessment

`SPRINT-004-GPT56SOL-DRAFT.md` is the stronger execution draft. It has a clearer dependency chain, materially better promotion gates, and a more complete Definition of Done. `SPRINT-004-GPT55-DRAFT.md` is still useful, but mainly as a simplification pass for framing and tables rather than as the base execution plan.

## Critique: `SPRINT-004-GPT56SOL-DRAFT.md`

### Strengths

- The phase order mostly matches the real dependency graph: contract and profile groundwork first, template crosswalk second, joined extraction third, point-rule extraction fourth, promotion and QA fifth, then docs and closeout.
- Dependency ordering is explicit instead of implied. That reduces the chance of ticket burn proceeding while authority rules, snapshot selection, or catalog contracts are still moving.
- Verification strategy is layered correctly. It uses synthetic and focused tests early, then production-grade determinism, baseline review, gate validation, and final offline verification late.
- The draft treats promotion as a release gate, not just artifact generation. Requiring a bounded fresh live refresh, offline replay, byte-identical regeneration, and reviewed QA evidence is the right standard for the first runtime-eligible catalog.
- The Definition of Done is close to executable. Most items are measurable and tied to specific invariants instead of aspirational outcomes.

### Weaknesses

- Phase 1 is overloaded. It combines domain contract work, profile-registry refactoring, CLI behavior, snapshot-selection hardening, semantic versioning rules, and fixture migration before the sprint has proven the source shape it depends on.
- The bounded source-shape proof lands too late. Phase 3 finalizes the exact source plan after Phase 2 already locks in crosswalk behavior and fixtures. A short proof step should happen earlier so extractor boundaries are not hardened against planning assumptions.
- Manual-review work is sequenced ambiguously. Phase 3 asks for complete review evidence for primary summaries, but Phase 5 also treats review completion as a promotion gate. The plan should distinguish "support the review model" from "complete the review for release."
- Baseline review assumes there is a prior approved catalog to diff against. First-promotion handling is not fully specified, even though semantic versus provenance-only classification is one of the sprint's core release controls.

### Gaps in Risk Analysis

- There is no explicit risk entry for first-release baseline handling when no prior approved catalog exists.
- Manual-review throughput is treated as a hard gate but not as a schedule risk, even though summary review and source-policy review can block the sprint late.
- The draft records the limitations of ignored snapshots, but reviewer handoff risk remains underspecified when promotion review depends on local ignored artifacts.

### Missing Edge Cases

- First promotion against an empty baseline.
- Partial live refresh where some required pages are refreshed and others are accidentally pulled from stale snapshots.
- Duplicate or overlapping quest records where campaign or eligibility context, not quest name alone, is the true key.
- A source revision changing after summary review approval but before final promotion, which should force re-review.

### Definition of Done Completeness

- This is the most complete DoD of the two drafts.
- It still needs one explicit item for first-promotion baseline semantics.
- It should add one item proving that the promoted catalog, manifest, and QA artifact all reference the same selected snapshot set and source revisions.
- It should add one item defining how manual-review evidence remains auditable during review when raw snapshots stay uncommitted.

## Critique: `SPRINT-004-GPT55-DRAFT.md`

### Strengths

- The scope boundary and data ownership sections are concise and easy to consume.
- The draft correctly keeps UI work, runtime source access, and later rule-engine behavior out of scope.
- The phase structure is readable and easier to scan than the larger draft.
- It identifies the right major work areas: crosswalk, joined extractors, point rules, promotion, and closeout.

### Weaknesses

- Dependency ordering is materially under-specified. The phases are listed, but the draft does not provide a strong ticket dependency chain or clear phase-to-phase acceptance gating.
- Pipeline and profile responsibilities are split awkwardly across phases. Phase 2 introduces the EPIC-03 profile, while Phase 5 adds offline/live mode behavior and regeneration paths. That sequencing invites rework because extraction work begins before the execution path is fully stabilized.
- Core policy decisions remain unresolved in `Open Questions`, even though they change the sprint's sequencing and completion criteria. That includes whether summaries ship, whether a QA artifact is promoted, whether live refresh is required, and whether PvP or hero assumptions are represented now.
- Phase 4 is notably weaker on quest semantics. Its wording about "two attribute-point quest rewards per relevant campaign" and "all attribute quests completed" risks over-counting mutually exclusive paths and pushes a modeling decision into the draft before source reconciliation is settled.
- Verification is too fixture-centric for a sprint whose deliverable is a reviewed production catalog. The live refresh is optional, not a required release gate.

### Gaps in Risk Analysis

- No explicit risk for regressing the existing EPIC-02 profile while adding the EPIC-03 profile and new artifact flow.
- No explicit risk for first approved catalog generation without a prior baseline.
- No explicit risk for cross-profile snapshot-selection drift or stale snapshot mixing.
- No explicit risk for manual-review capacity or unresolved policy questions delaying sprint closeout.
- No explicit risk for promoting too little review evidence if full QA JSON stays ignored and only an optional summary is tracked.

### Missing Edge Cases

- Attribute ID `0` remaining distinct from profession sentinel `0` is not enforced as strongly as in the other draft.
- Duplicate abbreviations and normalized-name collisions are not called out clearly enough in verification or DoD.
- Missing or ambiguous icon metadata beyond simple resolver success.
- First-promotion behavior when there is no previous approved artifact.
- Repeated offline replay from the exact live snapshots used for promotion.

### Definition of Done Completeness

- The DoD is directionally correct but not execution-complete.
- It does not require explicit pass states for release gates or closure of open warnings.
- It does not require a machine-readable promoted QA artifact, which weakens auditability.
- It does not define semantic versus provenance-only version behavior tightly enough.
- It does not explicitly require that the existing EPIC-02 profile remains unchanged after the EPIC-03 additions.
- It leaves too much room for sprint completion without a fresh reviewed live-data candidate.

## Comparison

The main difference is execution readiness. The GPT56SOL draft converts most key decisions into enforceable sequencing and gates. The GPT55 draft still carries several unresolved policy choices, which makes its phase ordering less trustworthy because later acceptance conditions can still move.

The GPT56SOL draft is also much stronger on verification strategy. It covers focused unit and fixture work, production artifact determinism, baseline review classification, exact-path promotion, and final offline verification after the live refresh. The GPT55 draft covers the basics, but it stops short of making production-grade review evidence mandatory.

The GPT55 draft's main advantage is readability. Its scope framing and ownership tables are easier to scan and would improve the merged sprint if carried over selectively.

## Merge Recommendations

- Use `SPRINT-004-GPT56SOL-DRAFT.md` as the base merged draft.
- Pull in the concise `Scope Boundary` and `Data Ownership` framing from `SPRINT-004-GPT55-DRAFT.md`.
- Add an explicit first-promotion rule covering how baseline review works when no prior approved catalog exists.
- Insert an early bounded source-shape checkpoint before Phase 2 or early in Phase 2, so source-plan assumptions are proven before extractor boundaries and fixtures harden.
- Split manual-review sequencing into two steps: implementation support for review evidence in extraction phases, then final review completion and gate closure in the promotion phase.
- Keep the GPT56SOL quest-cap model and verified-boundary language. Do not merge the GPT55 assumption that all campaign quest rewards can be summed as one default.
- Keep the GPT56SOL requirement for a mandatory fresh live refresh followed by offline replay. Do not merge GPT55's optional live-refresh framing.
- Keep GPT56SOL's exact promoted release unit with machine-readable QA evidence. Do not reduce promotion to catalog plus optional text summary.
- Add one merged DoD item proving that the promoted catalog, manifest, QA artifact, and baseline review all point to the same selected snapshot set.
