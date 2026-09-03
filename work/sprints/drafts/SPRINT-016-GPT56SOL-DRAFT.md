---
id: SPRINT-016
title: Title Rank Controls and PvE-only
status: planned
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
---

# Sprint 016: Title Rank Controls and PvE-only

## Overview

This sprint makes title-scaled skill output an explicit, durable part of the single-character
build editor. Title dependencies continue to default to the maximum rank described by the promoted
EPIC-04 skill progression metadata, while users can author compact integer overrides, reset an
override to implicit maximum, and see the selected rank applied consistently in skill displays and
tooltips.

The implementation derives title definitions from the existing skill catalog. It does not create a
second title catalog or a new ingestion path. A framework-neutral title-rank module owns exact key
normalization, the one approved Sunspear alias, labels, domain analysis, default resolution, and
override projection. App selectors and validation consume that shared result instead of maintaining
separate title rules.

Title-rank overrides are semantic per-build state because they change rendered skill output and must
travel with local saves, duplication, backup, and restore. `Build` advances to schema version 2 and
stores only deviations from implicit maximum as a bounded, sorted array. The outer local-library
envelope and `build-wars:v1` storage key remain unchanged; nested build schema 1 records migrate to
schema 2 with an empty override array.

The current promoted catalog has an important known inconsistency: it contains eight raw title keys,
which become seven canonical keys after mapping `title:title-sunspear-rank` to
`title:sunspear-rank`, but the Sunspear alias group declares `0–10`, `0–12`, and `0–15` domains. The
sprint must not hide or guess through this conflict. With no override, each progression keeps its own
declared maximum, preserving current default-max behavior. An explicit Sunspear override is limited
to the common supported integer domain and projected to every alias member; selected affected skills
retain a narrow deterministic metadata warning. Reset removes the override and restores each
progression's implicit maximum. Empty intersections, missing rows, or incompatible same-key series
remain unresolved rather than being interpolated or clamped silently.

The existing three-PvE-only-skill limit remains owned by `src/domain/rules/skill-bar.ts`. This sprint
replaces broad EPIC-15 deferral warnings with resolved title-rank behavior and narrow metadata or
allegiance warnings; it does not redesign PvE-only counting, infer account ownership, or model
Kurzick/Luxon account state.

This sprint does not add title acquisition, reputation farming, account profiles, campaign unlocks,
party title state, backend sync, title-specific remote fetches, copied source prose, a broad title
catalog, runtime icon media, equipment-template semantics, or title data in skill-template/share URL
payloads. Non-default title overrides remain local-only and receive the same honest omission
treatment as authored equipment in template export and sharing surfaces.

## Use Cases

1. **Use implicit maxima**: A new or migrated build has no title-rank overrides, yet every supported
   title-scaled skill renders using its progression's declared maximum rank.
2. **Discover relevant controls**: Selecting one or more title-scaled skills reveals only the
   canonical title controls needed by the current skill bar, ordered by first slot use.
3. **Configure before selection**: A user can open an unobtrusive all-title disclosure and adjust a
   discovered title rank before adding a corresponding skill.
4. **Enter an exact rank**: A user can decrement, increment, or directly enter an integer within the
   catalog-derived supported domain using keyboard, pointer, or assistive technology.
5. **Return to default**: Resetting a title removes its authored override instead of persisting a
   redundant maximum value.
6. **Update every display**: Lowering a title rank updates the skill browser row, skill-bar slot,
   pinned tooltip, description values, and progression label from the same resolved context.
7. **Handle aliases once**: Skills using either known Sunspear key form share one control and one
   stored override while retaining raw-key projection for tooltip rendering.
8. **Survive catalog uncertainty**: Missing keys, invalid domains, row gaps, conflicting alias
   domains, and unsupported title-classified skills produce bounded structured warnings without
   crashing or fabricating values.
9. **Keep allegiance narrow**: Allegiance-ranked skills use the configured/default rank and show one
   focused side-semantics warning; the editor does not pretend to know Kurzick/Luxon ownership.
10. **Preserve PvE rules**: Three PvE-only skills remain permitted in PvE, the fourth remains a
    deterministic error, and PvE-only skills remain mode-restricted in PvP.
11. **Persist locally**: Working-draft autosave, named saves, loading, duplication, backup, restore,
    and hydration preserve only bounded non-default overrides.
12. **Share honestly**: Skill-template import/export and share URLs keep their existing format and
    behavior, while surfaces disclose that non-default title ranks are omitted.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Authored state | Per-build canonical title-rank override array, build schema v2, implicit maximum semantics, reset-by-removal, structural bounds, nested migration, cloning, and fingerprints. | Account title ownership, global profile defaults, per-account synchronization, party-wide title state, or storing full catalog definitions. |
| Title metadata | Pure discovery from EPIC-04 progression series, exact alias registry, stable labels, declared/common domains, row-coverage analysis, deterministic ordering, and structured conflicts. | Separate title ingestion, runtime wiki reads, title history, acquisition data, reputation thresholds, or source-prose copies. |
| Rendering | One rank projection for tooltips and skill displays, current/max labels, alias-aware progression labels, and structured unresolved outcomes. | HTML generated from source text, runtime interpolation, guessed rows, combat simulation, or guide rendering. |
| Editor UI | Compact relevant-title controls, optional all-title disclosure, integer input, step buttons, reset, responsive layout, focus behavior, and inline issues. | Slider-only controls, dashboard-style title tracking, profile management, or a separate route. |
| Validation | Resolved title dependency checks, override diagnostics, metadata/allegiance warnings, rule-engine version bump, and regressions for existing PvE-only/mode rules. | Unlock legality, title acquisition eligibility, side ownership enforcement, party legality, or a second validator. |
| Compatibility | Local-library migration, save/load/duplicate/backup/restore, skill-template omission messaging, equipment coexistence, and existing browser filtering. | Changing skill-template bytes, adding title ranks to share fragments, equipment share payloads, or changing PvE browser classification semantics. |

### Binding Decisions

1. `Build` owns `titleRankOverrides` because title ranks affect the semantic output of one character.
   They are not transient panel state and must not live only in React or workspace UI state.
2. Add `BUILD_SCHEMA_VERSION = 2`. The outer local-library envelope remains schema 1 and the storage
   key remains `build-wars:v1`; only the nested build contract migrates.
3. Persist overrides as a sorted array of `{ key, rank }`, not a string-keyed object. Arrays make
   duplicate detection, bounds, deterministic serialization, and prototype-safety explicit.
4. Empty override state is the normal default. Setting a rank equal to the canonical implicit
   maximum removes the entry; reset always removes it.
