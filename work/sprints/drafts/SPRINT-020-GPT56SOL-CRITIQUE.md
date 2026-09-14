# Combined Critique: SPRINT-020 Drafts

## Overall assessment

Use `SPRINT-020-GPT6ASTRA-DRAFT.md` as the primary synthesis source. It is materially stronger on persistence safety, scoped uncertainty, effect lifecycle, browser evidence, and the distinction between files that need changes and files that need regression coverage. Use `SPRINT-020-GPT55-DRAFT.md` for its simpler feature framing and its single nullable adjustment aggregate, but not as the execution plan without substantial hardening.

Both drafts correctly preserve the settled product boundary. The largest shared concerns are:

- The epic is very large for one sprint: a Build schema migration, recursive persistence audit, new projection architecture, asset ingestion, dense accessible UI, every template boundary, and real-browser file-system evidence. EPIC-19 explicitly allows a multi-sprint burn, while both drafts implicitly commit all eight tickets to one serial sprint. Keep all scope, but permit a clean ticket-boundary split rather than weakening acceptance if execution capacity is exceeded.
- Neither draft defines how a user removes an explicit rune/headgear override to resume inheritance. `None` is explicitly suppression, not inheritance. A small “Use equipped”/“Reset override” action is required whenever an override exists; otherwise one of the three persisted states is not reachable from the mounted UI.
- Neither draft fully enumerates the existing lossy-code surfaces. In addition to inline/file export and the two import-warning implementations, `ShareControls.tsx` presents standard template URLs/text and `party-sharing.ts` emits multi-code text with an explicit omitted-fields list. Both must report explicit attribute adjustments and prove that the payload remains base-only.
- Effect eligibility can drift from the rule engine if implemented as a second ad hoc legality system. The current `ValidationResult` discards its `BuildValidationContext`, while the useful per-slot resolution and ambiguity facts live in `validation-context.ts`. The merged plan must choose a reuse strategy rather than merely say “legal source skill.”
- The current catalog uses separate `id` and `templateId` fields, even though the six relevant values currently match. The accepted contract names template IDs. Effect fixtures and resolution must assert and match `templateId`, with collision-safe lookup from authored `SkillId`; they must not rely on the current numerical equality.

## Review: GPT-6 Astra draft

### Strengths

- The authored-state contract is precise. It distinguishes inheritance, explicit suppression, and explicit selection; requires canonical ordering; uses a properly discriminated Heroic Refrain shape; and requires v3 fields while migrating v1/v2 neutrally.
- The three rank contexts are explicit: base, equipment-adjusted, and preview-effective. It correctly keeps the cap out of generic rank arithmetic and permanent equipment validation.
- The treatment of unresolved equipment is the best part of either draft. It recognizes that the current equipment collector returns global unresolved reasons and that the current tooltip path converts unresolved progression ranks to zero and globally poisons inherent ranks. Its proposed attribute-scoped uncertainty and omission of unresolved tooltip rank keys directly address those defects.
- It identifies the hidden reducer dependency correctly. `reduceEquipmentEditorAction` currently has no catalog input, so clearing only the compact overrides addressed by old/new rune selections requires facts on the action or an app-owned command constructor. GPT-55 asks for the result without solving this dependency.
- It covers important lifecycle edges: duplicate effect sources, mode-resolved Masochism, remembered inactive preferences, clipped-effect counts, zero-base attributes, `Any`, same-primary no-op behavior, inactive loadouts, pagehide persistence, import cancellation, and standalone preview isolation.
- Its asset analysis matches the repository: 126 attribute-rune records map through 126 media IDs to 30 unique files, and those files are non-square. Rejecting reuse of the skill cache’s square-only filter is essential.
- The browser and game-folder evidence matrix is concrete and honors the epic’s rule that jsdom/CSS inspection is not acceptance evidence.

### Weaknesses and architecture concerns

