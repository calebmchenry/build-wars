---
id: BW-0208
title: Regenerate Command and Documentation
epic: EPIC-02
status: backlog
priority: critical
depends_on:
  - BW-0201
  - BW-0202
  - BW-0203
  - BW-0204
  - BW-0205
  - BW-0206
  - BW-0207
created: 2026-09-01
---

# BW-0208: Regenerate Command and Documentation

## Goal

Expose one documented data command that runs the EPIC-02 fetch, snapshot, normalize, validate, and report flow.

## Scope

- Add a single documented command for the EPIC-02 ingestion flow.
- Support a fixture/offline mode for tests and local development without live wiki calls.
- Support a live mode for refreshing source snapshots from the Guild Wars Wiki API.
- Make command output summarize fetched pages, generated records, QA findings, and artifact paths.
- Keep command behavior deterministic enough for automation.
- Document required environment, source policy limits, generated/ignored artifact locations, and common failure modes.
- Integrate focused ingestion validation into `npm run verify` only when it is fast and offline.

## Acceptance Criteria

- Contributors can run one documented command to regenerate EPIC-02 artifacts.
- Offline fixture mode is covered by automated tests.
- Live mode follows the API client politeness rules and writes provenance.
- The command fails clearly on critical QA issues.
- Documentation explains which artifacts are ignored, which may be committed, and how later content epics plug in extractors.

## Verification

- `npm run verify`
- Documented offline regenerate command added by the implementation sprint
