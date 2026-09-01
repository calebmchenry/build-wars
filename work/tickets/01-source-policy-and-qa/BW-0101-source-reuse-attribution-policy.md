---
id: BW-0101
title: Source Reuse and Attribution Policy
epic: EPIC-01
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-002
completed_sprint: SPRINT-002
created: 2026-09-01
updated: 2026-09-01
---

# BW-0101: Source Reuse and Attribution Policy

## Goal

Document the conservative source-use rules Build Wars must follow before importing or publishing
external Guild Wars data, wiki text, PvX/Fandom metadata, screenshots, icons, or generated records.

## Scope

- Define default reuse rules for factual IDs/metadata, copied source text, derived values, manual
  overrides, screenshots, icons, and community guide metadata.
- Define attribution expectations for Guild Wars Wiki, PvX/Fandom, game-client/ArenaNet/NCSoft
  material, and ambiguous or unknown source classes.
- Keep PvX/Fandom/community guide content metadata-and-link-only until a later policy explicitly
  allows copied prose.
- Preserve the EPIC-01 note that this is project policy and not legal advice.

## Acceptance Criteria

- A durable compendium source policy exists and is linked from the compendium index.
- The policy clearly separates factual metadata, copied contributor text, game-owned material,
  derived normalized values, manual overrides, external community links, screenshots, and unknown
  cases.
- Attribution requirements include source name, source URL, page or file identity when available,
  revision identity, source revision timestamp, retrieval timestamp, and license/source notes.
- The policy forbids committing or using icon files, screenshots, PvX guide prose, ratings text,
  usage notes, or large page bodies as runtime assets in this sprint.
- The policy states that ambiguous licensing/source cases must be flagged for manual review before
  public release or runtime inclusion.

## Verification

- Manual review of the compendium policy against EPIC-01 policy defaults.
- `npm run verify`
