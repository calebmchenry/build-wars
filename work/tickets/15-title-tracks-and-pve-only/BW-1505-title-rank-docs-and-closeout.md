---
id: BW-1505
title: Title Rank Docs and Closeout
epic: EPIC-15
status: ready
priority: high
depends_on:
  - BW-1502
  - BW-1503
  - BW-1504
created: 2026-09-03
updated: 2026-09-03
---

# BW-1505: Title Rank Docs and Closeout

## Goal

Document the simplified EPIC-15 behavior, deferred scope, and verification record.

## Scope

- Update README, compendium notes, ticket statuses, and sprint records as required by the execution
  sprint.
- Document max-rank defaults, user overrides, title key normalization, and reset-to-max behavior.
- Record that EPIC-15 does not add title ingestion, account profile management, title acquisition,
  broad allegiance modeling, guide prose, or copied source text.
- Document any remaining narrow warning states for ambiguous title or allegiance metadata.
- Confirm existing skill editor, local library, sharing, and equipment-shell behavior remains
  compatible.

## Out Of Scope

- Runtime icon media approval, party/team title state, guide authoring, backend sync, and full
  account progression tracking.

## Acceptance Criteria

- Product docs describe title ranks as default-max with optional user overrides.
- Deferred scope is explicit enough that later party/guide work does not reintroduce account-title
  tracking accidentally.
- EPIC-15 is ready to mark done only after verification and docs closeout pass.

## Verification

- `npm run verify`
