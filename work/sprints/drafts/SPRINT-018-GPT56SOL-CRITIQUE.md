# Combined Critique: SPRINT-018 GPT-5.5 and GPT-5.4 Drafts

## Executive Assessment

Both drafts converge on the right architectural center: party semantics should be an optional overlay on neutral build sets; build-set entries should remain complete loadouts; empty party positions should be separate slots with nullable references; and the existing one-active-editor model should remain intact. They also correctly constrain validation to structural facts and keep external team codecs, hero catalogs, hosted sharing, and recommendation logic out of scope.

The drafts are not yet safe to merge into an execution plan. They disagree on four durable contracts:

1. whether a disabled party annotation is deleted or retained with an `enabled` flag;
2. whether party reordering also mutates neutral build-set entry order;
3. whether member kind and notes use slot-owned freeform fields or reuse entry metadata;
4. whether native party JSON gets a distinct envelope or reuses build-set transfer.

Those choices affect persistence, fingerprints, migration, import/export compatibility, reducer invariants, UI state, and future evolution. They must be resolved before implementation. The combined plan should also reduce its breadth or introduce a hard end-to-end durability gate before substantial UI work; both drafts currently describe a large cross-cutting release whose persistence paths do not all become proven until late in the sprint.

## Review of `SPRINT-018-GPT55-DRAFT.md`

### Strengths

- It states the most important domain boundary clearly and repeatedly: party slots reference complete build-set entries rather than creating a second nullable-loadout model. This is coherent with SPRINT-017 and minimizes duplication of loadout persistence.
- It gives party order and neutral entry order independent meanings. That separation preserves the promise that neutral build sets can represent variants or arbitrary collections without acquiring party-specific ordering semantics.
- Its runtime model recognizes empty-slot selection as distinct from selected-loadout state and explicitly calls for materializing the live editor before navigation, mutation, persistence, validation, summaries, or export.
- It has the stronger treatment of durability breadth. Working drafts, pagehide flush, stale revisions, write-blocked recovery, record duplication, restore ID remapping, backup/restore, build-set transfer, and explicit party transfer are all acknowledged.
- The proposed dedicated party state, selectors, validation, transfer, and UI modules create reasonable separation between domain contracts, app orchestration, and presentation.
- Its validation boundary is disciplined: structural issues and aggregation of existing loadout results are separated from subjective composition advice.
- Its security section is unusually complete for a local-first feature, including dangerous-key rejection, field-by-field reconstruction, dense-array checks, bounded work, inert JSON, filename handling, and no remote dereferencing.

### Weaknesses

- The draft claims to bind decisions but ends with open questions that reopen several of them. More seriously, it is internally inconsistent about member kinds: the main contract uses `player | hero | mercenary | guest | freeform`, while the final section uses `unspecified | player | hero | mercenary | guest | custom` plus a custom label. That is a wire-format contradiction, not naming polish.
- Disable behavior is not actually settled. Earlier text equates party mode with `party !== null` and says turning it off removes or hides the annotation; later text recommends deletion; tasks still mention confirmation if party-only metadata is removed. The persisted semantics and user recovery behavior remain ambiguous.
- The distinct `build-wars-party-transfer` envelope duplicates a format that must still coexist with party-aware build-set transfer. Without a single canonical snapshot parser and shared limits, this creates two import surfaces that can drift in accepted versions, diagnostics, ID handling, and compatibility.
- `required` appears on every slot, but its authority relative to `preset`, slot count, and optional empty slots is not defined. A preset could therefore claim eight members while some or all slots are marked optional, or a custom party could contain required slots outside its declared size.
- The contract allows slot notes in addition to entry notes without defining display precedence, search behavior, duplication behavior, export treatment, or what happens after unlinking and relinking. This may be useful, but it creates a second user-authored notes namespace whose product value is not justified.
- The plan allocates a dedicated runtime `PartyRuntimeState` but does not define the exact selection state machine. It is unclear how `selectedEntryId`, focused empty slot, comparison entry, selected unassigned entry, and persisted `lastSelectedEntryId` interact.
- “Repair stale linked entries with diagnostics” is underspecified. If repair turns a missing `entryId` into `null`, evidence needed for diagnostics and possible recovery is lost; if it preserves the invalid ID, the normalized runtime contract is no longer valid.
- The phase percentages convey precision without capacity evidence. The sprint spans contracts, reducers, schema parsing, every durability path, responsive UI, accessibility, validation, two transfer paths, clipboard behavior, documentation, and governance artifacts. This is a high integration load for one sprint.

