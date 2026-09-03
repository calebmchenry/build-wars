# Weapons And Mods Catalog

EPIC-12 promotes the first runtime-eligible Guild Wars weapon base and weapon modifier catalogs for
Build Wars.

## Runtime Artifacts

Runtime consumers may read:

- `data/generated/epic-12/weapons.catalog.json`
- `data/generated/epic-12/weapon-mods.catalog.json`

Runtime consumers must not read:

- `data/generated/epic-12/weapons.catalog.manifest.json`
- `data/generated/epic-12/weapon-mods.catalog.manifest.json`
- `data/qa/epic-12/weapons.catalog.qa.json`
- `data/qa/epic-12/weapon-mods.catalog.qa.json`
- source plans, snapshot-set manifests, raw snapshots, candidate outputs, QA summaries, review
  evidence, Python ingestion modules, wiki APIs, thumbnails, screenshots, or icon bytes

The catalogs are framework-neutral JSON. `src/domain` owns the TypeScript contracts, lookup helpers,
and the narrow one-base/one-mod compatibility helper. `src/app` does not import the EPIC-12 catalogs
yet.

## Source Authority

The approved source authority is finite:

- `Equipment template format` for raw equipment item IDs, raw modifier IDs, row shape, and PvP
  template context.
- `Weapon` and reviewed weapon-family/detail pages for family, equip role, handedness, damage,
  requirement, mode, slots, and display facts.
- `Weapon upgrade`, `Inscription`, and reviewed modifier/detail pages for prefix, suffix,
  inscription, staff-head, staff-wrapping, shield/offhand, caster, chance, mastery, and slot facts.
- Metadata-only `imageinfo` for optional icon facts.
- The promoted EPIC-03 catalog for `ProfessionId` and `AttributeId` joins.

Category crawls, site search, source-provided fetch URLs, PvX/community pages, runtime wiki access,
and arbitrary recursive links are not authority in schema v1.

Live refresh is two-step:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-12-weapons-and-mods --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-12-weapons-and-mods --root . --allow-live-network --stage fetch --source-plan <path> --confirm-source-set-digest <source-set-digest>
```

Offline replay is network-free and requires the selected complete snapshot set:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-12-weapons-and-mods --root . --snapshot-set <path>
```

## Schema Boundaries

Public `WeaponId` and `WeaponModifierId` values are schema-owned registry allocations. Raw
`TemplateEquipmentItemId` and `TemplateEquipmentModifierId` values are crosswalk facts and lookup
inputs, not public identity. Unknown, ambiguous, historical, unsupported, or armor-owned raw IDs
remain visible through compact dispositions and lookup outcomes.

Weapon base records include ID, source key, variant key, canonical name, normalized lookup key, wiki
URL, page identity, family key, family, variant, equip role, handedness, mode availability, tagged
damage, tagged requirement, allowed modifier slots, template item crosswalks, display state,
nullable icon ID, and compact provenance.

Weapon modifier records include ID, source key, variant key, canonical name, normalized lookup key,
wiki URL, page identity, family key, family, occupied slot, mode availability, tagged applicability,
template modifier crosswalks, typed effects, effect completeness, display state, nullable icon ID,
and compact provenance.

Schema v1 excludes equipment editor state, weapon-set controls, inventory persistence, share-url
equipment payloads, dynamic catalog loading, remote icon rendering, combat simulation, DPS/stat
totals, acquisition prose, raw page bodies, MediaWiki HTML, copied long prose, icon bytes,
thumbnails, screenshots, and runtime source access.

## Effects And Compatibility

Supported modifier effect states are numeric effects, damage-type conversion, chance effects,
note-only, and unknown. Closed numeric and chance facts are structured; mastery, conditional, or
hard-to-verify behavior remains note-only or unknown for EPIC-21.

`lookupWeaponTemplateItemId` and `lookupWeaponTemplateModifierId` resolve raw decoded template IDs
against caller-supplied catalogs without changing the decoded raw document. Outcomes distinguish
known catalog records, explicit dispositions, ambiguous raw IDs, and unknown future IDs.

`explainWeaponModCompatibility(base, modifier)` checks only static one-base/one-mod facts: modifier
family, mode overlap, occupied slot availability, and applicability. It does not choose equipment
sets, enforce duplicate-slot set legality, evaluate effects, inspect attribute ranks, aggregate
stats, or read generated files.

## Promotion Evidence

BW-1206 approved the production bytes after live source-set discovery, digest-confirmed
detail/icon-metadata fetch, selected complete snapshot-set replay, two byte-identical fixed-clock
offline replays, source authority review, effect semantics review, first-baseline review,
counterpart release-set checks, and passing `appConsumptionGate` / `publicReleaseGate`.

The live release contains 11 weapon bases and 9 weapon modifiers. Remote media is metadata-only with
`cachedBytes: false`. Both QA reports have no findings, and both catalogs share the same
`catalogSetVersion`, `catalogSetDigest`, source-set digest, source-plan digest, selected evidence
digest, dependency digest, and counterpart artifact digest.

Selected raw source evidence remains ignored under the local worktree. Future exact reproduction
requires the retained selected snapshot set or a fresh bounded live discover/fetch and review.

## Downstream Boundaries

- EPIC-13 owns armor/headgear records and must not move armor-owned modifier IDs into EPIC-12.
- EPIC-14 owns equipment editing, weapon-set controls, slot occupancy across full equipment sets,
  and attaching selected weapon/modifier IDs to loadouts.
- EPIC-17 owns broader semantic equipment-template import workflows while preserving unknown raw
  equipment template IDs.
- EPIC-20 may index names, lookup keys, families, slots, requirements, effects, and structured
  display facts from the runtime catalogs only.
- EPIC-21 owns effect evaluation, condition handling, mastery math, chance aggregation, combat
  simulation, and full health, energy, armor, damage, duration, and DPS totals.
