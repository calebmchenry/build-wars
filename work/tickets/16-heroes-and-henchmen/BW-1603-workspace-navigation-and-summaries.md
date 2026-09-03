---
id: BW-1603
title: Workspace Navigation and Summaries
epic: EPIC-16
status: done
priority: high
planned_sprint: SPRINT-017
completed_sprint: SPRINT-017
depends_on:
  - BW-1601
  - BW-1602
created: 2026-09-03
updated: 2026-09-03
---

# BW-1603: Workspace Navigation and Summaries

## Goal

Make several loadouts visible while keeping one selected loadout easy to edit.

## Scope

- Add build-set navigation using tabs, a strip, or a compact side panel consistent with the existing
  editor.
- Show compact summaries for non-selected loadouts: label, profession pair, mode, skill bar, key
  equipment state, and validation status.
- Keep the selected loadout wired into the existing editor controls.
- Support keyboard selection, reorder controls, empty states, overflow, and narrow-width behavior.
- Avoid a heavy multi-pane editor unless the layout remains usable and testable.

## Out Of Scope

- Party member portraits, hero selection, drag/drop between multiple full editors, external team
  template UI, and advanced comparison analytics.

## Acceptance Criteria

- Users can scan multiple loadouts while editing one selected loadout.
- Switching loadouts preserves unsaved in-memory edits.
- Empty and single-loadout workspaces remain simple.
- Summaries do not import generated catalogs outside established app catalog boundaries.

## Verification

- `npm run test:run -- src/app`
- Focused component/selector tests for navigation, summaries, selection, and responsive states

## Closeout Evidence

- Implemented in `SPRINT-017`.
- Passed `npm run test:run -- src/app/build-set-selectors.test.ts src/app/build-set-navigator.test.tsx src/app/App.test.tsx src/app/catalog-boundary.test.ts`.
- Passed `npm run verify`.
