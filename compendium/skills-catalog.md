# Skills Catalog

EPIC-04 promotes the first runtime-eligible Guild Wars skills catalog for Build Wars.

## Runtime Artifact

Runtime consumers may read:

- `data/generated/epic-04/skills.catalog.json`

Runtime consumers must not read:

- `data/generated/epic-04/skills.catalog.manifest.json`
- `data/qa/epic-04/skills.catalog.qa.json`
- source plans, snapshot-set manifests, raw snapshots, candidate outputs, QA summaries, Python
  ingestion modules, or wiki APIs

The catalog is framework-neutral JSON. `src/domain` owns the TypeScript contracts and pure lookup or
tooltip helpers; `src/app` must still implement attribution UI, remote-media privacy choices, and
runtime presentation before showing source-derived facts or icons.

## Source Authority

The approved source set is `Guild Wars Wiki:Game integration/Skills` plus linked ranged pages under
`Guild Wars Wiki:Game integration/Skills/*`, the ten `List of <profession> skills` pages, and
`List of PvE-only skills`. `Guild Wars Wiki:Game integration/Skills/0` was checked and is missing
from the live MediaWiki API, so it is retained only as blocker history.

Live refresh is two-step:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-04-skills --root . --allow-live-network --stage discover
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-04-skills --root . --allow-live-network --stage fetch --source-plan <path> --confirm-source-set-digest <digest>
```

Offline replay is network-free and requires the selected complete snapshot set:

```sh
PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py offline --profile epic-04-skills --root . --snapshot-set <path>
```

## Schema Boundaries

`SkillId` and `TemplateSkillId` are distinct. Known skills may use the same numeric value in v1, but
unknown authored numeric IDs remain representable and are never compacted or inferred from array
position.

Skill records include IDs, name, normalized key, wiki URL, page identity facts, campaign, profession
and attribute joins from EPIC-03, skill type, classification flags, independent cost/timing value
states, description state, progression references, split group ID, nullable icon ID, and compact
provenance references.

PvE-only title-track skills remain ordinary skill records. Browser sections are derived from
title-rank progression keys such as Kurzick, Luxon, Sunspear, Lightbringer, Asura, Deldrimor, Ebon
Vanguard, and Norn; profession-gated PvE title skills still keep their `professionId` requirement.

Schema v1 excludes acquisition metadata, guide prose, strategy or usage notes, vendor/drop/quest
instructions, community content, raw page bodies, MediaWiki HTML, icon bytes, thumbnails, and
screenshots.

## Description And Progression Policy

Runtime descriptions are explicit states: `reviewed-text`, `structured-only`, `excluded`, or
`unsupported`. The current EPIC-04 promotion uses reviewed concise infobox descriptions when
available, keeps structured-only fallback otherwise, and records source text digests for future
review invalidation. Full copied source-authored descriptions still require a separate digest-bound
review before runtime text can include them.

Progression series store dependency kind, rank domain, value slots, finite rows, source form, and
provenance. Title-rank dependencies use stable raw keys that `src/domain/title-rank.ts` normalizes
into runtime title controls. Account title ownership, acquisition, and broad allegiance exclusivity
modeling remain outside the skill catalog.

PvE/PvP split groups are explicit. Unknown mode returns an ambiguous outcome when variants differ;
EPIC-06 and UI work own runtime mode selection policy.

## Skill Identity And Icon Checks

Game-integration links enumerate IDs; the skill infobox determines which IDs can become playable
records. IDs absent from the infobox or annotated as NPC/monster-only become excluded dispositions.
Their numeric template IDs remain representable for import and export. They are not guessed aliases
of the player skill.

Kurzick and Luxon IDs retain separate title dependencies and have faction suffixes in their names.
Icon generation requests the matching `File:<skill> (Kurzick).jpg` or
`File:<skill> (Luxon).jpg`. Shared wiki pages can contain a stacked image of both icons; runtime skill
assets must be square. A missing faction icon cannot fall back to the shared page image or the other
faction, and stops manifest replacement.

An explicit `(PvP)` skill is paired with its unique unsuffixed or `(PvE)` counterpart. Each variant's
availability matches its mode. PvE members of these split groups do not count toward the three
PvE-only skill limit.

Catalog QA blocks duplicate selectable names, unexplained shared-page IDs, mismatched faction
dependencies, and incomplete or inconsistent mode pairs before replacing promoted artifacts.
Python regression fixtures exercise these gates; `src/app/skill-catalog-integrity.test.ts` also
checks the promoted catalog, actual faction icon bytes, mode filtering, and template dispositions.

## Downstream Boundaries

- EPIC-05 may preserve unknown authored skill IDs and map known template IDs to catalog records.
- EPIC-06 may consume profession, attribute, elite, common, no-attribute, title, PvE-only, PvP-only,
  split, special, and unsupported classifications.
- EPIC-08 may use the catalog for skill-picker data after attribution and privacy UI exist.
- EPIC-15 owns runtime title-rank defaults, sparse per-build overrides, title validation, and narrow
  allegiance uncertainty warnings.
- EPIC-19 owns acquisition, guide prose, and authoring workflows.
- EPIC-20 may index names, lookup keys, types, campaigns, costs, classifications, and structured
  search text from the runtime catalog only.
