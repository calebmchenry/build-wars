# Combined Critique: SPRINT-019 GPT-5.5 and GPT-5.4 Drafts

## Review Scope

This critique reviews only:

- `SPRINT-019-GPT55-DRAFT.md`
- `SPRINT-019-GPT54-DRAFT.md`

Both requested drafts are present. The review emphasizes solution coherence, strategic trade-offs,
cross-draft contradictions, long-range architecture risk, unresolved assumptions, missing edge
cases, and Definition of Done quality.

## Executive Assessment

Both drafts converge on the right product direction: make single-build composition the primary
experience without discarding the mature local-first, multi-build, party, equipment, validation,
and template-compatibility systems. They also agree on the most important constraints: no domain
rewrite, no remote runtime media, no new persisted `"Any"` profession value, no new runtime
dependency, and no weakening of exact-source or canonical template guarantees.

The GPT-5.5 draft is the stronger technical specification. It explicitly models selected-loadout
states, raw-overlay preservation, transactional template import, catalog boundaries, and a
catalog-informed skill placement plan. Its main weakness is over-specification: it pre-commits to
many component and view-model shapes while several product semantics remain open. That risks
building a large parallel composer architecture before validating whether existing components can
be safely adapted.

The GPT-5.4 draft is the stronger sequencing and migration narrative. It makes the dependency graph
and regression-first intent easy to follow, and it more consistently frames the work as a staged IA
pivot. Its main weakness is architectural ambiguity. It assigns catalog-aware behavior and
interaction policy to `editor-state.ts`/`editor-selectors.ts`, under-specifies raw-overlay and empty
party-slot cases, and provides a Definition of Done too broad to prove that existing workflows were
preserved. Its phase percentages also total 110%, undermining the sizing signal.

Neither draft should be executed unchanged. The merged sprint should use the GPT-5.4 phase topology,
the GPT-5.5 invariants and acceptance detail, and a smaller set of explicit pre-execution decisions.
The most important decision is ownership of skill-placement policy: catalog facts must be resolved
outside the reducer, while a catalog-free atomic mutation remains reducer-owned. The next most
important decision is distinguishing intentionally unset `"Any"` from unresolved imported
profession evidence without altering the domain schema.

## Review of `SPRINT-019-GPT55-DRAFT.md`

### Strengths

- The draft has a coherent product thesis. It repeatedly distinguishes an app-composition change
  from a domain reset and protects completed capabilities from deletion.
- It handles document context better than the GPT-5.4 draft. Single builds, selected build-set
  entries, selected occupied party slots, and empty party slots have explicit composer behavior.
- The architecture boundary is generally sound: `App.tsx` retains effects and orchestration;
  generated catalog imports remain in `src/app/catalogs.ts`; `src/domain/**` stays framework-neutral;
  and composer projections are separated from domain state.
- The raw-template preservation rules are unusually strong. It distinguishes movement of an
  existing raw-backed slot from semantic authoring of a resolved catalog skill and limits elite
  enforcement to facts that can be proven from the current catalog.
- Template import/export is treated as a policy-preserving presentation change, not a codec rewrite.
  Separate import draft and derived export text, transactional apply, exact-source preference,
  canonical proof gates, clipboard fallback, and selected-loadout warnings form a coherent whole.
- The asset-policy fallback is executable. Missing approval does not block the sprint because
  placeholders and product-owned glyphs are an explicit acceptable outcome.
- The DoD is traceable to most use cases and covers narrow layouts, accessibility, catalog
  boundaries, raw overlays, empty party slots, security constraints, and repository verification.

### Weaknesses

- The draft is too prescriptive at the type and file level before resolving product decisions. The
  proposed `ComposerShellView`, `FocusedAttributeRowView`, `FocusedSkillCatalogView`, and
  `SkillBarPlacementPlan` may be useful, but treating all of them as the default architecture risks
  duplicating existing selectors and components.
- The new `composer-selectors.ts` boundary is not paired with a firm rule for what remains in
  `editor-selectors.ts`. The file summary says both will own related projections, creating a likely
  split-brain selector layer and duplicated derivations.
