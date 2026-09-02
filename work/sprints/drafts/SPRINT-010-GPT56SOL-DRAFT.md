---
id: SPRINT-010
title: Local Library and Sharing
status: planned
source_target: BACKLOG
source_epic: EPIC-09
source_epic_path: work/tickets/09-local-library-and-sharing/EPIC.md
tickets:
  - BW-0901
  - BW-0902
  - BW-0903
  - BW-0904
  - BW-0905
  - BW-0906
  - BW-0907
created: 2026-09-02
---

# Sprint 010: Local Library and Sharing

## Overview

This sprint turns the EPIC-08 single-character editor into a durable local workspace. The current
draft survives reloads, explicitly saved builds form an independently managed library, and users can
find, load, update, copy, organize, share, back up, and restore those builds without an account or
backend.

Persistence belongs entirely to `src/app`. `src/domain` remains the authority for semantic `Build`
and validation contracts, while `src/template-compatibility` remains the only skill-template codec
boundary. A versioned app-layer document preserves the complete semantic `Build`, PvE budget inputs,
and EPIC-08 raw template overlay/source together. Persisting only `Build` is prohibited because it
would discard unresolved template IDs, source-envelope evidence, and exact-replay eligibility.

The storage and state model is deliberately small but migration-ready:

1. `build-wars:v1` is the single `localStorage` key. Its value is a discriminated, versioned JSON
   envelope with storage metadata, a nullable working draft, and saved records.
2. Only durable editor fields are persisted. Browser filters, open dialogs, tooltip state,
   selection, drag state, keyboard placement, transient messages, and responsive panel state are
   reconstructed from defaults after hydration.
3. A workspace reducer composes the existing `EditorState` with saved records, draft association,
   library UI, and persistence status. Cross-concern operations such as load, update, save-as-new,
   delete-associated, import, and restore are atomic workspace transitions.
4. Saved-record identity is a generated local ID. `Build.id`, content equality, template code, and
   wrapper name are never used as record identity; duplicate content is valid.
5. Storage input is untrusted. Parsing, migration, and record validation are pure and bounded. A
   corrupt or unsupported value is retained untouched, useful valid portions may be recovered in
   memory, and automatic writes remain locked until the user explicitly replaces the data.
6. Draft autosave is coalesced and best effort. Explicit library and restore operations request an
   immediate write, while every failure leaves the current session usable in memory and visibly
   degraded.
7. Share URLs use a compact versioned fragment carrying a proven skill-template export and optional
   representable mode. They never contain library IDs, tags, favorites, notes, or backup JSON.
8. Whole-library backup uses a separate portable JSON envelope and a previewed restore plan. Merge
   never overwrites an ID collision, replace is explicit, and restoring the working draft is an
   independent opt-in.
9. Freshness compares stored catalog/rule-engine facts with the current catalogs, then validates the
   preserved build without rewriting stale or unresolved IDs. Historical revision analysis remains
   owned by EPIC-21.
10. No new package is planned. The browser APIs already available to React—`localStorage`, URL and
    fragment handling, `crypto.randomUUID`, `Blob`, object URLs, and file input—are sufficient and
    are isolated behind injectable app ports for tests and graceful degradation.

This sprint does not add IndexedDB, service workers, accounts, auth, analytics, cloud sync, hosted
sharing, short links, routing, remote recovery, equipment authoring, title ownership, party or guide
records, folders, fuzzy search, revision timelines, automatic skill replacement, or PWA behavior.
It does not change generated catalogs, manifests, QA artifacts, source snapshots, data tooling,
domain semantics, or template-codec behavior.

## Use Cases

1. **Resume an unfinished build**: A user refreshes or reopens the app and receives the last valid
   working draft, including unresolved imported professions, attributes, skills, and exact-source
   template evidence.
2. **Keep experiments out of the library**: Draft edits autosave without creating a saved record or
   appearing in library search until the user explicitly chooses Save as New.
3. **Save with explicit identity**: A user names the current draft and saves a new local record with
   timestamps, tags, favorite state, optional short notes, and current catalog-version facts.
4. **Update or fork deliberately**: A draft loaded from a saved record can update that same ID or be
   saved as a new ID. The UI never guesses based on equal build contents.
5. **Manage records safely**: A user can rename, tag, annotate, favorite, duplicate, and
   confirmation-delete a record. Deleting the record associated with the open draft keeps the draft
   open and merely removes its association.
6. **Avoid replacing unsaved work accidentally**: Loading another record or starting a blank draft
   detects meaningful unsaved differences and offers Save, Discard, or Cancel before replacement.
7. **Find a build deterministically**: A user searches build and skill names; filters by either
   profession, mode, favorite, and tag; and sorts by updated time, name, or profession pair with
   stable tie-breaking.
8. **Use the library at any supported width**: The library is a compact side panel on wide screens
   and an explicit, focus-safe collapsible surface on narrower screens without routing away from the
   editor.
9. **Share one build**: A user creates a same-origin share URL from an exact-source or proven
   canonical skill-template export. If the link is unavailable, lossy, or too long, the template
   text remains selectable and copyable.
10. **Open a shared build**: A valid share fragment loads transactionally into an unassociated
    working draft, preserves compatible raw template facts, consumes the fragment after success,
    and never creates a saved record.
11. **Back up local work**: A user deliberately downloads a portable versioned JSON backup of all
    valid saved records and may include the working draft.
12. **Preview and restore**: A user selects a backup file, reviews accepted/skipped counts, ID
    conflicts, projected result counts, and draft impact, then confirms merge or replace and receives
    an itemized bounded report.
13. **Recover from damaged storage**: Malformed JSON, unsupported versions, invalid records,
    unavailable storage, quota exhaustion, or a detected competing write produces a clear warning
    and an in-memory editor rather than a crash or silent deletion.
14. **Understand stale data**: A loaded or listed build shows whether it was saved against current,
    stale, or unknown catalogs and shows present-day validation results without changing its IDs or
    claiming historical correctness.

## Architecture

### Scope And Ownership

| Layer | Owns | Must Not Own |
| --- | --- | --- |
| `src/domain` | Existing semantic `Build`, validation input/results, catalog versions, IDs, and rules. | React, storage, URL, file, backup, library identity, migrations, or browser APIs. |
| `src/template-compatibility` | Existing skill-template parse/decode/resolve/export, exact replay, canonical proof, and typed failures. | Saved records, share fragments, local storage, backup JSON, or React UI. |
| `src/app/persistence-schema.ts` | Plain persisted contracts, bounds, field reconstruction, stable serialization/fingerprints, migration registry, and partial-recovery reports. | `window`, `localStorage`, React, catalog imports, file downloads, or UI state. |
| `src/app/local-storage.ts` | The one storage key, read/compare/write port, browser exception normalization, revision checks, and injectable memory/test adapters. | Schema interpretation, reducer mutation, UI rendering, or hidden retries. |
| `src/app/workspace-state.ts` | `WorkspaceState`, nested editor dispatch, records, draft association, dirty state, library UI, pending confirmations, and atomic commands. | Direct browser I/O, codec internals, generated data imports, or domain-rule duplication. |
| `src/app/library-selectors.ts` | Deterministic library projection, current-catalog joins, search/filter/sort, freshness, and lightweight validation summaries. | Mutation, storage writes, migrations, full-text/fuzzy ranking, or persisted derived results. |
| `src/app/share-url.ts` | Versioned fragment parse/format, size policy, mode overlay, startup share result, and safe fragment consumption. | Template encoding, library metadata, routing, short-link services, or network calls. |
| `src/app/library-backup.ts` | Portable backup contract, download projection, bounded import, preview plan, merge/replace planning, conflict re-keying, and restore report. | Single-build exchange, remote backup, silent application, or component rendering. |
| `src/app/components/**` | Storage notice, library panel, record forms/actions, shared modal, share controls, and backup/restore UI over typed props. | Direct `localStorage`, arbitrary URL parsing, generated imports, codec calls, or rule copies. |
| `src/app/App.tsx` | Catalog-ready initialization, workspace/controller composition, autosave scheduling, share boot ordering, and accessible status/focus coordination. | Ad hoc schema casts, a second persistence format, monolithic leaf UI, or silent failures. |

