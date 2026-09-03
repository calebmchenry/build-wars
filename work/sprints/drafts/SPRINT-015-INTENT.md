# Sprint 015 Intent: Equipment Editor

## Seed

Create a ticket-burn sprint from `work/tickets/14-equipment-editor/EPIC.md` for
`EPIC-14 Equipment Editor`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-14`
- source_epic_path: `work/tickets/14-equipment-editor/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-015.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-14` and BW-1401 through BW-1408,
ledger sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-14-result.json`.

## Context

- `SPRINT-001` through `SPRINT-014` are completed in `work/sprints/ledger.tsv`; `SPRINT-015` is the
  next sprint ID.
- `EPIC-14` is `ready`, depends on completed foundation, source policy, visual prior art, core
  editor, local library, rune/insignia/weapon catalogs, and `SPRINT-014` equipment shell work.
- EPIC-13 now provides `EquipmentLoadout`, fixed armor and weapon-set topology, known/unresolved
  equipment selections, attribute-rank adjustment helpers, weapon-set analysis, and equipment
  validation through optional caller-supplied catalog views.
- The current React app remains skill/attribute first. `src/app/catalogs.ts` imports only promoted
  profession/attribute and skill catalogs, `src/app/App.tsx` lays out library/profession/attributes,
  template/share/validation panels, and the main skill bar/browser.
- `src/app/persistence-schema.ts` deliberately rejects persisted non-null equipment with
  `unsupported-equipment`; EPIC-14 must replace that deferral with bounded semantic equipment
  persistence while preserving old records and skill-template share behavior.

## Recent Sprint Context

- `SPRINT-009` shipped the core single-character editor, app catalog boundary, validation
  presentation, responsive shell, skill bar, browser, and template dialogs.
- `SPRINT-010` shipped local-first library persistence, autosave, saved records, backup/restore,
  freshness checks, and skill-template-first share URLs.
- `SPRINT-011` and `SPRINT-012` promoted runtime rune and insignia catalogs plus pure helpers for
  attribute-rune summaries and per-slot insignia projections.
- `SPRINT-013` promoted runtime weapon and weapon-modifier catalogs, template lookup helpers, and
  pairwise modifier compatibility.
- `SPRINT-014` added the semantic equipment shell and validation, while explicitly deferring app
  catalog views, editor controls, non-null persistence, backup/restore migration, validation
  presentation, and share-boundary UX to EPIC-14.

## Relevant Codebase Areas

- `src/app/catalogs.ts` is the only runtime generated-catalog import boundary. It must be extended
  to import/adapt EPIC-10, EPIC-11, and EPIC-12 catalogs and expose app-owned equipment catalog
  views, versions, attribution, and placeholder descriptors.
- `src/app/editor-state.ts` owns single-build editor actions and `createBlankBuild()`. It needs
  deterministic equipment update actions that initialize `createEmptyEquipmentLoadout()` on first
  edit while preserving `equipment: null` when untouched.
- `src/app/editor-selectors.ts` builds validation input, display views, skill tooltip rank context,
  and issue grouping. It must pass `equipmentCatalogs` to `validateBuild`, include equipment rank
  adjustments where relevant, and expose equipment-specific selector/display views.
- `src/app/App.tsx` composes the current editor layout. EPIC-14 should add an in-editor equipment
  panel/tab/collapsible surface without a new route.
- `src/app/persistence-schema.ts`, `src/app/backup-restore.ts`, `src/app/local-storage.ts`, and
  related tests own durable local data. They must validate, clone, serialize, parse, restore, and
  reject malformed `EquipmentLoadout` values without accepting dangerous keys or oversized arrays.
- `src/app/components/*` contains established panel and inline issue patterns. New equipment UI
  should follow existing component style and accessibility conventions.
- `src/app/share-url.ts`, `src/app/components/ShareControls.tsx`, and `src/app/template-workflow.ts`
  own skill-template sharing. Equipment remains excluded from Guild Wars skill template codes and
  share URLs, but the UI should be explicit when a build contains equipment that will be omitted.
- `src/domain/equipment.ts`, `src/domain/equipment-attribute-rank.ts`,
  `src/domain/weapon-set.ts`, `src/domain/rules/equipment.ts`, and
  `src/domain/validation-context.ts` provide the semantic contracts and validation helpers to reuse.
- `data/generated/epic-10/runes.catalog.json`,
  `data/generated/epic-11/insignias.catalog.json`,
  `data/generated/epic-12/weapons.catalog.json`, and
  `data/generated/epic-12/weapon-mods.catalog.json` are the only approved equipment runtime facts.
- `test/fixtures/rule-engine/equipment*.ts`, `test/domain/*equipment*`, `src/app/*test*`, and
  component tests are the likely verification homes.
- `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`,
  `compendium/equipment-shell.md`, `compendium/game-rule-engine.md`, `README.md`, and ticket
  records need closeout updates during execution.

## Constraints

- Follow `AGENTS.md`: keep human-facing communication concise and direct.
- This planning run may write planning, ticket, ledger, run-state, and manifest artifacts only. It
  must not modify implementation code or create a commit.
- `src/domain` must remain framework-neutral and must not import React, DOM/browser APIs, browser
  storage, network clients, app modules, generated JSON, manifests, QA reports, snapshots, data
  scripts, wiki APIs, or template codecs.
- Runtime generated catalog imports remain isolated to `src/app/catalogs.ts`. Leaf app components
  receive app-owned views and must not import generated JSON, manifests, QA reports, snapshots,
  Python tooling, wiki APIs, or remote media directly.
