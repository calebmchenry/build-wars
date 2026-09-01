---
id: BW-0305
title: Generated Catalog QA and Exact-Path Promotion
epic: EPIC-03
status: done
priority: critical
depends_on:
  - BW-0302
  - BW-0303
  - BW-0304
planned_sprint: SPRINT-004
completed_sprint: SPRINT-004
created: 2026-09-01
updated: 2026-09-01
---

# BW-0305: Generated Catalog QA and Exact-Path Promotion

## Goal

Produce the EPIC-03 generated catalog artifact, QA report, and explicit commit allowlist needed for runtime selectors and future rule validation.

## Scope

- Generate canonical JSON under an exact `data/generated/epic-03/` path approved by this ticket.
- Generate a matching `GeneratedArtifactManifest` and `QaReport`.
- Add exact `.gitignore` allowlist entries for the approved generated catalog, manifest, and bounded machine-readable QA report.
- Keep raw source snapshots and live refresh outputs ignored.
- Gate app consumption on provenance completeness, resolved source IDs, deterministic regeneration, and no blocking QA findings.
- Record first-promotion baseline semantics when no prior approved EPIC-03 catalog exists.
- Record manual review decisions for all primary-effect summaries and any field that could be treated as copied publisher/contributor text.

## Acceptance Criteria

- The promoted catalog has complete provenance and source IDs for all generated records.
- QA detects duplicate profession IDs, duplicate attribute IDs, missing primary attributes, wrong profession ownership, unresolved icon metadata, missing quest metadata, stale revision facts, copied text risk, schema-shape errors, and artifact digest mismatches.
- Fixture mode remains synthetic and offline; live refresh remains explicit and bounded.
- A bounded live refresh followed by offline replay is completed before production promotion; `npm run verify` remains offline.
- Exact committed paths are documented in the ticket and data docs; no `git add -f` workflow is required.
- The runtime app can import or later consume the approved generated catalog without reading raw snapshots or QA reports directly.

## Verification

- `npm run verify`
- Run EPIC-03 fixture regeneration twice and prove byte-identical output under a fixed clock
- Run a bounded manual live refresh only if source credentials/network conditions are available during implementation
