---
id: BW-1602
title: Workspace State and Persistence
epic: EPIC-16
status: ready
priority: high
depends_on:
  - BW-1601
  - EPIC-09
created: 2026-09-03
updated: 2026-09-03
---

# BW-1602: Workspace State and Persistence

## Goal

Let users create, save, load, and edit build sets locally.

## Scope

- Extend workspace/editor state to hold a selected build set and selected loadout.
- Add reducer actions for creating build sets, adding loadouts, duplicating loadouts, removing
  loadouts, reordering loadouts, renaming entries, and switching the selected loadout.
- Persist build sets through EPIC-09 storage conventions, migrations, backup/restore, and corrupt
  data handling.
- Preserve single-build workflows for users who never create a build set.
- Keep save/update semantics explicit so variants do not accidentally overwrite source builds.

## Out Of Scope

- Backend sync, accounts, collaborative editing, party-specific exports, external team-template
  import/export, and guide records.

## Acceptance Criteria

- Build sets survive reloads through local storage.
- Existing single-build save/load behavior remains compatible.
- Duplicating a loadout creates an independently editable variant.
- Corrupt or unsupported build-set data falls back without breaking the editor.

## Verification

- `npm run test:run -- src/app`
- Focused persistence and reducer tests for build set operations
