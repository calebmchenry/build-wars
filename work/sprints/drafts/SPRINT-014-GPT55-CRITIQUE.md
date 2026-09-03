# Combined Critique: Sprint 014 Drafts

Both requested drafts were present and reviewed. `SPRINT-014-GPT55-DRAFT.md` was not reviewed.

## `SPRINT-014-GPT56SOL-DRAFT.md`

### Strengths

- Strongest architecture boundary: keeps EPIC-13 in `src/domain`, avoids React/app/generated JSON imports, and explicitly defers UI, persistence migration, share payloads, and raw template resolution.
- Good semantic distinction between `equipment: null`, canonical empty loadout, partial state, stale catalog IDs, and explicit unresolved placeholders.
- Correctly avoids duplicating derived facts such as armor profession, weapon handedness, modifier compatibility, and catalog-backed requirements into authored state.
- Validation design is thorough: optional catalog views, duplicate-safe ID handling, catalog-set mismatch checks, issue locations, truncation limits, and single `ValidationResult` integration are all called out.
- The DoD is unusually complete and testable, especially around null-equipment regressions, no mutation, issue classification, and app-boundary protection.

### Weaknesses And Architecture Assumptions

- The draft is large enough to become a validation-system sprint, not just an equipment shell sprint. The issue-code taxonomy, catalog version plumbing, truncation kinds, rank adjustments, weapon requirements, docs, scans, and closeout records create a broad implementation surface.
- Several choices are declared “binding” before alternatives are evaluated: global `RULE_ENGINE_VERSION` bump, retained `EquipmentTemplate` alias, arrays instead of keyed slot maps, unresolved placeholder shape, and full equipment validation integration now.
- The loadout still retains authored-root fields while validation “trusts caller-supplied catalog versions.” That creates a weak `catalogVersion` field whose intended consumer is unclear.
- Typing every `ArmorPiece` with `headgearAttribute` allows invalid authored states by design. That helps recovery, but it makes the public type less protective. A separate loose runtime input type versus stricter constructed domain type is not considered.
- Requirement evaluation assumes headgear/rune adjustments are enough to evaluate weapon requirements. Existing weapon modifier catalog types include attribute-rank effects, so the draft should explicitly state whether weapon-mod rank bonuses are excluded from requirement satisfaction and why.
- The hard-coded ticket-burn run path in Phase 5 is brittle for an executable sprint artifact.

### Gaps In Risk Analysis

- It misses the risk that a global rule-engine version bump causes unrelated snapshot and persistence churn even when `equipment: null` behavior is otherwise unchanged.
- It underplays implementation cost in adding equipment codes to `INCOMPLETE_CODES`, `UNRESOLVED_CODES`, `ValidationLocation`, `ValidationEntityKind`, catalog versions, and truncation precedence.
- It does not call out the risk that “minimal catalog views” become adapter work across four catalog namespaces plus profession/attribute joins.
- It does not evaluate the recovery versus type-safety tradeoff of allowing malformed public equipment objects.

### Missing Edge Cases

- Unsupported `schemaVersion` plus partially recognizable loadout content.
- Duplicate or malformed `candidateCatalogId` values across different catalog namespaces.
- Unknown build mode interacting with insignia, weapon, and modifier mode restrictions.
- Mandatory modifier slots with `cardinality: "one"` missing from an otherwise valid weapon.
- Weapon modifier attribute-rank effects affecting, or intentionally not affecting, requirement checks.
- Truncation interactions where duplicate slots or missing canonical slots occur only after the traversal cap.
- How labels on unresolved selections are bounded before future persistence/UI display.

### Definition Of Done Completeness

The DoD is mostly complete and defensible. Its main problem is size: it combines contract migration, armor/headgear mechanics, weapon occupancy, catalog-backed validation, rule-engine versioning, documentation, ticket status, ledger updates, and full verification. It should distinguish hard acceptance criteria from stretch/detail criteria so the sprint executor can avoid expanding into EPIC-14, EPIC-20, or EPIC-21 work.

## `SPRINT-014-GPT54-DRAFT.md`

### Strengths

- More concise and easier to execute than the GPT56SOL draft.
- The Phase 0 baseline/decision-freeze step is valuable and should be merged into the final plan.
- Correctly identifies the current persistence gap and forces an explicit decision instead of letting non-null equipment support remain ambiguous.
- Keeps raw equipment-template handling outside the semantic shell and names downstream ownership for EPIC-14, EPIC-17, EPIC-20, and EPIC-21.
- Uses the existing validation result model rather than proposing a second validation vocabulary.

### Weaknesses And Architecture Assumptions

