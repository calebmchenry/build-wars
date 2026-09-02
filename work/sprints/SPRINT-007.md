---
id: SPRINT-007
title: Game Rule Engine
status: completed
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
for authored `Build` documents. It adds deterministic validation results, reusable build/catalog
context, profession and attribute legality checks, skill-bar composition rules, skill eligibility
and mode rules, and an effective attribute rank calculator.

The rule engine consumes caller-supplied semantic catalog objects from the EPIC-03
professions/attributes contract and EPIC-04 skills contract. It must not import generated JSON,
generated manifests, QA reports, source snapshots, MediaWiki/wiki APIs, Python ingestion tooling,
React, DOM/browser APIs, storage, or the EPIC-05 template compatibility adapter. Template decoding
and exact-source preservation stay in `src/template-compatibility`; game legality for semantic
`Build` data lives in `src/domain`.

The sprint locks three important product semantics. First, proven contradictions are distinct from
incomplete or unresolved facts. Second, `valid` means "no error issues" only; the result must also
expose completeness, resolution, and exhaustiveness so callers do not confuse editor validation with
publish/export policy. Third, unknown imported or stale IDs are preserved and reported as unresolved
references rather than coerced, deleted, or guessed.

## Use Cases

1. **Validate a complete build**: A caller supplies a `Build`, profession/attribute catalog facts,
   and skill catalog facts, then receives deterministic issues and summary state without UI code.
2. **Support editor-in-progress states**: Null professions, empty skill slots, partial allocations,
   and unresolved imported IDs produce warnings instead of exceptions or destructive cleanup.
3. **Explain profession and attribute problems**: The engine locates duplicate professions,
   secondary-without-primary state, unresolved professions, duplicate attributes, invalid ranks,
   primary-only misuse, wrong-profession attributes, and attribute point overspend.
4. **Explain skill-bar composition problems**: The engine checks the eight-slot shape at runtime,
   preserves empty slots, reports unresolved IDs, flags duplicate resolved player skills, enforces
   one elite, and enforces the default three PvE-only skill limit.
5. **Explain skill eligibility and mode problems**: The engine checks selected professions,
   professionless classifications, skill attribute joins, PvE/PvP restrictions, split-skill
   ambiguity, unsupported records, non-player records, and deferred title/allegiance facts.
6. **Calculate effective attribute rank**: A tooltip, editor preview, or later analysis caller can
   resolve base rank, optional override, caller-consolidated adjustments, and final rank without
   requiring equipment or title catalogs.
7. **Give future rule domains a stable target**: Later equipment, title, hero, party, and analysis
   work can add built-in domain modules using the same issue contract and ordering discipline.

## Architecture

### Scope Boundary

| Area             | In Scope                                                                                                                                                                                                                                                                    | Out of Scope                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public contracts | Validation severity, issue codes, segment paths, typed locations, related entities, rule IDs, summaries, result state, result version, and effective-rank outputs.                                                                                                          | UI component props, localized copy, HTML/Markdown rendering, app state, storage records, vendor/template objects, source/audit artifacts, or thrown validation failures for normal authored mistakes. |
| Context          | Fresh per-call lookup context over `Build`, narrow EPIC-03/04 catalog slices, selected professions, attribute rows, skill slots, catalog versions, duplicate catalog keys, unresolved references, and budget policy.                                                        | Runtime catalog fetching, generated-file imports, global catalog caches, template decoding, broad schema validation, app services, or mutation of caller objects.                                     |
| MVP rules        | Profession pair, attribute ownership, purchased ranks, attribute budget, skill-bar shape, incomplete bar, duplicate skills, elite limit, PvE-only limit, skill profession/attribute/mode eligibility, unsupported/non-player handling, split ambiguity, and title deferral. | Campaign/account unlocks, actual quest-log state, title ownership, allegiance side, rune/insignia/armor/weapon legality, hero/party validation, recommendations, guide heuristics, or UI filtering.   |
| Effective rank   | Base authored rank, known unallocated attributes as rank zero, optional base override, caller-supplied consolidated additive adjustments, contribution breakdown, and unresolved outcomes.                                                                                  | Deriving bonuses from equipment/title data, stacking policy, title-rank ownership, temporary-effect simulation, normal-rank caps, or skill-description rendering.                                     |
| Verification     | Small offline fixtures, focused domain tests, no-mutation and reorder determinism tests, generated runtime catalog smoke coverage, docs, tickets, ledger, and run manifest.                                                                                                 | Live wiki/network tests, source snapshot replay, generated data promotion, UI/browser screenshots, package changes, or unrelated refactors.                                                           |