- Equipment editor MVP excludes armor skins, weapon skins, dyes, color IDs, inventory identity,
  acquisition facts, equipment template-code import/export, raw template exact replay, party
  equipment, recommendations, DPS/combat simulation, and full stat aggregation.
- Existing skill, profession, attribute, template import/export, local library, share URL, and
  backup/restore workflows must remain compatible.
- Unknown and unresolved semantic equipment selections must stay recoverable across edits,
  persistence, validation, and display.
- UI should live inside the existing editor surface, remain keyboard accessible, and be usable on
  narrow viewports without crowding the skill/attribute workflow.
- Share URLs stay skill-template-first and capped at 1,800 characters. Equipment can persist in
  native local data and backup JSON, but it must not be encoded into Guild Wars skill template share
  URLs in this sprint.
- Final execution should use focused Vitest/typecheck gates at phase boundaries and `npm run verify`
  for closeout.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-1401 through BW-1408 in dependency order with file-level tasks, verification gates, and
  closeout records.
- App catalog boundary projections for promoted rune, insignia, weapon, and weapon-modifier
  catalogs, including validation views, version/freshness facts, attribution additions, deterministic
  sorted option sets, and placeholder icon descriptors without remote media rendering.
- Editor actions/selectors that initialize, update, clear, and preserve semantic equipment state for
  five armor slots and four weapon sets without leaking generated records into authored build data.
- A user-facing equipment editor surface in the existing app layout with armor controls, weapon-set
  controls, searchable pickers, empty/unresolved/catalog-error states, inline validation, and
  responsive behavior.
- Equipment display and simple stat summaries for health delta, energy delta, armor notes,
  headgear/rune attribute effects, requirement notes, modifier effects, and unresolved state, with
  conditional or note-only effects kept as notes rather than totals.
- Persistence, autosave, saved records, backup/restore, and hydration that accept bounded
  `EquipmentLoadout` data while preserving older `equipment: null` records and rejecting malformed
  or unsafe equipment payloads.
- Skill-template import/export and share URL flows that continue to work and clearly warn when
  present equipment cannot be represented in those workflows.
- Docs, tickets, sprint records, ledger, and run manifest that agree on `SPRINT-015`, `EPIC-14`, and
  the deferred boundaries.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-14 grooming decisions, BW-1401
  through BW-1408 acceptance criteria, EPIC-13 semantic equipment contracts, and existing app
  architecture.
- Spec/documentation: `work/tickets/14-equipment-editor/EPIC.md`,
  `work/tickets/14-equipment-editor/BW-140*.md`, `work/sprints/SPRINT-014.md`,
  `compendium/equipment-shell.md`, `compendium/core-build-editor.md`,
  `compendium/local-library-and-sharing.md`, and existing app/domain tests.
- Edge cases identified:
  - old saved records and backups with `equipment: null`
  - first equipment edit initializing an empty loadout
  - clearing the last selected equipment choice without losing recoverable loadout shape
  - unresolved known/candidate IDs and catalog misses for runes, insignias, weapons, and modifiers
  - profession, mode, armor-slot, hand-occupancy, modifier-slot, and requirement incompatibilities
  - two-handed weapon plus off-hand conflicts and off-hand-only partial state
  - duplicate catalog IDs and weapon/modifier catalog-set mismatch
  - bounded malformed persisted equipment, dangerous object keys, oversized armor/set/modifier
    arrays, unsafe IDs, invalid discriminants, and unsupported equipment schema versions
  - share/export omission when equipment is present
  - narrow viewport overflow, focus order, keyboard picker behavior, and inline issue placement
- Testing approach:
  - focused app catalog boundary tests for equipment catalog adaptation and forbidden import scans
  - reducer/selector tests for equipment state updates, validation input, option filtering, and stat
    summaries
  - component tests for panel placement, armor controls, weapon controls, searchable pickers,
    keyboard interaction, empty/unresolved/catalog-error states, inline issues, and responsive layout
  - persistence/backup/restore/share tests for non-null equipment, old null equipment, invalid
    payload rejection, autosave, record hydration, backup preview/apply, and share omission warnings
  - domain regression tests where app selectors depend on EPIC-13 helpers
  - final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium - the domain model and catalogs are ready, but UI filtering,
  persistence validation, and explainable stat summaries need careful boundary choices.
- Scope uncertainty: Medium - tickets are groomed and dependency ordered, but this is a broad app
  feature touching catalog views, editor state, UI, validation, persistence, sharing, docs, and
  tests.
- Architecture uncertainty: Low-Medium - the sprint extends existing app boundary, reducer,
  selector, component, and persistence patterns. No high-risk new integration or external dependency
  blocks planning.

## Open Questions

Questions for the draft lanes to answer without blocking planning:

1. Should the equipment editor be integrated as a left-column panel, a tabbed editor section, or a
   collapsible section in the main column for the least disruptive current layout change?
2. What selector/view-model layer should own equipment option filtering so components stay simple
   and generated catalog records stay behind `src/app/catalogs.ts`?
3. Should a blank build keep `equipment: null` until first equipment edit, or should the panel
   initialize an empty loadout on first render?
4. How much stat aggregation is safe in EPIC-14 before crossing into EPIC-21 advanced analysis?
5. What bounded persistence validator shape best reuses EPIC-13 contracts while maintaining the
   existing local-library security posture?
6. How should share/export warnings be phrased and gated when a build has equipment but the
   skill-template code path cannot represent it?
7. Which focused tests should be required before broad component work, and which should be reserved
   for closeout?
