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
- `skill_source_set.py`: EPIC-04 source-set planning, ranged-page validation, source-plan digests,
  page-resolution metadata, and complete snapshot-set manifest verification.
- `skill_infobox.py`, `skill_progression.py`, and `skill_catalog.py`: EPIC-04 skill field,
  cost/timing, description-state, progression, split-group, dependency, QA, and catalog assembly
  logic.
- `rune_source_set.py`, `rune_extractor.py`, `rune_semantics.py`, and `rune_catalog.py`: EPIC-10
  source authority planning, rune page resolution, EPIC-03 joins, typed effect/stacking semantics,
  headgear handoff facts, QA, and catalog assembly logic.
- `source_set_protocol.py`, `insignia_source_set.py`, `insignia_identity.py`,
  `insignia_extractor.py`, `insignia_semantics.py`, and `insignia_catalog.py`: EPIC-11 source
  authority planning, identity-registry validation, selected snapshot-set replay checks, insignia
  page resolution, EPIC-03 joins, typed per-slot effect semantics, inert conditions, QA, and catalog
  assembly logic.
- `weapon_source_set.py`, `weapon_identity.py`, `weapon_base_extractor.py`,
  `weapon_mod_extractor.py`, `weapon_semantics.py`, and `weapon_catalog.py`: EPIC-12 source
  authority planning, identity-registry validation, selected snapshot-set replay checks, weapon base
  and modifier page resolution, EPIC-03 joins, typed effect semantics, compatibility inputs, QA, and
  paired catalog assembly logic.
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
- High-volume EPIC-04 refreshes must use discover first, then digest-confirmed fetch, then exact
  `--snapshot-set` offline replay. Do not broaden the source graph beyond the approved index and
  ranged skill pages without a recorded planning amendment.
- EPIC-10 refreshes must use the locked `Equipment template format`, `Rune`, and `Attribute bonus`
  authority pages, the reviewed source-set digest, planned rune detail pages, metadata-only
  `imageinfo`, and selected complete snapshot-set replay. Do not replace this with a category crawl
  or source-provided URLs without a recorded planning amendment.
- EPIC-11 refreshes must use the locked `Equipment template format`, `Insignia`, and
  `Effect stacking` authority pages, the reviewed source-set digest, planned insignia detail pages,
  metadata-only `imageinfo`, the EPIC-03 dependency, and selected complete snapshot-set replay. Do
  not replace this with a category crawl, source-provided URLs, hand-authored IDs, or prose-derived
  arithmetic without a recorded planning amendment.
- EPIC-12 refreshes must use the locked `Equipment template format`, `Weapon`, `Weapon upgrade`,
  and `Inscription` authority pages, the reviewed source-set digest, planned weapon/modifier detail
  pages, metadata-only `imageinfo`, the EPIC-03 dependency, and selected complete snapshot-set
  replay. Do not replace this with a category crawl, source-provided URLs, raw-template-derived
  public IDs, or prose-derived arithmetic without a recorded planning amendment.

## Registered Profiles

- `guild-wars-wiki`: EPIC-02 skill-ID/parser/icon fixture proof. This remains the default profile
  for compatibility.
- `epic-03-professions-attributes`: EPIC-03 professions and attributes catalog. The profile locks
  source pages, detail pages, page/request/byte caps, exact promoted paths, selected snapshot replay,
  and metadata-only icon handling.
- `epic-04-skills`: EPIC-04 skills catalog. The profile locks the source-set index
  `Guild Wars Wiki:Game integration/Skills`, linked ranged pages, profession skill lists,
  `List of PvE-only skills`, large finite caps, digest-bound source plans, selected complete
  snapshot-set replay, exact promoted paths, reviewed concise description policy, and metadata-only
  icon handling.
- `epic-10-runes`: EPIC-10 runes catalog. The profile locks three seed authority pages, the EPIC-03
  dependency, finite detail-page and icon metadata caps, digest-bound source plans, selected
  complete snapshot-set replay, exact promoted paths, effect-level stacking, and metadata-only icon
  handling.
- `epic-11-insignias`: EPIC-11 insignias catalog. The profile locks three seed authority pages, the
  EPIC-03 dependency, finite detail-page and icon metadata caps, digest-bound source plans,
  registry-backed public IDs, selected complete snapshot-set replay, exact promoted paths, per-slot
  effect semantics, inert conditions, effect-level locality/combination metadata, and metadata-only
  icon handling.
- `epic-12-weapons-and-mods`: EPIC-12 weapons and mods catalogs. The profile locks four seed
  authority pages, the EPIC-03 dependency, finite detail-page and icon metadata caps, digest-bound
  source plans, registry-backed public IDs, selected complete snapshot-set replay, exact promoted
  paired paths, raw template crosswalks, tagged damage/requirement/applicability/effect states,
  compatibility inputs, and metadata-only icon handling.

Default fixture regeneration writes the EPIC-02 proof plus the EPIC-03, EPIC-04, EPIC-10, and
EPIC-11 fixture catalogs and the EPIC-12 fixture catalogs. Direct profile commands use
`--profile epic-03-professions-attributes`, `--profile epic-04-skills`,
`--profile epic-10-runes`, `--profile epic-11-insignias`, or
`--profile epic-12-weapons-and-mods`.