### Gaps in Risk Analysis

- There is no explicit risk for divergent behavior between party transfer and build-set transfer, despite proposing both.
- There is no forward-compatibility policy for an unknown future `PartyAnnotation.schemaVersion`. Silently degrading it to neutral mode may cause an older client to overwrite or erase newer metadata on the next save.
- ID collision and atomic remapping risks are not fully addressed. Imported/restored build-set entry IDs and slot references must be remapped together, while slot IDs may also collide after duplication or merge.
- The plan does not address the performance cost of repeatedly materializing and validating up to 16 full loadouts during autosave, library projection, filtering, and render.
- There is no explicit data-loss risk around neutral-mode deletion or reordering of entries that remain referenced by a hidden or disabled annotation.
- Multi-code output includes user-authored labels and roles, but control characters and embedded newlines could corrupt the line-oriented format even if React rendering is safe.

### Missing Edge Cases

- Enabling party mode for build sets with 0, 5, 7, 9, or 16 entries: preset selection, custom sizing, and overflow behavior are not deterministic.
- Linking an already-assigned entry, linking an unassigned entry, duplicating at the 16-entry cap, and adding a slot when entries are already at the cap need explicit outcomes.
- Shrinking a preset when removed positions contain occupied slots, metadata-only empty slots, or the selected member needs a stable transactional rule and selection fallback.
- Removing an entry through neutral controls while a party slot references it needs either prevention or a single canonical cascade/unlink policy.
- Removing or unlinking the selected member, the last occupied member, or the comparison target needs defined selection and editor behavior.
- Duplicate/save-as-new/import/restore must specify whether slot IDs are regenerated, preserved within the cloned document, or remapped only on collision.
- Unknown annotation versions need quarantine/preservation behavior rather than only reject-or-drop behavior.
- String bounds need a measurement rule: UTF-16 units, Unicode scalar values, grapheme clusters, and UTF-8 bytes produce different results.
- Stable serialization is claimed while `exportedAt` changes every export; canonical content and envelope metadata need separate determinism rules.

### Definition of Done Completeness

The Definition of Done is broad and stronger than the GPT-5.4 draft on storage failure modes, pagehide behavior, restored ID remapping, catalog isolation, transfer security, and accessibility-oriented UI states. It is nevertheless not fully testable as written. Terms such as “supported widths,” “stable dimensions,” “clear,” “discoverable,” and “honest” need concrete assertions or named manual checks. It also lacks acceptance criteria for the internal contract contradictions above, unknown future schema versions, import ID remapping, removal-selection fallback, and the exact preset-shrink transaction. Passing `npm run verify` cannot substitute for those behavioral decisions.

## Review of `SPRINT-018-GPT54-DRAFT.md`

### Strengths

- It presents a cleaner execution narrative and makes the dependency chain easy to follow: contract and persistence first, then state/UI, validation, sharing, and closeout.
- Its `party.enabled` distinction gives a coherent meaning to “disabled but preserved,” supporting reversible opt-out without deleting authored party metadata.
- It avoids a second notes field and explicitly reuses entry notes for occupied members. This reduces metadata duplication and precedence questions.
- Reusing the existing build-set transfer envelope is the smaller compatibility surface. It avoids two nearly identical parsers and naturally lets neutral and party-enabled build sets remain one document family.
- It explicitly blocks or resolves destructive preset shrink before commit and recognizes that empty-slot selection must not fabricate an editor.
- Its phase gates are concise and outcome-oriented, and the DoD covers the main regression, accessibility, validation, persistence, and sharing promises.

