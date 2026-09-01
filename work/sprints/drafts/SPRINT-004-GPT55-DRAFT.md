---
id: SPRINT-004
title: Professions and Attributes Catalog
status: draft
source_target: BACKLOG
source_epic: EPIC-03
source_epic_path: work/tickets/03-professions-and-attributes/EPIC.md
tickets:
  - BW-0301
  - BW-0302
  - BW-0303
  - BW-0304
  - BW-0305
  - BW-0306
created: 2026-09-01
---

# Sprint 004: Professions and Attributes Catalog

## Overview

This sprint executes `EPIC-03 Professions and Attributes` by turning the completed EPIC-02
ingestion platform into the first production catalog pipeline for Build Wars. It widens the
framework-neutral domain contracts, extracts profession and attribute facts from verified Guild Wars
Wiki snapshots, preserves skill-template profession and attribute IDs, generates point-allocation
support data, runs source-policy QA, and promotes only explicitly approved generated paths.

The sprint is a content/data catalog increment, not a browser UI sprint, not the skill catalog, not a
template-code decoder, and not the EPIC-06 rule engine. It must produce enough durable data for
later selectors, template compatibility, and attribute validation without coupling runtime code to
wiki APIs, raw snapshots, QA reports, or Python ingestion internals.

The sprint depends on `SPRINT-001` through `SPRINT-003` being complete. EPIC-02 is the architectural
base: all new source work plugs into `scripts/data/build_wars_ingest`, consumes snapshots rather than
live clients inside extractors, writes canonical JSON through the existing artifact writer, and maps
diagnostics into the existing QA report contracts.

## Use Cases

1. **Render profession and attribute selectors later**: A future UI can load one approved catalog and
   display the ten playable professions, abbreviations, campaign availability, primary attributes,
   and profession-owned attributes.
2. **Decode skill templates later**: EPIC-05 can map template profession IDs and attribute IDs to
   catalog records and back, including profession ID `0` as the `None` sentinel.
3. **Validate attribute allocations later**: EPIC-06 can use point-cost totals, level point totals,
   quest reward metadata, ownership, and primary-only flags without scraping wiki pages.
4. **Regenerate data deterministically**: A maintainer can run fixture/offline regeneration and get
   stable artifacts, manifests, QA finding IDs, and summaries from fixed inputs and a fixed clock.
5. **Refresh source data deliberately**: A maintainer can run a bounded live refresh for named source
   pages, inspect revision metadata and QA output, and promote only reviewed generated results.
6. **Audit source-derived runtime data**: A reviewer can trace generated records to source snapshots,
   source references, field-level provenance claims, manual-review decisions, and QA findings.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Domain contracts | Plain-data catalog types for professions, attributes, template crosswalks, point rules, quest rewards, catalog version metadata, and metadata-only icons. | React state, UI selectors, runtime fetches, local storage, rule-engine functions, and template encoding/decoding logic. |
| Ingestion | Snapshot-driven extractors under the EPIC-02 package for template IDs, professions, attributes, icons, point costs, level totals, and quest metadata. | A separate scraper, browser automation, ad hoc network code, cached media bytes, or direct app imports from scripts. |
| Generated data | One canonical EPIC-03 catalog artifact, a generated manifest, full QA output, and a sanitized promotion summary if it contains no prohibited source payload. | Broad generated-data commits, raw snapshot commits, full QA report promotion by default, or copied wiki/community prose. |
| Verification | Offline Python tests, Vitest contract tests, deterministic regeneration checks, QA gates, and `npm run verify`. | CI live network requirements or correctness claims based only on planning-time source metadata. |
| Closeout | Ticket, epic, sprint, ledger, and documentation updates after validation passes. | Starting EPIC-04 skills, EPIC-05 template compatibility, EPIC-06 validation enforcement, or EPIC-08 editor UI. |

### Data Ownership

