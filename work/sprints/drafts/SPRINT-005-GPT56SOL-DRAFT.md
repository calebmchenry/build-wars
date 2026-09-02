---
id: SPRINT-005
title: Skills Catalog
status: planned
source_target: BACKLOG
source_epic: EPIC-04
source_epic_path: work/tickets/04-skills/EPIC.md
tickets:
  - BW-0401
  - BW-0402
  - BW-0403
  - BW-0404
  - BW-0405
  - BW-0406
created: 2026-09-01
---

# Sprint 005: Skills Catalog

## Overview

This sprint turns `EPIC-04 Skills` into the complete, source-derived skill catalog needed by later
template compatibility, rule validation, build editing, search, tooltips, title work, and guide
authoring. It extends the completed EPIC-02 ingestion spine, consumes the promoted EPIC-03
profession/attribute catalog as a versioned dependency, and promotes exactly one runtime-eligible
skills catalog with its generated manifest and QA report.

The increment is data and domain infrastructure, not UI or game-rule behavior. It does not build
skill search, editor controls, template codecs, skill-bar validation, title eligibility, acquisition
guides, attribution UI, or runtime network access. Browser code may later consume the approved skill
catalog, but it must never consume raw snapshots, snapshot-set manifests, parser output, Python
tooling, generated manifests, QA reports, or wiki APIs.

The sprint locks these strategic decisions:

- Skill template IDs and catalog IDs are distinct concepts even though the first catalog assigns the
  same numeric value to both. Add an explicit `TemplateSkillId`, keep numeric IDs non-contiguous,
  and preserve unknown authored numeric IDs for EPIC-05 instead of coercing or dropping them.
- `Guild Wars Wiki:Game integration/Skills/0` is the seed authority for the accepted skill-ID source
  set. Each seed entry must become one catalog record or one reviewed, explicit disposition; a gap
  in the numeric range is not evidence of a missing record.
- Full live acquisition is a reviewed two-step operation. Discovery fetches and snapshots only the
  seed, writes an ignored source plan with an exact title list and digest, and stops. A second command
  requires that digest to be supplied explicitly before it may batch-fetch detail pages and icon
  metadata. Source-provided links never trigger an unreviewed crawl.
- Add a run-level snapshot-set manifest so offline replay selects one exact EPIC-04 input set. Do not
  scan the shared snapshot tree by title or infer a run from whatever files happen to be present.
- The EPIC-03 generated catalog, its manifest digest, its relevant section digests, and passing QA
  state are generation inputs. Profession and attribute facts are joined from that catalog; EPIC-04
  neither duplicates their extraction nor silently repairs unknown joins.
- Store normalized core facts, typed value states, a safe description token model, explicit
  progression series, and normalized mode-variant relationships. Runtime consumers must not need
  wikitext, MediaWiki-rendered HTML, or parser-specific structures.
- Precompute progression values across the verified rank domain from recognized source templates.
  The catalog retains normalized template evidence, while a pure domain helper substitutes values
  into tooltip tokens. This avoids embedding a wiki-template interpreter in the browser and avoids
  materializing every possible rendered tooltip in JSON.
- Model PvE/PvP variants as one normalized relationship record referenced by both skill records.
  Pure lookups can resolve either direction and select a record for a supplied mode; EPIC-06 still
  owns legality and EPIC-15 owns title/allegiance rules.
- Treat copied description wording as publisher-owned material requiring field-level provenance and
  named, digest-bound review. Do not promote MediaWiki HTML, whole page bodies, unreviewed prose, or
  text whose source classification remains unknown. Description review cannot be bypassed by calling
  copied text “structured data.”
- Defer acquisition metadata. Its guide value is speculative, while adding it now would expand the
  page graph, source-policy surface, QA volume, and refresh cost. EPIC-19 can add a separate bounded
  acquisition section when a concrete guide use case exists.
- Use aggregate source tables and compact field provenance references rather than repeating complete
  source objects in every skill field. Catalog size is bounded and measured; output-size failure is
  explicit rather than silently truncating records, descriptions, evidence, or findings.
- `catalogVersion` is derived from runtime gameplay and display semantics plus the relevant EPIC-03
  dependency section digests. Retrieval timestamps, snapshot paths, review timestamps, QA paths,
  generator timing, and other provenance-only facts do not change the semantic version. The artifact
  manifest digest still covers every output byte.
- Fixture and canonical verification remain offline. Production promotion requires a complete
  bounded live refresh, fixed-clock offline replay from the resulting snapshot-set manifest,
  deterministic repeat generation, first-baseline review, and passing app/public QA gates.

The initial EPIC-04 hard ceilings are 4,000 accepted seed entries, 4,000 detail pages, 8,000 icon
candidate titles, 25 detail titles per request, 50 image titles per request, 500 total request
attempts, 2 MiB per response, 250 KiB per parsed page, 256 MiB across a live run, 64 MiB for the
catalog, and 32 MiB for the QA report. The discovery plan computes a smaller exact per-run budget
from its actual cardinality. Phase 1 may lower these ceilings after source-shape proof; raising one
requires a reviewed profile change and test update, never an unrestricted CLI override.

## Use Cases

1. **Resolve template skill IDs without data loss**: EPIC-05 can distinguish known catalog skills,
   reviewed unsupported IDs, and unknown authored IDs while preserving the original numeric value.
2. **Search the complete local catalog**: A future local index can filter by ID, name, campaign,
   profession, attribute, type, cost model, elite state, common/title/special classification, and
   PvE/PvP availability without querying the wiki or parsing descriptions.
3. **Render dynamic tooltips**: A pure domain helper can combine approved description tokens with
   normalized progression values for caller-supplied attribute or title ranks. It emits text, not
   HTML, and reports unresolved dependencies rather than guessing.
4. **Select the correct mode variant**: Given a skill ID and `pve`, `pvp`, or `unknown`, a caller can
   traverse a validated split relationship and select the appropriate catalog record without
   encoding page-title conventions.
5. **Validate skill bars later**: EPIC-06 can read profession, attribute, elite, common, mode, and
   special classification facts from plain catalog records while preserving unresolved IDs as
   explainable validation issues.
6. **Support title work without preempting it**: EPIC-15 can consume preserved title-rank dependency
   keys and value tables, then connect them to canonical title tracks, eligibility, allegiance, and
   effective-rank rules in its own catalog and validator work.
7. **Trace every skill to release evidence**: A maintainer can follow a skill ID through seed entry,
   requested title, normalization/redirect evidence, canonical page identity, revision facts,
   field claims, description review, icon metadata, generated manifest, and QA disposition.
8. **Replay one large refresh exactly**: Offline mode accepts one snapshot-set manifest and rejects
   incomplete, mixed-profile, digest-mismatched, duplicated, or unplanned inputs.
9. **Review catalog changes by meaning**: A future refresh can separate skill semantic changes,
   description/progression changes, variant changes, media-reference changes, source-set membership
   changes, dependency changes, provenance-only refreshes, and generator formatting defects.
10. **Promote a bounded runtime artifact**: Reviewers can prove that every accepted seed ID is
    accounted for, all blocking findings are closed, copied text has exact review coverage, and only
    the three approved EPIC-04 paths escape the deny-by-default ignore policy.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Domain | Plain-data skill catalog, IDs, typed value states, description/progression contracts, mode-variant records, dependency references, and pure lookup/render helpers. | React state, editor/search UI, storage, network access, rule enforcement, full template codecs, or attribution presentation. |
