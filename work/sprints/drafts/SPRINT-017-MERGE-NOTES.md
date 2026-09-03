# SPRINT-017 Merge Notes

## Source Artifacts

- Intent: `work/sprints/drafts/SPRINT-017-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-017-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-017-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-017-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-017-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-017-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-017-GPT54-CRITIQUE.md`

## Local Feasibility Notes

- `codex exec` is available as `codex-cli 0.152.0`. The documented `--full-auto` flag is not
  accepted by this version, so the resolved command family used for all draft and critique lanes was
  `codex exec -m <model> -c 'model_reasoning_effort="xhigh"' --dangerously-bypass-approvals-and-sandbox`.
- Existing sprint files end at `SPRINT-016`, and `work/sprints/ledger.tsv` marks `001` through
  `016` completed, so `SPRINT-017` is the next sprint ID.
- EPIC-16 is ready and has six groomed ready tickets: BW-1601 through BW-1606.
- The current implementation already has one active single-build editor, `PersistedBuildSnapshot`,
  local storage, backup/restore, semantic equipment, title-rank overrides, and validation surfaces
  that can be composed into a build-set workspace.
- No high-risk external integration, source-data, dependency, backend, or party-template choice is
  required. The material architecture choices are bound in the final sprint rather than left to
  interview.

## Consensus

The model lanes agreed on the core architecture:

- Preserve the current single-build workflow for users who do not create a build set.
- Add a neutral build-set model instead of reusing party, hero, guide, or team-template structures.
- Keep exactly one active `EditorState`; inactive loadouts persist as complete snapshots.
- Store entry loadouts with `PersistedBuildSnapshot`, not bare `Build`, so PvE budget and raw
  template facts survive switching.
- Reuse existing per-build validation, equipment, title-rank, template, share, storage, and
  backup/restore patterns.
- Keep share URLs and skill-template import/export selected-loadout-only.

## Accepted Critiques

1. **Use the GPT-5.6 Sol architecture as the base.** It was strongest on active/inactive state,
   schema migration, identity scopes, materialized snapshots, recovery boundaries, and DoD depth.
2. **Split oversized phases.** The final sprint separates core contracts, core state/persistence,
   library/app integration, navigation, variants/comparison, validation/transfer/backup, and
   closeout.
3. **Advance the envelope schema to version 2.** Keeping `LOCAL_LIBRARY_SCHEMA_VERSION = 1` while
   adding build-set fields would make one version mean two grammars and lets older code drop unknown
   fields on write. The final sprint keeps `build-wars:v1` as the discovery key but bumps the
   payload schema.
4. **Use a discriminated document model.** Final persistence normalizes saved and working documents
   as `kind: build | build-set` rather than maintaining parallel `savedBuilds` and `savedBuildSets`
   arrays.
5. **Keep selection app-owned.** The framework-neutral domain `BuildSet` contains ordered entries.
   `lastSelectedEntryId` is durable app/workspace state for resume behavior, not authored semantic
   build-set content.
6. **Avoid overlapping metadata fields.** The final MVP keeps set name, saved-record notes, entry
   label, entry kind, and entry notes. It does not add separate set description and entry
   description fields.
7. **Make promotion kind-only.** Promotion changes an entry to `kind: build`; ordering remains a
   separate explicit action. No primary/base/party slot is introduced.
8. **Lower the initial cap to 16 entries.** The sprint requires storage-size and interaction-cost
   evidence at the cap before closeout.
9. **Require compact comparison and set transfer, but gate them after durability.** Comparison and
   inert JSON transfer are committed EPIC-16 outputs, but they come after switching, persistence,
   and library compatibility are stable.
10. **Add ingress and failure matrices.** The final sprint explicitly covers startup share URLs,
    template import, library load, restore apply, set import, quota failure, pagehide failure,
    revision conflict, both-draft conflict, and empty/no-selection behavior.

## Rejected Or Trimmed

- Additive schema-1 persistence was rejected because it creates ambiguous version semantics and
  downgrade data-loss risk.
- Parallel saved-build and saved-build-set arrays were rejected for the final normalized model. A
  migration helper may read old schema-1 fields, but runtime code consumes a discriminated document
  collection.
- Persisting selected entry in the domain `BuildSet` was rejected. Selection is an app resume cursor,
  not the neutral authored set model.
- Primary-entry semantics were rejected. EPIC-16 owns ordering and lightweight kinds only; EPIC-17
  can add party or primary annotations later if needed.
- Separate set description and entry description fields were trimmed to avoid four overlapping text
  surfaces. Record notes and entry notes cover the MVP.
- Full multi-pane editing, role analysis, recommendations, hero catalogs, party rules, paw-ned2,
  team-template export, backend sync, remote media, and new dependencies remain out of scope.

## Interview

The automation contract requested non-interactive planning and allowed interview skipping unless a
high-risk architecture choice appeared. The risky local choices were resolved conservatively in the
final sprint, so routine confirmation was skipped.

## Auto-Approval

The final sprint is auto-approved for planning because it is internally consistent, dependency
ordered, executable, and records the decisions needed to keep implementation bounded.
