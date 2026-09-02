# Combined Critique: Sprint 009 Core Build Editor Drafts

## Overall Assessment

The two drafts converge on a sound direction: establish one catalog-import boundary, put editor behavior behind deterministic state and selectors, preserve unresolved template-space facts outside the catalog-space `Build`, and keep persistence and adjacent game systems out of scope. That coherence is a strong base.

Neither draft is fully execution-ready, however. Their central architectural choice creates two representations of one logical document—the resolved `Build` and an unresolved import overlay—without defining enough reconciliation invariants. Export eligibility, exact-source restoration after edit-and-revert, profession-change cascades, and validation of overlay-only facts are therefore left open at precisely the boundary where data loss is most likely. Both drafts also place validation presentation in the last phase even though canonical export in the preceding phase depends on validation policy.

The best merged plan should use GPT55's richer contract analysis and edge-state inventory, GPT54's more concrete file/test topology and verification cadence, and a short set of binding decisions added before UI implementation begins.

## Review of `SPRINT-009-GPT55-DRAFT.md`

### Strengths

- It identifies the hardest problem correctly: catalog IDs and raw template IDs are different namespaces, and unresolved template facts must not be coerced into branded catalog IDs merely to satisfy `Build`.
- Its layer boundaries are explicit. Catalog adaptation, editor mutation, domain validation, template compatibility, and React presentation have clear owners and prohibited dependencies.
- It treats exact-source replay and canonical export as different products with different guarantees, rather than presenting export as a single undifferentiated action.
- Its state inventory is broad enough to cover unresolved professions, attributes, skills, empty-slot sentinel values, dispositions, import diagnostics, and transient UI state.
- It consistently protects scope: persistence, sharing, equipment, party/hero state, title ownership, remote media, and source-ingestion concerns remain outside EPIC-08.
- Its phase gates and final Definition of Done cover the full editor workflow, accessibility, narrow layouts, source attribution, no-network media policy, validation semantics, and planning closeout.
- The open questions are useful because they expose real choices around attribution, semantic fingerprints, unresolved canonical export, drag/drop technology, resource filters, and title-rank assumptions.

### Weaknesses

- The proposed state model is descriptive rather than invariant-driven. It does not define which representation wins if `build`, `slotMetadata`, `attributeMetadata`, and `professionMetadata` disagree, how overlay entries are keyed through reorder operations, or how a field moves from unresolved to resolved and back.
- A single `revision` counter is suggested as an exact-source invalidation mechanism even though transient UI actions are in the same state. A global revision can make filter, focus, dialog, or drag changes accidentally affect export fidelity. Conversely, one-way invalidation fails the stated semantic rule when a user edits a value and later restores the original value.
- The catalog boundary risks becoming a large application service. Static imports, runtime validation, indexes, attribution, icon policy, validation projection, and reverse template crosswalks are all assigned to one module. The one-import rule is good, but those pure responsibilities should be separable behind that entry point.
- It says app-level import/export diagnostics are merged only at the presentation layer, while export gating also depends on missing mappings and unresolved namespace facts. Those diagnostics must be available to a policy selector, not exist only in React presentation.
- Phase 7 requires validation-aware canonical export, but rule-engine integration is formally deferred to Phase 8. The plan hints at validation selectors earlier, yet the phase dependency is not explicit enough to prevent a temporary or duplicated export policy.
- Running the full `npm run verify` in every phase is safe but potentially expensive and obscures the value of focused gates. The draft should distinguish per-phase tests/typecheck from broader checkpoint and final verification.
- The draft is very detailed about file ownership and UI states but less decisive about product semantics. Nine open questions remain, several of which affect the state schema and test fixtures and therefore should not be left to execution-time improvisation.

### Gaps in Risk Analysis

- **Dual-source drift:** The risk list mentions namespace leakage but not disagreement between the resolved document and overlay after reorder, profession changes, repeated imports, or edit-and-revert.
- **Long-range persistence risk:** EPIC-09 will eventually serialize editor state. An overlay whose invariants are informal will become a migration and backward-compatibility burden.
- **Validation blind spots:** Overlay-only unresolved fields may not appear in `BuildValidationInput`, allowing the domain result to look cleaner than the actual export document.
- **Performance:** Filtering/grouping a full catalog, recomputing validation, and rendering tooltip projections on every meaningful change have no memoization, indexing, or responsiveness acceptance criteria.
- **Static-loading semantics:** With statically imported local JSON, “loading” and recoverable runtime “error” states do not arise naturally. The draft does not say whether catalog adaptation is validated at startup, can throw, or is injected in tests.
- **Enforcement durability:** An `rg` scan catches literal imports but may miss transitive imports, aliases, dynamic imports, CSS URLs, or future network helpers.
- **Schedule concentration:** Eight substantial tickets combine state architecture, dense UI, accessibility, codec integration, and closeout, but the risk list does not address scope slicing if early boundary work reveals incompatible contracts.
- **Browser behavior:** Native HTML drag/drop, pointer events, touch behavior, clipboard APIs, and dialog focus have browser-specific failure modes that are not acknowledged.

