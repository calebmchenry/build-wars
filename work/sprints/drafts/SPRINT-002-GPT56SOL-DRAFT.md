---
id: SPRINT-002
title: Source Policy and QA
status: planned
source_target: BACKLOG
source_epic: EPIC-01
source_epic_path: work/tickets/01-source-policy-and-qa/EPIC.md
tickets:
  - BW-0101
  - BW-0102
  - BW-0103
  - BW-0104
  - BW-0105
created: 2026-09-01
---

# Sprint 002: Source Policy and QA

## Overview

Turn `EPIC-01` into the policy and contract gate that all later source-derived data must pass. This sprint defines what Build Wars may copy, normalize, retain, commit, and publish; extends the domain with source, provenance, artifact, review, and QA contracts; and supplies executable synthetic tests plus human release checklists.

The sprint favors conservative, reversible defaults:

- Factual identifiers and metadata may be normalized when their origin remains traceable.
- Copied text is distinct from factual, derived, and manually overridden values at field level.
- Guild Wars Wiki material with mixed or uncertain ownership is review-required before runtime or public-release use.
- PvX/Fandom and other community sources remain metadata-and-link-only. Guide prose, ratings text, usage notes, and page bodies are not copied.
- Icon file metadata may be retained, but icon binaries are not downloaded or committed.
- Screenshots and prior-art images remain development references, not runtime assets.
- Raw snapshots and QA output remain ignored by default. Small deterministic normalized JSON may be committed only through an explicit, provenance-complete exception.
- Source-policy rules are project policy, not legal advice. Uncertainty is recorded and escalated rather than converted into an unsupported legal conclusion.

The principal architectural change is a deliberate early migration from singular `CatalogRecord.source` metadata to aggregate `CatalogRecord.provenance`. A generated value can have multiple inputs and different origins by field; keeping the singular field alongside a new model would create two competing truths. The repository has no real catalog payload yet, so this is the least costly point to make the narrow breaking change and update all current consumers.

At completion, `EPIC-02` can implement fetch, snapshot, normalize, validate, and publish stages without reopening baseline questions about source identity, field lineage, artifact retention, QA severity, manual review, or public-release gating.

Out of scope:

- Live HTTP requests, MediaWiki clients, parsers, normalizers, or a complete QA engine.
- Real Guild Wars Wiki, PvX/Fandom, icon, screenshot, or generated catalog payloads.
- Runtime attribution UI, icon caching, offline/PWA support, or public deployment.
- Legal conclusions about licenses or ownership.
- Gameplay validation, template compatibility, build editing, or persistence.
- New runtime or development dependencies unless an implementation detail proves unavoidable and is separately justified.
- Creating a commit; version-control operations remain the responsibility of the outer runner.

## Use Cases

### UC-1: Classify a source-derived value

An ingestion author can label a value as copied, normalized, derived, manually overridden, or link-only; identify whether the material is factual metadata, contributor-authored text, publisher-owned game material, community content, media metadata, or unknown; and connect it to one or more source references.

### UC-2: Reconstruct a record's lineage

A maintainer can start from a generated record and determine its source family, canonical page or file URL, page/file identity, source revision, revision timestamp, retrieval timestamp, license metadata, transformation notes, and any manual intervention. Field-level claims use JSON Pointer so the representation remains independent of TypeScript property names and usable in emitted JSON.

### UC-3: Capture source and generated artifact identity

`EPIC-02` can describe an immutable source snapshot and a deterministic generated artifact with stable IDs, repository-relative paths, media types, byte sizes, SHA-256 digests, timestamps, generator identity, and input artifact references. MediaWiki SHA-1 values remain remote media metadata and are not treated as local integrity hashes.

### UC-4: Make a retention decision

A contributor can determine whether a snapshot, normalized artifact, QA report, test fixture, icon reference, or screenshot should be ignored, committed, or published. Exceptions are explicit, allowlisted, minimized, provenance-complete, and tied to a ticket rather than enabled by broad `.gitignore` rules.

### UC-5: Emit and resolve QA findings

