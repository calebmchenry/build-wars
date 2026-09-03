---
id: BW-1704
title: Party Validation
epic: EPIC-17
status: ready
priority: high
depends_on:
  - BW-1702
  - BW-1703
created: 2026-09-03
updated: 2026-09-03
---

# BW-1704: Party Validation

## Goal

Add narrow party-level validation and summaries that build on per-loadout validation.

## Scope

- Aggregate per-loadout validation for the party view.
- Add party-specific checks for incomplete members, empty required slots, invalid preset size, and
  obvious mode mismatch.
- Keep advice and synergy analysis out of party validation.
- Distinguish errors, warnings, incomplete state, and unresolved state.
- Preserve editing even when party-level validation has issues.

## Out Of Scope

- Hero AI recommendations, optimal composition rules, duplicate-skill strategy advice, speed-clear
  meta checks, PvP format enforcement, and advanced synergy analysis.

## Acceptance Criteria

- Party validation explains structural issues without judging build quality.
- Per-loadout validation details remain accessible.
- Party warnings do not block single-member editing.
- Issue codes are deterministic and app-displayable.

## Verification

- `npm run test:run -- src/app src/domain`
- Focused tests for party validation issue codes and aggregate summaries
