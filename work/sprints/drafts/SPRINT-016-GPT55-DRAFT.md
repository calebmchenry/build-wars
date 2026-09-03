---
id: SPRINT-016
title: Title Rank Controls and PvE-only
status: draft
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

This sprint replaces the current hidden maximum-title-rank display assumption with explicit
default-max title rank behavior and compact user overrides in the existing single-character editor.
Title-scaled skills continue to work with no user input: each EPIC-04 title-rank progression uses
its own `rankDomain.max` until the user changes the relevant title rank.

The sprint is a narrow UX, state, selector, validation, and persistence increment. It reuses the
EPIC-04 skill catalog's `SkillProgressionSeries.dependency.kind === "title-rank"`, `titleKey`, and
`rankDomain` facts. It does not create a title ingestion pipeline, account title profile, title
ownership model, reputation/acquisition guide, broad allegiance system, backend sync, party title
state, or new share codec.

Binding defaults for execution:

- Add title rank overrides as semantic build state, not transient UI state. The preferred shape is a
  sparse, sorted `Build.titleRankOverrides` array of canonical key/rank pairs.
- Missing persisted title-rank state hydrates to an empty override array. Empty means implicit max
  rank and should not dirty old records.
- Store only user overrides from max. Resetting a title removes the override.
- Derive title definitions from the current skill catalog at runtime through pure helpers; do not
  import generated data outside `src/app/catalogs.ts`.
- Preserve the existing three-PvE-only-skill limit in `src/domain/rules/skill-bar.ts`.
- Keep skill-template export/share URLs skill-template-first. Title overrides are local-library and
  backup state unless a later epic adds a representable exchange format.

Current catalog ambiguity to surface early: the promoted EPIC-04 catalog includes both
`title:sunspear-rank` and `title:title-sunspear-rank`, and their rank domains are not identical.
The sprint must not silently collapse those keys in a way that loses tooltip values or hides a
catalog defect.

## Use Cases

1. **Default title output**: A user selects a title-scaled skill and sees tooltip/display values at
   the relevant catalog maximum without configuring anything.
2. **Lower a relevant title**: A user lowers a selected skill's title rank with integer controls and
   every affected tooltip/display path updates deterministically.
3. **Reset to max**: A user resets a title rank and the authored override is removed, returning to
   implicit max behavior.
4. **Avoid title noise**: Builds with no selected title-scaled skills do not get a dominant title
   panel or irrelevant warnings.
5. **Configure ahead**: A user can optionally reveal all discovered title ranks and set one before a
   related skill is selected.
6. **Persist locally**: Working drafts, saved records, duplication, hydration, backup, and restore
   preserve only bounded title-rank overrides.
7. **Recover old saves**: Existing records without title-rank state load without crashes,
   autosave churn, or stale-title warnings.
8. **Understand metadata gaps**: Skills with missing, unsupported, aliased, or ambiguous title
   metadata show narrow warnings instead of generic EPIC-15 deferrals.
9. **Respect PvE-only rules**: PvE-only skill count, PvE/PvP mode restrictions, and browser
   availability filters continue to behave as before.
10. **Share honestly**: Skill-template export/share remains available when otherwise valid and can
    warn when non-default title overrides cannot be represented in the template URL.

## Architecture

### Scope Boundaries

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Title facts | Discover title dependencies from EPIC-04 skill progression metadata, normalize keys, expose labels, min/max domains, and selected-skill relevance. | New title catalog ingestion, source crawling, title acquisition facts, account ownership, guide prose, copied source descriptions. |
| Build state | Sparse canonical title-rank override records, default-max resolution, clamping, reset-to-max removal, and schema-compatible hydration. | Persisting every title at max, account profiles, party-wide title state, campaign unlock state, backend sync. |
| App selectors | Relevant-title views, optional all-title views, tooltip rank contexts, display labels, share omission warnings, and validation input composition. | Component-owned catalog traversal, generated JSON imports in leaf components, full title dashboard. |
| UI | Compact integer stepper/number controls in the existing Skills workspace, keyboard operation, direct entry, reset, quiet current/max display, responsive layout. | Slider-only controls, new route, broad title tracker, farming/progression planner. |
| Validation | Suppress generic title deferrals when title dependencies resolve, retain deterministic warnings for missing/unsupported/ambiguous metadata, preserve PvE-only limit behavior, narrow allegiance uncertainty. | Account unlock legality, Kurzick/Luxon side modeling beyond catalog evidence, PvX/community legality. |
| Sharing | Existing skill-template export/share URL behavior plus omission messaging for unrepresented title overrides. | Encoding title ranks into `#bw=1` URLs, JSON single-build exchange, hosted sharing, short links. |

