# Combined Critique

## Executive assessment

`SPRINT-015-GPT55-DRAFT.md` is the stronger execution specification: it is comprehensive, test-oriented, explicit about degradation and persistence, and has a substantially more complete Definition of Done. Its main weakness is breadth—several phases are oversized, `editor-selectors.ts` risks becoming a monolith, and important semantic choices remain disguised as defaults.

`SPRINT-015-GPT54-DRAFT.md` is more concise and architecturally cleaner. Its dedicated equipment-selector module, contract-freeze phase, meaningful-equipment predicate, and explicit dependency graph are good strategic choices. However, its risk analysis and Definition of Done are too coarse for the complexity of catalog failures, persistence compatibility, weapon topology, and share/export behavior.

The best merged plan should use GPT55 as the acceptance-criteria baseline and GPT54 as the structural baseline.

## GPT55 draft critique

### Strengths

- Establishes unusually clear scope boundaries. Domain reuse, generated-data isolation, deferred raw-template support, and the limit on stat aggregation are all consistently reinforced.
- Treats equipment catalog failure as independent from core catalog failure. Preserving the skill editor when equipment adaptation fails is an important resilience requirement.
- Defines null-versus-empty semantics precisely: untouched builds remain `null`, ordinary clearing retains an empty canonical loadout, and explicit reset returns to `null`.
- Strongly protects authored state. Profession, mode, weapon, and compatibility changes update filtering and validation without silently deleting selections.
- Covers unresolved and stale selections across editing, persistence, restoration, validation, and display.
- The persistence phase recognizes the full durability surface: autosave, saved records, duplication, hydration, fingerprints, backups, mixed valid/invalid restores, and freshness facts.
- Share/export behavior is carefully separated from equipment validity. Equipment-only errors do not incorrectly block skill-template operations.
- The risk and security sections are concrete and connected to planned tests.
- Phase percentages total 100%, providing at least a rough statement of expected effort distribution.

### Weaknesses and architectural concerns

- `src/app/editor-selectors.ts` is assigned filtering, issue grouping, summaries, rank adjustments, freshness inputs, validation input, and omission policy. This is likely to become a high-coupling “god module.” GPT54’s dedicated `equipment-selectors.ts` is the better long-range boundary.
- `src/app/catalogs.ts` exposes one equipment state that is either ready or failed. One malformed modifier catalog could therefore disable rune, insignia, and weapon selection together. That simplifies consistency but creates an unnecessarily large failure domain.
- Phase 1 and especially Phase 7 are oversized. Phase 7 combines schema validation, cloning, all storage workflows, backup/restore, freshness, validation presentation, import behavior, and two share surfaces. A late failure could destabilize the sprint after the UI is complete.
- The plan defaults to hiding incompatible options. Retaining an already-selected invalid option prevents data loss, but hiding all other incompatible choices weakens discoverability and explanation. Disabled options with compatibility reasons may be a better UX for some pickers.
- “Simple health/energy totals with clear combination rules” is not sufficiently architectural. Unless exact stacking and active-set rules already exist in domain helpers, selectors risk becoming a second rule engine.
- The plan adds several catalog-version fields directly to `PersistedCatalogFacts`. Repeating this pattern for future catalog families could steadily widen the persistence envelope and freshness UI.
- Fixed UI topology mirrors the domain’s five armor pieces and four weapon sets closely. That is appropriate now, but view models should preserve stable slot identities rather than encouraging components to depend on array positions.

### Gaps in risk analysis and missing edge cases

- Expanding schema version 1 to accept data that older clients reject is a forward-compatibility risk. An older app may discard or refuse a library written by the new app. The plan should require a compatibility audit before deciding not to bump the envelope version.
- Persistence validation is planned late. The parser, canonical serializer, clone behavior, and fingerprint contract should be proven early even if writes are enabled later.
- A clear action against `equipment: null` is ambiguous: does it initialize an empty loadout because it is an equipment mutation, or remain a no-op because nothing changed?
- Modifier-index behavior needs exact rules for append, replace, removal, compaction, and prevention of sparse arrays.
- When catalogs fail, users should still be able to clear or reset persisted semantic selections. “Controls disabled or degraded” does not guarantee recovery operations remain available.
- Omitting equipment catalogs from validation must produce an explicit “not fully validated” state; otherwise missing issues may be mistaken for a valid build.
- Skill-template import intentionally resets equipment to `null`, but the plan lacks a specific user-facing warning that importing will discard equipment.
- No acceptance criteria cover localStorage quota/write failures, interrupted writes, or concurrent-tab updates.
- Picker cases omit IME composition, outside-click/focus restoration, unique ARIA option IDs, screen-reader announcements, and mobile touch behavior.
- No measurable bundle-size, picker-search, or render-performance threshold accompanies four new static catalogs.
- Future active-weapon-set support is deferred, but summary data structures are not required to preserve the distinction between character-wide facts and set-local facts. Premature aggregation could make EPIC-21 harder.
- Attribution is planned in the catalog adapter but not explicitly required in the Definition of Done.

