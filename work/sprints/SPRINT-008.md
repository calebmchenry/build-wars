---
id: SPRINT-008
title: Visual Prior Art
status: completed
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

This sprint turns `EPIC-07 Visual Prior Art` into a durable, factual reference layer for EPIC-08
and later UI work. It inventories the existing `prior-art/` screenshot corpus, groups each tracked
PNG by UI surface, records path-backed visual observations, names missing states, and publishes a
single compendium note that future tickets can cite.

The sprint is documentation and planning-record work. It must not modify application code, generated
data, tests, packages, build configuration, or screenshot binaries. Existing screenshots remain
development-reference material under `compendium/source-policy.md`; they are not copied into runtime
assets, embedded as images in documentation, transformed, renamed, optimized, or treated as approved
public-release media.

The planning baseline is 36 tracked PNG screenshots: 27 under
`prior-art/gw-skills-and-attributes-refs/`, 5 under `prior-art/gw1-equipment-panel/`, 2 under
`prior-art/gw1-weapon-sets/`, and 2 under `prior-art/gwpvx/`. If execution sees a different
Git-tracked corpus before note-taking starts, it must stop long enough to record the delta and review
whether the sprint scope or counts need amendment.

The aesthetic target is in-game-informed, not a strict clone. The output may promote recurring
hierarchy, density, framing, color-family, icon-treatment, selected-state, hover-state, and tooltip
patterns into non-binding design guidance, but it must keep visible facts, limitations, and later
product decisions separate.

## Use Cases

1. **Find core editor evidence**: EPIC-08 implementers can cite exact screenshot paths for the
   profession selector, attribute editor, skill bar, skill browser list/grid views, skill display,
   template controls, and tooltip presentation.
2. **Avoid rediscovery**: Later agents can review one inventory and know which tracked screenshot
   supports which UI surface.
3. **Translate prior art safely**: Designers and implementers can reuse observed density,
   hierarchy, framing, icon, and state patterns without copying source assets or hard-coding
   screenshot geometry.
4. **Document transient UI references**: Template dialogs, menus, hover overlays, and tooltip
   variants have concrete citations instead of memory-based descriptions.
5. **Preserve deferred context**: Equipment, weapon-set, party/hero, and PvX guide screenshots are
   documented as later-epic references without expanding EPIC-08.
6. **Expose gaps**: Missing or weak references, including standalone rune, insignia, weapon-upgrade
   item tooltips and full party-window references, are explicit and owned.
7. **Respect source policy**: Reviewers can verify that screenshots and PvX/community references
   remain development-only and do not become runtime content.

## Architecture

### Scope Boundary

| Area          | In Scope                                                                                                                                                                                           | Out of Scope                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corpus        | Git-tracked `prior-art/**/*.png` files at sprint start, currently 36 PNGs across four folders.                                                                                                     | `.DS_Store`, untracked local files, newly sourced captures, remote images, screenshot cleanup, renames, crops, optimization, or media generation.          |
| Inventory     | One row per tracked PNG with repository-relative path, source folder, verified PNG type, dimensions, controlled categories, visible-state tags, and short review notes.                            | EXIF/private metadata, absolute local paths, copied thumbnails, OCR dumps, source hashes as runtime IDs, or duplicated category rows.                      |
| Observations  | Factual notes about visible typography hierarchy, color families, borders, spacing/density, icon treatment, alignment, selected/hover/disabled/empty states, dialogs, menus, and tooltip behavior. | React component structure, CSS tokens, exact pixel specs, breakpoint decisions, accessibility implementation, inferred behavior, or a pixel-perfect clone. |
| Synthesis     | Evidence-derived visual characteristics, downstream ownership, limits, and non-binding handoff guidance.                                                                                           | Final product branding, UI implementation, visual regression baselines, or design-system token creation.                                                   |
| Gaps          | Missing state/surface, available evidence, affected epic, impact, EPIC-08 blocking status, owner, and next action.                                                                                 | Capturing new screenshots or silently treating missing evidence as approval.                                                                               |
| Source policy | Local path citations and structural observations for development reference only.                                                                                                                   | Runtime screenshot use, public redistribution, copied guide prose, copied long-form game text, attribution approval, or source-policy exceptions.          |
| Verification  | Local tracked-path reconciliation, image-header checks, Markdown link review, source-policy audit, protected-path diff review, `npm run format:check`, and `npm run verify`.                       | Network access, live wiki/PvX fetches, OCR services, image conversion, new dependencies, or committed contact sheets.                                      |

