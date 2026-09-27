---
id: BW-2001
title: Document Contracts and Editor Feasibility
epic: EPIC-20
status: done
planned_sprint: SPRINT-021
completed_sprint: SPRINT-021
priority: high
depends_on: []
created: 2026-09-26
updated: 2026-09-27
---

# BW-2001: Document Contracts and Editor Feasibility

## Goal

Settle the annotated-document contract and prove the writing interaction before choosing an editor dependency.

## Scope

- Audit the Guide scaffold, Build v4 snapshots/raw overlays, active-editor assumptions, persistence union, catalog actions and inline-safe tooltip markup. Record the intended boundaries in the design brief.
- Specify the supported Markdown dialect, version marker, annotation grammar, ID namespaces, metadata fields, template-versus-build authority and escaping. Include readable template-code input and lossless full-build output.
- Define generic/bound reference semantics, copy/duplicate/delete behavior, source-buffer Apply/recovery, history ownership, insertion bookmarks and explicit drop targets using the brief's defaults.
- Choose numerical source-byte, node/depth, build/reference and undo limits from representative documents. Define recoverable over-limit behavior and a long-document browser fixture.
- Evaluate a small number of maintained editor/parser choices against current official documentation, license, React/Vite compatibility, bundle impact, accessibility and Markdown fidelity. Keep the public document format independent of the chosen package.
- Build a bounded feasibility slice with a paragraph, atomic inline skill reference, editable build embed, keyboard focus and a shared undo sequence. Record the chosen approach and rejected alternatives; do not build a generic editor platform.

## Acceptance Criteria

- The brief/decision record contains concrete syntax examples and ownership rules sufficient for noninteractive follow-on tickets.
- The feasibility slice demonstrates text typing, embed control editing, undo back through both, and a semantic source round trip without lost focus or a second authoritative build payload.
- Unsupported content, invalid source, unknown IDs and catalog-without-build behavior have explicit outcomes.
- An execution plan can proceed without asking the user to pick a library or repeating the agreed product interview.

## Verification

Record the small prototype's actual-browser result and focused codec/history assertions. This ticket passes only with a demonstrated integration, not a list of candidate libraries. Preserve existing app behavior.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 1.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Initial SPRINT-021 execution (historical)

Blocked at the required native-browser evidence gate. Chrome tab checks and five
focused experiment tests passed, but native Chrome app control was denied and the
approved tab input did not demonstrate IME composition. Native undo proof and
remaining feasibility/capacity acceptance are incomplete. No completion claim.

See [execution evidence](../../sprints/SPRINT-021-EVIDENCE.md) and the
[deferred ADR](../../../compendium/decisions/0003-guide-editor-and-markdown-contract.md).
The experiment is preserved as a patch; active product code and dependencies were
restored. Resume this ticket before BW-2002–BW-2012.

## First SPRINT-021 resume (historical) — 2026-09-27 UTC

Still blocked, with a narrower evidence gap. Native Chrome permission now works;
native menu Undo and corrected keyboard history were observed. The resumed
experiment buffers composition candidates and fixes duplicate shortcut routing
(seven focused tests passed). Native Option-E/E still emits an untrusted
`compositionend`, reproduced in a plain uncontrolled textarea. Fully native
completion remains unverified; acceptance, contracts and capacity are incomplete.

[Resume evidence](../../sprints/evidence/SPRINT-021/resume-20260927.md) includes
traces, screenshots, the exact resumption question and the combined archived patch.
No provisional product route/dependency remains. Do not mark this ticket done or
start its dependents based only on restored permission or partial input events.

## Current verification scope — user decision, 2026-09-27 UTC

The user authorized skipping the remaining manual/native composition verification
and proceeding. See the [scope and retained requirements](../../sprints/evidence/SPRINT-021/native-composition-deferral.md).
That check remains unverified/deferred and no longer blocks this ticket or the
burn. All other acceptance criteria and automated composition regressions remain
required. This amendment supersedes the historical composition-only stop below;
it does not mark any implementation or evidence complete.

## Completion — SPRINT-021

Completed the non-deferred feasibility/contract gate in [SPRINT-021](../../sprints/SPRINT-021.md).
[Browser, package, capacity and validation evidence](../../sprints/evidence/SPRINT-021/resume2-phase1.md)
supports the accepted ADR. Native composition verification remains explicitly
unverified/deferred by user decision; automated regressions pass. Full production
integration and final browser evidence remain dependent ticket work.