### Missing Edge Cases

- Import into a non-empty editor: replace versus merge semantics, confirmation, and preservation of the existing build on parse/decode failure.
- Multiple sequential imports and a failed second import.
- A fresh authored build with no `templateSource` exporting canonically.
- Edit a template field and then restore its original value; exact-source eligibility should be derived from current semantics rather than permanently lost.
- Distinguishing changes to wrapper/template name, editor-only build name, mode, browser filters, focus, and dialog text when computing template semantics.
- Reordering an unresolved slot, swapping unresolved and resolved slots, dropping onto a filled slot, dropping outside the bar, and clearing during an active drag.
- Changing primary or secondary profession when authored or imported attributes and skills become inaccessible; the draft specifies preservation for imported attributes but not a uniform policy for all authored fields.
- Duplicate attributes, duplicate skills, multiple elites, incomplete bars, and mode-incompatible skills as end-to-end UI cases, even if validation owns the rule.
- Whitespace-only input, oversized input, malformed wrapper delimiters, Unicode/very long wrapper names, code copied with surrounding prose, clipboard denial, and unsupported clipboard environments.
- Tooltip dismissal, clipping/portal behavior, focus return, touch access, and rapid focus changes between list/grid/bar surfaces.
- Empty or malformed promoted catalogs, duplicate catalog IDs, missing reverse mappings, and mismatched catalog versions.

### Definition of Done Completeness

The Definition of Done is broad and mostly aligned with the proposed scope. It is especially strong on boundary enforcement, preservation of unresolved facts, exact-source versus canonical export, validation semantics, accessibility states, and final verification.

It is not yet sufficiently falsifiable in several areas. “Usable,” “stable,” and “explainable” lack concrete assertions. It does not require atomic import behavior, fresh-build canonical export, edit-and-revert fidelity, overlay-aware export diagnostics, explicit slot-operation semantics, focus restoration, or a no-network assertion that catches more than known wiki URL strings. It also omits the execution-result manifest that GPT54 lists, creating closeout ambiguity. Finally, completion should require a passing canonical gate; an external failure can make the sprint blocked with evidence, but should not allow it to be marked complete.

## Review of `SPRINT-009-GPT54-DRAFT.md`

### Strengths

- It is more compact and easier to execute. The percentage allocations, concrete filenames, focused test commands, and phase acceptance statements give each ticket a recognizable unit of delivery.
- Its sequencing principle—retire boundary and state risk before UI breadth—is strategically correct.
- The `Build` plus imported-template overlay model is clearly stated, including explicit removal of raw overlay entries when a user replaces or clears a corresponding field.
- It gives shared selectors and presentation helpers an important role, reducing drift across browser rows, grid tiles, skill-bar slots, and tooltips.
- It separates focused tests and typechecking during phases from final build and repository-wide verification, which is a more efficient default cadence.
- Its checklisted Definition of Done is easier to audit than a prose-only completion section and explicitly covers build, verification, source scans, and no-commit behavior.
- The risk table supplies likelihood, impact, and mitigation rather than merely naming concerns.

### Weaknesses

- “No open question blocks execution” overstates certainty. The defaults for canonical export, title rank, resource filtering, and domain/template fixes materially affect schema and acceptance tests and need explicit adoption, not silent execution-time interpretation.
- The state shape is even less precise than GPT55's about provenance and reconciliation. “Untouched raw template IDs” is not a defined state transition, especially after slot reorder, same-value replacement, or profession changes.
- The validation/export wording is too permissive and internally risky: unresolved imports may permit canonical export if reconstruction and proof succeed, but overlay-only unresolved facts may never produce domain validation errors because `validateBuild` sees only `build`.
- It places validation integration in Phase 8 while Phase 7 already needs “the validation policy.” This creates a backward dependency and invites export gating to be implemented twice.
- Concrete filenames improve actionability but may prematurely freeze module boundaries before the state contract is proven. In particular, `catalogs.ts` still carries several unrelated roles.
- The source scans are useful but brittle as the sole architectural enforcement mechanism.
- The closeout artifact set is inconsistent: the files summary lists both planning and execution result manifests, while the phase files and other completion language do not consistently name both.
- The metadata says `status: planned` even though the artifact is a draft under review, unlike GPT55's `status: draft`.

