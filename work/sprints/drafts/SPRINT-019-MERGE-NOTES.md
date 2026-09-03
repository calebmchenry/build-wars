# SPRINT-019 Merge Notes

## Source Artifacts

- Intent: `work/sprints/drafts/SPRINT-019-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-019-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-019-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-019-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-019-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-019-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-019-GPT54-CRITIQUE.md`

## Local Feasibility Notes

- `codex exec` is available as `codex-cli 0.152.0`.
- The documented `--full-auto` flag is not accepted by this CLI. As in recent ticket-burn runs, the
  working command shape is `codex exec -m <model> -c 'model_reasoning_effort="..."'
  --dangerously-bypass-approvals-and-sandbox`.
- `gpt-5.5` and `gpt-5.4` draft and critique lanes completed with
  `model_reasoning_effort="xhigh"`.
- The first `gpt-5.6-sol` draft lane ran past the normal wait without writing the requested
  artifact and logged a patch-like payload instead. It was stopped and retried with
  `model_reasoning_effort="high"`, which produced a complete draft artifact. The retry parent
  process lingered after writing the artifact and was stopped.
- `gpt-5.6-sol` critique used the same `high` fallback and completed successfully.
- Existing sprint files and `work/sprints/ledger.tsv` end at completed `SPRINT-018`, so
  `SPRINT-019` is the next sprint ID.
- EPIC-18 depends on completed EPIC-03, EPIC-04, EPIC-05, EPIC-06, EPIC-07, and EPIC-08. Later
  completed sprints through SPRINT-018 are also stable inputs because EPIC-18 is a product pivot
  over the current app.
- No high-risk architecture choice required interview interruption. The final sprint binds
  conservative defaults under the non-interactive ticket-burn contract.

## Consensus

The model lanes agreed on the core direction:

- SPRINT-019 should be an app-layer composer-first pivot, not a domain, template, persistence, or
  data-ingestion rewrite.
- Existing single-build, build-set, party, equipment, title, local-library, sharing, validation,
  backup/restore, and transfer behavior must remain available as secondary capabilities.
- `Any` should be UI language over existing nullable profession state, not a new domain or template
  value.
- Runtime generated catalog imports must remain centralized in `src/app/catalogs.ts`.
- Real icon binaries cannot be assumed; policy-safe placeholders and product-owned glyphs must be a
  complete fallback.
- Inline template import/export must preserve exact-source replay, canonical proof, transactional
  import, selected-loadout-only behavior, dirty guards, and omission warnings.
- Skill-bar drag/click/keyboard operations need one shared behavior policy with raw-overlay
  preservation and one-elite enforcement.

## Accepted Critiques

1. **Use the `gpt-5.6-sol` draft as the binding architecture base.** It was strongest on
   selected-loadout preservation, Any semantics, raw overlays, catalog boundaries, template policy,
   icon policy, and segmented Definition of Done.
2. **Borrow `gpt-5.4`/`gpt-5.5` execution hygiene.** The final sprint adds a baseline-first
   topology, explicit final broad regression command, `git diff --check`, and manual evidence
   matrix.
3. **Add an early durability gate.** The final sprint inserts Phase 1A to prove shell refactoring
   preserves single-build, build-set, and party selected-loadout state before deeper UI replacement.
4. **Make the scope cut line explicit.** Real icon binaries, touch-specific drag, broader catalog
   tabs, and modal template cleanup are deferrable. The mandatory outcome is a safe, accessible,
   preservation-complete focused composer.
5. **Keep catalog facts out of reducers.** The final sprint uses an app-layer placement planner and
   catalog-free atomic reducer application.
6. **Define transient UI ownership.** Picker open state, group collapse, copy status, import draft,
   and secondary disclosure state are UI/composer state and must not be serialized.
7. **Separate naming facts.** Active build name, saved-record name, build-set entry label, party slot
   label, raw template wrapper name, exact-source replay, canonical output, and dirty state all
   require explicit behavior.
8. **Require a skill placement matrix.** The final sprint includes a normative behavior table for
   catalog placement, bar movement, replacement, duplicate movement, elite replacement, explicit
   removal, invalid payloads, and unresolved raw slots.
9. **Strengthen secondary reachability.** "Reachable" is replaced with keyboard access, focus
   restoration, dirty guards, dialog ownership, selected context, and no-selection recovery.
10. **Strengthen no-remote-media acceptance.** The final sprint requires tests or review proving
    metadata-only media URLs do not reach runtime media/fetch paths.

## Rejected or Trimmed

- A new persisted Any sentinel was rejected. Existing nullable profession fields remain sufficient.
- A domain or local-library schema migration was rejected. Composer UI state stays out of persisted
  snapshots.
- Reducer-owned catalog/elite decision logic was rejected because reducers must not import catalogs
  or trust drag payloads for facts.
- Drag-off deletion was rejected as an authoritative behavior. Only explicit clear commands or a
  visible removal target delete.
- Mandatory modal template removal was trimmed. Inline parity is required; removal is optional after
  tests pass.
- Mandatory real icon binaries were trimmed. Placeholders and local glyphs are complete unless exact
  source-policy approval exists.
- New routes, workers, runtime dependencies, backend sync, accounts, analytics, service workers,
  broad discovery, recommendation logic, and extra catalog tabs remain out of scope.

## Interview

The automation contract requested non-interactive planning and allowed interview skipping unless a
high-risk architecture choice appeared. The architecture choices were resolved with conservative,
testable defaults, so routine confirmation was skipped.

## Auto-Approval

The final sprint is auto-approved for planning because it is internally consistent, dependency
ordered, executable, records assumptions and defaults, and stays within the no-code-change planning
boundary.
