---
id: SPRINT-007
title: Game Rule Engine
status: planned
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
created: 2026-09-01
---

# Sprint 007: Game Rule Engine

## Overview

This sprint turns `EPIC-06 Game Rule Engine` into a pure domain validation and calculation surface
for authored `Build` documents. It adds deterministic rule results, build-and-catalog validation
context, profession and attribute legality checks, skill-bar and skill-eligibility rules, and an
effective-attribute-rank calculator without pulling UI state, browser APIs, storage, network I/O,
or data-ingestion code into `src/domain`.

The sequencing priority is to lock the shared issue/result contract first, then build the reusable
validation context and top-level orchestration, then complete profession and attribute rules, then
stabilize effective-rank math before skill rules consume adjacent attribute semantics, then finish
skill-bar composition and skill eligibility, and only then harden fixtures, documentation, and
repository verification. That order puts the shared contracts and lowest-level rule dependencies
ahead of specialized checks and reduces rework in later phases.

This sprint stays intentionally bounded. It does not implement React rendering, editor wiring,
template decoding, storage, equipment legality, allegiance enforcement, title-track ownership,
party validation, guide heuristics, or recommendation logic. Unknown authored ids remain
round-trippable where possible and are reported as unresolved references rather than destructively
coerced into known catalog data.

## Use Cases

1. A build editor validates an in-progress build with missing professions, empty skill slots, or
   unresolved imported ids and receives structured warnings instead of exceptions.
2. A completed build validates profession pairing, primary-only attributes, attribute point spend,
   elite count, duplicate skills, and PvE/PvP restrictions through one pure domain call.
3. A stale or partially imported build preserves authored profession, attribute, and skill ids even
   when the current catalogs cannot resolve them.
4. A future UI can highlight `primaryProfessionId`, `attributes[2].rank`, or `skillBar[5]` using
   stable issue paths and optional slot metadata without importing validation internals.
5. A tooltip or analysis feature can compute effective attribute rank from authored points plus
   optional bonuses and overrides without needing equipment or title catalogs to be complete.
6. Later equipment, title-track, allegiance, hero, or party rules can plug into the same
   validation-context and issue contracts without breaking the MVP build-validation surface.
7. Focused Vitest fixtures can prove deterministic issue ordering, severity, codes, and source-rule
   attribution without live network access or full generated catalog snapshots.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Validation contracts | Plain JSON-compatible issue, result, severity, source-rule, path, slot, and related-entity types under `src/domain`. | UI components, localized copy systems, thrown validation exceptions for normal authored mistakes, or browser-only state. |
| Validation context | Pure assembly of `Build`, caller-supplied profession/attribute/skill catalogs, rule options, lookups, unresolved references, and extension hooks. | App storage, React state, runtime data fetching, generated manifests, QA reports, source snapshots, or `scripts/data` imports. |
| Profession and attribute rules | Profession-pair legality, incomplete-selection handling, primary-only attributes, wrong-profession attributes, duplicate rows, rank validation, and point-budget checks. | Campaign/account ownership rules, PvP character-specific attribute budgets, hero rules, or equipment-derived attribute bonuses. |
| Skill rules | Eight-slot bar validation, elite count, duplicate known skills, PvE-only count, profession eligibility, attribute eligibility, and mode restrictions. | Full title/allegiance legality, synergy analysis, recommendation heuristics, missing-resurrection advice, or party-level constraints. |
| Effective ranks | Base authored rank plus caller-supplied bonuses and overrides with a structured breakdown. | Automatic rune, headgear, weapon, title, or temporary-effect extraction from incomplete future catalogs. |
| Extension surface | Stable hook points for equipment, title-track, allegiance, weapon, rune, insignia, hero, and party validators. | Implementing those later epics before the necessary catalogs and authored models exist. |
| Verification | Focused domain fixtures, deterministic ordering assertions, repository verification, and planning-record closeout. | Live-network validation, snapshot replay, or application-code changes in `src/app`. |

### Public Surface

The sprint should export three primary pure entry points from `src/domain`:

```ts
validateBuild(build, catalogs, options?): ValidationResult
createValidationContext(build, catalogs, options?): ValidationContext
calculateEffectiveAttributeRank(context, attributeId, options?): EffectiveAttributeRank
```

`ValidationIssue` should be the stable unit returned by all rule groups. The initial contract should
include:

- `severity`: `error | warning | info`
- `code`: stable issue identifier used by tests and future UI logic
- `message`: deterministic human-readable explanation
- `path`: canonical build path such as `primaryProfessionId`, `attributes[1].attributeId`, or
  `skillBar[4]`
- `slot`: numeric slot index when the issue targets a skill slot, weapon set slot, or future
  equipment slot; otherwise `null`
- `relatedEntity`: JSON-compatible reference with `kind`, `authoredId`, and `catalogId`
- `sourceRule`: stable rule identifier of the form `<ticket-id>/<rule-key>`

`ValidationResult` should always return plain data for normal authored invalid states. It should not
be a success/failure exception wrapper. The minimum result payload should include the ordered issue
array plus summary counts and an `exportBlocked` boolean derived from current severities.

Severity policy should be fixed in this sprint:

- `error`: the build is known to violate a concrete MVP rule and should block export.
- `warning`: the build is incomplete, unresolved, or deferred because later epics own the missing
  legality facts.
- `info`: optional non-blocking context only. MVP rule phases should use this sparingly.

The sprint should establish the following initial stable issue-code set:

- Profession state: `MISSING_PRIMARY_PROFESSION`, `MISSING_SECONDARY_PROFESSION`,
  `INVALID_PROFESSION_PAIR`, `UNRESOLVED_PROFESSION`
- Attribute state: `DUPLICATE_ATTRIBUTE`, `UNRESOLVED_ATTRIBUTE`, `ATTRIBUTE_NOT_ALLOWED`,
  `PRIMARY_ONLY_ATTRIBUTE_REQUIRES_PRIMARY`, `ATTRIBUTE_RANK_INVALID`,
  `ATTRIBUTE_POINTS_EXCEEDED`
- Skill-bar state: `SKILL_BAR_LENGTH_INVALID`, `INCOMPLETE_SKILL_BAR`, `UNRESOLVED_SKILL`,
  `TOO_MANY_ELITE_SKILLS`, `DUPLICATE_SKILL`, `TOO_MANY_PVE_ONLY_SKILLS`
- Skill eligibility: `SKILL_PROFESSION_NOT_ALLOWED`, `SKILL_ATTRIBUTE_NOT_ALLOWED`,
  `SKILL_MODE_RESTRICTED`, `SKILL_MODE_AMBIGUOUS`
- Deferred future rules: `TITLE_RULE_DEFERRED`, `ALLEGIANCE_RULE_DEFERRED`

Tests should treat `code`, `severity`, `path`, `slot`, and `sourceRule` as the normative API.
Messages should stay deterministic, but structural fields are the primary compatibility contract.

### Validation Flow

```text
Build + caller-supplied catalogs + rule options
  -> createValidationContext
  -> profession-state and attribute-allocation rules
  -> effective-attribute-rank helper availability
  -> skill-bar composition rules
  -> skill eligibility and mode rules
  -> future extension rules
  -> deterministic issue sort
  -> ValidationResult
```

The context should precompute lookups for the authored ids already present in the build instead of
rebuilding maps per validator. It should preserve unresolved authored ids and lookup outcomes so one
validator can report an unresolved reference without another validator misclassifying the same input
as illegal under the wrong rule.

Default rule options should be explicit and documented:

- `level: 20`
- `questBonus: "maximum-applicable"`
- incomplete editor states default to `warning`
- unresolved references default to `warning`
- title/allegiance gaps default to `warning`, not guessed legality

Deterministic issue ordering should be fixed in one shared helper:

1. Rule-family order: profession state, attribute state, effective rank, skill-bar composition,
   skill eligibility, extension hooks.
