# Skill Boost Previews

The composer supports 17 assumed skill effects. All are visible in the existing
wrapping checkbox/icon strip. Self effects require a legal, mode-resolved source
on the bar; unavailable controls stay visible and explain their eligibility on
hover and through accessible descriptions. Heroic Refrain remains an explicit
external assumption. Authored on/off preferences survive removal, mode changes,
profession changes, and local save/backup/transfer round trips.

## Supported effects

In addition to Glyph of Elemental Power, Elemental Lord, Masochism, and Heroic
Refrain, the registry includes:

| Effect                                                                       | Preview behavior                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [Awaken the Blood](https://wiki.guildwars.com/wiki/Awaken_the_Blood)         | +2 Blood Magic and Curses                                                                                     |
| [Aura of the Lich](https://wiki.guildwars.com/wiki/Aura_of_the_Lich)         | +1 Death Magic                                                                                                |
| [Armor of Frost](https://wiki.guildwars.com/wiki/Armor_of_Frost)             | +1 Water Magic                                                                                                |
| [Elemental Attunement](https://wiki.guildwars.com/wiki/Elemental_Attunement) | Elemental attributes +round(1 + Energy Storage / 15)                                                          |
| [Glyph of Energy](https://wiki.guildwars.com/wiki/Glyph_of_energy)           | Elemental attributes +round(1 + Energy Storage / 15)                                                          |
| [Expert's Dexterity](https://wiki.guildwars.com/wiki/Expert%27s_Dexterity)   | +2 Marksmanship; [PvP](https://wiki.guildwars.com/wiki/Expert%27s_Dexterity_%28PvP%29) gives +1               |
| [Trapper's Focus](https://wiki.guildwars.com/wiki/Trapper%27s_Focus)         | Wilderness Survival +round(4 × Expertise / 15)                                                                |
| [Shadow Theft](https://wiki.guildwars.com/wiki/Shadow_Theft)                 | Ordinary available attributes +round(1 + 4 × Critical Strikes / 15)                                           |
| [Seven Weapons Stance](https://wiki.guildwars.com/wiki/Seven_Weapons_Stance) | Seven weapon attributes +round(1 + 14 × Strength / 15), including attributes outside the selected professions |
| [Master of Magic](https://wiki.guildwars.com/wiki/Master_of_Magic)           | Sets elemental attributes to round(8 + 6 × Energy Storage / 15)                                               |
| [Ritual Lord](https://wiki.guildwars.com/wiki/Ritual_Lord)                   | Next Ritualist skill's progression receives +round(2 + 2 × Spawning Power / 15)                               |
| [Signet of Illusions](https://wiki.guildwars.com/wiki/Signet_of_Illusions)   | Non-Illusion spells use the current Illusion Magic rank                                                       |
| [Symbolic Celerity](https://wiki.guildwars.com/wiki/Symbolic_Celerity)       | Signets use the current Fast Casting rank                                                                     |

Source facts were checked against Guild Wars Wiki on 2026-09-20. Runtime rules
use pinned template identities and explicit formulas, never description parsing.

## Attribute projection

Actual attribute bonuses update the attribute panel, tooltip progressions, and
inherent attribute effects together. Equipment and other active skills contribute
to a scaling skill's source rank. A source skill's own bonus is excluded when
calculating its assumed magnitude: this represents one application and does not
iterate recasts of Shadow Theft. Changing other active effects recalculates the
assumption. The ordinary attribute cap remains 20.

Master of Magic replaces base/equipment ranks in elemental attributes. Other
enabled skill bonuses are assumed to be applied afterward. The effect's hover
description and rank breakdown explain this ordering. Gear selections and base
allocations remain saved, with superseded gear contributions marked inactive.

Seven Weapons Stance exposes additional weapon attributes as read-only preview
rows. It does not authorize spending attribute points outside the selected
professions. Heroic Refrain and Shadow Theft still target only the ordinary
profession attributes, excluding the newly granted ones.

Only one [glyph](https://wiki.guildwars.com/wiki/Glyph) and one
[stance](https://wiki.guildwars.com/wiki/Stance) can be assumed active. Selecting
one authors an off preference for its alternative. Without an explicit choice,
the first eligible source on the bar wins. An inactive alternative stays enabled
so the user can select it. Malformed or unresolved source ranks cannot supply a
fabricated boost.

## Per-skill calculation

Ritual Lord, Signet of Illusions, and Symbolic Celerity modify the selected skill's
progression context only. They do not alter the attribute panel, budgets, weapon
requirements, or inherent attributes such as Fast Casting and Spawning Power.
Tooltips name the effect and the rank or bonus being used. All existing skill
display surfaces share the same calculation.

Signet of Illusions affects spells, including eligible title spells, but not
Illusion spells, attacks, signets, or rituals. Symbolic Celerity can change the
charge count displayed for Signet of Illusions; affected spells still use the
character's actual Illusion Magic rank. Literal attribute failure requirements
remain intact. Ritual Lord applies to the next Ritualist skill's progression,
including spells, signets, and binding rituals, without boosting its own tooltip.

These are previews of an assumed next use; charges, expiry, skill copying,
repeated casting, and combat sequencing are not simulated. Aura of the Lich
tooltips show the context with its buff already active, not the minions from an
initial unbuffed cast.

The renderer uses exact catalog rows when present. For the standard
[skill progression template](https://wiki.guildwars.com/wiki/Template%3ASkill_progression),
rank 16–20 values follow the rank-0/rank-15 linear formula. For standard title
templates (`max10`/`max12`), an attribute replacement uses the stored endpoint
values as the rank-0/rank-15 endpoints, independent of the saved title choice.
See [Signet of Illusions](https://wiki.guildwars.com/wiki/Signet_of_Illusions) and
[title skills](https://wiki.guildwars.com/wiki/Title_skill). Custom tables and
unsupported title progressions remain explicitly unresolved; missing interior
rows are not inferred.

## Persistence and scope

The existing Build v4 profile stores the expanded effect IDs. Self effects still
persist only ID and on/off preference; Heroic Refrain also stores strength. The
registry bounds validation and canonical ordering. Derived ranks, assumed
magnitudes, and disclosure state are not serialized. Existing four-effect profiles
remain valid. Game template exports still contain only base attributes and skills.

Consumables, shrine blessings, chance-based weapon bonuses, and copied-skill
selection are outside this change.

## Validation

`npm run verify` passed: formatting, lint, type checking, 587 app/domain tests,
production build, 149 ingestion tests, and 21 ticket-tool tests. `git diff --check`
also passed.

Headless Chrome checks exercised adding Signet of Illusions, changing Fireball
from 7 to 91 damage at Illusion Magic 12, toggling the assumption, and restoring
it after reload. All 17 controls remained visible with correct eligibility and
Heroic Refrain available without its source on the bar. The effect strip wrapped
without overflow at 1280, 900, and 390 CSS pixels in both themes, and at 200% CSS
zoom on the 1280-pixel viewport. No browser page errors occurred. CSS zoom is a
layout check, not a claim of testing the browser's native zoom control.
