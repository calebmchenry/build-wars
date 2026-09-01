---
id: BW-0301
title: Profession and Attribute Catalog Contract Extensions
epic: EPIC-03
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-004
completed_sprint: SPRINT-004
created: 2026-09-01
updated: 2026-09-01
---

# BW-0301: Profession and Attribute Catalog Contract Extensions

## Goal

Extend the framework-neutral domain catalog contracts so generated profession and attribute data can represent the full EPIC-03 catalog without UI-specific logic.

## Scope

- Add durable fields for profession template IDs, abbreviations, campaign availability, primary attribute ownership, and metadata-only icons.
- Add durable fields for attribute template IDs, profession ownership, primary-only restrictions, and inherent primary-effect summaries.
- Add contract shapes for attribute point costs, level-based point totals, attribute quest rewards, and default level-20 assumptions.
- Add distinct template-ID contract types and crosswalk records instead of relying on catalog ID equality by convention.
- Keep sentinel template values such as profession `0` representable by template decoding code without treating them as real playable catalog records.
- Add an early source-shape checkpoint for the EPIC-03 profile so contracts are frozen against verified source structures rather than planning assumptions.

## Acceptance Criteria

- `src/domain` remains plain-data and framework-neutral.
- Existing build, skill, equipment, party, and guide contracts remain backward-compatible or are migrated with focused tests.
- Unknown numeric IDs remain representable and JSON round-trip correctly.
- Profession template ID `0`, attribute template ID `0`, known IDs, and unknown IDs remain distinct in tests and serialized crosswalk data.
- Existing EPIC-02 fixture output remains compatible after any profile-registration changes.
- No domain contract imports React, DOM/browser APIs, storage, network clients, app modules, or data scripts.

## Verification

- `npm run verify`
- Focused Vitest coverage for the new catalog contract shapes and JSON serialization
