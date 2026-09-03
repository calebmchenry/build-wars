# Sprint 013 Intent: Weapons and Mods Catalog

## Seed

Create a ticket-burn sprint from `work/tickets/12-weapons-and-mods/EPIC.md` for
`EPIC-12 Weapons and Mods`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-12`
- source_epic_path: `work/tickets/12-weapons-and-mods/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-013.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-12` and BW-1201 through BW-1207,
ledger sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-12-result.json`.

## Context

- `SPRINT-001` through `SPRINT-012` are completed in `work/sprints/ledger.tsv`; `SPRINT-013` is the
  next sprint ID.
- `EPIC-12` is `ready`, depends on completed source policy, ingestion platform,
  professions/attributes, and raw equipment-template compatibility work, and has seven ready
  tickets: BW-1201 through BW-1207.
- The current app has promoted professions/attributes, skills, runes, and insignias catalogs, plus a
  shipped single-character skill/attribute editor, local library, share URLs, and raw equipment
  template decode/export boundaries.
- `WeaponId`, `WeaponModifierId`, `TemplateEquipmentItemId`, and `TemplateEquipmentModifierId`
  already exist in `src/domain/ids.ts`; `src/domain/equipment.ts` has lightweight weapon-set
  placeholders but no runtime weapon/mod catalog, compatibility semantics, or semantic equipment
  template resolution.
- Planning may update sprint, draft, ticket, ledger, run-state, and result-manifest records only. It
  must not modify implementation code or create a commit.

## Recent Sprint Context

- `SPRINT-003` established the MediaWiki ingestion spine: bounded live access, raw snapshot storage,
  canonical artifact writing, metadata-only icon resolution, QA reports, and fixture/offline/live
  modes.
- `SPRINT-004` promoted the EPIC-03 professions/attributes catalog. EPIC-12 must use those records
  for requirement and attribute-reference joins.
- `SPRINT-005` promoted the EPIC-04 skills catalog and established source-plan digests, selected
  offline replay, section digests, semantic catalog versions, compact runtime dispositions, QA
  gates, and exact-path allowlisting.
- `SPRINT-006` added framework-neutral raw equipment template decode/export and exact-source
  fidelity. EPIC-12 should map verified raw item/modifier IDs without making unknown equipment
  template facts lossy.
- `SPRINT-011` and `SPRINT-012` promoted armor-upgrade catalogs for runes and insignias. They are
  the closest precedents for bounded source authority, metadata-only media, domain-only runtime
  contracts, source-set planning, selected snapshot replay, and blocked-promotion semantics.

## Relevant Codebase Areas

- `src/domain/ids.ts` already defines `WeaponId`, `WeaponModifierId`,
  `TemplateEquipmentItemId`, and `TemplateEquipmentModifierId`; EPIC-12 should reuse these branded
  IDs unless implementation proves a narrow gap.
- `src/domain/equipment.ts` already defines `WeaponSet`, `Weapon`, and `WeaponModifier`; the sprint
  should preserve these lightweight authored-build placeholders and avoid equipment UI or full stat
  modeling.
- `src/domain/catalog.ts` should gain framework-neutral weapon base and weapon upgrade catalog
  contracts, source-set summaries, dependency summaries, records, compatibility facts, requirement
  facts, effect variants, template crosswalks, dispositions, and metadata-only media references.
- `src/domain/catalog-lookup.ts` may need pure lookup outcomes for weapon item IDs and weapon
  modifier IDs, matching the existing skill/rune/insignia lookup style while preserving unknown and
  dispositioned raw IDs.
- A narrow pure helper may be useful for explaining base weapon/mod compatibility. It must not own
  equipment editor state, weapon-set selection, attribute-rank satisfaction, combat simulation, DPS,
  or full stat totals.
- `src/template-compatibility/equipment-template.ts` and
  `test/fixtures/template-compatibility/equipment-cases.json` are the raw-template boundary. EPIC-12
  consumes decoded IDs as mapping inputs; it should not replace the codec or weaken exact-source
  replay.
- `scripts/data/build_wars_ingest/config.py`, `profiles.py`, `pipeline.py`, `cli.py`, `qa.py`,
  `artifacts.py`, `icons.py`, `source_set_protocol.py`, and new EPIC-12 modules should follow the
  EPIC-10/11 staged profile pattern.
- `scripts/data/build_wars_ingest/rune_source_set.py`, `insignia_source_set.py`,
  `rune_extractor.py`, `insignia_extractor.py`, `rune_semantics.py`, `insignia_semantics.py`,
  `rune_catalog.py`, and `insignia_catalog.py` are the closest concrete ingestion analogs.
