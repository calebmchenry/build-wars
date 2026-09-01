# Sprint 004 Draft Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-004-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-004-GPT54-DRAFT.md`

Not reviewed:

- `work/sprints/drafts/SPRINT-004-GPT55-DRAFT.md`

Both requested review drafts were present.

## GPT56SOL Draft

### Strengths

- Establishes the clearest architecture boundary: ingestion owns source acquisition and normalization, `src/domain` owns plain-data contracts and lookup semantics, and `src/app` remains out of scope.
- Correctly treats the template ID source as the numeric authority while separating profession template ID `0` from playable professions and preserving attribute ID gaps.
- Strongly addresses cross-source reconciliation. It specifies field authorities, conflict behavior, no row-position inference, no silent row drops, and explicit diagnostics.
- Handles artifact determinism more rigorously than the GPT54 draft, especially semantic `catalogVersion` versus full artifact digest, schema-owned sort keys, fixed clock replay, and baseline classification.
- The source-policy treatment is mature: primary-attribute summaries are derived values with field-level provenance and manual review rather than copied wiki prose.
- The DoD is unusually complete for promotion safety: it covers source boundaries, provenance, icon media policy, QA gates, ignored artifacts, repeated offline replay, and downstream runtime isolation.

### Weaknesses

- The draft is significantly over-scoped for a single sprint. It combines schema design, profile refactoring, wikitext/table infrastructure, live refresh, artifact generation, QA gate expansion, source-policy review, docs, ticket bookkeeping, and promotion.
- Phase 1 includes both domain contract work and ingestion profile registry refactoring. That creates an early coupling between TypeScript domain shapes and Python pipeline architecture before the source shape has been proven.
- Phase 3 combines profession extraction, attribute extraction, icon metadata, campaign semantics, and primary-effect summaries. Those are different risk profiles and likely deserve separate implementation or acceptance boundaries.
- It assumes existing EPIC-02 components can absorb a profile registry, exact snapshot selection, QA extensions, canonical writers, and icon metadata without substantial redesign. That may be true, but the draft does not call out the contingency if EPIC-02 abstractions are too skill-catalog-specific.
- It requires no open warnings before promotion. That may be overly strict if the QA vocabulary includes benign informational or waived findings. The draft should distinguish blocking findings, review-required findings, waived findings, and informational observations more explicitly.
- The files summary reaches into many documentation and planning files in Phase 6. This may conflict with a desire to keep the sprint primarily implementation-focused and increases review burden.

### Gaps In Risk Analysis

- No explicit fallback if `mwparserfromhell` plus a bounded table state machine cannot recover the required table structure reliably. The draft says avoid a second parser, but does not define a stop condition or alternate data-source strategy.
- No risk entry for source pages containing transcluded or template-generated tables where raw revision wikitext does not directly contain the normalized facts the plan expects.
- Limited discussion of how manual review evidence is stored without creating long-term churn, privacy concerns, or reviewer-specific nondeterminism.
- The semantic projection risk is acknowledged, but the draft still assumes a field list can remain correct as the schema evolves. It should require projection coverage tests generated from schema-owned field metadata or an explicit checklist tied to every new runtime field.
- It does not fully address how exact-revision replay works if the wiki changes revision availability, API behavior, redirects, or normalized titles after snapshots are not committed.
- It treats icon metadata as required in some places and diagnostic in others. The risk analysis should decide whether missing/ambiguous icons block promotion or degrade to a visible nullable field.

### Missing Edge Cases

- Attribute/profession names with parenthetical disambiguators, capitalization drift, alternate abbreviations, punctuation variants, or wiki aliases that collide after conservative normalization.
- Redirect chains, moved pages, normalized MediaWiki titles, and page IDs changing while titles remain stable.
- Tables with rowspan/colspan, nested templates, comments, section transclusion, localized number formatting, hidden rows, sortable-table metadata, or duplicated header rows.
- Profession campaign availability where "core" means profession family but not character creation campaign, plus secondary-profession acquisition rules that could be confused with campaign availability.
- Quest reward paths where individual quests are mutually exclusive by campaign origin, replacement quest, character state, or account/character type.
- Missing or partial `imageinfo` data, duplicate file candidates, SVG or non-raster icons, stale dimensions, remote hash absence, and canonical URL changes.
- Source facts that are true for current game state but not historically true for old builds, which may matter if saved builds later need versioned validation.

### Definition Of Done Completeness

- The DoD is comprehensive and technically defensible. It covers identity semantics, allocation rules, provenance, promotion, deterministic generation, and closeout.
- It may be too broad to be executable as a single sprint DoD. Several items read like platform-level governance rather than SPRINT-004-specific completion criteria.
- It should separate hard release blockers from documentation polish and ticket-burn bookkeeping, so the sprint cannot be blocked by nonessential closeout while the runtime catalog is otherwise complete.
- It should define the minimum acceptable artifact for downstream epics: for example, whether icon metadata and effect summaries are required for first runtime eligibility or may be nullable with QA findings.

