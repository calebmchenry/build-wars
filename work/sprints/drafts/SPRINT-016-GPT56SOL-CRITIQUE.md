# Sprint 016 Draft Critique

## Executive assessment

Both requested drafts are present and were reviewed. They agree on the sprint's essential direction: title rank is authored build state; no override means catalog-defined maximum behavior; title facts come from the promoted skill catalog through a pure domain helper; the UI stays within the Skills workspace; existing PvE-only behavior is preserved; and current skill-template/share formats do not gain title-rank fields.

That shared direction is coherent, but the combined plan is not yet execution-ready. Four contracts still need to be frozen before implementation:

1. Whether the runtime `Build` always contains an empty override array or treats the field as optional.
2. Whether either the build schema or local-library envelope version changes, and how missing versus empty state affects fingerprints and autosave.
3. Whether the two Sunspear keys are proven aliases, and what a single control means when their series have different domains.
4. Whether unresolved title conditions get new issue codes or reuse codes whose current names and semantics say "deferred."

The largest architectural risk is the proposed Sunspear envelope. Per-series clamping prevents out-of-range reads, but it does not by itself create a coherent user model. With implicit defaults, two series in one alias group can simultaneously resolve to different maxima; with an explicit scalar override, the same control can become a no-op for one selected skill and meaningful for another. Phase 0 must establish whether this is a source-data defect, a legitimate alias with heterogeneous row coverage, or two distinct concepts before the storage key and UI behavior are committed.

## Review of `SPRINT-016-GPT55-DRAFT.md`

### Strengths

- It treats the catalog ambiguity as a first-class correctness problem and explicitly rejects silently dropping either Sunspear source key.
- Its scope boundaries are disciplined. Account ownership, title acquisition, party state, ingestion, backend sync, and a new share codec remain out of scope.
- The proposed pure helper and catalog boundary are sound: leaf components do not traverse generated data, and series-specific rank resolution remains centralized.
- Sparse override storage, reset-by-removal, selected-skill relevance, and an optional all-title view form a coherent low-noise UX.
- Validation is framed as resolving known metadata while retaining narrow warnings for genuinely incomplete facts, rather than merely deleting existing deferrals.
- The plan preserves the PvE-only rule's current owner and asks for exact three-versus-four regression tests instead of redesigning an unrelated rule.
- Its Definition of Done is the more comprehensive of the two, especially for display surfaces, alias behavior, old-save cleanliness, persistence paths, and closeout artifacts.
- Security boundaries are concrete: bounded array input, no runtime network or generated-data boundary changes, and no title JSON in URLs.

### Weaknesses

- Several items are called "binding defaults" while equivalent contract choices remain open later. Schema versioning, unknown persisted keys, alias treatment, and warning thresholds cannot all remain open if downstream phases are expected to implement against a frozen model.
- The state model is underspecified. The draft says missing persisted state hydrates to `[]`, but does not clearly distinguish the persisted DTO from the normalized in-memory `Build`. That ambiguity affects fixtures, equality, fingerprints, autosave, and whether resetting the last override removes an entry or the field itself.
- The alias section offers two bounded behaviors without selecting one. Both avoid data loss, but they lead to different helper APIs, view models, diagnostics, and acceptance tests.
- `src/domain/title-rank.ts` is asked to own discovery, normalization, labels, resolution, clamping, and diagnostics. That is viable only if the draft defines a small set of stable return contracts; otherwise it risks becoming a general catalog-and-presentation utility.
- It does not separate developer-facing catalog diagnostics from user-facing build validation. A global alias conflict should generally fail an invariant test or produce telemetry/diagnostics, while a user warning should be scoped to a selected skill whose result cannot be resolved safely.
- Share behavior is not fully frozen. Warning only for an authored override represents actual payload loss; warning whenever a skill relies on an implicit default would add noise even though no authored title state is being discarded.

### Gaps in risk analysis