5. `src/domain/title-rank.ts` is the single owner of title key grammar, exact aliases, labels,
   definition discovery, domain analysis, override normalization, per-skill rank projection, and
   resolution diagnostics.
6. Alias handling is conservative and explicit. Only reviewed exact aliases are collapsed. Unknown
   keys are normalized syntactically but are not merged by fuzzy matching, suffix similarity, or
   display label.
7. A canonical control's editable domain is the intersection of the valid integer domains and
   exact row coverage of all series in its alias group. No runtime interpolation or nearest-row
   lookup is introduced.
8. For a coherent definition, implicit maximum is the canonical domain maximum. For a conflicting
   alias group, empty state resolves each series at its own declared maximum; an explicit override
   uses a rank in the common domain for every member. The control says `Max (metadata varies)` until
   overridden and validation remains unresolved for affected selected skills.
9. Invalid, empty, inverted, non-integer, unsafe, or row-incomplete domains never yield enabled
   controls. They produce structured diagnostics and preserve the rest of the editor.
10. Generated skill JSON remains imported only through `src/app/catalogs.ts`. The app catalog
    adapter derives one reusable `TitleRankCatalog` view at load time; leaf components receive view
    models and never scan or import generated data.
11. Reducers remain catalog-independent. A title-rank action carries a domain definition produced by
    selectors, and the pure mutation helper verifies the canonical key and clamps to that supplied
    domain. Domain validation independently checks the result against current catalog facts.
12. The title panel lives between the skill bar and skill browser inside the Skills workspace tab.
    It does not compete with profession, attribute, equipment, library, or validation panels.
13. Relevant controls are ordered by first selected skill-bar slot, then label and key. The optional
    all-title list uses label and key ordering. Changing skills changes visibility only; it never
    deletes authored overrides.
14. The current generic `skill.title-deferred` and `skill.allegiance-deferred` codes stop being
    emitted. Stable replacement codes describe missing metadata, ambiguous metadata, unresolved
    ranks, invalid overrides, and allegiance-side uncertainty.
15. `RULE_ENGINE_VERSION` advances to `rule-engine:v3` because resolved/unresolved outcomes and issue
    codes change. Existing PvE-only rule limits, severities, slot locations, and order remain fixed.
16. Allegiance is rank-first. `title:allegiance-rank` gets one rank control; selected allegiance
    skills receive one narrow warning that side/exclusivity is not modeled. No side selector is
    added without structured catalog evidence.
17. Title overrides do not enter skill-template bytes, exact-source fingerprints, canonical
    template projections, or share URL payloads. Non-empty overrides trigger explicit omission and
    replacement warnings through existing template/share surfaces.
18. Equipment-adjusted attribute ranks and title ranks remain separate inputs. Title projection must
    not alter authored attributes, effective attribute calculations, equipment summaries, or weapon
    requirement analysis.

### Authored Contract

The preferred domain shape is:

```text
BUILD_SCHEMA_VERSION = 2

TitleRankOverride
  key: canonical title key
  rank: safe integer

Build
  schemaVersion: 2
  ...existing fields
  titleRankOverrides: readonly TitleRankOverride[]
  equipment: EquipmentLoadout | null
```

The array is bounded to the number of catalog-discovered canonical definitions, with a hard parser
cap of 32 entries for untrusted persisted input. Entries are sorted by canonical key, keys match a
bounded `title:<slug>` grammar, ranks are safe integers, and duplicate canonical keys are rejected.
No title label, alias list, min/max domain, progression row, catalog record, or provenance object is
stored in the build.

Mutation semantics are exact:

```text
setTitleRankOverride(build, definition, inputRank)
  reject malformed key/domain/input
  clamp integer input to definition.editableDomain
  remove existing override when clamped rank equals definition.defaultOverrideRank
  otherwise replace-or-insert one canonical entry and sort by key

resetTitleRankOverride(build, canonicalKey)
  remove the matching entry
  return original object for a missing key
```

Direct-entry draft text stays local to `TitleRankPanel`; blank, decimal, exponential, malformed, or
unsafe text does not enter `Build`. Enter or blur commits a valid integer through the mutation path,
or restores the last resolved value and announces the rejection. Increment and decrement buttons use
the same path and disable at their bounds.

### Title Definition and Resolution Contract

`createTitleRankCatalog(progressionSeries)` returns immutable definitions, indexes, and diagnostics.
Exact TypeScript names may adapt to local style, but the distinctions are required:

```text
TitleRankCatalog
  definitions: readonly TitleRankDefinition[]
  byCanonicalKey: ReadonlyMap<string, TitleRankDefinition>
  canonicalKeyByRawKey: ReadonlyMap<string, string>
  diagnostics: readonly TitleRankCatalogDiagnostic[]

TitleRankDefinition
  key: canonical authored key
  label: Build Wars-authored label
  rawKeys: readonly string[]
  seriesIds: readonly string[]
  declaredDomains: readonly RankDomain[]
  editableDomain: RankDomain | null
  defaultOverrideRank: number | null
  status: coherent | domain-conflict | unsupported

TitleRankResolution
  canonicalKey
  effectiveKind: implicit-max | override | unresolved
  authoredRank: number | null
  rawRanks: ReadonlyMap<string, number>
  diagnostics: readonly TitleRankResolutionDiagnostic[]
```

Discovery walks the promoted progression series once. A candidate must have dependency kind
`title-rank`, a valid bounded key, a finite safe-integer `rankDomain`, and one exact value row for
each editable integer. Duplicate series IDs, duplicate row ranks, missing value slots, non-finite
values, or missing rows become diagnostics; source array order never determines a winner.

Known labels are a tiny presentation registry (`Allegiance`, `Asura`, `Deldrimor`, `Ebon Vanguard`,
`Lightbringer`, `Norn`, and `Sunspear`). Unknown valid keys receive a deterministic title-cased slug
label and remain separate. Labels do not establish identity.

For a requested skill, resolution follows its `progressionSeriesIds`, not every title series in the
catalog. An implicit resolution supplies each referenced raw key at that series's maximum. An
explicit override supplies the canonical authored rank to every referenced alias only when that rank
has an exact row in every referenced series. If two series on one skill require the same raw key at
different implicit maxima, if a required series ID is absent, or if the override has no exact row,
the affected dependency is unresolved. The renderer receives no fabricated fallback for it.

The app catalog adapter computes this catalog once and exposes it beside existing skill views. Domain
validation invokes the same pure constructor from the caller-supplied `SkillValidationCatalog`, so a
forged app view cannot suppress catalog-integrity warnings.

### Persistence and Migration

