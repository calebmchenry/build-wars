---
id: SPRINT-007
title: Game Rule Engine
status: draft
source_target: BACKLOG
source_epic: EPIC-06
source_epic_path: work/tickets/06-game-rule-engine/EPIC.md
tickets:
  - BW-0601
  - BW-0602
  - BW-0603
  - BW-0604
  - BW-0605
  - BW-0606
  - BW-0607
created: 2026-09-02
updated: 2026-09-02
---

# Sprint 007: Game Rule Engine

## Overview

This sprint turns `EPIC-06 Game Rule Engine` into a framework-neutral domain service for validating
authored Guild Wars builds and calculating effective attribute ranks. It builds on the promoted
EPIC-03 profession/attribute catalog, the promoted EPIC-04 skill catalog, and the EPIC-05 template
compatibility boundary without importing generated audit artifacts, source snapshots, wiki APIs,
template codec adapters, React, browser APIs, or storage.

The core output is a pure validation API in `src/domain` that accepts a `Build`, caller-supplied
`ProfessionAttributeCatalog` and `SkillCatalog` slices, and optional rule configuration. Normal
invalid, incomplete, unresolved, or stale-catalog authored states return deterministic
`ValidationIssue` records instead of throwing. Thrown exceptions remain reserved for programmer
errors inside tests or impossible internal invariants, not user-authored build legality.

This is not a UI sprint. It does not build editor controls, paste dialogs, local storage, sharing,
skill-picker behavior, attribution UI, guide content, source ingestion, equipment catalogs, title
track catalogs, allegiance modeling, hero or party validation, PvX import, runtime wiki access, or
template decoding. Template compatibility may feed resolved IDs to callers, but EPIC-06 does not
import `src/template-compatibility` and does not reinterpret loss-aware template documents as
validated builds.

The sprint resolves the main ambiguity with conservative MVP defaults:

- Known impossible authored states are `error`.
- Incomplete editor states and unknown catalog references are `warning` unless a rule explicitly
  marks them informational.
- Later equipment, title, allegiance, rune, insignia, armor, weapon, modifier, hero, party, and UI
  rules are represented as typed extension inputs or deferred-rule issues, not hard-coded guesses.
- Attribute budget validation defaults to the EPIC-03 level-20 PvE maximum-applicable quest budget
  of 200 points unless callers provide a different supported budget policy.
- Skill-bar PvE-only validation uses a configurable default maximum of 3 PvE-only skills and treats
  title/allegiance ownership as deferred to EPIC-15.

## Use Cases

1. **Validate a complete legal build**: Given selected primary and secondary professions, legal
   attributes, an eight-slot skill bar, and catalog records, return `ok: true`, no blocking issues,
   and deterministic effective-rank data.
2. **Guide an in-progress editor state**: Allow null professions, empty skill slots, partial
   attribute rows, and incomplete skill bars to produce structured warnings or info without crashing
   or coercing user input.
3. **Highlight profession problems**: Report missing primary profession, unknown profession IDs,
   identical primary/secondary selections, and skills or attributes that cannot be used by the
   selected professions.
4. **Validate attribute spending**: Detect duplicate attribute rows, invalid purchased ranks,
   primary-only attributes on secondary professions, wrong-profession attributes, unresolved
   attribute IDs, unsupported budget rows, and total point overspend.
5. **Validate skill-bar composition**: Enforce exactly eight skill slots, preserve empty slots,
   report duplicate skill IDs, enforce one elite maximum, count PvE-only skills, and attach issues
   to stable skill slot paths.
6. **Validate skill eligibility and mode**: Distinguish legal primary/secondary skills, common or
   no-attribute skills, wrong-profession skills, unsupported/non-player catalog records, PvE/PvP
   mode restrictions, split-skill ambiguity, and title/allegiance deferrals.
7. **Preserve unresolved imports**: Report unknown or dispositioned authored IDs as unresolved
   references without deleting them, replacing them, or depending on template decode internals.
8. **Calculate effective attribute ranks**: Return base rank, optional manual override, optional
   future modifier contributions, and final rank for allocated, unallocated, missing, and unresolved
   attributes.
9. **Support future rule groups**: Allow equipment, title-track, allegiance, rune, insignia, armor,
   weapon, modifier, hero, party, and advanced analysis checks to attach issues later without
   changing the MVP result contract.
10. **Test domain behavior offline**: Run all rule fixtures with small committed test data and no
    live network access, generated source snapshots, or runtime imports of QA/manifests.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Domain contracts | Validation severities, issue codes, issue paths, related entities, source-rule metadata, result summaries, rule options, validation context types, and effective-rank result types. | UI component props, React state, DOM events, browser storage, network fetches, template codec dependency types, generated manifest types as runtime inputs, or data-ingestion models. |
