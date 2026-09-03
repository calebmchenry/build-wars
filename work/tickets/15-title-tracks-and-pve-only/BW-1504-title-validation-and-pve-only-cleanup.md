---
id: BW-1504
title: Title Validation and PvE-only Cleanup
epic: EPIC-15
status: ready
priority: high
depends_on:
  - BW-1501
  - BW-1503
  - EPIC-06
created: 2026-09-03
updated: 2026-09-03
---

# BW-1504: Title Validation and PvE-only Cleanup

## Goal

Replace broad EPIC-15 deferral warnings with clear validation around configured title ranks and
existing PvE-only rules.

## Scope

- Stop emitting generic `skill.title-deferred` warnings when a selected skill's title dependency
  resolves to configured/default rank state.
- Keep warnings for missing, unsupported, or ambiguous title metadata.
- Preserve the existing three-PvE-only-skill limit behavior.
- Refine validation/presentation for title skills that require PvE mode.
- Handle allegiance-ranked skills rank-first; add a small side/exclusivity issue only if catalog
  facts make it necessary and clear.
- Keep skill browser filter behavior for PvE-only/title skills consistent with current catalog
  classifications.

## Out Of Scope

- Account unlock validation, campaign progression, reputation farming, party-wide title ownership,
  and speculative Kurzick/Luxon account modeling.

## Acceptance Criteria

- Title-scaled skills with resolved rank state do not produce generic deferral warnings.
- PvE-only skill count validation remains covered and unchanged unless tests prove a bug.
- Allegiance-specific uncertainty is narrow, visible, and does not block ordinary title rank editing.
- Validation issue codes remain deterministic and app-displayable.

## Verification

- `npm run test:run -- test/domain src/app`
- Focused rule-engine tests for title dependencies, PvE-only limits, and allegiance warnings
