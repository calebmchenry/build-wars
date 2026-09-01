---
id: SPRINT-002
title: Source Policy and QA
status: planned
source_target: BACKLOG
source_epic: EPIC-01
source_epic_path: work/tickets/01-source-policy-and-qa/EPIC.md
tickets:
  - BW-0101
  - BW-0102
  - BW-0103
  - BW-0104
  - BW-0105
date: 2026-09-01
---

# Sprint 002: Source Policy and QA

## Overview

This sprint turns `EPIC-01` into the policy and contract gate that later content ingestion work
must pass before substantial Guild Wars Wiki, PvX, Fandom, icon, screenshot, or generated-data
imports begin. The output is not a fetcher or parser. The output is a durable source-use policy, a
plain-data provenance contract, explicit artifact retention rules, and a QA/release checklist that
later epics can execute against.

The implementation should preserve the single-package architecture from `SPRINT-001`, keep
`src/domain` framework-neutral, and use only synthetic examples where tests need executable
coverage. No real external content, cached media, or live ingestion tooling belongs in this sprint.

The key sequencing decision is to make policy authoritative before contracts, make contracts stable
before data-directory rules, and make QA/release gates depend on both. That ordering minimizes
rework in `EPIC-02` and keeps verification concrete at each phase.

## Use Cases

1. **Decide whether a source artifact may be copied, derived, linked, or rejected**: A contributor
   can classify Guild Wars Wiki text, game-owned material, icon metadata, screenshots, and
   community guide content without reopening baseline policy debates.
2. **Attach durable provenance to generated records**: Future ingestion scripts can represent source
   identity, revision metadata, copied-versus-derived fields, manual overrides, and review status
   using plain JSON-compatible contracts in `src/domain`.
3. **Know what belongs in Git**: A contributor can tell whether raw snapshots, normalized generated
   data, QA reports, fixtures, icon metadata, or screenshots should be committed, ignored, or kept
   as development-only references.
4. **Review generated data before app usage or release**: A reviewer can evaluate missing
   attribution, stale revisions, ambiguous source classifications, manual overrides, and generated
   diffs using one documented QA and release checklist.
5. **Unblock later content epics**: `EPIC-02` and later work can rely on `SPRINT-002` for source
   policy, provenance vocabulary, artifact retention, and release gates instead of inventing those
   rules ad hoc.

## Architecture

### Decisions

- Keep normative source-use policy in one durable compendium document, with shorter operational
  summaries in the data-directory README files.
- Extend `src/domain/source.ts` additively so existing catalog/build/party/guide contracts continue
  to typecheck while gaining enough provenance structure for generated records and future snapshots.
- Keep all new contracts plain-data and JSON-compatible. Do not add runtime classes, `Date`,
  `Map`, `Set`, or source-specific SDK types.
- Treat source policy as project policy, not legal advice. Ambiguous or unknown cases must be
  representable and reviewable rather than guessed away.
- Store icon and screenshot metadata only where allowed. Do not store image binaries in this sprint.
- Keep PvX/Fandom/community guide content metadata-and-link-only. Do not copy guide prose, ratings,
  or usage notes.
- Use synthetic fixtures and tests to prove representational coverage. Do not import real external
  source payloads.

### Dependency Direction

```text
compendium/source-policy.md
  -> defines source classification, attribution, retention, QA, and release rules
  -> informs data/* README summaries
  -> informs src/domain/source.ts vocabulary

src/domain/source.ts
  -> exported by src/domain/index.ts
  -> consumed by existing domain records
  -> exercised by synthetic fixtures and domain tests

scripts/data (future only)
  -> src/domain
  -> data/source-snapshots
  -> data/generated
  -> data/qa
```

The sprint should execute in this order:

1. Publish the policy baseline.
2. Encode the policy vocabulary in domain contracts.
3. Align repo retention and documentation with the contracts.
4. Define QA/manual review/release gates on top of the policy and contracts.
5. Close out tickets, sprint records, and verification only after the prior layers are complete.

### Policy And Contract Boundaries

- `compendium/source-policy.md` should be the canonical policy reference for source reuse,
  attribution, manual review, QA categories, and release gates.
- `data/source-snapshots/README.md`, `data/generated/README.md`, `data/qa/README.md`, and
  `scripts/data/README.md` should summarize local directory behavior and point back to the
  compendium policy when needed.
- `src/domain/source.ts` should describe representational shapes only. It should not embed fetch
  logic, validators, or release workflows.
- `test/fixtures` and `test/domain` should prove the shapes are executable and JSON-compatible, not
  prove Guild Wars content correctness.

### Verification Contract

`npm run verify` remains the canonical repository validation command. This sprint should also rely
on targeted intermediate checks so failures surface at the phase that introduced them:

- After policy and documentation changes: manual review against `EPIC-01` plus `npm run verify`
- After contract changes: `npm run typecheck`, `npm run test:run`, then `npm run verify`
- After closeout updates: `npm run verify` plus manual linkage review of EPIC, BW tickets, sprint,
  and ledger status

## Implementation

### Phase 1: Traceability And Policy Baseline (~15% of effort)

**Files:**

- `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md`
- `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md`
- `work/tickets/01-source-policy-and-qa/BW-0105-release-checklist-closeout-records.md`
- `work/tickets/01-source-policy-and-qa/EPIC.md`
- `compendium/source-policy.md`
- `compendium/README.md`

**Tasks:**

- [ ] Create `compendium/source-policy.md` as the canonical source-policy document for `EPIC-01`.
- [ ] Define explicit classification rules for factual metadata, copied contributor text,
      game-owned material, derived values, manual overrides, icon metadata, screenshots, community
      links, and ambiguous or unknown source cases.
- [ ] Define the minimum attribution record required whenever copied text or metadata is retained:
      source name, source family, source URL, page or file identity when available, revision
      identity, source revision timestamp, retrieved timestamp, and source/license notes.
- [ ] State clearly that PvX/Fandom/community guide content is metadata-and-link-only for now, and
      that icon files, screenshots, and large copied page bodies remain out of scope as runtime or
      repo assets.
- [ ] Link the new policy from `compendium/README.md` and keep the BW-0101 through BW-0105 tickets
      aligned with the final sprint structure.

**Verification:**

- Manual review against `work/tickets/01-source-policy-and-qa/EPIC.md`
- `npm run verify`

### Phase 2: Provenance And Classification Contracts (~30% of effort)

**Files:**

- `src/domain/source.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/fixtures/source-policy.ts`
- `test/fixtures/foundation.ts`

**Tasks:**

- [ ] Extend `src/domain/source.ts` with additive plain-data types for source family, source
      classification, copied-versus-derived field provenance, manual override provenance, artifact
      metadata, review status, and QA-ready source records.
- [ ] Preserve existing `AuthoredDocumentRoot`, `CatalogVersionRef`, and current source-bearing
      domain consumers unless a narrow rename is necessary and applied consistently.
- [ ] Represent icon handling as metadata-only records, including file title, URL, MIME type, size,
      timestamp, and sha1 where known, without introducing cached binaries.
- [ ] Add synthetic representative fixtures for at least these cases: wiki copied text with
      attribution, icon metadata only, community-link-only metadata, manual override with review
      notes, and ambiguous source classification requiring follow-up.
- [ ] Expand domain tests to cover JSON round-tripping and public export coverage for the new
      provenance shapes.

**Verification:**

- `npm run typecheck`
- `npm run test:run`
- `npm run verify`

### Phase 3: Artifact Retention And Repository Documentation (~20% of effort)

**Files:**

- `.gitignore`
- `README.md`
- `scripts/data/README.md`
- `data/README.md`
- `data/source-snapshots/README.md`
- `data/generated/README.md`
- `data/qa/README.md`
- `compendium/source-policy.md`

**Tasks:**

- [ ] Update the data and script READMEs so raw snapshots, normalized generated data, QA reports,
      fixtures, icon metadata, and screenshot references each have explicit commit-or-ignore rules.
- [ ] Preserve the rule that raw snapshots stay ignored by default under `data/source-snapshots/`
      and QA reports stay ignored by default under `data/qa/`, while README policy files remain
      tracked.
- [ ] Document that small deterministic normalized JSON may be committed only when it is needed by
      the app or tests and carries the required provenance metadata.
- [ ] Keep synthetic fixtures allowed only when minimized, clearly labeled non-authoritative, and
      free of copied real external payloads.
- [ ] Verify `.gitignore` remains consistent with the documented raw/generated/QA retention policy.

**Verification:**

- Manual review of README and `.gitignore` alignment
- `npm run verify`

### Phase 4: QA Reporting And Manual Review Workflow (~20% of effort)

**Files:**

- `compendium/source-policy.md`
- `data/qa/README.md`
- `src/domain/source.ts`
- `src/domain/index.ts`
- `test/domain/contracts.test.ts`
- `test/fixtures/source-policy.ts`

**Tasks:**

- [ ] Define the required QA finding categories and severities for future ingestion output: missing
      provenance, stale revision metadata, ambiguous source or license status, copied text without
      attribution, manual overrides, icon metadata gaps, and generated-data diff review.
- [ ] Define the manual review checklist fields future reviewers must record, including reviewer
      identity, review date, artifact scope, decision, rationale, and follow-up status.
