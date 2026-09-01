---
id: SPRINT-003
title: Data Ingestion Platform
status: completed
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

This sprint turns `EPIC-02 Data Ingestion Platform` into a reusable offline ingestion spine for
Build Wars. It adds shared tooling under `scripts/data` for Guild Wars Wiki MediaWiki API access,
source snapshots, parser proofing, skill-ID enumeration, metadata-only icon resolution,
deterministic artifact writing, QA reports, and one documented regenerate command.

The sprint is a platform increment, not a catalog rollout. Its durable extraction scope is the
skill-ID map and supporting proof artifacts needed to validate the pipeline. Full profession,
attribute, skill, equipment, rune, insignia, hero, title, community build, and runtime app data
consumption remain in later epics.

The browser app stays isolated from source APIs, Python tooling, raw snapshots, generated working
artifacts, and QA reports. Automated verification must stay fast and offline; live wiki refresh is
an explicit manual mode that writes ignored local artifacts.

## Use Cases

1. **Fetch wiki metadata safely**: A maintainer can query the Guild Wars Wiki MediaWiki API through
   one client with batching, continuation, retries, `maxlag`, timeouts, and a descriptive User-Agent.
2. **Replay source revisions offline**: A fetched page or file metadata response can be stored as an
   ignored snapshot with source URL, page/file identity, revision facts, retrieval time, digest, and
   retention decision.
3. **Enumerate skill IDs**: Later skill and template work can consume or regenerate a deterministic
   skill-id-to-page-title map from `Guild Wars Wiki:Game integration/Skills/*`.
4. **Prove template parsing**: The parser spike can represent nested wikitext templates, wrappers,
   redirects, and disambiguation preambles without regex-only nested parsing.
5. **Resolve icon metadata without media bytes**: Extractors can record remote file metadata and QA
   ambiguity without downloading, committing, or bundling icon images.
6. **Review deterministic outputs**: Generated JSON, manifests, and QA reports are stable under
   fixed inputs and clocks, carry provenance, and can be inspected in local diffs.
7. **Run one offline regeneration path**: Contributors can run a documented fixture mode that
   exercises the pipeline end to end without network access.
8. **Extend one platform**: Later content epics can add source profiles and extractors without new
   HTTP clients, snapshot formats, artifact writers, QA schemas, or command wrappers.

## Architecture

### Boundaries

| Concern             | Owner                                                              | Boundary                                                                                                        |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Browser runtime     | `src/app`                                                          | May consume approved normalized data in later epics; must not import data tooling or fetch raw wiki data.       |
| Domain contracts    | `src/domain`                                                       | Plain JSON-compatible TypeScript contracts; no React, DOM, browser storage, network, or `scripts/data` imports. |
| Ingestion tooling   | `scripts/data`                                                     | Offline/live tooling, fixtures, parsers, writers, QA, and command orchestration.                                |
| Raw snapshots       | `data/source-snapshots`                                            | Ignored local source payloads and snapshot manifests; never runtime input.                                      |
| Generated artifacts | `data/generated`                                                   | Ignored normalized outputs and manifests until a later exact-path ticket approves promotion.                    |
| QA reports          | `data/qa`                                                          | Ignored machine-readable and human-readable validation reports; not runtime data.                               |
| Policy              | `compendium/source-policy.md`, `compendium/data-qa-and-release.md` | Normative source, media, retention, QA, review, and release gates.                                              |

### Data Flow

```text
source profile
  -> MediaWiki API client (live mode only)
  -> SourceSnapshotManifest + ignored raw payload
  -> snapshot-driven extractor/parser/icon adapters
  -> normalized records + diagnostics
  -> GeneratedArtifactManifest + canonical JSON
  -> QaReport JSON + human-readable summary
  -> explicit later promotion gate
```

Extractors consume verified snapshot values, not a network client. The command owns live fetching and
then runs the same snapshot-driven stages used by offline and fixture modes.

### Module Shape

Use one importable Python package plus a thin command entrypoint:

