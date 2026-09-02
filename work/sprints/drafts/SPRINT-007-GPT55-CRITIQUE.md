# SPRINT-007 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-007-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-007-GPT54-DRAFT.md`

Both listed drafts were present. This critique intentionally does not cover any other draft.

## GPT56SOL Draft

### Strengths

- Strongest architecture boundary of the two drafts. It repeatedly and concretely excludes UI,
  storage, template compatibility, generated artifacts, QA reports, source snapshots, network I/O,
  and ingestion code from the rule engine.
- Correctly distinguishes proven illegality from incomplete knowledge. The `valid = no proven
  errors` decision is important and should survive the merge because it prevents partial editor
  states from being treated as complete/publishable builds.
- Narrow catalog input aliases are a good design direction. They reduce coupling to full promoted
  catalogs and keep tests from depending on manifests, provenance, or generated-file layout.
- The issue contract is unusually complete: severity, code, segment path, slot, related entities,
  source rule, counts, and catalog-version evidence are all called out as structural API, while
  messages are explicitly not the primary identity.
- Deterministic rule ordering is treated as architecture, not as incidental test behavior. Numeric
  path ordering, related-entity canonicalization, and catalog-reorder tests are worth keeping.
- The draft handles several hidden correctness traps well: ambiguous duplicate catalog IDs,
  non-contiguous IDs, template ID namespace separation, missing rank-cost rows, incomplete split
  groups, and unknown mode.
- The effective-rank calculator is sensibly isolated from validation and from equipment/title
  derivation. Caller-consolidated adjustments are a conservative boundary for this sprint.
- Security and defensive-runtime sections are materially useful, especially issue caps, bounded
  traversal, finite integer checks, and avoiding prototype-bearing object keys.

### Weaknesses

- The draft is over-specified for an execution sprint. It locks many policy decisions at once:
  issue-code families, rule bands, budget policy, duplicate semantics, split semantics, extension
  strategy, rank-adjustment kinds, caps, sorting tie breakers, and catalog-version behavior. That
  reduces ambiguity, but it also creates implementation drag and increases the chance that one
  catalog mismatch derails the sprint.
- It assumes the EPIC-03 and EPIC-04 semantic catalog shapes already contain exactly the fields the
  rule engine wants, including `attributePointRules`, `defaultPveLevel20.totalWithMaximumQuestBonus`,
  canonical `modeAvailability`, split-group membership, professionless classifications, title
  classifications, unsupported/non-player status, and progression dependency keys. The draft should
  include a first-phase catalog-shape audit or adapter decision before locking rule behavior.
- The proposed `ValidationResult.valid` and future export/publish policy distinction is sound, but
  it creates a naming hazard. Callers may still interpret `valid` as complete or exportable. A
  stronger alternative name, such as `hasErrors` plus `counts`, or an explicit `knownInvalid`
  boolean, should be considered.
- The rule-band architecture may be premature. Reserved numeric bands are useful for deterministic
  ordering, but they also imply a future framework for equipment/title/analysis before those schemas
  exist. A simpler ordered-array runner with stable rule IDs could achieve determinism without
  freezing cross-epic band allocations.
- The context bounds and issue cap are good, but the draft does not fully specify truncation
  semantics. It should define whether truncation is global or per collection, whether higher-severity
  issues are prioritized, and how callers know that validation results are incomplete because of a
  cap.
- The duplicate-skill policy is more assertive than the GPT54 draft. Treating repeated resolved
  player-usable skills as errors is likely correct for Guild Wars bars, but the draft should cite the
  source of that rule or explicitly frame it as a core game-rule assumption rather than a catalog
  inference.
- The issue-code taxonomy is large before the first implementation exists. This can lead to tests
  fossilizing distinctions that are not yet useful to callers, especially between catalog gaps,
  unsupported records, deferred eligibility, and metadata conflicts.
- The phase list includes ticket, ledger, sprint, ticket-burn result, compendium, README, and broad
  verification updates. That is traceable, but it risks turning an engine sprint into a process
  closeout sprint with many non-engine touch points.

### Gaps In Risk Analysis

- No explicit risk that the existing `Build` model cannot represent all validation paths cleanly,
  especially if runtime-cast malformed builds differ from the typed domain shape.
- No explicit risk that catalog smoke compatibility fails because generated fixture paths or export
  names do not match the proposed narrow aliases.