Future data tooling can write a JSON-compatible QA report with stable finding codes, severity, artifact/record/field scope, evidence, and disposition. A reviewer can resolve, exclude, or formally accept a finding with reviewer, timestamp, and rationale metadata without editing generated source lineage.

### UC-6: Review ambiguous or manual content

A reviewer has checklists for copied descriptions, mixed-ownership wiki material, manual overrides, icon metadata, screenshots, community links, and generated diffs. The record shows who reviewed what, when, the decision, and why.

### UC-7: Gate app consumption and public release

A release owner can verify that included data is provenance-complete, critical findings are closed, required attribution and notices are planned or present, disallowed media/content is absent, and accepted exceptions are documented. Ambiguous copied content cannot pass merely through a generic risk acceptance; it must be classified and attributed or excluded.

### UC-8: Trace sprint execution

A maintainer can follow `SPRINT-002` to `EPIC-01` and `BW-0101` through `BW-0105`, see dependency and completion state in frontmatter and `work/sprints/ledger.tsv`, and reproduce verification with `npm run verify`.

## Architecture

### Policy ownership and precedence

Each policy concern has one canonical owner to prevent drift:

| Concern | Canonical location | Other documents do |
| --- | --- | --- |
| Source reuse, classification, attribution, and media rules | `compendium/source-policy.md` | Link to and summarize the policy |
| QA severity, manual review, exceptions, and release gates | `compendium/data-qa-and-release.md` | State directory-specific operational behavior |
| Artifact retention and commit behavior | `data/*/README.md` and `.gitignore` | Reference the canonical policy rationale |
| Pipeline responsibilities | `scripts/data/README.md` | Map future stages to contracts and artifact locations |
| Machine-readable shapes | `src/domain/source.ts` | Express policy facts without making legal or release decisions |

The compendium is normative for project policy. Domain types make required facts representable, QA reports detect violations, and release checklists decide whether an artifact may advance. TypeScript types alone do not prove source legitimacy, freshness, or release eligibility.

### Source and provenance contracts

All contracts remain readonly, framework-neutral, and JSON-compatible. Dates are RFC 3339 strings, artifact paths are normalized repository-relative paths, URLs are absolute HTTP(S) URLs, and absence is represented with `null` where the existing domain convention requires a stable field. No contract contains `Date`, `Map`, `Set`, functions, classes, DOM objects, or executable content.

`src/domain/source.ts` will export a versioned policy surface with these roles:

- `SourceFamily`: stable project vocabulary for `guild-wars-wiki`, `pvx-fandom`, `arena-net`, `community`, `manual`, and `other`. This describes origin, not ownership.
- `SourceClassification`: `factual-metadata`, `contributor-text`, `game-publisher-material`, `community-content`, `media-metadata`, or `unknown`.
- `ProvenanceMethod`: `copied`, `normalized`, `derived`, `manual-override`, or `linked-only`.
- `LicenseMetadata`: a source-declared label/identifier, URL, and notes. Values are descriptive and may be unknown; the contract does not infer legal permission.
- `SourceProvenance`: an atomic source reference containing a stable local source ID, source name and family, canonical URL, page/file ID and title, source revision ID, source revision timestamp, retrieval timestamp, classification, license metadata, and notes.
- `ProvenanceClaim`: a claim about one generated value. It contains an RFC 6901 JSON Pointer target (`""` means the whole record), a provenance method, one or more source IDs when source-derived, transformation notes for normalized/derived values, and manual-override metadata when applicable.
- `RecordProvenance`: the self-contained set of source references and field/record claims for one generated record, plus manual-review status. Every claim source ID must resolve within the same record provenance object so extracted records do not depend on an external join to remain attributable.
- `ManualOverride`: author, timestamp, required rationale, and the source claim or prior value it supersedes. An override is lineage, not approval.
- `ManualReview`: status, reviewer, review timestamp, decision, notes, and related finding IDs. A review is approval workflow, not source lineage.
- `RemoteMediaMetadata`: file title, canonical/download URL, MIME type, byte size, source timestamp, and source-provided SHA-1. It contains no local file path or binary payload.

The model intentionally keeps three axes separate: source family says where material came from, classification says what kind of material it is, and provenance method says what Build Wars did to it. Collapsing them into one enum would make cases such as a normalized factual value from a mixed wiki page impossible to describe accurately.

