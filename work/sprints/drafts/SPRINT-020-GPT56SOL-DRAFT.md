---
id: SPRINT-020
title: Composer Attribute Adjustments
status: planned
source_target: EPIC-19
source_epic: EPIC-19
source_epic_path: work/tickets/19-composer-attribute-adjustments/EPIC.md
tickets:
  - BW-1901
  - BW-1902
  - BW-1903
  - BW-1904
  - BW-1905
  - BW-1906
  - BW-1907
  - BW-1908
created: 2026-09-13
updated: 2026-09-13
---

# Sprint 020: Composer Attribute Adjustments

## Overview

This sprint adds local, authored attribute-adjustment intent to the focused composer without
changing what a Guild Wars skill template means. A user can choose one primary-profession rune tier
per attribute, choose one primary-profession headgear bonus, opt into or override a bounded set of
assumed effects, and see one explained preview rank used by every mounted skill display. Base
allocations remain the only ranks written to ordinary game codes and `.txt` template files.

The implementation extends `Build` to schema v3 with one nullable `attributeAdjustments` profile.
That profile stores only explicit compact equipment choices and effect preferences. Existing
semantic `Build.equipment`, raw template evidence, catalog facts, automatic effect states, effective
ranks, contribution totals, disclosure state, and tooltip state remain separate. Existing v1/v2
builds migrate to a neutral profile while the local-library key `build-wars:v1`, its v2 envelope,
and backup/build-set/party transfer envelope versions remain unchanged.

A new shared preview projection is the architectural center of the sprint. It resolves base rank,
legacy equipment, compact per-source replacements, supported effects, the uncapped total, and the
ordinary rank-20 preview cap. `composer-selectors.ts` and `editor-selectors.ts` consume the same
projection so attribute rows, catalog descriptions, skill-bar tooltips, and existing Expertise,
Mysticism, and Fast Casting cost/timing calculations cannot drift. Permanent equipment validation,
attribute-point spending, title ranks, weapon requirements, catalog records, and template legality
continue to use their existing contexts.

Current source observations at planning time are explicit execution inputs, not claimed test
results: HEAD is `41b5e41`; the promoted profession/attribute, skill, and rune catalogs are
`pa-e5d0d35ad8f30b4c`, `skills-9396e01d21481cd1`, and `runes-58a277f62fe92f2a`; the rune catalog
contains 126 attribute-rune records for 42 attributes and 30 unique canonical URL/SHA-1 media
identities across ten professions and three tiers. The promoted skill catalog contains template IDs
198, 1951, 2094, 2139, 3054, and 3431 with the mode and split facts required by the accepted brief.

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Authored state | Build v3 compact headgear/rune overrides and stable explicit effect preferences, including inactive remembered preferences. | Persisted derived ranks, inferred checkbox values, catalog snapshots, UI disclosure state, settings keyed globally by game code. |
| Equipment | Inline primary-profession tier choices, one headgear +1, per-contribution replacement of legacy semantic equipment, reset to inherited value. | Armor slots, insignias, weapons, total health/armor, equipment-template authoring, semantic armor conversion. |
| Effects | Glyph of Elemental Power, Elemental Lord, PvE Masochism, and external Heroic Refrain only. | Generic parsing, arbitrary arithmetic, consumables, combat order, duration/uptime/recast simulation, party buff propagation. |
| Rank projection | Shared ordinary-attribute preview, source breakdown, uncapped total, cap 20, scoped diagnostics. | Changing low-level permanent rank math, point budgets, title ranks, weapon procs, requirement/legality claims. |
| UI | Mounted focused composer, cached rune icons, numeric fallback, blue increased ranks, accessible explanations, advanced disclosure/count. | Remounting equipment, library, or party panels; a new library UI; a full stats or armor tab. |
| Persistence and transfer | Autosave/pagehide, active and inactive nested loadouts, duplicates, saved internals, existing full-document backup/build-set/party JSON. | A new storage key, outer envelope migration without demonstrated need, named-build formats, sidecars, new complete-build URLs/files. |
| Game interoperability | Existing exact-source/canonical base code, current folder Load/Save behavior, one extended replacement warning, one omission note. | Encoding adjustment metadata into game files, folder synchronization, codec changes, equipment code, share-URL v2. |
| Assets | Exactly the real attribute-rune images needed by the controls, local runtime map, provenance, deterministic bounded tooling. | Generated art, runtime hotlinks, non-attribute runes, broad catalog regeneration, unrelated skill-icon changes. |

## Assumptions

1. `Build.attributeAdjustments` is either `null` or one canonical profile. A canonical empty profile
   collapses to `null`; explicit None choices and explicit off preferences are not empty.
2. The profile shape is binding for this sprint:
   - `headgearOverride` is `null` (inherit), `{ kind: "none" }` (suppress), or
     `{ kind: "attribute", attributeId }` (replace with +1 on that attribute).
   - `runeOverrides` has at most one row per attribute. No row means inherit; a row contains either
     `{ kind: "none" }` or `{ kind: "rune", runeId }`.
   - `effectPreferences` has at most one row per supported logical effect, with `preference` equal
     to `on` or `off`. Self effects require `strength: null`; Heroic Refrain requires integer
     strength 1 through 4.
3. Compact known IDs are safe non-negative integers. An ID that is well formed but absent from the
   current catalog is retained as an unresolved selection, grants no bonus, and stays removable.
   Malformed IDs, duplicate target/effect rows, unsupported effect IDs, wrong parameter shapes, and
   out-of-range strengths reject the containing persisted build rather than partially dropping data.
4. Because explicit None is distinct from absence, each overridden equipment contribution gets a
   small “Use equipped value” reset. It removes that override and returns to inheritance; selecting
   None suppresses the inherited contribution. This is an affordance required by the settled state
   contract, not an armor editor.
5. Unknown legacy rune evidence with no resolvable target is retained and reported as a profile
   diagnostic but grants no rank by policy. A compact unresolved selection is scoped to its authored
   attribute. One unresolved source does not turn unrelated attributes into rank zero or disable an
   otherwise eligible effect.
6. An automatic self effect is derived independently for each skill slot from the mode-resolved
   catalog/template identity, current profession pair, and mode. Unrelated invalid skills do not
   disable it. Forced-on is a remembered request, not a legality bypass.
7. Heroic Refrain is always the single external logical effect. Template ID 3431 supplies identity
   and icon facts only; its presence on the recipient's bar never makes it automatic or creates a
   second contribution.
8. “Available ordinary attributes” means the resolved primary profession's attributes plus the
   secondary profession's non-primary-only attributes. It includes rank-zero rows and excludes
   title ranks and unavailable primary attributes from other professions.
9. Rank 20 is applied only by the new preview projection after supported temporary effects. The
   existing `calculateEffectiveAttributeRank` helper remains uncapped and continues serving
   permanent equipment/requirement contexts.
10. The existing whole-document persistence fingerprints already provide the right dirty/autosave
    boundary once the new profile is included by all constructors and cloners. Template projection
    and `skillTemplateFingerprint` intentionally remain adjustment-blind.
11. No browser-automation package is added. BW-1908 requires real manual browser evidence. If an
    appropriate browser or source host is unavailable, the evidence gap is recorded and the affected
    ticket/acceptance item remains open rather than being waived.
12. Live rune download is an explicit bounded execution step. The promoted catalog is the selection
    authority; network data cannot broaden the 126-record/30-asset set or rewrite promoted catalogs.

## Use Cases

1. **Choose a rune inline**: On a primary-profession attribute row, a user selects None, +1, +2, or
   +3 with real local rune art, a persistent numeric label, and an accessible name that includes the
   rune name and its own health penalty where applicable.
2. **Replace, suppress, or re-inherit legacy gear**: A compact choice replaces only the addressed
   headgear or highest-rune contribution. None suppresses it, and reset returns that source to the
   unchanged semantic equipment record.
3. **Choose one headgear bonus**: A user assigns a clearable +1 headgear bonus to exactly one primary
   attribute using one keyboard-operable radio group.
4. **Edit a zero-base attribute**: A rank-zero primary attribute can receive a compact gear bonus or
   supported effect without spending points or materializing a base allocation row.
5. **Use secondary-profession effects**: A secondary Elementalist receives legal elemental effects
   but never sees Elementalist rune/headgear controls; a secondary Necromancer receives only the
   ordinary Masochism targets available to that profession pair.
6. **Understand a modified rank**: A blue preview rank exposes base, headgear, rune, each active
   effect, uncapped total, cap, and unresolved evidence through pointer, keyboard, and touch access.
7. **Infer supported self effects**: Legal mode-resolved Glyph, Lord, and PvE Masochism sources on the
   current bar become active automatically, with duplicate slots and both Lord factions counted once.
