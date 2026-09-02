---
id: BW-0704
title: Equipment, Party, And Guide Reference Notes
epic: EPIC-07
status: done
priority: medium
depends_on:
  - BW-0701
planned_sprint: SPRINT-008
completed_sprint: SPRINT-008
created: 2026-09-02
updated: 2026-09-02
---

# BW-0704: Equipment, Party, And Guide Reference Notes

## Goal

Document the non-MVP visual references that will guide equipment editing, weapon-set display, party
selection, hero display, and PvX-style guide presentation in later epics.

## Scope

- Cover `prior-art/gw1-equipment-panel/`, `prior-art/gw1-weapon-sets/`, PvX guide screenshots, and
  party/hero references under `prior-art/gw-skills-and-attributes-refs/`.
- Record equipment panel layout, slot/icon treatment, weapon-set tabs or selectors, item tooltip
  hierarchy, party selector density, hero-selected state, and PvX guide display conventions.
- Call out what is useful for EPIC-14, EPIC-17, EPIC-18, and EPIC-19 without pulling that
  implementation into this sprint.
- Tie observations to screenshot paths and mark missing rune, insignia, upgrade, and full party
  references explicitly.
- Do not import PvX guide prose or community build content into runtime data.

## Acceptance Criteria

- Later equipment, party, and guide tickets have factual visual references without needing to repeat
  prior-art discovery.
- Non-MVP notes are clearly separated from the EPIC-08 core build-editor references.
- PvX references are treated as development references and linked path evidence only.
- Remaining screenshot gaps are named with enough specificity to capture later.

## Verification

- Manual screenshot review against the BW-0701 inventory.
- Manual source-policy review for PvX/community content and screenshot development-reference limits.

## Completion Evidence

- Added deferred-surface observations `VP-OBS-019` through `VP-OBS-024` to
  `compendium/visual-prior-art.md`.
- Mapped equipment and weapon evidence to EPIC-13/14, party and hero evidence to
  EPIC-17, and PvX structural references to EPIC-18/19.
- Cited both `hero-selected.png` files by full path and kept PvX notes
  structural only.