`src/app/catalogs.ts` remains the only runtime generated-catalog import boundary. No production
change is planned in `src/domain/**` or `src/template-compatibility/**`. If execution proves that a
plain app-layer contract cannot preserve an existing public value, stop for an architecture
checkpoint rather than widening either framework-neutral package incidentally.

### Storage Contract

The browser key is exactly `build-wars:v1`. The `v1` suffix identifies the storage namespace; the
value also carries `kind: "build-wars-local-library"` and integer `schemaVersion: 1`, so future
schema migrations occur inside the same key. A new key is reserved for a deliberately incompatible
product namespace, not routine additive evolution.

The v1 envelope contains:

- `storage`: canonical UTC `createdAt` and `writtenAt` timestamps plus a non-negative monotonic
  `revision` used to detect a write based on a stale read;
- `catalogs`: the profession/attribute, skill, and rule-engine versions known by the writer;
- `savedBuilds`: an ordered array of independently identified `SavedBuildRecordV1` values; and
- `workingDraft`: `null` or one `WorkingDraftV1`.

Both drafts and records embed one `PersistedEditorDocumentV1` containing the complete semantic
`Build`, `pveBudget`, and `rawTemplate`. This is a whitelist projection of durable editor state, not
a serialized `EditorState`. On hydration it is merged into `createBlankEditorState()` so newly added
UI-only fields receive current defaults. The contract preserves `Build.equipment` if a future valid
`Build` already contains it, but this sprint neither creates nor interprets equipment state.

`WorkingDraftV1` adds its own `updatedAt`, nullable `associatedRecordId`, and catalog facts captured
at the write. Association is retained only if that record exists in the accepted saved array;
otherwise hydration clears the association and reports a warning without dropping the draft.

`SavedBuildRecordV1` contains:

- a bounded opaque local `id` generated independently of `Build.id`;
- a plain-text `name`, canonical `createdAt`/`updatedAt`, normalized tags, `favorite`, and nullable
  short plain-text `notes`;
- the persisted editor document; and
- catalog/rule-engine facts captured on the most recent explicit save.

Record `name` is the library display authority. Save, rename, and load maintain the invariant that
`record.name === record.document.build.name`; template wrapper name remains separately preserved in
the raw template overlay and is only an initial naming suggestion. Duplicate records copy the
document, tags, and notes, receive a new ID and timestamps, use a visible “copy” name suggestion,
and default to not favorite. Names need not be globally unique.

The parser receives `unknown`, checks the discriminator/version before descent, enforces centralized
limits for total text, record count, collection sizes, strings, tags, notes, attribute rows, and
exactly eight skill slots, and reconstructs each allowed field without spreading untrusted objects.
IDs and finite safe integers are checked before applying branded domain types. Unknown keys are
ignored during reconstruction; required or invalid fields yield typed diagnostics.

Parsing is intentionally two-level. A malformed root or unsupported future schema produces no
trusted envelope and locks persistence. A valid v1 root may recover individually valid records while
skipping an invalid draft or record with indexed diagnostics. Because rewriting that recovered
subset would silently delete rejected bytes, any partial recovery also locks automatic writes to the
original key. An explicitly confirmed restore-replace may overwrite it; no boot, autosave, or
routine record action may do so.

`migrateStorageEnvelope` is a pure sequential registry even though v1 is initially the only
supported version. Tests prove current-version identity, unsupported older/future handling, no input
mutation, post-migration validation, and a synthetic migration registration path. Backup envelope
versioning is separate so browser storage can evolve without pretending every internal field is a
portable exchange promise.

### Workspace State And Record Semantics

`WorkspaceState` wraps the existing editor rather than expanding `EditorState` with storage and
collection concerns. It contains:

- the current `EditorState`;
- accepted saved records and the current draft association;
- ephemeral library query, filters, sort, open/collapsed state, and focused record;
- persistence status (`ready`, `memory-only`, `write-blocked`, or `conflict`) and typed notices; and
- pending draft-replacement, delete, and restore confirmations.

`WorkspaceAction` delegates normal editor actions to `editorReducer`. Existing editor components
continue to receive an `EditorAction` dispatch adapter, while operations affecting more than the
editor use workspace actions. This preserves current component contracts and makes these transitions
atomic in pure tests:

- hydrate accepted records and draft or initialize a blank draft;
- start a new blank draft;
- load a saved record and set its association;
- save an unassociated draft as new;
- update the associated record without changing its ID or `createdAt`;
- save an associated draft as new and move association to the new ID;
- duplicate a library record without replacing the open draft;
- rename, tag, annotate, or favorite a record;
- delete a confirmed record, clearing only a matching association; and
- apply one already-previewed backup plan.

Dirty state is derived, never manually toggled. An associated draft is dirty when its stable durable
fingerprint differs from that record's persisted editor document. An unassociated draft is dirty
when it differs from the canonical blank document; an imported template therefore counts as work.
Loading a record or starting a new draft passes through one replacement guard with Save, Discard,
and Cancel. Template import and optional backup-draft restore reuse the same guard. A share URL at
initial navigation is considered the user's explicit input and takes precedence only after it
decodes successfully.

Save/update/save-as-new remain distinct commands and labels. Update is unavailable without a valid
association. If an associated record was deleted or cannot be found, the action safely degrades to
Save as New rather than recreating the missing ID. `crypto.randomUUID()` and the current UTC clock
are injected; tests use deterministic generators. Generated IDs are checked against all current and
already-planned restore IDs with bounded retry and a typed failure.

Tags are trimmed, bounded, compared case-insensitively, deduplicated by normalized comparison, and
stored in deterministic code-point order while retaining the first spelling. Empty tags are
discarded. Notes and names remain plain text. Updating a record preserves tags, notes, favorite, and
`createdAt` unless the corresponding explicit metadata action changes them.

Confirmation protects deletion instead of adding a time-based undo subsystem. Deleting the record
open in the editor leaves its document and raw overlay intact, clears association, and makes the next
save a new-record action. This avoids coupling recoverability to transient timers or browser reload.

### Storage Lifecycle And Failure Policy

Initialization reads the storage key once through an injected port before constructing the initial
workspace. Empty storage yields a blank, writable workspace. A valid envelope hydrates records and
the draft. A valid library with an invalid draft starts a blank draft and reports the skipped draft.
A root failure or partial recovery enters a visible memory-only/write-blocked state without calling
`removeItem` or `setItem`.

Durable editor changes schedule a 300 ms trailing autosave. The dependency is the projected editor
document plus association—not the entire `EditorState`—so search, dialog, tooltip, focus, drag, and
transient-message changes do not write. A pending draft write is flushed best-effort on `pagehide`,
but correctness does not rely on unload events. Explicit save, metadata, favorite, delete, and
restore actions cancel an older timer and request an immediate whole-envelope write so a delayed
draft snapshot cannot overwrite newer library state.

Each write serializes one complete next envelope, reads the current revision, and writes only if it
matches the revision last accepted by this workspace. A mismatch enters `conflict` and preserves the
session in memory; it does not attempt cross-tab merging. This is loss prevention, not cross-tab
conflict resolution. Users are told to back up or reload before retrying. Successful writes increment
revision once and update `writtenAt`; failed writes do not claim durability.

Access exceptions, disabled storage, `SecurityError`, quota errors, serialization errors, revision
conflicts, and unknown exceptions are normalized to bounded app error codes. No browser exception,
raw payload, full template, or stack is rendered or logged. After a write failure, edits and library
actions continue in memory, the app stops automatic retry loops, and an explicit Retry action may
attempt the latest envelope when doing so cannot overwrite corrupt or conflicting data.

