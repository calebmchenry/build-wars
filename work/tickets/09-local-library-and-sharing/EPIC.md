---
id: EPIC-09
title: Local Library and Sharing
track: functional
status: backlog
priority: medium
depends_on:
  - EPIC-08
---

# Local Library and Sharing

## Goal

Persist user-created builds locally and make them easy to import, export, duplicate, organize, and share.

## Scope

* Local build library using versioned storage.
* Create, edit, duplicate, delete, favorite, tag, and filter builds.
* Import/export single-build JSON.
* Backup/restore all local data.
* Shareable URL format for compact builds.
* Graceful fallback when a build or party is too large for URL sharing.

## Done When

* Builds survive browser reloads.
* Storage schema migrations are tested.
* Users can recover their library from exported data.
* Sharing does not require an account or backend.

## Notes

Keep hosted sharing out of MVP unless the product direction changes.
