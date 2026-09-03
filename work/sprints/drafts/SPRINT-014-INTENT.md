# Sprint 014 Intent: Equipment Shell Model

## Seed

Create a ticket-burn sprint from `work/tickets/13-armor-and-equipment/EPIC.md` for
`EPIC-13 Equipment Shell Model`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-13`
- source_epic_path: `work/tickets/13-armor-and-equipment/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-014.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-13` and BW-1301 through BW-1305,
ledger sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-13-result.json`.

## Context

- `SPRINT-001` through `SPRINT-013` are completed in `work/sprints/ledger.tsv`; `SPRINT-014` is the
  next sprint ID.
- `EPIC-13` is `ready`, depends on completed source policy, ingestion platform,
  professions/attributes, game-rule engine, runes, insignias, and weapons/mods work, and has five
  ready tickets: BW-1301 through BW-1305.
- The current app has a durable single-character `Build` model with `equipment: EquipmentTemplate |
  null`, but `src/domain/equipment.ts` is still a thin placeholder around armor pieces and weapon
  sets.
- EPIC-10/11/12 already provide runtime catalog IDs and pure helper precedents:
  `RuneId`, `InsigniaId`, `WeaponId`, `WeaponModifierId`, `summarizeAttributeRuneEffects`,
  `resolveInsigniaEffectsForArmorSlot`, `explainWeaponModCompatibility`, and catalog lookup
  helpers.
- Planning may update sprint, draft, ticket, ledger, run-state, and result-manifest records only. It
  must not modify implementation code or create a commit.

## Recent Sprint Context

- `SPRINT-007` established `validateBuild`, `createBuildValidationContext`, shared
  `ValidationIssue`/`ValidationResult` semantics, and `calculateEffectiveAttributeRank`.
- `SPRINT-009` shipped the single-character skill/attribute editor and app catalog boundary, with
  generated data imported only through `src/app/catalogs.ts`.
- `SPRINT-010` shipped local library persistence and share URLs, explicitly preserving the domain
  `Build` projection and raw skill-template overlay while excluding equipment payloads from share
  URLs.
- `SPRINT-011` and `SPRINT-012` promoted rune and insignia catalogs plus narrow pure domain helpers
  for attribute-rune summaries and per-slot insignia projections.
- `SPRINT-013` promoted weapon base and weapon modifier catalogs, raw template item/modifier
  lookup helpers, and one-base/one-modifier compatibility explanation. Full weapon-set legality was
  intentionally deferred to EPIC-13/14.

## Relevant Codebase Areas

- `src/domain/equipment.ts` is the main target. It should become the semantic authored equipment
  shell for a single-character build, replacing or extending the current placeholder without
  importing React, DOM, generated JSON, manifests, QA reports, snapshots, wiki APIs, or app modules.
- `src/domain/build.ts` already points `Build.equipment` at the current equipment type. Changes
  should preserve existing skill editor and persistence compatibility through nullable/default
  equipment handling.
- `src/domain/ids.ts` already defines `ArmorPieceId`, `RuneId`, `InsigniaId`, `WeaponId`, and
  `WeaponModifierId`. The semantic shell should use catalog IDs and explicit unresolved states
  rather than raw template IDs, skin IDs, dye IDs, or color IDs.
- `src/domain/catalog.ts` contains `CatalogRuneRecord`, `CatalogInsigniaRecord`,
  `CatalogWeaponBaseRecord`, `CatalogWeaponModRecord`, and catalog envelope types available to
  caller-supplied validation views.
- `src/domain/catalog-lookup.ts` already resolves rune, insignia, weapon, and modifier records by
  ID/name/template crosswalk. EPIC-13 should use or mirror those pure lookup styles without adding
  runtime generated-data imports.
- `src/domain/effective-attribute-rank.ts` accepts caller-supplied additive adjustments. EPIC-13
  should make headgear and rune attribute adjustments consumable by that API or document a precise
  handoff if it remains caller-owned.
