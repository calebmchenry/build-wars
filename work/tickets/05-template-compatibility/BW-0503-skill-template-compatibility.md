---
id: BW-0503
title: Skill Template Import, Resolution, and Export
epic: EPIC-05
status: done
priority: critical
depends_on:
  - BW-0502
planned_sprint: SPRINT-006
completed_sprint: SPRINT-006
created: 2026-09-01
updated: 2026-09-02
---

# BW-0503: Skill Template Import, Resolution, and Export

## Execution Notes

SPRINT-006 added skill template decode/export and pure catalog resolution. Skill documents preserve
raw profession IDs, ordered attribute/rank pairs, exactly eight skill slots, zero sentinels, unknown
IDs, and source fingerprints. Canonical skill export refuses dependency clamps or omissions unless
decode-back equality proves all fields survived.

## Goal

Support Guild Wars skill template import/export while preserving raw authored template IDs and
resolving known facts through the promoted EPIC-03 and EPIC-04 catalogs.

## Scope

- Decode supported skill codes and skill chat wrappers into a loss-aware `SkillTemplateDocument`.
- Preserve primary and secondary template professions, ordered attribute/rank pairs, exactly eight
  template skill slots, zero sentinels, unknown IDs, and dispositioned IDs.
- Add pure catalog resolution using existing `lookupProfessionTemplateId`,
  `lookupAttributeTemplateId`, and `lookupSkillTemplateId` outcomes.
- Keep resolution and future `Build` construction separate; this ticket does not persist imported
  builds, infer mode, or enforce rule legality.
- Export unchanged documents through exact source replay and edited/new documents through canonical
  encode plus decode-back semantic proof.

## Acceptance Criteria

- Known skill template fixtures decode to expected professions, attributes, and eight skill slots.
- Profession `0`, skill slot `0`, known, none, reserved, unsupported, dispositioned, and unknown
  outcomes remain distinguishable.
- Catalog resolution never mutates the source template document or imports generated audit artifacts.
- Any dependency clamp, omission, replacement, or semantic reorder returns `LOSSY_ENCODE` with no
  output code.
- Malformed skill inputs and wrong template kinds return stable typed errors.

## Verification

- `npm run test:run -- test/template-compatibility/skill-template.test.ts test/template-compatibility/catalog-resolution.test.ts test/domain/profession-attribute-catalog.test.ts test/domain/skill-catalog.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
