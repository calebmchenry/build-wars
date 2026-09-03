# SPRINT-017 Combined Draft Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-017-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-017-GPT54-DRAFT.md`

Both listed drafts were present.

## Review: `SPRINT-017-GPT56SOL-DRAFT.md`

### Strengths

- The draft makes the central architecture decision explicit: one selected live `EditorState`, inactive loadouts as `PersistedBuildSnapshot`, and switching as one atomic snapshot/hydrate transition. That is the strongest guard against dual-source drift.
- It keeps the domain model neutral and avoids reusing `PartyBuild`, hero/henchman identity, party slots, guide concepts, party legality, and external team-template formats.
- The schema-2 document-union plan is coherent. A single discriminated `savedRecords[]` / `workingDraft.document` shape is easier to extend and reason about than parallel arrays for every document kind.
- It distinguishes authored-content fingerprints from workspace-persistence fingerprints, which directly addresses the subtle dirty-state problem where selection should survive reload without making a saved record appear changed.
- It includes strong persistence and import boundaries: bounded unknown-JSON parsing, dangerous-key rejection, schema-1 migration without write-on-read, write-blocked recovery, and complete set transfer through inert JSON.
- Variant semantics are deliberately flat. Promotion is only `variant -> build`, comparison is read-only, and there is no parent/base pointer that would create hidden inheritance rules.
- The Definition of Done is unusually comprehensive and testable. It covers identity scopes, empty-state behavior, switching fidelity, migration, accessibility, comparison, validation, sharing, backup/restore, documentation, and final verification.

### Weaknesses

- The draft is over-specified for a sprint plan. It reads closer to a design specification plus implementation checklist, which increases execution friction and makes future reasonable implementation tradeoffs look like deviations.
- Scope is broad for one sprint: domain model, persistence migration, mixed library records, working-draft semantics, navigator UI, copy-from-library, variant actions, comparison, aggregate validation, native set transfer, backup schema upgrade, documentation, and closeout all land together.
- It assumes schema 2 under the existing `build-wars:v1` key is acceptable because older clients will write-block. That may be true, but the draft does not prove the current older-client behavior or define a downgrade test using an actual pre-sprint parser.
- The exclusive active/inactive union is architecturally clean, but it increases reducer complexity. Every operation must handle active and inactive sources uniformly, and the draft underplays the implementation burden of keeping action routing pure while still preserving editor-only facts.
- The comparison feature is deeper than the MVP requires. Semantic diffs across equipment, title ranks, PvE budget, raw overlays, unresolved facts, and catalog-order independence are valuable, but they are a major second product surface.
- The build-set transfer flow duplicates parts of backup/restore parsing, preview, diagnostics, dirty-guard, and apply behavior. The draft says it is a separate envelope but does not fully address how much code can be shared without two parallel import engines.
- The UI plan risks overcrowding the main editor. The navigator, set header, summary cards, aggregate status, menus, comparison, validation overview, and transfer controls all compete for the same top-of-main-column space.

### Gaps In Risk Analysis

- There is no explicit risk for migration rollout complexity: schema-1 local library, schema-1 backup, schema-2 local library, schema-2 backup, set transfer, and startup share URL all cross persistence boundaries in one sprint.
- The draft does not call out the risk that summary selectors hydrate inactive snapshots into temporary editor state, which may accidentally run editor defaults, normalizers, or catalog-dependent fallbacks that alter presentation or fingerprints.
- It mentions performance caps and memoization, but not worst-case interaction timing. A 24-entry set with validation, equipment summaries, title facts, search indexing, and comparison can still produce noticeable re-render cost without careful selector invalidation.
- The plan lacks a clear fallback if schema-2 migration proves too risky mid-sprint. It rejects additive fields, but does not define a staged migration or feature-flagged path.
- Accessibility risk is covered for the navigator, but less so for the comparison drawer and import/restore previews, which may contain large diagnostic tables and nested statuses.
- The draft does not explicitly analyze data-size pressure in `localStorage`. A 24-entry set with raw overlays, equipment, titles, notes, many saved records, backups, and drafts could hit quota sooner than expected.
- It assumes no new dependency is needed, but does not discuss whether existing deep-clone, stable-serialization, and schema-validation helpers are sufficient or whether hand-rolled validators will become a maintenance burden.

