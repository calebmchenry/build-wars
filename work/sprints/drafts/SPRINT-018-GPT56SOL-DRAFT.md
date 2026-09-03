---
id: SPRINT-018
title: Party Semantics and Sharing
status: draft
source_target: BACKLOG
source_epic: EPIC-17
source_epic_path: work/tickets/17-party-and-hero-builder/EPIC.md
tickets:
  - BW-1702
  - BW-1703
  - BW-1704
  - BW-1705
  - BW-1706
created: 2026-09-03
updated: 2026-09-03
---

# Sprint 018: Party Semantics and Sharing

## Overview

This sprint lets a neutral SPRINT-017 build set opt into party semantics without changing what a
build-set entry means. The existing ordered collection of complete loadouts remains authoritative
for loadout content and for `BuildSetEntryKind = "build" | "variant" | "freeform"`. An optional,
versioned party annotation supplies party mode, ordered member slots, empty slots, party-specific
member labels, freeform roles, lightweight member-kind labels, notes, and party-size presets.

The annotation references build-set entries by stable ID. An occupied party slot points to one
ordinary complete loadout; an empty slot has a null entry reference. Party order is the order of the
slot array and is deliberately independent of neutral build-set entry order. This avoids nullable or
partial loadout payloads, preserves variant/comparison workflows, and permits unassigned loadouts to
remain in the underlying set when a member is cleared. A member removal detaches the slot rather than
silently deleting its loadout; deletion of an underlying loadout remains a separate confirmed
build-set action.

Party mode is reversible. A build set that has never used party mode stores no annotation. Turning
party mode off retains a dormant annotation so re-enabling restores slot order and party metadata;
an explicit confirmed Reset Party action is the only way to discard those annotations. Neither
operation changes loadout content. Existing single-build documents and build sets that never opt in
continue to render and persist exactly as neutral documents.

`src/domain/party.ts` is replaced as a lightweight annotation contract rather than expanded into a
second `PartyBuild` loadout graph. The framework-neutral `BuildSet` schema stays party-neutral. The
app-owned persisted build-set snapshot advances to its own schema version 2, decoupled from the
domain build-set schema version, and carries `party` plus durable selected-party-slot state. Existing
persisted build-set snapshots migrate in memory to `party: null`; the local-library envelope remains
schema 2 under `build-wars:v1`. Migration alone must not dirty a draft, increment a revision, or
write storage.

The party workspace reuses the one-active-editor architecture. Selecting an occupied slot performs
the existing atomic snapshot/hydrate transition to its referenced entry. Selecting an empty slot
snapshots the outgoing editor, leaves all entries inactive, and shows a focused empty-member action
instead of a phantom build. Filling or assigning that slot establishes the active entry. This small
extension permits empty slots and no selected member while retaining one canonical editor and one
materialization path for save, autosave, validation, backup, transfer, and sharing.

Party validation is a separate structural and aggregate layer. It maps existing per-loadout
validation results to slots and adds only deterministic checks for slot structure, required empty
slots, preset-size mismatch, missing or duplicate entry assignments, incomplete/unresolved members,
unknown or mixed modes, and malformed ordering. It does not add party rules to `validateBuild`, bump
`RULE_ENGINE_VERSION`, block editing, rank builds, score synergy, infer roles, or recommend party
composition.

Lossless sharing uses a distinct inert `build-wars-party-transfer` JSON envelope containing the
complete persisted build set and its party annotation. Existing build-set transfer and whole-library
backup also preserve party metadata. A deterministic multi-code text projection lists every party
slot in party order and includes a proven skill-template code where representable, explicit empty or
unavailable markers otherwise, and per-member omission notices for equipment and title overrides.
It may copy a transparent partial result, but it never presents that text as lossless; native party
JSON is the recovery format. Existing share URLs remain selected-member-only and explicitly warn
that sibling members and party metadata are omitted.

The sprint intentionally excludes a hero/henchman catalog, canonical hero identity, portraits,
unlock tracking, AI behavior, paw-ned2 or another external team codec, hosted sharing, accounts,
backend sync, collaboration, guide publishing, consumables, recommendations, and new runtime
dependencies. Existing promoted profession, skill, title, and equipment catalog views may summarize
member loadouts, but generated data imports remain isolated to `src/app/catalogs.ts`.

Planning assumes BW-1702 through BW-1706 are groomed and dependency ordered, SPRINT-017's 16-entry
cap and schema-2 library are stable inputs, and the current local-first editor remains the sole
loadout editor. The non-interactive planning run needs no interview because the high-risk choices
are resolved below with backward-compatible, non-destructive defaults. BW-1701 remains a backlog
parking-lot ticket and is not part of this sprint. This draft plans implementation only; it does not
authorize implementation changes or commits.

## Use Cases

1. **Keep a neutral build set**: A user who does not enable party mode retains the SPRINT-017
   navigator, variants, comparison, aggregate status, local save/load, backup, transfer, template,
   and selected-loadout sharing behavior.
2. **Enable party mode on an existing set**: Current entries become occupied slots in their existing
   order, receive independent party labels copied initially from entry labels, and keep their
   original entry IDs, kinds, notes, and loadouts.
3. **Start an empty party**: An empty build set can enable party mode with four empty slots and a
   clear Create Member or Assign Existing action, without materializing phantom builds.
4. **Use a common size**: A user can choose 2, 4, 6, 8, or 12 slots, or a custom size from 1 through
   16. Growing adds empty slots; shrinking never discards an assigned member or authored slot
   metadata silently.
5. **Describe a member without a catalog**: A slot can have a bounded user-authored label, role,
   notes, and a member kind of unspecified, player, hero, mercenary, guest, or freeform with a
   custom kind label.
6. **Select and edit a member**: Selecting an occupied slot exposes its existing profession,
   attributes, eight-skill bar, title ranks, equipment, template controls, and validation panel in
   the one canonical editor.
7. **Inspect the whole party**: Every slot remains visible as a compact card showing position,
   member label, role, kind, profession pair, mode, skill bar, equipment/title summary, and status.
8. **Work with an empty slot**: Selecting an empty slot stores the outgoing member safely and shows
   actions to create a blank loadout or assign an unassigned set entry; template and selected-member
   share actions are disabled until the slot is occupied.
9. **Clear a member safely**: Clearing a slot makes it empty while preserving the underlying build
   entry as an unassigned loadout and retaining the slot's authored label, role, kind, and notes.
10. **Assign existing work**: A user can assign an unassigned loadout to an empty slot without
    cloning, mutating, or reclassifying the entry.
11. **Add a new member**: Creating a member in an empty slot adds a normal complete persisted build
    entry with fresh entry/build IDs and selects it for editing.
12. **Duplicate a member**: A user can deep-copy an occupied member into the next empty slot, with
    fresh entry/build identity and copied party metadata, while preserving the source and its
    neutral entry kind.
13. **Reorder the party**: Move Earlier and Move Later reorder party slots by stable slot ID without
    changing build-set entry order, comparison targets, or loadout content.
14. **Switch party mode off and on**: The neutral build-set view returns without losing loadouts;
    re-enabling party mode restores the dormant slot mapping and metadata.
15. **Understand party issues**: A party overview distinguishes errors, warnings, incomplete
    members, unresolved members, empty required slots, catalog-unavailable state, and mixed modes,
    with links to occupied affected slots.
16. **Continue editing through issues**: Structural or aggregate party problems never disable the
    selected member's editor, and per-loadout issue details remain in the existing Validation Panel.
17. **Import a selected member template**: Skill-template import replaces only the occupied selected
    member's loadout state after the existing confirmation while retaining its slot label, role,
    member kind, notes, slot ID, and entry ID.
18. **Copy party skill codes**: A user previews deterministic one-code-per-member text, sees empty,
    unavailable, and lossy-member counts, and copies the bounded text only through an explicit
    action.
19. **Recover the complete party**: Native party JSON round-trips all entries, empty slots, party
    ordering, labels, roles, kinds, notes, unresolved raw facts, equipment, title overrides, and
    selection state through preview and dirty-guarded apply.
20. **Preserve all local workflows**: Working-draft autosave, pagehide flush, Save New, Update, Save
    As New, load, saved-record duplication, backup, restore, and build-set transfer retain party
    annotations without silent downgrade.
21. **Search saved parties**: Library rows identify an enabled party, summarize its occupied and
    empty slots, and match member labels, roles, kind labels, notes, professions, modes, skills, and
    existing record metadata.
22. **Share one member by URL**: The current share URL remains a skill-template URL for the occupied
    selected member and warns that party order, sibling members, slot metadata, equipment, and title
    overrides are not included.
23. **Use narrow screens and keyboard navigation**: Slot selection, reorder, member actions,
    validation links, preset controls, dialogs, and overflow remain reachable with visible focus and
    no page-level horizontal overlap.
24. **Reject unsafe input**: Oversized, malformed, unsupported, sparse, duplicate-ID,
    dangerous-key, dangling-reference, or over-limit party data produces bounded diagnostics and
    never partially replaces the current draft.

## Architecture

