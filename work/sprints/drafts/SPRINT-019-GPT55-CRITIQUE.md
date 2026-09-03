# SPRINT-019 Combined Draft Critique

## Review Scope

- Reviewed `work/sprints/drafts/SPRINT-019-GPT56SOL-DRAFT.md`.
- Reviewed `work/sprints/drafts/SPRINT-019-GPT54-DRAFT.md`.
- Did not read or critique `work/sprints/drafts/SPRINT-019-GPT55-DRAFT.md`.
- Missing listed artifacts: none.

This critique focuses on architecture assumptions, scope creep risk, hidden complexity, missing
alternative designs, edge cases, and Definition of Done completeness.

## Critique of `SPRINT-019-GPT56SOL-DRAFT.md`

### Strengths

- The draft has the stronger architecture boundary. It explicitly keeps `WorkspaceState`,
  `EditorState`, `Build`, schema 2 persistence, selected-loadout boundaries, template policy, and
  generated catalog imports intact.
- The `Any` profession semantics are unusually clear: `Any` is UI language over `null`, not a
  persisted sentinel, catalog record, or template wildcard.
- The skill placement model is well specified. A catalog-aware app-layer planner producing plain
  placement facts is the right direction because reducers should not import generated catalog data.
- The draft correctly treats drag-and-drop as an enhancement and prevents accidental off-bar
  deletion by requiring a visible removal target.
- Inline template import/export is framed as presentation over existing transactional workflow
  policy, with local edit buffers, exact-source preference, canonical proof, dirty guards, and
  clipboard fallback.
- Icon policy is handled defensively. The draft avoids hidden asset-fetch prerequisites and treats
  CSS/text fallbacks as a complete baseline unless source-policy-approved binaries already exist.
- The Definition of Done is comprehensive and preservation-oriented. It repeatedly checks that
  build sets, parties, equipment, title ranks, sharing, backup/restore, validation, raw overlays,
  catalog attribution, autosave, and storage behavior survive the UI pivot.

### Weaknesses

- The sprint is probably too large. It combines an IA pivot, shell extraction, custom profession
  picker, attribute editor redesign, catalog redesign, atomic skill placement, inline template
  replacement, icon infrastructure, broad visual polish, docs, tickets, ledger, and final manifest
  closeout.
- The draft is close to an implementation specification rather than a sprint plan. Its detail is
  useful, but it may make execution brittle by binding exact component names, contract names, test
  files, UI behaviors, and removal timing before implementation evidence exists.
- The custom profession picker is a large accessibility project on its own. Roving focus,
  `aria-activedescendant`, outside-click behavior, focus restoration, icons, `Any` semantics,
  validation messaging, and loadout-switch resync are all packed into one phase.
- The secondary workspace assumption is under-tested as product architecture. The draft assumes a
  collapsed secondary surface can preserve discoverability, but it does not compare disclosure,
  drawer, route, tabbed workspace, or command-palette alternatives.
- The `Any` model deliberately reuses `null`, but the draft does not fully confront the ambiguity
  between "user intentionally chose Any", "profession has never been chosen", and "imported raw
  profession is unresolved". It chooses the right no-schema default, but the UX and tests need to
  prove that these cases remain distinguishable where they matter.
- Removing modal-only template UI in the same sprint adds unnecessary regression risk. Keeping the
  modal as a temporary fallback until inline parity is proven would lower blast radius.
- BW-1808 is described as visual polish but includes an icon descriptor abstraction, allowlist
  policy, new component primitive, glyph system, drag-preview reuse, and no-remote enforcement. That
  is architecture work, not just polish.
- The draft assumes current validation and budget rules are adequate for the new incremental UI,
  especially PvP/Unknown behavior. That may be true, but the resulting disabled/enabled states could
  still look arbitrary to users unless the UI explains the policy.

### Gaps in Risk Analysis

- It does not sufficiently quantify or mitigate performance risk from showing all playable skills
  when both professions are `Any`, especially with grouping, search auto-expand, batching, long
  names, modeled facts, and advanced filters.
- Accessibility risk is present indirectly but deserves its own top-level risk. Custom comboboxes,
  drag alternatives, live regions, collapsed groups, inline template editing, secondary disclosure
  focus, and responsive stacking create many ways to pass unit tests while still failing keyboard or
  screen-reader use.
