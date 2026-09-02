---
id: BW-1005
title: Rune Catalog QA and Exact-Path Promotion
epic: EPIC-10
status: done
priority: critical
depends_on:
  - BW-1002
  - BW-1003
  - BW-1004
planned_sprint: SPRINT-011
completed_sprint: SPRINT-011
created: 2026-09-02
updated: 2026-09-02
---

# BW-1005: Rune Catalog QA and Exact-Path Promotion

## Goal

Assemble, verify, and promote the EPIC-10 generated rune catalog, manifest, and QA report under
explicit exact paths.

## Scope

- Generate canonical runtime JSON at `data/generated/epic-10/runes.catalog.json`.
- Generate an adjacent manifest and bounded machine-readable QA report under approved exact paths.
- Add exact `.gitignore` allowlist entries only for promoted EPIC-10 artifacts and required parent
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

- All accepted rune source records resolve to catalog records or explicit QA dispositions.
- QA flags duplicate IDs, duplicate names, missing restrictions, missing icons, missing revision
  facts, copied-text risk, malformed effects, stackability gaps, and artifact digest mismatches.
- Repeated fixed-clock fixture generation is byte-identical for catalog, manifest, QA report, and
  finding IDs.
- Runtime consumers can import the catalog without reading raw snapshots, manifests, QA reports,
  data scripts, or wiki APIs.

## Verification

- `npm run verify`
- Run EPIC-10 fixture regeneration twice and prove byte-identical output under a fixed clock
- Run EPIC-10 offline replay from selected snapshots
- Run a bounded manual live refresh only if source/network conditions are available

## Closeout Evidence

- SPRINT-011 promoted `data/generated/epic-10/runes.catalog.json`,
  `data/generated/epic-10/runes.catalog.manifest.json`, and
  `data/qa/epic-10/runes.catalog.qa.json` from a digest-confirmed live source plan and selected
  complete snapshot-set replay.
- Production catalog evidence: 138 runes, `catalogVersion: runes-58a277f62fe92f2a`,
  `sourceSetDigest: 904d3d4133966e6104fdd460d549982fec27375f4b96fa20a5340d0f5493d504`,
  selected snapshot-set digest `98fea6b02b64cef1c156ffa633ed9101b53bf5b0e174862f220e13d2f684ea2d`,
  `appConsumptionGate: pass`, and `publicReleaseGate: pass`.
- Validation passed: fixed-clock fixture A/B byte comparison, live discover/fetch, two
  byte-identical fixed-clock offline replays, `git check-ignore -v` for promoted paths and ignored
  byproducts, the phase-5 Python subset, and
  `npm run test:run -- test/domain/data-ingestion-contracts.test.ts test/domain/rune-catalog.test.ts test/domain/rune-effects.test.ts`.
