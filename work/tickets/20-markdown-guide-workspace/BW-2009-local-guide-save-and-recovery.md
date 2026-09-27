---
id: BW-2009
title: Local Guide Save and Recovery
epic: EPIC-20
status: in_progress
planned_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2003
  - BW-2008
created: 2026-09-26
updated: 2026-09-27
---

# BW-2009: Local Guide Save and Recovery

## Goal

Make guides durable locally without damaging existing build data or losing an unfinished source edit.

## Scope

- Extend the strict persisted-document envelope with a versioned guide form and backward migration for existing library schemas/build/build-set drafts.
- Audit materialization, clone, dirty fingerprint, autosave/pagehide, named save/open, backup/export and restore/import branches for the new document kind.
- Expose a minimal named guide Save/Open surface using existing storage mechanisms; opening/replacing honors current dirty/conflict behavior.
- Persist all embedded snapshots, stable bindings, guide metadata, last-valid document and recoverable unapplied/invalid source draft. Keep transient focus and undo history out unless explicitly justified.
- Retain existing storage quota/denial, corruption, newer-schema and cross-tab conflict protection without writing on read or destroying rejected payloads.
- Keep game-folder template files separate from guide Markdown and provide a download/export path if browser persistence is unavailable.

## Acceptance Criteria

- Named Save/Open and reload restore supported guide state and unfinished source without cross-build drift.
- Existing standalone/build-set/party records and working drafts survive migration and mixed-document backup/restore; migration does not dirty or rewrite on read.
- Blocked/failed storage is visible and recoverable; a failed save never reports successful durability or overwrites a recoverable newer/corrupt payload.
- Guide actions are reachable without mounting obsolete general equipment/library tool panels.
- Missing/unavailable catalogs retain recoverable guide text and stored IDs, with dependent editing disabled rather than document replacement or loss.

## Verification

Add old/new/mixed schema fixtures and storage failure, conflict, backup/restore and active-snapshot tests. Browser evidence covers named save/open, reload, invalid-source recovery and an export fallback under unavailable storage.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 9.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Execution progress

Implementation and focused/full automated validation are present in SPRINT-021. Own durability/browser evidence is recorded in [Phase 9](../../sprints/evidence/SPRINT-021/phase9.md). Acceptance remains in progress while the required upstream BW-2008 file-upload gate is unresolved; no dependent completion is claimed.

## Final SPRINT-021 execution record

Implementation and completed checks are linked in the [final acceptance matrix](../../sprints/evidence/SPRINT-021/phase12.md). Own durability criteria passed with actual and explicitly labeled fault-injection evidence. Acceptance remains in progress because required browser file uploads/reimports and incoming ticket gates are open. The [upload permission gap](../../sprints/evidence/SPRINT-021/upload-permission-gap.md) is separate from native composition, which remains unverified/deferred by user decision. No completion or commit is claimed.
