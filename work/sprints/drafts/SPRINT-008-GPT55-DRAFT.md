---
id: SPRINT-008
title: Visual Prior Art
status: draft
source_target: BACKLOG
source_epic: EPIC-07
source_epic_path: work/tickets/07-visual-prior-art/EPIC.md
tickets:
  - BW-0701
  - BW-0702
  - BW-0703
  - BW-0704
  - BW-0705
created: 2026-09-02
updated: 2026-09-02
---

# Sprint 008: Visual Prior Art

## Overview

This sprint turns `EPIC-07 Visual Prior Art` into a durable, cited reference layer for later UI
implementation work. It inventories the existing `prior-art/` screenshot corpus, groups the
references by product surface, records factual visual observations, names screenshot gaps, and
publishes the results in the compendium so EPIC-08 and later tickets can cite exact evidence without
rediscovering files.

The sprint is documentation and planning-record work. It must not modify `src/app`, `src/domain`,
`src/template-compatibility`, `scripts/data`, generated data, tests, package metadata, or runtime
assets. Existing screenshots stay exactly where they are and remain development-reference material
under the source policy. They are not copied into the runtime bundle, transformed, renamed, optimized,
or treated as approved public assets.

The primary deliverable should be one durable compendium document,
`compendium/visual-prior-art.md`, linked from `compendium/README.md`. That document owns the
inventory, taxonomy, cited observations, aesthetic target summary, downstream consumer notes, and gap
register. A separate `prior-art/README.md` is out of scope unless execution discovers a concrete
navigation need that cannot be solved from the compendium index.

The sprint should make ambiguity visible instead of filling gaps with design invention. Screenshot
dimensions, visible control states, colors, borders, spacing, typography, tooltip placement, icon
treatment, and menu density may be recorded as observations. Final React component structure,
responsive layout rules, exact pixel dimensions, visual copying, and runtime text/media reuse belong
to later implementation tickets.

## Use Cases

1. **Plan the core build editor**: EPIC-08 can cite screenshots for the profession selector,
   attribute editor, skill bar, skill search/list/grid views, skill tooltips, template controls, and
   validation presentation.
2. **Avoid repeated discovery**: Later agents can find every tracked prior-art PNG from one
   inventory with relative path, folder, dimensions, and reference categories.
3. **Separate MVP and later references**: Core skills-and-attributes notes are distinguished from
   equipment, weapon-set, party, and guide references that belong to later epics.
4. **Preserve source-policy boundaries**: Maintainers can use screenshots as design evidence without
   accidentally approving them as runtime assets or copied UI content.
5. **Surface missing evidence**: Future tickets can see which states are covered and which remain
   gaps, especially standalone rune, insignia, weapon-upgrade item tooltips, and full party-window
   references.
6. **Create a factual aesthetic target**: UI work can use concrete observations about density,
   hierarchy, borders, color families, icon treatment, selected states, hover states, empty states,
   and tooltip behavior without hard-coding screenshots as specs.
7. **Close EPIC-07 cleanly**: The ticket-burn run can update sprint, ticket, epic, ledger, and result
   manifest records without touching application implementation code.

## Architecture

### Documentation Boundary

`compendium/visual-prior-art.md` is the canonical prior-art note for this sprint. It should use
relative paths to screenshots as evidence, not embedded image binaries or copied long-form UI text.
The document should be structured for later implementation agents:

- inventory and taxonomy first;
- MVP skills-and-attributes references next;
- template, dialog, tooltip, and menu references next;
- equipment, weapon-set, party, and PvX guide references after the MVP material;
- gap register and citation policy at the end.

The compendium note is allowed to cite existing files under `prior-art/`. It is not allowed to add,
move, edit, crop, compress, regenerate, or export screenshot assets.

### Corpus Boundary

The known tracked corpus at planning time is 36 PNG files:

| Folder | Count | Primary Use |
| --- | ---: | --- |
| `prior-art/gw-skills-and-attributes-refs/` | 27 | EPIC-08 core build editor, template controls, skill tooltip variants, party selector references |
| `prior-art/gw1-equipment-panel/` | 5 | Later equipment editor and hero/equipment display references |
| `prior-art/gw1-weapon-sets/` | 2 | Later weapon-set display and tooltip references |
| `prior-art/gwpvx/` | 2 | Later community build and guide display references |

The inventory must include only tracked screenshot files matching `prior-art/**/*.png`. Ignored local
files such as `.DS_Store` are not inventory rows. The misspelled
`prior-art/gwpvx/display-only-build-tempalte.png` path and duplicate `hero-selected.png` basenames in
different folders are factual path quirks to preserve, not cleanup tasks.