| Validation context | Deterministic lookup maps over caller-supplied `Build`, `ProfessionAttributeCatalog`, and `SkillCatalog`; selected profession facts; catalog version facts; unresolved authored references; rule options. | Importing promoted JSON directly, reading source snapshots, resolving template documents, mutating builds, caching global catalog state, or deriving UI presentation. |
| Profession and attributes | Primary/secondary profession legality, duplicate allocations, purchased-rank validation, point-cost totals, primary-only restrictions, wrong-profession attributes, and unresolved attributes. | Campaign unlock state, character quest log state, PvP-only budget truth beyond available catalog facts, equipment/rune/headgear bonuses, consumables, blessings, or temporary effects as legality rules. |
| Skill-bar composition | Runtime shape check, empty slots, duplicate authored skill IDs, elite maximum, PvE-only count maximum, unresolved skill IDs, deterministic slot metadata. | Skill-picker filtering, skill ordering recommendations, team builds, hero bars, consumable slots, or template import/export fidelity. |
| Skill eligibility and mode | Profession/attribute eligibility, common/special/no-attribute allowances, unsupported/non-player flags, PvE-only/PvP-only restrictions, split-mode resolution, title-rank deferral issues. | Title identity, title-rank ownership, allegiance conflicts, reputation rank math, PvX/community legality, or guide recommendations. |
| Effective ranks | Authored base rank, manual preview override, future modifier contribution shape, missing/unresolved attribute handling, deterministic calculation output. | Full equipment catalogs, rune stacking rules, headgear selection UI, title-rank catalogs, temporary effects, or skill-description rendering. |
| Tests and fixtures | Small domain-only fixtures for valid, partial, invalid, unresolved, mode, and effective-rank cases. | Live wiki calls, full generated catalogs as mandatory fixtures, source-derived snapshots, browser tests, or UI snapshots. |
| Planning closeout | Sprint file, ticket status updates, ledger update, optional compendium note, and ticket-burn result JSON during the final planning/execution pass. | Commits, unrelated refactors, downstream UI features, or broad data refreshes. |

### Layering

```text
caller supplies Build + catalog slices + options
        |
src/domain/validation.ts
  public issue/result/rule option contracts
        |
src/domain/validation-context.ts
  pure lookup context over Build, ProfessionAttributeCatalog, SkillCatalog
        |
src/domain/build-validation.ts
  validateBuild orchestration and MVP rule groups
        |
src/domain/effective-attribute-rank.ts
  reusable rank calculation used by validation and future tooltips
```

Allowed imports inside these files are existing `src/domain` modules only. `src/domain` must not
import `src/template-compatibility`, `src/app`, React, DOM/browser APIs, browser storage, network
clients, `scripts/data`, `data/generated`, `data/qa`, `data/source-snapshots`, generated manifests,
or wiki APIs.

Template compatibility remains a sibling capability:

```text
src/template-compatibility
  decodes and preserves raw template documents
  resolves template IDs to catalog lookup outcomes
  does not decide game legality

src/domain game rule engine
  validates authored Build IDs and caller-provided unresolved reference facts
  does not decode templates or preserve raw template source envelopes
```

### Public Contract Shape

The implementation should add a small JSON-compatible contract surface:

```ts
export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly code: ValidationIssueCode;
  readonly message: string;
  readonly path: readonly ValidationPathSegment[];
  readonly slot: ValidationSlotRef | null;
  readonly related: readonly ValidationRelatedEntity[];
  readonly sourceRule: ValidationSourceRule;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly summary: ValidationSummary;
  readonly calculations: BuildValidationCalculations;
}
```

The exact TypeScript names may change during implementation, but the public shape must preserve
these semantics:

- `severity` is stable and fixture-asserted.
- `code` is a typed stable identifier, not display copy.
- `message` is bounded, domain-owned fallback copy suitable for tests and temporary UI use.
- `path` is an array of string or number segments such as `["attributes", 2, "rank"]`.
- `slot` is null or a typed selector such as skill slot index, armor slot, or weapon-set slot.
- `related` carries typed profession, attribute, skill, catalog, rule, or equipment references.
- `sourceRule` identifies the rule group and rule ID that produced the issue.
- `ok` is true only when there are no `error` issues.
- `summary` contains issue counts by severity and whether export should be blocked.
- `calculations` carries deterministic derived values that are safe to reuse by callers.

Initial issue-code groups should be explicit enough for UI and tests:

- Profession: `PROFESSION_PRIMARY_MISSING`, `PROFESSION_PRIMARY_UNRESOLVED`,
  `PROFESSION_SECONDARY_UNRESOLVED`, `PROFESSION_DUPLICATE_PAIR`.
- Attributes: `ATTRIBUTE_ID_UNRESOLVED`, `ATTRIBUTE_DUPLICATE_ALLOCATION`,
  `ATTRIBUTE_RANK_INVALID`, `ATTRIBUTE_RANK_UNSUPPORTED`, `ATTRIBUTE_WRONG_PROFESSION`,
  `ATTRIBUTE_PRIMARY_ONLY_UNAVAILABLE`, `ATTRIBUTE_BUDGET_UNSUPPORTED`,
  `ATTRIBUTE_POINTS_OVERSPENT`.
