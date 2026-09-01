---
id: SPRINT-004
title: Professions and Attributes Catalog
status: planned
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

This sprint delivers the first source-derived, runtime-eligible Build Wars catalog: the ten playable
professions, every attribute identified by the skill template format, the relationships and
restrictions needed to choose legal attributes, and the point-budget inputs needed to validate
purchased ranks. It extends the shared EPIC-02 ingestion spine; it does not create a parallel scraper
or let the browser read raw sources, QA reports, or Python tooling.

The sprint is complete only when a fresh, bounded Guild Wars Wiki refresh has been replayed through
the same snapshot-driven extractor used by offline tests, all content-specific QA gates pass, and an
exactly allowlisted catalog is committed with its manifest and QA closeout. Synthetic fixtures prove
the pipeline offline; they are not an authority for game data. The promoted catalog carries the
source revisions and field-level provenance that justify its contents.

The principal decisions are:

- Use skill-template profession and attribute numbers as the canonical `Profession.id` and
  `Attribute.id` values. Do not introduce a second internal numeric namespace.
- Represent profession template ID `0` as the template codec's `None` sentinel, not as an eleventh
  `Profession`. Attribute ID `0` remains a valid attribute in its separate namespace. Unknown IDs
  remain distinguishable from the `None` sentinel.
- Preserve non-contiguous attribute IDs. Record collections sort numerically but are never indexed,
  counted, synthesized, or compacted as dense ranges.
- Treat `Skill template format` as the ID authority, `Profession` and `Attribute` as catalog and
  ownership authorities, and `Attribute point` as the allocation-rule authority. A source conflict
  becomes a blocking QA finding; source order never decides which value wins.
- Extend the ingestion command with a registered `professions-attributes` profile. Fixture,
  offline, and live modes use one extractor and validator path. Live mode may fetch only the
  profile's bounded, fixed-origin source plan.
- Keep the runtime catalog semantically focused. It contains professions, attributes, allocation
  inputs, source references, and record provenance; volatile generation facts stay in the generated
  artifact manifest.
- Derive `catalogVersion` from gameplay and display semantics, excluding retrieval timestamps and
  other provenance-only metadata. The artifact SHA-256 still covers every byte, so a provenance-only
  refresh changes the artifact digest without forcing authored builds onto a new semantic catalog
  version.
- Store profession icons as metadata-only `RemoteMediaMetadata` with `cachedBytes: false`. This
  sprint does not download an icon or make the browser request a remote icon.
- Write concise inherent-primary-attribute summaries in original Build Wars wording. Classify them
  as derived values, link the factual source inputs, and require named manual review; do not copy
  wiki or game-description prose.
- Model point costs as cumulative purchased-rank costs, levels as base point totals, and quest
  rewards separately. The default is a level-20 PvE player with the maximum applicable attribute
  quest reward; tests cover the expected 170-point no-quest and 200-point full-reward totals and
  block promotion if fresh verified sources disagree.
- Defer PvP-character, hero, equipment-bonus, rune, consumable, and title-specific allocation rules.
  The schema names purchased rank and PvE-player assumptions explicitly so later work cannot
  accidentally apply them to those contexts.

Out of scope:

- Profession or attribute selector UI, build-editor UI, or changes under `src/app`.
- A general build validator, template encoder/decoder, skill catalog, equipment effects, runes,
  insignias, heroes, titles, or campaign progression model.
- Runtime network requests, raw-snapshot reads, Python execution, or QA-report reads.
- Cached icons, thumbnails, screenshots, page HTML, copied descriptions, quest walkthroughs, or
  community prose.
- A generic MediaWiki query language, arbitrary live titles for this profile, or an extractor that
  silently expands its crawl from source-provided links.
- Committing full source snapshots. Source payloads and snapshot manifests remain ignored; the
  promoted artifact retains revision-addressable source facts and normalized provenance.
- Creating a version-control commit; the outer ticket-burn process owns commits.

## Use Cases

### UC-1: Build profession selectors from canonical data

A later UI can read ten playable profession records with stable numeric IDs, canonical names,
abbreviations, primary attributes, campaign availability, and metadata-only icons. Selector order is
explicit and does not depend on object-key order, wiki row order, or dense IDs.

### UC-2: Decode and encode profession template IDs safely

Template ID `0` decodes to the `None` sentinel, IDs for the ten known professions decode to catalog
records, and other numeric values remain unknown rather than being coerced. Canonical profession
names and abbreviations map back to their known template IDs without fuzzy matching.

### UC-3: Decode and encode non-contiguous attribute IDs

Every attribute listed by the verified skill-template source maps between numeric ID and canonical
name in both directions. Gaps remain absent, unknown IDs remain unknown, and attribute ID `0` is not
confused with profession ID `0`.

### UC-4: Determine which attributes a profession pair exposes

A caller can combine a primary and optional secondary profession with attribute ownership and
`isPrimary` facts. The primary profession exposes all of its attributes, the secondary profession
exposes only non-primary attributes, and unrelated attributes remain unavailable.

### UC-5: Calculate purchased-rank point cost

A validator can look up the cumulative cost for every supported purchased rank, including rank `0`
and the maximum purchased-rank boundary. The data does not mix purchased rank with effective rank
from runes, equipment, effects, or other bonuses.

### UC-6: Calculate a level-based attribute-point budget

A caller can retrieve base attribute points for each represented player level and add applicable
quest rewards separately. Level 20 without quest rewards and level 20 with the default maximum quest
reward are explicit, tested scenarios rather than hidden constants in UI code.

### UC-7: Inspect quest and default-assumption metadata

A maintainer can trace each normalized attribute-point quest fact to a source revision. A later
character-progression feature can distinguish individual quests, while the current build editor can
use the documented level-20 PvE default without pretending to know a character's origin or quest log.

### UC-8: Display reviewed primary-attribute context

A later UI can show a short, original summary for each inherent primary-attribute effect. Each
summary has derived-value provenance and named review evidence, and no copied source description is
embedded in the catalog.

### UC-9: Regenerate and review the catalog coherently

A maintainer can run the registered profile in fixture mode without a network, in offline mode from
selected verified snapshots, or in explicit live mode against the fixed Guild Wars Wiki API origin.
All modes feed the same crosswalk, extractor, normalizer, artifact writer, and QA validators.

### UC-10: Promote only a reviewed runtime artifact

A release reviewer can compare the candidate with the previous approved catalog, distinguish
semantic changes from provenance-only changes, inspect blocking and review-required findings, and
allowlist only the named catalog, manifest, and QA report paths after both app-consumption and
public-release gates pass.

## Architecture

### Boundary and data flow

```text
registered professions-attributes source plan
  -> MediaWikiClient (explicit live mode only)
  -> immutable ignored snapshots + SourceSnapshotManifest records
  -> template crosswalk + profession/attribute/rule extractors
  -> cross-source reconciliation + original derived summaries
  -> ProfessionAttributeCatalog + diagnostics
  -> canonical artifact + GeneratedArtifactManifest
  -> profile validators + baseline classification + QaReport
  -> exact-path promotion after review

src/domain helpers -> accept the approved plain-data catalog
src/app             -X-> scripts/data | wiki API | snapshots | QA reports
```

