---
id: EPIC-19
title: Composer Attribute Adjustments
track: functional
status: ready
priority: high
depends_on:
  - EPIC-03
  - EPIC-04
  - EPIC-05
  - EPIC-06
  - EPIC-09
  - EPIC-10
  - EPIC-14
  - EPIC-15
  - EPIC-17
  - EPIC-18
tickets:
  - BW-1901
  - BW-1902
  - BW-1903
  - BW-1904
  - BW-1905
  - BW-1906
  - BW-1907
  - BW-1908
created: 2026-09-13
updated: 2026-09-13
---

# Composer Attribute Adjustments

## Goal

Let a player choose primary-profession runes and one headgear bonus inline with
attribute allocation, preview supported assumed active effects, and see explained
blue effective ranks while editing a build. Persist the extra authored choices
with the working draft while preserving standard Guild Wars template files.

## Design Authority

Read [Composer Attribute Adjustments](../../../compendium/attribute-adjustments.md)
before planning. It records the user's settled UI, inference, persistence, source,
scope, and game-file decisions, plus implementation defaults. Use the supplied
[attribute screenshot](../../../prior-art/gw-skills-and-attributes-refs/attributes-section.png)
for blue increased-rank styling. Historical epics describe old milestones and do
not override this scope.

## Scope

- Inline None/+1/+2/+3 rune segments with locally cached rune icons and numeric labels.
- One optional headgear +1 selection, with clear action.
- Primary-profession-only equipment controls, base point arrows preserved.
- Shared effective-rank projection, blue increased ranks, contribution explanations,
  and consistent existing skill description/cost/timing displays.
- Advanced assumed-effect controls for Glyph of Elemental Power, Elemental Lord,
  PvE Masochism, and explicitly configured external Heroic Refrain.
- Bar-inferred defaults, persistent user overrides, reset, eligibility gating,
  and a collapsed active-effect count.
- Versioned authored state, old-save migration, draft autosave, and preservation
  through existing internal full-document copy/backup/transfer paths.
- Existing game-folder Load/Save and code compatibility, with concise explanation
  of omitted/replaced metadata.

## Out Of Scope

- Armor-slot management, full equipment UI, raw equipment-code integration,
  weapons, insignias, total-health/armor calculations, or equipment reconciliation.
- New named-library UI, complete-build file formats/share URLs, sidecar files,
  automatic folder synchronization, accounts, or backend storage.
- Generic effect parsing, all skills/consumables, cast-order/uptime simulation,
  chance-based weapon procs, or automatic Heroic Refrain recast calculations.
- Reopening the parked paw-ned2 ticket or unrelated theme/undo work.

## Implementation Defaults

- Compact equipment overrides replace the addressed legacy rank contribution;
  no override inherits it. Explicit None is different from inheritance. Preserve
  existing semantic armor and unresolved imported facts, with no slot reshuffling.
- Clear compact equipment overrides on an actual primary-profession change;
  preserve semantic equipment and re-evaluate its eligibility. Secondary changes
  do not clear valid primary choices.
- No inferred equipment on blank builds or normal game imports. Imported skills
  do infer supported self effects; external effects start off.
- Forced effect preferences never bypass skill-presence/profession/mode gates.
  Removed/ineligible self effects are inactive and remembered for re-addition.
- Heroic Refrain is opt-in at an explicitly shown +1..+4, initially +1 when first
  enabled. It is a single external assumption, never automatically self-inferred.
- Effective ranks use the normal cap of 20; retain an explanation of clipped sums.
  Base point validation and game-code fingerprints remain independent of previews.
- Extend Build schema with backward migration; preserve the existing localStorage
  key and storage recovery/conflict behavior. Audit explicit clones and serializers.
- New controls do not depend on mounting the old equipment/library/party panels.
- User authorization includes the narrowly scoped local rune icon cache and its
  provenance/policy records. No repeat permission question is needed.

## Ticket Order

| Ticket | Work | Depends on |
| --- | --- | --- |
| [BW-1901](BW-1901-adjustment-contracts-and-source-rules.md) | Adjustment Contracts and Source Rules | Completed epic dependencies |
| [BW-1902](BW-1902-authored-state-and-draft-persistence.md) | Authored State and Draft Persistence | BW-1901 |
| [BW-1903](BW-1903-effective-ranks-and-assumed-effects.md) | Effective Ranks and Assumed Effects | BW-1901, BW-1902 |
| [BW-1904](BW-1904-local-rune-icon-assets.md) | Local Rune Icon Assets | BW-1901 |
| [BW-1905](BW-1905-inline-runes-headgear-and-blue-ranks.md) | Inline Runes, Headgear, and Blue Ranks | BW-1902, BW-1903, BW-1904 |
| [BW-1906](BW-1906-advanced-effect-controls.md) | Advanced Assumed-Effect Controls | BW-1902, BW-1903, BW-1905 |
| [BW-1907](BW-1907-game-template-and-transfer-boundaries.md) | Game Template and Transfer Boundaries | BW-1902, BW-1905, BW-1906 |
| [BW-1908](BW-1908-browser-verification-and-closeout.md) | Browser Verification and Closeout | BW-1901, BW-1902, BW-1903, BW-1904, BW-1905, BW-1906, BW-1907 |

The burn planner may split this epic across sprints if needed. It must respect
ticket dependencies and keep the epic open until every required ticket is done.
Never mark browser acceptance complete using only CSS inspection or jsdom tests.

## Done When

- All eight tickets satisfy their acceptance criteria and link implementation evidence.
- Users can edit compact bonuses, infer/override effects, and inspect blue ranks
  by pointer and keyboard without an armor editor.
- Reload and existing complete-document transfer paths preserve authored choices;
  old data migrates without loss and unresolved state remains recoverable.
- Standard game codes remain based on base allocations, and folder behavior stays
  compatible, including cancellation, overwrite, and fallback downloads.
- Rune assets have local runtime mappings, source provenance, and labeled fallbacks.
- Actual browser evidence covers the supplied visual, both themes, narrow layouts,
  zoom, keyboard use, and persistence.
- `npm run verify` and `git diff --check` pass during implementation.
- The executing sprint(s), ledger, tickets, and burn result manifests agree.

## Burn Setup

Preview selection:

```sh
python3 scripts/ticket-burn.py EPIC-19 --dry-run
```

Plan and execute only this epic:

```sh
python3 scripts/ticket-burn.py EPIC-19
```

The runner requires a clean starting tree and no active sprint. It creates the
numbered sprint, runs the configured Codex-only planner/executor, and commits
completed sprint work. The execution contract requires validation; runner-owned
extra validation is optional (`--validation-command 'npm run verify'`). Do not add
`--ignore-dependencies`, `--allow-active-sprint`, or `--allow-dirty` for a normal run.

This preparation creates no numbered sprint, active ledger entry, or burn run
state. The runner chooses the next available sprint number. The old BW-1701
parking-lot ticket remains under completed EPIC-17 and is not selected.

## Planning Evidence

- [Conversation intent and orientation](../../sprints/drafts/EPIC-019-INTENT.md)
- [Independent Codex draft](../../sprints/drafts/EPIC-019-CODEX-DRAFT.md)
- [Draft critique](../../sprints/drafts/EPIC-019-LOCAL-CRITIQUE.md)
- [Synthesis and setup verification](../../sprints/drafts/EPIC-019-MERGE-NOTES.md)

The human design discussion is complete for this milestone. Resolve routine
implementation choices within this contract; do not reopen UI, scope, asset,
or armor-management questions already answered here.