- No explicit risk that issue-code stability becomes a migration burden once the editor UI starts
  depending on codes and paths.
- No explicit risk that warning volume makes `valid: true` builds look broken in the editor,
  especially for title skills, unresolved imports, missing secondary profession, and empty bars.
- No explicit alternative for exposing only a minimal MVP code set first and expanding codes as
  rule tests require them.
- No explicit performance risk from validating every selected skill against multiple catalog joins,
  split groups, related-entity sets, and canonical sorting. The expected data sizes are small, but
  the architecture should still state that assumption.

### Missing Edge Cases

- Duplicate primary and secondary profession IDs where one or both IDs are unresolved or ambiguous.
- Attribute rows with duplicate IDs but different malformed ranks, and whether duplicate detection
  or rank validation should report first.
- Attribute budget behavior when all allocations are zero, when only unresolved rows have cost, or
  when valid resolved rows are under budget but excluded gap rows could push the build over.
- Unknown or unsupported `Build.mode` values at runtime, not just the typed `"unknown"` state.
- Skill-bar entries that are non-null but not finite safe integers, repeated `NaN`/string/cast
  values, or object-shaped external JSON values.
- Split groups with more than two members, duplicate members, missing requested-mode member, or
  counterpart records that resolve but have contradictory availability flags.
- Skills whose profession and attribute metadata disagree in both directions: skill profession
  legal but attribute owned by unrelated profession, or professionless skill with a profession-owned
  attribute.
- Repeated title/special/unsupported skills that are also elite or PvE-only, and how duplicate
  uncertainty composes with hard count errors.
- Effective-rank overflow or unusually large positive/negative adjustments, not only fractional,
  non-finite, and negative-final cases.
- Localization-sensitive message construction is ruled out by deterministic text, but tests should
  include at least one non-English locale or locale-mocking check if locale independence is a goal.

### Definition Of Done Completeness

- The DoD is comprehensive and closely aligned with the architecture. It covers contracts,
  boundaries, determinism, rules, rank calculation, fixtures, verification, and closeout.
- It is probably too broad for a single sprint. The DoD requires final agreement across public
  exports, tests, compendium, tickets, sprint, ledger, result manifest, generated-fixture smoke
  tests, and worktree hygiene. That may be reasonable for a ticket-burn workflow, but it should be
  split into required engine DoD versus process closeout DoD.
- The DoD should add an explicit catalog-shape audit gate before implementation of semantic rules.
  Without that, the sprint can pass contract tests on synthetic fixtures while failing against real
  EPIC-03/EPIC-04 catalog data.
- The DoD should require examples of warning-only builds where `valid` is true, so downstream
  callers see the intended distinction between no errors and complete legality.
- The DoD should specify that any issue cap or traversal cap produces a machine-readable signal that
  consumers cannot treat the result as exhaustive.

## GPT54 Draft

### Strengths

- Clearer and shorter execution plan. The phases follow a dependency-oriented sequence and are
  easier to hand to an implementer than the GPT56SOL draft.
- The draft correctly puts validation contracts and context before specialized rules, which reduces
  churn in later phases.
- The scope boundary is sensible: pure domain validation, no React, no storage, no template decoding,
  no equipment/title/account ownership, and no recommendation logic.
- It identifies the main MVP surfaces: `validateBuild`, `createValidationContext`, and
  `calculateEffectiveAttributeRank`.
- It preserves unresolved authored IDs and correctly avoids cascading unresolved references into
  wrong-profession or mode-restriction errors.
- The risk section covers the obvious product risks: partial editor noise, stale IDs, duplicate
  skill under-specification, tuple/runtime mismatch, rank scope creep, and title/allegiance deferral.
- The phase gates are useful. Each phase has a crisp readiness statement that explains why the next
  phase can proceed.

### Weaknesses

- The public contract is less internally consistent than GPT56SOL. It uses string paths such as
  `attributes[0].rank`, a singular `relatedEntity`, and an `exportBlocked` boolean. Those choices
  are weaker than segment paths, plural related entities, and `valid/counts` because they are less
  structured and more likely to conflate validation with publish policy.
- The issue-code names are generic and may collide with future advisory or import errors:
  `ATTRIBUTE_NOT_ALLOWED`, `INVALID_PROFESSION_PAIR`, `SKILL_MODE_AMBIGUOUS`, and
  `TITLE_RULE_DEFERRED` are readable, but less precise than the GPT56SOL families.