`LocalLibraryEnvelopeV1` remains the durable outer shape. `validateBuild` accepts nested build schema
1 and 2:

- Schema 1 requires the existing fields, reconstructs schema 2 with `titleRankOverrides: []`, and
  emits at most one bounded informational migration diagnostic per snapshot.
- Schema 2 requires a dense override array. Malformed keys, duplicate keys, non-safe-integer ranks,
  oversized arrays, dangerous keys, or unsupported versions reject the containing snapshot under
  the existing write-blocked/recovery policy.
- Structurally valid but catalog-unknown keys and catalog-out-of-range ranks are retained so catalog
  churn does not erase authored data. Resolution clamps only the effective display value and emits a
  located warning; the UI offers reset. It does not silently rewrite persisted bytes during read.
- Snapshot creation and `cloneBuild` deep-copy the override entries. Stable JSON serialization and
  snapshot fingerprints therefore observe rank changes automatically.
- Hydration resets only ephemeral input text and disclosure state. Working drafts, saved records,
  duplication, backup/restore merge and replace, record loading, and save-as-new retain overrides.

The first successful user-authored write after a schema-1 hydration persists schema 2 through the
existing single write path. Merely opening a valid schema-1 library must not mark the editor dirty or
force an immediate write. Backup preview reports unsupported nested versions using bounded paths.

### Editor and Selector Composition

`selectTitleRankPanelView` receives `EditorState`, the derived `TitleRankCatalog`, and the current
validation result. It returns component-ready rows with canonical key, label, display value,
editable min/max, implicit/override/conflict status, reset availability, relevant skill-slot
references, and inline issues.

The Skills tab becomes:

```text
SkillBar
TitleRankPanel
  relevant title controls
  optional All title ranks disclosure
SkillBrowser
```

When no selected skill uses a title and no override exists, the panel renders a compact disclosure
summary rather than a grid. When relevant titles exist, their controls are visible without opening
the all-title disclosure. The expanded list excludes duplicates already shown in the relevant list.
An override that becomes irrelevant remains available in the expanded list and is not discarded.

Each row uses a labeled native `input type="number"` with `step="1"`, catalog-derived `min` and
`max`, adjacent decrement/increment buttons, and an independently labeled reset button. Current and
maximum values are exposed in visible text and `aria-describedby`; error/warning text uses stable IDs.
The panel announces committed changes and rejected text through the existing live-region message
path. Long labels wrap, controls remain at least touch-target sized, and the row collapses without
horizontal scrolling at the existing narrow breakpoint.

### Tooltip and Skill Display Integration

`selectSkillDisplay` builds one rank context containing:

- equipment-adjusted effective attribute ranks from the existing calculation;
- raw title keys projected from the canonical override state for that exact skill; and
- structured unresolved detail when title metadata cannot produce an exact rank.

Title ranks never overwrite `attribute:<id>` keys. The bridge to `SkillTooltipContext.ranks` uses a
null-prototype object or explicit safe copy from `Map`; no catalog key is assigned to an ordinary
prototype-bearing object.

`renderSkillTooltipText` retains exact-row lookup and structured-only descriptions. It does not add
interpolation, nearest-rank selection, source prose, or fallback arithmetic. Selector output adds
small title facts such as `Sunspear 8/10`, `Sunspear Max`, or `Sunspear Max (metadata varies)`.
`SkillDisplay` renders the same facts on list/bar/tooltip surfaces at a density appropriate to each
surface. Progression disclosure labels use the canonical user-facing title and effective rank,
replacing `maximum-title-rank assumption` text. The Assumptions section remains available for
equipment uncertainty but contains no maximum-title assumption when title resolution succeeds.

Browser results use the current build rank even when a skill is not selected, so previewing a skill
matches the value it will show after placement. The precomputed title catalog prevents a full
progression scan per browser row.

### Validation and PvE-only Rules

`createBuildValidationContext` derives canonical title definitions and normalizes authored overrides
before skill rules run. Validation adds a `title-rank` location keyed by canonical title so panel rows
can display authored-state issues, while skill metadata problems remain located at the affected
skill slot.

Required replacement outcomes include:

| Condition | Outcome |
| --- | --- |
| Valid implicit maximum or valid override with complete exact rows | No generic title warning; dependency is resolved. |
| Title-classified selected skill with no title progression dependency | `skill.title-metadata-missing` warning. |
| Missing series, null/invalid key or domain, duplicate/incomplete rows, or no common domain | `skill.title-rank-unresolved` warning with skill and series/key entities. |
| Conflicting declared domains or aliases with a usable common domain | `skill.title-metadata-ambiguous` warning; safe output may render, but validation stays unresolved. |
| Duplicate, unknown, malformed, or current-domain-out-of-range authored override | Located `title-rank.override-*` warning; other titles remain usable. |
| Selected `title:allegiance-rank` dependency | Rank resolves normally plus one `skill.allegiance-side-unresolved` warning per affected slot. |
| PvE bar with exactly three PvE-only skills | No limit issue. |
| PvE bar with four or more PvE-only skills | Existing `skill.pve-only-limit` error on fourth and later qualifying slots, unchanged. |
| PvE-only title skill in PvP or unknown mode | Existing `skill.mode-restricted` or `skill.mode-unknown` behavior, plus title metadata issues only when independently applicable. |

Remove the deferred codes from emitted rule paths and unresolved-code accounting after replacement
tests exist. Keep deterministic rule and issue ordering: context/catalog integrity, authored title
overrides, skill-bar limits, skill eligibility/mode, title dependency resolution, then equipment.
Increase `RULE_ENGINE_VERSION` to v3 and update freshness expectations without treating a version
change alone as invalidity.

No title rule changes `isPveOnlySkill`, the three-skill constant, fourth-slot selection semantics,
browser availability predicates, or PvE/PvP split resolution. Any discovered PvE regression is fixed
at its existing owner and receives a focused test; it is not folded into title-rank logic.

### Template, Sharing, and Equipment Boundaries

Skill templates cannot encode title ranks. A non-empty override array is therefore meaningful
local-only state:

- export dialogs state that exact-source and canonical skill-template outputs omit title overrides;
- share controls state that URL/template text recipients will use implicit maximum title ranks;
- importing a skill template over a draft names title overrides among discarded local-only fields
  and uses the existing dirty guard;
- a template or share URL imported into a blank draft starts with an empty override array;
- title-rank edits do not change raw template overlays or exact-source semantic fingerprints.

These warnings compose with existing equipment omission warnings without duplicate banners or
unbounded prose. They do not disable template export or sharing.