### Canonical Artifact

`compendium/visual-prior-art.md` is the only authoritative committed prior-art note for this
sprint. It should contain:

1. purpose, source-policy boundary, and interpretation rules;
2. corpus baseline with the current 36-file folder summary;
3. taxonomy definitions;
4. full inventory table;
5. EPIC-08 core editor observations;
6. template, menu, hover, and tooltip observations;
7. deferred equipment, weapon-set, party/hero, and PvX guide observations;
8. evidence-derived visual characteristics;
9. gap register; and
10. citation and maintenance protocol.

Do not create a second authoritative inventory in `prior-art/README.md` or a committed JSON/TSV
manifest during this sprint. A future `prior-art/README.md`, if needed, should only link to the
compendium note unless a later ticket approves a split source of truth.

### Corpus Enumeration

Use the Git index as the authoritative corpus source:

```sh
git ls-files -- 'prior-art/**/*.png' | LC_ALL=C sort
```

Use filesystem scans only as secondary checks for unexpected local artifacts:

```sh
find prior-art -type f -name '*.png' | LC_ALL=C sort
git status --short -- prior-art
```

The current planning baseline is:

| Folder                                     | Tracked PNGs | Primary downstream use                                                                    |
| ------------------------------------------ | -----------: | ----------------------------------------------------------------------------------------- |
| `prior-art/gw-skills-and-attributes-refs/` |           27 | EPIC-08 core editor, template controls, skill tooltip variants, party selector references |
| `prior-art/gw1-equipment-panel/`           |            5 | EPIC-13 and EPIC-14 equipment display/editor                                              |
| `prior-art/gw1-weapon-sets/`               |            2 | EPIC-14 weapon-set editor                                                                 |
| `prior-art/gwpvx/`                         |            2 | EPIC-18 community knowledge and EPIC-19 guide authoring                                   |
| **Total**                                  |       **36** | Complete current tracked corpus                                                           |

### Taxonomy

Use this controlled category vocabulary for inventory rows. Additions require a local taxonomy note
and migration of existing affected rows in the same change.

| Category              | Inclusion Rule                                                |
| --------------------- | ------------------------------------------------------------- |
| `skills-panel`        | Full or partial skills and attributes panel framing.          |
| `attributes`          | Attribute rows, ranks, controls, or attribute-section layout. |
| `profession-selector` | Profession selection controls or profession menus.            |
| `skill-bar`           | Eight-slot skill bar or slot framing.                         |
| `skills-menu`         | Skill menu shell, filters, or list/grid mode controls.        |
| `skill-list-row`      | Skill browser row entries or row state examples.              |
| `skill-grid-small`    | Compact skill grid view.                                      |
| `skill-grid-large`    | Larger skill grid/card view.                                  |
| `skill-tooltip`       | Skill tooltip or skill row plus tooltip composite.            |
| `attribute-tooltip`   | Attribute tooltip content or placement.                       |
| `template-control`    | Template button or template access control.                   |
| `template-menu`       | Template menu options or menu state.                          |
| `template-dialog`     | Load, save, or code dialogs.                                  |
| `hover-tooltip`       | Hover overlay tied to a dialog, menu, row, or control.        |
| `party-selector`      | Party member selector, party row, or party menu reference.    |
| `party-tooltip`       | Party member tooltip reference.                               |
| `hero-selected`       | Hero-selected state or hero display reference.                |
| `equipment-panel`     | Equipment panel layout or slot treatment.                     |
| `equipment-tooltip`   | Armor/equipment item tooltip.                                 |
| `weapon-set`          | Weapon-set selector or weapon-set display.                    |
| `weapon-tooltip`      | Weapon or weapon-set tooltip.                                 |
| `pvx-guide-display`   | PvX-style build or guide display layout.                      |

Multiple categories may apply to one screenshot. Composite screenshots stay one inventory row and
receive multiple categories; do not duplicate rows to make category sections look complete.

### Observation Model

Each observation should use a stable ID such as `VP-OBS-001` and include:

- surface;
- exact screenshot evidence path or paths;
- visible facts;
- uncertainty or limitation;
- downstream epic or ticket consumer; and
- optional non-binding design implication, clearly separated from the facts.

