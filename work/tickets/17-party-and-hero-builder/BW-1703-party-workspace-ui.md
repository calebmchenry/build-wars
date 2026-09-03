---
id: BW-1703
title: Party Workspace UI
epic: EPIC-17
status: done
priority: high
planned_sprint: SPRINT-018
completed_sprint: SPRINT-018
depends_on:
  - BW-1702
created: 2026-09-03
updated: 2026-09-03
---

# BW-1703: Party Workspace UI

## Goal

Provide a party-oriented view over a multi-build workspace.

## Scope

- Add party/member layout controls using the EPIC-16 build set navigation foundation.
- Show member labels, roles, profession pairs, skill bars, equipment summaries, and validation
  status.
- Let users select and edit one party member while keeping the full party visible.
- Support reorder, empty slots, add/remove member, duplicate member, and responsive behavior.
- Keep visual treatment compatible with existing prior-art notes without requiring portrait assets.

## Out Of Scope

- Portrait image fetching, hero selector catalogs, full party-window pixel matching, external team
  template UI, and simultaneous editing of every member in separate full editors.

## Acceptance Criteria

- Users can assemble a readable party view from existing loadouts.
- Empty and incomplete members are visually clear.
- Member selection and editing preserve unsaved state.
- The UI works without hero names or portraits.

## Verification

- `npm run test:run -- src/app`
- Focused component tests for member selection, add/remove, reorder, and responsive states

## Closeout Evidence

- Implemented in `SPRINT-018`.
- Added party workspace selectors and UI for enabled, dormant, occupied, empty, selected, and
  unassigned states while preserving neutral build-set navigation and selected-member editor
  binding.
- Added controls for enabling, disabling, resetting, resizing, moving, assigning, creating,
  clearing, duplicating, and editing slot metadata with compact responsive styling.
- Passed `npm run test:run -- src/app/party-selectors.test.ts src/app/party-workspace.test.tsx
src/app/build-set-selectors.test.ts src/app/library-selectors.test.ts
src/app/build-set-navigator.test.tsx src/app/template-dialogs.test.tsx src/app/App.test.tsx`.
- Passed `npm run typecheck`.

## Planning

Planned in `SPRINT-018`.