| Ingestion | Registered EPIC-04 profile, two-step source discovery, exact snapshot-set selection, structured extraction, catalog assembly, and content QA inside the EPIC-02 package. | A skill-specific HTTP client, browser automation, recursive categories, arbitrary URLs, runtime fetching, or a second artifact/QA framework. |
| Generated data | Exact-path catalog, adjacent manifest, bounded QA JSON, and one synthetic golden fixture. | Raw pages, snapshot manifests, source plans, live candidates, text summaries, copied page bodies, MediaWiki HTML, or icon bytes. |
| Game behavior | Facts needed by future validation and tooltip evaluation. | Skill-bar limits, profession eligibility decisions, title/allegiance eligibility, equipment effects, balance simulation, or build recommendations. |
| Content | Core skill facts, reviewed description tokens, progression data, split relations, wiki links, provenance, and metadata-only icons. | Acquisition instructions, quest/vendor/drop locations, guide prose, strategy, ratings, usage notes, or community metadata. |

### Data Flow And Trust Boundaries

```text
promoted EPIC-03 catalog + manifest + passing QA
                         |
verified Skills/0 seed snapshot
  -> seed parser -> exact ID/title source plan + discovery digest
  -> explicit human digest confirmation
  -> bounded batched detail-page fetch
  -> verified page snapshots + resolution evidence
  -> snapshot-driven infobox/description/progression extraction
  -> bounded icon metadata plan and imageinfo fetch
  -> complete SourceSnapshotSetManifest
  -> core normalization + EPIC-03 joins + split reconciliation
  -> SkillCatalog + deterministic diagnostics
  -> canonical JSON + GeneratedArtifactManifest + QaReport
  -> description/source-set/baseline review
  -> exact-path promotion

src/domain helpers -> approved plain-data catalogs only
src/app             -X-> scripts/data | snapshots | manifests | QA | wiki API
```

Live mode owns network access, but it does not own extraction semantics. After each fetch stage it
writes verified snapshots, then invokes the same snapshot-driven code used by offline mode. Fixture
mode uses minimized synthetic inputs, a fixed clock, and the same normalization/QA path.

### Skill Identity And Source-Set Accounting

Add `TemplateSkillId` beside `SkillId`. A `CatalogSkillRecord` contains both `id` and `templateId`;
v1 requires their numeric values to match, but only the record/source-set relationship defines that
mapping. Collections sort numerically and never use array position, range density, or title order as
identity.

The catalog includes a compact source-set summary and reviewed non-catalog dispositions:

- seed source ID, seed revision, discovery digest, resolution digest, and accepted-entry count
- cataloged record count and disposition count
- one `SkillIdDisposition` for every accepted seed ID that does not produce a skill record
- disposition kinds such as `unsupported-non-skill`, `excluded-by-policy`, or `source-defect`
- reviewer, evidence, rationale, and follow-up for every non-catalog disposition

`source-defect`, unresolved redirects, missing pages, disambiguation pages, duplicate IDs, and
ambiguous canonical-page reuse block the first promotion. Only evidence-backed, reviewed facts such
as a known non-skill integration ID may ship as an `unsupported-non-skill` disposition. A numeric gap
between accepted IDs is retained as coverage information, not synthesized into a disposition.

The page-resolution record retains requested title, normalized title, redirect evidence, canonical
title, page ID, revision ID, revision timestamp, retrieval timestamp, and resolution state. Multiple
IDs resolving to one canonical page are not silently cloned. They block unless explicit source
evidence and review establishes an alias or mode-variant relationship.

### Snapshot-Set And Large-Refresh Protocol

Introduce a versioned `SourceSnapshotSetManifest` rather than overloading individual
`SourceSnapshotManifest` records. It contains profile ID, seed snapshot manifest path and digest,
discovery digest, ordered planned IDs/titles, exact page and icon snapshot manifest paths, aggregate
digests/counts/bytes, caps used, completion state, and generator time. It remains ignored and is not
runtime data.

EPIC-04 live mode has two explicit commands or stages:

1. **Discover**: fetch the one locked seed title, verify its snapshot, enumerate accepted IDs/titles,
   validate hard ceilings, compute the exact request/byte budget and discovery digest, write an
   ignored source plan, print bounded counts/digest/path, and stop without fetching detail pages.
2. **Fetch**: require `--allow-live-network`, the generated source-plan path, and an exact
   `--confirm-source-set-digest`; revalidate the seed/plan digest and profile caps, fetch only the
   planned detail titles, derive bounded icon candidates from verified infobox snapshots, fetch
   metadata only, and write a complete snapshot-set manifest.

Partial runs write `completionState: partial` and diagnostics but are ineligible for promotion.
Offline production replay requires a complete manifest and verifies every child manifest and payload
digest before parsing. It rejects extra inputs as well as missing ones. Fixture mode uses a small
synthetic snapshot set with the same shape.

Profile ceilings are code-owned. The CLI may lower limits for smoke tests but cannot raise them.
Successful request budgets are computed from the confirmed plan; the larger hard request-attempt cap
exists only for bounded retries and cannot authorize additional titles.

### Source Authority And Reconciliation

| Fact | Primary Authority | Required Cross-Check | Conflict Behavior |
| --- | --- | --- | --- |
| Skill template ID and requested title | Verified `Guild Wars Wiki:Game integration/Skills/0` seed | Unique ID/title candidates and prior approved source-set digest | Duplicate ID blocks; duplicate title or source-set membership drift requires review. |
| Canonical page identity and revision | MediaWiki title normalization/redirect result captured in snapshot evidence | Requested title, page parser redirect/disambiguation evidence, and infobox name | Missing, ambiguous, cyclic, disambiguated, or unexplained mismatch blocks. |
| Profession and attribute joins | Promoted EPIC-03 catalog sections | Skill infobox labels and explicit lookup outcomes | Unknown or contradictory join blocks unless the skill classification legitimately uses `null`. |
| Name, campaign, type, costs, flags, and wiki URL | Verified `Skill infobox` structure | Seed title, canonical title, field invariants, and controlled vocabularies | Unknown required fields or malformed values block; no page prose fallback. |
| Description wording | Bounded infobox description field | Source classification, normalized token round-trip, and digest-bound manual review | Unknown or unreviewed copied material is excluded and blocks tooltip-complete promotion. |
| Progression semantics | Recognized `Skill progression`, `gr`, `gr2`, title-rank, recharge, and wrapper templates | Description token references, rank-domain tables, and synthetic edge fixtures | Unsupported source-indicated progression blocks; no guessed interpolation. |
| PvE/PvP relation | Explicit wrapper or page relationship evidence | Mode flags, canonical pages, counterpart existence, and reciprocal membership | Missing, self-referential, duplicate, or contradictory relations block. |
| Icon metadata | Explicit infobox file fact plus MediaWiki `imageinfo` | Page/file identity, MIME, dimensions, remote timestamp/hash, and policy | Nullable only with a scoped QA disposition; bytes are never fetched. |

Category pages and profession skill lists may be used only as bounded QA cross-checks if the
source-shape checkpoint proves they materially detect omissions. They cannot expand the accepted
source set or override the seed authority.

### EPIC-03 Catalog Dependency

Production generation reads the exact promoted EPIC-03 catalog and adjacent manifest, recomputes the
artifact SHA-256, verifies `commitDecision: exact-path-allowlisted`, and confirms that its QA report
has passing app/public gates. Fixture generation uses the committed synthetic EPIC-03 catalog.

The skill catalog records one dependency entry containing:

- dependency ID and exact catalog path
- dependency schema and semantic catalog version
- required `templateCrosswalk`, `professions`, and `attributes` section digests
- the consumed artifact digest for audit

