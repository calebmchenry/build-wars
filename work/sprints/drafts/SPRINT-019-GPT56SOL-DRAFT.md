---
id: SPRINT-019
title: Focused Build Composer
status: draft
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
updated: 2026-09-03
---

# Sprint 019: Focused Build Composer

## Overview

This sprint makes single-build composition the primary Build Wars experience without discarding the
capabilities delivered by SPRINT-009 through SPRINT-018. The first usable viewport becomes a focused
two-panel surface: the active build is composed on the left, and a compact skills catalog occupies
the right. Library management, build-set and party navigation, equipment, title ranks, sharing, and
detailed validation remain available through an explicitly secondary workspace surface. Catalog
attribution and storage-recovery notices remain visible when required because they are trust and
durability boundaries, not optional product features.

The sprint is an app-layer information-architecture pivot, not a domain or persistence migration.
`WorkspaceState` remains authoritative for the current single build or selected build-set/party
loadout, `EditorState` remains authoritative for the one live editor, `Build` remains the authored
domain record, and the local-library envelope remains schema 2 under `build-wars:v1`. Restored build
sets and parties are not flattened or converted. When they have an occupied selected loadout, that
loadout appears in the same focused composer; when they do not, the composer shows a deliberate
empty state and exposes the secondary workspace entry point needed to select or create a loadout.

`App.tsx` keeps boot, persistence, autosave, pagehide, share-fragment, and global dialog ownership.
A dedicated `BuildComposer` composition receives the current editor state, catalog views,
validation view, document context, and dispatch callbacks. This keeps the product pivot out of the
durability layer and prevents `App.tsx` from accumulating another generation of leaf interaction
logic. The left build surface owns presentation and editor commands; the right catalog derives its
view from the same state and dispatches the same catalog-aware skill-placement command used by
pointer and keyboard paths.

The profession picker does not add an `Any` profession to the domain or generated catalog. At the
component boundary, `Any` maps to the existing `null` profession value. It contributes no profession
restriction to the default skills catalog, contributes no new attribute rows, retains existing
authored or unresolved rows visibly, and continues to produce the existing incomplete-profession
validation state. A primary `Any` selection blocks canonical composer export until a concrete
primary is chosen. A secondary `Any` selection is presented explicitly as “Any / no secondary” and
uses the codec-supported template `None` value rather than pretending a wildcard exists in the
template format. Exact-source replay remains available only under its current semantic-fingerprint
proof. No sentinel ID is persisted, and no validation rule is weakened.

Attribute controls become derived incremental rows rather than another attribute state model.
Purchased rank stays in `Build.attributes`; effective rank is calculated from the existing rule
engine and any already-authored equipment adjustments. Row selectors derive current refund cost,
next investment cost, budget availability, cap state, allocated rank, effective rank, and unresolved
state from promoted catalog rules. This preserves the separation needed for later rune/headgear
work while making current restored equipment bonuses visible even though equipment editing is no
longer in the primary viewport.

Skill placement becomes one atomic, catalog-aware transition. Catalog placement removes prior
instances of the same resolved skill, replaces the destination, and, for an elite skill, removes
every other resolved elite. Slot-to-slot movement retains the existing swap-on-occupied behavior and
moves raw overlay facts with their slot. Catalog replacement, elite eviction, and explicit removal
clear raw facts only for the slots intentionally changed. Unresolved raw slots are never guessed to
be elite and are not erased unless they are the destination or explicit removal target. The same
transition powers drag, click, and keyboard placement so interaction methods cannot diverge.

Off-bar removal is represented by a visible removal drop target that appears while a filled slot is
dragged. Dropping nowhere or cancelling with Escape does not delete a skill; browser `dragend`
signals cannot reliably distinguish those cases. Drag previews use the rendered local icon or
catalog-safe placeholder through `DataTransfer.setDragImage` when available and fall back to the
browser ghost otherwise. Pointer drag remains an enhancement over complete labeled button and
keyboard operations.

Template import/export moves inline below the skill bar. A single editable code field has a local
draft buffer, an explicit Apply action, and an explicit Copy action. It displays the preferred proven
output—exact source first, otherwise canonical—when the user is not editing. Failed imports retain
the input and current build unchanged; successful imports reuse the existing transactional parser,
resolution, equipment/title omission warning, selected-loadout boundary, and dirty guard. Copy is
enabled only for proven export output, never arbitrary unvalidated input, and clipboard failure
leaves the field selected and readable.

The initial catalog tab keeps selected-profession filtering, deterministic attribute grouping,
bounds, empty states, and current catalog exclusions, while reducing visible controls to search and
a selected-professions/all toggle. Existing advanced filters remain available in a collapsed
disclosure rather than occupying the first screen. Attribute groups are independently collapsible
UI state, are not persisted or included in dirty fingerprints, and automatically reveal matches
during search. Compact rows reserve stable regions for icon, name, elite/type context, and modeled
resource/timing facts.

The repository currently contains metadata-only profession and skill icon references, while
`compendium/source-policy.md` prohibits cached icon binaries without a narrower approved exception.
Therefore the executable baseline for BW-1808 is a local-only icon seam with deterministic CSS/text
fallbacks, profession abbreviations, skill initials, and labeled resource/timing glyphs. A real
binary is used only if execution finds an already-approved local asset with provenance and an
allowlisted runtime path. Remote catalog URLs are never passed to `<img>`, CSS `url()`, drag images,
or runtime fetch. Asset acquisition, source-policy exceptions, and generated-catalog regeneration
are not hidden prerequisites for this sprint.

The sprint deliberately excludes domain-schema redesign, persistence migration, a new route,
deleting completed features, broad catalog discovery, equipment authoring in the primary surface,
saved-build management in the primary surface, party composition in the primary surface, guide
authoring, external codecs, remote media, backend sync, accounts, collaboration, PWA work,
analytics, and new runtime dependencies.

### Assumptions

1. BW-1801 through BW-1809 are groomed and can be executed in dependency order within one sprint.
2. `compendium/build-composer-use-case.md` is the durable product record; BW-1801 tightens and links
   it instead of creating a competing specification.
3. SPRINT-009 editor, raw-overlay, template, catalog, and validation behavior and SPRINT-010,
   SPRINT-017, and SPRINT-018 durability behavior are stable implementation inputs.
4. `null` remains the only non-concrete profession value in authored state. “Any” is presentation
   and filtering language, not a persisted or domain-level profession.
5. The current promoted catalogs contain icon metadata but no source-policy-approved runtime image
   bytes. CSS/local fallbacks are therefore a complete MVP outcome for BW-1808.
6. Native HTML drag-and-drop remains the pointer-drag mechanism for desktop-capable browsers;
   click and keyboard commands are the portable path, and a touch-specific gesture system is
   deferred.
7. This draft plans later implementation. It does not authorize implementation changes, ticket
   updates, commits, media downloads, or network access during planning.

## Use Cases

1. **Start with one build**: A first-time user opens directly into an untitled single-build
   composer with the build surface on the left and skills catalog on the right.
2. **Resume one build**: A valid stored single-build working draft restores without conversion and
   immediately appears in the focused composer.
3. **Resume a multi-build document**: A restored build set or party keeps all entries, annotations,
   comparison state, and selection while its occupied selected loadout uses the focused composer.
4. **Recover an empty selection**: An empty set or selected empty party slot shows no phantom build;
   it offers a clear path to the secondary workspace where a loadout can be selected or created.
5. **See durability failures**: Corrupt storage, write-blocked storage, conflicts, and memory-only
   editing remain visible before the user assumes the draft is safe.
6. **Understand catalog provenance**: Attribution remains reachable before source-derived facts,
   but its detailed links no longer dominate the primary composing workflow.
7. **Choose a primary profession**: A user opens a compact icon grid and selects one of the ten
   professions using pointer or keyboard input.
8. **Choose a secondary profession**: A user independently selects a secondary profession without
   implicit swapping, de-duplication, or silent correction of invalid pairs.
9. **Use Any while constructing**: Selecting Any clears the corresponding concrete profession,
   broadens default catalog eligibility accordingly, shows the incomplete state, and never creates
   a fake profession ID.
10. **Rename inline**: A user edits the active build name beside the profession pickers, commits on
    blur or Enter, cancels with Escape, and never persists an empty or over-limit intermediate name.
11. **Choose game mode**: PvE, PvP, and Unknown remain available in a compact control because mode
    affects attribute budget, skill availability, validation, and template context.
