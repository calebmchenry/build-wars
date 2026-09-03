---
id: BW-1705
title: Party Export and Sharing
epic: EPIC-17
status: ready
priority: high
depends_on:
  - BW-1702
  - BW-1703
  - BW-1704
created: 2026-09-03
updated: 2026-09-03
---

# BW-1705: Party Export and Sharing

## Goal

Support practical local-first party sharing without external team-template codecs.

## Scope

- Export/import native Build Wars party data for backup and recovery.
- Copy individual skill template codes for every party member that can be represented by the
  existing skill-template workflow.
- Preserve party labels, roles, ordering, notes, and unresolved state in native JSON.
- Define size limits and fallback behavior for share URLs or clipboard output.
- Keep external team-template formats explicitly deferred.

## Out Of Scope

- paw-ned2, hosted sharing, short links, backend sync, account permissions, public publishing, and
  guide authoring.

## Acceptance Criteria

- Users can recover a party from native exported data.
- Users can copy a practical multi-code text representation for supported member skill bars.
- Unsupported equipment or unresolved data is not silently dropped from native export.
- External codec absence is documented and non-blocking.

## Verification

- `npm run test:run -- src/app`
- Focused tests for native export/import, multi-code copy, limits, and unresolved data preservation
