---
id: SPRINT-008
title: Visual Prior Art
status: planned
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
---

# Sprint 008: Visual Prior Art

## Overview

This sprint turns `EPIC-07 Visual Prior Art` into one durable documentation surface that later UI
implementation tickets can cite without re-discovering screenshots or re-deciding source-policy
limits. The implementation output is documentation and planning records only: no runtime assets, no
application code, no screenshot edits, and no copied long-form source text.

The corpus is already bounded and concrete: 36 tracked PNG screenshots under `prior-art/` across
four folders, plus one ignored local `.DS_Store` that must not be inventoried. The sprint should
convert that corpus into a complete inventory, factual grouped notes, an explicit gap register, and
closeout records that point future agents to exact screenshot paths.

The sequencing priority is to lock the inventory and taxonomy first, then document the EPIC-08 MVP
surfaces, then capture template/tooltip/menu references, then record non-MVP equipment, party, and
PvX references, and only then publish the compendium note and update sprint/ticket records. That
order keeps the immediate downstream consumer, `EPIC-08 Core Build Editor`, ahead of lower-priority
future-surface notes and reduces late-stage rework.

## Use Cases

1. A later `EPIC-08` implementation ticket cites exact screenshot paths for the profession
   selector, attributes editor, skill bar, skill list, skill grids, and validation presentation
   without searching the repo manually.
2. A tooltip or template-controls task compares normal, elite, attribute, overcast, sacrifice,
   signet, upkeep, load/save, and hover states using documented screenshot evidence instead of
   memory or aesthetic guesswork.
3. A later equipment or weapon-set ticket reuses factual notes about panel framing, slot treatment,
   and tooltip hierarchy without polluting the MVP build-editor references.
4. A later party-builder or guide-display ticket can find the current hero-selected, party-member,
   and PvX display references and the documented gaps that still need capture.
5. A reviewer can verify that every tracked screenshot is accounted for exactly once and that no
   image files were moved, renamed, cropped, optimized, or added.
6. Ticket-burn execution can update the compendium, ticket files, sprint ledger, and result
   manifest from one implementation-ready plan without another planning pass.

## Architecture

### Scope Boundary

| Area | In Scope | Out Of Scope |
| --- | --- | --- |
| Corpus inventory | Relative path, folder, dimensions, and one or more stable reference groups for every tracked PNG under `prior-art/`. | Renaming files, editing image binaries, creating new screenshots, or embedding runtime media into the app. |
| Visual notes | Factual observations about typography, color families, borders, spacing, icon treatment, selection states, empty or disabled states, tooltip behavior, and visible layout structure. | Final UI design mandates, React component structure, hard-coded runtime dimensions, or unverifiable aesthetic claims. |
| Durable documentation | One canonical compendium note at `compendium/visual-prior-art.md` with inventory, grouped notes, gap register, and citation guidance. | Splitting the authoritative inventory across multiple docs, or creating a second source of truth under `prior-art/`. |
| Planning records | Ticket status updates, epic closeout, sprint record, ledger entry, and ticket-burn result manifest. | Application implementation changes under `src/app`, `src/domain`, `src/template-compatibility`, or `scripts/data`. |
| Verification | Cheap manual file/path/link checks during each phase plus repository-wide `npm run verify` at closeout. | New automated screenshot diff tooling, image processing, network fetches, or live source refreshes. |

### Canonical Artifact Shape

`compendium/visual-prior-art.md` should be the only durable reference note created by this sprint.
It should contain:

1. A short policy boundary explaining that screenshots and PvX references remain
   development-reference-only under `compendium/source-policy.md`.
2. A corpus summary that states the folder split and total count: 27 skills/attributes references,
   5 equipment-panel references, 2 weapon-set references, and 2 PvX guide references.
3. A full inventory table with one row per tracked PNG and columns for relative path, folder,
   dimensions, and reference-group tags.
4. Grouped factual notes for the EPIC-08 MVP surfaces.
5. Grouped factual notes for template dialogs, menus, and tooltip variants.
6. Separate future-surface notes for equipment, weapon sets, party/hero display, and PvX guide
   layout.