12. **Allocate an attribute**: Incrementing a zero-rank selected-profession attribute creates or
    updates the existing authored allocation and immediately updates budget and export state.
13. **Refund an attribute**: Decrementing shows the exact marginal refund and hides the action at
    zero without introducing negative ranks.
14. **Respect the point budget**: The increment action disappears when the next rank exceeds the
    evaluated PvE remainder or the catalog rank cap; unresolved budget facts do not present a false
    enabled state.
15. **See modified rank**: A restored build with valid headgear/rune adjustments shows allocated
    and effective rank distinctly without copying the effective value into authored state.
16. **Preserve stale attribute facts**: Imported unresolved, duplicate, or now-ineligible attribute
    rows remain visible with diagnostics and explicit removal instead of disappearing during the UI
    refactor.
17. **Browse useful defaults**: With concrete professions selected, the skills tab begins with
    playable skills for those professions plus professionless skills, grouped by attribute.
18. **Browse before choosing**: With both professions set to Any, the default catalog shows all
    playable skills in deterministic bounded order instead of an empty panel.
19. **Scan compact facts**: A skill row shows a stable icon region, name, elite/type context, and
    supported energy, adrenaline, sacrifice, upkeep, overcast, activation, recharge, or morale
    recharge facts without inventing missing values.
20. **Collapse groups**: A user collapses or expands an attribute section without dirtying or
    persisting the build; a search reveals groups containing matches.
21. **Use advanced filters deliberately**: Existing type, attribute, elite, availability, resource,
    sort, and view controls remain reachable under a disclosure but do not crowd first use.
22. **Place a skill**: Dragging, clicking Add, or choosing a keyboard destination invokes the same
    atomic placement behavior.
23. **Replace a skill**: Dropping or placing onto an occupied slot discards the previous destination
    skill and clears only the raw fact for the explicitly replaced slot.
24. **Move a duplicate**: Placing a catalog skill already present on the bar moves it to the target
    by removing every prior resolved occurrence; the bar does not accumulate duplicates.
25. **Reorder slots**: Moving a filled slot onto an empty slot transfers it; moving onto a filled
    slot swaps the two resolved/raw slot pairs without losing either skill.
26. **Replace an elite**: Placing a resolved elite atomically removes every other resolved elite and
    announces the replacement; unresolved raw skills are retained because elite status is unknown.
27. **Remove safely**: A user clears with a labeled button, Delete/Backspace, or the revealed removal
    drop target. Escape and an abandoned drag do not remove anything.
28. **See a drag image**: A supporting browser shows the same local icon/fallback in the drag image;
    unsupported browsers retain functional native feedback.
29. **Import inline**: A user pastes or types a supported bare or chat-wrapped code, applies it, and
    receives one transactional update to professions, attributes, name when present, and skill bar.
30. **Reject invalid input**: Parse, decode, or resolution failure leaves the previous editor,
    selected loadout identity, equipment, title ranks, and sibling loadouts untouched while keeping
    the rejected text available for correction.
31. **Confirm lossy replacement**: Import warns before discarding meaningful equipment or authored
    title ranks and continues to use the workspace dirty guard.
32. **Copy proven output**: The field prefers an exact-source result when valid, otherwise a
    canonical result, labels its fidelity, and copies only that proven value on explicit request.
33. **Recover from clipboard denial**: If the Clipboard API is absent or rejects the write, the code
    stays selectable and focus moves to it with a concise live-region message.
34. **Understand blocked export**: Missing concrete primary profession, unresolved raw facts,
    validation errors, or codec proof failure produces bounded inline reasons rather than an empty
    or misleading code.
35. **Keep selected-loadout boundaries**: In a build set or party, template import/export affects
    only the occupied selected loadout and identifies sibling, party, equipment, and title omissions.
36. **Reach advanced work**: A user can deliberately open secondary workspace tools for library,
    set/party navigation, equipment, title ranks, sharing, transfer, backup/restore, and detailed
    validation without those concepts competing with the first-screen task.
37. **Use narrow screens**: The two panels stack in task order, the eight slots remain bounded,
    names and facts wrap or truncate accessibly, and no page-level horizontal overlap occurs.
38. **Operate without a mouse**: Picker options, tabs, group disclosures, skill placement,
    replacement, movement, clearing, template apply/copy, secondary tools, and dialogs have visible
    focus and complete keyboard paths.
39. **Remain offline**: Composer rendering, icons/fallbacks, drag previews, catalogs, import/export,
    validation, and persistence make no runtime network request.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Composition | Focused two-panel first screen, active-loadout empty state, compact trust/durability chrome, secondary workspace disclosure, responsive stacking. | New routes, deleting completed features, multiple simultaneous editors, account/dashboard navigation, guide/discovery home page. |
| Editor state | Build-name command, catalog-aware atomic skill placement facts, existing profession/rank/mode/raw-overlay state, UI-only picker/collapse/input state. | New build schema, persisted `Any` sentinel, undo history, touch gesture state, effective-rank persistence. |
| Profession header | Two accessible icon comboboxes, Any semantics, name editing, compact mode control, validation status. | New profession data, automatic profession inference, automatic skill/attribute deletion, class recommendations. |
| Attributes | Selected-profession rows, marginal refund/investment facts, point/cap gating, allocated/effective rank display, retained unresolved rows. | New point rules, equipment editing, temporary effects, rune/headgear authoring, final game-exact order. |
| Skill bar | Eight stable slots, catalog placement, replacement, duplicate movement, slot swap/move, one resolved elite, removal target, custom drag image, keyboard parity. | Party-wide bars, AI ordering, saved hotkeys, touch-first gestures, automatic build recommendations. |
| Templates | Inline proven output, buffered input, transactional apply, explicit copy, fidelity/block reasons, existing dirty and omission guards. | Equipment/team templates, saved template library, remote sharing, codec changes, automatic clipboard reads. |
| Catalog | Skills tab, selected-profession defaults, attribute grouping/collapse, compact modeled facts, bounded rendering, advanced-filter disclosure. | Weapons/runes/insignias tabs, broad discovery, recommendations, descriptions copied from sources, virtualization worker. |
| Visual assets | Catalog-safe icon descriptor seam, approved local asset lookup, CSS/text fallbacks, labeled resource glyphs, focus/hover/drag polish. | Remote media URLs, unreviewed cached binaries, imported screenshots, pixel-perfect game skin, new asset pipeline. |
| Durability | Existing workspace documents, one-active-editor invariant, autosave, pagehide, dirty guards, saved records, backup/transfer preservation. | Storage schema migration, a new key, IndexedDB, server sync, automatic document conversion. |

### First-Screen Composition

```text
App (boot, catalog adaptation, persistence, share import, global dialogs)
├── ProductHeader / compact CatalogAttribution
├── StorageBanner (only when durability needs attention)
├── BuildComposer
│   ├── BuildSurface (left)
│   │   ├── BuildHeader (profession pickers, name, mode)
│   │   ├── AttributeEditor
│   │   ├── SkillBar + removal target
│   │   └── InlineTemplateControls
│   └── CatalogPanel (right)
│       └── Skills tab → SkillBrowser compact grouped view
└── SecondaryWorkspace (collapsed by default)
    ├── build-set / party navigation and transfer
    ├── local library and backup/restore
    ├── equipment and title-rank controls
    ├── share controls
    └── detailed validation
```

Catalog-adaptation failure continues to replace the workspace with the bounded fatal error state.
The composer is rendered only when a real single build or occupied selected loadout exists. The
secondary workspace remains available in no-selection states and owns no duplicate editor state.

### Binding Decisions

1. Add a dedicated `BuildComposer` composition. `App.tsx` retains integration side effects and
   global overlays but does not own profession-menu, attribute-row, drag, or inline-template logic.
2. Preserve `WorkspaceState`, `WorkspaceDocument`, `PersistedBuildSnapshot`,
   `PersistedBuildSetSnapshot`, the local-library schema/version/key, and every domain schema. This
   sprint requires no migration or eager persistence write.
3. Preserve the one-active-editor invariant. A build-set or party selected loadout is edited through
   the same composer; the composer never materializes a second copy or defaults to the first entry
   when selection is null.
4. Keep stable completed capabilities mounted only in `SecondaryWorkspace` or global dialogs. Do
   not fork, delete, or reimplement library, party, transfer, equipment, title, sharing, validation,
   backup, or restore logic.
5. The secondary surface is collapsed by default for a valid active loadout and opens on explicit
   request. It opens or is directly prompted when no active loadout exists. Its open state is local
   UI state and never contributes to authored or persistence fingerprints.
