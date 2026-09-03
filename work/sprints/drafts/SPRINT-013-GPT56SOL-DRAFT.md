---
id: SPRINT-013
title: Weapons and Mods Catalog
status: planned
source_target: BACKLOG
source_epic: EPIC-12
source_epic_path: work/tickets/12-weapons-and-mods/EPIC.md
tickets:
  - BW-1201
  - BW-1202
  - BW-1203
  - BW-1204
  - BW-1205
  - BW-1206
  - BW-1207
created: 2026-09-02
---

# Sprint 013: Weapons and Mods Catalog

## Overview

This sprint turns `EPIC-12 Weapons and Mods` into two deterministic, runtime-eligible catalogs: one for weapon bases and one for weapon upgrades/modifiers. Together they cover practical PvP equipment-template weapon choices, requirements, damage facts, handedness, modifier slots, prefixes, suffixes, inscriptions, staff components, shield/offhand components, caster modifiers, structured effects, compatibility facts, and verified equipment-template crosswalks.

The sprint extends the existing source-policy and profile-driven ingestion architecture. It uses the promoted EPIC-03 professions/attributes catalog for requirement and effect joins, consumes EPIC-05 decoded equipment-template IDs as mapping inputs, and preserves the raw template document as the exact-source authority. It does not add an equipment editor, weapon-set state management, app catalog imports, persistence changes, full stat aggregation, combat simulation, acquisition data, economic data, or named-item/skin exhaustiveness.

The following decisions are fixed for execution unless Phase 1 records a source-shape amendment:

1. Promote separate artifacts:

   - `data/generated/epic-12/weapons.catalog.json`
   - `data/generated/epic-12/weapons.catalog.manifest.json`
   - `data/generated/epic-12/weapon-mods.catalog.json`
   - `data/generated/epic-12/weapon-mods.catalog.manifest.json`
   - `data/qa/epic-12/weapons.catalog.qa.json`
   - `data/qa/epic-12/weapon-mods.catalog.qa.json`

   A single ingestion profile and source plan produce both catalogs as one release set. Combining them requires a Phase 1 amendment that updates the schema, exact paths, QA boundaries, tickets, and documentation before implementation proceeds.

2. Weapon and modifier identities are schema-owned. Existing `WeaponId` and `WeaponModifierId` remain the public runtime IDs; `TemplateEquipmentItemId` and `TemplateEquipmentModifierId` are explicit crosswalk facts and never implicitly become catalog IDs. IDs are registry-backed, source-order independent, non-reused, and migration-reviewed across renames, splits, merges, removals, and variant changes.

3. A weapon record represents one selectable semantic base variant, not every named skin. Bow variants and caster requirement variants remain distinct where their damage, range, requirement, template mapping, or compatibility facts differ. Broad PvE skins and unique items are excluded or dispositioned unless needed for practical equipment-template coverage.

4. Weapon records own family, variant, handedness/equip role, mode facts, damage, requirement, allowed modifier slots, item-ID crosswalks, display metadata, and provenance. Modifier records separately own component family, occupied slot, applicability, structured effects, modifier-ID crosswalks, display metadata, and provenance.

5. The profile is `epic-12-weapons-and-mods`. Its default bounded source authority is `Equipment template format`, `Weapon`, `Weapon upgrade`, and `Inscription`, followed only by explicitly planned weapon-family, component-family, modifier-detail, mechanics, and metadata-only icon pages. Phase 1 must verify exact canonical titles and field authority. Category crawling, site search, arbitrary URLs, recursively following page links, community databases, and source-provided commands are excluded.

6. The profile uses one discover/review/fetch/replay lifecycle for both artifacts. The ingestion platform gains narrow ordered multi-artifact output support while retaining the existing primary-result behavior and byte output for EPIC-02, EPIC-03, EPIC-04, EPIC-10, and EPIC-11.

7. Both catalogs carry the same `catalogSetVersion`, source-set summary, authority-policy version, EPIC-03 dependency identity, and selected evidence identity. Each also has an independent semantic `catalogVersion`. Compatibility or release-set failure blocks both artifacts; the catalogs are not promoted independently.

8. Damage and requirement absence are tagged states, not overloaded `null` values. Known damage records contain bounded minimum, maximum, and type facts. Focuses and shields use explicit `not-applicable` damage states. Missing or conflicting facts use `unresolved` and participate in QA.

9. Modifier effects use closed tagged variants. Deterministic source-clear values are structured; source-clear chances can be represented as inert probability facts; conditions use inert controlled predicates. HCT, HSR, mastery, enchantment, stance, and other uncertain behavior remains `note-only`, `unknown`, or release-blocking according to consumer impact. No effect evaluator or arithmetic simulation is added.

10. Compatibility is declarative and pairwise. A narrow pure helper compares one weapon record with one modifier record and returns `compatible`, `incompatible`, or `indeterminate` with stable reason codes. It does not select equipment, mutate a weapon set, evaluate effects, check character attribute ranks, aggregate modifiers, calculate damage, or own editor state. Duplicate-slot and mutual-exclusion facts are modeled for EPIC-14 but active loadout validation remains downstream.

11. Template resolution is additive and non-mutating. Lookups distinguish known, ambiguous, dispositioned, and unknown raw item/modifier IDs. A framework-neutral equipment catalog-resolution view echoes every decoded slot, item ID, color ID, modifier ID, modifier order, and source fingerprint. It never rewrites the raw document or weakens `exportEquipmentTemplate` exact-source behavior.

12. Runtime JSON contains structured facts, compact provenance references, runtime-relevant dispositions, metadata-only media references, section digests, semantic versions, and dependency summaries. Source plans, snapshot-set manifests, raw snapshots, candidate inventories, review bodies, full QA findings, local paths, copied page bodies, and media bytes remain outside runtime imports.

13. `src/app/catalogs.ts` remains unchanged. Future runtime code may import these promoted catalogs only through that boundary, but this sprint does not wire them into the current editor.

14. Production promotion is required for completion. If reviewed live discovery, digest-confirmed fetch, a complete selected snapshot set, repeated fixed-clock offline replay, first-baseline review, or both release gates cannot be completed, fixture work may remain useful but BW-1206, BW-1207, EPIC-12, and SPRINT-013 remain incomplete or blocked. The non-interactive executor must not weaken gates or substitute synthetic output.

The interview is skipped under the non-interactive contract. The artifact split, shared release-set version, registry-backed IDs, compatibility boundary, and raw-template preservation rules resolve the material architecture choices needed for execution.

## Use Cases

1. **Populate weapon choices later**: EPIC-14 can enumerate practical axes, swords, hammers, bow variants, daggers, scythes, spears, wands, staves, focuses, shields, and reviewed additional PvP template bases without parsing source pages.

2. **Show weapon facts**: A future equipment surface can display handedness, equip role, damage range/type, requirement attribute/rank, mode availability, and allowed modifier slots from structured records.

3. **Offer compatible modifiers later**: EPIC-14 can filter prefix, suffix, inscription, staff-head, staff-wrapping, shield/offhand, wand, focus, and other verified modifier families using declarative compatibility facts.

4. **Explain incompatibility**: Domain consumers can explain family mismatch, unavailable slot, wrong component family, handedness conflict, variant restriction, requirement-attribute restriction, mode conflict, or unresolved applicability without UI-specific logic.

5. **Resolve known template IDs**: A decoded equipment-template item or modifier ID can map to a known catalog record through an explicit crosswalk.

6. **Preserve imperfect imports**: Unknown, ambiguous, unsupported, armor-owned, or otherwise dispositioned item/modifier IDs remain present in the decoded document and catalog-resolution view.

7. **Represent effects honestly**: Deterministic bonuses, penalties, requirements, attribute links, durations, resource changes, life-steal facts, and source-clear probabilities can be structured while uncertain HCT/HSR, mastery, conditional, or interaction behavior remains visibly deferred.

8. **Avoid false character totals**: Catalog consumers cannot mistake compatibility facts or inert effects for evaluated combat outcomes, satisfied requirements, stacking decisions, or DPS calculations.

9. **Audit and refresh both catalogs**: Maintainers can review one finite source-plan digest, fetch only confirmed pages and metadata, replay one complete snapshot set offline, and trace both promoted artifacts to the same evidence and dependency state.

