# Epic Index

Epics are ordered roughly by implementation dependency. The `track` column keeps functional work and content/data exhaustiveness visible without splitting the directory tree.

| Order | Track | Epic | Purpose |
| --- | --- | --- | --- |
| 00 | functional | [Project Foundation](00-project-foundation/EPIC.md) | Choose the app shape, repo conventions, testing strategy, and durable domain boundaries. |
| 01 | content | [Source Policy and QA](01-source-policy-and-qa/EPIC.md) | Define what data can be copied, cached, attributed, regenerated, and tested. |
| 02 | functional | [Data Ingestion Platform](02-data-ingestion-platform/EPIC.md) | Build repeatable scripts for pulling, parsing, normalizing, and validating source data. |
| 03 | content | [Professions and Attributes](03-professions-and-attributes/EPIC.md) | Catalog professions, attributes, ids, icons, restrictions, and primary effects. |
| 04 | content | [Skills](04-skills/EPIC.md) | Catalog every skill, icon, cost, description, progression, split, and template id. |
| 05 | functional | [Template Compatibility](05-template-compatibility/EPIC.md) | Import/export skill templates, equipment templates, and team formats used by existing tools. |
| 06 | functional | [Game Rule Engine](06-game-rule-engine/EPIC.md) | Validate profession, skill, attribute, rune, insignia, and equipment legality. |
| 07 | content | [Visual Prior Art](07-visual-prior-art/EPIC.md) | Organize screenshots and extract UI/aesthetic reference notes. |
| 08 | functional | [Core Build Editor](08-core-build-editor/EPIC.md) | Build the primary single-character skill and attribute editing experience. |
| 09 | functional | [Local Library and Sharing](09-local-library-and-sharing/EPIC.md) | Store, manage, import, export, back up, and share builds locally. |
| 10 | content | [Runes](10-runes/EPIC.md) | Catalog all runes, restrictions, bonuses, penalties, and stacking behavior. |
| 11 | content | [Insignias](11-insignias/EPIC.md) | Catalog all insignias, restrictions, slot scaling, conditions, and effects. |
| 12 | content | [Weapons and Mods](12-weapons-and-mods/EPIC.md) | Catalog weapon types, requirements, prefixes, suffixes, inscriptions, and upgrade constraints. |
| 13 | functional | [Equipment Shell Model](13-armor-and-equipment/EPIC.md) | Define semantic equipment slots, headgear, and attachment points without skin/dye scope. |
| 14 | functional | [Equipment Editor](14-equipment-editor/EPIC.md) | Build semantic armor, rune, insignia, weapon, mod, and weapon-set editing. |
| 15 | functional | [Title Rank Controls and PvE-only](15-title-tracks-and-pve-only/EPIC.md) | Default title-scaled skills to max rank and provide compact controls for user rank overrides. |
| 16 | functional | [Multi-Build Workspace](16-heroes-and-henchmen/EPIC.md) | View, compare, edit, duplicate, and save multiple complete build loadouts together. |
| 17 | functional | [Party Semantics and Sharing](17-party-and-hero-builder/EPIC.md) | Add party labels, ordering, validation, and sharing on top of multi-build workspaces. |
| 18 | content | [Community Build Knowledge](18-community-build-knowledge/EPIC.md) | Model PvX/GW1 Builds style metadata, variants, ratings, usage, counters, and synergy. |
| 19 | functional | [Guide Authoring](19-guide-authoring/EPIC.md) | Write guides with embedded builds, variants, equipment, and skill links. |
| 20 | functional | [Search and Discovery](20-search-and-discovery/EPIC.md) | Search and filter skills, builds, guides, parties, and imported community metadata. |
| 21 | functional | [Advanced Analysis](21-advanced-analysis/EPIC.md) | Add revision awareness, breakpoint helpers, warnings, and deeper build analysis. |

## Suggested First Milestone

1. `EPIC-00 Project Foundation`
2. `EPIC-01 Source Policy and QA`
3. `EPIC-02 Data Ingestion Platform`
4. `EPIC-03 Professions and Attributes`
5. `EPIC-04 Skills`
6. `EPIC-05 Template Compatibility`
7. `EPIC-06 Game Rule Engine`
8. `EPIC-07 Visual Prior Art`
9. `EPIC-08 Core Build Editor`

This gets to a useful single-character skill/attribute builder before expanding into exhaustive equipment, parties, guides, and analysis.
