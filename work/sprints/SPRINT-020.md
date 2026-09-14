---
id: SPRINT-020
title: Composer Attribute Adjustments
status: completed
approval: auto-approved
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
updated: 2026-09-14
---

# Sprint 020: Composer Attribute Adjustments

## Overview

Extend the focused composer with inline primary-profession rune and headgear choices, supported assumed active effects, and explained effective attribute ranks. Preserve base point allocation and standard Guild Wars template behavior while making the additional authored choices durable within each Build.

This sprint implements BW-1901 through BW-1908 from [EPIC-19](../tickets/19-composer-attribute-adjustments/EPIC.md). The [accepted attribute-adjustment brief](../../compendium/attribute-adjustments.md) and [Sprint 020 intent](drafts/SPRINT-020-INTENT.md) govern scope. Human decisions are settled; the implementation defaults below resolve remaining engineering choices without another interview.

The inspected application mounts `BuildComposer`, its focused attribute editor, skill bar/catalog, inline template code, and game-file controls. Equipment, library, party-management, and title-rank panels are not instructions to expand the mounted UI. Their existing state and transfer internals still require preservation.

The delivery boundary is one coherent vertical feature: authored Build v3 state, shared preview projection, local rune assets, compact controls, and verified persistence/game-file boundaries. Armor-slot management, total health/armor calculations, named-library UI, new complete-build formats or URLs, sidecars, folder synchronization, generic effect parsing, combat simulation, backend work, and the parked paw-ned2 ticket remain deferred.

## Assumptions

- All eight groomed tickets fit one dependency-ordered sprint. BW-1904 can run after BW-1901 alongside state/projection work, while its consumers wait for its gate.
- No high-risk architecture choice requires a new interview; routine choices use the accepted brief and the concrete defaults below.
- Build schema advances from 2 to 3. The local envelope remains v2 at `build-wars:v1`; existing outer backup/build-set/party formats remain unchanged because their nested Build reader owns migration.
- No adjustments are inferred for blank-build equipment. Ordinary template imports construct neutral adjustment state and derive self effects from their own bar in the existing import mode context.
- Explicit effect preferences belong to stable Build identity, never a template-code cache key. Automatic values and UI disclosure state are not persisted as authored inputs.
- Unknown catalog selections remain recoverable data. Ambiguous evidence is scoped conservatively to contributions it could affect; it never silently becomes a valid zero.
- Actual browser access and real rune image acquisition are execution dependencies. Their absence leaves the corresponding acceptance gates open; it does not authorize replacing evidence with jsdom tests or placeholder art.

Planning used independent `gpt-6-astra`, `gpt-5.6-sol`, and `gpt-5.5` drafts plus their cross-critiques. The [merge notes](drafts/SPRINT-020-MERGE-NOTES.md) explain decisions; [planning evidence](drafts/SPRINT-020-PLANNING-EVIDENCE.md) records source/catalog checks and command resolution. The routine interview is skipped under the noninteractive automation contract. Execution completed the checked gates with linked evidence. The planning phase changed no product code; execution created no commit.

## Use Cases

| Scenario                                                            | Expected result                                                                                                                                                                                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Allocate Fire Magic 12, select headgear +1 and superior rune +3     | Preview 16; base allocation, point spend, and game code remain 12.                                                                                                                                                  |
| Replace an inherited minor Fire rune with superior                  | Rune contribution becomes +3, without adding the inherited +1. Selecting None suppresses that attribute's inherited rune.                                                                                           |
| Equip a rune on an unallocated primary attribute                    | Base remains zero; preview receives the bonus without creating a purchased allocation.                                                                                                                              |
| Add legal Glyph and Elemental Lord to the Fire build                | Preview becomes 19. Both Lord faction versions or duplicate slots contribute one logical Lord effect.                                                                                                               |
| Enable external Heroic Refrain at +4 on that build                  | Preview is 20; explanation retains the uncapped sum 23 and three clipped ranks. Collapsed count includes all three active effects.                                                                                  |
| Use Elementalist as secondary                                       | Elemental skill effects can apply to available elemental attributes; Elementalist rune/headgear controls are absent. Energy Storage remains unavailable.                                                            |
| Uncheck a self effect, remove/re-add its skill, change mode, reload | Explicit off persists. Explicit on is remembered while ineligible but contributes nothing; reset resumes automatic inference.                                                                                       |
| Change primary profession, secondary profession, or select Any      | Actual primary changes clear compact gear only; same-primary assignment is a no-op. Secondary edits retain primary choices. Any exposes no eligible gear controls; assumptions require a resolved eligible context. |
| Switch or duplicate nested loadouts with identical game codes       | Each loadout retains its own choices; editing the selected loadout leaves inactive loadouts untouched.                                                                                                              |
| Load and save an ordinary game file                                 | Successful load clears explicit adjustments and infers eligible self effects; Refrain is off. Save emits only base game code and retains the browser draft's choices. Cancellation/error preserves authored state.  |
| Preview a file while the editor has maximum bonuses                 | The preview uses only that file's imported state. Its current base-only summary remains base-only.                                                                                                                  |
| Encounter an unknown rune or a missing icon                         | Unknown choices remain labeled and clearable, including orphaned targets; affected previews explain uncertainty. Missing images leave numeric rune controls usable.                                                 |

## Architecture

### Authored state and version boundary

Add `src/domain/attribute-adjustments.ts` for the readonly authored contract, bounds, normalization, cloning, and presence helpers. Build v3 requires one `attributeAdjustments: AttributeAdjustments | null` field:

```ts
type SelfEffectId = "glyph-of-elemental-power" | "elemental-lord" | "masochism";
type AssumedEffectPreference =
  | { readonly effectId: SelfEffectId; readonly preference: "on" | "off" }
  | {
      readonly effectId: "heroic-refrain";
      readonly preference: "on" | "off";
      readonly strength: 1 | 2 | 3 | 4;
    };

interface AttributeAdjustments {
  readonly headgearOverride:
    | null // Inherit the existing semantic headgear contribution.
    | { readonly kind: "none" }
    | { readonly kind: "attribute"; readonly attributeId: AttributeId };
  readonly runeOverrides: readonly {
    readonly attributeId: AttributeId;
    readonly runeId: RuneId | null; // Null means explicit None; absent row inherits.
  }[];
  readonly effectPreferences: readonly AssumedEffectPreference[];
}
```

A null profile means no compact overrides and no explicit preferences. Normalize `{ headgearOverride: null, runeOverrides: [], effectPreferences: [] }` to null. Sort rune rows by attribute ID and effect rows by registry order for stable authored fingerprints. Preserve explicit None/off even when they currently equal the inferred value. Do not persist automatic defaults, effective ranks, icon URLs, catalog facts, descriptions, or disclosure state.

