# Combined Critique: Sprint 003 Data Ingestion Platform Drafts

## Executive Assessment

Both drafts converge on the right product boundary: a Python-based, offline-first ingestion spine under `scripts/data/`, no runtime wiki access, provenance-bearing snapshots, deterministic generated data, metadata-only icon handling, QA output, and a fixture-backed regenerate command. Neither draft is fully execution-ready, however. The most important unresolved decisions are:

1. The exact proof artifacts and schemas this sprint will produce.
2. How Python output will be validated against TypeScript contracts rather than merely resembling them.
3. What “deterministic” means for timestamps, manifests, digests, and live versus fixture runs.
4. How ignored generated artifacts can reliably unblock later epics without being committed.
5. The precise QA gate, finding-code taxonomy, and behavior after partial or interrupted runs.

The stronger merged plan should use the GPT-5.5 draft as the structural base because it has clearer ownership boundaries, an importable package layout, ticket-level phases, a more complete Definition of Done, and stronger security analysis. It should incorporate the GPT-5.4 draft’s risk-first parser sequencing, mandatory offline verification wiring, injectable clock/sleep/output roots, temporary-directory isolation, explicit current-versus-prior artifact comparison, and narrow proof-artifact scope.

## Review of `SPRINT-003-GPT55-DRAFT.md`

### Strengths

- The ownership table and pipeline diagram establish clean boundaries among runtime code, domain contracts, ingestion code, raw snapshots, generated artifacts, QA reports, and policy documents.
- The proposed `scripts/data/build_wars_ingest/` package is a coherent long-term module boundary. Separating transport, snapshots, parsing, icon resolution, artifact writing, QA, and orchestration should support later extractors without creating a distributable package prematurely.
- The draft maps phases directly to `BW-0201` through `BW-0208`, which makes acceptance and closeout traceable.
- It treats `src/domain/source.ts` as authoritative and correctly avoids introducing an independent Python provenance vocabulary by default.
- The fixture/live split is explicit, and the prohibition on network-dependent automated verification is clear.
- Parser coverage is concrete and appropriately rejects regex-only handling of nested templates.
- Security treatment is materially stronger than in the other draft: untrusted paths and values, path traversal, payload logging, source-provided executable content, local environment leakage, and media-byte restrictions are all addressed.
- Its Definition of Done covers ticket status, artifact policy, source-policy review, contract boundaries, individual platform capabilities, and final checklist hygiene in unusually good detail.

### Weaknesses

- Too many architecture-affecting choices remain in “Open Questions.” Dependency management, timestamp semantics, fixture policy, diagnostic-to-QA mapping, QA failure thresholds, cross-language validation, raw live payload scope, and artifact promotion all affect implementation shape and should be resolved before execution.
- The phase order implements the skill-ID enumerator before the parser spike even though parser viability is identified as a major platform risk. The formal ticket graph permits `BW-0203` and `BW-0204` to proceed independently after `BW-0202`; risk retirement, not ticket numbering, should determine their schedule.
- The contract discussion exceeds the current authoritative shape when it proposes a generation ID or catalog-version placeholder in `GeneratedArtifactManifest`; neither field exists in that interface. The plan must either use the current contract exactly or explicitly authorize and justify a domain-contract change.
- “Compatible JSON,” “where practical,” and a representative TypeScript fixture are weak guarantees. A static check of one expected fixture does not validate every Python-emitted artifact or prevent later live-output drift.
- QA requirements name duplicate IDs, malformed mappings, unresolved redirects, unknown template parameters, and icon-shape failures, but `QaFindingCategory` has no dedicated categories for most of them. A stable `code` registry and mapping to the existing broad categories are needed.
- The term “offline client” is internally confusing because the client performs live network requests. It is offline tooling relative to the browser runtime; fixture mode is the actually offline execution mode.
- Verification integration and some contract checks are conditional (“if stable,” “if … added,” “where practical”). A foundational platform sprint should decide whether its tests are part of `npm run verify` and make that outcome non-optional.
- Nine phases improve traceability but create considerable bookkeeping and repeated verification overhead. Adjacent implementation work can remain ticket-traceable without requiring a separate execution phase for every ticket.

### Gaps in Risk Analysis

