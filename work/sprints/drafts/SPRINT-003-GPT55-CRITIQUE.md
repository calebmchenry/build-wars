# SPRINT-003 GPT55 Combined Critique

## Reviewed Artifacts

- `work/sprints/drafts/SPRINT-003-GPT56SOL-DRAFT.md`: reviewed.
- `work/sprints/drafts/SPRINT-003-GPT54-DRAFT.md`: reviewed.
- Missing requested artifacts: none.

This critique focuses on architecture assumptions, scope creep risk, hidden complexity, missing
alternative designs, edge coverage, and Definition of Done quality. It intentionally does not assess
`SPRINT-003-GPT55-DRAFT.md`.

## Draft: `SPRINT-003-GPT56SOL-DRAFT.md`

### Strengths

- The platform boundary is explicit and mostly defensible: browser runtime code is isolated from
  Python tooling, raw snapshots, QA reports, and live source APIs.
- The draft correctly frames the sprint as a platform proof rather than a full catalog ingestion
  sprint. It repeatedly constrains durable normalized output to the skill-ID index.
- Snapshot immutability, provenance, artifact determinism, QA centralization, and metadata-only icon
  handling are treated as first-class architecture concerns instead of afterthoughts.
- The MediaWiki client design is unusually concrete: fixed origin, HTTPS, continuation propagation,
  `maxlag`, retry/backoff, response-size limits, final-origin checks, request batching, sanitized
  logs, and injected clocks/sleepers are all covered.
- The draft recognizes that parser choice is a strategic dependency. It requires representative
  nested-template fixtures and a recorded parser recommendation before later catalog work leans on
  the parser.
- The DoD and phase acceptance criteria are broad enough to prevent silent success. Duplicate IDs,
  missing provenance, digest mismatches, ambiguous icons, and parser loss are all intended to remain
  visible through QA.
- The security section is stronger than a typical sprint plan. It treats wiki text, titles, paths,
  query values, prior artifacts, and report evidence as untrusted input.

### Weaknesses

- The draft is likely too large for one sprint. It includes a Python toolchain, hash-locked
  dependency setup, HTTP client, immutable snapshot store, skill-ID extractor, parser spike, icon
  metadata resolver, canonical writer, manifest system, validator registry, baseline diff, CLI,
  npm integration, documentation, ticket status updates, and ledger closeout.
- The plan over-specifies many implementation decisions before discovery. Module names, exact gate
  states, manifest composition, generation identity behavior, and QA disposition semantics are
  already treated as settled designs.
- It assumes the current TypeScript domain contracts are sufficient for Python-emitted artifacts,
  while also acknowledging that a representational gap may exist. That gap could force cross-language
  contract work in the middle of an already crowded sprint.
- It mixes three different goals: proving the ingestion spine, producing the first real normalized
  artifact, and de-risking future nested-template/icon work. Those goals are related, but not all
  need the same release gate.
- The parser and icon canaries are described with enough machinery that they may become mini
  extractors. That weakens the stated "platform proof, not content catalog" boundary.
- Some acceptance criteria are framed as long-range guarantees, such as later extractors needing no
  alternate client, writer, QA schema, or command. That cannot be proven by this sprint alone.
- The plan says no broad runtime schema validation or JSON Schema system is planned, but it also
  calls for schema-aware canonicalization, schema-owned sorting, TypeScript structural assertions,
  and baseline semantic comparison. That is a schema system in practice, even if not named as one.

### Gaps In Risk Analysis

- The risk table is comprehensive but not operational. It lacks probability, owner, trigger,
  rollback path, and explicit "cut scope" rules when time runs out.
- Python environment reproducibility is treated as solvable through `.venv-data` and a lock file,
  but the draft does not analyze platform-specific wheel availability, hash generation workflow,
  contributor Python version drift, or CI implications.
- Synthetic fixture risk is acknowledged, but the draft does not define how representative fixtures
  are selected or when a new live edge case is allowed to become a committed regression fixture.
- The "existing TypeScript vocabulary is canonical" assumption is not paired with a fallback design
  if current domain shapes cannot represent snapshot, media, QA, or manifest data cleanly.
- The ignored-artifact policy creates an evidence problem: live mode is manual and ignored, but the
  draft still wants confidence that live refresh remains polite and bounded. It does not specify what
  durable, non-sensitive evidence should be kept.
- The plan does not deeply analyze source-policy/legal review risk for storing direct media URLs,
  description URLs, remote hashes, source titles, or bounded excerpts inside QA reports.
- QA disposition semantics could become a policy engine. The draft assumes this can be implemented
  safely in one phase without considering a smaller first pass.

### Missing Edge Cases

- MediaWiki revision suppression, deleted revisions, missing `revisions` arrays, page moves between
  fetches, normalized title conflicts, namespace aliases, and content-model differences.
