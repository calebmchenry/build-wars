---
id: BW-2002
title: Guide Model and Annotated Markdown Codec
epic: EPIC-20
status: done
planned_sprint: SPRINT-021
completed_sprint: SPRINT-021
priority: high
depends_on:
  - BW-2001
created: 2026-09-26
updated: 2026-09-27
---

# BW-2002: Guide Model and Annotated Markdown Codec

## Goal

Represent a portable guide with ordinary prose, complete builds and stable skill references without tying its meaning to an editor framework.

## Scope

- Evolve src/domain/guide.ts and its exports deliberately; audit existing consumers. Introduce versioned guide/block/build identities, document metadata and generic or explicit build-bound references.
- Reuse current Build contracts through a durable snapshot adapter that also preserves raw template overlays and PvE budget; keep app/editor dependencies outside the domain.
- Implement parsing and serialization for the BW-2001 grammar, template shorthand, explicit bonuses, title/effect preferences, source metadata and retained opaque content.
- Preserve ordinary Markdown and annotation-looking text inside escaped text/code fences. Diagnose duplicate IDs, conflicting template/payload fields, malformed data, unknown IDs and unsupported versions.
- Implement bounded validation, inert unknown nodes and recoverable raw-source results. Rendering must not execute HTML/MDX or fetch external assets.
- Provide pure resolution/remapping helpers for guide-local context, duplication and cross-document fragment transfer.

## Acceptance Criteria

- Supported documents parse/serialize/parse to equivalent authored meaning, including attributes, adjustments, title overrides, raw overlays, metadata and context.
- Unknown constructs are retained exactly as opaque content or force recoverable source mode; no silent stripping or partial valid-document replacement occurs.
- Catalog IDs cannot be confused with template IDs, and missing records remain addressable without a catalog lookup in the domain.
- Conflicting/duplicate/malicious/oversized input produces deterministic diagnostics rather than data loss or code execution.

## Verification

Add focused golden round-trip fixtures for plain prose, two variants, incomplete and unresolved builds, rich metadata, escaping, unknown syntax, conflicting fields, deep/oversized inputs and unsafe links. Test meaningful semantic and opaque-content invariants rather than serializer implementation details.

## Design Authority

[Markdown Guide Workspace](../../../compendium/guide-workspace.md) and
[EPIC-20](EPIC.md). This is planned work; the burn runner assigns the executing
sprint and records completion evidence.

## Planning

Planned in [SPRINT-021](../../sprints/SPRINT-021.md), Phase 2.
The sprint preserves this ticket's dependencies, acceptance criteria and verification gates.
Implementation and required browser evidence remain pending; planning is not completion.

## Completion — SPRINT-021

Implemented and validated in [SPRINT-021](../../sprints/SPRINT-021.md).
[Model, codec, identity and validation evidence](../../sprints/evidence/SPRINT-021/phase2.md)
covers the acceptance criteria. Persistence and workspace UI remain dependent work.
