---
id: SPRINT-006
title: Template Compatibility
status: draft
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
created: 2026-09-02
---

# Sprint 006: Template Compatibility

## Overview

This sprint executes `EPIC-05 Template Compatibility` by adding a bounded, framework-neutral template
compatibility layer for Guild Wars skill templates, equipment templates, chat-code wrappers, and
paw-ned2/team formats where feasible. The sprint should make template codes a typed import/export
boundary for Build Wars without coupling UI code to parser details or losing authored numeric IDs
that the current catalogs cannot resolve.

The main implementation strategy is dependency-first. `@buildwars/gw-templates@1.1.1` must be
evaluated and pinned before any local bitstream parsing is considered. Build Wars should consume the
package only through a narrow local adapter that guards decoded shapes, converts thrown dependency
errors into typed errors, and isolates package normalization quirks from domain contracts. If the
dependency cannot run under the repository's supported Node/Vite/browser targets, the sprint should
block or explicitly disposition the affected scope instead of substituting a hand-rolled codec.

The main domain decision is to keep template data separate from fully resolved Build Wars builds.
`Build` currently stores catalog IDs for known professions, attributes, skills, and equipment. Skill
and equipment template codes can contain unknown, reserved, dispositioned, or semantically deferred
numeric IDs. The sprint should introduce import/export DTOs that preserve raw authored template IDs,
template names, wrapper details, dependency-normalized codes, and catalog lookup outcomes. A
resolved `Build` projection may be produced when safe, but unresolved template data must stay
round-trippable in the template envelope until later UI and validation epics decide display and
warning behavior.

This is not a browser UI sprint. It does not build import dialogs, paste/drop interactions, local
library persistence, sharing URLs, rule validation, skill-picker behavior, attribution UI, equipment
semantic catalogs, PvX guide import, runtime wiki access, or copied community build content. Runtime
code may consume the promoted EPIC-03 and EPIC-04 catalog JSON artifacts, but it must not read
manifests, QA reports, source snapshots, source plans, Python ingestion modules, or wiki APIs.

## Use Cases

1. **Import a skill template code**: A caller can decode a Guild Wars skill template into primary
   and secondary profession template IDs, attribute allocations, eight skill slots, lookup outcomes
   against the promoted catalogs, the original input, and a normalized exportable code.
2. **Preserve unknown authored IDs**: A template containing unknown profession, attribute, skill, or
   dispositioned skill IDs remains representable and re-encodable without coercing those IDs into
   catalog namespaces or dropping them.
3. **Export a skill template code**: A caller can encode a template DTO or a safe build projection
   back into a Guild Wars skill template code, with tests accepting byte-identical output or a
   documented dependency-normalized equivalent.
4. **Parse and emit chat-code wrappers**: A caller can accept `[template name;code]`-style inputs,
   preserve safe template names, decode the nested skill or equipment code, and re-emit a wrapper
   when a name is present.
5. **Decode equipment templates without semantic overreach**: A caller can decode equipment template
   item slots, item IDs, color IDs, and modifier IDs into raw bounded records, then re-encode them
   even though rune, insignia, weapon, armor, mod, and color catalogs are deferred.
6. **Handle invalid input predictably**: Malformed codes, unsupported prefixes, unsafe wrappers,
   dependency exceptions, and decoded shape mismatches return typed, useful errors rather than raw
   thrown exceptions.
7. **Assess paw-ned2/team formats**: A caller can either decode and re-encode a minimal team
   envelope through the same adapter boundary or receive an explicit documented deferral with
   follow-up tickets and fixture evidence.
8. **Verify compatibility with fixtures**: Maintainers can run focused Vitest tests and
   `npm run verify` to prove supported formats, edge cases, package behavior, and ticket records are
   consistent.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Domain contracts | Plain-data template DTOs, typed results, typed errors, wrapper metadata, raw equipment records, lookup outcome references, and framework-neutral helpers. | React components, DOM APIs, browser storage, import dialogs, local library persistence, sharing, and rule-result UI. |
