# Sprint 005 Combined Critique: GPT56SOL and GPT54 Drafts

## Review Scope

Reviewed:

- `work/sprints/drafts/SPRINT-005-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-005-GPT54-DRAFT.md`

Not reviewed:

- `work/sprints/drafts/SPRINT-005-GPT55-DRAFT.md`

## Executive Assessment

Both drafts correctly frame SPRINT-005 as data and ingestion infrastructure, not UI work. They also agree on the most important boundary: runtime code should consume an approved local catalog and should not read raw snapshots, QA output, ingestion modules, wiki APIs, or parser structures.

GPT56SOL is the stronger architecture draft. It identifies the hard problems early: distinct catalog/template skill IDs, seed-source accounting, two-step live discovery/fetch, run-level snapshot-set manifests, EPIC-03 dependency digests, copied-description review, deterministic semantic versioning, and explicit PvE/PvP variant groups. Its main weakness is scale. It turns the sprint into a very large platform extension, data extraction project, legal/source-policy review, QA framework expansion, deterministic build system, and closeout workflow all at once.

GPT54 is more executable and easier to read. It has a cleaner phase sequence and a smaller risk table, but it leaves too many architecture decisions implicit or underspecified. It underplays the hidden complexity in MediaWiki page resolution, snapshot-set replay, description policy, progression parsing, semantic versioning, and manual review.

The merged sprint should use GPT56SOL as the architecture source of truth, but compress it using GPT54's simpler sequencing. It should also add an explicit source-shape checkpoint with go/no-go criteria and rejected alternatives, because both drafts assume more wiki regularity than has been proven in the sprint text.

## GPT56SOL Draft Critique

### Strengths

- Strongly separates runtime catalog consumption from ingestion artifacts, raw snapshots, manifests, QA reports, parser output, and wiki APIs.
- Correctly treats `SkillId` and `TemplateSkillId` as distinct concepts, while allowing v1 numeric equality as an explicit mapping rather than an implicit array/range assumption.
- Uses the `Guild Wars Wiki:Game integration/Skills/0` seed as a bounded source-set authority and requires every accepted seed entry to become either a catalog record or an explicit disposition.
- Introduces the right safety mechanism for live refreshes: discover the seed, compute an exact plan and digest, stop, then require explicit digest confirmation before fetching detail pages.
- Calls out run-level `SourceSnapshotSetManifest` as necessary for deterministic offline replay. This is materially better than scanning a shared snapshot tree.
- Handles EPIC-03 as a real dependency, including artifact digest, section digests, and QA state, rather than duplicating profession and attribute facts locally.
- Treats copied description text as source-policy material with digest-bound review, instead of disguising copied prose as harmless structured data.
- Normalizes PvE/PvP variants as a relationship group instead of duplicating directional links that can drift.
- Has the most complete determinism story: schema-owned sort keys, semantic projections, byte-for-byte replay, stable finding IDs, mutation tests, and clear separation between semantic and provenance-only changes.
- Defers acquisition metadata completely, which is the right default. Acquisition expands the page graph and source-policy surface without being necessary for the first runtime catalog.

### Weaknesses

- The sprint scope is too large. It includes source discovery, profile refactoring, snapshot-set manifests, full detail/icon fetching, infobox extraction, progression parsing, description tokenization, tooltip rendering helpers, QA matrix expansion, semantic versioning, manual review, promotion, docs, ticket updates, and ledger closeout.
- It is over-prescriptive before source-shape proof. The draft names many concrete templates, caps, fields, rank domains, and promotion gates before proving that the source pages fit those contracts.
- The pure tooltip helper may be premature. A reference renderer for tests is useful, but a runtime-facing tooltip API risks pulling EPIC-20-style tooltip behavior into a data sprint.
- The manual review model is heavy and somewhat underspecified. The draft requires named reviews for source sets, descriptions, warnings, and first baseline, but it does not define where review records live, who performs them, what format is authoritative, or how ignored review work maps to promoted review references.
- The single runtime catalog appears to carry substantial provenance, source, review, media, and dependency metadata. That may be acceptable, but the draft does not seriously evaluate a split between a small runtime catalog and a separate audit/provenance artifact.
- The hard ceilings in the overview are plausible but arbitrary. They need to be derived or validated during the source-shape checkpoint, not treated as design truth.
- The ignored snapshot-set strategy creates replay fragility. The draft acknowledges that historical replay depends on retained local ignored snapshots or a fresh refresh, but it does not decide whether that is acceptable for long-term reproducibility.
- The DoD includes process updates to tickets, sprint files, and ledger files alongside technical gates. That is fine for execution, but it makes it harder to distinguish artifact correctness from planning-record hygiene.

