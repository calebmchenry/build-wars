---
id: BW-0506
title: Template Compatibility Fixtures, Docs, and Closeout
epic: EPIC-05
status: done
priority: high
depends_on:
  - BW-0503
  - BW-0504
  - BW-0505
planned_sprint: SPRINT-006
completed_sprint: SPRINT-006
created: 2026-09-01
updated: 2026-09-02
---

# BW-0506: Template Compatibility Fixtures, Docs, and Closeout

## Execution Notes

SPRINT-006 added minimized offline fixture matrices, focused compatibility tests, README updates,
`compendium/template-compatibility.md`, ticket closeout metadata, and the EPIC-17 paw-ned2 follow-up.
The final verification set is recorded in the sprint result manifest.

## Goal

Consolidate compatibility fixtures, document the API and known limits, run final verification, and
close ticket-burn records consistently.

## Scope

- Add a data-driven compatibility matrix for skill, equipment, chat wrapper, error, fidelity, and
  final paw-ned2 disposition cases.
- Keep fixtures minimized, offline, source-classified, and free of broad community prose, icons,
  screenshots, raw snapshots, tarballs, extracted packages, and transient logs.
- Document the adapter boundary, exact-source replay, field-complete canonical export, typed error
  codes, input caps, dependency upgrade gate, raw equipment limit, and paw-ned2 result.
- Update README, compendium notes, EPIC-05, BW tickets, SPRINT-006, ledger, and result manifest only
  after the implementation behavior and validation agree.

## Acceptance Criteria

- Focused compatibility tests and `npm run verify` pass offline.
- Documentation and ticket records accurately describe supported formats, unsupported cases, runtime
  floor, dependency version, fixture provenance, and paw-ned2 status.
- No application UI, generated catalog, generated manifest, QA report, source snapshot, or
  data-ingestion code is modified for template compatibility.
- EPIC-05, BW-0501 through BW-0506, SPRINT-006, and the sprint ledger are status-consistent at
  closeout.

## Verification

- `npm run test:run -- test/template-compatibility`
- `npm run verify`
- `python3 scripts/test_ticket_burn.py`
- `git status --short`