Strict readers migrate Build v1/v2 to `attributeAdjustments: null`, retaining equipment, existing title migration, overlays, inactive entries, and saved-record internals. Require the field for v3; do not silently treat malformed/missing v3 state as old data. Validate exact new-object keys, dense arrays, finite nonnegative safe-integer catalog IDs, at most 64 distinct rune rows, at most four recognized effect rows, on/off enums, and integer Refrain strength 1–4. Self effects cannot carry strength. Reject duplicates, malformed or unsupported parameters/effect IDs, inconsistent version/field combinations, and future schemas through existing diagnostics and whole-document recovery/write blocking. Unknown but well-formed attribute/rune IDs survive parsing for diagnostic/removal access. Structural persistence validity must not depend on current catalog availability.

Both `cloneBuildForBuildSetEntry` and persistence `cloneBuild` explicitly enumerate fields and must use the shared profile clone helper. Audit blank/imported builds, `library-selectors.ts` preview literals, nested materialization, saved internals, and shared test constructors. Update current-version fixtures without destroying dedicated old-version migration fixtures. Existing whole-document serialization/fingerprints then carry choices without a second storage channel or dirty mechanism. Keep local envelope v2 at `build-wars:v1`, persisted build-set snapshot v2, and existing backup/transfer envelopes. Existing concrete-mode hydration normalization stays unchanged; a transient unknown mode activates no assumed effects.

### One projection, three rank contexts

Introduce `src/domain/attribute-preview.ts` and `src/app/attribute-preview-selectors.ts`. The domain projection receives Build and immutable catalog views, resolves one bar/effect set, and returns per-attribute base, equipment-adjusted, uncapped preview, capped preview, ordered contributions, cap facts, and scoped diagnostics. It also returns effect states and one active-effect count. The app adapter supplies existing catalogs and available-attribute scope; it must not import editor selectors, avoiding a selector cycle.

| Context                        | Inputs and consumers                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Base                           | Authored allocations; arrows, point costs/budget, standard skill-template projection and fingerprints.                                                             |
| Equipment-adjusted preview     | Base plus eligible inherited/replacement rune and headgear contributions; retained separately for explanation.                                                     |
| Preview-effective              | Equipment-adjusted plus eligible assumed effects, ordinary cap 20; composer ranks, skill descriptions, and existing Expertise/Mysticism/Fast Casting calculations. |
| Permanent equipment validation | Existing semantic `Build.equipment` and existing validation helpers; unchanged by compact choices or temporary assumptions.                                        |

Reuse `calculateEffectiveAttributeRank` contribution arithmetic without changing its generic uncapped semantics. Add preview validity checks for purchased-rank bounds before capping: negative, fractional, nonfinite, duplicate, or out-of-range base allocations never become trustworthy ranks by clamping. Preserve base/point-budget diagnostics independently; an unrelated invalid skill or an over-budget build does not erase otherwise evaluable per-attribute facts.

Replace the separate collection in `composer-selectors.ts` and `editor-selectors.ts` with the shared result. In particular, remove the tooltip adapter's unresolved-to-zero substitution: omit unresolved rank keys so `renderSkillTooltipText` reports its existing missing-rank outcome. Inherent ranks use the same attribute-scoped resolution. Keep zero for a definitely unavailable primary-only inherent attribute; keep null for uncertainty. Title keys still come exclusively from the title-rank resolver. Do not extrapolate missing progression rows or mutate catalog descriptions/base cost facts. Preserve resolved base-zero descriptions when browsing known, unallocated off-profession skills, including the blank/Any composer. The projection must distinguish this known zero from unknown catalog IDs, invalid/retained allocations, or unresolved contributing equipment; withholding bonuses does not by itself make a rank unknown.

Compute the selected Build preview once at the `App.tsx` boundary using memoization keyed by immutable Build and catalog identities, then pass that context through `BuildComposer` to focused attributes, the bar, focused catalog, and the pinned tooltip. Display selectors accept the precomputed context. Alternate standalone `SkillBrowser` computes once at its own owner boundary and passes it through every row; standalone selectors may compute a context once per invocation for tests/non-render callers. Never reconstruct the full projection for each visible skill or key it by game code/UI filters. No selected loadout means no mutable/phantom preview context.

### Replacement precedence and unresolved evidence

Apply replacement per contribution before adding temporary effects:

1. Collect legacy evidence using `equipment-attribute-rank.ts` and the source-backed highest-rune semantics in `rune-effects.ts`.
2. If a global headgear override exists, replace the entire legacy headgear choice. If a rune override exists for an attribute, replace that attribute's highest legacy rune contribution.
3. Resolve compact rune IDs against unique attribute-rune catalog records. Require primary profession ownership and matching affected attribute. Reject ambiguity or incompatibility as a preview diagnostic and grant no bonus; do not revive the suppressed legacy bonus.
4. Keep original semantic armor and raw template evidence intact. Carry contribution source, affected attribute scope, and whether a legacy contribution was overridden into the explanation.

Extend the equipment collector's diagnostic metadata with contribution kind and affected attributes where known, without changing its permanent-validation arithmetic. A known incompatible rune is inactive with a diagnostic. An unidentifiable inherited rune can affect any primary attribute whose rune contribution still inherits; an unidentifiable headgear selection can affect any primary attribute while headgear inherits. Only those unresolved contributions make a preview rank unknown. Explicit overrides resolve their addressed component, while unrelated uncertainty remains visible. Secondary attributes and unrelated title ranks are not poisoned by unknown primary equipment. Retain informational diagnostics for suppressed evidence without presenting it as an active contribution.

Reducer contracts:

- Compact setters update only adjustment state; they do not create armor, edit base rows, or clear template overlays.
- An actual primary-profession change sets headgear inheritance and removes rune overrides while preserving effect preferences and existing semantic/raw equipment evidence. Retain existing cleanup of affected profession/attribute/skill template fields. Same-primary assignment returns the original state before cleanup; secondary changes preserve compact gear.
- Hidden armor commands receive catalog-derived affected-attribute facts through an app-owned command constructor, following existing action-facts patterns. For a changed rune slot, clear compact rune overrides for the union of the old and new resolvable target attributes. Headgear edits clear only the global headgear override. Insignia and weapon edits clear neither.
- A full equipment reset clears compact contributions addressed by the semantic selections it actually removes. A no-op reset or identical slot selection preserves overrides. Unknown old/new rune targets do not justify clearing every override; retain unknown evidence diagnostics and clear only proven targets. Update all existing armor command producers so hidden compatibility behavior is deterministic.
- The workspace selected-loadout guard also covers new actions: with no selected loadout, no hidden editor mutation may create or dirty a build.

### Bounded assumed effects

Add `src/domain/assumed-attribute-effects.ts` with stable logical IDs and explicit target rules. Identity is catalog/template identity, independent of localized labels, catalog filters, tooltip text, or whole-build validation success.

| Logical effect           | Verified local identities                                 | Rule                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glyph of Elemental Power | Skill/template 198; Elementalist; available in both modes | Legal current-bar source grants +2 to available Air 8, Earth 9, Fire 10, Water 11. Applies beyond spell-type previews.                                                                   |
| Elemental Lord           | 1951 Luxon, 2094 Kurzick; Elementalist; PvE-only          | +1 to the same four attributes in PvE; one logical contribution across factions/slots. Excludes Energy Storage and Earth/Wind Prayers.                                                   |
| Masochism                | Split group `split:skill:2139`: PvE 2139, PvP 3054        | Only mode-resolved 2139 grants +2 to available Death Magic 5 and Soul Reaping 6. The PvP result grants none. Secondary Necromancer receives Death Magic but no unavailable Soul Reaping. |
| Heroic Refrain           | 3431 as source identity                                   | One opt-in external PvE effect, +1–4 to ordinary available recipient attributes, including zero-base rows. No source-presence/profession requirement on the recipient; no title targets. |

