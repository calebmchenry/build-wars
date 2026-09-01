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

This sprint executes `EPIC-02 Data Ingestion Platform` for ticket-burn target `BACKLOG`.

The goal is a small, shared offline ingestion spine under `scripts/data/` that can fetch Guild Wars
Wiki source material, write provenance-bearing snapshots, run representative parsers, emit
deterministic generated JSON, and produce QA reports. It should give later content epics one
pipeline to extend instead of one-off scrapers.

The sprint covers `BW-0201` through `BW-0208`: MediaWiki API client, source snapshots, skill ID
enumeration, wikitext parser spike, icon metadata resolution, normalized artifact writing, QA report
generation, and a single regenerate command with documentation.

This sprint does not build the full profession catalog, full skill catalog, template import/export,
runtime rule validation, local library, UI data browsing, runtime data fetching, public release
attestation, media caching, or committed source-derived production catalogs. Live wiki access is a
manual refresh path; automated verification must remain fast and offline.

`src/domain/source.ts` remains the canonical provenance and QA contract surface. Python ingestion
code may mirror those JSON shapes operationally, but it must not invent a competing provenance model.
Generated and QA artifacts stay ignored by default unless a later explicit ticket approves exact
paths under the EPIC-01 source policy.

Ticket-burn planning owns merge notes and
`work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-02-result.json`. Those are not
implementation tasks inside `SPRINT-003`; the executable sprint starts after planning has produced
the final `work/sprints/SPRINT-003.md`.

## Use Cases

1. **Fetch wiki metadata safely**: A maintainer can use a reusable offline client to query the Guild
   Wars Wiki MediaWiki API with continuation, batching, retry/backoff, `maxlag`, and a descriptive
   User-Agent.
2. **Preserve source lineage**: A fetched page or file metadata response can be captured as an
   ignored local snapshot with page/file identity, revision facts, retrieval timestamp, source URL,
   digest, and retention decision.
3. **Enumerate skill IDs**: Later skill and template work can consume a deterministic
   skill-id-to-page-title map extracted from `Guild Wars Wiki:Game integration/Skills/*`.
4. **Prove template extraction**: The team can validate the parser approach against representative
   wikitext cases without committing broad external page payloads.
5. **Resolve icon metadata without media bytes**: Extractors can record remote icon file metadata and
   QA ambiguities while keeping icon binaries out of the repo and runtime bundle.
6. **Review generated outputs**: Normalized JSON, manifests, and QA reports are stable enough for
   local diffs and include provenance sufficient for EPIC-01 review gates.
7. **Regenerate through one command**: Contributors can run one documented offline fixture command
   for verification and one explicit live command for source refreshes.
8. **Maintain ticket-burn traceability**: `SPRINT-003`, `EPIC-02`, `BW-0201` through `BW-0208`, and
   `work/sprints/ledger.tsv` remain status-consistent during execution.

## Architecture

### Ownership Boundaries

| Concern | Owner | Boundary |
| --- | --- | --- |
| Browser runtime | `src/app` | May consume approved normalized data in later sprints; must not import fetchers, raw snapshots, or `scripts/data`. |
| Domain contracts | `src/domain` | Plain JSON-compatible TypeScript contracts; no React, DOM, storage, network, or ingestion imports. |
| Offline ingestion | `scripts/data` | May import or mirror public domain contracts; may read/write ignored data artifacts; must stay outside runtime code. |
| Raw source captures | `data/source-snapshots` | Local ignored source payloads and snapshot manifests; never runtime input. |
| Normalized outputs | `data/generated` | Local ignored generated JSON and manifests until an exact-path future ticket approves committed data. |
| QA reports | `data/qa` | Local ignored validation and review artifacts; not runtime data. |
| Policy | `compendium/source-policy.md`, `compendium/data-qa-and-release.md` | Normative source, retention, QA, review, and release rules. |

### Pipeline Shape

