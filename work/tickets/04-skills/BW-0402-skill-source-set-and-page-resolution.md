---
id: BW-0402
title: Skill Source Set and Page Resolution
epic: EPIC-04
status: done
priority: critical
depends_on:
  - BW-0401
planned_sprint: SPRINT-005
completed_sprint: SPRINT-005
created: 2026-09-01
updated: 2026-09-02
---

# BW-0402: Skill Source Set and Page Resolution

## Goal

Build the snapshot-driven source-set discovery step for EPIC-04 by resolving every known skill template ID from the game-integration skill map to a canonical skill page, redirect target, and fetchable detail-page set.

## Scope

- Reuse and harden the existing skill ID enumerator for the full game-integration skill ID map.
- Fetch `Guild Wars Wiki:Game integration/Skills` as the source-set index, enumerate its linked ranged skill pages under `Guild Wars Wiki:Game integration/Skills/*`, and reject unexpected non-ranged skill-map pages without a recorded amendment.
- Record revision ID, page ID, timestamp, source URL, content hash, and digest evidence for the index page and each ranged seed page.
- Resolve normalized page titles, redirects, disambiguation preambles, missing pages, duplicate IDs, duplicate titles, PvE/PvP title variants, and non-contiguous ID gaps into records or QA diagnostics.
- Teach live mode how to fetch large skill detail-page sets in batches under explicit page, request, byte, continuation, and retry limits.
- Teach offline mode how to select only EPIC-04 source snapshots rather than scanning unrelated EPIC-02 or EPIC-03 snapshots.
- Preserve source references, revision IDs, retrieval timestamps, and snapshot manifest paths for the ID map and every detail page.
- Add minimized fixtures for duplicate IDs, redirects, PvE/PvP variants, disambiguation pages, missing pages, malformed mappings, and high-ID gaps.

## Acceptance Criteria

- Every accepted skill ID has one canonical detail-page target or a blocking QA diagnostic explaining why it cannot be resolved.
- The source-set plan is derived from the live index plus ranged seed-page snapshots, not from the missing `Guild Wars Wiki:Game integration/Skills/0` title.
- Redirected and normalized titles retain both requested and canonical title evidence.
- Disambiguation and ambiguous split pages cannot silently become catalog records.
- Large source fetches remain manual-only in live mode and ignored by default.
- Offline replay is deterministic from selected EPIC-04 snapshot manifests.
- Source-set diagnostics use stable finding IDs and point to skill IDs or source titles where possible.

## Verification

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_skill_source_set`
- `npm run data:test`
- One bounded manual live smoke or dry-run command during implementation if network conditions permit
