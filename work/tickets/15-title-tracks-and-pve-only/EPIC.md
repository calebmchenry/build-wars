---
id: EPIC-15
title: Title Rank Controls and PvE-only
track: functional
status: done
priority: high
depends_on:
  - EPIC-04
  - EPIC-06
  - EPIC-08
  - EPIC-09
planned_sprint: SPRINT-016
completed_sprint: SPRINT-016
tickets:
  - BW-1501
  - BW-1502
  - BW-1503
  - BW-1504
  - BW-1505
updated: 2026-09-03
---

# Title Rank Controls and PvE-only

## Goal

Let title-scaled skills default to maximum title rank while giving users simple controls to lower
title ranks when they want more accurate build output.

## Scope

* Build/editor state for title ranks referenced by selected skills.
* Default title-rank behavior: use the maximum rank from EPIC-04 progression metadata.
* Compact rank controls using stepper/number input, with min/max clamping.
* Tooltip rendering that uses selected title ranks instead of a hidden maximum-rank assumption.
* Validation cleanup for title-rank deferrals, PvE-only skill limits, and unresolved title metadata.
* Optional expanded title-rank controls for users who want to configure ranks before selecting
  skills.
* Minimal handling for allegiance-ranked skills without making account-wide title ownership a
  requirement.

## Done When

* Title-scaled skill descriptions default to max rank and update when the user changes that rank.
* Users can adjust relevant title ranks with precise integer controls.
* The editor no longer shows max-title-rank assumption copy for configured title dependencies.
* PvE-only skill validation remains clear and does not require a broad title catalog.

## Notes

This should be a small UX/state epic. Use the EPIC-04 skill catalog's title-rank progression
metadata first; do not create a separate title ingestion pipeline unless implementation proves the
skill catalog cannot identify the needed rank keys and ranges.

## Grooming Decisions

* EPIC-15 does not catalog account title progression, title acquisition, reputation farming,
  campaign unlocks, guide prose, or broad title history.
* Default every discovered title-rank dependency to its maximum rank from EPIC-04 `rankDomain`.
* Store only user overrides from max when practical. If the user never edits a title rank, max-rank
  behavior should remain implicit and durable.
* Prefer compact stepper/number controls over sliders because ranks are discrete integers and users
  commonly know the exact rank they want to enter.
* Show controls for title ranks relevant to the current skill bar first. An "all title ranks" view
  can exist, but it should not dominate the editor.
* Normalize title dependency keys from EPIC-04 into user-facing labels and stable authored state
  keys. Known aliases such as duplicate Sunspear key forms should resolve to one user-facing
  control.
* Treat allegiance as rank-first for MVP. Add a small side/exclusivity control only if selected
  skills need it for clear validation; otherwise keep side-specific legality as a narrow warning or
  follow-up.
* PvE-only skill count validation already exists. EPIC-15 should preserve that behavior and only
  refine presentation or title-specific gaps.

## Ticket Breakdown

* `BW-1501`: Title rank state, default-max semantics, key normalization, and persistence shape.
* `BW-1502`: Compact title rank controls with relevant-title and optional all-title views.
* `BW-1503`: Tooltip and skill-display integration using selected title ranks.
* `BW-1504`: Title/PvE-only validation cleanup, allegiance warnings, and browser filter handoffs.
* `BW-1505`: Docs, tests, deferred scope, and closeout.

## Completion Evidence

- SPRINT-016 completed BW-1501 through BW-1505.
- Title-scaled skill descriptions now default to implicit max rank, update from per-build title
  overrides, and feed browser rows, skill-bar slots, pinned tooltips, progression labels, validation,
  local persistence, backup/restore, and workspace fingerprints.
- The editor exposes compact relevant title controls plus an all-title disclosure. Resolved title
  dependencies no longer show maximum-title assumption copy.
- `RULE_ENGINE_VERSION` is `rule-engine:v3`; generic title/allegiance deferrals were replaced with
  narrow located warnings, while PvE-only skill-count validation remains unchanged.
- Share URLs and skill-template bytes remain title-free and warn when authored title overrides are
  omitted.
- Validation passed: `npm run typecheck`, focused title/persistence/share/rule-engine Vitest
  coverage, `npm run test:run -- src/app test/domain`, final `npm run verify`, and
  `git diff --check`.
