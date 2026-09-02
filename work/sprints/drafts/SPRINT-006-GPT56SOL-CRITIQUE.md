# Combined Critique: Sprint 006 Template Compatibility Drafts

## Executive Assessment

Both drafts converge on the right core architecture: isolate `@buildwars/gw-templates@1.1.1`
behind one framework-neutral adapter, preserve unresolved numeric IDs in dedicated template
envelopes, avoid widening `Build` or `EquipmentTemplate`, use promoted EPIC-03/EPIC-04 catalogs
only for resolution, and treat paw-ned2/team support as evidence-dependent. That is a coherent
foundation and should survive the merge.

The GPT54 draft has the stronger execution sequence: establish traceability, prove the dependency,
define shared contracts and wrappers, then implement skill, equipment, and optional team support.
The GPT55 draft is stronger on concrete contracts, dependency hazards, error containment, source
authority, and security details. The merged sprint should therefore use GPT54's phase and ticket
shape while importing GPT55's explicit gates and contract detail.

Neither draft is ready to execute unchanged. They leave several architectural decisions inside the
implementation phases while simultaneously treating the public contract as stable. Most
importantly, “lossless,” “semantic equivalence,” unsupported upstream fields, wrapper
normalization, warning-versus-error policy, and dependency failure outcomes are not defined tightly
enough to support durable compatibility claims.

## Review of `SPRINT-006-GPT55-DRAFT.md`

### Strengths

- It gives the clearest account of the long-term domain boundary. Raw template state and catalog
  resolution are distinct, unknown and dispositioned IDs retain their original namespaces, and a
  `Build` projection is allowed only when safe.
- Its import and export flows make the adapter, runtime shape guard, catalog join, and normalization
  stages visible. This is more actionable than treating decode/encode as a single opaque operation.
- It identifies material dependency risks that GPT54 largely misses: the advertised Node `>=24`
  requirement versus the repository's Node `>=22.11.0` floor, CommonJS packaging, missing type
  declarations, browser/Vite compatibility, and normalization behavior.
- It proposes concrete DTOs and stable error codes, plus sanitization rules that prevent raw
  exceptions, unbounded input, and dependency objects from escaping the domain boundary.
- Its source-authority table, fixture-provenance constraints, explicit size caps, and separation of
  raw equipment facts from semantic equipment meaning are strategically sound.
- Phase gates consistently discourage a hand-written parser from appearing as an unreviewed
  fallback and prevent team-format uncertainty from invalidating completed skill/equipment work.

### Weaknesses

- The phase order is internally inconsistent. Phase 2 says skill decoding accepts wrapped chat
  codes, but wrapper parsing is not implemented until Phase 3. That either creates a hidden wrapper
  implementation in BW-0502 or forces rework when BW-0503 later establishes the policy.
- BW-0501 combines dependency evaluation with public contract design. If the adapter probe changes
  decoded shapes or proves a format unavailable, the sprint may have to undo contracts created in
  the same phase. Dependency proof and public contract lock should be separate gates.
- `DecodedSkillTemplate` contains an optional `Build` projection. Embedding a projection in the
  decoded DTO couples a lossless compatibility record to the evolving authored-build model and can
  make decode results dependent on catalog availability. A separate pure projection helper is a
  safer boundary.
- The equipment phase permits semantic conversion to be “absent or explicitly partial with `null`
  catalog IDs.” The second option weakens the stated architecture by creating a partially semantic
  model whose nulls may later become de facto API behavior. Version 1 should expose only the raw
  equipment envelope.
- A `DecodedTeamTemplate` shape is proposed before the feasibility gate. This risks publishing a
  speculative surface even if BW-0505 is deferred. No team DTO or export should become public until
  the dependency and fixtures prove its actual field model.
- The draft alternates between byte-identical output and a “documented dependency-normalized
  equivalent.” A compatibility API needs one explicit set of guarantees rather than a test that may
  accept either outcome without classifying it.
- Ten open questions include contract-defining decisions, so the document is more of an advanced
  design draft than an execution-ready sprint. Empty slots, wrapper grammar, original versus
  normalized output, projection eligibility, team metadata policy, and dependency-failure scope all
  need resolution or an explicit phase-one decision record.
