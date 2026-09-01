---
id: EPIC-01
title: Source Policy and QA
track: content
status: backlog
priority: critical
depends_on:
  - EPIC-00
---

# Source Policy and QA

## Goal

Define how Build Wars uses external data, screenshots, wiki content, generated files, and attribution.

## Scope

* Decide what wiki-derived data can be cached in-repo.
* Define attribution requirements for Guild Wars Wiki, PvX/Fandom, and other tools.
* Decide whether generated data is committed or regenerated during build/release.
* Define QA standards for completeness, freshness, and source traceability.
* Document manual content review expectations.

## Done When

* Every content epic has a clear source policy.
* Generated records include source and revision metadata.
* QA output can identify missing, stale, or manually-entered data.

## Notes

Do this before copying or importing substantial content. Links and factual ids are lower risk than wholesale copied prose.
