---
id: BW-1205
title: Equipment Template ID Mapping
epic: EPIC-12
status: done
priority: high
depends_on:
  - EPIC-05
  - BW-1202
  - BW-1203
  - BW-1204
planned_sprint: SPRINT-013
completed_sprint: SPRINT-013
created: 2026-09-02
updated: 2026-09-03
---

# BW-1205: Equipment Template ID Mapping

## Goal

Map verified weapon item and modifier IDs from raw equipment templates to EPIC-12 semantic catalog
records without losing unsupported raw facts.

## Scope

- Use EPIC-05 raw equipment-template fixtures and adapter contracts as the compatibility boundary.
- Add crosswalk records for verified weapon item IDs, modifier IDs, dye/color pass-through facts,
  slot families, and unresolved or unsupported IDs.
- Preserve raw numeric IDs and source fingerprints when semantic lookup is unavailable or ambiguous.
- Add decode/resolve fixtures covering known weapons, known modifiers, unknown item IDs, unknown
  modifier IDs, duplicate/invalid slots, and canonical-export guardrails.
- Document what EPIC-12 maps now and what EPIC-13/14 must still own.

## Out Of Scope

- Replacing the EPIC-05 raw codec, paw-ned2/team templates, equipment editor UI, armor shell IDs,
  rune/insignia IDs, and lossy canonical export.

## Acceptance Criteria

- Verified raw template item/modifier IDs resolve to semantic records where the catalog has enough
  evidence.
- Unknown or unsupported IDs remain visible and preservable for exact-source replay.
- Crosswalk behavior is deterministic and covered by fixtures.
- EPIC-05 skill and raw equipment template compatibility tests remain compatible.

## Verification

- `npm run typecheck`
- Focused Vitest tests for raw equipment template resolution and unresolved-ID preservation
- Existing EPIC-05 equipment-template tests

## Closeout Evidence

- SPRINT-013 added pure catalog lookup helpers for raw `TemplateEquipmentItemId` and
  `TemplateEquipmentModifierId` values, returning known, ambiguous, dispositioned, or unknown
  outcomes without mutating decoded equipment documents.
- Covered known item `279`, known modifiers `190`, `204`, and `329`, dispositioned item `0`,
  dispositioned modifier `290`, ambiguous item `999001`, and unknown future IDs.
- Validation passed: focused template lookup Vitest coverage plus existing raw equipment-template
  exact-source and canonical export guardrails.
