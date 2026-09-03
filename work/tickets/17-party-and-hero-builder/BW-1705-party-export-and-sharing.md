---
id: BW-1705
title: Party Export and Sharing
epic: EPIC-17
status: done
priority: high
planned_sprint: SPRINT-018
completed_sprint: SPRINT-018
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

## Closeout Evidence

- Implemented in `SPRINT-018`.
- Added native `build-wars-party-transfer` JSON with preview/apply, dirty-guarded import, byte
  bounds, dangerous-key rejection, deterministic serialization, and full-fidelity party snapshot
  preservation.
- Extended build-set transfer, backup/restore, saved-record duplication, library summaries/search,
  selected-member share warnings, and multi-code copy to preserve or accurately disclose party
  state.
- Passed `npm run test:run -- src/app/party-transfer.test.ts
src/app/party-transfer-dialog.test.tsx src/app/party-sharing.test.ts
src/app/party-share-panel.test.tsx src/app/build-set-transfer.test.ts
src/app/build-set-transfer-dialog.test.tsx src/app/backup-restore.test.ts
src/app/persistence-schema.test.ts src/app/library-selectors.test.ts
src/app/template-workflow.test.ts src/app/share-url.test.ts src/app/App.test.tsx`.
- Passed `npm run typecheck`.

## Planning

Planned in `SPRINT-018`.