- The metadata says `status: draft` and has a creation date one day later than the GPT54 draft's
  planned artifact. This is minor, but the merged sprint should establish one lifecycle state and
  authoritative date.

### Gaps in Risk Analysis

- Vendor lock-in is treated mainly as an import-location concern. The larger risk is that public DTO
  semantics may mirror one package version's object shapes and normalization quirks. The adapter
  needs an implementation-independent interface and a conformance suite that would permit a future
  package upgrade or replacement without changing domain contracts.
- The draft assumes decoded fields are sufficient for lossless re-encoding. An upstream decoder may
  discard unknown bits, reorder fields, collapse duplicates, or normalize values before the adapter
  sees them. Preserving the original code is not the same as being able to reconstruct an equivalent
  code from the DTO.
- There is no upgrade policy for the exact dependency pin: who owns compatibility checks, what
  fixture suite gates upgrades, and whether a security fix may require a breaking normalization
  change.
- Browser compatibility is named as a gate, but Phase 1 verification omits `npm run build`. A Node
  Vitest import is insufficient evidence for a client-side Vite bundle.
- The plan does not distinguish a blocked sprint from a successfully completed evaluation outcome.
  Treating “dependency pinned or sprint blocked” as a Definition of Done item can make delivery
  reporting misleading.
- Raw team names, descriptions, and player fields can contain personal or sensitive content. Size
  caps and HTML safety are covered, but retention, logging, serialization, and error-redaction
  policy are not.
- Catalog evolution is not addressed. A previously unknown ID may become known after a catalog
  update, so persisted envelopes should not cache resolution outcomes as permanent truth without a
  catalog-version or re-resolution policy.

### Missing Edge Cases

- Skill templates: duplicate or out-of-order attributes, zero allocations, rank and ID bit-width
  boundaries, primary-only builds, contradictory profession/attribute combinations, repeated
  skills, all-empty bars, valid base64 with trailing bytes or non-canonical padding, and a valid
  code of the wrong template kind.
- Wrappers: leading/trailing whitespace around the whole input, Unicode normalization, multibyte
  names at the length boundary, multiple semicolons, nested brackets, trailing text after the
  closing bracket, case or padding variants in the inner code, and explicit behavior for an empty
  versus whitespace-only name.
- Equipment: zero item IDs, maximum modifier counts, ordering stability, duplicate slots, unknown
  fields not exposed by the package, armor versus weapon-set distinctions, empty weapon sets,
  off-hand/two-handed conflicts, dye count boundaries, and requirement-attribute fields.
- Team: zero, one, maximum, and over-maximum member counts; malformed nested codes; mixed absent and
  present equipment; unknown flags; invalid charset sequences; partial-member failure semantics;
  aggregate size caps; and preservation of member order.
- Cross-cutting: integer overflow, negative/fractional/`NaN` values supplied to encoders, frozen or
  mutated input DTOs, dependency returns with unexpected prototypes/getters, and deterministic
  results across repeated encode operations.

### Definition of Done Completeness

The Definition of Done covers the major feature slices, typed failures, catalog boundaries,
fixtures, verification, and record consistency. It is not yet complete enough to prove the stated
architecture.

Missing or ambiguous completion criteria include:

- a production browser build and runtime import proof at the dependency gate;
- an enforceable check that only the adapter imports the vendor package;
- runtime validation of every dependency-returned shape, not only TypeScript facade coverage;
- a precise equivalence classifier such as exact replay, normalized semantic re-encode, and
  unsupported/lossy;
- explicit proof that decode/encode preserves every claimed raw field, including unknown values;
- a separate, tested Build projection with documented eligibility rules;
- concrete input, wrapper-name, nested-team, and decoded-size limits;
- a decision matrix for warning versus error behavior;
- catalog re-resolution/version behavior;
- a non-success terminal state when the dependency gate blocks implementation; and
- closure requirements for deferred team support, including a follow-up owner, ticket, and absence
  of public exports.

## Review of `SPRINT-006-GPT54-DRAFT.md`

### Strengths