6. Keep catalog attribution before source-derived composer facts. Compress its default presentation
   but preserve notice, generated timestamp, source links, and safe external-link attributes.
7. Keep `StorageBanner` behavior unchanged: it is absent only for fully durable/no-diagnostic state
   and remains prominent for pending, memory-only, write-blocked, conflict, or recovery states.
8. Represent a profession picker value as the UI union `"any" | ProfessionId`, translating `"any"`
   to `null` only at dispatch. Never add a catalog ID, domain enum, raw-template ID, or persisted
   field for Any.
9. Both profession pickers list Any followed by the ten catalog professions in stable catalog order.
   The secondary accessible label describes Any as no secondary for template output. No picker
   silently swaps professions or clears skills/attributes after a selection change.
10. Default skill filtering includes professionless skills and concrete selected professions. No
    concrete selections means all playable skills. One concrete selection means that profession
    plus professionless skills, even if it is temporarily in the secondary field.
11. Normal attribute rows are ordered primary profession first, then eligible secondary attributes;
    primary-only attributes are not offered for a profession selected only as secondary. Existing
    authored rows that fall outside this projection remain as retained rows with diagnostics.
12. Primary Any blocks canonical composer export with a focused reason. Secondary Any is encoded
    only through the existing supported template `None` mapping and is never described as a
    wildcard in exported data. Exact-source export continues to rely on source presence, projection
    equality, semantic fingerprint equality, and codec proof.
13. Build-name editing uses a component-local buffer. Commit trims and caps at the existing
    120-character persistence boundary; empty commit normalizes to `Untitled Build`; Escape restores
    the current authored value. No partial keystroke writes invalid durable data.
14. A committed composer rename updates `Build.name`, `rawTemplate.templateName`, and the template
    export-name mirror atomically. It may change the chat-wrapper label but does not invalidate an
    otherwise exact bare-code fingerprint. Saved-record and build-set entry labels remain distinct
    metadata and are not renamed implicitly.
15. Keep mode selection in the focused header. Hiding it would make attribute budget and skill
    availability change without an obvious user control.
16. Extend the attribute row view rather than storing UI calculations. It exposes allocated rank,
    effective rank or unresolved reason, current-rank marginal refund, next-rank marginal cost,
    `canIncrement`, `canDecrement`, and disabled/hidden reasons.
17. Derive marginal costs from the promoted `purchasedRankCosts` rows. For rank `r`, refund is the
    current row's marginal cost and investment is rank `r + 1`'s marginal cost. Do not duplicate a
    cost table in React or CSS.
18. For evaluated PvE budgets, increment is allowed only when the next rank exists and its marginal
    cost is no greater than remaining points. For PvP/Unknown, only the rank cap applies because the
    current rule policy does not evaluate that budget. For unresolved catalog budget facts,
    increment is unavailable with a reason instead of guessed.
19. Effective rank is derived with `calculateEffectiveAttributeRank`,
    `collectEquipmentAttributeRankAdjustments`, and `equipmentAdjustmentsForAttribute`. Equal ranks
    render normally; a changed rank renders allocated and effective values with text/icon as well as
    color; unresolved calculation remains visible and does not mutate the allocation.
20. All skill insertion paths create one `SkillPlacementPlan` from the current editor plus
    app-ready catalog views. The plan contains the resolved incoming skill, destination, duplicate
    source indexes, and resolved elite-conflict indexes. Reducers consume plain facts and never
    import generated JSON.
21. A placement plan is rejected if the target is out of range, the skill ID does not resolve, or
    the catalog classifies the record as unsupported/non-player. Stale or malformed drag payloads
    are no-ops followed by drag-state cleanup and a bounded message.
22. Catalog placement is atomic: clear prior occurrences of the same resolved skill; clear other
    resolved elites when the incoming skill is elite; replace the destination; clear raw overlays
    for every changed slot; select the destination; cancel drag/keyboard state; emit at most one
    result message.
23. Slot-to-slot movement does not rerun elite or duplicate policy because it cannot introduce a
    new skill. Empty destination moves; occupied destination swaps; build and raw-overlay slot tuples
    move together. Same-source/destination is an idempotent selection.
24. Unresolved raw skill slots are preserved by elite enforcement because their elite status is not
    proven. An explicit destination replacement or removal clears both the unresolved authored ID
    and matching raw overlay at that slot.
25. A revealed removal target is the only off-bar drop that deletes. `dragend` without a confirmed
    drop cancels; Escape cancels; neither interprets `dropEffect: none` as deletion.
26. Use the current custom MIME payload, but validate parsed payload shape, integer bounds, slot
    range, and catalog membership before mutation. Never trust `DataTransfer` merely because the
    MIME name is app-owned.
27. Pointer and keyboard interactions share placement planning. Catalog Add chooses the selected
    slot or first empty slot, falling back to slot one; keyboard Pick then Place recomputes the plan
    against current state at commit time.
28. Keep template parsing, resolution, projection, exact-source replay, canonical encode/decode-back
    proof, and share selection in `template-workflow.ts`. The inline component consumes a dedicated
    view model and does not reimplement codec policy.
29. The inline field has two distinct values: a local user input buffer and a derived proven export
    value. While unfocused and unmodified it tracks the preferred proven export. User input is never
    labeled or copied as export until Apply succeeds and selectors recompute proof.
30. Apply is explicit through a labeled button or Enter shortcut. It runs parse/decode/resolve first,
    then omission confirmation and workspace dirty guard, then exactly one state replacement. A
    failed or cancelled path performs no editor mutation.
31. Preferred output uses the existing `selectShareTemplateExport` priority: exact source first,
    canonical second. The UI exposes fidelity and bounded block reasons and keeps selected-loadout
    omission copy when editing a build set or party.
32. Remove modal-only import/export state and components only after inline parity tests pass.
    Persistence is unaffected because dialog state is not part of `PersistedBuildSnapshot`.
33. Keep existing browser filter state and selectors to minimize behavior churn. The focused skills
    tab presents search and scope first; every other current filter/view control moves under an
    Advanced filters disclosure.
34. Group identity is based on resolved attribute ID plus a stable no-attribute/unresolved key, not
    localized label text. Collapse state is component-local. A non-empty search temporarily expands
    matching groups without destroying the user's prior collapse choices.
35. Compact fact order is stable: energy, adrenaline, sacrifice, upkeep, overcast, activation,
    recharge, morale recharge. Absent/not-applicable values are omitted semantically; layout uses
    CSS grid constraints so omissions and long values cannot overlap the name.
36. Preserve batching and deterministic sort. “Show more” expands the existing bounded result set;
    collapsing a group does not change result count, filtering, or state fingerprints.
37. Introduce an app-ready icon descriptor capable of `local` and `fallback` outcomes. Leaf
    components receive that descriptor and never inspect generated media records or construct URLs.
38. Local icon lookup is an explicit allowlist keyed by catalog media ID. Unknown, metadata-only, or
    unapproved IDs resolve to deterministic fallbacks. No generic “use canonical URL” branch exists.
39. Resource/timing glyphs are local code/CSS primitives with visible or assistive labels; they are
    not copied game assets. Meaning never depends on color or an unlabeled symbol.
40. Do not add a runtime dependency. React, browser APIs, current domain helpers, current template
    adapter, CSS, and Vitest/Testing Library are sufficient.

### Derived Contract Shapes

Exact names may follow repository style, but these separations are binding:

```text
ComposerProfessionChoice = "any" | ProfessionId

ComposerDocumentContext
  kind: "build" | "build-set"
  hasSelectedLoadout: boolean
  selectedLoadoutOnly: boolean
  partyEnabled: boolean

FocusedAttributeRowView
  key: stable authored/catalog key
  attributeId: AttributeId | null
  allocatedRank: number
  effectiveRank: number | null
  effectiveState: "same" | "modified" | "unresolved"
  refundCost: number | null
  investmentCost: number | null
  canDecrement: boolean
  canIncrement: boolean
  decrementReason: string | null
  incrementReason: string | null
  retained: boolean
  raw: RawTemplateOverlayEntry | null
  issues: readonly ValidationIssue[]

SkillPlacementPlan
  skillId: SkillId
  targetIndex: 0..7
  duplicateIndexes: readonly (0..7)[]
  eliteConflictIndexes: readonly (0..7)[]
  incomingElite: boolean

InlineTemplateView
  preferredSource: "exact-source" | "canonical" | null
  provenText: string | null
  fidelityLabel: string | null
  blockedReasons: readonly string[]
  selectedLoadoutWarnings: readonly string[]
  replacementWarnings: readonly string[]

AppIconDescriptor
  kind: "local" | "fallback"
  label: string
  src: string | null
  fallbackText: string
  mediaId: string | null
  tone: stable local presentation token
```

