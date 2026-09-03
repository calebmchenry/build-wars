# Combined Critique

## Overall
`SPRINT-013-GPT56SOL-DRAFT.md` is the stronger execution backbone. It is better on dependency ordering, release-set semantics, and promotion rigor. `SPRINT-013-GPT55-DRAFT.md` is easier to implement incrementally and has a cleaner weapon/modifier module split, but it leaves important cross-artifact and verification gaps.

## `SPRINT-013-GPT56SOL-DRAFT.md`

### Strengths
- Sequencing is mostly correct: it settles source authority, ID policy, artifact split, and multi-artifact pipeline support before extractor work.
- Dependency ordering is explicit and defensible. EPIC-03, EPIC-05, and prior ingestion/profile work are treated as real prerequisites, not informal assumptions.
- Verification is the strongest of the two drafts. Fixed-clock double generation, selected offline replay, exact-path checks, and shared release-set gating are all good.
- Definition of Done is comprehensive and correctly treats the two catalogs as one promoted release set.

### Weaknesses
- Phase 1 is overloaded. It combines source-shape review, schema freeze, profile registration, CLI/pipeline changes, and multi-artifact support. That is dependency-correct, but it is a large stall point.
- The draft has a contract inconsistency around template lookup outcomes. The architecture defines `known | ambiguous | dispositioned | unknown`, but Phase 1 also requires `unsupported` as a separate outcome. That needs to be reconciled before implementation.
- Promotion gates are only partly testable because “reviewed live discovery” and “first-baseline review” remain qualitative. They need explicit acceptance thresholds.
- The code layout is less clean than the artifact model. Separate catalogs are claimed, but several implementation files stay consolidated, which weakens isolation for future modifier-only changes.

### Gaps In Risk Analysis
- It does not explicitly call out counterpart-artifact skew as a consumer risk, even though it introduces shared release-set semantics.
- It underplays crosswalk migration risk across releases, especially active-to-historical remaps.
- It does not mention registry-file merge pressure if both weapon and modifier namespaces live in one reviewed identity surface.

### Missing Edge Cases
- Counterpart mismatch: weapon catalog and modifier catalog individually valid, but from different release sets.
- Crosswalk reassignment between releases: one raw template ID moving to a different semantic record.
- Accepted modifier with note-only/unknown effects plus unresolved applicability, where compatibility must stay indeterminate.
- Mode-specific multi-fact records, especially when a semantic weapon or modifier has different PvP/PvE mappings.

### Definition Of Done Completeness
- High. It is the more complete draft.
- The main issue is not missing coverage; it is over-specification and a few subjective review bullets that should become measurable checks.

## `SPRINT-013-GPT55-DRAFT.md`

### Strengths
- The module decomposition is cleaner. Separate `weapon_*` and `weapon_mod_*` files are easier to own and safer to evolve.
- The phase structure is easier to follow and likely easier to execute ticket-by-ticket.
- It is conservative in the right places: raw template fidelity, metadata-only media, and note-only/unknown effect handling.

### Weaknesses
- It never fully commits to a true release-set model. Two artifacts are produced, but there is no equally strong shared `catalogSetVersion`/counterpart consistency contract.
- Source planning is ambiguous. The architecture implies one bounded plan/review cycle, but Phase 2 and Phase 3 read like separate planning passes.
- Phase 4 verification is underpowered for the work described. It normalizes modifier semantics but does not list matching Python modifier-semantic/catalog tests in the gate.
- There is a naming inconsistency around the resolution adapter: `equipment-catalog-resolution.ts` in architecture vs `equipment-template-resolution.ts` in implementation.
- Promotion gates are weaker and less testable because cross-artifact union gating is not first-class.

### Gaps In Risk Analysis
- No explicit risk for partial promotion or stale paired-artifact loading.
- No explicit risk that split weapon/modifier planning causes unreconciled candidate accounting.
- No explicit risk that manual baseline review remains subjective and blocks promotion late.

### Missing Edge Cases
- Shield/focus `not-applicable` damage versus simply missing damage.
- Historical plus ambiguous template-ID mappings across modes.
- Cross-artifact compatibility findings that should block both outputs, not only the modifier side.
- Regeneration of one catalog without regenerating its counterpart.

### Definition Of Done Completeness
- Medium-high. It covers most domain and ingestion concerns.
- It is weaker than `GPT56SOL` on paired-artifact invariants, counterpart consistency, and explicit verification completeness.

## Comparison And Merge Recommendations
1. Use `GPT56SOL` as the base plan. Its sequencing, dependency handling, and promotion model are materially stronger.
2. Pull in `GPT55`’s file decomposition. Keep separate modifier-specific modules, with thin shared utilities rather than one large combined implementation surface.
3. Keep `GPT56SOL`’s shared release-set semantics: shared set version, counterpart digests, union-based QA blocking, and all-six-files promotion together.
4. Rewrite Phases 2 and 3 so there is one reviewed source plan with weapon and modifier sections. Extraction phases should consume that plan, not recreate planning logic.
5. Reconcile lookup outcomes immediately. Either make `unsupported` a reason within `dispositioned`, or carry five explicit outcomes everywhere.
6. Convert manual promotion reviews into checklist gates with objective thresholds: zero unexplained selected PvP rows, zero counterpart mismatches, no unresolved core families, no blocking copied-text or replay findings.
7. Add missing tests and fixtures from both drafts: counterpart skew, crosswalk migration, shield/focus `not-applicable` damage, mode-split mappings, unresolved applicability, and exact-source regression after resolution.

## Bottom Line
`GPT56SOL` is closer to a promotable sprint. `GPT55` contributes the better implementation shape. The best merged draft is `GPT56SOL`’s execution and gate model with `GPT55`’s cleaner module boundaries and a tighter, fully consistent verification matrix.