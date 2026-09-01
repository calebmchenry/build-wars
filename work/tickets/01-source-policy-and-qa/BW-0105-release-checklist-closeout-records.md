---
id: BW-0105
title: Release Checklist and Closeout Records
epic: EPIC-01
status: done
priority: critical
depends_on:
  - BW-0101
  - BW-0102
  - BW-0103
  - BW-0104
planned_sprint: SPRINT-002
completed_sprint: SPRINT-002
created: 2026-09-01
updated: 2026-09-01
---

# BW-0105: Release Checklist and Closeout Records

## Goal

Ensure EPIC-01 leaves future content epics with clear release gates, planning records, and sprint
closeout checks.

## Scope

- Add a public release checklist covering attribution display, source links, generated-data notices,
  license/source notes, ambiguous-source review, and media asset restrictions.
- Update compendium/data documentation indexes where needed.
- Keep EPIC-01, BW-0101 through BW-0105, `SPRINT-002`, and `work/sprints/ledger.tsv` aligned during
  execution closeout.
- Run the canonical repository verification command after planned implementation changes.

## Acceptance Criteria

- The public release checklist is discoverable from the compendium or source policy documentation.
- Future content epics can reference EPIC-01 for source and QA requirements without reopening the
  baseline policy decisions.
- Planning records link EPIC-01, BW-0101 through BW-0105, and SPRINT-002.
- Closeout instructions require marking EPIC-01 done only after every sprint Definition of Done
  item and BW ticket acceptance criterion passes.
- No commit is created by ticket-burn execution unless the outer runner requests one.

## Verification

- `npm run verify`
- Manual review of EPIC, BW ticket, sprint, and ledger status/linkage consistency.
