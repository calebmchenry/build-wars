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

## Policy Defaults

* Build Wars is intended to be free and public, so default to conservative reuse and explicit provenance.
* Commit small, deterministic normalized JSON when it is needed by the app or tests.
* Keep raw source snapshots ignored by default under `data/source-snapshots/`; commit only policy/readme files or deliberately minimized fixtures.
* Keep generated QA reports ignored by default under `data/qa/` unless a later ticket explicitly marks a report as stable documentation.
* Do not cache icon image files in-repo initially. Store icon file titles, URLs, mime type, size, timestamp, and sha1 from MediaWiki `imageinfo`; add file caching later only if offline/PWA support requires it.
* Wiki-derived skill descriptions may be stored in generated data only with source URL, page id, revision id, source revision timestamp, retrieved timestamp, and source/license metadata.
* Generated records must distinguish factual IDs/metadata, copied source text, derived/normalized values, and manual overrides.
* Guild Wars Wiki content can mix GFDL contributor text with ArenaNet/NCSoft-owned game content that is not automatically GFDL; records should preserve source classification where known and flag ambiguous cases for review.
* PvX/Fandom/community content should be metadata-and-link-only for now. Do not copy guide prose, ratings text, usage notes, or large page bodies until a separate policy decision covers licensing and attribution.
* Screenshots and prior-art images stay as development references, not runtime app assets, unless a later ticket explicitly approves use and attribution.

## Initial Grooming Targets

* Attribution/provenance schema for generated records and source snapshots.
* Commit/ignore policy for raw snapshots, normalized generated data, QA reports, fixtures, and icon files.
* Source classification rules for Guild Wars Wiki contributor text, ArenaNet/NCSoft game content, public-domain/GFDL-compatible material, and ambiguous/unknown content.
* Manual review checklist for copied descriptions, icons, screenshots, PvX/Fandom metadata, and generated diffs.
* QA report requirements for missing provenance, stale revisions, ambiguous license/source status, manual overrides, and copied text without attribution.
* Public release checklist covering attribution display, source links, generated-data notices, and license notes.

## Done When

* Every content epic has a clear source policy.
* Generated records include source and revision metadata.
* QA output can identify missing, stale, or manually-entered data.

## Notes

Do this before copying or importing substantial content. Links and factual ids are lower risk than wholesale copied prose.

These defaults are project policy, not legal advice. If the app later publishes bundled copied prose or cached copyrighted assets, revisit this epic before release.