### Scope Boundary

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| Domain | Versioned party annotations over stable build-set entry IDs; slot IDs; ordered nullable references; labels, roles, member kinds, notes, presets, normalization, and structural validation helpers. | A second loadout graph, hero/henchman catalog records, canonical NPC identity, portraits, AI flags, unlocks, account state, party recommendations. |
| Workspace | Reversible party mode, occupied/empty selection, assign/clear/create/duplicate/reorder/preset actions, unassigned loadouts, atomic editor switching, and materialized snapshots. | Multiple simultaneous editors, linked saved records, cross-tab collaboration, drag-and-drop as the only reorder path, undo history. |
| Persistence | Persisted build-set snapshot v2, nested v1 migration, dormant annotations, selected-slot resume state, cloning/re-keying, fingerprints, local saves, backup/restore, and transfer preservation. | A new localStorage key, a new top-level library document kind, eager migration writes, IndexedDB, cloud storage, destructive downgrade. |
| UI | Party header, slot cards, compact summaries, empty and unassigned states, preset/custom sizing, member metadata, validation overview, responsive and accessible controls. | Portrait assets, pixel-perfect game UI, full party-window reconstruction, hero chooser, remote images, simultaneous full editors. |
| Validation | Structural party codes, per-member aggregation, incomplete/unresolved/empty states, preset consistency, obvious PvE/PvP mismatch, deterministic order, and navigation. | Synergy scoring, build quality, optimal roles, duplicate-skill strategy, speed-clear meta, PvP format legality, hero AI advice. |
| Sharing | Native party JSON, existing build-set/backup preservation, deterministic multi-code text, selected-member URL/template boundaries, previews, bounds, and fallbacks. | paw-ned2, external team templates, whole-party URLs, short links, hosting, publishing, accounts, permissions, backend sync. |

### Binding Decisions

1. Keep `src/domain/build-set.ts` and `BuildSetEntryKind` semantically unchanged. Party member kind,
   member role, slot order, and empty-slot state never overload entry kind, entry notes, or build-set
   entry order.
2. Replace the placeholder `PartyBuild` graph in `src/domain/party.ts` with a versioned
   `PartyAnnotations` contract keyed to `BuildSetEntryId`. No code should store another `Build`
   inside party annotations.
3. The domain `BuildSet` remains schema version 1 and party-neutral. Introduce a distinct app-owned
   persisted build-set snapshot schema version 2 so party persistence can evolve without claiming
   the neutral domain contract changed.
4. `PersistedBuildSetSnapshotV2` adds `party: PartyAnnotations | null` and
   `lastSelectedPartySlotId: PartySlotId | null`. These fields are carried beside the existing
   neutral set fields and do not introduce a third top-level library document kind.
5. `party: null` means never configured or explicitly reset. `party.enabled: false` means configured
   but dormant. Disable is reversible and preserves all annotations; Reset Party requires
   confirmation, sets `party` to null, and never deletes loadouts.
6. Party slot array position is the sole party ordering source. No persisted numeric position,
   linked-list pointer, object-key order, or entry-array order is treated as party order.
7. A slot has a stable `PartySlotId` and an `entryId: BuildSetEntryId | null`. Null is the only empty
   representation. Build-set entries continue to carry complete `PersistedBuildSnapshot` payloads.
8. A build-set entry may be referenced by at most one party slot. Entries not referenced by an
   enabled or dormant annotation are valid unassigned loadouts and remain accessible from party
   assignment controls and the neutral view.
9. Party member labels, roles, kinds, custom kind labels, and notes belong to slots. They are
   independent of neutral entry labels, kinds, and notes so party authoring cannot reinterpret a
   variants/comparison set.
10. Built-in size presets are `2`, `4`, `6`, `8`, and `12`; custom size supports every integer from
    1 through the existing 16-entry ceiling. Slot count is canonical; a fixed preset whose declared
    size differs from `slots.length` is invalid.
11. Enabling a never-configured nonempty set creates one occupied slot per entry. An exact supported
    count selects that preset; other counts select custom. Enabling an empty set creates four empty
    slots. Re-enabling a dormant annotation restores it unchanged.
12. Preset growth appends default empty slots. Shrink succeeds only when every removed trailing slot
    is empty and has default metadata; otherwise it is blocked with a reason. The user must move,
    clear, or reset those slots explicitly before shrinking.
13. Clearing a member sets only the slot's `entryId` to null. It retains party metadata and leaves
    the underlying entry in the build set. Deleting a loadout remains a separate confirmed action
    that also clears its party reference atomically.
14. Creating a member in an empty slot adds a regular build-set entry with fresh entry/build IDs and
    assigns it. Assign Existing references an unassigned entry without cloning. Neither action
    modifies `BuildSetEntryKind` to encode party semantics.
15. Duplicating a party member deep-clones the complete persisted snapshot, assigns fresh entry and
    nested build IDs, preserves the source neutral entry kind, and copies slot metadata into the
    next empty slot. If no empty slot exists, only a custom party below 16 may grow; a full fixed
    preset blocks the action with a clear explanation.
16. Runtime state permits zero or one active build-set entry. Selecting an occupied slot uses the
    SPRINT-017 atomic snapshot/hydrate transition. Selecting an empty slot snapshots the outgoing
    editor, stores every entry inactive, sets selected entry to null, and renders no editor.
17. A blank `EditorState` may remain as the existing workspace placeholder when no member is
    selected, but reducers and selectors must treat `selectedEntryId === null` as no active loadout.
    Materialization must never substitute that placeholder for an inactive entry.
18. In enabled party mode, `lastSelectedPartySlotId` is durable resume state. A stale slot ID repairs
    to the first occupied slot, otherwise the first slot, otherwise null, with a bounded diagnostic.
    Party selection is excluded from authored-content dirty status but included in the working-draft
    persistence fingerprint.
19. Selecting an occupied party slot aligns selected slot and selected entry IDs through the slot
    reference. Selecting an empty slot makes selected entry null. Disabling party mode repairs the
    neutral selected entry to the most recently occupied selection or first entry.
20. Every editor action, template action, selected-loadout share, validation detail, and summary
    obtains its target through one shared selected-loadout resolver. No component may fall back to
    the first entry when an enabled party has an empty selected slot.
21. Party authored-content fingerprints include enabled state, preset, slot order, slot references,
    labels, roles, kinds, custom labels, and notes. They exclude last selected slot and other UI
    state. Working-draft fingerprints include both selected entry and selected party slot.
22. The outer local-library envelope remains schema 2 and the storage key remains `build-wars:v1`.
    Nested persisted build-set snapshot v1 migrates in memory to v2 with `party: null` and null party
    selection. No read-only migration write, revision bump, or dirty state is allowed.
23. Saved-record duplication re-keys set ID, entry IDs, nested build IDs, party slot IDs, slot entry
    references, and selected references through explicit old-to-new maps. Metadata and values are
    deep-copied; no duplicate may retain a reference into the source identity graph.
24. Existing build-set transfer remains the general neutral transfer and preserves party annotations
    when present. Its framing version may remain 1 because the nested snapshot has its own version;
    legacy nested snapshots migrate through the same parser.
25. Add a distinct `build-wars-party-transfer` schema-1 envelope for an enabled party. It embeds one
    normalized persisted build-set snapshot rather than defining a second party/loadout payload.
26. Party transfer import is a previewed whole-draft replacement. It requires an enabled party
    annotation, enforces byte and structural caps, uses the dirty guard, applies once, and hydrates an
    unassociated build-set draft requiring Save New for a named record.
27. Native party JSON is the only lossless party exchange path. It preserves unassigned entries as
    part of the underlying build set as well as occupied members, empty slots, party metadata, raw
    template facts, equipment, and title overrides.
28. Multi-code text is a deterministic convenience projection, not an import format and not a Guild
    Wars team code. Each slot produces exactly one labeled block in party order: a proven code and
    fidelity when available, `[empty]` for an empty slot, or `[unavailable: reason codes]` otherwise.
29. Multi-code projection reuses `selectShareTemplateExport` independently for each occupied slot.
    Meaningful equipment and title overrides do not suppress an otherwise safe code but add explicit
    per-member omission markers. Unresolved/unrepresentable skill-template state yields no code.
30. A bounded partial multi-code result may be copied only with explicit counts and copy text such as
    `Copy 5 available codes`; missing members remain visible in the copied text. No UI says Copy All
    when some member has no code.
31. Whole-party URLs are not added. Existing share URLs and template controls target only an occupied
    selected member and retain existing code/URL limits and omission warnings, expanded to name
    sibling members and party metadata.
32. Party structural validation is framework-neutral. App aggregation maps slots to existing
    per-loadout validation results and catalog-backed summaries; it does not import generated JSON
    into the domain or add cross-build rules to `validateBuild`.
33. Mixed known PvE and PvP modes produce a party warning, not an error, because this sprint does not
    model a specific game format. Unknown mode produces member incompleteness/unresolved status and
    is excluded from the known-mode mismatch comparison.
34. Structural party errors do not block editing. They block unsafe import/apply when discovered at
    an untrusted-data boundary; in-memory validator output remains displayable and deterministic for
    tests and defensive recovery states.