- Implicit maximum is catalog-relative. A saved build with no override can render differently after a catalog update raises, lowers, or remaps a domain. The draft must explicitly accept that behavior or add a version/reproducibility strategy.
- Canonical keys become durable identifiers. Renaming an alias or correcting the catalog later requires a migration policy; label derivation from a key is not a substitute for stable identity.
- Reusing one resolver from selectors and validation does not guarantee identical results unless both receive the same catalog snapshot and normalization policy.
- Dropping unknown-but-safe keys can cause downgrade or catalog-evolution data loss; blindly preserving them can retain unusable state. The risk and chosen compatibility policy are absent.
- Clamping corrupted persisted values silently can manufacture an authored choice. Rejecting to implicit default, clamping with a diagnostic, and rejecting the record are materially different behaviors.
- Changing issue codes or issue ordering can break tests, documentation, and any downstream consumers. The validation compatibility surface is not assessed.

### Missing edge cases

- Multiple selected skills sharing one canonical title but having different raw domains, including what the control displays and what decrementing from implicit default does.
- An override that is above one selected series' maximum but below another's, producing a per-series no-op and a meaningful change at the same time.
- Non-contiguous or incomplete progression rows inside an otherwise valid `rankDomain`, not merely a wholly missing row set.
- A title dependency repeated across multiple progressions on one skill, and deterministic deduplication across multiple slots.
- Removing the last relevant skill after preconfiguring an override. The preconfiguration use case implies the override must remain, even if the default panel hides it.
- Catalog removal or renaming of a title key after a build has been saved.
- Temporary direct-entry states such as an empty field, out-of-range pasted input, blur without commit, and Escape/reset behavior.
- Importing a skill template over a working draft that already contains overrides, which should share the existing discard-warning pattern.
- Whether title-classified skills without progression metadata affect the controls, validation only, or both.

### Definition of Done completeness

The checklist covers the main user and persistence journeys well. It should additionally require:

- a frozen runtime-versus-persisted state contract and a no-autosave/no-fingerprint-change test for old records;
- explicit keyboard and screen-reader acceptance, not only phase-level tests;
- a chosen schema-version decision for both the build object and library envelope;
- an explicit unknown-key and malformed-rank policy;
- selected-skill behavior for mixed-domain alias groups, including reset and decrement from default;
- issue-code compatibility and deterministic deduplication/order;
- import-overwrite discard warnings as well as share/export omission warnings; and
- documented behavior when catalog versions change implicit maxima.

## Review of `SPRINT-016-GPT54-DRAFT.md`

### Strengths

- It is concrete about phase order, file ownership, phase dependencies, and verification commands.
- It cleanly separates domain logic, reducer structure, selectors, UI, validation, and persistence responsibilities at a high level.
- It identifies the eight raw keys and proposes seven user controls while retaining raw keys for exact series resolution.
- It correctly keeps `renderSkillTooltipText` caller-driven rather than adding a second title-specific lookup path inside the renderer.
- It covers omission warnings on share/export and discard warnings when template import replaces authored overrides.
- Accessibility, deterministic issue ordering, exact PvE-only boundaries, and responsive layout receive explicit test attention.
- Its phase estimates and focused test commands make execution and review easier to sequence.

### Weaknesses

- It commits to collapsing Sunspear aliases and using an envelope maximum before proving that the keys are semantically identical. Per-series clamping protects array access but can hide an upstream data defect and create misleading controls.
- The proposed envelope lacks an interaction model for implicit default. If one series defaults to 10 and another to 15, there is no single truthful `current / max` scalar. Starting a decrement from 15 can also leave a max-10 selected skill unchanged.
- It freezes `LOCAL_LIBRARY_SCHEMA_VERSION` at `1` without distinguishing that envelope from any version on `Build` or first proving that serializer, parser, fingerprint, and saved-record contracts regard the new field as additive.
- Making `Build.titleRankOverrides` optional throughout runtime state saves serialized bytes but spreads absent-versus-empty branching across reducers, selectors, validation, cloning, and tests.
- The reducer is described as catalog-independent and accepting already-bounded input, while persistence validators are expected to apply discovered bounds. This either couples persistence to the catalog or permits invalid semantic state to enter the reducer. Structural validation and catalog-backed semantic resolution need separate owners.
- Reusing `skill.title-deferred` and `skill.allegiance-deferred` while changing their meaning preserves identifiers at the cost of semantic clarity. A code named "deferred" is a poor durable contract for specific missing-key, missing-domain, or ambiguous-side failures.
- The security section accepts only known canonical keys, but the compatibility consequences of removing a formerly known or newer key are not addressed.

