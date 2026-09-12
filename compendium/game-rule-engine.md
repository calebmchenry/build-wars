# Game Rule Engine

`src/domain` now exposes two pure APIs for authored `Build` data:

- `validateBuild(input)` returns a deterministic `ValidationResult`.
- `calculateEffectiveAttributeRank(input)` returns either a resolved rank breakdown or typed
  unresolved reasons.
- `calculateSkillAttributeEffects(input)` projects inherent Expertise, Mysticism, and Fast
  Casting changes to skill energy, activation, and recharge. See
  [formulas, presentation, and scope](primary-attribute-skill-effects.md).
- `summarizeAttributeRuneEffects(catalog, equippedEntries)` converts caller-owned equipped rune
  instances into highest-per-attribute rank adjustments plus independently counted attribute-rune
  health penalties.
- `resolveInsigniaEffectsForArmorSlot(record, slot)` projects one insignia record onto one armor
  slot with tagged value/not-applicable/unresolved outcomes.
- `collectEquipmentAttributeRankAdjustments(input)` derives target-scoped semantic equipment rank
  adjustments for valid headgear and attribute-rune selections.
- `analyzeWeaponSet(input)` projects authored weapon occupancy, modifier compatibility, duplicate
  occupied slots, and weapon requirement state.
- `createTitleRankCatalog(input)` and `resolveTitleRanksForSkill(input)` derive supported
  title-rank defaults and authored override projections from skill progression metadata.

Production rule-engine modules do not import React, DOM/browser APIs, browser storage, network
clients, app modules, generated catalog JSON, manifests, QA reports, source snapshots, Python data
tooling, wiki APIs, or `src/template-compatibility`.

## Validation Results

`ValidationIssue` is the structural contract for callers. Each issue includes severity, code,
plain deterministic message, segment-array path, typed location, related entities, and a
domain-owned source rule ID.

Severity semantics:

- `error`: a catalog-proven contradiction.
- `warning`: incomplete editor state, unresolved or stale IDs, unsupported or catalog-gap facts,
  title-rank metadata gaps, narrow allegiance uncertainty, unsupported options, or non-exhaustive
  budget state.
- `info`: advisory facts only.

`ValidationResult.valid` means no emitted error issues. Export and publish policy must also inspect
`complete`, `resolved`, and `exhaustive`:

- `complete` is false for incomplete editor-state issues or truncation.
- `resolved` is false for unresolved, unsupported, catalog-gap, deferred, or truncation issues.
- `exhaustive` is false when traversal or issue caps are hit.
- `counts`, `validatedAgainst`, and `truncation` are machine-readable plain data.

Issue ordering is centralized by rule order, numeric-aware path order, location key, issue code,
related-entity key, and message. It does not depend on catalog array order, object insertion order,
locale, wall clock, filesystem order, or caller overrides.

## Context And Defaults

Every `validateBuild` call creates a fresh internal context. It indexes professions, attributes,
skills, split groups, progression series, title-rank definitions, and optional equipment catalog
views by real catalog IDs or canonical title keys only. Duplicate catalog IDs and split-group IDs
are reported and excluded from resolved lookups so validation cannot depend on first-record-wins
behavior.

Unknown imported or stale authored IDs are preserved and reported as unresolved references. The
engine does not coerce, delete, guess, compact, replace split variants, or mutate caller objects.

The default profile is editing:

- Missing primary profession is an incomplete warning.
- Missing secondary profession is allowed unless a selected skill requires it or complete-profile
  validation is requested.
- A secondary profession without a primary and identical primary/secondary IDs are errors.
- Null skill slots are allowed, with one aggregate incomplete-bar warning.

The app supplies an explicit level-20 maximum attribute budget for both PvE and PvP editing. The
domain rule engine still accepts unresolved budget policies for lower-level callers that do not
provide one.

Duplicate attribute rows report the second and later rows. Rank-cost and budget calculations use
the first row for a resolved attribute ID and avoid cascade totals from later duplicates.

## Skill Rules

Skill-bar composition validates the runtime eight-slot shape, unresolved or dispositioned IDs,
duplicate resolved player skills, one elite skill, the default three PvE-only skill limit,
unsupported records, and non-player records.

Skill eligibility validates selected profession ownership, explicit professionless
classifications, skill attribute joins against the profession/attribute slice, mode availability,
split-group integrity, mode-specific split counterpart availability, title-rank dependencies, and
selected allegiance-ranked skills. `modeAvailability` is canonical for restrictions; `pveOnly`,
`pvpOnly`, and split metadata are consistency evidence.

Split validation never substitutes a counterpart skill. It validates the authored selected ID and
attaches split-group or counterpart evidence as related entities.

