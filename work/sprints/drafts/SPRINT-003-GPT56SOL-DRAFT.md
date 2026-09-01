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

Build the first reusable, offline ingestion spine for Build Wars: a polite Guild Wars Wiki API
client, immutable source snapshots, a canonical skill-ID enumerator, a structured wikitext parser
proof, metadata-only icon resolution, deterministic artifact writing, centralized QA reports, and one
regenerate command. The browser remains isolated from source APIs, raw snapshots, Python tooling, and
QA output.

The sprint is a platform proof, not a content-catalog sprint. Its only source-specific normalized
artifact is the skill-ID-to-page-title index required by later skill and template work. Parser and
icon behavior are proven with small synthetic fixtures and optional live diagnostics; full
profession, skill, equipment, rune, insignia, hero, title, or icon catalogs remain in later epics.

The principal decisions are:

- Implement ingestion in Python under `scripts/data/`. Use the Python standard library for HTTP,
  JSON, hashing, paths, retries, clocks, and tests; use `mwparserfromhell` as the one parser dependency.
- Pin the parser dependency in a dedicated data-tool lock file and use a repo-local ignored virtual
  environment. Dependency installation is an explicit setup step; verification never installs
  packages or accesses the network.
- Keep one directional boundary: the pipeline may mirror the JSON wire shapes in `src/domain`, but
  `src/domain` and `src/app` never import Python or generated tooling modules.
- Make snapshots content/revision-addressed and immutable. Re-fetching identical content reuses the
  existing snapshot; a changed revision creates a new snapshot rather than overwriting history.
- Keep normalized data and manifests separate. Record arrays and canonical JSON are deterministic;
  invocation timestamps are explicit metadata and the only permitted clock-based difference.
- Route every non-fatal anomaly through one diagnostic model and convert it to the existing
  `QaFinding`/`QaReport` wire shapes. Extractors do not invent their own report formats or silently
  discard unfamiliar input.
- Resolve media metadata only. Direct image URLs and remote SHA-1 values may be recorded, but no icon
  request downloads image bytes and no media binary enters the repository or runtime bundle.
- Make live access opt-in. `npm run verify` exercises the complete fixture pipeline offline; a
  separate mode refreshes ignored local snapshots from the wiki.

At completion, later content epics can add source profiles, extractors, normalizers, and validators
without implementing new HTTP clients, snapshot stores, artifact writers, QA formats, or command
orchestration.

Out of scope:

- A complete Guild Wars catalog or app-consumable production dataset.
- Runtime fetching, raw-snapshot reads, Python execution, or QA-report reads from the browser.
- `action=parse` or `action=expandtemplates` as a default extraction service.
- JavaScript execution, template expansion, or Lua evaluation from source wikitext.
- Icon downloads, thumbnails, screenshots, cached media, or offline/PWA media policy.
- Committed live snapshots, generated catalogs, QA reports, copied wiki bodies, or community prose.
- Broad runtime schema validation, a JSON-schema generation system, release publication, or an
  attribution UI.
- Gameplay rules, template-code compatibility, persistence, sharing, or build-editor work.
- Creating a commit; the outer ticket-burn process owns version-control operations.

## Use Cases

### UC-1: Fetch wiki data politely and predictably

A data maintainer can use a shared client to fetch site information, pages, revisions, and file
metadata with a descriptive User-Agent, bounded batches, MediaWiki continuation, timeouts,
retry/backoff, `Retry-After`, and `maxlag` handling. Tests substitute transport, clock, and sleeper
dependencies and never contact the live wiki.

### UC-2: Reproduce a source revision offline

A fetched page is stored as an immutable ignored snapshot with page and revision identity, source and
retrieval timestamps, canonical source URL, UTF-8 content hash, artifact digest, and the existing
source-policy classification. A later run can normalize that snapshot without the network.

### UC-3: Enumerate skill IDs without losing irregular records

The pipeline can turn game-integration source pages into a numerically sorted mapping from skill ID
to target page title while retaining source provenance. Gaps, PvP titles, punctuation, quoted names,
special/effect targets, duplicate IDs, duplicate titles, and malformed candidate lines are preserved
or reported rather than silently coerced away.

### UC-4: Prove nested-template parsing before catalog work

A content author can parse synthetic examples of `Skill infobox`, `Skill progression`, `gr`, `gr2`,
title-rank progressions, PvE/PvP wrappers, redirects, and disambiguation preambles into a generic,
ordered representation. Original values remain available for later interpretation, and unknown
templates or parameters become diagnostics.

### UC-5: Resolve icon metadata without caching images

An extractor can resolve an explicit `image=` value or deterministic `.jpg`/`.png` candidates through
`prop=imageinfo`, then retain file identity, URL, description URL provenance, MIME type, dimensions,
byte size, upload timestamp, and remote SHA-1. Missing, ambiguous, unexpected-MIME, and unexpected-size
cases are visible in QA.

### UC-6: Review stable generated output

The same snapshots, extractor version, schema version, configuration, and fixed clock produce the
same UTF-8 JSON bytes, record order, key order, content digest, finding IDs, and report order. A
reviewer can compare an explicitly selected baseline without hidden mutable state.

### UC-7: Run the platform end to end without the network

A contributor can run one fixture-mode regenerate command that performs source loading, snapshot
validation, extraction, normalization, artifact writing, validation, and reporting. Critical QA
failures return a nonzero exit code after diagnostic reports have been written.

