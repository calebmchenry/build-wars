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

This sprint adds authored title-rank overrides to the existing single-character editor without
changing the promoted data boundary, the skill-template codec, or the existing PvE-only rule. The
build should continue to behave as it does today when the user never touches title ranks: every
resolved title-scaled progression uses its catalog maximum by default.

Implementation order is the main constraint. The sprint should land one pure title-rank domain
helper first, then durable authored override state, then the compact controls, then tooltip/display
integration, then validation cleanup. That sequence keeps reducer logic catalog-independent,
minimizes churn in `renderSkillTooltipText`, and avoids hiding real title metadata gaps before the
resolution path is proven end to end.

These execution defaults are binding:

1. Title-rank override state lives on `Build` as an additive optional field,
   `titleRankOverrides`, because title ranks affect authored build semantics, validation, display,
   duplication, autosave, and backup/restore. Missing or empty override state means implicit
   max-rank behavior.
2. `LOCAL_LIBRARY_SCHEMA_VERSION` stays `1`. The persistence change is additive and backward
   compatible because title ranks derive entirely from the already-promoted EPIC-04 skill catalog.
3. One pure domain helper owns raw-key discovery, alias normalization, label derivation, canonical
   control ordering, default-max resolution, and per-series clamping. App selectors and domain
   validation must both call that helper rather than reimplement title logic.
4. The `Skills` tab gets a compact `TitleRankPanel` between `SkillBar` and `SkillBrowser`. The
   default view shows only title ranks referenced by the current skill bar, with an optional
   expanded all-title view for preconfiguration.
5. Share URLs and skill-template export remain skill-template-only. Non-empty title-rank overrides
   must trigger omission or discard warnings in the same places where authored equipment already
   does.
6. The existing `skill.pve-only-limit` behavior and browser availability filters are preserved
   unless focused regression tests prove a bug.

## Use Cases

1. A build with title-scaled skills but no user overrides still renders those skills at the catalog
   maximum title rank.
2. A user can lower one relevant title rank from the `Skills` tab without leaving the current
   editor workflow.
3. A user can preconfigure a title rank before slotting a skill by opening the optional all-title
   view.
4. Resetting a title removes the authored override instead of storing a redundant max-rank value.
5. Lowered title ranks update tooltips, skill tiles, and skill-bar slots consistently.
6. A build with old saved data and no title-rank field still hydrates cleanly and keeps current
   max-rank behavior.
7. A build with malformed persisted title ranks clamps or drops bad values without crashing the
   editor or corrupting the rest of the library.
8. Title-ranked skills with incomplete progression metadata still surface deterministic unresolved
   warnings instead of silently pretending to be resolved.
9. PvE-only title skills continue to respect the three-skill PvE-only bar limit.
10. Sharing or exporting a build with lowered title ranks warns that title overrides are not part of
    the skill-template payload.

## Architecture

| Area | Owns | Must Not Own |
| --- | --- | --- |
| `src/domain/title-rank.ts` | Raw title dependency discovery from EPIC-04 progression metadata, alias normalization, canonical labels, canonical control ordering, effective-rank resolution from implicit max plus overrides, and per-series clamp helpers. | React, browser APIs, storage, generated JSON imports, or UI-specific text. |
| `src/domain/build.ts` | Additive authored `titleRankOverrides` field on `Build`. | Catalog-derived label or max-rank truth. |
| `src/domain/rules/skill-eligibility.ts` and `src/domain/validation.ts` | Narrow title and allegiance warnings based on resolved or unresolved title metadata, while preserving existing deterministic issue ordering. | UI state, browser filters, or reducer-owned clamping. |
| `src/app/editor-state.ts` | Structural set or clear actions for authored title-rank overrides. | Catalog lookup, alias normalization, or domain-range discovery. |
| `src/app/title-rank-selectors.ts` and `src/app/editor-selectors.ts` | Relevant-title filtering, all-title view models, component-facing min or max bounds, share or export omission detection, tooltip rank-context assembly, and display summaries. | Persistence parsing, generated catalog imports, or ad hoc domain rules. |
| `src/app/components/TitleRankPanel.tsx`, `src/app/App.tsx`, `src/app/styles.css` | Compact controls, keyboard behavior, responsive placement, and low-noise status text. | Validation authority or storage parsing. |
| `src/app/persistence-schema.ts`, `src/app/local-storage.ts`, `src/app/backup-restore.ts`, `src/app/template-workflow.ts`, `src/app/components/ShareControls.tsx`, `src/app/components/TemplateDialogs.tsx` | Durable storage, hydration, omission or discard warnings, and compatibility with existing library or template flows. | New share payload grammar or new storage envelope version. |