The ingestion profile owns source acquisition and normalization. `src/domain` owns the public
plain-data contract and pure lookup semantics. The generated catalog is the only boundary between
them. No Python module imports TypeScript, and no TypeScript runtime module imports Python or raw
artifacts.

### Catalog contract

Add a versioned `ProfessionAttributeCatalog` envelope with these semantic sections:

| Section | Required content | Invariants |
| --- | --- | --- |
| Identity | `schemaVersion`, content-derived `catalogVersion` | Schema version is explicit; catalog version changes only when gameplay/display semantics change |
| Sources | Aggregate `SourceReference` records | IDs are unique; every provenance claim and media `sourceId` resolves |
| Template format | Profession `None` sentinel metadata and codec version | Sentinel ID is exactly `0`; it is absent from playable professions |
| Professions | Ten `Profession` records | IDs/names/abbreviations unique; primary attribute resolves and belongs to the profession |
| Attributes | Every template-listed `Attribute` record | IDs/names unique; source gaps preserved; ownership and primary flag reconcile |
| Allocation rules | Purchased-rank costs, level totals, quest facts, and default PvE assumptions | Costs/totals are cumulative and monotonic; defaults are derived from represented inputs |

Extend `Profession` with a precise campaign-availability value and `RemoteMediaMetadata | null` icon.
Campaign data distinguishes the source's profession family (`core`, `factions`, or `nightfall`) from
the standalone campaigns in which a character may be created. This avoids treating “core” as a
campaign or confusing character creation with later travel.

Extend `Attribute` with `inherentEffectSummary: string | null`. It is non-null only for a verified
primary attribute and is covered by a field-level derived provenance claim and manual review. Keep
ownership as `professionId` plus `isPrimary`; do not encode primary-only restrictions in a second,
potentially divergent table.

Represent allocation rules once at catalog scope:

- `maxPurchasedRank` names the unmodified point-purchased boundary.
- `cumulativePointCosts` contains one `{ rank, points }` entry for every supported purchased rank.
  Incremental costs are calculated by subtracting adjacent cumulative values rather than stored as
  duplicate facts.
- `basePointsByLevel` contains one `{ level, points }` entry for every supported PvE player level.
- `attributePointQuests` stores a stable normalized ID, canonical quest name, campaign/eligibility
  metadata supported by the source, reward points, and provenance. It does not store objectives,
  dialogue, walkthroughs, or prose.
- `maximumQuestBonusPoints` states the source-derived cap without claiming one universal pair of
  quests applies to every character origin.
- `defaultPvePlayer` stores level `20` and a `maximum-applicable` quest-reward policy. Budget helpers
  derive totals from the level table and quest cap instead of storing a second total that can drift.

Existing synthetic fixtures migrate in the same phase as required contract fields. Domain contracts
remain JSON-compatible and framework-neutral.

### ID and lookup semantics

The artifact does not store redundant name-to-ID and ID-to-name dictionaries. Profession and
attribute records are the canonical crosswalk; pure domain helpers build indexes and reject
collisions. This removes a long-term opportunity for two serialized maps to disagree.

Lookup behavior is explicit:

- `professionForTemplateId(0)` returns the `None` result, not a catalog record.
- A known nonzero profession ID returns its record; any other numeric value returns `unknown` with
  the original value preserved.
- `professionTemplateIdForName("None")` returns the sentinel `0`; canonical profession names and
  explicit abbreviations return their known IDs.
- Attribute lookups operate in the attribute namespace, where `0` may be a valid record.
- Reverse lookups use trimmed ASCII case normalization for canonical names and explicit
  abbreviations only. No punctuation stripping, substring matching, locale-dependent folding, or
  undocumented aliasing is allowed.
- Name or abbreviation collisions are blocking catalog errors.
- Callers never address a catalog collection by array offset. Numeric ID and source order are not
  interchangeable.

These helpers prove selector and template-compatibility inputs without implementing the later full
template codec. Unknown authored IDs remain representable under the EPIC-00 contract.

### Source authority and reconciliation

| Fact | Primary authority | Cross-check | Conflict behavior |
| --- | --- | --- | --- |
| Profession template IDs and `None` | `Skill template format` snapshot | `Profession` snapshot | Block; never renumber from list position |
| Attribute template IDs and names | `Skill template format` snapshot | `Attribute` snapshot | Block; retain gaps and every candidate row |
| Playable profession membership and abbreviations | `Profession` snapshot | Template crosswalk and bounded profession pages | Block missing, extra, duplicate, or divergent records |
| Attribute ownership and primary-only status | `Attribute` snapshot | Profession primary-attribute facts and bounded attribute pages | Block orphaned, conflicting, or multiple-primary relationships |
| Profession campaign availability | `Profession` and bounded profession-page snapshots | Internal campaign/family invariants | Block unknown semantics; do not guess from profession ID |
| Rank costs, level totals, and quest rewards | `Attribute point` and explicitly named quest snapshots | Arithmetic and boundary validators | Block omissions, non-monotonic values, or inconsistent totals |
| Icon metadata | Profession-page icon fact plus MediaWiki `imageinfo` | Unique candidate and source-reference checks | Block promotion when a required icon remains missing or ambiguous |
| Primary effect factual inputs | Bounded primary-attribute page snapshots | Named manual review of original summary | Exclude copied wording; block missing review or unsupported claims |

Extractors retain all candidate rows and diagnostics. No source row may disappear without producing a
normalized record, a deliberate exclusion with evidence, or a scoped QA finding. Redirects and
normalized MediaWiki titles are reconciled by page identity, not string replacement.

Fresh snapshots are required during execution because planning-time observations are not release
evidence. The live profile begins with the four named seed pages from the sprint intent and may use a
locked list of the ten profession pages, the primary-attribute pages, and the exact quest pages needed
for represented metadata. That list is finalized from a bounded source-shape proof, recorded in the
profile, and capped. The extractor must not recursively follow category members or arbitrary links.

### Ingestion profile and parsing

Refactor the current EPIC-02 hard-coded pipeline just enough to register named profiles. A profile
declares its source plan, fixture loader, snapshot selector, extractor, artifact paths, schema-owned
sort keys, and validators. The existing skill-ID proof remains a registered profile with unchanged
fixture output and tests.

Add one `professions_attributes.py` module for content-specific extraction and normalization. Reuse
the shared client, snapshot store, `mwparserfromhell` adapter, icon resolver, canonical writer, QA
report builder, and CLI. If the verified pages require wikitable parsing, add one bounded table
adapter that preserves row/cell order and parses nested cell values through `mwparserfromhell`.
Flat table framing may use a state machine; nested wiki markup must not be parsed with regex-only
logic.

Profile behavior by mode:

- `fixture`: reads minimized, wholly synthetic pages and file metadata under
  `test/fixtures/data-ingestion/professions-attributes`; uses a fixed clock and no network.
