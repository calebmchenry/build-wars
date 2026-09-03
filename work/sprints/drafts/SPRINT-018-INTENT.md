# Sprint 018 Intent: Party Semantics and Sharing

## Seed

Create a ticket-burn sprint from `work/tickets/17-party-and-hero-builder/EPIC.md` for
`EPIC-17 Party Semantics and Sharing`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-17`
- source_epic_path: `work/tickets/17-party-and-hero-builder/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-018.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-17` and BW-1702 through BW-1706,
ledger sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-17-result.json`.

## Context

- `SPRINT-001` through `SPRINT-017` are completed in `work/sprints/ledger.tsv`; `SPRINT-018` is the
  next sprint ID.
- `EPIC-17` is `ready`, depends on completed EPIC-16, and has five ready MVP tickets: BW-1702
  through BW-1706. BW-1701 remains a low-priority parking-lot ticket for external team-template
  compatibility and should not be pulled into this sprint.
- SPRINT-017 shipped neutral build sets with up to 16 complete loadouts, one active editor plus
  inactive `PersistedBuildSnapshot`s, schema-2 mixed local documents, aggregate per-entry
  validation, variant comparison, whole-library backup/restore, and Build Wars JSON build-set
  transfer.
- Existing build-set semantics are intentionally party-neutral. EPIC-17 should layer party/team
  annotations, party-specific labels, validation, and sharing behavior on top of build sets instead
  of changing the meaning of `BuildSetEntryKind = "build" | "variant" | "freeform"`.
- The current `src/domain/party.ts` is only an early placeholder and should not force the
  implementation shape. If retained, it should be replaced or isolated behind the new party
  annotation contracts.

## Recent Sprint Context

- `SPRINT-009` shipped the core editor, skill bar, validation panel, template dialogs, and
  responsive app shell for one selected loadout.
- `SPRINT-010` shipped local library, working-draft autosave, saved records, dirty guards, share
  URLs, backup/restore, freshness diagnostics, and storage failure behavior.
- `SPRINT-014` and `SPRINT-015` added semantic equipment contracts, editor controls, validation,
  persistence, backup/restore, and share omission warnings.
- `SPRINT-016` added title-rank override state, title controls, validation cleanup, and persistence
  integration.
- `SPRINT-017` shipped neutral multi-build workspaces and explicitly deferred party slots, party
  legality, hero identity, portraits, AI notes, paw-ned2/team templates, guide publishing, backend
  sync, collaboration, and remote media to later work.

## Relevant Codebase Areas

- `src/domain/build-set.ts` defines the neutral framework-independent build-set contract, entry
  IDs, entry kinds, labels, notes, ordering helpers, deep-clone helpers, caps, and dangerous-key
  guard.
- `src/app/build-set-state.ts` owns runtime build-set documents, selected-entry switching,
  materialization, add/copy/duplicate/remove/reorder/rename/kind/notes actions, and comparison
  target state.
- `src/app/persistence-schema.ts`, `src/app/local-storage.ts`, and related tests own schema-2 local
  documents, persisted build-set snapshots, saved records, working drafts, write-blocking recovery,
  and schema-1 migration.
- `src/app/build-set-selectors.ts` and `src/app/components/BuildSetNavigator.tsx` own compact
  build-set summaries, aggregate per-entry validation, attention rows, selection, empty states,
  labels, kinds, notes, and transfer entry points.
- `src/app/build-set-transfer.ts` and `src/app/components/BuildSetTransferDialog.tsx` own inert
  Build Wars build-set JSON export/import, preview, apply, byte caps, entry caps, and dangerous-key
  rejection.
- `src/app/components/ShareControls.tsx` and `src/app/template-workflow.ts` keep skill templates and
  share URLs selected-loadout-only and report omitted local-only state.
- `README.md`, `compendium/multi-build-workspace.md`, `compendium/local-library-and-sharing.md`,
  `compendium/core-build-editor.md`, `compendium/game-rule-engine.md`, and
  `compendium/visual-prior-art.md` are closeout documentation candidates.
- `work/tickets/17-party-and-hero-builder/*.md`, `work/sprints/ledger.tsv`, and the ticket-burn run
  manifest must remain consistent with the planned sprint.

## Constraints

- Follow `AGENTS.md`: keep human-facing communication concise and direct.
- This planning run may write planning, ticket, ledger, run-state, and manifest artifacts only. It
  must not modify implementation code or create a commit.
- Use `work/sprints`, not `docs/sprints`, for final and draft sprint artifacts.
- Preserve existing single-build and neutral build-set workflows. Users who do not opt into party
  mode should not see build sets become party-only objects.
- Party semantics must be lightweight, user-authored, and local-first: no required hero catalog,
  henchman catalog, portraits, unlock tracking, hero AI behavior, backend sync, accounts, hosted
  sharing, guide recommendations, or new runtime dependencies.
- Treat paw-ned2 and external team-template compatibility as explicitly deferred. The only near-term
  sharing commitments are native Build Wars party JSON and practical one-code-per-member skill
  template copying.
- Keep party validation narrow and explainable: incomplete members, empty required slots, preset
  size mismatches, duplicate/invalid slot ordering, mode consistency, unresolved entries, and
  aggregate per-loadout issues. Do not add synergy scoring, build quality advice, meta checks, or
  party composition recommendations.
- Keep generated data imports behind `src/app/catalogs.ts`; party UI can use existing app catalog
  views for profession/skill/equipment summaries but should not add runtime source-data pipelines.
