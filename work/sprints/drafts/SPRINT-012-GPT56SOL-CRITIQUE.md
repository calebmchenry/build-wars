# Sprint 012 Draft Critique

## Executive Assessment

Both drafts converge on the right high-level shape: a framework-neutral insignia catalog, bounded and replayable ingestion, schema-owned public identity, explicit per-slot values, conservative handling of conditional effects, and production promotion behind deterministic QA. Neither draft is ready to approve unchanged, however. They share four architectural gaps:

1. Source pages are named, but field-level authority and conflict precedence are not defined.
2. Stable identity is described as a goal without fully specifying rename, split, merge, removal, and crosswalk-cardinality behavior.
3. Slot values are explicit, but the meaning of `null`, fixed versus scaled values, conditions, modes, units, and derivation provenance remains ambiguous.
4. Promotion is rigorous only while local source snapshots and human review context remain available; the long-term retention and approval contract is not closed.

The GPT-5.5 draft is the stronger backbone because its QA, source accounting, identity, and promotion sections are more complete. The GPT-5.4 draft contributes the cleaner slot-local helper boundary and more concise execution sequencing. A merged sprint should take those strengths while resolving the contradictions below before implementation begins.

## Review of `SPRINT-012-GPT55-DRAFT.md`

### Strengths

- The scope boundary is unusually clear. It separates domain contracts, ingestion, runtime data, audit data, future UI, equipment legality, and full-stat analysis.
- Source discovery is treated as a bounded, reviewable operation rather than a scraper. Candidate accounting, digest-confirmed fetch, complete snapshot-set replay, drift detection, and explicit dispositions form a coherent chain of custody.
- The identity direction is sound: `InsigniaId` remains the public identity, `sourceKey` is explicit, template modifier IDs are crosswalk evidence, and public IDs do not depend on source ordering.
- It handles same-page multi-record extraction, duplicate names, redirects, profession joins, unsupported effects, and metadata-only icons more deliberately than the GPT-5.4 draft.
- The effect model correctly separates arithmetic facts from conditions, stacking facts, notes, and unknown states. Effect-level stacking is a better long-range model than a record-level boolean.
- Promotion gates are strong. Fixed-clock duplicate generation, mutation tests for semantic digests, two offline production replays, exact-path allowlisting, warning dispositions, first-baseline review, and separate app/public gates materially reduce release risk.
- The Definition of Done is detailed, checkable in many areas, and correctly requires production promotion rather than treating fixture success as sprint completion.

### Weaknesses and Coherence Problems

- Phase 1 may strengthen the modifier crosswalk only if every accepted insignia has one unique modifier ID, but the complete accepted population is not locked until Phase 2. The identity cardinality decision is therefore scheduled before the evidence needed to make it.
- `sourceKey` is said to derive from canonical page identity plus variant identity. Canonical titles and redirects can change, so this is not stable enough by itself. A reviewed registry is mentioned as one option, but the draft never chooses between registry allocation and deterministic allocation.
- The crosswalk oscillates between `templateModifierIds: TemplateEquipmentModifierId[]`, an “equivalent crosswalk,” and a potentially required singular modifier. Plain IDs also cannot preserve mode, source evidence, active/historical status, or ambiguity.
- The runtime catalog keeps page identity, source-set summaries, dispositions, media metadata, and compact provenance while claiming a strict runtime/audit split. Without a precise projection rule, audit churn can inflate the runtime payload and change `catalogVersion` even when chooser or stat behavior is unchanged.
- `catalogVersion` is called semantic versioning but is described as a semantic digest. A content hash and a SemVer value have different compatibility meanings; the draft should use one term consistently.
- `condition-state` is modeled as an effect variant while numeric effects also carry a condition. That permits duplicate or unlinked condition representations.
- The proposed `summarizeInsigniaSlotEffects(catalog, equippedEntries)` helper accepts multiple equipped occurrences and diagnoses duplicates. That crosses from slot projection toward equipment aggregation and legality, conflicting with the sprint's own promise to avoid a stat/equipment engine.
- The plan is very broad for one sprint: new public contracts, source research, ingestion, semantic normalization, helper APIs, production acquisition, promotion, extensive documentation, and six-ticket closeout. The percentages sum cleanly but do not reserve effort for source-shape amendments or schema migration discovered during live review.