### UC-8: Extend the platform without a one-off scraper

A later epic can register a bounded source profile and extractor that consume immutable snapshots and
produce records plus diagnostics. It automatically inherits the shared client, path safety,
provenance rules, artifact format, QA gate, and command modes.

### UC-9: Refresh live data deliberately

A maintainer who completed data-tool setup can invoke live mode explicitly. The command summarizes
requests, snapshots, records, findings, and local artifact paths without logging response bodies.
All outputs remain ignored until a later ticket approves exact files for app use or release.

## Architecture

### Boundary and flow

```text
explicit source profile
  -> MediaWikiClient (live mode only)
  -> immutable SnapshotStore
  -> extractor/parser/icon-metadata adapters
  -> normalized records + Diagnostics
  -> CanonicalArtifactWriter + GeneratedArtifactManifest
  -> validator registry + baseline diff
  -> QaReport JSON + plain-text summary + exit decision

src/app  -> future approved normalized adapter only
src/app  -X-> MediaWikiClient | scripts/data | source snapshots | QA reports
```

All content stages consume snapshot values, not a network client. The command owns live fetching and
passes snapshots into extractors. This keeps offline replay honest and prevents a future extractor
from making undocumented source calls.

### Stage contracts

| Stage | Input | Output | Invariants |
| --- | --- | --- | --- |
| Source plan | Named, versioned profile | Ordered page/file requests | No arbitrary URL; bounded request and page counts |
| Fetch | Approved API endpoint and encoded query parameters | Parsed MediaWiki JSON plus response metadata | GET only, HTTPS, origin checked after redirects, bounded bytes/time/retries |
| Snapshot | Page response and injected retrieval clock | Raw JSON/wikitext payload plus `SourceSnapshotManifest` | Immutable, atomic, path-confined, SHA-256 verified, ignored by default |
| Extract | Immutable snapshot records | Ordered normalized records and `Diagnostic` values | No network, no filesystem writes, no silent drops, provenance retained |
| Media resolve | Parsed explicit/default file candidates | `RemoteMediaMetadata` and diagnostics | `imageinfo` only; URLs/hashes stored, bytes never fetched |
| Write | Schema-aware envelope and fixed clock | Canonical JSON plus `GeneratedArtifactManifest` | Stable keys/format/order, atomic replace, digest after write |
| Validate | Records, manifests, optional explicit baseline | Stable findings and `QaReport` | Central severity policy, deterministic IDs/order, no implicit baseline |
| Report | `QaReport` | JSON, plain-text summary, exit code | Reports survive failed gates; no publication side effect |

### Module ownership

`scripts/data/` is a small Python package rather than a collection of executable one-off files:

| Module | Responsibility |
| --- | --- |
| `config.py` | Endpoint, User-Agent, source profiles, retry/resource limits, schema/generator versions |
| `api.py` | Transport-independent MediaWiki GETs, batching, continuation, error normalization, retries |
| `models.py` | Internal immutable records and diagnostics; JSON assembly matching public domain shapes |
| `snapshots.py` | Snapshot identity, safe paths, hashing, atomic writes, reload and integrity checks |
| `skill_ids.py` | Narrow game-integration mapping grammar and normalized skill-ID index |
| `wikitext.py` | Generic `mwparserfromhell` traversal, wrapper/redirect detection, ordered template representation |
| `icons.py` | Candidate derivation, `imageinfo` requests, deterministic resolution and media diagnostics |
| `artifacts.py` | Canonical JSON encoding, schema-aware ordering, manifests, digests and explicit baseline loading |
| `qa.py` | Validator registry, stable finding IDs, severity/disposition gates, JSON and text reports |
| `pipeline.py` | Stage composition and extractor/profile registry; no CLI parsing |
| `cli.py` | Argument validation, mode selection, summary output and process exit codes |
| `python_env.py` | Portable repo-local virtual-environment setup/check used by npm scripts |

The package exposes narrow typed functions. Transport, sleeper, monotonic clock, wall clock, and
filesystem roots are injected where nondeterminism matters. Unit tests use `unittest`; no live tests
join the canonical verification path.

### Python environment and dependency strategy

Use Python 3.11 or newer and one ignored `.venv-data/` environment. A direct-input file names
`mwparserfromhell`; a generated lock file pins the reviewed version and hashes. `npm run data:setup`
is the only command allowed to install it. `npm run data:test`, `npm run data:regenerate`, and
`npm run verify` call the environment launcher, which fails with a concise setup instruction when
the environment is absent or stale and never performs an implicit network install.

This adds setup cost but avoids three worse long-range outcomes: an unpinned global Python package,
a vendored parser copy, or a regex parser that later content epics must replace. No `requests`, CLI
framework, model library, or schema library is added unless a concrete implementation blocker is
recorded first.

### MediaWiki client behavior

The client accepts query parameters, not arbitrary request URLs. It pins the Guild Wars Wiki API
origin, uses HTTPS with the system trust store, encodes parameters, checks the final response origin,
sets `format=json`, `formatversion=2`, `maxlag`, a descriptive User-Agent, and finite connect/read
timeouts, and rejects oversized or malformed JSON responses.

Continuation is generic: the entire API-provided `continue` object is merged into the next request,
with cycle detection and a maximum page count. Title/revision and `imageinfo` helpers split ordered
inputs into configured bounded batches, then restore deterministic output ordering independently of
API response order.