2. Within a family, sort by canonical path and then by numeric row or slot index.
3. Break remaining ties by severity and then stable code.

Duplicate non-elite skills should be warnings in MVP. The current catalogs can prove elite count and
PvE-only limits, but they do not encode a broader uniqueness model that would justify converting
every duplicate known skill into an error.

Title-track and allegiance legality should remain deferred. If a selected skill depends on title or
allegiance facts that are not modeled until `EPIC-15`, the engine should emit stable deferred
warnings instead of hard-coded guesses.

## Implementation

Implementation order follows the dependency graph rather than strict ticket numbering. `BW-0606`
moves ahead of `BW-0604` and `BW-0605` because it depends only on `BW-0603`, stabilizes
attribute-derived calculations early, and reduces later skill-rule rework.

### Phase 1: BW-0601 Validation Result Contracts (~12% of effort)

**Files:**

- `src/domain/validation.ts`
- `src/domain/index.ts`
- `test/domain/validation-contracts.test.ts`
- `work/tickets/06-game-rule-engine/BW-0601-validation-result-contracts.md`

**Tasks:**

- [ ] Create `ValidationSeverity`, `ValidationIssueCode`, `ValidationSourceRule`,
      `ValidationEntityRef`, `ValidationIssue`, and `ValidationResult` in one shared domain module.
- [ ] Define the fixed severity policy for export-blocking errors, incomplete/unresolved warnings,
      and limited informational output.
- [ ] Standardize path formatting as canonical dot-and-bracket strings such as
      `attributes[0].rank` and `skillBar[3]`.
- [ ] Add stable `sourceRule` identifiers tied to ticket-owned rule groups such as
      `BW-0603/attribute-budget` and `BW-0605/skill-mode`.
- [ ] Add a shared deterministic issue-ordering helper so every later validator uses one sort
      policy.
- [ ] Reserve related-entity kinds for future equipment, title-track, weapon, rune, insignia, hero,
      and party rules without implementing them in this sprint.
- [ ] Add contract tests that assert JSON-compatible shapes, stable code membership, and issue sort
      behavior.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/validation-contracts.test.ts`

**Phase Gate:** Every later rule phase can return one stable plain-data issue shape without making a
second contract decision.

### Phase 2: BW-0602 Build Catalog Validation Context (~14% of effort)

**Files:**

- `src/domain/validation-context.ts`
- `src/domain/validate-build.ts`
- `src/domain/index.ts`
- `test/domain/validation-context.test.ts`
- `test/fixtures/rule-engine/README.md`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0602-build-catalog-validation-context.md`

**Tasks:**

- [ ] Define `ValidationCatalogs`, `ValidationOptions`, `ValidationContext`, and the public
      `validateBuild` orchestration entry point.
- [ ] Precompute lookups for primary profession, secondary profession, each attribute row, each
      skill slot, and current authored equipment references without assuming resolution success.
- [ ] Preserve original authored ids alongside lookup outcomes so unresolved references remain
      round-trippable and diagnosable.
- [ ] Add explicit default options for level and quest-bonus assumptions while allowing callers to
      override them later.
- [ ] Add a minimal extension-hook interface for future equipment, title-track, allegiance, hero,
      and party validators to emit additional `ValidationIssue[]`.
- [ ] Ensure normal invalid authored builds return collected issues instead of thrown exceptions;
      reserve throws for programmer misuse or impossible internal invariants only.