- Continuation objects that change shape across modules, continuation loops with changing partial
  data, partial batch failures, API warnings, and HTTP 200 responses containing non-fatal warnings.
- Unicode normalization differences in titles and wikitext, CRLF input, HTML entities, comments,
  `<nowiki>`, tables, duplicated template parameter names, positional parameters, and nested links
  inside template arguments.
- Skill IDs outside expected numeric ranges, zero or negative IDs, redirect-target duplicates,
  canonical-title duplicates caused by MediaWiki normalization, and mappings split across unusual
  line wrapping.
- Icon candidates with redirects across file extensions, SVG or WebP source files, missing `sha1`,
  missing dimensions, multiple `imageinfo` revisions, URL normalization differences, and pages whose
  default icon title differs from the page title after redirects.
- Path safety around symlink escapes, case-insensitive filesystems, long path components, concurrent
  regenerate runs, and temporary-file cleanup after interrupted writes.
- Baseline comparison where the prior artifact has a different schema version, missing manifest,
  stale QA report, or matching record IDs with changed provenance but unchanged visible fields.

### Definition Of Done Completeness

- The DoD is very complete as a control checklist, especially for determinism, source policy,
  metadata-only media, QA gates, and offline verification.
- It is too large to function as a sprint close criterion without prioritization. Critical blockers,
  expected deliverables, and stretch-hardening items should be separated.
- Several items are not directly falsifiable: "later extractors have one documented registration
  path", "no competing provenance model exists", and "documentation agree" need sharper tests or
  review criteria.
- The DoD should define numeric limits where it says "bounded": maximum pages, request count,
  response bytes, parser input size, evidence excerpt length, retry count, and elapsed retry budget.
- The DoD should separate repository bookkeeping from product/platform acceptance. Ticket status and
  ledger consistency matter, but they should not obscure the technical completion criteria.

## Draft: `SPRINT-003-GPT54-DRAFT.md`

### Strengths

- The draft is easier to execute than the GPT56SOL draft. It keeps the architecture readable and
  groups work into five broad phases with clear verification commands.
- It correctly identifies the core boundary: `scripts/data/` owns ingestion and runtime app code
  must not call wiki APIs, import ingestion modules, or consume raw snapshots.
- It makes `mwparserfromhell` validation an early architectural risk and explicitly records that
  regex-only nested-template parsing is not acceptable.
- It keeps the first durable output narrow: a skill-ID mapping proof with provenance and QA, not a
  full skill catalog.
- The verification contract is direct: offline Python tests join `npm run verify`, and live wiki
  access remains manual.
- The DoD is concise and readable. It covers the main platform slices without burying the executor in
  every implementation detail.

### Weaknesses

- The architecture is under-specified in places where precision matters. The MediaWiki client lacks
  explicit final-origin validation, response-size limits, malformed JSON handling, `Retry-After`
  behavior, generic continuation shape propagation, and sanitized logging requirements.
- Snapshot identity based on "stable title or page identity, and revision identity" is too loose.
  Titles are untrusted and mutable; identity should prefer validated page/revision IDs and content
  digests, with titles retained as metadata.
- The phrase "where practical" weakens the domain-contract boundary. If Python output is supposed to
  align with TypeScript source contracts, the plan should state what happens when alignment is not
  practical.
- Phase grouping hides dependency risk. Pairing icon metadata with artifact writing, and QA reports
  with the regenerate command, makes late phases large and failure-prone.
- "Define deterministic selection rules when multiple plausible icon files exist" could permit a
  silent arbitrary winner. Ambiguous icon candidates should normally produce no selected icon unless
  an explicit source value confirms one.
- The module shape puts tests in `scripts/data/test_*.py`, which is workable, but it does not decide
  whether `scripts/data/` is a package with internal interfaces or a flat script folder.
- The risk table is too short for the surface area. It omits snapshot integrity failure, source-policy
  leakage, ignored-live-artifact review gaps, QA gate bypass, dependency lock failure, and app/runtime
  boundary regression.

### Gaps In Risk Analysis

- No explicit risk is assigned to making Python a required contributor toolchain inside a Node/npm
  project.
- TypeScript/Python drift is identified, but the mitigation is vague. "Representative" contract tests
  may miss the exact artifact that later consumers rely on.
- Determinism risk is acknowledged but not broken down by source: clocks, input order, API response
  order, dictionary key order, file paths, generated IDs, QA finding IDs, and manifests need separate
  controls.
- The draft does not define what happens if `mwparserfromhell` fails the spike. The open question
  asks about fallback behavior, but the implementation plan should include a stop/switch/defer
  decision point.
- Scope creep into full catalog extraction is listed, but there is no enforcement mechanism beyond
  intent. The plan should name exact non-goals and phase cut lines.
