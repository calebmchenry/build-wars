---
id: BW-2011
title: Original Example Guide and Workflow Coverage
epic: EPIC-20
status: in_progress
planned_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2005
  - BW-2006
  - BW-2007
  - BW-2008
  - BW-2009
  - BW-2010
created: 2026-09-26
updated: 2026-09-27
---

# BW-2011: Original Example Guide and Workflow Coverage

## Goal

Prove the integrated workflow with a realistic original guide rather than isolated component examples.

## Scope

- Create an original dagger-themed two-variant example with headings, prose, inline generic/bound skills, optional slots, template input, rune/headgear bonuses, usage, recommendations, counters and source links.
- Use current approved catalog identities and local assets; verify fixture codes through the existing codec. Mark the example as an interaction sample, not an asserted current meta recommendation.
- Record source/provenance metadata for external references without copying PvX guide prose, ratings or page bodies into the runtime sample.
- Connect the example to the Guide workspace in a non-destructive way that does not overwrite an existing draft on app load.
- Add integrated scenarios covering write/edit/reference/drop/undo/source/save/reload/read/export-reimport plus a representative long-document fixture.
- Cover unresolved references and raw template facts, explicit context after card selection changes, and generic mentions without a build.

## Acceptance Criteria

- One repeatable end-to-end example exercises the user-facing promise: write prose, drag a skill into text and another into a build, change bonuses, save, reload and read.
- Export/reimport preserves both variants and their differing contextual skill values.
- Example content is original and source-linked; no live PvX request, copied guide dataset or unapproved remote image is required to run it.
- Loading the sample preserves the user's previous draft through normal replacement handling.

## Verification

Run integrated component/domain suites and prepare the browser fixture/script for BW-2012. Validate expected identities, semantics and source policy; avoid snapshot tests that merely mirror generated markup.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 11.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Execution progress

Implementation and focused/full automated validation are present in SPRINT-021. Final browser acceptance is still being completed. Acceptance remains in progress while the required upstream BW-2008 file-upload gate is unresolved; no dependent completion is claimed.

## Final SPRINT-021 execution record

Implementation and completed checks are linked in the [final acceptance matrix](../../sprints/evidence/SPRINT-021/phase12.md). Acceptance remains in progress because required browser file uploads/reimports and incoming ticket gates are open. The [upload permission gap](../../sprints/evidence/SPRINT-021/upload-permission-gap.md) is separate from native composition, which remains unverified/deferred by user decision. No completion or commit is claimed.