Retries apply only to idempotent GETs and only to configured transient network failures, HTTP
429/502/503/504 responses, and MediaWiki `maxlag` errors. Exponential delay and server `Retry-After`
are capped; attempt count and total elapsed budget are bounded. Tests inject the sleeper and assert
the delay sequence. Authentication, cookies, credentials, response-body logging, and automatic
requests to URLs returned by the wiki are prohibited.

### Snapshot identity and provenance

The snapshot payload preserves the source page response and exact wikitext value in canonical JSON;
the manifest uses the current `SourceSnapshotManifest` and `SourceReference` field names. Snapshot
identity is derived from source family, validated numeric page ID, revision ID when present, and
content SHA-256. Paths never derive directly from an untrusted title. Pages without stable revision
identity use a full content digest in their identity and emit the required missing-revision finding.

Writes use a temporary sibling file, flush/close, and atomic replace after resolving the destination
beneath the configured artifact root. An existing identity is reused only when its bytes and digest
match. A collision or changed content under an existing identity is an integrity failure, never an
overwrite. The original `retrievedAt` stays with an identical reused snapshot; request logs may note
the later cache hit without mutating the snapshot.

### Extraction model

Extractors implement one conceptual interface: declare ordered source requests, accept verified
snapshots, and return normalized records plus diagnostics. They cannot fetch, write files, assign QA
dispositions, or decide publication.

The skill-ID enumerator uses a small line grammar for the flat game-integration mapping form. This is
not the nested-template parser and may use anchored matching around `Game link:Skill N` links.
Candidate lines that resemble mappings but do not parse produce diagnostics containing source page,
revision, line number, and a bounded escaped excerpt. Numeric IDs are preserved as numbers; target
titles preserve meaningful punctuation and suffixes; mappings sort by ID and then title. Duplicate
IDs are critical, malformed mappings are errors, duplicate titles are warnings unless conflicting
semantics make them errors, and gaps are informational rather than synthesized.

The wikitext module uses `mwparserfromhell` recursively. Its generic representation keeps normalized
and original template/parameter names, ordered parameters, raw parameter values, nesting, and source
order. Semantic helpers recognize the bounded skill-template cases in BW-0204 but do not construct a
full `Skill` catalog. Redirects, PvE/PvP wrappers, and disambiguation preambles are explicit node/page
states. Unknown parameters and templates remain in the parsed result and emit diagnostics.

`action=parse` and `action=expandtemplates` remain opt-in live diagnostic fallbacks only when the
local parser cannot represent a documented construct. Their returned HTML or expanded text is never
treated as the canonical source, never used in offline verification, and never invoked per page by
default. If `mwparserfromhell` cannot pass the representative nested fixtures without destructive
loss, BW-0204 stops before dependent icon/artifact work; execution records evidence and proposes a
parser change rather than adding regex patches.

### Icon selection

An explicit file title wins only after MediaWiki normalization/redirect resolution confirms it.
Without one, the resolver creates `File:{page title}.jpg` and `File:{page title}.png` candidates and
queries both in one bounded `imageinfo` request. Exactly one valid candidate is selected. Zero valid
candidates produce a missing finding; multiple valid candidates produce an ambiguity finding and no
silent winner. Candidate lists and findings sort by normalized file title, making ambiguity handling
deterministic without pretending the choice is known.

The resolver maps the direct media URL into `RemoteMediaMetadata.canonicalUrl` and uses the related
`SourceReference` for the description page URL and file/revision facts. The API's remote SHA-1 stays
`remoteSha1`; local artifacts use SHA-256. Non-64x64 dimensions and unexpected MIME types remain
reviewable diagnostics. `cachedBytes` is always `false`.

### Deterministic artifacts and cross-language contracts

Canonical JSON is UTF-8, two-space indented, LF-terminated, recursively key-sorted, and rejects
non-finite numbers. Generic arrays preserve semantic order; each schema owns explicit sort keys for
record collections. Writers never infer that an arbitrary array is order-insensitive.

The skill-ID index envelope includes schema version, stable generator/version, generation ID,
explicit generated timestamp, source summary, and per-record provenance. The generation ID hashes
the canonical semantic payload and input snapshot digests while excluding wall-clock metadata. The
data-file SHA-256 covers the actual bytes, and the separate `GeneratedArtifactManifest` records that
digest, inputs, source IDs, record count, QA path, and ignored commit decision. The manifest cannot
contain its own digest. Tests freeze timestamps; live reruns may change only documented invocation
timestamps when all semantic inputs are unchanged.

TypeScript remains the public semantic owner of provenance, media, snapshot-manifest,
generated-manifest, and QA-report shapes. Python emits those exact camelCase wire keys and does not
create a second provenance vocabulary. A committed synthetic golden fixture is produced by the
Python writer, compared byte-for-byte by Python tests, and structurally asserted by Vitest against
the exported domain expectations. No broad domain change is planned; if a real representational gap
is discovered, execution must document it and make the smallest backward-compatible contract change
with TypeScript and Python tests in the same phase.

### QA and exit semantics

Every stage returns internal diagnostics with code, policy category, severity, source/artifact/
record/field scope, and bounded evidence. `qa.py` assigns a stable finding ID from canonical code and
scope fields, maps diagnostics to the existing `QaFinding` shape, sorts findings, computes the
summary, and applies one central gate matrix:

| State | Command/app gate |
| --- | --- |
| Open or non-waivable `critical`/`error` | Blocked; regenerate exits nonzero after reports are written |
| Validly resolved or excluded `critical`/`error` | Closed for the recorded scope |
| Valid accepted-risk on a waivable finding | Closed only for its bounded reviewed scope |
| Open `warning` | Review-required; fixture command may succeed only when its expected warning allowlist matches |
| `info` | Reported; does not block alone |

The framework validates disposition metadata and refuses to treat unknown copied material, digest
mismatch, or unreadable artifacts as accepted risk. Duplicate IDs and missing required provenance
are critical platform findings and keep the generated artifact out of downstream consumption while
open.

Baseline comparison is explicit through a path argument. It compares schema-aware semantic records,
not timestamps, report IDs, or incidental formatting, and reports added, removed, and changed record
IDs. Omitting a baseline produces an informational `baseline-not-provided` finding, not a comparison
against whichever file happened to exist from a previous run.

### Command modes and promotion boundary

One entry point supports three modes:

- `fixture`: committed synthetic inputs, temporary or configured outputs, fixed clock, no network;
  this is the end-to-end verification mode.
- `offline`: verified ignored snapshots already on disk, no network; this is the reproducible
  investigation and regeneration mode.
- `live`: explicit Guild Wars Wiki fetch followed by the same snapshot-driven stages; this is the
  only network-enabled mode.

The initial `epic-02-skill-ids` profile fetches and normalizes the canonical game-integration skill
ID pages. Parser and icon canaries are exercised in the fixture profile and may be run against an
explicit bounded title list in live diagnostics; the sprint does not crawl every mapped skill page.

All modes write snapshots, normalized artifacts, manifests, and reports only beneath configured
roots. A blocked QA gate still leaves ignored diagnostic artifacts for review. No mode edits
`.gitignore`, promotes data into the app, creates release attestations, or commits files. Publication
remains a later explicit ticket after real generated content has passed source-policy review.

## Implementation

### Execution bookkeeping

- [ ] Confirm `EPIC-00` and `EPIC-01` are done and `SPRINT-001` and `SPRINT-002` are completed before
  changing implementation files.
- [ ] Promote `SPRINT-003`, `EPIC-02`, and only the active BW ticket through the repository's exact
  `backlog` -> `ready` -> `in-progress` -> `done` vocabulary; add the sprint ledger row when execution
  begins.
- [ ] Preserve ticket dependencies: BW-0201 -> BW-0202 -> BW-0203/BW-0204 -> BW-0205 -> BW-0206 ->
  BW-0207 -> BW-0208.
- [ ] Preserve unrelated working-tree changes, keep live/generated artifacts ignored, and do not
  create a commit.

### Phase 1 — Tool boundary and BW-0201 MediaWiki client

- [ ] Create the `scripts.data` Python package, internal models/config, test package, and portable
  `.venv-data` setup/check launcher.
- [ ] Add a direct dependency declaration and hash-locked reviewed `mwparserfromhell` version; update
  `.gitignore`, prerequisites, setup instructions, and npm scripts without adding app/runtime
  dependencies.
- [ ] Define versioned source-profile, retry, resource-limit, clock, transport, and diagnostic
  interfaces before content-specific modules use them.
- [ ] Implement the fixed-origin MediaWiki GET client with descriptive User-Agent, JSON format,
  `maxlag`, timeouts, response-size cap, final-origin validation, and bounded request logging.
- [ ] Implement generic continuation with whole-token propagation, cycle/page-budget detection, and
  batching that preserves deterministic caller-visible order.
- [ ] Implement capped retry/backoff for the allowed transient conditions, including `Retry-After`
  and HTTP-200 MediaWiki `maxlag` errors; surface permanent API errors immediately.
- [ ] Test ordinary responses, continuation with multiple token keys, batching boundaries, reordered
  responses, transient HTTP/network failures, malformed `Retry-After`, maxlag, exhausted budgets,
  continuation cycles, origin-changing redirects, oversized bodies, malformed JSON, and sanitized
  logs with injected transport/sleeper/clocks.

Phase acceptance:

- The focused client suite is offline and has no real sleep.
- No client call can target a caller-supplied host or emit a response body to logs.
- Siteinfo and revision-query fixtures pass through the same public request path used by live mode.

### Phase 2 — BW-0202 Immutable snapshots and provenance

- [ ] Implement page-response normalization into raw snapshot payload plus the existing
  `SourceReference` and `SourceSnapshotManifest` wire shapes.
- [ ] Derive safe snapshot identities from validated IDs/digests, confine all paths to the artifact
  root, and write payload/manifest pairs atomically.
- [ ] Reuse byte-identical existing snapshots, reject identity/content collisions, and create a new
  identity for changed revisions or content.
- [ ] Verify SHA-256 on load before returning snapshot data to an extractor; never allow a raw
  snapshot to be opened by runtime app code.
- [ ] Test redirects, normalized titles, missing pages, missing revisions, non-ASCII wikitext,
  untrusted titles/path traversal, digest mismatch, interrupted-write safety, identical refetch, and
  changed revision behavior with temporary directories.
- [ ] Update snapshot documentation with identity, immutability, refresh, retention, and safe-deletion
  rules. Add only synthetic snapshot fixtures under `test/fixtures/data-ingestion/`.

Phase acceptance:

- The same page revision and content cannot produce divergent snapshot bytes.
- Missing revision facts produce diagnostics and remain representable; they are never fabricated.
- Full live payloads and manifests remain ignored and absent from the diff.

