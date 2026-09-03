---
id: SPRINT-019
title: Focused Build Composer
status: planned
source_target: BACKLOG
source_epic: EPIC-18
source_epic_path: work/tickets/18-focused-build-composer/EPIC.md
tickets:
  - BW-1801
  - BW-1802
  - BW-1803
  - BW-1804
  - BW-1805
  - BW-1806
  - BW-1807
  - BW-1808
  - BW-1809
created: 2026-09-03
---

# Sprint 019: Focused Build Composer

## Overview

This sprint refocuses the default Build Wars experience around authoring one active build. The app
should open into a composer-first layout with the live build on the left and a skills catalog on
the right, while preserving the existing local-first durability model, selected-loadout template
rules, build-set and party workflows, equipment editing, local library, and sharing features as
secondary paths instead of removing them.

Execution order is the main constraint. The sprint should freeze the information architecture and
composer-specific binding decisions first, land the shell without reopening persistence or reducer
contracts, then wire the profession header and filtering semantics, then stabilize attribute and
catalog projections, then tighten skill-bar interactions, then move template import/export inline,
and only after those flows settle land icon polish and closeout. That order keeps compatibility
work ahead of visual work and prevents drag, export, and validation behavior from being built
against a moving UI.

Binding execution defaults:

1. `src/app/App.tsx` remains the composition root and browser-effect owner. Introduce a focused
   composer component rather than scattering storage, share-fragment, or dialog orchestration.
2. EPIC-18 is an app-composition sprint, not a domain rewrite. Keep `src/domain/**` and template
   compatibility contracts stable unless a pure helper gap is unavoidable.
3. The composer `"Any"` profession option is UI copy over the existing `ProfessionId | null`
   build fields. Do not add a new domain enum, persisted sentinel, catalog record, or template
   encoding for `"Any"`.
4. Existing template workflow policy remains authoritative: import is transactional, exact-source
   replay is preserved, canonical export still requires fidelity proof, and non-concrete profession
   selections remain export-blocking rather than silently inventing template data.
5. Runtime catalog imports stay isolated to `src/app/catalogs.ts`. Real profession, skill, and
   cost icons must come from policy-compliant local/static assets or app-owned placeholder/icon
   descriptors, never remote wiki URLs.
6. Library, build-set, party, equipment, title-rank, share, and detailed validation surfaces stay
   available, but move behind secondary affordances, disclosures, or below-the-fold regions so they
   do not dominate the first screen.
7. No new runtime dependency, route, backend service, account model, analytics path, or remote
   fetch is part of this sprint.
8. `npm run verify` is the final gate. Every phase must close on narrower targeted verification
   first so regressions are attributed to the change that caused them.

## Use Cases

1. A user opens the app and immediately sees a focused build composer instead of the current dense
   mixed workspace.
2. A user creates a build from scratch by choosing primary and secondary professions, naming the
   build, allocating attributes, and filling the eight-slot bar.
3. A user leaves one or both profession pickers on `"Any"` while browsing or sketching a build and
   gets predictable filtering behavior without misleading export success.
4. A user pastes a valid skill template code directly into the composer and sees professions,
   attributes, skill bar, and template name update transactionally.
5. A user copies the current template code from the composer without opening a modal and still has
   a selectable-text fallback if clipboard access fails.
6. A user browses a compact skills catalog already scoped to the active professions, grouped by
   attribute, and can drag a skill into the bar without first configuring advanced filters.
7. A user reorders, replaces, removes, or reuses a skill already on the bar and gets deterministic
   one-elite enforcement with keyboard-accessible alternatives.
8. A user edits a build that came from local draft restore, share-fragment boot, build-set
   selection, or party selected-member context and still lands in the same focused composer.
9. A user working in a build set or party can still reach the navigator, library, transfer,
   equipment, title-rank, share, and validation surfaces, but those features no longer consume the
   default first viewport.
10. A user with unresolved imported professions, attributes, or skills continues to see stable raw
    overlay diagnostics and non-crashing placeholder rendering.
