---
id: SPRINT-002
title: Source Policy and QA
status: draft
source_target: BACKLOG
source_epic: EPIC-01
source_epic_path: work/tickets/01-source-policy-and-qa/EPIC.md
tickets:
  - BW-0101
  - BW-0102
  - BW-0103
  - BW-0104
  - BW-0105
created: 2026-09-01
---

# Sprint 002: Source Policy and QA

## Overview

Sprint `SPRINT-002` executes `EPIC-01 Source Policy and QA` for ticket-burn target `BACKLOG`.

The sprint establishes the policy and minimal contracts Build Wars needs before importing, normalizing, committing, or publishing Guild Wars Wiki data, PvX/Fandom metadata, icon references, screenshots, generated data, or manual content overrides. It follows the `SPRINT-001` foundation: one private npm package, a framework-neutral `src/domain` boundary, ignored raw/generated data directories, synthetic fixtures only, and `npm run verify` as the canonical validation command.

The main architectural outcome is a shared source-policy vocabulary that future ingestion work can use without reopening baseline decisions: source family, source classification, field provenance, artifact lifecycle, QA findings, manual review state, and release gates. The sprint should be conservative and explicit. Ambiguous source or license cases are recorded and blocked from public runtime use until manually reviewed.

This sprint is project policy, not legal advice. It does not fetch live external data, parse MediaWiki or PvX/Fandom pages, import real Guild Wars records, cache icon files, convert prior-art screenshots into runtime assets, build an attribution UI, or implement a complete ingestion QA engine.

## Use Cases

1. **Plan EPIC-02 ingestion safely**: A future data-ingestion implementer can see exactly what provenance, classification, retrieval, and QA metadata every generated record must carry.
2. **Classify source material consistently**: A contributor can distinguish factual metadata, copied source text, derived normalized values, manual overrides, icon metadata, screenshots, community links, and ambiguous material.
3. **Decide what may be committed**: A reviewer can determine whether a raw snapshot, normalized generated JSON file, QA report, fixture, icon reference, or screenshot belongs in Git.
4. **Review generated data before release**: A maintainer can use documented QA categories and manual review checklists to block missing provenance, stale revisions, copied text without attribution, and unresolved ambiguous source classifications.
5. **Keep domain contracts executable**: Tests can round-trip synthetic provenance and QA examples as plain JSON-compatible data without adding real external Guild Wars content.
6. **Preserve ticket-burn traceability**: EPIC-01, BW-0101 through BW-0105, `SPRINT-002`, the sprint ledger, and the planning result manifest stay aligned.

## Architecture

### Decisions

- Keep the project as a single private npm package.
- Keep source/provenance contracts in `src/domain/source.ts`; do not introduce a separate package, runtime service, database, or network client.
- Keep all source-policy domain contracts as JSON-compatible plain data: objects, arrays, primitives, and `null`; no classes, functions, `Date`, `Map`, `Set`, DOM objects, or React types.
- Prefer additive source contract changes over broad renames so existing catalog, build, party, and guide contracts keep typechecking.
- Use synthetic fixtures for executable examples; do not add real Guild Wars Wiki, PvX/Fandom, icon, screenshot, or generated catalog payloads.
- Store icon metadata initially, not icon files.
- Keep raw snapshots and generated QA reports ignored by default.
- Allow committed normalized JSON only when it is small, deterministic, needed by the app or tests, and carries required provenance.
- Treat PvX/Fandom/community content as metadata-and-link-only until a later policy explicitly approves copied prose, ratings text, usage notes, or large page bodies.
- Treat screenshots and prior-art images as development references, not runtime app assets, unless a later ticket explicitly approves use and attribution.

### Dependency Direction

```text
src/app
  -> src/domain

scripts/data
  -> src/domain
  -> data/source-snapshots
  -> data/generated
  -> data/qa

compendium and README files
  -> document policy, review, and release gates

src/domain
  -> no React, DOM, browser storage, network, app modules, test fixtures, or data scripts
```