Resolve authored `SkillId` through collision-safe `BuildValidationContext.skillSlots`/catalog indexes from `validation-context.ts`; guard ambiguous IDs, split groups, and mode members before using the existing `resolveSkillModeVariant`. Match the resulting record's `templateId` to the registry, not its catalog `id`. Add a fixture where these differ. Extract the necessary per-source profession/mode/classification predicates into a small shared `src/domain/skill-source-eligibility.ts` helper consumed by the preview and existing eligibility rules, retaining those rules' diagnostics and behavior. Do not infer eligibility from aggregate validation success or the absence of a warning.

Self-effect eligibility requires a uniquely resolved source slot, resolved current mode variant, selected source profession, allowed mode, and at least one available target. Check each source independently; duplicates can still produce one supported assumption even when the whole bar has duplicate-skill diagnostics. Forced on never bypasses these gates. A retained raw/unresolved source does not activate an effect. Assert identity uniqueness and split mapping explicitly rather than relying on existing first-match lookup behavior for malformed catalogs.

Freeze logical effect IDs as part of the versioned authored contract: a future supported effect requires an explicit schema compatibility decision, while unknown catalog selections remain recoverable IDs. No self preference means automatic on when eligible. Checkbox edits persist explicit on/off; reset removes the entry. Ineligible entries remain remembered and explain why their contribution is inactive. Refrain absence means off/+1. First enable authors on/+1; choosing strength while off authors off with that strength. Disable retains strength, re-enable reuses it, and resetting the external assumption removes it and returns to off/+1. Never infer a second self-Refrain effect or derive strength from recipient Leadership.

The contributing-effect count counts distinct active logical effects with an available target, even when their nominal additions are entirely clipped at 20. Count and checkbox state come from the same projection. Duration/cost previews describe the currently assumed context, not buff casting history or simulated uptime.

### UI and interoperability boundaries

The focused attribute editor owns compact row controls and a contribution popover. Use native radio semantics for each None/+1/+2/+3 rune group, with numbers always present and source-backed health-penalty labels. Build a reverse index by primary profession, affected attribute, and rank amount; each tier must resolve exactly one compatible rune record. Missing/duplicate matches disable that tier with a diagnostic instead of selecting the first row. Keep its individual health penalty informational, separate from any semantic equipment totals. Use one named headgear radio group across all eligible rows plus an explicit Clear headgear action that writes None. Inherited resolved choices display their effective selection and inherited source; inherited unresolved choices must not falsely select None. Expose a small “Use equipped value” action for an overridden contribution in its controls or breakdown; it removes that override, while None/Clear explicitly suppresses it. Keep exactly four rune segments. Attribute ID zero must work for selection, reset, and persistence. Recovery text/actions expose invalid retained compact choices even when they have no eligible row. No armor editor is mounted.

Blue numerals mean a resolved preview strictly greater than base. Equal values remain neutral; unresolved values show a neutral fallback and explicit unresolved text. The explanation includes base, each eligible contribution, inherited/replaced source, uncapped sum, and cap. It opens by hover, focus, and tap/click; Escape closes it and restores trigger focus. Color and a `title` attribute are insufficient by themselves.

Mount `AssumedAttributeEffects` in the existing composer attribute area with its own disclosure, initially collapsed, and a visible active count. Also show the count in the outer Attributes heading when that section is collapsed. For self effects the checkbox displays the explicit requested on/off preference when present, otherwise the automatic default. Show current active/inactive status separately: a checked remembered request can remain inactive because its source is missing or ineligible. The user can still uncheck that request or reset it while inactive. Counts and rank contributions use actual eligible activity, never the checkbox request alone. Self rows appear when present or explicitly remembered; external Refrain appears separately. Ineligible rows explain stored preference versus current inactive state and retain reset access. Disclosure state remains component UI state. Do not add generic arithmetic fields or persist derived checkbox booleans.

Game export continues through `projectEditorToSkillTemplate` and the compatibility adapter and includes professions, base attribute allocations, and eight skills only. Title overrides and adjustments stay omitted. Adjustment diagnostics stay outside canonical export gates. Successful ordinary import receives a neutral profile through `createBlankBuild`; errors and cancellation leave all authored fields unchanged. Extend existing replacement copy for explicit adjustments, including explicit None/off, without another confirmation step. Automatic effects alone do not trigger discard warnings. Add one concise nonblocking omission note at the existing game export/file-save surfaces. Save preserves adjustments and updates names only after existing success boundaries.

`TemplatePreviewContents` currently displays decoded base allocations and icons. Keep that contract and prove isolation; any later skill detail reuse must receive the file's imported editor state. Ordinary game skill codes do not contain mode: preserve the importer's existing current-editor mode context; candidate previews inherit that mode deliberately, but never its adjustments. Existing share fragments remain base-code/mode payloads; preserve shared-draft autosave opt-in behavior. Existing complete-document transfers retain settings through the nested Build reader/cloner, with no new formats or mounted transfer UI.

## Implementation

Execute the following dependency-ordered phases. After BW-1901 freezes the source matrix, BW-1904 asset work may proceed alongside BW-1902/BW-1903; BW-1905 waits for all three gates. A serial 1–8 execution is also valid. Do not close a ticket until its stated gate has evidence.

| Phase | Ticket                                                                                                                                      | Prerequisites                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1     | [BW-1901](../tickets/19-composer-attribute-adjustments/BW-1901-adjustment-contracts-and-source-rules.md) — contracts and source rules       | Completed epic prerequisites |
| 2     | [BW-1902](../tickets/19-composer-attribute-adjustments/BW-1902-authored-state-and-draft-persistence.md) — authored state and persistence    | BW-1901                      |
| 3     | [BW-1903](../tickets/19-composer-attribute-adjustments/BW-1903-effective-ranks-and-assumed-effects.md) — shared ranks and effects           | BW-1901, BW-1902             |
| 4     | [BW-1904](../tickets/19-composer-attribute-adjustments/BW-1904-local-rune-icon-assets.md) — rune assets                                     | BW-1901                      |
| 5     | [BW-1905](../tickets/19-composer-attribute-adjustments/BW-1905-inline-runes-headgear-and-blue-ranks.md) — inline equipment and blue ranks   | BW-1902, BW-1903, BW-1904    |
| 6     | [BW-1906](../tickets/19-composer-attribute-adjustments/BW-1906-advanced-effect-controls.md) — advanced effects                              | BW-1902, BW-1903, BW-1905    |
| 7     | [BW-1907](../tickets/19-composer-attribute-adjustments/BW-1907-game-template-and-transfer-boundaries.md) — template and transfer boundaries | BW-1902, BW-1905, BW-1906    |
| 8     | [BW-1908](../tickets/19-composer-attribute-adjustments/BW-1908-browser-verification-and-closeout.md) — browser verification and closeout    | BW-1901 through BW-1907      |