8. **Override and recover inference**: A user forces a self effect on or off, keeps that preference
   through removal, mode/profession changes and reload, sees why it is currently inactive, and resets
   it to automatic.
9. **Assume an external Refrain**: A user explicitly enables Heroic Refrain, chooses +1 through +4,
   and sees the bounded bonus across available ordinary attributes without party simulation.
10. **Read consistent skill calculations**: Catalog rows, alternate catalog views, bar tooltips,
    description progressions, and existing inherent-attribute cost/timing facts all use the same
    preview rank.
11. **Resume local work**: Reload, pagehide flush, selected-loadout switches, duplicate variants,
    active/inactive builds, saved-record internals, backup, build-set transfer, and party transfer
    preserve explicit settings and recompute automatic state.
12. **Keep game templates clean**: Bonus-only edits dirty the browser draft but leave exact-source
    and canonical base codes unchanged. Ordinary imports clear explicit adjustments, infer supported
    self effects from the imported bar, and leave external Refrain off.
13. **Cancel safely**: Invalid or canceled import, denied folder access, canceled overwrite, failed
    write, and fallback-download failure do not mutate the draft or original file.
14. **Preview files in isolation**: Hover/focus previews in the file browser use the candidate file's
    professions, base ranks, mode, and skills, never the current editor's compact gear or effects.
15. **Recover missing assets or selection**: A missing rune image leaves a labeled tier control and
    readable numeric value; a no-selected-loadout state mounts no adjustment controls or phantom
    build.

## Architecture

### Authored Versus Derived State

| Fact | Owner | Persistence | Template/code projection |
| --- | --- | --- | --- |
| Base profession, allocations, skills | `Build` existing fields | Yes | Yes |
| Semantic armor and unresolved import evidence | `Build.equipment` / raw overlay | Yes | Existing behavior only |
| Compact headgear/rune replacements | `Build.attributeAdjustments` | Yes | No |
| Explicit effect on/off and Refrain strength | `Build.attributeAdjustments` | Yes | No |
| Automatic effect defaults and eligibility | Shared preview projection | No | No |
| Equipment-adjusted, uncapped, and capped ranks | Shared preview projection | No | No |
| Contribution labels, inactive reasons, active count | Shared preview projection/selectors | No | No |
| Disclosure, popover, hover, pinned, and focus state | React component state | No | No |
| Rune catalog facts and runtime image map | Promoted catalog/local generated manifest | Repository assets only | No |

The new domain module `src/domain/attribute-adjustments.ts` owns stable types, canonicalization,
bounds, effect IDs, exact source template IDs, target definitions, and initial behavior. It does not
import React, browser APIs, generated JSON, or app state. `Build` carries the nullable profile, and
`src/app/attribute-adjustment-state.ts` owns catalog-free mutation actions and lifecycle cleanup.

### Equipment Precedence

Headgear and rune sources are resolved separately. There is never a combined “legacy equipment
bonus plus compact bonus” layer.

| Compact state for a source | Effective contribution | Legacy evidence |
| --- | --- | --- |
| Override absent | Inherit the corresponding resolved legacy contribution | Preserved unchanged |
| Explicit None | Zero for that source | Preserved unchanged and suppressed only in preview |
| Explicit selection | Use the selected headgear +1 or exact selected rune effect | Preserved unchanged and replaced only in preview |
| Selected ID unresolved/incompatible | Zero plus a source-scoped diagnostic | Preserved; compact selection remains removable |

The headgear override addresses the one global headgear contribution. Each rune override addresses
the highest rune contribution for its own attribute. A selected rune must uniquely resolve to an
attribute rune, match the row's attribute and primary armor profession, and carry the expected
highest-stacking effect; otherwise it contributes zero. Major/superior health penalties are labels
and source facts only in this sprint, not inputs to a total-health calculation.

An actual primary-profession change clears only `headgearOverride` and `runeOverrides`, retaining
effect preferences, semantic equipment, raw template evidence, and unrelated authored facts.
Setting the same primary is a reducer no-op. Selecting Any is an actual change and therefore clears
compact gear. Secondary changes retain compact primary gear and only re-evaluate effect eligibility.

Hidden semantic armor actions use an explicit address contract:

- headgear set/clear clears only the compact headgear override;
- rune set/clear receives the old/new affected attribute IDs resolved by the app planner and clears
  only those compact rune overrides;
- reset-equipment clears all compact gear overrides but retains effect preferences;
- insignia and weapon actions clear no compact adjustment state.

This keeps the reducer catalog-free and prevents an unmounted legacy surface from silently disagreeing
with compact choices if it is used later.

### Shared Preview Projection

`src/domain/attribute-preview.ts` provides one pure `projectBuildAttributePreview` boundary. It
accepts the build and narrow profession/attribute, rune, and skill catalog views; it returns a map of
ordinary attribute results plus logical effect states and profile diagnostics.

```text
Build base allocation
  -> validate unique attribute and purchased base rank
  -> resolve legacy headgear/rune by source
  -> apply compact inherit / None / replacement policy
  -> derive gated, deduplicated logical effects
  -> retain uncapped sum and expose min(uncapped, 20) preview
```

Each attribute result includes `baseRank`, `equipmentRank`, `uncappedRank`, `previewRank`,
`capped`, ordered nominal contributions, and structured unresolved reasons. Cap clipping is not
assigned arbitrarily to a particular effect: the breakdown lists every nominal active contribution,
then the uncapped sum and “ordinary preview capped at 20.” This also lets the active-effect count
include a legal effect whose entire nominal amount is clipped.

Invalid base ranks, duplicate allocations, unknown attributes, and unsafe arithmetic return an
unresolved attribute result and are never clamped into validity. A UI consumer displays the authored
numeric fallback in neutral styling with an explicit unresolved explanation; it never presents a
blue zero. Unallocated legal attributes resolve from base zero. Source diagnostics with a known
target stay on that target; unknown preserved legacy evidence is reported at profile level and grants
no contribution under the settled policy.

`calculateEffectiveAttributeRank` remains the uncapped primitive used by existing permanent
equipment and weapon-requirement code. The preview projection may reuse it internally but does not
change its result contract. `equipment-selectors.ts`, `weapon-set.ts`, permanent validation, and
title-rank selectors must not start consuming temporary assumptions.

### Effect Registry and Gates

Definitions use exact promoted template identity. Names and description prose may be shown but are
never used to resolve or calculate an effect.

| Logical effect ID | Source template IDs | Mode/source behavior | Target and nominal contribution |
| --- | --- | --- | --- |
| `glyph-of-elemental-power` | 198 | Legal self source; automatic from resolved bar in PvE/PvP | +2 to Air 8, Earth 9, Fire 10, Water 11 |
| `elemental-lord` | 1951, 2094 | Legal PvE self source; faction variants and duplicates dedupe | +1 to Air 8, Earth 9, Fire 10, Water 11 |
| `masochism` | 2139; 3054 explicitly excluded | Legal resolved PvE self source only; split resolves by build mode | +2 to Death 5 and Soul Reaping 6 when each target is available |
| `heroic-refrain` | 3431 identity only | External, PvE, off without explicit preference; never inferred from recipient bar | Configured +1..+4 to every available ordinary attribute |

For self effects, absence of a preference means automatic; forced-off wins over an otherwise
automatic source; forced-on still requires a present, resolved, legal source. For external Refrain,
absence means off. Effect preference rows are never deleted by skill, profession, or mode changes.
Reset deletes the row and re-evaluates the definition's default.

The projection evaluates source slots independently and deduplicates by logical effect ID after
mode-variant resolution. It does not consult aggregate build validity, so an unrelated invalid skill
cannot suppress a valid effect. An active effect contributes only to the intersection of its target
set and available ordinary attributes. The collapsed count is the number of distinct active logical
effects with at least one such target, regardless of cap clipping.

### Consumer Boundary

| Consumer | Change | Explicit non-change |
| --- | --- | --- |
| `composer-selectors.ts` | Read row rank, compact gear controls, breakdown, and effect count from the shared projection. | Base increment/decrement costs and point gates remain unchanged. |
| `editor-selectors.ts` | Build tooltip progression rank maps and Expertise/Mysticism/Fast Casting ranks from the same projection. | Title-rank resolution remains separate. |
| `FocusedSkillCatalog`, `SkillBar`, `SkillTooltip`, legacy `SkillBrowser` | Continue receiving `selectSkillDisplay` views, now calculated with preview ranks. | No local rank calculation in components. |
| `equipment-selectors.ts`, `weapon-set.ts`, validation | Continue using permanent equipment/base contexts. | No temporary effects in requirements, legality, armor, health, or export validity. |
| `TemplatePreview` | Use the candidate import's isolated build state. | Never close over current-draft adjustment projection. |
| Template compatibility and share URL | Continue receiving projected base professions/attributes/skills only. | No codec, bitstream, URL grammar, or semantic fingerprint change. |

