---
id: BW-1003
title: Rune Extractors
epic: EPIC-10
status: ready
priority: high
depends_on:
  - BW-1001
  - BW-1002
created: 2026-09-02
updated: 2026-09-02
---

# BW-1003: Rune Extractors

## Goal

Extract normalized rune records from the accepted EPIC-10 source set.

## Scope

- Parse rune names, families, rank variants, profession restrictions, affected attributes, icon
  metadata, source URLs, and revision facts.
- Extract raw effect fields before applying catalog-level semantics.
- Preserve unsupported or ambiguous source fields as typed findings instead of dropping them.
- Add fixtures for profession attribute runes, common health/energy runes, duplicate source names,
  missing icons, and unusual formatting.
- Keep generated runtime records deterministic in ordering and serialization.

## Out Of Scope

- Final stacking calculations, exact-path promotion, armor editor UI, and remote media downloads.

## Acceptance Criteria

- Every fixture rune resolves to a deterministic normalized record or explicit QA disposition.
- Extracted records preserve source identity and enough raw fields for downstream semantic tests.
- Missing icons, malformed effect text, duplicate names, and unknown families produce stable finding
  IDs.
- No source-authored long prose is copied into the runtime catalog by default.

## Verification

- Focused Python extractor tests for EPIC-10 fixtures
- Fixed-clock fixture regeneration for EPIC-10 output
