# Combined Critique: SPRINT-007 GPT-5.5 and GPT-5.4 Drafts

## Review Scope

Both requested drafts were present and reviewed:

- `SPRINT-007-GPT55-DRAFT.md`
- `SPRINT-007-GPT54-DRAFT.md`

## Overall Assessment

The drafts share a sound core direction: keep the rule engine pure and framework-neutral, consume
caller-supplied catalogs, preserve unresolved authored IDs, return structured issues for ordinary
invalid input, and keep template decoding, UI, storage, network access, and later equipment/title
rules outside EPIC-06.

They are not yet safe to merge into an execution plan. They disagree on several parts of the public
contract and on user-visible rule semantics while both describe those decisions as stable. The most
important conflicts are path representation, slot and related-entity shape, issue-code names,
duplicate-skill severity, empty-bar reporting, deferred-rule severity, API and file names, and
whether calculations are part of every validation result. Implementing either draft before resolving
these differences would create avoidable migration work for the editor and later rule epics.

The shared strategic weakness is that both drafts conflate three different questions:

1. Is a build proven illegal?
2. Is the build complete and fully resolved?
3. May a particular workflow export it?

Using configurable issue severity as the only answer makes an unresolved or incomplete build appear
`ok` under one profile and export-blocked under another without changing the underlying facts. The
merged plan should model legality, completeness/resolution, and workflow policy separately.

## Critique of `SPRINT-007-GPT55-DRAFT.md`

### Strengths

- It has the clearest scope boundary. The separation from template compatibility, generated audit
  artifacts, runtime catalog imports, UI, browser APIs, and later equipment/title systems is explicit
  and coherent.
- The proposed issue model is structurally rich. Segment-based paths, typed slot references, multiple
  related entities, stable codes, source-rule metadata, summaries, and deterministic ordering give
  future callers more reliable data than display-message parsing.
- It recognizes more real catalog outcomes than the GPT-5.4 draft, including dispositioned skills,
  unsupported/non-player records, missing split variants, unsupported rank costs, and unresolved
  effective-rank requests.
- The default editing profile and the distinction between proven invalidity and incomplete editor
  state are directionally correct.
- Test coverage is unusually specific. It includes runtime-invalid tuple shapes, duplicate unresolved
  skills, split-mode failures, override validation, duplicate-allocation interaction, catalog metadata,
  and issue ordering.
- Its Definition of Done covers domain import boundaries, focused and repository-wide verification,
  documentation, ticket closeout, and offline fixtures.

### Weaknesses

- The draft calls the contract small while predefining future equipment, armor, weapon-set, title,
  modifier, hero, party, and extension concepts. This expands the compatibility surface before those
  domains have requirements. A typed future slot or entity union can become a breaking constraint,
  especially for exhaustive TypeScript consumers.
- `ValidationResult.calculations` makes effective-rank calculation part of every validation result,
  but the draft never defines which attributes are calculated, how partial calculations are marked,
  or whether invalid duplicate rows produce a usable rank. The separate calculator is coherent; a
  mandatory calculations payload is not yet justified.
- `build-validation.ts` is positioned as orchestration plus all MVP rule groups. That is likely to
  become a large, high-conflict module as EPIC-15, EPIC-17, and EPIC-21 add rules. The GPT-5.4 draft's
  per-rule-family modules are a better long-range boundary.
- Caller-supplied `extensionRules` undermine the purity guarantee. The engine cannot prove that a
  callback is deterministic, synchronous in behavior, side-effect free, or independent of external
  state. The security section says this must not become a plugin sandbox, but the proposed callback
  surface is already a minimal plugin mechanism.
- The draft says exact TypeScript names may change while simultaneously treating the shape and code
  set as a stable API. Stability should begin only after representative vertical rule tests prove the
  model; freezing the contract in Phase 1 front-loads certainty the sprint does not yet have.
- A hard-coded ticket-burn output directory embeds a specific run timestamp in the sprint. Unless an
  existing automation contract requires that exact path, it is brittle planning metadata and should
  be resolved at execution time.

### Gaps in Risk Analysis

- The 200-point default is a PvE maximum-applicable budget, yet the validator also handles PvP and
  unknown modes. Applying a PvE assumption outside PvE can produce false legality. Even in PvE, the
  draft does not distinguish theoretical maximum builds from character-specific quest-bonus state.