- `offline`: loads only the exact snapshot manifests selected for this profile/run. It must not scan
  all snapshots and infer content type from titles.
- `live`: requires `--allow-live-network`, uses only the fixed Guild Wars Wiki API origin and the
  registered bounded source plan, writes ignored snapshots, then invokes the offline extractor path.

The profile name is required when a mode could otherwise select the wrong artifact. Existing default
commands remain backward compatible, and canonical verification runs all committed fixture profiles
offline.

### Provenance, text, and media

IDs, names, abbreviations, campaign facts, relationships, numeric rules, quest names, and reward
values are normalized factual metadata with field claims pointing to revision-addressable sources.
Derived defaults and effect summaries identify their input source IDs and transformation notes.

Primary-effect summaries follow a separate review rule because structured pages can mix factual
mechanics, contributor prose, and publisher-owned text:

1. Extract only the bounded factual inputs needed to understand the effect.
2. Write a concise summary from scratch; do not retain a source sentence for paraphrasing in the
   artifact or fixtures.
3. Classify the field as `derived-value` with method `derived`.
4. Add a named `ManualReview` covering accuracy, originality, source scope, and release use.
5. Block promotion if the summary lacks its claim/review, is unsupported, or contains unknown copied
   material.

Profession icons remain remote metadata. The resolver may query `imageinfo` for a confirmed explicit
file or bounded default candidates, but it never follows the returned media URL. The catalog stores
file title, canonical URL, MIME type, dimensions, byte size, timestamp, remote SHA-1, `sourceId`, and
`cachedBytes: false`. Future UI work must separately decide whether and when the browser may make a
remote image request.

### Determinism, versioning, and promotion

Artifact arrays sort by schema-owned keys: professions and attributes by numeric ID, point costs by
rank, level totals by level, quests by stable ID, sources by source ID, and claims/reviews by stable
ID. Meaningful arrays such as campaign availability retain declared semantic order. JSON remains
UTF-8, LF-terminated, two-space indented, recursively key-stable, and finite-number-only.

`catalogVersion` is a SHA-256-derived identifier over a canonical semantic projection containing the
template sentinel, profession display/gameplay fields, attribute fields, and allocation rules. It
excludes provenance, retrieval/generation timestamps, manifest paths, QA paths, and its own value.
The generated artifact manifest separately records the final artifact-byte SHA-256, source IDs,
input snapshot manifests, generator, generated time, record count, QA path, and commit decision.

Baseline review classifies changes into:

- semantic changes, which update `catalogVersion` and require content review;
- provenance-only changes, which keep `catalogVersion` stable but update the artifact digest and
  require source-refresh review;
- formatting/order-only changes, which are generator defects and block promotion;
- schema changes, which require matching TypeScript/Python contract migration and tests.

The only promoted paths are:

- `data/generated/epic-03/professions-attributes.json`
- `data/generated/epic-03/professions-attributes.manifest.json`
- `data/qa/epic-03/professions-attributes.qa.json`

The catalog is the only path eligible for later runtime import. The manifest and QA report are review
evidence, not browser inputs. `.gitignore` must unignore the parent directories narrowly, re-ignore
their contents, and then unignore only these exact files. Snapshot payloads, snapshot manifests,
live-run logs, temporary candidates, and QA text summaries stay ignored.

Promotion requires a fresh live refresh, a successful offline replay from those verified snapshots,
two byte-identical candidate generations under the same clock/configuration, a reviewed baseline
diff, complete effect-summary reviews, and both QA gates at `pass`. A warning left open keeps the
candidate in `review-required`; it is not promoted merely because the command exits zero.

### Profile-specific QA gate

The profile adds validators without changing the shared `QaReport` wire format. At minimum, promotion
blocks on:

- any malformed, unaccounted-for, duplicate, or conflicting template crosswalk row;
- any profession count other than ten or a playable profession record with ID `0`;
- a missing, duplicate, or unresolved profession/attribute ID, name, or abbreviation;
- dense-ID assumptions, synthesized gap values, or profession/attribute namespace confusion;
- missing or conflicting profession ownership, primary flags, or primary-attribute references;
- missing campaign availability, required icon metadata, primary effect summary, or summary review;
- missing purchased ranks, levels, quest reward facts, maximum quest bonus, or default assumptions;
- non-monotonic costs/totals, an invalid rank boundary, or a default budget inconsistent with the
  represented tables;
- missing source/revision/retrieval facts, unresolved provenance claims, forbidden copied text,
  cached-media indicators, invalid remote media metadata, or digest/schema failure;
- an unreviewed semantic or provenance baseline diff.

Coverage information such as reserved/gap attribute IDs may be informational, but it must be stable
and must not synthesize catalog entries. Required-content omissions are errors or critical findings,
not warnings. Reports are written before the command returns a blocking exit code.

## Implementation

### Execution bookkeeping

- Confirm EPIC-00 through EPIC-02 and SPRINT-001 through SPRINT-003 are completed before execution.
- Link BW-0301 through BW-0306 to `SPRINT-004` and preserve this dependency order:
  BW-0301 -> BW-0302; BW-0301 and BW-0302 -> BW-0303; BW-0301 through BW-0303 -> BW-0304;
  BW-0301 through BW-0304 -> BW-0305; BW-0301 through BW-0305 -> BW-0306.
- Move only the active BW ticket through the repository status vocabulary. Mark the epic, sprint,
  and ledger complete only after every Definition of Done item passes.
- Keep source snapshots, exploratory output, and candidate artifacts ignored until the exact
  promotion gate in BW-0305.
- Do not create a commit.

### Phase 1 — BW-0301: Catalog contract extensions (~15% of effort)

**Files:**

- `src/domain/catalog.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `test/fixtures/foundation.ts`
- `test/domain/contracts.test.ts`
- `test/domain/profession-attribute-catalog.test.ts`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/config.py`
- `scripts/data/build_wars_ingest/models.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_profiles.py`
- `work/tickets/03-professions-and-attributes/BW-0301-catalog-contract-extensions.md`

**Tasks:**

- [ ] Define the additive plain-data types for `ProfessionAttributeCatalog`, precise profession
      campaign availability, template `None` metadata, allocation rules, quest facts, and default
      PvE-player assumptions.
- [ ] Extend `Profession` with campaign availability and metadata-only icon; extend `Attribute` with
      a nullable inherent-effect summary. Migrate all current synthetic fixtures and contract tests
      in the same change.
- [ ] Define pure catalog-index and lookup results that distinguish `none`, `known`, and `unknown`
      profession template IDs and never conflate profession ID `0` with attribute ID `0`.
- [ ] Define the semantic projection used to calculate `catalogVersion`; document exclusions and
      add order-independence/provenance-only-change tests.
- [ ] Add a narrow profile registry around the existing pipeline. Register the EPIC-02 proof profile
      without changing its public output, then reserve `professions-attributes` with explicit
      fixture/offline/live hooks and resource caps.
- [ ] Make offline selection profile-driven rather than scanning every snapshot and guessing from a
      title. Reject missing, extra, duplicate, or cross-profile manifest inputs.
