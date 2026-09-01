---
id: BW-0202
title: Source Snapshot and Provenance Records
epic: EPIC-02
status: done
priority: critical
depends_on:
  - BW-0201
planned_sprint: SPRINT-003
completed_sprint: SPRINT-003
created: 2026-09-01
updated: 2026-09-01
---

# BW-0202: Source Snapshot and Provenance Records

## Goal

Define and implement the raw source snapshot format that preserves enough provenance for regeneration, review, and later source-policy audits.

## Scope

- Store raw captures under `data/source-snapshots/` while respecting the EPIC-01 commit/ignore policy.
- Record source name, source URL, page title, page id, revision id, source revision timestamp, retrieved timestamp, and content hash.
- Preserve raw wikitext separately from normalized/generated records.
- Keep snapshot filenames deterministic and safe for repeated runs.
- Support minimized committed fixtures without committing full raw source payloads by default.
- Document how snapshots are refreshed and when old snapshots may be deleted.

## Acceptance Criteria

- A fetched wiki page can be written to a snapshot record with full provenance.
- Snapshot output is deterministic aside from intentional retrieval timestamps.
- Raw snapshots remain ignored by Git unless explicitly added as minimized fixtures.
- Snapshot fixtures are small enough for stable tests and clearly labeled.
- Runtime app code does not import or read raw snapshots directly.

## Verification

- `npm run verify`
- Focused snapshot/provenance tests added by the implementation sprint
