---
id: BW-0201
title: MediaWiki API Client
epic: EPIC-02
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-003
completed_sprint: SPRINT-003
created: 2026-09-01
updated: 2026-09-01
---

# BW-0201: MediaWiki API Client

## Goal

Build the shared offline client used by data scripts to read from the Guild Wars Wiki MediaWiki API without coupling fetch logic to content-specific extractors.

## Scope

- Add a reusable API request layer under `scripts/data/`.
- Support GET requests to `https://wiki.guildwars.com/api.php` with JSON responses.
- Set a descriptive User-Agent suitable for a free public Build Wars tool.
- Handle MediaWiki continuation tokens for list and generator queries.
- Add retries with bounded backoff for transient network, rate-limit, and maxlag responses.
- Support batching for title/page/revision requests within MediaWiki API limits.
- Log enough request metadata for troubleshooting without dumping large response bodies by default.

## Acceptance Criteria

- Data scripts can fetch siteinfo and page revision metadata through the shared client.
- Continuation handling is covered by a focused test or fixture.
- Retry/maxlag behavior is deterministic enough to test without live network calls.
- The client does not import browser app code or runtime UI modules.
- The client is documented as offline tooling, not browser runtime code.

## Verification

- `npm run verify`
- Focused ingestion client tests added by the implementation sprint
