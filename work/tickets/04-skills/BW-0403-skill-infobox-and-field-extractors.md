---
id: BW-0403
title: Skill Infobox and Field Extractors
epic: EPIC-04
status: done
priority: critical
depends_on:
  - BW-0401
  - BW-0402
planned_sprint: SPRINT-005
completed_sprint: SPRINT-005
created: 2026-09-01
updated: 2026-09-02
---

# BW-0403: Skill Infobox and Field Extractors

## Goal

Extract core skill catalog fields from verified skill page snapshots, preserving structured facts and provenance without relying only on rendered wiki descriptions.

## Scope

- Parse `Skill infobox` templates for name, campaign, profession, attribute, type, costs, activation, recharge, image, elite/common flags, PvE/PvP flags, and special classifications.
- Normalize profession and attribute references through the approved EPIC-03 catalog and crosswalk contracts.
- Preserve raw structured description fields and policy-safe rendered or normalized description fields needed for tooltips and search.
- Resolve metadata-only skill icons with `cachedBytes: false`; do not download, cache, bundle, or commit icon bytes.
- Keep acquisition metadata out of schema v1; guide-specific acquisition facts require a later bounded guide-authoring ticket.
- Emit candidate rows and diagnostics for missing infoboxes, malformed costs, unknown professions, unknown attributes, unknown skill types, ambiguous flags, copied-text risk, and missing icon metadata.
- Add fixtures for elite, signet, adrenaline, sacrifice, upkeep, overcast, title, no-attribute, common, PvE-only, PvP-only, special skills, missing costs, and malformed infobox rows.

## Acceptance Criteria

- Core skill records are generated from structured source fields with field-level provenance.
- Cost fields distinguish absent, zero, not-applicable, numeric, percent, and special template values.
- Skills with no attribute, title attributes, or special non-player behavior do not break profession/attribute normalization.
- Tooltips and search can consume catalog fields without importing raw snapshots or parser output.
- Icon records remain metadata-only and nullable with QA disposition.
- Potential copied prose is either excluded, normalized into factual structured values, or explicitly reviewed under source policy.
- Acquisition instructions, quest/vendor/drop locations, usage notes, strategy text, and community prose cannot enter the promoted EPIC-04 catalog.

## Verification

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_infobox`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_icons`
- Focused Vitest coverage for generated skill field shapes
