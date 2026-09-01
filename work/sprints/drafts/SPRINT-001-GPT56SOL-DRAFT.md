---
id: SPRINT-001
title: Project Foundation
status: planned
epic: EPIC-00
target: BACKLOG
tickets:
  - BW-0001
  - BW-0002
  - BW-0003
  - BW-0004
---

# Sprint 001: Project Foundation

## Overview

Establish a runnable, local-only TypeScript web application with durable domain boundaries, deterministic verification, documented data locations, and ticket/sprint traceability.

The sprint makes these decisions:

- Build a client-rendered React 19 application using Vite 8 and TypeScript 7.
- Target Node.js 24 LTS and npm with one committed lockfile.
- Start as a single private npm package organized as a modular monolith.
- Keep the domain independent of React, browser storage, network access, and Node-specific data tooling.
- Reserve `tools/data/` for ingestion and `data/` for snapshots, generated artifacts, and QA output.
- Represent authored documents as versioned, JSON-serializable data.
- Keep the first milestone entirely local. Do not add a backend, authentication, hosted sharing, analytics, service workers, or cloud persistence.
- Establish Vitest projects for Node-domain tests and jsdom component tests.
- Add concrete but deliberately minimal domain contracts. Do not implement template codecs, game-rule validation, persistence, ingestion, or the build editor.

A single package is preferred over npm workspaces because the repository currently has one deployable application and no independently published libraries. The module boundaries below provide separation without creating build-order and package-publication overhead. Package extraction remains possible when a second runtime or release lifecycle makes it valuable.

### Sprint outcome

At completion, a contributor can clone the repository, select Node.js 24, run `npm ci`, run `npm run dev`, and see a minimal Build Wars shell. `npm run check` provides the authoritative application verification command.

The repository will also contain:

- Stable locations and dependency rules for application, domain, data tooling, and data artifacts.
- Minimal exports for every core model named by `EPIC-00`.
- Synthetic typed fixtures proving those contracts compose without requiring real game data.
- Four concrete `BW-000x` tickets linked to this sprint.
- An initialized sprint ledger.
- Development and architecture documentation sufficient for later epics to extend the project consistently.

### Non-goals

- Importing or copying Guild Wars Wiki or PvX content.
- Fetching remote data or implementing MediaWiki clients.
- Parsing or encoding skill, equipment, or team template codes.
- Implementing game legality rules.
- Persisting builds in local storage.
- Implementing a build editor, router, design system, PWA, or in-game visual treatment.
- Evaluating or installing `@buildwars/gw-templates`.
- Adding hosted CI before a repository host and ownership policy are established.
- Committing changes; the outer ticket-burn process owns version-control operations.

## Use Cases

### UC-1: Run the application from a clean checkout

A contributor selects Node.js 24, runs `npm ci` followed by `npm run dev`, and receives a working local development server. The page renders a semantic Build Wars heading and a concise foundation-state message without console errors or network-dependent content.

### UC-2: Verify the repository with one command

A contributor runs `npm run check`. Formatting, linting, type checking, tests, and production build all succeed. Individual commands remain available for focused development.

### UC-3: Extend the domain without coupling it to React

A later epic can add catalog fields, rule services, or authored-document behavior beneath `src/domain/`. Domain code is testable in a Node environment and cannot import React, application components, browser APIs, storage APIs, or data-tooling modules.

### UC-4: Add data ingestion without coupling it to the UI

`EPIC-02` can add Node-only scripts beneath `tools/data/`. Those scripts may depend on the domain contracts and write to the documented `data/` locations, but they cannot import application code. The browser application will eventually consume normalized output through an adapter rather than importing source snapshots.

### UC-5: Add compatibility fixtures safely

Template and parser epics can place small, reviewed regression fixtures under `test/fixtures/`. Full upstream responses remain separate from test fixtures and are ignored by default until `EPIC-01` establishes source and licensing policy.

### UC-6: Preserve unknown catalog identifiers

