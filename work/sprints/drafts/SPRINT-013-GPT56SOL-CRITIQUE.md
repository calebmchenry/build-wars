# Combined Critique: SPRINT-013 GPT-5.5 and GPT-5.4 Drafts

## Overall assessment

Both drafts converge on a sound core: one bounded ingestion profile, separate weapon and modifier catalogs, registry-backed public identities, raw template IDs as crosswalks, conservative effect modeling, and strict preservation of EPIC-05 raw-template fidelity.

Neither draft is fully executable as written under the non-interactive ticket-burn contract. The main blockers are unresolved source completeness criteria, discretionary Phase 1 architecture changes, manual approval language without an autonomous decision procedure, and contradictory ownership around template resolution and compatibility.

The strongest merged plan would use the GPT-5.4 draft as the execution backbone and add the GPT-5.5 draft’s source-authority matrix, retention policy, richer QA coverage, security detail, and identity lifecycle rules.

## GPT-5.5 draft

### Strengths

- Provides the stronger field-level source-authority model. It distinguishes candidate membership, semantic facts, crosswalks, effects, media, and display text, with explicit conflict outcomes.
- Draws a clear runtime/audit boundary and correctly excludes source plans, snapshots, QA bodies, paths, copied prose, and media bytes from runtime JSON.
- Handles identity evolution more completely through non-reuse, tombstone, rename, split, merge, supersession, and migration expectations.
- Gives unusually good attention to deterministic ordering, semantic digest scope, stable finding IDs, QA overflow, fixed-clock reproduction, and source retention limitations.
- Includes broader malformed-input and ambiguity fixtures than the GPT-5.4 draft.
- Its security considerations are comprehensive and proportionate to a MediaWiki ingestion pipeline.
- Correctly acknowledges that ignored snapshots limit long-term exact reproducibility.

### Weaknesses

- The plan is internally inconsistent about artifact shape. It permits Phase 1 to collapse the catalogs while later phases, paths, verification commands, allowlists, and the Definition of Done assume six exact promoted files.
- Phase 3 can begin after Phase 1 while sharing source-plan and pipeline structures with Phase 2. That permits two tickets to mutate the same source graph and orchestration code without defining an ownership or merge protocol.
- BW-1205 permits a new `equipment-template-resolution.ts`, while the overview says EPIC-12 adds derived lookups only and assigns broader resolution to EPIC-17. This is avoidable scope expansion.
- The compatibility helper mixes independent concerns. Missing requirement data, note-only effects, and unknown effect semantics do not necessarily make a modifier structurally incompatible or unresolved for a weapon. Catalog validity, structural applicability, and effect interpretability need separate outcomes.
- Offhand/two-handed conflicts and duplicate-slot checks generally require weapon-set state, not a single base/modifier pair. They exceed the helper’s stated boundary.
- The domain model treats shields and focuses as weapon bases without defining per-kind required facts. Damage, requirement, and slot fields cannot have one uniform completeness rule across damaging weapons, shields, and focuses.
- The proposed caps are examples rather than justified limits. A non-interactive executor cannot determine whether exceeding 160 detail pages means the source scope is wrong, the cap is wrong, or promotion must block.
- The plan adds substantial specialized ingestion surface—separate planners, identity modules, extractors, semantic modules, catalogs, and registries—without addressing the maintenance cost or the risk of duplicating generic source-set logic.

### Gaps in risk analysis

- No explicit protection against publishing mismatched generations of the two catalogs. Separate manifests and versions need a shared release-set identity or companion-digest linkage.
- No registry transaction model. It is unclear whether normal regeneration may allocate IDs, how two registry changes become atomic, or how failed promotion avoids leaving registry churn.
- Source-universe closure is not demonstrated. “Every player-usable candidate” cannot be proven from a bounded list unless the authoritative seed set and completeness rule are fixed.
- No schema migration or compatibility policy for future consumers of the public IDs and wire formats.
- No clear distinction between a legitimate duplicate normalized name and an identity collision.
- The long-term cost of a profile-specific two-output pipeline is not analyzed.
- Runtime dispositions, provenance, identity summaries, and media metadata could inflate catalog size, but no consumer-based inclusion test is supplied.

### Missing edge cases

- One template ID mapping to multiple mode-specific variants, and multiple template IDs mapping to one semantic base.
- Historical, excluded, and unsupported base-item crosswalks, not only modifier crosswalks.
- A modifier with empty applicability meaning “universal” versus “unknown.”
- Conflicting allowlist and denylist applicability facts.
- Page deletion, redirect-chain changes, variant merges, and reappearance of tombstoned identities.
- Shields or focuses with no damage facts; weapons with no requirement; zero-rank requirements.
- Intrinsic versus removable modifiers, slot cardinality, repeated modifier families, and source-order significance.
- Variable-magnitude or parameterized modifiers.
- Unicode, punctuation, and alias normalization collisions.
- Shared or redirected icon identities.
- A valid catalog paired with an incompatible companion catalog from another generation.