### Taxonomy

Every screenshot should have one or more categories. Use these initial categories unless execution
finds a clearer local label:

- `skills-panel`
- `attributes`
- `profession-selector`
- `skill-bar`
- `skill-list-row`
- `skill-grid-small`
- `skill-grid-large`
- `skills-menu`
- `template-menu`
- `template-dialog`
- `skill-tooltip`
- `attribute-tooltip`
- `hover-tooltip`
- `party-selector`
- `hero-selected`
- `equipment-panel`
- `equipment-tooltip`
- `weapon-set`
- `weapon-tooltip`
- `pvx-guide-display`
- `gap-evidence`

Categories are planning affordances, not runtime enums. If a screenshot spans multiple surfaces,
keep one inventory row and assign multiple categories instead of duplicating the file.

### Observation Model

Each observation should be evidence-backed and implementation-neutral:

- **Surface**: the UI area being described, such as skill bar, tooltip, menu, or equipment panel.
- **Evidence**: one or more relative screenshot paths.
- **Observed facts**: concrete visual facts visible in the screenshot.
- **Useful later for**: EPIC-08 or another downstream epic/ticket.
- **Limits or gaps**: states not visible, uncertain interpretations, or missing screenshots.

The notes should prefer phrasing like "the screenshot shows" or "visible state includes" over broad
aesthetic claims. Do not infer behavior that is not visible. Do not treat screenshot pixel dimensions
as final responsive layout requirements.

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Inventory | Relative path, folder, PNG dimensions, category tags, duplicate-name notes, and corpus count reconciliation. | Moving, renaming, deleting, transforming, optimizing, adding, or embedding image files. |
| Visual notes | Factual observations about typography, color families, borders, spacing, density, icon treatment, selected states, disabled or empty states, hover states, tooltips, dialogs, menus, and visible layout hierarchy. | Final visual design system, React components, CSS tokens, responsive layout implementation, accessibility implementation, or pixel-perfect copying. |
| Source policy | Development-reference classification, no runtime asset approval, no copied guide prose, and future-ticket requirement for public media use. | Legal conclusions, attribution approval, runtime screenshot/media redistribution, or policy exceptions. |
| Downstream handoff | Notes for EPIC-08, EPIC-14, EPIC-17, EPIC-18, and EPIC-19 consumers with exact screenshot citations. | Building core editor UI, equipment editor UI, party builder UI, guide authoring UI, PvX import, or build knowledge ingestion. |
| Closeout | Ticket statuses, sprint file, ledger update, compendium index link, and ticket-burn result manifest. | Git commit creation, application implementation code changes, generated catalog changes, or live-network data refreshes. |

## Implementation

### Phase 1: BW-0701 Prior-Art Inventory And Taxonomy

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0701-prior-art-inventory-and-taxonomy.md`

**Tasks:**

- [ ] Reconcile the screenshot corpus with `find prior-art -type f -name '*.png' | sort`.
- [ ] Confirm the count is 36 tracked PNGs unless execution finds a committed corpus change.
- [ ] Record one inventory row per screenshot with relative path, folder, dimensions, and categories.
- [ ] Preserve exact path spellings, including duplicate basenames and existing typos.
- [ ] Distinguish development-reference screenshots from runtime assets in the inventory preface.
- [ ] Add review notes for duplicate or near-duplicate references without changing binaries.

**Verification:**

- `find prior-art -type f -name '*.png' | sort`
- Manual check that every listed PNG appears exactly once in the inventory.
- `git status --short` confirms no screenshot binaries were added, removed, renamed, or modified.

### Phase 2: BW-0702 Skills And Attributes Visual Notes

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0702-skills-and-attributes-visual-notes.md`

**Tasks:**

- [ ] Document the full skills-and-attributes panel and its major internal regions.
- [ ] Document the profession selector, attributes section, skill bar, skills menu, row view, small
      grid view, and large grid view.
- [ ] Capture visible hierarchy, typography, color families, borders, spacing, density, icon
      treatment, selected states, disabled states, empty states, and validation-adjacent affordances.
- [ ] Tie every note to screenshot evidence paths.
- [ ] Mark ambiguous states as assumptions or gaps instead of inventing behavior.
- [ ] Keep EPIC-08-facing notes separate from later party/equipment/guide references.

**Verification:**

- Manual screenshot review against the BW-0701 inventory.
- Manual pass that each observation has at least one evidence path.
- Source-policy check that no long-form in-game text is copied into runtime-facing material.

