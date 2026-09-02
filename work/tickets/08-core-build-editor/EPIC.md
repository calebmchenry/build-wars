---
id: EPIC-08
title: Core Build Editor
track: functional
status: done
priority: high
depends_on:
  - EPIC-00
  - EPIC-05
  - EPIC-06
  - EPIC-03
  - EPIC-04
  - EPIC-07
planned_sprint: SPRINT-009
completed_sprint: SPRINT-009
tickets:
  - BW-0801
  - BW-0802
  - BW-0803
  - BW-0804
  - BW-0805
  - BW-0806
  - BW-0807
  - BW-0808
updated: 2026-09-02
---

# Core Build Editor

## Goal

Build the main single-character editing experience for professions, attributes, skills, validation, and skill template codes.

## Scope

* Primary and secondary profession selector.
* Attribute editor with remaining points, level, and attribute quest toggles.
* Eight-slot skill bar with empty-slot support and reordering.
* Skill search, filters, list view, small grid view, and large grid view.
* Skill tooltip/display matching the captured in-game references.
* Import/export skill template code controls.
* Inline validation messages from the rule engine.

## Done When

* A user can create, edit, validate, import, and export a playable skill bar.
* Dynamic skill descriptions reflect effective attribute or title rank.
* Keyboard/mouse interactions are usable on desktop.
* Layout does not depend on hard-coded screenshot dimensions.

## Grooming Decisions

* EPIC-08 is in-memory only. Local build library, storage migrations, tags, favorites, backup,
  restore, and share URLs remain in `EPIC-09`.
* App code consumes promoted EPIC-03 and EPIC-04 catalog JSON through one app-side catalog boundary.
  UI components must not import generated files directly.
* Runtime app code may import only promoted catalog JSON. It must not import generated manifests, QA
  reports, source plans, source snapshots, Python ingestion modules, or wiki APIs.
* Source-derived catalog facts require minimal visible attribution in the UI before they are shown.
* Remote wiki icon URLs are not fetched automatically in EPIC-08. The editor renders stable
  placeholder icon slots so later icon work does not require layout redesign.
* Title-rank controls are out of scope. Title-scaled skill text uses a max-title-rank display
  assumption until `EPIC-15` adds title-rank ownership and configuration.
* Imported templates preserve unresolved raw IDs, show unresolved placeholders and warnings, and
  retain exact-source re-export while the imported template remains semantically unchanged.
* Skill bar placement, swapping, reordering, and clearing should follow the game-like drag-and-drop
  interaction model, with keyboard-accessible alternatives.
* Search/filter MVP includes text search, profession, attribute, skill type, elite, PvE/PvP/both,
  and cheap resource filters where catalog data already supports them. The browser includes list,
  small-grid, and large-grid views, grouped by attribute by default.
* Validation UI includes a compact global summary and inline located issues. Warnings, incomplete
  states, and unresolved imports do not automatically block editing. Canonical export blocks on
  proven errors or lossy encode failures.
* Visual implementation is desktop-browser-first, prior-art-informed, and not pixel-perfect. Narrow
  screens, keyboard focus, loading, empty, error, and dialog overflow states are implementation-owned
  EPIC-08 requirements.

## Ticket Breakdown

* `BW-0801`: App catalog boundary, attribution, privacy, and placeholder icon policy.
* `BW-0802`: In-memory editor state model and fixtures.
* `BW-0803`: Profession, mode, and attribute editor.
* `BW-0804`: Skill browser search, filters, grouping, and list/grid views.
* `BW-0805`: Game-like drag/drop skill bar placement, swap, reorder, clear, and keyboard
  alternatives.
* `BW-0806`: Skill display and tooltip text with max-title-rank assumption.
* `BW-0807`: Template import/export dialogs and unresolved ID preservation.
* `BW-0808`: Validation presentation, responsive polish, verification, and closeout.

## Notes

This is the likely MVP surface. It should be useful before equipment, guides, or team builds are complete.

## Completion Evidence

Completed in `SPRINT-009`. The shipped editor supports one in-memory single-character build with
catalog attribution, profession/mode controls, PvE attribute budgeting, deterministic skill browser
filters, eight-slot pointer and keyboard skill-bar operations, shared skill display/tooltips,
validation presentation, and skill-template import/export with exact-source and canonical policy
gates. Final validation: `npm run verify`.