11. A user on a narrow screen sees the composer stack cleanly with no overlapping text, clipped
    buttons, or layout shifts during drag, validation changes, or inline template edits.
12. A user who never touches equipment, library, party, or guide-oriented workflows is not forced
    through those concepts before authoring a single build.

## Architecture

| Area | Owns | Must Not Own |
| --- | --- | --- |
| `src/app/App.tsx` and a focused composer wrapper such as `src/app/components/BuildComposer.tsx` | First-screen composition, responsive shell, placement of secondary surfaces, and dialog wiring. | New persistence rules, template codec logic, or generated-data imports outside `catalogs.ts`. |
| `src/app/components/ProfessionModeEditor.tsx` or a header-focused replacement | Profession icon pickers, `"Any"` labeling, compact mode visibility, inline build naming, and accessible picker interaction. | New domain profession semantics, template encoding changes, or library-record rename workflows. |
| `src/app/editor-selectors.ts` | Attribute row view models, default skill-catalog scoping, grouped/collapsible catalog sections, compact cost facts, and export-visibility projections. | Mutable reducer state, storage I/O, or remote asset loading. |
| `src/app/editor-state.ts` and `src/app/drag-payload.ts` | Canonical skill placement, replacement, duplicate movement, reordering, removal, keyboard parity, and raw-overlay preservation. | Visual-only layout policy, catalog adaptation, or clipboard/file APIs. |
| `src/app/template-workflow.ts` and the inline template UI component | Transactional paste/import, exact-source and canonical export policy, clipboard fallback behavior, and selected-loadout-only messaging. | Modal-only UX requirements, share URL ownership, or build-set/party schema changes. |
| `src/app/catalogs.ts` | App-owned profession/skill/placeholder/icon descriptors and any policy-compliant static asset references. | Runtime wiki media fetches, ad hoc component-level asset URLs, or source-policy bypasses. |
| Existing secondary workspace surfaces such as `LibraryPanel`, `BuildSetNavigator`, `PartyWorkspace`, `EquipmentPanel`, `ShareControls`, `ValidationPanel`, and `TitleRankPanel` | Preserved access to completed capabilities once they are repositioned behind secondary entry points. | First-screen dominance, primary authoring layout ownership, or composer-state duplication. |

### State And View Rules

1. Keep the active authored `Build` plus `EditorState` as the single source of truth for the
   composer. EPIC-18 should project a new view, not introduce a parallel build model.
2. Represent `"Any"` by reusing `primaryProfessionId: null` and `secondaryProfessionId: null`.
   Selector and UI copy decide when null renders as `"Any"` versus an unresolved validation state;
   persistence, validation, and template export keep their existing semantics.
3. Build-name edits should flow through the existing workspace naming helpers so `build.name`,
   `rawTemplate.templateName`, and export-name fallback remain consistent.
4. Skill placement rules should remain reducer-owned. Pointer drag, keyboard pick/place, and
   catalog quick-place must all dispatch the same small set of canonical actions.
5. Inline template code should be presentation over existing parse/decode/resolve/import and
   export-policy helpers. Do not fork template logic into the component tree.
6. Secondary surfaces should be moved, collapsed, or deferred in layout only. Build-set, party,
   share, equipment, and validation state must continue to use the existing workspace contracts.

### Execution Topology

```text
Phase 0 regression freeze
  -> BW-1801 product use case and IA
BW-1801
  -> BW-1802 two-panel composer shell
BW-1802
  -> BW-1803 build header and Any semantics
BW-1803
  -> BW-1804 attribute allocation editor
  -> BW-1807 skill catalog tab
BW-1807
  -> BW-1805 skill bar refinement
BW-1804 + BW-1805
  -> BW-1806 inline template import/export
BW-1803 + BW-1804 + BW-1805 + BW-1807
  -> BW-1808 icon assets and visual polish
BW-1801 through BW-1808
  -> BW-1809 verification and closeout
```

`BW-1804` and `BW-1807` are the only useful parallel lane after the header contract settles.
`BW-1805` should wait for `BW-1807` because the catalog tab defines the drag source, compact row
facts, and default browsing behavior the bar needs to interoperate with. `BW-1806` should wait for
both attribute and skill-bar interaction rules so template import/export can reflect the final
composer layout and messaging.

