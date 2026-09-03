---
id: BW-1206
title: Weapons/Mods Catalog QA and Exact-Path Promotion
epic: EPIC-12
status: done
priority: critical
depends_on:
  - BW-1202
  - BW-1203
  - BW-1204
  - BW-1205
planned_sprint: SPRINT-013
completed_sprint: SPRINT-013
created: 2026-09-02
updated: 2026-09-03
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

## Closeout Evidence

- SPRINT-013 promoted `data/generated/epic-12/weapons.catalog.json`,
  `data/generated/epic-12/weapons.catalog.manifest.json`,
  `data/generated/epic-12/weapon-mods.catalog.json`,
  `data/generated/epic-12/weapon-mods.catalog.manifest.json`,
  `data/qa/epic-12/weapons.catalog.qa.json`, and
  `data/qa/epic-12/weapon-mods.catalog.qa.json`.
- Production release evidence: 11 weapon bases, 9 weapon modifiers, `catalogSetVersion:
weapon-mods-set-60ed5c4dc8257664`, weapon catalog version `weapons-3f7389e0935e67dd`, modifier
  catalog version `weapon-mods-6beb6758addc464a`, `sourceSetDigest:
bb7d16a292c8705d9a76b196f9128e98c1a42032c8407e0ee43f29cf91cb5142`, and selected snapshot-set
  digest `4d8f6333dca3fff5f4b95d3634faed34fc4e39a634e2aa9f5b4ead45312c8495`.
- Both QA reports have `appConsumptionGate: pass`, `publicReleaseGate: pass`, and zero findings.
  Validation passed: live discover/fetch, selected offline replay twice, live/offline byte
  comparison, offline A/B byte comparison, fixture A/B byte comparison, `.gitignore` allowlist
  checks, focused EPIC-12 tests, and `npm run verify`.
