---
id: BW-1904
title: Local Rune Icon Assets
epic: EPIC-19
status: done
priority: high
planned_sprint: SPRINT-020
completed_sprint: SPRINT-020
depends_on:
  - BW-1901
created: 2026-09-13
updated: 2026-09-14
---

# BW-1904: Local Rune Icon Assets

## Goal

Cache the real rune images needed by the inline controls using the existing asset/provenance approach.

## Scope

- Use the 126 attribute-rune records and their icon metadata in the promoted EPIC-10 catalog; they currently resolve to 30 profession/tier source images. Deduplicate binaries by verified media identity.
- Extend the documented cached-media exception narrowly for public/gww-icons/runes/, a local-path mapping, and a rune asset provenance manifest. The user's request authorizes this scope; do not add another routine approval gate.
- Reuse or extend the skill-icon tooling with a bounded rune input set, content/hash checks, deterministic local paths, and offline replay/verification where supported.
- Cache image bytes and record source URL, file title, source/hash information, and local destination. Do not use generated art or runtime wiki URLs.
- Keep runtime components behind the app-owned icon descriptor/mapping. Provide a labeled text/number fallback for a missing image without removing the rune control.
- Avoid unrelated rune/skill catalog regeneration and do not expand to non-attribute rune icons.

## Acceptance Criteria

- Each supported profession has usable minor, major, and superior rune icons with local-only runtime paths.
- Shared source images are cached once; all eligible attribute rune IDs resolve correctly.
- Buttons retain readable +1/+2/+3 values, complete accessible names, and missing-image fallback.
- Provenance and exact asset-policy scope are documented and tested at the asset boundary.

## Verification

Bounded ingestion/cache tests and catalog/icon mapping checks, including source deduplication and missing images; inspect actual resulting assets.

## Design Authority

[Composer attribute adjustments](../../../compendium/attribute-adjustments.md) and the
[epic contract](EPIC.md). User decisions there override older sprint scope.

## Planning

Planned in [SPRINT-020](../../sprints/SPRINT-020.md), Phase 4: Cache real rune icons.
The sprint phase checklist and gate implement this ticket's acceptance criteria.

Completed in [SPRINT-020](../../sprints/SPRINT-020.md); see [execution evidence](../../sprints/SPRINT-020-EVIDENCE.md). All 126 mappings / 30 original PNGs are present and hash-verified, with offline replay, failure recovery, local descriptor/fallback tests, and exact policy allowlists.