### Phase 3 — BW-0203 Skill-ID enumeration

- [ ] Implement the bounded game-integration source profile and flat mapping grammar separately from
  the nested-template parser.
- [ ] Preserve ID, exact target title, source page/URL/revision, line scope, and record provenance in
  the in-memory normalized mapping.
- [ ] Sort by numeric ID and title; report duplicate IDs, duplicate target titles, malformed
  candidates, unexpected line shapes, and gaps with the centralized diagnostic vocabulary.
- [ ] Cover ordinary, non-contiguous, PvP/parenthetical, quoted, punctuation-heavy, and special/effect
  mappings with synthetic fixtures. Include conflicting duplicates and near-match malformed lines.
- [ ] Define profession/category comparison as an optional validator input; do not make it the ID
  authority or require it for the platform proof.

Phase acceptance:

- No candidate mapping disappears without either a record or a scoped diagnostic.
- Mapping order and provenance are stable across input/API ordering changes.
- No full target-page crawl or skill catalog is introduced.

### Phase 4 — BW-0204 Structured wikitext parser spike

- [ ] Implement recursive `mwparserfromhell` traversal and the generic ordered template/parameter
  representation before semantic skill helpers.
- [ ] Add bounded recognition for `Skill infobox`, `Skill progression`, `gr`, `gr2`, title-rank
  progression, `pveversion`, `pvpversion`, redirects, and disambiguation preambles.
- [ ] Preserve original raw parameter values and source order alongside normalized lookup names;
  surface unknown templates/parameters and unsupported constructs as diagnostics.
- [ ] Add wholly synthetic fixtures representing an ordinary skill, PvP split, quoted name,
  title-rank progression, morale-boost recharge, nested wrappers, redirect, and disambiguation
  preamble. Do not copy full source pages or expressive descriptions.
- [ ] Record the parser recommendation, known unsupported constructs, and exact criteria for an
  opt-in `action=parse`/`action=expandtemplates` diagnostic fallback in the compendium.
- [ ] Stop dependent phases if the parser cannot preserve the representative structures; do not
  conceal a failed spike with regex-only nested-template parsing.

Phase acceptance:

- Representative fixtures parse deterministically with nesting, source order, and raw values intact.
- Unknown input remains inspectable and produces QA evidence.
- The recommendation explicitly decides whether `mwparserfromhell` is accepted for later extractors.

### Phase 5 — BW-0205 Metadata-only icon resolver

- [ ] Implement explicit-image and default `.jpg`/`.png` candidate derivation with MediaWiki title
  normalization and redirect handling.
- [ ] Reuse the shared batch client for `prop=imageinfo`; map file URL, description-page source,
  MIME type, dimensions, size, timestamp, and remote SHA-1 into existing provenance/media shapes.
- [ ] Select only a confirmed explicit candidate or a unique default candidate; retain all candidates
  and emit scoped diagnostics for missing or ambiguous results.
- [ ] Report non-64x64 dimensions, unexpected MIME, absent SHA-1, missing description URL, and
  inconsistent redirects without downloading the returned URL.
- [ ] Test explicit/default, uppercase extension normalization, one/multiple/no candidate, missing
  fields, reordered API response, unusual size/MIME, and metadata-only invariants.

Phase acceptance:

- Every output has `cachedBytes: false`, a resolvable source ID, and no field containing local media
  bytes or a local media path.
- Ambiguity produces no arbitrary winner.
- The repository contains no new icon or screenshot file.

### Phase 6 — BW-0206 Canonical generated artifacts

- [ ] Implement schema-aware canonical JSON, finite-number validation, atomic writes, file digests,
  and explicit collection sort keys.
- [ ] Define the versioned skill-ID index envelope and build exact `GeneratedArtifactManifest`
  records from verified inputs and final output bytes.
- [ ] Keep stable generation identity separate from invocation timestamp and test the documented
  timestamp-only difference explicitly.
- [ ] Preserve unknown IDs, unresolved targets, source classifications, record provenance, and
  diagnostics without destructive coercion.
- [ ] Commit only synthetic input/golden output under `test/fixtures/data-ingestion/`. Compare it
  byte-for-byte in Python and add Vitest structural assertions for shared domain wire shapes.
- [ ] Test key ordering, Unicode, line endings, semantic array ordering, input reordering, frozen and
  changing clocks, non-finite numbers, digest correctness, interrupted writes, and path confinement.

Phase acceptance:

- Fixed inputs/configuration/clock produce byte-identical artifact and manifest output.
- Changing only input order produces no semantic or byte diff.
- Python provenance, media, manifest, and QA keys agree with the current TypeScript contracts.

### Phase 7 — BW-0207 QA reports and gates

- [ ] Implement stable diagnostic-to-finding IDs, deterministic sorting, summary counts, disposition
  validation, central gate decisions, JSON output, and a concise escaped plain-text report.
- [ ] Add platform validators for missing provenance/revision facts, duplicate IDs, malformed
  mappings, unknown template parameters, unresolved redirects, missing/ambiguous icons, schema
  shape, source-reference resolution, artifact digest, and forbidden cached-media indicators.
- [ ] Implement optional explicit-baseline comparison for added, removed, and semantically changed
  records while excluding documented volatile metadata.
- [ ] Enforce non-waivable policy cases and reject incomplete reviewer/rationale/scope metadata for
  accepted-risk dispositions.