10. **Preserve downstream ownership**: EPIC-13 owns armor shells, armor item IDs, dye semantics, and display metadata; EPIC-14 owns equipment authoring and legality; EPIC-17 carries equipment through party records; EPIC-20 owns search/tooltips; EPIC-21 owns condition evaluation and advanced analysis.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Domain contracts | Separate weapon and modifier catalogs, source-set/dependency summaries, registry summaries, dispositions, page identity, weapon facts, modifier applicability, structured effects, crosswalks, metadata-only media, lookups, and pairwise compatibility outcomes. | React, DOM/browser APIs, storage, network clients, generated manifest/QA imports, editor state, character attribute satisfaction, complete legality, combat simulation, DPS, or total-stat APIs. |
| Ingestion | One EPIC-12 profile, source-shape checkpoint, bounded discovery/fetch, source-plan confirmation, selected offline replay, extraction, semantic normalization, two-artifact assembly, QA, canonical writing, and exact-path promotion. | One-off scrapers, arbitrary endpoints, recursive crawling, browser automation, runtime source access, live network during default verification, or hand-authored production catalogs. |
| Weapon scope | Practical player-usable PvP template bases, weapon families and variants, handedness/equip role, damage, requirements, modifier slots, item crosswalks, and display metadata. | Named-skin exhaustiveness, unique-item exhaustiveness, acquisition/drop/vendor/collector facts, prices, build recommendations, or armor-shell data. |
| Modifier scope | Prefixes, suffixes, inscriptions, staff heads/wrappings, shield/offhand and caster components, applicability, effects, modifier crosswalks, and explicit unknown states. | Full effect simulation, automatic requirement satisfaction, build scoring, economic facts, guide prose, or silently inferred mechanics. |
| Template integration | Pure lookups and a non-mutating semantic resolution view over EPIC-05 decoded raw IDs. | Codec replacement, lossy canonicalization, automatic raw-ID replacement, armor/rune/insignia reinterpretation, team templates, or editor import workflow. |
| Runtime data | Structured facts, compact provenance, dispositions, dependency/source summaries, registry summaries, section digests, semantic versions, and metadata-only media. | Source plans, raw bodies, snapshot paths, full QA bodies, review evidence, candidate inventories, copied long prose, screenshots, thumbnails, or icon bytes. |
| Closeout | Documentation, ticket evidence/status, sprint and ledger state, ticket-burn manifests, and no-commit handoff. | Unrelated refactors, application UI changes, or an implementation commit. |

### Artifact And Release-Set Boundary

The two runtime artifacts are separate because their lifecycles and consumer responsibilities differ:

```text
weapons.catalog.json
  weapon identity
  family and variant
  handedness and equip role
  damage and requirement facts
  allowed modifier slots
  template item crosswalks
  weapon media/provenance

weapon-mods.catalog.json
  modifier identity
  component family and occupied slot
  weapon-family/variant applicability
  requirement and mode restrictions
  structured effects and deferred notes
  template modifier crosswalks
  modifier media/provenance
```

Both are generated from one profile and carry:

```text
catalogSet
  id: epic-12-weapons-and-mods
  version: semantic digest over both catalog projections
  artifactRole: weapons | weapon-mods
  counterpartCatalogVersion
  sourceSetDigest
  dependencyDigest
```

Each artifact also owns an independent `catalogVersion` and section digests. The individual version changes only when that artifact’s runtime semantics change. `catalogSet.version` changes when either artifact, shared compatibility vocabulary, source-set disposition, or EPIC-03 dependency semantics change.

The set version and individual versions exclude their own stored values, `generatedAt`, local paths, source-plan paths, snapshot paths, manifest paths, QA paths, retrieval-only timestamps, and review prose.

The ingestion profile must support an ordered artifact output specification without regressing single-artifact profiles. Existing result properties may continue to expose the first/primary output; EPIC-12 additionally exposes both artifact results in deterministic role order. CLI output and tests must make multiple outputs explicit.

### Field-Level Source Authority

Phase 1 must validate and record the exact canonical page titles and field precedence before freezing the schema.

| Field | Preferred Evidence | Conflict Outcome |
| --- | --- | --- |
| Candidate membership | Weapon-related item/modifier tables in `Equipment template format`, reconciled with `Weapon`, `Weapon upgrade`, and `Inscription` inventories | Every selected row receives one terminal disposition. Unaccounted PvP-template rows block source-plan approval. |
| Public identity | Schema-owned reviewed registry keyed by namespace, immutable source key, and variant key | Source title, row order, or template ID changes never silently change or reuse public IDs. |
| Template item IDs | Verified equipment-template rows plus corroborating weapon/detail facts | Duplicate active mapping, ambiguous scope, or unsupported selected PvP ID blocks or becomes an explicit disposition. |
| Template modifier IDs | Verified equipment-template rows plus corroborating component/detail facts | Duplicate active mapping, conflicting family, or unresolved selected PvP ID blocks or becomes an explicit disposition. |
| Name and canonical page | Verified canonical detail page identity and redirect chain | Missing, cyclic, wrong-namespace, disambiguated, or contradictory page resolution blocks acceptance. |
| Weapon family/variant | `Weapon` inventory plus verified family/detail pages | Bow/caster or other semantically material variants remain separate; ambiguous classification blocks or dispositions the candidate. |
| Handedness/equip role | Verified weapon mechanics and detail facts | Offhand, one-handed, and two-handed conflicts block compatibility claims. |
| Damage range/type | Verified detail or approved bounded table facts | Missing damage is `not-applicable` only for confirmed non-damaging offhands; other absence is unresolved. |
| Requirement attribute/rank | Verified detail facts joined to promoted EPIC-03 attributes | Unknown labels remain unresolved; invented joins or UI-label matching are prohibited. |
| Modifier slot/family | `Weapon upgrade`, `Inscription`, approved component inventories, and verified detail facts | Prefix/suffix/inscription placement is kept separate from component family; contradictions block compatibility. |
| Modifier applicability | Verified component-family mechanics and detail restrictions | Silence is not universal applicability. Partial evidence produces `indeterminate` compatibility or blocks core PvP coverage. |
| Effects and conditions | Verified detail facts and explicitly planned mechanics pages | Only source-clear operands become structured. Unsupported prose becomes reviewed note-only/unknown data. |
| Icon metadata | Verified image candidate plus MediaWiki `imageinfo` | Missing optional icons may be reviewed warnings; unsafe or policy-unclear media blocks publication of that media record. |
| Display text | Structured facts and Build Wars-authored reviewed short text | Contributor prose and unreviewed publisher text do not enter runtime description fields. |

Admitting another source family, adding seed pages, increasing caps, changing registry policy, changing the artifact split, widening the effect language, or promoting without selected live/offline evidence requires a recorded sprint amendment.

### Identity And Crosswalk Policy

One namespace-aware registry records weapon and modifier identity entries. Each entry includes:

```text
kind: weapon | weapon-modifier
catalogId
sourceKey
variantKey
canonicalPageId
status: active | tombstone | superseded
supersededBy
firstPromotedVersion
notes
```

The registry enforces:

- separate numeric namespaces for `WeaponId` and `WeaponModifierId`;
- immutable public IDs after first promotion;
- deterministic lookup by `kind + sourceKey + variantKey`;
- no assignment from array order, alphabetical order, request order, or template ID;
- no reuse of tombstoned IDs;
- explicit rename, redirect, split, merge, and supersession review;
- collision checks across active and historical entries;
- registry digest inclusion in source plans, manifests, QA, and catalog summaries.

Crosswalks are independent facts:

```text
WeaponTemplateItemCrosswalk
  templateItemId
  status: active | historical | unsupported | ambiguous
  mode: pve | pvp | both | unknown
  sourceVariantKey
  provenance

WeaponTemplateModifierCrosswalk
  templateModifierId
  status: active | historical | unsupported | ambiguous
  mode: pve | pvp | both | unknown
  slotKind
  provenance
```

One active template item ID may resolve to at most one accepted weapon record. One active template modifier ID may resolve to at most one accepted modifier record. One semantic record may have multiple reviewed crosswalks for mode or historical variants.

All planned player-usable PvP template rows must map uniquely or have an explicit terminal disposition. Broader PvE rows may be deferred without blocking when their exclusion is recorded and does not undermine the declared v1 coverage.

### Runtime Contracts

The framework-neutral contracts extend `src/domain/catalog.ts` and are exported through `src/domain/index.ts`.

```text
WeaponCatalog
  schemaVersion
  catalogVersion
  catalogSet
  sectionDigests
  generatedAt
  generator
  profile
  dependencyDigests
  sourceSet
  identityRegistry
  dispositions
  weapons
  remoteMedia

WeaponModifierCatalog
  schemaVersion
  catalogVersion
  catalogSet
  sectionDigests
  generatedAt
  generator
  profile
  dependencyDigests
  sourceSet
  identityRegistry
  dispositions
  modifiers
  remoteMedia
```

A weapon record contains at minimum:

```text
CatalogWeaponRecord
  id: WeaponId
  sourceKey
  variantKey
  name
  normalizedName
  wikiUrl
  pageIdentity
  family
  familyVariant
  handedness
  equipRoles
  modeAvailability
  damage
  requirement
  allowedModifierSlots
  templateItems
  displayState
  iconId
  provenance
```

Required tagged weapon facts:

- `WeaponDamageFact`:

  - `known` with bounded minimum, maximum, damage type, mode, and provenance;
  - `not-applicable` with a reason;
  - `unresolved` with a stable reason code and provenance.

- `WeaponRequirementFact`:

  - `required` with `AttributeId`, source label, rank, mode, and provenance;
  - `none` with source-backed reason;
  - `unresolved` with preserved normalized label, reason code, and provenance.

- `WeaponModifierSlotRule`:

  - normalized slot kind;
  - accepted component families;
  - maximum count, normally one;
  - mode and variant restrictions where verified;
  - provenance.

The minimum closed weapon family vocabulary is `axe`, `sword`, `hammer`, `bow`, `dagger`, `scythe`, `spear`, `wand`, `staff`, `focus`, `shield`, and reviewed `other`. Bow and caster variants remain explicit subtypes rather than new unreviewed family strings.

A modifier record contains at minimum:

```text
CatalogWeaponModifierRecord
  id: WeaponModifierId
  sourceKey
  variantKey
  name
  normalizedName
  wikiUrl
  pageIdentity
  family
  slotKind
  modeAvailability
  applicability
  effects
  effectCompleteness
  mutualExclusionGroupKeys
  templateModifiers
  displayState
  iconId
  provenance
```

`WeaponModifierApplicability` records inclusion or exclusion by weapon family, reviewed family variant, handedness/equip role, requirement attribute, and mode. It has `known`, `partial`, or `unknown` completeness. It does not assert character eligibility or that an attribute requirement is met.

### Effect Semantics

The source census freezes the exact v1 effect vocabulary. The minimum supported variants are:

| Effect | V1 Representation |
| --- | --- |
| Stat delta | Typed target such as damage, health, energy, armor, health regeneration, energy regeneration, attribute rank, or condition duration; amount, unit, sign, scope, and condition remain explicit. |
| Life steal | Source-clear amount and trigger facts, without damage rotation or healing simulation. |
| Requirement adjustment | Explicit affected requirement/attribute and amount only when source evidence is unambiguous. |
| Triggered chance | Inert chance percentage, event kind, target, and source-clear magnitude for HCT, HSR, armor penetration, adrenaline, or mastery-style facts. It is not converted to expected value. |
| Conditional effect | Structured effect plus a closed inert condition such as health threshold, enchanted state, stance state, damage type, or requirement attribute when evidence is exact. |
| Note-only | Stable note code and reviewed short Build Wars-authored text; no arithmetic. |
| Unknown | Preserved source-field identity and reason code; no arithmetic or guessed behavior. |

Each structured effect carries mode applicability, provenance, and a stable effect ID. Numeric values must be finite and within reviewed bounds. Percentages, pips, ranks, damage, health, energy, armor, and duration are distinct units.

Conditions are data only. They contain a closed predicate, comparator, bounded operands, optional EPIC-03 attribute reference, and provenance. They cannot contain executable expressions, source HTML, template code, JavaScript, Lua, or arbitrary evaluation strings.

A record may be accepted with `mixed`, `note-only`, or `unknown` effect completeness when its identity and compatibility remain useful and the uncertainty is explicitly reviewed. A missing source-clear compatibility fact for selected PvP coverage is not downgraded to an effect warning.

### Compatibility Boundary

Add a pure helper such as:

```text
explainWeaponModifierCompatibility(weapon, modifier)
  -> compatible
  -> incompatible with stable reason codes
  -> indeterminate with stable unresolved reason codes
```

The helper checks only catalog facts:

- the weapon exposes the modifier’s occupied slot;
- the slot accepts the modifier’s component family;
- weapon-family and reviewed variant restrictions match;
- handedness/equip-role restrictions match;
- requirement-attribute restrictions match where applicable;
- mode facts do not prove a conflict;
- applicability facts are sufficiently complete.

Stable reason codes cover at least:

- `slot-not-supported`
- `component-family-not-supported`
- `weapon-family-mismatch`
- `weapon-variant-mismatch`
- `handedness-conflict`
- `equip-role-conflict`
- `requirement-attribute-mismatch`
- `mode-conflict`
- `applicability-unresolved`

The helper does not:

- mutate or construct `Weapon`, `WeaponSet`, or editor state;
- decide which modifier should replace another;
- evaluate effects or conditions;
- test a character’s current attribute rank;
- combine multiple modifier effects;
- enforce active loadout duplicate-slot or exclusion groups;
- calculate weapon damage, DPS, energy, health, armor, HCT, or HSR outcomes.

Slot cardinality and mutual-exclusion facts remain available for EPIC-14’s loadout validator.

### Template Lookup And Resolution Boundary

`src/domain/catalog-lookup.ts` gains collision-safe lookups for:

- weapon catalog ID;
- modifier catalog ID;
- normalized weapon name;
- normalized modifier name;
- `TemplateEquipmentItemId`;
- `TemplateEquipmentModifierId`.

Template-ID lookup outcomes are:

```text
known
ambiguous
dispositioned
unknown
```

Every outcome retains the queried branded raw ID. Ambiguous results return all deterministic candidates without selecting one. Dispositioned results retain the catalog’s reviewed reason. Unknown results do not synthesize records.

Add `src/template-compatibility/equipment-catalog-resolution.ts` as an additive adapter over `EquipmentTemplateDocument`. It accepts caller-supplied catalogs and returns an immutable view containing:

- both catalog versions and the shared catalog-set version;
- the original source fingerprint;
- each raw slot ID;
- each raw item ID and weapon lookup outcome;
- each raw color ID unchanged;
- every raw modifier ID in source order with its lookup outcome.

The resolver never edits the document, guesses armor/dye semantics, removes unsupported IDs, changes modifier order, or affects export eligibility. Tests must prove that resolving and then exporting an unchanged document still uses the original exact-source code.

### Data Flow

```text
promoted EPIC-03 catalog + manifest + passing QA
                           |
bounded EPIC-12 source-shape checkpoint
                           |
field authority + identity + artifact-set approval
                           |
registry-bound source-plan discovery
                           |
reviewed source-set digest confirmation
                           |
bounded detail/icon-metadata fetch
                           |
complete EPIC-12 SourceSnapshotSetManifest
                           |
selected offline replay with no network
                           |
base extraction + modifier extraction + EPIC-03 joins
                           |
semantic effects + applicability + crosswalk normalization
                           |
weapons semantic projection ---- weapon-mods semantic projection
                \                 /
                 shared catalog-set version
                /                 \
weapons catalog/manifest/QA ---- weapon-mods catalog/manifest/QA
                           |
first-baseline and release-set review
                           |
exact-path promotion of all six files
```

### Source Protocol And Retention

Initial limits are:

- four seed authority pages;
- 240 total article pages;
- 220 detail titles;
- 240 media titles;
- 112 requests;
- three retries;
- ten continuation pages;
- 5 MiB per response;
- 750 KiB parser input;
- 30 MiB aggregate source payload;
- 3 MiB weapons catalog;
- 6 MiB weapon-mods catalog;
- 2 MiB per QA report.

Phase 1 may tighten these limits. Raising a limit requires an amendment with the observed source counts, expected output growth, and review rationale.

`discover` fetches only approved seed pages, verifies the promoted EPIC-03 dependency, reconciles weapon and modifier candidate inventories, validates both identity registries, writes an ignored source plan, prints a bounded summary, and stops.

The source plan includes profile/version, authority pages, caps, dependency identity, registry digest, candidate counts by weapon/modifier family, selected PvP coverage, planned detail pages, media-candidate policy, dispositions, blocking findings, and both `sourceSetDigest` and `sourcePlanDigest`.

`fetch` requires:

- `--allow-live-network`;
- `--profile epic-12-weapons-and-mods`;
- exact `--source-plan`;
- exact `--confirm-source-set-digest`;
- unchanged dependency and registry digests;
- source-plan validation and source-drift recheck.

It fetches only planned detail pages and bounded metadata-only icon candidates, then writes one complete profile-bound snapshot-set manifest.

`offline` requires one explicit complete selected snapshot set and performs no network access. It rejects partial, missing, extra, duplicate, edited, mixed-profile, plan-mismatched, registry-mismatched, dependency-mismatched, path-escaping, symlink-escaping, or digest-mismatched inputs before extraction.

Source snapshots remain ignored. Promotion records whether the selected evidence remains locally retained. If it is not retained, documentation must state that future exact reproduction requires a fresh bounded acquisition and review; the sprint must not claim indefinite reproducibility from committed runtime artifacts alone.

### Alternatives Considered

- **One combined runtime catalog**: not selected. It simplifies current profile plumbing but weakens base/mod ownership and future loading boundaries. A narrow multi-artifact profile extension preserves one source transaction without merging contracts.

- **Two independent ingestion profiles**: not selected. It would duplicate discovery, dependency checks, source snapshots, review, and cross-catalog compatibility state.

- **Use template IDs as public catalog IDs**: not selected. Template IDs are crosswalk evidence and may vary across mode, history, or semantic grouping.

- **Model every named weapon skin**: deferred. V1 targets practical template resolution and semantic base variants.

- **Free-form effect prose**: not selected. Structured facts plus reviewed note codes reduce copied-text risk and prevent accidental arithmetic.

- **Universal applicability when sources are silent**: not selected. Silence yields partial/unknown applicability and an indeterminate result.

- **Set-level equipment validator now**: deferred to EPIC-14. This sprint supplies slot, exclusion, and pairwise compatibility facts.

- **Modify the raw equipment codec**: not selected. Semantic resolution remains a caller-supplied, non-mutating layer over EPIC-05.

- **Import the catalogs into the current app**: deferred. Runtime imports remain isolated to `src/app/catalogs.ts`, which is unchanged in this sprint.

## Implementation

