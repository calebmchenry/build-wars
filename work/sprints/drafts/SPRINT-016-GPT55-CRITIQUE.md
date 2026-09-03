# SPRINT-016 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-016-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-016-GPT54-DRAFT.md`

Per instruction, `work/sprints/drafts/SPRINT-016-GPT55-DRAFT.md` was not read or critiqued.

## Critique: SPRINT-016-GPT56SOL-DRAFT.md

### Strengths

- The architectural boundary is strong. A framework-neutral `src/domain/title-rank.ts` owns key grammar, aliases, labels, domain analysis, override projection, and diagnostics, while app selectors and validation consume the same result.
- The persistence contract is explicit: nested `Build` schema 2, unchanged outer local-library envelope and storage key, sorted `{ key, rank }` arrays, bounded parsing, duplicate rejection, and reset-by-removal.
- The draft correctly treats title ranks as semantic per-build state rather than transient UI state or account-global state.
- The Sunspear alias conflict is handled honestly. Empty state preserves per-series implicit maxima, explicit overrides are limited to common exact rows, and metadata ambiguity remains visible.
- PvE-only behavior is kept at its current owner, `src/domain/rules/skill-bar.ts`, with clear instructions not to fold PvE counting into title-rank logic.
- The validation direction is healthier than reusing old placeholder warnings: replace broad deferral codes with narrower resolved, unresolved, ambiguous, override, and allegiance-side outcomes, and bump the rule-engine version.
- The share/template boundary is explicit. Title overrides stay local-only, current skill-template bytes remain unchanged, and omission/replacement warnings are required.
- Security concerns are unusually well covered: untrusted persisted JSON, bounded arrays, safe integers, prototype-safe rank contexts, no generated-data imports outside the catalog boundary, and no source HTML.

### Weaknesses

- The draft is very large for a sprint plan and risks turning implementation into compliance with a specification rather than delivery of the smallest coherent feature. The file lists many docs, manifests, fixture migrations, contract tests, boundary tests, closeout records, and result artifacts that may be valid but create substantial execution overhead.
- The plan locks many implementation details before code inspection: exact issue-code replacement strategy, null-prototype bridging, diagnostic ordering, hard parser cap, specific component placement, and expanded docs structure. Some should be acceptance constraints, but some may be better left to the implementer once existing abstractions are confirmed.
- The schema-2 decision is defensible, but the draft underplays fixture churn and migration blast radius. Advancing every shared build fixture to schema 2 can obscure real failures if it is not isolated early.
- The alias-group common-domain model is principled, but it gives up the alternative of a context-specific control domain based only on selected skills. That tradeoff is implied, not fully evaluated.
- The plan assumes the current promoted catalog signatures, including eight raw keys and the Sunspear `0-10`, `0-12`, `0-15` conflict, are stable enough to encode in tests. That is useful as a baseline but brittle if EPIC-04 metadata is repaired during or before execution.
- Validation derives title definitions independently while the app adapter also computes a reusable catalog. The draft says both use the same pure constructor, but it does not spell out caching, invalidation, or cost if validation runs frequently.
- Some open questions affect core behavior, especially whether an override at the common maximum should be stored for conflicting definitions. That nuance should be resolved before implementation, not left as a late ambiguity.

### Gaps In Risk Analysis

- Catalog churn risk needs more detail. The draft says structurally valid unknown overrides are retained, but it should also cover keys that later become aliases, domains that shrink, and previously conflicting aliases that become coherent.
- Restore and recovery policy is underspecified for mixed-good and mixed-bad libraries. A malformed schema-2 override should not unnecessarily sacrifice unrelated saved builds if existing recovery mechanisms can isolate the bad record.
- Performance risk is acknowledged for browser row rendering, but validation-time recomputation and selector memoization are not addressed.
- Accessibility risk is mostly in implementation tasks and DoD, not the risk table. Native number input behavior, mobile keyboards, rejected draft text, live-region noise, and conflict messaging deserve explicit risk coverage.
- The risk table does not call out issue-code migration consumers. Replacing `skill.title-deferred` and `skill.allegiance-deferred` affects tests, unresolved-code accounting, saved validation freshness, and any UI copy keyed by code.
- The plan does not include a rollback or partial-landing strategy if schema migration works but UI integration slips.

