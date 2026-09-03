# Multi-Build Workspace

SPRINT-017 ships EPIC-16's neutral build-set workspace. A build set is an ordered collection of
complete authored loadouts. SPRINT-018 lets that set opt into party semantics through an app-owned
annotation layer, but the underlying build-set contract remains neutral. A build set is not a hero
roster, henchman model, guide, or external team template.

## Domain Contract

`src/domain/build-set.ts` owns framework-neutral build-set contracts:

- `BUILD_SET_SCHEMA_VERSION = 1`
- `MAX_BUILD_SET_ENTRIES = 16`
- `BuildSetEntryId`
- `BuildSetEntryKind = "build" | "variant" | "freeform"`
- `BuildSetEntry`
- `BuildSet`

Each entry owns stable entry metadata: ID, bounded label, kind, and bounded notes. The entry payload
reuses the existing `Build` contract, so skill bars, attributes, title-rank overrides, and semantic
equipment are not duplicated in a second schema.

The domain module is app-neutral and party-neutral. It does not import React, browser APIs,
generated catalogs, app modules, party modules, or guide modules.

`src/domain/party.ts` owns the separate framework-neutral party annotation contract. Party slots
reference `BuildSetEntryId | null` and never embed `Build` or `PersistedBuildSnapshot` data. Party
slot order is the annotation array order; neutral entry order remains independent organization
metadata.

## Runtime Model

The app keeps zero or one active `EditorState`. In single-build mode that editor is the whole
document. In neutral build-set mode the selected entry is represented by the live editor and every
inactive entry is represented by a durable `PersistedBuildSnapshot`. In enabled party mode, an
occupied selected slot hydrates its referenced entry into the live editor. An empty selected slot has
no active entry; the outgoing editor is snapshotted and selected-loadout actions are unavailable
until the user creates or assigns a member.

Switching entries is an atomic reducer transition:

```text
outgoing EditorState -> PersistedBuildSnapshot
incoming PersistedBuildSnapshot -> EditorState
```

Save, autosave, pagehide flush, dirty fingerprinting, summaries, validation, comparison, backup,
restore preview, library rows, and transfer export all use the same materialized build-set snapshot.
The active loadout therefore cannot drift from what persistence, validation, or export sees.

Removing the last entry leaves a real empty set with no selected loadout. Unsupported
selected-loadout actions are disabled or blocked until an entry exists. In the focused composer
shell, empty build sets and empty selected party slots render a no-selected-loadout state with
create or assign actions instead of hydrating a placeholder build.

## Party Workspace

Party mode is reversible. `party: null` means no party annotation. `party.enabled: false` preserves
dormant metadata while the set is edited in neutral mode. Confirmed Reset Party clears only the
annotation and never deletes loadouts.

The party workspace supports presets 2, 4, 6, 8, and 12 plus custom sizes from 1 through 16.
Growing adds empty slots. Shrinking is blocked when removed slots are occupied or contain authored
slot metadata. Clear Member detaches the slot reference and leaves the loadout as an unassigned
entry; Delete Loadout remains a separate confirmed entry removal.

Slots own member label, role, member kind, optional freeform kind label, and party-context notes.
Entry label, entry kind, and entry notes remain neutral loadout metadata. Unassigned loadouts stay
visible and can be assigned to empty slots.

## Variants And Comparison

Duplicating the selected entry creates a `variant` inserted after the source. The duplicate receives
a fresh entry ID and nested `Build.id`, deep-copied durable snapshot state, a deterministic unique
label, and the source as the comparison target.

Comparison is read-only and field-based. Rows use stable path keys for identity, professions, mode,
skill slots, attributes, PvE budget, title ranks, semantic equipment, entry notes, and meaningful
unresolved raw facts. Equality uses normalized IDs and values; catalog labels are presentation only.
The comparison view renders changed groups by default and does not rank, recommend, optimize, infer
roles, or evaluate party synergy.

## Validation