## Implementation

### Execution Bookkeeping

- [ ] Keep `SPRINT-019`, `EPIC-18`, and `BW-1801` through `BW-1809` aligned across draft, final
      sprint, ticket records, ledger, and run manifest artifacts.
- [ ] Treat the current single-build, build-set, party, equipment, library, share, and template
      workflows as the regression baseline for every phase gate.
- [ ] Keep runtime generated-data imports isolated to `src/app/catalogs.ts`.
- [ ] Add no new runtime dependency, external service, remote asset fetch, or schema reset.

### Phase 0: Baseline And Regression Freeze (~5%)

**Files:**

- `src/app/App.test.tsx`
- `src/app/editor-state.test.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/template-workflow.test.ts`
- `src/app/workspace-state.test.ts`
- `src/app/share-url.test.ts`
- `src/app/local-storage.test.ts`
- `src/app/backup-restore.test.ts`
- `src/app/build-set-state.test.ts`
- `src/app/party-state.test.ts`

**Tasks:**

- [ ] Freeze the compatibility baseline around selected-loadout template policy, share-fragment
      boot, working-draft restore, build-set selection, party selected-member editing, equipment
      omission warnings, and title-rank behavior.
- [ ] Tighten any missing targeted coverage for state transitions that the composer pivot must not
      regress, especially active editor mirroring and raw-template overlay preservation.
- [ ] Record the minimum acceptance baseline for narrow-screen rendering so later CSS changes have a
      concrete no-overlap target.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/editor-state.test.ts src/app/editor-selectors.test.ts src/app/template-workflow.test.ts src/app/workspace-state.test.ts src/app/share-url.test.ts src/app/local-storage.test.ts src/app/backup-restore.test.ts src/app/build-set-state.test.ts src/app/party-state.test.ts`
- `npm run typecheck`

**Phase Gate:** Existing authoring, restore, share, build-set, and party behavior is locked as the
regression baseline before the layout pivot starts.

### Phase 1: BW-1801 Product Use Case And Information Architecture (~8%)

**Files:**

- `compendium/build-composer-use-case.md`
- `compendium/README.md`
- `work/tickets/18-focused-build-composer/EPIC.md`
- `work/tickets/18-focused-build-composer/BW-1801-product-use-case-and-ia.md`
- `work/sprints/drafts/SPRINT-019-INTENT.md`

**Tasks:**

- [ ] Tighten the existing focused-composer use-case document instead of rewriting it from scratch.
- [ ] Freeze the first-screen IA: left panel is the live build surface; right panel is the catalog
      surface; completed capabilities move to secondary entry points.
- [ ] Make the implementation binding decisions explicit: `App.tsx` stays root, `"Any"` maps to
      nullable profession IDs, secondary surfaces are repositioned rather than deleted, and no new
      route or dependency is introduced.
- [ ] Ensure ticket execution can reference one durable compendium record instead of restating
      product intent in component code and ticket comments.

**Verification:**

- Markdown review of the updated compendium and ticket text for internal consistency.

**Phase Gate:** Scope, IA, and binding decisions are stable enough that UI work does not need to
re-open product intent or state-model questions.

### Phase 2: BW-1802 Two-Panel Composer Shell (~18%)

**Files:**

- `src/app/App.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/components/EditorWorkspaceTabs.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/components/ShareControls.tsx`
- `src/app/components/ValidationPanel.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/styles.css`
- `src/app/App.test.tsx`
- `src/app/build-set-navigator.test.tsx`
- `src/app/party-workspace.test.tsx`
- `src/app/workspace-state.test.ts`

**Tasks:**

- [ ] Introduce a focused composer shell that makes the active build the center of the first screen
      and reserves the right panel for catalog content.
- [ ] Keep `CatalogAttribution` and `StorageBanner` visible ahead of the composer so source and
      durability messaging remain intact.
- [ ] Reposition library, build-set, party, equipment, share, title-rank, and full validation
      surfaces behind secondary affordances or below-the-fold sections without deleting them.
- [ ] Preserve the existing selected-loadout model for single builds, build sets, and party member
      editing. Empty or missing selected-loadout states must still render safe guidance.
- [ ] Keep dialog entry points and dirty-guard behavior reachable from the new shell.
- [ ] Land responsive layout rules that keep desktop and narrow-screen compositions readable without
      horizontal overflow or overlapping controls.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/build-set-navigator.test.tsx src/app/party-workspace.test.tsx src/app/workspace-state.test.ts`
