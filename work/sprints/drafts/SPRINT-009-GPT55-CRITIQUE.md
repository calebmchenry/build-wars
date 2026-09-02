# Sprint 009 Combined Draft Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-009-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-009-GPT54-DRAFT.md`

Not reviewed:

- `work/sprints/drafts/SPRINT-009-GPT55-DRAFT.md`, per instruction.

Both requested reviewed drafts were present.

## Executive Summary

`SPRINT-009-GPT56SOL-DRAFT.md` is the stronger correctness draft. It is much more explicit about the hardest architectural risks: raw template identity, template/catalog ID separation, exact-source replay, export gating, static catalog performance, attribution ordering, remote icon privacy, and non-binary validation. Its main weakness is scope pressure: it reads like a full implementation specification plus closeout documentation plan, and it risks making SPRINT-009 too large to execute cleanly.

`SPRINT-009-GPT54-DRAFT.md` is the stronger execution-outline draft. It has a concise phase structure, clear scope table, and reasonable sequencing. Its weakness is that it under-specifies several correctness-critical policies. It names the right areas, but it often does not define the exact semantics needed to prevent lossy imports, accidental ID assumptions, performance regressions, or export-policy drift.

The merged sprint should use GPT56SOL's architectural decisions and edge-case specificity, but compress them into GPT54's clearer delivery shape. The final plan should also add an explicit "Alternatives Considered" section, because both drafts mostly present one preferred design and do not sufficiently compare feasible alternatives.

## Review: `SPRINT-009-GPT56SOL-DRAFT.md`

### Strengths

- Strongest treatment of the app/domain/template boundary. The draft clearly assigns ownership across `src/domain`, `src/template-compatibility`, `src/app/catalogs.ts`, `editor-state`, `editor-selectors`, `template-workflow`, components, and `App.tsx`.
- Correctly identifies raw template identity as a separate app-side overlay, not something inferred from equal numeric IDs. This is the most important architecture assumption in the sprint.
- Exact-source export is fingerprint-derived rather than dirty-flag-derived. This handles UI-only changes and edit-then-revert flows much better than a simple mutation flag.
- The export policy matrix is useful and should be retained. It distinguishes unchanged exact replay, canonical export, validation errors, projection failures, unresolved facts, and codec/fidelity failures.
- The catalog boundary is precise. It limits generated imports to two promoted JSON artifacts, adds bounded boot assertions, creates app-ready views, and explicitly bans remote icon URL propagation into display surfaces.
- It acknowledges the hidden performance cost of synchronously importing a roughly 15 MB skills catalog and 2,951 records. The bounded rendering decision is pragmatic and avoids inventing a new data pipeline inside EPIC-08.
- Tooltip policy is notably careful. It uses approved `renderSkillTooltipText` projection and separates structured progression values instead of reconstructing source-authored prose.
- Validation semantics are preserved as separate `valid`, `complete`, `resolved`, and `exhaustive` states, which prevents the UI from collapsing rule-engine output into a misleading binary.
- Accessibility and interaction coverage is materially stronger than GPT54, especially for keyboard placement, live announcements, modal behavior, tooltip access, and stale drag payloads.
- The Definition of Done is comprehensive and testable in many areas, especially catalog import scans, remote media restrictions, exact replay behavior, canonical export gates, raw overlay movement, and validation routing.

### Weaknesses

