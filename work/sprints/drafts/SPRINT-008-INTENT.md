# Sprint 008 Intent: Visual Prior Art

## Seed

Create a sprint from `work/tickets/07-visual-prior-art/EPIC.md` for the ticket-burn BACKLOG run.

Automation contract:

- Mode: ticket-burn
- Source target: BACKLOG
- Source epic: EPIC-07
- Sprint directory: `work/sprints`
- Draft artifacts directory: `work/sprints/drafts`
- Source epic path: `work/tickets/07-visual-prior-art/EPIC.md`
- Non-interactive planning; skip routine interview unless a high-risk architecture choice appears
- Auto-approve if the sprint is internally consistent and executable
- Do not modify application implementation code and do not commit

The final sprint must be executable, update planning records, and write
`work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json`.

## Context

- Build Wars is a local-first React/Vite and TypeScript app with framework-neutral domain contracts
  in `src/domain`, data tooling under `scripts/data`, compendium documentation under `compendium`,
  and ticket-burn planning records under `work/tickets` and `work/sprints`.
- `SPRINT-001` through `SPRINT-007` are completed in `work/sprints/ledger.tsv`; the next sprint ID
  is `SPRINT-008`.
- EPIC-01 established the source policy: screenshots and prior-art images are
  development-reference-only and must not become runtime assets without a future explicit approval
  and attribution decision.
- EPIC-08 depends on EPIC-07 and needs concrete visual reference notes for the profession selector,
  attribute editor, skill bar, skill search/list/grid views, skill tooltips, template controls, and
  validation presentation.
- The existing screenshot corpus contains 36 tracked PNG files under `prior-art/`: 27
  skills/attributes references, 5 equipment-panel references, 2 weapon-set references, and 2 PvX
  guide references. An ignored local `.DS_Store` is present and should not be inventoried.

## Recent Sprint Context

- `SPRINT-005` made the runtime skills catalog and renderer-neutral tooltip facts available for
  future UI, while keeping copied/source text and media handling policy-gated.
- `SPRINT-006` added template import/export support and deferred user-facing paste dialogs and
  template UI to later app work.
- `SPRINT-007` added pure build validation and effective attribute rank calculation, giving EPIC-08
  the rule-engine outputs it will need to surface visually.
- Recent sprint plans consistently separate runtime app code, domain contracts, source/audit
  artifacts, compendium notes, ticket records, and run manifests.

## Relevant Codebase Areas

- `prior-art/gw-skills-and-attributes-refs/` contains screenshots for the skills/attributes panel,
  skill bar, skills menu, row and grid skill views, profession selector, template controls, dialogs,
  hover menus, skill tooltips, party selector, and hero-selected state.
- `prior-art/gw1-equipment-panel/` contains equipment panel, equipment tooltip, weapon tooltip, and
  hero-selected references for later equipment work.
- `prior-art/gw1-weapon-sets/` contains weapon-set and weapon-set tooltip references.
- `prior-art/gwpvx/` contains PvX guide display references for later community-build and guide
  authoring work.
- `compendium/source-policy.md` and `compendium/data-qa-and-release.md` define screenshot and
  prior-art handling: development reference only, not runtime media.
- `src/app/App.tsx` and `src/app/styles.css` are still a minimal foundation shell; this sprint
  should not implement the final visual system.
- `work/tickets/08-core-build-editor/EPIC.md` is the immediate consumer of EPIC-07 output.

## Constraints

- Follow `AGENTS.md`: keep human-facing updates concise and direct.
- Planning and execution for this epic should modify only planning, ticket, compendium, and
  documentation artifacts; application implementation code is out of scope for this planning pass.
- Existing screenshot files must not be moved, cropped, optimized, transformed, renamed, or added
  during the visual-note sprint unless a later explicit ticket approves asset changes.
- Notes must be factual and tied to relative screenshot paths. Avoid broad aesthetic claims that
  cannot be traced to an image.
- Screenshots, PvX references, and in-game UI text remain development references, not runtime assets
  or copied runtime content.
- EPIC-07 output should guide EPIC-08 without hard-coding screenshot dimensions or prescribing final
  React component implementation.
- `npm run verify` is the canonical repository validation command, but the sprint should also call
  out cheaper manual path/link checks because the work is documentation-heavy.

## Success Criteria

- `SPRINT-008` covers BW-0701 through BW-0705 in dependency order and can be implemented without
  another planning decision.
- Every tracked PNG under `prior-art/` is inventoried with path, folder/category, dimensions, and UI
  reference grouping.
- Factual notes cover skills panel, attributes, skill bar, profession selector, skill list/grid
  views, skill tooltip variants, template dialogs/menus, equipment panel, weapon sets, party
  selector, and PvX guide display.
- Observations record typography, color families, borders, spacing, icon treatment, selected states,
  disabled or empty states, tooltip behavior, and missing states where visible.
- Remaining screenshot gaps are explicit and bounded, especially standalone rune, insignia,
  weapon-upgrade item tooltips and full party-window references.
- `compendium/visual-prior-art.md` or equivalent durable documentation gives EPIC-08 and later UI
  tickets concrete screenshot citations.
- Planning records and manifest are written without touching application implementation code or
  creating a commit.

## Verification Strategy

- Reference implementation: no code reference implementation exists; correctness is defined by the
  existing screenshot corpus, EPIC-07 scope, EPIC-01 source policy, and later EPIC-08 citation
  needs.
- Spec/documentation: `work/tickets/07-visual-prior-art/EPIC.md`,
  `compendium/source-policy.md`, `compendium/data-qa-and-release.md`, and
  `work/tickets/08-core-build-editor/EPIC.md`.
- Edge cases identified: ignored `.DS_Store`, misspelled file name
  `display-only-build-tempalte.png`, duplicate `hero-selected.png` names in separate folders,
  screenshots with hover tooltips embedded beside list rows, PvX/community content that must remain
  development-reference-only, and gaps that are useful later but not MVP-blocking.
- Testing approach: manual image/path review, file-count reconciliation, link checks from compendium
  notes to screenshot paths, source-policy review, and `npm run verify` during execution closeout.

## Uncertainty Assessment

- Correctness uncertainty: Medium - the task is documentation-heavy and depends on human visual
  judgment, but the corpus and required categories are small and concrete.
- Scope uncertainty: Low - EPIC-07 is bounded to inventory, factual notes, grouping, gaps, and
  planning closeout.
- Architecture uncertainty: Low - this sprint should add durable documentation and ticket records,
  not new runtime architecture or application code.

## Open Questions

1. What is the most useful inventory shape for later agents: one Markdown table in
   `compendium/visual-prior-art.md`, a separate `prior-art/README.md`, or both?
2. Which visual observations should be promoted into a general aesthetic target versus kept as
   per-screenshot facts?
3. How should PvX guide screenshots be cited so later guide-display work can learn from them without
   copying community prose or treating the screenshots as runtime assets?
4. Which screenshot gaps are MVP blockers for EPIC-08, and which can remain later follow-ups?