### Missing Edge Cases

- Behavior when the selected entry is valid but the active editor cannot hydrate because a required catalog view is unavailable or stale.
- Behavior when two tabs edit the same build-set draft and one tab changes selection while the other changes content before a revision conflict is detected.
- How dirty guards behave when switching from a single-build draft to a build-set draft while a startup share URL is present.
- Importing a build-set transfer whose set ID, entry IDs, or nested build IDs collide with an open unsaved set, a saved set, or existing DOM IDs.
- Library search/filter semantics for empty sets and for sets where all entries are incomplete or unresolved.
- Set export/import behavior for a no-entry set, a no-selection nonempty malformed set, and a maximum-size set near storage quota.
- Whether notes/description trimming happens consistently for authored edits, parsed local storage, backup restore, and set transfer import.
- How focus restoration works after deleting the selected entry when the next deterministic selection is offscreen in an overflowed navigator.
- Whether comparison can compare against an inactive source immediately after a duplicate when the source had unsaved active-editor changes moments earlier.

### Definition Of Done Completeness

- The DoD is mostly complete and maps well to the architecture. It includes functional behavior, persistence behavior, migration safety, accessibility, validation, sharing boundaries, documentation, and verification.
- The DoD should add explicit downgrade/older-client evidence if the plan keeps schema 2 under `build-wars:v1`.
- The DoD should add storage-size/quota evidence for representative large sets and mixed libraries.
- The DoD should require a targeted test that inactive-summary generation cannot mutate snapshots, fingerprints, or dirty state.
- The DoD should state a minimum acceptable MVP if comparison or transfer must be deferred to keep persistence and switching safe.

## Review: `SPRINT-017-GPT54-DRAFT.md`

### Strengths

- The draft correctly identifies implementation order as the main constraint: freeze durable contracts, extend workspace state/storage, then build UI, variants, validation/export boundaries, and finally documentation.
- It preserves core EPIC-16 boundaries: no party semantics, no hero data, no second full editor pane, no backend, no team-template or paw-ned2 codec, and selected-loadout-only sharing.
- It keeps one active `EditorState` and stores non-selected loadouts as durable snapshots, which is the right high-level model.
- The use cases are concise and cover the main product behaviors without turning every internal invariant into a user story.
- The risk table is focused and readable. It calls out active-editor drift, storage compatibility, identity confusion, selector cost, party-language leakage, and share/import ambiguity.
- The draft identifies several product open questions that should be resolved early, especially the entry cap, mixed library list density, promote semantics, and whether entry `description` plus `notes` is overkill.

### Weaknesses

- The storage strategy is the weakest architectural assumption. Keeping `LOCAL_LIBRARY_SCHEMA_VERSION = 1` while additively adding `workingBuildSetDraft` and `savedBuildSets` creates an ambiguous schema: old and new payloads share a version number even though the data model has changed materially.
- Parallel persistence fields (`workingDraft`, `savedBuilds`, `workingBuildSetDraft`, `savedBuildSets`) increase long-term branching and make future document kinds harder. The draft does not compare this against a discriminated document union.
- The active-editor mirroring rule says every editor action immediately mirrors a snapshot into the selected build-set entry. That introduces a second active copy by behavior, even if not by intent, and creates exactly the drift risk the plan is trying to avoid.
- It contains a major semantic inconsistency: binding defaults say duplicate variants must create fresh IDs, while Phase 4 defines `promote` as moving the selected entry to index `0`. That conflicts with the neutral `variant` model and implies a privileged base position.
- Entry metadata is inconsistent. The architecture says set and entry `description` and `notes`, while other sections talk about bounded notes only. This is avoidable scope creep and should be collapsed unless both fields have distinct product value.
- The draft defers importing an arbitrary saved single-build record directly into an open build set in Open Questions, but earlier file ownership and UI scope imply Copy Into Set behavior. This needs one clear answer.
- Record-scoped build-set export is described as reusing the backup envelope rather than having a separate native set-transfer envelope. That may reduce code, but it risks blurring whole-library backup, single-record export, draft restore, and set transfer semantics.