### Definition of Done completeness

The Definition of Done is broad and mostly testable, but several conditions remain ambiguous:

- “Approved before schema freeze” does not identify the approving authority or autonomous pass criteria.
- A Phase 1 gate may be “settled or explicitly blocked,” but a blocked architecture decision must not allow BW-1201 to complete.
- Byte identity “across repeated fixed-clock fixture and selected offline runs” could be read as requiring fixture bytes to equal production bytes. It should require repeatability within each mode.
- “Both release gates pass for the promoted scope” needs exact predicates and explicit all-or-nothing behavior across both catalogs.
- Verification commands still contain placeholders and prose-only comparison steps.
- Allowlist verification uses `git check-ignore -v` without specifying the expected exit behavior for promoted versus ignored files.

## GPT-5.4 draft

### Strengths

- Presents the cleaner execution structure. The shared source planner and snapshot set are established before modifier extraction, reducing coordination risk.
- Adds effort percentages totaling 100%, making the sprint’s size and sequencing easier to evaluate.
- More clearly favors pure caller-supplied lookups in BW-1205 and explicitly rejects a semantic equipment-template resolver.
- Treats both catalog promotions as one completion unit and explicitly blocks BW-1206 if live evidence, selected replay, or review capacity is unavailable.
- Gives the narrow compatibility helper a clearer negative boundary.
- The shared planner with separate extractors and catalog writers is a coherent compromise between duplication and inappropriate domain coupling.
- Is shorter and more operationally readable than the GPT-5.5 draft.

### Weaknesses

- Recommends a profile-specific dual-write path as the default. This may minimize immediate churn but creates a special case that future multi-artifact profiles must either copy or later remove.
- The proposed weapon record shape is too rigid: `damageMin`, `damageMax`, and a non-empty `allowedModifierSlots` list do not naturally fit shields, focuses, or bases with unavailable facts.
- Several effect names are semantically misleading. HCT/HSR behavior is not a simple `casting-time-delta` or `recharge-time-delta`; it combines probability, magnitude, subject, and scope.
- The field-level source authority is less complete, particularly for conflicts among overview pages, detail pages, and template rows.
- Snapshot retention and the limits of future reproducibility are not addressed.
- Identity lifecycle requirements are thinner: tombstones, splits, merges, supersession, registry migration, and controlled allocation are not complete acceptance criteria.
- “Record the assumption, amend the sprint/ticket state, and continue” is unsafe for a high-risk architecture blocker. Some discoveries must terminate the burn rather than authorize self-directed scope changes.
- Shared modules such as `weapon_source_set.py` and `weapon_identity.py` have ambiguous ownership over two distinct registries and record families.

### Gaps in risk analysis

- No explicit multi-catalog release-set or version-skew mitigation.
- No detailed semantic-digest inclusion/exclusion policy or mutation testing.
- No clear warning disposition policy before promotion.
- No distinction between first registry bootstrap and later refresh behavior.
- No analysis of catalog growth, runtime payload cost, or provenance/media duplication.
- No explicit strategy for legitimate normalized-name collisions or mode-scoped crosswalks.
- No retained-evidence policy despite requiring selected offline replay.
- No explicit worktree inspection for source bodies, absolute paths, media, or ignored intermediate products.

### Missing edge cases

- Malformed numeric units, unsafe precision, invalid chance ranges, and subject/scope ambiguity.
- Same-page multi-variant identity evolution beyond the initial extraction case.
- One-to-many and many-to-one crosswalks.
- Historical or excluded base mappings.
- Empty versus universal applicability.
- Per-kind absence of damage, requirements, or modifier slots.
- Rename/deletion/tombstone refresh behavior.
- Compatibility results when catalog records come from different release generations.
- Stable finding IDs under reordered requests, paths, and timestamps.
- QA truncation that removes a whole finding class rather than merely exceeding a count.

### Definition of Done completeness

The Definition of Done is concise and generally coherent, but less complete than GPT-5.5’s:

- It does not require identity rename, split, merge, tombstone, or migration tests.
- It lacks explicit semantic-digest mutation tests and audit-only exclusion checks.
- It does not require every warning to have a bounded disposition.
- It does not define retention evidence or reproducibility limitations.
- Lookup outcomes omit an explicit `unsupported` result even though crosswalks can be unsupported.
- It does not specify a shared release identity across the two catalogs.
- The exact source seeds and autonomous source-review criteria remain unresolved.
- The same ambiguity exists around fixed-clock reproducibility and placeholder live/offline commands.

