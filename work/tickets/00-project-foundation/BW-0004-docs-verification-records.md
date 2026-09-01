---
id: BW-0004
title: Documentation, Verification, and Planning Records
epic: EPIC-00
status: done
priority: critical
depends_on:
  - BW-0001
  - BW-0002
  - BW-0003
planned_sprint: SPRINT-001
completed_sprint: SPRINT-001
created: 2026-09-01
updated: 2026-09-01
---

# BW-0004: Documentation, Verification, and Planning Records

## Goal

Make the foundation reproducible for humans, future agents, and ticket-burn automation.

## Scope

- Update `README.md` with install, run, build, test, and verification commands.
- Add compendium documentation for stack choice, local-only scope, module boundaries, data/fixture policy, and deferred work.
- Ensure `work/sprints/ledger.tsv` tracks `SPRINT-001`.
- Keep EPIC-00 and BW ticket statuses/linkage consistent during execution and closeout.
- Run the canonical verification command and existing Python ticket-burn tests.

## Acceptance Criteria

- README and compendium docs describe the same commands and directory contracts implemented in the repo.
- `npm run verify` is documented and runs format check, lint, typecheck, tests, production build, and ticket-burn unit tests.
- `work/sprints/ledger.tsv` contains `SPRINT-001`.
- BW-0001 through BW-0004 are marked done only after their acceptance criteria pass.
- EPIC-00 is marked done only after the full sprint Definition of Done passes.

## Verification

- `npm run verify`
- `python3 -m unittest scripts/test_ticket_burn.py`