- The plan is over-prescriptive in places that do not improve the shipped contract. A new contracts run document, broad live-source rechecking, cached metadata/byte replay, automatic upstream metadata refresh, and blanket updates to several general docs can become a second data-governance project. The accepted compendium and promoted catalogs already freeze the product facts.
- The proposed upstream-hash behavior is unsafe conceptually. If downloaded bytes differ from the hash in the promoted rune catalog, refreshing only the asset metadata would sever the provenance relationship to that immutable catalog. The downloader should fail closed; changing source facts belongs in an explicit catalog refresh, not this feature sprint.
- Extending `equipment-attribute-rank.ts` is justified only for diagnostic targeting. Compact precedence must remain in the new preview resolver. That collector is also used by permanent equipment rules and equipment selectors; teaching it compact override arithmetic would risk violating the draft’s own permanent-validation boundary.
- “Resolve once or cache” is directionally right but not yet an executable data-flow decision. `selectSkillDisplay` is currently invoked inside every visible catalog-row map, and `App.tsx` separately computes pinned-tooltip output. A projection silently recomputed inside that selector would repeat equipment and eight-slot effect work for every skill.
- The source-legality design still duplicates rule-engine concepts. Unique catalog identity assertions help, but profession, mode, split variant, and source-slot eligibility need to consume the same slot-resolution facts used by validation or a deliberately extracted shared primitive.
- The two-new-top-level-fields schema is workable, but it spreads one feature’s optional state across the Build root. A single nullable aggregate gives a clearer “feature is neutral” state and one presence helper for dirty/warning logic, while retaining Astra’s strong inner unions.
- Phase 1 and Phase 8 create or update several evidence/planning artifacts without addressing that `work/runs/` is ignored by the current `.gitignore`. If closeout records must link durable evidence, either the summary must live in a tracked location or an exact allowlist must be part of execution.

### Risk gaps and missing edge cases

- Reverse rune-option lookup is unspecified. The UI must resolve exactly one attribute-rune record for `(primary profession, attribute, +1/+2/+3)`, including its individual health penalty. Missing or duplicate matches must disable that option with a diagnostic rather than select the first catalog row.
- Reset-to-inherit is ambiguous. The draft explicitly makes Clear headgear write `None`, but never gives the user a way to delete that override. The same gap exists for rune overrides.
- The export audit omits `ShareControls.tsx` and `party-sharing.ts`. The latter has a concrete `omitted` array and lossy count that will be wrong unless updated.
- The new provenance manifest under `data/generated/epic-10/` will remain ignored unless `.gitignore` receives an exact exception. Neither the Phase 4 file list nor the DoD says so.
- Maximum-sized adjustment arrays across a 16-entry build set should be tested against the existing 240,000-byte build-set and party transfer limits. The chosen bound of 64 rune overrides is probably safe, but the plan assumes rather than proves it.
- Catalog ID zero is covered for UI truthiness, but it should also be covered in canonical sorting, persistence parsing, override reset, and rune reverse lookup. Fast Casting uses attribute ID `0` in the promoted catalogs.
- The draft should explicitly preserve the distinction between the selected compact rune’s own health penalty (informational) and the legacy semantic equipment’s total-health calculation, which remains out of scope.

### Definition of Done completeness

The DoD is close to complete and substantially stronger than GPT-55’s. It covers every epic headline, failure-to-prove browser gates, recovery behavior, capped/uncapped math, accessibility, transfer isolation, and real assets.

Add explicit completion checks for:

- removing an override restores inherited semantic equipment without snapshotting it;
- duplicate/missing rune tier lookup is safe and diagnosable;
- effect identity is asserted on `templateId`, not only record `id`;
- the projection is computed once per Build/catalog snapshot and shared by catalog, bar, focused rows, and pinned tooltip;
- `ShareControls` and party multi-code payload/copy are base-only and disclose explicit adjustments;
- the rune manifest is tracked through an exact `.gitignore` allowlist and works under a non-root Vite base path;
- the largest valid nested transfer remains below the existing transfer limit, or the limit has an intentional migration;
- durable browser evidence is actually tracked or linked to a tracked summary.

## Review: GPT-5.5 draft

### Strengths

- It is concise, readable, and keeps the user-facing outcome prominent.
- The single nullable `attributeAdjustments` aggregate is a good Build-root boundary. Its tagged gear overrides make `inherit` versus explicit `none` easier to understand than overloading nullable IDs.
- It preserves the essential base/template boundary and correctly separates preview capping from permanent validation.
- The ticket order follows the epic dependencies and the phase goals are easy to scan.
- It recognizes all major persistence paths, the two existing selector implementations, effect mode/profession gates, 126-to-30 rune asset deduplication, and the need for real-browser accessibility/layout checks.
- It avoids Astra’s most expansive source-verification and execution-record prescriptions.

### Weaknesses and architecture concerns

