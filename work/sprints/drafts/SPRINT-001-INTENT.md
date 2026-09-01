# Sprint 001 Intent: Project Foundation

## Seed

Create an executable sprint from `work/tickets/00-project-foundation/EPIC.md` for ticket-burn target `BACKLOG`, source epic `EPIC-00`.

Automation constraints:

- Keep planning non-interactive unless a high-risk architecture choice blocks progress.
- Write sprint artifacts under `work/sprints/` and `work/sprints/drafts/`.
- Create or update BW ticket files under `work/tickets/00-project-foundation/` when useful for traceability.
- Do not modify implementation code during planning.
- Do not commit.

## Context

- The repository is at the project-foundation stage. It contains roadmap and ticket docs, prior-art screenshots, and the ticket-burn runner, but no application scaffold yet.
- `README.md` defines the product goal as a Guild Wars Reforged build tool covering template creation/import/export, runes/insignias, parties, local storage, and an in-game aesthetic where possible.
- `work/roadmap.md` recommends a TypeScript web app, local-only first milestone, separate data ingestion scripts, durable domain models, and fixture-driven tests for template/data edge cases.
- `work/tickets/README.md` defines backlog status values and BW ticket naming; `EPIC-00` tickets should use the `BW-000x` range.
- The only commit is repository initialization (`7660030 Initialize Build Wars backlog and ticket runner`), so the sprint should establish conventions without needing to preserve app code patterns.

## Recent Sprint Context

No prior sprint documents exist under `work/sprints/`. This should become `SPRINT-001` and establish the sprint ledger baseline.

## Relevant Codebase Areas

- `README.md` — product goals and broad expected capabilities.
- `work/roadmap.md` — researched Guild Wars data/template constraints and phased project direction.
- `work/tickets/README.md` and `work/tickets/index.md` — ticket structure, statuses, and epic ordering.
- `work/tickets/00-project-foundation/EPIC.md` — source scope and completion criteria.
- `scripts/ticket-burn.py` and `scripts/test_ticket_burn.py` — automation expectations and manifest shape.
- `prior-art/` — existing screenshots that later UI work should preserve and reference.

## Constraints

- Follow `AGENTS.md`: keep human-facing communication concise and direct.
- Use `work/sprints`, not `docs/sprints`, for final and draft sprint artifacts.
- Planning may update documentation/ticket records, but must not scaffold or edit implementation code in this planning pass.
- The execution sprint should prefer a TypeScript web app unless implementation discovers a blocking constraint.
- The first milestone should be local-only; hosted sharing and cloud accounts are out of scope for foundation work.
- Data ingestion scripts and source snapshots should be separated from UI/runtime code.
- The first implementation sprint must be runnable in a clean repo and should define an explicit test command.

## Success Criteria

- The final sprint is internally consistent, phased, and executable from the current repo state.
- The sprint chooses an initial stack and local-only milestone posture with recorded assumptions.
- The sprint defines package layout, domain model boundaries, test tooling, fixture strategy, and data/source-snapshot locations.
- Concrete BW tickets exist for the EPIC-00 work and are linked to `SPRINT-001`.
- The sprint ledger can be synced from `work/sprints/SPRINT-001.md`.
- The ticket-burn plan manifest reports `status: planned`.

## Verification Strategy

- Reference implementation: none for the foundation scaffold itself.
- Spec/documentation: `EPIC-00`, `work/roadmap.md`, `README.md`, and the ticket-burn manifest contract define correctness.
- Edge cases identified: no existing app code, empty sprint ledger, dependency-free first epic, future data pipeline separation, future template compatibility requirements, and local-only scope boundaries.
- Testing approach: the implementation sprint should add a documented test command, at least one smoke/app test, and domain/fixture tests that prove the core types and fixture layout compile.

## Uncertainty Assessment

- Correctness uncertainty: Low — foundation acceptance criteria are explicit and no external protocol implementation is required yet.
- Scope uncertainty: Medium — EPIC-00 spans stack choice, docs, domain boundaries, and tests, so the sprint must avoid pulling in feature implementation.
- Architecture uncertainty: Medium — selecting the app stack matters, but the roadmap already strongly prefers a TypeScript web app and local-only first milestone.

## Open Questions

1. Should the first implementation use React/Vite/Vitest as the default TypeScript web stack, or keep the scaffold framework-agnostic?
2. How much of the domain model should be concrete TypeScript types now versus architecture documentation only?
3. Which fixture files should exist in the foundation sprint before the data ingestion pipeline is available?
4. Where should future generated data, checked-in fixtures, and source snapshots live so later epics can extend them safely?