The status notice distinguishes “saved locally,” “autosave pending,” and “memory only” without
promising disk durability. Local storage is browser-profile storage, not a durable backup; private
mode, eviction, user clearing, and multiple tabs remain documented limitations. Whole-library export
is the recovery mechanism.

### Library Projection, Freshness, And Validation

Library filtering and sorting are pure selectors over records plus current catalog views. The
pipeline is fixed:

1. trim and case-fold the query; match the record name, current resolved skill names, and preserved
   raw overlay labels, but not notes or validation prose;
2. apply an optional profession filter to either primary or secondary profession;
3. apply exact mode, favorite-only, and exact normalized-tag filters;
4. sort by updated time descending by default, name ascending, or profession-pair label ascending;
   and
5. break every tie by normalized record name and then opaque local ID using a code-point comparator,
   never locale or input-array accident.

The selector returns component-ready rows with record name, profession pair, mode, updated date,
favorite, tags, association/dirty state, freshness, and a lightweight validation summary. Missing
catalog records use preserved IDs/labels and do not remove the row. Query/filter/sort state is not
persisted. Folders, fuzzy relevance, backend search, and virtualized infrastructure remain deferred;
the localStorage size ceiling keeps v1 bounded, and a measured list-performance problem must justify
later virtualization.

Catalog facts are explicit triples: profession/attribute catalog version, skills catalog version,
and rule-engine version. Freshness is `current` only when all stored non-null facts match the current
values, `stale` when a known value differs, and `unknown` when required facts are absent. Freshness is
not validity. Each draft/record is validated against the current catalogs using its persisted PvE
budget inputs; the UI keeps `valid`, `complete`, `resolved`, and `exhaustive` distinct and never
persists validation issue prose as authoritative data.

Loading or viewing a stale record does not update its “saved with” versions. An explicit update or
save-as-new captures current facts. Validation never rewrites profession, attribute, skill, raw
overlay, or source-envelope fields and never substitutes a current skill for a stale ID. Historical
date-aware validation, revision comparison, and replacement recommendations remain EPIC-21 work.

### Share Format And Startup Ordering

The single-build share format is a same-origin fragment:

```text
#bw-share=v1&template=<percent-encoded-template-output>&mode=<pve-or-pvp>
```

`template` is the complete output of the existing EPIC-08 export workflow: exact-source when the
current fields still match an imported source, otherwise proven canonical. The optional `mode` is
included only for `pve` or `pvp`; `unknown` is omitted because the skill template itself carries no
mode. A wrapper name may travel only as part of valid template output. Local ID, association, tags,
favorite, notes, timestamps, catalog versions, validation results, equipment, party, guide, and
backup fields never enter the fragment.

The full absolute URL must not exceed `MAX_SHARE_URL_LENGTH = 1800` characters. This conservative
cap is centralized and tested at the exact boundary. Link creation never offers a lossy projection:
if neither exact-source nor proven canonical output exists, or if the URL exceeds the cap, the UI
shows the existing export reasons and keeps any available template text selectable with explicit
copy. It does not upload, shorten, compress, or substitute single-build JSON.

On boot, the app first hydrates storage so saved records remain available, then parses only a
fragment with the exact `bw-share=v1` discriminator. Unknown fragments are ignored. A valid share is
decoded and resolved through `importSkillTemplateToEditor`, its valid mode overlay is applied, and
the result atomically replaces only the working draft with `associatedRecordId: null`. It is then
eligible for ordinary draft autosave but is not inserted into the saved array.

After successful import, `history.replaceState` removes the consumed share fragment without adding
history so refresh cannot repeatedly overwrite edits and the code is not retained in the address
bar. A malformed, unsupported, oversized, or unrepresentable fragment leaves the hydrated draft and
URL untouched and presents a typed error. Share creation itself does not mutate browser history.
Hash fragments reduce routine server/referrer exposure but are still visible to browser history,
extensions, screenshots, and anyone receiving the URL; the UI labels links accordingly.

Sharing a library row does not first load it into the editor. The record's persisted document is
rehydrated into transient default UI state, validated against current catalogs, and passed through
the same export/share policy as the current draft. There is one policy implementation for draft and
record sharing.

### Backup And Restore Contract

Backup JSON has its own discriminator `kind: "build-wars-library-backup"` and `schemaVersion: 1`.
It contains `exportedAt`, source storage/catalog facts, all accepted saved records, and an optional
working draft. It is produced from reconstructed trusted values rather than copying raw
`localStorage` text. Fields are data-only JSON; names, tags, notes, and template names remain
untrusted plain text and never acquire HTML or executable semantics.

Export is an explicit user action. The app serializes deterministically with readable indentation,
creates an `application/json` Blob, suggests a bounded date-based filename, triggers one download,
and revokes the object URL. If browser download support fails, the JSON remains selectable through a
bounded fallback rather than being sent elsewhere.

Import accepts only a user-selected local file, rejects files above a centralized 16 MiB byte cap
before reading, catches file/JSON errors, checks the backup discriminator/version, and reuses saved
record/draft validators. The parser caps diagnostics and record processing. It never renders a file
as HTML, executes content, resolves URLs from it, follows paths, fetches media, or logs the payload.

A successful parse creates an immutable `RestorePlan` before any state or storage change. The
preview reports source version/time, valid and skipped record counts, duplicate incoming IDs,
collisions with the current library, generated replacement-ID count, projected merge/replace count,
whether a valid draft is present, and bounded reasons for every skip. IDs for collisions are
generated and reserved at preview time so confirmation applies exactly the plan that was reviewed.
If the current library revision changes while the preview is open, confirmation is disabled until a
new plan is built.

Restore semantics are explicit:

- **Merge** retains every current record, imports each valid incoming record, preserves its ID when
  unused, and gives every collision a new local ID. Equal content does not imply identity or
  deduplication.
- **Replace library** substitutes the valid incoming saved-record array only after destructive
  confirmation. If the backup declares records but none are valid, replace is disabled to prevent a
  malformed file from becoming an accidental wipe.
- **Restore working draft** is a separate unchecked choice in either mode. When selected, a valid
  incoming draft replaces the current draft through the normal replacement guard; absence or
  invalidity never silently blanks the current draft.

Applying a plan is one workspace transition and one envelope write attempt. Invalid records remain
in the report but never enter state. A storage write failure leaves the applied result available in
memory with a prominent non-durable warning and leaves the previous on-disk envelope intact. The
final report distinguishes imported, re-keyed, skipped, and draft-restored outcomes without exposing
raw rejected content.

### UI Composition And Accessibility

The wide layout adds a compact library `<aside>` to the existing editor workspace. At intermediate
and narrow widths it becomes an explicitly toggled in-flow panel or modal surface using the shared
focus-managed dialog primitive; it does not become a route or hover-only drawer. The open/closed
preference is ephemeral so stale layout state is not persisted across changed viewport sizes.

The library includes query, filters, sort, result count, new/save/update/save-as-new actions, record
rows, and a details/action region for metadata, share, duplicate, and delete. The associated record
and unsaved state are labeled independently. Empty library, no-result, stale, unresolved, storage
warning, preview, restore report, and memory-only states have explicit accessible copy.

Extract the current modal implementation from `TemplateDialogs.tsx` into a reusable component before
adding save, replacement, delete, share, and restore dialogs. Each dialog has a unique label ID,
initial focus, contained Tab order, Escape/cancel, focus restoration, bounded viewport overflow, and
safe behavior if its trigger disappears after deletion. Destructive confirmations name the exact
record or operation and keep Cancel as the least surprising initial action.