- The effect preference type is too permissive. Optional `intensity` is legal on every effect and can be absent on Heroic Refrain. Use a discriminated union so self effects cannot carry parameters and Refrain always carries `strength: 1 | 2 | 3 | 4` whenever explicitly stored.
- Schema migration is under-specified. It does not require `attributeAdjustments` on v3, reject illegal self-effect parameters or unsupported keys, define array bounds, reject duplicate attribute/effect rows, or canonically sort state before fingerprinting. Those omissions can create semantically equivalent but dirty-distinct snapshots.
- The proposed projection accepts “selected loadout,” which is an app/workspace concern. A domain preview should accept one `Build` and immutable catalog/eligibility inputs. Selection and inactive-loadout ownership belong in the app adapter.
- It proposes extending `collectEquipmentAttributeRankAdjustments` to understand compact precedence. Because that collector feeds permanent equipment rules, the safer design is a new preview resolver that wraps the unchanged semantic collector and overlays compact replacements.
- It lists many serializer, transfer, template, and display files as modifications even though several paths are generic once the two explicit Build cloners are fixed. This encourages scope creep and accidental changes to already-correct boundaries. Audit and regression-test first; edit only when the test shows a gap.
- The statement that game-template exports include “title ranks as currently supported” is misleading. Current `projectEditorToSkillTemplate` projects professions, base attributes, and skills; title-rank overrides are local-only and already receive omission copy.
- The asset phase is not safe enough. “Follow the skill-icon pattern” would inherit a square-image filter that rejects every rune icon and a non-strict SHA-1 mode that can accept changed bytes by size. It also omits origin/redirect validation, file signatures, containment, staged publication, Vite base-path handling, and the required `.gitignore` exception.
- It has no concrete strategy to prevent per-skill projection recomputation in the focused catalog and alternate browser.

### Risk gaps and missing edge cases

- Unresolved legacy equipment is treated as a generic diagnostic rather than attribute-scoped uncertainty. This leaves the current unresolved-to-zero tooltip behavior and global inherent-rank poisoning insufficiently addressed.
- Hidden armor invalidation is stated but not designed. The reducer has no catalog access, so it cannot derive the old/new rune target attributes from the current action shape.
- Duplicate copies of the same self skill, both Elemental Lord faction versions, ambiguous skill IDs, missing split members, raw unresolved slots, and transient unknown mode need explicit source-resolution tests. The draft covers only part of this set.
- Heroic Refrain’s full lifecycle is incomplete: disabling must retain strength, choosing strength while off must not enable it, re-enabling must reuse it, and reset must restore absent/off/+1 semantics.
- The UI says unavailable/retained rows are hidden while unknown or incompatible overrides must remain removable. It provides no global recovery affordance when the referenced attribute cannot produce a row.
- It lacks reset-to-inherit for valid compact gear choices and exact reverse lookup for rune tier options.
- It does not cover the current global `ShareControls` or party multi-code omission lists.
- The browser matrix does not explicitly require missing-image behavior, focus restoration after popover/reset, Escape dismissal, clipped active-effect counts, file-picker cancellation, overwrite cancel, denied permission, write/close failure, or fallback-download verification.
- It says evidence is recorded but does not require incomplete browser/asset work to keep BW-1908 and the epic open.
- It does not distinguish tests that prove a generic path already works from source files that must change, leading to unnecessary implementation breadth.

### Definition of Done completeness

The DoD covers the feature headlines but is not sufficiently executable for the riskiest seams. In particular, it lacks transactional nested-v3 rejection, canonical state/fingerprint behavior, scoped uncertainty, hidden action facts, inheritance reset, effect-source ambiguity, strength retention, clipped counts, every lossy sharing surface, strict asset-byte verification, evidence failure gates, and the detailed game-folder transaction cases required by the source epic.

It should not be used verbatim for execution. Its DoD can serve as the short summary above a stricter ticket-level checklist derived mostly from Astra.

## Direct comparison

| Area | Better draft | Merge direction |
| --- | --- | --- |
| Product framing | GPT-5.5 | Keep its concise overview and non-goals. |
| Persisted shape | Mixed | Keep GPT-5.5’s single nullable aggregate, but use Astra’s discriminated effect union, canonical ordering, bounds, and strict v3 rules. |
| Equipment precedence and uncertainty | GPT-6 Astra | Keep Astra’s per-contribution replacement and attribute-scoped unresolved model. |
| Projection ownership | GPT-6 Astra | Keep the domain/app split, but make one concrete app-level computation and do not pass workspace selection into the domain. |
| Effect legality | GPT-6 Astra | Keep its per-source and dedupe rules, then explicitly reuse validation-context slot facts and template IDs. |
| Hidden equipment edits | GPT-6 Astra | Use catalog-derived action facts; GPT-5.5 does not solve the reducer dependency. |
| Assets | GPT-6 Astra | Keep strict non-square handling and provenance, but remove automatic source-metadata refresh and unnecessary live rediscovery. |
| UI and accessibility | GPT-6 Astra | Keep its interaction details; add reset-to-inherit and reverse-lookup failure behavior. |
| Template/file boundaries | GPT-6 Astra | Keep its transactional matrix; add ShareControls and party multi-code. |
| Scope discipline | Mixed | Keep Astra’s regression-only classification and GPT-5.5’s concise docs list; allow an epic split at a ticket boundary. |
| DoD | GPT-6 Astra | Use Astra’s DoD plus the explicit additions above. |