`AppIconDescriptor.src` is non-null only after an exact media ID resolves through an approved local
allowlist. Catalog canonical URLs are provenance links, not candidate image sources.

### State and Interaction Flow

```text
WorkspaceState / active EditorState
            │
            ├── validation + attribute selectors ──> left attribute rows
            ├── skill/catalog selectors ───────────> right grouped catalog
            └── template policy selectors ─────────> inline proven code

catalog row / keyboard pick / slot drag
            │
            └── catalog-aware placement planner
                        │
                        └── one atomic EditorAction
                                    │
                                    └── workspace reducer → autosave/materialization

inline template buffer
            │
            ├── parse failure/cancel ───────────────> no state change
            └── proven import + confirmations ──────> one selected-editor replacement
```

No component reads or writes local storage, decodes templates directly, mutates build-set entries,
or imports generated catalogs outside `src/app/catalogs.ts`.

### Execution Order

```text
BW-1801 → BW-1802 → BW-1803 → BW-1804
                         └────→ BW-1807 → BW-1805 → BW-1806
                                      └──────┬──────────┘
                                             ↓
                                          BW-1808
                                             ↓
                                          BW-1809
```

Shell and header contracts land before attribute/catalog specialization. The catalog lands before
skill-bar integration because placement facts and drag visuals originate there. Inline templates
land after every authored field has its final command semantics. Visual polish follows complete
interaction states so CSS does not conceal missing behavior.

## Implementation

### Phase 0: BW-1801 Product Contract and Baseline (~5% of effort)

**Files:**

- `compendium/build-composer-use-case.md`
- `compendium/README.md`
- `compendium/visual-prior-art.md`
- `work/tickets/18-focused-build-composer/*.md`
- `work/sprints/SPRINT-019.md`

**Tasks:**

- [ ] Run the existing focused tests and `npm run verify`; record pre-existing failures separately
      before implementation.
- [ ] Reconcile the use-case document against EPIC-18 and this sprint's binding decisions: first
      screen, secondary capabilities, Any semantics, no-selection states, effective-rank derivation,
      deterministic removal target, template proof, and icon-policy fallback.
- [ ] Confirm the compendium index links the durable use case and that visual-prior-art observations
      remain development references rather than runtime asset permission.
- [ ] Freeze the first-screen/secondary-surface inventory and explicitly retain every completed
      capability without promising it in the primary viewport.
- [ ] Confirm no storage/domain/catalog/template schema change or runtime dependency is necessary.
- [ ] Update ticket traceability only as execution begins; do not mark acceptance complete from
      documentation alone.

**Verification:**

- Markdown review against EPIC-18 and BW-1801 through BW-1809.
- `npm run verify`

**Gate:** Product IA, Any semantics, asset fallback, document restoration, and selected-loadout
boundaries are unambiguous before component movement begins.

### Phase 1: BW-1802 Composer Shell and Secondary Workspace (~13% of effort)

**Files:**

- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/components/BuildComposer.tsx`
- `src/app/build-composer.test.tsx`
- `src/app/components/CatalogPanel.tsx`
- `src/app/components/SecondaryWorkspace.tsx`
- `src/app/components/CatalogAttribution.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Extract the two-panel `BuildComposer`, leaving boot, storage effects, share-fragment import,
      validation orchestration, and global dialogs in `App.tsx`.
- [ ] Define a small document-context view for single build, selected set loadout, selected party
      loadout, and no selected loadout without passing the whole workspace into leaf controls.
- [ ] Compose the left build surface and the right accessible catalog tab panel in task order; use a
      single Skills tab now while preserving a stable tab contract for later catalog types.
- [ ] Add `SecondaryWorkspace`, collapsed by default, and move library, build-set/party navigation,
      equipment, title ranks, sharing, and detailed validation into it without changing their state
      or action ownership.
- [ ] Keep transfer/backup/restore/party dialogs reachable and focus-restoring even when their
      launch controls live inside the secondary disclosure.
- [ ] Render a no-selected-loadout state instead of the placeholder editor and provide a control
      that opens/focuses the secondary navigation/create actions.
- [ ] Compress attribution presentation while preserving source notice, links, generated timestamp,
      ordering, and safe external link behavior.
- [ ] Preserve storage banner visibility and catalog fatal-error behavior.
- [ ] Establish desktop panel min/max constraints and narrow-screen stacking without hard-coding a
      viewport width into component logic.
- [ ] Cover first boot, restored build, selected build-set entry, occupied party slot, empty party
      slot, empty set, share URL boot, catalog error, storage diagnostic, disclosure focus, and
      secondary actions.

**Verification:**

- `npm run test:run -- src/app/build-composer.test.tsx src/app/App.test.tsx src/app/workspace-state.test.ts src/app/local-storage.test.ts`
- `npm run typecheck`
- Manual desktop and narrow-width review of panel order, focus order, overflow, and empty states.

**Gate:** The focused composer is the default visible workflow while every prior document type and
secondary capability remains reachable and lossless.

### Phase 2: BW-1803 Build Header, Any Semantics, and Naming (~11% of effort)

**Files:**

- `src/app/components/BuildHeader.tsx`
- `src/app/components/ProfessionPicker.tsx`
- `src/app/profession-picker.test.tsx`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/components/ProfessionModeEditor.tsx` (remove after parity)
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Implement reusable primary and secondary profession icon comboboxes with trigger name,
      expanded state, stable option grid, listbox semantics, roving focus or `aria-activedescendant`,
      Arrow/Home/End navigation, Enter/Space selection, Escape close, outside-click close, and focus
      restoration.
- [ ] Render Any plus all ten catalog professions in stable order and use app-ready icon descriptors
      rather than direct media URLs.
- [ ] Translate Any to `null`; clear the corresponding raw profession overlay on explicit choice;
      keep duplicate/secondary-without-primary states for validation instead of auto-repair.
- [ ] Add focused selector copy for Any: broad/no-added catalog restriction, no generated attribute
      rows, primary canonical-export block, and explicit secondary None semantics.
- [ ] Add a committed build-name action and buffered inline editor with 120-character enforcement,
      trim/fallback behavior, Enter commit, Escape cancel, blur commit, and external-state resync.
- [ ] Keep build name, raw template wrapper name, and export-name mirror synchronized on composer
      commit without renaming saved records, set entries, party slots, or set names.
- [ ] Move the existing mode radio semantics into a compact, labeled header control without changing
      `GameMode` or budget behavior.
- [ ] Present profession-specific inline issues and a non-color export warning when primary is Any.
- [ ] Remove `ProfessionModeEditor` only after its profession, mode, validation, and test coverage is
      represented in the new header.
- [ ] Test long names, whitespace-only commit, max length, Escape, blur during loadout switch, both
      Any choices, all ten professions, duplicate professions, keyboard grid navigation, click-away,
      imported raw profession facts, and restored set/party loadouts.

**Verification:**

- `npm run test:run -- src/app/profession-picker.test.tsx src/app/editor-state.test.ts src/app/editor-selectors.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Gate:** Profession and name edits are accessible, deterministic, persistence-safe, and explicit
about Any/export semantics before dependent attribute and catalog work begins.

### Phase 3: BW-1804 Incremental Attribute Allocation (~12% of effort)

**Files:**