- Skill bar: `SKILL_BAR_INVALID_SHAPE`, `SKILL_SLOT_EMPTY`, `SKILL_ID_UNRESOLVED`,
  `SKILL_ID_DISPOSITIONED`, `SKILL_DUPLICATE`, `SKILL_ELITE_LIMIT_EXCEEDED`,
  `SKILL_PVE_ONLY_LIMIT_EXCEEDED`.
- Skill eligibility and mode: `SKILL_WRONG_PROFESSION`, `SKILL_ATTRIBUTE_UNAVAILABLE`,
  `SKILL_MODE_UNAVAILABLE`, `SKILL_MODE_AMBIGUOUS`, `SKILL_MODE_VARIANT_MISSING`,
  `SKILL_UNSUPPORTED`, `SKILL_NON_PLAYER`, `SKILL_TITLE_RULE_DEFERRED`,
  `SKILL_ALLEGIANCE_RULE_DEFERRED`.
- Effective ranks and extension points: `EFFECTIVE_RANK_ATTRIBUTE_UNRESOLVED`,
  `EFFECTIVE_RANK_OVERRIDE_INVALID`, `RULE_EXTENSION_DEFERRED`.

Issue ordering must be deterministic. The default order is rule-group order, then authored order
within the build, then slot index where applicable, then issue code. Adding future rule groups should
append new groups rather than reshuffling MVP issue order.

### Validation Options

The API should keep defaults deterministic and make policy choices visible:

- `profile`: `"editing"` by default; a `"complete"` profile may raise incomplete-state severities.
- `attributeBudget`: default EPIC-03 level-20 PvE maximum-applicable budget, or an explicit level,
  quest-bonus, or point-total policy supplied by the caller.
- `maxPveOnlySkills`: default `3`.
- `mode`: default `build.mode`, with `"unknown"` producing ambiguity issues instead of guessing.
- `unresolvedReferenceSeverity`: default `warning`.
- `deferredRuleSeverity`: default `info`.
- `effectiveRank`: optional manual overrides and future modifier contributions.
- `extensionRules`: optional pure validators that consume the context and append issues after MVP
  rules.

Options must not include callbacks that read files, fetch network data, touch browser APIs, or mutate
the supplied build/catalog objects.

### Validation Context

`createBuildValidationContext` should assemble all reusable derived facts once:

- Original `Build` reference, without mutation.
- Profession map by `ProfessionId`.
- Attribute map by `AttributeId`.
- Skill map by `SkillId`.
- Skill mode split lookup through existing `resolveSkillModeVariant` semantics.
- Selected primary and secondary profession lookup outcomes.
- Selected profession ID set for eligibility checks.
- Attribute allocation records with original index, duplicate group metadata, catalog record or
  unresolved outcome, purchased-rank cost, and normalized rank validity.
- Skill slot records with original index, authored ID, empty/unresolved/known/dispositioned status,
  selected mode variant outcome, and catalog classification facts when available.
- Catalog versions and section digests needed for diagnostics.
- Deferred rule flags for title, allegiance, and equipment-owned checks.

The context builder should be defensive against runtime JSON that violates TypeScript tuple shape,
but it should return issues instead of throwing for normal invalid authored input.

### MVP Rule Semantics

Profession rules:

- Missing primary profession is a warning in the editing profile.
- Missing secondary profession is allowed by default; callers can opt into complete-profile warning.
- Identical non-null primary and secondary professions are an error.
- Unknown primary or secondary IDs are unresolved-reference warnings.
- Secondary skills are illegal when no matching secondary profession is selected.

Attribute rules:

- Duplicate allocation rows for the same authored attribute ID are errors.
- Ranks must be finite non-negative integers present in `purchasedRankCosts`.
- Point spending sums only rows with known rank costs; unsupported rows produce their own issues and
  are excluded from the overspend total.
- The default budget uses `attributePointRules.defaultPveLevel20.totalWithMaximumQuestBonus` when
  available, falling back to `attributeBudgetForLevel(catalog, 20, "maximum-applicable")`.
- Attributes must belong to the selected primary or secondary profession.
- Primary-only attributes are legal only for the selected primary profession.
- Unknown attributes produce unresolved-reference warnings and do not participate in profession or
  point-budget enforcement.

Skill-bar composition rules:

- A non-array skill bar or a skill bar with any length other than 8 is an error, even though the
  TypeScript `SkillBar` type is a tuple.
- Null skill slots are preserved and produce incomplete-slot issues according to the selected
  profile.
- Duplicate known skill IDs are errors; duplicate unresolved authored IDs are warnings.
- More than one known elite skill is an error.
- More than `maxPveOnlySkills` known PvE-only skills is an error in PvE mode.
- PvE-only skills in PvP mode are also mode errors; the count limit is not used to downgrade that.

Skill eligibility and mode rules:

