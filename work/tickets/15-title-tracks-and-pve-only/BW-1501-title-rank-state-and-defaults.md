---
id: BW-1501
title: Title Rank State and Defaults
epic: EPIC-15
status: done
priority: critical
depends_on:
  - EPIC-04
  - EPIC-08
  - EPIC-09
planned_sprint: SPRINT-016
completed_sprint: SPRINT-016
created: 2026-09-03
updated: 2026-09-03
---

# BW-1501: Title Rank State and Defaults

## Goal

Add authored title-rank state that defaults every discovered title dependency to maximum rank.

## Scope

- Derive title-rank keys, min ranks, and max ranks from EPIC-04 skill progression metadata.
- Normalize catalog title keys into stable authored state keys and user-facing labels.
- Collapse known aliases, including duplicate Sunspear key forms, into one user-facing title rank.
- Store user overrides from max rank in editor/build state and local persistence.
- Clamp ranks to the discovered min/max integer range.
- Keep max-rank behavior implicit when the user has not edited a title.

## Out Of Scope

- New title ingestion profiles, account-wide title ownership, title acquisition, reputation farming,
  guide prose, backend sync, and copied source text.

## Acceptance Criteria

- Title rank state can be empty while title-scaled skills still render at max rank.
- User-edited ranks survive local save/load through the EPIC-09 persistence model.
- Invalid stored rank values clamp or warn without crashing the editor.
- Title aliases resolve deterministically to one authored control/state key.

## Verification

- `npm run typecheck`
- Focused Vitest coverage for title key discovery, aliasing, default max ranks, clamping, and local
  persistence migration

## Closeout Evidence

- SPRINT-016 added `src/domain/title-rank.ts`, Build schema 2 `titleRankOverrides`, exact title
  alias normalization, sparse set/reset helpers, schema-1 migration, bounded persisted override
  parsing, unknown/stale override retention, and clone/fingerprint durability.
- Validation passed: `npm run typecheck`, focused title/persistence/workspace/backup Vitest
  coverage, `npm run test:run -- src/app test/domain`, final `npm run verify`, and
  `git diff --check`.
