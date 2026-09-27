---
id: EPIC-20
title: Markdown Guide Workspace
track: functional
status: done
planned_sprint: SPRINT-021
completed_sprint: SPRINT-021
priority: high
depends_on:
  - EPIC-01
  - EPIC-04
  - EPIC-05
  - EPIC-06
  - EPIC-09
  - EPIC-16
  - EPIC-18
  - EPIC-19
tickets:
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
  - BW-2012
created: 2026-09-26
updated: 2026-09-27
---

# Markdown Guide Workspace

## Goal

Let a user write, edit, save and read a portable Markdown guide containing multiple
interactive Guild Wars builds and inline skill references. Keep the skills catalog
on the right while authoring, with direct drag-to-prose and drag-to-build behavior.

## Design Authority

Read [Markdown Guide Workspace](../../../compendium/guide-workspace.md) and the
[conversation intent](../../sprints/drafts/EPIC-020-INTENT.md) before planning.
The brief distinguishes user direction, implementation defaults and future work.
It defines behaviors for context, ownership, history and source recovery that
must not be left to accidental editor-library behavior.

This epic began as backlog work authorized by the user. Product implementation and acceptance are complete in SPRINT-021 in the main checkout after the user-authorized relocation. The current sprint assignment is recorded below; the burn workflow
owns numbered sprints, execution and ledger records.
Older speculative EPIC-20 search references do not expand this milestone's scope.

## Scope

- Integrated Guide workspace and rendered document writing with the existing
  right-hand skill catalog; existing standalone composer remains available.
- Versioned annotated Markdown, ordinary prose, complete embedded build data,
  template-code input/output, explicit attribute bonuses and stable skill IDs.
- Multiple editable build cards using current Build v4, rune/headgear controls,
  assumed-effect previews, title-rank inputs and existing placement rules.
- Generic and explicitly variant-bound skill mentions with correct tooltip context.
- Pointer, click and keyboard insertion; explicit multi-build drag targets.
- One guide transaction/history model; safe source Apply; unresolved/unsupported
  content recovery and semantic round trips.
- Named local Save/Open, draft autosave/recovery, Markdown import/export and
  backward-compatible storage/backup handling.
- Read view with catalog hidden, direct variant anchors and copy-template actions.
- Original two-variant guide fixture, browser evidence and regression coverage.

## Out Of Scope

Public guide discovery/search, automated PvX scraping, copied guide publication,
hosted publishing, accounts, collaboration, backend sync, live-linked library
builds, full party embeds, full equipment management, generic Markdown app/package
development, analytics and combat optimization. These remain explicitly recorded
in the design brief's follow-up roadmap, not required by this epic's burn.

## Ticket Order

| Ticket | Work | Depends on |
| --- | --- | --- |
| [BW-2001](BW-2001-contracts-and-editor-feasibility.md) | Document contracts and bounded editor feasibility | Completed epic dependencies |
| [BW-2002](BW-2002-guide-model-and-markdown-codec.md) | Guide model and annotated Markdown codec | BW-2001 |
| [BW-2003](BW-2003-guide-workspace-transactions-and-history.md) | Workspace ownership, transactions and history | BW-2002 |
| [BW-2004](BW-2004-rendered-document-editor-and-catalog-shell.md) | Rendered document editor and catalog shell | BW-2001, BW-2002, BW-2003 |
| [BW-2005](BW-2005-embedded-build-cards.md) | Embedded build cards and current composer reuse | BW-2003, BW-2004 |
| [BW-2006](BW-2006-inline-skill-references-and-context.md) | Inline skill references and stable tooltip context | BW-2002, BW-2004, BW-2005 |
| [BW-2007](BW-2007-drag-drop-and-keyboard-placement.md) | Multi-build drag/drop and keyboard placement | BW-2005, BW-2006 |
| [BW-2008](BW-2008-source-editing-and-markdown-transfer.md) | Source editing and Markdown import/export | BW-2002, BW-2003, BW-2004, BW-2005, BW-2006 |
| [BW-2009](BW-2009-local-guide-save-and-recovery.md) | Local guide save, migration and recovery | BW-2003, BW-2008 |
| [BW-2010](BW-2010-guide-reading-and-variant-navigation.md) | Guide reading and variant navigation | BW-2005, BW-2006, BW-2008, BW-2009 |
| [BW-2011](BW-2011-example-guide-and-workflow-coverage.md) | Original example guide and cross-feature coverage | BW-2005 through BW-2010 |
| [BW-2012](BW-2012-browser-verification-and-closeout.md) | Browser verification and closeout | BW-2001 through BW-2011 |

The planner may split work across sprints. Complete the contract/feasibility gate
before committing to an editor dependency. Prioritize a paragraph, mention and
editable build as the first vertical slice, then demonstrate two independent
variants. Keep the epic open until all tickets pass; a prototype alone is not
the completion condition. Resolve routine library/syntax choices from the brief
and record the rationale without reopening the product interview.

## Done When

- All twelve tickets meet acceptance with implementation and verification evidence.
- Authors can write rendered prose, insert references and edit multiple builds
  directly, including dragging skills and using keyboard equivalents.
- Drops, contextual tooltips, history and source application preserve the correct
  build identity and do not mutate siblings or borrow another variant's values.
- Save/Open/reload and Markdown export/import preserve complete supported authored
  state, unresolved facts and recoverable source content without silent loss.
- Read mode displays the same guide/builds/skill values with useful navigation and
  template copying, without the authoring catalog.
- Existing standalone composer, game template files, storage recovery, build-set
  and party data remain compatible; legacy guides are not invented for migration.
- Inputs remain inert; no copied PvX runtime prose or unapproved remote asset
  requests are introduced by the original example fixture.