Only the three relevant semantic section digests feed the skill `catalogVersion`; EPIC-03 allocation
rule or provenance-only changes do not force a skill semantic version change. Any changed required
section forces a fresh join and review. Skill records store profession/attribute IDs and do not copy
EPIC-03 names, abbreviations, effects, allocation rules, or icon records.

### Skill Catalog Contract

The `SkillCatalog` envelope contains:

- `schemaVersion`, semantic `catalogVersion`, section digests, `generatedAt`, generator, and profile
- EPIC-03 catalog dependency records
- source-set summary, reviewed non-catalog ID dispositions, and snapshot-set references
- aggregate source references and compact field provenance claims
- skill records sorted by numeric catalog ID
- normalized PvE/PvP variant groups
- metadata-only remote media records
- manual reviews, including source-set, description-corpus, and first-baseline reviews
- a nullable generated artifact manifest field matching the established catalog wire convention

Each skill record contains:

- catalog ID, template ID, canonical name, canonical wiki URL, campaign, and canonical page identity
- nullable profession and attribute IDs resolved through EPIC-03
- controlled skill type tokens plus bounded source-label evidence
- typed cost/timing fields for energy, adrenaline, sacrifice, upkeep, overcast, activation, and
  recharge
- explicit classification and mode facts: elite, common, title, special, PvE-only, PvP-only,
  shared, or split
- normalized description tokens and a policy-approved plain-text search projection
- progression series references and optional mode-variant group ID
- nullable metadata-only icon ID
- field-level provenance references

Acquisition data is absent from schema v1. The canonical wiki URL is enough to support a future
linked-only guide affordance without turning this sprint into an acquisition crawl.

### Costs, Timing, And Classification

Do not represent heterogeneous values as bare nullable numbers. Each field uses a discriminated value
state with explicit unit:

- `numeric`, including an explicit zero
- `percentage` for sacrifice-style values where applicable
- `not-applicable` when normalization can prove the field does not apply
- `absent` when the source field is absent and still needs QA interpretation
- `special` for a recognized bounded form such as morale-boost recharge

The cost envelope also records a normalized cost model such as `energy`, `adrenaline`, `none`,
`mixed`, `special`, or `unknown`. Signets and other legitimate no-cost skills use `none` plus
`not-applicable` fields; they are not confused with malformed missing data. A promoted `absent` or
`unknown` value requires a field-specific disposition. Numeric values must be finite, non-negative,
unit-correct, and source-backed. Cross-field exclusivity is enforced only where verified source/game
semantics support it.

Classification uses controlled fields rather than asking downstream code to infer behavior from
names or types. Validators reject contradictory combinations, but EPIC-04 records facts only.
EPIC-06 decides whether a selected skill is legal for a build, and EPIC-15 supplies title/allegiance
eligibility and effective title-rank behavior.

### Description And Progression Model

The promoted catalog never contains rendered MediaWiki HTML or whole raw wikitext parameters.
Description extraction emits a bounded, JSON-safe token stream:

- literal text segments
- normalized whitespace or line-break segments
- references to progression series/value slots
- a small reviewed set of non-scaling factual markers

Unrecognized markup, links, HTML, templates, or nested forms produce diagnostics; they are not
flattened into apparently safe text. Literal source wording is classified as copied
`game-publisher-material`, while calculated series values and search projections carry their own
derived/normalized claims. A named review covers an exact description-section digest, record count,
source scope, attribution plan, and exception list. Any description-section change invalidates that
review.

Each normalized progression series records:

- stable series ID and owning skill ID
- dependency kind: `attribute`, `title-rank`, `mode`, `constant`, or recognized special timing
- EPIC-03 attribute ID or a stable unresolved title dependency key
- verified inclusive rank domain
- source form (`gr`, `gr2`, skill-progression row, title-rank form, or morale-boost recharge)
- normalized source parameters as bounded structured evidence
- explicit values for every supported integer rank and value slot
- formatting/unit metadata and provenance

Precomputed rank tables make tooltip evaluation deterministic and keep wiki-template rules out of
runtime code. Ordinary attribute and title-rank domains come from verified template semantics, not a
hard-coded assumption in the UI. Non-monotonic values are legal only when the normalized source form
and tests explicitly account for them.

A new pure domain helper accepts catalog data, skill ID, mode, and supplied rank values. It returns a
resolved record and plain-text tooltip result or a structured unresolved outcome. It does not fetch,
sanitize HTML, calculate effective ranks, decide build legality, or invent a value outside the
recorded rank domain.

### PvE/PvP Variant Semantics

Use one `SkillModeVariantGroup` per supported split. It identifies the PvE and PvP skill IDs, source
relationship kind, provenance, and any shared identity supported by source evidence. Each member
record stores the group ID and its own mode role. Validators ensure exactly one member per role,
counterpart existence, no self-links, no record in conflicting groups, and agreement with mode
flags.

The normalized group is traversable from either member, satisfying bidirectional lookup without
serializing two independent relationship objects that can drift. For `mode: unknown`, lookup returns
an explicit ambiguity when the variants differ rather than silently preferring PvE or PvP.

### Determinism, Versioning, And Scale

Canonical arrays sort by schema-owned keys: skills and ID dispositions by numeric template ID,
variant groups/media/sources/claims/reviews by stable ID, progression tables by rank, and snapshot
references by declared source-plan order. Input API order, dictionary order, filesystem traversal,
batch boundaries, and concurrent completion order must not affect bytes.

The semantic projection contains source-set membership/dispositions, runtime skill fields,
descriptions, progressions, variant relationships, media references, and relevant EPIC-03 section
digests. It excludes source/retrieval timing, snapshot paths, generation timing, manual-review timing,
QA/manifest paths, raw diagnostic messages, and its own version. Separate section digests cover:

- `skill-core`
- `descriptions-progressions`
- `mode-variants`
- `id-dispositions`
- `media-references`

The generated artifact manifest SHA-256 covers the final canonical catalog bytes. Baseline review
classifies changes as source-set membership, core semantics, description/progression, variants,
media, dependency, provenance-only, schema, or formatting/order. A formatting/order-only diff with
unchanged semantic projection is treated as a generator defect and blocks promotion.

Catalog, manifest, and QA hard byte caps are checked before atomic replacement. The writer never
truncates a catalog or drops findings to fit. QA evidence excerpts are length-bounded and escaped;
systematic findings may share aggregate evidence, but every affected skill ID remains addressable.

### QA And Promotion Gates

Profile validators cover at least:

- seed cardinality, duplicate IDs/titles, source-set digests, non-contiguous IDs, and complete
  record-or-disposition accounting
- requested/normalized/redirect/canonical title evidence, missing/disambiguation pages, duplicate
  canonical pages, revision freshness, and complete snapshot-set integrity
- EPIC-03 artifact/manifest/QA validity, required section digests, and every profession/attribute join
- infobox count/shape, name/title drift, campaigns, types, flags, cost states, units, timing values,
  and permitted null joins
- description presence, token round-trip, unsupported markup, copied-text classification, exact
  review coverage, search projection, and source-pointer validity
- progression references, rank domains, value-slot arity, finite values, declared direction or
  non-monotonic evidence, wrapper semantics, title dependency keys, and special recharge forms
- variant group completeness, reciprocal traversal, mode contradictions, duplicate membership, and
  counterpart existence
- icon candidate ambiguity, missing metadata, MIME/size/hash/timestamp facts, `cachedBytes: false`,
  and absence of media payloads
- source/claim/review reference resolution, field-level material classification, source revisions,
  generated schema, section/catalog versions, deterministic order, baseline diffs, output caps, and
  artifact/manifest/QA digest alignment

