# SPRINT-020: Composer Attribute Adjustments

## Overview

SPRINT-020 implements EPIC-19, covering BW-1901 through BW-1908. The sprint adds compact authored attribute adjustments to the composer so a build can preview intended rune, headgear, and temporary effect bonuses without changing authored base allocations or Guild Wars template code semantics.

The implementation keeps base attribute arrows unchanged, keeps game template import/export base-only, and routes every visible skill calculation through one shared preview-rank projection. The new authored state is local-first and durable inside Build Wars documents, backups, build sets, and party transfer internals, while ordinary template files and template URLs remain interoperable with the game.

Primary scope:

- Inline primary-profession rune controls with None, +1, +2, and +3 choices using local rune icons.
- One clearable +1 headgear selection across primary-profession attributes.
- Advanced assumed-effect controls for Glyph of Elemental Power, Elemental Lord, Masochism, and external Heroic Refrain.
- Blue effective-rank presentation with accessible explanations and capped preview rank details.
- Build schema v3 migration while preserving the existing `build-wars:v1` local-storage envelope.
- Boundary audits for template import/export, folder sync, standalone previews, backups, build sets, and party transfer.

Non-goals:

- No armor editor, armor-slot management, backend, sidecar file format, named-save expansion, combined build format, generic parser, generic simulator, total health claims, armor claims, title rank redesign, permanent equipment validation rewrite, standard template legality change, or fingerprint behavior change beyond the new authored settings.

## Use Cases

1. A player allocates 12 Fire Magic, chooses +1 headgear and a Superior Fire rune, and sees Fire Magic preview as 16 while the authored base rank remains 12.
2. A player with Glyph of Elemental Power on the bar sees elemental attribute descriptions calculate with +2 when the skill is legally available, and the auto effect disappears when profession, mode, or bar legality no longer qualifies.
3. A player manually disables an inferred self effect, removes the source skill, reloads the page, later re-adds the skill, and the explicit preference remains stable until reset.
4. A player opts into external Heroic Refrain in PvE, chooses +4, and sees ordinary available attributes cap at 20 with an explanation that preserves the uncapped value.
5. A player imports an ordinary game template and gets only base professions, base attributes, and skills; explicit adjustments are cleared, self effects infer from the new bar, and external Refrain remains off.
6. A player saves or copies a game template from a build with adjustments and gets the same base-only template code plus existing omission/discard copy.
7. A player uses full Build Wars backup, build-set transfer, or party transfer and retains authored adjustment settings exactly.
8. A player changes the actual primary profession and compact gear choices clear; setting the same primary profession is a no-op, and valid choices survive secondary profession edits.

## Architecture

### Authored State

Add Build schema v3 with a nullable compact adjustment profile on each `Build`:

```ts
readonly attributeAdjustments: BuildAttributeAdjustments | null;
```

Recommended shape:

```ts
interface BuildAttributeAdjustments {
  readonly equipment: {
    readonly headgear: CompactHeadgearOverride | null;
    readonly runes: readonly CompactRuneOverride[];
  };
  readonly effects: readonly AssumedAttributeEffectPreference[];
}

type CompactHeadgearOverride =
  | { readonly kind: "none" }
  | { readonly kind: "selected"; readonly attributeId: AttributeId };

type CompactRuneOverride =
  | { readonly attributeId: AttributeId; readonly kind: "none" }
  | { readonly attributeId: AttributeId; readonly kind: "selected"; readonly runeId: RuneId };

type AssumedAttributeEffectPreference = {
  readonly effectId: "glyph-of-elemental-power" | "elemental-lord" | "masochism" | "heroic-refrain";
  readonly preference: "on" | "off";
  readonly intensity?: 1 | 2 | 3 | 4;
};
```

State semantics:

- Missing `attributeAdjustments`, missing equipment rows, or missing effect rows mean default behavior.
- Missing compact equipment inherits existing semantic equipment contributions.
- Explicit compact `none` suppresses the inherited legacy contribution for that specific headgear or attribute rune.
- Explicit compact selection replaces the inherited legacy contribution for that specific headgear or attribute rune.
- Unknown or incompatible selected rune IDs are persisted, grant no bonus, and remain diagnosable/removable.
- Effect rows store only explicit user preference. Automatic self-effect activity is derived from the current legal source skill, profession, and mode.
- Heroic Refrain is external and opt-in; absence means off, never inferred from the local skill bar.
- Empty neutral profiles should avoid materializing unrelated equipment settings on blank builds and ordinary imports.

### Projection Pipeline

Create one shared rank projection used by composer rows, skill bars, catalog displays, tooltips, alternate skill views, and skill attribute effects:

1. Start with authored base attributes and preserve invalid base values as invalid.
2. Resolve compact equipment overrides against semantic equipment in `build.equipment`.
3. Apply primary-only headgear and primary-only rune contributions.
4. Derive assumed effects from legal mode/profession/source-skill identity and stable explicit preferences.
5. Apply preview bonuses to ordinary available attributes.
6. Cap ordinary preview ranks at 20 after effects while retaining uncapped rank and contribution explanation.
7. Return base rank, equipment-adjusted rank, preview rank, uncapped rank, cap status, active/inactive contributions, unresolved contribution diagnostics, and display labels.

The low-level effective-rank calculator should remain usable by permanent equipment validation without importing temporary effect assumptions. The new cap belongs in the preview projection layer, not in permanent equipment legality or template export.

### Source Rules

The sprint recognizes exactly these assumed effects:

- Glyph of Elemental Power, template ID `198`: automatic self effect, either mode, +2 to Air Magic, Earth Magic, Fire Magic, and Water Magic.
- Elemental Lord, template IDs `1951` and `2094`: automatic self effect, PvE only, +1 to Air Magic, Earth Magic, Fire Magic, and Water Magic. Luxon and Kurzick variants count once.
- Masochism, template ID `2139`: automatic self effect, PvE only, +2 to Death Magic and Soul Reaping. Template ID `3054` is excluded.
- Heroic Refrain, template ID `3431`: external effect only, PvE only, opt-in, +1 through +4 to ordinary available attributes.

Effect resolution must use stable template/source identities, not localized names or text search. Forced-on preferences do not bypass profession, mode, source, or variant gates.

### Rune Assets

Attribute rune controls use local runtime assets only. The rune catalog has 126 attribute rune records and 30 profession-tier source image identities. Extend the existing skill-icon asset pattern narrowly for rune icons:

- Generated runtime manifest maps every attribute rune record to a local public asset.
- Provenance manifest records source facts and local cache metadata.
- Runtime TypeScript never fetches remote icon URLs.
- Missing or unresolved images fall back to the existing icon fallback behavior.

## Implementation

### Phase 1: BW-1901 - Adjustment Contracts and Source Rules

Goal: establish executable domain contracts and source fixtures before touching persistence or UI.

Concrete work:

- Add adjustment contract types and source constants in new domain files, likely `src/domain/attribute-adjustments.ts` and `src/domain/assumed-attribute-effects.ts`.
- Add tests for the four supported effect identities, Elemental Lord dedupe, Masochism PvP exclusion, PvE gates, external Refrain opt-in behavior, and ordinary-attribute targeting.
- Add tests for compact equipment precedence: absent inherits legacy, explicit None suppresses, explicit selection replaces, incompatible selection persists but contributes zero.
- Add tests that base game template import/export behavior is unchanged by the new contract layer.
- Keep this phase free of app UI changes except imported types/constants required by tests.

Files to create or modify:

- `src/domain/attribute-adjustments.ts`
- `src/domain/assumed-attribute-effects.ts`
- `test/domain/attribute-adjustments.test.ts`
- `test/domain/assumed-attribute-effects.test.ts`
- Potentially `src/domain/index`-style exports only if the repository already uses them.

Checks:

- `npm run test:run -- --run test/domain/attribute-adjustments.test.ts test/domain/assumed-attribute-effects.test.ts`
- Verify source IDs `198`, `1951`, `2094`, `2139`, `3054`, and `3431` are covered by fixture assertions.

### Phase 2: BW-1902 - Authored State and Draft Persistence

Goal: persist compact authored settings safely across the local-first document lifecycle.

Concrete work:

- Bump `BUILD_SCHEMA_VERSION` from 2 to 3 in `src/domain/build.ts`.
- Add `attributeAdjustments: BuildAttributeAdjustments | null` to `Build`.
- Update `createBlankBuild` in `src/app/editor-state.ts` to create schema v3 builds with neutral adjustment state.
- Add reducer actions for compact rune, headgear, effect preference, effect reset, and Heroic Refrain intensity edits.
- Clear compact gear overrides only when the actual primary profession changes; same-primary updates are a no-op for compact gear.
- Keep valid compact gear choices when only the secondary profession changes.
- Update hidden semantic equipment reducers in `src/app/equipment-editor-state.ts` so armor edits that affect the same contribution clear only the compact override they edit.
- Update strict parsing, migration, and cloners in `src/app/persistence-schema.ts`.
- Preserve new fields through workspace hydration, selected loadout changes, duplicate/copy flows, autosave/pagehide flush, conflict recovery, backup/restore, build-set transfer, and party transfer.
- Keep the local storage key and envelope recovery behavior unchanged.

Files to modify:

- `src/domain/build.ts`
- `src/domain/build-set.ts`
- `src/app/editor-state.ts`
- `src/app/equipment-editor-state.ts`
- `src/app/persistence-schema.ts`
- `src/app/local-storage.ts`
- `src/app/workspace-state.ts`
- `src/app/backup-restore.ts`
- `src/app/build-set-transfer.ts`
- `src/app/party-transfer.ts`
- `src/app/template-import.ts`
- `src/app/template-workflow.ts`

Tests to add or extend:

- Build v1 and v2 persisted documents migrate to v3 with neutral adjustments.
- Malformed adjustment state is rejected without corrupting the existing local envelope.
- Future schema versions remain rejected.
- Clones preserve adjustment state but do not share mutable references.
- Autosave and pagehide persistence include explicit adjustments.
- Duplicate selected build, duplicate build-set entry, backup/restore, build-set transfer, and party transfer preserve explicit settings.
- Blank builds and ordinary imports do not materialize unrelated adjustment settings.
- Primary profession changes clear compact gear; same-primary edits do not; secondary-only edits keep valid choices.

Checks:

- `npm run test:run -- --run src/app/persistence-schema.test.ts src/app/editor-state.test.ts src/app/workspace-state.test.ts`
- Add focused tests to the nearest existing files if these exact filenames differ.

### Phase 3: BW-1903 - Effective Ranks and Assumed Effects

Goal: replace duplicated selector rank logic with a shared preview projection that includes compact equipment and assumed effects.

Concrete work:

- Add a shared projection module, likely `src/domain/attribute-rank-preview.ts`, that accepts build state, catalogs, selected mode, selected professions, and selected loadout.
- Reuse `collectEquipmentAttributeRankAdjustments` and `summarizeAttributeRuneEffects`, extending them to understand compact override precedence while keeping permanent semantic equipment validation separate.
- Return structured contribution rows for semantic equipment, compact overrides, self effects, external effects, unresolved selections, inactive effects, and rank caps.
- Apply ordinary preview cap at 20 after effects and expose both capped and uncapped values.
- Update `src/app/composer-selectors.ts` and `src/app/editor-selectors.ts` to use the shared projection instead of separately collecting equipment adjustments.
- Ensure skill descriptions, catalog rows, alternate skill views, tooltips, Expertise, Mysticism, and Fast Casting all use preview ranks.
- Keep template export validation and permanent equipment validation based on semantic equipment and base template legality.

Files to modify:

- `src/domain/equipment-attribute-rank.ts`
- `src/domain/effective-attribute-rank.ts` only if new result helpers are needed
- `src/domain/attribute-rank-preview.ts`
- `src/app/composer-selectors.ts`
- `src/app/editor-selectors.ts`
- `src/domain/skill-attribute-effects.ts`
- `src/app/components/SkillTooltip.tsx`
- `src/app/components/SkillBar.tsx`
- `src/app/components/FocusedSkillCatalog.tsx`

Tests to add or extend:

- `12 + 1 + 3 = 16` with compact headgear and rune.
- `Fire 12 + 1 + 3 + Glyph 2 + Lord 1 = 19`.
- Heroic Refrain +4 caps ordinary preview rank at 20 and exposes uncapped explanation.
- Secondary Elementalist attributes can receive Glyph/Lord effects but cannot receive inline gear controls.
- Masochism affects Death Magic and Soul Reaping only in PvE with template ID `2139`.
- Elemental Lord faction versions dedupe when both identities are present.
- Forced-on self effects do not bypass illegal profession, mode, or source-skill gates.
- Invalid base values remain invalid and are not made valid by bonuses.
- Standard template legality, permanent equipment validation, and base export fingerprints remain unchanged.

Checks:

- `npm run test:run -- --run test/domain/effective-attribute-rank.test.ts src/app/skill-attribute-effects.test.tsx src/app/attribute-editor.test.tsx`
- Add projection-specific tests if the new module warrants a dedicated test file.

### Phase 4: BW-1904 - Local Rune Icon Assets

Goal: make rune icons available locally before building inline rune controls.

Concrete work:

- Add a rune icon cache script following the existing skill-icon pattern.
- Generate local assets under `public/gww-icons/runes/`.
- Generate a runtime manifest such as `src/app/rune-icon-assets.generated.json`.
- Generate a provenance manifest such as `data/generated/epic-10/rune-icon-assets.manifest.json`.
- Extend `src/app/icon-assets.ts` with `localRuneIconAsset`.
- Extend `src/app/components/CatalogIcon.tsx` only as needed to render rune/equipment icons through the existing fallback path.
- Extend ADR 0002 narrowly to include generated rune icons as approved runtime GWW icon assets.
- Add source-policy tests that runtime code does not use remote rune URLs.

Files to create or modify:

- `scripts/data/cache_rune_icons.py`
- `scripts/data/build_wars_ingest/rune_icon_assets.py`
- `scripts/data/build_wars_ingest/tests/test_rune_icon_assets.py`
- `public/gww-icons/runes/README.md`
- `src/app/rune-icon-assets.generated.json`
- `src/app/icon-assets.ts`
- `src/app/icon-assets.test.ts`
- `data/generated/epic-10/rune-icon-assets.manifest.json`
- `compendium/decisions/0002-runtime-gww-icon-assets.md`
- `test/domain/source-policy.test.ts`

Tests and checks:

- Assert 126 attribute rune records are mapped.
- Assert those records resolve to 30 unique profession-tier image identities.
- Assert runtime manifest paths are local and stable.
- Assert missing-image fallback renders.
- `npm run data:test`
- `npm run test:run -- --run src/app/icon-assets.test.ts test/domain/source-policy.test.ts`

### Phase 5: BW-1905 - Inline Runes, Headgear, and Blue Ranks

Goal: expose equipment adjustments directly inside the focused attribute editor.

Concrete work:

- Extend `selectFocusedAttributeRows` to include row-level rune options, headgear eligibility, selected compact state, effective preview ranks, and accessible contribution summaries from the shared projection.
- Add inline controls beside primary-profession attribute rows only.
- Render a mutually exclusive rune group per eligible row with None, +1, +2, and +3 choices. Use local rune icons, accessible labels, and clear selected state.
- Render one headgear +1 control across eligible primary-profession rows with a clear action.
- Keep base-rank arrow controls and point validation unchanged.
- Allow rune/headgear edits when base rank is 0.
- Hide equipment controls for secondary-profession rows, retained unavailable rows, and `Any` profession.
- Show preview ranks in blue only when preview rank is greater than base rank.
- Provide hover, focus, and touch-accessible breakdown content for equipment, effects, unresolved selections, and cap explanations.
- Keep compact row layout stable at desktop, mobile, long localized names, and 200 percent zoom.

