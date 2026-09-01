---
id: EPIC-00
title: Project Foundation
track: functional
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-001
completed_sprint: SPRINT-001
tickets:
  - BW-0001
  - BW-0002
  - BW-0003
  - BW-0004
updated: 2026-09-01
---

# Project Foundation

## Goal

Establish the application shape, implementation conventions, and core domain boundaries before feature work begins.

## Scope

- Choose the initial app stack and package layout.
- Decide whether the first milestone is local-only, hosted, or PWA-ready.
- Define core domain models for builds, professions, attributes, skills, equipment, parties, guides, and source data.
- Set up test tooling and fixture strategy.
- Decide where generated data and source snapshots live.

## Done When

- The repo has a runnable app scaffold.
- The repo has a documented test command.
- Core data types are documented or stubbed in code.
- Future epics have a clear place to add implementation tickets.

## Notes

Prefer a TypeScript web app unless a better constraint appears. Keep data ingestion scripts separate from UI code so data can be regenerated without coupling it to runtime rendering.