Promotion requires one reviewed complete live snapshot set, two byte-identical fixed-clock offline
generations from it, a reviewed first baseline, an exact description-corpus review, no unresolved
critical/error findings, every warning resolved/excluded/accepted with bounded evidence, and both
`appConsumptionGate` and `publicReleaseGate` set to `pass`. Missing optional icons may be reviewed
warnings; missing required descriptions, unsupported source-indicated progression, unresolved joins,
and ambiguous split relationships remain blocking.

Exact promoted paths:

- `data/generated/epic-04/skills.catalog.json`
- `data/generated/epic-04/skills.catalog.manifest.json`
- `data/qa/epic-04/skills.catalog.qa.json`

Raw snapshots, per-page manifests, snapshot-set manifests, source plans, live/offline candidates,
text summaries, logs, icon bytes, screenshots, MediaWiki HTML, page bodies, and review work files
remain ignored or absent.

## Implementation

### Phase 1: BW-0401 Contracts, Dependency Boundary, And Profile Foundation (~15%)

**Files:**

- `src/domain/ids.ts`
- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/source.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/skill-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/foundation.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `work/tickets/04-skills/BW-0401-skill-catalog-contracts-and-profile.md`

**Tasks:**

- [ ] Confirm EPIC-01 through EPIC-03 and SPRINT-002 through SPRINT-004 remain complete and the
      promoted EPIC-03 artifact, manifest digest, relevant section digests, and QA gates are valid.
- [ ] Perform a bounded source-shape checkpoint for the seed, representative detail pages, existing
      parser corpus, description markup, progression forms, wrappers, and icon fields. Record all
      supported forms and turn unknown forms into explicit fixture/QA work before contract freeze.
- [ ] Add `TemplateSkillId`, `SkillCatalog`, `CatalogSkillRecord`, dependency, source-set summary,
      disposition, typed value-state, classification, description token, progression series,
      mode-variant, and lookup outcome contracts.
- [ ] Keep `SkillId` usable for unknown authored numeric values; do not change the eight-slot build
      wire shape or implement a template codec.
- [ ] Define semantic section projections, sort keys, catalog version inputs, output byte caps, and
      cross-language camelCase wire fields before writing extractors.
- [ ] Add `SourceSnapshotSetManifest` and profile cap contracts without breaking existing individual
      snapshot manifests or EPIC-02/EPIC-03 wire output.
- [ ] Register `epic-04-skills` and refactor fixture orchestration to run explicitly registered
      profiles in deterministic order instead of relying on hidden profile side effects. Preserve
      existing fixture bytes where their schema has not intentionally changed.
- [ ] Lock the two-step live protocol and CLI validation: discover plan, confirm digest, fetch, then
      exact offline replay. CLI options may lower but never raise code-owned caps.
- [ ] Add synthetic TypeScript examples for unknown IDs, null joins, all typed value states,
      progression dependencies, variant groups, and unresolved tooltip outcomes.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/skill-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_pipeline`

**Phase gate:** Contracts, dependency semantics, caps, and source-shape decisions are stable enough
that later phases do not invent alternate wire forms or broaden the live source graph.

### Phase 2: BW-0402 Source Discovery, Resolution, And Exact Replay (~20%)

**Files:**

- `scripts/data/build_wars_ingest/api.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/skill_ids.py`
- `scripts/data/build_wars_ingest/skill_source_set.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_api.py`
- `scripts/data/build_wars_ingest/tests/test_snapshots.py`
- `scripts/data/build_wars_ingest/tests/test_skill_ids.py`
- `scripts/data/build_wars_ingest/tests/test_skill_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/skills/`
- `work/tickets/04-skills/BW-0402-skill-source-set-and-page-resolution.md`

**Tasks:**

- [ ] Harden seed enumeration so every candidate line becomes an accepted entry or a scoped
      diagnostic; preserve duplicate, malformed, redirect-like, unexpected, and gap evidence.
- [ ] Extend title-query results with requested, normalized, redirect, canonical, page, revision,
      and missing-page facts instead of returning an unannotated page that loses association.
- [ ] Implement deterministic source-plan and discovery digests over accepted numeric IDs and exact
      requested titles. Reject plan edits, wrong-profile plans, stale seed digests, and cap overflow.
- [ ] Implement the discover-only live stage and require exact digest confirmation before any large
      fetch. Print bounded counts and digests, never the complete source body or title list.
- [ ] Fetch only confirmed titles in stable batches; count retries against request caps and enforce
      per-response, per-page, aggregate-byte, page-count, and output-plan limits.
- [ ] Detect missing pages, disambiguation preambles, redirects in page content, title normalization,
      duplicate canonical pages, unexpected canonical reuse, and partial batches without guessing a
      record mapping.
- [ ] Write and verify complete/partial snapshot-set manifests with child manifest digests,
      aggregate counts, aggregate bytes, source-plan digest, and deterministic order.
- [ ] Require `--snapshot-set` for EPIC-04 offline mode. Reject shared-tree scanning, extra/missing
      snapshots, digest mismatches, duplicated child manifests, and mixed EPIC profiles.
- [ ] Add minimized fixtures for high ID gaps, duplicate IDs/titles, normalization, redirects,
      disambiguation, missing pages, shared canonical targets, partial runs, batch boundaries,
      changed plans, wrong confirmation digests, and hard-cap failures.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_api build_wars_ingest.tests.test_snapshots build_wars_ingest.tests.test_skill_ids build_wars_ingest.tests.test_skill_source_set build_wars_ingest.tests.test_cli`
- `npm run data:test`
- One discover-only manual live smoke during implementation if Guild Wars Wiki is available; no
  detail-page fetch is needed to close this phase.

**Phase gate:** Every accepted fixture ID has deterministic page-resolution evidence or a blocking
diagnostic, and one exact complete fixture snapshot set replays without consulting unrelated files.

### Phase 3: BW-0403 Core Infobox, Join, Description, And Icon Extraction (~25%)

**Files:**

- `scripts/data/build_wars_ingest/skill_infobox.py`
- `scripts/data/build_wars_ingest/skill_catalog.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_skill_infobox.py`
- `scripts/data/build_wars_ingest/tests/test_skill_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/skills/`
- `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json`
- `test/domain/skill-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `work/tickets/04-skills/BW-0403-skill-infobox-and-field-extractors.md`

**Tasks:**

- [ ] Load the EPIC-03 dependency through one validated adapter; verify catalog/manifest digests and
      required QA/section state before any production join.
- [ ] Extract exactly one supported infobox per resolved page and normalize name, wiki URL, campaign,
      type tokens, profession, attribute, cost/timing states, mode/classification flags, explicit
      icon fact, and field provenance.
- [ ] Join professions and attributes only through EPIC-03 collision-safe lookups. Permit `null` only
      for verified common, no-attribute, title, or special classifications; reject label guessing and
      duplicate local copies of EPIC-03 data.
- [ ] Distinguish explicit zero, percentage, not-applicable, absent, numeric, and recognized special
      cost/timing values. Preserve malformed values as diagnostics, not sentinel numbers or `null`.
- [ ] Tokenize only the bounded infobox description field into literal, whitespace, line-break,
      progression-reference, and reviewed factual-marker tokens. Reject HTML, unrecognized nested
      templates, lossy flattening, and page-body fallback.
- [ ] Produce a deterministic plain-text search projection from approved tokens; do not create or
      store executable markup or MediaWiki-rendered HTML.
- [ ] Resolve only metadata for explicit or bounded default icon candidates. Derive the icon plan
      from verified snapshots, enforce the media-title cap, and keep `cachedBytes: false`.
- [ ] Retain every resolved page as a catalog candidate, evidence-backed non-catalog disposition, or
      scoped blocking diagnostic. Do not silently drop records with missing fields.
- [ ] Keep acquisition metadata absent and add a test that unexpected acquisition/page prose cannot
      leak into the catalog wire shape.
- [ ] Add minimized fixtures covering elite, common, signet/no-cost, energy, adrenaline, sacrifice,
      upkeep, overcast, title, no-attribute, PvE-only, PvP-only, special, malformed/missing costs,
      unknown type/campaign, null-join rules, ambiguous icons, and unsafe description markup.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_infobox build_wars_ingest.tests.test_skill_catalog build_wars_ingest.tests.test_icons`
