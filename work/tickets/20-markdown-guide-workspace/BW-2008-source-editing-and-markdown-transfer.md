---
id: BW-2008
title: Source Editing and Markdown Transfer
epic: EPIC-20
status: in_progress
planned_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2002
  - BW-2003
  - BW-2004
  - BW-2005
  - BW-2006
created: 2026-09-26
updated: 2026-09-27
---

# BW-2008: Source Editing and Markdown Transfer

## Goal

Expose portable Markdown source without allowing partial parsing or mode changes to discard guide data.

## Scope

- Add source view with a recoverable draft buffer, diagnostics and explicit atomic Apply to the semantic guide.
- Preserve the last-valid guide on invalid/unsupported source; source/visual/read transitions must identify unapplied changes and offer the documented actions.
- Provide self-contained Markdown download and validated upload/paste import with safe cancellation and dirty-draft handling.
- Distinguish raw draft export from last-valid guide export. Preserve unknown segments and explain the supported dialect/normalization.
- Ensure visual edits and source Apply round-trip complete build adjustments, title/effect preferences, raw overlays, reference bindings and metadata.
- Apply inert content/link handling and document limits consistently across source, file import and paste; never render executable MDX/HTML or auto-fetch remote images.

## Acceptance Criteria

- Visual edit → source → Apply → export → import reproduces the same supported authored document, including two independently modified variants.
- Invalid source never partially changes a build, loses the raw draft, or silently reverts when changing views.
- Unknown raw content survives edits elsewhere exactly, or visual editing is recoverably blocked for that unsupported structure.
- Canceled/failed imports preserve the previous guide; annotations inside code fences remain literal text.

## Verification

Exercise malformed/partial source, unsupported versions, escaping, opaque segments, hostile HTML/URLs and boundary-size files. Verify an actual browser download/reimport plus valid and invalid source transitions; test semantic equality rather than byte-identical ordinary whitespace.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 8.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Execution progress

Implemented in SPRINT-021; 674 tests, lint and build passed. [Phase 8 evidence](../../sprints/evidence/SPRINT-021/phase8.md) records native source lifecycle and inspected download bytes. File-upload/reimport evidence is pending the browser permission gate, so this ticket is not done.

## Final SPRINT-021 execution record

Implementation and completed checks are linked in the [final acceptance matrix](../../sprints/evidence/SPRINT-021/phase12.md). Acceptance remains in progress because required browser file uploads/reimports and incoming ticket gates are open. The [upload permission gap](../../sprints/evidence/SPRINT-021/upload-permission-gap.md) is separate from native composition, which remains unverified/deferred by user decision. No completion or commit is claimed.
