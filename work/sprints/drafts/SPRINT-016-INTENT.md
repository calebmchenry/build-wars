# Sprint 016 Intent: Title Rank Controls and PvE-only

## Seed

Create a ticket-burn sprint from `work/tickets/15-title-tracks-and-pve-only/EPIC.md` for
`EPIC-15 Title Rank Controls and PvE-only`.

Automation contract:

- mode: ticket-burn
- non_interactive: true
- ticket_dir: `work/tickets`
- sprint_dir: `work/sprints`
- source_target: `BACKLOG`
- source_epic: `EPIC-15`
- source_epic_path: `work/tickets/15-title-tracks-and-pve-only/EPIC.md`
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with
  best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs are a final sprint at `work/sprints/SPRINT-016.md`, planning artifacts under
`work/sprints/drafts/`, useful traceability updates to `EPIC-15` and BW-1501 through BW-1505,
ledger sync, and result manifest
`work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-15-result.json`.

## Context

- `SPRINT-001` through `SPRINT-015` are completed in `work/sprints/ledger.tsv`; `SPRINT-016` is the
  next sprint ID.
- `EPIC-15` is `ready`, depends on completed EPIC-04 skills, EPIC-06 validation, EPIC-08 core
  editor, and EPIC-09 local library/sharing work.
- EPIC-04 already exposes title-scaling metadata through skill progression dependencies:
  `SkillProgressionSeries.dependency.kind === "title-rank"`, `titleKey`, and `rankDomain`.
- The current app renders title-scaled skills at maximum title rank in
  `src/app/editor-selectors.ts`, but records that behavior as an assumption and has no authored
  user override state.
- Domain validation currently emits generic `skill.title-deferred` and
  `skill.allegiance-deferred` warnings for title-classified skills or title-rank progression keys.
- The existing PvE-only limit is implemented in `src/domain/rules/skill-bar.ts` and should be
  preserved rather than redesigned.

## Recent Sprint Context

- `SPRINT-005` promoted the runtime skill catalog with classification, split-mode, structured
  descriptions, progression series, title keys, and `rankDomain` facts.
- `SPRINT-007` added the domain validation engine, deterministic validation issues, PvE-only skill
  limit checks, and deferred title legality warnings.
- `SPRINT-009` shipped the core single-character skill/attribute editor, including the skill
  browser, skill bar, `SkillDisplay`, `SkillTooltip`, and maximum-title-rank tooltip assumptions.
- `SPRINT-010` shipped local-library persistence, working-draft autosave, saved records,
  backup/restore, freshness facts, and skill-template share URLs.
- `SPRINT-014` and `SPRINT-015` added semantic equipment state and editor integration. EPIC-15 must
  coexist with nullable equipment and equipment rank adjustments without taking over equipment
  semantics.

## Relevant Codebase Areas

- `src/domain/catalog.ts` defines `SkillDependencyRef`, `SkillProgressionSeries`, skill
  classification, mode availability, and `rankDomain`.
- `src/domain/skill-tooltip.ts` renders structured skill descriptions from caller-supplied rank
  context. It currently requires every title-rank key to be present in `context.ranks`.
- `src/domain/rules/skill-eligibility.ts` emits `skill.title-deferred` and
  `skill.allegiance-deferred` warnings from selected skills and progression title keys.
- `src/domain/rules/skill-bar.ts` owns the existing three-PvE-only-skill limit.
- `src/domain/validation.ts`, `src/domain/validation-context.ts`, and `src/domain/rule-engine.ts`
  own validation issue codes, metadata, ordering, options, and validated-against facts.
- `src/domain/build.ts` defines the persisted `Build` contract. EPIC-15 needs title-rank state
  either in `Build` or an adjacent persisted editor/workspace state with a clearly documented
  migration boundary.
- `src/app/editor-state.ts` owns editor state, reducer actions, blank build construction, and
  browser filters.
- `src/app/editor-selectors.ts` builds validation input, skill display view models, tooltip rank
  context, progression labels, and assumption copy.