| Dependency integration | Exact `@buildwars/gw-templates@1.1.1` evaluation, pinned package/lockfile update, local module declaration or typed facade, runtime shape guards, and compatibility tests. | Direct package imports throughout the codebase, unpinned dependency ranges, unguarded `any` propagation, or replacing the package with local bitstream parsing before evaluation. |
| Skill templates | Decode/encode profession template IDs, attribute ranks, eight skill slots, empty-slot behavior after proof, catalog lookups, unknown/disposition preservation, and canonical/equivalent output handling. | Skill rule legality, bar validation, title eligibility, skill search UI, tooltip rendering changes, or catalog regeneration. |
| Chat wrappers | Parse and emit supported chat-code wrappers for skill and equipment templates, preserve safe template names, and reject ambiguous or unsafe wrappers. | Rich text names, HTML rendering, clipboard UI, storage policy, or broad chat-log parsing. |
| Equipment templates | Decode and encode raw equipment item facts through bounded DTOs and fixture tests; map only facts the dependency exposes reliably. | Semantic equipment joins, armor/rune/insignia/weapon/mod/color catalogs, stat validation, equipment editor UI, or inferred item meaning. |
| paw-ned2/team | Bounded feasibility gate; minimal decode/encode envelope only if dependency behavior, charset handling, fixtures, and scope are stable. | Full party builder UX, PvX import, guide annotations, player assignment workflows, or copied community build prose. |
| Planning records | Sprint and ticket traceability for `EPIC-05`, focused closeout docs, and ledger consistency during execution. | Commits, unrelated backlog reshaping, or application-code changes during planning. |

### Ownership Boundaries

| Concern | Owner | Boundary |
| --- | --- | --- |
| Public domain API | `src/domain` | Owns exported template contracts and pure helpers. Must stay framework-neutral and must not import React, DOM/browser APIs, browser storage, network clients, app modules, data scripts, manifests, QA reports, or source snapshots. |
| Package adapter | `src/domain` or a sibling framework-neutral module | The only code allowed to import `@buildwars/gw-templates`; converts package calls into Build Wars DTOs and typed errors. |
| Catalog lookups | `src/domain/catalog-lookup.ts` plus promoted catalog JSON | Resolve known template IDs through existing EPIC-03 and EPIC-04 lookup semantics. Unknowns remain explicit outcomes. |
| Generated data | `data/generated/epic-03` and `data/generated/epic-04` | Runtime-eligible catalog JSON only. No refresh, promotion, manifest consumption, or QA-report runtime dependency is introduced by this sprint. |
| Tests and fixtures | `test/domain` and `test/fixtures/template-compatibility` | Store synthetic or license-reviewed compatibility cases with no copied guide prose, screenshots, icon bytes, or broad source payloads. |
| UI | Later epics under `src/app` | May call this API later, but this sprint does not wire it into browser workflows. |

### Source Authority

| Fact | Primary Authority | Cross-check | Conflict Handling |
| --- | --- | --- | --- |
| Bitstream decode/encode behavior | `@buildwars/gw-templates@1.1.1` after Phase 1 compatibility proof | Dependency README examples, package smoke tests, and decode-back tests | If package behavior is unstable or unsupported under project engines, block instead of writing a local bitstream parser. |
| Profession template IDs | EPIC-03 promoted professions/attributes catalog crosswalk | Decoded package `prof_pri` and `prof_sec` numeric values | Preserve `known`, `none`, `reserved`, `unsupported`, and `unknown` outcomes; do not cast unknowns into `ProfessionId`. |
| Attribute template IDs | EPIC-03 promoted professions/attributes catalog crosswalk | Decoded package attributes object and rank validation | Preserve raw IDs and ranks; invalid ranks become typed errors or warnings according to the DTO contract. |
| Skill template IDs | EPIC-04 promoted skills catalog | Decoded package skills array and existing disposition lookup | Preserve known, dispositioned, unknown, and empty slot states without compacting or renumbering. |
| Equipment item facts | Dependency-decoded equipment payload | Encode/decode equivalence tests | Store raw IDs only; do not infer semantic item, rune, insignia, weapon, mod, or color catalog records. |
| Chat wrapper names | Supported chat-code grammar proven by fixtures | Dependency `fromChatCode` behavior where useful | Preserve only safe bounded names; reject ambiguous delimiter/control-character cases. |
| paw-ned2/team payloads | Dependency `PwndTemplate` behavior after feasibility proof | Nested skill/equipment decode helpers and generated fixtures | Implement a minimal raw envelope or formally defer with evidence and follow-up tickets. |

### Template DTO Shape

The sprint should add a small set of serializable DTOs rather than extending `Build` to hold raw
template IDs:

- `TemplateCodeFormat`: `skill`, `equipment`, `paw-ned2`, or `unknown`.
- `TemplateWrapper`: wrapper kind, raw input kind, safe template name, inner code, and normalized
  wrapper emission data.
- `DecodedSkillTemplate`: source code, normalized code, optional wrapper, primary and secondary
  profession refs, attribute refs, exactly eight skill-slot refs, catalog lookup outcomes, and an
  optional safe `Build` projection.
- `DecodedEquipmentTemplate`: source code, normalized code, optional wrapper, raw item records keyed
  by template slot, raw item IDs, color IDs, modifier IDs, and package-normalization notes.
- `DecodedTeamTemplate`: source code, normalized code, charset, bounded build entries, nested skill
  and equipment codes, names/descriptions/player fields as safe metadata, and explicit unsupported
  field notes when implemented.
- `TemplateCodecResult<T>`: `ok` with value or `error` with a typed `TemplateCodecError`.

Template refs should carry both raw numeric IDs and lookup results. Known refs may point at catalog
IDs. Unknown, reserved, unsupported, none, and dispositioned refs must remain distinguishable.
Numeric IDs are never inferred from array position, compacted, or cast into a different branded ID
namespace just to fit `Build`.

### Import Flow

```text
raw user/template input
  -> format and wrapper classifier with size/name caps
  -> adapter decode through @buildwars/gw-templates
  -> decoded-shape guard
  -> raw template DTO
  -> optional catalog joins using EPIC-03 and EPIC-04 lookup helpers
  -> safe Build projection only when refs are resolvable or intentionally nullable
  -> typed result
```

The adapter should preserve the original input separately from the dependency-normalized code. If the
package normalizes a valid code to byte-different output, the result should record that state so
tests and future UI can distinguish "not equivalent" from "equivalent but normalized by dependency."

### Export Flow

```text
template DTO or safe build projection
  -> raw template ID extraction
  -> shape and range validation
  -> adapter encode through @buildwars/gw-templates
  -> optional wrapper emission
  -> decode-back verification in tests
  -> typed result
```

Export helpers should prefer explicit template refs over reverse catalog lookup when preserving an
imported template. Reverse lookup from catalog IDs is allowed only for known records with defined
template IDs. Unknown authored IDs cannot be reconstructed from a resolved `Build` unless the caller
supplies the original template envelope.

### Error Contract

Add typed errors with stable codes such as:

- `unsupported-format`
- `invalid-template-code`
- `invalid-chat-wrapper`
- `unsafe-template-name`
- `dependency-unavailable`
- `dependency-threw`
- `decoded-shape-mismatch`
- `invalid-slot-count`
- `invalid-template-id`
- `catalog-join-inconsistent`
- `encode-not-round-trippable`
- `paw-ned2-deferred`

Errors should include sanitized context: format, phase, reason, and optional field path. They should
not expose stack traces, unbounded user input, raw package objects, or unsafe wrapper text.

### Dependency Gate

`@buildwars/gw-templates@1.1.1` is the required first option, but it has three uncertainties that
must be resolved before implementation proceeds past Phase 1:

- The package README advertises JavaScript support for Node.js `>=24`, while Build Wars currently
  supports Node.js `>=22.11.0`.
- The npm metadata exposes a CommonJS main entry and no advertised TypeScript declarations.
- The package may normalize encoded output so valid round trips are semantically equivalent but not
  byte-identical.

The sprint should make these outcomes explicit. If the package works under the repository engine and
bundler, pin it and continue. If it requires raising the repository engine, blocks browser bundling,
or cannot provide stable decoded shapes, stop with a blocked sprint and follow-up tickets rather than
silently broadening scope.

## Implementation

### Phase 1: BW-0501 Dependency Evaluation And Template Contracts

**Files:**

- `package.json`
- `package-lock.json`
- `src/domain/ids.ts`
- `src/domain/template-codec.ts`
- `src/domain/template-codec-vendor.ts`
- `src/domain/index.ts`
- `test/domain/template-codec-contracts.test.ts`
- `test/fixtures/template-compatibility/README.md`
- `work/tickets/05-template-compatibility/BW-0501-dependency-evaluation-and-template-contracts.md`

**Tasks:**

- [ ] Pin `@buildwars/gw-templates@1.1.1` exactly after confirming its license, published entry
  points, install behavior, and compatibility with the repository's Node/Vite/TypeScript targets.
- [ ] Record the Node `>=24` README mismatch as an explicit go/no-go item; do not raise Build Wars
  engine requirements without a recorded decision.
