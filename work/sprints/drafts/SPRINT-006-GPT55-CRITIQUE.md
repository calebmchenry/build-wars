# SPRINT-006 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-006-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-006-GPT54-DRAFT.md`

Both listed drafts were present. `work/sprints/drafts/SPRINT-006-GPT55-DRAFT.md` was not read or critiqued.

## Executive Assessment

GPT56SOL is the stronger architectural draft. It treats template compatibility as an untrusted codec boundary, separates raw template documents from authored domain models, names exact-source versus canonical fidelity, blocks silent vendor normalization, and explicitly handles the repository Node floor versus the package's documented runtime expectation. Its main problem is scope pressure: it turns a template compatibility sprint into a large platform hardening sprint with a new TypeScript subproject, import-boundary enforcement, extensive fixture metadata, mutation tests, bundle review, optional team support, and multiple documentation/ticket updates.

GPT54 is more executable and easier to turn into a sprint checklist. It has a good dependency-first sequence, a useful traceability Phase 0, and clearer phase percentages. However, it puts the adapter inside `src/domain`, includes build projection inside the same sprint, leaves exact-source preservation and vendor-loss behavior less formal, and carries unresolved questions into the plan that should be decisions before execution.

The merged sprint should use GPT56SOL as the architecture baseline, pull GPT54's simpler sequencing and traceability setup, and trim GPT56SOL's verification/documentation sprawl into must-pass gates versus follow-up hardening.

## GPT56SOL Draft

### Strengths

- Strong separation of concerns: the draft keeps executable vendor behavior behind `src/template-compatibility`, with `src/domain/template.ts` owning plain JSON-compatible contracts. This is cleaner than letting a third-party codec become part of the domain layer.
- Good loss-aware model: dedicated `SkillTemplateDocument` and `EquipmentTemplateDocument` envelopes avoid widening `Build` or the current semantic `EquipmentTemplate` to carry unresolved raw IDs.
- The export model is well defined. `preserve-source` uses the original code when the semantic fingerprint still matches, while `canonical` requires encode/decode proof before returning a generated code.
- Vendor normalization is treated as a failure path, not as validation. The draft correctly anticipates clamping, omitted fields, item-slot maps, filtered modifiers, and replacement behavior.
- It explicitly calls out the Node.js mismatch: the package documents Node `>=24`, while the repo is at Node `>=22.11.0`. This must be proven rather than assumed.
- The chat-code parser is scoped locally and bounded, which is the right approach because wrapper names are not bitstream facts and dependency helpers may discard names.
- The paw-ned2 path is responsibly gated. It can ship only as a raw bounded envelope if it passes concrete runtime, charset, nesting, length, and fidelity gates; otherwise it is deferred to EPIC-17.
- The risk table is unusually strong. It covers runtime floor, untyped vendor output, silent lossy encodes, exact versus semantic fidelity, type confusion, stateful instances, equipment map staleness, and fixture provenance.

### Weaknesses

- Scope is too large for one sprint unless the team explicitly accepts a broad infrastructure sprint. The draft includes a new compatibility package boundary, TypeScript project wiring, ESLint import restrictions, fixture matrix, mutation tests, bundle diff review, docs, ticket closeout, optional team support, and dependency/license review.
- It over-specifies implementation before Phase 1 proves the dependency can satisfy mandatory skill/equipment behavior. Several detailed contracts may need to change after actual package evaluation.
- The proposed input caps are specific before evidence is gathered. The draft says Phase 1 may lower limits, but the plan already anchors on values like 4 KiB, 8 KiB, 128 KiB, and 256 code points without showing why they match real templates.
- The fingerprint model is central but risky. It depends on a stable schema-owned semantic projection, exact ordering choices, versioning discipline, and careful exclusion of wrapper/name changes. That is real implementation work and should be called out as a core deliverable, not just support machinery.
- The minimal header discriminator is a hidden parser. The draft says it must not become a body parser, but even kind/version discrimination requires format knowledge and tests. That boundary needs a design note explaining exactly which bytes/bits are inspected and why that is not a competing codec.
- The fixture strategy is rigorous but heavy. Metadata, source classification, deterministic double-runs, mutation tests, bundle review, and license checks are valuable, but they may crowd out the actual codec implementation.
- Creating an EPIC-17 ticket during this sprint if paw-ned2 is deferred may be correct, but it expands sprint ownership across another epic. That should be conditional and minimal.

