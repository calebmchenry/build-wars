# Data QA Reports

Ingestion validation reports belong here. Report contents are ignored by Git; this README stays
tracked so the directory contract is visible.

The operational requirements for QA findings, manual review, and release gates live in
[`compendium/data-qa-and-release.md`](../../compendium/data-qa-and-release.md).

QA reports may contain generated evidence, bounded source snippets, reviewer notes, local paths, and
untrusted source values. They are internal artifacts by default and are not runtime app data.

## Report Contents

Future `QaReport` files should record missing provenance, stale or unverified revision metadata,
ambiguous source or rights status, copied text without attribution, invalid source references, manual
overrides, missing icon metadata, generated-data diffs, artifact integrity mismatches,
schema/shape errors, unexpected source families, and other findings.

Each finding needs a stable code, severity, scope, evidence, disposition, reviewer metadata when
reviewed, rationale, expiration or re-review trigger when appropriate, and follow-up ticket IDs.

## Retention

Generated QA reports remain ignored by default. A future ticket may promote a stable summary document
only when it contains no prohibited source payload, secret, cached media, or unreviewed copied text.

BW-0305 promotes one machine-readable EPIC-03 QA report:

- `data/qa/epic-03/professions-attributes.catalog.qa.json`

The adjacent `.summary.txt` remains ignored. The QA JSON is release evidence, not runtime app data.
It records the same source IDs, artifact path, manifest path, generator, fixed timestamp, findings,
summary counts, and app/public release gates used for promotion.

Unknown copied material, digest mismatch, and unreadable artifacts are non-waivable for public
release and must be resolved or excluded.

## Gate Behavior

The EPIC-02 tooling maps diagnostics to the existing `QaFinding` and `QaReport` contracts. Critical
open findings block app consumption and public release. Error findings block public release. Warning
findings require review. Info findings do not block alone.

Blocking regenerate commands write both machine-readable JSON and a bounded `.summary.txt` before
returning exit code `2`.
EPIC-03 promotion requires `appConsumptionGate: pass` and `publicReleaseGate: pass`; critical/error
findings must be absent or closed, and warnings must be resolved, excluded, or accepted with named
bounded review evidence.

BW-0405 promotes one machine-readable EPIC-04 QA report:

- `data/qa/epic-04/skills.catalog.qa.json`

The adjacent `.summary.txt` remains ignored. The QA JSON records source-set accounting, page
resolution, EPIC-03 joins, infobox fields, cost/timing states, description policy, progression
coverage, split groups, icon metadata, provenance, output caps, artifact integrity, summary counts,
and app/public release gates. Missing detail pages, missing icon metadata, unsupported progression
forms, and non-catalog skill-source shapes must be dispositioned by bounded review evidence before
promotion can pass.

BW-1005 promotes one machine-readable EPIC-10 QA report:

- `data/qa/epic-10/runes.catalog.qa.json`

The adjacent `.summary.txt` remains ignored. The QA JSON records source authority review,
source-set accounting, page resolution, EPIC-03 joins, rune family/rank coverage, verified template
modifier IDs, effects, effect-level stacking, headgear handoff facts, icon metadata, copied-text
policy, output caps, artifact integrity, summary counts, and app/public release gates. Live
promotion accepted the bounded `ICON_NON_64_DIMENSIONS` warning class for remote icon metadata while
keeping `cachedBytes: false` and storing no icon binaries.

BW-1105 promotes one machine-readable EPIC-11 QA report:

- `data/qa/epic-11/insignias.catalog.qa.json`

The adjacent `.summary.txt` remains ignored. The QA JSON records source authority review,
source-set accounting, page resolution, EPIC-03 joins, identity-registry coverage, verified template
modifier crosswalks, availability and profession restrictions, mode facts, slot applicability,
effect completeness, exact per-slot outcomes, inert conditions, locality, combination rules, icon
metadata, copied-text policy, output caps, artifact integrity, summary counts, and app/public
release gates. Live promotion accepted bounded metadata-only icon warnings while keeping
`cachedBytes: false` and storing no icon binaries.