- `scripts/data/build_wars_ingest/config.py` - source profiles, versions, limits, clocks, and roots
- `scripts/data/build_wars_ingest/api.py` - MediaWiki client, continuation, batching, retry, and
  request metadata
- `scripts/data/build_wars_ingest/models.py` - internal records, diagnostics, and JSON assembly
- `scripts/data/build_wars_ingest/snapshots.py` - snapshot identity, safe paths, hashing, atomic
  writes, and integrity checks
- `scripts/data/build_wars_ingest/wikitext.py` - `mwparserfromhell` traversal, parser diagnostics,
  and parser spike helpers
- `scripts/data/build_wars_ingest/skill_ids.py` - game-integration skill-ID enumeration
- `scripts/data/build_wars_ingest/icons.py` - icon candidate derivation and `imageinfo` metadata
- `scripts/data/build_wars_ingest/artifacts.py` - canonical JSON, generated manifests, digests, and
  explicit baseline comparison
- `scripts/data/build_wars_ingest/qa.py` - diagnostic-to-finding mapping, stable IDs, summaries, and
  gate decisions
- `scripts/data/build_wars_ingest/pipeline.py` - source profile, extractor, and stage orchestration
- `scripts/data/build_wars_ingest/cli.py` - fixture/offline/live command behavior and exit codes
- `scripts/data/regenerate.py` - documented stable script entrypoint
- `scripts/data/build_wars_ingest/tests/` - offline Python `unittest` coverage

### Contract Strategy

`src/domain/source.ts` is authoritative for source family, material class, provenance method, rights
basis, use decision, remote media metadata, snapshot manifests, generated artifact manifests,
QA findings, and QA reports. Python output should use the same camelCase wire fields and vocabulary
for those shapes.

The skill-ID map may use a tool-local artifact envelope unless a concrete downstream consumer needs a
new durable TypeScript domain type. If implementation discovers a real representational gap in the
existing domain contracts, it must make the smallest backward-compatible TypeScript change and add
Python and Vitest coverage in the same phase.

### Determinism

Fixture mode uses injected UTC clocks, sleepers, transports, and output roots. Canonical JSON is
UTF-8, LF-terminated, two-space indented, key-stable, finite-number-only, and sorted by
schema-owned record keys. Local artifact integrity uses SHA-256 over explicitly named bytes; remote
MediaWiki SHA-1 values remain source metadata only.

Fixed inputs, fixed configuration, fixed dependency versions, and fixed clocks must produce
byte-identical fixture artifacts, manifests, QA finding IDs, report order, and summaries. Live mode
may have new retrieval timestamps and source revisions, but those differences must be explicit in
manifests and QA.

### QA Gate

Every stage returns diagnostics with stable codes, severity, scope, and bounded evidence. `qa.py`
maps diagnostics to the existing `QaFinding`/`QaReport` shapes and centralizes gate decisions.

Minimum gate behavior:

- duplicate IDs, missing required provenance, invalid source references, unreadable artifacts,
  digest mismatches, schema-shape failures, and forbidden cached-media indicators block while open
- malformed mappings, unresolved redirects, missing revision facts, and parser loss are errors or
  critical findings depending on scope
- missing optional icon metadata, ambiguous icon candidates, unknown template parameters, source
  drift, and manual-review concerns are preserved as warnings or info unless policy marks them
  blocking
- reports are written before a blocking regenerate command exits nonzero
- unknown copied material, digest mismatch, and unreadable artifacts remain non-waivable for public
  release

### Modes

- `fixture`: committed minimized fixtures, fixed clock, temporary or configured output root, no
  network; required by tests and `npm run verify`.
- `offline`: existing ignored snapshots on disk, no network; used for local reproducible
  investigation.
- `live`: explicit Guild Wars Wiki refresh through the shared client; manual only, bounded, polite,
  and not part of automated verification.

## Implementation

### Phase 1: Traceability And Tooling Scaffold (~10% of effort)

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
- `scripts/data/build_wars_ingest/__init__.py`
- `scripts/data/build_wars_ingest/tests/__init__.py`
- `scripts/data/requirements.txt` or an equivalent reproducible parser dependency file
- `.gitignore`
- `README.md`
- `scripts/data/README.md`