### Phase 1: BW-1901 — Freeze contracts and evidence

**Files:** new `src/domain/attribute-adjustments.ts`, the fixed registry/constants in `src/domain/assumed-attribute-effects.ts`, `src/domain/index.ts`, new `test/domain/attribute-adjustments.test.ts` and `test/fixtures/attribute-adjustments.json`; `compendium/attribute-adjustments.md`; new `work/runs/SPRINT-020/contracts.md`; existing domain/template/app baseline tests.

- [x] Land executable readonly types, exact bounds, canonical ordering, neutral/clone/presence helpers, and identity/target registry fixtures without changing Build's version or mounting UI yet. Test equivalent insertion orders and explicit None/off preservation.
- [x] Record the chosen v3 profile shape, tri-state gear semantics, scoped uncertainty, hidden-command invalidation, effect lifecycle, and import/export distinctions from this sprint in the durable brief.
- [x] Record HEAD and catalog versions/digests. Freeze fixtures for six skill/template identities, split group members, profession ownership, attribute IDs, rune rank/health facts, and representative exact-source/canonical game codes.
- [x] Recheck the brief's linked source rules during execution; record URLs, date, access method, and any direct-access restriction. Distinguish local catalog assertions from live source verification; do not fabricate successful wiki access.
- [x] Produce a constructor/clone/serializer/consumer audit naming `createBlankBuild`, `editorStateFromTemplate`, `cloneBuildForBuildSetEntry`, persistence `validateBuild`/`cloneBuild`, nested materialization, saved records, backups, both transfers, and every `selectSkillDisplay` surface. Classify required edits versus regression-only paths.
- [x] Establish baseline template/export, selected-loadout, recovery, and attribute-display behavior. Preflight available real browsers and a disposable Skills-folder location so missing capability is known before closeout. Planning found Chrome, Firefox, Safari, `.venv-data/bin/python`, and Prettier present; this is availability only, not browser evidence. Record the current v2 reader rejecting a disposable nested Build-v3 fixture with writes blocked before changing the schema; after migration, prove the new reader rejects a future v4 fixture.

**Checks:** `npm run typecheck`; `npm run test:run -- test/domain/attribute-adjustments.test.ts src/app/editor-state.test.ts src/app/editor-selectors.test.ts src/app/template-workflow.test.ts src/app/workspace-state.test.ts src/app/skill-attribute-effects.test.tsx test/template-compatibility/skill-template.test.ts`. Record pre-existing failures separately.

**Gate:** Executable domain contracts and fixtures precede Build migration; source-access and browser capability gaps are explicit. No UI implementation is necessary to close this contract ticket.

### Phase 2: BW-1902 — Author, migrate, and preserve settings

**Files:** extend the Phase 1 domain contract; new `src/app/attribute-adjustment-state.ts` for catalog-free mutation/lifecycle helpers; `src/domain/build.ts`, `build-set.ts`, `index.ts`; `src/app/editor-state.ts`, `equipment-editor-state.ts`, `attribute-eligibility.ts`, `persistence-schema.ts`; new `src/app/attribute-adjustment-actions.ts`; existing hidden armor command producers including `components/ArmorEquipmentEditor.tsx`; audit `workspace-state.ts`, `build-set-state.ts`, `party-state.ts`, `local-storage.ts`, and `App.tsx` autosave hooks.

- [x] Add the required Build v3 profile, neutral constructors, immutable setters/resets, canonical ordering, and shared adjustment cloning. Update typed Build fixtures/constructors found by the Phase 1 audit without converting fixtures intended to exercise v1/v2 migration.
- [x] Implement exact new-field validation and old-schema migration recursively. Reject malformed/future snapshots transactionally, retaining original storage for recovery and blocking writes as today.
- [x] Update both explicit Build cloners, the `library-selectors.ts` empty-preview constructor, and prove authored fingerprints include choices while template-field fingerprints do not. Do not add another dirty-state mechanism when existing snapshot fingerprints suffice.
- [x] Implement mutations through the catalog-free state helpers, including actual-primary/same-primary/secondary transitions and contribution-scoped hidden armor invalidation. Pass catalog-derived facts through all affected command producers; preserve raw evidence and semantic equipment.
- [x] Verify selected/inactive loadouts, variant duplication, saved-record duplication, party selection, hydration, autosave, pagehide, and backup/transfer nesting using deliberately different non-default profiles. Enforce no-selected-loadout no-op behavior at the workspace boundary if its existing behavior is insufficient.

**Checks:** Extend `test/domain/attribute-adjustments.test.ts`, add `src/app/attribute-adjustment-state.test.ts`, and add focused fixtures in `test/domain/build-set.test.ts`, `src/app/editor-state.test.ts`, `persistence-schema.test.ts`, `workspace-state.test.ts`, `build-set-state.test.ts`, `party-state.test.ts`, `local-storage.test.ts`, `backup-restore.test.ts`, `build-set-transfer.test.ts`, and `party-transfer.test.ts`; run these with `npm run test:run --` and run `npm run typecheck`.

Add 16-entry nested fixtures with maximum adjustment rows and representative existing metadata against the current 240,000-byte build-set/party limits, plus oversized transactional-rejection cases. Keep the existing byte limits and failure behavior; no automatic envelope/limit expansion. Required cases include explicit None versus inherit and per-contribution reset, ID zero, off equal to current automatic, remembered Refrain strength, duplicate IDs, unsupported fields/effects, fractional/oversized inputs, future Build versions in inactive entries, old title/equipment/raw preservation, corrupt storage, conflict/quota failure, and pagehide durability. Assert a bonus-only mutation affects just the addressed loadout and a disclosure-only change does not dirty authored state.

**Gate:** Non-default new state round-trips through every existing full-document path, and recovery protection remains intact before controls can author it.

### Phase 3: BW-1903 — Resolve shared previews and bounded effects

**Files:** new `src/domain/attribute-preview.ts`, `src/app/attribute-preview-selectors.ts`; extend the Phase 1 `assumed-attribute-effects.ts` registry with resolution; `src/domain/equipment-attribute-rank.ts`, `index.ts`; `src/app/App.tsx`, `composer-selectors.ts`, `editor-selectors.ts`, `attribute-eligibility.ts`, `components/BuildComposer.tsx`, `FocusedAttributeEditor.tsx`, `FocusedSkillCatalog.tsx`, `SkillBar.tsx`, and `SkillBrowser.tsx` for context plumbing; `src/domain/validation-context.ts`, `rules/skill-eligibility.ts`, and new `skill-source-eligibility.ts` for narrow shared resolution/eligibility. Reuse `rune-effects.ts`, `effective-attribute-rank.ts`, `skill-tooltip.ts`, `skill-attribute-effects.ts`, and `catalog-lookup.ts` without changing their unrelated contracts.