- Actual browser evidence covers the design brief's matrix, including themes,
  narrow screens, zoom, keyboard, dragging, focus and source recovery.
- `npm run verify` and `git diff --check` pass at implementation closeout.
- Tickets, completed sprint(s), ledger and burn result manifests agree.

## Burn Setup

Preview this epic:

```sh
python3 scripts/ticket-burn.py EPIC-20 --dry-run
```

Plan and execute only this epic when ready:

```sh
python3 scripts/ticket-burn.py EPIC-20
```

The normal runner requires a clean starting tree and no active sprint. It plans
numbered sprints, executes them and owns commits. Do not bypass dependencies or
preflight for this milestone. Backlog preparation performs only the dry-run;
current unrelated working changes must be preserved, not committed or discarded
to make the preparation appear execution-ready.

## Planning Evidence

[Synthesis and verification](../../sprints/drafts/EPIC-020-MERGE-NOTES.md) records
reviewer availability, accepted decisions and actual backlog checks. No sprint
number is reserved during this setup.

## Sprint Planning

[SPRINT-021](../../sprints/SPRINT-021.md) plans BW-2001 through BW-2012 in
dependency order. It is auto-approved under the noninteractive ticket-burn contract.
BW-2001 is ready; dependent tickets remain backlog until their incoming gates pass.
At planning time the epic remained ready, not implemented or complete. No code
changes or commits were made during planning.

[Merge notes](../../sprints/drafts/SPRINT-021-MERGE-NOTES.md) and
[planning evidence](../../sprints/drafts/SPRINT-021-PLANNING-EVIDENCE.md) record
all three independent drafts, all three cross-critiques, assumptions and checks.
Editor feasibility, per-ticket browser evidence, final validation and checklist
gates remain mandatory for execution. The outer runner owns commits.

## Initial execution status (historical)

[SPRINT-021](../../sprints/SPRINT-021.md) began but stopped at BW-2001's mandatory
native-browser evidence gate. The epic remains in-progress; no ticket is done.
Native Chrome app access was denied, and approved tab controls did not demonstrate
real IME composition or native undo. Partial tests, browser observations and the
archived slice are recorded in [execution evidence](../../sprints/SPRINT-021-EVIDENCE.md).
No prototype route or provisional dependency ships. All dependent tickets retain
their incomplete status. Resume BW-2001 after restoring the required input access.

## First resumed execution status (historical)

EPIC-20 remains in-progress, linked to [SPRINT-021](../../sprints/SPRINT-021.md),
with no ticket done. The 2026-09-27 UTC resume restored native Chrome access and
verified native menu Undo, but composition completion still has an untrusted end
event even in a plain uncontrolled textarea. BW-2001 therefore remains blocked;
BW-2002–BW-2012 retain backlog status and all epic completion criteria remain open.

[Resume evidence](../../sprints/evidence/SPRINT-021/resume-20260927.md) preserves
the actual checks, two experimental fixes, seven focused test results and the
combined patch. Active product code/dependencies were restored, historical evidence
was retained, and no commits were made. Permission alone is no longer the issue.

## Current verification scope — user decision, 2026-09-27 UTC

The user authorized skipping the remaining manual/native composition verification
and proceeding. See the [scope and retained requirements](../../sprints/evidence/SPRINT-021/native-composition-deferral.md).
That check remains unverified/deferred and no longer blocks this ticket or the
burn. All other acceptance criteria and automated composition regressions remain
required. This amendment supersedes the historical composition-only stop below;
it does not mark any implementation or evidence complete.

## Earlier transfer-blocked continuations (historical)

BW-2001–BW-2007 are now done and linked to SPRINT-021. The complete local editor, Source, named persistence/recovery, Reader and original example are implemented. BW-2008–BW-2012 remain in progress because required actual Markdown upload/reimport/cancel/stale and template fallback upload are unverified under the browser security restriction. [Final evidence and acceptance mapping](../../sprints/evidence/SPRINT-021/phase12.md) distinguish passed checks, controlled fault injection, blocking upload gaps and the user-deferred native composition evidence. EPIC-20 remains in-progress; no completed_sprint is assigned until its criteria pass.

The [main-checkout continuation](../../sprints/evidence/SPRINT-021/main-checkout-resume.md)
retried the normal Chrome file chooser after the user reported fixing permissions.
The upload security check again returned a dismissed permission request. Nine
actionable SPRINT-021 items and BW-2008–BW-2012 acceptance remain open. No commit,
original-worktree modification or security workaround was made.

The [second main-checkout retry](../../sprints/evidence/SPRINT-021/main-checkout-retry2.md)
again encountered a dismissed upload permission request. All nine actionable
sprint items remain open; EPIC-20 stays in-progress without a completed_sprint.

## Completion — SPRINT-021, 2026-09-27 UTC

All twelve tickets are done with `completed_sprint: SPRINT-021`; all eight prerequisite epics remain done. The [acceptance mapping and B01–B10 matrix](../../sprints/evidence/SPRINT-021/phase12.md) and [interactive transfer evidence](../../sprints/evidence/SPRINT-021/interactive-transfer-closeout.md) satisfy the Done When criteria, including complete author/read/transfer/recovery workflows and existing-workflow compatibility. All 18 interactive observations passed; earlier upload failures remain historical. The [closeout audit](../../sprints/evidence/SPRINT-021/interactive-closeout.md) records final verification, all 68 checked sprint items and synchronized completion metadata/results.

Native composition completion/cancellation/candidate evidence is unverified/deferred by user decision, never passed. Public discovery, PvX intake, publishing and the other explicit exclusions remain future scope. Production source and unrelated local edits were preserved. No commit or push was made; the outer runner owns commits.