`CatalogRecord.source` becomes `CatalogRecord.provenance: RecordProvenance | null`. The same narrow rename applies to any singular generated-catalog reference that otherwise implies one upstream source. Current synthetic fixtures and tests are migrated in the same phase. User-authored `Build`, `PartyBuild`, and `Guide` roots are not automatically given source provenance; provenance belongs to imported or source-derived content, not ordinary local authorship.

### Artifact lineage

Source snapshots, generated output, and QA reports form an append-only lineage graph:

```text
external source revision
  -> SourceSnapshotManifest + ignored raw payload
  -> GeneratedArtifactManifest + normalized records
  -> QaReport
  -> reviewed release candidate or excluded artifact
```

The contract surface includes:

- `ArtifactDigest`: stable artifact ID, normalized repository-relative path, media type, byte size, and SHA-256 digest.
- `SourceSnapshotManifest`: schema version, snapshot ID, retrieval metadata, source provenance, and raw payload digest. Snapshots are immutable; a new fetch creates a new snapshot ID.
- `GeneratedArtifactManifest`: schema version, artifact digest, generation timestamp, generator name/version, ordered input artifact IDs/digests, and policy schema version. Output identity never relies on timestamps alone.
- `QaReport`: schema version, report ID, generation timestamp, evaluated artifact ID/digest, freshness policy/profile used, and findings.

Manifests describe identity and lineage, not Git policy. Whether an artifact is ignored, committed, or published is governed by the retention matrix and release record. This avoids baking mutable repository state into otherwise reproducible artifact metadata.

### QA and review model

`QaFinding` provides:

- A stable finding ID and extensible string code.
- A baseline category: missing provenance, stale/unverified revision, ambiguous classification, copied text without attribution, invalid source reference, manual override, missing icon metadata, generated-data diff, artifact-integrity mismatch, schema/shape error, or other.
- Severity: `critical`, `error`, `warning`, or `info`.
- Artifact, record, and optional JSON Pointer field scope.
- A concise message and structured or textual evidence that remains plain JSON data.
- A nullable disposition: `resolved`, `excluded`, or `accepted-risk`, with actor, timestamp, and rationale.

Severity semantics are stable across later epics:

| Severity | Meaning | Gate behavior |
| --- | --- | --- |
| `critical` | Provenance, integrity, rights ambiguity, or schema failure makes use unsafe | Blocks app consumption and release until resolved, excluded, or validly accepted |
| `error` | Required data or policy rule is violated | Blocks release; may remain in local QA output while being fixed |
| `warning` | Suspected staleness, manual override, material diff, or incomplete optional metadata | Requires review and recorded disposition for release scope |
| `info` | Trace or coverage information | Does not block by itself |

Generic acceptance cannot waive copied text with unknown classification/attribution, a digest mismatch, or a structurally unreadable artifact. Those findings must be resolved or the affected content excluded. Other critical exceptions require a named reviewer, timestamp, bounded release scope, rationale, and follow-up ticket. The policy records this distinction explicitly so an `accepted-risk` value cannot become an unrestricted bypass.

Freshness has no project-wide day count. `EPIC-02` defines per-source/per-artifact freshness profiles and records the applied profile in each report. Missing revision or retrieval timestamps are always findings; age thresholds are operational configuration, not source-policy truth.

### Retention and publication matrix

