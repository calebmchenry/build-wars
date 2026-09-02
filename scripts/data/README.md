# Data Scripts

`scripts/data` contains the EPIC-02 ingestion platform. It is offline tooling, not browser runtime
code. Runtime app modules must not import this package, fetch source APIs, read raw snapshots, or
read QA reports.

## Setup

Supported baseline:

- Python 3.13 in the current development environment; Python 3.11 or newer should work for the
  standard-library modules used here.
- `mwparserfromhell==0.7.2`, pinned in `requirements.txt`.

Run setup once after `npm ci`:

```sh
npm run data:setup
```

This creates `.venv-data/`, which is ignored by Git, and installs the pinned parser dependency.

## Commands

```sh
npm run data:test
npm run data:regenerate
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-03-professions-attributes
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-04-skills
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-10-runes
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-03-professions-attributes --root .
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-04-skills --root . --snapshot-set work/runs/data-ingestion/epic-04/snapshot-sets/<selected>.snapshot-set.json
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-10-runes --root . --snapshot-set work/runs/data-ingestion/epic-10/snapshot-sets/<selected>.snapshot-set.json
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --allow-live-network --title "Guild Wars Wiki:Game integration/Skills/0"
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-03-professions-attributes --root . --allow-live-network
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-04-skills --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-04-skills --root . --allow-live-network --stage fetch --source-plan work/runs/data-ingestion/epic-04/source-plans/<digest>.source-plan.json --confirm-source-set-digest <digest>
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-10-runes --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-10-runes --root . --allow-live-network --stage fetch --source-plan work/runs/data-ingestion/epic-10/source-plans/<digest>.source-plan.json --confirm-source-set-digest <source-set-digest>
```

Exit codes:

- `0`: command completed; warnings may still leave app or public gates in `review-required`.
- `2`: invalid mode/options, setup failure, missing offline snapshots, or blocking QA gate.

`npm run verify` includes `npm run data:test`, which is fast and offline.

## Modes

- `fixture`: uses committed minimized synthetic fixtures from `test/fixtures/data-ingestion`, a fixed
  UTC clock, and an output root under ignored `work/runs/data-ingestion`.
- `offline`: reads existing ignored snapshot manifests from the configured output root without
  network access. EPIC-04 and EPIC-10 require one explicit complete `--snapshot-set` manifest and reject
  partial, duplicate, mixed-profile, digest-mismatched, or path-escaping children.
- `live`: manually fetches named Guild Wars Wiki pages through the shared MediaWiki client. It
  requires `--allow-live-network` and at least one `--title` unless the selected profile owns its
  fixed source graph.

The default `guild-wars-wiki` profile preserves the EPIC-02 skill-ID fixture proof. Fixture mode also
writes the EPIC-03 professions/attributes, EPIC-04 skills, and EPIC-10 runes fixture catalogs as side effects so
`npm run data:regenerate` covers all registered production profiles offline. Run
`epic-03-professions-attributes`, `epic-04-skills`, or `epic-10-runes` directly for
profile-specific fixture, offline, or live catalog work.

## Source Limits

The Guild Wars Wiki profile fixes the API origin to `https://wiki.guildwars.com/api.php`, uses
GET-only JSON requests, `formatversion=2`, `maxlag=5`, finite timeouts, response byte caps, request
and page limits, continuation limits, retry budgets, and a descriptive User-Agent. The client
accepts query parameters, not arbitrary URLs, and validates the final origin after redirects.

Live smoke checks should stay bounded: name the exact pages, inspect request counts, revisions,
digests, artifact paths, and QA summaries, then delete ignored outputs when they are no longer
needed.

The EPIC-03 profile is locked to `Skill template format`, `Profession`, `Attribute`,
`Attribute point`, the ten profession pages, and the ten primary-attribute pages. Its caps are 32
source pages, 12 requests, the shared response byte cap, and the shared parser byte cap. Live mode
for this profile uses those names instead of ad hoc `--title` values, then fetches exact profession
icon `imageinfo` metadata without following file redirects.

The EPIC-04 profile is locked to `Guild Wars Wiki:Game integration/Skills` plus linked ranged pages
under `Guild Wars Wiki:Game integration/Skills/*`; the missing `/Skills/0` page is blocker history
only. Discovery fetches only the index and ranged seed pages, writes a digest-bound source plan, and
stops. Fetch mode requires the exact plan path and `--confirm-source-set-digest`, rechecks source-set
drift, fetches planned detail pages in deterministic batches, writes one complete
`SourceSnapshotSetManifest`, and promotes only the exact catalog/manifest/QA paths. CLI options may
lower smoke-test limits such as `--detail-limit`, but code-owned caps remain the ceiling.

