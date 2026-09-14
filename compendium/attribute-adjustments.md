# Composer Attribute Adjustments

Status: accepted product direction; implementation is tracked by
[EPIC-19](../work/tickets/19-composer-attribute-adjustments/EPIC.md).
This document describes the next milestone, not currently shipped controls.

## Product contract

The composer should show how the current skill bar performs with intended rune,
headgear, and temporary attribute bonuses. Base allocations remain the authored
point investment. Equipment choices and assumed active effects are additional
authored inputs; effective ranks are derived.

The user settled these decisions in the planning conversation on 2026-09-13:

- Rune controls belong inline with attribute allocation, using a single-choice
  None/+1/+2/+3 segment group and real profession/tier rune icons.
- Headgear is one optional +1 selection across the primary profession's attribute
  rows, with radio-like selection and an explicit clear action.
- Both equipment controls are available only on primary-profession attributes.
  Attributes of a secondary profession can still receive applicable skill buffs.
- No armor-slot management is required. This milestone does not mount the old
  equipment, party, or library panels.
- Increased effective ranks use blue text, following
  [the supplied game screenshot](../prior-art/gw-skills-and-attributes-refs/attributes-section.png).
  A hover/focus/touch-accessible explanation names the base and each contribution.
- Advanced checkboxes describe assumed active effects. Supported self buffs infer
  enabled from the current bar, with persistent manual overrides and reset to
  automatic. External effects are opt-in. A contributing-effect count remains
  visible when the area is collapsed.
- Current-draft autosave includes these choices. Named local saves and new
  complete-build transfer interfaces follow in a later milestone.
- Existing Guild Wars folder Load/Save and standard template content stay intact.
  Game files contain base professions, attributes, and skills, not the extra state.

## State and compatibility

Extend the existing authored `Build`, rather than storing a second editable
template code or attaching settings globally to a code string. Two builds with
identical game codes may intentionally have different bonuses. Imported raw code
and overlay evidence remain owned by the existing compatibility layer.

The intended state has two small parts:

| Part                        | Stored input                                                                                | Derived at runtime                                          |
| --------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Equipment attribute choices | Optional headgear override and per-attribute rune overrides                                 | Eligible headgear/rune contributions                        |
| Assumed effects             | Stable effect ID, explicit on/off preference when overridden, optional supported parameters | Automatic default, eligibility, active state, contributions |

Do not persist calculated effective ranks, checkbox defaults inferred from the
bar, catalog records, icon URLs, or descriptions. UI disclosure state does not
dirty the authored build.

### Existing equipment precedence

Existing builds may have detailed semantic armor in `Build.equipment`. Preserve
that data. Implement compact choices as **replacements for the addressed
headgear/rune contribution**, never as an additional equipment bonus layer:

- No override: derive that choice from the existing equipment helper.
- Explicit None: suppress that inherited contribution.
- Explicit selection: use that choice instead of the inherited contribution.
- A headgear override addresses the single headgear selection globally.
- A rune override addresses one attribute's highest rune contribution.

This permits a narrow edit without converting unresolved legacy selections to
zero or snapshotting/rearranging armor. All known and unresolved legacy evidence
remains in its original equipment record. Unknown or incompatible selected rune
IDs grant no bonus and remain diagnosable/removable. Use existing recoverable
selection patterns where appropriate. There is no total-health or armor-stat
claim in this milestone; show a rune's own health penalty as source information.

An implementation may refine type names, but must preserve the distinction
between inherited, explicitly empty, and explicitly selected. Freeze and test
that contract in BW-1901. If an existing hidden armor reducer is used later,
clear only the compact overrides for attribute contributions it actually edits
so that two authored surfaces cannot disagree silently; do not expose a new
armor-management workflow to solve this compatibility requirement.

On an actual primary-profession change, clear the compact gear overrides and
re-evaluate inherited equipment eligibility. Setting the same primary is a no-op.
Selecting Any has no eligible equipment controls. Existing semantic equipment and
raw template evidence are retained. Secondary changes leave eligible primary
equipment choices intact. Effect preferences survive profession/mode edits and
are gated by current eligibility. Normal game import replaces the selected draft
as it already does; cancellation leaves all state unchanged.

### Persistence

Version the Build schema when adding fields. Migrate existing Build v1/v2 data to
no compact overrides and no explicit effect preferences. The storage envelope is
currently v2 under `build-wars:v1`; keep that key and avoid unnecessary envelope
changes. New readers must accept supported old records and continue blocking
writes over corrupt/future-version data.

