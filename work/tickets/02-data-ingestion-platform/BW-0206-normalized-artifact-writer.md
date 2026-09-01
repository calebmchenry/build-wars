---
id: BW-0206
title: Normalized Artifact Writer
epic: EPIC-02
status: backlog
priority: high
depends_on:
  - BW-0202
  - BW-0203
  - BW-0204
  - BW-0205
created: 2026-09-01
---

# BW-0206: Normalized Artifact Writer

## Goal

Create the deterministic generated-data writer that turns parsed source records into app-consumable JSON artifacts.

## Scope

- Write normalized artifacts under `data/generated/` according to the EPIC-01 commit policy.
- Use stable sorting, stable key ordering, and consistent formatting so diffs are reviewable.
- Include schema version, catalog version or generation id, generated timestamp, source summary, and per-record provenance.
- Preserve unknown IDs and unresolved references without destructive coercion.
- Distinguish copied source text, factual metadata, derived normalized values, and manual overrides.
- Validate generated artifacts against `src/domain` contracts where practical.

## Acceptance Criteria

- A minimized parser fixture can produce deterministic generated JSON.
- Re-running generation without source changes produces no meaningful diff except intentional timestamps when enabled.
- Output records include provenance and source classification fields.
- Unknown IDs remain representable for later template compatibility.
- The generated-data writer does not import browser UI modules.

## Verification

- `npm run verify`
- Focused deterministic output tests added by the implementation sprint
