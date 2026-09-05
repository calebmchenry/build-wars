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

SPRINT-019 preserves mature workflows behind a `Secondary tools` disclosure
instead of removing them or changing their contracts.

| Workflow                                                                | Secondary entry point                  |
| ----------------------------------------------------------------------- | -------------------------------------- |
| Saved records, draft save/update, tags, notes, favorites                | `Local Library` panel                  |
| Build-set creation, selection, variants, transfer                       | `Build Set` panel                      |
| Party member ordering, metadata, native party transfer, multi-code copy | `Build Set`/party controls             |
| Equipment and title ranks                                               | `Editor workspace` tabs                |
| Share URLs and selected-loadout warnings                                | `Sharing` panel                        |
| Full validation                                                         | `Validation` panel                     |
| Backup and restore                                                      | `Local Library` backup/restore actions |
| Modal template import/export fallback                                   | `Template` panel                       |

The secondary surface remains keyboard reachable from the first screen, and
existing dialogs retain focus restoration and dirty-guard behavior.

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

No exact approved local icon binaries are part of EPIC-18. Runtime icon rendering
therefore uses one app-owned placeholder primitive backed by deterministic text
initials and CSS. Catalog media IDs remain provenance metadata only and are not
passed to `img`, CSS URL, preload, canvas, fetch, service worker, or drag-image
APIs. Resource/timing facts use product-owned text glyphs with visible or
assistive labels.

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
- Real skill icons and resource/cast/recharge icons remain deferred until exact
  source-policy approval identifies local asset paths and provenance.

Avoid starting with a large set of manual filters. Add controls only when the
default list becomes hard to scan.

## Deferred Use Cases

These remain useful but are not part of the focused composer milestone:

- Armor, weapons, runes, insignias, and equipment template workflows.
- Saving, storing, editing, backing up, and sharing build libraries.
- Party, hero, and multi-build workflows.
- Markdown-style build guides and community build knowledge.
- Broad search/discovery and advanced build analysis.
- Touch-specific drag polish.
- Real icon binaries without exact source-policy approval.
- External team codecs, backend sync, accounts, collaboration, hosted sharing,
  PWA behavior, and analytics.

They should return as later use-case documents and epics after the focused
composer is strong.
