---
id: BW-0205
title: Icon Metadata Resolver
epic: EPIC-02
status: done
priority: high
depends_on:
  - BW-0201
  - BW-0202
  - BW-0204
planned_sprint: SPRINT-003
completed_sprint: SPRINT-003
created: 2026-09-01
updated: 2026-09-01
---

# BW-0205: Icon Metadata Resolver

## Goal

Resolve wiki file metadata for icons without committing image binaries during the initial ingestion platform work.

## Scope

- Resolve explicit `image=` fields from parsed templates when present.
- Derive candidate file titles such as `File:{name}.jpg` and `File:{name}.png` when pages rely on infobox defaults.
- Query MediaWiki `prop=imageinfo` for URL, mime type, width, height, file size, upload timestamp, sha1, and description URL.
- Prefer deterministic selection rules when both `.jpg` and `.png` exist.
- Record ambiguous, missing, non-64x64, or unexpected mime icons in QA output.
- Do not download or commit icon image files unless a later offline/PWA ticket explicitly approves it.

## Acceptance Criteria

- The resolver handles explicit image fields and default infobox image names.
- Missing and ambiguous icon cases are reported with enough context for manual review.
- Resolved icon metadata includes provenance and MediaWiki file metadata.
- Generated records reference URLs and hashes, not cached binaries.
- The resolver is reusable by later skill, rune, insignia, hero, and equipment content work.

## Verification

- `npm run verify`
- Focused icon resolver tests added by the implementation sprint