- The risk list does not clearly identify "moving existing surfaces" as a state ownership problem.
  Repositioning library, party, build-set, equipment, title, share, and validation controls can
  break focus restoration, dirty guards, dialog ownership, and selected editor materialization even
  if their reducers are unchanged.
- There is no rollback or partial-merge strategy. If BW-1805 or BW-1806 runs long, the sprint needs
  a known shippable boundary after shell/header/catalog work.
- Visual verification is mostly manual. Given the scope of layout changes, the plan should require
  a small documented viewport matrix with before/after screenshots or another repeatable review
  artifact, even if it avoids a new visual-test dependency.
- The draft does not call out test-suite maintenance cost. Many new focused component tests plus
  broad regression suites may slow execution enough to force scope cuts.

### Missing Edge Cases

- Switching selected build-set entry or party member while a profession picker, name edit, drag
  operation, catalog keyboard pick, or inline template buffer is active.
- Share-fragment boot combined with corrupt storage, memory-only storage, or an empty selected
  party/build-set loadout.
- Exact-source export after renaming only the chat-wrapper name, changing only the build name, or
  importing a code with no name.
- Clipboard write resolution after the active loadout changes or after the proven export string has
  changed.
- All-playable catalog mode with missing generated facts, unsupported records, professionless
  records, duplicate localized labels, and very large result counts.
- Effective rank display when equipment modifies an attribute that is no longer eligible under the
  current primary/secondary selection.
- Drag payloads from stale catalog rows after filters, profession, mode, or selected loadout change.
- Advanced filter collapse state interacting with search reveal, group collapse, Show more, and
  selected-profession/all scope.
- The no-selected-loadout composer boundary while secondary workspace is closed, while storage has
  diagnostics, or while a dirty guard is pending.

### Definition of Done Completeness

- The DoD is strong and unusually complete for preservation, data safety, template fidelity, no
  remote media, accessibility labels, and regression coverage.
- It is too broad to be a practical sprint closeout checklist without prioritization. Some items are
  core correctness, while others are polish, documentation consistency, or manual review. The final
  sprint should split DoD into "must pass", "manual evidence", and "deferred/stretch".
- It needs measurable acceptance for secondary-workspace discoverability. "Reachable" is weaker
  than "keyboard reachable from the first screen, focus returns after dialogs, and no primary
  workflow requires opening it".
- It should state whether modal template UI removal is required for sprint completion or permitted
  only after inline parity is proven. The current wording makes removal feel required and risky.
- It should explicitly require evidence that no schema, lockfile, dependency, generated data, or
  unapproved binary change occurred.

## Critique of `SPRINT-019-GPT54-DRAFT.md`

### Strengths

- The draft is much easier to execute from. It presents the work as a sequence of phases with a
  clear dependency topology and avoids over-binding exact internal contracts.
- It correctly identifies the sprint as an app-composition pivot rather than a domain rewrite.
- It includes a useful baseline/regression-freeze phase before layout work. That is a good guard
  against accidental regressions in selected-loadout, share, storage, build-set, party, equipment,
  title, and raw-overlay behavior.
- The architecture table is compact and mostly points ownership to the right areas: app shell,
  selectors, reducer, template workflow, catalogs, and preserved secondary surfaces.
- It keeps the major constraints visible: no new schema, no new route, no backend, no runtime
  dependency, no remote fetch, and `npm run verify` as final gate.
- The plan recognizes that BW-1804 and BW-1807 are the useful parallel lanes and that skill-bar
  work should wait for the catalog source surface.

### Weaknesses

- The draft under-specifies the highest-risk behavior. `Any`, selected-loadout boundaries,
  raw-template overlays, elite enforcement, drag removal, exact-source export, inline import
  failure, and clipboard fallback are named but not defined deeply enough for safe implementation.
- It says skill placement rules should remain reducer-owned, but the reducer cannot safely decide
  duplicate and elite policy without catalog facts. The draft needs the app-layer placement-plan
  separation from the GPT56SOL draft.
