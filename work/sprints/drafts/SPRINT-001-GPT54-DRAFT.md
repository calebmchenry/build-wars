---
id: SPRINT-001
title: Project Foundation
status: planned
source_target: BACKLOG
source_epic: EPIC-00
date: 2026-09-01
---

# SPRINT-001: Project Foundation

## Overview

Establish the first runnable Build Wars codebase without pulling feature work forward. This sprint should create a local-only TypeScript workspace, a minimal React web shell, a pure domain package for durable game/build types, a seed fixture/testing baseline, and the repo records needed for sprint and ticket automation.

This sprint resolves the key foundation choices now: use a `pnpm` workspace, React + Vite + TypeScript for `apps/web`, Vitest plus React Testing Library for automated coverage, strict TypeScript in shared packages, and top-level `data/` plus `fixtures/` directories to keep future ingestion, generated data, and tests separated. It does not implement template codecs, live data ingestion, rule logic, auth, cloud sync, or PWA behavior.

## Use Cases

- A contributor can clone the repo, install dependencies once, run the web app, and execute a documented validation command in a clean checkout.
- Future epics can add skill, template, and rule logic inside `packages/domain` without coupling business rules to React components.
- Future data work can place source snapshots and deterministic generated outputs in predefined directories without reorganizing the repo.
- Ticket-burn automation can track `SPRINT-001`, `work/sprints/ledger.tsv`, and BW-000x tickets as the baseline planning record for later sprints.

## Architecture

- Use a root `pnpm` workspace with one shared `package.json` for install, test, typecheck, build, and validation scripts.
- Put the browser application in `apps/web` and keep it route-light and local-only for this milestone.
- Put durable shared models in `packages/domain`. This package owns `Profession`, `Attribute`, `Skill`, `Build`, `EquipmentTemplate`, `PartyBuild`, `Guide`, validation message shapes, and provenance/source metadata.
- Keep `packages/domain` pure and framework-free. No React imports, browser APIs, or UI state should leak into it.
- Use `fixtures/` for hand-authored safe test inputs only. Seed minimal examples for a valid build skeleton, template-code strings, and rule-edge cases. Do not copy large amounts of wiki or PvX content before `EPIC-01`.
- Reserve `data/generated/` for deterministic generated catalogs consumed by the app later.
- Reserve `data/source-snapshots/` for fetched or preserved source inputs with revision and timestamp provenance.
- Reserve `scripts/data/` for non-runtime ingestion and QA tooling, separate from the web bundle.
- Update `README.md` for human-facing setup and validation. Add a compendium note for agent-facing architecture and QA conventions.
- Defer CSS frameworks, backend code, service workers, auth, cloud sync, and external UI kits until later epics create a real need.

## Implementation

### Phase 0: Traceability and sprint activation

Create BW-0001 through BW-0005 ticket files under `work/tickets/00-project-foundation/` and link them to `SPRINT-001`. Use this split: `BW-0001` workspace/toolchain, `BW-0002` domain baseline, `BW-0003` web scaffold, `BW-0004` fixtures/data layout, and `BW-0005` docs/ledger/verification. Initialize `work/sprints/ledger.tsv` if it does not exist, using the header `sprint_id\ttitle\tstatus\tupdated_at`, and add a `SPRINT-001` row when execution starts.

Verification: `python3 scripts/test_ticket_burn.py` still passes, and the ticket docs plus ledger format remain compatible with `scripts/ticket-burn.py`.

### Phase 1: Workspace and toolchain

Add the root workspace files needed for a clean install and repeatable validation. Define root scripts for `dev`, `build`, `test`, `typecheck`, and `validate`. Pin the expected Node LTS in repo metadata or docs, and update `.gitignore` for dependencies and build outputs.

Verification: from a clean checkout, `pnpm install`, `pnpm typecheck`, and `pnpm validate` resolve without manual path fixes.

### Phase 2: Domain package baseline

Create `packages/domain` as a framework-free package with strict TypeScript settings and exports for the durable core models. Include small pure helpers only where they clarify invariants, such as branded ids, empty build skeletons, or normalized validation message shapes. Do not implement template codecs or full rule evaluation yet.

Verification: domain tests pass, fixtures compile against exported types, and the package can be imported by other workspaces without circular dependencies.

### Phase 3: Web app scaffold

Create `apps/web` with React, Vite, and TypeScript. The initial UI should stay intentionally minimal: an app shell, a visible local-only scope note, and a small read-only rendering of sample domain data to prove the package boundary works. Add at least one smoke test that renders the app shell.

Verification: `pnpm --filter @build-wars/web build` succeeds, `pnpm test` covers the app smoke test, and `pnpm --filter @build-wars/web dev` runs locally.

### Phase 4: Fixtures, data layout, and docs

Create the `fixtures/`, `data/generated/`, `data/source-snapshots/`, and `scripts/data/` directory contracts with placeholder documentation. Seed only the minimal safe fixtures needed for compile-time and test-time coverage. Update `README.md` and add a compendium note describing the workspace layout, verification commands, and the rule that runtime UI code must not own domain logic.

Verification: the docs name the same directories and commands the code actually uses, and no fixture or placeholder content depends on unresolved source-policy decisions.

### Phase 5: Closeout and baseline validation