Do not infer behavior that static screenshots do not show. Screenshot dimensions are inventory
metadata only, not component widths, viewport assumptions, breakpoints, or acceptance thresholds.

### Gap Register

Each gap should use a stable ID such as `VP-GAP-001` and include:

- missing or weak state/surface;
- available evidence;
- affected consumer;
- impact: `blocker`, `non-blocking implementation-owned`, or `non-blocking later capture`;
- EPIC-08 blocking status;
- owner epic or future ticket; and
- next action or resolution trigger.

Known non-blocking later-capture gaps include standalone rune tooltips, standalone insignia
tooltips, standalone weapon-upgrade item tooltips, and full party-window references. Known EPIC-08
implementation-owned gaps include keyboard focus, accessibility states, responsive/mobile layout,
loading/error behavior, and inline validation presentation.

### Alternatives Considered

- **Generated inventory manifest**: Deferred. The corpus is small and no programmatic consumer
  exists yet.
- **Separate `prior-art/README.md`**: Deferred to avoid two authoritative documents.
- **Stable screenshot aliases**: Rejected for now. Full repository-relative paths are clearer and
  already disambiguate duplicate basenames.
- **EPIC-08-only scope**: Rejected because EPIC-07 explicitly includes equipment, weapon sets, party
  selector, and PvX guide display references; the final sprint keeps those notes bounded and
  deferred.
- **Temporary contact sheet**: Allowed only as an uncommitted local aid if execution needs it; no
  generated image artifact should be committed.

## Implementation

### Phase 1: BW-0701 Prior-Art Inventory And Taxonomy (~22% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0701-prior-art-inventory-and-taxonomy.md`

**Tasks:**

- [x] Create `compendium/visual-prior-art.md` with policy boundary, interpretation rules, taxonomy
      definitions, empty observation sections, and empty gap register.
- [x] Enumerate the authoritative corpus with
      `git ls-files -- 'prior-art/**/*.png' | LC_ALL=C sort`.
- [x] Confirm the planning baseline of 36 tracked PNGs and folder counts of 27, 5, 2, and 2. If
      different, record the delta and review scope before continuing.
- [x] Run a secondary local-artifact scan with `find prior-art -type f -name '*.png'` and
      `git status --short -- prior-art`; do not add ignored or untracked files to the inventory.
- [x] Verify PNG type and dimensions with local header tooling such as `sips`, `file`, or another
      already available local command. Add no dependency for this.
- [x] Add every tracked PNG exactly once in deterministic full-path order with path, folder, type,
      dimensions, controlled categories, visible-state tags, and short review note.
- [x] Preserve duplicate basenames and existing misspellings literally, including both
      `hero-selected.png` files and `display-only-build-tempalte.png`.
- [x] Open each screenshot locally enough to validate categories and visible-state tags; filename
      inference alone is not acceptable.

**Verification:**

- `git ls-files -- 'prior-art/**/*.png' | LC_ALL=C sort`
- `test "$(git ls-files -- 'prior-art/**/*.png' | wc -l | tr -d ' ')" = 36`
- Folder-count reconciliation in the compendium note
- Manual one-row-per-path and link-target review
- `git diff --exit-code -- prior-art`

**Phase Gate:** The compendium inventory has exactly one row per tracked PNG, the taxonomy is defined,
all links resolve, and no screenshot file changed.

### Phase 2: BW-0702 Skills And Attributes Visual Notes (~24% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0702-skills-and-attributes-visual-notes.md`

**Tasks:**

- [x] Review inventory rows for the full skills panel, attributes section, profession selector,
      skill bar, skills menu, skill-list rows, small grid, and large grid.
- [x] Add `VP-OBS-*` observations for typography hierarchy, color families, borders/framing,
      spacing/density, icon treatment, alignment, selected states, hover states, disabled or empty
      states, and tooltip-adjacent behavior where visible.
- [x] Separate panel-wide observations from attribute, skill-bar, profession-selector, list, grid,
      and menu observations so EPIC-08 can cite the narrowest relevant evidence.
- [x] Compare list, small-grid, and large-grid references by information density and visible
      affordance, not by hard-coded pixel dimensions.
- [x] Record missing focus, responsive/mobile, loading/error, empty-search, and inline-validation
      evidence as gap entries or implementation-owned limitations.
- [x] Draft EPIC-08-facing visual characteristics only when supported by recurring evidence. Keep
      single-image facts local to their cited surface.
