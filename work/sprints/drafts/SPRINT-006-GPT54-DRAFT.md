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

This sprint turns `EPIC-05 Template Compatibility` into a framework-neutral template-codec layer
for Build Wars. It evaluates and pins `@buildwars/gw-templates@1.1.1`, adds a narrow local adapter
inside `src/domain`, and implements compatibility-tested skill and equipment template import/export
without pulling UI dialogs, local storage, rule validation, or runtime source fetching forward.

The sequencing priority is to prove the dependency boundary first, then lock the public template
contracts and unresolved-ID preservation model, then implement skill templates, then equipment
templates, then decide paw-ned2/team support from evidence instead of assumption, and only then
close docs and sprint records. That order puts the largest uncertainty, third-party codec behavior,
ahead of domain-model changes and keeps later phases from depending on guessed upstream semantics.

This sprint intentionally keeps imported template state separate from the current authored
`Build` and semantic `EquipmentTemplate` contracts when lossless resolution is not possible. Unknown
or dispositioned template IDs must survive decode and re-encode in dedicated template envelopes
instead of forcing premature widening of the authored runtime model.

## Use Cases

1. A player pastes a Guild Wars skill code or named chat wrapper and Build Wars decodes it into a
   lossless, typed template envelope while preserving unresolved profession, attribute, or skill
   IDs.
2. A caller with a fully resolved Build Wars build can export a canonical Guild Wars skill template
   code without touching UI or storage features.
3. A player pastes an equipment template code and Build Wars preserves raw item, modifier, and dye
   IDs even though the semantic equipment catalogs are not complete yet.
4. A future UI or import flow can distinguish `known`, `none`, `reserved`, `unsupported`,
   `dispositioned`, and `unknown` template-ID outcomes instead of collapsing everything into `null`.
5. A maintainer can diagnose malformed wrappers, invalid base64, wrong headers, and upstream codec
   failures through stable typed errors instead of leaked dependency exceptions.
6. A compatibility suite can prove semantic round trips for known real codes and synthetic edge
   cases even when the upstream encoder normalizes to a different but equivalent string.
7. Later epics can consume the domain codec surface only; they do not need Python ingestion
   modules, generated manifests, QA JSON, or runtime wiki access to import/export templates.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Domain codec surface | Plain-data template contracts, wrapper parsing, typed errors, pure resolution helpers, and import/export functions under `src/domain`. | React state, browser storage, import dialogs, clipboard UX, routing, or attribution UI. |
| Dependency boundary | One pinned `@buildwars/gw-templates` adapter with local typing and fixture proof. | Hand-rolled bitstream parsers, direct package calls spread through the app, or untyped `any` escape hatches. |
| Skill templates | Primary/secondary profession IDs, attribute allocations, eight skill slots, wrapper names, canonical export, and unresolved-ID preservation. | Rule-engine legality, effective rank calculation, PvE/PvP validation policy, or UI error presentation. |
| Equipment templates | Raw slot/item/modifier/dye facts and canonical export at the codec layer. | Semantic item joins, inventory editing, rune/insignia validation, or completed equipment catalogs. |
| Team templates | Bounded paw-ned2/team support only if the adapter and fixtures prove stable. | Party-builder UI, hero AI modeling, local team-library features, or speculative half-support. |
| Verification | Focused Vitest suites, minimized compatibility fixtures, build validation, and repo record updates. | Live network verification, runtime wiki fetching, or copied broad source prose. |

### Locked Decisions

- `@buildwars/gw-templates@1.1.1` is the first implementation path. The sprint may add local
  shims and wrappers, but it must not ship a second hand-rolled parser when the dependency proof is
  incomplete.
- The public import surface is a dedicated template envelope, not a widened `Build`. Decoded skill
  templates keep raw template IDs plus optional resolved catalog IDs and lookup outcomes.
- Skill ID resolution uses the promoted EPIC-03 and EPIC-04 catalogs through existing lookup
  helpers only. Runtime template code must not read manifests, QA reports, snapshots, or
  `scripts/data`.