- [x] Implement contribution replacement and scoped uncertainty, retaining both suppressed evidence and active contribution explanations. Reuse highest-rune facts; do not manufacture armor slots.
- [x] Implement the four logical effects using the shared source-eligibility primitive and collision-safe slot/mode facts. Match `templateId`, then apply target scope, preferences, and deduplication. Retain existing rule diagnostics; add parity, unequal catalog/template ID, incomplete split, and ambiguous-source fixtures.
- [x] Apply the cap once after additive effects, preserving uncapped sums and invalid base diagnostics. Keep permanent equipment requirement/legality evaluation unchanged.
- [x] Integrate the shared result into focused rows and all `selectSkillDisplay` paths: catalog rows and alternate views, skill bar, pinned/hover tooltips, descriptions, and supported cost/timing facts. Remove unresolved zero fabrication and unrelated equipment poisoning.
- [x] Keep title-rank inputs and catalog progression tables separate. Confirm no inference uses displayed duration, adjusted Leadership, or another effect's tooltip, eliminating recursive dependencies.
- [x] Wire one memoized projection per Build/catalog snapshot through all mounted consumers and one per alternate-browser owner. Verify the visible row map does not recompute it per skill, while effects, mode, primary, secondary, or bar edits invalidate it and filters do not change assumptions.

**Checks:** Add `test/domain/attribute-preview.test.ts`, `test/domain/assumed-attribute-effects.test.ts`, and `src/app/attribute-preview-selectors.test.ts`. Run them with `test/domain/effective-attribute-rank.test.ts`, `rune-effects.test.ts`, `equipment-validation.test.ts`, `skill-attribute-effects.test.ts`, `src/app/editor-selectors.test.ts`, `skill-display.test.tsx`, and `skill-attribute-effects.test.tsx`.

Fixtures must prove 12+1+3=16, replacement rather than double counting, Fire 19, uncapped 23/capped 20, clipped active counts, secondary Elementalist/Necromancer scope, unavailable primary-only attributes, zero base, Any, unknown mode, malformed/duplicate base allocations, wrong/unknown rune IDs, unknown inherited components with partial overrides, both Lord variants, PvP Masochism exclusion, removed/re-added skills, unrelated invalid slots, reset, title separation, and resolved zero for unallocated off-profession catalog displays. Assert the same preview rank drives description and cost/timing outcomes while permanent validation and game code remain unchanged.

**Gate:** One deterministic projection per owner/Build/catalog snapshot owns ranks, effect state, count, and explanation for all relevant surfaces, using shared source eligibility and explicit template identity; no UI-local arithmetic remains.

### Phase 4: BW-1904 — Cache real rune icons

**Files:** new `scripts/data/cache_rune_icons.py`, `scripts/data/build_wars_ingest/rune_icon_assets.py`, `scripts/data/build_wars_ingest/tests/test_rune_icon_assets.py`; reuse narrowly factored helpers from `skill_icon_assets.py` where appropriate; new `public/gww-icons/runes/*.png`, `src/app/rune-icon-assets.generated.json`, `data/generated/epic-10/rune-icon-assets.manifest.json`; `src/app/icon-assets.ts`, new `rune-icons.ts`; `compendium/decisions/0002-runtime-gww-icon-assets.md`, `compendium/source-policy.md`, `scripts/data/README.md`, `src/app/assets/gww-icons/README.md`; `.gitignore`, `data/generated/README.md`, and `package.json` for a `data:rune-icons` convenience command.

- [x] Extend the existing cached-media exception to exactly the rune binary directory and two manifests, recording existing user authorization and source provenance. Do not broaden the exception to arbitrary equipment images.
- [x] Select only `familyKind: attribute` records from the promoted rune catalog. Join `iconId` to `remoteMedia`; deduplicate by verified file title/canonical URL/hash identity, not by per-rune `iconId`.
- [x] Assert the promoted release fixture's 126 rune mappings and 30 source identities covering ten professions and three tiers; a future catalog promotion must review/update this fixture and its asset map together. Local inspection found 126 distinct media IDs but 30 file titles/URLs/hashes. Rune images have non-square dimensions, including 38×52 through 52×62; do not reuse the skill cache's square-only filter or crop/pad the real assets.
- [x] Use bounded downloads, source-host/path checks, MIME/PNG-byte validation, dimensions, strict hash matching, and deterministic contained destinations. Stage and validate the complete release set before publication. Publish verified binaries before runtime mappings, keep last-good runtime paths usable during publication, and recover/roll back manifests on a publish failure. Use immutable/content-addressed files or retained previous bytes so replacement cannot invalidate the old map. Do not claim crash-atomic replacement across multiple directories. Support cached metadata/bytes for offline replay. If bytes differ from the promoted metadata hash, fail closed. A verifiable local cache of the expected bytes is acceptable; do not refresh metadata, weaken checks, or change promoted catalogs within this sprint. Record unavailable expected bytes as an asset gate failure; any catalog refresh is separate follow-up work.
- [x] Expose a local-only rune descriptor through the app icon boundary, respecting Vite base paths. Preserve visible +1/+2/+3 labels and an image-error fallback without requiring a broader icon component refactor.
- [x] Add the exact `.gitignore` exception `!data/generated/epic-10/rune-icon-assets.manifest.json` and document it in `data/generated/README.md`; the directory is already allowlisted. Prove the new provenance artifact is eligible for version control. Keep promoted rune/skill catalogs and their catalog manifests unchanged. Inspect actual resulting images before closing the asset ticket.

**Checks:** `PYTHONPATH=scripts/data .venv-data/bin/python -m unittest build_wars_ingest.tests.test_rune_icon_assets build_wars_ingest.tests.test_skill_icon_assets`; add/run `src/app/rune-icons.test.ts` alongside `icon-assets.test.ts`, `catalog-boundary.test.ts`, `catalog-icon.test.tsx`, and `test/domain/source-policy.test.ts`.

Test identity deduplication, expected dimensions, hash mismatch, HTML/non-image payload, redirect/path escape, offline replay, publication failure recovery, local map containment, missing manifest entry, and failed image load. Scope remote-URL bans to runtime maps and network-bearing code; source/provenance links in README files are allowed. Require all 30 valid binaries and all 126 mappings; `--skip-download` or numeric fallbacks alone do not complete asset acceptance.

**Gate:** Real local assets, exact exception, provenance, and usable fallback are all present, with no runtime wiki fetch/hotlink.

### Phase 5: BW-1905 — Mount inline gear and explained ranks

**Files:** `src/app/components/FocusedAttributeEditor.tsx`, `BuildComposer.tsx`; new `AttributeAdjustmentControls.tsx` and `AttributeRankBreakdown.tsx`; `src/app/composer-selectors.ts`, `styles.css`; reuse existing popover/focus utilities as appropriate.

