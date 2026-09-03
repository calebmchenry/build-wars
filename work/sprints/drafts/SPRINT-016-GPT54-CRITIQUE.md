# Combined Critique

Reviewed `SPRINT-016-GPT56SOL-DRAFT.md` and `SPRINT-016-GPT55-DRAFT.md` only.

## Executive Assessment

`SPRINT-016-GPT56SOL-DRAFT.md` is the safer execution draft. It has the strongest dependency gates, the most complete verification plan, and a Definition of Done that is close to an implementation checklist. Its main weakness is over-serialization: too much work is forced into strict sequence, and several open questions remain unresolved even though later phases already assume answers.

`SPRINT-016-GPT55-DRAFT.md` is easier to read and easier to execute as a sprint artifact. Its phase structure is cleaner and its scope is more compact. Its weakness is contract looseness: several decisions that should be prerequisites to implementation are still open, which weakens sequencing and raises rework risk.

The best merged draft should use GPT56SOL as the acceptance and dependency baseline, then adopt GPT55's simpler phase framing and trim detail that does not change behavior or verification.

## `SPRINT-016-GPT56SOL-DRAFT.md`

### Strengths

- The sequencing is disciplined. Title metadata and resolution come before persistence, persistence comes before UI, UI comes before rendering integration, and validation cleanup lands only after the core title path exists.
- Dependency ordering is explicit instead of implied. The repeated "begin only after prior phase passes" gates make hidden coupling visible and reduce the chance of shipping partial semantics.
- Cross-phase invariants are strong. They protect the critical contract boundaries: empty override means implicit max, no fuzzy aliasing, no interpolation, no silent PvE-only behavior change, and no generated-data leakage outside the approved boundary.
- The verification strategy is the strongest of the two drafts. Each phase has focused suites, and the sprint ends with broader regression coverage, `npm run verify`, and `git diff --check`.
- The Definition of Done is unusually complete. It covers state semantics, migration, controls, rendering, validation, PvE-only preservation, sharing omissions, and closeout alignment.
- The risks are concrete and mostly tied to implementation choices rather than generic project-management concerns.

### Weaknesses

- The draft is too serialized. Once the title catalog and override contract are stable, some selector, component, and rendering work could proceed in parallel, but the plan hard-blocks most of that.
- Several open questions sit on the critical path even though earlier phases already assume answers. The biggest examples are the schema-version choice, unknown override retention, whether conflicted common-maximum overrides persist, and whether Sunspear is repaired in EPIC-04 or handled only at runtime.
- Validation lands late relative to UI composition. Since panel rows, inline issues, and user-facing copy depend on stable issue codes and locations, postponing validation contract finalization increases rework risk in the panel and selector phases.
- The final compatibility and closeout phase still carries product behavior that is not merely documentation: omission messaging, import replacement messaging, focus/layout regression checks, and some compatibility guarantees. Those are release semantics and should not be treated as late polish.
- The phase plan is thorough enough to become heavy. Verification overlap is substantial, which improves safety but may slow iteration unless the merged draft distinguishes must-pass per-phase gates from broader end-of-sprint regressions.

### Gaps In Risk Analysis

- The draft does not explicitly treat unresolved open questions as a sequencing risk. That matters because multiple phases depend on those answers.
- It does not call out the delivery risk created by strict serialization itself: late integration bugs may surface only after several phases have already accumulated.
- Performance is acknowledged qualitatively, but there is no explicit threshold or benchmark gate for browser-row resolution or selector recomputation.
- Accessibility is covered in tasks and DoD, but the risk table does not explicitly name focus retention, live-region noise, or mobile numeric-input quirks as failure modes.

### Missing Edge Cases

- A title row that loses relevance while its number input is focused, especially if the row remains available only in the all-title disclosure.
- A persisted override for a title whose alias group later has no editable common domain, including whether reset remains obvious and available.
- The conflicted-definition case where an explicit override equals the common maximum and therefore must remain distinguishable from reset-to-implicit behavior.
- Unknown mode plus relevant-title ordering changes after placement or removal of the last title-scaled skill.
- Direct-entry edge cases such as whitespace, leading plus signs, leading zeros, and mobile numeric-keyboard variants.

### Definition Of Done Completeness

The DoD is strong and close to executable. It is the better base for a merged sprint.

The main additions it still needs are:

- An explicit requirement that the listed open questions are resolved before implementation proceeds past the foundation phases.
- A small performance gate for title resolution in browser/list rendering.
- A manual smoke checklist for focus retention, live announcements, long-label wrapping, and pinned-tooltip updates, since not all of that is realistically guaranteed by unit tests alone.

## `SPRINT-016-GPT55-DRAFT.md`

### Strengths

