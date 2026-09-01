# SPRINT-003 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-003-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-003-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-003-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-003-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-003-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-003-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-003-GPT54-CRITIQUE.md`

## Command Resolution

- `codex` resolved to `/Users/calebmchenry/.nvm/versions/node/v22.11.0/bin/codex`.
- The installed Codex CLI is `codex-cli 0.152.0`.
- `--full-auto` is not exposed by this CLI; draft and critique lanes used the supported
  non-interactive equivalent `--dangerously-bypass-approvals-and-sandbox`.
- All three lanes ran with `model_reasoning_effort="xhigh"` and produced usable artifacts.

## Orientation Summary

- `SPRINT-001 Project Foundation` and `SPRINT-002 Source Policy and QA` are complete. The repo has a
  React/Vite/TypeScript shell, framework-neutral domain contracts, source-policy and QA compendium
  docs, reserved ignored data artifact directories, and `npm run verify`.
- `EPIC-02 Data Ingestion Platform` is the first sprint that can add offline ingestion tooling under
  `scripts/data`. Runtime app code must not import ingestion modules, fetch live wiki data, or read
  raw snapshots.
- EPIC-01 made `src/domain/source.ts` the canonical provenance, media, snapshot-manifest,
  generated-manifest, and QA contract surface. Python output should use those JSON wire names and
  vocabulary where applicable.
- EPIC-02 already has eight traceability tickets: BW-0201 through BW-0208. They form an ingestion
  spine from API client and snapshots through parser/enumerator, icon metadata, artifact writing, QA,
  and one regenerate command.
- Source-derived live artifacts, generated catalogs, QA reports, icon binaries, screenshots, and
  copied community prose remain ignored or prohibited by default unless a later exact-path policy
  ticket approves them.

## Accepted

- Use GPT-5.6-sol as the main technical base because it best covers MediaWiki safety, immutable
  snapshots, deterministic artifacts, QA gates, parser failure handling, path confinement, and
  runtime isolation.
- Adopt GPT-5.5/GPT-5.4's cleaner phase shape: scaffold/setup first, then client, snapshots,
  parser/enumerator, icon/artifact/QA, and regenerate/docs/closeout.
- Keep the formal ticket graph intact: BW-0203 and BW-0204 are sibling dependents of BW-0201 and
  BW-0202. Schedule the parser spike before icon and broad artifact work to retire risk, but do not
  invent a new ticket dependency.
- Make fast offline ingestion tests mandatory in `npm run verify`. Live wiki refresh remains manual
  and non-blocking for automated verification.
- Keep generated output scope narrow: platform proof artifacts and a skill-ID map, not full
  profession or skill catalog extraction.
- Treat parser and icon work as canaries for later content epics. They must prove behavior,
  diagnostics, and failure semantics without crawling or normalizing the full skill corpus.
- Define deterministic behavior up front: injected clocks for fixture tests, canonical UTF-8 JSON,
  stable ordering, stable QA finding IDs, SHA-256 local digests, and byte-identical fixture reruns.
- Require exact JSON wire alignment for existing `src/domain/source.ts` shapes. Add domain contracts
  only for a proven gap, and keep tool-local shapes local when they are not durable app/domain
  concepts.
- Make icon ambiguity non-selecting by default. A deterministic arbitrary winner is not acceptable
  when multiple plausible files exist.
- Require machine-readable QA JSON and a bounded human-readable summary. Critical or error gates
  must write reports before exiting nonzero.

## Rejected Or Deferred

- Rejected a TypeScript-only ingestion implementation for this sprint. EPIC-02 explicitly prefers a
  Python parser path with `mwparserfromhell`, and using Python isolates wikitext parsing from the
  browser runtime.
- Rejected full dependency hash-lock workflow as a blocker if it becomes disproportionate. The sprint
  must pin or otherwise make the parser dependency reproducible, document setup, and keep verification
  offline; exact hash-locking may be implemented if practical during execution.
- Rejected broad JSON Schema or generated schema tooling. Shared golden fixtures and TypeScript
  structural assertions are sufficient until a second real extractor proves a stronger schema need.
- Rejected making `action=parse` or `action=expandtemplates` a normal extraction path. They remain
  optional live diagnostic fallbacks only if the parser spike records a concrete lossy case.
- Deferred full accepted-risk/release workflow behavior. EPIC-01 vocabulary must be represented, but
  public release approval and broad release attestations remain out of EPIC-02 scope.
- Deferred production generated-data promotion. Later content epics must name exact paths, consumers,
  review evidence, QA closeout, and regeneration commands before committing runtime artifacts.
- Deferred app-side generated-data consumption, attribution UI, media caching, PWA/offline icon
  policy, gameplay rules, template import/export, and complete catalogs.

## Interview

Interview was skipped under the automation contract. Architecture uncertainty is medium rather than
high-risk blocking because EPIC-02 already names the major direction: offline ingestion tooling,
MediaWiki API access, Python plus `mwparserfromhell`, deterministic generated artifacts, and EPIC-01
source-policy gates.

## Assumptions

- `SPRINT-003` is the next sprint because `SPRINT-001` and `SPRINT-002` are completed and the ledger
  contains no active sprint.
- EPIC-02 may be planned as one larger platform sprint because its tickets form one shared ingestion
  spine and later content epics depend on the complete spine.
- The implementation may add a Python parser dependency only for offline data tooling, not browser
  runtime code.
- `npm run verify` should remain fast and offline. Live wiki access belongs behind an explicit manual
  command.
- EPIC-02 can move to `ready` during planning while execution later marks active tickets and the epic
  `in-progress`.
- Full profession and skill catalog completeness belongs to EPIC-03 and EPIC-04.

## Local Feasibility Notes

- Current project files already reserve `scripts/data`, `data/source-snapshots`, `data/generated`,
  and `data/qa`, and `.gitignore` already denies raw/generated/QA artifacts by default.
- Existing domain contracts already cover most provenance and QA output shapes; the likely execution
  gap is the skill-ID artifact envelope, which can stay tool-local unless a future consumer needs a
  durable domain type.
- Python tests can be integrated into `npm run verify` using the existing pattern already used for
  `scripts/test_ticket_burn.py`.
- The final sprint should keep planned checkboxes unchecked; the execute phase is responsible for
  checking them and moving ticket/epic/sprint statuses to done/completed.
- Planning artifacts and result manifest are outputs of this planning run, not implementation tasks
  inside the sprint.
