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

This sprint turns the 36 tracked PNG screenshots under `prior-art/` into one durable, factual visual reference brief for EPIC-08 and later UI work. It inventories the corpus, records evidence-backed observations for the core build editor, documents template controls and tooltips, separates later equipment/party/guide references, and closes with a bounded gap register and citation protocol.

The canonical artifact is `compendium/visual-prior-art.md`. It contains the inventory, observation sections, cross-surface synthesis, downstream ownership map, gap register, and citation guidance in one place. This sprint does not add a parallel `prior-art/README.md` or machine-readable manifest: for a static 36-image corpus, duplicate indexes would add synchronization risk without a current consumer. If the corpus later becomes large or programmatically consumed, a separate explicit ticket may introduce a generated index with the compendium note remaining the human-facing entry point.

The aesthetic target is **in-game-informed, not a screenshot clone**. The brief may promote recurring information hierarchy, density, framing, state, and feedback patterns into general design targets. It must not turn captured dimensions, sampled pixels, publisher-owned artwork, copied UI prose, or one-off quirks into runtime requirements. EPIC-08 remains responsible for an original, accessible, responsive implementation using the repository's React/Vite application boundary.

Every claim follows an evidence rule:

- inventory facts identify one exact repository-relative PNG path, source folder, PNG type, dimensions, categories, and visible-state tags;
- visual observations cite one or more exact screenshot paths and say only what is visible;
- absent, cropped, conflicting, or ambiguous evidence is labeled instead of inferred;
- general aesthetic targets require recurrence across multiple screenshots or remain scoped to the cited surface; and
- dimensions describe the source image only and never prescribe component, breakpoint, or viewport sizes.

The sprint is documentation-only. It does not modify image binaries, application or domain code, tests, generated data, source snapshots, data tooling, package dependencies, or build configuration. The screenshots remain development references and are not embedded, copied, transformed, or moved into runtime or release paths.

## Use Cases

1. **Find the right evidence quickly**: An EPIC-08 implementer can locate every relevant profession, attribute, skill-bar, skill-browser, tooltip, template, and menu screenshot without rediscovering the corpus.
2. **Reconcile the complete corpus**: A reviewer can prove that all 36 tracked PNGs appear exactly once in a lexically ordered inventory and that ignored local files such as `.DS_Store` are not treated as source material.
3. **Translate prior art without cloning it**: A designer can distinguish reusable hierarchy, density, borders, color families, icon treatment, and state cues from screenshot-specific facts and source-owned expression.
4. **Design the core editor consistently**: EPIC-08 can cite evidence for the profession selector, attribute editor, skill bar, search/list/grid surfaces, skill tooltips, template controls, and validation-adjacent presentation while retaining responsive and accessibility freedom.
5. **Handle transient UI deliberately**: Later tasks can compare modal framing, hover behavior, menu density, selected states, tooltip placement relationships, and cost-special cases without treating cropped screenshots as complete interaction specifications.
6. **Preserve later-epic context**: Equipment, weapon-set, party/hero, and PvX-style guide work has factual reference notes clearly separated from the MVP editor surface.
7. **Identify what the corpus cannot answer**: Maintainers can see whether a gap is an EPIC-08 design responsibility, a useful later capture, an ambiguity, or an actual blocker.
8. **Respect source policy**: Reviewers can confirm that paths and structural observations are used for development only and that no screenshots, community guide prose, or long-form in-game text enter runtime artifacts.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Corpus | The 36 currently tracked PNGs: 27 skills/attributes, 5 equipment-panel, 2 weapon-set, and 2 PvX references. | `.DS_Store`, untracked local files, newly sourced captures, remote images, image renames, or asset cleanup. |
| Inventory | Repository-relative path, source folder, file type, source dimensions, controlled categories, visible-state tags, lexical ordering, and folder/count reconciliation. | EXIF/private host metadata, OCR dumps, hashes as runtime identity, image duplication, or a generated runtime catalog. |
| Observations | Factual notes about typography hierarchy, color families, borders, spacing relationships, density, icons, selected/hover/disabled/empty states, dialogs, menus, and tooltip behavior where visible. | Exact CSS values, font identification without proof, sampled color tokens, invented states, interaction logic not shown, or React component design. |
| Synthesis | Recurring cross-screenshot patterns, bounded surface-specific targets, evidence limitations, and downstream ownership. | A strict visual clone, design-system implementation, production tokens, responsive breakpoints, accessibility acceptance design, or final product branding. |
| Gaps | Coverage status, affected consumer, impact, owner, and next action for missing or weak references. | Capturing or adding screenshots, blocking the MVP for later equipment/party gaps, or silently treating missing evidence as approval. |
| Source policy | Development-reference-only links, short region labels where necessary, path-based PvX structural observations, and no runtime-media implication. | Copied game descriptions, PvX/community prose, ratings, recommendations, guide content, screenshot redistribution, or attribution approval for runtime use. |
| Verification | Local image/path review, deterministic count reconciliation, Markdown link review, scoped binary diff review, formatting, and canonical repository verification. | Network access, OCR services, image conversion, visual-regression baselines, new test infrastructure, or application screenshots. |

