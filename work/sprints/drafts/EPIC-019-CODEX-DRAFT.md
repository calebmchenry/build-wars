## Overview

Create `EPIC-19: Composer Attribute Adjustments` with `BW-190x` tickets for rune/headgear bonuses, assumed active attribute effects, and unchanged Guild Wars template behavior. This is a composer milestone: no armor-slot editor, no inferred equipment on new imports, and no complete-build sharing workflow.

## Use Cases

- Edit base attribute ranks with existing arrows while seeing effective ranks in blue when bonuses apply.
- Choose a slot-free rune segment per primary-profession attribute: `None`, `+1`, `+2`, `+3`, using local rune icons and health-penalty text.
- Choose one optional `+1` headgear attribute across primary-profession attributes only.
- Manage assumed active effects in an advanced area, with collapsed count still visible.
- Import/export/load/save normal game codes exactly as today: base professions, attributes, and skills only.

## Architecture

Add `Build` schema v3 fields:

- `attributeBonusProfile: AttributeBonusProfile | null`
- `assumedAttributeEffects: readonly AssumedAttributeEffectPreference[]`

`attributeBonusProfile === null` means legacy semantic `equipment` derives headgear/rune rank inputs. A non-null profile replaces only composer headgear/rune rank inputs and never rewrites `equipment`.

Default profile shape:

- `schemaVersion: 1`
- `headgearAttributeId: AttributeId | null`
- `runeSelections: readonly { attributeId: AttributeId; runeId: RuneId | null }[]`

Effect preference default:

- no row means automatic
- rows store stable `effectId`, `intent: "forced-on" | "forced-off"`, and for Heroic Refrain `bonus: 1 | 2 | 3 | 4`

Use stable effect IDs:

- `self:glyph-of-elemental-power` for skill `198`
- `self:elemental-lord` for `1951` / `2094` as one effect
- `self:masochism` for PvE Masochism, not PvP split `3054`
- `external:heroic-refrain` for `3431`, opt-in only

Implementation must verify exact IDs, mode eligibility, scope, and final rank cap against current sources before hard-coding. Routine default is effective attribute cap `20`.

## Implementation

- `BW-1901`: Product/design brief and source verification for effect IDs, eligibility, rank cap, rune icon policy, and visual acceptance.
- `BW-1902`: Build schema v3 migration. Existing v1/v2 builds hydrate with `attributeBonusProfile: null` and empty effect preferences. Local-library schema can remain v2 unless envelope shape changes.
- `BW-1903`: Slot-free profile projection. First equipment edit snapshots displayed legacy bonuses into the compact profile. Primary-profession changes clear invalid profile entries; secondary-profession changes do not create controls.
- `BW-1904`: Shared effective-rank projection for equipment profile, legacy equipment fallback, assumed effects, stacking, caps, contributions, hover/focus explanation, and tooltip skill ranks.
- `BW-1905`: Focused attribute UI: inline rune segments, one headgear selector, blue effective ranks, health penalties, active-effect collapsed count, keyboard/focus states.
- `BW-1906`: Game file/template boundaries. Keep standard code import/export/share unchanged; extend replacement/omission messages for authored attribute bonuses and assumed effects.
- `BW-1907`: Tests, visual evidence, docs, and closeout.

## Files Summary

Primary files: `src/domain/build.ts`, `src/domain/effective-attribute-rank.ts`, `src/domain/equipment-attribute-rank.ts`, `src/domain/rune-effects.ts`, `src/app/composer-selectors.ts`, `src/app/editor-selectors.ts`, `src/app/persistence-schema.ts`, `src/app/components/FocusedAttributeEditor.tsx`, `src/app/template-import.ts`, `src/app/workspace-state.ts`.

Transfer/template surfaces: `src/app/build-set-transfer.ts`, `src/app/party-transfer.ts`, `src/app/share-url.ts`.

Catalog/assets: `src/app/catalogs.ts`, `data/generated/epic-10/runes.catalog.json`, rune icon manifest/cache additions, `compendium/decisions/0002-runtime-gww-icon-assets.md`.

## Definition of Done

- Old persisted builds, backups, build sets, and party transfers preserve new authored state after migration.
- New builds and ordinary game-code imports do not infer rune, headgear, or effect choices.
- Effective ranks are consistently used in attribute rows and skill tooltip calculations.
- Manual effect overrides survive unrelated edits and reload; reset removes the override.
- Removed/ineligible self buffs contribute nothing, but forced preferences apply again if eligible later.
- Browser evidence covers desktop, narrow viewport, keyboard focus, blue ranks, and collapsed effect count.
- Run `npm run verify` and `git diff --check`.

## Risks

- Compact profile cannot represent arbitrary five-slot armor layouts; preserve original `equipment` and document any omitted metadata.
- Source verification may correct effect IDs or eligibility before implementation.
- Effective-rank consumers may diverge if selectors are not centralized.

## Security

- Keep strict JSON validation, bounded arrays, safe integers, and dangerous-key rejection.
- Runtime must use local rune icon assets only, never remote Guild Wars Wiki URLs.
- Do not add eval, remote fetches, or unbounded imported metadata paths.

## Dependencies

Backlog epic should depend on completed `EPIC-03`, `EPIC-04`, `EPIC-10`, `EPIC-13`, `EPIC-15`, and `EPIC-18`.

Ticket order: `BW-1901` → `BW-1902` → `BW-1903`/`BW-1904` → `BW-1905`/`BW-1906` → `BW-1907`.

## Open Questions

None requiring human decision. Source verification is an implementation gate; if current sources contradict the settled effect list, record the correction in the epic/ticket notes before coding.