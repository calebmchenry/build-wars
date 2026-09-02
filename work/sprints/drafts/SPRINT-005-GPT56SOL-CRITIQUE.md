# Combined Critique: SPRINT-005 GPT-5.5 and GPT-5.4 Drafts

## Executive Assessment

Both drafts converge on the right high-level system: a bounded, snapshot-driven ingestion profile; a first-class skill-ID source set; extraction from structured wiki templates; joins through the EPIC-03 catalog; deterministic artifact generation; and exact-path promotion. That shared spine is coherent and is substantially stronger than a page-by-page scraper or a runtime wiki dependency.

The GPT-5.5 draft is the stronger architecture and policy document. It is explicit about description provenance, authored IDs, semantic versioning, source caps, baseline review, and security. Its weakness is overloading the runtime catalog with audit concerns and leaving several release-defining decisions open while presenting a highly detailed implementation plan.

The GPT-5.4 draft is shorter and easier to execute. It gives source-set resolution a clear place in the sequence and correctly makes a live refresh mandatory before production promotion. Its weakness is that several important guarantees are stated as intent rather than as enforceable contracts, especially description safety, catalog/manifest ownership, source-set completeness, and tooltip projection semantics.

The merged sprint should use GPT-5.5 as the policy baseline and GPT-5.4 as the sequencing baseline, but it should not proceed until the release contract, source-set boundary, artifact ownership, and live-promotion rule are made unambiguous.

## Review of `SPRINT-005-GPT55-DRAFT.md`

### Strengths

- It treats scale as an architectural concern rather than a command-line detail. Named limits for pages, requests, bytes, continuation, retries, batches, and source family are appropriate for the first high-volume ingestion profile.
- The source-set resolver is a sound intermediate boundary. Preserving requested, normalized, redirect, and canonical page identity prevents later extractors from independently resolving the same page and producing inconsistent results.
- The separation of authored/template identity from catalog identity is forward-looking. Explicit `known`, `reserved`, `unsupported`, and `unknown` outcomes are better than treating a numeric ID as an array index or manufacturing placeholder skills.
- The description policy is the strongest part of either draft. Separating source evidence, structured tooltip data, reviewed runtime text, and explicit exclusion makes copied-text risk visible in the schema and promotion gate.
- It correctly treats EPIC-03 as the authority for profession and attribute joins and keeps UI, template decoding, rule enforcement, and mode selection outside this sprint.
- Its semantic-version and section-digest discussion anticipates downstream consumers and balance-diff workflows. Excluding retrieval-only metadata from semantic versions is the right direction.
- QA and security coverage is unusually complete: stable finding IDs, first-baseline review, exact allowlisting, bounded evidence, untrusted wiki input, path confinement, and metadata-only media are all useful safeguards.

### Weaknesses

- The catalog envelope is too broad. `snapshotManifestPaths`, source-set evidence, manual reviews, and a `generatedArtifactManifest` are operational or audit data, not necessarily runtime data. Embedding them in the runtime catalog couples app payloads to repository layout and review machinery, increases artifact size, and causes provenance churn even when skill semantics do not change.
- Embedding `generatedArtifactManifest` while also producing an adjacent manifest is especially problematic. If the manifest contains the catalog digest, putting it inside the catalog creates a circular ownership or hashing problem. The draft does not define which copy is authoritative.
- “Tooltip-ready output” conflicts with the allowed outcome of excluding unreviewed description text and merely documenting tooltip limitations. A catalog with costs and progression but no safe wording may be structurally valid, but it is not tooltip-ready in the ordinary sense. The DoD needs a precise minimum capability for each description state.
- The plan freezes a detailed domain contract before proving the full source shape, while its open questions acknowledge uncertainty about the authoritative source pages, special/non-player records, progressions, and description fields. That sequencing invites schema churn. A narrow source-shape checkpoint should precede final contract lock.
- The cost model is not conceptually clean. Activation and recharge are timings, while energy, adrenaline, sacrifice, upkeep, and overcast may be simultaneous or independently absent. A single “cost union” risks forcing a multi-dimensional fact set into mutually exclusive variants.
- Boolean flags for elite, common, no-attribute, title, special, non-player, unsupported, and mode state can admit invalid combinations. The draft calls for representation but does not define invariants or which values are primary classifications versus derived convenience flags.
- Phase 6 is estimated at 5% despite including broad documentation, full verification, artifact inspection, status closeout, and consistency across tickets, sprint, ledger, QA, and manifests. The estimate is not credible given the review burden described elsewhere.
- The file plan uses `skills_catalog.py` and `test_skills_catalog.py`, while the other draft uses singular names. This is minor operationally but indicates that the module boundary has not actually been standardized.