Future ingestion scripts may import public domain contracts and write ignored artifacts under `data/`. Runtime app code must not read raw snapshots directly and must not rely on ignored QA reports.

### Source Classification Model

The sprint should define a small controlled vocabulary, implemented as string literal types or plain-data constants rather than TypeScript `enum`s. The vocabulary must be easy to serialize and extend when later content epics reveal missing cases.

Required source families:

- `guild-wars-wiki` for MediaWiki pages and file metadata from the official Guild Wars Wiki.
- `pvx-fandom` for PvX/Fandom/community build pages and page metadata.
- `game-client` for ArenaNet/NCSoft-owned in-game text, IDs, icons, screenshots, or observations.
- `community-tool` for third-party tools used as comparison or compatibility references.
- `manual` for human-entered records or corrections without a direct external source.
- `development-reference` for prior-art screenshots and visual references that are not runtime assets.
- `unknown` for cases that cannot be confidently classified yet.

Required content classes:

- `factual-metadata`: IDs, names, numeric costs, flags, categories, timestamps, file metadata, and other facts expected to be normalized.
- `copied-source-text`: descriptions, guide prose, usage notes, rating text, or other copied text.
- `derived-normalized`: parsed, transformed, or normalized values generated from source material.
- `manual-override`: human-entered correction, exception, or interpretation.
- `external-link-only`: retained link and page metadata without copied community content.
- `media-metadata-only`: icon or media metadata such as title, URL, MIME type, size, timestamp, and sha1 without cached binary files.
- `development-reference-only`: prior-art material used by contributors but not shipped at runtime.
- `ambiguous`: material that needs manual review before runtime use or public release.

Required license/source classifications:

- `gfdl-or-compatible`
- `arenanet-ncsoft-owned`
- `permissive-or-public-domain`
- `community-unknown`
- `mixed`
- `ambiguous`
- `unknown`

The policy must explicitly call out that Guild Wars Wiki pages can mix contributor text with ArenaNet/NCSoft-owned game content, and that classification is a project risk-management decision, not a legal conclusion.

### Provenance Contract Boundary

`src/domain/source.ts` should support these concepts without becoming an ingestion engine:

- Source identity: source name, source family, source URL, page ID or title when available, and file title when applicable.
- Revision identity: revision ID, source revision timestamp, retrieved timestamp, and optional retrieval batch/artifact reference.
- Source classification: content class, license/source classification, ambiguity flag or review requirement, and notes.
- Field provenance: per-field classification so one generated record can mix factual metadata, copied text, derived normalized values, and manual overrides.
- Icon metadata: file title, URL, MIME type, size, timestamp, sha1, and source reference without requiring a cached icon file.
- Manual review state: reviewer identifier or handle, reviewed timestamp, status, finding IDs, and notes.
- QA output shape: artifact identity, generated timestamp, finding severity, finding category, affected record or field, source reference, and closeout status.

The contracts should remain shallow and composable. They should describe source and QA metadata, not validate licensing, fetch remote content, parse wiki templates, diff generated catalogs, or decide UI attribution layout.

### Artifact Lifecycle

Raw snapshots under `data/source-snapshots/` are ignored by default. They may preserve source responses for reproducibility only after a source policy exists, and future snapshot records must carry retrieval and source identity metadata.

Normalized generated data under `data/generated/` is ignored by default until a later sprint commits specific deterministic artifacts. Any committed generated data must be small, app/test-required, reproducible, source-attributed, and free of unresolved critical QA findings.

QA reports under `data/qa/` are ignored by default. A later ticket may promote a small stable report or checklist result to tracked documentation, but that exception must be explicit.

Fixtures remain synthetic unless a future ticket explicitly approves a sourced fixture with provenance. Synthetic fixtures must be labeled non-authoritative and unsuitable for Guild Wars correctness assertions.