### Weaknesses

- Synchronizing party slot reorder into build-set entry order couples an optional annotation to the neutral model. It means a party-only presentation action mutates how the same collection appears after party mode is disabled, changes fingerprints and transfer output, and complicates placement of unassigned entries. “Determinism” is not sufficient justification for changing neutral authored order.
- The persisted shape stores both `preset`, `slotCount`, and `slots.length`, creating three possible sources of truth. No normalization precedence is defined when they disagree.
- Validation includes `empty-required-slot`, but `PartySlot` has no `required` field and the draft never defines whether every preset slot is required, whether custom slots are required, or whether optional slots exist.
- `party: null` is described as either never used or explicitly cleared from malformed/legacy input, while `enabled: false` preserves valid metadata. Conflating “never configured” with “discarded because malformed” loses provenance and makes recovery diagnostics harder.
- The member-kind design uses `customKindLabel`, but does not define normalization when the kind is not `custom`, whether an empty custom label is legal, or how unknown future kinds are handled.
- It says all party-level issues are non-blocking for editing but also says malformed explicit party imports must block apply. The distinction between authoring validation and trust-boundary parse validation should be explicit.
- The architecture table assigns runtime party annotation state to `build-set-state.ts`; this risks making the neutral reducer party-aware throughout. A narrow party orchestration module, as proposed by GPT-5.5, is safer if dependencies remain one-way.
- Although it says persistence shape comes first, complete backup and transfer verification remains in Phase 4. UI could therefore be built on a model that has not yet survived every durability boundary.

### Gaps in Risk Analysis

- The largest architectural risk in this draft—mutating neutral entry order from party reorder—is presented as a mitigation rather than evaluated as coupling and surprising user-visible behavior.
- There is no risk entry for redundant persisted authorities (`enabled`, `preset`, `slotCount`, and `slots.length`) becoming inconsistent.
- Unknown future party schema versions and older-client overwrite behavior are omitted.
- Import, restore, and saved-record duplication do not have an explicit atomic ID-remapping strategy.
- The risk of losing a disabled annotation when neutral build-set operations modify or delete referenced entries is not covered.
- The draft does not consider selector/render performance for large parties or repeated validation/materialization.
- Clipboard format injection through labels or roles and deterministic handling of line breaks are absent.

### Missing Edge Cases

- The same non-preset entry counts, cap-boundary duplication, selected-member removal, last occupied member, comparison target, and linked-entry deletion cases identified for GPT-5.5 are missing here.
- The relative-order synchronization algorithm is unspecified when unassigned entries are interleaved with assigned entries. Multiple reasonable algorithms produce different neutral order and fingerprints.
- Toggling `enabled` while an empty slot is focused, while the selected entry is unassigned, or with dirty live edits needs exact behavior.
- Importing a valid party annotation with `enabled: false` through a party-labeled UI needs a defined preview and resulting workspace mode.
- Parsing inconsistent `slotCount`, preset, and actual slots needs reject, normalize, or diagnose rules for both ambient and explicit sources.
- Custom-kind labels, blank/whitespace member labels, Unicode length limits, and embedded clipboard newlines need normalization rules.
- There is no stated behavior for an existing build set larger than the chosen preset when party mode is first enabled.

### Definition of Done Completeness

The DoD is solid on the core model, regression protection, party UI, structural validation, malformed explicit import, ambient degradation, and selected-member-only sharing. It is less complete than GPT-5.5 around write-blocked storage, stale revisions, pagehide flush, restored ID remapping, copy-output bounds, and exact security invariants. It also fails to make its own `enabled`, `slotCount`, required-slot, and synchronized-order semantics testable. Layout and keyboard clauses need named viewport and focus expectations, and durability should include an end-to-end edit-switch-autosave-reload test rather than only subsystem round trips.

## Cross-Draft Contradictions

