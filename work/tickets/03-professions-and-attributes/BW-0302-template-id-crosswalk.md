---
id: BW-0302
title: Template ID Crosswalk
epic: EPIC-03
status: done
priority: critical
depends_on:
  - BW-0301
planned_sprint: SPRINT-004
completed_sprint: SPRINT-004
created: 2026-09-01
updated: 2026-09-01
---

# BW-0302: Template ID Crosswalk

## Goal

Extract and validate the profession and attribute indexes used by the Guild Wars skill template format.

## Scope

- Use the Guild Wars Wiki `Skill template format` page as the primary source for profession and attribute template IDs.
- Preserve the profession `0` none sentinel separately from the ten playable profession records.
- Preserve intentional attribute ID gaps, including unused IDs, without compacting or renumbering attributes.
- Emit explicit catalog-to-template and template-to-catalog crosswalk records, even when the first schema version uses equal numeric values.
- Cross-check IDs against the generated skill-ID/template compatibility needs before promotion.
- Store provenance, source revision metadata, and QA findings for every generated crosswalk record.

## Acceptance Criteria

- Template profession IDs map to the ten playable professions plus the `None` sentinel used by template decoding.
- Attribute IDs map to every attribute listed by the template format, including non-contiguous ranges.
- Duplicate IDs, duplicate names, missing IDs, unexpected gaps, and unresolved links produce QA findings instead of silent correction.
- Reverse lookups are collision-safe and do not serialize redundant maps that can drift from the canonical crosswalk records.
- The crosswalk is generated from verified snapshots, not hard-coded in implementation tests.

## Verification

- `npm run verify`
- Offline extractor tests for ordinary rows, the profession none sentinel, non-contiguous attributes, duplicates, malformed rows, and missing targets