- `scripts/data/build_wars_ingest/template_ids.py` parses template ID source material for
  profession/attribute IDs and is relevant precedent for equipment-template row handling.
- `scripts/data/build_wars_ingest/tests/**` should add profile, source-set, extractor, semantics,
  catalog, QA, determinism, offline replay, CLI, and regression tests for EPIC-12.
- `test/fixtures/data-ingestion/` should add minimized synthetic EPIC-12 fixture pages, icon
  metadata, malformed cases, compatibility cases, and a generated golden fixture catalog.
- Expected promoted paths are `data/generated/epic-12/weapons.catalog.json`,
  `data/generated/epic-12/weapons.catalog.manifest.json`,
  `data/generated/epic-12/weapon-mods.catalog.json`,
  `data/generated/epic-12/weapon-mods.catalog.manifest.json`,
  `data/qa/epic-12/weapons.catalog.qa.json`, and
  `data/qa/epic-12/weapon-mods.catalog.qa.json`, unless Phase 1 records an amendment to a single
  combined catalog.
- `.gitignore`, `README.md`, `scripts/data/README.md`, `data/**/README.md`,
  `compendium/data-ingestion-platform.md`, a new `compendium/weapons-and-mods-catalog.md`, and
  `compendium/README.md` need closeout updates during implementation.
- `work/tickets/12-weapons-and-mods/*.md`, `work/sprints/ledger.tsv`, and the ticket-burn manifest
  must stay path/status consistent.

## Constraints

- Follow `AGENTS.md`: keep human-facing communication concise and direct.
- This planning run must not modify application implementation code, generated data, fixtures, or
  data scripts. It may write only planning and ticket traceability artifacts.
- Runtime app code may import promoted generated catalog JSON only through `src/app/catalogs.ts`.
  This sprint should not wire weapon/mod data into the current editor UI.
- `src/domain` must remain framework-neutral and must not import React, DOM/browser APIs, browser
  storage, network clients, app modules, generated manifests, QA reports, source snapshots, or data
  scripts.
- The EPIC-12 catalog must be built through the existing EPIC-02 ingestion/profile/fixture/offline
  replay pattern, not a one-off weapon scraper or arbitrary crawler.
- Runtime catalog data should contain structured factual records and compact provenance references,
  while source plans, snapshot-set manifests, raw snapshots, manifests, QA bodies, review evidence,
  media bytes, and raw page bodies stay outside runtime imports.
- Copied source-authored description prose is not required for the first runtime catalog. Prefer
  structured effects plus reviewed short display text, stable note codes, and explicit unknown
  states.
- Weapon base-type records and upgrade/modifier records must remain separate even if they are
  promoted together. Weapon records own family, handedness, damage, requirement, allowed mod slots,
  and item ID crosswalks. Upgrade records own modifier family, applicability, effect facts, and
  modifier ID crosswalks.
- Unknown or unsupported raw equipment-template item/modifier IDs must remain visible and
  preservable for exact-source replay and later EPIC-14/17 handling.
- Prioritize practical PvP equipment-template coverage and editor resolution before broader PvE
  skins, unique-item exhaustiveness, drop/vendor/collector/acquisition data, campaign-unlock prose,
  guide recommendations, or economic data.
- Deterministic compatibility and requirement facts are in scope. Chance-based, conditional,
  mastery, HCT/HSR, enchantment, stance, or hard-to-verify modifier behavior should start as typed
  structured notes or conservative effects unless source evidence supports exact semantics.
- Final implementation verification should use `npm run verify`, with focused TypeScript and Python
  commands listed at phase gates. Live source refresh remains manual-only and outside default
  verification.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-1201 through BW-1207 in dependency order with file-level tasks, phase gates, and verification.
- A framework-neutral runtime contract for weapon base records, weapon upgrade/modifier records,
  source-set summaries, compact dispositions, EPIC-03 dependency summaries, template item/modifier
  crosswalks, metadata-only media references, semantic digests, and QA boundaries.
- An EPIC-12 ingestion profile with fixture mode, staged live discovery/fetch, source-plan digest
  confirmation, selected offline replay, bounded source/candidate output, and exact generated/QA
  paths.
- Source-set planning that accounts for PvP template weapon bases, player-usable weapon families,
  bow variants, martial and caster weapons, shields/focuses, prefixes, suffixes, inscriptions, staff
  heads, staff wrappings, shield/offhand modifiers, icon metadata, unsupported rows, and malformed
  source shapes.
- Extractors and semantic normalization for weapon family, handedness, damage range/type,
  requirement attributes, base item ID crosswalks, modifier families, applicable weapon families,
  compatibility rules, structured effects, note-only effects, unknown effects, and source-policy
  reviewed display text.