7. A bounded gap register naming the missing or weak references that remain useful later.
8. Citation guidance telling later tickets to cite relative screenshot paths and note sections
   rather than treating image dimensions or wording as runtime UI requirements.

The note should cite screenshot paths as relative repo paths and should not duplicate image files,
embed copied prose, or convert screenshots into runtime assets. Dimensions belong in the inventory
for discovery and reconciliation only; they are not layout specs for later UI work.

### Reference Grouping

Use a fixed taxonomy in the inventory so later notes and tickets can refer to stable categories
instead of ad hoc labels:

- `skills-panel`
- `attributes-section`
- `skill-bar`
- `profession-selector`
- `skills-menu`
- `skill-list-row`
- `skill-grid-small`
- `skill-grid-large`
- `skill-tooltip`
- `attribute-tooltip`
- `template-control`
- `template-dialog`
- `menu-control`
- `equipment-panel`
- `equipment-tooltip`
- `weapon-set`
- `party-selector`
- `hero-selected`
- `guide-display`

Multiple groups may apply to a single screenshot. Composite screenshots that show both a list row
and a tooltip should carry both group tags instead of forcing one primary label.

### Execution Topology

```text
BW-0701 inventory and taxonomy
  -> BW-0702 core build-editor notes
  -> BW-0703 template, menu, and tooltip notes
  -> BW-0704 equipment, party, weapon-set, and guide notes
  -> BW-0705 compendium publish, gap register, and closeout
```

`BW-0702`, `BW-0703`, and `BW-0704` are parallelizable after `BW-0701`, but the default
single-threaded execution order should be `BW-0702` first, then `BW-0703`, then `BW-0704`,
because `EPIC-08` is the immediate consumer and `BW-0705` depends on all three note sets.

## Implementation

Implementation should proceed in dependency order, with each phase performing its own cheap manual
verification before the sprint reaches the heavier repository-wide closeout checks.

### Phase 1: BW-0701 Prior-Art Inventory And Taxonomy (~20% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0701-prior-art-inventory-and-taxonomy.md`

**Tasks:**

- [ ] Enumerate every tracked PNG under `prior-art/` and confirm the bounded corpus count is 36.
- [ ] Exclude the ignored local file `prior-art/gw-skills-and-attributes-refs/.DS_Store` from the
      inventory while noting it as a local non-artifact edge case in ticket or sprint execution
      notes if useful.
- [ ] Record one inventory row per PNG with relative path, containing folder, dimensions, and one
      or more reference-group tags from the fixed taxonomy.
- [ ] Reconcile the folder split inside the inventory summary: 27 files in
      `prior-art/gw-skills-and-attributes-refs/`, 5 in `prior-art/gw1-equipment-panel/`, 2 in
      `prior-art/gw1-weapon-sets/`, and 2 in `prior-art/gwpvx/`.
- [ ] Capture filename edge cases early so later phases do not break links or confuse distinct
      screenshots, especially duplicate basenames such as `hero-selected.png` in different folders
      and the typoed PvX filename `display-only-build-tempalte.png`.
- [ ] Establish `compendium/visual-prior-art.md` as the canonical inventory location before any
      deeper observation notes are written.

**Verification:**

- `find prior-art -type f -name '*.png' | sort`
- `find prior-art -type f -name '*.png' | wc -l`
- Manual reconciliation between the inventory row count and the on-disk PNG count.

**Phase Gate:** Every tracked PNG is inventoried exactly once, the row count is 36, and the note
taxonomy is stable enough for later phases to cite without rework.

### Phase 2: BW-0702 Skills And Attributes Visual Notes (~25% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0702-skills-and-attributes-visual-notes.md`

**Tasks:**

- [ ] Extract factual notes from the MVP-heavy screenshots under
      `prior-art/gw-skills-and-attributes-refs/` that cover the skills-and-attributes panel,
      attributes section, skill bar, profession selector, skills menu, list-row states, and both
      grid views.
- [ ] Separate observations by surface so later `EPIC-08` work can cite the exact subsection for
      profession selection, attribute editing, skill-bar presentation, skill search/list behavior,
      and grid rendering.
- [ ] Record visible typography hierarchy, frame/border treatment, color families, spacing density,
      icon sizing or framing cues, selected states, and visible empty or disabled states where they
      actually appear.