### Gaps In Risk Analysis

- The seed authority assumption is not challenged enough. If `Skills/0` is stale, incomplete, includes non-skill integration entries, or changes shape, the whole catalog source set inherits that weakness. Category/list pages are mentioned only as optional QA cross-checks, but the sprint should define what happens if those checks find omissions.
- MediaWiki expansion semantics are still a major unknown. `mwparserfromhell` can parse wikitext, but it does not expand templates the way MediaWiki does. The draft mentions unsupported transclusion/wrapper risk, but the mitigation is not concrete enough.
- Description review is likely to be a critical-path blocker. The draft correctly marks this as high risk, but it still schedules most review closure in Phase 5, after much implementation work has already accumulated.
- Full-catalog QA volume could become unusable. The draft discusses output caps and shared evidence, but it does not specify summarization thresholds, sampling rules, or what happens when thousands of records share the same systematic finding.
- The EPIC-03 dependency may be stable technically but not semantically complete for skills. Special skill classifications, no-attribute skills, title skills, monster skills, and PvE-only cases may require controlled exceptions that are not purely EPIC-03 joins.
- Network and source availability are covered, but rate limiting, continuation behavior, retry backoff, API response reordering, and partial imageinfo responses deserve more explicit treatment because they directly affect large live refreshes.

### Missing Edge Cases And Alternative Designs

- Missing or multiple skill infoboxes on a resolved page.
- Canonical page reuse where one page legitimately represents multiple accepted IDs versus an accidental collision.
- Same-page PvE/PvP variants versus separate accepted IDs versus wrapper-only split references.
- Seed entries that are valid integration IDs but intentionally unsupported in the catalog.
- Unicode normalization, punctuation variants, parenthetical titles, renamed skills, and titles that collide after normalization.
- Description fields with nested templates, links, comments, HTML entities, table fragments, or generated text that is only visible after template expansion.
- Progression forms with multiple value slots, non-integer values, negative-looking text, conditional text, non-monotonic values, missing ranks, title-rank caps, and split-specific progression.
- Icon fields that point to missing files, redirects, shared default icons, non-image pages, ambiguous file names, or imageinfo without stable metadata.
- Alternative design not evaluated: ship a core skill-facts catalog first, then add reviewed descriptions/progressions in a follow-up sprint.
- Alternative design not evaluated: publish a lean runtime catalog plus a separate provenance/review artifact, instead of embedding all audit metadata in the runtime file.
- Alternative design not evaluated: store compact formula descriptors plus a small evaluator instead of expanding every progression into per-rank tables.
- Alternative design not evaluated: use the seed as the primary source but require category/list cross-checks to produce reviewed omission findings before promotion.

### Definition Of Done Completeness

GPT56SOL has the more complete DoD, and most of its gates are valuable. It covers identity, source-set accounting, exact replay, EPIC-03 dependency checks, joins, cost states, description policy, progression, variants, metadata-only icons, provenance, semantic versioning, determinism, live refresh, exact-path allowlisting, offline verification, docs, and no-commit execution.

The problem is not missing coverage; it is excess and duplication. The DoD is so long that it may be hard for an executor to tell which items are release blockers, which are phase gates, and which are documentation/process hygiene. It should be reorganized into smaller groups: architecture gates, ingestion gates, catalog-content gates, policy/review gates, determinism gates, promotion gates, and closeout gates.

The final DoD should also add explicit go/no-go criteria for the source-shape checkpoint, review-record storage rules, and a fallback state when live refresh or manual description review cannot complete during the sprint.

## GPT54 Draft Critique

### Strengths