### Gaps In Risk Analysis

- The draft relies heavily on decode-after-encode equality using the same dependency as both encoder and decoder. That catches many adapter losses, but it cannot detect a consistent vendor bug where both directions agree on the wrong semantics.
- It does not clearly distinguish must-pass security/runtime gates from nice-to-have hardening such as mutation tests, repeated clean-process matrix runs, and bundle-size disposition.
- There is no explicit migration risk for `TemplateSourceEnvelope` schema changes. Once fingerprints and source envelopes become public contracts, future changes need versioning rules.
- It does not fully address how to handle a decoded vendor field that is valid and preserved in source, but not yet modeled in the public document. The draft mostly says reject or raw-only, but equipment and team formats may expose unknown fields after Phase 1.
- It assumes the repository can afford new import-boundary tooling without destabilizing existing TypeScript or ESLint workflows.
- It does not call out the risk that exact original input preservation stores user-provided names/descriptions in memory or fixtures. The caps reduce exposure, but provenance and privacy rules should also apply to wrapper/team names.

### Missing Edge Cases

- Chat wrappers with leading/trailing outer whitespace versus inner name whitespace, non-ASCII names, Unicode normalization forms, visually similar delimiters, multiple semicolons, nested brackets, and trailing text after a valid wrapper.
- Source envelope behavior when only wrapper kind or name changes, when a decoded document is cloned without source, or when schema version changes invalidate an old fingerprint.
- Dependency-returned arrays with duplicate attributes, duplicate equipment slots, sparse arrays, accessors, inherited properties, negative zero, `NaN`, `Infinity`, fractions, and integer values above safe bounds.
- Skill attributes that are duplicated, out of profession, primary-only on the wrong profession, rank zero, or returned in an order different from the encoded order.
- Equipment fields beyond slot/item/color/modifier: requirements, weapon-set grouping, off-hand versus two-handed conflicts, and any vendor-exposed flags that are not yet represented.
- Canonical export where semantic equality passes but the dependency strips an unknown-but-currently-unmodeled field. This is especially important for equipment and paw-ned2.

### Definition Of Done Completeness

The DoD is comprehensive and mostly testable. It covers dependency pinning, runtime floor, public boundary, skill/equipment fidelity, chat wrappers, typed errors, fixtures, deterministic verification, paw-ned2 disposition, and closeout consistency.

The issue is size and prioritization. The merged DoD should separate:

- Mandatory gates: dependency proof, typed boundary, skill import/export, equipment import/export, chat parsing, exact-source preservation, canonical loss refusal, deterministic offline tests, and paw-ned2 ship/defer disposition.
- Closeout hygiene: docs, tickets, ledger, fixture provenance, no logs/tarballs, and public export review.
- Optional hardening: mutation tests, double clean-process runs, bundle-size analysis, and broader license/tree inspection unless repo policy already requires them.

## GPT54 Draft

### Strengths

- The sequencing is pragmatic. Phase 0 handles traceability and baseline validation; Phase 1 proves the dependency before public contracts; later phases build skill, equipment, team disposition, and closeout.
- It correctly keeps unresolved template data out of the current authored `Build` and semantic `EquipmentTemplate` contracts.
- It recognizes that semantic round-trip equivalence is a better export test than byte identity for canonical output.
- It includes a useful "Compatibility Authority" table that distinguishes upstream codec behavior, known fixtures, catalog lookup results, and conflict handling.
- It scopes UI, storage, routing, attribution UI, rule legality, and semantic equipment joins out of the sprint.
- It includes fixture and provenance concerns without making them dominate the plan.
- It has a clear team-format fallback: implement with fixtures or explicitly defer with evidence.

