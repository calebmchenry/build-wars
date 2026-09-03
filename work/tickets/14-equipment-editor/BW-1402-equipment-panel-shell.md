---
id: BW-1402
title: Equipment Panel Shell
epic: EPIC-14
status: done
priority: high
depends_on:
  - BW-1401
  - EPIC-07
  - EPIC-08
planned_sprint: SPRINT-015
completed_sprint: SPRINT-015
created: 2026-09-03
updated: 2026-09-03
---

# BW-1402: Equipment Panel Shell

## Goal

Add a usable equipment editing surface inside the existing editor.

## Scope

- Add an equipment panel, tab, or collapsible section alongside the current skill/attribute
  workspace.
- Keep one selected build as the active edit target.
- Lay out armor slots, weapon sets, stats, and validation affordances without a separate route.
- Support loading, empty, unresolved, and catalog-error states.
- Use prior-art equipment panel notes as directional guidance without requiring mannequin rendering
  or pixel matching.
- Preserve narrow-width behavior with stacked sections or collapsible controls.

## Out Of Scope

- Separate equipment routes, party-member equipment UI, portrait/mannequin assets, drag/drop-first
  equipment editing, and full multi-pane build editing.

## Acceptance Criteria

- Users can find equipment editing from the core editor without navigation confusion.
- Empty equipment state renders cleanly.
- The panel remains usable on desktop and narrow viewports.
- Equipment UI does not crowd or regress existing skill/attribute workflows.

## Closeout Evidence

- Implemented in SPRINT-015.
- Added `Skills` and `Equipment` workspace tabs with `Skills` as the default.
- Added an equipment panel shell with selected-build context, readiness chips, validation issue
  count, summary placement, and reset behavior.
- Verified opening the equipment tab leaves `equipment: null` intact.

## Verification

- `npm run verify`