- **Artifact handoff risk:** later epics are said to consume generated output without refetching, while production generated artifacts remain ignored. The plan does not establish whether later work regenerates locally, consumes a committed minimized proof, or waits for an exact-path promotion ticket.
- **False contract confidence:** TypeScript interfaces are compile-time-only. Representative fixture assignment does not amount to runtime validation of arbitrary Python output.
- **Pipeline atomicity:** there is no strategy for preventing a failed run from leaving a new snapshot beside stale generated data or QA reports.
- **Concurrent execution:** simultaneous fixture/live runs could collide in output paths or manifests.
- **Dependency reproducibility:** a pinned direct dependency in `requirements.txt` does not by itself define the supported Python version, transitive dependency policy, clean-environment install test, or update process.
- **Source evolution:** fixture success may conceal MediaWiki template, API, redirect, namespace, or image-policy changes. No drift-detection or fixture-refresh policy is defined.
- **Performance bounds:** continuation loops, response sizes, page counts, parser complexity, and retry budgets have no explicit ceilings.

### Missing Edge Cases

- HTTP 200 responses containing MediaWiki errors, malformed JSON, partial batches, repeated continuation tokens, `Retry-After`, missing pages, redirect/normalization chains, and retry exhaustion.
- Unicode normalization, case-insensitive filename collisions, titles that sanitize to the same path, overlong titles, reserved names, symlink traversal, atomic replacement, and interrupted writes.
- Duplicate template parameters, positional versus named parameters, comments, `<nowiki>`, HTML entities, template aliases, whitespace/case variants, recursive expansion, and parser resource limits.
- Non-integer, negative, leading-zero, out-of-range, or conflicting skill IDs; redirect cycles; and duplicate titles that are legitimate aliases rather than errors.
- MediaWiki file redirects, deleted or archived files, explicit `File:` prefixes, URL changes, missing dimensions, and supported-but-unexpected formats such as SVG or WebP.
- Canonical JSON byte rules, Unicode escaping, numeric representation, line endings, digest coverage, and whether the manifest digest includes or excludes the manifest itself.
- Stable QA finding-ID generation, collisions, prior reports from incompatible schema versions, resolved-finding carryover, and behavior when no comparison baseline exists.
- CLI exit codes, cancellation, cleanup after failure, stale-output removal, and protection against fixture mode overwriting live artifacts.

### Definition of Done Completeness

The Definition of Done is comprehensive but not yet decisive. It should additionally require:

- Named proof artifacts with explicit record schemas and input/output relationships.
- Byte-for-byte fixture determinism under an injected clock, with separate documented semantics for live timestamps.
- Validation of every fixture-generated artifact, manifest, and QA report against the chosen contract mechanism.
- Both machine-readable QA JSON and a human-readable report or summary, as required by `BW-0207`.
- Exact gate rules, finding-code mappings, and CLI exit codes.
- Tests proving atomic failure behavior and isolation between fixture and live outputs.
- A recorded parser decision that can explicitly block or revise dependent work if the preferred parser fails the spike.
- A concrete downstream artifact availability/promotion rule.

## Review of `SPRINT-003-GPT54-DRAFT.md`

### Strengths

- The draft explicitly prioritizes early retirement of parser risk and gives the parser spike an acceptance decision before broader extractor work.
- It keeps the durable artifact scope narrow, limiting this sprint to the skill-ID mapping and supporting proof data rather than drifting into a full skill catalog.
- Injectable clock, sleep, and output-root configuration is an excellent testability choice and should be retained.
- Snapshot tests use temporary directories and distinguish local artifact digests from remote MediaWiki hashes.
- `npm run test:data` and inclusion in `npm run verify` are treated as expected deliverables rather than optional enhancements.
- Prior-artifact comparison is explicitly included in QA scope, matching the ticket requirement for changed-record reporting.
- Five larger phases communicate the critical path more clearly and reduce phase-management overhead.
- The likelihood/impact risk table is concise and useful for prioritization.

### Weaknesses

