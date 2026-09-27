---
id: BW-2012
title: Browser Verification and Closeout
epic: EPIC-20
status: in_progress
planned_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2001
  - BW-2002
  - BW-2003
  - BW-2004
  - BW-2005
  - BW-2006
  - BW-2007
  - BW-2008
  - BW-2009
  - BW-2010
  - BW-2011
created: 2026-09-26
updated: 2026-09-27
---

# BW-2012: Browser Verification and Closeout

## Goal

Close the guide milestone only after its authoring, reading and recovery workflows work in the actual browser.

## Scope

- Execute the full browser matrix in the design brief using the original two-variant and long-document fixtures. Record viewport, theme, actions, results and evidence paths.
- Cover typing/formatting, inline/block boundary focus, independent scrolling, every supported pointer drop, keyboard placement, target switching and stale drag handling.
- Verify context after selecting other cards, cross-feature undo/redo, invalid-source Apply/recovery, named save/open/reload, download/reimport and read/edit navigation.
- Run existing composer, game-template/folder, attribute preview, build-set/party persistence and backup regressions; run npm run verify and git diff --check.
- Update the compendium, README if needed, tickets, executing sprint(s), ledger and burn result manifest consistently; link durable evidence.
- Retain public discovery, PvX intake and publishing follow-ups explicitly without treating them as completed or extending this burn.

## Acceptance Criteria

- All BW-2001 through BW-2011 acceptance criteria have concrete implementation and verification evidence; no remaining required checkbox is hidden by marking the epic done.
- Actual browser evidence covers both themes, narrow screen, 200% zoom, keyboard, cursor behavior, pointer drag, source recovery and storage/import/export paths.
- The completed feature meets the rendered writing requirement, keeps variant state/context isolated and preserves recoverable data across all transfer paths.
- Repository verification passes, regression findings are resolved, and completion metadata agrees with the execution result.
- If a required browser scenario cannot run, record the exact gap and leave the affected ticket/epic incomplete rather than claiming success from jsdom or CSS inspection.

## Verification

Run npm run verify and git diff --check at closeout, alongside the recorded actual-browser matrix. This ticket requires evidence from the implemented product; backlog preparation or successful dry-run selection does not complete it.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 12.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Current verification scope — user decision, 2026-09-27 UTC

The user authorized skipping the remaining manual/native composition verification
and proceeding. See the [scope and retained requirements](../../sprints/evidence/SPRINT-021/native-composition-deferral.md).
That check remains unverified/deferred and no longer blocks this ticket or the
burn. All other acceptance criteria and automated composition regressions remain
required. This amendment supersedes the historical composition-only stop below;
it does not mark any implementation or evidence complete.

## Final SPRINT-021 execution record

Implementation and completed checks are linked in the [final acceptance matrix](../../sprints/evidence/SPRINT-021/phase12.md). Acceptance remains in progress because required browser file uploads/reimports and incoming ticket gates are open. The [upload permission gap](../../sprints/evidence/SPRINT-021/upload-permission-gap.md) is separate from native composition, which remains unverified/deferred by user decision. No completion or commit is claimed.
