# Build Wars

Build Wars is a local-first TypeScript web app for Guild Wars Reforged build tooling. The current
app opens to a focused two-panel build composer with the active loadout on the left and a compact
skills catalog on the right. Durable secondary tools preserve neutral multi-build workspaces,
optional party annotations and sharing, equipment and title workspaces, the local saved-document
library, selected-loadout template sharing, backup/restore, framework-neutral domain contracts,
template import/export compatibility, source policy, and offline-first promoted catalog data.

## Prerequisites

- Node.js `22.11.0` or newer
- npm `11.10.1` or newer
- Python 3 for ticket-burn and data-ingestion unit tests

## Commands

```sh
npm ci
npm run dev
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run data:setup
npm run data:test
npm run data:regenerate
npm run verify
```

`npm run verify` is the canonical repository validation command. It runs formatting checks, linting,
type checking, Vitest tests, the production build, fast offline data-ingestion tests, and
`python3 -m unittest scripts/test_ticket_burn.py`.

Run `npm run data:setup` once after `npm ci`. It creates the ignored `.venv-data` virtualenv and
installs the pinned Python parser dependency from `scripts/data/requirements.txt`.

`npm run data:regenerate` runs fixture mode only. It uses committed minimized synthetic fixtures,
fixed timestamps, and an output root under ignored `work/runs/data-ingestion`.
The default fixture run preserves the EPIC-02 skill-ID proof and also writes the EPIC-03
professions/attributes fixture catalog, the EPIC-04 synthetic skills catalog, the EPIC-10
synthetic runes catalog, the EPIC-11 synthetic insignias catalog, and the EPIC-12 synthetic weapons
and mods catalogs. Run EPIC-03, EPIC-04, EPIC-10, EPIC-11, and EPIC-12 profiles directly with
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-03-professions-attributes`.
For EPIC-04 use
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-04-skills`.
For EPIC-10 use
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-10-runes`.
For EPIC-11 use
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-11-insignias`.
For EPIC-12 use
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-12-weapons-and-mods`.

## Current Scope

Included now:

- Single private npm package
- React, Vite, TypeScript, Vitest, ESLint, and Prettier
- Minimal accessible app shell
- Plain-data contracts in `src/domain`
- Synthetic foundation and ingestion fixtures in `test/fixtures`
- Source-policy gate for future source-derived data, media metadata, QA review, and release
  decisions
- Shared Python ingestion tooling under `scripts/data` for MediaWiki access, snapshots, parser
  proofing, skill-ID enumeration, icon metadata, deterministic artifacts, QA reports, and fixture
  regeneration
- Runtime-eligible EPIC-03 professions/attributes catalog data at
  `data/generated/epic-03/professions-attributes.catalog.json`, with an adjacent generated manifest
  and bounded QA report
- Runtime-eligible EPIC-04 skills catalog data at `data/generated/epic-04/skills.catalog.json`,
  with an adjacent generated manifest and bounded QA report. Runtime code must consume only the
  catalog JSON, not the manifest, QA report, source plans, snapshots, Python tooling, or wiki APIs.
- Runtime-eligible EPIC-10 runes catalog data at `data/generated/epic-10/runes.catalog.json`,
  with an adjacent generated manifest and bounded QA report. Runtime code must consume only the
  catalog JSON; manifests, QA reports, source plans, snapshot sets, raw snapshots, QA summaries,
  review evidence, icon bytes, Python tooling, and wiki APIs remain non-runtime.
- Runtime-eligible EPIC-11 insignias catalog data at
  `data/generated/epic-11/insignias.catalog.json`, with an adjacent generated manifest and bounded
  QA report. Runtime code must consume only the catalog JSON; manifests, QA reports, source plans,
  snapshot sets, raw snapshots, QA summaries, review evidence, icon bytes, Python tooling, and wiki
  APIs remain non-runtime.
- Runtime-eligible EPIC-12 weapons and mods catalog data at
  `data/generated/epic-12/weapons.catalog.json` and
  `data/generated/epic-12/weapon-mods.catalog.json`, with adjacent generated manifests and bounded
  QA reports. Runtime code must consume only the catalog JSON files; manifests, QA reports, source
  plans, snapshot sets, raw snapshots, QA summaries, review evidence, icon bytes, Python tooling,
  and wiki APIs remain non-runtime.
- Framework-neutral Guild Wars skill and raw equipment template import/export APIs under
  `src/template-compatibility`, backed by a pinned `@buildwars/gw-templates@1.1.1` adapter.
- Pure domain rule-engine APIs for authored builds: `validateBuild`,
  `calculateEffectiveAttributeRank`, and title-rank discovery/resolution helpers.
- A framework-neutral semantic equipment shell for one authored build: nullable
  `EquipmentLoadout`, canonical armor and weapon-set topology, known/unresolved semantic equipment
  selections, headgear and rune rank-adjustment helpers, weapon-set analysis, and optional
  equipment validation catalog views.
- A browser-based focused build composer under `src/app` for one active authored loadout at a time:
  inline build naming, Any-aware profession pickers, PvE attribute budgets, effective-rank display,
  a deterministic skills catalog, an eight-slot skill bar with shared pointer/click/keyboard
  placement policy, inline skill-template import/export, tooltips, and policy-safe placeholder
  icons/glyphs. Library, build-set, party, equipment, title-rank, sharing, validation,
  backup/restore, and transfer workflows remain available as secondary tools without changing the
  storage key or persistence schema.
- Neutral build sets under `src/domain/build-set.ts` and `src/app/build-set-state.ts`: up to 16
  complete loadouts with stable entry IDs, labels, `build | variant | freeform` kinds, notes, one
  active editor, inactive durable snapshots, duplicate variants, comparison rows, aggregate
  per-entry validation status, and Build Wars JSON transfer.
- Optional party workspaces under `src/domain/party.ts` and `src/app`: versioned party annotations
  over build sets with ordered nullable slots, independent party order, presets 2/4/6/8/12, custom
  sizes 1-16, labels, roles, member-kind labels, slot notes, unassigned loadouts, structural party
  validation, native party JSON transfer, and bounded multi-code text copy.
- A browser-based equipment editor under `src/app`: five canonical armor slots for runes,
  insignias, and headgear bonuses; four canonical weapon sets for main hand, off hand, two-handed,
  stale, unresolved, and modifier states; per-family equipment catalog readiness; inline validation;
  and conservative health, energy, armor, requirement, and attribution summaries.
- Local library and sharing workflows under `src/app`: one `localStorage` key (`build-wars:v1`) with
  schema-2 mixed build/build-set documents, versioned nested build-set snapshots, schema-1 migration
  on read, working-draft autosave, explicit saved records, search/filter/sort, tags, favorites,
  notes, semantic equipment, title-rank persistence, optional party metadata, template-code-first
  share URLs capped at 1,800 characters, inert JSON whole-library backup/restore, inert Build Wars
  JSON build-set transfer, and native party JSON transfer. Share URLs and skill templates remain
  selected-loadout-only and warn when sibling entries, party metadata, notes, meaningful authored
  equipment, or authored title-rank overrides are omitted. Primary Any blocks canonical
  skill-template export; secondary Any uses the existing secondary-none template semantics when
  validation and codec proof pass.

Deferred to later epics:

- Full Guild Wars Wiki or PvX content catalog ingestion
- Acquisition metadata, guide prose, vendor/drop/quest instructions, and copied source-authored
  skill descriptions in schema v1
- paw-ned2/team template codec support; SPRINT-006 records a Node-floor dependency failure and
  defers ownership to EPIC-17
- Compact runtime catalog derivation, dynamic catalog loading, search workers, virtualization, and
  remote icon fetching
- Hero catalogs, henchmen, portraits, AI behavior, paw-ned2/team templates, whole-party URL
  fragments, hosted sharing, title ownership, account-wide title profiles, allegiance selection,
  equipment/title share payloads, raw equipment-template replay into the app editor, full stat
  aggregation, guide authoring, backend sync, collaboration, remote media, PWA behavior, auth,
  analytics, and deployment

## Project Layout

- `src/app` contains browser UI code and may import public domain contracts.
  Runtime generated catalog imports are isolated to `src/app/catalogs.ts`.
- `src/domain` contains framework-neutral contracts and must not import React, DOM/browser APIs,
  browser storage, network clients, app modules, or data scripts.
- `src/template-compatibility` contains the framework-neutral template codec adapter and must keep
  all `@buildwars/gw-templates` calls isolated behind `gw-templates-adapter.ts`.
- `scripts/data` contains offline/live ingestion and QA tooling. Runtime app code must not import it.
- `data/source-snapshots`, `data/generated`, and `data/qa` separate raw, normalized, and QA artifacts.
- `test/fixtures` contains synthetic non-authoritative fixtures for foundation and ingestion tests.
- `work/tickets` and `work/sprints` track ticket-burn planning and execution records.
- `compendium` stores project decisions and long-lived implementation notes.

## Source Policy Gate

Before future work imports, normalizes, commits, or publishes Guild Wars Wiki, PvX/Fandom,
community, icon, screenshot, or generated catalog data, it must satisfy the
[source policy](compendium/source-policy.md). Copied or source-derived runtime data needs
provenance for source identity, canonical URL, page or file identity where available, revision and
retrieval facts, material class, rights basis, use decision, and review notes. Ambiguous cases remain
review-required.

Live Guild Wars Wiki refreshes are manual-only through
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --allow-live-network --title "Guild Wars Wiki:Game integration/Skills/0"`
or a similarly bounded command. Live outputs stay ignored by default and must be reviewed before any
exact-path promotion ticket can allow them.
For EPIC-03, the locked profile command is
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-03-professions-attributes --root . --allow-live-network`;
only the catalog JSON, manifest JSON, and machine-readable QA JSON are exact-path allowlisted.
For EPIC-04, live refresh is two-step: first run
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-04-skills --root . --allow-live-network --stage discover`,
review the source-plan digest, then run `--stage fetch --source-plan <path>
--confirm-source-set-digest <digest>`. Offline replay requires the selected `--snapshot-set`
manifest and remains network-free. EPIC-04 schema v1 preserves unknown authored skill IDs and
structured costs/progressions, but excludes acquisition and copied description prose.
For EPIC-10, live refresh follows the same two-step pattern with `--profile epic-10-runes`. The
finite source authority is `Equipment template format`, `Rune`, `Attribute bonus`, verified rune
detail pages, metadata-only icon `imageinfo`, and the promoted EPIC-03 catalog. Accepted rune IDs
are anchored to verified `TemplateEquipmentModifierId` values. Offline replay requires one complete
selected EPIC-10 snapshot-set manifest; source plans, snapshot sets, raw snapshots, QA summaries, and
icon bytes remain ignored.
For EPIC-11, live refresh follows the same two-step pattern with `--profile epic-11-insignias`. The
finite source authority is `Equipment template format`, `Insignia`, `Effect stacking`, verified
insignia detail pages, metadata-only icon `imageinfo`, and the promoted EPIC-03 catalog. Public
`InsigniaId` values are schema-owned registry allocations, while each accepted production record has
one active verified armor-prefix `TemplateEquipmentModifierId` crosswalk. Offline replay requires one
complete selected EPIC-11 snapshot-set manifest; source plans, snapshot sets, raw snapshots, QA
summaries, review evidence, and icon bytes remain ignored.
For EPIC-12, live refresh follows the same two-step pattern with
`--profile epic-12-weapons-and-mods`. The finite source authority is `Equipment template format`,
`Weapon`, `Weapon upgrade`, `Inscription`, verified weapon/modifier detail pages, metadata-only icon
`imageinfo`, and the promoted EPIC-03 catalog. Public `WeaponId` and `WeaponModifierId` values are
schema-owned registry allocations, while raw template item/modifier IDs are crosswalk facts and
lookup inputs. Offline replay requires one complete selected EPIC-12 snapshot-set manifest; source
plans, snapshot sets, raw snapshots, QA summaries, review evidence, and icon bytes remain ignored.

