# SPRINT-009 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-009-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-009-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-009-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-009-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-009-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-009-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-009-GPT54-CRITIQUE.md`

## Accepted

- Use `SPRINT-009` as the next sprint because `SPRINT-001` through `SPRINT-008` are completed in
  `work/sprints/ledger.tsv` and no `SPRINT-009.md` existed before planning.
- Cover BW-0801 through BW-0808 in one implementation sprint. The groomed ticket dependencies
  already sequence catalog/state work before UI breadth and closeout, so no high-risk architecture
  interview is needed in non-interactive mode.
- Use one app-side catalog boundary. Runtime app code may import only the two promoted catalog JSON
  files, and leaf UI components must not import `data/generated/**` directly.
- Require visible attribution before source-derived catalog facts in DOM and visual order.
- Keep remote icon metadata data-only. EPIC-08 renders stable placeholder icon slots and does not
  request remote icon URLs automatically.
- Preserve imported raw template identity in a field-addressed app overlay beside the semantic
  `Build`; do not infer template/catalog mapping from numeric equality.
- Make import transactional and exact-source eligibility fingerprint-derived rather than dirty-bit
  derived.
- Add `template-workflow.ts` as a pure workflow adapter for import resolution, editor-to-template
  projection, exact replay, canonical export, and diagnostics.
- Pull validation/export policy selectors into Phase 2 so Phase 7 dialogs and Phase 8 presentation do
  not define competing policies.
- Use deterministic browser filters and bounded rendering over the current 2,951-record skills
  catalog, and measure production asset size rather than creating a new runtime data artifact.
- Use native pointer drag/drop plus first-class keyboard operations by default. A new UI dependency
  requires a recorded architecture checkpoint.
- Keep `src/domain/**` and `src/template-compatibility/**` read-only by default; any needed change is
  a checkpoint rather than casual EPIC-08 scope creep.
- Treat final `npm run verify` failure as blocked or failed execution, not as a completed sprint
  with a waiver.

## Rejected Or Adjusted

- Rejected leaving canonical export with unresolved overlay facts as an open execution-time decision.
  The final sprint adopts an export decision matrix and requires policy-selector tests.
- Rejected a generic global revision counter as the authority for exact-source replay. UI-only
  changes must not affect template fidelity, and full semantic reversion must restore exact replay.
- Rejected making validation presentation the first place export policy is wired. Phase 8 renders and
  polishes policy that is already tested in Phase 2 and Phase 7.
- Adjusted broad clean-tree checks into baseline-aware protected-path review, because ticket-burn
  runs and unrelated user changes can make `git status --short` noisy.
- Adjusted the closeout scope so README/compendium updates are required only for shipped behavior and
  enduring implementation decisions.
- Rejected dynamic import, compact generated runtime artifacts, workers, virtualization, fuzzy search,
  state libraries, and drag/drop/modal dependencies as planned EPIC-08 work. They remain possible
  follow-ups if measured evidence justifies them.

## Valid Critiques Incorporated

- Define raw overlay invariants before UI components rely on them.
- Add explicit tests for import over edited state, failed second import, mixed resolved/unresolved
  slot swaps, edit/revert fidelity, wrapper-name handling, fresh canonical export, and every row in
  the export decision matrix.
- Keep app-level unresolved/projection diagnostics distinct from `validateBuild`, while making export
  policy consider both.
- Add resource-filter value-state semantics for zero, number, percentage, special, absent,
  not-applicable, and malformed facts.
- Require no eager mounting of every rich result/tooltip and a production asset-size measurement for
  the static catalog.
- Require focus return/advance, live announcements, modal containment/restoration, tooltip overflow
  behavior, narrow-screen walkthroughs, and remote-media non-fetch checks where JSDOM is insufficient.
- Add an Alternatives Considered section to make deferred or rejected designs explicit.

## Local Feasibility Notes

- `work/sprints/ledger.tsv` contains completed rows for `001` through `008`.
- `work/tickets/08-core-build-editor/EPIC.md` is `ready`, depends on completed prerequisite epics,
  and already lists BW-0801 through BW-0808.
- `src/app/App.tsx` and `src/app/styles.css` are still the minimal foundation shell; EPIC-08 is the
  first substantial app UI implementation.
- `tsconfig.app.json` supports JSON imports, so a single `src/app/catalogs.ts` boundary can import
  promoted JSON without changing build configuration.
- ESLint already restricts domain/template-compatibility boundaries. EPIC-08 needs app-level import
  scans/tests because `src/app` is allowed to consume generated runtime JSON through a narrow
  boundary.
- The promoted EPIC-03 catalog is about 140 KB. The promoted EPIC-04 skills catalog is about 15.4 MB
  and has 2,951 skill records, so the sprint includes bounded rendering and production asset
  measurement.
- `SkillProgressionSeries.dependency.rankDomain.max` exists and can source the temporary maximum
  title-rank display assumption until EPIC-15.

## Interview

Interview skipped under the non-interactive ticket-burn contract. No high-risk architecture choice
blocks planning because the final sprint adopts conservative defaults from the existing repo
boundaries and records the assumptions below.

## Final Assumptions

- Existing domain and template-compatibility public APIs are sufficient for EPIC-08 app work unless
  execution proves a blocking gap and records an architecture checkpoint.
- EPIC-08 can be executed as one sprint because the ticket set has a clear dependency order and
  explicit out-of-scope boundaries.
- The editor remains in-memory only; EPIC-09 owns persistence and must later preserve or migrate the
  semantic build plus raw template overlay/source contract.
- Static promoted catalog import remains the EPIC-08 runtime data path; performance alternatives are
  deferred until measured evidence exists.
- Planning may update sprint, draft, ticket, ledger, run-state, and result-manifest records, but it
  must not modify application implementation code or create a commit.
- Final approval is auto-granted because `work/sprints/SPRINT-009.md` is internally consistent and
  executable.