Icon files and screenshots are out of scope for runtime use in this sprint. Metadata-only icon records are allowed because EPIC-02 needs a contract for future MediaWiki `imageinfo` output.

### QA And Release Gates

QA findings should have at least three severities:

- `critical`: blocks app use of generated data and public release until resolved or explicitly accepted in a closeout record.
- `warning`: does not block local development, but must be reviewed before release.
- `info`: documents coverage, freshness, or review notes without blocking.

Required finding categories include missing provenance, stale source revision, ambiguous license/source classification, copied text without attribution, manual override without review, icon metadata gap, generated diff needing review, and unexpected source family.

The public release checklist must require attribution display planning, source links, generated-data notices, license/source notes, ambiguous-source review, and confirmation that no disallowed media or community prose is shipped.

### Deferred Scope

The sprint must not implement:

- MediaWiki API clients, live fetchers, source snapshot downloaders, or cache refresh commands.
- Wikitext, Skill infobox, Skill progression, PvX/Fandom, template-code, or equipment-code parsers.
- Complete generated catalog schemas for professions, attributes, skills, runes, insignias, weapons, heroes, guides, or parties.
- Runtime attribution UI, guide rendering, local-storage libraries, hosted sharing, auth, analytics, deployment, or PWA/offline media caching.
- Legal review or definitive license determinations.
- Any real external Guild Wars Wiki, PvX/Fandom, icon, screenshot, or generated catalog payload.

## Implementation

### Phase 1: Traceability And Sprint Records

**Files:**

- `work/sprints/SPRINT-002.md`
- `work/sprints/ledger.tsv`
- `work/tickets/01-source-policy-and-qa/EPIC.md`
- `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md`
- `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md`
- `work/tickets/01-source-policy-and-qa/BW-0105-release-checklist-closeout-records.md`
- `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-01-result.json`

**Tasks:**

- [ ] Create the final sprint artifact at `work/sprints/SPRINT-002.md`.
- [ ] Keep BW-0101 through BW-0105 linked to `EPIC-01` and `SPRINT-002`.
- [ ] During execution, mark `SPRINT-002` and active BW tickets `in-progress` before implementation changes.
- [ ] During closeout, mark each BW ticket done only after its acceptance criteria pass.
- [ ] Mark EPIC-01 done only after the full sprint Definition of Done passes.
- [ ] Update `work/sprints/ledger.tsv` with sprint `002`, title `Source Policy and QA`, final status, and closeout timestamp.
- [ ] Write the ticket-burn planning result manifest with `status: planned` at the requested run path.

### Phase 2: Source Reuse And Attribution Policy

**Files:**

- `compendium/source-policy.md`
- `compendium/README.md`
- `README.md`

**Tasks:**

- [ ] Create a durable source policy page in the compendium.
- [ ] Document default reuse rules for factual metadata, copied source text, game-owned material, derived normalized values, manual overrides, external community links, icon metadata, screenshots, and unknown cases.
- [ ] Document attribution requirements: source name, source URL, page or file identity when available, revision identity, source revision timestamp, retrieval timestamp, source family, content class, license/source classification, and review notes.
- [ ] State that PvX/Fandom/community guide content remains metadata-and-link-only in this sprint.
- [ ] State that icon files, screenshots, guide prose, ratings text, usage notes, and large page bodies are not committed or used as runtime assets in this sprint.
- [ ] State that ambiguous source or licensing cases require manual review before public release or runtime inclusion.
- [ ] Preserve the EPIC-01 caveat that these rules are project policy, not legal advice.
- [ ] Link the policy from `compendium/README.md` and summarize the current policy gate in `README.md`.

### Phase 3: Provenance And Classification Contracts

**Files:**

- `src/domain/source.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/fixtures/sourcePolicy.ts` or `test/fixtures/foundation.ts`

**Tasks:**

