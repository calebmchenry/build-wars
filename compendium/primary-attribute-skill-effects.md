# Primary attribute effects on skill costs and timing

Research checked 2026-09-10; baseline energy, activation, and recharge effects implemented
2026-09-11. Sources were read through search-indexed Guild Wars Wiki
pages because direct page requests returned HTTP 403. No in-game measurements were performed.

## Baseline formulas

Here `r` is the relevant attribute's effective rank, `E` the base energy cost, `A` the base
activation time, and `R` the base recharge time in seconds. These formulas describe each inherent
effect by itself, without active skill effects or probabilistic equipment bonuses.

| Attribute / effect       | Eligible skills                                                                     | Calculation                                                       | Source                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expertise: energy        | Every Ranger skill; any profession's attacks, rituals, and touch skills             | `round(E * (1 - 0.04 * r))`                                       | [Expertise](https://wiki.guildwars.com/wiki/Expertise)                                                                                            |
| Mysticism: energy        | Dervish enchantments, including flash enchantments                                  | `round(E * (1 - 0.04 * r))`                                       | [Mysticism](https://wiki.guildwars.com/wiki/Mysticism), [Enchantment spell](https://wiki.guildwars.com/wiki/Enchantment_spell)                    |
| Fast Casting: activation | Mesmer spells/signets; other spells/signets with base activation at least 2 seconds | `A * 2 ** (-r / 15)`, rounded to milliseconds                     | [Fast Casting](https://wiki.guildwars.com/wiki/Fast_Casting)                                                                                      |
| Fast Casting: recharge   | Mesmer spells in PvE                                                                | `max(1, round(R * (1 - 0.03 * r)))` for positive numeric recharge | [Fast Casting](https://wiki.guildwars.com/wiki/Fast_Casting), [2005 recharge floor update](https://wiki.guildwars.com/wiki/Game_updates/20050825) |

The energy rounding rule is inferred from the attributes' published cost tables. Those tables
support nearest-integer rounding for ordinary unmodified costs; they do not establish a universal
half-point rule for combinations of energy modifiers. Expertise's table allows a base cost of
1 to become 0 at rank 13, so energy must not inherit recharge's minimum of 1.
[Expertise](https://wiki.guildwars.com/wiki/Expertise),
[Mysticism](https://wiki.guildwars.com/wiki/Mysticism).

Expertise includes Binding Rituals and the professionless Ebon Vanguard ritual Winds. Ordinary
secondary-profession spells do not qualify merely because a Ranger casts them. Mysticism does
not discount other professions' enchantments or Dervish forms and attacks.
[Expertise](https://wiki.guildwars.com/wiki/Expertise),
[Mysticism](https://wiki.guildwars.com/wiki/Mysticism).

Activation and aftercast are separate: do not include aftercast in the value being multiplied.
[Activation time](https://wiki.guildwars.com/wiki/Activation_time).

## Rank and stacking boundaries

The normal attribute cap is 20. Chance-based weapon attribute increases can exceed it for a
particular skill, but do not increase inherent attribute benefits. Keep that distinction when
reusing the effective-rank calculator.
[Effect stacking](https://wiki.guildwars.com/wiki/Effect_stacking),
[Of Attribute](https://wiki.guildwars.com/wiki/Of_Attribute).

Primary attributes normally come from the primary profession. However, PvE blessings and
`of the (Profession)` weapon modifiers can grant a primary attribute to other professions.
A future calculator should consume a resolved inherent rank, rather than permanently ruling
out an effect solely by the character's primary profession.
[Primary attribute](https://wiki.guildwars.com/wiki/Primary_attribute).

Other recharge reductions multiply and generally share a 50% cap, with exceptions for individual
effects; Fast Casting is outside that cap. Energy modifier order and rounding need separate
rules: Expertise is applied after some other modifiers, and different energy effects use different
half-point rounding. An active skill's presence on the bar alone does not establish that it is
currently affecting the character.
[Recharge time](https://wiki.guildwars.com/wiki/Recharge_time),
[Expertise](https://wiki.guildwars.com/wiki/Expertise),
[Energy](https://wiki.guildwars.com/wiki/Energy).

## Other primary attributes

Spawning Power is the next relevant skill-value modifier: weapon spell duration increases by
4% per rank, rounded to whole seconds with exact halves rounded down. Created creatures also
receive 4% more health per rank. Duration needs the skill's own attribute-scaled value first;
intermediate rounding when combining modifiers deserves separate verification.
[Spawning Power](https://wiki.guildwars.com/wiki/Spawning_Power).

Leadership provides energy on shout/chant activation: `min(2 * affectedAllies, floor(r / 2))`.
That is an energy return dependent on affected allies, so preserve the skill's activation cost.
[Leadership](https://wiki.guildwars.com/wiki/Leadership).

Energy Storage increases maximum energy; Soul Reaping and Critical Strikes provide conditional
energy gain. Divine Favor adds healing, and Strength adds armor penetration. These do not
provide further inherent energy-cost or recharge multipliers.
[Primary attribute](https://wiki.guildwars.com/wiki/Primary_attribute).

## Source discrepancy

The primary-attribute summary still describes linear signet acceleration. The dedicated Fast
Casting page gives exponential scaling for spells and signets, supported by testing reported
on its talk page. Prefer the dedicated formula; retain a signet verification case.
[Primary attribute](https://wiki.guildwars.com/wiki/Primary_attribute),
[Fast Casting](https://wiki.guildwars.com/wiki/Fast_Casting),
[Talk:Fast Casting](https://wiki.guildwars.com/wiki/Talk:Fast_Casting#Signet_table_is_wrong).

## Build Wars implementation

[calculateSkillAttributeEffects](../src/domain/skill-attribute-effects.ts) projects the three
baseline metrics without mutating the catalog. It accepts independently resolved inherent ranks,
caps them at 20, normalizes recognized fractional activation values, and returns modified,
unchanged, or unresolved outcomes. Active skill effects, probabilistic weapon modifiers,
profession-granting weapons/blessings, and Spawning Power duration changes remain outside this
implementation. Combined energy-attribute effects return unresolved rather than assuming an order.

- [Skill catalog contracts](../src/domain/catalog.ts) already separate base energy, activation,
  and recharge, and retain absent, zero, special, and malformed states.
- [Editor selectors](../src/app/editor-selectors.ts) resolve the mode variant before projecting
  both facts and description. `selectTooltipRankContext` independently resolves Expertise,
  Mysticism, and Fast Casting using legal purchased ranks plus headgear and runes. Retained
  illegal allocations do not grant inherent benefits. Unresolved ranks or equipment preserve
  base values and include a short explanation in the tooltip.
- [Skill types](../src/domain/skill-types.ts) already provide inherited matching through
  `skillTypeMatches`, including touch spells, attack subtypes, rituals, and flash enchantments.
- The current catalog contains 335 activation records marked `special`; their texts include
  `{{1/4}}`, `{{3/4}}`, `{{3/2}}`, `{{1/2}}`, `{{1.5}}`, and `1`. The calculation accepts these
  through narrowly validated numeric normalization. Unknown special values remain unresolved.
- Relevant catalog IDs are Fast Casting `0`, Expertise `23`, Spawning Power `36`, and
  Mysticism `44`. Attribute ID zero is valid.

Rows, tooltip headers, and pinned details share `SkillFactValue`. Changed values have a dotted
underline; values unchanged after rounding retain normal styling. Tooltip footers show the
base/effective values, attribute rank, and PvE qualifier for recharge. Accessible labels include
the adjustment. The existing tooltip opens on hover, keyboard focus, or touch and dismisses with
Escape or an outside pointer press. Attribute hover/focus highlights changed facts and affected
skill-bar/grid icons through scoped CSS, without storing presentation state in the build.

Regression coverage lives in `test/domain/skill-attribute-effects.test.ts` and
`src/app/skill-attribute-effects.test.tsx`. Representative cases:

| Case                                                       | Expected baseline result       | Basis                 |
| ---------------------------------------------------------- | ------------------------------ | --------------------- |
| Expertise 12, eligible skill costing 10 energy             | 5 energy                       | Expertise table       |
| Mysticism 13, Dervish enchantment costing 5 energy         | 2 energy                       | Mysticism table       |
| Fast Casting 12, PvE Mesmer spell recharging in 15 seconds | 10 seconds                     | Fast Casting table    |
| Fast Casting 20, PvE Mesmer spell with 1-second recharge   | 1-second recharge              | Recharge floor        |
| Non-Mesmer spell with 1.5-second activation                | No activation reduction        | Eligibility threshold |
| PvP Mesmer spell / Mesmer signet                           | No inherent recharge reduction | Mode/type eligibility |