- [ ] Test stable IDs/order, all severity/disposition branches, missing baseline, baseline schema
  mismatch, digest mismatch, duplicate ID, missing provenance, warning review state, and critical
  nonzero exit decisions.

Phase acceptance:

- Duplicate IDs and missing required provenance block the generated artifact while open.
- Reports are written and readable even when the gate blocks.
- Adding a later validator requires registration, not a new report format or exit-code policy.

### Phase 8 — BW-0208 Regenerate command, verification, and closeout

- [ ] Implement the single profile-driven CLI and `fixture`, `offline`, and explicit `live` modes;
  validate all roots, bounds, modes, profiles, and baseline paths before executing stages.
- [ ] Run the fixture profile through source loading, snapshot validation, extraction, parser/icon
  canaries, normalization, writing, validation, reporting, summary, and exit behavior in a temporary
  root.
- [ ] Run the live skill-ID profile through API fetch, ignored snapshots, normalization, and QA
  without crawling every target page. Keep live validation manual and outside `npm run verify`.
- [ ] Add `data:setup`, `data:test`, and `data:regenerate` npm scripts. Extend `npm run verify` with
  offline Python ingestion tests while retaining formatting, lint, TypeScript, Vitest, build, and
  ticket-burn tests.
- [ ] Document clean setup, all modes, source limits, profile extension, artifact locations,
  baseline selection, expected exit codes, troubleshooting, safe refresh/deletion, and the later
  exact-path promotion gate.
- [ ] Run the complete fixture regenerate command twice and prove stable semantic output; run
  `npm run verify`; inspect Git status for live payloads, generated artifacts, QA reports, binaries,
  secrets, copied prose, or unrelated features.
- [ ] Mark BW-0201 through BW-0208 done only after their phase acceptance passes. Mark `EPIC-02`,
  `SPRINT-003`, and the ledger row complete only after every Definition of Done item passes.

Phase acceptance:

- A clean documented environment can run fixture regeneration and `npm run verify` with the network
  disabled.
- Live mode is opt-in, bounded, polite, and produces only ignored local artifacts.
- Later extractors have one documented registration path and need no alternate client, writer, QA
  schema, or command.

## Files Summary

| Path | Action | Purpose |
| --- | --- | --- |
| `scripts/__init__.py` | Create | Make data tooling importable as a Python package |
| `scripts/data/__init__.py` | Create | Define the supported data-tool package surface |
| `scripts/data/config.py` | Create | Source profiles, versions, endpoint, retries and resource limits |
| `scripts/data/api.py` | Create | Shared MediaWiki client, continuation, batching and retries |
| `scripts/data/models.py` | Create | Internal immutable records, diagnostics and domain-wire assembly |
| `scripts/data/snapshots.py` | Create | Immutable snapshot identity, provenance, hashing and safe writes |
| `scripts/data/skill_ids.py` | Create | Canonical game-integration skill-ID enumeration |
| `scripts/data/wikitext.py` | Create | Structured `mwparserfromhell` traversal and parser proof |
| `scripts/data/icons.py` | Create | Metadata-only icon candidate and `imageinfo` resolution |
| `scripts/data/artifacts.py` | Create | Canonical JSON, generated manifests, digests and baseline loading |
| `scripts/data/qa.py` | Create | Validators, QA reports, gates and text summaries |
| `scripts/data/pipeline.py` | Create | Snapshot-driven stage and extractor/profile orchestration |
| `scripts/data/cli.py` | Create | Fixture/offline/live regenerate entry point and exit behavior |
| `scripts/data/python_env.py` | Create | Repo-local Python environment setup and verification launcher |
| `scripts/data/requirements.in` | Create | Direct parser dependency declaration |
| `scripts/data/requirements.lock` | Create | Reviewed exact dependency version and integrity hashes |
| `scripts/data/tests/` | Create | Offline unit, integration and CLI tests for all ingestion stages |
| `scripts/data/README.md` | Modify | Replace future placeholders with executable pipeline and extension docs |
| `test/fixtures/data-ingestion/` | Create | Small synthetic API, wikitext, media and golden JSON fixtures |
| `test/domain/data-ingestion-contracts.test.ts` | Create | Assert Python golden wire output matches exported domain expectations |
| `src/domain/source.ts` | Verify; modify only for a proven gap | Retain the canonical provenance/media/manifest/QA vocabulary |
| `package.json` | Modify | Add data setup/test/regenerate commands and offline verification |
| `.gitignore` | Modify narrowly | Ignore `.venv-data` while preserving deny-by-default data artifacts |
| `README.md` | Modify | Document Python prerequisite, clean setup and canonical verification |
| `data/README.md` | Modify | Document the implemented lifecycle and non-promotion boundary |
| `data/source-snapshots/README.md` | Modify | Document immutable identity, refresh, retention and deletion |
| `data/generated/README.md` | Modify | Document canonical output, manifests, baseline diff and promotion gate |
| `data/qa/README.md` | Modify | Document generated report, exit and review behavior |
| `compendium/data-ingestion-platform.md` | Create | Record parser recommendation, contracts, extension rules and fallbacks |
| `compendium/README.md` | Modify | Index the ingestion-platform decision record |
| `work/tickets/02-data-ingestion-platform/EPIC.md` | Modify during execution | Track sprint linkage and final epic status |
| `work/tickets/02-data-ingestion-platform/BW-0201*.md` through `BW-0208*.md` | Modify during execution | Track phase status and acceptance evidence |
| `work/sprints/SPRINT-003.md` | Modify during execution | Maintain the executable checklist and final state |
| `work/sprints/ledger.tsv` | Modify during execution | Track sprint activation and completion |

