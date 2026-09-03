---
id: SPRINT-016
title: Title Rank Controls and PvE-only
status: completed
source_target: BACKLOG
source_epic: EPIC-15
source_epic_path: work/tickets/15-title-tracks-and-pve-only/EPIC.md
tickets:
  - BW-1501
  - BW-1502
  - BW-1503
  - BW-1504
  - BW-1505
created: 2026-09-03
updated: 2026-09-03
---

# Sprint 016: Title Rank Controls and PvE-only

## Overview

This sprint makes title-scaled skill output explicit and configurable without adding account title
tracking. A build with no title configuration continues to render title-scaled skills at the maximum
rank declared by the promoted EPIC-04 progression metadata. A user can lower only the title ranks
they care about through compact integer controls, and resetting a title returns to implicit maximum
behavior.

The implementation reuses the existing skill catalog. It does not create a second title ingestion
pipeline, read live title sources, model account ownership, track title acquisition, or copy source
prose. One framework-neutral title-rank helper owns discovery, exact alias normalization, labels,
rank-domain analysis, override projection, and diagnostics. App selectors and domain validation
consume the same helper so display and validation cannot drift.

Title-rank overrides are semantic per-build state because they change rendered skill output and must
survive local saves, duplication, backup, restore, and later multi-build work. The sprint advances
the nested `Build` schema to version 2 with a required normalized `titleRankOverrides` array, while
leaving `LocalLibraryEnvelopeV1` and the `build-wars:v1` storage key unchanged. Schema-1 persisted
builds migrate in memory to schema 2 with no overrides and must not be dirtied or rewritten merely
by opening them.

The current promoted catalog has one known planning baseline conflict: eight raw title keys collapse
to seven intended controls, and the Sunspear aliases expose `0-10`, `0-12`, and `0-15` domains.
The sprint must not hide that with fuzzy matching or silent clamping. Empty state resolves each
progression at its own declared maximum. Explicit Sunspear overrides are limited to common exact
rows and keep a narrow metadata warning until the underlying catalog can be repaired.

The existing three-PvE-only-skill limit remains owned by `src/domain/rules/skill-bar.ts`. This
sprint replaces broad EPIC-15 deferral warnings with precise title-rank and allegiance diagnostics,
but it does not redesign PvE-only counting, browser availability filtering, mode restrictions, or
skill-template/share payload formats.

## Assumptions

1. EPIC-15 can be planned as one sprint because BW-1501 through BW-1505 are groomed, ready, and
   dependency ordered.
2. EPIC-04 progression metadata is sufficient for title key discovery, rank domains, and default
   maxima; no new title ingestion pipeline is planned.
3. Per-build title overrides are the right state boundary. Account-wide title ownership and
   party-wide title state remain deferred.
4. The nested `Build` schema may advance to version 2 while the outer local-library envelope and
   storage key remain version 1.
5. The observed Sunspear alias/domain conflict is handled conservatively in runtime logic and tests
   unless Phase 0 proves a small EPIC-04 catalog repair is safer.
6. Share URLs and skill-template bytes stay title-free in this sprint. Only authored non-default
   title overrides require omission or replacement warnings.
7. Planning skipped interview under the non-interactive ticket-burn contract because no blocking
   high-risk architecture choice remains unresolved after the binding decisions in this sprint.
8. This planning run updates sprint, draft, ticket, ledger, and result-manifest records only; no
   implementation source change or commit is part of planning.

## Use Cases

1. **Default title output**: A new or migrated build has no title-rank overrides, yet supported
   title-scaled skills render from each progression's declared maximum rank.
2. **Relevant controls**: Selecting title-scaled skills reveals only the title controls referenced
   by the current skill bar, ordered by first slot use.
3. **Preconfiguration**: A user can open an unobtrusive all-title view and configure a discovered
   title before selecting a related skill.
4. **Exact rank entry**: A user can decrement, increment, or directly enter an integer within the
   catalog-derived editable domain.
5. **Reset to max**: Reset removes the authored override. Coherent titles return to one implicit
   maximum; conflicted alias groups return to per-series implicit maxima.
6. **Alias handling**: Skills using either Sunspear key form share one user-facing control while
   raw-key projection remains exact for tooltip rendering and validation.
7. **Display consistency**: Lowering a rank updates skill-browser rows, skill-bar slots, pinned
   tooltips, description values, progression labels, and validation from the same resolved context.
8. **Metadata gaps**: Missing title keys, missing domains, row gaps, conflicting aliases, and
   unsupported title-classified skills produce bounded warnings without crashing or fabricating
   values.
9. **Allegiance scope**: Allegiance-ranked skills use rank-first behavior and show one narrow
   side/exclusivity warning only when selected catalog facts require it.
10. **PvE-only preservation**: Exactly three PvE-only skills remain allowed in PvE, the fourth and
    later slots remain deterministic errors, and PvE/PvP mode restrictions remain unchanged.