- `npm run typecheck`
- `npm run build`

**Phase Gate:** The app opens into a stable two-panel composer, and completed secondary workflows
remain reachable without dominating the first viewport.

### Phase 3: BW-1803 Build Header, Profession Pickers, And Name Editing (~12%)

**Files:**

- `src/app/components/ProfessionModeEditor.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/workspace-state.ts`
- `src/app/editor-selectors.ts`
- `src/app/catalogs.ts`
- `src/app/App.test.tsx`
- `src/app/editor-selectors.test.ts`
- `src/app/workspace-state.test.ts`

**Tasks:**

- [ ] Replace the current text-heavy profession selects with compact icon-based custom pickers in a
      stable profession order.
- [ ] Render nullable profession fields as explicit `"Any"` options in the composer without
      changing persisted build semantics or template encoding.
- [ ] Keep mode visibility available in a compact form so PvE, PvP, and unknown behavior remains
      editable without reclaiming first-screen dominance.
- [ ] Add inline build-name editing through workspace-owned naming normalization so the active draft
      name, raw template name fallback, and export naming stay aligned.
- [ ] Keep accessible labels, keyboard navigation, focus order, and deterministic tooltip/issue
      rendering for both profession pickers.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/editor-selectors.test.ts src/app/workspace-state.test.ts`
- `npm run typecheck`

**Phase Gate:** Profession and naming semantics are stable, `"Any"` behavior is explicit, and the
catalog/filtering lane can now build against a settled header contract.

### Phase 4A: BW-1804 Attribute Allocation Editor (~12%)

**Files:**

- `src/app/components/AttributeEditor.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Replace the current generic attribute editor presentation with row-based composer controls that
      expose refund amount, spend amount, purchased rank, attribute label, and effective-rank path.
- [ ] Hide decrement affordances when rank is zero and increment affordances when budget or cap
      rules block further investment.
- [ ] Preserve retained unresolved/raw rows so imported builds do not lose visibility when the
      selected professions change.
- [ ] Reuse current point-budget and validation rules rather than re-deriving attribute logic in
      the component.

**Verification:**

- `npm run test:run -- src/app/editor-selectors.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** Attribute rows behave like the focused composer spec while preserving current budget
and validation correctness.

### Phase 4B: BW-1807 Skill Catalog Tab (~15%)

**Files:**

- `src/app/components/SkillBrowser.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/editor-selectors.ts`
- `src/app/drag-payload.ts`
- `src/app/App.test.tsx`
- `src/app/editor-selectors.test.ts`
- `src/app/editor-state.test.ts`

**Tasks:**

- [ ] Turn the right panel into a catalog surface with a skills tab as the first implemented tab.
- [ ] Default results to active-profession scoping, with null profession selections behaving as the
      explicit composer `"Any"` path instead of an implicit empty-state bug.
- [ ] Group results by attribute with deterministic collapse state and useful section labels.
- [ ] Render compact rows with icon, name, elite state, and right-aligned cost, cast, and recharge
      facts from already-modeled catalog data.
- [ ] Demote broad manual filters from first-screen prominence without deleting capabilities the
      existing selector pipeline already supports.
- [ ] Ensure drag and quick-place actions from catalog rows feed the same reducer rules as every
      other skill placement path.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/editor-selectors.test.ts src/app/editor-state.test.ts`
- `npm run typecheck`

**Phase Gate:** The skills tab shows useful default results, groups remain stable across edge
cases, and catalog-to-bar interactions now have a fixed source surface.

### Phase 5: BW-1805 Skill Bar Drag/Drop Refinement (~12%)

**Files:**