### Public Surface

The public domain API should remain small:

```ts
validateBuild(input: BuildValidationInput): ValidationResult
calculateEffectiveAttributeRank(input: EffectiveAttributeRankInput): EffectiveAttributeRankResult
```

`createBuildValidationContext` may live in `src/domain/validation-context.ts` for implementation and
focused tests, but it is not exported from `src/domain/index.ts` unless implementation proves an
immediate external caller needs it. There is no public runtime callback or plugin API in this sprint.
Future rule families should be added as built-in domain modules with deterministic order.

`BuildValidationInput` accepts:

- `build: Build`
- `professionAttributes`: a narrow structural slice of `ProfessionAttributeCatalog`
- `skills`: a narrow structural slice of `SkillCatalog`
- optional `options`

The narrow catalog slices must be satisfied by the complete promoted catalog contracts and by small
test fixtures. The rule engine may consume catalog versions and semantic arrays, but not generated
manifests, QA reports, source plans, snapshots, provenance bodies, or data scripts.

### Result Semantics

`ValidationIssue` is the normative unit for callers and tests:

```ts
type ValidationSeverity = "error" | "warning" | "info";
type ValidationPath = readonly (string | number)[];

interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly code: ValidationIssueCode;
  readonly message: string;
  readonly path: ValidationPath;
  readonly location: ValidationLocation | null;
  readonly relatedEntities: readonly ValidationEntityReference[];
  readonly sourceRule: ValidationRuleId;
}
```

Required issue semantics:

- `code`, `severity`, `path`, `location`, `relatedEntities`, and `sourceRule` are structural API.
- `message` is deterministic plain text, bounded, and suitable for temporary UI display, but tests
  should not treat prose as the only compatibility contract.
- Paths are segment arrays such as `["primaryProfessionId"]`, `["attributes", 2, "rank"]`, and
  `["skillBar", 5]`; presentation formatting belongs outside the domain contract.
- Locations are typed, for example skill slot, attribute row, armor slot, weapon-set slot, or null.
  This sprint implements skill slot and attribute row locations only.
- Related entities are arrays because duplicate, split, budget, and conflict issues often involve
  more than one profession, attribute, skill, rule, or catalog fact.
- Source rule IDs are domain-owned names such as `profession.primary-required` or
  `skill.mode-restricted`, not ticket IDs.

`ValidationResult` must expose separate state instead of encoding workflow policy into one boolean:

- `valid`: true when there are no `error` issues.
- `complete`: false when incomplete editor-state issues are present.
- `resolved`: false when unresolved, unsupported, catalog-gap, or deferred-rule issues are present.
- `exhaustive`: false when any traversal or issue cap was hit.
- `counts`: issue counts by severity plus total emitted issues.
- `validatedAgainst`: build catalog version, profession/attribute catalog version, skill catalog
  version, and rule-engine version.
- `truncation`: null or a machine-readable limit signal.

Export/publish blocking is caller policy and must not be a hidden domain default. A caller may choose
to block on warnings or unresolved facts, but the engine reports facts consistently.

### Defaults And Rule Policies

- Missing primary profession is an incomplete-state warning in the editing profile. A secondary
  profession without a primary and identical non-null primary/secondary professions are errors.
- Missing secondary profession is allowed by default unless a complete-profile option or selected
  secondary-profession skill requires it.
- Auto attribute budget applies only to PvE builds and means the EPIC-03 level-20 maximum-applicable
  quest budget. PvP or unknown mode requires an explicit supported budget policy before overspend is
  judged.
- Attribute costs and supported purchased ranks come from `attributePointRules`; the engine must not
  duplicate the current maximum rank or cost table as constants.
- Duplicate attribute rows report the second and later rows. Cost/rank calculations use a
  documented first-row policy and avoid misleading cascade totals.
- Runtime skill-bar shape is checked even though `SkillBar` is a TypeScript tuple. Malformed
  external JSON returns issues, not exceptions.
- Null skill slots are allowed while editing. A blank or partial bar should produce aggregated
  incomplete-bar warnings rather than one noisy warning per empty slot.
- Repeated resolved player-usable skill IDs are errors. Unresolved/dispositioned IDs receive their
  unresolved status issue without a separate guessed duplicate verdict. Unsupported/special cases
  may emit a duplicate-uncertain warning when legality cannot be proven.
- The second and later elite skills are errors. The fourth and later PvE-only skills are errors in a
  PvE build. PvE-only skills in PvP are mode-restricted errors.