The selector implementation computes one projection per top-level selector invocation and passes it
through rank-context helpers rather than rebuilding equipment/effect state per progression series.
No memoization dependency is required unless profiling shows a problem; correctness and a single
composition boundary take priority over premature cache state.

### Persistence and Copy Boundaries

Build schema v3 is the only required schema bump. `validateBuild` reads v1/v2 with
`attributeAdjustments: null` and requires/strictly validates the new field for v3. The new nested
objects use exact key allowlists, dense bounded arrays, unique attribute/effect keys, recognized
discriminants, and bounded parameters. A future Build version remains unsupported and write-blocking
through the existing local-storage recovery contract.

Every deep copy of `Build` must clone the profile and its nested rows. The mandatory audit includes:

- `createBlankBuild`, template import construction, and empty preview fixtures;
- persistence `cloneBuild`, `concreteBuild`, hydration, working draft, and saved records;
- `cloneBuildForBuildSetEntry`, build-set/party duplicate/copy/materialization, active and inactive
  snapshots;
- backup/restore remaps, build-set transfer, and party transfer;
- test/shared fixtures and build-set comparison views.

The outer local-library v2 envelope, `build-wars:v1` key, backup v2 envelope, build-set transfer v1,
party transfer v1, and persisted build-set snapshot v2 remain stable because their nested Build is
self-versioned. Their byte limits change only if a maximum-sized valid fixture proves the existing
limit insufficient.

Whole-document fingerprints include the profile automatically after clone/materialization coverage.
The skill-template projection reads only existing base fields, so bonus-only changes dirty/autosave
the addressed loadout without changing exact-source eligibility or canonical game code.

### UI Composition

The mounted surface remains `App -> BuildComposer -> FocusedAttributeEditor`. No secondary panel is
remounted.

- `AttributeAdjustmentControls.tsx` renders row-local native radio groups for rune tiers and one
  cross-row headgear radio group, plus reset-to-inherited affordances. Tier text remains visible even
  when art fails.
- `AttributeRankBreakdown.tsx` turns the rank into a pointer-hover/focus disclosure with click/touch
  pinning, Escape/outside close, structured contribution text, and focus restoration. It reuses the
  existing viewport-aware popover patterns rather than relying on `title`.
- `AssumedEffectControls.tsx` renders a component-local advanced disclosure. Its summary always
  shows the contributing count; the count is also visible in the outer Attributes heading when that
  section is collapsed. Opening/closing either disclosure does not dispatch an editor action.
- Self-effect checkboxes show requested/automatic state separately from current active eligibility.
  A remembered forced-on but ineligible effect can remain visibly requested while an adjacent status
  explains why it contributes nothing. Reset returns to automatic.
- Heroic Refrain has a separate external label and a +1..+4 select. The disabled default selector
  displays +1; first enable persists on/+1 unless a strength was explicitly selected.

Desktop rows add compact equipment columns without changing the allocation arrows. At narrow widths,
the name/rank remains the first row and adjustment controls wrap into a labeled second row. Focus
order follows DOM order, touch targets remain usable, long labels wrap instead of overlapping, and
color is supplemented by accessible modified text and the breakdown trigger.

### Rune Asset Pipeline

`scripts/data/build_wars_ingest/rune_icon_assets.py` is a rune-specific bounded cache step rather
than a broad catalog regeneration. It reads only the promoted EPIC-10 catalog, selects the 126
attribute-rune records, joins each `iconId` to metadata, validates three tiers per attribute, and
deduplicates binaries by verified remote SHA-1/canonical media identity into exactly 30 local PNGs.

The tool builds all outputs in a temporary directory, validates HTTPS Guild Wars Wiki origins,
MIME/extension, dimensions, size caps, byte count, and SHA-1, then atomically publishes:

- `public/gww-icons/runes/` binaries and README;
- `src/app/rune-icon-assets.generated.json`, mapping all 126 rune IDs to local paths only;
- `data/generated/epic-10/rune-icon-assets.manifest.json`, recording source catalog version, source
  URLs, file titles, remote hashes/timestamps, local destinations, byte hashes, and dedup aliases.

The runtime manifest must contain no `http://` or `https://` value. `icon-assets.ts` remains the
app-owned resolver and `catalogs.ts` exposes an app-safe rune descriptor. Missing mapping/file/image
decode produces the normal labeled numeric control, never a remote fallback. ADR 0002, source-policy
exceptions, `.gitignore`, generated-data docs, and script docs get exact-path updates. No other rune
or skill catalog output is regenerated.

### Dependency Order

```text
BW-1901 contracts/source fixtures
  -> BW-1902 Build v3 and durable copy graph
  -> BW-1903 shared preview/effect projection
  -> BW-1904 bounded local rune assets
  -> BW-1905 inline gear and rank UI
  -> BW-1906 advanced effect UI
  -> BW-1907 game-template and full-document boundary proof
  -> BW-1908 real-browser evidence, docs, and closeout
```

BW-1904 depends only on BW-1901 and may be implemented alongside BW-1902/BW-1903, but its gate must
pass before BW-1905 consumes the runtime map. All other phases follow the ticket DAG exactly.

## Implementation

### Phase 0: BW-1901 Adjustment Contracts and Source Rules

**Files to create/modify:**

- `src/domain/attribute-adjustments.ts` - stable authored unions, logical effect registry, bounds,
  target IDs, exact source IDs, default behavior, and canonicalization helpers.
- `src/domain/index.ts` - export the new public domain contract.
- `test/domain/attribute-adjustments.test.ts` - identity, source, target, mode, count, and canonical
  shape fixtures.
- `compendium/attribute-adjustments.md` - record the selected concrete type names, reset/inheritance
  affordance, unresolved scoping, and hidden-reducer address contract.

**Tasks:**

- [ ] Record the planning baseline HEAD/catalog versions and source URLs without claiming a live
      source check that did not occur.
- [ ] Define the nullable profile and exact inherit/None/selection distinctions from Assumption 2.
- [ ] Define four logical effects and keep source template IDs separate from logical effect IDs,
      labels, target attributes, and configured Refrain strength.
- [ ] Assert template IDs 198, 1951, 2094, 2139, 3054, and 3431 against the promoted catalog,
      including PvE/PvP classification and Masochism's split group.
- [ ] Assert exact targets: elemental 8/9/10/11, Death 5, Soul Reaping 6; assert Energy Storage 12,
      Earth/Wind Prayers, titles, and unrelated attributes are excluded from those bounded effects.
- [ ] Assert the rune source matrix: 126 attribute records, 42 attributes with minor/major/superior,
      ten professions, and 30 unique canonical URL/SHA-1 identities.
- [ ] Freeze the contribution ordering and diagnostic scoping used by explanations; never parse
      localized names or descriptions.

**Checks:**

```sh
npm run test:run -- test/domain/attribute-adjustments.test.ts test/domain/rune-catalog.test.ts test/domain/skill-catalog.test.ts test/domain/effective-attribute-rank.test.ts
npm run typecheck
git diff --check
```

**Gate:** The authored shape, source registry, target matrix, precedence, lifecycle, unresolved
policy, and cap boundary are executable contracts before persisted state or controls depend on them.

### Phase 1: BW-1902 Authored State and Draft Persistence

**Files to create/modify:**

- `src/domain/build.ts`, `src/domain/build-set.ts` - Build v3 field and deep clone coverage.
- `src/app/attribute-adjustment-state.ts` - pure profile mutations, effect preference mutations,
  canonical null collapse, primary-change cleanup, and addressed legacy-equipment cleanup.
- `src/app/editor-state.ts`, `src/app/attribute-eligibility.ts`,
  `src/app/equipment-editor-state.ts` - actions, reducer delegation, same-primary no-op, profession and
  hidden armor lifecycle.
- `src/app/persistence-schema.ts` - v1/v2 migration, strict v3 validation, clone/hydrate support.
- `src/app/library-selectors.ts`, `src/app/build-set-comparison.ts` - update explicit empty preview
  constructor and expose adjustment differences without mounting new UI.
- `src/app/attribute-adjustment-state.test.ts`, `src/app/editor-state.test.ts`,
  `src/app/persistence-schema.test.ts`, `src/app/workspace-state.test.ts`,
  `src/app/build-set-state.test.ts`, `src/app/build-set-comparison.test.ts` - lifecycle, migration,
  dirty scope, selected/inactive loadouts, duplication, and comparison.
