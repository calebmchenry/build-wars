---
id: BW-0404
title: Skill Progression, Splits, and Tooltip Data
epic: EPIC-04
status: done
priority: critical
depends_on:
  - BW-0403
planned_sprint: SPRINT-005
completed_sprint: SPRINT-005
created: 2026-09-01
updated: 2026-09-02
---

# BW-0404: Skill Progression, Splits, and Tooltip Data

## Goal

Normalize the progression and variant data needed for dynamic skill tooltips, PvE/PvP differences, template compatibility, and later balance-update diffs.

## Scope

- Parse `Skill progression`, `gr`, `gr2`, title-rank progression templates, morale-boost recharge templates, and wrapper templates such as `PvE version` and `PvP version`.
- Represent scaling breakpoints, attribute or title-rank dependencies, value sequences, recharge variants, and non-scaling constant values.
- Link explicit PvE/PvP split relationships in both directions when source pages identify variants.
- Preserve raw progression template evidence separately from normalized tooltip-ready projections.
- Add validation for monotonic or intentionally non-monotonic progression values, rank bounds, malformed green-number ranges, title-rank limits, missing variant links, duplicate split relationships, and impossible dependencies.
- Add fixtures for standard attribute scaling, multi-value progressions, title-rank scaling, morale-boost recharge, PvE/PvP wrappers, split pages, no-progression skills, and malformed progression templates.

## Acceptance Criteria

- Generated progression metadata can drive dynamic tooltips without re-reading source wikitext.
- Skill records can identify which progression values depend on attributes, title ranks, split mode, or special recharge behavior.
- PvE/PvP split relationships remain explicit and bidirectional where source evidence exists.
- Malformed or unsupported progression forms produce QA diagnostics rather than guessed data.
- Raw structured progression evidence is preserved enough for future balance-update diffs while avoiding copied page bodies.

## Verification

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_progression`
- `npm run data:test`
- Focused contract tests for tooltip/progression JSON round-trip behavior
