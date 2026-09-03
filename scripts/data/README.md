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
npm run data:skill-icons -- --allow-live-network
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-03-professions-attributes
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-04-skills
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-10-runes
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-11-insignias
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-and-mods
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-03-professions-attributes --root .
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-04-skills --root . --snapshot-set work/runs/data-ingestion/epic-04/snapshot-sets/<selected>.snapshot-set.json
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-10-runes --root . --snapshot-set work/runs/data-ingestion/epic-10/snapshot-sets/<selected>.snapshot-set.json
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-11-insignias --root . --snapshot-set work/runs/data-ingestion/epic-11/snapshot-sets/<selected>.snapshot-set.json
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-12-weapons-and-mods --root . --snapshot-set work/runs/data-ingestion/epic-12/snapshot-sets/<selected>.snapshot-set.json
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --allow-live-network --title "Guild Wars Wiki:Game integration/Skills/0"
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-03-professions-attributes --root . --allow-live-network
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-04-skills --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-04-skills --root . --allow-live-network --stage fetch --source-plan work/runs/data-ingestion/epic-04/source-plans/<digest>.source-plan.json --confirm-source-set-digest <digest>
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-10-runes --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-10-runes --root . --allow-live-network --stage fetch --source-plan work/runs/data-ingestion/epic-10/source-plans/<digest>.source-plan.json --confirm-source-set-digest <source-set-digest>
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-11-insignias --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-11-insignias --root . --allow-live-network --stage fetch --source-plan work/runs/data-ingestion/epic-11/source-plans/<digest>.source-plan.json --confirm-source-set-digest <source-set-digest>
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-12-weapons-and-mods --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-12-weapons-and-mods --root . --allow-live-network --stage fetch --source-plan work/runs/data-ingestion/epic-12/source-plans/<digest>.source-plan.json --confirm-source-set-digest <source-set-digest>
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/cache_skill_icons.py --allow-live-network
```

Exit codes:

- `0`: command completed; warnings may still leave app or public gates in `review-required`.
- `2`: invalid mode/options, setup failure, missing offline snapshots, or blocking QA gate.

`npm run verify` includes `npm run data:test`, which is fast and offline.

`npm run data:skill-icons -- --allow-live-network` is a separate live cache pass for runtime skill
icons. It reads the promoted EPIC-04 skill catalog, resolves Guild Wars Wiki icon `imageinfo`
metadata in batches, downloads unambiguous icons into `public/gww-icons/skills/`, writes the local
runtime manifest at `src/app/skill-icon-assets.generated.json`, and writes provenance at
`data/generated/epic-04/skill-icon-assets.manifest.json`.

## Modes

- `fixture`: uses committed minimized synthetic fixtures from `test/fixtures/data-ingestion`, a fixed
  UTC clock, and an output root under ignored `work/runs/data-ingestion`.
- `offline`: reads existing ignored snapshot manifests from the configured output root without
  network access. EPIC-04, EPIC-10, EPIC-11, and EPIC-12 require one explicit complete
  `--snapshot-set` manifest and reject partial, duplicate, mixed-profile, digest-mismatched, or
  path-escaping children.
- `live`: manually fetches named Guild Wars Wiki pages through the shared MediaWiki client. It
  requires `--allow-live-network` and at least one `--title` unless the selected profile owns its
  fixed source graph.

The default `guild-wars-wiki` profile preserves the EPIC-02 skill-ID fixture proof. Fixture mode also
writes the EPIC-03 professions/attributes, EPIC-04 skills, EPIC-10 runes, EPIC-11 insignias, and
EPIC-12 weapons/mods fixture catalogs as side effects so `npm run data:regenerate` covers all
registered production profiles offline. Run `epic-03-professions-attributes`, `epic-04-skills`,
`epic-10-runes`, `epic-11-insignias`, or `epic-12-weapons-and-mods` directly for profile-specific
fixture, offline, or live catalog work.

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

The EPIC-04 profile is locked to `Guild Wars Wiki:Game integration/Skills`, linked ranged pages
under `Guild Wars Wiki:Game integration/Skills/*`, and the ten `List of <profession> skills` pages;
the missing `/Skills/0` page is blocker history only. Discovery fetches the index/ranges, renders
the exact profession-list revisions, resolves list-only rows through supplemental detail pages,
writes a digest-bound source plan, and stops. Fetch mode requires the exact plan path and
`--confirm-source-set-digest`, rechecks source-set drift, fetches planned detail pages in
deterministic batches, writes one complete `SourceSnapshotSetManifest`, and promotes only the exact
catalog/manifest/QA paths. Profession skill list rows define the runtime profession-skill catalog;
off-list game-integration skills, title skills, and other special groups are not promoted in schema
v1. CLI options may lower smoke-test limits such as `--detail-limit`, but code-owned caps remain the
ceiling.

The EPIC-10 profile is locked to `Equipment template format`, `Rune`, and `Attribute bonus` as seed
authority pages, the promoted EPIC-03 catalog as the profession/attribute dependency, verified rune
detail pages, and metadata-only rune icon `imageinfo`. Discovery writes a digest-bound source plan
that accounts for accepted armor runes, supported relationships, explicit exclusions, unsupported
rows, and blocking findings. Fetch mode requires the reviewed plan path and exact source-set digest,
rechecks drift, fetches only planned detail pages and icon metadata, writes one complete
snapshot-set manifest, and promotes only `data/generated/epic-10/runes.catalog.json`, its adjacent
manifest, and `data/qa/epic-10/runes.catalog.qa.json`.

The EPIC-11 profile is locked to `Equipment template format`, `Insignia`, and `Effect stacking` as
seed authority pages, the promoted EPIC-03 catalog as the profession dependency, verified insignia
detail pages, and metadata-only insignia icon `imageinfo`. Discovery writes a digest-bound source
plan that accounts for accepted insignias, supported mechanics relationships, explicit exclusions,
unsupported rows, current caps, identity-registry digest, and blocking findings. Fetch mode requires
the reviewed plan path and exact source-set digest, rechecks drift, fetches only planned detail pages
and icon metadata, writes one complete snapshot-set manifest, and promotes only
`data/generated/epic-11/insignias.catalog.json`, its adjacent manifest, and
`data/qa/epic-11/insignias.catalog.qa.json`.

The EPIC-12 profile is locked to `Equipment template format`, `Weapon`, `Weapon upgrade`, and
`Inscription` as seed authority pages, the promoted EPIC-03 catalog as the profession/attribute
dependency, reviewed weapon/modifier detail pages, and metadata-only weapon/mod icon `imageinfo`.
Discovery writes a digest-bound source plan that accounts for accepted weapon bases, accepted
weapon modifiers, supported relationships, explicit exclusions, unsupported/historical/ambiguous raw
IDs, current caps, identity-registry digests, and blocking findings. Fetch mode requires the
reviewed plan path and exact source-set digest, rechecks drift, fetches only planned detail pages
and icon metadata, writes one complete snapshot-set manifest, and promotes only the two EPIC-12
catalogs, their adjacent manifests, and their QA reports.

## Pipeline Contract

| Stage     | Inputs                                               | Outputs                                                             | Required contracts and gates                                                                                                                                                                             |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fetch     | Source profile and query parameters                  | Raw source payload in `data/source-snapshots`                       | Live mode only; source values are untrusted.                                                                                                                                                             |
| Snapshot  | Raw payload and source metadata                      | `SourceSnapshotManifest` plus ignored raw payload                   | Records source family, page/file identity, revision identity, source revision timestamp, retrieval timestamp, artifact path, SHA-256 digest, and ignored retention policy.                               |
| Replay    | Complete selected snapshot-set manifest              | Verified selected snapshot payloads                                 | EPIC-04, EPIC-10, EPIC-11, and EPIC-12 require one profile-bound manifest; rejects partial, duplicate, extra/missing, mixed-profile, digest-mismatched, or path-escaping inputs before catalog assembly. |
| Extract   | Verified snapshot payloads                           | Skill-ID mappings, parser proof, and icon metadata                  | Extractors consume snapshots, not a network client. Nested wiki templates are traversed through `mwparserfromhell`, not regex-only parsing.                                                              |
| Normalize | Extracted records and diagnostics                    | Canonical JSON plus `GeneratedArtifactManifest` in `data/generated` | UTF-8, LF-terminated, two-space indented, key-stable, finite-number-only, stable record order, provenance-bearing, and metadata-only media references where allowed.                                     |
| Validate  | Generated artifact manifest and records              | `QaReport` JSON and bounded text summary in `data/qa`               | Reports provenance gaps, stale/unverified revisions, rights ambiguity, invalid source IDs, copied text, icon metadata gaps, generated diffs, schema/shape errors, and integrity failures.                |
| Promote   | QA report, release scope, and approved artifact list | Exact-path allowlist or excluded artifact                           | Requires a later ticket naming exact paths, review evidence, source-policy disposition, and app/public release gate status before runtime use.                                                           |

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

The game-integration index/range pages provide the baseline ID map. The ten profession skill list
pages define the promoted runtime catalog and supply supplemental seeds for list-only rows when the
numeric range pages lag behind current wiki profession lists. Title skills, PvE-only title tracks,
and other special skill groups are deferred to later profiles.

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

## EPIC-11 Profile

`epic-11-insignias` normalizes Guild Wars armor insignia facts into
`data/generated/epic-11/insignias.catalog.json`. The runtime catalog contains source-set authority
facts, compact dispositions, identity-registry facts, EPIC-03 dependency digests, insignia records,
verified template modifier ID crosswalks, profession restrictions, mode facts, applicable armor
slots, typed effects, exact tagged per-slot outcomes, inert conditions, effect-level locality and
combination metadata, nullable icon IDs, metadata-only remote media references, section digests, and
a semantic `catalogVersion`.

Schema v1 excludes armor shell legality, equipment editor state, template-code resolution,
condition evaluation, hit-location math, rune/insignia composition, full stat totals, acquisition
prose, raw page bodies, MediaWiki HTML, copied long prose, icon bytes, thumbnails, screenshots, and
runtime source access. Public `InsigniaId` values are schema-owned registry allocations; accepted
production records also carry exactly one active verified armor-prefix `TemplateEquipmentModifierId`
crosswalk.

The profile uses fixed-clock fixture generation and exact selected snapshot-set offline replay for
deterministic catalog, manifest, QA, section digest, finding ID, source ordering, source-set
disposition, identity registry, and effect-order checks.

## EPIC-12 Profile

`epic-12-weapons-and-mods` normalizes Guild Wars weapon base and weapon modifier facts into
`data/generated/epic-12/weapons.catalog.json` and
`data/generated/epic-12/weapon-mods.catalog.json`. The runtime catalogs contain source-set
authority facts, compact dispositions, identity-registry facts, EPIC-03 dependency digests, weapon
base records, modifier records, template item/modifier crosswalks, tagged damage and requirement
states, allowed modifier slots, applicability facts, typed effects, compatibility inputs, nullable
icon IDs, metadata-only remote media references, section digests, and semantic catalog versions.

Schema v1 excludes equipment editor state, inventory persistence, weapon-set controls, semantic
template import UI, combat simulation, full stat totals, acquisition prose, raw page bodies,
MediaWiki HTML, copied long prose, icon bytes, thumbnails, screenshots, and runtime source access.
Public `WeaponId` and `WeaponModifierId` values are schema-owned registry allocations; raw template
IDs remain crosswalk facts and lookup inputs.

The profile uses fixed-clock fixture generation and exact selected snapshot-set offline replay for
deterministic catalog, manifest, QA, section digest, source ordering, source-set disposition,
identity registry, effect semantics, and counterpart release-set checks.

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
The EPIC-04, EPIC-10, and EPIC-11 synthetic golden fixtures live under
`test/fixtures/data-ingestion/generated/fixture-skills.catalog.json` and
`test/fixtures/data-ingestion/generated/fixture-runes.catalog.json`, and
`test/fixtures/data-ingestion/generated/fixture-insignias.catalog.json`.
The EPIC-12 synthetic golden fixtures live under
`test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json` and
`test/fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json`.

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
and `data/qa` can be deleted after review when no exact-path ticket has approved them. EPIC-11
production replay requires either the retained selected local snapshot set or a fresh bounded live
discover/fetch and review. Do not delete tracked README policy files or tracked synthetic fixtures.
