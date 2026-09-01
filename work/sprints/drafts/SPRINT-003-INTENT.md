# Sprint 003 Intent: Data Ingestion Platform

## Seed

Create an executable sprint from `work/tickets/02-data-ingestion-platform/EPIC.md` for ticket-burn
target `BACKLOG`, source epic `EPIC-02`.

Automation constraints:

- Non-interactive ticket-burn planning.
- Write the final sprint to `work/sprints/SPRINT-003.md`.
- Write planning artifacts under `work/sprints/drafts/`.
- Create or update BW ticket files in `work/tickets/02-data-ingestion-platform/` when useful for
  traceability.
- Write the result manifest to
  `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-02-result.json`.
- Do not modify application/source implementation code during planning and do not commit.

## Context

- `SPRINT-001 Project Foundation` and `SPRINT-002 Source Policy and QA` are completed. The repo now
  has a React/Vite/TypeScript shell, framework-neutral `src/domain` contracts, source-policy and QA
  compendium documents, reserved data directories, and `npm run verify`.
- EPIC-02 is the first implementation sprint that may introduce offline ingestion tooling under
  `scripts/data/`; runtime app code must consume normalized generated data later and must not fetch
  or read raw wiki snapshots directly.
- EPIC-01 established conservative source and artifact rules: raw snapshots, generated JSON, and QA
  reports remain ignored by default; icons are metadata-only; copied text, cached media, and
  ambiguous rights remain review-required or prohibited unless a future explicit ticket narrows the
  scope.
- Existing `src/domain/source.ts` already represents source references, record provenance, remote
  media metadata, snapshot manifests, generated artifact manifests, and QA reports as plain
  JSON-compatible contracts. EPIC-02 should validate and emit against these shapes where practical,
  not invent a competing provenance model.
- EPIC-02 already has eight traceability tickets: BW-0201 API client, BW-0202 snapshots/provenance,
  BW-0203 skill ID enumeration, BW-0204 parser spike, BW-0205 icon metadata, BW-0206 deterministic
  generated artifacts, BW-0207 QA reports, and BW-0208 regenerate command/docs.

## Recent Sprint Context

- `c973ad8 Implement SPRINT-002: Source Policy and QA` completed source policy, data QA/release
  gates, provenance contracts, data artifact retention docs, and synthetic source-policy fixtures.
- `b2c0bff Add ticket burn through-epic bound` updated backlog automation behavior.
- `86f6acb Groom game rule engine epic` and `6b7863a Groom data ingestion epic tickets` added
  implementation-ready downstream tickets and EPIC-02 grooming.
- `cea0231 Implement SPRINT-001: Project Foundation` established the local-first app, domain
  boundary, data directories, and verification command.
- `work/sprints/ledger.tsv` currently lists sprints `001` and `002` as completed, making
  `SPRINT-003` the next planned sprint.

## Relevant Codebase Areas

- `work/tickets/02-data-ingestion-platform/EPIC.md` - source scope and technical direction for the
  ingestion platform.
- `work/tickets/02-data-ingestion-platform/BW-0201*.md` through `BW-0208*.md` - existing child
  tickets that should be linked to `SPRINT-003`.
- `scripts/data/README.md` - documented future pipeline boundary and stage contract.
- `data/source-snapshots/README.md`, `data/generated/README.md`, and `data/qa/README.md` - artifact
  ownership and default ignore/commit rules.
- `compendium/source-policy.md` and `compendium/data-qa-and-release.md` - normative source policy,
  QA, review, and release gate requirements.
- `src/domain/source.ts` - provenance, media, snapshot, generated artifact, and QA contracts.
- `src/domain/catalog.ts` and `src/domain/ids.ts` - catalog record and branded ID shapes generated
  data should align with where practical.
- `test/fixtures/source-policy.ts`, `test/domain/source-policy.test.ts`, and
  `test/domain/contracts.test.ts` - synthetic fixture and contract test patterns to extend.
- `package.json`, `tsconfig.domain.json`, and `eslint.config.js` - existing verification commands,
  strict TypeScript settings, and import-boundary rules.
- `work/sprints/ledger.tsv`, `scripts/ticket-burn.py`, and existing sprint artifacts - planning,
  result-manifest, and ledger conventions.

## Constraints

- Follow `AGENTS.md`: be concise and direct when conversing with the human.
- Planning must not modify app/source implementation code and must not commit.
- The sprint itself may plan future implementation changes under `scripts/data`, `src/domain`, data
  READMEs, tests, package config, tickets, and sprint records.
- Keep ingestion as offline tooling under `scripts/data`; app/browser runtime must not call the wiki
  API, import `scripts/data`, or consume raw snapshots.
- Use the Guild Wars Wiki MediaWiki API as the primary source interface, with polite User-Agent,
  continuation handling, batching, retry/backoff, and `maxlag` handling.
- Do not rely on regex-only parsing for nested wiki templates; prefer a Python path with
  `mwparserfromhell` unless execution discovers a concrete blocking incompatibility.
