---
id: BW-0902
title: Working Draft Autosave
epic: EPIC-09
status: done
priority: critical
depends_on:
  - BW-0901
planned_sprint: SPRINT-010
completed_sprint: SPRINT-010
created: 2026-09-02
updated: 2026-09-02
---

# BW-0902: Working Draft Autosave

## Goal

Make the current editor draft survive browser reloads without turning every experiment into a saved
library record.

## Scope

- Persist the active EPIC-08 editor state as a working draft inside the versioned local storage
  envelope.
- Restore the working draft on app load when it is valid for the current schema.
- Keep draft autosave separate from the saved build list.
- Preserve unresolved imported IDs and raw template overlay/source data across reload.
- Surface non-blocking warnings when autosave or restore fails.

## Out Of Scope

- Multi-draft history, undo history persistence, cross-tab conflict resolution, saved library
  records, share URLs, and backup/restore UI.

## Acceptance Criteria

- A partially edited build survives a browser refresh.
- The draft is not shown as a saved build unless the user explicitly saves it.
- Invalid stored draft data is skipped without breaking a fresh editor session.
- Storage failure leaves the editor usable in memory.

## Verification

- `npm run verify`