- The phase sequence is easier to follow. Baseline and decisions, then state/discovery, then controls, then rendering integration, then validation cleanup, then docs/closeout is a sensible sprint shape.
- The draft surfaces the Sunspear ambiguity early and correctly refuses to hide catalog defects behind silent normalization.
- The scope is narrower and more pragmatic than GPT56SOL. It is easier to imagine executing without turning the sprint into a broad platform rewrite.
- Verification is still structured by phase, with concrete commands instead of generic "test this" language.
- The Definition of Done covers the main user-visible path well enough to guide implementation at a high level.

### Weaknesses

- Dependency ordering is less rigorous than it looks. Several foundational decisions remain open even though the implementation phases assume them: schema version, unknown override retention, behavior for `classification.title` skills with no progression keys, omission-warning timing, and allegiance warning semantics.
- Phase 1 is overloaded. It mixes title helper design, build schema changes, reducer actions, persistence behavior, selector helpers, and durability tests under one ticket, which makes it harder to tell what must stabilize before UI work starts.
- Validation cleanup comes after UI and display work, but the panel and selector layers need stable issue locations and code semantics to avoid churn.
- Share/import omission behavior is left mostly to Phase 5, even though local-only override semantics are introduced much earlier. That pushes an important product contract too close to closeout.
- Compared with GPT56SOL, the draft is less explicit about using one shared constructor/resolution path across app selectors and validation. That leaves more room for drift.

### Gaps In Risk Analysis

- The risk table is too small for the number of cross-cutting contract decisions in the plan.
- It does not explicitly cover selector/validation drift, even though both paths need identical alias and resolution behavior.
- It does not treat the schema-version decision as a front-loaded compatibility risk.
- It does not call out late omission/share behavior as a sequencing risk.
- It does not identify performance risk for repeated browser-row title resolution or selector recomputation.

### Missing Edge Cases

- Unknown-but-structurally-valid persisted override keys and how users discover and clear them.
- Alias groups with an empty common domain, not just mismatched declared domains.
- The case where the all-title view is the only place an authored override remains visible after skills change.
- Mixed schema-1 and schema-2 records in one backup/restore batch.
- Deterministic issue ordering when a skill simultaneously triggers title metadata, mode, and PvE-only issues.
- The conflicted-common-maximum override case, which is subtle but important for reset semantics.

### Definition Of Done Completeness

The DoD is good as a sprint summary, but it is not complete enough to be the final execution contract.

It should more explicitly require:

- Resolution of the open design questions before UI and persistence work harden.
- Deterministic validation ordering and stable issue-location behavior.
- Recovery behavior for stale or unknown persisted overrides.
- Stronger acceptance around focus/announcement behavior and irrelevant-retained overrides.
- A performance expectation for browser/list title resolution.
- More explicit share/import omission guarantees, since local-only title state is central to the feature.

## Comparison

GPT56SOL is stronger on dependency management, verification rigor, and Definition of Done completeness. It is the better draft if the priority is implementation safety.

GPT55 is stronger on readability and sprint shape. It is easier to execute and easier to keep mentally scoped, but it leaves too many semantic decisions unresolved for a feature that touches domain logic, persistence, validation, and sharing.

The key sequencing difference is this:

- GPT56SOL treats durability and contract correctness as prerequisites for broader UI and validation work.
- GPT55 treats them as part of the same flow, which is simpler but creates more rework risk if the core decisions shift.

The key verification difference is this:

- GPT56SOL behaves like an acceptance document with phase-specific gates plus end-to-end closeout.
- GPT55 behaves like a good implementation outline, but not quite a final release checklist.

The key DoD difference is this:

- GPT56SOL's DoD can almost be executed directly.
- GPT55's DoD still needs expansion before it can safely control a sprint of this risk level.

## Merge Recommendations

1. Use GPT56SOL's dependency ordering as the base: title catalog and resolution first, then build schema and migration, then controls, then rendering integration, then validation cleanup, then docs and closeout.

2. Add GPT55's simpler front-loaded phase structure by introducing an explicit decision gate before implementation starts. That gate should settle schema versioning, unknown override retention, conflicted-common-maximum persistence, `classification.title` without progression handling, and the intended treatment of the Sunspear conflict.

3. Move omission and import-replacement messaging earlier in the plan. They are part of the semantic contract of local-only title overrides, not just closeout documentation.

4. Pull validation contract work slightly earlier. The panel and selector phases should not harden before issue locations, codes, and ordering rules are stable.

5. Keep GPT56SOL's per-phase verification inventory, but trim redundant overlap and add one explicit manual smoke pass for focus retention, pinned tooltip updates, long labels, and mobile number-input behavior.

6. Use GPT56SOL's Definition of Done as the baseline, then add two items it still lacks: explicit resolution of open questions before implementation proceeds, and a modest performance gate for list/browser title resolution.

7. Preserve GPT55's more compact prose and files-summary style in the merged artifact. GPT56SOL's detail is valuable, but some of it can be compressed once the acceptance criteria are retained.

8. Keep both drafts' conservative stance on the Sunspear inconsistency, but choose one implementation answer early. The cleaner default is runtime alias-group handling in this sprint unless the merged plan explicitly adds an EPIC-04 catalog repair dependency.