- The dependency diagram incorrectly makes `BW-0204` a prerequisite of `BW-0203`. The ticket frontmatter defines both as independent children of `BW-0201` and `BW-0202`. Parser-first scheduling is strategically defensible, but it should not silently rewrite the dependency graph.
- The draft calls its layout “package-style” while proposing flat modules and tests directly under `scripts/data/`. That is less robust for imports, test discovery, shared helpers, and future extractor growth than an explicit package directory.
- Combining parser and enumerator, icon and artifact writer, then QA and CLI into broad phases obscures which ticket failed acceptance and when individual ticket status can safely change.
- Treating both `src/domain/source.ts` and `src/domain/catalog.ts` as contract targets “where practical” is ambiguous. The current catalog types describe full catalog records, not the sprint’s skill-ID-to-title mapping, so they cannot validate that proof artifact without a deliberate new type.
- The pipeline ends in “publish,” but generated production data remains ignored. This terminology implies a promotion mechanism that the draft does not define.
- The icon resolver requires parsed skill template data, yet the live flow does not identify which representative skill pages it fetches or how icon outputs relate to the skill-ID artifact while full skill extraction remains out of scope.
- The abbreviated security section omits several controls present in the GPT-5.5 draft, especially source-title path handling tests, bounded evidence, environment leakage, unsafe source content, and explicit HTTPS behavior.
- “No commit is created by the sprint executor” is an execution-process constraint, not product acceptance, and should not substitute for a deliverable or verification criterion.

### Gaps in Risk Analysis

- It omits artifact promotion/availability, atomic writes, concurrent runs, and stale mixed-generation outputs.
- It does not analyze the limits of compile-time TypeScript interface alignment for Python-generated JSON.
- It does not cover QA taxonomy drift or disagreement between application-consumption and public-release gates.
- It understates Python environment and supply-chain risk beyond pinning `mwparserfromhell`.
- It does not address API/schema drift, fixture provenance aging, live-data scale, or retry/pagination resource bounds.
- It does not identify the risk that icon proof work accidentally forces partial skill-catalog extraction.

### Missing Edge Cases

- Unsafe and colliding snapshot names, Unicode/case normalization, missing revision facts, atomic writes, and interrupted runs are not made test requirements.
- MediaWiki response-level errors, continuation cycles, partial batch failures, missing pages, redirect chains, and response-size limits are unspecified.
- The parser corpus does not explicitly require duplicate parameters, comments/`nowiki`, aliases, entity decoding, or pathological nesting.
- Skill-ID parsing lacks numeric-domain validation and a policy for benign duplicate titles or redirect aliases.
- Icon resolution lacks file redirects, deleted files, format-policy decisions, and normalization of explicit file prefixes.
- Artifact digest semantics, canonical bytes, stable QA IDs, baseline schema mismatch, and no-baseline diff behavior remain undefined.
- CLI cancellation, rollback, exit-code contracts, and fixture/live output separation are absent.

### Definition of Done Completeness

The Definition of Done is clean but materially less complete than the GPT-5.5 version. It does not explicitly require the full client behavior set, complete snapshot provenance fields, deterministic digest semantics, the named parser fixture corpus, precise QA gate behavior, stable finding codes, schema validation of all proof outputs, or human-readable QA output. It also leaves TypeScript contract testing in a phase-level “where practical” clause rather than making it acceptance-critical. The final plan should retain its concise format but import the stronger capability-level acceptance criteria from the GPT-5.5 draft.

## Cross-Draft Contradictions and Trade-offs

| Dimension | GPT-5.5 draft | GPT-5.4 draft | Recommended resolution |
| --- | --- | --- | --- |
| Parser/enumerator order | Executes `BW-0203` before `BW-0204` and preserves them as sibling dependencies | Executes parser first but incorrectly depicts `BW-0204 -> BW-0203` | Preserve the declared sibling dependency graph; schedule the parser spike first or in parallel to retire risk without inventing a dependency |
| Python layout | Importable `build_wars_ingest/` package with nested tests | Flat `scripts/data/*.py` modules called package-style | Use the importable package and a stable thin `scripts/data/regenerate.py` entrypoint |
| Contract authority | `source.ts` is canonical; domain changes are exceptional | `source.ts` and `catalog.ts` are targets; new durable types may be added | Use `source.ts` exactly for provenance/manifests/QA; define the skill-ID artifact schema explicitly and change `src/domain` only if a real downstream contract requires it |
| Verification | Focused tests are detailed but canonical wiring is conditional | `test:data` and `verify` integration are mandatory | Make fast offline data tests mandatory in `npm run verify` from the first completed platform phase |
| Determinism | Raises timestamp handling as an open question | Specifies injectable clock/sleep and output root | Adopt injection and define canonical bytes, timestamp placement, and digest scope before implementation |
| Risk/security | More complete security and policy analysis | Better risk prioritization and simpler phase structure | Keep GPT-5.5 controls; present the top risks with GPT-5.4-style likelihood/impact prioritization |
| Changed-record QA | Mentions diffs but does not clearly require a prior-output comparison path | Explicitly supports a supplied previous manifest/output pair | Require optional baseline comparison with defined no-baseline and schema-mismatch behavior |
| DoD | Detailed but contains optional clauses and unresolved choices | Concise but omits capability-level acceptance | Merge the detailed criteria, remove optional wording, and keep the final list outcome-focused |

