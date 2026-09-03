# Multi-Build Workspace

SPRINT-017 ships EPIC-16's neutral build-set workspace. A build set is an ordered collection of
complete authored loadouts. It is not a party, hero roster, henchman model, guide, or external team
template.

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

## Runtime Model

The app keeps one active `EditorState`. In single-build mode that editor is the whole document. In
build-set mode the selected entry is represented by the live editor and every inactive entry is
represented by a durable `PersistedBuildSnapshot`.

Switching entries is an atomic reducer transition:

```text
outgoing EditorState -> PersistedBuildSnapshot
incoming PersistedBuildSnapshot -> EditorState
```

Save, autosave, pagehide flush, dirty fingerprinting, summaries, validation, comparison, backup,
restore preview, library rows, and transfer export all use the same materialized build-set snapshot.
The active loadout therefore cannot drift from what persistence, validation, or export sees.

Removing the last entry leaves a real empty set with no selected loadout. Unsupported selected-loadout
actions are disabled or blocked until an entry exists.

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

Unsupported versions, dangerous keys, unknown document kinds, malformed nested snapshots, duplicate
IDs, sparse arrays, oversized collections, over-limit build sets, and stale selected-entry IDs use
the bounded recovery and write-blocking behavior from the local-library parser.

## Backup, Transfer, And Sharing

Whole-library backup is schema version 2 and can contain mixed single-build and build-set records
plus an optional mixed working draft. Schema-1 backups continue to migrate through the same
single-build wrapper rules.

Build-set transfer uses one inert JSON envelope with kind `build-wars-build-set-transfer`. Transfer
files are deterministic, bounded by byte and entry caps, reject prototype-dangerous keys, show a
preview before apply, and hydrate as unassociated drafts through the dirty guard.

Share URLs and skill-template import/export remain selected-loadout-only. They use the existing
skill-template URL grammar and do not include sibling entries, entry notes, semantic equipment,
title-rank overrides, library metadata, backup data, or build-set transfer JSON.

## Deferred Scope

EPIC-16 explicitly defers hero catalogs, henchmen, NPC identity, portraits, AI behavior notes, party
slots, party-wide validation, paw-ned2/team-template support, guide publishing, backend sync,
collaboration, routes, remote media, account state, recommendations, and multi-pane editing.

EPIC-17 should adapt this neutral build-set base for party-specific labels, legality, hero/henchman
catalogs, and external team-sharing formats instead of changing EPIC-16's build-set semantics.