`Build.equipment` remains unchanged and nullable. Title rank projection is merged with, but never
derived from, equipment-adjusted attribute ranks. Saving, cloning, migrating, and fingerprinting a
build must preserve both structures independently.

### Cross-Phase Invariants

- Empty title override state always means implicit maximum; it never means rank zero or unknown.
- Only non-default canonical overrides are persisted.
- A selected-skill change never deletes an override.
- A reset removes state and restores catalog-derived behavior.
- Raw and canonical keys are never mixed in authored state.
- No fuzzy aliasing or label-based identity is permitted.
- No rank is interpolated, rounded, or resolved to a nearest progression row.
- Metadata conflicts remain visible even when a safe value can render.
- No generated record, progression row, label map, or domain is copied into `Build` or local storage.
- No generated JSON is imported outside `src/app/catalogs.ts`.
- No title edit changes equipment, raw template overlays, skill-template bytes, or share fragments.
- No title rule changes PvE-only counting or browser availability behavior.
- No user-visible phase is complete before persistence, migration, and omission messaging pass.
- `src/domain` remains framework-neutral and free of app, React, browser, generated-data, and network
  imports.

## Implementation

### Phase 1: BW-1501 Title Metadata, Aliases, and Resolution Foundation (~18%)

**Files:**

- `src/domain/title-rank.ts` - create
- `src/domain/index.ts`
- `src/app/catalogs.ts`
- `src/app/catalogs.test.ts`
- `src/app/catalog-boundary.test.ts`
- `test/domain/title-rank.test.ts` - create
- `test/domain/skill-catalog.test.ts`
- `data/generated/epic-04/skills.catalog.json` - read-only verification input

**Tasks:**

- [ ] Mark SPRINT-016 and BW-1501 in progress and confirm EPIC-04, EPIC-06, EPIC-08, and EPIC-09
      remain completed dependencies.
- [ ] Add canonical title key, override, domain, definition, catalog, resolution, and diagnostic
      contracts in a framework-neutral module.
- [ ] Implement bounded `title:<slug>` validation, deterministic labels, and one exact reviewed alias
      from `title:title-sunspear-rank` to `title:sunspear-rank`.
- [ ] Discover definitions from every title-rank progression series without relying on source order;
      validate unique series IDs, safe integer domains, value slots, row ranks, and finite row values.
- [ ] Compute exact row coverage and common editable domains. Represent domain disagreement,
      duplicate ranks, missing rows, missing keys, empty intersections, and unsupported series as
      typed diagnostics.
- [ ] Encode the observed promoted-catalog baseline in tests: eight raw keys, seven canonical keys,
      and a Sunspear domain conflict spanning `0–10`, `0–12`, and `0–15`.
- [ ] Implement per-skill resolution so empty overrides use each referenced series maximum and valid
      explicit overrides project one canonical rank to every raw alias.
- [ ] Prove an override never produces a rank without an exact progression row and that unresolved
      metadata never receives a guessed fallback.
- [ ] Derive one reusable title catalog during `src/app/catalogs.ts` adaptation without widening the
      generated import allowlist or making catalog conflicts fatal to unrelated editor features.
- [ ] Add boundary tests proving leaf app/domain modules do not import generated JSON, manifests,
      QA reports, source snapshots, or title-specific data files.
- [ ] Keep BW-1501 in progress until Phase 2 persistence gates also pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/title-rank.test.ts test/domain/skill-catalog.test.ts src/app/catalogs.test.ts src/app/catalog-boundary.test.ts
```

### Phase 2: BW-1501 Build Schema, Reducer, and Durable Migration (~16%)

**Files:**

- `src/domain/build.ts`
- `src/domain/index.ts`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/backup-restore.test.ts`
- `src/app/workspace-state.test.ts`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/editor-fixtures.ts`
- `src/app/library-fixtures.ts`
- `test/fixtures/foundation.ts`

**Tasks:**

- [ ] Add `BUILD_SCHEMA_VERSION = 2` and required sorted `Build.titleRankOverrides`; update blank
      build and shared fixtures to use schema 2 with an empty array.
- [ ] Add typed set/reset actions and pure immutable mutation helpers with integer/domain checks,
      clamping, reset-by-removal, redundant-max removal, deterministic sorting, and semantic no-op
      identity preservation.
- [ ] Ensure skill placement/removal, profession/mode/attribute changes, equipment edits, and browser
      actions preserve title overrides.
- [ ] Extend the persisted build parser with a bounded schema-1-to-schema-2 migration and strict
      schema-2 override parsing; keep the outer envelope version and storage key unchanged.
- [ ] Bound arrays, key and diagnostic lengths, reject duplicates and dangerous structures, retain
      structurally valid unknown keys, and avoid consulting generated catalogs inside persistence.
- [ ] Deep-clone overrides in snapshots and saved records and prove fingerprint/dirty-state changes
      occur only for semantic override changes.
- [ ] Cover working draft hydration, named save/load, update, save-as-new, duplication, backup export,
      restore merge/replace, and old records with no title state.
- [ ] Prove read-time migration alone does not dirty or overwrite a valid schema-1 library and the
      next authorized write serializes canonical schema 2.
- [ ] Ensure template/share imports start with empty overrides and replacing a dirty draft remains
      behind the existing confirmation boundary.
- [ ] Mark BW-1501 done only after domain, reducer, migration, local-library, backup, and workspace
      gates pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/editor-state.test.ts src/app/persistence-schema.test.ts src/app/local-storage.test.ts src/app/backup-restore.test.ts src/app/workspace-state.test.ts src/app/template-workflow.test.ts test/domain/contracts.test.ts
```

### Phase 3: BW-1502 Compact Relevant and All-Title Controls (~16%)

**Files:**

- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/components/TitleRankPanel.tsx` - create
- `src/app/title-rank-panel.test.tsx` - create
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Begin BW-1502 only after BW-1501 is done.
- [ ] Add a selector-owned title panel view with relevant rows, remaining all-title rows, effective
      status, editable bounds, override/reset state, slot references, and inline validation issues.
- [ ] Resolve selected skill dependencies through current mode variants where unambiguous; include a
      deterministic union with diagnostics when mode is unknown rather than hiding a needed control.
- [ ] Order relevant definitions by first skill-bar use and stable label/key tie-breakers; order the
      expanded remainder by label/key and retain irrelevant authored overrides there.
- [ ] Compose `TitleRankPanel` between `SkillBar` and `SkillBrowser` in the Skills tab. Keep the
      no-relevant-title state compact and the all-title list behind an accessible native disclosure.
- [ ] Implement native integer input plus labeled decrement, increment, and reset controls. Keep
      malformed draft text local, commit on Enter/blur, restore rejected text, and announce results.
- [ ] Render coherent ranks as `current / max`, implicit coherent state as `max / max`, and
      conflicting implicit state as `Max (metadata varies)` with its common editable range.
- [ ] Connect row issues through `aria-describedby`, preserve a logical focus order, expose button
      disabled states, and avoid color-only status.
- [ ] Add responsive styles for wrapped labels, touch targets, one-column narrow layout, and no
      horizontal overflow.
- [ ] Test no-title, one-title, multiple-title, duplicate alias, irrelevant override, expanded view,
      min/max, direct entry, malformed text, keyboard commit, increment/decrement, reset, and focus
      behavior.
- [ ] Prove opening/closing the disclosure and viewing the panel do not materialize state or dirty
      the draft.
- [ ] Mark BW-1502 done after selector, component, app composition, and accessibility gates pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- src/app/editor-selectors.test.ts src/app/title-rank-panel.test.tsx src/app/App.test.tsx
```

