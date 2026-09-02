---
id: BW-1202
title: Weapon Base-Type Source Resolution and Extractors
epic: EPIC-12
status: ready
priority: high
depends_on:
  - BW-1201
created: 2026-09-02
updated: 2026-09-02
---

# BW-1202: Weapon Base-Type Source Resolution and Extractors

## Goal

Resolve and extract weapon base-type records needed for practical equipment modeling.

## Scope

- Identify source pages or source indexes for player-usable weapon families and PvP template
  equipment base types.
- Extract names, family, handedness, requirement attributes, damage ranges, damage types, campaign or
  mode availability where relevant, display metadata, source URLs, and revision facts.
- Add fixtures for martial one-handed weapons, two-handed weapons, bows, caster weapons, shields,
  focuses, unknown requirements, and malformed source shapes.
- Preserve unsupported source fields as typed findings instead of dropping them.
- Keep generated runtime records deterministic in ordering and serialization.

## Out Of Scope

- Upgrade component extraction, equipment editor UI, named skin exhaustiveness, and acquisition data.

## Acceptance Criteria

- Every fixture weapon base type resolves to a deterministic normalized record or explicit QA
  disposition.
- Requirement attributes map to EPIC-03 attributes where possible and preserve unresolved facts
  otherwise.
- Damage and handedness facts are represented without UI-specific logic.
- Missing source facts produce stable QA finding IDs.

## Verification

- Focused Python extractor tests for EPIC-12 weapon fixtures
- Fixed-clock fixture regeneration for EPIC-12 output