- `src/app/local-storage.test.ts`, `src/app/backup-restore.test.ts`,
  `src/app/build-set-transfer.test.ts`, `src/app/party-transfer.test.ts` - non-default round trips and
  failure protections.
- `test/fixtures/foundation.ts`, `test/fixtures/rule-engine/builds.ts`, and compiler-identified direct
  Build literals - add neutral `attributeAdjustments` without changing existing fixture semantics.

**Tasks:**

- [ ] Set `BUILD_SCHEMA_VERSION` to 3 and make every new/ordinary imported Build start with
      `attributeAdjustments: null`.
- [ ] Parse Build v1/v2 into v3 neutral state; require and strictly validate the profile field in v3.
- [ ] Reject sparse/oversized arrays, duplicate rune target IDs, duplicate effect IDs, unsupported
      discriminants/preferences, malformed IDs, wrong effect parameters, and Refrain strengths
      outside 1..4. Preserve unknown-but-well-formed rune/attribute selections.
- [ ] Keep the local library envelope/key and outer backup/transfer versions unchanged; prove future
      Build schemas and corrupt current records retain existing write blocking and diagnostics.
- [ ] Add reducer actions for headgear/rune select, explicit None, reset to inherit, effect on/off,
      reset to automatic, and Refrain strength. No action stores automatic active state.
- [ ] On an actual primary change, clear compact gear only. Preserve effect preferences, semantic
      equipment, raw overlay, titles, and secondary-independent facts. Same primary returns the
      existing state; secondary edits retain compact gear.
- [ ] Extend hidden armor actions with mandatory addressed contribution IDs and test exact cleanup:
      headgear only, old/new rune attributes only, all compact gear for equipment reset, none for
      weapon/insignia edits.
- [ ] Deep-clone the profile in `cloneBuildForBuildSetEntry` and persistence `cloneBuild`; audit all
      spread/remap paths for active and inactive entries, party slots, duplicate variants, and saved
      records.
- [ ] Prove a bonus-only editor action dirties only the selected loadout and changes the durable
      fingerprint/revision path, while component disclosure state cannot enter a snapshot.
- [ ] Round-trip non-default settings through autosave hydration, pagehide materialization, backup,
      build-set transfer, party transfer, record duplication, selected-loadout switching, and
      inactive nested snapshots.
- [ ] Exercise conflict, quota, unavailable storage, malformed/future schema, duplicate records,
      restore remap, and transfer byte-limit paths with new settings present.

**Checks:**

```sh
npm run test:run -- src/app/attribute-adjustment-state.test.ts src/app/editor-state.test.ts src/app/persistence-schema.test.ts src/app/local-storage.test.ts src/app/workspace-state.test.ts src/app/build-set-state.test.ts src/app/build-set-comparison.test.ts src/app/backup-restore.test.ts src/app/build-set-transfer.test.ts src/app/party-transfer.test.ts test/domain/build-set.test.ts test/domain/contracts.test.ts
npm run typecheck
git diff --check
```

**Gate:** One selected Build and every inactive/full-document copy carry the same explicit profile;
old data migrates neutrally; malformed/future data remains protected; no outer format or game-code
field has changed.

### Phase 2: BW-1903 Effective Ranks and Assumed Effects

**Files to create/modify:**

- `src/domain/attribute-preview.ts` - shared equipment/effect projection, rank cap, structured
  contributions, effect status, active count, and diagnostics.
- `src/domain/equipment-attribute-rank.ts` - expose source-addressed legacy contributions and scoped
  diagnostics needed by precedence; retain existing permanent summary behavior.
- `src/domain/index.ts` - export projection types/functions.
- `src/app/attribute-adjustment-selectors.ts` - app-ready projection/control/effect views.
- `src/app/composer-selectors.ts`, `src/app/editor-selectors.ts` - replace separate rank assembly with
  the shared projection.
- `test/domain/attribute-preview.test.ts`, `test/domain/equipment-attribute-rank.test.ts`,
  `src/app/attribute-adjustment-selectors.test.ts`, `src/app/composer-selectors.test.ts`,
  `src/app/editor-selectors.test.ts`, `src/app/skill-attribute-effects.test.tsx` - math, source,
  selector, description, and cost/timing fixtures.
- `test/domain/effective-attribute-rank.test.ts`, `test/domain/skill-attribute-effects.test.ts` -
  regression proof that low-level permanent contracts remain intact.

**Tasks:**

- [ ] Resolve available ordinary attributes from the current profession pair, including zero-base
      attributes and excluding titles/other-profession primary-only attributes.
- [ ] Resolve legacy headgear and highest rune separately, then apply compact precedence per source
      and per attribute without mutating `Build.equipment`.
- [ ] Derive automatic self-source presence from each mode-resolved slot using exact template ID and
      profession/mode gates. Deduplicate repeated slots and both Lord factions by logical effect ID.
- [ ] Apply explicit on/off preference after automatic derivation but before final eligibility;
      preserve a structured inactive reason for missing, unresolved, off-profession, wrong-mode, or
      unavailable-target states.
- [ ] Keep Refrain external, off by absence, PvE-gated, strength 1..4, and independent of recipient
      Leadership or bar presence.
- [ ] Return base, equipment-adjusted, uncapped, capped, contributions, diagnostics, and effect
      status without assigning cap loss to an arbitrary effect.
- [ ] Leave invalid base values and duplicate allocations unresolved. Treat an unallocated legal
      attribute as base zero.
- [ ] Use the projection in `selectFocusedAttributeRows` and the rank context inside
      `selectSkillDisplay`. Keep title rank maps separate and stop treating one unrelated equipment
      diagnostic as a reason to null every inherent rank.
- [ ] Prove all mounted and legacy skill display entry points receive the same preview ranks through
      `selectSkillDisplay`, including progression text and Expertise/Mysticism/Fast Casting facts.

**Required fixture matrix:**

- [ ] Base 12 + headgear 1 + superior rune 3 = equipment rank 16; replacing an inherited +1 rune
      with +3 contributes 3, never 4.
- [ ] Fire 12 + headgear 1 + rune 3 + Glyph 2 + Lord 1 = 19.
- [ ] Adding external Refrain +4 yields uncapped 23, preview 20, cap explanation present, and all
      three active effects counted even if a contribution is clipped.
- [ ] Glyph affects all four elemental attributes in both modes and does not affect Energy Storage,
      Earth Prayers, or only spell-type display consumers.
- [ ] Lord 1951/2094 is PvE-only and counts once across faction variants/duplicate slots.
- [ ] Masochism 2139 affects Death/Soul in PvE; resolved 3054 in PvP supplies no bonus.
- [ ] A secondary Elementalist gets legal effect targets but no Elementalist equipment contribution;
      a secondary Necromancer does not gain unavailable Soul Reaping.
- [ ] Refrain affects ordinary available zero-base attributes, excludes titles and unavailable
      primaries, never self-infers, and does not double-count when 3431 is on the bar.
- [ ] Forced off, forced on while ineligible, reset, removal/re-addition, mode/profession changes,
      Any primary, no selected loadout, and reload produce deterministic statuses.
- [ ] Unknown compact rune, unknown legacy rune, duplicate base allocation, invalid base rank,
      missing catalogs, and unrelated invalid skill follow scoped diagnostic policy.

**Checks:**

```sh
npm run test:run -- test/domain/attribute-preview.test.ts test/domain/equipment-attribute-rank.test.ts test/domain/effective-attribute-rank.test.ts test/domain/skill-attribute-effects.test.ts src/app/attribute-adjustment-selectors.test.ts src/app/composer-selectors.test.ts src/app/editor-selectors.test.ts src/app/skill-attribute-effects.test.tsx src/app/skill-display.test.tsx src/app/skill-bar.test.tsx src/app/focused-skill-catalog.test.tsx
npm run typecheck
git diff --check
```

**Gate:** Every preview consumer agrees on source-aware rank math and effect state; the canonical
examples pass; permanent equipment, title, point, legality, and uncapped low-level contexts remain
unchanged.

### Phase 3: BW-1904 Local Rune Icon Assets

**Files to create/modify:**

- `scripts/data/build_wars_ingest/rune_icon_assets.py`, `scripts/data/cache_rune_icons.py` - bounded
  selection, deduplication, download, verification, atomic publication, and CLI.
- `scripts/data/build_wars_ingest/tests/test_rune_icon_assets.py` - offline catalog/media fixtures,
  path confinement, dedup, hash, failure/no-partial-write, and manifest tests.
- `package.json`, `scripts/data/README.md` - `data:rune-icons` command and documented live/offline
  behavior.
- `public/gww-icons/runes/*.png`, `public/gww-icons/runes/README.md` - exactly 30 verified real
  assets and source/tool note.
