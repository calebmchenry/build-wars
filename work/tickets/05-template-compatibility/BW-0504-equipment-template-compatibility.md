---
id: BW-0504
title: Equipment Template Raw Compatibility
epic: EPIC-05
status: done
priority: high
depends_on:
  - BW-0502
planned_sprint: SPRINT-006
completed_sprint: SPRINT-006
created: 2026-09-01
updated: 2026-09-02
---

# BW-0504: Equipment Template Raw Compatibility

## Execution Notes

SPRINT-006 added raw equipment template decode/export for deterministic slot, item, color, and
modifier facts. Equipment remains raw-only with no semantic catalog joins. Exact replay preserves
dependency-surfaced raw imports that the vendor cannot canonically re-add; canonical export is
accepted only after decode-back field equality.

## Goal

Support raw Guild Wars equipment template import/export without pretending that deferred armor,
rune, insignia, weapon, modifier, or dye catalogs already exist.

## Scope

- Decode supported equipment codes and equipment chat wrappers into raw slot, item, color, and
  modifier facts surfaced by the qualified dependency.
- Normalize dependency object-key ordering into deterministic adapter-owned ordering.
- Preserve raw numeric template facts separately from the existing semantic `EquipmentTemplate`
  contract.
- Export unchanged equipment templates exactly when the source fingerprint still matches.
- Export edited/new raw equipment documents only after canonical encode and decode-back field
  equality prove no slot, item, color, or modifier data was lost.

## Acceptance Criteria

- Known equipment fixtures round-trip at the raw field level.
- Unsupported, unmodeled, or dependency-nonencodable facts are preserved by exact source replay or
  rejected with typed errors; they are not silently dropped.
- Version 1 exposes no semantic equipment projection or invented catalog joins.
- Duplicate slots, item-to-slot disagreements, filtered modifiers, invalid colors, wrong kinds, and
  malformed codes are covered by tests.

## Verification

- `npm run test:run -- test/template-compatibility/equipment-template.test.ts test/template-compatibility/chat-code.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