| Concern | Owner | Boundary |
| --- | --- | --- |
| Browser runtime | `src/app` | May consume only approved generated data in a later or explicit promotion step; must not import source APIs, Python modules, raw snapshots, or QA reports. |
| Domain contracts | `src/domain` | Framework-neutral TypeScript interfaces and branded IDs; no React, DOM, storage, network, filesystem, or ingestion imports. |
| Ingestion tooling | `scripts/data/build_wars_ingest` | Source profiles, snapshot loading, parsing, extraction, normalization, artifact writing, and QA. |
| Source snapshots | `data/source-snapshots` or command `--root` equivalent | Ignored source payloads plus `SourceSnapshotManifest` records; implementation facts must come from verified snapshots. |
| Generated catalog | `data/generated/epic-03` | Canonical normalized JSON plus manifest; committed only through exact-path allowlisting after QA closeout. |
| QA reports | `data/qa/epic-03` | Internal validation reports by default; only sanitized summaries may be promoted if this sprint approves exact paths. |
| Policy/docs | `compendium`, `data/*/README.md`, `scripts/data/README.md` | Source policy, artifact retention, regeneration, and closeout rules. |

### Catalog Shape

Use skill-template IDs as stable catalog IDs for generated profession and attribute records unless
implementation finds a verified conflict. Do not compact IDs. The profession `None` value remains a
template crosswalk sentinel and must not become one of the ten playable `Profession` records. Build
records should continue using `null` where no profession is selected.

The generated EPIC-03 artifact should be one catalog envelope with stable sections:

- `schemaVersion`, `catalogVersion`, `generatedAt`, `generator`, `profile`, `sources`, and
  `snapshotManifestPaths`.
- `professions`: exactly ten playable records with ID, template ID, name, abbreviation, campaign
  availability, primary attribute ID, icon metadata or icon reference, and provenance.
- `attributes`: every attribute listed by the skill template format with ID, template ID, name,
  profession ownership, `isPrimary`, primary-only availability, optional reviewed primary-effect
  summary, and provenance.
- `templateCrosswalk`: profession and attribute template mappings, including the profession `0`
  sentinel and non-contiguous attribute IDs.
- `attributePointRules`: rank point costs, level point totals, attribute quest rewards, default
  level-20 assumptions, and any explicitly deferred PvP or hero assumptions.
- `remoteMedia`: metadata-only icon records with `cachedBytes: false`, source IDs, remote file
  identity, canonical URL, MIME type, dimensions, remote timestamp, and remote SHA-1 when available.

The artifact can include derived summaries only when field-level provenance distinguishes factual
metadata, derived values, copied contributor text, and publisher-owned material. Inherent primary
attribute effect summaries should be maintainer-authored derived summaries with manual-review records
unless implementation explicitly decides to exclude them or obtains reviewed approval for copied text.

### Source Strategy

The primary source candidates are `Skill template format`, `Profession`, `Attribute`, and
`Attribute point`. Implementation must fetch and verify fresh snapshots in live/offline workflows
before treating them as authoritative. Planning-time source metadata is only a hint.

Source priority:

1. `Skill template format` is authoritative for template profession IDs, the profession `None`
   sentinel, template attribute IDs, and intentional ID gaps.
2. `Profession` is authoritative for the ten playable professions, abbreviations, campaign
   availability, and primary attribute relationships when the structured data is present.
3. `Attribute` is authoritative for attribute ownership and primary-only restrictions when the
   structured data is present.
4. `Attribute point` is authoritative for rank costs, level totals, quest rewards, and default
   level-20 point assumptions when the structured data is present.
5. Linked profession, attribute, quest, or file pages may be fetched only to fill missing structured
   facts, resolve redirects, or obtain metadata-only icon data.

Conflicting or missing source facts should become QA findings rather than silent manual correction.
Manual overrides are allowed only with reviewer, scope, rationale, evidence, superseded claim IDs,
and follow-up tickets where needed.

### Data Flow

```text
source profile for EPIC-03
  -> live MediaWiki fetch for named pages only
  -> SourceSnapshotManifest + ignored raw payload
  -> snapshot-driven template/profession/attribute/point/icon extractors
  -> normalized catalog records + diagnostics
  -> canonical EPIC-03 catalog JSON + GeneratedArtifactManifest
  -> QaReport JSON + bounded summary
  -> exact-path promotion after QA and manual review
  -> later app, template, and rule-engine consumers
```