- [ ] Add a single local adapter module that imports the package. No other module should import the
  dependency directly.
- [ ] Add a local module declaration or typed facade for the subset of `SkillTemplate`,
  `EquipmentTemplate`, and `PwndTemplate` used by Build Wars.
- [ ] Define serializable template DTOs, wrapper DTOs, result types, normalized-code metadata, and
  `TemplateCodecError` codes.
- [ ] Decide the initial raw equipment record shape separately from semantic `EquipmentTemplate`.
- [ ] Add smoke tests proving package import, skill decode, equipment decode, and error conversion
  work under the repository test runner.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/template-codec-contracts.test.ts`

**Phase Gate:** The dependency is pinned, importable, typed behind a local facade, and proven usable
under project engines. If not, mark the sprint blocked with the exact incompatibility and follow-up
tickets.

### Phase 2: BW-0502 Skill Template Import And Export

**Files:**

- `src/domain/template-codec.ts`
- `src/domain/template-skill.ts`
- `src/domain/catalog-lookup.ts`
- `src/domain/build.ts`
- `src/domain/index.ts`
- `test/domain/template-skill.test.ts`
- `test/fixtures/template-compatibility/skill-templates.ts`
- `work/tickets/05-template-compatibility/BW-0502-skill-template-import-export.md`

**Tasks:**

- [ ] Implement `decodeSkillTemplate` for raw skill codes and wrapped skill chat codes.
- [ ] Validate decoded shape: primary profession, secondary profession, attributes object, and
  exactly eight skill slots after dependency decode.
- [ ] Convert profession IDs through `lookupProfessionTemplateId`, including profession `0` as
  `none`.
- [ ] Convert attribute IDs through `lookupAttributeTemplateId`, preserving unknown, reserved, and
  unsupported outcomes.
- [ ] Convert skill IDs through `lookupSkillTemplateId`, preserving known, dispositioned, unknown,
  and empty-slot outcomes after the empty-slot convention is proven.
- [ ] Preserve raw template IDs and ranks even when a safe `Build` projection cannot be created.
- [ ] Implement `encodeSkillTemplate` from explicit template DTOs and, where safe, from known
  catalog-backed build projections.
- [ ] Add round-trip tests for known fixture builds, unknown IDs, profession `0`, malformed codes,
  invalid slot counts, package-normalized output, and catalog join inconsistencies.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/template-codec-contracts.test.ts test/domain/template-skill.test.ts test/domain/skill-catalog.test.ts test/domain/profession-attribute-catalog.test.ts`

**Phase Gate:** Skill templates can be decoded and encoded without losing authored IDs, and fixture
round trips distinguish byte-identical output from documented dependency-normalized equivalents.

### Phase 3: BW-0503 Chat-Code Wrappers And Template Names

**Files:**

- `src/domain/template-codec.ts`
- `src/domain/template-wrapper.ts`
- `src/domain/template-skill.ts`
- `src/domain/template-equipment.ts`
- `src/domain/index.ts`
- `test/domain/template-wrapper.test.ts`
- `test/fixtures/template-compatibility/chat-codes.ts`
- `work/tickets/05-template-compatibility/BW-0503-chat-code-wrappers-and-template-names.md`

**Tasks:**

- [ ] Implement a bounded wrapper classifier for supported Guild Wars chat-code forms without
  parsing bitstreams locally.
- [ ] Preserve safe template names separately from decoded template data.
- [ ] Reject or normalize unsafe names according to a documented policy for length, control
  characters, bracket delimiters, semicolon ambiguity, and whitespace.