- Its sequencing is more coherent. Phase 1 proves the adapter, Phase 2 defines shared contracts and
  wrappers, Phase 3 consumes them for skill templates, and Phase 4 consumes them for equipment.
  This minimizes circular dependencies and contract churn.
- Phase 0 makes prerequisites, fixture ownership, ticket traceability, and baseline verification
  explicit before implementation starts.
- The module split is cleaner. In particular, `template-build.ts` keeps Build projection separate
  from the decoded template envelope, and `template-resolve.ts` separates catalog resolution from
  codec mechanics.
- The draft states several important decisions plainly: one adapter, no hand-rolled fallback,
  dedicated lossless envelopes, raw-only equipment version 1, semantic rather than textual round
  trips, and bounded untrusted-input handling.
- Phase 4 has a stronger initial equipment edge-case set than GPT55, including empty slots,
  off-hand/two-handed cases, invalid dyes, and unsupported field combinations.
- The granular Definition of Done, focused test suites, `npm run build`, `npm run verify`, ticket
  burn verification, and effort percentages make execution and closeout easier to manage.

### Weaknesses

- It labels the sprint `planned` even though wrapper policy, passthrough behavior, fixture corpus,
  team feasibility, and important dependency facts remain unresolved. The status overstates
  readiness.
- It does not surface the Node `>=24` versus repository Node `>=22.11.0` mismatch that GPT55 treats
  as a primary gate. “Works under the repo” is not enough; the supported runtime matrix and the
  consequence of relying on an unsupported engine need an explicit decision.
- The adapter contract is less concrete: runtime shape guards, sanitized error context, original
  versus normalized code metadata, and stable error-code taxonomy are asserted generally but not
  designed with the specificity present in GPT55.
- “Semantic equivalence after re-decode” is frozen too early and defined too loosely. If the same
  dependency both drops a field during decode and validates the later re-decode, the round trip can
  appear equivalent while losing source information.
- The equipment phase simultaneously claims a lossless raw envelope, permits unknown values to be
  “preserved or explicitly rejected,” and says upstream fields that cannot be exposed cleanly
  should stay out of the public API. Those are three different compatibility guarantees and require
  an explicit classification policy.
- The team phase assumes “up to 12” members plus labels and enabled flags without showing that these
  fields and limits come from the dependency probe or an authority. Those details should be probe
  outputs, not pre-gate contract promises.
- Wrappers are bundled into the general contract ticket. This is better than placing them after
  skill decoding, but it may still be too much scope for BW-0502 unless wrapper grammar and format
  dispatch are explicitly separated from codec-specific decode behavior.
- The source-authority language relies on generic “Guild Wars template-format expectations” without
  naming an independent specification or defining how conflicts with package behavior are
  adjudicated.

### Gaps in Risk Analysis

- It underplays runtime compatibility and supply-chain risk: engine support, CJS/ESM interop,
  browser globals, tree-shaking/side effects, package maintenance, transitive dependencies, and
  license verification are not explicit gates.
- It does not address public-contract coupling to vendor-returned shapes or future dependency
  replacement.
- It lacks a policy for catalog changes and stale cached resolution outcomes.
- It does not analyze the possibility that the dependency cannot encode unknown IDs even when it
  can decode them, or that it silently omits fields outside its known model.
- The plan does not reserve capacity for the two radically different BW-0505 outcomes. A full team
  implementation and a documented deferral are not equivalent amounts of work, so the sprint's
  predictability depends on treating implementation as conditional scope.
- The risk section does not address sensitive team metadata, malicious aggregate nesting, or
  resource exhaustion beyond the general word “bounded.”
- No strategy is given for fixture independence. Package README examples and package-generated
  synthetic fixtures can reproduce the same bug as the package and provide weak compatibility
  evidence without game-created or independently validated goldens.

### Missing Edge Cases

- All skill, wrapper, equipment, and team cases listed for GPT55 also apply here.
- The contract/resolution phase additionally needs tests for re-resolution after catalog changes,
  serialization/deserialization of every outcome, unknown enum values, and stable ordering of
  attributes and slots.
- Build projection needs explicit cases for partially resolved envelopes, catalog records without
  reverse template IDs, contradictory raw and resolved IDs, missing secondary professions, and
  round trips where authored Build data cannot represent the imported source exactly.