- Clearer and more compact than GPT56SOL. The phase sequence is easier to execute and easier to review.
- Correctly identifies the current `page_limit=200` profile default as insufficient for EPIC-04.
- Establishes a useful source-set boundary before extraction, which is the right architectural sequence.
- Keeps runtime network access, UI search, template import/export, rule-engine behavior, and attribution UI out of scope.
- Correctly uses EPIC-03 as the authority for profession and attribute joins.
- Calls out exact-path promotion and deny-by-default generated artifact behavior.
- Includes a practical risk table that covers source-set scale, redirects, copied prose, progression diversity, EPIC-03 conflicts, icon metadata, determinism, and live-refresh availability.
- The DoD is shorter and more usable than GPT56SOL's checklist.

### Weaknesses

- Too many critical architecture choices are left soft. It mentions selected snapshots and source-set planning, but does not strongly require a run-level snapshot-set manifest with complete/partial state, child digests, extra/missing rejection, and profile isolation.
- The live workflow is less safe. It does not make the discover/fetch split and exact digest confirmation as central as GPT56SOL does.
- The description policy is ambiguous. It says broad copied rendered prose should be review-gated and "must not be required for baseline promotion," but the use cases and DoD still expect tooltip/search projections. That creates a loophole where descriptions could be partial, copied, or omitted without a clear catalog completeness tier.
- Acquisition metadata remains optionally includable if a source-shape checkpoint finds a small factual field. That is scope creep. It should be fully deferred from schema v1.
- Progression and tooltip scope is underspecified. The draft asks for tooltip-ready projections but does not define token contracts, rank domains, unresolved outcomes, or how unsupported source-indicated progressions affect promotion.
- Semantic versioning and section digests are mentioned but not deeply enough. The draft does not require mutation tests for every runtime-semantic field or explicitly exclude provenance-only changes from semantic version changes.
- The artifact layout includes `data/qa/epic-04/skills.catalog.summary.txt`, then later says only the catalog, manifest, and machine-readable QA JSON should be allowlisted. That can be resolved, but the final plan should be unambiguous that summaries are ignored by default.
- It underestimates the cross-language contract drift risk between Python-generated JSON and TypeScript domain types.

### Gaps In Risk Analysis

- No explicit risk that a changed seed could authorize thousands of unintended requests without a digest-confirmed plan.
- No explicit risk that offline replay might mix snapshots from different profiles, revisions, or partial live runs.
- No explicit risk that MediaWiki response order, normalization, redirects, continuation, or duplicate canonical pages could lose the requested-title association.
- No explicit risk that template expansion behavior differs from raw wikitext parsing.
- No explicit risk that manual description review becomes the critical path.
- No explicit risk that semantic versioning omits a runtime field or invalidates downstream consumers on provenance-only refreshes.
- No explicit risk that generated QA findings become too large or too noisy to review.
- No explicit risk that optional acquisition metadata creates a broader crawl and source-policy review.
- No explicit risk that earlier EPIC-02/EPIC-03 fixture behavior regresses while the ingestion profile model is refactored.

### Missing Edge Cases And Alternative Designs

- Duplicate canonical targets, not just duplicate IDs or titles.
- Redirect loops, soft redirects, disambiguation preambles, and title normalization collisions.
- Missing detail pages after seed acceptance.
- Pages with no infobox, multiple infoboxes, malformed infobox names, or unexpected template aliases.
- Null profession/attribute joins that are legitimate only for specific classifications.
- Cost/timing states beyond a few common fields: explicit zero, signet/no-cost, upkeep, sacrifice percentage, overcast, adrenaline, morale-boost recharge, absent versus not-applicable, and malformed source text.
- Description token safety, unsupported markup, line breaks, nested templates, source links, and copied-text review invalidation.
- Multi-slot progressions, title-rank progressions, constants, unsupported wrappers, no-progression skills, non-monotonic values, and split-specific value tables.
- Missing reciprocal split links, self-links, same-page split variants, and contradictory mode flags.
- Icon metadata ambiguity, default icon heuristics, file redirects, non-image file pages, missing MIME/dimensions/hash, and the privacy/reliability implications of remote media URLs.
- Alternative design not evaluated: a two-tier promotion where core facts can promote while descriptions/progressions remain blocked or excluded by record-level completeness.
- Alternative design not evaluated: formulas versus expanded rank tables.
- Alternative design not evaluated: keeping provenance in a separate audit artifact to reduce runtime catalog size.
- Alternative design not evaluated: mandatory category/list cross-checks that can only create QA omissions, not expand the accepted source set.