Authored models store stable catalog identifiers rather than embedding entire catalog records or constraining identifiers to compile-time enums. A future template import can retain an unknown numeric identifier even when the active catalog cannot resolve it.

### UC-7: Trace foundation work

A maintainer can follow `SPRINT-001` to `EPIC-00` and the four `BW-000x` tickets. The sprint ledger and ticket frontmatter expose current status without relying on commit history.

## Architecture

### Runtime and module layout

```text
Browser
  └── src/app
        ├── future src/features
        ├── future src/adapters
        └── src/domain
              └── pure, serializable contracts and domain behavior

Node tooling
  └── tools/data
        ├── may import src/domain
        ├── reads/writes data/*
        └── must not import src/app or src/features

Data artifacts
  ├── test/fixtures
  ├── data/source-snapshots
  ├── data/generated
  └── data/qa
```

Dependency direction is inward:

- `src/app` composes the browser application.
- Future `src/features` modules own user workflows and may depend on domain contracts.
- Future `src/adapters` modules isolate browser storage, generated-data loading, URLs, and other I/O.
- `src/domain` owns game and authored-document concepts and imports no outer layer.
- `tools/data` is a separate Node-only tooling boundary, despite sharing the root package and lockfile.
- `data/source-snapshots` is never imported by browser code.
- Generated data may eventually be consumed only through an adapter whose interface is expressed in domain terms.

ESLint restrictions and a DOM-free domain TypeScript configuration enforce the important directions. Directory naming alone is not considered enforcement.

### Domain model strategy

Core models are plain, readonly, JSON-compatible data. Do not use classes, `Date`, `Map`, `Set`, functions, or framework objects inside serializable models.

The initial contracts cover:

- Catalog records: `Profession`, `Attribute`, `Skill`, `SkillProgression`, `Rune`, `Insignia`, `ArmorPiece`, `Weapon`, and `WeaponModifier`.
- Authored documents: `Build`, `EquipmentTemplate`, `PartyBuild`, and `Guide`.
- Supporting values: branded catalog and authored IDs, source provenance, catalog version, schema version, game mode, attribute allocation, skill slots, party slots, and guide sections.

Required modeling rules:

- Game/catalog identifiers remain numeric and are not closed TypeScript enums.
- Authored-document identifiers are non-empty strings.
- Every authored root has a numeric `schemaVersion`.
- Authored roots carry the catalog version or revision against which they were created when known.
- `Build.skillBar` is an eight-element tuple of `SkillId | null`.
- Absence in serialized data uses explicit `null`; optional properties are reserved for backward-compatible schema evolution.
- Builds reference catalog entities by identifier instead of embedding mutable catalog records.
- Source-derived records can carry source name, URL/page identity, revision identity, and fetch time without making those fields mandatory for synthetic fixtures.
- Unknown catalog IDs remain representable and serializable.
- Equipment, party, and guide contracts remain minimal until their owning epics define detailed behavior.
- No gameplay rule is silently encoded as a type unless it is already a stable format invariant, such as the eight skill slots.

A contract test will construct and serialize a synthetic catalog and build using the public exports. It will also prove that an unresolved numeric skill ID survives serialization.

### Data and fixture lifecycle

| Location                 | Purpose                                                       | Repository policy for this sprint                                 |
| ------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| `test/fixtures/`         | Small deterministic test inputs and expected results          | Committed; synthetic foundation fixtures only                     |
| `data/source-snapshots/` | Raw upstream responses and metadata                           | README committed; contents ignored by default                     |
| `data/generated/`        | Deterministic normalized runtime artifacts                    | README committed; contents ignored until `EPIC-01` decides policy |
| `data/qa/`               | Generated validation and diff reports                         | README committed; contents ignored                                |
| `prior-art/`             | Existing manually gathered visual references                  | Preserved unchanged                                               |
| `tools/data/`            | Future fetch, parse, normalize, validate, and publish scripts | Boundary documented; no ingestion implementation                  |

