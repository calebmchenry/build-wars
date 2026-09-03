# Combined Critique: SPRINT-019 GPT-5.6-SOL and GPT-5.5 Drafts

## Executive Assessment

Both reviewed drafts are pointed in the right direction. They keep Sprint 019 scoped as an
application-composition pivot rather than a domain or persistence redesign, they preserve the
selected-loadout model from the prior multi-build sprints, and they correctly treat `Any`,
inline template workflow, and icon policy as product-boundary decisions rather than incidental UI
details.

The drafts are not equally strong as execution plans. `SPRINT-019-GPT56SOL-DRAFT.md` is the better
base for sequencing, dependency ordering, and Definition of Done structure. It makes the phase
dependencies explicit, closes more semantic loopholes up front, and does a better job tying risky
interaction work to phase gates. `SPRINT-019-GPT55-DRAFT.md` is stronger on a few closeout hygiene
details, especially its explicit full regression command and `git diff --check`, but it leaves more
execution-critical choices open and contains at least one internal behavior contradiction.

The combined plan still needs two upgrades before it is safe to execute:

1. an earlier end-to-end durability gate that proves selected-loadout editing survives shell
   refactoring before deeper UI work lands;
2. a tighter, more testable verification matrix for transient state transitions, responsive/manual
   checks, and no-selection document states.

## Review of `SPRINT-019-GPT56SOL-DRAFT.md`

### Strengths

- It has the strongest dependency model. The explicit execution-order graph correctly places shell
  and header semantics before attribute/catalog specialization, requires the catalog before atomic
  skill placement, and delays inline template work until authored field semantics are stable.
- Its binding decisions do real work instead of restating goals. The draft freezes `Any` as UI-only
  `null`, keeps reducers catalog-free, makes removal-target deletion authoritative, and blocks
  remote media fallback paths.
- The phase gates are outcome-oriented. Each phase has a clear condition that must hold before the
  next risky interaction layer starts, which is important for a sprint that touches `App.tsx`,
  selected-loadout routing, template workflow, drag/drop, and icon policy at once.
- Its verification strategy is the more comprehensive one. It covers targeted suites per phase,
  includes manual review where jsdom cannot prove layout or drag behavior, and treats no-network
  icon verification as a first-class requirement instead of an implied follow-up.
- The Definition of Done is substantially more complete than the GPT-5.5 draft. Breaking it into
  composition, header semantics, attributes, catalog/bar, inline templates, icons/accessibility,
  and closeout makes omissions easier to spot and keeps the acceptance criteria closer to the actual
  risk surface.
- Its risk analysis is materially stronger. It identifies several non-obvious failure modes that are
  easy to miss in this sprint: raw-overlay loss during elite enforcement, dragend-based accidental
  deletion, inline buffer overwrite, clipboard race conditions, modal-state persistence drift, and
  source-policy violations.

### Weaknesses

- The draft is extremely broad for one sprint. It spans IA refactor, shell movement, selected-
  loadout routing, custom pickers, attribute controls, grouped catalog behavior, drag/drop parity,
  inline import/export, icon infrastructure, responsive polish, documentation, and governance
  artifacts. The detail is good, but the integration load is still high.
- Phase 0 is strong on product/contract freeze, but weak on named baseline evidence. It calls for
  existing focused tests and `npm run verify`, yet it does not enumerate the exact selected-loadout,
  share, backup/restore, build-set, party, equipment, and title suites that should be captured
  before `App.tsx` composition changes begin.
- The shell moves early, but a full durability vertical slice still lands too late. The draft does
  not require an explicit edit -> selected-loadout switch -> autosave/pagehide -> reload proof
  before profession, attribute, catalog, and bar interaction work start stacking on top of the new
  shell.
- Some closeout obligations are described rather than made executable. Phase 8 says to review the
  final diff for unexpected changes, but it does not name `git diff --check` the way the GPT-5.5
  draft does. For a sprint with large CSS and component churn, explicit diff hygiene is useful.
- A few Definition of Done clauses are still too qualitative to audit cleanly. Terms such as
  "scannable," "reachable," "useful traceability," and broad responsive states need named manual
  checks or concrete viewport widths to become objectively pass/fail.

### Gaps in Risk Analysis

- There is no explicit risk entry for transient UI state loss across document changes. The draft
  covers inline buffer overwrite in place, but not the broader case of switching selected loadouts
  while a picker is open, while drag state is active, or while advanced filters/disclosures are
  dirty.
- Performance and rerender churn are mostly absent from the risk table. This sprint adds grouped
  catalog rendering, derived attribute rows, icon descriptors, secondary workspace composition, and
  more app-layer selectors; no risk entry covers sluggishness or accidental recomputation after the
  shell pivot.
- Native drag-and-drop browser variance is only indirectly addressed. The draft recognizes jsdom
  limits and drag-image fallback, but it does not explicitly call out browser event-order variance
  as a planning risk even though pointer drag is part of the primary workflow.

### Missing Edge Cases

- Switching build-set or party selection while the inline template field has unsaved text, while a
  profession picker is open, or while a slot drag is active needs named behavior and verification.