### Gaps in Risk Analysis

- There is no mitigation for source revision skew across a long batched refresh. The ID map can change after planning, or early detail pages can differ in revision age from later pages. Deterministic replay does not make such a snapshot set logically coherent.
- Manual-review scalability is underexplored. Reviewing runtime text field-by-field across a full catalog may dominate the sprint, and the plan does not define reviewer capacity, sampling versus exhaustive review, or how a new source revision invalidates prior approval.
- Runtime artifact size, parse time, memory use, and downstream bundle impact are not budgeted. Field-level provenance, source-set records, progression evidence, media metadata, and reviews could make the catalog much larger than expected.
- Schema evolution is discussed through versions and digests, but backward compatibility is not. Replacing or expanding an existing minimal `Skill` shape may break current consumers even if TypeScript compiles locally.
- Semantic-version correctness depends on a manually maintained projection. The draft mentions mutation tests, but it does not define canonical number/string normalization or how schema changes alter the version algorithm.
- The source-policy risk is framed mostly as copied prose entering the artifact. It does not cover review invalidation, near-duplicate or lightly transformed text, or unsafe markup reaching a future renderer.
- Operational failure recovery is missing: partial batches, API throttling, retry exhaustion, interrupted refreshes, and resuming without mixing snapshot sets need a policy.

### Missing Edge Cases

- The source map changes during a refresh, a detail page is edited between retries, or the source map points to a revision that is no longer the fetched canonical page.
- Normalized-name collisions caused by Unicode normalization, punctuation, whitespace, case folding, historical redirects, or PvE/PvP suffix removal.
- Invalid authored IDs such as negative values, zero where disallowed, non-integers, unsafe integers, and numeric strings crossing the TypeScript/Python boundary.
- A split graph with self-links, cycles, more than two variants, one-sided wrappers, a related variant outside the accepted source set, or two accepted IDs resolving to the same page.
- Skills with multiple concurrent cost components, fractional or signed values, conditional costs, unknown units, or a literal zero that differs from “no cost” and “not applicable.”
- The distinction between a valid no-attribute/common skill, a missing infobox field, an unrecognized attribute, and an unresolved EPIC-03 join.
- Sparse rank domains, formulas rather than enumerated sequences, rounding rules, negative or decimal progression values, mixed attribute/title dependencies, and value/unit arrays of different lengths.
- Removed, deprecated, historical, monster-only, environmental, or duplicate-name skills whose pages exist but do not conform to the normal infobox contract.
- Review evidence becoming stale when the source revision, normalized text, parser version, or projection logic changes.
- Escaping of wiki links, markup, control characters, and interpolation placeholders before a future UI consumes runtime-facing text.

### Definition of Done Completeness

The DoD is broad and mostly traceable to the phases. It covers domain boundaries, source resolution, caps, determinism, policy review, QA, promotion, allowlisting, and closeout better than the GPT-5.4 draft.

However, several criteria are not yet objectively pass/fail:

- “Tooltip-ready,” “where source evidence requires it,” “where practical,” and “complete provenance” lack measurable definitions.
- A live refresh is required only “when network/source conditions permit,” while the risk section says production promotion remains blocked without it. Because the sprint’s stated outcome is a promoted catalog, the DoD must say plainly that no live refresh means no production promotion and no completed sprint.
- It requires every generated field claim to have resolvable provenance without defining the granularity or compression model for claims.
- It does not require a schema migration/compatibility test for existing `Skill` consumers.
- It lacks explicit budgets for catalog size and verification time, review invalidation rules, snapshot-set coherence, partial-refresh recovery, and malicious/degenerate structured input.
- It does not settle whether an accepted-but-unsupported ID belongs in `skills`, in a source-set disposition table, or only in QA. That ambiguity makes “one record or disposition” hard to validate consistently.

## Review of `SPRINT-005-GPT54-DRAFT.md`

### Strengths