- Known unsupported or non-player catalog records selected in a player build are errors.
- Skills with a non-null `professionId` must match selected primary or secondary profession.
- Common, special, title, no-attribute, or null-profession skills are allowed only when catalog
  classification supports that interpretation.
- A skill's `attributeId` does not require a nonzero allocation, but the attribute must be available
  to the selected professions unless catalog metadata marks the skill as no-attribute/common/special.
- `classification.modeAvailability`, `pveOnly`, and `pvpOnly` drive hard mode restrictions when
  `Build.mode` is `pve` or `pvp`.
- Split skills use `resolveSkillModeVariant`; missing or ambiguous variants produce deterministic
  issues and do not guess a counterpart.
- Title-rank and allegiance-specific rules produce deferred issues only when catalog facts indicate
  the need; EPIC-15 owns real enforcement.

Effective-rank rules:

- Base rank is the authored allocation rank for a known attribute, or `0` when the attribute is
  known but unallocated.
- Manual override is an optional preview input and must be finite, integer, and non-negative.
- Manual override should replace the displayed/calculated rank while preserving contribution detail,
  not mutate `Build.attributes`.
- Future modifier contributions should use typed source refs such as `headgear`, `rune`, `weapon`,
  `title`, `temporary-effect`, and `manual`.
- Unknown attributes return an unresolved outcome with no final rank and a structured issue when
  requested by validation.

## Implementation

### Phase 1: BW-0601 Validation Result Contracts (~15% of effort)

**Files:**

- `src/domain/validation.ts`
- `src/domain/index.ts`
- `test/domain/rule-engine-contracts.test.ts`
- `work/tickets/06-game-rule-engine/BW-0601-validation-result-contracts.md`

**Tasks:**

- [ ] Add `ValidationSeverity`, `ValidationIssueCode`, `ValidationPathSegment`,
      `ValidationSlotRef`, `ValidationRelatedEntity`, `ValidationSourceRule`,
      `ValidationIssue`, `ValidationSummary`, and `ValidationResult` domain types.
- [ ] Document severity policy in code comments or exported JSDoc: `error` blocks validity/export,
      `warning` surfaces incomplete or unresolved states, and `info` communicates deferred or
      advisory facts.
- [ ] Add small pure helpers for summarizing issues and deriving `ok` from `error` count.
- [ ] Define the initial issue-code union by rule group so tests do not assert display messages as
      the primary API.
- [ ] Export contracts from `src/domain/index.ts`.
- [ ] Add contract tests for JSON-compatible issue shape, deterministic summaries, null slot
      handling, related entities, and stable issue-code typing.
- [ ] Mark BW-0601 complete only after focused tests and `npm run verify` pass.

**Verification:**

- `npm run test:run -- test/domain/rule-engine-contracts.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Public validation result contracts are stable enough for all later rule phases and
future UI highlighting without importing UI code.

### Phase 2: BW-0602 Build Catalog Validation Context (~15% of effort)

**Files:**

- `src/domain/validation-context.ts`
- `src/domain/validation.ts`
- `src/domain/index.ts`
- `test/domain/rule-engine-context.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0602-build-catalog-validation-context.md`

**Tasks:**

- [ ] Add `BuildValidationInput`, `BuildValidationOptions`, `BuildValidationContext`, attribute row
      context, skill slot context, and unresolved-reference context types.
- [ ] Build lookup maps from caller-supplied catalog objects without importing runtime JSON files.
- [ ] Preserve original authored IDs and indices for every profession, attribute, and skill lookup.
- [ ] Track selected primary/secondary outcomes and a selected profession set.
- [ ] Track skill slot outcomes for empty, known, unresolved, and dispositioned IDs.
- [ ] Add defensive shape checks for runtime-invalid skill bars while keeping the public API typed
      around `Build`.
- [ ] Add small fixtures that mimic EPIC-03 and EPIC-04 catalog shapes without requiring full
      generated artifacts.
- [ ] Add tests for known lookup, unresolved profession/attribute/skill IDs, dispositioned skills,
      null professions, empty slots, non-eight slot runtime input, and catalog version metadata.
- [ ] Mark BW-0602 complete only after focused tests and `npm run verify` pass.

**Verification:**

- `npm run test:run -- test/domain/rule-engine-context.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Rule functions can consume one context object and never repeat ad hoc catalog-map or
unresolved-reference logic.

### Phase 3: BW-0603 Profession And Attribute Rules (~15% of effort)

**Files:**

- `src/domain/build-validation.ts`
- `src/domain/validation-context.ts`
- `src/domain/effective-attribute-rank.ts`
- `src/domain/index.ts`
- `test/domain/profession-attribute-rules.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0603-profession-and-attribute-rules.md`

**Tasks:**

- [ ] Add profession-pair validation for missing primary, optional secondary, unresolved
      professions, and duplicate primary/secondary pairs.
