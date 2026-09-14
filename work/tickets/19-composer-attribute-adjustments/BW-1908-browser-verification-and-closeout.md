---
id: BW-1908
title: Browser Verification and Closeout
epic: EPIC-19
status: done
priority: high
planned_sprint: SPRINT-020
completed_sprint: SPRINT-020
depends_on:
  - BW-1901
  - BW-1902
  - BW-1903
  - BW-1904
  - BW-1905
  - BW-1906
  - BW-1907
created: 2026-09-13
updated: 2026-09-14
---

# BW-1908: Browser Verification and Closeout

## Goal

Verify the complete composer workflow, update durable docs, and close the epic with honest evidence.

## Scope

- Run the implementation's focused suites, npm run verify, and git diff --check; fix failures caused by the change.
- Inspect real browser rendering at 1280px, 900px, and 390px, 200% zoom, both themes, long names, and no selected loadout. Verify blue ranks, segmented icons, headgear, breakdown access, and collapsed effect count.
- Exercise keyboard-only rune/headgear/effect controls, focus restoration, reset-to-automatic, and reload with persisted choices.
- Use a disposable copied Skills folder for load/edit/save/reload and cancellation checks; verify ordinary exported files contain only the base game code.
- Record actual browser name, viewport, scenario, and screenshot/result evidence. Source/CSS inspection and jsdom tests do not count as manual browser evidence; if unavailable record the gap and keep the affected acceptance item open.
- Update compendium, source-policy exception, rune asset docs, template-file omission semantics, and the future-work list. Describe only current mounted UI.
- Let the executing sprint update its own ledger, tickets, and burn result manifest; mark done only when required evidence exists.

## Acceptance Criteria

- All milestone criteria and preservation cases have evidence; no outstanding required check is represented as passed.
- The working draft survives reload with the same authored choices, while game Load/Save remains compatible.
- EPIC-19 and its tickets link the actual executing sprint(s), tests, asset evidence, and browser results.
- Named-library and full-build transfer work remains explicitly deferred.

## Verification

npm run verify; git diff --check; the real browser evidence matrix above.

## Design Authority

[Composer attribute adjustments](../../../compendium/attribute-adjustments.md) and the
[epic contract](EPIC.md). User decisions there override older sprint scope.

## Planning

Planned in [SPRINT-020](../../sprints/SPRINT-020.md), Phase 8: Browser evidence and closeout.
The sprint phase checklist and gate implement this ticket's acceptance criteria.

Completed in [SPRINT-020](../../sprints/SPRINT-020.md). See [execution evidence](../../sprints/SPRINT-020-EVIDENCE.md).
