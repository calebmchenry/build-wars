# Sprint 012 Intent: Insignias Catalog

## Seed

Create a ticket-burn sprint from `work/tickets/11-insignias/EPIC.md` for `EPIC-11 Insignias`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-11`
- source_epic_path: `work/tickets/11-insignias/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-012.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-11` and BW-1101 through BW-1106, ledger
sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-11-result.json`.

## Context

- `SPRINT-001` through `SPRINT-011` are completed in `work/sprints/ledger.tsv`; `SPRINT-012` is the
  next sprint ID.
- `EPIC-11` is `ready`, depends on completed source policy, ingestion platform, and
  professions/attributes work, and already has six ready tickets: BW-1101 through BW-1106.
- The current app has a shipped single-character skill/attribute editor, local saved-build library,
  template sharing, promoted professions/attributes, promoted skills, and promoted runes.
- `InsigniaId` already exists in `src/domain/ids.ts`, and `ArmorPiece.insigniaId` exists in
  `src/domain/equipment.ts`, but `src/domain/catalog.ts` currently exposes only a minimal
  `Insignia` interface and no runtime insignia catalog, effect, slot-scaling, or QA contract.
- The sprint must plan documentation and traceability updates but must not change implementation
  code during planning.

## Recent Sprint Context

- `SPRINT-003` established the MediaWiki ingestion spine: bounded live access, raw snapshot storage,
  canonical artifact writing, metadata-only icon resolution, QA reports, and fixture mode.
- `SPRINT-004` promoted the EPIC-03 professions/attributes catalog. EPIC-11 must use those records
  for profession restrictions and any attribute-linked insignia facts.
- `SPRINT-005` promoted the EPIC-04 skills catalog and established source-plan digests, selected
  offline replay, section digests, semantic catalog versions, QA gates, and exact-path allowlisting.
- `SPRINT-011` promoted the EPIC-10 runes catalog and is the closest precedent for a content sprint
  over armor upgrades, metadata-only icons, compact runtime dispositions, and blocked promotion
  semantics when live source/review gates fail.
- Current docs state that equipment, armor/headgear, insignias, and full stat totals remain deferred
  from runtime UI and saved-build behavior.

## Relevant Codebase Areas

- `src/domain/ids.ts` already defines `InsigniaId` and should remain the branded ID source.
- `src/domain/equipment.ts` already models `ArmorPiece.insigniaId`; EPIC-11 should not add equipment
  editor UI or armor-piece selection behavior.
- `src/domain/catalog.ts` should gain the framework-neutral insignia catalog contract, source-set
  summaries, records, slot applicability, effect variants, scaling semantics, dependency summaries,
  and any pure helper types needed by tests and downstream equipment work.
- `src/domain/catalog-lookup.ts` may need pure insignia lookup helpers if raw array lookup is not
  enough for later equipment-template or UI consumers.
- `src/domain/rune-effects.ts` and `src/domain/rule-engine.ts` are precedents for narrow pure helper
  boundaries. EPIC-11 should avoid a complete stat calculator.
- `scripts/data/build_wars_ingest/profiles.py`, `config.py`, `pipeline.py`, `cli.py`, `models.py`,
  `qa.py`, `artifacts.py`, `icons.py`, and new insignia-specific modules should follow the EPIC-10
  profile pattern.
- `scripts/data/build_wars_ingest/rune_source_set.py`, `rune_extractor.py`,
  `rune_semantics.py`, and `rune_catalog.py` are the closest concrete ingestion analogs.
- `scripts/data/build_wars_ingest/tests/**` should cover profile registration, source resolution,
  extractors, semantic normalization, QA, determinism, and CLI behavior for EPIC-11.
- `test/fixtures/data-ingestion/` should add minimized synthetic insignia fixtures and generated
  golden fixture JSON.
- `data/generated/epic-11/insignias.catalog.json`,
  `data/generated/epic-11/insignias.catalog.manifest.json`, and
  `data/qa/epic-11/insignias.catalog.qa.json` are the expected exact promoted paths.
- `.gitignore`, `README.md`, `scripts/data/README.md`, `data/**/README.md`,
  `compendium/data-ingestion-platform.md`, a new `compendium/insignias-catalog.md`, and
  `compendium/README.md` need closeout updates.
- `work/tickets/11-insignias/*.md`, `work/sprints/ledger.tsv`, and the ticket-burn manifest must
  stay path/status consistent.

## Constraints

- Follow project instructions in `AGENTS.md`: keep human-facing updates concise and direct.
- Planning may modify sprint, draft, ticket, ledger, run-state, and manifest files only; it must not
  modify application implementation code or create a commit.
- Runtime app code may import promoted generated catalog JSON only through `src/app/catalogs.ts`;
  this sprint should not wire insignia data into the app UI.
- `src/domain` must remain framework-neutral and must not import React, DOM/browser APIs, browser
  storage, network clients, app modules, generated manifests, QA reports, source snapshots, or data
  scripts.
- The EPIC-11 catalog must be built through the existing EPIC-02 ingestion/profile/fixture/offline
  replay pattern, not a one-off insignia scraper.
- Runtime catalog data should contain structured factual records and compact provenance references,
  while snapshots, source plans, manifests, QA bodies, review evidence, media bytes, and raw page
  bodies stay outside runtime imports.