- [ ] Add attribute row validation for duplicate IDs, invalid ranks, unsupported purchased-rank
      costs, wrong-profession attributes, primary-only restrictions, and unresolved attributes.
- [ ] Add point-spend calculation using EPIC-03 `purchasedRankCosts` and the configured budget
      policy.
- [ ] Emit overspend issues with related budget data and deterministic attribute paths.
- [ ] Keep incomplete editor states as warnings under the default editing profile.
- [ ] Add tests for valid allocation, null primary, duplicate profession pair, duplicate attributes,
      rank bounds, unsupported rank cost, overspend, wrong-profession attributes, primary-only
      secondary attributes, and unresolved attribute IDs.
- [ ] Mark BW-0603 complete only after focused tests and `npm run verify` pass.

**Verification:**

- `npm run test:run -- test/domain/profession-attribute-rules.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Build profession and attribute legality can be evaluated without skill or equipment
rules, and the point budget policy is explicit rather than inferred from UI state.

### Phase 4: BW-0604 Skill-Bar Composition Rules (~15% of effort)

**Files:**

- `src/domain/build-validation.ts`
- `src/domain/validation-context.ts`
- `src/domain/validation.ts`
- `src/domain/index.ts`
- `test/domain/skill-bar-rules.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0604-skill-bar-composition-rules.md`

**Tasks:**

- [ ] Add skill-bar shape validation that reports non-eight runtime input with
      `SKILL_BAR_INVALID_SHAPE`.
- [ ] Preserve and report null slots without replacing them.
- [ ] Add duplicate skill detection with deterministic slot references.
- [ ] Add elite count validation using `CatalogSkillRecord.classification.elite`.
- [ ] Add PvE-only count validation using configurable `maxPveOnlySkills`, defaulting to 3.
- [ ] Treat unresolved and dispositioned skill IDs as unresolved issues and exclude them from elite
      and PvE-only count calculations.
- [ ] Add tests for full valid bar, partial bar, empty bar, wrong-length runtime input, duplicate
      known skill, duplicate unresolved skill, duplicate elite, too many PvE-only skills, and
      unresolved skill IDs.
- [ ] Mark BW-0604 complete only after focused tests and `npm run verify` pass.

**Verification:**

- `npm run test:run -- test/domain/skill-bar-rules.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Structural skill-bar rules are complete before profession/mode eligibility rules add
per-skill legality checks.

### Phase 5: BW-0605 Skill Eligibility And Mode Rules (~15% of effort)

**Files:**

- `src/domain/build-validation.ts`
- `src/domain/validation-context.ts`
- `src/domain/index.ts`
- `test/domain/skill-eligibility-rules.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0605-skill-eligibility-and-mode-rules.md`

**Tasks:**

- [ ] Validate known skill profession eligibility against selected primary and secondary
      professions.
- [ ] Validate skill attribute availability without requiring nonzero attribute allocation.
- [ ] Allow common, special, title, and no-attribute skills only when catalog classification supports
      that state.
- [ ] Report known unsupported and non-player skills as errors in player builds.
- [ ] Enforce PvE-only and PvP-only mode restrictions from classification flags and
      `modeAvailability`.
- [ ] Resolve split skills through existing `resolveSkillModeVariant` behavior and report ambiguous
      or missing variants instead of guessing.
- [ ] Emit deferred title-rank and allegiance issues as info unless caller options override severity.
- [ ] Add tests for primary skill, secondary skill, no-secondary wrong-profession skill, unrelated
      profession skill, no-attribute/common skill, unsupported skill, non-player skill, PvE-only in
      PvP, PvP-only in PvE, unknown mode, split-skill ambiguity, missing split variant, title-rank
      deferral, and allegiance deferral.
- [ ] Mark BW-0605 complete only after focused tests and `npm run verify` pass.

**Verification:**

- `npm run test:run -- test/domain/skill-eligibility-rules.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Every MVP skill legality rule that can be proven from EPIC-04 catalog facts is
implemented, and every title/allegiance gap is explicit rather than guessed.

### Phase 6: BW-0606 Effective Attribute Rank Calculator (~10% of effort)

**Files:**

- `src/domain/effective-attribute-rank.ts`
- `src/domain/build-validation.ts`
- `src/domain/validation.ts`
- `src/domain/index.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0606-effective-attribute-rank-calculator.md`

**Tasks:**

- [ ] Add `EffectiveAttributeRankInput`, `EffectiveAttributeRankResult`,
      `EffectiveAttributeRankContribution`, and modifier source types.
- [ ] Calculate base rank from authored allocations and return `0` for known unallocated
      attributes.
- [ ] Support manual override inputs for tooltip/editor previews without mutating the build.
- [ ] Accept future modifier contribution inputs for headgear, rune, weapon, title, temporary
      effect, and manual sources.
- [ ] Return unresolved outcomes for unknown attribute IDs without throwing.
- [ ] Wire calculated ranks into `ValidationResult.calculations` where useful for validated builds.
- [ ] Add tests for allocated base rank, known unallocated rank, invalid override, override
      precedence, additive future modifiers, unresolved attribute, and duplicate allocation
      interaction.
- [ ] Mark BW-0606 complete only after focused tests and `npm run verify` pass.

**Verification:**

- `npm run test:run -- test/domain/effective-attribute-rank.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Rank calculation is reusable by validation, future skill tooltip previews, and later
equipment/title epics without encoding equipment/title schemas prematurely.

