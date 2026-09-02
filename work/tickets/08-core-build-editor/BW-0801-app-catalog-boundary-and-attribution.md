---
id: BW-0801
title: App Catalog Boundary and Attribution
epic: EPIC-08
status: ready
priority: critical
depends_on:
  - EPIC-03
  - EPIC-04
created: 2026-09-02
updated: 2026-09-02
---

# BW-0801: App Catalog Boundary and Attribution

## Goal

Expose promoted profession/attribute and skill catalog data to `src/app` through one app-owned
boundary that keeps generated-file paths, attribution, and remote-media policy out of leaf UI
components.

## Scope

- Add an app-side catalog module, likely `src/app/catalogs.ts`, that statically imports only the
  approved runtime catalog JSON files.
- Provide typed accessors or app-ready views for professions, attributes, skills, catalog versions,
  and source-attribution facts needed by the editor.
- Render minimal visible attribution before showing source-derived catalog names or facts.
- Preserve remote icon metadata as data if useful, but do not automatically fetch remote wiki image
  URLs in EPIC-08.
- Render stable placeholder icon slots for professions and skills so later icon work does not
  change layout dimensions.

## Out Of Scope

- Async catalog loading, live wiki access, generated manifests, QA reports, source plans, snapshots,
  Python ingestion modules, icon-byte caching, public media redistribution, and local storage.

## Acceptance Criteria

- UI components do not import `data/generated/**` directly.
- Runtime imports are limited to `professions-attributes.catalog.json` and `skills.catalog.json`.
- Catalog attribution is visible in the editor.
- Remote icons are not requested automatically by the browser.
- Placeholder icon slots are stable in list, grid, skill-bar, and tooltip contexts.

## Verification

- `npm run verify`
- A source scan confirms forbidden generated artifacts and wiki/data scripts are not imported by
  `src/app`.