Files to modify:

- `src/app/composer-selectors.ts`
- `src/app/components/FocusedAttributeEditor.tsx`
- Potentially new `src/app/components/AttributeAdjustmentControls.tsx`
- Potentially new `src/app/components/AttributeRankBreakdown.tsx`
- `src/app/components/CatalogIcon.tsx`
- `src/app/styles.css`
- `src/app/attribute-editor.test.tsx`

Tests and checks:

- Component tests for rune None/+1/+2/+3 selection and headgear radio/clear behavior.
- Component tests that controls hide for secondary-only rows, retained unavailable rows, and no-profession rows.
- Component tests that base arrows still modify only base allocation.
- Component tests that zero-base attributes can receive compact gear edits.
- Component tests for blue-rank and accessible breakdown text.
- Browser check at 1280x900, 390px mobile width, both themes, 200 percent zoom, long attribute names, no selected loadout, keyboard navigation, and touch interaction.

### Phase 6: BW-1906 - Advanced Assumed Effect Controls

Goal: let users inspect and override preview assumptions without making temporary effects look like permanent build legality.

Concrete work:

- Add an advanced disclosure below the focused attribute editor or in the existing composer control area, consistent with current UI density.
- Show supported self effects with derived automatic state, explicit on/off override state, reset action, and inactive reason where relevant.
- Show external Heroic Refrain as an opt-in PvE-only control with intensity selector `+1` through `+4`, defaulting to `+1` when enabled.
- Display a collapsed active-count summary.
- Scope controls to the selected build/loadout and persist explicit preferences through reload, mode changes, profession changes, and skill removal.
- Do not infer Heroic Refrain from the local skill bar, and do not double-count it if the skill is also on the bar.
- Keep forced-on effects subject to legality gates and show inactive reasons when blocked.

Files to modify:

- `src/app/composer-selectors.ts`
- `src/app/editor-state.ts`
- `src/app/components/BuildComposer.tsx`
- New `src/app/components/AssumedEffectControls.tsx`
- `src/app/styles.css`
- `src/app/attribute-editor.test.tsx`
- `src/app/skill-attribute-effects.test.tsx`

Tests and checks:

- Automatic self effects follow legal source skill identity.
- Explicit off survives source skill removal, re-add, mode changes, profession changes, and reload.
- Reset removes explicit preference and returns to derived automatic behavior.
- Heroic Refrain starts off, enables at +1, supports +1 through +4, applies only in PvE, and never self-infers.
- Collapsed active count updates for auto and explicit active effects.
- Keyboard, focus, and touch interactions work in real browser checks.

### Phase 7: BW-1907 - Game Template and Transfer Boundaries

Goal: preserve interoperable game-template behavior while full internal documents retain authored adjustments.

Concrete work:

- Audit `src/app/template-workflow.ts` so exact and canonical game-template exports include only professions, base attributes, skills, and title ranks as currently supported.
- Ensure ordinary template imports replace the selected build with neutral compact adjustments, then let self effects infer from the imported legal bar and keep external effects off.
- Make cancel/error flows transactional so failed or canceled imports preserve the current adjusted build unchanged.
- Extend existing replacement-warning copy in `src/app/template-import.ts` to include explicit adjustments in the same warning path, without adding another prompt.
- Extend existing omission/discard copy in inline export, browser save, and copy flows to mention that attribute adjustments are Build Wars-only and not part of game templates.
- Keep standalone file previews isolated from current build adjustments.
- Ensure full internal document paths preserve adjustment settings: local autosave, backup/restore, build-set transfer, party transfer, document duplicate, and selected loadout internals.
- Keep template URLs and share/copy fingerprints unchanged except where existing dirty tracking reflects local authored adjustment edits.