- [ ] Extend `src/domain/source.ts` with source family, content class, license/source classification, field provenance, icon metadata, generated artifact, QA finding, and manual review contracts.
- [ ] Keep existing catalog/build/party/guide consumers typechecking; prefer additive exports unless a narrow rename is clearly simpler.
- [ ] Keep all contract fields JSON-compatible and avoid runtime parsing, network access, DOM dependencies, React imports, or data-script imports.
- [ ] Represent page IDs, revision IDs, timestamps, URLs, file metadata, and reviewer notes without assuming a single source API.
- [ ] Support records that mix factual metadata, copied text, derived values, manual overrides, and ambiguous fields.
- [ ] Export new public source-policy types from `src/domain/index.ts`.
- [ ] Add synthetic fixtures for representative wiki, image-info-only, community-link-only, manual-override, QA-finding, and ambiguous-source records.
- [ ] Add tests proving those fixtures round-trip through JSON and remain plain data.

### Phase 4: Artifact Retention And Commit Policy

**Files:**

- `data/README.md`
- `data/source-snapshots/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `scripts/data/README.md`
- `.gitignore`

**Tasks:**

- [ ] Update data directory documentation with raw snapshot, normalized generated data, QA report, fixture, icon metadata, and screenshot policies.
- [ ] Document when generated data may be committed: small, deterministic, app/test-required, reproducible, provenance-complete, and QA-reviewed.
- [ ] Document that raw snapshots and generated QA reports remain ignored by default.
- [ ] Document that stable QA documentation or sourced fixtures require explicit future ticket approval and provenance metadata.
- [ ] Verify `.gitignore` behavior matches the documented retention policy; modify it only if the existing ignore rules are inconsistent.
- [ ] Confirm this sprint adds no real external Guild Wars Wiki, PvX/Fandom, icon, screenshot, or generated catalog payload.

### Phase 5: QA Reports And Manual Review Checklists

**Files:**

- `compendium/source-qa.md`
- `compendium/README.md`
- `src/domain/source.ts`
- `test/domain/contracts.test.ts`
- `test/fixtures/sourcePolicy.ts` or `test/fixtures/foundation.ts`

**Tasks:**

- [ ] Document QA finding severities, categories, affected record/field metadata, source references, closeout status, and generated artifact references.
- [ ] Define manual review checks for copied descriptions, icon metadata, screenshots, PvX/Fandom metadata, generated diffs, manual overrides, and ambiguous classifications.
- [ ] Define what reviewers must record: reviewer identifier, review timestamp, review status, accepted risk when applicable, finding IDs, and notes.
- [ ] Require critical findings to be resolved or explicitly accepted before generated data is used by the app or released publicly.
- [ ] Keep the QA work to contracts, documentation, and synthetic examples; do not build a complete validator or ingestion diff engine.
- [ ] Link the QA checklist from the compendium index.

### Phase 6: Release Gates, Verification, And Closeout

**Files:**

- `compendium/source-policy.md`
- `compendium/source-qa.md`
- `README.md`
- `work/tickets/01-source-policy-and-qa/EPIC.md`
- `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md`
- `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md`
- `work/tickets/01-source-policy-and-qa/BW-0105-release-checklist-closeout-records.md`
- `work/sprints/SPRINT-002.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Add a public release checklist covering attribution display, source links, generated-data notices, license/source notes, unresolved ambiguity, QA closeout, and media restrictions.
- [ ] Run `npm run verify`.
- [ ] If `npm run verify` does not include ticket-burn tests for any reason, run `python3 -m unittest scripts/test_ticket_burn.py` directly.
- [ ] Manually review the policy docs against EPIC-01 and BW-0101 through BW-0105 acceptance criteria.
- [ ] Manually review that no prohibited external payloads or runtime media assets were added.
- [ ] Update BW tickets, EPIC-01, `SPRINT-002`, and the sprint ledger consistently during closeout.
- [ ] Do not create a commit unless the outer runner explicitly requests one.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `work/sprints/SPRINT-002.md` | Create | Final executable sprint artifact |
| `work/sprints/ledger.tsv` | Modify | Track sprint `002` status and closeout timestamp |
| `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-01-result.json` | Create | Planning result manifest with `status: planned` |
| `work/tickets/01-source-policy-and-qa/EPIC.md` | Modify | EPIC-01 sprint linkage and final status |
| `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md` | Modify | Source policy ticket status and closeout record |
| `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md` | Modify | Provenance contract ticket status and closeout record |
| `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md` | Modify | Artifact retention ticket status and closeout record |
| `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md` | Modify | QA/manual review ticket status and closeout record |
| `work/tickets/01-source-policy-and-qa/BW-0105-release-checklist-closeout-records.md` | Modify | Release checklist and sprint closeout ticket status |
| `compendium/source-policy.md` | Create | Durable source reuse, attribution, classification, and release policy |
| `compendium/source-qa.md` | Create | QA report requirements and manual review checklists |
| `compendium/README.md` | Modify | Link source policy and QA documentation |
| `README.md` | Modify | Document the current source-policy gate for future content/data work |
| `src/domain/source.ts` | Modify | Add JSON-compatible provenance, classification, QA, and review contracts |
| `src/domain/index.ts` | Modify | Export new public source-policy contracts |
| `test/domain/contracts.test.ts` | Modify | Verify source-policy contracts remain plain JSON-compatible data |
| `test/fixtures/sourcePolicy.ts` | Create | Synthetic representative source-policy fixtures |
| `test/fixtures/foundation.ts` | Modify | Update imports or examples if source contract changes require it |
| `data/README.md` | Modify | Document data artifact lifecycle and commit policy |
| `data/source-snapshots/README.md` | Modify | Document raw snapshot retention and provenance expectations |
| `data/generated/README.md` | Modify | Document generated normalized data commit/regeneration gates |
| `data/qa/README.md` | Modify | Document QA report retention and promotion rules |
| `scripts/data/README.md` | Modify | Document future ingestion flow requirements under the source policy |
| `.gitignore` | Review | Keep raw/generated/QA artifact ignore rules aligned with documentation |

