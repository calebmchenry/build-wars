# Guild Wars Wiki Icon Assets

These files are the manually imported runtime-media exception approved by the maintainer in chat on
2026-09-03 for the focused composer icon pass. Runtime code imports these local files only; it must
not hotlink Guild Wars Wiki media URLs.

The broad generated skill-icon cache lives under `public/gww-icons/skills/`. Its local runtime
mapping is `src/app/skill-icon-assets.generated.json`; its source provenance is
`data/generated/epic-04/skill-icon-assets.manifest.json`.

The profession PNGs were checked after download. The 60px files already include transparent alpha
and contain no opaque near-white edge background pixels.

| Local file                       | Source URL                                                                                                          | Notes                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `divine-boon.jpg`                | `https://wiki.guildwars.com/images/1/1c/Divine_Boon.jpg`                                                            | Example cached skill icon.              |
| `hammer-bash.jpg`                | `https://wiki.guildwars.com/images/d/dd/Hammer_Bash.jpg`                                                            | Default build skill icon.               |
| `healing-signet.jpg`             | `https://wiki.guildwars.com/images/e/e6/Healing_Signet.jpg`                                                         | Default build skill icon.               |
| `hunters-shot.jpg`               | `https://wiki.guildwars.com/images/7/7c/Hunter%27s_Shot.jpg`                                                        | Default build skill icon.               |
| `mighty-blow.jpg`                | `https://wiki.guildwars.com/images/d/da/Mighty_Blow.jpg`                                                            | Default build skill icon.               |
| `pin-down.jpg`                   | `https://wiki.guildwars.com/images/8/81/Pin_Down.jpg`                                                               | Default build skill icon.               |
| `profession-assassin-20.png`     | `https://wiki.guildwars.com/images/5/5f/Assassin-tango-icon-20.png`                                                 | Compact profession icon.                |
| `profession-assassin-60.png`     | `https://wiki.guildwars.com/images/thumb/3/34/Assassin-tango-icon-200.png/60px-Assassin-tango-icon-200.png`         | Profession picker icon.                 |
| `profession-dervish-20.png`      | `https://wiki.guildwars.com/images/3/3e/Dervish-tango-icon-20.png`                                                  | Compact profession icon.                |
| `profession-dervish-60.png`      | `https://wiki.guildwars.com/images/thumb/b/bf/Dervish-tango-icon-200.png/60px-Dervish-tango-icon-200.png`           | Profession picker icon.                 |
| `profession-elementalist-20.png` | `https://wiki.guildwars.com/images/a/ab/Elementalist-tango-icon-20.png`                                             | Compact profession icon.                |
| `profession-elementalist-60.png` | `https://wiki.guildwars.com/images/thumb/3/3c/Elementalist-tango-icon-200.png/60px-Elementalist-tango-icon-200.png` | Profession picker icon.                 |
| `profession-mesmer-20.png`       | `https://wiki.guildwars.com/images/f/fb/Mesmer-tango-icon-20.png`                                                   | Compact profession icon.                |
| `profession-mesmer-60.png`       | `https://wiki.guildwars.com/images/thumb/c/cc/Mesmer-tango-icon-200.png/60px-Mesmer-tango-icon-200.png`             | Profession picker icon.                 |
| `profession-monk-20.png`         | `https://wiki.guildwars.com/images/f/f8/Monk-tango-icon-20.png`                                                     | Compact profession icon.                |
| `profession-monk-60.png`         | `https://wiki.guildwars.com/images/thumb/8/86/Monk-tango-icon-200.png/60px-Monk-tango-icon-200.png`                 | Profession picker icon.                 |
| `profession-necromancer-20.png`  | `https://wiki.guildwars.com/images/7/7b/Necromancer-tango-icon-20.png`                                              | Compact profession icon.                |
| `profession-necromancer-60.png`  | `https://wiki.guildwars.com/images/thumb/a/a8/Necromancer-tango-icon-200.png/60px-Necromancer-tango-icon-200.png`   | Profession picker icon.                 |
| `profession-paragon-20.png`      | `https://wiki.guildwars.com/images/5/55/Paragon-tango-icon-20.png`                                                  | Compact profession icon.                |
| `profession-paragon-60.png`      | `https://wiki.guildwars.com/images/thumb/2/21/Paragon-tango-icon-200.png/60px-Paragon-tango-icon-200.png`           | Profession picker icon.                 |
| `profession-ranger-20.png`       | `https://wiki.guildwars.com/images/d/dc/Ranger-tango-icon-20.png`                                                   | Compact profession icon.                |
| `profession-ranger-60.png`       | `https://wiki.guildwars.com/images/thumb/4/43/Ranger-tango-icon-200.png/60px-Ranger-tango-icon-200.png`             | Profession picker icon.                 |
| `profession-ritualist-20.png`    | `https://wiki.guildwars.com/images/8/81/Ritualist-tango-icon-20.png`                                                | Compact profession icon.                |
| `profession-ritualist-60.png`    | `https://wiki.guildwars.com/images/thumb/1/15/Ritualist-tango-icon-200.png/60px-Ritualist-tango-icon-200.png`       | Profession picker icon.                 |
| `profession-warrior-20.png`      | `https://wiki.guildwars.com/images/3/3b/Warrior-tango-icon-20.png`                                                  | Compact profession icon.                |
| `profession-warrior-60.png`      | `https://wiki.guildwars.com/images/thumb/8/88/Warrior-tango-icon-200.png/60px-Warrior-tango-icon-200.png`           | Profession picker icon.                 |
| `resurrection-signet.jpg`        | `https://wiki.guildwars.com/images/e/e0/Resurrection_Signet.jpg`                                                    | Default build skill icon.               |
| `rush.jpg`                       | `https://wiki.guildwars.com/images/f/fb/Rush.jpg`                                                                   | Default build skill icon.               |
| `tango-activation-darker.png`    | `https://wiki.guildwars.com/images/a/aa/Tango-activation-darker.png`                                                | Activation/cast-time fact icon.         |
| `tango-adrenaline.png`           | `https://wiki.guildwars.com/images/0/0d/Tango-adrenaline.png`                                                       | Adrenaline fact icon.                   |
| `tango-energy.png`               | `https://wiki.guildwars.com/images/b/be/Tango-energy.png`                                                           | Energy fact icon.                       |
| `tango-overcast.png`             | `https://wiki.guildwars.com/images/e/e3/Tango-overcast.png`                                                         | Overcast fact icon.                     |
| `tango-recharge-darker.png`      | `https://wiki.guildwars.com/images/f/f4/Tango-recharge-darker.png`                                                  | Recharge and morale-recharge fact icon. |
| `tango-sacrifice.png`            | `https://wiki.guildwars.com/images/7/78/Tango-sacrifice.png`                                                        | Sacrifice fact icon.                    |
| `tango-upkeep.png`               | `https://wiki.guildwars.com/images/0/01/Tango-upkeep.png`                                                           | Upkeep fact icon.                       |
| `to-the-limit.jpg`               | `https://wiki.guildwars.com/images/a/a4/%22To_the_Limit%21%22.jpg`                                                  | Default build skill icon.               |