11. **Local durability**: Working-draft autosave, named saves, update, save-as-new, load,
    duplication, backup, restore, and hydration preserve canonical title overrides.
12. **Honest sharing**: Skill-template export and share URLs remain available when otherwise valid
    and warn only when authored non-default title overrides will be omitted or overwritten.

## Architecture

### Scope Boundary

| Area           | In Scope                                                                                                                                                                 | Out Of Scope                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Title metadata | Discovery from EPIC-04 progression series, exact alias registry, labels, declared and editable domains, row coverage, deterministic ordering, and diagnostics.           | New title ingestion, runtime wiki reads, title acquisition, title history, reputation thresholds, campaign unlocks, copied source prose. |
| Authored state | Per-build canonical title-rank override array, build schema 2, implicit maximum semantics, reset-by-removal, migration, cloning, fingerprints, and stale-state recovery. | Account profiles, account ownership validation, global title defaults, backend sync, party-wide title rank state.                        |
| Rendering      | One selected/default title-rank projection for tooltip and skill-display paths, configured-rank labels, unresolved detail, and exact-row lookup.                         | Runtime interpolation, nearest-rank fallback, source-authored HTML, guide rendering, combat simulation.                                  |
| Editor UI      | Compact relevant-title controls, optional all-title disclosure, integer input, step buttons, reset, responsive layout, focus behavior, and inline issues.                | Slider-only controls, title dashboard, farming planner, new route, new UI package.                                                       |
| Validation     | Resolved title dependencies, override diagnostics, metadata/allegiance warnings, rule-engine v3, and PvE-only regression coverage.                                       | Unlock legality, ownership proof, allegiance side selection, party legality, separate validators.                                        |
| Compatibility  | Local-library migration, save/load/backup/restore, skill-template omission messaging, equipment coexistence, existing browser filtering.                                 | Title ranks in skill-template bytes or current share fragments, equipment share payloads, hosted sharing.                                |

### Binding Decisions

1. `Build` owns `titleRankOverrides` because title ranks affect the semantic output of one authored
   character build.
2. `Build.schemaVersion` advances to `2`. The outer `LocalLibraryEnvelopeV1`, storage key
   `build-wars:v1`, saved-with catalog facts, and share fragment grammar remain unchanged.
3. Normalized runtime builds always contain `titleRankOverrides: readonly TitleRankOverride[]`.
   Persisted schema-1 builds without the field migrate to an empty schema-2 array in memory.
4. Overrides are persisted as bounded, sorted `{ key, rank }` entries. No raw keys, labels, domains,
   rows, catalog records, or provenance objects are stored in authored build state.
5. Empty override state is normal. For coherent definitions, setting the title to the canonical
   maximum removes the entry. For conflicted alias groups, explicit common-maximum values remain
   authored state because reset would restore higher per-series implicit maxima.
6. `src/domain/title-rank.ts` is the single owner of key grammar, exact aliases, labels, definition
   discovery, domain analysis, override canonicalization, per-skill projection, and diagnostics.
7. Alias handling is explicit. Only reviewed exact aliases are collapsed. Unknown keys are
   normalized syntactically but are not merged by fuzzy matching, suffix similarity, or label.
8. The current Sunspear alias group resolves to one visual control. Empty state uses each raw
   series' own max. Explicit overrides are allowed only where every alias member has an exact row.
   The planning baseline common editable domain is `0-10`.
9. Reducers remain catalog-independent and structural. Actions carry a canonical key and candidate
   integer; mutation helpers validate shape and apply caller-supplied domain facts, while validation
   re-checks against current catalog facts.
10. The title catalog is derived once at app catalog adaptation and reused by selectors. Validation
    may derive independently from caller-supplied `SkillValidationCatalog`, but must call the same
    pure constructor.
11. The compact title panel lives inside the `Skills` workspace between `SkillBar` and
    `SkillBrowser`.
12. Relevant controls are ordered by first selected skill slot, then label and key. The all-title
    disclosure is label/key ordered and includes irrelevant retained overrides.
13. `renderSkillTooltipText` keeps its caller-supplied rank-context API. Selectors provide exact raw
    title-key ranks, using a `Map` or null-prototype object bridge.
14. `skill.title-deferred` and `skill.allegiance-deferred` stop being emitted. New precise codes
    replace them, and `RULE_ENGINE_VERSION` advances from `rule-engine:v2` to `rule-engine:v3`.
15. Title overrides do not enter skill-template bytes, exact-source replay, canonical template
    projections, or current share URLs. Non-empty overrides trigger omission and import-replacement
    warnings.
16. Equipment-derived attribute ranks and title ranks remain separate. Title projection must not
    mutate authored attributes, equipment summaries, or weapon requirement analysis.

### Data Flow

```text
EPIC-04 skill progression metadata
  -> src/domain/title-rank.ts
  -> TitleRankCatalog and raw-key projection helpers
  -> Build.titleRankOverrides
  -> app title-rank selectors and validation context
  -> renderSkillTooltipText / SkillDisplay / TitleRankPanel
  -> validateBuild title/allegiance diagnostics
  -> local library, backup/restore, template/share omission warnings
```