- [ ] Build small reusable catalog and build fixtures that later rule tests can import without
      depending on full generated data.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/validation-context.test.ts`

**Phase Gate:** The rule engine has one reusable context and one top-level entry point before
specialized rules begin.

### Phase 3: BW-0603 Profession And Attribute Rules (~18% of effort)

**Files:**

- `src/domain/validation-professions-attributes.ts`
- `src/domain/validate-build.ts`
- `src/domain/index.ts`
- `test/domain/profession-attribute-validation.test.ts`
- `test/fixtures/rule-engine/professions-attributes.ts`
- `work/tickets/06-game-rule-engine/BW-0603-profession-and-attribute-rules.md`

**Tasks:**

- [ ] Validate missing primary or secondary professions, `secondary`-without-`primary` state, and
      identical primary/secondary profession pairs.
- [ ] Treat incomplete profession selection as warnings by default and use errors only for
      contradictory or impossible pairings.
- [ ] Validate attribute ownership against the selected profession pair and enforce primary-only
      restrictions from the EPIC-03 catalog.
- [ ] Reject duplicate attribute rows, negative ranks, non-integer ranks, and ranks not supported
      by the purchased-rank cost table.
- [ ] Use `purchasedRankCost` and `attributeBudgetForLevel` to calculate spent attribute points from
      authored ranks under the configured level and quest-bonus assumptions.
- [ ] Emit unresolved profession and attribute issues with stable paths and preserved authored ids.
- [ ] Keep attribute issue ordering stable by authored row index so later UI and fixtures do not
      depend on incidental object iteration order.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/profession-attribute-validation.test.ts`

**Phase Gate:** Profession legality, attribute legality, and point-budget rules are correct before
effective-rank or skill rules depend on them.

### Phase 4: BW-0606 Effective Attribute Rank Calculator (~12% of effort)

**Files:**

- `src/domain/effective-attribute-rank.ts`
- `src/domain/index.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `test/fixtures/rule-engine/effective-rank.ts`
- `work/tickets/06-game-rule-engine/BW-0606-effective-attribute-rank-calculator.md`

**Tasks:**

- [ ] Implement `calculateEffectiveAttributeRank` from authored attribute allocations and a
      structured list of optional additive contributions.
- [ ] Model contribution sources explicitly as `headgear`, `rune`, `weapon`, `title-rank`,
      `manual-override`, and `temporary-effect`.
- [ ] Return a structured breakdown containing base rank, applied contributions, deferred or
      unresolved inputs, and the final effective rank.
- [ ] Treat a known but unallocated attribute as base rank `0` and an unresolved attribute as an
      explicit unresolved outcome rather than a silent zero.
- [ ] Keep equipment, title, and temporary-effect inputs caller-supplied in this sprint; do not
      infer them automatically from incomplete later-epic models.
- [ ] Add regression cases for stacked bonuses, override preview behavior, missing attributes, and
      unresolved attribute ids.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/effective-attribute-rank.test.ts`

**Phase Gate:** Later UI and rule work can rely on one stable effective-rank API without forcing
equipment or title ownership into this sprint.

### Phase 5: BW-0604 Skill Bar Composition Rules (~14% of effort)

**Files:**

- `src/domain/validation-skill-bar.ts`
- `src/domain/validate-build.ts`
- `src/domain/index.ts`
- `test/domain/skill-bar-validation.test.ts`
- `test/fixtures/rule-engine/skill-bar.ts`
- `work/tickets/06-game-rule-engine/BW-0604-skill-bar-composition-rules.md`

**Tasks:**

- [ ] Defensively validate runtime skill-bar length against `SKILL_BAR_SLOT_COUNT` even though the
      TypeScript contract is an eight-entry tuple.
- [ ] Treat a fully empty bar as a blank draft, and a partially filled bar as one
      `INCOMPLETE_SKILL_BAR` warning instead of eight empty-slot warnings.
- [ ] Emit unresolved-skill issues for populated unresolved slots with stable path and slot
      metadata.
- [ ] Count known elite skills and return an error when more than one elite is present.
- [ ] Count duplicate known skill ids by authored slot and classify non-elite duplicates as
      warnings in MVP.