### Phase 3: BW-0703 Template Dialog, Tooltip, And Menu Notes

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0703-template-dialog-tooltip-and-menu-notes.md`

**Tasks:**

- [ ] Document template button, template menu, template code dialog, load dialog, save dialog, sort
      menu, icon display menu, and hover tooltip references.
- [ ] Document normal skill tooltip, elite skill tooltip, attribute tooltip, and cost-special row
      tooltip variants where visible.
- [ ] Record modal framing, menu density, row affordances, tooltip placement, title/value/body
      hierarchy, icon alignment, hover states, selected states, disabled states, and empty states.
- [ ] Separate confirmed visible behavior from likely interaction behavior that screenshots do not
      prove.
- [ ] Avoid designing or implementing import/export controls.

**Verification:**

- Manual screenshot review against the BW-0701 inventory.
- Manual check that tooltip and dialog notes cite screenshot paths and do not copy long-form source
  text.

### Phase 4: BW-0704 Equipment, Party, And Guide Reference Notes

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0704-equipment-party-and-guide-reference-notes.md`

**Tasks:**

- [ ] Document equipment panel layout, equipment tooltip hierarchy, weapon tooltip hierarchy,
      weapon-set controls, party selector density, party member tooltip, hero-selected state, and PvX
      guide display references.
- [ ] Label these notes as later-epic references unless they directly inform EPIC-08 shell
      decisions.
- [ ] Call out EPIC-14 equipment editor, EPIC-17 party/hero builder, EPIC-18 community build
      knowledge, and EPIC-19 guide authoring as downstream consumers.
- [ ] Treat PvX screenshots as visual references only; do not copy community guide prose, ratings,
      recommendations, usage notes, or page bodies.
- [ ] Record missing standalone rune, insignia, weapon-upgrade item tooltip, and full party-window
      references.

**Verification:**

- Manual screenshot review against the BW-0701 inventory.
- Manual source-policy review for PvX/community content and screenshot development-reference limits.

### Phase 5: BW-0705 Gap Register, Compendium, And Closeout

**Files:**

- `compendium/visual-prior-art.md`
- `compendium/README.md`
- `work/sprints/SPRINT-008.md`
- `work/sprints/ledger.tsv`
- `work/tickets/07-visual-prior-art/EPIC.md`
- `work/tickets/07-visual-prior-art/BW-0701-prior-art-inventory-and-taxonomy.md`
- `work/tickets/07-visual-prior-art/BW-0702-skills-and-attributes-visual-notes.md`
- `work/tickets/07-visual-prior-art/BW-0703-template-dialog-tooltip-and-menu-notes.md`
- `work/tickets/07-visual-prior-art/BW-0704-equipment-party-and-guide-reference-notes.md`
- `work/tickets/07-visual-prior-art/BW-0705-gap-register-compendium-and-closeout.md`
- `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json`

**Tasks:**

- [ ] Add a concise aesthetic target summary backed by cited observations.
- [ ] Add a bounded gap register with owner epic, impact, and MVP-blocking status for each gap.
- [ ] Document citation rules for future UI tickets: cite relative screenshot paths and notes, do
      not import prior-art images into runtime assets without a future explicit approval.
- [ ] Link `compendium/visual-prior-art.md` from `compendium/README.md`.
- [ ] Promote the final sprint to `work/sprints/SPRINT-008.md`.
- [ ] Mark BW-0701 through BW-0705 and EPIC-07 complete when acceptance criteria pass.
- [ ] Update `work/sprints/ledger.tsv` for SPRINT-008 completion.
- [ ] Write the ticket-burn result manifest at
      `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json`.

**Verification:**

- Manual link/path review across `compendium/visual-prior-art.md`, `compendium/README.md`, and
  screenshot paths.
- `npm run verify`
- `git status --short` confirms changes are limited to documentation, planning records, and the
  required result manifest.

## Files Summary

Expected sprint-created file:

- `compendium/visual-prior-art.md`
- `work/sprints/SPRINT-008.md`
- `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json`

Expected sprint-updated files:

- `compendium/README.md`
- `work/sprints/ledger.tsv`
- `work/tickets/07-visual-prior-art/EPIC.md`
- `work/tickets/07-visual-prior-art/BW-0701-prior-art-inventory-and-taxonomy.md`
- `work/tickets/07-visual-prior-art/BW-0702-skills-and-attributes-visual-notes.md`
- `work/tickets/07-visual-prior-art/BW-0703-template-dialog-tooltip-and-menu-notes.md`
- `work/tickets/07-visual-prior-art/BW-0704-equipment-party-and-guide-reference-notes.md`
- `work/tickets/07-visual-prior-art/BW-0705-gap-register-compendium-and-closeout.md`

Explicitly out-of-scope files and directories:

- `src/app/**`
- `src/domain/**`
- `src/template-compatibility/**`
- `scripts/data/**`
- `data/generated/**`
- `data/qa/**`
- `data/source-snapshots/**`
- `test/**`
- `prior-art/**/*.png`
- `package.json`
- `package-lock.json`

## Definition of Done

- Every tracked PNG under `prior-art/` is inventoried exactly once with relative path, folder,
  dimensions, and one or more UI reference categories.
- `compendium/visual-prior-art.md` contains factual, screenshot-cited notes for skills panel,
  attributes, profession selector, skill bar, skills menu, row view, small grid, large grid, template
  controls, dialogs, menus, skill and attribute tooltip variants, equipment panel, weapon sets, party
  selector, hero-selected state, and PvX guide display.
- Notes cover visible typography, color families, borders, spacing, density, icon treatment,
  selected states, hover states, disabled or empty states, tooltip behavior, and uncertainty where
  visible.
- The gap register explicitly names missing or weak references, especially standalone rune,
  insignia, weapon-upgrade item tooltips, and full party-window references, and marks whether each
  gap blocks EPIC-08.
- `compendium/README.md` links to the visual prior-art note.
- BW-0701 through BW-0705 are completed in dependency order.
- EPIC-07, `work/sprints/SPRINT-008.md`, `work/sprints/ledger.tsv`, and the ticket-burn result
  manifest are updated consistently.
- `npm run verify` passes, or any failure is documented as unrelated to this documentation-only
  sprint.
- No application implementation code, generated catalog artifacts, package metadata, tests, or
  screenshot binaries are changed.

## Risks

- **Subjective observations**: Visual interpretation can drift into design preference. Mitigate by
  requiring evidence paths and separating observed facts from recommendations.
- **Source-policy leakage**: Screenshots or PvX references could be treated as reusable runtime
  media or copied content. Mitigate with explicit development-reference language and no asset moves.
- **Scope creep into EPIC-08**: The sprint could start designing React components or CSS. Mitigate
  by limiting outputs to inventory, notes, gaps, and planning records.
- **Incomplete inventory**: Ignored files, duplicate basenames, typos, or nested paths could cause
  missed screenshots. Mitigate with sorted `find` output and exact one-row-per-PNG reconciliation.
- **Over-specific guidance**: Screenshot dimensions and pixel arrangements could be mistaken for
  responsive layout specs. Mitigate by recording dimensions as inventory metadata only.
- **Documentation sprawl**: Splitting the inventory across too many files could make later citations
  harder. Mitigate by making `compendium/visual-prior-art.md` canonical.

## Security

This sprint should not introduce new runtime security surface. It adds no dependencies, no browser
code, no storage code, no network access, no generated data ingestion, and no executable parsing
logic.

Security and policy checks are documentation-centered:

- keep all screenshots and prior-art images as development-reference material;
- do not add image binaries to `src`, `public`, `data/generated`, tests, or release payloads;
- do not copy PvX/community guide prose, ratings, recommendations, usage notes, or page bodies;
- preserve relative local paths only and avoid external fetches;
- require a future explicit ticket before any screenshot, icon, or copied UI content can become
  runtime media or public release content.

## Dependencies

- EPIC-01 source policy and QA conventions are required and already completed.
- SPRINT-001 through SPRINT-007 provide the current project boundaries, generated catalog context,
  template compatibility context, and rule-engine context.
- EPIC-08 depends on this sprint for concrete citations before core build-editor implementation.
- Later EPIC-14, EPIC-17, EPIC-18, and EPIC-19 consume non-MVP visual references from this sprint.
- The existing 36 PNG screenshot corpus under `prior-art/` is the only image corpus in scope.
- `npm run verify` remains the canonical repository validation command.
- No new npm, Python, runtime, or image-processing dependency should be added.

## Open Questions

1. Should future UI implementation treat the aesthetic target as strict in-game mimicry or as
   in-game-inspired evidence adapted to Build Wars accessibility and responsive layout needs? This
   sprint should record facts and leave final UI decisions to EPIC-08.
2. Should a future ticket add a machine-readable inventory, such as JSON, if Markdown citations prove
   too hard to maintain? This sprint should start with Markdown only.
3. Are standalone rune, insignia, weapon-upgrade item tooltip, and full party-window screenshots
   needed before EPIC-14 or EPIC-17 starts, or can they remain non-MVP gaps?
4. How much copied in-game label text is acceptable in documentation when identifying screenshot
   regions? This sprint should use only short factual labels and avoid long-form text.
5. If the screenshot corpus changes during execution, should SPRINT-008 inventory the new committed
   files or freeze to the 36-file planning baseline? Default to inventorying the committed corpus at
   execution time and recording the count change.