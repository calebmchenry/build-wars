---
id: BW-1403
title: Searchable Equipment Pickers
epic: EPIC-14
status: ready
priority: high
depends_on:
  - BW-1401
  - BW-1402
created: 2026-09-03
updated: 2026-09-03
---

# BW-1403: Searchable Equipment Pickers

## Goal

Provide precise pickers for selecting runes, insignias, weapons, and weapon modifiers.

## Scope

- Add searchable combobox/select controls for rune, insignia, weapon, and modifier catalogs.
- Filter options by selected build mode, profession, armor slot, weapon family, modifier slot, and
  compatibility where catalog facts support it.
- Include clear empty, no-result, unsupported, and unresolved states.
- Support keyboard navigation, direct text search, clearing a selection, and stable labels.
- Use placeholder icon surfaces or metadata-only icon descriptors until runtime icon work is
  explicitly approved.

## Out Of Scope

- Equipment drag/drop, remote icon fetching, copied source prose, acquisition filters, skin/dye
  filters, and recommendation ranking.

## Acceptance Criteria

- Users can select and clear valid equipment options without typing exact IDs.
- Invalid or incompatible choices are either filtered out or clearly warned according to the
  validation policy.
- Pickers are keyboard accessible and deterministic.
- Catalog option rendering does not fetch remote media.

## Verification

- `npm run test:run -- src/app`
- Focused tests for search, filtering, clearing, unresolved options, and keyboard interaction