- `src/app/rune-icon-assets.generated.json` - 126-ID local runtime map with no remote URLs.
- `data/generated/epic-10/rune-icon-assets.manifest.json` - source and local provenance with 126/30
  summary counts.
- `src/app/icon-assets.ts`, `src/app/catalogs.ts` - exact-ID rune asset resolver and app descriptor.
- `src/app/icon-assets.test.ts`, `src/app/catalogs.test.ts`,
  `scripts/data/build_wars_ingest/tests/test_rune_icon_assets.py` - runtime local-only mapping and
  fallback coverage.
- `test/domain/source-policy.test.ts` - exact allowlist and no-runtime-hotlink policy coverage.
- `compendium/decisions/0002-runtime-gww-icon-assets.md`, `compendium/source-policy.md`,
  `compendium/runes-catalog.md`, `data/generated/README.md`, `.gitignore` - exact rune-path,
  provenance-manifest, and policy exception.

**Tasks:**

- [ ] Select only `familyKind: "attribute"` records and fail before writes unless the source matrix
      is exactly 126 records, 42 attributes x three tiers, ten professions, and 30 unique hashes.
- [ ] Resolve media only through each rune's `iconId` and the promoted catalog's `remoteMedia`;
      reject missing, duplicate, disallowed-origin, malformed MIME/dimension/size/hash metadata.
- [ ] Deduplicate by remote SHA-1/canonical identity, use deterministic profession/tier local names,
      and map every eligible rune ID to its shared local asset.
- [ ] Require `--allow-live-network` for downloads, bound response bytes/time/retries, validate final
      redirect origin, and verify bytes before replacing any checked-in output.
- [ ] Support manifest-only/offline fixture construction for tests; tests never require the wiki.
- [ ] Record canonical URL, description/file title, source ID, remote timestamp/SHA-1, MIME,
      dimensions, remote/local bytes, local SHA-256/path, and every aliased rune ID in provenance.
- [ ] Extend ADR 0002 only for `public/gww-icons/runes/`, the rune runtime map, and the EPIC-10 rune
      asset manifest. Add exact `.gitignore` exceptions; do not weaken broad generated-data ignores.
- [ ] Ensure runtime manifests/descriptors contain local `/gww-icons/runes/...` paths only and that a
      missing mapping or broken image retains the numeric/text control.
- [ ] Inspect the 30 resulting files and manifest counts. If required bytes cannot be fetched and
      verified, record the source-access limitation and keep BW-1904/BW-1908 open.

**Checks:**

```sh
PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_icon_assets
npm run test:run -- src/app/icon-assets.test.ts src/app/catalogs.test.ts test/domain/source-policy.test.ts test/domain/rune-catalog.test.ts
jq '.summary | {runeCount, runtimeRuneIconCount, uniqueAssetCount, unresolvedRuneCount}' data/generated/epic-10/rune-icon-assets.manifest.json
jq '[.assetsByRuneId[] | .src | startswith("/gww-icons/runes/")] | all' src/app/rune-icon-assets.generated.json
test "$(find public/gww-icons/runes -type f -name '*.png' | wc -l | tr -d ' ')" = 30
! rg -n 'https?://' src/app/rune-icon-assets.generated.json public/gww-icons/runes
git diff --check
```

**Gate:** All 126 supported rune IDs resolve through 30 verified local real assets, provenance and
policy name every committed path, runtime has no remote image source, and the labeled fallback works.

### Phase 4: BW-1905 Inline Runes, Headgear, and Blue Ranks

**Files to create/modify:**

- `src/app/components/AttributeAdjustmentControls.tsx` - rune segment groups, headgear group,
  source/reset labels, local icons, and accessible fallback.
- `src/app/components/AttributeRankBreakdown.tsx` - hover/focus/touch breakdown and focus lifecycle.
- `src/app/components/FocusedAttributeEditor.tsx` - integrate row controls, effective rank trigger,
  and outer collapsed count location without changing base arrows.
- `src/app/composer-selectors.ts`, `src/app/attribute-adjustment-selectors.ts` - UI-ready primary
  eligibility, selected/inherited state, descriptors, health-penalty labels, and breakdown.
- `src/app/styles.css` - desktop columns, blue rank token, focus/selected states, popover, and narrow
  wrapping.
- `src/app/attribute-adjustment-controls.test.tsx`, `src/app/attribute-editor.test.tsx`,
  `src/app/build-composer.test.tsx`, `src/app/composer-selectors.test.ts` - interaction, eligibility,
  rank, fallback, layout-class, and no-selection tests.

**Tasks:**

- [ ] Render primary-profession rows with one native radio group for None/+1/+2/+3. Resolve the exact
      rune record for each attribute/tier; keep `+N` visible and include full rune/penalty/source text
      in accessible labels.
- [ ] Derive the displayed selected tier from the compact override when present or resolved legacy
      contribution when inherited. Label inherited state and expose “Use equipped value” only when a
      compact override exists.
- [ ] Render one native headgear radio group across eligible primary rows plus explicit Clear
      (suppress) and Use equipped value (inherit) actions. Prove global mutual exclusion.
- [ ] Omit gear controls for secondary rows, retained illegal/unresolved rows, Any/unresolved primary,
      and no-selected-loadout state. Keep effect-derived ranks available on legal secondary rows.
- [ ] Leave allocation arrows, marginal costs, point budget, maximum purchased rank, ordering, raw
      row retention, and collapse behavior unchanged. Allow gear actions at base rank zero.
- [ ] Render `previewRank` in blue only when resolved and greater than base. Equal/lower/unresolved
      states use neutral styling and accessible non-color text.
- [ ] Make the rank/breakdown trigger work on hover, focus, Enter/Space, touch/click, Escape, and
      outside click, with focus restoration and viewport-safe positioning. Include base, every known
      contribution, unresolved source notes, uncapped total, and cap text.
- [ ] At 390px, wrap equipment controls below the rank/name rather than hiding them. Verify long
      labels, five primary attributes, both themes, and 200% zoom in BW-1908.
- [ ] Test same-primary no-op, actual-primary cleanup, secondary retention, explicit None versus
      inherit, selected unknown rune removal, and legacy data preservation through UI actions.

**Checks:**

```sh
npm run test:run -- src/app/attribute-adjustment-controls.test.tsx src/app/attribute-editor.test.tsx src/app/build-composer.test.tsx src/app/composer-selectors.test.ts src/app/attribute-adjustment-state.test.ts src/app/catalog-icon.test.tsx src/app/icon-assets.test.ts
npm run typecheck
npm run build
git diff --check
```

**Gate:** Primary-only compact gear is mutually exclusive, reversible, keyboard accessible, usable
at rank zero, and backed by the shared projection; blue rank and breakdown never change base points
or game code.

### Phase 5: BW-1906 Advanced Assumed-Effect Controls

**Files to create/modify:**

- `src/app/components/AssumedEffectControls.tsx` - advanced disclosure, self-effect checkboxes,
  reset/status copy, external Refrain strength, icons, and active count.
- `src/app/components/FocusedAttributeEditor.tsx`, `src/app/styles.css` - mount and responsive/focus
  styling; preserve UI-only disclosure state.
- `src/app/attribute-adjustment-selectors.ts`, `src/app/composer-selectors.ts` - effect control views,
  requested/automatic/active distinctions, source icon records, and count.
- `src/app/assumed-effect-controls.test.tsx`, `src/app/attribute-editor.test.tsx`,
  `src/app/editor-state.test.ts`, `src/app/workspace-state.test.ts` - component/reducer/autosave
  lifecycle.

**Tasks:**

- [ ] Show a self effect when a supported source identity is present or a retained explicit
      preference exists. Never enumerate arbitrary skills or parse descriptions.
- [ ] Display whether the checkbox is automatic or explicitly on/off, whether it currently
      contributes, and a structured reason when a remembered request is gated inactive.
- [ ] Toggle automatic-on to forced-off, automatic-off to forced-on, and expose Reset only for an
      explicit preference. Reset deletes the preference and immediately recomputes automatic state.
- [ ] Keep preferences through source removal/re-addition, faction duplicate changes, mode and
      profession changes, unrelated edits, selected-loadout switches, and reload.
- [ ] Render Heroic Refrain separately as external, initially off, with labeled +1..+4 strength;
      first enable persists +1 and later off/on retains the last explicit strength.
- [ ] Use existing local skill icon descriptors for effect sources with a labeled fallback. Pick a
      deterministic representative source for deduplicated Lord while retaining all matching source
      slots in the explanation.
- [ ] Show distinct contributing-effect count in the advanced summary and when the outer Attributes
      section is collapsed. Exclude inactive/remembered-off effects; include active capped effects.
- [ ] Prove disclosure open/close, hover, and focus state produce no persisted mutation or dirty
      transition.

