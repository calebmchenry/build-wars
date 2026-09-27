---
id: BW-2005
title: Embedded Build Cards
epic: EPIC-20
status: done
planned_sprint: SPRINT-021
completed_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2003
  - BW-2004
created: 2026-09-26
updated: 2026-09-27
---

# BW-2005: Embedded Build Cards

## Goal

Let authors place and edit complete build variants directly within the guide.

## Scope

- Insert blank builds, paste a game template into a build insert action, and copy the current/saved build into a self-contained guide snapshot.
- Render compact labeled cards with professions/mode, eight slots and copy-template behavior; expand the active card's existing attribute, rune/headgear, title and assumed-effect controls.
- Reuse existing build editing, validation and preview functions through an adapter; retain unresolved facts and avoid a second game-rules implementation.
- Support rename, reorder, independent duplicate and reference-aware deletion. Incomplete cards remain editable and show neutral/unresolved state rather than requiring a valid template.
- Route game template import/Load/Save to an explicitly addressed card, with existing cancellation/error semantics and truthful metadata boundaries.
- Keep recommendations about other equipment in prose; do not reintroduce retired armor/weapon UI.

## Acceptance Criteria

- Editing one variant's skills, base ranks, rune/headgear, mode or effect assumptions affects only that card and its bound references.
- Duplicate/reorder/rename/delete follow the stable-identity contract and share the guide's undo history.
- Copying/importing a game code addresses the named card and never replaces sibling cards or guide text.
- Current build/title/attribute controls and validation retain their behavior; source-derived raw overlays survive unrelated card edits.

## Verification

Cover two variants with different adjustments/title/effect values, incomplete/unresolved templates, independent duplication, targeted import and canceled Load/Save. In-browser verify the expanded controls and template copy against the active card.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 5.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Completion

Completed in [SPRINT-021](../../sprints/SPRINT-021.md). [Phase 5 evidence](../../sprints/evidence/SPRINT-021/phase5.md) records independent complete cards, addressed game-file workflows and controls-only native history validation. Final B08 fallback-upload evidence remains tracked in Phase 12.
