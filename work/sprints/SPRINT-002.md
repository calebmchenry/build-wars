---
id: SPRINT-002
title: Source Policy and QA
status: completed
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
started: 2026-09-01T20:36:27Z
completed: 2026-09-01T20:47:07Z
---

# Sprint 002: Source Policy and QA

## Overview

This sprint turns `EPIC-01 Source Policy and QA` into the policy and contract gate that later
source-derived content must pass before Build Wars imports, normalizes, commits, or publishes
substantial Guild Wars Wiki, PvX/Fandom, icon, screenshot, or generated catalog data.

The sprint delivers durable project policy, plain-data provenance contracts, artifact retention
rules, synthetic contract tests, QA/manual-review requirements, and release gates. It does not build
a fetcher, parser, normalizer, publish command, full QA engine, runtime attribution UI, media cache,
or any real source payload.

The main architectural decision is to replace the current singular generated-catalog `source` field
with aggregate `provenance` while the repo still has only synthetic fixtures. A generated record can
have multiple sources and different provenance per field; carrying both models into EPIC-02 would
create avoidable ambiguity. Source-policy rules are project policy, not legal advice, and ambiguous
or unknown cases remain review-required.

## Use Cases

1. **Classify source material**: A contributor can distinguish factual metadata, copied contributor
   text, publisher-owned game material, community content, media metadata, derived values, manual
   overrides, and unknown cases.
2. **Trace generated records**: Future ingestion can attach source identity, page/file identity,
   revision metadata, retrieval metadata, field-level claims, transformation notes, and review state
   to generated records or artifacts.
3. **Decide artifact retention**: A maintainer can tell whether raw snapshots, normalized JSON, QA
   reports, fixtures, icon metadata, or screenshots should be ignored, committed, or excluded.
4. **Review QA findings**: Future QA output can identify missing provenance, stale revisions,
   ambiguous rights/source status, copied text without attribution, manual overrides, icon metadata
   gaps, generated diffs, and artifact integrity failures.
5. **Gate app consumption and public release**: A release owner can verify attribution, source links,
   generated-data notices, license/source notes, QA dispositions, media restrictions, and exception
   authority before source-derived data ships.
6. **Maintain ticket-burn traceability**: EPIC-01, BW-0101 through BW-0105, `SPRINT-002`, and
   `work/sprints/ledger.tsv` stay linked and status-consistent through execution.

## Architecture

### Ownership

| Concern                                                                | Canonical Owner                     | Supporting Documents                 |
| ---------------------------------------------------------------------- | ----------------------------------- | ------------------------------------ |
| Source reuse, classification, attribution, media, and exception policy | `compendium/source-policy.md`       | `README.md`, data READMEs            |
| QA findings, manual review, release gates, and exception records       | `compendium/data-qa-and-release.md` | `data/qa/README.md`                  |
| Artifact lifecycle and Git retention behavior                          | `data/*/README.md`, `.gitignore`    | `compendium/source-policy.md`        |
| Future pipeline responsibilities                                       | `scripts/data/README.md`            | `src/domain/source.ts`, data READMEs |
| Machine-readable source/QA shapes                                      | `src/domain/source.ts`              | Synthetic fixtures and tests         |

The compendium documents are normative for policy. TypeScript contracts make facts representable;
they do not decide legality, validate untrusted input, or approve release.

### Source Vocabulary

`src/domain/source.ts` should keep source concepts orthogonal:

- `SourceFamily`: where the material came from, such as `guild-wars-wiki`, `pvx-fandom`,
  `game-client`, `community-tool`, `manual`, `development-reference`, `other`, or `unknown`.
- `SourceMaterialClass`: what the material is, such as factual metadata, contributor text,
  game-publisher material, community content, media metadata, development reference, or unknown.
- `ProvenanceMethod`: what Build Wars did with the material, such as copied, normalized, derived,
  linked-only, manual override, or excluded.
