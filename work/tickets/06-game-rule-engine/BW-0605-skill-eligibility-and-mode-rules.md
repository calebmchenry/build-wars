---
id: BW-0605
title: Skill Eligibility and Mode Rules
epic: EPIC-06
status: backlog
priority: high
depends_on:
  - BW-0602
  - BW-0604
created: 2026-09-01
---

# BW-0605: Skill Eligibility and Mode Rules

## Goal

Validate whether selected skills are usable by the current build's professions, attributes, and game mode.

## Scope

- Validate profession and attribute eligibility for profession-linked skills.
- Permit common, no-attribute, and special skills when catalog metadata marks them as legal.
- Distinguish PvE, PvP, split, PvE-only, PvP-only, and unknown mode states using available skill catalog fields.
- Leave explicit hooks for title-rank and allegiance rules that will be completed in `EPIC-15`.
- Avoid rejecting unknown imported skill ids when the catalog is incomplete or stale.

## Acceptance Criteria

- A skill from the selected primary or secondary profession validates cleanly.
- A skill from an unrelated profession produces an explainable issue.
- Mode-restricted skills produce deterministic issues based on `Build.mode`.
- Title/allegiance gaps are represented as deferred or unresolved rules, not hard-coded guesses.

## Verification

- `npm run verify`
- Skill eligibility fixture tests added by the implementation sprint