**Checks:**

```sh
npm run test:run -- src/app/assumed-effect-controls.test.tsx src/app/attribute-editor.test.tsx src/app/attribute-adjustment-selectors.test.ts src/app/attribute-adjustment-state.test.ts src/app/editor-state.test.ts src/app/workspace-state.test.ts src/app/skill-display.test.tsx src/app/skill-attribute-effects.test.tsx
npm run typecheck
npm run build
git diff --check
```

**Gate:** Automatic, explicit, inactive-remembered, reset, external strength, deduplication, and
collapsed count states agree with the projection and persist only intentional authored preferences.

### Phase 6: BW-1907 Game Template and Transfer Boundaries

**Files to modify/prove:**

- `src/app/template-import.ts` - add authored adjustments to the existing replacement warning only.
- `src/app/components/InlineTemplateCode.tsx`,
  `src/app/components/TemplateBrowserDialog.tsx`, `src/app/components/TemplatePreview.tsx` - concise
  omission note and explicit isolated preview state.
- `src/app/template-workflow.ts`, `src/app/template-files.ts`, `src/app/share-url.ts` - regression
  targets; no format or codec change expected.
- `src/app/template-workflow.test.ts`, `src/app/inline-template-code.test.tsx`,
  `src/app/template-browser.test.tsx`, `src/app/template-dialogs.test.tsx`,
  `src/app/template-files.test.ts`, `src/app/share-url.test.ts`, `src/app/App.test.tsx` - unchanged
  code, transactional import, omission copy, preview isolation, and file failures.
- `src/app/persistence-schema.test.ts`, `src/app/workspace-state.test.ts`,
  `src/app/build-set-state.test.ts`, `src/app/backup-restore.test.ts`,
  `src/app/build-set-transfer.test.ts`, `src/app/party-transfer.test.ts` - full-document cross-checks
  with active/inactive non-default profiles.
- `test/template-compatibility/**` - codec/fingerprint regression only.

**Tasks:**

- [ ] Prove adjustment changes do not enter `projectEditorToSkillTemplate`,
      `skillTemplateFingerprint`, bare/chat code, share fragments, or `.txt` bytes.
- [ ] Compare exact-source and canonical outputs before/after headgear, rune, effect preference, and
      Refrain-strength-only edits; outputs remain byte/equivalence identical while workspace dirty
      state changes.
- [ ] Add “authored attribute adjustments” to the current equipment/title replacement warning. Use
      the same confirmation and existing dirty guard; add no adjustment-specific prompt.
- [ ] On successful ordinary inline/file/share import, replace with a neutral profile; derive self
      effects from the new bar and leave Refrain off. Invalid parse/resolution, warning cancel, and
      dirty-guard cancel retain every previous authored field.
- [ ] Show a nonblocking note near inline/file export when explicit adjustment metadata exists or
      the current preview differs from base: adjustments stay in the browser draft and are not
      written to Guild Wars skill templates.
- [ ] Keep folder picker permissions, stored directory handle, fresh read before Load, overwrite
      confirmation, filename rules, stream-close success, fallback download, and post-success build
      naming unchanged. A successful Save changes no adjustment setting.
- [ ] Make file-preview construction start from an isolated neutral Build using the file's own
      imported bar/mode. Test a current editor with headgear/rune/Refrain +4 cannot leak into hover or
      focus previews.
- [ ] Re-prove current backup/build-set/party transfers, duplicate IDs, selected/inactive entries,
      restore remaps, oversized/malformed/future inputs, and one-time preview application.
- [ ] Never write a live Guild Wars folder in automated tests.

**Checks:**

```sh
npm run test:run -- src/app/template-workflow.test.ts src/app/inline-template-code.test.tsx src/app/template-browser.test.tsx src/app/template-dialogs.test.tsx src/app/template-files.test.ts src/app/share-url.test.ts src/app/App.test.tsx src/app/persistence-schema.test.ts src/app/workspace-state.test.ts src/app/build-set-state.test.ts src/app/backup-restore.test.ts src/app/build-set-transfer.test.ts src/app/party-transfer.test.ts test/template-compatibility
npm run typecheck
npm run build
git diff --check
```

**Gate:** Ordinary game interoperability remains base-only and transactional, file previews are
isolated, successful saves preserve browser-only settings, and all existing complete-document paths
round-trip the richer Build.

### Phase 7: BW-1908 Browser Verification and Closeout

**Files to modify/create:**

- `compendium/attribute-adjustments.md` - change from planned direction to shipped contract and list
  exact limitations/evidence.
- `compendium/game-rule-engine.md` - document preview versus permanent rank contexts and effect
  registry boundary.
- `compendium/template-files.md` - document adjustment omission, replacement, save-preservation, and
  isolated preview behavior.
- `compendium/runes-catalog.md`, `compendium/source-policy.md`,
  `compendium/decisions/0002-runtime-gww-icon-assets.md`, `data/generated/README.md`,
  `scripts/data/README.md`, `public/gww-icons/runes/README.md` - final asset/provenance contract.
- `work/roadmap.md` - mark this bounded composer milestone shipped while keeping armor integration,
  named builds, and complete-build transfer interfaces deferred.
- `work/sprints/SPRINT-020.md` - record actual command and browser evidence during execution.
- `work/tickets/19-composer-attribute-adjustments/EPIC.md` and `BW-1901` through `BW-1908` - actual
  sprint/evidence links and status only after each gate passes.
- `work/sprints/ledger.tsv` and
  `work/runs/ticket-burn/EPIC-19/20260914T004651Z/plan-EPIC-19-result.json` - runner-owned final
  status/manifest reconciliation.
- `work/runs/sprint-020/browser/` - ignored raw browser notes/screenshots; summarize durable evidence
  in the sprint/tickets.

**Tasks:**

- [ ] Run all focused suites from prior phases, then the complete offline repository verification and
      whitespace check. Fix only regressions caused by this sprint.
- [ ] Start the production-equivalent app locally and record browser name/version, OS, commit, catalog
      versions, theme, viewport, zoom, scenario, result, and screenshot path for every browser row.
- [ ] Capture the base visual matrix: 1280px, 900px, and 390px in both themes, plus 200% zoom in both
      themes. Use a profession with five attribute rows and long labels.
- [ ] At each relevant size, inspect None/+1/+2/+3 icons/numbers, global headgear choice, blue rank
      against `prior-art/gw-skills-and-attributes-refs/attributes-section.png`, neutral/unresolved
      rank, breakdown placement, cap text, advanced count, long wrapping, focus indicators, and no
      overlap/obscured controls.
- [ ] Exercise pointer, keyboard-only, and touch/device-emulated operation: radio movement,
      mutual exclusion, clear/inherit reset, checkbox/reset, Refrain strength, disclosure, rank
      breakdown pin/close, Escape, outside click, and focus restoration.
- [ ] Verify canonical math in browser, including 12+1+3=16, Fire 19, and Refrain-capped 20 with
      uncapped 23. Check catalog row, skill bar, tooltip description, and cost/timing agreement.
- [ ] Verify automatic/manual lifecycle across skill removal/re-addition, duplicate/faction Lord,
      PvE/PvP Masochism, profession/mode changes, external Refrain, reload, selected/inactive loadout
      switches, and no selected loadout.
- [ ] Block or remove one rune image request in browser devtools and prove its tier number/accessibility
      remains usable without any runtime remote fetch.
- [ ] Use a disposable copied Skills folder, never a live folder. Exercise fresh reread, Load,
      adjustment-only edit, Save, overwrite confirm/cancel, denied/canceled permission, write failure,
      reload, and a browser/environment without File System Access for fallback download. Compare
      saved text to the base code and prove draft settings survive Save.
- [ ] Record canceled/invalid imports retaining all settings and ordinary successful import clearing
      explicit settings while automatic self effects re-derive.
- [ ] Update docs to describe only mounted UI and actual behavior. Keep named-library/complete-build
      formats, armor editing, and party simulation explicitly deferred.
- [ ] Close each ticket only with its own evidence; if real browser or verified asset evidence is
      unavailable, document the gap and leave BW-1908/EPIC-19 open.
- [ ] Reconcile sprint, eight tickets, epic, ledger, and burn result manifest after all required
      checks pass.

**Checks:**

```sh
npm run test:run -- src/app test/domain test/template-compatibility
npm run data:test
npm run verify
git diff --check
git status --short
```

Manual launch command:

```sh
npm run dev -- --host 127.0.0.1
```

**Required browser evidence table:**

