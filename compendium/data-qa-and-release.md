# Data QA And Release

This document defines the QA, manual review, and release gates future source-derived data must pass.
It is the operational companion to [Source policy](source-policy.md). Source family, material class,
provenance method, rights basis, source-use decision, media restrictions, and exception vocabulary
remain canonical in the source policy.

The TypeScript contracts in `src/domain/source.ts` make QA facts representable. They are not runtime
validation, legal review, source ingestion, or release approval.

## QA Finding Categories

Future `QaFinding` records should use stable codes and one of these categories:

| Category                          | When to use                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `missing-provenance`              | A generated artifact, record, field, media reference, or manual override lacks required provenance.                                           |
| `stale-or-unverified-revision`    | Revision identity, source revision timestamp, retrieval timestamp, or source-specific freshness check is missing or stale.                    |
| `ambiguous-source-or-rights`      | Source family, material class, rights basis, or use decision is unknown, mixed, contradictory, or not reviewed.                               |
| `copied-text-without-attribution` | Copied contributor or publisher text lacks required attribution or release-scope approval.                                                    |
| `invalid-source-reference`        | A claim references a missing source ID, invalid source table entry, or malformed source identity.                                             |
| `manual-override`                 | A reviewer-entered value changes, replaces, or supersedes generated source-derived data.                                                      |
| `missing-icon-metadata`           | A media reference lacks file title, canonical URL, MIME type, size, timestamp, remote hash, page/file identity, or provenance where required. |
| `generated-data-diff`             | Regeneration changes normalized data, source manifests, artifact manifests, or QA reports.                                                    |
| `artifact-integrity-mismatch`     | A digest is missing when required, does not match, or cannot be calculated for the artifact.                                                  |
| `schema-shape-error`              | The artifact does not match the expected generated shape or contract.                                                                         |
| `unexpected-source-family`        | A source family appears outside the approved profile for the artifact or release scope.                                                       |
| `other`                           | A source-policy or release concern does not fit another category.                                                                             |

## Finding Fields

Each finding needs:

- stable `code`
- `severity`
- scope: artifact path, record ID, field JSON Pointer, source IDs, or release scope as applicable
- evidence references, not unbounded copied source payloads
- disposition
- reviewer and reviewed timestamp when dispositioned by a person
- rationale for resolved, excluded, accepted-risk, or non-waivable status
- exception authority when a finding is accepted for a bounded scope
- expiration or re-review trigger when the decision should not be permanent
- related follow-up ticket IDs

## Severity

| Severity   | Meaning                                                                                       | Gate behavior                                                         |
| ---------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `critical` | Provenance, integrity, rights ambiguity, or schema failure makes use unsafe.                  | Blocks app consumption and public release until resolved or excluded. |
| `error`    | Required data or a policy rule is violated.                                                   | Blocks public release.                                                |
| `warning`  | Staleness risk, manual override, material diff, or incomplete optional metadata needs review. | Requires release-scope review.                                        |
| `info`     | Coverage or trace information.                                                                | Does not block alone.                                                 |

## Disposition

| Disposition     | Meaning                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| `open`          | Not yet resolved for the relevant scope.                                                    |
| `resolved`      | The underlying issue has been corrected and evidence is recorded.                           |
| `excluded`      | The affected artifact, record, or field is removed from the release scope.                  |
| `accepted-risk` | A named reviewer accepts a waivable issue for a bounded scope with rationale and follow-up. |
| `non-waivable`  | Public release cannot proceed unless the affected content is resolved or excluded.          |

Unknown copied material, digest mismatch, and unreadable artifacts are non-waivable for public
release. They must be resolved or excluded, not accepted as risk.

## Manual Review Checklists

Manual reviews must record reviewer, timestamp, scope, decision, rationale, evidence, related finding
IDs, follow-up ticket IDs, and expiration or re-review trigger when appropriate.

### Copied Descriptions