The EPIC-10 profile is locked to `Equipment template format`, `Rune`, and `Attribute bonus` as seed
authority pages, the promoted EPIC-03 catalog as the profession/attribute dependency, verified rune
detail pages, and metadata-only rune icon `imageinfo`. Discovery writes a digest-bound source plan
that accounts for accepted armor runes, supported relationships, explicit exclusions, unsupported
rows, and blocking findings. Fetch mode requires the reviewed plan path and exact source-set digest,
rechecks drift, fetches only planned detail pages and icon metadata, writes one complete
snapshot-set manifest, and promotes only `data/generated/epic-10/runes.catalog.json`, its adjacent
manifest, and `data/qa/epic-10/runes.catalog.qa.json`.

## Pipeline Contract

| Stage     | Inputs                                               | Outputs                                                             | Required contracts and gates                                                                                                                                                              |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fetch     | Source profile and query parameters                  | Raw source payload in `data/source-snapshots`                       | Live mode only; source values are untrusted.                                                                                                                                              |
| Snapshot  | Raw payload and source metadata                      | `SourceSnapshotManifest` plus ignored raw payload                   | Records source family, page/file identity, revision identity, source revision timestamp, retrieval timestamp, artifact path, SHA-256 digest, and ignored retention policy.                |
| Replay    | Complete selected snapshot-set manifest              | Verified selected snapshot payloads                                 | EPIC-04 and EPIC-10 require one profile-bound manifest; rejects partial, duplicate, extra/missing, mixed-profile, digest-mismatched, or path-escaping inputs before catalog assembly.     |
| Extract   | Verified snapshot payloads                           | Skill-ID mappings, parser proof, and icon metadata                  | Extractors consume snapshots, not a network client. Nested wiki templates are traversed through `mwparserfromhell`, not regex-only parsing.                                               |
| Normalize | Extracted records and diagnostics                    | Canonical JSON plus `GeneratedArtifactManifest` in `data/generated` | UTF-8, LF-terminated, two-space indented, key-stable, finite-number-only, stable record order, provenance-bearing, and metadata-only media references where allowed.                      |
| Validate  | Generated artifact manifest and records              | `QaReport` JSON and bounded text summary in `data/qa`               | Reports provenance gaps, stale/unverified revisions, rights ambiguity, invalid source IDs, copied text, icon metadata gaps, generated diffs, schema/shape errors, and integrity failures. |
| Promote   | QA report, release scope, and approved artifact list | Exact-path allowlist or excluded artifact                           | Requires a later ticket naming exact paths, review evidence, source-policy disposition, and app/public release gate status before runtime use.                                            |

## EPIC-03 Profile

`epic-03-professions-attributes` normalizes template ID crosswalks, playable professions, all
template-listed attributes, profession icon metadata, attribute point costs, level point totals,
quest rewards, default level-20 PvE budgets, source/provenance claims, manual reviews, section
digests, a semantic `catalogVersion`, and a QA report.

The source-shape checkpoint found simple bullet lists on `Skill template format` and bounded wiki
tables on `Profession`, `Attribute`, and `Attribute point`. `mwparserfromhell` remains available for
template-aware parsing, but EPIC-03 uses a small bounded wiki-table/list helper for these locked
tables and rows.

Exact production paths:

- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`
- `data/qa/epic-03/professions-attributes.catalog.qa.json`

Raw snapshots, snapshot manifests, candidate live/offline outputs outside those paths, text QA
summaries, icon binaries, thumbnails, screenshots, and copied page bodies remain ignored or absent.
Offline replay selects the locked EPIC-03 snapshot manifests by source page title; because raw
snapshots are ignored, historical replay is limited to the local ignored snapshots or a fresh bounded
live refresh.

## EPIC-04 Profile

`epic-04-skills` normalizes the Guild Wars skills source set into
`data/generated/epic-04/skills.catalog.json`. The runtime catalog contains skill IDs, template IDs,
canonical names, lookup keys, wiki URLs, EPIC-03 profession/attribute joins, campaigns, skill types,
classification flags, independent cost/timing value states, structured-only description tokens,
progression series, split groups, nullable metadata-only icons, source-set summary, dispositions,
section digests, and a semantic `catalogVersion`.

The adjacent manifest owns source-plan path/digest, selected snapshot-set path/digest, child snapshot
paths, dependency digests, artifact digest, and review records. The QA JSON owns bounded findings and
release gates. Runtime app code must not read those audit artifacts.

Schema v1 excludes acquisition metadata, guide prose, strategy/usage notes, vendor/drop/quest
instructions, community content, raw page bodies, rendered HTML, and copied source-authored
descriptions. Description state is explicit: `reviewed-text`, `structured-only`, `excluded`, or
`unsupported`; the current promotion uses structured-only runtime text and records source text
digests for future review invalidation.

## EPIC-10 Profile

`epic-10-runes` normalizes Guild Wars armor rune facts into
`data/generated/epic-10/runes.catalog.json`. The runtime catalog contains source-set summary,
compact dispositions, EPIC-03 dependency digests, rune records, verified template modifier IDs,
family/rank/tier fields, profession and affected-attribute joins, typed effect-level stacking,
headgear handoff facts, nullable metadata-only icons, section digests, and a semantic
`catalogVersion`.

Schema v1 excludes armor shell legality, equipment editor state, title/allegiance effects, full
health/energy/stat totals, raw page bodies, copied source-authored long prose, source plans,
snapshot-set manifests, QA summaries, icon bytes, thumbnails, screenshots, and runtime wiki access.
Attribute rune bonuses use highest-per-attribute stacking while verified major/superior health
penalties remain independently countable by equipped occurrence.

## Artifacts

Default roots under a command `--root` are:

- `data/source-snapshots`: raw payloads and `SourceSnapshotManifest` JSON.
- `data/generated`: canonical generated JSON and `GeneratedArtifactManifest` JSON.
- `data/qa`: machine-readable `QaReport` JSON and `.summary.txt` files.

These roots are ignored by default in the repository. The tracked golden fixture lives under
`test/fixtures/data-ingestion/generated/fixture-skill-id-map.json` because it is synthetic,
minimized, provenance-bearing, and used by Python and Vitest contract tests.
The EPIC-03 synthetic golden fixture lives under
`test/fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json` and is generated
from minimized fixture pages in `test/fixtures/data-ingestion/professions-attributes`.
The EPIC-04 and EPIC-10 synthetic golden fixtures live under
`test/fixtures/data-ingestion/generated/fixture-skills.catalog.json` and
`test/fixtures/data-ingestion/generated/fixture-runes.catalog.json`.

## Baselines

Pass `--baseline path/to/artifact.json` to compare generated output with an explicit baseline. No
baseline produces an info finding. Schema mismatches are errors. Byte differences under the same
schema are warnings until a release-scope review decides whether the change is expected.

## Parser Decision

`mwparserfromhell` is accepted for the next parser-dependent content work. The fixture corpus covers
`Skill infobox`, `Skill progression`, `gr`, `gr2`, `title-rank progression`, `pveversion`,
`pvpversion`, morale-boost recharge, quoted names, punctuation, redirects, disambiguation preambles,
comments, `<nowiki>`, unknown parameters, duplicate parameters, and wrapper templates. Large or lossy
inputs produce diagnostics so a future extractor can route hard cases to a bounded fallback.

## Extension Points

Later content epics should add source profiles, snapshot-driven extractors, and QA checks inside
`build_wars_ingest` rather than creating new API clients or one-off scrapers. Keep profession or
category pages as optional QA cross-checks for skill IDs; `Guild Wars Wiki:Game integration/Skills/*`
remains the primary ID authority.

## Troubleshooting

- Missing `mwparserfromhell`: run `npm run data:setup`.
- PEP 668 pip errors: use the provided virtualenv setup instead of system-wide `pip install`.
- Missing offline snapshots: run fixture mode or perform a bounded live refresh into an ignored
  local root.
- Blocking QA exit: inspect the JSON report and `.summary.txt`; reports are written before exit.
- Stale generated output: rerun fixture mode with the fixed clock and compare against the golden
  fixture or an explicit baseline.

## Safe Deletion

Ignored local outputs under `work/runs/data-ingestion`, `data/source-snapshots`, `data/generated`,
and `data/qa` can be deleted after review when no exact-path ticket has approved them. Do not delete
tracked README policy files or tracked synthetic fixtures.