The drafts also share unresolved contradictions:

- Both claim later epics can consume outputs while defaulting those outputs to ignored local files.
- Both require an end-to-end live flow but do not name the representative page set needed to exercise parsing and icon resolution without expanding into full catalog ingestion.
- Both claim alignment with TypeScript contracts without selecting a comprehensive validation mechanism.
- Both promise deterministic outputs while allowing timestamps without defining exactly where nondeterminism is permitted.
- Both use existing QA categories while introducing many new finding concepts without a code/category/severity mapping.

## Merge Recommendations

1. **Name the sprint outputs before implementation.** At minimum, specify the skill-ID map, its generated-artifact manifest, parser-spike decision record, representative icon-metadata proof output, and QA report. Define which are fixture-only, which live mode emits, and which are ignored or committed.
2. **Use one importable ingestion package.** Adopt `scripts/data/build_wars_ingest/` with module-local tests or a single consistent test package, plus a thin stable entrypoint. Do not mix flat and nested layouts.
3. **Keep the formal ticket graph intact while scheduling risk-first work.** Complete the shared client and snapshot layer, then run `BW-0204` before or alongside `BW-0203`. Only `BW-0205` should be gated by the parser decision as currently declared.
4. **Set an explicit contract strategy.** Existing `source.ts` shapes should be exact for source references, provenance, media metadata, manifests, and QA. Define an artifact kind and version for the skill-ID map. Remove proposed fields absent from the authoritative interface unless the sprint explicitly changes that interface. Replace “where practical” with a required validation path for every fixture-generated output.
5. **Define determinism precisely.** Use an injected UTC clock in fixture mode; canonical UTF-8 JSON formatting, key ordering, record ordering, newline behavior, and Unicode handling; SHA-256 over named canonical bytes; and timestamps isolated to specified manifest fields. Require byte-identical fixture reruns.
6. **Define QA semantics before coding.** Establish stable finding codes and their mappings to existing categories, severities, dispositions, and both gate fields. Decide whether open `error` findings fail the regenerate command, not only `critical` findings. Require machine-readable JSON plus a bounded human-readable summary.
7. **Make regeneration transactional.** Write a complete generation into a staging directory, validate digests and QA, then atomically promote it. On failure or cancellation, preserve the last valid generation and return documented nonzero exit codes. Separate fixture and live roots and guard concurrent writers.
8. **Resolve downstream availability.** Choose one rule: later epics regenerate ignored artifacts locally from committed fixtures/snapshots, or a later exact-path promotion ticket commits approved outputs. Do not claim downstream no-refetch consumption until that rule is executable.
9. **Bound live scope.** Name the minimized representative live page set used for parser and icon proof, or state that the live sprint artifact covers only enumeration while parser/icon validation remains fixture-backed. This prevents accidental partial catalog implementation.
10. **Make verification unconditional and proportional.** Add `npm run test:data` and include it in `npm run verify`; cover mocked live-client behavior, end-to-end fixture regeneration, cross-contract validation, atomic failure, and no-network enforcement. A real live smoke may remain manual and non-blocking.
11. **Resolve the Python environment up front.** Specify the supported Python version, dependency file and pinning policy, clean-install command, test discovery command, and how `npm run verify` reports a missing environment.
12. **Strengthen the final Definition of Done.** Import the GPT-5.5 capability detail, the GPT-5.4 determinism and verification commitments, the missing edge cases above, and an explicit parser failure branch. Remove conditional acceptance language and process-only items that do not prove the platform works.

With these changes, Sprint 003 becomes a coherent platform increment: it proves transport, snapshotting, parsing, one narrow extraction, metadata resolution, deterministic serialization, QA, and orchestration without prematurely committing to full catalog ingestion or leaving later epics dependent on undocumented local state.