### Definition Of Done Completeness

GPT54's DoD is readable and covers the main product-level outcomes: linked tickets, plain-data domain boundary, dynamic profile planning, record-or-disposition accounting, numeric skill IDs, core fields, cost distinctions, EPIC-03 joins, tooltip/search readiness, progression metadata, split relationships, metadata-only icons, source references, QA, deterministic fixture generation, live refresh, allowlisting, release gates, offline `verify`, docs, and no commit.

It is incomplete for a sprint with this much ingestion risk. It should add explicit gates for digest-confirmed live fetch, run-level snapshot-set manifests, rejection of partial/mixed/extra/missing replay inputs, stable finding IDs, semantic mutation tests, description digest review, first-baseline review, and proof that earlier ingestion profiles still produce compatible outputs.

It should also remove ambiguity around acquisition metadata and description completeness. The final DoD should say acquisition metadata is absent from schema v1, and it should define whether missing or unreviewed descriptions block promotion, exclude only affected records, or allow a lower completeness tier.

## Comparative Notes

- Architecture: GPT56SOL is stronger. Its explicit identity, source-set, snapshot-set, dependency, description-policy, variant, and determinism decisions should be retained.
- Execution shape: GPT54 is stronger. Its phase flow is easier to execute, but it needs GPT56SOL's gates added at the right points.
- Scope control: neither draft is strict enough about a smallest useful catalog. GPT56SOL has better boundaries but still pulls in tooltip rendering and extensive review machinery. GPT54 is smaller but leaves acquisition and tooltip projections too open.
- Risk posture: GPT56SOL is more realistic about high-impact failure modes. GPT54 is useful as a summary but misses several risks that can invalidate promotion.
- DoD: GPT56SOL is comprehensive but unwieldy. GPT54 is usable but under-specified. The final plan should combine GPT56SOL's substance with GPT54's readability.

## Merge Recommendations

1. Base the final sprint on GPT56SOL's architecture decisions: distinct `SkillId`/`TemplateSkillId`, seed record-or-disposition accounting, two-step discover/fetch with exact digest confirmation, `SourceSnapshotSetManifest`, EPIC-03 dependency section digests, safe description tokens, normalized PvE/PvP variant groups, deterministic semantic projections, and exact-path promotion.

2. Use GPT54's simpler six-phase structure, but add phase gates from GPT56SOL. The final phase list should stay readable and avoid repeating the full QA matrix in every section.

3. Add an explicit Phase 1 source-shape checkpoint with go/no-go outcomes. It should prove seed cardinality, representative page shapes, infobox aliases, description markup, progression templates, split wrappers, icon fields, API limits, and estimated output sizes before freezing contracts.

4. Defer acquisition metadata completely from schema v1. Do not keep GPT54's optional acquisition escape hatch.

5. Keep a reference tooltip evaluator only if needed to validate token/progression contracts. Avoid promising a full runtime tooltip feature inside this sprint.

6. Add a rejected-alternatives section to the final sprint. It should explicitly compare seed-only versus multi-source catalog construction, one runtime catalog versus runtime-plus-audit artifacts, expanded rank tables versus formula descriptors, and core-facts-first promotion versus all-fields promotion.

7. Tighten description policy. The final plan should define whether descriptions are mandatory for every promoted skill, whether unreviewed description tokens block only affected records or the whole catalog, and how the description review record is stored and referenced.

8. Split the DoD into concise gate groups: identity/source-set, live/replay, extraction/content, policy/review, determinism/versioning, promotion/allowlisting, and closeout. Keep each item measurable.

9. Preserve GPT56SOL's exact live protocol and replay rejection rules. They are not optional implementation details; they are the main protection against accidental broad crawling and mixed snapshot inputs.

10. Include a fallback closeout state. If the bounded live refresh, copied-description review, or first-baseline review cannot complete, the sprint should end with fixture/offline implementation complete and production promotion explicitly blocked, not with relaxed gates.

