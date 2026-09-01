---
id: BW-0303
title: Profession and Attribute Extractors
epic: EPIC-03
status: done
priority: critical
depends_on:
  - BW-0301
  - BW-0302
planned_sprint: SPRINT-004
completed_sprint: SPRINT-004
created: 2026-09-01
updated: 2026-09-01
---

# BW-0303: Profession and Attribute Extractors

## Goal

Add snapshot-driven ingestion for the ten professions, their attributes, ownership, primary-only restrictions, campaign availability, and metadata-only icon records.

## Scope

- Extend `scripts/data/build_wars_ingest` with profession/attribute extraction modules that consume verified snapshots.
- Use Guild Wars Wiki profession and attribute source pages plus individual linked pages only where needed for missing structured facts.
- Normalize profession names, abbreviations, campaign availability, primary attributes, secondary attributes, and icon file metadata.
- Normalize attribute names, profession ownership, primary-only flags, template IDs, and source links.
- Use metadata-only icon handling; do not download, cache, commit, or bundle icon image bytes.
- Retain every candidate source row as a normalized record, evidence-backed exclusion, or scoped QA diagnostic.

## Acceptance Criteria

- The generated catalog contains exactly ten playable professions.
- Every generated profession references a valid primary attribute ID.
- Every generated attribute references its owning profession or an explicit common/no-profession owner if such an exception is ever discovered.
- Primary attributes are flagged primary-only and unavailable through secondary professions.
- Icon metadata records have `cachedBytes: false` and source IDs that resolve to provenance entries.
- Missing or ambiguous icon metadata is nullable with visible QA disposition unless it violates media policy or artifact integrity.
- Extractors consume snapshots and shared parser/icon helpers; they do not introduce a one-off scraper or browser runtime fetch path.

## Verification

- `npm run verify`
- Offline Python extractor tests for all ten professions, linked attributes, abbreviations, campaign groups, primary-only flags, icon metadata, redirects, and ambiguous/missing source facts