```text
source profile
  -> MediaWiki API client
  -> SourceSnapshotManifest + ignored raw payload
  -> extractor or parser
  -> normalized records + GeneratedArtifactManifest
  -> QaReport
  -> later content epic or release gate
```

The pipeline has two modes:

- `fixture`: offline, deterministic, used by tests and `npm run verify`.
- `live`: explicit manual refresh against the Guild Wars Wiki API, using polite client behavior and
  writing ignored local artifacts.

No automated verification step may require network access. No browser code may call the live mode or
read raw source snapshots.

### Ingestion Module Layout

Use the smallest Python structure that keeps responsibilities clear:

- `scripts/data/build_wars_ingest/client.py` for MediaWiki transport, continuation, batching, retry,
  `maxlag`, User-Agent, and request metadata.
- `scripts/data/build_wars_ingest/snapshots.py` for snapshot filenames, payload writing, manifests,
  digests, and retention decisions.
- `scripts/data/build_wars_ingest/skill_ids.py` for game-integration skill ID enumeration.
- `scripts/data/build_wars_ingest/wikitext.py` for `mwparserfromhell` parsing wrappers and parser
  spike result recording.
- `scripts/data/build_wars_ingest/icons.py` for icon candidate selection and `prop=imageinfo`
  metadata normalization.
- `scripts/data/build_wars_ingest/artifacts.py` for deterministic JSON formatting, stable sort
  rules, manifest writing, and digest calculation.
- `scripts/data/build_wars_ingest/qa.py` for finding creation, severity gates, summaries, and report
  writing.
- `scripts/data/build_wars_ingest/regenerate.py` for command orchestration.
- `scripts/data/regenerate.py` as the documented script entrypoint if that is simpler for callers.

Avoid a package/workspace split in this sprint. A separate package is justified only after a second
consumer, incompatible dependency lifecycle, or distribution requirement appears.

### Contract Alignment

The TypeScript contracts in `src/domain/source.ts` are authoritative for:

- source families, material classes, provenance methods, rights basis, use decisions, and review
  vocabulary
- `SourceReference`, `RecordProvenance`, `RemoteMediaMetadata`, `SourceSnapshotManifest`,
  `GeneratedArtifactManifest`, `QaFinding`, and `QaReport`
- JSON-compatible values, RFC 3339 timestamps, repository-relative paths, and RFC 6901 field paths

Python output must use the same field names and vocabulary where practical. If implementation cannot
import TypeScript types directly, it should prove compatibility with minimized JSON fixtures and
TypeScript contract tests rather than adding a second schema language.

Generated artifacts should include explicit schema version, generator name, generation ID or catalog
version placeholder, input snapshot manifest paths, source IDs, record count, digest, QA report path,
commit decision, and notes. Records should carry record-level or field-level provenance; copied or
ambiguous source material remains review-required.

### Source Profiles

Start with one source profile: Guild Wars Wiki via `https://wiki.guildwars.com/api.php`.

The profile must define:

- canonical source family `guild-wars-wiki`
- base API URL
- descriptive User-Agent for a free public Build Wars tool
- default query parameters for JSON responses
- request timeout, retry count, bounded backoff, and `maxlag` handling
- safe page/file title normalization rules for artifact paths
- snapshot retention policy defaulting to ignored local artifacts

Future PvX/Fandom, community, game-client, or manual sources are out of scope except where EPIC-01
policy documents need links or guardrails.

### Parser Boundary

`mwparserfromhell` is the preferred parser path unless execution finds a concrete blocker. The parser
layer should expose generic template extraction behavior, not a skill-only scraper.

The spike must cover minimized fixtures for:

- `Skill infobox`
- `Skill progression`
- `gr` and `gr2`
- title-rank progression templates
- PvE/PvP wrappers
- morale-boost recharge cases
- redirects
- disambiguation preambles
- quoted names, punctuation, and special/effect entries

Regex may help identify simple row shapes in controlled fixture text, but nested MediaWiki template
parsing must not rely on regex-only extraction.

### QA Gates

QA findings should reuse EPIC-01 categories and severities. At minimum:

- duplicate skill IDs or missing provenance are `critical`
- malformed mappings, unresolved redirects, schema-shape failures, missing required fields, and
  artifact digest mismatches are `critical` or `error`
- missing, ambiguous, non-64x64, or unexpected MIME icon metadata is at least `warning`
- unknown template parameters, parse fallbacks, source diffs, and manual overrides are preserved for
  review

The offline regenerate command must fail on open critical findings. Public release approval is not
part of this sprint.

## Implementation

### Phase 1: Sprint Traceability And Ingestion Scaffold (~10% of effort)

**Files:**

- `work/sprints/SPRINT-003.md`
- `work/sprints/ledger.tsv`
- `work/tickets/02-data-ingestion-platform/EPIC.md`
- `work/tickets/02-data-ingestion-platform/BW-0201-mediawiki-api-client.md`
- `work/tickets/02-data-ingestion-platform/BW-0202-source-snapshot-provenance.md`
- `work/tickets/02-data-ingestion-platform/BW-0203-skill-id-enumerator.md`
- `work/tickets/02-data-ingestion-platform/BW-0204-wikitext-template-parser-spike.md`
- `work/tickets/02-data-ingestion-platform/BW-0205-icon-metadata-resolver.md`
- `work/tickets/02-data-ingestion-platform/BW-0206-normalized-artifact-writer.md`
- `work/tickets/02-data-ingestion-platform/BW-0207-data-qa-report-framework.md`
- `work/tickets/02-data-ingestion-platform/BW-0208-regenerate-command-and-docs.md`
- `scripts/data/README.md`
- `scripts/data/requirements.txt` or equivalent pinned data-tool dependency file if Python
  dependencies are introduced

**Tasks:**

- [ ] Confirm the executable sprint at `work/sprints/SPRINT-003.md` links to `EPIC-02` and
      `BW-0201` through `BW-0208`.
- [ ] Add or update the `SPRINT-003` ledger row as execution starts.
- [ ] Move `SPRINT-003`, `EPIC-02`, and the active BW ticket to `in-progress` before implementation
      changes.
- [ ] Preserve the ticket dependency graph: `BW-0201 -> BW-0202 -> BW-0203/BW-0204 -> BW-0205 ->
      BW-0206 -> BW-0207 -> BW-0208`, with `BW-0206` waiting for the minimal parser/icon outputs it
      serializes.
- [ ] Establish the Python ingestion module skeleton under `scripts/data/build_wars_ingest/`.
- [ ] Document any new Python dependency setup and keep dependency versions reproducible.
- [ ] Confirm no source-derived raw payloads, generated catalogs, QA reports, or icon binaries are
      added to tracked files during setup.

**Verification:**

- Manual review of sprint, ticket, and ledger consistency.
- `npm run verify` still passes before ingestion behavior is added.

### Phase 2: BW-0201 MediaWiki API Client (~12% of effort)

**Files:**

- `scripts/data/build_wars_ingest/client.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/tests/test_client.py` or equivalent Python unit test path
- `scripts/data/README.md`
- `package.json` if a fast offline ingestion test command is added to `npm run verify`
- `work/tickets/02-data-ingestion-platform/BW-0201-mediawiki-api-client.md`

**Tasks:**

- [ ] Implement a reusable offline client for `https://wiki.guildwars.com/api.php`.
- [ ] Support JSON GET requests, query parameter normalization, batching within MediaWiki limits,
      and continuation token handling.
- [ ] Add bounded retry/backoff for transient network failures, rate limits, and `maxlag` responses.
- [ ] Attach request metadata needed for troubleshooting without dumping large response bodies by
      default.
- [ ] Require a descriptive User-Agent and document how to override contact text if needed.
- [ ] Keep the client independent of React, Vite, browser APIs, runtime app modules, and raw UI
      assumptions.
- [ ] Test continuation, batching, retry, `maxlag`, User-Agent, timeout, and failure reporting with
      offline mocked responses.

**Verification:**

