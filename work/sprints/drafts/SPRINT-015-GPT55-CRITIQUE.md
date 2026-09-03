# Combined Critique: Sprint 015 Equipment Editor Drafts

## Executive Assessment

`SPRINT-015-GPT56SOL-DRAFT.md` is the stronger architectural draft. It is explicit about null-vs-empty equipment state, catalog isolation, reducer boundaries, stale selections, persistence safety, validation authority, and conservative stat summaries. Its main weakness is size: it risks turning one sprint into a broad app-platform rewrite.

`SPRINT-015-GPT54-DRAFT.md` is cleaner and easier to execute, with better phase readability and a useful “stabilize contracts before components” sequence. Its weakness is under-specification: several hard failure modes are acknowledged only at a high level or omitted.

The merged sprint should use GPT56SOL as the architectural base, pull in GPT54’s Phase 0 contract-freeze and simpler sequencing, and aggressively trim optional UI/detail/stat work.

## `SPRINT-015-GPT56SOL-DRAFT.md`

### Strengths

- Strong architecture boundaries: generated catalogs remain behind `src/app/catalogs.ts`, reducers remain catalog-independent, domain validation remains authoritative, and UI receives app-owned views.
- Clear null-vs-empty policy: opening Equipment does not mutate `Build.equipment`; first authored edit materializes a canonical loadout.
- Good preservation model for stale, incompatible, unresolved, and retained invalid selections.
- Correctly treats persistence as release-critical rather than a late polish item.
- Strong conservative-analysis stance: no full combat simulation, no cross-set weapon totals, no parsing numeric values from prose.
- Excellent Definition of Done coverage across catalog, reducer, UI, persistence, sharing, accessibility, and regression behavior.

### Weaknesses

- Scope is very large for one sprint: tabs, catalog adaptation, reducer helpers, custom combobox, armor UI, weapon UI, summaries, validation grouping, strict persistence parser, backup/restore, share warnings, documentation, and ticket closeout all land together.
- The draft may over-prescribe implementation details before checking existing code constraints, especially around `activeEditorSurface`, unmounting skill content, suppressing the skill tooltip column, and adding several new app modules.
- The custom combobox is a hidden project of its own. ARIA correctness, keyboard behavior, scrolling, clipping, focus restoration, long labels, and retained invalid selections are all non-trivial.
- The “one release unit” principle is sound, but the phase plan still creates a long period where partially integrated code exists. It does not propose a feature flag or hidden route/state guard to prevent accidental exposure.
- Several UI behaviors are specified as final decisions where alternatives may be cheaper: peer tabs, inline fact details, authored requirement inputs, and conservative summaries.

### Gaps In Risk Analysis

- No explicit risk that tabbing/unmounting the existing skill browser changes search state, focus state, tooltip behavior, or test assumptions beyond one acceptance item.
- Partial catalog failure is well described, but the risk of inconsistent ready/error state across selectors, validation, and picker availability deserves more emphasis.
- Persistence rejection policy is ambiguous in places: some text suggests rejecting an affected record, while other text requires atomic backup rejection.
- No bundle-size or startup-cost risk for importing four promoted catalogs directly into the app.
- No explicit risk that “known-compatible only” option filtering prevents useful exploratory editing or blocks valid catalog-indeterminate cases outside modifiers.
- No clear mitigation for the volume of test fixture creation required to cover known, stale, unresolved, malformed, and partial-catalog states.

### Missing Edge Cases

- Importing or loading equipment with duplicate modifier entries whose occupied slots are unresolved or stale.
- Catalog-set mismatch where weapons are ready but modifiers are failed, or vice versa.
- A selected weapon changing from one-handed to two-handed after catalog refresh.
- A retained selected item whose label is unavailable because both its catalog and unresolved placeholder are missing.
- Keyboard behavior when the combobox list is capped at 100 results and the active item falls outside the rendered subset.
- Backup restore merge where one restored build is invalid but others are valid.
- Empty materialized equipment and authored equipment detection after duplicate/load/save-new flows.
- Requirement editor behavior when the selected weapon is cleared but an authored requirement is intentionally preserved.

### Definition Of Done Completeness

The DoD is very complete, arguably too complete. It covers architecture, behavior, security, persistence, sharing, accessibility, and closeout. The main issue is not missing coverage but execution risk: the DoD may be too broad to be useful as a sprint gate unless split into must-have release criteria and deferred follow-up criteria.

The strongest DoD items to preserve are:

- `equipment: null` remains untouched on render/open.
- First edit atomically creates canonical equipment.
- Existing invalid/unresolved selections stay visible and clearable.
- Persistence, backup/restore, autosave, and hydration round-trip non-null equipment.
- Skill-template/share payloads remain equipment-free with warnings.
- Domain validation remains the authority.

## `SPRINT-015-GPT54-DRAFT.md`

### Strengths