Library list actions are real buttons with programmatic names; favorite state uses pressed-state
semantics; filters use associated labels; restore mode is not communicated by color alone; live
regions announce save/write/restore outcomes without reading long record contents. Keyboard users
can open the library, traverse records, load/share/manage a record, close the narrow layout, and
return focus predictably.

## Implementation

### Phase 1: BW-0901 Versioned Storage Schema And Browser Port (~17% of effort)

**Goal:** Establish the lossless, testable persistence contract and failure boundary before any UI
or autosave path can write user data.

**Files:**

- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/local-storage.ts`
- `src/app/local-storage.test.ts`
- `src/app/editor-state.ts`

**Tasks:**

- [ ] Define the v1 storage, catalog-version, persisted-editor, working-draft, and saved-record
      contracts described above under the exact `build-wars:v1` key.
- [ ] Add whitelist projection/hydration helpers that preserve the semantic `Build`, PvE budget, raw
      overlay/source, exact eight slots, ordered attributes, and existing equipment value while
      resetting every UI-only editor field.
- [ ] Centralize bounds for payload text, record count, strings, tags, notes, arrays, IDs, integers,
      timestamps, diagnostics, and migration steps. Reject non-finite/unsafe values and prototype
      keys without recursively spreading unknown input.
- [ ] Implement root validation plus record-level recovery, association repair, typed bounded
      diagnostics, deterministic serialization, and stable durable fingerprints.
- [ ] Add a pure migration registry with current-version identity, unsupported-version handling,
      post-migration validation, and no mutation. Do not invent a fake production legacy shape.
- [ ] Add the injectable storage port with exact-key read, expected-revision write, exception
      normalization, and no `removeItem` behavior.
- [ ] Lock writes after root corruption, unsupported version, partial recovery, or revision conflict;
      keep accepted data usable in memory and require an explicit replacement/recovery action.
- [ ] Test round trips for blank, playable, incomplete, and unresolved-import documents; wrapper
      null/empty/named source state; stale IDs; association; duplicates; metadata; future/older
      versions; malformed JSON; invalid records/draft; quota/security exceptions; revision mismatch;
      deterministic output; and frozen-input no-mutation.

**Verification:**

- `npm run test:run -- src/app/persistence-schema.test.ts src/app/local-storage.test.ts`
- `npm run typecheck`
- `npm run format:check`

**Phase Gate:** One bounded envelope can losslessly round-trip all EPIC-08 durable state, and no
corrupt, unsupported, or concurrently changed storage value can be silently erased or overwritten.

### Phase 2: BW-0902 Workspace Hydration And Draft Autosave (~11% of effort)

**Goal:** Restore and continuously preserve one working draft without turning it into a saved record
or persisting transient UI behavior.

**Files:**

- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/components/StorageNotice.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Compose `WorkspaceState` around the existing editor, records, association, UI, persistence
      status, and pending confirmations; adapt `EditorAction` dispatch without rewriting existing
      leaf reducers.
- [ ] Hydrate once from empty, valid, invalid-draft, partially recovered, corrupt, unsupported, and
      unavailable storage outcomes. Merge durable editor data with current UI defaults.
- [ ] Implement the 300 ms durable-projection autosave and best-effort `pagehide` flush. Prove UI-only
      actions do not schedule writes and older timers cannot overwrite immediate operations.
- [ ] Keep the draft separate from `savedBuilds` through every edit, reload, and failure path.
- [ ] Surface accessible pending/saved/memory-only/corrupt/quota/conflict notices with explicit Retry
      only where retry cannot overwrite protected data.
- [ ] Preserve raw overlays, source envelopes, template names, unresolved IDs, mode, budget inputs,
      ordered attributes, and eight slots across actual serialize/hydrate cycles.
- [ ] Test with fake timers and injected ports, including rapid edits, UI-only actions, Strict Mode
      effect behavior, refresh reconstruction, failure followed by continued edits, pagehide flush,
      and invalid draft fallback.

**Verification:**

- `npm run test:run -- src/app/workspace-state.test.ts src/app/App.test.tsx`
- `npm run typecheck`
- Manual reload check with a partial build and an unresolved imported template

**Phase Gate:** The latest durable draft survives reload without entering the library, transient UI
state resets safely, and every storage failure leaves an operable, honestly labeled in-memory editor.

### Phase 3: BW-0903 Saved Record Lifecycle And Draft Association (~17% of effort)

**Goal:** Make every saved-record mutation explicit, identity-safe, and recoverable without
overwriting a different record or discarding the open draft.

**Files:**

- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/components/SaveBuildDialog.tsx`
- `src/app/components/LibraryRecordActions.tsx`
- `src/app/components/Modal.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/App.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Add explicit New Draft, Save as New, Update Saved Build, and Save as New Copy commands with
      independent record IDs, injected time/ID generation, association rules, and immediate writes.
- [ ] Maintain name/document equality, stable `createdAt`, changed `updatedAt`, current catalog facts,
      and metadata preservation on update.
- [ ] Add duplicate, rename, tag, short-note, and favorite actions with normalized tags, bounded
      inputs, deterministic results, and duplicate-content support.
- [ ] Duplicate into a new non-favorite record without loading it or changing current association;
      do not deduplicate by build content, `Build.id`, code, name, or fingerprint.
- [ ] Add confirmation-based delete. If the deleted ID is associated, retain the complete open draft
      and clear only association.
- [ ] Derive dirty state from durable fingerprints and add the shared Save/Discard/Cancel replacement
      guard for New Draft, record load, template import, and restored-draft application.
- [ ] Extract and harden the shared modal primitive before adding dialogs; preserve current template
      dialog focus/Escape/overflow behavior.
- [ ] Test ID/timestamp invariants, duplicate names/content, update versus fork, missing association,
      metadata normalization, delete cancel/confirm, associated deletion, dirty/clean/reverted state,
      every replacement choice, focus return, and immediate-write failure.

**Verification:**

- `npm run test:run -- src/app/workspace-state.test.ts src/app/template-dialogs.test.tsx src/app/App.test.tsx`
- `npm run typecheck`
- Manual keyboard walkthrough for save, fork, metadata edit, duplicate, load guard, and delete

**Phase Gate:** A user always knows whether an action updates an ID, creates a new ID, or replaces the
draft, and no record action silently destroys an open document or unresolved template evidence.

### Phase 4: BW-0904 Library Panel, Deterministic Discovery, And Responsive Access (~14% of effort)

**Goal:** Expose the saved collection beside the editor with predictable discovery and full keyboard
and narrow-screen access.

**Files:**

- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/components/LibraryPanel.tsx`
- `src/app/components/LibraryRecordActions.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Implement the fixed query/filter/sort pipeline for build and skill names, either profession,
      exact mode, favorite, tag, updated time, name, and profession pair with stable tie-breakers.
- [ ] Join current catalog names without hiding stale IDs; include raw overlay labels for unresolved
      search and return component-ready profession/mode/freshness/validation summaries.
- [ ] Add the wide-screen library aside with count, query, filters, sort, new/save actions, active and
      dirty labels, compact rows, metadata details, and record management controls.
- [ ] Add explicit empty-library and no-result states. Clear Filters must not delete records or reset
      editor/browser filters.
- [ ] Provide an accessible in-flow or modal toggle at narrower widths, predictable trigger focus
      return, scroll containment, and no dependence on hover, drag, fixed screenshot dimensions, or
      routing.
- [ ] Keep all library UI preferences ephemeral and all mutations routed through workspace actions;
      components must not touch storage, catalogs, or template codecs directly.
- [ ] Test every filter independently and in combination, case/tag normalization, raw/resolved skill
      queries, all sorts and ties, stale records, duplicate names, active/dirty labels, no results,
      narrow-panel open/close, and keyboard actions.

**Verification:**

- `npm run test:run -- src/app/library-selectors.test.ts src/app/App.test.tsx`
- `npm run typecheck`
- Manual wide, intermediate, and narrow viewport walkthrough with keyboard-only library management

**Phase Gate:** Every saved record remains reachable through deterministic controls, selecting one
preserves its full durable document, and library access does not break or route away from the editor.

### Phase 5: BW-0905 Template-Code Sharing And Share URLs (~14% of effort)

**Goal:** Reuse the proven template workflow for accountless single-build links without creating a
second build format or weakening fidelity policy.

**Files:**

- `src/app/share-url.ts`
- `src/app/share-url.test.ts`
- `src/app/template-workflow.ts`
- `src/app/components/ShareControls.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/components/LibraryRecordActions.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Implement exact versioned fragment format/parse helpers, recognized-key filtering, optional
      PvE/PvP mode, deterministic parameter order, and the 1,800-character full-URL cap.