### Gaps in risk analysis

- Catalog-version drift and non-reproducible implicit maxima are unaddressed.
- The risk of cementing a temporary catalog defect into durable canonical IDs and persisted migrations is unaddressed.
- The alias-envelope UX risk is reduced to "confusing control caps," but the deeper issue is that default is per-series while override is a group scalar.
- There is no risk entry for semantic issue-code reuse or for divergent title resolution between display and validation.
- There is no treatment of no-op state churn: hydrating an old record, adding an empty field, or canonical sorting must not dirty drafts or trigger autosave.
- Strict known-key filtering can silently lose state during downgrade, restore, or catalog correction.

### Missing edge cases

- Conflicting alias members selected at once, including how the panel explains different effective ranks.
- A selected skill clamped below the canonical control value and whether the UI shows the authored value, effective value, or both.
- Unknown keys from a newer backup or a removed catalog definition.
- Duplicate canonical entries after alias normalization and which entry wins, if any.
- Empty, partial, and invalid number-input commits.
- The persistence size/count bound and deterministic behavior when it is exceeded.
- A title override that becomes irrelevant after skill removal but must remain available for preconfiguration.
- Catalog diagnostics that exist globally but do not affect the current skill bar.
- Stable warning deduplication for several slots with the same unresolved title or allegiance condition; the draft leaves this as an open question.

### Definition of Done completeness

The checklist captures the principal happy paths and includes accessibility, persistence, share omission, and verification. It is weaker than the GPT-5.5 checklist on canonical storage invariants, explicit Sunspear acceptance, all display surfaces, malformed input, and old-record cleanliness. It should add measurable criteria for:

- sorted, unique, bounded override state and duplicate handling;
- missing-versus-empty equivalence in serialization, fingerprints, and autosave;
- mixed-domain alias UI and effective-rank behavior;
- pinned tooltip and every other independently assembled display path;
- malformed, unknown, and obsolete persisted keys without silent data loss;
- exact validation codes, order, scope, and deduplication;
- catalog-version drift; and
- discard warnings when imports replace existing authored overrides.

## Cross-draft contradictions

| Decision | GPT-5.5 draft | GPT-5.4 draft | Recommended merge |
| --- | --- | --- | --- |
| Draft status | `draft` | `planned` | Keep the merged artifact in `draft` until the unresolved contracts below are frozen. |
| Runtime state | Missing persisted state hydrates to an empty array; reset removes the override entry. | Field is optional, omitted on fresh builds, and removed when the last override resets. | Use a required canonical array in normalized runtime state and an optional field in persisted input/output. Treat missing and empty as semantically identical, and omit empty output only if fingerprints and autosave normalize both forms. |
| Schema version | Leaves build-version choice open and suggests retaining v1 unless incompatibility is found. | Binds local-library schema v1. | Name and decide the build schema and library-envelope schema separately after a reader/writer blast-radius test. An additive optional persisted field can remain v1 only with explicit backward-compatibility tests. |
| Sunspear model | Surfaces ambiguity and permits either a merged control or grouped internal sources. | Mandates one envelope-domain control with per-series clamping. | Make the catalog audit a gate. Do not persist the alias decision until provenance establishes semantic equivalence. If grouping remains necessary, model `default` as per-series behavior and expose effective clamping rather than pretending default is one scalar. |
| Validation codes | Suggests specific new or revised codes for each unresolved condition. | Reuses generic `*-deferred` codes with new meanings. | Prefer specific codes. Preserve old codes only through an explicitly documented compatibility mapping, not by silently changing their meaning. |
| Persisted unknown keys | Leaves preserve-versus-skip behavior open. | Rejects any key not currently known. | Choose a no-silent-loss policy. Either preserve structurally safe unknown entries inertly or reject restore atomically with a diagnostic; do not silently discard them and then overwrite the source record. |
| Bound enforcement | Leaves catalog clamping to selectors after structural persistence parsing. | Makes controls and persistence validators apply discovered bounds while keeping reducers catalog-independent. | Persistence should enforce shape, count, safe key syntax, and integer limits. The shared domain resolver should apply catalog semantics. Reducers should canonicalize structure or reject invalid actions rather than relying solely on callers. |
| Share warnings | Leaves open whether implicit defaults also warn. | Warns for non-empty authored overrides and on destructive template import. | Warn only when authored overrides will be omitted or overwritten. Document that a title-free template resolves to the recipient catalog's implicit maxima. |
| UI component | `TitleRankControls` | `TitleRankPanel` | Pick one name during merge; this is not architectural, but file lists and tests must agree. |

