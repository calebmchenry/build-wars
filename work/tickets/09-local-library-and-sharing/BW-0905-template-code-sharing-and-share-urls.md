---
id: BW-0905
title: Template Code Sharing and Share URLs
epic: EPIC-09
status: ready
priority: high
depends_on:
  - BW-0903
created: 2026-09-02
updated: 2026-09-02
---

# BW-0905: Template Code Sharing and Share URLs

## Goal

Use Guild Wars/Reforged skill template codes as the single-build import/export and compact sharing
format.

## Scope

- Export the current draft or selected saved build as a skill template code when EPIC-05 fidelity
  rules allow it.
- Import bare skill template codes and chat wrappers into the working draft, not directly into the
  saved library.
- Support share URLs for single builds by encoding template-code-first data in the URL.
- Include only profession, attributes, mode where representable, skill bar, and template code facts
  in share URLs.
- Exclude tags, favorite state, notes, library IDs, equipment, runes, insignias, weapon mods, party
  data, guide data, and library metadata from template-code sharing.
- Fall back to selectable/exported template text when a build cannot fit a conservative URL-size
  cap.

## Out Of Scope

- Single-build JSON as a normal user exchange workflow, hosted sharing, short links, backend upload,
  equipment template sharing, paw-ned2/team sharing, automatic clipboard reads, and network sync.

## Acceptance Criteria

- Single-build import/export UX is template-code based.
- Loading a share URL populates the working draft and does not silently save to the library.
- Oversized or lossy share attempts produce clear fallback behavior.
- URL import/export preserves unresolved raw IDs according to EPIC-08/EPIC-05 policy where possible.

## Verification

- `npm run verify`