- `src/app/components/AttributeEditor.tsx`
- `src/app/attribute-editor.test.tsx`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/styles.css`

**Tasks:**

- [ ] Extend attribute row selectors with allocated/effective ranks, marginal refund/investment,
      cap state, PvE remaining-point gate, unresolved-budget state, and concise reasons.
- [ ] Derive effective rank with the existing rule-engine/equipment adjustment pipeline; do not add
      effective fields to `Build`, `AttributeAllocation`, persistence, or reducer state.
- [ ] Order normal rows by primary then secondary profession and exclude primary-only attributes
      from a secondary-only contribution while retaining authored exceptions.
- [ ] Replace rank selects with labeled decrement and increment buttons, cost values, allocated rank,
      effective-rank indicator, attribute name, profession context, and row issues.
- [ ] Hide decrement at zero and increment at cap/insufficient budget as required, while keeping an
      accessible explanation available in row text or labels.
- [ ] Keep PvE level and quest-bonus controls in a compact budget disclosure; retain current PvP and
      Unknown non-evaluated policy instead of inventing point budgets.
- [ ] Preserve manual removal for retained unresolved/stale rows and ensure explicit edits clear only
      their corresponding raw overlay entries.
- [ ] Prove every increment/refund updates validation, template projection, autosave, and effective
      display synchronously through the existing reducer path.
- [ ] Test rank 0/1/max boundaries, exact marginal costs, exact-budget spend, one-point-short state,
      PvP/Unknown behavior, primary/secondary ordering, secondary primary-only exclusion, retained
      rows, duplicate rows, missing catalog cost, equipment-modified rank, unresolved adjustment,
      and keyboard labels.

**Verification:**

- `npm run test:run -- src/app/attribute-editor.test.tsx src/app/editor-selectors.test.ts src/app/editor-state.test.ts test/domain/effective-attribute-rank.test.ts test/domain/rule-engine.test.ts`
- `npm run typecheck`

**Gate:** Display, reducer mutation, validation budget, and template projection use the same promoted
rank-cost facts, and effective rank is purely derived.

### Phase 4: BW-1807 Focused Skills Catalog (~13% of effort)

**Files:**

- `src/app/components/CatalogPanel.tsx`
- `src/app/components/SkillBrowser.tsx`
- `src/app/skill-browser.test.tsx`
- `src/app/components/SkillDisplay.tsx`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/editor-state.ts`
- `src/app/styles.css`

**Tasks:**

- [ ] Make Skills the selected accessible catalog tab and ensure tab/panel IDs and focus behavior do
      not depend on deferred tab content.
- [ ] Preserve playable-skill exclusion, mode availability, deterministic ordering, batching, and
      selected-profession behavior; bind both Any to all playable skills and one concrete profession
      to that profession plus professionless skills.
- [ ] Give group views stable resolved-attribute identities and explicit no-attribute/unresolved
      groups rather than deriving React/ARIA IDs only from display labels.
- [ ] Add per-group collapse controls with `aria-expanded`/`aria-controls`, UI-only state, count
      summaries, and automatic reveal while a search query is active.
- [ ] Present search and selected/all scope in the primary toolbar. Move attribute, type, elite,
      availability, resource, sort, and view controls under Advanced filters, preserving Clear and
      Show more behavior.
- [ ] Render compact rows with stable icon/name/context/fact regions and fixed semantic fact order;
      preserve special/zero/percentage/unknown text exactly as catalog state rather than coercing it.
- [ ] Keep Add, keyboard Pick, and detail/tooltip actions labeled and accessible. Drag setup may be
      present, but Phase 5 owns final placement policy and removal behavior.
- [ ] Provide distinct states for no selected professions, no matching filters, unavailable group
      facts, end of batch, long names, missing costs, elite skills, and unresolved catalog gaps.
- [ ] Test Any/one/two profession defaults, professionless skills, mode splits, advanced disclosure,
      group identity/collapse, search reveal, clear filters, batches crossing group boundaries,
      long/missing/special facts, and deterministic results.

**Verification:**

- `npm run test:run -- src/app/skill-browser.test.tsx src/app/editor-selectors.test.ts src/app/catalogs.test.ts src/app/catalog-boundary.test.ts`
- `npm run typecheck`

**Gate:** The right panel is useful without manual setup, remains bounded and deterministic, and
exposes all placement methods through one catalog record identity.

### Phase 5: BW-1805 Atomic Skill Bar Placement and Removal (~17% of effort)

**Files:**

- `src/app/editor-state.ts`
- `src/app/editor-state.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/drag-payload.ts`
- `src/app/components/SkillBar.tsx`
- `src/app/skill-bar.test.tsx`
- `src/app/components/SkillBrowser.tsx`
- `src/app/skill-browser.test.tsx`
- `src/app/components/SkillDisplay.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Add a pure catalog-aware placement planner that resolves playable skill facts and returns
      target, duplicate, elite-conflict, and rejection information without importing generated JSON
      into reducer or component leaves.
- [ ] Replace direct catalog placement with one atomic reducer action that validates bounded indexes,
      removes duplicate/conflicting slots, replaces target, clears changed raw overlays, selects the
      target, and clears transient interaction state.
- [ ] Keep slot movement separate: move to empty, swap with occupied, preserve raw-overlay alignment,
      and no-op safely for empty/stale/same slots.
- [ ] Recompute placement facts at click/drop/keyboard commit time so a long-lived keyboard pick
      cannot use stale duplicate or elite indexes.
- [ ] Harden drag-payload parsing and drop handlers against missing MIME data, malformed JSON,
      out-of-range indexes, unknown skills, unsupported/non-player records, and foreign drops.
- [ ] Render eight dimensionally stable slots with known, empty, unresolved, selected, dragging,
      valid-target, and replacement-target states that do not shift neighboring content.
- [ ] Add a removal target shown only for filled-slot drag; clear only on a validated drop and never
      on Escape, drag cancellation, unsupported drag image, or arbitrary outside drop.
- [ ] Use `setDragImage` with the rendered local/fallback icon when supported, and keep the native
      ghost as a non-failing fallback.
- [ ] Replace single-letter visible controls with concise accessible labels or an action menu while
      keeping Delete/Backspace, Enter/Space, Escape, Pick, Place, Replace, Move, and Clear operable.
- [ ] Announce duplicate moves, occupied replacements, elite replacement count, removals, and invalid
      payloads once without flooding the live region.
- [ ] Cover catalog-to-empty, catalog-to-occupied, same skill same target, same skill other target,
      defensive multiple duplicates, elite-to-empty, elite-to-occupied, multiple defensive elites,
      unresolved/raw neighbors, slot move/swap, removal target, cancelled/outside drag, invalid
      payload, drag-image absence, keyboard parity, and frozen-state immutability.

**Verification:**

- `npm run test:run -- src/app/editor-state.test.ts src/app/editor-selectors.test.ts src/app/skill-bar.test.tsx src/app/skill-browser.test.tsx src/app/template-workflow.test.ts`
- `npm run typecheck`

**Gate:** Every placement method yields the same final build/raw-overlay state, never creates a
resolved duplicate or second resolved elite, and never deletes on ambiguous drag cancellation.

### Phase 6: BW-1806 Inline Template Workflow (~13% of effort)

**Files:**

- `src/app/components/InlineTemplateControls.tsx`
- `src/app/inline-template-controls.test.tsx`
- `src/app/components/TemplateDialogs.tsx` (remove after parity)
- `src/app/template-dialogs.test.tsx` (replace after parity)
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/editor-selectors.ts`
- `src/app/editor-selectors.test.ts`
- `src/app/editor-state.ts`
- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Add an inline-template view selector that chooses exact-source then canonical output, reports
      fidelity, adds the concrete-primary composer gate, bounds duplicate reasons, and surfaces
      selected-loadout/equipment/title omissions.
- [ ] Implement a selectable editable code field with local input buffer, Apply, Copy, reset-to-
      proven-output behavior, status text, and a blocked-reasons disclosure.
- [ ] Keep derived output synchronized only while the field is not actively edited; never overwrite
      a rejected user input before the user can correct or discard it.
- [ ] Reuse `importSkillTemplateToEditor` and current decode/resolve bounds. Run parse/resolve before
      confirmations, then equipment/title warning and workspace dirty guard, then one selected-editor
      replacement.
- [ ] Preserve outer build-set/party identity and sibling snapshots during selected-loadout import;
      retain the existing no-selected-loadout guard.
- [ ] On success, synchronize imported wrapper name into the build header and raw template state;
      on invalid/cancelled input preserve the entire previous editor including raw overlay,
      equipment, title ranks, and message only.
- [ ] Copy only the selector-proven value after explicit user action. On unavailable/denied clipboard,
      select/focus the code field and announce the fallback without clearing it.
- [ ] Preserve exact-source semantic fingerprint, canonical validation/representation gates, codec
      encode/decode-back proof, and output length/name limits. Do not treat Any as a new template ID.
- [ ] Remove modal-only dialog state/actions and `TemplateDialogs` after behavior parity; verify that
      persisted snapshot shape and fingerprints do not change.
- [ ] Test bare/wrapped import, imported name, exact-source preference, edited canonical fallback,
      primary Any block, secondary None mapping, parse/decode/resolve failure, dirty cancellation,
      equipment/title cancellation, clipboard success/failure/absence, stale async copy result,
      field resync, long code, selected set/party loadout, empty selection, and share-fragment boot.