- Clearer and more compact than GPT56SOL.
- Good implementation sequencing, especially Phase 0 for baseline/contract freeze.
- Correctly puts catalog adaptation, reducer actions, validation input, and selector view models before component-heavy work.
- Good high-level scope exclusions: no raw equipment-template import/export, icons, skins, dyes, recommendations, DPS, hosted sharing, or full stat aggregation.
- Identifies `equipment-selectors.ts` as a preferred place for option filtering and presentation logic.
- Simpler risk table is readable and focused.

### Weaknesses

- Under-specifies several architecture boundaries that will matter during implementation.
- The proposed equipment panel “between SkillBar and SkillBrowser” may overload the main column and disrupt the current skill workflow. It lacks the stronger interaction model of peer Skills/Equipment tabs.
- Persistence is planned late, after UI and selectors “stop moving.” That is practical for implementation, but unsafe unless the equipment UI is hidden until durability passes.
- The catalog boundary section says what should be exposed but does not define error slice behavior, duplicate ID behavior, catalog-set mismatch behavior, or bounded diagnostics precisely.
- Reducer actions are listed only generally; non-cascading clear behavior, clear-hand behavior, stale state retention, and topology recovery are not specified enough.
- The Definition of Done is too high-level for a risky persistence/UI/domain integration sprint.

### Gaps In Risk Analysis

- Missing risk: partial equipment catalog failure taking down unrelated app workflows.
- Missing risk: UI option filtering and domain validation disagreeing.
- Missing risk: retained invalid selections disappearing under profession/mode/catalog changes.
- Missing risk: two-handed/off-hand edits silently deleting authored state.
- Missing risk: equipment freshness fields making old saves look stale or invalid.
- Missing risk: effective-rank displays overstating certainty when equipment evidence is unresolved.
- Missing risk: custom combobox accessibility and result-list performance.
- Missing risk: accidental equipment inclusion in share URLs, fingerprints, or exact-source template replay.

### Missing Edge Cases

- Opening Equipment must not dirty/autosave a build.
- Stale catalog IDs must remain visible and clearable.
- Explicit unresolved selections need bounded labels/reasons and persistence behavior.
- Noncanonical persisted topology should be rejected or recovered by a defined policy.
- Weapon/modifier catalog-set mismatch needs a concrete UI and validation behavior.
- Off-hand-only, two-handed-plus-off-hand conflict, wrong-hand retained weapon, duplicate modifiers, and missing weapon with modifiers need explicit acceptance.
- Backup restore must define whether invalid equipment rejects one record or the whole operation.
- Share warning should distinguish empty materialized equipment from meaningful authored equipment.
- Skill-template import over authored equipment needs explicit replacement warning behavior.

### Definition Of Done Completeness

The DoD is usable as a summary but not sufficient as an execution checklist. It lacks the detailed acceptance criteria needed for catalog failure isolation, persistence parsing, stale/unresolved selections, keyboard behavior, topology validation, and share/template invariants.

It would work as an executive summary of the sprint, but not as the final source of truth for implementation.

## Comparison

GPT56SOL is architecturally safer. It anticipates more failure modes and gives implementers concrete contracts for state, selectors, validation, persistence, and sharing.

GPT54 is operationally easier to follow. Its phase sequence is cleaner, and its Phase 0 baseline/contract-freeze idea should be retained.

The largest design conflict is UI placement:

- GPT56SOL proposes peer Skills/Equipment tabs in the main column.
- GPT54 proposes an equipment panel inserted between `SkillBar` and `SkillBrowser`.

The tab model is the better default. Equipment editing is too large to sit between skill controls without crowding the primary workflow. Tabs also make it easier to avoid horizontal overflow and keep skill-specific tooltip behavior isolated. GPT54’s “main column, no route, skill-first workflow” principle should still be preserved.

## Merge Recommendations

Use GPT56SOL as the base draft, then merge in the following from GPT54:

- Add a Phase 0 contract-freeze step before BW-1401.
- Keep the implementation sequencing language that stabilizes catalogs, reducer actions, validation input, and selectors before components.
- Preserve the concise scope exclusions from GPT54 near the top of the sprint.
- Keep GPT54’s simpler Files Summary style, but back it with GPT56SOL’s detailed DoD.

Trim or defer from GPT56SOL:

- Consider deferring authored requirement editing unless existing EPIC-13 data proves it is needed.
- Consider deferring rich `EquipmentFactDetails` if concise selected-value summaries and validation messages are enough for MVP.
- Keep conservative health/energy summaries, but make them optional behind completion of persistence and core editing.
- Avoid documenting run manifests and execution artifacts as product-sprint scope unless the execution workflow truly requires them.

Add missing alternative-design notes:

- Explain why peer tabs are chosen over an inline panel.
- Explain why schema v1 is retained instead of bumping to v2.
- Explain why a custom combobox is preferred over native controls or an existing dependency.
- Explain why semantic equipment is persisted now while raw equipment-template import/export remains deferred.
- Explain whether a feature flag or hidden UI gate protects against partially durable equipment during implementation.

The merged sprint should be stricter than GPT54, shorter than GPT56SOL, and centered on one release-critical path: catalog views, null-safe editor state, armor/weapon selection, validation display, durable persistence, and honest skill-template sharing.