Extractors must accept loaded snapshot payloads and source references as inputs. They must not own
network access. Live mode fetches snapshots first, then runs the same snapshot-driven stages used by
offline and fixture modes.

### QA Gate

Blocking or review-required findings must be generated for:

- duplicate or missing template profession IDs, duplicate or missing template attribute IDs, malformed
  table rows, unresolved links, and unexpected ID compaction
- missing profession `0` sentinel in the crosswalk or accidental promotion of that sentinel as a
  playable profession
- fewer or more than ten playable professions
- attributes missing from the skill template format, unowned attributes without an explicit exception,
  or invalid primary-only flags
- missing primary attributes, profession/attribute ownership contradictions, and unresolved redirects
- missing rank costs, missing level totals, malformed quest rewards, or unsupported point assumptions
- missing source IDs, revision IDs, source revision timestamps, retrieval timestamps, or provenance
  claims
- copied-text or publisher-material risk in primary-effect summaries
- cached icon bytes, unresolved required icon metadata, unexpected media MIME types, or media records
  with `cachedBytes` other than `false`
- artifact digest mismatches, unreadable artifacts, schema-shape errors, non-deterministic generated
  diffs, and source-family drift

Critical open findings block app consumption and public release. Error findings block public release.
Warning findings require bounded review. Unknown copied material, digest mismatch, unreadable
artifacts, and cached icon bytes are not acceptable for public release scope.

### Promotion Paths

Preferred exact-path promotion target:

- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`

Optional sanitized closeout target, only if it contains no copied source payload, secret, cached
media, or unreviewed prose:

- `data/qa/epic-03/professions-attributes.catalog.qa.summary.txt`

Default ignored paths:

- all raw source snapshots and snapshot manifests unless a later explicit ticket narrows the scope
- full QA JSON under `data/qa/epic-03/`
- live refresh outputs under `work/runs/data-ingestion`
- icon binaries, screenshots, thumbnails, and other media bytes

The runtime app must not read raw snapshots or QA reports. A later consumer may import the promoted
catalog JSON or a small TypeScript adapter around it, but this sprint should not build UI behavior.

## Implementation

### Phase 1: BW-0301 Catalog Contract Extensions

**Files:**

- `src/domain/catalog.ts`
- `src/domain/ids.ts`
- `src/domain/source.ts` only if existing provenance/media contracts are insufficient
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/foundation.ts`
- `work/tickets/03-professions-and-attributes/BW-0301-catalog-contract-extensions.md`

**Tasks:**

- [ ] Add plain-data contract shapes for profession catalog records, attribute catalog records,
      template crosswalk records, remote icon metadata references, attribute point costs, level point
      totals, quest rewards, default build-editor assumptions, and catalog version metadata.
- [ ] Keep `ProfessionId` and `AttributeId` numeric and JSON-compatible; preserve unknown IDs and
      non-contiguous IDs through round trips.
- [ ] Represent profession template ID `0` as a crosswalk sentinel with `catalogId: null`, not as a
      playable profession.
- [ ] Add explicit fields for primary attribute ownership and primary-only availability rather than
      requiring future rules to infer them from display labels.
- [ ] Model inherent primary-effect summaries as optional, field-provenance-bearing values that can
      be excluded or manually reviewed if copied-text risk remains unresolved.
- [ ] Export new contracts from `src/domain/index.ts`.
- [ ] Add focused Vitest coverage for JSON round trips, sentinel representation, non-contiguous
      attribute IDs, and backward-compatible build fixtures.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/contracts.test.ts test/domain/data-ingestion-contracts.test.ts`

### Phase 2: BW-0302 Template ID Crosswalk

**Files:**

- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/template_ids.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_template_ids.py`
- `test/fixtures/data-ingestion/professions-attributes/skill-template-format.wiki`
- `work/tickets/03-professions-and-attributes/BW-0302-template-id-crosswalk.md`

**Tasks:**

