# Focused Build Composer Use Case

This document captures the product direction for the next primary Build Wars
experience. It is intentionally broader than one implementation ticket and
should be treated as the durable context for EPIC-18.

## Primary Use Case

The simplest useful workflow is:

- Create a single Guild Wars build.
- Edit professions, attributes, and the eight-slot skill bar in a WYSIWYG
  composer that feels familiar to players.
- Export the current skill template code.
- Paste or import a skill template code and have the composer update.

This use case should be the first screen and the center of the app experience.
Completed capabilities such as equipment, library, party, and guide-oriented
models should not compete for first-screen attention.

## Experience Shape

The focused composer uses two main panels.

The left panel is the active build surface and source of truth for the current
draft. It contains:

- A top row with primary profession icon, secondary profession icon, and an
  editable build name.
- Profession controls that behave like compact custom comboboxes. Options show
  the ten profession icons plus an app-specific "Any" option where the composer
  can support it.
- Attribute allocation rows for the active professions.
- An eight-slot skill bar that supports dragging, dropping, reordering, replacing,
  and removing skills.
- An inline template code input with a copy icon.

The right panel is a catalog surface. It can eventually host tabs for skills,
weapons, runes, insignias, and other catalogs. EPIC-18 starts with the skills
tab only.

## Attribute Rows

Attribute editing should resemble the in-game flow:

- Decrement arrow with a number showing how many points are refunded.
- Increment arrow with a number showing how many points are required.
- Current attribute rank.
- Attribute name.

The decrement affordance is hidden when no points are allocated. The increment
affordance is hidden when the user cannot invest more because of rank cap or
remaining points. Allocated rank and effective rank should be separate state so
later rune/headgear bonuses can make modified ranks render differently.

## Skill Bar Rules

The composer skill bar has eight slots.

- Skills can be dragged from the catalog onto the bar.
- Filled slots can be dragged to reorder.
- Skills can be dragged off the bar or onto a removal affordance to clear them.
- Dragging a skill already on the bar removes it from its previous slot.
- Dropping onto an occupied slot replaces that slot.
- Only one elite skill may be on the bar. Placing a second elite removes the
  existing elite in addition to applying the normal drop behavior.
- Dragging should show the skill icon visibly moving with the pointer where the
  browser platform supports it.

Keyboard-accessible alternatives should remain available for core bar operations.

## Template Code

The template code should be visible directly under the skill bar.

- The copy icon copies the current code to the clipboard when possible.
- The input remains selectable when clipboard write fails.
- Pasting a valid template code updates the composer state transactionally.
- Invalid input should report the issue without destroying the previous state.
- Existing exact-source and canonical export policies still apply.

## Skills Catalog

The first catalog tab is skills.

- Default results are filtered by the active professions.
- The "Any" profession state should have explicit filtering behavior.
- Skills are grouped by attribute with collapsible sections.
- The initial view should be compact rows: icon, name, and right-aligned modeled
  costs such as sacrifice, upkeep/maintenance, energy, activation, and recharge.
- Real skill icons and resource/cast/recharge icons should be used once assets
  are approved and locally available.

Avoid starting with a large set of manual filters. Add controls only when the
default list becomes hard to scan.

## Deferred Use Cases

These remain useful but are not part of the focused composer milestone:

- Armor, weapons, runes, insignias, and equipment template workflows.
- Saving, storing, editing, backing up, and sharing build libraries.
- Party, hero, and multi-build workflows.
- Markdown-style build guides and community build knowledge.
- Broad search/discovery and advanced build analysis.

They should return as later use-case documents and epics after the focused
composer is strong.
