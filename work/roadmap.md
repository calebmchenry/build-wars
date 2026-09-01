# Roadmap

Research date: 2026-09-01

## Research findings

* Guild Wars Wiki is a MediaWiki site with an API at `https://wiki.guildwars.com/api.php`.
  * Skill pages expose useful structured fields through `{{Skill infobox}}`: id, campaign, profession, attribute, type, elite status, PvE/PvP split markers, costs, activation, recharge, target/range/AoE metadata, causes/removes categories, descriptions, and progression snippets.
  * `Guild Wars Wiki:Game integration/Skills` provides skill-id lists and links to profession skill lists.
  * File metadata can be fetched with `prop=imageinfo`, so skill icons can be cached from wiki file URLs.
* Skill template format is documented and should be treated as a compatibility requirement.
  * Skill templates are base64 encoded bitstreams with a skill-template type header, primary/secondary profession ids, attribute ids/ranks, eight skill ids, and a trailing zero bit.
  * Skill template imports should also accept chat-code wrappers like `[Build Name;CODE]`.
* Equipment template format is also documented.
  * Equipment templates encode item slots, item ids, modifier ids, dye colors, and variable bit counts.
  * This probably covers PvP-style equipment templates better than arbitrary PvE inventory items.
* There is already a build-wars `gw-templates` package that encodes/decodes skill templates, equipment templates, and paw-ned2 team builds in PHP and JavaScript.
  * Roadmap should include evaluating it before writing our own parser.
* PvX pages encode more than just skill bars.
  * Build pages commonly include status/rating metadata, variants, optional skills, equipment, usage, synergy, counters, and related builds.
  * PvX categories distinguish working, great, archived, untested, PvE, PvP, team, hero, farming, running, quest, speed-clear, GvG, HA, RA, AB, FA, JQ, and other build families.
* Existing tools suggest useful expectations:
  * GW1 Builds supports skill/equipment code import, manual search, scaled skill descriptions, variants, solo/team builds up to 12 slots, private sharing, collaboration, and PvX archive search.
  * Guild Wars Build Creator exposes character level, attribute quest toggles, campaign/title/pre-Searing filters, build statistics, and PWA-style install.
  * GW Memorial's decoder supports dated decoding against skill revisions, which matters now that Reforged balance updates are active again.
  * GWToolbox build management supports team build names, per-member build names/codes, send/load workflows, preferred skill ordering, and consumable notes.

## Phase 0: Project foundation

* Decide app scope for the first milestone.
  * Local-only build tool first.
  * Cloud sharing later unless explicitly prioritized.
* Pick app stack.
  * Likely TypeScript web app with local storage.
  * Keep data ingestion scripts separate from UI code.
* Define durable domain models.
  * `Profession`
  * `Attribute`
  * `Skill`
  * `SkillProgression`
  * `Rune`
  * `Insignia`
  * `ArmorPiece`
  * `Weapon`
  * `WeaponModifier`
  * `Build`
  * `EquipmentTemplate`
  * `PartyBuild`
  * `Guide`
* Add fixture-driven tests early.
  * Known skill template codes.
  * Known equipment template codes.
  * Known invalid template codes.
  * Known PvE/PvP split skills.
  * Known attribute/rune edge cases.

## Phase 1: Data pipeline

* Build a Guild Wars Wiki ingestion script.
  * Fetch skill pages through MediaWiki API.
  * Parse `{{Skill infobox}}` fields.
  * Parse `{{Skill progression}}`, `{{gr}}`, and exceptional progression templates.
  * Fetch icon metadata and cache icon URLs or local files.
  * Preserve source page, revision id, and fetch timestamp per record.
* Catalog professions.
  * Names, abbreviations, icons, campaign availability, primary attribute, secondary attributes, armor class/style metadata.
* Catalog attributes.
  * Profession ownership.
  * Primary-only restrictions.
  * Inherent primary effects.
  * Attribute id mappings from skill template format.
* Catalog all skills.
  * Name, id, icon, campaign, profession, attribute, type.
  * Energy, adrenaline, sacrifice, upkeep, overcast, activation, recharge.
  * Elite flag.
  * PvE-only flag.
  * PvE/PvP split relationship.
  * Title-track relationship for PvE-only skills.
  * No-attribute/common/special-skill handling.
  * Acquisition metadata only if useful for guides.
* Catalog runes.
  * Names, icons, profession restrictions, attribute bonus, health penalty, vigor/vitae/attunement behavior.
  * Non-stacking rule: highest attribute rune applies, health penalties still matter.
* Catalog insignias.
  * Names, icons, profession restrictions, armor slot scaling, conditions, effects.
