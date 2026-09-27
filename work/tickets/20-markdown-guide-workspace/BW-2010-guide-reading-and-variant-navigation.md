---
id: BW-2010
title: Guide Reading and Variant Navigation
epic: EPIC-20
status: in_progress
planned_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2005
  - BW-2006
  - BW-2008
  - BW-2009
created: 2026-09-26
updated: 2026-09-27
---

# BW-2010: Guide Reading and Variant Navigation

## Goal

Present the guide as a clean, usable reference with builds and variants immediately available.

## Scope

- Render the same document/skill/build nodes in a read view with the authoring catalog and mutation controls hidden.
- Keep contextual tooltips, complete compact build summaries, template copying, section navigation and stable direct variant anchors.
- Support expand/collapse of detailed build information and responsive wrapping without turning reading actions into authored edits.
- Maintain truthful last-valid state messaging when an unapplied source draft exists; returning to edit preserves content and reasonable selection.
- Use shared local asset/fallback and safe external-link behavior. Keep local read mode distinct from hosted public publishing.

## Acceptance Criteria

- Readers can navigate between two variants, inspect bonuses and skill details, and copy the correct template without opening the catalog.
- Selection of a variant for reading does not change bound mention values, dirty the guide or create undo entries.
- Read and edit show the same applied content; returning to editing retains the source draft and build states.
- Headings, anchors, keyboard focus, long names, narrow layouts and 200% zoom remain usable.

## Verification

Test read-only action boundaries and stable anchors. Capture browser reading/navigation/copy flows with both variants, bound/generic mentions, a missing reference and an unapplied source draft.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 10.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Execution progress

Implementation and focused/full automated validation are present in SPRINT-021. Final browser acceptance is still being completed. Acceptance remains in progress while the required upstream BW-2008 file-upload gate is unresolved; no dependent completion is claimed.

## Final SPRINT-021 execution record

Implementation and completed checks are linked in the [final acceptance matrix](../../sprints/evidence/SPRINT-021/phase12.md). Own reading/browser criteria passed, including exact source selection return. Acceptance remains in progress because required browser file uploads/reimports and incoming ticket gates are open. The [upload permission gap](../../sprints/evidence/SPRINT-021/upload-permission-gap.md) is separate from native composition, which remains unverified/deferred by user decision. No completion or commit is claimed.