- Identify whether the field copies contributor text, publisher-owned game material, or both.
- Confirm source name, family, canonical URL, page or file identity, revision ID, source revision
  timestamp, retrieval timestamp, rights basis, and use decision.
- Confirm attribution and generated-data notices are planned for the release scope.
- Exclude unknown copied material unless a future explicit ticket approves the exact scope.

### Mixed-Source Wiki Content

- Classify each copied or generated field separately when one page mixes factual metadata,
  contributor prose, and publisher-owned material.
- Use field-level RFC 6901 JSON Pointers for claims.
- Record ambiguous fields as QA findings until resolved or excluded.

### Icon Metadata

- Confirm the artifact stores metadata only: file title, canonical URL, MIME type, dimensions when
  known, byte size when known, remote timestamp, remote SHA-1 when provided, page/file identity, and
  provenance.
- Confirm no icon bytes, screenshots, thumbnails, or generated media files are added.
- Require a future explicit ticket for any cached media or offline/PWA redistribution decision.

### Screenshots And Prior Art

- Keep screenshots and prior-art images development-only.
- Confirm no external image asset enters `src`, `public`, `data/generated`, tests, or release
  payloads in this sprint.
- Require a future ticket for attribution and runtime use before any screenshot ships.

### PvX/Fandom And Community Metadata

- Confirm retained content is metadata-and-link-only.
- Do not copy guide prose, ratings text, usage notes, recommendations, or page bodies.
- Record canonical URL, external title or ID, source family, retrieval facts, and reviewer notes when
  the metadata is used in generated artifacts.

### Generated Diffs

- Compare regenerated artifacts with the previous approved output.
- Confirm changes are deterministic and traced to source revision changes, transformation changes,
  or reviewed manual overrides.
- Require review for new copied text, changed rights basis, new source family, missing provenance,
  or material-class changes.

### Manual Overrides

- Record the superseded generated claim IDs, replacement value, reviewer, rationale, evidence, and
  follow-up tickets.
- Confirm the override does not hide copied source text or bypass a non-waivable finding.
- Add a re-review trigger when source data changes.

### Stale Source Revisions

- Missing revision ID, source revision timestamp, or retrieval timestamp is always a finding.
- Source-specific freshness thresholds are deferred to EPIC-02 profiles.
- Before release, reviewers must resolve stale critical/error findings or exclude the affected scope.

### Ambiguous Classifications

- Keep unknown family, unknown material class, ambiguous rights basis, and mixed rights basis
  review-required.
- Record evidence for any decision to narrow an ambiguous classification.
- Use explicit-ticket-required when public copied content, cached media, or broad generated artifacts
  need a new policy decision.

## App-Consumption Gate

The app may consume source-derived generated data only when:

- records or artifact manifests include provenance
- required source IDs resolve
- critical QA findings for the app scope are resolved or excluded
- non-waivable public-release findings are not hidden by runtime use
- generated artifacts are deterministic and have integrity metadata when required
- media handling is metadata-only unless a later ticket explicitly permits more

The app must not consume raw snapshots directly.

## Public Release Gate

Before public release, the release owner must verify:

- attribution display and source links for source-derived runtime data
- generated-data notices and license/source notes
- QA report dispositions for the exact release scope
- exception authority, rationale, timestamp, evidence, expiration or re-review trigger, and follow-up
  ticket IDs
- no copied PvX/Fandom/community prose, ratings text, usage notes, or page bodies are included unless
  a future explicit policy ticket allows them
- no cached icon binaries, screenshots, prior-art images, unreadable artifacts, digest mismatches, or
  unknown copied material are included

Public copied-content or cached-media exceptions require a future explicit ticket and named review.

## Release Closeout Record

A future release attestation should include:

- release scope and artifact paths
- generated artifact manifest paths
- QA report paths
- source-policy version or compendium revision
- reviewer names and timestamps
- open findings intentionally excluded from scope
- accepted-risk decisions with expiration or re-review trigger
- follow-up ticket IDs
