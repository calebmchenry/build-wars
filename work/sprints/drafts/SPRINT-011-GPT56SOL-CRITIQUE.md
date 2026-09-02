# Combined Critique: SPRINT-011 Runes Catalog Drafts

## Executive Assessment

Both drafts converge on a sensible core: SPRINT-011 should deliver a framework-neutral rune catalog through the existing ingestion platform, keep armor UI and full stat calculation out of scope, preserve source uncertainty rather than infer unsupported rules, and promote only a small set of deterministic artifacts. They also correctly isolate the highest-applicable attribute bonus from independently countable health penalties.

The GPT-5.5 draft is the stronger base because it treats source authority, stable identity, deterministic replay, QA, and promotion as first-class release gates. The GPT-5.4 draft is easier to execute at a glance because it has clearer module ownership, an explicit dependency graph, phase estimates, and more concise phase acceptance statements. Neither is fully execution-ready. Both try to stabilize the runtime contract before the unresolved source shape has been sampled, both place too much operational source-accounting data in the proposed runtime catalog, and neither closes the long-term rules for schema evolution, semantic versioning, or identity preservation across wiki renames.

The most important contradiction is production qualification. GPT-5.5 makes reviewed live discovery/fetch and selected offline replay mandatory for sprint completion; GPT-5.4 calls live refresh optional while still requiring promoted production artifacts. The merged sprint must choose one definition. The safer recommendation is to require a reviewed production snapshot set for promotion, while allowing implementation and fixture gates to finish without network access and recording the sprint as blocked—not complete—if no production source set can be qualified.

## Review of `SPRINT-011-GPT55-DRAFT.md`

### Strengths

- It gives source authority appropriate weight. The bounded-hybrid default, source-shape checkpoint, digest confirmation, explicit source dispositions, and instruction to block rather than silently broaden the crawl form a coherent trust model.
- It has the clearest identity discussion of the two drafts. It rejects order-derived IDs, introduces a durable source key, requires collision checks, and treats post-promotion ID changes as blocking diffs.
- Its runtime/audit separation is strong at the file level. Raw pages, plans, snapshot manifests, review evidence, and full QA bodies are explicitly excluded from runtime JSON.
- The effect model preserves independent facts. Separating an attribute bonus from its health penalty avoids the most likely downstream calculation error and supports pure, caller-supplied-instance helpers without adding armor ownership or slot logic.
- Its determinism requirements are unusually complete: input ordering, API ordering, filesystem ordering, batch boundaries, concurrent completion, finding IDs, section digests, and fixed-clock replay are all considered.
- Promotion and security controls are concrete. Exact-path allowlisting, fixed-origin live access, path confinement, caps, inert parsing, metadata-only media, and explicit release gates are suitable for the existing ingestion platform.
- The Definition of Done is organized into source/identity, contract, semantics, determinism/QA, and promotion/closeout gates, making failure ownership visible.

### Weaknesses

- The plan acknowledges that source shape is the main ambiguity but still asks Phase 1 to stabilize a detailed contract before the Phase 2 source-shape checkpoint. Multi-rank pages, shared pages, family layouts, and effect syntax can all invalidate the proposed record and provenance shapes. A bounded discovery spike should precede final contract freeze.
- The runtime catalog is not as lean as the stated runtime/audit separation implies. Full `sourceSet` and `dispositions` sections are operational accounting concerns and can make runtime bytes and `catalogVersion` change when rejected candidates or review decisions change without any playable rune changing. The runtime catalog should retain compact per-record provenance and dependency/source-set digests; detailed dispositions belong in the manifest or QA report.
- Semantic ownership is duplicated. Rank, profession restriction, affected attribute, and stack group appear both at record level and inside effect variants, while stackability is represented through effects and catalog-level `stackGroups`. Without explicit invariants, these copies can disagree.
- The proposed `sourceKey` is still vulnerable to upstream renames because it is derived partly from canonical page identity. The draft identifies the ID-allocation decision but defers it until implementation rather than making it a precondition to contract acceptance.
- `condition-modifier` and `duration-modifier` broaden v1 beyond the demonstrated core. They require units, targets, conditionality, stacking scopes, and downstream combat concepts that the sprint otherwise defers. Note-only representation is safer until a shared modifier model exists.
- Requiring a named bounded disposition for every warning may turn harmless recurring content variance into an unbounded manual-review burden. The policy should allow reviewed finding classes or baseline rules while still blocking new or severity-increasing findings.
- The app boundary is slightly equivocal: the draft generally defers `src/app/catalogs.ts`, but allows wiring if a “concrete verification need” appears. Verification should not create an otherwise unused production import.
- The plan is highly prescriptive about new modules before confirming what the existing shared ingestion abstractions can absorb. This risks a rune-specific subsystem despite the stated goal of extending the shared platform.

