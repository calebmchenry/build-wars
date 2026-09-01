---
id: BW-0102
title: Provenance and Source Classification Contracts
epic: EPIC-01
status: done
priority: critical
depends_on:
  - BW-0101
planned_sprint: SPRINT-002
completed_sprint: SPRINT-002
created: 2026-09-01
updated: 2026-09-01
---

# BW-0102: Provenance and Source Classification Contracts

## Goal

Extend Build Wars domain contracts so generated records and future source snapshots can carry
traceable source, revision, classification, license, and manual-review metadata.

## Scope

- Update `src/domain/source.ts` with source classification, content provenance, source snapshot,
  generated artifact, manual override, and QA status contracts.
- Keep the contracts plain-data and JSON-compatible.
- Preserve compatibility with existing catalog/build/party/guide contracts unless a narrow,
  documented rename is required.
- Add synthetic type fixtures or tests that prove representative records can express wiki,
  image-info-only, community-link-only, manually reviewed, and ambiguous-source cases.

## Acceptance Criteria

- Generated records can distinguish factual IDs/metadata, copied source text, derived/normalized
  values, manual overrides, image/icon metadata, external community links, and ambiguous content.
- Source metadata can carry source URL, page id or title, revision id, source revision timestamp,
  retrieved timestamp, source name, source family, license/source classification, and reviewer notes.
- Icon handling supports metadata such as file title, URL, MIME type, size, timestamp, and sha1
  without requiring cached image files.
- Existing source provenance consumers still typecheck after the contract update.
- Tests or type fixtures cover JSON round-tripping for representative source-policy records.

## Verification

- `npm run typecheck`
- `npm run test:run`
- `npm run verify`
