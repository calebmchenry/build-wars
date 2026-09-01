---
id: SPRINT-003
title: Data Ingestion Platform
status: planned
source_target: BACKLOG
source_epic: EPIC-02
source_epic_path: work/tickets/02-data-ingestion-platform/EPIC.md
tickets:
  - BW-0201
  - BW-0202
  - BW-0203
  - BW-0204
  - BW-0205
  - BW-0206
  - BW-0207
  - BW-0208
created: 2026-09-01
---

# Sprint 003: Data Ingestion Platform

## Overview

This sprint turns `EPIC-02` into a reusable offline ingestion platform, not a full Guild Wars
content rollout. The output is a shared Python pipeline under `scripts/data/` that can fetch from
the Guild Wars Wiki MediaWiki API, persist provenance-bearing snapshots, prove a template-parsing
approach, generate deterministic normalized artifacts, emit QA reports, and expose one documented
regenerate command. The browser app remains a consumer of future normalized outputs only and must
not fetch raw wiki data or import ingestion modules.

The key sequencing decision is to retire shared technical risk before building content-specific
extractors. The sprint should first establish the Python test/runtime surface and the MediaWiki
client, then lock snapshot and manifest behavior, then prove `mwparserfromhell` on representative
edge cases, and only after that layer concrete extraction, icon metadata, artifact writing, QA, and
CLI orchestration. That ordering minimizes rework for later catalog epics and keeps verification
local to each dependency boundary.

This sprint is intentionally bounded. It should not attempt full profession, attribute, or skill
catalog generation, app-side generated-data consumption, icon binary downloads, copied community
prose ingestion, or any competing provenance model outside the existing `src/domain` contracts.

## Use Cases

1. A contributor can run one offline command against minimized fixtures and regenerate the same
   snapshot, artifact, and QA outputs deterministically.
2. A data script can fetch wiki pages through one shared client that handles continuation,
   retry/backoff, `maxlag`, batching, and request metadata logging without embedding fetch logic in
   each extractor.
3. A maintainer can inspect a snapshot or generated artifact and trace it back to source URL, page
   identity, revision identity, retrieval time, digest, and field-level provenance using the
   existing domain contracts.
4. Later content epics can plug new extractors into a proven `fetch -> snapshot -> normalize ->
   validate -> publish` spine instead of building one-off scrapers.
5. A reviewer can detect duplicate IDs, malformed mappings, unknown template parameters, missing
   icon metadata, provenance gaps, and generated diffs through deterministic QA reports.
6. A contributor can refresh live data manually when needed without making live network access part
   of `npm run verify`.
7. Ticket-burn and human readers can follow `SPRINT-003`, `EPIC-02`, `BW-0201` through `BW-0208`,
   and `work/sprints/ledger.tsv` with consistent phase and status boundaries.

## Architecture

### Boundary Rules

- `scripts/data/` owns offline fetch, snapshot, parse, normalize, validate, and regenerate logic.
- `src/domain/source.ts` and `src/domain/catalog.ts` remain the canonical contract targets for
  provenance-bearing emitted JSON where practical.
- Add new domain types only if the artifact is durable and expected to be consumed outside
  `scripts/data`; keep parser-internal and QA-helper shapes local to the ingestion modules.
- `data/source-snapshots/`, `data/generated/`, and `data/qa/` remain local artifact roots and stay
  ignored by default except for policy README files and explicitly approved minimized fixtures.
- `test/fixtures/data-ingestion/` should hold the committed minimized offline fixtures used by both
  Python tests and any TypeScript contract-alignment tests.
- Runtime app code must not import `scripts/data`, call the MediaWiki API, or consume raw
  snapshots directly.

### Module Shape

The sprint should keep the Python side small and explicit. A package-style layout under
`scripts/data/` is sufficient:

- `mediawiki_client.py` for HTTP request construction, continuation, retry/backoff, batching, and
  request metadata logging
- `snapshot_store.py` for raw payload writes, deterministic file naming, digests, and
  `SourceSnapshotManifest` creation