### Phase 1: BW-1201 Contracts, Source Shape, Profile, And Artifact-Set Support (~14%)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/weapon-catalog.test.ts`
- `test/domain/weapon-mod-catalog.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `work/tickets/12-weapons-and-mods/BW-1201-weapon-mod-catalog-contracts-and-profile.md`

**Tasks:**

- [ ] Mark EPIC-12, SPRINT-013, and BW-1201 in progress when execution begins.
- [ ] Run a bounded source-shape checkpoint against the proposed seeds and representative axe, bow-variant, two-handed, caster, focus, shield, prefix, suffix, inscription, staff-component, HCT/HSR, redirect, and malformed cases.
- [ ] Record the verified canonical authority titles, table/template shapes, field precedence, candidate boundaries, caps, identity policy, display policy, and non-waivable blockers before schema freeze.
- [ ] Confirm the separate-artifact decision or record the only permitted Phase 1 artifact-split amendment before later phases.
- [ ] Define `WeaponCatalog`, `WeaponModifierCatalog`, shared profile, release-set, source-set, dependency, registry, disposition, page-identity, media, crosswalk, weapon-fact, modifier-applicability, effect, and unresolved contracts.
- [ ] Reuse `WeaponId`, `WeaponModifierId`, `TemplateEquipmentItemId`, `TemplateEquipmentModifierId`, and `AttributeId`. Do not modify `src/domain/ids.ts` unless the checkpoint proves a narrow branded-ID deficiency.
- [ ] Preserve the lightweight authored-build `Weapon`, `WeaponModifier`, and `WeaponSet` contracts in `src/domain/equipment.ts`; generated catalog records remain distinct types.
- [ ] Add ordered multi-artifact profile/result support sufficient for EPIC-12 while preserving existing primary-result fields and single-artifact output behavior.
- [ ] Register `epic-12-weapons-and-mods` with fixture/offline/live modes, initial caps, EPIC-03 dependency, exact output paths, metadata-only media, and staged source-plan requirements.
- [ ] Update CLI profile/stage/snapshot-set validation and deterministic multi-artifact reporting without changing existing profile defaults or exit-code semantics.
- [ ] Keep fixture generation and `npm run verify` network-free.
- [ ] Mark BW-1201 done only after its focused gate passes; otherwise record the blocker and do not begin dependent work.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_profiles build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- Regression fixture tests proving EPIC-02/03/04/10/11 paths and bytes remain unchanged.

### Phase 2: BW-1202 Weapon Source Set, Identity, And Base Extraction (~16%)

**Files:**

- `scripts/data/build_wars_ingest/weapon_source_set.py`
- `scripts/data/build_wars_ingest/weapon_identity.py`
- `scripts/data/build_wars_ingest/weapon_identity_registry.json`
- `scripts/data/build_wars_ingest/weapon_extractor.py`
- `scripts/data/build_wars_ingest/source_set_protocol.py`
- `scripts/data/build_wars_ingest/template_ids.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/snapshots.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_identity.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_source_set_protocol.py`
- `scripts/data/build_wars_ingest/tests/test_template_ids.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `test/fixtures/data-ingestion/weapons-and-mods/`
- `work/tickets/12-weapons-and-mods/BW-1202-weapon-base-type-extractors.md`

**Tasks:**

- [ ] Mark BW-1202 in progress only after Phase 1 passes.
- [ ] Build a source plan that reconciles weapon-related template rows, weapon inventories, family/detail pages, bow variants, caster variants, PvP scope, and explicit exclusions.
- [ ] Give every discovered base candidate one terminal state: accepted weapon, supported relationship, explicit exclusion/handoff, unsupported disposition, or blocking finding.
- [ ] Implement namespace-aware registry loading, allocation, non-reuse, tombstones, supersession, rename/split/merge checks, and deterministic registry digests.
- [ ] Preserve requested, normalized, redirected, and canonical titles; page/revision identity; source revision and retrieval timestamps; source order; dependency identity; and field provenance.
- [ ] Extract deterministic raw weapon records containing source/variant keys, registry IDs, names, family/variant, handedness, equip role, mode, raw damage, raw requirements, raw modifier-slot facts, raw item-ID evidence, icon candidates, and unsupported fields.
- [ ] Join requirement attributes only through the promoted EPIC-03 catalog. Preserve the original normalized source label and an unresolved state when no unique join exists.
- [ ] Represent shield/focus damage absence explicitly and prevent missing weapon damage from being normalized as zero.
- [ ] Normalize aliases at one reviewed boundary while retaining canonical source identity and collision detection.
- [ ] Reject or disposition duplicate IDs, duplicate source keys, normalized-name collisions, impossible ranges, invalid handedness, contradictory roles, wrong page types, redirect cycles, ambiguous variants, non-finite values, unsafe units, and unexpected source shapes.
- [ ] Add synthetic fixtures covering one-handed, two-handed, offhand, all bow variants, martial families, caster families, shields, focuses, missing requirements, unresolved attributes, malformed damage, redirects, duplicate names/IDs, unsupported fields, and absent icons.
- [ ] Keep fixtures minimized and synthetic; do not commit live page bodies, screenshots, thumbnails, icon bytes, or copied long prose.
- [ ] Mark BW-1202 done only after deterministic base extraction and source accounting pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_source_set build_wars_ingest.tests.test_weapon_identity build_wars_ingest.tests.test_weapon_extractor build_wars_ingest.tests.test_source_set_protocol build_wars_ingest.tests.test_template_ids build_wars_ingest.tests.test_pipeline`
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-and-mods --root work/runs/data-ingestion/epic-12-fixture-a --fixture-root test/fixtures/data-ingestion`
- `npm run test:run -- test/domain/weapon-catalog.test.ts`

### Phase 3: BW-1203 Modifier Source Resolution, Extraction, And Media (~15%)

**Files:**

- `scripts/data/build_wars_ingest/weapon_source_set.py`
- `scripts/data/build_wars_ingest/weapon_mod_extractor.py`
- `scripts/data/build_wars_ingest/weapon_identity.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_mod_extractor.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_identity.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `test/fixtures/data-ingestion/weapons-and-mods/`
- `work/tickets/12-weapons-and-mods/BW-1203-upgrade-component-and-inscription-sources.md`

**Tasks:**

- [ ] Mark BW-1203 in progress only after Phase 1 passes and shared source-plan contracts are stable.
- [ ] Extend discovery to reconcile prefix, suffix, inscription, staff-head, staff-wrapping, shield/offhand, wand, focus, caster-specific, and reviewed additional modifier families.
- [ ] Give every discovered modifier candidate one terminal state: accepted modifier, supported relationship, explicit exclusion, unsupported disposition, or blocking finding.
- [ ] Extract deterministic raw modifier records containing source/variant keys, registry IDs, names, component family, occupied slot, mode, raw applicability, requirement/attribute labels, raw effect fields, mutual-exclusion evidence, modifier-ID evidence, icon candidate, page identity, and field provenance.
- [ ] Keep occupied slot separate from component family so staff heads/wrappings and weapon-specific components can normalize into prefix/suffix semantics without losing their source family.
- [ ] Join modifier attribute references through EPIC-03 and preserve unresolved labels rather than guessing.
- [ ] Preserve source uncertainty for HCT, HSR, mastery, chance, enchantment, stance, damage-type, and conditional behavior for Phase 4.
- [ ] Detect contradictory applicability, duplicate active modifier IDs, duplicate normalized identities, missing slot family, invalid mode, malformed percentages, unsupported templates/parameters, and unaccounted source rows.
- [ ] Resolve only metadata through `imageinfo`; keep `iconId` nullable and every media record `cachedBytes: false`.
- [ ] Add synthetic fixtures for martial prefixes/suffixes, inscriptions, staff heads/wrappings, shield/offhand and caster components, attribute-linked modifiers, HCT/HSR, chance effects, incompatible families, missing icons, redirects, duplicates, malformed rows, and copied-text risk.
- [ ] Sort candidates, records, effects, dispositions, and media independently of request order, page order, filesystem order, and concurrent completion.
- [ ] Mark BW-1203 done only after modifier source accounting and extraction pass.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_source_set build_wars_ingest.tests.test_weapon_mod_extractor build_wars_ingest.tests.test_weapon_identity build_wars_ingest.tests.test_icons build_wars_ingest.tests.test_pipeline`
- `npm run test:run -- test/domain/weapon-mod-catalog.test.ts`
- `npm run data:test`

### Phase 4: BW-1204 Effect Semantics And Compatibility (~17%)

**Files:**

- `scripts/data/build_wars_ingest/weapon_semantics.py`
- `scripts/data/build_wars_ingest/weapon_extractor.py`
- `scripts/data/build_wars_ingest/weapon_mod_extractor.py`
- `scripts/data/build_wars_ingest/weapon_catalog.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_semantics.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_catalog.py`
- `src/domain/weapon-mod-compatibility.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/domain/weapon-catalog.test.ts`
- `test/domain/weapon-mod-catalog.test.ts`
- `test/domain/weapon-mod-compatibility.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json`
- `test/fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json`
- `work/tickets/12-weapons-and-mods/BW-1204-weapon-mod-effect-and-compatibility-semantics.md`

**Tasks:**

