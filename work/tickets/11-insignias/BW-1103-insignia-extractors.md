---
id: BW-1103
title: Insignia Extractors
epic: EPIC-11
status: ready
priority: high
depends_on:
  - BW-1101
  - BW-1102
created: 2026-09-02
updated: 2026-09-02
---

# BW-1103: Insignia Extractors

## Goal

Extract normalized insignia records from the accepted EPIC-11 source set.

## Scope

- Parse insignia names, common/profession-specific family, profession restrictions, slot
  applicability, icon metadata, source URLs, and revision facts.
- Extract raw effect fields before applying slot-scaling or conditional semantics.
- Preserve unsupported or ambiguous source fields as typed findings instead of dropping them.
- Add fixtures for common health/energy insignias, profession-specific armor insignias, conditional
  effects, duplicate source names, missing icons, and unusual formatting.
- Keep generated runtime records deterministic in ordering and serialization.

## Out Of Scope

- Final slot-scaling calculations, exact-path promotion, equipment editor UI, and remote media
  downloads.

## Acceptance Criteria

- Every fixture insignia resolves to a deterministic normalized record or explicit QA disposition.
- Extracted records preserve source identity and enough raw fields for downstream semantic tests.
- Missing icons, malformed effect text, duplicate names, unknown families, and missing restrictions
  produce stable finding IDs.
- No source-authored long prose is copied into the runtime catalog by default.

## Verification

- Focused Python extractor tests for EPIC-11 fixtures
- Fixed-clock fixture regeneration for EPIC-11 output