| Artifact/content | Local generation | Commit default | Runtime/publication default | Exception gate |
| --- | --- | --- | --- | --- |
| Raw source payloads | Allowed in ignored `data/source-snapshots/` after `EPIC-02` | Ignored | Never consumed directly | Deliberately minimized fixture, explicit ticket, provenance, review |
| Snapshot manifests | Allowed with raw snapshot | Ignored with snapshot by default | Internal lineage only | Stable minimized manifest may accompany an approved fixture |
| Deterministic normalized JSON | Allowed in `data/generated/` | Ignored | Eligible only after QA/release gate | Explicit allowlist, app/test need, deterministic regeneration, provenance |
| QA reports | Allowed in `data/qa/` | Ignored | Not runtime data | Explicit ticket promotes a minimized stable report to documentation |
| Synthetic fixtures | Allowed | Committed | Tests only | Must be clearly non-authoritative |
| Minimized external regression fixtures | Deferred | Not committed by default | Tests only | Explicit ticket, minimum excerpt, provenance, classification, review |
| Icon/file metadata | Allowed | May accompany approved normalized data | Links/metadata only | Must contain required remote metadata and provenance |
| Icon binaries | Not in this sprint | Prohibited | Prohibited | Revisit only for an offline/PWA requirement and new policy review |
| PvX/Fandom/community metadata and links | Allowed | Only in approved normalized data | Link-only | No copied prose, ratings text, usage notes, or bodies |
| Screenshots/prior art | Existing references may remain | No new source assets in this sprint | Development reference only | Runtime use needs explicit approval and attribution decision |

Broad ignore rules remain deny-by-default. Approved committed generated files must be allowlisted by exact path; contributors must not unignore an entire artifact directory or rely on `git add -f` as the documented workflow.

### Cross-phase consistency

| Later epic/work | Contract established here |
| --- | --- |
| `EPIC-02 Data Ingestion Platform` | Every stage reads/writes versioned manifests; normalization emits record provenance; validation emits `QaReport`; publish enforces dispositions |
| `EPIC-03` and `EPIC-04` catalog content | Catalog records use aggregate provenance and field claims without changing source vocabulary |
| `EPIC-05 Template Compatibility` | User-supplied codes remain untrusted inputs but are not mislabeled as external catalog sources |
| `EPIC-07 Visual Prior Art` | Development references stay distinct from approved runtime media assets |
| `EPIC-09 Local Library and Sharing` | User-authored document provenance is not conflated with catalog provenance; exports can retain catalog version references |
| `EPIC-18 Community Build Knowledge` | PvX/community import remains metadata-and-link-only unless a later explicit policy supersedes it |
| `EPIC-19 Guide Authoring` | Locally authored prose remains distinct from copied community prose and its release restrictions |
| Offline/PWA work | Icon caching cannot begin without a new artifact, attribution, cache invalidation, and redistribution decision |

## Implementation

### Execution bookkeeping

- [ ] Confirm `EPIC-00` is done and `SPRINT-001` is completed before changing implementation files.
- [ ] Add `SPRINT-002` to `work/sprints/ledger.tsv` as `in-progress` and move the sprint, `EPIC-01`, and the active ticket to `in-progress` before execution.
- [ ] Preserve the dependency chain: `BW-0101`; then `BW-0102` and `BW-0103`; then `BW-0104`; finally `BW-0105`.
- [ ] Preserve unrelated working-tree changes and do not create a commit.

### Phase 1 — BW-0101: Source reuse and attribution policy

- [ ] Create `compendium/source-policy.md` as the canonical policy for source families, classification, reuse, attribution, copied text, derived values, manual overrides, media, community content, ambiguous cases, and policy exceptions.
- [ ] Include a decision matrix that distinguishes allowed, review-required, and prohibited uses.
- [ ] Require source name, canonical URL, page/file identity when available, revision ID, source revision timestamp, retrieval timestamp, classification, and license/source notes for copied or source-derived runtime data.
- [ ] State that factual metadata is lower-risk but still provenance-bearing; copied text does not become factual merely because it appears in an infobox or game UI.
- [ ] State that Guild Wars Wiki pages can contain mixed classifications and therefore may need field-level claims rather than one classification for the whole page.
- [ ] Make PvX/Fandom/community sources metadata-and-link-only and prohibit copied guide prose, ratings text, usage notes, and large page bodies.
- [ ] Keep icon binaries and screenshots out of runtime assets; document the metadata-only icon exception and development-reference-only screenshot policy.
- [ ] Define the review-required path for unknown or ambiguous source/license metadata without presenting the policy as legal advice.
- [ ] Link the policy from `compendium/README.md` and summarize the current source-policy gate in the root `README.md`.

Phase acceptance:

- Every content class named by `EPIC-01` has one unambiguous default action.
- Attribution requirements are concrete enough to map directly to domain fields.
- No policy text claims that source presence or a wiki license automatically grants rights to all material on a mixed page.

