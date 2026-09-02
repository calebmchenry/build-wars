---
id: SPRINT-006
title: Template Compatibility
status: planned
source_target: BACKLOG
source_epic: EPIC-05
source_epic_path: work/tickets/05-template-compatibility/EPIC.md
tickets:
  - BW-0501
  - BW-0502
  - BW-0503
  - BW-0504
  - BW-0505
  - BW-0506
created: 2026-09-01
---

# Sprint 006: Template Compatibility

## Overview

This sprint gives Build Wars a framework-neutral, loss-aware boundary for the Guild Wars template
formats players already exchange. It pins and evaluates `@buildwars/gw-templates@1.1.1`, then ships
skill-template import/export, equipment-template import/export, chat-code wrappers and names, typed
failure results, and an offline fixture compatibility suite. paw-ned2/team support receives a bounded
ship-or-defer assessment after the mandatory single-build formats are stable.

The increment is a codec and domain-contract layer, not an import dialog, editor, library, share
flow, or rule engine. `src/app` does not change. The new public contracts remain plain JSON-compatible
data, while all untyped dependency objects, state, exceptions, normalization behavior, and runtime
quirks stay behind `src/template-compatibility`. That layer may consume public domain contracts but
must not import React, DOM APIs, storage, network clients, app modules, data-ingestion scripts,
generated manifests, or QA reports.

The sprint locks these strategic decisions:

- Imported template facts live in dedicated `SkillTemplateDocument` and
  `EquipmentTemplateDocument` envelopes. They are not forced into `Build` or the existing semantic
  `EquipmentTemplate`, because those models use catalog IDs and cannot faithfully represent all raw
  template IDs, equipment item/modifier/color IDs, wrapper facts, or dependency-specific fidelity.
- The decoded envelope is the lossless boundary. It retains the bounded original input, bare code,
  wrapper kind, template name, raw template IDs, and a fingerprint of the decoded semantic facts.
  Catalog resolution is a separate derived view and never rewrites those authored values.
- Export has two explicit modes. `preserve-source` returns the original code when the current facts
  still match the decode fingerprint; this is the exact path for unknown, dispositioned, legacy, or
  dependency-normalized inputs. `canonical` asks the pinned dependency to encode, decodes the result
  again, and returns it only when the decoded template facts equal the caller's intended facts.
- A byte-different canonical code is acceptable only when semantic re-decode equality is proven.
  Exact byte preservation is guaranteed for an unchanged source envelope, not for an edited or
  newly authored document. The result reports whether fidelity is `exact-source`,
  `semantic-equivalent`, or unavailable.
- Silent normalization is a failed export, not validation. Preliminary package inspection shows
  skill encoding can coerce professions, omit attributes, clamp ranks, and replace unsupported skill
  IDs, while equipment encoding uses a built-in item-to-slot table and filters modifiers. The adapter
  validates inputs and enforces a re-decode postcondition so those behaviors cannot destroy data
  unnoticed. EPIC-06, not this sprint, decides whether preserved facts are legal game builds.
- Profession, attribute, skill, equipment-item, equipment-modifier, color, and equipment-slot IDs
  remain distinct namespaces. Skill template ID `0` is an explicit empty slot; profession `0` keeps
  EPIC-03's `none` semantics. Unknown nonzero values remain authored facts rather than fake catalog
  records.
- Skill catalog enrichment is caller-supplied and pure. It uses the existing EPIC-03 and EPIC-04
  lookup helpers to produce known, none, reserved, unsupported, dispositioned, empty, or unknown
  outcomes without making a runtime import from catalog JSON or its adjacent audit artifacts.
- Equipment support ships now as bounded low-level template facts: slot, item ID, color ID, and
  modifier IDs. It does not pretend that the incomplete rune, insignia, armor, weapon, or modifier
  catalogs can provide semantic equipment records. EPIC-13 owns those joins and display facts.
- Chat-code parsing and formatting are owned locally because wrappers and names are not bitstream
  concerns and the dependency's convenience functions discard names. Empty names are preserved;
  missing codes, ambiguous delimiters, brackets/control characters in emitted names, and oversized
  input receive typed errors.
- The package is imported only through its public package entry point and pinned exactly. A narrow
  local declaration describes only the methods the adapter uses; vendor classes and shapes never
  become public Build Wars contracts. No published source is copied or deep-imported.
- A preliminary package check found no TypeScript declarations, a CJS/ES/browser distribution, and a
  documented Node.js `>=24` expectation while Build Wars currently supports Node.js `>=22.11.0`.
  Phase 1 must prove the mandatory skill/equipment path under the repository minimum and Vite browser
  build before adoption. The sprint does not silently raise the project-wide runtime floor.
- The adapter performs only bounded wrapper parsing and a minimal audited template header
  kind/version discrimination before delegating the body to the dependency. It does not introduce a
  second skill/equipment bitstream parser. If the dependency cannot safely satisfy a mandatory case,
  implementation stops for an explicit dependency, fork, or scope amendment.
- paw-ned2 is lower priority than the mandatory single-build formats and overlaps EPIC-17 party
  ownership. It ships only as a bounded raw team-template envelope if the package passes Node/browser,
  charset, malformed-input, 12-build, nested-code, and re-encode fidelity gates without global
  polyfills or a premature `PartyBuild` redesign. Otherwise BW-0505 records the incompatibility and
  creates an EPIC-17 follow-up; that documented deferral completes the assessment but not team codec
  support.
- All routine verification is deterministic and network-free. Committed fixtures are synthetic or
  a minimal set of package-documented MIT examples with per-case source metadata. No live wiki,
  community-tool, CDN, or npm request occurs during `npm run verify`.

Initial hard limits are 4 KiB for a bare skill/equipment code, 8 KiB for a chat-code input, 256
Unicode code points for a template name, 128 KiB for a paw-ned2 input if enabled, 12 team members,
three weapon-set codes per team member, 512 code points for player/name fields, and 4 KiB for a team
description. Phase 1 may lower these limits from observed fixtures. Raising them requires a recorded
test and security rationale; callers cannot override them upward.

## Use Cases

1. **Import a skill template without losing authored IDs**: A caller can decode primary and
   secondary profession IDs, attribute ID/rank pairs, and exactly eight skill slots while retaining
   unknown, dispositioned, zero, or future numeric values in the template namespace.
2. **Explain imported skill IDs**: Given caller-supplied promoted catalogs, a pure resolver can label
   each profession, attribute, and skill reference as known, none, empty, reserved, unsupported,
   dispositioned, or unknown without mutating the decoded document.
3. **Round-trip an unchanged template exactly**: A user can import a legacy, unknown-ID, or otherwise
   dependency-sensitive code and export the original bare code or safely reconstructed chat wrapper
   as long as its decoded facts have not changed.
4. **Export a known authored skill template safely**: A new or edited skill document can produce a
   dependency-generated code only after input validation and decode-after-encode equality prove that
   no profession, attribute, rank, or skill slot was coerced or dropped.