### Phase 7: BW-0607 Fixtures, Integration Tests, And Closeout (~15% of effort)

**Files:**

- `src/domain/build-validation.ts`
- `src/domain/validation.ts`
- `src/domain/validation-context.ts`
- `src/domain/effective-attribute-rank.ts`
- `src/domain/index.ts`
- `test/domain/build-validation.test.ts`
- `test/domain/rule-engine-contracts.test.ts`
- `test/domain/rule-engine-context.test.ts`
- `test/domain/profession-attribute-rules.test.ts`
- `test/domain/skill-bar-rules.test.ts`
- `test/domain/skill-eligibility-rules.test.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `test/fixtures/rule-engine/README.md`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `compendium/game-rule-engine.md`
- `README.md`
- `work/tickets/06-game-rule-engine/BW-0601-validation-result-contracts.md`
- `work/tickets/06-game-rule-engine/BW-0602-build-catalog-validation-context.md`
- `work/tickets/06-game-rule-engine/BW-0603-profession-and-attribute-rules.md`
- `work/tickets/06-game-rule-engine/BW-0604-skill-bar-composition-rules.md`
- `work/tickets/06-game-rule-engine/BW-0605-skill-eligibility-and-mode-rules.md`
- `work/tickets/06-game-rule-engine/BW-0606-effective-attribute-rank-calculator.md`
- `work/tickets/06-game-rule-engine/BW-0607-rule-engine-fixtures-and-tests.md`
- `work/tickets/06-game-rule-engine/EPIC.md`
- `work/sprints/SPRINT-007.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-06-result.json`

**Tasks:**

- [ ] Add an end-to-end `validateBuild` test matrix that covers valid builds, partial builds,
      invalid profession state, duplicate attributes, overspend, wrong-profession skills, duplicate
      elites, too many PvE-only skills, mode restrictions, unresolved IDs, and effective-rank cases.
- [ ] Assert deterministic issue ordering, severity, codes, paths, slots, related entities, and
      source-rule IDs.
- [ ] Document fixture intent and which cases are MVP validation rules versus placeholders for
      equipment/title epics.
- [ ] Add or update a compendium note for the public rule-engine contract, default policies, and
      deferred rule boundaries.
- [ ] Update README current scope only if the rule engine becomes runtime-eligible during execution.
- [ ] Confirm `src/domain` exports are complete and no app/template/data imports crossed the domain
      boundary.
- [ ] Run focused tests, full typecheck, and `npm run verify`.
- [ ] Mark BW-0601 through BW-0607 done, mark EPIC-06 done, write final `work/sprints/SPRINT-007.md`,
      update `work/sprints/ledger.tsv`, and write
      `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-06-result.json`.
- [ ] Do not commit unless the operator separately requests it.

**Verification:**

- `npm run test:run -- test/domain/build-validation.test.ts`
- `npm run test:run -- test/domain/rule-engine-contracts.test.ts test/domain/rule-engine-context.test.ts test/domain/profession-attribute-rules.test.ts test/domain/skill-bar-rules.test.ts test/domain/skill-eligibility-rules.test.ts test/domain/effective-attribute-rank.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** The rule engine is documented, fixture-covered, exported from `src/domain`, and
planning records are synchronized for ticket-burn.

## Files Summary

### Domain Code

- `src/domain/validation.ts`: New public validation issue/result contracts, severity policy, issue
  code types, source-rule metadata, result summary helpers, and extension-rule types.
- `src/domain/validation-context.ts`: New context builder and lookup models over `Build`,
  `ProfessionAttributeCatalog`, and `SkillCatalog`.
- `src/domain/build-validation.ts`: New `validateBuild` orchestration plus MVP profession,
  attribute, skill-bar, skill-eligibility, mode, and extension-rule execution.
- `src/domain/effective-attribute-rank.ts`: New effective-rank calculator and contribution types.
- `src/domain/index.ts`: Export the new domain contracts and pure functions.

### Tests And Fixtures

- `test/domain/rule-engine-contracts.test.ts`: Contract shape, summary, severity, code, path, slot,
  and related-entity tests.
- `test/domain/rule-engine-context.test.ts`: Context lookup, unresolved-reference, catalog-version,
  and runtime-invalid shape tests.
- `test/domain/profession-attribute-rules.test.ts`: Profession pair, attribute allocation,
  primary-only, budget, duplicate, and unresolved tests.
- `test/domain/skill-bar-rules.test.ts`: Skill slot, duplicate, elite, PvE-only count, empty, and
  unresolved tests.