**Tasks:**

- [x] Confirm `EPIC-00`, `SPRINT-001`, `EPIC-01`, and `SPRINT-002` are complete before execution
      starts.
- [x] Add or update the `SPRINT-003` ledger row as execution begins.
- [x] Move `SPRINT-003`, `EPIC-02`, and only the active BW ticket through the repository status
      vocabulary during execution.
- [x] Preserve the ticket graph: BW-0201 -> BW-0202 -> BW-0203 and BW-0204; BW-0205 depends on
      BW-0201, BW-0202, and BW-0204; BW-0206 depends on BW-0202 through BW-0205; BW-0207 depends on
      BW-0203 through BW-0206; BW-0208 depends on BW-0201 through BW-0207.
- [x] Create the importable Python package and test layout under `scripts/data`.
- [x] Choose and document the supported Python baseline and reproducible setup path for
      `mwparserfromhell`.
- [x] Add setup/test/regenerate npm scripts only after they are stable and offline where required.
- [x] Ensure `.gitignore` keeps parser environments, live snapshots, generated outputs, and QA
      reports out of tracked files while preserving README policy files.

**Verification:**

- Manual review of sprint, ticket, ledger, and setup documentation consistency.
- Existing `npm run verify` still passes before behavior is added.

### Phase 2: BW-0201 MediaWiki API Client (~15% of effort)

**Files:**

- `scripts/data/build_wars_ingest/api.py`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/tests/test_api.py`
- `scripts/data/README.md`
- `work/tickets/02-data-ingestion-platform/BW-0201-mediawiki-api-client.md`

**Tasks:**

- [x] Implement GET-only JSON access to `https://wiki.guildwars.com/api.php`.
- [x] Set `format=json`, `formatversion=2`, `maxlag`, finite timeouts, response byte caps, and a
      descriptive User-Agent.
- [x] Accept query parameters, not arbitrary URLs; validate the final response origin after
      redirects.
- [x] Implement generic continuation by propagating the full MediaWiki `continue` object with cycle
      and page-count limits.
- [x] Implement batching for title/page/revision and `imageinfo` helpers while preserving
      caller-visible deterministic ordering.
- [x] Retry only idempotent transient failures, HTTP 429/502/503/504, malformed temporary network
      failures, `Retry-After`, and HTTP-200 MediaWiki `maxlag` errors within bounded budgets.
- [x] Normalize permanent API errors, malformed JSON, oversized responses, missing pages, and partial
      batch failures into testable errors or diagnostics.
- [x] Log bounded request metadata without dumping response bodies, raw wikitext, headers, secrets,
      or local environment values.

**Verification:**

- Offline unit tests for success, continuation with multiple token keys, continuation cycles,
  batching boundaries, reordered responses, retry exhaustion, `Retry-After`, `maxlag`, malformed
  JSON, oversized bodies, final-origin rejection, and sanitized logs.
- `npm run verify` once data tests are wired in Phase 6.

### Phase 3: BW-0202 Snapshot And Provenance Records (~15% of effort)

**Files:**

- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/tests/test_snapshots.py`
- `test/fixtures/data-ingestion/source-snapshots/`
- `data/source-snapshots/README.md`
- `work/tickets/02-data-ingestion-platform/BW-0202-source-snapshot-provenance.md`

**Tasks:**

- [x] Write raw payloads separately from `SourceSnapshotManifest` records.
- [x] Use safe snapshot identities based on source family, validated page/file identity, revision ID
      where available, and content SHA-256; never derive paths directly from untrusted titles.
- [x] Record source name, family, canonical URL, page/file identity, revision ID, source revision
      timestamp, retrieval timestamp, content hash, artifact path, and ignored retention decision.
- [x] Reuse byte-identical existing snapshots, reject identity/content collisions, and create a new
      identity for changed revisions or changed content.
- [x] Verify SHA-256 on load before returning snapshot data to extractors.
- [x] Use path confinement, symlink escape rejection where practical, atomic sibling temporary files,
      and cleanup that preserves the last valid generation after failure.
- [x] Emit diagnostics for missing revision facts, unreadable artifacts, digest mismatch, path
      problems, and malformed snapshot metadata.

**Verification:**

- Offline tests for stable path generation, non-ASCII titles, unsafe characters, title collisions,
  path traversal, symlink escapes where supported, missing revisions, digest mismatch, interrupted
  writes, identical refetch, changed revision, changed content, and manifest key stability.
- `npm run verify`.

### Phase 4: BW-0204 Parser Spike And BW-0203 Skill-ID Enumerator (~25% of effort)

**Files:**

- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/skill_ids.py`
- `scripts/data/build_wars_ingest/tests/test_wikitext.py`
- `scripts/data/build_wars_ingest/tests/test_skill_ids.py`
- `test/fixtures/data-ingestion/wikitext/`
- `test/fixtures/data-ingestion/skill-ids/`
- `compendium/data-ingestion-platform.md`
- `compendium/README.md`
- `work/tickets/02-data-ingestion-platform/BW-0203-skill-id-enumerator.md`
- `work/tickets/02-data-ingestion-platform/BW-0204-wikitext-template-parser-spike.md`

**Tasks:**

- [x] Evaluate `mwparserfromhell` through minimized fixtures before parser-dependent icon or catalog
      work proceeds.
- [x] Preserve template order, nesting, original template names, normalized names, raw parameter
      names, raw values, duplicate parameters, positional parameters, comments, `<nowiki>` where
      relevant, redirects, wrappers, and disambiguation preambles.
- [x] Cover `Skill infobox`, `Skill progression`, `gr`, `gr2`, title-rank progression,
      `pveversion`, `pvpversion`, morale-boost recharge, quoted names, punctuation, redirects, and
      disambiguation cases.
- [x] Surface unknown templates, unknown parameters, lossy parsing, unsupported constructs, and
      parser fallback needs as diagnostics.
- [x] Record a compendium recommendation to continue with `mwparserfromhell`, switch parsers, or add
      a bounded diagnostic fallback. If the parser loses required structure, block parser-dependent
      icon/full-catalog work and record the reason.
- [x] Implement the game-integration skill-ID enumerator from verified snapshots separately from the
      nested-template parser.
- [x] Parse `Game link:Skill N` mappings to target titles while preserving numeric ID, title,
      source page, source URL, revision, line scope, and provenance.
- [x] Report duplicate IDs, duplicate target titles, malformed candidates, non-integer or
      out-of-range IDs, gaps, redirect ambiguity, and unexpected line shapes without silent drops.
- [x] Keep profession/category pages optional QA cross-checks, not the primary ID authority.

**Verification:**

- Offline parser tests for the named fixture corpus and lossy/fallback diagnostics.
- Offline skill-ID tests for ordinary, non-contiguous, PvP/parenthetical, quoted, punctuation-heavy,
  special/effect, duplicate, malformed, and gap cases.
- Manual review of `compendium/data-ingestion-platform.md`.
- `npm run verify`.

### Phase 5: BW-0205 Icons, BW-0206 Artifacts, And BW-0207 QA (~25% of effort)

**Files:**

- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `test/fixtures/data-ingestion/icons/`
- `test/fixtures/data-ingestion/generated/`
- `test/fixtures/data-ingestion/qa/`
- `test/domain/data-ingestion-contracts.test.ts`
- `data/generated/README.md`
- `data/qa/README.md`
- `work/tickets/02-data-ingestion-platform/BW-0205-icon-metadata-resolver.md`
- `work/tickets/02-data-ingestion-platform/BW-0206-normalized-artifact-writer.md`
- `work/tickets/02-data-ingestion-platform/BW-0207-data-qa-report-framework.md`

**Tasks:**

- [x] Resolve explicit `image=` file titles after MediaWiki normalization or redirects confirm them.
- [x] Derive default `File:{page title}.jpg` and `File:{page title}.png` candidates when no explicit
      image exists.
