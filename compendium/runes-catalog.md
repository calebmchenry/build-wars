# Runes Catalog

EPIC-10 promotes the first runtime-eligible Guild Wars armor-rune catalog for Build Wars.

## Runtime Artifact

Runtime consumers may read:

- `data/generated/epic-10/runes.catalog.json`

Runtime consumers must not read:

- `data/generated/epic-10/runes.catalog.manifest.json`
- `data/qa/epic-10/runes.catalog.qa.json`
- source plans, snapshot-set manifests, raw snapshots, candidate outputs, QA summaries, review
  scratch data, Python ingestion modules, wiki APIs, thumbnails, screenshots, or icon bytes

The catalog is framework-neutral JSON. `src/domain` owns the TypeScript contracts, lookup helpers,
and the narrow attribute-rune effect helper. `src/app` does not import the rune catalog yet.

## Source Authority

The approved source authority is finite:

- `Equipment template format` for rune-like equipment modifier IDs and candidate names.
- `Rune` for armor-rune inventory, broad stacking evidence, and explicit container-rune exclusions.
- `Attribute bonus` for the headgear handoff fact.
- Verified rune detail pages for page identity, redirects, family/rank evidence, effects, and icon
  candidates.
- The promoted EPIC-03 catalog for `ProfessionId` and `AttributeId` joins.

Category crawls, site search, source-provided fetch URLs, PvX/community pages, runtime wiki access,
and arbitrary recursive links are not authority in schema v1.

Live refresh is two-step:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-10-runes --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-10-runes --root . --allow-live-network --stage fetch --source-plan <path> --confirm-source-set-digest <source-set-digest>
```

Offline replay is network-free and requires the selected complete snapshot set:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-10-runes --root . --snapshot-set <path>
```

## Schema Boundaries

Accepted public rune identity is anchored to a verified `TemplateEquipmentModifierId`. The runtime
record stores both `id: RuneId` and `templateModifierId`; unknown authored equipment modifier IDs
remain representable through lookup outcomes and are not coerced.

Rune records include ID, template modifier ID, canonical name, normalized lookup key, wiki URL,
page identity, family key, family kind, rank/tier, eligibility, profession restriction, affected
attribute, non-empty typed effects, headgear state, display state, nullable icon ID, and compact
provenance.

Schema v1 excludes armor shell legality, equipment editor state, title/allegiance effects, full
health/energy/stat totals, acquisition prose, raw page bodies, MediaWiki HTML, copied long prose,
icon bytes, thumbnails, screenshots, and runtime source access.

## Effects And Stacking

Stacking lives on each effect, not on the rune record. Attribute rank effects use
`highest` by `attribute:<id>`. Major and superior attribute-rune health penalties use `sum` by
equipped occurrence. Vigor health uses `highest`; Vitae health and Attunement energy use `sum`.
Absorption and condition-duration effects are structured only where source facts support fixed
values; broader combat math, rounding, and cross-system composition remain deferred.

`note-only` and `unknown` effects are explicit non-arithmetic states. They preserve bounded review
signals without copying source-authored descriptions into runtime JSON.

## Promotion Evidence

BW-1005 approved the production bytes after live source-set discovery, digest-confirmed detail/icon
metadata fetch, selected complete snapshot-set replay, two byte-identical fixed-clock offline
replays, source authority review, effect semantics review, first-baseline review, and passing
`appConsumptionGate` / `publicReleaseGate`.

The live catalog contains 138 runes: 126 attribute runes, 3 Vigor, 3 Absorption, 1 Attunement,
1 Vitae, and 4 condition-reduction runes. Remote media is metadata-only with `cachedBytes: false`.
The QA report has no critical or error findings; live icon dimension warnings are accepted as a
bounded metadata-only finding class.

## Downstream Boundaries

- EPIC-13 owns semantic armor shell validation, `ArmorPiece.rune` attachment points, and the fixed
  headgear `+1` rank handoff backed by the approved `Attribute bonus` source authority.
- EPIC-14 owns equipment editing and app catalog wiring. Join rune legality against primary armor
  profession facts through the EPIC-13 catalog-view boundary.
- EPIC-15 owns title ranks, allegiance, and title effects separately from runes.
- EPIC-17 owns semantic equipment-template resolution from decoded modifier IDs to rune lookup
  outcomes while preserving unknown authored modifiers.
- EPIC-20 may index names, lookup keys, families, ranks, effects, and structured display facts from
  the runtime catalog only.
- EPIC-21 owns broad stat analysis and full health/energy/equipment composition.
