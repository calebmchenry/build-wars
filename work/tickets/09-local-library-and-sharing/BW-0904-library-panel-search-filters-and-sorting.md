---
id: BW-0904
title: Library Panel Search Filters and Sorting
epic: EPIC-09
status: ready
priority: high
depends_on:
  - BW-0903
created: 2026-09-02
updated: 2026-09-02
---

# BW-0904: Library Panel Search Filters and Sorting

## Goal

Expose saved builds through a compact local library panel integrated with the EPIC-08 editor.

## Scope

- Add a desktop side panel beside the current editor that can collapse on narrower screens.
- Show saved build name, profession pair, mode, updated date, favorite marker, tags, and basic
  validation/freshness status where available.
- Support text search by build name and skill names.
- Support filters by profession, mode, favorite, and tag.
- Support sorting by updated date, name, and profession pair.
- Selecting a build loads it into the working draft without losing unresolved raw IDs.

## Out Of Scope

- Routing, multi-page app shell, folders, backend search, guide/community search, party library,
  fuzzy relevance ranking, and virtualized large-list infrastructure unless needed by measured
  local performance.

## Acceptance Criteria

- A user can find, select, and manage saved builds from the editor screen.
- Search/filter/sort results are deterministic and covered by tests.
- Narrow screens can still access library actions without broken layout.
- No network or backend dependency is introduced.

## Verification

- `npm run verify`