### Canonical Documentation Shape

`compendium/visual-prior-art.md` is the sole durable index and uses this order:

1. purpose, source-policy boundary, and interpretation rules;
2. corpus summary and complete screenshot inventory;
3. core editor observations for skills, attributes, profession selection, skill bar, and browsing;
4. template dialog, menu, hover, and tooltip observations;
5. deferred equipment, weapon-set, party/hero, and guide observations;
6. cross-surface aesthetic targets and explicit non-goals;
7. gap register and downstream ownership; and
8. citation and maintenance protocol.

The inventory and narrative live together so there is one review surface. The inventory is the coverage ledger; the narrative is the interpretation layer. Narrative sections link back to exact inventory paths rather than introducing aliases or synthetic screenshot IDs. Full paths are the stable identity because two folders contain `hero-selected.png`, while `display-only-build-tempalte.png`, `sorty-menu-options.png`, and other existing spellings must remain literal and must not be silently corrected.

The compendium index links to the note, but the root README does not need another detailed summary. Future ticket documents should cite the repository-relative `prior-art/...` path and the relevant compendium section. They should not depend on generated Markdown anchors as the only identity.

### Inventory Contract

The inventory has exactly one row per tracked PNG, sorted by full path using bytewise/`C` lexical order. A screenshot that informs several concerns stays in one row and carries multiple categories; it is never duplicated to make category sections look complete.

| Field | Rule |
| --- | --- |
| Screenshot | A normal Markdown link from `compendium/visual-prior-art.md` to `../prior-art/...`; use the full path as link text or adjacent literal text. Do not use inline image syntax. |
| Source folder | One of the four existing folders, recorded without inferring external provenance that the repository does not establish. |
| Type | `PNG`, verified from file data rather than extension alone. |
| Dimensions | `width x height px` from the PNG header; factual source metadata, not a layout recommendation. |
| Categories | One or more controlled UI-surface values from the vocabulary below. |
| Evidence tags | Only visibly represented forms or states such as `panel`, `row`, `grid`, `selected`, `hover`, `modal`, `tooltip`, `empty`, or `disabled`; absence is not inferred from a filename. |
| Review note | Optional and short; use for crop/overlap/near-duplicate limitations, not aesthetic interpretation. |

Controlled categories are intentionally based on downstream surfaces rather than filenames:

- `skills-panel`
- `attributes`
- `skill-bar`
- `profession-selector`
- `skill-browser-list`
- `skill-browser-grid`
- `skill-tooltip`
- `attribute-tooltip`
- `template-controls`
- `template-dialogs`
- `menus`
- `equipment-panel`
- `equipment-tooltip`
- `weapon-sets`
- `party-selector`
- `hero-selected`
- `pvx-guide-display`

Categories may be extended only when an existing screenshot cannot be described without losing a material downstream distinction. Synonyms are not added merely to mirror filenames.

The expected baseline is:

| Folder | Tracked PNGs | Primary downstream use |
| --- | ---: | --- |
| `prior-art/gw-skills-and-attributes-refs/` | 27 | EPIC-08 core editor plus party/hero cues |
| `prior-art/gw1-equipment-panel/` | 5 | EPIC-13 and EPIC-14 equipment display/editor |
| `prior-art/gw1-weapon-sets/` | 2 | EPIC-14 weapon-set editor |
| `prior-art/gwpvx/` | 2 | EPIC-18 community knowledge and EPIC-19 guide authoring |
| **Total** | **36** | Complete current corpus |

If execution finds a different tracked count, Phase 1 stops interpretation work long enough to identify the delta. Pre-existing newly tracked images are not silently omitted; images are not added by this sprint; and the expected counts, scope, and gap register are amended together before review continues.

### Evidence And Synthesis Contract

Each observation section uses a compact table with these columns:

| Aspect | Factual observation | Evidence | Coverage or limitation |
| --- | --- | --- | --- |
| A required visual aspect | A concise description of visible relationships or treatment | One or more exact linked screenshot paths | `confirmed`, `partial`, `ambiguous`, or `not represented`, with a short reason |

Required aspects are typography hierarchy, color families, borders/framing, spacing and density, icon treatment, control alignment, selected state, hover state, disabled state, empty state, and tooltip or overlay behavior where relevant. `not represented` is a valid and necessary finding; a reviewer must not manufacture a note to fill the matrix.

The document keeps three levels distinct:

1. **Inventory fact**: metadata about one file.
2. **Surface observation**: what one or more cited screenshots visibly show.
3. **Aesthetic target**: a recurring pattern that later UI work may reinterpret while meeting Build Wars requirements.

An aesthetic target normally needs evidence from at least two screenshots or two distinct states. A useful single-source pattern remains a surface observation. The synthesis names counter-evidence and coverage limits so later phases do not mistake absence for consistency. Exact screenshot dimensions, absolute tooltip coordinates, and apparent pixel measurements never cross into target requirements.

The sprint does not use the screenshots to resolve accessibility, keyboard focus, responsive layout, reduced motion, loading/error state, or validation-message design. Those are explicit EPIC-08 implementation responsibilities governed by product and web-platform requirements, not missing facts to invent from legacy game captures.

### Cross-Phase Consumer Map

| Reference area | Immediate or future owner | Output boundary |
| --- | --- | --- |
| Profession selector, attributes, skill bar, list/grid browsing, skill display, template controls | EPIC-08 Core Build Editor | Concrete citations and reusable visual targets; no component tree, CSS values, or hard-coded dimensions. |
| Inline validation presentation | EPIC-08 Core Build Editor using SPRINT-007 rule-engine output | Record adjacent hierarchy/state cues and the lack of direct validation screenshots; do not invent severity styling from prior art. |
| Armor/equipment layout and item tooltip hierarchy | EPIC-13 Armor and Equipment; EPIC-14 Equipment Editor | Deferred factual notes and named standalone rune/insignia/upgrade gaps; no equipment schema or editor work. |
| Weapon-set selection and tooltip hierarchy | EPIC-14 Equipment Editor | Deferred visual references; no weapon legality or interaction model. |
| Party selector and hero-selected states | EPIC-17 Party and Hero Builder | Partial state/density evidence plus full-party-window gap; no party model or hero asset decision. |
| PvX build display and inline skill-link structure | EPIC-18 Community Build Knowledge; EPIC-19 Guide Authoring | Layout-level path evidence only; no guide prose, ratings, recommendations, or runtime import decision. |

Core-editor notes and deferred notes are separate top-level sections. Cross-surface synthesis may identify a shared pattern, but it must retain consumer ownership and may not pull EPIC-13/14/17/18/19 implementation into EPIC-08.

### Gap Register Contract

Each gap records:

- the missing or weakly represented state/surface;
- the evidence that is available now;
- the affected epic or consumer;
- impact as `blocker`, `non-blocking implementation-owned`, or `non-blocking later capture`;
- why the impact classification is justified; and
- a bounded next action or owning future ticket.

Known later-capture gaps include standalone rune, insignia, and weapon-upgrade item tooltips plus a full party-window reference. Known EPIC-08 implementation-owned gaps include keyboard focus, responsive/mobile behavior, accessibility states, loading/error presentation, and dedicated inline validation examples. These do not block the MVP because EPIC-08 must design them for the web app rather than copy legacy behavior. Any newly discovered gap is assessed against an explicit EPIC-08 use case before it is called a blocker.

## Implementation

### Phase 1: BW-0701 Corpus Baseline, Inventory, And Taxonomy (~22% of effort)

**Goal:** Establish a complete, deterministic evidence ledger before any interpretation depends on an incomplete or duplicated corpus view.

**Tasks:**

- [ ] Create `compendium/visual-prior-art.md` with the policy boundary, interpretation rules, inventory schema, controlled category vocabulary, and empty downstream sections defined in this sprint.
- [ ] Enumerate tracked PNGs with `git ls-files -- 'prior-art/**/*.png'` in `LC_ALL=C` lexical order. Reconcile the expected total of 36 and folder counts of 27, 5, 2, and 2 before writing notes.
- [ ] Inspect file data locally and record PNG type and header dimensions. Do not use filename extensions alone and do not read or publish unrelated metadata.
- [ ] Add every tracked PNG exactly once with a full relative path link, source folder, type, dimensions, one or more controlled categories, visible-state tags, and only necessary crop or overlap notes.
- [ ] Handle the two `hero-selected.png` files by full path, retain all misspelled filenames literally, and exclude the ignored `.DS_Store` without deleting it.
- [ ] Open every screenshot locally at a readable scale to validate its categories and visible-state tags. Do not use filename-only classification as the final review.
- [ ] Capture a scoped before/after review with `git diff -- prior-art` and `git status --short -- prior-art`; the sprint must not add, remove, rename, or modify an image.