- [ ] Add only the minimum contract or fixture support needed to express synthetic QA examples. Do
      not build a full validator, fetcher, parser, or report generator.
- [ ] State the release rule that critical findings must be resolved or explicitly accepted before
      generated data is used by the app or included in a public release.
- [ ] Keep all QA and review outputs discoverable from the canonical policy document and the
      `data/qa` directory contract.

**Verification:**

- Manual review against BW-0104 acceptance criteria
- `npm run typecheck`
- `npm run test:run`
- `npm run verify`

### Phase 5: Release Gates And Closeout Records (~15% of effort)

**Files:**

- `compendium/source-policy.md`
- `work/tickets/01-source-policy-and-qa/EPIC.md`
- `work/tickets/01-source-policy-and-qa/BW-0101-source-reuse-attribution-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0102-provenance-classification-contracts.md`
- `work/tickets/01-source-policy-and-qa/BW-0103-artifact-retention-commit-policy.md`
- `work/tickets/01-source-policy-and-qa/BW-0104-qa-manual-review-checklists.md`
- `work/tickets/01-source-policy-and-qa/BW-0105-release-checklist-closeout-records.md`
- `work/sprints/SPRINT-002.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Add a public release checklist covering attribution display, source links, generated-data
      notices, source/license notes, ambiguous-source review, manual override review, and media
      asset restrictions.
- [ ] Ensure `SPRINT-002`, `EPIC-01`, and BW-0101 through BW-0105 remain linked and move through
      status changes consistently during execution.
- [ ] Run the canonical repository verification command after all planned changes are in place.
- [ ] Mark `EPIC-01` done only after every BW ticket acceptance criterion and every sprint
      Definition of Done item passes.
- [ ] Leave no actionable unchecked items in the final execution copy of `work/sprints/SPRINT-002.md`.

**Verification:**

- `npm run verify`
- Manual review of EPIC, BW ticket, sprint, and ledger consistency

## Files Summary

| File                                                                                 | Action        | Purpose                                                                    |
| ------------------------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------- |
| `compendium/source-policy.md`                                                        | Create        | Canonical source policy, QA workflow, and release checklist                |
| `compendium/README.md`                                                               | Modify        | Index the new durable policy document                                      |
| `src/domain/source.ts`                                                               | Modify        | Add provenance, classification, artifact, review, and QA-related contracts |
| `src/domain/index.ts`                                                                | Modify        | Export the new source-policy contract surface                              |
| `test/fixtures/source-policy.ts`                                                     | Create        | Synthetic representative provenance and QA examples                        |
| `test/fixtures/foundation.ts`                                                        | Modify        | Reuse or extend synthetic fixtures without introducing real source content  |
| `test/domain/contracts.test.ts`                                                      | Modify        | Verify JSON round-tripping and public contract coverage                    |
| `.gitignore`                                                                         | Modify        | Keep raw/generated/QA artifacts ignored while policy README files track    |
| `README.md`                                                                          | Modify        | Document retention rules and verification expectations                     |
| `scripts/data/README.md`                                                             | Modify        | Describe future script responsibilities under the new policy               |
| `data/README.md`                                                                     | Modify        | Summarize artifact categories and retention expectations                   |
| `data/source-snapshots/README.md`                                                    | Modify        | Clarify raw snapshot handling and ignore policy                            |
| `data/generated/README.md`                                                           | Modify        | Clarify when normalized generated data may be committed                    |
| `data/qa/README.md`                                                                  | Modify        | Clarify QA report retention and review expectations                        |
| `work/tickets/01-source-policy-and-qa/EPIC.md`                                       | Modify        | Keep epic linkage and closeout status accurate                             |
| `work/tickets/01-source-policy-and-qa/BW-0101-*.md` through `BW-0105-*.md`          | Modify        | Keep ticket status, linkage, and acceptance records accurate               |
| `work/sprints/SPRINT-002.md`                                                         | Create/Modify | Final execution record for the sprint                                      |
| `work/sprints/ledger.tsv`                                                            | Modify        | Track sprint status consistently with ticket-burn conventions              |

## Definition of Done

- [ ] A canonical source-policy document exists in the compendium and is linked from
      `compendium/README.md`.
- [ ] The policy clearly distinguishes factual metadata, copied contributor text, game-owned
      material, derived values, manual overrides, icon metadata, screenshot references, community
      links, and ambiguous or unknown source cases.
- [ ] Attribution requirements are explicit and include source name, source family, source URL,
      page or file identity when available, revision identity, source revision timestamp, retrieved
      timestamp, and source/license notes.
- [ ] `src/domain/source.ts` can represent source classification, copied-versus-derived provenance,
      metadata-only image records, manual overrides, review status, and QA-ready artifact metadata
      as plain JSON-compatible data.
- [ ] Existing domain consumers continue to typecheck after the contract extension.
- [ ] Synthetic fixtures and tests cover representative wiki, icon-metadata-only, community-link,
      manual-override, and ambiguous-source cases.
- [ ] JSON round-trip tests pass for representative provenance and QA records.
- [ ] Data and script READMEs define explicit retention rules for raw snapshots, normalized
      generated data, QA reports, fixtures, icon metadata, and screenshot references.
- [ ] `.gitignore` remains consistent with the documented retention policy and does not hide tracked
      README policy files.
- [ ] The QA policy defines finding categories and severities for missing provenance, stale
      revisions, ambiguous source status, copied text without attribution, manual overrides, icon
      metadata gaps, and generated-data diff review.
- [ ] The manual review workflow defines who reviewed what, when, what decision was made, and why.
- [ ] The release checklist requires attribution, source links, generated-data notices,
      source/license notes, and resolution or explicit acceptance of critical findings before app
      usage or public release.
- [ ] No live fetcher, parser, runtime attribution UI, cached icon binaries, screenshots, or real
      external source payloads are introduced by this sprint.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm run test:run` succeeds.