- The extension-hook interface is under-designed and risky. Allowing future validators to plug into
  context too early can freeze unstable internal state or introduce nondeterministic callback
  behavior unless the extension surface is explicitly internal.
- The default options are too broad. `level: 20` plus `questBonus: "maximum-applicable"` is stated as
  a default without the GPT56SOL distinction that PvP and unknown-mode builds should not receive a
  guessed budget.
- Duplicate non-elite skills are warnings in this draft, while repeated known player-usable skills
  are errors in GPT56SOL. The draft acknowledges under-specification but does not separate ordinary
  player skills from unsupported/special/non-player records, which could under-enforce a core bar
  rule.
- `ALLEGIANCE_RULE_DEFERRED` appears in the MVP code set, but the draft does not establish enough
  catalog or authored-build facts to know when allegiance applies. This risks adding warnings based
  on weak inference.
- The effective-rank contribution sources include `manual-override` as a contribution, while also
  discussing override preview behavior. That muddles whether override replaces the base rank or is
  an additive adjustment.
- The file summary and phase files propose flatter module names such as
  `validation-professions-attributes.ts`, while GPT56SOL proposes a rules subdirectory. The draft
  does not justify module organization or how rule groups stay isolated as more epics add rules.
- The plan says precompute current authored equipment references in context, even though equipment
  is out of scope. That is scope creep and should be removed from the MVP context.

### Gaps In Risk Analysis

- No explicit risk that `exportBlocked` bakes UI/export policy into a domain validation result and
  becomes hard to change later.
- No explicit risk that string path formatting becomes hard to parse, compare, or evolve once
  consumers need numeric-aware sorting and UI highlighting.
- No explicit risk that extension hooks become a runtime plugin API by accident.
- No explicit risk that default budget assumptions produce false overspend errors for PvP, unknown
  mode, low-level, or quest-incomplete builds.
- No explicit risk that title/allegiance warnings are generated from catalog flags that lack title
  identity, side, rank, ownership, or account context.
- No explicit risk that future generated-catalog changes break the assumed helper APIs such as
  `purchasedRankCost`, `attributeBudgetForLevel`, or `resolveSkillModeVariant`.
- No explicit risk that warning-level duplicate non-elite skills lets a known illegal completed build
  appear exportable if export gating only blocks errors.

### Missing Edge Cases

- Ambiguous duplicate catalog IDs and duplicate split-group keys. The draft preserves unresolved
  IDs but does not clearly handle catalog ambiguity or first-record-wins hazards.
- Non-contiguous catalog IDs and collisions between template ID namespaces and catalog ID
  namespaces.
- Runtime malformed IDs and ranks: non-finite numbers, fractional IDs, negative IDs, string IDs, and
  over-large safe-integer cases.
- Full promoted catalog compatibility versus synthetic fixtures. The draft mentions a generated
  compatibility test only if needed, but this sprint needs at least one early shape check because the
  whole architecture depends on caller-supplied catalog slices.
- Null secondary profession behavior. The draft validates missing secondary professions, but it is
  not clear whether missing secondary is a warning, legal single-profession state, or editor-only
  incomplete state.
- Skill `unsupported` versus `nonPlayer` distinctions. The draft lists unresolved skills but does
  not clearly identify unsupported catalog records or non-player records as separate outcomes.
- Mode split metadata conflicts: missing counterpart, duplicate counterpart, more than one PvE/PvP
  member, mismatched `modeAvailability`, and boolean flag conflicts.
- Rank-cost table holes versus ranks outside the supported domain. The draft says reject ranks not
  supported by the table, but does not distinguish authored invalid input from catalog gaps.
- Effective-rank duplicate attribute allocations, invalid overrides, negative final result, and
  canonical ordering of adjustments.
- Issue cap/traversal bounds for hostile or malformed external JSON.

### Definition Of Done Completeness

- The DoD covers the main intended outcomes: pure domain exports, multiple issues per pass,
  preserved unresolved IDs, profession/attribute/skill/rank rules, deterministic ordering, fixtures,
  docs, ticket traceability, and verification.
- It is less complete than GPT56SOL on architecture invariants. It should add DoD items for
  duplicate catalog ambiguity, non-contiguous ID handling, template/catalog namespace separation,
  full catalog shape smoke coverage, runtime bounds, issue caps, purity against frozen inputs, and
  no cross-call global state.