5. **Preserve chat-code context**: Import retains whether the source was bare or bracketed, including
   an empty or non-empty template name. Export can preserve that wrapper choice or deliberately emit
   a validated bare/chat form.
6. **Exchange equipment before equipment catalogs exist**: A caller can decode and re-emit bounded
   raw equipment item, slot, dye/color, and modifier IDs without guessing armor, rune, insignia,
   weapon, or modifier semantics.
7. **Fail usefully on hostile or malformed input**: Invalid character sets, wrong template kinds,
   unsupported versions, empty codes, malformed wrappers, truncated payloads detected by the
   dependency, invalid field shapes, cap violations, dependency failures, and lossy exports return
   stable typed errors rather than leaked exceptions.
8. **Compare compatibility across upgrades**: A fixture matrix records original input, decoded facts,
   expected error/fidelity, canonical output where stable, and source metadata so dependency or
   platform changes produce reviewable semantic diffs.
9. **Assess team-format interoperability responsibly**: Maintainers receive either a tested bounded
   paw-ned2 raw codec or an evidence-backed EPIC-17 deferral that identifies the failed capability,
   affected fixture, package/runtime constraint, and required follow-up.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Domain | Plain template documents, branded raw ID namespaces, fidelity/error contracts, resolved catalog views, and pure lookup projections. | UI state, storage, sharing, rule verdicts, catalog repair, or rendering. |
| Codec | Safe input classification, chat wrapper parsing/formatting, pinned vendor adaptation, shape/range checks, exact-source passthrough, canonical encode postconditions, and bounded optional team support. | A second full bitstream implementation, vendor object leakage, dynamic package loading, CDN imports, or network access. |
| Skill compatibility | Primary/secondary professions, attribute/rank pairs, eight slots, empty/unknown IDs, EPIC-03/04 resolution, and new/legacy codes supported by the dependency. | Build legality, elite/PvE limits, effective ranks, mode inference, or direct conversion to persisted `Build`. |
| Equipment compatibility | Raw item, slot, color, and modifier facts with exact-source and proven semantic re-encoding. | Equipment catalog joins, armor ratings, runes/insignias, weapon semantics, four-set editor behavior, or current `EquipmentTemplate` hydration. |
| Team compatibility | Timeboxed package/runtime/format proof and, only if all gates pass, a raw bounded paw-ned2 envelope. | Party editor, hero identity, roles, persistence, team validation, consumable rules, or replacing EPIC-17. |
| Fixtures | Synthetic vectors and minimal attributed MIT package examples, all offline. | Large community build collections, copied guide prose, live wiki data, screenshots, or source-derived catalogs duplicated into fixtures. |

### Layering And Data Flow

```text
untrusted bare code or chat code
  -> size/character/wrapper checks
  -> minimal template kind/version discriminator
  -> fresh pinned vendor codec instance
  -> caught dependency call
  -> strict plain-object/array/integer shape validation
  -> SkillTemplateDocument | EquipmentTemplateDocument
       |                    |
       |                    +-> exact original code + decoded-facts fingerprint
       +-> optional caller-supplied EPIC-03/04 catalogs
             -> resolved view only; raw template document is unchanged

template document
  -> preserve-source: fingerprint match -> original bare code
  -> canonical: validate -> vendor encode -> vendor decode -> semantic equality
  -> optional validated chat wrapper/name formatting
  -> TemplateEncodeResult with explicit fidelity

src/app                    -X-> changed by this sprint
src/template-compatibility -X-> React | storage | network | app modules | data scripts
runtime source             -X-> generated manifests | QA reports | snapshots | wiki APIs
```

`src/domain/template.ts` owns the serializable public contracts. `src/template-compatibility` owns
the executable adapter and may import `src/domain`, never the reverse. A dedicated TypeScript project
and ESLint rules check this layer without React or application imports. The package is instantiated
inside each operation because its classes are stateful; instances are never shared across calls.

### Public Result And Error Model

Every public operation returns a discriminated result and treats malformed user input as ordinary
data:

- success: `{ ok: true, value, diagnostics }`
- failure: `{ ok: false, error }`
- error fields: stable `code`, operation/stage, safe message, optional bounded field path, and
  optional expected template kind
- no vendor exception, stack, class instance, regex match object, or raw internal buffer crosses the
  public boundary

Initial stable error codes cover `INPUT_TOO_LARGE`, `EMPTY_INPUT`, `INVALID_CHARACTER_SET`,
`INVALID_CHAT_WRAPPER`, `UNSAFE_TEMPLATE_NAME`, `WRONG_TEMPLATE_KIND`, `UNSUPPORTED_VERSION`,
`MALFORMED_TEMPLATE`, `INVALID_DECODED_SHAPE`, `INVALID_FIELD_VALUE`, `SOURCE_CHANGED`,
`UNSUPPORTED_BY_CODEC`, `LOSSY_ENCODE`, and `DEPENDENCY_FAILURE`. Expected malformed input must not
throw; programmer-contract failures may throw only in private assertions and must be converted before
returning.

Messages are adapter-owned and stable enough for tests but are not final UI copy. Vendor message
text may be mapped through a finite allowlist for diagnostics; unknown messages become a bounded
`DEPENDENCY_FAILURE`, never a raw stack or unlimited echo.

### Template Source, Fidelity, And Canonicalization

Each decoded document carries a `TemplateSourceEnvelope` with:

- input kind (`bare` or `chat-code`), expected/decoded template kind, and supported format version
- bounded original input and original bare code token
- `templateName: string | null`, where `null` means no wrapper and `""` means an empty wrapper name
- normalized code used for dependency input when harmless base64 padding or accepted space-for-plus
  normalization applies
- a stable canonical fingerprint of the adapter's decoded semantic facts
- a fidelity classification and bounded diagnostics about harmless normalization or dependency
  limitations

The fingerprint is an edit detector, not a cryptographic trust mechanism. It is recomputed over a
schema-owned projection with stable key/array ordering before `preserve-source` export. Wrapper/name
changes are outside the template-facts fingerprint, so a user may rename a template without forcing
the bitstream through a lossy encoder.

Canonical encode compares normalized semantic projections, not object identity, dependency object
order, base64 padding, or wrapper text. Skill attribute pairs compare by explicit adapter ordering;
equipment items compare by slot and modifier order. Any value the dependency clamps, omits,
reorders in a semantically significant way, overwrites, or invents causes `LOSSY_ENCODE`. The adapter
never returns a best-effort code after this failure.

### Skill Template Contract And Catalog Resolution

`SkillTemplateDocument` contains only template facts:

- primary and secondary `TemplateProfessionId`
- an ordered array of `{ attributeId: TemplateAttributeId, rank }` records
- an exact eight-entry tuple whose values are `TemplateSkillId`, including the encoded zero sentinel
- source envelope and schema version

