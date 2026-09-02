---
id: BW-1203
title: Upgrade Component and Inscription Sources
epic: EPIC-12
status: ready
priority: high
depends_on:
  - BW-1201
created: 2026-09-02
updated: 2026-09-02
---

# BW-1203: Upgrade Component and Inscription Sources

## Goal

Resolve and extract weapon upgrade, modifier, and inscription records needed for practical
equipment-template resolution.

## Scope

- Identify source pages or source indexes for prefixes, suffixes, inscriptions, staff heads, staff
  wrappings, shield/offhand modifiers, and caster weapon modifier families.
- Extract names, modifier family, applicable weapon families, requirement or attribute references,
  icon metadata, source URLs, revision facts, and raw effect fields.
- Add fixtures for martial prefixes/suffixes, inscriptions, caster HCT/HSR-style effects, shield and
  focus modifiers, incompatible modifiers, missing icons, and malformed source shapes.
- Preserve unsupported source fields as typed findings instead of dropping them.
- Keep live refresh manual-only, bounded, and replayable through selected snapshots.

## Out Of Scope

- Final compatibility calculations, equipment editor UI, named unique-item exhaustiveness, and
  acquisition data.

## Acceptance Criteria

- Every fixture upgrade or inscription resolves to a deterministic normalized record or explicit QA
  disposition.
- Applicable weapon-family constraints are represented without UI-specific logic.
- Requirement and attribute references map to EPIC-03 facts where possible and preserve unresolved
  facts otherwise.
- Missing or ambiguous source facts produce stable QA finding IDs.

## Verification

- Focused Python extractor tests for EPIC-12 upgrade and inscription fixtures
- Fixed-clock fixture regeneration for EPIC-12 output
