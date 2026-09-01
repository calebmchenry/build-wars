# SPRINT-002 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-002-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-002-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-002-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-002-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-002-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-002-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-002-GPT54-CRITIQUE.md`

GPT-5.5 and GPT-5.4 critique artifacts were recovered from their logs after the child agents wrote
direct files and the `-o` capture replaced the artifacts with confirmation text. The recovered files
preserve the substantive critique conclusions used for merge.

## Orientation Summary

- `SPRINT-001 Project Foundation` is complete. The repo has a React/Vite/TypeScript app scaffold,
  a framework-neutral `src/domain` boundary, synthetic fixtures, reserved data directories, and
  `npm run verify`.
- `EPIC-01 Source Policy and QA` is the policy gate before EPIC-02 ingestion and later content
  epics import real Guild Wars Wiki, PvX/Fandom, icon, screenshot, or generated catalog data.
- The current `src/domain/source.ts` and `CatalogRecord.source` model is intentionally thin and
  singular. It cannot express mixed field-level provenance, copied versus derived values, source
  classification, manual overrides, artifact lineage, or QA findings.
- Existing data directories are ignored by default except README policy files. `.gitignore` already
  has broad deny-by-default rules for `data/source-snapshots`, `data/generated`, and `data/qa`.
- The sprint should produce policy, contracts, synthetic tests, and checklists only. Live fetchers,
  parsers, real source payloads, media caching, and runtime attribution UI remain out of scope.

## Accepted

- Use GPT-5.6 Sol as the architectural base because it best addresses field-level provenance,
  artifact lineage, non-waivable QA cases, and the current single-source model.
- Use GPT-5.4's stricter sequence: `BW-0101 -> BW-0102 -> BW-0103 -> BW-0104 -> BW-0105`. Artifact
  documentation should wait for the contract vocabulary to settle.
- Use GPT-5.5's traceability checks and fallback validation note: `npm run verify` is canonical, and
  `python3 -m unittest scripts/test_ticket_burn.py` should be run directly only if `verify` ever
  stops including it.
- Make the `CatalogRecord.source` to `CatalogRecord.provenance` migration explicit and narrow while
  the repo has only synthetic fixtures.
- Keep source family, material classification, provenance method, rights basis, project use decision,
  and review state as separate concepts.
- Define JSON Pointer field claims with whole-record scope, pointer escaping, source ID resolution,
  and test-only checks. TypeScript representation is not treated as input validation.
- Define non-waivable release-blocking cases: unknown copied material, digest mismatch, and
  unreadable artifacts must be resolved or excluded before public release.
- Define exception authority conservatively: until richer governance exists, public copied-content
  or media exceptions need an explicit future ticket and named maintainer/reviewer approval.

## Rejected

- Rejected GPT-5.5's additive-contract posture. Keeping both singular `source` and aggregate
  provenance would create competing truth before EPIC-02.
- Rejected making this sprint implement fetch, normalize, validate, publish, runtime attribution UI,
  or full QA engine behavior. EPIC-01 should define the policy and contract target for EPIC-02.
- Rejected putting the planning result manifest inside the future sprint execution DoD. This
  planning run writes the manifest; the executor should not recreate it.
- Rejected a single overloaded license/source enum. The final sprint separates source origin,
  material class, rights assertion, use decision, and review state.
- Rejected a universal source freshness threshold. EPIC-02 should define source-specific freshness
  profiles, while missing revision/retrieval metadata is always a finding.

## Interview

Interview was skipped under the automation contract. Assumptions recorded in the intent and manifest:

- No high-risk architecture choice requires human confirmation because EPIC-01 already sets
  conservative defaults.
- SPRINT-002 is the next sprint after completed SPRINT-001.
- EPIC-01 can remain `backlog` during planning while BW-0101 through BW-0105 are `ready` and linked
  to SPRINT-002.
- This planning run does not modify implementation code or create a commit.

## Local Feasibility Notes

- The planned provenance migration touches a small known surface:
  `src/domain/source.ts`, `src/domain/catalog.ts`, `src/domain/index.ts`,
  `test/fixtures/foundation.ts`, and `test/domain/contracts.test.ts`.
- `.gitignore` already encodes the broad data artifact ignore policy; execution should audit it
  before changing it.
- `npm run verify` already includes formatting, linting, typechecking, Vitest, build, and
  ticket-burn unit tests, so no new validation command is required.
