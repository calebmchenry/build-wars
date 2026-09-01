# Combined Critique: Sprint 004 Drafts

## Review Scope

Reviewed:

- `SPRINT-004-GPT55-DRAFT.md`
- `SPRINT-004-GPT54-DRAFT.md`

Both requested drafts are present. `SPRINT-004-GPT56SOL-DRAFT.md` was not reviewed.

## Executive Assessment

The drafts agree on a sound architectural spine: keep the domain model framework-neutral, extend the
EPIC-02 snapshot-driven ingestion pipeline, use template-format IDs without compaction, keep
profession template ID `0` out of the playable catalog, preserve provenance, keep media
metadata-only, and promote only narrowly allowlisted generated artifacts after QA. That shared
direction is coherent and appropriately prepares EPIC-04, EPIC-05, EPIC-06, and EPIC-08.

Neither draft is execution-ready as written. They disagree on ticket boundaries, artifact names,
icon scope, whether primary-attribute summaries and a live refresh are mandatory, and what closes
the sprint. They also leave several decisions open while simultaneously making those decisions part
of the Definition of Done. The largest long-range risks are coupling domain identity directly to an
external encoding, duplicating the catalog schema across Python and TypeScript without a single
machine-checked contract, and claiming reproducibility while the source snapshots needed to recreate
the promoted artifact remain ignored.

The best merge base is GPT-5.5's ticket mapping, source-policy detail, QA gate, and exact-path
promotion discipline, augmented with GPT-5.4's phase acceptance criteria, dependency graph, explicit
artifact-envelope decision, and percentage-based scope signals. Primary-effect summaries should be
removed from the core completion path or isolated as an optional reviewed extension.

## GPT-5.5 Draft Critique

### Strengths

- The scope boundary is unusually clear. It separates catalog data from UI, template codecs, and
  rule enforcement, reducing the chance that EPIC-03 absorbs EPIC-05, EPIC-06, or EPIC-08.
- The data ownership and data-flow sections consistently preserve the EPIC-02 architecture:
  extractors consume snapshots, network access remains orchestration-only, and runtime consumers do
  not depend on ingestion or QA internals.
- Source precedence is explicit, and conflicts become QA findings instead of silent corrections.
  The manual-override requirements are the strongest governance detail in either draft.
- Sentinel and gap semantics are concrete: profession template ID `0` is a crosswalk-only `null`,
  playable professions total exactly ten, and attribute IDs are never compacted.
- The QA gate covers source, parsing, rights, schema, integrity, deterministic output, and media
  policy. Exact-path promotion and the ban on `git add -f` give the release boundary useful teeth.
- The draft explicitly distinguishes metadata from copied prose and provides a safe fallback for
  primary-effect summaries: exclude them if review cannot close.
- BW-0301 through BW-0306 have distinct deliverables and verification commands, and the final DoD
  ties code, data, documentation, generated artifacts, QA, and bookkeeping together.

### Weaknesses

- Several fundamental choices remain open despite affecting contracts and acceptance: campaign
  availability semantics, PvP and hero assumptions, primary-effect summary scope, live-refresh
  requirements, QA-summary promotion, and conflict resolution between page names and template
  mappings. Phase 1 cannot safely freeze the wire format before these are settled.
- Using template IDs as catalog IDs is treated as both a convenience and a durable identity
  decision. This couples the core domain to one external serialization. Even if values are equal in
  schema version 1, `catalogId` and `templateId` should remain separately typed and explicitly mapped
  so a future source correction or second template format does not force a breaking domain migration.
- The catalog shape is not exact enough for a cross-language contract. It does not specify whether
  crosswalks are arrays or maps, how reverse lookups serialize, how normalized-name collisions are
  represented, whether icon records are embedded or referenced, or how `schemaVersion` differs from
  `catalogVersion`.
- A single combined artifact is convenient for atomic validation, but the draft does not acknowledge
  the cost: unrelated consumers become coupled to one release cadence and one schema. At minimum,
  section-level versioning or hashes are needed; otherwise an icon or prose-only change can churn a
  rule-engine dependency.
- BW-0303 combines profession, attribute, and icon extraction. This is a broad integration phase with
  several distinct failure modes. Its acceptance criteria should be split internally even if the
  ticket boundary stays unchanged.
- Field-level provenance is proposed broadly without a size or normalization strategy. Repeating full
  source records on every field can bloat the artifact and make diffs noisy. Stable claim IDs with a
  shared claim table would preserve traceability more cleanly.
- The plan promotes a source-derived production artifact while ignoring its raw source snapshots and
  snapshot manifests. Revision IDs and digests support audit, but they do not guarantee that a future
  maintainer can reproduce the exact artifact unless exact revisions remain fetchable and all
  transcluded dependencies are captured.

### Gaps in Risk Analysis