| Scenario | Required evidence |
| --- | --- |
| 1280px light/dark | Full configured rows, local icons, blue/neutral ranks, expanded breakdown/effects, skill displays. |
| 900px light/dark | Wrapped but aligned controls, long names, five attribute rows, no clipped popovers. |
| 390px light/dark | Stacked control rows, touch targets, pinned breakdown, collapsed count, no horizontal loss. |
| 200% zoom light/dark | Complete keyboard path, visible focus, readable contribution/cap copy, no hidden action. |
| Missing rune image | Numeric and accessible fallback; no hotlink or removed control. |
| No selected loadout | No phantom projection/control state; recovery actions remain usable. |
| Reload/nested loadouts | Explicit choices retained in selected and inactive builds; automatic state recomputed. |
| Disposable Skills folder | Permission/cancel/overwrite/failure/fallback behavior and base-only file bytes. |

**Gate:** Automated verification is green and the complete real-browser/file matrix has honest,
durable evidence. Only then may BW-1908, EPIC-19, and SPRINT-020 be marked complete.

## Files Summary

| File or area | Action | Purpose |
| --- | --- | --- |
| `src/domain/attribute-adjustments.ts` | Create | Authored profile, bounds, stable effect registry, canonicalization. |
| `src/domain/attribute-preview.ts` | Create | Single source-aware preview and effect projection with cap/explanations. |
| `src/domain/build.ts` | Modify | Build schema v3 and nullable adjustment profile. |
| `src/domain/build-set.ts` | Modify | Deep-clone new profile for variants/copies. |
| `src/domain/equipment-attribute-rank.ts` | Modify | Source-addressed legacy contribution/scoped diagnostic handoff. |
| `src/domain/index.ts` | Modify | Export new contracts/projection. |
| `src/domain/effective-attribute-rank.ts` | Preserve/test | Remain uncapped low-level permanent primitive. |
| `src/domain/skill-attribute-effects.ts`, `src/domain/skill-tooltip.ts` | Preserve/test | Consume caller-supplied preview ranks; no effect inference here. |
| `src/app/attribute-adjustment-state.ts` | Create | Catalog-free authored mutations and lifecycle cleanup. |
| `src/app/attribute-adjustment-selectors.ts` | Create | App-ready projection, controls, breakdown, and effect views. |
| `src/app/editor-state.ts`, `src/app/attribute-eligibility.ts` | Modify | Actions, same-primary no-op, profession cleanup. |
| `src/app/equipment-editor-state.ts` | Modify | Exact hidden legacy reducer invalidation. |
| `src/app/composer-selectors.ts`, `src/app/editor-selectors.ts` | Modify | Share one preview across rows and all skill displays. |
| `src/app/persistence-schema.ts` | Modify | v1/v2-to-v3 migration, strict validation, deep clone/hydration. |
| `src/app/library-selectors.ts` | Modify | Update explicit empty Build constructor. |
| `src/app/build-set-comparison.ts` | Modify | Report adjustment differences in existing comparison internals. |
| `src/app/workspace-state.ts`, `src/app/build-set-state.ts` | Preserve/test | Whole-document dirty/materialization/copy behavior should work through central clones. |
| `src/app/local-storage.ts`, `src/app/backup-restore.ts`, `src/app/build-set-transfer.ts`, `src/app/party-transfer.ts` | Preserve/test | Existing recovery and full-document envelopes; no outer version bump expected. |
| `src/app/template-workflow.ts`, `src/app/template-files.ts`, `src/app/share-url.ts` | Preserve/test | Base-only code, file, and URL formats. |
| `src/app/template-import.ts` | Modify | Extend existing discard warning with explicit adjustments. |
| `src/app/icon-assets.ts`, `src/app/catalogs.ts` | Modify | Local rune resolver and app-owned descriptor boundary. |
| `src/app/rune-icon-assets.generated.json` | Create | 126 rune-ID mappings to local paths only. |
| `src/app/components/AttributeAdjustmentControls.tsx` | Create | Rune/headgear controls and inherit reset. |
| `src/app/components/AttributeRankBreakdown.tsx` | Create | Accessible contribution/cap/unresolved explanation. |
| `src/app/components/AssumedEffectControls.tsx` | Create | Bounded self/external controls and active count. |
| `src/app/components/FocusedAttributeEditor.tsx` | Modify | Mount compact controls and shared rank views. |
| `src/app/components/InlineTemplateCode.tsx` | Modify | Nonblocking browser-only omission note. |
| `src/app/components/TemplateBrowserDialog.tsx`, `TemplatePreview.tsx` | Modify/test | Explicit candidate-file isolation and omission semantics. |
| `src/app/styles.css` | Modify | Blue rank, compact groups, popovers, disclosures, responsive/focus states. |
| `scripts/data/build_wars_ingest/rune_icon_assets.py` | Create | Bounded deterministic 126-to-30 asset pipeline. |
| `scripts/data/cache_rune_icons.py` | Create | CLI entry point. |
| `scripts/data/build_wars_ingest/tests/test_rune_icon_assets.py` | Create | Offline security/determinism/no-partial-write proof. |
| `public/gww-icons/runes/` | Create | 30 verified local rune PNGs and README. |
| `data/generated/epic-10/rune-icon-assets.manifest.json` | Create | Source/hash/path/dedup provenance. |
| `package.json`, `.gitignore` | Modify | Command and exact generated-manifest allowlist. |
| `test/domain/attribute-adjustments.test.ts`, `attribute-preview.test.ts` | Create | Contract, identity, math, lifecycle, cap, and boundary matrix. |
| Focused `src/app/*.test.ts(x)` | Create/modify | State, persistence, selector, component, template, transfer, and browser-adjacent proof. |
| Shared Build fixtures | Modify | Add neutral v3 field without changing unrelated scenarios. |
| `compendium/attribute-adjustments.md`, `game-rule-engine.md`, `template-files.md`, `runes-catalog.md`, `source-policy.md` | Modify | Durable shipped behavior and boundaries. |
| `compendium/decisions/0002-runtime-gww-icon-assets.md`, `data/generated/README.md`, `scripts/data/README.md` | Modify | Exact asset-policy/provenance/tool contract. |
| `work/roadmap.md` | Modify | Shipped milestone and explicit future cut line. |
| `test/template-compatibility/**` | Preserve/test | No codec, fingerprint, or bitstream behavior change. |
| Sprint/tickets/epic/ledger/burn manifest | Closeout only | Update only from actual verified execution evidence. |

## Definition of Done

### BW-1901

- [ ] The exact authored shape, inheritance/None/selection rules, reset affordance, lifecycle, source
      IDs, targets, cap context, and unresolved scoping are documented and fixture-backed.
- [ ] Promoted catalogs prove the six skill IDs, Masochism split, 126 attribute runes, ten
      professions, three tiers, and 30 unique media identities.
- [ ] Resolution/calculation uses stable IDs and structured catalog facts, never names or prose.

### BW-1902

- [ ] Build v3 persists one canonical nullable profile; v1/v2 migrate neutrally and future/malformed
      data remains write-blocking.
- [ ] The local key and outer envelope versions remain unchanged unless a tested necessity is
      documented.
- [ ] All constructors, clones, hydration, active/inactive nested loadouts, duplicates, saved
      records, autosave/pagehide, backups, build-set transfers, and party transfers preserve settings.
- [ ] Primary/secondary and hidden-armor mutation rules clear exactly the intended compact sources.
- [ ] Explicit adjustment edits dirty only the addressed loadout; UI-only disclosure does not.

### BW-1903

- [ ] One shared projection returns base, equipment, preview, uncapped, cap, contribution, effect,
      and diagnostic facts for ordinary attributes.
- [ ] 12+1+3=16; Fire+gear+Glyph+Lord=19; Refrain +4 produces capped 20 with uncapped 23 explained.
- [ ] Primary-only gear, secondary effects, duplicate/faction deduplication, PvE/PvP gates,
      preference lifecycle, Any, rank zero, invalid base, and unresolved evidence pass fixtures.
- [ ] Catalog, bar, tooltip, description, Expertise, Mysticism, and Fast Casting views agree.
- [ ] Permanent equipment, requirements, title ranks, point spending, legality, and catalogs remain
      outside temporary preview assumptions.

### BW-1904

- [ ] Exactly 30 verified real local rune files serve all 126 attribute-rune IDs for ten professions
      and three tiers.
- [ ] Runtime paths are local-only; provenance records source/file/hash/local identity and dedup.
- [ ] ADR/source policy, `.gitignore`, generated-data docs, script docs, and runtime map name exact
      approved paths.
- [ ] Missing image/mapping leaves a labeled +1/+2/+3 control; no generated art or hotlink exists.

### BW-1905

- [ ] Rune groups are mutually exclusive per primary attribute; headgear is globally exclusive,
      clearable, and resettable to inheritance.
- [ ] Equipment controls never appear for secondary/retained/Any/no-loadout contexts and work at
      base rank zero.
