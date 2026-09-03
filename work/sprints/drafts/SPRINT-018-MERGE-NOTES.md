# SPRINT-018 Merge Notes

## Source Artifacts

- Intent: `work/sprints/drafts/SPRINT-018-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-018-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-018-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-018-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-018-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-018-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-018-GPT54-CRITIQUE.md`

## Local Feasibility Notes

- `codex exec` is available. This CLI exposes
  `--dangerously-bypass-approvals-and-sandbox`; the documented `--full-auto` flag is not accepted,
  matching recent sprint planning runs.
- Draft commands used `codex exec -m <model> -c 'model_reasoning_effort="xhigh"' --dangerously-bypass-approvals-and-sandbox`
  for `gpt-5.5` and `gpt-5.4`.
- The first `gpt-5.6-sol` xhigh draft lane hung after the normal wait window without writing its
  artifact. It was stopped and retried with the same exec family and `model_reasoning_effort="high"`,
  which produced `SPRINT-018-GPT56SOL-DRAFT.md`.
- `gpt-5.6-sol` critique used `model_reasoning_effort="high"` for the same reason; all three
  critique artifacts completed.
- Existing sprint files and `work/sprints/ledger.tsv` end at completed `SPRINT-017`, so `SPRINT-018`
  is the next sprint ID.
- EPIC-17 is ready and depends on completed EPIC-16. BW-1702 through BW-1706 are ready and
  dependency ordered. BW-1701 is backlog and remains a parking-lot ticket.
- SPRINT-017 already shipped the neutral build-set base: complete loadout entries, one active editor
  plus inactive snapshots, schema-2 mixed local documents, transfer, backup/restore, comparison, and
  aggregate per-entry validation.
- No high-risk architecture choice requires interview interruption. The final sprint binds the
  material choices and records assumptions under the non-interactive ticket-burn contract.

## Consensus

The model lanes agreed on the core direction:

- Party semantics should layer over neutral build sets and must not redefine `BuildSetEntryKind`.
- Build-set entries remain complete loadouts; empty party positions are slots with null entry
  references, not nullable build-set entries or placeholder builds.
- The one-active-editor architecture remains the execution base. Empty selected slots are a real
  no-active-loadout state.
- Party validation stays structural and aggregate only. It does not change `validateBuild`, bump the
  rule engine, score synergy, recommend roles, or require hero data.
- Existing share URLs and skill-template import/export remain selected-member-only.
- Native Build Wars JSON is the lossless party recovery path; multi-code text is a convenience
  projection with explicit omissions.
- Hero/henchman catalogs, portraits, hero AI, paw-ned2/team templates, hosted sharing, guides,
  backend sync, collaboration, and recommendations stay deferred.

## Accepted Critiques

1. **Use the GPT-5.6 Sol architecture as the base.** Its treatment of nested persisted snapshot
   versioning, empty-slot selection, independent party order, selected-party-slot state, identity
   remapping, recovery, and security is the most executable.
2. **Keep orders independent.** The final sprint rejects GPT-5.4's proposal to reorder neutral
   build-set entries as a side effect of party-slot movement. Party order is party metadata.
3. **Retain dormant annotations on disable.** The final sprint uses `party.enabled: false` for
   reversible disable and reserves `party: null` for never configured or explicitly reset. Reset
   requires confirmation and never deletes loadouts.
4. **Advance the nested persisted build-set snapshot.** The domain `BuildSet` remains schema 1 and
   party-neutral. The app-owned persisted build-set snapshot advances to version 2 under the
   existing local-library schema 2 and `build-wars:v1` key.
5. **Persist selected party slot separately.** `lastSelectedEntryId` cannot represent an empty
   selected slot, so `lastSelectedPartySlotId` is required durable resume state.
6. **Use one size authority.** The final sprint uses a preset/custom declaration and requires
   `slots.length` to match the declared size. It omits per-slot `required` from MVP.
7. **Choose the member-kind enum now.** The final sprint uses
   `unspecified | player | hero | mercenary | guest | freeform` plus a bounded freeform label.
8. **Keep slot notes but define lifecycle.** Party slot notes are party-context notes that survive
   empty slots. Neutral entry notes remain loadout notes. UI labels and export must distinguish
   them.
9. **Add a distinct party transfer envelope.** Explicit party import/export uses
   `build-wars-party-transfer` while general build-set transfer and backup also preserve party
   annotations. All share the same canonical nested snapshot parser.
10. **Move durability earlier.** The final sprint proves parser, migration, save/load, autosave,
    duplicate, backup/restore, and transfer preservation before broad sharing UI is treated as done.
11. **Add comparison acceptance.** The final DoD explicitly covers comparison target repair and
    behavior while party mode is enabled, disabled, empty-selected, cleared, deleted, imported, or
    restored.
12. **Clarify trust-boundary outcomes.** Explicit party import fails closed. Ambient local/backup
    recovery may preserve accessible loadouts, but unsupported future party versions must not be
    silently erased by load-and-save.

## Rejected Or Trimmed

- A top-level party document kind was rejected because it would fragment existing local-library,
  backup, restore, transfer, and editor flows.
- Embedded loadouts in party slots were rejected because that creates a second loadout graph.
- Synthetic empty build-set entries were rejected because they pollute neutral build-set semantics.
- Synchronized party and neutral entry order was rejected. It creates surprising side effects for
  neutral variants, comparison, transfer diffs, and unassigned entries.
- Destructive disable was rejected. It makes an ordinary view toggle discard authored metadata.
- Reusing only entry notes was rejected because EPIC-17 needs party-context notes that can survive
  an empty slot; the final sprint scopes slot notes tightly and requires distinct display/export.
- General build-set transfer only was rejected for explicit party exchange because party import has
  stronger semantic expectations and should not be confused with a neutral transfer.
- Optional per-slot required flags were trimmed. Every declared slot contributes to completeness in
  MVP; optional positions can be added later with a concrete product need.
- Broad hero identity, portraits, unlocks, AI notes, external codecs, hosted sharing, guides, and
  recommendation surfaces remain out of scope.

## Interview

The automation contract requested non-interactive planning and allowed interview skipping unless a
high-risk architecture choice appeared. The architecture choices were resolved conservatively in the
final sprint, so routine confirmation was skipped.

## Auto-Approval

The final sprint is auto-approved for planning because it is internally consistent, dependency
ordered, executable, and records the assumptions and decisions required to keep implementation
bounded.
