---
id: BW-0405
title: Skills Catalog QA and Exact-Path Promotion
epic: EPIC-04
status: done
priority: critical
depends_on:
  - BW-0402
  - BW-0403
  - BW-0404
planned_sprint: SPRINT-005
completed_sprint: SPRINT-005
created: 2026-09-01
updated: 2026-09-02
---

# BW-0405: Skills Catalog QA and Exact-Path Promotion

## Goal

Assemble, verify, and promote the EPIC-04 generated skills catalog, manifest, and QA report under explicit exact paths.

## Scope

- Generate canonical JSON at `data/generated/epic-04/skills.catalog.json` plus the adjacent `data/generated/epic-04/skills.catalog.manifest.json`.
- Generate a bounded machine-readable QA report at `data/qa/epic-04/skills.catalog.qa.json`.
- Add exact `.gitignore` allowlist entries only for those promoted paths and required parent directories.
- Add section digests and a semantic catalog version that ignores retrieval timestamps, generation timestamps, manifest paths, QA paths, raw provenance timing, and its own value.
- Keep child snapshot paths, source-plan paths, full review evidence, and artifact digest ownership in the adjacent manifest and QA report rather than embedding them in the runtime catalog.
- Gate app consumption and public release on complete source IDs, complete provenance, deterministic fixture/offline replay, no open critical findings, no open error findings for public release, and reviewed warnings.
- Record a first-baseline review event for the approved EPIC-04 catalog.
- Keep raw source snapshots, live refresh output, QA summaries, icon bytes, screenshots, copied page bodies, and unreviewed prose ignored.

## Acceptance Criteria

- All known skill template IDs from the accepted source set resolve to catalog records or have explicit QA dispositions.
- QA flags missing icons, costs, descriptions, progressions, split relationships, source references, revision facts, duplicate IDs, duplicate names, copied-text risk, malformed templates, and artifact digest mismatches.
- Fixture mode is synthetic and offline; live mode is explicit, bounded, and manual-only.
- A bounded live refresh followed by offline replay is completed before production promotion when network conditions permit.
- Repeated fixed-clock fixture generation is byte-identical for catalog, manifest, QA report, and finding IDs.
- Runtime consumers can import the catalog without reading raw snapshots, manifests, QA reports, data scripts, or wiki APIs.
- Production promotion cannot complete without one bounded live refresh, selected snapshot-set replay, description/review closeout, first-baseline review, and passing app/public gates.

## Verification

- `npm run verify`
- Run EPIC-04 fixture regeneration twice and prove byte-identical output under a fixed clock
- Run EPIC-04 offline replay from selected snapshots
- Run a bounded manual live refresh only if source/network conditions are available during implementation
