# SPRINT-012 Combined Draft Critique

Reviewed drafts:

- `work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-012-GPT54-DRAFT.md`

Not reviewed:

- `work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md`

## Summary

`SPRINT-012-GPT56SOL-DRAFT.md` is the stronger base for the final sprint because it is more explicit
about source authority, identity blocking behavior, slot-local semantics, QA release gates, and
production promotion. Its main risk is scope: it tries to solve catalog modeling, source-set
protocol hardening, source discovery, effect semantics, QA, docs, and first production promotion in
one sprint.

`SPRINT-012-GPT54-DRAFT.md` is more concise and has useful sequencing language, especially the
principle that source shape and contract decisions should happen before fixture and catalog churn.
Its main weakness is that several critical policies remain optional or deferred, especially
`templateModifierId` semantics and source authority expansion.

The final sprint should merge GPT56SOL's stricter gates and semantics with GPT54's clearer execution
sequencing. The identity policy conflict must be resolved before implementation starts; carrying
both policies into the final sprint would create incompatible QA and downstream EPIC-17 behavior.

## Critique: GPT56SOL Draft

### Strengths

- Strongly separates catalog scope from armor UI, saved-build schema, equipment authoring,
  equipment-template resolution, search/tooltips, and full stat aggregation.
- Gives the source graph bounded authority: `Equipment template format`, `Insignia`,
  `Effect stacking`, verified detail pages, metadata-only icon facts, and the promoted EPIC-03
  catalog.
- Correctly treats `Stackable` as item/inventory evidence rather than effect-combination authority.
- Makes identity deterministic by rejecting array position, alphabetical order, dense synthetic ID
  assignment, and numeric coincidence.
- Distinguishes fixed values, explicit five-slot values, locality, condition, combination, and mode
  as separate dimensions instead of overloading a single `stackable` or multiplier field.
- Calls out concrete slot-scaled examples for Survivor, Radiant, and Tormentor's and forbids a
  generic chest/legs multiplier.
- Defines a narrow per-record/per-slot helper and clearly keeps legality, aggregation, condition
  evaluation, and full totals out of scope.
- Promotion gates are appropriately strict: reviewed source plan, digest-confirmed fetch, complete
  selected snapshot set, deterministic offline replay, first-baseline review, exact-path promotion,
  and app/public release gates.
- The DoD is unusually complete on runtime/audit separation, ignored artifacts, deterministic
  digests, copied-text risk, icon-byte exclusion, and no app integration.

### Weaknesses

- The draft assumes the v1 identity anchor should be a verified numeric modifier ID. That is a
  defensible policy only if Phase 1 proves complete coverage for all player-usable insignias. If
  coverage fails, the draft correctly blocks promotion, but it should state that the identity policy
  itself must be amended rather than patched with one-off exceptions.
- The profile-neutral `source_set_protocol.py` is a potential mini-platform refactor inside an
  already large content sprint. Even though the draft avoids migrating EPIC-04/10, adding a shared
  security-sensitive primitive has hidden review cost.
- The effect model includes duration, outgoing damage, tiered conditions, minion counts,
  nearby-spirit state, skill-type counts, recharging-skill counts, and attribute thresholds. That is
  close to a general rule taxonomy even though the draft rejects a condition evaluator.
- It may over-prescribe current live-source facts, especially the expected 45 records and modifier
  ranges. The text says this is an independent review assertion, but several later gates read like
  the count is a required baseline.
- The number of mandatory files, tests, docs, and process records is high. The sprint risks becoming
  blocked by documentation and platform-hardening breadth rather than by the core EPIC-11 catalog.
- The helper name appears as `resolveInsigniaEffectsForArmorSlot`, while the other draft uses
  `resolveInsigniaEffectsForSlot`. The final sprint should choose one name.

### Gaps In Risk Analysis

- It does not fully price the cost of manual source review. The plan requires source-plan review,
  first-baseline review, warning disposition review, copied-text review, and production replay
  review, but treats reviewer availability mainly as a promotion risk.
- It underplays schema churn risk from the Phase 1 source census. If the effect vocabulary changes
  materially after fixtures are created, many tests and generated baselines will churn.
- It does not clearly define a fallback if the source graph proves incomplete but still bounded.
  The likely outcome should be a recorded amendment, not opportunistic admission of new source
  families.
- It assumes existing ingestion and QA primitives can absorb EPIC-11 without new dependencies or
  broad package/script changes. That should be an explicit gate.
- It does not call out the risk that QA gate names such as `appConsumptionGate` and
  `publicReleaseGate` may not align exactly with existing QA report conventions.

### Missing Edge Cases

- Same canonical page representing multiple modifier IDs or same-family variants should be modeled
  explicitly before the one-record/one-ID rule is finalized.
- Mode-specific effects may differ by value, not just availability. The effect model supports mode,
  but the gates should require tests for different PvE/PvP values if source evidence exists.
- Records with applicable slots that are a strict subset of armor slots need clear resolver behavior
  for inapplicable slots.
- Conflicting detail-page icon candidates, missing `imageinfo`, renamed files, and reused icons
  should produce separate diagnostics.