### Gaps In Risk Analysis

- The risk table does not address schema ambiguity from changing schema contents while keeping schema version `1`.
- It does not analyze the failure mode where old clients read an additive schema-v1 payload and write it back without preserving unknown build-set fields.
- It underestimates the cost of eager mirroring on every editor action, especially if snapshot creation includes equipment, title-rank, raw-template, and catalog-derived facts.
- It does not include a risk for product ambiguity around `promote`, `description` versus `notes`, copy-into-set, and set export format.
- It does not call out the risk that parallel build/build-set arrays require duplicated library search, sort, dedupe, restore, backup, and conflict logic.
- Accessibility and responsive-layout risk are mostly treated as implementation tasks, not as risks that could force scope reduction.
- There is no explicit security risk for prototype-pollution keys, excessive nested loadouts, or imported JSON size, despite the storage/import plan depending on unknown JSON.

### Missing Edge Cases

- What happens when both `workingDraft` and `workingBuildSetDraft` exist in storage despite the invariant that only one should be durable.
- How saved-build and saved-build-set ID conflicts are handled if there are two arrays rather than one common record list.
- Whether an older schema-v1 parser preserves or drops unknown additive fields after a save/update.
- Whether active-entry mirroring runs for editor actions that should remain ephemeral, such as dialogs, filters, hover state, browser result selection, or tab changes.
- How `Update` behaves if the associated record has the same ID but a different document kind after restore, duplicate, or corruption recovery.
- How promote-to-index-0 interacts with reorder history, comparison target, deterministic selection, and later party-adapter assumptions.
- Whether record-scoped export can distinguish "export this set" from "backup this library" in preview/apply copy and validation.
- How empty-set records participate in library preview, search, filters, aggregate validation, backup restore, and selected-loadout share controls.
- Whether single-build startup share URLs should replace a current build-set draft, be dirty-guarded, or always open as a separate single-build draft.

### Definition Of Done Completeness

- The DoD covers the main user-facing and persistence behaviors, including one active editor, switching fidelity, variant identity, selected-loadout sharing, restore preview, documentation, and `npm run verify`.
- It is weaker than the architecture needs around schema evolution. It should require tests proving old schema-v1 clients cannot silently drop new build-set fields, or it should adopt a schema-version bump.
- It should require exhaustive document-kind handling for save/update/load/delete/duplicate/restore paths, not just generic compatibility statements.
- It should add tests for "both working drafts exist", "associated record kind mismatch", and "unknown additive fields are not lost".
- It should remove or clarify `description` fields and `promote` semantics before execution; otherwise DoD can pass while the product contract remains muddled.
- It should add explicit performance and storage-size thresholds for the 16-entry cap, since the cap is justified by testability and layout cost.

## Comparison

### Architecture Assumptions

- `SPRINT-017-GPT56SOL-DRAFT.md` assumes a true persistence migration to schema 2 with a discriminated document union. This is cleaner, more future-proof, and easier to validate exhaustively, but it raises downgrade and migration risk.
- `SPRINT-017-GPT54-DRAFT.md` assumes additive schema-v1 expansion with parallel build-set fields. This may appear less disruptive, but it hides a more dangerous compatibility problem: old schema-v1 code may treat the payload as known and drop unknown fields on the next write.
- The GPT56SOL active/inactive entry union is more internally consistent than GPT54's "mirror on every editor action" model. Mirroring creates hidden dual-state complexity and should not be merged as written.
- GPT56SOL's kind-only promotion better preserves neutrality. GPT54's promote-to-index-0 rule creates base-entry semantics and should be rejected unless product explicitly wants a privileged primary loadout.
- GPT56SOL's separate `BuildSetTransferEnvelopeV1` is a clearer user and parser boundary than GPT54's record-scoped export through backup machinery. The implementation should still share parsing and diagnostics helpers where possible.