- [ ] Identify the inner code format before dispatching to skill or equipment decode.
- [ ] Emit plain codes or `[name;code]` wrappers deterministically from encode helpers.
- [ ] Add tests for empty names, missing inner codes, extra delimiters, unknown prefixes,
  control-character names, long names, skill wrappers, and equipment wrappers.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/template-wrapper.test.ts test/domain/template-skill.test.ts`

**Phase Gate:** Supported wrappers and names round-trip safely, and ambiguous wrapper grammar fails
with typed errors.

### Phase 4: BW-0504 Equipment Template Raw Codec

**Files:**

- `src/domain/equipment.ts`
- `src/domain/template-codec.ts`
- `src/domain/template-equipment.ts`
- `src/domain/index.ts`
- `test/domain/template-equipment.test.ts`
- `test/fixtures/template-compatibility/equipment-templates.ts`
- `work/tickets/05-template-compatibility/BW-0504-equipment-template-raw-codec.md`

**Tasks:**

- [ ] Implement `decodeEquipmentTemplate` through the local adapter.
- [ ] Define raw equipment item DTOs for template slot ID, item ID, color ID, modifier IDs, and
  dependency-normalization metadata.
- [ ] Preserve raw item/mod/color numeric IDs without joining to incomplete semantic equipment
  catalogs.
- [ ] Add encode support from raw equipment DTOs and verify decode-back equivalence.
- [ ] Keep conversion to semantic `EquipmentTemplate` either absent or explicitly partial with
  `null` catalog IDs and no invented item meaning.
- [ ] Add tests for known equipment fixture codes, sparse/non-sequential slots, duplicate slot
  overwrite behavior if exposed by the dependency, invalid item shapes, wrapper names, and malformed
  codes.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/template-equipment.test.ts test/domain/template-wrapper.test.ts`

**Phase Gate:** Equipment templates have reliable raw decode/encode support without pretending that
deferred semantic equipment catalogs exist.

### Phase 5: BW-0505 paw-ned2 And Team Format Feasibility

**Files:**

- `src/domain/template-codec.ts`
- `src/domain/template-team.ts`
- `src/domain/template-skill.ts`
- `src/domain/template-equipment.ts`
- `src/domain/index.ts`
- `test/domain/template-team.test.ts`
- `test/fixtures/template-compatibility/team-templates.ts`
- `work/tickets/05-template-compatibility/BW-0505-pawned2-team-feasibility.md`

**Tasks:**

- [ ] Evaluate `PwndTemplate` decode and encode behavior for build count, charset, names,
  descriptions, players, flags, nested skill codes, nested equipment codes, and weapon set codes.
- [ ] If feasible, implement a minimal `DecodedTeamTemplate` envelope that preserves nested raw
  codes and metadata without importing guide prose or building party UI.
- [ ] Reuse skill and equipment decode helpers for nested codes when doing so is deterministic and
  bounded.
- [ ] Preserve team descriptions and player fields only as safe metadata with size caps; do not
  treat community-authored descriptions as runtime guide content.
- [ ] If infeasible, create a formal disposition that names the blocker, fixture evidence, deferred
  fields, and follow-up tickets.
- [ ] Add tests for at least one minimal generated team fixture or an explicit deferral test proving
  unsupported input returns `paw-ned2-deferred`.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/template-team.test.ts test/domain/template-codec-contracts.test.ts`

**Phase Gate:** paw-ned2/team support is either minimally implemented behind the same adapter
boundary or explicitly deferred with documented evidence. The decision must not block completed
skill, chat, and equipment support unless it exposes a shared adapter problem.

### Phase 6: BW-0506 Fixtures, Documentation, QA, And Closeout

**Files:**

- `test/domain/template-codec-contracts.test.ts`
- `test/domain/template-skill.test.ts`
- `test/domain/template-wrapper.test.ts`
- `test/domain/template-equipment.test.ts`
- `test/domain/template-team.test.ts`
- `test/fixtures/template-compatibility/`
- `compendium/template-compatibility.md`
- `README.md`
- `work/tickets/05-template-compatibility/EPIC.md`
- `work/tickets/05-template-compatibility/BW-0501-dependency-evaluation-and-template-contracts.md`
- `work/tickets/05-template-compatibility/BW-0502-skill-template-import-export.md`
- `work/tickets/05-template-compatibility/BW-0503-chat-code-wrappers-and-template-names.md`
- `work/tickets/05-template-compatibility/BW-0504-equipment-template-raw-codec.md`
- `work/tickets/05-template-compatibility/BW-0505-pawned2-team-feasibility.md`
- `work/tickets/05-template-compatibility/BW-0506-fixtures-docs-and-closeout.md`
- `work/sprints/SPRINT-006.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Add fixture provenance notes for any real template codes copied from package examples,
  documentation, game-created templates, or manual synthetic encodes.
- [ ] Ensure committed fixtures contain template codes and bounded metadata only, not copied guide
  prose, screenshots, icons, source snapshots, or community build annotations.
- [ ] Document the public template compatibility API, dependency boundary, normalization behavior,
  unknown-ID preservation policy, equipment raw-scope limitation, and paw-ned2 decision.
- [ ] Update README deferred/current scope bullets if template compatibility becomes available as a
  domain API.
