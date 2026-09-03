---
id: BW-1703
title: Party Workspace UI
epic: EPIC-17
status: ready
priority: high
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
