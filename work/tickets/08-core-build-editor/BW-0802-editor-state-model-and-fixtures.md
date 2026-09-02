---
id: BW-0802
title: Editor State Model and Fixtures
epic: EPIC-08
status: ready
priority: critical
depends_on:
  - BW-0801
created: 2026-09-02
updated: 2026-09-02
---

# BW-0802: Editor State Model and Fixtures

## Goal

Create the in-memory editor state and focused fixtures needed for a single-character build editing
surface.

## Scope

- Represent the current working build in memory using existing domain `Build` contracts.
- Support PvE, PvP, and unknown modes as editor state.
- Preserve null professions, empty skill slots, unresolved imported IDs, and partially allocated
  attributes without destructive cleanup.
- Add helper functions for selecting professions, setting mode, changing attributes, placing skills,
  clearing slots, and replacing slots.
- Add small app or test fixtures that exercise a playable build, an incomplete build, and an
  imported build with unresolved IDs.

## Out Of Scope

- Local storage, schema migrations, saved library behavior, tags, favorites, backup/restore,
  shareable URLs, party builds, equipment editing, and guide authoring.

## Acceptance Criteria

- Refreshing the browser may discard the current working build.
- Editor state changes are deterministic and covered by tests.
- Unknown or stale IDs remain representable until the user explicitly replaces or clears them.
- State helpers do not import generated manifests, QA reports, source snapshots, wiki APIs, or data
  scripts.

## Verification

- `npm run verify`
