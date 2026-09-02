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

This sprint adds a framework-neutral game-rule service that explains whether a `Build` is valid,
incomplete, unresolved against its catalogs, or dependent on a later rule domain. It consumes
caller-supplied semantic slices of the promoted EPIC-03 professions/attributes catalog and EPIC-04
skills catalog, evaluates deterministic profession, attribute, skill-bar, skill-eligibility, and
mode rules, and calculates effective attribute ranks without UI, storage, network, template-codec,
or generated-artifact dependencies.

The increment is a domain service, not an editor or import workflow. It does not mutate or repair
builds, select replacement skills, convert raw template IDs to catalog IDs, decode templates, render
validation UI, validate equipment semantics, model account ownership, implement title/allegiance
eligibility, calculate primary-attribute skill effects, or fetch data. `src/app/**`,
`src/template-compatibility/**`, `scripts/data/**`, and generated catalog/audit artifacts remain
unchanged.

The sprint locks these strategic decisions:

- Validation distinguishes **proven contradictions** from **incomplete or unresolved knowledge**.
  `error` means a rule can prove the authored state illegal with the supplied semantic facts;
  `warning` means the build is partial, an ID or budget cannot be resolved, or a later epic owns the
  missing rule; `info` is reserved for non-legality analysis. `ValidationResult.valid` means “no
  proven errors,” not “complete” or “fully resolved.”
- Validation is non-destructive. Unknown numeric catalog IDs remain on `Build` and produce
  path-specific unresolved issues. Raw template IDs remain in EPIC-05 template documents until an
  application service resolves them; the rule engine does not cast template ID namespaces into
  catalog ID namespaces or import the compatibility adapter.
- Full promoted catalogs structurally satisfy small validation-catalog interfaces containing only
  the semantic sections the engine needs. This keeps tests small and prevents runtime validation
  from depending on manifests, QA reports, provenance workflows, source snapshots, or Python.
- Issue identity is code/path/rule based, not message based. Issues include stable severity, code,
  segment-based path, optional attribute or skill slot, related entities, and source-rule ID.
  Messages are deterministic plain-text explanations but are not final UI copy or localization keys.
- Rule execution and issue ordering are centralized. Built-in rule groups use fixed order bands;
  paths compare segment-by-segment with numeric indices sorted numerically; code and related entity
  keys break ties. Catalog array order, object insertion order, and locale never affect the result.
- The default attribute-budget policy is deliberately generous and narrow: a PvE build with no
  caller override uses EPIC-03's level-20 maximum-applicable-quest budget. PvP and unknown-mode
  builds require an explicit level/quest policy before overspend can be proven. Missing budget facts
  warn rather than causing a guessed error.
- An allocated skill attribute is not required to equip a skill. Skill attribute metadata is checked
  for catalog consistency and later tooltip rank resolution; profession eligibility is based on the
  skill's profession plus explicit professionless classification facts. Unallocated known
  attributes have effective rank zero.
- Repeated resolved player-usable skill IDs are errors. Repeated unresolved or non-player records do
  not get a separate guessed duplicate verdict; their unresolved/non-player status is sufficient.
  Repeated known unsupported or special records receive a duplicate-uncertain warning where the
  current facts are not safe to classify.
- Mode validation never silently substitutes the other member of a PvE/PvP split. The authored
  skill remains selected; mismatched availability is an error, unknown mode or incomplete split
  metadata is a warning, and a known counterpart may be attached only as related context.
- Title and allegiance rules remain explicit deferred warnings because EPIC-04 supplies title flags
  and rank dependency keys but not the title identity, side, ownership, or eligibility model needed
  for correct enforcement. EPIC-15 can add a rule module without changing issue locations or the
  top-level validation call.
- Effective-rank calculation reports its parts and never clamps silently. A caller may override the
  authored base rank for previews and supply consolidated additive adjustments tagged as headgear,
  rune, weapon, title, temporary, or other. EPIC-10 through EPIC-15 remain responsible for deriving
  and validating those adjustments and their stacking semantics.

## Use Cases

1. **Validate a complete build**: Given a build and caller-supplied catalog slices, return no errors
   for a legal profession pair, attribute allocation, eight-slot skill bar, and game mode.
2. **Support an editor-in-progress**: Report missing primary profession and empty skill slots as
   warnings while still evaluating independent facts and returning all useful issues in one pass.
3. **Explain profession and attribute errors**: Identify duplicate professions, secondary-without-
   primary state, primary-only misuse, wrong-profession attributes, invalid purchased ranks,
   duplicate allocations, and point overspend at stable paths.
4. **Explain skill-bar composition errors**: Identify a runtime bar whose shape is not eight slots,
   repeated known player skills, excess elites, and more than three PvE-only skills without deleting
   or moving any slot.
5. **Explain skill eligibility**: Report skills from unrelated professions, malformed catalog joins,
   unsupported/non-player records, and professionless records whose classification cannot prove
   eligibility.
6. **Validate game mode conservatively**: Reject catalog-proven PvE-only skills in PvP and PvP-only
   skills in PvE, warn when mode is unknown, and expose incomplete split groups without choosing a
   replacement variant.
7. **Preserve unresolved authored references**: Return one location-specific warning for each
   unknown profession, attribute, or skill ID while leaving the original number untouched and
   continuing checks that do not depend on that lookup.
8. **Calculate a tooltip rank**: Resolve an allocated or unallocated attribute's base rank, apply an
   optional preview override and validated additive inputs, and return the effective rank plus an
   auditable contribution breakdown.
9. **Add later rule groups**: Let equipment, title, hero, party, and advanced-analysis epics conform
   to the same internal rule protocol and stable issue contract without importing UI concerns or
   rewriting the MVP rule groups.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Public contracts | Validation severity, codes, locations, entity references, results, catalog-version evidence, budget policy, and effective-rank outcomes. | React state, component props, localization, HTML, storage records, template documents, vendor objects, or thrown errors for ordinary invalid builds. |