### Gaps in Risk Analysis

- It does not elevate the overlay/`Build` dual-source model itself to a high-impact architectural risk.
- It omits future serialization and migration pressure from the in-memory state design.
- It does not cover stale closure/race behavior around rapid imports, clipboard promises, dialog close, or import errors preserving the prior document.
- It has no performance risk for catalog search/grouping, validation recomputation, or dense list/grid rendering.
- It does not address the artificial nature of loading/error states for synchronous static catalogs or how those branches will be exercised honestly.
- It omits browser compatibility and touch/narrow-screen implications of the drag/drop choice.
- It does not discuss whether the sprint is too broad to close safely if the existing domain or template APIs prove insufficient.
- It does not cover policy drift between global validation, app-level diagnostics, disabled export controls, and the codec's proof result.

### Missing Edge Cases

- Atomic replacement behavior when importing over an existing build, including cancellation and failure.
- Exact-source behavior after editing back to the original semantics.
- Canonical export from a newly authored build and from an incomplete-but-encodable build.
- Name semantics: wrapper name versus editor build name, empty names, Unicode, and whether name-only edits affect exact-source output.
- Repeated imports, same-code imports, and unresolved fields surviving unrelated edits.
- Stable overlay identity through skill-slot moves and swaps and through attribute-row reordering or deduplication.
- Profession changes that invalidate already-authored attributes or skills.
- Pointer cancellation, drop outside target, keyboard announcements, focus retention after reorder/clear, and touch access.
- Missing/duplicate catalog records, reverse-crosswalk collisions, and catalog adaptation failure.
- Clipboard unavailable/denied, long unbroken codes, malformed brackets, whitespace-only input, and input-size limits.

### Definition of Done Completeness

GPT54's Definition of Done is the more auditable of the two because it is grouped and checklisted. It covers all major surfaces and adds explicit build and source-scan gates.

The main defect is the clause allowing `npm run verify` to fail for an unrelated reason while still appearing inside the Definition of Done. Evidence of an unrelated failure is useful, but the sprint should remain blocked rather than complete. The DoD also needs contract tests for overlay reconciliation, exact-source edit-and-revert, atomic import, fresh canonical export, and a combined validation/export decision. Accessibility criteria should name focus return, accessible names, live feedback for keyboard reordering, and automated checks where practical. The manifest list must be reconciled before closeout.

## Cross-Draft Comparison and Contradictions

| Topic | GPT55 | GPT54 | Merge Decision |
| --- | --- | --- | --- |
| Artifact status | `draft` | `planned` | Keep the merged artifact `draft` until the unresolved policy decisions and acceptance tests are approved. |
| Architectural depth | Rich boundary, state, and unresolved-ID analysis | Leaner module and execution topology | Preserve GPT55's contract reasoning but use GPT54's concise phase structure. |
| Canonical export with unresolved data | Explicitly blocks missing mappings and allows raw IDs only if a complete document can be proven | Says unresolved IDs may still permit export if reconstruction/proof succeeds and otherwise emphasizes validation errors | Adopt one decision matrix. Recommended: after any semantic edit, block canonical export while unresolved overlay facts remain unless a combined-document validator—not `Build` validation alone—proves them safe and the UI explicitly labels the result. |
| Exact-source invalidation | Suggests revision or semantic fingerprint; also says eligibility lasts while semantics match | Uses an imported fingerprint but speaks of clearing eligibility on change | Derive eligibility from a canonical semantic projection so edit-and-revert can restore it; never use a global UI revision as the authority. |
| Validation sequencing | Validation presentation and final wiring in Phase 8 | Same | Move validation projection and export-policy tests into Phase 2; keep only presentation polish and end-to-end integration in Phase 8. |
| Verification cadence | Full `npm run verify` in every phase | Focused tests/typecheck per phase, build/verify at closeout | Use GPT54's focused cadence, plus full verification after the state/export contract checkpoint and at final closeout. |
| Closeout manifests | Names the planning result manifest | Also lists an execution result manifest | Confirm repository convention and name the exact required artifacts consistently in Phase 8, Files Summary, and DoD. Do not create or mark them complete early. |
| Failed final verification | Requires final verification to pass | Allows a documented unrelated blocker in the DoD | A documented external failure means blocked, not done. |
| Open decisions | Exposes nine meaningful questions | Declares defaults sufficient for execution | Resolve schema- and policy-affecting questions before Phase 2; defer only cosmetic choices. |
| File topology | Flexible filenames but a broad catalog module | Concrete filenames and shared presentation modules | Keep concrete ownership but split the import-only catalog source from pure indexes/projections behind one public facade. |

