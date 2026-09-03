---
id: BW-1407
title: Validation, Persistence, and Sharing
epic: EPIC-14
status: ready
priority: high
depends_on:
  - BW-1404
  - BW-1405
  - BW-1406
  - EPIC-06
  - EPIC-09
created: 2026-09-03
updated: 2026-09-03
---

# BW-1407: Validation, Persistence, and Sharing

## Goal

Integrate equipment with validation, local saves, backup/restore, and existing share boundaries.

## Scope

- Surface equipment validation issues inline and through the existing validation panel.
- Persist equipment as part of saved builds and working-draft autosave.
- Include equipment in native backup/restore JSON.
- Preserve skill-template import/export and share URLs as skill-template-first workflows.
- Warn when equipment is present but a share/export path cannot represent it.
- Keep unknown or unresolved equipment recoverable after save/load.

## Out Of Scope

- Guild Wars equipment template-code import/export, hosted sharing, backend sync, short links,
  equipment presets, party sharing, and external team-template formats.

## Acceptance Criteria

- Equipment survives reload when saved or autosaved.
- Backup/restore preserves equipment state and reports invalid records.
- Validation messages are located on the relevant armor slot or weapon set when possible.
- Existing skill-template share behavior remains compatible and honest about equipment omission.

## Verification

- `npm run test:run -- src/app src/domain`
- Focused tests for equipment validation presentation, local persistence, backup/restore, and share
  boundary warnings
