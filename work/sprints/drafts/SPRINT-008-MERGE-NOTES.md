# SPRINT-008 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-008-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-008-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-008-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-008-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-008-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-008-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-008-GPT54-CRITIQUE.md`

## Accepted

- Use one canonical committed documentation artifact: `compendium/visual-prior-art.md`, linked from
  `compendium/README.md`.
- Keep screenshots and PvX references as development-reference-only material under
  `compendium/source-policy.md`; this sprint does not authorize runtime media, copied UI text, or
  public redistribution.
- Use Git-tracked enumeration, not filesystem `find`, as the authoritative screenshot corpus:
  `git ls-files -- 'prior-art/**/*.png' | LC_ALL=C sort`.
- Treat the current count of 36 tracked PNGs as the planning baseline and require a documented scope
  review if execution sees a different tracked corpus before observation work starts.
- Use full repository-relative paths as screenshot identity. Duplicate basenames and existing
  misspellings stay literal.
- Require each inventory row to include path, folder, verified PNG type, dimensions, categories, and
  visible-state tags.
- Require observations to separate visible facts, evidence paths, limitations, downstream consumers,
  and non-binding design implications.
- Require gap entries to name missing or weak evidence, available evidence, affected consumer, impact,
  owner, EPIC-08 blocking status, and next action.
- Keep future equipment, weapon-set, party/hero, and PvX references in a bounded deferred section.
- Use the simpler five-phase topology from GPT-5.4/GPT-5.5 while preserving GPT-5.6 Sol's stricter
  evidence and verification contracts.

## Rejected Or Adjusted

- Rejected `find prior-art -type f -name '*.png'` as the authoritative inventory command because it
  can include untracked local files. It remains useful only as a secondary local-artifact check.
- Rejected a second authoritative `prior-art/README.md` or machine-readable screenshot manifest for
  this sprint. Either would create sync cost before a consumer needs it.
- Rejected `gap-evidence` as a taxonomy category. Gaps belong in the gap register, not as screenshot
  tags.
- Adjusted the hard "exactly 36 forever" language. The final sprint records 36 as the current
  baseline, then requires explicit review if the tracked corpus changes before execution.
- Adjusted the full aspect-matrix idea so execution records meaningful coverage and limitations
  without forcing repetitive `not represented` prose where a compact gap entry is clearer.
- Adjusted verification to require `npm run verify` by default while allowing only explicit,
  evidence-backed documentation of unrelated failures if an outer runner or reviewer decides to
  block or waive separately.

## Valid Critiques Incorporated

- Add early mechanical verification after inventory and again after tooltip/template notes, rather
  than relying entirely on final closeout.
- Add corrupt, mislabeled, unreadable, or visually unusable PNGs as edge cases.
- Add dirty-worktree-safe protected-path review so unrelated changes are not mistaken for sprint
  work.
- Add alternatives considered to explain why the sprint chooses one canonical Markdown note.
- Separate visual-brief acceptance from administrative closeout in the Definition of Done while
  still keeping both required.
- Keep validation presentation as "validation-adjacent evidence" because current screenshots do not
  show Build Wars rule-engine messages directly.

## Local Feasibility Notes

- `work/sprints/ledger.tsv` has completed rows for `SPRINT-001` through `SPRINT-007`; `SPRINT-008`
  is the next sprint ID.
- `git ls-files -- 'prior-art/**/*.png'` currently returns 36 tracked PNG files, with folder counts:
  27 `gw-skills-and-attributes-refs`, 5 `gw1-equipment-panel`, 2 `gw1-weapon-sets`, and 2 `gwpvx`.
- `prior-art/gw-skills-and-attributes-refs/.DS_Store` exists locally but is ignored and not part of
  the tracked evidence corpus.
- `compendium/source-policy.md` already defines screenshots and prior-art images as development
  references only.
- `work/tickets/08-core-build-editor/EPIC.md` explicitly depends on EPIC-07 and needs references for
  in-game-inspired tooltips and skill display.
- EPIC-07 had no concrete BW tickets before this pass, so BW-0701 through BW-0705 were created for
  traceability.

## Interview

Interview skipped under the non-interactive ticket-burn contract. No high-risk architecture choice
blocks planning: the final sprint chooses the conservative documentation architecture and records the
alternatives.

## Final Assumptions

- `SPRINT-008` is the next sprint because `SPRINT-001` through `SPRINT-007` are completed in
  `work/sprints/ledger.tsv` and no `SPRINT-008.md` existed before this planning pass.
- EPIC-07 can be executed as one documentation/content sprint because BW-0701 through BW-0705 share
  one artifact boundary and have clear dependencies.
- The tracked prior-art corpus is 36 PNG files at planning time; execution must review and record any
  tracked-corpus delta before writing observations.
- Screenshots remain development references only and are not runtime media, generated data, test
  fixtures, or public release assets.
- Planning may update sprint, draft, ticket, ledger, run-state, and result-manifest records, but it
  must not modify application implementation code or create a commit.