- `npm run test:run -- test/domain/skill-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `npm run data:test`

**Phase gate:** The synthetic catalog accounts for every fixture seed ID, core fields round-trip
through Python and TypeScript, all joins come from EPIC-03, and no raw page body, HTML, or media bytes
appear in generated JSON.

### Phase 4: BW-0404 Progression, Split Relationships, And Tooltip Evaluation (~20%)

**Files:**

- `scripts/data/build_wars_ingest/skill_progression.py`
- `scripts/data/build_wars_ingest/skill_catalog.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_skill_progression.py`
- `scripts/data/build_wars_ingest/tests/test_skill_catalog.py`
- `test/fixtures/data-ingestion/skills/`
- `src/domain/skill-tooltip.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/skill-catalog.test.ts`
- `work/tickets/04-skills/BW-0404-skill-progression-splits-and-tooltip-data.md`

**Tasks:**

- [ ] Normalize verified `Skill progression`, `gr`, `gr2`, title-rank progression,
      morale-boost recharge, `pveversion`, `pvpversion`, and source-shape-approved wrappers.
- [ ] Resolve progression dependencies to EPIC-03 attribute IDs or stable title dependency keys;
      title track ownership, allegiance, and effective-rank eligibility remain deferred to EPIC-15.
- [ ] Expand recognized formulas into explicit per-rank value tables over verified domains. Preserve
      source form/parameters as bounded structured evidence and reject values outside the domain.
- [ ] Validate value-slot arity, finite values, rank coverage, duplicate ranks, formula boundaries,
      expected direction, explicitly evidenced non-monotonic values, and every description-to-series
      reference.
- [ ] Build one normalized mode-variant group for each evidenced split and validate counterpart
      existence, unique roles, reciprocal traversal, wrapper/page consistency, and mode flags.
- [ ] Add a pure `src/domain` lookup/render helper that resolves a mode variant, substitutes supplied
      rank values into safe tokens, and returns structured unresolved outcomes for unknown mode,
      missing ranks, unknown IDs, title dependencies, or unsupported domains.
- [ ] Keep rendering framework-neutral and plain-text-only. Do not calculate effective attribute or
      title rank, validate a build, fetch data, or interpret raw templates at runtime.
- [ ] Add fixtures for ordinary scaling, multiple value slots, constants, explicit zero, title-rank
      scaling, morale-boost recharge, shared pages, separate PvE/PvP pages, wrappers, no-progression
      skills, intentionally non-monotonic evidence, malformed templates, missing counterparts, and
      contradictory flags.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_progression build_wars_ingest.tests.test_skill_catalog`
- `npm run test:run -- test/domain/skill-catalog.test.ts`
- `npm run data:test`

**Phase gate:** Fixture tooltips render from catalog tokens for supported attribute/title ranks and
both modes without reading wikitext; unsupported source-indicated progression and ambiguous splits
produce blocking findings rather than guessed output.

### Phase 5: BW-0405 Full QA, Determinism, Review, And Exact-Path Promotion (~15%)

**Files:**

- `scripts/data/build_wars_ingest/skill_catalog.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_skill_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json`
- `data/generated/epic-04/skills.catalog.json`
- `data/generated/epic-04/skills.catalog.manifest.json`
- `data/qa/epic-04/skills.catalog.qa.json`
- `.gitignore`
- `package.json`
- `work/tickets/04-skills/BW-0405-skills-catalog-qa-and-promotion.md`

**Tasks:**

- [ ] Assemble canonical catalog sections, compact source/provenance tables, dependency records,
      section digests, semantic catalog version, source-set summary, non-catalog dispositions,
      variant groups, media records, and manual reviews under hard output caps.
- [ ] Add the complete profile-specific QA matrix from Architecture and stable, scoped finding IDs.
      Report every affected skill ID without embedding unbounded source excerpts.
- [ ] Add mutation tests proving every runtime-semantic field changes its owning section digest and
      `catalogVersion`, while provenance-only timestamps do not.
- [ ] Prove stable output under shuffled source order, changed batch boundaries, filesystem order,
      concurrent completion order, and fixed clock; schema-owned arrays must remain byte-identical.
- [ ] Generate the synthetic EPIC-04 fixture twice from a clean output root and compare catalog,
      manifest, QA JSON, finding IDs, source order, and summary counts byte-for-byte.
- [ ] Run live discovery, review the exact count/title digest and computed budget, then run the
      digest-confirmed bounded detail/icon refresh. Do not proceed on unexpected source-set drift.
- [ ] Replay the complete live snapshot set offline twice with fixed generation time and require
      byte-identical catalog, manifest, QA report, section digests, and finding IDs.
- [ ] Record a description-corpus review bound to the exact description section digest and exception
      list. Every copied literal claim must reference that review; unknown copied material is
      non-waivable and must be resolved or excluded.
- [ ] Record a first-baseline review naming the seed/source-set digests, snapshot-set digest,
      EPIC-03 dependency digests, catalog/section versions, artifact digest, QA report, reviewer,
      timestamp, source-policy decision, and rationale.
- [ ] Resolve or exclude all critical/error findings and disposition every warning with bounded
      named evidence. Require both app and public gates to pass.
- [ ] Allowlist only the three exact EPIC-04 paths with required parent-directory rules. Verify that
      raw snapshots, plans, set manifests, candidates, summaries, logs, copied page bodies, and media
      bytes remain ignored or absent.

**Verification:**

- `npm run data:regenerate` twice with byte comparisons under a fixed clock
- EPIC-04 offline replay twice from the reviewed `SourceSnapshotSetManifest`
- `npm run verify`
- `git check-ignore -v` for each promoted path and representative ignored raw/candidate paths
- `git status --short` plus artifact/manifest/QA digest and size inspection

**Phase gate:** The three production files refer to one reviewed source/dependency set, pass both QA
gates, reproduce byte-for-byte offline, and are the only new generated paths eligible for tracking.

### Phase 6: BW-0406 Documentation, Verification, And Closeout (~5%)

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/skills-catalog.md`
- `compendium/README.md`
- `work/tickets/04-skills/EPIC.md`
- `work/tickets/04-skills/BW-0401-skill-catalog-contracts-and-profile.md`
- `work/tickets/04-skills/BW-0402-skill-source-set-and-page-resolution.md`
- `work/tickets/04-skills/BW-0403-skill-infobox-and-field-extractors.md`
- `work/tickets/04-skills/BW-0404-skill-progression-splits-and-tooltip-data.md`
- `work/tickets/04-skills/BW-0405-skills-catalog-qa-and-promotion.md`
- `work/tickets/04-skills/BW-0406-docs-verification-and-closeout.md`
- `work/sprints/SPRINT-005.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Document profile commands, two-step live confirmation, exact snapshot-set replay, caps, exit
      behavior, promoted paths, safe local cleanup, and deterministic regeneration.
- [ ] Document catalog identity, EPIC-03 dependency semantics, cost states, description policy,
      progression domains, mode variants, title dependency boundary, and deferred acquisition data.
