# Generated Data

Normalized data produced from verified source snapshots belongs here. Generated contents are ignored
by Git until a later ticket approves exact paths.

## Allowed Locally

- Deterministic canonical JSON generated from approved source snapshots.
- `GeneratedArtifactManifest` records that list generator, inputs, source IDs, record count, digest,
  QA report path, commit decision, and notes.
- Metadata-only icon/file records when the source policy permits them.

## Commit Gate

Generated JSON remains ignored unless a future explicit ticket proves all of the following:

- exact generated file paths and parent-directory unignore rules are named
- deterministic regeneration is documented
- the app or tests need the committed artifact
- record or artifact provenance is complete
- generated diffs are reviewed
- QA findings are resolved, excluded, or dispositioned within the release scope

Icon binaries, screenshots, copied PvX/Fandom/community prose, ratings text, usage notes, and page
bodies are prohibited in this sprint. Synthetic fixture data belongs in `test/fixtures`, not here.

## EPIC-03 Promoted Catalog

BW-0305 approves exactly these generated files:

- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-03/professions-attributes.catalog.manifest.json`

The catalog contains the profession/attribute runtime data, compact source/provenance references,
section digests, semantic `catalogVersion`, template crosswalks, allocation rules, manual reviews,
and metadata-only icon references. The manifest records canonical artifact bytes, source snapshot
manifest paths, source IDs, record count, digest, QA path, generator, and
`commitDecision: exact-path-allowlisted`.

The catalog is runtime-eligible but is not imported by `src/app` yet. Runtime code must not read the
manifest, QA report, source snapshots, Python tooling, or wiki APIs.

## Determinism

The writer emits UTF-8, LF-terminated, two-space indented JSON with sorted keys, finite numbers only,
stable record order, SHA-256 digests, generator metadata, source IDs, input snapshot manifests, QA
report paths, and `commitDecision: ignored`.

Fixture mode must produce byte-identical output under fixed inputs and a fixed clock. Live mode may
change retrieval timestamps and source revisions, but those differences must be explicit in manifests
and reviewed before promotion.
The EPIC-03 profile uses fixed-clock fixture and offline replay for deterministic catalog, manifest,
QA, source ordering, and finding ID generation.

## EPIC-04 Promoted Catalog

BW-0405 approves exactly these generated files:

- `data/generated/epic-04/skills.catalog.json`
- `data/generated/epic-04/skills.catalog.manifest.json`

The catalog contains runtime-eligible skill facts: source-set summary, reviewed dispositions,
EPIC-03 dependency digests, skill records, cost/timing states, structured-only description tokens,
progression series, PvE/PvP split groups, nullable icon IDs, metadata-only remote media references,
section digests, and semantic `catalogVersion`.

The adjacent manifest records source-plan path/digest, selected snapshot-set path/digest, child
snapshot manifests, dependency digests, artifact digest, QA path, review records, and
`commitDecision: exact-path-allowlisted`. Runtime code must not read the manifest, QA report, source
plans, snapshot-set manifests, raw snapshots, Python tooling, or wiki APIs.

EPIC-04 uses fixed-clock fixture generation and exact snapshot-set offline replay for deterministic
catalog, manifest, QA, section digest, finding ID, source ordering, and summary count checks.

## EPIC-10 Promoted Catalog

BW-1005 approves exactly these generated files:

- `data/generated/epic-10/runes.catalog.json`
- `data/generated/epic-10/runes.catalog.manifest.json`

The catalog contains runtime-eligible rune facts: source-set summary, compact dispositions, EPIC-03
dependency digests, rune records, template modifier ID crosswalks, family/rank/tier fields,
profession and affected-attribute joins, typed effects, effect-level stacking, headgear handoff
facts, nullable icon IDs, metadata-only remote media references, section digests, and semantic
`catalogVersion`.

The adjacent manifest records source-plan path/digest, source-set digest, selected snapshot-set
path/digest, child snapshot manifests, dependency digests, artifact digest, QA path, review records,
and `commitDecision: exact-path-allowlisted`. Runtime code must not read the manifest, QA report,
source plans, snapshot-set manifests, raw snapshots, Python tooling, wiki APIs, or icon bytes.

EPIC-10 uses fixed-clock fixture generation and exact selected snapshot-set offline replay for
deterministic catalog, manifest, QA, section digest, finding ID, source ordering, and summary count
checks.

## EPIC-11 Promoted Catalog

BW-1105 approves exactly these generated files:

- `data/generated/epic-11/insignias.catalog.json`
- `data/generated/epic-11/insignias.catalog.manifest.json`

The catalog contains runtime-eligible insignia facts: source-set authority facts, compact
dispositions, identity-registry facts, EPIC-03 dependency digests, insignia records, verified
template modifier ID crosswalks, profession restrictions, mode facts, applicable armor slots, typed
effects, exact tagged per-slot outcomes, inert conditions, effect-level locality and combination
metadata, nullable icon IDs, metadata-only remote media references, section digests, and semantic
`catalogVersion`.

The adjacent manifest records source-plan path/digest, source-set digest, selected snapshot-set
path/digest, child snapshot manifests, dependency digests, artifact digest, QA path, review records,
and `commitDecision: exact-path-allowlisted`. Runtime code must not read the manifest, QA report,
source plans, snapshot-set manifests, raw snapshots, Python tooling, wiki APIs, or icon bytes.

EPIC-11 uses fixed-clock fixture generation and exact selected snapshot-set offline replay for
deterministic catalog, manifest, QA, section digest, finding ID, source ordering, source-set
disposition, identity registry, and effect-order checks.

## EPIC-12 Promoted Catalogs

BW-1206 approves exactly these generated files:

- `data/generated/epic-12/weapons.catalog.json`
- `data/generated/epic-12/weapons.catalog.manifest.json`
- `data/generated/epic-12/weapon-mods.catalog.json`
- `data/generated/epic-12/weapon-mods.catalog.manifest.json`

The weapon catalog contains runtime-eligible weapon base facts: source-set summary, compact
dispositions, identity-registry facts, EPIC-03 dependency digests, family/equip/handedness facts,
tagged damage and requirement states, allowed modifier slots, active raw template item crosswalks,
nullable icon IDs, metadata-only remote media references, section digests, and semantic
`catalogVersion`.

The modifier catalog contains runtime-eligible weapon modifier facts: source-set summary, compact
dispositions, identity-registry facts, EPIC-03 dependency digests, modifier family and occupied slot
facts, applicability facts, active raw template modifier crosswalks, typed effects, effect
completeness, nullable icon IDs, metadata-only remote media references, section digests, and
semantic `catalogVersion`.

Both catalogs share one release set. The adjacent manifests record source-plan path/digest,
source-set digest, selected snapshot-set path/digest, child snapshot manifests, dependency digests,
artifact digest, counterpart artifact path, QA path, review records, and
`commitDecision: exact-path-allowlisted`. Runtime code must not read manifests, QA reports, source
plans, snapshot-set manifests, raw snapshots, Python tooling, wiki APIs, or icon bytes.

EPIC-12 uses fixed-clock fixture generation and exact selected snapshot-set offline replay for
deterministic catalog, manifest, QA, section digest, source ordering, source-set disposition,
identity registry, effect semantics, and counterpart release-set checks.

## Baselines

Baseline comparison is opt-in. No baseline produces an info finding; schema mismatch blocks public
release; same-schema differences are preserved as generated-data-diff warnings for review.