- Party metadata must survive local-library saved records, working drafts, duplicate records,
  backup/restore, build-set transfer, native party import/export, and selected-loadout template
  import without losing member labels or roles.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-1702 through BW-1706 in dependency order with file-level tasks, verification gates, and closeout
  records, while leaving BW-1701 parked outside MVP scope.
- Party annotations over existing build sets with a clear persisted contract for party mode,
  party-size presets, ordered member slots, empty slots, member labels, freeform roles, member kind
  labels, notes, and durable migration/default behavior.
- A party workspace UI that reuses the SPRINT-017 selected-editor model while making party members,
  slots, roles, profession pairs, skill bars, equipment summaries, validation state, empty members,
  add/remove/duplicate/reorder, and responsive behavior readable.
- Party-level validation that aggregates per-loadout validation and adds deterministic structural
  party issue codes without blocking single-member editing or judging build quality.
- Native party export/import and multi-code copy/share flows that preserve full Build Wars data in
  JSON, copy individual skill template codes when representable, define limits/fallbacks, and keep
  external team-template absence explicit.
- Local library, autosave, backup/restore, build-set transfer, and selected-loadout template import
  behavior that preserve party metadata and avoid silent downgrade/data loss.
- Docs, tickets, sprint records, ledger, and run manifest that agree on `SPRINT-018`, `EPIC-17`,
  assumptions, deferred scope, and no-code-change planning boundary.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-17 grooming decisions, BW-1702
  through BW-1706 acceptance criteria, SPRINT-017 build-set contracts, existing local-library and
  template sharing behavior, and current app/domain tests.
- Spec/documentation: `work/tickets/17-party-and-hero-builder/EPIC.md`,
  `work/tickets/17-party-and-hero-builder/BW-170*.md`, `work/sprints/SPRINT-017.md`,
  `compendium/multi-build-workspace.md`, `compendium/local-library-and-sharing.md`,
  `compendium/core-build-editor.md`, `compendium/game-rule-engine.md`,
  `compendium/visual-prior-art.md`, and current app/domain tests.
- Edge cases identified:
  - converting an existing neutral build set into party mode and turning party mode off without
    losing underlying loadouts
  - empty party slots, no selected member, one-member parties, common preset sizes, over-limit sizes,
    stale selected slot IDs, duplicate slot IDs, and reordered slots
  - member labels, roles, kind labels, notes, and long text normalization across save/load,
    autosave, duplicate record, backup/restore, transfer, native party import/export, and template
    import into the selected member
  - incomplete loadouts, unresolved raw template facts, missing professions, empty skill bars,
    semantic equipment, title-rank overrides, stale saved-with facts, and catalog-unavailable states
  - mixed PvE/PvP/unknown modes across party members and empty slots
  - native JSON with malformed structure, dangerous keys, unsupported schema versions, byte limits,
    missing party metadata, and imported neutral build-set data
  - multi-code copy when some members have unrepresentable skill bars, unsupported equipment/title
    state, unresolved data, empty slots, or oversized clipboard text
  - selected-loadout share URL behavior from party mode and clear omission warnings for sibling
    members and party metadata
  - responsive layout, keyboard selection, focus order, validation links, long labels, empty-state
    affordances, and no-overlap rendering at narrow widths
- Testing approach:
  - focused domain tests for party annotation contracts, presets, normalization, slot/member helper
    behavior, validation issue codes, malformed input, dangerous keys, caps, and migration defaults
  - app reducer/state tests for converting build sets to parties, toggling party mode, adding empty
    slots, selecting members, preserving active editor changes, reorder, duplicate, remove, label,
    role, kind, preset, and template-import behavior
  - persistence/local-storage/backup/transfer tests for party metadata in working drafts, saved
    records, record duplication, backup/restore, native party import/export, old neutral build-set
    documents, malformed party data, bounds, and write-blocking recovery
  - selector/component tests for party overview, slot/member cards, validation summaries, empty
    states, responsive behavior, copy/share controls, keyboard/pointer flows, and long text
  - regression tests for neutral build sets, single-build editor, local library, selected-loadout
    share URLs, template dialogs, equipment, title controls, and validation panel
  - final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium - party metadata is conceptually small, but it must remain durable
  across the existing active/inactive build-set materialization paths without corrupting neutral
  build-set semantics.
- Scope uncertainty: Medium - the epic spans domain, reducer, persistence, UI, validation, sharing,
  and docs, but the MVP tickets are groomed and deliberately exclude hero catalogs and external
  codecs.
- Architecture uncertainty: Low-Medium - the sprint extends SPRINT-017 patterns and has no new
  external integration, but the persisted annotation shape must be explicit enough for future hero
  identity and external codec work.

## Open Questions

Questions for the draft lanes to answer without blocking planning:

1. Should party metadata live as an optional annotation on `PersistedBuildSetSnapshot`, as a separate
   app-level `PartyBuildSetSnapshot`, or as a wrapper document kind around an existing build set?
2. How should empty party slots be represented without weakening the invariant that build-set
   entries hold complete loadouts?
3. Which common party-size presets should be built into MVP, and how should custom sizes interact
   with the SPRINT-017 16-entry cap?
4. What exact member kind labels are useful now without implying a hero/henchman catalog or unlock
   model?
5. Which party-level validation codes are structural enough for MVP, and which checks must be
   deferred to EPIC-21-style analysis?
6. Should native party export reuse the existing build-set transfer envelope with party metadata, or
   introduce a distinct `build-wars-party-transfer` envelope to avoid semantic ambiguity?
7. What is the most practical multi-code clipboard format when some members are empty, unresolved,
   or not skill-template-representable?
