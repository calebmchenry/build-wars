---
id: SPRINT-014
title: Equipment Shell Model
status: planned
source_target: BACKLOG
source_epic: EPIC-13
source_epic_path: work/tickets/13-armor-and-equipment/EPIC.md
tickets:
  - BW-1301
  - BW-1302
  - BW-1303
  - BW-1304
  - BW-1305
created: 2026-09-03
---

# Sprint 014: Equipment Shell Model

## Overview

This sprint replaces the placeholder `src/domain/equipment.ts` model with a real semantic equipment shell for one single-character `Build`. The new shell must attach EPIC-10/11/12 catalog IDs, preserve empty, partial, and unresolved authored states, and fit the existing framework-neutral `src/domain` contract and EPIC-06 validation result model.

The sprint is domain, validation, and durability work. It does not add equipment editor UI, runtime equipment catalog wiring in leaf components, raw equipment template import/export, armor or weapon skin catalogs, dye/color state, remote media, combat simulation, full stat totals, or share-url equipment payloads. `src/template-compatibility` remains the raw equipment-template boundary.

The sprint must also close the current compatibility gap where app persistence rejects or strips non-null equipment. Blank builds should still default to `equipment: null`, old saved data must continue to load, share URLs must remain skill-template-only, and final closeout must pass `npm run verify`.

## Use Cases

1. EPIC-14 can edit one authored equipment loadout without exposing raw equipment-template IDs, skin IDs, or color IDs.
2. A build can preserve empty, partial, and unresolved armor and weapon selections without validation crashes or silent coercion.
3. Headgear and equipped attribute runes can hand off deterministic additive adjustments to `calculateEffectiveAttributeRank` without forcing full stat aggregation into this sprint.
4. Weapon sets can represent main-hand, off-hand, two-handed, and empty occupancy with enough structure to explain conflicts and incompatible modifiers later.
5. `validateBuild` can emit equipment issues with the same deterministic severity, ordering, path, location, and related-entity semantics already used for professions, attributes, and skills.
6. Local library and backup/restore flows can round-trip valid semantic equipment even before the UI exposes equipment editing controls.
7. EPIC-17 can keep owning raw equipment-template fidelity while EPIC-13 owns the semantic authored shell.
8. EPIC-20 and EPIC-21 receive a clean handoff boundary for search/tooltips and deeper stat/effect aggregation.

## Architecture

| Area | Owns | Must Not Own |
| --- | --- | --- |
| `src/domain/equipment.ts` | Semantic loadout contracts, canonical armor/weapon-set ordering, empty constructors, unresolved authored references, and narrow handoff helpers. | React, DOM/browser APIs, generated catalog JSON, raw template IDs, skins, dyes, colors, manifests, QA reports, snapshots, or wiki APIs. |
| `src/domain/validation*` and new equipment rule module | Structural and catalog-backed equipment validation using caller-supplied runtime views and the existing `ValidationIssue` contract. | UI state, persistence policy, runtime catalog imports, or a new result shape. |
| `src/app/persistence-schema.ts` and related tests | Durable round-trip of semantic `Build.equipment` with backward-compatible handling for old `null` records. | Equipment editor UI, equipment share URLs, or app-owned catalog truth. |
| `src/template-compatibility` | Raw equipment-template decode/export and exact-source replay only. | Semantic equipment resolution or durability of authored equipment shells. |
| Docs and work records | Explicit boundary and downstream handoff notes for EPIC-14, EPIC-17, EPIC-20, and EPIC-21. | New implementation scope beyond the sprint boundary. |

### Core Model

```text
EquipmentLoadout
  armor: readonly ArmorPiece[]
  weaponSets: readonly WeaponSet[]

EquipmentReference<Id>
  known { id: Id }
  unresolved { reason, reference: string | null, label: string | null }

ArmorPiece
  slot: ArmorSlot
  armorRating: number | null
  rune: EquipmentReference<RuneId> | null
  insignia: EquipmentReference<InsigniaId> | null
  headgear: HeadgearBonus | null

HeadgearBonus
  known { attributeId: AttributeId, amount: 1 }
  unresolved { label: string | null, amount: 1 }

WeaponSet
  slot: WeaponSetSlot
  mainHand: EquippedWeapon | null
  offHand: EquippedWeapon | null

EquippedWeapon
  selection: EquipmentReference<WeaponId>
  modifiers: readonly EquipmentReference<WeaponModifierId>[]
  requirementAttributeId: AttributeId | null
```

`EquipmentLoadout` should become the primary authored type. Keep `type EquipmentTemplate = EquipmentLoadout` as a compatibility alias for this sprint so `Build`, existing exports, and older tests can migrate without a wide rename blast radius. `ArmorPieceId` can remain exported but should not be required by the semantic shell because EPIC-13 is not introducing an armor catalog.

Constructors must always emit canonical five-slot armor and four-slot weapon-set arrays using exported order constants. Partial editor states are represented inside those slots with `null` and `unresolved` selections, not by sparse arrays or missing container members. Validation must still detect malformed external arrays because persisted or test-authored data may not come from constructors.