- [x] Remove unsupported font names, exact color tokens, absolute measurements, and inferred
      interactions.

**Verification:**

- Manual review of all inventory rows tagged `skills-panel`, `attributes`, `profession-selector`,
  `skill-bar`, `skills-menu`, `skill-list-row`, `skill-grid-small`, or `skill-grid-large`
- Manual check that each observation has evidence, limitation, and downstream consumer
- Manual EPIC-08 scope review against `work/tickets/08-core-build-editor/EPIC.md`

**Phase Gate:** EPIC-08 core editor surfaces have concise, path-backed, implementation-neutral notes
and explicit limitations before transient UI or deferred-surface notes are folded in.

### Phase 3: BW-0703 Template Dialog, Tooltip, And Menu Notes (~20% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0703-template-dialog-tooltip-and-menu-notes.md`

**Tasks:**

- [x] Review template button/menu, load dialog, save dialog, template-code dialog, sort menu,
      icon-display menu, and load/save hover-tooltip references.
- [x] Review normal skill tooltip, elite skill tooltip, attribute tooltip, and row-plus-tooltip
      composites for signet, overcast, sacrifice, upkeep, and no-recharge cases.
- [x] Record modal framing, menu density, selection/hover treatment, field/button alignment,
      overlay relationship, tooltip border/framing, title/body/value hierarchy, cost-row treatment,
      wrapping, and icon/text alignment where visible.
- [x] Distinguish what hover screenshots prove about overlays from what their underlying cropped
      surface proves.
- [x] Add gaps for disabled, empty, focus, error, overflow, and narrow-viewport states that are not
      represented.
- [x] Keep notes presentation-focused. Import/export semantics remain owned by SPRINT-006 and are
      not redesigned here.
- [x] Run an early mechanical path check for all screenshot citations added through Phase 3.

**Verification:**

- Manual review of all inventory rows tagged `skill-tooltip`, `attribute-tooltip`,
  `template-control`, `template-menu`, `template-dialog`, or `hover-tooltip`
- Manual source-policy check that long-form in-game text is not copied
- Manual path/link review for all citations added through Phase 3

**Phase Gate:** Template, dialog, menu, hover, and tooltip sections distinguish visible facts from
missing interaction states and provide EPIC-08 usable citations.

### Phase 4: BW-0704 Equipment, Party, And Guide Reference Notes (~15% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `work/tickets/07-visual-prior-art/BW-0704-equipment-party-and-guide-reference-notes.md`

**Tasks:**

- [x] Add a clearly separated deferred section for equipment-panel, equipment-tooltip, weapon-set,
      party/hero, and PvX guide-display references.
- [x] Record factual observations about equipment panel framing, slot/icon treatment, equipment and
      weapon tooltip hierarchy, weapon-set selector presentation, party-selector density,
      party-member tooltip, and hero-selected state evidence.
- [x] Cite both `hero-selected.png` files by full path and describe only the state each crop visibly
      supports.
- [x] Map equipment and weapon evidence to EPIC-13/14, party and hero evidence to EPIC-17, and PvX
      guide structure to EPIC-18/19.
- [x] For PvX screenshots, record only structural display facts such as build-display placement,
      section hierarchy, and inline skill-link/icon treatment. Do not copy guide prose, ratings,
      recommendations, usage notes, or build content.
- [x] Record standalone rune, insignia, weapon-upgrade tooltip, and full-party-window gaps with
      owners and non-blocking impact unless execution finds an EPIC-08 blocker.

**Verification:**

- Manual review of all inventory rows tagged `equipment-panel`, `equipment-tooltip`, `weapon-set`,
  `weapon-tooltip`, `party-selector`, `party-tooltip`, `hero-selected`, or `pvx-guide-display`
- Manual downstream ownership review against EPIC-13, EPIC-14, EPIC-17, EPIC-18, and EPIC-19
- Manual PvX/community source-policy review

**Phase Gate:** Deferred references are preserved with explicit owners and bounded scope; they do not
expand EPIC-08 implementation.

### Phase 5: BW-0705 Gap Register, Compendium, And Closeout (~19% of effort)

**Files:**

