---
id: BW-0702
title: Skills And Attributes Visual Notes
epic: EPIC-07
status: done
priority: high
depends_on:
  - BW-0701
planned_sprint: SPRINT-008
completed_sprint: SPRINT-008
created: 2026-09-02
updated: 2026-09-02
---

# BW-0702: Skills And Attributes Visual Notes

## Goal

Extract factual visual notes from the skills, attributes, skill-bar, profession-selector, skill-list,
and skill-grid references needed by the core build editor.

## Scope

- Cover the skills-and-attributes screenshots in `prior-art/gw-skills-and-attributes-refs/`.
- Record typography, color families, borders, spacing, icon treatment, control density, selected
  states, disabled or empty states, and row/grid behavior where visible.
- Separate observations about the full panel, attributes section, skill bar, skills menu, skill
  rows, small grid, large grid, profession selector, and display menu controls.
- Tie every note to one or more screenshot paths.
- Avoid copied in-game UI text except short factual labels needed to identify a screenshot region.

## Acceptance Criteria

- The notes identify reusable style targets for the EPIC-08 profession, attribute, skill-bar,
  skill-list, and skill-grid surfaces.
- Each observation includes screenshot evidence paths.
- Notes stay factual and implementation-neutral rather than prescribing React component code.
- Any ambiguity is marked as a gap or assumption instead of guessed.

## Verification

- Manual screenshot review against the BW-0701 inventory.
- Manual source-policy check that screenshots remain development references and no runtime media is
  introduced.

## Completion Evidence

- Added EPIC-08 core editor observations `VP-OBS-001` through `VP-OBS-010` to
  `compendium/visual-prior-art.md`.
- Covered skills panel, attributes, profession selector, skill bar, skills menu,
  list rows, small grid, and large grid with path-backed visible facts and
  limitations.
- Recorded focus, responsive, loading/error, empty-search, and inline-validation
  gaps as EPIC-08 implementation-owned.
