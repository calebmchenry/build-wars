---
id: BW-1305
title: Equipment Shell Docs and Closeout
epic: EPIC-13
status: done
priority: high
depends_on:
  - BW-1302
  - BW-1303
  - BW-1304
planned_sprint: SPRINT-014
completed_sprint: SPRINT-014
created: 2026-09-03
updated: 2026-09-03
---

# BW-1305: Equipment Shell Docs and Closeout

## Goal

Document the EPIC-13 semantic equipment shell, deferred compatibility scope, and EPIC-14 handoff.

## Scope

- Update README, compendium notes, ticket statuses, and sprint records as required by the execution
  sprint.
- Document that EPIC-13 excludes armor skins, weapon skins, dyes, color IDs, acquisition facts, and
  equipment-template-code import/export.
- Record how EPIC-14 should consume armor pieces, headgear, weapon sets, rune IDs, insignia IDs,
  weapon IDs, and weapon modifier IDs.
- Record any source-policy decisions for base armor or headgear facts.
- Confirm existing skill editor, local library, and template compatibility behavior remains
  unchanged.

## Out Of Scope

- Equipment editor UI, runtime icon media approval, party/team equipment, guide authoring, backend
  sync, and raw equipment template import/export workflows.

## Acceptance Criteria

- Downstream docs make the semantic equipment boundary explicit.
- EPIC-14 has a clear implementation handoff and no hidden dye/skin/template-code requirements.
- EPIC-13 is ready to mark done only after verification and docs closeout pass.

## Closeout

- Implemented in SPRINT-014.
- Added `compendium/equipment-shell.md` and updated README, rule-engine, template compatibility,
  rune, insignia, weapon, editor, local-library, compendium index, and fixture notes.
- Confirmed `src/app/catalogs.ts`, leaf UI, share-url payloads, generated data, and template codecs
  were not changed.
- Verified non-null equipment persistence remains deliberately unsupported until EPIC-14.

## Verification

- `npm run verify`