| Decision | GPT-5.5 | GPT-5.4 | Recommendation |
| --- | --- | --- | --- |
| Disabled state | `party !== null` generally means enabled; disabling tends toward deleting the annotation after confirmation. | `party.enabled` preserves the annotation while neutral mode is active. | Prefer an explicit `enabled` flag only if reversible hiding is a real product requirement. Otherwise delete the annotation and offer a clear destructive confirmation. Do not support both meanings. |
| Ordering | Party slot order is independent; party reorder does not mutate entry order. | Occupied-slot reorder also reorders build-set entries. | Keep orders independent. This maintains the annotation boundary and prevents party UI actions from silently rewriting neutral organization. Define unassigned-entry presentation separately. |
| Member kinds | Main contract uses `freeform`; the same draft later proposes `unspecified/custom`. | Uses `unspecified/custom` plus `customKindLabel`. | Choose one wire enum before coding. Prefer `unspecified | player | hero | mercenary | guest | custom` plus a bounded custom label; it distinguishes “not set” from authored freeform text. |
| Notes | Slot-owned notes plus entry notes. | Entry notes only. | Use entry notes for loadout notes in MVP. Add slot notes only if a concrete use case requires notes that survive unlinking and relinking; then specify precedence and lifecycle. |
| Preset representation | Discriminated preset includes its size; slots also carry `required`. | Stores preset, separate `slotCount`, and slots; no required field. | Use one source of truth: `{ kind: "preset", size: 4 | 6 | 8 } | { kind: "custom", size: number }`, and require `slots.length === size`. Omit per-slot `required` unless optional positions are explicitly in scope. |
| Transfer envelope | Adds `build-wars-party-transfer` while also extending build-set transfer. | Reuses `build-wars-build-set-transfer`. | Reuse the existing envelope for MVP and expose party-specific UI copy. A distinct envelope adds little value while the payload remains a build-set snapshot. |
| Module boundaries | Adds focused `party-state`, `party-validation`, and `party-transfer` modules. | Concentrates more behavior in existing build-set state/selectors/transfer. | Use focused party modules for orchestration and validation, but reuse the canonical build-set snapshot parser and transfer codec. Keep dependencies directed from party features to neutral build-set primitives. |

## Long-Range Architecture Risks

### Annotation Referential Integrity

The overlay design is sound only if all build-set entry mutations pass through referential-integrity helpers. Neutral entry delete, duplicate, reorder, import, record clone, and restore can otherwise leave party references stale. The final plan should define one atomic document operation layer that updates entries, party references, selected entry, comparison entry, and dirty fingerprints together. UI reducers should not independently patch these structures.

### Forward Compatibility and Safe Degradation

Both drafts favor degrading malformed ambient party metadata to a neutral build set. That protects loadout access but can destroy future-version party metadata when an older client later saves. Unknown schema versions should be preserved as opaque quarantined data or make the document read-only until explicitly stripped. Structurally malformed version-1 data can degrade with diagnostics, but future-version data is not equivalent to malformed data.

### Multiple Sources of Truth

Persisting `enabled`, preset size, `slotCount`, `slots.length`, per-slot `required`, build-set order, and party order creates avoidable invalid states. The merged design should minimize persisted authorities and derive display counts and validation facts. The canonical snapshot should have one size source and one party-order source.

### Duplicate Transfer Surfaces

A party-specific envelope plus a party-aware build-set envelope doubles compatibility obligations. If a separate UI is desirable, it can wrap the same codec and payload. Long term, envelope proliferation makes version negotiation, security limits, migration, preview, and documentation harder.

### Scope and Integration Risk

The feature touches nearly every state and persistence boundary while also introducing a dense interactive workspace. A safer execution shape is a vertical slice: contract, canonical parser, reducer operation, autosave/save/load, backup, and transfer round trip for a minimal party before broad UI and validation. If that cannot fit comfortably, defer either the dedicated party import UI or richer library/search presentation rather than weakening durability.

## Merge Recommendations