- Attribute-threshold conditions need EPIC-03 attribute joins and failure behavior when the
  attribute name is ambiguous, retired, or profession-incompatible.
- Combination rules need edge cases for identical family keys, different family keys with same
  effect kind, multiple effects on one insignia, and local-only effects equipped on multiple pieces.
- The copied-text policy should include short reviewed notes generated by Build Wars and reject
  source-authored prose even when it appears in fixture or QA evidence.

### Definition Of Done Completeness

The DoD is strong and mostly complete. It covers identity, source accounting, deterministic output,
runtime isolation, slot semantics, QA gates, exact promoted paths, documentation, unchanged app
behavior, and no commits.

The main DoD issue is excess breadth. Several items are acceptance-critical, while others are
implementation hygiene or documentation detail. The final sprint should separate non-waivable
release blockers from ordinary closeout checks so an executor can tell whether BW-1105 must remain
blocked or whether BW-1106 documentation simply needs more evidence.

## Critique: GPT54 Draft

### Strengths

- Clear sequencing: prove source shape, freeze contracts, lock source set and fixtures, extract,
  normalize, promote, then close out. This is the right order for reducing generated-data churn.
- Good high-level scope boundary. It explicitly excludes UI, saved-build schema changes, runtime
  manifest imports, remote icon fetching, backend storage, and a full stat calculator.
- Correctly models slot-scaled values as explicit per-slot data rather than downstream prose.
- Treats conditional and combat-state behavior conservatively by using structured codes only for
  exact, testable phrases.
- Keeps fixture mode synthetic and offline, and requires reviewed source-plan digest plus selected
  offline replay for production promotion.
- Provides a useful categorized DoD: source/identity, contract/runtime, effect/scaling,
  determinism/QA/promotion, and closeout.
- Its risks table is concise and readable, with good coverage of over-inferred slot scaling,
  unsafe conditional arithmetic, source prose leakage, broad allowlists, and reviewer availability.

### Weaknesses

- The identity policy is too loose. It says `InsigniaId` stays schema-owned and
  `templateModifierId` may be optional when unavailable. That avoids premature assumptions, but it
  weakens EPIC-17's future equipment-template crosswalk and leaves QA without a firm production
  rule.
- Source authority is less precise than GPT56SOL. It allows profession pages or other bounded
  verification pages if the initial sources are insufficient, but does not require a sprint
  amendment before widening authority.
- It uses availability terms like `universal-armor`, `profession-armor`, and `unknown`, while
  GPT56SOL uses `common` and `profession-specific`. The final contract needs one vocabulary tied to
  source terminology and downstream legality.
- The effect model is narrower and less explicit about locality, combination group keys,
  per-effect mode applicability, and copied-text boundaries.
- Promotion gates are adequate but less enforceable. The draft says live discovery and fetch should
  run only if source/reviewer conditions are available, but it should more clearly say that
  production promotion and sprint completion are blocked without them.
- It lists many file changes but does not explicitly discuss the hidden cost of adding a new
  ingestion profile to shared pipeline/CLI behavior.

### Gaps In Risk Analysis

- It does not sufficiently analyze the downstream cost of accepting records with null or unresolved
  `templateModifierId`. That choice affects EPIC-17, QA, source accounting, lookup helpers, and
  future migration paths.
- It does not separate item-level stackability from effect-combination evidence as thoroughly as
  GPT56SOL, even though it mentions the policy.
- It does not call out source authority conflict between `Equipment template format`, inventory
  rows, detail pages, and EPIC-03 joins with enough failure behavior.
- It understates the risk of live-source drift changing the expected record count, modifier ranges,
  redirect targets, icon metadata, or condition phrasing after fixtures have already frozen.
- It does not include enough risk around semantic versioning and digest scope. Consumer-visible
  changes and audit-only changes need mutation tests.
- It does not address supply-chain or dependency risk if parser behavior or source handling requires
  a new package.

### Missing Edge Cases

- Duplicate modifier IDs, duplicate normalized names, and duplicate canonical pages are mentioned
  generally, but the final behavior for each is not specific enough.
- Missing `templateModifierId` is treated as a possible accepted state, but the draft does not define
  when that is a warning, unsupported disposition, blocking finding, or allowed record.
- It needs explicit tests for `arms` to `hands` normalization, strict five-slot key coverage,
  inapplicable slot projection, missing slot map entries, non-finite values, and zero as a literal
  value rather than an unknown placeholder.
- It does not require enough edge cases for local armor effects versus character-wide health/energy
  effects.
- It does not require source-clear tests for mode-specific effects, changed effect values by mode,
  or unknown mode availability.
- It needs stronger icon diagnostics: missing icon, ambiguous icon, icon metadata fetch failure,
  reused icon, and metadata-only policy.
- It should test ordering stability across seed order, request batch order, filesystem order, and
  concurrent completion.

### Definition Of Done Completeness

The DoD is well organized and easier to execute than GPT56SOL's single large list. It covers the
important categories, but it is weaker on exact identity policy, source authority enforcement,
locality/combination semantics, copied-text policy, and release-blocking promotion criteria.

