---
id: BW-1105
title: Insignia Catalog QA and Exact-Path Promotion
epic: EPIC-11
status: ready
priority: critical
depends_on:
  - BW-1102
  - BW-1103
  - BW-1104
created: 2026-09-02
updated: 2026-09-02
---

# BW-1105: Insignia Catalog QA and Exact-Path Promotion

## Goal

Assemble, verify, and promote the EPIC-11 generated insignia catalog, manifest, and QA report under
explicit exact paths.

## Scope

- Generate canonical runtime JSON at `data/generated/epic-11/insignias.catalog.json`.
- Generate an adjacent manifest and bounded machine-readable QA report under approved exact paths.
- Add exact `.gitignore` allowlist entries only for promoted EPIC-11 artifacts and required parent
  directories.
- Add section digests and semantic catalog versioning that ignore timestamps, manifest paths, QA
  paths, and the version value itself.
- Gate promotion on complete source IDs, complete provenance, deterministic fixture/offline replay,
  no open critical findings, and reviewed warnings.
- Keep raw snapshots, live refresh outputs, source plans, QA summaries, icon bytes, screenshots, and
  copied page bodies ignored.

## Out Of Scope

- Runtime UI consumption, armor editor implementation, and source-derived icon byte promotion.

## Acceptance Criteria

- All accepted insignia source records resolve to catalog records or explicit QA dispositions.
- QA flags duplicate IDs, duplicate names, missing restrictions, missing icons, missing revision
  facts, copied-text risk, malformed effects, slot-scaling gaps, and artifact digest mismatches.
- Repeated fixed-clock fixture generation is byte-identical for catalog, manifest, QA report, and
  finding IDs.
- Runtime consumers can import the catalog without reading raw snapshots, manifests, QA reports,
  data scripts, or wiki APIs.

## Verification

- `npm run verify`
- Run EPIC-11 fixture regeneration twice and prove byte-identical output under a fixed clock
- Run EPIC-11 offline replay from selected snapshots
- Run a bounded manual live refresh only if source/network conditions are available
