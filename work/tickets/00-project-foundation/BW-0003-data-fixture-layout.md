---
id: BW-0003
title: Data and Fixture Layout
epic: EPIC-00
status: done
priority: critical
depends_on:
  - BW-0001
  - BW-0002
planned_sprint: SPRINT-001
completed_sprint: SPRINT-001
created: 2026-09-01
updated: 2026-09-01
---

# BW-0003: Data and Fixture Layout

## Goal

Create durable locations and policies for future source snapshots, generated data, QA reports, and foundation test fixtures.

## Scope

- Reserve `scripts/data/` for future non-runtime ingestion and QA scripts.
- Reserve `data/source-snapshots/`, `data/generated/`, and `data/qa/` with tracked policy README files.
- Add ignore rules that prevent raw/generated data churn while preserving policy files.
- Add minimal synthetic foundation fixtures only where needed for tests.
- Document that real Guild Wars Wiki, PvX, template, and game-rule fixtures belong to later source-policy, ingestion, template, and validation epics.

## Acceptance Criteria

- Data directories and README files exist with clear ownership and lifecycle notes.
- Ignore rules keep generated/raw contents out of Git while allowing policy README files to remain tracked.
- Foundation fixtures are synthetic, small, deterministic, and labeled non-authoritative.
- Browser app code does not consume raw source snapshots.
- No external source content, icons, copied descriptions, or live MediaWiki fetches are introduced.

## Verification

- `npm run test:run`
- `npm run verify`
- Manual review of `.gitignore` negation rules for tracked policy files.
