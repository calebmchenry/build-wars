---
id: BW-1806
title: Inline Template Import Export
epic: EPIC-18
status: done
priority: high
planned_sprint: SPRINT-019
completed_sprint: SPRINT-019
depends_on:
  - BW-1802
  - BW-1803
  - BW-1804
  - BW-1805
created: 2026-09-03
updated: 2026-09-03
---

# BW-1806: Inline Template Import Export

## Goal

Move skill template code import/export into the focused composer as an inline
input with copy and paste behavior.

## Scope

- Show the current template code under the skill bar.
- Add a copy icon button that writes the current template code to the clipboard
  when possible and leaves the code selectable as fallback.
- Allow pasting or typing a supported template code into the input to update
  professions, attributes, build name where present, and skill bar.
- Preserve exact-source and canonical export policies from the existing template
  workflow.
- Keep validation and error states visible without turning the workflow into a
  modal-first experience.

## Out Of Scope

- Saved template library, share URLs, equipment templates, party templates, and
  remote sharing.

## Acceptance Criteria

- A user can copy the active template code from the composer panel.
- A user can paste/import a valid skill template code and see the composer
  update transactionally.
- Invalid input does not destroy the previous build state.
- Existing template compatibility tests still pass.

## Verification

- `npm run verify`

## Closeout Evidence

- Completed in `SPRINT-019`.
- Added `InlineTemplateCode` with preferred proven output, blocked reasons, selectable fallback,
  explicit Apply import, copy feedback, dirty/omission guards, and selected-loadout-only warnings.
- Kept modal template controls as a tested secondary fallback.
- Validation evidence: `npm run test:run -- src/app test/domain test/template-compatibility`,
  `npm run verify`, and `git diff --check`.

## Planning

Planned in `SPRINT-019`.