### Gaps in Risk Analysis

- Page rename, page merge/split, variant reclassification, record removal, and public-ID tombstoning are not treated as first-class identity risks.
- Selected production snapshots remain ignored and may not be retained. The risk table notices this, but “run a fresh acquisition later” is not equivalent to reproducible promotion from the original evidence.
- Runtime semantic digests include compact dispositions and dependency facts without defining whether audit-only changes should invalidate downstream caches.
- PvE/PvP is modeled mainly as availability. The risk that the same insignia has mode-specific effect values or text is not addressed.
- The source plan and the extracted catalog may share the same omission. Candidate accounting is not an independent completeness oracle.
- There is no explicit risk for first-baseline bootstrapping, schema-version migration, or generator changes that preserve semantics but alter bytes.
- Human review is required, but reviewer identity, authority, approval record, waiver policy, and review expiry are unspecified.
- Metadata-only icon records are admitted to runtime data without a complete licensing, attribution, MIME, host, or future-rendering policy.

### Missing Edge Cases

- Canonical page rename, redirect chain or loop, deletion, restoration, merge, split, and one page changing from one record to multiple variants.
- One modifier ID mapping to multiple records, one record mapping to multiple active or historical IDs, mode-specific IDs, reserved/invalid ID values, and a crosswalk changing after promotion.
- Unicode normalization, punctuation-only name differences, aliases, localized names, and a normalized-name collision introduced by a later refresh.
- An insignia whose PvE and PvP availability is the same but whose effect value or condition differs by mode.
- Multiple conditions, AND/OR relationships, threshold inclusivity, negation, condition scope, and two effects on one record with different conditions.
- Difference between an inapplicable slot, an applicable slot with unknown value, a value that is intentionally zero, and a malformed missing value.
- Fixed-value effects versus piece-scaled effects, percentage versus flat reduction, rounding, signed zero, decimal canonicalization, and Python-to-TypeScript numeric agreement.
- Profession semantics such as armor profession versus primary profession, multiple allowed professions, unknown restriction, and attribute-linked conditions. The draft depends on EPIC-03 attributes but does not require an attribute field in its minimum record.
- Removal and deprecation behavior for an insignia already referenced by saved or shared data in future epics.
- Source transclusions or shared templates changing without the chosen page evidence capturing the actual dependency revision.

### Definition of Done Completeness

The Definition of Done is strong but incomplete. It should additionally require:

- an approved field-authority and conflict-precedence matrix;
- one selected, documented ID registry/allocation policy with rename, removal, tombstone, split, merge, and non-reuse rules;
- a structured crosswalk record with explicit cardinality and evidence, not a bare optional array;
- tagged slot outcomes that distinguish value, inapplicable, and unresolved states;
- mode-specific effect handling, not only mode availability;
- a retained or durably addressable production evidence set sufficient to reproduce the promoted artifacts;
- named gate criteria, reviewer authority, approval evidence, and waiver behavior;
- schema compatibility and migration checks for subsequent catalog versions; and
- an independent completeness reconciliation so a source-discovery omission cannot validate itself.

## Review of `SPRINT-012-GPT54-DRAFT.md`

### Strengths

- The draft is more concise and easier to execute phase by phase. Its explicit bookkeeping section makes sequencing and status synchronization visible.
- It correctly makes the source-shape checkpoint precede large fixture and schema churn.
- Source authority, digest-confirmed discovery/fetch, complete offline replay, and exact-path promotion are directionally coherent.
- The single-record `resolveInsigniaEffectsForSlot(record, slot)` helper has a clean boundary. It projects catalog facts without accepting an equipment collection or implying aggregation.
- The runtime contract explicitly surfaces `affectedAttributeId`, which anticipates an important class of profession-specific semantics missing from the GPT-5.5 minimum record.
- The draft correctly preserves absent or ambiguous modifier IDs instead of manufacturing numeric matches.
- Its Definition of Done covers the main runtime boundary, deterministic generation, QA overflow, exact promoted paths, offline verification, and unchanged application behavior.

### Weaknesses and Coherence Problems