### Weaknesses

- The adapter location is weaker. Putting `src/domain/template-adapter.ts` and the vendor declaration under `src/domain` risks making the dependency part of the domain layer instead of a separate compatibility boundary.
- It adds `template-build.ts` and build projection helpers in Phase 3. That invites scope creep into authored build construction, game-mode assumptions, and unresolved-ID policy that should belong to later import/application work.
- Exact-source preservation is under-specified. The draft says canonical export may differ semantically and unknown IDs should survive, but it does not define source envelopes, fingerprints, or separate export modes strongly enough to guarantee non-reencodable legacy inputs.
- The wrapper policy is inconsistent. Phase 2 mentions empty-name rejection, while other parts talk about preserving wrapper names and an open question asks how to handle wrapper-name whitespace. This should be decided before implementation.
- Equipment support is too vague. "As exposed by the upstream codec" risks mirroring vendor shape into public contracts, and "lossless at the raw numeric layer" may be impossible if the dependency hides, derives, reorders, or drops fields.
- The draft does not mention the package's documented Node `>=24` expectation, lack of TypeScript declarations, or exact CJS/ES/browser distribution concerns as concrete known risks.
- Error handling remains high-level. It calls for stable typed errors, but does not define a stable error code set, bounded messages, operation/stage fields, or a rule that vendor stacks and objects cannot cross the public boundary.

### Gaps In Risk Analysis

- Runtime compatibility is too generic. The plan should explicitly test the repo's Node floor and Vite production build against the package's documented runtime expectation.
- It does not analyze vendor statefulness or repeated operation behavior.
- It does not sufficiently cover cross-kind type confusion, such as a skill decoder accepting equipment-shaped input or vice versa.
- It does not describe how to handle dependency clamping, profession coercion, attribute omission, unsupported skill replacement, item-slot derivation, or modifier filtering.
- It does not address semver upgrade risk beyond the initial pin.
- It does not analyze fixture oracle quality. A round trip through the same dependency is useful but is not a full independent truth source.
- It underplays the risk that build projection becomes a hidden policy decision for unresolved IDs, catalog versions, game mode, and legality.

### Missing Edge Cases

- Empty chat-code names, whitespace-only names, names with semicolons/brackets/control characters, Unicode names, missing code after a separator, and multiple wrappers in one string.
- Base64 padding differences, accepted spaces for plus signs, invalid alphabets, unsupported old/new headers, short/truncated payloads, and oversized inputs.
- Dependency-returned malformed JavaScript shapes: sparse arrays, unexpected prototypes, inherited properties, accessors, non-finite numbers, fractions, and unsafe integers.
- Skill template edge cases around profession `0`, empty secondary, skill slot `0`, duplicate attributes, high ranks, fewer/more than eight skills from the dependency, and dispositioned or future IDs.
- Equipment edge cases around duplicate slots, deterministic ordering of object keys, two-handed/off-hand conflicts, hardcoded item-to-slot disagreements, zero modifiers, too many modifiers, unknown colors, and requirement attributes.
- Export edge cases where an unchanged source should preserve bytes even when the dependency cannot canonicalize it, versus edited documents that must fail rather than return a lossy code.

### Definition Of Done Completeness

The DoD is a solid high-level checklist, but several items are not precise enough to guard implementation:

- "Consumed only through a local adapter under `src/domain`" should become "consumed only through a dedicated compatibility adapter; domain exports only plain contracts."
- "Unknown IDs are never silently dropped" needs explicit exact-source and canonical postcondition checks.
- The DoD should require stable error codes and bounded error payloads, not just useful messages.
- It should require the Node floor and Vite build proof.
- It should require no deep imports, no vendored package source, and no runtime network path.
- It should require deterministic fixture metadata and a dependency upgrade gate.
- It should remove or sharply limit build projection from this sprint unless a downstream consumer truly needs it immediately.

## Comparison

GPT56SOL is safer because it models the hard parts directly: untrusted input, vendor uncertainty, source preservation, canonical fidelity, runtime compatibility, and architecture boundaries. It is the better base for avoiding silent data loss.

