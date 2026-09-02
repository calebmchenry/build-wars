# Sprint 011 Intent: Runes Catalog

## Seed

Create a ticket-burn sprint from `work/tickets/10-runes/EPIC.md` for `EPIC-10 Runes`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-10`
- source_epic_path: `work/tickets/10-runes/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-011.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-10` and BW-1001 through BW-1006, ledger
sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-10-result.json`.

## Context

- `SPRINT-001` through `SPRINT-010` are completed in `work/sprints/ledger.tsv`; `SPRINT-011` is the
  next sprint ID.
- `EPIC-10` is `ready`, depends on completed source policy, ingestion platform, and
  professions/attributes work, and already has six ready tickets: BW-1001 through BW-1006.
- The current app has a shipped single-character skill and attribute editor plus local library and
  sharing. Rune work is content/catalog groundwork for later equipment editing, not a UI sprint.
- `RuneId` already exists in `src/domain/ids.ts`, and `ArmorPiece` already has a nullable
  `runeId`, but `src/domain/catalog.ts` currently exposes only a minimal `Rune` interface and no
  runtime rune catalog, effect, stacking, or QA contract.
- The sprint must plan documentation and traceability updates but must not change implementation
  code during planning.

## Recent Sprint Context

- `SPRINT-003` established the MediaWiki ingestion spine: bounded live access, raw snapshot storage,
  canonical artifact writing, metadata-only icon resolution, QA reports, and fixture mode.
- `SPRINT-004` promoted the EPIC-03 professions/attributes catalog and template crosswalks. EPIC-10
  must use those records for profession and affected-attribute joins.
- `SPRINT-005` promoted the EPIC-04 skills catalog and is the closest precedent for source-set
  planning, selected offline replay, section digests, semantic catalog versions, QA gates, and
  exact-path allowlisting.
- `SPRINT-007` added validation result semantics and an effective attribute-rank helper. EPIC-10
  can define rune stacking fixtures and pure helpers, but full equipment validation remains later
  scope.
- `SPRINT-010` shipped local library and sharing, so runtime docs should continue to state that
  equipment, runes, insignias, and weapon state are deferred from the current saved-build schema.

## Relevant Codebase Areas

- `src/domain/ids.ts` already defines `RuneId` and should remain the branded ID source.
- `src/domain/catalog.ts` should gain the framework-neutral rune catalog contract, source-set
  summaries, records, effect variants, stacking semantics, dependency summaries, and any pure helper
  types needed by tests and downstream equipment work.
- `src/domain/catalog-lookup.ts` may need pure rune lookup or effect summary helpers if tests or
  later UI need stable behavior beyond raw arrays.
- `src/domain/effective-attribute-rank.ts` and `src/domain/rules/**` are relevant for handoff tests,
  but EPIC-10 should avoid building a full armor/stat calculator.
- `src/domain/equipment.ts` already models `ArmorPiece.runeId`; it may need only narrow contract
  alignment, not UI behavior.
- `scripts/data/build_wars_ingest/profiles.py`, `pipeline.py`, `cli.py`, `models.py`, `qa.py`,
  `artifacts.py`, `icons.py`, and new rune-specific modules should follow the EPIC-03/04 profile
  pattern.
- `scripts/data/build_wars_ingest/tests/**` should cover profile registration, source resolution,
  extractors, semantic normalization, QA, determinism, and CLI behavior for EPIC-10.
- `test/fixtures/data-ingestion/` should add minimized synthetic rune fixtures and generated golden
  fixture JSON.
- `data/generated/epic-10/runes.catalog.json`,
  `data/generated/epic-10/runes.catalog.manifest.json`, and
  `data/qa/epic-10/runes.catalog.qa.json` are the expected exact promoted paths.
- `.gitignore`, `README.md`, `scripts/data/README.md`, `data/**/README.md`,
  `compendium/data-ingestion-platform.md`, a new `compendium/runes-catalog.md`, and
  `compendium/README.md` need closeout updates.
- `work/tickets/10-runes/*.md`, `work/sprints/ledger.tsv`, and the ticket-burn manifest must stay
  path/status consistent.

## Constraints

- Follow project instructions in `AGENTS.md`: keep human-facing updates concise and direct.
- Planning may modify sprint, draft, ticket, ledger, run-state, and manifest files only; it must not
  modify application implementation code or create a commit.
- Runtime app code may import promoted generated catalog JSON only through `src/app/catalogs.ts`;
  this sprint should not wire rune data into the app UI unless the final plan explicitly marks that
  as a downstream handoff rather than an implementation task.
- `src/domain` must remain framework-neutral and must not import React, DOM/browser APIs, browser
  storage, network clients, app modules, generated manifests, QA reports, source snapshots, or data
  scripts.
- The EPIC-10 catalog must be built through the existing EPIC-02 ingestion/profile/fixture/offline
  replay pattern, not a one-off rune scraper.
- Runtime catalog data should contain structured factual records and compact provenance references,
  while snapshots, source plans, manifests, QA bodies, review evidence, media bytes, and raw page
  bodies stay outside runtime imports.