### Phase 4: BW-1503 Tooltip and Skill Display Integration (~16%)

**Files:**

- `src/domain/skill-tooltip.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/components/SkillDisplay.tsx`
- `src/app/components/SkillTooltip.tsx`
- `src/app/skill-display.test.tsx`
- `src/app/skill-bar.test.tsx`
- `src/app/skill-browser.test.tsx`
- `test/domain/title-rank.test.ts`
- `test/domain/skill-catalog.test.ts`

**Tasks:**

- [ ] Begin BW-1503 only after BW-1502 passes.
- [ ] Replace selector-local maximum-title assumptions with the shared per-skill title resolver and
      merge its raw-key output with existing effective attribute ranks without key collision.
- [ ] Bridge raw rank maps to tooltip context with prototype-safe construction and no unbounded
      catalog-controlled property assignment.
- [ ] Keep `renderSkillTooltipText` on exact progression rows and improve structured unresolved detail
      only where needed to distinguish missing title key, missing rank, and unsupported progression.
- [ ] Add canonical title facts and effective rank status to `SkillDisplayView`; render concise facts
      consistently in browser list, skill-bar slot, and tooltip densities.
- [ ] Replace maximum-title-assumption progression labels with canonical label and effective/default
      rank copy. Preserve equipment uncertainty assumptions independently.
- [ ] Prove default-max, lowered rank, reset, alias projection, missing series, row gap, conflicting
      metadata, unknown mode, and structured-only descriptions render deterministically.
- [ ] Prove a rank edit updates an open/pinned tooltip and every visible occurrence of each affected
      skill without moving focus, changing slot selection, or altering browser filters.
- [ ] Add regression coverage for tooltips that combine equipment-adjusted attribute progressions
      and title progressions without one rank source overwriting the other.
- [ ] Check browser-list performance uses the precomputed title catalog and does not rescan the full
      progression array for every row.
- [ ] Mark BW-1503 done after domain tooltip, selector, skill display, skill bar, and browser gates
      pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/title-rank.test.ts test/domain/skill-catalog.test.ts src/app/editor-selectors.test.ts src/app/skill-display.test.tsx src/app/skill-bar.test.tsx src/app/skill-browser.test.tsx
