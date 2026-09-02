# Sprint 005 Intent: Skills Catalog

## Amendment

The original intent referenced `Guild Wars Wiki:Game integration/Skills/0`, but live source-shape
validation found that exact title missing. The approved source authority for `SPRINT-005` is
`Guild Wars Wiki:Game integration/Skills` as the source-set index plus its linked ranged skill pages
under `Guild Wars Wiki:Game integration/Skills/*` as the authoritative skill-id seed set.

## Seed

Create an executable ticket-burn sprint from `work/tickets/04-skills/EPIC.md` for `EPIC-04 Skills`.

Automation constraints:

- Use `work/tickets` and `work/sprints`.
- Write planning artifacts under `work/sprints/drafts/`.
- Write the final sprint to `work/sprints/SPRINT-005.md`.
- Create or update BW ticket files in `work/tickets/04-skills/` where useful for traceability.
- Do not modify application or ingestion implementation code during planning.
- Do not commit.
- Skip routine interview unless a high-risk architecture choice appears; record assumptions if skipped.

## Context

- Build Wars is a local-first React/Vite/TypeScript app with framework-neutral plain-data contracts in `src/domain`, browser UI in `src/app`, and offline/live ingestion tooling isolated under `scripts/data`.
- `SPRINT-001` through `SPRINT-004` are completed in `work/sprints/ledger.tsv`. EPIC-00 through EPIC-03 are done, so EPIC-04 dependencies on source policy, ingestion, and professions/attributes are satisfied.
- EPIC-02 delivered the reusable Guild Wars Wiki MediaWiki client, verified snapshots, `mwparserfromhell` parsing, metadata-only icon resolution, canonical JSON artifact writing, QA reports, and fixture/offline/live regeneration modes.
- EPIC-03 delivered the first runtime-eligible generated catalog at `data/generated/epic-03/professions-attributes.catalog.json`, including template ID crosswalks, source-policy gates, QA promotion, and exact-path allowlisting.
- EPIC-04 currently had only an epic file, so this planning run adds BW-0401 through BW-0406 for traceability.

## Recent Sprint Context

- SPRINT-001 established the app scaffold, domain boundary, synthetic fixtures, and `npm run verify`.
- SPRINT-002 established source policy, provenance contracts, artifact retention rules, manual review requirements, and generated-data gates.
- SPRINT-003 established the reusable ingestion platform and skill ID enumeration proof for the game-integration skill ID map.
- SPRINT-004 extended the ingestion platform into a promoted professions/attributes catalog, preserving template ID gaps, source provenance, deterministic artifacts, metadata-only remote media, QA gates, and first-baseline review.

## Relevant Codebase Areas

- `src/domain/catalog.ts`, `src/domain/ids.ts`, `src/domain/build.ts`, `src/domain/catalog-lookup.ts`, and `src/domain/source.ts` for catalog, skill ID, profession/attribute joins, provenance, media, generated artifact, and QA contracts.
- `scripts/data/build_wars_ingest/skill_ids.py`, `wikitext.py`, `api.py`, `snapshots.py`, `icons.py`, `artifacts.py`, `qa.py`, `profiles.py`, `pipeline.py`, and `cli.py` for EPIC-04 profile, source-set resolution, extraction, assembly, and regeneration.
- EPIC-03 modules such as `template_ids.py`, `professions_attributes.py`, `attribute_points.py`, and `profession_attribute_catalog.py` for patterns to mirror without coupling skill extraction to UI code.
- `test/domain/*.test.ts`, `scripts/data/build_wars_ingest/tests/*.py`, and `test/fixtures/data-ingestion/**` for TypeScript contract, Python extractor, fixture, determinism, and QA coverage.
- `data/README.md`, `data/generated/README.md`, `data/qa/README.md`, `compendium/source-policy.md`, `compendium/data-qa-and-release.md`, and `.gitignore` for generated-data policy and promotion rules.
- `work/tickets/04-skills/*.md`, `work/sprints/SPRINT-005.md`, `work/sprints/drafts/SPRINT-005-*`, and `work/sprints/ledger.tsv` for ticket-burn records.

## Constraints

