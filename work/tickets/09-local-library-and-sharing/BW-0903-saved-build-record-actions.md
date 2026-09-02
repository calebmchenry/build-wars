---
id: BW-0903
title: Saved Build Record Actions
epic: EPIC-09
status: ready
priority: critical
depends_on:
  - BW-0901
  - BW-0902
created: 2026-09-02
updated: 2026-09-02
---

# BW-0903: Saved Build Record Actions

## Goal

Add explicit user-controlled saved build operations for the local library.

## Scope

- Save the current draft as a new saved build with a local record ID.
- Update an existing saved build when the current draft is associated with that record.
- Save an associated draft as a new copy without overwriting the original record.
- Duplicate, delete, favorite, rename, tag, and edit optional short notes for saved builds.
- Allow duplicate build contents; saved-record identity is the local ID, not normalized build
  equality.
- Use template wrapper names only as draft-name suggestions, not identity.

## Out Of Scope

- Automatic deduplication, folders, cloud sync, shared ownership, guide notes, party records,
  equipment-specific metadata beyond the existing `Build` shape, and recommendation metadata.

## Acceptance Criteria

- Users explicitly choose update vs save-as-new.
- Duplicate builds are allowed.
- Delete is reversible through a clear undo path or protected by confirmation.
- Saved build metadata survives reload through the versioned local storage envelope.

## Verification

- `npm run verify`
