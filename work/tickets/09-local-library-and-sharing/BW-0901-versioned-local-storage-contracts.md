---
id: BW-0901
title: Versioned Local Storage Contracts
epic: EPIC-09
status: done
priority: critical
depends_on:
  - EPIC-08
planned_sprint: SPRINT-010
completed_sprint: SPRINT-010
created: 2026-09-02
updated: 2026-09-02
---

# BW-0901: Versioned Local Storage Contracts

## Goal

Define the versioned local persistence contract for single-character saved builds and the working
draft.

## Scope

- Store Build Wars library data in browser `localStorage` under one namespaced key, likely
  `build-wars:v1`.
- Define a versioned plain-data envelope with schema version, saved builds, working draft,
  storage metadata, and last-known catalog/version facts.
- Preserve each saved record's semantic `Build`, EPIC-08 raw template overlay/source data, local ID,
  name, created/updated timestamps, tags, favorite state, and optional short notes.
- Add migration hooks and tests even if the first implementation has only one schema version.
- Handle unavailable storage, quota errors, malformed JSON, unsupported schema versions, and invalid
  records without crashing the editor.

## Out Of Scope

- IndexedDB, backend sync, accounts, hosted sharing, analytics, service workers, party records,
  guide records, equipment catalog completeness, and media/icon byte storage.

## Acceptance Criteria

- Local persistence uses one documented storage key and one versioned envelope.
- Corrupt or unsupported storage falls back to in-memory operation with a clear warning.
- Corrupt local payloads are not automatically deleted.
- Migration and parse/validation behavior are covered by tests.

## Verification

- `npm run verify`
