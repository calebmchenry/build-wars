---
id: BW-0207
title: Data QA Report Framework
epic: EPIC-02
status: backlog
priority: high
depends_on:
  - BW-0203
  - BW-0204
  - BW-0205
  - BW-0206
created: 2026-09-01
---

# BW-0207: Data QA Report Framework

## Goal

Produce machine-readable and human-readable QA reports for ingestion coverage, source traceability, and changed records.

## Scope

- Write QA output under `data/qa/` while respecting the EPIC-01 commit/ignore policy.
- Report missing required fields, missing icons, duplicate IDs, unresolved redirects, unknown template params, malformed mappings, ambiguous source/license status, and manual overrides.
- Compare current generated output against previous snapshots or generated artifacts when available.
- Classify report findings by severity so automation can fail on critical issues while allowing review warnings.
- Keep report output deterministic and concise enough for review.
- Document which QA failures block generated data from being consumed by content epics.

## Acceptance Criteria

- QA reports can be generated from minimized fixtures without live network access.
- Critical duplicate-ID or missing-provenance issues fail validation.
- Non-blocking ambiguity warnings are preserved for manual review.
- Reports include source file/page references and record IDs where available.
- Later content epics can add content-specific QA checks to the same framework.

## Verification

- `npm run verify`
- Focused QA report tests added by the implementation sprint
