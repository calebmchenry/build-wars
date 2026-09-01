# SPRINT-001: Project Foundation

## Overview

Sprint `SPRINT-001` executes `EPIC-00 Project Foundation` for ticket-burn target `BACKLOG`.

The sprint establishes the first runnable application scaffold, architecture boundaries, documentation conventions, and verification commands for Build Wars. The repository currently has planning docs, ticket automation, and prior-art screenshots, but no application code. This sprint should create the foundation without implementing Guild Wars template parsing, wiki ingestion, game-rule validation, equipment editing, party building, hosted sharing, or visual polish.

Primary decisions:

- Use a TypeScript web app as the default application shape.
- Use React + Vite + Vitest unless implementation discovers a blocking constraint.
- Use `npm` and `package-lock.json` as the initial package manager convention.
- Keep the first milestone local-only.
- Keep domain models independent from React and browser storage.
- Keep future data ingestion and source snapshots separate from UI/runtime code.
- Treat any fixture data added in this sprint as non-authoritative scaffolding unless explicitly sourced and documented.

## Use Cases

1. A developer can clone the repo, install dependencies, run the app locally, and run one documented verification command.

2. A future feature implementer can see where app UI, domain models, tests, fixtures, generated data, and source snapshots belong.

3. The ticket-burn runner can trace `SPRINT-001` back to `EPIC-00` and concrete `BW-000x` ticket files.

4. A future data-ingestion sprint can add Guild Wars Wiki parsing without coupling raw source fetches to React components.

5. A future template-compatibility sprint can add skill/equipment/team template parsers against stable domain model boundaries.

6. A future UI sprint can reference `prior-art/` without this sprint attempting to recreate the in-game interface.

## Architecture

### Stack

Use a single-package TypeScript web app:

- Runtime: React
- Build tool: Vite
- Language: TypeScript
- Tests: Vitest with jsdom for unit and smoke tests
- Package manager: npm
- Verification entrypoint: `npm run verify`

The foundation should not introduce a monorepo, backend service, database, authentication layer, deployment target, or cloud dependency.

### Package Boundaries

Recommended layout:

- `src/app/` contains React application shell code.
- `src/domain/` contains framework-neutral Guild Wars model types and lightweight pure helpers.
- `src/data/` contains runtime-facing data access boundaries, not raw scraped data.
- `tests/` contains cross-cutting test helpers and fixtures when they do not belong beside a unit.
- `fixtures/` contains small checked-in test fixtures with explicit non-production labeling.
- `data/source-snapshots/` is reserved for raw fetched source material from future ingestion work.
- `data/generated/` is reserved for normalized generated data emitted by future ingestion work.
- `scripts/data/` is reserved for future ingestion and QA scripts.
- `prior-art/` remains a reference asset area, not runtime app data.

Domain code must not import React. Data ingestion scripts must not import UI components. Raw source snapshots must not be consumed directly by the UI.

### Domain Model Boundary

Create concrete TypeScript model definitions, but keep behavior intentionally narrow.

Initial model areas:

- `Profession`
- `Attribute`
- `Skill`
- `SkillProgression`
- `Rune`
- `Insignia`
- `ArmorPiece`
- `Weapon`
- `WeaponModifier`
- `Build`
- `EquipmentTemplate`
- `PartyBuild`
- `Guide`
- `SourceProvenance`
- shared ID/value types for game IDs, template IDs, and local IDs

This sprint should define model shapes and basic compile-time relationships. It should not implement real template bitstream parsing, full validation rules, wiki-derived skill descriptions, equipment legality, PvE/PvP split behavior, title-rank scaling, or calculated build statistics.

### Data Boundary

Separate data by trust and lifecycle:

- Checked-in fixtures are small, stable, and test-focused.
- Raw source snapshots preserve source provenance and are generated later.
- Normalized generated data is produced by ingestion scripts later.
- Runtime app modules consume normalized data through typed boundaries.

Because source policy is `EPIC-01`, this sprint should avoid copying substantial Guild Wars Wiki or PvX content. If examples are needed, use minimal synthetic/dev fixtures or clearly documented public compatibility strings.

### Storage Boundary

The product goal includes local storage, but this sprint should not build the full local library. It may define storage-facing types or a future storage port, but actual build CRUD, migrations, import/export backups, and URL sharing belong to later epics.