| Context | Caller-supplied `Build`, minimal profession/attribute and skill catalog slices, deterministic ID maps, resolved budget, context diagnostics, and code-owned input limits. | Runtime JSON fetching, generated-file imports, whole-catalog schema validation, caching across calls, global mutable registries, or source/QA artifact reads. |
| MVP rules | Profession pair, attribute ownership/primary-only/rank/budget, bar shape/completeness/duplicate/elite/PvE-only, skill profession/catalog-attribute/mode eligibility, and deferred title warnings. | Campaign/account ownership, acquisition, allegiance identity, title ownership/rank eligibility, equipment legality, heroes, parties, consumables, primary-attribute effect calculators, or build recommendations. |
| Calculation | Authored base rank, zero for a known unallocated attribute, preview base override, consolidated tagged adjustments, and explicit unresolved outcomes. | Deriving rune/headgear/weapon/title facts, stacking rules, temporary-effect simulation, effective skill costs, weapon proc caps, or silent range clamps. |
| Tests and docs | Small offline semantic fixtures, rule-focused tests, generated-catalog compatibility smoke coverage, boundary tests, durable compendium note, and planning closeout. | Live wiki access, raw snapshots, large community build corpora, UI snapshots, generated-catalog rewrites, or benchmark infrastructure. |

### Layering And Data Flow

```text
caller-owned Build
caller-owned EPIC-03 semantic slice ----+
caller-owned EPIC-04 semantic slice ----+--> createBuildValidationContext
optional attribute-budget policy -------+      |
                                               +-- immutable lookup maps
                                               +-- catalog version evidence
                                               +-- resolved/unresolved budget
                                               +-- bounded context issues
                                                        |
                         fixed ordered domain rule groups+
                                                        v
                                      validateBuild -> ValidationResult
                                                        |
                                                        +-- deterministic issues
                                                        +-- severity counts
                                                        +-- valid = no errors

Build + attribute ID + preview/bonus inputs
  -> calculateEffectiveAttributeRank -> resolved parts or typed unresolved result
```

All new production modules live under `src/domain`. They may import existing domain contracts and
pure catalog lookup semantics but must not import `src/app`, `src/template-compatibility`, React,
DOM/browser globals, storage, network clients, data scripts, generated JSON, manifests, QA reports,
or source snapshots. The existing domain TypeScript project and ESLint boundary enforce this
direction.

### Validation Contract

`src/domain/validation.ts` defines plain JSON-compatible public output. The implementation may use
readonly maps internally, but no map, set, callback, exception, catalog record, or mutable build
reference appears in `ValidationResult`.

```ts
type ValidationSeverity = "error" | "warning" | "info";
type ValidationPath = readonly (string | number)[];

type ValidationSlot =
  | { readonly kind: "attribute"; readonly index: number }
  | { readonly kind: "skill"; readonly index: number };

interface ValidationEntityReference {
  readonly kind: "build" | "profession" | "attribute" | "skill" | "catalog" | "rule";
  readonly id: string | number;
}

interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly code: ValidationIssueCode;
  readonly message: string;
  readonly path: ValidationPath;
  readonly slot: ValidationSlot | null;
  readonly relatedEntities: readonly ValidationEntityReference[];
  readonly sourceRule: ValidationRuleId;
}

interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly counts: { readonly error: number; readonly warning: number; readonly info: number };
  readonly validatedAgainst: {
    readonly buildCatalogVersion: string;
    readonly professionAttributeCatalogVersion: string;
    readonly skillCatalogVersion: string;
  };
}
```

Root is `[]`; examples are `["primaryProfessionId"]`, `["attributes", 2, "rank"]`, and
`["skillBar", 5]`. Paths refer to the authored build shape, not display labels. Affected indices are
zero-based. `relatedEntities` is canonically sorted and retains unresolved numeric IDs. Messages do
not contain full build names, serialized inputs, provenance prose, or unbounded catalog text.

The initial issue-code families are locked as follows. Implementations may split a code only if the
sprint document and fixtures are amended together before callers depend on it.

| Family | Codes | Default Severity |
| --- | --- | --- |
| Context/input | `VALIDATION_INPUT_LIMIT_EXCEEDED`, `CATALOG_ID_AMBIGUOUS`, `RULE_CONFIGURATION_INVALID` | Error |
| Profession | `PRIMARY_PROFESSION_REQUIRED`, `PROFESSION_UNRESOLVED` | Warning |
| Profession | `SECONDARY_WITHOUT_PRIMARY`, `PROFESSION_PAIR_DUPLICATE` | Error |
| Attribute | `ATTRIBUTE_UNRESOLVED`, `ATTRIBUTE_ELIGIBILITY_DEFERRED`, `ATTRIBUTE_COST_UNRESOLVED`, `ATTRIBUTE_BUDGET_UNRESOLVED` | Warning |
| Attribute | `ATTRIBUTE_DUPLICATE`, `ATTRIBUTE_RANK_INVALID`, `ATTRIBUTE_RANK_UNSUPPORTED`, `ATTRIBUTE_WRONG_PROFESSION`, `PRIMARY_ATTRIBUTE_REQUIRES_PRIMARY_PROFESSION`, `ATTRIBUTE_POINTS_OVERSPENT` | Error |
| Skill structure | `SKILL_BAR_INCOMPLETE`, `SKILL_UNRESOLVED`, `SKILL_UNSUPPORTED`, `SKILL_DUPLICATE_UNCERTAIN` | Warning |
| Skill structure | `SKILL_BAR_SIZE_INVALID`, `SKILL_NOT_PLAYER_USABLE`, `SKILL_DUPLICATE`, `ELITE_SKILL_LIMIT_EXCEEDED`, `PVE_ONLY_SKILL_LIMIT_EXCEEDED` | Error |
| Skill eligibility | `SKILL_ELIGIBILITY_DEFERRED`, `SKILL_ATTRIBUTE_UNRESOLVED`, `SKILL_CATALOG_METADATA_CONFLICT`, `SKILL_MODE_REQUIRED`, `SKILL_MODE_VARIANT_UNRESOLVED`, `TITLE_SKILL_RULES_DEFERRED` | Warning |
| Skill eligibility | `SKILL_WRONG_PROFESSION`, `SKILL_MODE_RESTRICTED` | Error |

Errors are suitable for a caller's “known-invalid” gate. Warnings never authorize destructive
cleanup and do not prevent EPIC-05 exact-source replay. A future publish/export workflow may require
zero warnings, but that is an explicit caller policy rather than a hidden change in severity.