Small source excerpts needed for regression tests may later move into `test/fixtures/sources/`, but only after licensing, attribution, minimization, and provenance requirements are defined by `EPIC-01`.

### Testing architecture

Vitest uses two named projects:

- `domain`: Node environment; includes domain contract and fixture tests.
- `web`: jsdom environment; includes React component smoke tests and Testing Library setup.

The foundation suite includes:

- An application smoke test that renders the shell and finds the main heading by accessible role.
- Domain contract tests covering all required public model exports.
- A serialization test for a versioned build.
- A test proving exactly eight nullable skill slots are represented.
- A test proving an unknown numeric catalog ID is preserved.
- A fixture-composition test using only synthetic records.

No coverage threshold is introduced during the scaffold sprint. Later epics should add behavior-specific coverage instead of optimizing a foundation-only percentage.

### Cross-phase consistency

| Later work                           | Foundation extension point                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `EPIC-01 Source Policy and QA`       | Finalizes commit, attribution, and retention policy for `data/` and source-derived fixtures |
| `EPIC-02 Data Ingestion Platform`    | Implements `tools/data/` and produces provenance-bearing artifacts                          |
| `EPIC-03` and `EPIC-04` catalog work | Extends catalog contracts without changing browser or storage concerns                      |
| `EPIC-05 Template Compatibility`     | Adds pure compatibility codecs and fixture sets while preserving unknown IDs                |
| `EPIC-06 Game Rule Engine`           | Adds domain services returning structured validation results                                |
| `EPIC-08 Core Build Editor`          | Adds feature modules that consume domain services and catalog adapters                      |
| `EPIC-09 Local Library`              | Adds a versioned storage adapter and migrations around authored documents                   |
| Equipment, party, and guide epics    | Extend their existing aggregate boundaries instead of attaching fields to UI state          |

Extract `src/domain` or `tools/data` into an npm workspace only when one of these conditions appears:

- Independent publishing or versioning is required.
- A second deployable consumes the domain package.
- Node tooling needs dependencies or compilation settings that materially conflict with the browser application.
- Boundary enforcement can no longer be maintained reliably inside the single package.

## Implementation

### Execution bookkeeping

- [ ] Create `BW-0001` through `BW-0004` with `epic: EPIC-00`, `sprint: SPRINT-001`, valid backlog statuses, and explicit dependencies.
- [ ] Add `SPRINT-001` to `work/sprints/ledger.tsv` as `in-progress` before implementation begins.
- [ ] Change the sprint metadata from `planned` to `in-progress`.
- [ ] Preserve unrelated and pre-existing repository content.

### Phase 1 — BW-0001: Scaffold the local-first web application

