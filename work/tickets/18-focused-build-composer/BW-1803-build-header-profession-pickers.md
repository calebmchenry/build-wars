---
id: BW-1803
title: Build Header Profession Pickers
epic: EPIC-18
status: backlog
priority: high
depends_on:
  - BW-1802
created: 2026-09-03
updated: 2026-09-03
---

# BW-1803: Build Header Profession Pickers

## Goal

Implement the composer header with primary profession icon, secondary
profession icon, and editable build name.

## Scope

- Replace text-heavy profession controls in the focused composer with
  icon-based custom comboboxes.
- Show ten profession options plus an app-specific "Any" option where allowed.
- Use tooltips or accessible labels for profession names.
- Keep primary and secondary profession changes wired to existing validation,
  attribute, skill eligibility, and template behavior.
- Provide an inline editable build name next to the profession controls.

## Out Of Scope

- Runtime wiki icon fetching, saved build naming workflows, team member labels,
  and template export semantics for non-concrete profession selections.

## Acceptance Criteria

- A user can set primary and secondary professions from compact icon menus.
- The menu presents profession options in a stable grid that works with pointer
  and keyboard input.
- The "Any" option behaves consistently for filtering/construction and does not
  silently produce invalid template output.
- Editing the build name updates the active draft.

## Verification

- `npm run verify`