- Must follow `AGENTS.md`: concise, direct human communication.
- Must keep runtime app code isolated from data scripts, source snapshots, source APIs, generated manifests, and QA reports.
- Must not introduce a skill-specific scraper outside the EPIC-02 ingestion spine.
- Must keep `npm run verify` fast and offline.
- Must keep live Guild Wars Wiki refresh explicit, bounded, manual-only, and ignored by default.
- Must preserve EPIC-01 source policy: no cached icon binaries, no unreviewed copied page prose, complete source references and provenance for generated data, field-level classification where needed, and QA/manual review for ambiguous material.
- Must consume the EPIC-03 profession/attribute catalog as the authority for profession and attribute joins rather than duplicating those facts.
- Must preserve non-contiguous skill IDs and represent unknown authored IDs for future template compatibility.
- Must handle the EPIC-04 scale risk: the full skill catalog is high-volume relative to earlier content, so source-set discovery, batched fetch, fixture minimization, and QA gating need explicit limits.

## Success Criteria

- BW-0401 through BW-0406 are executable, ordered, and linked to `SPRINT-005`.
- The sprint defines one coherent implementation plan for the full EPIC-04 skills catalog scope.
- All known skill template IDs from the accepted game-integration source set resolve to catalog records or explicit QA dispositions.
- Skill search and dynamic tooltips can be driven from catalog data without reading raw snapshots or parser output.
- Skill records include stable IDs, names, wiki URLs, campaign, profession, attribute, type, costs, flags, descriptions, progressions, split relationships, provenance, and metadata-only icons where available.
- QA reports flag missing icons, costs, descriptions, progressions, split relationships, malformed templates, duplicate IDs, duplicate titles, missing source references, stale revision metadata, copied-text risk, and artifact integrity mismatches.
- Exact promoted paths are explicit: `data/generated/epic-04/skills.catalog.json`, `data/generated/epic-04/skills.catalog.manifest.json`, and `data/qa/epic-04/skills.catalog.qa.json`.

## Verification Strategy

- Reference implementation: compare skill IDs and titles against verified snapshots of `Guild Wars Wiki:Game integration/Skills` plus linked ranged skill pages under `Guild Wars Wiki:Game integration/Skills/*`; compare profession and attribute joins against the approved EPIC-03 generated catalog.
- Spec/documentation: EPIC-04, EPIC-01 source policy, EPIC-02 ingestion rules, EPIC-03 catalog semantics, current domain boundary, and data directory policy define correctness.
- Edge cases identified: duplicate IDs, non-contiguous IDs, redirects, disambiguation pages, PvE/PvP title variants, missing detail pages, missing infoboxes, elite skills, signets, adrenaline, sacrifice, upkeep, overcast, title skills, no-attribute skills, morale-boost recharge, PvE-only and PvP-only wrappers, malformed progression templates, ambiguous icon metadata, and copied-description risk.
- Testing approach: focused Vitest contract tests, Python extractor tests with minimized fixtures, deterministic fixture regeneration, selected offline replay, generated artifact/QA integrity checks, exact-path ignore checks, and canonical `npm run verify`.

## Uncertainty Assessment

- Correctness uncertainty: Medium-High - Guild Wars skill behavior is stable, but full catalog correctness depends on verified source snapshots, split/progression parsing, and QA coverage across many edge cases.
- Scope uncertainty: Medium - EPIC-04 is broad and high-volume, but it is bounded to generated catalog data and explicitly excludes UI search, build editor behavior, template import/export, rule enforcement, and runtime attribution UI.
- Architecture uncertainty: Medium - the sprint extends existing ingestion/profile/catalog patterns, but the dynamic source-set and batched detail-page fetch are larger than previous static profiles.

## Open Questions

1. How should the profile cap and batch large skill detail-page fetches while staying deterministic and manually bounded?
2. Which raw or rendered description fields are policy-safe enough for runtime tooltip/search consumption, and which must remain excluded or manually reviewed?
3. How should PvE/PvP split records model canonical IDs, variant pages, and tooltip selection without pre-implementing the rule engine?
4. Which progression forms should block promotion if unsupported, and which can be represented as raw structured evidence with reviewed QA disposition?
5. Should skill acquisition metadata be included only when it is small, factual, and guide-useful, or deferred entirely to guide-authoring work?
