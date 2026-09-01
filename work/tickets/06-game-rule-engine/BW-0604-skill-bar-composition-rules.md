---
id: BW-0604
title: Skill Bar Composition Rules
epic: EPIC-06
status: backlog
priority: high
depends_on:
  - BW-0602
created: 2026-09-01
---

# BW-0604: Skill Bar Composition Rules

## Goal

Validate the structural rules for an eight-slot Guild Wars skill bar.

## Scope

- Enforce the eight-slot skill bar contract from `src/domain/build.ts`.
- Allow empty slots for in-progress builds while reporting incomplete bars when appropriate.
- Enforce one elite skill maximum.
- Count duplicate skill ids and decide which duplicates are errors versus warnings based on available catalog flags.
- Validate PvE-only count limits when skill flags are available.
- Report unresolved skill ids without removing or replacing them.

## Acceptance Criteria

- Full, partial, and empty skill bars produce predictable validation results.
- Elite and PvE-only limit checks are deterministic and fixture-covered.
- Unknown skill ids remain round-trippable and are reported as unresolved references.
- Skill-slot issues include enough path/slot metadata for the editor to highlight the affected slot.

## Verification

- `npm run verify`
- Skill-bar composition tests added by the implementation sprint