### Definition of Done completeness

The Definition of Done is strong and close to executable. It covers topology, picker behavior, unresolved values, persistence, catalog degradation, sharing, accessibility, documentation, and verification.

It should additionally require:

- A decision and compatibility test for schema-version evolution.
- False omission warnings for both `equipment: null` and a canonical empty loadout.
- Clear/reset availability during catalog failure.
- Explicit “validation unavailable” messaging when catalog-backed validation cannot run.
- Import-discard warning behavior.
- Exact modifier-array invariants and first-clear semantics.
- Mixed valid/invalid restore isolation.
- Attribution presentation.
- A basic bundle/search/render performance budget.

## GPT54 draft critique

### Strengths

- The architecture table is compact and easy to reason about.
- Preferring `src/app/equipment-selectors.ts` is a sound separation of concerns and will reduce churn in existing skill-editor selectors.
- Phase 0 is valuable. Freezing placement, lazy initialization, omission semantics, freshness fields, and stat boundaries before implementation reduces later rework.
- `selectHasMeaningfulEquipment()` is a better abstraction than checking non-null equipment. It explicitly prevents warnings for an authored but empty canonical loadout.
- The dependency graph correctly identifies that armor and weapon controls can proceed in parallel after the panel and picker contracts stabilize.
- The bundle/adaptation-cost risk is recognized, unlike in GPT55.
- The plan is easier to scan and avoids overprescribing every implementation detail.

### Weaknesses and architectural concerns

- Catalog failure is underdesigned. The panel has a catalog-error state, but the architecture does not clearly guarantee that equipment adaptation can fail without taking down core editing.
- Persistence is still deferred until Phase 7 despite being described as the highest compatibility-risk area. Baseline rejection tests are useful, but positive schema and round-trip contracts should be established earlier.
- The plan says the local schema should remain version 1 “unless implementation proves” otherwise. Versioning should be decided through a compatibility audit, not discovered incidentally during implementation.
- `src/app/catalogs.ts` still risks accumulating adaptation, validation, lookup, versioning, attribution, and placeholder responsibilities for every future catalog family.
- The shared picker may become overgeneralized across runes, insignias, attributes, weapons, and modifiers. The plan needs a narrow generic interaction contract plus equipment-specific wrapper view models.
- Phase 7 remains a broad integration ticket combining validation, persistence, restoration, freshness, and sharing.
- Component naming is internally inconsistent: the files summary names `ArmorControls.tsx` and `WeaponSetControls.tsx`, while other terminology describes armor and weapon-set editors.
- It refers to consistency across `TemplateControls` and `ShareControls`, while the listed implementation surface uses `TemplateDialogs.tsx`.

### Gaps in risk analysis and missing edge cases

The five-entry risk table is insufficient. It omits:

- Partial equipment-catalog failure and preservation of the skill editor.
- Silent destructive normalization after profession, mode, or weapon changes.
- Stale selection retention when filtering.
- Equipment rank adjustments corrupting attribute or tooltip assumptions.
- Equipment validation accidentally blocking skill-template sharing.
- All-or-nothing restore failure caused by one malformed record.
- Freshness fields becoming mandatory or noisy for older records.
- Runtime media metadata accidentally becoming a fetch path.
- Requirement notes implying an active weapon-set policy.
- Schema-v1 writes becoming unreadable to older clients.
- Recovery actions when catalogs are unavailable.
- localStorage write failures and fingerprint/canonicalization drift.

Missing behavioral cases include clear-versus-reset semantics, modifiers without weapons, duplicate modifier slots, off-hand-only sets, skill-template import clearing equipment, catalog-set mismatch, invalid action indexes, unresolved rank effects, and mixed valid/invalid restore batches.

### Definition of Done completeness

The Definition of Done is too high-level for safe execution. It does not explicitly require:

- Exactly five armor slots and four weapon sets.
- Two-handed conflicts, off-hand-only states, modifiers, fallback requirements, or catalog-set mismatch handling.
- Empty-loadout omission semantics.
- Explicit reset-to-null behavior.
- Equipment-aware attribute and skill-tooltip ranks.
- Partial catalog-failure isolation.
- Equipment freshness facts.
- Equipment-only validation errors not blocking exports.
- Preservation of the 1,800-character share URL cap.
- Skill-template import behavior.
- Dangerous-key, topology, array-bound, and string-bound rejection.
- Per-record restore isolation.
- The complete deferred-scope guardrails present in GPT55.

