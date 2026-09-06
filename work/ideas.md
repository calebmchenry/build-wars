- [x] Filter on skill type
- [x] Filter on what the skill does
  - [x] `applies:<condition>`
  - [x] `removes:<skill-type | condition>`
  - [x] `deals:<fire|cold|lightning|earth|chaos|shadow|holy|life-steal>`
- [x] Filter on description (including grayed out text)
- [x] Display filters as chips in the search bar (custom query language?)
  * (description:"blah blah blah" x) (prof:Warrior x) (prof:Monk x) (mode: PvE) (name:"haste") ???

## Clean up
- [x] Check box and labels for the profession dropdown filter are too small
- [x] Ideally you should be able to see all of the professions in the profession dropdown filter menu without scrolling. Maybe just fit content then?
- [x] Menus opened from buttons should probably close when you click outside of the menu (e.g. dropdown filter and profession picker and the like)
- [x] Remove profession names from the profession picker. Just have the icons
- [ ] Make the applies, removes, and deals filters to be dropdown filter w/ menu
- [ ] mode filter should change from the pvp checkbox from the right panel (similar to how the profession picker influences the default filters)
- cost filters don't make sense e.g. energy/recharge/upkeep/etc
- trim down filters. Opening up the filters from the filter icon button is noisy
- expand all and collapse all options for attribute groups in the skill selector panel
- Have dropdown button for picking the display mode for skills: as rows, as small icons only (match the size of the icons during row display), or as large icons only (match the size of the icons as they show up in the skill bar). Making sure to handling wrapping and such
- Dark theme kinda has a green vibe. I don't think this matches the gw or gw reforged aesthetic
- Equipment codes