- [x] Render one labeled rune radio group per eligible primary row using the unique reverse tier index, real icon plus numeric tier, and source-backed individual health penalty; disable missing/ambiguous options safely. Render one globally named headgear group with Clear; handle attribute ID zero without truthiness errors.
- [x] Derive inherited selection from the projection without authoring a snapshot. Explicit None writes suppression. Show recoverable unknown selections and clear actions without exposing equipment groups on secondary, retained illegal, or unresolved-primary rows.
- [x] Preserve row ordering, attribute collapse, arrows, purchased caps, cost labels, and point budget. Gear remains editable when base is zero or no further points can be spent.
- [x] Use blue only for a resolved increase. Add accessible rank/breakdown text, full contribution/cap detail, pointer/focus/touch opening, Escape dismissal, and focus restoration. Keep explanations within the viewport at zoom and narrow widths.
- [x] Use compact desktop columns and a narrow stacked/wrapped control arrangement with usable targets, long labels, and five primary attributes. Do not rely on color or icon availability for state.

**Checks:** Add `src/app/attribute-adjustment-controls.test.tsx` and `attribute-rank-breakdown.test.tsx`; run with `attribute-editor.test.tsx`, `build-composer.test.tsx`, `profession-picker.test.tsx`, and `skill-attribute-effects.test.tsx`. Assert mutual exclusion, global headgear grouping, clear/inherit behavior, keyboard navigation/focus, touch trigger, cap/unresolved copy, zero-base edits, and unchanged point spend/code. Begin actual browser screenshots here; Phase 8 completes the full matrix.

**Gate:** Mounted controls author the already-durable contract and explain the shared preview without changing base editing or adding armor management.

### Phase 6: BW-1906 — Expose assumed effects

**Files:** new `src/app/components/AssumedAttributeEffects.tsx`; `BuildComposer.tsx` or `FocusedAttributeEditor.tsx` for its mount; `src/app/attribute-preview-selectors.ts`, `styles.css`; existing local skill icon boundary.

- [x] Render relevant self effects and remembered overrides as ordinary checkboxes, with automatic/explicit status and reset. Keep reset available when a source disappears or becomes ineligible.
- [x] Display why an effect is inactive and the retained preference separately; never imply a forced-on effect currently contributes while its eligibility gate fails. Test toggling a remembered on request to off while its source is absent, then re-adding the source; off must remain preserved.
- [x] Render external Refrain separately with explicit +1–4 strength and off-by-default behavior. Strength edits never infer an eligible self source or depend on recipient Leadership.
- [x] Put the shared contributing count in the collapsed disclosure label, including cap-clipped effects. Disclosure toggles neither author a preference nor dirty the draft.
- [x] Preserve focus when resetting removes a remembered row; return it to the disclosure trigger if the row disappears. Keep choices scoped to selected Build across reload and loadout switches.

**Checks:** Add/run `src/app/assumed-attribute-effects.test.tsx`; extend `editor-state.test.ts`, `workspace-state.test.ts`, `App.test.tsx`, and `skill-attribute-effects.test.tsx`. Cover independent Glyph/Lord override persistence, faction substitution, mode/profession transitions, skill removal/re-addition, reset, external strength retention, zero targets, no selected loadout, and collapsed count agreement for both the advanced and outer Attributes disclosures.

**Gate:** Checkbox state, count, and contribution breakdown are all views of the same eligibility-gated state, with persistence proven through reload.

### Phase 7: BW-1907 — Prove game and complete-document boundaries

**Files requiring targeted changes:** `src/app/template-import.ts`, `components/InlineTemplateCode.tsx`, `TemplateBrowserDialog.tsx`, `TemplateDialogs.tsx`, existing `ShareControls.tsx`, and `src/app/party-sharing.ts`; share a single authored-adjustment presence helper from the new domain module. **Primarily regression evidence:** `template-workflow.ts`, `template-files.ts`, `TemplateFileControls.tsx`, `TemplatePreview.tsx`, `share-url.ts`, `src/template-compatibility/`, `backup-restore.ts`, `build-set-transfer.ts`, `party-transfer.ts`, and nested state paths already updated in Phase 2.

- [x] Extend both current import-warning implementations, preferably by sharing warning data, so explicit settings are mentioned in the existing confirmation. Retain existing dirty-guard behavior; add no new prompt. Automatic inference alone causes no adjustment discard warning.
- [x] Extend existing `ShareControls` notices and `party-sharing.ts` omitted-field/lossy-count data with the same authored-presence helper, including explicit None/off. Keep their ordinary code/URL/multi-code payload fields base-only; only existing explanatory omission text changes. Do not mount new sharing or party UI.
- [x] Add concise omission copy beside applicable code/file exports. Save/copy selects the existing exact-source or canonical base output; unresolved preview metadata cannot block a base-valid export.
- [x] Compare exact-source bytes and canonical base semantics before/after bonus-only edits. Decode saved/downloaded output and assert base ranks/eight skills, with no sidecar or extra text.
- [x] Prove successful ordinary loads reset all explicit adjustments and equipment overrides through the blank constructor while retaining existing mode/naming rules. Canceled warning/dirty guard, invalid decode, picker cancellation, or failed read leaves every authored field intact.
- [x] Regress fresh file reads, folder permissions, overwrite confirmation, write/close failure with abort, fallback download, and name updates only after success. Save success keeps browser adjustments. Use fake handles or disposable copied game files only.
- [x] Prove isolated file/shared-code state and shared-draft storage protections. Confirm full backup/build-set/party transfer and duplicates retain non-default settings in active and inactive entries; do not introduce a new transfer envelope or library UI.

**Checks:** `npm run test:run -- test/template-compatibility src/app/template-workflow.test.ts src/app/template-files.test.ts src/app/template-browser.test.tsx src/app/template-dialogs.test.tsx src/app/inline-template-code.test.tsx src/app/share-url.test.ts src/app/backup-restore.test.ts src/app/build-set-transfer.test.ts src/app/party-transfer.test.ts src/app/party-sharing.test.ts src/app/party-share-panel.test.tsx src/app/App.test.tsx`. Include malformed/future nested Build imports and transactional rejection fixtures.

**Gate:** Two builds with identical base game code can retain different browser adjustments, and all game/file transactions preserve the established compatibility guarantees.

### Phase 8: BW-1908 — Browser evidence and closeout

**Files:** new `work/runs/SPRINT-020/browser-evidence.md` and screenshots under `work/runs/SPRINT-020/screenshots/`; execution check log; `compendium/attribute-adjustments.md`, `template-files.md`, `build-composer-use-case.md`, `README.md`; asset docs from Phase 4; final executing sprint, EPIC-19 tickets, ledger, and runner-owned result records.

- [x] Run focused checks for changed areas as needed, then `npm run verify` and `git diff --check` once on the final implementation. Do not repeat full constituent suites just before or after `verify` unless changes, failures, or unresolved concerns justify it. Fix attributable failures; record commands/results and pre-existing failures honestly. The installed `verify` includes formatting, lint, typechecks, Vitest, build, Python ingestion tests, and ticket-burn tests.
- [x] Use the production build produced by `npm run verify` and start `npm run preview -- --host 127.0.0.1` for final browser evidence at its configured base URL. Development-server checks may guide iteration but do not replace the final production-preview pass. Prefer an available real-browser tool or installed browser; no permanent browser dependency is assumed or required merely to run this matrix. Use a native File System Access-capable browser for permission/folder cases and a real fallback path for download cases.
- [x] Complete and record the matrix below. Every evidence row records browser/version, OS, build revision, viewport, theme, zoom, fixture/setup, actions, expected/actual result, and screenshot or observable-result artifact. Browser-source inspection and jsdom cannot satisfy these rows.

