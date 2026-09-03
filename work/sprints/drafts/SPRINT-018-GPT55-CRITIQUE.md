# SPRINT-018 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-018-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-018-GPT54-DRAFT.md`

Both requested drafts were present.

## GPT56SOL Draft

### Strengths

- The core architecture is coherent: party semantics are an annotation over neutral build-set entries, empty slots are `entryId: null`, and the sprint avoids introducing a second loadout graph.
- It makes the domain/app persistence split explicit. Keeping domain `BuildSet` party-neutral while moving app-owned persisted build-set snapshots to version 2 is the cleanest versioning story in either draft.
- It handles the hardest editor invariant directly: enabled party mode can have zero active entries when an empty slot is selected. This avoids placeholder builds becoming accidental persisted members.
- It is strong on durability. Migration must be read-only, local-library schema/key stay unchanged, saved-record duplication re-keys the whole identity graph, and backup/restore/transfer paths reuse shared parse/materialize helpers.
- It clearly separates party order from neutral entry order. That preserves build-set variants/comparison semantics and prevents party reordering from mutating unrelated neutral workflows.
- It gives the right validation boundary: deterministic structural and aggregate checks only, no `validateBuild` changes, no `RULE_ENGINE_VERSION` bump, and no recommendation or hero-AI scope.
- The sharing split is defensible: native party JSON is lossless, multi-code text is explicitly lossy/convenience-only, and selected-member URLs remain unchanged.
- The Risk, Security, Dependencies, and Definition of Done sections are unusually complete and surface real failure modes instead of generic project risk.

### Weaknesses

- The draft is very large for one sprint. It spans domain contracts, nested migration, one-active-editor surgery, party UI, validation, native party transfer, multi-code sharing, backup/restore, library search, docs, ticket closeout, security hardening, and manual responsive QA. The architecture is sound, but the execution scope could easily exceed a single sprint.
- It binds many product decisions before proving they are necessary, including presets `2/4/6/8/12`, dormant annotations, slot notes, unassigned loadout workflows, distinct party transfer, multi-code copy with omission accounting, and library search over member metadata.
- The independent-order model is right architecturally, but it has hidden UX complexity. Users may expect party reorder to affect neutral order or vice versa. The draft calls this out as a risk but does not propose a concrete UI model for viewing or reconciling the two orders beyond labels and disclosures.
- `lastSelectedPartySlotId` is excluded from authored dirty state but included in durable working-draft fingerprints. That distinction is subtle and likely to produce test or autosave edge cases unless the implementation names the two fingerprint concepts very carefully.
- The draft treats malformed ambient party metadata as recoverable in some places and explicit party transfer as fail-closed. That distinction is correct, but the recovery policy needs exact outcomes: whether the app drops only `party`, write-blocks the affected record, preserves diagnostics, or blocks the whole library write.
- The UI phase assumes 16 rich slot cards with skills, equipment/title indicators, validation state, notes indicators, metadata actions, unassigned loadouts, transfer/share controls, and dialogs. That is a dense surface and may need a stricter MVP visual hierarchy.
- The plan creates several new modules (`party-state`, `party-validation`, `party-transfer`, `party-sharing`, multiple panels/dialogs). Some are justified, but the draft does not explain when logic belongs in existing build-set modules versus the new party modules.

### Gaps In Risk Analysis

- It should explicitly risk old-client behavior: an older deployment that can parse the outer library but not nested snapshot v2 could preserve, reject, or drop party metadata depending on parser shape.
- It should add a performance risk around repeated materialization of up to 16 members for validation, summaries, library search, and multi-code projection.
- It should risk cross-tab/local-storage conflicts where one tab has a party-enabled v2 draft and another tab writes an older neutral set.
- It should risk user confusion between `Disable Party Mode`, `Reset Party`, `Clear Member`, `Delete Loadout`, and removing a slot. These actions preserve or discard different data.
- It should call out test fixture maintenance cost. The proposed migration, backup, restore, transfer, and malformed-input matrix is large enough to become brittle.
- It should mention accessibility risk for slot-card action clusters: cards with select, move, duplicate, clear, metadata, assign, and validation navigation can easily become nested-control or focus-order problems.

