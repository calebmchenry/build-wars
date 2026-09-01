---
id: BW-0601
title: Validation Result Contracts
epic: EPIC-06
status: backlog
priority: high
depends_on: []
created: 2026-09-01
---

# BW-0601: Validation Result Contracts

## Goal

Define the stable domain contracts used by rule checks, UI surfaces, tests, and future analysis features.

## Scope

- Add validation severity, issue code, issue path, related entity, and result types under `src/domain`.
- Represent normal invalid build states as returned issues, not thrown exceptions.
- Include enough structure for the UI to highlight affected profession selectors, attribute rows, skill slots, and equipment slots later.
- Keep issue codes deterministic so tests and guide/reporting features can rely on them.
- Document which severities should block export, warn the user, or provide informational analysis.

## Acceptance Criteria

- Rule checks can return multiple issues from one validation pass.
- Issues can identify affected build paths or slots without importing UI code.
- Issue codes and severities are typed, documented, and fixture-friendly.
- The contract leaves room for equipment, title-track, and advanced-analysis rules.

## Verification

- `npm run verify`
- Focused contract/type tests added by the implementation sprint
