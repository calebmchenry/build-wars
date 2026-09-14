---
id: BW-1905
title: Inline Runes, Headgear, and Blue Ranks
epic: EPIC-19
status: done
priority: high
planned_sprint: SPRINT-020
completed_sprint: SPRINT-020
depends_on:
  - BW-1902
  - BW-1903
  - BW-1904
created: 2026-09-13
updated: 2026-09-14
---

# BW-1905: Inline Runes, Headgear, and Blue Ranks

## Goal

Add compact equipment controls beside attribute allocation and explain the resulting blue effective ranks.

## Scope

- Add a single-choice None/+1/+2/+3 rune segment group per primary-profession attribute, using cached images plus numbers and full rune/health-penalty labels.
- Add a single optional headgear choice across primary attributes, with an explicit clear action and correct keyboard grouping.
- Omit equipment controls on secondary-profession rows, retained illegal rows, and unresolved/Any primary contexts; preserve access to applicable temporary effects.
- Keep existing base-allocation arrows, costs, budget, ordering, collapse, and rank limits. A zero-base primary attribute can still receive equipment bonuses.
- Show an increased effective rank in blue using the supplied game screenshot as the visual reference. Keep ordinary rank styling when the effective rank equals base.
- Provide a hover/focus/touch-accessible contribution breakdown and cap/unresolved explanation. A title attribute alone is not sufficient keyboard/touch access.
- Use compact desktop columns with a usable narrow-layout fallback. Do not add armor pieces, weapon controls, or a full equipment tab.

## Acceptance Criteria

- Rune selection is mutually exclusive per attribute; headgear selection is globally exclusive and clearable.
- All controls work by pointer and keyboard, expose selection, and show recognizable focus.
- Blue styling, accessible rank text, and breakdown reflect the shared projection without changing game-code ranks.
- Layout remains usable with long names, five primary attributes, secondary attributes, both themes, and narrow viewports.

## Verification

Focused component/workflow tests plus real browser inspection against prior-art/gw-skills-and-attributes-refs/attributes-section.png.

## Design Authority

[Composer attribute adjustments](../../../compendium/attribute-adjustments.md) and the
[epic contract](EPIC.md). User decisions there override older sprint scope.

## Planning

Planned in [SPRINT-020](../../sprints/SPRINT-020.md), Phase 5: Mount inline gear and explained ranks.
The sprint phase checklist and gate implement this ticket's acceptance criteria.

Completed in [SPRINT-020](../../sprints/SPRINT-020.md). See [execution evidence](../../sprints/SPRINT-020-EVIDENCE.md).
