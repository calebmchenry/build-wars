---
id: BW-0401
title: Skill Catalog Contracts and EPIC-04 Profile
epic: EPIC-04
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-005
completed_sprint: SPRINT-005
created: 2026-09-01
updated: 2026-09-02
---

# BW-0401: Skill Catalog Contracts and EPIC-04 Profile

## Planning Amendment

SPRINT-005 initially blocked during source-shape validation because
`Guild Wars Wiki:Game integration/Skills/0` returns `API_MISSING_PAGE` from the live MediaWiki API.
The approved amendment is to treat `Guild Wars Wiki:Game integration/Skills` as the source-set
index and its linked ranged skill pages under `Guild Wars Wiki:Game integration/Skills/*` as the
authoritative seed set. The missing `/Skills/0` page is retained only as blocker history and must
not be required by the implementation.

## Goal

Extend the framework-neutral catalog and ingestion profile contracts so every generated Guild Wars skill can be represented with stable IDs, source provenance, costs, flags, descriptions, progression metadata, split relationships, and remote icon metadata.

## Scope

- Add a `SkillCatalog` envelope modeled after the EPIC-03 profession/attribute catalog, while keeping the runtime catalog focused on semantic skill facts, compact source/provenance IDs, EPIC-03 dependency digests, source-set summary, skill records, progressions, split groups, and remote media references.
- Expand the existing `Skill` domain shape into a generated skill record contract with skill ID, canonical name, wiki URL, campaign, profession, attribute, type, cost fields, flags, raw structured description fields, rendered description fields where policy allows, progression references, split relationship metadata, and acquisition metadata only if it is needed for guide authoring.
- Define distinct contracts for skill cost values: energy, adrenaline, sacrifice, upkeep, overcast, activation, recharge, morale-boost recharge, signet/no-cost, and absent/not-applicable values.
- Add an EPIC-04 profile that starts from the game-integration skill ID map index plus linked ranged pages and resolves detail pages through verified snapshots rather than a hand-maintained static title list.
- Add manifest/QA contracts that own child snapshot paths, generation inputs, full review evidence, artifact digests, and release gates outside the runtime catalog.
- Keep runtime app code isolated from ingestion code, source snapshots, QA reports, and wiki APIs.

## Acceptance Criteria

- `src/domain` remains plain-data and framework-neutral.
- Skill IDs stay numeric and non-compacted; unknown authored skill IDs remain representable for later template compatibility.
- Skill records can distinguish missing, zero, not-applicable, and special-case cost values.
- PvE-only, PvP-only, PvE/PvP split, elite, common, no-attribute, title, and special-skill flags are representable without UI logic.
- The EPIC-04 profile records page, request, response-size, parser-size, and source-family limits suitable for a large catalog refresh.
- The runtime catalog does not embed the adjacent generated artifact manifest, local snapshot paths, complete source-shape proof blobs, or full QA/manual-review evidence.
- Existing EPIC-02 and EPIC-03 profiles and fixture regeneration remain compatible.

## Verification

- `npm run typecheck`
- Focused Vitest contract tests for skill catalog records, cost variants, flags, progression references, split relationships, and unknown IDs
- Focused Python profile tests proving EPIC-02 and EPIC-03 profile choices still work