## Template Compatibility

Template compatibility is available through `src/template-compatibility`.

- Skill templates decode to raw template profession IDs, ordered attribute/rank pairs, exactly eight
  template skill slots, source metadata, and typed diagnostics.
- Raw equipment templates decode to deterministic slot, item, color, and modifier facts without
  semantic equipment catalog joins.
- Bare codes and `[name;code]` chat wrappers parse and format with bounded, typed failures.
- Unchanged imports export through exact-source replay; edited/canonical exports only return a code
  after dependency encode and decode-back field equality prove no modeled data was lost.
- Skill resolution accepts caller-supplied EPIC-03 and EPIC-04 catalogs and returns a non-mutating
  view over known, none, reserved, unsupported, dispositioned, empty, and unknown outcomes.
- Weapon and modifier lookup helpers accept caller-supplied EPIC-12 catalogs and return known,
  dispositioned, ambiguous, or unknown outcomes without mutating decoded raw equipment documents.

See [Template compatibility](compendium/template-compatibility.md) for dependency qualification,
limits, fidelity guarantees, and the paw-ned2 deferral record.

## Game Rule Engine

Build validation is available through `src/domain`.

- `validateBuild` returns deterministic structured issues and separates `valid`, `complete`,
  `resolved`, and `exhaustive` from export/publish policy. It accepts optional equipment catalog
  views and skips `equipment: null`.
