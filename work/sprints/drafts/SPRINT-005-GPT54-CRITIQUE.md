# SPRINT-005 Draft Critique

## Overall Recommendation

Use `SPRINT-005-GPT56SOL-DRAFT.md` as the base. It is materially stronger on phase sequencing, dependency locking, live/offline replay safety, determinism proof, and Definition of Done completeness. Pull a few clarity wins from `SPRINT-005-GPT55-DRAFT.md`, but do not use GPT-55 as the primary execution plan without tightening its gating.

## Review of `SPRINT-005-GPT56SOL-DRAFT.md`

### Strengths

- The sequencing is the strongest of the two drafts. It forces a source-shape checkpoint in Phase 1 before later phases harden extractors, and it keeps large live fetches behind a discover-only stage plus explicit digest confirmation in Phase 2.
- Dependency ordering is explicit instead of implicit. EPIC-03 digest and QA validation happens before joins, snapshot-set integrity is established before offline replay, and description review plus baseline review are bound to exact digests before promotion.
- The verification strategy is appropriately adversarial, not just happy-path. It checks shuffled input order, batch-boundary changes, concurrent completion order, exact replay, output caps, and `.gitignore` allowlisting.
- The Definition of Done is close to release-grade. It covers source-set accounting, phase ordering, caps, deterministic output, review binding, runtime boundary enforcement, and exact-path promotion.

### Weaknesses

- The draft locks many schema and policy decisions in Overview and Architecture before the Phase 1 source-shape checkpoint has actually run. That is defensible, but it increases the chance that Phase 1 becomes redesign rather than stabilization if rare template forms contradict the assumptions.
- Phase 1 carries too much blast radius at once: domain contract work, pipeline/profile orchestration changes, snapshot-set manifest work, and CLI protocol locking. That is a heavy regression surface against EPIC-02 and EPIC-03 before the first end-to-end EPIC-04 proof.
- Description review is correctly recognized as a gating item, but the first real corpus review still arrives late in Phase 5. If the review volume is larger than expected, most of the sprint is already spent before that constraint is measured.
- The plan introduces the synthetic golden catalog in Phase 3 before progression and split semantics are fully settled in Phase 4. That likely creates avoidable churn in the committed golden unless the draft explicitly marks which sections are provisional.

### Gaps in Risk Analysis

- The draft recognizes manual review risk, but it does not convert that into an early sizing checkpoint. A small sampled corpus review in Phase 2 or early Phase 3 would reduce the chance of a late blocker.
- It mentions ignored snapshot retention as a future replay limitation, but it does not turn retention or cleanup expectations into a concrete execution rule. That matters because promotion evidence depends on those local snapshots remaining available long enough to reproduce the reviewed run.

### Missing Edge Cases

- Interrupted live fetch recovery is handled as "partial cannot promote," but the draft does not say whether reruns must replace, reuse, or explicitly discard prior partial state.
- There is no explicit mid-sprint size checkpoint for catalog, provenance, and QA growth before Phase 5. The hard caps exist, but the first real proof is late.
- Discover/fetch protects source-set membership with digests, but the draft could say more clearly how per-page revision drift during a long fetch is surfaced and reviewed when the seed stays stable.

### Definition of Done Completeness

GPT-56 is the more complete DoD. It is already strong enough to serve as the final checklist with only minor additions:

- Add an explicit early review-volume checkpoint for description corpus and non-catalog dispositions.
- Add a concrete retention expectation for the reviewed snapshot set through promotion and baseline signoff.

## Review of `SPRINT-005-GPT55-DRAFT.md`

### Strengths

- The six-phase structure is readable and mostly sane. Contracts to source set to infoboxes to progressions to assembly/QA to docs is a reasonable dependency chain.
- The draft explains the description-policy boundary clearly and keeps runtime concerns separate from ingestion concerns.
- The verification sections are focused and plausible for each phase, and the DoD already covers many important release conditions such as deterministic offline regeneration, exact promoted paths, and no-network `verify`.

### Weaknesses

