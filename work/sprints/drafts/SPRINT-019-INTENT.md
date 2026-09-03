# Sprint 019 Intent: Focused Build Composer

## Seed

Create a ticket-burn sprint from `work/tickets/18-focused-build-composer/EPIC.md` for
`EPIC-18 Focused Build Composer`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-18`
- source_epic_path: `work/tickets/18-focused-build-composer/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-019.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-18` and BW-1801 through BW-1809,
ledger sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260903T141222Z/plan-EPIC-18-result.json`.

## Context

- `SPRINT-001` through `SPRINT-018` are completed in `work/sprints/ledger.tsv`; `SPRINT-019` is the
  next sprint ID.
- EPIC-18 is a product pivot, not a new domain-data foundation. It refocuses the primary app around
  creating, importing, editing, and exporting one build before users encounter library, equipment,
  build-set, party, guide, discovery, or advanced-analysis concepts.
- A durable product use-case document already exists at `compendium/build-composer-use-case.md`.
  BW-1801 should validate and tighten this record, then execution should build against it rather
  than restating product intent in components.
- The current app opens into a dense multi-capability workspace: catalog attribution and storage
  banner, a left column with local library, profession/mode controls, attributes, template dialogs,
  sharing, and validation, and a main column with build-set/party controls plus Skills/Equipment
  workspace tabs.
- Completed capabilities remain valuable but should move behind secondary entry points. EPIC-18
  should not delete stable reducers, domain contracts, template compatibility, persistence,
  equipment, build-set, or party functionality unless a later explicit cleanup ticket asks for it.

## Recent Sprint Context

- `SPRINT-009` shipped the core single-build editor: app catalog boundary, raw template overlay,
  profession/mode controls, attribute editor, skill browser, eight-slot skill bar, skill display,
  template import/export dialogs, validation, and responsive integration.
- `SPRINT-010` shipped local library, working-draft autosave, saved records, share URLs,
  backup/restore, freshness diagnostics, and dirty guards under `build-wars:v1`.
- `SPRINT-014` and `SPRINT-015` shipped semantic equipment contracts, editor controls, validation,
  persistence, and selected-loadout omission warnings.
- `SPRINT-016` shipped title-rank defaults, compact title controls, validation, persistence, and
  selected-loadout template/share warnings.
- `SPRINT-017` and `SPRINT-018` shipped neutral multi-build workspaces and optional party
  annotations over build sets, while preserving the one-active-editor invariant.
- Commit `80d2bd8` already refocused the backlog by adding EPIC-18 tickets and
  `compendium/build-composer-use-case.md`.

## Relevant Codebase Areas

- `src/app/App.tsx` is the current composition root and will likely need to own the first-screen
  information architecture change.
- `src/app/components/ProfessionModeEditor.tsx` currently provides text-heavy select controls and
  mode radio buttons. EPIC-18 needs a focused header with primary/secondary icon pickers, an
  editable build name, and predictable "Any" handling where supported.
- `src/app/components/AttributeEditor.tsx` currently uses rank selects and manual add controls.
  EPIC-18 needs in-game-style attribute rows with decrement refund, increment cost, allocated rank,
  effective-rank display affordance, and budget-aware visibility.
- `src/app/components/SkillBar.tsx`, `src/app/drag-payload.ts`, and reducer actions in
  `src/app/editor-state.ts` already support eight slots, drag payloads, pointer operations, and
  keyboard pick/place. EPIC-18 must refine replacement/removal/duplicate movement and one-elite
  enforcement without corrupting raw overlays.
- `src/app/components/SkillBrowser.tsx` and `selectSkillBrowser()` in `src/app/editor-selectors.ts`
  already implement deterministic filtering, grouping, view modes, batches, and drag payloads.
  EPIC-18 needs a right-panel skills catalog tab with selected-profession defaults, attribute
  grouping, collapsible sections, compact row costs, and fewer first-screen manual filters.
- `src/app/components/TemplateDialogs.tsx`, `src/app/template-workflow.ts`, and export policy
  selectors already own exact-source replay, canonical export gates, and transactional imports.
  EPIC-18 should move template code inline without weakening these policies.
