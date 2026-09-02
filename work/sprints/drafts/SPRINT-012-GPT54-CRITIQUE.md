# Sprint 012 Draft Critique

Reviewed:
- [SPRINT-012-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:1)
- [SPRINT-012-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:1)

Excluded by instruction:
- `work/sprints/drafts/SPRINT-012-GPT54-DRAFT.md` was not read.

## Overall

`GPT56SOL` is the stronger execution draft. Its phase ordering, source-authority matrix, slot/locality semantics, and promotion gates are sharper. `GPT55` has the safer identity policy and the better discovery-first posture around unknown source coverage. The best merged draft would use `GPT56SOL` as the base, then replace its identity lock with `GPT55`'s source-key-first crosswalk model.

## GPT56SOL Review

### Strengths

- The phase sequence is strong and mostly dependency-correct: source-shape checkpoint first, then source-plan/replay, then extraction, then semantics, then assembly/promotion, then closeout ([Phase 1](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:396), [Phase 2](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:457), [Phase 5](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:641), [Phase 6](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:724)).
- Its source-authority model is the best of the two drafts because it assigns authority by fact instead of treating "the wiki" as one undifferentiated source. The identity/inventory/page-identity/locality/icon split is concrete enough to drive review and QA ([Identity, Coverage, And Source Authority](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:160)).
- Its slot-scaling semantics are materially stronger. The draft cleanly separates fixed versus `by-slot` values, application scope, condition, combination, and mode, and it rejects both universal multipliers and record-level `stackable` shortcuts ([fixed decisions](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:54), [effect contract](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:277)).
- Its helper boundary is appropriately narrow. Resolving one insignia for one `ArmorSlot` is a better EPIC-11 boundary than multi-piece summary logic because it avoids drifting into legality, composition, or totals ([Pure Slot Resolver](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:331)).
- Its verification and promotion gates are the strongest version. Repeated fixed-clock generation, live `discover`, digest-confirmed `fetch`, two offline replays, first-baseline review, exact-path allowlisting, and explicit gate checks are all present and mutually reinforcing ([Phase 5 tasks](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:665), [Definition of Done](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:849), [current QA gate fields](/Users/calebmchenry/code/build-wars/scripts/data/build_wars_ingest/qa.py:60)).

### Weaknesses

- The overview hard-locks `InsigniaId` to verified template modifier IDs before the Phase 1 source-shape checkpoint has earned that assumption ([overview identity decision](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:38)). That weakens the otherwise good discovery-first sequencing.
- That identity choice is awkward against the current repo boundary, where `InsigniaId` and `TemplateEquipmentModifierId` are already distinct branded namespaces ([ids.ts](/Users/calebmchenry/code/build-wars/src/domain/ids.ts:16)). Even if both fields are stored, numerically aligning them in v1 still pushes the template table toward becoming the real public ID authority.
- The new shared `source_set_protocol.py` is a reasonable idea, but it is still cross-profile platform work inside a sprint that otherwise promises not to introduce new architecture ([shared protocol extraction](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:210)). The draft needs a clearer fallback if that refactor starts threatening EPIC-04/10 stability or schedule.
- The runtime catalog boundary is cleaner than the current shared catalog precedent, but the draft never explicitly tells implementers how to avoid inheriting the audit-heavy fields already present in `src/domain/catalog.ts` ([catalog precedent](/Users/calebmchenry/code/build-wars/src/domain/catalog.ts:191)). Without that note, the existing shape can pull implementation back toward `sources`, `snapshotManifestPaths`, `manualReviews`, and `generatedArtifactManifest`.

### Risk And Edge Gaps

- Same-page multi-variant identity is still not fully closed. The draft mentions shared-page ambiguity and candidate review, but it never elevates deterministic variant-key construction into a first-class DoD gate.
- The draft rightly includes `Effect stacking` in source authority, but it should say more explicitly what wins when that source is silent or conflicts with a detail page. The authority table helps, but the conflict policy is still softer than the rest of the draft.
- The 45-record / `290-324` and `358-367` baseline is handled better than in many plans, but the stop/go language is still concentrated around source-plan review rather than a dedicated promotion-era escalation path ([baseline assertion](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:50)).

