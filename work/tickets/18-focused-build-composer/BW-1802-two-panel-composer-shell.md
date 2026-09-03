---
id: BW-1802
title: Two Panel Composer Shell
epic: EPIC-18
status: backlog
priority: critical
depends_on:
  - BW-1801
created: 2026-09-03
updated: 2026-09-03
---

# BW-1802: Two Panel Composer Shell

## Goal

Replace the crowded primary workspace with a focused two-panel build composer
that makes single-build creation the default experience.

## Scope

- Create the composer layout with a left WYSIWYG build panel and right catalog
  panel.
- Move library, equipment, party, comparison, guide, and broad workspace affordances
  out of the first-screen path where practical.
- Preserve existing state and catalog boundaries while simplifying the visible
  surface.
- Keep the layout usable on desktop and narrow screens without overlapping text
  or controls.

## Out Of Scope

- Final profession picker visuals, detailed attribute row mechanics, skill
  catalog row polish, and icon ingestion.

## Acceptance Criteria

- The first screen opens directly into a focused single-build composer.
- The left panel is visually and semantically the active build surface.
- The right panel provides a tabbed catalog area with at least the skills tab
  available for later tickets.
- Existing import/export, validation, and editor behavior is not regressed by
  the shell change.

## Verification

- `npm run verify`