- [ ] Keep CLI defaults backward compatible while making the selected profile visible in summaries,
      generated manifests, and test assertions.
- [ ] Add synthetic domain fixtures for a core profession, an expansion profession, a primary
      attribute, a secondary-available attribute, profession sentinel `0`, attribute ID `0`, an ID
      gap, and an unknown ID.

**Verification:**

- Focused Vitest tests for JSON compatibility, lookup collisions, sentinel behavior, namespace
  separation, unknown-ID preservation, non-dense indexing, campaign semantics, and allocation type
  shape.
- Offline Python tests for profile registration, exact snapshot selection, caps, wrong-profile
  inputs, and unchanged EPIC-02 fixture output.
- `npm run typecheck`, focused Vitest, and focused Python profile/pipeline tests pass.

**Phase acceptance:**

- Domain consumers can represent the full sprint output without importing data tooling or JSON
  implementation details.
- One registered-profile path supports existing and new ingestion work; no profession-specific
  client, writer, QA format, or command is introduced.
- No authoritative game value is asserted from a synthetic fixture.

### Phase 2 — BW-0302: Template ID crosswalk (~15% of effort)

**Files:**

- `scripts/data/build_wars_ingest/professions_attributes.py`
- `scripts/data/build_wars_ingest/wiki_tables.py`
- `scripts/data/build_wars_ingest/wikitext.py`
- `scripts/data/build_wars_ingest/tests/test_professions_attributes.py`
- `test/fixtures/data-ingestion/professions-attributes/`
- `src/domain/catalog-lookup.ts`
- `test/domain/profession-attribute-catalog.test.ts`
- `work/tickets/03-professions-and-attributes/BW-0302-template-id-crosswalk.md`

**Tasks:**

- [ ] Define the bounded `Skill template format` source request and extract the profession and
      attribute ID tables from a verified snapshot, retaining row/cell scope and provenance.
- [ ] Use structured wikitext traversal for nested cell values. If table framing needs a new helper,
      implement a generic bounded row/cell state machine with diagnostics for malformed spans,
      continuations, nested tables, unknown markup, and lossy parsing.
- [ ] Emit exactly one of record, deliberate exclusion, or diagnostic for every candidate row. Never
      infer an ID from row position or infer missing rows from the surrounding numbers.
- [ ] Preserve profession sentinel ID `0` and its canonical `None` label outside the playable record
      set. Reject any second sentinel, nonzero sentinel, or playable profession using `0`.
- [ ] Preserve every parsed attribute ID, including attribute ID `0`, and record gaps as coverage
      facts without generating placeholder attributes.
- [ ] Normalize canonical names conservatively and build bidirectional lookup indexes. Block
      duplicate numeric IDs, normalized-name collisions, ambiguous abbreviations, malformed numbers,
      or source rows that cannot round-trip.
- [ ] Add minimized, wholly synthetic crosswalk fixtures covering sentinel `0`, attribute `0`,
      non-contiguous values, reordered rows, redirects/wrappers, duplicates, malformed values,
      unknown columns, and punctuation.

**Verification:**

- Python extractor tests prove stable crosswalk output under source row reordering and verify that
  every candidate row is accounted for.
- Vitest proves known ID/name/abbreviation round trips, `None`, unknown IDs, attribute gaps, and
  collision rejection from synthetic catalog data.
- A bounded manual source-shape check records the live page identity and revision but does not yet
  promote generated output.

**Phase acceptance:**

- The verified template-format snapshot, not a handwritten enum or wiki row position, determines
  all profession and attribute numeric IDs.
- `None`, known, and unknown profession IDs are three distinct outcomes; attribute ID `0` remains an
  ordinary attribute-namespace value.
- Attribute ID gaps survive extraction and canonical writing unchanged.

### Phase 3 — BW-0303: Profession and attribute extractors (~25% of effort)

**Files:**

- `scripts/data/build_wars_ingest/professions_attributes.py`
- `scripts/data/build_wars_ingest/icons.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/tests/test_professions_attributes.py`
- `scripts/data/build_wars_ingest/tests/test_icons.py`
- `test/fixtures/data-ingestion/professions-attributes/`
- `compendium/source-policy.md`
- `work/tickets/03-professions-and-attributes/BW-0303-profession-attribute-extractors.md`

**Tasks:**

- [ ] Finalize and cap the exact profile source plan after inspecting fresh `Profession` and
      `Attribute` snapshot shapes. Include only the ten profession pages, primary-attribute pages,
      and file metadata requests required by represented fields.
- [ ] Extract ten playable professions with canonical name, abbreviation, template ID, primary
      attribute ID, source family, character-creation campaigns, and record provenance.
- [ ] Join profession facts to the template crosswalk by canonical source identity/name, never row
      order. Treat missing, extra, redirect-ambiguous, or conflicting records as blocking.
- [ ] Extract every template-listed attribute with canonical name, template ID, owner profession,
      and primary-only flag. Preserve source-only candidates as diagnostics until reconciled rather
      than silently dropping them.
- [ ] Validate exactly one primary attribute per profession, bidirectional primary references, no
      orphan owner, and no primary flag on an ownerless attribute unless a verified rule explicitly
      requires it.
- [ ] Resolve one metadata-only profession icon from explicit page metadata or a unique bounded
      candidate. Preserve ambiguity, unexpected MIME/dimensions, missing hashes, and redirects as
      diagnostics; never download returned media bytes.
- [ ] Author one concise original summary for each primary attribute from bounded factual inputs.
      Add field-level derived provenance and named manual review evidence; exclude copied prose and
      all non-primary summaries.
- [ ] Add synthetic fixtures for core and campaign-specific professions, ownership/primary
      conflicts, redirects, unknown rows/parameters, missing and ambiguous icons, copied-text risk,
      and effect-summary review failures.

**Verification:**

- Offline extractor tests cover ten-record cardinality rules, order independence, cross-source
  conflicts, owner/primary relationships, campaign classification, source-reference resolution,
  and no-silent-drop behavior.
- Icon tests assert `cachedBytes: false`, metadata completeness, unique selection, and no transport
  call to a source-provided file URL.
- Manual review records for effect summaries include reviewer, time, bounded scope, rationale,
  evidence, related findings, follow-up IDs, and re-review trigger on relevant source change.

**Phase acceptance:**

- The candidate contains ten and only ten playable professions and every crosswalk attribute, with
  all joins and restrictions internally consistent.
- Every profession has complete campaign facts, a primary attribute, and reviewed metadata-only icon
  metadata.
- Every primary effect summary is original, supported, provenance-bearing, and reviewed; no copied
  source description enters fixtures or output.

### Phase 4 — BW-0304: Attribute points and quests (~20% of effort)

**Files:**

- `scripts/data/build_wars_ingest/professions_attributes.py`
- `scripts/data/build_wars_ingest/profiles.py`
- `scripts/data/build_wars_ingest/tests/test_professions_attributes.py`
- `test/fixtures/data-ingestion/professions-attributes/`
- `src/domain/catalog-lookup.ts`
- `test/domain/profession-attribute-catalog.test.ts`
- `work/tickets/03-professions-and-attributes/BW-0304-attribute-points-and-quests.md`