- Copied source-authored description prose is not required for the first runtime catalog; prefer
  structured effects plus reviewed short display text or explicit note states.
- Attribute-rune semantics must preserve two independent facts: the highest applicable attribute
  bonus applies per affected attribute, while verified health penalties from equipped runes remain
  countable.
- Non-attribute rune families such as Vigor, Vitae, Attunement, and Restoration should be modeled as
  explicit effect families with verified stackability only; ambiguous behavior stays visible through
  typed notes and QA.
- Headgear interaction facts may be recorded, but EPIC-13 owns armor shell/headgear cataloging and
  EPIC-14 owns equipment editor UI.
- Final implementation verification should use `npm run verify`, with focused TypeScript and Python
  commands listed at phase gates.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-1001 through BW-1006 in dependency order with file-level tasks, phase gates, and verification.
- A framework-neutral `RuneCatalog` contract with stable IDs, names, normalized lookup keys, rune
  family/rank, profession and affected-attribute restrictions, icon metadata references, source
  references, and structured effects.
- An EPIC-10 ingestion profile with fixture, live source discovery, digest-confirmed fetch where
  needed, selected offline replay, and bounded source/candidate output.
- Rune source-set planning that accounts for profession attribute rune variants, common/non-attribute
  rune families, redirects, duplicate names, missing icons, malformed source shapes, and unsupported
  or ambiguous records.
- Extractors and semantic normalization for attribute bonuses, health penalties, health bonuses,
  energy bonuses, stackability facts, headgear handoff facts, and note-only effects.
- Domain fixtures or pure helpers proving the highest-attribute-bonus rule does not erase duplicate
  health penalties.
- Deterministic catalog assembly, section digests, semantic catalog versioning, QA gates, exact-path
  promotion, and `.gitignore` allowlisting for only approved EPIC-10 files.
- Closeout docs and ticket records that explain runtime import boundaries and downstream handoffs to
  EPIC-13, EPIC-14, EPIC-15, EPIC-20, and EPIC-21.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-10 grooming decisions, BW-1001
  through BW-1006 acceptance criteria, source-policy gates, and the established EPIC-03/04 catalog
  patterns.
- Spec/documentation: `work/tickets/10-runes/EPIC.md`,
  `work/tickets/10-runes/BW-100*.md`, `compendium/source-policy.md`,
  `compendium/data-ingestion-platform.md`, `compendium/professions-and-attributes.md`,
  `compendium/skills-catalog.md`, and existing domain catalog tests.
- Edge cases identified:
  - minor/major/superior rank families for the same profession attribute
  - duplicate attribute runes on separate armor pieces
  - highest attribute bonus applying while every verified health penalty remains independently
    countable
  - multiple rune families affecting health or energy with different stackability rules
  - profession-restricted runes, common runes, and affected-attribute joins through EPIC-03
  - headgear attribute facts without implementing armor-piece selection or equipment UI
  - redirects, shared pages, duplicate source names, missing icons, unsupported source fields, and
    malformed effect text
  - source-authored prose exclusion and reviewed short display text policy
  - fixed-clock deterministic fixture generation and complete offline replay
  - exact-path allowlisting without leaking source plans, raw snapshots, QA summaries, or media bytes
- Testing approach:
  - focused TypeScript contract tests for `RuneCatalog`, effect variants, lookup helpers, and
    stacking/effective-rune fixtures
  - focused Python tests for profile registration, source-set planning, page resolution, extraction,
    semantic normalization, QA findings, artifact generation, determinism, and CLI behavior
  - fixture regeneration byte comparisons under fixed clock
  - selected offline replay from a complete reviewed snapshot set
  - `git check-ignore -v` checks for promoted paths and representative ignored byproducts
  - final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium-High - rune mechanics are bounded, but source shapes and stacking
  details are easy to get subtly wrong and must be backed by fixtures and QA.
- Scope uncertainty: Medium - the tickets are groomed and bounded, but the implementation must avoid
  drifting into armor editor UI, full stat calculation, acquisition prose, title handling, and
  equipment-template semantics.
- Architecture uncertainty: Low-Medium - the work extends existing EPIC-03/04 catalog architecture
  and source-policy gates. No new high-risk architecture choice blocks planning.

## Open Questions

1. Which source-set authority gives complete player-usable rune coverage with the smallest reviewable
   graph: a rune index page, rune category pages, explicit profession/family pages, or a bounded
   hybrid?
2. What exact TypeScript wire shape best distinguishes attribute bonuses, health penalties, health
   bonuses, energy bonuses, stackability, and note-only/unknown effects without building a complete
   stat calculator?
3. Which non-attribute rune families have verified stacking or non-stacking semantics in the source
   data, and which must remain note-only for EPIC-21?
4. What headgear interaction facts should be recorded now so EPIC-13/14 can consume them later
   without EPIC-10 owning armor shell records?
5. Which QA findings should be non-waivable before promotion versus warning-level accepted risk?

## Non-Interactive Interview Decision

Interview is skipped under the ticket-burn contract. No high-risk architecture choice blocks
planning because EPIC-10 extends the existing source-policy and catalog-ingestion pattern rather
than introducing a new app architecture or external integration.
