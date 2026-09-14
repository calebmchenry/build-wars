# Focused Build Composer Use Case

This document describes the focused Build Wars composer and its product direction.
It provides durable context for EPIC-18 and the attribute adjustments in EPIC-19.

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

SPRINT-019 implements this as the default app shell. The composer binds to the
selected loadout when one exists: a single-build draft, the selected build-set
entry, or an occupied selected party slot. Empty build sets and empty selected
party slots render an explicit no-selected-loadout state with create/assign
actions; they do not materialize placeholder builds.

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
- An inline template code output/input with explicit copy and apply controls.

The right panel is a catalog surface. It can eventually host tabs for skills,
weapons, runes, insignias, and other catalogs. EPIC-18 starts with the skills
tab only.

## Secondary Entry Points

The current shell mounts only the focused composer, inline code, game-folder
Load/Save and theme controls. Mature library, party, equipment, title and sharing
components remain available as internal modules and tested state/transfer paths;
they are not mounted as a Secondary tools surface. Named local builds and complete
build transfer interfaces remain deferred.

## Naming Contract

The composer build-name field edits only the active `Build.name`. It does not
rename a saved-record name, build-set entry label, party slot label, or raw
template wrapper name. Saved-record and build-set names remain owned by their
secondary controls. Exact-source replay is fingerprint based, so name-only
composer edits do not invalidate unchanged imported bare-code replay; canonical
output continues to use the raw wrapper/template name when that metadata is
present.

## Profession And Raw-Fact Retention

"Any" is UI language for `ProfessionId | null`; no sentinel ID or catalog record
is introduced. Intentional Any is distinct from unresolved imported profession
evidence by reading both the nullable build profession field and the raw template
overlay. Primary Any blocks canonical skill-template export with a focused
reason. Secondary Any uses the existing supported secondary-none template
semantics when validation and decode-back proof pass.

Profession changes keep semantic facts that remain representable. Targeted edits
clear only the addressed raw overlay entry. Stale or unresolved imported
attributes and skill slots stay visible and diagnosable until the user explicitly
replaces or removes them.

## Asset Branch

Profession and skill icons use approved local assets through the app icon boundary.
SPRINT-020 adds 126 rune mappings to 30 verified local images. Runtime paths stay
local; provenance remains in dedicated manifests. Missing rune images leave visible
numeric choices and full accessible names. See [ADR 0002](decisions/0002-runtime-gww-icon-assets.md).

## Attribute Rows

Attribute editing should resemble the in-game flow:

- Decrement arrow with a number showing how many points are refunded.
- Increment arrow with a number showing how many points are required.
- Current attribute rank.
- Attribute name.

The decrement affordance is hidden when no points are allocated. The increment
affordance is hidden when the user cannot invest more because of rank cap or
remaining points. Allocated ranks remain authored point investments. SPRINT-020 derives effective
ranks from eligible gear and assumed effects using one shared projection. Primary
rows offer None/+1/+2/+3 rune radios and one global headgear +1 choice, including
at base zero. Inherit/reset remains distinct from explicit None. Blue marks resolved
increases; focus, hover or tap opens the contribution and cap explanation.

The initially collapsed Assumed effects disclosure provides self-effect checkboxes
and external Refrain strength. Inactive remembered preferences remain editable.
Both collapsed disclosures show the contributing count, including capped bonuses.
See [attribute adjustments](attribute-adjustments.md) for persistence and precedence.

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
- In build-set or party contexts, inline template import/export affects only the
  selected occupied loadout and warns that sibling entries, party metadata,
  equipment, title ranks, and notes require JSON transfer or backup.

## Skills Catalog

The first catalog tab is skills.

- Default results are filtered by the active professions.
- The "Any" profession state defaults to all-playable results when no
  concrete profession is selected.
- Skills are grouped by attribute with collapsible sections.
- The initial view should be compact rows: icon, name, and right-aligned modeled
  costs in energy, adrenaline, sacrifice, upkeep, overcast, activation,
  recharge, then other-facts order.
- Approved local skill/resource icons render through the existing asset boundary.

Avoid starting with a large set of manual filters. Add controls only when the
default list becomes hard to scan.

## Deferred Use Cases

These remain useful but are not part of the focused composer milestone:

- Full armor, weapons, insignias, rune health totals, and equipment template workflows.
- Saving, storing, editing, backing up, and sharing build libraries.
- Party, hero, and multi-build workflows.
- Markdown-style build guides and community build knowledge.
- Broad search/discovery and advanced build analysis.
- Touch-specific drag polish.
- Additional icon families without exact source-policy approval.
- External team codecs, backend sync, accounts, collaboration, hosted sharing,
  PWA behavior, and analytics.

They should return as later use-case documents and epics after the focused
composer is strong.