- It should remove or revise `exportBlocked` as a DoD concept unless the team intentionally wants
  publish policy in the domain result.
- It should explicitly state that warnings do not permit destructive cleanup and that unresolved
  imported IDs remain authored data.
- It should make the title/allegiance DoD narrower: expose deferral only when current catalog facts
  explicitly indicate a deferred rule domain, and avoid allegiance warnings if the current facts only
  prove title classification.
- It should include a DoD item that `validateBuild` behavior is byte-stable under catalog reorder
  and repeated calls.

## Cross-Draft Comparison

- GPT56SOL is architecturally stronger. It has better boundary discipline, better deterministic
  ordering, better catalog ambiguity handling, better security considerations, and a more defensible
  treatment of unknown versus illegal states.
- GPT54 is more executable. It is shorter, has lower process overhead, and presents a clearer
  phase-by-phase implementation path.
- The largest semantic conflict is duplicate skill severity. GPT56SOL treats repeated resolved
  player-usable skills as errors, while GPT54 treats duplicate non-elite skills as warnings. The
  merged sprint should choose one policy explicitly. Recommendation: use GPT56SOL's stricter error
  for repeated resolved ordinary player skills, but retain uncertainty warnings for unsupported,
  special, unresolved, and non-player cases.
- The second major conflict is output shape. GPT56SOL's segment-based `path`,
  `relatedEntities[]`, `counts`, and `valid = no errors` model is more durable than GPT54's string
  path, singular `relatedEntity`, and `exportBlocked` model.
- GPT54's extension hooks should not be merged as public callbacks. GPT56SOL's static internal rule
  module composition is safer until later epics have real schemas.
- GPT56SOL's rule bands may be too heavyweight. Merge the deterministic internal ordering concept,
  but avoid making future band allocations part of the public contract.
- GPT56SOL's auto budget policy is safer. GPT54's default level-20 policy should be narrowed so PvP
  and unknown-mode builds warn instead of receiving guessed budgets.
- GPT54's phase ordering is mostly better for execution, except GPT56SOL's context/catalog-shape
  precision should be added before rule implementation. Effective-rank can happen before skill
  eligibility, but it should not block basic skill-bar composition unless the implementation really
  consumes rank semantics.

## Merge Recommendations

1. Base the merged sprint on GPT54's shorter phase structure, but replace its public contract and
   severity semantics with GPT56SOL's more precise model.
2. Add an explicit Phase 0 or Phase 1 gate for catalog-shape confirmation against EPIC-03 and
   EPIC-04 exports. Decide whether narrow structural aliases work directly or whether a tiny adapter
   is needed.
3. Use segment-based paths, plural related entities, severity counts, catalog-version evidence, and
   a boolean named to avoid publish-policy confusion. If keeping `valid`, document and test that it
   means only no errors.
4. Keep the rule engine pure and static. Do not expose runtime extension callbacks or precompute
   equipment references in the MVP context.
5. Adopt GPT56SOL's unresolved/ambiguous catalog handling: duplicate catalog keys should emit
   ambiguity issues and be excluded from resolved lookup.
6. Adopt GPT56SOL's budget policy: auto budget applies only where the current catalog and build mode
   can prove the intended PvE level-20 maximum-quest assumption; otherwise warn.
7. Split issue-code locking into two tiers: a small public MVP set required by tests, and internal
   provisional codes that can be refined before editor integration.
8. Preserve GPT56SOL's handling of split skills: validate the authored selected record, attach a
   counterpart only as related evidence, and never substitute variants.
9. Simplify extension ordering: use stable built-in rule order for this sprint and document reserved
   future domains without freezing a public numeric band system.
10. Strengthen DoD with mandatory real-catalog smoke compatibility, frozen-input purity tests,
    catalog-reorder determinism tests, runtime malformed-shape tests, issue-cap/truncation signals,
    and warning-only `valid` examples.
11. Separate engine completion from process closeout. Required engine DoD should focus on domain
    files, fixtures, docs, and verification; ticket, sprint, ledger, and ticket-burn updates should
    remain closeout tasks rather than obscure whether the rule engine itself is complete.
12. Remove any MVP work that implies equipment, title ownership, allegiance side, account state,
    recommendations, or application wiring. Keep those as deferred warnings only when current
    catalog facts explicitly justify a deferred-domain issue.