- `SourceRightsBasis`: source-declared or reviewer-recorded rights/ownership basis, including
  unknown, ambiguous, mixed, publisher-owned, contributor-license-declared, public-domain-like, or
  community-unknown.
- `SourceUseDecision`: project decision for a bounded scope, such as allowed, review-required,
  prohibited, excluded, or explicit-ticket-required.
- `ManualReview`: reviewer, timestamp, scope, decision, rationale, evidence, related finding IDs,
  and follow-up ticket IDs.

Guild Wars Wiki material can mix contributor text and ArenaNet/NCSoft-owned game content on the
same page, so classification must work at field level. PvX/Fandom and community sources remain
metadata-and-link-only; guide prose, ratings text, usage notes, and page bodies are not copied in
this sprint.

### Provenance Contracts

All new contracts remain readonly, framework-neutral, and JSON-compatible. Dates are RFC 3339
strings, URLs are provenance references rather than trusted fetch targets, artifact paths are
normalized repository-relative paths, and missing optional facts use `null` where the existing domain
style needs stable keys.

Execution should define and export:

- `SOURCE_POLICY_SCHEMA_VERSION`
- `SourceReference`
- `LicenseMetadata`
- `ProvenanceClaim`
- `RecordProvenance`
- `ManualOverride`
- `ManualReview`
- `RemoteMediaMetadata`
- `ArtifactDigest`
- `SourceSnapshotManifest`
- `GeneratedArtifactManifest`
- `QaFinding`
- `QaReport`

`CatalogRecord.source` should become `CatalogRecord.provenance: RecordProvenance | null`. Existing
catalog fixtures and tests must migrate in the same phase. User-authored `Build`, `PartyBuild`, and
`Guide` roots should not automatically gain source provenance; imported or generated content owns
provenance, while authored documents continue to carry schema and catalog-version metadata.

Field claims use RFC 6901 JSON Pointer:

- `""` means the whole record.
- Object keys and array indices are encoded as JSON Pointers.
- Pointer escaping for `~` and `/` must be documented.
- TypeScript does not prove pointer validity; tests should cover representative valid, invalid,
  overlapping, nested, array-index, dangling-source, and multi-source cases.

The default contract can keep record-local source references for self-contained generated records.
The policy should also permit a future artifact-level source table or sidecar manifest if EPIC-02
needs deduplication to control generated JSON size.

### Artifact Lifecycle

```text
external source revision
  -> SourceSnapshotManifest + ignored raw payload
  -> GeneratedArtifactManifest + normalized records
  -> QaReport
  -> release attestation or excluded artifact
```

| Artifact Or Content           | Local Generation           | Commit Default                        | Runtime/Public Default         | Exception Gate                                                              |
| ----------------------------- | -------------------------- | ------------------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| Raw source payloads           | Allowed after EPIC-02      | Ignored                               | Never consumed directly        | Minimized fixture, explicit ticket, provenance, review                      |
| Snapshot manifests            | Allowed with snapshots     | Ignored by default                    | Internal lineage               | Explicit ticket for stable minimized evidence                               |
| Deterministic normalized JSON | Allowed                    | Ignored by default                    | Eligible after QA/release gate | Exact-path allowlist, app/test need, deterministic regeneration, provenance |
| QA reports                    | Allowed                    | Ignored by default                    | Not runtime data               | Explicit ticket may promote stable summary docs                             |
| Synthetic fixtures            | Allowed                    | Committed                             | Tests only                     | Must be non-authoritative                                                   |
| External regression fixtures  | Deferred                   | Prohibited by default                 | Tests only                     | Explicit ticket, minimal excerpt, provenance, classification, review        |
| Icon/file metadata            | Allowed                    | May accompany approved generated data | Metadata/link only             | Required remote metadata and provenance                                     |
| Icon binaries                 | Not allowed in this sprint | Prohibited                            | Prohibited                     | Future offline/PWA policy decision                                          |
| PvX/Fandom/community pages    | Metadata/link only         | Only approved metadata                | Link-only                      | No copied prose, ratings text, usage notes, or bodies                       |
| Screenshots/prior art         | Development reference only | No new source assets                  | Not runtime assets             | Future explicit approval and attribution decision                           |