### State Contract

Preferred contracts, with exact TypeScript names allowed to follow local style:

```text
BUILD_SCHEMA_VERSION = 2

TitleRankOverride
  key: string
  rank: number

Build
  schemaVersion: 2
  ...existing fields
  titleRankOverrides: readonly TitleRankOverride[]
  equipment: EquipmentLoadout | null
```

Parser and mutation rules:

- `titleRankOverrides` is bounded to the discovered definition count, with a hard untrusted-input
  cap of 32.
- Keys must match a bounded canonical `title:<slug>` grammar and must not be dangerous object keys.
- Ranks must be finite safe integers.
- Duplicate canonical keys after alias normalization are rejected deterministically.
- Structurally valid unknown/stale keys are retained inertly, warned, and resettable. They are not
  silently dropped and then overwritten by autosave.
- Malformed, unsafe, oversized, duplicate, or unsupported override structures reject the containing
  snapshot under existing local-library recovery policy.
- Opening schema-1 data must not dirty or eagerly rewrite a valid library. The first authorized
  save writes schema 2 through the existing write path.

### Title Definition And Resolution

`createTitleRankCatalog(progressionSeries)` should return immutable definitions, indexes, and
diagnostics:

```text
TitleRankCatalog
  definitions
  byCanonicalKey
  canonicalKeyByRawKey
  diagnostics

TitleRankDefinition
  key
  label
  rawKeys
  seriesIds
  declaredDomains
  editableDomain
  defaultKind: coherent | alias-conflict | unsupported
```

Resolution for one skill follows that skill's `progressionSeriesIds`, not the entire catalog. An
implicit resolution supplies every referenced raw key at that series' declared maximum. An explicit
override supplies the canonical authored rank only when that rank has an exact row in every
referenced series for the alias group. Missing series, missing `titleKey`, missing `rankDomain`,
duplicate row ranks, non-contiguous row coverage, missing exact rows, non-finite values, or alias
domain conflicts produce diagnostics rather than interpolated values.

Known labels are a tiny authored presentation registry: `Allegiance`, `Asura`, `Deldrimor`,
`Ebon Vanguard`, `Lightbringer`, `Norn`, and `Sunspear`. Unknown valid keys get deterministic
title-cased slug labels but remain separate.

### Validation And PvE-only

Validation derives title context from the same pure helper and appends title issues in the existing
skill validation ordering. Required replacement codes may adjust during implementation, but the
final contract must include narrow codes for:

- missing title key
- missing or invalid rank domain
- missing exact progression row for selected rank
- alias/domain conflict affecting a selected skill
- invalid, duplicate, unknown, or stale authored override
- title-classified skill with no rank metadata
- allegiance side/exclusivity unmodeled

The previous generic EPIC-15 deferral messages are not emitted after this sprint. PvE-only
composition stays in `src/domain/rules/skill-bar.ts`; EPIC-15 adds regression coverage and
presentation cleanup only.

### Sharing

Skill-template export, exact-source template replay, and current share URLs remain title-free.
Implicit maxima require no warning because no authored state is being lost. Non-empty
`titleRankOverrides` require warnings in export/share surfaces and before replacing a draft through
template import. Warnings must compose with existing equipment omission messaging.

## Implementation

### Phase 0: BW-1501 Decision Gate And Baseline (~8% of effort)

**Files:**

- `work/sprints/SPRINT-016.md` - Execution source of truth.
- `work/tickets/15-title-tracks-and-pve-only/*.md` - Ticket status and planning traceability.
- `src/app/editor-selectors.test.ts`, `src/app/skill-display.test.tsx` - Current title display
  assumptions.
- `test/domain/skill-eligibility-rules.test.ts`, `test/domain/skill-bar-rules.test.ts` - Current
  title deferrals and PvE-only limits.

**Tasks:**

- [x] Mark `SPRINT-016` and BW-1501 through BW-1505 in progress when execution starts.
- [x] Run a focused baseline for current max-title assumption display, `skill.title-deferred`,
      `skill.allegiance-deferred`, PvE-only limits, and old local-library records.
- [x] Confirm the promoted catalog title-key/domain baseline. If it differs from planning, record a
      sprint amendment before implementing alias behavior.
- [x] Freeze build schema 2, local-library envelope v1, the exact Sunspear alias policy, unknown-key
      retention, replacement validation-code strategy, and share-warning conditions.
- [x] Decide whether Phase 0 can fix an obvious EPIC-04 key normalizer bug without adding title
      ingestion. If not, runtime conservative handling remains binding.
- [x] Verify with `npm run typecheck` and focused existing tests touched by the baseline.

### Phase 1: BW-1501 Title Metadata, State, And Persistence (~24% of effort)

**Files:**