- The biggest scope risk is app durability. The draft says local library and backup/restore should round-trip semantic equipment in this sprint, while also saying EPIC-14 owns UI/catalog integration. Current persistence explicitly rejects non-null equipment, so this is not a small compatibility fix; it requires a bounded runtime parser, migration policy, fixture updates, and app regression work.
- `armorRating: number | null` introduces exactly the kind of copied mechanical fact the sprint should avoid unless there is source-policy-backed ownership and a consumer.
- `HeadgearBonus` authors `amount: 1`, which can drift from the fixed rule. The amount should be a derived constant, not stored per build.
- `requirementAttributeId` is insufficient for weapon requirements because catalog requirements include both attribute and rank. This makes requirement validation under-specified.
- `EquipmentReference` uses a generic `reference: string | null`, which is too loose and could accidentally carry raw template IDs, labels, or unsupported external references.
- The validation boundary says missing catalog views should be skipped to avoid noise. That risks selected equipment appearing fully resolved when catalog facts are unavailable.

### Gaps In Risk Analysis

- The risk table is too thin for the proposed scope. It omits catalog duplicate IDs, weapon/mod catalog-set skew, rule-engine flag semantics, traversal caps, stale IDs, global version churn, headgear provenance, and derived-state drift.
- It does not analyze schema-version consequences of accepting non-null equipment into local library schema `1`.
- It does not address how dangerous keys, oversized arrays, invalid discriminants, and unsafe integers will be rejected for newly durable equipment state.
- It does not acknowledge the inconsistency between “validatedAgainst can stay unchanged” and catalog-backed equipment validation.

### Missing Edge Cases

- Stale known IDs versus explicit unresolved selections.
- Duplicate armor slots, duplicate weapon-set slots, unsupported slots, and non-canonical ordering as separate outcomes.
- Catalog-unavailable versus unknown ID versus duplicate catalog ID.
- Headgear on non-head armor rows, wrong-profession headgear attributes, and unknown attributes.
- Off-hand-only partial sets, two-handed plus off-hand conflicts, wrong-hand placement, and mode-restricted weapons.
- Modifiers without weapons, duplicate occupied slots, indeterminate compatibility, and mismatched weapon/mod catalog sets.
- Known unmet weapon requirements as advisory warnings distinct from unresolved requirements.
- Validation caps, no-mutation guarantees, and issue ordering after existing skill rules.

### Definition Of Done Completeness

The DoD is directionally useful but not complete enough for implementation. It lacks precise issue classification, complete/resolved flag behavior, catalog-version evidence, duplicate-safe catalog handling, runtime bounds, no-mutation checks, source scans, and a clear persistence schema decision. It is also internally inconsistent: it claims durability is in scope but leaves schema migration as an open question.

## Comparison

GPT56SOL is the better architectural base. It is more consistent with the current repo boundary where domain can define semantic equipment while app persistence still accepts only `equipment: null` until a later migration. Its main flaw is over-specification and sprint size.

GPT54 is useful as a simplification pass, especially its Phase 0 baseline idea, but it weakens important semantics. Its persistence expansion, authored `armorRating`, authored headgear amount, vague unresolved references, and silent missing-catalog behavior would make the shell less reliable.

The drafts disagree most sharply on persistence. GPT56SOL defers non-null local persistence to EPIC-14; GPT54 makes it part of Sprint 014. That is not a small merge detail. It changes ownership, test scope, schema validation, and closeout risk.

## Merge Recommendations

- Use `SPRINT-014-GPT56SOL-DRAFT.md` as the base plan.
- Import GPT54’s **Phase 0: Baseline and decision freeze**, especially baseline tests for `equipment: null`, validation ordering, persistence rejection/compatibility, and share-url exclusion.
- Keep GPT56SOL’s null-only persistence boundary for this sprint unless the team explicitly reassigns EPIC-14 durability work into Sprint 014. If durability is required now, split it into a separate ticket with schema parser bounds, migration policy, and backup/restore tests.
- Drop GPT54’s authored `armorRating`, authored headgear `amount`, and attribute-only weapon requirement fallback.
- Keep GPT56SOL’s discriminated semantic selection shape, but add a short alternatives note explaining why unresolved placeholders are stored in authored state instead of represented only as validation issues.
- Add an explicit decision note for arrays versus keyed slot maps. Arrays are reasonable for preserving malformed order and duplicates, but the tradeoff should be documented.
- Reconsider whether `RULE_ENGINE_VERSION` must globally advance to `rule-engine:v2`; if it does, call out expected snapshot churn and add focused regression coverage.
- Make missing equipment catalog views produce bounded unresolved warnings when selected equipment depends on them; do not silently skip catalog-backed checks.
- Add edge-case coverage for weapon modifier attribute-rank effects and whether they can satisfy weapon requirements.
- Trim the final sprint DoD into mandatory acceptance criteria plus documentation/closeout tasks so the executor has a clear stop line.