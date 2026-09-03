# Combined Critique

Both requested drafts are present. `SPRINT-014-GPT56SOL-DRAFT.md` is the stronger base: it has better dependency gating, a more defensible verification plan, and a Definition of Done that is much closer to being objectively reviewable. `SPRINT-014-GPT55-DRAFT.md` is easier to scan, but it leaves too many execution-critical decisions open.

## `SPRINT-014-GPT56SOL-DRAFT.md`

**Strengths**
- The phase order is mostly sound and explicit: contract first, armor and weapons after Phase 1, validation after both, closeout last ([SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:417)).
- It treats validation as a real integration phase instead of sprinkling rule-engine work across earlier phases ([SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:537)).
- The verification strategy is materially better than GPT-55: focused per-phase tests, explicit rule-engine contract coverage, targeted app regressions, source scans, and final offline verify ([SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:584)).
- The DoD is the most complete of the two. It covers contract shape, armor, weapons, validation semantics, regression boundaries, and downstream handoffs in separate sections ([SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:696)).
- The risk register is substantially stronger, especially around optional catalogs, duplicate IDs, catalog skew, false requirement warnings, `equipment: null` regressions, and rule ordering ([SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:796)).

**Weaknesses**
- Phase 3 says it can proceed independently of Phase 2 after Phase 1 ([SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:511)), but weapon requirement evaluation depends on the rank-adjustment behavior established in Phase 2 and reused in Phase 4 ([SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:476), [SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:574)). That dependency should be explicit.
- The `Build.equipment` type migration happens in Phase 1 ([SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:436)), but targeted app regressions do not run until Phase 4 ([SPRINT-014-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md:587)). That delays detection of compatibility breakage.
- It is close to an executable design spec rather than a sprint draft. That is not fatal, but it increases the chance of spending effort on taxonomy and documentation detail before the highest-risk contract changes are proven.

**Gaps In Risk Analysis**
- It does not explicitly call out share/backup/template-workflow regressions from the `EquipmentTemplate` to `EquipmentLoadout` boundary, even though the current repo still types `Build.equipment` as `EquipmentTemplate | null` in [src/domain/build.ts](/Users/calebmchenry/code/build-wars/src/domain/build.ts:33).
- It does not explicitly treat authored `catalogVersion` diverging from supplied validation views as a stale-data scenario that needs tests.

**Missing Edge Cases**
- Unsupported `schemaVersion` is named in issue families, but not clearly called out in phase verification.
- Duplicate weapon-set slots and weapon-set overflow are specified in validation semantics, but not clearly listed in the test matrices.
- Missing primary profession plus equipment restrictions should be an explicit unresolved-path test.
- Unsafe numeric IDs/ranks and “placeholder later matches a catalog record but stays unresolved” should be explicit tests.

**Definition Of Done Completeness**
- Strong overall.
- Add explicit closeout checks for share/backup/template compatibility and authored-vs-supplied catalog version mismatch.

## `SPRINT-014-GPT55-DRAFT.md`

**Strengths**
- It is more concise and easier to read.
- The high-level sequence is directionally correct: contracts, armor, weapons, validation, docs ([SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:158)).
- It keeps the domain/app boundary tight and preserves `equipment: null` compatibility ([SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:73), [SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:365)).
- Its DoD captures the major deliverables and downstream ownership at a high level ([SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:365)).

**Weaknesses**
- Dependency ordering is too implicit. The phases do not clearly gate on each other, and several validation-policy decisions remain open until late ([SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:185), [SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:447)).
- The headgear `+1` fact is implemented in Phase 2 ([SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:201)) without an explicit provenance gate. GPT-56 handles this better.
- `armorRating` stays in scope in the contract and DoD ([SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:68), [SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:116), [SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:377)) even though the draft also says no source-derived armor catalog and leaves the underlying fact unresolved ([SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:455)). That is avoidable scope and dependency ambiguity.
- Verification is materially weaker. Phase 4 omits `test/domain/rule-engine-contracts.test.ts`, despite the repo already having that contract test, and there are no targeted share/backup/template regressions before final `npm run verify` ([SPRINT-014-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md:281)).

**Gaps In Risk Analysis**
- No explicit risks for duplicate-ID resolution order, weapon/modifier catalog-set skew, false requirement warnings from unresolved rank inputs, or rule-order regression.
- No explicit risk that unresolved validation-policy questions prevent a clean sprint closeout.

**Missing Edge Cases**
- Unsupported schema version.
- Duplicate weapon-set slots and set-count overflow.
- Weapon/modifier catalog-set mismatch.
- Missing catalog views when equipment is selected.
- Missing primary profession causing unresolved restrictions instead of mismatch cascades.
- Null vs empty-loadout parity through share/backup/template workflows.

**Definition Of Done Completeness**
- Adequate as a summary, but not auditable enough for this scope.
- It does not explicitly require `RULE_ENGINE_VERSION` advancement, catalog-version reporting, no-mutation guarantees, bounded `catalog-unavailable` behavior, or canonical empty-loadout/no-issue behavior.

## Comparison

GPT-56 is the better merge base. Its sequencing is more disciplined, its verification plan better matches the actual regression surface, and its DoD is much closer to something a reviewer can close confidently.

GPT-55’s main advantage is readability. It also usefully leaves more room for local naming and file-shape adjustments. That flexibility is worth keeping, but not at the cost of GPT-56’s stronger gates.

A repo-alignment note matters here: `Build.equipment` is still `EquipmentTemplate | null` in [src/domain/build.ts](/Users/calebmchenry/code/build-wars/src/domain/build.ts:33), and the rule engine is still `rule-engine:v1` in [src/domain/validation.ts](/Users/calebmchenry/code/build-wars/src/domain/validation.ts:1). That makes early regression coverage non-optional. GPT-56 recognizes that more clearly than GPT-55, but even GPT-56 should shift some of that verification earlier.

## Merge Recommendations

1. Use `SPRINT-014-GPT56SOL-DRAFT.md` as the base.
2. Keep GPT-56’s explicit phase gates, validation classification, catalog-view rules, and segmented DoD.
3. Pull in GPT-55’s lighter wording where possible so implementation details can adapt to the actual codebase.
4. Make weapon requirement work depend explicitly on Phase 2’s rank-adjustment helper, or move requirement evaluation fully into Phase 4.
5. Add targeted regression checks to Phase 1 for the `Build.equipment` migration: at minimum rule-engine contract, persistence, share, backup/restore, and template-workflow coverage.
6. Remove `armorRating` from the merged contract unless a source-backed consumer is identified now. GPT-56’s explicit deferral is the safer boundary.
7. Resolve before execution, not during it: missing-catalog behavior, unmet-requirement severity, per-set requirement policy, and `complete` vs `resolved` classification.
8. Add explicit tests for unsupported schema versions, duplicate/overflow weapon sets, weapon/modifier catalog-set mismatch, authored-vs-supplied catalog version mismatch, missing primary profession with equipment, unsafe numeric inputs, and unresolved placeholders that later become resolvable.