- The plan is concise, phase-oriented, and easy to follow. Contract/profile work, source-set planning, extraction, progression/splits, promotion, and closeout form a sensible dependency chain.
- It identifies a concrete inherited constraint—the static `detail_titles` assumption and default `page_limit=200`—and turns that into an explicit profile extension rather than hiding it inside the skill extractor.
- The source-set record is clearly described as the page-identity boundary, which reduces duplicated redirect and canonicalization logic.
- It correctly keeps live network work outside routine verification while requiring a bounded live refresh and offline replay before production promotion.
- It gives exact artifact paths and a narrow allowlist and consistently excludes snapshots, text summaries, media bytes, and scratch output.
- The draft is disciplined about deferring UI, template codecs, rule behavior, attribution display, and guide prose.
- Its 10% allocation for documentation and closeout is more realistic than the GPT-5.5 estimate.

### Weaknesses

- “No open question blocks execution” is not supported by the document. Exact caps are unspecified, source completeness is assumed, description projection semantics are unresolved, and acquisition remains conditional. Those are contract and release decisions, not incidental implementation details.
- The description requirements are too soft. “Does not smuggle copied broad prose” does not define allowable fields, review states, exclusion behavior, or whether a tooltip/search projection may itself be copied or derivative text.
- The top-level Promotion Gate omits the live-refresh requirement even though Phase 5 and the DoD require it. A reader following only the architectural gate could promote from old snapshots.
- The catalog includes `snapshotManifestPaths`, `manualReviews`, `sourceShapeProof`, and a nullable `generatedArtifactManifest` without explaining why runtime consumers need them. The nullable embedded manifest conflicts with an authoritative adjacent manifest and creates the same circularity risk as the GPT-5.5 design.
- The plan says it will replace the minimal `Skill` catalog shape but does not specify compatibility or migration behavior for existing consumers.
- The ID model is less complete than GPT-5.5. It mentions unknown and optionally reserved lookups but does not explicitly lock a distinct authored/template ID type or the disposition contract for unsupported accepted IDs.
- “Title-sorted batches” makes fetch ordering depend on mutable page titles. Stable ID order should define logical ordering; title sorting can remain an API optimization inside deterministic batches.
- `sourceShapeProof` is named as a catalog field but never given semantics, lifecycle, or a consumer. It risks becoming an opaque audit blob inside runtime data.
- The stable artifact list includes a QA text summary that is deliberately ignored. Generating it may be useful locally, but calling it a stable output implies an unsupported contract.

### Gaps in Risk Analysis

- The risk table does not address source-map completeness or the possibility that `/Skills/0` is only one member of the authoritative map set.
- It understates copied-text risk as medium and does not cover the cost or staleness of manual review.
- It omits special-cost schema collapse, authored-ID/index confusion, semantic-version projection omissions, QA evidence leakage, source-family drift, and non-player skill policy.
- It does not consider a multi-batch refresh spanning inconsistent revisions, interrupted refresh recovery, rate limiting, maximum API title counts, or retry behavior that mixes snapshot generations.
- It recognizes artifact/test cost but not the runtime cost of shipping audit-heavy records and field-level provenance.
- It has no explicit risk for regression to EPIC-02/EPIC-03 profile behavior despite changing shared profile, pipeline, snapshot, CLI, and model code.
- It does not address long-range coupling between a preformatted tooltip projection and future rendering, localization, accessibility, or rule-engine needs.

### Missing Edge Cases

In addition to the shared gaps around revision skew, lookup normalization, multi-component costs, split graphs, progression formulas, and review invalidation, this draft omits or weakly covers:

- Missing infoboxes, unknown skill types, ambiguous flags, unsupported cost forms, and contradictory ID values between the map and infobox.
- Non-monotonic progressions, rank-domain limits, mismatched multi-value lengths, ambiguous split variants, and variants not present in the accepted source set.
- Duplicate normalized names and aliases even when canonical names are distinct.
- Explicit no-attribute/common semantics versus missing or invalid joins.
- Malformed or malicious template nesting, oversized parameter values, and unsafe markup in projected text.
- Deprecated, historical, monster-only, environmental, and otherwise non-player records.
- Stale icon URLs or file metadata and the future runtime behavior when remote media is unavailable.
- Cross-language numeric and serialization boundaries for IDs, percentages, decimals, `null`, missing fields, and stable ordering.

### Definition of Done Completeness

The DoD covers the core delivery path: dynamic planning, accepted-ID coverage, normalized records, progression/splits, metadata-only icons, determinism, live refresh, exact promotion, gates, offline verification, and documentation.

It is nevertheless materially less complete than GPT-5.5:

- It does not require named caps beyond avoiding the inherited page limit, explicit live opt-in, source-family locking, or synthetic/minimized fixture behavior.
- It does not require regression proof for EPIC-02 and EPIC-03 profiles.
- Description safety is not represented as an explicit reviewed/excluded state, and there is no criterion for tooltip behavior when text is excluded.
- Warning dispositions, first-baseline review, semantic/provenance diff classification, and non-waivable findings are absent.
- “Where required by source policy” makes provenance completeness circular unless the policy matrix is itself a deliverable and gate.
- “Tooltips and search can be driven” is not testable until the projection contract, supported ranks, formatting rules, and exclusion behavior are defined.
- It does not require exact source-set diagnostics, review invalidation, schema compatibility, snapshot coherence, runtime artifact budgets, or recovery from a partial live refresh.

## Cross-Draft Contradictions and Strategic Trade-offs

| Topic | GPT-5.5 | GPT-5.4 | Required Resolution |
| --- | --- | --- | --- |
| Sprint state | Front matter says `draft`. | Front matter says `planned`. | Use one lifecycle state consistent with the sprint ledger; critique/review should not silently advance it. |
| Source-set authority | Starts with `/Skills/0` but explicitly questions whether more named source pages are required. | Treats `/Skills/0` as the full map and designs for one seed page. | Define the complete bounded source family and a measurable completeness check before contract freeze. |
| Live promotion | Uses “when conditions permit,” but elsewhere says promotion is blocked without a refresh. | Explicitly requires one live refresh before promotion. | Make the GPT-5.4 rule authoritative: live refresh plus offline replay is mandatory for production promotion; unavailable network blocks completion of a sprint whose outcome is the promoted catalog. |
| Description release | Requires reviewed runtime text or explicit exclusion and documented limitations. | Allows structured facts and tooltip/search projections while only broad prose is review-gated. | Define exact field classes and an enum such as `reviewedText`, `structuredOnly`, and `excluded`; bind reviews to field digests and source revisions. |
| Tooltip readiness | Allows exclusion while still calling the result tooltip-ready. | Assumes projections are sufficient for tooltips. | Define the minimum renderer-neutral contract and what a consumer displays for each exclusion/unsupported state. |
| Artifact ownership | Embeds audit/source/review data and a generated manifest in the catalog. | Does the same, with a nullable embedded manifest and `sourceShapeProof`. | Keep semantic runtime records in the catalog; keep catalog digest, snapshot paths, generator inputs, review evidence, and promotion metadata in the adjacent manifest/QA artifacts. Avoid a self-referential embedded manifest. |
| Catalog assembly module | Uses `skills_catalog.py` and plural test names. | Uses `skill_catalog.py` and singular test names. | Select one canonical module/test name before tickets enumerate files. |
| Accepted unsupported IDs | Allows a record or an explicit disposition; special/non-player handling remains open. | Also allows a record or disposition but does not define where dispositions live. | Specify a closed disposition union and ownership: accepted runtime records in `skills`; excluded/reserved/unsupported identities in a stable source-set section or separate index, with QA references. |
| Cost shape | Emphasizes broad explicit unions, including timings among cost-related fields. | Enumerates presentation-oriented cases such as signet/no-cost and pip-like upkeep. | Separate timings from costs and support multiple independent cost components. Define zero, absent, not-applicable, and special semantics without encoding UI labels as domain types. |
| Versioning/baseline | Defines semantic projections, section digests, first baseline, and diff classes. | Mentions semantic versioning but leaves projection and baseline rules sparse. | Adopt GPT-5.5’s model, then add canonical serialization and compatibility rules. |
| Acquisition data | Defaults to defer but permits inclusion after a checkpoint. | Same conditional inclusion. | Defer it unconditionally from this sprint. Conditional scope creates review and schema work unrelated to the critical catalog path. |

The central strategic trade-off is runtime convenience versus audit completeness. Both drafts currently try to make one JSON document serve the app, ingestion audit, source-shape proof, manual review, and artifact verification. That makes initial traceability easy but creates long-range coupling and payload growth. A cleaner boundary is:

```text
skills.catalog.json
  semantic runtime facts + stable source reference IDs

skills.catalog.manifest.json
  artifact digest + generator/config identity + snapshot-set identity + source revisions

skills.catalog.qa.json
  findings + dispositions + review evidence + release gates
```

This still supports field-level traceability through stable IDs without forcing runtime consumers to ship or understand repository paths, review records, and generation metadata.