### Missing Edge Cases

- Disabling party mode while an empty slot is selected and no neutral `selectedEntryId` is active.
- Reset Party while the selected member has unsaved editor changes.
- Assigning an unassigned entry to a slot after the active editor has unsaved changes that must be materialized first.
- Deleting an unassigned loadout while party mode is enabled.
- Duplicate Member when the source is active with unsaved changes, the next empty slot has non-default metadata, or fixed preset is full.
- Shrinking a custom party where removable trailing slots are empty but contain labels, roles, kind labels, or notes.
- Importing a party transfer whose snapshot has valid party slots plus extra unassigned entries over the visible preset size.
- Restoring a backup with one malformed party-enabled record and valid sibling records.
- Stale `lastSelectedPartySlotId` that points to an empty slot versus a removed slot.
- Comparison target pointing to a cleared, deleted, unassigned, or inactive member.
- Library search/indexing behavior for dormant annotations.
- Multi-code copy when user-authored labels contain CR/LF, `Code:`, `Status:`, very long words, or duplicated member labels.

### Definition Of Done Completeness

The DoD is strong and mostly measurable. It covers contracts, state/editing, persistence, workspace/accessibility, validation, sharing, verification, and closeout. The strongest items are the no-second-loadout-graph invariant, zero-active-entry behavior, no-write-on-read migration, identity re-keying, and explicit no-external-codec boundary.

The main issue is size. The DoD reads like an epic acceptance checklist rather than a sprint completion bar. It should be reduced to must-pass behavioral contracts, with deeper manual responsive matrices and documentation polish treated as execution evidence. It also needs sharper pass/fail language for old-client handling, ambient malformed party recovery, and performance limits for 16-slot projections.

## GPT54 Draft

### Strengths

- The draft is more compact and execution-oriented. It sequences contract/persistence work before UI, then validation, then sharing/docs, which is a practical implementation order.
- It preserves the important high-level boundary: party behavior is annotation-based, build-set entries remain complete loadouts, empty slots are not nullable builds, and selected-member sharing remains selected-member-only.
- It intentionally limits MVP presets to `4`, `6`, `8`, and `custom`, which reduces product and testing scope compared with the broader GPT56SOL preset set.
- It avoids adding a second member-notes field by reusing entry notes in summaries. That is a legitimate lower-scope alternative, even if it has tradeoffs.
- The architecture table is useful because it assigns ownership to domain, app state, persistence, selectors, and components.
- Its risk and security sections cover the major categories: order divergence, corrupt migration, phantom builds, destructive shrink, metadata conflation, validation scope creep, brittle multi-code output, and unsafe JSON.
- It correctly keeps external team-template support, hero catalogs, portraits, backends, and recommendations out of scope.

### Weaknesses

- The persisted schema story is ambiguous. The overview says party metadata is additive and older schema-2 build-set documents normalize to `party: null`, but the contract shape shows `PersistedBuildSetSnapshot schemaVersion: 1` with `party`. That blurs domain build-set version, nested persisted snapshot version, and outer local-library schema.
- It does not persist `lastSelectedPartySlotId`. `lastSelectedEntryId` cannot represent selecting an empty slot, so empty-slot resume, no-active-entry state, and stale slot repair are under-designed.
- It synchronizes party slot order with build-set entry order. That simplifies transfer determinism, but it violates the cleaner separation between party order and neutral build-set order and creates side effects for variants, comparison, neutral navigation, and unassigned entries.
- Reusing the existing `build-wars-build-set-transfer` envelope for party import/export weakens the format boundary. UI copy alone may not prevent users or future code from treating party transfer as ordinary neutral build-set transfer or silently dropping party metadata.
- Reusing build-set entry notes as member notes reduces scope, but it conflates neutral loadout notes with party-specific slot notes. Clearing a member, assigning a different entry, or retaining metadata on an empty slot becomes less expressive.
- The parser strategy is less precise than GPT56SOL. It mentions safe degradation for ambient malformed metadata and stricter explicit import, but lacks a clear versioned party envelope or nested snapshot migration contract to enforce that distinction.
- Implementation files and DoD include broad local-storage/backup/share behavior, but the plan defers much of the durability surface until the export/sharing phase. Party metadata preservation should be proven as soon as the persisted contract lands.

