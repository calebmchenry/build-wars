# Sprint 001 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-001-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-001-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-001-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-001-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-001-GPT54-CRITIQUE.md`

## Command Resolution

- `codex` resolved to `/Users/calebmchenry/.nvm/versions/node/v22.11.0/bin/codex`.
- The installed Codex CLI is `codex-cli 0.152.0`.
- `--full-auto` is not exposed by this CLI; draft and critique lanes used the supported non-interactive equivalent `--dangerously-bypass-approvals-and-sandbox`.
- All three lanes ran with `model_reasoning_effort="xhigh"` and produced usable artifacts.

## Orientation Summary

- The repo is unscaffolded: it contains project docs, prior-art screenshots, EPIC files, and the ticket-burn runner, but no app code.
- `README.md` and `work/roadmap.md` point toward a local-first Guild Wars Reforged build tool with TypeScript web UI, template compatibility, data ingestion, rule validation, equipment, parties, and local storage in later phases.
- `EPIC-00` is dependency-free and specifically asks for app shape, package layout, local/hosted/PWA posture, core domain boundaries, test tooling, fixture strategy, and data/source-snapshot locations.
- Ticket conventions use `BW-000x` IDs for EPIC-00 and statuses `backlog`, `ready`, `in-progress`, `blocked`, and `done`.
- Sprint artifacts belong under `work/sprints/`, and the ticket-burn runner expects the plan result manifest at `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-00-result.json`.

## Accepted Draft Inputs

- Accepted the local-only foundation boundary shared by all drafts: no backend, auth, hosted sharing, PWA/service worker, local library, live ingestion, template parser, or full rule engine in this sprint.
- Accepted the React/Vite/TypeScript direction from the drafts because it matches the roadmap's TypeScript web app preference and supports a later rich build editor.
- Accepted GPT-5.6-sol's stronger domain invariants: plain JSON-compatible data, schema versions on authored roots, numeric catalog IDs, no closed catalog enums, and exactly eight nullable skill slots.
- Accepted GPT-5.6-sol and GPT-5.5's recommendation to prefer a single package initially. A workspace split is deferred until there is another runtime, package lifecycle, or conflicting tooling need.
- Accepted GPT-5.4's clearer execution phasing and closeout emphasis, but compressed traceability into four tickets to reduce planning overhead.
- Accepted critique recommendations to define one canonical verification command and require `npm ci`, lint, typecheck, tests, build, and Python ticket-burn tests.
- Accepted critique recommendations to keep fixtures synthetic and avoid template-code, invalid-template, and rule-edge fixtures until later epics own those semantics.

## Rejected Or Deferred Draft Inputs

- Rejected the pnpm workspace / `apps/web` / `packages/domain` structure for SPRINT-001. The repo has one deployable and no current second consumer; `src/domain` plus enforced boundaries is lower cost.
- Rejected hard-coded current major versions such as Node 24, React 19, Vite 8, TypeScript 7, and ESLint 10. The sprint instead requires a compatible Node/npm baseline, exact versions recorded in lockfiles, and implementation-time compatibility checks.
- Deferred runtime schema validation to the first import boundary or ingestion epic. TypeScript contracts are not treated as runtime validation.
- Deferred template-code samples, invalid template fixtures, PvE/PvP split fixtures, and rule-edge fixtures to EPIC-05 and EPIC-06.
- Deferred package extraction, generated-data commit policy, raw source retention policy, PWA behavior, hosted CI, and deployment targets to their owning later epics.

## Interview

Skipped per the non-interactive automation contract. Architecture uncertainty was assessed as medium, not high-risk blocking, because the roadmap already prefers a TypeScript web app and local-only first milestone.

## Assumptions

- The first implementation should use a single private npm package with `package-lock.json`.
- The implementation should use React, Vite, TypeScript, Vitest, ESLint, and Prettier unless a concrete incompatibility appears during execution.
- The Node/npm baseline should be compatible with the current local environment and the selected Vite/toolchain versions, and exact resolved versions should be recorded by project files.
- The first milestone is local-only and static-browser-app oriented.
- `src/domain` is the initial domain boundary; package/workspace extraction is intentionally deferred.
- Foundation fixtures are synthetic and non-authoritative until EPIC-01 defines source policy.

## Local Feasibility Notes

- `scripts/ticket-burn.py` only discovers EPIC files, so BW ticket files are for traceability and human/agent execution rather than burn selection.
- `work/sprints/ledger.tsv` can be generated by the sprint-plan ledger script from the final sprint heading.
- The final sprint must keep task checkboxes unchecked while planned; the execute phase is responsible for checking them before a completed manifest.
- `.gitignore` rules must be written carefully so `data/**/README.md` policy files remain tracked while future raw/generated contents stay ignored.
- `npm run verify` can include `python3 -m unittest scripts/test_ticket_burn.py`; this creates one repo-wide command without losing the existing automation test.