- `classification.pveOnly` is assumed to be the same predicate as “counts toward the three-skill
  limit.” That equivalence needs to be demonstrated in the promoted catalog or represented by a
  dedicated rule fact.
- Caller-supplied profession and skill catalogs may come from incompatible versions. Recording
  versions and digests is not enough; the plan needs behavior for mismatched versions, duplicate
  catalog IDs, and skill references to absent profession or attribute records.
- Stable `sourceRule` values risk leaking sprint ticket identity into a long-lived domain API. Rule
  identifiers should be domain-owned and versionable; ticket IDs belong in traceability metadata.
- Severity overrides can change `ok`, summary counts, export behavior, and even sort order without
  changing facts. That is a compatibility and reproducibility risk, not only a configuration feature.
- No rule-engine or policy version is included in results, so a saved validation result may not be
  reproducible after rule or default changes.

### Missing Edge Cases

- Duplicate attribute rows: whether point spending and effective rank use the first row, last row,
  all rows, or no rows while the duplicate error exists.
- Cascading diagnostics when the primary profession is missing or unresolved. Attribute and skill
  rules should not flood the result with misleading wrong-profession errors when their prerequisite
  is unknown.
- Identical primary and secondary authored IDs when the ID itself is unresolved: duplicate-pair
  error, unresolved warnings, or both.
- Split-skill duplicate detection: whether raw IDs, resolved mode variants, or a canonical split-group
  identity determine duplication.
- Conflicting catalog flags such as `pveOnly` plus PvP availability, non-player plus supported, or a
  skill whose attribute and profession references disagree.
- Malformed runtime input beyond skill-bar length, including non-array attributes, invalid mode,
  duplicate catalog keys, and structurally invalid catalog records. The API accepts `Build`, while the
  security section calls the input untrusted plain data; that trust boundary needs one explicit rule.
- Behavior after a non-array or wrong-length skill bar is detected: stop bar validation, inspect the
  available slots, or normalize a read-only view.
- Whether deferred title/allegiance issues appear once per skill, once per missing capability, or only
  when a complete/export policy requests them.

### Definition of Done Completeness

The Definition of Done is broad and mostly traceable to implementation phases. It should additionally
require:

- explicit editing-versus-complete policy tests;
- custom budget, mode override, unresolved-severity, and deferred-policy tests;
- no-mutation assertions for builds, catalogs, options, and contribution arrays;
- catalog-version mismatch and catalog-integrity behavior;
- suppression or precedence tests for cascading issues;
- an exact definition of partial/invalid calculations;
- a real promoted-catalog compatibility test, rather than an optional smoke test, if catalog
  compatibility is a prerequisite for calling the sprint complete;
- a documented compatibility policy for issue-code additions, source-rule changes, and result
  versioning.

The current `ok` criterion is incomplete: “no error issues” does not mean complete, resolved, or safe
to export. The DoD should prove each state independently.

## Critique of `SPRINT-007-GPT54-DRAFT.md`

### Strengths

- The implementation structure is more modular. Separate profession/attribute, skill-bar, and
  skill-eligibility validators give future rule families clearer ownership and reduce pressure on the
  orchestrator.
- The dependency graph and phase gates are easy to execute. Moving the effective-rank work after
  attribute semantics is reasonable, even though it need not block skill-bar work.
- It gives deliberate treatment to diagnostic noise: a blank bar and a partial bar are distinguished,
  and unresolved skills are explicitly prevented from cascading into false eligibility failures.
- The checklist-style Definition of Done is measurable, and repository verification includes both
  the main verification command and ticket-burn tests.
- Its security section correctly treats authored documents and caller catalogs as untrusted data and
  rejects HTML, executable content, dynamic imports, and exception leakage.

### Weaknesses

- Dot-and-bracket string paths are less robust than the GPT-5.5 draft's segment arrays. They require
  parsing, escaping rules, and canonical formatting for property names. The proposed ordering also
  sorts by string path before numeric index, which can place `attributes[10]` before
  `attributes[2]`. Sorting by severity is unstable when severity is policy-configurable.
- The issue-code set collapses distinct facts too aggressively. One `UNRESOLVED_PROFESSION` code
  loses primary-versus-secondary identity; `ATTRIBUTE_RANK_INVALID` does not distinguish malformed
  rank from a valid integer unsupported by the cost table; skill disposition, missing split variant,
  unsupported records, and non-player records have no explicit codes.