**Tasks:**

- [ ] Extract the cumulative point-cost schedule for purchased ranks and retain provenance at the
      rule/table field scope. Represent rank `0` explicitly and include the verified maximum
      purchased-rank boundary.
- [ ] Extract level-based base point totals for the supported PvE player range. Do not interpolate,
      extrapolate, or encode a formula unless the verified source explicitly defines and tests it.
- [ ] Extract only factual attribute-point quest metadata needed for reward accounting: stable
      normalized ID, canonical name, supported campaign/eligibility facts, reward points, and
      provenance. Exclude objectives, dialogue, summaries, and walkthrough content.
- [ ] Represent the maximum applicable quest bonus separately from the list of possible quests so
      mutually exclusive origin-specific quest paths cannot be summed together accidentally.
- [ ] Define the default as a level-20 PvE player with the maximum applicable quest reward. Derive
      the budget from the represented level and quest inputs.
- [ ] Implement pure helper tests for cumulative point cost, incremental difference, base budget,
      no-quest budget, maximum-reward budget, and available attributes for primary/secondary
      profession pairs. Keep validation result/UI design out of scope.
- [ ] Validate complete rank and level coverage, unique keys, nonnegative integers, monotonic totals,
      arithmetic consistency, quest cap consistency, and no references to missing quest facts.
- [ ] Treat 170 points at level 20 without quest rewards and 200 with maximum rewards as expected
      reference cases. Fresh source disagreement blocks the phase and requires an explicit contract
      decision instead of hard-coded override.
- [ ] Document that max purchased rank excludes rune/equipment/effect bonuses and that PvP
      characters, heroes, and actual quest completion are deferred contexts.

**Verification:**

- Python tests cover rank `0`, maximum rank, every adjacent cumulative-cost difference, missing or
  duplicate rows, non-monotonic values, malformed numbers, quest alternatives, over-counted quest
  rewards, level 20 with zero/full bonus, and default derivation.
- Vitest consumes synthetic typed catalog data and proves the lookup/budget helpers use records by
  key rather than array offset.
- Manual comparison of candidate values with verified `Attribute point` and exact quest snapshots.

**Phase acceptance:**

- The catalog has sufficient plain data to determine attribute availability, purchased-rank point
  cost, and the default level-20 PvE point budget without UI constants.
- Quest alternatives cannot be naively summed beyond the source-derived maximum reward.
- No PvP, hero, effective-rank, or character-progression behavior is implied by the MVP default.

### Phase 5 — BW-0305: Generated catalog, QA, and promotion (~15% of effort)

**Files:**

- `scripts/data/build_wars_ingest/artifacts.py`
- `scripts/data/build_wars_ingest/pipeline.py`
- `scripts/data/build_wars_ingest/qa.py`
- `scripts/data/build_wars_ingest/cli.py`
- `scripts/data/build_wars_ingest/tests/test_artifacts.py`
- `scripts/data/build_wars_ingest/tests/test_pipeline.py`
- `scripts/data/build_wars_ingest/tests/test_qa.py`
- `scripts/data/build_wars_ingest/tests/test_cli.py`
- `test/fixtures/data-ingestion/generated/fixture-professions-attributes.json`
- `test/domain/profession-attribute-catalog.test.ts`
- `data/generated/epic-03/professions-attributes.json`
- `data/generated/epic-03/professions-attributes.manifest.json`
- `data/qa/epic-03/professions-attributes.qa.json`
- `.gitignore`
- `work/tickets/03-professions-and-attributes/BW-0305-generated-catalog-qa-and-promotion.md`

**Tasks:**

- [ ] Assemble one canonical catalog envelope with aggregate sources, template sentinel, profession
      records, attribute records, allocation rules, and content-derived `catalogVersion`.
- [ ] Add schema-owned sort keys and semantic projection hashing. Test that input/source order does
      not affect bytes, provenance-only changes preserve `catalogVersion`, and semantic changes
      update it.
- [ ] Add profile validators for cardinality, crosswalk coverage, sentinel/namespace rules,
      ownership, primary restrictions, campaign facts, icons, reviewed summaries, allocation tables,
      quest caps/defaults, provenance, media policy, schema shape, and artifact integrity.
- [ ] Classify baseline differences as semantic, provenance-only, formatting/order, or schema
      changes. Require explicit review evidence for every nonempty production diff.
- [ ] Generate a minimized synthetic golden artifact through fixture mode and check it byte-for-byte
      in Python plus structurally in Vitest. Keep synthetic names and IDs visibly non-authoritative.
- [ ] Run an explicit bounded live refresh for the locked profile and inspect request count, resolved
      titles, revisions, timestamps, source IDs, snapshot digests, and diagnostics.
- [ ] Run offline generation twice from the selected live snapshots with identical clock and
      configuration; require byte-identical catalog, manifest, finding IDs/order, and QA report.
- [ ] Complete field-level source-policy and effect-summary reviews. Resolve or exclude every open
      warning and require `appConsumptionGate: pass` plus `publicReleaseGate: pass`.
- [ ] Set the promoted manifest's `commitDecision` to `exact-path-allowlisted` and name the exact QA
      report. Ensure record count semantics are documented and stable.
- [ ] Add narrow parent-directory and exact-file `.gitignore` exceptions for only the three promoted
      paths. Confirm all raw snapshots, snapshot manifests, temporary candidates, text summaries,
      binaries, and unrelated generated files remain ignored.

**Verification:**

- Full Python artifact, profile, QA, pipeline, and CLI suites pass offline.
- Production candidate generation is byte-identical on repeated replay from the same snapshots and
  fixed clock; semantic and provenance-only baseline cases produce the expected version/digest
  behavior.
- `git check-ignore -v` and `git status --short` prove only the named catalog, manifest, and QA JSON
  are eligible generated paths.
- Manual review confirms no copied prose, icon bytes, page bodies, unknown sources, unresolved
  findings, or machine-specific paths are promoted.

**Phase acceptance:**

- The exact catalog, manifest, and QA report form one internally consistent reviewed release unit.
- Both QA gates pass, the artifact digest matches, and `catalogVersion` represents semantic content
  rather than refresh time.
- No ignored source or generated byproduct becomes trackable through a broad allowlist.

### Phase 6 — BW-0306: Documentation, verification, and closeout (~10% of effort)

**Files:**

- `package.json`
- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/data-ingestion-platform.md`
- `compendium/professions-and-attributes.md`
- `compendium/README.md`
- `work/tickets/03-professions-and-attributes/EPIC.md`
- `work/tickets/03-professions-and-attributes/BW-0301-catalog-contract-extensions.md`
- `work/tickets/03-professions-and-attributes/BW-0302-template-id-crosswalk.md`
- `work/tickets/03-professions-and-attributes/BW-0303-profession-attribute-extractors.md`
- `work/tickets/03-professions-and-attributes/BW-0304-attribute-points-and-quests.md`
- `work/tickets/03-professions-and-attributes/BW-0305-generated-catalog-qa-and-promotion.md`
- `work/tickets/03-professions-and-attributes/BW-0306-docs-verification-and-closeout.md`
- `work/sprints/SPRINT-004.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Make canonical fixture regeneration run all registered fixture profiles offline while
      preserving a documented way to select only `professions-attributes` for focused work.