- `modeAvailability` is canonical for mode checks. `pveOnly`, `pvpOnly`, and split groups are
  consistency evidence; conflicting metadata warns instead of guessing.
- Split validation never substitutes the counterpart skill. It validates the authored selected skill
  and may attach counterpart evidence only as related context.
- Title and allegiance enforcement is deferred to EPIC-15. This sprint emits deferred warnings only
  when current catalog facts explicitly indicate title/allegiance-owned legality, and it must not
  infer side, title identity, or rank ownership from names or prose.
- Effective-rank `baseRankOverride` replaces the authored base before additive adjustments. The
  calculator does not clamp silently and does not derive equipment/title adjustments.

### Internal Flow

```text
Build + profession/attribute catalog slice + skill catalog slice + options
  -> build fresh validation context
  -> context/catalog integrity and budget policy checks
  -> profession and attribute rules
  -> skill-bar composition rules
  -> skill eligibility and mode rules
  -> canonical issue ordering and summaries
  -> ValidationResult

Build + profession/attribute catalog slice + attribute ID + overrides/adjustments
  -> calculateEffectiveAttributeRank
  -> resolved contribution breakdown or unresolved outcome
```

Issue ordering is fixed centrally: rule order, numeric-aware path order, location index, issue code,
and canonical related-entity key. It must not depend on catalog array order, object insertion order,
locale, wall clock, filesystem order, or configurable severity overrides.

## Implementation

### Phase 1: BW-0601 Validation Result Contracts (~12% of effort)

**Files:**

- `src/domain/validation.ts`
- `src/domain/index.ts`
- `test/domain/rule-engine-contracts.test.ts`
- `work/tickets/06-game-rule-engine/BW-0601-validation-result-contracts.md`

**Tasks:**

- [x] Add severity, issue code, path segment, typed location, related entity, source rule, result
      state, summary, truncation, and validated-against contracts.
- [x] Define rule-engine versioning and a minimal public MVP issue-code set. Add codes during later
      phases only with matching fixture tests and docs.
- [x] Add pure helpers for issue creation, related-entity canonicalization, numeric-aware issue
      ordering, summary counts, and derived `valid`/`complete`/`resolved`/`exhaustive` state.
- [x] Define severity semantics: errors are proven contradictions, warnings are incomplete,
      unresolved, unsupported, catalog-gap, or deferred states, and infos are advisory only.
- [x] Keep source-rule IDs domain-owned and avoid ticket IDs in runtime contracts.
- [x] Export only public contracts/helpers from `src/domain/index.ts`; do not expose mutable
      registries or callback surfaces.
- [x] Add contract tests for JSON-compatible output, path arrays, typed locations, plural related
      entities, stable sorting, warning-only `valid: true` examples, and truncation signals.

**Verification:**

- `npm run test:run -- test/domain/rule-engine-contracts.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Later rule phases can return one stable plain-data issue/result shape without
another public contract decision.

### Phase 2: BW-0602 Build Catalog Validation Context (~16% of effort)

**Files:**

- `src/domain/validation-context.ts`
- `src/domain/rule-engine.ts`
- `src/domain/index.ts`
- `test/domain/validation-context.test.ts`
- `test/fixtures/rule-engine/README.md`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0602-build-catalog-validation-context.md`

**Tasks:**

- [x] Define `BuildValidationInput`, `BuildValidationOptions`, narrow catalog aliases, internal
      context row/slot records, budget policy contracts, and catalog-version evidence.
- [x] Build fresh lookup maps by real catalog IDs for professions, attributes, skills, and split
      groups; never infer identity from template IDs, names, dense ranges, array positions, or
      source order.
- [x] Detect duplicate catalog IDs or split group IDs, emit ambiguity issues, and exclude ambiguous
      keys from resolved lookups so behavior cannot depend on first-record-wins order.
- [x] Preserve original authored IDs and indices for every primary, secondary, attribute row, and
      skill slot lookup.
- [x] Resolve auto, explicit level/quest, explicit point-total, and unresolved budget policies.
      Auto budget applies only to PvE and the EPIC-03 default level-20 maximum-quest policy.
- [x] Add defensive runtime bounds for authored attributes, malformed skill bars, emitted issues,
      non-finite numbers, and unsupported option shapes. Hitting a cap must set `exhaustive: false`.
- [x] Add a minimal `validateBuild` orchestrator with static built-in rule order, but no public
      extension callback API.
- [x] Add small fixtures that mimic EPIC-03/EPIC-04 semantic shapes plus one mandatory smoke test
      proving checked-in generated runtime catalog shapes satisfy the narrow inputs.
