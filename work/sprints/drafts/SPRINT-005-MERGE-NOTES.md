# SPRINT-005 Merge Notes

## Amendment

The original merge decision naming `Guild Wars Wiki:Game integration/Skills/0` as the seed authority
is superseded. Live source-shape validation found that exact title missing. `SPRINT-005` now uses
`Guild Wars Wiki:Game integration/Skills` as the source-set index and its linked ranged skill pages
under `Guild Wars Wiki:Game integration/Skills/*` as the authoritative seed set.

## Inputs

- Intent: `work/sprints/drafts/SPRINT-005-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-005-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-005-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-005-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-005-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-005-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-005-GPT54-CRITIQUE.md`

## Accepted

- Use the `gpt-5.6-sol` draft as the architectural base because it most clearly handles high-volume source discovery, digest-confirmed live fetches, selected snapshot-set replay, copied-description review, EPIC-03 dependency validation, semantic versioning, and QA gates.
- Keep the `gpt-5.4`/`gpt-5.5` six-phase sequencing because it is easier to execute: contracts/profile, source set, infobox fields, progression/splits, QA/promotion, docs/closeout.
- Add a Phase 1 source-shape checkpoint before detailed schema freeze. It must size the source set, representative page shapes, description corpus, progression forms, split forms, icon fields, and output/QA volume.
- Use `Guild Wars Wiki:Game integration/Skills` as the source-set index and its linked ranged skill pages under `Guild Wars Wiki:Game integration/Skills/*` as the authoritative seed set. If the checkpoint proves that bounded family is incomplete for known template IDs, implementation blocks for a planning amendment rather than silently broadening the crawl.
- Require a two-step live protocol: discover and write a source plan/digest, then fetch details only with the exact digest supplied back to the CLI. The CLI may lower caps for smoke tests but cannot raise code-owned caps.
- Add a run-level `SourceSnapshotSetManifest` for EPIC-04. Offline replay must use one complete selected set and reject partial, extra, missing, duplicated, mixed-profile, or digest-mismatched inputs.
- Treat EPIC-03 catalog, manifest digest, relevant section digests, and QA gate state as validated dependencies before skill profession/attribute joins.
- Separate runtime catalog ownership from manifest/QA ownership. The catalog should hold semantic skill facts, compact source/provenance IDs, dependency digests, source-set summary/dispositions, skills, progressions, split groups, and remote media references. The adjacent manifest and QA report own child snapshot paths, artifact digests, full review evidence, and release gates.
- Defer acquisition metadata completely from schema v1. Guide-specific acquisition facts belong in a later bounded EPIC-19 ticket.
- Require description states and review invalidation rules. Runtime description text must be derived from safe tokens and digest-bound review; unknown copied material blocks or is excluded before promotion.
- Separate costs from timings, support simultaneous cost components, and make zero, absent, not-applicable, numeric, percent, and special values explicit.
- Use normalized PvE/PvP variant groups with one member per mode where source evidence exists, and return explicit ambiguity for unknown mode instead of choosing a runtime default.
- Add early review-volume and mid-sprint output-size checkpoints so description review, disposition review, catalog bytes, QA bytes, and verification time do not fail only at promotion.

## Rejected Or Adjusted

- Rejected embedding the adjacent generated artifact manifest or local snapshot paths in the runtime catalog. This avoids circular digest ownership and keeps runtime consumers independent of repository-local audit paths.
- Rejected optional acquisition metadata. Conditional inclusion expands source scope and review cost without being needed for the first skills catalog.
- Rejected source-set expansion by category/list crawling. Bounded cross-checks may create omission QA findings, but they cannot expand the accepted source set inside this sprint without a recorded amendment.
- Rejected promotion from fixture or stale offline data alone. Production promotion requires a complete bounded live refresh and deterministic offline replay.
- Rejected a full UI tooltip feature. The sprint may add pure domain/test helpers for renderer-neutral tooltip tokens, but UI rendering, accessibility presentation, mode selection, and rule legality remain later work.
- Rejected treating rendered wiki descriptions as sufficient or automatically safe. Description text is source-policy material.
- Adjusted `gpt-5.6-sol` detail into a shorter grouped DoD so executors can distinguish architecture, source-set, content, review, determinism, promotion, and closeout gates.

## Interview

Interview skipped under the non-interactive ticket-burn contract. The plan extends existing EPIC-02 ingestion and EPIC-03 catalog patterns; the higher-risk choices are resolved by explicit source-shape, digest-confirmation, and promotion gates instead of a routine interview.

## Final Assumptions

- `SPRINT-005` is the next sprint because `SPRINT-001` through `SPRINT-004` are completed and the ledger has no active sprint.
- EPIC-04 can be planned as one executable sprint because source discovery, extraction, progression, QA, and promotion are tightly coupled for the first skills catalog.
- `Guild Wars Wiki:Game integration/Skills` is the source-set index, and its linked ranged skill pages are the authoritative seed set for this sprint; source-shape proof may block but may not silently broaden the accepted source set.
- Live refresh, description/review closeout, selected offline replay, and first-baseline review are required for production promotion and completed sprint status.
- Schema v1 excludes acquisition metadata.
- The runtime catalog should stay smaller than the audit surface; manifest and QA artifacts own full promotion evidence.
- Existing EPIC-02 and EPIC-03 behavior must remain compatible unless an implementation ticket explicitly records and verifies a schema migration.