- A singular `relatedEntity` is restrictive for comparisons such as duplicate rows, conflicting
  professions, budgets, and split variants. The GPT-5.5 array model is more durable.
- Numeric `slot` is described as serving skills, weapon sets, and future equipment even though those
  address spaces are different. A bare number becomes ambiguous as soon as the contract expands.
- Making all duplicate non-elite skills warnings is an unproven policy choice. The absence of a broad
  uniqueness field does not establish that an exact repeated known skill is legal. Exact-ID
  duplicates and canonical split-family duplicates need a game-rule decision, not a blanket severity
  downgrade.
- Deferred title/allegiance gaps are warnings here but informational by default in GPT-5.5. More
  importantly, both use severity to stand in for “the engine lacks facts,” which does not say whether
  a workflow may proceed.
- The rationale for scheduling effective-rank work before skill rules is weak: the proposed skill
  eligibility rules require attribute availability, not effective rank. The calculator can remain an
  independent branch after the shared attribute/context work.
- The draft exports `createValidationContext`, making an internal optimization structure part of the
  public API. That will constrain later refactoring and extension more than the stated use cases
  require.

### Gaps in Risk Analysis

- It does not analyze incompatible catalog versions or broken cross-catalog references.
- It proposes extension hooks without addressing issue-code namespacing, execution order, duplicate
  issues, exceptions thrown by extensions, or the impossibility of enforcing callback purity.
- `sourceRule` values explicitly include ticket IDs, coupling runtime consumers to planning
  structure.
- `exportBlocked` is derived from severity, while incomplete and unresolved states remain warnings.
  The result can therefore declare export unblocked even when it cannot establish legality.
- The risk table does not cover API/version churn, localization pressure from domain-owned messages,
  performance bounds for hostile oversized arrays, or partial calculations from invalid inputs.
- Small fixtures are the main verification method, but catalog-shape compatibility is optional. This
  leaves the central integration assumption unproven.

### Missing Edge Cases

- Unsupported and non-player skill records, dispositioned IDs, and missing split variants.
- Invalid manual overrides, non-finite contributions, override-plus-additive contribution precedence,
  and duplicate-allocation behavior in effective-rank calculation.
- Secondary-without-primary behavior in the final issue policy, despite being listed as a task.
- Exact handling of an empty bar versus a partial bar under editing and complete workflows.
- Duplicate unresolved IDs and split-family duplicates.
- Catalog ID collisions, catalog version incompatibility, and dangling profession/attribute links.
- Cascades caused by missing or unresolved professions and by invalid attribute ranks.
- Runtime-invalid build fields other than the skill bar.

### Definition of Done Completeness

The Definition of Done is clear but less complete than the tasks. It does not explicitly require
unsupported/non-player skill behavior, missing split-variant behavior, option/default matrices,
summary-count or `exportBlocked` semantics, extension-hook behavior, no-mutation guarantees, or
catalog compatibility against promoted artifacts. It also does not define whether the public context
shape is normative or internal.

The plan should not be closed merely because paths, severities, and ordering are deterministic; it
must also prove that the chosen semantics are correct across editing, completeness, and export
policies.

## Cross-Draft Contradictions