Ranks and decoded IDs are preserved as finite non-negative integers within the format values surfaced
by the dependency; they are not clamped to catalog or game-rule expectations on import. The adapter
rejects malformed JavaScript shapes such as sparse arrays, inherited objects, accessors, non-finite
numbers, fractions, unexpected keys where strictness is required, or anything outside safe integer
bounds.

`resolveSkillTemplateDocument` accepts a `ProfessionAttributeCatalog` and `SkillCatalog` supplied by
the caller. It returns a parallel view containing the existing profession/attribute/skill lookup
outcomes plus an explicit `empty` skill-slot outcome for zero. It does not infer `GameMode`, choose a
PvE/PvP split, check attribute ownership, apply skill rules, create authored document IDs, or rewrite
template IDs as catalog IDs. A later import/application service can choose how to construct a
persisted `Build` after EPIC-06 defines warnings for unresolved references.

### Equipment Template Contract

`EquipmentTemplateDocument` is deliberately separate from the existing domain
`EquipmentTemplate`. It contains an ordered, unique-by-slot collection of raw facts:

- `TemplateEquipmentSlotId`
- `TemplateEquipmentItemId`
- `TemplateEquipmentColorId`
- ordered `TemplateEquipmentModifierId` values
- source envelope and schema version

The decoder preserves numeric facts returned by the package after strict shape validation and does
not join them to catalog IDs. The encoder rejects duplicate slots, too many items/modifiers,
non-integers, unsafe ranges, and any item/slot/color/modifier combination the pinned package cannot
reproduce. Because the dependency derives slots from a built-in item map and filters values, the
decode-after-encode comparison is mandatory even when prevalidation succeeds.

An unchanged imported equipment code can always use `preserve-source` if its fingerprint matches.
Fresh or edited export is supported only for the subset proven by the pinned encoder. This makes the
current limitation explicit while leaving EPIC-13 free to add semantic records and updated ID
crosswalks without migrating the raw compatibility envelope.

### Chat-Code Grammar

The local wrapper parser recognizes either a bare code or exactly one bracketed form
`[template name;code]`. It preserves an empty name and does not trim or case-fold name content beyond
documented outer-input handling. Formatting rejects semicolons, brackets, carriage returns, line
feeds, NUL/control characters, and over-limit names because the Guild Wars wrapper has no escape
mechanism for them. A missing separator or code is invalid; an empty name is not.

Base64 normalization is narrow and observable. ASCII outer whitespace may be removed. Dependency-
accepted padding and space-for-plus input may be normalized for decoding while the original bounded
token remains available for exact-source export. Other Unicode whitespace, embedded controls,
multiple wrappers, trailing text, or ambiguous bracket structure is rejected.

The minimal header discriminator validates skill versus equipment and known old/new header/version
forms before calling the matching class. It is covered by fixed vectors and cannot decode template
body fields. This closes the dependency's type-confusion surface without creating a competing codec.

### Dependency Qualification And Runtime Matrix

BW-0501 records an adoption matrix for the exact published artifact and public entry point:

| Capability | Required Evidence | Failure Consequence |
| --- | --- | --- |
| Module loading | ESM TypeScript build, Node test runtime at repository minimum, Vite production build | Mandatory failure blocks adoption; no deep import workaround. |
| Skill decode/encode | Known vectors, old/new headers when fixtures exist, zero and maximum surfaced fields, semantic round-trip | Mandatory failure blocks SPRINT-006 pending dependency/fork amendment. |
| Equipment decode/encode | Known vectors, unordered returned slot keys, empty/partial/full sets, semantic round-trip | Mandatory failure blocks SPRINT-006 pending dependency/fork amendment. |
| Invalid input | Empty, invalid alphabet, wrong kind/version, short/truncated, oversized, and dependency-thrown cases | Adapter must convert every observed failure into a typed result. |
| Normalization | Profession, attribute, rank, skill ID, item, slot, color, modifier, ordering, padding, and wrapper probes | Every silent change becomes a documented adapter precondition or postcondition failure. |
| Browser safety | No network/dynamic load, successful production bundle, representative browser-like Vitest execution | Mandatory skill/equipment path must pass without global mutation. |
| paw-ned2 | UTF-8/Windows-1252 behavior, modern typed-array APIs, malformed lengths, 12-build cap, nested codes, text limits | Failure defers team support to EPIC-17 without blocking mandatory formats. |

The project records the installed dependency version and lockfile integrity. The local declaration is
version-specific and intentionally incomplete. A future package upgrade must update the matrix and
run the entire compatibility corpus; semver alone is not evidence of behavioral compatibility.

### Fixture And Oracle Strategy

Fixture cases are data-driven and include a stable case ID, format/kind, source classification,
source URL or package/version reference where applicable, rights basis, input, expected decoded
projection or error code, expected fidelity, and canonical output only when bytes are intentionally
stable.

The suite uses three oracles:

1. exact expected fields for small hand-authored synthetic vectors and pinned package examples;
2. adapter decode-after-encode semantic equality for accepted canonical output;
3. exact original input for unchanged `preserve-source` output.

Catalog-resolution tests use the committed synthetic EPIC-03/04 fixture catalogs. One bounded
integration test may load the promoted runtime catalog JSON directly to prove current known,
dispositioned, and unknown outcomes, but production source modules receive catalogs through
arguments and never import adjacent manifests or QA reports.

Every regression case found during implementation is minimized before commit. Large community codes,
descriptions, player names, or team dumps are not committed merely because the package can parse
them.

### paw-ned2 Decision Gate

The Phase 5 timebox begins only after skill, equipment, wrapper, and error gates pass. A raw
`PwndTeamTemplateDocument` may ship if it can preserve header charset, up to 12 ordered members,
nested skill/equipment/weapon-set code strings, template name, description, player name, five
attribute-bonus values, and the dependency's supported flags under the same source/canonical
fidelity model.

Shipping paw-ned2 additionally requires:

- current Node-minimum and Vite/browser execution without mutating `Uint8Array`, encoding globals,
  or other shared prototypes;
- bounded parsing that cannot produce more than 12 builds or over-limit nested/text fields;
- fatal and typed handling of invalid charset, breaking-change headers, malformed field lengths, bad
  nested base64, and unsupported flags;
- no conversion to `PartyBuild`, no hero/role inference, and no consumable legality rules;
- a small attributable fixture plus synthetic boundary cases; and
- canonical decode-after-encode equality for every surfaced field.

If any condition fails, BW-0505 documents the exact result, updates EPIC-05 as assessed/deferred, and
creates an EPIC-17 follow-up. No partial team API, unsafe polyfill, hidden field loss, or unbounded
fixture is merged to claim feasibility.

## Implementation

### Phase 1: BW-0501 Pinned Dependency Qualification And Adoption Gate (~15%)

**Files:**

- `package.json`
- `package-lock.json`
- `test/template-compatibility/package-evaluation.test.ts`
- `test/fixtures/template-compatibility/`
- `work/tickets/05-template-compatibility/BW-0501-pinned-dependency-qualification.md`

**Tasks:**