- `compendium/visual-prior-art.md`
- `compendium/README.md`
- `work/tickets/07-visual-prior-art/BW-0701-prior-art-inventory-and-taxonomy.md`
- `work/tickets/07-visual-prior-art/BW-0702-skills-and-attributes-visual-notes.md`
- `work/tickets/07-visual-prior-art/BW-0703-template-dialog-tooltip-and-menu-notes.md`
- `work/tickets/07-visual-prior-art/BW-0704-equipment-party-and-guide-reference-notes.md`
- `work/tickets/07-visual-prior-art/BW-0705-gap-register-compendium-and-closeout.md`
- `work/tickets/07-visual-prior-art/EPIC.md`
- `work/sprints/SPRINT-008.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260901T192130Z/execute-SPRINT-008-result.json`

**Tasks:**

- [x] Complete the evidence-derived visual characteristics section with citations, limitations, and
      explicit non-binding language.
- [x] Finalize the gap register with stable IDs, available evidence, affected consumer, impact,
      EPIC-08 blocking status, owner, justification, and next action.
- [x] Confirm no known gap blocks EPIC-08 unless execution finds a core MVP surface with no usable
      evidence at all.
- [x] Add citation guidance: future tickets cite exact screenshot paths plus relevant compendium
      sections; screenshots remain development references and are not runtime media.
- [x] Link `compendium/visual-prior-art.md` from `compendium/README.md`.
- [x] Run final path, link, inventory, category, and source-policy audits.
- [x] Run formatting and repository verification.
- [x] Review protected paths to confirm no `prior-art/`, `src/`, `test/`, `scripts/`, `data/`,
      package, or build-configuration files changed except explicitly allowed planning/docs files.
- [x] During execution, mark BW-0701 through BW-0705, EPIC-07, SPRINT-008, and the ledger complete
      only after all phase gates and the Definition of Done pass.
- [x] Write the ticket-burn execution result manifest when implementing this sprint; do not create a
      commit unless separately requested.

**Verification:**

- `npm run format:check`
- `npm run verify`
- `git diff --exit-code -- prior-art`
- `git diff --name-status -- src test scripts data package.json package-lock.json vite.config.ts`
- Manual Markdown link/path audit from `compendium/visual-prior-art.md`
- Manual source-policy audit for screenshot and PvX/community references

**Phase Gate:** The canonical note, compendium index, gap register, source-policy posture, ticket
states, sprint state, ledger, and execution manifest agree; verification passes; protected paths are
unchanged; no commit is created.

## Files Summary

| File                                                                                    | Action                  | Purpose                                                                                             |
| --------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `compendium/visual-prior-art.md`                                                        | Create                  | Canonical inventory, evidence brief, visual characteristics, gap register, and citation protocol.   |
| `compendium/README.md`                                                                  | Modify                  | Link the visual prior-art note.                                                                     |
| `prior-art/**/*.png`                                                                    | Read only               | Development-reference evidence; no binary may be added, removed, renamed, transformed, or modified. |
| `work/tickets/07-visual-prior-art/BW-0701-prior-art-inventory-and-taxonomy.md`          | Modify during execution | Record inventory/taxonomy completion and evidence.                                                  |
| `work/tickets/07-visual-prior-art/BW-0702-skills-and-attributes-visual-notes.md`        | Modify during execution | Record EPIC-08 core visual-note completion.                                                         |
| `work/tickets/07-visual-prior-art/BW-0703-template-dialog-tooltip-and-menu-notes.md`    | Modify during execution | Record transient UI and tooltip-note completion.                                                    |
| `work/tickets/07-visual-prior-art/BW-0704-equipment-party-and-guide-reference-notes.md` | Modify during execution | Record deferred surface-note completion and ownership.                                              |
| `work/tickets/07-visual-prior-art/BW-0705-gap-register-compendium-and-closeout.md`      | Modify during execution | Record synthesis, gap, documentation, and closeout completion.                                      |
| `work/tickets/07-visual-prior-art/EPIC.md`                                              | Modify                  | Track EPIC-07 ticket list, planned sprint, and completion state.                                    |
| `work/sprints/SPRINT-008.md`                                                            | Create/modify           | Sprint planning and execution record.                                                               |
| `work/sprints/ledger.tsv`                                                               | Modify                  | Sprint lifecycle tracking.                                                                          |
| `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json`               | Create                  | Required ticket-burn planning result manifest.                                                      |
| `work/runs/ticket-burn/BACKLOG/20260901T192130Z/execute-SPRINT-008-result.json`         | Create during execution | Required ticket-burn execution result manifest.                                                     |