- [ ] Document the source authority matrix, profile source cap, modes, snapshot selection, artifact
      schema, ID/sentinel rules, catalog version semantics, allocation assumptions, QA codes,
      baseline review, and exact promotion paths.
- [ ] Document historical replay from recorded source revision IDs, the limitation that raw snapshots
      are not committed, and the evidence a future refresh must retain before replacing the catalog.
- [ ] Document that the catalog is runtime-eligible but not yet imported by `src/app`; future UI work
      may import only the catalog JSON and domain helpers, never the manifest, QA report, or scripts.
- [ ] Document icon metadata as non-fetching data and require a future explicit browser media/privacy
      decision before remote icon rendering or caching.
- [ ] Run focused TypeScript and Python tests, fixture regeneration twice, then `npm run verify` with
      network access disabled.
- [ ] Inspect the full diff and Git status for unrelated changes, raw snapshots, manifests outside
      the approved path, copied source text, cached media, secrets, absolute machine paths, and
      nondeterministic timestamps.
- [ ] Close BW-0301 through BW-0306 only after their phase acceptance checks pass. Then close EPIC-03,
      SPRINT-004, and the ledger row only after every Definition of Done item is verified.

**Verification:**

- `npm run data:regenerate` completes offline and produces stable fixture-profile artifacts.
- `npm run verify` passes with formatting, lint, TypeScript, Vitest, build, Python ingestion, and
  ticket-burn checks.
- Documentation, code contracts, generated artifact, manifest, QA report, tickets, sprint, and ledger
  agree on IDs, paths, assumptions, modes, versions, and final status.

**Phase acceptance:**

- A new contributor can understand and verify the catalog without contacting the wiki, while a
  maintainer can perform a bounded reviewed refresh through the documented profile.
- Downstream skill, template, and build-validation epics have one stable catalog contract and do not
  need to reinterpret source pages or duplicate allocation constants.
- No commit is created by the sprint executor.

## Files Summary

| Path | Action | Purpose |
| --- | --- | --- |
| `src/domain/catalog.ts` | Modify | Catalog envelope, campaign availability, icon, effect-summary, and allocation-rule contracts |
| `src/domain/catalog-lookup.ts` | Create | Pure ID/name/sentinel, availability, rank-cost, and point-budget helpers |
| `src/domain/index.ts` | Modify | Export the new catalog contracts and helpers |
| `test/fixtures/foundation.ts` | Modify | Migrate visibly synthetic profession and attribute fixtures |
| `test/domain/contracts.test.ts` | Modify | Preserve framework-neutral JSON contract coverage |
| `test/domain/profession-attribute-catalog.test.ts` | Create | Catalog invariants, lookups, production artifact structure, and budget tests |
| `scripts/data/build_wars_ingest/profiles.py` | Create | Registered profile definitions and exact snapshot selection |
| `scripts/data/build_wars_ingest/professions_attributes.py` | Create | Template, profession, attribute, rule extraction and normalization |
| `scripts/data/build_wars_ingest/wiki_tables.py` | Create if required | Bounded wikitable framing with structured nested-cell parsing |
| `scripts/data/build_wars_ingest/config.py` | Modify | Profile versions, source plans, caps, and artifact paths |
| `scripts/data/build_wars_ingest/models.py` | Modify | Internal catalog/rule records and semantic projection helpers |
| `scripts/data/build_wars_ingest/wikitext.py` | Modify narrowly | Reusable cell/section parsing hooks and diagnostics |
| `scripts/data/build_wars_ingest/icons.py` | Modify narrowly | Profession icon metadata integration and required-field diagnostics |
| `scripts/data/build_wars_ingest/artifacts.py` | Modify | Catalog version projection, commit decision, and baseline classification |
| `scripts/data/build_wars_ingest/qa.py` | Modify | Profile-specific validators using the shared QA wire format |
| `scripts/data/build_wars_ingest/pipeline.py` | Modify | Profile-driven fixture/offline/live orchestration |
| `scripts/data/build_wars_ingest/cli.py` | Modify | Profile selection, bounded live plan, and summaries |
| `scripts/data/build_wars_ingest/tests/` | Modify/create | Crosswalk, extractor, profile, artifact, QA, pipeline, CLI, and regression tests |
| `test/fixtures/data-ingestion/professions-attributes/` | Create | Minimized wholly synthetic source-shape fixtures |
| `test/fixtures/data-ingestion/generated/fixture-professions-attributes.json` | Create | Synthetic canonical cross-language golden artifact |
| `data/generated/epic-03/professions-attributes.json` | Create and exact-allowlist | Reviewed runtime-eligible catalog |
| `data/generated/epic-03/professions-attributes.manifest.json` | Create and exact-allowlist | Artifact digest, inputs, generator, QA path, and promotion decision |
| `data/qa/epic-03/professions-attributes.qa.json` | Create and exact-allowlist | Machine-readable profile QA and gate closeout |
| `.gitignore` | Modify narrowly | Unignore only the approved EPIC-03 release-unit paths |
| `package.json` | Modify narrowly | Run registered fixture profiles through canonical offline regeneration/verification |
| `README.md` | Modify | Advertise the catalog boundary and documented commands |
| `scripts/data/README.md` | Modify | Profile sources, modes, caps, replay, QA, and refresh procedure |
| `data/README.md` | Modify | Record the approved EPIC-03 lifecycle exception |
| `data/generated/README.md` | Modify | Document exact catalog/manifest allowlist and semantic versioning |
| `data/qa/README.md` | Modify | Document exact QA report allowlist and refresh review |
| `compendium/data-ingestion-platform.md` | Modify | Record registered-profile extension conventions |
| `compendium/professions-and-attributes.md` | Create | Durable source authority, schema, assumptions, and deferred contexts |
| `compendium/README.md` | Modify | Index the catalog decision record |
| `work/tickets/03-professions-and-attributes/EPIC.md` | Modify during execution | Sprint linkage and final epic status |
| `work/tickets/03-professions-and-attributes/BW-0301*.md` through `BW-0306*.md` | Modify during execution | Ticket status, acceptance, and verification evidence |
| `work/sprints/SPRINT-004.md` | Create during planning merge | Executable merged sprint and final status |
| `work/sprints/ledger.tsv` | Modify during execution | Sprint lifecycle record |

## Definition of Done

### Catalog and template semantics

- [ ] The generated catalog contains ten and only ten playable profession records.
- [ ] Every attribute row in the verified skill-template source is represented exactly once or has a
      blocking, explicitly resolved exclusion; no ID is synthesized from a gap.