35. The party view replaces the neutral card list while party mode is enabled but keeps neutral
    operations reachable through an Unassigned Loadouts disclosure and a Disable Party Mode action.
    Existing comparison and build-set transfer remain available without duplicating full editors.
36. Slot cards use text and local CSS placeholders, not portraits. Existing prior-art observations
    may inform compact selection framing, but no screenshot, icon, remote URL, or full party-window
    layout is copied or imported.
37. No new npm/Python package, route, backend, worker, network request, generated data pipeline,
    environment variable, remote media, account concept, or external codec is required.

### Contract Shapes

Preferred shapes follow; exact TypeScript names may follow repository style, but the separation and
invariants are binding.

```text
PARTY_ANNOTATION_SCHEMA_VERSION = 1
MAX_PARTY_SLOTS = MAX_BUILD_SET_ENTRIES = 16
PARTY_SIZE_PRESETS = [2, 4, 6, 8, 12]

PartySlotId = branded bounded string
PartySizePreset = 2 | 4 | 6 | 8 | 12 | "custom"
PartyMemberKind =
  "unspecified" | "player" | "hero" | "mercenary" | "guest" | "freeform"

PartySlotAnnotation
  id: PartySlotId
  entryId: BuildSetEntryId | null
  memberLabel: string
  role: string | null
  memberKind: PartyMemberKind
  memberKindLabel: string | null
  notes: string | null

PartyAnnotations
  schemaVersion: 1
  enabled: boolean
  sizePreset: PartySizePreset
  slots: readonly PartySlotAnnotation[]
```

`memberKindLabel` is non-null only for `memberKind: "freeform"`; all other kinds normalize it to
null. Labels are capped at 120 characters, roles at 120, freeform kind labels at 80, and notes at
1,000. Empty optional text normalizes to null on authored mutation. Parser validation rejects
over-limit strings rather than truncating untrusted input.

```text
PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION = 2
LEGACY_PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION = 1

PersistedBuildSetSnapshotV2
  schemaVersion: 2
  id: AuthoredDocumentId
  name: string
  entries: readonly PersistedBuildSetEntrySnapshot[]
  lastSelectedEntryId: BuildSetEntryId | null
  party: PartyAnnotations | null
  lastSelectedPartySlotId: PartySlotId | null
```

The domain `BuildSet` remains version 1. Domain conversion receives only `id`, `name`, and complete
entries. Party annotation and selected-slot state are app/persistence companions, never fields on a
`Build` or `BuildSetEntry`.

### State and Transition Invariants

```text
Runtime build-set document
  neutral set identity and metadata
  entries:
    zero or one ActiveEntry -> live EditorState
    every other entry -> PersistedBuildSnapshot
  selectedEntryId: BuildSetEntryId | null
  party:
    null
    or RuntimePartyState
      annotation: PartyAnnotations
      selectedSlotId: PartySlotId | null
  comparisonEntryId: BuildSetEntryId | null
```

- `enableParty`: materializes the active set, restores a dormant annotation or creates a new one,
  repairs selection, and leaves every loadout unchanged.
- `disableParty`: flips only `party.enabled`, chooses a valid neutral active entry when needed, and
  preserves the entire annotation for later re-enable.
- `resetParty`: requires confirmation, clears party annotation/selection only, restores a valid
  neutral selection, and preserves every build-set entry.
- `selectPartySlot`: addresses a stable slot ID. Occupied selection snapshots the outgoing active
  editor and hydrates the referenced entry; empty selection snapshots the outgoing editor and leaves
  all entries inactive with no selected entry.
- `assignEntryToSlot`: accepts only an existing unassigned entry and an empty slot, then selects and
  hydrates the entry. It is a no-op for stale IDs, duplicates, occupied targets, or disabled party
  mode.
- `createMemberInSlot`: checks both slot and entry caps, creates fresh entry/build IDs supplied by the
  caller, assigns the new entry, and selects it in one pure transaction.
- `clearPartyMember`: detaches the entry, preserves slot metadata and the entry snapshot, and repairs
  member selection to the next occupied slot, then previous occupied slot, then the cleared empty
  slot.
- `duplicatePartyMember`: deep-copies the materialized source entry and slot metadata into an empty
  target or permitted new custom slot, creates fresh IDs, and selects the copy.
- `movePartySlot`: moves by stable slot ID and direction. It does not mutate entry order, selection,
  comparison identity, or loadout snapshots.
- `resizeParty`: grows with new stable empty slots; shrinking removes only default empty trailing
  slots. Reorder is required before a non-trailing member can be retained during shrink.
- `removeBuildSetEntry`: materializes current editor state, clears any party reference, removes the
  entry through existing behavior, repairs both selections and comparison target, and never leaves a
  dangling reference.
- `replace-state` template import is accepted only for an occupied selected member and preserves all
  entry and slot metadata. It cannot target the placeholder editor behind an empty slot.

All transitions are pure, ID-addressed, and cap-aware. UI confirmation belongs outside reducers;
reducers receive explicit confirmed intent and remain deterministic in tests.

### Persistence, Migration, and Durability

Nested migration is centralized in the persisted-document parser:

1. Parse the outer library/backup/transfer envelope with existing kind, version, size, dangerous-key,
   dense-array, and bounded-diagnostic checks.
2. Dispatch persisted build-set snapshots by their own version. Version 1 is validated using its
   exact old fields, then reconstructed as version 2 with `party: null` and null selected party slot.
3. Validate version 2 party annotations field by field, including slot count, slot IDs, entry
   references, duplicate assignments, enum values, preset/count agreement, text bounds, and selected
   slot reference.
4. Preserve structurally valid unknown catalog IDs and raw template overlays in referenced entries;
   party parsing does not require current catalog membership.
5. Hydrate runtime state and compute both authored and durable fingerprints from the same normalized
   version-2 snapshot. A migration read therefore produces no autosave by itself.
6. On the next authorized mutation, existing revision conflict checks write the normalized current
   envelope to the same `build-wars:v1` key. No dual write or key deletion is introduced.

Working drafts, named records, record duplication, load, Save New, Update, Save As New, autosave,
pagehide, whole-library backup, merge/replace restore, build-set transfer, and party transfer must all
call the same materialize/clone/parse functions. No ingress or egress path may hand-construct a
different party shape.

Build-set transfer and backup retain their outer versions unless another framing change is required;
their nested parser accepts build-set snapshot versions 1 and 2. Party transfer is a thin semantic
wrapper over that same snapshot parser, not a parallel serializer or migration path. It has its own
kind so a party file cannot be mislabeled as an external team template or silently treated as a
neutral-only format. An older deployment that cannot parse nested version 2 follows
unsupported/write-blocked behavior rather than dropping annotations.

### Party Validation Contract

`validatePartyAnnotations` owns structural facts without catalogs or editor state. App-level
`selectPartyValidationView` combines that output with existing per-loadout `ValidationResult`s. The
preferred stable issue codes are:

| Code | Severity/state | Meaning |
| --- | --- | --- |
| `party.unsupported-schema-version` | error | Annotation version is unsupported. |
| `party.too-many-slots` | error | Slot count exceeds 16. |
| `party.slot-order-invalid` | error | Slot array is sparse or cannot establish a dense canonical order. |
| `party.duplicate-slot-id` | error | A later slot repeats a stable slot ID. |
| `party.preset-size-mismatch` | error | Fixed preset and actual slot count differ. |
| `party.missing-entry-reference` | error | An occupied slot references no current build-set entry. |
| `party.duplicate-entry-assignment` | error | One build-set entry is assigned to multiple slots. |
| `party.empty-required-slot` | warning/incomplete | A declared party slot has no member. |
| `party.member-incomplete` | warning/incomplete | Referenced loadout validation is incomplete. |
| `party.member-unresolved` | warning/unresolved | Referenced loadout contains unresolved or catalog-unavailable facts. |
| `party.member-mode-unknown` | warning/incomplete | Occupied member mode is unknown. |
| `party.mode-mismatch` | warning | Occupied members contain both known PvE and PvP modes. |

Each issue has deterministic severity, code, plain message, slot ID/index when applicable, entry ID
when applicable, and stable path. Ordering is structural rule order, then numeric slot index, entry
ID, and code; it must not depend on locale, catalog order, object insertion order, or wall clock.

Per-loadout errors and warnings retain their existing codes and detail panels. The party aggregate
counts slots with loadout errors, loadout warnings, incomplete state, unresolved state, empty state,
stale facts, and catalog unavailability. Dimensions may overlap. Overall display precedence is
structural error, loadout error, unresolved, incomplete/empty, warning, then ready. This is a UI
summary, not a new `ValidationResult` definition or export policy.

### Party Workspace and Responsive Layout

`BuildSetNavigator` remains the build-set entry point and header owner. It exposes Enable/Disable
Party Mode and delegates enabled rendering to `PartyWorkspace`, while the existing neutral list
remains the default. Party mode shows:

- party name inherited from the build-set name, enabled state, occupied/slot count, preset/custom
  size controls, validation summary, native party transfer, multi-code copy, and overflow actions;
- one ordered card per slot with a visible ordinal, member label, role, member-kind text, notes
  indicator, profession pair, mode, eight compact skill states, equipment/title indicators, and
  non-color status text;