- "A stable removal target or drag-off path" is dangerous wording. Drag-off deletion can be confused
  with Escape, browser cancellation, or a failed drop. The final plan should require an explicit
  removal target and explicit clear commands only.
- The draft keeps `ProfessionModeEditor.tsx` as a possible implementation locus. That may be
  pragmatic, but it risks turning an old component into a catch-all for profession pickers, naming,
  mode, icon policy, and validation copy.
- The secondary-surface architecture remains vague. It does not decide whether preserved workflows
  live below the composer, inside a disclosure, in tabs, in a drawer, or behind a route-like
  workspace mode.
- Icon work is too optimistic. "Policy-compliant local/static assets under `public/` or
  `src/app/assets/`" leaves room for accidental asset-policy bypass unless exact approval,
  provenance, and no-remote runtime tests are required.
- Verification is too narrow for the UI and state changes. Many phases rely heavily on
  `App.test.tsx`, `editor-selectors.test.ts`, and `editor-state.test.ts`, with too few focused
  component and workflow tests.
- The DoD is concise but high-level. It does not enumerate enough preservation, accessibility,
  responsive, raw-overlay, storage, selected-loadout, and no-remote-media criteria.

### Gaps in Risk Analysis

- The risk register is too sparse for the planned blast radius. It omits accessibility,
  performance, focus restoration, no-selected-loadout states, autosave/pagehide coupling, storage
  diagnostics, source-policy enforcement, and modal-to-inline migration risk.
- It does not call out that moving existing panels may change dialog ownership and dirty-guard
  behavior even if persistence code is untouched.
- It does not address the ambiguity of representing both deliberate `Any` and unresolved/missing
  profession state with `null`.
- It does not discuss failure modes when current selectors were built for a dense workspace and are
  reused for a focused catalog with collapsed groups and reduced controls.
- It does not establish a fallback if real icon assets are unavailable. Placeholders are allowed,
  but the acceptance threshold for "good enough" is not clear.
- It does not include a scope-control mechanism if custom pickers, skill-bar parity, or inline
  template parity exceeds the sprint budget.

### Missing Edge Cases

- Primary `Any` versus secondary `Any`/None export semantics.
- Duplicate professions, secondary set without primary, and imported unresolved professions.
- Build-set and party empty selection states that must not materialize phantom editors or fall back
  to the first loadout.
- Raw overlay movement during slot swap, explicit removal, duplicate catalog placement, elite
  replacement, and unresolved-skill preservation.
- Invalid or stale drag payloads, unsupported/non-player catalog records, foreign MIME payloads, and
  cancelled drag operations.
- Inline template parse, decode, resolve, dirty-guard, equipment/title warning, and selected-loadout
  cancellation paths.
- Clipboard denial, missing Clipboard API, and stale async copy feedback.
- Long names, long skill names, missing facts, zero/special catalog facts, 200% zoom, and narrow
  viewport overlap.
- Storage write-blocked, corrupt restore, conflict, and memory-only states after the shell move.
- Advanced-filter preservation after controls are demoted from the first screen.

### Definition of Done Completeness

- The DoD captures the right headline outcomes but is not complete enough to gate execution safely.
- It needs detailed state-preservation criteria for autosave, pagehide, local saves, backup/restore,
  build-set transfer, party transfer, equipment, title ranks, raw overlays, validation, and share
  URLs.
- It should require targeted component tests for the new header, attribute rows, skill browser,
  skill bar, inline template controls, and icon contract rather than relying mostly on app-level
  tests.
- It should explicitly require no runtime remote media paths and no unapproved binary additions.
- It should separate "modal replaced inline" from "modal removed". Inline parity can be required
  without requiring same-sprint deletion.
- It should require documented manual review for keyboard-only operation, narrow layout, long text,
  reduced motion, drag states, and offline rendering.

## Comparison

- `SPRINT-019-GPT56SOL-DRAFT.md` is the safer architecture document. It identifies more state
  boundaries, more preservation requirements, and more exact failure modes.
- `SPRINT-019-GPT54-DRAFT.md` is the safer execution outline. It is shorter, easier to scan, and
  starts with a practical regression-freeze phase.