### Definition Of Done Completeness

- This is the more complete DoD. It contains concrete slot-map exemplar outputs, replay gates, semantic-version rules, exact promoted paths, explicit blocked-promotion behavior, and first-baseline review contents ([Definition of Done](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md:849)).
- The main missing DoD item is an explicit gate for shared-page multi-variant identity and crosswalk uniqueness.
- The other missing DoD item is a scoped fallback if the shared source-protocol extraction proves too risky to complete inside this sprint without broader regression work.

## GPT55 Review

### Strengths

- The identity posture is better. `InsigniaId` stays schema-owned and source-key-backed by default, while `TemplateEquipmentModifierId` remains a verified crosswalk that may strengthen only if Phase 1 proves complete one-to-one coverage ([overview](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:43), [identity section](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:151), [Phase 1 lock](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:328)).
- That identity choice is also more consistent with the current repo, where `InsigniaId` is a generic catalog ID and `TemplateEquipmentModifierId` is a separate template namespace ([ids.ts](/Users/calebmchenry/code/build-wars/src/domain/ids.ts:16)).
- The discovery-first posture is cleaner. Source authority and identity are explicitly confirmed or amended before schema freeze rather than pre-decided in the overview ([Phase 1 tasks](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:315)).
- Its DoD structure is easier to scan than `GPT56SOL`. Breaking the gates into source/identity, contract/runtime, effect/slot-scaling, determinism/QA/promotion, and closeout makes review easier ([Definition of Done](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:755)).
- Promotion gates remain strong and align with the current QA model by explicitly requiring both `appConsumptionGate` and `publicReleaseGate` to be `pass` ([promotion gates](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:807), [qa.py](/Users/calebmchenry/code/build-wars/scripts/data/build_wars_ingest/qa.py:60)).

### Weaknesses

- The helper boundary is broader and softer than it should be. `summarizeInsigniaSlotEffects(catalog, equippedEntries)` introduces multi-entry composition, duplicate-source-key handling, and unresolved equipped-occurrence behavior that belong closer to EPIC-14 or EPIC-21 than EPIC-11 ([Helper Boundary](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:249)).
- The helper is also optional: the implementation phase only adds it "if tests need it" ([Phase 4](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:518)). That leaves the sprint without a guaranteed executable consumer boundary for slot resolution.
- Phase 1 file scope includes `src/domain/equipment.ts` and `src/domain/ids.ts` ([file list](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:294)) even though the existing repo already has `ArmorSlot`, `ArmorPiece.insigniaId`, `InsigniaId`, and `TemplateEquipmentModifierId` in place ([equipment.ts](/Users/calebmchenry/code/build-wars/src/domain/equipment.ts:11), [ids.ts](/Users/calebmchenry/code/build-wars/src/domain/ids.ts:18)). That is unnecessary churn and weakens dependency discipline.
- The source-authority section is weaker on locality and combination evidence. Unlike `GPT56SOL`, it does not explicitly name `Effect stacking` or an equivalent authority for cross-piece semantics, so one of the highest-risk modeling areas is left more implicit ([Source Authority](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:125)).
- The protocol-sharing decision is under-specified. Phase 2 says to preserve EPIC-04/10 compatibility if helpers are shared, otherwise keep EPIC-11 isolated ([Phase 2 gate](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:410)). That is pragmatic, but it is not a real stop/go rule, so the dependency story stays ambiguous.

### Risk And Edge Gaps

- Variant identity is still underspecified. "Canonical page identity plus variant identity" is directionally right, but the draft never defines what constitutes variant identity when one page covers multiple accepted records ([identity section](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:156)). Without that, `sourceKey` can become a hidden second authority.
- Slot-scaling verification is weaker than `GPT56SOL` because the DoD never locks concrete exemplar maps such as Survivor `5/15/5/10/5`, Radiant `1/3/1/2/1`, and Tormentor's `2/6/2/4/2`. It requires explicit maps, but it stops short of falsifiable examples.
- By mirroring the current rune helper style, the draft risks overfitting to an aggregation-oriented pattern before insignia semantics are stabilized. The existing rune helper is already multi-entry and summary-oriented ([rune-effects.ts](/Users/calebmchenry/code/build-wars/src/domain/rune-effects.ts:67)); that is not automatically the right boundary for insignias.

