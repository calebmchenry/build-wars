# EPIC-20 Planning Synthesis

## Result

Prepared [EPIC-20](../../tickets/20-markdown-guide-workspace/EPIC.md), twelve
dependency-ordered tickets and the authoritative
[design brief](../../../compendium/guide-workspace.md). Updated the epic index,
roadmap and compendium index. This is backlog preparation; no feature implementation or
burn execution is claimed.

## Inputs and Reviewer Availability

- The human conversation supplies the product direction and authorization to
  document it for the burn script. Additional UX/ownership details are labeled as
  implementation defaults, not invented user decisions.
- Orientation inspected HEAD `f644b25`, current source/contracts and the runner.
  Existing unrelated working changes were preserved.
- The sprint-plan weather-report URL was inaccessible through the web tool;
  fallback model labels were Claude opus-4.8/max and Codex gpt-5.5/xhigh.
- Both CLI draft jobs were attempted with permission-preserving settings. Claude
  returned `Not logged in`; authentication was not changed and no Claude draft is
  represented as review evidence.
- Codex initially could not initialize its local service inside the shell sandbox.
  A user-approved retry retained the child agent's read-only mode and produced
  [the independent draft](EPIC-020-CODEX-DRAFT.md).
- [Local second-pass critique](EPIC-020-LOCAL-CRITIQUE.md) applies the skill's
  single-available-draft fallback. Reviewer diversity was reduced.

## Synthesis Decisions

- Accepted the integrated editor, explicit context, catalog-without-build support,
  current Build v4 snapshots, source portability, safe rendering and local recovery.
- Kept one semantic guide transaction owner and a separate unapplied source buffer,
  instead of maintaining independently mutable Markdown, vendor JSON and build
  objects. Invalid source remains recoverable and cannot partially apply.
- Moved transaction/history work ahead of UI integration. Required a bounded actual
  editor feasibility test before dependency selection and an explicit rendered
  writing acceptance gate.
- Split the draft's ten tickets into twelve to isolate source editing/transfer,
  local save/recovery and reading, while keeping placement and reference behavior
  independently reviewable.
- Defined generic versus bound/unresolved mentions, full drop/copy semantics,
  fragment identity remapping, stable variant anchors and coherent undo.
- Preserved game-template input and raw source fidelity without treating a code
  and an independently authored skill/attribute object as competing authorities.
- Used original example prose and source links. Public discovery, PvX intake,
  publishing and live-linked builds remain in the follow-up roadmap.
- Added no standalone generic editor app, backend, full equipment model or remote
  content pipeline. Historical speculative EPIC-20 search references do not expand
  the new epic.

## Workflow Adaptation

The requested artifact is input to `scripts/ticket-burn.py`, which creates its
own numbered sprints and ledger entries. Like the previous EPIC-19 preparation,
this setup writes an epic/brief/tickets and draft evidence without reserving the
next sprint or marking any sprint active. The conversation serves as the product
interview; routine details have documented defaults. No additional approval is
needed to write the requested backlog.

## Setup Verification

- Passed checks using the actual ticket-burn parser/selector: EPIC-20 is ready,
  all declared epic dependencies are completed, and targeted/default discovery
  selects EPIC-20 without bypass flags.
- All twelve listed BW tickets exist, are unique and backlog, identify EPIC-20,
  contain scope/acceptance/verification and have an ordered acyclic dependency
  graph. No premature planned/completed sprint metadata was added.
- Relative links in the brief, roadmap, indexes, epic, tickets and review artifacts
  resolve. Targeted Prettier checks and `git diff --check` pass. The repository's
  existing Prettier ignores cover epic/index/roadmap/draft files; those received
  metadata/link/diff review rather than a misleading formatting claim.
- Both `python3 scripts/ticket-burn.py EPIC-20 --dry-run` and
  `python3 scripts/ticket-burn.py --dry-run` select only EPIC-20. Their preflight
  warning is the uncommitted working tree, including unrelated pre-existing edits.
- There is no active sprint; no SPRINT-021 was reserved. The completed ledger,
  runner code, product code and generated catalogs were not changed by this task.
- No implementation suites or browser product verification were run for this
  documentation-only preparation; those checks are required by the execution
  tickets and are not claimed complete.

A real burn requires a clean starting tree. Existing unrelated edits and these
planning files have not been committed, discarded or bypassed. No burn execution
was launched.