- empty cards with Create Member and Assign Existing actions, without a fake profession, build ID,
  or editable placeholder loadout;
- member actions for select, clear, duplicate, edit metadata, move earlier/later, and reset slot
  metadata, with destructive or data-discarding actions confirmed;
- an Unassigned Loadouts disclosure listing existing entries not referenced by a slot, with assign,
  select-in-neutral-view, and confirmed delete choices;
- the existing selected editor below the party strip for occupied slots, or a focused empty-member
  panel for an empty/no selection.

Desktop uses a bounded horizontal or grid party strip above the one editor. Narrow widths switch to
a vertical list with wrapping labels and actions; the viewport must not scroll horizontally. Slot
cards are a labeled navigation list with separate native selection and action buttons, not nested
buttons or a fabricated ARIA tab pattern. Tab/Shift+Tab, Enter/Space, visible focus, disabled reasons,
dialog focus containment/restoration, and polite result announcements follow existing app patterns.
Pointer reordering is optional; Move Earlier/Move Later is required and canonical.

The prior-art party strip is a structural reference for compact selection only. Since the repository
has no complete party-window reference and runtime portraits are out of scope, the implementation
uses accessible text/skill summaries and local CSS framing. Long labels, roles, kind labels, notes,
16-slot overflow, empty parties, one-member parties, no selection, and maximum-width skill summaries
receive component and manual responsive coverage.

### Sharing and Transfer Formats

Preferred native party envelope:

```text
PartyTransferEnvelopeV1
  schemaVersion: 1
  kind: "build-wars-party-transfer"
  exportedAt: ISO timestamp
  buildSet: PersistedBuildSetSnapshotV2
  metadata:
    declaredEntryCount: integer
    declaredSlotCount: integer
```

The parser treats `metadata` counts as claims, reconstructs normalized counts from the accepted
payload, and emits or rejects mismatches consistently. It rejects absent/dormant party annotations,
unsupported envelope or nested versions, malformed timestamps, dangerous keys, duplicate IDs,
dangling or duplicate assignments, sparse arrays, over-limit collections, and byte-limit overflow
before hydration. Export uses stable JSON ordering while preserving semantically ordered arrays.

Preferred multi-code text grammar:

```text
Build Wars Party Codes v1
Party: <bounded party name>
Members: <occupied>/<slots>

1. <member label> | <kind label> | <role or no role>
Code: <bare or chat-wrapped proven skill template code>
Fidelity: exact-source | canonical
Omitted: equipment, title overrides

2. <member label>
Status: [empty]

3. <member label>
Status: [unavailable: incomplete-bar, unresolved-skill]
```

The output is plain text, deterministic, and capped at 32,000 UTF-8 bytes. Labels and reasons are
line-normalized so user text cannot forge extra structural lines; complete notes are excluded from
multi-code text and remain in native JSON. If the output exceeds the cap, clipboard copy is blocked
while native JSON export remains available. Clipboard denial leaves the preview selectable. No
automatic clipboard write, URL navigation, upload, or external codec invocation occurs.

## Implementation

### Phase 0: Baseline and Contract Freeze (~5% of effort)

**Tickets:** BW-1702

**Files:**

- `work/sprints/SPRINT-018.md`
- `work/tickets/17-party-and-hero-builder/*.md`
- `src/domain/build-set.ts`
- `src/domain/party.ts`
- `src/app/build-set-state.test.ts`
- `src/app/workspace-state.test.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/backup-restore.test.ts`
- `src/app/build-set-transfer.test.ts`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Mark SPRINT-018 and BW-1702 in progress when execution begins; keep BW-1701 backlog and
      untouched by implementation scope.
- [ ] Run focused baselines for neutral build sets, switching, duplicate/remove/reorder, comparison,
      aggregate validation, schema-1/2 migration, save/load/autosave, backup/restore, build-set
      transfer, selected-loadout template import/export, share URLs, equipment, and title overrides.
- [ ] Freeze the annotation/reference model, dormant disable semantics, preset list, 16-slot cap,
      nullable empty slots, independent slot order, non-destructive clear behavior, persisted
      snapshot v2 migration, distinct party transfer, and multi-code grammar.
- [ ] Add immutable persisted build-set-v1, build-set-transfer-v1, and mixed backup fixtures before
      changing parsing or cloning.
- [ ] Record that current `src/domain/party.ts` is a placeholder to replace, not a compatibility
      contract to extend.
- [ ] Confirm no new generated catalog, portrait/media, dependency, network, external codec, route,
      or backend work enters the sprint.

**Verification:**

- `npm run test:run -- src/app/build-set-state.test.ts src/app/workspace-state.test.ts src/app/persistence-schema.test.ts src/app/backup-restore.test.ts src/app/build-set-transfer.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Gate:** Baseline fixtures pass before schema or state changes, and all binding decisions above are
represented in tests or explicit task acceptance.

### Phase 1: BW-1702 Party Contracts and Nested Migration (~20% of effort)

**Files:**

- `src/domain/party.ts`
- `src/domain/index.ts`
- `src/domain/build-set.ts`
- `test/domain/party.test.ts`
- `test/domain/contracts.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/library-fixtures.ts`

**Tasks:**

- [ ] Replace `PartyBuild`/embedded nullable builds with exported annotation contracts, branded slot
      IDs, presets, member kinds, bounds, normalizers, constructors, clone helpers, and structural
      validation.
- [ ] Keep `BuildSet`, `BuildSetEntry`, and `BuildSetEntryKind` unchanged and add contract tests that
      party annotations contain references only, never loadout copies.
- [ ] Implement deterministic enable-from-set construction: exact preset matching, custom counts,
      four-slot empty default, stable caller-supplied IDs, copied initial member labels, and no
      inferred hero/player identity.
- [ ] Cover dense order, unique slot IDs, at-most-one assignment, null empty slots, unassigned
      entries, member text normalization, freeform-kind label rules, fixed/custom size rules, and
      invalid defensive shapes.
- [ ] Decouple persisted build-set snapshot version from domain build-set version and add current
      snapshot v2 fields for party annotation and selected party slot.
- [ ] Implement exact nested v1-to-v2 migration and current v2 validation, cloning, serialization,
      and fingerprints without changing the outer local-library schema or storage key.
- [ ] Reject malformed annotation versions, sparse/oversized arrays, duplicate slot/entry IDs,
      dangling references, invalid enums, over-limit strings, and dangerous keys with bounded paths.
- [ ] Preserve unknown catalog IDs, raw template overlays, equipment, title overrides, selected
      entry, record metadata, saved-with facts, timestamps, revision, and association during
      migration.
- [ ] Prove valid migrated v1 data does not become dirty, write-blocked, or written merely because it
      was read.

**Verification:**

- `npm run test:run -- test/domain/party.test.ts test/domain/contracts.test.ts src/app/persistence-schema.test.ts`
- `npm run typecheck`

**Gate:** Version-1 neutral snapshots migrate losslessly and party v2 snapshots round-trip before any
party UI or workspace actions are added.

### Phase 2: BW-1702 Party Workspace State and Durability (~17% of effort)

**Files:**

- `src/app/party-state.ts`
- `src/app/party-state.test.ts`
- `src/app/build-set-state.ts`
- `src/app/build-set-state.test.ts`
- `src/app/workspace-state.ts`
- `src/app/workspace-state.test.ts`
- `src/app/local-storage.ts`
- `src/app/local-storage.test.ts`
- `src/app/library-fixtures.ts`

**Tasks:**

- [ ] Add runtime party annotation and selected-slot state to build-set documents while preserving
      single-build and neutral build-set discriminants.
- [ ] Generalize active/inactive invariants to zero or one active entry; remove unsafe materialization
      fallback from a missing snapshot to the placeholder editor.
- [ ] Implement enable, disable, confirmed reset, select occupied/empty slot, label, role, member
      kind/custom label, notes, preset/custom resize, move, assign existing, create member, clear
      member, duplicate member, and reset-slot-metadata transitions.
- [ ] Make every mutation stable-ID-addressed, deterministic, immutable, and cap-aware; pass all new
      IDs from action creators rather than generating them in reducers.
- [ ] Define non-destructive resize and clear behavior, unassigned-loadout projection, deterministic
      selected-slot/entry repair, and comparison cleanup.
- [ ] Update underlying loadout removal to clear party references atomically; prevent any operation
      from leaving duplicate or dangling assignments.
- [ ] Guard editor and template-replacement actions when enabled party mode has no occupied selected
      member.
- [ ] Update save/load/autosave/pagehide/materialization and dirty/durable fingerprints so authored
      party metadata dirties records while navigation alone does not.
- [ ] Re-key entry/build/slot/reference/selection identity maps during saved-record duplication and
      prove later mutations cannot affect the source.
- [ ] Cover conversion, disable/re-enable, empty selection, edit-switch-empty-switch, rapid switching,
      clear/assign, duplicate, resize failures, max cap, stale IDs, removal, pagehide, storage
      conflict, write-block, and reload sequences.

**Verification:**

- `npm run test:run -- src/app/party-state.test.ts src/app/build-set-state.test.ts src/app/workspace-state.test.ts src/app/local-storage.test.ts`
- `npm run typecheck`

**Gate:** All party transitions survive materialize/hydrate round trips and the entire existing
neutral build-set state suite remains green.

### Phase 3: BW-1703 Party Workspace UI and Selected Editor (~20% of effort)

**Files:**

- `src/app/party-selectors.ts`
- `src/app/party-selectors.test.ts`
- `src/app/build-set-selectors.ts`
- `src/app/build-set-selectors.test.ts`
- `src/app/components/BuildSetNavigator.tsx`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/components/PartyDialogs.tsx`
- `src/app/party-workspace.test.tsx`
- `src/app/components/TemplateDialogs.tsx`
- `src/app/template-dialogs.test.tsx`
- `src/app/components/LibraryPanel.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`