- Equipment templates stay raw and slot-oriented in version 1. The sprint does not guess semantic
  item, rune, insignia, or modifier records from incomplete catalogs.
- Export correctness is semantic, not byte-for-byte. If the upstream encoder canonicalizes to a
  different but equivalent string, the success condition is decode/encode/decode equivalence plus
  documented normalization behavior.
- Wrapper names and raw codes are untrusted input. Parsing must stay bounded, string-only, and
  side-effect free.

### Compatibility Flow

```text
raw code or named chat wrapper
  -> bounded wrapper parser
  -> codec kind detection
  -> local @buildwars/gw-templates adapter
  -> raw decoded template facts
  -> EPIC-03 / EPIC-04 catalog resolution where applicable
  -> lossless template envelope + typed warnings/errors
  -> optional projection to current authored shapes when fully resolvable
  -> canonical encoder
  -> raw code or named chat wrapper
```

### Compatibility Authority

| Fact | Primary Authority | Cross-Check | Conflict Handling |
| --- | --- | --- | --- |
| Skill-template bit layout and header behavior | `@buildwars/gw-templates` adapter behavior and Guild Wars template-format expectations | Known real codes and EPIC-03/EPIC-04 lookup results | Preserve raw IDs, emit typed errors or warnings, and never silently rewrite unresolved values. |
| Equipment-template slot and numeric field behavior | `@buildwars/gw-templates` adapter behavior and equipment-format expectations | Known real codes and synthetic edge fixtures | Keep raw numeric facts only; unsupported fields stay explicit instead of guessed semantic records. |
| Chat wrapper syntax and name handling | Existing Guild Wars chat-code conventions | Wrapper fixtures for empty names, malformed separators, and whitespace normalization | Reject malformed wrappers with stable parse errors; preserve or sanitize valid names deterministically. |
| Canonical output strings | Upstream encoder output | Decode/encode/decode semantic equivalence | Byte differences are acceptable only when the semantic envelope is identical after re-decode. |
| paw-ned2/team layout | Upstream adapter behavior and committed fixtures | Member-level skill/equipment round trips | If the surface is unstable or under-specified, defer explicitly instead of shipping partial support. |

## Implementation

### Phase 0: Traceability And Baseline Inputs (~5% of effort)

**Files:**