- `src/domain/title-rank.ts` - New pure title-rank helper.
- `src/domain/build.ts`, `src/domain/index.ts` - Build schema 2 and exports.
- `src/app/editor-state.ts` - Structural set/reset title override actions.
- `src/app/persistence-schema.ts`, `src/app/local-storage.ts`, `src/app/backup-restore.ts`,
  `src/app/workspace-state.ts` - Migration, parsing, cloning, fingerprints, saves, backup/restore.
- `test/domain/title-rank.test.ts`, `src/app/editor-state.test.ts`,
  `src/app/persistence-schema.test.ts`, `src/app/local-storage.test.ts`,
  `src/app/backup-restore.test.ts`, `src/app/workspace-state.test.ts` - Focused coverage.

**Tasks:**

- [x] Implement title catalog discovery from `SkillProgressionSeries[]`, exact aliases, labels,
      domains, row coverage, deterministic ordering, diagnostics, and memoizable indexes.
- [x] Cover all current raw keys, the Sunspear alias conflict, duplicate series/rows, missing keys,
      missing domains, non-finite values, row gaps, and input-order determinism.
- [x] Add schema-2 `Build.titleRankOverrides` as a required normalized runtime array and update
      blank build fixtures.
- [x] Add pure set/reset helpers that sort entries, remove coherent max overrides, preserve
      conflicted common-maximum overrides, and avoid mutating unrelated build fields.
- [x] Parse schema-1 persisted builds into schema-2 runtime builds without dirtying old records.
- [x] Bound and validate schema-2 override arrays; reject malformed/unsafe structures; retain safe
      unknown/stale canonical entries with warnings and reset affordance.
- [x] Deep-copy overrides in clone, snapshot, save, duplicate, backup, restore, and fingerprint
      paths.
- [x] Verify with focused domain, reducer, persistence, local-storage, backup, and workspace tests.

### Phase 2: BW-1502 Compact Title Rank Controls (~18% of effort)

**Files:**

- `src/app/title-rank-selectors.ts` - Relevant/all-title panel view models.
- `src/app/editor-selectors.ts` - Compose title panel rows and inline issue groups.
- `src/app/components/TitleRankPanel.tsx` - New control panel.
- `src/app/App.tsx` - Insert panel in the `Skills` workspace.
- `src/app/styles.css` - Compact responsive control styles.
- `src/app/title-rank-panel.test.tsx`, `src/app/editor-selectors.test.ts`,
  `src/app/App.test.tsx` - Component and selector tests.

**Tasks:**

- [x] Build view models for relevant selected-skill controls, expanded all-title controls, retained
      irrelevant overrides, unknown/stale overrides, disabled metadata-conflict rows, and inline
      issue placement.
- [x] Render `TitleRankPanel` between `SkillBar` and `SkillBrowser` without changing routes,
      equipment tab behavior, skill placement, or browser filters.
- [x] Provide native integer input, decrement, increment, reset, min/max text, current/effective
      rank text, warning text, and stable ARIA relationships.
- [x] Keep no-title builds low-noise while preserving an all-title affordance for preconfiguration.
- [x] Preserve focus and draft input text through valid edits; restore last resolved value for
      blank, decimal, exponential, whitespace, unsafe, or out-of-range commits.
- [x] Ensure long labels wrap and controls remain usable on narrow viewports without horizontal
      overflow.
- [x] Verify keyboard, pointer, screen-reader labels, live-region announcements, reset, all-title
      expansion, relevant ordering, and responsive behavior.

### Phase 3: BW-1503 Tooltip And Display Integration (~18% of effort)

**Files:**

- `src/app/editor-selectors.ts`, `src/app/title-rank-selectors.ts` - Rank-context projection and
  display facts.
- `src/domain/skill-tooltip.ts` - Exact-row rendering and improved unresolved detail if needed.
- `src/app/components/SkillDisplay.tsx`, `src/app/components/SkillTooltip.tsx`,
  `src/app/components/SkillBar.tsx`, `src/app/components/SkillBrowser.tsx` - Display integration.
- `src/app/editor-selectors.test.ts`, `src/app/skill-display.test.tsx`,
  `src/app/skill-bar.test.tsx`, `src/app/skill-browser.test.tsx`,
  `test/domain/skill-catalog.test.ts` - Focused tests.

**Tasks:**

- [x] Replace selector-generated maximum-title assumptions with helper-backed selected/default
      title rank contexts.
- [x] Feed exact raw-key ranks into `renderSkillTooltipText` for skill-browser rows, skill-bar
      slots, and pinned tooltip panels.
- [x] Remove maximum-title-rank assumption copy for resolved title dependencies while preserving
      equipment uncertainty assumptions.
- [x] Update progression labels and skill facts to use canonical title labels and effective rank
      status.
- [x] Keep unsupported descriptions, missing progression series, missing rows, and alias conflicts
      visible as structured unresolved states.
- [x] Ensure browser preview does not rescan all progression series per row; use precomputed title
      catalog/indexes.
- [x] Verify default max, lowered rank, reset, alias conflict, no-progression title skills,
      equipment-adjusted attribute rank coexistence, pinned tooltip updates, and browser rendering
      performance.

