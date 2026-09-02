---
id: SPRINT-006
title: Template Compatibility
status: completed
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
updated: 2026-09-02
completed: 2026-09-02
---

# Sprint 006: Template Compatibility

## Overview

This sprint turns `EPIC-05 Template Compatibility` into a framework-neutral codec boundary for the
Guild Wars build formats players already exchange. It evaluates and pins
`@buildwars/gw-templates@1.1.1`, then supports skill template import/export, raw equipment template
import/export, safe chat-code wrappers and template names, typed failures, compatibility fixtures,
and a bounded paw-ned2/team ship-or-defer decision.

This is a domain and compatibility sprint, not a UI sprint. It does not build paste dialogs,
clipboard flows, local library persistence, sharing URLs, rule validation, skill-picker behavior,
semantic equipment catalogs, party editing, PvX imports, guide content, runtime wiki access, or
attribution UI. Runtime code may consume promoted EPIC-03 and EPIC-04 catalog JSON only through
caller-supplied data; it must not import generated manifests, QA reports, source snapshots, source
plans, Python ingestion modules, or wiki APIs.

The sprint locks one architectural rule: decoded template data remains loss-aware template data. It
is not forced into `Build` or the current semantic `EquipmentTemplate` when unknown, reserved,
unsupported, dispositioned, raw equipment, or future IDs cannot be represented without loss.
Resolution against catalogs is a pure derived view that can be rerun against newer catalogs and never
rewrites the source template document.

## Use Cases

1. **Import a skill template**: Decode a bare skill code or skill chat wrapper into primary and
   secondary template profession IDs, ordered attribute/rank pairs, exactly eight skill slots, source
   metadata, and typed diagnostics.
2. **Preserve unresolved skill IDs**: Keep profession `0`, skill slot `0`, known, none, reserved,
   unsupported, dispositioned, unknown, non-contiguous, and future numeric IDs distinct without
   coercing them into catalog namespaces.
3. **Resolve imported skills safely**: Given caller-supplied EPIC-03 and EPIC-04 catalogs, report
   known and unresolved lookup outcomes without mutating the decoded document or importing audit
   artifacts.
4. **Export skill templates safely**: Re-emit unchanged imports exactly, or emit a canonical code only
   after encode and decode-back equality prove all intended fields survived.
5. **Preserve chat-code names**: Parse and format `[name;code]` wrappers for supported skill and
   equipment formats while preserving safe empty and non-empty names.
6. **Exchange raw equipment templates**: Decode and re-encode raw slot, item, color, and modifier
   facts before armor, rune, insignia, weapon, modifier, and dye catalogs are complete.
7. **Fail predictably**: Return stable typed errors for oversized input, invalid characters, wrong
   template kinds, unsupported versions, malformed payloads, unsafe names, dependency failures, and
   lossy exports.
8. **Decide team support from evidence**: Ship a bounded raw paw-ned2 team envelope only if it passes
   the same runtime, shape, fidelity, and fixture gates; otherwise defer it with a concrete follow-up.

## Architecture

### Scope Boundary

| Area                  | In Scope                                                                                                                                                                                  | Out of Scope                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain contracts      | Plain JSON-compatible template documents, source envelopes, raw ID namespaces, lookup outcomes, diagnostics, errors, and fidelity grades.                                                 | Vendor classes, package objects, thrown errors, browser APIs, storage, network clients, UI state, or data scripts.                         |
| Compatibility adapter | One pinned vendor adapter, bounded input checks, wrapper parsing, kind/version discrimination, shape validation, exact-source replay, canonical encode postconditions, and fixture proof. | Full local bitstream parsers, deep package imports, vendored source, CDN imports, runtime package fetches, or unguarded `any` propagation. |
| Skill templates       | Profession IDs, attribute ranks, eight skill slots, empty slot `0`, catalog resolution views, unknown-ID preservation, and semantic export proof.                                         | Rule legality, elite/PvE limits, effective ranks, mode inference, UI errors, or persisted build creation.                                  |
| Equipment templates   | Raw slot, item, color, and modifier facts that the qualified package exposes and the adapter can preserve or reject explicitly.                                                           | Semantic equipment joins, armor ratings, runes, insignias, weapons, modifiers, dye catalogs, or equipment editor behavior.                 |
| paw-ned2/team         | Bounded feasibility proof, and raw support only if all gates pass.                                                                                                                        | Party builder UX, hero identity, player assignment workflows, consumable legality, PvX import, or guide prose.                             |
| Fixtures and docs     | Minimal offline fixture matrix, source notes, API documentation, dependency upgrade gate, and ticket closeout.                                                                            | Large community build collections, copied guide text, screenshots, icon bytes, source snapshots, or live-network tests.                    |