- [ ] Build links only from an available exact-source or proven canonical EPIC-08 export. Keep
      validation, projection, encode, and decode-back gates centralized in the existing workflow.
- [ ] Add current-draft and row-level Share actions with a selectable URL, explicit best-effort copy,
      privacy explanation, and template-text fallback for blocked or oversized links.
- [ ] Hydrate storage before share parsing; transactionally import a valid share into an unassociated
      draft, apply only a valid mode, preserve raw template outcomes, and never append a saved record.
- [ ] Consume only a successfully applied share fragment with `history.replaceState`; leave invalid
      and unknown fragments untouched and never push navigation history.
- [ ] Route manual template imports through the same draft replacement guard while preserving the
      existing atomic failure and exact/canonical behavior.
- [ ] Test boundary lengths, reserved characters, Unicode wrapper names, duplicate/unknown keys,
      unknown versions, invalid mode/code, exact unresolved imports, canonical edits, lossy/blocked
      export, stored-draft precedence, fragment consumption, reload-after-edit, row sharing, copy
      denial, and absence of metadata in links.

**Verification:**

- `npm run test:run -- src/app/share-url.test.ts src/app/template-workflow.test.ts src/app/template-dialogs.test.tsx src/app/App.test.tsx`
- `npm run test:run -- test/template-compatibility/skill-template.test.ts test/template-compatibility/catalog-resolution.test.ts`
- `npm run typecheck`
- Manual open/copy/reload check for a valid link plus blocked and oversized fallbacks

**Phase Gate:** A share URL represents only a fidelity-proven single build, opens into an unsaved
working draft exactly once, and never sends build or library data to a backend.

### Phase 6: BW-0906 Whole-Library Backup, Preview, And Restore (~16% of effort)

**Goal:** Provide a portable recovery path whose destructive effects are completely visible before
one atomic application.

**Files:**

- `src/app/library-backup.ts`
- `src/app/library-backup.test.ts`
- `src/app/components/BackupRestoreDialog.tsx`
- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Define the independent v1 backup envelope and deterministic trusted projection for all saved
      records plus an optional working draft, export/storage timestamps, and catalog facts.
- [ ] Add explicit JSON Blob download, bounded safe filename, object-URL revocation, and selectable
      fallback without filesystem APIs, remote upload, compression, or encryption.
- [ ] Bound file bytes and parser work; validate root/version, recover valid records individually,
      cap diagnostics, and treat every textual value as plain data.
- [ ] Build a stable restore preview with accepted/skipped records, duplicate and current-ID
      collisions, reserved new IDs, projected result count, draft availability, and bounded reasons.
- [ ] Implement merge as append-with-re-key on every collision and replace as explicit saved-array
      substitution. Disable replace when a declared nonempty backup yields no valid records.
- [ ] Keep Restore Working Draft separately unchecked and route it through the draft replacement
      guard. Do not clear the current draft merely because a backup omits or rejects one.
- [ ] Invalidate the preview if current revision changes, apply the confirmed plan once, attempt one
      whole-envelope write, and report imported/re-keyed/skipped/draft outcomes distinctly from
      durability status.
- [ ] Test round-trip recovery; optional/no draft; merge and replace; identical-content records;
      duplicate incoming IDs; ID-generation exhaustion; invalid/unsupported/oversized files;
      mixed valid/invalid records; stale preview; cancel; write failure; HTML-like plain text; and
      exact raw-overlay/source preservation.

**Verification:**

- `npm run test:run -- src/app/library-backup.test.ts src/app/workspace-state.test.ts src/app/App.test.tsx`
- `npm run typecheck`
- Manual export, merge-preview, replace-preview, cancel, invalid-file, and offline restore walkthrough

**Phase Gate:** A backup produced by the app can recover valid library records without silent
overwrite, every skipped or re-keyed item is reported, and the working draft changes only by explicit
choice.

### Phase 7: BW-0907 Freshness, Integration, Documentation, And Closeout (~11% of effort)

**Goal:** Prove all persistence and sharing invariants against current catalogs, document durable
formats and limits, and close EPIC-09 without absorbing later local-first systems.

**Files:**

- `src/app/library-selectors.ts`
- `src/app/editor-selectors.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`
- `src/app/*.test.ts(x)`
- `compendium/local-library-and-sharing.md`
- `compendium/core-build-editor.md`
- `compendium/README.md`
- `README.md`
- `work/tickets/09-local-library-and-sharing/*.md`
- `work/sprints/SPRINT-010.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-09-result.json`

**Tasks:**

- [ ] Finalize current/stale/unknown freshness from stored profession/attribute, skill, and
      rule-engine versions without conflating it with validation status.
- [ ] Validate hydrated drafts and record projections against current catalogs and their persisted
      budget inputs; retain all IDs/raw overlays and keep `valid`, `complete`, `resolved`, and
      `exhaustive` independently visible.
- [ ] Add integrated tests spanning edit-autosave-refresh, import-save-update-fork, dirty load guard,
      duplicate/delete, search/filter/sort, stale load, share landing, backup/merge/replace, corrupt
      storage, quota failure, conflict detection, and narrow-screen library access.
- [ ] Confirm no persisted validation prose becomes authority, no current validation silently updates
      “saved with” facts, and only an explicit record save captures new catalog versions.
- [ ] Add `compendium/local-library-and-sharing.md` with the storage key/schema, durable projection,
      association semantics, failures/recovery, share fragment and 1,800-character cap, backup format,
      restore rules, freshness meaning, multi-tab limitation, and deferred work.
- [ ] Update `compendium/core-build-editor.md`, `compendium/README.md`, and `README.md` so persistence
      and sharing are current scope rather than EPIC-09 deferrals.
- [ ] Run architecture scans and baseline-aware protected-path review. Do not change domain,
      template-compatibility, generated/QA/snapshot/data-tool, prior-art, dependency, manifest, or
      build-configuration files without an explicit recorded checkpoint.
- [ ] During execution, mark BW-0901 through BW-0907, EPIC-09, SPRINT-010, and the ledger complete
      only after all phase gates and Definition of Done checks pass. Write the required result
      manifest and do not commit.

**Verification:**

- `npm run test:run -- src/app`
- `npm run format:check`
- `npm run typecheck`
- `npm run build`
- `npm run verify`
- `rg -n 'data/generated/' src/app`
- `rg -n '(localStorage|sessionStorage|indexedDB|window\.|document\.|location\.|history\.|Blob|File)' src/domain src/template-compatibility`
- `rg -n '(data/qa|data/source-snapshots|scripts/data|api\.php|wiki\.guildwars)' src/app`
- Baseline-aware protected-path and dependency diff review
- Manual normal/private-storage, reload, wide/narrow, keyboard, share, backup, and restore walkthrough