## Definition of Done

- [ ] `work/sprints/SPRINT-002.md` exists and follows the sprint template sections.
- [ ] `work/sprints/ledger.tsv` includes sprint `002` with accurate final status.
- [ ] The planning manifest exists at `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-01-result.json` and reports `status: planned`.
- [ ] EPIC-01 and BW-0101 through BW-0105 are linked to `SPRINT-002` and have consistent final statuses.
- [ ] A durable compendium source policy documents allowed and disallowed reuse for factual metadata, copied text, derived values, manual overrides, icons, screenshots, community links, generated records, and ambiguous cases.
- [ ] Attribution requirements include source name, source URL, page or file identity when available, revision identity, source revision timestamp, retrieval timestamp, source family, content class, license/source classification, and review notes.
- [ ] `src/domain/source.ts` exposes JSON-compatible contracts for source classification, field provenance, icon metadata, generated artifacts, QA findings, and manual review state.
- [ ] Existing domain consumers still typecheck after the source contract changes.
- [ ] Synthetic fixtures and tests cover wiki, image-info-only, community-link-only, manual-override, QA-finding, and ambiguous-source examples without adding real external payloads.
- [ ] Data and script README files explain raw snapshot, generated data, QA report, fixture, icon metadata, and screenshot retention policies.
- [ ] `.gitignore` remains consistent with the policy that raw snapshots, generated data, and QA reports are ignored by default while README policy files stay tracked.
- [ ] QA documentation defines finding severities, required categories, manual review metadata, and closeout expectations.
- [ ] Public release gates require attribution planning, source links, generated-data notices, license/source notes, unresolved ambiguity review, QA closeout, and media restriction checks.
- [ ] No real external Guild Wars Wiki, PvX/Fandom, icon, screenshot, or generated catalog payload is added.
- [ ] No live fetcher, parser, complete QA engine, runtime attribution UI, media cache, backend, authentication, analytics, deployment, or PWA behavior is introduced.
- [ ] `npm run verify` succeeds.
- [ ] Manual review confirms every BW-0101 through BW-0105 acceptance criterion is satisfied before EPIC-01 is marked done.