- Adapter tests should cover dependency methods that throw non-`Error` values, return malformed
  objects, mutate their input, or vary normalization across repeated calls.
- Fixture tests need independently validated golden vectors for every advertised format and
  version/header, not only examples produced and consumed by the same implementation.

### Definition of Done Completeness

GPT54 has the stronger Definition of Done, particularly around shared contracts, non-widening of
authored models, explicit lookup outcomes, raw equipment scope, build verification, and the absence
of a fallback parser. It still lacks:

- the Node/browser compatibility matrix and an explicit production-bundle gate;
- concrete runtime shape guards and error-sanitization assertions;
- an exact definition of semantic equivalence and field-level losslessness;
- original-input and normalized-output retention rules;
- measurable parsing and nesting limits;
- a static import-boundary test;
- explicit Build projection acceptance criteria;
- a dependency upgrade/conformance policy;
- fixture independence requirements;
- a warning-versus-error matrix; and
- distinct “done,” “deferred optional scope,” and “blocked” closeout semantics.

## Cross-Draft Contradictions and Trade-offs

| Topic | GPT55 | GPT54 | Merge Direction |
| --- | --- | --- | --- |
| Ticket ownership | BW-0502 implements skills; BW-0503 implements wrappers. | BW-0502 defines contracts/wrappers; BW-0503 implements skills. | Use GPT54's mapping so skills consume an already-defined wrapper and contract surface. |
| Dependency versus contract sequencing | BW-0501 evaluates the package and defines public contracts together. | BW-0501 proves the adapter; BW-0502 locks contracts. | Keep separate gates. Probe results must inform contracts. |
| Module layout | Central `template-codec.ts` plus `template-codec-vendor.ts`; optional Build projection is embedded in decoded data. | `template-adapter.ts`, `template.ts`, `template-resolve.ts`, and separate `template-build.ts`. | Prefer GPT54's separation, with GPT55's concrete result/error definitions placed in `template.ts`. |
| Wrapper behavior | Preserve safe names but reject or normalize according to a future policy; empty names are tested but not decided. | Reject empty names and sanitize output deterministically, while an open question still asks about exact preservation. | Define separate `rawName` and normalized emission behavior, or choose one policy before BW-0502. Do not promise both exact preservation and sanitization in one field. |
| Round-trip guarantee | Allows byte identity or a documented normalized equivalent. | Declares semantic equivalence as the success criterion. | Adopt a three-level outcome: exact replay, field-complete normalized re-encode, or unsupported/lossy. Define the compared fields independently of vendor objects. |
| Equipment unknown fields | Preserve raw IDs; semantic projection may be absent or partial. | Preserve or reject unknown values; omit fields not modeled publicly. | Ship no semantic projection. Publish only fields proven round-trippable, retain bounded original input, and reject encoding when field-complete re-encode cannot be proven. |
| Team gate | Detailed possible DTO and metadata are described; decision occurs in BW-0505 after a light earlier dependency proof. | A go/no-go is recorded in BW-0501, then BW-0505 implements or defers, but assumes a 12-member model. | Use a two-stage gate: adapter capability probe in BW-0501, final scoped decision in BW-0505 after skill/equipment codecs exist. Publish no speculative DTO or member limit. |
| Browser proof | Browser/Vite support is an explicit risk, but Phase 1 omits a build command. | Phase 1 runs `npm run build`, but the Node engine mismatch is not explicit. | Combine both: test the supported Node floor, typecheck, production Vite build, and a browser-relevant smoke path. |
| Sprint failure semantics | Dependency incompatibility can block the sprint, while “blocked” also appears inside DoD. | Also blocks at Phase 1, but the overall draft is already `planned`. | Treat blocked as a distinct terminal report, not successful Definition of Done. Define what records may close when implementation does not proceed. |
| Lifecycle metadata | `draft`, created 2026-09-02. | `planned`, created 2026-09-01. | Select one authoritative metadata state after contract decisions are resolved; currently `draft` is more accurate. |

## Merge Recommendations