- Focused offline Python client tests.
- `npm run verify`.

### Phase 3: BW-0202 Source Snapshot And Provenance Records (~12% of effort)

**Files:**

- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/hashes.py` if digest helpers are split out
- `scripts/data/build_wars_ingest/tests/test_snapshots.py`
- `test/fixtures/data-ingestion/source-snapshots/` for minimized synthetic or reviewed fixtures
- `data/source-snapshots/README.md`
- `compendium/data-qa-and-release.md` only if existing wording needs an EPIC-02-specific reference
- `work/tickets/02-data-ingestion-platform/BW-0202-source-snapshot-provenance.md`

**Tasks:**

- [ ] Define deterministic snapshot path rules for page titles, file titles, revisions, and fixture
      mode.
- [ ] Write raw payloads separately from `SourceSnapshotManifest` records.
- [ ] Include source name, family, canonical URL, page/file identity, revision ID, source revision
      timestamp, retrieval timestamp, content hash, artifact path, and retention decision.
- [ ] Treat source titles, URLs, filenames, and payload fields as untrusted data.
- [ ] Keep local raw snapshots ignored by default and document the exact criteria for any minimized
      committed fixture.
- [ ] Add tests for stable path generation, stable manifest keys, digest calculation, timestamp
      handling, missing revision facts, unsafe title characters, and ignored artifact policy.

**Verification:**

- Focused offline snapshot/provenance tests.
- `npm run verify`.

### Phase 4: BW-0203 Skill ID Enumerator (~10% of effort)

**Files:**

- `scripts/data/build_wars_ingest/skill_ids.py`
- `scripts/data/build_wars_ingest/tests/test_skill_ids.py`
- `test/fixtures/data-ingestion/skill-ids/`
- `data/generated/README.md`
- `work/tickets/02-data-ingestion-platform/BW-0203-skill-id-enumerator.md`

**Tasks:**

- [ ] Read `Guild Wars Wiki:Game integration/Skills/*` snapshots through the shared snapshot layer.
- [ ] Parse mappings from `Game link:Skill N` to target titles without silently dropping gaps,
      punctuation, quoted names, PvP suffixes, or special/effect entries.
- [ ] Emit a deterministic normalized skill ID map sorted by numeric skill ID.
- [ ] Attach source provenance to every mapping.
- [ ] Report duplicate IDs, duplicate target titles, malformed mappings, parse failures, missing
      source facts, and unexpected line shapes as QA findings.
- [ ] Keep profession/category page checks as optional QA cross-checks, not primary ID authority.
- [ ] Add minimized fixtures for ordinary mappings, PvP mappings, quoted names, punctuation,
      non-contiguous IDs, duplicate IDs, malformed rows, and special/effect entries.

**Verification:**

- Focused offline skill ID enumerator tests.
- `npm run verify`.

### Phase 5: BW-0204 Wikitext Template Parser Spike (~15% of effort)

**Files:**

- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/parser_spike.md` or `compendium/data-ingestion-parser-spike.md`
- `scripts/data/build_wars_ingest/tests/test_wikitext.py`
- `test/fixtures/data-ingestion/wikitext/`
- `work/tickets/02-data-ingestion-platform/BW-0204-wikitext-template-parser-spike.md`

**Tasks:**

- [ ] Evaluate `mwparserfromhell` as the default parser for local wikitext extraction.
- [ ] Extract top-level and nested templates while preserving useful source order, original template
      names, raw parameter names, and raw values.
- [ ] Normalize template and parameter names for matching without losing originals needed for QA.
- [ ] Surface unknown parameters and unhandled templates as QA findings or parser diagnostics.
- [ ] Identify concrete cases where `action=parse` or `action=expandtemplates` is needed as a
      fallback, but do not make remote expansion the default path.
- [ ] Record a recommendation to continue with `mwparserfromhell`, switch parser, or use a hybrid
      fallback.
- [ ] Do not attempt full skill catalog extraction in this sprint.

**Verification:**

- Focused offline parser fixture tests.
- Parser spike recommendation reviewed against EPIC-02 parser requirements.
- `npm run verify`.

### Phase 6: BW-0205 Icon Metadata Resolver (~9% of effort)

**Files:**

- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/icons/`
- `data/generated/README.md`
- `work/tickets/02-data-ingestion-platform/BW-0205-icon-metadata-resolver.md`

**Tasks:**

- [ ] Resolve explicit `image=` fields from parsed template data.
- [ ] Derive default candidates such as `File:{name}.jpg` and `File:{name}.png` when pages rely on
      infobox defaults.
- [ ] Query or fixture `prop=imageinfo` metadata for URL, MIME type, width, height, file size, upload
      timestamp, SHA-1, and description URL.
- [ ] Define deterministic candidate preference rules and ambiguity reporting.
- [ ] Normalize icon metadata into `RemoteMediaMetadata`-compatible JSON with `cachedBytes: false`.
- [ ] Report missing, ambiguous, non-64x64, unexpected MIME, missing hash, and missing provenance
      cases.
- [ ] Prove no icon bytes, thumbnails, screenshots, or cached media files are written.

**Verification:**

- Focused offline icon resolver tests.
- `npm run verify`.

### Phase 7: BW-0206 Normalized Artifact Writer (~9% of effort)

**Files:**

- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `test/fixtures/data-ingestion/generated/`
- `data/generated/README.md`
- `src/domain/source.ts` only if minor exported constants or vocabulary alignment is required
- `test/domain/source-policy.test.ts` or `test/domain/contracts.test.ts` if TypeScript compatibility
  fixtures are added
- `work/tickets/02-data-ingestion-platform/BW-0206-normalized-artifact-writer.md`

**Tasks:**

- [ ] Implement stable JSON output with deterministic sort rules, key ordering, indentation, newline
      behavior, and digest calculation.
- [ ] Write `GeneratedArtifactManifest`-compatible metadata with generator, inputs, source IDs,
      record count, digest, QA report path, commit decision, and notes.
- [ ] Preserve unknown IDs and unresolved references without destructive coercion.
- [ ] Distinguish factual metadata, copied text, derived values, linked-only media metadata, and
      manual overrides in provenance fields.
- [ ] Add a minimized generated artifact fixture that TypeScript tests can load to prove alignment
      with `src/domain` contracts where practical.
- [ ] Keep generated artifact contents ignored by default except for explicitly scoped fixtures under
      `test/fixtures`.

**Verification:**

- Focused artifact determinism tests.
- TypeScript contract compatibility test if a JSON fixture is added.
- `npm run verify`.

### Phase 8: BW-0207 Data QA Report Framework (~10% of effort)

**Files:**

- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `test/fixtures/data-ingestion/qa/`
- `data/qa/README.md`
- `compendium/data-qa-and-release.md` only if new EPIC-02 finding codes need documentation
- `work/tickets/02-data-ingestion-platform/BW-0207-data-qa-report-framework.md`

**Tasks:**

- [ ] Generate `QaFinding` and `QaReport`-compatible records with stable IDs, categories,
      severities, scopes, evidence references, dispositions, summaries, and gate decisions.
- [ ] Fail validation on open critical findings such as duplicate IDs, missing provenance, schema
      shape errors, unreadable artifacts, and digest mismatches.
- [ ] Preserve warnings for missing optional icon metadata, ambiguous source status, unknown template
      params, parser fallbacks, generated diffs, and manual overrides.
- [ ] Keep evidence bounded to references, small excerpts only when explicitly reviewed, and no large
      copied source payloads.
- [ ] Add deterministic report tests for finding sorting, summary counts, gate decisions, duplicate
      detection, missing provenance, warning preservation, and report path stability.

**Verification:**

- Focused QA report tests.
- `npm run verify`.

### Phase 9: BW-0208 Regenerate Command, Docs, And Closeout (~13% of effort)

**Files:**

- `scripts/data/build_wars_ingest/regenerate.py`
- `scripts/data/regenerate.py` if used as the stable entrypoint
- `scripts/data/README.md`
- `README.md`
- `package.json`
- `data/README.md`
- `data/source-snapshots/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `work/tickets/02-data-ingestion-platform/*.md`
- `work/tickets/02-data-ingestion-platform/EPIC.md`
- `work/sprints/SPRINT-003.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Add one documented offline fixture command for deterministic regeneration and tests.
- [ ] Add one explicit live refresh command for Guild Wars Wiki API access, with warning text about
      ignored artifacts and source policy limits.
- [ ] Make command output summarize fetched pages, generated records, QA findings, gate status, and
      artifact paths.
- [ ] Add the fast offline ingestion test command to `npm run verify` if it is stable and does not
      require network access.
- [ ] Document Python dependency installation, fixture mode, live mode, artifact locations, common
      failures, and how later content epics add extractors.
- [ ] Mark `BW-0201` through `BW-0208` done only after each ticket's acceptance criteria pass.
- [ ] Mark `EPIC-02`, `SPRINT-003`, and the ledger row completed only after the entire Definition of
      Done passes.
- [ ] Leave no actionable unchecked checklist items in the final execution copy of
      `work/sprints/SPRINT-003.md` when execution reports completion.

**Verification:**

- Offline regenerate fixture command.
- `npm run verify`.
- Manual review of EPIC, ticket, sprint, ledger, docs, and ignore-policy consistency.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `scripts/data/build_wars_ingest/__init__.py` | Create | Importable Python ingestion package boundary |
| `scripts/data/build_wars_ingest/profiles.py` | Create | Source profile constants for Guild Wars Wiki |
| `scripts/data/build_wars_ingest/client.py` | Create | MediaWiki API request, continuation, batching, retry, and `maxlag` handling |
| `scripts/data/build_wars_ingest/snapshots.py` | Create | Raw payload and `SourceSnapshotManifest` writing |
| `scripts/data/build_wars_ingest/hashes.py` | Create if useful | Shared digest helpers |
| `scripts/data/build_wars_ingest/skill_ids.py` | Create | Skill ID mapping extraction |
| `scripts/data/build_wars_ingest/wikitext.py` | Create | Parser spike and generic template extraction wrapper |
| `scripts/data/build_wars_ingest/icons.py` | Create | Metadata-only icon resolver |
| `scripts/data/build_wars_ingest/artifacts.py` | Create | Deterministic generated JSON and manifest writer |
| `scripts/data/build_wars_ingest/qa.py` | Create | QA finding/report framework and gate decisions |
| `scripts/data/build_wars_ingest/regenerate.py` | Create | Pipeline orchestration |
| `scripts/data/regenerate.py` | Create if chosen | Stable documented command entrypoint |
| `scripts/data/build_wars_ingest/tests/` | Create | Offline Python tests for ingestion modules |
| `scripts/data/requirements.txt` | Create if dependencies are introduced | Reproducible Python parser dependency setup |
| `test/fixtures/data-ingestion/` | Create | Minimized synthetic or reviewed offline fixtures |
| `test/domain/contracts.test.ts` | Modify if needed | Verify generated JSON fixture compatibility with domain contracts |
| `test/domain/source-policy.test.ts` | Modify if needed | Verify provenance/QA fixture compatibility |
| `src/domain/source.ts` | Modify only if needed | Align missing constants or vocabulary discovered during ingestion |
| `package.json` | Modify | Add fast offline ingestion verification scripts when stable |
| `README.md` | Modify | Document data-tool setup and verification changes |
| `scripts/data/README.md` | Modify | Document pipeline commands, modes, extension points, and constraints |
| `data/README.md` | Modify if needed | Keep artifact lifecycle and commit policy accurate |
| `data/source-snapshots/README.md` | Modify if needed | Document snapshot refresh and retention behavior |
| `data/generated/README.md` | Modify if needed | Document generated artifact and manifest behavior |
| `data/qa/README.md` | Modify if needed | Document QA report behavior and gate semantics |
| `compendium/data-qa-and-release.md` | Modify if needed | Add EPIC-02-specific QA codes only if they become normative |
| `work/tickets/02-data-ingestion-platform/*.md` | Modify | Maintain ticket status, sprint linkage, and acceptance closeout |
| `work/tickets/02-data-ingestion-platform/EPIC.md` | Modify | Maintain EPIC status and sprint linkage |
| `work/sprints/SPRINT-003.md` | Create/Modify | Executable sprint and final checklist state |
| `work/sprints/ledger.tsv` | Modify | Track sprint execution and completion state |

## Definition of Done

- [ ] `work/sprints/SPRINT-003.md` exists, follows the sprint template, links `EPIC-02`, and lists
      `BW-0201` through `BW-0208`.
- [ ] `BW-0201` through `BW-0208` are linked to `SPRINT-003` and marked done only after their
      acceptance criteria pass.
- [ ] `EPIC-02`, `SPRINT-003`, and `work/sprints/ledger.tsv` have consistent final statuses.
- [ ] The ingestion code lives under `scripts/data/` and runtime app code does not import it.
- [ ] `src/domain` remains framework-neutral and does not import data scripts, network clients,
      browser APIs, React, app modules, raw snapshots, generated artifacts, or QA reports.
- [ ] The MediaWiki client supports User-Agent, batching, continuation, retry/backoff, `maxlag`,
      timeout/failure reporting, and bounded request metadata logging.
- [ ] Snapshot writing records page/file identity, revision facts, source URL, retrieval timestamp,
      digest, artifact path, and retention policy in `SourceSnapshotManifest`-compatible JSON.
- [ ] Skill ID enumeration produces deterministic sorted mappings with provenance and reports
      duplicate, malformed, missing, and unexpected mappings.
- [ ] The parser spike proves or rejects `mwparserfromhell` with representative minimized fixtures and
      records a clear recommendation.
- [ ] Icon resolution records metadata-only `RemoteMediaMetadata`-compatible data and reports
      missing, ambiguous, invalid-dimension, unexpected-MIME, and missing-provenance cases.
- [ ] Generated JSON and `GeneratedArtifactManifest` output are deterministic across repeated offline
      runs aside from intentionally controlled timestamps.
- [ ] QA reports use EPIC-01-compatible categories, severities, dispositions, summaries, evidence
      references, and app/public gate decisions.
- [ ] The offline regenerate command runs without network access and fails clearly on open critical
      findings.
- [ ] The live regenerate command is documented as manual, uses polite API behavior, and writes
      ignored local artifacts.
- [ ] `npm run verify` passes and includes only fast offline ingestion checks if ingestion checks are
      added to it.
- [ ] Documentation explains Python dependency setup, fixture mode, live mode, artifact locations,
      generated/ignored policy, QA gate behavior, and downstream extractor extension points.
- [ ] No full raw source payloads, generated production catalogs, QA reports, icon binaries,
      screenshots, copied PvX/Fandom/community prose, ratings text, usage notes, or page bodies are
      tracked.
- [ ] Any committed external fixture excerpt is minimized, explicitly scoped, provenance-bearing,
      policy-reviewed, and stored outside ignored production artifact directories.
- [ ] The final execution copy of `work/sprints/SPRINT-003.md` has no actionable unchecked checklist
      items when the execution manifest reports completion.

## Risks

- **Parser confidence**: Guild Wars Wiki templates may include edge cases not represented in the
  initial fixtures. Mitigation: keep this sprint to parser proof and diagnostics; full catalog
  completeness belongs to EPIC-03 and EPIC-04.
- **Scope creep into catalog extraction**: EPIC-02 can easily become a full skill import. Mitigation:
  only produce platform behavior plus minimized proof outputs; full profession and skill records are
  downstream scope.
- **Python dependency friction**: `mwparserfromhell` introduces non-npm setup. Mitigation: pin or
  otherwise make dependencies reproducible, document setup, and keep verify failures explicit.
- **Dual contract drift**: Python JSON writers can drift from TypeScript domain contracts.
  Mitigation: reuse exact vocabulary, add minimized compatibility fixtures, and avoid a separate
  schema vocabulary unless a later ticket chooses it.
- **Live API instability**: Network failures, rate limits, wiki changes, and `maxlag` can make live
  refreshes noisy. Mitigation: live mode is manual; automated tests mock responses and use fixture
  mode.
- **Artifact churn**: Retrieval timestamps and source changes can make generated outputs hard to
  review. Mitigation: isolate timestamps in manifests, use stable sorting/key order, include digests,
  and keep production artifacts ignored by default.
- **Policy violations through fixtures**: Real source snippets can accidentally become broad copied
  payloads. Mitigation: default to synthetic fixtures; any external fixture must be minimized,
  reviewed, provenance-bearing, and explicitly scoped.

## Security

- Treat all source URLs, titles, file names, wikitext, template values, API responses, and generated
  evidence as untrusted input.
- Sanitize artifact paths so wiki titles cannot write outside approved data or fixture directories.
- Do not execute source-provided template text, HTML, JavaScript, URLs, or shell fragments.
- Do not log large response bodies, copied page bodies, secrets, local environment values, or
  unbounded source payloads by default.
- Keep live network access out of browser runtime code and out of automated verification.
- Use HTTPS for live Guild Wars Wiki API requests.
- Do not download, cache, commit, or bundle icon binaries, screenshots, thumbnails, or prior-art
  images.
- Preserve EPIC-01 non-waivable cases: unknown copied material, digest mismatch, and unreadable
  artifacts must be resolved or excluded before any public release scope.
- Keep `.env`, local credentials, and machine-specific paths out of generated artifacts and QA
  reports.

## Dependencies

- `SPRINT-001 Project Foundation` is complete and provides the single private npm package, React/Vite
  shell, `src/domain` boundary, strict TypeScript setup, data directories, and `npm run verify`.
- `SPRINT-002 Source Policy and QA` is complete and provides source policy, provenance vocabulary,
  artifact retention rules, QA/review gates, data READMEs, and `src/domain/source.ts` contracts.
- `EPIC-02` depends on `EPIC-00` and `EPIC-01`; both are done.
- Ticket order is constrained by existing frontmatter:
  `BW-0201 -> BW-0202 -> BW-0203/BW-0204 -> BW-0205 -> BW-0206 -> BW-0207 -> BW-0208`.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3, and the existing npm toolchain remain required.
- If `mwparserfromhell` is adopted, the sprint must add reproducible Python dependency setup before
  parser tests become required by `npm run verify`.
- Guild Wars Wiki MediaWiki API behavior is an external dependency for live mode only; fixture mode
  must not depend on the network.

## Open Questions

1. What exact Python dependency workflow should the repo standardize on for ingestion: a
   `scripts/data/requirements.txt`, a root `requirements-dev.txt`, a future `pyproject.toml`, or a
   documented local-only install step?
2. Should generated artifact timestamps be fixed or injectable in fixture mode so repeated
   regeneration is byte-for-byte identical?
3. Which minimal external fixture excerpts are worth the EPIC-01 review cost, and which cases can be
   represented synthetically?
4. Should parser diagnostics be first-class QA findings immediately, or should the spike emit a
   narrower diagnostic report that `BW-0207` later maps into `QaFinding` records?
5. What is the precise failure threshold for the offline regenerate command: all open critical
   findings, all errors, or a configurable release-scope gate?
6. How much TypeScript validation is enough for Python-generated JSON before a future runtime schema
   validator exists?
7. Should live refresh writes include raw response JSON, extracted wikitext, or both, and how should
   that choice affect digests and diff review?
8. Which downstream epic should approve the first exact-path generated artifact commit:
   `EPIC-03 Professions and Attributes`, `EPIC-04 Skills`, or a separate generated-data promotion
   ticket?