### Definition Of Done Completeness

- The DoD is strong, especially on determinism, promoted paths, QA coverage, and closeout synchronization ([Definition of Done](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md:755)).
- It is still less complete than `GPT56SOL` on exact slot-output assertions, forced helper presence, and explicit same-page/multi-variant identity handling.
- It also needs a scope gate saying the existing `src/domain/equipment.ts` and `src/domain/ids.ts` boundaries should be reused unless Phase 1 proves an actual contract gap.

## Comparison By Focus Area

- Sequencing: `GPT56SOL` has the better end-to-end phase structure, but `GPT55` has the better identity sequencing because it does not pre-commit before discovery.
- Dependency ordering: `GPT56SOL` is stronger on explicit EPIC-03 dependency verification and source-plan/replay flow. `GPT55` is stronger at not over-coupling public catalog identity to template-table completeness.
- Verification strategy: `GPT56SOL` is better. It is more concrete on repeated offline replay, exemplar slot outputs, first-baseline review contents, and regression safety around shared protocol behavior.
- Definition of Done completeness: `GPT56SOL` wins on completeness; `GPT55` wins on readability.
- Source authority: `GPT56SOL` is materially stronger because it assigns authority by fact instead of leaving locality and combination more implicit.
- Identity policy: `GPT55` is materially stronger because it preserves a schema-owned `InsigniaId` and treats template modifier IDs as evidence, not destiny.
- Slot-scaling semantics: `GPT56SOL` is stronger because it ties exact per-effect maps to locality and combination and backs them with concrete exemplar outputs.
- Promotion gates: both are strong, but `GPT56SOL` is tighter on first-promotion review content and blocked-promotion language.

## Merge Recommendations

1. Use `GPT56SOL` as the base draft for phase ordering, source-authority detail, slot/locality/combination semantics, verification depth, and promotion gates.
2. Replace `GPT56SOL`'s identity decision with `GPT55`'s default: schema-owned `InsigniaId` keyed by deterministic `sourceKey`, plus explicit verified `TemplateEquipmentModifierId` crosswalks, with a Phase 1 option to strengthen to one-to-one mapping only if the evidence is complete.
3. Keep `GPT56SOL`'s one-record/one-slot helper boundary, but borrow `GPT55` and the existing rune helper's unresolved-reason rigor. Do not adopt `GPT55`'s multi-entry summarizer as the primary EPIC-11 helper.
4. Keep `GPT56SOL`'s staged `discover` -> digest-confirmed `fetch` -> selected `offline` replay flow. If the shared `source_set_protocol.py` extraction threatens older-profile stability, make that a named Phase 2 fallback gate rather than an implicit "maybe isolate" option.
5. Use `GPT55`'s sectioned DoD structure, but fill it with `GPT56SOL`'s stronger concrete checks: exemplar slot maps, incomplete arithmetic as blocking, first-baseline review contents, exact promoted paths, and blocked promotion when live review inputs are unavailable.
6. Add an explicit merged requirement that EPIC-11's runtime catalog boundary is intentionally leaner than the current audit-heavy catalog precedent in [src/domain/catalog.ts](/Users/calebmchenry/code/build-wars/src/domain/catalog.ts:191). Otherwise implementers may preserve audit fields inside the runtime artifact by accident.
7. Add an explicit merged requirement that same-page multi-variant records must have deterministic variant-key construction, collision rules, and QA gates. Both drafts mention the edge case; neither closes it firmly enough.
8. Remove `GPT55`'s default file churn around [src/domain/equipment.ts](/Users/calebmchenry/code/build-wars/src/domain/equipment.ts:11) and [src/domain/ids.ts](/Users/calebmchenry/code/build-wars/src/domain/ids.ts:18) unless Phase 1 produces a concrete contract deficiency.