Broad deny-by-default ignore rules remain the norm. Approved generated files must be allowlisted by
exact path, including any required parent-directory unignore rules; `git add -f` is not an approval
mechanism.

### QA And Review

QA findings should use stable codes, artifact/record/field scope, evidence, severity, and
disposition.

| Severity   | Meaning                                                                              | Gate Behavior                             |
| ---------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| `critical` | Provenance, integrity, rights ambiguity, or schema failure makes use unsafe          | Blocks app consumption and public release |
| `error`    | Required data or policy rule is violated                                             | Blocks public release                     |
| `warning`  | Suspected staleness, manual override, material diff, or incomplete optional metadata | Requires review for release scope         |
| `info`     | Coverage or trace information                                                        | Does not block alone                      |

Unknown copied material, digest mismatch, and unreadable artifacts are non-waivable for public
release: resolve them or exclude the affected content. Other exceptions require named maintainer or
reviewer approval, bounded scope, timestamp, rationale, evidence, expiration or re-review trigger
when appropriate, and follow-up ticket IDs. Public copied-content or cached-media exceptions require
a future explicit ticket.

Freshness thresholds are deferred to source-specific EPIC-02 profiles. Missing revision identity,
missing source revision timestamp, or missing retrieval timestamp is always a QA finding.

## Implementation

### Phase 1: Traceability And Execution Start (~10% of effort)

**Files:**

- `work/tickets/01-source-policy-and-qa/EPIC.md`
- `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md`
- `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md`
- `work/tickets/01-source-policy-and-qa/BW-0105-release-checklist-closeout-records.md`
- `work/sprints/SPRINT-002.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [x] Confirm `EPIC-00` is done and `SPRINT-001` is completed.
- [x] Add or update the `SPRINT-002` ledger row as execution starts.
- [x] Move `SPRINT-002`, `EPIC-01`, and the active BW ticket to `in-progress` before implementation
      changes.
- [x] Preserve the ticket dependency order: `BW-0101 -> BW-0102 -> BW-0103 -> BW-0104 -> BW-0105`.
- [x] Preserve unrelated working-tree changes and do not create a commit.

### Phase 2: BW-0101 Source Policy (~20% of effort)

**Files:**

- `compendium/source-policy.md`
- `compendium/README.md`
- `README.md`
- `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md`

**Tasks:**

- [x] Create `compendium/source-policy.md` as the canonical reuse, attribution, media, and exception
      policy.
- [x] Define allowed, review-required, prohibited, and explicit-ticket-required actions for every
      source/content class named by EPIC-01.
- [x] Require attribution fields for copied or source-derived runtime data: source name, source
      family, canonical URL, page/file identity when available, revision ID, source revision
      timestamp, retrieval timestamp, material class, rights basis, use decision, and notes.
- [x] State that factual metadata remains provenance-bearing and copied text does not become factual
      just because it appears in a structured page or game UI.
- [x] State that Guild Wars Wiki pages may need field-level classification because one page can mix
      contributor text and publisher-owned game material.
- [x] Keep PvX/Fandom/community sources metadata-and-link-only and prohibit copied guide prose,
      ratings text, usage notes, and page bodies.
- [x] Keep icon binaries and screenshots out of repo/runtime assets in this sprint; allow only
      metadata/link records where policy permits.
- [x] Preserve the "project policy, not legal advice" caveat and require ambiguous cases to remain
      review-required.
- [x] Link the policy from `compendium/README.md` and summarize the source-policy gate in
      `README.md`.

**Verification:**

- Manual review against EPIC-01 policy defaults.
- `npm run format:check`
- `npm run lint`

### Phase 3: BW-0102 Provenance Contract Migration (~25% of effort)

**Files:**

- `src/domain/source.ts`
- `src/domain/catalog.ts`
- `src/domain/index.ts`
- `test/fixtures/foundation.ts`
- `test/fixtures/source-policy.ts`
- `test/domain/contracts.test.ts`
- `test/domain/source-policy.test.ts`
- `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md`

**Tasks:**

- [x] Extend `src/domain/source.ts` with the source vocabulary, provenance, media, artifact, review,
      and QA contracts described in Architecture.
- [x] Add `SOURCE_POLICY_SCHEMA_VERSION` and keep all exported contracts plain JSON-compatible data.
- [x] Migrate generated catalog records from `source` to `provenance` and update every current
      consumer and synthetic fixture.
- [x] Audit the repo for stale domain `source` property usage after migration.
- [x] Use RFC 6901 JSON Pointer for field claims and document whole-record scope plus pointer
      escaping.
- [x] Add synthetic fixtures for copied wiki-like text, normalized factual metadata, metadata-only
      remote media, community-link-only content, ambiguous material, manual overrides, artifact
      lineage, and QA reports.
- [x] Add tests for JSON round-tripping, public exports, source ID resolution, dangling source IDs,
      nested and array field paths, overlapping whole-record/field claims, media metadata without
      bytes, manual override supersession, finding dispositions, and artifact lineage preservation.
- [x] Keep runtime validation and source-policy enforcement out of scope; document EPIC-02 as the
      owner of ingestion-boundary validation.

**Verification:**

- `npm run typecheck`
- `npm run test:run`

### Phase 4: BW-0103 Artifact Retention And Commit Policy (~15% of effort)

**Files:**

- `data/README.md`
- `data/source-snapshots/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `scripts/data/README.md`
- `.gitignore`
- `compendium/source-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md`