### Missing Edge Cases

- Skills with mode-specific progression dependencies need a clear rule for PvE, PvP, and unknown mode before relevant-title controls are computed.
- A skill with multiple title dependencies, multiple series for one canonical title, or the same raw key at different implicit maxima should have direct tests.
- Reset semantics for conflicting alias groups need explicit acceptance criteria. For coherent definitions, setting max removes state; for conflicting definitions, the common maximum may still be meaningful authored state.
- Unknown-but-structurally-valid overrides that later become known aliases should have a migration or resolution expectation.
- Backup restore merge/replace scenarios with schema-1 and schema-2 builds in the same payload should be covered directly.
- Browser preview behavior for unselected skills with stale or out-of-domain overrides should be specified, including where the warning appears.
- Title-ranked PvE-only skills in PvP or unknown mode need tests proving mode issues and title metadata issues compose without changing PvE-only counts.

### Definition Of Done Completeness

- The Definition of Done is broad and mostly complete across domain, persistence, controls, rendering, validation, PvE-only, verification, docs, and closeout.
- It should explicitly require resolution of the open questions that affect implementation semantics before coding begins.
- It should distinguish required sprint success criteria from desirable hardening. As written, a large number of docs and ledger/result-manifest updates can make the sprint look incomplete even if the product behavior is correct.
- It should add measurable performance criteria for browser and validation paths, or at least require tests/memoization proving the title catalog is not rebuilt per visible row.

## Critique: SPRINT-016-GPT54-DRAFT.md

### Strengths

- The draft is concise and execution-oriented. Its phase order is easy to follow: pure helper, durable state, controls, display integration, validation cleanup, then share/docs closeout.
- It correctly avoids a new title ingestion path, keeps the promoted EPIC-04 catalog as the data source, and keeps the skill-template/share format unchanged.
- It places title-rank state on `Build`, which is the right ownership boundary for semantic skill output.
- It keeps reducers catalog-independent by having selectors or persistence validate discovered bounds before state is written.
- It preserves the current PvE-only rule unless regression tests prove a bug, which is the right scope boundary.
- It recognizes the eight raw title keys and the need to collapse the two Sunspear forms into one user-facing control.
- It keeps `renderSkillTooltipText` on its current caller-supplied rank-context contract, reducing tooltip API churn.

### Weaknesses

- The persistence model is too loose. An optional `Build.titleRankOverrides` field with no nested build schema bump creates ambiguous authored shape, weaker fixture/fingerprint guarantees, and unclear migration semantics.
- The draft says malformed persisted title ranks should "clamp or drop" bad values. Silent clamping or dropping can erase authored state and hide catalog problems. Structurally valid stale values should generally be retained with warnings and explicit reset.
- The Sunspear design is risky. It proposes deriving the control domain from the alias-group envelope and then clamping per series. That can make the authored value and rendered value diverge, hide the metadata conflict, and falsely imply one coherent Sunspear maximum.
- Reusing `skill.title-deferred` and `skill.allegiance-deferred` with changed meanings is a compatibility trap. Existing consumers cannot distinguish "not implemented yet" from "resolution attempted but metadata remains unresolved" unless the rule-engine version and issue contract change clearly.
- The draft does not specify exact row coverage, duplicate progression rows, duplicate series IDs, missing value slots, non-finite values, or unsafe domains in enough detail.
- There is a tension between persistence being catalog-independent and the security section saying persisted input should accept only known canonical title keys. If persistence cannot read the catalog, it cannot know the current canonical key set.
- The reducer accepts an already-bounded integer, but the draft does not fully cover what happens when actions are forged, stale UI bounds are used, or the catalog changes after state exists.
- Risk analysis is brief and misses several high-impact risks around schema compatibility, validation code migration, catalog churn, and data loss.

