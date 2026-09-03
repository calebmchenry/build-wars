---
id: EPIC-18
title: Focused Build Composer
track: functional
status: done
priority: critical
planned_sprint: SPRINT-019
completed_sprint: SPRINT-019
depends_on:
  - EPIC-03
  - EPIC-04
  - EPIC-05
  - EPIC-06
  - EPIC-07
  - EPIC-08
tickets:
  - BW-1801
  - BW-1802
  - BW-1803
  - BW-1804
  - BW-1805
  - BW-1806
  - BW-1807
  - BW-1808
  - BW-1809
created: 2026-09-03
updated: 2026-09-03
---

# Focused Build Composer

## Goal

Refocus the primary app experience around the simplest high-value workflow:
creating a single build, editing it in a Guild Wars-inspired WYSIWYG composer,
and importing or exporting the skill template code inline.

## Scope

- Replace the crowded first-screen editor with a focused two-panel composer.
- Make the left panel the live build surface: profession icons, editable build
  name, attribute allocation, skill bar, and template code.
- Make the right panel a catalog surface, beginning with a skills tab filtered
  by the active professions and grouped by attribute.
- Use in-game-inspired visual language for profession selection, attribute
  controls, skill slots, skill drag previews, and skill/resource icons.
- Preserve existing domain, catalog, template, validation, and editor reducer
  behavior where it still serves the focused workflow.
- Defer armor, weapons, runes, insignias, saved build management, party tools,
  build guides, broad discovery, and advanced analysis from the primary
  milestone experience.

## Done When

- A user can create a build from the first screen without navigating through
  unrelated workspace, equipment, library, party, or guide concepts.
- A user can pick primary and secondary professions through icon-based controls
  and edit the build name inline.
- Attribute rows show refund cost, investment cost, rank, and attribute name
  using the current point-budget rules.
- The skill bar supports drag placement, replacement, reordering, removal, and
  one-elite enforcement with visible icon drag feedback.
- The template code is visible inline, copyable, and paste/import updates the
  composer state.
- The skill catalog starts as a compact skills tab filtered by selected
  professions, grouped by attribute, and displayed with relevant costs, cast
  time, and recharge.
- The focused composer is covered by reducer, selector, component, and workflow
  tests appropriate to the interaction risk.

## Grooming Decisions

- This epic is a product pivot on top of completed EPIC-08 work, not a reopening
  of EPIC-08's historical scope.
- The focused composer should simplify the default experience without deleting
  useful completed domain capabilities.
- The "Any" profession option is a composer/filtering convenience. Template
  export still requires compatibility with concrete Guild Wars template
  semantics unless a supported template representation says otherwise.
- Attribute state should keep allocated rank separate from effective rank so
  later rune, headgear, and equipment work can plug in cleanly.
- Real icons should be cached as local/static assets or generated catalog
  references, not hot-linked from wiki pages at runtime.

## Ticket Breakdown

- `BW-1801`: Product use-case doc, information architecture, and scope reset.
- `BW-1802`: Two-panel composer shell and first-screen simplification.
- `BW-1803`: Build header with profession icon pickers and editable name.
- `BW-1804`: In-game-style attribute allocation editor.
- `BW-1805`: Skill bar drag/drop refinement and one-elite enforcement.
- `BW-1806`: Inline template import, export, paste, and copy controls.
- `BW-1807`: Skill catalog tab with profession filtering and attribute grouping.
- `BW-1808`: Runtime icon assets and in-game visual polish.
- `BW-1809`: Verification, documentation updates, and closeout.

## Planning

Planned in `SPRINT-019`. Execution should preserve completed editor, template, library, equipment,
build-set, party, validation, backup, restore, and transfer behavior while making the focused
single-build composer the primary first-screen workflow.

## Closeout Evidence

- Completed in `SPRINT-019`.
- Implemented a composer-first app shell with active-loadout header, focused attributes, shared
  skill-bar placement policy, inline template controls, and right-panel Skills catalog.
- Preserved library, build-set, party, equipment, title-rank, sharing, validation, backup, restore,
  transfer, and modal template workflows behind keyboard-reachable secondary tools.
- Documented naming, Any semantics, selected-loadout boundaries, asset-policy outcome, and deferred
  scope in README and compendium records.
- Validation evidence: `npm run test:run -- src/app test/domain test/template-compatibility`,
  `npm run verify`, and `git diff --check`.

## Notes

Later milestones can reintroduce deferred capabilities as separate use cases:
equipment editing, saved build storage, party/team workflows, guide authoring,
search/discovery, and advanced analysis.