### Validation Input And Context

The public input accepts the complete catalog types through narrow structural aliases:

```ts
type ProfessionAttributeValidationCatalog = Pick<
  ProfessionAttributeCatalog,
  "catalogVersion" | "professions" | "attributes" | "attributePointRules"
>;

type SkillValidationCatalog = Pick<
  SkillCatalog,
  "catalogVersion" | "skills" | "splitGroups"
>;

type AttributeBudgetPolicy =
  | { readonly kind: "auto" }
  | {
      readonly kind: "level-and-quest";
      readonly level: number;
      readonly questBonus: "none" | "maximum-applicable";
    }
  | { readonly kind: "unresolved" };
```

`validateBuild` takes one object containing `build`, `professionAttributes`, `skills`, and optional
`configuration`. Absence of configuration is identical to `{ attributeBudget: { kind: "auto" } }`.
Auto resolves only a PvE build to the catalog's `defaultPveLevel20.totalWithMaximumQuestBonus`; for
PvP or unknown mode it yields `ATTRIBUTE_BUDGET_UNRESOLVED` when nonzero purchased ranks need a
budget. An explicit level policy uses the catalog's level totals and maximum-applicable quest bonus;
an unsupported level or malformed policy is reported, never guessed.

Context construction indexes records by numeric catalog ID and split group by stable string ID. It
does not assume dense ranges, equality with template IDs, or array-position identity. Duplicate
catalog keys produce `CATALOG_ID_AMBIGUOUS`; the ambiguous key is excluded from resolved lookup so
rule behavior cannot depend on first-record-wins order. The context records all three catalog
versions in the result but does not compare `Build.catalogVersion` directly to either input catalog:
the build has one historical version field while the two catalogs have independent versions. A
later persistence migration may define a composite catalog pin without changing this result
evidence.

Context creation and rule traversal enforce conservative code-owned bounds for runtime-invalid
shapes: at most 64 authored attribute rows, inspection of at most the eight expected skill slots plus
bounded evidence for a shape error, and at most 256 emitted issues. Exceeding a bound produces one
deterministic input-limit error and truncates further work in the affected collection; it never
throws or allocates in proportion to an attacker-controlled declared size. Promoted catalogs are
trusted release artifacts, but duplicate IDs and non-finite authored identifiers/ranks still receive
defensive handling.

### Rule Semantics

Rules run in these fixed bands: context `0-99`, professions `100-199`, attributes `200-299`, skill
composition `300-399`, skill eligibility/mode `400-499`, equipment `500-599`, title/allegiance
`600-699`, and advanced analysis `700-799`. This sprint implements the first five bands. Later bands
are reserved architecture, not placeholder issues. Each internal rule has a unique stable ID and
order; the top-level orchestrator collects and canonicalizes issues once.

Profession and attribute rules use these policies:

- A missing primary profession is a warning. A secondary without a primary and identical non-null
  primary/secondary IDs are errors. Any unknown non-null profession gets its own unresolved warning;
  dependent ownership checks defer instead of adding speculative wrong-profession errors.
- Attribute IDs resolve only through the supplied attribute slice. Duplicate IDs report the second
  and subsequent rows and contribute to point cost once, using the first row, to avoid misleading
  cascade totals.
- Ranks must be finite non-negative integers. The catalog's purchased-rank table defines supported
  purchased ranks; the engine does not hardcode `12`. A rank beyond the table's proven domain is an
  error. A hole inside that domain is a catalog-gap warning and is omitted from the spend total.
- A primary-only attribute is legal only when its owner is the selected primary profession. Other
  known attributes must belong to the selected primary or secondary profession. If the necessary
  profession is missing or unresolved, eligibility warns as deferred rather than guessing.
- Overspend uses only unique rows with valid resolved costs. It reports total cost and resolved
  budget in one root attribute issue; it does not rewrite ranks or suggest an allocation.

Skill composition and eligibility use these policies:

- The runtime value is checked for exactly eight slots even though `SkillBar` enforces that shape at
  compile time. A malformed runtime array receives one shape error; only the first eight bounded
  entries are examined. Null slots are legal during editing and produce one bar-level incomplete
  warning containing the empty count.
- Known player-usable exact skill IDs may appear once. The second and subsequent occurrences receive
  duplicate errors. A known unsupported or special record whose repeat legality is not provable
  receives `SKILL_DUPLICATE_UNCERTAIN`; unknown and non-player IDs receive their primary status
  issues without a separate duplicate verdict.
- Elite and PvE-only limits are calculated only from resolved, internally consistent catalog facts.
  The second and subsequent elites and fourth and subsequent PvE-only skills receive slot-specific
  errors. Independent violations may coexist—for example, a repeated elite can produce both a
  duplicate and elite-limit error.
- `nonPlayer` is a proven player-bar error. `unsupported` is a warning because the catalog states
  that support is incomplete, not that every use is impossible.
- A non-null skill profession must match the selected primary or secondary profession, even for a
  title or special skill. A null profession is accepted only when `common`, `special`, or `title`
  supplies an explicit professionless classification; otherwise eligibility warns as unresolved.
- A skill does not require a positive allocation in its attribute. A non-null skill attribute must
  resolve and be consistent with the skill's profession metadata. A null attribute is valid for
  `noAttribute`, `common`, `special`, or `title`; inconsistent catalog flags warn and do not create an
  authored-build error.
- `modeAvailability` is the canonical availability field and `pveOnly`/`pvpOnly` are consistency
  checks. Proven mode mismatch is an error. Restricted or split skills with `Build.mode ===
  "unknown"` warn. Missing, ambiguous, or inconsistent split groups warn; validation may reference
  but never select the counterpart.
- Each title-classified skill emits a deferred title-rule warning until EPIC-15 supplies identity,
  rank, ownership, and allegiance facts. Names are never parsed to infer side or title semantics.

### Effective Attribute Rank

`calculateEffectiveAttributeRank` is separate from `validateBuild` so tooltip and preview callers do
not need a full validation pass. It accepts the build, profession/attribute semantic slice, an
`AttributeId`, optional `baseRankOverride`, and optional consolidated additive adjustments:

