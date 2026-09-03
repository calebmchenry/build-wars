# Equipment Editor

SPRINT-015 ships EPIC-14's user-facing semantic equipment editor for the single-character app
workspace.

## Workspace Contract

The main editor column has peer `Skills` and `Equipment` tabs. `Skills` remains the default tab and
contains the existing skill bar, skill browser, and skill-specific tooltip behavior. Opening or
rendering `Equipment` does not materialize equipment or dirty the draft.

`Build.equipment` remains nullable:

- `null` means no semantic equipment is authored.
- A canonical empty `EquipmentLoadout` means the equipment state exists but has no meaningful
  selections.
- The first meaningful armor or weapon edit materializes the canonical loadout.
- Clearing ordinary fields leaves canonical empty equipment.
- Explicit reset returns to `null` and asks for confirmation before discarding meaningful equipment.

`selectHasMeaningfulEquipment()` is the shared predicate for share/export warnings and excludes
both `null` and canonical empty equipment.

## Catalog Boundary

Runtime generated equipment catalog imports are isolated to `src/app/catalogs.ts`:

- `data/generated/epic-10/runes.catalog.json`
- `data/generated/epic-11/insignias.catalog.json`
- `data/generated/epic-12/weapons.catalog.json`
- `data/generated/epic-12/weapon-mods.catalog.json`

The app boundary exposes app-owned equipment views, validation slices, per-family readiness, catalog
versions, catalog-set weapon facts, and attribution. Leaf components receive view models and do not
import generated JSON, manifests, QA reports, source plans, snapshots, wiki helpers, remote media, or
raw equipment-template artifacts.

Equipment readiness degrades by family. A failed rune slice disables rune-backed validation and
options but leaves insignia, weapon, modifier, skill editing, reset, and clear paths usable where
their data is available.

## Controls

`src/app/equipment-editor-state.ts` owns structural equipment reducer actions. These actions remain
catalog-independent and preserve authored stale or unresolved state:

- Armor actions set and clear runes, insignias, and the headgear attribute bonus.
- Weapon actions set and clear weapons, hands, sets, modifiers, authored unresolved selections, and
  requirement fallback data.
- Modifier writes append or replace only dense in-bounds entries; sparse and out-of-bounds writes
  are no-ops.
- Clearing a weapon preserves modifiers and requirements until the user clears the hand or set.

`src/app/equipment-selectors.ts` owns option filtering, retained-selection labels, inline validation
issue grouping, compatibility presentation, conservative summaries, and attribution notes. Domain
validation remains authoritative; UI filtering is a convenience layer, not a second legality engine.

## Armor

The armor editor renders exactly five fixed rows in canonical order: head, chest, hands, legs, and
feet. Each row supports rune and insignia selection, clearing, retained stale IDs, unresolved
selections, and inline validation messages. The head row also supports a primary-profession
headgear bonus when a primary profession is selected.

Headgear and attribute-rune adjustments feed the existing effective-rank display through domain
rank-adjustment helpers without changing authored base attribute allocations.

## Weapons

The weapon editor renders exactly four canonical weapon sets. Each set has main-hand and off-hand
controls with empty, one-handed, two-handed, off-hand-only, stale, unresolved, modifier, and
requirement states. Modifier pickers are derived from the selected weapon's EPIC-12 slot facts.

Weapon-set-local effects stay in set-local summary notes. The app does not aggregate weapon damage,
DPS, active-set semantics, or full combat stats.

## Persistence And Sharing

Local schema version 1 now accepts strict app-authored semantic equipment. The parser rejects
dangerous keys, unsupported fields, malformed topology, noncanonical slot order, sparse arrays,
empty hand objects, duplicate known modifier IDs, invalid indexes, and unbounded strings. Valid and
invalid backup records are isolated during restore preview, so one malformed record does not corrupt
accepted records.

Saved catalog facts include equipment catalog versions and weapon catalog-set facts when validation
had those slices. Old `equipment: null` records do not become stale merely because equipment catalog
facts are absent.

Skill-template import/export and share URLs remain equipment-free. Meaningful equipment triggers
warnings before skill-template export/share omission and before skill-template import discards
authored equipment. Equipment-only validation issues do not block canonical skill-template export.

## Deferred Scope

Raw equipment-template replay into semantic editor state, equipment share payloads, equipment icons,
skins, dyes, color IDs, acquisition facts, recommendations, active-set selection, full stat
aggregation, party equipment, and combat simulation remain deferred.