### State And Helper Ownership

Add a pure title-rank helper module, preferably `src/domain/title-rank.ts`, and export it from
`src/domain/index.ts`. It should own:

- `TitleRankOverride` and `TitleRankDefinition` contracts if they are domain-level.
- Static key normalization and alias handling for known title key forms.
- Discovery from `SkillProgressionSeries[]` without reading generated JSON directly.
- User-facing labels derived from canonical keys, not raw source strings.
- Resolution of an effective rank for each original progression source key.
- Per-series clamping so a canonical override cannot make `renderSkillTooltipText` request a row
  outside that series' `rankDomain`.
- Structured diagnostics for duplicate keys, unsafe keys, missing domains, missing rows, and
  conflicting alias domains.

`Build.titleRankOverrides` should be an array rather than a string-keyed object so persistence does
not need to trust arbitrary object keys. The array is canonical when keys are normalized, unique,
sorted, bounded, and each rank is an integer. Persistence can accept missing state as `[]`, skip or
diagnose malformed override entries, and leave catalog-dependent clamping to title-rank selectors.

The app selector layer should convert sparse overrides plus catalog definitions into:

```text
Build.titleRankOverrides
  -> discoverTitleRankDefinitions(catalogs.validation.skills.progressionSeries)
  -> selectRelevantTitleRankControls(state.build.skillBar, skill catalog, definitions)
  -> resolveTitleRankContextForSkill(skill, definitions, overrides)
  -> renderSkillTooltipText(..., { ranks })
  -> validation input and display view models
```

### Ambiguity Handling

Key aliases are not just string prettification. If two source keys normalize to the same user-facing
title but expose different rank domains or value-row coverage, execution must choose one of these
bounded behaviors and document it:

- Treat them as one control with a merged display domain, while resolving each progression with its
  own clamped series rank.
- Keep them as one visual group with separate internal source-key diagnostics until a catalog fix is
  made.

Silently picking one source key and dropping the other is not acceptable.

`classification.title` skills with no title-rank progression keys are not controlled by rank state.
They should receive a narrow metadata/title-legality warning if validation still needs one, not the
old generic `skill.title-deferred` message.

Allegiance-ranked skills use one rank-first control for MVP. Add a narrow side/exclusivity warning
only when selected catalog facts require it; do not invent account-wide Kurzick/Luxon ownership
state.

### UI Placement

Place the compact title controls in the `Skills` workspace, after `SkillBar` and before
`SkillBrowser`. The default view shows only title ranks referenced by selected skill-bar skills.
An optional collapsed "all title ranks" view can expose the full discovered set.

Each control should provide decrement, increment, direct integer entry, and reset-to-max. Display
current/max rank quietly, such as `8 / 12`, and keep long labels responsive. Controls should be
ordinary accessible form controls with stable labels, keyboard support, inline validation copy, and
no dependency on remote media or new UI libraries.

### Validation Flow

Extend validation context only enough to know whether selected title dependencies resolve through
default or override rank state. Generic `skill.title-deferred` and `skill.allegiance-deferred`
warnings should disappear for resolved rank dependencies. New or revised issue codes should be
deterministic and specific, for example:

- title key missing
- title rank domain missing
- title progression rows missing for selected rank
- title alias/domain conflict
- title-classified skill without rank metadata
- allegiance side unmodeled when catalog evidence requires it