### Layering

```text
src/domain/template.ts
  owns plain public contracts and ID namespaces

src/template-compatibility/*
  imports src/domain contracts
  imports @buildwars/gw-templates only through one adapter
  validates, maps, fingerprints, resolves, and encodes template data

src/domain
  must not import src/template-compatibility, app modules, React, DOM/browser APIs, storage,
  network clients, data scripts, generated manifests, QA reports, or snapshots

src/app
  unchanged in this sprint
```

A dedicated TypeScript and lint boundary should enforce the one-way dependency. If the implementation
chooses a simpler configuration, it still must provide an executable check that the vendor package is
imported only by the compatibility adapter and that domain/app boundaries remain intact.

### Alternatives Considered

| Alternative               | Decision                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Pinned dependency adapter | Preferred first path because EPIC-05 explicitly says not to hand-roll bitstream parsers before evaluation.                  |
| Audited fork              | Valid follow-up if the dependency fails mandatory skill/equipment gates, but not an incidental fallback inside this sprint. |
| Local parser              | Deferred unless a separate amendment accepts ownership of the full format, fixtures, and security surface.                  |
| Skill-only first sprint   | Rejected because equipment templates are in EPIC-05 Done When; raw equipment support is bounded enough to include.          |
| Canonical-only export     | Rejected because unknown or dependency-nonencodable imports need exact-source replay to avoid data loss.                    |
| paw-ned2 full party model | Rejected for this sprint; EPIC-17 owns party/hero semantics.                                                                |

### Dependency Qualification

`@buildwars/gw-templates@1.1.1` is the required first implementation path. Planning inspection found
an MIT npm package with CJS/ES/browser builds, no advertised TypeScript declarations, a
`windows-1252` transitive dependency, and package documentation that states JavaScript support for
Node.js `>=24` while Build Wars currently declares Node.js `>=22.11.0`.

BW-0501 must prove the mandatory skill and equipment paths under the repository runtime floor,
Vitest, TypeScript, and Vite production build before public contracts depend on package behavior. If
mandatory skill/equipment support fails, the sprint is blocked for a dependency, runtime, fork, or
scope amendment. It must not silently raise `engines.node` or ship a local parser fallback.

### Source Envelope And Fidelity

Every successful decode returns a source envelope with:

- input kind: `bare` or `chat-code`;
- decoded template kind: `skill`, `equipment`, or, only if gated in, `paw-ned2`;
- original bounded input and original bare code;
- optional normalized dependency input when harmless normalization is accepted;
- `templateName: string | null`, where `null` means no wrapper and `""` means an empty wrapper name;
- stable semantic fingerprint over adapter-owned format fields; and
- diagnostics about accepted normalization or dependency limitations.

Export has two modes:

- **Exact replay**: return the original bare code when the current semantic fingerprint still
  matches. Wrapper/name changes may format around the preserved bare code without forcing a lossy
  vendor re-encode.
- **Canonical**: validate a new or edited document, call the vendor encoder, decode the result, and
  return a code only when an adapter-owned field comparison proves every intended field survived.

The public fidelity grades are `exact-source`, `field-complete-normalized`, and `unsupported-or-lossy`.
Any clamp, omission, replacement, unsupported field, significant reorder, or mismatch returns a typed
failure and no code.

### Wrapper Policy

The local parser accepts either a bare code or exactly one `[name;code]` wrapper. It trims only outer
ASCII whitespace around the whole input. It preserves the wrapper name exactly when safe, including an
empty string. Formatting rejects names with semicolons, square brackets, NUL/control characters,
carriage returns, line feeds, or more than 256 Unicode code points. Missing code, nested wrappers,
trailing text, unsupported Unicode whitespace in structural positions, and ambiguous delimiters are
typed parse failures.

### Error Model

Every public operation returns a discriminated result:

- success: `{ ok: true, value, diagnostics }`
- failure: `{ ok: false, error }`

Errors include stable code, operation, stage, expected template kind where relevant, optional field
path, and a bounded adapter-owned message. Vendor exceptions, stacks, dependency objects, internal
buffers, raw regex matches, and unbounded input echoes never cross the public boundary.