Validate bounded arrays/IDs, one override per attribute/effect, recognized
preference values, and Heroic Refrain's supported strength range. Reject malformed
input with the existing diagnostic/recovery behavior; do not silently drop valid
new fields. Preserve unknown-but-well-formed catalog selections as unresolved.

Audit constructors and explicit cloners as well as serializers. In particular:

- `src/domain/build.ts`, `src/domain/build-set.ts`
- `src/app/editor-state.ts`, `src/app/workspace-state.ts`
- `src/app/persistence-schema.ts`, `src/app/local-storage.ts`
- `src/app/template-workflow.ts`, `src/app/template-import.ts`
- `src/app/backup-restore.ts`, `src/app/build-set-transfer.ts`, `src/app/party-transfer.ts`

Persist active and inactive nested loadouts, duplicates, and saved-record internals
even though this milestone adds no UI for managing those collections. Include
new authored choices in dirty/revision fingerprints; exclude them from the
skill-template field fingerprint.

## Assumed effects

The first release supports the bounded definitions below. IDs are current
promoted-catalog template IDs, checked against the repository on 2026-09-13.
Implementation must assert their identity and variant mapping in fixtures.

| Logical effect           | Template IDs               | Contribution and applicability                                        | Initial behavior         |
| ------------------------ | -------------------------- | --------------------------------------------------------------------- | ------------------------ |
| Glyph of Elemental Power | 198                        | +2 Air, Earth, Fire, Water Magic; legal self skill in either mode     | Automatic from bar       |
| Elemental Lord           | 1951 Luxon, 2094 Kurzick   | +1 elemental attributes; PvE; faction versions count once             | Automatic from bar       |
| Masochism                | 2139 PvE; 3054 is excluded | +2 Death Magic and Soul Reaping; PvE version only                     | Automatic from bar       |
| Heroic Refrain           | 3431 as source identity    | Explicit +1..+4 to the recipient's ordinary available attributes; PvE | External assumption, off |

For self effects, automatic follows a resolved legal skill on the selected
loadout's current mode-resolved bar. A forced-on preference does not bypass
profession, mode, source-presence, or variant gates. An unrelated invalid skill
elsewhere on the bar does not disable an otherwise eligible effect. Resolve by
catalog/template identity, not localized name text or catalog search filters.

Checkbox edits author forced-on/forced-off preferences. Reset removes the explicit
preference and recomputes automatic. Removed or ineligible self skills contribute
nothing; remember the preference for re-addition and explain retained inactive
overrides. Deduplicate skill slots and faction variants by logical effect ID.

Heroic Refrain is one explicit external assumption even if that skill happens to
be on the recipient's bar. Show the assumed +1..+4 strength and start at +1 on the
first explicit enable unless the user selects another value. It never auto-checks
or derives potency from recipient Leadership. This supports a buff supplied by
another character without building a party simulator. Do not create a second
self-Refrain contribution or infer repeated casting.

The effect count counts distinct active effects with at least one applicable
target, including effects whose nominal contribution is clipped by the rank cap.
It excludes ineligible/remembered-off entries. These are planning assumptions;
duration, maintenance, cast order, and game connection state are not simulated.

## Rank projection and presentation

Use a shared projection for base, equipment-adjusted, and preview-effective ranks.
Reuse source-backed rune stacking and the existing contribution model. Apply the
ordinary attribute cap of 20 after the supported additive effects, retain the
uncapped sum for explanation, and do not clamp invalid base allocations into
apparently valid inputs. Chance-based weapon bonuses above 20 are out of scope.

Only the allocation arrows modify base ranks and point budgets. Rune/headgear
edits can apply at base rank zero. Effective rank is blue only when it exceeds
base, with accessible text explaining the increase; unresolved results must not
be presented as a trustworthy blue zero. Keep a readable numeric fallback if an
icon fails. Tooltip-only color distinctions are insufficient.

All relevant skill displays use the same preview ranks: catalog rows and alternate
views, bar/tooltips, descriptions, and the already-supported Expertise, Mysticism,
and Fast Casting calculations. Do not mutate catalog facts or title-rank inputs.
Standalone game-file previews use only that file's state, not the current editor's
bonuses. Computed durations under assumed effects describe the preview context,
not a simulation of the cast that originally applied the buff.

Permanent equipment validation continues to describe saved semantic equipment.
Do not inject preview assumptions into requirement/legality claims. Compact
profile diagnostics belong to the preview and cannot make a base-valid game
skill code unexportable. Future equipment integration can reconcile full loadouts
as its own use case.

