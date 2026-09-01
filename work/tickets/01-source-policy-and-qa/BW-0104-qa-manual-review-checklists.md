---
id: BW-0104
title: QA Reports and Manual Review Checklists
epic: EPIC-01
status: done
priority: critical
depends_on:
  - BW-0102
  - BW-0103
planned_sprint: SPRINT-002
completed_sprint: SPRINT-002
created: 2026-09-01
updated: 2026-09-01
---

# BW-0104: QA Reports and Manual Review Checklists

## Goal

Define the QA report requirements and manual review workflow future ingestion and content epics must
use to catch missing provenance, stale revisions, ambiguous source status, manual overrides, and
copied text without attribution.

## Scope

- Document required QA report categories, severities, and closeout expectations.
- Define manual review checks for copied descriptions, icon metadata, screenshots, PvX/Fandom
  metadata, generated diffs, manual overrides, and ambiguous source classifications.
- Provide a small synthetic QA fixture or test example if useful for executable verification.
- Keep the work limited to contracts, documentation, and synthetic examples; do not build the full
  ingestion validator yet.

## Acceptance Criteria

- QA requirements cover missing provenance, stale source revisions, ambiguous license/source status,
  manual overrides, copied text without attribution, icon metadata gaps, and generated-data diffs.
- Manual review checklists identify who/what/when metadata future reviewers must record.
- The QA output contract is concrete enough for EPIC-02 to emit validation reports into `data/qa/`.
- The Definition of Done requires all critical QA findings to be resolved or explicitly accepted
  before generated data is used by the app or released.
- No live fetcher, parser, or complete QA engine is introduced by this sprint.

## Verification

- Manual review of QA policy and checklist coverage against EPIC-01.
- `npm run verify`