### Canonical Title Model

The promoted EPIC-04 catalog currently exposes eight raw title keys:

- `title:allegiance-rank`
- `title:asura-rank`
- `title:deldrimor-rank`
- `title:ebon-vanguard-rank`
- `title:lightbringer-rank`
- `title:norn-rank`
- `title:sunspear-rank`
- `title:title-sunspear-rank`

The sprint should expose seven user-facing controls by collapsing the two Sunspear key forms into
one canonical Sunspear control. The helper should keep both raw keys addressable internally so
tooltip rendering and validation can still satisfy the exact progression row each skill references.

The canonical control domain should be derived from the alias-group envelope, not from one chosen
raw key. That matters for Sunspear, where the current catalog contains `0..10`, `0..12`, and
`0..15` series. The authored control should store one canonical override, while series-specific
resolution clamps again to the target row's own `rankDomain` before tooltip or validation use.

### State Contract

`Build.titleRankOverrides` should store only authored deviations from implicit max rank. The field
should be omitted entirely for fresh builds and removed again when the last override is reset. The
reducer remains catalog-independent by accepting a canonical key plus an already-bounded integer or
clear intent. Title controls and persistence validators are responsible for applying discovered
min/max bounds before state is written.

This follows the existing project split:

- domain owns authored build semantics
- app selectors own catalog-backed view models
- persistence owns untrusted JSON validation
- share and template workflows own payload omission messaging

### Display and Validation Flow

```text
EPIC-04 progression metadata
  -> src/domain/title-rank.ts
  -> canonical title definitions + raw-key resolution helpers
  -> Build.titleRankOverrides
  -> app title-rank selectors and tooltip rank context
  -> renderSkillTooltipText / SkillDisplay / TitleRankPanel
  -> validateBuild title and allegiance warnings
  -> local save, backup, restore, share-export omission messaging
```

`renderSkillTooltipText` should keep its current caller-supplied rank-context contract. The new
helper should resolve raw title keys before the app calls the tooltip renderer so the tooltip API
does not need a second title-specific resolution path.

### Warning Strategy

The sprint should minimize downstream churn by keeping the existing `skill.title-deferred` and
`skill.allegiance-deferred` codes, but changing their meaning. After this sprint they should no
longer mean "EPIC-15 not implemented"; they should mean "the selected skill still has unresolved
title or allegiance metadata after EPIC-15 title-rank resolution was attempted." Resolved title
dependencies should emit no generic deferral warning.

## Implementation

### Phase 0: Baseline and Contract Freeze (~5%)

Files: `work/sprints/SPRINT-016.md`, `work/tickets/15-title-tracks-and-pve-only/*.md`,
`src/app/editor-selectors.test.ts`, `test/domain/skill-eligibility-rules.test.ts`,
`src/app/template-dialogs.test.tsx`, `src/app/App.test.tsx`

- Freeze the additive `Build.titleRankOverrides` decision, the `schemaVersion: 1` persistence
  boundary, the `Skills` tab placement, and the omission-warning rule for share or template flows.
- Capture the current baseline behavior where title-scaled skill display uses maximum-rank
  assumptions and validation emits generic title deferral warnings.
- Add or tighten regression tests around current share/export behavior, current tooltip assumption
  behavior, and current PvE-only enforcement so later phases prove only intentional changes.
- Verify with `npm run typecheck` and focused Vitest runs for the touched baseline tests.

### Phase 1: BW-1501 Title-Rank Foundation and Durable State (~24%)

Files: `src/domain/title-rank.ts`, `src/domain/build.ts`, `src/domain/index.ts`,
`src/app/editor-state.ts`, `src/app/persistence-schema.ts`, `src/app/local-storage.ts`,
`src/app/backup-restore.ts`, `src/app/workspace-state.ts`, `test/domain/title-rank.test.ts`,
`src/app/editor-state.test.ts`, `src/app/persistence-schema.test.ts`,
`src/app/local-storage.test.ts`, `src/app/backup-restore.test.ts`

