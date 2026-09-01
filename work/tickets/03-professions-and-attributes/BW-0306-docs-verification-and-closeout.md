---
id: BW-0306
title: Docs Verification and Closeout
epic: EPIC-03
status: done
priority: high
depends_on:
  - BW-0301
  - BW-0302
  - BW-0303
  - BW-0304
  - BW-0305
planned_sprint: SPRINT-004
completed_sprint: SPRINT-004
created: 2026-09-01
updated: 2026-09-01
---

# BW-0306: Docs Verification and Closeout

## Goal

Document the profession/attribute catalog, verification path, promotion decision, and ticket-burn closeout state.

## Scope

- Update README, data documentation, and compendium notes with the EPIC-03 catalog shape and regeneration commands.
- Document which generated paths are committed, which paths stay ignored, and which future epics consume the catalog.
- Document source pages, source-policy decisions, manual review notes, and unresolved deferred scope.
- Run the canonical validation command and record closeout status in the sprint, tickets, EPIC, ledger, and execution manifest.

## Acceptance Criteria

- Documentation names the canonical regenerate and verification commands exactly.
- Docs state that raw snapshots, live outputs, QA reports, and icon bytes are not runtime data.
- EPIC-04, EPIC-05, EPIC-06, and EPIC-08 dependencies on this catalog are called out.
- Ticket, epic, sprint, and ledger statuses are updated only after validation passes.

## Verification

- `npm run verify`
- Manual review of ticket, sprint, ledger, manifest, README, data docs, and compendium consistency