### Gaps In Risk Analysis

- No meaningful analysis of optional-field compatibility versus an explicit nested build schema version.
- No clear recovery strategy for malformed backups or local-library records containing title overrides.
- No assessment of stale or unknown overrides when catalog definitions change.
- No analysis of false confidence caused by per-series clamping under mixed Sunspear domains.
- No rule-engine freshness/versioning risk despite changing validation issue semantics.
- No performance analysis for selector or validation recomputation.
- No security detail for prototype keys, duplicate canonical aliases, unsafe arrays, recursive dangerous structures, or diagnostic bounds.
- No rollback or partial-delivery strategy if UI controls land before validation cleanup.

### Missing Edge Cases

- Persisted duplicate canonical keys, raw Sunspear aliases stored directly, and dangerous keys such as `__proto__`, `constructor`, or `prototype`.
- Unknown but syntactically valid title keys that are not in the current catalog.
- Mixed schema libraries, backup restore merge/replace, duplication, save-as-new, dirty-state, and fingerprint behavior.
- Blank, decimal, exponential, out-of-range, negative, and unsafe integer input in the title controls.
- Skills with multiple title dependencies or multiple series for the same title.
- Missing progression series, missing `titleKey`, missing `rankDomain`, duplicate ranks, row gaps, and non-finite progression values.
- Mode-specific title dependencies and unknown-mode relevant-control behavior.
- PvE-only title skills in PvP or unknown mode where mode restrictions and title metadata warnings must compose.
- Reset behavior when the authored rank equals the maximum for one raw series but not another raw alias member.

### Definition Of Done Completeness

- The DoD captures the main user-visible outcomes but is too high-level for a risky persistence and validation change.
- It does not require a deterministic build schema contract, exact migration behavior, dirty-state/fingerprint coverage, or backup/restore recovery coverage.
- It does not require replacement issue codes or a rule-engine version bump, even though validation semantics change.
- It does not require exact-row resolution tests or explicit protection against interpolation and hidden clamping.
- It lacks final hygiene checks such as `git diff --check` and broad app/domain regression commands beyond `npm run verify`.
- It leaves open questions that directly affect implementation behavior without requiring resolution before execution.

## Cross-Draft Comparison

GPT56SOL is the stronger architectural draft. It better protects semantic correctness, persistence durability, validation clarity, catalog-boundary integrity, and the known Sunspear metadata conflict. Its main problem is size and over-prescription.

GPT54 is the stronger execution summary. It is easier to read, easier to phase, and less likely to bury implementers in process artifacts. Its main problem is that it takes shortcuts in exactly the areas where this sprint is most fragile: schema semantics, alias-domain conflict handling, warning-code compatibility, and stale persisted state.

The most important design disagreement is the Sunspear alias strategy:

- GPT56SOL: implicit state uses each series maximum; explicit overrides are limited to common exact rows; conflicts remain visible.
- GPT54: one canonical control can use the alias-group envelope and clamp per series.

The GPT56SOL approach should win. Per-series clamping after accepting a larger canonical authored rank can produce misleading UI and validation output. A single canonical override must mean the same authored rank wherever it is projected, or it should be unresolved with a warning.

The second major disagreement is persistence:

- GPT56SOL: nested `Build` schema 2 with required sorted override array after migration.
- GPT54: additive optional field without a build schema bump.

The GPT56SOL approach should win here too. Title ranks affect rendered skill output, saved records, duplication, backup/restore, fingerprints, and omission warnings. That is a semantic build-contract change and deserves an explicit nested schema version while keeping the outer library envelope stable.

The third major disagreement is validation codes:

- GPT56SOL: replace broad deferral codes with narrow issue codes and advance `RULE_ENGINE_VERSION`.
- GPT54: keep existing deferral codes but change their meaning.