| Browser scenario            | Required coverage and evidence                                                                                                                                                                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout and visual reference | 1280, 900, and 390 CSS-pixel widths, both themes; repeat at 200% browser zoom. Compare blue increased and neutral unchanged ranks against `prior-art/gw-skills-and-attributes-refs/attributes-section.png`. Include long labels, five primary attributes, secondary rows, cap explanation, and no clipping/overlapping controls. |
| Input and accessibility     | Keyboard-only rune and headgear selection, explicit clear, checkbox/reset/strength, visible focus, hover/focus/tap breakdown access, Escape and restored focus. Include touch or real-browser touch emulation at narrow width.                                                                                                   |
| Effect lifecycle            | Glyph/Lord independently automatic, explicit off, removed/re-added source, mode/faction/profession changes, remembered inactive on, Refrain first +1 then +4, collapsed count including clipped contributions.                                                                                                                   |
| Persistence and isolation   | Reload non-default settings; selected/inactive loadout fixtures with different profiles; no selected loadout; file preview unaffected by editor bonuses. Use isolated browser storage/test fixtures without mounting new collection UI.                                                                                          |
| Missing assets              | Block/remove a rune image request in the browser; confirm visible numbers, accessible names, usable selection, and no remote fallback.                                                                                                                                                                                           |
| Game folder                 | Disposable copied `Templates/Skills` folder: load/edit/save/reload, changed-file re-read, read-only/denied permission, overwrite accept/cancel, picker cancellation, and base-only file content. Inspect exported bytes and retained browser adjustments.                                                                        |
| Fallback files              | Real browser fallback upload/download route; confirm valid base-only downloaded file and accurate download-started reporting. Fault injection may exercise write/close failure where a physical failure is impractical; label injected evidence.                                                                                 |

- [x] If browser or asset access is unavailable, record the exact gap and leave its DoD item, BW-1908, and the epic open. Continue independent verification; do not relabel unperformed acceptance as passed.
- [x] Update durable docs to describe only shipped mounted behavior, state migration/precedence, preview assumptions/cap, rune provenance, and game-file omission/replacement. Preserve explicit deferral of named-library and complete-build transfer work.
- [x] Update this executing sprint, its ledger status, and EPIC-19/BW-1901–BW-1908 only from their actual gates. Write the separate execution result to the runner-requested `execute-SPRINT-020-result.json` (for this run, under `work/runs/ticket-burn/EPIC-19/20260914T004651Z/`). Preserve `plan-EPIC-19-result.json` as the record of successful planning; `run.json` remains runner-owned. Link a durable scenario/result summary in the sprint/tickets because raw browser artifacts under `work/runs/` are ignored by git.

**Gate:** All required tests, real assets, actual browser scenarios, durable docs, and execution records agree before the sprint or epic is marked complete.

## Files Summary

Paths below describe the completed implementation. [Execution evidence](SPRINT-020-EVIDENCE.md) records phase checks and the production browser matrix.

| Area                | Add/change                                                                                                                                                                                                                                                                          | Regression-only unless evidence requires a fix                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Domain state        | `src/domain/attribute-adjustments.ts`, `build.ts`, `build-set.ts`, `index.ts`                                                                                                                                                                                                       | Existing equipment/title contracts                                                                                                |
| Projection          | `src/domain/attribute-preview.ts`, `assumed-attribute-effects.ts`, scoped metadata in `equipment-attribute-rank.ts`; `src/app/attribute-preview-selectors.ts`, `composer-selectors.ts`, `editor-selectors.ts`, App/component context plumbing, shared source-eligibility predicates | `effective-attribute-rank.ts`, `rune-effects.ts`, `skill-attribute-effects.ts`, `skill-tooltip.ts`, permanent equipment rules     |
| Actions/persistence | `src/app/attribute-adjustment-actions.ts`, `attribute-adjustment-state.ts`, `editor-state.ts`, `equipment-editor-state.ts`, `attribute-eligibility.ts`, `persistence-schema.ts`, hidden armor command producers                                                                     | `workspace-state.ts` except needed guards, `build-set-state.ts`, `party-state.ts`, `local-storage.ts`, `App.tsx` durability hooks |
| Mounted UI          | `FocusedAttributeEditor.tsx`, `BuildComposer.tsx`, `AttributeAdjustmentControls.tsx`, `AttributeRankBreakdown.tsx`, `AssumedAttributeEffects.tsx`, `styles.css`                                                                                                                     | `FocusedSkillCatalog.tsx`, `SkillBrowser.tsx`, `SkillBar.tsx`, `SkillTooltip.tsx`, `SkillDisplay.tsx` through shared selectors    |
| Rune assets         | Bounded Python cache/module/tests; `public/gww-icons/runes/`; runtime/provenance manifests; `src/app/rune-icons.ts`, `icon-assets.ts`                                                                                                                                               | Promoted catalogs and unrelated skill cache output                                                                                |
| Game boundaries     | `template-import.ts`, existing inline/file/dialog/share omission copy, `party-sharing.ts` omitted-field data                                                                                                                                                                        | Template codec/fingerprint, file I/O, previews, share URLs, backup/build-set/party transfer wrappers                              |
| Evidence/docs       | New contract/domain/component/asset fixtures and tests; `work/runs/SPRINT-020/`; accepted brief, source-policy/ADR, asset docs, template-file/composer docs, compendium index                                                                                                       | Prior-art images remain reference-only                                                                                            |
| Closeout            | Executing sprint, EPIC-19 tickets, ledger, actual runner manifest                                                                                                                                                                                                                   | Execution result is separate from the planning result; runner owns `run.json`                                                     |

## Definition of Done