## Definition of Done

### Visual Brief

- [x] `compendium/visual-prior-art.md` is the only authoritative committed prior-art inventory and
      visual reference note.
- [x] `compendium/README.md` links to `compendium/visual-prior-art.md`.
- [x] The tracked screenshot corpus is enumerated from Git, reconciled to the sprint-start baseline,
      and any count delta from the planning expectation of 36 is explicitly reviewed.
- [x] Every tracked PNG appears exactly once in the inventory with resolving full relative path,
      source folder, verified PNG type, dimensions, controlled categories, visible-state tags, and
      short review note where useful.
- [x] Inventory rows are in deterministic full-path order; duplicate basenames and existing
      misspellings are preserved literally.
- [x] Screenshots are visually reviewed; filename inference alone is not accepted as evidence.
- [x] Core notes cover skills panel, attributes, profession selector, skill bar, skills menu,
      skill-list rows, small grid, and large grid.
- [x] Transient notes cover template controls, template menu, load/save/code dialogs, hover overlays,
      sort/icon menus, attribute tooltip, normal/elite skill tooltips, and represented cost-special
      row/tooltip cases.
- [x] Deferred notes cover equipment panel, equipment/item/weapon tooltip hierarchy, weapon sets,
      party selector, party tooltip, both hero-selected references, and PvX guide-display references.
- [x] Every observation has a stable ID, evidence path, visible facts, uncertainty or limitation, and
      downstream consumer.
- [x] Evidence-derived visual characteristics are screenshot-cited, explicitly non-binding, and do
      not convert dimensions or static states into implementation requirements.
- [x] The gap register gives every gap an ID, affected surface, available evidence, impact, EPIC-08
      blocking status, owner, justification, and next action.
- [x] Standalone rune, insignia, weapon-upgrade item tooltip, and full party-window gaps are explicit
      unless execution captures a superseding state inside the existing corpus.
- [x] Keyboard focus, accessibility, responsive/mobile layout, loading/error behavior, and inline
      validation presentation are marked as EPIC-08 implementation-owned when not directly evidenced.

### Policy And Scope

- [x] Screenshots are linked as local development-reference evidence only and are not embedded with
      Markdown image syntax, copied into docs, base64-encoded, moved, or copied into runtime paths.
- [x] Notes contain no copied long-form in-game descriptions, PvX guide prose, ratings,
      recommendations, usage notes, or build content.
- [x] PvX observations remain structural and path-based.
- [x] No live wiki, PvX/Fandom, CDN, browser automation, OCR service, or remote media request is
      used.
- [x] No screenshot is added, removed, renamed, cropped, resized, optimized, transformed, or otherwise
      modified.
- [x] No application implementation code, generated data, test fixture, package metadata, or build
      configuration is changed.

### Records And Verification

- [x] BW-0701 through BW-0705 record completion evidence and are marked done only after their phase
      gates pass.
- [x] EPIC-07 is marked done only after the full visual brief, gap register, policy audit, and
      verification pass.
- [x] `work/sprints/SPRINT-008.md`, `work/sprints/ledger.tsv`, ticket files, epic file, and
      ticket-burn manifests agree on source target, source epic, tickets, status, and dates.
- [x] All local Markdown links and screenshot citations resolve.
- [x] Protected-path diff review confirms sprint changes are limited to approved documentation,
      ticket, sprint, ledger, and run-manifest files.
- [x] `npm run format:check` passes.
- [x] `npm run verify` passes. If a runner or reviewer treats a failure as unrelated, the exact
      command, failing output, reason, owner, and sprint-scoped clean-diff evidence must be recorded;
      otherwise the sprint remains failed or blocked.
- [x] No commit is created unless separately requested.

## Risks & Mitigations