**Tasks:**

- [ ] Build a single party view model that joins slots to materialized entry summaries through
      existing catalog-backed selectors and reports occupied, empty, selected, unassigned, and
      action-disabled states.
- [ ] Branch `BuildSetNavigator` cleanly between neutral and enabled-party presentation; keep set
      name, transfer, comparison access, and Disable Party Mode visible without rendering duplicate
      full loadout editors.
- [ ] Render ordered compact slot cards with ordinal, label, role, kind, professions, mode, all eight
      skill states, equipment/title indicators, notes, and non-color attention text.
- [ ] Render explicit empty cards and an empty-member editor replacement with Create Member and
      Assign Existing flows; never expose the placeholder editor as a member.
- [ ] Add bounded dialogs or disclosures for member metadata, preset/custom sizing, unassigned
      loadouts, clear/reset confirmation, and duplicate failures using existing modal focus patterns.
- [ ] Wire select, create, assign, clear, duplicate, move, resize, disable, and reset actions with
      fresh deterministic IDs and concise live-region results.
- [ ] Keep profession, attribute, skill, title, equipment, template, and validation controls bound to
      the occupied selected member; preserve active edits through every slot transition.
- [ ] Ensure selected-loadout template import preserves slot metadata and is disabled with an empty
      selected slot.
- [ ] Make library Copy Into Set behavior explicit: it creates an unassigned loadout or assigns a
      user-selected empty slot, never guesses party placement.
- [ ] Implement responsive maximum-slot layouts, bounded internal overflow, wrapping text, visible
      focus, touch-sized actions, keyboard order, Escape close, focus restoration, and reduced-motion
      behavior.
- [ ] Use existing CSS and local placeholder treatment only; do not add portrait assets or import
      prior-art screenshots into runtime code.

**Verification:**

- `npm run test:run -- src/app/party-selectors.test.ts src/app/party-workspace.test.tsx src/app/build-set-navigator.test.tsx src/app/template-dialogs.test.tsx src/app/App.test.tsx`
- `npm run typecheck`

**Gate:** Empty, one-member, mixed occupied/empty, unassigned, and 16-slot parties remain operable by
keyboard and pointer at desktop and narrow widths with no lost active edits.

### Phase 4: BW-1704 Party Validation and Attention Navigation (~14% of effort)

**Files:**

- `src/domain/party.ts`
- `test/domain/party.test.ts`
- `src/app/party-validation.ts`
- `src/app/party-validation.test.ts`
- `src/app/party-selectors.ts`
- `src/app/party-selectors.test.ts`
- `src/app/components/PartyWorkspace.tsx`
- `src/app/party-workspace.test.tsx`
- `src/app/components/ValidationPanel.tsx`
- `src/app/editor-selectors.ts`

**Tasks:**

- [ ] Finalize deterministic structural issue codes, severity/state meanings, paths, slot/entry
      locations, sorting, count bounds, and truncation behavior.
- [ ] Aggregate the existing `selectValidationView` result independently for each occupied slot and
      preserve underlying issue codes/details rather than translating them into new game rules.
- [ ] Distinguish structural error, loadout error, warning, incomplete, unresolved, empty, stale, and
      catalog-unavailable dimensions with documented overall precedence.
- [ ] Add empty required slot, member incomplete, member unresolved, unknown mode, and mixed known
      PvE/PvP checks; ignore empty slots for mode comparison.
- [ ] Prove no role inference, hero legality, duplicate-skill advice, composition constraint, synergy
      score, format-specific size rule, or recommendation enters validation.
- [ ] Render a party overview and ordered attention rows that select occupied members or focus empty
      slot actions; preserve the existing selected member Validation Panel for detailed build issues.
- [ ] Keep editing available regardless of party validation state and keep `RULE_ENGINE_VERSION`
      unchanged.
- [ ] Test invalid defensive annotations directly, valid runtime states, overlapping dimensions,
      catalog-unavailable state, issue caps, deterministic ordering, empty parties, one-member
      parties, and mixed modes.

**Verification:**

- `npm run test:run -- test/domain/party.test.ts src/app/party-validation.test.ts src/app/party-selectors.test.ts src/app/party-workspace.test.tsx test/domain/rule-engine.test.ts src/app/build-set-selectors.test.ts`
- `npm run typecheck`

**Gate:** Party validation is narrow, deterministic, non-blocking, and demonstrably separate from
the existing game rule engine.

### Phase 5: BW-1705 Native Party Transfer, Multi-Code Copy, and Local Recovery (~19% of effort)

**Files:**

- `src/app/party-transfer.ts`
- `src/app/party-transfer.test.ts`
- `src/app/party-sharing.ts`
- `src/app/party-sharing.test.ts`
- `src/app/components/PartyTransferDialog.tsx`
- `src/app/party-transfer-dialog.test.tsx`
- `src/app/components/PartySharePanel.tsx`
- `src/app/party-share-panel.test.tsx`
- `src/app/build-set-transfer.ts`
- `src/app/build-set-transfer.test.ts`
- `src/app/components/BuildSetTransferDialog.tsx`
- `src/app/build-set-transfer-dialog.test.tsx`
- `src/app/backup-restore.ts`
- `src/app/backup-restore.test.ts`
- `src/app/persistence-schema.ts`
- `src/app/persistence-schema.test.ts`
- `src/app/library-selectors.ts`
- `src/app/library-selectors.test.ts`
- `src/app/components/LibraryPanel.tsx`
- `src/app/components/ShareControls.tsx`
- `src/app/template-workflow.ts`
- `src/app/template-workflow.test.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`

**Tasks:**

- [ ] Implement distinct party transfer create/serialize/parse/preview/apply helpers using one
      normalized complete persisted build-set snapshot and sanitized deterministic filenames.
- [ ] Factor and reuse the existing bounded persisted-build-set parser, clone, migration, and
      serializer primitives; the party envelope may add semantic checks but must not fork the nested
      snapshot contract or accept data rejected by general build-set transfer.
- [ ] Enforce the existing 240,000-byte transfer ceiling or a smaller measured ceiling consistently,
      plus slot/entry/string/diagnostic caps, dangerous-key rejection, supported versions, declared
      count checks, stable serialization, single-use apply, and dirty-guarded replacement.
- [ ] Preserve every loadout field, unresolved raw fact, unassigned entry, empty slot, party label,
      role, kind, custom label, note, order, preset, enabled state, and durable selection through
      native export/import.
- [ ] Extend general build-set transfer to round-trip current party annotations and migrate legacy
      neutral snapshots without changing its claim or silently stripping dormant metadata.
- [ ] Prove whole-library backup and working-draft/saved-record restore preserve party metadata in
      merge and replace modes, including ID remaps, skipped records, draft opt-in, all-invalid
      anti-wipe, and write-blocked recovery.
- [ ] Implement multi-code projection by materializing every occupied member and applying existing
      exact-source/canonical template export policy independently.
- [ ] Include every slot in deterministic text with code/fidelity, empty marker, unavailable reason
      codes, and equipment/title omission markers; normalize line-breaking user text and cap output
      at 32,000 UTF-8 bytes.
- [ ] Present occupied, code-available, empty, unavailable, and lossy counts before copy. Allow
      transparent partial copy with accurate button text; block empty or oversized results and leave
      text selectable on clipboard denial.
- [ ] Keep selected-member share URLs and template text byte/grammar compatible. Expand warnings for
      sibling members and party metadata, and prevent fallback to another entry for an empty selected
      slot.
- [ ] Update library summaries/search to identify enabled parties, report occupied/empty counts, and
      include bounded member labels, roles, custom kind labels, and notes while retaining record-level
      filters, sort, tags, favorite, freshness, and diagnostics.
- [ ] Test malformed JSON, unsupported versions, stale selection, duplicate IDs/references,
      dangerous keys, byte boundaries, preset mismatch, partial code availability, exact/canonical
      fidelity, unresolved members, empty slots, equipment/title omissions, clipboard failure,
      imported neutral set rejection in party transfer, and build-set/backup compatibility.

**Verification:**

- `npm run test:run -- src/app/party-transfer.test.ts src/app/party-transfer-dialog.test.tsx src/app/party-sharing.test.ts src/app/party-share-panel.test.tsx src/app/build-set-transfer.test.ts src/app/build-set-transfer-dialog.test.tsx src/app/backup-restore.test.ts src/app/persistence-schema.test.ts src/app/library-selectors.test.ts src/app/template-workflow.test.ts src/app/share-url.test.ts src/app/App.test.tsx`
- `npm run typecheck`

