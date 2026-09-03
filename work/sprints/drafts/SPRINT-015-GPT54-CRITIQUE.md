# Combined Critique: Sprint 015 Drafts

## GPT-56SOL
Refs: [Overview](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT56SOL-DRAFT.md:22), [Implementation](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT56SOL-DRAFT.md:276), [Definition of Done](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT56SOL-DRAFT.md:649), [Risks](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT56SOL-DRAFT.md:727)

- **Strengths:** This is the stronger draft on sequencing. It establishes catalog/state/selector contracts before UI, then gates release on Phase 7 durability work instead of treating persistence as cleanup. The dependency boundaries are also cleaner because reducer logic, selector logic, and summaries are split into dedicated modules rather than being piled into existing app files.
- **Verification strategy:** Strong overall. Each phase has focused tests, and the later phases rerun the domain and template-compatibility suites exactly where regressions are most likely. That is the right shape for a sprint with lots of cross-boundary failure modes.
- **Definition of Done completeness:** Best of the two. It captures the hard invariants that usually get lost during implementation: `null` vs empty, retained invalid selections, no silent conflict repair, no cross-set arithmetic, no parallel UI legality engine, and backward-compatible sharing/persistence boundaries.
- **Weaknesses:** Validation presentation is spread across too many phases. Issue grouping appears in the architecture, Phase 1 scaffolding, Phase 4/5 inline rendering, and then again in Phase 7, which blurs exit criteria and invites rework. The early commitment to tabs is probably correct, but it also means a layout reversal would ripple through Phases 2-6.
- **Risk analysis gaps:** The risk table is comprehensive, but it underplays two practical failure modes: accidental whole-loadout loss through the remove-equipment flow, and mixed-slice degraded mode where one equipment catalog fails while others still need to stay editable and explainable.
- **Missing edge cases:** The draft should explicitly verify confirmation behavior for remove-equipment, especially the difference between authored and materialized-empty loadouts. It also should add a scenario for persisted stale selections in a failed slice while unaffected slices continue to function.
- **Bottom line:** Safest draft to execute, but it needs a tighter story around validation-phase ownership and a few missing destructive-flow checks.

## GPT-55
Refs: [Overview](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT55-DRAFT.md:23), [UI Surface](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT55-DRAFT.md:163), [Implementation](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT55-DRAFT.md:234), [Definition of Done](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT55-DRAFT.md:691), [Risks](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT55-DRAFT.md:739), [Open Questions](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-015-GPT55-DRAFT.md:819)

- **Strengths:** The draft is readable, direct, and easier to execute mechanically. It is also better than GPT-56SOL at naming a few concrete migration chores, especially the explicit removal of the current `unsupported-equipment` rejection and the inclusion of `library-selectors` freshness coverage. Its `rg`-based boundary scans are a good addition to the verification plan.
- **Sequencing weakness:** The biggest problem is that the shell placement is still effectively unsettled. The architecture picks a disclosure below `SkillBar`, but the open questions still leave main-column vs left-column vs tabbed placement open. That means the layout choice is not truly resolved before Phases 3-6 start depending on it.
- **Dependency ordering weakness:** Too much is funneled through `editor-state.ts` and especially `editor-selectors.ts`. Without dedicated equipment state/selector modules, later phases are more likely to create a selector monolith and blur the line between app orchestration and equipment-specific logic.
- **Verification strategy weakness:** It is noticeably thinner. Phase 2 creates `EquipmentPanel` but does not test it directly. Phases 3 and 6 lean heavily on `editor-selectors.test.ts` as a proxy for component behavior. Phase 7 is the biggest gap: it does not rerun domain/template-compatibility tests at the point where persistence, hydration, and share/export regressions are most dangerous.
- **Definition of Done completeness:** Adequate, but materially looser. It does not encode several tricky invariants strongly enough: newly invalid vs retained invalid selections, indeterminate-option labeling, weapon/modifier catalog-set mismatch behavior, no cross-set modifier totals, explicit clear-hand vs clear-weapon distinction, and atomic restore behavior.
- **Risk analysis gaps:** It misses the maintainability risk of selector sprawl, the product risk of a coarse whole-equipment `ready|error` model, and the release risk of exposing the editor before durability gates are complete.
- **Missing edge cases:** Empty materialized loadouts should be explicitly excluded from omission warnings. The draft also under-specifies modifier retention when clearing a weapon, the distinction between clear and reset/remove, and mixed valid/invalid backup restore behavior.
- **Bottom line:** Solid baseline, but too much is left flexible in exactly the places that should be locked down before implementation starts.

## Comparison
- GPT-56SOL is stronger on sequencing, dependency isolation, release safety, and DoD precision.
- GPT-55 is stronger on concrete migration tasks, repo-boundary scan verification, and explicit library freshness coverage.
- GPT-56SOL treats partial catalog failure as a first-class design concern; GPT-55 trends toward a coarser whole-equipment readiness model.
- GPT-55 leaves more room for implementation drift because its composition model and some invariants remain soft defaults rather than phase-gated commitments.

## Merge Recommendations
1. Use GPT-56SOL as the base draft.
2. Keep GPT-56SOL’s tabbed workspace, per-slice catalog isolation, dedicated equipment state/selector modules, Phase 7 release gate, and categorized DoD.
3. Pull in GPT-55’s explicit `rg` verification scans, the concrete Phase 7 task to remove `unsupported-equipment` rejection, and its `library-selectors` freshness test coverage.
4. Tighten GPT-56SOL by assigning validation issue grouping to one phase boundary instead of spreading it across foundation, feature, and persistence phases.
5. Add explicit DoD and verification items for remove-equipment confirmation, mixed-slice degraded-mode behavior, and one full durability path from first edit through autosave/reload/backup/share.
6. Do not carry forward GPT-55’s unresolved shell-placement choice or its coarse `equipment` `ready|error` model. Those two points are the clearest sources of rework.