- [ ] Mark BW-1204 in progress only after Phases 2 and 3 pass.
- [ ] Freeze the closed family, slot, damage-type, effect, unit, event, condition, applicability, completeness, and reason-code vocabularies from the reviewed source census.
- [ ] Normalize weapon damage, requirement, handedness/equip role, and allowed slot facts into tagged runtime states.
- [ ] Normalize deterministic modifier facts into stat-delta, life-steal, requirement-adjustment, condition-duration, and other approved structured variants.
- [ ] Represent source-clear HCT, HSR, armor penetration, adrenaline, or mastery probabilities as inert triggered-chance facts; do not derive expected values.
- [ ] Represent source-clear conditions with closed inert predicates and bounded operands. Unsupported expressions become deferred note-only or unknown effects.
- [ ] Preserve compound source behavior as separate effects rather than collapsing benefits and penalties.
- [ ] Give every accepted modifier a non-empty effect list and accurate `structured`, `mixed`, `note-only`, or `unknown` completeness.
- [ ] Normalize applicability by family, variant, handedness/equip role, requirement attribute, and mode without treating silence as universal support.
- [ ] Implement `explainWeaponModifierCompatibility` with stable compatible, incompatible, and indeterminate outcomes.
- [ ] Keep duplicate-slot and mutual-exclusion facts in the catalog while deferring equipped-set validation to EPIC-14.
- [ ] Add fixtures for compatible/incompatible martial mods, staff components, shield/focus restrictions, two-handed/offhand conflicts, caster special cases, requirement mismatches, mode conflicts, unresolved applicability, deterministic effects, conditional effects, HCT/HSR, mastery, note-only effects, unknown effects, non-finite numbers, overflow, malformed conditions, and unchanged inputs.
- [ ] Ensure compatibility never depends on display names, array positions, UI state, or calculated character statistics.
- [ ] Mark BW-1204 done only after Python normalization and TypeScript compatibility gates pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/weapon-mod-compatibility.test.ts test/domain/data-ingestion-contracts.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_semantics build_wars_ingest.tests.test_weapon_catalog`

### Phase 5: BW-1205 Template Crosswalks And Non-Lossy Resolution (~13%)

**Files:**

- `src/domain/catalog-lookup.ts`
- `src/domain/template.ts`
- `src/domain/index.ts`
- `src/template-compatibility/equipment-catalog-resolution.ts`
- `src/template-compatibility/index.ts`
- `src/template-compatibility/equipment-template.ts`
- `test/domain/weapon-catalog.test.ts`
- `test/domain/weapon-mod-catalog.test.ts`
- `test/template-compatibility/equipment-catalog-resolution.test.ts`
- `test/template-compatibility/equipment-template.test.ts`
- `test/template-compatibility/compatibility-matrix.test.ts`
- `test/fixtures/template-compatibility/equipment-cases.json`
- `scripts/data/build_wars_ingest/template_ids.py`
- `scripts/data/build_wars_ingest/weapon_source_set.py`
- `scripts/data/build_wars_ingest/weapon_catalog.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/tests/test_template_ids.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_source_set.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_catalog.py`
- `work/tickets/12-weapons-and-mods/BW-1205-equipment-template-id-mapping.md`

**Tasks:**

- [ ] Mark BW-1205 in progress only after Phase 4 passes.
- [ ] Normalize verified template item and modifier rows into explicit crosswalk records with raw branded IDs, status, mode, slot/family scope, and provenance.
- [ ] Enforce one accepted target per active raw ID while permitting reviewed historical, unsupported, or ambiguous facts.
- [ ] Add collision-safe item/modifier lookup outcomes for known, ambiguous, dispositioned, and unknown IDs.
- [ ] Preserve raw numeric IDs in every lookup outcome; never return an invented catalog record for an unsupported ID.
- [ ] Implement the additive equipment catalog-resolution view over caller-supplied weapon and modifier catalogs.
- [ ] Echo slot IDs, item IDs, color IDs, modifier IDs, modifier order, and the EPIC-05 source fingerprint without mutation.
- [ ] Keep armor item IDs, rune/insignia modifier IDs, dye semantics, and unsupported rows visible as dispositioned or unknown rather than misclassifying them as weapons.
- [ ] Add cases for known weapons, known modifiers, ambiguous/dispositioned mappings, unknown item IDs, unknown modifier IDs, duplicate modifier slots, invalid slot values, armor-owned rows, raw color pass-through, and multiple modifiers.
- [ ] Prove lookup and resolution results are deterministic for equivalent catalog ordering.
- [ ] Prove resolving an unchanged decoded document does not alter exact-source export, original bytes, semantic fingerprint, raw IDs, or modifier ordering.
- [ ] Run the existing EPIC-05 skill and equipment-template regression suite unchanged.
- [ ] Mark BW-1205 done only after crosswalk integrity and exact-source regression gates pass.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/template-compatibility/equipment-catalog-resolution.test.ts test/template-compatibility/equipment-template.test.ts test/template-compatibility/compatibility-matrix.test.ts`
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_template_ids build_wars_ingest.tests.test_weapon_source_set build_wars_ingest.tests.test_weapon_catalog`

### Phase 6: BW-1206 Assembly, QA, Review, And Exact-Path Promotion (~16%)

**Files:**

- `scripts/data/build_wars_ingest/weapon_catalog.py`
- `scripts/data/build_wars_ingest/weapon_semantics.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_weapon_catalog.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/domain/weapon-catalog.test.ts`
- `test/domain/weapon-mod-catalog.test.ts`
- `test/domain/weapon-mod-compatibility.test.ts`
- `test/template-compatibility/equipment-catalog-resolution.test.ts`
- `test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json`
- `test/fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json`
- `.gitignore`
- `data/generated/epic-12/weapons.catalog.json`
- `data/generated/epic-12/weapons.catalog.manifest.json`
- `data/generated/epic-12/weapon-mods.catalog.json`
- `data/generated/epic-12/weapon-mods.catalog.manifest.json`
- `data/qa/epic-12/weapons.catalog.qa.json`
- `data/qa/epic-12/weapon-mods.catalog.qa.json`
- `work/tickets/12-weapons-and-mods/BW-1206-weapons-mods-catalog-qa-and-promotion.md`

**Tasks:**

- [ ] Mark BW-1206 in progress only after Phases 2 through 5 pass.
- [ ] Assemble both catalogs from the same verified source plan, selected snapshot set, registry digest, EPIC-03 dependency, generator identity, and fixed generation clock.
- [ ] Canonically order records by public ID and source key; order crosswalks by raw numeric ID; order slots, families, effects, provenance references, dispositions, and media by documented stable keys.
- [ ] Compute per-section digests and independent semantic catalog versions from consumer-visible facts.
- [ ] Compute one shared `catalogSetVersion` over both semantic projections, shared vocabularies, runtime-relevant dispositions, source-set facts, and EPIC-03 dependency semantics.
- [ ] Exclude timestamps, version values, local paths, manifest/QA paths, source-plan bodies, snapshot bodies, review bodies, and retrieval-only evidence from semantic digest inputs.
- [ ] Generate separate manifests containing artifact role/digest, counterpart role/version/digest, source-plan identity, selected snapshot-set identity, dependency and registry digests, retention decision, generation facts, and review records.
- [ ] Generate scoped QA findings: weapon findings in the weapon report; modifier and cross-catalog compatibility findings in the modifier report. Compute both release decisions from the union so either scope blocks the set.
- [ ] Add QA for source accounting, zero output, registry non-reuse, identity collisions, normalized-name collisions, page resolution, revision/provenance gaps, dependency drift, damage/requirement states, family/slot integrity, applicability, effect shapes, conditions, compatibility contradictions, crosswalk uniqueness, unresolved selected PvP IDs, copied-text risk, media policy, caps, semantic digests, counterpart/set consistency, baseline diffs, and artifact integrity.
- [ ] Keep stable finding IDs independent of absolute paths, request order, filesystem order, wall-clock time, and report truncation.
- [ ] Treat QA overflow or material truncation as blocking.
- [ ] Generate the synthetic profile twice into separate ignored roots under the same fixed clock and prove byte identity for both catalogs, both manifests, both QA reports, versions, section digests, record order, disposition order, and finding IDs.
- [ ] Run bounded live discovery and review authority identities, candidate counts, family/variant coverage, selected PvP rows, ID ranges/gaps, registry changes, effect/condition vocabulary, crosswalks, caps, dependency identity, dispositions, and the source-set digest.
- [ ] Run fetch only with the reviewed source plan and exact confirmed digest. Retain or record the retention status of the complete selected snapshot set.
- [ ] Replay the selected snapshot set offline twice under the same fixed clock and prove all six outputs byte-identical.
- [ ] Perform first-baseline review of counts, families, bow/caster variants, handedness, damage/requirements, slot/component coverage, effect completeness, note-only/unknown behavior, compatibility examples, crosswalks, registry/tombstones, dispositions, media decisions, dependency/section/artifact/QA digests, and both gate decisions.
- [ ] Generate production bytes only from the selected offline input set. Never hand-edit promoted catalogs, manifests, or QA reports.
- [ ] Add `.gitignore` parent rules and exact exceptions only for the six approved EPIC-12 paths.
- [ ] Verify representative source plans, snapshot sets, raw snapshots, candidates, QA summaries, logs, media bytes, screenshots, and arbitrary EPIC-12 siblings remain ignored or absent.
- [ ] Promote all six files as one reviewed release set. A missing, stale, failed, or mismatched member blocks both catalogs.
- [ ] Mark BW-1206 done only when both app-consumption and public-release gates are `pass`, warnings have bounded dispositions, and exact-path verification succeeds.

**Verification:**

- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-and-mods --root work/runs/data-ingestion/epic-12-fixture-a --fixture-root test/fixtures/data-ingestion`
- Repeat fixture generation into `work/runs/data-ingestion/epic-12-fixture-b` with the same fixed clock and compare all six JSON outputs byte-for-byte.
- `PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-12-weapons-and-mods --root work/runs/data-ingestion/epic-12-live --allow-live-network --stage discover`
- Run live `fetch` with the reviewed `--source-plan` and exact `--confirm-source-set-digest`.
- Run `offline --profile epic-12-weapons-and-mods --root work/runs/data-ingestion/epic-12-live --snapshot-set <selected-manifest> --clock fixed` twice and compare all six outputs.
- `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_weapon_catalog build_wars_ingest.tests.test_artifacts build_wars_ingest.tests.test_qa build_wars_ingest.tests.test_pipeline build_wars_ingest.tests.test_cli`
- `npm run test:run -- test/domain/data-ingestion-contracts.test.ts test/domain/weapon-catalog.test.ts test/domain/weapon-mod-catalog.test.ts test/domain/weapon-mod-compatibility.test.ts test/template-compatibility/equipment-catalog-resolution.test.ts`
- `git check-ignore -v data/generated/epic-12/weapons.catalog.json data/generated/epic-12/weapons.catalog.manifest.json data/generated/epic-12/weapon-mods.catalog.json data/generated/epic-12/weapon-mods.catalog.manifest.json data/qa/epic-12/weapons.catalog.qa.json data/qa/epic-12/weapon-mods.catalog.qa.json`
- `git status --short`