- [x] Prove repeated calls, frozen inputs, and catalog reorderings produce stable serialized results
      and no mutation.

**Verification:**

- `npm run test:run -- test/domain/validation-context.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Rule modules consume one deterministic context and never repeat ad hoc catalog-map,
budget, unresolved-reference, or mutation-prone logic.

### Phase 3: BW-0603 Profession And Attribute Rules (~18% of effort)

**Files:**

- `src/domain/rules/profession-attribute.ts`
- `src/domain/rule-engine.ts`
- `src/domain/validation-context.ts`
- `src/domain/index.ts`
- `test/domain/profession-attribute-rules.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0603-profession-and-attribute-rules.md`

**Tasks:**

- [x] Implement missing primary, secondary-without-primary, duplicate pair, unresolved primary, and
      unresolved secondary rules with non-cascading behavior.
- [x] Handle identical primary/secondary authored IDs that are also unresolved by reporting both the
      duplicate authored state and unresolved references deterministically.
- [x] Validate attribute row IDs, duplicate rows, finite non-negative integer ranks, purchased-rank
      support, and rank-cost table gaps using catalog facts.
- [x] Enforce primary-only attributes against the selected primary profession and other known
      attributes against the selected primary/secondary profession set.
- [x] Defer wrong-profession checks when prerequisite profession truth is missing, ambiguous, or
      unresolved.
- [x] Calculate spend from unique rows with valid resolved costs using the documented first-row
      duplicate policy. Emit one overspend issue only when both spend and budget are resolved.
- [x] Cover legal single/dual-profession builds, partial state, duplicate professions, unresolved
      professions, duplicate attributes, invalid ranks, unsupported rank costs, budget gaps,
      primary-only misuse, wrong-profession attributes, explicit budgets, PvE auto budget, PvP
      unresolved budget, and overspend.

**Verification:**

- `npm run test:run -- test/domain/profession-attribute-rules.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Profession and attribute legality is explained from EPIC-03 semantic facts, with
clear severity and no false cascades from unresolved prerequisites.

### Phase 4: BW-0604 Skill-Bar Composition Rules (~15% of effort)

**Files:**

- `src/domain/rules/skill-bar.ts`
- `src/domain/rule-engine.ts`
- `src/domain/validation-context.ts`
- `src/domain/index.ts`
- `test/domain/skill-bar-rules.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0604-skill-bar-composition-rules.md`

**Tasks:**

- [x] Defensively validate runtime skill-bar shape against `SKILL_BAR_SLOT_COUNT` while preserving
      bounded evidence from the first eight slots.
- [x] Emit predictable aggregate incomplete-bar issues for blank and partial bars under the default
      editing profile; avoid one warning per empty slot unless a complete-profile option demands it.
- [x] Emit slot-local unresolved or dispositioned skill issues without deleting, compacting, or
      replacing slots.
- [x] Detect duplicate resolved player-usable skill IDs. Report second and later occurrences as
      errors with related evidence for all conflicting slots.
- [x] Count only resolved, internally consistent catalog facts for elite and PvE-only limits. Mark
      second/later elite slots and fourth/later PvE-only slots.
- [x] Report non-player records as errors and unsupported records as warnings without treating
      catalog absence as proof of either state.
- [x] Define composition behavior for multi-rule collisions, such as duplicate elite, title PvE-only,
      unsupported repeated skill, malformed bar plus populated slots, and unresolved duplicate IDs.
- [x] Cover full, partial, blank, malformed-length, unresolved, dispositioned, duplicate known,
      duplicate elite, unsupported/non-player, and four-PvE-only bars with exact issue ordering.

**Verification:**