**Tasks:**

- [x] Update data README files with raw snapshot, snapshot manifest, normalized generated data, QA
      report, fixture, icon metadata, and screenshot retention rules.
- [x] Document that raw snapshots and QA reports stay ignored by default.
- [x] Document that normalized JSON stays ignored unless an explicit ticket approves exact paths,
      deterministic regeneration, app/test need, provenance completeness, and QA closeout.
- [x] Document minimized external fixture requirements and keep synthetic fixtures clearly
      non-authoritative.
- [x] Update `scripts/data/README.md` so future `fetch -> snapshot -> normalize -> validate ->
publish` stages name their inputs, outputs, contracts, and gates.
- [x] Audit `.gitignore` against the retention matrix, including parent-directory unignore behavior,
      and modify it only if documentation and behavior disagree.
- [x] Confirm no real external payload, icon binary, screenshot, generated catalog, or generated QA
      report is added by this sprint.

**Verification:**

- Manual review of data documentation and `.gitignore` alignment.
- `npm run format:check`
- `npm run lint`

### Phase 5: BW-0104 QA, Manual Review, And Release Gates (~20% of effort)

**Files:**

- `compendium/data-qa-and-release.md`
- `compendium/README.md`
- `data/qa/README.md`
- `src/domain/source.ts`
- `test/fixtures/source-policy.ts`
- `test/domain/source-policy.test.ts`
- `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md`

**Tasks:**

- [x] Create `compendium/data-qa-and-release.md` as the operational QA, review, and release gate
      companion to `compendium/source-policy.md`.
- [x] Keep definitions and source-use rules in `source-policy.md`; make the QA/release document
      reference those definitions instead of duplicating them.
- [x] Define QA categories for missing provenance, stale/unverified revision, ambiguous source or
      rights status, copied text without attribution, invalid source reference, manual override,
      missing icon metadata, generated-data diff, artifact integrity mismatch, schema/shape error,
      unexpected source family, and other.
- [x] Define finding severity, scope, evidence, disposition, reviewer metadata, exception authority,
      expiration or re-review trigger, and related follow-up ticket fields.
- [x] Define manual review checklists for copied descriptions, mixed-source wiki content, icon
      metadata, screenshots, PvX/Fandom metadata, generated diffs, manual overrides, stale source
      revisions, and ambiguous classifications.