- `src/app/components/SkillBar.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/editor-state.ts`
- `src/app/drag-payload.ts`
- `src/app/editor-state.test.ts`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Centralize slot placement, duplicate movement, replacement, swap, reorder, and clear rules so
      pointer drag and keyboard actions stay semantically identical.
- [ ] Preserve raw-template overlay movement and clearing behavior when slots are moved, replaced,
      or removed.
- [ ] Enforce one-elite replacement deterministically when the incoming elite is new, already on the
      bar, or dropped onto an occupied slot.
- [ ] Add visible icon drag feedback where the browser platform supports it and a stable removal
      target or drag-off path for clear behavior.
- [ ] Keep unresolved and stale slot states safe no-ops rather than allowing reducer corruption.

**Verification:**

- `npm run test:run -- src/app/editor-state.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Phase Gate:** Skill-bar operations are deterministic, reducer-owned, and shared across catalog
drag, in-bar reorder, replacement, removal, and keyboard placement flows.

### Phase 6: BW-1806 Inline Template Import/Export (~10%)

**Files:**

- `src/app/components/TemplateDialogs.tsx`
- `src/app/components/TemplateCodePanel.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/template-workflow.ts`
- `src/app/workspace-state.ts`
- `src/app/App.test.tsx`
- `src/app/template-workflow.test.ts`
- `src/app/workspace-state.test.ts`
- `src/app/share-url.test.ts`

**Tasks:**

- [ ] Replace the modal-first template path in the primary workflow with an inline code field and
      copy control under the skill bar.
- [ ] Keep the code visible, selectable, copyable, and paste-importable without duplicating the
      underlying template compatibility logic.
- [ ] Preserve transactional import behavior: failed parse, decode, or resolve must leave the prior
      build unchanged and surface bounded diagnostics.
- [ ] Keep exact-source and canonical export messaging intact, including blocks caused by `"Any"` or
      otherwise non-concrete professions.
- [ ] Preserve selected-loadout-only behavior when the current document is a build set or party
      member and keep omission warnings explicit.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/template-workflow.test.ts src/app/workspace-state.test.ts src/app/share-url.test.ts`
- `npm run typecheck`

**Phase Gate:** Template code is inline and reliable, while existing import/export fidelity and
selected-loadout boundaries remain unchanged.

### Phase 7: BW-1808 Icon Assets And Visual Polish (~10%)

**Files:**

- `src/app/catalogs.ts`
- `src/app/components/ProfessionModeEditor.tsx`
- `src/app/components/SkillBrowser.tsx`
- `src/app/components/SkillBar.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/styles.css`
- `compendium/visual-prior-art.md`
- policy-compliant local/static asset files under `public/` or `src/app/assets/`
- `src/app/App.test.tsx`
- `src/app/editor-selectors.test.ts`
- `src/app/editor-state.test.ts`

**Tasks:**

- [ ] Replace placeholder-heavy composer visuals with policy-compliant local profession, skill, and
      cost icon paths where assets are available.
- [ ] Keep unresolved or unavailable facts on stable placeholders instead of blocking the whole UI
      on missing art.
- [ ] Tighten spacing, slot dimensions, hover states, focus states, and narrow-screen behavior
      across the composer and catalog.
- [ ] Verify that no component renders runtime remote wiki media URLs through image, CSS, preload,
      or drag-preview paths.
- [ ] Record any remaining asset-policy limitations explicitly so BW-1809 can close with known
      deferrals instead of ambiguous polish gaps.

**Verification:**

- `npm run test:run -- src/app/App.test.tsx src/app/editor-selectors.test.ts src/app/editor-state.test.ts`
- `npm run build`
- Manual narrow-screen and drag-preview smoke review.

**Phase Gate:** Focused-composer visuals are materially clearer, asset policy remains intact, and
polish work has not introduced layout shift or overlap regressions.

### Phase 8: BW-1809 Verification And Closeout (~8%)

**Files:**

- `README.md`
- `compendium/build-composer-use-case.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/multi-build-workspace.md`
- `compendium/visual-prior-art.md`
- `work/tickets/18-focused-build-composer/*.md`
- `work/sprints/SPRINT-019.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T141222Z/plan-EPIC-18-result.json`