**Verification:**

- `git ls-files -- 'prior-art/**/*.png' | LC_ALL=C sort`
- `test "$(git ls-files -- 'prior-art/**/*.png' | wc -l | tr -d ' ')" = 36`
- `git status --short -- prior-art`
- Manual inventory row-count, folder-count, full-path, link-target, type, dimension, and category reconciliation

**Phase Gate:** All 36 tracked PNGs have one and only one valid inventory row, all four folder totals reconcile, every link resolves, edge-case filenames are preserved, and no prior-art binary changed.

### Phase 2: BW-0702 Core Skills And Attributes Reference Brief (~24% of effort)

**Goal:** Extract the factual visual evidence EPIC-08 needs for its persistent editor surfaces while preserving implementation freedom.

**Tasks:**

- [ ] Review the full skills-and-attributes panel, attributes section, profession selector, skill bar, skills menu, row/list examples, small grid, and large grid against the Phase 1 inventory.
- [ ] Record typography hierarchy, color families, borders/framing, spacing relationships, control density, icon treatment, alignment, and visible selected/hover/disabled/empty behavior for each applicable surface.
- [ ] Separate panel-wide observations from attribute, skill-bar, profession-selector, list, and grid observations so a later consumer can cite the narrowest relevant evidence.
- [ ] Compare list, small-grid, and large-grid views by information density and visible affordance, not by hard-coded image width, row height, column count, or crop dimensions.
- [ ] Record missing or ambiguous core states as provisional gap entries, especially keyboard focus, responsive layout, loading/error behavior, empty search, and validation presentation.
- [ ] Draft EPIC-08-specific target statements only for recurring evidence. Keep single-image facts local and keep accessibility/responsive behavior explicitly implementation-owned.
- [ ] Review all prose for traceable paths and remove unsupported font names, exact color claims, absolute measurements, or inferred interactions.

**Verification:**

- Manual cross-check against every inventory row categorized as `skills-panel`, `attributes`, `skill-bar`, `profession-selector`, `skill-browser-list`, or `skill-browser-grid`
- Manual aspect-matrix review: every required aspect is cited or explicitly marked not represented
- Manual EPIC-08 scope review against `work/tickets/08-core-build-editor/EPIC.md`

**Phase Gate:** EPIC-08's persistent editor surfaces have concise path-backed notes, all important coverage limits are visible, and no note prescribes React structure, fixed screenshot geometry, or uncited aesthetic facts.

### Phase 3: BW-0703 Template, Menu, Hover, And Tooltip Reference Brief (~20% of effort)

**Goal:** Document transient UI and information hierarchy without treating cropped states as a full interaction specification or copying source text.

**Tasks:**

- [ ] Review the template button/menu, load and save dialogs, dialog hover-tooltip variants, template-code dialog, sort menu, and icon-display menu as distinct controls and states.
- [ ] Record visible modal framing, menu density, selection/hover treatment, field/button alignment, overlay relationship, and icon/text alignment. Describe placement relative to an anchor or neighboring region rather than absolute screen coordinates.
- [ ] Review the normal and elite skill tooltips, attribute tooltip, and row-plus-tooltip examples for no-recharge, overcast, sacrifice, signet, and upkeep cases.
- [ ] Record tooltip title/body/value hierarchy, border/framing, icon relationship, cost-row treatment, wrapping, and visible state differences without transcribing full descriptions or asserting dynamic behavior the screenshots do not prove.
- [ ] Distinguish what a hover-variant screenshot proves about the overlay from what its underlying dialog/list crop proves. Mark occluded or missing states rather than merging assumptions.
- [ ] Add provisional gap entries for required disabled, empty, focus, error, overflow, and narrow-viewport states that are not represented.
- [ ] Confirm template notes remain presentation references only; import/export semantics continue to come from SPRINT-006 and are not redesigned here.

**Verification:**

