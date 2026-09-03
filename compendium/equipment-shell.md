# Equipment Shell

SPRINT-014 ships EPIC-13's framework-neutral semantic equipment shell for one authored
single-character `Build`.

## Authored Schema

`Build.equipment` is `EquipmentLoadout | null`.

`equipment: null` means the current workflow has no authored semantic equipment. A non-null
`EquipmentLoadout` with empty canonical rows means equipment state exists, but no build-affecting
equipment selections have been made. Both states are valid and produce no equipment issues.

`EquipmentLoadout` has `schemaVersion: 1`, five armor rows, and four weapon sets. Constructors in
`src/domain/equipment.ts` create canonical empty topology:

- armor slots: `head`, `chest`, `hands`, `legs`, `feet`
- weapon sets: `set-1`, `set-2`, `set-3`, `set-4`

Selections are discriminated values:

- `{ kind: "known", id }` stores a semantic catalog ID such as `RuneId`, `InsigniaId`, `WeaponId`,
  `WeaponModifierId`, or `AttributeId`.
- `{ kind: "unresolved", label, reason, candidateCatalogId }` preserves user-recoverable stale or
  incomplete state without treating the candidate as resolved.
- Empty attachment points are `null`.

`EquipmentTemplate` remains only as a deprecated compatibility alias for `EquipmentLoadout`.
Raw equipment-template documents stay in `src/domain/template.ts` and
`src/template-compatibility`.

The semantic loadout stores no raw template item/modifier/color/slot IDs, skins, dyes, color IDs,
inventory identity, acquisition facts, generated catalog records, generated artifact paths, source
manifests, QA evidence, wiki URLs, or media.

## Armor

Armor identity is the slot. `ArmorPieceId` remains exported from `ids.ts` for old type consumers,
but `ArmorPiece` does not carry an armor-piece ID or imply an armor-skin catalog.

Each armor row may independently hold one rune selection, one insignia selection, and one headgear
attribute selection. Armor profession is derived from `Build.primaryProfessionId`; it is not copied
onto armor rows.

EPIC-13 validates slot topology, unresolved selections, rune profession restrictions, insignia
profession/mode/slot restrictions, and headgear placement. Known rune and insignia facts come only
from caller-supplied catalog views; `src/domain` does not import generated JSON.

Headgear contributes a fixed `+1` rank to one valid attribute for the selected primary profession.
The project evidence for encoding that fixed fact is the EPIC-10 approved source authority in
`compendium/runes-catalog.md`, which names `Attribute bonus` as the headgear handoff source under
the source-policy gate. Numeric base armor rating is intentionally omitted in EPIC-13 because no
validated consumer needs base armor totals yet.

`collectEquipmentAttributeRankAdjustments` returns target-scoped adjustments for valid headgear and
attribute-rune selections. Attribute-rune stacking is delegated to `summarizeAttributeRuneEffects`,
so highest-per-attribute rune behavior is not duplicated. Non-attribute runes remain legal
equipment selections, but they do not create rank adjustments.

## Weapons

Each `WeaponSet` has `mainHand` and `offHand` selections. Empty, partial, paired, two-handed,
conflicting, and unresolved states remain distinguishable.

Two-handed occupancy is derived from EPIC-12 `equipRole` and `handedness` facts. The authored
loadout does not store a separate two-handed flag. A two-handed main-hand weapon cannot silently
coexist with off-hand authored state, and a two-handed weapon authored in the off hand is a
wrong-hand error.

Weapon modifiers store semantic `WeaponModifierId` selections only. `analyzeWeaponSet` delegates
pairwise base/mod compatibility to `explainWeaponModCompatibility` and separately enforces
duplicate occupied modifier slots on the selected weapon instance. Weapon and modifier catalog-set
version/digest mismatch makes compatibility unresolved.

Catalog weapon requirements take precedence. Authored fallback requirements are accepted only when
the current weapon catalog carries an unresolved requirement. Known unmet requirements are advisory
warnings, not equip-legality errors. Unresolved requirement inputs or unresolved rank-adjustment
evidence produce unresolved validation instead of false unmet warnings.

## Validation

`validateBuild` accepts optional equipment catalog views:

- runes: catalog version plus `CatalogRuneRecord[]`
- insignias: catalog version plus `CatalogInsigniaRecord[]`
- weapons: catalog version, catalog-set version/digest, plus `CatalogWeaponBaseRecord[]`
- weapon modifiers: catalog version, catalog-set version/digest, plus `CatalogWeaponModRecord[]`

Structural equipment validation runs without catalogs. Missing catalog views emit bounded
`equipment.catalog-unavailable` warnings only when selected equipment needs those facts. Duplicate
equipment catalog IDs emit `equipment.catalog-duplicate-id` and are excluded from resolved lookup.

Equipment issues use the existing `ValidationIssue` and `ValidationResult` contract. Rule ordering
appends equipment after profession, attribute, skill-bar, and skill eligibility rules. The same
global issue cap is applied once after all issues are combined. Oversized armor rows, weapon sets,
and per-hand modifier arrays set the result non-exhaustive through the existing truncation field.

`RULE_ENGINE_VERSION` is `rule-engine:v2` because non-null semantic equipment now affects
validation results.

## Runtime Boundaries

EPIC-14 added app-owned runtime views for promoted rune, insignia, weapon, and weapon-modifier
catalogs behind `src/app/catalogs.ts`. Leaf components receive selector view models and do not
import generated JSON, manifests, QA reports, source snapshots, ingestion scripts, wiki APIs, raw
equipment-template records, cosmetic fields, or remote media bytes.

Local-library schema v1 now accepts strict semantic equipment and rejects malformed topology at the
persistence boundary. Share URLs remain skill-template-code-only and warn when meaningful semantic
equipment is omitted.

## Handoffs

EPIC-17 must keep raw equipment-template state separate from semantic loadout selections while it
maps decoded raw item/modifier facts into recoverable semantic choices.

EPIC-20 may consume approved runtime display facts for richer equipment search and tooltips.

EPIC-21 owns complete effect/stat aggregation, condition evaluation, health/energy/armor totals,
weapon effect math, combat simulation, DPS, and cross-system composition.