1. Freeze a short contract decision record before implementation. It must settle lifecycle, enum values, notes ownership, preset authority, ordering, transfer envelope, invalid-reference behavior, and unknown-version behavior.
2. Use the GPT-5.5 annotation-over-build-set model and focused party modules, combined with GPT-5.4's single existing transfer envelope and avoidance of duplicate slot notes.
3. Preserve party slot order independently from build-set entry order. Provide an explicit “sync order” command later only if users demonstrate a need; do not make it an implicit reorder side effect.
4. Choose one persisted lifecycle model. If retaining disabled metadata, define `party: null` as never configured/explicitly discarded and `party.enabled: false` as valid preserved metadata. Neutral entry operations must still maintain hidden references. If that maintenance cost is not justified, omit `enabled` and delete on confirmed disable.
5. Replace `slotCount` and per-slot `required` with a single preset/custom size invariant for MVP: `slots.length` must equal the declared size and every slot contributes to completeness. Optional slots can be introduced later with an explicit semantic need.
6. Centralize parsing, normalization, cloning, ID remapping, stable serialization, fingerprinting, and referential repair. Ambient load, backup preview, transfer preview, duplication, and restore should call the same primitives with source-specific policies rather than reimplementing validation.
7. Distinguish three outcomes at trust boundaries: valid; recoverable version-1 corruption with diagnostics; and unsupported future version requiring preservation/read-only handling. Do not silently map all failures to `party: null`.
8. Define a selection state machine covering selected linked entry, focused empty slot, selected unassigned entry, comparison target, and fallback after unlink/remove/shrink/disable. Persist only the minimum durable selection and test every transition with dirty live edits.
9. Move a complete durability vertical slice ahead of broad UI work. The phase gate should prove edit → switch → autosave → reload, save/duplicate, backup/restore with atomic ID remap, and transfer export/import before styling all party actions.
10. Add explicit cap behavior for build-set entry count, party slot count, nested JSON bytes, diagnostics, and clipboard bytes. Specify how lengths are measured and sanitize line breaks/control characters in multi-code labels.
11. Clarify validation layering: parser errors may block explicit import; authored party issues remain non-blocking; per-loadout errors remain owned by `validateBuild`; party summaries reference rather than duplicate member issues. Stable issue paths should use slot IDs, not array indexes alone.
12. Make the DoD behaviorally testable. Add named cases for unusual initial entry counts, preset shrink, cap-boundary duplication, neutral deletion of a referenced entry, selected-member removal, unknown schema versions, disabled annotation round trips, ID collisions, clipboard newline handling, and deterministic ordering with unassigned entries.

## Recommended Consolidated Acceptance Additions

- Enabling party mode has deterministic behavior for every existing entry count from 0 through the cap, including counts that do not match a preset.
- Every operation that changes entry identity or membership atomically preserves or diagnoses slot references, selected entry, comparison entry, and unassigned entries.
- Removing, unlinking, shrinking away, or deleting the selected member uses a documented deterministic selection fallback and never loses dirty editor state.
- Unknown future party schema versions are not silently erased by load-and-save through an older client.
- Duplicate, import, merge restore, and replace restore preserve intra-document references while preventing document, entry, and slot ID collisions.
- The canonical party snapshot has exactly one declared-size authority and exactly one ordering authority.
- Explicit import parsing is fail-closed and atomic; ambient recovery never partially applies a party annotation.
- Neutral build-set operations remain semantically neutral and do not reorder because of party-only UI actions.
- Multi-code text remains parse-independent, byte-bounded, and structurally stable when labels contain whitespace, Unicode, newlines, or control characters.
- A single end-to-end test proves dirty member editing, empty-slot navigation, autosave, reload, native transfer, and backup/restore without metadata or loadout loss.

## Bottom Line

GPT-5.5 is the stronger source for architecture boundaries, state isolation, durability breadth, security, and edge-oriented verification. GPT-5.4 is the stronger source for a smaller transfer surface, reversible annotation semantics, simpler notes ownership, and concise phase gates. The best merge keeps the shared annotation model, adopts focused party modules and independent party order, reuses the existing build-set transfer envelope, minimizes persisted sources of truth, and resolves lifecycle and recovery semantics before any UI contract is frozen.