- `wikitext_parser.py` for the `mwparserfromhell` adapter and parser diagnostics
- `skill_id_enumerator.py` for `Guild Wars Wiki:Game integration/Skills/*` extraction
- `icon_metadata.py` for file-title derivation and `prop=imageinfo` resolution
- `artifact_writer.py` for deterministic JSON and `GeneratedArtifactManifest` emission
- `qa_report.py` for `QaReport` construction and gate decisions
- `regenerate.py` for the single documented offline/live orchestration command
- `test_*.py` modules in the same directory for focused `unittest` coverage

The repo should also add a pinned Python dependency surface, ideally `scripts/data/requirements.txt`
for `mwparserfromhell`, and wire it into repo documentation.

### Dependency Flow

```text
BW-0201 MediaWiki API Client
  -> BW-0202 Snapshot and Provenance Records
  -> BW-0204 Wikitext Template Parser Spike
  -> BW-0203 Skill ID Enumerator
BW-0204
  -> BW-0205 Icon Metadata Resolver
BW-0202 + BW-0203 + BW-0204 + BW-0205
  -> BW-0206 Normalized Artifact Writer
BW-0206
  -> BW-0207 Data QA Report Framework
BW-0201 through BW-0207
  -> BW-0208 Regenerate Command and Documentation
```

`BW-0204` should be completed before the sprint commits to later extractor shapes because it is the
main architectural risk and directly gates icon resolution and later catalog work. `BW-0203` should
remain intentionally narrow: it proves a real extractor and first deterministic generated output
without dragging full skill-catalog parsing into this sprint.

### Verification Contract

- `npm run verify` remains the canonical repository verification command.
- Add `npm run test:data` for offline Python ingestion tests, using `python3 -m unittest discover -s scripts/data -p 'test_*.py'` or an equivalent explicit file list.
- Update `npm run verify` so it runs TypeScript checks and tests, the offline Python ingestion
  suite, the production build, and the existing `scripts/test_ticket_burn.py` coverage.
- Every new Python test must be offline and deterministic. Live wiki access belongs only to an
  explicit manual mode.
- Add at least one TypeScript contract-alignment test for representative emitted JSON shapes so the
  Python output is checked against the existing domain surface where practical.

## Implementation

### Execution Bookkeeping

- [ ] Confirm `EPIC-00`, `SPRINT-001`, `EPIC-01`, and `SPRINT-002` are complete before execution
      starts.
- [ ] Add or update the `SPRINT-003` row in `work/sprints/ledger.tsv` as execution begins.
- [ ] Move `SPRINT-003`, `EPIC-02`, and the active BW ticket to `in-progress` before file edits for
      that phase.
- [ ] Preserve unrelated working tree changes and do not create a commit from the sprint executor.

### Phase 1: Shared Python Scaffold And `BW-0201` MediaWiki API Client (~20%)

- [ ] Add the Python dependency/install surface for ingestion work, including a pinned
      `mwparserfromhell` entry and README notes for local setup.
- [ ] Create the `scripts/data/` module/test layout and a minimal common configuration surface for
      API base URL, User-Agent construction, deterministic clock/sleep injection, and output-root
      selection.
- [ ] Implement a shared MediaWiki JSON client for `https://wiki.guildwars.com/api.php`.
- [ ] Support continuation tokens for list and generator queries.
- [ ] Support bounded retry/backoff for transient failures, rate limits, and `maxlag` responses.
- [ ] Support batching for titles/page IDs/revisions within MediaWiki API limits.
- [ ] Log request metadata useful for troubleshooting without dumping large response bodies into test
      output or repo artifacts.
- [ ] Add focused offline tests for success, continuation, retryable failures, `maxlag`, and
      terminal error behavior.

Verification:

- `python3 -m unittest scripts/data/test_mediawiki_client.py`
- `npm run verify`

Phase acceptance:

- The client can fetch siteinfo and revision metadata through offline fixtures/mocks.
- Retry and `maxlag` behavior are deterministic enough to test without real sleeps.
- No browser/runtime modules are imported anywhere under `scripts/data/`.

### Phase 2: `BW-0202` Source Snapshot And Provenance Records (~15%)

- [ ] Implement deterministic snapshot file naming based on source family, stable title or page
      identity, and revision identity.
- [ ] Write raw payloads separately from `SourceSnapshotManifest` records under
      `data/source-snapshots/`.