- `calculateEffectiveAttributeRank` resolves authored base ranks, optional overrides, and
  caller-supplied additive adjustments without deriving title, temporary-effect, or full equipment
  semantics.
- `createTitleRankCatalog` and `resolveTitleRanksForSkill` derive title-rank defaults and authored
  overrides from EPIC-04 skill progression metadata. Empty title state uses implicit per-series max
  ranks; authored overrides are sparse per-build state.
- `collectEquipmentAttributeRankAdjustments` derives target-scoped headgear and attribute-rune rank
  adjustments from semantic equipment.
- `analyzeWeaponSet` projects authored weapon-set occupancy, modifier compatibility, duplicate
  occupied slots, and advisory requirements from caller-supplied EPIC-12 facts.
- `summarizeAttributeRuneEffects` derives caller-supplied rune rank adjustments and independent
  attribute-rune health penalties from a runtime rune catalog without owning armor slots, legality,
  headgear bonuses, or full stat totals.
- `resolveInsigniaEffectsForArmorSlot` projects one insignia record onto one armor slot without
  owning armor legality, condition evaluation, rune composition, hit-location behavior, or full stat
  totals.
- `explainWeaponModCompatibility` checks one weapon base and one modifier against static EPIC-12
  family, mode, slot, and applicability facts. Set-level equipment legality and effect aggregation
  remain deferred.

