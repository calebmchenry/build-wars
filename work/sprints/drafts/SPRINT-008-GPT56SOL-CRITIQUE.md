# Combined Critique: Sprint 008 Visual Prior Art Drafts

## Review Scope

Reviewed drafts:

- `work/sprints/drafts/SPRINT-008-GPT55-DRAFT.md`
- `work/sprints/drafts/SPRINT-008-GPT54-DRAFT.md`

Not reviewed:

- `work/sprints/drafts/SPRINT-008-GPT56SOL-DRAFT.md`

This artifact was recovered from `SPRINT-008-GPT56SOL-CRITIQUE.md.log` after the
`--output-last-message` wrapper overwrote the child-written markdown file.

## Overall Assessment

Both drafts are executable and converge on the same core plan: create one canonical
`compendium/visual-prior-art.md`, keep screenshots as development references, inventory the 36 PNG
files, extract factual notes, and close with a gap register. The merged sprint should retain GPT55's
observation model, policy boundary, and downstream ownership while adopting GPT54's simpler phasing,
phase gates, and stronger closeout discipline.

## GPT55 Draft Critique

### Strengths

- Clear documentation boundary: one compendium note, no application code, no image movement, and no
  runtime asset approval.
- Strong observation model that distinguishes surface, evidence, observed fact, downstream use, and
  limitation.
- Good separation between EPIC-08 MVP surfaces and later equipment, party, guide, and PvX references.
- Practical source-policy posture for screenshots and PvX/community content.

### Weaknesses

- Phase 1 verifies a "tracked" corpus with `find`, which can include untracked or ignored files.
- The taxonomy is described as adjustable, which can cause reclassification churn after notes are
  already written.
- It allows `prior-art/README.md` conditionally, which risks creating a second source of truth.
- Phase gates are weaker than GPT54's; completion is not always tied to a concrete artifact check.
- It leaves open questions about corpus changes and copied-label limits that should be resolved in
  the final sprint defaults.

### Gaps And Edge Cases

- Untracked PNGs under `prior-art/` could be accidentally inventoried.
- Corrupt or mislabeled `.png` files are not handled explicitly.
- Duplicate basenames and typoed filenames need full-path identity, not category aliases.
- A screenshot may support multiple surfaces but not justify a generalized design target.
- Dirty worktree noise can make broad status checks misleading.

### Definition Of Done Completeness

The DoD covers the main deliverables but should require Git-tracked enumeration, deterministic path
ordering, verified PNG type/dimensions, visible-state tags, gap ownership, and protected-path review.

## GPT54 Draft Critique

### Strengths

- Easier to execute than GPT55, with a direct sequence: inventory, core editor notes, transient UI
  notes, future-surface notes, then closeout.
- Keeps EPIC-08 first in the phase order while preserving useful later-epic references.
- Makes `compendium/visual-prior-art.md` the canonical durable artifact and avoids a second
  authoritative index.
- Has a concise risk table and practical files summary.
- Requires `npm run verify` and explicit no-change checks for screenshot assets.

### Weaknesses

- It also uses `find` for a tracked-corpus claim.
- Inventory structure is too thin: it lacks verified PNG type, visible-state tags, and a stronger
  evidence-quality model.
- The taxonomy is less precise than GPT55's and mixes generic names such as `menu-control` with
  specific surfaces.
- Gap analysis lists known gaps but does not require impact, owner, justification, and next action
  for every gap.
- Closeout is bundled into Phase 5 and may fail late due to unrelated repo state.

### Gaps And Edge Cases

- No clear fallback for corrupt PNGs, uppercase extensions, symlinks, or tracked files with invalid
  image data.
- No explicit owner for deciding whether a newly discovered gap blocks EPIC-08.
- Composite screenshots need multi-category handling and limits on what each crop proves.
- PvX/community text constraints need a stronger source-policy audit.

### Definition Of Done Completeness

GPT54 has the stronger execution shape but the weaker DoD. It should inherit GPT55's observation
schema and stricter inventory/gap requirements.

## Cross-Draft Contradictions

| Topic | GPT55 | GPT54 | Merge Resolution |
| --- | --- | --- | --- |
| Sprint status | `draft` | `planned` | Final sprint should be `planned` after merge and manifest creation. |
| Corpus command | Uses `find` despite tracked-corpus language | Uses `find` despite tracked-corpus language | Use `git ls-files -- 'prior-art/**/*.png' | LC_ALL=C sort` for canonical enumeration and a separate on-disk scan only for local artifacts. |
| Taxonomy | More specific but adjustable | Simpler and fixed | Freeze a specific vocabulary before observation work; additions require explicit migration. |
| Gap handling | Better gap concept, weak gate | Simple gap list | Require gap ID, evidence, consumer, impact, owner, and next action. |
| Canonical docs | Allows conditional `prior-art/README.md` | One compendium note only | Keep one authoritative compendium note; future README can only link if separately justified. |
| Verification failure | Allows unrelated failures to be documented | Requires pass | Require pass by default; if unrelated failure exists, record command, cause, and clean sprint-scoped diffs. |

## Merge Recommendations

- Use Git-tracked screenshot enumeration, not filesystem `find`, as the authoritative corpus.
- Treat 36 files as the planning-time expectation; if execution-time tracked count differs, record a
  scope review before observation work.
- Keep `compendium/visual-prior-art.md` as the single authoritative note and link it from
  `compendium/README.md`.
- Define the taxonomy and observation schema before note-taking begins.
- Separate inventory facts, surface observations, and non-binding evidence-derived visual
  characteristics.
- Keep future equipment, party, hero, and PvX notes as a bounded appendix.
- Add earlier mechanical checks for links, path reconciliation, and protected-path diffs before final
  closeout.