- [ ] Compute and store local artifact digests where available without treating remote MediaWiki
      hashes as local-integrity substitutes.
- [ ] Preserve source URL, page/file identity, revision identity, source revision timestamp,
      retrieval timestamp, raw payload policy, and notes in emitted manifests.
- [ ] Keep snapshot fixtures minimized, clearly labeled, and small enough for stable committed
      regression tests.
- [ ] Ensure tests write to temp directories and only committed minimized fixtures live under
      `test/fixtures/data-ingestion/`.

Verification:

- `python3 -m unittest scripts/data/test_snapshot_store.py`
- `npm run verify`

Phase acceptance:

- A fetched page fixture can be written to raw payload plus `SourceSnapshotManifest` with full
  provenance.
- Re-running snapshot generation against the same input yields the same file names and manifest
  content except for intentionally controlled retrieval timestamps.
- Raw snapshots remain ignored by default and are never read by runtime app code.

### Phase 3: `BW-0204` Parser Spike Then `BW-0203` Skill ID Enumeration (~25%)

- [ ] Implement a generic wikitext parser adapter around `mwparserfromhell` that preserves template
      order, raw parameter values where useful, normalized template/parameter names, redirect
      signals, and disambiguation preambles.
- [ ] Add minimized fixtures for ordinary skills, PvP split pages, quoted names, title-rank
      progression, morale-boost recharge, redirects, and disambiguation preambles.
- [ ] Surface unknown or unhandled template parameters in parser diagnostics instead of silently
      dropping them.
- [ ] Record the parser recommendation explicitly: continue with `mwparserfromhell`, switch, or add
      a bounded fallback for specific cases.
- [ ] Keep `action=parse` and `action=expandtemplates` as opt-in fallback paths for hard cases, not
      the default extraction path.
- [ ] After the parser spike is accepted, implement the `Guild Wars Wiki:Game integration/Skills/*`
      enumerator using the shared client and snapshot fixtures.
- [ ] Parse mappings from `Game link:Skill N` to target page titles without silently dropping gaps,
      PvP pages, quoted titles, or special/effect entries.
- [ ] Emit deterministic normalized output and QA diagnostics for duplicate IDs, duplicate target
      titles, malformed mappings, and unexpected line shapes.
- [ ] Use profession/category pages only as QA cross-check inputs, not as the primary ID authority.

Verification:

- `python3 -m unittest scripts/data/test_wikitext_parser.py`
- `python3 -m unittest scripts/data/test_skill_id_enumerator.py`
- `npm run verify`

Phase acceptance:

- The parser recommendation is recorded and backed by representative fixtures.
- The skill-ID output is sorted by numeric ID and includes source provenance per mapping.
- No full skill catalog extraction is attempted in this phase.

### Phase 4: `BW-0205` Icon Metadata Resolver And `BW-0206` Artifact Writer (~20%)

- [ ] Implement icon metadata resolution from explicit `image=` fields and deterministic fallback
      file-title derivation such as `File:{name}.jpg` and `File:{name}.png`.
- [ ] Query `prop=imageinfo` for URL, MIME type, dimensions, byte size, upload timestamp, SHA-1,
      and description URL.
- [ ] Define deterministic selection rules when multiple plausible icon files exist.
- [ ] Emit QA findings for missing, ambiguous, non-64x64, or unexpected-MIME icon results.
- [ ] Implement deterministic normalized artifact writing under `data/generated/`, including stable
      sorting, stable key ordering, `GeneratedArtifactManifest`, and explicit provenance.
- [ ] Keep the first durable artifact scope narrow: skill-ID mapping output and only the supporting
      parser/icon metadata needed to prove the shared pipeline.
- [ ] Preserve unknown IDs and unresolved references rather than coercing or dropping them.
- [ ] Add TypeScript contract-alignment tests for representative emitted JSON against the current
      `src/domain/source.ts` and `src/domain/catalog.ts` surfaces where practical.

Verification:

- `python3 -m unittest scripts/data/test_icon_metadata.py`
- `python3 -m unittest scripts/data/test_artifact_writer.py`
- `npm run test:run`
- `npm run verify`

Phase acceptance:

- Icon handling remains metadata-only and never downloads or commits image bytes.
- Re-running artifact generation without source changes produces no meaningful diff except
  intentionally controlled generation timestamps if those are included.
- Emitted records and manifests remain consistent with the existing domain provenance model.

### Phase 5: `BW-0207` QA Reports And `BW-0208` Regenerate Command (~20%)

- [ ] Implement `QaReport` generation with the categories, severities, scopes, and gate decisions
      defined in `compendium/data-qa-and-release.md`.
- [ ] Make critical duplicate-ID, missing-provenance, invalid-source-reference, integrity-mismatch,
      and schema-shape issues fail validation.
- [ ] Preserve ambiguity, staleness, missing optional icon metadata, and manual-review concerns as
      deterministic warnings or info findings when they should not hard-fail the artifact.
- [ ] Support comparison with prior generated artifacts when a previous manifest/output pair is
      supplied.
- [ ] Expose one documented command that runs the EPIC-02 offline flow end to end, plus an explicit
      live-refresh mode for manual use.
- [ ] Add `npm run test:data` and update `npm run verify` so offline ingestion coverage is part of
      the normal repo validation path.
- [ ] Update `README.md`, `scripts/data/README.md`, and the `data/*/README.md` files with install
      steps, command usage, output locations, ignore/commit rules, and the explicit statement that
      live wiki access is not required by automated verification.
- [ ] Close sprint and ticket records only after the full verification suite passes.

Verification:

- `python3 -m unittest scripts/data/test_qa_report.py`
- `python3 -m unittest scripts/data/test_regenerate.py`
- `npm run verify`
- Optional manual live smoke against the Guild Wars Wiki API

Phase acceptance:

- One documented command regenerates the fixture-backed artifact flow end to end.
- The command fails clearly on critical QA findings.
- Live mode follows the shared client politeness rules and writes provenance-bearing outputs.

## Files Summary

| Path | Purpose |
| --- | --- |
| `scripts/data/requirements.txt` | Pinned Python dependency surface for the ingestion parser/tooling |
| `scripts/data/mediawiki_client.py` | Shared Guild Wars Wiki API client |
| `scripts/data/snapshot_store.py` | Raw snapshot and `SourceSnapshotManifest` writer |
| `scripts/data/wikitext_parser.py` | Generic template parsing adapter and parser diagnostics |
| `scripts/data/skill_id_enumerator.py` | Canonical skill-ID mapping extractor |
| `scripts/data/icon_metadata.py` | Remote icon/file metadata resolution |
| `scripts/data/artifact_writer.py` | Deterministic normalized JSON and `GeneratedArtifactManifest` output |
| `scripts/data/qa_report.py` | `QaReport` generation and gate decisions |
| `scripts/data/regenerate.py` | Single documented offline/live orchestration command |
| `scripts/data/test_*.py` | Focused offline Python `unittest` suites |
| `test/fixtures/data-ingestion/` | Minimized API, wikitext, and expected-output fixtures |
| `test/domain/` | TypeScript contract-alignment tests for representative emitted shapes |
| `package.json` | `test:data` script and canonical `verify` wiring |
| `README.md` | Python setup, command usage, and repo verification updates |
| `scripts/data/README.md` | Concrete ingestion-stage behavior and command documentation |
| `data/source-snapshots/README.md` | Snapshot retention, fixture policy, and manifest rules |
| `data/generated/README.md` | Generated artifact determinism, commit gate, and provenance rules |
| `data/qa/README.md` | QA report ownership, ignore policy, and release-gate expectations |
| `work/tickets/02-data-ingestion-platform/*.md` | Ticket status and sprint linkage during execution |
| `work/sprints/SPRINT-003.md` | Execution copy of the sprint plan |
| `work/sprints/ledger.tsv` | Sprint ledger state |

## Definition of Done

- [ ] `scripts/data/` contains a shared offline ingestion spine covering client, snapshot, parser,
      enumerator, icon metadata, artifact writing, QA, and regenerate orchestration.
- [ ] The Python parser choice is recorded and proven against representative minimized fixtures, and
      nested wiki templates are not handled by regex-only parsing.
- [ ] `npm run verify` includes the new offline data-test coverage and does not require live wiki
      access.