The final sprint should reuse GPT54's DoD structure but fill it with GPT56SOL's stricter acceptance
requirements.

## Direct Comparison

### Architecture Assumptions

GPT56SOL assumes the existing EPIC-03/04/10 ingestion platform can be extended with a small shared
source-set protocol. GPT54 assumes reuse of the shared pipeline without a new shared protocol. The
shared-protocol approach is safer long term but is a scope-risk multiplier. The final sprint should
make it a narrowly bounded implementation detail: add it only if EPIC-11 would otherwise duplicate
security-sensitive replay validation, and do not migrate older profiles in this sprint.

Both drafts assume the current domain already has suitable branded IDs and `ArmorSlot` contracts.
That should remain a Phase 1 verification item, not an unchecked premise.

### Scope Creep Risk

GPT56SOL has the better boundary language but also the larger task surface. GPT54 is more
manageable, but its looser policies can push complexity later into QA, EPIC-17, or app consumers.

The final sprint should explicitly cap v1 semantics to source-clear effects encountered in the
Phase 1 census. New source families, new source pages, new condition classes, new dependencies, UI
imports, or full-stat behavior should require an amendment.

### Source Authority

GPT56SOL is stronger. It names primary and cross-check sources, excludes category crawl/site
search/community pages, and separates inventory, modifier identity, detail facts, mechanics, icons,
and EPIC-03 joins.

GPT54's allowance for additional profession pages is reasonable only as an amendment path. The
final sprint should not allow source-family expansion as an executor decision during extraction.

### Identity Policy

This is the largest conflict between the drafts.

GPT56SOL: accepted v1 records require one unique verified modifier ID, with `InsigniaId` and
`TemplateEquipmentModifierId` both stored explicitly.

GPT54: `InsigniaId` is schema-owned and records may exist without verified `templateModifierId`
crosswalks.

Recommended merge: keep `InsigniaId` as the public branded runtime identity, but require every
production v1 accepted player-usable insignia to have one unique verified
`TemplateEquipmentModifierId` unless Phase 1 produces a recorded sprint amendment. Do not allow a
quiet nullable crosswalk in the promoted v1 catalog. If a player-usable insignia lacks verified
modifier identity under the approved source graph, block promotion or disposition it explicitly
rather than assigning a guessed ID.

### Slot-Scaling Semantics

Both drafts correctly reject implicit prose scaling. GPT56SOL is stronger because it separates
value, locality, condition, combination, and mode. GPT54 is clearer about sequencing and
downstream helper boundaries.

Recommended merge: store fixed values and exact five-slot maps as separate value variants; require
all five keys for slot-valued effects; normalize `arms` to `hands` once; keep local armor and
event-local damage separate from character-wide totals; and choose one helper name,
preferably `resolveInsigniaEffectsForArmorSlot` for clarity.

### Promotion Gates

GPT56SOL has the stronger promotion model. GPT54's version is directionally correct but easier to
interpret as fixture-only completion if live conditions are unavailable.

Recommended merge: production completion requires reviewed live discovery, digest-confirmed fetch,
one complete selected snapshot-set manifest, two fixed-clock offline replays, byte-identical
catalog/manifest/QA artifacts, first-baseline review, exact `.gitignore` allowlisting, and passing
app/public release gates. If those cannot be completed, BW-1105 and SPRINT-012 remain blocked.

## Merge Recommendations

1. Use GPT56SOL as the structural base for source authority, identity blocking, effect dimensions,
   QA, security, and promotion.
2. Use GPT54's execution sequencing and categorized DoD format to make the final sprint easier to
   execute.
3. Resolve the identity contradiction explicitly: branded `InsigniaId` remains public, but v1
   production acceptance requires a unique verified template modifier crosswalk unless an amendment
   changes the policy.
4. Treat the 45-record and modifier-range baseline as a review expectation, not a substitute for
   discovery. Any drift stops at the source-plan gate.
5. Require a sprint amendment before adding source families, raising source caps, adding
   dependencies, widening effect semantics, or promoting without live/replay evidence.
6. Keep `source_set_protocol.py` narrowly scoped. Add it only to avoid duplicated replay-security
   code, test it against established rejection contracts, and do not migrate EPIC-04/10 in this
   sprint.
7. Standardize vocabulary before implementation: `common` versus `universal-armor`,
   `profession-specific` versus `profession-armor`, `templateModifierId` nullability, helper name,
   condition codes, locality values, and combination values.
8. Put non-waivable blockers in a separate DoD subsection: unaccounted player-usable candidates,
   missing/duplicate modifier identity, incomplete required restrictions, incomplete slot maps,
   unsafe paths, incomplete replay, copied-text uncertainty, and digest/integrity mismatch.
9. Preserve safe unknowns as visible runtime states with bounded warnings, but do not let unknowns
   mask failed source-clear arithmetic or false locality/combination claims.
10. Keep the final sprint domain-only. No `src/app/catalogs.ts` import, editor change, persistence
    change, remote icon fetch, equipment legality, condition evaluator, cross-piece aggregation, or
    full stat calculator belongs in SPRINT-012.