- `src/domain/validation.ts`, `src/domain/validation-context.ts`, and `src/domain/rule-engine.ts`
  define validation issue ordering, versioning, severity, completeness, resolution, and truncation.
  Equipment validation should extend this contract, not create incompatible result shapes.
- `test/domain/*equipment*` does not exist yet. Focused tests should cover shell constructors,
  empty/partial loadouts, armor slot invariants, headgear, weapon occupancy, unresolved selections,
  and validation issue emission.
- `test/fixtures/rule-engine/` and `test/fixtures/rule-engine/README.md` are likely homes for
  reusable synthetic build/equipment fixtures and validation fixture documentation.
- `compendium/game-rule-engine.md`, `compendium/template-compatibility.md`,
  `compendium/weapons-and-mods-catalog.md`, `compendium/runes-catalog.md`,
  `compendium/insignias-catalog.md`, `compendium/core-build-editor.md`, `README.md`, and
  `compendium/README.md` need closeout updates during implementation.
- `work/tickets/13-armor-and-equipment/*.md`, `work/sprints/ledger.tsv`, and the ticket-burn
  manifest must stay path/status consistent.

## Constraints

- Follow `AGENTS.md`: keep human-facing communication concise and direct.
- This planning run must not modify application implementation code, generated data, fixtures, or
  scripts. It may write only planning and ticket traceability artifacts.
- `src/domain` must remain framework-neutral and must not import React, DOM/browser APIs, browser
  storage, network clients, app modules, generated catalog JSON, manifests, QA reports, source
  snapshots, data scripts, or wiki APIs.
- Runtime app code may import promoted generated catalog JSON only through `src/app/catalogs.ts`.
  This sprint may define domain contracts and tests, but it should not build the equipment editor
  UI or wire equipment catalogs into leaf components.
- EPIC-13 owns the semantic equipment loadout container, armor slot rules, headgear mechanics,
  weapon-set occupancy, and build-validation handoffs. EPIC-10/11/12 still own rune, insignia,
  weapon, and modifier catalog facts.
- Armor skins, weapon skins, inventory item identity, dye/color IDs, acquisition facts, screenshots,
  item economic data, party equipment, raw equipment-template-code import/export, paw-ned2/team
  templates, combat simulation, DPS, complete health/energy/armor totals, and guide authoring are
  out of scope.
- Unknown semantic equipment states must be recoverable and visibly unresolved. Preserving every
  unknown raw template field remains an EPIC-05/17 template-compatibility responsibility.
- Fixed mechanical facts for armor slots, slot ordering, weapon-set count, hand occupancy, and
  headgear adjustment shape may live in domain code with closeout provenance notes. New
  source-derived armor/headgear catalogs require EPIC-01 source-policy treatment and are not
  expected for this sprint.
- Existing build, skill editor, local library, template import/export, and share-url behavior must
  remain compatible. Existing records with `equipment: null` must continue to validate and render.
- Final implementation verification should use focused TypeScript/Vitest checks at phase gates and
  `npm run verify` for closeout.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-1301 through BW-1305 in dependency order with file-level tasks, phase gates, and verification.
- A framework-neutral semantic equipment loadout contract for one single-character build, including
  five armor slots, four weapon sets, empty/default loadouts, partial loadouts, known catalog ID
  attachments, and typed unresolved placeholders.
- Armor semantics for rune and insignia attachment points, headgear attribute bonuses, minimal base
  armor facts, canonical slot ordering, duplicate/missing slot handling, and catalog-restriction
  validation via caller-supplied rune/insignia/profession views.
- Weapon-set semantics for main-hand/off-hand/two-handed/empty occupancy, catalog-ID attachments,
  modifier attachment points, unresolved selections, requirement handoff facts, and structural
  compatibility with the EPIC-12 helper.
- Integration with the existing validation issue/result contract so EPIC-14 can display equipment
  problems without inventing new issue categories or breaking unrelated skill editing.
- Focused fixtures and tests for empty equipment, partial armor, duplicate armor slots, missing
  armor slots, invalid rune/insignia restrictions, headgear adjustments, two-handed/off-hand
  conflicts, incompatible modifiers, missing requirements, unresolved catalog IDs, and existing
  `equipment: null` builds.