- [ ] `npm run verify` succeeds.
- [ ] BW-0101 through BW-0105 remain linked to `EPIC-01` and `SPRINT-002`, and are marked done only
      after their acceptance criteria pass.
- [ ] `EPIC-01` is marked done only after every sprint criterion passes.
- [ ] `work/sprints/ledger.tsv` contains `SPRINT-002` with the final execution status.
- [ ] The final execution copy of `work/sprints/SPRINT-002.md` has no actionable unchecked items
      when execution reports completion.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk                                                                     | Likelihood | Impact | Mitigation                                                                                 |
| ------------------------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------ |
| Policy prose and domain contract names drift apart                       | Medium     | High   | Publish the canonical policy first, then align contract vocabulary and README summaries    |
| Provenance contracts overfit one source API                              | Medium     | High   | Use source-neutral fields and additive shapes that describe concepts, not fetch responses  |
| QA requirements stay too vague for `EPIC-02` to automate                 | Medium     | High   | Define explicit finding categories, severities, and required reviewer metadata             |
| Retention rules and `.gitignore` diverge                                 | Medium     | Medium | Update README files and ignore rules together, then verify tracked README visibility        |
| Synthetic fixtures accidentally imply authoritative Guild Wars content   | Medium     | Medium | Keep fixtures minimal, clearly labeled synthetic, and free of copied external payloads      |
| Conservative policy blocks later useful ingestion unnecessarily          | Low        | Medium | Allow additive future exceptions, but require explicit ticketed policy changes             |
| Ambiguous source classes are treated as approved by omission             | Medium     | High   | Require explicit manual review status and release gating for ambiguous or unknown material  |

## Security

- Treat raw snapshots, generated data, copied text, and source metadata as untrusted inputs even
  when they are stored locally.
- Do not add live network fetches, remote services, secrets, tokens, or environment-specific
  credentials.
- Do not introduce runtime rendering of untrusted HTML or large copied third-party prose.
- Keep icon and screenshot handling metadata-only in this sprint; do not commit or bundle binary
  media assets.
- Keep domain contracts framework-neutral and deterministic so later validators and importers can
  reason about them safely.
- Limit dependency changes to domain typing, tests, and documentation support already justified by
  the sprint scope.

## Dependencies

- `EPIC-00` and `SPRINT-001` are complete and provide the current domain boundary, data-directory
  layout, and canonical `npm run verify` command.
- BW-0101 must complete before BW-0102 and BW-0103, because policy decisions define the vocabulary
  used by contracts and retention rules.
- BW-0102 and BW-0103 must complete before BW-0104, because QA requirements need stable
  provenance-contract fields and artifact categories.
- BW-0105 depends on BW-0101 through BW-0104, because release gates and closeout records only make
  sense after policy, contracts, retention rules, and QA expectations are settled.
- Node.js, npm, and Python 3 remain required for repository verification.
- This sprint should complete before `EPIC-02` and any later content epic imports substantial
  external source material.

## Open Questions

- Should the future stale-revision rule be one generic threshold across all source families, or a
  source-specific threshold defined by `EPIC-02`?
- Is one canonical `compendium/source-policy.md` sufficient long term, or should the release
  checklist eventually split into its own compendium page once execution workflows expand?
- When deterministic generated JSON is later committed, should review acceptance live only in QA
  reports, or also in a stable checked-in manifest?
- Does reviewer identity need a stricter schema than free-form text before multi-contributor
  release workflows begin?