- [x] BW-1901 through BW-1908 meet their original ticket acceptance criteria and the corresponding Implementation phase checklists/gates, in dependency order with linked evidence.
- [x] Build v3 stores only authored choices; v1/v2 migrate neutrally without losing equipment, titles, overlays, inactive loadouts, or saved internals. Future/corrupt data still blocks unsafe writes.
- [x] Inherit, None, and explicit selection remain distinct; compact gear replaces contributions and respects primary-only eligibility, zero base, Any, actual/same primary changes, secondary retention, and scoped hidden armor edits.
- [x] One shared projection produces the 16/19/20 examples, uncapped 23 explanation, scoped unresolved results, per-source legality, and consistent description/cost/timing displays. Base points, title ranks, permanent equipment validation, and catalog facts retain their existing meanings.
- [x] Self preferences survive removal, mode/profession changes, reset/re-addition, and reload without bypassing legality. External Refrain is opt-in, explicit +1–4, and counted once. Collapsed counts include active capped contributions.
- [x] Local assets cover the pinned 126 rune IDs and 30 verified source images; unique tier lookup, exact hash failure, non-root Vite paths, and a tracked provenance manifest are proven; non-square images render correctly, provenance/hashes and exact policy paths are present, and missing-image controls remain usable.
- [x] Mounted rune/headgear/effect controls, blue ranks, and contribution explanations are usable by keyboard, pointer, and touch with both themes, narrow layouts, long names, five primary attributes, and 200% zoom.
- [x] Bonus-only edits dirty only the selected authored loadout, survive complete-document paths, and leave exact-source/canonical base game codes unchanged. UI disclosure alone is not authored state.
- [x] Ordinary import clears explicit adjustments and recomputes its own defaults; cancel/error leaves authored state intact. Save retains browser choices, preserves existing folder transactions, and emits only proven base code. Standalone previews remain isolated. Existing share controls and party multi-code omission notices account for authored adjustments while their template payloads stay base-only.
- [x] Actual browser evidence and disposable-folder/fallback checks are complete; missing evidence is not represented as a pass.
- [x] `npm run verify` and `git diff --check` pass during implementation; docs, tickets, executing sprint, ledger, and result manifest agree. Deferred work remains deferred.

## Risks

| Risk                                                                 | Mitigation and verification gate                                                                                                                                                 |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Silent loss through explicit cloners or inactive nested snapshots    | Phase 2 finishes recursive migration and non-default active/inactive/saved fixtures before UI integration; Phase 7 proves real transfer entry points.                            |
| Compact and legacy surfaces disagree or double-count                 | Replacement is per contribution with one domain resolver; hidden commands invalidate only proven affected targets. Test old/new rune target unions and no-op commands.           |
| Unknown legacy equipment becomes plausible but false numeric output  | Retain raw evidence, scope uncertainty, and omit unresolved description rank keys. Explicit overrides resolve only their addressed component.                                    |
| A cap hides an invalid base or changes permanent validation          | Validate purchased inputs before preview capping; leave generic arithmetic/permanent rules unchanged and compare their outputs in regression fixtures.                           |
| Effects activate from display text, illegal source, or wrong variant | Fixed identity registry, explicit per-source gates, catalog uniqueness assertions, faction deduplication, and PvE/PvP fixtures. No whole-bar validity prerequisite.              |
| Refrain introduces recursive inference or stale persisted defaults   | Store an explicit external magnitude and only manual preferences; derive all automatic values from the current Build each time.                                                  |
| Asset tooling rejects all runes or duplicates binaries               | Dedicated non-square rune validation and file-identity deduplication; assert the current release's 126 mappings/30 referenced binaries and inspect real images.                  |
| Full catalog renders become expensive or reuse another build's ranks | Compute/reuse per immutable Build/catalog identity. Test state changes and visually exercise large catalog views; never cache by template code.                                  |
| Browser/file acceptance cannot run in the execution environment      | Preflight in Phase 1, start evidence in Phase 5, and keep incomplete acceptance open. Do not substitute package installation or CSS inspection for results.                      |
| Old application versions cannot understand v3 after deployment       | Keep schema markers explicit and old/new recovery behavior tested. Avoid envelope churn; document that downgrading requires a compatible backup rather than stripping v3 fields. |

## Security

- Treat local storage and complete-document imports as untrusted: bounded arrays/IDs, exact new-field shapes, duplicate rejection, existing dangerous-key rejection, and whole-document transactional failure. Preserve original rejected payloads and write blocking; never silently retain only the valid subset of adjustments.
- Keep preferences descriptive and eligibility-gated. They cannot grant export legality, mutate base game fields, or establish permanent equipment requirement/health/armor claims.
- Acquire rune bytes only through bounded offline tooling from verified source identities. Validate redirects, MIME/signature/dimensions/hashes, and contained output paths. Runtime manifests carry local paths only; provenance URLs stay outside network-bearing React/CSS primitives.
- Preserve existing explicit file selection, permission requests, fresh reads, filename validation, overwrite confirmation, abort-on-write-failure, and success reporting. Tests and manual checks use disposable copied files; no live game folder is a test target.
- Render labels, unresolved IDs, and source explanations as escaped text. This feature adds no credentials, backend, telemetry, arbitrary executable effect expressions, or new HTML ingestion.

## Dependencies

- Completed prerequisites: EPIC-03, EPIC-04, EPIC-05, EPIC-06, EPIC-09, EPIC-10, EPIC-14, EPIC-15, EPIC-17, and EPIC-18, as recorded by EPIC-19.
- Promoted profession/attribute, skill, rune, and title catalogs; existing semantic equipment/rune helpers; current template adapter and local document persistence/transfer infrastructure.
- Existing React/TypeScript/Vite/Vitest stack and Python ingestion environment. `npm run verify` requires the configured `.venv-data`; no new runtime package is needed. Use existing tooling for formatting and the asset command rather than introducing an ingestion framework.
- User-authorized narrow rune asset exception, access to authentic image bytes or a verifiable local cache, and an actual browser capable of exercising native folder and fallback paths.
- The planning result is `work/runs/ticket-burn/EPIC-19/20260914T004651Z/plan-EPIC-19-result.json`. Execution owns its separate execution result and evidence-driven closeout; the runner owns run state and commit behavior. The planning-only no-code restriction ended at execution; the execution contract forbids commits.

## Open Questions

No blocking human scope or architecture questions remain. The user authorized skipping routine interview and automatic approval once the plan is validated. Execute with the recorded defaults.

- **Source accessibility:** Execution records whether current wiki checks use direct access or indexed material and reports unavailable sources. Accepted rules and local identity fixtures remain the baseline; contradictory source evidence is a documented correctness issue, not permission to broaden scope.
- **Browser acquisition:** Execution selects an available actual browser/tool during Phase 1; available browser automation is permitted without requiring a permanent new repository dependency. If native folder interaction or a required viewport/input case cannot be exercised, record the missing evidence and leave its acceptance item open.
- **Future equipment reconciliation:** Compact choices are deliberate contribution replacements, not a reconstructed five-piece armor loadout. Full armor/rune health accounting and multi-surface equipment reconciliation belong to a later milestone.
- **Future complete builds:** Named saves and richer file/URL interfaces must preserve stable Build identity and v3 fields. Equal standard game codes must never become a reason to merge differing adjustment profiles.

## Execution closeout

Implemented all eight phases with [durable evidence](SPRINT-020-EVIDENCE.md).
Final `npm run verify` and `git diff --check` pass. Production Chrome/Firefox
scenarios, actual 200% browser zoom, genuine native folder transactions and
fallback downloads are recorded in `work/runs/SPRINT-020/browser-evidence.md`.
The conditional unavailable-access item was evaluated: browser and asset access
were available, and all required scenarios have results. Picker cancellation uses
owning-tab closure; failure injection and fixture setup are explicitly labeled.

BW-1901–BW-1908 and EPIC-19 are done in SPRINT-020. No commits were created.
The separate execution manifest is
`work/runs/ticket-burn/EPIC-19/20260914T004651Z/execute-SPRINT-020-result.json`.
Planning output and runner-owned `run.json` are preserved.
