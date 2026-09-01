# Build Wars Ticket Backlog

This directory tracks planned work as local markdown files.

## Structure

* `index.md` is the ordered epic map.
* Each numbered directory is one epic.
* Epics live in a single implementation-oriented order, even when some are content/data work.
* Each epic has an `EPIC.md`. Later, concrete tickets can be added in the same directory as `BW-xxxx-title.md`.
* The `track` frontmatter distinguishes `functional` epics from `content` epics without splitting them into separate trees.

## Epic Metadata

Each epic starts with frontmatter:

```yaml
---
id: EPIC-00
title: Project Foundation
track: functional
status: backlog
priority: critical
depends_on: []
---
```

## Status Values

* `backlog`
* `ready`
* `in-progress`
* `blocked`
* `done`

## Ticket ID Convention

Future ticket IDs should follow the epic number where possible:

* `BW-0001` for `EPIC-00`
* `BW-0101` for `EPIC-01`
* `BW-2101` for `EPIC-21`

The exact numbering can change later; keep the epic relationship explicit in frontmatter.

## Automation

`scripts/ticket-burn.py` can plan and execute Codex sprints from this backlog.
By default it reads epics from `work/tickets`, respects `depends_on`, writes
sprints under `work/sprints`, and stores run logs/state under
`work/runs/ticket-burn`.

Use `python3 scripts/ticket-burn.py --dry-run` to preview the next eligible epic.
Use `python3 scripts/ticket-burn.py --through-epic EPIC-07` to stop a backlog
run after a specific epic while ignoring later open epics for that run.