- Add one pure title-rank helper that discovers title dependencies from progression series, maps raw
  keys to canonical authored keys, derives user-facing labels, and resolves effective ranks from
  implicit max plus optional overrides.
- Normalize the observed eight raw keys into seven canonical controls, with explicit regression
  coverage for Sunspear aliasing and mixed rank domains.
- Add additive optional `titleRankOverrides` storage to `Build`, defaulting to omitted state for
  fresh builds.
- Add structural reducer actions to set or clear one canonical override without making the reducer
  depend on the skill catalog.
- Extend persistence, autosave, hydrate, duplicate, and backup or restore paths to round-trip only
  canonical overrides, reject dangerous keys, and clamp or discard malformed persisted values.
- Keep saved-with catalog facts unchanged because title-rank behavior depends only on the existing
  skill catalog version and rule-engine version.
- Verify with `npm run typecheck` and focused Vitest coverage for aliasing, effective-rank
  resolution, empty override semantics, persistence round trips, malformed values, and old-record
  hydration.

### Phase 2: BW-1502 Compact Title-Rank Controls (~20%)

Files: `src/app/title-rank-selectors.ts`, `src/app/editor-selectors.ts`, `src/app/App.tsx`,
`src/app/components/TitleRankPanel.tsx`, `src/app/styles.css`, `src/app/title-rank-panel.test.tsx`,
`src/app/editor-selectors.test.ts`, `src/app/App.test.tsx`

- Add selector-backed relevant-title and all-title control views, sorted deterministically and keyed
  by canonical title key.
- Render a compact `TitleRankPanel` between `SkillBar` and `SkillBrowser` on the `Skills` tab.
- Default the panel to the subset referenced by the current skill bar and keep the all-title view
  collapsed unless the user explicitly expands it.
- Support decrement, increment, direct integer entry, keyboard submission, reset-to-max, and quiet
  current/max display without slider-only controls.
- Keep builds with no title-scaled skills low-noise by collapsing the panel to an empty or hidden
  state with a minimal affordance for the all-title view.
- Verify with focused component tests for relevant-title filtering, keyboard and pointer behavior,
  bounds enforcement, reset-to-max removal of overrides, long labels, and narrow-width layout.

### Phase 3: BW-1503 Tooltip and Skill Display Integration (~18%)

Files: `src/app/editor-selectors.ts`, `src/domain/skill-tooltip.ts`, `src/app/components/SkillDisplay.tsx`,
`src/app/components/SkillTooltip.tsx`, `src/app/skill-display.test.tsx`,
`src/app/editor-selectors.test.ts`, `test/domain/skill-catalog.test.ts`

- Replace the current max-rank assumption assembly with title-rank helper output so every tooltip
  and skill-display path uses effective selected or default title ranks.
- Remove hidden or misleading maximum-title-rank assumption copy when a rank is resolved by default
  or override state.
- Keep unresolved description or progression failures visible and non-crashing when title metadata
  is absent, ambiguous, or unsupported.
- Ensure lowered title ranks update skill-browser tiles, skill-bar slots, and tooltip panels
  consistently from the same selector path.
- Verify with focused tests for default-max rendering, lowered-rank rendering, Sunspear alias
  handling, unresolved progression behavior, and compatibility with equipment-driven attribute-rank
  adjustments.

### Phase 4: BW-1504 Validation Cleanup and PvE-only Handoffs (~21%)

Files: `src/domain/rules/skill-eligibility.ts`, `src/domain/validation.ts`,
`src/domain/validation-context.ts`, `src/domain/rule-engine.ts`, `src/app/editor-selectors.ts`,
`src/app/skill-browser.test.tsx`, `test/domain/skill-eligibility-rules.test.ts`,
`test/domain/skill-bar-rules.test.ts`, `test/domain/rule-engine.test.ts`,
`test/domain/validation-context.test.ts`

- Replace generic title deferral checks with helper-backed resolution checks that suppress warnings
  when title dependencies are fully resolved by implicit defaults or authored overrides.