* Catalog equipment.
  * Armor slots: head, chest, hands, legs, feet.
  * Weapon/offhand slots and four weapon sets.
  * Weapon types, requirements, inscriptions, prefixes, suffixes, focus/shield/offhand constraints.
  * Dye color ids from equipment templates.
* Catalog consumables and optional team notes.
  * Pcons / cons used by speed-clear and team-build tools.
  * Keep this optional for MVP unless team builds are prioritized.
* Create data QA reports.
  * Missing ids/icons.
  * Unknown template ids.
  * Skills missing costs or descriptions.
  * PvE/PvP pairs missing a relationship.
  * Diff report after a wiki/game update.

## Phase 2: Template compatibility

* Evaluate `@buildwars/gw-templates`.
  * Confirm license and browser bundle suitability.
  * Confirm current Reforged skill/equipment ids.
  * Decide dependency vs port vs local implementation.
* Implement skill template import/export.
  * Decode and encode primary profession, secondary profession, attributes, and eight skill ids.
  * Accept raw codes and chat codes.
  * Preserve imported build name when present.
  * Explain or tolerate equivalent-but-not-identical encoded output.
* Implement equipment template import/export.
  * Decode item slots, item ids, dye colors, and modifier ids.
  * Encode current equipment back to a valid template code.
  * Represent unsupported or unknown items without data loss.
* Implement paw-ned2 team build import/export.
  * Decode team blobs into player/hero slots, skill code, equipment code, weapon sets, labels, descriptions, attributes, and flags.
  * Support up to 12 team members for compatibility with existing tools.
* Add compatibility tests.
  * Round-trip decode/encode/decode tests.
  * Invalid base64 and malformed bitstream tests.
  * Old pre-April-5-2007 header handling if feasible.

## Phase 3: Game-rule validation

* Validate profession restrictions.
  * Primary and secondary profession combinations.
  * Campaign ownership availability if the app models account constraints.
  * Primary attributes only available to the primary profession.
* Validate skill bars.
  * Exactly 8 skill slots, with optional empty slots during editing.
  * At most 1 elite skill.
  * At most 3 PvE-only skills.
  * PvE-only skills unavailable in PvP builds.
  * Allegiance skills limited to one side at a time.
  * Skill profession must match primary or secondary profession unless common/special.
* Validate attribute points.
  * Level-based point totals.
  * Attribute quest toggles, default checked at level 20.
  * Maximum base rank 12 from points.
  * Rune/headgear/temporary override ranks above base.
  * Attribute cap display: normal cap 20, with weapon-mod proc edge cases noted separately.
* Model effective attribute rank.
  * Base points.
  * Headgear bonus.
  * Rune bonus.
  * Temporary manual overrides from skills, consumables, blessings, or build-guide assumptions.
  * Title-rank scaling for title skills.
* Model effective skill costs where practical.
  * Expertise reductions.
  * Mysticism reductions.
  * Fast Casting activation/recharge effects.
  * Other primary-attribute effects as display notes before calculator-grade precision.
* Validate equipment.
  * Rune and insignia profession restrictions.
  * One rune and one insignia per armor piece.
  * Headgear attribute bonus behavior.
  * Weapon requirement matching and unmet-requirement warning.
  * Modifier slot compatibility.

## Phase 4: Builder UI

* Build the core build editor.
  * Primary/secondary profession selector.
  * Attribute editor with remaining points, level selector, and attribute quest toggles.
  * Eight-slot skill bar with drag/drop reordering.
  * Skill search/palette.
  * Inline validation warnings.
  * Copy/import skill template code.
* Build skill browsing and filters.
  * Profession, attribute, campaign, type, elite, PvE-only, PvP version, title track, pre-Searing, resource cost, activation, recharge.
  * Search by name and common abbreviations.
  * Optional slots and replacement suggestions later.
* Build in-game-style skill display.
  * Icon, name, cost row, profession, attribute, type, campaign.
  * Dynamic description based on selected effective attribute/title rank.
  * Wiki link on each skill, for example `https://wiki.guildwars.com/wiki/Shield_of_Absorption`.
  * Tooltip styling based on screenshots gathered manually.
* Build equipment editor.
  * Armor pieces with rune and insignia controls.
  * Weapon sets with main hand/offhand or two-handed weapon logic.
  * Prefix, suffix, inscription, requirement, and dye controls.
  * Copy/import equipment template code.
* Build statistics panel.
  * Health, energy, armor notes.
  * Attribute totals.
  * Skill cost summary.
  * Recharge/activation overview.
  * Validation status.

## Phase 5: Local library and sharing