**Verification:**

- `npm run test:run -- src/app/inline-template-controls.test.tsx src/app/template-workflow.test.ts src/app/workspace-state.test.ts src/app/App.test.tsx src/app/share-url.test.ts`
- `npm run typecheck`

**Gate:** Inline import/copy is at least as safe and faithful as the modal workflow, and removing the
modal introduces no persisted-shape, selected-loadout, or template-compatibility regression.

### Phase 7: BW-1808 Local Icon Seam and Visual Polish (~10% of effort)

**Files:**

- `src/app/catalogs.ts`
- `src/app/catalogs.test.ts`
- `src/app/catalog-boundary.test.ts`
- `src/app/icon-assets.ts`
- `src/app/icon-assets.test.ts`
- `src/app/components/CatalogIcon.tsx`
- `src/app/catalog-icon.test.tsx`
- `src/app/components/BuildHeader.tsx`
- `src/app/components/ProfessionPicker.tsx`
- `src/app/components/AttributeEditor.tsx`
- `src/app/components/SkillBar.tsx`
- `src/app/components/SkillBrowser.tsx`
- `src/app/components/SkillDisplay.tsx`
- `src/app/styles.css`
- Approved local asset files, only if an existing source-policy approval names their exact paths.

**Tasks:**

- [ ] Add an explicit local icon registry and app-ready descriptor adaptation. Keep generated catalog
      imports in `catalogs.ts`; keep local path selection out of leaf components.
- [ ] Verify the source policy before adding any binary. If no exact approval exists, ship the CSS/
      text fallback baseline and record binary assets as deferred rather than downloading or
      hot-linking them.
- [ ] Guarantee metadata-only canonical URLs cannot enter `img.src`, `srcset`, CSS URLs, drag-image
      DOM, fetch, preload, or service-worker paths.
- [ ] Render profession abbreviations and skill initials with deterministic, accessible local tones;
      preserve full names in visible labels/tooltips and distinguish Any/empty/unresolved states.
- [ ] Render local resource/timing glyphs for energy, adrenaline, sacrifice, upkeep, overcast,
      activation, recharge, and morale recharge with accessible labels and textual values.
- [ ] Use one `CatalogIcon` primitive across picker, catalog, bar, tooltip, and drag preview so local
      assets can be introduced later without changing interaction contracts.
- [ ] Polish spacing, panel hierarchy, eight-slot dimensions, row alignment, selected/hover/focus/
      invalid/drop states, reduced motion, high contrast, long-name truncation, and narrow stacking.
- [ ] Prevent layout shift when validation messages, effective-rank markers, costs, collapsed groups,
      drag target, storage banner, or secondary workspace appear.
- [ ] Test exact local allowlist resolution, unknown media fallback, absence of remote URL rendering,
      alt/accessibility names, cost labels, icon-load fallback, and all key visual state class hooks.

**Verification:**

- `npm run test:run -- src/app/icon-assets.test.ts src/app/catalog-icon.test.tsx src/app/catalogs.test.ts src/app/catalog-boundary.test.ts src/app/profession-picker.test.tsx src/app/skill-bar.test.tsx src/app/skill-browser.test.tsx`
- `npm run typecheck`
- `npm run build`
- Manual desktop/narrow, keyboard-only, reduced-motion, 200% zoom, long-text, missing-icon, and drag
  review without a network connection.

**Gate:** Every icon-bearing surface has a stable accessible local/fallback result, no remote media
request is possible, and visual polish does not hide state or destabilize layout.

### Phase 8: BW-1809 Regression, Documentation, and Closeout (~6% of effort)

**Files:**

- `src/app/App.test.tsx`
- `src/app/build-composer.test.tsx`
- Focused reducer, selector, component, and workflow tests from prior phases
- `README.md`
- `compendium/build-composer-use-case.md`
- `compendium/core-build-editor.md`
- `compendium/local-library-and-sharing.md`
- `compendium/multi-build-workspace.md`
- `compendium/visual-prior-art.md`
- `work/tickets/18-focused-build-composer/EPIC.md`
- `work/tickets/18-focused-build-composer/BW-1801-product-use-case-and-ia.md`
- `work/tickets/18-focused-build-composer/BW-1802-two-panel-composer-shell.md`
- `work/tickets/18-focused-build-composer/BW-1803-build-header-profession-pickers.md`
- `work/tickets/18-focused-build-composer/BW-1804-attribute-allocation-editor.md`
- `work/tickets/18-focused-build-composer/BW-1805-skill-bar-drag-drop-refinement.md`
- `work/tickets/18-focused-build-composer/BW-1806-inline-template-import-export.md`
- `work/tickets/18-focused-build-composer/BW-1807-skill-catalog-tab.md`
- `work/tickets/18-focused-build-composer/BW-1808-icon-assets-and-visual-polish.md`
- `work/tickets/18-focused-build-composer/BW-1809-verification-and-closeout.md`
- `work/sprints/SPRINT-019.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T141222Z/plan-EPIC-18-result.json`

**Tasks:**

- [ ] Add end-to-end component coverage for first boot create/edit/export, valid inline import/edit/
      export, restored build, selected set/party loadout, empty selected party slot, and secondary
      workspace recovery.
- [ ] Re-run template, persistence, workspace, build-set, party, equipment, title, sharing, backup,
      transfer, storage, catalog-boundary, and domain regression suites affected by composition.
- [ ] Verify no first-screen control accidentally operates on a placeholder or non-selected entry
      and no editor transition loses active state before autosave/materialization.
- [ ] Review responsive behavior at representative wide, intermediate, narrow, 200% zoom, long-name,
      long-cost, diagnostics-visible, and drag-visible states; record limitations that jsdom cannot
      prove.
- [ ] Update README and compendium records to describe the focused default, secondary completed
      capabilities, Any semantics, inline template policy, effective-rank derivation, and icon source
      boundary.
- [ ] Record deferred equipment-first, library-first, party/team, guide, discovery, advanced analysis,
      touch gesture, real asset, and broader catalog-tab work without implying those features were
      removed.
- [ ] Run `npm run verify` from a clean implementation diff and resolve all failures.
- [ ] Review the final diff for unexpected schema, generated data, asset, lockfile, dependency,
      network, or implementation-scope changes.
- [ ] Update BW-1801 through BW-1809 and EPIC-18 status/traceability only after their criteria pass;
      finalize SPRINT-019, sync the ledger, and write the ticket-burn result manifest consistently.
- [ ] Do not create a commit unless a separate execution request authorizes one.

**Verification:**

- `npm run verify`
- Markdown and ticket/ledger/manifest consistency review.
- Manual focused-workflow and secondary-capability smoke review.

**Gate:** All Definition of Done items are evidenced, canonical verification passes, deferred scope
is explicit, and every closeout artifact agrees before EPIC-18 is marked complete.

## Files Summary