Aggregate build-set status runs the existing selected-build validation path independently for each
entry. It counts errors, warnings, unresolved entries, incomplete authoring, stale facts, and
catalog-unavailable entries. Draft incompleteness remains neutral authoring status. EPIC-16 adds no
cross-entry party legality rules and does not change `RULE_ENGINE_VERSION`.

Attention rows select the affected entry. The existing selected-entry `ValidationPanel` remains the
place for detailed issue rendering.

Party validation is a separate app layer over materialized build-set snapshots. It adds structural
party diagnostics for empty slots, stale or duplicate references, duplicate slot IDs, invalid size
state, incomplete or unresolved occupied members, unknown mode, and mixed known PvE/PvP modes. It
does not infer roles, judge build quality, score synergy, recommend members, enforce hero legality,
or change rule-engine issue codes.

## Persistence

The browser storage key remains:

```text
build-wars:v1
```

The local-library payload is schema version 2. Working drafts and saved records now store a
discriminated document:

```text
{ kind: "build", snapshot: PersistedBuildSnapshot }
{ kind: "build-set", snapshot: PersistedBuildSetSnapshot }
```

Schema-1 libraries migrate in memory into schema 2 without writing on read, incrementing revisions,
dirtying the draft, or dropping IDs, timestamps, tags, favorites, record notes, saved-with facts,
PvE budgets, raw overlays, semantic equipment, or title-rank overrides.

App-owned nested persisted build-set snapshots are version 2:

```text
schemaVersion: 2
entries: PersistedBuildSetEntrySnapshot[]
lastSelectedEntryId: BuildSetEntryId | null
party: PartyAnnotations | null
lastSelectedPartySlotId: PartySlotId | null
```

Legacy nested version-1 neutral build-set snapshots migrate in memory to `party: null` and
`lastSelectedPartySlotId: null`. The domain `BuildSet` schema remains version 1.

Unsupported versions, dangerous keys, unknown document kinds, malformed nested snapshots, duplicate
IDs, sparse arrays, oversized collections, over-limit build sets, and stale selected-entry IDs use
the bounded recovery and write-blocking behavior from the local-library parser.

## Backup, Transfer, And Sharing

Whole-library backup is schema version 2 and can contain mixed single-build and build-set records
plus an optional mixed working draft. Schema-1 backups continue to migrate through the same
single-build wrapper rules.

Build-set transfer uses one inert JSON envelope with kind `build-wars-build-set-transfer`. Transfer
files are deterministic, bounded by byte and entry caps, reject prototype-dangerous keys, show a
preview before apply, hydrate as unassociated drafts through the dirty guard, and preserve enabled
or dormant party annotations when present.

Native party transfer uses kind `build-wars-party-transfer` and embeds one canonical persisted
build-set snapshot with an enabled party annotation. It is the lossless party exchange path.

Multi-code copy is a deterministic convenience projection in party order. It includes every slot as
a code, empty marker, or unavailable marker, records local-only omission facts, is capped at 32,000
UTF-8 bytes, and is not an import format.

Share URLs and skill-template import/export remain selected-loadout-only. They use the existing
skill-template URL grammar and do not include sibling entries, party metadata, entry notes, slot
notes, semantic equipment, title-rank overrides, library metadata, backup data, or transfer JSON.
The composer inline template controls warn about this selected-loadout boundary in build-set and
party contexts.

## Deferred Scope

EPIC-16 explicitly deferred party semantics. SPRINT-018 implements the MVP party annotation layer
without changing neutral build-set semantics.

Still-deferred scope includes hero and henchman catalogs, NPC identity, portraits, AI behavior
notes, unlock tracking, paw-ned2/team-template support, whole-party URL fragments, hosted sharing,
guide publishing, backend sync, collaboration, routes, remote media, account state,
recommendations, synergy scoring, and multi-pane editing. BW-1701 remains parked for a future
explicit external-team-template compatibility spike.