- `work/tickets/05-template-compatibility/BW-0501-*.md` through `BW-0506-*.md`
- `work/tickets/05-template-compatibility/EPIC.md`
- `work/sprints/SPRINT-006.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Create BW-0501 through BW-0506 ticket files and link them to `SPRINT-006`.
- [ ] Confirm `EPIC-03` and `EPIC-04` are complete and that the promoted runtime catalogs are the
      only catalog inputs used by template resolution work.
- [ ] Record the compatibility-fixture plan early, including which committed real codes need
      provenance notes and which cases can stay synthetic.
- [ ] Capture the current baseline validation state before implementation so later failures are
      attributable to this sprint.

**Verification:**

- `python3 scripts/test_ticket_burn.py`
- `npm run typecheck`

**Phase Gate:** Ticket traceability, runtime-catalog inputs, and fixture ownership are clear before
dependency or domain changes begin.

### Phase 1: BW-0501 Dependency Evaluation, Adapter Proof, And Feasibility Gate (~15% of effort)

**Files:**

- `package.json`
- `package-lock.json`
- `tsconfig.domain.json`
- `src/domain/gw-templates.d.ts`
- `src/domain/template-adapter.ts`
- `src/domain/index.ts`
- `test/domain/template-adapter.test.ts`
- `work/tickets/05-template-compatibility/BW-0501-gw-templates-evaluation-and-adapter.md`

**Tasks:**

- [ ] Add pinned `@buildwars/gw-templates@1.1.1` as the only codec dependency for this sprint.
- [ ] Prove the package can be imported from `src/domain` under `moduleResolution: "Bundler"` and
      the existing Vite build without CJS/ESM surprises.
- [ ] Add a narrow local adapter that exposes only the skill, equipment, and team operations the
      sprint actually needs.
- [ ] If the package lacks usable TypeScript declarations, add a repo-local declaration boundary so
      the rest of the domain surface stays typed and `any` does not leak past the adapter.
- [ ] Add smoke tests that exercise at least one known skill code, one known equipment code, and
      the bounded paw-ned2/team probe through the adapter.
- [ ] Record upstream normalization behavior, thrown-error shapes, and unsupported cases in the
      ticket notes and adapter tests.
- [ ] Block the sprint here if the dependency cannot be consumed reliably; do not respond by
      hand-rolling a second parser inside the same sprint.

**Verification:**

- `npm run typecheck`
- `npm run build`
- `npm run test:run -- test/domain/template-adapter.test.ts`

**Phase Gate:** The dependency works end-to-end in the repo, the local adapter is stable, and the
paw-ned2/team go or no-go decision is recorded before public contracts depend on it.

### Phase 2: BW-0502 Shared Template Contracts, Wrappers, And Resolution Model (~15% of effort)

**Files:**

- `src/domain/template.ts`
- `src/domain/template-chat.ts`
- `src/domain/template-resolve.ts`
- `src/domain/index.ts`
- `test/domain/template-contracts.test.ts`
- `test/domain/template-chat.test.ts`
- `test/fixtures/template-compatibility/`
- `work/tickets/05-template-compatibility/BW-0502-template-contracts-and-resolution.md`

**Tasks:**

- [ ] Define public contracts for template kinds, wrapper names, decode results, encode inputs,
      typed warnings, and typed error codes.
- [ ] Introduce a lossless decoded skill-template envelope that stores raw template IDs, ordered
      attribute allocations, eight skill slots, optional wrapper name, and per-field resolution
      outcomes.
- [ ] Introduce a raw decoded equipment-template envelope that stores slot/item/modifier/dye facts
      without assuming semantic catalog joins.
- [ ] Add bounded parsing and emission for raw codes and `[Name;CODE]` chat wrappers, including
      empty-name rejection, delimiter validation, and deterministic whitespace handling.
- [ ] Add pure resolution helpers that map profession, attribute, and skill template IDs through
      the promoted EPIC-03 and EPIC-04 lookups and preserve `known`, `none`, `reserved`,
      `unsupported`, `dispositioned`, and `unknown` results explicitly.
- [ ] Freeze the rule that canonical export success is semantic equivalence after re-decode, not
      byte identity with the original input string.
- [ ] Keep every public contract JSON-compatible and framework-neutral.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/template-contracts.test.ts test/domain/template-chat.test.ts`

**Phase Gate:** Later codec phases can build against one stable public contract and one stable
wrapper policy without widening `Build` or guessing how unresolved IDs should behave.

### Phase 3: BW-0503 Skill Template Import, Export, And Build Projection (~25% of effort)

**Files:**

- `src/domain/template-skill.ts`
- `src/domain/template-build.ts`
- `src/domain/template-resolve.ts`
- `src/domain/index.ts`
- `test/domain/skill-template-codec.test.ts`
- `test/domain/template-build.test.ts`
- `test/fixtures/template-compatibility/skills/`
- `work/tickets/05-template-compatibility/BW-0503-skill-template-import-export.md`

**Tasks:**

- [ ] Decode skill template codes into the shared lossless envelope with primary and secondary
      profession template IDs, ordered attribute allocations, exactly eight skill slots, optional
      wrapper name, and raw input evidence.
- [ ] Resolve decoded skill-template IDs through EPIC-03 and EPIC-04 helpers while preserving raw
      numeric IDs and explicit lookup outcomes for unresolved or dispositioned values.
- [ ] Add pure projection helpers that convert a fully resolved decoded envelope into current
      authored build shapes only when the required fields resolve losslessly.
- [ ] Keep partially resolved or unresolved imports in the template envelope rather than forcing
      `Build` to accept ambiguous catalog IDs.
- [ ] Encode from the decoded envelope and from a fully resolved build-shaped input; reject export
      when required template fields are missing, contradictory, or lossy.
- [ ] Accept raw codes and named chat wrappers on input; preserve valid wrapper names and emit
      sanitized wrappers deterministically on output.