- [ ] Add Node.js 24 selection and engine metadata through `.nvmrc`, `.npmrc`, and `package.json`.
- [ ] Create one private ESM npm package and commit `package-lock.json`.
- [ ] Scaffold React 19, Vite 8, and TypeScript 7 without replacing the existing project documentation.
- [ ] Add scripts for `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:watch`, `format`, `format:check`, and `check`.
- [ ] Configure strict TypeScript, including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`.
- [ ] Configure current flat ESLint rules for TypeScript and React.
- [ ] Configure Prettier for source and configuration files without reformatting the existing backlog or roadmap wholesale.
- [ ] Render a minimal accessible application shell with no feature mockups, remote requests, persistence, or router.
- [ ] Replace template branding and remove unused Vite demonstration assets.
- [ ] Add a jsdom smoke test for the application shell.
- [ ] Extend `.gitignore` for `node_modules`, build output, coverage, local environment files, and documented generated-data locations.

Phase acceptance:

- `npm ci` succeeds under Node.js 24.
- `npm run dev` starts the application.
- `npm run build` produces a static production bundle.
- The application smoke test passes.
- No hosted or persistence capability has been introduced.

### Phase 2 — BW-0002: Establish domain contracts and boundaries

- [ ] Record the local-first modular-monolith decision and dependency directions in the compendium.
- [ ] Add a DOM-free `tsconfig.domain.json` and include it in the root type-check command.
- [ ] Add ESLint restrictions preventing `src/domain` from importing React, application modules, Node built-ins, browser adapters, or data tooling.
- [ ] Implement public ID and schema-version value types without closed enums for catalog IDs.
- [ ] Implement source provenance and catalog-version contracts.
- [ ] Add minimal catalog contracts for all models named by `EPIC-00`.
- [ ] Add minimal versioned contracts for `Build`, `EquipmentTemplate`, `PartyBuild`, and `Guide`.
- [ ] Represent the skill bar as exactly eight nullable identifier slots.
- [ ] Export the supported domain surface from one `src/domain/index.ts` entry point.
- [ ] Keep detailed equipment rules, guide markup, party-size validation, template encoding, and game validation out of this phase.
- [ ] Add Node-environment tests for the public contract surface and serialization invariants.

Phase acceptance:

- Domain code type-checks with neither DOM nor Node ambient types.
- Every core model named in `EPIC-00` has a documented public export.
- The browser app can import domain contracts, while the domain imports no outer layer.
- Unknown numeric catalog identifiers remain representable.
- No `any` is introduced in domain code.

### Phase 3 — BW-0003: Define data and fixture strategy

- [ ] Add `tools/data/README.md` documenting the future `fetch → snapshot → normalize → validate → publish` flow and dependency restrictions.
- [ ] Add `data/README.md` as the artifact-location index.
- [ ] Add tracked policy READMEs beneath `data/source-snapshots/`, `data/generated/`, and `data/qa/`.
- [ ] Ignore generated contents in those directories while retaining their policy files.
- [ ] Add a synthetic typed catalog fixture and authored-build fixture under `test/fixtures/`.
- [ ] Label foundation fixtures clearly as synthetic and unsuitable for game-data correctness assertions.
- [ ] Test fixture composition, eight-slot shape, schema version, catalog version, and unknown-ID preservation.
- [ ] Document where later skill codes, equipment codes, malformed inputs, PvE/PvP splits, attribute/rune edge cases, and minimized source responses will live.
- [ ] Do not add real source snapshots, copied descriptions, icons, or template compatibility samples in this sprint.

Phase acceptance:

- Test fixtures are deterministic, small, and contain no unreviewed third-party content.
- Raw, normalized, QA, and regression-test artifacts have distinct ownership and retention rules.
- Browser code cannot consume source snapshots directly.
- Later ingestion work has an explicit location without coupling to application rendering.

### Phase 4 — BW-0004: Document and verify the foundation

- [ ] Expand the root `README.md` with prerequisites, install, development, test, build, and verification commands.
- [ ] Expand `compendium/README.md` into an index for architecture and development documentation.
- [ ] Add a development-conventions document covering module ownership, dependency direction, test placement, fixture placement, and command expectations.
- [ ] Document why the repository starts with one package and the triggers for introducing workspaces.
- [ ] Run `npm ci` using the committed lockfile.
- [ ] Run `npm run check`.
- [ ] Run `python3 -m unittest scripts/test_ticket_burn.py`.
- [ ] Run `npm audit --omit=dev --audit-level=high`; resolve high or critical runtime findings or record a blocking reason.
- [ ] Mark each `BW-000x` ticket done only after its phase acceptance is satisfied.
- [ ] Mark `EPIC-00` done only after the complete Definition of Done is satisfied.
- [ ] Change `SPRINT-001` and its ledger row to `completed`, with the final update timestamp.

## Files Summary

| Path                                                                | Planned change                                                                     |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `.gitignore`                                                        | Ignore Node, build, coverage, environment, snapshot, generated-data, and QA output |
| `.nvmrc`                                                            | Select Node.js 24                                                                  |
| `.npmrc`                                                            | Enforce the selected Node engine and predictable npm behavior                      |
| `package.json`                                                      | Private ESM package, engine metadata, dependencies, and authoritative scripts      |
| `package-lock.json`                                                 | Reproducible npm dependency graph                                                  |
| `index.html`                                                        | Vite application entry with Build Wars metadata                                    |
| `vite.config.ts`                                                    | Minimal React/Vite configuration                                                   |
| `vitest.config.ts`                                                  | Named `domain` and `web` test projects                                             |
| `eslint.config.js`                                                  | TypeScript/React linting and architectural import restrictions                     |
| `.prettierrc.json`                                                  | Source-formatting convention                                                       |
| `.prettierignore`                                                   | Exclude generated, backlog, run-log, and binary/reference material                 |
| `tsconfig.json`                                                     | Root TypeScript configuration entry                                                |
| `tsconfig.app.json`                                                 | Browser and React compilation settings                                             |
| `tsconfig.domain.json`                                              | Strict DOM-free domain verification                                                |
| `tsconfig.node.json`                                                | Vite/Vitest configuration typing                                                   |
| `src/main.tsx`                                                      | Browser bootstrap                                                                  |
| `src/app/App.tsx`                                                   | Minimal application shell                                                          |
| `src/app/App.test.tsx`                                              | Accessible render smoke test                                                       |
| `src/app/styles.css`                                                | Minimal shell styling without committing to the final aesthetic                    |
| `src/test/setup.ts`                                                 | Web-test matcher setup                                                             |
| `src/domain/ids.ts`                                                 | Catalog and authored identifier types                                              |
| `src/domain/source.ts`                                              | Provenance and catalog-version contracts                                           |
| `src/domain/catalog.ts`                                             | Profession, attribute, skill, progression, rune, and insignia contracts            |
| `src/domain/equipment.ts`                                           | Armor, weapon, modifier, and equipment-template boundaries                         |
| `src/domain/build.ts`                                               | Versioned build, attributes, game mode, and eight-slot skill bar                   |
| `src/domain/party.ts`                                               | Minimal party-build and slot contracts                                             |
| `src/domain/guide.ts`                                               | Minimal guide and section contracts                                                |
| `src/domain/index.ts`                                               | Supported domain entry point                                                       |
| `test/domain/contracts.test.ts`                                     | Domain shape, serialization, and unknown-ID tests                                  |
| `test/fixtures/foundation.ts`                                       | Synthetic typed catalog and build fixtures                                         |
| `tools/data/README.md`                                              | Future Node ingestion flow and boundary rules                                      |
| `data/README.md`                                                    | Data artifact index and lifecycle summary                                          |
| `data/source-snapshots/README.md`                                   | Raw snapshot policy placeholder                                                    |
| `data/generated/README.md`                                          | Normalized generated-data policy placeholder                                       |
| `data/qa/README.md`                                                 | QA report policy placeholder                                                       |
| `compendium/README.md`                                              | Documentation index                                                                |
| `compendium/decisions/0001-local-first-modular-web-app.md`          | Accepted stack, package, runtime, and boundary decision                            |
| `compendium/development.md`                                         | Commands, code organization, tests, and fixtures                                   |
| `README.md`                                                         | Project overview and clean-checkout workflow                                       |
| `work/tickets/00-project-foundation/BW-0001-app-scaffold.md`        | Application scaffold ticket                                                        |
| `work/tickets/00-project-foundation/BW-0002-domain-boundaries.md`   | Domain contracts ticket                                                            |
| `work/tickets/00-project-foundation/BW-0003-data-and-fixtures.md`   | Data and fixture strategy ticket                                                   |
| `work/tickets/00-project-foundation/BW-0004-document-and-verify.md` | Documentation and verification ticket                                              |
| `work/tickets/00-project-foundation/EPIC.md`                        | Sprint linkage and final epic status                                               |
| `work/sprints/ledger.tsv`                                           | Initial sprint ledger with `SPRINT-001`                                            |
| `work/sprints/SPRINT-001.md`                                        | Executable sprint and completion state                                             |

Generated Vite files may be consolidated where doing so reduces duplication, but the responsibilities and boundaries above must remain explicit.

## Definition of Done

### Application and tooling

- [ ] Node.js 24 and the npm package-manager version are documented and enforced.
- [ ] `npm ci` succeeds from the committed lockfile.
- [ ] `npm run dev` serves the Build Wars application locally.
- [ ] The application renders a semantic Build Wars heading without runtime errors.
- [ ] `npm run build` produces a static application bundle.
- [ ] `npm run check` runs formatting checks, linting, type checking, tests, and build successfully.
- [ ] `python3 -m unittest scripts/test_ticket_burn.py` passes.

### Architecture and models

- [ ] The repository documents a local-only React/Vite modular monolith.
- [ ] Domain dependency restrictions are enforced by configuration.
- [ ] Domain code type-checks without DOM or Node ambient APIs.
- [ ] All core `EPIC-00` model names have public, documented TypeScript contracts.
- [ ] Authored root documents include a schema version.
- [ ] Builds can retain their associated catalog version.
- [ ] Skill bars contain exactly eight nullable slots.
- [ ] Catalog IDs are not represented by closed enums.
- [ ] Unknown numeric IDs survive model serialization.
- [ ] No template codec, gameplay validator, storage adapter, remote fetcher, or feature editor is implemented.

### Tests and data layout

- [ ] Vitest has separate Node-domain and jsdom-web projects.
- [ ] The application smoke test passes.
- [ ] Domain contract and serialization tests pass.
- [ ] Foundation fixtures are synthetic, deterministic, and clearly labeled.
- [ ] Source snapshots, normalized artifacts, QA output, and test fixtures have separate documented locations.
- [ ] Raw and generated data contents are ignored by default pending `EPIC-01`.
- [ ] No unreviewed third-party prose, images, or raw responses are introduced.

### Documentation and traceability

- [ ] Root documentation explains prerequisites and all standard commands.
- [ ] The compendium records architecture and contributor conventions.
- [ ] `BW-0001` through `BW-0004` exist, link `EPIC-00` and `SPRINT-001`, and are marked done.
- [ ] `EPIC-00` is marked done only after every sprint criterion passes.
- [ ] `work/sprints/ledger.tsv` contains one completed `SPRINT-001` row.
- [ ] The sprint document has no actionable unchecked items when execution reports completion.
- [ ] No commit is created by the sprint executor.

### Security

- [ ] The application makes no external runtime requests.
- [ ] No secrets, credentials, analytics identifiers, or environment-specific endpoints are committed.
- [ ] No high or critical production dependency vulnerability remains unexplained.
- [ ] Untrusted source content is not rendered or executed.
- [ ] No cloud or account capability is implied by the application shell or documentation.

## Risks

| Risk                                                              | Impact                                                          | Mitigation                                                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Premature domain detail becomes expensive to change               | Later content or compatibility discoveries force migrations     | Keep contracts minimal; encode only stable identifiers, aggregate ownership, serialization, and the eight-slot invariant   |
| A single package allows boundary erosion                          | Browser, data, and domain concerns become tangled               | Enforce restricted imports, DOM-free domain type checking, and documented extraction triggers                              |
| Introducing workspaces too early adds operational overhead        | Development and build scripts become harder before reuse exists | Retain one lockfile and package until independent lifecycle requirements appear                                            |
| TypeScript or build-tool version drift                            | Clean installs behave differently over time                     | Use Node 24 LTS, selected major lines, committed lockfile, and `npm ci`; upgrade deliberately                              |
| Source data enters before policy is settled                       | Licensing, attribution, repository-size, or freshness problems  | Commit policy placeholders only; ignore raw/generated contents until `EPIC-01`                                             |
| Compile-time models are mistaken for runtime validation           | Imported JSON could be trusted incorrectly                      | State explicitly that external data remains untrusted; select runtime validation in `EPIC-02` or the first import boundary |
| Synthetic fixtures create false confidence about game correctness | Passing tests do not establish template or rules compatibility  | Limit claims to architecture and serialization; add authoritative fixtures in their owning epics                           |
| The foundation shell influences final UI prematurely              | Later prior-art work must undo arbitrary styling                | Keep styling minimal and neutral; defer the visual system to `EPIC-07` and `EPIC-08`                                       |
| No hosted CI exists                                               | Verification depends on local discipline                        | Make `npm run check` deterministic now; add hosted CI only after repository hosting and ownership are known                |

## Security

This sprint intentionally minimizes attack surface:

- The application is a static local-first SPA with no backend, authentication, analytics, cookies, service worker, or remote content.
- No local-storage implementation is added yet, avoiding premature persistence and migration behavior.
- Source snapshots and generated data are treated as untrusted inputs.
- Domain models contain plain data and do not render HTML.
- Application code must not use `dangerouslySetInnerHTML`, dynamic code evaluation, or executable content from fixtures.
- Local environment files are ignored, and the application requires no secrets.
- Runtime dependencies are limited to React and React DOM; build and test dependencies remain development-only.
- The lockfile is committed, and high/critical runtime advisories are checked before completion.
- Future wiki or community content must pass through provenance, validation, and rendering boundaries defined by `EPIC-01` and `EPIC-02`.

## Dependencies

### Internal

- `EPIC-00` has no epic dependencies.
- The sprint depends only on the current repository documentation, ticket conventions, runner behavior, and existing prior-art files.
- No implementation from another Build Wars epic is required.

### Runtime and toolchain

- Node.js 24 LTS. The current release line and LTS status are maintained by the [Node.js project](https://nodejs.org/en/download/current).
- npm, pinned through `packageManager` metadata and `package-lock.json`.
- React 19 and React DOM 19. React identifies 19.2 as its current major line in the [official version documentation](https://react.dev/versions).
- Vite 8 with the official React plugin. Vite supports the React TypeScript scaffold and documents its Node requirements in the [official getting-started guide](https://vite.dev/guide/).
- TypeScript 7 with strict compiler settings. TypeScript 7 is the current release on the [official TypeScript site](https://www.typescriptlang.org/).
- Vitest 4, jsdom, React Testing Library, and jest-dom for tests. Multi-environment configuration uses Vitest’s [projects configuration](https://vitest.dev/config/projects).
- ESLint 10 using flat configuration. ESLint 10 supports Node.js 24 according to the [official setup guide](https://eslint.org/docs/latest/use/getting-started).
- Prettier 3 for scoped source and configuration formatting.

Use mutually compatible current stable releases within these selected major lines during execution. Record the exact resolved versions in the lockfile; do not leave prerelease or floating `latest` specifications in `package.json`.

### Explicitly deferred dependencies

Do not add the following during this sprint:

- `@buildwars/gw-templates`
- A runtime schema-validation library
- React Router
- State-management libraries
- IndexedDB or local-storage wrappers
- MediaWiki clients
- Markdown or rich-text renderers
- CSS frameworks or component libraries
- PWA plugins
- Backend, authentication, analytics, or cloud SDKs

## Open Questions

None block this sprint. The following decisions remain with their owning epics:

1. **Source retention and attribution:** `EPIC-01` must decide which raw snapshots and normalized artifacts may be committed. Until then, raw and generated contents remain ignored.
2. **Runtime validation:** `EPIC-02` should select schema validation only after ingestion formats and error-reporting needs are understood. Compile-time TypeScript types are not runtime validation.
3. **Template implementation:** `EPIC-05` must evaluate the license, browser suitability, data freshness, and unknown-ID behavior of `@buildwars/gw-templates` before selecting dependency, port, or native implementation.
4. **PWA and offline caching:** Revisit after the core editor and local library exist. A local-only product does not automatically require a service worker.
5. **Hosted CI and deployment:** Add these after the repository host, deployment target, and maintenance ownership are established. The portable contract for now is `npm ci && npm run check`.