- `src/app/persistence-schema.ts`, `src/app/local-storage.ts`, `src/app/backup-restore.ts`, and
  tests own durable local data and must preserve older records.
- `src/app/components/SkillTooltip.tsx`, `src/app/components/SkillDisplay.tsx`,
  `src/app/components/SkillBar.tsx`, `src/app/components/SkillBrowser.tsx`, and the existing editor
  panel components define UI patterns for compact controls and inline feedback.
- `src/app/styles.css` contains responsive editor layout and form-control styles.
- `test/domain/skill-eligibility-rules.test.ts`, `test/domain/skill-bar-rules.test.ts`,
  `test/domain/rule-engine.test.ts`, `test/domain/validation-context.test.ts`,
  `test/domain/skill-catalog.test.ts`, `src/app/editor-selectors.test.ts`,
  `src/app/skill-display.test.tsx`, `src/app/persistence-schema.test.ts`,
  `src/app/local-storage.test.ts`, `src/app/App.test.tsx`, and focused component tests are likely
  verification homes.
- `README.md`, `compendium/skills-catalog.md`, `compendium/game-rule-engine.md`,
  `compendium/core-build-editor.md`, `compendium/local-library-and-sharing.md`, and a new or
  existing compendium title-rank note are closeout documentation candidates.

## Constraints

- Follow `AGENTS.md`: keep human-facing communication concise and direct.
- This planning run may write planning, ticket, ledger, run-state, and manifest artifacts only. It
  must not modify implementation code or create a commit.
- Runtime generated catalog imports remain isolated to `src/app/catalogs.ts`; EPIC-15 should reuse
  existing EPIC-04 skill catalog facts and must not create a separate title ingestion pipeline
  unless implementation proves the skill catalog cannot identify needed title keys and ranges.
- Store only user overrides from implicit maximum title ranks where practical. If the user never
  edits a title rank, max-rank behavior should remain implicit and durable.
- Rank controls must be discrete integer controls with min/max clamping from `rankDomain`, not
  slider-only controls.
- Show controls for title ranks relevant to the current skill bar first. An expanded all-title view
  may exist, but it must not dominate the editor.
- Normalize title dependency keys into stable authored state keys and user-facing labels. Known
  aliases such as duplicate Sunspear key forms should resolve to one user-facing control.
- Treat allegiance as rank-first for MVP. Add a narrow side/exclusivity warning or tiny control only
  if selected skill/catalog facts require it for clear validation.
- Preserve the existing PvE-only skill count behavior and browser availability filtering unless
  focused tests reveal a bug.
- Existing skill, profession, attribute, equipment, template import/export, local library,
  share URL, backup/restore, and validation workflows must remain compatible.
- No account title ownership, title acquisition, reputation farming, campaign unlock guides, party
  title state, backend sync, runtime remote fetches, copied source prose, or broad title catalog is
  planned.

## Success Criteria

This sprint is successful when the final sprint document is executable and covers:

- BW-1501 through BW-1505 in dependency order with file-level tasks, verification gates, and
  closeout records.
- Title-rank domain/app helpers that discover all title-rank dependencies from EPIC-04 progression
  metadata, normalize/alias keys, expose labels and min/max rank domains, and derive selected ranks
  from implicit max plus persisted user overrides.
- Authored title-rank override state that stays empty by default, clamps invalid values, resets by
  removing overrides, and survives local-library working drafts, saved records, duplication,
  backup/restore, and hydration.
- Compact title-rank controls that focus on selected-skill title dependencies, support optional
  all-title view, integer stepping/direct entry/reset-to-max, keyboard/screen-reader operation, and
  quiet display of current/max ranks.
- Tooltip, skill-bar, skill-browser, and skill-display paths that render title-scaled descriptions
  from selected/default title ranks without hidden max-rank assumption copy.
- Validation cleanup that suppresses generic title deferral warnings when title dependencies resolve
  to configured/default rank state, keeps deterministic warnings for missing/unsupported/ambiguous
  metadata, preserves the three-PvE-only-skill limit, and handles allegiance uncertainty narrowly.
