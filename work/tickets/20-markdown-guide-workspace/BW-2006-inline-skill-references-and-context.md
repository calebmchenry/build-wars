---
id: BW-2006
title: Inline Skill References and Context
epic: EPIC-20
status: done
planned_sprint: SPRINT-021
completed_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2002
  - BW-2004
  - BW-2005
created: 2026-09-26
updated: 2026-09-27
---

# BW-2006: Inline Skill References and Context

## Goal

Make skill mentions useful inside prose while preserving the correct variant's values.

## Scope

- Provide skill-name completion or equivalent insert command and atomic inline references using stable catalog IDs, local icons and shared skill display data.
- Support explicit Generic or named-build context selection. Catalog-to-prose insertion defaults to generic; source-bar-to-prose insertion binds the source build.
- Resolve contextual tooltips from the referenced build's mode, base/bonus ranks, title overrides and assumed effects instead of the editor's selected card.
- Provide a clearly indicated generic catalog/range view, plus visible unresolved skill/context states and an explicit repair/rebind action.
- Preserve binding when moving text or changing card selection; deletion must not silently retarget mentions.
- Reuse hover/focus/touch tooltip behavior with valid inline DOM and accessible names. Missing icons and long skill names must remain readable.

## Acceptance Criteria

- The same skill mentioned under two explicitly different contexts produces each build's appropriate values even after selecting a third/other card.
- Generic mentions never borrow active-build ranks; a guide with zero builds supports skill insertion and useful reference display.
- Unknown IDs/deleted builds retain recoverable identities and show an explanation; undoing deletion restores the previous contextual display.
- Editing surrounding text, copying/moving mentions and returning focus from the catalog does not corrupt atomic references or nearby characters.

## Verification

Test generic/bound/missing context, mode/title/bonus differences, moves, delete/undo and explicit rebind. Confirm browser tooltips through hover, keyboard focus and touch-capable interaction, including inline wrapping.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 6.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Completion

Completed in [SPRINT-021](../../sprints/SPRINT-021.md). [Phase 6 evidence](../../sprints/evidence/SPRINT-021/phase6.md) records independent generic/bound/unresolved values, repair, atomic editing and desktop/touch-emulated browser checks. Fragment clipboard integration follows in BW-2007.