### Scope Creep Risk

- GPT56SOL has the stronger architecture, but also the larger scope. Its comparison, transfer, aggregate validation, mixed-library migration, and detailed accessibility requirements may exceed a single sprint if persistence work uncovers surprises.
- GPT54 is shorter, but some of that is hidden scope rather than smaller scope. Parallel arrays, additive versioning, eager mirroring, and ambiguous export semantics push complexity into implementation and future maintenance.
- Both drafts include comparison in the MVP. That is the easiest feature to defer if the sprint starts slipping because durable switching, save/load, migration, backup, and selected-loadout sharing are the higher-risk foundations.
- Both drafts risk turning the navigator into a dense command surface. The MVP should prioritize select/add/duplicate/remove/reorder/rename and defer low-frequency actions or hide them behind a predictable menu.

### Missing Alternative Designs

- Neither draft seriously compares three persistence options: schema-2 discriminated union, additive schema-v1 parallel arrays, or a staged compatibility adapter that reads both but writes only the new union after explicit migration evidence.
- Neither draft evaluates a reduced MVP where build sets initially support create/add/select/save/load/backup, with comparison and native set transfer delayed until switching and persistence are proven.
- Neither draft explores whether inactive-entry summaries should be generated from snapshots directly rather than hydrating temporary editor states through existing selectors.
- Neither draft compares top-of-editor navigator placement against a dedicated workspace subpanel or library-integrated "open set" panel. The chosen placement is plausible, but the tradeoff with editor vertical space is not examined.
- Neither draft defines a feature-flag or kill-switch strategy for local-library migration if schema issues appear late in execution.
- Neither draft describes an explicit compatibility test harness using frozen pre-sprint serialized libraries and backups plus a simulated older-client write path.

## Merge Recommendations

- Use GPT56SOL as the architectural base for the final sprint, especially the schema-2 document union, exclusive active/inactive runtime state, snapshot/hydrate transition, authored-content versus workspace-persistence fingerprints, kind-only promotion, and separate native set-transfer envelope.
- Pull GPT54's concise execution topology and open-question framing into the final plan. It is easier for implementers to follow, and its open questions identify product decisions that GPT56SOL resolves but may need explicit acceptance.
- Reject GPT54's additive schema-v1 plan unless a concrete old-client preservation test proves unknown build-set fields cannot be dropped. Prefer "same storage key, bumped envelope schema" over "same storage key, same schema version, new shape."
- Reject GPT54's eager mirroring rule. Serialize the active entry on controlled reducer boundaries and through central helpers, and test that no entry stores both a live editor and an active snapshot copy.
- Reject promote-to-index-0. Keep promotion as `variant -> build` only, with reorder handled separately.
- Collapse entry `description` and `notes` to one bounded entry-notes field unless product names a distinct use for both. Keep set-level description if needed.
- Consider lowering the initial entry cap to 16 until selector cost, serialized size, and responsive layout are measured. GPT56SOL's 24-entry cap is acceptable only if Phase 0 includes quota and render-cost evidence.
- Make comparison a stretch or separately gated phase. It should not block the sprint's core value: multiple durable loadouts, lossless switching, local save/load, mixed backup/restore, and selected-loadout sharing.
- Share code between backup/restore and set transfer at the validator/diagnostics/preview-helper level, but keep their envelopes and UI language distinct.
- Add final-sprint DoD items for downgrade behavior, large-set storage/quota checks, inactive-summary purity, both-working-drafts recovery, associated-record kind mismatch, and no write-on-read migration.