- Docs, tickets, sprint records, ledger, and run manifest that agree on `SPRINT-016`, `EPIC-15`,
  the covered BW tickets, assumptions, deferred scope, and no-code-change planning boundary.

## Verification Strategy

- Reference implementation: none. Correctness is defined by EPIC-15 grooming decisions, BW-1501
  through BW-1505 acceptance criteria, EPIC-04 skill progression metadata, existing domain/app
  contracts, and current PvE-only rule behavior.
- Spec/documentation: `work/tickets/15-title-tracks-and-pve-only/EPIC.md`,
  `work/tickets/15-title-tracks-and-pve-only/BW-150*.md`, `work/sprints/SPRINT-005.md`,
  `work/sprints/SPRINT-007.md`, `work/sprints/SPRINT-009.md`, `work/sprints/SPRINT-010.md`,
  `work/sprints/SPRINT-015.md`, `compendium/skills-catalog.md`,
  `compendium/game-rule-engine.md`, `compendium/core-build-editor.md`, and current app/domain tests.
- Edge cases identified:
  - selected title-scaled skills when no user override exists
  - direct entry below min, above max, non-integer, blank, and malformed persisted ranks
  - duplicate or aliased title keys, including Sunspear variants
  - selected skills with missing `titleKey`, missing `rankDomain`, empty progression rows, or
    unsupported description/progression data
  - title-classified skills without progression keys
  - allegiance-ranked skills that may imply Kurzick/Luxon side semantics
  - PvE-only skill count at exactly three and four selected skills in PvE mode
  - PvE-only/title skills in PvP or unknown mode
  - changing selected skills so relevant controls appear/disappear without losing overrides
  - reset-to-max removing overrides without dirtying unrelated state
  - old persisted library records without title-rank state
  - backup/restore and saved-build duplication preserving only bounded title override data
  - tooltip rendering alongside equipment attribute-rank adjustments
  - responsive title control placement, long labels, focus order, and inline issue placement
- Testing approach:
  - focused domain tests for title key discovery, aliasing, rank domains, rank resolution, clamping,
    validation suppression, unresolved metadata warnings, allegiance warnings, and PvE-only limit
    regressions
  - app reducer/selector tests for override state, relevant-title filtering, tooltip rank context,
    progression labels, skill display assumptions, and validation input
  - component tests for title controls, direct entry, increment/decrement, reset-to-max,
    keyboard/screen-reader semantics, empty/no-relevant-title states, and responsive placement
  - persistence/local-library/backup tests for old records, new override data, malformed values,
    dangerous keys, bounds, hydration, duplication, and export/import behavior
  - final `npm run verify`

## Uncertainty Assessment

- Correctness uncertainty: Medium - progression metadata exists, but key normalization and
  suppressing title deferrals without hiding real metadata gaps require careful tests.
- Scope uncertainty: Low-Medium - tickets are groomed and dependency ordered, and the epic is a
  bounded UX/state increment.
- Architecture uncertainty: Low - the sprint extends existing domain helper, app selector,
  reducer/component, validation, and persistence patterns with no new external integration.

## Open Questions

Questions for the draft lanes to answer without blocking planning:

1. Should title-rank override state live directly on `Build`, in persisted `EditorState`, or in a
   narrowly versioned adjacent state record to preserve template/export boundaries?
2. Which helper layer should own title dependency discovery, key aliasing, labels, min/max domains,
   and default-max rank resolution so domain validation and app selectors do not duplicate logic?
3. Where should compact relevant-title controls sit in the existing editor layout without crowding
   profession, attribute, skill, and equipment workflows?
4. What exact validation inputs should indicate that a title dependency is resolved by default or
   user override versus missing/unsupported metadata?
5. How should title-classified skills with no title-rank progression keys be handled so generic
   warnings are not either noisy or falsely suppressed?
6. Is allegiance side/exclusivity visible enough as a narrow warning, or is a minimal side selector
   necessary for selected catalog facts?
7. Which persistence migration choice best preserves older local-library schema compatibility while
   storing only override-from-max title rank values?