### Phase 4: BW-1504 Validation And PvE-only Cleanup (~22% of effort)

**Files:**

- `src/domain/validation.ts` - New issue codes, rule order, unresolved set, rule-engine v3.
- `src/domain/validation-context.ts` - Title context from validation input.
- `src/domain/rules/skill-eligibility.ts` - Replace deferrals with resolved/unresolved title rules.
- `src/domain/rules/skill-bar.ts` - Preserve PvE-only behavior; modify only for proven bugs.
- `src/domain/rule-engine.ts` - Compose title issues through the existing result.
- `src/app/editor-selectors.ts`, `src/app/components/ValidationPanel.tsx` - Presentation handoff.
- `test/domain/skill-eligibility-rules.test.ts`, `test/domain/skill-bar-rules.test.ts`,
  `test/domain/validation-context.test.ts`, `test/domain/rule-engine.test.ts`,
  `test/domain/rule-engine-contracts.test.ts`, `src/app/editor-selectors.test.ts`,
  `src/app/skill-browser.test.tsx` - Validation and app regressions.

**Tasks:**

- [x] Advance `RULE_ENGINE_VERSION` to `rule-engine:v3` and update freshness/contract fixtures.
- [x] Add narrow title and override issue codes with deterministic paths, locations, related
      entities, source rules, severity, deduplication, and ordering.
- [x] Suppress generic title deferral behavior when title dependencies resolve by implicit max or
      authored override.
- [x] Emit specific warnings for missing key/domain/row facts, unsupported title-classified skills,
      selected alias conflicts, unknown or stale overrides, and malformed but recoverable title
      state.
- [x] Treat allegiance as rank-first and emit one narrow side/exclusivity warning for selected
      affected skills when catalog facts cannot resolve that legality.
- [x] Prove `skill.title-deferred` and `skill.allegiance-deferred` are no longer emitted.
- [x] Preserve existing PvE-only counts, PvP/unknown mode restrictions, browser availability
      filtering, issue ordering, truncation behavior, and validation result flags.
- [x] Verify with `npm run test:run -- test/domain src/app` plus focused rule-engine contracts.

### Phase 5: BW-1505 Sharing, Docs, And Closeout (~10% of effort)

**Files:**

- `src/app/template-workflow.ts`, `src/app/components/TemplateDialogs.tsx`,
  `src/app/components/ShareControls.tsx` - Omission and replacement messaging.
- `src/app/template-workflow.test.ts`, `src/app/template-dialogs.test.tsx`,
  `src/app/share-url.test.ts`, `src/app/App.test.tsx` - Share/template/app coverage.
- `README.md`, `compendium/skills-catalog.md`, `compendium/game-rule-engine.md`,
  `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`,
  `compendium/equipment-editor.md` or `compendium/title-ranks.md` - Documentation.
- `work/tickets/15-title-tracks-and-pve-only/*.md`, `work/sprints/SPRINT-016.md`,
  `work/sprints/ledger.tsv`, `work/runs/ticket-burn/BACKLOG/20260903T014346Z/*` - Records.

**Tasks:**

- [x] Warn when export/share omits non-empty title overrides, composed with equipment omission
      warnings.
- [x] Warn before template import replaces a draft that has authored title overrides.
- [x] Prove share URL grammar, skill-template bytes, length caps, exact-source replay, and template
      fidelity remain unchanged by title state.
- [x] Document default-max behavior, sparse overrides, schema 2, aliases, Sunspear conflict,
      reset-to-max, validation changes, PvE-only preservation, local-only sharing, and deferred
      account/title-ingestion scope.
- [x] Run manual smoke checks for focus retention, live announcements, long labels, mobile number
      input, no-title builds, all-title disclosure, pinned tooltip updates, share warnings, and
      import replacement warnings.
- [x] Run final `npm run verify` and `git diff --check`.
- [x] Mark BW-1501 through BW-1505, EPIC-15, and SPRINT-016 done only after verification and docs
      closeout pass.
- [x] Synchronize ticket metadata, sprint ledger, run manifest, and execution notes.

## Files Summary

