# Sprint 017 Draft Critique: GPT-5.5 and GPT-5.4

## Executive Assessment

Both drafts converge on a sound core direction: preserve the existing single-build experience, add a neutral multi-build document rather than prematurely modeling parties, keep one active `EditorState`, and persist non-selected entries as complete `PersistedBuildSnapshot` values. That is the right compatibility-oriented architecture for the sprint.

The drafts are not yet safely mergeable without resolving several model-level contradictions. The most important are storage schema versioning, whether selection and primary identity are authored or workspace state, the exact meaning of `promote`, the authoritative representation of a build set, and whether record-scoped JSON export is required or optional. These are not implementation details; they affect migration safety, fingerprints, reducer invariants, future party/collaboration work, and the public Definition of Done.

The merged sprint should use GPT-5.5's broader failure analysis and data-integrity coverage, GPT-5.4's clearer phase gates and execution topology, and a smaller set of binding decisions made before implementation begins.

## GPT-5.5 Draft

### Strengths

- It gives the strongest explanation of the domain/app boundary. A framework-neutral `BuildSet` projected from app-owned `PersistedBuildSnapshot` entries avoids leaking PvE budget and raw-template overlay concerns into `src/domain` while preserving those facts in storage.
- It treats single-build compatibility as a first-class invariant across editing, saving, sharing, template workflows, equipment, title ranks, validation, and recovery.
- Its persistence and recovery coverage is unusually complete: malformed nested snapshots, dangerous keys, bounded parsing, record isolation, restore preview, ID remapping, write-blocked recovery, and migration from existing equipment/title-bearing records are all recognized.
- It identifies the central correctness hazard—stale selected-entry snapshots—and proposes a shared materialization path for save, autosave, validation, backup, export, and selection changes.
- It draws a disciplined boundary around party semantics, hosted sharing, generated-data imports, remote media, and new runtime dependencies.
- Its Definition of Done covers accessibility, narrow layouts, corrupt data, empty and partial states, aggregate validation, omission warnings, documentation, and repository closeout more thoroughly than the GPT-5.4 draft.

### Weaknesses

- It is too undecided at the exact points where execution needs a stable contract. Schema version, saved-record layout, last-entry behavior, entry cap, promotion semantics, metadata fields, library filter semantics, and standalone export are all deferred. Phase 0 could resolve these, but the rest of the draft already assumes outcomes in places, so implementers could read contradictory requirements.
- `BuildSetWorkspaceDraft` duplicates `selectedEntryId` both inside `snapshot` and beside it. This creates two sources of truth for the same state and undermines the otherwise strong mirroring invariant.
- The draft has two representations with overlapping behavior: domain `BuildSetEntry` contains `Build`, while persisted entries contain `PersistedBuildSnapshot`, and mutation helpers are proposed at both domain and app layers. It does not state which representation is authoritative or how metadata and nested build identity remain consistent across projection and mutation.
- The domain contract sample omits set-level `description` and `notes`, while later sections and open questions discuss them. Saved-record notes, set notes, entry notes, and possibly build notes are not given distinct semantics.
- `promote` combines ordering with a kind mutation, yet there is no `primaryEntryId` invariant and no rule for demoting an existing `build` entry. Multiple entries may remain kind `build`, making “primary” ambiguous.
- Comparison is described as conditional in the UI architecture but required by the use cases, Phase 4, and closeout checks. Whole-set JSON export is similarly promised by use cases but made optional in the Definition of Done.
- The file list is broad enough to invite unnecessary changes to `build.ts`, `party.ts`, `guide.ts`, the rule engine, and several selectors. “Reference-only unless required” should be the default for established domain files.

### Gaps in Risk Analysis