GPT56SOL should win. Reusing old codes with new semantics risks stale UI copy, misleading unresolved-code accounting, and unclear saved validation freshness.

## Merge Recommendations

- Use GPT56SOL as the semantic and architecture baseline.
- Trim GPT56SOL's execution surface using GPT54's clearer phase flow. Keep the phase sequence simple: domain helper, schema/persistence, controls, display integration, validation cleanup, share/docs closeout.
- Keep `Build` schema 2, but explicitly state that the outer local-library envelope and `build-wars:v1` storage key remain unchanged.
- Store canonical overrides as a bounded, sorted array of `{ key, rank }`. Do not use an optional object map and do not persist raw keys.
- Resolve Sunspear and future aliases with a common exact editable domain for explicit overrides. Preserve per-series implicit maxima when no override exists. Never silently clamp a canonical authored rank to a different rendered rank without a visible unresolved/ambiguous outcome.
- Replace `skill.title-deferred` and `skill.allegiance-deferred` with new narrow issue codes, and bump the rule-engine version.
- Retain structurally valid unknown or stale overrides with warnings and reset affordances. Reject malformed, duplicate, unsafe, oversized, or unsupported structures deterministically.
- Keep reducers catalog-independent, but make mutation helpers validate against caller-supplied domain definitions and make validation re-check persisted state against current catalog facts.
- Add an explicit caching/memoization expectation so the title catalog is not recomputed per browser row or excessively during validation.
- Keep share URLs and skill-template bytes unchanged. Add omission/replacement warnings for non-default title overrides, composed with existing equipment warnings.
- Keep PvE-only counting completely separate from title-rank resolution. Add regression tests for exactly three PvE-only skills, fourth-and-later failures, PvP restriction, unknown mode, and title-ranked PvE skills.
- Convert GPT56SOL's long file/doc/result-manifest list into a smaller required closeout list unless those artifacts are mandatory for the repository's sprint process.

## Missing Alternative Designs To Document

- **Per-build overrides versus account-profile defaults**: choose per-build overrides now because rendered skill output is build-specific and account ownership is out of scope. Defer account/global title profiles.
- **Single canonical control versus per-raw-key controls**: choose one canonical Sunspear control to avoid exposing catalog noise, but constrain explicit overrides to common exact rows so the single control does not lie.
- **Common-domain explicit overrides versus envelope-plus-clamp**: choose common-domain overrides. Envelope-plus-clamp should be rejected because it allows authored and rendered ranks to diverge.
- **Nested build schema bump versus optional additive field**: choose nested build schema 2 for deterministic migration, fixtures, fingerprints, and backup/restore behavior.
- **Retain stale overrides versus drop/clamp on read**: choose retain-and-warn for structurally valid stale data. Drop only malformed or dangerous structures.
- **New validation codes versus reused deferral codes**: choose new codes plus rule-engine v3 to make semantic changes observable.
- **Current share format versus versioned title-aware share format**: preserve the current format in this sprint and disclose omission. Plan a later share-format version only if equipment and title state can be handled coherently together.
- **Context-specific control domains versus global canonical domains**: prefer global canonical domains for stable stored semantics, but document that this may constrain editing when only one selected skill uses a wider raw series.

## Recommended Final Shape

The combined sprint should be a tightened GPT56SOL:

- Keep the strict contracts for title discovery, aliasing, exact-row resolution, schema-2 persistence, validation issue replacement, sharing omission, PvE-only isolation, and security.
- Adopt GPT54's simpler implementation narrative and avoid turning every supporting doc or manifest into a blocker unless repository policy requires it.
- Resolve the open behavior questions before execution, especially conflicting-alias max/reset semantics and allegiance warning granularity.
- Make the DoD smaller but sharper: schema migration, exact alias/domain behavior, cross-surface rendering, validation code contract, PvE-only regressions, template/share omissions, accessibility basics, and `npm run verify`.