### Phase 2 — BW-0102: Provenance and classification contracts

- [ ] Extend `src/domain/source.ts` with the source family, classification, provenance method, license, record/field provenance, manual override, manual review, remote media, artifact manifest, QA finding, and QA report contracts described in Architecture.
- [ ] Add a source-policy schema version and keep all exported values JSON-compatible plain data.
- [ ] Use RFC 6901 JSON Pointer for field targets and define `""` as whole-record scope.
- [ ] Replace `CatalogRecord.source` with `CatalogRecord.provenance`; update `CatalogVersionRef` or equivalent generated-catalog metadata to avoid retaining a competing singular-source field.
- [ ] Export the complete supported contract surface from `src/domain/index.ts`.
- [ ] Add `test/fixtures/source-policy.ts` containing only synthetic examples for a wiki-derived copied field, a normalized factual field, metadata-only remote media, a manual override, an ambiguous source, artifact lineage, and a QA report.
- [ ] Add `test/domain/source-policy.test.ts` covering JSON round-trip, resolvable source IDs, whole-record and field JSON Pointers, required manual-override rationale, media metadata without local bytes, artifact input/digest preservation, and finding dispositions.
- [ ] Update foundation fixtures/tests and all existing domain consumers for the intentional `source` to `provenance` migration.
- [ ] Keep validation assertions in tests and future QA policy; do not introduce a runtime validator or encode legal/release judgments as TypeScript type guarantees.

Phase acceptance:

- `npm run typecheck` and `npm run test:run` pass after the migration.
- A single synthetic record can attribute separate fields to different source classifications and methods.
- Snapshot, generated artifact, and QA report examples retain their lineage through JSON serialization.
- No old and new provenance fields coexist on catalog records.

### Phase 3 — BW-0103: Artifact retention and commit policy

- [ ] Update `data/README.md` with the artifact lifecycle, retention matrix, exception process, and rule that browser code never imports raw snapshots or QA reports.
- [ ] Update `data/source-snapshots/README.md` with immutable snapshot/manifest pairing, ignored default, provenance requirements, and minimized-fixture exception.
- [ ] Update `data/generated/README.md` with determinism, lineage, QA, exact-path allowlisting, and app/test-need requirements for committed normalized JSON.
- [ ] Update `data/qa/README.md` with report ownership, ignored default, severity/disposition expectations, and the explicit stable-documentation promotion path.
- [ ] Update `scripts/data/README.md` so the future `fetch -> snapshot -> normalize -> validate -> publish` stages name their inputs, outputs, and policy gates.
- [ ] Audit `.gitignore` against the retention matrix. Preserve broad deny-by-default rules and tracked policy files; add only comments or exact approved-file exceptions needed by the policy.
- [ ] Document that `git add -f` is not the approval mechanism for generated artifacts.
- [ ] Add no real source snapshot, generated catalog, external regression fixture, icon binary, or screenshot.

Phase acceptance:

- Each artifact class has a documented owner, location, default Git state, publication state, and exception authority.
- `.gitignore` behavior and data documentation agree, including README visibility.
- `EPIC-02` can implement the five pipeline stages without choosing a different artifact lifecycle.

### Phase 4 — BW-0104: QA reports and manual review

- [ ] Create `compendium/data-qa-and-release.md` with finding categories, severity semantics, disposition rules, non-waivable cases, reviewer metadata, and public-release checklist.
- [ ] Define manual review checklists for copied descriptions, ambiguous mixed-source content, manual overrides, remote icon metadata, screenshots, PvX/Fandom/community links, generated diffs, and stale/unverified revisions.
- [ ] Require each review to identify scope, reviewer, timestamp, decision, evidence/rationale, and related finding/follow-up ticket IDs.
- [ ] Define the minimum QA report summary: artifact identity, policy/freshness profile, finding counts by severity and disposition, unresolved gate status, and generation timestamp.
- [ ] Define app-consumption and release gates. All critical/error findings must be closed; warnings require review for the release scope; copied unknown material, digest mismatches, and unreadable artifacts cannot be generically accepted.
- [ ] Ensure synthetic tests cover open, resolved, excluded, and accepted-risk dispositions without implying that a typed report has passed policy.
- [ ] Do not implement source fetching, content parsing, diff generation, or a full validation command.