- Copied source-authored description prose is not required for the first runtime catalog; prefer
  structured effects plus reviewed short display text or explicit note states.
- Slot-scaled bonuses must be represented explicitly for head, chest, hands, legs, and feet where
  source data supports deterministic values. The catalog should not rely on downstream callers to
  remember Guild Wars armor-piece scaling rules from prose.
- Conditional, combat-state, or non-stacking behavior should remain typed notes or conservative
  effect rules until a later stat calculator can verify exact runtime semantics.
- Rune, armor-shell, dye, weapon, title, party, and guide data remain outside EPIC-11 except for
  narrow cross-reference facts needed to avoid catalog ambiguity.
- Final implementation verification should use `npm run verify`, with focused TypeScript and Python
  commands listed at phase gates.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-1101 through BW-1106 in dependency order with file-level tasks, phase gates, and verification.
- A framework-neutral `InsigniaCatalog` contract with stable IDs, names, normalized lookup keys,
  common/profession-specific availability, profession restrictions, slot applicability, icon
  metadata references, source references, and structured effects.
- An EPIC-11 ingestion profile with fixture, live source discovery, digest-confirmed fetch where
  needed, selected offline replay, and bounded source/candidate output.
- Insignia source-set planning that accounts for common insignias, profession-specific insignias,
  redirects, duplicate names, missing icons, malformed source shapes, unsupported or ambiguous
  records, and PvE/PvP availability differences when source facts support them.
- Extractors and semantic normalization for health, energy, armor, damage reduction, conditional
  effects, non-stacking notes, slot scaling, and note-only/unknown effects.
- Domain fixtures or pure helpers proving deterministic per-slot scaling across head, chest, hands,
  legs, and feet without implementing armor UI or full stat totals.
- Deterministic catalog assembly, section digests, semantic catalog versioning, QA gates, exact-path
  promotion, and `.gitignore` allowlisting for only approved EPIC-11 files.
- Closeout docs and ticket records that explain runtime import boundaries and downstream handoffs to
  EPIC-13, EPIC-14, EPIC-20, and EPIC-21.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-11 grooming decisions, BW-1101
  through BW-1106 acceptance criteria, source-policy gates, and the established EPIC-03/04/10
  catalog patterns.
- Spec/documentation: `work/tickets/11-insignias/EPIC.md`,
  `work/tickets/11-insignias/BW-110*.md`, `compendium/source-policy.md`,
  `compendium/data-ingestion-platform.md`, `compendium/professions-and-attributes.md`,
  `compendium/skills-catalog.md`, `compendium/runes-catalog.md`, and existing domain catalog tests.
- Edge cases identified:
  - common versus profession-specific insignias
  - profession restrictions and later armor legality without owning armor UI
  - per-piece slot scaling for head, chest, hands, legs, and feet
  - fixed health, energy, armor, armor-while-condition, damage-reduction, and note-only effects
  - conditional combat-state behavior that must not be converted into guessed arithmetic
  - non-stacking or same-family interactions that require explicit conservative representation
  - PvE/PvP availability differences when source evidence supports them
  - redirects, shared pages, duplicate source names, missing icons, unsupported source fields, and
    malformed effect text
  - source-authored prose exclusion and reviewed short display text policy
  - fixed-clock deterministic fixture generation and complete offline replay
  - exact-path allowlisting without leaking source plans, raw snapshots, QA summaries, or media bytes
- Testing approach:
  - focused TypeScript contract tests for `InsigniaCatalog`, effect variants, lookup helpers, and
    slot-scaling fixtures
  - focused Python tests for profile registration, source-set planning, page resolution, extraction,
    semantic normalization, QA findings, artifact generation, determinism, and CLI behavior
  - fixture regeneration byte comparisons under fixed clock
  - selected offline replay from a complete reviewed snapshot set
  - `git check-ignore -v` checks for promoted paths and representative ignored byproducts
  - final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium-High - insignia effects are broad and conditional, and slot
  scaling must be source-backed rather than inferred loosely.
- Scope uncertainty: Medium - the tickets are groomed and bounded, but execution must avoid drifting
  into armor editor UI, armor shell cataloging, rune composition, full stat calculation, acquisition
  prose, and guide data.
- Architecture uncertainty: Low-Medium - the work extends existing EPIC-03/04/10 catalog
  architecture and source-policy gates. No new high-risk architecture choice blocks planning.

## Open Questions

1. Which source-set authority gives complete player-usable insignia coverage with the smallest
   reviewable graph: an insignia index page, equipment-template modifier rows, common/profession
   pages, or a bounded hybrid?
2. Should public `InsigniaId` values anchor to verified equipment-template modifier IDs when they
   exist, or should v1 use schema-owned generated IDs plus optional template modifier crosswalks?
3. What exact TypeScript wire shape best distinguishes fixed values, slot-scaled values, conditional
   values, non-stacking facts, and note-only/unknown effects without building a complete stat
   calculator?
4. Which insignia families have source-clear deterministic arithmetic versus combat-state behavior
   that should remain note-only for EPIC-21?
5. Which QA findings should be non-waivable before promotion versus warning-level accepted risk?

## Non-Interactive Interview Decision

Interview is skipped under the ticket-burn contract. No high-risk architecture choice blocks
planning because EPIC-11 extends the existing source-policy and catalog-ingestion pattern rather
than introducing a new app architecture or external integration.
