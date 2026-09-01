---
id: EPIC-05
title: Template Compatibility
track: functional
status: backlog
priority: high
depends_on:
  - EPIC-00
  - EPIC-03
  - EPIC-04
---

# Template Compatibility

## Goal

Support the build-code formats players already use so Build Wars can import from and export to the game and existing tools.

## Scope

* Evaluate the existing `@buildwars/gw-templates` package.
* Support skill template import/export.
* Support equipment template import/export.
* Support chat-code wrappers and template names.
* Support paw-ned2/team formats if feasible.
* Add fixture-based compatibility tests.

## Done When

* Known skill template codes round-trip correctly.
* Known equipment template codes round-trip correctly.
* Invalid codes fail with useful errors.
* The app can preserve unknown ids without destructive data loss where practical.

## Notes

Do not hand-roll bitstream parsers before evaluating the existing package. Reforged data freshness may matter more than parser novelty.

Cross-check decoded skill ids against the generated catalog from `EPIC-04` and the game-integration id map from `EPIC-02`. Unknown ids should remain round-trippable where practical so imports are not destructively rewritten just because the active catalog is incomplete or stale.