See [Game rule engine](compendium/game-rule-engine.md) for rule defaults, unresolved-ID handling,
split/mode behavior, duplicate policies, and deferred scope.

## Core Build Editor

The core editor is available in `src/app`. It composes promoted catalog facts through one app-owned
boundary, shows attribution before source-derived facts, preserves unresolved imported template IDs
in an app raw overlay, and gates canonical skill-template export on representation, validation, and
codec fidelity proof. The main column has `Skills` and `Equipment` workspace tabs; the Skills
workspace includes compact title-rank controls derived from selected skills, and the equipment
workspace edits semantic equipment without importing raw generated data into leaf components. See
[Core build editor](compendium/core-build-editor.md), [Title ranks](compendium/title-ranks.md), and
[Equipment editor](compendium/equipment-editor.md) for the interaction model, export policy, current
performance observation, and deferred scope.

## Local Library And Sharing

The local workspace persists to browser `localStorage` under exactly one app-owned key:
`build-wars:v1`. The payload is schema version 2. It stores a discriminated working document and
mixed saved documents separately from UI-only state, preserving single builds and build sets with
`Build`, PvE budget controls, raw template overlay/source facts, unresolved import IDs, semantic
equipment, title-rank overrides, entry metadata, optional party annotations, template source/name
facts, and saved-with catalog/rule-engine versions. Valid schema-1 libraries and legacy neutral
build-set snapshots migrate in memory without dirtying or rewriting the stored value.

Saved records use opaque local IDs, so duplicate names and duplicate document contents are allowed.
The library panel supports save new, update, save as new, duplicate, delete confirmation, favorite,
rename, tags, notes, load, Copy Into Set, search, filters, sorting, selected-loadout share, backup,
and restore without accounts, backend sync, IndexedDB, service workers, analytics, or remote media
fetches.

Single-build sharing uses the existing skill-template codec through hash fragments:
`#bw=1&code=<bare-skill-template-code>&mode=<optional-mode>`. The full URL is capped at 1,800
characters and excludes library metadata, catalog snapshots, equipment, party, and guide data.
Build-set and party sharing use the selected loadout only for `#bw=1` URLs; sibling entries, party
metadata, equipment, title overrides, and notes require native JSON or backup flows. Title-rank
overrides are also excluded from share URLs and skill-template bytes; non-default local overrides
show omission warnings.
Whole-library backup/restore uses inert JSON with previewed merge/replace behavior and skipped
record reports. Build-set transfer uses a separate versioned Build Wars JSON envelope for one set,
and party transfer uses `build-wars-party-transfer` for lossless enabled-party exchange. Multi-code
copy is a deterministic bounded text projection, not an import format.
See [Local library and sharing](compendium/local-library-and-sharing.md) and
[Multi-build workspace](compendium/multi-build-workspace.md).