- Do not commit full raw source payloads, generated catalogs, QA reports, icon binaries, screenshots,
  copied PvX/Fandom/community prose, or copied large wiki bodies in this sprint.
- Use minimized synthetic or reviewed fixture excerpts only when needed for deterministic tests, and
  keep any external fixture scope explicit under EPIC-01 policy.
- Keep generated outputs deterministic and reviewable: stable sorting, stable key ordering, explicit
  schema/generation metadata, provenance, and QA report paths.
- Preserve ticket-burn status vocabulary: `backlog`, `ready`, `in-progress`, `blocked`, and `done`.

## Success Criteria

- `SPRINT-003` is executable, internally consistent, and linked to EPIC-02 and BW-0201 through
  BW-0208.
- The sprint defines a shared offline ingestion spine that later content epics can extend without
  one-off scrapers.
- The plan sequences API fetching, source snapshots/provenance, skill ID enumeration, parser spike,
  icon metadata, deterministic generated artifacts, QA reports, and a single regenerate command in a
  dependency-safe order.
- The planned work includes fast offline tests and fixtures for client continuation/retry behavior,
  snapshot determinism, skill ID parsing, representative template extraction, icon metadata
  resolution, artifact determinism, QA finding generation, and command orchestration.
- Live wiki access is optional/manual for development refreshes and is not required by `npm run
  verify`.
- The result manifest reports `status: planned`.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-02, EPIC-01 source policy, existing
  domain contracts, MediaWiki API contract behavior, and deterministic fixture-based tests.
- Spec/documentation: `EPIC-02`, BW-0201 through BW-0208, `scripts/data/README.md`, data README
  files, `compendium/source-policy.md`, `compendium/data-qa-and-release.md`, `src/domain/source.ts`,
  and the ticket-burn manifest contract.
- Edge cases identified:
  - MediaWiki continuation, transient failures, `maxlag`, batching limits, descriptive User-Agent,
    and request metadata logging without large response-body dumps.
  - Source pages with redirects, gaps, non-contiguous skill IDs, punctuation, quoted names,
    PvP/PvE split pages, and special/effect entries.
  - Nested templates: `Skill infobox`, `Skill progression`, `gr`, `gr2`, title-rank progressions,
    PvE/PvP wrappers, morale-boost recharge, redirects, and disambiguation preambles.
  - Icon defaults where `prop=images` is incomplete, explicit `image=` fields, `.jpg`/`.png`
    candidate selection, missing or ambiguous files, non-64x64 dimensions, and unexpected MIME
    types.
  - Missing provenance, duplicate IDs, duplicate target titles, unknown template params, unresolved
    redirects, malformed mappings, source diff detection, and generated artifact integrity.
  - Generated artifacts ignored by default but still deterministic and inspectable in local diffs.
- Testing approach:
  - Unit tests for Python ingestion modules with offline fixtures and mocked API responses.
  - TypeScript contract tests only where generated shapes need to align with `src/domain`.
  - CLI/orchestration tests for offline regenerate mode.
  - `npm run verify` as the canonical repository validation command.
  - Optional manually documented live refresh command that is not required by automated verification.

## Uncertainty Assessment

- Correctness uncertainty: Medium - MediaWiki API behavior and Guild Wars wiki template variation
  require representative fixtures and conservative QA, but the sprint can remain executable by
  limiting catalog extraction to an ingestion spine and parser proof.
- Scope uncertainty: Medium - EPIC-02 spans fetch, parse, normalize, validate, and command
  orchestration. The sprint must avoid becoming full EPIC-03/04 catalog extraction.
- Architecture uncertainty: Medium - this introduces a Python ingestion subsystem and likely
  `mwparserfromhell`; the direction is already named by EPIC-02, and risk is manageable with
  offline fixtures, clear boundaries, and a parser spike recommendation.

## Assumptions

- SPRINT-003 is the next sprint because `SPRINT-001` and `SPRINT-002` are completed and the ledger
  contains no active sprint.
- The interview is skipped under the automation contract because EPIC-02 already names the main
  architecture choice: offline Python ingestion with `mwparserfromhell` preferred unless execution
  proves otherwise.
- The implementation sprint may add Python dependencies for ingestion only if they are documented,
  pinned or otherwise made reproducible, and covered by offline verification.
- `npm run verify` should remain fast and offline; live wiki calls belong behind an explicit manual
  mode.
- EPIC-02 can stay `backlog` during planning while BW-0201 through BW-0208 are marked `ready` and
  linked to `SPRINT-003`.
- Full profession and skill catalog completeness belongs to EPIC-03 and EPIC-04; EPIC-02 should
  produce reusable platform behavior and minimized proof outputs.

## Open Questions

1. What is the smallest ingestion module structure that keeps Python tooling maintainable without
   prematurely creating a package/workspace split?
2. How should generated JSON align with TypeScript domain contracts while keeping Python output
   deterministic and schema-versioned?
3. Which minimized fixtures are necessary for parser and enumerator confidence without importing
   broad external source payloads?
4. What QA findings should fail the offline regenerate command immediately versus emit warnings for
   manual review?
5. How much live-mode documentation is enough before content epics begin adding real extractors?