- GPT56SOL's main risk is scope and over-prescription. It tries to make too many details binding in
  one sprint and may cause implementation churn if the current code shape resists the proposed
  component boundaries.
- GPT54's main risk is under-specification. It leaves too many critical semantics to be discovered
  during implementation, which is dangerous for template fidelity, raw overlays, selected loadouts,
  and drag removal.
- Both drafts assume the current application can be rearranged into a focused composer without a
  route or broader navigation model. That may be right for this sprint, but the final plan should
  explicitly compare alternatives before locking the disclosure-based secondary workspace.
- Both drafts treat the sprint as one cohesive delivery. The combined plan should identify a
  shippable midpoint and mark visual/icon polish or modal deletion as stretch if core composer
  safety runs long.

## Merge Recommendations

1. Use GPT56SOL as the source of binding architecture decisions, especially:
   `Any` as UI-only `null`, no schema migration, no generated-data imports outside catalog
   adaptation, selected-loadout preservation, app-layer skill placement planning, explicit removal
   target, inline template buffer/proven-output separation, exact-source/canonical export policy,
   and no remote media runtime path.

2. Use GPT54's structure for readability:
   start with a baseline/regression-freeze phase, keep the dependency topology visible, and avoid
   putting every detailed contract shape in the main sprint body. Move exhaustive contract details
   into ticket acceptance criteria or appendices.

3. Add a formal scope-control line:
   the minimum shippable sprint should be shell, header semantics, attribute rows, catalog defaults,
   safe skill placement, inline template parity, and preservation tests. Real icon binaries,
   extensive visual polish, broader catalog tabs, touch-specific drag, and modal deletion should be
   explicitly deferrable unless time remains after verification.

4. Add a missing alternatives section before finalizing architecture:
   compare secondary disclosure versus route/workspace mode/drawer; custom profession picker versus
   enhanced native select; inline template replacement versus inline plus modal fallback; grouped
   batching versus virtualization; and CSS/text icon fallbacks versus approved local binaries.

5. Strengthen risk analysis with separate top-level risks for:
   custom accessibility, all-playable catalog performance, selected-loadout switching during local
   UI edits, moving secondary panels without breaking dialogs/dirty guards, raw-overlay corruption,
   stale drag payloads, exact-source/name synchronization, source-policy enforcement, and visual
   regressions that jsdom cannot prove.

6. Tighten Definition of Done:
   keep GPT56SOL's detailed preservation checklist, add GPT54's regression-freeze gate, and separate
   automated tests, manual evidence, documentation, and deferrals. Require explicit confirmation of
   no schema, dependency, lockfile, generated-data, remote-media, or unapproved-binary changes.

7. Resolve ambiguous wording:
   replace any "drag-off removal" language with "explicit removal target or explicit clear command";
   replace "policy-compliant assets if available" with "exact allowlisted local assets only,
   otherwise deterministic fallbacks"; and replace "reachable secondary workflows" with specific
   keyboard, focus, dialog, and dirty-guard acceptance criteria.

8. Keep the final sprint less prescriptive about file names where possible.
   Bind ownership and invariants first, then let implementation follow the repo. Exact new component
   names such as `BuildComposer`, `CatalogIcon`, and `InlineTemplateControls` are reasonable, but
   exhaustive file lists should not block a simpler local design that preserves the same contracts.

9. Add loadout-switch edge cases to the combined plan:
   every local UI buffer or transient interaction should have defined behavior when the selected
   build, set entry, or party member changes. This includes name editing, picker menus, catalog
   keyboard pick state, active drag state, inline template input, clipboard completion, and pending
   dialogs.

10. Prefer a two-stage template migration:
    first ship inline controls that reuse the existing workflow and pass parity tests; then remove
    modal-only state after a short explicit cleanup gate. This lowers persistence and selected-
    loadout regression risk.

## Recommended Combined Direction

The final SPRINT-019 should be based on GPT56SOL's correctness model and GPT54's execution shape.
The merged draft should stay strict on data boundaries and template safety, but it should reduce
same-sprint commitments that are mostly polish or cleanup. The most important correction is to make
scope control explicit: the sprint succeeds when the focused composer is safe, accessible, and
preservation-complete, not when every possible icon, layout, and modal cleanup detail lands at once.