- Scope is very large for one sprint. The draft includes catalog adaptation, reducer/state model, selectors, profession/mode/attribute controls, a rich skill browser, three result views, pointer drag/drop, keyboard placement, tooltips, import/export dialogs, validation, responsive behavior, documentation, README updates, performance measurement, protected-path diff reviews, ticket closeout, ledger updates, and run-manifest coordination.
- The draft says no production domain or template-compatibility changes are planned, but also allows a sprint amendment if a missing public primitive is discovered. That is reasonable, but the plan does not define how to make that amendment without derailing the phase gates or invalidating the protected-path closeout check.
- `EditorState` is doing a lot: semantic build, budget, raw import overlay, browser filters, tooltip state, drag state, dialog state, transient messages, and exact-fidelity inputs. Without explicit sub-state boundaries and reducer tests, the "one deterministic reducer" can become a monolith.
- The static import performance plan is incomplete. Measuring production JS/CSS asset size is necessary but not sufficient; startup parse time, memory pressure, selector/index construction cost, and keystroke-time filtering cost are also relevant.
- The skill browser plan assumes synchronous filtering plus progressive rendering is enough. That may be true for 2,951 records, but the draft does not define a performance budget, debounce strategy, memoization strategy, or failure threshold that would trigger a follow-up.
- Loading/error handling for static imports is conceptually awkward. A synchronous generated JSON import does not naturally have a runtime loading phase unless the app injects a testable boundary state or wraps adaptation separately. The draft should clarify that loading is a view-state contract, not real async catalog loading.
- The closeout phase includes `compendium/core-build-editor.md`, `compendium/README.md`, root `README.md`, ticket files, sprint file, ledger, and a run manifest. That may be process-required during sprint execution, but it broadens the draft beyond the core editor and increases the chance of metadata churn.
- Some verification commands are too heavy for every phase. Running `npm run verify` after most phases may be defensible, but it can slow iteration and obscure phase-specific failures.
- The draft hardcodes a ticket-burn result manifest timestamp. That makes the sprint look tied to one run instance rather than a reusable execution plan.
- The "no new dependencies" posture is implicit in places but not always analyzed. Building modal behavior, drag/drop, keyboard placement, tooltip behavior, and large-list rendering without dependencies is feasible, but the cost should be explicitly acknowledged.

### Gaps In Risk Analysis

- The risk table is strong, but it still underplays implementation-size risk. The sprint could fail because too many complex UI workflows are packed into one delivery, even if each individual risk is well understood.
- It does not call out the risk of testing drag/drop, live regions, focus restoration, tooltip overflow, and responsive layout primarily in JSDOM. Some of those need manual walkthroughs or browser-level tests.
- It mentions the large static catalog but does not separately track bundle size, JSON parse/evaluation time, index-construction time, and per-filter latency.
- It does not fully address selector invalidation and memoization. A single app state update could cause expensive result recomputation or broad React re-rendering.
- It does not directly identify the risk of fixture drift when tests use small fixtures that do not represent promoted catalog edge cases.
- It does not call out the risk that current domain validation APIs may not expose issue locations or states in the exact shape the UI needs.
- It does not discuss whether the app should expose unresolved imported IDs in canonical export when validation is non-exhaustive but encode proof succeeds. The policy says this can be non-blocking, but the user-facing trust model needs careful wording.
- It does not explicitly define a fallback if attribution data is incomplete but catalog content is otherwise usable. It says fail closed in Phase 1, but the product tradeoff should be confirmed.

### Missing Edge Cases

- Duplicate primary/secondary profession selection and how it affects accessible attribute rows, validation, browser defaults, and export.
- Attribute duplicates, rank zero rows, ordering preservation, invalid rank bounds, and imported attributes whose profession is later removed.
- Skill duplicates, elite-count conflicts, wrong-profession skills, PvE/PvP-only conflicts, and whether those remain editable but invalid.
- Search normalization for whitespace, punctuation, case, diacritics, duplicate names, and catalog records with missing normalized names.
- Resource filters where a skill has multiple costs, zero cost, special cost, malformed fact state, absent fact state, or mode-specific fact differences.
- Exact replay when a wrapper name is edited, cleared, or restored. The draft says wrapper-name changes do not affect the skill-template field fingerprint, but should specify whether the exported result is always the original bare code, original wrapper, or separately selected output form.
- Canonical export for an imported unresolved ID that is still representable through the raw overlay but fails catalog resolution. The draft should define the UI wording for "exportable but unresolved".
- Handling of template field limits at the app boundary, including maximum input length, maximum name length, wrapper syntax containing semicolons/brackets, and non-ASCII names.
- Focus behavior after replace confirmation, clearing a selected slot, failed placement, stale drag no-op, modal close after export, and tooltip pin/unpin.
- Catalog boot assertion failures for partial version data, unexpected profile IDs, missing arrays, duplicate IDs, or missing template crosswalk fields.

### Definition Of Done Completeness

