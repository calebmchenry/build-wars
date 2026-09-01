---
id: EPIC-02
title: Data Ingestion Platform
track: functional
status: backlog
priority: critical
depends_on:
  - EPIC-00
  - EPIC-01
tickets:
  - BW-0201
  - BW-0202
  - BW-0203
  - BW-0204
  - BW-0205
  - BW-0206
  - BW-0207
  - BW-0208
updated: 2026-09-01
---

# Data Ingestion Platform

## Goal

Build repeatable tooling that fetches, parses, normalizes, validates, and versions Guild Wars data.

## Scope

* Fetch source pages through the Guild Wars Wiki MediaWiki API.
* Parse common wiki templates, especially skill infoboxes and progression helpers.
* Fetch image metadata for icons.
* Store source page, revision id, source URL, and fetch timestamp with generated records.
* Produce QA reports for missing fields, missing icons, unknown ids, duplicate ids, and changed records.
* Keep generated app data deterministic enough to review in diffs.

## Technical Direction

* Keep ingestion as offline tooling under `scripts/data/`; browser runtime code should consume normalized outputs, not raw wiki snapshots or fetchers.
* Use `data/source-snapshots/` for raw captures, `data/generated/` for normalized artifacts, and `data/qa/` for validation reports.
* Treat the Guild Wars Wiki MediaWiki API as the primary source interface.
* Prefer batched `action=query&prop=revisions` requests with `rvslots=main` and revision metadata for raw page wikitext.
* Store page title, page id, revision id, source URL, source revision timestamp, retrieved timestamp, and content hash with raw and generated records where practical.
* Use continuation handling, retries/backoff, `maxlag`, and a descriptive User-Agent for polite API usage.
* Use `Guild Wars Wiki:Game integration/Skills/*` as the initial canonical skill-id enumeration source; use profession/category pages as QA cross-checks.
* Prefer a Python ingestion/parser path with `mwparserfromhell` for local wikitext template extraction unless a stronger TypeScript parser proves out.
* Do not rely on regex-only parsing for nested wiki templates.
* Use `action=parse` or `action=expandtemplates` sparingly for hard template expansion and QA comparisons, not as the default per-page extraction path.
* Resolve icons through `prop=imageinfo`; `prop=images` can miss default infobox icons, so derive candidate files from explicit `image=` fields or `File:{name}.jpg` / `File:{name}.png`.

## Initial Grooming Targets

* API client with batching, continuation, retry/backoff, maxlag handling, and request logging.
* Raw snapshot writer that records provenance without committing high-churn source payloads by default.
* Normalized artifact writer that emits deterministic, sorted JSON compatible with `src/domain` contracts.
* Skill id enumerator for the game-integration pages.
* Template extraction proof for `Skill infobox`, `Skill progression`, `gr`, `gr2`, title-rank progression, redirects, PvE/PvP wrappers, and disambiguation preambles.
* Icon resolver and QA checks for missing, duplicate, or ambiguous icon files.
* QA reports for missing required fields, duplicate ids, unknown template params, unresolved redirects, missing icons, and changed records.
* One documented regenerate command that runs fetch/snapshot, normalize, validate, and report phases.

## Done When

* Data can be regenerated with one documented command.
* Generated data includes provenance and validation output.
* Content epics can plug their extractors into a shared pipeline.

## Notes

The source pipeline is foundational. Avoid one-off scrapers per content type if a shared MediaWiki/template parser can handle the common cases.

Prefer a small, tested ingestion spine first. Content epics should add extractors to the shared pipeline rather than create separate source-fetching workflows.