- [ ] Profession template ID `0` is the `None` sentinel and is not a `Profession`; attribute ID `0`
      is handled in the attribute namespace without collision.
- [ ] Profession and attribute IDs are the verified template IDs, remain numeric and non-compacted,
      and map to canonical names and back through tested helpers.
- [ ] Known, `None`, and unknown template IDs remain distinct; unknown numeric authored IDs are not
      rejected or coerced by catalog lookup.
- [ ] Profession names, abbreviations, campaign facts, primary attributes, and icon metadata are
      complete and internally unique.
- [ ] Every attribute resolves to its verified profession ownership and primary-only status; each
      profession has exactly one matching primary attribute.
- [ ] Primary/secondary availability helpers expose primary attributes only for the primary
      profession and non-primary attributes for either selected profession.

### Allocation rules and defaults

- [ ] Cumulative point costs cover rank `0` through the verified maximum purchased rank with unique,
      monotonic integer values and tested boundaries.
- [ ] Base point totals cover the verified PvE player level range with unique, monotonic integer
      values.
- [ ] Attribute-point quest records contain only bounded factual metadata, reward values, and
      complete provenance; mutually exclusive alternatives cannot be over-counted.
- [ ] The maximum applicable quest bonus is represented separately and reconciles with eligible
      quest paths.
- [ ] The default level-20 PvE-player budget is derived from the level table and maximum reward
      policy; no-quest and full-reward reference cases evaluate to 170 and 200 unless a verified
      source discrepancy blocks the sprint for review.
- [ ] Purchased rank is explicitly separate from effective rank, and the catalog makes no claim to
      validate PvP characters, heroes, runes, equipment bonuses, effects, or actual quest completion.

### Source, provenance, and policy

- [ ] A registered, bounded `professions-attributes` profile uses the shared EPIC-02 client,
      snapshots, parser, icon resolver, writer, QA schema, and command modes.
- [ ] Extractors consume verified snapshots only; no extractor performs network access or writes its
      own artifact/report format.
- [ ] `Skill template format`, `Profession`, `Attribute`, `Attribute point`, and any bounded detail
      pages have verified page/revision/retrieval facts and explicit authority roles.
- [ ] Every candidate source row is retained as a record, evidence-backed exclusion, or scoped
      diagnostic; cross-source disagreements block rather than resolve by precedence accident.
- [ ] Every generated record and rule has resolvable field/record provenance using the EPIC-01 wire
      vocabulary.
- [ ] Every primary attribute has an original concise inherent-effect summary classified as derived,
      linked to factual inputs, and approved by a complete named manual review.
- [ ] Every profession icon is metadata-only, has `cachedBytes: false`, resolves its source ID, and
      is never downloaded, cached, committed, bundled, or fetched by app code in this sprint.
- [ ] No copied contributor/game description, quest prose, community prose, full wiki page body,
      screenshot, thumbnail, or external media binary is tracked.

### Artifacts, QA, and promotion

- [ ] Fixed profile inputs, configuration, and clock produce byte-identical catalog, manifest,
      finding IDs/order, and QA report across repeated offline runs.
- [ ] `catalogVersion` changes for semantic gameplay/display changes and remains stable for
      provenance-only refreshes; the manifest digest changes whenever artifact bytes change.
- [ ] Profile validators cover counts, crosswalks, sentinel/namespaces, gaps, relationships,
      campaigns, icons, summaries/reviews, costs, levels, quests/defaults, provenance, schema, and
      integrity.
- [ ] Baseline review distinguishes semantic, provenance-only, formatting/order, and schema changes;
      every production difference has review evidence.
- [ ] The promoted candidate has `appConsumptionGate: pass`, `publicReleaseGate: pass`, no open
      warnings, no hidden non-waivable finding, and a matching SHA-256 digest.
- [ ] Only `data/generated/epic-03/professions-attributes.json`, its adjacent manifest, and
      `data/qa/epic-03/professions-attributes.qa.json` are exact-path allowlisted.
- [ ] The catalog alone is runtime-eligible; app code does not import the manifest, QA report,
      snapshots, or Python tooling.
- [ ] Raw snapshots, snapshot manifests, candidate outputs, QA summaries, and live logs remain
      ignored and absent from the tracked diff.

### Verification and closeout

- [ ] Synthetic fixture coverage is minimized, non-authoritative, free of copied prose, and checked
      by Python plus Vitest without live network access.
- [ ] A fresh bounded live refresh is completed once for promotion, followed by successful offline
      replay from the selected snapshots.
- [ ] Existing EPIC-02 profile output and tests remain compatible after profile registration.
- [ ] `src/domain` remains plain-data/framework-neutral; `src/app` remains unchanged and isolated from
      source APIs and data tooling.
- [ ] `npm run data:regenerate` and `npm run verify` pass with the network disabled after the
      promotion candidate is produced.
- [ ] Documentation agrees on source authority, IDs, sentinel behavior, schema, versions, default
      assumptions, modes, paths, QA gates, replay limits, media policy, and deferred contexts.
- [ ] BW-0301 through BW-0306 are linked and completed only after their acceptance checks pass;
      EPIC-03, SPRINT-004, and the ledger are completed only after all technical criteria pass.
- [ ] No unrelated feature, dependency, generated artifact, source payload, planning record, or
      version-control commit is introduced by sprint execution.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Wiki table/template shape changes | Medium | High | Verify fresh snapshots, preserve unknown rows, use structured nested parsing, keep regression fixtures, and block on lossy extraction |
| Source pages disagree on IDs or ownership | Medium | High | Assign field authorities, reconcile explicitly, retain both source facts, and make conflicts blocking rather than last-write-wins |
| Profession sentinel `0` becomes a fake record | Medium | High | Model it only in codec metadata, test ten-record cardinality, and return a distinct `none` lookup result |
| Attribute gaps are compacted or used as array offsets | Medium | High | Use numeric-keyed indexes, schema-owned numeric sorting, gap tests, and no dense range generation |
| Profession ID `0` is confused with attribute ID `0` | Medium | High | Preserve branded namespaces in TypeScript, separate codec functions, and add explicit cross-namespace tests |
| Campaign “core” is mistaken for a campaign or travel permission | Medium | Medium | Separate profession family from character-creation campaigns and document the bounded semantic meaning |
| Point-cost increments and cumulative totals are confused | Medium | High | Store only cumulative purchased-rank costs, derive increments, name fields precisely, and test every adjacent rank |
| Quest alternatives are all summed | Medium | High | Store maximum applicable bonus separately, retain supported eligibility metadata, and test over-counted alternatives |
| Level-20 defaults leak into PvP, heroes, or progression | Medium | High | Name the context `defaultPvePlayer`, expose assumptions in data, and defer unsupported character contexts explicitly |
| Effect summaries copy protected or contributor prose | Medium | High | Extract facts only, author original wording, require field-level derived claims and named manual review, and block unknown copied material |
| Icon metadata leads to accidental hotlinking or caching | Medium | Medium | Store metadata only, make no app change, never follow media URLs in ingestion, and require a future browser media/privacy ticket |
| Dynamic source discovery expands into a crawl | Low | High | Lock exact page titles after source proof, cap pages/requests/bytes, reject extras, and prohibit recursive link/category traversal |
| Profile refactor regresses EPIC-02 | Medium | High | Register the existing behavior first, retain golden output, and run all prior Python/Vitest tests before content work proceeds |
| Provenance-only refresh churns authored catalog versions | Medium | Medium | Hash a documented semantic projection for `catalogVersion` and use the full-byte digest for artifact identity |
| Semantic projection omits a gameplay-relevant field | Low | High | Enumerate projection fields beside the schema, test each field mutation, and require schema review when a field is added |
| Ignored snapshots make historical replay dependent on wiki revision availability | Medium | Medium | Embed revision-addressable source facts, document exact-revision replay, retain reviewed manifests locally through promotion, and record the limitation without committing page bodies |
| Broad `.gitignore` exceptions leak live artifacts | Low | High | Unignore parent paths narrowly, re-ignore contents, allowlist exact files, and verify with `git check-ignore` plus Git status |
| Production artifact tests duplicate source truth in code | Medium | Medium | Assert schema and relational invariants against the artifact; keep authoritative values in generated data and snapshot comparison rather than handwritten enums |
| A warning is promoted because exit code is zero | Medium | High | Require both gates to equal `pass` and no open warning, independent of process exit code |