- `src/app/catalogs.ts` exposes catalog views and placeholder descriptors while keeping generated
  JSON imports centralized. Icon work must respect this boundary and the source policy.
- `src/app/styles.css` owns the current visual system and responsive layout. EPIC-18 will likely
  make substantial CSS changes and should verify narrow-screen no-overlap behavior.
- `compendium/build-composer-use-case.md`, `compendium/core-build-editor.md`,
  `compendium/local-library-and-sharing.md`, `compendium/multi-build-workspace.md`,
  `compendium/visual-prior-art.md`, and `README.md` are closeout documentation candidates.
- `work/tickets/18-focused-build-composer/*.md`, `work/sprints/ledger.tsv`, and the ticket-burn run
  manifest must remain consistent with the planned sprint.

## Constraints

- Follow `AGENTS.md`: keep human-facing communication concise and direct.
- This planning run may write planning, ticket, ledger, run-state, and manifest artifacts only. It
  must not modify implementation code or create a commit.
- Use `work/sprints`, not `docs/sprints`, for final and draft sprint artifacts.
- Preserve existing domain, catalog, template, validation, editor reducer, persistence, build-set,
  party, and equipment behavior. The first-screen pivot is an app composition and interaction
  change, not a schema reset.
- Keep `src/domain/**` framework-neutral and do not introduce React, DOM, storage, generated-data,
  or app imports there.
- Keep generated catalog imports isolated to `src/app/catalogs.ts`. Leaf components receive
  app-ready views, placeholder/icon descriptors, attribution, and validation slices.
- Do not hot-link wiki media at runtime. Real profession/skill/resource icons require approved
  local/static assets or a source-policy-compliant cached asset path.
- Keep skill-template import/export selected-loadout semantics and exact-source/canonical export
  gates intact. "Any" profession is a composer/filtering convenience and must not silently produce
  invalid template output.
- Attribute state must keep purchased rank separate from effective rank so future rune/headgear and
  equipment-derived bonuses can plug in cleanly.
- Avoid pulling deferred use cases back into the primary milestone: equipment editing, saved build
  management, build sets, party tools, guide authoring, broad discovery, advanced analysis,
  external team codecs, backend sync, accounts, collaboration, hosted sharing, PWA, and analytics.
- No new runtime dependency should enter the plan unless execution proves an existing browser/API
  primitive cannot support the required interaction.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-1801 through BW-1809 in dependency order with file-level tasks, verification gates, and closeout
  records.
- A documented, stable first-screen information architecture where the left side is the active
  build composer and the right side is a catalog surface.
- A composer shell that makes single-build creation/import/export immediately available and moves
  library, equipment, build-set, party, sharing, and validation details into secondary or collapsed
  surfaces without deleting stable functionality.
- A header with compact primary/secondary profession icon pickers, an editable build name, and
  explicit "Any" semantics that do not weaken validation or template export.
- Attribute rows that show refund cost, investment cost, allocated rank, effective-rank affordance,
  attribute label, budget state, and accessible increment/decrement behavior based on existing
  point rules.
- A refined skill bar that supports drag placement, replacement, duplicate movement, reordering,
  removal, keyboard alternatives, raw-overlay preservation, and one-elite replacement behavior.
- Inline template import/export that keeps the current code visible, copyable, selectable, and
  paste/importable transactionally while preserving exact-source and canonical export policies.
- A right-panel skill catalog tab with selected-profession defaults, attribute grouping,
  collapsible sections, compact icon/name/cost rows, useful empty states, and drag-to-bar behavior.
- Icon and visual polish that uses approved local/static assets or catalog-safe placeholders,
  resource/cast/recharge iconography, stable dimensions, focus states, and no text overlap.
- Focused reducer, selector, component, and workflow tests plus final `npm run verify`.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-18, BW-1801 through BW-1809,
  `compendium/build-composer-use-case.md`, existing editor/template/rule-engine behavior, and
  current tests.
