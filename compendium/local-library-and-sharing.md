# Local Library And Sharing

SPRINT-010 shipped EPIC-09 local library and sharing behavior for single-character builds.

## Storage Contract

The MVP uses exactly one browser `localStorage` key:

```text
build-wars:v1
```

The stored value is a plain JSON envelope with `schemaVersion: 1`, kind
`build-wars-local-library`, a best-effort `revision`, `updatedAt`, optional working draft, saved
build records, and bounded metadata. The durable snapshot intentionally persists only:

- semantic `Build`
- `PveBudgetState`
- raw template overlay/source facts
- saved-with catalog and rule-engine facts
- semantic equipment selections and topology
- sparse title-rank overrides
- saved-record metadata: local ID, name, timestamps, favorite, tags, and notes

Full editor UI state is not durable. Browser filters, dialog text, tooltip state, drag/keyboard
state, selected slot, transient messages, batch size, and counters are reconstructed from current
defaults on hydration.

The outer envelope remains schema version 1. Nested `Build` objects are normalized to schema version 2. Schema-1 builds migrate in memory with empty `titleRankOverrides`, so opening old libraries does
not dirty or eagerly overwrite them. Schema-2 builds require bounded canonical title override arrays
and retain structurally valid unknown/stale overrides so the user can see and reset them.

Schema v1 accepts strict semantic equipment only: five canonical armor rows, four canonical weapon
sets, dense modifier arrays, bounded labels/reasons, and known or unresolved semantic selections.
It rejects dangerous keys, raw equipment-template structures, unsupported fields, malformed
topology, sparse arrays, empty hand objects, duplicate known modifier IDs, invalid indexes,
malformed title overrides, unsafe title ranks, duplicate title keys, and unbounded strings.

Corrupt roots, unsupported schema versions, duplicate IDs, invalid subsets, malformed equipment,
oversized payloads, quota errors, unavailable storage, and stale revisions are typed failure states.
Corrupt or partially recovered storage enters `write-blocked`; autosave does not delete or
overwrite it without an explicit user action.

## Workspace Behavior

The app owns a workspace reducer above `EditorState`. The reducer coordinates the current editor
draft, saved records, draft association, dirty state, storage diagnostics, and restore state.

- Working-draft autosave is separate from saved records and never creates a library record.
- Save new creates a local record and associates the draft to it.
- Update is available only for an associated record.
- Save as new creates another local ID and allows duplicate names and duplicate build contents.
- Template import and share import clear saved-record association.
- Loading records, new draft, template import, share import over an existing draft, backup draft
  restore, and destructive restore replace use the same dirty-draft guard.
- Deleting an associated record leaves the in-memory draft open and clears association.

localStorage revision checks are best-effort conflict detection, not cross-tab synchronization or
atomic compare-and-swap.

## Library Panel

The editor now includes a compact local library panel on the same screen. It supports explicit save,
update, save-as-new, duplicate, delete confirmation, favorite, rename, tags, notes, load, share,
backup, and restore entry points.

Library selectors search deterministically by saved build name, resolved skill names, unresolved raw
skill labels, tags, notes, and profession labels. Filters include profession, mode, favorite, and
tag. Sort modes cover updated date, name, and profession pair with stable tie-breakers by normalized
name, updated timestamp, and local ID.

Saved rows show freshness, validation, and resolution as separate diagnostics. Freshness compares
saved-with catalog/rule-engine facts to current app facts. It does not imply validity, and validity
does not imply freshness. Equipment catalog freshness is compared only for records with meaningful
authored equipment, so old `equipment: null` saves stay quiet.

## Share URLs

Single-build sharing remains skill-template-code-first. Build Wars does not add a separate JSON
single-build exchange codec.

The URL fragment grammar is:

```text
#bw=1&code=<percent-encoded-bare-skill-template-code>&mode=pve|pvp|unknown
```

`mode` may be omitted when unknown. Share URLs exclude tags, notes, favorite state, local IDs,
backup metadata, catalog snapshots, equipment, runes, insignias, weapon mods, title-rank overrides,
party data, guide data, validation prose, and whole-library JSON.

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

Whole-library backup uses inert JSON with kind `build-wars-library-backup`, schema version,
exported timestamp, saved records, optional working draft, saved-with facts, and bounded metadata.
Backup JSON is selectable and downloadable through explicit user actions.

Restore parses from unknown JSON, validates durable records with the same schema validators, and
creates a preview before any apply. The preview reports accepted records, skipped records, duplicate
backup IDs, current-ID conflicts, ID remaps, optional draft availability, and merge/replace final
counts.

Merge preserves current records and imports accepted backup records, re-keying incoming ID
collisions. Replace requires explicit confirmation and refuses to wipe a nonempty current library
from a declared-nonempty backup whose records all failed validation. Restoring the backup working
draft is separately opt-in in both modes.

## Boundaries

No backend, account, auth, analytics, service worker, IndexedDB, hosted sharing, short link, remote
icon/media fetch, new runtime dependency, generated-data pipeline change, party record, guide
record, equipment/title share payload, raw equipment-template replay, account title profile, or
historical skill revision analysis was introduced. Deeper freshness and revision-history analysis
remains deferred to EPIC-21.