- [ ] Enforce the maximum of three known PvE-only skills when the catalog flags prove the count.
- [ ] Keep skill-bar issue ordering stable by slot index and then code.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/skill-bar-validation.test.ts`

**Phase Gate:** Structural skill-bar rules are deterministic before profession and mode eligibility
rules add more semantic failures on top.

### Phase 6: BW-0605 Skill Eligibility And Mode Rules (~16% of effort)

**Files:**

- `src/domain/validation-skill-eligibility.ts`
- `src/domain/validate-build.ts`
- `src/domain/index.ts`
- `test/domain/skill-eligibility-validation.test.ts`
- `test/fixtures/rule-engine/skill-eligibility.ts`
- `work/tickets/06-game-rule-engine/BW-0605-skill-eligibility-and-mode-rules.md`

**Tasks:**

- [ ] Validate resolved skill profession ownership against the selected primary and secondary
      professions.
- [ ] Permit `common`, `special`, and `noAttribute` skill classifications when catalog facts mark
      them as legal.
- [ ] Validate skill attribute linkage when the catalog names a required attribute and distinguish
      wrong-profession skill usage from unresolved skill lookup.
- [ ] Use `Build.mode`, `classification.modeAvailability`, and `resolveSkillModeVariant` to
      distinguish legal, restricted, and ambiguous split-skill cases.
- [ ] Treat `Build.mode === "unknown"` plus split-mode differences as warning-level ambiguity, not
      hard failure.
- [ ] Emit `TITLE_RULE_DEFERRED` and `ALLEGIANCE_RULE_DEFERRED` warnings when selected skills depend
      on later-epic title or allegiance legality that the current catalogs cannot decide fully.
- [ ] Preserve unresolved imported skills as unresolved warnings only and do not cascade them into
      false wrong-profession or mode-restriction errors.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/skill-eligibility-validation.test.ts`

**Phase Gate:** The engine can explain why a selected skill is illegal, ambiguous, unresolved, or
deferred without guessing missing title or allegiance logic.

### Phase 7: BW-0607 Rule Engine Fixtures, Integration, And Verification (~14% of effort)

**Files:**