- Spec/documentation:
  - `work/tickets/18-focused-build-composer/EPIC.md`
  - `work/tickets/18-focused-build-composer/BW-180*.md`
  - `compendium/build-composer-use-case.md`
  - `work/sprints/SPRINT-009.md`, `SPRINT-010.md`, `SPRINT-017.md`, and `SPRINT-018.md`
  - `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`,
    `compendium/multi-build-workspace.md`, `compendium/visual-prior-art.md`,
    `compendium/source-policy.md`, and `README.md`
- Edge cases identified:
  - first boot, restored single-build draft, restored build-set draft, restored party draft, share
    URL boot, catalog adaptation error, local-storage write-blocked state, and storage banner
    visibility
  - selected-loadout-only behavior when the current document is a build set or party
  - "Any" primary or secondary profession filtering, attribute visibility, validation issues,
    template import, exact-source replay, and canonical export blocking
  - long build names, long skill names, long attribute names, missing cost facts, zero/special
    resource facts, elite labels, unresolved raw template facts, and retained stale rows
  - duplicate skill placement, replacing occupied slots, moving filled slots, dragging off-bar,
    keyboard pick/place/cancel, clearing unresolved slots, one-elite replacement, and invalid drag
    payloads
  - import success, parse/decode/resolve failure, clipboard success/failure, selectable fallback,
    dirty-guard cancellation, equipment/title omission warnings, and imported chat-wrapper names
  - responsive desktop and narrow-screen layouts, tab/panel focus order, collapsible catalog groups,
    stable slot dimensions, hover/focus states, no text overlap, and no layout shift during drag or
    dynamic validation changes
  - source-policy behavior for profession/skill/resource icons: no runtime remote media URL in
    components unless a later policy-compliant asset pipeline explicitly approves it
- Testing approach:
  - reducer tests for one-elite replacement, duplicate movement, removal target behavior,
    raw-overlay preservation, build-name changes, and "Any" profession state if represented in
    app state
  - selector tests for focused attribute row costs/refunds/effective-rank flags, selected-profession
    catalog defaults, grouped/collapsible skill catalog output, compact cost fields, and export
    policy visibility
  - component tests for composer shell first-screen rendering, profession icon pickers, attribute
    increment/decrement rows, skill bar drag/keyboard workflows, inline template import/export,
    catalog tab grouping/collapse, empty/error states, storage/catalog banners, and secondary
    library/equipment/build-set/party access
  - workflow tests for restored local drafts, share-fragment import, selected-loadout-only import
    and export, dirty guard, clipboard fallback, and validation updates
  - documentation/ticket review and final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium - core domain and template behavior already exists, but the
  composer must preserve many selected-loadout, raw-overlay, storage, and validation invariants
  while changing the visible workflow.
- Scope uncertainty: Medium - EPIC-18 covers product IA, layout, controls, drag/drop, template
  workflow, catalog presentation, visual polish, and closeout. The tickets are groomed, but one
  sprint will require strict MVP boundaries around deferred library/equipment/party use cases.
- Architecture uncertainty: Low-Medium - the work can extend existing app-layer patterns without
  new external integrations, but the "Any" profession representation and runtime icon asset path
  need explicit binding decisions during implementation.

## Open Questions

Questions for the draft lanes to answer without blocking planning:

1. Should the composer become the primary `App.tsx` composition directly, or should it be introduced
   as a dedicated `BuildComposer` component that receives existing editor/workspace props?
2. What is the lowest-risk way to represent the app-specific "Any" profession option without
   confusing domain `ProfessionId | null`, validation, or template export?
3. Which existing library, build-set, party, sharing, validation, equipment, and title-rank surfaces
   should remain visible in the first viewport, collapse behind secondary controls, or move below
   the composer?
4. How should one-elite replacement work when the dropped elite is already on the bar, when the
   destination is occupied, or when unresolved/raw template slots are present?
5. Can EPIC-18 use catalog placeholder descriptors plus local CSS/resource glyphs for MVP icon
   polish, or does it need a policy-approved static asset cache before BW-1808 can be done?
6. Which focused tests are sufficient to prove the composer-first pivot without rewriting the
   entire existing App test suite?
