---
id: BW-0906
title: Library Backup and Restore
epic: EPIC-09
status: done
priority: high
depends_on:
  - BW-0901
  - BW-0903
planned_sprint: SPRINT-010
completed_sprint: SPRINT-010
created: 2026-09-02
updated: 2026-09-02
---

# BW-0906: Library Backup and Restore

## Goal

Provide explicit whole-library backup and restore using a versioned JSON envelope.

## Scope

- Export a whole-library JSON backup containing schema version, exported timestamp, saved builds,
  optional working draft, storage metadata, and catalog/version facts.
- Import a backup through shape validation and schema-version checks.
- Preview backup counts and restore impact before applying changes.
- Support merge and replace restore modes with explicit confirmation.
- Skip invalid records and show a restore report.
- Preserve local IDs where safe, and generate new IDs for conflicts during merge.

## Out Of Scope

- Single-build JSON exchange as a normal user workflow, remote backup, file-system persistence beyond
  browser download/upload controls, encryption, compression, cloud sync, telemetry, and network
  recovery.

## Acceptance Criteria

- Users can recover their saved library from an exported backup.
- Restore never overwrites the existing library without explicit confirmation.
- Invalid or unsupported records are reported, not silently imported.
- Backup JSON contains no HTML, executable content, remote media bytes, screenshots, or generated
  audit artifacts.

## Verification

- `npm run verify`