- Autosave/pagehide behavior during local-only UI state changes should be proven explicitly so the
  shell refactor cannot accidentally persist or discard the wrong editor during a transition.
- Empty build-set and empty selected party-slot states need keyboard/focus verification, not only
  render verification, because the main composer is absent and the recovery path depends on the
  secondary workspace entry point.
- Search, group collapse, advanced-filter disclosure, and Show More behavior should be exercised
  after document-context switches so stale UI state does not leak across single-build, build-set,
  and party contexts.

### Definition of Done Completeness

This is the stronger Definition of Done. It is closer to execution-ready because it captures more of
the sprint's real risk surface and keeps the acceptance language aligned to the architecture. It is
still not fully complete. The merged plan should add:

- one named end-to-end durability proof covering edit, selected-loadout switch, autosave/pagehide,
  reload, and restore/transfer survival;
- explicit viewport widths or manual scenarios for responsive acceptance;
- explicit focus/keyboard acceptance for no-selection states and secondary-workspace recovery;
- explicit diff/build hygiene at closeout.

## Review of `SPRINT-019-GPT55-DRAFT.md`

### Strengths

- The draft is easier to scan and operationalize quickly. Its phase narrative is shorter, the gate
  language is concise, and the overall plan is less text-heavy while still covering the major
  feature areas.
- It proposes a dedicated `skill-bar-workflow.ts` planner. That is a good separation for the most
  mutation-sensitive interaction in the sprint and is cleaner than letting placement logic drift
  into reducer or component code.
- Its closeout verification is more explicit in a few useful places. The draft names a broad final
  regression command, includes `npm run verify`, and explicitly requires `git diff --check`.
- Phase 0 correctly tries to freeze the IA map, `Any` semantics, and icon-policy path before
  implementation starts. The instinct is right even where the freeze is incomplete.
- The flatter Definition of Done is easier to consume at a glance and does cover most primary
  product promises: composer-first boot, selected-loadout preservation, secondary-surface access,
  atomic skill-bar behavior, inline templates, icon policy, and no new runtime dependencies.

### Weaknesses

- Its dependency ordering is less disciplined. The phase order is reasonable, but the draft does not
  explain the dependencies as well as the GPT-5.6-SOL version, which makes it harder to know which
  later phases are truly blocked versus merely listed later.
- Several execution-critical decisions are still open after the supposed IA freeze. The open
  questions revisit secondary-surface visibility, remaining first-screen filters, template import
  trigger semantics, transient message content, and cost-glyph asset policy. Those are not harmless
  polish questions; they change component contracts and verification expectations.
- Phase 0 over-claims its baseline verification. The task list says to baseline persistence,
  selected-loadout sharing, build sets, party, equipment, and title ranks, but the listed
  verification command does not actually name suites for most of those areas.
- The draft contains an internal contradiction in the catalog plan. Earlier sections say that no
  concrete professions means all playable player skills, but Phase 4 later asks for a useful empty
  state for "no concrete professions." That is a behavior conflict, not just wording drift.
- It increases parity risk by introducing more parallel component tracks without a comparably strong
  removal gate. New focused components and reused legacy surfaces coexist across multiple phases,
  but the verification plan is not as explicit about when old paths are retired safely.

### Gaps in Risk Analysis

- There is no explicit risk for late-frozen contract decisions. Because the draft leaves more open
  questions in execution-critical areas, it should acknowledge the risk that header, catalog, or
  inline-template contracts will change after downstream phases have already started.
- The risk table does not call out the Phase 0 verification undercoverage, even though this sprint
  depends heavily on proving selected-loadout durability before the shell is rearranged.
- It omits transient-state risks that the GPT-5.6-SOL draft names more clearly, including stale
  clipboard completions, inline field resynchronization, and drag cancellation ambiguity.
- It is weaker on durability-specific risk framing. Pagehide flush, write-blocked storage, revision
  conflict, and selected-loadout editor survival through shell transitions are mostly left to
  implied regression coverage instead of named planning risks.

### Missing Edge Cases

- Switching loadouts while the build name editor is dirty, while a picker is open, or while inline
  template input is mid-edit is not called out clearly enough.
- Empty build-set behavior is underrepresented compared with empty selected party-slot behavior. The
  shell phase mentions no active loadout, but the later verification and DoD emphasis is skewed
  toward party empty states.
- The catalog contradiction around both professions being `Any` should be tested directly so the
  default path cannot oscillate between "show all playable skills" and "show empty-state help."
- Clipboard race conditions, rejected-copy focus behavior, and field resync after successful import
  are not covered as explicitly as they should be for the inline-template phase.
- The draft should name cross-context regression cases where search, disclosure, or selection UI
  state is carried from single-build to build-set or party mode after the shell refactor.

### Definition of Done Completeness

The Definition of Done is good at the product-feature level, but weaker as an execution control
document. It is less complete than the GPT-5.6-SOL draft in four important ways:

- it is thinner on durability-specific acceptance for pagehide, storage diagnostics, and selected-
  loadout survival during transitions;
