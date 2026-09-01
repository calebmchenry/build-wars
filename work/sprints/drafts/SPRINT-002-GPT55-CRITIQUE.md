## Reviewed Artifacts

- Reviewed: `work/sprints/drafts/SPRINT-002-GPT56SOL-DRAFT.md`
- Reviewed: `work/sprints/drafts/SPRINT-002-GPT54-DRAFT.md`
- Both requested drafts were present.
- `work/sprints/drafts/SPRINT-002-GPT55-DRAFT.md` was not reviewed.

## `SPRINT-002-GPT56SOL-DRAFT.md`

### Strengths

- Strongest architectural model of the two drafts. It correctly separates source family, content classification, provenance method, license metadata, manual overrides, and review approval instead of collapsing them into one overloaded source field.
- The proposed migration from `CatalogRecord.source` to `CatalogRecord.provenance` is defensible. The current codebase has only a simple nullable `source` field and synthetic fixtures, so this is the cheapest moment to avoid a future schema break.
- Field-level provenance via JSON Pointer directly addresses the Guild Wars Wiki mixed-content problem from `EPIC-01`.
- The artifact lifecycle model is clear: raw snapshot, generated artifact, QA report, reviewed release candidate. That gives `EPIC-02` a coherent target.
- The retention matrix, exact-path allowlist guidance, and warning against `git add -f` are practical and reduce repo-size/licensing drift.
- The QA model is better than the ticket baseline: stable categories, severity semantics, dispositions, non-waivable cases, and freshness-profile deferral are all useful.
- The Definition of Done is unusually complete and would catch many execution failures.

### Weaknesses

- The draft may over-design `EPIC-02` inside `EPIC-01`. `SourceSnapshotManifest`, `GeneratedArtifactManifest`, `QaReport`, digest rules, generator identity, and append-only lineage are valuable, but the sprint risks becoming a full ingestion architecture sprint instead of a policy/contract sprint.
- It introduces a large public contract surface all at once. That can freeze details before there is a real fetcher, parser, normalizer, validator, or generated dataset to test against.
- The `source` to `provenance` migration is right, but the draft should call it out as an explicit breaking decision with a small consumer audit. It should not be buried as an implementation detail.
- The split between `compendium/source-policy.md` and `compendium/data-qa-and-release.md` is sensible, but the draft needs stronger duplication controls. QA and release gates are referenced from both policy and data READMEs, so drift remains possible.
- JSON Pointer is a good emitted-data choice, but TypeScript cannot prove pointer validity. Without at least test helpers or future validator requirements, this can create false confidence.
- The self-contained per-record provenance model may bloat generated JSON. The draft does not compare it with an artifact-level source registry plus record-level claims.

### Gaps In Risk Analysis

- It underplays schema-version and migration risk once real generated catalogs exist.
- It does not fully address generated JSON size, provenance verbosity, source-reference duplication, or compression tradeoffs.
- It says the policy is not legal advice, but does not define an escalation path for public release when copied prose or mixed ownership remains material.
- It should call out canonical JSON/digest complexity: byte digests, line endings, property order, and generated timestamp handling can make deterministic artifacts harder than they look.
- It does not explicitly handle `.gitignore` nested allowlist complexity. Exact-path exceptions often require unignoring parent directories as well.

### Missing Edge Cases And Alternatives

- Missing edge cases: conflicting sources for one field, redirects/page moves, deleted source pages, changed license metadata, source revision unavailable, manual override superseding a specific claim, multiple reviewers, nullable fields, array-index JSON Pointers, and QA finding deduplication across regenerated reports.
- Missing alternatives: record-local source references versus artifact-level source tables; JSON Pointer versus typed field keys; TypeScript-only contracts versus future JSON Schema/Zod validation; one combined policy document versus split source/QA documents; checked-in review manifests versus QA-report-only review state.

### Definition Of Done Completeness

- Very strong overall, but it is probably too broad for one sprint unless deliberately treated as a contract/documentation sprint with no real ingestion behavior.
- Add a sharper DoD item requiring the old `source` field to be fully removed from catalog records if the migration is chosen.
- Add DoD coverage for source ID collision handling, JSON Pointer escaping, no binary media, no real external payloads, exact `.gitignore` behavior, and bounded accepted-risk records.
- Keep the synthetic tests, but avoid implying that passing TypeScript tests means policy compliance.

## `SPRINT-002-GPT54-DRAFT.md`

### Strengths

- Better scoped and easier to execute. It stays closer to the ticket language and repeatedly blocks fetchers, parsers, cached media, screenshots, and real external payloads.
- The phase ordering is clean: policy first, contracts second, retention third, QA/release fourth, closeout last.
- The additive-contract stance reduces immediate implementation risk and protects the small foundation built in `SPRINT-001`.
- Verification is practical and maps well to the current repo: `typecheck`, `test:run`, and `verify`.
- The risks table captures the main execution hazards: policy/type drift, source overfitting, vague QA requirements, retention drift, and synthetic-fixture misuse.

### Weaknesses