Phase acceptance:

- A future validator has stable report fields and severity meanings.
- A human reviewer can execute each checklist without inventing missing evidence fields.
- The release gate distinguishes artifact quality, source-policy compliance, and documented risk acceptance.

### Phase 5 — BW-0105: Release gate, verification, and closeout

- [ ] Verify the release checklist covers attribution display, source links, generated-data notices, license/source notes, ambiguous-source review, critical findings, accepted exceptions, media restrictions, and artifact/catalog versions.
- [ ] Verify `compendium/README.md`, root `README.md`, data READMEs, script README, contracts, tests, tickets, sprint, and ledger use consistent terminology and links.
- [ ] Run `npm run verify` and confirm it includes the ticket-burn unit tests.
- [ ] Verify ignored raw/generated/QA paths remain ignored and all policy README files remain trackable.
- [ ] Verify the Git diff contains no real external payload, icon binary, new screenshot, generated report, secret, credential, or unrelated application feature.
- [ ] Mark each `BW-010x` ticket done only after its acceptance criteria and phase acceptance pass.
- [ ] Mark `EPIC-01`, `SPRINT-002`, and ledger row completed only after the entire Definition of Done passes; leave no actionable sprint checkbox unchecked.
- [ ] Do not create a commit.

## Files Summary

| Path | Action | Purpose |
| --- | --- | --- |
| `compendium/source-policy.md` | Create | Canonical reuse, classification, attribution, media, and exception policy |
| `compendium/data-qa-and-release.md` | Create | QA severity, manual review, exception, app-consumption, and release gates |
| `compendium/README.md` | Modify | Index the source-policy and QA/release documents |
| `README.md` | Modify | Summarize the source-policy gate and point to canonical guidance |
| `src/domain/source.ts` | Modify | Add source, provenance, media, artifact, review, and QA contracts |
| `src/domain/catalog.ts` | Modify | Replace singular catalog source metadata with aggregate provenance |
| `src/domain/index.ts` | Modify | Export the supported policy contract surface |
| `test/fixtures/foundation.ts` | Modify | Migrate synthetic catalog fixtures from `source` to `provenance` |
| `test/fixtures/source-policy.ts` | Create | Synthetic representative provenance, artifact, review, media, and QA records |
| `test/domain/contracts.test.ts` | Modify | Preserve foundation contract coverage after the provenance migration |
| `test/domain/source-policy.test.ts` | Create | Verify policy-contract composition and JSON round-tripping |
| `data/README.md` | Modify | Define artifact lifecycle and retention overview |
| `data/source-snapshots/README.md` | Modify | Define raw snapshot, manifest, ignore, and fixture-exception rules |
| `data/generated/README.md` | Modify | Define deterministic normalized-data commit and publication gates |
| `data/qa/README.md` | Modify | Define QA report lifecycle, severity, disposition, and promotion rules |
| `scripts/data/README.md` | Modify | Bind future pipeline stages to contracts, locations, and gates |
| `.gitignore` | Verify/modify narrowly | Preserve deny-by-default artifact rules and exact-path exception strategy |
| `work/tickets/01-source-policy-and-qa/EPIC.md` | Modify | Track sprint linkage and final epic status |
| `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md` | Modify | Track source-policy execution and acceptance |
| `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md` | Modify | Track contract migration and tests |
| `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md` | Modify | Track artifact lifecycle documentation |
| `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md` | Modify | Track QA/report/review definitions |
| `work/tickets/01-source-policy-and-qa/BW-0105-release-checklist-closeout-records.md` | Modify | Track release gate and closeout |
| `work/sprints/SPRINT-002.md` | Modify during execution | Maintain the executable sprint checklist and final state |
| `work/sprints/ledger.tsv` | Modify | Track `SPRINT-002` execution and completion state |

## Definition of Done

### Policy and lifecycle

