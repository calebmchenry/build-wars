---
id: BW-0804
title: Skill Browser Search Filters and Views
epic: EPIC-08
status: done
priority: high
depends_on:
  - BW-0801
  - BW-0802
planned_sprint: SPRINT-009
completed_sprint: SPRINT-009
created: 2026-09-02
updated: 2026-09-02
---

# BW-0804: Skill Browser Search Filters and Views

## Goal

Build the skill browser used to find skills for the active build.

## Scope

- Search by skill name.
- Filter by profession, attribute, skill type, elite/non-elite, and PvE/PvP/both availability.
- Add cheap resource filters where existing catalog fields support them without new data work:
  energy, adrenaline, sacrifice, upkeep, and overcast.
- Support list, small-grid, and large-grid views.
- Group by attribute by default, with optional sort by name or type.
- Include empty, no-result, loading, and error states owned by Build Wars rather than inferred from
  screenshots.

## Out Of Scope

- Full recommendation logic, fuzzy relevance ranking, community metadata search, guide search,
  backend search, icon fetching, and equipment search.

## Acceptance Criteria

- Browser results update deterministically as filters change.
- Views preserve stable row/tile/icon dimensions and do not shift layout unexpectedly.
- The browser can place a selected skill into the active skill bar through EPIC-08 placement flows.
- Search/filter state is test-covered for common and no-result cases.

## Verification

- `npm run verify`

## Completion Evidence

Completed in `SPRINT-009`. The skill browser implements deterministic search, profession,
attribute, type, elite, availability, and resource-state filters with attribute/name/type grouping
and list/small-grid/large-grid bounded rendering.
