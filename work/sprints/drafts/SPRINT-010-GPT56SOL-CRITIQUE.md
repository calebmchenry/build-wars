# Combined Critique: Sprint 010 — Local Library and Sharing

## Executive Assessment

Both drafts agree on the correct core direction: a local-first library, a separately persisted working draft, explicit saved-record identity, preservation of raw template fidelity, safe backup/restore, and diagnostic-only catalog freshness.

The GPT-5.4 draft is the stronger execution baseline because it defines boot order, module ownership, phase gates, and verification commands. The GPT-5.5 draft is more compact and occasionally cleaner about boundaries, particularly around persisted snapshots and explicit association clearing. Neither is execution-ready until several data-loss and lifecycle ambiguities are resolved.

The most serious unresolved areas are:

- ownership of draft association and hydration state;
- share-URL lifecycle after the first edit or refresh;
- loss of an unsaved working draft when loading another build;
- atomicity and partial-failure behavior for restore;
- handling invalid records without silently deleting them on the next write;
- schema/key evolution beyond v1;
- whole-envelope autosave performance and multi-tab overwrite behavior;
- inconsistent definitions of freshness, unresolved data, and the exact persisted snapshot.

## GPT-5.5 Draft

### Strengths

- Establishes a coherent conceptual separation between active editor state, saved snapshots, and library workflow state.
- Explicitly preserves `Build`, `PveBudgetState`, raw template overlay/source information, unresolved IDs, and catalog-version facts.
- Correctly states that template/share imports clear saved-record association. This is an important protection against accidentally updating an unrelated saved build.
- Keeps saved-record identity independent of build equality and template wrapper names.
- Treats sharing as single-build and template-code-first while excluding local metadata.
- Recognizes corrupt-data preservation, restore preview, deterministic conflict handling, and non-destructive freshness diagnostics.
- Keeps `src/domain/**` storage-free and the existing template workflow as the fidelity boundary.
- Lists unresolved architectural questions honestly and supplies reasonable defaults.

### Weaknesses

- State ownership remains internally inconsistent. The architecture says `src/app/library*` owns draft association, while the open questions only decide that `LibraryState` lives beside `EditorState`. It never identifies the single source of truth for the active snapshot plus its association.
- `library-storage.ts` is assigned schema validation, migration, localStorage access, serialization, and backup helpers. Backup planning is complex enough to warrant a separate pure module.
- `storageKey` inside the stored envelope is redundant with the actual localStorage key and creates another mismatch that must be validated or migrated.
- The implementation phases are high-level and lack enough acceptance detail to constrain boot behavior, restore application, and error recovery.
- Important defaults remain “open questions,” including the URL contract and invalid-record behavior. Those decisions affect persisted and externally shared formats and should be resolved before implementation.
- The optional validation timestamp is proposed without specifying whether it is authoritative, informational, or invalidated by catalog changes.

### Gaps in Risk Analysis

- A single envelope means every draft autosave rewrites and serializes the entire library. The draft does not address debounce policy, main-thread cost, write coalescing, or behavior during navigation.
- Encoding the schema version in both the key (`build-wars:v1`) and envelope complicates future migration. A stable key with an internal schema version is safer, or the migration discovery strategy must be documented.
- Invalid-record preservation is underspecified. If invalid records are skipped in memory, the next successful autosave may rewrite the envelope without them, effectively deleting data.
- No concurrency policy exists for two tabs. Even if live synchronization is out of scope, last-writer-wins and external-change detection should be explicit.
- “In-memory fallback” does not define whether failed mutations remain marked as non-durable, whether writes are retried, or how the user distinguishes persisted from session-only changes.
- Security analysis omits localStorage exposure to same-origin script and the privacy implications of putting template data in browser history or copied URLs.

### Missing Edge Cases

- Loading another record while the current working draft contains changes not committed to its associated saved record.
- Opening a share URL while a working draft exists, then editing and refreshing while the share fragment remains in the address bar.
- A share import retaining an old association and enabling accidental `Update`.
- Deleting or replacing a record referenced by the working draft.
- Merge remapping an imported record ID that is also referenced by an imported working draft.
- Repeatedly restoring the same backup, including identical-ID/identical-content records versus identical-ID/different-content records.
- Replace restore containing some invalid records; silently replacing with only the valid subset could be unexpectedly destructive.
- Quota failure during restore application after the UI has already adopted restored state.
- Invalid timestamps, duplicate IDs within one backup, extreme record counts, oversized notes/tags, deeply nested JSON, and malformed URL encoding.

### Definition of Done Completeness

