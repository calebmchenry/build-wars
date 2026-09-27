- [x] Filter on skill type
- [x] Filter on what the skill does
  - [x] `applies:<condition>`
  - [x] `removes:<skill-type | condition>`
  - [x] `deals:<fire|cold|lightning|earth|chaos|shadow|holy|life-steal>`
- [x] Filter on description (including grayed out text)
- [x] Display filters as chips in the search bar (custom query language?)
  - (description:"blah blah blah" x) (prof:Warrior x) (prof:Monk x) (mode: PvE) (name:"haste") ???

## Clean up

- [x] Check box and labels for the profession dropdown filter are too small
- [x] Ideally you should be able to see all of the professions in the profession dropdown filter menu without scrolling. Maybe just fit content then?
- [x] Menus opened from buttons should probably close when you click outside of the menu (e.g. dropdown filter and profession picker and the like)
- [x] Remove profession names from the profession picker. Just have the icons
- [x] Make the applies, removes, and deals filters to be dropdown filter w/ menu
- [x] mode filter should change from the pvp checkbox from the right panel (similar to how the profession picker influences the default filters)
- [x] cost filters don't make sense e.g. energy/recharge/upkeep/etc
- [x] trim down filters. Opening up the filters from the filter icon button is noisy
- [x] Add capability expand all and collapse all options for attribute groups in the skill selector panel
- [x] Have icon button for picking the display mode for skills: as rows, as small icons only (match the size of the icons during row display), or as large icons only (match the size of the icons as they show up in the skill bar). Making sure to handling wrapping and such. Here are some screenshots: [icon and button menu](../prior-art/gw-skills-and-attributes-refs/icon-display-menu-options.png), [small icons](../prior-art/gw-skills-and-attributes-refs/small-grid-skills-view.png), [large icons](../prior-art/gw-skills-and-attributes-refs/large-grid-skill-view.png)
- [ ] Dark theme kinda has a green vibe. I don't think this matches the gw or gw reforged aesthetic
- [ ] Equipment codes

## Next milestone

- [ ] [EPIC-19: Composer attribute adjustments](tickets/19-composer-attribute-adjustments/EPIC.md)
  - Inline primary-profession rune segments and one optional headgear selection.
  - Real cached rune icons and blue increased ranks with contribution breakdowns.
  - Inferred self-buff checkboxes, persistent overrides, and opt-in external buffs.
  - Working-draft persistence with unchanged Guild Wars template Load/Save.

Named local saves and complete-build transfer are follow-ups described in the
[design brief](../compendium/attribute-adjustments.md).

## Tooltip follow-ups — recorded 2026-09-21

Captured for later investigation; not scheduled for implementation yet.

- [ ] Make rune tooltips match the in-game rune tooltips. An in-game screenshot
      is still needed as the reference for content, layout, and styling.
- [ ] Investigate skill tooltips that cannot display values at attribute rank 20.
      The user reports unresolved tooltips for some skills and suggests the wiki
      may have explicit progression lookup tables. Check those tables and our
      imported data against the current interpolation/extrapolation behavior;
      determine whether exact wiki values can resolve the missing high-rank
      previews. Table availability and coverage still need verification.

## Proposals — recorded 2026-09-21

Ideas for consideration, not approved or scheduled for implementation.

- [ ] **Proposal: Catalog slot markers.** Show the slot number on catalog skills
      already on the bar, making current selections and potential moves clearer.
- [ ] **Proposal: Attribute-to-skill highlighting.** Hovering or focusing an
      attribute highlights affected bar skills, including relationships introduced
      by Signet of Illusions and other boosts.
- [ ] **Proposal: Attribute breakpoint previews.** Before spending points, show
      which skill values would change at the next rank, including duration,
      target-count, and other rounded-value breakpoints. Build on the rank-20
      progression-data investigation above.
- [ ] **Proposal: Side-by-side skill comparison.** Pin the skill occupying a slot
      while browsing replacements, comparing tooltips using the current build's
      attributes and boost assumptions.
- [ ] **Proposal: Preview without skill boosts.** Temporarily suppress all assumed
      skill effects with one control, restoring individual selections when it is
      switched back. This helps reveal dependence on boosts and external support.
