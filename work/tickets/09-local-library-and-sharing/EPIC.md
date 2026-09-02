---
id: EPIC-09
title: Local Library and Sharing
track: functional
status: done
priority: medium
depends_on:
  - EPIC-08
planned_sprint: SPRINT-010
completed_sprint: SPRINT-010
tickets:
  - BW-0901
  - BW-0902
  - BW-0903
  - BW-0904
  - BW-0905
  - BW-0906
  - BW-0907
updated: 2026-09-02
---

# Local Library and Sharing

## Goal

Persist user-created builds locally and make them easy to import, export, duplicate, organize, and share.

## Scope

* Local build library using versioned storage.
* Create, edit, duplicate, delete, favorite, tag, and filter builds.
* Import/export single builds through Guild Wars/Reforged skill template codes.
* Backup/restore all local data.
* Shareable URL format for compact builds.
* Graceful fallback when a build is too large for URL sharing.

## Done When

* Builds survive browser reloads.
* Storage schema migrations are tested.
* Users can recover their library from exported data.
* Sharing does not require an account or backend.

## Grooming Decisions

* EPIC-09 persists single-character builds only. Party records, guide records, backend accounts,
  network sync, auth, analytics, and hosted sharing remain out of scope.
* Storage uses browser `localStorage` under one namespaced key, likely `build-wars:v1`. IndexedDB is
  deferred until library size, guide content, media, or party data requires it.
* The current working draft autosaves separately from the saved build library so refreshes preserve
  in-progress edits without listing every experiment as a saved build.
* Saved library records have local IDs and preserve the semantic `Build`, EPIC-08 raw template
  overlay/source data, name, created/updated timestamps, tags, favorite state, optional short notes,
  and last-known catalog/version facts.
* Single-build exchange uses existing Guild Wars/Reforged skill template codes, not single-build
  JSON. Template codes carry profession, attributes, and skill bar only; they do not carry runes,
  insignias, weapon mods, equipment, tags, favorites, notes, or library metadata.
* Versioned JSON is reserved for whole-library backup/restore because it must preserve library-only
  metadata and draft state.
* Duplicate builds are allowed. The user explicitly chooses whether to update an existing saved
  build or save the current draft as a new record. Template wrapper names may prefill a draft name
  but do not define saved-record identity.
* Library organization includes build name, profession pair, mode, updated date, favorite marker,
  tags, text search by build and skill names, filters for profession/mode/favorite/tag, and sorting
  by updated date, name, or profession pair. Folders are deferred.
* Saved builds store catalog version facts from their last save or validation. Loading a saved build
  validates against the current catalogs, preserves stale or unresolved IDs, and shows warnings
  rather than auto-migrating or replacing skills. Deeper build freshness/revision analysis remains
  in `EPIC-21`.
* Storage failures, quota errors, and corrupt local data must not break the editor. The app falls
  back to in-memory operation and surfaces a clear warning. Corrupt data is not automatically
  deleted.
* Restore previews counts and requires explicit confirmation. Restore supports merge and replace
  modes, skips invalid records with a report, and performs no network recovery or telemetry.
* UI extends the existing editor with a desktop side panel that can collapse on narrower screens.
  Template import/export remain editor actions. No routing or multi-page app shell is required.

## Ticket Breakdown

* `BW-0901`: Versioned local storage contracts, migrations, and failure handling.
* `BW-0902`: Working draft autosave and restore.
* `BW-0903`: Saved build create, update, save-as-new, duplicate, delete, favorite, tags, and notes.
* `BW-0904`: Library panel, search, filters, sorting, selection, and responsive collapse.
* `BW-0905`: Skill-template-code sharing, share URLs, and URL import into draft.
* `BW-0906`: Whole-library backup/restore JSON with preview, merge/replace, validation, and reports.
* `BW-0907`: Catalog-version freshness checks, validation integration, tests, docs, and closeout.

## Notes

Keep hosted sharing out of MVP unless the product direction changes.