| File                                                                                                                                     | Action                     | Purpose                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/domain/title-rank.ts`                                                                                                               | Create                     | Canonical title discovery, aliases, domains, resolution, mutation helpers, and diagnostics.                   |
| `src/domain/build.ts`                                                                                                                    | Modify                     | Advance build schema and add title-rank override state.                                                       |
| `src/domain/skill-tooltip.ts`                                                                                                            | Modify                     | Preserve exact-row rendering with clearer unresolved title outcomes if needed.                                |
| `src/domain/validation.ts`                                                                                                               | Modify                     | Add replacement title issue codes, ordering, unresolved accounting, and rule-engine v3.                       |
| `src/domain/validation-context.ts`                                                                                                       | Modify                     | Build title validation context from skill catalog facts and authored overrides.                               |
| `src/domain/rules/skill-eligibility.ts`                                                                                                  | Modify                     | Replace broad title/allegiance deferrals with resolved and narrow unresolved rules.                           |
| `src/domain/rules/skill-bar.ts`                                                                                                          | Test/modify only if needed | Preserve existing PvE-only skill-count behavior.                                                              |
| `src/domain/rule-engine.ts`                                                                                                              | Modify                     | Compose title validation through the existing result.                                                         |
| `src/domain/index.ts`                                                                                                                    | Modify                     | Export title-rank contracts and helpers.                                                                      |
| `src/app/catalogs.ts`                                                                                                                    | Modify                     | Derive and expose reusable app title-rank catalog/indexes without new generated imports.                      |
| `src/app/title-rank-selectors.ts`                                                                                                        | Create                     | Build relevant/all-title view models, row status, issues, and omission facts.                                 |
| `src/app/editor-state.ts`                                                                                                                | Modify                     | Add structural title override actions and blank build schema updates.                                         |
| `src/app/editor-selectors.ts`                                                                                                            | Modify                     | Compose title control views, tooltip rank context, display facts, validation input, and share warnings.       |
| `src/app/persistence-schema.ts`                                                                                                          | Modify                     | Parse schema 2, migrate schema 1, bound override arrays, clone, and fingerprint.                              |
| `src/app/local-storage.ts`, `src/app/backup-restore.ts`, `src/app/workspace-state.ts`                                                    | Modify/test                | Preserve title overrides through durability workflows.                                                        |
| `src/app/components/TitleRankPanel.tsx`                                                                                                  | Create                     | Compact accessible relevant/all-title controls.                                                               |
| `src/app/components/SkillDisplay.tsx`, `src/app/components/SkillTooltip.tsx`                                                             | Modify                     | Render configured title facts and remove resolved max-assumption copy.                                        |
| `src/app/components/SkillBar.tsx`, `src/app/components/SkillBrowser.tsx`                                                                 | Test/modify                | Ensure title rank updates and PvE/title filtering stay consistent.                                            |
| `src/app/components/ShareControls.tsx`, `src/app/components/TemplateDialogs.tsx`, `src/app/template-workflow.ts`, `src/app/share-url.ts` | Modify/test                | Preserve template/share payloads and add local-only override warnings.                                        |
| `src/app/styles.css`                                                                                                                     | Modify                     | Add responsive title-control layout and status styles.                                                        |
| `test/domain/title-rank.test.ts` and existing domain tests                                                                               | Create/modify              | Cover title helper, validation, rule-engine, and PvE-only contracts.                                          |
| `src/app/*test*`                                                                                                                         | Create/modify              | Cover controls, selectors, display, persistence, local library, backup, workspace, template, and share flows. |
| `README.md`, `compendium/*.md`                                                                                                           | Modify                     | Document shipped behavior and deferred scope.                                                                 |
| `work/tickets/15-title-tracks-and-pve-only/*.md`                                                                                         | Modify                     | Track planning, execution, acceptance evidence, and closeout.                                                 |
| `work/sprints/SPRINT-016.md`, `work/sprints/ledger.tsv`, result manifest                                                                 | Create/modify              | Authoritative sprint, ledger, and ticket-burn records.                                                        |

## Definition of Done

- [x] Phase 0 binding decisions are recorded before implementation proceeds.
- [x] All EPIC-04 title-rank progression dependencies are discovered through one pure helper.
- [x] Raw title keys normalize to stable canonical keys, including the exact Sunspear alias, with no
      fuzzy merging.
- [x] Labels, declared domains, common editable domains, row coverage, and diagnostics are
      deterministic under reordered input.
- [x] Empty title state renders supported dependencies at implicit per-series maximum ranks.
- [x] Explicit overrides are safe integers, canonical, bounded, sorted, unique, and limited to exact
      editable rows.
- [x] Reset and coherent max values remove overrides; conflicted common-maximum overrides remain
      distinct from reset.
- [x] Metadata conflicts, including the promoted Sunspear domain mismatch, stay visible and never
      produce invented rank facts.
- [x] Runtime `Build` schema 2 stores only `{ key, rank }` override entries.
- [x] Schema-1 persisted builds migrate to schema 2 with empty overrides while the outer
      local-library schema and storage key remain unchanged.
- [x] Migration on read does not dirty or eagerly overwrite valid old libraries.
- [x] Malformed, duplicate, unsafe, oversized, and unsupported persisted data follows bounded
      deterministic recovery behavior.
- [x] Structurally valid unknown/stale overrides remain recoverable, warn clearly, and can be reset.
- [x] Working draft autosave, named saves, update, save-as-new, load, duplication, backup, restore,
      hydration, and fingerprints preserve title overrides.
- [x] Profession, mode, attribute, skill, browser, and equipment edits preserve unrelated title
      state; title edits preserve unrelated state.
- [x] Skill-template bytes, raw overlays, exact-source fidelity, share URL format, and share length
      cap are unchanged.
- [x] Non-default title overrides receive clear local-only omission and import-replacement warnings.
- [x] Relevant title controls appear by default in first-skill-slot order.
- [x] Optional all-title disclosure exposes remaining definitions and retained irrelevant overrides
      without dominating no-title builds.
- [x] Every enabled control supports decrement, increment, exact integer entry, and reset.
- [x] Inputs enforce bounds, reject malformed draft text, and expose labels, status, current value,
      maximum, and issues to assistive technology.
- [x] Long labels and controls remain usable without horizontal scrolling at supported narrow
      viewports.
- [x] Default, lowered, reset, aliased, conflicted, and unresolved ranks render consistently in the
      browser, skill bar, skill display, and tooltip.
- [x] Maximum-title-rank assumption copy is absent for resolved dependencies.
- [x] Structured unsupported progression remains visible and no interpolation is added.
- [x] Equipment-adjusted attribute ranks and title ranks coexist without collision or altered
      equipment semantics.
- [x] Resolved default or overridden title dependencies emit no generic title deferral warning.
- [x] Missing, unsupported, row-incomplete, domain-conflicting, and ambiguous title metadata emit
      deterministic located warnings.
- [x] Invalid, duplicate, unknown, or out-of-current-domain authored overrides emit deterministic
      title-row warnings without blocking unrelated titles.
- [x] Title-classified skills without progression keys are not falsely considered resolved.
- [x] Allegiance rank scaling works and side/exclusivity uncertainty is one narrow visible warning,
      with no inferred ownership or side selector.
- [x] `skill.title-deferred` and `skill.allegiance-deferred` are no longer emitted.
- [x] Rule-engine version 3, issue ordering, result flags, freshness facts, and truncation behavior
      are tested.
- [x] Exactly three PvE-only skills remain allowed in PvE, and fourth/later slots retain the existing
      deterministic limit error.
- [x] PvP/unknown mode restrictions and browser availability filters remain unchanged.
- [x] Title catalog/index derivation is cached or precomputed so browser/list rendering does not
      rebuild it per visible row.
- [x] Manual smoke checks cover focus retention, live announcements, long labels, mobile number
      input, pinned-tooltip updates, no-title state, all-title disclosure, share warnings, and import
      replacement warnings.
- [x] Focused domain, reducer, selector, component, persistence, workspace, backup, template, share,
      and compatibility suites pass.
- [x] `npm run test:run -- src/app test/domain` passes.
- [x] `npm run verify` passes.
- [x] `git diff --check` passes.
- [x] README and compendium docs describe title defaults, overrides, aliases, conflicts, reset,
      persistence, validation, PvE-only behavior, sharing omissions, and deferred scope.
- [x] BW-1501 through BW-1505, EPIC-15, SPRINT-016, the ledger, and ticket-burn manifests agree on
      status, scope, assumptions, commands, and outcomes.

## Risks & Mitigations

| Risk                                                                             | Likelihood | Impact | Mitigation                                                                                                                                                      |
| -------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sunspear alias members expose incompatible domains and create false rank claims. | High       | High   | Preserve per-series implicit maxima, restrict explicit edits to common exact rows, emit selected-skill conflict warnings, and document the baseline.            |
| Build schema migration breaks old libraries or causes eager autosave churn.      | Medium     | High   | Keep the outer envelope stable, migrate schema 1 in memory, prove no dirty/rewrite on open, and serialize schema 2 only on authorized writes.                   |
| String-key title state introduces duplicate/prototype hazards.                   | Low        | High   | Persist bounded arrays, reject dangerous keys recursively, validate exact key grammar, and bridge to tooltip ranks through `Map` or null-prototype objects.     |
| Selectors and validation normalize title keys differently.                       | Medium     | High   | Use the same pure title-rank constructor/resolver in both paths and test app/domain parity.                                                                     |
| Validation cleanup hides real metadata gaps.                                     | Medium     | High   | Replace generic deferrals only after resolved rank state exists; test missing keys, domains, rows, title-classified no-progression skills, and alias conflicts. |
| PvE-only behavior regresses while title logic changes.                           | Low        | High   | Keep rule ownership separate and lock exactly-three, fourth-and-later, PvP, unknown-mode, and ordering regressions.                                             |
| Unknown/stale overrides are silently lost after catalog churn or downgrade.      | Medium     | Medium | Retain structurally safe unknown entries inertly, warn, keep reset available, and avoid autosave overwrite from read-only migration.                            |
| Browser rendering repeatedly scans thousands of progression records.             | Medium     | Medium | Precompute title indexes once at app catalog adaptation and require selector performance coverage.                                                              |
| Local-only title ranks are silently omitted during sharing/import.               | High       | Medium | Reuse composed omission/replacement warnings and test share/template bytes remain intentionally title-free.                                                     |
| Allegiance warnings imply unsupported ownership facts or become noisy.           | Medium     | Medium | Emit one narrow selected-skill warning for side/exclusivity uncertainty and defer account modeling.                                                             |
| Compact controls crowd the Skills workspace on narrow screens.                   | Medium     | Medium | Show relevant rows first, keep all-title rows in a disclosure, stack controls at breakpoints, and smoke-test mobile number input.                               |
| Issue-code replacement breaks consumers keyed to old deferral codes.             | Medium     | Medium | Bump `RULE_ENGINE_VERSION`, update contracts/docs/tests, and avoid reusing old codes with changed meaning.                                                      |

## Security Considerations

- Treat persisted local libraries, backups, build objects, title keys, ranks, and catalog progression
  data as untrusted input.
- Reject dangerous keys recursively before migration or hydration. Reconstruct build and override
  arrays field by field.
- Bound override count, key length, slug grammar, rank values, diagnostics, and traversal work.
- Require finite safe integers for domains, rows, and overrides. Do not evaluate strings, parse
  expressions, interpolate missing values, or accept decimal/exponential UI text as integer ranks.
- Render labels, keys, diagnostics, and skill facts as React text. Do not use source-authored HTML
  or `dangerouslySetInnerHTML`.
- Keep generated JSON imports isolated to `src/app/catalogs.ts`; do not import manifests, QA files,
  snapshots, source plans, source prose, local paths, or remote media at runtime.
- Add no network request, account identifier, telemetry, storage key, auth surface, backend service,
  npm package, or Python dependency.
- Preserve existing explicit confirmation and write-blocked recovery boundaries for destructive
  draft replacement and backup restore.
- Title-rank output is display configuration, not account ownership or unlock proof.

## Dependencies

- **EPIC-04 / SPRINT-005**: promoted skill catalog, title-rank dependency keys, rank domains,
  progression series, structured descriptions, classifications, and mode splits.
- **EPIC-06 / SPRINT-007**: validation engine, title deferral placeholders, PvE-only limit,
  issue metadata, result flags, and validation ordering.
- **EPIC-08 / SPRINT-009**: single-character editor, reducer, skill bar/browser, displays,
  tooltips, maximum-title assumptions, and responsive component patterns.
- **EPIC-09 / SPRINT-010**: local-library envelope, working drafts, saved records, duplication,
  backup/restore, template sharing, freshness, migration hooks, and dirty guards.
- **EPIC-13 / SPRINT-014**: nullable equipment model and equipment-adjusted attribute ranks.
- **EPIC-14 / SPRINT-015**: equipment editor integration, persistence, workspace tabs, and existing
  template omission messaging.
- Existing React 19, TypeScript 5.9, Vite 6, Vitest 4, Testing Library, ESLint, and Prettier setup.
- Existing promoted `data/generated/epic-04/skills.catalog.json` through the approved app catalog
  boundary.
- No new package, service, API, database, route, worker, environment variable, or data source is
  planned.

## Open Questions

No open question blocks execution. The sprint adopts these defaults:

1. Title overrides live on schema-2 `Build` objects, not in transient UI state or account profiles.
2. The outer local-library envelope remains version 1; schema-1 builds migrate to schema 2 in memory
   without eager writes.
3. Sunspear exact aliases collapse to one user-facing control; implicit default is per-series max;
   explicit overrides use common exact rows and keep conflict diagnostics visible.
4. Structurally safe unknown/stale overrides are retained and resettable; malformed unsafe
   structures are rejected.
5. New specific issue codes plus `rule-engine:v3` replace generic title/allegiance deferral
   emissions.
6. Share/export warns only for authored non-default overrides that current payloads omit.
7. Allegiance side/exclusivity remains a narrow warning, not an account-side selector.

## Execution Closeout

- Completed in SPRINT-016.
- Phase 0 confirmed the promoted EPIC-04 catalog baseline: 111 title progression series, eight raw
  title keys, seven canonical controls, and the planned Sunspear alias/domain conflict. No EPIC-04
  ingestion repair was made; runtime handling stays conservative.
- Build schema decision: nested `Build` objects are schema version 2 with required sparse
  `titleRankOverrides`; the outer local-library envelope and `build-wars:v1` storage key remain
  version 1.
- Runtime behavior: empty title state uses implicit per-series maximums, exact aliases normalize
  only through the title helper, coherent maximum/reset removes overrides, and conflicted Sunspear
  overrides stay limited to common exact rows with visible diagnostics.
- Validation behavior: `RULE_ENGINE_VERSION` is `rule-engine:v3`; generic
  `skill.title-deferred` and `skill.allegiance-deferred` emissions were replaced by located
  title-rank and narrow allegiance warnings while the existing PvE-only limit stayed unchanged.
- Sharing behavior: skill-template bytes, exact-source replay, raw overlays, share URL grammar, and
  the 1,800-character cap remain title-free; authored title overrides show local-only omission and
  import-replacement warnings.
- Validation completed with `npm run typecheck`, focused title/persistence/share/rule-engine
  Vitest coverage, `npm run test:run -- src/app test/domain`, `npm run lint`, final
  `npm run verify`, and `git diff --check`.