- [x] Define public release and app-consumption gates, including non-waivable public-release cases.
- [x] Add or update synthetic tests for open, resolved, excluded, accepted-risk, and non-waivable
      finding examples without building a full validator.
- [x] Link the QA/release document from `compendium/README.md` and `data/qa/README.md`.

**Verification:**

- Manual review against BW-0104 acceptance criteria.
- `npm run typecheck`
- `npm run test:run`

### Phase 6: BW-0105 Verification And Closeout (~10% of effort)

**Files:**

- `README.md`
- `compendium/source-policy.md`
- `compendium/data-qa-and-release.md`
- `work/tickets/01-source-policy-and-qa/EPIC.md`
- `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md`
- `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md`
- `work/tickets/01-source-policy-and-qa/BW-0105-release-checklist-closeout-records.md`
- `work/sprints/SPRINT-002.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [x] Verify terminology and links are consistent across README, compendium docs, data READMEs,
      script README, contracts, tests, tickets, sprint, and ledger.
- [x] Run `npm run verify`.
- [x] If `npm run verify` ever stops including ticket-burn tests, run
      `python3 -m unittest scripts/test_ticket_burn.py` directly.
- [x] Review the Git diff for real external payloads, binaries, screenshots, generated reports,
      secrets, local absolute paths, unrelated app features, and unexpected dependencies.
- [x] Mark BW-0101 through BW-0105 done only after their acceptance criteria pass.
- [x] Mark EPIC-01 done only after the whole sprint Definition of Done passes.
- [x] Mark SPRINT-002 and the ledger row completed only after all actionable checklist items are
      complete or explicitly resolved.
- [x] Do not create a commit.

## Files Summary

| File                                                                                  | Action                 | Purpose                                                                   |
| ------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `compendium/source-policy.md`                                                         | Create                 | Canonical source reuse, attribution, media, and exception policy          |
| `compendium/data-qa-and-release.md`                                                   | Create                 | QA findings, manual review, release gates, and exception records          |
| `compendium/README.md`                                                                | Modify                 | Link policy and QA/release docs                                           |
| `README.md`                                                                           | Modify                 | Summarize source-policy gate for contributors                             |
| `src/domain/source.ts`                                                                | Modify                 | Add provenance, classification, media, artifact, review, and QA contracts |
| `src/domain/catalog.ts`                                                               | Modify                 | Migrate generated catalog records from `source` to `provenance`           |
| `src/domain/index.ts`                                                                 | Modify                 | Export the source-policy contract surface                                 |
| `test/fixtures/foundation.ts`                                                         | Modify                 | Migrate existing synthetic fixtures to `provenance`                       |
| `test/fixtures/source-policy.ts`                                                      | Create                 | Synthetic representative source-policy fixtures                           |
| `test/domain/contracts.test.ts`                                                       | Modify                 | Keep foundation tests passing after provenance migration                  |
| `test/domain/source-policy.test.ts`                                                   | Create                 | Verify provenance, artifact, media, QA, and JSON round-trip examples      |
| `data/README.md`                                                                      | Modify                 | Summarize data artifact lifecycle                                         |
| `data/source-snapshots/README.md`                                                     | Modify                 | Define raw snapshot and manifest policy                                   |
| `data/generated/README.md`                                                            | Modify                 | Define normalized generated-data commit and regeneration gates            |
| `data/qa/README.md`                                                                   | Modify                 | Define QA report retention and release promotion rules                    |
| `scripts/data/README.md`                                                              | Modify                 | Bind future pipeline stages to contracts and gates                        |
| `.gitignore`                                                                          | Verify/modify narrowly | Keep raw/generated/QA artifacts denied by default                         |
| `work/tickets/01-source-policy-and-qa/EPIC.md`                                        | Modify                 | Track sprint linkage and final epic status                                |
| `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md`     | Modify                 | Track source-policy ticket execution                                      |
| `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md` | Modify                 | Track contract migration ticket execution                                 |
| `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md`    | Modify                 | Track artifact retention ticket execution                                 |
| `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md`         | Modify                 | Track QA/manual review ticket execution                                   |
| `work/tickets/01-source-policy-and-qa/BW-0105-release-checklist-closeout-records.md`  | Modify                 | Track release gate and closeout ticket execution                          |
| `work/sprints/SPRINT-002.md`                                                          | Modify                 | Maintain sprint execution state                                           |
| `work/sprints/ledger.tsv`                                                             | Modify                 | Track sprint status                                                       |

## Definition of Done

- [x] Canonical source policy exists and distinguishes source family, material class, provenance
      method, rights basis, project use decision, and review state.
- [x] The policy covers factual metadata, copied contributor text, publisher-owned game material,
      derived values, manual overrides, icon metadata, screenshots, community links, generated
      records, and unknown/ambiguous cases.
- [x] Guild Wars Wiki mixed-content cases require field-level classification where needed.
- [x] PvX/Fandom/community content is metadata-and-link-only; copied prose, ratings text, usage
      notes, and page bodies are absent.
- [x] Icon handling is metadata-only and no icon binary is added.
- [x] Screenshots and prior-art images remain development-only and no new external image asset is
      added.
- [x] Source/provenance contracts are public, readonly, framework-neutral, and JSON-compatible.
- [x] `CatalogRecord.provenance` is the only generated catalog provenance field; the old singular
      `source` field is removed from catalog records and current fixtures.
- [x] Field-level provenance uses RFC 6901 JSON Pointer with documented whole-record scope and
      escaping.
- [x] Synthetic tests cover multi-source, mixed-field, copied, normalized, derived, manual override,
      ambiguous, media-metadata-only, artifact-lineage, and QA disposition cases.
- [x] Tests cover dangling source IDs, nested/array field paths, overlapping whole-record and field
      claims, manual override supersession, and JSON round-tripping.
- [x] TypeScript contracts are not presented as runtime validation or legal/release approval.
- [x] Artifact retention rules cover raw snapshots, snapshot manifests, normalized JSON, QA reports,
      synthetic fixtures, external regression fixtures, icon metadata, icon binaries, PvX/Fandom
      metadata, and screenshots.
- [x] Raw/generated/QA directories remain ignored by default, policy README files remain trackable,
      and any future committed generated file requires exact-path allowlisting and explicit ticket
      approval.
- [x] QA findings include stable code, severity, artifact/record/field scope, evidence, disposition,
      reviewer metadata, and follow-up fields.
- [x] Critical/error/warning/info severity semantics and app-consumption/public-release gates are
      documented.
- [x] Unknown copied material, digest mismatch, and unreadable artifacts are non-waivable for public
      release and must be resolved or excluded.
- [x] Exception authority, scope, rationale, timestamp, expiration or re-review trigger, and follow-up
      ticket requirements are documented.
- [x] Freshness thresholds are deferred to EPIC-02 source-specific profiles, while missing revision
      or retrieval metadata always produces a finding.
- [x] `npm run typecheck` succeeds.
- [x] `npm run test:run` succeeds.
- [x] `npm run verify` succeeds.
- [x] Manual review confirms compendium docs, domain vocabulary, data READMEs, script README,
      `.gitignore`, tests, tickets, sprint, and ledger describe the same lifecycle.
- [x] The repository diff contains no real external source payload, icon binary, screenshot, generated
      catalog, generated QA report, secret, new runtime service, live fetcher, parser, validator,
      media cache, runtime attribution UI, deployment, or unrelated app feature.
- [x] BW-0101 through BW-0105 are done only after their acceptance criteria pass.
- [x] EPIC-01 is done only after the full sprint Definition of Done passes.
- [x] `work/sprints/ledger.tsv` contains SPRINT-002 with the final execution status.
- [x] The final execution copy of `work/sprints/SPRINT-002.md` has no unresolved actionable checklist
      items when execution reports completion.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                                             | Likelihood | Impact | Mitigation                                                                                                          |
| ---------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Policy vocabulary implies unsupported legal conclusions          | Medium     | High   | Separate source family, material class, rights basis, use decision, and review state; keep unknown/ambiguous values |
| Carrying both `source` and `provenance` creates dual truth       | Medium     | High   | Make one narrow migration now while only synthetic fixtures exist                                                   |
| Provenance contracts overfit MediaWiki or EPIC-02 details        | Medium     | Medium | Keep contracts source-neutral and stop short of fetch/parse/validate implementation                                 |
| Field-level provenance bloats generated JSON                     | Medium     | Medium | Permit future artifact-level source tables or sidecars while defining record claims now                             |
| TypeScript examples are mistaken for validation                  | Medium     | Medium | Document runtime validation as EPIC-02 work and keep tests representational                                         |
| QA reports are ignored but release decisions need audit evidence | Medium     | High   | Define stable release attestation fields and allow explicit promoted summaries by ticket                            |
| Accepted-risk becomes a blanket bypass                           | Medium     | High   | Define non-waivable cases and bounded exception authority                                                           |
| `.gitignore` exact-path exceptions are implemented incorrectly   | Medium     | Medium | Audit parent-directory unignore behavior and forbid broad directory allowlists                                      |
| Freshness rules are either too strict or too lax                 | Medium     | Medium | Require revision/retrieval facts now; defer thresholds to source-specific profiles                                  |
| Synthetic fixtures are mistaken for real Guild Wars correctness  | Medium     | Medium | Label fixtures non-authoritative and prohibit real payloads in this sprint                                          |
| Policy docs, data READMEs, and contracts drift                   | Medium     | Medium | Assign canonical owners and include cross-document review in closeout                                               |
| Public copied-content or media decisions need legal judgment     | Low        | High   | Keep copied community prose/media prohibited by default and require a future explicit ticket/review path            |

## Security Considerations

- Treat future source pages, API responses, copied text, URLs, filenames, QA evidence, and generated
  artifacts as untrusted data.
- Do not render imported text as raw HTML, evaluate source content, or use source values as
  filesystem paths or shell fragments.
- Future source URLs should be validated HTTP(S) references without embedded credentials. Credentials,
  cookies, API tokens, and authorization headers must not be stored in snapshots or manifests.
- Artifact paths should be repository-relative and reject absolute paths, traversal, and symlink
  escapes before future tooling writes files.
- Use SHA-256 for local artifact integrity. Preserve source-provided SHA-1, such as MediaWiki
  imageinfo hashes, only as remote metadata.
- Keep raw snapshots, generated QA evidence, and reviewer notes out of browser bundles unless a later
  release policy explicitly approves a minimized public artifact.
- No secrets, network clients, remote services, executable fixtures, media binaries, or new runtime
  endpoints are added in this sprint.

## Dependencies

- `EPIC-00` and `SPRINT-001` are complete.
- BW ticket order is `BW-0101 -> BW-0102 -> BW-0103 -> BW-0104 -> BW-0105`.
- Existing Node.js, npm, TypeScript, Vitest, ESLint, Prettier, and Python tooling are sufficient.
- `npm run verify` is the canonical validation command.
- EPIC-02 and later source-derived content epics depend on the policy and contracts completed here.

## Open Questions

No open question blocks execution. The following are intentionally deferred with conservative
defaults:

1. Source-specific freshness thresholds belong to EPIC-02 freshness profiles.
2. Runtime attribution UI placement belongs to the first UI sprint that ships source-derived data,
   but it must satisfy the release checklist created here.
3. Committed normalized catalogs require a future explicit allowlist ticket with deterministic
   regeneration, provenance, QA, and size review.
4. Icon caching and redistribution require a future offline/PWA policy decision.
5. Copied PvX/Fandom/community prose remains prohibited until a future policy ticket establishes an
   affirmative source-specific basis and review path.