- [ ] Tie every observation to one or more screenshot paths from the Phase 1 inventory and mark
      unobserved states as gaps instead of inferred truths.
- [ ] Keep the notes implementation-neutral: describe what is visible and useful, not how React
      components should be built.
- [ ] Keep copied in-game wording to the minimum needed to identify a region or state and do not
      turn screenshot text into reusable runtime copy.

**Verification:**

- Manual screenshot review against the Phase 1 inventory rows used by each note subsection.
- Manual link/path check that every cited screenshot path exists and matches the intended section.

**Phase Gate:** The core `EPIC-08` surfaces have cited, implementation-neutral visual notes before
template or future-surface work is folded into the same compendium note.

### Phase 3: BW-0703 Template Dialog, Tooltip, And Menu Notes (~20% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0703-template-dialog-tooltip-and-menu-notes.md`

**Tasks:**

- [ ] Document the template button, template menu, load dialog, save dialog, template-code dialog,
      sort menu, icon-display menu, and load/save hover-tooltip references.
- [ ] Document the representative tooltip variants already in the corpus: normal skill tooltip,
      elite skill tooltip, attribute tooltip, and list-row-plus-tooltip composites for signet,
      overcast, sacrifice, upkeep, and no-recharge states.
- [ ] Record modal framing, menu density, row affordances, hover treatment, tooltip border and
      title/value hierarchy, and icon-to-text alignment only where visible in the screenshots.
- [ ] Distinguish confirmed hover, selected, empty, or disabled states from missing states so later
      UI tasks know what is evidenced and what still needs invention or additional capture.
- [ ] Keep all notes tied to screenshot paths and inventory categories instead of summarizing these
      surfaces as one undifferentiated aesthetic block.

**Verification:**

- Manual screenshot review against the cited inventory rows.
- Manual source-policy check that the notes do not copy long-form game UI text or convert screenshot
  wording into runtime-facing content.

**Phase Gate:** Template-control and tooltip references are complete enough that `EPIC-08` can cite
them directly without re-opening screenshot discovery.

### Phase 4: BW-0704 Equipment, Party, And Guide Reference Notes (~15% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0704-equipment-party-and-guide-reference-notes.md`

**Tasks:**

- [ ] Add a clearly separated future-surface section for `prior-art/gw1-equipment-panel/`,
      `prior-art/gw1-weapon-sets/`, the party and hero references in
      `prior-art/gw-skills-and-attributes-refs/`, and the PvX guide-display screenshots in
      `prior-art/gwpvx/`.
- [ ] Record factual observations about equipment panel framing, slot/icon treatment, equipment and
      weapon tooltip hierarchy, weapon-set selector presentation, party-selector density, and
      hero-selected state evidence.
- [ ] Document only display/layout lessons from the PvX screenshots, including inline skill-icon
      use, side-column or build-summary structure, and link-heavy guide presentation. Do not copy
      community guide prose or treat the screenshots as runtime content.
- [ ] Call out the currently known gaps explicitly: standalone rune tooltip references, standalone
      insignia references, standalone weapon-upgrade item tooltip references, and full party-window
      captures.
- [ ] Keep these notes separate from the `EPIC-08` MVP sections so later equipment, party, and
      guide work can benefit without muddying the core editor scope.

**Verification:**

- Manual screenshot review against the inventory.
- Manual source-policy review for screenshot and PvX/community-content handling.

**Phase Gate:** Non-MVP future-surface references are preserved and explicitly bounded, with their
missing captures called out rather than left implicit.

### Phase 5: BW-0705 Gap Register, Compendium, And Closeout (~20% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `compendium/README.md`
- `work/tickets/07-visual-prior-art/BW-0705-gap-register-compendium-and-closeout.md`
- `work/tickets/07-visual-prior-art/EPIC.md`
- `work/sprints/SPRINT-008.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json`

**Tasks:**

- [ ] Finalize `compendium/visual-prior-art.md` as the canonical note with inventory, grouped
      observations, explicit gaps, and citation guidance for future tickets.
- [ ] Add the new compendium note to `compendium/README.md` under the source-and-QA documentation
      list so later agents discover it without scanning the filesystem.