```ts
type EffectiveRankAdjustmentKind =
  | "headgear"
  | "rune"
  | "weapon"
  | "title"
  | "temporary"
  | "other";

interface EffectiveRankAdjustment {
  readonly kind: EffectiveRankAdjustmentKind;
  readonly value: number;
  readonly sourceId: string | null;
}
```

A resolved result reports authored base rank, base source (`allocation` or `unallocated`), optional
override, canonically ordered adjustments, and effective rank. A known unallocated attribute starts
at zero. Unknown attributes, duplicate allocations, malformed ranks, invalid overrides, non-finite
or fractional adjustments, and a negative final rank return a typed unresolved result rather than an
exception or clamped value.

`baseRankOverride` replaces only the authored base before adjustments. The calculator does not
derive an override from equipment and does not decide stacking, highest-rune-wins, title ownership,
temporary duration, normal rank cap, or weapon-proc edge cases. Those systems must pass one
already-resolved adjustment per source decision and remain responsible for their own validation.

### Extension Strategy

The rule runner uses an internal `ValidationRule` protocol with stable rule ID, numeric order, and a
pure `evaluate(context)` function. It is module composition, not a runtime plugin API: callers cannot
inject arbitrary callbacks into `validateBuild`, and there is no global registration state. EPIC-10
through EPIC-15 can add domain rule modules in their reserved bands and expand entity/slot unions
only when their catalog contracts exist. This avoids freezing speculative equipment/title schemas
while keeping ordering, result aggregation, and UI location semantics reusable.

## Implementation

### Phase 1: BW-0601 Validation Result Contracts (~12% of effort)

**Goal:** Establish stable, JSON-compatible output and deterministic aggregation before any rule
logic depends on it.

**Tasks:**

- [ ] Add `src/domain/validation.ts` with severity, issue-code, path, slot, related-entity,
      source-rule, result, count, and catalog-version evidence types.
- [ ] Define the initial issue-code and built-in rule-ID constants with compile-time literal unions;
      keep messages separate from code identity.
- [ ] Add pure helpers to create issues, sort related entities, canonicalize issue order, count
      severities, and derive `valid` from the absence of errors.
- [ ] Define numeric-aware path ordering, fixed built-in rule order, and deterministic tie breakers;
      reject duplicate built-in rule IDs/orders in a focused invariant test.
- [ ] Document severity semantics: errors are proven contradictions, warnings are
      partial/unresolved/deferred states, and infos are non-legality analysis. Do not add a mutable
      “dismissed” or UI-visibility field to domain output.
- [ ] Export public validation contracts from `src/domain/index.ts` without exporting internal
      mutable registries.

**Verification:**

- `npm run test:run -- test/domain/rule-engine-contracts.test.ts`
- `npm run typecheck`

**Phase Gate:** Multiple plain-data issues can be aggregated, serialized, sorted, counted, and
located without React/UI types or message-based identity.

### Phase 2: BW-0602 Build/Catalog Context And Orchestrator (~16% of effort)

**Goal:** Resolve one immutable validation view over authored data and caller-supplied semantic
catalog slices.

**Tasks:**

- [ ] Add `src/domain/validation-context.ts` with the narrow catalog aliases, configuration and
      budget-policy contracts, internal readonly indexes, catalog version evidence, and bounded
      context issues.
- [ ] Index professions, attributes, skills, and split groups by their real catalog IDs; detect
      duplicates, exclude ambiguous keys, and never infer identity from template IDs, names, dense
      ranges, or source order.
- [ ] Resolve `auto`, explicit level/quest, and unresolved attribute-budget policies using EPIC-03
      semantic facts. Return configuration/budget issues instead of throwing for unsupported input.
- [ ] Add code-owned bounds for authored attributes, malformed runtime skill bars, and issue output.
      Handle non-array or non-finite runtime values defensively in cast-based boundary tests.
- [ ] Add `src/domain/rule-engine.ts` with the internal ordered-rule protocol and `validateBuild`
      orchestrator. Freeze no caller object, mutate nothing, and build a fresh context per call.
- [ ] Prove catalog reordering produces byte-equivalent serialized results and that deep-frozen
      build/catalog fixtures remain unchanged.

**Verification:**

- `npm run test:run -- test/domain/validation-context.test.ts test/domain/rule-engine.test.ts`
- `npm run lint`
- `npm run typecheck`

**Phase Gate:** Small fixtures and full promoted-catalog shapes can construct the same deterministic
context; ambiguous catalogs and malformed authored shapes cannot trigger first-record-wins behavior,
mutation, or normal validation exceptions.

### Phase 3: BW-0603 Profession And Attribute Rules (~20% of effort)

**Goal:** Validate profession state, attribute ownership, purchased ranks, and point budgets without
conflating missing editor state with proven illegality.

**Tasks:**

- [ ] Add the profession rule module for missing primary, secondary-without-primary, duplicate pair,
      and unresolved primary/secondary IDs with stable locations and related entities.
- [ ] Add attribute shape and lookup rules for finite non-negative integer ranks, unresolved IDs,
      duplicate allocations, and purchased-rank table support.
- [ ] Enforce primary-only ownership against the selected primary profession and all other known
      attribute ownership against the selected primary/secondary pair. Defer when profession truth
      is incomplete; do not guess common attributes absent from the current catalog contract.
- [ ] Compute point spend from unique, valid-cost allocations. Resolve the configured budget and
      emit one overspend issue with deterministic total/budget text only when both are known.
- [ ] Treat holes inside the catalog rank-cost domain as catalog-gap warnings and out-of-domain ranks
      as authored errors. Do not hardcode the current maximum purchased rank or point table.
- [ ] Cover legal single/dual profession builds, partial states, duplicate professions, unknown IDs,
      duplicate attributes, invalid ranks, primary-only misuse, wrong-profession attributes, missing
      cost rows, explicit budget policies, default PvE 200-point policy, and overspend.

**Verification:**

- `npm run test:run -- test/domain/profession-attribute-rules.test.ts`
- `npm run typecheck`

**Phase Gate:** Attribute legality and point totals are explained from EPIC-03 semantic facts, and
every incomplete, unresolved, or contradictory case has the intended severity without coercion.

### Phase 4: BW-0604 Skill-Bar Composition Rules (~16% of effort)

