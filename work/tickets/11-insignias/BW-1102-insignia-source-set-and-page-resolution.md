---
id: BW-1102
title: Insignia Source Set and Page Resolution
epic: EPIC-11
status: ready
priority: high
depends_on:
  - BW-1101
created: 2026-09-02
updated: 2026-09-02
---

# BW-1102: Insignia Source Set and Page Resolution

## Goal

Define the authoritative insignia source set, fixture coverage, and page-resolution rules for
deterministic insignia catalog generation.

## Scope

- Identify source pages or source indexes for all player-usable armor insignias.
- Resolve redirects, duplicate names, common/profession-specific pages, PvE/PvP availability facts,
  and unsupported records with explicit dispositions.
- Add synthetic fixtures covering common insignias, profession-specific insignias, slot-scaled
  bonuses, conditional effects, icon metadata, and malformed or incomplete source shapes.
- Record source-policy classifications for copied text risk, source links, revision facts, and
  promoted artifact eligibility.
- Keep live refresh manual-only, bounded, and replayable through selected snapshots.

## Out Of Scope

- Implementing insignia extractors, promoting runtime artifacts, or adding UI.

## Acceptance Criteria

- The source set is deterministic and reviewable before fetch/promotion.
- Fixture mode is fully offline and synthetic.
- Source references include enough page, revision, retrieval, and source-family data for QA.
- Ambiguous or unsupported source pages are preserved as QA dispositions, not silently skipped.

## Verification

- Focused Python tests for EPIC-11 source-plan generation and fixture source resolution
- Documented fixture regenerate command added by the implementation sprint
