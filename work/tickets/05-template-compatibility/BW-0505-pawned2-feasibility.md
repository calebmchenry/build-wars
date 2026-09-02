---
id: BW-0505
title: paw-ned2 Team Format Feasibility
epic: EPIC-05
status: done
priority: high
depends_on:
  - BW-0503
  - BW-0504
planned_sprint: SPRINT-006
completed_sprint: SPRINT-006
created: 2026-09-01
updated: 2026-09-02
---

# BW-0505: paw-ned2 Team Format Feasibility

## Execution Notes

SPRINT-006 deferred paw-ned2/team support with evidence and exported no public team codec. The
pinned package exposes `PwndTemplate`, but the Node.js `22.11.0` package-entry probe failed minimal
encode with `TypeError: $string.toBase64 is not a function`. Follow-up ownership is recorded in
`work/tickets/17-party-and-hero-builder/BW-1701-pawned2-template-integration.md`.

## Goal

Make one evidence-backed decision for paw-ned2/team support: a bounded raw team codec behind the
same adapter boundary, or a documented deferral to the party-builder epic.

## Scope

- Evaluate the dependency's `PwndTemplate` behavior for headers, charsets, nested skill/equipment
  codes, member fields, flags, descriptions, malformed lengths, and runtime globals.
- If every ship gate passes, implement only a raw JSON-compatible team envelope with the same
  exact-source/canonical fidelity model.
- If any ship gate fails, expose no partial team API, record the evidence, and create a focused
  EPIC-17 follow-up if needed.
- Do not map team data to `PartyBuild`, hero identities, roles, consumable legality, guide prose, or
  UI workflows in this sprint.

## Acceptance Criteria

- BW-0505 has exactly one final disposition: shipped raw codec or deferred with evidence.
- Any shipped raw team codec is bounded, deterministic, offline-tested, and preserves all surfaced
  fields it claims to support.
- Any deferral creates no public partial API and records the downstream owner and blocker.
- Team/player/description text is bounded metadata only and is not treated as imported guide
  content.

## Verification

- If shipped: `npm run test:run -- test/template-compatibility/pwnd-template.test.ts`
- If deferred: test or manual review proving no public team codec export exists and the deferral
  ticket/evidence is complete
- `npm run typecheck`
- `npm run build`
