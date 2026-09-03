---
id: BW-1807
title: Skill Catalog Tab
epic: EPIC-18
status: done
priority: critical
planned_sprint: SPRINT-019
completed_sprint: SPRINT-019
depends_on:
  - BW-1802
  - BW-1803
created: 2026-09-03
updated: 2026-09-03
---

# BW-1807: Skill Catalog Tab

## Goal

Provide the first right-panel catalog tab: a compact skill list filtered by the
active professions and grouped by attribute.

## Scope

- Add a tabbed catalog surface with a skills tab as the initial implemented tab.
- Filter the skill list by active primary and secondary professions by default.
- Handle the "Any" profession state predictably for filtering.
- Group skills by attribute with collapsible sections.
- Render compact rows with icon, name, and right-aligned resource/cast/recharge
  fields.
- Include energy, adrenaline, sacrifice, upkeep/maintenance, activation, recharge,
  and other already-modeled costs where catalog data supports them.
- Make catalog rows draggable into the skill bar.

## Out Of Scope

- Weapons, runes, insignias, armor, broad saved-build search, recommendations,
  and advanced filtering beyond the focused composer need.

## Acceptance Criteria

- The skills tab shows useful default results without requiring the user to set
  manual filters.
- Skill groups can be collapsed and expanded.
- Rows remain scannable and stable across long names, missing costs, elite
  skills, and unresolved catalog gaps.
- Dragging from the catalog into the skill bar exercises the same reducer rules
  as other skill placement paths.

## Verification

- `npm run verify`

## Closeout Evidence

- Completed in `SPRINT-019`.
- Added `FocusedSkillCatalog` with Skills tab, selected-profession/all-playable defaults,
  deterministic grouped rows, UI-only group collapse, bounded rendering, search/scope controls, and
  compact fact display.
- Validation evidence: `npm run test:run -- src/app test/domain test/template-compatibility`,
  `npm run verify`, and `git diff --check`.

## Planning

Planned in `SPRINT-019`.
