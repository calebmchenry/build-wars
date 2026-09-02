---
id: EPIC-05
title: Template Compatibility
track: functional
status: done
priority: high
depends_on:
  - EPIC-00
  - EPIC-03
  - EPIC-04
planned_sprint: SPRINT-006
completed_sprint: SPRINT-006
tickets:
  - BW-0501
  - BW-0502
  - BW-0503
  - BW-0504
  - BW-0505
  - BW-0506
updated: 2026-09-02
---

# Template Compatibility

## Execution Notes

Completed in `SPRINT-006`. Build Wars now supports framework-neutral skill template
import/export, raw equipment template import/export, safe chat-code wrappers, typed errors, exact
source replay, field-complete canonical export, and pure catalog resolution. paw-ned2/team support is
deferred to EPIC-17 with evidence and no partial public API.

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

## Initial Grooming Targets

* Pinned `@buildwars/gw-templates` dependency qualification and adapter boundary.
* Plain-data template contracts, typed errors, wrapper policy, and fidelity guarantees.
* Skill template import/export with EPIC-03 and EPIC-04 resolution helpers.
* Raw equipment template import/export without semantic equipment catalog joins.
* paw-ned2/team support ship-or-defer decision with traceable evidence.
* Compatibility fixtures, docs, ticket records, and offline verification.
