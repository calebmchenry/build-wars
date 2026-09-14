# EPIC-19 Planning Synthesis

## Result

Prepared [EPIC-19](../../tickets/19-composer-attribute-adjustments/EPIC.md), eight
dependency-ordered tickets, and the authoritative
[design brief](../../../compendium/attribute-adjustments.md). This is backlog
preparation; no product implementation or burn execution is claimed.

## Inputs and reviewer availability

- The human conversation supplied scope, inline controls, primary-profession
  eligibility, real rune icons, inferred buff defaults with overrides, blue-rank
  reference art, draft persistence, and unchanged game-file behavior.
- Orientation inspected the current source at 52f64ec, rather than relying on
  outdated descriptions of the old secondary panels.
- The sprint-plan weather report resolved Claude opus-4.8/max and Codex
  gpt-5.5/xhigh. Both CLI draft commands were launched independently.
- Claude failed with `OAuth session expired and could not be refreshed`; no draft
  was produced. Authentication was not changed.
- Codex produced [an independent draft](EPIC-019-CODEX-DRAFT.md).
- [Local critique](EPIC-019-LOCAL-CRITIQUE.md) supplied the second pass under the
  skill's single-available-draft fallback. Reviewer diversity was reduced.

## Accepted and rejected choices

- Accepted Build schema migration, stable effect preferences, centralized
  projection, explicit external Refrain strength, and normal-code compatibility.
- Rejected the draft's no-inferred-effects-on-import statement: the user's
  accepted defaults infer supported self effects from an imported skill bar.
- Replaced whole-profile legacy snapshotting with per-contribution overrides.
  This preserves unrelated and unresolved legacy armor without exposing slots.
- Added a dedicated rune asset ticket with the observed 30-image cache boundary.
- Added explicit clone/serialization, dirty-versus-code fingerprint, unresolved
  data, template-folder, and mode/eligibility regression cases.
- Defined primary-change reset behavior and external Refrain's first-enabled +1
  default; these are routine planning assumptions, not new human blockers.
- Kept named-library UI, new complete-build transfer formats, armor slots, and raw
  equipment-template integration outside this first milestone.

## Workflow adaptation for ticket-burn

The user's requested artifact is the input to `scripts/ticket-burn.py`. That
runner creates numbered sprints and ledger entries using its configured planner.
Do not pre-create SPRINT-020 or mark any sprint active during this setup. Existing
completed sprint ledger entries remain untouched. The human interview was already
complete; the final files are the requested reviewable setup, not a permission gate.

## Setup verification

- Passed actual `ticket-burn.py` parser/selector checks: EPIC-19 is ready and its
  completed epic dependencies are satisfied; its eight listed BW tickets are
  unique, backlog, dependency-ordered, and have no premature sprint metadata.
- Passed dependency DAG, no-active-sprint, and relative markdown-link checks.
- Both `python3 scripts/ticket-burn.py EPIC-19 --dry-run` and the untargeted
  `python3 scripts/ticket-burn.py --dry-run` selected only EPIC-19. Before the
  setup commit, the only preflight warning was these new uncommitted documents.
- Passed targeted Prettier checks and `git diff --check`.
- Product source, generated catalogs, burn code, and completed sprint ledger were
  not modified. Implementation suites/browser tests were not run for this
  markdown-only setup; they remain required by BW-1908.

The setup is committed separately so a subsequent burn starts with a clean tree.
The root task checks the clean-tree dry run after that commit; it does not launch
the actual planning/execution loop.