**Gate:** Native JSON is lossless across every local/transfer path, multi-code loss is explicit, and
all previous neutral transfer, backup, template, and share fixtures still pass.

### Phase 6: BW-1706 Documentation, Regression, and Closeout (~5% of effort)

**Files:**

- `README.md`
- `compendium/multi-build-workspace.md`
- `compendium/local-library-and-sharing.md`
- `compendium/core-build-editor.md`
- `compendium/game-rule-engine.md`
- `compendium/visual-prior-art.md`
- `work/tickets/17-party-and-hero-builder/EPIC.md`
- `work/tickets/17-party-and-hero-builder/BW-1702-party-annotations-and-presets.md`
- `work/tickets/17-party-and-hero-builder/BW-1703-party-workspace-ui.md`
- `work/tickets/17-party-and-hero-builder/BW-1704-party-validation.md`
- `work/tickets/17-party-and-hero-builder/BW-1705-party-export-and-sharing.md`
- `work/tickets/17-party-and-hero-builder/BW-1706-party-docs-and-closeout.md`
- `work/tickets/17-party-and-hero-builder/BW-1701-pawned2-template-integration.md`
- `work/sprints/SPRINT-018.md`
- `work/sprints/ledger.tsv`
- `work/runs/ticket-burn/BACKLOG/20260903T014346Z/plan-EPIC-17-result.json`

**Tasks:**

- [ ] Document party annotations, nullable slot references, independent party order, reversible mode,
      presets, unassigned loadouts, selected-editor behavior, structural validation, persistence
      migration, native party JSON, multi-code limitations, and selected-member URLs.
- [ ] Document that the local-library outer schema/key, domain BuildSet schema, build-entry kinds,
      single-build behavior, and game rule engine remain stable while persisted build-set snapshots
      advance independently.
- [ ] State explicitly that hero/henchman catalogs, portraits, AI behavior, unlocks, paw-ned2/team
      templates, whole-party URLs, hosted sharing, guides, backend sync, collaboration, and
      recommendations remain deferred.
- [ ] Preserve BW-1701 as backlog with its SPRINT-006 evidence; do not mark it done or imply native
      Build Wars JSON supplies external compatibility.
- [ ] Run focused app/domain regressions, then full `npm run verify`, then `git diff --check`.
- [ ] Manually smoke-test neutral single build, neutral build set, enabled/dormant party, empty slot,
      maximum slots, narrow layout, keyboard actions, reload, local save, backup restore, native party
      transfer, partial multi-code copy, and selected-member share URL.
- [ ] Record exact verification evidence and reconcile BW-1702 through BW-1706, EPIC-17, SPRINT-018,
      ledger, and result manifest only after every Definition of Done item passes.

**Verification:**

- `npm run test:run -- src/app test/domain test/template-compatibility`
- `npm run verify`
- `git diff --check`

**Gate:** EPIC-17 closes only after full verification passes, documentation matches shipped behavior,
and BW-1701 remains explicitly parked outside MVP scope.

## Files Summary

| File or Area | Change | Purpose |
| --- | --- | --- |
| `src/domain/party.ts` | Replace placeholder | Own framework-neutral party annotations, slot identity, presets, member metadata, bounds, helpers, and structural validation without embedded builds. |
| `src/domain/index.ts` | Modify | Export the public party annotation surface. |
| `src/domain/build-set.ts` | Preserve semantics; minimal adapter changes only if required | Keep neutral build-set schema, entry kinds, complete payloads, cap, and order independent from parties. |
| `test/domain/party.test.ts`, `test/domain/contracts.test.ts` | Create/modify | Prove annotation invariants, validation codes, public exports, and absence of a second loadout graph. |
| `src/app/party-state.ts`, `src/app/party-state.test.ts` | Create | Centralize party construction, slot/member transitions, selection repair, resizing, assignment, duplication, and defensive no-ops. |
| `src/app/build-set-state.ts`, `src/app/build-set-state.test.ts` | Modify | Support zero/one active entry, safe empty-slot selection, materialization, party-aware entry removal, and complete snapshot preservation. |
| `src/app/workspace-state.ts`, `src/app/workspace-state.test.ts` | Modify | Add party actions, selected-loadout guards, dirty/durable behavior, save/load, and complete identity re-keying. |
| `src/app/persistence-schema.ts`, `src/app/persistence-schema.test.ts` | Modify | Add persisted build-set snapshot v2, nested v1 migration, party validation/cloning, selected slot, bounds, and stable fingerprints. |
| `src/app/local-storage.ts`, `src/app/local-storage.test.ts` | Reuse/test; modify only if adapter needed | Preserve current key, revision conflicts, unavailable/quota states, and write-blocking behavior for normalized v2 snapshots. |
| `src/app/library-fixtures.ts` | Modify | Add legacy neutral, current party, dormant, malformed, empty, and mixed-library fixtures. |
| `src/app/party-selectors.ts`, `src/app/party-selectors.test.ts` | Create | Join slots to materialized loadouts and produce party header, member cards, unassigned rows, action state, and summary view models. |
| `src/app/party-validation.ts`, `src/app/party-validation.test.ts` | Create | Aggregate existing per-loadout validation with narrow party structural and mode checks. |
| `src/app/build-set-selectors.ts`, `src/app/build-set-selectors.test.ts` | Modify | Reuse loadout summary projection and preserve neutral aggregate behavior while supporting party consumers. |
| `src/app/components/BuildSetNavigator.tsx` | Modify | Add reversible party entry point and delegate enabled party rendering while preserving the neutral navigator. |
| `src/app/components/PartyWorkspace.tsx`, `src/app/party-workspace.test.tsx` | Create | Render accessible party header, ordered member cards, empty states, unassigned entries, attention rows, and actions. |
| `src/app/components/PartyDialogs.tsx` | Create | Handle metadata, sizing, assignment, clear/reset, and other bounded party dialogs with focus safety. |
| `src/app/components/TemplateDialogs.tsx`, tests | Modify | Bind template import/export to the occupied selected member and preserve party metadata. |
| `src/app/components/LibraryPanel.tsx` | Modify | Label party records, expose counts, and make Copy Into Set placement explicit. |
| `src/app/library-selectors.ts`, `src/app/library-selectors.test.ts` | Modify | Search/summarize party metadata and occupied/empty member state while retaining existing record semantics. |
| `src/app/party-transfer.ts`, `src/app/party-transfer.test.ts` | Create | Own inert native party JSON, bounds, parsing, preview, apply, serialization, and filenames. |
| `src/app/components/PartyTransferDialog.tsx`, `src/app/party-transfer-dialog.test.tsx` | Create | Provide native party export/import preview and dirty-guarded apply. |
| `src/app/party-sharing.ts`, `src/app/party-sharing.test.ts` | Create | Produce deterministic bounded multi-code text and availability/omission summaries. |
| `src/app/components/PartySharePanel.tsx`, `src/app/party-share-panel.test.tsx` | Create | Preview, explain, select, and copy party code text without claiming losslessness. |
| `src/app/build-set-transfer.ts`, dialog, and tests | Modify | Preserve current/dormant party annotations in general set transfer and migrate legacy neutral payloads. |
| `src/app/backup-restore.ts`, `src/app/backup-restore.test.ts` | Reuse/modify/test | Preserve party records/drafts through backup parsing, merge/replace, ID remaps, and anti-wipe recovery. |
| `src/app/components/ShareControls.tsx`, `src/app/template-workflow.ts`, tests | Modify/test | Keep existing selected-loadout formats while adding party omission copy and preventing empty-slot fallback. |
| `src/app/App.tsx`, `src/app/App.test.tsx` | Modify | Compose party navigation, occupied editor/empty state, transfer/share dialogs, selection guards, autosave, and regression paths. |
| `src/app/styles.css` | Modify | Add bounded compact party layouts, status/selection/focus states, wrapping, dialogs, and narrow-screen behavior. |
| `README.md`, relevant `compendium/*.md` | Modify during execution | Document contracts, UX, validation, persistence, transfer/share limits, prior-art boundary, and deferrals. |
| `work/tickets/17-party-and-hero-builder/*.md` | Modify during execution closeout | Record status, implementation evidence, acceptance, and BW-1701 parking-lot continuity. |
| `work/sprints/SPRINT-018.md`, ledger, result manifest | Create/modify during final planning and execution closeout | Maintain authoritative ticket-burn traceability and verification evidence. |

## Definition of Done

### Contracts and Semantics

- [ ] Party mode is an optional, versioned annotation over a neutral build set; it does not change
      `BuildSetEntryKind`, embed builds, or require the legacy placeholder `PartyBuild` graph.
- [ ] Slots have stable IDs, canonical array order, nullable entry references, bounded labels, roles,
      kinds, optional freeform kind labels, and notes.
- [ ] Empty slots do not create placeholder build-set entries, and occupied slots reference ordinary
      complete persisted loadouts.
- [ ] Each entry is assigned to at most one slot; unassigned entries are valid, visible, and
      recoverable.
- [ ] Party order and neutral build-set entry order are independent and tested against reorder in
      both directions.