- [ ] Existing arrows, costs, budget, order, and base limits are unchanged.
- [ ] Blue styling appears only for a resolved increase and is supplemented by accessible text.
- [ ] Breakdown works by pointer, keyboard, and touch and names every contribution/cap/unresolved
      fact.
- [ ] Desktop, narrow, both-theme, zoom, long-label, and five-row browser evidence exists.

### BW-1906

- [ ] Glyph, Lord, and Masochism automatic states and explicit on/off/reset lifecycle match the
      projection across removal, re-addition, mode/profession change, reload, and duplicates.
- [ ] External Refrain is off by default, explicitly +1..+4, PvE-gated, and never self-inferred or
      double-counted.
- [ ] Inactive remembered preferences show a reason; checkboxes, count, ranks, and breakdown agree.
- [ ] Effect disclosure/count is keyboard accessible and does not dirty the build by opening.

### BW-1907

- [ ] Adjustment-only edits change authored dirty state but not exact-source or canonical skill code,
      share payload, or game-file bytes.
- [ ] Successful ordinary import clears explicit adjustments and re-derives only supported self
      defaults; invalid/canceled import preserves all prior state.
- [ ] Existing replacement copy is extended without an extra prompt, and applicable exports explain
      browser-only omission nonblockingly.
- [ ] Successful Save preserves adjustments; canceled/failed Load/Save preserves draft/original file.
- [ ] Standalone file previews cannot inherit current-draft bonuses.
- [ ] Existing full-document paths round-trip non-default active/inactive settings.

### BW-1908

- [ ] All focused suites, `npm run verify`, and `git diff --check` pass on the final tree.
- [ ] Real browser evidence records browser/version, viewport, zoom, theme, scenario, result, and
      screenshot for the required matrix; CSS/jsdom alone is not accepted.
- [ ] A disposable copied Skills folder proves base-only bytes, adjustment retention, fresh read,
      permission, cancel, overwrite, write completion/failure, reload, and fallback behavior.
- [ ] Durable docs describe only shipped mounted UI and keep named-library, complete-build transfer,
      armor management, generic effects, and party simulation deferred.
- [ ] All eight tickets, EPIC-19, SPRINT-020, ledger, and burn result manifest agree and link actual
      evidence; no missing required check is represented as passed.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Compact choices double-count semantic armor bonuses. | Medium | High | Resolve headgear/rune separately, apply explicit replacement table, and fixture inherit/None/selected for each source. |
| An unresolved legacy row poisons every rank or becomes a misleading blue zero. | Medium | High | Target diagnostics where possible, retain unknown profile diagnostics, grant unknown IDs no bonus, and never coerce unresolved base results. |
| Automatic effects use names, aggregate validation, or wrong PvE/PvP variants. | Medium | High | Exact template-ID registry, per-slot mode resolution, narrow profession/mode gates, explicit split/faction fixtures. |
| Forced-on preferences bypass legality. | Low-Medium | High | Separate requested preference from derived eligibility/active state; only active state contributes. |
| Rank consumers drift or temporary values leak into requirements/export. | Medium | High | One preview boundary for composer/skill display and explicit regression ownership for permanent equipment/title/template consumers. |
| Build v3 data is lost in an inactive nested clone or future schema is overwritten. | Medium | High | Central deep clone plus constructor/copy audit, non-default nested fixtures, and existing write-block/conflict tests. |
| Explicit None cannot return to inheritance. | Medium | Medium | Provide per-contribution “Use equipped value” reset and test distinction through reload. |
| Hidden armor tools silently disagree with compact state. | Low-Medium | High | Planner-supplied addressed IDs and reducer tests that clear only edited contributions. |
| Rune source records map 126 IDs to duplicate or wrong bytes. | Medium | High | Fail-closed 126/42/10/3/30 invariants, SHA-1 dedup, local SHA-256 provenance, temp output, and visual inspection. |
| Direct wiki/media access is blocked or bytes drift. | Medium | High | Use promoted metadata as authority, bounded explicit live fetch, strict hash verification, record limitation, and keep required ticket open on failure. |
| Wider attribute rows become unusable at 390px/zoom. | Medium | Medium | Deliberate second-row mobile layout, visible text fallback, real cross-theme viewport/zoom matrix. |
| Checkbox checked state is confused with active contribution. | Medium | Medium | Show automatic/explicit request and current active/inactive status separately; count only actual contributors. |
| Existing double-confirm import flow gains another prompt. | Low | Medium | Extend the existing replacement-warning array only; add omission text, not a new dialog. |
| Manual browser evidence is replaced by unit/CSS claims. | Medium | High | Make BW-1908 a hard dependency/gate and leave it open unless actual browser/version/screenshots are recorded. |
| Scope expands into armor, library, URL, or generic simulator work. | Medium | High | Enforce the scope table and preserve/defer all non-bounded surfaces/formats. |

## Security

- Treat local storage, backups, build-set/party transfers, share fragments, template text, file names,
  directory handles, generated manifests, and live media responses as untrusted input.
- Preserve dangerous-key rejection, plain-object checks, dense-array limits, string/ID bounds,
  duplicate rejection, future-schema write blocking, revision conflict detection, quota handling, and
  one-time transfer-preview application. Never partially accept a malformed adjustment profile.
- Render user/catalog labels through React text nodes. Do not add `dangerouslySetInnerHTML`, dynamic
  script/style injection, executable backup content, or prose-parsed effect behavior.
- Keep runtime images local. No catalog URL may reach `img`, CSS, preload, fetch, canvas, drag image,
  or service-worker code. External wiki links remain user activated with `noopener noreferrer`.
- The rune tool accepts repository-relative configured paths, resolves them under an explicit root,
  rejects traversal/symlink escape and unexpected output roots, and never derives a local filename
  directly from an untrusted URL.
- Live asset fetch is opt-in, HTTPS-only, GET-only, origin-validated after redirects, time/size/retry
  bounded, MIME/dimension checked, and hash verified. Outputs publish atomically only after the full
  126/30 set passes, so a partial or malicious response cannot replace known-good assets/manifests.
- File-system access remains user initiated and least privilege: read for browsing, read/write only
  from Save, overwrite confirmation after a fresh directory read, and success only after stream
  close. Store only the granted handle; never upload or persist folder contents in handle storage.
- Automated/manual verification uses a disposable copied Skills folder. No test or sprint command
  targets a live Guild Wars directory, home directory, or broad recursive path.
- Adjustment metadata never enters public share URLs or game files in this milestone, limiting
  accidental disclosure and preserving the established interoperability surface.

## Dependencies

### Ticket DAG

| Ticket | Depends on | Gate supplied |
| --- | --- | --- |
| BW-1901 | Completed EPIC dependencies | Authored/source/rank contracts |
| BW-1902 | BW-1901 | Durable Build v3 and copy graph |
| BW-1903 | BW-1901, BW-1902 | Shared projection/effect semantics |
| BW-1904 | BW-1901 | Verified local rune asset map |
| BW-1905 | BW-1902, BW-1903, BW-1904 | Inline gear and rank UI |
| BW-1906 | BW-1902, BW-1903, BW-1905 | Advanced effect UI/lifecycle |
| BW-1907 | BW-1902, BW-1905, BW-1906 | Template/file/full-transfer proof |
| BW-1908 | BW-1901 through BW-1907 | Full automation/browser/docs closeout |

### Existing Repository Dependencies

- Completed EPIC-03/04/10 catalogs and their runtime app adaptation.
- Completed EPIC-05/06 template codec and validation contracts via pinned
  `@buildwars/gw-templates@1.1.1`.
- Completed equipment/rune/effective-rank work, title ranks, local library, backup/restore,
  build-set/party state and transfers, focused composer, and template-folder browsing.
- React 19, TypeScript 5.9, Vite 6, Vitest/jsdom, Testing Library, and the existing Python data
  environment. No new npm runtime or browser-automation dependency is planned.
- The supplied `prior-art/gw-skills-and-attributes-refs/attributes-section.png` is a development
  reference for blue increased numerals and compact arrows, not a runtime asset.
- A real browser with devtools and, for native folder verification, a Chromium browser implementing
  File System Access; a second browser/environment without that API is needed for fallback evidence.
- Explicit bounded network access during rune asset acquisition. Runtime and automated tests remain
  offline.

## Open Questions

There are no open human scope questions. The assumptions in this sprint are the executable defaults.
Source-access or browser-environment failures are evidence gaps, not invitations to change the asset,
UI, persistence, or interoperability decisions; record them and leave the affected acceptance item
open. Any catalog contradiction discovered during implementation must be documented against the
frozen fixture and resolved within the bounded IDs/targets, without expanding to a generic effect or
equipment system.