## Game templates and future local builds

[Template files](template-files.md) remain the game interoperability surface.
Load still replaces the selected build using its existing confirmations and naming
behavior. After a successful ordinary import, equipment overrides are absent,
self effects infer from the new bar, and external assumptions are off. Invalid or
canceled import leaves every authored field intact.

Save/copy emits the exact-source or proven canonical **base skill code**, even
when preview ranks are higher. No sidecars, altered bitstream, extra text in game
files, or folder synchronization. Retain existing permissions, fresh file reads,
overwrite confirmation, write-completion reporting, fallback downloads, and name
updates. A save success preserves the browser draft's bonus settings.

Extend the existing import replacement message for explicitly authored adjustments
without adding another confirmation step. A short nonblocking note near game
export can explain that attribute adjustments are kept in the browser draft and
are not included in the game file. Automatic defaults alone need no discard
warning. Existing full-document backup and transfer internals must preserve the
new fields; new UI or formats for these operations are not required here.

Later milestones can introduce named local builds and complete-build file/URL
transfer, then explicit import/export between those records and the game folder.
They must use stable build identity rather than assuming a game code uniquely
identifies its equipment/effect configuration.

## Rune assets

The current rune catalog has 126 attribute runes sharing 30 source images: minor,
major, and superior for ten professions. Use its verified media identities and
deduplicate cached binaries. Follow the existing local skill-icon mapping pattern.
Extend [the asset decision](decisions/0002-runtime-gww-icon-assets.md) with a narrow
rune-path and manifest exception in BW-1904. The user requested these real icons;
the old skill-only exception does not require asking for the same authorization.

Runtime paths must be local. Preserve source URLs, file titles, hashes, and local
paths in provenance records. The project must remain usable when an image is
missing. Do not regenerate unrelated promoted game catalogs for UI work.

## Source facts and limits

Research was checked through search-indexed Guild Wars Wiki pages during this
conversation on 2026-09-13; direct wiki access may return 403. These are documented
game rules, not new in-game measurements.

- [Attribute](https://wiki.guildwars.com/wiki/Attribute) and
  [Rune](https://wiki.guildwars.com/wiki/Rune): primary-only equipment bonuses,
  highest rune per attribute, stacking headgear, and ordinary rank cap. Rune health
  penalties are distinct from rank stacking.
- [Glyph of Elemental Power](https://wiki.guildwars.com/wiki/Glyph_of_Elemental_Power):
  +2 elemental attributes. Its documented anomaly applies the increase beyond
  spells while active; do not restrict the preview to spell-type skills.
- [Elemental Lord](https://wiki.guildwars.com/wiki/Elemental_Lord): +1 elemental
  attributes stacking with other skill bonuses. This excludes Energy Storage and
  Dervish Earth/Wind Prayers.
- [Masochism](https://wiki.guildwars.com/wiki/Masochism) and
  [Masochism (PvP)](https://wiki.guildwars.com/wiki/Masochism_%28PvP%29): only the PvE
  version supplies the modeled attribute increase.
- [Heroic Refrain](https://wiki.guildwars.com/wiki/Heroic_Refrain): +1..+4 strength
  depends on the caster; available primary/secondary attribute scope excludes
  titles and normally unavailable other-profession primary attributes. Its recast
  interactions justify an explicit assumed magnitude for this milestone.
- [Skill template format](https://wiki.guildwars.com/wiki/Skill_template_format)
  and [Template](https://wiki.guildwars.com/wiki/Template): base game template
  interoperability remains separate from additional local authored settings.

## Acceptance evidence

Require source-backed math fixtures, identity/mode fixtures, override lifecycle
tests, old/new persistence and complete transfer round trips, unchanged game-code
exports, cancellation protection, and meaningful keyboard/component tests.

For UI acceptance, inspect actual browser rendering at 1280px, 900px, 390px and
200% zoom, in both themes, with long names and missing icons. Record browser,
scenario, viewport, and results/screenshots. Verify blue ranks against the supplied
image, breakdown access, mutually exclusive controls, automatic overrides, reload,
and game-file behavior using a disposable copied Skills folder. CSS inspection or
jsdom tests alone are not real browser evidence.

Execution must pass `npm run verify` and `git diff --check`. Setup alone does not
claim implementation or browser verification. The burn owns execution sprint
numbering, ledger updates, and ticket closeout.