- Preserve deterministic warnings for missing `titleKey`, missing `rankDomain`, missing
  progression rows, unsupported progression data, or ambiguous allegiance semantics.
- Keep the existing `skill.pve-only-limit` rule behavior unchanged and cover exact-three and
  fourth-skill cases explicitly.
- Keep browser availability filtering and skill classification handoffs unchanged unless focused
  tests show a real mismatch between the promoted catalog and current filter behavior.
- Treat allegiance as rank-first for MVP. Emit a narrow `skill.allegiance-deferred` warning only
  when selected catalog facts leave side or exclusivity semantics unresolved.
- Verify with `npm run test:run -- test/domain src/app` and focused assertions on issue codes,
  issue ordering, PvE-only regressions, and title-skill validation in PvE, PvP, and unknown modes.

### Phase 5: BW-1505 Share, Docs, and Closeout (~12%)

Files: `src/app/template-workflow.ts`, `src/app/components/ShareControls.tsx`,
`src/app/components/TemplateDialogs.tsx`, `src/app/template-workflow.test.ts`,
`src/app/template-dialogs.test.tsx`, `src/app/App.test.tsx`, `README.md`,
`compendium/core-build-editor.md`, `compendium/game-rule-engine.md`,
`compendium/local-library-and-sharing.md`, `work/tickets/15-title-tracks-and-pve-only/*.md`,
`work/sprints/SPRINT-016.md`, `work/sprints/ledger.tsv`

- Add omission warnings for non-empty title-rank overrides in share and skill-template export
  surfaces, plus discard warnings when importing a skill template over a draft with authored title
  overrides.
- Document default-max behavior, override-only persistence, canonical key normalization, reset to
  max semantics, Sunspear alias handling, and the continued omission of title state from
  skill-template payloads.
- Record deferred scope explicitly: no account title ownership, no title acquisition data, no broad
  allegiance model, no party title state, and no new title ingestion pipeline.
- Close tickets and sprint records only after the focused test matrix is green and final repository
  verification passes.
- Verify with final `npm run verify`.

## Files Summary

| Area | Files | Planned work |
| --- | --- | --- |
| Domain title-rank core | `src/domain/title-rank.ts`, `src/domain/build.ts`, `src/domain/index.ts`, `test/domain/title-rank.test.ts` | Add the canonical title-rank helper, additive authored override contract, and pure tests for discovery, aliasing, domains, defaults, and clamping. |
| Editor state and selectors | `src/app/editor-state.ts`, `src/app/title-rank-selectors.ts`, `src/app/editor-selectors.ts`, `src/app/editor-state.test.ts`, `src/app/editor-selectors.test.ts` | Add structural override actions, relevant or all-title view models, tooltip rank-context assembly, and omission-detection selectors. |
| UI | `src/app/App.tsx`, `src/app/components/TitleRankPanel.tsx`, `src/app/components/SkillDisplay.tsx`, `src/app/components/SkillTooltip.tsx`, `src/app/styles.css`, `src/app/title-rank-panel.test.tsx`, `src/app/skill-display.test.tsx`, `src/app/App.test.tsx` | Add the compact title-rank panel, responsive layout, keyboard entry, reset controls, and display integration across skill views. |
| Validation | `src/domain/rules/skill-eligibility.ts`, `src/domain/validation.ts`, `src/domain/validation-context.ts`, `src/domain/rule-engine.ts`, `test/domain/skill-eligibility-rules.test.ts`, `test/domain/skill-bar-rules.test.ts`, `test/domain/rule-engine.test.ts`, `test/domain/validation-context.test.ts` | Replace generic title deferrals with helper-backed resolved or unresolved checks while preserving PvE-only limit behavior and deterministic issue ordering. |
| Persistence and template boundaries | `src/app/persistence-schema.ts`, `src/app/local-storage.ts`, `src/app/backup-restore.ts`, `src/app/workspace-state.ts`, `src/app/template-workflow.ts`, `src/app/components/ShareControls.tsx`, `src/app/components/TemplateDialogs.tsx`, related tests | Round-trip canonical title overrides safely, keep schema v1 compatibility, and warn when title overrides are omitted from template or share payloads. |
| Docs and records | `README.md`, `compendium/core-build-editor.md`, `compendium/game-rule-engine.md`, `compendium/local-library-and-sharing.md`, `work/tickets/15-title-tracks-and-pve-only/*.md`, `work/sprints/SPRINT-016.md`, `work/sprints/ledger.tsv` | Record the behavior, deferred scope, compatibility guarantees, and closeout evidence. |