**Phase Gate:** Current and stale builds remain visible and validated without mutation, all recovery
and sharing policies are documented and tested, `npm run verify` passes, and sprint/ticket/ledger/run
records agree without unapproved scope changes.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `src/app/persistence-schema.ts` | Create | Versioned storage contracts, bounds, safe reconstruction, durable projection/hydration, migration registry, serialization, fingerprints, and recovery diagnostics. |
| `src/app/local-storage.ts` | Create | Exact-key browser storage port, expected-revision writes, injected test adapter, and bounded failure normalization. |
| `src/app/workspace-state.ts` | Create | Workspace reducer, editor delegation, records, association, dirty/replacement semantics, persistence status, and atomic record/restore operations. |
| `src/app/library-selectors.ts` | Create | Deterministic library search/filter/sort, catalog joins, freshness, and validation summaries. |
| `src/app/share-url.ts` | Create | Versioned share-fragment parse/format, size cap, mode overlay, and consumption policy. |
| `src/app/library-backup.ts` | Create | Portable backup projection/parser, preview planning, merge/replace conflict handling, and restore reports. |
| `src/app/editor-state.ts` | Modify | Add only durable editor actions/helpers needed for build naming and safe hydration while retaining EPIC-08 invariants. |
| `src/app/editor-selectors.ts` | Modify | Reuse current-catalog validation inputs/views for persisted draft and library projections without duplicating rule policy. |
| `src/app/template-workflow.ts` | Modify | Expose shared state reconstruction/export inputs needed by record sharing; retain the existing codec and fidelity boundary. |
| `src/app/components/Modal.tsx` | Create | Reusable accessible modal behavior extracted from template dialogs. |
| `src/app/components/StorageNotice.tsx` | Create | Honest autosave, memory-only, corrupt, quota, and conflict status with safe recovery actions. |
| `src/app/components/LibraryPanel.tsx` | Create | Responsive library discovery, record list, selection, active/dirty state, and narrow-screen access. |
| `src/app/components/LibraryRecordActions.tsx` | Create | Rename, tag, note, favorite, duplicate, share, and delete controls over workspace actions. |
| `src/app/components/SaveBuildDialog.tsx` | Create | Explicit save-new, update, fork, naming, metadata, and draft-replacement choices. |
| `src/app/components/ShareControls.tsx` | Create | Share link result, copy behavior, privacy note, and template-text fallback. |
| `src/app/components/BackupRestoreDialog.tsx` | Create | Backup download, file selection, restore preview, mode/draft choices, confirmation, and bounded report. |
| `src/app/components/TemplateDialogs.tsx` | Modify | Use the shared modal and workspace replacement guard while preserving EPIC-08 import/export behavior. |
| `src/app/App.tsx` | Modify | Initialize and compose catalogs, workspace, storage lifecycle, autosave, startup share import, library, and live status. |
| `src/app/styles.css` | Modify | Wide library rail, narrow disclosure/modal, notices, record states, dialogs, previews, reports, focus, and overflow behavior. |
| `src/app/App.test.tsx` | Modify | Add integrated persistence, record, library, share, backup/restore, failure, and responsive-access scenarios. |
| `src/app/persistence-schema.test.ts` | Create | Schema, migration, recovery, bounds, round-trip, and no-mutation coverage. |
| `src/app/local-storage.test.ts` | Create | Key, revision, unavailable/quota/security/conflict, and write-lock coverage. |
| `src/app/workspace-state.test.ts` | Create | Association, dirty guard, record actions, atomic restore, and persistence-status coverage. |
| `src/app/library-selectors.test.ts` | Create | Deterministic query/filter/sort, stale/unresolved joins, and validation-summary coverage. |
| `src/app/share-url.test.ts` | Create | Fragment grammar, cap, fidelity inputs, startup ordering, consumption, and metadata-exclusion coverage. |
| `src/app/library-backup.test.ts` | Create | Backup round trip, preview, merge/replace, re-key, skip, stale-plan, and failure coverage. |
| `compendium/local-library-and-sharing.md` | Create during execution | Durable storage, library, sharing, backup/restore, freshness, recovery, and deferral reference. |
| `compendium/core-build-editor.md` | Modify during execution | Replace ephemeral/deferred statements with the persisted workspace handoff. |
| `compendium/README.md` | Modify during execution | Link the local library and sharing note. |
| `README.md` | Modify during execution | Move local storage/sharing into current scope and document user-visible limits. |
| `src/domain/**` | Read only by default | Existing semantic build and validation authority. |
| `src/template-compatibility/**` | Read only by default | Existing template decode/resolve/export and fidelity authority. |
| `data/generated/**`, `data/qa/**`, `data/source-snapshots/**`, `scripts/data/**` | Read only | Existing catalog/data inputs and protected non-runtime artifacts. |
| `work/tickets/09-local-library-and-sharing/*.md` | Modify during execution | Record sprint linkage and completion evidence after corresponding gates pass. |
| `work/sprints/SPRINT-010.md` | Create/modify during execution | Executable sprint and checked closeout record. |
| `work/sprints/ledger.tsv` | Modify during execution | Keep SPRINT-010 lifecycle consistent with sprint status. |
| `work/sprints/drafts/SPRINT-010-*.md` | Create during planning | Intent, independent drafts, critiques, and merge notes. |
| `work/runs/ticket-burn/BACKLOG/20260902T192541Z/plan-EPIC-09-result.json` | Write by outer run | Required non-interactive planning result manifest. |

No package dependency, generated artifact, manifest, QA report, source snapshot, ingestion module,
domain contract, template-codec implementation, route, backend client, service worker, IndexedDB
schema, analytics hook, remote media asset, or single-build JSON exchange format is added.

## Definition of Done

### Storage Contract And Failure Safety

- [ ] Browser persistence uses exactly one namespaced `build-wars:v1` key and one discriminated v1
      storage envelope with timestamps, revision, catalog facts, records, and nullable draft.
- [ ] Persisted editor documents preserve the full semantic `Build`, PvE budget, and raw template
      overlay/source together; exact-replay and unresolved-ID fixtures survive JSON round trips.
- [ ] UI-only editor and library state is never persisted and hydrates from current defaults.
- [ ] Runtime parsing reconstructs whitelisted fields from `unknown`, applies centralized bounds,
      rejects invalid numeric/collection shapes, and never trusts a TypeScript cast as validation.
- [ ] The pure migration registry, current-version path, unsupported older/future versions,
      post-migration validation, and input immutability are tested.
- [ ] Corrupt or unsupported storage is never removed or overwritten automatically. Partial recovery
      reports rejected data and locks writes to the original key.
- [ ] Storage unavailable, security denial, quota exhaustion, serialization failure, and revision
      conflict leave the editor usable in memory with accurate non-durable status and no retry loop.
- [ ] Expected-revision writes prevent a stale tab from silently overwriting a newer envelope;
      cross-tab merge remains explicitly unsupported.

### Working Draft And Saved Records

- [ ] A partially edited or imported draft survives reload with mode, budget, ordered attributes,
      exactly eight slots, source envelope, raw IDs, wrapper state, and association intact.
- [ ] Draft autosave is separate from `savedBuilds`, coalesces durable changes, ignores transient/UI
      changes, and cannot race an older timer over a newer explicit operation.
- [ ] Save as New always creates a unique local ID; Update targets only the associated ID; Save as
      New Copy creates and associates a different ID; equal contents and names remain allowed.
- [ ] Local record identity never depends on `Build.id`, build equality, template IDs/codes,
      fingerprints, or wrapper names.
- [ ] Record names, document build names, timestamps, tags, notes, favorite state, current catalog
      facts, and association obey the documented invariants across reload.
- [ ] Rename, tag, note, favorite, duplicate, and delete operations are explicit, bounded,
      deterministic, and covered for immediate-write failures.
- [ ] Duplicate creates a new non-favorite ID without replacing the open draft or deduplicating
      content.
- [ ] Delete requires confirmation. Deleting the associated record preserves the open document/raw
      overlay and clears only association.
