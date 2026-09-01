# Data Ingestion Platform

EPIC-02 implements a shared Python ingestion spine under `scripts/data/build_wars_ingest`. Browser
runtime code remains isolated from source APIs, raw snapshots, generated working artifacts, and QA
reports.

## Implemented Spine

- `api.py`: fixed-origin Guild Wars Wiki MediaWiki client with GET-only JSON requests, User-Agent,
  batching, continuation, retry/backoff, `Retry-After`, `maxlag`, response caps, request/page limits,
  final-origin checks, and sanitized request metadata.
- `snapshots.py`: source snapshot identity, path confinement, SHA-256 integrity, atomic writes,
  idempotent identical refetches, collision protection, and `SourceSnapshotManifest`-compatible
  records.
- `wikitext.py`: `mwparserfromhell` parser adapter that preserves template order, raw names, raw
  values, nested templates, duplicate parameters, comments, `<nowiki>`, wrappers, redirects, and
  disambiguation preambles.
- `skill_ids.py`: game-integration skill-ID extraction from verified snapshots with provenance and
  diagnostics for duplicate, malformed, gap, redirect, and unexpected-shape cases.
- `icons.py`: metadata-only icon candidate resolution for explicit `image=` values and default
  `File:{title}.jpg` / `File:{title}.png` candidates.
- `artifacts.py`: canonical JSON and `GeneratedArtifactManifest` writing with digest and baseline
  comparison.
- `qa.py`: diagnostic-to-`QaFinding` mapping, stable IDs, summaries, app/public gates, JSON reports,
  and bounded text summaries.
- `pipeline.py` and `cli.py`: fixture, offline, and explicit live command orchestration.

## Parser Decision

Continue with `mwparserfromhell` for parser-dependent catalog work. The fixture and unit-test corpus
covers nested `Skill infobox`, `Skill progression`, `gr`, `gr2`, title-rank progression,
`pveversion`, `pvpversion`, morale-boost recharge, quoted names, punctuation, redirects,
disambiguation preambles, comments, `<nowiki>`, duplicate parameters, unknown parameters, and wrapper
templates.

The parser is accepted because it preserves the required nested template structure without regex-only
template parsing. The ingestion adapter still emits diagnostics for lossy round trips, oversized
input, unknown templates, unknown parameters, and duplicate parameters. Future extractors should add
a bounded `action=parse` or `expandtemplates` fallback only for specific hard cases that the offline
adapter flags.

## Extension Rules

- Add new content extractors inside `build_wars_ingest`; do not create one-off source clients.
- Extractors consume verified snapshots, not a live network client.
- Keep `Guild Wars Wiki:Game integration/Skills/*` as the primary skill-ID authority. Profession or
  category pages are optional QA cross-checks.
- Keep icon handling metadata-only unless a future explicit ticket approves cached media.
- Write generated proof or catalog artifacts under ignored `data/generated` and reports under ignored
  `data/qa`.
- Promote runtime data only through a later exact-path ticket that records provenance, QA closeout,
  source-policy disposition, and app/public gate status.

## Registered Profiles

- `guild-wars-wiki`: EPIC-02 skill-ID/parser/icon fixture proof. This remains the default profile
  for compatibility.
- `epic-03-professions-attributes`: EPIC-03 professions and attributes catalog. The profile locks
  source pages, detail pages, page/request/byte caps, exact promoted paths, selected snapshot replay,
  and metadata-only icon handling.

Default fixture regeneration writes both the EPIC-02 proof and the EPIC-03 fixture catalog. Direct
EPIC-03 fixture/offline/live commands use `--profile epic-03-professions-attributes`.