* Store builds in local storage.
  * Build list, create/edit/delete/duplicate.
  * Tags, professions, build type, game mode, favorites.
  * Versioned local schema migrations.
* Add import/export.
  * Single build JSON.
  * Party build JSON.
  * Skill/equipment template codes.
  * paw-ned2 team code.
  * Backup/restore all local data.
* Add shareable URLs.
  * Encoded build state in URL for small builds.
  * Graceful fallback when URLs are too large.
  * Optional hosted sharing later.
* Add offline/PWA support if web app.
  * Cache app shell and static game data.
  * Make data freshness visible.

## Phase 6: Guides and build knowledge

* Add guide authoring.
  * Simple markdown or lightweight rich text.
  * Skill links.
  * Build-code embeds.
  * Equipment embeds.
  * Section templates for overview, attributes and skills, variants, equipment, usage, counters, and synergy.
* Support variants.
  * Named variants with alternate skills/equipment/attributes.
  * Optional skill slots.
  * Notes for why a variant exists.
* Support community-style metadata.
  * Mode: PvE, PvP, farming, running, hero, team, speed-clear, GvG, HA, RA, AB, FA, JQ, quest.
  * Status/rating inspired by PvX: testing, working, great, archived, needs update.
  * Source attribution and external links.
* Research PvX import separately.
  * Decide whether to import page metadata only, link out, or parse full build pages.
  * Avoid wholesale content copying until licensing/attribution expectations are clear.
  * Map PvX `[build ...][/build]`, `Variantbar`, skill icon, equipment, usage, synergy, and counter patterns.

## Phase 7: Party and hero compositions

* Add party builder.
  * Solo, player plus heroes, mercenary heroes, and larger team formats up to 12 slots.
  * Slot labels, role labels, professions, skill bars, equipment, and guide notes.
  * Duplicate slots for repeated heroes/builds.
* Add hero-specific support.
  * Hero names and profession options.
  * Hero AI notes for skills that behave differently under AI.
  * Preferred skill order.
  * Manual micro/avoid/maintain notes.
* Add team workflow helpers.
  * Send/copy all skill templates.
  * Copy team text summary.
  * Track consumables/pcons as optional notes.
  * Party synergy and conflict notes.

## Phase 8: Advanced analysis

* Skill revision/history support.
  * Store data version per build.
  * Show when a build was created against older skill data.
  * Optional dated decoder like GW Memorial.
* Breakpoint helpers.
  * Attribute breakpoints from skill progression.
  * Title-rank breakpoints.
  * Weapon requirement thresholds.
* Synergy and warning rules.
  * Duplicate unique effects.
  * Missing resurrection.
  * Too many PvE-only skills.
  * Energy pressure.
  * Enchantment/stance dependency.
  * Damage-type conflicts with support skills.
* Search and discovery.
  * Full-text local search across builds and guides.
  * Filters by profession pair, skill, role, mode, rating, and source.
  * Later: import or index PvX/GW1 Builds archive metadata.

## Open questions

* MVP scope: single-character builder first, or team builder first?
* Data policy: cache wiki-derived data in-repo, generate it at build time, or fetch/update from the client?
* Parser policy: depend on `@buildwars/gw-templates`, port it, or write a native implementation?
* Sharing policy: local-only and URL sharing, or account-backed hosted sharing?
* PvX policy: link out, metadata-only import, or full page import with attribution?
* Aesthetic target: strict in-game clone, inspired-by UI, or modern builder with in-game tooltips?
* Platform target: desktop-first, mobile-first, or responsive/PWA from the start?

## Sources to revisit

* Guild Wars Wiki API: https://wiki.guildwars.com/api.php
* Skill template format: https://wiki.guildwars.com/wiki/Skill_template_format
* Equipment template format: https://wiki.guildwars.com/wiki/Equipment_template_format
* Game integration skill ids: https://wiki.guildwars.com/wiki/Guild_Wars_Wiki:Game_integration/Skills
* Skill infobox template: https://wiki.guildwars.com/wiki/Template:Skill_infobox
* Attribute points: https://wiki.guildwars.com/wiki/Attribute_point
* PvE-only skills: https://wiki.guildwars.com/wiki/List_of_PvE-only_skills
* Title skills: https://wiki.guildwars.com/wiki/Title_skill
* Reforged game updates: https://wiki.guildwars.com/wiki/Game_updates
* build-wars gw-templates: https://github.com/build-wars/gw-templates
* GW1 Builds: https://github.com/gw1tools/gw1builds
* Guild Wars Build Creator: https://guildwars.magical.ch/
* GW Memorial template decoder: https://www.gw-memorial.net/templateDecoder/
* GWToolbox builds: https://www.gwtoolbox.com/docs/builds/
