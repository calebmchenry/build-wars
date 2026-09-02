# Insignias Catalog

EPIC-11 promotes the first runtime-eligible Guild Wars armor-insignia catalog for Build Wars.

## Runtime Artifact

Runtime consumers may read:

- `data/generated/epic-11/insignias.catalog.json`

Runtime consumers must not read:

- `data/generated/epic-11/insignias.catalog.manifest.json`
- `data/qa/epic-11/insignias.catalog.qa.json`
- source plans, snapshot-set manifests, raw snapshots, candidate outputs, QA summaries, review
  evidence, Python ingestion modules, wiki APIs, thumbnails, screenshots, or icon bytes

The catalog is framework-neutral JSON. `src/domain` owns the TypeScript contracts, lookup helpers,
and the narrow one-record/one-slot insignia effect projection helper. `src/app` does not import the
insignia catalog yet.

## Source Authority

The approved source authority is finite:

- `Equipment template format` for insignia-like equipment modifier IDs and candidate names.
- `Insignia` for common/profession grouping and source-visible bonus membership.
- `Effect stacking` for the approved effect-locality and combination relationship.
- Verified insignia detail pages for page identity, redirects, restrictions, effects, conditions,
  slot evidence, and icon candidates.
- The promoted EPIC-03 catalog for `ProfessionId` joins.

Category crawls, site search, source-provided fetch URLs, PvX/community pages, runtime wiki access,
and arbitrary recursive links are not authority in schema v1.

Live refresh is two-step:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-11-insignias --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-11-insignias --root . --allow-live-network --stage fetch --source-plan <path> --confirm-source-set-digest <source-set-digest>
```

Offline replay is network-free and requires the selected complete snapshot set:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-11-insignias --root . --snapshot-set <path>
```

## Schema Boundaries

Public `InsigniaId` values are schema-owned registry allocations. Template modifier IDs are
crosswalk facts, not public identity. Every accepted production v1 record has exactly one active
verified armor-prefix `TemplateEquipmentModifierId` crosswalk.

Insignia records include ID, source key, optional variant key, canonical name, normalized lookup key,
wiki URL, page identity, family key, availability, profession restriction, mode facts, applicable
armor slots, template modifier crosswalks, non-empty typed effects, effect completeness, display
state, nullable icon ID, and compact provenance.

Schema v1 excludes armor shell legality, equipment editor state, template-code resolution, condition
evaluation, hit-location math, rune/insignia composition, full stat totals, acquisition prose, raw
page bodies, MediaWiki HTML, copied long prose, icon bytes, thumbnails, screenshots, and runtime
source access.

## Effects

Numeric effects expose tagged outcomes for every armor slot: `head`, `chest`, `hands`, `legs`, and
`feet`. Outcomes distinguish `value`, `not-applicable`, and `unresolved`; consumers do not infer
missing values from formulas or source prose.

Supported effect states are maximum health, maximum energy, armor rating, incoming damage, duration,
outgoing damage, note-only, and unknown. Effects carry application scope, condition, combination
policy, group key where relevant, mode applicability, and provenance.

Conditions are inert controlled data. The domain helper
`resolveInsigniaEffectsForArmorSlot(record, slot)` projects effects for one record and one armor
slot. It does not choose armor, validate profession/mode legality, evaluate conditions, combine
records, apply rune/title/weapon effects, use hit-location probabilities, calculate totals, read
files, fetch data, or mutate inputs.

## Promotion Evidence

BW-1105 approved the production bytes after live source-set discovery, digest-confirmed detail/icon
metadata fetch, selected complete snapshot-set replay, two byte-identical fixed-clock offline
replays, source authority review, effect semantics review, first-baseline review, and passing
`appConsumptionGate` / `publicReleaseGate`.

The live catalog contains 45 insignias. Remote media is metadata-only with `cachedBytes: false`.
The QA report has no critical or error findings; missing optional icon fields and one non-64 icon
metadata report are accepted as bounded metadata-only finding classes.

Selected raw source evidence remains ignored under the local worktree. Future exact reproduction
requires the retained selected snapshot set or a fresh bounded live discover/fetch and review.

## Downstream Boundaries

- EPIC-13 owns armor shell/headgear records and primary armor profession facts.
- EPIC-14 owns equipment editing, armor legality, and attaching `ArmorPiece.insigniaId` by slot.
- EPIC-17 owns semantic equipment-template resolution from decoded modifier IDs to insignia lookup
  outcomes while preserving unknown authored modifiers.
- EPIC-20 may index names, lookup keys, families, availability, restrictions, slots, effects, and
  structured display facts from the runtime catalog only.
- EPIC-21 owns condition evaluation, hit-location behavior, rune/insignia composition, and full
  health, energy, armor, damage, and duration aggregation.