### Gaps in Risk Analysis

- No explicit risk covers schema evolution or backward compatibility for future EPIC-13/14/21 consumers. `schemaVersion` is listed, but upgrade rules and compatibility tests are absent.
- Semantic `catalogVersion` behavior is underdefined. The draft requires mutation sensitivity but does not define major/minor/patch rules, persistence of the previous version, or how the version field avoids participating in its own digest.
- Upstream page rename, page deletion/recreation, page split/merge, and redirect changes are not tied to an identity-preservation procedure.
- Cross-catalog evolution is treated primarily as digest validation. There is no migration policy for an EPIC-03 profession or attribute ID correction after rune promotion.
- The risk of runtime payload and cache churn from audit-only `sourceSet` or disposition changes is not identified.
- Atomic multi-artifact promotion and rollback are not specified. A catalog, manifest, and QA report can be individually valid but mutually inconsistent after an interrupted write.
- QA caps are security-conscious, but there is no requirement that truncation or finding overflow itself blocks release; otherwise material errors could be hidden by the cap.
- Source licensing, attribution, and retained-text policy are delegated to earlier epics but are not an explicit promotion check here.
- Review capacity is listed as a dependency, but the schedule impact of first-baseline review, source-plan approval, and warning review is not treated as a high-likelihood delivery risk.

### Missing Edge Cases

- A production source set that is technically complete but yields zero accepted runes, or loses a large family/count relative to the approved baseline.
- A page containing multiple ranks or variants with shared identity, shared icons, or only partially parseable variants.
- A canonical page rename or redirect retarget that should preserve an existing `RuneId`.
- Equal highest bonuses from multiple equipped instances, including deterministic provenance of the winning or contributing instances.
- Mixed minor/major/superior copies for one attribute and multiple copies of the same `RuneId`.
- Orphaned or duplicate `familyId`, `stackGroupId`, `iconId`, profession, attribute, and provenance references.
- Invalid numeric facts: positive health “penalties,” negative bonuses, zero values, decimals, percentages, overflow, unexpected units, or locale-formatted numbers.
- Unknown, malformed, or note-only effects reaching a calculation helper; the required fail/ignore/report behavior is unspecified.
- Aliases and normalized-name collisions across ranks, punctuation, redirects, and future localization.
- Source changes between discovery approval and fetch, including category pagination changes, page removal, extra responses, and a mixed-revision snapshot set.
- QA-report truncation, duplicate stable finding IDs, and a baseline that suppresses a newly affected rune under an old finding class.
- Partial promotion or stale manifest/QA files surviving a failed generation.

### Definition of Done Completeness

This is the more complete DoD, but it needs several sharpened acceptance conditions:

- Add an independently reviewed coverage invariant—such as an expected family/rank matrix and approved count ranges—rather than treating source-set accounting alone as proof that all player-usable runes were found.
- Require a final stable-ID strategy and persisted registry/alias behavior before any production record is generated.
- Add referential-integrity checks for every family, stack group, icon, profession, attribute, source, and provenance reference.
- Define schema compatibility and `catalogVersion` rules, including what constitutes breaking, additive, and corrective changes.
- Require atomic publication and mutual digest agreement across catalog, manifest, and QA artifacts.
- Make selected production replay byte-identical for all three promoted artifacts, not only their shared semantic content, or explicitly document which operational fields are excluded from byte equality.
- Require baseline review for additions, removals, family/rank count drift, and accepted-to-disposition transitions.
- Make QA overflow/truncation a blocking finding.
- State unambiguously that `src/app` remains unchanged in this sprint.