1. Adopt GPT54's phase and ticket sequence:

   - Phase 0: prerequisites, fixture plan, traceability, and clean baseline.
   - BW-0501: dependency/license/engine/bundler proof, adapter-only spike, runtime shape inventory,
     normalization observations, and a preliminary team capability probe.
   - BW-0502: vendor-independent contracts, wrapper grammar, resolution outcomes, error/warning
     matrix, resource limits, and equivalence policy.
   - BW-0503: skill decode/encode plus separate Build projection.
   - BW-0504: raw equipment decode/encode with no semantic projection.
   - BW-0505: final team decision; implementation only if a bounded contract and capacity are
     proven, otherwise a fully specified deferral.
   - BW-0506: independent fixtures, docs, verification, and record closeout.

2. Import GPT55's concrete dependency gate into BW-0501. Test the repository's minimum supported
   Node version, current development Node version, TypeScript/module resolution, Vitest, and the
   production Vite build. Record license and package-entry facts. If any target is unsupported,
   produce a decision record comparing engine uplift, dependency deferral, and a separately planned
   alternative; do not silently select one.

3. Make domain contracts vendor-independent. No package classes, property names, exceptions, or
   normalization flags should cross the adapter. Back the adapter interface with a black-box
   conformance suite so a package upgrade or replacement can be evaluated without rewriting the
   public API.

4. Split representation, resolution, and projection:

   - decoded envelopes own bounded original input, normalized output when available, ordered raw
     fields, wrapper metadata, and parse notes;
   - resolution helpers derive catalog outcomes and can be rerun against newer catalogs; and
   - a separate pure helper projects only fully representable skill envelopes into `Build`.

   Do not place an optional `Build` inside the decoded envelope, and do not create a semantic
   equipment projection in this sprint.

5. Replace the vague “lossless semantic round trip” with explicit compatibility grades:

   - **Exact replay:** the original accepted string can be emitted unchanged.
   - **Field-complete normalized re-encode:** output text differs, but every field in an
     independently defined format-level comparison survives decode/encode/decode.
   - **Unsupported or lossy:** the dependency omits, rejects, or cannot re-encode a field; return a
     typed result and do not claim compatibility.

   Keeping the source string for exact replay must not be used as proof that edited DTOs can be
   encoded losslessly.

6. Resolve the wrapper and warning policies in BW-0502, before skill work. Specify accepted wrapper
   forms, Unicode normalization, delimiters, whitespace, empty names, maximum code points/bytes,
   whether the raw spelling is retained, and deterministic emission. Define which anomalies are
   warnings, which prevent projection, and which prevent encoding.

7. Treat team implementation as conditional scope, not a binary Definition of Done shortcut.
   BW-0505 must always deliver a decision with evidence. If implementation is approved, add its
   estimated work only after the probe establishes actual member fields, limits, charset behavior,
   nesting, and round-trip support. If deferred, require a follow-up ticket and verify that no team
   API is exported.

8. Strengthen fixtures and tests. Use minimized independently validated golden vectors where
   possible, then add synthetic boundary and malformed cases. Add property or generative tests for
   bounded numeric ranges and round trips, plus adversarial tests for input size, nesting, trailing
   data, malformed dependency returns, and deterministic output.

9. Add long-range ownership criteria: catalog re-resolution behavior, dependency upgrade gates,
   adapter conformance ownership, public API versioning, and a prohibition on persisting resolved
   catalog outcomes as immutable facts without version context.

10. Rewrite the final Definition of Done so every claim is objectively testable. It should include
    the supported runtime matrix, adapter import isolation, runtime shape guards, resource limits,
    compatibility grades, projection eligibility, all independently advertised format vectors,
    exact deferral semantics, documentation, focused tests, production build, full verification,
    and consistent sprint records. A failed dependency gate should result in a clearly marked
    blocked sprint, not a sprint that satisfies an alternative form of “done.”

## Recommended Merge Verdict

Merge the drafts, but do not merely concatenate them. Use GPT54 as the execution skeleton and GPT55
as the source for detailed adapter, error, authority, and security requirements. Before promoting
the result from `draft` to `planned`, resolve the contract-defining open questions and replace broad
losslessness claims with explicit compatibility grades. That produces a sprint with a stable
architecture even if the chosen package fails, normalizes aggressively, or is replaced later.
