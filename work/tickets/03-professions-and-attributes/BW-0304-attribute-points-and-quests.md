---
id: BW-0304
title: Attribute Points and Quest Metadata
epic: EPIC-03
status: done
priority: high
depends_on:
  - BW-0301
  - BW-0302
  - BW-0303
planned_sprint: SPRINT-004
completed_sprint: SPRINT-004
created: 2026-09-01
updated: 2026-09-01
---

# BW-0304: Attribute Points and Quest Metadata

## Goal

Catalog the point math and campaign quest metadata needed by future attribute validation and build-editor defaults.

## Scope

- Normalize the point cost required to reach ranks 0 through 12 by spent points.
- Represent marginal and cumulative point costs explicitly, while keeping purchased rank separate from effective rank after bonuses.
- Normalize level-based point totals for levels 1 through 20.
- Normalize the two attribute-point quests per campaign and their reward values.
- Record the default level-20 assumptions used by the MVP build editor, including the 170-point pre-quest state and 200-point completed-quest state.
- Preserve PvP, hero, rune, equipment, effect, and actual quest-log assumptions as explicit deferred contexts where the source facts are not needed by the MVP.

## Acceptance Criteria

- Attribute rank cost totals are deterministic and usable by future EPIC-06 validation.
- Level point totals are deterministic and expose the default level-20 complete/incomplete quest cases.
- Attribute quest records include campaign, quest title, reward points, native-character limitation, source references, and QA status.
- Quest reward groups cannot be double-counted across mutually exclusive campaign-origin paths.
- Tests cover overspend boundaries, rank 0, rank 12, level 20 without quests, level 20 with both quests, and malformed table rows.

## Verification

- `npm run verify`
- Offline Python normalization tests plus Vitest contract tests for representative point tables
