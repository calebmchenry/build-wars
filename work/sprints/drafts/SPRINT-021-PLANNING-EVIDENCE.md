# SPRINT-021 Planning Evidence

## Baseline and command resolution

Planning began from clean HEAD `bbc162f`. All twenty existing ledger entries are
completed. No implementation tests or browser checks have been performed by this
planning invocation. The supervisor supplied the passing baseline recorded in
the intent. Product behavior in the brief remains future work.

`whence -va codex` resolved a direct executable, no alias/function wrapper:
`/Users/calebmchenry/.nvm/versions/node/v22.11.0/bin/codex`.
`codex exec --help` confirms `--approve-for-me` and workspace-write support;
`--full-auto` is unsupported. The existing authentication/configuration remains
in use. Resolved commands for both draft and critique phases:

```sh
GPT6ASTRA_CLI="codex exec -m gpt-6-astra -c 'model_reasoning_effort=\"xhigh\"' --approve-for-me"
GPT56SOL_CLI="codex exec -m gpt-5.6-sol -c 'model_reasoning_effort=\"xhigh\"' --approve-for-me"
GPT55_CLI="codex exec -m gpt-5.5 -c 'model_reasoning_effort=\"xhigh\"' --approve-for-me"
```

Commands use the resolved executable with prompt
files provided on stdin and stdout/stderr redirected to each Markdown artifact's
`.log`. Each lane may write only its assigned artifact. No bypass/never-approval,
auth-context reset, or unrestricted sandbox flags are used. Long runtimes are
expected; quiet execution alone is not grounds for retry.

## Planning observations

- `BUILD_SCHEMA_VERSION` is 4; local library envelope is 2 at `build-wars:v1`;
  persisted build-set snapshot is 2. Guide has no existing persisted kind.
- `BuildComposer` disables catalog placement without a selected loadout; guide
  prose insertion needs its own catalog intent and no-build behavior.
- `App.tsx` has a global tooltip projection and early catalog-error return.
  Guide context and source recovery require explicit alternatives at both seams.
- `WorkspaceDocument` / `PersistedDocument` only cover build/build-set; selectors,
  materializers, clones, fingerprints, save/restore and template callbacks need
  exhaustive handling, not just an added UI discriminator.
- Planning artifacts under `work/sprints/drafts/` and run artifacts are excluded
  by Prettier defaults. New sprint/ticket files must satisfy repository formatting;
  focused validation can explicitly include ignored planning artifacts.

## Lane results and final checks

All three draft and all three critique processes exited 0 and wrote their assigned
Markdown artifacts. Synthesis is complete; no prototype or product verification
evidence is inferred from planning. Final artifact checks are recorded below.

### Concrete startup correction

All three first launches exited 2 before model execution: `--approve-for-me`
conflicts with an explicit `--sandbox` flag. The CLI help says `--approve-for-me`
selects workspace-write itself. Removed only redundant `-s workspace-write` for
all draft/critique commands; authentication and approval behavior are unchanged.
Original errors are preserved as `*.md.startup-error.log`.

## Dependency and feasibility audit

All eight prerequisite epic frontmatter statuses were read and are `done`:
EPIC-01, EPIC-04, EPIC-05, EPIC-06, EPIC-09, EPIC-16, EPIC-18 and EPIC-19.
The pinned npm executable and `.venv-data/bin/python` exist in this worktree.
No runner burn or implementation was launched during this planning pass.

Further concrete seams for synthesis:

- `SkillTooltipTrigger` has a div root even though its popup uses a body portal;
  inline mentions need an inline trigger, not a block wrapper inside paragraphs.
- `planSkillBarWorkflow` in `skill-bar-workflow.ts` owns duplicate/elite behavior
  and same-bar raw-overlay moves. `applySkillBarIntent` emits both a durable plan
  and a transient message; the guide bridge must create one authored transaction.
- `selectedPersistedBuildSnapshot`, `snapshotsForRecord`, `previewSnapshotForRecord`
  and party-summary helpers assume every non-build document is a build-set.
- `createWorkspaceEnvelope` hardcodes schemaVersion 2. A union/version extension
  must change this writer as well as validators, backups and hydration.
- `useWorkspaceAutosave` and `usePagehideFlush` currently return if `savedWith` is
  null. Guide recovery without catalogs must not depend on a validation result.
- Existing string limits (2,048 generic / 1,000 notes) are unsuitable for full
  guide source; add explicit bounded guide limits instead of weakening all fields.

## Preliminary official documentation review

These are planning observations, not dependency approval or browser feasibility:

- [Tiptap React node views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react)
  document React-backed nodes and attribute updates. This makes Tiptap/ProseMirror
  a plausible candidate for the required embed slice, subject to BW-2001 testing.
- [Tiptap Markdown introduction](https://tiptap.dev/docs/editor/markdown) labels
  its Markdown support beta and warns about unsupported comments. Therefore its
  default serializer alone cannot establish EPIC-20 opaque-content fidelity.
- [ProseMirror guide](https://prosemirror.net/docs/guide/) describes transactional
  state and invertible steps; the custom integration still must demonstrate one
  chronological history including controls outside editable prose.
- Direct current ProseMirror reference and Lexical serialization opens returned
  tool internal errors. Do not describe those failed opens as verified API checks.
  BW-2001 must complete the bounded candidate/license/version/bundle comparison.

## Additional gate checks

The actual `scripts/ticket-burn.py` parser and selector were imported read-only:
EPIC-20 is eligible without bypass flags; the epic lists exactly the twelve
existing tickets; dependencies are ordered and acyclic; there is no active
sprint. This checked parser behavior without launching a burn or its child CLI.

The lane progress inspection after ten minutes showed ongoing code audit, not
an error. It surfaced `SkillBar.handleSlotDragEnd`: dropEffect none removes the
source slot. Parent inspection confirmed this. Guide drag cancellation must
explicitly suppress that legacy deletion path. Existing standalone behavior needs
its own preserved regression contract. SkillBar also uses a fixed skillbar-title
DOM ID; reusing multiple cards requires unique IDs and correct label relations.

`src/domain/index.ts` exports the Guide scaffold and
`test/domain/contracts.test.ts` imports it; evolve these together, with no
invented persisted-guide migration. Existing template import mode follows the
current editor, so source shorthand requires an explicit guide import mode.

All three corrected draft commands exited 0 and produced independent Markdown artifacts. GPT-5.5 finished first; Astra and Sol completed around the expected 10–15 minute window. All three cross-critiques were then launched in parallel using the same corrected command family. Each prompt names only the other two drafts and explicitly prohibits reading its own.

## Final lane results

All cross-critique processes completed with exit 0. There are exactly three model
critique artifacts, each reviewing the other two drafts; no reduced-diversity
fallback or fourth critique was needed. Model commands retained xhigh and the
existing authentication. Only the initial redundant CLI flag was corrected.

The final sprint resolves review findings in its architecture, twelve ticket
phases, B01–B10 browser matrix, Definition of Done and exact dependency table.
All source-ticket acceptance text and dependency lists are retained. BW-2001 is
ready; downstream tickets remain backlog with a planned sprint assignment.

## Final artifact verification

Passed in this planning invocation:

- Actual runner parser/selector: EPIC-20 is eligible, its eight prerequisites are
  done, all twelve exact ticket IDs agree between epic and sprint, and no active
  in-progress sprint exists.
- The ticket dependency lists and complete pre-existing ticket body/acceptance
  text are unchanged. Phase order is acyclic; each ticket links its correct phase.
  BW-2001 is ready and BW-2002–BW-2012 remain backlog, all planned in SPRINT-021.
- Final sprint metadata is planned/auto-approved; all twelve required phase and
  template sections exist; all 68 implementation checkboxes remain unchecked.
- Three draft and exactly three critique artifacts are nonempty and have logs;
  all six model processes exited 0 after the documented startup correction.
- All 77 relative Markdown links across the final sprint, source epic/tickets and
  SPRINT-021 planning Markdown artifacts resolve.
- The ledger retains the exact twenty prior completed rows and adds only 021,
  Markdown Guide Workspace, planned, using the skill ledger sync command.
- The actual runner manifest reader accepts
  `work/runs/ticket-burn/EPIC-20/20260926T232847Z/plan-EPIC-20-result.json` as
  planned. It has exactly the required keys, matching epic/sprint/path, null
  blocked_reason and a nonempty string list of recorded assumptions.
- Focused Prettier checks pass for the final sprint and all twelve tickets.
  Explicit ignore-free checks pass for parent-authored intent, merge notes and
  planning evidence. Independent model drafts/critiques remain original artifacts;
  the repository normally excludes drafts from formatting.
- `git diff --check` passes. Tracked and untracked changes are confined to the
  SPRINT-021 planning artifacts, source epic/tickets and ledger; the ignored run
  manifest/logs are under the authorized run/draft paths. Product code and package
  files were not changed, and no commit was made.

No product implementation suite or actual-browser workflow was run during this
planning-only task. Those remain mandatory execution gates in the final sprint.
The final plan is auto-approved under the explicit automation contract; its
approval does not check off implementation acceptance or waive runner preflight.