| File or Area | Action | Purpose |
| --- | --- | --- |
| `src/app/App.tsx` | Modify | Retain boot/durability orchestration and compose focused plus secondary surfaces. |
| `src/app/components/BuildComposer.tsx` | Add | Own the two-panel active-loadout composition and no-selection boundary. |
| `src/app/components/CatalogPanel.tsx` | Add | Provide accessible right-panel catalog tabs beginning with Skills. |
| `src/app/components/SecondaryWorkspace.tsx` | Add | Keep completed library, multi-build, party, equipment, title, share, validation, and transfer surfaces reachable but secondary. |
| `src/app/components/BuildHeader.tsx` | Add | Compose profession pickers, buffered build name, compact mode, and header issues. |
| `src/app/components/ProfessionPicker.tsx` | Add | Implement reusable accessible Any/profession icon combobox behavior. |
| `src/app/components/ProfessionModeEditor.tsx` | Remove after parity | Retire the text-heavy primary header once the new header covers all behavior. |
| `src/app/components/AttributeEditor.tsx` | Modify | Render marginal increment/refund controls and allocated/effective ranks. |
| `src/app/components/SkillBar.tsx` | Modify | Render stable slots, shared placement behavior, custom drag feedback, and removal target. |
| `src/app/components/SkillBrowser.tsx` | Modify | Become the focused grouped/collapsible skills catalog while retaining advanced filters. |
| `src/app/components/SkillDisplay.tsx` | Modify | Share icon and compact modeled-fact rendering across catalog, bar, and tooltip. |
| `src/app/components/InlineTemplateControls.tsx` | Add | Provide buffered inline import, proven export, copy fallback, and diagnostics. |
| `src/app/components/TemplateDialogs.tsx` | Remove after parity | Retire modal-first template UI without changing workflow policy. |
| `src/app/components/CatalogAttribution.tsx` | Modify | Preserve provenance in a less dominant app header treatment. |
| `src/app/components/CatalogIcon.tsx` | Add | Render approved local icons or deterministic accessible fallbacks. |
| `src/app/icon-assets.ts` | Add | Define the exact local icon allowlist and resource/timing glyph descriptors. |
| `src/app/catalogs.ts` | Modify | Produce app-ready icon descriptors while keeping generated imports centralized. |
| `src/app/editor-state.ts` | Modify | Add committed naming and atomic skill-placement transitions; remove obsolete modal state after parity. |
| `src/app/editor-selectors.ts` | Modify | Derive focused attribute, profession, catalog, placement, icon, and template views. |
| `src/app/drag-payload.ts` | Modify | Harden internal drag payload validation and bounded handling. |
| `src/app/template-workflow.ts` | Modify | Expose reusable inline policy views while preserving codec and fidelity gates. |
| `src/app/workspace-state.ts` | Modify | Route committed name/template replacement safely through the selected editor boundary if needed. |
| `src/app/styles.css` | Modify | Implement focused layout, compact controls, stable icon/fact regions, states, and responsive behavior. |
| Focused `src/app/*.test.ts(x)` files | Add/Modify | Cover reducer, selector, header, attribute, bar, catalog, template, shell, icon, workflow, and regressions. |
| `src/domain/**` | No change expected | Preserve framework-neutral build, validation, equipment, and template-facing contracts. |
| `src/app/persistence-schema.ts` | No shape change expected | Confirm existing snapshots ignore UI-only state and remain byte/semantic compatible. |
| `data/generated/**` | No change | Reuse promoted catalog facts and metadata; do not regenerate for UI work. |
| Approved local asset paths | Conditional add only | Add binaries only when an existing source-policy approval identifies exact files and provenance. |
| `README.md` and `compendium/*.md` | Modify | Document the focused default, preserved secondary capabilities, policies, and deferrals. |
| EPIC-18 ticket files | Modify at closeout | Record implementation traceability, verification evidence, and final statuses. |
| `work/sprints/SPRINT-019.md` | Finalize at closeout | Publish the approved executable sprint and completion evidence. |
| `work/sprints/ledger.tsv` | Modify at closeout | Synchronize SPRINT-019 status only after verification. |
| Ticket-burn result manifest | Add/Modify at closeout | Record deterministic run outcome at the intent-specified path. |

## Definition of Done

### Product and Composition

- [ ] The default first screen is a two-panel focused composer with the active build left and Skills
      catalog right.
- [ ] A first-time user can begin a single build without navigating library, equipment, build-set,
      party, guide, discovery, or analysis concepts.
- [ ] Completed library, build-set, party, equipment, title, sharing, validation, backup, restore,
      and transfer behavior remains reachable through an explicit secondary surface.
- [ ] Single builds, selected set entries, occupied party slots, empty sets, and empty selected party
      slots render without conversion, phantom editors, or fallback-to-first-entry behavior.
- [ ] Catalog adaptation errors and storage durability/recovery notices retain their existing safety
      semantics.
- [ ] No domain schema, persistence schema, storage key, generated catalog, or runtime dependency
      changes solely to support composition.

### Header and Profession Semantics

- [ ] Primary and secondary pickers expose Any plus ten professions with stable pointer and keyboard
      operation, focus restoration, full accessible names, and visible focus.
- [ ] Any maps to `null`, never to a sentinel catalog/template ID, and has documented filtering,
      attribute, validation, and export behavior.
- [ ] Primary Any cannot silently produce a canonical composer export; secondary Any/None behavior
      is explicit and codec-supported.
- [ ] Concrete profession edits retain existing eligibility, validation, raw-overlay invalidation,
      and template behavior without automatic destructive cleanup.
- [ ] Build name edits commit atomically, respect the 120-character boundary, normalize empty input,
      sync wrapper naming, and do not rename record/set/entry/party metadata.
- [ ] PvE/PvP/Unknown mode remains visible and continues to drive budget, availability, validation,
      and template context.

### Attributes

- [ ] Selected-profession attributes appear in deterministic primary/secondary order and do not
      offer a secondary profession's primary-only attribute.
- [ ] Every normal row shows allocated rank, attribute name, current refund, next investment, and an
      effective-rank state derived from existing rules.
- [ ] Decrement is unavailable at zero; increment is unavailable at rank cap, insufficient evaluated
      PvE budget, or unresolved required budget facts.
- [ ] Cost values come from promoted point rules and agree with validation spend/budget calculations.
- [ ] Effective rank remains derived, reflects valid existing equipment adjustments, and is never
      persisted as authored rank.
- [ ] Retained stale, unresolved, duplicate, or now-ineligible rows remain visible, diagnosable, and
      explicitly removable.

### Skill Catalog and Bar

- [ ] Skills defaults to selected concrete professions plus professionless skills, or all playable
      skills when both choices are Any.
- [ ] Skills are deterministically grouped by stable attribute identity with accessible independent
      collapse, search reveal, bounded rendering, Clear, and Show more behavior.
- [ ] Primary catalog controls are concise; all existing advanced filters remain under disclosure.
- [ ] Compact rows preserve catalog fact states for every modeled cost/timing field and remain
      scannable for long names, elite skills, zero/special values, missing facts, and unresolved gaps.
- [ ] The bar renders exactly eight stable slots with known, empty, unresolved, selected, drag,
      target, replacement, and error states.
- [ ] Catalog placement, replacement, duplicate movement, elite replacement, slot move/swap,
      removal, and invalid input are deterministic, immutable, and raw-overlay safe.
- [ ] A catalog skill cannot remain duplicated after placement, and placing a resolved elite leaves
      at most one resolved elite while retaining unresolved raw facts not explicitly changed.
- [ ] Drag uses a local icon/fallback preview where supported; the explicit removal target deletes,
      while Escape or an abandoned/outside drag does not.
- [ ] Click and keyboard paths provide complete Place, Replace, Move, Swap, and Clear alternatives
      and yield the same reducer results as drag.

### Inline Templates

- [ ] The current preferred proven template code is visible, selectable, fidelity-labeled, and
      located directly below the skill bar.
- [ ] Exact-source output remains preferred only while existing fingerprint and codec proofs pass;
      canonical output retains validation, representation, and round-trip gates.
- [ ] Apply accepts supported bare/chat-wrapped input and transactionally updates only the active
      selected editor after existing warnings and dirty guard.
- [ ] Invalid, oversized, unresolved, cancelled, or rejected input leaves the previous editor and
      document graph unchanged and keeps the input available for correction.
- [ ] Copy occurs only on explicit action and only for proven output; API failure leaves selectable
      text and produces a concise accessible message.
- [ ] Equipment, title-rank, sibling-loadout, and party-metadata omissions remain explicit.
- [ ] Modal-only template UI/state is removed only after equivalent inline tests pass, with no
      persisted snapshot or compatibility regression.

### Icons, Accessibility, Responsive Behavior, and Preservation

- [ ] Profession, skill, resource, timing, drag, empty, Any, and unresolved states render through one
      accessible local/fallback icon contract.
- [ ] No catalog remote media URL reaches an image, CSS, preload, fetch, drag, or service-worker
      runtime path.
- [ ] Any added binary has exact-path source-policy approval and provenance; otherwise deterministic
      CSS/text fallbacks satisfy the sprint baseline and the binary gap is recorded.
- [ ] Icon and cost meaning has text/assistive labels and never depends on color alone.
- [ ] Focus, hover, selected, disabled, invalid, drop-target, and reduced-motion states are visible
      without layout shift.
- [ ] Desktop, intermediate, narrow, long-text, diagnostics-visible, and 200% zoom states have no
      page-level horizontal overlap or inaccessible controls.
- [ ] Autosave, pagehide, local saves, backup/restore, build-set transfer, party transfer, share URL,
      equipment, title ranks, validation, raw overlays, and catalog attribution pass regression.

### Verification and Closeout

- [ ] Focused reducer, selector, component, and workflow suites cover the edge cases named in every
      phase.
- [ ] `npm run verify` passes on the completed implementation.
- [ ] README and compendium records describe the focused default and preserved secondary features.
- [ ] Equipment-first, saved-library-first, party/team, guide, discovery, advanced analysis, touch
      gestures, broader catalog tabs, and unapproved real assets remain explicitly deferred.