### Validation Boundary

Add a pure `validateEquipmentLoadout` path and integrate it into `validateBuild` through a new equipment rule module. `BuildValidationInput` should grow an optional equipment-catalog bag for runes, insignias, weapon bases, and weapon modifiers; if those views are absent, structural checks still run, while catalog-backed legality checks are skipped instead of inventing noisy “catalog missing” failures for current editor flows.

`ValidationIssueCode` should reserve equipment-specific codes up front: `equipment.armor-duplicate-slot`, `equipment.armor-missing-slot`, `equipment.rune-unresolved`, `equipment.rune-ineligible`, `equipment.insignia-unresolved`, `equipment.insignia-ineligible`, `equipment.headgear-unresolved`, `equipment.weapon-unresolved`, `equipment.weapon-conflict`, `equipment.weapon-mod-incompatible`, and `equipment.requirement-unresolved`. `ValidationLocation` should add `armor-slot` and `weapon-set` variants, and `ValidationEntityKind` should add `armor-slot`, `weapon-set`, `weapon`, and `weapon-modifier`. `validatedAgainst` can stay unchanged in this sprint unless optional equipment version fields prove trivial and non-breaking.

### Handoff Rules

Headgear and rune-derived attribute adjustments remain caller-owned aggregation. EPIC-13 should provide narrow helpers that enumerate equipped rune selections and expose a single headgear adjustment shape so callers can compose `summarizeAttributeRuneEffects` and `calculateEffectiveAttributeRank` without forcing full health, energy, armor, or conditional-effect math into this sprint.

Weapon modifier legality should continue to defer structural base/mod compatibility to `explainWeaponModCompatibility`. The equipment shell owns selection state and set occupancy; EPIC-12 continues to own catalog facts and single-pair compatibility logic.

## Implementation

1. **Phase 0: Baseline and decision freeze.** Lock the public naming choice (`EquipmentLoadout` plus `EquipmentTemplate` alias), the unresolved-reference shape, the exact equipment issue-code set, and the persistence compatibility policy before refactoring. Add or tighten baseline regressions for `equipment: null`, current validation ordering, and share-url exclusion so later phases surface spillover immediately. Verify with `npm run typecheck` and targeted Vitest runs for contracts, persistence, and share URLs.

2. **Phase 1: BW-1301 shell contracts.** Replace the current placeholder contract in `src/domain/equipment.ts` with canonical slot constants, empty constructors, the shared `EquipmentReference` union, `EquipmentLoadout`, and narrow query/enumeration helpers. Update `src/domain/build.ts` and `src/domain/index.ts` to expose the new shape while preserving nullable `Build.equipment`. Verify with `npm run typecheck` and focused tests for plain JSON compatibility, constructor defaults, canonical ordering, and empty/partial loadouts.

3. **Phase 2: BW-1302 armor and headgear semantics.** Add armor-piece semantics for rune and insignia attachments, headgear `+1` attribute state, and only the minimum armor-rating field needed for later display or validation. Do not add profession armor tables unless a phase gate proves they are required. Verify with focused Vitest coverage for legal attachments, duplicate or missing slots, headgear known/unresolved states, and the rune/headgear handoff helpers.

4. **Phase 3: BW-1303 weapon-set shell.** Add main-hand/off-hand/two-handed occupancy helpers, unresolved weapon and modifier selections, modifier lists, and minimal requirement-attribute handoff state. Use EPIC-12 compatibility helpers rather than re-encoding slot-family rules in the authored shell. Verify with focused Vitest coverage for empty sets, partial sets, two-handed/off-hand conflicts, duplicate occupied modifier slots, incompatible modifiers, and unresolved selections.

5. **Phase 4: BW-1304 validation and fixtures.** Extend `src/domain/validation.ts`, `src/domain/validation-context.ts`, and `src/domain/rule-engine.ts` with equipment-aware contexts and a new `src/domain/rules/equipment.ts`. Add synthetic fixtures under `test/fixtures/rule-engine/` and new domain tests that prove deterministic issue ordering, error vs warning choices, unresolved handling, and zero regressions for existing `equipment: null` builds. Verify with `npm run typecheck` and targeted Vitest runs for new equipment validation tests plus existing `validation-context` and rule-engine regressions.

6. **Phase 5: Durability, docs, and closeout.** Update persistence and backup/restore validators so semantic equipment round-trips locally, while blank-build defaults and share-url exclusion remain unchanged. Finish README and compendium updates, close ticket traceability, sync the sprint ledger and result manifest, and run full repository validation. Verify with focused app tests first, then `npm run verify` as the closeout gate.

## Files Summary