- Transient UI ownership is internally inconsistent. Collapsed groups are described as transient
  app UI state that must not be persisted, yet `editor-state.ts` is listed as a likely home for group
  collapse and inline template input state. If `EditorState` participates in draft persistence,
  this can leak presentation state into durable snapshots.
- The component strategy favors new focused components while also retaining or modifying the old
  editor components. Without a deletion/convergence plan, the result may be two parallel editors
  with subtly different validation, accessibility, and raw-overlay behavior.
- The sprint is large for a single iteration: shell re-composition, custom pickers, naming,
  attribute presentation, a new catalog projection, complex drag/drop policy, inline templates,
  asset work, documentation, and preservation of all advanced workflows. There is no capacity
  budget, cut line, or minimum shippable slice beyond the asset fallback.
- “Reachable as secondary surfaces” is not an acceptance contract. The draft does not choose the
  navigation pattern, specify focus restoration, preserve deep UI context, or define how users
  discover hidden capabilities.
- The draft commits to silent one-elite replacement as a binding product rule without evidence that
  automatic deletion is preferable to blocking, confirmation, or validation-only behavior.

### Gaps in Risk Analysis

- No risk covers divergence between old and new editor component paths. Maintaining both could
  double regression surface and create inconsistent semantics over time.
- No performance risk addresses the `"Any"` fallback to all playable skills, grouping, search,
  repeated selector projection, or rendering large expanded groups. The view model mentions
  `renderedCount` and `hasMore`, but the implementation and DoD do not define batching or limits.
- No migration risk covers persisted UI/editor state if transient composer fields are added to
  `EditorState`.
- No risk addresses exact-source invalidation when users rename a build or semantically edit an
  imported build. The draft protects replay in general but does not state which edits invalidate or
  retain the source code and raw template name.
- No risk covers the discoverability cost of demoting validation, equipment, library, and document
  context. Preserving state is not the same as preserving usability.
- No testing risk acknowledges that native HTML drag/drop, `DataTransfer`, `setDragImage`, clipboard,
  responsive layout, and custom listbox behavior are poorly represented by unit tests and need a
  browser-level or explicit manual matrix.
- No delivery risk addresses the nine-ticket scope or gives a cut strategy if shell integration
  exposes unexpected workspace coupling.

### Missing Edge Cases

- Changing primary or secondary profession after allocating attributes or filling the bar: whether
  now-ineligible authored facts remain visible, are retained as semantic state, become raw evidence,
  or are removed is not stated.
- Primary and secondary selecting the same profession, switching their order, and choosing
  `"Any"` for primary while secondary remains concrete.
- Imported unresolved profession evidence whose normalized domain field is `null`. The UI must not
  mislabel unresolved data as an intentional `"Any"` choice or clear it merely by opening a picker.
- The exact effect of renaming on `Build.name`, `rawTemplate.templateName`, exact-source replay,
  canonical output, saved-record names, dirty state, and build-set entry metadata.
- Dragging onto an occupied slot: “move,” “swap,” and “replace” all appear, but the exact matrix for
  bar-to-bar versus catalog-to-bar operations is not normative.
- Atomic ordering when a catalog drop simultaneously encounters a duplicate, an occupied target,
  an existing elite, and raw overlays in one or more affected slots.
- Skill eligibility for profession, mode, PvE-only skills, hidden/unsupported catalog records, and
  whether invalid placements are blocked or accepted with validation issues.
- Catalog changes or failures during an active drag, and a profession/filter change that removes
  the drag source before drop.
- Import while the current build has unsaved name edits, equipment, title overrides, or an active
  inline draft; cancel/confirm behavior is not fully specified.
- Empty party slot create/assign transitions, including which action creates a loadout, where focus
  moves afterward, and whether secondary controls can change selection while import UI is open.
- Touch devices, reduced-motion preferences, high zoom, screen-reader announcement of automatic
  duplicate/elite removal, and focus recovery after a collapsed group disappears.

### Definition of Done Completeness

The DoD is comprehensive but not fully testable. It is strongest on invariants and regressions and
weakest on interaction contracts and architectural convergence.

It should add:

- A normative placement matrix for catalog-to-bar and bar-to-bar empty/occupied/duplicate/elite/raw
  combinations.