The PvE-only skill count rule remains owned by `src/domain/rules/skill-bar.ts`; EPIC-15 may add
regression tests and presentation cleanup but should not redesign that rule.

## Implementation

### Phase 0: Baseline And Decisions

- Record current behavior around max-title assumptions, generic title deferrals, PvE-only limits,
  and old persisted records.
- Audit current title progression keys and rank domains, especially the Sunspear alias/domain
  conflict.
- Decide the exact `Build.titleRankOverrides` field name and reader migration behavior before
  writing UI code.
- Run focused baseline tests for existing title assumptions and PvE-only validation.

### Phase 1: BW-1501 Title State, Discovery, Defaults, Persistence

- Add domain contracts/helpers for title rank definitions, key normalization, alias grouping,
  default-max resolution, per-series clamping, and override canonicalization.
- Extend `Build`, blank build creation, clone/fingerprint paths, reducer actions, and persistence
  parsing/hydration for sparse title-rank overrides.
- Add selector helpers for relevant and all-title control view models.
- Test discovery, aliasing, empty default-max behavior, direct overrides, malformed persisted ranks,
  duplicate keys, dangerous keys, clamping, reset-to-max removal, old record hydration, save/load,
  duplication, backup, and restore.

### Phase 2: BW-1502 Compact Controls

- Create `src/app/components/TitleRankControls.tsx` and integrate it into the `Skills` tab between
  `SkillBar` and `SkillBrowser`.
- Support relevant-title default view, optional all-title expansion, integer decrement/increment,
  direct number entry, reset-to-max, disabled/unresolved states, and compact no-relevant-title
  rendering.
- Preserve existing skill-bar selection, browser filtering, tooltip, and equipment tab behavior.
- Test keyboard interaction, screen-reader labels, bounds, reset semantics, selected-skill
  relevance, all-title expansion, and responsive layout.

### Phase 3: BW-1503 Tooltip And Display Integration

- Replace selector-generated maximum-title assumptions with configured/default title rank contexts.
- Feed resolved title ranks into `renderSkillTooltipText` for skill rows, skill-bar slots, browser
  results, and pinned tooltip panels.
- Update progression labels from raw "maximum-title-rank assumption" copy to configured title labels.
- Keep unsupported structured descriptions and missing progression rows visible as unresolved
  states.
- Test max default rendering, lowered-rank rendering, alias behavior, no-progression title skills,
  missing rank rows, and interaction with equipment-derived attribute rank adjustments.

### Phase 4: BW-1504 Validation And PvE-only Cleanup

- Replace broad title/allegiance deferrals with specific resolved/unresolved title validation.
- Preserve the current three-PvE-only-skill limit and mode availability behavior.
- Add narrow allegiance warning behavior only where selected skill/catalog facts justify it.
- Keep browser availability filtering aligned with existing `classification.modeAvailability`,
  `pveOnly`, and `pvpOnly` facts.
- Test resolved title dependencies, unresolved metadata, title-classified no-progression skills,
  allegiance keys, PvE mode, PvP mode, unknown mode, exactly three PvE-only skills, and four
  PvE-only skills.

### Phase 5: BW-1505 Docs And Closeout

- Update README and compendium notes for default-max title rank behavior, sparse overrides,
  reset-to-max, alias handling, validation changes, sharing omission behavior, and deferred scope.
- Update ticket statuses, sprint records, ledger, and result manifest during execution.
- Confirm no generated-data pipeline, source snapshots, remote media, backend, route, or share-codec
  changes were introduced.
- Run `npm run verify` before marking the sprint complete.

## Files Summary

