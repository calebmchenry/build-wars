---
id: SPRINT-001
title: Project Foundation
status: completed
source_target: BACKLOG
source_epic: EPIC-00
source_epic_path: work/tickets/00-project-foundation/EPIC.md
tickets:
  - BW-0001
  - BW-0002
  - BW-0003
  - BW-0004
created: 2026-09-01
completed: 2026-09-01
---

# Sprint 001: Project Foundation

## Overview

Build Wars is still before its first application scaffold. This sprint turns EPIC-00 into a runnable local TypeScript web foundation with documented conventions, an enforceable domain boundary, a minimal fixture/data layout, and ticket-burn traceability.

The chosen foundation is a single private npm package using React, Vite, TypeScript, Vitest, ESLint, and Prettier. The domain starts in `src/domain` as plain JSON-compatible TypeScript contracts; package/workspace extraction is deferred until there is a second runtime consumer, an independent release lifecycle, or real tooling conflicts. The product remains local-only in this sprint.

This sprint does not implement template parsing, Guild Wars Wiki ingestion, rule validation, local-storage libraries, build editing workflows, equipment editing, party building, PWA behavior, hosted sharing, authentication, analytics, deployment, or a polished in-game visual system.

## Use Cases

1. **Run the app locally**: A contributor can clone the repo, install dependencies, start the development server, and see a minimal Build Wars application shell.
2. **Verify the repo**: A contributor or automation runner can use one documented command to run formatting checks, linting, type checking, tests, production build, and existing ticket-burn tests.
3. **Extend domain logic safely**: Later epics can add template compatibility, game rules, equipment, parties, guides, and storage around a framework-neutral domain boundary.
4. **Add data tooling later**: Future ingestion work has reserved places for scripts, source snapshots, normalized generated data, and QA reports without coupling raw data to the UI.
5. **Trace EPIC-00 execution**: Ticket-burn and human readers can connect `SPRINT-001` to EPIC-00 and BW-0001 through BW-0004.

## Architecture

### Decisions

- Use a single private npm package for SPRINT-001.
- Use `package-lock.json` and `npm ci` for reproducible installs.
- Use React + Vite + TypeScript for the local browser app.
- Use Vitest for domain and app tests, with jsdom only where React rendering needs it.
- Use ESLint and TypeScript configuration to protect domain boundaries.
- Keep `src/domain` free of React, browser storage, DOM APIs, network access, and ingestion code.
- Reserve `scripts/data/` for future ingestion and data QA scripts.
- Reserve `data/source-snapshots/`, `data/generated/`, and `data/qa/` for future raw, normalized, and QA artifacts.
- Keep foundation fixtures synthetic and non-authoritative until source policy is defined by EPIC-01.

### Dependency Direction

```text
src/app
  -> src/domain

scripts/data
  -> src/domain
  -> data/source-snapshots
  -> data/generated
  -> data/qa

src/domain
  -> no React, DOM, browser storage, network, or data-script imports
```

The browser app may import public domain contracts. The domain must not import app modules. Future data scripts may depend on domain contracts, but app code must not consume raw source snapshots directly.

### Domain Boundary

The initial domain surface should be concrete enough for later epics to extend but thin enough to avoid encoding unresearched game behavior.

Required characteristics:

- Core model exports for `Profession`, `Attribute`, `Skill`, `SkillProgression`, `Rune`, `Insignia`, `ArmorPiece`, `Weapon`, `WeaponModifier`, `Build`, `EquipmentTemplate`, `PartyBuild`, `Guide`, and source/provenance metadata.
- Catalog identifiers remain numeric or branded primitives, not closed enums.
- Authored root documents include `schemaVersion`.
- Authored builds can retain a catalog/data version reference.
- `Build.skillBar` represents exactly eight nullable skill slots.
- Unknown numeric catalog IDs remain representable and survive JSON serialization.
- Serializable domain data uses plain objects, arrays, primitives, and `null`; no classes, functions, `Date`, `Map`, `Set`, or React objects.
- Full parser behavior, runtime JSON validation, game legality rules, storage migrations, and calculated build statistics are deferred.