The GPT56SOL Definition of Done is very complete, but it needs prioritization. It covers architecture, data policy, state, browser behavior, skill bar behavior, tooltips, templates, validation, accessibility, responsive behavior, performance measurement, docs, closeout records, and protected-path review.

The main DoD issue is not missing coverage; it is executability. The final sprint should distinguish hard DoD gates from process/documentation closeout tasks and from optional polish. Otherwise, the sprint may be blocked by documentation, layout polish, or run-manifest bookkeeping even if the core editor behavior is correct.

The DoD also contains a tension: it says no domain, compatibility, generated, data, prior-art, dependency, or build-configuration file changed, while earlier architecture text allows a sprint amendment for a missing framework-neutral primitive. The final plan should state whether such a primitive change is prohibited, deferred, or allowed only through an explicit ticket amendment.

## Review: `SPRINT-009-GPT54-DRAFT.md`

### Strengths

- The draft is concise and easier to execute. Its overview and phase topology communicate the intended delivery order without drowning the executor in policy detail.
- The scope table is useful. It clearly keeps storage, share URLs, equipment, party state, source media fetching, and later-epic scope out of SPRINT-009.
- The phase order is sensible: catalog boundary, editor state, character controls, browser, skill bar, tooltips, template dialogs, validation/closeout.
- It correctly frames `src/domain` and `src/template-compatibility` as existing pure boundaries and positions `src/app` as the adapter/UI layer.
- It includes a dedicated `editor-fixtures.ts`, which is useful for keeping integration tests readable.
- It identifies unresolved raw template IDs as separate from the authored `Build` and says replacement/clearing should explicitly remove overlay entries.
- It includes a broad enough DoD to cover workflows, tooltips, templates, validation, accessibility, and closeout.
- The risks are practical and readable, especially around generated imports, unresolved imports, duplicated view logic, drag/drop accessibility, validation semantics, prior-art misuse, remote icons, and scope creep into persistence/sharing.
- It has a good "No open question blocks execution" section with sensible defaults.

### Weaknesses

- The raw template identity model is underspecified. It says unresolved raw IDs live in a separate overlay, but does not define how unresolved IDs are projected into `Build` for validation, how known IDs map through crosswalks, or how numeric template/catalog ID equality is avoided.
- Exact-source replay is described as fingerprint-based, but the draft does not specify how the current document is reconstructed, what fields participate in the fingerprint, or how edit-then-revert restores exact eligibility.
- Canonical export policy is too loose in places. It says canonical export disables for validation errors or lossy encode proof failure, but does not clearly include app projection failures, missing template representation, missing crosswalks, or codec typed failures as separate blocking states.
- It lacks a dedicated `template-workflow.ts` module. Without that, import/export policy may leak into dialogs, selectors, or reducer code.
- It does not address the 15 MB static catalog and 2,951-record browser performance problem. There is no bounded rendering, asset measurement, startup-cost check, or selector latency plan.
- The skill browser filter semantics are not precise enough. It names filters but does not define value-state behavior for zero, special, absent, malformed, not-applicable, or mode-specific facts.
- It does not strongly prohibit template/catalog ID inference by numeric equality. This is a critical omission because current IDs may often appear aligned and invite accidental shortcuts.
- Tooltip behavior is less precise. It mentions `renderSkillTooltipText` and max-title-rank assumptions, but does not distinguish current structured-only catalog descriptions from future token/prose expectations as clearly as GPT56SOL.
- Phase verification is thinner. Most phases run focused tests and typecheck, but build and full verification are deferred until late. That can hide bundling and generated JSON import problems.
- App loading/error states are requested, but the static import model is not reconciled with how those states are produced or tested.
- The file summary and closeout tasks include ticket, epic, sprint, ledger, and manifest updates. That may be appropriate for execution, but it increases the chance that the implementation sprint becomes a process sprint.

### Gaps In Risk Analysis