- The risk table does not fully address the cost of serializing, hydrating, fingerprinting, and validating as many as 16 complete snapshots on frequent editor actions. Memoization is mentioned, but cache keys, invalidation, and an acceptable interaction budget are not specified.
- It does not analyze storage quota growth. Sixteen entries with raw overlays, equipment, notes, and backups can multiply the current localStorage footprint; quota failure during autosave needs an explicit user-visible and recoverable state.
- It does not cover downgrade or mixed-version behavior. Keeping the key named `build-wars:v1` while changing the internal envelope is acceptable, but an older deployed client may reject or overwrite newer data unless read/write behavior is defined.
- Multi-tab last-writer-wins behavior is out of scope, but it remains a data-loss risk once a larger document is autosaved. The sprint should at least preserve or strengthen existing revision-conflict detection and document the limitation.
- Catalog freshness is modeled at the saved-record level, while entries may have different raw source facts or histories. The draft does not prove that one `savedWith` value can accurately support per-entry stale status.
- It does not distinguish failure atomicity from mirroring frequency. A switch must commit the outgoing snapshot and hydrate the incoming one in one reducer transition; relying on ordered effects would leave a crash window.

### Missing Edge Cases

- Creating a set from a single build that is already associated with a saved record, then saving or reverting, without overwriting the source record.
- Exiting build-set mode, loading a single build, or processing a boot-time share fragment while the active set is dirty or empty.
- A template import that fails after replacement confirmation, or succeeds while the selected entry changes during the dialog flow.
- Hitting the 16-entry cap through add, duplicate, restore, or malformed import, with deterministic diagnostics and focus behavior.
- Removing the selected, first, last, or only entry while a compare target references it.
- Saving, validating, sharing, or exporting an empty set or a set whose selected ID was repaired.
- Restore conflicts among record IDs, set IDs, entry IDs, and nested `Build.id` values; the draft does not say which identities are scoped locally and which must be remapped.
- Duplicate-as-variant behavior for raw template source identity and exact-source replay.
- Storage quota errors, serialization exceptions, pagehide flush failure, and recovery after a newer in-memory revision could not be persisted.
- Dirty fingerprints when only selection, ordering, entry kind, notes, comparison target, or repaired metadata changes.

### Definition of Done Completeness

The Definition of Done is comprehensive but not fully testable because several required behaviors remain conditional. It should be tightened by:

- selecting one outer schema version and migration path;
- defining one authoritative selected-entry field;
- specifying whether selection is durable document content or workspace/session state;
- making record-scoped JSON export either required or explicitly deferred;
- defining primary/promotion and old-primary behavior;
- defining mode-transition and dirty-guard behavior;
- requiring atomic reducer tests and round-trip tests for every durable editor field;
- adding quota/write-failure and revision-conflict acceptance criteria;
- defining whether selection-only changes affect dirty state and autosave;
- resolving set-, record-, entry-, and build-level note ownership.

## GPT-5.4 Draft

### Strengths

- It is more executable. The dependency graph, percentages, verification commands, and phase gates give implementation a clear order and keep high-risk state/persistence work ahead of UI work.
- It commits to one active editor, fresh entry and nested build IDs on duplication, a 16-entry bound, one durable working-draft kind, and a record-scoped JSON export using existing backup machinery.
- Its phase gates are concrete and outcome-oriented, especially the requirement that state and storage round-trip before navigation work starts.
- It explicitly calls for autosave, pagehide flush, revision checks, legacy fixtures, mixed backup behavior, and selected-loadout template handling.
- Its risk section is concise and well prioritized. Snapshot drift, identity confusion, selector cost, ambiguous sharing, and semantic leakage are the correct leading risks.
- Its open questions isolate several product choices that genuinely need resolution, including library layout, promotion semantics, metadata duplication, and importing saved builds into an open set.

### Weaknesses