- Manual cross-check against every inventory row categorized as `skill-tooltip`, `attribute-tooltip`, `template-controls`, `template-dialogs`, or `menus`
- Manual check that each tooltip special case and each dialog/menu state has exact path evidence
- Manual source-policy check that only short identifying labels, not long-form in-game text, appear

**Phase Gate:** Template, dialog, menu, hover, and tooltip sections distinguish visible facts from missing interaction states, cover every relevant inventory row, and give EPIC-08 usable hierarchy references without copying prose or changing compatibility scope.

### Phase 4: BW-0704 Deferred Equipment, Party, Hero, And Guide Notes (~15% of effort)

**Goal:** Preserve useful non-MVP evidence for its owning later epics without expanding the core editor sprint or weakening source policy.

**Tasks:**

- [ ] Review equipment-panel layout, equipment and weapon tooltip hierarchy, hero-selected state, weapon-set presentation, party selector/tooltip density, and PvX-style guide display against the inventory.
- [ ] Keep equipment-panel, equipment-tooltip, weapon-set, party/hero, and guide observations in a top-level deferred section separate from EPIC-08 guidance.
- [ ] Cite both `hero-selected.png` files by their full distinct paths and describe only the state each crop visibly supports.
- [ ] Map equipment and weapon evidence to EPIC-13/14; party and hero evidence to EPIC-17; and guide structure to EPIC-18/19. Do not introduce their schemas, interactions, or acceptance criteria.
- [ ] For PvX screenshots, record only structural layout facts such as build-display placement, section hierarchy, and inline skill-link/icon treatment. Do not transcribe guide prose, ratings, recommendations, build content, or source-owned expressive organization as runtime copy.
- [ ] Record standalone rune, insignia, weapon-upgrade tooltip, and full party-window gaps with named future owners and non-blocking impact for EPIC-08.
- [ ] Check whether any apparent general pattern conflicts with the core-editor evidence and retain the difference instead of forcing false uniformity.

**Verification:**

- Manual cross-check against every inventory row categorized as `equipment-panel`, `equipment-tooltip`, `weapon-sets`, `party-selector`, `hero-selected`, or `pvx-guide-display`
- Manual downstream ownership review against EPIC-13, EPIC-14, EPIC-17, EPIC-18, and EPIC-19
- Manual PvX/community source-policy review

**Phase Gate:** Every non-MVP screenshot has a factual note or an explicit limited-use explanation, later ownership is clear, known capture gaps are bounded, and no community/game prose or future implementation scope has entered the core brief.

### Phase 5: BW-0705 Synthesis, Gap Register, Documentation, And Closeout (~19% of effort)

**Goal:** Convert the reviewed evidence into one maintainable handoff, prove policy and corpus integrity, and close all planning records consistently.

**Tasks:**

- [ ] Complete the cross-surface aesthetic target by promoting only recurring evidence. For every target, retain citations, scope, counter-evidence or limitations, and an explicit reminder that implementation must be original, accessible, and responsive.
- [ ] Finalize the gap register with available evidence, consumer, impact classification, justification, next action, and owner. Explicitly distinguish EPIC-08 implementation-owned web states from later screenshot-capture opportunities.
- [ ] Confirm whether any gap blocks EPIC-08. The current default is that none do: core visual coverage is sufficient, while validation/accessibility/responsiveness require original design and equipment/party gaps belong to later epics.
- [ ] Add the citation and maintenance protocol: cite exact repository paths plus the narrowest compendium section, use normal links rather than embedded images, preserve filenames, update the inventory and notes together, and do not infer runtime-media permission.
- [ ] Link `compendium/visual-prior-art.md` from `compendium/README.md` under source/QA or an adjacent visual-reference heading without duplicating the brief.
- [ ] Audit all 36 inventory paths, every observation citation, folder totals, controlled categories, required aspects, deferred ownership, and gap entries. Confirm the note contains no long-form game or PvX prose.
- [ ] Run formatting and canonical repository verification. Review scoped diffs to confirm no `prior-art/`, `src/`, `test/`, `scripts/`, `data/`, package, or build-configuration file was changed.
- [ ] During execution, mark BW-0701 through BW-0705, EPIC-07, SPRINT-008, and the ledger complete only after all phase gates pass. Ensure the outer ticket-burn run writes `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json`; do not create a commit.

**Verification:**

- `npm run format:check`
- `npm run verify`
- `git diff --exit-code -- prior-art src test scripts data package.json package-lock.json vite.config.ts`
- `git status --short`
- Manual Markdown link resolution, 36-row reconciliation, source-policy review, and Definition of Done review

