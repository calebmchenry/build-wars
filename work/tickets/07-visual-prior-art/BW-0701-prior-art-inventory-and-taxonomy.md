---
id: BW-0701
title: Prior-Art Inventory And Taxonomy
epic: EPIC-07
status: done
priority: high
depends_on: []
planned_sprint: SPRINT-008
completed_sprint: SPRINT-008
created: 2026-09-02
updated: 2026-09-02
---

# BW-0701: Prior-Art Inventory And Taxonomy

## Goal

Create a complete, reviewable inventory of the existing `prior-art/` screenshot corpus and group it
into UI reference categories that later implementation tickets can cite.

## Scope

- Inventory every tracked screenshot under `prior-art/`, excluding ignored local files such as
  `.DS_Store`.
- Record relative path, source folder, file type, dimensions, and one or more UI categories for each
  screenshot.
- Use categories aligned to EPIC-07: skills panel, skill tooltip, template dialogs, equipment
  panel, weapon sets, party selector, and PvX guide display.
- Identify duplicate or near-duplicate references only as review notes; do not delete, crop, move,
  transform, or add image assets.
- Keep the screenshots as development references under the source policy.

## Acceptance Criteria

- Every current screenshot in `prior-art/` appears exactly once in the inventory.
- Each inventory row has at least one useful UI category and a relative file path.
- The inventory distinguishes development-reference screenshots from runtime assets.
- Later BW-070x tickets can cite the inventory instead of re-discovering files.

## Verification

- `find prior-art -type f -name '*.png' | sort`
- Manual diff check that no image binaries were added, removed, moved, or transformed.

## Completion Evidence

- Added the canonical inventory and taxonomy to
  `compendium/visual-prior-art.md`.
- Confirmed 36 Git-tracked PNG screenshots with folder counts of 27, 5, 2, and 2.
- Verified PNG type and dimensions locally, visually reviewed all rows, and
  preserved duplicate basenames and existing misspellings literally.
- Confirmed `prior-art/` has no Git diff.