- [ ] Add fixtures for known real codes, profession `0`, unknown profession or attribute IDs,
      unknown or dispositioned skill IDs, invalid base64, wrong headers, malformed slot counts, and
      canonicalization that changes the output string while preserving meaning.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/skill-template-codec.test.ts test/domain/template-build.test.ts`
- `npm run build`

**Phase Gate:** Known skill codes round-trip semantically, unresolved IDs survive decode and
re-encode, and callers receive typed errors instead of dependency exceptions.

### Phase 4: BW-0504 Equipment Template Import And Export (~20% of effort)

**Files:**

- `src/domain/template-equipment.ts`
- `src/domain/template-chat.ts`
- `src/domain/index.ts`
- `test/domain/equipment-template-codec.test.ts`
- `test/fixtures/template-compatibility/equipment/`
- `work/tickets/05-template-compatibility/BW-0504-equipment-template-import-export.md`

**Tasks:**

- [ ] Decode equipment template codes into a raw numeric envelope for armor slots, weapon sets,
      item IDs, modifier IDs, requirement attributes, and dye colors as exposed by the upstream
      codec.
- [ ] Keep the raw equipment codec surface independent from the current semantic
      `EquipmentTemplate`; do not invent item, rune, insignia, or modifier catalog records before
      the relevant equipment epics complete.
- [ ] Preserve unknown or unsupported numeric IDs verbatim and surface unsupported field
      combinations as typed warnings or errors instead of dropping them.
- [ ] Encode raw equipment envelopes back to accepted template codes and named chat wrappers.
- [ ] Add fixtures for empty slots, off-hand and two-handed edge cases, unknown item or modifier
      IDs, invalid dye values, malformed headers, and canonicalization differences.
- [ ] Document any upstream equipment fields that version 1 cannot expose cleanly and keep them out
      of the public API until they are modeled explicitly.

**Verification:**

- `npm run typecheck`
- `npm run test:run -- test/domain/equipment-template-codec.test.ts`
- `npm run build`

**Phase Gate:** Equipment codecs are lossless at the raw numeric layer and remain decoupled from
unfinished semantic equipment catalogs.

### Phase 5: BW-0505 paw-ned2/Team Support Or Explicit Deferral (~10% of effort)

**Files:**

- `src/domain/template-team.ts`
- `src/domain/template-skill.ts`
- `src/domain/template-equipment.ts`
- `src/domain/index.ts`
- `test/domain/team-template-codec.test.ts`
- `test/fixtures/template-compatibility/team/`
- `work/tickets/05-template-compatibility/BW-0505-team-template-feasibility.md`

**Tasks:**

- [ ] Use the Phase 1 feasibility result to either implement a bounded team-template codec or
      explicitly defer it with evidence.
- [ ] If implemented, decode and encode up to 12 team members with labels, enabled flags, and
      embedded skill and equipment template payloads without losing unknown member-level values.
- [ ] Reuse the phase-3 and phase-4 codec surfaces instead of duplicating skill or equipment logic
      inside the team path.
- [ ] If deferred, complete BW-0505 with concrete blocker evidence, fixture gaps, and a recommended
      follow-up boundary; do not leave a half-supported public API behind.
- [ ] Keep any implemented team surface framework-neutral and separate from `PartyBuild` UI and
      editor concerns.

**Verification:**

- If implemented: `npm run test:run -- test/domain/team-template-codec.test.ts`
- If deferred: manual review that no public team codec export ships and BW-0505 records the
  evidence and follow-up path

**Phase Gate:** Team support is either delivered with fixtures or explicitly deferred with no
ambiguous middle state.

### Phase 6: BW-0506 Fixtures, Docs, Verification, And Closeout (~10% of effort)

**Files:**

- `README.md`
- `compendium/template-compatibility.md`
- `test/fixtures/template-compatibility/`
- `work/tickets/05-template-compatibility/BW-0506-docs-verification-and-closeout.md`
- `work/tickets/05-template-compatibility/EPIC.md`
- `work/sprints/SPRINT-006.md`
- `work/sprints/ledger.tsv`

**Tasks:**

- [ ] Document the adapter boundary, canonicalization policy, unresolved-ID preservation model, and
      any explicit paw-ned2/team deferral decision.
- [ ] Record provenance and minimal review notes for any committed real template codes or wrapper
      examples under the existing source-policy rules.
- [ ] Update repo docs so runtime consumers are directed to the domain codec surface only, not
      Python ingestion modules, manifests, QA reports, or future UI flows.
- [ ] Run the full validation pass only after the focused template suites are green and no
      Definition of Done item remains actionable.
- [ ] Update EPIC-05, BW-0501 through BW-0506, `SPRINT-006`, and `work/sprints/ledger.tsv`
      consistently.

**Verification:**

- `npm run verify`
- `python3 scripts/test_ticket_burn.py`

**Phase Gate:** Documentation, fixtures, sprint records, and repository validation all match the
implemented codec behavior.

## Files Summary

| Path | Purpose |
| --- | --- |
| `package.json` and `package-lock.json` | Pin `@buildwars/gw-templates@1.1.1` and keep dependency state reproducible |
| `tsconfig.domain.json` | Ensure the domain build includes any local declaration boundary needed for the codec dependency |
| `src/domain/gw-templates.d.ts` | Repo-local typing shim if the upstream package does not provide usable declarations |
| `src/domain/template-adapter.ts` | Narrow wrapper around the third-party codec surface |
| `src/domain/template.ts`, `template-chat.ts`, and `template-resolve.ts` | Shared template contracts, wrapper parsing, and catalog-resolution helpers |
| `src/domain/template-skill.ts` | Skill template decode, encode, and lossless skill-envelope behavior |
| `src/domain/template-build.ts` | Pure projection helpers from resolved skill-template envelopes into current authored build shapes |
| `src/domain/template-equipment.ts` | Raw equipment-template codec surface separate from semantic equipment models |
| `src/domain/template-team.ts` | paw-ned2/team codec support or bounded feasibility surface |
| `src/domain/index.ts` | Public export surface for the template layer |
| `test/domain/*template*.test.ts` | Adapter, contract, wrapper, skill, equipment, and possible team compatibility tests |
| `test/fixtures/template-compatibility/` | Minimized known-good and invalid template fixtures plus provenance notes where required |
| `README.md` | Setup, scope, and validation updates for template compatibility |
| `compendium/template-compatibility.md` | Durable design notes on adapter boundaries, normalization, and unresolved-ID policy |
| `work/tickets/05-template-compatibility/BW-0501*.md` through `BW-0506*.md` | Ticket slices, evidence, and closeout records for `SPRINT-006` |
| `work/tickets/05-template-compatibility/EPIC.md` | Epic status and sprint linkage |
| `work/sprints/SPRINT-006.md` | Final execution checklist and sprint status record |
| `work/sprints/ledger.tsv` | Sprint lifecycle tracking |

## Definition of Done

- [ ] `@buildwars/gw-templates@1.1.1` is pinned and consumed only through a local adapter under
      `src/domain`.
- [ ] The domain compile and build paths remain typed; the third-party dependency does not leak
      ambient `any` or raw thrown exceptions through the public API.
- [ ] Shared template contracts exist for raw codes, named wrappers, typed errors, decoded skill
      envelopes, decoded equipment envelopes, and explicit resolution outcomes.
- [ ] The current authored `Build` and semantic `EquipmentTemplate` contracts are not widened just
      to carry unresolved template state; lossless template envelopes own that responsibility.
- [ ] Skill template decode accepts raw codes and valid chat wrappers and always yields exactly
      eight skill slots plus explicit profession and attribute allocation data.
- [ ] Skill template resolution distinguishes `known`, `none`, `reserved`, `unsupported`,
      `dispositioned`, and `unknown` outcomes using EPIC-03 and EPIC-04 lookup helpers.
- [ ] Unknown or dispositioned skill template IDs are never silently dropped or coerced away during
      decode, resolution, or re-encode.
- [ ] Known skill template fixtures pass decode/encode/decode semantic round-trip tests even when
      canonical output differs textually from the original input.
- [ ] Equipment template decode and encode work at the raw numeric slot, item, modifier, and dye
      layer without depending on unfinished equipment catalogs.
- [ ] Unknown or unsupported equipment numeric IDs are preserved or explicitly rejected with typed
      errors; they are not silently mapped into semantic equipment records.
- [ ] Invalid base64, wrong headers, malformed wrappers, malformed slot counts, and upstream codec
      failures surface as typed domain errors with stable codes and useful messages.
- [ ] paw-ned2/team support is either implemented behind the same adapter boundary with fixture
      coverage or explicitly deferred through BW-0505 with documented evidence and no partial public
      API.
- [ ] Committed compatibility fixtures are minimized, provenance-bearing where needed, and limited
      to the smallest useful real codes or synthetic cases.
- [ ] `README.md`, `compendium/template-compatibility.md`, EPIC-05, BW-0501 through BW-0506,
      `work/sprints/SPRINT-006.md`, and `work/sprints/ledger.tsv` are internally consistent.
- [ ] No hand-rolled bitstream parser ships as an unapproved fallback path.
- [ ] `npm run typecheck`, focused template Vitest suites, `npm run build`, `npm run verify`, and
      `python3 scripts/test_ticket_burn.py` pass.

## Risks

- The upstream package may have bundler or declaration gaps that are not obvious from npm metadata.
  Mitigation: phase-1 adapter proof and a hard block before deeper domain work.
- The encoder may canonicalize to a different but equivalent string, which can look like a
  regression if the sprint expects byte identity. Mitigation: semantic round-trip tests and an
  explicit normalization policy.
- The current `Build` model may tempt destructive widening to carry unresolved template state.
  Mitigation: keep a separate lossless template envelope and gate that decision in phase 2.
- Equipment templates may expose raw fields that do not map cleanly to the current semantic
  equipment model. Mitigation: keep version 1 raw and slot-oriented, and defer semantic joins.
- Real compatibility fixtures can create provenance and review overhead. Mitigation: commit the
  smallest useful corpus and keep the rest synthetic.
- paw-ned2/team scope can balloon because it composes skill and equipment payloads. Mitigation:
  decide feasibility early and defer explicitly instead of leaving partial support.

## Security

- Treat all incoming codes and wrapper names as untrusted strings; bound parsing, reject malformed
  wrappers, and avoid any dynamic evaluation.
- Do not render wrapper names or decoded values as HTML or execute any source-provided text.
- Normalize third-party exceptions into typed domain errors so stack traces and raw dependency
  internals do not become part of the public interface.
- Keep the codec layer pure and local-only. No runtime network I/O, source fetching, storage, or
  analytics are introduced by this sprint.
- Keep committed real codes and excerpts minimal and provenance-bearing under the existing
  source-policy rules.

## Dependencies

- Internal prerequisites: `EPIC-03` and `EPIC-04` must remain complete because they provide the
  template profession, attribute, and skill lookup authority used by skill-template resolution.
- External dependency: `@buildwars/gw-templates@1.1.1` is the required first implementation path
  for bitstream decode and encode behavior.
- Tooling prerequisites: the existing Node.js and npm baselines from `README.md`, plus Python for
  `scripts/test_ticket_burn.py`.
- Team-format implementation, if approved, depends on the phase-1 feasibility result and the phase-3
  and phase-4 skill and equipment codec surfaces.
- This sprint directly unblocks later UI, rule-engine, sharing, and party-builder work in
  `EPIC-06`, `EPIC-08`, `EPIC-09`, `EPIC-14`, and `EPIC-17`.

## Open Questions

1. Should export preserve the original wrapper-name spelling and whitespace exactly when the name is
   valid, or should version 1 emit a normalized wrapper name?
2. If the upstream equipment or team codec exposes raw fields outside the planned public contract,
   should version 1 reject those cases or retain them in an explicit passthrough bucket?
3. What is the smallest committed set of real skill, equipment, and possible team codes that still
   provides durable compatibility coverage without expanding source-policy review unnecessarily?