Files to modify:

- `src/app/template-workflow.ts`
- `src/app/template-import.ts`
- `src/app/template-files.ts`
- `src/app/components/InlineTemplateCode.tsx`
- `src/app/components/TemplateFileControls.tsx`
- `src/app/components/TemplateBrowserDialog.tsx`
- `src/app/components/TemplatePreview.tsx`
- `src/app/build-set-state.ts`
- `src/app/workspace-state.ts`
- `src/app/template-browser.test.tsx`
- `src/app/template-workflow.test.ts`
- `compendium/template-files.md`

Tests and checks:

- Importing a game template clears explicit compact equipment and effect preferences.
- Imported self effects infer only from the imported bar and legal mode/profession.
- Imported Heroic Refrain remains off.
- Canceled import and invalid import preserve the previous adjusted build.
- Export exact/canonical/copy/save produce base-only codes equal to pre-sprint expectations.
- Existing replacement warning covers explicit adjustments without a second prompt.
- Standalone file preview does not show the current build's adjustments.
- Full backup/restore, build-set transfer, and party transfer round-trip adjustment settings.

### Phase 8: BW-1908 - Browser Verification and Closeout

Goal: finish the sprint with focused automated coverage, real-browser evidence, documentation updates, and ticket closeout.

Concrete work:

- Run all focused tests added in BW-1901 through BW-1907.
- Run repository verification:
  - `npm run verify`
  - `git diff --check`
- Browser verification matrix:
  - Desktop 1280x900.
  - Mobile 390px width.
  - 200 percent zoom.
  - Light and dark themes.
  - Long attribute/effect names.
  - No selected loadout.
  - Keyboard-only operation of rune, headgear, disclosure, reset, and Refrain intensity controls.
  - Touch operation of rank breakdown and controls.
  - Reload persistence.
  - Disposable Guild Wars Skills folder for import/save boundaries.
- Record evidence in the sprint evidence location used by the project.
- Update docs and planning records after implementation:
  - `compendium/attribute-adjustments.md`
  - `compendium/template-files.md`
  - ADR 0002
  - Ticket checkboxes for BW-1901 through BW-1908
  - Sprint ledger or burn manifest
  - Future-work notes only for parked, explicitly out-of-scope items

Checks:

- No remote icon URLs appear in runtime TypeScript or generated runtime manifests.
- No game-template export includes compact adjustments or temporary effect preferences.
- Internal Build Wars documents round-trip compact adjustments.
- UI has no overlapping text or unstable layout in the browser matrix.

## Files Summary

Primary domain files:

- `src/domain/build.ts`
- `src/domain/build-set.ts`
- `src/domain/attribute-adjustments.ts`
- `src/domain/assumed-attribute-effects.ts`
- `src/domain/attribute-rank-preview.ts`
- `src/domain/equipment-attribute-rank.ts`
- `src/domain/effective-attribute-rank.ts`
- `src/domain/rune-effects.ts`
- `src/domain/skill-attribute-effects.ts`
- `src/domain/catalog-lookup.ts`

Primary app state and persistence files:

- `src/app/editor-state.ts`
- `src/app/equipment-editor-state.ts`
- `src/app/persistence-schema.ts`
- `src/app/local-storage.ts`
- `src/app/workspace-state.ts`
- `src/app/backup-restore.ts`
- `src/app/build-set-transfer.ts`
- `src/app/party-transfer.ts`
- `src/app/build-set-state.ts`

Primary selector and UI files:

- `src/app/composer-selectors.ts`
- `src/app/editor-selectors.ts`
- `src/app/components/BuildComposer.tsx`
- `src/app/components/FocusedAttributeEditor.tsx`
- `src/app/components/AssumedEffectControls.tsx`
- `src/app/components/AttributeAdjustmentControls.tsx`
- `src/app/components/AttributeRankBreakdown.tsx`
- `src/app/components/CatalogIcon.tsx`
- `src/app/components/SkillBar.tsx`
- `src/app/components/SkillTooltip.tsx`
- `src/app/components/FocusedSkillCatalog.tsx`
- `src/app/styles.css`