## Merge Recommendations

1. **Define a single semantic document contract before building controls.** Separate persistent document state from transient UI state. The document should contain the resolved `Build`, a field-addressed template overlay, and provenance. State invariants must specify one authoritative semantic value per profession, attribute, and slot; stable overlay identity through moves; and field-local clearing/replacement rules.

2. **Make fidelity derived, not latched.** Compute exact-source eligibility by comparing the current template-semantic projection with the imported document's fingerprint. Browser filters, focus, mode if it is not encoded, drag state, and dialog state must not affect it. Tests must cover change, unrelated UI change, change-back, reorder-back, and wrapper-name behavior.

3. **Adopt an explicit export decision table.** Cover at least: fresh authored and fully mapped; unchanged resolved import; unchanged unresolved import; edited fully mapped import; edited import with unresolved overlay; incomplete but encodable build; validation error; missing reverse mapping; and codec proof failure. Exact-source, canonical, and blocked outcomes plus user-visible reasons should be asserted from one policy selector.

4. **Integrate validation policy in Phase 2.** Build `BuildValidationInput`, app-level unresolved diagnostics, reverse-mapping diagnostics, and export eligibility together. Phase 8 should render and polish an already-tested policy rather than introduce it after the export dialog.

5. **Prevent the catalog boundary from becoming a long-lived monolith.** Use one import-only module for the two JSON artifacts, then pure internal modules for runtime validation/adaptation, indexes, attribution views, validation projections, and reverse crosswalks. Export them through one app facade and enforce the import rule with both tests/lint configuration and source scans where current tooling permits.

6. **Make import transactional.** A successful import should replace the current semantic document according to an explicit confirmation policy; cancel or parse/decode/resolve failure must leave the prior build untouched. Add tests for importing into a dirty editor, consecutive imports, and a failed second import.

7. **Specify profession and slot mutation semantics.** Decide whether newly inaccessible authored facts are preserved as invalid rows/placeholders or cleared, and apply the rule uniformly. Define move versus swap, behavior on a filled target, drop cancellation, unresolved-slot movement, keyboard focus, and live announcements.

8. **Resolve four decisions before kickoff:** canonical export with unresolved overlay facts, editable versus fixed level/quest assumptions, treatment of special/text resource values in filters, and the source of the title maximum rank. Timebox the drag/drop technology choice before Phase 5 and require no new dependency unless the native prototype fails named browser/accessibility checks.

9. **Tighten nonfunctional gates.** Add a no-network test that observes attempted requests rather than scanning only known domains; a catalog-adaptation failure fixture; deterministic ordering under duplicate/case/Unicode names; a responsiveness target for filter/validation updates; and concrete dialog/tooltip focus-return and overflow assertions.

10. **Use a strict closeout rule.** Run focused tests and typecheck per phase, full verification after the semantic-state/export-policy checkpoint and at the end, and `npm run build` at closeout. If the final canonical gate fails—even for an unrelated reason—record the evidence and leave the sprint blocked. Reconcile the planning and execution manifest requirements before marking tickets, epic, sprint, and ledger complete.

## Required Additions to the Merged Definition of Done

- The resolved `Build` and template overlay cannot express conflicting semantic values; reconciliation invariants are unit-tested.
- Exact-source eligibility is unaffected by UI-only changes and returns when the current encoded semantics return exactly to the imported semantics.
- Import is atomic and a failed or cancelled import preserves the existing editor document.
- Fresh authored builds can export canonically when mapped, valid under the chosen policy, and proven by encode/decode-back.
- Every row in the export decision table has a policy-selector test and a user-visible reason for disabled actions.
- Validation and app-level unresolved/mapping diagnostics are both considered by export policy without being collapsed into one misleading validity flag.
- Profession changes and every move/swap/replace/clear operation have specified preservation semantics for resolved, empty, and unresolved fields.
- Keyboard reorder operations preserve or deliberately move focus and announce their result; dialogs restore focus on close.
- Runtime catalog adaptation failure and zero-result catalogs render bounded states; tests prove the app makes no remote media requests.
- The exact required closeout manifests are named consistently, final `npm run build` and `npm run verify` pass, and status records are updated only after those gates succeed.
