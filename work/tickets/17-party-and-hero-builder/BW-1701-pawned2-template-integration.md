---
id: BW-1701
title: paw-ned2 Template Integration
epic: EPIC-17
status: ready
priority: high
depends_on:
  - EPIC-05
created: 2026-09-02
updated: 2026-09-02
---

# BW-1701: paw-ned2 Template Integration

## Goal

Re-evaluate paw-ned2/team template support under the party and hero builder epic, then ship a
bounded raw team codec only if the dependency/runtime gates pass.

## Scope

- Re-run Node.js floor, browser/Vite, Vitest, charset, malformed-length, nested-code, member-count,
  text-limit, statefulness, and global/prototype behavior probes for the selected codec path.
- Decide whether to keep `@buildwars/gw-templates`, adopt an audited fork, or explicitly own a local
  team parser in a separate amendment.
- If shipped, expose only raw JSON-compatible team facts first; do not map directly to `PartyBuild`
  until EPIC-17 owns slot, hero, player, role, and assignment semantics.

## SPRINT-006 Deferral Evidence

SPRINT-006 deferred paw-ned2 because the pinned `@buildwars/gw-templates@1.1.1` Node.js `22.11.0`
package-entry probe failed minimal paw-ned2 encode with `TypeError: $string.toBase64 is not a
function`. No public team codec was exported from EPIC-05.

## Acceptance Criteria

- paw-ned2 has a fresh ship/defer decision under EPIC-17.
- Any shipped codec is bounded, deterministic, offline-tested, and preserves every surfaced field it
  claims to support.
- Team metadata is plain text only and is not treated as guide prose.