- [ ] Confirm SPRINT-001 through SPRINT-005, EPIC-03, and EPIC-04 remain complete and that the
      promoted profession/attribute and skill catalogs are present with passing recorded release
      state.
- [ ] Inspect the exact npm artifact, license, public entry point, CJS/ES/browser fields, transitive
      dependencies, documented runtime requirements, absence/presence of declarations, and relevant
      source methods. Record the artifact version and lockfile integrity; do not vendor it.
- [ ] Install exactly `@buildwars/gw-templates@1.1.1` as a runtime dependency and verify only its
      public package entry point is needed. Do not use a caret range or deep `dist`, `es6`, or `lib`
      imports.
- [ ] Build the qualification matrix for module loading, skill/equipment decode and encode, chat
      helpers, exception shapes, base64 handling, old/new headers, state reuse, property ordering,
      and runtime globals.
- [ ] Add focused probes for known skill/equipment examples and normalization boundaries: profession
      zero/unknown, duplicate/foreign/primary-only attributes, ranks above ordinary authored limits,
      skill IDs at zero/known/future boundaries, more/fewer than eight caller slots, unknown items,
      slot collisions, colors, modifier bounds, and empty/full equipment sets.
- [ ] Prove representative skill/equipment operations under the repository's Node.js minimum and
      Vite build target. Record the package's documented Node.js `>=24` expectation and which exact
      APIs are exercised by each codec.
- [ ] Test wrong-kind input against both vendor classes, truncated/short inputs, invalid headers and
      alphabets, padding/space normalization, malformed chat wrappers, and repeated operations on
      fresh versus reused instances.
- [ ] Decide adoption at the phase gate. Mandatory failures block the sprint for an explicit
      dependency upgrade, upstream fix, audited fork, or scope amendment; do not begin a full local
      bitstream parser as an incidental fallback.

**Verification:**

- `npm ls @buildwars/gw-templates windows-1252`
- `npm run test:run -- test/template-compatibility/package-evaluation.test.ts`
- `npm run typecheck`
- `npm run build`

**Phase gate:** The exact package artifact and public import path pass mandatory skill/equipment
qualification at the repository runtime floor, and every observed normalization or failure behavior
has an explicit adapter policy. Otherwise SPRINT-006 is blocked before public contracts depend on an
unsafe assumption.

### Phase 2: BW-0502 Contracts, Safe Input Boundary, And Vendor Adapter (~18%)

**Files:**

- `src/domain/ids.ts`
- `src/domain/template.ts`
- `src/domain/index.ts`
- `src/template-compatibility/vendor/gw-templates.d.ts`
- `src/template-compatibility/gw-templates-adapter.ts`
- `src/template-compatibility/chat-code.ts`
- `src/template-compatibility/fingerprint.ts`
- `src/template-compatibility/index.ts`
- `tsconfig.template-compatibility.json`
- `tsconfig.json`
- `tsconfig.domain.json`
- `package.json`
- `eslint.config.js`
- `test/domain/contracts.test.ts`
- `test/template-compatibility/chat-code.test.ts`
- `test/template-compatibility/error-boundary.test.ts`
- `work/tickets/05-template-compatibility/BW-0502-template-contracts-and-safe-adapter.md`

**Tasks:**

- [ ] Add branded template equipment item, modifier, color, and slot IDs while preserving the
      existing profession, attribute, skill, and catalog ID distinctions.
- [ ] Define JSON-compatible source envelope, skill/equipment document, encode/decode result,
      diagnostic, fidelity, and stable error contracts. Keep dependency instances, errors, buffers,
      maps, and class types private.
- [ ] Create a dedicated framework-neutral `src/template-compatibility` boundary that imports domain
      contracts but is not imported by `src/domain`; enforce no React, app, storage, network, DOM,
      data-script, or audit-artifact imports through TypeScript and ESLint configuration.
- [ ] Write a version-specific ambient declaration containing only the pinned constructors and
      methods the adapter calls. Validate returned values at runtime rather than trusting the
      declaration.
- [ ] Implement bounded ASCII/base64 prevalidation, outer-input normalization, safe chat-code
      parse/format behavior, and the audited header kind/version discriminator. Test bare codes,
      empty names, missing names/codes, padding, spaces, delimiters, controls, Unicode edge cases,
      wrong kinds, and caps.
- [ ] Instantiate a fresh vendor object per operation, catch all dependency exceptions, validate
      own/plain decoded shapes and finite safe integers, and map failures to stable bounded errors.
- [ ] Implement schema-owned semantic projections and stable fingerprints for edit detection. Prove
      fingerprints are insensitive only to explicitly non-semantic object ordering and wrapper/name
      changes.
- [ ] Implement shared `preserve-source` and `canonical` orchestration: source fingerprint check,
      dependency encode, dependency decode, normalized deep comparison, fidelity result, and no-code
      return on mismatch.
- [ ] Add compile-time and runtime boundary tests proving public exports remain plain data and no
      vendor class or thrown dependency error escapes.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm run test:run -- test/domain/contracts.test.ts test/template-compatibility/chat-code.test.ts test/template-compatibility/error-boundary.test.ts`
- `npm run build`

**Phase gate:** Untrusted input reaches the pinned dependency only through bounded kind-correct calls;
all public outcomes are typed plain data, and the source/canonical fidelity machinery rejects any
unproven transformation.

### Phase 3: BW-0503 Skill Template Import, Resolution, And Export (~23%)

**Files:**

- `src/domain/template.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/index.ts`
- `src/template-compatibility/skill-template.ts`
- `src/template-compatibility/gw-templates-adapter.ts`
- `src/template-compatibility/index.ts`
- `test/template-compatibility/skill-template.test.ts`
- `test/template-compatibility/catalog-resolution.test.ts`
- `test/fixtures/template-compatibility/skill-cases.json`
- `test/fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json`
- `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json`
- `work/tickets/05-template-compatibility/BW-0503-skill-template-compatibility.md`

**Tasks:**

- [ ] Decode supported skill codes into primary/secondary template professions, explicit ordered
      attribute/rank records, exactly eight raw template skill IDs, and the source envelope. Reject
      invalid decoded arity or shape instead of padding adapter output silently.
- [ ] Preserve profession zero, attribute zero, empty skill ID zero, non-contiguous IDs, unknown
      authored values, dispositioned skill IDs, dependency-surfaced high ranks, and attributes that
      later rule work may consider invalid.
- [ ] Add a pure catalog resolver using existing EPIC-03/04 outcome semantics. Represent empty skill
      slots explicitly and keep the template document byte/fingerprint-identical before and after
      resolution.
- [ ] Implement exact-source export for unchanged documents and validated bare/chat formatting with
      renamed, empty, or preserved names.
- [ ] Implement canonical export for new/edited skill documents with finite/range/arity checks,
      dependency invocation, re-decode semantic equality, and `LOSSY_ENCODE` for every dropped,
      clamped, reordered, or replaced fact.
- [ ] Do not use the dependency's normalization as profession, attribute, rank, or skill legality.
      Do not create a `Build`, authored document ID, catalog version, or inferred game mode.
- [ ] Add cases for known real/package examples, synthetic all-zero and max-boundary templates,
      unknown/dispositioned skills, profession `0`, empty secondary, attribute `0`, ordinary and high
      ranks, field-order changes, wrong equipment input, malformed codes, wrapper names, exact
      passthrough, semantic-only canonicalization, source-edited detection, and lossy refusal.
- [ ] Cross-check known IDs against the synthetic EPIC-03/04 catalogs and a bounded promoted-catalog
      integration case without importing manifest/QA files into runtime code.

**Verification:**

- `npm run test:run -- test/template-compatibility/skill-template.test.ts test/template-compatibility/catalog-resolution.test.ts test/domain/profession-attribute-catalog.test.ts test/domain/skill-catalog.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

