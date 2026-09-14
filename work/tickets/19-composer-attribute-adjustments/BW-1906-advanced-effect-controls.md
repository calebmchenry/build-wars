---
id: BW-1906
title: Advanced Assumed-Effect Controls
epic: EPIC-19
status: backlog
priority: high
depends_on:
  - BW-1902
  - BW-1903
  - BW-1905
created: 2026-09-13
updated: 2026-09-13
---

# BW-1906: Advanced Assumed-Effect Controls

## Goal

Expose inferred active effects and persistent user overrides in a compact advanced disclosure.

## Scope

- Render the supported self buffs when present or when a retained explicit preference needs explanation. Initially use ordinary checkboxes with defaults inferred from the legal current bar.
- Checkbox edits author explicit on/off preferences; a reset action removes the override and resumes inference. Do not persist transient derived checked states.
- Show why an overridden self effect is inactive when its skill is removed or becomes ineligible; remember its preference if the skill becomes eligible again.
- Offer external Heroic Refrain separately, off by default, with a labeled +1..+4 assumed-strength selector. Its state does not require a Paragon skill on the recipient's bar.
- Show a count of contributing logical effects beside the disclosure when collapsed; exclude duplicates and inactive remembered overrides.
- Use existing local skill images where available, short effect/source descriptions, and keyboard-accessible controls. Keep advanced state scoped to the selected loadout.
- Do not add generic buff parsing, combat timers, recast simulation, consumable catalogs, or arbitrary arithmetic fields.

## Acceptance Criteria

- Glyph and Elemental Lord infer checked independently; manually unchecking either persists through unrelated edits and reload.
- Removing/re-adding a self buff, switching factions/modes/professions, and resetting inference follow the documented lifecycle.
- External Refrain remains opt-in and cannot double-count as a separate self effect.
- Collapsed count, checkbox state, and rank breakdown agree; disclosure alone does not dirty the build.

## Verification

Component, reducer, and autosave/reload workflow tests with effect overrides and explicit external strength.

## Design Authority

[Composer attribute adjustments](../../../compendium/attribute-adjustments.md) and the
[epic contract](EPIC.md). User decisions there override older sprint scope.