- [ ] Create or update BW ticket files for all `EPIC-05` slices with sprint IDs, status, acceptance
  criteria, and closeout notes.
- [ ] Sync sprint status and `work/sprints/ledger.tsv` after verification.
- [ ] Run final validation and record any known residual limitations.

**Verification:**

- `npm run test:run -- test/domain/template-codec-contracts.test.ts test/domain/template-skill.test.ts test/domain/template-wrapper.test.ts test/domain/template-equipment.test.ts test/domain/template-team.test.ts`
- `npm run verify`

**Phase Gate:** The sprint has complete fixture evidence, documentation, ticket traceability, and
offline verification. If any supported format cannot be completed, the sprint records the exact
deferred scope instead of leaving silent partial behavior.

## Files Summary

Planned application/domain changes:

- `package.json` and `package-lock.json`: exact runtime dependency on `@buildwars/gw-templates@1.1.1`
  if Phase 1 passes.
- `src/domain/template-codec.ts`: shared public result, error, wrapper, and format contracts.
- `src/domain/template-codec-vendor.ts`: only adapter allowed to import the third-party package.
- `src/domain/template-skill.ts`: skill template decode/encode and catalog lookup integration.
- `src/domain/template-wrapper.ts`: chat-code wrapper parsing and emission.
- `src/domain/template-equipment.ts`: raw equipment template decode/encode contracts and helpers.
- `src/domain/template-team.ts`: paw-ned2/team envelope or explicit deferral behavior.
- `src/domain/equipment.ts`, `src/domain/build.ts`, `src/domain/ids.ts`, and `src/domain/index.ts`:
  narrowly scoped exports or type additions only where needed.

Planned test and fixture changes:

- `test/domain/template-codec-contracts.test.ts`
- `test/domain/template-skill.test.ts`
- `test/domain/template-wrapper.test.ts`
- `test/domain/template-equipment.test.ts`
- `test/domain/template-team.test.ts`
- `test/fixtures/template-compatibility/README.md`
- `test/fixtures/template-compatibility/skill-templates.ts`
- `test/fixtures/template-compatibility/chat-codes.ts`
- `test/fixtures/template-compatibility/equipment-templates.ts`
- `test/fixtures/template-compatibility/team-templates.ts`

Planned planning/documentation changes:

- `compendium/template-compatibility.md`
- `README.md`
- `work/tickets/05-template-compatibility/EPIC.md`
- `work/tickets/05-template-compatibility/BW-0501-dependency-evaluation-and-template-contracts.md`
- `work/tickets/05-template-compatibility/BW-0502-skill-template-import-export.md`
- `work/tickets/05-template-compatibility/BW-0503-chat-code-wrappers-and-template-names.md`
- `work/tickets/05-template-compatibility/BW-0504-equipment-template-raw-codec.md`
- `work/tickets/05-template-compatibility/BW-0505-pawned2-team-feasibility.md`
- `work/tickets/05-template-compatibility/BW-0506-fixtures-docs-and-closeout.md`
- `work/sprints/SPRINT-006.md`
- `work/sprints/ledger.tsv`

No `src/app` UI integration is planned for this sprint.

## Definition of Done

- `@buildwars/gw-templates@1.1.1` is evaluated, pinned exactly, and isolated behind one local
  framework-neutral adapter, or the sprint is blocked with a precise dependency finding.
- Skill template decode/encode supports promoted EPIC-03 and EPIC-04 catalog lookups while
  preserving raw unknown, reserved, dispositioned, none, and known template IDs.
- Skill template DTOs maintain exactly eight skill slots and document the empty-slot convention with
  tests.
- Chat-code wrappers parse and emit supported skill/equipment names safely, with typed failures for
  malformed or unsafe wrappers.
- Equipment template decode/encode supports raw item-slot facts and re-encoding without requiring
  deferred semantic equipment catalogs.
- paw-ned2/team support is either implemented as a minimal bounded envelope or explicitly deferred
  with evidence and follow-up tickets.
- Invalid inputs and package exceptions return stable typed errors without leaking raw exceptions or
  unbounded user input.
- Fixture tests cover known round trips, dependency-normalized equivalent output, unknown IDs,
  malformed inputs, wrapper names, raw equipment records, and the paw-ned2 decision.
- Runtime code consumes only approved catalog JSON where needed and does not import generated
  manifests, QA reports, source snapshots, source plans, Python ingestion modules, or wiki APIs.