- [ ] Add an EPIC-03 source profile that names `Skill template format` as the primary source for
      profession and attribute template IDs.
- [ ] Extract bidirectional profession template mappings, including ID `0` for `None` and all ten
      playable profession IDs.
- [ ] Extract bidirectional attribute template mappings and preserve gaps as intentional unmapped
      IDs, not as errors caused by compaction.
- [ ] Normalize target titles and display names without copying page-body prose.
- [ ] Emit diagnostics for duplicate IDs, duplicate names, malformed rows, missing targets,
      unexpected gaps, unresolved redirects, and unrecognized table structure.
- [ ] Cover ordinary rows, sentinel rows, non-contiguous attributes, duplicates, malformed rows, and
      missing linked targets with minimized offline fixtures.

**Verification:**

- `npm run data:test`
- Fixture regeneration produces stable crosswalk output under a fixed clock.

### Phase 3: BW-0303 Profession and Attribute Extractors

**Files:**

- `scripts/data/build_wars_ingest/professions.py`
- `scripts/data/build_wars_ingest/attributes.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_professions.py`
- `scripts/data/build_wars_ingest/tests/test_attributes.py`
- `test/fixtures/data-ingestion/professions-attributes/profession.wiki`
- `test/fixtures/data-ingestion/professions-attributes/attribute.wiki`
- `test/fixtures/data-ingestion/professions-attributes/imageinfo.json`
- `work/tickets/03-professions-and-attributes/BW-0303-profession-attribute-extractors.md`

**Tasks:**

- [ ] Extract the ten playable professions from verified snapshots with name, abbreviation, campaign
      availability, template ID, primary attribute ID, and source references.
- [ ] Cross-check generated professions against the template crosswalk and block promotion if any
      playable profession is missing, duplicated, or mismapped.
- [ ] Extract every listed attribute with name, template ID, profession ownership, primary status,
      primary-only availability, and source references.
- [ ] Cross-check attributes against the template crosswalk and block promotion if an attribute is
      missing, duplicated, compacted, or assigned to the wrong profession.
- [ ] Resolve profession and attribute icons through the existing metadata-only icon resolver.
- [ ] Carry field-level provenance claims for names, IDs, ownership, campaigns, icons, and any
      derived primary-effect summary.
- [ ] Emit QA diagnostics instead of hard-coded fixes for redirects, missing structured values,
      source contradictions, and ambiguous icon candidates.

**Verification:**

- `npm run data:test`
- Offline extractor tests cover all ten professions, all fixture attributes, campaign groups,
  primary-only flags, ownership cross-checks, redirects, missing facts, icon metadata, and source
  contradictions.

### Phase 4: BW-0304 Attribute Points and Quest Metadata

**Files:**

- `scripts/data/build_wars_ingest/attribute_points.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_attribute_points.py`
- `test/fixtures/data-ingestion/professions-attributes/attribute-point.wiki`
- `work/tickets/03-professions-and-attributes/BW-0304-attribute-points-and-quests.md`

**Tasks:**

- [ ] Extract the point cost needed to reach attribute ranks `0` through `12` and make rank `0`
      explicitly cost `0`.
- [ ] Extract level-based total attribute points for levels `1` through `20`.
- [ ] Extract the two attribute-point quest rewards per relevant campaign from verified source
      rows or linked quest pages, including quest title, campaign, reward points, native-character
      limitation, and source references.
- [ ] Record default level-20 assumptions needed by the MVP build editor, including level 20 without
      attribute quests and level 20 with all attribute quests completed.
- [ ] Represent PvP character and hero assumptions now only if the source facts are stable and needed
      by near-term validation; otherwise add explicit deferred fields/notes so future rules do not
      infer missing data.
- [ ] Emit diagnostics for malformed cost rows, missing ranks, missing levels, impossible reward
      totals, ambiguous campaign labels, and unsupported assumptions.

**Verification:**

- `npm run data:test`
- Offline tests cover rank `0`, rank `12`, overspend boundaries, level `20` with and without quests,
  malformed rows, missing quest rewards, and deferred PvP/hero assumptions.

