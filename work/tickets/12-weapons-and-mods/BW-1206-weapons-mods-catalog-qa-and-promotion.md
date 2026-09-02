---
id: BW-1206
title: Weapons/Mods Catalog QA and Exact-Path Promotion
epic: EPIC-12
status: ready
priority: critical
depends_on:
  - BW-1202
  - BW-1203
  - BW-1204
  - BW-1205
created: 2026-09-02
updated: 2026-09-02
---

# BW-1206: Weapons/Mods Catalog QA and Exact-Path Promotion

## Goal

Assemble, verify, and promote the EPIC-12 generated weapon and modifier catalogs, manifests, and QA
reports under explicit exact paths.

## Scope

- Generate canonical runtime JSON under `data/generated/epic-12/` for weapon base types and
  weapon/upgrade modifier records.
- Generate adjacent manifests and bounded machine-readable QA reports under approved exact paths.
- Add exact `.gitignore` allowlist entries only for promoted EPIC-12 artifacts and required parent
  directories.
- Add section digests and semantic catalog versioning that ignore timestamps, manifest paths, QA
  paths, and version values themselves.
- Gate promotion on complete source IDs, complete provenance, deterministic fixture/offline replay,
  no open critical findings, reviewed warnings, and verified raw-template crosswalk dispositions.
- Keep raw snapshots, live refresh outputs, source plans, QA summaries, icon bytes, screenshots, and
  copied page bodies ignored.

## Out Of Scope

- Runtime UI consumption, equipment editor implementation, named unique-item exhaustiveness, and
  source-derived icon byte promotion.

## Acceptance Criteria

- All accepted weapon and modifier source records resolve to catalog records or explicit QA
  dispositions.
- QA flags duplicate IDs, duplicate names, missing requirements, missing icons, missing revision
  facts, copied-text risk, malformed effects, compatibility gaps, unresolved template IDs, and
  artifact digest mismatches.
- Repeated fixed-clock fixture generation is byte-identical for catalog, manifest, QA report, and
  finding IDs.
- Runtime consumers can import the catalog without reading raw snapshots, manifests, QA reports,
  data scripts, or wiki APIs.

## Verification

- `npm run verify`
- Run EPIC-12 fixture regeneration twice and prove byte-identical output under a fixed clock
- Run EPIC-12 offline replay from selected snapshots
- Run a bounded manual live refresh only if source/network conditions are available