- `test/domain/skill-eligibility-rules.test.ts`: Skill profession, attribute, mode, split,
  unsupported, non-player, title, and allegiance tests.
- `test/domain/effective-attribute-rank.test.ts`: Base rank, unallocated rank, override,
  contribution, unresolved, and duplicate-allocation tests.
- `test/domain/build-validation.test.ts`: End-to-end validation result matrix.
- `test/fixtures/rule-engine/README.md`: Fixture ownership notes and MVP/deferred case boundaries.
- `test/fixtures/rule-engine/catalogs.ts`: Small EPIC-03/04-shaped catalog fixtures.
- `test/fixtures/rule-engine/builds.ts`: Small authored build fixtures for rule tests.

### Documentation And Planning Records

- `compendium/game-rule-engine.md`: New long-lived note for rule-engine contracts, defaults, and
  deferred boundaries.
- `README.md`: Current-scope update if implementation promotes the rule engine as available.
- `work/tickets/06-game-rule-engine/*.md`: Ticket status updates during final execution.
- `work/tickets/06-game-rule-engine/EPIC.md`: Epic status update during final execution.
- `work/sprints/SPRINT-007.md`: Final sprint record produced from the merged plan.
- `work/sprints/ledger.tsv`: Sprint ledger update.
- `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-06-result.json`: Ticket-burn planning
  result required by the automation contract.

### Explicit Non-Changes

- No `src/app` changes.
- No `src/template-compatibility` changes unless a final implementation discovers an export-only
  type mismatch that must be fixed without importing it into domain.
- No `scripts/data` changes.
- No generated catalog, manifest, QA, source snapshot, or live data refresh changes.
- No dependency additions are expected.
- No commit is created by the sprint unless separately requested.

## Definition of Done

- `src/domain` exposes a pure `validateBuild` API or equivalent that accepts `Build`,
  `ProfessionAttributeCatalog`, `SkillCatalog`, and optional rule configuration.
- Public validation contracts include deterministic severity, code, bounded message, path, slot,
  related entity, source-rule, summary, and `ok` fields.
- Normal invalid, incomplete, unresolved, stale-catalog, or partial authored build states return
  structured issues instead of thrown exceptions.
- Validation context assembly is reusable and centralizes profession, attribute, skill, selected
  profession, slot, catalog-version, and unresolved-reference lookups.
- Profession-pair rules distinguish valid, incomplete, unresolved, and impossible primary/secondary
  states.
- Attribute rules enforce duplicate rows, rank validity, purchased-rank costs, primary-only
  availability, wrong-profession rows, point overspend, and unresolved references.
- Skill-bar rules enforce eight-slot shape, preserve empty slots, detect duplicates, enforce one
  elite maximum, enforce PvE-only count limits, and report unresolved IDs.
- Skill eligibility rules enforce profession and attribute availability, common/no-attribute/special
  allowances, unsupported/non-player flags, PvE/PvP restrictions, and split-skill ambiguity.
- Title-rank, allegiance, equipment, rune, insignia, armor, weapon, modifier, hero, party, and UI
  validation are represented as extension or deferred-rule surfaces without premature schemas.
- Effective attribute rank calculation returns base rank, manual override handling, future modifier
  contributions, final rank, and unresolved outcomes.
- Fixture tests cover valid builds, partial builds, invalid profession state, duplicate attributes,
  overspend, wrong-profession skills, duplicate elites, too many PvE-only skills, mode restrictions,
  unresolved IDs, and effective-rank cases.
- Tests assert deterministic issue ordering, severity, codes, paths, slot refs, related entities,
  and source-rule IDs.
- Domain lint and TypeScript boundaries still prevent React, app, DOM/browser, storage, network,
  template compatibility, data scripts, generated audit artifacts, and source snapshots from
  entering `src/domain`.
- Focused rule-engine tests pass.
- `npm run typecheck` passes.
- `npm run verify` passes.
- BW-0601 through BW-0607 are marked done, EPIC-06 is marked done, `work/sprints/SPRINT-007.md` is
  written, `work/sprints/ledger.tsv` is updated, and
  `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-06-result.json` is written during the
  final ticket-burn planning/execution pass.

## Risks

- **Over-validating editor drafts:** Treating null professions, empty slots, or unresolved catalog IDs
  as hard errors would make normal editing noisy and conflict with template preservation. Mitigation:
  default to the editing profile, use warnings for incomplete/unresolved states, and reserve errors
  for catalog-proven impossibilities.
- **Under-validating export-blocking builds:** A warning-only policy could let known illegal builds
  look acceptable. Mitigation: known duplicate profession pairs, impossible attributes, overspend,
  duplicate known skills, elite limit, unsupported/non-player skills, and known mode restrictions are
  errors by default.
