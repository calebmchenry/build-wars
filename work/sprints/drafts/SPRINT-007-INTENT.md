# Sprint 007 Intent: Game Rule Engine

## Seed

Create a sprint from `work/tickets/06-game-rule-engine/EPIC.md` for the ticket-burn BACKLOG run.

Automation contract:

- Mode: ticket-burn
- Source target: BACKLOG
- Source epic: EPIC-06
- Sprint directory: `work/sprints`
- Draft artifacts directory: `work/sprints/drafts`
- Source epic path: `work/tickets/06-game-rule-engine/EPIC.md`
- Non-interactive planning; skip routine interview unless a high-risk architecture choice appears
- Do not modify application implementation code and do not commit

The final sprint must be executable, update planning records, and write
`work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-06-result.json`.

## Context

- Build Wars is a local-first React/Vite and TypeScript app with framework-neutral domain contracts
  in `src/domain`, source/data tooling in `scripts/data`, generated runtime catalogs under
  `data/generated`, and ticket-burn planning records under `work/tickets` and `work/sprints`.
- SPRINT-001 through SPRINT-006 are completed in `work/sprints/ledger.tsv`. The next sprint ID is
  `SPRINT-007`.
- EPIC-03 promoted a runtime-eligible professions/attributes catalog with profession, attribute,
  template crosswalk, primary-only, and attribute point budget facts. EPIC-04 promoted a runtime
  skills catalog with skill classification, costs, progression, split, mode, and disposition facts.
- EPIC-05 added loss-aware template import/export and pure catalog resolution. Unknown and
  dispositioned imported template IDs remain preserved rather than coerced into `Build`.
- EPIC-06 is a domain service sprint. It should add pure validation/calculation APIs that consume
  `Build`, caller-supplied catalog slices, and optional rule configuration, then return deterministic
  validation issues instead of throwing for normal invalid authored builds.

## Recent Sprint Context

- `SPRINT-004` completed EPIC-03 and documented default level-20 PvE attribute assumptions:
  170 base points plus up to 30 maximum applicable quest points.
- `SPRINT-005` completed EPIC-04 and made `data/generated/epic-04/skills.catalog.json` the only
  runtime-eligible skills artifact. Runtime code must not import generated manifests, QA reports,
  source plans, snapshots, Python ingestion modules, or wiki APIs.
- `SPRINT-006` completed EPIC-05. `src/template-compatibility` decodes raw template data and exposes
  pure catalog resolution helpers; EPIC-06 owns game legality and must not treat template decoding as
  validation.

## Relevant Codebase Areas

- `src/domain/build.ts` owns `Build`, `GameMode`, `SkillBar`, `AttributeAllocation`, and the
  eight-slot skill bar contract.
- `src/domain/catalog.ts` owns `ProfessionAttributeCatalog`, `SkillCatalog`, catalog records,
  classification flags, source-set dispositions, split groups, progression series, and attribute
  point rules.
- `src/domain/catalog-lookup.ts` owns pure lookup helpers such as `lookupSkillById`,
  `lookupSkillTemplateId`, `resolveSkillModeVariant`, `attributeBudgetForLevel`, and
  `purchasedRankCost`.
- `src/domain/template.ts` and `src/template-compatibility` own loss-aware template documents and
  resolution views, but rule validation should stay in `src/domain` and not import the compatibility
  adapter.
- Existing tests live under `test/domain`, `test/template-compatibility`, and
  `test/fixtures/data-ingestion/generated`. EPIC-06 should add focused domain fixtures/tests that do
  not require live network access or source snapshots.
- `eslint.config.js`, `tsconfig.domain.json`, and `tsconfig.template-compatibility.json` enforce
  framework-neutral boundaries and strict TypeScript.

## Constraints

- Follow `AGENTS.md`: concise, direct communication.
- Keep implementation in `src/domain`; no React, DOM/browser APIs, storage, network clients, data
  scripts, generated audit artifacts, source snapshots, or template codec dependency imports.
- Runtime-facing validation may consume the generated catalog JSON shape only through caller-supplied
  objects and domain contracts.
- Normal invalid, incomplete, or unresolved user-authored builds must produce structured issues, not
  thrown exceptions.
- Unknown imported IDs remain round-trippable where possible. The engine should report unresolved
  references without destructive coercion.
- Equipment, title-track, allegiance, rune, insignia, armor, weapon, modifier, hero, party, and UI
  validation must have extension points but should not be fully implemented before their content/UI
  epics.
- `npm run verify` is the canonical repository validation command.

## Success Criteria

- `SPRINT-007` covers BW-0601 through BW-0607 in dependency order and can be implemented without
  another planning decision.
- The sprint defines a stable `ValidationIssue`/`ValidationResult` contract with deterministic
  severity, code, path, slot, related entity, and source-rule fields.
- The sprint defines a reusable validation context over `Build`, `ProfessionAttributeCatalog`, and
  `SkillCatalog`, including unresolved reference handling.
- MVP rules cover profession pairs, primary-only/wrong-profession attributes, attribute point
  spending, skill bar shape, elite count, duplicate skills, PvE/PvP mode restrictions, skill
  profession/attribute eligibility, and effective attribute rank calculation.
- Fixture tests cover valid builds, partial builds, invalid profession state, duplicate attributes,
  overspend, wrong-profession skills, duplicate elites, too many PvE-only skills, mode restrictions,
  unresolved IDs, and effective rank cases.
- Planning records and manifest are written without touching application implementation code.

## Verification Strategy

- Reference implementation: no external rule engine is present; correctness is defined by EPIC-03
  attribute point contracts, EPIC-04 skill classification contracts, and the EPIC-06 tickets.
- Spec/documentation: `work/tickets/06-game-rule-engine/EPIC.md`, BW-0601 through BW-0607,
  `compendium/professions-and-attributes.md`, `compendium/skills-catalog.md`, and
  `compendium/template-compatibility.md`.
- Edge cases identified: null professions, identical primary/secondary professions, duplicate
  attributes, primary-only attributes on secondary or absent primary, unknown catalog IDs, null skill
  slots, non-eight slot runtime input, duplicate skill IDs, duplicate elite skills, PvE-only limits,
  PvP-only/PvE-only mode mismatches, split skills with unknown mode, unsupported/dispositioned skill
  states, title-rank deferred dependencies, and unresolved effective ranks.
- Testing approach: add domain unit tests and small fixtures under `test/domain` and
  `test/fixtures/rule-engine`; run focused Vitest tests, `npm run typecheck`, and `npm run verify`.

## Uncertainty Assessment

- Correctness uncertainty: Medium - MVP rules are well bounded by existing catalogs, but exact Guild
  Wars edge cases around duplicate skills, PvE-only/title/allegiance, and partial editor states need
  conservative severity/default policies.
- Scope uncertainty: Low - EPIC-06 is already split into seven BW tickets with clear dependencies.
- Architecture uncertainty: Low - the engine naturally extends existing pure domain contracts and
  lookup helpers, with later equipment/title rules represented as extension points.

## Open Questions

1. Should incomplete editor states be warnings by default and hard errors only when impossible or
   export-blocking?
2. Should EPIC-06 model PvE-only/title/allegiance gaps as deferred warnings until EPIC-15, while
   still enforcing catalog-proven PvE/PvP mode restrictions?
3. How should duplicate non-elite skills be classified when catalog metadata cannot prove whether a
   duplicate is legal or impossible?
4. What is the minimal extension-point shape for later equipment/title rules that avoids committing
   to EPIC-10 through EPIC-15 schemas too early?