- [ ] Document downstream consumption boundaries for EPIC-05, EPIC-06, EPIC-08, EPIC-15, EPIC-19,
      and EPIC-20, including unknown-ID preservation and the prohibition on runtime manifest/QA reads.
- [ ] Run canonical offline verification and inspect the worktree for raw content, icon bytes,
      unreviewed prose, live logs, accidental broad allowlists, unrelated changes, or local paths.
- [ ] Mark BW-0401 through BW-0406 complete in dependency order only after their phase gates pass.
      Mark EPIC-04, SPRINT-005, and the ledger complete only after every Definition of Done item is
      satisfied.
- [ ] Keep implementation commit-free; the outer ticket-burn executor owns any commit behavior.

**Verification:**

- `npm run verify`
- `git status --short`
- `git check-ignore -v` checks documented in Phase 5
- Manual consistency review across docs, generated files, QA state, tickets, sprint, and ledger

## Files Summary

| Path | Action | Purpose |
| --- | --- | --- |
| `src/domain/ids.ts` | Modify | Add distinct template skill identity without weakening unknown authored ID preservation. |
| `src/domain/catalog.ts` | Modify | Add the versioned skill catalog, record, cost, classification, description, progression, variant, dependency, and disposition contracts. |
| `src/domain/catalog-lookup.ts` | Modify | Add collision-safe skill/template/mode lookups with explicit known, unsupported, unknown, and ambiguous outcomes. |
| `src/domain/skill-tooltip.ts` | Create | Resolve mode variants and render safe plain-text tooltip tokens from supplied ranks. |
| `src/domain/source.ts` | Modify | Add snapshot-set and dependency manifest wire contracts while preserving existing source-policy types. |
| `src/domain/index.ts` | Modify | Export the new framework-neutral skill catalog surface. |
| `scripts/data/build_wars_ingest/config.py` | Modify | Add scale-specific hard ceilings and run-budget rules. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register `epic-04-skills` and explicit deterministic fixture orchestration. |
| `scripts/data/build_wars_ingest/models.py` | Modify | Align snapshot-set, dependency, diagnostic, and skill wire helpers with TypeScript. |
| `scripts/data/build_wars_ingest/api.py` | Modify | Preserve requested/normalized/redirect/canonical title association across bounded batches. |
| `scripts/data/build_wars_ingest/snapshots.py` | Modify | Write and verify exact run-level snapshot-set manifests and aggregate integrity. |
| `scripts/data/build_wars_ingest/skill_ids.py` | Modify | Harden complete seed candidate accounting and deterministic source-set inputs. |
| `scripts/data/build_wars_ingest/skill_source_set.py` | Create | Build confirmed source plans, resolve pages, enforce caps, and assemble replay manifests. |
| `scripts/data/build_wars_ingest/skill_infobox.py` | Create | Extract core skill facts, typed values, safe description tokens, classifications, joins, and provenance. |
| `scripts/data/build_wars_ingest/skill_progression.py` | Create | Normalize progression/rank tables, special recharge forms, wrappers, and split evidence. |
| `scripts/data/build_wars_ingest/skill_catalog.py` | Create | Assemble catalog sections, dependency records, semantic projections, digests, and dispositions. |
| `scripts/data/build_wars_ingest/wikitext.py` | Modify | Support only verified bounded skill templates and preserve unsupported-form diagnostics. |
| `scripts/data/build_wars_ingest/icons.py` | Modify | Resolve bounded skill icon metadata without fetching media bytes. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Add section-aware baseline classification and hard canonical output caps. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add EPIC-04 validators while preserving the shared QA wire format and gate logic. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate discovery, confirmed live fetch, exact offline replay, extraction, assembly, and QA. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Expose safe profile/stage/confirmation/snapshot-set options and bounded summaries. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Cover source-set scale, resolution, infoboxes, values, joins, progression, variants, determinism, QA, and CLI behavior. |
| `test/domain/skill-catalog.test.ts` | Create | Validate JSON contract, lookup, dependency, version, mode, and tooltip semantics. |
| `test/domain/contracts.test.ts` | Modify | Cover branded template IDs and authored unknown-ID compatibility. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Prove Python-generated skill JSON matches TypeScript source/manifest contracts. |
| `test/fixtures/foundation.ts` | Modify | Add minimized synthetic skill/catalog examples where shared fixtures need them. |
| `test/fixtures/data-ingestion/skills/` | Create | Hold small synthetic seed, page, redirect, infobox, progression, split, and imageinfo fixtures. |
| `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json` | Create | Provide the deterministic synthetic cross-language golden catalog. |
| `data/generated/epic-04/skills.catalog.json` | Create/allowlist | Runtime-eligible generated skill catalog. |
| `data/generated/epic-04/skills.catalog.manifest.json` | Create/allowlist | Catalog byte digest, input set, generator, count, and QA linkage. |
| `data/qa/epic-04/skills.catalog.qa.json` | Create/allowlist | Bounded machine-readable coverage, integrity, review, and release-gate evidence. |
| `.gitignore` | Modify narrowly | Allowlist only the three exact promoted files and keep all other run data denied. |
| `package.json` | Modify narrowly | Make offline fixture regeneration run registered profiles explicitly while keeping `verify` offline. |
| `README.md`, `scripts/data/README.md`, `data/**/README.md` | Modify | Document profile use, lifecycle, exact promotion, and runtime boundaries. |
| `compendium/data-ingestion-platform.md` | Modify | Record dynamic source-plan and snapshot-set extension rules. |
| `compendium/skills-catalog.md` | Create | Record durable catalog semantics, source authority, policy decisions, limitations, and downstream contracts. |
| `compendium/README.md` | Modify | Index the skill catalog decision record. |
| `work/tickets/04-skills/*.md` | Modify during execution | Record ticket state and verified closeout evidence. |
| `work/sprints/SPRINT-005.md` | Modify during execution | Track phase and Definition of Done state. |
| `work/sprints/ledger.tsv` | Modify during execution | Record sprint lifecycle consistently after technical gates pass. |

## Definition of Done

- [ ] BW-0401 through BW-0406 are linked to SPRINT-005 and completed in dependency order.
- [ ] EPIC-04, SPRINT-005, and the ledger are marked complete only after all technical, policy, and
      process gates pass.
- [ ] Existing EPIC-02 and EPIC-03 profiles, fixture outputs, promoted data, and offline verification
      remain compatible except for explicitly reviewed schema changes.
- [ ] `src/domain` remains JSON-compatible and framework-neutral with no React, DOM, browser storage,
      network, filesystem, Python, app, manifest, or QA imports.
- [ ] `TemplateSkillId` and `SkillId` are distinct types; v1 equality is explicit, not assumed from
      collection position or dense ranges.
- [ ] Unknown authored numeric skill IDs remain representable and lookup returns structured unknown
      results without coercion or destructive rewriting.
- [ ] Every accepted seed ID appears exactly once as a catalog record or a reviewed non-catalog
      disposition; numeric gaps are not synthesized into records.
- [ ] Duplicate IDs, ambiguous duplicate titles, unresolved canonical-page reuse, missing pages,
      disambiguation pages, and unexplained redirects are resolved before promotion.
- [ ] Requested, normalized, redirect, canonical page, page ID, revision, revision timestamp, and
      retrieval evidence are retained for every cataloged record.
- [ ] Live discovery fetches only the locked seed, writes an exact plan/digest, and stops before a
      large fetch.
- [ ] Detail/icon live fetch requires explicit network permission, the exact generated plan, and an
      exact confirmation digest; the CLI cannot raise profile hard ceilings.