- **Guild Wars rule ambiguity:** PvE-only limits, title skills, allegiance conflicts, PvP budgets,
  and campaign-specific character state have edge cases not represented by EPIC-03/04 catalogs.
  Mitigation: implement only catalog-proven MVP rules, expose explicit options, and emit deferred
  issues for EPIC-15/equipment-owned facts.
- **Template compatibility boundary drift:** It may be tempting to validate raw decoded template
  documents directly. Mitigation: EPIC-06 validates `Build` and caller-provided unresolved reference
  facts only; template decode and raw source preservation remain in `src/template-compatibility`.
- **Issue-code churn:** UI and tests will depend on stable codes. Mitigation: define the code union
  first, assert codes in fixtures, and add new codes instead of repurposing existing ones.
- **Context over-abstraction:** A generic rule-plugin system could obscure simple MVP rules.
  Mitigation: implement direct rule groups first and keep extension rules as a small append-only
  interface.
- **Fixture unreality:** Tiny fixtures can miss interactions present in full catalogs. Mitigation:
  use small fixtures for deterministic unit coverage and add a limited generated-catalog smoke test
  only if it can avoid importing generated artifacts into runtime code.
- **Runtime shape mismatch:** TypeScript tuples do not protect data loaded from JSON. Mitigation:
  validate skill-bar shape defensively inside the context/rule engine and return issues.

## Security

- The rule engine is pure domain code. It must not perform network access, read files, touch browser
  storage, inspect the DOM, evaluate code, or import data-ingestion modules.
- Validation inputs are untrusted authored data. The implementation should bound fallback messages,
  avoid echoing large raw values, and treat non-finite numbers as invalid issues.
- Generated catalog JSON may be supplied by callers, but domain code must not import generated
  catalog files, generated manifests, QA reports, source snapshots, or wiki APIs.
- Issue messages are plain text. They must not contain HTML, markdown generated from user input, or
  source-authored prose copied from external pages.
- Extension rules must be synchronous pure functions over supplied inputs; they must not become a
  plugin execution sandbox or a network/data-loading mechanism.
- Tests must remain offline and deterministic. `npm run verify` must not require live network access.
- No new dependencies are expected. If implementation proposes one, it requires a separate
  dependency review and an explicit sprint amendment.

## Dependencies

- Completed SPRINT-001 through SPRINT-006, with ledger entries marked completed.
- EPIC-03 runtime-eligible profession/attribute catalog contract:
  `data/generated/epic-03/professions-attributes.catalog.json`.
- EPIC-04 runtime-eligible skill catalog contract:
  `data/generated/epic-04/skills.catalog.json`.
- Existing domain helpers in `src/domain/catalog-lookup.ts`, especially `lookupSkillById`,
  `resolveSkillModeVariant`, `attributeBudgetForLevel`, and `purchasedRankCost`.
- Existing domain contracts in `src/domain/build.ts`, `src/domain/catalog.ts`,
  `src/domain/equipment.ts`, `src/domain/template.ts`, and `src/domain/ids.ts`.
- EPIC-05 template compatibility decisions, especially the separation between loss-aware template
  documents and semantic `Build` validation.
- Repository tooling: Node.js `>=22.11.0`, npm `>=11.10.1`, TypeScript, ESLint, Vitest, Vite, Python
  3, and `.venv-data` setup for `npm run verify`.
- No live Guild Wars Wiki access, source refresh, generated data promotion, or new npm package is
  required for this sprint.

## Open Questions

1. Should the final API name be `validateBuild`, `validateBuildRules`, or `validateGameRules`?
   Sprint default: use `validateBuild` unless an existing naming conflict appears.
2. Should the default validation profile be `"editing"` or `"complete"`? Sprint default: `"editing"`
   so partial authored builds produce useful issues without blocking normal editor flows.
3. Should unresolved authored catalog IDs be warnings or errors for export-oriented callers? Sprint
   default: warnings, with caller severity override allowed for export workflows.
4. Should missing secondary profession produce a warning by default? Sprint default: no issue unless
   the complete profile or a selected skill requires the missing secondary.
5. Is the PvE-only limit exactly 3 for every `classification.pveOnly` skill in the current catalog,
   or do title/allegiance group limits need separate counting? Sprint default: enforce maximum 3
   PvE-only skills and defer title/allegiance ownership to EPIC-15.
6. Should PvP attribute budgets use the EPIC-03 default level-20 PvE maximum until a PvP-specific
   policy exists? Sprint default: use the explicit configured budget policy, which defaults to the
   EPIC-03 200-point level-20 maximum-applicable policy for deterministic MVP behavior.
7. Should duplicate unresolved skill IDs be hard errors because the authored numeric value repeats?
   Sprint default: warning until catalog resolution proves the skill identity.
8. Should effective rank impose a final maximum rank? Sprint default: validate finite integer
   contributions only and avoid a hard cap until equipment/title rules define supported limits.
9. Should a generated-catalog smoke test be added in addition to small fixtures? Sprint default: only
   if it does not import generated artifacts into runtime domain code and does not make tests brittle
   against unrelated catalog refreshes.
