---
id: BW-0002
title: Domain Boundaries and Core Models
epic: EPIC-00
status: done
priority: critical
depends_on:
  - BW-0001
planned_sprint: SPRINT-001
completed_sprint: SPRINT-001
created: 2026-09-01
updated: 2026-09-01
---

# BW-0002: Domain Boundaries and Core Models

## Goal

Define the first framework-neutral TypeScript domain boundary for the Build Wars concepts named by EPIC-00.

## Scope

- Add `src/domain/` with public exports for core catalog and authored-document types.
- Keep domain code JSON-compatible and independent from React, browser APIs, storage, and data tooling.
- Represent stable catalog identifiers without closed TypeScript enums.
- Include schema version and catalog/provenance hooks needed by future data and storage work.
- Preserve the eight-slot skill bar invariant while deferring template codecs and game-rule validation.

## Acceptance Criteria

- Every core model named by EPIC-00 has a public documented type or intentionally minimal stub.
- Domain type checks run without DOM/browser dependencies.
- Unknown numeric catalog IDs remain representable and serializable.
- Domain tests cover schema versioning, eight nullable skill slots, and JSON round-tripping.
- No template parser, rule engine, equipment legality calculator, guide renderer, or local-storage adapter is implemented.

## Verification

- `npm run typecheck`
- `npm run test:run`
- `npm run verify`