- A profession-change retention policy and tests for imported unresolved facts.
- A precise ownership rule for transient composer UI state and confirmation that it is excluded
  from durable snapshots.
- A naming and exact-source invalidation contract.
- An explicit catalog performance budget or maximum initial render strategy.
- A concrete secondary-navigation acceptance map, including keyboard access and focus restoration.
- A convergence requirement stating whether legacy editor components are reused, wrapped, or
  retired so two independently evolving editor paths do not remain.
- At least one real-browser verification path for drag/drop, clipboard fallback, custom pickers,
  and responsive layout, or a recorded manual evidence matrix if browser automation is unavailable.

## Review of `SPRINT-019-GPT54-DRAFT.md`

### Strengths

- The execution topology is clear and strategically sensible. Freezing regressions before changing
  composition, settling profession semantics before attribute/catalog projections, and delaying
  polish until interactions stabilize are good sequencing choices.
- It explicitly identifies `BW-1804` and `BW-1807` as the only useful parallel lane, which makes
  dependencies easier to reason about than a purely linear ticket list.
- It frames the existing `Build`/`EditorState` as the source of truth and avoids a parallel domain
  model.
- It consistently protects browser effects, persistence, template compatibility, generated catalog
  imports, and completed secondary workflows from the IA change.
- Reuse of existing editor components and selector pipelines could produce a smaller migration than
  the GPT-5.5 proposal if their responsibilities can be cleanly adapted.
- The baseline phase identifies several important legacy paths—draft restore, share boot, build-set
  selection, party editing, equipment warnings, and raw overlays—before layout work begins.

### Weaknesses

- The ownership table puts grouped catalog projections and export visibility into
  `editor-selectors.ts`, while `editor-state.ts` is said to own canonical placement including
  catalog quick-place. This concentrates composer-specific and catalog-informed policy into generic
  editor modules and increases long-range coupling.
- “Skill placement rules should remain reducer-owned” is too broad. A reducer cannot decide elite
  or eligibility facts without either importing catalogs or trusting the drag payload. Both are
  undesirable. The reducer should own atomic application and invariants, not catalog resolution.
- Naming is assigned to “workspace-owned naming normalization,” including `rawTemplate.templateName`,
  but the draft does not prove that mutating raw imported evidence is compatible with exact-source
  replay. This is a potentially destructive conflation of display name, saved-record identity,
  wrapper metadata, and imported source facts.
- Reusing `ProfessionModeEditor`, `AttributeEditor`, and `SkillBrowser` may reduce churn, but the
  draft does not acknowledge the risk that retrofitting focused and legacy modes will produce
  heavily conditional components.
- The treatment of empty party slots is only “safe guidance,” not the explicit no-placeholder-build
  invariant present in the GPT-5.5 draft.
- Test plans are too coarse. Many phases rely mostly on `App.test.tsx`, `editor-state.test.ts`, and
  `editor-selectors.test.ts`; there are no dedicated profession-picker, focused catalog, attribute
  component, inline template component, or drag-payload suites.
- The phase estimates total 110%, so they cannot be used as a credible allocation or scope signal.
- The front matter says `status: planned` while the artifact is still a draft, conflicting with the
  GPT-5.5 draft and potentially with sprint lifecycle conventions.

### Gaps in Risk Analysis

- The risk section is too short for the architectural reach of the sprint. It omits selector and
  reducer coupling, legacy/new component divergence, transient-state persistence, catalog
  performance, accessibility of custom controls, responsive regressions, and discoverability of
  secondary tools.
- Asset policy is treated as an availability problem more than a licensing/provenance gate. The
  draft names possible asset directories before defining the approval record or acceptable
  fallback in the phase entry criteria.
- There is no risk for silent data loss when automatic duplicate or elite replacement intersects
  raw overlays.
- There is no risk for selected-loadout context loss during navigation, inline import, or document
  switching.
- There is no delivery contingency despite a broad cross-cutting UI change and an invalid 110%
  phase allocation.
- There is no risk around using null for both intentional `"Any"` and unresolved imported
  profession state.

### Missing Edge Cases

