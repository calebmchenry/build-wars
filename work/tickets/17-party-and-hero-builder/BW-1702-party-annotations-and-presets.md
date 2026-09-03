---
id: BW-1702
title: Party Annotations and Presets
epic: EPIC-17
status: done
priority: high
planned_sprint: SPRINT-018
completed_sprint: SPRINT-018
depends_on:
  - EPIC-16
created: 2026-09-03
updated: 2026-09-03
---

# BW-1702: Party Annotations and Presets

## Goal

Add party/team metadata on top of build sets without requiring a hero catalog.

## Scope

- Add party mode or party annotations to an EPIC-16 build set.
- Support ordered member slots, empty slots, labels, freeform roles, and common party size presets.
- Support lightweight member kind labels such as player, hero, mercenary, guest, or freeform.
- Keep member identity user-authored rather than catalog-driven.
- Preserve build set neutrality so the same underlying model still works for variants and comparison
  groups.

## Out Of Scope

- Hero/henchman catalogs, unlock tracking, portraits, hero AI, paw-ned2, external codecs, backend
  sync, and build recommendations.

## Acceptance Criteria

- A build set can be marked and displayed as a party/team.
- Party annotations save locally with the build set.
- Users can label slots without selecting real hero identities.
- The underlying loadout data remains ordinary build set entries.

## Verification

- `npm run typecheck`
- Focused tests for party annotation contracts and presets

## Closeout Evidence

- Implemented in `SPRINT-018`.
- Replaced placeholder party shape with bounded annotation contracts, slot IDs, presets, member
  labels, roles, kinds, freeform labels, notes, lifecycle helpers, unassigned projections, and
  structural diagnostics.
- Added persisted build-set snapshot v2 with in-memory v1 neutral migration while keeping the
  domain `BuildSet` schema and outer `build-wars:v1` library envelope stable.
- Passed `npm run test:run -- test/domain/party.test.ts test/domain/contracts.test.ts
src/app/persistence-schema.test.ts`.
- Passed `npm run typecheck`.

## Planning

Planned in `SPRINT-018`.