- Freezing `LOCAL_LIBRARY_SCHEMA_VERSION = 1` while adding new durable fields changes the meaning of an existing schema version. This saves a migration step now but creates long-term ambiguity: the same version number would accept materially different envelopes, fixtures cannot identify capabilities from the version, and future migrations must detect shape rather than version.
- The additive parallel fields (`workingDraft`, `workingBuildSetDraft`, `savedBuilds`, `savedBuildSets`) reduce initial blast radius but scale poorly if more authored document kinds arrive. The draft does not frame this as a deliberate short-term trade-off or provide a path to a discriminated document collection.
- It also places `selectedEntryId` in the framework-neutral authored model without examining whether selection is a persisted editing cursor rather than domain content.
- `promote` is defined only as moving an entry to index 0, while entries also have kinds. The relationship among order, `kind: "build"`, selection, and “primary” is left incoherent.
- The domain is asked to classify “partial” sets, even though unresolved/raw-overlay and catalog-unavailable status may require app snapshot and catalog context. Structural classification and validation projection should not be conflated.
- It does not describe a single shared materialization function as explicitly as GPT-5.5. Mirroring “after every editor action” and “before selection” is insufficient unless save, backup, export, library summaries, and validation are guaranteed to consume a materialized view.
- Security and recovery requirements are sound but less complete around sparse arrays, recursive dangerous keys, rendering untrusted text, bounded traversal, and destructive confirmations.

### Gaps in Risk Analysis

- The additive-version-1 strategy itself is under-analyzed. The mitigation assumes legacy compatibility but does not address version semantics, downgrade writes, unknown-field preservation, or old clients clobbering new fields.
- It does not cover divergence between the semantic `BuildSet` projection and app snapshot representation, or duplicated mutation logic across domain helpers and reducers.
- It mentions selector cost but not localStorage quota, write failure, or the cost of generating fingerprints on every action.
- It does not address whether set-level catalog provenance is sufficient for per-entry stale diagnostics.
- It does not cover UI-state references becoming invalid after remove, restore, selected-ID repair, or record replacement.
- “At most one working draft kind” lacks conflict resolution for corrupt or legacy data containing both fields.

### Missing Edge Cases

- Dirty transitions between single-build and build-set modes, including conversion of a saved single build and returning to a single build.
- Empty-set save/load/share/template actions and the behavior of the inert editor when no selection exists.
- Removal of an entry that is selected, primary, or the active compare target.
- Restoring the same exported set twice and remapping the appropriate identity scopes without breaking internal references.
- Duplicate IDs within one set versus identical nested build IDs across different records.
- Raw-template source preservation on duplication and comparison of raw unresolved facts and PvE budget.
- Quota-exceeded, pagehide failure, stale revision, and partial restore-apply failures.
- Entry-cap enforcement across all creation/import paths, not only ordinary UI add.
- Library filtering semantics across selected, primary, or any entry.
- Selection and focus repair after reorder, removal, overflow scrolling, or failed confirmation.

### Definition of Done Completeness

The Definition of Done is clean and measurable for the happy path, but it is thinner than the GPT-5.5 version for migration and recovery. It should add:

- an explicit materialized-snapshot invariant for save, autosave, validation, backup, export, and library projections;
- golden migration fixtures and a clear unsupported-version policy;
- write-blocked recovery and localStorage quota behavior;
- dangerous-key, sparse-array, over-limit, stale-selection, and malformed nested-snapshot cases;
- dirty-guard requirements for every document-kind transition;
- deterministic behavior when both working-draft fields are present;
- exact identity-remapping rules for restore and duplicate flows;
- responsive overflow, focus restoration, and live-region acceptance criteria;
- a decision about whether set export is a committed deliverable or a deferred capability.

## Cross-Draft Contradictions and Strategic Trade-offs