**Phase gate:** Known skill vectors decode correctly, unchanged unknown-ID inputs export exactly,
accepted canonical exports re-decode to all intended facts, and any dependency-induced loss returns a
typed failure with no output code.

### Phase 4: BW-0504 Equipment Templates And Cross-Format Wrappers (~18%)

**Files:**

- `src/domain/template.ts`
- `src/domain/index.ts`
- `src/template-compatibility/equipment-template.ts`
- `src/template-compatibility/chat-code.ts`
- `src/template-compatibility/gw-templates-adapter.ts`
- `src/template-compatibility/index.ts`
- `test/template-compatibility/equipment-template.test.ts`
- `test/template-compatibility/chat-code.test.ts`
- `test/fixtures/template-compatibility/equipment-cases.json`
- `work/tickets/05-template-compatibility/BW-0504-equipment-template-compatibility.md`

**Tasks:**

- [ ] Decode supported equipment codes into strict raw item records with slot, item ID, color ID,
      ordered modifier IDs, and source envelope; normalize dependency object-key enumeration into one
      documented deterministic item order.
- [ ] Preserve package-decoded numeric facts without mapping them onto current armor/weapon domain
      models or inventing catalog identities. Validate unique slots, item/modifier counts, finite safe
      integers, and format bounds.
- [ ] Implement exact-source export for unchanged equipment documents, including unknown or
      dependency-nonencodable facts surfaced by decode.
- [ ] Implement canonical export for fresh/edited documents through a fresh vendor instance. Reject
      duplicate slots, overwrites, hardcoded item-to-slot disagreement, filtered modifiers, invalid
      colors, unsupported item IDs, or any semantic mismatch after re-decode.
- [ ] Apply the same bare/chat parser and formatter used for skills. Prove the header discriminator
      rejects cross-kind calls even if the vendor decoder would otherwise return an object.
- [ ] Add known/package and synthetic cases for empty, one-item, armor, main/off-hand, full seven-slot,
      unordered returned keys, default/non-default colors, zero/one/three modifiers, slot collision,
      unknown item, invalid modifier/color, oversized input, wrong skill input, exact passthrough,
      equivalent canonical output, and lossy refusal.
- [ ] Document the raw-only equipment boundary and the EPIC-13 migration path: future catalog joins
      wrap these IDs in a resolved view and do not replace the source template document.

**Verification:**

