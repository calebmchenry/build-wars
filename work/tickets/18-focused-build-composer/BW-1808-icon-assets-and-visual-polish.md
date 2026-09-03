---
id: BW-1808
title: Icon Assets And Visual Polish
epic: EPIC-18
status: backlog
priority: high
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