**Goal:** Validate the authored eight-slot structure and catalog-proven bar limits independently of
profession and mode eligibility.

**Tasks:**

- [ ] Add the skill-composition rule module and runtime guard for exactly eight slots while retaining
      the compile-time `SkillBar` tuple contract.
- [ ] Emit one bar-level incomplete warning for null slots and slot-level unresolved warnings for
      unknown non-null IDs; never remove, compact, or replace a slot.
- [ ] Detect second and subsequent occurrences of a resolved player-usable skill ID. Use the
      duplicate-uncertain policy for known unsupported or special records whose classifications
      cannot prove ordinary player-skill semantics; do not add a duplicate verdict to unknown or
      non-player records.
- [ ] Count elites and canonical `modeAvailability: "pve-only"` records from resolved catalog facts.
      Mark only occurrences beyond the one-elite and three-PvE-only limits while retaining related
      references to the complete conflicting set.
- [ ] Report `nonPlayer` as an error and `unsupported` as a warning without treating catalog absence
      as proof of either state.
- [ ] Cover full, partial, empty, malformed-length, unresolved, repeated, duplicate-elite, and four-
      PvE-only bars, including stable ordering when one slot violates multiple independent rules.

**Verification:**

- `npm run test:run -- test/domain/skill-bar-rules.test.ts`
- `npm run typecheck`

**Phase Gate:** Structural and count rules produce stable slot-local issues from catalog facts and do
not depend on profession, mode, UI state, or template decoding.

### Phase 5: BW-0605 Skill Eligibility And Mode Rules (~18% of effort)

**Goal:** Decide only the skill profession and game-mode facts the current catalogs can prove, while
making deferred title/split gaps visible.

**Tasks:**

- [ ] Add skill profession eligibility using explicit profession IDs and professionless
      classifications. Defer checks when the build profession or catalog join is unresolved.
- [ ] Validate skill attribute metadata against the profession/attribute slice without requiring an
      authored allocation or positive rank. Warn on missing or contradictory catalog joins.
- [ ] Validate `modeAvailability` against `Build.mode`; cross-check `pveOnly`/`pvpOnly` flags and
      report metadata conflicts without choosing the most restrictive guess.
- [ ] Inspect split-group membership for uniqueness, requested-mode member presence, and catalog
      record resolution. Attach a counterpart as related evidence only; never mutate the authored
      skill ID or silently validate a substitute.
- [ ] Emit explicit unknown-mode warnings only for restricted/split skills, not for every ordinary
      both-mode skill.
- [ ] Emit title-rule deferral warnings for title-classified skills. Do not parse names, progression
      keys, or prose to infer title ownership, rank, side, or allegiance conflicts.
- [ ] Cover matching and unrelated professions, professionless common/special records, zero-rank or
      absent allocations, mode mismatches, both-mode skills, unknown mode, complete and incomplete
      split groups, inconsistent mode flags, title deferral, and unresolved catalog joins.

**Verification:**

- `npm run test:run -- test/domain/skill-eligibility-rules.test.ts`
- `npm run typecheck`

**Phase Gate:** The engine rejects only catalog-proven profession/mode contradictions, exposes
catalog and title gaps as warnings, and never rewrites a split skill to another record.

### Phase 6: BW-0606 Effective Attribute Rank Calculator (~10% of effort)

**Goal:** Provide an auditable rank calculation primitive that later tooltip, equipment, title, and
preview features can compose safely.

**Tasks:**

- [ ] Add `src/domain/effective-attribute-rank.ts` with input, adjustment, resolved breakdown, and
      typed unresolved outcome contracts.
- [ ] Resolve a unique valid authored allocation as base rank and a known unallocated attribute as
      zero. Preserve unknown and duplicate allocation states as explicit unresolved outcomes.
- [ ] Apply a finite non-negative integer base override before canonically ordered finite integer
      adjustments. Reject invalid inputs and negative final results without throwing or clamping.
- [ ] Report authored base, base source, override, every applied adjustment, and final effective rank
      so callers can explain the value.
- [ ] Keep stacking, source eligibility, caps, and adjustment derivation outside the arithmetic
      helper; document that downstream rule modules must consolidate those semantics first.
- [ ] Cover allocated zero/nonzero, unallocated, unknown, duplicate, invalid base, override,
      positive/negative adjustment, ordering, invalid adjustment, and negative-final cases.

**Verification:**

- `npm run test:run -- test/domain/effective-attribute-rank.test.ts`
- `npm run typecheck`

**Phase Gate:** Known inputs produce a stable contribution breakdown and every unresolved input has
a typed reason; no equipment/title rule is implied by the calculator.

### Phase 7: BW-0607 Fixtures, Documentation, Verification, And Closeout (~8% of effort)

**Goal:** Prove cross-rule behavior and leave one executable, documented contract for downstream
editor work.

**Tasks:**

- [ ] Add small TypeScript fixtures under `test/fixtures/rule-engine/` for professions, attributes,
      costs, skills, split groups, valid builds, partial builds, and isolated invalid cases. Mark them
      synthetic and non-authoritative where appropriate.
- [ ] Add scenario tests for the required matrix: valid build, partial build, invalid profession
      state, duplicate attributes, overspend, wrong-profession skills, repeated skills, duplicate
      elites, too many PvE-only skills, mode restrictions, unresolved IDs, and effective ranks.
- [ ] Assert exact severity, code, path, slot, related entities, source rule, counts, and order. Assert
      messages only where their explanation carries domain meaning; do not turn prose into the sole
      compatibility contract.
- [ ] Add purity and determinism tests for catalog reordering, repeat calls, frozen inputs, locale-
      independent behavior, issue caps, and multiple simultaneous violations.
- [ ] Add one smoke test proving the checked-in EPIC-03 and EPIC-04 fixture catalog JSON satisfies
      the narrow validation inputs. Keep rule correctness tests independent of production generated
      files and live network access.
- [ ] Create `compendium/game-rule-engine.md` documenting severity, issue ordering, budget defaults,
      duplicate policy, mode/split behavior, rank calculation, extension bands, and deferred rules;
      index it from `compendium/README.md` and add a concise README pointer if useful.