- Empty selected party slots must not materialize placeholder builds, autosave phantom entries, or
  enable template/share actions.
- Exact behavior for neither, one, or both concrete professions; duplicate primary/secondary
  professions; profession swaps; and imported unresolved profession overlays.
- Attribute rows retained after profession changes, overspent builds, zero/max ranks, unknown game
  mode, equipment-adjusted effective ranks, and unresolved labels.
- Bar-to-bar move versus swap versus replace semantics, target selection after a no-op, and raw
  overlays affected by duplicate and elite clearing.
- Invalid, stale, foreign, malformed, or out-of-range drag payloads and catalog facts that change
  between drag start and drop.
- Keyboard parity details for pick, place, cancel, clear, announcements, and focus restoration.
- Catalog-unavailable, no-results, all-groups-collapsed, unsupported-record, and very-large-result
  states.
- Clipboard denial, non-secure context, repeated copy, import cancellation, import confirmation for
  destructive replacement, and bounded input length.
- Long localized labels, high zoom, reduced motion, touch-only devices, and layout stability during
  diagnostics.
- Autosave/pagehide during name edits or imports and switching selected loadouts while transient UI
  is active.

### Definition of Done Completeness

The DoD is concise but materially incomplete. It validates the happy-path feature set and final
repository command, but it does not prove compatibility preservation at the level promised by the
overview.

It should add explicit criteria for:

- Restored build-set and party data preservation, occupied selection, empty-slot behavior, and the
  no-placeholder-build invariant.
- Raw-overlay preservation and clearing for every skill-bar operation and profession/attribute edit.
- Catalog import boundaries and the absence of composer state in `src/domain/**`.
- Catalog error and large-result behavior.
- Accessible profession pickers and keyboard-equivalent skill placement.
- Transactional import failure preserving the complete prior selected loadout and sibling/party
  metadata.
- Exact-source versus canonical export selection and blocked reasons.
- Secondary workflow reachability for backup/restore and transfer, which are omitted from the DoD.
- Narrow-screen no-overflow, focus behavior, and layout stability.
- Focused test suites plus `git diff --check`, rather than relying only on `npm run verify`.

## Cross-Draft Contradictions and Strategic Trade-offs

| Topic | GPT-5.5 Draft | GPT-5.4 Draft | Recommended Resolution |
| --- | --- | --- | --- |
| Skill-placement ownership | Catalog-informed pure workflow helper computes a plan; reducer applies a catalog-free mutation. | Placement, duplicate, elite, and catalog quick-place rules are reducer-owned in `editor-state.ts`. | Adopt a two-stage contract: an app-layer planner resolves current catalog facts; one atomic, catalog-free reducer action applies and validates bounded tuple changes. |
| Selector boundary | Adds `composer-selectors.ts` for focused view models and keeps generic selectors narrower. | Places attribute, grouped catalog, compact facts, and export projections in `editor-selectors.ts`. | Keep durable/editor-generic facts in `editor-selectors.ts`; keep IA-specific grouping, sections, labels, and secondary-tool views in `composer-selectors.ts`. Document dependency direction to prevent cycles. |
| Component strategy | Creates focused header, attribute, catalog, and inline-template components, retaining old components for reuse/secondary paths. | Primarily adapts `ProfessionModeEditor`, `AttributeEditor`, and `SkillBrowser`. | Decide component by component. Extract shared headless logic and primitives, but allow focused composition wrappers. Require one semantic implementation per editing operation and a retirement plan for redundant legacy presentation. |
| Build-name ownership | Uses a focused editor action on `EditorState.build.name`; avoids saved-record identity changes. | Uses workspace naming helpers and seeks alignment with `rawTemplate.templateName`. | Separate authored display name, saved-record name, and imported raw template name. Define which user action changes each, and invalidate exact-source replay when a semantic edit requires it rather than rewriting raw evidence silently. |
| Transient UI state | Calls group collapse transient but lists `editor-state.ts` as a possible owner. | Says collapse is deterministic but does not define storage ownership. | Keep collapse, picker-open state, drag state, copy status, and import draft in component/composer UI state excluded from persisted editor/workspace snapshots. Only authored build changes enter reducers. |
| `"Any"` versus unresolved | Strongly binds `"Any"` to null while preserving raw unresolved facts. | Says UI/selectors decide whether null renders as `"Any"` or unresolved state. | Define a selector using both normalized nullable IDs and raw-overlay resolution state. Intentional null may render `"Any"`; unresolved imported evidence must render an unresolved state until the user explicitly chooses. |
| Phase structure | Combines BW-1801 IA freeze and baseline in Phase 0. | Separates baseline Phase 0 and BW-1801 IA Phase 1. | Use separate baseline and decision gates. Baseline should not edit product intent; BW-1801 should close unresolved semantics before implementation begins. |
| Asset completion | Explicit approval gate with placeholders/glyphs as a valid sprint result. | Attempts real local assets where available and documents limitations. | Use the GPT-5.5 gate. Resolve provenance before implementation; make placeholder completion unambiguously sufficient unless approved assets are already available. |
| Testing depth | Adds focused selector/component/workflow tests and a broad manual closeout matrix. | Relies heavily on existing broad tests and final `npm run verify`. | Use focused tests per phase plus existing regression suites. Add browser/manual evidence for APIs and layout that unit tests cannot validate. |
| Sprint sizing | No percentages or capacity cut line. | Supplies percentages, but they total 110%. | Re-estimate after decisions. Identify a minimum coherent slice and explicit deferrals; do not use the current percentages. |
| Sprint status | `draft`. | `planned`. | Keep the merged artifact `draft` until the decision gate, dependencies, estimates, and DoD are approved. |