- Python models and TypeScript contracts can drift. Fixture tests are helpful, but there is no single
  JSON Schema, runtime validator, or equivalent authoritative wire contract validated by both sides.
- Determinism is underspecified. Fixed clocks alone do not control source ordering, locale, timezone,
  path serialization, newline style, parser-version changes, canonical map ordering, or stable QA
  finding-ID generation.
- MediaWiki dependency capture is not addressed. Redirect targets, templates, transclusions, and file
  metadata can change independently of the named page revision, weakening provenance and offline
  regeneration.
- Freshness has no policy. The QA list mentions source-family drift but defines no stale-revision
  threshold, refresh trigger, or acceptable waiver.
- The warning-review rule is not operational: it does not say who may disposition warnings, how an
  accepted risk is recorded, or which unresolved warning classes still block promotion.
- No migration or compatibility policy is defined for `schemaVersion` and `catalogVersion`, nor is
  there a consumer compatibility test for later epics.
- The plan assumes existing EPIC-02 writers, manifests, QA contracts, and CLI modes can represent all
  nested claims and the new combined artifact without an explicit feasibility checkpoint.

### Missing Edge Cases

- Normalized names can collide through case folding, punctuation, aliases, localization, or renamed
  wiki targets. Reverse lookup must not silently become last-write-wins.
- Unknown future profession or attribute IDs need an explicit preservation policy distinct from
  completeness checks against today's source snapshot.
- Numeric IDs need integer, non-negative, uniqueness, and serialization-bound checks; JSON object
  keys are strings even when the domain type is numeric.
- Attribute-point data must distinguish marginal cost, cumulative cost, allocated rank, and effective
  rank after bonuses. Rank 12 as an allocation ceiling must not be mistaken for an effective-rank
  ceiling.
- Quest rewards may be campaign-specific, alternative, mutually exclusive, repeatable-looking in
  source tables, or unavailable to non-native characters. A flat list plus a total can double-count
  rewards unless applicability and grouping are modeled.
- The assertion of “two attribute-point quest rewards per relevant campaign” is itself an unverified
  source assumption and should be a tested observation, not an extractor premise.
- Campaign availability can mean introduction campaign, character-creation availability, primary
  profession availability, secondary profession unlock, or account access. The current field name
  hides these different concepts.
- A missing or ambiguous icon needs a defined severity. The architecture says required unresolved
  icon metadata can block, while the core catalog could safely remain useful with a nullable icon.
- Deleted revisions, moved pages, unavailable old revisions, incomplete live refreshes, and a
  mid-refresh source revision change need explicit handling.

### Definition of Done Completeness

The DoD is broad and mostly measurable, but it is not yet internally closed. It requires future
validation data while leaving PvP/hero applicability open, requires campaign availability while its
meaning is unresolved, and allows optional live refresh and summary promotion without separating
implementation completion from content promotion. It also lacks explicit acceptance that:

- the generated artifact validates against one authoritative machine-readable schema;
- Python output and TypeScript consumption agree on every field and nullability rule;
- rank and level tables have exact domains and internally consistent marginal/cumulative totals;
- quest records cannot be double-counted under their applicability rules;
- deterministic regeneration controls more than the clock;
- all blocking findings are closed and every accepted non-blocking finding has a recorded reviewer;
- a promoted artifact can be reconstructed from immutable revision coordinates and captured
  dependency metadata.

## GPT-5.4 Draft Critique

### Strengths

- The sequencing narrative is strong: identity and wire shape first, factual catalogs next,
  allocation data after that, then provenance and promotion. Phase acceptance criteria make the
  intended exit state clearer than task checklists alone.
- The draft explicitly chooses a combined runtime-facing artifact and explains the downstream benefit:
  core consumers avoid multi-file joins.
- Ticket dependency ordering is visualized and the percentage estimates expose the intended balance
  of effort.
- Profession normalization and attribute/allocation normalization are separated, reducing the
  integration surface of the profession phase.
- The DoD adds deterministic reverse lookup, material classification, consumer-boundary checks, and
  exact-path allowlisting.
- It correctly treats copied primary-effect prose as unacceptable and requires an absent value plus a
  visible QA finding when a clean derived summary cannot be produced.

### Weaknesses

- The front matter says `status: planned` even though major architectural and acceptance questions
  remain open. This overstates readiness and conflicts with the other artifact's `draft` status.
- The ticket meanings diverge from GPT-5.5. GPT-5.4 assigns profession-only work to BW-0303,
  combines attributes and allocation rules in BW-0304, assigns summaries and QA to BW-0305, and
  makes BW-0306 promotion/closeout. GPT-5.5 assigns explicit ticket filenames with materially
  different boundaries. Execution against both interpretations would corrupt traceability.
- Primary-effect summaries are elevated to a mandatory manually reviewed phase even though they are
  not required by the core selector, template, or allocation use cases. This adds policy risk,
  network breadth, and human-review dependency to the critical path for relatively low architectural
  value.