## Review of `SPRINT-011-GPT54-DRAFT.md`

### Strengths

- The execution sequence and ticket dependency graph are concise and easy to follow. Phase percentages total 100%, and each phase has a clear acceptance statement.
- Module ownership is easier to understand than in the GPT-5.5 draft. Source planning, extraction, normalization, pure TypeScript helpers, orchestration, and QA each have an identified home.
- It explicitly warns against introducing a parallel catalog vocabulary and against coupling downstream callers to Python or raw catalog arrays.
- It preserves uncertainty through typed states and diagnostics instead of forcing ambiguous wiki prose into calculated values.
- The proposed tests connect the Python-generated fixture to the TypeScript contract and compose rune adjustments with the existing effective-attribute-rank helper, which is valuable integration coverage.
- Its scope boundary is disciplined: no UI, persistence schema, remote media bytes, full stat calculator, or audit-artifact runtime imports.
- The Files Summary and bookkeeping section make execution and closeout responsibilities concrete without requiring readers to infer touched areas.

### Weaknesses

- Its central sequencing premise is risky: “lock the wire shape” before freezing or even proving the source set. That reduces local churn only if the unverified source shape happens to match the proposed model; otherwise it guarantees contract rework or lossy extraction.
- Stable identity is materially underplanned. The draft says IDs must not come from array position, but it specifies neither a registry nor a deterministic allocation/collision policy, and stable ID allocation is absent from its open questions and DoD.
- It calls live refresh optional while requiring selected-snapshot offline replay and promoted production artifacts. It does not say where an approved production snapshot set comes from or whether stale/preexisting snapshots are acceptable.
- The effect-state proposal conflates domain facts with ingestion quality. An “absent” effect should generally mean there is no effect record; “malformed” is usually a QA/extraction disposition rather than a runtime effect that every consumer must understand.
- Runtime `sourceSet` and dispositions repeat the same audit-boundary problem as GPT-5.5. Rejected source records are not needed for gameplay consumers and will create unrelated runtime version churn.
- `rune-effects.ts` is simultaneously conditional in the task language and mandatory in the module/file summaries. More importantly, its public helper API is being designed before a concrete downstream consumer contract exists.
- It combines semantic normalization and catalog assembly in `rune_catalog.py`. This is concise, but it can entangle parser evidence, game-rule normalization, versioning, and serialization unless explicit intermediate types and tests preserve those boundaries.
- Its risk of premature abstraction is not reflected in the phase estimates. Only 18% is assigned to the unresolved source-set problem, while later phases assume its shape and coverage are settled.

### Gaps in Risk Analysis

- The risk table omits stable-ID collision and identity drift, EPIC-03 dependency changes, partial/mixed snapshot replay, QA noise or truncation, helper scope creep, source unavailability, and interrupted promotion.
- It does not analyze the trade-off between a small runtime payload and embedding source dispositions/dependency operations in that payload.
- It lacks a schema-version and downstream migration risk despite explicitly creating APIs for later equipment epics.
- It does not address source completeness independently of the chosen discovery graph, creating a circular “the index is complete because the index produced the set” assumption.
- It does not cover API pagination/order drift, canonical-title changes, shared multi-variant pages, or revision inconsistency across a source set.
- It assumes existing shared ingestion components can support EPIC-10, but does not make a reuse-versus-extension checkpoint explicit; the proposed new modules may duplicate existing abstractions.
- It does not call out the manual effort and schedule uncertainty associated with approving the first production baseline.

### Missing Edge Cases

