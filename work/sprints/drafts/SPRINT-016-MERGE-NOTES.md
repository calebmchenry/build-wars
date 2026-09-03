# SPRINT-016 Merge Notes

## Source Artifacts

- Intent: `work/sprints/drafts/SPRINT-016-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-016-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-016-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-016-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-016-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-016-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-016-GPT54-CRITIQUE.md`

## Local Feasibility Notes

- `codex exec` is available as `codex-cli 0.152.0`. The documented `--full-auto` flag is not
  accepted by this version, so the resolved command family used for all draft and critique lanes was
  `codex exec -m <model> -c 'model_reasoning_effort="xhigh"' --dangerously-bypass-approvals-and-sandbox`.
- Existing sprint files end at `SPRINT-015`, and `work/sprints/ledger.tsv` marks `001` through
  `015` completed, so `SPRINT-016` is the next sprint ID.
- The promoted skill catalog currently exposes eight raw title-rank keys. Planning verified these
  domains from `data/generated/epic-04/skills.catalog.json`:
  - `title:allegiance-rank`: `0-12`
  - `title:asura-rank`: `0-10`
  - `title:deldrimor-rank`: `0-10`
  - `title:ebon-vanguard-rank`: `0-10`
  - `title:lightbringer-rank`: `0-12`
  - `title:norn-rank`: `0-10`
  - `title:sunspear-rank`: `0-10` and `0-12`
  - `title:title-sunspear-rank`: `0-15`
- No high-risk architecture choice requires interview interruption. The risky choices are captured
  as binding implementation decisions and Phase 0 gates in the final sprint.

## Consensus

The model lanes agreed on the core shape:

- Reuse EPIC-04 skill progression metadata. Do not add title ingestion, account title ownership,
  title acquisition data, or runtime source fetches.
- Make title rank configuration semantic per-build state because it changes displayed skill output,
  validation, saves, duplication, backup/restore, and share omission behavior.
- Store only authored non-default override entries. No override means implicit max-rank behavior.
- Centralize title dependency discovery, aliasing, rank-domain analysis, and effective-rank
  projection in one pure domain helper used by both app selectors and validation.
- Put compact controls in the existing Skills workspace, with relevant controls first and an
  optional all-title view.
- Preserve the existing PvE-only count rule and skill-template/share payload formats.

## Accepted Critiques

1. **Use the strict contract baseline from GPT-5.6 Sol.** The final sprint keeps its explicit
   schema/persistence, exact alias handling, validation-code replacement, and security constraints.
2. **Use the clearer phase flow from GPT-5.4 and GPT-5.5.** The final sprint trims the draft into
   decision gate, domain/state/persistence, controls, rendering, validation/PvE, and closeout.
3. **Bump the nested build schema.** Title ranks are semantic authored build state, so the final
   sprint chooses `Build.schemaVersion = 2` while keeping `LocalLibraryEnvelopeV1` and
   `build-wars:v1` unchanged.
4. **Persist a required normalized runtime array.** Runtime `Build` objects use a bounded, sorted,
   unique `titleRankOverrides` array. Schema-1 persisted input migrates to schema 2 with an empty
   array without dirtying or immediately rewriting old libraries.
5. **Handle Sunspear as a visible metadata conflict.** The final sprint collapses the exact Sunspear
   aliases to one user-facing control, preserves per-series implicit maxima when no override exists,
   limits explicit overrides to common exact rows, and keeps conflict diagnostics visible.
6. **Replace broad title deferral codes.** The final sprint retires generic
   `skill.title-deferred` and `skill.allegiance-deferred` emissions in favor of narrower issue
   codes and advances `RULE_ENGINE_VERSION` to `rule-engine:v3`.
7. **Retain structurally safe stale overrides.** Malformed, duplicate, unsafe, oversized, or
   unsupported structures are rejected deterministically. Unknown but syntactically safe canonical
   entries remain recoverable and resettable with warnings.
8. **Warn only on authored payload loss.** Share/export/import warnings are required for non-empty
   authored title overrides, not for implicit max behavior alone.
9. **Add performance and accessibility gates.** The final sprint requires precomputed title catalogs
   and manual smoke coverage for focus, announcements, long labels, mobile number input, and pinned
   tooltip updates.

## Rejected Or Trimmed

- Reusing `skill.title-deferred` and `skill.allegiance-deferred` with changed meaning was rejected.
  That would make validation freshness and UI copy ambiguous.
- Envelope-plus-per-series-clamping for explicit Sunspear overrides was rejected. It can make one
  authored rank render as multiple effective ranks without a clear user model.
- An optional runtime `titleRankOverrides` field without a build schema bump was rejected. It saves
  little and spreads absent-versus-empty branching through reducers, selectors, validation, and
  persistence.
- A separate title catalog or title ingestion pass was rejected as out of scope unless Phase 0 proves
  EPIC-04 metadata cannot support the feature.
- Warning for implicit max ranks in share/export was rejected as noise. Only authored overrides are
  omitted by current template/share formats.

## Interview

The automation contract requested non-interactive planning and allowed interview skipping unless a
high-risk architecture choice appeared. The final sprint records the material assumptions and
binding decisions, so routine confirmation was skipped.

## Auto-Approval

The final sprint is auto-approved for planning because it is internally consistent, dependency
ordered, executable, and records the decisions needed to keep implementation bounded.