## Long-Range Architecture Risks

1. **Parallel editor architectures.** A new composer tree layered beside legacy editor components can
   produce two sources of UI semantics. The sprint needs a convergence rule: shared operations and
   selectors are canonical; presentation wrappers may differ; obsolete paths are either explicitly
   retained as secondary views or retired.

2. **Generic state modules absorbing IA policy.** Group collapse, focused catalog grouping,
   drag-source presentation, and secondary navigation do not belong in durable editor state. If
   placed there for convenience, future layouts will inherit accidental coupling and snapshot
   migration pressure.

3. **Catalog truth entering mutation state.** Elite, profession, and eligibility facts can change as
   catalogs evolve. Drag payloads and reducers should carry identities and bounded mutations, not
   duplicated catalog truth. Planning against the current catalog at action time avoids stale or
   forged payload semantics.

4. **Raw evidence versus authored semantics.** Exact-source replay, unresolved imports, semantic
   edits, naming, and automatic elite/duplicate cleanup all touch raw overlays. A single explicit
   invalidation/preservation policy is needed across professions, attributes, names, and skills;
   otherwise each component will invent its own behavior.

5. **Secondary-feature erosion.** Moving mature tools behind “secondary” affordances can become an
   undocumented deprecation. Reachability, context preservation, keyboard navigation, and
   discoverability need acceptance criteria, not only regression tests for underlying reducers.

6. **A focused catalog becoming a second browser implementation.** If `FocusedSkillCatalog` forks
   sorting, filtering, facts, and pagination from `SkillBrowser`, the two will drift. Both should
   consume the same headless query/projection layer, with separate presentation only where the IA
   differs.

7. **Automatic authoring policy outrunning domain validation.** One-elite auto-replacement is an app
   convenience layered over validation. It must not become the only enforcement or silently erase
   uncertain imported data. The domain validator remains authoritative, and the UI should announce
   deterministic removals.

## Merge Recommendations

### 1. Freeze Decisions Before UI Work

BW-1801 should produce a short decision record covering:

- intentional `"Any"` versus unresolved imported profession evidence;
- profession-change retention for attributes and skills;
- naming fields and exact-source invalidation;
- bar move/swap/replace/duplicate/elite ordering;
- placement eligibility versus validation-only behavior;
- transient UI state ownership;
- exact secondary-surface navigation and document-context visibility;
- asset provenance outcome and placeholder acceptance;
- the minimum shippable slice and cut line.

Do not leave these as end-of-document open questions once execution starts.

### 2. Adopt a Layered Skill-Placement Contract

Use the GPT-5.5 planner concept with a narrower boundary:

1. Parse an opaque, identity-only drag or keyboard intent.
2. Resolve current catalog facts in an app-layer pure planner.
3. Produce one explicit atomic mutation describing affected slots and raw-overlay changes.
4. Apply it through a catalog-free reducer action that enforces tuple length and index bounds.
5. Run normal domain validation after mutation and announce any automatic duplicate or elite
   removal.

This reconciles GPT-5.4's desire for canonical reducer actions with GPT-5.5's catalog boundary.

### 3. Reuse Logic, Not Necessarily Presentation

Create a composer shell and focused presentation components where the IA genuinely differs, but
extract shared headless behavior from existing editors instead of copying it. The merged sprint
should name which existing components are wrapped, refactored into primitives, retained unchanged,
or retired. “Modify/reuse” is not a sufficient architectural decision.

### 4. Separate Durable, Authored, and Ephemeral State

- Domain/editor state: authored build facts and raw-template overlays.
- Workspace state: document selection, build-set/party context, and durable local workflow state.
- Composer UI state: open pickers, collapsed groups, current drag, inline import draft, copy status,
  and secondary disclosures.

The DoD should prove that composer UI state is not serialized into build, workspace, library,
backup, or share payloads.

### 5. Use the GPT-5.4 Topology With GPT-5.5 Gates

Recommended execution order:

1. Regression baseline and browser/manual test matrix.
2. BW-1801 decision record and IA acceptance map.
3. BW-1802 shell and secondary navigation.
4. BW-1803 header, naming, and profession-resolution semantics.
5. BW-1804 attribute projection and BW-1807 shared catalog query/presentation in parallel.
6. BW-1805 atomic skill-placement policy.
7. BW-1806 inline template presentation over existing workflow.
8. BW-1808 approved assets or accepted placeholders, then visual polish.
9. BW-1809 regression, documentation, evidence, and lifecycle reconciliation.

The shell should be capable of shipping with existing inner controls before later phases refine them.
That creates a coherent cut line if the sprint runs long.

### 6. Strengthen the Merged Definition of Done

The final DoD should retain the GPT-5.5 invariants and add the following proof-oriented criteria:

- A documented and tested behavior table exists for every skill placement operation and conflict
  combination.
- Intentional `"Any"` and unresolved imported professions render differently and preserve evidence
  until explicit authoring occurs.
- Profession changes follow an explicit retention policy for attributes and skills.
- Name edits have defined effects on build name, saved-record identity, raw template name,
  exact-source replay, canonical output, and dirty state.
- Composer-only UI state is not persisted or shared.
- Existing and focused presentation paths use the same mutation and query logic, with no duplicated
  placement or filtering policy.
- Empty party slots never create phantom builds and cannot invoke selected-loadout import, export,
  copy, or share actions.
- Secondary tools have a documented entry-point map and preserve selected document/loadout context,
  focus restoration, dirty guards, and keyboard reachability.
- The all-skills `"Any"` view meets an explicit initial-render and interaction performance target.
- Focused tests cover pickers, attributes, catalog, drag payload parsing, placement planning, raw
  overlays, inline templates, empty party slots, and selected-loadout preservation.
- Real-browser or recorded manual evidence covers drag/drop, `setDragImage`, clipboard denial,
  responsive breakpoints, high zoom, and custom-picker keyboard behavior.
- Approved asset provenance is recorded, or placeholders/glyphs are formally accepted as complete.
- Targeted suites, full `npm run verify`, and `git diff --check` pass before lifecycle artifacts are
  marked complete.

## Recommended Combined Position

Proceed with a composer-first app-layer redesign, not a state-model rewrite. Preserve the current
domain, persistence, template, and selected-loadout contracts. Introduce a focused shell and
composer-specific presentation, backed by shared headless selectors and canonical catalog-free
mutations. Resolve catalog facts in pure app-layer planners, keep ephemeral UI state out of editor
and workspace persistence, and treat imported raw evidence as distinct from intentionally unset
values. Make policy-safe placeholders a valid asset outcome. Most importantly, turn the unresolved
semantic questions into BW-1801 exit criteria and reduce the sprint to a shippable shell-first slice
if estimates show that the full nine-ticket scope is not credible.