### Verification Contract

`npm run verify` is the canonical repository verification command for this sprint. It should run, in order or equivalent:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:run
npm run build
python3 -m unittest scripts/test_ticket_burn.py
```

The implementation may keep focused scripts such as `dev`, `build`, `lint`, `typecheck`, `test`, and `test:run`, but `verify` is the command future automation should rely on after SPRINT-001.

## Implementation

### Phase 1: Traceability And Planning Records (~10% of effort)

**Files:**

- `work/tickets/00-project-foundation/BW-0001-app-scaffold-toolchain.md` - scaffold and toolchain ticket
- `work/tickets/00-project-foundation/BW-0002-domain-boundaries.md` - domain boundary ticket
- `work/tickets/00-project-foundation/BW-0003-data-fixture-layout.md` - data and fixture ticket
- `work/tickets/00-project-foundation/BW-0004-docs-verification-records.md` - docs, verification, and records ticket
- `work/tickets/00-project-foundation/EPIC.md` - EPIC-00 sprint linkage and final status
- `work/sprints/ledger.tsv` - sprint ledger
- `work/sprints/SPRINT-001.md` - sprint state during execution

**Tasks:**

- [x] Preserve the four BW ticket files and keep them linked to `EPIC-00` and `SPRINT-001`.
- [x] Initialize or sync `work/sprints/ledger.tsv` so it contains `SPRINT-001`.
- [x] During execution, mark `SPRINT-001` and relevant BW tickets `in-progress` before implementation work starts.
- [x] During closeout, mark tickets done only after their acceptance criteria pass.
- [x] Mark EPIC-00 done only after the full sprint Definition of Done passes.

### Phase 2: App Scaffold And Toolchain (~30% of effort)

**Files:**

- `.gitignore` - Node, build, coverage, env, and data artifact ignore rules
- `.nvmrc` - selected Node baseline compatible with the local environment and Vite toolchain
- `.npmrc` - npm behavior and engine consistency
- `package.json` - private package metadata, dependencies, scripts, and engine/package-manager metadata
- `package-lock.json` - reproducible dependency lockfile
- `index.html` - Vite entrypoint
- `vite.config.ts` - Vite and Vitest configuration
- `tsconfig.json` - root TypeScript configuration
- `tsconfig.app.json` - browser app TypeScript configuration if useful
- `tsconfig.node.json` - config/tooling TypeScript configuration if useful
- `eslint.config.js` - lint and boundary rules
- `.prettierrc.json` - format convention
- `.prettierignore` - generated/log/binary/reference exclusions
- `src/main.tsx` - browser bootstrap
- `src/app/App.tsx` - minimal application shell
- `src/app/App.test.tsx` - app smoke test
- `src/app/styles.css` - restrained starter styling
- `src/test/setup.ts` - jsdom test setup

**Tasks:**

- [x] Create a private npm TypeScript app scaffold without replacing existing roadmap or ticket docs.
- [x] Add scripts for `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:run`, `format`, `format:check`, and `verify`.
- [x] Configure strict TypeScript settings suitable for future domain and UI work.
- [x] Configure ESLint and Prettier with scoped ignores for generated/log/binary material.
- [x] Render a minimal accessible Build Wars app shell without creating a landing page, full editor, router, persistence, remote fetches, or demo feature workflow.
- [x] Add an app smoke test that proves the shell renders and can import the public domain boundary.
- [x] Use `npm ci` after dependency resolution to verify the lockfile path works.

### Phase 3: Domain Contracts And Boundary Enforcement (~25% of effort)

**Files:**

- `src/domain/ids.ts` - shared ID/value types
- `src/domain/source.ts` - source provenance and catalog/data version contracts
- `src/domain/catalog.ts` - profession, attribute, skill, progression, rune, and insignia contracts
- `src/domain/equipment.ts` - armor, weapon, modifier, and equipment template contracts
- `src/domain/build.ts` - build, attribute allocation, game mode, and eight-slot skill bar contracts
- `src/domain/party.ts` - minimal party build and slot contracts
- `src/domain/guide.ts` - minimal guide and section contracts
- `src/domain/index.ts` - public domain exports
- `src/domain/domain.test.ts` or `test/domain/contracts.test.ts` - domain contract tests

**Tasks:**

- [x] Add framework-neutral public domain contracts for every model named by EPIC-00.
- [x] Keep domain contracts plain-data and JSON-compatible.
- [x] Represent catalog IDs without closed enums.
- [x] Add schema-version and catalog-version fields where authored roots need future migration and data freshness awareness.
- [x] Represent `Build.skillBar` as exactly eight nullable skill ID slots.
- [x] Add tests for public exports, JSON round-tripping, unknown numeric ID preservation, and the eight-slot invariant.
- [x] Enforce that domain code cannot import React, app modules, browser APIs, storage adapters, network clients, or data scripts.
- [x] Do not implement template codecs, full validation services, local storage, data fetching, equipment legality, party behavior, guide rendering, or calculated statistics.

### Phase 4: Data And Fixture Layout (~15% of effort)

**Files:**

- `scripts/data/README.md` - future ingestion and QA script boundary
- `data/README.md` - data artifact index
- `data/source-snapshots/README.md` - future raw snapshot policy placeholder
- `data/generated/README.md` - future generated-data policy placeholder
- `data/qa/README.md` - future QA report policy placeholder
- `test/fixtures/foundation.ts` or equivalent - synthetic foundation fixtures
- `.gitignore` - tracked README exceptions for ignored data directories

**Tasks:**

- [x] Document the future ingestion flow as fetch, snapshot, normalize, validate, and publish.
- [x] Keep future raw snapshots, generated data, and QA reports in separate documented directories.
- [x] Add ignore rules that ignore generated/raw contents while preserving tracked README policy files.
- [x] Add only synthetic fixtures needed for foundation tests.
- [x] Label fixtures as non-authoritative and unsuitable for Guild Wars correctness assertions.
- [x] Defer real wiki/PvX content, icons, template strings, invalid template examples, PvE/PvP split cases, rune edge cases, and rule fixtures to later epics.

### Phase 5: Documentation, Verification, And Closeout (~20% of effort)

**Files:**

- `README.md` - setup, commands, current scope, and project layout
- `compendium/README.md` - compendium index
- `compendium/project-foundation.md` or `compendium/decisions/0001-project-foundation.md` - foundation decision record
- `work/tickets/00-project-foundation/*.md` - execution status updates
- `work/sprints/SPRINT-001.md` - final checked task state after execution
- `work/sprints/ledger.tsv` - final sprint status after execution

**Tasks:**

- [x] Document prerequisites, install, dev, build, test, and verify commands.
- [x] Record the single-package local-first architecture decision and extraction triggers.
- [x] Document module ownership, import direction, data/fixture policy, and deferred scope.
- [x] Run `npm run verify`.
- [x] Run `python3 -m unittest scripts/test_ticket_burn.py` directly if it is not already included in `npm run verify`.
- [x] Verify tracked data README files are not hidden by ignore rules.
- [x] Update BW ticket, EPIC, sprint, and ledger statuses consistently.
- [x] Leave no actionable unchecked sprint checklist items when execution reports completion.

## Files Summary

| File                                                                                    | Action        | Purpose                                                             |
| --------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------- |
| `.gitignore`                                                                            | Modify        | Ignore Node/build/test/data artifacts while preserving policy files |
| `.nvmrc`                                                                                | Create        | Document selected Node baseline                                     |
| `.npmrc`                                                                                | Create        | Enforce npm/engine behavior where practical                         |
| `package.json`                                                                          | Create        | Private npm package, scripts, dependencies, engines                 |
| `package-lock.json`                                                                     | Create        | Reproducible dependency graph                                       |
| `index.html`                                                                            | Create        | Vite browser entrypoint                                             |
| `vite.config.ts`                                                                        | Create        | Vite and Vitest configuration                                       |
| `tsconfig.json`                                                                         | Create        | Root TypeScript settings                                            |
| `tsconfig.app.json`                                                                     | Create        | Browser TypeScript settings if split config is used                 |
| `tsconfig.node.json`                                                                    | Create        | Tooling TypeScript settings if needed                               |
| `eslint.config.js`                                                                      | Create        | Lint and import-boundary enforcement                                |
| `.prettierrc.json`                                                                      | Create        | Formatting convention                                               |
| `.prettierignore`                                                                       | Create        | Formatting exclusions                                               |
| `src/main.tsx`                                                                          | Create        | Browser app bootstrap                                               |
| `src/app/App.tsx`                                                                       | Create        | Minimal app shell                                                   |
| `src/app/App.test.tsx`                                                                  | Create        | App render smoke test                                               |
| `src/app/styles.css`                                                                    | Create        | Starter app styling                                                 |
| `src/test/setup.ts`                                                                     | Create        | jsdom test setup                                                    |
| `src/domain/ids.ts`                                                                     | Create        | ID/value type definitions                                           |
| `src/domain/source.ts`                                                                  | Create        | Provenance and catalog version contracts                            |
| `src/domain/catalog.ts`                                                                 | Create        | Profession, attribute, skill, rune, insignia contracts              |
| `src/domain/equipment.ts`                                                               | Create        | Armor, weapon, modifier, equipment template contracts               |
| `src/domain/build.ts`                                                                   | Create        | Build and eight-slot skill bar contracts                            |
| `src/domain/party.ts`                                                                   | Create        | Minimal party build contracts                                       |
| `src/domain/guide.ts`                                                                   | Create        | Minimal guide contracts                                             |
| `src/domain/index.ts`                                                                   | Create        | Public domain export surface                                        |
| `src/domain/domain.test.ts` or `test/domain/contracts.test.ts`                          | Create        | Domain contract and serialization tests                             |
| `test/fixtures/foundation.ts`                                                           | Create        | Synthetic foundation fixtures                                       |
| `scripts/data/README.md`                                                                | Create        | Future ingestion tooling boundary                                   |
| `data/README.md`                                                                        | Create        | Data artifact index                                                 |
| `data/source-snapshots/README.md`                                                       | Create        | Raw snapshot policy placeholder                                     |
| `data/generated/README.md`                                                              | Create        | Generated-data policy placeholder                                   |
| `data/qa/README.md`                                                                     | Create        | QA report policy placeholder                                        |
| `README.md`                                                                             | Modify        | Setup, scope, layout, and verification docs                         |
| `compendium/README.md`                                                                  | Modify        | Documentation index                                                 |
| `compendium/project-foundation.md` or `compendium/decisions/0001-project-foundation.md` | Create        | Foundation architecture decision record                             |
| `work/tickets/00-project-foundation/EPIC.md`                                            | Modify        | Sprint linkage and final epic status                                |
| `work/tickets/00-project-foundation/BW-0001-app-scaffold-toolchain.md`                  | Create/Modify | Scaffold ticket                                                     |
| `work/tickets/00-project-foundation/BW-0002-domain-boundaries.md`                       | Create/Modify | Domain ticket                                                       |
| `work/tickets/00-project-foundation/BW-0003-data-fixture-layout.md`                     | Create/Modify | Data/fixture ticket                                                 |
| `work/tickets/00-project-foundation/BW-0004-docs-verification-records.md`               | Create/Modify | Docs/verification ticket                                            |
| `work/sprints/ledger.tsv`                                                               | Create/Modify | Sprint planning and execution status                                |
| `work/sprints/SPRINT-001.md`                                                            | Modify        | Sprint execution checklist and status                               |

## Definition of Done

- [x] A single private npm TypeScript web app scaffold exists and installs with `npm ci`.
- [x] `npm run dev` starts the local app.
- [x] `npm run build` succeeds.
- [x] `npm run typecheck` succeeds.
- [x] `npm run lint` succeeds.
- [x] `npm run format:check` succeeds.
- [x] `npm run test:run` succeeds.
- [x] `npm run verify` is documented and succeeds.
- [x] `npm run verify` includes `python3 -m unittest scripts/test_ticket_burn.py`, or that Python command is run and documented as a separate required closeout command.
- [x] The app shell renders accessibly and imports the public domain boundary without adding feature UI.
- [x] `src/domain` exports the initial model contracts named by EPIC-00.
- [x] Domain contracts are plain-data/JSON-compatible and do not import React, browser APIs, storage, network clients, app modules, or data scripts.
- [x] Tests cover schema versioning, exactly eight nullable skill slots, unknown numeric ID preservation, and JSON round-tripping.
- [x] Source snapshots, generated data, QA reports, and foundation fixtures have separate documented locations.
- [x] Future raw/generated data contents are ignored while policy README files remain trackable.
- [x] No real Guild Wars Wiki/PvX content, icons, template-code examples, parser logic, rule validation, local storage, backend, hosted sharing, auth, analytics, service worker, or deployment target is added.
- [x] README and compendium docs match the implemented commands and layout.
- [x] BW-0001 through BW-0004 exist, link to EPIC-00 and SPRINT-001, and are marked done only after their acceptance criteria pass.
- [x] EPIC-00 is marked done only after every sprint criterion passes.
- [x] `work/sprints/ledger.tsv` contains `SPRINT-001` with the final execution status.
- [x] `work/sprints/SPRINT-001.md` has no actionable unchecked checklist items when the execution manifest reports completion.
- [x] No commit is created by the sprint executor.

## Risks & Mitigations

| Risk                                                               | Likelihood | Impact | Mitigation                                                                                    |
| ------------------------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------- |
| Single-package boundaries erode before later epics                 | Medium     | Medium | Enforce `src/domain` import restrictions with lint/typecheck and document extraction triggers |
| Domain contracts overfit before ingestion/template work            | Medium     | High   | Keep contracts thin, plain-data oriented, and focused on stable invariants only               |
| TypeScript contracts are mistaken for runtime validation           | Medium     | Medium | Document runtime validation as deferred to ingestion/import boundaries                        |
| Fixture examples imply game correctness                            | Medium     | Medium | Use synthetic non-authoritative fixtures only; defer authoritative cases to later epics       |
| `.gitignore` hides policy README files in ignored data directories | Medium     | Medium | Add explicit negation rules and verify tracked README visibility                              |
| Tool versions are incompatible with the local Node baseline        | Low        | Medium | Select mutually compatible stable versions during execution and commit the lockfile           |
| Documentation duplicates or drifts from scripts                    | Medium     | Medium | Make `npm run verify` canonical and ensure docs cite implemented commands exactly             |
| App scaffold becomes a premature product UI                        | Low        | Medium | Keep the shell minimal and defer in-game visual polish to EPIC-07/EPIC-08                     |

## Security Considerations

- The sprint must remain a static local browser app with no backend, auth, cloud SDK, analytics, remote persistence, or service worker.
- No secrets, tokens, environment-specific endpoints, or credentials should be required or committed.
- The app should not fetch remote Guild Wars data at runtime.
- Raw source snapshots and generated data are treated as untrusted future inputs.
- The app must not render imported or fixture text as raw HTML.
- Future template/import strings should be treated as untrusted, but parser implementation is out of scope.
- Dependency additions should be limited to scaffold, build, lint, format, and test needs.

## Dependencies

- `EPIC-00` has no internal epic dependencies.
- Python 3 is required for existing `scripts/test_ticket_burn.py`.
- Node.js and npm are required for the scaffold; the implementation should choose a compatible baseline, document it, and record exact dependency versions in `package-lock.json`.
- Network access may be needed during execution to install npm packages.
- This sprint should complete before EPIC-01, EPIC-02, EPIC-05, EPIC-06, and EPIC-08 rely on app, data, and domain conventions.

## Open Questions

No open question blocks execution. Deferred decisions:

- EPIC-01 decides source retention, attribution, and whether raw/generated artifacts are committed.
- EPIC-02 decides ingestion implementation details and runtime schema validation strategy.
- EPIC-05 decides whether template codecs live in `src/domain`, a future package, or an external dependency.
- EPIC-07 and EPIC-08 decide the final visual system and build-editor interaction model.
- EPIC-09 decides local storage schema, migrations, import/export backup behavior, and shareable URL strategy.