Initial stable error codes include `INPUT_TOO_LARGE`, `EMPTY_INPUT`, `INVALID_CHARACTER_SET`,
`INVALID_CHAT_WRAPPER`, `UNSAFE_TEMPLATE_NAME`, `WRONG_TEMPLATE_KIND`, `UNSUPPORTED_VERSION`,
`MALFORMED_TEMPLATE`, `INVALID_DECODED_SHAPE`, `INVALID_FIELD_VALUE`, `SOURCE_CHANGED`,
`UNSUPPORTED_BY_CODEC`, `LOSSY_ENCODE`, `DEPENDENCY_FAILURE`, and `PAWNED2_DEFERRED`.

### Skill Resolution

`SkillTemplateDocument` stores raw template facts only: primary and secondary
`TemplateProfessionId`, ordered `{ attributeId: TemplateAttributeId, rank }` records, and an exact
eight-entry `TemplateSkillId` tuple. Skill slot `0` is the empty slot sentinel. Ranks and IDs are
preserved as finite non-negative integers surfaced by the dependency; game-rule legality is deferred
to EPIC-06.

Resolution helpers accept caller-supplied `ProfessionAttributeCatalog` and `SkillCatalog` values and
return a parallel view using existing lookup semantics: known, none, reserved, unsupported,
dispositioned, empty, and unknown. Resolution is not cached as immutable truth without catalog
version context, and it never rewrites template IDs into catalog IDs.

### Equipment Boundary

`EquipmentTemplateDocument` is distinct from the existing semantic `EquipmentTemplate`. Version 1
publishes only the raw fields that the qualified dependency exposes and the adapter can preserve
explicitly: slot ID, item ID, color ID, ordered modifier IDs, source envelope, and diagnostics. If
Phase 1 discovers additional dependency-surfaced fields, they must be either modeled with tests
before publication or treated as unsupported for edited canonical export. No semantic equipment
projection ships in this sprint.

### paw-ned2 Gate

paw-ned2/team support starts only after mandatory skill, wrapper, and equipment work is stable. It
ships only if the dependency passes Node/Vite runtime proof, charset behavior, malformed-input
termination, nested-code limits, member and text caps, shape validation, and encode/decode field
equality without global/prototype patches. A shipped surface is raw-only and does not map to
`PartyBuild`.

If any gate fails or capacity is not available, BW-0505 records a deferral and creates a focused
EPIC-17 follow-up when needed. A deferred outcome is acceptable for EPIC-05 only when mandatory
skill/equipment/chat compatibility is complete and no partial team API is exported.

## Implementation

### Phase 1: BW-0501 Dependency Qualification And Baseline (~15% of effort)

**Files:**

- `package.json`
- `package-lock.json`
- `test/template-compatibility/package-evaluation.test.ts`
- `test/fixtures/template-compatibility/README.md`
- `work/tickets/05-template-compatibility/BW-0501-pinned-dependency-qualification.md`

**Tasks:**

- [x] Confirm SPRINT-001 through SPRINT-005, EPIC-03, EPIC-04, and the promoted runtime catalog JSON
      files remain complete and available.
- [x] Record baseline validation state before dependency adoption.
- [x] Inspect and document `@buildwars/gw-templates@1.1.1` license, entry points, distribution,
      registry integrity, runtime requirements, missing/present types, and `windows-1252`
      dependency.
- [x] Add the package as an exact runtime dependency only if mandatory qualification can proceed.
- [x] Probe skill and equipment decode/encode examples, wrong-kind calls, malformed input,
      normalization, state reuse, thrown errors, and decoded object shapes.
- [x] Prove mandatory skill/equipment paths at Node.js `>=22.11.0`, TypeScript, Vitest, and Vite
      production build.
- [x] Perform a preliminary paw-ned2 capability probe without publishing team contracts.
- [x] If mandatory skill/equipment qualification fails, stop for a recorded blocked sprint amendment.

**Verification:**

- `npm ls @buildwars/gw-templates windows-1252`
- `npm run test:run -- test/template-compatibility/package-evaluation.test.ts`
- `npm run typecheck`
- `npm run build`

**Phase Gate:** The exact package and public import path are qualified for mandatory skill/equipment
work under the current repo runtime, or the sprint is blocked before public contracts rely on unsafe
dependency behavior.

