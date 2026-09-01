# Combined Critique: SPRINT-002 Drafts

Both requested drafts were available and reviewed.

## GPT-5.5 Draft

### Strengths

- Establishes a clear architectural boundary: policy and plain-data contracts are in scope; ingestion, parsing, runtime attribution, and real external content are not.
- Provides the more complete source vocabulary, including source families, content classes, source/license classifications, field provenance, artifacts, findings, and review state.
- Treats artifact lifecycle explicitly and distinguishes raw snapshots, generated data, QA reports, fixtures, media metadata, and development references.
- Gives strong negative scope controls and repeatedly prevents PvX/Fandom prose, media binaries, screenshots, or real external payloads from entering the sprint.
- Includes detailed traceability and closeout handling across the sprint, epic, tickets, ledger, and planning manifest.
- Has stronger security guidance than the other draft, particularly around untrusted text, URLs, reviewer identifiers, and the limits of media hashes.
- Its open questions expose several genuinely unresolved governance decisions.

### Weaknesses

- The classification model is overly confident for a sprint that disclaims legal conclusions. Values such as `gfdl-or-compatible`, `arenanet-ncsoft-owned`, and `permissive-or-public-domain` combine different concepts: ownership, license, compatibility, and project permission. Encoding these as one axis risks creating false certainty.
- The draft prescribes a broad contract surface before addressing how provenance will be stored. Embedding field-level provenance in every runtime record could increase bundle size, expose internal review notes, and tightly couple app data to ingestion metadata.
- Splitting policy and QA into `source-policy.md` and `source-qa.md` is reasonable, but normative ownership is unclear. Release rules, severity definitions, and manual-review rules appear in both conceptual areas and could drift.
- The fixed planning-manifest run path is brittle unless repository convention explicitly requires that exact historical run. The draft does not explain whether a manifest remaining `planned` is intentionally distinct from final sprint execution status.
- Verification is concentrated at closeout. Contract, documentation, and ignore-rule failures would be easier to localize with phase-level checks.
- “Critical findings may be explicitly accepted” weakens the meaning of `critical`, especially without specifying who can accept them, for which environments, for how long, and with what evidence.

### Gaps in Risk Analysis

- No risk covers taxonomy evolution or migration after EPIC-02 encounters source cases that do not fit the initial union types.
- No risk covers the runtime/build-time provenance trade-off or the possibility that detailed lineage substantially expands shipped data.
- No risk addresses the loss of audit evidence when QA reports are ignored while release depends on QA closeout.
- No risk covers policy or source-license changes after data has been generated and released.
- No risk covers the difference between documented gates and enforceable gates. The sprint may create a persuasive checklist without any mechanism ensuring future ingestion honors it.
- Synthetic-only fixtures reduce legal and content risk, but they may also conceal mismatches with real MediaWiki or community-source payloads.
- Updating status in the sprint, epic, five tickets, ledger, and manifest creates a substantial synchronization surface with no automated consistency check specified.

### Missing Edge Cases

- A field derived from multiple sources, including conflicting values and source-precedence decisions.
- A single field that is copied and then edited, summarized, translated, or normalized.
- Nested and array-valued field provenance; a simple field name may not identify a stable location.
- Redirected, renamed, deleted, or revisionless source pages.
- Unavailable source timestamps, partial retrievals, stale mirrors, and failed retrieval batches.
- Manual overrides that expire, become superseded, or require revalidation after a source update.
- Source-policy or terms changes that require takedown, regeneration, or re-review.
- Canonical timestamp format, timezone, identifier representation, URL normalization, and hash-algorithm identification.
- Generated artifacts built from multiple snapshots, generator versions, configuration versions, or transformation chains.
- Duplicate source identity across canonical pages, redirects, mirrors, and aggregators.
- Lifecycle rules for withdrawn findings and superseded review decisions.

### Definition of Done Completeness

The Definition of Done is broad and strong on files, documentation, traceability, negative scope, and repository verification. It is weaker on semantics:

- JSON round-tripping proves serializability, not that untrusted runtime data conforms to the contracts.
- It does not require a schema version or backward-compatibility strategy.
- It does not establish whether provenance is embedded, referenced, or stored in sidecars.
- It does not require stable, checked-in evidence of release approval even though detailed QA reports remain ignored.
- Manual checks for prohibited payloads, documentation alignment, and ticket acceptance are not backed by repeatable evidence.
- The critical-finding exception remains unresolved.
- The planning manifest’s permanent `planned` status is not reconciled with sprint completion.

## GPT-5.4 Draft

### Strengths

