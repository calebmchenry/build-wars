# SPRINT-020 Planning Evidence

## Scope and baseline

Planning began from clean HEAD `41b5e41` with SPRINT-001 through SPRINT-019
completed. This artifact records read-only planning observations. It is not
implementation test evidence or BW-1908 browser acceptance.

The parent read AGENTS.md, README.md, ticket conventions, the accepted design
brief, all eight source tickets, recent sprint/history records, and the supplied
attribute screenshot. Product decisions are settled. The normal interview and
final approval steps use the user's explicit noninteractive/auto-approval policy.

## Catalog checks

Read `data/generated/epic-10/runes.catalog.json` with Python JSON parsing:

- 126 `familyKind: attribute` records and their 126 referenced remote-media records.
- Exactly 30 distinct file titles and 30 distinct canonical-URL/remote-SHA1 pairs.
- Metadata includes file title, canonical URL, SHA1, MIME type, dimensions, byte
  size, source ID, and remote timestamp; binaries are not yet cached by this work.

Read `data/generated/epic-04/skills.catalog.json`:

| Template/catalog ID | Identity                 | Catalog availability           |
| ------------------- | ------------------------ | ------------------------------ |
| 198                 | Glyph of Elemental Power | Both modes                     |
| 1951                | Elemental Lord (Luxon)   | PvE only, title-based          |
| 2094                | Elemental Lord (Kurzick) | PvE only, title-based          |
| 2139                | Masochism                | PvE side of `split:skill:2139` |
| 3054                | Masochism (PvP)          | PvP side of `split:skill:2139` |
| 3431                | Heroic Refrain           | PvE only, elite                |

These observations verify local identity mapping, not new game measurements.

## Resolved Codex commands

The shell resolves `codex` directly to the installed Node executable, with no alias
or function wrapper. The installed `codex exec --help` no longer advertises
`--full-auto`; all lanes use the same workspace-write/never-approval command family
and existing authentication for draft and critique passes:

```sh
codex exec -m gpt-6-astra -c 'model_reasoning_effort="xhigh"' -s workspace-write -c 'approval_policy="never"' '<lane prompt>' > '<artifact>.log' 2>&1
codex exec -m gpt-5.6-sol -c 'model_reasoning_effort="xhigh"' -s workspace-write -c 'approval_policy="never"' '<lane prompt>' > '<artifact>.log' 2>&1
codex exec -m gpt-5.5 -c 'model_reasoning_effort="xhigh"' -s workspace-write -c 'approval_policy="never"' '<lane prompt>' > '<artifact>.log' 2>&1
```

Each lane is restricted by its prompt to its assigned markdown file, with no
skills, recursive planning, additional agents, code changes, or commits. Markdown
artifacts carry lane output; stdout/stderr are retained only in matching logs.
Long-running successful lanes are not replaced merely for being quiet.

## Source access check

On 2026-09-14 UTC, search-indexed Guild Wars Wiki results corroborated:

- Glyph's +2 elemental bonus and broader-than-spell anomaly.
  [Glyph of Elemental Power](https://wiki.guildwars.com/wiki/Glyph_of_Elemental_Power).
- Elemental Lord's +1 elemental bonus stacks with other attribute-boosting skills.
  [Elemental Lord](https://wiki.guildwars.com/wiki/Elemental_Lord).
- PvE Masochism's +2 Death Magic/Soul Reaping bonus.
  [Masochism](https://wiki.guildwars.com/wiki/Masochism).
- PvP Masochism supplies energy on sacrifice rather than the modeled rank bonus.
  [Masochism (PvP)](https://wiki.guildwars.com/wiki/Masochism_%28PvP%29).
- Refrain's caster-dependent magnitude reaches +4; ordinary recipient attribute
  scope excludes other-profession primary attributes.
  [Heroic Refrain](https://wiki.guildwars.com/wiki/Heroic_Refrain).
- Primary-only attribute runes, highest-per-attribute stacking, and headgear +1.
  [Attribute](https://wiki.guildwars.com/wiki/Attribute).
- Ordinary rank cap 20; chance-based weapon exceptions are separate.
  [Effect stacking](https://wiki.guildwars.com/wiki/Non-stacking).

Direct opens of Elemental Lord, Masochism (PvP), Attribute, and Rune returned HTTP 403. A refined search excluding discussion/user pages surfaced the Elemental Lord
article and corroborated its accepted +1 contract. Discussion/user pages are not
used as rule authority. BW-1901 must record fixture/source verification without
pretending a direct fetch succeeded.
No catalog or asset was downloaded/regenerated as part of this planning check.

## Concrete code audit for synthesis

- `src/app/composer-selectors.ts:selectFocusedAttributeRows` and
  `src/app/editor-selectors.ts:selectTooltipRankContext` separately collect semantic
  equipment. Route both through the new shared projection. The latter currently
  substitutes zero for unresolved description ranks and globally suppresses
  inherent-rank certainty when any equipment reason exists; neither behavior
  should be copied blindly into the new preview contract.
- `src/domain/effective-attribute-rank.ts` is a general contribution calculator;
  apply this milestone's cap in the preview layer, preserving general callers.
- `src/app/persistence-schema.ts:validateBuild` constructs a fresh Build object;
  adding a domain interface field alone does not preserve serialized inputs.
- `src/app/persistence-schema.ts:cloneBuild` and
  `src/domain/build-set.ts:cloneBuildForBuildSetEntry` copy explicit fields. The
  same audit must include constructors with literal `schemaVersion: 2` and all
  fixture builders so v3 does not get accidentally downgraded.
- `src/app/equipment-editor-state.ts` still handles hidden legacy armor edits;
  its current action union contains catalog selection IDs, not affected attribute
  facts. Narrow override invalidation needs an explicit catalog-fact path and
  regression coverage; do not reset all overrides for unrelated insignia/weapons.
- `src/app/template-import.ts:applyTemplateImport` validates input first, then
  combines equipment/title omissions in one confirmation, then calls the existing
  draft replacement guard. Add authored adjustments to that established flow
  without another confirmation layer.
- `src/app/components/TemplatePreview.tsx` displays decoded file professions/base
  allocations and local skill icons. Keep it isolated from active-editor state;
  no extra preview UI needs to be invented.
- Current actual file names include `src/app/components/FocusedAttributeEditor.tsx`,
  `TemplateBrowserDialog.tsx`, `TemplateFileControls.tsx`,
  `src/app/equipment-editor-state.ts`, and `src/app/styles.css`.
- Skill asset tooling is source-specific, not a generic rune cache: add a bounded
  rune entry point that reuses low-level network/artifact helpers and verifies
  catalog-provided media identities, rather than passing rune data into the skill
  parser or regenerating promoted catalogs.

## Verification record

Final planning integrity/formatting checks passed and are recorded in
[merge notes](SPRINT-020-MERGE-NOTES.md), covering the final sprint, ticket metadata,
ledger, result manifest, links, and planning-only change scope.
The runner's actual `read_ticket_doc` parser already verified all ten epic
dependencies are done, the eight listed tickets form the declared ordered DAG,
SPRINT-020 is next, and the existing ledger has no active sprint.
Implementation suites, runtime asset checks, and browser tests are intentionally
pending execution and may not be marked complete from this artifact.