### Phase 2: BW-0502 Contracts, Wrappers, And Safe Adapter (~20% of effort)

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
- `eslint.config.js`
- `test/domain/contracts.test.ts`
- `test/template-compatibility/chat-code.test.ts`
- `test/template-compatibility/error-boundary.test.ts`
- `work/tickets/05-template-compatibility/BW-0502-template-contracts-and-safe-adapter.md`

**Tasks:**

- [x] Add branded raw equipment template ID types and constructors without weakening existing
      profession, attribute, skill, and catalog ID brands.
- [x] Define JSON-compatible source envelope, skill/equipment document, result, diagnostic, fidelity,
      and error contracts.
- [x] Create a framework-neutral compatibility adapter boundary that imports domain contracts and is
      not imported by `src/domain`.
- [x] Add a narrow version-specific vendor declaration for the constructors and methods actually
      used.
- [x] Implement bounded input checks, bare/chat wrapper parsing, wrapper formatting, template-name
      policy, kind/version discrimination, and stable error mapping.
- [x] Validate dependency returns as own/plain values with finite safe integers, exact arity/count
      invariants, and no unexpected prototypes/accessors before copying into Build Wars objects.
- [x] Implement semantic projections, fingerprints, exact replay, canonical encode orchestration, and
      no-code return on mismatch.
- [x] Add executable import-boundary checks so only the adapter imports the vendor package.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm run test:run -- test/domain/contracts.test.ts test/template-compatibility/chat-code.test.ts test/template-compatibility/error-boundary.test.ts`
- `npm run build`

**Phase Gate:** Untrusted input reaches the dependency only through bounded, kind-correct adapter
calls, and all public outcomes are typed plain data with explicit fidelity semantics.

### Phase 3: BW-0503 Skill Template Compatibility (~25% of effort)

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

- [x] Decode supported skill codes into source envelope, primary/secondary template professions,
      ordered attribute/rank records, and exactly eight raw template skill slots.
- [x] Preserve zero sentinels, unknown IDs, dispositioned skills, non-contiguous IDs, duplicate or
      unusual but format-valid attributes, and dependency-surfaced ranks without applying rule
      legality.
- [x] Add pure resolution helpers using EPIC-03 and EPIC-04 lookup outcomes, including an explicit
      empty skill-slot outcome for template skill ID `0`.
- [x] Keep template decode/resolution separate from persisted `Build` creation. Any projection helper
      must be pure, fully resolved only, and explicitly optional.
- [x] Export unchanged skill documents by exact replay and edited/new documents by canonical encode
      plus adapter-owned field equality after re-decode.
- [x] Return `LOSSY_ENCODE` with no code for any dependency clamp, omission, replacement, significant
      reorder, unsupported value, or mismatch.
- [x] Add fixtures for package examples, synthetic all-zero and boundary cases, wrong equipment input,
      malformed codes, wrapper names, exact replay, normalized canonical output, source-edited
      detection, and lossy refusal.

**Verification:**

- `npm run test:run -- test/template-compatibility/skill-template.test.ts test/template-compatibility/catalog-resolution.test.ts test/domain/profession-attribute-catalog.test.ts test/domain/skill-catalog.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

**Phase Gate:** Known skill codes decode correctly, unchanged unknown-ID inputs export exactly,
accepted canonical exports preserve all intended fields, and lossy cases fail without output.

### Phase 4: BW-0504 Equipment Template Raw Compatibility (~18% of effort)

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

- [x] Decode supported equipment codes into strict raw records for the dependency-surfaced slot,
      item, color, and ordered modifier facts.
- [x] Normalize dependency object-key ordering into a documented deterministic item order.
- [x] Preserve raw numeric facts without mapping them to current armor, weapon, rune, insignia,
      modifier, dye, or catalog identities.
- [x] Exact-replay unchanged imported equipment documents when the fingerprint matches.
- [x] Canonically export edited/new equipment documents only when re-decode equality proves all
      modeled fields survived.
- [x] Reject duplicate slots, item-to-slot disagreements, filtered modifiers, invalid colors,
      unsupported item IDs, cross-kind inputs, malformed headers, oversized input, and unmodeled
      dependency fields that cannot be preserved.
- [x] Document the EPIC-13 migration path for future semantic equipment joins.

**Verification:**

