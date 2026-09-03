---
id: BW-1401
title: Equipment Catalog Boundary and State
epic: EPIC-14
status: done
priority: critical
depends_on:
  - EPIC-08
  - EPIC-09
  - EPIC-10
  - EPIC-11
  - EPIC-12
  - EPIC-13
planned_sprint: SPRINT-015
completed_sprint: SPRINT-015
created: 2026-09-03
updated: 2026-09-03
---

# BW-1401: Equipment Catalog Boundary and State

## Goal

Wire promoted equipment-related catalogs and EPIC-13 equipment state into the app without leaking
generated artifacts into leaf components.

## Scope

- Extend the app catalog boundary to expose runtime-ready rune, insignia, weapon, and weapon-mod
  views.
- Add editor/workspace state actions for equipment updates on the selected build.
- Preserve EPIC-13 semantic equipment shape: armor slots, headgear bonus, weapon sets, and catalog ID
  attachments.
- Keep generated manifests, QA reports, source plans, snapshots, Python ingestion modules, wiki APIs,
  and icon bytes out of runtime UI components.
- Preserve existing skill, attribute, title, local-library, and share workflows.

## Out Of Scope

- Equipment template-code import/export, raw template exact replay, armor/weapon skins, dyes, color
  IDs, remote icon fetching, and party-wide equipment.

## Acceptance Criteria

- Leaf components receive app-owned equipment catalog views, not generated JSON imports.
- Equipment edits update the selected build deterministically.
- Empty and partial equipment state remains valid editor state.
- Existing saved-build and working-draft behavior remains compatible.

## Closeout Evidence

- Implemented in SPRINT-015.
- Added app-owned rune, insignia, weapon, and modifier catalog views with per-family readiness and
  validation slices behind `src/app/catalogs.ts`.
- Added catalog-independent equipment reducer actions and selectors for meaningful equipment,
  retained values, option filtering, inline issues, summaries, and validation inputs.
- Verified generated imports remain isolated to `src/app/catalogs.ts`.

## Verification

- `npm run verify`