GPT54 is easier to execute because it is shorter and has cleaner phase flow. It is better at sprint ergonomics, but it leaves too much policy implicit. The riskiest choices in GPT54 are putting vendor adaptation in `src/domain`, including build projection, and leaving wrapper/exact-source behavior unresolved.

The drafts disagree or diverge on several decisions:

- Adapter boundary: GPT56SOL uses `src/template-compatibility`; GPT54 uses `src/domain`. Merge should choose GPT56SOL's separate boundary.
- Build projection: GPT56SOL defers persisted `Build` construction; GPT54 includes projection helpers. Merge should defer projection unless required by BW-0503 acceptance criteria.
- Empty wrapper names: GPT56SOL preserves them; GPT54 says to reject them in one phase and asks an open question later. Merge needs one policy. Prefer GPT56SOL's `null` for no wrapper and `""` for empty wrapper name if real chat syntax allows it.
- Equipment public shape: GPT56SOL narrows to slot/item/color/modifier; GPT54 mentions requirement attributes and weapon sets. Merge should not finalize the exact equipment field set until Phase 1 confirms what the package surfaces and what can be preserved.
- Verification depth: GPT56SOL is more rigorous; GPT54 is more affordable. Merge should classify verification into mandatory, closeout, and optional hardening.
- paw-ned2: both support ship-or-defer, but GPT56SOL gives better gates. Merge should keep GPT56SOL's gates but preserve GPT54's simpler "no partial public API" outcome.

## Merge Recommendations

Use GPT56SOL's architecture baseline:

- `src/domain` owns plain contracts and ID namespaces.
- `src/template-compatibility` owns vendor calls, wrapper parsing, shape validation, error mapping, source preservation, and encode postconditions.
- No `src/app` changes.
- No generated manifests, QA reports, data-ingestion scripts, snapshots, network clients, storage, React, or DOM APIs in runtime codec modules.

Pull these pieces from GPT54:

- Add a Phase 0 for ticket traceability, prerequisites, fixture plan, and baseline validation.
- Keep phase descriptions shorter and reduce the files summary to paths that are likely to change.
- Keep the "Compatibility Authority" table, but update it with GPT56SOL's exact-source/canonical distinction and runtime matrix.
- Keep the explicit closeout connection to EPIC-05, BW-0501 through BW-0506, `SPRINT-006`, and the ledger.

Trim or reclassify GPT56SOL scope:

- Make mutation tests, double clean-process matrix runs, and bundle-size disposition optional hardening unless the dependency evaluation reveals instability.
- Keep license/transitive dependency review lightweight and tied to the pinned package adoption gate.
- Create EPIC-17 follow-up only if paw-ned2 is actually deferred and the repo's ticket policy requires a concrete child ticket.
- Avoid making `npm ci` a normal DoD command unless existing sprint policy requires it; use `npm run verify` plus focused template tests as the primary closeout signal.

Add a short "Alternatives Considered" section before implementation:

- Pinned dependency adapter versus audited fork versus local parser versus deferral.
- Separate compatibility boundary versus placing the adapter in `src/domain`.
- Mandatory skill/equipment import-export versus skill-only first sprint.
- Import-only first increment versus import/export with postconditioned canonical encoding.
- Exact-source preservation plus canonical semantic equivalence versus canonical-only output.
- paw-ned2 raw support now versus EPIC-17 deferral.

Lock these decisions before execution starts:

- Empty chat-name policy.
- Exact source envelope fields and fingerprint projection.
- Public equipment field set after package evaluation.
- Whether build projection is out of scope or a narrow optional helper for fully resolved skill templates.
- The initial hard caps and which caps are evidence-based versus conservative defaults.
- The stable error code list and public result shape.

The best merged plan is GPT56SOL's safety model with GPT54's sprint discipline: prove the dependency first, define a small plain contract surface, implement skill and equipment codecs with exact-source and canonical proof, decide paw-ned2 with evidence, and leave UI, persistence, legality, party modeling, and semantic equipment joins to later epics.