| Path | Action | Purpose |
| --- | --- | --- |
| `src/domain/build.ts` | Modify | Add semantic title-rank override state to `Build`. |
| `src/domain/title-rank.ts` | Create | Pure title discovery, normalization, defaulting, clamping, labels, and diagnostics. |
| `src/domain/skill-tooltip.ts` | Modify | Support selector-supplied title rank contexts without hidden max assumptions. |
| `src/domain/validation.ts` | Modify | Add or rename specific title/allegiance issue codes and ordering. |
| `src/domain/validation-context.ts` | Modify | Index title definitions and expose resolved title-rank state to skill rules. |
| `src/domain/rules/skill-eligibility.ts` | Modify | Suppress generic deferrals for resolved title ranks and emit narrow metadata warnings. |
| `src/domain/rules/skill-bar.ts` | Test only by default | Preserve PvE-only skill count behavior. |
| `src/domain/index.ts` | Modify | Export new title-rank contracts/helpers. |
| `src/app/editor-state.ts` | Modify | Add title-rank override actions, blank defaults, and reset behavior. |
| `src/app/editor-selectors.ts` | Modify | Build title control views, tooltip rank contexts, progression labels, validation inputs, and share warnings. |
| `src/app/components/TitleRankControls.tsx` | Create | Compact relevant/all title-rank controls. |
| `src/app/App.tsx` | Modify | Place controls in the Skills workspace without changing routes. |
| `src/app/components/SkillDisplay.tsx` | Modify | Show configured rank facts only where useful and compact. |
| `src/app/components/SkillTooltip.tsx` | Modify | Remove max-assumption section for resolved title ranks and show specific unresolved states. |
| `src/app/components/SkillBrowser.tsx` | Test or modify | Ensure title/PvE-only browser behavior remains consistent. |
| `src/app/persistence-schema.ts` | Modify | Parse, clone, serialize, fingerprint, and hydrate title-rank overrides safely. |
| `src/app/local-storage.ts` | Test or modify | Preserve autosave and saved-record behavior with title overrides. |
| `src/app/backup-restore.ts` | Test or modify | Preserve and validate title overrides in backup/restore flows. |
| `src/app/share-url.ts` and `src/app/template-workflow.ts` | Test or modify | Keep share URLs skill-template-only and expose omission messaging if needed. |
| `src/app/styles.css` | Modify | Add compact responsive title control styles. |
| `test/domain/title-rank.test.ts` | Create | Cover title helper behavior and ambiguous metadata. |
| `test/domain/skill-eligibility-rules.test.ts` | Modify | Cover title validation cleanup and PvE-only regressions. |
| `src/app/*title*.test.tsx` or focused app tests | Create/modify | Cover controls, selectors, display, persistence, local library, and backup/restore. |
| `README.md` and `compendium/*.md` | Modify | Document shipped title rank behavior and deferred scope. |
| `work/tickets/15-title-tracks-and-pve-only/*.md` | Modify during execution | Track ticket status and closeout. |
| `work/sprints/SPRINT-016.md`, `work/sprints/ledger.tsv`, `work/runs/ticket-burn/**` | Create/modify during execution | Final sprint record, ledger sync, and result manifest. |

## Definition of Done

- [ ] Title-scaled skills render at each progression's `rankDomain.max` by default with no stored
      override.
- [ ] User overrides are sparse, canonical, bounded, sorted, resettable, and persisted only when
      different from max behavior.
- [ ] Old local-library records without title-rank state hydrate without dirtying or data loss.
- [ ] Relevant title controls appear for selected title-scaled skills and do not dominate builds
      without title dependencies.
- [ ] Optional all-title controls expose every discovered title definition without requiring account
      title ownership.
- [ ] Tooltip, skill row, skill bar, browser, and pinned tooltip display paths use configured/default
      title ranks consistently.
- [ ] Generic title/allegiance deferrals are removed for resolved dependencies and replaced with
      specific warnings for unresolved metadata.
- [ ] Existing PvE-only skill count and mode restriction behavior is covered and preserved.
- [ ] Sunspear alias/domain behavior is explicitly tested and documented; no source key is silently
      dropped.
- [ ] Non-default title overrides survive autosave, saved records, duplication, backup, restore, and
      hydration.
