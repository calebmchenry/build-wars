---
id: BW-0103
title: Artifact Retention and Commit Policy
epic: EPIC-01
status: done
priority: critical
depends_on:
  - BW-0101
planned_sprint: SPRINT-002
completed_sprint: SPRINT-002
created: 2026-09-01
updated: 2026-09-01
---

# BW-0103: Artifact Retention and Commit Policy

## Goal

Define which raw snapshots, normalized generated data, QA reports, fixtures, and media references
may be committed, ignored, regenerated, or published.

## Scope

- Update data and script README files with the source-policy outcomes from EPIC-01.
- Preserve raw source snapshots as ignored by default under `data/source-snapshots/`.
- Allow small deterministic normalized JSON to be committed only when needed by app behavior or
  tests and when provenance requirements are satisfied.
- Keep generated QA reports ignored by default unless a later ticket marks a report as stable
  documentation.
- Keep icon files and screenshots out of the repo/runtime app in this sprint, while allowing
  metadata-only references where appropriate.

## Acceptance Criteria

- Data directory documentation explains raw snapshot, normalized generated data, QA report, fixture,
  icon metadata, and screenshot policies.
- Commit/regeneration rules are explicit enough for EPIC-02 ingestion implementation to follow.
- `.gitignore` behavior remains consistent with the documented raw/generated/QA retention policy.
- Any future exception path for committed fixtures or stable QA reports requires explicit ticket
  approval and provenance metadata.
- No real external Guild Wars Wiki, PvX/Fandom, icon, screenshot, or generated catalog payload is
  added by this sprint.

## Verification

- Manual review of data README files and `.gitignore` intent.
- `npm run verify`