```

### Phase 5: BW-1504 Title Validation and PvE-only Regression Lock (~18%)

**Files:**

- `src/domain/validation-context.ts`
- `src/domain/validation.ts`
- `src/domain/rule-engine.ts`
- `src/domain/rules/skill-eligibility.ts`
- `src/domain/rules/skill-bar.ts` - regression owner; change only for a proven defect
- `src/domain/index.ts`
- `test/domain/validation-context.test.ts`
- `test/domain/skill-eligibility-rules.test.ts`
- `test/domain/skill-bar-rules.test.ts`
- `test/domain/rule-engine.test.ts`
- `test/domain/rule-engine-contracts.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/components/ValidationPanel.tsx`
- `src/app/components/TitleRankPanel.tsx`

**Tasks:**

- [ ] Begin BW-1504 only after BW-1503 passes.
- [ ] Extend validation context with independently derived title definitions, normalized authored
      overrides, per-skill title resolutions, bounded diagnostics, and catalog integrity facts.
- [ ] Add a `title-rank` validation location and deterministic related entities for canonical keys,
      raw keys, progression series, skills, and skill slots; update location comparison and sorting.
- [ ] Replace emitted `skill.title-deferred` and `skill.allegiance-deferred` issues with narrow stable
      issue codes for missing/ambiguous metadata, unresolved dependencies, authored override
      problems, and allegiance-side uncertainty.
- [ ] Suppress generic title warnings only when every referenced dependency has an exact implicit or
      explicit rank resolution. A rendered safe value must not suppress an independent metadata
      conflict warning.
- [ ] Treat title-classified skills with no title progression key as missing metadata rather than
      resolved rank-zero skills.
- [ ] Resolve allegiance ranks through the normal title path, emit one focused side-semantics warning
      per selected affected slot, and add no side selector or name-based side inference.
- [ ] Advance the engine to `rule-engine:v3`, update unresolved-code and rule ordering, and prove issue
      ordering is independent of progression, override, and skill catalog input order.
- [ ] Lock the PvE-only contract: exactly three allowed, fourth and later flagged in slot order,
      duplicate uncertainty unchanged, PvP restriction unchanged, unknown-mode warning unchanged,
      and title resolution unable to change the count.
- [ ] Lock browser default/explicit availability filtering for title-classified, PvE-only, PvP-only,
      both, and unknown records without adding a title-specific filter path.
- [ ] Surface title-row issues inline while preserving skill-slot issues and global catalog issues in
      their existing places.
- [ ] Mark BW-1504 done after context, issue contract, deterministic ordering, allegiance, browser,
      and PvE-only regression gates pass.

**Verification:**

```sh
npm run typecheck
npm run test:run -- test/domain/validation-context.test.ts test/domain/skill-eligibility-rules.test.ts test/domain/skill-bar-rules.test.ts test/domain/rule-engine.test.ts test/domain/rule-engine-contracts.test.ts src/app/editor-selectors.test.ts src/app/skill-browser.test.tsx src/app/title-rank-panel.test.tsx
```

### Phase 6: BW-1505 Compatibility, Documentation, and Closeout (~16%)

**Files:**

- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/components/ShareControls.tsx`
- `src/app/template-dialogs.test.tsx`
- `src/app/share-url.test.ts`
- `src/app/App.test.tsx`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/backup-restore.test.ts`
- `src/app/workspace-state.test.ts`
- `README.md`
- `compendium/skills-catalog.md`
- `compendium/game-rule-engine.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/title-ranks-and-pve-only.md` - create
- `work/tickets/15-title-tracks-and-pve-only/EPIC.md`
- `work/tickets/15-title-tracks-and-pve-only/BW-1501-title-rank-state-and-defaults.md`
- `work/tickets/15-title-tracks-and-pve-only/BW-1502-title-rank-controls.md`
- `work/tickets/15-title-tracks-and-pve-only/BW-1503-title-tooltip-and-display-integration.md`
- `work/tickets/15-title-tracks-and-pve-only/BW-1504-title-validation-and-pve-only-cleanup.md`
- `work/tickets/15-title-tracks-and-pve-only/BW-1505-title-rank-docs-and-closeout.md`
- `work/sprints/SPRINT-016.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-15-result.json`

**Tasks:**

- [ ] Begin BW-1505 only after BW-1502, BW-1503, and BW-1504 are done.
- [ ] Add one composed local-only warning for non-empty title overrides to export and share surfaces;
      state that recipients fall back to implicit maximum ranks.
- [ ] Extend import replacement copy to name title overrides alongside authored equipment and retain
      the existing dirty guard, exact-source fidelity, canonical projection, and URL length policy.
- [ ] Prove title edits do not change template bytes, raw overlays, exact-source fingerprints, share
      fragments, equipment, or catalog freshness except for the intentional rule-engine version.
- [ ] Run persistence, local-storage, workspace, duplication, backup/restore, template, share URL,
      equipment, and app regressions together with title coverage.
- [ ] Test small viewport layout, long labels, focus order, live announcements, number input behavior,
      no-title compact state, conflict messaging, and inline issue associations.
- [ ] Document implicit per-series maximums, override-only storage, exact alias policy, common-domain
      behavior, reset semantics, schema migration, validation codes, PvE-only invariants, local-only
      sharing, and the current Sunspear metadata conflict.
- [ ] Explicitly defer account ownership, title acquisition, reputation thresholds, broad title
      ingestion, allegiance side state, party titles, backend sync, runtime source fetches, copied
      prose, and share-payload expansion.
- [ ] Run the focused regression gates, then `npm run verify`; record exact commands and results in
      ticket and sprint closeout.
- [ ] Mark BW-1505, EPIC-15, and SPRINT-016 done only when all Definition of Done items pass.
- [ ] Synchronize ticket metadata, the sprint ledger, and the result manifest to the same ticket
      list, status, assumptions, verification result, and no-commit execution boundary.

**Verification:**

```sh
npm run test:run -- src/app test/domain
npm run verify
git diff --check
```

## Files Summary

| File | Change |
| --- | --- |
| `src/domain/title-rank.ts` | Create the canonical title definition, alias, domain analysis, override mutation, and per-skill resolution authority. |
| `src/domain/build.ts` | Advance the semantic build contract to schema 2 and add bounded canonical title-rank overrides. |
| `src/domain/skill-tooltip.ts` | Preserve exact-row rendering while exposing precise unresolved title progression outcomes where needed. |
| `src/domain/validation-context.ts` | Build title catalog/override/skill resolution context from untrusted validation input. |
| `src/domain/validation.ts` | Add title issue codes, locations, ordering, unresolved accounting, and rule-engine v3 facts. |
| `src/domain/rules/skill-eligibility.ts` | Replace broad title/allegiance deferrals with resolved dependency and narrow uncertainty rules. |
| `src/domain/rules/skill-bar.ts` | Preserve the existing three-PvE-only-skill rule; modify only if regression tests prove a defect. |
| `src/domain/rule-engine.ts` | Compose title validation in the existing single validation result. |
| `src/domain/index.ts` | Export the new build/title/validation public contracts. |
| `src/app/catalogs.ts` | Derive and expose one reusable title catalog while retaining the generated import boundary. |
| `src/app/editor-state.ts` | Add catalog-independent set/reset actions and build override mutation wiring. |
| `src/app/editor-selectors.ts` | Build title panel rows, rank contexts, display facts, inline issue groups, and omission state. |
| `src/app/persistence-schema.ts` | Parse build schema 2, migrate schema 1, bound override arrays, clone entries, and preserve deterministic fingerprints. |
| `src/app/template-workflow.ts` | Keep title ranks outside skill-template projection and expose local-only omission/replacement facts. |
| `src/app/components/TitleRankPanel.tsx` | Create accessible relevant/all-title integer controls and conflict/unresolved states. |
| `src/app/components/SkillDisplay.tsx` | Render concise canonical title-rank facts on applicable skill surfaces. |
| `src/app/components/SkillTooltip.tsx` | Show effective title labels/ranks and remove resolved maximum-rank assumption copy. |
| `src/app/components/ValidationPanel.tsx` | Preserve global validation while supporting new title locations and engine facts where needed. |
| `src/app/components/TemplateDialogs.tsx` | Disclose title override omission and import replacement. |
| `src/app/components/ShareControls.tsx` | Disclose that shared skill templates fall back to implicit title maxima. |
| `src/app/App.tsx` | Compose the title panel within the Skills workspace and pass existing dispatch/validation inputs. |
| `src/app/styles.css` | Add compact, responsive, accessible title-control layouts and status styles. |
| `test/domain/title-rank.test.ts` | Cover catalog discovery, aliases, domains, exact rows, default maxima, overrides, conflicts, and input-order determinism. |
| `test/domain/skill-eligibility-rules.test.ts` | Cover resolved title dependencies, metadata failures, and allegiance-side warnings. |
| `test/domain/skill-bar-rules.test.ts` | Lock exactly-three/fourth-and-later PvE-only behavior. |
| `test/domain/validation-context.test.ts` | Cover untrusted override normalization and title context construction. |
| `test/domain/rule-engine.test.ts` | Cover combined title, mode, PvE-only, attribute, and equipment outcomes. |
| `test/domain/rule-engine-contracts.test.ts` | Lock new codes, locations, order, result flags, and rule-engine v3. |
| `src/app/title-rank-panel.test.tsx` | Cover relevant/all views, integer editing, reset, accessibility, conflict states, and no-op viewing. |
| `src/app/editor-state.test.ts` | Cover immutable override mutation, clamping, sorting, removal, and unrelated-state preservation. |
| `src/app/editor-selectors.test.ts` | Cover panel ordering, per-skill projection, display facts, assumptions, issues, and equipment coexistence. |
| `src/app/skill-display.test.tsx` | Cover title facts across compact/full rendering without remote media. |
| `src/app/skill-bar.test.tsx` | Cover selected-skill title updates and slot interaction regressions. |
| `src/app/skill-browser.test.tsx` | Cover preview rank consistency and unchanged availability filtering. |
| `src/app/persistence-schema.test.ts` | Cover schema migration, structural bounds, unknown keys, malformed ranks, cloning, and fingerprints. |
| `src/app/local-storage.test.ts` | Cover migrated and schema-2 working drafts through the existing storage port. |
| `src/app/backup-restore.test.ts` | Cover title overrides in backup preview, merge, replace, and rejection paths. |
| `src/app/workspace-state.test.ts` | Cover autosave dirtiness, save/load, duplicate, association, and migration behavior. |
| `src/app/template-workflow.test.ts` | Prove template fidelity ignores title state and imports reset omitted state deliberately. |
| `src/app/template-dialogs.test.tsx` | Cover composed equipment/title omission and replacement warnings. |
| `src/app/share-url.test.ts` | Prove share grammar/length/round-trip bytes remain unchanged by title state. |
| `src/app/App.test.tsx` | Cover composition, hydration, live updates, responsive states, and cross-workflow regressions. |
| `src/app/editor-fixtures.ts`, `src/app/library-fixtures.ts`, `test/fixtures/foundation.ts` | Move shared build fixtures to schema 2 with explicit empty or focused override state. |
| `README.md` and `compendium/*.md` | Document user behavior, architecture, persistence, validation, sharing limits, and deferred scope. |
| `work/tickets/15-title-tracks-and-pve-only/*.md` | Record phase ownership, acceptance evidence, status, and closeout. |
| `work/sprints/SPRINT-016.md`, `work/sprints/ledger.tsv`, result manifest | Publish and synchronize the approved execution record. |

## Definition of Done

### Title Metadata and State

- [ ] All EPIC-04 title-rank progression dependencies are discovered through one pure helper.
- [ ] Raw keys normalize to stable canonical keys, including the exact Sunspear alias, without fuzzy
      merging.
- [ ] Labels, declared domains, common editable domains, row coverage, and diagnostics are
      deterministic under reordered input.
- [ ] Empty build state renders supported dependencies at implicit per-series maximum ranks.
- [ ] Explicit overrides are safe integers, canonical, bounded, sorted, and limited to exact common
      progression rows.
- [ ] Reset and setting a coherent canonical maximum remove the override.
- [ ] Metadata conflicts, including the promoted Sunspear domain mismatch, stay visible and never
      produce invented rank facts.
- [ ] `Build` schema 2 contains only `{key, rank}` override entries and no catalog-derived records.

### Persistence and Compatibility

- [ ] Build schema 1 migrates to schema 2 with empty overrides while the outer local-library schema
      and storage key remain unchanged.
- [ ] Migration on read does not dirty or eagerly overwrite a valid old library.
- [ ] Malformed, duplicate, unsafe, oversized, and unsupported persisted data follows bounded
      deterministic recovery behavior.
- [ ] Structurally valid stale/unknown overrides remain recoverable and visible.
- [ ] Working-draft autosave, named saves, update, save-as-new, load, duplication, backup, restore,
      hydration, and fingerprints preserve title overrides.
- [ ] Profession, mode, attribute, skill, browser, and equipment edits preserve unrelated title
      state; title edits preserve all unrelated state.
- [ ] Skill-template bytes, raw overlays, exact-source fidelity, share URL format, and share length cap
      are unchanged.
- [ ] Non-default title overrides receive clear local-only omission and import-replacement messaging.

### Controls and Rendering

- [ ] Relevant title controls appear by default in first-skill-slot order.
- [ ] An optional all-title disclosure exposes remaining definitions and irrelevant retained
      overrides without dominating no-title builds.
- [ ] Every enabled control supports decrement, increment, exact integer entry, and reset.
- [ ] Inputs enforce catalog-derived bounds, reject malformed text, and expose label, status, current,
      maximum, and issues to assistive technology.
- [ ] Long labels and all controls remain usable without horizontal scrolling at the supported narrow
      viewport.
- [ ] Default, lowered, reset, aliased, conflicted, and unresolved ranks render consistently in the
      browser, skill bar, skill display, and tooltip.
- [ ] Maximum-title-rank assumption copy is absent for resolved dependencies.
- [ ] Structured unsupported progression remains visible and no runtime interpolation is added.
- [ ] Equipment-adjusted attribute ranks and title ranks coexist without collision or altered
      equipment semantics.

### Validation and PvE-only

- [ ] Resolved default or overridden title dependencies emit no generic title deferral warning.
- [ ] Missing, unsupported, row-incomplete, domain-conflicting, and ambiguous title metadata emit
      deterministic located warnings.
- [ ] Invalid, duplicate, unknown, or out-of-current-domain authored overrides emit deterministic
      title-row warnings without blocking unrelated titles.
- [ ] Title-classified skills without progression keys are not falsely considered resolved.
- [ ] Allegiance rank scaling works and side/exclusivity uncertainty is one narrow visible warning,
      with no inferred ownership or side selector.
- [ ] `skill.title-deferred` and `skill.allegiance-deferred` are no longer emitted.
- [ ] Rule-engine version 3, issue ordering, result flags, freshness facts, and truncation behavior are
      tested.
- [ ] Exactly three PvE-only skills remain allowed in PvE and the fourth/later slots retain the
      existing deterministic limit error.
- [ ] PvP/unknown mode restrictions and browser availability filters remain unchanged.

### Verification and Closeout

- [ ] Focused domain, reducer, selector, component, persistence, workspace, backup, template, share,
      and compatibility suites pass.
- [ ] `npm run test:run -- src/app test/domain` passes.
- [ ] `npm run verify` passes with no network dependency.
- [ ] `git diff --check` passes.
- [ ] README and compendium docs describe default maxima, overrides, aliases, conflicts, reset,
      persistence, validation, PvE-only behavior, sharing omissions, and deferred scope.
- [ ] BW-1501 through BW-1505, EPIC-15, SPRINT-016, the ledger, and the result manifest agree on
      status, scope, assumptions, commands, and outcomes.
- [ ] No implementation commit is created by the ticket-burn executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Sunspear alias members expose incompatible domains and cause false rank claims. | High | High | Preserve per-series implicit maxima, restrict explicit edits to exact common rows, emit a narrow conflict warning, and document the observed signatures. |
| Adding title state outside `Build` would be lost by later party/build composition. | Medium | High | Put semantic overrides in build schema 2 and keep only UI disclosure/input drafts ephemeral. |
| A build schema bump breaks old local libraries or causes eager rewrite. | Medium | High | Keep the outer envelope stable, perform a tested nested v1-to-v2 migration, hydrate cleanly, and serialize v2 only on an authorized write. |
| String-keyed title state introduces prototype or duplicate-key hazards. | Low | High | Persist bounded arrays, reject dangerous keys recursively, validate exact key grammar, reconstruct entries, and bridge through `Map`/null-prototype objects. |
| App selectors and validation normalize aliases differently. | Medium | High | Use the same framework-neutral constructor/resolver in both paths; validation independently derives from caller-supplied series. |
| Default-max behavior changes accidentally while adding one canonical control. | Medium | High | Define empty state as per-series maximum, test raw-key projections, and make reset restore empty state exactly. |
| Clamping hides stale or corrupt persisted values. | Medium | Medium | Retain structurally valid authored values, clamp only effective display resolution with a warning, and provide explicit reset. |
| Browser rendering repeatedly scans thousands of progression records. | Medium | Medium | Precompute the title catalog once at app catalog adaptation and use indexed series/definition lookups. |
| Title validation changes the existing PvE-only count or mode results. | Low | High | Keep rule ownership separate and lock exactly-three, fourth-and-later, PvP, unknown-mode, and ordering regressions before cleanup. |
| Local-only title ranks are silently lost during template sharing/import. | High | Medium | Reuse composed omission/replacement warnings and test template/share bytes remain intentionally title-free. |
| Allegiance warnings become noisy or imply unsupported ownership facts. | Medium | Medium | Emit one slot-local side-semantics warning only for selected allegiance dependencies; do not infer side from names. |
| Build schema fixture churn obscures real failures. | Medium | Medium | Update shared fixture factories first, keep explicit focused overrides, and stage verification by phase. |
| Compact controls crowd the skills workspace on narrow screens. | Medium | Medium | Show relevant rows first, hide remaining rows in a disclosure, stack controls at the existing breakpoint, and test long labels/no overflow. |

## Security

- Treat persisted libraries, backups, build objects, title keys, ranks, and catalog progression data as
  untrusted input even when TypeScript types claim validity.
- Reject dangerous keys recursively before migration or hydration. Reconstruct build and override
  arrays field by field; never spread untrusted parsed objects into application state.
- Bound override count, key length, slug grammar, rank range, diagnostic count, diagnostic text, and
  all collection traversal before allocating derived maps.
- Use `Map` for catalog and authored-key indexes. When calling the existing tooltip record API, copy
  only validated keys into a null-prototype object so `__proto__`, `constructor`, and `prototype`
  cannot mutate lookup behavior.
- Detect duplicate canonical overrides and alias collisions deterministically; never accept
  first-record-wins or last-record-wins behavior from untrusted state.
- Require finite safe integers for domains, rows, and overrides. Do not evaluate strings, parse
  expressions, interpolate missing values, or accept exponential/decimal UI text as integer ranks.
- Render labels, keys, diagnostics, and skill facts as React text. Do not use `dangerouslySetInnerHTML`
  or source-authored HTML.
- Keep generated JSON imports isolated to `src/app/catalogs.ts`; do not import manifests, QA files,
  snapshots, source prose, local paths, or remote media URLs at runtime.
- Add no network request, account identifier, telemetry, clipboard read, storage key, auth surface, or
  backend dependency.
- Preserve existing explicit confirmation and write-blocked recovery boundaries for destructive
  draft replacement and backup restore.
- Title-rank output is not an authorization, ownership, unlock, or account-legality claim; UI/docs
  must describe it as skill scaling configuration.

## Dependencies

### Required and Completed

- **EPIC-04 / SPRINT-005**: promoted skill catalog, title-rank dependency keys, rank domains,
  progression series, structured descriptions, classifications, and mode splits.
- **EPIC-06 / SPRINT-007**: deterministic validation engine, title deferral placeholders,
  PvE-only limit behavior, issue metadata, and validation ordering.
- **EPIC-08 / SPRINT-009**: single-character editor, reducer, skill bar/browser, displays, tooltips,
  maximum-title assumptions, and responsive component patterns.
- **EPIC-09 / SPRINT-010**: local-library envelope, working drafts, saved records, duplication,
  backup/restore, template sharing, freshness, migration hooks, and dirty guards.
- **EPIC-13 / SPRINT-014**: semantic nullable equipment model and equipment-adjusted attribute ranks.
- **EPIC-14 / SPRINT-015**: equipment editor integration, persistence, workspace tabs, and existing
  template omission messaging.

### Runtime and Tooling

- Existing React 19, TypeScript 5.9, Vite 6, Vitest 4, Testing Library, ESLint, and Prettier setup.
- Existing promoted `data/generated/epic-04/skills.catalog.json` through the approved app catalog
  boundary.
- Existing browser `localStorage`, backup download/upload, clipboard-write, and URL fragment ports;
  no new browser capability is required.
- No new npm package, Python package, service, API, database, route, worker, or environment variable
  is planned.

### Downstream Handoffs

- Party-building work can carry schema-2 `Build` objects with their own title overrides; it must not
  promote these overrides into account-global state without a separate design.
- Future title metadata repair may eliminate current domain-conflict warnings by correcting the
  existing EPIC-04 progression pipeline and repromoting the skill catalog; it must preserve canonical
  authored keys and migration behavior.
- Future share-format work may explicitly version title-rank payloads. Until then, local-only
  omission remains a product contract, not an accidental limitation.
- Future allegiance work may add structured side identity and exclusivity only from reviewed catalog
  evidence; this sprint's generic rank key must remain readable.

## Open Questions

1. **Should the current Sunspear conflict trigger an EPIC-04 catalog repair immediately?** This draft
   does not block EPIC-15 on a new data run. It ships conservative common-domain editing and a narrow
   warning. If execution finds reviewed existing snapshot evidence sufficient to prove one domain,
   record a planning amendment and fix the existing EPIC-04 normalizer rather than creating a title
   ingestion path.
2. **Should structurally valid unknown overrides be removed during hydration?** Default: no. Retain
   them, warn, and offer reset so catalog churn cannot silently erase authored state.
3. **Should the all-title disclosure state persist?** Default: no. It is ephemeral UI preference and
   returns closed on hydration; only semantic overrides persist.
4. **Should an override at the common maximum be stored for a conflicting definition?** Default:
   yes, because removing it would restore different per-series implicit maxima. For coherent
   definitions, setting maximum removes the override.
5. **Should allegiance side uncertainty be an info or warning?** Default: warning because it affects
   whether validation is fully resolved, while rank rendering and ordinary editing remain available.
6. **Should title overrides be included in the current share fragment?** Default: no. Preserve the
   existing versioned skill-template payload and disclose omission until a separately planned share
   schema can cover equipment and other local-only semantic state coherently.