- The sequencing is too optimistic early. Phase 1 freezes contracts, caps, and source-policy defaults without an explicit source-shape checkpoint, which means Phase 3 and Phase 4 are more likely to discover shape problems after wire decisions are already public.
- Dependency ordering around live refresh and replay is underspecified. The draft talks about bounded live fetches and offline snapshot selection, but it does not fully define a discover, confirm digest, fetch, and complete snapshot-set replay chain.
- Phase 5 is overloaded. It is doing first-time proof of artifact assembly, QA completeness, baseline classification, deterministic replay, live refresh, offline replay, and promotion. Several of those should be partially proven earlier.
- The optional acquisition-metadata escape hatch is a scope leak. This sprint already has scale, provenance, review, and determinism pressure, so adding even "small" acquisition data weakens the boundary.

### Gaps in Risk Analysis

- The risk table is materially thinner than GPT-56's. It misses partial live runs that look complete, mixed or stale snapshot selection, review-volume becoming a late blocker, catalog/provenance/QA size growth, TypeScript/Python contract drift, and regression risk from ingestion-profile orchestration changes.
- The open question about whether `Guild Wars Wiki:Game integration/Skills/0` is the full authority is not just a question. It is a dependency-ordering issue that should be resolved before Phase 2 live planning.

### Missing Edge Cases

- Different accepted IDs resolving to the same canonical page.
- Wrong or stale source plans, or confirmation against the wrong digest.
- Partial snapshot sets, duplicate child manifests, extra manifests, and mixed-profile snapshot input.
- Batch reordering or concurrent completion changing canonical output or finding IDs.
- Unsupported transcluded or wrapper behavior that is not visible from raw infobox parsing alone.
- Late output-cap failures after provenance and QA sections are added.

### Definition of Done Completeness

GPT-55's DoD is solid but not final-sprint-ready on its own. It should inherit at least the following from GPT-56:

- explicit discover-only stage and digest-confirmed fetch
- complete snapshot-set manifest integrity requirements
- EPIC-03 manifest and QA verification before joins
- description review bound to exact description digest
- determinism proof against batch-order and concurrent-order variation
- hard caps for media-title count, catalog bytes, and QA bytes
- fuller provenance expectations for rights and use decisions where copied text is involved

## Comparison

### Sequencing and Dependency Ordering

- GPT-56 is better. It puts source-shape proof, live-fetch gating, and exact replay rules earlier, which reduces rework and prevents late surprises.
- GPT-55 has the right broad order but fewer internal phase gates, so too much uncertainty survives into Phases 3 through 5.

### Verification Strategy

- GPT-56 is materially stronger. It tests determinism under hostile conditions, not just nominal regeneration.
- GPT-55 verifies the happy path well enough, but it does not prove protection against mixed inputs, reordered results, or partial live runs to the same standard.

### Definition of Done Completeness

- GPT-56 is near-complete and can act as the release checklist.
- GPT-55 is a good scaffold, but its DoD still leaves room for ambiguous replay state, weaker dependency enforcement, and less explicit copied-text governance.

## Merge Recommendations

1. Use `SPRINT-005-GPT56SOL-DRAFT.md` as the base draft.
2. Keep GPT-56's Phase 1 source-shape checkpoint, Phase 2 discover/confirm/fetch protocol, snapshot-set manifest model, EPIC-03 dependency validation, and stronger determinism testing.
3. Import GPT-55's clearer explanatory framing where it improves readability, especially the three-part description-policy explanation and some of the simpler phase and task wording.
4. Remove GPT-55's conditional acquisition-metadata scope expansion unless it is broken out into a separate later ticket.
5. Add one explicit early checkpoint for description-review volume and disposition-review volume before the sprint reaches Phase 5.
6. Add one explicit mid-sprint end-to-end size checkpoint after the first synthetic catalog assembly so output-cap failures are found before final QA and promotion work.
7. Resolve source-set authority before finalizing the merged sprint. If `Skills/0` is not sufficient, the authoritative bounded expansion needs to be named up front rather than discovered mid-execution.