## Definition of Done

- `Build` supports additive optional `titleRankOverrides` storage, and fresh builds still behave as
  implicit max-rank builds with no authored title state.
- One pure helper resolves title-rank requirements from EPIC-04 progression metadata and is reused
  by selectors, tooltip display, and validation.
- The `Skills` tab contains compact relevant-title controls with optional all-title expansion,
  bounded integer editing, reset-to-max, and keyboard or screen-reader support.
- Tooltips, skill-bar slots, and skill-browser tiles render title-scaled values from selected or
  default ranks instead of hard-coded max-rank assumptions.
- Generic title deferral warnings are suppressed when title dependencies resolve successfully, while
  real metadata gaps still emit deterministic issues.
- The three-PvE-only-skill rule remains covered and unchanged.
- Local drafts, saved records, duplication, hydration, backup, and restore round-trip canonical
  title overrides without a storage schema bump.
- Share and export flows warn when non-default title-rank overrides are omitted from template-only
  payloads.
- README, compendium notes, tickets, sprint records, and ledger entries agree on `SPRINT-016`,
  `EPIC-15`, covered BW tickets, deferred scope, and the final verification record.
- `npm run verify` passes at closeout.

## Risks

- Mixed Sunspear rank domains in the promoted skill catalog can create confusing control caps.
  Mitigation: canonical alias-group envelope plus per-series clamp tests.
- A new authored build field can silently leak across template and share workflows.
  Mitigation: explicit omission or discard warnings plus focused template-workflow regression tests.
- Validation cleanup can accidentally hide genuine metadata gaps.
  Mitigation: keep resolved and unresolved title outcomes separate in the helper and cover missing
  metadata edge cases directly in domain tests.
- A new panel in the `Skills` tab can crowd the existing skill-first flow.
  Mitigation: relevant-title-first default, collapsed all-title view, and responsive layout tests.

## Security

- Persisted title-rank input must be treated as untrusted JSON. Accept only known canonical title
  keys, bounded counts, and finite integers; reject dangerous keys and unsupported fields at the
  persistence boundary.
- No new network access, generated runtime import boundary changes, remote icon usage, or copied
  source prose are introduced by this sprint.
- Share URLs and skill-template export remain title-free payloads. Title-rank overrides stay local
  to durable browser storage and inert backups unless a later sprint designs a new exchange format.
- Domain helpers must continue consuming only app-supplied promoted catalog facts and must not read
  storage, DOM, or browser state directly.

## Dependencies

- EPIC-04 / SPRINT-005: promoted skill progression metadata, `titleKey`, and `rankDomain`.
- EPIC-06 / SPRINT-007: validation engine, issue-code ordering, and existing PvE-only enforcement.
- EPIC-08 / SPRINT-009: current skill editor surfaces, tooltip rendering, browser filters, and
  selector structure.
- EPIC-09 / SPRINT-010: local-library durability, autosave, saved records, backup or restore, and
  share/template workflows.
- EPIC-14 / SPRINT-015: existing equipment-based attribute-rank adjustments that must keep
  composing with title-rank display work.
- Internal phase order: Phase 1 must land before all later phases; Phase 2 depends on stable
  canonical title definitions; Phase 3 depends on the selector path from Phase 2; Phase 4 depends
  on the verified resolution path from Phases 1 through 3; Phase 5 closes only after those paths
  stop moving.
- No new package, service, account, or data-ingestion dependency is planned.

## Open Questions

1. Should `skill.allegiance-deferred` be emitted once per affected skill slot, or deduped into one
   build-level warning when multiple affected slots all share the same unresolved allegiance
   uncertainty?
2. For canonical alias groups with mixed raw domains, should the control show only the canonical
   max, or also include a narrow note when some currently selected skills clamp below that max?
3. Is a hidden panel plus an all-title affordance better than a visible empty-state panel when a
   build has no title-scaled skills selected?