- [ ] Share/export behavior remains skill-template-first and does not encode title ranks in existing
      URL fragments.
- [ ] README, compendium, tickets, final sprint record, ledger, and run manifest agree on shipped
      behavior and deferred scope.
- [ ] `npm run verify` passes before closeout.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Sunspear aliases have conflicting domains or value rows. | A single control could render wrong values or hide a catalog defect. | Audit in Phase 0, add explicit diagnostics/tests, and resolve per series rather than dropping keys. |
| Moving title state into `Build` breaks older fixtures or persistence. | Save/load, backup, or tests could reject old records. | Treat missing title state as `[]`, keep local-library schema v1 unless incompatibility is proven, and update clone/fingerprint tests. |
| Validation cleanup suppresses real metadata gaps. | Users may lose visibility into unsupported title skills. | Replace generic deferrals only after resolved rank state exists; keep specific warnings for missing keys, domains, rows, aliases, and no-progression title skills. |
| Controls become a title dashboard. | Core skill editing gets crowded. | Default to selected-skill relevance and keep all-title controls collapsed. |
| PvE-only logic is accidentally changed while touching title skills. | Existing legality behavior regresses. | Leave `skill-bar.ts` rule intact and add exact three/four PvE-only regression tests. |
| Title overrides are mistaken for account ownership. | UI implies stronger legality than modeled. | Label controls as build display ranks and document account ownership/acquisition as deferred. |

## Security

- Treat localStorage, backup JSON, share fragments, template input, title keys, names, tags, and
  notes as untrusted.
- Store title overrides as bounded arrays, not arbitrary object maps. Reject or skip dangerous keys,
  duplicate canonical keys, unsafe strings, non-integer ranks, and oversized collections.
- Do not fetch remote title data, icons, wiki pages, or media at runtime.
- Do not copy source-authored skill/title prose into runtime docs or UI as part of this sprint.
- Keep share URLs within the existing skill-template grammar and do not place title override JSON in
  URL fragments.
- Keep domain modules framework-neutral and free of React, DOM, browser storage, network clients,
  generated JSON imports, manifests, QA reports, source snapshots, Python tooling, and wiki APIs.

## Dependencies

- Completed EPIC-04 / SPRINT-005 for skill progression series, title keys, rank domains, split
  metadata, and structured tooltip tokens.
- Completed EPIC-06 / SPRINT-007 for deterministic validation contracts, skill eligibility rules,
  and PvE-only skill limit behavior.
- Completed EPIC-08 / SPRINT-009 for editor selectors, skill display, skill bar, browser, tooltips,
  and current max-title assumption behavior.
- Completed EPIC-09 / SPRINT-010 for local-library persistence, autosave, saved records, share URLs,
  backup, and restore.
- Completed EPIC-14 / SPRINT-015 for current Skills/Equipment workspace layout and equipment rank
  adjustment integration.
- Node.js `22.11.0` or newer and npm `11.10.1` or newer, with `npm run verify` as the closeout
  command.

## Open Questions

1. Should conflicting Sunspear source keys be fixed in EPIC-04 catalog data during this sprint, or
   should EPIC-15 ship a runtime alias group with per-series clamping and diagnostics?
2. Should `classification.title` skills with no title-rank progression keys be treated as
   title-legality-only warnings, catalog gaps, or intentionally uncontrolled title skills?
3. Should share/export omission warnings appear only when non-default title overrides exist, or
   whenever selected skills depend on title-rank defaults that the template URL cannot encode?
4. Are current allegiance catalog facts sufficient for a narrow side warning, or should side
   modeling remain fully deferred until a catalog can distinguish Kurzick and Luxon requirements?
5. Should adding `Build.titleRankOverrides` keep `Build.schemaVersion: 1` with missing-field reader
   migration, or should execution bump the authored build schema after confirming blast radius?
6. Should unknown-but-safe persisted title override keys remain round-trippable in the all-title
   view, or should they be skipped with diagnostics because they cannot be tied to EPIC-04 metadata?