- [ ] The accepted live run stays within all ID, page, media-title, batch, request-attempt,
      per-response, parser, aggregate-byte, catalog-byte, and QA-byte caps.
- [ ] A complete snapshot-set manifest enumerates and verifies every selected input; partial,
      mixed-profile, extra, missing, duplicated, or digest-mismatched sets cannot promote.
- [ ] Offline EPIC-04 replay requires the selected snapshot-set manifest and never scans the shared
      snapshot directory for implicit inputs.
- [ ] Production generation verifies the promoted EPIC-03 catalog, manifest digest, relevant section
      digests, and passing QA state before joining skill fields.
- [ ] Skill records reference EPIC-03 profession/attribute IDs without duplicating EPIC-03 catalog
      facts, and all non-null joins resolve.
- [ ] Null profession/attribute joins occur only for explicitly verified common, no-attribute, title,
      or special classifications.
- [ ] Every cataloged skill includes ID, template ID, canonical name, wiki URL, campaign, type,
      classification, mode facts, cost/timing states, description data, provenance, and icon ID where
      metadata is available.
- [ ] Energy, adrenaline, sacrifice, upkeep, overcast, activation, recharge, explicit zero,
      percentage, not-applicable, absent, and recognized special values are distinguishable and
      fixture-covered.
- [ ] Elite, common, title, special, PvE-only, PvP-only, shared, split, and no-attribute cases are
      representable without name-based UI inference.
- [ ] Acquisition metadata, guide prose, strategy, drop/vendor instructions, and community content
      are absent from schema v1 and generated output.
- [ ] Promoted descriptions contain only bounded safe tokens and approved plain-text projections; no
      MediaWiki HTML, full raw wikitext field, page body, or unrecognized markup is present.
- [ ] Every copied literal description claim is classified as publisher-owned material, has source
      and field provenance, and references a named review bound to the exact description digest.
- [ ] Unknown copied material is resolved or excluded; it is never accepted as public-release risk.
- [ ] Every source-indicated supported progression form has a complete normalized rank domain,
      finite per-rank values, correct value-slot references, provenance, and fixture coverage.
- [ ] Unsupported or malformed source-indicated progressions remain blocking rather than being
      guessed, flattened, or silently omitted.
- [ ] Title-rank dependencies are preserved as stable keys and value tables, while title ownership,
      allegiance, eligibility, and effective rank remain explicitly deferred to EPIC-15.
- [ ] Every PvE/PvP split has one valid normalized group, exactly one member per mode, reciprocal
      traversal, consistent flags, source evidence, and no self/duplicate/conflicting membership.
- [ ] Pure domain helpers can resolve known/unsupported/unknown IDs, select mode variants, and render
      supported tooltip text from supplied ranks without reading wikitext or calculating legality.
- [ ] Unknown mode, unknown ID, missing rank, unsupported domain, and unresolved title dependency
      return structured outcomes rather than arbitrary defaults.
- [ ] Every icon record is metadata-only with `cachedBytes: false`; no icon binary, thumbnail,
      screenshot, prior-art asset, or returned media URL is fetched into the repo/runtime bundle.
- [ ] Missing or ambiguous icon metadata produces a scoped QA finding and explicit disposition.
- [ ] Every source, field claim, dependency, disposition, series, variant, media record, review,
      manifest reference, and QA evidence reference resolves.
- [ ] Source references include page/file identity, revision identity, source revision timestamp,
      retrieval timestamp, material class, rights basis, and use decision where required.
- [ ] QA covers the complete source-set, resolution, join, infobox, costs, flags, descriptions,
      progression, variants, icons, provenance, freshness, schema, version, size, baseline, and
      integrity matrix defined in Architecture.
- [ ] Semantic section digests and `catalogVersion` change for every runtime-semantic mutation and
      remain stable for provenance-only timestamp changes.
- [ ] Input ordering, batch boundaries, concurrent completion, and filesystem order do not affect
      canonical bytes or stable finding IDs.
- [ ] Fixture generation runs all registered profiles explicitly, remains synthetic/offline, and is
      byte-identical across two clean fixed-clock runs.
- [ ] One complete bounded live refresh is reviewed, then replayed offline twice with byte-identical
      catalog, manifest, QA JSON, source ordering, section digests, and finding IDs.
- [ ] The first-baseline review binds seed/source-set/snapshot-set/dependency/description/catalog/
      artifact/QA digests to one named decision and release scope.
- [ ] `appConsumptionGate` and `publicReleaseGate` are `pass`; critical/error findings are closed and
      every warning is resolved, excluded, or accepted with bounded named evidence.
- [ ] Only the catalog, adjacent manifest, and bounded QA JSON exact paths are allowlisted.
- [ ] `git check-ignore -v` and `git status --short` prove raw snapshots, source plans, set manifests,
      candidates, summaries, logs, page bodies, media bytes, and unrelated generated files remain
      ignored or absent.
- [ ] The catalog alone is runtime-eligible; runtime source never imports its manifest, QA report,
      source snapshots, source plans, Python tooling, or wiki client.
- [ ] `npm run data:regenerate` and `npm run verify` pass without network access.
- [ ] Documentation, generated files, QA state, tickets, sprint, and ledger agree on IDs, paths,
      versions, modes, caps, review scope, limitations, and status.
- [ ] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Full source-set size or page shape exceeds planning assumptions | Medium | High | Run discovery/source-shape checkpoints first, require digest review, use hard ceilings and output caps, and block instead of raising limits ad hoc. |
| A changed seed causes thousands of unintended requests | Medium | High | Split discovery from fetch; require exact plan digest confirmation and compute a per-run budget from the reviewed plan. |
| Batch results lose requested-to-canonical association | Medium | High | Return explicit resolution records, preserve normalization/redirect evidence, and test response reordering and duplicate canonical targets. |
| Partial live runs look complete during offline replay | Medium | High | Use completion state, child/aggregate digests, exact counts, and reject any partial/extra/missing snapshot set. |
| Shared snapshot scanning mixes EPICs or revisions | Medium | High | Require one path-confined `SourceSnapshotSetManifest`; never infer EPIC-04 inputs from directory contents. |
| Source transclusion or wrapper behavior is not visible in raw page wikitext | Medium | High | Detect unsupported/lossy forms, capture only explicitly required dependencies, and add a bounded parse/expand fallback only through reviewed profile changes. |
| Description text violates source policy | High | High | Classify literal text as publisher-owned, use field claims, bind review to a section digest, exclude HTML/page bodies, and keep unknown copied material non-waivable. |
| Manual description review becomes an unbounded late blocker | High | High | Define token/policy rules in Phase 1, generate a deterministic corpus digest and exception list, surface changes early, and make review an explicit Phase 5 prerequisite. |
| Progression templates are interpreted incorrectly | Medium | High | Support only source-shape-proven forms, precompute explicit rank tables, compare token references/arity, and block unknown or malformed forms. |
| Monotonic validation rejects legitimate unusual skills | Medium | Medium | Store expected direction only where supported, fixture intentional non-monotonic examples, and validate source semantics rather than a universal monotonic rule. |
| PvE/PvP pages are duplicated or linked incorrectly | Medium | High | Use one normalized group, validate unique roles and reciprocal traversal, and block title-convention guesses or ambiguous canonical reuse. |
| EPIC-04 preempts EPIC-15 title rules | Medium | Medium | Preserve title dependency keys and value tables only; defer canonical title catalogs, allegiance, eligibility, and effective rank. |
| Profession/attribute facts drift from EPIC-03 | Medium | High | Verify dependency manifest/QA, consume exact section digests, use only catalog lookups, and force regeneration when required sections change. |
| Conflating catalog and template IDs harms later codecs | Medium | High | Add distinct branded types and explicit per-record mapping now while retaining numeric equality for v1. |
| Catalog/provenance volume becomes impractical | Medium | High | Deduplicate aggregate sources/claims, use compact references, measure deterministic section sizes, enforce hard caps, and fail instead of truncating. |
| QA volume hides systematic failures | Medium | High | Keep stable per-skill addressability, bounded shared evidence, code/category summaries, and hard report limits that fail visibly rather than drop findings. |
| Python and TypeScript wire contracts drift | Medium | High | Use one committed generated golden fixture, cross-language contract tests, and same-phase updates for every field change. |
| Profile refactoring regresses earlier fixture behavior | Medium | High | Register old profiles first, preserve their golden tests, and make all-profile fixture orchestration explicit and deterministic. |
| Semantic projection omits a runtime field | Medium | High | Define schema-owned projections in Phase 1 and add mutation tests for every runtime field and dependency section. |
| Provenance-only refresh causes unnecessary downstream invalidation | Medium | Medium | Exclude retrieval/review timing from semantic version while retaining a full artifact-byte digest and provenance diff classification. |
| Exact-path allowlisting leaks candidates or raw content | Low | High | Use parent re-ignore rules, exact file exceptions, representative `git check-ignore -v`, status inspection, and no force-add workflow. |
| Live source/network is unavailable | Medium | Medium | Complete fixture/offline implementation and leave production promotion explicitly blocked; do not substitute stale fixture data for release evidence. |
| Ignored raw snapshots limit future historical replay | Medium | Medium | Preserve revision IDs, per-input digests, source-set/snapshot-set digests, dependency facts, and document that replay requires retained local snapshots or a fresh bounded refresh. |
| Remote icon URLs create future privacy or reliability issues | Medium | Medium | Store metadata only; defer browser fetch/caching/attribution behavior to an explicit UI/media ticket. |