### Sprint And Ticket Boundary

Create concrete EPIC-00 ticket files in `work/tickets/00-project-foundation/` using the `BW-000x` range. Suggested tickets:

- `BW-0001` app scaffold and package scripts
- `BW-0002` architecture and package layout docs
- `BW-0003` domain model boundary
- `BW-0004` data, source snapshot, and fixture layout
- `BW-0005` verification command and sprint ledger baseline

Create `work/sprints/SPRINT-001.md` as the final sprint artifact and initialize `work/sprints/ledger.tsv` if it does not exist.

## Implementation

### Phase 1: Traceability And Sprint Records

- Create or update `work/sprints/SPRINT-001.md` from the approved sprint plan.
- Create `work/sprints/ledger.tsv` with a header and a `SPRINT-001` row.
- Create EPIC-00 `BW-000x` ticket files with frontmatter linking each ticket to `EPIC-00` and `SPRINT-001`.
- Keep ticket statuses aligned with sprint execution state.

### Phase 2: Application Scaffold

- Add `package.json` and `package-lock.json`.
- Add Vite, React, TypeScript, Vitest, and lint/typecheck tooling.
- Add npm scripts:
  - `dev`
  - `build`
  - `test`
  - `test:run`
  - `typecheck`
  - `lint`
  - `verify`
- Add the minimal Vite entry files needed to render the app.
- Keep the first UI as a small local app shell, not a landing page and not a feature-complete builder.

### Phase 3: Domain Boundary

- Add `src/domain/` model files and an index barrel.
- Represent identifiers explicitly rather than using loose strings everywhere.
- Include source/provenance fields where future generated data will need them.
- Add comments only where a model boundary prevents accidental scope creep.
- Add tests that compile and exercise representative model construction.

### Phase 4: Data And Fixture Layout

- Create `fixtures/` with a README explaining fixture policy.
- Create `data/source-snapshots/README.md` documenting future raw snapshot expectations.
- Create `data/generated/README.md` documenting future generated-data expectations.
- Add minimal typed fixtures or fixture schema examples only as needed for tests.
- Label foundation fixtures as non-authoritative unless sourced.

### Phase 5: Verification

- Add at least one app smoke test.
- Add at least one domain/fixture test.
- Keep existing Python ticket-burn tests runnable.
- Ensure `npm run verify` runs the TypeScript verification path.
- Document the Python ticket-burn test command separately or include it in `verify` if practical.

### Phase 6: Documentation

- Update `README.md` with install, run, build, and test commands.
- Add or update `compendium/` documentation for:
  - stack choice
  - package layout
  - domain/data boundaries
  - fixture policy
  - out-of-scope items for SPRINT-001
- Reference `prior-art/` as future UI guidance without moving or transforming screenshots.

## Files Summary

Expected new or modified files:

| Path                                                                | Purpose                                                    |
| ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `package.json`                                                      | npm package metadata, app scripts, verification entrypoint |
| `package-lock.json`                                                 | deterministic npm dependency lockfile                      |
| `index.html`                                                        | Vite HTML entrypoint                                       |
| `vite.config.ts`                                                    | Vite and Vitest configuration                              |
| `tsconfig.json`                                                     | root TypeScript configuration                              |
| `tsconfig.app.json`                                                 | app TypeScript configuration if using Vite split config    |
| `tsconfig.node.json`                                                | tooling TypeScript configuration if needed                 |
| `eslint.config.js`                                                  | lint configuration                                         |
| `src/main.tsx`                                                      | React app entrypoint                                       |
| `src/app/App.tsx`                                                   | minimal app shell                                          |
| `src/app/App.test.tsx`                                              | app smoke test                                             |
| `src/app/styles.css`                                                | minimal app styling                                        |
| `src/domain/index.ts`                                               | domain exports                                             |
| `src/domain/models.ts`                                              | core model types                                           |
| `src/domain/models.test.ts`                                         | domain model test                                          |
| `fixtures/README.md`                                                | fixture policy                                             |
| `data/source-snapshots/README.md`                                   | raw source snapshot policy                                 |
| `data/generated/README.md`                                          | generated data policy                                      |
| `compendium/project-foundation.md`                                  | architecture and convention notes                          |
| `README.md`                                                         | project usage commands and current scope                   |
| `work/sprints/SPRINT-001.md`                                        | final sprint artifact                                      |
| `work/sprints/ledger.tsv`                                           | sprint ledger baseline                                     |
| `work/tickets/00-project-foundation/BW-0001-app-scaffold.md`        | scaffold ticket                                            |
| `work/tickets/00-project-foundation/BW-0002-architecture-layout.md` | architecture/layout ticket                                 |
| `work/tickets/00-project-foundation/BW-0003-domain-models.md`       | domain ticket                                              |
| `work/tickets/00-project-foundation/BW-0004-data-fixtures.md`       | data/fixture ticket                                        |
| `work/tickets/00-project-foundation/BW-0005-verification-docs.md`   | verification/docs ticket                                   |