- [ ] One canonical source policy distinguishes factual metadata, contributor text, publisher-owned material, community content, copied values, normalized/derived values, manual overrides, external links, media metadata, screenshots, and unknown cases.
- [ ] Guild Wars Wiki mixed-content cases require field-level classification and review where ownership/source status is ambiguous.
- [ ] PvX/Fandom/community content is metadata-and-link-only; prohibited prose and page bodies are absent.
- [ ] Icon metadata requirements are defined and no icon binary is added.
- [ ] Screenshots/prior art remain development-only and no new external image is added.
- [ ] Raw snapshots, generated output, QA reports, fixtures, and media each have explicit retention, commit, and publication defaults plus a bounded exception path.
- [ ] Raw/generated/QA directories remain ignored by default, policy files remain trackable, and no entire artifact directory is broadly allowlisted.

### Contracts and tests

- [ ] Source family, classification, provenance method, license, record/field provenance, manual override/review, remote media, artifact manifest, QA finding, and QA report contracts are public.
- [ ] `CatalogRecord.provenance` is the only catalog provenance field; the old singular `source` field is removed and all existing consumers typecheck.
- [ ] Contracts are readonly, framework-neutral, and JSON-compatible.
- [ ] Field claims use RFC 6901 JSON Pointer and resolve source IDs within their record provenance.
- [ ] Artifacts retain repository-relative path, media type, byte size, SHA-256 identity, timestamps, generator identity, and input lineage where applicable.
- [ ] Synthetic examples cover copied, normalized, derived/manual, media-metadata-only, ambiguous, artifact-lineage, and QA disposition cases.
- [ ] Tests prove JSON round-trip behavior and do not claim runtime policy validation.
- [ ] No live client, parser, normalizer, runtime schema library, or complete QA engine is added.

### QA, review, and release

- [ ] QA categories and `critical`/`error`/`warning`/`info` semantics are documented and represented.
- [ ] Findings identify artifact, record, and optional field scope plus evidence and disposition.
- [ ] Review/acceptance records require actor, timestamp, decision, rationale, scope, and related finding/follow-up identifiers.
- [ ] Unknown copied material, digest mismatch, and unreadable artifacts cannot pass by generic risk acceptance.
- [ ] Freshness profiles are explicitly deferred to source-specific `EPIC-02` configuration while missing revision/retrieval metadata always produces a finding.
- [ ] Manual review checklists cover every edge case listed by `EPIC-01`.
- [ ] The public-release checklist covers attribution display, source links, generated-data notice, license/source notes, ambiguous cases, exceptions, artifact version, and media restrictions.
- [ ] Future app consumption and public release are blocked until required QA dispositions and human checks are complete.

### Verification and traceability

- [ ] `npm run verify` passes.
- [ ] Manual policy review confirms the compendium, domain vocabulary, data READMEs, and script pipeline describe the same lifecycle.
- [ ] The repository contains only synthetic source-policy fixtures and no real external payload.
- [ ] `BW-0101` through `BW-0105` satisfy their acceptance criteria and are marked done.
- [ ] `EPIC-01` is marked done only after all sprint criteria pass.
- [ ] `SPRINT-002` and its ledger row are completed consistently with no actionable unchecked item.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Policy vocabulary encodes unsupported legal conclusions | False confidence could permit material that should be reviewed | Keep source family, content classification, and source-declared license metadata separate; label the policy non-legal and preserve `unknown` |
| One record-level source hides mixed or multi-source fields | Attribution becomes inaccurate and later ingestion needs a schema break | Migrate now to self-contained aggregate provenance with JSON Pointer field claims |
| Keeping both `source` and `provenance` creates divergent truth | Producers and consumers choose different fields | Make one narrow breaking migration before real catalog data exists and update every current consumer atomically |
| Provenance becomes so verbose that producers omit it | Generated data is technically expressive but operationally untraceable | Require reusable source references within each record, stable source IDs, concise claims, and QA for missing coverage |
| Artifact manifests overfit MediaWiki | Later sources require incompatible contracts | Keep artifact identity generic; isolate page/revision and MediaWiki media fields in source-specific metadata |
| Commit exceptions slowly become the default | Repository size, licensing, and freshness drift become hard to reverse | Keep directories ignored, require exact-path allowlists and explicit tickets, and forbid `git add -f` as policy |
| Accepted-risk becomes a universal bypass | Critical provenance or integrity failures ship | Define non-waivable categories and require bounded scope, reviewer, rationale, and follow-up for other critical acceptance |
| A fixed freshness window is wrong across source types | Useful stable data fails while volatile data passes | Record revision/retrieval facts now; let `EPIC-02` apply named per-source freshness profiles |
| Documentation and types drift | Tooling emits valid TypeScript shapes that violate policy | Give each concern one canonical owner, reuse vocabulary, add synthetic contract tests, and include cross-document review in closeout |
| Synthetic fixtures imply real-content approval | Later epics treat tests as a source-use precedent | Label fixtures non-authoritative and prohibit real payloads in this sprint |
| Policy work expands into ingestion implementation | Scope grows before contracts are reviewed | Stop at contracts, synthetic examples, docs, and checklists; leave fetch/parse/validate behavior to `EPIC-02` |

