---
id: BW-0907
title: Freshness Validation Docs and Closeout
epic: EPIC-09
status: done
priority: high
depends_on:
  - BW-0902
  - BW-0903
  - BW-0904
  - BW-0905
  - BW-0906
planned_sprint: SPRINT-010
completed_sprint: SPRINT-010
created: 2026-09-02
updated: 2026-09-02
---

# BW-0907: Freshness Validation Docs and Closeout

## Goal

Wire saved/draft builds back through current catalog validation and close out EPIC-09 with tests and
documentation.

## Scope

- Store catalog version facts when a draft or saved build is saved or validated.
- On load, validate saved builds and the working draft against the current EPIC-03/04 catalogs.
- Preserve unknown, stale, or unresolved IDs and show warnings instead of auto-migrating or replacing
  skills.
- Keep deeper revision-history and build freshness analysis deferred to `EPIC-21`.
- Update README, compendium notes, sprint records, and ticket statuses as required by the execution
  sprint.
- Verify storage, library, sharing, restore, validation, and responsive behavior.

## Out Of Scope

- Historical dated decoding, skill revision timelines, automatic migration to replacement skills,
  title ownership, equipment validation, party validation, guide search, backend sync, analytics,
  auth, deployment, and PWA behavior.

## Acceptance Criteria

- Saved builds survive reload and are validated against current catalogs on load.
- Stale/unresolved data remains visible and recoverable.
- EPIC-09 closeout documents storage schema, share limits, backup format, and deferred work.
- `EPIC-09` is ready to mark done only after all local library and sharing workflows pass
  verification.

## Verification

- `npm run verify`