**Phase Gate:** The compendium brief, its index link, the source corpus, gap classifications, downstream ownership, ticket states, sprint state, ledger, and result manifest agree; verification passes; only planned documentation and planning records changed; and no commit was created.

## Files Summary

| File | Action | Purpose |
| --- | --- | --- |
| `compendium/visual-prior-art.md` | Create | Provide the single canonical inventory, evidence brief, aesthetic synthesis, consumer map, gap register, and citation protocol. |
| `compendium/README.md` | Modify | Link the durable visual-prior-art note without duplicating its contents. |
| `prior-art/**/*.png` | Read only | Supply development-reference evidence; no binary is added, removed, renamed, transformed, or modified. |
| `work/tickets/07-visual-prior-art/BW-0701-prior-art-inventory-and-taxonomy.md` | Modify during execution | Record inventory/taxonomy completion and verification evidence. |
| `work/tickets/07-visual-prior-art/BW-0702-skills-and-attributes-visual-notes.md` | Modify during execution | Record core editor visual-note completion and evidence. |
| `work/tickets/07-visual-prior-art/BW-0703-template-dialog-tooltip-and-menu-notes.md` | Modify during execution | Record transient UI and tooltip-note completion and evidence. |
| `work/tickets/07-visual-prior-art/BW-0704-equipment-party-and-guide-reference-notes.md` | Modify during execution | Record deferred surface-note completion and ownership. |
| `work/tickets/07-visual-prior-art/BW-0705-gap-register-compendium-and-closeout.md` | Modify during execution | Record synthesis, gap, documentation, and closeout completion. |
| `work/tickets/07-visual-prior-art/EPIC.md` | Modify during execution | Track EPIC-07 state only after all five tickets pass. |
| `work/sprints/SPRINT-008.md` | Create/modify during execution | Track sprint state and checked Definition of Done. |
| `work/sprints/ledger.tsv` | Modify during execution | Record the SPRINT-008 lifecycle consistently with prior sprints. |
| `work/runs/ticket-burn/BACKLOG/20260901T192130Z/plan-EPIC-07-result.json` | Write by outer run | Record the non-interactive ticket-burn planning outcome. |

No `prior-art/README.md`, screenshot manifest, source record, application file, domain contract, test fixture, generated artifact, QA artifact, snapshot, package dependency, or build configuration is added or changed by this sprint.

## Definition of Done

### Corpus And Inventory

- [ ] The current tracked corpus reconciles to exactly 36 PNGs: 27 under `gw-skills-and-attributes-refs`, 5 under `gw1-equipment-panel`, 2 under `gw1-weapon-sets`, and 2 under `gwpvx`.
- [ ] Every tracked PNG appears exactly once in the inventory with a resolving full relative path, source folder, verified PNG type, width and height, at least one controlled category, and factual visible-state tags.
- [ ] Inventory rows use deterministic full-path lexical order; multi-category screenshots remain single rows.
- [ ] Both `hero-selected.png` files remain distinguishable by full path, existing misspellings are preserved, and `.DS_Store` is excluded without being moved or deleted.
- [ ] Every screenshot is visually reviewed; filename inference alone is not accepted as evidence.
- [ ] No screenshot is added, removed, renamed, cropped, resized, optimized, transformed, embedded, copied to another directory, or otherwise modified.

### Observations And Aesthetic Target

- [ ] Core notes separately cover the full skills panel, attributes, skill bar, profession selector, skill menu/list, small grid, and large grid.
- [ ] Transient notes cover template controls, template menu, load/save/code dialogs, dialog hover overlays, sort/icon menus, attribute tooltip, normal/elite skill tooltips, and each represented cost-special row/tooltip case.
- [ ] Deferred notes cover equipment panel, equipment/item/weapon tooltip hierarchy, weapon sets, party selector/tooltip, both hero-selected references, and both PvX guide-display references.
- [ ] Typography, color families, borders, spacing/density, icon treatment, alignment, selected, hover, disabled, empty, and tooltip/overlay behavior are cited where visible or explicitly labeled partial, ambiguous, or not represented.
- [ ] Every observation has one or more exact screenshot-path citations and contains no unsupported font identification, precise color token, pixel measurement, interaction claim, or aesthetic generalization.
- [ ] Cross-surface targets are supported by recurring evidence, name limitations/counter-evidence, and preserve original accessible/responsive implementation freedom.
- [ ] Screenshot dimensions remain inventory metadata only and do not become component widths, viewport assumptions, breakpoint values, or acceptance thresholds.

### Downstream Scope And Gaps