- [ ] Run focused tests and canonical repository verification. Inspect public exports and worktree
      state to confirm no app, compatibility, generated data, QA, snapshot, or ingestion files were
      changed incidentally.
- [ ] During execution, update BW-0601 through BW-0607, EPIC-06, SPRINT-007, and
      `work/sprints/ledger.tsv` only after their gates pass. Ensure the outer ticket-burn run writes
      `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-06-result.json`; do not create a
      commit.

**Verification:**

- `npm run test:run -- test/domain/rule-engine-contracts.test.ts test/domain/validation-context.test.ts test/domain/profession-attribute-rules.test.ts test/domain/skill-bar-rules.test.ts test/domain/skill-eligibility-rules.test.ts test/domain/effective-attribute-rank.test.ts test/domain/rule-engine.test.ts`
- `npm run verify`
- `python3 scripts/test_ticket_burn.py`
- `git status --short`

**Phase Gate:** Tests, documentation, public exports, tickets, sprint, ledger, and ticket-burn result
agree on implemented rules, severities, deterministic ordering, budget assumptions, unresolved
behavior, deferred scope, and completion status.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/validation.ts` | Create | Define public issue/result contracts, stable codes/rule IDs, aggregation, and deterministic ordering. |
| `src/domain/validation-context.ts` | Create | Define narrow catalog inputs, budget policy, bounded lookup context, duplicate detection, and catalog-version evidence. |
| `src/domain/rule-engine.ts` | Create | Orchestrate fixed ordered rule modules and expose `validateBuild`. |
| `src/domain/rules/profession-attribute.ts` | Create | Implement profession pair, attribute ownership/rank, point-cost, and budget rules. |
| `src/domain/rules/skill-bar.ts` | Create | Implement runtime bar shape, completeness, unresolved, duplicate, elite, PvE-only, unsupported, and non-player rules. |
| `src/domain/rules/skill-eligibility.ts` | Create | Implement profession, catalog-attribute, mode, split, and deferred title rules. |
| `src/domain/effective-attribute-rank.ts` | Create | Calculate base, override, adjustment breakdown, and typed unresolved rank outcomes. |
| `src/domain/index.ts` | Modify | Export stable validation and calculator APIs without exposing mutable registries or UI types. |
| `test/fixtures/rule-engine/catalogs.ts` | Create | Provide small semantic profession, attribute, cost, skill, and split-group fixtures. |
| `test/fixtures/rule-engine/builds.ts` | Create | Provide valid, partial, unresolved, and invalid authored build fixtures. |
| `test/domain/rule-engine-contracts.test.ts` | Create | Prove plain-data contracts, severity semantics, ordering, and rule registry invariants. |
| `test/domain/validation-context.test.ts` | Create | Prove lookup construction, budgets, duplicates, bounds, purity, versions, and catalog reorder stability. |
| `test/domain/profession-attribute-rules.test.ts` | Create | Cover profession, attribute, purchased-rank, ownership, and overspend behavior. |
| `test/domain/skill-bar-rules.test.ts` | Create | Cover eight-slot structure, partial bars, unresolved IDs, duplicates, elites, and PvE-only limits. |
| `test/domain/skill-eligibility-rules.test.ts` | Create | Cover professionless classification, wrong profession, attribute metadata, modes, splits, and title deferral. |
| `test/domain/effective-attribute-rank.test.ts` | Create | Cover rank sources, overrides, adjustments, unresolved inputs, and no-clamp behavior. |
| `test/domain/rule-engine.test.ts` | Create | Cover end-to-end scenario matrix, issue order, caps, frozen inputs, and fixture-catalog compatibility. |
| `README.md` | Modify only if useful | Link the public rule-engine API and durable documentation without adding UI guidance. |
| `compendium/game-rule-engine.md` | Create | Record durable rule semantics, defaults, extension bands, limitations, and downstream contracts. |
| `compendium/README.md` | Modify | Index the game-rule-engine note. |
| `work/tickets/06-game-rule-engine/*.md` | Modify during execution | Track BW-0601 through BW-0607 and EPIC-06 state/evidence. |
| `work/sprints/SPRINT-007.md` | Create/modify during execution | Track sprint state and checked Definition of Done. |
| `work/sprints/ledger.tsv` | Modify during execution | Record the sprint lifecycle. |
| `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-06-result.json` | Write by outer run | Record non-interactive ticket-burn planning outcome. |

`src/app/**`, `src/template-compatibility/**`, `scripts/data/**`, `data/generated/**`, `data/qa/**`,
`data/source-snapshots/**`, package dependencies, and Vite configuration are not modified by this
sprint.

## Definition of Done

### Contracts And Boundaries

- [ ] `ValidationIssue` exposes stable severity, code, path, optional slot, related entities,
      source-rule ID, and bounded deterministic message; `ValidationResult` exposes sorted issues,
      counts, validity, and all relevant catalog versions.
- [ ] Errors mean proven contradictions; warnings mean incomplete, unresolved, unsupported, or
      deferred truth; infos do not affect legality. `valid` means no errors and never claims
      completeness.
- [ ] Normal invalid, partial, unresolved, malformed-runtime-shape, and unsupported-budget states
      return issues rather than exceptions or mutated builds.
- [ ] Validation output is plain JSON-compatible data and contains no maps, sets, functions, class
      instances, exceptions, mutable catalog records, React/UI types, vendor objects, or provenance
      bodies.
- [ ] Domain modules import no React, DOM/browser APIs, storage, network clients, app modules,
      template compatibility, generated data, manifests, QA reports, source snapshots, data scripts,
      or wiki APIs.

### Context And Determinism

- [ ] Complete EPIC-03/EPIC-04 catalogs and small semantic slices both satisfy validation inputs;
      only catalog versions and required semantic arrays are consumed.
- [ ] ID maps preserve branded catalog namespaces and non-contiguous values. Template ID equality,
      names, ranges, and array positions are never used as catalog identity.
- [ ] Duplicate catalog IDs/groups report ambiguity and cannot resolve according to source order.
      Unknown authored IDs remain unchanged and receive location-specific issues.
- [ ] Auto budget uses only the EPIC-03 level-20 PvE maximum-applicable-quest policy. Explicit
      level/quest policies use catalog rows; PvP, unknown, malformed, and unsupported policies never
      receive guessed budgets.
- [ ] Issue order is stable by built-in rule order, numeric-aware path, code, and canonical related
      entity key. Catalog order, object insertion, repeat calls, locale, wall clock, and filesystem do
      not affect serialized results.
- [ ] Code-owned attribute, skill-bar inspection, and issue bounds are tested. Hitting a bound is
      explicit and cannot cause unbounded output or ordinary validation exceptions.
- [ ] Validation and rank calculation do not mutate frozen builds, catalogs, arrays, or records and
      retain no cross-call global state.

### Profession And Attribute Rules

- [ ] Legal distinct profession pairs, legal primary-only attributes, secondary attributes, and
      valid point allocations pass without errors.
- [ ] Missing primary is distinguished from secondary-without-primary, duplicate profession pair,
      and unresolved profession IDs with the locked severities and locations.
- [ ] Duplicate attribute rows, unresolved IDs, malformed ranks, unsupported purchased ranks,
      missing cost facts, primary-only misuse, and wrong-profession attributes have deterministic
      non-cascading behavior.
- [ ] Purchased-rank support and cumulative cost come from `attributePointRules`; maximum rank and
      point costs are not duplicated as rule-engine constants.
- [ ] Overspend is emitted when the resolved-cost lower bound for unique allocations exceeds a
      resolved budget, even if a separate catalog-gap warning excludes another row from that sum.
      The engine never lowers, merges, or removes an allocation.

### Skill Composition And Eligibility Rules

- [ ] Runtime skill-bar shape is checked for exactly eight slots; null slots are allowed during
      editing and produce one predictable incomplete warning.
- [ ] Unknown skill IDs remain in place and are reported at their slots. Known unsupported records
      warn; known non-player records error.
- [ ] Repeated resolved player skills, second/subsequent elites, and fourth/subsequent PvE-only
      skills produce deterministic slot-specific errors with complete related evidence.
- [ ] Duplicate legality is not inferred for unresolved IDs or records whose classification cannot
      prove ordinary player-skill semantics; those cases use unresolved/uncertain warnings.
- [ ] Profession-linked skills require the selected primary or secondary profession. Explicitly
      professionless common/special/title records can pass; ambiguous null profession facts warn.
- [ ] A skill attribute does not require an authored allocation. Known unallocated attributes are
      rank zero; missing or contradictory skill/attribute catalog joins warn as catalog gaps.
- [ ] PvE-only/PvP-only mismatches are errors, unknown mode is warned only when relevant, and
      inconsistent/incomplete split metadata warns without silent variant substitution.
- [ ] Title-classified skills expose deferred title/allegiance warnings; no name/prose inference or
      partial EPIC-15 rule is shipped.

### Effective Rank And Extensions

- [ ] Effective-rank calculation covers allocated, unallocated, overridden, adjusted, duplicate,
      unknown, malformed, and negative-final cases with resolved breakdowns or typed unresolved
      reasons.
- [ ] Base override precedence and canonical adjustment ordering are documented and fixture-locked;
      no value is silently clamped.
- [ ] Headgear, rune, weapon, title, temporary, and other adjustments are caller-supplied
      consolidated inputs. This sprint does not claim their eligibility, stacking, duration, or cap
      semantics.
- [ ] Internal rule modules use reserved deterministic order bands. No runtime callback injection or
      mutable global plugin registry is exposed.
- [ ] Equipment, title, hero, party, and analysis rule groups can be added later through optional
      input extensions and reserved order bands without changing the current call pattern or the
      meaning of existing issue paths/codes.

### Fixtures, Verification, And Closeout

- [ ] Small offline fixtures cover a valid build, partial build, invalid profession state,
      duplicate attributes, overspend, wrong-profession skills, duplicates, duplicate elites, too
      many PvE-only skills, mode restrictions, unresolved IDs, and effective-rank cases.
- [ ] Tests assert severity, code, path, slot, related entity, source rule, count, and ordering for
      individual and combined failures.
- [ ] Rule correctness tests do not require production generated files, raw snapshots, live network,
      time, locale, filesystem order, or template-codec state; one narrow smoke test proves the
      checked-in generated fixture shapes remain compatible.
- [ ] `compendium/game-rule-engine.md`, public exports, tests, tickets, sprint, ledger, and result
      manifest agree on implemented rules, assumptions, defaults, limits, and deferred scope.
- [ ] Focused rule-engine tests, `npm run typecheck`, and `npm run verify` pass without network access.
- [ ] `git status --short` confirms no app, compatibility, generated catalog, QA, snapshot,
      ingestion, dependency, or unrelated files changed.
- [ ] BW-0601 through BW-0607, EPIC-06, SPRINT-007, and the ledger are marked complete only after all
      gates pass; the ticket-burn result manifest is written and no commit is created.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `valid` is mistaken for complete or publishable | High | High | Define it strictly as no proven errors, retain warnings/counts, document caller policy, and fixture partial-but-valid results. |
| Default 200-point PvE budget overstates points for a character without quests | High | Medium | Name the policy explicitly, use it only in PvE auto mode, accept an exact caller policy, and never infer PvP/unknown budgets. |
| Catalog gaps create false legality errors | Medium | High | Require resolved semantic facts for errors; represent unknown joins, missing costs, unsupported records, and incomplete splits as warnings. |
| Too many dependent issues make partial editing noisy | High | Medium | Defer dependent checks when prerequisite profession/catalog facts are unresolved, aggregate empty slots, and avoid duplicate-row cost cascades. |
| Duplicate-skill edge cases are broader than catalog metadata proves | Medium | High | Error only for repeated resolved ordinary player skills; warn for unsupported/special ambiguity and give unknown/non-player records only their primary status issue. |
| Split handling silently changes the authored skill | Medium | High | Validate selected record availability, attach counterpart only as related evidence, and prohibit context mutation or automatic substitution. |
| Title/allegiance flags tempt incomplete rule implementation | High | High | Emit explicit deferred warnings and reserve EPIC-15's rule band; never infer identity/side from names or prose. |
| `Build.catalogVersion` cannot represent two independent catalog versions | High | Medium | Record all three versions in every result, avoid invalid direct equality checks, and leave a composite persistence pin to its owning migration. |
| Exposing a broad context/rule callback freezes internals or permits nondeterminism | Medium | High | Keep rule composition internal and static; expose only stable input/output and add future built-in modules in reserved order bands. |
| Rank adjustments double-count or encode incorrect stacking | Medium | High | Treat adjustments as caller-consolidated arithmetic inputs, return every part, and keep derivation/stacking validation in equipment/title epics. |
| Hardcoded current catalog maxima drift after a data refresh | Medium | High | Read purchased-rank costs, budgets, classifications, and split groups from caller-supplied semantic catalogs and test non-contiguous fixtures. |
| Rule output changes when catalog arrays reorder | Medium | High | Build duplicate-aware maps, canonicalize related entities and issues centrally, and add reorder metamorphic tests. |
| Runtime-cast builds bypass tuple and numeric type guarantees | Medium | Medium | Guard arrays, finite integers, bounds, and issue caps at the domain boundary without attempting a full schema-validator project. |
| Template unknown IDs are accidentally rebranded as catalog IDs | Medium | High | Keep template documents out of the engine, accept only `Build` catalog namespaces, and preserve unresolved authored numeric catalog references without conversion. |
| Full generated catalogs make tests slow or brittle | Low | Medium | Use small semantic fixtures for correctness and only one checked-in fixture-catalog compatibility smoke test. |

## Security Considerations

- Treat builds, numeric IDs, ranks, names, catalog slices, catalog versions, split groups,
  configuration, adjustment source IDs, and future persisted validation results as untrusted data at
  the public boundary even though promoted catalogs are release-gated.
- Bound authored attribute traversal, malformed skill-bar inspection, related-entity collection,
  messages, and total issues. Emit an explicit limit error rather than allocating or formatting in
  proportion to hostile input.
- Require finite safe integers where IDs/ranks demand them and finite integers for adjustments. Do
  not use untrusted IDs as object keys on prototype-bearing objects; use fresh local maps and exclude
  ambiguous keys.
- Do not evaluate messages, names, source IDs, catalog text, or configuration as HTML, JavaScript,
  regular-expression source, paths, imports, URLs, or commands. Future UI must render messages and
  catalog names as escaped text.
- Do not include complete builds, build names, catalog provenance prose, raw input JSON, stacks,
  absolute paths, secrets, or unbounded values in issues or logs.
- Keep validation and rank calculation synchronous, pure, network-free, clock-free, locale-free,
  filesystem-free, and storage-free. There is no dynamic rule loading or user-supplied callback
  execution.
- Never mutate a build to “fix” hostile or invalid data. Never replace unknown IDs, select split
  counterparts, clamp ranks, or discard slots as a security shortcut.
- Routine tests and `npm run verify` remain fully offline and require no credentials, live source
  access, browser globals, or remote media.

## Dependencies

- `SPRINT-001` / `EPIC-00` for the strict TypeScript/Vitest foundation, plain domain contracts,
  branded catalog IDs, authored-document metadata, eight-slot `SkillBar`, domain no-DOM boundary,
  and canonical `npm run verify` command.
- `SPRINT-002` / `EPIC-01` for source/provenance boundaries and the rule that runtime consumers do
  not treat audit artifacts as semantic catalogs.
- `SPRINT-004` / `EPIC-03` for playable profession/attribute records, primary-only facts,
  purchased-rank costs, level totals, maximum-applicable quest bonus, default level-20 PvE policy,
  non-contiguous identity semantics, and the runtime-eligible profession/attribute catalog.
- `SPRINT-005` / `EPIC-04` for skill profession/attribute joins, elite/common/title/special/
  no-attribute/PvE-only/PvP-only/unsupported/non-player classifications, mode availability, split
  groups, progression dependency keys, source-set dispositions, and the runtime-eligible skill
  catalog.
- `SPRINT-006` / `EPIC-05` for the loss-aware boundary between raw template IDs and catalog IDs.
  There is no import dependency from the rule engine to template compatibility; a later application
  service may pass only resolved authored `Build` facts and preserve unresolved template documents
  separately.
- Node.js `>=22.11.0`, npm `>=11.10.1`, TypeScript 5.9, Vitest 4, ESLint, and Prettier through the
  already-pinned repository toolchain. No new runtime or development dependency is expected.
- Downstream consumers include EPIC-08 Core Build Editor, EPIC-10 through EPIC-14 equipment content
  and editing, EPIC-15 Title Tracks and PvE-only, EPIC-17 Party and Hero Builder, EPIC-19 Guide
  Authoring, and EPIC-21 Advanced Analysis.

## Open Questions

No open question blocks execution. Defaults for this sprint are:

1. Incomplete editor states and unresolved catalog facts are warnings. Proven impossible
   combinations, malformed authored ranks/shapes, and catalog-proven legality violations are errors.
   Callers may apply a stricter publish policy without changing domain severities.
2. Auto attribute budget means EPIC-03's level-20 PvE maximum-applicable-quest budget and nothing
   broader. PvP and unknown mode need an explicit policy before overspend is judged.
3. Repeated resolved ordinary player-skill IDs are errors. Unknown and non-player IDs are not given
   a separate duplicate verdict; known unsupported or special records receive an uncertain warning
   unless another independent rule proves them illegal.
4. `modeAvailability` is canonical for mode checks. Boolean PvE/PvP flags and split groups are
   consistency evidence; conflicts warn rather than triggering a guessed replacement or restriction.
5. Title skill count still contributes to the catalog-proven PvE-only limit, but title ownership,
   title rank, and allegiance conflicts remain deferred to EPIC-15 and are made visible with
   warnings.
6. Effective-rank `baseRankOverride` replaces the authored base before additive adjustments. The
   helper does not clamp to 20 or implement stacking; later domain rules must derive consolidated
   adjustments.
7. Existing `Build.catalogVersion` is recorded as historical evidence but is not compared directly
   to the independent profession/attribute and skill catalog versions. A future persistence schema
   may add a composite pin.
8. Rule extension is static domain-module composition in reserved order bands, not runtime plugin or
   callback injection. Equipment/title schemas are not invented before their owning epics.
9. No UI, template adapter, ingestion, generated-data, QA, snapshot, package, or dependency change is
   part of this sprint.