- `npm run test:run -- test/template-compatibility/equipment-template.test.ts test/template-compatibility/chat-code.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

**Phase Gate:** Equipment templates round-trip at the raw field level, unchanged imports can re-emit
exactly, unsupported edits fail without output, and no semantic equipment model is fabricated.

### Phase 5: BW-0505 paw-ned2 Feasibility And Disposition (~10% of effort)

**Files:**

- `src/domain/template.ts` only if the ship gate passes
- `src/template-compatibility/pwnd-template.ts` only if the ship gate passes
- `src/template-compatibility/vendor/gw-templates.d.ts` only if the ship gate passes
- `src/template-compatibility/index.ts` only if the ship gate passes
- `test/template-compatibility/pwnd-template.test.ts`
- `test/fixtures/template-compatibility/pwnd-cases.json`
- `work/tickets/05-template-compatibility/BW-0505-pawned2-feasibility.md`
- `work/tickets/17-party-and-hero-builder/BW-1701-pawned2-template-integration.md` only if deferred

**Tasks:**

- [x] Inventory actual dependency behavior for paw-ned2 headers, charsets, nested codes, member
      fields, flags, descriptions, malformed lengths, statefulness, runtime globals, and
      normalization.
- [x] Test a minimal rights-compatible example plus synthetic UTF-8, Windows-1252, empty-field,
      maximum-field, breaking-header, invalid-charset, oversized, malformed-length, and nested
      wrong-code cases.
- [x] If every ship gate passes, add a raw JSON-compatible team document with source envelope,
      exact-source/canonical fidelity, bounded fields, and no `PartyBuild` conversion.
- [x] If any ship gate fails or scope is too large, expose no team API, record blocker evidence, and
      create the EPIC-17 follow-up only as needed.
- [x] Ensure team/player/description metadata is bounded, source-classified, and not treated as guide
      content.

**Verification:**

- If shipped: `npm run test:run -- test/template-compatibility/pwnd-template.test.ts`
- If deferred: focused test or manual review proving no public team codec export exists and BW-0505
  records evidence and owner
- `npm run typecheck`
- `npm run build`

**Phase Gate:** paw-ned2 has exactly one final state: shipped bounded raw codec, or evidence-backed
deferred optional scope with no partial public API.

### Phase 6: BW-0506 Fixtures, Docs, Verification, And Closeout (~12% of effort)

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

- [x] Consolidate data-driven skill, equipment, wrapper, error, fidelity, and paw-ned2 disposition
      cases with stable IDs, source notes, expected semantics, and inclusion rationale.
- [x] Document import/export APIs, exact-source replay, field-complete canonical export, typed
      errors, input caps, wrapper grammar, catalog injection, raw equipment limits, dependency
      upgrade gate, and paw-ned2 disposition.
- [x] Inspect dependency tree/license, public exports, fixture provenance, logs, bundle behavior, and
      worktree paths so no tarballs, extracted package source, absolute paths, transient logs, broad
      community data, generated audit artifacts, or source snapshots are tracked.
- [x] Run the focused compatibility suite and canonical repository verification without live network
      access.
- [x] Mark BW-0501 through BW-0506 complete only after their phase gates pass. Mark EPIC-05,
      SPRINT-006, and the ledger complete only after mandatory skill/equipment/chat/error DoD is
      satisfied and paw-ned2 has one clear ship/defer outcome.
- [x] Do not create a commit; the outer runner owns commit behavior.

**Verification:**

- `npm run test:run -- test/template-compatibility`
- `npm run verify`
- `python3 scripts/test_ticket_burn.py`
- `git status --short`

**Phase Gate:** Tests, docs, tickets, sprint, ledger, dependency lock, and fixtures agree on the
supported formats, unsupported cases, runtime floor, fidelity guarantees, security caps, and paw-ned2
status.

## Files Summary

| File                                                                             | Action                  | Purpose                                                                                                                  |
| -------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `package.json`                                                                   | Modify                  | Add exact `@buildwars/gw-templates@1.1.1` dependency after qualification.                                                |
| `package-lock.json`                                                              | Modify                  | Lock package and transitive dependency integrity.                                                                        |
| `tsconfig.template-compatibility.json`                                           | Create                  | Typecheck the framework-neutral adapter boundary.                                                                        |
| `tsconfig.json`                                                                  | Modify                  | Register the compatibility TypeScript project if created.                                                                |
| `tsconfig.domain.json`                                                           | Modify only if needed   | Include public domain template contracts while keeping no-DOM domain constraints.                                        |
| `eslint.config.js`                                                               | Modify                  | Enforce domain and compatibility import boundaries.                                                                      |
| `src/domain/ids.ts`                                                              | Modify                  | Add raw equipment template ID brands and constructors.                                                                   |
| `src/domain/template.ts`                                                         | Create                  | Define public template contracts, results, diagnostics, errors, fidelity, and optional team contracts only if gated in.  |
| `src/domain/catalog-lookup.ts`                                                   | Modify only if needed   | Add explicit empty-slot outcome helpers without changing existing catalog semantics.                                     |
| `src/domain/index.ts`                                                            | Modify                  | Export public contracts and ID helpers, not vendor classes.                                                              |
| `src/template-compatibility/vendor/gw-templates.d.ts`                            | Create                  | Declare the narrow pinned vendor surface used by the adapter.                                                            |
| `src/template-compatibility/gw-templates-adapter.ts`                             | Create                  | Isolate vendor construction, calls, exception mapping, shape guards, and encode postconditions.                          |
| `src/template-compatibility/chat-code.ts`                                        | Create                  | Parse and format safe bare/chat wrapper inputs.                                                                          |
| `src/template-compatibility/fingerprint.ts`                                      | Create                  | Build stable semantic projections and source fingerprints.                                                               |
| `src/template-compatibility/skill-template.ts`                                   | Create                  | Decode, resolve, exact-replay, and canonically encode skill template documents.                                          |
| `src/template-compatibility/equipment-template.ts`                               | Create                  | Decode, exact-replay, and canonically encode raw equipment template documents.                                           |
| `src/template-compatibility/pwnd-template.ts`                                    | Create only if gated in | Provide bounded raw paw-ned2 support.                                                                                    |
| `src/template-compatibility/index.ts`                                            | Create                  | Expose local compatibility API while hiding vendor implementation.                                                       |
| `test/domain/contracts.test.ts`                                                  | Modify                  | Prove public template data remains plain JSON and ID namespaces stay distinct.                                           |
| `test/template-compatibility/*.test.ts`                                          | Create                  | Cover package evaluation, wrappers, error boundary, skill, catalog resolution, equipment, paw-ned2, and matrix behavior. |
| `test/fixtures/template-compatibility/`                                          | Create                  | Store minimized synthetic and source-noted compatibility vectors.                                                        |
| `README.md`                                                                      | Modify                  | Document available template compatibility APIs and boundaries.                                                           |
| `compendium/template-compatibility.md`                                           | Create                  | Record durable dependency, fidelity, upgrade, equipment, and team decisions.                                             |
| `compendium/README.md`                                                           | Modify                  | Index the new compendium note.                                                                                           |
| `work/tickets/05-template-compatibility/*.md`                                    | Modify                  | Track BW-0501 through BW-0506 execution and closeout.                                                                    |
| `work/tickets/17-party-and-hero-builder/BW-1701-pawned2-template-integration.md` | Create only if deferred | Preserve team-format follow-up under the owning epic.                                                                    |
| `work/sprints/SPRINT-006.md`                                                     | Modify during execution | Track sprint execution state and checked gates.                                                                          |
| `work/sprints/ledger.tsv`                                                        | Modify                  | Record sprint lifecycle state.                                                                                           |

`src/app/**`, generated catalog JSON, generated manifests, QA reports, data-ingestion scripts, raw
source snapshots, and runtime wiki/network code are not modified by this sprint.

## Definition of Done

### Dependency And Boundary

- [x] `@buildwars/gw-templates@1.1.1` is pinned exactly, qualified at the repository Node.js floor,
      and proven in TypeScript, Vitest, and Vite production build.
- [x] Lockfile integrity, license, public entry point, transitive dependency, runtime requirements,
      and bundle behavior are reviewed and documented.
- [x] Only the compatibility adapter imports the vendor package. No public API returns vendor
      classes, objects, errors, buffers, or dependency-specific field names.
- [x] `src/domain` and `src/template-compatibility` remain framework-neutral and import no React,
      DOM/browser APIs, storage, network clients, app modules, data scripts, manifests, QA reports,
      snapshots, or live wiki code.
- [x] No full local skill/equipment bitstream parser, vendored source, deep package import, CDN load,
      or runtime network dependency is introduced.

### Skill Templates

- [x] Supported skill codes decode into primary/secondary template professions, ordered
      attribute/rank records, exactly eight template skill IDs, source/wrapper facts, and a semantic
      fingerprint.
- [x] Profession `0`, attribute `0`, skill slot `0`, known, none, reserved, unsupported,
      dispositioned, unknown, non-contiguous, and future dependency-surfaced IDs remain
      distinguishable.
- [x] Catalog resolution is pure, caller-supplied, catalog-version-aware, and non-mutating.
- [x] Unchanged decoded skill documents preserve the original bare code exactly; wrapper/name changes
      do not force dependency re-encode.
- [x] Every accepted canonical skill export re-decodes to the intended professions, attributes,
      ranks, and all eight slots.
- [x] Skill compatibility does not create persisted `Build` objects, infer mode, or enforce EPIC-06
      legality.

### Equipment And Wrappers

- [x] Supported equipment codes decode into deterministic raw slot/item/color/modifier facts with
      distinct template ID namespaces.
- [x] Unchanged decoded equipment documents preserve the original bare code exactly.
- [x] Every accepted canonical equipment export re-decodes to the intended modeled fields; built-in
      item maps, modifier filters, overwrites, or unsupported values cannot silently lose data.
- [x] Equipment support remains raw and does not fabricate joins to incomplete armor, rune, insignia,
      weapon, modifier, color, or dye catalogs.
- [x] Bare and bracketed chat codes parse and emit safely for supported skill and equipment kinds.
      `null` no-wrapper names and empty-string wrapper names remain distinct.
- [x] Missing, ambiguous, unsafe, over-limit, cross-kind, and unsupported-version wrappers fail with
      typed errors.

### Errors, Fidelity, And Security

- [x] All expected malformed or hostile input returns stable discriminated failures with bounded
      adapter-owned messages and no vendor stack/object leakage.
- [x] Input, code, name, collection, nested-code, text, and optional team limits are code-owned and
      covered at boundaries.
- [x] Public decoded values are strict plain JSON-compatible data with finite safe integers, exact
      tuple/count invariants, no prototypes/accessors, and no executable markup.
- [x] Exact replay verifies the current semantic fingerprint; canonical export verifies field
      equality after re-decode. Neither mode returns a code when its proof fails.
- [x] A dependency upgrade is gated by the compatibility corpus, runtime matrix, declaration review,
      normalization diff, and bundle/import review.

### Fixtures And paw-ned2

- [x] Fixture cases are minimized, stable, offline, source-classified, and either synthetic or
      attributable to a compatible source such as the pinned package's MIT documentation.
- [x] Known skill and equipment vectors have explicit decoded expectations; invalid vectors have
      explicit error expectations; canonical vectors assert semantic equality rather than accidental
      byte identity unless bytes are intentionally locked.
- [x] Compatibility-matrix results are deterministic and independent of network, time, locale,
      filesystem order, and shared vendor instance state.
- [x] paw-ned2 has exactly one final disposition: shipped bounded raw codec or evidence-backed
      deferral with downstream owner. Partial or unsafe support is not exported.

### Verification And Closeout

- [x] Focused template tests, `npm run verify`, and Vite production build pass without live network
      access after dependency installation.
- [x] Bundle output and public exports contain the intended pinned codec boundary only; material size
      or platform changes have an explicit disposition.
- [x] No tarball, extracted dependency source, live/community dump, large prose fixture, transient
      log, absolute local path, or unrelated generated artifact is tracked.
- [x] README, compendium, tests, package lock, tickets, EPIC-05, SPRINT-006, ledger, and result
      manifest agree on supported formats, runtime floor, fidelity guarantees, limits, and paw-ned2
      status.
- [x] BW-0501 through BW-0506, EPIC-05, SPRINT-006, and the ledger are marked complete only after all
      mandatory gates pass and paw-ned2 has one clear ship/defer outcome.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                                                                | Likelihood | Impact | Mitigation                                                                                                   |
| ----------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Package documentation requires Node `>=24` while the repo supports Node `>=22.11.0` | High       | High   | Phase 1 proves mandatory paths at the repo floor and blocks for amendment if unsupported.                    |
| Missing or incomplete TypeScript declarations leak `any`                            | High       | Medium | Add a narrow version-specific declaration and runtime shape validation.                                      |
| Vendor encoders silently clamp, omit, or replace authored facts                     | High       | High   | Use prevalidation plus decode-after-encode field equality; return `LOSSY_ENCODE` with no code.               |
| Exact replay is mistaken for edited export support                                  | Medium     | High   | Separate exact replay from canonical export and require fingerprints for source preservation.                |
| Decode-after-encode repeats a consistent vendor bug                                 | Medium     | Medium | Use independently expected fixture fields where available, plus synthetic edge vectors and package examples. |
| Public DTOs mirror one vendor version too closely                                   | Medium     | High   | Keep vendor-independent contracts and gate upgrades through conformance tests.                               |
| Template resolution becomes stale after catalog refresh                             | Medium     | Medium | Treat resolution as a rerunnable view with catalog version context, not immutable source truth.              |
| Skill/equipment type confusion produces plausible wrong data                        | Medium     | High   | Add kind/version discriminator and cross-kind fixtures before body decode.                                   |
| Raw equipment support expands into semantic catalog claims                          | High       | High   | Publish raw equipment envelope only and defer semantic joins to EPIC-13.                                     |
| paw-ned2 scope expands into party modeling                                          | High       | High   | Timebox ship/defer proof, publish raw-only support if gated, otherwise create EPIC-17 follow-up.             |
| Wrapper names or team metadata expose unsafe user text                              | Medium     | Medium | Bound lengths, reject structural/control characters, store as plain text only, and sanitize errors.          |
| Stateful vendor instances leak behavior across operations                           | Medium     | Medium | Use fresh instances per call and repeated/interleaved operation tests.                                       |
| Fixture provenance becomes unclear or too large                                     | Medium     | Medium | Prefer synthetic fixtures, keep MIT/package examples minimal, and document source notes per case.            |
| Compatibility boundary erodes into app/data imports                                 | Low        | High   | Enforce one-way imports with TypeScript, ESLint, and focused boundary tests.                                 |

## Security Considerations

- Treat all codes, wrappers, names, nested codes, descriptions, player fields, decoded objects,
  vendor exceptions, and catalog inputs as untrusted data.
- Enforce code-owned size and collection limits before expensive work where possible and immediately
  after dependency decode where needed.
- Use fresh vendor instances and copy accepted values into plain Build Wars objects.
- Do not evaluate strings, dynamically import user-selected code, patch globals/prototypes, interpret
  HTML, create filesystem paths from decoded text, or fetch network resources from template input.
- Do not expose raw dependency stacks, package internals, buffers, or unbounded input in public error
  results.
- Keep routine tests and runtime template operations network-free.
- Future UI must render names and metadata as escaped text; this sprint adds no UI rendering path.

## Dependencies

- SPRINT-001 / EPIC-00 for the TypeScript/Vite/Vitest foundation, domain boundary, and eight-slot
  skill-bar convention.
- SPRINT-002 / EPIC-01 for source policy, fixture provenance, and content review boundaries.
- SPRINT-004 / EPIC-03 for `TemplateProfessionId`, `TemplateAttributeId`, profession `0 -> none`,
  reserved/unsupported/unknown outcomes, and the promoted profession/attribute catalog.
- SPRINT-005 / EPIC-04 for `TemplateSkillId`, known/dispositioned/unknown skill lookup outcomes,
  unknown authored-ID preservation, and the promoted skill catalog.
- `@buildwars/gw-templates@1.1.1` as the first evaluated codec implementation, subject to Phase 1
  qualification.
- `windows-1252` only through the package and only relevant to paw-ned2 charset behavior.
- EPIC-06 owns legality and warnings, EPIC-08 owns import/editor UX, EPIC-09 owns local library and
  sharing, EPIC-13 owns semantic equipment catalogs, and EPIC-17 owns party/team editing.

## Open Questions

No open question blocks execution. Defaults for this sprint:

1. Wrapper names preserve exact safe text, including an empty string; `null` means no wrapper.
2. Exact-source replay is guaranteed only for unchanged template facts. Edited or new output must
   pass canonical encode and decode-back field equality.
3. Equipment support is raw-only in this sprint; semantic joins wait for EPIC-13.
4. No persisted `Build` or semantic `EquipmentTemplate` construction is required. Any projection
   helper must be pure, fully resolved only, and optional.
5. The repository Node floor is not raised by default. Mandatory dependency failure blocks for an
   explicit amendment.
6. paw-ned2 is optional conditional scope: ship only if bounded gates pass, otherwise defer with
   evidence and no public partial API.
7. Fixture priority is synthetic cases plus the smallest rights-compatible package examples needed
   for compatibility proof.