- [ ] Dirty state is fingerprint-derived and reversion-aware; New Draft, record load, template
      import, and draft restore share Save/Discard/Cancel protection where applicable.

### Library, Freshness, And Validation

- [ ] Search matches normalized build names plus resolved and preserved raw skill names; it does not
      silently search notes, errors, or hidden metadata.
- [ ] Either-profession, mode, favorite, and tag filters combine predictably, and updated/name/pair
      sorts have stable code-point tie-breaking through local ID.
- [ ] Empty library, no result, active record, dirty draft, duplicate name, stale, unresolved, and
      memory-only states remain distinct and accessible.
- [ ] Loading a record reconstructs the full persisted editor document and never loses raw overlay
      alignment or unresolved IDs.
- [ ] Wide and narrow library layouts support keyboard-only find, load, save, manage, share, and
      close flows with visible focus and predictable return.
- [ ] Current/stale/unknown compares stored profession/attribute, skill, and rule-engine versions;
      freshness is not presented as build validity.
- [ ] Drafts and records validate against current catalogs with their stored budget inputs while
      `valid`, `complete`, `resolved`, and `exhaustive` remain separate.
- [ ] Loading or validating stale data never replaces IDs, mutates raw source facts, or overwrites
      the record's “saved with” versions.

### Template Sharing And URL Behavior

- [ ] Single-build sharing uses only the EPIC-08 skill-template export policy; no single-build JSON,
      hidden catalog-ID encoder, or weaker codec path exists.
- [ ] A link is created only from exact-source or proven canonical output and is rejected when the
      full URL exceeds 1,800 characters.
- [ ] Share fragments contain only the versioned discriminator, template output, and optional
      representable PvE/PvP mode; library IDs, metadata, validation, backup, equipment, party, and
      guide fields are absent.
- [ ] Blocked, lossy, or oversized link creation leaves typed reasons and selectable template output
      where available; clipboard denial never removes the fallback.
- [ ] A valid startup share is imported through existing decode/resolve behavior into an
      unassociated working draft after library hydration and never auto-saves a library record.
- [ ] Only a successfully applied recognized fragment is consumed; invalid/unknown fragments leave
      the stored draft and URL unchanged.
- [ ] Successful fragment consumption prevents refresh from reapplying the original link over later
      autosaved edits and does not add browser history.
- [ ] Sharing a saved row and sharing the draft use the same validation/export/link policy.

### Backup, Restore, Security, And Closeout

- [ ] Backup export uses the separate versioned portable envelope, contains all accepted records and
      optional draft, and round-trips semantic/raw/template/metadata/version facts.
- [ ] Backup JSON defines only inert data fields; it contains no HTML document, executable content,
      remote media bytes, screenshots, generated audits, source snapshots, or code to evaluate.
- [ ] Export is explicit, local, and offline; object URLs are revoked and failure leaves a selectable
      fallback.
- [ ] Restore rejects oversized, malformed, and unsupported roots; skips invalid records with
      bounded reasons; and never executes, fetches, navigates, or renders imported content as HTML.
- [ ] Preview accurately fixes accepted/skipped/collision/re-key/projected counts and becomes stale if
      current revision changes before confirmation.
- [ ] Merge preserves current records and re-keys every ID collision. Replace requires destructive
      confirmation and cannot wipe a nonempty library from a declared-nonempty, all-invalid backup.
- [ ] Restoring a working draft is separately opt-in and never blanks the current draft because a
      backup omitted or rejected one.
- [ ] A confirmed restore applies once, reports imported/re-keyed/skipped/draft results, and reports
      storage durability separately from in-memory success.
- [ ] Modals, notices, lists, controls, live regions, focus restoration, long strings, and overflow
      remain accessible at desktop and narrow widths.
- [ ] `compendium/local-library-and-sharing.md`, `compendium/core-build-editor.md`,
      `compendium/README.md`, and `README.md` accurately document shipped behavior, limits, recovery,
      and later-epic boundaries.
- [ ] Architecture scans and baseline-aware review confirm no unapproved domain, compatibility,
      generated/QA/snapshot/data-tool, prior-art, dependency, manifest, or build-config changes.
- [ ] `npm run verify` passes. If it cannot pass, exact evidence is recorded and the sprint is not
      marked complete.
- [ ] BW-0901 through BW-0907, EPIC-09, SPRINT-010, the ledger, and the required ticket-burn result
      manifest agree before completion; no commit is created by the run.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Persisting only `Build` destroys raw template identity and exact replay after reload | Medium | Critical | Make the persisted editor document an inseparable whitelist of `Build`, budget, and raw overlay/source; round-trip unresolved and exact-source fixtures at every boundary. |
| Serializing all of `EditorState` freezes transient UI details into a long-lived schema | Medium | High | Persist a named durable projection and hydrate into current defaults; assert browser/dialog/tooltip/drag/message fields are absent. |
| Schema validation silently coerces or discards corrupt user data | Medium | Critical | Parse from `unknown`, reconstruct fields, report bounded errors, lock writes after partial/root failure, and permit overwrite only through explicit restore-replace. |
| A delayed autosave overwrites a newer save, delete, or restore snapshot | Medium | Critical | Key the timer to the durable projection, cancel it before immediate commands, serialize the latest workspace once, and test fake-timer interleavings. |
| Multiple tabs overwrite each other's one-key envelope | Medium | High | Use monotonic expected revisions and fail closed to conflict/memory-only state; document that conflict merge is deferred rather than implementing an unsafe last-writer policy. |
| Synchronous JSON parse/stringify or `localStorage` blocks the UI as the library grows | Medium | High | Bound records/text, debounce draft writes, avoid persisting derived validation/UI, measure with maximum fixtures, and move to IndexedDB only under a later measured migration ticket. |
| Record identity is conflated with `Build.id`, content equality, code, or name | Medium | Critical | Keep an opaque local record ID, allow duplicates, inject collision-safe generation, and test identical content/names plus conflicting backup IDs. |
| Loading a record or import destroys unsaved work in the single draft slot | Medium | High | Derive dirty state from stable durable fingerprints and route replacements through shared Save/Discard/Cancel protection. |
| Record name diverges from `Build.name` and search/share surfaces disagree | Medium | Medium | Make record name authoritative and enforce equality on save, rename, parse, and load; keep wrapper name explicitly separate. |
| Validation/freshness updates rewrite stale IDs or erase evidence of the saved catalog | Medium | Critical | Derive current validation and freshness, preserve saved-with facts until explicit save, prohibit automatic replacement, and defer history-aware reasoning to EPIC-21. |
| Library validation recomputes expensive template export policy for every row | Medium | Medium | Build a lightweight validation/freshness selector for rows and invoke template export only for the chosen draft or share target. |
| Share links leak library-only metadata or create a second lossy build codec | Medium | Critical | Encode only existing proven template output plus optional mode, assert excluded keys, and fall back instead of inventing JSON/compression/ID encoding. |
| A share fragment reapplies on refresh and overwrites later draft edits | High | High | Consume the fragment with replace-state only after transactional success; autosave the imported unassociated draft normally afterward. |
| URL length works locally but fails in copied clients | Medium | Medium | Cap the complete absolute URL at 1,800 characters and keep selectable template text as the primary fallback. |
| Restore merge overwrites a record with the same local ID | Medium | Critical | Pre-plan every collision, reserve a new ID even for equal content, preview counts, and apply the immutable plan once. |
| Restore replace turns a malformed backup into a library wipe | Medium | Critical | Validate first, report skips, disable all-invalid declared-nonempty replace, require explicit destructive confirmation, and keep draft restoration separate. |
| Backup export cannot round-trip a value accepted by browser storage | Low | Critical | Reuse the same trusted persisted record/document validators, maintain independent envelope versioning only at the container layer, and test full round trips. |
| User text or imported JSON becomes an XSS or executable-content path | Medium | Critical | Keep values plain, render with React escaping, never parse HTML/Markdown, reject prototype keys, never eval, and never navigate/fetch URLs from storage or backup. |
| Private mode, eviction, clearing site data, or quota limits contradict “saved” UI | High | High | Use precise durability status, surface failures, document browser-profile limits, and make backup export prominent rather than claiming durable cloud storage. |
| Narrow-screen library UI hides destructive context or traps focus | Medium | High | Reuse one tested modal, show exact record/restore impact, default focus to safe controls, restore focus predictably, and perform keyboard/manual viewport checks. |
| Persistence work spreads browser APIs into framework-neutral layers | Medium | High | Keep storage/URL/file ports in `src/app`, add source scans, and require an explicit checkpoint before changing protected domain or compatibility code. |
| The sprint expands into sync, equipment, party, guide, or PWA architecture | Medium | High | Enforce the scope table, one-key/single-character contract, protected-path review, and named downstream owners; record follow-ups from evidence only. |