- [ ] Presets 2/4/6/8/12 and custom sizes 1-16 have deterministic creation, growth, mismatch, and
      non-destructive shrink behavior.
- [ ] Member kind remains lightweight user-authored metadata and does not select, validate, or infer
      a real hero, henchman, account, unlock, portrait, or AI profile.
- [ ] Disabling party mode retains annotations; confirmed Reset Party removes annotations only; both
      preserve all underlying loadouts.

### State and Editing

- [ ] Enabling an existing set maps entries without changing their IDs, kinds, notes, order, or
      content; enabling an empty set creates real empty slots only.
- [ ] Selecting an occupied member atomically snapshots the outgoing editor and hydrates the target
      loadout with no duplicate active copy.
- [ ] Selecting an empty slot preserves the outgoing edit, leaves all entries durably inactive,
      exposes no phantom editor, and cannot receive editor/template actions.
- [ ] Repeated occupied/empty switching preserves professions, mode, attributes, eight skills, PvE
      budget, raw overlays, titles, equipment, nested build name, and all party metadata.
- [ ] Create, assign, clear, duplicate, reorder, resize, metadata edit, disable, reset, and underlying
      entry removal are pure, ID-addressed, bounded, and defensively tested.
- [ ] Clear Member never deletes a loadout; confirmed Delete Loadout clears its party reference in
      the same transition and leaves no dangling state.
- [ ] Duplicate Member creates independent entry/build identity, copies complete nested state and
      party metadata, preserves neutral entry kind, and cannot mutate its source through later edits.
- [ ] Selected slot, selected entry, comparison target, and focus repair are deterministic after
      clear, delete, shrink, import, restore, and stale persisted selection.
- [ ] Template import targets only an occupied selected member and preserves entry/slot identity,
      labels, roles, kinds, and notes.
- [ ] Neutral single-build and neutral build-set actions retain all SPRINT-017 behavior when party
      mode is absent or disabled.

### Persistence and Recovery

- [ ] Domain build-set schema remains version 1; app persisted build-set snapshot schema is version
      2 with optional party annotation and selected-party-slot resume state.
- [ ] Existing persisted build-set snapshot v1 migrates in memory to v2 with `party: null`, preserving
      all old data exactly.
- [ ] Outer local-library schema remains 2 under `build-wars:v1`; no new key, dual-write, eager
      rewrite, or downgrade path is introduced.
- [ ] Reading a migrated library does not dirty the document, call `setItem`, increment revision, or
      become write-blocked solely due to migration.
- [ ] Autosave, pagehide, Save New, Update, Save As New, load, delete, conflict, quota/unavailable
      storage, and write-blocked recovery preserve party metadata and loadouts.
- [ ] Saved-record duplication re-keys set, entry, build, slot, entry-reference, and selection IDs
      consistently and deep-copies all values.
- [ ] Whole-library backup/restore preserves enabled and dormant parties, empty slots, unassigned
      entries, working drafts, record metadata, IDs/remaps, saved-with facts, and unresolved state.
- [ ] General build-set transfer round-trips party metadata and accepts legacy neutral transfers
      without inventing annotations.
- [ ] Unsupported versions, dangerous keys, sparse arrays, invalid enums, duplicate IDs/assignments,
      dangling references, stale selections, oversized text/collections, and malformed snapshots
      have bounded deterministic outcomes without silent data loss.

### Workspace and Accessibility

- [ ] Enabled party mode shows all ordered occupied and empty slots while one occupied member at most
      owns the full editor.
- [ ] Each occupied card exposes member metadata, profession pair, mode, eight skill states,
      equipment/title indicators, notes state, and validation status from shared selectors.
- [ ] Empty cards and no-member state expose direct create/assign actions and do not masquerade as
      incomplete loadouts.
- [ ] Unassigned loadouts remain reachable and assignable without switching off party mode.
- [ ] Party controls work with keyboard and pointer, have unique accessible names, visible states,
      non-color status, deterministic DOM order, and polite announcements.
- [ ] Dialogs have initial focus, Tab containment, Escape close, trigger restoration, explicit
      confirmation, and bounded viewport height.
- [ ] Desktop, narrow, long-text, empty, one-member, mixed, and 16-slot states have no overlapping or
      page-level horizontal overflow and preserve usable touch targets.
- [ ] Runtime UI uses no prior-art screenshot, portrait, external icon, or remote media request.

### Validation

- [ ] Structural issue codes and ordering are stable, deterministic, bounded, path-addressed, and
      independently tested.
- [ ] Duplicate/malformed slot ordering, preset mismatch, missing references, duplicate assignment,
      and over-limit structure produce explicit structural issues or block unsafe import.
- [ ] Empty required slots, incomplete members, unresolved members, unknown mode, and mixed known
      PvE/PvP modes are distinguished rather than collapsed into one invalid state.
- [ ] Every occupied member uses the existing per-loadout validation path; underlying issue codes and
      details remain accessible.
- [ ] Party aggregate counts overlapping error, warning, incomplete, unresolved, empty, stale, and
      catalog-unavailable dimensions with documented precedence.
- [ ] Validation links focus/select the relevant slot, and party issues never block single-member
      editing.
- [ ] `validateBuild`, existing game-rule issue codes, and `RULE_ENGINE_VERSION` do not change for
      party composition.
- [ ] No synergy, quality, optimal-role, meta, PvP-format, hero-AI, or recommendation rule is added.

### Sharing

- [ ] Native `build-wars-party-transfer` JSON is inert, versioned, deterministic, byte-bounded,
      dangerous-key-safe, previewed, single-apply, and dirty-guarded.
- [ ] Native party JSON round-trips the complete underlying build set, occupied and empty slots,
      unassigned entries, party metadata, raw facts, equipment, titles, and durable selection.
- [ ] Native party import rejects neutral-only/dormant party payloads with a clear explanation and
      never partially replaces the current draft.
- [ ] Multi-code projection visits every slot in party order and includes a proven code/fidelity,
      explicit empty marker, or explicit unavailable reason.
- [ ] Equipment/title omissions are shown per applicable member; unavailable or omitted facts are
      never hidden behind Copy All wording.
- [ ] Partial copy reports exact available/empty/unavailable/lossy counts in the UI and copied text;
      oversized output is blocked in favor of native JSON.
- [ ] Clipboard writes are explicit and best-effort; denial leaves bounded text selectable.
- [ ] Existing skill-template and share URL grammar remains unchanged and targets only an occupied
      selected member with party/sibling omission warnings.
- [ ] No whole-party URL, external team code, paw-ned2 adapter, hosted share, backend, account,
      publishing, or compatibility claim is introduced.

### Verification and Closeout

- [ ] Focused domain, state, persistence, local storage, selector, component, validation, transfer,
      sharing, backup, template, URL, library, and App suites pass.
- [ ] `npm run test:run -- src/app test/domain test/template-compatibility` passes.
- [ ] `npm run verify` passes.
- [ ] `git diff --check` passes.
- [ ] Manual smoke coverage includes single build, neutral set, party conversion, disable/re-enable,
      empty/occupied selection, persistence reload, responsive keyboard use, native JSON, partial
      multi-code, backup restore, and selected-member URL.
- [ ] README and compendium documentation match shipped contracts, migration, UX, validation,
      sharing, security boundaries, and deferred scope.
- [ ] BW-1702 through BW-1706, EPIC-17, SPRINT-018, the sprint ledger, and the result manifest agree
      on scope, status, evidence, assumptions, and completion.