## GPT54 Draft

### Strengths

- More concise and easier to execute than the GPT56SOL draft. Its phase structure is straightforward: contracts, crosswalks, professions, attributes/rules, provenance/QA, promotion.
- Keeps the core boundary intact: generated catalog as the runtime surface, ignored raw snapshots and QA reports, no runtime wiki access, no app UI in scope.
- Correctly identifies the most important identity decisions: profession sentinel `0`, non-contiguous attribute IDs, source authority, and lookup behavior independent of array order.
- The artifact layout is concrete and gives implementers stable target paths.
- Includes meaningful verification commands per phase and a practical DoD that covers the central catalog and ingestion expectations.

### Weaknesses

- The draft is less precise about how the EPIC-02 ingestion spine becomes multi-profile. It mentions extending the spine, but the implementation details are spread across phases and less protective against profile-selection bugs.
- Source authority is clear at a high level, but cross-source reconciliation is underspecified compared with GPT56SOL. It does not sufficiently require retaining every candidate row as record, exclusion, or diagnostic.
- It leaves several architecture decisions as open questions that probably need defaults before execution, especially PvP/hero variants, runtime import location, and mandatory profession pages.
- The artifact path names are inconsistent with GPT56SOL and internally heavier: it uses `.catalog.json` for generated outputs and includes QA summaries that stay ignored. The final merged sprint needs one naming convention.
- It risks underestimating primary-attribute summaries. It treats them as a later provenance/QA phase, but they require source shape inspection, factual extraction, manual authorship, copied-text controls, and re-review triggers.
- It does not sufficiently separate field-level provenance, derived values, and manifest-level generation facts. That can cause either bloated runtime artifacts or insufficient traceability.

### Gaps In Risk Analysis

- The risk table is much shorter and misses parser-shape complexity, profile refactor regression, semantic-version projection omissions, exact allowlist leakage, source-history replay limitations, and warning-promotion hazards.
- It does not discuss the risk that production artifact tests duplicate source truth in handwritten fixtures or TypeScript assertions.
- It does not analyze the hidden maintenance cost of keeping Python model types, TypeScript contract types, generated JSON, QA schemas, and documentation synchronized.
- It does not define a contingency if the live wiki pages disagree with known game constants such as level-20 170/200 point totals.
- It does not address potential nondeterminism from manual review metadata, generated timestamps, source ordering, MediaWiki continuation order, or file metadata.

### Missing Edge Cases

- Attribute ID `0` is mentioned, but edge-case coverage for namespace collision between profession ID `0` and attribute ID `0` is not as strong as GPT56SOL.
- Unknown authored IDs are not as explicitly preserved in the DoD. A template compatibility feature needs distinct `none`, `known`, and `unknown` outcomes.
- The live source plan is described as bounded to named titles, but the draft does not specify caps for requests, continuation pages, response bytes, or title expansion.
- It lacks details for malformed wikitables, nested cells, redirects, duplicate rows, source-only candidates, and deliberate exclusions.
- It does not fully cover mutually exclusive quest alternatives or character-origin-specific eligibility, beyond noting PvP/heroes as deferred.
- It does not specify enough media edge cases around missing image metadata, ambiguous icon candidates, unexpected MIME types, or returned media URLs that must not be fetched.

### Definition Of Done Completeness

- The DoD covers the main deliverables: combined artifact, sentinel semantics, gap preservation, reverse lookups, records, allocation inputs, provenance, QA, deterministic regeneration, verify, and exact-path allowlisting.
- It is weaker than GPT56SOL on promotion semantics. It does not require baseline-diff classification, both QA gates at pass, no open warnings, digest matching, or byte-identical QA output.
- It includes status consistency across tickets, epic, sprint, and ledger. That is useful operationally, but should not obscure technical acceptance criteria.
- It should explicitly require existing EPIC-02 behavior to remain compatible after the profile extension.

## Cross-Draft Comparison

### Architecture Assumptions

- Both drafts assume the EPIC-02 ingestion spine is sufficiently reusable. GPT56SOL makes that assumption more explicit and adds a registered-profile architecture; GPT54 relies more on "extend the spine" language. The merged sprint should adopt the profile registry but include an early spike or acceptance check proving EPIC-02 can support it without breaking existing fixture output.
- Both drafts assume the runtime artifact should be a single combined catalog. That is a good default for downstream consumers, but the merged sprint should explicitly reject multi-file runtime joins while allowing internal generator modules to remain separate.
- Both drafts assume no committed raw snapshots. That protects repository size and source-policy boundaries, but it creates replay dependence on external revision availability. The merged draft should name this as an accepted limitation and require enough manifest data for best-effort exact-revision reacquisition.
- GPT56SOL's semantic `catalogVersion` design is stronger, but it introduces a subtle architecture obligation: every gameplay/display field must be included in the semantic projection. Merge it with mandatory projection mutation tests.

