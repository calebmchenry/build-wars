---
id: BW-1203
title: Upgrade Component and Inscription Sources
epic: EPIC-12
status: done
priority: high
depends_on:
  - BW-1201
planned_sprint: SPRINT-013
completed_sprint: SPRINT-013
created: 2026-09-02
updated: 2026-09-03
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

## Closeout Evidence

- SPRINT-013 added modifier extraction for 9 runtime-eligible weapon modifiers covering prefix,
  suffix, inscription, staff head, staff wrapping, shield handle, focus core, chance, and note-only
  behavior cases.
- Extracted records include page identity, modifier family, occupied slot, applicability,
  raw template modifier crosswalks, raw effect fields, effect completeness inputs, and compact
  provenance.
- Validation passed: EPIC-12 fixture regeneration, focused modifier extractor tests, and selected
  production snapshot replay.