### Phase 5: BW-0305 Generated Catalog QA and Exact-Path Promotion

**Files:**

- `scripts/data/build_wars_ingest/profession_attribute_catalog.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profession_attribute_catalog.py`
- `.gitignore`
- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`
- `data/qa/epic-03/professions-attributes.catalog.qa.summary.txt` if sanitized and approved
- `work/tickets/03-professions-and-attributes/BW-0305-generated-catalog-qa-and-promotion.md`

**Tasks:**

- [ ] Assemble the EPIC-03 catalog envelope from crosswalk, profession, attribute, icon, point, and
      quest records.
- [ ] Write canonical JSON and `GeneratedArtifactManifest` using the existing artifact writer.
- [ ] Add an EPIC-03 fixture regeneration path while keeping `npm run data:regenerate` fast and
      offline.
- [ ] Add optional offline/live modes for EPIC-03 that require existing snapshots or explicit
      `--allow-live-network` with named titles.
- [ ] Add QA checks for source ID resolution, provenance completeness, record counts, sentinel
      handling, ID gaps, ownership consistency, point-table completeness, icon metadata, copied-text
      risk, schema shape, digest integrity, and deterministic diffs.
- [ ] Run fixture regeneration twice with a fixed clock and confirm byte-identical catalog,
      manifest, QA report, and summary outputs.
- [ ] Add exact `.gitignore` unignore rules for only the approved generated catalog and manifest
      paths, plus a sanitized QA summary only if it passes source-policy review.
- [ ] Keep raw source snapshots, full QA JSON, live outputs, icon bytes, and unreviewed copied text
      ignored or excluded.

**Verification:**

- `npm run data:regenerate`
- `npm run data:test`
- Byte comparison of two fixed-clock EPIC-03 fixture regeneration runs.
- Optional bounded manual live refresh for `Skill template format`, `Profession`, `Attribute`, and
  `Attribute point` after implementation is stable.

### Phase 6: BW-0306 Docs, Verification, and Closeout

**Files:**

- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/data-qa-and-release.md` only if gate behavior changes
- `compendium/source-policy.md` only if a recorded policy decision changes
- `work/sprints/SPRINT-004.md`
- `work/sprints/ledger.tsv`
- `work/tickets/03-professions-and-attributes/EPIC.md`
- `work/tickets/03-professions-and-attributes/BW-0301-catalog-contract-extensions.md`
- `work/tickets/03-professions-and-attributes/BW-0302-template-id-crosswalk.md`
- `work/tickets/03-professions-and-attributes/BW-0303-profession-attribute-extractors.md`
- `work/tickets/03-professions-and-attributes/BW-0304-attribute-points-and-quests.md`
- `work/tickets/03-professions-and-attributes/BW-0305-generated-catalog-qa-and-promotion.md`
- `work/tickets/03-professions-and-attributes/BW-0306-docs-verification-and-closeout.md`

**Tasks:**

- [ ] Document the EPIC-03 catalog shape, exact generated paths, regeneration commands, QA summary
      location, ignored artifact policy, and live-refresh boundaries.
- [ ] Document downstream dependency expectations for EPIC-04 skills, EPIC-05 template
      compatibility, EPIC-06 game rules, and EPIC-08 build editor.
- [ ] Record source pages, revision metadata location, source-policy decisions, manual-review
      outcomes, and deferred assumptions.
- [ ] Run `npm run verify` after code, data, docs, and promotion changes are complete.
- [ ] Move tickets, EPIC, sprint, and ledger statuses to `done` only after verification and QA
      closeout pass.

**Verification:**

- `npm run verify`
- Manual review of ticket, epic, sprint, ledger, docs, generated paths, and QA closeout consistency.

## Files Summary

Planned implementation files:

- `src/domain/catalog.ts`
- `src/domain/ids.ts`
- `src/domain/source.ts`
- `src/domain/index.ts`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/template_ids.py`
- `scripts/data/build_wars_ingest/professions.py`
- `scripts/data/build_wars_ingest/attributes.py`
- `scripts/data/build_wars_ingest/attribute_points.py`
- `scripts/data/build_wars_ingest/profession_attribute_catalog.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/qa.py`

Planned test and fixture files:

- `test/domain/contracts.test.ts`
- `test/domain/data-ingestion-contracts.test.ts`
- `test/fixtures/foundation.ts`
- `scripts/data/build_wars_ingest/tests/test_template_ids.py`
- `scripts/data/build_wars_ingest/tests/test_professions.py`
- `scripts/data/build_wars_ingest/tests/test_attributes.py`
- `scripts/data/build_wars_ingest/tests/test_attribute_points.py`
- `scripts/data/build_wars_ingest/tests/test_profession_attribute_catalog.py`
- `test/fixtures/data-ingestion/professions-attributes/skill-template-format.wiki`
- `test/fixtures/data-ingestion/professions-attributes/profession.wiki`
- `test/fixtures/data-ingestion/professions-attributes/attribute.wiki`
- `test/fixtures/data-ingestion/professions-attributes/attribute-point.wiki`
- `test/fixtures/data-ingestion/professions-attributes/imageinfo.json`
- `test/fixtures/data-ingestion/generated/fixture-professions-attributes-catalog.json`

Planned generated and policy files:

- `.gitignore`
- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`
- `data/qa/epic-03/professions-attributes.catalog.qa.summary.txt` if approved
- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/data-qa-and-release.md` if gate behavior changes
- `compendium/source-policy.md` if policy decisions change

Planned ticket-burn and closeout files:

- `work/sprints/SPRINT-004.md`
- `work/sprints/ledger.tsv`
- `work/tickets/03-professions-and-attributes/EPIC.md`
- `work/tickets/03-professions-and-attributes/BW-0301-catalog-contract-extensions.md`
- `work/tickets/03-professions-and-attributes/BW-0302-template-id-crosswalk.md`
- `work/tickets/03-professions-and-attributes/BW-0303-profession-attribute-extractors.md`
- `work/tickets/03-professions-and-attributes/BW-0304-attribute-points-and-quests.md`
- `work/tickets/03-professions-and-attributes/BW-0305-generated-catalog-qa-and-promotion.md`
- `work/tickets/03-professions-and-attributes/BW-0306-docs-verification-and-closeout.md`

## Definition of Done

- `BW-0301` through `BW-0306` are completed in dependency order and linked to `SPRINT-004`.
- `EPIC-03`, all EPIC-03 tickets, `SPRINT-004`, and `work/sprints/ledger.tsv` use the repository
  status vocabulary and are updated only after verification passes.
- Domain contracts remain plain JSON-compatible TypeScript with no app, browser, network,
  filesystem, or ingestion imports.
- The generated catalog contains exactly ten playable professions.
- The template crosswalk maps profession template IDs to names and catalog IDs in both directions,
  including profession ID `0` as `None` with no playable catalog record.
- The generated attribute records cover every attribute listed by the skill template format and
  preserve non-contiguous template IDs without compaction.
- Profession ownership, primary attributes, primary-only flags, campaign availability, and
  metadata-only icon records are represented with provenance.
- Attribute rank costs, level point totals, quest reward metadata, and default level-20 assumptions
  are represented for future validation.
- Generated records, media metadata, manifests, and promoted summaries carry source IDs and
  provenance that resolve.
- QA reports identify source, parsing, rights, copied-text, metadata, schema, integrity, and
  deterministic-diff issues with stable finding IDs and gate decisions.
- No icon binaries, screenshots, raw snapshots, full QA JSON, or unreviewed copied prose are
  committed or consumed by runtime code.
- Exact promoted generated paths are allowlisted without relying on `git add -f`.
- Fixture mode remains fast, offline, deterministic, and included in `npm run verify`.
- A bounded live refresh path exists and is documented, but CI does not require network access.
- `npm run verify` passes.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Wiki table structure differs from planning assumptions. | Build extractor tests from minimized fixtures, emit structure diagnostics, and require fresh snapshots before promotion. |
| Template IDs are accidentally compacted or conflated with display order. | Use template IDs as first-class numeric values, preserve gaps, and add tests for sentinel `0` and non-contiguous attribute IDs. |
| Profession `None` leaks into playable profession selectors. | Represent ID `0` only in the template crosswalk with `catalogId: null`; assert exactly ten playable professions. |
| Source pages disagree about ownership or primary attributes. | Establish source priority, retain conflicting evidence, and block or require review instead of silently choosing one. |
| Primary-effect summaries copy protected or contributor-authored text. | Prefer maintainer-authored derived summaries with field-level provenance and manual review; exclude summaries if review cannot close. |
| Icon handling accidentally commits media bytes. | Use metadata-only resolver, assert `cachedBytes: false`, keep media roots ignored, and QA-block cached bytes. |
| Generated data promotion becomes too broad. | Name exact allowlisted files and required parent unignore rules; leave snapshots, full QA JSON, live outputs, and media bytes ignored. |
| Attribute point rules drift into EPIC-06 validation logic. | Store data and assumptions only; defer enforcement algorithms and user-facing validation to EPIC-06. |
| Live refresh makes verification slow or flaky. | Keep `npm run verify` fixture-only and offline; make live refresh manual, named-page, bounded, and documented. |

## Security Considerations

- Continue using the fixed Guild Wars Wiki API origin and GET-only parameterized requests from the
  EPIC-02 client; do not accept arbitrary fetch URLs.
- Treat all wiki payloads as untrusted input. Parse as data, bound evidence snippets, and never
  execute source content.
- Keep path confinement, safe slugs, atomic writes, SHA-256 digests, and manifest validation for
  snapshots and generated artifacts.
- Do not log raw wikitext bodies, headers, secrets, local environment values, or unbounded source
  payloads.
- Keep live network access explicit through `--allow-live-network` and named source titles.
- Keep raw snapshots, full QA reports, and live refresh outputs out of runtime imports.
- Do not commit cached icon bytes, screenshots, thumbnails, or other external media assets.
- Require complete provenance and source-policy review before any source-derived generated data is
  consumed by app code or public release.

## Dependencies

- `SPRINT-001 Project Foundation` is complete for package structure, domain boundaries, synthetic
  fixtures, and `npm run verify`.
- `SPRINT-002 Source Policy and QA` is complete for provenance, material classification, media
  restrictions, retention policy, manual review, and release gates.
- `SPRINT-003 Data Ingestion Platform` is complete for the MediaWiki client, snapshots,
  `mwparserfromhell` parsing, icon metadata, canonical artifact writing, QA reports, and fixture
  regeneration.
- Python data setup uses the existing `npm run data:setup` path and pinned parser dependency.
- Primary source pages are `Skill template format`, `Profession`, `Attribute`, and
  `Attribute point`; linked pages are secondary and must be fetched as fresh verified snapshots when
  needed.
- Manual review capacity is needed for any derived primary-effect summaries, source contradictions,
  source-policy decisions, accepted-risk findings, or promoted QA summaries.
- Future consumers are EPIC-04 skills, EPIC-05 template compatibility, EPIC-06 game-rule validation,
  and EPIC-08 core build editor. They should depend on the promoted catalog, not on raw ingestion
  internals.

## Open Questions

1. Should inherent primary attribute effect summaries ship in EPIC-03 as reviewed derived summaries,
   or should the sprint exclude them until a later content-review ticket?
2. Should the sprint promote a sanitized QA summary under `data/qa/epic-03/`, or should all QA
   outputs remain ignored with only documentation closeout committed?
3. Should implementation run and record a bounded manual live refresh during this sprint, or should
   it only implement the path and keep sprint closeout fixture/offline-only?
4. Should PvP character and hero attribute-point assumptions be represented as explicit catalog data
   now, or deferred until EPIC-06 validation requirements are precise?
5. Should campaign availability use only the campaign that introduced each profession, or should it
   model broader account/character availability once a profession is unlocked?
6. If a source page uses names or abbreviations that conflict with the skill-template crosswalk,
   should template compatibility always win, or should the generated catalog block until a manual
   override is recorded?