| Decision | GPT-5.5 draft | GPT-5.4 draft | Merge consequence |
| --- | --- | --- | --- |
| Sprint metadata | `draft`, created/updated 2026-09-02 | `planned`, created 2026-09-01 | Use one current date and keep the merged artifact `draft` until semantic conflicts are resolved. |
| Context API | `createBuildValidationContext` | `createValidationContext` | Choose one name; preferably keep the context internal initially. |
| Orchestrator/file | `build-validation.ts` with rule groups | `validate-build.ts` plus rule-family modules | Use a small orchestrator with separate rule-family modules. |
| Issue path | Array of typed segments | Dot-and-bracket string | Use segment arrays as normative data; add formatting only at presentation boundaries. |
| Slot metadata | Typed slot selector | Bare numeric slot | Use a typed locator or rely on the structured path; do not use an ambiguous number. |
| Related entities | Array | Singular object | Use an array because many diagnostics inherently relate multiple records. |
| Result | `ok`, summary, mandatory calculations | Issues, counts, derived `exportBlocked` | Separate legality/completeness from workflow export policy; keep rank calculation opt-in. |
| Duplicate known skill | Error | Non-elite duplicate warning | Resolve from an authoritative game rule and canonical skill identity before implementation. |
| Empty slots | Per-slot issues by profile | One aggregate partial-bar warning; blank bar special-cased | Define a profile-specific aggregation policy and stable paths before contract tests. |
| Deferred title/allegiance | Info by default | Warning by default | Represent missing-rule coverage explicitly; let export policy decide whether it blocks. |
| Missing secondary | No default issue unless required/complete | Missing selections generally warn | Adopt the conditional GPT-5.5 behavior and test secondary-without-primary separately. |
| Issue codes | Fine-grained, domain-prefixed | Smaller generic set | Start fine-grained where callers need distinct remediation, but avoid speculative future codes. |
| Effective rank | Included in validation calculations | Independent public helper | Keep it independent until a concrete validation consumer requires embedded calculations. |
| Extension model | Typed callback list appended after MVP rules | Minimal hook interface | Defer callback execution or define a separately versioned, namespaced extension protocol. |
| Ordering | Rule group, authored order, slot, code | Family, string path, index, severity, code | Use rule family plus numeric authored coordinates plus code; never sort by configurable severity. |

## Merge Recommendations

1. **Define result semantics before issue severities.** Return factual issues plus explicit legality,
   completeness, and resolution state. Derive exportability from a named policy/profile. Do not make
   `ok` or `exportBlocked` a hidden synonym for the current severity map.

2. **Adopt one minimal public contract.** Prefer segment-array paths, typed locators, related-entity
   arrays, domain-owned rule IDs, and a result/policy version. Keep messages deterministic but
   non-normative. Avoid ticket IDs and speculative future entity kinds in the runtime contract.

3. **Keep validation context internal for the MVP.** Export `validateBuild` and the standalone
   effective-rank calculator. Expose context later only when a demonstrated external validator needs
   it; otherwise its lookup layout becomes accidental public architecture.

4. **Use GPT-5.4's module decomposition with GPT-5.5's richer rule coverage.** A small orchestrator
   should call separate profession/attribute, skill-bar, and skill-eligibility validators. Keep
   effective-rank calculation separate and opt-in.

5. **Replace callbacks with a safer extension boundary.** For this sprint, either omit extension
   execution entirely or provide a pure result-composition utility. If extensions are required now,
   specify namespaced codes, deterministic ordering, error containment, version compatibility, and
   duplicate handling; do not claim callback purity can be enforced.

6. **Resolve catalog assumptions before freezing codes.** Add acceptance fixtures using the promoted
   EPIC-03/04 shapes to prove budget fields, PvE-only counting semantics, common/no-attribute
   classification, disposition meanings, split-mode resolution, and cross-catalog references. A
   compatibility test should be required, not optional, if these catalogs are sprint prerequisites.

7. **Create a rule-precedence matrix.** It should define suppression and calculation behavior for
   missing/unresolved professions, invalid or duplicate attributes, unresolved/dispositioned skills,
   malformed bars, split variants, and conflicting catalog flags. This prevents one bad prerequisite
   from producing a cascade of false issues.

8. **Do not apply the PvE 200-point budget silently to PvP or unknown mode.** Require an explicit
   budget policy in those modes or return an unsupported/unknown-policy outcome. Document whether the
   PvE default represents theoretical maximum quest completion rather than character-specific state.

9. **Settle duplicate identity and empty-bar policy explicitly.** Exact known duplicate IDs,
   canonical split-family duplicates, and duplicate unresolved authored values are different cases.
   Blank, partial, and complete bars should have profile-specific expected results without per-slot
   noise changing unpredictably.

10. **Strengthen the merged Definition of Done.** Require no-mutation tests, editing and complete
    policy matrices, custom-option tests, catalog mismatch behavior, cascade suppression, partial
    calculation semantics, promoted-catalog compatibility, result versioning, and deterministic
    ordering independent of severity. Generate closeout run paths at execution time unless a fixed
    path is externally mandated.

The best merged draft would retain the shared pure-domain boundary, GPT-5.4's modular validator
layout, and GPT-5.5's detailed catalog outcomes and edge-case coverage. It should postpone claims of
API stability until the legality/completeness/export model and the catalog-dependent assumptions are
proven by representative integration fixtures.
