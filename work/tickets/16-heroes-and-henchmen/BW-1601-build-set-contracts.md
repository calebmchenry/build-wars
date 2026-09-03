---
id: BW-1601
title: Build Set Contracts
epic: EPIC-16
status: done
priority: critical
planned_sprint: SPRINT-017
completed_sprint: SPRINT-017
depends_on:
  - EPIC-08
  - EPIC-14
  - EPIC-15
created: 2026-09-03
updated: 2026-09-03
---

# BW-1601: Build Set Contracts

## Goal

Define the framework-neutral model for a group of complete build loadouts.

## Scope

- Add or revise domain contracts for a build set with ordered entries.
- Treat each entry as a complete build loadout: professions, attributes, skill bar, title ranks,
  equipment, and notes where already supported.
- Support entry metadata such as local ID, label, optional description, entry kind, ordering, and
  selected/collapsed UI state where appropriate.
- Keep party-specific slot semantics out of the base build-set contract.
- Define empty, single-build, multi-build, variant, and unresolved/partial states.

## Out Of Scope

- Hero/henchman catalogs, party rules, paw-ned2, external team-template codecs, backend sync,
  guide authoring, recommendations, and real-time collaboration.

## Acceptance Criteria

- A build set can represent parties, variants, comparison groups, or freeform collections without
  changing its base shape.
- Build set entries reuse existing `Build` semantics instead of duplicating skill/equipment fields.
- Party-specific labels are optional annotations, not required base fields.
- Empty and partial build sets are representable without validation crashes.

## Verification

- `npm run typecheck`
- Focused Vitest coverage for build set fixtures and empty/partial states

## Closeout Evidence

- Implemented in `SPRINT-017`.
- Passed `npm run test:run -- test/domain/build-set.test.ts test/domain/contracts.test.ts`.
- Passed `npm run verify`.
