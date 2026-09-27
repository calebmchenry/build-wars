---
id: BW-2007
title: Drag Drop and Keyboard Placement
epic: EPIC-20
status: done
planned_sprint: SPRINT-021
completed_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2005
  - BW-2006
created: 2026-09-26
updated: 2026-09-27
---

# BW-2007: Drag Drop and Keyboard Placement

## Goal

Make dragging a skill predictable across prose and multiple embedded build bars.

## Scope

- Implement every row of the design brief's drop matrix with a visible prose caret or slot target.
- Extend validated drag data with the source/target document and build identity plus stale-source checks; the existing slot-index-only payload cannot address several cards.
- Route slot drops through the existing placement planner for the target snapshot even when that card was not selected. Preserve same-bar move/swap and copy across bars.
- Stop nested drop propagation so a single gesture cannot insert both a mention and a skill. Catalog/bar-to-prose leaves all source bars unchanged.
- Handle document switches, deleted/reordered cards, changed source slots, external text, malformed MIME data and canceled drags as documented.
- Provide equivalent click/keyboard pick-place/cancel controls and accessible feedback; mention insertion is independent of skill-bar legality.

## Acceptance Criteria

- Catalog-to-prose, catalog-to-slot, same-bar move/swap, cross-build copy and source-bar-to-bound-mention each produce exactly one intended transaction.
- A drop on an inactive build modifies only that target; a stale/canceled drag cannot mutate the newly active document or a sibling.
- Existing duplicate/elite placement behavior and unresolved raw-overlay movement are preserved on the addressed bar.
- Keyboard-only users can insert a mention, select a build slot, place/replace a skill and cancel without using pointer drag.

## Verification

Add meaningful target-isolation and payload-boundary integration cases. Record actual browser pointer drops and their keyboard equivalents, including a nested slot target, inactive card, stale source, scrolling and cancellation.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 7.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Completion

Implemented in [SPRINT-021](../../sprints/SPRINT-021.md). [Phase 7 evidence](../../sprints/evidence/SPRINT-021/phase7.md) records placement, clipboard, native pointer/keyboard and standalone cancellation checks. Final integrated matrix remains BW-2012.