- Presents the cleaner execution sequence: policy, contracts, retention, QA, then release and closeout.
- Uses one canonical policy document, reducing immediate documentation fragmentation.
- Includes effort estimates and phase-specific verification, making the sprint more executable and failures easier to isolate.
- Explains ticket dependency order clearly and ties it to later ingestion work.
- Preserves the same valuable scope boundary: plain-data contracts and synthetic fixtures without fetchers, parsers, real payloads, or cached media.
- Its manual-review fields are stronger in some respects, explicitly including artifact scope, decision, rationale, and follow-up status.
- The risk table communicates likelihood, impact, and mitigation more effectively than an unranked list.
- Its Definition of Done explicitly runs typechecking and tests in addition to the canonical verification command.

### Weaknesses

- The contract vocabulary is underspecified. It identifies concepts but does not define the axes precisely enough to ensure policy prose, tests, and TypeScript names converge.
- A single canonical document containing reuse policy, taxonomy, QA workflow, and release checklist may become unwieldy and difficult to govern as ingestion expands.
- The `.gitignore` action is unconditionally “Modify,” even though review may show that no change is needed.
- Fixture ownership is ambiguous: both `source-policy.ts` and `foundation.ts` are listed for modification without a clear boundary between them.
- The draft omits the planning result manifest included by GPT-5.5, potentially breaking ticket-burn traceability if that artifact is required.
- “No commit is created” is framed as product completion rather than runner behavior and conflicts with environments where the outer executor explicitly owns committing.
- Requiring the final sprint document to contain no actionable unchecked items can encourage mechanically checking boxes instead of recording failures, exclusions, or not-applicable outcomes.
- It allows explicit acceptance of critical findings without defining acceptance authority or constraints.

### Gaps in Risk Analysis

- It does not analyze legal-taxonomy ambiguity even though the proposed policy will influence reuse decisions.
- It omits the risk of full field-level provenance becoming too large or inappropriate for runtime data.
- It does not address auditability when QA output is ignored.
- It omits schema evolution, versioning, and backward compatibility.
- It does not consider source-policy changes, source removals, or post-release takedown.
- It does not address whether future scripts need runtime validation rather than TypeScript-only types.
- It does not identify the process risk of duplicating status and closeout information across many files.
- It does not cover malicious or malformed URLs and text in Definition of Done, despite mentioning untrusted inputs in Security.

### Missing Edge Cases

- Multi-source and conflicting provenance.
- Provenance for nested structures, arrays, and partial transformations.
- Source redirects, deleted revisions, aliases, mirrors, and localization.
- Reviewed overrides becoming stale after upstream changes.
- Review decisions that are rejected, superseded, revoked, or time-limited.
- Generator identity, input hashes, configuration, and reproducibility evidence.
- Mixed-license pages or records containing fields with different rights bases.
- Missing retrieval metadata and partial or unsuccessful retrievals.
- Canonical formats for timestamps, URLs, IDs, field paths, and hashes.
- Separation of local-development approval from public-release approval.

### Definition of Done Completeness

The Definition of Done is operationally clearer than GPT-5.5’s because it names targeted commands and status rules. Important gaps remain:

- It does not require an explicit QA-finding fixture as clearly as GPT-5.5.
- It lacks an explicit planning-manifest criterion.
- It does not require a durable release closeout or acceptance record separate from ignored QA reports.
- It proves typechecking and serialization but not validation of untrusted source records.
- It does not define contract versioning, field-path semantics, or provenance storage strategy.
- “No unchecked items” and “no commit” are executor mechanics rather than evidence that the policy and architecture are correct.
- The release checklist requires “attribution display,” while runtime attribution UI is out of scope; the deliverable should be attribution-display requirements or planning, not an implementation.

## Cross-Draft Contradictions and Strategic Trade-offs