**Tasks:**

- [ ] Update product and implementation docs to describe the composer-first default experience and
      the preserved secondary workflows.
- [ ] Record explicit deferrals: equipment-first editing, saved-build-first workflows, party/team
      workflows, guides, broad discovery, advanced analysis, backend sync, collaboration, and any
      unresolved asset-pipeline work.
- [ ] Sync ticket metadata, sprint records, ledger entry, and run manifest with the final
      implementation evidence.
- [ ] Run the canonical repository verification command and capture any residual caveats in docs or
      ticket notes instead of leaving them implicit.

**Verification:**

- `npm run verify`

**Phase Gate:** EPIC-18 is fully documented, verification-complete, and ready to close without
hidden scope, asset, or compatibility caveats.

## Files Summary

- App shell and layout:
  `src/app/App.tsx`, `src/app/components/BuildComposer.tsx`, `src/app/styles.css`
- Header and draft naming:
  `src/app/components/ProfessionModeEditor.tsx`, `src/app/workspace-state.ts`,
  `src/app/catalogs.ts`
- Attribute and catalog projections:
  `src/app/components/AttributeEditor.tsx`, `src/app/components/SkillBrowser.tsx`,
  `src/app/editor-selectors.ts`
- Skill placement and drag semantics:
  `src/app/components/SkillBar.tsx`, `src/app/editor-state.ts`, `src/app/drag-payload.ts`
- Inline template workflow:
  `src/app/components/TemplateDialogs.tsx`, `src/app/components/TemplateCodePanel.tsx`,
  `src/app/template-workflow.ts`
- Preserved secondary surfaces affected by the shell move:
  `src/app/components/LibraryPanel.tsx`, `src/app/components/BuildSetNavigator.tsx`,
  `src/app/components/PartyWorkspace.tsx`, `src/app/components/ShareControls.tsx`,
  `src/app/components/ValidationPanel.tsx`, `src/app/components/EditorWorkspaceTabs.tsx`
- Documentation and closeout:
  `README.md`, `compendium/build-composer-use-case.md`, `compendium/core-build-editor.md`,
  `compendium/local-library-and-sharing.md`, `compendium/multi-build-workspace.md`,
  `compendium/visual-prior-art.md`, `work/tickets/18-focused-build-composer/*.md`,
  `work/sprints/SPRINT-019.md`, `work/sprints/ledger.tsv`
- Primary automated verification files:
  `src/app/App.test.tsx`, `src/app/editor-state.test.ts`, `src/app/editor-selectors.test.ts`,
  `src/app/template-workflow.test.ts`, `src/app/workspace-state.test.ts`,
  `src/app/share-url.test.ts`, `src/app/local-storage.test.ts`, `src/app/backup-restore.test.ts`,
  `src/app/build-set-state.test.ts`, `src/app/build-set-navigator.test.tsx`,
  `src/app/party-state.test.ts`, `src/app/party-workspace.test.tsx`

## Definition of Done

- [ ] `BW-1801` through `BW-1809` are completed in dependency order, and ticket metadata reflects
      the implemented scope.
- [ ] The app opens into a focused two-panel composer where the live build is visually primary and
      the skills catalog is the initial right-panel surface.
- [ ] Secondary workflows for library, build sets, party, equipment, title ranks, sharing, and
      validation remain accessible without dominating the default first viewport.
- [ ] Profession pickers, build naming, and `"Any"` behavior are consistent with existing
      validation and template-export constraints.
- [ ] Attribute rows expose spend/refund facts, rank state, and budget-aware increment/decrement
      behavior using current rules.
- [ ] Skill-bar drag/drop, duplicate movement, replacement, reordering, removal, and one-elite
      enforcement are reducer-safe and covered by focused tests.
- [ ] Inline template code preserves transactional import, exact-source replay, canonical export
      fidelity checks, clipboard fallback, and selected-loadout-only warnings.
- [ ] Icon and polish work uses only policy-compliant local/static assets or stable placeholders and
      introduces no runtime remote media path.