- [ ] BW-1701 remains backlog and retains the external team-template compatibility deferral.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Party metadata becomes a second loadout graph and drifts from build-set entries. | Medium | Critical | Store only stable entry references in slots; forbid embedded builds; centralize joins and add contract tests. |
| Empty-slot selection causes the placeholder editor to overwrite a real inactive entry. | Medium | Critical | Support zero active entries explicitly, require snapshots for all inactive entries, remove materialization fallback, and test empty/save/pagehide sequences. |
| Nested schema evolution silently rewrites or drops existing neutral build sets. | Medium | Critical | Freeze v1 fixtures, decouple domain/persisted versions, migrate field-for-field in memory, and assert no write on read. |
| Two independent orders confuse users or drift operationally. | Medium | High | Declare array order separately for entries and slots, label UI actions Party Order versus Loadout Order, address by IDs, and test both reorder axes. |
| Clearing or resizing a party unexpectedly deletes loadouts or authored annotations. | Medium | Critical | Make clear detach-only, keep unassigned entries visible, block lossy shrink, require confirmed reset/delete, and test no-loss transitions. |
| Slot and entry selections diverge, causing edits or shares to target the wrong member. | Medium | Critical | Use one selected-loadout resolver, align IDs on occupied selection, use null active selection for empty slots, and prohibit first-entry fallback. |
| Saved-record duplication leaves slot references pointing at source entry IDs. | Medium | High | Build explicit old-to-new maps for entries and slots and assert complete graph independence after mutation. |
| Party annotations spread conditionals across all single-build/build-set code. | Medium | High | Keep the existing document union, centralize party state/selectors, and branch presentation at the build-set navigator boundary. |
| Fixed presets or member kinds imply unsupported game-format or hero legality. | Medium | Medium | Treat presets as layout sizes and kinds as user labels; validate only structure; document no catalog/format claims. |
| Party aggregate status is mistaken for composition advice. | High | High | Preserve per-loadout codes, label structural/incomplete states precisely, keep mixed mode a warning, and explicitly exclude recommendations. |
| Sixteen rich member cards make selectors or narrow rendering sluggish. | Medium | Medium | Reuse bounded materialized summaries, memoize by snapshot/catalog fingerprint, avoid full editors/tooltips in cards, and test max-size layouts. |
| Interactive slot cards become inaccessible nested-control clusters. | Medium | High | Use labeled lists with separate native buttons, dialogs/disclosures for secondary actions, deterministic focus, and component tests. |
| Native party JSON and build-set JSON are confused with an external team code. | High | Medium | Use explicit Build Wars kinds/labels, distinct party envelope, preview facts, and repeated no-paw-ned2 copy. |
| Party and general build-set transfer paths drift in parsing, migration, or limits. | Medium | High | Share nested snapshot parsing, normalization, cloning, and bounds; keep the party envelope a thin discriminator with party-enabled checks only. |
| Partial multi-code copy silently omits members or semantic state. | High | High | Include every slot, explicit unavailable/omitted markers and counts, accurate button labels, and position native JSON as lossless. |
| Untrusted party JSON amplifies parse, clone, validation, or rendering work. | Medium | High | Enforce byte, slot, entry, string, nested-array, and diagnostic caps before hydration and reject dangerous structures. |
| Share or template code accidentally targets an unassigned/background loadout. | Medium | High | Route all actions through occupied selected-member resolution and test empty slots, stale selections, and saved-party rows. |
| Scope expands into hero identity, portraits, external codecs, or hosted collaboration. | Medium | High | Keep annotations user-authored, use local CSS placeholders, leave BW-1701 parked, and gate closeout on explicit deferral docs. |

## Security

- Treat localStorage, backup files, build-set transfers, party transfers, clipboard text inputs, slot
  and entry IDs, labels, roles, kind labels, notes, raw overlays, and nested loadout state as untrusted.
- Enforce UTF-8 byte limits before parsing party/build-set transfers. Bound slot count, entry count,
  aggregate nested loadouts, text lengths, arrays, diagnostics, validation issues, and rendered rows
  before expensive hydration or catalog joins.
- Reject `__proto__`, `constructor`, and `prototype` recursively before migration or serialization.
  Reconstruct accepted objects field by field and use `Map`/`Set`, not user strings as object keys.
- Require supported versions/discriminants/enums, dense arrays, finite safe integers, unique exact
  IDs, valid slot references, at-most-one entry assignment, and consistent fixed preset sizes.
- Do not truncate or coerce malformed imported values into apparently valid authored data. Keep
  normalization for user mutations separate from strict unknown-input validation.
- Render all user-authored and diagnostic text through escaped React text. Do not use
  `dangerouslySetInnerHTML`, executable markdown/HTML, dynamic imports, `eval`, or URLs taken from
  party data.
- Normalize CR/LF and structural prefixes in multi-code display fields so labels/roles cannot forge
  additional code or status lines. Never interpret multi-code text as an import format.
- Native transfer and backup exports are inert JSON. Sanitize filenames, create and promptly revoke
  object URLs, and never upload files, fetch embedded resources, or expose local paths.
- Preserve preview, explicit apply, dirty guards, single-use apply, replace confirmation, restore
  anti-wipe, storage revision conflicts, and write-blocked recovery for every new import path.
- A malformed party inside one library record must not silently erase valid sibling records.
  Bounded partial recovery reports exact paths and blocks writes until explicit recovery.
- Generate opaque IDs locally and re-key every identity scope on duplication. Do not derive trusted
  identity, DOM IDs, filenames, or object paths directly from labels.
- Clipboard access is user-initiated and best-effort. Copy only the visible bounded projection; do
  not read the clipboard or copy native JSON without the named user action.
- Keep all generated catalog imports behind `src/app/catalogs.ts`. Native exports include authored
  state and saved-with facts only, never generated catalogs, source snapshots, QA reports, prior-art
  files, validation prose, or repository paths.
- Add no network request, remote media, backend, secret, credential, account identifier, telemetry,
  collaboration channel, hosted URL, service worker, or new dependency.
- Party JSON and multi-code text are not proof of game validity, authorship, account ownership, hero
  availability, external-format compatibility, or safe in-game composition.

## Dependencies

### Required and Completed

- **EPIC-08 / SPRINT-009**: the one-loadout editor, profession/attribute/skill UI, template dialogs,
  validation panel, app catalog boundary, accessible interaction patterns, and responsive shell.
- **EPIC-09 / SPRINT-010**: local-first working draft versus named record semantics, the
  `build-wars:v1` key, dirty guards, durability/revision handling, library UI, backup/restore,
  selected-loadout URLs, and clipboard behavior.
- **EPIC-13 / SPRINT-014 and EPIC-14 / SPRINT-015**: semantic equipment state, editor, summaries,
  persistence, validation, backup/restore, and template/share omission behavior.
- **EPIC-15 / SPRINT-016**: durable title-rank overrides, title display/validation, nested build
  migration, and title omission warnings.
- **EPIC-16 / SPRINT-017**: neutral build sets, 16-entry cap, stable IDs/kinds/notes/order, one active
  editor plus inactive snapshots, schema-2 mixed local documents, record duplication, aggregate
  validation, comparison, backup/restore, build-set transfer, and selected-loadout sharing.
- Direct foundations include `src/domain/build-set.ts`, `src/app/build-set-state.ts`,
  `workspace-state.ts`, `persistence-schema.ts`, `local-storage.ts`, `build-set-selectors.ts`,
  `build-set-transfer.ts`, `backup-restore.ts`, `library-selectors.ts`, `template-workflow.ts`, and
  `App.tsx` with their current tests.

### Runtime and Tooling

- Existing React 19, React DOM 19, TypeScript 5.9, Vite 6, Vitest 4, Testing Library, ESLint 9,
  Prettier 3, Node 22.11+, and npm 11.10+.
- Existing app-owned promoted profession, skill, rune, insignia, weapon, modifier, and title views;
  party work introduces no new generated data or ingestion pipeline.
- Existing `@buildwars/gw-templates@1.1.1` skill-template path only. Its failed paw-ned2 capability is
  not an implementation dependency.
- Existing browser `localStorage`, `Blob`, object URL, download, and Clipboard APIs with current
  unavailable/denied fallbacks.
- No new package, API, database, network service, route, worker, environment variable, image asset,
  or external reference implementation.

### Downstream Handoffs

- BW-1701 remains the sole parking-lot owner for a future bounded external team-template
  compatibility spike. Any future adapter consumes the semantic party annotation and native
  snapshots; it must not dictate their schema.
- Future hero/henchman catalog work may add optional identity references beside user-authored member
  metadata only after its own source, migration, unresolved-ID, and UX design. Current strings remain
  valid and must not be retroactively guessed into catalog IDs.
- EPIC-21 or later analysis may consume party/member validation views for synergy or recommendation
  features, but must emit separate issue/advice contracts and cannot reinterpret SPRINT-018
  structural codes as quality judgments.
- Future hosted sharing, guide publishing, accounts, or collaboration must wrap the native local
  contract and define privacy, authorization, conflicts, revocation, and versioning separately.

## Open Questions

No open question blocks execution. This draft resolves the intent questions as follows:

1. Party metadata is a versioned optional annotation carried by the app-owned persisted/runtime
   build-set snapshot. It is not a new top-level document kind and not part of the neutral domain
   `BuildSet` contract.
2. Empty slots use `entryId: null`; occupied slots reference complete build-set entries. This keeps
   all loadout invariants intact and permits unassigned loadouts.
3. MVP presets are 2, 4, 6, 8, and 12. Custom sizes span 1-16, sharing the existing build-set cap;
   shrink never drops members or metadata implicitly.
4. Member kinds are unspecified, player, hero, mercenary, guest, and freeform plus a bounded custom
   label. They are display-only user annotations and never catalog identities.
5. MVP party validation is limited to schema/slot/order/reference/preset structure, empty required
   slots, existing per-loadout results, incomplete/unresolved members, unknown mode, and mixed known
   PvE/PvP mode. All quality and synergy analysis remains deferred.
6. Native party exchange uses distinct `build-wars-party-transfer` framing while embedding the same
   complete persisted build-set snapshot. General build-set transfer also preserves annotations.
7. Multi-code copy is deterministic labeled plain text with one slot block in party order, proven
   code/fidelity where available, explicit empty/unavailable states, and omission markers. It is not
   an import codec or lossless format.
8. Party mode disable retains dormant annotations; only confirmed Reset Party discards them. Both
   leave underlying loadouts intact.
9. Selecting an empty slot means no active entry, not a background or fallback member. All inactive
   entries remain snapshotted, and selected-member actions are disabled until assignment.
10. The local-library outer schema and storage key stay unchanged. Only the nested persisted
    build-set snapshot advances, with an in-memory v1 migration and safe old-client rejection.
