---
id: BW-1902
title: Authored State and Draft Persistence
epic: EPIC-19
status: done
priority: high
planned_sprint: SPRINT-020
completed_sprint: SPRINT-020
depends_on:
  - BW-1901
created: 2026-09-13
updated: 2026-09-14
---

# BW-1902: Authored State and Draft Persistence

## Goal

Add durable compact equipment and effect preferences to the selected authored build, with backward-compatible persistence.

## Scope

- Extend the domain Build contract, blank/imported constructors, reducer actions, and all explicit clone/copy paths. Store choices, not effective ranks or inferred checkbox booleans.
- Version the Build schema and migrate v1/v2 snapshots with neutral defaults. Keep the existing storage key; retain envelope compatibility unless an explicit migration is needed.
- Extend strict parsing and serialization for nullable gear profiles, bounded rune selections, effect identities/preferences, and Heroic Refrain strength. Handle malformed/unknown/duplicate data without silently accepting partial settings.
- Include new choices in authored dirty/revision fingerprints but exclude them from the standard skill-template field fingerprint.
- Preserve adjustments through autosave/pagehide, hydration, duplicate/variant/selected-loadout switching, saved-record internals, backups, and build-set/party transfer. Do not mount new library or party UI.
- Preserve storage conflict, quota, corruption, unsupported-version, and write-blocking behavior. Neutral state must not materialize unrelated equipment.

## Acceptance Criteria

- Reload restores explicit choices and recomputes automatic effects from the current bar.
- Older local data migrates without losing equipment, title ranks, raw template overlays, or nested loadouts.
- New data is retained by every explicit clone/serializer, and future unsupported schemas remain protected.
- Adjustments dirty only the addressed loadout; UI-only disclosure changes do not.

## Verification

Focused domain/reducer, persistence-schema, local-storage, workspace, backup, and transfer tests using non-default settings and old-format fixtures.

## Design Authority

[Composer attribute adjustments](../../../compendium/attribute-adjustments.md) and the
[epic contract](EPIC.md). User decisions there override older sprint scope.

## Planning

Planned in [SPRINT-020](../../sprints/SPRINT-020.md), Phase 2: Author, migrate, and preserve settings.
The sprint phase checklist and gate implement this ticket's acceptance criteria.

Completed in [SPRINT-020](../../sprints/SPRINT-020.md); see [execution evidence](../../sprints/SPRINT-020-EVIDENCE.md). Non-default profiles survive shared clone, nested transfer, storage, autosave, and pagehide paths. Build, lint, and all 542 tests pass.