Template and transfer boundary files:

- `src/app/template-workflow.ts`
- `src/app/template-import.ts`
- `src/app/template-files.ts`
- `src/app/components/InlineTemplateCode.tsx`
- `src/app/components/TemplateFileControls.tsx`
- `src/app/components/TemplateBrowserDialog.tsx`
- `src/app/components/TemplatePreview.tsx`

Rune asset files:

- `scripts/data/cache_rune_icons.py`
- `scripts/data/build_wars_ingest/rune_icon_assets.py`
- `scripts/data/build_wars_ingest/tests/test_rune_icon_assets.py`
- `public/gww-icons/runes/README.md`
- `src/app/rune-icon-assets.generated.json`
- `src/app/icon-assets.ts`
- `src/app/icon-assets.test.ts`
- `data/generated/epic-10/rune-icon-assets.manifest.json`
- `compendium/decisions/0002-runtime-gww-icon-assets.md`
- `test/domain/source-policy.test.ts`

Likely test files to extend:

- `test/domain/effective-attribute-rank.test.ts`
- `test/domain/armor-equipment.test.ts`
- `test/domain/rune-effects.test.ts`
- `src/app/attribute-editor.test.tsx`
- `src/app/skill-attribute-effects.test.tsx`
- `src/app/template-browser.test.tsx`
- `src/app/template-workflow.test.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/editor-state.test.ts`
- `src/app/workspace-state.test.ts`

Documentation and planning records:

- `compendium/attribute-adjustments.md`
- `compendium/template-files.md`
- `compendium/decisions/0002-runtime-gww-icon-assets.md`
- `work/tickets/19-composer-attribute-adjustments/BW-1901-adjustment-contracts-and-source-rules.md`
- `work/tickets/19-composer-attribute-adjustments/BW-1902-authored-state-and-draft-persistence.md`
- `work/tickets/19-composer-attribute-adjustments/BW-1903-effective-ranks-and-assumed-effects.md`
- `work/tickets/19-composer-attribute-adjustments/BW-1904-local-rune-icon-assets.md`
- `work/tickets/19-composer-attribute-adjustments/BW-1905-inline-runes-headgear-and-blue-ranks.md`
- `work/tickets/19-composer-attribute-adjustments/BW-1906-advanced-assumed-effect-controls.md`
- `work/tickets/19-composer-attribute-adjustments/BW-1907-game-template-and-transfer-boundaries.md`
- `work/tickets/19-composer-attribute-adjustments/BW-1908-browser-verification-and-closeout.md`

## Definition of Done

- Build schema v3 persists compact adjustment state while old v1/v2 builds migrate safely.
- Compact equipment override precedence is implemented: absent inherits, None suppresses, selected replaces.
- Actual primary profession changes clear compact gear choices, same-primary edits are no-ops, and secondary-only edits retain valid choices.
- Shared preview projection is the only source for displayed attribute ranks and skill calculations in composer, catalog, bar, tooltip, alternate views, Expertise, Mysticism, and Fast Casting.
- Ordinary preview ranks cap at 20 after effects and expose uncapped explanations.
- Glyph of Elemental Power, Elemental Lord, Masochism, and Heroic Refrain follow the exact identity, mode, profession, dedupe, and opt-in rules in the sprint contract.
- Inline primary-only rune and headgear controls are accessible, keyboardable, touchable, stable at required viewports, and use local rune icons with fallback.
- Game template import/export/copy/save remain base-only, and ordinary imports reset explicit adjustments transactionally.
- Full internal Build Wars document paths preserve adjustments.
- Runtime code uses no remote rune icon URLs.
- Attribute rune asset verification confirms 126 attribute rune records and 30 profession-tier image identities.
- Focused tests for every ticket pass.
- `npm run verify` passes.
- `git diff --check` passes.
- Browser verification evidence is recorded for desktop, mobile, zoom, themes, long names, no-loadout state, keyboard, touch, reload, and disposable Skills folder workflows.
- BW-1901 through BW-1908 tickets and sprint closeout records are updated by the executor.

