# Sprint 002 Intent: Source Policy and QA

## Seed

Create an executable sprint from `work/tickets/01-source-policy-and-qa/EPIC.md` for ticket-burn
target `BACKLOG`, source epic `EPIC-01`.

Automation constraints:

- Non-interactive ticket-burn planning.
- Write the final sprint to `work/sprints/SPRINT-002.md`.
- Write planning artifacts under `work/sprints/drafts/`.
- Create or update BW ticket files in `work/tickets/01-source-policy-and-qa/` when useful for
  traceability.
- Write the result manifest to
  `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-01-result.json`.
- Do not modify application/source implementation code during planning and do not commit.

## Context

- The repository now has a completed `SPRINT-001 Project Foundation`: React/Vite/TypeScript app
  scaffold, framework-neutral `src/domain` contracts, synthetic foundation fixtures, reserved data
  directories, ticket-burn planning records, and `npm run verify`.
- `EPIC-01 Source Policy and QA` must happen before substantial Guild Wars Wiki, PvX/Fandom, icon,
  screenshot, or generated-data import work. It is the policy gate for EPIC-02 and later content
  epics.
- Current source metadata is intentionally thin in `src/domain/source.ts`; it can express source
  name, URL, revision, retrieval time, and notes, but not source classification, copied/derived/manual
  field classification, image metadata, QA findings, or manual review status.
- Data locations already exist: `data/source-snapshots`, `data/generated`, and `data/qa`, with
  README placeholders and ignored generated/raw contents.
- Ticket conventions use local markdown files with frontmatter under `work/tickets`, and the sprint
  ledger is `work/sprints/ledger.tsv`.

## Recent Sprint Context

- `cea0231 Implement SPRINT-001: Project Foundation` completed the app/tooling/domain/data layout.
- `fc1375a Document source policy defaults` added the current EPIC-01 policy defaults.
- `678e088 Document data ingestion epic direction` and `7660030 Initialize Build Wars backlog and
  ticket runner` established the backlog and ticket-burn automation.
- `work/sprints/SPRINT-001.md` is complete and `work/sprints/ledger.tsv` currently lists sprint
  `001` as completed.

## Relevant Codebase Areas

- `work/tickets/01-source-policy-and-qa/EPIC.md` - source epic scope and policy defaults.
- `work/tickets/01-source-policy-and-qa/BW-0101*.md` through `BW-0105*.md` - proposed traceability
  tickets for EPIC-01.
- `src/domain/source.ts` - existing source provenance contract likely extended during execution.
- `src/domain/catalog.ts`, `src/domain/build.ts`, `src/domain/party.ts`, `src/domain/guide.ts` -
  existing consumers of source/catalog metadata that must continue to typecheck.
- `test/domain/contracts.test.ts` and `test/fixtures/foundation.ts` - existing contract test and
  synthetic fixture patterns.
- `scripts/data/README.md`, `data/README.md`, `data/source-snapshots/README.md`,
  `data/generated/README.md`, `data/qa/README.md` - data lifecycle documentation to update.
- `compendium/README.md` and `compendium/decisions/0001-project-foundation.md` - long-lived
  documentation index and foundation decision context.
- `README.md` and `package.json` - canonical verification command and project layout docs.
- `work/sprints/ledger.tsv` and `scripts/ticket-burn.py` - sprint ledger and automation contract.

## Constraints

- Follow `AGENTS.md`: be concise and direct when conversing with the human.
- Planning must not modify app/source implementation code and must not commit.
- The sprint itself may plan future code/documentation changes needed to satisfy EPIC-01.
- Preserve the single-package architecture and `src/domain` boundary from SPRINT-001.
- Keep all source/provenance contracts JSON-compatible plain data.
- Do not add real external Guild Wars Wiki, PvX/Fandom, icon, screenshot, or generated catalog
  payloads in this sprint; use synthetic fixtures only when tests need executable examples.
- Treat source-policy content as project policy, not legal advice.
- Default to conservative reuse, explicit provenance, and manual review for ambiguous cases.
- Keep raw snapshots and generated QA reports ignored by default; commit only policy/readme files or
  deliberately minimized fixtures.
- Store icon metadata initially, not icon files.

## Success Criteria

- `SPRINT-002` is executable, internally consistent, and linked to EPIC-01 and BW-0101 through
  BW-0105.
- EPIC-01 has concrete tickets for source policy, provenance contracts, artifact retention, QA/manual
  review, and release closeout.
- The planned work defines clear policies for source reuse, attribution, classification, generated
  data, raw snapshots, QA reports, fixtures, icons, screenshots, PvX/Fandom content, and public
  release gates.
- The planned work gives EPIC-02 enough contract detail to implement ingestion and QA reporting
  without reopening baseline source-policy decisions.
- Verification requires `npm run verify` plus manual policy/traceability checks.
- The result manifest reports `status: planned`.

## Verification Strategy

- Reference implementation: none; correctness is defined by EPIC-01 policy defaults and consistency
  with the SPRINT-001 architecture.
- Spec/documentation: `EPIC-01`, `README.md`, `compendium/decisions/0001-project-foundation.md`,
  `scripts/data/README.md`, data README files, BW tickets, and the ticket-burn manifest contract.
- Edge cases identified:
  - Guild Wars Wiki pages that mix contributor text with ArenaNet/NCSoft-owned game content.
  - PvX/Fandom/community pages where metadata and links are acceptable but guide prose and ratings
    text are not copied.
  - Icon metadata where file title/URL/MIME/size/timestamp/sha1 are retained but image files are not
    cached.
  - Copied descriptions versus derived normalized values versus manual overrides in a generated
    record.
  - Stale revision IDs, missing retrieved timestamps, ambiguous license/source status, and copied
    text without attribution.
  - Generated QA reports that should remain ignored unless explicitly promoted to stable
    documentation.
- Testing approach:
  - Typecheck and unit tests for source/provenance domain contract examples.
  - JSON round-trip tests for synthetic representative provenance and QA records.
  - Manual review of policy docs, README updates, ticket linkage, and `.gitignore` intent.
  - `npm run verify` as the canonical repository validation command.

## Uncertainty Assessment

- Correctness uncertainty: Medium - the policy is conservative and bounded, but licensing/source
  classification has inherent ambiguity and must be recorded as project policy, not legal advice.
- Scope uncertainty: Low - EPIC-01 is explicitly documentation/contract/QA policy work, with real
  ingestion, live fetchers, copied source payloads, runtime attribution UI, and media caching deferred.
- Architecture uncertainty: Low - the work extends existing SPRINT-001 documentation, data
  directories, and `src/domain` contract patterns rather than introducing a new subsystem.

## Assumptions

- SPRINT-002 is the next sprint because `SPRINT-001` exists and the ledger contains only sprint
  `001`.
- The interview is skipped under the automation contract because no high-risk architecture choice is
  needed; conservative policy defaults are already present in EPIC-01.
- EPIC-01 can remain `backlog` during planning while its concrete tickets are marked `ready` and
  linked to `SPRINT-002`.
- Future execution should update application/source files only as specified by the final sprint; this
  planning run itself does not.
- The sprint should not seek legal conclusions; it should make implementation policy explicit and
  flag ambiguous cases for manual review.

## Open Questions

1. What is the minimal source/provenance contract extension that unblocks EPIC-02 without overfitting
   to one source API?
2. Which policy details belong in a durable compendium page versus data directory README files?
3. How strict should generated-data commit gates be for small deterministic JSON needed by app/tests?
4. What QA findings should block public release versus require explicit documented acceptance?
5. How should the sprint keep policy work executable and verifiable without importing real external
   content?