- [ ] A single documented offline command can regenerate the sprint's proof artifacts from fixtures.
- [ ] A live refresh mode exists for manual use, follows the MediaWiki politeness rules, and is not
      part of automated verification.
- [ ] Snapshot manifests, generated artifact manifests, and QA reports are emitted in shapes
      consistent with the existing provenance/domain contracts.
- [ ] The skill-ID enumerator produces deterministic, provenance-bearing output and reports malformed
      or duplicate mappings instead of silently dropping them.
- [ ] Icon handling is metadata-only and produces QA findings for missing or ambiguous results.
- [ ] Generated outputs preserve unknown IDs and unresolved references without destructive coercion.
- [ ] No raw source payloads, generated catalogs, QA reports, icon binaries, screenshots, or copied
      community prose are committed beyond approved policy files and minimized fixtures.
- [ ] Runtime app code still does not import `scripts/data`, call the wiki API, or consume raw
      snapshots directly.
- [ ] `README.md`, `scripts/data/README.md`, `data/*/README.md`, and `package.json` describe the
      same setup, commands, and artifact policy.
- [ ] `EPIC-02`, `BW-0201` through `BW-0208`, `SPRINT-003`, and `work/sprints/ledger.tsv` are
      status-consistent at sprint close.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `mwparserfromhell` does not cover one or more required nested template cases cleanly | Medium | High | Resolve the parser spike before broader extraction work and record a bounded fallback policy |
| MediaWiki continuation, batching, or `maxlag` handling makes the client flaky | Medium | High | Build deterministic offline fixtures for all transport behaviors before live-mode documentation |
| Python output drifts from TypeScript domain expectations | Medium | High | Reuse existing domain contracts, add representative TypeScript contract-alignment tests, and avoid speculative new domain types |
| Fixture minimization leaves important source shapes uncovered | Medium | Medium | Use a small but explicit corpus of representative edge cases named by `BW-0203` and `BW-0204` |
| Determinism is lost through unstable ordering, timestamps, or path naming | Medium | High | Centralize ordering, file naming, and clock injection and assert no-diff reruns in tests |
| The sprint grows into full skill-catalog extraction work | Medium | High | Keep the durable artifact scope to platform proof outputs and defer EPIC-03/EPIC-04 catalog breadth |

## Security

- Treat all source URLs, titles, raw payloads, template values, and QA evidence as untrusted input.
- Sanitize output file names and keep artifact paths rooted under the approved `data/` directories.
- Do not log full remote payloads by default; log only bounded request/response metadata needed for
  troubleshooting.
- Do not store secrets, auth tokens, cookies, or cached media binaries in the repo or generated
  artifacts.
- Keep runtime app code isolated from ingestion scripts and live network behavior.
- Keep icon handling metadata-only and require future explicit approval before any cached-media or
  offline/PWA redistribution path exists.

## Dependencies

- `EPIC-00` / `SPRINT-001` and `EPIC-01` / `SPRINT-002` must already be complete.
- Node.js `22.11.0+`, npm `11.10.1+`, and Python 3 remain required repo prerequisites.
- The sprint adds a Python dependency installation step for `mwparserfromhell`, which must be
  documented and reproducible.
- Guild Wars Wiki MediaWiki API availability is required only for optional manual live refreshes,
  not for automated verification.
- This sprint directly unblocks later ingestion consumers in `EPIC-03 Professions and Attributes`,
  `EPIC-04 Skills`, `EPIC-05 Template Compatibility`, and later catalog-heavy equipment/hero work.

## Open Questions

1. Should `action=parse` or `action=expandtemplates` fallback behavior be implemented only as a
   manual diagnostic mode, or is a bounded per-page fallback list acceptable in normal live mode?
2. What is the smallest committed fixture corpus that still gives long-term confidence for
   game-integration mapping, parser edge cases, and icon resolution?
3. Should representative generated JSON fixtures live only under `test/fixtures/data-ingestion/`,
   or should one minimized proof artifact also be committed under an exact-path allowlist later?
4. Is the existing schema-version surface sufficient for EPIC-02 outputs, or does the generator
   need an additional explicit ingestion-artifact version independent of catalog versioning?
