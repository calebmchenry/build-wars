---
id: BW-1706
title: Party Docs and Closeout
epic: EPIC-17
status: done
priority: high
planned_sprint: SPRINT-018
completed_sprint: SPRINT-018
depends_on:
  - BW-1703
  - BW-1704
  - BW-1705
created: 2026-09-03
updated: 2026-09-03
---

# BW-1706: Party Docs and Closeout

## Goal

Document party semantics, sharing behavior, deferred hero catalog scope, and verification.

## Scope

- Update README, compendium notes, ticket statuses, and sprint records as required by the execution
  sprint.
- Document party annotations, presets, local persistence, validation, native export, and multi-code
  copy behavior.
- Record that EPIC-17 does not add a hero/henchman catalog, portraits, hero AI advice, or paw-ned2.
- Preserve BW-1701 as a low-priority parking-lot item for future external team-template
  compatibility.
- Confirm multi-build workspace and single-build workflows remain compatible.

## Out Of Scope

- Runtime icon media approval, guide authoring, backend sharing, account profiles, external codecs,
  and recommendation engines.

## Acceptance Criteria

- Product docs describe party semantics as annotations on build sets.
- Deferred scope is explicit enough that hero catalog or paw-ned2 work is not required for party
  workflows.
- EPIC-17 is ready to mark done only after verification and docs closeout pass.

## Verification

- `npm run verify`

## Closeout Evidence

- Implemented in `SPRINT-018`.
- Updated README and compendium records for party annotations, independent party order, nullable
  slot references, reversible mode, presets, slot notes versus entry notes, unassigned loadouts,
  selected-editor behavior, validation, persistence migration, native party JSON, multi-code
  limits, selected-member URLs, and deferred hero/external-codec scope.
- Kept BW-1701 parked in backlog with SPRINT-006 evidence; native Build Wars JSON does not claim
  paw-ned2 or external team-template compatibility.
- Passed `npm run test:run -- src/app test/domain test/template-compatibility`.
- Passed `npm run verify`.

## Planning

Planned in `SPRINT-018`.