## Security

- Treat `localStorage`, backup files, share fragments, template input, names, tags, notes, raw overlay
  labels, timestamps, IDs, and browser exception text as untrusted input.
- Parse JSON from `unknown`, reject dangerous prototype keys, reconstruct a whitelist, require finite
  safe numbers, bound all strings/collections/diagnostics, and never use `eval`, dynamic code,
  executable URLs, HTML parsing, Markdown rendering, or `dangerouslySetInnerHTML`.
- Preserve the template-compatibility layer's existing input/name/code/attribute/slot limits. Share
  parsing must not add a second weaker path around `decodeSkillTemplate`.
- Never display raw stored/backup payloads, exception stacks, vendor objects, dependency internals,
  local filesystem paths, or full rejected template codes in warnings or reports.
- Do not automatically delete or rewrite corrupt/unsupported storage. An explicit confirmed replace
  is the only app action allowed to overwrite a protected value.
- Local IDs prevent accidental identity collision; they are not authentication, authorization,
  secrecy, or globally trusted identifiers. Validate uniqueness on every local merge.
- A share fragment is user-distributed public data. Using a fragment reduces normal HTTP request and
  referrer exposure but does not protect against browser history, extensions, screen capture,
  clipboard access, recipient forwarding, or maliciously modified links.
- Construct share URLs with `URL`/`URLSearchParams`, accept only the exact discriminator and allowed
  mode values, keep the current origin/path, and never navigate, fetch, shorten, preview remotely, or
  resolve arbitrary URLs from share content.
- Clipboard writes and file downloads happen only after explicit user actions. Clipboard reads are
  never automatic. Copy/download failure retains a visible selectable fallback.
- Check backup file size before reading, cap JSON traversal and diagnostics, accept data rather than
  paths, and never execute, import as a module, render as HTML, or fetch references from backup
  content.
- Backup Blob URLs are short-lived and revoked. Suggested filenames use only fixed ASCII prefix and
  validated UTC date facts, never a user-controlled build name or input path.
- User text that resembles HTML remains inert plain text in JSON and React. The schema contains no
  HTML, script, style, binary media, screenshot, audit artifact, source snapshot, or remote-fetch
  field.
- Do not persist library searches, validation issue prose, transient errors, clipboard contents,
  focus state, dialog text unrelated to the draft, or hidden browser metadata.
- Keep all operation local and offline. Add no analytics, telemetry, crash payload upload, network
  recovery, remote icons, backend API, auth token, cookie, service worker, or sync client.
- Source attribution remains before catalog-backed facts, and existing remote media metadata never
  becomes an `img`, CSS, preload, canvas, service worker, or fetch source.

## Dependencies

- `SPRINT-001` / EPIC-00 provides the React/Vite/TypeScript/Vitest shell, strict checks, accessible
  baseline, and canonical `npm run verify` command.
- `SPRINT-002` / EPIC-01 provides source-policy, attribution, privacy, media, and release boundaries.
- `SPRINT-004` / EPIC-03 provides the promoted profession/attribute catalog, template crosswalks,
  budget facts, and catalog version.
- `SPRINT-005` / EPIC-04 provides the promoted skills catalog, names and searchable classifications,
  dispositions, structured facts, template mappings, and catalog version.
- `SPRINT-006` / EPIC-05 provides bounded bare/chat-wrapper parsing, raw template documents, source
  envelopes, exact replay, canonical encode/decode-back proof, and typed errors.
- `SPRINT-007` / EPIC-06 provides `validateBuild`, structural issues, current catalog-version
  results, independent validity states, unresolved-ID behavior, and PvE budget policy.
- `SPRINT-008` / EPIC-07 provides the UI hierarchy/density reference and explicit responsive,
  focus, dialog, tooltip, and missing-state guidance.
- `SPRINT-009` / EPIC-08 is the direct prerequisite: one `EditorState`, semantic `Build`, PvE budget,
  location-aligned raw template overlay/source, app catalog boundary, validation selectors,
  template workflow, accessible dialogs, responsive editor, and placeholder/media policy.
- Existing React 19, Testing Library, Vitest/JSDOM, TypeScript, Vite, ESLint, and Prettier are
  sufficient. No storage, UUID, schema-validation, state-management, routing, file, compression,
  URL, modal, search, virtualization, sync, or analytics dependency is planned.
- Required browser capabilities are accessed through app ports and feature detection. `localStorage`
  is optional at runtime; URL/Blob/clipboard/history limitations have in-memory or selectable-text
  fallbacks where meaningful.
- EPIC-21 owns historical revision/freshness analysis. Later equipment, title, party/hero, guide,
  community, deployment, and PWA epics own their respective state and exchange formats.
- IndexedDB or cross-tab synchronization requires a later measured migration design. V1 envelope
  versioning, durable projections, and opaque record IDs are chosen so those systems can migrate
  data without changing domain/template semantics.

## Open Questions

No open question blocks execution. This draft resolves the intent questions and records the
following implementation defaults:

1. The smallest stable document is `Build + pveBudget + rawTemplate`, embedded in a versioned
   working draft or saved record. Full `EditorState` and derived validation are intentionally absent.
2. Library state lives beside `EditorState` in a pure `WorkspaceState`; nested editor dispatch keeps
   existing components stable while cross-concern commands remain atomic.
3. The single key is `build-wars:v1`, with an internal discriminator, schema version, and monotonic
   revision. Routine future migrations keep the key and advance the envelope version.
4. A partial/corrupt read may recover valid values in memory but locks writes so recovery cannot
   silently delete rejected bytes. Explicit restore-replace is the recovery escape hatch.
5. Autosave uses a 300 ms trailing delay plus best-effort pagehide flush; explicit library and
   restore operations cancel pending work and write the latest whole envelope immediately.
6. Record IDs use injected `crypto.randomUUID`; `Build.id` remains semantic document data and has no
   library-identity role.
7. Delete uses explicit confirmation rather than transient undo. Deleting an associated record
   preserves the draft and clears association.
8. Share links use the versioned hash-fragment format and a 1,800-character full-URL cap. Exact
   source is preferred when eligible; otherwise only proven canonical output may be linked.
9. A successfully imported startup fragment is consumed once. Invalid fragments never replace the
   hydrated draft or disappear before the user can diagnose them.
10. Merge always re-keys an incoming ID collision, even for equal content. Replace affects the
    library only; working-draft restoration remains a separate opt-in in both modes.
11. Catalog freshness compares the two promoted catalog versions plus rule-engine version. It is
    distinct from present-day validity and is refreshed only by an explicit record save.
12. The durable closeout note is `compendium/local-library-and-sharing.md`; the root README and core
    editor note receive concise current-scope/handoff updates rather than duplicating the full schema.
13. Cross-tab merge, automatic conflict resolution, IndexedDB migration, encryption, compression,
    hosted links, folders, and historical skill revision analysis remain deferred and do not block
    this local single-character MVP.