## Definition of Done

### Platform boundary and source policy

- [ ] All ingestion implementation lives under `scripts/data`; runtime application and domain code
  do not import it, raw snapshots, or QA reports.
- [ ] The only normalized source-specific output is the skill-ID index/platform proof; no full
  content catalog or target-page crawl is added.
- [ ] Raw snapshots, generated data, QA output, and the Python environment remain ignored; only
  approved synthetic fixtures and documentation are tracked.
- [ ] No icon binary, screenshot, copied community prose, large wiki body, secret, or credential is
  present in the diff.
- [ ] Python wire output uses the existing source-policy vocabulary and resolvable source/claim IDs;
  no competing provenance model exists.

### Client and snapshot integrity

- [ ] The API client has fixed-origin HTTPS GET behavior, descriptive User-Agent, generic
  continuation, bounded batching, timeouts, response cap, retry/backoff, `Retry-After`, `maxlag`, and
  sanitized metadata logging.
- [ ] Client tests cover success and every bounded failure/retry edge without network or real sleep.
- [ ] Snapshots record source/page/revision/retrieval facts and SHA-256 integrity through existing
  domain wire fields.
- [ ] Snapshot paths are traversal-safe, writes are atomic, identities are immutable, identical
  refetches are idempotent, and integrity failures never overwrite evidence.
- [ ] Runtime code cannot consume raw snapshots directly.

### Extraction and media proof

- [ ] Skill mappings preserve numeric ID, exact title, source provenance, and deterministic ordering;
  ordinary, PvP, quoted, special/effect, duplicate, malformed, and gap cases are tested.
- [ ] Nested wikitext uses `mwparserfromhell`, preserves raw values/order/nesting, and covers every
  representative BW-0204 construct with synthetic fixtures.
- [ ] The compendium records an evidence-based parser recommendation and bounded remote-fallback
  criteria; regex-only nested parsing is absent.
- [ ] Icon resolution covers explicit/default, missing, ambiguous, MIME, dimension, hash, and redirect
  cases while storing metadata only and keeping `cachedBytes: false`.
- [ ] Unknown templates, parameters, mappings, redirects, and media candidates are retained or
  reported, never silently discarded.

### Determinism, contracts, and QA

- [ ] Canonical JSON has stable encoding, key order, schema-owned record order, line endings, and
  finite-number behavior; atomic writes and SHA-256 digests are tested.
- [ ] Fixed inputs, configuration, dependency version, and clock produce byte-identical fixture
  artifacts, manifests, finding IDs, and report order.
- [ ] Generation identity excludes volatile clock metadata, while invocation timestamps remain
  explicit and are the only allowed no-input-change difference.
- [ ] A shared synthetic golden output passes Python byte comparison and Vitest structural checks
  against source, provenance, media, manifest, and QA domain expectations.
- [ ] QA covers missing provenance/revisions, duplicate IDs, malformed mappings, unknown params,
  unresolved redirects, missing/ambiguous icons, source-reference validity, schema shape, semantic
  diffs, digest integrity, and cached-media prohibition.
- [ ] Critical/error gates, warning review state, non-waivable cases, accepted-risk metadata, stable
  IDs, report persistence on failure, and explicit baseline selection are tested.

### Commands, documentation, and closeout

- [ ] `npm run data:setup` creates the documented locked environment; verification detects a missing
  or stale environment without installing from the network.
- [ ] One regenerate entry point supports fixture, offline-snapshot, and explicit live modes with a
  shared profile/stage implementation.
- [ ] Fixture mode exercises the end-to-end pipeline with no network and is covered by automated CLI
  tests; live mode is optional/manual and bounded.
- [ ] `npm run verify` remains the canonical offline repository check and passes formatting, lint,
  TypeScript, Vitest, build, ingestion tests, and ticket-burn tests.
- [ ] Root, scripts, data, QA, generated, snapshot, and compendium documentation agree on setup,
  commands, locations, gates, fallback policy, and later extractor extension.
- [ ] BW-0201 through BW-0208 are linked to `SPRINT-003` and done; EPIC-02, sprint frontmatter, and
  ledger are completed only after all checkboxes and verification pass.
