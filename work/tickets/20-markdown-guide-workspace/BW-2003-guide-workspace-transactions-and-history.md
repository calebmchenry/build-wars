---
id: BW-2003
title: Guide Workspace Transactions and History
epic: EPIC-20
status: done
completed_sprint: SPRINT-021
planned_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2002
created: 2026-09-26
updated: 2026-09-27
---

# BW-2003: Guide Workspace Transactions and History

## Goal

Make one guide document own all edits while keeping active editing selection separate from saved content and reference context.

## Scope

- Introduce guide workspace state alongside current build/build-set documents, with explicit active build and independent text insertion/selection state.
- Route prose changes, build reducer results, imports, duplicate/delete/reorder and source Apply through guide transactions. Materialize active build state consistently for validation, export, persistence and history.
- Implement chronological bounded undo/redo spanning prose and build edits, with meaningful typing/gesture grouping. UI-only changes must not dirty the document.
- Handle deleting referenced builds, fresh identities for duplicates, independent copied snapshots and reference-aware fragment ID remapping.
- Define stable insertion bookmarks across catalog focus, no selected build, document changes and source-mode transitions. Invalidate stale targets instead of redirecting to the current selection.
- Add the recovery-state contract for last-valid guide plus unapplied raw source; durable storage is completed in BW-2009.

## Acceptance Criteria

- Two embedded variants can be edited and switched repeatedly without cross-contamination or stale materialized state.
- Undo/redo restores a chronological prose → slot → attribute → delete sequence with its build IDs, raw overlays and references intact.
- Switching selected cards or catalog filters changes no persisted reference binding and creates no history entry.
- Copying a build is independent; deleting/undoing a referenced build and cross-document fragment insertion follow the documented identity rules.

## Verification

Exercise reducers/transactions and dirty fingerprints with multi-variant sequences, delete/undo, remapping, canceled/stale commands, unapplied source, and existing standalone/build-set workspace regressions.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 3.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Completion

Completed in [SPRINT-021](../../sprints/SPRINT-021.md). [Phase 3 evidence](../../sprints/evidence/SPRINT-021/phase3.md) covers complete snapshot transactions, source recovery, chronological history, clipboard remapping and the temporary v2 write guard.