- The live-refresh mode lacks evidence and audit expectations. Since live outputs stay ignored, the
  draft should say what summary or manual smoke record is acceptable.

### Missing Edge Cases

- Origin-changing redirects, arbitrary URL injection, timeout split between connect/read, retry
  exhaustion, malformed `Retry-After`, MediaWiki `maxlag` in HTTP 200 responses, oversized bodies,
  and response-body logging.
- Snapshot path traversal, unsafe titles, title collisions, changed content under the same revision
  identity, digest mismatch on load, partial writes, symlink escapes, and identical refetch behavior.
- Duplicate skill IDs versus duplicate target titles, non-contiguous IDs, quoted titles, punctuation
  heavy titles, special/effect pages, malformed near-matches, and line-number scoped diagnostics.
- Unknown templates and parameters are covered generally, but raw parameter ordering, duplicate
  parameter names, positional params, nested wrappers, redirects, and disambiguation preambles need
  exact fixture expectations.
- Icon ambiguity, file-title normalization, uppercase extensions, missing `imageinfo` fields,
  unexpected MIME, non-64x64 dimensions, remote SHA-1 absence, and metadata-only invariants.
- QA report persistence when a gate fails, stable finding ID construction, accepted-risk metadata,
  non-waivable findings, baseline schema mismatch, and digest mismatch behavior.

### Definition Of Done Completeness

- The DoD covers the right high-level outcomes: shared ingestion spine, parser proof, offline verify,
  regenerate command, manual live mode, domain-aligned manifests/reports, metadata-only icons, and no
  runtime import.
- It is not detailed enough to prevent inconsistent implementations. For example, deterministic
  output, snapshot immutability, QA gate semantics, and icon ambiguity handling need stricter
  acceptance criteria.
- It lacks byte-for-byte golden output requirements, fixed-clock rerun checks, explicit report-order
  stability, and a clear guarantee that reports are written before failing the process.
- It does not distinguish "done for this sprint" from "done for the future platform." Some statements
  imply a complete ingestion spine, while the overview says this is a proof.
- It should add negative DoD checks for no live artifact commits, no media binaries, no copied prose,
  no `action=parse` default extraction path, and no full target-page crawl.

## Cross-Draft Comparison

### Architecture Assumptions

- Both drafts assume Python plus `mwparserfromhell` is the right ingestion stack. Neither draft
  compares that against a TypeScript-only pipeline, a hybrid where Python only parses wikitext, or a
  design that defers parser dependency adoption until a smaller spike completes.
- Both drafts assume existing TypeScript domain contracts should remain canonical. GPT56SOL handles
  this more rigorously, but both need an explicit fallback for contract mismatch: either make a small
  backward-compatible domain addition, keep a tool-only internal shape, or defer the artifact.
- Both drafts assume ignored local artifacts can still support review. GPT56SOL gives stronger
  manifest and QA mechanics, but neither states what durable review evidence should be retained from
  optional live runs.
- Both drafts assume a central QA framework belongs in this sprint. GPT56SOL turns it into a full
  gate/disposition system; GPT54 leaves it too vague. The merged plan should implement only the gate
  behavior needed for the skill-ID proof and platform invariants, while documenting extension points.
- Both drafts assume icon metadata belongs in the same sprint as the platform proof. This is plausible
  as a canary, but risky as a committed resolver with broad QA semantics before full skill extraction
  exists.

### Scope Creep Risk

- GPT56SOL is safer architecturally but carries high delivery risk because it attempts to solve most
  future ingestion infrastructure in one sprint.
- GPT54 is more executable but could produce a weaker platform if implementers fill in underspecified
  details differently across phases.
- The largest shared creep vector is treating parser and icon canaries as production-grade content
  extractors. They should prove contracts and failure modes, not quietly grow into catalog work.
- The second largest creep vector is QA. A stable report shape is necessary; a full accepted-risk,
  baseline-diff, non-waivable disposition engine may be too much unless EPIC-01 already provides most
  of that vocabulary.
- Documentation and ticket-burn work are necessary, but both drafts risk making closeout as large as
  implementation. The merged plan should identify the minimum docs needed to operate and extend the
  platform.

### Hidden Complexity

- Python dependency locking with hashes is not just a checklist item. It requires a repeatable lock
  workflow, contributor setup docs, stale-env detection, and possibly platform-specific guidance.
- MediaWiki client correctness is deeper than "fetch JSON." Continuation, warnings, maxlag,
  redirects, response caps, retry budgets, batch ordering, and malformed responses need shared test
  fixtures.
- Snapshot immutability needs careful identity design. Using titles in paths or identities creates
  collision and traversal risks; using revision IDs alone misses missing-revision and changed-content
  cases.