- `npm run test:run -- test/domain/skill-bar-rules.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Structural and count rules produce stable slot-local issues from catalog facts
without depending on profession, mode, UI state, or template decoding.

### Phase 5: BW-0605 Skill Eligibility And Mode Rules (~18% of effort)

**Files:**

- `src/domain/rules/skill-eligibility.ts`
- `src/domain/rule-engine.ts`
- `src/domain/validation-context.ts`
- `src/domain/index.ts`
- `test/domain/skill-eligibility-rules.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0605-skill-eligibility-and-mode-rules.md`

**Tasks:**

- [x] Validate resolved skill profession ownership against selected primary and secondary
      professions; defer when build profession truth or skill lookup truth is unresolved.
- [x] Permit professionless common, special, title, and no-attribute skills only when catalog
      classification explicitly supports that interpretation.
- [x] Validate skill attribute metadata against the profession/attribute slice without requiring an
      authored positive allocation or rank. Warn on missing or contradictory catalog joins.
- [x] Validate `modeAvailability` against `Build.mode`; cross-check `pveOnly`/`pvpOnly` flags and
      report metadata conflicts without guessing a restriction.
- [x] Inspect split-group membership for requested-mode member presence, duplicate members,
      over-broad groups, unresolved counterpart records, and contradictory availability flags.
- [x] Emit unknown-mode warnings only when selected restricted or split skills require a concrete
      mode.
- [x] Emit title/allegiance deferred warnings only from explicit catalog facts. Do not infer title,
      rank, side, or allegiance semantics from names, progression keys, or descriptions.
- [x] Cover primary skill, secondary skill, missing-secondary dependency, unrelated profession skill,
      professionless common/special/title skills, no-attribute skill, skill/profession metadata
      conflicts, PvE-only in PvP, PvP-only in PvE, unknown mode, complete/incomplete/duplicate split
      groups, unsupported records, non-player records, title deferral, and unresolved skill joins.

**Verification:**

- `npm run test:run -- test/domain/skill-eligibility-rules.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** The engine rejects only catalog-proven profession/mode contradictions, exposes
catalog and title gaps as warnings, and never rewrites a selected skill to another record.

### Phase 6: BW-0606 Effective Attribute Rank Calculator (~11% of effort)

**Files:**