### Gaps In Risk Analysis

- The draft should treat schema ambiguity as a top risk. Optional `party` on an unchanged persisted snapshot version is a compatibility hazard.
- It underestimates the risk of order synchronization. Updating build-set entry order during party reorder can surprise neutral workflows and can collide with comparison targets, unassigned entries, saved-record duplication, and transfer diffs.
- It should risk empty-slot selection more directly. Without durable selected slot state, reducers and UI components may fall back to the first entry.
- It should risk transfer-envelope ambiguity. General build-set import, explicit party import, old clients, and user-labeled files need different outcomes.
- It should add identity-remap risk for slot IDs and references during saved-record duplication and backup restore.
- It should add UX/accessibility risk for dense slot actions, not only narrow-width density.
- It should risk validation wording becoming de facto build advice. The draft says not to add recommendations, but user-facing validation copy can still imply composition legality.

### Missing Edge Cases

- Re-enabling a dormant party when the previously selected slot was empty.
- Loading a party-enabled set where `lastSelectedEntryId` references an unassigned entry rather than an occupied slot.
- Party reorder with unassigned entries interleaved in the neutral entry array.
- Clearing a member when notes are stored only on the entry, then assigning a different entry into the same slot.
- Shrinking a party with empty but non-default metadata-bearing slots.
- Copy Into Set behavior when multiple empty slots exist and no slot is selected.
- Deleting or duplicating a neutral entry that is referenced by a dormant party annotation.
- Build-set transfer import where `party` is present but disabled.
- Explicit party import of a neutral build-set envelope.
- Backup restore merge where incoming party slot IDs collide with existing local slot IDs.
- Share/template actions while an empty slot is selected and no active entry exists.
- Multi-code output for overlong text, duplicate labels, CR/LF injection, clipboard denial, and partial availability.

### Definition Of Done Completeness

The DoD covers the expected areas, but it is less complete and less internally consistent than GPT56SOL's. It captures the MVP shape, neutral compatibility, empty slots, reducer actions, validation, sharing, and verification. However, it is missing or underspecifies several critical acceptance points:

- exact persisted build-set snapshot versioning;
- durable selected-party-slot state;
- no dirty/write on read-only migration;
- independent versus synchronized party and neutral order;
- dormant annotation behavior across transfer, backup, restore, and duplication;
- full identity re-keying of slot IDs and slot-to-entry references;
- parser outcomes for ambient malformed party metadata versus explicit party import;
- old-client handling for party-bearing JSON;
- accessibility acceptance for dense action clusters;
- performance expectations for max-size party summaries and sharing projections.

## Cross-Draft Comparison

GPT56SOL is the stronger architecture draft. It resolves the critical data-model decisions, especially nested persisted snapshot v2, independent party order, distinct native party transfer, durable selected slot state, and zero-active-entry behavior. Those decisions reduce long-term ambiguity even though they increase the implementation surface.

GPT54 is the better scope-control draft. It has a clearer implementation sequence, fewer product affordances, fewer presets, no slot notes, and a simpler transfer story. Those choices lower short-term cost, but several of them create future migration or UX debt if adopted without explicit tradeoff acceptance.

The largest direct conflicts are:

- **Persisted schema versioning:** GPT56SOL advances an app-owned persisted build-set snapshot to v2. GPT54 appears to add `party` to snapshot v1 while also referencing schema-2 documents. Use GPT56SOL's versioning model.
- **Party order:** GPT56SOL keeps party slot order independent from neutral entry order. GPT54 synchronizes occupied slot reorder back into entry order. Use GPT56SOL's independence unless the product explicitly wants party mode to rewrite neutral loadout order.
- **Presets:** GPT56SOL uses `2/4/6/8/12/custom`; GPT54 uses `4/6/8/custom`. Pick one based on product need. If the sprint needs scope discipline, `4/6/8/custom` is enough for MVP; if common party sizes require 2 and 12, adopt GPT56SOL and test them explicitly.
- **Slot notes:** GPT56SOL stores slot notes; GPT54 reuses entry notes. Slot notes are more consistent with preserving metadata on empty slots, but they increase UI, search, migration, and conflict scope.
- **Transfer format:** GPT56SOL adds `build-wars-party-transfer` while preserving party metadata in general build-set transfer. GPT54 reuses only the build-set transfer envelope. Use GPT56SOL's distinct party envelope for explicit party import/export, while keeping general build-set transfer party-preserving.
- **Selection state:** GPT56SOL persists `lastSelectedPartySlotId`; GPT54 does not. Use GPT56SOL's selected-slot state because empty selected slots are first-class.
- **Implementation breadth:** GPT56SOL is comprehensive but heavy; GPT54 is smaller but leaves too much implicit. Merge by taking GPT56SOL's contracts and pruning nonessential product/UI work.