### Scope Creep Risk

- GPT56SOL has the higher scope-creep risk because it tries to close platform architecture, content extraction, manual review policy, generated release units, docs, and ledger updates in one sprint.
- GPT54 has the opposite risk: it is concise enough that implementers may discover large hidden tasks late, especially table parsing, source reconciliation, manual effect-summary review, and deterministic promotion.
- The merged sprint should keep GPT56SOL's rigor but reduce execution blast radius. Specifically, separate "profile registry and identity contracts" from "content extraction" from "promotion" with hard phase gates.
- Primary-attribute summaries and icon metadata should be treated as optional-to-emit but required-to-disposition unless product requirements truly need them in the first runtime catalog. Making both mandatory may turn a catalog sprint into a source-policy sprint.

### Hidden Complexity

- Wikitable extraction is the largest hidden implementation risk. Neither draft fully proves that the required facts are available in raw page snapshots without template expansion or source-specific parsing exceptions.
- Campaign availability is semantically loaded. The distinction between profession family, character creation campaign, travel availability, and secondary-profession access should be modeled minimally and named carefully.
- Attribute point rules are more complex than "level 20 equals 200". The merged plan should prevent over-counting mutually exclusive quests and should avoid implying support for PvP, heroes, runes, equipment, effective rank, or actual character progression.
- Manual review metadata can introduce nondeterminism and process drag. The merged plan should define stable reviewer fields and whether review records live inside the runtime catalog, the manifest, or QA evidence.
- Exact `.gitignore` allowlisting is easy to get wrong. GPT56SOL's `git check-ignore -v` verification should be retained.

### Missing Alternative Designs

- Hand-authored seed catalog with source-backed verification: build a small committed catalog first, then use ingestion only to verify and refresh. This may be simpler if wiki parsing is unstable, but it trades automation for manual maintenance.
- Two-stage artifact: a runtime-minimal catalog plus a separate provenance evidence artifact. This would reduce runtime JSON size and policy exposure, but it requires stronger tooling to keep the two artifacts aligned.
- Defer primary-effect summaries to a later source-policy ticket. The first catalog could ship `null` summaries with complete provenance for primary attributes, reducing copied-prose and manual-review scope.
- Defer icon metadata to a later media ticket. Profession records can include nullable icon fields and QA dispositions now, while remote media policy and privacy decisions happen closer to UI rendering.
- Use checked-in minimized source fixtures plus externally reproducible source manifests, without requiring a live refresh in the same sprint. This would make the sprint less dependent on wiki availability but weaker as release evidence.
- Generate TypeScript types from the JSON schema or shared schema definitions. Both drafts assume Python and TypeScript contracts can be kept aligned manually.

## Merge Recommendations

- Use GPT56SOL as the architectural base because it is more explicit about profile registration, deterministic artifacts, source reconciliation, QA gates, semantic versioning, and promotion boundaries.
- Use GPT54 to trim the execution plan. Its simpler phase breakdown is easier to follow and should prevent the merged sprint from becoming a platform rewrite.
- Pick one artifact naming convention before implementation. Prefer GPT56SOL's shorter paths only if they match existing repo conventions; otherwise keep GPT54's `.catalog.json` suffix. Do not allow both.
- Move profile registration proof and EPIC-02 compatibility protection into Phase 1, with a hard acceptance check that existing EPIC-02 fixture output is unchanged.
- Split primary-effect summaries and icon metadata into explicit required-versus-dispositioned decisions. If mandatory, keep GPT56SOL's manual review and media policy requirements. If not mandatory, require null fields plus blocking/nonblocking QA disposition rules.
- Retain GPT56SOL's rules for semantic projection, baseline-diff classification, exact path allowlisting, `git check-ignore -v`, byte-identical replay, no open blocking findings, and `appConsumptionGate`/`publicReleaseGate`.
- Add an early source-shape validation checkpoint before committing to parser design. The checkpoint should decide whether structured wikitext parsing is sufficient, whether a bounded table helper is needed, or whether a hand-authored seed-plus-verification design is safer.
- Strengthen the merged risk table with parser failure, transclusion/template expansion, manual review nondeterminism, exact-revision replay limits, schema/projection drift, and source-truth duplication in tests.
- Keep app, UI, template codec, full rule engine, skill catalog, equipment/rune/hero/PvP behavior, and attribution UI out of scope. The merged sprint should produce data and pure domain helpers only.
- Separate technical DoD from process closeout. Ticket, sprint, epic, and ledger status consistency should remain required for closeout, but the catalog acceptance criteria should stay readable and independently verifiable.