- Multi-rank/shared pages and partial extraction of one variant from an otherwise accepted page.
- Duplicate source keys and duplicate canonical pages in addition to duplicate display names.
- Rename/redirect preservation of an already promoted ID.
- Condition- or duration-related rune effects that do not fit the five proposed variants.
- Conflicting icon candidates, a shared icon across variants, an icon redirect, and an invalid non-image media title.
- Empty accepted output, unexpected family/rank count drops, and every candidate becoming a disposition.
- Orphaned IDs and inconsistent record-level versus effect-level profession, attribute, rank, or stacking facts.
- Ties for highest bonus, same-ID duplicate instances, mixed ranks, unknown effects in helper input, and deterministic result ordering.
- Unexpected numeric signs, units, ranges, conditional clauses, and source text with multiple effects in one field.
- Extra, duplicated, mixed-profile, path-escaping, or digest-mismatched snapshot entries.
- QA overflow, baseline suppression drift, and partial publication of the three promoted files.

### Definition of Done Completeness

The DoD covers the broad deliverables but is weaker as a release contract than GPT-5.5's:

- “SPRINT-011 exists as an execution-ready sprint” is bookkeeping, not product acceptance.
- Stable ID allocation, collision handling, rename preservation, and generated-data ID diff review are missing.
- It lacks explicit `appConsumptionGate` and `publicReleaseGate` requirements and does not define the allowed warning state.
- It does not require input-order, filesystem-order, batch-order, or concurrent-completion determinism.
- Offline replay is required to reproduce only the catalog; manifest and QA reproducibility and mutual consistency are not stated.
- There is no semantic-digest mutation matrix, semver rule, or schema compatibility gate.
- Snapshot-set rejection criteria are described in Phase 2 but not carried into the final DoD.
- Referential integrity, coverage/count baselines, empty-output rejection, QA-overflow handling, and atomic promotion are absent.
- The DoD should make production source qualification explicit rather than relying on the ambiguous “manual live mode” language.

## Cross-Draft Contradictions and Strategic Trade-offs

| Topic | GPT-5.5 | GPT-5.4 | Recommended Resolution |
| --- | --- | --- | --- |
| Draft status | `draft` | `planned` | Keep `draft` until source authority, ID policy, and production gate are resolved. |
| Production qualification | Live discovery/fetch and selected offline replay are mandatory; network failure blocks completion. | Live refresh is optional, despite requiring promoted outputs and selected offline replay. | Require an approved production snapshot set for promotion. Let fixture/offline implementation finish without network, but do not mark the sprint complete without qualified production data. |
| Contract timing | Notes the source ambiguity but still defines contracts before the Phase 2 checkpoint. | Explicitly locks the wire shape before freezing the source set. | Add a short source-shape/coverage checkpoint before final contract acceptance; then freeze contract and fixtures together. |
| Source authority | Proposes a bounded hybrid and detail pages as primary record authority. | Leaves index/category/family strategy entirely open. | Adopt the bounded-hybrid hypothesis, but require independent family/rank coverage evidence before approving it. |
| Stable IDs | Requires a source key plus registry or deterministic allocator, but leaves the choice open. | Only prohibits order-derived IDs. | Choose a persisted reviewed registry keyed by durable logical rune/variant identity, with source aliases and collision tests. Do not use title hashes as the public ID. |
| Extraction modules | `rune_infobox.py` plus separate `rune_semantics.py`. | Generic `rune_extractors.py`, with normalization in `rune_catalog.py`. | Prefer source-shape-oriented extractor adapters plus a separate semantic normalization layer. Name files after responsibilities only after checking existing platform conventions. |
| Effect scope | Includes condition/duration variants when clear. | Limits v1 to attribute/health/energy plus notes. | Keep v1 structured support to fixed attribute/health/energy effects. Preserve other facts as reviewed notes until a shared modifier vocabulary exists. |
| Uncertainty | Uses `note-only` and `unsupported` variants plus QA. | Suggests `known`, `absent`, `unknown`, and `malformed` states on effects. | Keep valid uncertain semantics as `unknown`/note-only; keep malformed source data out of accepted runtime records and in dispositions/QA. Do not emit “absent effects.” |
| Semantic ownership | Record fields, effect fields, and `stackGroups` can overlap. | Record fields plus stacking/per-effect states can also overlap. | Define one canonical owner per fact. Prefer record-level eligibility/classification, effect-level values and application scope, and catalog-level stack groups only when rules genuinely span families. |
| App integration | Defaults to docs-only but leaves a verification exception. | Explicitly defers `src/app/catalogs.ts` to a later epic. | Keep `src/app` unchanged; validate the catalog through domain/contract tests instead of an unused app import. |
| Verification depth | Comprehensive determinism, release, and path gates. | Focused and readable but omits several production invariants. | Use GPT-5.5's release gates, organized with GPT-5.4's concise phase acceptance structure. |