- The frontmatter says `status: planned` even though this is a draft and major decisions remain open. That overstates readiness.
- Stable identity is under-specified. The runtime record has no required `sourceKey`, and the plan says only that ID assignment must be source-order-independent and collision-checked.
- `templateModifierId` is singular and nullable in the proposed runtime shape, while Phase 1 allows required, optional, or forbidden states by record class. This does not represent aliases, historical IDs, mode-specific IDs, or one-to-many evidence.
- The draft freezes identity policy and the wire contract in Phase 1 before Phase 2 establishes the full source set. As in the GPT-5.5 draft, the sequence can force a decision without population-wide evidence.
- Numeric effects permit either an amount or explicit per-slot values. The precedence and validity rules when both or neither appear are not defined.
- Non-stacking behavior is discussed in prose and risk analysis but is absent from the minimum v1 effect kinds and the effect-related Definition of Done.
- The source authority section permits additional profession pages if needed but does not define the amendment artifact, approval threshold, or how the source-set digest changes.
- Phase 5 emits “commit decision metadata,” while the sprint expressly creates no commit. The field may be inherited platform vocabulary, but its meaning should be stated or removed.
- The file and closeout lists include the planning result manifest but omit the execution result manifest later expected by the broader status language.

### Gaps in Risk Analysis

- The risk table is much thinner than the implementation contract. It omits same-page variants, public-ID migration, source-key instability, QA truncation/cap errors, retained-input loss, mode-specific effect divergence, runtime/audit coupling, baseline bootstrapping, and crosswalk cardinality.
- It does not analyze the cost of committing a public helper before an actual app consumer exists.
- It does not address source precedence conflicts between overview, detail, and equipment-template pages.
- It does not address catalog-version churn caused by provenance, source revision, or disposition-only changes.
- It does not address what happens when the EPIC-03 dependency changes globally but the insignia-relevant subset does not.
- Reviewer availability is noted, but approval ownership and exception policy are not.

### Missing Edge Cases

- Page rename/merge/split/deletion and ID tombstones.
- Same-page multiple records with independently stable variant keys and provenance.
- Multiple modifier IDs, modifier aliases, modifier conflicts by mode, and historical mappings.
- Duplicate page identity with different normalized names, alias collisions, and Unicode normalization.
- PvE/PvP effect differences rather than availability differences.
- Slot-state distinctions among inapplicable, unknown, missing, and numeric zero.
- Conditions with multiple clauses or effect-specific scope; stacking groups and non-stacking scope.
- Percentage units, rounding, overflow boundaries, signed values, and canonical decimal serialization.
- Multiple professions or ambiguity between armor profession and character profession.
- Independent expected-coverage checks and source transclusion dependencies.
- Consumer behavior after an accepted insignia is removed or superseded.

### Definition of Done Completeness

The Definition of Done is useful but weaker than the GPT-5.5 version in several consequential ways:

- It does not require `sourceKey` on runtime records or define a stable allocation/migration policy.
- It does not require effect-level stacking or stable stacking-group keys.
- Its replay rejection list omits plan mismatch and dependency mismatch.
- It lacks explicit zero-output rejection, normalized-name collision coverage, warning-disposition requirements, mutation testing of every semantic field, and first-baseline approval criteria.
- It omits a required execution result manifest.
- The statement that release gates pass “or the sprint remains blocked” is not a Definition of Done condition. A blocked sprint is explicitly not done; pass criteria and blocked-state reporting must be separate.
- It lacks an explicit requirement to preserve selected production evidence for future replay.
- Like the GPT-5.5 draft, it lacks field-level source precedence, complete identity lifecycle rules, tagged slot states, and mode-specific effect semantics.

## Cross-Draft Contradictions and Required Resolutions

