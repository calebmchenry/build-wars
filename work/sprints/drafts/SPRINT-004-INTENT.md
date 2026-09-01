# Sprint 004 Intent: Professions and Attributes Catalog

## Seed

Create an executable ticket-burn sprint from `work/tickets/03-professions-and-attributes/EPIC.md` for `EPIC-03 Professions and Attributes`.

Automation constraints:

- Use `work/tickets` and `work/sprints`.
- Write planning artifacts under `work/sprints/drafts/`.
- Write the final sprint to `work/sprints/SPRINT-004.md`.
- Create or update BW ticket files in `work/tickets/03-professions-and-attributes/` where useful.
- Do not modify application or ingestion implementation code during planning.
- Do not commit.
- Skip routine interview unless a high-risk architecture choice appears; record assumptions if skipped.

## Context

- Build Wars is a local-first React/Vite/TypeScript app with framework-neutral plain-data domain contracts in `src/domain`, browser UI in `src/app`, and offline/live data tooling isolated under `scripts/data`.
- `SPRINT-001` through `SPRINT-003` are completed in `work/sprints/ledger.tsv`. EPIC-00 through EPIC-02 are marked done, so EPIC-03 dependencies are satisfied.
- EPIC-02 delivered a shared Guild Wars Wiki MediaWiki API client, verified source snapshots, `mwparserfromhell` parsing, metadata-only icon resolution, canonical JSON artifact writing, QA reports, and `npm run data:regenerate` fixture mode.
- EPIC-03 currently has an epic file only, so this planning run adds BW-0301 through BW-0306 for traceability.
- Planning-time wiki API checks found likely source candidates: `Profession`, `Attribute`, `Skill template format`, and `Attribute point`. Implementation must fetch and verify fresh snapshots rather than trusting planning-time metadata.

## Recent Sprint Context

- SPRINT-001 established the single-package TypeScript app, `src/domain` boundary, synthetic fixtures, and `npm run verify`.
- SPRINT-002 established the source policy, provenance contracts, artifact retention rules, manual review requirements, and source-derived data gates.
- SPRINT-003 established the reusable ingestion platform and explicitly deferred full profession, attribute, skill, equipment, rune, insignia, hero, title, and runtime app catalog data to later epics.

## Relevant Codebase Areas

- `src/domain/catalog.ts`, `src/domain/ids.ts`, `src/domain/build.ts`, and `src/domain/source.ts` for catalog, ID, build allocation, provenance, media, generated artifact, and QA contracts.
- `scripts/data/build_wars_ingest/api.py`, `snapshots.py`, `wikitext.py`, `icons.py`, `artifacts.py`, `qa.py`, `pipeline.py`, and `cli.py` for extending source extraction and regeneration.
- `test/domain/*.test.ts`, `test/fixtures/foundation.ts`, and `test/fixtures/data-ingestion/**` for TypeScript contract and Python fixture coverage.
- `data/source-snapshots`, `data/generated`, `data/qa`, `scripts/data/README.md`, `data/*/README.md`, `compendium/source-policy.md`, `compendium/data-qa-and-release.md`, and `compendium/data-ingestion-platform.md` for artifact ownership and policy.
- `work/tickets/03-professions-and-attributes/*.md`, `work/sprints/SPRINT-004.md`, and `work/sprints/ledger.tsv` for ticket-burn records.

## Constraints

- Must follow `AGENTS.md`: concise, direct human communication.
- Must keep runtime app code isolated from data scripts, raw snapshots, source APIs, and QA reports.
- Must not introduce a profession-specific scraper; new content work plugs into the EPIC-02 ingestion spine.
- Must keep `npm run verify` fast and offline.
- Must keep live wiki refresh explicit, bounded, and ignored by default.
- Must preserve EPIC-01 source policy: no copied community prose, no cached icon binaries, provenance for generated data, field-level classification where needed, and QA/manual review for ambiguous copied or publisher-owned material.
- Must commit generated profession/attribute data only through exact-path allowlisting and QA closeout.
- Must preserve template ID gaps and sentinel values instead of compacting IDs.

## Success Criteria

- BW-0301 through BW-0306 are executable, ordered, and linked to SPRINT-004.
- SPRINT-004 defines one coherent implementation plan for the full EPIC-03 scope.
- The plan produces a generated catalog with ten playable professions and every attribute listed by the skill template format.
- Template profession and attribute IDs map to names and back, including the profession `None` sentinel and non-contiguous attribute IDs.
- Attribute allocation validation inputs exist: profession ownership, primary-only flags, point-cost table, level totals, quest reward metadata, and default level-20 assumptions.
- Generated records carry provenance, QA reports identify content/source issues, and approved runtime catalog paths are explicit.

## Verification Strategy

- Reference implementation: compare generated template ID crosswalks against verified snapshots of Guild Wars Wiki `Skill template format`; compare profession/attribute ownership against verified `Profession` and `Attribute` snapshots.
- Spec/documentation: EPIC-03, EPIC-01 source policy, EPIC-02 ingestion rules, and the current domain boundary define correctness.
- Edge cases identified: profession `0` none sentinel, attribute ID gaps, redirects, duplicate or malformed wiki rows, primary-only attributes on secondary professions, icon ambiguity, missing revision metadata, copied-effect-summary risk, level-20 without quests, level-20 with quests, and rank 0/rank 12 point boundaries.
- Testing approach: focused Vitest contract tests, offline Python extractor and QA tests, deterministic fixture regeneration, generated artifact baseline checks, and canonical `npm run verify`.

## Uncertainty Assessment

- Correctness uncertainty: Medium-High - the domain is stable, but exact game catalog and source-page parsing require verified snapshots and QA.
- Scope uncertainty: Medium - EPIC-03 is bounded to professions/attributes but includes generated-data promotion and multiple validation tables.
- Architecture uncertainty: Low - the sprint extends the established EPIC-02 ingestion spine and EPIC-01 policy gates rather than introducing a new architecture.

## Open Questions

1. Should generated effect summaries be treated as human-authored derived summaries with manual review rather than copied page text?
2. Which exact generated catalog paths should be allowlisted for runtime consumption?
3. Should the sprint include a bounded manual live refresh, or only implement the path and keep CI fixture-only?
4. Should PvP character and hero attribute-point assumptions be represented now or explicitly deferred after the MVP build editor requirements harden?
