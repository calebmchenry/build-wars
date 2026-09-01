# Professions and Attributes Catalog

EPIC-03 promotes the first runtime-eligible source-derived Build Wars catalog:

- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`
- `data/qa/epic-03/professions-attributes.catalog.qa.json`

The catalog is not imported by `src/app` yet. EPIC-04, EPIC-05, EPIC-06, and EPIC-08 may consume it
later for skills, template compatibility, game-rule validation, and build editing. UI work must
separately handle attribution display plus remote media/privacy decisions.

## Source Authority

- `Skill template format` is authoritative for profession template IDs, the profession `0 -> None`
  sentinel, attribute template IDs, and numeric gaps.
- `Profession` is authoritative for the playable profession set, abbreviations by convention, family,
  and primary character-creation campaign availability.
- `Attribute` is authoritative for attribute ownership, primary attributes, and primary-only
  availability.
- `Attribute point` is authoritative for purchased-rank costs, level point totals, attribute quests,
  and default level-20 point budgets.
- Profession pages provide metadata-only icon file references. Primary-attribute pages are bounded
  support references for reviewed original summaries.

The source-shape checkpoint found bullet lists on `Skill template format` and bounded wiki tables on
`Profession`, `Attribute`, and `Attribute point`. A bounded table/list helper is sufficient for the
locked profile; no scraper, browser automation, category crawl, or runtime fetch is allowed.

## Identity Semantics

Template IDs and catalog IDs are distinct concepts. The first catalog uses equal numeric values for
known playable professions and attributes, but only crosswalk records define compatibility.

- Profession template ID `0` maps to `None` with `catalogId: null`.
- Playable professions contain exactly ten records and never include template ID `0`.
- Attribute template ID `0` remains valid in the attribute namespace.
- Attribute IDs preserve non-contiguous template values; gaps `26`, `27`, and `28` are reserved
  facts, not compacted IDs.
- Known, none, reserved, unsupported, and unknown lookup outcomes are distinct. Reverse lookup uses
  canonical names and explicit abbreviations only.

## Allocation Assumptions

Attribute point rules distinguish purchased rank, effective rank, marginal cost, cumulative cost,
base level points, individual quest rewards, quest groups, maximum applicable quest bonus, and
default budget assumptions.

The MVP default is a level-20 PvE player using one native campaign's maximum applicable attribute
quest rewards:

- level 20 without quest rewards: `170`
- maximum applicable quest bonus: `30`
- level 20 with maximum applicable quest rewards: `200`

PvP characters, heroes, runes, equipment, consumables, blessings, temporary effects,
campaign-progression state, and actual quest-log state are deferred to later rule work.

## QA And Promotion

Promotion requires a bounded live refresh, offline replay from selected snapshots, byte-identical
fixed-clock generation, complete source/provenance references, reviewed original primary-effect
summaries, metadata-only icons with `cachedBytes: false`, no copied source prose, no media bytes, no
blocking findings, and `appConsumptionGate: pass` plus `publicReleaseGate: pass`.

Raw snapshots, snapshot manifests, candidate live/offline outputs outside the three exact paths, text
QA summaries, icon binaries, thumbnails, screenshots, and copied page bodies remain ignored or
absent. Because raw snapshots are not tracked, historical replay is limited to local ignored
snapshots or a fresh bounded live refresh.
