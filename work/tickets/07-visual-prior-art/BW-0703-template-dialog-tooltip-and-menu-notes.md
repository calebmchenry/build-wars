---
id: BW-0703
title: Template Dialog, Tooltip, And Menu Notes
epic: EPIC-07
status: done
priority: medium
depends_on:
  - BW-0701
planned_sprint: SPRINT-008
completed_sprint: SPRINT-008
created: 2026-09-02
updated: 2026-09-02
---

# BW-0703: Template Dialog, Tooltip, And Menu Notes

## Goal

Document the visual and interaction references for template menus, load/save/template-code dialogs,
hover tooltips, and skill tooltip presentation.

## Scope

- Cover template menu, template button, load dialog, save dialog, template-code dialog, hover
  tooltip, sort menu, icon display menu, and representative skill-tooltip screenshots.
- Record modal framing, menu density, hover treatment, list-row affordances, tooltip placement,
  tooltip borders, title/body/value hierarchy, and icon/text alignment where visible.
- Distinguish confirmed visual states from states not covered by screenshots.
- Tie every note to screenshot paths and inventory categories.
- Do not design or implement import/export UI in this ticket.

## Acceptance Criteria

- EPIC-08 template controls and tooltip tasks can cite concrete screenshot evidence.
- Tooltip notes cover normal skill, elite skill, attribute tooltip, and cost-special cases where
  represented.
- Dialog and menu notes identify visible selected, hover, disabled, and empty states where present.
- Missing states are recorded in the gap register.

## Verification

- Manual screenshot review against the BW-0701 inventory.
- Manual review that no copied long-form game text enters runtime-facing docs or fixtures.

## Completion Evidence

- Added template, menu, hover, and tooltip observations `VP-OBS-011` through
  `VP-OBS-018` to `compendium/visual-prior-art.md`.
- Covered template button/menu, load/save/code dialogs, hover summaries,
  sort/display menus, normal and elite skill tooltips, attribute tooltip, and
  represented cost-special cases.
- Completed path/link checks and source-policy review without embedding
  screenshots or copying long-form in-game text.