- Closeout docs and ticket records that make the semantic boundary explicit and hand off equipment
  editing to EPIC-14, semantic template workflows to EPIC-17, search/tooltips to EPIC-20, and full
  stat/effect aggregation to EPIC-21.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-13 grooming decisions, BW-1301
  through BW-1305 acceptance criteria, established `Build`/rule-engine contracts, and EPIC-10/11/12
  catalog helper boundaries.
- Spec/documentation: `work/tickets/13-armor-and-equipment/EPIC.md`,
  `work/tickets/13-armor-and-equipment/BW-130*.md`, `compendium/game-rule-engine.md`,
  `compendium/template-compatibility.md`, `compendium/runes-catalog.md`,
  `compendium/insignias-catalog.md`, `compendium/weapons-and-mods-catalog.md`, and current domain
  validation tests.
- Edge cases identified:
  - existing builds with `equipment: null`
  - fully empty default equipment loadouts
  - partial armor and weapon-set edits during UI workflows
  - duplicate armor slots, missing armor slots, malformed slot names, and non-canonical ordering
  - rune ID known/missing/unresolved, profession-restricted rune mismatches, duplicate attribute
    rune stacking handoff, and headgear interaction
  - insignia ID known/missing/unresolved, inapplicable armor slots, profession restrictions, and
    note-only or unknown insignia effects
  - headgear attribute bonus known/missing/unresolved, duplicate with rune adjustment, and
    unallocated target attribute behavior
  - one-handed main-hand plus off-hand, two-handed weapon with off-hand, empty hands, partial sets,
    duplicate or unsupported modifier slots, and unknown weapon/modifier IDs
  - requirement facts that are catalog-resolved, unresolved, not applicable, or not yet enforceable
  - validation max-issue caps and deterministic issue ordering when equipment adds many issues
  - persistence/import compatibility for old records that lack equipment state
- Testing approach:
  - focused TypeScript contract tests for equipment shell data shapes, constructors, canonical slot
    constants, and default/empty loadouts
  - focused Vitest coverage for armor slot/headgear mechanics and weapon-set occupancy helpers
  - rule-engine or validation-context tests for caller-supplied equipment catalog views and
    structured issue emission
  - regression tests for existing `validateBuild`, local-library persistence, and skill-template
    workflows with `equipment: null`
  - docs/source scans proving `src/domain` has no forbidden runtime imports
  - final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium - the equipment domain is well-bounded, but details around
  headgear-plus-rune stacking, profession armor restrictions, modifier slot cardinality, and
  requirement handoffs need conservative modeling and tests.
- Scope uncertainty: Low-Medium - tickets are groomed and dependency ordered; the main risk is
  drifting into EPIC-14 UI, EPIC-17 template import semantics, or EPIC-21 full stat aggregation.
- Architecture uncertainty: Low-Medium - the work extends existing domain, catalog, and validation
  patterns. No high-risk new integration blocks planning, but execution must choose precise shapes
  for equipment validation catalog views and issue codes.

## Open Questions

Questions for the draft lanes to answer without blocking planning:

1. Should the public authored type keep the name `EquipmentTemplate`, or should EPIC-13 introduce
   `EquipmentLoadout` and retain `EquipmentTemplate` only as a compatibility alias?
2. What exact unresolved-state shape is most useful for semantic equipment without leaking raw
   template fields or cosmetic IDs?
3. Which equipment facts should be immutable constructors/constants versus caller-authored fields?
4. Should equipment validation be integrated directly into `validateBuild`, or exposed as a pure
   helper that `validateBuild` delegates to when catalog views are supplied?
5. What minimum caller-supplied catalog view is needed for EPIC-13 validation without forcing
   runtime app imports of rune, insignia, weapon, or modifier generated JSON?
6. Which headgear and rune rank adjustments can safely feed `calculateEffectiveAttributeRank` in
   this sprint, and which aggregation remains caller-owned or deferred?
7. Which validation cases are errors, warnings, incomplete states, or unresolved states under the
   existing `ValidationResult` semantics?