## Cross-draft contradictions and unresolved decisions

| Decision | GPT55 | GPT54 | Recommended resolution |
| --- | --- | --- | --- |
| Selector ownership | Concentrates equipment work in `editor-selectors.ts`. | Prefers `equipment-selectors.ts`. | Use a dedicated equipment module; let editor selectors compose only cross-feature outputs. |
| Omission predicate | Uses `hasSemanticEquipment`, potentially warning for an empty non-null loadout. | Uses meaningful equipment and explicitly excludes empty loadouts. | Define one `selectHasMeaningfulEquipment()` predicate: false for `null` and canonical empty; true for known selections, unresolved selections, modifiers, or authored fallback facts. |
| Validation display | Requires equipment issues globally and inline. | Recommends inline location issues, with global issues/counts in the main panel. | Keep every issue in the validation result, render location issues inline, and show global issues plus an equipment count/summary in the global panel. |
| Panel disclosure | Assumes an accessible disclosure with a visible summary. | Leaves expanded-versus-collapsed behavior open. | Freeze one behavior before implementation, preferably expanded on desktop and collapsible on narrow layouts while preserving DOM order and focus. |
| Requirement fallback UI | Exposes it when catalog requirements are unresolved. | Recommends keeping it hidden unless a demonstrated case requires it. | Keep reducer/schema support, but expose UI only for a verified user-visible unresolved requirement case. |
| Catalog degradation | Explicit independent equipment failure, but all equipment catalogs fail together. | Mentions catalog-error UI without a precise readiness model. | Require core/equipment isolation and decide whether readiness is per catalog family; at minimum, clear/reset must remain available. |
| Health/energy aggregation | Limits totals primarily to unconditional rune/insignia effects. | Open question may include weapon-modifier effects. | Do not total set-local weapon effects until active-set semantics exist; keep them as per-set notes. |
| Persistence version | Assumes canonical schema-v1 equipment. | Defaults to retaining schema version 1. | Audit old-reader/new-writer behavior and choose the version deliberately before writes are enabled. |
| File naming | Uses `ArmorEquipmentEditor` and `WeaponSetEditor`. | Uses `ArmorControls` and `WeaponSetControls`. | Select one naming convention and use it consistently in phases, summaries, tests, and tickets. |
| Draft status | Frontmatter says `draft`. | Frontmatter says `planned`. | Keep the merged artifact `draft` until these decisions are resolved and approved. |

## Merge recommendations

1. Use GPT54’s modular architecture and contract-freeze phase, but adopt GPT55’s detailed acceptance criteria, degradation policy, security constraints, and verification inventory.

2. Split catalog responsibilities internally:

   - `catalogs.ts` remains the only generated import boundary.
   - Equipment adaptation and readiness live in an app-owned equipment catalog module.
   - `equipment-selectors.ts` owns filtering, retained selections, summaries, issue grouping, and meaningful-equipment detection.
   - `editor-selectors.ts` only composes validation, rank context, and cross-feature workflows.

3. Move persistence contract work earlier. Establish parsing, canonical serialization, deep cloning, fingerprints, bounds, and version compatibility near Phase 1. Keep enabling autosave and restore writes in the later durability phase.

4. Split the current Phase 7 into at least two gates:

   - Persistence, cloning, storage, and backup/restore.
   - Validation presentation, freshness, import behavior, and share/export omission messaging.

5. Define catalog degradation precisely. Prefer per-family readiness where feasible; otherwise document why consistency requires an all-equipment failure state. In every failure state, preserve semantic IDs and allow clear/reset operations.

6. Freeze these semantic rules before UI work:

   - Clearing `null` is a no-op.
   - Clearing the last meaningful field leaves an empty canonical loadout.
   - Explicit reset returns to `null`.
   - Empty canonical equipment does not trigger omission warnings.
   - Weapon replacement does not silently delete modifiers.
   - Weapon-set-local effects are never aggregated as character-wide totals.
   - Importing a skill template clears equipment only after the existing dirty guard explicitly communicates that loss.

7. Strengthen the merged Definition of Done with schema compatibility, catalog-failure recovery, validation-unavailable messaging, exact modifier invariants, mixed-record restore isolation, attribution, and basic performance budgets.

8. Preserve GPT54’s opportunity to implement armor and weapon controls in parallel after the picker contract stabilizes, but require both to pass before summaries or durability integration.

Overall, GPT55 should supply the merged plan’s rigor; GPT54 should supply its module boundaries and sequencing discipline.