The Definition of Done covers the principal feature inventory, but several items are not objectively testable. Terms such as “responsive access,” “lossy fallback,” and “validate against current catalogs” need concrete acceptance criteria.

It should additionally require:

- a boot-precedence truth table;
- association clearing for all external imports;
- explicit dirty-draft behavior when loading another build;
- preservation tests across draft, save, duplicate, load, share, export, merge, and replace;
- an atomic restore plan with defined write-failure behavior;
- an exact, versioned URL grammar and fragment lifecycle;
- proof that invalid stored records cannot disappear on a subsequent write;
- accessibility checks for dialogs, warnings, keyboard use, and narrow-screen library access.

## GPT-5.4 Draft

### Strengths

- Provides the clearest execution topology and explains why sharing precedes the library panel.
- Defines an explicit boot sequence and gives share URLs precedence without mutating the saved library.
- Separates backup/restore into its own pure module, which is preferable for testability and long-term maintainability.
- Supplies concrete file ownership, task checklists, phase gates, test commands, and closeout requirements.
- Defines useful deterministic query behavior, including tie-breakers and unresolved raw skill-label search.
- Clarifies deletion behavior: the draft remains loaded while its association is cleared.
- Adds stronger security guidance around React escaping, clipboard access, imported data, and remote behavior.
- Its grouped Definition of Done is more reviewable and measurable than the GPT-5.5 version.
- A dedicated compendium document is a better long-range documentation choice than continually expanding the editor note.

### Weaknesses

- Adding `associatedRecordId` and a hydration-source flag directly to `EditorState` couples editor state to persistence and boot orchestration. These belong more naturally in an app-level draft-session aggregate.
- `App.tsx` is expected to own boot orchestration, autosave, warnings, restore, library composition, and responsive UI. That concentration will likely produce difficult effect ordering and integration tests.
- The share boot rule is incomplete. Autosave is suspended only until the first mutation, but the share fragment remains authoritative on every later refresh unless it is consumed or cleared.
- “Explicit update” should not arm autosave for a share-loaded draft because a share import must have no saved-record association and therefore must not expose `Update`.
- The persisted `metadata` field includes “implementation-owned diagnostics,” which conflicts with excluding transient warnings and risks accumulating unstable or sensitive error details.
- Phase 5 deliberately adds placeholder freshness chips, creating avoidable UI rework. Freshness status contracts should exist before the panel renders them.
- The assertion that no open question blocks execution is too strong; URL framing, dirty-draft replacement, invalid-record retention, restore atomicity, and multi-tab semantics remain unresolved.
- “About 1,500 characters” is unsuitable for a protocol limit. The cap and whether it applies before or after URL encoding must be exact.

### Gaps in Risk Analysis

- It does not analyze the whole-envelope rewrite cost created by autosaving the draft in the same key as every saved record.
- It does not define how split editor/library reducers produce one consistent persisted envelope when multiple updates occur close together.
- It lacks a storage failure transaction model. Applying a mutation in memory before a failed durable write can make the UI imply stronger persistence than exists.
- It does not address invalid subset preservation or the danger of losing skipped records during the next serialization.
- It omits multi-tab overwrite risk and schema/key evolution.
- Resource-exhaustion risks from large backup files, record counts, notes, tags, or decoded URL payloads are not bounded.
- Freshness is deferred to the final phase even though catalog-version structure is part of the Phase 1 schema. Late discovery of an inadequate version model could force migration before release.

### Missing Edge Cases

- A retained URL fragment repeatedly overriding an autosaved, edited share draft on refresh.
- Back/forward navigation between multiple share fragments.
- Unrelated fragments, duplicate parameters, malformed percent encoding, and conflicting optional mode information.
- React Strict Mode or rapid editor actions triggering duplicate/stale autosave effects.
- Storage access throwing before `getItem`, rather than only `getItem` or `setItem` failing.
- A record loaded while the current draft is dirty.
- Association repair after merge remaps or replace removes a referenced ID.
- Whether replace without an imported working draft clears or preserves the current one.
- Whether merge ignores, imports, or separately offers the backup’s working draft.
- Preview/apply drift if fresh IDs or timestamps are regenerated after the user confirms the preview.
- Repeated restore of the same backup and classification of exact duplicates.
- Clipboard, History API, and download failures.

### Definition of Done Completeness

This draft has the stronger Definition of Done, but it still lacks several critical invariants:

- one canonical snapshot round-trip matrix across every persistence and sharing path;
- dirty-draft replacement protection;
- exact share URL syntax, cap, and fragment-consumption behavior;
- persistence-status and retry behavior after failed writes;
- atomic preview-to-apply restore semantics;
- explicit treatment of invalid records during partial parse and replace;
- internal backup ID/association consistency after remapping;
- scale limits and accessibility acceptance criteria.

It also conflates freshness with resolution. `current`, `stale`, and `unknown` describe catalog-version freshness; `resolved`, `unresolved`, and `invalid` describe build compatibility. These should be separate diagnostic axes.

## Cross-Draft Contradictions

| Topic | GPT-5.5 | GPT-5.4 | Recommended Resolution |
| --- | --- | --- | --- |
| Draft association ownership | Library state owns association | `EditorState` gains `associatedRecordId` | Introduce an app-level `DraftSessionState` containing the editor snapshot, association, dirty/durability status, and hydration provenance. |
| Persisted snapshot | Explicitly includes `PveBudgetState` | Primarily lists `Build` and raw overlay/source | Define one canonical snapshot type and include every non-derivable editor input, including PvE budget state if it is not part of `Build`. |
| Backup module | Backup helpers in storage | Dedicated `backup-restore.ts` | Use the dedicated pure backup/restore module; keep storage limited to durable reads and writes. |
| Share URL carrier | Simple query parameter; optional display name | Fragment; optional mode | Prefer a versioned fragment format to reduce server/referrer exposure. Include only facts not already encoded by the template code. |
| Import association | Explicitly cleared | Not stated clearly | Every external share/template import must set association to `null`; `Update` must be unavailable. |
| Conflict IDs | Deterministic remap | Fresh IDs | Generate IDs once while creating the restore plan, display that exact plan, and apply it unchanged after confirmation. |
| Restore draft behavior | Working draft restored only in replace | Replace includes imported draft when present; merge unspecified | Define merge and replace separately, including behavior when the backup has no draft and when associations are remapped. |
| Freshness vocabulary | Stale/unresolved | Current/stale/unknown and later unresolved | Separate catalog freshness from record resolution/validation status. |
| Documentation | Existing compendium note unless too large | New dedicated note plus editor update | Adopt the dedicated local-library note and keep the editor note concise. |
| Sprint status | `draft` | `planned` | Keep `draft` until these protocol decisions are settled, then promote the merged artifact to `planned`. |

## Merge Recommendations

1. Use the GPT-5.4 draft as the structural base, while importing GPT-5.5’s explicit import-association clearing, `PveBudgetState` preservation, and stronger snapshot language.

2. Establish one canonical `PersistedBuildSnapshot` shared by drafts, saved records, and backups. All paths must use the same validator and projection logic so raw-overlay fidelity cannot drift.

3. Use a `DraftSessionState` above the editor reducer. It should own association, dirty status, durability status, and hydration source without pushing the saved collection into `EditorState`.

4. Resolve share behavior as a state machine:

   - valid share payload hydrates a transient unassociated draft;
   - the saved library remains untouched;
   - invalid payloads fall back to the stored draft;
   - the first mutation must either consume the fragment or update the URL policy so refresh cannot revert edits;
   - loading a share or saved record must address replacement of a dirty draft explicitly.

5. Keep `backup-restore.ts` pure. Preview should produce an immutable restore plan containing classifications, ID remaps, association rewrites, and final counts. Confirmation must apply that exact plan. Replace with skipped invalid records should be blocked or require a separate explicit acknowledgement.

6. Define invalid-storage recovery before coding. Either enter read-only recovery mode, preserve invalid fragments in a quarantine field, or require explicit repair/export before rewriting. “Skip but preserve” is not sufficient without a persistence mechanism.

7. Reconsider the versioned key. Prefer a stable key with `schemaVersion` inside the envelope. If `build-wars:v1` is mandatory, document how future versions discover, migrate, and retain the old key.

8. Add an autosave policy covering debounce/coalescing, latest-write ordering, navigation flushing, storage failure, retry, and a visible non-durable state. Explicitly document multi-tab behavior even if the MVP remains last-writer-wins.

9. Separate catalog freshness from build resolution and validation. This avoids a misleading single status chip and makes later EPIC-21 evolution safer.

10. Expand the final Definition of Done with a cross-path fidelity matrix, dirty-draft guards, exact URL grammar, restore atomicity, invalid-record retention, association remapping, resource limits, accessibility, and failure tests for browser storage, clipboard, history, and download APIs.

With those changes, the merged sprint would have a coherent ownership model, safer data-loss boundaries, and a much more durable foundation for eventual IndexedDB or synchronized storage.