- [ ] Update BW-0701 through BW-0705 ticket files, `work/tickets/07-visual-prior-art/EPIC.md`,
      the final sprint record, and `work/sprints/ledger.tsv` so statuses, dates, and scope all
      agree at closeout.
- [ ] Write the required ticket-burn result manifest to
      `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json`.
- [ ] Run the cheap path/link/inventory checks again before the repository-wide validation command
      so documentation mistakes fail early and locally.
- [ ] Run `npm run verify` as the canonical closeout command.
- [ ] Confirm that no file under `prior-art/` changed during sprint execution.

**Verification:**

- `rg -n "visual-prior-art" compendium/README.md work/sprints/SPRINT-008.md work/tickets/07-visual-prior-art`
- `git diff --name-status -- prior-art`
- `npm run verify`

**Phase Gate:** The canonical note is published, the gap register is explicit, planning records are
consistent, repository verification passes, and the screenshot corpus remains untouched.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `compendium/visual-prior-art.md` | Create | Canonical durable note containing the full inventory, grouped visual observations, gap register, and citation guidance. |
| `compendium/README.md` | Modify | Add a discoverable link to the visual-prior-art note. |
| `work/tickets/07-visual-prior-art/BW-0701-prior-art-inventory-and-taxonomy.md` | Modify | Record inventory/taxonomy execution status and any bounded implementation notes. |
| `work/tickets/07-visual-prior-art/BW-0702-skills-and-attributes-visual-notes.md` | Modify | Record completion of the EPIC-08 MVP reference notes. |
| `work/tickets/07-visual-prior-art/BW-0703-template-dialog-tooltip-and-menu-notes.md` | Modify | Record completion of template-control, tooltip, and menu note coverage. |
| `work/tickets/07-visual-prior-art/BW-0704-equipment-party-and-guide-reference-notes.md` | Modify | Record completion of future-surface note coverage and bounded gaps. |
| `work/tickets/07-visual-prior-art/BW-0705-gap-register-compendium-and-closeout.md` | Modify | Record compendium publish, gap register, and verification closeout. |
| `work/tickets/07-visual-prior-art/EPIC.md` | Modify | Mark epic completion and align status with ticket closeout. |
| `work/sprints/SPRINT-008.md` | Create/modify | Final sprint planning and execution record. |
| `work/sprints/ledger.tsv` | Modify | Add `SPRINT-008` lifecycle tracking. |
| `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json` | Create | Required ticket-burn planning result manifest for this epic. |
| `prior-art/**/*` | No content changes | Source screenshot corpus to inventory and cite; binaries remain development-reference-only and untouched. |

## Definition of Done

- [ ] Every tracked PNG under `prior-art/` is inventoried exactly once in
      `compendium/visual-prior-art.md`.
- [ ] The inventory excludes the ignored `.DS_Store` and reconciles to 36 tracked PNG files.
- [ ] Every inventory row records relative path, folder, dimensions, and at least one stable
      reference-group tag.
- [ ] The compendium note includes a folder/count summary for the four corpus areas and a clear
      policy reminder that screenshots remain development references only.
- [ ] MVP-focused notes cover the skills panel, attributes section, skill bar, profession selector,
      skills menu, skill list rows, and small/large grid views with screenshot citations.
- [ ] Tooltip and template-control notes cover normal skill, elite skill, attribute, signet,
      overcast, sacrifice, upkeep, no-recharge, load/save hover, template menu, load dialog, save
      dialog, template-code dialog, sort menu, and icon-display menu evidence where present.
- [ ] Future-surface notes cover equipment panel, equipment tooltips, weapon tooltip, weapon sets,
      party selector, party tooltip, hero-selected states, and PvX guide-display references without
      copying community prose.
- [ ] The gap register explicitly names the remaining weak or missing captures, especially standalone
      rune, insignia, weapon-upgrade item tooltips, and full party-window references.
- [ ] `compendium/README.md` links to `compendium/visual-prior-art.md`.
- [ ] Later tickets have citation guidance that points them to relative screenshot paths and note
      sections rather than treating image dimensions as implementation requirements.
- [ ] No file under `prior-art/` is renamed, added, removed, cropped, optimized, transformed, or
      otherwise modified.