## Risks

- Selector drift: existing rank logic is duplicated between composer and editor selectors. Mitigation: land the shared projection before UI work and remove direct equipment-only rank paths from display selectors.
- Persistence regressions: strict parsing and explicit cloners can silently drop new fields. Mitigation: add round-trip tests for every clone/transfer/import/export path touched by `Build`.
- Template boundary confusion: local adjustments are authored Build Wars state, not game template content. Mitigation: keep export functions base-only and extend existing omission copy instead of adding new prompts.
- Effect legality edge cases: forced preferences may accidentally bypass mode/profession/source gates. Mitigation: centralize effect resolution and test forced-on blocked states.
- Rune asset churn: 126 rune records share only 30 source image identities, so naive caching may download or map duplicate assets inconsistently. Mitigation: dedupe by source image identity while preserving per-rune manifest mappings.
- UI density: inline controls can crowd rows at mobile width or high zoom. Mitigation: use stable grid dimensions, compact icon controls, accessible popovers, and real-browser layout checks before closeout.
- Hidden equipment editor interactions: existing semantic equipment reducers are not mounted but still exist. Mitigation: update reducers so semantic edits clear only affected compact overrides and add reducer-level tests.

## Security

- Runtime icon rendering must use local public assets or bundled fallback assets only.
- Rune asset scripts may use live network only through explicit data-generation commands, never at runtime.
- Generated manifests must not inject remote URLs into app code.
- Persistence parsing must reject malformed adjustment payloads and future unsupported schemas without damaging recoverable local storage.
- File System Access workflows must remain user-granted and should be verified only with disposable Skills folders.
- No backend, sidecar format, telemetry, or external service dependency is introduced.
- Adjustment settings must not alter standard template legality or bypass profession/mode gates for skills and effects.

## Dependencies

- BW-1901 has no sprint dependency and should land first.
- BW-1902 depends on BW-1901.
- BW-1903 depends on BW-1901 and BW-1902.
- BW-1904 depends on BW-1901 and can be implemented after or alongside the state/projection branch, but must land before BW-1905.
- BW-1905 depends on BW-1902, BW-1903, and BW-1904.
- BW-1906 depends on BW-1902, BW-1903, and BW-1905.
- BW-1907 depends on BW-1902, BW-1905, and BW-1906.
- BW-1908 depends on BW-1901 through BW-1907.

External and data dependencies:

- Existing generated rune catalog at `data/generated/epic-10/runes.catalog.json`.
- Existing skill catalog identity and mode-variant resolution.
- Existing local storage envelope key `build-wars:v1`.
- Existing icon asset policy in ADR 0002.
- Existing Vite/React test and verification commands from `package.json`.

## Open Questions

No blocking product questions remain. The sprint proceeds with these recorded assumptions:

- The compact adjustment field will be named `attributeAdjustments` unless implementation discovers a stronger existing naming convention.
- Blank builds and ordinary template imports use `attributeAdjustments: null` until the user authors an explicit adjustment.
- Effect preference absence means automatic behavior for self effects and off for external Heroic Refrain.
- Heroic Refrain intensity persists only with its explicit preference row and defaults to `+1` when first enabled.
- "Ordinary available attributes" means non-title attributes legal for the selected primary/secondary profession pair, including the selected primary profession's primary attribute and excluding unavailable secondary primary-only attributes.
- Existing unmounted semantic equipment state remains supported for import, persistence, and reducer safety, but no armor editor is mounted or restored.
- Documentation and ticket checkbox updates happen during BW-1908 closeout, not during the planning draft.