- `test/fixtures/rule-engine/README.md`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `test/fixtures/rule-engine/effective-rank.ts`
- `test/domain/build-validation.test.ts`
- `test/domain/validation-contracts.test.ts`
- `test/domain/validation-context.test.ts`
- `test/domain/profession-attribute-validation.test.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `test/domain/skill-bar-validation.test.ts`
- `test/domain/skill-eligibility-validation.test.ts`
- `README.md`
- `compendium/game-rule-engine.md`
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

**Tasks:**

- [ ] Add a minimal fixture matrix covering a valid build, blank build, in-progress build, invalid
      profession pair, duplicate attributes, overspent attributes, wrong-profession skill,
      duplicate elite, duplicate non-elite, too many PvE-only skills, mode-restricted skill,
      unresolved ids, and effective-rank edge cases.
- [ ] Add top-level `validateBuild` integration tests that assert deterministic issue ordering,
      severity, code, path, slot, related entity, and source-rule values.
- [ ] Keep the main rule suite on small local fixtures and add at most one compatibility test
      against `test/fixtures/data-ingestion/generated/` only if needed to prove catalog-shape
      compatibility.
- [ ] Update `README.md` and add `compendium/game-rule-engine.md` documenting the public validation
      surface, severity model, default budget assumptions, unresolved-id behavior, and explicit
      deferred rules.
- [ ] Update BW-0601 through BW-0607, `EPIC-06`, `work/sprints/SPRINT-007.md`, and
      `work/sprints/ledger.tsv` so sprint traceability and closeout status stay consistent.
- [ ] Run full repository verification and do not close the sprint until `npm run verify` and
      `python3 -m unittest scripts/test_ticket_burn.py` both pass.

**Verification:**

- `npm run test:run -- test/domain/validation-contracts.test.ts test/domain/validation-context.test.ts test/domain/profession-attribute-validation.test.ts test/domain/effective-attribute-rank.test.ts test/domain/skill-bar-validation.test.ts test/domain/skill-eligibility-validation.test.ts test/domain/build-validation.test.ts`
- `npm run typecheck`
- `npm run verify`
- `python3 -m unittest scripts/test_ticket_burn.py`

**Phase Gate:** The rule engine is deterministic, fixture-covered, documented, and repository-clean
under the canonical verification command.

## Files Summary

| Path | Purpose |
| --- | --- |
| `src/domain/validation.ts` | Shared validation contracts, severity model, issue codes, source-rule ids, and ordering helpers |
| `src/domain/validation-context.ts` | Pure build-and-catalog lookup context with unresolved-reference handling and future extension hooks |
| `src/domain/validate-build.ts` | Top-level orchestration entry point that runs validators and returns one `ValidationResult` |
| `src/domain/validation-professions-attributes.ts` | Profession-pair, primary-only, duplicate-attribute, rank, and point-budget rules |
| `src/domain/effective-attribute-rank.ts` | Effective-rank calculator and contribution breakdown surface |
| `src/domain/validation-skill-bar.ts` | Eight-slot structure, empty-slot policy, elite-count, duplicate-skill, and PvE-only-count rules |
| `src/domain/validation-skill-eligibility.ts` | Skill profession, attribute, mode, split-skill, and deferred title/allegiance rules |
| `src/domain/index.ts` | Public export surface for the rule engine |
| `test/fixtures/rule-engine/` | Minimal shared catalog and build fixtures for rule-engine tests |
| `test/domain/*validation*.test.ts` and `test/domain/effective-attribute-rank.test.ts` | Focused contract, context, rule-group, and integration verification |
| `README.md` | Repository-level summary of the new domain validation surface and canonical verification expectations |
| `compendium/game-rule-engine.md` | Durable design notes, defaults, issue semantics, and deferred-scope record for EPIC-06 |
| `work/tickets/06-game-rule-engine/BW-0601*.md` through `BW-0607*.md` | Ticket traceability and closeout evidence for each rule-engine slice |
| `work/tickets/06-game-rule-engine/EPIC.md` | Epic status and sprint linkage |
| `work/sprints/SPRINT-007.md` | Final execution copy of the sprint |
| `work/sprints/ledger.tsv` | Sprint lifecycle tracking |

## Definition of Done

- [ ] `src/domain` exposes stable pure validation contracts, context creation, top-level validation,
      and effective-rank calculation without importing React, DOM APIs, storage, network clients,
      `src/template-compatibility`, generated manifests, QA reports, or `scripts/data`.
- [ ] `ValidationIssue` includes deterministic `severity`, `code`, `message`, `path`, `slot`,
      `relatedEntity`, and `sourceRule` fields.
- [ ] `validateBuild` returns multiple issues from one pass and never throws for normal invalid,
      incomplete, or unresolved authored builds.
- [ ] `createValidationContext` preserves authored profession, attribute, and skill ids even when
      catalogs cannot resolve them.
- [ ] Profession rules distinguish missing selections from impossible primary/secondary pairs.
- [ ] Attribute rules enforce primary-only restrictions, detect wrong-profession rows, reject
      duplicate rows, validate rank inputs, and enforce configured point budgets.
- [ ] Effective-rank calculation works for allocated, unallocated, overridden, and unresolved
      attributes and returns a structured contribution breakdown.
- [ ] Skill-bar rules cover runtime length checks, partial-bar handling, unresolved slots, elite
      count, duplicate known skills, and the three-PvE-only limit.
- [ ] Skill-eligibility rules cover profession ownership, attribute linkage, mode restrictions,
      split-skill ambiguity, and explicit title/allegiance deferrals.
- [ ] Duplicate non-elite skills are warning-level in MVP unless later catalog facts justify a
      stronger rule.
- [ ] Deterministic issue ordering is asserted across focused rule tests and top-level integration
      tests.
- [ ] Fixtures are minimal, offline, and independent from live network access or raw wiki
      snapshots.
- [ ] `README.md`, `compendium/game-rule-engine.md`, BW-0601 through BW-0607, `EPIC-06`,
      `work/sprints/SPRINT-007.md`, and `work/sprints/ledger.tsv` are internally consistent.
- [ ] `npm run typecheck`, the focused rule-engine Vitest suites, `npm run verify`, and
      `python3 -m unittest scripts/test_ticket_burn.py` pass.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Partial editor states create noisy or contradictory issues. | Medium | High | Fix the severity policy in Phase 1, classify incomplete states as warnings by default, and cover blank and in-progress builds explicitly in Phase 7 fixtures. |
| Unknown or stale catalog ids get misreported as illegal instead of unresolved. | Medium | High | Preserve authored ids in the validation context, emit unresolved issues early, and prevent later rules from cascading unresolved lookups into false legality failures. |
| Duplicate-skill legality is under-specified beyond elite and PvE-only limits. | High | Medium | Treat non-elite duplicates as warnings in MVP, document the rationale, and leave stronger uniqueness rules to future content or analysis epics. |
| Runtime tuple typing hides malformed external JSON with a non-eight-slot skill bar. | Medium | Medium | Add defensive runtime length checks in BW-0604 and test malformed arrays directly. |
| Effective-rank inputs accidentally force premature equipment or title modeling. | Medium | Medium | Keep contribution sources explicit and caller-supplied, and do not infer equipment or title bonuses from incomplete later-epic models. |
| Title and allegiance behavior is mistaken for complete legality in MVP. | Medium | High | Emit explicit deferred warnings with stable codes and document that EPIC-15 owns final title/allegiance enforcement. |

## Security

- Treat build documents, authored ids, and caller-supplied catalogs as untrusted plain data.
- Keep the entire rule engine pure and side-effect free. No DOM access, browser storage, network
  I/O, dynamic imports, or code execution belongs in this sprint.
- Do not leak stack traces, thrown dependency objects, or internal exception details through the
  public validation contract.
- Keep issue messages plain text and UI-ready; do not embed HTML, Markdown rendering assumptions, or
  executable content in validation output.
- Bound any defensive runtime checks to the authored build shape already modeled by `Build`; do not
  add open-ended parsing or unbounded logging of user-authored payloads.
- Preserve unresolved ids and deferred-rule outcomes without attempting unsafe fallback guesses that
  could mislead downstream UI or export flows.

## Dependencies

- Internal prerequisites: `EPIC-03` / `SPRINT-004` must remain the authority for professions,
  attributes, template crosswalk semantics, and attribute point budgets.
- Internal prerequisites: `EPIC-04` / `SPRINT-005` must remain the authority for skill
  classifications, profession and attribute links, split-mode groups, and PvE/PvP availability.
- Contextual prior work: `SPRINT-006` informs unresolved imported-id preservation and reinforces the
  boundary that template decoding is not validation, even though `EPIC-05` is not a hard backlog
  dependency of `EPIC-06`.
- Tooling prerequisites remain Node.js `22.11.0+`, npm `11.10.1+`, and Python 3 for repository
  verification.

Internal sequencing:

```text
BW-0601 Validation Result Contracts
  -> BW-0602 Build Catalog Validation Context
BW-0602
  -> BW-0603 Profession And Attribute Rules
BW-0603
  -> BW-0606 Effective Attribute Rank Calculator
BW-0602
  -> BW-0604 Skill Bar Composition Rules
BW-0604
  -> BW-0605 Skill Eligibility And Mode Rules
BW-0603 + BW-0604 + BW-0605 + BW-0606
  -> BW-0607 Rule Engine Fixtures And Tests
```

Downstream epics directly unblocked or clarified by this sprint:

- `EPIC-08 Core Build Editor`
- `EPIC-15 Title Tracks and PvE-only`
- `EPIC-17 Party and Hero Builder`
- `EPIC-21 Advanced Analysis`

## Open Questions

1. Should a later UI-specific pass add optional per-empty-slot warnings for partial skill bars, or
   is one bar-level `INCOMPLETE_SKILL_BAR` warning the long-term contract?
2. When `EPIC-15` lands, should deferred title/allegiance warnings upgrade to errors only when all
   required title inputs are present, or should stale-catalog cases remain warnings?
3. Should later advisory systems in `EPIC-21` share the `ValidationIssueCode` namespace, or should
   they add a parallel non-legality advisory namespace to keep MVP rule codes narrowly scoped?