- [ ] BW-1801 through BW-1809 and EPIC-18 contain useful traceability and are marked complete only
      after their acceptance evidence exists.
- [ ] `work/sprints/SPRINT-019.md`, `work/sprints/ledger.tsv`, and
      `work/runs/ticket-burn/BACKLOG/20260903T141222Z/plan-EPIC-18-result.json` agree on outcome.
- [ ] No planning or implementation commit is created without separate authorization.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Composition refactor targets the placeholder editor or wrong set/party entry. | Silent loadout corruption or lost active edits. | Keep one active editor, pass explicit document context, retain materialize/hydrate paths, and test occupied/empty selection plus switching/autosave sequences. |
| Secondary UI makes completed recovery or navigation features effectively unreachable. | Users cannot select party members, recover storage, or access saved work. | Keep a labeled keyboard-accessible entry point, auto-prompt it for no-selection states, preserve global dialogs, and test every secondary launch path. |
| Any conflates construction convenience with template wildcard semantics. | Misleading or invalid export. | Persist only `null`, explain secondary None semantics, block canonical primary-Any export, preserve validation and exact-source proof, and add focused selector tests. |
| Build-name and template-wrapper names drift. | Header and copied code disagree. | Commit through one atomic command and define wrapper synchronization without renaming outer record metadata. |
| Attribute UI duplicates point rules. | Displayed costs or enabled states diverge from validation. | Derive costs/cap/budget from the promoted catalog and existing budget selector; test exact boundaries. |
| Hidden equipment still modifies effective rank. | Apparently unexplained blue/modified rank. | Derive from existing adjustments and expose a concise “modified by equipment” affordance linking to secondary equipment controls. |
| Elite enforcement requires catalog facts but reducers are catalog-neutral. | UI-only checks diverge or generated data leaks into state. | Build plain placement facts in an app-layer planner, validate them, and apply one atomic reducer transition across all interaction paths. |
| Aggressive elite cleanup erases unresolved imports. | Loss of recoverable raw template data. | Only classify catalog-resolved skills; retain unresolved raw slots unless explicitly replaced/removed. |
| Treating `dragend/dropEffect` as removal deletes on Escape. | Accidental skill loss. | Delete only through a validated removal drop target or explicit clear command. |
| Collapse/filter/batching interactions hide valid results. | Catalog appears empty or inconsistent. | Stable group identity, search auto-reveal, visible counts, deterministic batching, and cross-boundary tests. |
| Inline input is overwritten by live derived export. | User cannot correct a failed paste. | Separate local edit buffer from proven output and sync only when pristine/unfocused. |
| Async clipboard completion reports against newer state. | Misleading success/failure feedback. | Tie result messages to the copied value/request and never mutate the input on completion. |
| Removing modal state breaks persisted drafts. | Restore or dirty fingerprints change unexpectedly. | Confirm dialog state is non-persisted, remove only after parity, and run persistence fingerprint/round-trip suites. |
| Real icon requirements conflict with source policy. | Unreviewed binaries or runtime hot-links ship. | Make CSS/local fallbacks the complete baseline; require exact approval for binaries; enforce no-remote-path tests. |
| CSS visual testing exceeds jsdom capability. | Overlap, zoom, or drag feedback regressions escape automation. | Use semantic/class tests plus explicit manual desktop/narrow/zoom/reduced-motion/offline review; add no visual-test dependency in this sprint. |
| App and CSS changes are too broad for one sprint. | Regression surface becomes difficult to isolate. | Land phase gates in dependency order, keep policy in selectors/workflows, and require focused tests plus full verification at each integration boundary. |

## Security

- Template input remains bounded by existing compatibility limits and is parsed as data. It is never
  evaluated, injected as HTML, used as a URL, or applied partially after a failure.
- React renders build names, template wrappers, skill names, catalog labels, diagnostics, and source
  facts as text. No `dangerouslySetInnerHTML` or user-derived CSS/DOM ID without normalization is
  introduced.
- Custom drag payloads are untrusted input. Parse failures, non-integers, out-of-range indexes,
  unknown IDs, unsupported/non-player records, and foreign payloads are rejected before reducer
  mutation.
- Clipboard reads are not automatic. Clipboard writes require explicit user action, copy only a
  proven bounded template string, and degrade to selectable text without retry loops.
- External attribution links retain `rel="noopener noreferrer"`. No new navigation or opener path is
  introduced by compacting attribution.
- Catalog media URLs remain provenance only. Components, CSS, drag images, preloads, and browser APIs
  must not fetch them; this preserves offline behavior and avoids tracking, mixed-content, and
  source-policy violations.
- Local asset lookup is exact-ID allowlisted. User text, media IDs, and catalog URLs cannot construct
  filesystem or network paths dynamically.
- Existing local-storage corrupt-data, write-block, revision-conflict, byte/count/string caps,
  dangerous-key rejection, and non-overwrite recovery behavior remain unchanged.
- Secondary disclosure state, group collapse, focus state, drag state, and inline input buffer are
  UI-only and do not expand persisted attack surface.
- No backend, account, token, credential, telemetry, analytics, service worker, remote fetch, or new
  environment variable is introduced.

## Dependencies

### Repository and Runtime

- Node.js `>=22.11.0`, npm `>=11.10.1`, and the existing package lock.
- React 19, TypeScript 5.9, Vite 6, Vitest 4, Testing Library, ESLint, and Prettier already in the
  repository.
- Existing `@buildwars/gw-templates@1.1.1` adapter and template compatibility limits/proofs.
- No new runtime or development dependency is planned.

### Internal Contracts

- SPRINT-009 app catalog boundary, editor reducer, raw overlay, skill display, template workflow,
  validation presentation, and responsive foundations.
- SPRINT-010 local storage, autosave, dirty guards, share fragments, backup/restore, and catalog
  freshness behavior.
- SPRINT-014/015 equipment adjustments, persistence, selected-loadout omission warnings, title-rank
  selectors, and validation.
- SPRINT-017 one-active-editor build-set materialization, selection, persistence, comparison,
  transfer, and aggregate behavior.
- SPRINT-018 occupied/empty party selection, party annotations, native transfer, and selected-member
  boundaries.
- Promoted EPIC-03 profession/attribute and EPIC-04 skill catalogs through `src/app/catalogs.ts`.
- Framework-neutral `validateBuild`, `calculateEffectiveAttributeRank`,
  `collectEquipmentAttributeRankAdjustments`, point-budget helpers, and template codecs.
- `compendium/build-composer-use-case.md`, `compendium/source-policy.md`, and
  `compendium/visual-prior-art.md` as product/source boundaries.

### Phase Dependencies

- BW-1801 freezes product and source boundaries before code movement.
- BW-1802 provides composition and document context for every focused component.
- BW-1803 establishes profession/name/mode semantics required by attributes and catalog defaults.
- BW-1804 can proceed alongside late BW-1807 work after BW-1803, but both must pass before final
  template and polish integration.
- BW-1807 precedes BW-1805 because catalog records provide placement and drag facts.
- BW-1805 precedes BW-1806 so inline export observes final bar mutation semantics.
- BW-1808 follows all icon-bearing interactions; BW-1809 follows every implementation ticket.
- Approved real icon binaries are not a blocking dependency. Their absence selects the required
  fallback branch.

## Open Questions

1. **Are any real icon binaries already approved for runtime use at exact local paths?** Default:
   assume no. Ship the local descriptor seam and CSS/text fallbacks; record a follow-up asset ticket
   unless a maintainer can point to an existing approval with provenance and bounded scope.
2. **Should a future product distinguish “not chosen,” “Any for browsing,” and “no secondary” as
   separate durable intentions?** Default for this sprint: no schema expansion. Use `null`, explicit
   UI copy, primary export blocking, and codec-supported secondary None semantics. Revisit only with
   a use case that requires the distinction across reloads.
3. **Should advanced workspace capabilities eventually become routes instead of a disclosure?**
   Default: defer. A route/navigation model is a separate product decision and is unnecessary to
   preserve current local workflows.
4. **Should touch drag/reorder be added after the desktop composer stabilizes?** Default: defer.
   Ensure complete tap/button and keyboard placement now, then evaluate pointer-event gestures with
   real-device evidence.
5. **Should future catalog tabs reuse the current full `BrowserState` or receive tab-specific query
   state?** Default: keep current skill browser state unchanged. Decide when a second implemented
   catalog tab has concrete requirements rather than pre-generalizing this sprint.

None of these questions blocks execution under the defaults above.
