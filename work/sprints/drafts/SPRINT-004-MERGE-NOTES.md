# SPRINT-004 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-004-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-004-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-004-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-004-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-004-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-004-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-004-GPT54-CRITIQUE.md`

## Accepted

- Use the `gpt-5.6-sol` draft as the architectural base because it most clearly defines profile-driven ingestion, source reconciliation, deterministic artifact versioning, QA gates, and exact-path promotion.
- Keep the `gpt-5.5` scope framing and ticket mapping because it matches the BW-0301 through BW-0306 traceability files created for this epic.
- Keep the `gpt-5.4` phase acceptance style and concise sequencing, but merge it into the explicit ticket contracts.
- Add an early source-shape checkpoint before extractor boundaries and fixtures are frozen.
- Represent template IDs separately from catalog IDs. Version 1 may use equal numeric values, but the crosswalk is the compatibility contract.
- Preserve profession template ID `0` as the `None` sentinel outside the playable profession catalog, and preserve attribute ID `0` in the attribute namespace.
- Use one combined runtime-eligible catalog artifact with section digests so consumers can validate the portions they need.
- Require one bounded live refresh followed by offline replay for production promotion. Keep `npm run verify` fixture/offline-only.
- Treat first promotion with no prior EPIC-03 baseline as an explicit reviewed baseline creation event.
- Promote a bounded machine-readable QA JSON report with the catalog and manifest; keep raw snapshots, snapshot manifests, live outputs, and media bytes ignored.

## Adjusted Or Rejected

- Rejected direct `catalogId == templateId` coupling as the contract. The final sprint allows equal v1 values only through explicit crosswalk records.
- Rejected broad optional live refresh for production promotion. Network is not part of automated verification, but promotion requires one reviewed live refresh and replay.
- Rejected QA summary-only promotion. A bounded QA JSON report is more auditable and remains non-runtime data.
- Rejected copied primary-attribute prose. The sprint requires original derived summaries with field-level provenance and manual review.
- Rejected broad source crawling. The EPIC-03 profile must name and cap source pages; extractors consume verified snapshots.
- Rejected putting allocation assumptions in build state. The final sprint keeps static allocation facts in catalog/reference contracts and defers rule enforcement to EPIC-06.
- Rejected artifact name variants. The final paths use `professions-attributes.catalog.json`, its adjacent manifest, and matching QA JSON.

## Interview

Interview skipped under the non-interactive ticket-burn contract. Architecture uncertainty is low enough because the plan extends the EPIC-02 ingestion spine and EPIC-01 policy gates. Remaining choices are resolved by assumptions in the final sprint.

## Final Assumptions

- EPIC-03 is one executable sprint because its extraction, QA, generated artifact, and promotion decisions form one tightly coupled content catalog.
- Source-shape surprises during execution should block or adjust implementation inside the sprint, not create a new scraper or bypass the shared ingestion spine.
- A bounded live refresh is acceptable as a production-promotion gate, while all canonical validation remains offline.
- Primary-effect summaries are required for EPIC closeout but must be original derived text with complete review evidence.
- Missing or ambiguous icon metadata may be nullable with QA disposition unless it violates media policy, provenance, or artifact integrity.
- Raw snapshots and snapshot manifests remain untracked; reproducibility relies on source revision coordinates, local review artifacts during promotion, and documented external-history limitations.