## Long-range architecture risks and unresolved assumptions

1. **Default-max is not reproducible state.** It intentionally follows the installed catalog. The sprint must say whether saved builds are expected to change when catalog maxima change. If yes, document it and test version-mismatch messaging where applicable. If no, sparse implicit defaults are insufficient.
2. **Canonical keys are a migration surface.** Once persisted, they must not be casually derived from mutable raw strings. Use a small explicit canonical-ID and alias registry with documented migrations, even if discovery of domains remains data-driven.
3. **Alias correctness precedes alias UX.** An envelope maximum is safe computationally but may be false semantically. The audit needs an explicit outcome: fix the catalog, keep separate controls, or establish a supported alias group.
4. **Default and explicit modes are different types of state.** Default can mean each raw series' own maximum; an override is one authored scalar subsequently clamped. The view model should retain that distinction rather than reduce both to `current / max`.
5. **Validation and display need one resolution result.** A shared helper should return effective rank, raw source key, whether the value came from default or override, clamp status, and diagnostics. Tooltip rendering and validation should consume that same result, not independently call loosely related helpers.
6. **Catalog defects should not become general user noise.** Global duplicate or alias conflicts belong in tests and developer diagnostics. Build issues should appear only when the current selection cannot be rendered or validated reliably.
7. **Compatibility needs a non-destructive policy.** Unknown keys, future catalog entries, and corrected aliases can appear through backups or downgrade. Silent dropping followed by autosave is the worst outcome.
8. **Allegiance remains semantically incomplete.** A rank-first control must not suppress a side/exclusivity warning unless the catalog supplies enough facts to prove that the selected skill is resolved. The required facts and warning granularity need to be specified.

## Merge recommendations

1. Adopt the GPT-5.5 draft's caution and diagnostic depth, and the GPT-5.4 draft's phase sequencing, file ownership, accessibility coverage, and explicit template-import warning.
2. Freeze a two-layer state contract: normalized runtime builds contain a sorted, unique override array; persisted DTOs may omit the empty field; missing and empty serialize, fingerprint, clone, and autosave identically.
3. Turn the Sunspear audit into a Phase 0 exit criterion. No UI or durable canonical key should land until the audit selects and documents one semantic model.
4. Define a single pure resolver result consumed by selectors and validation. Keep storage parsing structural and catalog-independent; keep catalog-backed recognition, aliasing, clamping, and diagnostics in the domain resolver.
5. Introduce specific validation issue codes for missing key, missing domain, missing row, alias conflict, and unmodeled allegiance semantics. Define deterministic scope, ordering, and deduplication.
6. Warn on share/export only when non-empty authored overrides are lost, and warn before template import overwrites such state. Do not warn for implicit defaults alone.
7. Add a compatibility decision for unknown or obsolete keys that prevents silent loss. Include backup restore, downgrade, and subsequent autosave in its tests.
8. Explicitly accept or solve catalog-version drift. The lowest-scope choice is to document that implicit max tracks the current catalog and that share recipients also resolve against their current catalog.
9. Promote the strongest acceptance criteria from both drafts into the final Definition of Done: accessibility, exact PvE-only boundaries, every display surface, old-save cleanliness, malformed input, alias behavior, warning semantics, import/share loss, and final repository verification.

With those decisions made, the sprint has a strong, bounded architecture. Without them, implementation is likely to encode temporary catalog ambiguity into durable state and then spread compensating behavior across persistence, selectors, UI, and validation.