| Area | GPT-5.5 | GPT-5.4 | Recommended resolution |
| --- | --- | --- | --- |
| Frontmatter status | `draft` | `planned` | Use the repository’s official planning-state convention consistently. |
| Documentation | Separate policy and QA documents | One canonical policy document | Make `source-policy.md` normative and `source-qa.md` operational, with no duplicated rules. |
| Classification | Detailed fixed vocabulary | Conceptual vocabulary | Define a small stable set of orthogonal axes and allow controlled extension. |
| License modeling | Combined source/license labels | Less prescriptive | Separate origin, material type, rights assertion, allowed-use decision, and review state. |
| Provenance storage | Implies provenance on generated records | Also leaves storage unclear | Decide explicitly between embedded metadata, referenced sidecars, or a hybrid. |
| QA retention | Reports ignored; stable promotion deferred | Reports ignored; stable-manifest question deferred | Keep bulky reports ignored but commit a small closeout/decision record now. |
| `.gitignore` | Review and modify only if inconsistent | Always modify | Use GPT-5.5’s conditional approach. |
| Fixture name | `sourcePolicy.ts` or foundation fixture | `source-policy.ts` plus foundation fixture | Choose one repository-conventional fixture file and define its ownership. |
| Planning manifest | Explicit exact artifact | Omitted | Include it only if ticket-burn conventions require it; avoid inventing a second execution-status source. |
| Critical findings | May be accepted | May be accepted | Make critical a hard public-release block, or define a formal exception authority and lifecycle. |
| Attribution deliverable | Attribution-display planning | Attribution display | Require documented display requirements because UI implementation is out of scope. |
| Commits | Allowed only if outer runner requests | Prohibited | Treat commit creation as runner policy, not sprint Definition of Done. |
| Verification | Strong final verification and fallback | Strong phase-level verification | Combine phase checks with final canonical verification. |

The largest architectural tension is between precision and premature commitment. GPT-5.5’s vocabulary is specific enough to implement, but it risks freezing legal and source assumptions before real ingestion. GPT-5.4 avoids over-modeling but may leave implementers to invent incompatible meanings. The merged sprint should standardize only stable concepts and explicitly version the vocabulary.

A second major tension is provenance placement. Neither draft decides whether full field lineage belongs in runtime catalog records. This must be resolved before coding because it affects contract shape, generated-data size, privacy of reviewer notes, and future migrations.

A third tension is auditability. Both drafts make QA closeout a release prerequisite while ignoring QA reports by default. Without a small tracked attestation or manifest, release decisions may not be reproducible.

## Merge Recommendations

1. Use GPT-5.4’s phased execution structure, dependency explanation, effort allocation, and intermediate verification as the base.

2. Import GPT-5.5’s explicit artifact lifecycle, source-family coverage, negative scope, security guidance, release-gate details, and traceability requirements.

3. Replace the combined “license/source classification” with orthogonal concepts:

   - source family and source identity;
   - material/content class;
   - asserted rights or ownership basis;
   - project use decision;
   - ambiguity/review state.

   Values that imply a legal conclusion should remain reviewable assertions, not unquestioned permissions.

4. Resolve provenance placement before implementation. A sensible default is:

   - lightweight provenance references on runtime records;
   - detailed source, transformation, finding, and review lineage in a generated artifact manifest or sidecar;
   - no private reviewer notes in runtime bundles.

5. Add a schema/version strategy. At minimum, define a contract version, stable string identifiers, canonical timestamp format, source-neutral ID representation, and a field-path convention such as JSON Pointer.

6. Support multi-source lineage and conflicts. The contract should express multiple inputs, transformation notes, chosen values, and manual conflict resolution without assuming one source per field.

7. Distinguish TypeScript representation from input validation. Either add minimal runtime guards/schema validation now or create an explicit pre-ingestion requirement for EPIC-02. JSON round-trip tests alone are not a sufficient trust boundary.

8. Keep `compendium/source-policy.md` as the sole normative policy. If `source-qa.md` is created, it should contain operational checklists and link to the policy for definitions, severities, and release rules.

9. Keep raw snapshots and bulky QA reports ignored, but add a small tracked closeout record containing artifact identity, source set, generator version, review decision, reviewer handle, timestamp, unresolved findings, and policy/schema version.

10. Make `critical` a hard public-release blocker. If exceptions are necessary, define the approving role, scope, rationale, expiration, and re-review trigger; otherwise use a lower severity for waivable findings.

11. Add synthetic tests for:

    - mixed and conflicting sources;
    - nested field provenance;
    - copied-then-transformed text;
    - manual override supersession;
    - moved or missing revisions;
    - ambiguous mixed-rights material;
    - finding lifecycle and closeout;
    - generated artifact lineage.

12. Strengthen the Definition of Done with observable evidence:

    - documentation ownership and link checks;
    - contract/schema versioning;
    - stable release-closeout evidence;
    - verified ignore behavior;
    - no prohibited binary or real-source payloads;
    - phase-level typecheck/tests and final `npm run verify`;
    - consistent epic, ticket, sprint, ledger, and required manifest state.

13. Remove executor-specific commit behavior and “all boxes checked” from product completion criteria. Record failed, deferred, and not-applicable items honestly, and let the outer runner control commits.

Overall, GPT-5.5 supplies the stronger policy substance and GPT-5.4 supplies the stronger execution shape. The merged sprint should preserve both while resolving provenance placement, taxonomy semantics, validation ownership, critical-finding authority, and durable QA evidence before implementation begins.