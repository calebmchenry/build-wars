---
id: BW-1605
title: Group Validation and Export Boundaries
epic: EPIC-16
status: ready
priority: high
depends_on:
  - BW-1601
  - BW-1602
  - BW-1603
created: 2026-09-03
updated: 2026-09-03
---

# BW-1605: Group Validation and Export Boundaries

## Goal

Show validation across a build set while keeping party rules and external sharing formats deferred.

## Scope

- Run existing per-build validation for each loadout in a build set.
- Show an aggregate summary of errors, warnings, unresolved state, and incomplete loadouts.
- Add backup/restore coverage for build sets if not already covered by BW-1602.
- Define native JSON export/import boundaries for build sets where useful for recovery.
- Document that party-level rules, team-code export, and external compatibility belong to EPIC-17 or
  later.

## Out Of Scope

- Party composition validation, hero-specific rules, paw-ned2, external team templates, guide
  publishing, backend sharing, and advanced synergy analysis.

## Acceptance Criteria

- Users can see which loadouts in a build set need attention.
- Group validation does not invent party legality rules.
- Native recovery/export data preserves build set entries and metadata without source-only
  artifacts.
- EPIC-17 has a clear handoff for party-specific sharing and validation.

## Verification

- `npm run test:run -- src/app src/domain`
- Focused tests for aggregate validation and build set backup/restore boundaries