| Area | Files | Planned work |
| --- | --- | --- |
| Domain shell | `src/domain/equipment.ts`, `src/domain/build.ts`, `src/domain/index.ts` | Replace placeholder types, add canonical slot constants and constructors, expose the new authored shell, and keep compatibility exports stable. |
| Validation | `src/domain/validation.ts`, `src/domain/validation-context.ts`, `src/domain/rule-engine.ts`, new `src/domain/rules/equipment.ts` | Add equipment issue codes, entity/location variants, optional equipment catalog views, and deterministic equipment rules. |
| App durability | `src/app/persistence-schema.ts`, `src/app/persistence-schema.test.ts`, and `src/app/backup-restore*.ts` if snapshot validation is duplicated | Preserve valid semantic equipment in local snapshots and backups while remaining backward-compatible with existing `equipment: null` data. |
| Tests and fixtures | New `test/domain/equipment.test.ts`, new `test/domain/equipment-validation.test.ts`, `test/domain/contracts.test.ts`, `test/domain/validation-context.test.ts`, `test/fixtures/rule-engine/builds.ts`, new `test/fixtures/rule-engine/equipment.ts` | Cover constructors, unresolved references, slot invariants, headgear, weapon occupancy, validation ordering, and persistence-safe shapes. |
| Docs and records | `README.md`, `compendium/game-rule-engine.md`, `compendium/template-compatibility.md`, `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`, `work/tickets/13-armor-and-equipment/*.md`, `work/sprints/ledger.tsv`, result manifest | Make the semantic boundary explicit, record durability/share behavior, and capture downstream handoffs and closeout evidence. |

## Definition of Done

- `EquipmentLoadout` exists as the primary authored shell with a compatibility alias, canonical slot order constants, empty constructors, and unresolved selection support.
- Armor pieces model rune, insignia, and headgear state; weapon sets model hand occupancy, modifiers, and requirement handoff state; no raw template IDs, skin IDs, dye/color IDs, or generated catalog payloads appear in authored equipment.
- `validateBuild` emits deterministic equipment issues without introducing a new result shape and without regressing existing `equipment: null` editor flows.
- Local library and backup/restore can round-trip valid semantic equipment; blank builds still default to `equipment: null`; share URLs still exclude equipment.
- Focused tests cover empty equipment, partial armor, duplicate slots, missing slots, invalid rune/insignia restrictions, headgear known/unresolved states, two-handed conflicts, incompatible modifiers, missing requirements, unresolved IDs, and legacy null-equipment records.
- README, compendium notes, ticket statuses, sprint ledger, and result manifest all describe the same boundary and downstream ownership.
- `npm run verify` passes.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Semantic shell naming collides with raw `EquipmentTemplateDocument` terminology. | Medium | Introduce `EquipmentLoadout` now, keep a compatibility alias for one sprint, and update docs immediately. |
| Persistence changes break old saved data or backup recovery paths. | High | Keep old `null` records valid, add regression coverage for current fixtures, and preserve write-block behavior for corrupt payloads. |
| Equipment validation creates noise before the UI supplies equipment catalogs. | Medium | Make catalog-backed checks opt-in and keep structural validation independent from catalog availability. |
| Scope expands into full stat aggregation, UI, or raw template workflows. | High | Keep headgear/rune aggregation as narrow handoff helpers, keep `src/template-compatibility` unchanged, and forbid `src/app/catalogs.ts` expansion in this sprint. |

## Security

- No new network access, runtime source fetching, or remote media handling should be introduced.
- The semantic shell must reject cosmetic and raw-template-only fields rather than quietly carrying them through authored build state.
- Persistence validators must keep dangerous-key, safe-integer, bounded-array, and plain-object protections for any newly durable equipment data.
- Share URLs must remain skill-template-only so equipment state is not serialized into fragments or copied into uncontrolled external contexts.

## Dependencies

1. `BW-1301` blocks every other ticket. `BW-1302` and `BW-1303` can execute in parallel after the shell contract lands. `BW-1304` waits for both shapes to stabilize. `BW-1305` closes only after validation, durability, docs, and verification are complete.
2. Internal technical dependencies are EPIC-06 validation contracts, EPIC-03 profession and attribute IDs, EPIC-10 rune IDs and `summarizeAttributeRuneEffects`, EPIC-11 insignia IDs and `resolveInsigniaEffectsForArmorSlot`, and EPIC-12 weapon/mod IDs and `explainWeaponModCompatibility`.
3. Downstream ownership stays explicit: EPIC-14 consumes this shell for UI, EPIC-17 owns raw equipment-template workflows, EPIC-20 owns search and richer tooltips, and EPIC-21 owns full stat/effect aggregation.

## Open Questions

1. Can local-library schema version `1` safely absorb semantic equipment without a migration? Default: yes; only bump if phase-gate evidence proves the validator cannot remain backward-compatible.
2. Should `ValidationResult.validatedAgainst` grow optional equipment catalog versions now? Default: no; defer unless the addition is trivial, non-breaking, and fully regression-tested.
3. Is any exact profession/base-armor table required for EPIC-13 acceptance? Default: no; keep `armorRating` optional and defer source-backed totals to a later epic unless a concrete validation case proves otherwise.
4. Do any EPIC-12 weapon records require authored requirement-rank overrides, or is `requirementAttributeId` alone sufficient? Default: attribute-only override until a real catalog case disproves it.