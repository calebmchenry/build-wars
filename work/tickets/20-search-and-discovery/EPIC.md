---
id: EPIC-20
title: Search and Discovery
track: functional
status: backlog
priority: medium
depends_on:
  - EPIC-08
  - EPIC-09
  - EPIC-19
---

# Search and Discovery

## Goal

Make skills, builds, equipment, guides, and community metadata easy to find and filter.

## Scope

* Skill search by name, id, profession, attribute, campaign, type, cost, elite status, and PvE/PvP flags.
* Build library search by profession pair, skill, role, mode, tags, and favorites.
* Guide search by text, skill, mode, status, source, and update state.
* Search result previews that include skill bars and key metadata.
* Optional imported PvX/GW1 Builds metadata index later.

## Done When

* Search works locally without a backend.
* Common filters are fast enough for all local game data.
* Empty and no-result states are clear.

## Notes

Start with simple local indexes. Deeper relevance ranking can wait.