## Concrete merge decisions

1. **Adopt one nullable Build field with strict inner contracts.** Use `attributeAdjustments: BuildAttributeAdjustments | null`. Within it, use tagged headgear/rune overrides and a discriminated effect union. `null` means no compact overrides and no explicit effect preferences. Require the field for Build v3; only v1/v2 may omit it. Normalize an empty aggregate to `null`, sort rune overrides by attribute ID and effects by registry order, and reject duplicates/unsupported keys transactionally.

2. **Keep semantic equipment collection independent.** `collectEquipmentAttributeRankAdjustments` continues to model `Build.equipment`. Extend only the diagnostic metadata necessary to identify contribution kind and known target. The new `attribute-preview.ts` applies compact replacement/suppression, temporary effects, scoped uncertainty, and the cap. Permanent validation never sees compact or temporary adjustments.

3. **Make one projection data flow explicit.** Compute the preview once at the app/composer boundary with memoization keyed by the immutable `Build` and catalog identities, then pass it to focused attributes, skill bar, focused catalog/alternate browser, and pinned tooltip. Selector tests should fail if a visible skill path falls back to independent equipment-only arithmetic.

4. **Reuse slot-resolution facts and match template identity.** Build the bounded effect resolver from collision-safe catalog indexes and mode-resolved slot facts already produced by `validation-context.ts`, or extract a small shared slot-resolution primitive. Match the accepted IDs through `CatalogSkillRecord.templateId`, assert expected profession and split-group membership, and never gate an eligible source on unrelated whole-build validity.

5. **Specify all equipment commands.** Provide set-selected, set-none, and reset-to-inherit actions for headgear and each rune attribute. For hidden semantic armor edits, attach old/new affected-attribute facts at the app action-construction boundary; clear only proven addressed compact overrides. Same-value commands and same-primary selection return the original state.

6. **Build rune controls from a strict reverse index.** Index attribute runes by profession, affected attribute, and rank amount. Each `+1/+2/+3` option must resolve exactly one record and its health effect. Missing or duplicate records disable the option with a diagnostic. Preserve incompatible/unknown authored IDs and provide a recovery action even when no eligible attribute row exists.

7. **Use a narrow, fail-closed rune asset generator.** Consume the promoted rune catalog’s existing `iconId -> remoteMedia` facts, deduplicate to 30 binaries, and avoid skill-style page-image discovery. Validate HTTPS origin/path and redirects, PNG signature/MIME, non-square dimensions, byte cap, and exact SHA-1 before staged publication. A hash mismatch fails and requires an explicit catalog refresh. Add an exact `.gitignore` allowlist for the new EPIC-10 manifest, a documented generation command, a non-root Vite base-path test, and missing-image fallback coverage.

8. **Centralize adjustment presence and omission copy.** Add one domain helper that treats explicit selected, explicit `None`, and explicit `off` as authored. Use it in both import-warning implementations, export dialogs/inline and file controls, `ShareControls.tsx`, and `party-sharing.ts`. Automatic effects alone do not warn. Regression tests must compare exact-source bytes and decoded canonical base fields before and after bonus-only edits.

9. **Treat generic persistence paths as regression-first.** The two explicit Build cloners and strict `validateBuild` definitely require edits. Backup, build-set transfer, party transfer, autosave, and pagehide should be changed only if non-default active/inactive fixtures expose loss. Include maximum valid nested payloads in the existing transfer-size tests.

10. **Keep closeout evidence durable and failure-aware.** Use Astra’s browser/file matrix. If `work/runs/SPRINT-020` remains ignored, place the signed-off result summary and links in a tracked sprint/ticket artifact or add a narrowly scoped evidence allowlist. Missing real assets or required browser/file scenarios leaves the corresponding ticket open.

11. **Preserve sprint scope without forcing one oversized delivery.** Retain BW-1901 through BW-1908 and their dependency order. If they do not fit, split only at a ticket boundary under the epic’s explicit multi-sprint allowance; do not replace browser, asset, migration, or file-system gates with weaker evidence to keep the `SPRINT-020` label.

The resulting merged plan should retain GPT-5.5’s concise overview, use GPT-6 Astra’s implementation and DoD as the backbone, and incorporate the eleven decisions above before execution.