- The final phase mandates a live refresh while the architecture says automated verification is
  offline and the sprint should remain deterministic. A manual network event can be a promotion gate,
  but it should not be conflated with repeatable implementation verification.
- `src/domain/build.ts` is proposed for allocation assumptions without explaining why source catalog
  facts belong in a build model. This risks prematurely shaping EPIC-06 behavior and mixing static
  reference data with build state.
- The implementation omits a clearly owned catalog assembler/serializer module and gives
  `artifacts.py` that responsibility implicitly. That can turn a generic artifact writer into a
  domain-specific aggregation layer.
- Fixture, QA-summary, and generated-path naming is inconsistent with GPT-5.5. Within GPT-5.4, the
  artifact layout lists a text summary under QA, while later sections describe QA outputs as local
  only without a clear reason for making that path “stable.”
- The source-policy treatment is less operational than GPT-5.5's: there is no equivalent structured
  manual-override process for contradictions.

### Gaps in Risk Analysis

- The same external-ID coupling, cross-language schema drift, incomplete snapshot reproducibility,
  MediaWiki dependency capture, freshness, and schema-migration risks described above remain.
- Mandatory human review and mandatory live refresh are not identified as schedule or availability
  risks, even though either can prevent sprint closure independently of implementation quality.
- The combined artifact's consumer coupling and release-churn cost are not weighed against the
  simplicity of one import path.
- The plan assumes every primary attribute can be summarized consistently and legally from bounded
  facts. It does not define a review rubric, reviewer authority, maximum summary scope, or behavior
  when only some summaries pass.
- `0 -> null` is described as “template-compatibility helpers,” but helpers are otherwise out of scope.
  The boundary between serialized crosswalk data and future EPIC-05 behavior needs clarification.
- Icon ambiguity is treated as non-core, but the DoD can be read as requiring either an icon or a
  finding without defining whether that finding blocks promotion.

### Missing Edge Cases

The draft misses the same name-collision, unknown-ID, effective-rank, quest-applicability,
transclusion, revision-race, and campaign-semantics cases identified for GPT-5.5. In addition:

- “Reverse lookup by normalized name” needs behavior for aliases and more than one historical or
  localized label.
- Repeated `data:regenerate` without an explicitly fixed clock can legitimately change timestamps,
  contradicting the no-diff acceptance criterion.
- A partial manual-review outcome is not modeled: one failed summary should not necessarily block the
  otherwise complete factual catalog.
- The phrase “all template-format attributes” does not say how reserved, obsolete, unknown,
  unowned, or non-player attributes are represented.
- A generated record with multiple sources needs precedence and contradiction semantics at the field
  level, not merely a list of provenance claims.

### Definition of Done Completeness

The checklist is detailed, but several entries are too absolute or depend on unresolved policy. “Every
generated record or artifact” carrying the full provenance tuple may be redundant for derived indexes
and manifests. Mandatory reviewed summaries and a mandatory live refresh create external blockers,
while the open questions still permit deferral of related rule variants. The DoD should distinguish:

1. deterministic pipeline and contract completion;
2. factual catalog completeness and QA closure;
3. optional reviewed descriptive content; and
4. production promotion based on a bounded live refresh.

It also needs explicit schema validation, exact numeric-table invariants, disposition rules for QA
severity, reproducibility criteria for source dependencies, and a compatibility rule for future
catalog versions.

## Cross-Draft Contradictions

| Area | GPT-5.5 | GPT-5.4 | Merge Decision |
| --- | --- | --- | --- |
| Readiness | `draft` | `planned` | Keep `draft` until the blocking decisions below are resolved. |
| BW-0303 | Profession and attribute extractors | Profession normalization only | Use the actual ticket contract; absent another authority, prefer GPT-5.5's explicit ticket name/path. |
| BW-0304 | Attribute points and quest metadata | Attributes plus allocation rules | Prefer GPT-5.5's explicit separation, but add GPT-5.4-style phase acceptance. |
| BW-0305 | Assembly, QA, and promotion | Provenance, QA, and mandatory summaries | Keep assembly/QA ownership here; make summaries optional or separate. |
| BW-0306 | Documentation, verification, and closeout | Promotion, live refresh, and closeout | Keep documentation explicit; define promotion as a separate gate within closeout. |
| Primary-effect summaries | Optional, excludable if review does not close | Mandatory review of all ten | Exclude from core DoD; allow nullable reviewed summaries as an optional enhancement. |
| Live refresh | Optional bounded manual run | Mandatory before closeout | Require it for production promotion, not for offline pipeline verification. |
| Icon scope | Profession and attribute icons are mentioned | Profession icons only | Decide explicitly; recommend profession icons only unless a downstream requirement proves attribute icons are needed. |
| Missing icon severity | Required unresolved metadata can block | Visible finding; avoid blocking core facts on guesses | Make icons nullable; block only policy/integrity violations, not source absence. |
| Crosswalk field | `templateCrosswalk` | `templateCrosswalks` | Choose one exact schema name and validate it on both sides. |
| QA summary path | `professions-attributes.catalog.qa.summary.txt` | `professions-attributes.catalog.summary.txt` | Pick one name; keep it ignored unless a concrete consumer and sanitization rule justify promotion. |
| Fixture artifact name | `fixture-professions-attributes-catalog.json` | `fixture-professions-attributes.catalog.json` | Pick one canonical path before tests or docs are written. |
| Campaign meaning | Explicitly unresolved | Treated as required, source reliability still open | Define the concept before freezing contracts. |
| Contradiction handling | Structured manual overrides | QA failure without a complete override record | Adopt GPT-5.5's override audit fields. |