## Missing Alternative Designs

The final sprint should explicitly note rejected alternatives and why:

- A top-level `party` document kind instead of a build-set annotation. This could isolate party behavior but would fragment existing save/load/backup/share workflows.
- Embedding loadouts inside party slots. This is simpler to reason about locally but creates a second loadout graph and identity drift.
- Synthetic empty build-set entries instead of nullable slot references. This would reuse entry UI but pollute neutral build-set semantics.
- Synchronizing party order to neutral entry order. This improves deterministic neutral transfer but causes party UI actions to mutate neutral workflows.
- No dormant annotations: disabling party could discard annotations after confirmation. This is simpler but makes accidental disable destructive.
- Reusing entry labels/notes only. This reduces metadata scope but makes cleared slots and role-specific annotations weaker.
- General build-set transfer only. This reduces one envelope, but a distinct party envelope gives safer explicit party import semantics.
- Multi-code export of occupied members only. This is simpler, but including every slot better preserves party order and makes omissions visible.
- Validation entirely in app selectors instead of a framework-neutral party validator. This reduces domain API surface but makes deterministic issue codes harder to test and reuse.
- A phased MVP that ships annotations, persistence, and local UI first, deferring native party transfer and multi-code copy to a follow-up sprint.

## Merge Recommendations

Use GPT56SOL as the base architecture, then trim it with GPT54's scope discipline.

Recommended merged decisions:

- Keep `BuildSet` and `BuildSetEntryKind` neutral.
- Replace `src/domain/party.ts` with framework-neutral annotation contracts, not a second loadout graph.
- Store empty slots as stable party slots with `entryId: null`.
- Advance only the app-owned persisted build-set snapshot to v2; keep the outer local-library envelope and storage key unchanged.
- Persist `party` and `lastSelectedPartySlotId` beside the neutral snapshot fields.
- Preserve party order independently from build-set entry order; never reorder neutral entries as a side effect of party movement.
- Keep one active editor at most, and make empty selected slots a real no-active-entry state.
- Preserve dormant annotations on disable; require confirmed Reset Party to discard annotations.
- Use a distinct `build-wars-party-transfer` envelope for explicit party exchange, and also preserve party annotations in general build-set transfer/backup.
- Keep validation structural and deterministic; do not change `validateBuild` or add quality/recommendation semantics.
- Keep selected-member URLs and template import/export selected-member-only.
- Decide presets and slot notes as explicit scope choices before finalizing the sprint.

Recommended cuts or clarifications before finalizing:

- Consider deferring library search over member labels/roles/notes unless it is required for BW-1705 acceptance.
- Consider deferring slot notes if preserving metadata on empty slots can be satisfied by labels, roles, and kinds for MVP.
- Reduce the UI acceptance surface to required controls and accessibility behavior; leave visual polish and optional pointer reordering out.
- Move party metadata preservation for save/load/autosave/backup/restore into the earliest persistence phase, not the sharing phase.
- Add old-client, cross-tab conflict, and max-16 performance tests to the risk-driven acceptance list.
- Make malformed-data recovery outcomes exact: ambient local/backup parse, explicit general build-set import, and explicit party import should each have named behavior.

The merged sprint should not simply concatenate the drafts. It should adopt GPT56SOL's data model and durability boundaries, borrow GPT54's sequencing and MVP pressure, and explicitly reject the conflicting GPT54 assumptions around snapshot v1, synchronized entry order, and general-transfer-only party exchange unless those tradeoffs are intentionally chosen.