## Definition of Done

- [ ] `work/sprints/SPRINT-001.md` exists and follows the sprint template sections.
- [ ] `work/sprints/ledger.tsv` exists and includes `SPRINT-001`.
- [ ] EPIC-00 has concrete `BW-000x` ticket files linked to `SPRINT-001`.
- [ ] The repo has a runnable TypeScript web app scaffold.
- [ ] `npm install` succeeds in a clean checkout.
- [ ] `npm run dev` starts the local app.
- [ ] `npm run build` succeeds.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm run test:run` succeeds.
- [ ] `npm run verify` is documented and succeeds.
- [ ] Existing ticket-burn tests still pass with `python3 -m unittest scripts/test_ticket_burn.py`.
- [ ] Domain model boundaries are documented or stubbed in TypeScript.
- [ ] Data/source snapshot/fixture directories have documented ownership and lifecycle.
- [ ] The sprint does not implement template parsing, wiki ingestion, full game validation, equipment editing, party building, hosted sharing, or full visual theming.
- [ ] README or compendium docs explain how future epics should extend the foundation.

## Risks

- React/Vite may be a premature stack choice if the project later needs a heavier data or offline architecture. Mitigation: keep domain and data boundaries framework-neutral.
- Domain models may encode wrong assumptions before ingestion and parser work. Mitigation: prefer explicit optional fields, provenance, and narrow tests over exhaustive game logic.
- Fixture examples may be mistaken for canonical game data. Mitigation: label foundation fixtures as non-authoritative and defer source policy to `EPIC-01`.
- Tooling setup may expand beyond foundation scope. Mitigation: add only enough lint/test/build tooling to verify the scaffold.
- Scope creep could pull in template parsing or real Guild Wars data. Mitigation: treat those as later epics with their own acceptance criteria.
- Future source licensing and attribution rules are unresolved. Mitigation: avoid substantial copied wiki/PvX data in this sprint.

## Security

- No authentication, accounts, hosted sharing, database, or server-side API should be introduced.
- No secrets or environment variables are required.
- The app should not fetch remote Guild Wars data at runtime in this sprint.
- Do not render imported build, guide, wiki, or PvX text as raw HTML.
- Future template/import inputs should be treated as untrusted strings, but parser implementation is out of scope here.
- Future `localStorage` data is user-local convenience storage, not secure storage.
- Dependencies should be limited to standard build/test/runtime packages needed for the scaffold.

## Dependencies

- Node.js compatible with the selected Vite version.
- npm.
- Python 3 for existing `scripts/test_ticket_burn.py`.
- Existing repository docs:
  - `README.md`
  - `work/roadmap.md`
  - `work/tickets/README.md`
  - `work/tickets/index.md`
  - `work/tickets/00-project-foundation/EPIC.md`
  - `prior-art/`

No external Guild Wars Wiki, PvX, hosting, database, or account dependency is required for this sprint.

## Open Questions

1. Should the project pin an exact Node version now, or document a minimum version and let the initial lockfile define the working environment?

2. Should domain fixtures be TypeScript fixtures for compile-time checking, JSON fixtures for future ingestion parity, or both?

3. Should `npm run verify` include the Python ticket-burn tests, or should app verification and repository automation verification remain separate commands?

4. Should generated normalized data eventually be checked into the repo, or regenerated as part of build/release workflows?

5. How strict should the first visual shell be about in-game aesthetics before `EPIC-07 Visual Prior Art` and `EPIC-08 Core Build Editor`?

6. Should local storage abstractions be stubbed during foundation, or deferred entirely to `EPIC-09 Local Library and Sharing`?