| Topic | GPT-5.5 draft | GPT-5.4 draft | Merge resolution |
| --- | --- | --- | --- |
| Draft status | `draft` | `planned` | Keep `draft` until source, identity, scaling, and gate decisions are approved. |
| Stable source identity | Requires `sourceKey`; registry or deterministic allocation remains undecided | Does not require `sourceKey` | Require an immutable registry key distinct from mutable canonical title, plus stable variant key and migration history. |
| Modifier crosswalk | Array/equivalent crosswalk, possibly strengthened to singular required ID | Singular nullable ID with class-dependent required/optional/forbidden policy | Use a list of structured crosswalk entries containing ID, status, mode/scope, evidence, and ambiguity state. Never use it as public identity. |
| Identity decision timing | May strengthen identity in Phase 1 before Phase 2 source-set lock | Freezes policy in Phase 1 before Phase 2 source-set lock | Make Phase 1 provisional; freeze cardinality only after a complete candidate inventory and cross-source reconciliation gate. |
| Attribute semantics | EPIC-03 attributes are a dependency, but no minimum record field is required | Includes `affectedAttributeId` | Define attribute involvement inside the relevant effect/condition, allowing multiple or absent attributes; avoid one record-level nullable shortcut unless source proof shows it is sufficient. |
| Conditions | Separate `condition-state` effect plus conditions on numeric effects | Optional condition on numeric effects | Use a controlled condition object or referenced condition ID attached to each affected effect. Do not duplicate conditions as independent arithmetic effects. |
| Stacking | Explicit effect-level rules and group keys | Mostly prose; absent from minimum effect union and DoD | Adopt effect-level rule and group-key modeling, while deferring aggregation execution. |
| Slot representation | Explicit map; `null` means either inapplicable or unavailable | Amount or explicit map | Normalize every numeric effect to per-slot tagged outcomes. Keep raw formula/evidence outside the consumer value and prohibit ambiguous dual representations. |
| Helper API | Optional multi-entry summary helper | Required single-record, single-slot resolver | Prefer the GPT-5.4 slot-local projection. Make it optional until a consumer test demonstrates value; do not accept equipment collections in this sprint. |
| Runtime/audit boundary | Includes compact source dispositions as semantic inputs | Includes runtime-relevant dispositions without precise criteria | Define a minimal runtime projection and a separate audit digest. Excluded-candidate/review churn should not change runtime semantic version unless it changes consumer-visible facts. |
| Promotion evidence | Two fixed-clock offline replays, detailed baseline and gate evidence | Offline reproduction is required but phase language is less exact | Adopt the GPT-5.5 checks and add durable source-evidence retention plus named approval records. |
| Release gate semantics | Both app and public gates must pass | Gates pass or sprint remains blocked | Completion requires both gates to pass. A blocked outcome is status reporting, never an alternate DoD path. |
| Result manifests | Planning and execution manifests are explicit | Planning manifest is explicit; execution manifest is omitted | Require both, but resolve their paths from the active ticket-burn run rather than relying blindly on a hard-coded timestamp. |

## Merge Recommendations

### 1. Establish a Field-Level Source Authority Contract

Before freezing the schema, record an approved matrix identifying the preferred authority, fallback, and conflict outcome for each field:

| Field | Preferred evidence | Conflict rule |
| --- | --- | --- |
| Candidate membership | Bounded overview/index reconciled against equipment-template rows | Unaccounted differences block source-set approval. |
| Public identity | Schema-owned immutable registry | Source titles and modifier IDs never directly determine public IDs after promotion. |
| Canonical page identity | MediaWiki page ID, canonical title, redirect chain, and revision facts | Rename updates aliases/provenance, not public identity. Merge/split requires migration review. |
| Template modifier mapping | Equipment-template authority plus corroborating record evidence | Ambiguous or conflicting mappings remain typed and block only the consumer capabilities they affect. |
| Profession, mode, slots, and effects | Verified detail page or specifically approved mechanics page | Disagreement with overview/index is a blocking conflict, not last-writer-wins. |
| Slot derivation rule | Explicit approved mechanics evidence | Store derivation provenance and generated values; do not infer from name or fixture precedent. |
| Icon metadata | Verified page image field plus MediaWiki metadata | Missing media may be non-blocking; unsafe host, type, or attribution state blocks media publication. |

The source-plan digest should bind exact page IDs, revisions, content digests, dependency digests, caps, and the authority-policy version. Candidate completeness should be reconciled across at least two independent enumerations where available.

### 2. Freeze a Durable Identity Policy

Use schema-owned `InsigniaId` backed by an immutable registry entry. The registry key should survive title changes and should include a stable variant discriminator when one page produces multiple records. Define these rules before first promotion:

- IDs are never derived from array order and are never reused.
- Rename or redirect changes update aliases and provenance without changing ID.
- Removal creates a tombstone or explicit supersession record suitable for future saved-data resolution.
- Page merge, split, or variant reclassification requires an reviewed migration map.
- Template modifiers are structured crosswalk facts, not identity.
- Crosswalk entries carry modifier ID, scope/mode, status, source evidence, and ambiguity; lookup returns found, unknown, or ambiguous rather than silently selecting one.

### 3. Make Slot-Scaling Semantics Unambiguous

For every numeric effect, store one canonical per-slot projection. Each slot outcome should distinguish:

- `value` with amount, unit, condition reference, and derivation provenance;
- `not-applicable`; and
- `unresolved` with a stable reason.

Do not overload `null`, and do not allow a fixed amount and a slot map to compete. A fixed effect can be normalized into equal values for every applicable slot. Specify whether the value is per equipped piece, the exact unit, sign convention, rounding/precision, and whether it is mode-specific. Conditions belong to affected effects through controlled references; stacking rules and group keys remain effect-level facts but are not executed in this sprint.

### 4. Model Mode Variants Explicitly

Separate “usable in this mode” from “has these semantics in this mode.” If PvE and PvP values, conditions, or modifier mappings differ, represent mode-scoped effect/crosswalk variants or distinct schema-owned variants with a documented identity relationship. An availability enum alone is insufficient.

### 5. Tighten the Runtime/Audit Boundary

The runtime artifact should contain only facts needed for lookup, legal-choice filtering, display, future template resolution, and attribution. Full page-resolution history, excluded candidates, approval records, finding evidence, and source-plan detail belong in the manifest or QA report. Use separate digests for runtime semantics and audit evidence so a source review change does not trigger downstream semantic invalidation unless consumer-visible facts change.

### 6. Preserve Reproducibility Beyond the Current Worktree

Promotion should bind to a durably retained immutable source-evidence set, not merely an ignored local snapshot path. If repository policy forbids promoting raw snapshots, require a content-addressed artifact store or an explicit retention location and verify its digest during release. If durable retention is impossible, document that the artifact is auditable but not indefinitely reproducible and do not claim stronger guarantees.

### 7. Adopt a Single Promotion Contract

Use the GPT-5.5 promotion sequence with these clarifications:

1. Source authority policy and candidate inventory are approved.
2. Identity registry and crosswalk policy are frozen after population-wide evidence review.
3. Fixture generation is byte-identical and covers every supported semantic variant and failure state.
4. The complete selected production evidence set replays twice under a declared fixed clock.
5. Runtime semantic mutation tests and audit-only stability tests pass.
6. Coverage is reconciled independently; zero output, silent truncation, unresolved core identity, and unresolved deterministic values are blocking.
7. Every warning has a policy-owned disposition; every exception names approver, rationale, scope, and expiry/revisit trigger.
8. Exact catalog, manifest, and QA paths are the only promoted paths and are mutually digest-bound.
9. `appConsumptionGate` and `publicReleaseGate` have explicit machine-readable predicates and both equal `pass`.
10. Production evidence retention, first-baseline approval, ticket state, sprint state, ledger, and both result manifests agree before completion.

If any required gate cannot pass, implementation tickets may record their completed work, but BW-1105, BW-1106, EPIC-11, and SPRINT-012 remain incomplete with a precise blocker. No Definition of Done checkbox should treat `blocked` as equivalent to `pass`.

### 8. Keep the Helper Narrow and Delay Commitment if Possible

If an executable consumer contract is necessary, use `resolveInsigniaEffectsForSlot(record, slot)`. It should return the tagged slot outcomes and preserve note-only/unknown facts without assessing profession legality, duplicate equipment, stacking across pieces, rune interaction, conditions, or totals. If direct record access is already clear, omit the helper until EPIC-14 or EPIC-21 supplies a real consumer requirement.

## Recommended Approval Disposition

Merge the drafts, using the GPT-5.5 draft as the structural base and the GPT-5.4 draft's slot-local helper and concise bookkeeping as targeted replacements. Keep the merged sprint in `draft` status until the source-authority matrix, immutable identity lifecycle, structured modifier crosswalk, tagged slot semantics, mode-variant strategy, durable evidence retention, and exact release-gate predicates are incorporated. Those are contract decisions, not implementation details; deferring them would create public-ID churn, ambiguous stat behavior, and promotion evidence that cannot support later catalog refreshes.