- `src/domain/effective-attribute-rank.ts`
- `src/domain/index.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `work/tickets/06-game-rule-engine/BW-0606-effective-attribute-rank-calculator.md`

**Tasks:**

- [x] Add effective-rank input, adjustment kind, contribution, resolved result, and unresolved
      result contracts.
- [x] Resolve a unique valid authored allocation as base rank and a known unallocated attribute as
      rank zero. Duplicate, malformed, or unresolved attribute state must produce a typed
      unresolved outcome.
- [x] Apply a finite non-negative integer base override before canonically ordered finite integer
      additive adjustments.
- [x] Return authored base, base source, override, every applied adjustment, final effective rank,
      and unresolved reasons where applicable.
- [x] Reject invalid overrides, invalid adjustments, unsafe integer overflow, and negative final
      results without throwing or clamping.
- [x] Keep headgear, rune, weapon, title, temporary, and other adjustments as caller-consolidated
      arithmetic inputs. Do not derive or validate their equipment/title stacking semantics.
- [x] Cover allocated zero/nonzero, unallocated, unknown attribute, duplicate allocations, invalid
      base, invalid override, override precedence, positive/negative adjustment, canonical
      adjustment ordering, overflow, and negative-final cases.

**Verification:**

- `npm run test:run -- test/domain/effective-attribute-rank.test.ts`
- `npm run typecheck`
- `npm run verify`

**Phase Gate:** Rank calculation is reusable by validation, future tooltips, and later equipment or
title rule modules without encoding those later schemas prematurely.

### Phase 7: BW-0607 Fixtures, Integration, Documentation, And Closeout (~10% of effort)

**Files:**

- `test/fixtures/rule-engine/README.md`
- `test/fixtures/rule-engine/catalogs.ts`
- `test/fixtures/rule-engine/builds.ts`
- `test/domain/rule-engine.test.ts`
- `test/domain/rule-engine-contracts.test.ts`
- `test/domain/validation-context.test.ts`
- `test/domain/profession-attribute-rules.test.ts`
- `test/domain/skill-bar-rules.test.ts`
- `test/domain/skill-eligibility-rules.test.ts`
- `test/domain/effective-attribute-rank.test.ts`
- `README.md`
- `compendium/game-rule-engine.md`
- `compendium/README.md`
- `work/tickets/06-game-rule-engine/*.md`
- `work/sprints/SPRINT-007.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [x] Add a top-level scenario matrix for valid build, blank build, partial build, invalid
      profession state, duplicate attributes, overspend, wrong-profession skill, duplicate ordinary
      skill, duplicate elite, too many PvE-only skills, mode-restricted skill, split ambiguity,
      unsupported/non-player skills, unresolved IDs, and effective-rank edge cases.
- [x] Assert exact severity, code, path, location, related entities, source rule, counts, result
      state, truncation state, and deterministic order for individual and combined failures.
- [x] Add no-mutation tests for frozen builds, catalogs, options, and rank-adjustment arrays.
- [x] Add catalog-reorder and duplicate-catalog-key tests so lookup behavior is not source-order
      dependent.
- [x] Add one mandatory generated runtime catalog smoke test proving EPIC-03/EPIC-04 checked-in
      generated catalog shapes satisfy the narrow validation inputs without importing generated data
      from production domain modules.
- [x] Document fixture intent and identify which cases are MVP rules versus placeholders for later
      equipment/title epics.
- [x] Add `compendium/game-rule-engine.md` documenting public API, severity, result state,
      issue-ordering, budget defaults, duplicate policy, split/mode behavior, effective-rank
      behavior, unresolved-ID handling, and deferred EPIC-15/equipment rules. Index it from
      `compendium/README.md` and add a concise README pointer if useful.
- [x] Update BW-0601 through BW-0607, EPIC-06, `work/sprints/SPRINT-007.md`, and
      `work/sprints/ledger.tsv` only after execution gates pass.
- [x] Run the full verification set and confirm no app, template-compatibility, generated catalog,
      QA, source snapshot, ingestion, dependency, or unrelated files changed incidentally.

**Verification:**

- `npm run test:run -- test/domain/rule-engine-contracts.test.ts test/domain/validation-context.test.ts test/domain/profession-attribute-rules.test.ts test/domain/skill-bar-rules.test.ts test/domain/skill-eligibility-rules.test.ts test/domain/effective-attribute-rank.test.ts test/domain/rule-engine.test.ts`
- `npm run typecheck`
- `npm run verify`
- `python3 -m unittest scripts/test_ticket_burn.py`
- `git status --short`

**Phase Gate:** The rule engine is deterministic, fixture-covered, documented, exported, and
traceable, with planning and ticket-burn records synchronized.

## Files Summary

| File                                                                      | Action           | Purpose                                                                                                                                         |
| ------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/validation.ts`                                                | Create           | Public issue/result contracts, severity model, codes, rule IDs, result state, truncation, and ordering helpers.                                 |
| `src/domain/validation-context.ts`                                        | Create           | Internal per-call lookup context, narrow catalog inputs, duplicate catalog detection, unresolved references, budget policy, and runtime bounds. |
| `src/domain/rule-engine.ts`                                               | Create           | Top-level `validateBuild` orchestration over static built-in rule modules.                                                                      |
| `src/domain/rules/profession-attribute.ts`                                | Create           | Profession pair, attribute ownership, rank, point-cost, and budget rules.                                                                       |
| `src/domain/rules/skill-bar.ts`                                           | Create           | Skill-bar shape, incomplete slots, unresolved/dispositioned IDs, duplicate, elite, PvE-only, unsupported, and non-player rules.                 |
| `src/domain/rules/skill-eligibility.ts`                                   | Create           | Skill profession, attribute, mode, split, metadata-conflict, and deferred title/allegiance rules.                                               |
| `src/domain/effective-attribute-rank.ts`                                  | Create           | Effective-rank calculator and contribution breakdown contracts.                                                                                 |
| `src/domain/index.ts`                                                     | Modify           | Export stable public validation and rank APIs.                                                                                                  |
| `test/fixtures/rule-engine/`                                              | Create           | Small semantic catalog and build fixtures for deterministic domain tests.                                                                       |
| `test/domain/rule-engine-contracts.test.ts`                               | Create           | Contract shape, result state, issue code, location, related entity, truncation, and sorting tests.                                              |
| `test/domain/validation-context.test.ts`                                  | Create           | Context lookup, ambiguity, budget, runtime-shape, generated-catalog smoke, reorder, and no-mutation tests.                                      |
| `test/domain/profession-attribute-rules.test.ts`                          | Create           | Profession, attribute, rank, primary-only, budget, duplicate, cascade, and unresolved tests.                                                    |
| `test/domain/skill-bar-rules.test.ts`                                     | Create           | Skill-bar shape, partial bar, unresolved/dispositioned IDs, duplicate, elite, PvE-only, unsupported, and non-player tests.                      |
| `test/domain/skill-eligibility-rules.test.ts`                             | Create           | Skill profession, attribute, mode, split, title deferral, metadata conflict, and unresolved tests.                                              |
| `test/domain/effective-attribute-rank.test.ts`                            | Create           | Base rank, unallocated rank, override, adjustment, duplicate, overflow, and unresolved tests.                                                   |
| `test/domain/rule-engine.test.ts`                                         | Create           | End-to-end validation matrix and multi-rule ordering tests.                                                                                     |
| `README.md`                                                               | Modify if useful | Point to the runtime-eligible domain validation API after implementation.                                                                       |
| `compendium/game-rule-engine.md`                                          | Create           | Durable rule semantics, defaults, limitations, and deferred-scope record.                                                                       |
| `compendium/README.md`                                                    | Modify           | Index the game-rule-engine note.                                                                                                                |
| `work/tickets/06-game-rule-engine/*.md`                                   | Modify           | Planning/execution traceability for BW-0601 through BW-0607 and EPIC-06.                                                                        |
| `work/sprints/SPRINT-007.md`                                              | Create/modify    | Sprint planning and execution record.                                                                                                           |
| `work/sprints/ledger.tsv`                                                 | Modify           | Sprint lifecycle tracking.                                                                                                                      |
| `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-06-result.json` | Create           | Required ticket-burn planning result manifest.                                                                                                  |

## Definition of Done

- [x] `src/domain` exposes a pure `validateBuild` API and `calculateEffectiveAttributeRank` API
      without importing React, DOM/browser APIs, storage, network clients, `src/app`,
      `src/template-compatibility`, generated data, manifests, QA reports, source snapshots,
      Python data tooling, or wiki APIs.
- [x] `ValidationIssue` includes deterministic severity, code, message, segment path, typed
      location, related entities, and domain-owned source rule.
- [x] `ValidationResult` separates `valid`, `complete`, `resolved`, and `exhaustive` from
      workflow export/publish policy.
- [x] Normal invalid, incomplete, unresolved, stale-catalog, malformed-runtime-shape, unsupported
      option, and unsupported-budget states return structured issues instead of thrown exceptions.
- [x] Context assembly centralizes profession, attribute, skill, split-group, selected profession,
      budget, catalog-version, duplicate-catalog, and unresolved-reference facts.
- [x] Duplicate catalog keys, non-contiguous IDs, template/catalog namespace separation, catalog
      reordering, repeated calls, issue caps, traversal caps, and frozen-input purity are tested.
- [x] Profession rules distinguish legal, incomplete, unresolved, and impossible primary/secondary
      states without false cascades.
- [x] Attribute rules enforce duplicate rows, finite integer ranks, purchased-rank support,
      primary-only restrictions, wrong-profession rows, configured point budgets, and unresolved
      references from EPIC-03 facts.
- [x] Skill-bar rules enforce eight-slot shape, preserve empty slots, detect unresolved or
      dispositioned slots, detect duplicate resolved player skills, enforce one elite, enforce the
      three-PvE-only limit, and handle unsupported/non-player records.
- [x] Skill eligibility rules enforce profession ownership, attribute metadata availability,
      professionless classifications, PvE/PvP restrictions, split-skill ambiguity, metadata
      conflicts, unsupported/non-player states, and explicit title/allegiance deferrals.
- [x] Effective-rank calculation covers allocated, unallocated, overridden, adjusted, duplicate,
      unknown, malformed, overflow, and negative-final cases with resolved breakdowns or typed
      unresolved reasons.
- [x] Title-rank, allegiance, equipment, rune, insignia, armor, weapon, modifier, hero, party, and
      UI validation are deferred explicitly and no premature schemas or callbacks are shipped.
- [x] Small offline fixtures cover the full MVP matrix and tests assert severity, code, path,
      location, related entities, source rule, result state, counts, truncation state, and ordering.
- [x] At least one generated runtime catalog smoke test proves checked-in EPIC-03 and EPIC-04
      runtime catalog shapes satisfy the narrow validation inputs.
- [x] `compendium/game-rule-engine.md`, README pointer if added, public exports, tests, tickets,
      sprint, ledger, and result manifest agree on rules, defaults, assumptions, and deferred scope.
- [x] Focused rule-engine tests, `npm run typecheck`, `npm run verify`, and
      `python3 -m unittest scripts/test_ticket_burn.py` pass.
- [x] BW-0601 through BW-0607 and EPIC-06 are marked done only after implementation gates pass.
- [x] No commit is created unless separately requested.

## Risks & Mitigations

| Risk                                                                         | Likelihood | Impact | Mitigation                                                                                                                                      |
| ---------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Callers mistake `valid` for complete or exportable.                          | High       | High   | Result separately exposes `valid`, `complete`, `resolved`, and `exhaustive`; docs and tests include warning-only valid results.                 |
| PvE 200-point default creates false results for PvP or unknown mode.         | Medium     | High   | Auto budget applies only to PvE; PvP/unknown require explicit budget before overspend is judged.                                                |
| Catalog gaps create false legality errors.                                   | Medium     | High   | Errors require resolved semantic facts; unknown joins, missing costs, ambiguous IDs, unsupported records, and incomplete splits warn.           |
| Partial editor states produce noisy cascades.                                | High       | Medium | Defer dependent rules when prerequisites are unresolved, aggregate empty bar issues, and test blank/partial builds.                             |
| Duplicate-skill legality is under-specified for unsupported/special records. | Medium     | Medium | Error repeated resolved player-usable skills; warn or rely on primary status issue for unsupported, special, unresolved, or non-player records. |
| Split handling silently changes authored skill IDs.                          | Medium     | High   | Validate the selected record only; attach counterpart evidence without substitution or mutation.                                                |
| Title/allegiance rules are implemented from weak inference.                  | High       | High   | Emit deferred warnings only from explicit catalog facts and leave enforcement to EPIC-15.                                                       |
| Public context or extension callbacks freeze internals.                      | Medium     | High   | Keep context internal to MVP and use static built-in modules, not runtime callback registration.                                                |
| Issue-code churn breaks later UI work.                                       | Medium     | High   | Lock a minimal tested MVP code set, add new codes with fixtures, and keep messages non-normative.                                               |
| Runtime-cast builds bypass TypeScript tuple and numeric types.               | Medium     | Medium | Add defensive finite-integer, array, length, traversal, and issue-cap checks that return issues.                                                |
| Generated catalog shape assumptions are wrong.                               | Medium     | High   | Add early mandatory smoke coverage against checked-in runtime catalog shapes.                                                                   |
| Rank adjustments encode premature equipment/title stacking semantics.        | Medium     | High   | Treat adjustments as caller-consolidated arithmetic facts and return all parts without deriving them.                                           |

## Security Considerations

- Treat builds, IDs, ranks, mode values, options, catalog slices, split groups, and rank adjustments
  as untrusted plain data at the public boundary.
- Keep validation synchronous, pure, offline, clock-free, locale-free, filesystem-free, storage-free,
  and network-free.
- Do not import or execute generated artifacts, source snapshots, Python data tooling, template
  codec dependencies, dynamic rule modules, or caller-provided callbacks.
- Bound traversal, issue output, related-entity output, and messages. Emit a machine-readable
  truncation signal when bounds prevent exhaustive validation.
- Use finite safe integers for IDs, ranks, budgets, and adjustments. Reject invalid values with
  issues instead of `NaN`, `Infinity`, clamping, or throwing for ordinary authored input.
- Do not echo full builds, full catalog records, provenance prose, raw source text, stacks, absolute
  paths, secrets, or unbounded user-authored values in validation messages.
- Messages are plain text only. Future UI must escape them and must not treat catalog/user text as
  HTML or executable content.
- Never mutate a build to "fix" invalid input. Never replace unknown IDs, select split variants,
  clamp ranks, merge duplicate rows, or discard skill slots as validation behavior.

## Dependencies

- Completed `SPRINT-001` / `EPIC-00` for strict TypeScript/Vitest tooling, branded IDs, domain
  boundaries, `Build`, and canonical `npm run verify`.
- Completed `SPRINT-004` / `EPIC-03` for profession, attribute, template crosswalk, primary-only,
  purchased-rank, level total, quest bonus, and default PvE budget facts.
- Completed `SPRINT-005` / `EPIC-04` for skill IDs, classifications, profession/attribute joins,
  mode availability, split groups, dispositions, progression dependency keys, and runtime skills
  catalog.
- Completed `SPRINT-006` / `EPIC-05` for the separation between loss-aware template documents and
  semantic `Build` validation.
- Repository tooling: Node.js `>=22.11.0`, npm `>=11.10.1`, TypeScript, ESLint, Vitest, Vite,
  Python 3, and the existing `.venv-data` setup for `npm run verify`.
- No new npm package, live Guild Wars Wiki access, source refresh, generated data promotion, or
  app/UI implementation is required.

## Open Questions

No open question blocks execution. Defaults for this sprint are:

1. Use `validateBuild` and `calculateEffectiveAttributeRank` as the public API names unless an
   implementation conflict appears.
2. Use segment-array paths as the domain contract; string formatting belongs outside `src/domain`.
3. Keep `valid` but define it strictly as no errors, with separate `complete`, `resolved`, and
   `exhaustive` fields.
4. Keep validation context internal to the MVP and do not expose runtime extension callbacks.
5. Treat incomplete editor state and unresolved references as warnings by default.
6. Apply the automatic 200-point budget only to PvE level-20 maximum-quest policy; require explicit
   budget policy for PvP and unknown mode.
7. Treat repeated resolved player-usable skill IDs as errors; do not invent duplicate errors for
   unresolved or non-player records.
8. Emit title/allegiance deferred warnings only when explicit catalog facts justify them; EPIC-15
   owns enforcement.
9. Keep effective-rank adjustments caller-consolidated and do not clamp final ranks silently.
