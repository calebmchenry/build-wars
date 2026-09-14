---
id: BW-1907
title: Game Template and Transfer Boundaries
epic: EPIC-19
status: backlog
priority: high
depends_on:
  - BW-1902
  - BW-1905
  - BW-1906
created: 2026-09-13
updated: 2026-09-13
---

# BW-1907: Game Template and Transfer Boundaries

## Goal

Prove that richer local state coexists with the existing game-folder workflow and current transfer internals.

## Scope

- Preserve existing folder access, filenames, file content, refresh/re-read, overwrite confirmation, read/write permissions, fallback downloads, and load naming behavior.
- Keep exported/copied standard codes and game .txt files limited to professions, base allocations, and eight skills. Bonus-only edits must preserve exact-source replay and canonical code equivalence.
- Ordinary successful game-template load replaces the selected build as today: no inferred equipment, fresh automatic self-effect defaults, and external effects off. Cancel/invalid input retains every old setting.
- Extend the existing replacement warning to cover authored adjustments using the same dialog; add a concise nonblocking omission note near game export when applicable. Never warn on every automatic checkbox render or add repeated prompts.
- Verify shared-code/standalone file previews do not inherit unrelated current-draft equipment or buffs; imported editable drafts may infer their own supported self effects.
- Verify complete current backup/build-set/party internal transfers and duplicate/selected-loadout paths preserve settings despite the lack of new library UI.
- Leave named local-save UI, combined file formats, folder synchronization, sidecars, equipment-code workflows, and new full-build share URLs for follow-up work.

## Acceptance Criteria

- The exact same base build exports the same proven game code with all adjustments off or on.
- New fields affect authored dirty tracking, but cannot block base-valid skill-template export solely because preview metadata is unresolved.
- Canceled loads/saves and failed writes preserve the draft and original files.
- Existing full-document paths round-trip non-default settings for active and inactive loadouts.

## Verification

Existing template compatibility, template-files/browser, import/export, App, share-url, backup, build-set and party tests with targeted metadata round-trip cases. Never write live game files in tests.

## Design Authority

[Composer attribute adjustments](../../../compendium/attribute-adjustments.md) and the
[epic contract](EPIC.md). User decisions there override older sprint scope.