- [ ] EPIC-08 can cite concrete notes for profession, attribute, skill-bar, skill search/list/grid, tooltip, template-control, and validation-adjacent presentation work.
- [ ] EPIC-13/14, EPIC-17, and EPIC-18/19 references are clearly separated and do not expand SPRINT-008 into equipment, party, community-data, or guide implementation.
- [ ] The gap register records evidence, consumer, impact, justification, owner, and next action for every missing or weak state identified during review.
- [ ] Standalone rune, insignia, weapon-upgrade item tooltips and a full party-window reference are explicit non-blocking later-capture gaps.
- [ ] Keyboard focus, accessibility, responsive/mobile layout, loading/error behavior, and inline validation presentation are explicit EPIC-08 design responsibilities, not invented prior-art observations.
- [ ] The document states whether any newly discovered gap blocks EPIC-08; no gap is left with an implicit impact or owner.

### Source Policy And Security

- [ ] The compendium note identifies all screenshots as development references and does not imply runtime, generated-data, test-fixture, public-release, redistribution, or attribution approval.
- [ ] Screenshots are linked as local evidence but are not inlined with Markdown image syntax, base64-encoded, copied into the compendium, or moved into `src`, `public`, `data/generated`, or tests.
- [ ] Notes contain no copied long-form in-game descriptions, PvX guide prose, ratings text, usage notes, recommendations, or build content; short labels appear only when needed to identify a region or state.
- [ ] PvX observations stay structural and path-based, and no live community page or remote media is fetched during review or verification.
- [ ] Inventory metadata contains repository-relative facts only; no absolute workstation path, private filesystem metadata, credentials, or unrelated embedded metadata is published.

### Documentation, Verification, And Closeout

- [ ] `compendium/visual-prior-art.md` is the sole canonical inventory/brief, and `compendium/README.md` links to it.
- [ ] The citation protocol requires exact repository paths and relevant compendium sections, preserves filenames, and explains how to update inventory, notes, and gaps together.
- [ ] All local Markdown links resolve; inventory totals, categories, observation coverage, and gap ownership reconcile in a final manual audit.
- [ ] `npm run format:check` and `npm run verify` pass without network access or new dependencies.
- [ ] Scoped diff review confirms no prior-art binary, application/domain code, test, data tool, generated data, QA, snapshot, package, or build-configuration change.
- [ ] BW-0701 through BW-0705, EPIC-07, SPRINT-008, and the ledger are marked complete only after all phase gates and the full Definition of Done pass.
- [ ] The ticket-burn result manifest is written at the exact required path and records the planning outcome consistently; no commit is created.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Factual notes drift into a strict clone specification | High | High | Separate inventory facts, surface observations, and aesthetic targets; require recurring evidence; prohibit exact CSS/pixel prescriptions and source-asset reuse. |
| A single screenshot crop is mistaken for a complete interaction | High | High | Record coverage status and occlusion/crop limits, compare state variants, and send missing behavior to the gap register or owning implementation epic. |
| Manual inventory misses or duplicates files | Medium | High | Use tracked-file enumeration, lexical ordering, one-row-per-path rules, expected folder counts, and a final path/link reconciliation. |
| Duplicate basenames or misspellings break citations | High | Medium | Use full paths as identity, preserve filenames literally, avoid alias IDs, and validate every local link. |
| Dimensions become hard-coded UI geometry | Medium | High | Keep them only in inventory metadata and explicitly prohibit their use as component, viewport, breakpoint, or acceptance dimensions. |
| Broad aesthetic synthesis erases meaningful differences between surfaces | Medium | Medium | Require multi-screenshot support, retain counter-evidence, and keep single-source patterns local to their section. |
| One large compendium note becomes hard to maintain as the corpus grows | Low now | Medium later | Use a stable section order and controlled vocabulary; defer a generated or split index until corpus size or programmatic consumers justify an explicit migration. |
| PvX or game text is copied while documenting layout | Medium | High | Use paths and structural paraphrase only, allow short identifying labels, and perform a dedicated source-policy review before closeout. |
| Prior-art images accidentally enter runtime or release paths | Low | High | Use ordinary links rather than embeds, review scoped diffs, prohibit copies/transforms, and retain the EPIC-01 explicit-ticket gate. |
| Missing accessibility, responsive, validation, or error-state captures block design progress | Medium | Medium | Classify them as EPIC-08 implementation-owned requirements; design to web standards instead of trying to reproduce undocumented legacy behavior. |
| Later equipment/party needs are pulled into the MVP | Medium | Medium | Keep deferred notes in a separate section, name owning epics, and classify known capture gaps as non-blocking for EPIC-08. |
| Corpus changes between planning and execution | Low | Medium | Reconcile the tracked delta at Phase 1, amend counts/scope/gaps together, and never silently omit or add images. |