| Topic | GPT-5.5 | GPT-5.4 | Recommended Resolution |
| --- | --- | --- | --- |
| Outer storage schema | Prefers version 2 but defers the choice | Binds additive schema version 1 | Keep the `build-wars:v1` key, advance the envelope schema to version 2, and migrate version-1 data in memory without eager rewrite. Key name and payload schema version should be treated as independent concerns. |
| Saved-record layout | Kind-aware union preferred; parallel arrays allowed | Parallel arrays are binding | Use a discriminated `savedDocuments` model in memory. Persist parallel legacy/new arrays only if it materially simplifies safe migration, with one normalization boundary and a documented future convergence path. |
| Selected identity | Duplicated in snapshot and workspace draft | Persisted in authored `BuildSet` | Have one source of truth. Prefer durable `lastSelectedEntryId` in app persistence/workspace state, not the framework-neutral authored model, unless selection is explicitly defined as portable document metadata. |
| Primary/promote | Move first and set kind to `build` | Move to index 0 only | Do not infer primary from both kind and order. Either add an explicit `primaryEntryId`, or define index 0 as primary and keep `kind` purely descriptive. Specify demotion behavior. |
| Set metadata | Contract sample omits set description/notes; later text questions them | Includes set description/notes | For MVP, keep one set name plus record-level notes and entry-level notes unless a distinct use case justifies set description/notes. Avoid four overlapping text fields. |
| Whole-set export | Promised, but later conditional | Required record-scoped export via backup machinery | Make record-scoped inert JSON export/import a committed BW-1605 result, using the same validators and preview/apply path as backup/restore. |
| Comparison | Architecturally conditional but later required | Explicit required workflow | Require a compact deterministic comparison; allow UI simplification, not feature omission. Include PvE budget and unresolved raw facts as well as semantic build fields. |
| Last-entry removal | Deferred decision | Assumes a supported empty-set state | Choose the empty-set model already present in both use cases. It is simpler and avoids fabricating an authored build after deletion. |
| Build-set component | Navigator, summary, and optional compare components | One broader `BuildSetPanel` | Use a panel/container with navigator and selector-driven child views. This preserves a stable composition boundary without concentrating all interaction logic in one component. |
| Risk posture | Broader security/recovery detail | Better execution sequencing and phase gates | Merge both: retain GPT-5.4's topology and gates, but adopt GPT-5.5's bounded parsing, recovery, accessibility, and closeout criteria. |

## Long-Range Architecture Risks

1. **Selection is being confused with authored identity.** A build set's entries and primary choice may be domain data; the currently selected editor tab is normally workspace state. Persisting one field for both makes future collaboration, multiple views, and headless use awkward.
2. **Index-based primary semantics are fragile.** Reordering for presentation would silently change primary meaning. An explicit `primaryEntryId` is safer if primary is real product behavior; otherwise remove “primary” language and treat order as order only.
3. **Two full models can drift.** Domain `BuildSet<Build>` and persisted `BuildSetSnapshot<PersistedBuildSnapshot>` need a declared authority and pure conversion rules. Domain mutation helpers should operate on structural metadata only, or be generic over entry payload, so app reducers do not reimplement subtly different operations.
4. **Version-1 additive persistence creates schema debt.** A version must identify a stable grammar. Shape detection under one version becomes increasingly unsafe as new document kinds are added.
5. **Parallel record collections may hard-code a two-kind world.** That is acceptable as a migration representation, but selectors and commands should consume a normalized discriminated document interface so a later party/guide document does not require another cross-app fork.
6. **Hydration as a general selector primitive may become expensive and effect-prone.** Summary, validation, and comparison should preferably operate on immutable snapshot projections with explicit catalog inputs. Full editor hydration should remain an editing boundary.
7. **Set-level provenance may be too coarse.** If freshness and unresolved status are displayed per entry, the model must prove that provenance is derivable from each snapshot or persist it per entry.
8. **LocalStorage may become the limiting architecture.** The sprint need not move to IndexedDB, but it should measure representative and maximum serialized sizes, handle quota failures, and avoid promising unbounded future growth under the current storage backend.

## Merge Recommendations