- Deterministic lookup or compatibility fixtures proving known item/modifier IDs resolve, unknown
  IDs are preserved, incompatible base/mod combinations are explainable, and raw template
  exact-source behavior remains unchanged.
- Catalog assembly, section digests, semantic catalog versioning, bounded QA, repeated fixed-clock
  fixture/offline determinism, first-baseline review, exact-path promotion, and `.gitignore`
  allowlisting only for approved EPIC-12 artifacts.
- Closeout docs and ticket records that explain runtime import boundaries and downstream handoffs to
  EPIC-13, EPIC-14, EPIC-17, EPIC-20, and EPIC-21.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-12 grooming decisions, BW-1201
  through BW-1207 acceptance criteria, source-policy gates, and established EPIC-03/04/10/11 catalog
  patterns.
- Spec/documentation: `work/tickets/12-weapons-and-mods/EPIC.md`,
  `work/tickets/12-weapons-and-mods/BW-120*.md`, `compendium/source-policy.md`,
  `compendium/data-ingestion-platform.md`, `compendium/template-compatibility.md`,
  `compendium/runes-catalog.md`, `compendium/insignias-catalog.md`, existing domain catalog tests,
  and raw equipment-template compatibility tests.
- Edge cases identified:
  - one-handed, two-handed, offhand, bow-variant, caster, shield, and focus base types
  - requirement attributes joined through EPIC-03, missing requirements, and unresolved attributes
  - damage ranges, damage types, handedness, offhand-only conflicts, and weapon-family aliases
  - prefix, suffix, inscription, staff-head, staff-wrapping, shield/offhand, and caster-specific
    modifier families
  - modifier compatibility conflicts, duplicate modifier slots, mutually exclusive mods, missing
    icons, malformed source rows, redirects, duplicate names, unsupported source fields, and copied
    prose risk
  - chance-based HCT/HSR or mastery behavior that must not become guessed arithmetic
  - raw equipment template item/modifier IDs that are known, dispositioned, unsupported, ambiguous,
    or unknown
  - fixed-clock deterministic fixture generation and complete offline replay
  - exact-path allowlisting without leaking source plans, raw snapshots, QA summaries, review
    evidence, or media bytes
- Testing approach:
  - focused TypeScript contract tests for weapon/base/mod catalog records, crosswalks, lookups,
    compatibility outcomes, and unresolved-ID preservation
  - focused Python tests for EPIC-12 profile registration, source-set planning, source page
    resolution, extractors, semantic normalization, QA findings, artifact generation, determinism,
    selected offline replay, and CLI behavior
  - fixture regeneration byte comparisons under fixed clock
  - selected offline replay from a complete reviewed snapshot set
  - raw equipment-template compatibility regression tests
  - `git check-ignore -v` checks for promoted paths and representative ignored byproducts
  - final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium-High - weapon and modifier data is broader than runes/insignias,
  and source facts for compatibility, HCT/HSR, requirements, and template IDs may be inconsistent or
  incomplete.
- Scope uncertainty: Medium - tickets are groomed and dependency ordered, but execution must avoid
  drifting into equipment editor UI, armor shells, named unique-item exhaustiveness, acquisition
  guides, economic data, complete stat aggregation, and combat simulation.
- Architecture uncertainty: Low-Medium - the work extends proven EPIC-02/03/04/10/11 catalog and
  source-policy architecture. No new external integration or runtime architecture blocks planning,
  but Phase 1 must be allowed to amend exact source authority or artifact split if source shape
  proves different.

## Open Questions

Questions for the draft lanes to answer without blocking planning:

1. Should EPIC-12 promote separate `weapons.catalog.json` and `weapon-mods.catalog.json` artifacts,
   or one combined artifact with separate sections? Default to separate artifacts because the epic
   separates base types from upgrades, but record an amendment if source/QA evidence supports a
   single runtime catalog.
2. Which finite source authority gives practical PvP template weapon and modifier coverage with the
   smallest reviewable graph?
3. What is the minimum v1 wire shape for base weapon families, handedness, damage facts,
   requirements, mod-slot compatibility, and item ID crosswalks without committing to named skin
   exhaustiveness?
4. What is the minimum v1 wire shape for prefixes, suffixes, inscriptions, staff heads, staff
   wrappings, shield/offhand modifiers, HCT/HSR facts, chance-based notes, and modifier ID
   crosswalks?
5. Which compatibility checks belong as pure domain/catalog helpers now, and which must remain
   deferred to EPIC-14/17/21?
6. Which QA findings should be non-waivable before production promotion versus warning-level
   accepted risk?