## Security Considerations

- Treat seed lines, titles, redirects, canonical titles, wikitext, templates, parameters, description
  text, file names, URLs, revision metadata, plans, manifests, baselines, catalogs, and QA evidence as
  untrusted input.
- Permit network access only in explicit live mode with `--allow-live-network`, the fixed Guild Wars
  Wiki API origin, a registered profile, and code-owned ceilings. Reject arbitrary endpoints, URLs,
  source-provided origins, and final redirects outside the configured API path.
- Require a path-confined, tool-generated source plan and exact confirmation digest before detail
  fetch. Recompute plan/seed digests immediately before use; do not trust editable title lists or a
  digest printed by another profile.
- Bound accepted IDs, detail pages, icon titles, title lengths, batch sizes, request attempts,
  retries, continuation, per-response bytes, aggregate bytes, per-page parser bytes, nested template
  depth/work, token counts, progression ranks/value slots, snapshot counts, output bytes, findings,
  and evidence excerpts.
- Parse wiki content as inert data. Never execute templates, Lua, HTML, JavaScript, CSS, links, shell
  snippets, or source-provided commands. Progression normalization uses reviewed local functions,
  never `eval`, dynamic imports, or expression execution.
- Store description tokens and tooltip output as plain text. Runtime UI must escape them and must not
  inject token text into `innerHTML` or treat source markup as trusted rendering instructions.
- Preserve safe path slugs, path confinement, symlink-escape checks where practical, atomic writes,
  collision protection, finite-number checks, and SHA-256 verification for every local artifact and
  manifest transition.
- Do not use source titles or IDs directly as filesystem paths. Do not allow a source-set manifest to
  reference files outside the configured root or to mix profile/output roots.
- Do not send credentials, cookies, tokens, repository data, local file contents, or machine-specific
  configuration to MediaWiki. The ingestion flow requires no secrets.
- Keep request logs to bounded sanitized metadata. Never log page bodies, full title sets, copied
  descriptions, response headers, environment values, local absolute paths in promoted artifacts,
  or unbounded QA excerpts.
- Never request the remote icon URL returned by `imageinfo`; the live client queries API metadata
  only. Do not cache, decode, transform, fingerprint, or bundle icon bytes.
- Verify the promoted EPIC-03 artifact digest before using it as a dependency; reject malformed,
  oversized, wrong-schema, non-finite, or failed-gate dependency data.
- Keep raw snapshots, source plans, snapshot-set manifests, candidates, text summaries, and review
  work ignored. Allowlist only outputs that pass integrity, provenance, review, and release gates.

## Dependencies

- `EPIC-00` / `SPRINT-001` for repository layout, domain boundaries, authored build IDs, synthetic
  fixtures, and canonical verification.
- `EPIC-01` / `SPRINT-002` for field provenance, source/material classification, description review,
  media restrictions, artifact retention, QA dispositions, and app/public release gates.
- `EPIC-02` / `SPRINT-003` for the fixed-origin MediaWiki client, verified snapshots,
  `mwparserfromhell`, skill-ID enumeration proof, metadata-only icons, canonical artifacts, QA, and
  fixture/offline/live command modes.
- `EPIC-03` / `SPRINT-004` for the exact promoted profession/attribute catalog, manifest digest,
  template crosswalk, section digests, collision-safe lookups, and passing QA state.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python `>=3.11`, and the pinned data environment installed by
  `npm run data:setup`.
- Guild Wars Wiki availability is required only for discover/full production refresh. Automated
  tests, fixture regeneration, build, and `npm run verify` remain offline.
- Named maintainer capacity is required to review the discovered source set, copied description
  scope, exceptional dispositions, warnings, first baseline, and exact-path promotion.
- Downstream consumers are EPIC-05 Template Compatibility, EPIC-06 Game Rule Engine, EPIC-08 Core
  Build Editor, EPIC-15 Title Tracks and PvE-only, EPIC-19 Guide Authoring, and EPIC-20 Search and
  Discovery.

## Open Questions

No open question blocks execution. The sprint adopts these defaults unless fresh verified source
shape forces a recorded change:

1. The EPIC-04 profile uses the hard ceilings named in Overview, then computes a smaller exact budget
   from the discovery plan. Raising a ceiling requires reviewed code/tests; it is not a CLI option.
2. The promoted description representation is safe tokens plus a plain-text search projection, not
   MediaWiki HTML or whole raw wikitext. Literal wording ships only after digest-bound publisher-text
   review and attribution planning.
3. Unsupported source-indicated progression or an ambiguous split blocks promotion. Raw structured
   evidence alone is not sufficient to claim tooltip completeness.
4. PvE/PvP relations use a normalized group with one member per mode. `mode: unknown` returns an
   explicit ambiguous result when variants differ.
5. Title-rank value tables and stable dependency keys are included, but EPIC-15 owns title identity,
   eligibility, allegiance, effective rank, and PvE-only limit rules.
6. Acquisition metadata is deferred completely. A later guide ticket must name a concrete user need,
   bounded sources, schema, provenance, and policy review before adding it.
7. The run-level source plan and snapshot-set manifest remain ignored. The promoted catalog records
   their digests/counts and revision-addressable source facts, while historical replay depends on
   locally retained ignored snapshots or a fresh bounded live refresh.
8. Missing icon metadata may be dispositioned as a warning because icons are optional remote
   metadata. Missing required description/progression data, unresolved EPIC-03 joins, source-set
   defects, and artifact integrity failures remain blocking.
9. The runtime catalog records only the relevant EPIC-03 semantic section digests. Unrelated
   allocation-rule or provenance-only changes do not invalidate the skill semantic version.
10. No implementation commit is created by this sprint; commit behavior remains outside the sprint
    executor.