- Deterministic artifacts require more than sorted JSON keys. Record ordering, manifest content,
  generation IDs, timestamps, QA finding IDs, and baseline comparison all need separate invariants.
- Parser fixtures can give false confidence. The plan needs a rule for when live discoveries update
  fixtures and when a construct is intentionally unsupported.
- Cross-language contracts are expensive. A Python writer and TypeScript structural test can drift
  unless they share exact golden fixtures and clear versioning rules.

### Missing Alternative Designs

- A TypeScript-only ingestion pipeline using existing npm tooling, with parser support deferred or
  isolated, to avoid a second required language stack.
- A two-sprint split: first deliver client, snapshots, skill-ID index, writer, minimal QA, and offline
  regenerate; then deliver parser/icon canaries, baseline diff, and richer QA gates.
- A narrower parser spike that produces only a recommendation document plus fixtures, without adding
  the full generic parser representation to the main pipeline yet.
- A design that postpones icon metadata until full skill pages are being extracted, because skill-ID
  mapping alone does not require icons.
- A schema-first approach using JSON Schema or generated TypeScript fixtures as the cross-language
  contract source, weighed against GPT56SOL's explicit rejection of broad schema tooling.
- A controlled MediaWiki `action=parse`/`action=expandtemplates` oracle for diagnostics only, with a
  clear comparison to local parsing instead of treating the fallback as an unresolved open question.
- A live-smoke evidence design that stores only request counts, revisions, digests, and QA summary
  metadata, avoiding raw body retention while preserving reviewability.

## Merge Recommendations

1. Use GPT54 as the top-level executable shape, but import GPT56SOL's hard invariants for HTTP
   safety, snapshot identity, deterministic writing, centralized diagnostics, metadata-only icons,
   and runtime isolation.
2. Add a strict MVP boundary:
   - Required: Python package scaffold, pinned parser setup check, MediaWiki client with offline
     tests, immutable snapshots, skill-ID enumerator, canonical skill-ID artifact, minimal QA report,
     fixture-mode regenerate command, `npm run verify` integration, and operating docs.
   - Canaries: nested-template parser proof and icon metadata resolver using synthetic fixtures and
     optional bounded live diagnostics.
   - Defer unless already trivial: broad baseline diff, full accepted-risk disposition workflow,
     language-neutral JSON Schema, full icon resolver production policy, and any app-side generated
     data consumption.
3. Do not gate the flat skill-ID enumerator on the nested-template parser. Gate future skill-catalog
   extraction on the parser recommendation instead. The enumerator and parser solve different source
   shapes.
4. Make icon ambiguity non-selecting by default. A deterministic arbitrary selection rule is still a
   data-quality bug if two plausible files exist.
5. Replace vague "bounded" language with numbers: maximum live pages, request count, batch size,
   response bytes, retry attempts, total retry delay, parser input size, nesting depth target, and QA
   evidence excerpt length.
6. Define explicit fallback decisions:
   - If `mwparserfromhell` loses required structure, stop parser-dependent work and record switch or
     fallback options.
   - If TypeScript contracts cannot represent the artifact, make the smallest backward-compatible
     contract addition or keep the shape tool-local for this sprint.
   - If locked Python setup is not reproducible, do not let `npm run verify` depend on implicit
     installs or global packages.
7. Keep GPT56SOL's byte-level determinism requirements, but narrow them to the committed fixture
   artifact and QA report first. Expand baseline comparison only after the first generated artifact
   exists and has stable semantics.
8. Separate technical DoD from bookkeeping DoD. Technical completion should be testable through
   offline commands and artifact inspection; sprint/ticket/ledger status should be a closeout
   checklist.
9. Add missing alternative-design notes directly to the final sprint plan. The final plan should say
   why Python is chosen, why `mwparserfromhell` is accepted only after a spike, why icon metadata is a
   canary rather than catalog work, and why JSON Schema is deferred or adopted.
10. Preserve GPT56SOL's security posture. GPT54's shorter draft should not lose origin checks,
    path-confinement, response-size caps, no body logging, symlink/path traversal concerns, and the
    prohibition on media bytes and copied prose.

## Recommended Final Shape

The best merged plan is GPT54's readable sprint structure with GPT56SOL's safety-critical details
folded into acceptance criteria. It should be shorter than GPT56SOL, stricter than GPT54, and explicit
about what gets deferred.

The final sprint should be considered successful when it proves one narrow vertical slice end to end:
offline fixtures produce an immutable snapshot, a deterministic skill-ID artifact, a manifest, and a
QA report through one regenerate command, with runtime isolation and source-policy boundaries intact.
Parser and icon work should prove enough to guide later catalog epics, but should not be allowed to
turn this sprint into full content ingestion.