- It misses or underweights the most important hidden risk: accidental assumption that catalog IDs and template IDs share a namespace.
- It does not treat exact-source replay drift as a first-class risk with enough detail. A generic "semantic fingerprint" note is not enough without examples and tests.
- It omits static catalog size and startup performance risk.
- It does not identify the risk of mounting too many rows, tiles, tooltips, or action controls in the skill browser.
- It does not address stale or foreign drag payloads corrupting state.
- It underplays modal, tooltip, and responsive complexity without a UI dependency.
- It does not call out the risk that raw unresolved IDs can be preserved for exact replay but still fail canonical projection.
- It does not discuss the risk that validation `valid`, `complete`, `resolved`, and `exhaustive` combinations may conflict with export labels or button disabled states.
- It does not include enough source-policy risk around attribution order. It says attribution must be visible before facts, but the risk table does not specifically require DOM-order assertions or fail-closed behavior.
- It does not discuss fixture drift against promoted generated catalogs.

### Missing Edge Cases

- UI-only changes, wrapper name changes, semantic edits, full reverts, slot swaps, and targeted overlay clears for exact-source eligibility.
- Null, empty, and named wrapper preservation, including whether export returns the original wrapper or bare code.
- Imported reserved, unsupported, dispositioned, and unknown outcomes as distinct states rather than one generic unresolved bucket.
- Profession `none`, skill slot `empty`, and documented zero sentinels for template projection.
- App-created values that have no template crosswalk or representation.
- Attribute order canonicalization versus imported order preservation.
- Duplicate profession, primary-only secondary attribute, duplicate attribute rows, and retained inaccessible rows after profession changes.
- Skill browser value-state matching for zero, number, percentage, special, absent, not-applicable, malformed, and unknown mode variants.
- Stale drag operation tokens, invalid indices, foreign `DataTransfer` payloads, drop outside a target, and cancelling keyboard placement.
- Long code and long name wrapping inside bounded dialogs, clipboard denial, and no automatic clipboard reads.
- Catalog boot failures, missing version fields, missing top-level arrays, duplicate IDs, and absent template crosswalks.

### Definition Of Done Completeness

The GPT54 DoD is directionally complete but less rigorous than GPT56SOL. It covers the main user workflows and closeout requirements, but several items are too high-level to prevent architectural shortcuts.

Specific gaps:

- It should explicitly require that known template mapping uses explicit `templateId` or crosswalk data, never numeric equality.
- It should require exact-source replay tests for UI-only changes, edit/revert, wrapper-name handling, unresolved overlays, and slot movement.
- It should include canonical projection failure as a blocking export condition.
- It should require bounded result rendering and production asset-size measurement.
- It should require source-scan tests for generated imports and forbidden data/tooling imports, not just final scans.
- It should require remote icon URL absence in rendered markup or component props.
- It should define measurable acceptance for narrow-screen/dialog/tooltip overflow, either through browser-level checks or a documented manual walkthrough.
- It should include a protected-path rule if domain/template/generated data are intended to remain unchanged.

## Comparison

GPT56SOL is better as an architecture and correctness reference. It anticipates more of the hidden complexity in template import/export, raw-ID preservation, catalog policy, performance, validation semantics, and accessibility.

GPT54 is better as a sprint skeleton. It is more readable, less repetitive, and easier to convert into executable tickets. It avoids some of GPT56SOL's over-specification, but in doing so it leaves dangerous gaps.

The key difference is specificity versus manageability:

- GPT56SOL makes fewer unsafe assumptions, but its scope could overwhelm a single sprint.
- GPT54 is easier to execute, but it leaves too much room for lossy or shortcut implementations.

For merge purposes, prefer GPT56SOL wherever the issue affects data fidelity, validation correctness, source policy, privacy, or export behavior. Prefer GPT54 where the issue is communication structure, phase sequencing, or reducing repeated wording.

## Missing Alternative Designs Across Both Drafts

Both drafts mostly describe one chosen architecture. The final sprint should explicitly document alternatives considered and why they were rejected or deferred.

Recommended alternatives to capture:

- App adapter over existing domain contracts versus expanding `Build` to model unresolved raw template identity directly. The chosen approach should remain app overlay for EPIC-08, with EPIC-09 owning any persistence migration.
- One large reducer versus separate reducers/slices for build, import provenance, browser, dialogs, and interaction state. If one reducer is chosen, require sub-state boundaries and pure helper tests.
- Boundary-first implementation versus a vertical playable slice. Boundary-first is reasonable because source policy and template fidelity are high-risk, but the plan should acknowledge that it delays visible user value.
- Static synchronous catalog import versus dynamic import, compact derived runtime artifact, web worker indexing, or virtualization. Static import may be mandated now, but performance alternatives should be named as deferred options with measurement thresholds.
- Progressive "Show more" rendering versus true virtualization. For 2,951 records, bounded rendering may be enough; if tests show it is not, virtualization should be the named follow-up rather than an improvised scope addition.
- Native HTML drag/drop plus keyboard model versus a drag/drop library. No new dependency may be the right constraint, but the plan should state the cost and require stronger tests/manual checks.
- In-house modal/tooltip behavior versus a small accessibility library. If dependencies are prohibited, acceptance criteria must compensate with focus, Escape, overflow, and screen-reader behavior checks.
- Exact substring search versus fuzzy search or indexed search. Exact substring is the right MVP, but fuzzy/ranked search should be explicitly deferred.
- Full closeout documentation inside SPRINT-009 versus a smaller implementation sprint plus separate docs/process pass. If docs remain in scope, classify them as closeout tasks rather than core editor behavior.

## Merge Recommendations

1. Use GPT54's concise phase topology as the final document structure.

Keep the eight-phase order, but avoid repeating full policy detail in every phase. Put the critical policy once in architecture and make phase tasks reference it.

2. Adopt GPT56SOL's raw identity and export model.

The final sprint should explicitly require:

- location-aligned raw template overlay;
- no template/catalog ID mapping by numeric equality;
- explicit `templateId` or crosswalk mapping for known records;
- unresolved raw IDs preserved until targeted replace/clear;
- slot operations move/swap raw overlays atomically;
- exact-source eligibility from reconstructed document fingerprints;
- canonical export blocked by validation errors, projection failures, and typed codec/fidelity failures.

3. Add `src/app/template-workflow.ts`.

GPT56SOL's dedicated workflow module is the safer design. It keeps codec calls, app projection, exact replay, and export gating out of dialogs and leaf components.

4. Add a compact performance contract.

The final plan should retain static catalog import if that is an EPIC-08 constraint, but add:

- production asset-size measurement;
- index-construction timing if feasible;
- bounded initial result rendering;
- no eager tooltip mounting for every result;
- a follow-up threshold for compact artifacts, dynamic import, worker indexing, or virtualization.

5. Make browser filter semantics explicit.

Use GPT56SOL's resource-kind value-state rules and deterministic sorting. GPT54's filter list is not enough to prevent inconsistent behavior.

6. Keep GPT56SOL's source/media policy.

The merged plan should require attribution before catalog facts in DOM and visual order, safe explicit source links, placeholder icons, and tests or scans proving remote icon URLs are not wired into browser-fetching surfaces.

7. Reduce closeout scope.

The final sprint should separate:

- core editor implementation gates;
- verification gates;
- process closeout records;
- documentation updates.

If README, compendium, ledger, ticket, and run-manifest updates are required, keep them as closeout tasks and avoid making them indistinguishable from product behavior.

8. Resolve protected-path ambiguity.

Decide whether `src/domain` and `src/template-compatibility` are truly read-only for SPRINT-009. If they are protected, remove language allowing incidental primitive additions. If minimal amendments are allowed, define an explicit amendment path and adjust the protected-path diff gate.

9. Strengthen UI verification language.

JSDOM tests are not enough for every acceptance criterion. The final plan should require either browser-level checks or documented manual walkthroughs for:

- pointer drag/drop;
- keyboard placement;
- modal focus trapping/restoration;
- tooltip overflow;
- narrow-screen layout;
- remote media non-fetch behavior.

10. Include a real "Alternatives Considered" section.

This would directly address the biggest planning gap in both drafts and make the final architecture easier to defend.

## Recommended Final Shape

The best combined sprint would be:

- GPT54's readable overview and phase sequence;
- GPT56SOL's architecture boundary table, raw identity model, export matrix, catalog policy, tooltip policy, and risk table;
- a reduced DoD that separates hard product gates from closeout/documentation gates;
- an explicit alternatives section;
- a small performance contract for the static catalog;
- a clear statement that no storage, equipment, title ownership, party, guide, network media, or new dependency work enters SPRINT-009.

This combination preserves correctness without turning the sprint into an unbounded implementation essay.