| Risk                                                                        | Likelihood | Impact | Mitigation                                                                                                                     |
| --------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| On-disk scans include untracked local files.                                | Medium     | High   | Use Git-tracked enumeration as the authoritative corpus and run filesystem scans only as secondary diagnostics.                |
| Inventory misses or duplicates screenshots.                                 | Medium     | High   | Require deterministic full-path order, one row per tracked PNG, folder-count reconciliation, and link review.                  |
| Duplicate basenames or typoed filenames break citations.                    | High       | Medium | Use full paths as identity and preserve all filenames literally.                                                               |
| A corrupt or mislabeled PNG blocks dimension/type extraction.               | Low        | Medium | Record the exact path and block Phase 1 for source review rather than guessing metadata.                                       |
| Static screenshots are mistaken for complete interaction specs.             | High       | High   | Record limitations and gaps; do not infer focus, keyboard, responsive, loading, error, or dynamic behavior.                    |
| Visual notes drift into strict clone requirements.                          | Medium     | High   | Separate visible facts, evidence-derived characteristics, and later product decisions; prohibit exact pixel/CSS prescriptions. |
| Screenshot dimensions become hard-coded layout geometry.                    | Medium     | High   | Keep dimensions as inventory metadata only and state this in the citation protocol.                                            |
| PvX or in-game text leaks into copied documentation or runtime content.     | Medium     | High   | Use structural paraphrase, short region labels only where necessary, and a dedicated source-policy audit.                      |
| One compendium note becomes large.                                          | Medium     | Medium | Use stable sections, observation IDs, and tables; defer split docs until a later ticket has a real maintenance need.           |
| Future-surface notes dilute EPIC-08 focus.                                  | Medium     | Medium | Keep deferred notes in a separate section with owning epics and no implementation requirements.                                |
| Repository verification fails for unrelated existing work.                  | Low        | Medium | Record the exact failure and sprint-scoped clean diff; do not mark complete without a deliberate runner/reviewer decision.     |
| Closeout bookkeeping succeeds before the visual brief is actually complete. | Low        | High   | Gate ticket, epic, sprint, ledger, and manifest updates on phase gates and final Definition of Done review.                    |

## Security Considerations

- Treat screenshot files, filenames, dimensions, visible text, and PvX references as untrusted local
  development-reference inputs.
- Do not execute embedded content, follow metadata links, run OCR through a remote service, fetch
  live source pages, or publish private filesystem metadata.
- Quote paths in shell operations and use repository-relative paths in documentation.
- Do not publish absolute machine paths, user names, timestamps from image metadata, credentials, or
  unrelated embedded metadata.
- Use normal Markdown links only. Do not inline images, HTML image tags, data URLs, thumbnails, or
  generated contact sheets.
- Keep all verification local, deterministic, credential-free, and network-free.
- If a screenshot appears suspicious, corrupt, or policy-sensitive, record the issue and route it to
  a separate asset/source review instead of modifying or deleting it in this sprint.

## Dependencies

- Completed `SPRINT-001` / EPIC-00 for repository layout, compendium conventions, ticket-burn
  records, and canonical verification.
- Completed `SPRINT-002` / EPIC-01 for source-policy handling of screenshots, prior-art images,
  PvX/community references, copied text, and runtime media restrictions.
- Completed `SPRINT-005` / EPIC-04 for renderer-neutral skill facts that later tooltip UI can combine
  with visual references.
- Completed `SPRINT-006` / EPIC-05 for template import/export semantics; this sprint documents
  controls only.
- Completed `SPRINT-007` / EPIC-06 for validation result semantics; this sprint documents
  validation-adjacent presentation evidence only.
- Existing tracked screenshot corpus under `prior-art/`.
- Immediate downstream consumer: EPIC-08 Core Build Editor.
- Deferred downstream consumers: EPIC-13 Armor and Equipment, EPIC-14 Equipment Editor, EPIC-17
  Party and Hero Builder, EPIC-18 Community Build Knowledge, and EPIC-19 Guide Authoring.
- No new npm, Python, image-processing, OCR, browser, or network dependency is required.

## Open Questions

No open question blocks execution. Defaults for this sprint are:

1. Use `compendium/visual-prior-art.md` as the only authoritative committed prior-art note.
2. Treat 36 tracked PNGs as the planning baseline; execution must review any Git-tracked corpus
   delta before observations begin.
3. Use full repository-relative paths as screenshot identity, not invented aliases.
4. Keep observations factual and screenshot-cited; keep evidence-derived visual characteristics
   non-binding.
5. Treat known standalone rune, insignia, weapon-upgrade, and full-party-window gaps as non-blocking
   later captures unless execution discovers EPIC-08 has no usable evidence for a required MVP
   surface.
6. Keep PvX screenshots as structural visual references only; no copied community prose or runtime
   import decision is part of this sprint.
7. Do not create a `prior-art/README.md`, generated manifest, or contact sheet as a committed
   artifact in this sprint.