- [ ] `npm run verify` passes at sprint close.

## Risks

- Risk: The first-screen shell rewrite can accidentally hide or orphan completed build-set, party,
  equipment, or share flows. Mitigation: keep `App.tsx` as the root, move those surfaces rather
  than replacing their state contracts, and gate Phase 2 with existing workspace tests.
- Risk: Treating `"Any"` as a UI-only affordance can drift from validation or export behavior.
  Mitigation: bind `"Any"` to existing nullable profession fields and keep all export gating in the
  current template and validation paths.
- Risk: Skill-bar drag semantics can regress raw-overlay preservation or elite replacement.
  Mitigation: centralize placement rules in `editor-state.ts` and close Phase 5 on focused reducer
  tests before polishing visuals.
- Risk: Inline template UX can regress selected-loadout-only behavior for build sets and parties.
  Mitigation: keep `template-workflow.ts` authoritative and include build-set and party contexts in
  the Phase 6 verification set.
- Risk: BW-1808 may be blocked by asset-policy or asset-availability gaps. Mitigation: make
  placeholder fallback acceptable for unresolved assets and document any remaining policy-bound
  limits explicitly in closeout.

## Security

- Treat pasted template codes, share fragments, backup payloads, and transfer JSON as untrusted
  input. Keep parse-then-validate behavior and bounded diagnostics in the existing workflow code.
- Do not introduce runtime remote media fetches for profession, skill, or cost icons. All runtime
  asset paths must be local/static or app-owned descriptors adapted through approved boundaries.
- Keep clipboard writes best-effort only and preserve selectable-text fallback rather than assuming
  permissioned clipboard access.
- Preserve current storage and transfer protections against dangerous keys, malformed payloads,
  unsupported versions, and silent schema coercion.
- Keep exported data inert text or JSON only. The sprint should not add HTML rendering, embedded
  scripts, or remote content injection paths.

## Dependencies

- `BW-1801` is the planning prerequisite for the whole sprint because it locks the first-screen IA,
  the `"Any"` strategy, and the preservation boundary for completed features.
- `BW-1802` depends on `BW-1801` and is the foundation for every UI-facing ticket after it.
- `BW-1803` depends on `BW-1802` because the header contract and active-draft naming belong inside
  the composer shell, not outside it.
- `BW-1804` and `BW-1807` both depend on `BW-1803` because attribute visibility and default skill
  filtering are defined by the settled profession header behavior.
- `BW-1805` depends on `BW-1807` because the skills tab defines the drag source and compact row
  projection the bar must interoperate with.
- `BW-1806` depends on `BW-1804` and `BW-1805` so the inline template surface reflects the final
  composer controls and messaging.
- `BW-1808` depends on `BW-1803`, `BW-1804`, `BW-1805`, and `BW-1807` because icon and spacing
  polish should not solidify before the header, attribute, catalog, and bar layouts stop moving.
- `BW-1809` depends on `BW-1801` through `BW-1808` and ends with `npm run verify`.
- Repository prerequisites already exist: promoted profession and skill catalogs, current template
  compatibility, current validation engine, current workspace persistence, and current build-set and
  party selected-loadout flows.

## Open Questions

1. Should secondary surfaces on wide screens live in collapsible sections below the composer or in
   a compact auxiliary rail? Default to the simpler option that preserves testability and avoids a
   second dominant column beside the catalog.
2. Should active build-name editing be implemented as a new workspace action or by exposing a small
   editor-level rename path that still preserves template-name fallback behavior? Prefer the path
   that reuses existing name normalization without coupling draft naming to saved-record naming.
3. If policy-compliant real skill icons are not all ready during `BW-1808`, is profession-icon
   polish plus resource/cast/recharge iconography sufficient for sprint close? The draft assumes
   yes, provided missing skill art degrades to stable placeholders and the limitation is documented.
4. How much of the current advanced skill-browser filtering UI should remain reachable in the
   focused composer milestone? The draft assumes the selector capabilities stay available but the
   controls move behind a lower-priority affordance instead of staying in the default first view.