- `npm run verify` passes.
- `EPIC-05`, `BW-0501` through `BW-0506`, `SPRINT-006`, and `work/sprints/ledger.tsv` are
  status-consistent.

## Risks

- **Dependency runtime mismatch:** The package README advertises Node.js `>=24`, but the repo engine
  floor is Node.js `>=22.11.0`. This is a Phase 1 go/no-go risk.
- **Missing TypeScript declarations:** The package does not advertise types. A narrow typed facade
  and runtime shape guards are required to avoid spreading `any`.
- **Normalization ambiguity:** The package may return equivalent but byte-different codes. Tests must
  distinguish canonical equality from semantic equivalence.
- **Unknown-ID data loss:** Mapping decoded numeric IDs directly into `Build` catalog IDs would lose
  namespace and unresolved-state information. The template envelope is required.
- **Equipment scope expansion:** Raw equipment facts are feasible now; semantic equipment meaning is
  blocked by missing equipment catalogs and must not be inferred.
- **paw-ned2 scope expansion:** Team templates include nested codes, charsets, flags, descriptions,
  players, and weapon sets. This phase needs strict deferral criteria.
- **Fixture provenance drift:** Real-world build codes can carry community-authored naming or
  descriptions. Fixtures should be synthetic or carry minimal provenance notes.
- **Future UI assumptions:** Later UI may want richer behavior than this API exposes. This sprint
  should keep contracts honest rather than prebuilding workflows.

## Security

- Treat every template string and wrapper name as untrusted user input.
- Apply length caps before dependency decode to reduce denial-of-service risk from large pasted
  payloads.
- Reject control characters, ambiguous delimiters, and unsafe wrapper names. Do not render names as
  HTML.
- Do not use `eval`, dynamic code generation, runtime network fetches, browser storage, or source
  snapshot reads in the template codec.
- Sanitize typed error payloads so stack traces, raw dependency objects, and unbounded user input are
  not exposed.
- Keep fixtures free of copied guide prose, screenshots, icon bytes, source snapshots, and broad
  community content.
- Review the dependency license and package surface before adding it to runtime dependencies.

## Dependencies

- `SPRINT-001` through `SPRINT-005` completed and recorded in `work/sprints/ledger.tsv`.
- EPIC-03 promoted catalog at `data/generated/epic-03/professions-attributes.catalog.json`.
- EPIC-04 promoted catalog at `data/generated/epic-04/skills.catalog.json`.
- Existing lookup helpers: `lookupProfessionTemplateId`, `lookupAttributeTemplateId`, and
  `lookupSkillTemplateId`.
- Existing branded IDs: `TemplateProfessionId`, `TemplateAttributeId`, `TemplateSkillId`, and
  catalog ID brands.
- `@buildwars/gw-templates@1.1.1`, MIT licensed, subject to Phase 1 compatibility proof.
- Repository toolchain: Node.js `>=22.11.0`, npm `>=11.10.1`, TypeScript, Vite, Vitest, ESLint, and
  Prettier.

## Open Questions

1. Does `@buildwars/gw-templates@1.1.1` actually run under Node.js `22.11.0` and the current Vite
   build despite its README stating Node.js `>=24` for JavaScript?
2. What is the exact skill-template empty-slot convention after dependency decode: missing entry,
   numeric `0`, `null`, or another package-specific value?
3. Should the public API expose both original input and dependency-normalized output for every
   format, or only when they differ?
4. What level of byte-different output should count as an accepted round trip for skill and
   equipment templates?
5. What is the safe template-name grammar for chat wrappers, especially semicolons, closing
   brackets, newlines, empty names, and long names?
6. Should `DecodedSkillTemplate` always include a partial `Build` projection, or only include one
   when all required refs are known and safe to cast into catalog namespaces?
7. Should equipment template slots and colors receive branded template ID types now, or remain raw
   numbers until equipment catalogs define stable namespaces?
8. Are package README examples acceptable committed fixtures under the MIT package license, or
   should all committed examples be generated synthetically during tests?
9. If paw-ned2 decode exposes descriptions or player fields, should this sprint preserve them as
   bounded metadata, strip them, or defer team support until a source/content policy ticket exists?
10. Should dependency incompatibility block all of EPIC-05, or should the sprint close only the
    planning/evaluation ticket and leave skill/equipment implementation for a later approved parser
    strategy?
