# Sprint 017 Draft Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-017-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-017-GPT55-DRAFT.md`

Intentionally not reviewed:

- `work/sprints/drafts/SPRINT-017-GPT54-DRAFT.md`

Both requested drafts were present.

## `SPRINT-017-GPT56SOL-DRAFT.md`

### Strengths

- The sequencing is the stronger of the two drafts. It starts with a real Phase 0 baseline and contract freeze, then moves from domain contracts to persistence/state, then to navigator UI, then to comparison, then to validation/transfer/backup, and closes with regression and documentation.
- Dependency ordering is mostly disciplined. The draft does not try to build comparison or transfer before the core active/inactive entry model, migration path, and dirty-state rules are defined and tested.
- The explicit phase gates are useful. They reduce the chance of burying state-loss bugs under later UI work.
- The verification strategy is the most rigorous of the two drafts. It calls for baseline regression coverage before schema changes, read-only migration assertions, sequence/invariant testing, targeted phase-level test commands, and final repo-wide verification.
- The Definition of Done is very complete. It covers architecture invariants, migration behavior, UI behavior, accessibility, data safety, compatibility with single-build flows, and closeout evidence.
- The draft resolves most planning decisions up front instead of punting them into implementation, which lowers rework risk.

### Weaknesses

- Phase 2 is still too large. It combines the document union, migration, storage, workspace actions, library selectors, library UI, and app composition. That is the highest-risk part of the sprint and would benefit from an internal split such as `2a core state/persistence` and `2b library/document integration`.
- Phase 5 is also overloaded. Aggregate validation, native set transfer, backup schema work, and share/template boundaries are all separate failure domains. Bundling them together weakens isolation if late issues appear.
- The draft treats the 24-entry cap as a default, but the execution plan does not require an early measurement pass before downstream UI, autosave, and summary/validation cost assumptions harden around that limit.
- `Copy Saved Build` and some library-aware actions appear before the draft fully narrows the mixed-record UX surface. That coupling is manageable, but it increases Phase 2 and Phase 3 coordination cost.

### Gaps In Risk Analysis

- The risk table does not explicitly call out valid-but-large build sets exhausting `localStorage` quota or causing slow pagehide/autosave writes even when the data is well formed.
- The draft does not explicitly call out ingress-path conflicts: startup share URLs, template import, set JSON import, restore apply, and library load all interact with dirty guards and selected-entry materialization.
- Library search/filter correctness is treated as implementation detail rather than risk. Any-entry matching is powerful, but it can also create confusing results if not verified carefully.

### Missing Edge Cases

- A near-limit but valid 24-entry set that passes parsing but fails autosave or pagehide flush because serialized size crosses storage quota.
- Dirty-guard behavior when a build set with unsaved changes receives a startup share URL, template import, restore apply, or set-transfer import.
- Comparison-target cleanup when the source entry is removed, replaced by template import, or loses selection during restore/import flows.
- Empty-set reload and restore behavior when `selectedEntryId` is `null` and share/template controls are visible elsewhere in the shell.
- Search and filter behavior when only unresolved raw labels match, or when multiple entries share identical labels.

### Definition Of Done Completeness

- This is the more complete Definition of Done and is close to execution-ready.
- The main additions I would make are explicit done criteria for storage-size/performance evidence at the chosen entry cap, plus a required verification matrix for every document ingress path that can replace or mutate the active draft.
- It would also help to require that the final sprint record preserves the Phase 0 decisions that were frozen, since those choices drive later semantics such as last-entry removal and transfer scope.

## `SPRINT-017-GPT55-DRAFT.md`

### Strengths

- The overall ordering is still sensible: baseline first, then contracts, then workspace/persistence, then navigator UI, then variants/comparison, then validation/export/backup, then docs and verification.
- Phase 0 correctly identifies that several decisions must be frozen before implementation starts. That is a good planning instinct.
- The draft is easier to scan and less over-specified, which gives execution some flexibility where details are genuinely unsettled.
- It keeps single-build compatibility visible throughout the plan instead of treating it as a late regression concern.
- The Definition of Done covers the major user-facing workflows and the main non-goals.

### Weaknesses

