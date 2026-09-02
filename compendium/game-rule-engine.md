# Game Rule Engine

`src/domain` now exposes two pure APIs for authored `Build` data:

- `validateBuild(input)` returns a deterministic `ValidationResult`.
- `calculateEffectiveAttributeRank(input)` returns either a resolved rank breakdown or typed
  unresolved reasons.
- `summarizeAttributeRuneEffects(catalog, equippedEntries)` converts caller-owned equipped rune
  instances into highest-per-attribute rank adjustments plus independently counted attribute-rune
  health penalties.
- `resolveInsigniaEffectsForArmorSlot(record, slot)` projects one insignia record onto one armor
  slot with tagged value/not-applicable/unresolved outcomes.

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
  deferred title/allegiance rules, unsupported options, or non-exhaustive budget state.
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
skills, split groups, and progression series by real catalog IDs only. Duplicate catalog IDs and
split-group IDs are reported and excluded from resolved lookups so validation cannot depend on
first-record-wins behavior.

Unknown imported or stale authored IDs are preserved and reported as unresolved references. The
engine does not coerce, delete, guess, compact, replace split variants, or mutate caller objects.

The default profile is editing:

- Missing primary profession is an incomplete warning.
- Missing secondary profession is allowed unless a selected skill requires it or complete-profile
  validation is requested.
- A secondary profession without a primary and identical primary/secondary IDs are errors.
- Null skill slots are allowed, with one aggregate incomplete-bar warning.

Automatic attribute budget applies only to PvE builds and uses the EPIC-03 level-20 maximum
applicable quest budget. PvP and unknown modes require an explicit budget policy before overspend
can be judged.

Duplicate attribute rows report the second and later rows. Rank-cost and budget calculations use
the first row for a resolved attribute ID and avoid cascade totals from later duplicates.

## Skill Rules

Skill-bar composition validates the runtime eight-slot shape, unresolved or dispositioned IDs,
duplicate resolved player skills, one elite skill, the default three PvE-only skill limit,
unsupported records, and non-player records.

Skill eligibility validates selected profession ownership, explicit professionless
classifications, skill attribute joins against the profession/attribute slice, mode availability,
split-group integrity, and mode-specific split counterpart availability. `modeAvailability` is
canonical for restrictions; `pveOnly`, `pvpOnly`, and split metadata are consistency evidence.

Split validation never substitutes a counterpart skill. It validates the authored selected ID and
attaches split-group or counterpart evidence as related entities.

Title-rank and allegiance enforcement is deferred to EPIC-15. The current engine emits deferred
warnings only from explicit `classification.title` facts or title-rank progression dependencies.

## Effective Attribute Rank

`calculateEffectiveAttributeRank` resolves a unique authored allocation as the base rank, treats a
known unallocated attribute as rank zero, applies an optional non-negative `baseRankOverride`, and
then applies caller-consolidated additive adjustments in canonical order.

The calculator returns authored base, base source, override, applied adjustments, contributions,
and final rank when resolved. Duplicate allocations, malformed base ranks, unknown attributes,
invalid overrides, invalid adjustments, unsafe integer overflow, and negative final ranks return a
typed unresolved result instead of throwing or clamping.

Headgear, rune, weapon, title, temporary-effect, and manual adjustment semantics are not derived
from equipment or title catalogs in this sprint. Later epics own stacking policy and ownership
validation.

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

## Deferred Scope

Title ownership, title rank, allegiance side, equipment, armor legality, condition evaluation,
rune/insignia composition, weapon, modifier, hero, party, recommendation, guide, UI, storage, and
export/publish policy validation remain deferred. Later domains should add built-in rule modules
that emit the same issue/result contract.