## Merge Recommendations

1. **Insert a pre-contract source checkpoint.** Sample the candidate index/category pages, representative attribute-rune pages, common-family pages, redirects, and at least one shared/multi-rank shape. Produce a short coverage decision and representative synthetic fixtures before freezing `RuneCatalog`.

2. **Make production policy explicit.** Separate “implementation complete” from “sprint complete.” Fixture mode and offline mechanics must never require live access, but production promotion must be derived from a reviewed, complete snapshot set. If no such set can be obtained or approved, retain draft/in-progress status with a named blocker.

3. **Narrow the runtime catalog.** Keep playable rune records, semantic group definitions actually needed by consumers, compact provenance, media metadata, and dependency/source digests. Move candidate accounting, exclusions, malformed inputs, review records, and detailed dispositions to the manifest/QA report. This prevents audit-only changes from invalidating runtime caches and versions.

4. **Resolve identity before implementation.** Use a checked-in or otherwise promoted registry that maps a durable logical rune variant to `RuneId`, records canonical/legacy source aliases, detects collisions, and makes renames non-breaking. Define IDs for rune families and stack groups only if consumers need them; otherwise avoid creating extra identity domains.

5. **Define a single semantic schema.** Record-level fields should own family, rank, and eligibility. Effects should own value, unit, target, application scope, and stacking rule. Avoid duplicating profession/attribute/rank inside effects unless an individual effect can legitimately differ from its record. Malformed extraction belongs in QA, not the runtime union.

6. **Keep v1 semantics deliberately small.** Structure attribute bonuses, health penalties, health bonuses, and energy bonuses. Treat condition/duration/conditional behavior as typed reviewed notes until a cross-feature modifier contract exists. This trades some immediate expressiveness for lower long-range migration risk.

7. **Preserve a clean parsing boundary.** Source adapters should emit a deterministic intermediate representation with bounded raw evidence; semantic normalization should convert it to game facts; catalog assembly should sort, validate references, digest, and serialize. Whether these require two or three files should follow existing ingestion conventions rather than the draft's provisional filenames.

8. **Limit helper API commitment.** Implement only pure lookup and the demonstrated highest-bonus/independent-penalty operation. Define behavior for duplicate instances, ties, unknown effects, and deterministic output. Defer full summaries or effective-stat integration until an equipment consumer supplies slots, legality, and character context.

9. **Adopt GPT-5.5's stronger release gates with additions.** Add independent coverage baselines, zero-output rejection, referential integrity, schema compatibility, ID-registry diffs, semantic-version rules, QA-overflow blocking, and atomic three-artifact promotion. Require count/family/rank additions and removals to be reviewed.

10. **Use GPT-5.4's execution presentation.** Retain the dependency graph, phase acceptance statements, and focused verification commands, but remove speculative file edits and percentages until the source checkpoint shows the real parser and review workload.

11. **Clarify versioning.** `schemaVersion` should govern wire compatibility. `catalogVersion` should follow documented content-change rules and be computed outside the content digest it labels. Audit-only source or review changes should update manifest/QA identity without necessarily changing the runtime catalog version.

12. **Close the cross-catalog lifecycle.** Record the exact EPIC-03 dependency sections used, reject failed dependency QA gates, and define what happens when profession/attribute IDs or meanings change. At minimum, the DoD should require a dependency-upgrade compatibility test and an explicit migration review for breaking ID changes.

The merged draft should not be marked planned until four decisions are closed: the approved production source authority and coverage invariant, the stable ID registry policy, the runtime-versus-audit data split, and the production live/snapshot completion gate.
