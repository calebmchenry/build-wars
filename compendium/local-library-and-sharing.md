# Local Library And Sharing

SPRINT-010 shipped EPIC-09 local library and sharing behavior for single-character builds.
SPRINT-017 advances the payload to schema 2 so the same local-first library can also store neutral
build sets.

## Storage Contract

The MVP uses exactly one browser `localStorage` key:

```text
build-wars:v1
```

The stored value is a plain JSON envelope with `schemaVersion: 2`, kind
`build-wars-local-library`, a best-effort `revision`, `updatedAt`, optional working draft, mixed
saved document records, and bounded metadata. The durable snapshot intentionally persists only:

- semantic `Build`
- `PveBudgetState`
- raw template overlay/source facts
- build-set document ID, name, ordered entries, last selected entry, entry labels, entry kinds, and
  entry notes
- saved-with catalog and rule-engine facts
- semantic equipment selections and topology
- sparse title-rank overrides
- saved-record metadata: local ID, name, timestamps, favorite, tags, and notes

Full editor UI state is not durable. Browser filters, dialog text, tooltip state, drag/keyboard
state, selected slot, transient messages, batch size, and counters are reconstructed from current
defaults on hydration.

The storage key remains `build-wars:v1`; it is a discovery key, not the payload schema version.
Schema-1 libraries migrate in memory into schema 2 by wrapping saved builds and working drafts as
`{ kind: "build", snapshot }` documents. Loading old libraries does not dirty the draft, increment
revision, or eagerly overwrite storage. Nested `Build` objects are normalized to schema version 2
with empty `titleRankOverrides` when needed. Schema-2 builds require bounded canonical title override
arrays and retain structurally valid unknown/stale overrides so the user can see and reset them.

Equipment schema v1 accepts strict semantic equipment only: five canonical armor rows, four
canonical weapon sets, dense modifier arrays, bounded labels/reasons, and known or unresolved
semantic selections.
It rejects dangerous keys, raw equipment-template structures, unsupported fields, malformed
topology, sparse arrays, empty hand objects, duplicate known modifier IDs, invalid indexes,
malformed title overrides, unsafe title ranks, duplicate title keys, and unbounded strings.

Schema-2 build sets are capped at 16 entries and store inactive entries as `PersistedBuildSnapshot`
objects. Stale `lastSelectedEntryId` values are repaired deterministically. Corrupt roots,
unsupported schema versions, unknown document kinds, duplicate IDs, duplicate build-set entry IDs,
invalid subsets, malformed equipment, oversized payloads, quota errors, unavailable storage, and
stale revisions are typed failure states. Corrupt or partially recovered storage enters
`write-blocked`; autosave does not delete or overwrite it without an explicit user action.

## Workspace Behavior

The app owns a workspace reducer above `EditorState`. The reducer coordinates the current editor
draft, saved records, draft association, dirty state, storage diagnostics, and restore state.

- Working-draft autosave is separate from saved records and never creates a library record.
- Save new creates a local record and associates the draft to it.
- Update is available only for an associated record.
- Save as new creates another local ID and allows duplicate names and duplicate build contents.
- Template import and share import clear saved-record association for single-build drafts. In
  build-set mode, template import replaces only the selected entry's snapshot and preserves entry
  ID, label, kind, notes, and nested build ID.
- Loading records, new draft, template import, share import over an existing draft, backup draft
  restore, and destructive restore replace use the same dirty-draft guard.
- Deleting an associated record leaves the in-memory draft open and clears association.

localStorage revision checks are best-effort conflict detection, not cross-tab synchronization or
atomic compare-and-swap.

## Library Panel

The editor now includes a compact local library panel on the same screen. It supports explicit save,
update, save-as-new, duplicate, delete confirmation, favorite, rename, tags, notes, load, Copy Into
Set, selected-loadout share, backup, and restore entry points.

Library selectors search deterministically by saved document name, entry labels, resolved skill
names, unresolved raw skill labels, tags, notes, and profession labels. Build-set profession and
mode filters match any contained entry. Sort modes cover updated date, name, and profession pair
with stable tie-breakers by normalized name, updated timestamp, and local ID.

Saved rows show freshness, validation, and resolution as separate diagnostics. Freshness compares
saved-with catalog/rule-engine facts to current app facts. It does not imply validity, and validity
does not imply freshness. Equipment catalog freshness is compared only for records with meaningful
authored equipment, so old `equipment: null` saves stay quiet.

## Share URLs

Share URLs remain skill-template-code-first and selected-loadout-only. Build Wars does not add a
separate JSON single-build exchange codec or encode whole build sets into URL fragments.

The URL fragment grammar is:

```text
#bw=1&code=<percent-encoded-bare-skill-template-code>&mode=pve|pvp|unknown
```

`mode` may be omitted when unknown. Share URLs exclude tags, notes, favorite state, local IDs,
backup metadata, catalog snapshots, equipment, runes, insignias, weapon mods, title-rank overrides,
party data, guide data, validation prose, and whole-library JSON.

Build-set share export targets the selected entry only and warns that sibling entries and entry
notes require build-set transfer or backup JSON. Empty or no-selection build sets cannot invoke
selected-loadout share/template actions.

Share export prefers exact-source bare code when the imported source fingerprint still matches. It
falls back to proven canonical bare code only after validation, representation, encode, and
decode-back checks pass. Equipment-only validation issues do not block skill-template export. The
complete encoded URL is capped at 1,800 characters; oversized or unrepresentable shares leave
selectable template text and a blocked reason. Meaningful authored equipment and non-default
authored title-rank overrides show omission warnings because both remain local-only.

Valid share fragments hydrate an unassociated working draft and are consumed with
`history.replaceState` when available. If a share opens over an existing stored draft, the shared
draft stays memory-only until the user explicitly chooses Use as Draft or Save New.

## Backup And Restore

Whole-library backup uses inert JSON with kind `build-wars-library-backup`, schema version 2,
exported timestamp, mixed saved records, optional mixed working draft, saved-with facts, and bounded
metadata. Schema-1 backups migrate through the same single-build wrapper rules. Backup JSON is
selectable and downloadable through explicit user actions.

Restore parses from unknown JSON, validates durable records with the same schema validators, and
creates a preview before any apply. The preview reports accepted records, skipped records, duplicate
backup IDs, current-ID conflicts, ID remaps, optional draft availability, and merge/replace final
counts.

Merge preserves current records and imports accepted backup records, re-keying incoming ID
collisions. Replace requires explicit confirmation and refuses to wipe a nonempty current library
from a declared-nonempty backup whose records all failed validation. Restoring the backup working
draft is separately opt-in in both modes.

## Build-Set Transfer

Build-set transfer is a separate inert JSON exchange format for one build set:

```text
kind: build-wars-build-set-transfer
schemaVersion: 1
```

Transfer JSON is deterministic, byte-bounded, entry-capped, dangerous-key-safe, previewed before
apply, and applied once. Import hydrates an unassociated build-set draft through the dirty guard.
The format is native Build Wars data and makes no paw-ned2/team-template compatibility claim.

## Boundaries

No backend, account, auth, analytics, service worker, IndexedDB, hosted sharing, short link, remote
icon/media fetch, new runtime dependency, generated-data pipeline change, hero catalog, henchman
catalog, party record, guide record, paw-ned2/team-template codec, equipment/title share payload,
raw equipment-template replay, account title profile, collaboration, or historical skill revision
analysis was introduced. Party-specific labels, validation, and sharing are deferred to EPIC-17.
Deeper freshness and revision-history analysis remains deferred to EPIC-21.