## Risks

- **Policy mistaken for legal advice**: The sprint defines project implementation policy only. Mitigate by preserving explicit disclaimers and requiring later review before shipping copied prose or cached media.
- **Over-modeled provenance contracts**: A large schema could slow EPIC-02 or overfit to MediaWiki. Mitigate by keeping contracts shallow, additive, JSON-compatible, and source-family agnostic.
- **Under-specified ambiguity handling**: Future ingestion could treat unknown source classes as acceptable by default. Mitigate by making ambiguous and unknown classifications require manual review before runtime inclusion or public release.
- **Generated-data commit creep**: Small exceptions can become a de facto content import. Mitigate by requiring explicit tickets, provenance completeness, deterministic generation, and QA closeout.
- **PvX/Fandom scope leakage**: Community pages contain useful metadata but also guide prose and ratings text. Mitigate by allowing metadata and links only until a later policy decision.
- **Media asset confusion**: Icon metadata may be mistaken for permission to cache icon files. Mitigate by documenting metadata-only handling and blocking runtime media use in this sprint.
- **Documentation drift**: Policy, data README files, and TypeScript contracts could diverge. Mitigate by testing representative contract examples and linking policy docs from the compendium and README.

## Security

- No secrets, credentials, API tokens, accounts, backend service, database, deployment target, or hosted sharing are introduced.
- No network access is required for sprint verification.
- Source strings and future imported text must be treated as untrusted data; do not render source, guide, wiki, or PvX/Fandom text as raw HTML.
- URL fields are provenance references, not trusted navigation or fetch targets.
- Hashes such as MediaWiki `sha1` identify media metadata but do not prove safety, ownership, or permission for runtime use.
- Manual review records should use non-sensitive reviewer identifiers or handles; do not store private personal data in fixtures or policy examples.
- Ignored raw/generated artifacts under `data/` must not become a place for secrets or unpublished release material.

## Dependencies

- Completed `SPRINT-001 Project Foundation`.
- `EPIC-01 Source Policy and QA`.
- BW-0101 through BW-0105 ticket files.
- Existing single-package React/Vite/TypeScript/Vitest/ESLint/Prettier setup.
- Existing `src/domain` plain-data boundary and `tsconfig.domain.json`.
- Existing data directories: `data/source-snapshots/`, `data/generated/`, and `data/qa/`.
- Existing documentation locations: `README.md`, `compendium/README.md`, and `compendium/decisions/0001-project-foundation.md`.
- Existing verification command: `npm run verify`.
- Python 3 for ticket-burn unit tests included in verification.

No live Guild Wars Wiki, PvX/Fandom, MediaWiki API, external image host, database, cloud service, or legal-review provider is required to complete this sprint.

## Open Questions

1. Should source-policy docs live as `compendium/source-policy.md` and `compendium/source-qa.md`, or should the compendium introduce a `policies/` subdirectory before more policies exist?
2. Which exact generated-data size or record-count threshold should require explicit ticket approval, beyond the qualitative rule of small, deterministic, app/test-required data?
3. Who is allowed to mark ambiguous source classifications as accepted for release, and is a reviewer handle plus timestamp enough for the first local-only milestone?
4. What wording should later runtime attribution UI use for Guild Wars Wiki, ArenaNet/NCSoft-owned material, and generated-data notices?
5. Should critical QA findings ever be explicitly accepted for local development fixtures, or should acceptance be reserved for release closeout only?
6. When offline/PWA work begins, what additional policy decision is required before caching icon files or other media assets?