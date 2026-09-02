# SPRINT-008 Combined Critique

## Review Scope

- Reviewed: `work/sprints/drafts/SPRINT-008-GPT56SOL-DRAFT.md`
- Reviewed: `work/sprints/drafts/SPRINT-008-GPT55-DRAFT.md`
- Not reviewed: `work/sprints/drafts/SPRINT-008-GPT54-DRAFT.md`

This artifact was recovered from `SPRINT-008-GPT54-CRITIQUE.md.log` after the
`--output-last-message` wrapper overwrote the child-written markdown file.

## `SPRINT-008-GPT56SOL-DRAFT.md`

### Strengths

- Stronger sequencing: deterministic inventory first, then EPIC-08 surfaces, transient UI, deferred
  references, synthesis, and closeout.
- Explicit dependency ordering through inventory contract, consumer map, controlled categories, and
  gap taxonomy.
- Strong verification: tracked-file enumeration, count reconciliation, header-based PNG validation,
  path checks, formatting, protected-path review, and repository verification.
- Complete DoD covering inventory integrity, observation coverage, downstream ownership, source
  policy, and closeout consistency.
- Most open questions are resolved as defaults.

### Weaknesses

- Phase 5 is overloaded with synthesis, gap classification, compendium indexing, verification,
  ticket updates, ledger updates, and result manifest work.
- Verification remains somewhat back-loaded; broken links or citations may survive until closeout.
- The policy structure is heavy for a small documentation sprint.
- The DoD hardcodes a 36-file baseline while also allowing execution-time corpus deltas.
- Broad status/diff checks can fail on unrelated dirty worktree state.

### Missing Edge Cases

- Corrupt or unreadable tracked `.png` files.
- Screenshots that do not fit the initial taxonomy.
- Dirty protected paths unrelated to the sprint.
- Corpus count deltas that require both inventory and DoD updates.

## `SPRINT-008-GPT55-DRAFT.md`

### Strengths

- Clear and concise phase order.
- Single-compendium deliverable is easy to understand.
- More realistic about unrelated `npm run verify` failures for documentation-only work.
- Consistent about staying out of application code and runtime assets.

### Weaknesses

- Uses `find` instead of Git-tracked enumeration.
- Inventory contract lacks verified PNG type, visible-state tags, deterministic full-path ordering,
  and folder-by-folder reconciliation.
- Verification is weaker than GPT56SOL and lacks early mechanical checks.
- Open questions leave execution-critical policy unresolved.
- Taxonomy mixes surface labels and meta buckets such as `gap-evidence`.

### Missing Edge Cases

- Untracked PNGs included by `find`.
- Corrupt or mislabeled files.
- Dynamic corpus changes during execution.
- Multi-surface screenshots requiring both categories and visible-state tags.
- Pre-existing worktree changes making global status checks noisy.

## Comparison

GPT56SOL is the better baseline for correctness and auditability. GPT55 is easier to execute and has
a useful allowance for documenting unrelated verification failures, but it needs GPT56SOL's corpus
and observation rigor.

Both drafts overload the closeout phase, rely heavily on manual review, and need earlier mechanical
checks for link/citation correctness. Both need a dirty-worktree-safe method to prove the sprint did
not change protected code or assets.

## Merge Recommendations

- Use GPT56SOL as the baseline.
- Keep its tracked-file enumeration, full-path identity, consumer map, controlled categories, gap
  classification, and detailed DoD.
- Import GPT55's practical verification caveat only with strict evidence: exact failing command,
  reason it is unrelated, and clean sprint-scoped diffs.
- Resolve the baseline rule by treating 36 as planning expectation and requiring a documented scope
  review if the execution-time tracked corpus differs.
- Add earlier mechanical verification after Phase 1 and Phase 3.
- Replace broad global status checks with protected-path or baseline-aware checks.
- Add handling for corrupt images, vocabulary extension, and composite screenshots.
