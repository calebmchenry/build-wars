---
id: BW-1808
title: Icon Assets And Visual Polish
epic: EPIC-18
status: done
priority: high
planned_sprint: SPRINT-019
completed_sprint: SPRINT-019
depends_on:
  - BW-1803
  - BW-1804
  - BW-1805
  - BW-1807
created: 2026-09-03
updated: 2026-09-03
---

# BW-1808: Icon Assets And Visual Polish

## Goal

Replace placeholder-heavy composer visuals with real or locally cached
Guild Wars-inspired assets and cost icons where policy allows.

## Scope

- Use real profession icons in the composer header picker.
- Use real skill icons in the bar, drag preview, and catalog rows.
- Add in-game-style icons for energy, adrenaline, sacrifice, upkeep/maintenance,
  activation, recharge, and other modeled skill costs.
- Cache or reference assets according to the source policy instead of hot-linking
  wiki media at runtime.
- Tighten spacing, sizing, focus states, hover states, and narrow-screen behavior
  around the focused composer.

## Out Of Scope

- Full pixel-perfect game skinning, armor/weapon/rune/insignia icons, guide
  illustrations, and broad theming outside the focused composer.

## Acceptance Criteria

- Composer rows and slots show meaningful icons for resolved professions and
  skills.
- Cost/cast/recharge information uses recognizable iconography with accessible
  labels.
- No runtime path fetches remote wiki media directly from component rendering.
- Visual polish does not introduce layout shifts or text overlap.

## Verification

- `npm run verify`

## Closeout Evidence

- Completed in `SPRINT-019`.
- Added a shared `CatalogIcon` placeholder primitive and product-owned resource/timing glyphs; no
  binary assets, remote media rendering, runtime fetch, preload, CSS URL, canvas, or service-worker
  path was added.
- Tightened composer layout, fixed slot dimensions, responsive stacking, focus/hover/drop/invalid
  states, reduced-motion behavior, and long-text wrapping.
- Validation evidence: `npm run test:run -- src/app test/domain test/template-compatibility`,
  `npm run verify`, and `git diff --check`.

## Planning

Planned in `SPRINT-019`.