### Phase 7: BW-1207 Documentation, Verification, And Closeout (~9%)

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `data/source-snapshots/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/weapons-and-mods-catalog.md`
- `compendium/template-compatibility.md`
- `compendium/README.md`
- `work/tickets/12-weapons-and-mods/EPIC.md`
- `work/tickets/12-weapons-and-mods/BW-1201-weapon-mod-catalog-contracts-and-profile.md`
- `work/tickets/12-weapons-and-mods/BW-1202-weapon-base-type-extractors.md`
- `work/tickets/12-weapons-and-mods/BW-1203-upgrade-component-and-inscription-sources.md`
- `work/tickets/12-weapons-and-mods/BW-1204-weapon-mod-effect-and-compatibility-semantics.md`
- `work/tickets/12-weapons-and-mods/BW-1205-equipment-template-id-mapping.md`
- `work/tickets/12-weapons-and-mods/BW-1206-weapons-mods-catalog-qa-and-promotion.md`
- `work/tickets/12-weapons-and-mods/BW-1207-weapons-mods-runtime-docs-and-closeout.md`
- `work/sprints/SPRINT-013.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-12-result.json`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-013-result.json`

**Tasks:**

- [ ] Mark BW-1207 in progress only after Phase 6 promotion passes.
- [ ] Document verified source authority, final caps, source shapes, identity/crosswalk policy, profile commands, staged refresh, selected replay, retention limits, schemas, compatibility vocabulary, effects, semantic versions, QA gates, baseline review, and exact paths.
- [ ] State that only the two catalog JSON files are runtime-eligible. Their manifests, QA reports, source plans, snapshot sets, raw snapshots, summaries, review evidence, Python tooling, and media bytes remain non-runtime.
- [ ] Document that future app imports must occur only through `src/app/catalogs.ts`; confirm that file and the editor remain unchanged in this sprint.
- [ ] Document EPIC-13’s ownership of armor item IDs, armor shells, dye/color semantics, and remaining non-weapon equipment rows.
- [ ] Document EPIC-14’s ownership of weapon-set editing, main/offhand/two-handed legality, duplicate-slot and exclusion-group validation, requirement satisfaction, template workflow, and unknown-ID presentation.
- [ ] Document EPIC-17’s responsibility to preserve equipment references when composing party records.
- [ ] Document EPIC-20’s search/tooltip handoff and its obligation to render reviewed text as escaped text with appropriate attribution.
- [ ] Document EPIC-21’s ownership of conditional evaluation, HCT/HSR/mastery interpretation, stacking, combat state, damage calculations, and full stat aggregation.
- [ ] Confirm current skill/attribute editor, local persistence, sharing, backup/restore, EPIC-03/04/10/11 artifacts, rune/insignia behavior, and raw template fidelity remain unchanged.
- [ ] Inspect the worktree for source plans, raw snapshots, snapshot-set manifests, candidate outputs, summaries, logs, media bytes, screenshots, copied prose, broad allowlists, secrets, absolute machine paths, nondeterministic timestamps, and unrelated changes.
- [ ] Record phase evidence and exact verification results in BW-1201 through BW-1207.
- [ ] Mark tickets done only after their gates pass. Mark EPIC-12, SPRINT-013, and the ledger completed together only after the full Definition of Done passes.
- [ ] If production evidence or review is unavailable, record the blocker in BW-1206/BW-1207 and the execution result; do not mark the epic, sprint, or ledger complete.
- [ ] Write the ticket-burn execution result with matching epic/sprint/ticket IDs, changed-file summary, generated artifact list, validations, blockers, follow-ups, and `commit_created: false`.
- [ ] Do not create a commit.

**Verification:**

- `npm run data:regenerate`
- Direct fixed-clock EPIC-12 fixture regeneration.
- Selected fixed-clock EPIC-12 offline replay.
- `npm run verify`
- `rg -n 'EPIC-12|BW-120[1-7]|SPRINT-013' work/tickets/12-weapons-and-mods work/sprints`
- `git status --short`
- Manual consistency review across documentation, registries, generated files, QA gates, tickets, sprint, ledger, and result manifests.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Add separate weapon/modifier catalog contracts, shared release-set facts, weapon facts, applicability, effects, crosswalks, dispositions, and dependency summaries. |
| `src/domain/catalog-lookup.ts` | Modify | Add weapon/modifier lookup APIs and known/ambiguous/dispositioned/unknown template-ID outcomes. |
| `src/domain/weapon-mod-compatibility.ts` | Create | Explain pairwise weapon/modifier compatibility without UI state, condition evaluation, or stat calculation. |
| `src/domain/template.ts` | Modify narrowly | Add immutable equipment catalog-resolution view types without changing raw document semantics. |
| `src/domain/index.ts` | Modify | Export the new contracts, lookups, resolver types, and compatibility helper. |
| `src/domain/ids.ts` | Reference only | Reuse the four existing weapon/template branded IDs. |
| `src/domain/equipment.ts` | Reference only | Preserve lightweight authored weapon-set placeholders. |
| `src/template-compatibility/equipment-catalog-resolution.ts` | Create | Resolve decoded equipment IDs through caller-supplied catalogs while retaining all raw facts. |
| `src/template-compatibility/index.ts` | Modify | Export the additive resolution API. |
| `src/template-compatibility/equipment-template.ts` | Reference/test only | Preserve EPIC-05 decode/export and exact-source behavior. |
| `src/app/catalogs.ts` | Reference only | Preserve the sole generated-data import boundary; do not import EPIC-12 artifacts. |
| `scripts/data/build_wars_ingest/config.py` | Modify | Add bounded EPIC-12 limits. |
| `scripts/data/build_wars_ingest/profiles.py` | Modify | Register the EPIC-12 profile and ordered exact artifact outputs. |
| `scripts/data/build_wars_ingest/models.py` | Modify narrowly | Add reusable multi-artifact/result or source-set types where existing contracts are insufficient. |
| `scripts/data/build_wars_ingest/source_set_protocol.py` | Modify narrowly | Reuse secure source-plan and selected replay validation for EPIC-12. |
| `scripts/data/build_wars_ingest/weapon_source_set.py` | Create | Reconcile source inventories, candidates, dispositions, plans, page resolution, and snapshot sets. |
| `scripts/data/build_wars_ingest/weapon_identity.py` | Create | Enforce namespace-aware stable IDs, tombstones, supersession, and registry digests. |
| `scripts/data/build_wars_ingest/weapon_identity_registry.json` | Create | Persist reviewed weapon and modifier identity entries. |
| `scripts/data/build_wars_ingest/weapon_extractor.py` | Create | Extract weapon family, variant, damage, requirements, slots, item mappings, media candidates, and provenance. |
| `scripts/data/build_wars_ingest/weapon_mod_extractor.py` | Create | Extract component families, slots, applicability, raw effects, modifier mappings, media candidates, and provenance. |
| `scripts/data/build_wars_ingest/weapon_semantics.py` | Create | Normalize weapon facts, modifier effects, conditions, applicability, completeness, and compatibility vocabulary. |
| `scripts/data/build_wars_ingest/weapon_catalog.py` | Create | Assemble both catalogs, section/catalog/set digests, scoped diagnostics, and review facts. |
| `scripts/data/build_wars_ingest/template_ids.py` | Modify narrowly | Parse verified weapon item/modifier rows while preserving existing profession/attribute behavior. |
| `scripts/data/build_wars_ingest/icons.py` | Modify narrowly | Reuse metadata-only icon resolution. |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Write and compare a deterministic two-artifact release set. |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Add bounded weapon, modifier, compatibility, crosswalk, set-integrity, and gate findings. |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Orchestrate EPIC-12 fixture, discovery, fetch, replay, assembly, and multi-artifact output. |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Expose the EPIC-12 profile and deterministically report both outputs. |
| `scripts/data/build_wars_ingest/tests/` | Create/modify | Cover profile compatibility, planning, identity, extraction, semantics, lookups, assembly, QA, determinism, replay, and CLI behavior. |
| `test/domain/contracts.test.ts` | Modify | Protect framework-neutral catalog and authored-equipment boundaries. |
| `test/domain/weapon-catalog.test.ts` | Create | Verify weapon facts, identities, item crosswalks, lookups, dispositions, and semantic digests. |
| `test/domain/weapon-mod-catalog.test.ts` | Create | Verify modifier families, effects, applicability, crosswalks, lookups, and semantic digests. |
| `test/domain/weapon-mod-compatibility.test.ts` | Create | Verify explainable compatible, incompatible, and indeterminate outcomes. |
| `test/domain/data-ingestion-contracts.test.ts` | Modify | Validate both Python-generated fixture catalogs against TypeScript contracts. |
| `test/template-compatibility/equipment-catalog-resolution.test.ts` | Create | Verify known/unknown resolution, raw preservation, immutability, and exact-source compatibility. |
| `test/fixtures/template-compatibility/equipment-cases.json` | Modify | Add minimized known, ambiguous, unsupported, unknown, duplicate, and color-pass-through cases. |
| `test/fixtures/data-ingestion/weapons-and-mods/` | Create | Store minimized synthetic source, malformed, compatibility, and icon metadata fixtures. |
| `test/fixtures/data-ingestion/generated/fixture-weapons.catalog.json` | Create | Store deterministic synthetic weapon catalog output. |
| `test/fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json` | Create | Store deterministic synthetic modifier catalog output. |
| `data/generated/epic-12/weapons.catalog.json` | Create/allowlist | Promote runtime-eligible weapon base records. |
| `data/generated/epic-12/weapons.catalog.manifest.json` | Create/allowlist | Promote weapon artifact integrity, dependency, evidence, retention, and review metadata. |
| `data/generated/epic-12/weapon-mods.catalog.json` | Create/allowlist | Promote runtime-eligible modifier records. |
| `data/generated/epic-12/weapon-mods.catalog.manifest.json` | Create/allowlist | Promote modifier artifact integrity, dependency, evidence, retention, and review metadata. |
| `data/qa/epic-12/weapons.catalog.qa.json` | Create/allowlist | Promote bounded weapon and shared release-set QA evidence. |
| `data/qa/epic-12/weapon-mods.catalog.qa.json` | Create/allowlist | Promote bounded modifier, compatibility, crosswalk, and shared release-set QA evidence. |
| `.gitignore` | Modify narrowly | Allowlist only the EPIC-12 parent directories and exact six promoted paths. |
| `README.md` | Modify | Document the new catalogs, boundaries, commands, and unchanged app behavior. |
| `scripts/data/README.md` | Modify | Document the profile, authority, caps, multi-output behavior, staged commands, and replay protocol. |
| `data/README.md` | Modify | Document EPIC-12 lifecycle, retention, and runtime/non-runtime boundaries. |
| `data/generated/README.md` | Modify | Document the exact two-catalog release set and semantic versioning. |
| `data/qa/README.md` | Modify | Document the two scoped reports and shared blocking gate. |
| `data/source-snapshots/README.md` | Modify | Document selected EPIC-12 evidence retention and replay limits. |
| `compendium/data-ingestion-platform.md` | Modify | Record the EPIC-12 profile and narrow multi-artifact extension. |
| `compendium/template-compatibility.md` | Modify | Document additive non-mutating equipment catalog resolution. |
| `compendium/weapons-and-mods-catalog.md` | Create | Preserve source authority, identity, schema, effects, compatibility, crosswalks, QA, and downstream handoffs. |
| `compendium/README.md` | Modify | Index the weapons/mods catalog note. |
| `work/tickets/12-weapons-and-mods/*.md` | Modify | Track sprint linkage, status, decisions, blockers, and execution evidence. |
| `work/sprints/SPRINT-013.md` | Create/update | Store the executable sprint and execution checklist state. |
| `work/sprints/ledger.tsv` | Modify | Track SPRINT-013 lifecycle. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-12-result.json` | Create during planning | Record the non-interactive planning result. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/execute-SPRINT-013-result.json` | Create during execution | Record implementation results, validation, blockers, and no-commit state. |

## Definition of Done

### Source, Scope, And Identity

- [ ] The exact field-authority and conflict-precedence matrix is approved before schema freeze.
- [ ] The source graph is finite, digest-bound, fixed-origin, and limited to reviewed authority/detail/mechanics/media metadata pages.
- [ ] Every selected weapon and modifier candidate has one terminal disposition.
- [ ] Practical player-usable PvP template coverage includes all approved martial, bow, caster, shield, focus, prefix, suffix, inscription, staff, and offhand families.
- [ ] Named skins, unique items, acquisition facts, economic data, and broader PvE exhaustiveness remain excluded or explicitly dispositioned.
- [ ] `WeaponId` and `WeaponModifierId` are registry-backed, namespace-safe, non-reused, and independent of template IDs and source order.
- [ ] Rename, redirect, split, merge, removal, supersession, and tombstone cases are collision checked and reviewable.
- [ ] Active template item and modifier crosswalks are unique, provenance-bearing, and never inferred from equal numeric values.

### Runtime Contracts

- [ ] Separate framework-neutral `WeaponCatalog` and `WeaponModifierCatalog` contracts are exported through `src/domain`.
- [ ] Both catalogs share one source-set/dependency identity and `catalogSetVersion` while retaining independent semantic versions.
- [ ] Weapon records include identity, family/variant, handedness/equip role, mode, tagged damage, tagged requirement, allowed modifier slots, item crosswalks, display state, nullable icon, and compact provenance.
- [ ] Modifier records include identity, family, occupied slot, mode, structured applicability, non-empty effects, completeness, exclusion facts, modifier crosswalks, display state, nullable icon, and compact provenance.
- [ ] Damage absence, missing requirements, unresolved attributes, partial applicability, note-only effects, and unknown effects remain explicit states.
- [ ] `src/domain` imports no React, DOM/browser APIs, browser storage, network clients, app modules, generated JSON, manifests, QA reports, snapshots, or Python code.
- [ ] Runtime JSON excludes raw pages, source plans, snapshot manifests, local paths, full QA/review bodies, copied long prose, MediaWiki HTML, icon bytes, thumbnails, screenshots, and executable expressions.
- [ ] `src/app/catalogs.ts` and current editor behavior remain unchanged.

### Effects And Compatibility

- [ ] Deterministic effects preserve amount, unit, sign, target, mode, condition, and provenance.
- [ ] Source-clear chance effects preserve probability and event facts without expected-value arithmetic.
- [ ] HCT, HSR, mastery, enchantment, stance, and other uncertain behavior is structured only when evidence is exact; otherwise it remains note-only, unknown, or blocked.
- [ ] Conditions are inert controlled data and cannot execute arbitrary expressions.
- [ ] Compound benefits and penalties remain separate effects.
- [ ] Pairwise compatibility checks slot availability, component family, weapon family/variant, handedness/equip role, requirement attribute, mode, and applicability completeness.
- [ ] Compatibility returns stable `compatible`, `incompatible`, or `indeterminate` outcomes with reason codes.
- [ ] Compatibility does not select equipment, evaluate character ranks or conditions, aggregate modifiers, calculate totals, or mutate inputs.
- [ ] Duplicate-slot and mutual-exclusion facts are available for EPIC-14 without introducing an equipment-state validator here.

### Template Resolution

- [ ] Known item and modifier IDs resolve through explicit crosswalks.
- [ ] Ambiguous, dispositioned, and unknown IDs remain distinct outcomes that retain the raw branded ID.
- [ ] The resolution view preserves every slot ID, item ID, color ID, modifier ID, modifier order, and source fingerprint.
- [ ] Armor, rune, insignia, dye, unsupported, and future-owned facts are not silently forced into EPIC-12 records.
- [ ] Resolution is immutable and caller-supplied; it performs no runtime source access.
- [ ] Existing raw equipment-template decode, exact-source replay, canonical export guardrails, skill-template behavior, and error contracts remain compatible.

### Determinism, QA, And Promotion

- [ ] Fixture mode is synthetic, minimized, and network-free.
- [ ] Live discovery/fetch requires the registered profile, explicit network opt-in, fixed origin, reviewed source plan, exact digest confirmation, and bounded caps.
- [ ] Offline replay requires one complete selected EPIC-12 snapshot set and rejects unsafe, incomplete, duplicate, extra, mixed, plan-mismatched, registry-mismatched, dependency-mismatched, path-escaping, or digest-mismatched inputs.
- [ ] Both catalogs, manifests, QA reports, section digests, catalog versions, set version, ordering, dispositions, and finding IDs are byte-identical across repeated fixed-clock fixture and selected offline runs.
- [ ] QA covers source accounting, identity, crosswalks, joins, damage, requirements, slots, applicability, effects, conditions, compatibility, media, copied text, caps, semantic versions, counterpart consistency, baseline diffs, and artifact integrity.
- [ ] QA overflow, material truncation, unsafe paths, unreadable artifacts, unknown copied material, unresolved core selected-PvP identity, duplicate active mappings, incomplete replay, dependency drift, and digest/integrity mismatch are release-blocking.
- [ ] Missing optional icons and reviewed note-only/unknown non-core effects may remain warning-level with bounded dispositions.
- [ ] Both QA reports derive app/public decisions from the complete release-set finding union.
- [ ] Both `appConsumptionGate` and `publicReleaseGate` are `pass` for both reports.
- [ ] Production outputs come only from the reviewed selected offline snapshot set and are never hand-edited.
- [ ] Only the exact six approved EPIC-12 paths are allowlisted; representative byproducts remain ignored or absent.

### Closeout

- [ ] Documentation explains source authority, identities, exact paths, commands, profile limits, selected replay, retention, schemas, effects, compatibility, crosswalks, semantic versions, QA gates, and source-policy decisions.
- [ ] Documentation states that only the two catalog JSON files are runtime-eligible.
- [ ] Downstream ownership for EPIC-13, EPIC-14, EPIC-17, EPIC-20, and EPIC-21 is explicit.
- [ ] Existing editor, local library, sharing, backup/restore, template fidelity, rule engine, and promoted EPIC-03/04/10/11 artifacts remain compatible.
- [ ] BW-1201 through BW-1207, EPIC-12, SPRINT-013, the ledger, and both ticket-burn result manifests describe the same status.
- [ ] `npm run verify` passes without live network access.
- [ ] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Weapon/modifier source authority is broader or less structured than expected. | High | High | Make the source-shape checkpoint and authority matrix the first gate; require amendment before adding sources or increasing caps. |
| Separate catalogs drift or are promoted inconsistently. | Medium | High | Generate them from one profile and snapshot set; share a catalog-set version; gate and promote all six files as one release set. |
| Multi-artifact support regresses existing profiles. | Medium | High | Keep primary-result compatibility, use ordered optional outputs, avoid migrating prior profile semantics, and run byte-level regressions. |
| Public IDs become coupled to source or template IDs. | Medium | High | Use a namespace-aware reviewed registry with immutable IDs, tombstones, and migration checks. |
| Bow or caster variants are collapsed incorrectly. | Medium | High | Treat material damage, requirement, mapping, or compatibility differences as stable variants and block ambiguous classification. |
| Item/modifier IDs conflict, move, or cannot be corroborated. | High | High | Keep explicit crosswalk status, unique active mapping rules, dispositions, and raw-ID-preserving lookup outcomes. |
| Missing source facts are normalized as zero, none, or universal applicability. | Medium | High | Use tagged states and make silence unresolved or partial. |
| HCT/HSR/mastery behavior becomes guessed arithmetic. | High | High | Store only source-clear inert probability facts; otherwise use note-only/unknown states and defer evaluation. |
| Compatibility logic grows into an equipment rule engine. | Medium | High | Keep the helper pairwise and fact-based; defer set validation, rank satisfaction, effects, and totals to EPIC-14/21. |
| Semantic resolution weakens exact-source template replay. | Low | High | Keep resolution additive, caller-supplied, immutable, and regression-test export after resolution. |
| Armor/rune/insignia IDs are misclassified as weapon data. | Medium | High | Retain typed dispositions and raw outcomes; leave non-weapon item semantics to their owning catalogs/epics. |
| Source-authored prose leaks into runtime output. | Medium | High | Prefer structured facts and reviewed Build Wars-authored notes; QA blocks unknown copied material. |
| Media policy is bypassed through fixtures or manifests. | Low | High | Fetch metadata only, assert `cachedBytes: false`, and scan for binaries, thumbnails, screenshots, and data URLs. |
| QA caps conceal material findings. | Low | High | Treat overflow or material truncation as blocking. |
| Exact-path exceptions expose candidate or audit files. | Low | High | Use parent re-ignore rules, exact file exceptions, `git check-ignore -v`, and final worktree inspection. |
| Selected source evidence is not retained. | Medium | Medium | Record retention honestly and require retained inputs or a fresh bounded acquisition/review for later exact reproduction. |
| Live source or reviewer access is unavailable. | Medium | Medium | Leave BW-1206/BW-1207 and the sprint incomplete or blocked; never promote fixture-only data. |

## Security Considerations

- Treat source titles, redirects, wikitext, templates, parameters, table cells, page identities, icon names, source plans, registries, snapshot manifests, generated catalogs, baselines, QA evidence, and review notes as untrusted input.
- Permit network access only in explicit live mode with `--allow-live-network`, the registered EPIC-12 profile, GET-only JSON requests, fixed Guild Wars Wiki API origin, final-origin checks, finite timeouts, bounded retries, continuation caps, request/page/media limits, and byte caps.
- Reject arbitrary endpoints, source-provided URLs, credentials, cookies, tokens, environment secrets, recursive crawls, absolute child paths, `..` traversal, symlink escape, mixed roots, duplicate snapshot children, and digest mismatch.
- Parse wiki content as inert data. Never execute wiki templates, Lua, HTML, JavaScript, CSS, embedded URLs, shell snippets, or source-authored condition expressions.
- Restrict registries and source plans to bounded canonical JSON. Validate enum values, lengths, numeric ranges, finite values, duplicate keys, namespace identity, and digest scope before use.
- Runtime names and reviewed notes are inert strings. Future UI must render them as escaped text and must not use `innerHTML`.
- Bound title lengths, page counts, parser bytes, template nesting/traversal, record counts, crosswalk counts, modifier/effect counts, condition operands, evidence excerpts, output bytes, and QA findings.
- Resolve icon metadata only. Do not fetch or commit icon bytes, thumbnails, screenshots, data URLs, or source media.
- Apply source-policy decisions at field level. Unknown copied material, unreadable artifacts, and digest mismatch remain non-waivable.
- Keep raw template IDs and source fingerprints as data only; never use them to construct paths, commands, dynamic imports, or network destinations.
- No new npm or Python dependency is planned. Any dependency addition requires supply-chain review and a sprint amendment.

## Dependencies

- `EPIC-01` / SPRINT-002: source classification, provenance, manual review, media restrictions, QA gates, retention, and exact-path promotion.
- `EPIC-02` / SPRINT-003: fixed-origin MediaWiki client, snapshots, parser, metadata-only icons, artifact writer, QA framework, and fixture/offline/live modes.
- `EPIC-03` / SPRINT-004: promoted profession/attribute records, requirement/effect joins, dependency digests, section digests, and passing QA.
- `EPIC-04` / SPRINT-005: source-plan digest confirmation, complete selected replay, compact dispositions, semantic catalog versions, and promotion precedent.
- `EPIC-05` / SPRINT-006: raw equipment-template decode/export, branded raw IDs, semantic fingerprints, typed failures, and exact-source fidelity.
- `EPIC-10` / SPRINT-011: equipment modifier crosswalk, effect, metadata-only media, QA, and blocked-promotion precedent.
- `EPIC-11` / SPRINT-012: registry-backed identity, inert conditions, selected replay validation, compact runtime provenance, and source-policy-reviewed display precedent.
- EPIC-13 consumes unresolved non-weapon item rows and owns armor/dye catalog semantics.
- EPIC-14 consumes weapon/modifier records, compatibility facts, and resolution outcomes for equipment editing and legality.
- EPIC-17 preserves authored equipment references in party composition.
- EPIC-20 consumes records for local search and tooltip presentation.
- EPIC-21 consumes structured/deferred effect facts for advanced analysis.
- Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3.11+, and `npm run data:setup` for the pinned parser environment.
- Guild Wars Wiki availability is required only for manual production discovery/fetch. Tests, fixture generation, selected replay, build, and `npm run verify` remain offline.
- Maintainer review capacity is required for the source plan, identity registry changes, source-policy dispositions, warning dispositions, first baseline, and any scope amendment.

## Open Questions

No open question blocks this non-interactive sprint. Use these defaults unless a phase gate produces contrary evidence:

1. **Artifact shape**: use two catalogs, two manifests, and two QA reports generated as one release set. Do not choose a combined catalog merely to avoid narrow pipeline work.

2. **Source authority**: start with `Equipment template format`, `Weapon`, `Weapon upgrade`, and `Inscription`, plus only digest-planned detail/mechanics pages and metadata-only `imageinfo`. Phase 1 verifies exact titles and records any amendment.

3. **Identity**: use one namespace-aware registry with separate `WeaponId` and `WeaponModifierId` namespaces. Template IDs remain crosswalks.

4. **Weapon granularity**: create one record per selectable semantic base variant. Split bow/caster variants when damage, requirement, item mapping, or compatibility differs; do not split cosmetic skins.

5. **Compatibility vocabulary**: normalize component family separately from occupied `prefix`, `suffix`, or `inscription` slot. Add another slot only when the reviewed source shape cannot be represented without losing semantics.

6. **Effect precision**: structure deterministic and source-clear chance facts. Keep uncertain HCT/HSR, mastery, conditional, and interaction behavior note-only or unknown.

7. **Template integration**: add lookups and an immutable resolution view, but preserve the EPIC-05 codec and raw document as the export authority.

8. **Runtime integration**: leave `src/app/catalogs.ts` unchanged. Promotion makes the catalogs eligible for a later explicit consumer; it does not authorize current editor wiring.

9. **Promotion failure**: if live acquisition, selected replay, review, or either release gate cannot complete, retain passing implementation work but leave BW-1206/BW-1207, EPIC-12, SPRINT-013, and the ledger incomplete or blocked.

10. **Approval**: final planning approval is automatic because the sprint is dependency ordered, internally consistent, bounded by explicit amendment and promotion gates, and executable without interactive decisions.