Run the full repo validation pass, update ticket and sprint records, and confirm `EPIC-00` can be marked done if all scope items are satisfied. If anything remains incomplete, keep the epic open but preserve the scaffold, docs, and ticket breakdown as the baseline for `SPRINT-002`.

Verification: `pnpm validate` passes, `python3 scripts/test_ticket_burn.py` passes, BW-000x tickets are updated consistently, and the sprint ledger reflects the final sprint status.

## Files Summary

| Path                                                                     | Purpose                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `package.json`                                                           | Root workspace scripts and shared metadata                               |
| `pnpm-workspace.yaml`                                                    | Workspace membership for `apps/*` and `packages/*`                       |
| `tsconfig.base.json`                                                     | Shared strict TypeScript baseline                                        |
| `.gitignore`                                                             | Ignore Node modules, build outputs, and local artifacts                  |
| `apps/web/`                                                              | React + Vite local-only application shell                                |
| `packages/domain/`                                                       | Shared durable types and pure domain helpers                             |
| `fixtures/`                                                              | Hand-authored safe fixtures for builds, template strings, and rule edges |
| `data/generated/`                                                        | Reserved location for deterministic generated app data                   |
| `data/source-snapshots/`                                                 | Reserved location for source captures with provenance                    |
| `scripts/data/`                                                          | Reserved location for ingestion and QA tooling                           |
| `README.md`                                                              | Developer setup, scope, and validation commands                          |
| `compendium/project-foundation.md`                                       | Agent-facing architecture and QA conventions                             |
| `work/tickets/00-project-foundation/BW-0001-*.md` through `BW-0005-*.md` | Ticket breakdown for sprint traceability                                 |
| `work/sprints/ledger.tsv`                                                | Sprint ledger baseline compatible with `ticket-burn.py`                  |

## Definition of Done

- [ ] A `pnpm` workspace exists and installs cleanly from the repo root.
- [ ] `apps/web` exists, starts locally, builds successfully, and has a smoke test.
- [ ] `packages/domain` exports the initial build, profession, attribute, skill, equipment, party, guide, and provenance types without React or browser dependencies.
- [ ] Root scripts document and implement `dev`, `build`, `test`, `typecheck`, and `validate`.
- [ ] `fixtures/` contains a minimal safe baseline for a valid build skeleton, template-code samples, an invalid template sample, and at least one rule-edge case.
- [ ] `data/generated/`, `data/source-snapshots/`, and `scripts/data/` exist with placeholder documentation and no real imported content beyond safe minimal examples.
- [ ] `README.md` and `compendium/project-foundation.md` describe the same workspace layout, scope boundaries, and verification commands used by the scaffold.
- [ ] `work/tickets/00-project-foundation/` contains BW-0001 through BW-0005 linked to `SPRINT-001`.
- [ ] `work/sprints/ledger.tsv` exists and contains a `SPRINT-001` row with the correct final status and timestamp.
- [ ] `python3 scripts/test_ticket_burn.py` passes.
- [ ] `pnpm validate` passes in a clean checkout after dependency install.
- [ ] `EPIC-00` can be marked `done`, or any remaining gap is explicitly captured in ticket status and sprint follow-up notes.

## Risks

- Over-modeling the domain before `EPIC-02` and `EPIC-04` could harden the wrong shapes. Mitigation: keep types durable but thin, and defer parser and calculator logic.
- Introducing too many packages too early could slow a small repo. Mitigation: limit the initial workspace to `apps/web` and `packages/domain`.
- Using copied external content before `EPIC-01` could force source-policy rework. Mitigation: keep fixtures synthetic or minimal and avoid imported prose.
- Mixing repo automation and app tooling can blur validation ownership. Mitigation: keep `pnpm validate` for the TypeScript workspace and run `python3 scripts/test_ticket_burn.py` as separate repo-automation verification.

## Security

- Keep the sprint local-only. Do not add auth, remote storage, analytics, or server endpoints.
- Do not check in secrets, tokens, or live external API calls.
- Keep domain code pure and deterministic so later import/export and validation logic are testable without UI state.
- Do not render untrusted HTML or copied third-party prose in the scaffold.
- Reserve source snapshots and generated data locations now, but defer real ingestion until `EPIC-01` defines attribution and retention rules.

## Dependencies

- Internal blockers: none. `EPIC-00` is the first eligible epic.
- Tooling prerequisites: `pnpm`, a documented Node LTS version, and `python3` for existing ticket-burn tests.
- This sprint must finish before `EPIC-01` and `EPIC-02` rely on stable directory contracts for source snapshots, generated data, and fixtures.
- This sprint directly unblocks `EPIC-01` Source Policy and QA, `EPIC-02` Data Ingestion Platform, `EPIC-05` Template Compatibility, `EPIC-06` Game Rule Engine, and the later `EPIC-08` Core Build Editor.

## Open Questions

- Should future data-ingestion tooling stay in Python to match existing repo automation, or move to TypeScript once shared domain types are in place?
- Should template codec logic land in `packages/domain` or a later dedicated package such as `packages/template-codecs` when `EPIC-05` starts?
- Should PWA and offline support stay out until after the local library exists, or should the web scaffold reserve service-worker hooks earlier?