- it is thinner on transient-state and focus behavior;
- it is less explicit about manual verification scope and measurable responsive criteria;
- it does not make all of its own implied decisions testable, especially around both-Any catalog
  behavior and parity/removal timing for legacy surfaces.

## Cross-Draft Comparison

| Area | GPT-5.6-SOL | GPT-5.5 | Recommendation |
| --- | --- | --- | --- |
| Sequencing clarity | Strong explicit execution graph and phase dependencies. | Reasonable order, but dependencies are mostly implicit. | Use GPT-5.6-SOL as the phase/dependency backbone. |
| Early contract freeze | More decisions are actually frozen with defaults. | More decisions reopen later through open questions. | Keep GPT-5.6-SOL defaults and trim GPT-5.5 open questions before execution. |
| Baseline verification | Broader intent, but Phase 0 test naming is too general. | Better explicit commands, but Phase 0 undercovers what it claims to baseline. | Merge both: name targeted baseline suites early, then keep explicit full closeout commands. |
| Skill-bar planning seam | Good planner concept, but less explicitly modularized. | Dedicated `skill-bar-workflow.ts` is a strong separation. | Keep GPT-5.5's dedicated planner module inside the GPT-5.6-SOL execution order. |
| Risk analysis | Stronger and more realistic. | Adequate, but materially thinner on transient-state and durability risk. | Use GPT-5.6-SOL risk framing as the base. |
| Definition of Done | More complete and better segmented. | Easier to scan, but flatter and less auditable. | Use GPT-5.6-SOL DoD structure, then simplify wording where it becomes qualitative. |
| Closeout hygiene | Good, but missing explicit `git diff --check`. | Better explicit closeout commands. | Add GPT-5.5's diff-check and broad regression command to the GPT-5.6-SOL closeout. |

## Long-Range Planning Risks Shared by Both Drafts

### Shell-First Without Early Durability Proof

Both drafts move the first-screen composition very early, but neither one makes a full selected-
loadout durability slice an immediate gate after that move. This sprint touches the one area where
visual reorganization and persistence safety intersect. A merged plan should prove that the active
editor survives edit, selection switch, autosave, pagehide, reload, restore, and share/transfer
boundaries before later interaction work compounds the regression surface.

### Transient UI State Across Context Changes

Both drafts are strong on authored-state semantics and weaker on local UI state semantics. The
merged plan should define what happens to open pickers, drag state, inline template drafts,
disclosures, focus anchors, and selection affordances when the active document or selected loadout
changes under them.

### Responsive and Manual Verification Precision

Both drafts acknowledge manual verification needs, but neither one pins down a sufficiently
concrete matrix. "Desktop," "narrow," and "200% zoom" are directionally correct, but still too
loose for closeout evidence. The plan should name exact viewport widths or representative layout
states and define which behaviors must be confirmed in each one.

## Merge Recommendations

1. Use `SPRINT-019-GPT56SOL-DRAFT.md` as the base execution plan for phase order, dependency logic,
   binding decisions, and segmented Definition of Done.
2. Pull in `SPRINT-019-GPT55-DRAFT.md`'s explicit closeout hygiene: the broad final regression
   command and `git diff --check`.
3. Add a mandatory durability gate immediately after the shell phase: edit a selected loadout,
   switch context, autosave or pagehide, reload, and confirm the same authored state survives in
   single-build, build-set, and party cases.
4. Tighten Phase 0 baseline verification in both spirit and command list. Name the exact suites for
   selected-loadout sharing, build-set, party, equipment, title ranks, storage diagnostics,
   backup/restore, and transfer before `App.tsx` composition changes start.
5. Resolve the GPT-5.5 catalog contradiction explicitly: both professions set to `Any` must have
   one deterministic default behavior, and the verification plan must test that behavior directly.
6. Freeze the remaining execution-critical questions before implementation. At minimum: explicit
   Apply-only inline import, first-screen advanced-filter scope, secondary-workspace recovery path
   in no-selection states, and the default no-approved-assets branch for BW-1808.
7. Add transient-state acceptance cases for dirty inline input, open picker menus, active drag,
   search/disclosure state, and focus restoration across selected-loadout changes.
8. Make responsive/manual acceptance auditable with named widths or named layout scenarios, plus a
   checklist for keyboard-only, reduced-motion, long-text, diagnostics-visible, drag-visible, and
   offline icon states.
9. Keep GPT-5.5's dedicated skill-bar workflow/planner module, but place it under GPT-5.6-SOL's
   stricter catalog-before-bar dependency model.
10. Simplify qualitative DoD language into testable outcomes. Replace words like "scannable" or
    "reachable" with concrete assertions about visible controls, focus path, disabled states, and
    verified interaction results.

## Bottom Line

`SPRINT-019-GPT56SOL-DRAFT.md` is the stronger draft overall. It is better sequenced, more explicit
about dependencies, materially stronger on verification and risk framing, and much closer to a real
acceptance document. `SPRINT-019-GPT55-DRAFT.md` still contributes useful pieces, especially a clean
skill-bar workflow seam and better explicit closeout hygiene, but it should not be the primary merge
base without first closing its open questions, fixing its Phase 0 verification undercoverage, and
resolving its both-Any catalog contradiction.