## Cross-draft contradictions

| Decision | GPT-5.4 | GPT-5.5 | Required resolution |
| --- | --- | --- | --- |
| Sprint status | `planned` | `draft` | Use the lifecycle state expected by ticket-burn before execution. |
| Catalog types | `WeaponCatalog`, `WeaponModifierCatalog` | `WeaponBaseCatalog`, `WeaponModCatalog` | Choose one stable public vocabulary. |
| Modifier collection | `weaponModifiers` | `modifiers` | Freeze the wire key before fixtures and digest design. |
| Helper uncertainty | `unknown` | `unresolved` | Use one outcome vocabulary across lookup and compatibility APIs. |
| Unsupported lookup | Folded into `dispositioned` | Sometimes a separate outcome | Define whether disposition is a result type or a reason payload. |
| Source planning | One shared planner/identity module | Separate base/mod planners and identity modules | Prefer one planner with separate registries and extractors. |
| Phase ordering | Modifier phase follows shared base/source gate | Modifier phase may start after Phase 1 | Require the shared source-plan schema and owner to be frozen first. |
| Template resolution | Explicitly out of scope | Optional derived resolver | Keep only pure lookups in EPIC-12. |
| Effect vocabulary | Time “delta” effects | Chance-oriented HCT/HSR effects | Model probability and effect magnitude separately or keep them note-only. |
| Artifact shape | Separate files assumed throughout | Collapse permitted in Phase 1 | Make the two-catalog/six-file shape binding for this sprint. |
| File naming | `weapon_base_*`, `weapon_modifier_*` | `weapon_*`, `weapon_mod_*` | Adopt consistent full names to reduce implementation drift. |
| EPIC-17 handoff | Party/equipment application | Broader template resolution | Align with the actual epic contract and use one description. |

## Merge recommendations

1. Use one shared, immutable source-plan and snapshot-set protocol, then separate base and modifier registries, extractors, semantic normalizers, catalog writers, manifests, and QA reports.

2. Make the two-catalog and six-promoted-file design binding. If a combined artifact is genuinely preferable, revise the sprint before ticket burn instead of permitting an in-flight amendment that invalidates later phases.

3. Keep BW-1205 to collision-safe, caller-supplied lookups. Defer semantic equipment-template resolution and weapon-set interpretation to their assigned downstream epic.

4. Replace the generic “weapon base” shape with a discriminated equippable-base model:

   - Damaging weapons require damage facts.
   - Shields and focuses have their own applicable base facts.
   - Requirements and slot capabilities carry explicit `known`, `none`, or `unresolved` states.
   - Slot capabilities include cardinality and applicability rather than only a non-empty list.

5. Separate three concerns:

   - Catalog-record validity.
   - Structural base/modifier applicability.
   - Effect semantic completeness.

   The compatibility helper should evaluate only static base-family and slot applicability. It should not use requirement completeness, effect interpretability, duplicate set state, or two-item occupancy.

6. Add a shared `releaseSetId` or equivalent digest to both catalogs and manifests. Promotion must be atomic, and each artifact should identify the companion catalog version or digest.

7. Define registry behavior explicitly:

   - First bootstrap allocation algorithm.
   - Read-only behavior during ordinary regeneration.
   - Explicit migration mode for new IDs.
   - Atomic updates across both registries.
   - Tombstone and rename rules.
   - Blocking behavior for unreviewed churn.

8. Turn Phase 1 review into a deterministic decision table. Specify exact evidence, thresholds, terminal outcomes, and who may record approval. Architecture changes, source broadening, or cap increases beyond enumerated limits should block rather than be silently self-amended.

9. Define source completeness without circular language. Freeze the seed titles or a versioned seed manifest and state precisely which candidate classes must be exhausted. “Every player-usable candidate” is not independently verifiable otherwise.

10. Adopt GPT-5.5’s detailed QA, retention, security, and worktree checks, while retaining GPT-5.4’s sequencing and all-or-nothing promotion rule.

11. Normalize vocabulary before implementation: catalog names, JSON keys, module names, lookup outcomes, compatibility outcomes, crosswalk statuses, effect kinds, digest names, and release gates must be identical across contracts, scripts, fixtures, tests, tickets, and documentation.

12. Make verification literally runnable: include the fixed-clock mechanism, concrete output comparison command, exact snapshot selection rule, and assertions for both promoted-file visibility and intermediate-file ignore behavior.

With those changes, the combined plan would be coherent and safely stoppable under non-interactive execution: routine source ambiguity could become a typed disposition, while source-universe failure, identity ambiguity, architecture drift, missing review authority, or paired-catalog inconsistency would produce a recorded blocker rather than an improvised design change.