- Too many architecture decisions remain open. The open questions directly affect Phase 2 persistence shape, Phase 3 UI semantics, Phase 4 promote behavior, and Phase 5 validation/export behavior. That creates avoidable rework risk.
- The state model is weaker than the `GPT56SOL` draft. Mirroring the selected entry after every durable editor mutation is more fragile than the active-editor/inactive-snapshot model because more call sites can drift or forget to materialize before reads.
- Phase 2 is oversized and mixes migration, workspace state, local storage, backup/restore, library selectors, and record-aware UI work without an internal gate.
- Phase 5 lists `src/domain/validation.ts` and `src/domain/rule-engine.ts` even though the draft says this sprint should not introduce party-wide validation or materially change rule-engine behavior. That is a bad dependency signal and invites unnecessary late churn.
- Promote semantics are not locked down tightly enough. The draft uses "primary entry" language in one place, then leaves order and rename behavior open later. That ambiguity affects state, UI copy, and comparison expectations.
- The persistence strategy is framed as preferred versus fallback instead of a firm planning decision. That weakens implementation sequencing because migration, record shape, and parser behavior depend on it.

### Gaps In Risk Analysis

- The risk table does not explicitly call out rework caused by unresolved architectural choices.
- It does not explicitly call out valid-but-large build sets causing storage quota or render-cost regressions.
- Dirty-guard conflicts across share URL import, template import, restore apply, and set import are not treated as a dedicated risk area.
- The draft does not treat ambiguous promote/filter semantics as a UX consistency risk even though those choices affect several later phases.

### Missing Edge Cases

- Read-only migration should prove that loading schema-1 data does not dirty the document or rewrite storage on first read.
- Repeated edit-switch-save-pagehide sequences need stronger explicit coverage, especially when the selected entry is the only active editor.
- Empty-set behavior after delete-last-entry, load, restore, and import needs a single consistent rule, not a Phase 0 placeholder.
- Share and template actions for a no-selection or empty set need explicit verification, not just UI wording.
- Comparison stability under catalog reordering, unresolved raw labels, and partial equipment is not made explicit enough in the acceptance criteria.
- Search/filter behavior when only nested entry content matches, or when many entries share identical labels, should be called out directly.

### Definition Of Done Completeness

- The Definition of Done is solid at a high level, but it is materially thinner than `GPT56SOL`.
- It does not explicitly require read-only migration behavior, exactly-one-active-editor invariants, transient-state reset on selection change, comparison stability under catalog ordering changes, or a full dirty-guard matrix across all ingress paths.
- It also stops short of requiring proof that the chosen entry cap is safe for storage and summary/validation performance.

## Comparison

- `GPT56SOL` is the stronger execution draft. Its sequencing, dependency ordering, and verification gates are clearer and less likely to hide state-loss regressions.
- `GPT55` has the better instinct around forcing a decision checklist in Phase 0, but it leaves too many of those decisions unresolved by the time later phases depend on them.
- `GPT56SOL` is more explicit about migration safety, durability semantics, and active/inactive runtime invariants.
- `GPT55` is easier to read, but the readability comes partly from omitting acceptance detail that execution will still need.
- `GPT56SOL` has the better Definition of Done by a wide margin.
- Neither draft is strong enough yet on storage quota/performance proof for the chosen entry cap, and neither fully elevates ingress-path dirty-guard interactions into a first-class verification track.

## Merge Recommendations

- Use `GPT56SOL` as the base draft.
- Pull in `GPT55`'s explicit Phase 0 decision checklist style, but do not keep those items open once planning ends. The combined draft should leave execution with fixed answers for schema strategy, entry cap, last-entry removal semantics, promote semantics, filter semantics, and transfer scope.
- Split `GPT56SOL` Phase 2 into a core persistence/state phase and a follow-on library/document-integration phase. That will make dependency order cleaner and give migration/state-loss bugs a narrower blast radius.
- Split `GPT56SOL` Phase 5 into `validation/share boundaries` and `transfer/backup` if schedule pressure is a concern. Those areas are related, but they fail differently and deserve separate gates.
- Keep the `GPT56SOL` active-editor/inactive-snapshot model. It is safer than the eager mirroring model implied by `GPT55`.
- Add one explicit verification track for document ingress paths: library load, startup share URL, template import, backup restore, and native set import should all prove dirty-guard, selection, and active-entry materialization behavior.
- Add one explicit verification track for storage and performance: serialize a worst-case allowed set, prove autosave/pagehide behavior at the chosen cap, and validate summary/aggregate cost with the cap populated.
- Keep the `GPT56SOL` Definition of Done structure, then add missing acceptance items for entry-cap evidence and ingress-path replacement behavior.

## Recommended Combined Direction

- Base the sprint on the `GPT56SOL` architecture, sequencing, gates, and Definition of Done.
- Import `GPT55`'s emphasis on making Phase 0 decisions explicit and traceable.
- Reduce ambiguity before execution starts. The combined draft should not carry forward open questions that affect persistence shape, UX semantics, or validation/export scope.