Resolved title-rank dependencies emit no generic deferral warning. Empty title state uses the
progression series' declared maximum rank. Authored overrides are canonical sparse `{ key, rank }`
entries and are validated for bounded count, safe integers, exact editable rows, duplicates, stale
keys, and current catalog compatibility.

Malformed, missing, unsupported, row-incomplete, and domain-conflicting title metadata emits located
title warnings. The promoted Sunspear aliases intentionally remain one canonical control with
visible domain-conflict diagnostics: reset uses per-series implicit maximums, while explicit edits
are limited to common exact rows.

Allegiance-ranked skills resolve rank scaling through the same title-rank path and emit one narrow
warning for side/exclusivity uncertainty. The rule engine does not infer Kurzick/Luxon ownership or
provide an account-side selector.

## Effective Attribute Rank

`calculateEffectiveAttributeRank` resolves a unique authored allocation as the base rank, treats a
known unallocated attribute as rank zero, applies an optional non-negative `baseRankOverride`, and
then applies caller-consolidated additive adjustments in canonical order.

The calculator returns authored base, base source, override, applied adjustments, contributions,
and final rank when resolved. Duplicate allocations, malformed base ranks, unknown attributes,
invalid overrides, invalid adjustments, unsafe integer overflow, and negative final ranks return a
typed unresolved result instead of throwing or clamping.

Semantic equipment now derives valid headgear and attribute-rune rank adjustments through
`collectEquipmentAttributeRankAdjustments`. Title-rank skill scaling is handled separately by
`resolveTitleRanksForSkill`. Temporary-effect, manual adjustment, broad weapon effects, and complete
stacking/aggregation policy remain caller-owned or deferred.

`summarizeAttributeRuneEffects` is the narrow EPIC-10 bridge for attribute runes only. It accepts
runtime rune catalog data plus caller-provided equipped instance keys, reports unknown IDs,
duplicate source keys, malformed records, note-only/unknown effects, and non-attribute deferrals,
then returns `EffectiveAttributeRankAdjustment`-compatible rune adjustments. It does not choose armor
slots, validate armor legality, apply headgear bonuses, aggregate Vigor/Vitae/Attunement/Absorption,
calculate full health or energy totals, read generated files, or mutate caller data.

`resolveInsigniaEffectsForArmorSlot` is the narrow EPIC-11 bridge for per-slot insignia facts only.
It accepts one runtime insignia record plus one `ArmorSlot`, returns resolved slot outcomes and
typed unresolved reasons, and preserves note-only or unknown effects. It does not choose armor,
validate armor/profession/mode legality, evaluate conditions, aggregate multiple armor pieces,
compose rune/title/weapon effects, apply hit-location probabilities, calculate totals, read
generated files, or mutate caller data.

## Equipment Rules

`validateBuild` skips `equipment: null` and accepts a canonical empty `EquipmentLoadout` without
catalog views. Non-null equipment validation is additive and appears after skill rules. It covers
loadout schema version, armor slot topology, rune/insignia/headgear selections, optional catalog
availability, duplicate equipment catalog IDs, catalog-set mismatch, weapon-set topology, hand
placement, two-handed occupancy, modifier compatibility, duplicate occupied modifier slots, and
weapon requirements.

Missing catalogs produce unresolved warnings only when selected equipment needs the missing facts.
Known unmet weapon requirements are advisory warnings, so `valid` remains true. Unresolved
equipment selections, unknown IDs, duplicate catalog IDs, catalog-set mismatch, unresolved
requirements, and traversal caps make `resolved` or `exhaustive` false according to the shared
result contract.

`RULE_ENGINE_VERSION` is `rule-engine:v3` because title-rank validation and the replacement title
issue-code set now change validation behavior.

## Party Validation Boundary

SPRINT-018 adds party validation in `src/app/party-validation.ts`, not in the domain rule engine.
That app layer materializes each occupied party slot, runs the existing selected-loadout validation
path independently, and adds deterministic structural party diagnostics for empty slots, stale or
duplicate references, duplicate slot IDs, invalid size state, incomplete or unresolved occupied
members, unknown mode, and mixed known PvE/PvP modes.

Party validation deliberately does not infer roles, evaluate hero legality, recommend composition,
score synergy, check meta quality, or add PvP format policy. `validateBuild`, existing game-rule
issue codes, and `RULE_ENGINE_VERSION` remain unchanged by party composition state.

## Deferred Scope

Title ownership, account-wide title profiles, allegiance side selectors, condition evaluation, full
rune/insignia composition, weapon effect math, modifier effect aggregation, hero legality, hero AI,
party composition advice, recommendation, guide, equipment/title share payloads, and export/publish
policy validation remain deferred. Later domains should emit the same issue/result contract.