## Security

- Treat source pages, API responses, URLs, filenames, revision metadata, copied text, and QA evidence as untrusted data even when the source is well known.
- Do not render imported text as raw HTML, evaluate source content, follow embedded scripts, or use source values as filesystem paths or shell fragments.
- Restrict future network source URLs to validated HTTP(S). Reject credential-bearing URLs and do not persist cookies, authorization headers, API tokens, or request secrets in snapshots or manifests.
- Normalize artifact paths as repository-relative paths and reject absolute paths, path traversal, and symlink escapes before future tooling writes files.
- Use SHA-256 for local artifact integrity. Preserve MediaWiki/source SHA-1 only as remote metadata; do not treat it as a security guarantee.
- Bound future fetch sizes, parser depth, record counts, and decompression before ingesting untrusted payloads. Exact limits belong to `EPIC-02`.
- Keep raw snapshots and QA evidence out of browser bundles. Normalized data must cross validation and release gates before app consumption.
- Do not add secrets, external fetches, new runtime endpoints, analytics, or executable fixtures in this sprint.
- Review generated diffs for accidental personal data, credentials, local absolute paths, and unexpected content before promoting any artifact.

## Dependencies

### Internal

- `EPIC-00` and `SPRINT-001` must be complete; this sprint relies on their single-package layout, `src/domain` boundary, data directories, synthetic fixture convention, and `npm run verify`.
- Ticket order is `BW-0101` -> (`BW-0102` and `BW-0103`) -> `BW-0104` -> `BW-0105`.
- `EPIC-02` and every source-derived content epic depend on the policy and contracts completed here.

### Tooling

- Existing TypeScript, Vitest, ESLint, Prettier, Node.js, npm, and Python tooling are sufficient.
- No network access, external source account, license-scanning service, or new package is required.
- Verification uses the existing `npm run verify` contract.

### Policy inputs

- `work/tickets/01-source-policy-and-qa/EPIC.md` and `BW-0101` through `BW-0105` are the normative scope inputs.
- `compendium/decisions/0001-project-foundation.md`, existing data READMEs, and `scripts/data/README.md` define repository boundaries that this sprint refines rather than replaces.

## Open Questions

No open question blocks execution. These decisions remain deliberately deferred with restrictive defaults:

1. **Freshness thresholds:** `EPIC-02` selects named per-source/per-artifact profiles and records the applied profile. Until then, missing revision or retrieval metadata is a finding and no universal age threshold is assumed.
2. **Runtime attribution presentation:** The first UI that ships source-derived content chooses the exact placement, but it must provide discoverable attribution, source links, notices, and license notes required by the release checklist.
3. **Committed normalized catalogs:** The first app/test need proposes exact files and an explicit allowlist. Generated data remains ignored until that ticket demonstrates determinism, provenance, QA, size suitability, and regeneration instructions.
4. **Icon caching and redistribution:** Metadata-only remains the rule until offline/PWA work has a concrete requirement and revisits storage, attribution, cache invalidation, security, and source terms.
5. **Copied community content:** PvX/Fandom/community prose remains prohibited until a separate policy ticket establishes an affirmative source-specific basis, attribution plan, update model, and release review.