- [ ] No application implementation code is changed.
- [ ] BW-0701 through BW-0705, `EPIC-07`, `SPRINT-008`, the sprint ledger, and the ticket-burn
      result manifest are updated consistently.
- [ ] Cheap manual path/link/inventory checks pass before closeout.
- [ ] `npm run verify` passes.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The inventory misses a screenshot or double-counts one because filenames repeat across folders. | Medium | High | Use exact relative paths, reconcile to the known 36-file count, and call out duplicate basenames such as `hero-selected.png` early in Phase 1. |
| The typoed PvX filename `display-only-build-tempalte.png` causes a broken link or silent omission. | High | Medium | Treat the current filename as canonical inventory evidence, cite it exactly, and verify all paths manually before closeout. |
| Notes drift from factual observation into speculative UI direction. | Medium | High | Require screenshot-path evidence for each section and mark unobserved states as gaps rather than inferred truths. |
| Composite screenshots blur distinct surfaces such as list rows versus tooltips. | Medium | Medium | Allow multiple reference-group tags per screenshot and separate note subsections by visible surface, not just by file. |
| Community or game-owned text leaks into durable docs as copied content. | Medium | High | Keep copied wording minimal, do not transcribe PvX prose, and re-check source-policy constraints in Phases 3 through 5. |
| The canonical documentation is split across too many files and later tickets cite inconsistent notes. | Medium | High | Keep one authoritative compendium note and use ticket files only for scope/status traceability. |
| Documentation-only work defers verification until the end and accumulates broken paths. | Medium | Medium | Run cheap path, count, and citation checks during each phase before the final `npm run verify`. |
| Non-MVP future-surface notes overshadow the immediate `EPIC-08` consumer. | Low | Medium | Sequence `BW-0702` ahead of `BW-0703` and `BW-0704`, and keep future-surface notes in a clearly separate section. |

## Security

- Treat screenshots and PvX references as untrusted development-reference material, not runtime or
  releasable assets.
- Do not copy external image binaries into `src`, `public`, `data/generated`, test fixtures, or any
  release payload.
- Do not transcribe community guide prose, ratings, or long-form in-game text into the compendium,
  tickets, or generated artifacts.
- Keep all citations as relative repo paths and factual notes; no OCR pipeline, scraping, or live
  network fetch is required for this sprint.
- Do not add executable artifacts, scripts, or automation that process screenshots beyond basic
  local file inspection used for dimensions and counts.
- Confirm closeout records do not imply approval for runtime media use; future attribution and
  runtime-media decisions still require an explicit later ticket.

## Dependencies

- Completed `SPRINT-001` / `EPIC-00` for repo structure, ticket/sprint conventions, and
  ticket-burn record locations.
- Completed `SPRINT-002` / `EPIC-01` for the source-policy and QA rules that keep screenshots and
  prior-art images development-reference-only.
- Existing ready tickets `BW-0701` through `BW-0705` under `work/tickets/07-visual-prior-art/`.
- The current on-disk screenshot corpus: 36 tracked PNG files in `prior-art/` plus one ignored
  local `.DS_Store`.
- Downstream consumer `work/tickets/08-core-build-editor/EPIC.md`, which needs concrete citations
  for professions, attributes, skills, template controls, tooltips, and validation presentation.
- Repository verification tooling from `README.md`: Node.js `>=22.11.0`, npm `>=11.10.1`, Python 3,
  and the canonical `npm run verify` command.
- No new npm package, no application implementation change, and no live network/source refresh are
  required.

## Open Questions

No open question blocks execution. The sprint should proceed with these defaults:

1. `compendium/visual-prior-art.md` is the canonical durable note; do not create a second
   authoritative inventory document under `prior-art/`.
2. The compendium note should contain the full inventory table, not just summaries that force later
   agents to re-scan the filesystem.
3. `BW-0702` executes ahead of `BW-0703` and `BW-0704` in the default order because `EPIC-08` is
   the immediate consumer, even though those phases are parallelizable after `BW-0701`.
4. PvX screenshots may be cited for layout/display observations and file paths only; community prose
   and recommendations remain out of scope.
5. The currently known screenshot gaps are useful but not sprint-blocking unless execution uncovers
   that an `EPIC-08` MVP surface has no usable citation at all.