- The architecture is too shallow for the hard part of `EPIC-01`: mixed source classification at field level. Preserving `CatalogRecord.source` additively may leave the project with a single-source model that cannot express copied text, normalized facts, manual overrides, and ambiguous fields on the same record.
- “Existing domain consumers continue to typecheck” is not enough. The sprint needs semantic compatibility, not just compiler success.
- QA and release gates are under-specified. “Critical findings resolved or explicitly accepted” is too broad unless some cases are non-waivable and accepted risk has scope, reviewer, rationale, timestamp, and follow-up metadata.
- Artifact contracts are vague. `EPIC-02` would still need to invent snapshot identity, generated artifact identity, input lineage, digest semantics, and report shape.
- The single canonical `compendium/source-policy.md` may become overloaded if it contains reuse policy, retention rules, QA severities, manual review, and public release gates.
- Putting all tests into `test/domain/contracts.test.ts` risks muddying foundation contract tests with source-policy behavior. A dedicated `source-policy.test.ts` would keep intent clearer.

### Gaps In Risk Analysis

- It does not sufficiently cover future schema breaks if `source` remains singular.
- It does not analyze provenance verbosity, generated JSON size, or repeated source metadata.
- It leaves freshness thresholds as an open question instead of recommending a restrictive default: record revision/retrieval metadata now, defer thresholds to source-specific `EPIC-02` profiles.
- It does not address digest/canonicalization details for deterministic generated artifacts.
- It does not define how ambiguous copied content differs from lower-risk factual metadata in release gates.
- It does not mention legal escalation for public release beyond “project policy, not legal advice.”

### Missing Edge Cases And Alternatives

- Missing edge cases: multi-source fields, field-level ambiguity, source redirects, missing page IDs, unavailable revision timestamps, source-provided SHA-1 versus local SHA-256, exact `.gitignore` exceptions, manual override lineage versus review approval, and external URLs containing credentials or tracking parameters.
- Missing alternatives: breaking `source` to `provenance` now versus preserving `source`; record-local versus artifact-level provenance; split QA/release document versus one policy document; TypeScript-only contracts versus later runtime schema validation; checked-in normalized JSON versus regenerate-on-release.

### Definition Of Done Completeness

- The DoD is executable but too easy to satisfy with vague types and documentation.
- It should require field-level provenance claims, schema versioning, source ID resolution, QA finding scope/evidence/disposition fields, artifact digest/input lineage, and non-waivable release-blocking cases.
- It should explicitly require that no old and new catalog provenance fields coexist if the sprint chooses the `provenance` migration.
- It should add a manual review DoD requiring actor, timestamp, scope, decision, rationale, evidence, and follow-up identifiers.

## Comparison

- `GPT56SOL` is the better architecture draft. It addresses the actual future failure mode: single-source provenance will not survive mixed wiki pages, copied text, normalized facts, manual overrides, media metadata, and QA review.
- `GPT54` is the better execution-control draft. It is less likely to balloon into a full ingestion platform and better preserves the sprint’s documentation-and-contract intent.
- The main merge challenge is balancing `GPT56SOL`’s richer contract model with `GPT54`’s tighter scope discipline.

## Merge Recommendations

1. Use `GPT56SOL` as the architectural base, but trim anything that feels like implementation of `EPIC-02` rather than the minimum contract needed by `EPIC-01`.
2. Make the `CatalogRecord.source` to `CatalogRecord.provenance` migration an explicit sprint decision. Recommended path: do the narrow rename now for generated catalog records, update current synthetic fixtures/tests, and do not apply source provenance to ordinary authored `Build`, `PartyBuild`, or `Guide` roots.
3. Keep the three-axis model from `GPT56SOL`: source family, content classification, and provenance method. That is the most important architectural improvement.
4. Adopt field-level claims with JSON Pointer, but document pointer escaping, whole-record scope, and the fact that TypeScript alone does not validate pointer existence.
5. Use two compendium documents only if responsibilities stay clean: `source-policy.md` for reuse/classification/attribution/media rules, and `data-qa-and-release.md` for findings, dispositions, manual review, and release gates.
6. Keep artifact contracts minimal but real: define `ArtifactDigest`, source snapshot manifest identity, generated artifact identity, input lineage, and QA report shape. Do not build fetch, normalize, validate, or publish commands.
7. Strengthen release gates using `GPT56SOL`’s non-waivable cases. Unknown copied material, digest mismatch, and unreadable artifacts should require resolution or exclusion, not generic accepted risk.
8. Add the missing alternative-design notes directly to the final sprint: record-local provenance versus artifact-level source registry, JSON Pointer versus typed keys, TypeScript-only versus future runtime validation, and one policy doc versus split docs.
9. Merge `GPT54`’s scope controls into every phase: no real external payloads, no live clients, no icon binaries, no screenshots, no runtime attribution UI, no new dependencies unless separately justified.
10. Tighten the final DoD around testable outcomes: no `source`/`provenance` coexistence, synthetic-only fixtures, JSON round trips, field-level multi-source examples, media metadata without bytes, artifact lineage preservation, QA dispositions, exact `.gitignore` behavior, and consistent ticket/sprint/ledger closeout.