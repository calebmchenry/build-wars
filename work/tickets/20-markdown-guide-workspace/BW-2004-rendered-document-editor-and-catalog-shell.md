---
id: BW-2004
title: Rendered Document Editor and Catalog Shell
epic: EPIC-20
status: done
planned_sprint: SPRINT-021
completed_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2001
  - BW-2002
  - BW-2003
created: 2026-09-26
updated: 2026-09-27
---

# BW-2004: Rendered Document Editor and Catalog Shell

## Goal

Provide the integrated left-hand writing surface with a usable right-hand skill catalog.

## Scope

- Add accessible Guide/composer entry points and bind a rendered editor to the shared guide document through a small vendor adapter.
- Support the required ordinary Markdown blocks/marks, headings, list editing, normal paste, keyboard shortcuts and clear insertion commands for builds/skills.
- Keep the existing searchable skill catalog on the right in desktop author mode, including when the guide contains no builds.
- Separate catalog insertion intent from existing slot-placement click handlers; keep a stable text caret/bookmark while interacting with the catalog.
- Provide responsive catalog access, independent scrolling and clear empty-guide/no-build states; preserve theme styling and the standalone composer.
- Keep non-editable embed shells and editable prose structurally valid; inline references must not introduce block-level tooltip markup into a paragraph.

## Acceptance Criteria

- Typing and formatting act on rendered text; the experience is not limited to a source textarea and preview.
- Catalog focus/scrolling does not lose the insertion location or unexpectedly modify the last active build.
- Guide entry/exit preserves drafts and uses current dirty-data handling when replacement is required.
- Keyboard users can reach the document, insert commands and catalog, then return to the text cursor; narrow layouts restore focus when catalog access closes.

## Verification

Use component coverage for state wiring and actual browser checks for typing, selection, list editing, paste, focus at embed boundaries, long-document scrolling, themes and responsive catalog behavior.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 4.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Current verification scope — user decision, 2026-09-27 UTC

The user authorized skipping the remaining manual/native composition verification
and proceeding. See the [scope and retained requirements](../../sprints/evidence/SPRINT-021/native-composition-deferral.md).
That check remains unverified/deferred and no longer blocks this ticket or the
burn. All other acceptance criteria and automated composition regressions remain
required. This amendment supersedes the historical composition-only stop below;
it does not mark any implementation or evidence complete.

## Completion

Completed in [SPRINT-021](../../sprints/SPRINT-021.md). [Phase 4 evidence](../../sprints/evidence/SPRINT-021/phase4.md) records integrated writing, catalog focus/layout and guarded transition validation.
