# SPRINT-008 Combined Critique

## Review Scope

- Reviewed: `work/sprints/drafts/SPRINT-008-GPT56SOL-DRAFT.md`
- Reviewed: `work/sprints/drafts/SPRINT-008-GPT54-DRAFT.md`
- Not reviewed: `work/sprints/drafts/SPRINT-008-GPT55-DRAFT.md`

This artifact was recovered from `SPRINT-008-GPT55-CRITIQUE.md.log` after the
`--output-last-message` wrapper overwrote the child-written markdown file.

## SPRINT-008-GPT56SOL-DRAFT

### Strengths

- Strongest architecture: it treats the sprint as evidence management with inventory facts, surface
  observations, aesthetic targets, explicit gaps, downstream ownership, and policy boundaries.
- Uses Git-tracked enumeration and full-path identity, which handles duplicate basenames and typoed
  filenames better than filename- or folder-based identity.
- Defines a useful gap register contract and a consumer map for EPIC-08, EPIC-13/14, EPIC-17, and
  EPIC-18/19.
- The DoD is precise and auditable.

### Weaknesses

- The process is heavy for a 36-image documentation sprint and risks reviewer fatigue.
- One large compendium document may become hard to maintain if the screenshot corpus grows.
- Phase 5 combines artifact acceptance, source-policy review, ticket status updates, ledger sync,
  result manifest creation, formatting, and full repo verification.
- Some checks assume a clean worktree and may confuse unrelated existing changes with sprint scope.

### Architecture Assumptions To Challenge

- One Markdown file can remain the only durable index as the corpus grows.
- Manual review alone can maintain stable taxonomy, citation correctness, and evidence quality.
- Path-only identity is sufficient forever; it is correct now, but future renames could need stable
  observation IDs.
- All later-surface notes can be captured without diluting EPIC-08 focus.

### Missing Edge Cases

- Tracked PNG outside the four expected folders.
- Untracked PNGs that `find` would see but Git-tracked enumeration should exclude.
- Broken relative links from the `compendium/` directory.
- Visually unreadable, blank, duplicate, corrupt, or over-cropped screenshots.
- Conflicting interpretations across multiple screenshots.
- Metadata that should not leak into documentation.

### Definition Of Done Completeness

Very strong, but it should trim repeated matrix requirements and separate visual-brief acceptance
from administrative closeout.

## SPRINT-008-GPT54-DRAFT

### Strengths

- Clearer and easier to execute, with direct dependency order.
- Keeps EPIC-08 work first, then template/tooltip notes, then deferred future-surface notes.
- Makes one canonical compendium note and avoids an authoritative `prior-art/README.md`.
- Provides a practical files summary and a concise risk table.

### Weaknesses

- Uses `find` for a tracked-corpus claim.
- Taxonomy is less precise and less tied to downstream surfaces.
- Observation schema is too thin and does not clearly separate fact, limitation, and recommendation.
- Gap register does not require owner, impact, justification, and resolution trigger for every gap.
- Verification lacks `format:check`, protected-path diff checks, and source-policy audit depth.

### Scope Creep And Hidden Complexity

- Future equipment, weapon, party, hero, and PvX sections could become too broad unless treated as a
  bounded appendix.
- The "validation presentation" use case can overpromise because the screenshots do not directly
  cover inline validation states.
- Manual dimension extraction needs a repeatable local command.
- Composite screenshots need careful category assignment so a tooltip crop does not imply underlying
  control behavior.

### Definition Of Done Completeness

Usable but too coarse. It should inherit GPT56SOL's tracked-file enumeration, verified PNG facts,
visible-state tags, link resolution, gap ownership, and protected-path review.

## Comparison

GPT56SOL is more architecturally defensible; GPT54 is easier to execute. The merged sprint should use
GPT56SOL's evidence contracts and risk controls, edited down with GPT54's simpler phase topology.

The final sprint should avoid averaging the drafts. Keep the rigorous inventory and gap rules, but
avoid forcing exhaustive prose for every absent state where a compact gap entry is enough.

## Merge Recommendations

1. Use `git ls-files -- 'prior-art/**/*.png' | LC_ALL=C sort` as the canonical corpus source.
2. Keep `compendium/visual-prior-art.md` as the only authoritative committed note.
3. Allow temporary local aids during execution, but do not commit a second manifest unless a later
   ticket authorizes it.
4. Require one row per tracked PNG with full path, folder, valid PNG type, dimensions, controlled
   categories, and visible-state tags.
5. Require every observation to include evidence path, visible fact, uncertainty/limits, and
   downstream consumer.
6. Require every gap to include missing state, available evidence, impact, owner epic, EPIC-08
   blocking status, and next action.
7. Add alternatives considered: generated manifest, split docs, stable screenshot IDs, EPIC-08-only
   scope, and temporary contact sheet.
8. Keep future-surface notes separate and bounded.
9. Require `npm run verify` by default, but if an unrelated failure exists, record the exact command,
   cause, and sprint-scoped clean diff evidence.
10. Add protected-path verification for `prior-art`, app code, tests, data tooling, packages, and
    build configuration.