- [x] Query or fixture `prop=imageinfo` for direct URL, description URL, MIME type, dimensions, byte
      size, upload timestamp, and remote SHA-1.
- [x] Select only a confirmed explicit candidate or a unique valid default candidate; ambiguous
      defaults produce no arbitrary winner.
- [x] Emit `RemoteMediaMetadata`-compatible records with `cachedBytes: false` and resolvable source
      IDs.
- [x] Write canonical generated JSON and `GeneratedArtifactManifest` records with stable key order,
      record order, schema/generator metadata, input snapshots, source IDs, record count, digest,
      QA report path, and ignored commit decision.
- [x] Keep the first artifact scope narrow: skill-ID mapping plus synthetic parser/icon proof
      outputs needed for platform validation.
- [x] Add a shared golden fixture generated by Python and structurally asserted by Vitest against
      exported domain expectations.
- [x] Implement QA finding codes, category/severity mapping, stable IDs, deterministic sorting,
      summary counts, app/public gate decisions, JSON reports, and bounded text summaries.
- [x] Implement optional explicit baseline comparison with defined no-baseline and schema-mismatch
      behavior.
- [x] Ensure a blocked gate writes reports before returning a documented nonzero exit code.

**Verification:**

- Offline icon tests for explicit/default, redirect, uppercase extension, one/multiple/no candidate,
  missing fields, unusual MIME, non-64x64, absent SHA-1, response reorder, and metadata-only
  invariants.
- Offline artifact tests for canonical bytes, key order, record order, Unicode, line endings,
  finite-number rejection, digest correctness, input reorder, frozen/changing clocks, atomic writes,
  path confinement, and byte-identical reruns.
- Offline QA tests for stable IDs/order, duplicate IDs, missing provenance, invalid source
  references, unknown params, unresolved redirects, icon ambiguity, schema-shape failures, digest
  mismatch, accepted-risk metadata, non-waivable cases, no-baseline behavior, and report persistence
  on failure.
- Vitest contract-alignment test for representative generated JSON.
- `npm run verify`.

### Phase 6: BW-0208 Regenerate Command, Documentation, And Closeout (~10% of effort)

**Files:**

- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/regenerate.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `package.json`
- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/source-snapshots/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `work/tickets/02-data-ingestion-platform/*.md`
- `work/tickets/02-data-ingestion-platform/EPIC.md`
- `work/sprints/SPRINT-003.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [x] Expose one regenerate entrypoint with `fixture`, `offline`, and explicit `live` modes.
- [x] Validate modes, profiles, roots, output paths, baseline paths, page/request limits, and live
      network intent before executing stages.
- [x] Run fixture mode through source loading, snapshot validation, extraction, parser/icon canaries,
      artifact writing, QA reporting, summary output, and exit behavior in a temporary or configured
      root.
- [x] Add `npm run data:setup`, `npm run data:test`, and `npm run data:regenerate` or equivalent
      scripts; include fast offline data tests in `npm run verify`.
- [x] Keep `npm run verify` offline and retain formatting, linting, TypeScript, Vitest, production
      build, ingestion tests, and ticket-burn tests.
- [x] Document setup, dependency pinning, modes, source limits, profile extension, artifact
      locations, baseline selection, expected exit codes, live-smoke checklist, troubleshooting,
      safe refresh/deletion, and exact-path promotion gates.
- [x] Run fixture regeneration twice and prove stable output under a fixed clock.
- [x] Optionally run a bounded manual live smoke that records only request counts, revisions,
      digests, artifact paths, and QA summary; do not require this for automated verification.
- [x] Inspect Git status for raw live payloads, generated production artifacts, QA reports, media
      binaries, copied prose, secrets, machine-specific paths, and unrelated feature work.
- [x] Mark BW-0201 through BW-0208 done only after their acceptance criteria pass.
- [x] Mark EPIC-02, SPRINT-003, and the ledger row complete only after every Definition of Done item
      passes.

**Verification:**

- Offline CLI and pipeline tests.
- Fixture regenerate command run twice with stable output.
- `npm run verify`.
- Manual review of documentation, ticket, sprint, ledger, and artifact-policy consistency.

## Files Summary

| File                                                                        | Action                 | Purpose                                                               |
| --------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `scripts/data/build_wars_ingest/__init__.py`                                | Create                 | Importable Python ingestion package boundary                          |
| `scripts/data/build_wars_ingest/config.py`                                  | Create                 | Profiles, limits, roots, versions, clocks, and setup constants        |
| `scripts/data/build_wars_ingest/api.py`                                     | Create                 | MediaWiki API client, continuation, batching, retry, and `maxlag`     |
| `scripts/data/build_wars_ingest/models.py`                                  | Create                 | Internal records, diagnostics, and domain-wire assembly helpers       |
| `scripts/data/build_wars_ingest/snapshots.py`                               | Create                 | Snapshot identity, provenance, hashing, safe paths, and atomic writes |
| `scripts/data/build_wars_ingest/wikitext.py`                                | Create                 | `mwparserfromhell` parser adapter and parser spike diagnostics        |
| `scripts/data/build_wars_ingest/skill_ids.py`                               | Create                 | Game-integration skill-ID extraction                                  |
| `scripts/data/build_wars_ingest/icons.py`                                   | Create                 | Metadata-only icon resolver                                           |
| `scripts/data/build_wars_ingest/artifacts.py`                               | Create                 | Canonical JSON, manifests, digests, and baseline comparison           |
| `scripts/data/build_wars_ingest/qa.py`                                      | Create                 | QA finding/report generation and gate decisions                       |
| `scripts/data/build_wars_ingest/pipeline.py`                                | Create                 | Profile, extractor, and stage orchestration                           |
| `scripts/data/build_wars_ingest/cli.py`                                     | Create                 | Fixture/offline/live command behavior and exit codes                  |
| `scripts/data/build_wars_ingest/tests/`                                     | Create                 | Offline Python test suites                                            |
| `scripts/data/regenerate.py`                                                | Create                 | Stable documented command entrypoint                                  |
| `scripts/data/requirements.txt`                                             | Create                 | Reproducible parser dependency setup                                  |
| `test/fixtures/data-ingestion/`                                             | Create                 | Minimized offline fixtures and golden outputs                         |
| `test/domain/data-ingestion-contracts.test.ts`                              | Create                 | TypeScript structural checks for representative Python output         |
| `src/domain/source.ts`                                                      | Verify/modify narrowly | Canonical provenance/media/manifest/QA vocabulary                     |
| `src/domain/catalog.ts`                                                     | Verify/modify narrowly | Catalog compatibility only if a proven gap appears                    |
| `package.json`                                                              | Modify                 | Data setup/test/regenerate scripts and `verify` integration           |
| `.gitignore`                                                                | Modify narrowly        | Ignore parser envs and preserve data artifact deny-by-default policy  |
| `README.md`                                                                 | Modify                 | Data-tool setup and canonical verification documentation              |
| `scripts/data/README.md`                                                    | Modify                 | Concrete ingestion pipeline, modes, profiles, and extension points    |
| `data/README.md`                                                            | Modify                 | Implemented artifact lifecycle and promotion boundary                 |
| `data/source-snapshots/README.md`                                           | Modify                 | Snapshot identity, refresh, retention, and safe deletion              |
| `data/generated/README.md`                                                  | Modify                 | Deterministic artifacts, manifests, baselines, and commit gate        |
| `data/qa/README.md`                                                         | Modify                 | QA report behavior, retention, and gate semantics                     |
| `compendium/data-ingestion-platform.md`                                     | Create                 | Parser decision, fallback policy, and extension rules                 |
| `compendium/README.md`                                                      | Modify                 | Index the ingestion platform record                                   |
| `work/tickets/02-data-ingestion-platform/EPIC.md`                           | Modify                 | Sprint linkage and final status                                       |
| `work/tickets/02-data-ingestion-platform/BW-0201*.md` through `BW-0208*.md` | Modify                 | Ticket status, sprint linkage, and acceptance closeout                |
| `work/sprints/SPRINT-003.md`                                                | Modify                 | Execution checklist and final sprint state                            |
| `work/sprints/ledger.tsv`                                                   | Modify                 | Sprint planning and execution status                                  |

## Definition of Done

- [x] `scripts/data` contains a shared ingestion package covering client, snapshots, parser proof,
      skill-ID enumeration, icon metadata, artifact writing, QA, pipeline orchestration, and CLI
      entrypoint.
- [x] Runtime app code does not import `scripts/data`, call the wiki API, consume raw snapshots, or
      read QA reports.
- [x] `src/domain` remains framework-neutral and does not import data tooling, browser APIs, React,
      app modules, raw snapshots, generated artifacts, or QA reports.
- [x] `mwparserfromhell` is either accepted with evidence from representative fixtures or rejected
      with a recorded fallback/switch recommendation before parser-dependent work is closed.
- [x] Nested wiki templates are not parsed with regex-only extraction.
- [x] The MediaWiki client supports fixed-origin HTTPS GETs, User-Agent, batching, continuation,
      retry/backoff, `Retry-After`, `maxlag`, timeouts, response caps, final-origin checks, and
      sanitized metadata logging.
- [x] Snapshot writing records page/file identity, revision facts, source URL, retrieval timestamp,
      digest, artifact path, and retention policy in `SourceSnapshotManifest`-compatible JSON.
- [x] Snapshot paths are traversal-safe, writes are atomic, integrity is verified on load, identical
      refetches are idempotent, and collisions or digest mismatches do not overwrite evidence.
- [x] Skill-ID enumeration produces deterministic sorted mappings with provenance and reports
      duplicate, malformed, missing, gap, redirect, and unexpected-shape cases.
- [x] Parser fixtures cover the BW-0204 cases named in the sprint, preserve raw values/order/nesting,
      and surface unknown or lossy input.
- [x] Icon resolution emits metadata-only `RemoteMediaMetadata`-compatible records with
      `cachedBytes: false` and reports missing, ambiguous, invalid-dimension, unexpected-MIME, and
      missing-provenance cases.
- [x] Generated JSON and `GeneratedArtifactManifest` outputs are deterministic across repeated
      offline runs under fixed inputs and clock.
- [x] A shared golden fixture generated by Python is checked byte-for-byte by Python tests and
      structurally by Vitest against exported domain expectations.
- [x] QA reports use EPIC-01-compatible categories, severities, dispositions, summaries, evidence
      references, and app/public gate decisions.
- [x] Blocking QA gates write machine-readable JSON and a bounded human-readable summary before
      returning a documented nonzero exit code.
- [x] The offline fixture regenerate command runs without network access and is covered by automated
      CLI/pipeline tests.
- [x] Live refresh is explicit, bounded, polite, manual, and writes only ignored local artifacts.
- [x] `npm run verify` passes and includes only fast offline ingestion checks for this sprint.
- [x] Documentation agrees on Python setup, modes, source limits, artifacts, ignore/commit policy, QA
      gates, parser fallback policy, and downstream extractor extension.
- [x] No full raw live payloads, production generated catalogs, generated QA reports, icon binaries,
      screenshots, copied PvX/Fandom/community prose, ratings text, usage notes, or large wiki page
      bodies are tracked.
- [x] Any committed external fixture excerpt is minimized, explicitly scoped, provenance-bearing,
      policy-reviewed, and stored outside ignored production artifact directories.
- [x] BW-0201 through BW-0208 are linked to `SPRINT-003` and marked done only after their acceptance
      criteria pass.
- [x] EPIC-02, SPRINT-003, and `work/sprints/ledger.tsv` are completed only after every technical and
      bookkeeping criterion passes.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                              | Likelihood | Impact | Mitigation                                                                                                               |
| ------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| Sprint scope expands into full catalog extraction | Medium     | High   | Limit output to platform proof artifacts and the skill-ID map; defer catalog breadth to EPIC-03/04.                      |
| `mwparserfromhell` loses required structure       | Medium     | High   | Run the parser spike before parser-dependent closeout and record accept/reject/fallback evidence.                        |
| MediaWiki behavior causes silent misses           | Medium     | High   | Test continuation, batching, warnings, errors, `maxlag`, response caps, and missing/partial pages offline.               |
| Python setup becomes unreliable                   | Medium     | Medium | Use one documented setup path, reproducible parser dependency declaration, and clear missing/stale environment failures. |
| Python output drifts from TypeScript contracts    | Medium     | High   | Keep `src/domain/source.ts` canonical, add shared golden fixtures, and change both sides only for proven gaps.           |
| Artifact timestamps create noisy diffs            | Medium     | Medium | Inject clocks in fixture mode and isolate live retrieval/generation timestamps in explicit metadata.                     |
| Snapshot names or writes are unsafe               | Low        | High   | Use validated IDs/digests, path confinement, symlink checks where practical, atomic writes, and digest verification.     |
| QA becomes a release policy engine                | Medium     | Medium | Implement the findings/gates needed for platform safety and keep public release approval deferred.                       |
| Icon defaults choose the wrong media              | Medium     | Medium | Select only confirmed explicit or unique default candidates; ambiguity produces a QA finding and no silent winner.       |
| Live artifacts leak into tracked files            | Low        | High   | Keep data artifact roots ignored, inspect Git status before closeout, and prohibit cached media/copied prose.            |

## Security Considerations

- Treat URLs, titles, wikitext, template names, template values, API errors, filenames, prior
  artifacts, baselines, QA evidence, and CLI paths as untrusted input.
- Permit network access only in explicit live mode and only to the configured HTTPS Guild Wars Wiki
  MediaWiki API origin.
- Do not use credentials, cookies, tokens, environment-secret discovery, or source-provided
  executable content.
- Reject path traversal and unsafe output paths; keep writes beneath configured roots and use atomic
  replacement.
- Do not execute templates, Lua, HTML, JavaScript, shell fragments, URLs, or source-provided commands
  from wikitext.
- Bound request counts, batch sizes, continuation pages, retry budgets, response bytes, parser input
  size, output size, and evidence excerpt length.
- Do not log response bodies, raw page bodies, local environment contents, secrets, or unbounded
  source payloads.
- Do not download, cache, commit, or bundle icon binaries, thumbnails, screenshots, or prior-art
  images.
- Keep remote SHA-1 as source metadata only; use SHA-256 for local artifact integrity.
- Preserve EPIC-01 restrictions for ambiguous rights, copied material, media reuse, community prose,
  generated-data promotion, and public release.

## Dependencies

- `EPIC-00` / `SPRINT-001` provides the app scaffold, domain boundary, data directories, and
  verification command.
- `EPIC-01` / `SPRINT-002` provides source policy, provenance contracts, retention defaults, QA
  vocabulary, manual-review requirements, and release gates.
- Node.js `>=22.11.0`, npm `>=11.10.1`, and Python 3 remain required.
- The sprint may add one Python parser dependency, `mwparserfromhell`, for offline ingestion tooling.
- Guild Wars Wiki MediaWiki API availability is required only for optional manual live refresh.
- EPIC-03, EPIC-04, EPIC-05, and later content-heavy epics consume this platform after completion;
  they are not prerequisites.

## Open Questions

No open question blocks execution. Defaults for execution:

1. Use Python plus `mwparserfromhell` for the parser spike unless Phase 1 setup or Phase 4 evidence
   shows a concrete blocker.
2. Keep the skill-ID artifact schema tool-local unless a downstream TypeScript consumer requires a
   durable domain type.
3. Use synthetic fixtures by default; add external fixture excerpts only when minimized,
   provenance-bearing, explicitly scoped, and policy-reviewed.
4. Make `fixture` mode the automated verification path; keep live smoke checks manual.
5. Defer production generated-data promotion and public release approval to later exact-path tickets.