## Security

- Treat every PNG and filename as untrusted local input. Inspect with local non-networked tooling; do not execute embedded content, follow metadata links, perform OCR through a remote service, or open live source pages as part of this sprint.
- Enumerate only tracked `prior-art/**/*.png` paths, quote paths in shell operations, and avoid interpolating filenames into commands, markup, HTML, URLs, or scripts without escaping.
- Read only the minimal file facts needed for inventory: detected PNG type and header dimensions. Do not publish EXIF-like metadata, absolute paths, usernames, host details, timestamps, or unrelated embedded chunks.
- Use normal Markdown links, not inline images, HTML image tags, base64 data, copied thumbnails, or generated contact sheets. Documentation must not create another distributable copy of source imagery.
- Do not transcribe unbounded text from screenshots. Short identifying labels are plain Markdown text and future runtime UI must independently escape any source-derived or user-authored text.
- Keep all verification local, deterministic, credential-free, and network-free. No CDN, wiki, PvX/Fandom, analytics, browser automation, or remote media request is required.
- Do not modify, sanitize, optimize, or delete an image in response to suspicious metadata during this documentation sprint. Record the issue and route it to a separately authorized asset/source review.
- Review diffs by explicit protected paths. A dirty worktree or outer-run planning artifacts do not authorize broad cleanup, reset, deletion, or changes outside this sprint's documentation and planning records.

## Dependencies

- `SPRINT-001` / EPIC-00 for repository layout, framework boundaries, compendium conventions, planning records, and the canonical verification command.
- `SPRINT-002` / EPIC-01 for the source vocabulary, development-reference-only screenshot policy, PvX/community content limits, media restrictions, and explicit-ticket requirement for runtime use.
- `SPRINT-005` / EPIC-04 for the renderer-neutral skill facts that EPIC-08 will combine with the visual reference brief; this sprint does not duplicate descriptions or media.
- `SPRINT-006` / EPIC-05 for template import/export behavior. Visual notes may inform controls but do not change codec contracts, fidelity guarantees, or unresolved-ID handling.
- `SPRINT-007` / EPIC-06 for structured validation issues and effective attribute ranks. This sprint documents presentation context only and does not alter rule semantics or severity policy.
- The 36 already tracked PNGs under `prior-art/`, available for local development review. No new capture, remote source, image library, design tool, OCR package, or runtime dependency is needed.
- Existing local tools: Git for tracked-file and diff reconciliation, `file` or an equivalent local header reader for PNG facts, Markdown/Prettier for documentation, and the pinned repository toolchain for `npm run verify`.
- Immediate downstream consumer: EPIC-08 Core Build Editor.
- Deferred downstream consumers: EPIC-13 Armor and Equipment, EPIC-14 Equipment Editor, EPIC-17 Party and Hero Builder, EPIC-18 Community Build Knowledge, and EPIC-19 Guide Authoring.

## Open Questions

No open question blocks execution. This draft uses these defaults:

1. `compendium/visual-prior-art.md` is the only canonical inventory and narrative. A `prior-art/README.md` and machine-readable manifest are deferred until a concrete maintenance or programmatic consumer justifies the synchronization cost.
2. The aesthetic target is in-game-informed rather than a strict clone. Recurring hierarchy, density, framing, icon, and feedback patterns may guide an original Build Wars UI; copied assets, exact pixel values, and source-owned expression may not.
3. A pattern is promoted to a general target only when multiple screenshots or distinct visible states support it. Otherwise it remains a path-cited surface observation with its limitations.
4. PvX references are cited by local path for structural display observations only. The sprint does not copy guide prose/content, open live pages, decide import policy, or authorize runtime use.
5. No known gap blocks EPIC-08. Missing accessibility, focus, responsive, validation, loading, and error states are original web-design responsibilities; standalone equipment-upgrade tooltips and the full party window are later capture opportunities owned by later epics.
6. Full repository-relative paths are screenshot identity. The sprint does not invent stable aliases that could drift from paths; duplicate basenames and existing misspellings are handled literally.
7. If the tracked corpus changes before execution, the executor reconciles and documents the delta before observations begin. This sprint does not itself authorize adding, replacing, renaming, or transforming images.