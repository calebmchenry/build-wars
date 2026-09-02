---
id: BW-1002
title: Rune Source Set and Page Resolution
epic: EPIC-10
status: done
priority: high
depends_on:
  - BW-1001
planned_sprint: SPRINT-011
completed_sprint: SPRINT-011
created: 2026-09-02
updated: 2026-09-02
---

# BW-1002: Rune Source Set and Page Resolution

## Goal

Define the authoritative rune source set, fixture coverage, and page-resolution rules for
deterministic rune catalog generation.

## Scope

- Identify source pages or source indexes for all player-usable armor runes.
- Resolve redirects, duplicate names, rune rank variants, profession-specific pages, common rune
  pages, and missing or unsupported records with explicit dispositions.
- Add synthetic fixtures covering attribute runes, Vigor-like non-attribute runes, stackable
  non-attribute runes, icon metadata, and malformed or incomplete source shapes.
- Record source-policy classifications for copied text risk, source links, revision facts, and
  promoted artifact eligibility.
- Keep live refresh manual-only, bounded, and replayable through selected snapshots.

## Out Of Scope

- Implementing rune extractors, promoting runtime artifacts, or adding UI.

## Acceptance Criteria

- The source set is deterministic and reviewable before fetch/promotion.
- Fixture mode is fully offline and synthetic.
- Source references include enough page, revision, retrieval, and source-family data for QA.
- Ambiguous or unsupported source pages are preserved as QA dispositions, not silently skipped.

## Verification

- Focused Python tests for EPIC-10 source-plan generation and fixture source resolution
- Documented fixture regenerate command added by the implementation sprint

## Closeout Evidence

- SPRINT-011 added deterministic rune source planning, candidate accounting, page-resolution
  metadata, digest-confirmed fetch validation, complete snapshot-set manifests, offline replay
  rejection, and synthetic rune source fixtures.
- Validation passed: `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_source_set build_wars_ingest.tests.test_skill_source_set`,
  `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`,
  and fixed-clock EPIC-10 fixture regeneration.