## Security Considerations

- Treat page titles, redirects, wikitext, table cells, template parameters, file titles, URLs,
  revision metadata, source IDs, prior artifacts, manifests, baselines, QA evidence, and CLI paths as
  untrusted input.
- Permit network access only in explicit live mode, only after `--allow-live-network`, and only to the
  configured HTTPS Guild Wars Wiki MediaWiki API origin. Validate the final origin after redirects.
- The content profile supplies a capped title plan. Reject caller-provided arbitrary titles,
  recursive source discovery, unexpected continuation growth, and source-provided fetch URLs.
- Reuse GET-only requests without credentials, cookies, tokens, or environment-secret discovery. Do
  not log response bodies, raw wikitext, full query values, headers, local environment contents, or
  unbounded source excerpts.
- Bound title/file batches, requests, continuation pages, retries, total delay, response bytes,
  snapshot count, parser input, table rows/cells, nesting work, generated records, output bytes, and
  QA evidence length.
- Parse wiki markup as data. Do not execute templates, Lua, HTML, JavaScript, shell fragments, URLs,
  entity payloads, or source-provided commands. Do not make canonical extraction depend on remote
  template expansion.
- Keep every read/write path beneath an explicit validated root; reject traversal, absolute
  source-derived paths, control characters, collisions, and symlink escapes. Use atomic writes and
  verify SHA-256 before extraction and promotion.
- Never request a remote icon URL returned by `imageinfo`. Store metadata with `cachedBytes: false`;
  do not add icon bytes, thumbnails, screenshots, data URLs, or local media paths.
- Validate all numeric values as finite bounded integers. Reject booleans-as-integers, negative IDs,
  duplicate keys, unreasonable ranks/levels/points, and arithmetic overflow or coercion.
- Escape Markdown/plain-text QA output and cap evidence. QA records reference source/revision/row
  scope rather than embedding raw page bodies or copied descriptions.
- Keep source snapshots, local review working files, and candidate outputs ignored. Exact allowlists
  apply only after digest verification and source-policy review.
- Do not add dependencies for table parsing unless the existing parser and a bounded state machine
  demonstrably cannot preserve required structure; any new dependency requires separate security,
  maintenance, and reproducibility review before adoption.
- Preserve EPIC-01 non-waivable handling for unknown copied material, unreadable artifacts, and digest
  mismatch. Neither manual review nor a successful process exit may bypass those conditions.

## Dependencies

### Internal

- `EPIC-00` / `SPRINT-001` supplies the plain-data domain boundary, numeric catalog IDs, synthetic
  fixtures, app isolation, and canonical verification command.
- `EPIC-01` / `SPRINT-002` supplies source classification, provenance, manual review, media policy,
  artifact retention, QA vocabulary, and app/public release gates.
- `EPIC-02` / `SPRINT-003` supplies the MediaWiki client, immutable snapshots, structured wikitext
  parsing, metadata-only icon resolution, canonical artifacts, QA reports, command modes, and
  accepted `mwparserfromhell` decision.
- BW-0301 through BW-0306 follow the dependency order recorded in Implementation; later phases must
  not invent alternate contracts while an earlier authority or schema decision remains unresolved.

### Tooling and external services

- Node.js `>=22.11.0`, npm `>=11.10.1`, Python `>=3.11`, and the existing pinned
  `mwparserfromhell==0.7.2` setup remain required.
- No new package or Python dependency is planned. A bounded wikitable state machine is preferred over
  adding a second parser when verified source shapes require table framing.
- Guild Wars Wiki MediaWiki API availability is required only for the promotion-time bounded live
  refresh and later manual refreshes. Fixture verification and offline replay do not require network
  access.
- Source revision history availability is needed to recreate an uncommitted historical snapshot from
  the recorded revision IDs; this limitation is documented because raw page bodies remain ignored.

### Downstream consumers

- EPIC-04 skill catalog work consumes profession/attribute IDs and ownership but must not redefine
  them.
- Template codec work consumes the `None` sentinel and ID/name crosswalk semantics while preserving
  unknown IDs.
- Build-validation and editor work consumes attribute availability, purchased-rank costs, and the
  explicit default PvE-player budget.
- Equipment, rune, hero, PvP, campaign-progression, persistence, and attribution-UI work may extend
  context later but must not reinterpret the current purchased-rank or source-policy semantics.

## Open Questions

No open question blocks execution. The defaults for this sprint are:

1. **Primary-effect summaries:** include short original Build Wars summaries as derived values with
   field-level provenance and named manual review. Do not copy or lightly edit source prose.
2. **Promoted paths:** exact-allowlist only the catalog JSON, its generated manifest, and its JSON QA
   report at the paths named above. Keep raw snapshots, snapshot manifests, candidates, and text
   summaries ignored.
3. **Live refresh:** require one bounded fresh live refresh for promotion, then regenerate through
   offline replay. Live access remains outside `npm run verify`.
4. **PvP characters and heroes:** defer their budgets and restrictions. The only default is a
   level-20 PvE player with maximum applicable attribute quest rewards.
5. **Campaign semantics:** store profession family separately from character-creation campaign
   availability. Do not model travel, campaign completion, or secondary-profession acquisition.
6. **Quest completion:** retain individual factual quest metadata and a maximum applicable reward,
   but do not model a user's actual quest log or assume every listed quest can be completed by one
   character.
7. **Historical source payloads:** do not commit full snapshots. Preserve exact source revisions in
   artifact provenance and document exact-revision replay plus the resulting external-history risk.
8. **Runtime consumption:** make the catalog runtime-eligible and prove it with domain helpers/tests,
   but leave `src/app` unchanged. A later UI ticket must address attribution display and remote icon
   request/privacy behavior before rendering source-derived data or media.