1. Freeze a minimal contract before implementation:
   - one envelope schema version and migration matrix;
   - one authoritative selection field;
   - explicit primary/promotion semantics;
   - empty-set behavior;
   - entry cap and bounds;
   - metadata ownership;
   - mandatory record-scoped JSON export;
   - identity scopes and remapping rules.
2. Keep GPT-5.4's phase order and gates, but make GPT-5.5's `materializeActiveBuildSetSnapshot` invariant the center of Phase 2. Selection changes must be atomic reducer transitions that commit the outgoing entry and hydrate the incoming entry together.
3. Define the persisted snapshot as the workspace authority and the domain `BuildSet` as a pure semantic projection. Use one shared set of structural helpers for IDs, bounds, order, remove, and promotion; do not maintain parallel domain and app mutation implementations.
4. Keep selection/compare/focus/collapse as workspace UI state. If last selection is worth restoring, persist it under an explicitly app-owned name such as `lastSelectedEntryId`; do not let it double as primary identity.
5. Prefer internal envelope schema version 2 under the unchanged storage key. Add golden tests for version-1 single-build data, version-2 mixed documents, unsupported future versions, corrupt roots, and no eager rewrite on read.
6. Normalize saved builds and build sets to a discriminated in-memory document union even if migration safety leads to parallel arrays on disk for this sprint.
7. Make record-scoped set export/import reuse the backup validator, preview, bounds, and confirmation flow. State exactly what IDs remain stable and what is remapped on import-as-copy versus restore.
8. Add a reducer/property-style round-trip matrix covering every durable field: professions, mode, attributes, skills, equipment, title ranks, PvE budget, raw overlay/source facts, entry metadata, ordering, and identity. Exercise edit-switch-edit, rapid switch, save without switch, reload, duplicate, remove, restore, and revert.
9. Add explicit acceptance criteria for quota/write failure, stale revision, both-draft conflict, entry-cap enforcement on every ingress path, empty-set commands, invalid compare targets, and boot-time share/template replacement.
10. Keep the neutral container boundary, but avoid adding speculative entry kinds or metadata unless the UI and validation behavior uses them now. Neutrality is better preserved by a small stable contract than by anticipatory taxonomy.

## Recommended Definition of Done Additions

- [ ] The outer envelope schema is version 2 under the unchanged `build-wars:v1` key, with tested version-1 migration and unsupported-version behavior.
- [ ] Exactly one field is authoritative for active selection; primary identity, if supported, is separate and deterministic.
- [ ] Every entry switch is one atomic state transition that materializes the outgoing durable snapshot before hydrating the incoming editor.
- [ ] Save, autosave, dirty fingerprinting, validation, summaries, backup, export, and restore preview consume the same materialized build-set view.
- [ ] Snapshot round trips preserve every durable editor field for selected and non-selected entries.
- [ ] Dirty-state semantics are defined and tested for selection, order, kind, entry metadata, primary choice, and transient compare/focus state.
- [ ] Record, set, entry, and nested build ID scopes are documented and tested for duplicate, save-as-new, export/import, restore merge, and restore replace.
- [ ] Empty-set behavior is supported without creating or persisting a phantom build, and unsupported commands are disabled with clear UI behavior.
- [ ] Entry limits and string/payload bounds are enforced consistently for UI actions, storage hydration, backup restore, and record-scoped import.
- [ ] Quota, serialization, revision-conflict, and pagehide write failures preserve the in-memory document and expose a recovery/export path.
- [ ] Record-scoped whole-set JSON export/import is either shipped and verified through the backup machinery or removed from the sprint's promised use cases; it is not conditional at closeout.
- [ ] Representative 16-entry sets meet a documented interaction and serialized-size budget for editing, switching, summary rendering, validation, autosave, and reload.
- [ ] Set, saved-record, entry, and build metadata have non-overlapping ownership and bounded normalization rules.
- [ ] All phase gates and the repository-wide verification suite pass before tickets, sprint, ledger, and run manifest are marked complete.