The second major trade-off is contract-first design versus source-shape discovery. Both drafts favor locking the contract first, but both admit that rare templates, source-map membership, split topology, non-player records, and safe description fields are not yet known. The sprint should lock only identity, provenance-reference, and disposition primitives initially; detailed cost, progression, description, and split contracts should be finalized immediately after a bounded source-shape inventory.

## Merge Recommendations

### Decisions Required Before Execution

1. Define the authoritative source family, not just the first seed page. Record how completeness is proven and how the refresh detects a map change during acquisition.
2. Make production promotion contingent on one bounded live refresh, an acquisition-coherence check, and byte-deterministic offline replay. If that cannot happen, implementation may be ready but SPRINT-005 is not complete.
3. Separate runtime catalog ownership from manifest and QA ownership. Do not embed the adjacent manifest or raw snapshot paths in the catalog.
4. Define the description state machine and bind every manual approval to the normalized field digest, source revision, parser/projection version, reviewer, and review date. A changed input must invalidate the approval.
5. Define a renderer-neutral tooltip model. Prefer typed values and interpolation tokens over preformatted copied strings; specify the fallback for excluded or unsupported descriptions.
6. Define the accepted-ID/disposition model, including reserved, excluded, unsupported, missing, ambiguous, and non-player cases, and state which of those count as runtime `skills`.
7. Separate timing fields from a multi-component cost model and define nullability, units, numeric precision, canonical serialization, and invalid combinations.
8. Standardize module names, artifact fields, record ordering, and the singular authoritative location of source-set records, progressions, split links, reviews, and manifests.

### Recommended Combined Structure

- Use GPT-5.4’s concise six-phase sequence and mandatory live-promotion gate.
- Insert a bounded source-shape inventory between the minimal identity/profile contract and the final detailed catalog contract. Derive numeric caps from a preflight count plus an absolute ceiling rather than leaving them as open values.
- Use GPT-5.5’s authored-ID model, description policy, named caps, baseline review, semantic projection, section digests, stable findings, security controls, and detailed QA dispositions.
- Keep GPT-5.5’s explicit edge fixtures, but add snapshot-coherence, Unicode collision, multi-component cost, split-cycle, review-invalidation, malicious-markup, and partial-refresh recovery cases.
- Use stable skill-ID ordering for logical records and batch identity. Title sorting may be used only as an internal API request optimization with canonical output re-sorted by ID.
- Defer acquisition metadata completely. Also defer balance-diff UX and any broad historical/guide prose; retain only the semantic digests and revision identifiers needed to support later work.
- Increase the closeout/review estimate and give manual description review an explicit capacity budget. If exhaustive text review is too large, baseline promotion should use `structuredOnly`/`excluded` states rather than an undefined partial review.

### Consolidated DoD Additions

The final sprint should retain the stronger criteria already present across the drafts and add these missing gates:

- The accepted source map is pinned to a recorded revision, rechecked after detail acquisition, and proven not to have changed during the selected snapshot set, or the refresh is rejected.
- Partial, interrupted, throttled, or retry-exhausted live runs cannot be selected for promotion and can be resumed only without mixing acquisition identities.
- Existing EPIC-02/EPIC-03 profiles and existing `Skill` consumers pass explicit compatibility tests or receive a documented schema migration.
- The catalog contains no embedded artifact manifest, local/repository snapshot paths, opaque source-shape blobs, or full manual-review evidence.
- Description states and unsupported progression states have deterministic, tested runtime fallbacks; source or projection changes invalidate relevant reviews.
- Costs support simultaneous components and timings are modeled separately; invalid combinations and cross-language numeric boundaries are tested.
- Normalized-name collisions, ID boundary cases, split graph invariants, no-attribute versus unknown joins, and source-map/detail-page contradictions have stable dispositions.
- Catalog size, parse time, and offline verification time stay within named budgets suitable for downstream consumption and CI.
- Semantic digests change for every runtime-visible field mutation and do not change for retrieval-only metadata; canonical serialization is identical across Python generation and TypeScript validation.
- Production promotion cannot pass without the required live refresh, coherent selected snapshot set, offline replay, first-baseline review, all description/review dispositions, and matching catalog/manifest/QA references.

With those resolutions, the two drafts merge into a coherent sprint: GPT-5.5 supplies the durable policy and safety model, while GPT-5.4 supplies the clearer execution path. Without them, the likely failure mode is not parser correctness but a catalog that is technically generated yet ambiguous about what is safe to ship, what is authoritative, and what downstream code may rely on.