- `npm run test:run -- test/template-compatibility/equipment-template.test.ts test/template-compatibility/chat-code.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

**Phase gate:** Known equipment vectors round-trip semantically, unchanged inputs can re-emit exactly,
unsupported edits fail without output, and no current semantic equipment type or incomplete catalog
is misrepresented as authoritative template data.

### Phase 5: BW-0505 paw-ned2 Team Format Feasibility And Disposition (~10%)

**Files:**

- `src/domain/template.ts` only if the ship gate passes
- `src/template-compatibility/pwnd-template.ts` only if the ship gate passes
- `src/template-compatibility/vendor/gw-templates.d.ts` only if the ship gate passes
- `src/template-compatibility/index.ts` only if the ship gate passes
- `test/template-compatibility/pwnd-template.test.ts`
- `test/fixtures/template-compatibility/pwnd-cases.json`
- `work/tickets/05-template-compatibility/BW-0505-pawned2-feasibility.md`
- `work/tickets/17-party-and-hero-builder/BW-1701-pawned2-template-integration.md` only if deferred
- `work/tickets/17-party-and-hero-builder/EPIC.md` only if deferred scope needs clarification

**Tasks:**

- [ ] Timebox the assessment after mandatory formats pass. Inventory the package's header flags,
      charset modes, supported fields/flags, nested code handling, build/weapon-set limits, public
      methods, runtime globals, and silent normalization.
- [ ] Test the exact package example or a rights-compatible minimized equivalent plus synthetic UTF-8,
      Windows-1252, empty-field, maximum-field, 12-build, breaking-header, invalid-charset,
      malformed-length, oversized, and nested wrong-code cases.
- [ ] Prove Node-minimum and Vite/browser behavior without patching globals or prototypes. Verify
      malformed data terminates within bounded work and cannot produce over-limit arrays or strings.
- [ ] If every ship gate passes, add a raw JSON-compatible team-template envelope and the same
      exact-source/canonical postcondition model. Preserve ordered members and all surfaced fields;
      do not map to `PartyBuild` or interpret roles, heroes, consumables, or legality.
- [ ] If any ship gate fails, do not expose a partial API. Record exact evidence, consequence, and a
      recommended dependency/fork/domain path in BW-0505; create BW-1701 linked to EPIC-17 and mark
      paw-ned2 assessed/deferred in EPIC-05 closeout.
- [ ] In either outcome, ensure team fixtures and test data are bounded, source-classified, and free
      of unnecessary player/community prose.

**Verification:**

- `npm run test:run -- test/template-compatibility/pwnd-template.test.ts`
- `npm run typecheck`
- `npm run build`
- Manual BW-0505 ship/defer gate review against every criterion in the Architecture section

**Phase gate:** paw-ned2 is either a fully bounded raw codec satisfying the common fidelity/error
contract or an explicit EPIC-17 deferral with a concrete follow-up ticket. Ambiguous or partial
support cannot pass.

### Phase 6: BW-0506 Integrated Fixtures, Documentation, Verification, And Closeout (~16%)

**Files:**

- `test/template-compatibility/compatibility-matrix.test.ts`
- `test/fixtures/template-compatibility/README.md`
- `test/fixtures/template-compatibility/*.json`
- `README.md`
- `compendium/template-compatibility.md`
- `compendium/README.md`
- `work/tickets/05-template-compatibility/EPIC.md`
- `work/tickets/05-template-compatibility/BW-0501-pinned-dependency-qualification.md`
- `work/tickets/05-template-compatibility/BW-0502-template-contracts-and-safe-adapter.md`
- `work/tickets/05-template-compatibility/BW-0503-skill-template-compatibility.md`
- `work/tickets/05-template-compatibility/BW-0504-equipment-template-compatibility.md`
- `work/tickets/05-template-compatibility/BW-0505-pawned2-feasibility.md`
- `work/tickets/05-template-compatibility/BW-0506-verification-and-closeout.md`
- `work/sprints/SPRINT-006.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Consolidate data-driven skill, equipment, wrapper, error, fidelity, and optional/deferred team
      cases. Give every case stable identity, expected semantics, source/rights metadata, and a
      documented reason for inclusion.
- [ ] Add mutation tests proving every template semantic field participates in its fingerprint and
      canonical equality projection, while wrapper/name and irrelevant object insertion order behave
      exactly as documented.
- [ ] Add regression tests for dependency coercion/drop behaviors discovered in Phase 1 and prove no
      accepted path returns a code after a semantic mismatch.
- [ ] Run the complete matrix twice in clean test processes and require identical results without
      network access, filesystem-order dependence, locale dependence, time dependence, or shared
      codec state.
- [ ] Document import/export APIs, raw-versus-resolved ownership, exact-source and semantic-equivalent
      guarantees, typed errors, input caps, dependency upgrade procedure, catalog injection, raw
      equipment limitations, chat-name grammar, and paw-ned2 disposition.
- [ ] Record the durable dependency rationale and upgrade gate in the compendium, including the
      package/runtime matrix and the rule that no vendor object or silent normalization crosses the
      adapter.
- [ ] Inspect dependency tree/license, bundled output, fixture provenance, worktree paths, logs, and
      fixture size. Ensure no tarballs, extracted vendor source, raw community collections, absolute
      machine paths, or transient evaluation artifacts were added.
- [ ] Run the canonical repository verification and review any bundle-size change. A material codec
      bundle regression requires disposition before closeout rather than an unexplained baseline
      update.
- [ ] Mark BW-0501 through BW-0506 complete only after their gates pass. Mark EPIC-05, SPRINT-006,
      and the ledger complete only when mandatory skill/equipment/chat/error DoD is satisfied and
      paw-ned2 has one unambiguous ship/defer disposition.
- [ ] Do not create a commit; the outer ticket-burn executor owns commit behavior.

**Verification:**

- `npm ci`
- `npm ls @buildwars/gw-templates windows-1252`
- `npm run test:run -- test/template-compatibility`
- `npm run verify`
- `git status --short`
- Manual source/license, public API, runtime-boundary, bundle-diff, ticket, sprint, and ledger review

**Phase gate:** The offline compatibility matrix, documentation, tickets, dependency lock, sprint,
and ledger agree on supported formats, exact guarantees, typed limitations, security caps, runtime
floor, and paw-ned2 disposition; canonical verification passes with no `src/app` changes.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `package.json` | Modify | Add the exact runtime dependency and include the template-compatibility typecheck in canonical scripts. |
| `package-lock.json` | Modify | Lock the exact package, transitive dependency, registry integrity, and resolved tree. |
| `tsconfig.template-compatibility.json` | Create | Typecheck the framework-neutral adapter as its own boundary without React/application assumptions. |
| `tsconfig.json` | Modify | Register the adapter TypeScript project. |
| `tsconfig.domain.json` | Modify only if needed | Include public template declarations while retaining the no-DOM domain boundary. |
| `eslint.config.js` | Modify | Prevent template compatibility from importing app, React, storage, network, data scripts, or audit artifacts. |
| `src/domain/ids.ts` | Modify | Add distinct raw equipment template ID brands. |
| `src/domain/template.ts` | Create | Define plain source, skill, equipment, resolution, fidelity, diagnostic, and error contracts; add team contracts only if gated in. |
| `src/domain/catalog-lookup.ts` | Modify only if needed | Add reusable explicit empty-slot/template resolution outcomes without changing existing catalog semantics. |
| `src/domain/index.ts` | Modify | Export public template contracts and ID constructors/types, but not vendor classes. |
| `src/template-compatibility/vendor/gw-templates.d.ts` | Create | Declare only the pinned public vendor surface used locally. |
| `src/template-compatibility/gw-templates-adapter.ts` | Create | Isolate construction, calls, exception mapping, shape checks, and encode postconditions. |
| `src/template-compatibility/chat-code.ts` | Create | Parse and safely format bounded bare/chat input while preserving names and wrapper intent. |
| `src/template-compatibility/fingerprint.ts` | Create | Build stable semantic projections and edit-detection fingerprints. |
| `src/template-compatibility/skill-template.ts` | Create | Decode, resolve, preserve, and safely encode skill template documents. |
| `src/template-compatibility/equipment-template.ts` | Create | Decode, preserve, and safely encode raw equipment template documents. |
| `src/template-compatibility/pwnd-template.ts` | Create only if gated in | Provide bounded raw paw-ned2 support without taking over party-domain ownership. |
| `src/template-compatibility/index.ts` | Create | Expose the local codec API while hiding vendor implementations. |
| `test/domain/contracts.test.ts` | Modify | Prove new public documents remain plain JSON and ID namespaces stay distinct. |
| `test/template-compatibility/package-evaluation.test.ts` | Create | Pin observed vendor/runtime behavior and the adoption matrix. |
| `test/template-compatibility/chat-code.test.ts` | Create | Cover wrapper/name grammar, normalization, kind dispatch, and caps. |
| `test/template-compatibility/error-boundary.test.ts` | Create | Prove malformed input returns stable errors without exception leakage. |
| `test/template-compatibility/skill-template.test.ts` | Create | Cover skill decode, exact-source export, canonical equality, unknown IDs, and lossy refusal. |
| `test/template-compatibility/catalog-resolution.test.ts` | Create | Cross-check pure EPIC-03/04 known/none/reserved/dispositioned/unknown outcomes. |
| `test/template-compatibility/equipment-template.test.ts` | Create | Cover raw equipment facts, exact/canonical fidelity, ordering, and dependency limitations. |
| `test/template-compatibility/pwnd-template.test.ts` | Create | Record the team ship/defer matrix and support tests if gated in. |
| `test/template-compatibility/compatibility-matrix.test.ts` | Create | Run all versioned fixture cases through common offline assertions. |
| `test/fixtures/template-compatibility/` | Create | Store minimized synthetic and attributed MIT compatibility vectors plus metadata. |
| `README.md` | Modify | Document supported template operations, commands, boundaries, and limitations. |
| `compendium/template-compatibility.md` | Create | Record durable adapter, fidelity, dependency-upgrade, equipment, and paw-ned2 decisions. |
| `compendium/README.md` | Modify | Index the template compatibility note. |
| `work/tickets/05-template-compatibility/*.md` | Create/update during execution | Track BW-0501 through BW-0506 evidence and completion. |
| `work/tickets/17-party-and-hero-builder/BW-1701-pawned2-template-integration.md` | Create only if deferred | Preserve a concrete team-format follow-up under the owning later epic. |
| `work/tickets/05-template-compatibility/EPIC.md` | Modify during closeout | Record delivered mandatory scope and the final team disposition. |
| `work/sprints/SPRINT-006.md` | Create/update during execution | Track approved sprint execution and checked gates. |
| `work/sprints/ledger.tsv` | Modify during closeout | Record SPRINT-006 lifecycle state. |

`src/app/**`, generated catalog JSON, generated manifests, QA reports, data-ingestion scripts, and
source snapshots are not modified by this sprint.

## Definition of Done

### Dependency And Boundary

- [ ] `@buildwars/gw-templates` is pinned exactly at `1.1.1`; the lockfile integrity, MIT license,
      public import path, transitive dependency, runtime requirements, and bundle behavior are
      reviewed and documented.
- [ ] Mandatory skill/equipment operations pass at the repository's declared Node.js minimum and in
      the Vite production build, or the sprint remains blocked under an explicit amendment rather
      than silently raising the runtime floor.
- [ ] Only the narrow local adapter imports the vendor package. No public API returns vendor classes,
      objects, errors, buffers, or dependency-specific field names.
- [ ] `src/domain` and `src/template-compatibility` remain framework-neutral and import no React,
      DOM/browser APIs, storage, network clients, app modules, data scripts, manifests, QA reports,
      or snapshots.
- [ ] No full local skill/equipment bitstream parser, vendored package source, deep package import,
      CDN load, or runtime network dependency is introduced.

### Skill Templates

- [ ] Supported skill codes decode into primary/secondary template professions, explicit
      attribute/rank records, exactly eight template skill IDs, source/wrapper facts, and a semantic
      fingerprint.
- [ ] Profession `0`, attribute `0`, skill slot `0`, known, reserved, unsupported, dispositioned,
      unknown, non-contiguous, and future dependency-surfaced IDs remain distinguishable and are not
      rewritten into catalog namespaces.
- [ ] Catalog resolution is pure, caller-supplied, and non-mutating; runtime source code does not
      import generated manifest/QA/snapshot artifacts.
- [ ] Unchanged decoded skill documents preserve the original code exactly. Renaming or rewrapping an
      unchanged template does not require a dependency re-encode.
- [ ] Every accepted canonical skill export re-decodes to the intended professions, attributes,
      ranks, and all eight slots. Any coercion, omission, clamp, replacement, or semantic reorder
      returns `LOSSY_ENCODE` and no code.
- [ ] Skill compatibility does not create persisted `Build` objects, infer game mode, or enforce
      EPIC-06 legality.

### Equipment And Chat Codes

- [ ] Supported equipment codes decode into unique raw slot/item/color/modifier facts with distinct
      template ID types and deterministic ordering.
- [ ] Unchanged decoded equipment documents preserve the original code exactly, including inputs the
      dependency cannot safely regenerate from facts.
- [ ] Every accepted canonical equipment export re-decodes to the intended item, slot, color, and
      ordered modifiers; built-in map/filter/overwrite behavior cannot silently lose data.
- [ ] Equipment support remains raw and does not fabricate joins to incomplete armor, rune,
      insignia, weapon, modifier, or dye catalogs or overwrite the existing semantic equipment model.
- [ ] Bare and bracketed chat codes parse and emit safely for both mandatory kinds. Wrapper choice and
      empty/non-empty names are preserved; missing/ambiguous/unsafe/oversized wrappers fail with typed
      errors.
- [ ] The header discriminator prevents skill/equipment type confusion and rejects unsupported
      versions before dependency body decoding.

### Errors, Fidelity, And Security

- [ ] All expected malformed/hostile input returns a stable discriminated failure. Vendor messages,
      exceptions, stacks, internal buffers, and unbounded input are not exposed.
- [ ] Input, name, collection, nested-code, description, and optional team limits are code-owned,
      tested at boundaries, and cannot be raised by callers.
- [ ] Public decoded values are strict plain JSON-compatible data with finite safe integers, exact
      tuple/count invariants, no prototypes/accessors, and no executable markup.
- [ ] `preserve-source` verifies the current semantic fingerprint; `canonical` verifies re-decode
      equality. Neither mode returns a code when its proof fails.
- [ ] A dependency upgrade is gated by the complete compatibility corpus, runtime matrix, local
      declaration review, normalization diff, and bundle review rather than accepted by semver alone.

### Fixtures And paw-ned2

- [ ] Fixture cases are minimized, stable, offline, source-classified, and either synthetic or
      attributable to a compatible source such as the pinned package's MIT documentation.
- [ ] Known skill and equipment vectors have explicit decoded expectations; invalid vectors have
      explicit error expectations; canonical vectors assert semantic rather than accidental byte
      equality unless bytes are intentionally locked.
- [ ] Repeated compatibility-matrix runs are deterministic and independent of network, time, locale,
      filesystem order, and shared codec state.
- [ ] paw-ned2 has exactly one final disposition: a bounded raw codec passing every ship gate, or an
      evidence-backed EPIC-17 deferral with BW-1701. Partial/unsafe support is not exported.
- [ ] If paw-ned2 ships, it supports no more than 12 ordered members, preserves all surfaced raw
      fields and charset facts, rejects malformed/oversized inputs, and does not map to `PartyBuild`
      or interpret team legality.

### Verification And Closeout

- [ ] `npm ci`, focused template tests, `npm run verify`, and the Vite production build pass without
      live network access after dependencies are installed.
- [ ] Bundle output contains the intended pinned codec only; material size or platform compatibility
      changes have an explicit disposition.
- [ ] No tarball, extracted dependency source, live/community dump, large prose fixture, transient
      log, absolute local path, or unrelated generated artifact is tracked.
- [ ] README, compendium, tickets, EPIC-05, SPRINT-006, ledger, package lock, public exports, and tests
      agree on supported formats, runtime floor, fidelity guarantees, limits, and paw-ned2 status.
- [ ] BW-0501 through BW-0506, EPIC-05, SPRINT-006, and the ledger are marked complete only after all
      mandatory gates and the team disposition gate pass.
- [ ] No commit is created by the sprint executor.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The package's documented Node.js floor exceeds the repository floor | High | High | Prove each mandatory path under Node `22.11.0` and Vite in Phase 1; block for explicit runtime/dependency amendment instead of silently changing engines. |
| Untyped vendor output drifts or has an unexpected shape | Medium | High | Version-specific narrow declaration, exact pin, strict runtime validation, no vendor shape in public contracts, and full corpus on upgrade. |
| Vendor encoders silently clamp or drop authored facts | High | High | Prevalidation plus mandatory decode-after-encode semantic equality; return `LOSSY_ENCODE` with no output. |
| Exact code and semantically equivalent code are conflated | High | Medium | Separate `exact-source` and `semantic-equivalent` fidelity, preserve original input, and assert bytes only where explicitly stable. |
| Unknown IDs cannot be regenerated by the vendor | High | High | Preserve unchanged source exactly; keep raw IDs separate; reject edited canonical export when the dependency cannot reproduce them. |
| Skill/equipment type confusion yields plausible junk | Medium | High | Minimal audited header kind/version discriminator and cross-kind fixtures before body decoding. |
| The vendor accepts truncated or malformed data too permissively | Medium | High | Character/length/header prechecks, strict decoded-shape invariants, canonical probes, regression fixtures, and block unsupported ambiguity rather than inventing a parser. |
| Raw imports are prematurely forced into `Build`/equipment models | Medium | High | Dedicated template documents and separate resolved views; defer persistence conversion and legality to EPIC-06/08/13. |
| Equipment's hardcoded item map becomes stale under Reforged | High | High | Raw exact-source preservation, postconditioned edited exports, no semantic catalog claim, and upgrade/crosswalk ownership in EPIC-13. |
| Wrapper names create delimiter or injection problems | Medium | Medium | Local finite grammar, control/delimiter rejection on emit, plain-text contracts, bounded lengths, and no HTML interpretation. |
| Stateful vendor instances leak data between operations | Medium | Medium | Construct one codec instance per call and include repeat/interleaving tests. |
| paw-ned2 expands into party, charset, and consumable scope | High | High | Run only after mandatory formats, enforce a 10% timebox and ship gates, keep raw-only, or defer concretely to EPIC-17. |
| paw-ned2 malformed lengths cause excessive work or memory | Medium | High | Hard input/member/text/nested limits, termination tests, post-decode bounds, and no API if the dependency cannot be bounded safely. |
| Fixture provenance becomes unclear or bloated | Medium | Medium | Stable metadata per case, synthetic defaults, minimal MIT examples, size review, and no community collections/prose. |
| Package upgrade changes behavior despite compatible semver | Medium | High | Exact pin and explicit upgrade matrix covering semantics, errors, runtime APIs, declarations, transitive dependencies, and bundle diff. |
| The new layer erodes the domain/app boundary | Low | High | One-way dependency graph, dedicated TypeScript project, ESLint import restrictions, and boundary tests. |

## Security

- Treat codes, wrappers, names, padding, header bits, decoded objects, nested team codes, charsets,
  player names, descriptions, package exceptions, fixtures, and catalog inputs as untrusted data.
- Enforce code-owned byte/code-point, collection, item, modifier, member, nested-code, and text limits
  before expensive work where possible and immediately after dependency decode where not.
- Accept only the documented bounded base64 alphabet/normalizations and explicit wrapper grammar.
  Reject NUL, control characters, ambiguous brackets/delimiters, unsupported Unicode whitespace, and
  trailing payloads.
- Validate template kind and supported version before invoking the matching vendor class. The header
  helper may discriminate only; it must not grow into an unreviewed body parser.
- Use fresh codec instances. Do not evaluate strings, invoke dynamic imports, execute source-provided
  commands, interpret HTML, create URLs from names, or use decoded values as filesystem paths.
- Catch dependency exceptions at the boundary and emit adapter-owned bounded messages. Never expose
  stacks, local paths, package internals, raw binary buffers, or unlimited input echoes.
- Validate decoded values as own/plain data with finite safe integers and bounded arrays/strings.
  Copy accepted data into new Build Wars objects rather than returning dependency-owned references.
- Never use dependency normalization as sanitization or game-rule validation. Prove canonical output
  by re-decode equality and return no code after a mismatch.
- Pin the dependency exactly, retain npm integrity metadata, review the `windows-1252` transitive
  dependency, and use the public package entry point only. Do not fetch code from a CDN at runtime.
- Do not patch `Uint8Array`, `TextEncoder`, `TextDecoder`, `atob`, `btoa`, or any other global/prototype
  to make an optional format pass. A runtime incompatibility is a deferral or explicit platform
  amendment.
- Keep routine tests and runtime codec use network-free. Package installation is the only normal
  dependency-fetch step; template input must never trigger wiki, tool, or package requests.
- Keep fixtures minimal and provenance-labeled. Do not commit unnecessary community descriptions,
  player identities, large team dumps, binary payloads, extracted package trees, or evaluation logs.
- Future UI must render imported names/descriptions as escaped text. This sprint stores no executable
  markup and adds no rendering path.

## Dependencies

- `EPIC-00` / SPRINT-001 for the single-package TypeScript/Vite/Vitest foundation, framework-neutral
  domain contracts, eight-slot skill-bar convention, and `npm run verify`.
- `EPIC-01` / SPRINT-002 for source classification, provenance, rights review, fixture policy, and
  safe handling of externally sourced examples.
- `EPIC-03` / SPRINT-004 for `TemplateProfessionId`, `TemplateAttributeId`, profession `0 -> none`,
  explicit reserved/unsupported/unknown outcomes, and the promoted profession/attribute catalog.
- `EPIC-04` / SPRINT-005 for `TemplateSkillId`, known/dispositioned/unknown skill lookup outcomes,
  unknown authored-ID preservation, and the promoted skill catalog.
- `@buildwars/gw-templates@1.1.1`, pinned exactly, for the evaluated skill/equipment codecs and the
  optional paw-ned2 feasibility path.
- The package's `windows-1252` transitive dependency is relevant only to paw-ned2 charset behavior and
  remains subject to the Phase 5 gate.
- Node.js `>=22.11.0`, npm `>=11.10.1`, TypeScript, Vite, and Vitest are the repository-declared
  platform until an explicit amendment says otherwise. The package's documented Node.js `>=24`
  expectation is a qualification risk, not implicit authorization to raise this floor.
- EPIC-06 is the downstream owner for legality and unresolved-ID warnings; EPIC-08 owns import/editor
  UX and persisted build construction; EPIC-13 owns semantic equipment catalogs and joins; EPIC-17
  owns party/team editing and any deferred paw-ned2 integration.
- No live Guild Wars Wiki, PvX, community tool, browser service, or generated audit artifact is
  required for implementation or verification.

## Open Questions

No open question blocks execution. The sprint uses these defaults:

1. Imported skill/equipment data remains in a dedicated template document until a later application
   service deliberately constructs a `Build` or semantic equipment model. Catalog resolution does
   not mutate that document.
2. Equipment templates ship as raw codec support now. Semantic equipment joins wait for EPIC-13.
3. Unchanged imports promise exact original-code preservation. New/edited exports promise semantic
   equivalence after re-decode, not byte identity; an unproven or lossy export fails.
4. Empty chat-code names are valid and preserved. Unsafe delimiters/control characters have no
   escape syntax and therefore fail on formatting.
5. Fixture priority is synthetic vectors, then the smallest useful examples from the pinned MIT
   package documentation with explicit metadata. Broader real/community fixture acquisition
   requires separate source review.
6. The project runtime floor is not raised during dependency adoption. If mandatory skill/equipment
   paths fail at Node `22.11.0`, SPRINT-006 blocks for an explicit amendment. A failure isolated to
   paw-ned2 triggers the EPIC-17 deferral path.
7. paw-ned2 ships only if every raw-codec gate passes inside the bounded Phase 5 timebox. Otherwise
   BW-0505 and BW-1701 are the completed, traceable outcome; no partial team API is exported.
8. Old skill/equipment headers are supported only where the pinned dependency and committed fixture
   evidence prove them. Unknown versions fail explicitly rather than being normalized to the new
   format.
