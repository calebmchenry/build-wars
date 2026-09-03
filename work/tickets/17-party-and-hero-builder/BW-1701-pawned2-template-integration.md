---
id: BW-1701
title: External Team Template Compatibility Parking Lot
epic: EPIC-17
status: backlog
priority: low
depends_on:
  - EPIC-16
created: 2026-09-02
updated: 2026-09-03
---

# BW-1701: External Team Template Compatibility Parking Lot

## Goal

Retain the historical paw-ned2/team-template deferral without making it part of the near-term
multi-build or party workflow.

## Scope

- Keep SPRINT-006 evidence linked for future reference.
- Do not run new codec probes unless a future product decision explicitly prioritizes external team
  template compatibility.
- If revisited later, require a fresh bounded compatibility spike with runtime, security, malformed
  input, browser, and round-trip tests.
- Keep any future external codec isolated from the semantic build-set and party models until field
  mapping is explicitly designed.

## SPRINT-006 Deferral Evidence

SPRINT-006 deferred paw-ned2 because the pinned `@buildwars/gw-templates@1.1.1` Node.js `22.11.0`
package-entry probe failed minimal paw-ned2 encode with `TypeError: $string.toBase64 is not a
function`. No public team codec was exported from EPIC-05.

## Acceptance Criteria

- EPIC-16 and EPIC-17 can ship without paw-ned2 support.
- Future external template compatibility work is explicit, separately prioritized, and test-gated.
- Historical deferral evidence remains discoverable without steering MVP implementation.

## Planning

`SPRINT-018` keeps this ticket parked in backlog. Native Build Wars party JSON and multi-code copy
do not satisfy or replace external team-template compatibility.