- [ ] No commit is created by sprint execution.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| MediaWiki response or continuation behavior changes | Live refresh breaks or silently misses pages | Preserve generic continuation, validate shapes, fail on cycles/unknown errors, keep response fixtures, and make live smoke checks manual |
| Wiki template diversity exceeds the spike | Later content extractors require redesign | Preserve generic/raw structure, surface unknowns, prove hard nested cases, stop on destructive parsing, and keep remote expansion opt-in |
| Python adds a second toolchain | Setup and CI become less reliable | One dependency, one ignored venv, exact hash lock, explicit setup, clear stale-env failure, and offline verification |
| TypeScript and Python wire shapes drift | Generated artifacts look valid to one side only | Keep TypeScript vocabulary canonical, use one shared golden artifact across Python and Vitest, and change both tests with any contract edit |
| Timestamps defeat determinism | Review diffs become noisy | Separate semantic generation identity from invocation time, inject clocks, compare semantic baselines, and document timestamp-only changes |
| Generic canonicalization reorders meaningful arrays | Data semantics are corrupted | Preserve arrays by default and require each artifact schema to declare collection sort keys |
| Snapshot collisions or partial writes erase evidence | Provenance and replay become unreliable | Content/revision identity, digest verification, atomic writes, immutable collision errors, and path confinement |
| The platform sprint expands into catalog ingestion | Schedule slips and source-policy exposure grows | Limit normalized output to skill IDs, use synthetic parser/icon canaries, and prohibit full target-page crawling |
| Synthetic fixtures miss live edge cases | Tests pass while production pages fail | Model named edge cases, retain all unknowns, support bounded manual live diagnostics, and add reviewed minimal regression fixtures only by explicit ticket |
| Icon defaults choose the wrong file | Later UI associates incorrect media | Prefer confirmed explicit or unique candidates, make ambiguity non-selecting, retain candidate evidence, and download no bytes |
| QA acceptance becomes a bypass | Unsafe artifacts reach downstream work | Central gate matrix, validate reviewer scope/evidence, enforce non-waivable codes, and keep publication outside this command |
| Dependency or source availability changes | Setup/live refresh cannot reproduce | Record exact dependency hashes and source revisions; ensure snapshot/offline mode remains usable without either network service |

## Security

- Treat URLs, titles, wikitext, template names/values, API errors, filenames, report evidence, prior
  artifacts, and CLI paths as untrusted input.
- Permit network access only in explicit live mode and only to the configured HTTPS MediaWiki API
  origin. Validate the final response origin after redirects; never fetch canonical or icon URLs
  returned in source data.
- Use GET without credentials, cookies, tokens, or environment-secret discovery. Do not log response
  bodies, raw wikitext, full query values, headers, or local environment contents.
- Bound batches, continuation pages, retries, total delay, response bytes, decoded records, source
  pages, parser input size, nesting work where practical, and evidence excerpt length to resist
  accidental resource exhaustion.
- Resolve output/baseline paths beneath explicit roots, reject traversal and unsafe identifiers,
  avoid shell interpolation, and use atomic file replacement. Reject symlink escapes before writes.
- Parse wikitext as data only. Do not execute templates, Lua, HTML, JavaScript, shell fragments, or
  source-provided commands. Escape control characters and untrusted values in logs and text reports.
- Validate JSON types and reject non-finite numbers, malformed digests, unreadable artifacts,
  mismatched hashes, unresolved source IDs, and unexpected cached-media fields.
- Keep remote SHA-1 as source metadata only; use SHA-256 for local integrity. A hash identifies bytes
  but does not establish trust, rights, or safety.
- Review and hash-lock the parser dependency. Setup is the only networked install operation, and
  canonical verification never mutates the environment.
- Preserve EPIC-01 restrictions: live artifacts remain ignored, copied or ambiguous material remains
  review-required, community prose and media binaries are prohibited, and source URLs are references
  rather than trusted fetch targets.

## Dependencies

- `EPIC-00` / `SPRINT-001`: npm/TypeScript foundation, domain boundary, test conventions, and
  `npm run verify`.
- `EPIC-01` / `SPRINT-002`: source policy, provenance/media/snapshot/generated/QA contracts,
  retention defaults, manual-review semantics, and release gates.
- EPIC-02 tickets BW-0201 through BW-0208 with the dependency order preserved in Implementation.
- Node.js `22.11.0` or newer and npm `11.10.1` or newer for repository orchestration.
- Python 3.11 or newer and a repo-local `.venv-data` for ingestion tooling.
- One reviewed, exactly pinned, hash-locked `mwparserfromhell` version. Python's standard library is
  used for all other planned data-tool behavior.
- Guild Wars Wiki MediaWiki API availability for manual live mode only. Fixture and offline modes do
  not depend on the service.
- Existing `src/domain/source.ts`, `src/domain/catalog.ts`, `src/domain/ids.ts`, data READMEs,
  `compendium/source-policy.md`, and `compendium/data-qa-and-release.md` remain normative.
- EPIC-03/EPIC-04/EPIC-05 consume the platform later; they are not prerequisites and must not pull
  catalog extraction or runtime use into this sprint.

## Open Questions

1. Which exact `mwparserfromhell` release and artifact hashes pass the documented Python support
   range at execution time? Default: select one reviewed current release during Phase 1, lock it
   exactly, record the choice, and do not proceed with an unpinned range.
2. Do any representative nested constructs require remote expansion after the local parser spike?
   Default: no remote fallback in normal or offline profiles; add only a bounded explicit diagnostic
   path when Phase 4 records a concrete lossy construct.
3. Which explicit live canary titles, if any, should parser/icon diagnostics use? Default: none in the
   committed profile; require the operator to provide a bounded title list so the platform does not
   grow an accidental skill crawl.
4. What freshness threshold should live skill-ID snapshots use? Default: missing revision/retrieval
   facts are errors, age is reported as information, and no arbitrary day threshold blocks this
   platform sprint. A content/release ticket must approve a source-specific threshold.
5. Should tool-only artifact envelopes eventually have language-neutral JSON Schema? Default: defer
   until a second real extractor demonstrates repeated validation needs; use exact wire builders and
   shared golden tests in this sprint to avoid introducing a third contract source prematurely.
6. Which generated artifacts should later be exact-path allowlisted for runtime or test use? Default:
   none. EPIC-03/EPIC-04 must name the consumer, source review, QA evidence, regeneration command, and
   exact paths before promotion.