## Merge Recommendations

1. **Resolve the contract-shaping decisions before implementation.** Define campaign semantics,
   supported character modes, quest applicability, icon scope, source-conflict authority, summary
   scope, QA-summary policy, and the promotion/live-refresh gate. Remove these from Open Questions once
   the sprint is marked planned.

2. **Use GPT-5.5's ticket mapping and explicit file ownership.** Add GPT-5.4's phase acceptance and
   dependency graph, but do not merge incompatible meanings under the same BW IDs. Confirm ticket
   contracts before execution rather than allowing the sprint draft to redefine them implicitly.

3. **Separate domain identity from template encoding.** Define distinct `CatalogProfessionId` /
   `TemplateProfessionId` and `CatalogAttributeId` / `TemplateAttributeId` concepts. Version 1 may
   intentionally use equal numeric values, but the crosswalk—not equality by convention—must be the
   compatibility contract. Keep `0` as a serialized template sentinel mapping to `null`.

4. **Create one authoritative wire schema.** Specify exact field names, map-versus-array choices,
   nullability, integer constraints, crosswalk serialization, claim references, and version semantics.
   Validate Python-generated artifacts and TypeScript fixtures against the same schema. Keep the
   domain-specific catalog assembler separate from the generic artifact writer.

5. **Keep one atomic envelope, but reduce downstream coupling.** Retain the combined artifact for
   consistency, with stable sections and section-level content hashes or versions. Consumers should be
   able to validate or adapt only the sections they need. Separate factual catalog version changes
   from generator/build timestamps.

6. **Move primary-effect summaries off the critical path.** Keep the field nullable and permit only
   reviewed derived content, but do not require all summaries for the factual catalog to ship. If the
   summaries remain in this sprint, give them their own acceptance gate and ensure one failed review
   does not block unrelated catalog facts.

7. **Split verification from promotion.** Offline fixture regeneration and tests must be deterministic
   and mandatory. A production artifact may be promoted only after a bounded live refresh and diff
   review. Network or reviewer unavailability should leave promotion pending rather than make offline
   verification nondeterministic.

8. **Make the allocation model semantic, not merely tabular.** Represent marginal and cumulative
   costs explicitly; distinguish allocated from effective rank; encode level range, character mode,
   campaign/native restrictions, quest grant grouping, and mutual exclusivity. Derive totals and test
   them instead of storing unexplained duplicated numbers.

9. **Strengthen reproducibility and dependency capture.** Record exact page and file revisions,
   redirects, relevant transclusion dependencies, parser/generator versions, normalized source
   digests, and deterministic ordering rules. State what can and cannot be reproduced when raw
   snapshots are intentionally untracked.

10. **Make QA closure mechanical.** Define blocking severities per finding class, reviewer and waiver
    requirements, stable finding-ID inputs, freshness rules, and the treatment of optional missing
    icons or summaries. No unresolved critical/error findings should remain at promotion; every
    accepted warning should have a durable disposition.

11. **Replace broad DoD prose with exact invariants.** At minimum, require:

    - exactly ten playable professions and exactly one `0 -> null` template sentinel;
    - set equality between source crosswalk IDs and emitted supported catalog IDs, with explicit
      records for reserved or unsupported IDs;
    - collision-safe forward and reverse crosswalks independent of array order;
    - exact rank and level domains with verified marginal/cumulative consistency;
    - quest rewards that cannot be double-counted under modeled applicability rules;
    - schema-valid artifacts with resolving provenance/claim references and no cached media bytes;
    - byte-identical fixed-input regeneration under a fully controlled clock and environment;
    - passing offline `npm run verify`;
    - closed blocking QA findings; and
    - a separately recorded live-refresh review before exact-path production promotion.

With those changes, the sprint would preserve the drafts' strong ingestion and policy architecture
while avoiding premature identity coupling, ambiguous completion criteria, and a descriptive-content
review dependency that could hold the core catalog hostage.
