---
id: EPIC-02
title: Data Ingestion Platform
track: functional
status: backlog
priority: critical
depends_on:
  - EPIC-00
  - EPIC-01
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

## Done When

* Data can be regenerated with one documented command.
* Generated data includes provenance and validation output.
* Content epics can plug their extractors into a shared pipeline.

## Notes

The source pipeline is foundational. Avoid one-off scrapers per content type if a shared MediaWiki/template parser can handle the common cases.
