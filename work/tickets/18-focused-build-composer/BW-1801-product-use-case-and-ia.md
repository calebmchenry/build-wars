---
id: BW-1801
title: Product Use Case And Information Architecture
epic: EPIC-18
status: done
priority: critical
planned_sprint: SPRINT-019
completed_sprint: SPRINT-019
depends_on: []
created: 2026-09-03
updated: 2026-09-03
---

# BW-1801: Product Use Case And Information Architecture

## Goal

Capture the focused build composer use case as durable product context and map
the current crowded workspace into the simplified composer-first experience.

## Scope

- Add or update the compendium use-case document for the focused build composer.
- Define primary use case, deferred use cases, non-goals, and first-screen
  information architecture.
- Identify which existing EPIC-08 through EPIC-17 surfaces remain useful but
  should move out of the default path.
- Document how the new left composer panel and right catalog panel divide
  state ownership and responsibilities.

## Out Of Scope

- Implementing the new UI shell, drag/drop behavior, runtime icons, saved build
  storage, equipment editing, guide authoring, and party workflows.

## Acceptance Criteria

- Product intent is documented in `compendium/` and linked from the compendium
  index.
- Deferred capabilities are named explicitly so future agents do not pull them
  back into the focused milestone.
- Implementation tickets can reference one durable use-case document rather
  than restating the full product vision.

## Verification

- Markdown review.

## Closeout Evidence

- Completed in `SPRINT-019`.
- Updated `compendium/build-composer-use-case.md`, README, and related compendium records with the
  focused primary use case, secondary entry-point map, naming contract, profession/raw retention,
  source-policy asset branch, and deferred scope.
- Validation evidence: `npm run test:run -- src/app test/domain test/template-compatibility`,
  `npm run verify`, and `git diff --check`.

## Planning

Planned in `SPRINT-019`.
