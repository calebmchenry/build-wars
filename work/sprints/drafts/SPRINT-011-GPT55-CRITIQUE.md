# SPRINT-011 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-011-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-011-GPT54-DRAFT.md`

Missing listed artifacts: none.

This critique intentionally does not review `work/sprints/drafts/SPRINT-011-GPT55-DRAFT.md`.

## GPT56SOL Draft

### Strengths

- The draft makes several high-value architecture decisions explicit instead of leaving them to execution: modifier ID as v1 identity authority, bounded hybrid source authority, effect-level stacking, rank versus rarity separation, headgear as a handoff fact, and no runtime import through `src/app/catalogs.ts` in this sprint.
- The runtime boundary is well defended. The catalog JSON is the only runtime-eligible artifact, while manifests, QA, source plans, snapshots, review evidence, icon bytes, and Python tooling are kept out of app consumption.
- The source-set protocol is rigorous. Discover, digest-confirmed fetch, and offline replay are separated, with explicit rejection conditions for partial, mixed-profile, digest-mismatched, path-escaping, or extra inputs.
- The catalog contract correctly avoids a single record-level `stackable` flag. The attribute rune case needs per-effect behavior because the attribute bonus and health penalty compose differently.
- The plan recognizes several real domain traps: duplicate modifier/name handling, Restoration family versus Restoration Magic, canonical page resolution, EPIC-03 joins, missing icon metadata, copied prose risk, source drift, and duplicate attribute-rune health penalties.
- The Definition of Done is unusually complete for release governance. It covers tickets, promoted paths, source accounting, deterministic generation, semantic digests, non-runtime boundaries, QA gates, documentation, no app code changes, and no commit creation.

### Weaknesses

- The sprint is over-scoped. It attempts to land new domain contracts, new lookup helpers, a new TypeScript effect summarizer, source-plan protocol generalization, page resolution, raw extraction, semantic normalization, icon metadata handling, QA, deterministic fixture generation, live discovery, digest-confirmed fetch, selected offline replay, production promotion, first-baseline review, documentation, ticket closeout, ledger updates, and ticket-burn output in one sprint.
- The draft is overly prescriptive about implementation internals before source shape is confirmed. It fixes schema sections, caps, exact effect kinds, section digests, manifest semantics, and QA behavior while still listing core source shape and final count as open questions.
- The optional EPIC-04 source-protocol refactor is a major hidden risk. Even with a byte-preservation caveat, moving shared digest and snapshot validation primitives can consume the sprint and introduce regressions unrelated to rune catalog value.
- The first phase includes too many unrelated concerns: domain schema, lookup helpers, placeholder effect APIs, profile registration, CLI generalization, fixture dispatch, compatibility tests, and a read-only source-shape checkpoint. That makes the first gate hard to reason about and increases the chance of late contract churn.
- The plan repeatedly uses non-waivable release gates but does not define the review authority or operational owner for all of them. If live access, baseline review, or selected snapshot retention is unavailable, the sprint blocks, but the planned work still reaches deep into production promotion.
- The data model may be too rich for v1. Fields such as `display`, `reviewed-original`, `sourceSet` section digests, effect-level provenance for every field, and `remoteMedia` metadata might be justified, but each adds parser, QA, and review complexity.
- The plan says unknown and conditional mechanics can be `note-only` or `unknown`, but also says mechanically complete effects for accepted families are required. The distinction between an accepted runtime record with unknown effects and a blocking unsupported record needs sharper rules.

### Gaps In Risk Analysis

- The largest risk is execution size, but the risk table mostly treats individual technical failure modes. It should explicitly call out sprint non-completion risk from combining source discovery, parser work, semantic modeling, QA, promotion, and documentation.
- The plan assumes the Equipment template modifier table provides a unique, stable, player-usable armor-rune identity for all promoted records. It discusses duplicate IDs and missing IDs, but not the alternative of using `templateModifierId` as an external crosswalk while minting a separate stable `RuneId`.
- The source-shape risk is understated. MediaWiki source pages may rely on templates, transclusion, rendered tables, redirects, shared family pages, sections instead of detail pages, historical notes, or inconsistent infobox fields that are not trivial to parse with `mwparserfromhell`.
- The copied-text risk is named, but detection is not made operational. "Reviewed original short text" and "note-only" text could still drift into paraphrased source prose unless the policy defines allowed note formats and review evidence.
- Production snapshot retention is treated mostly as documentation. Since production snapshots remain ignored, future exact replay depends on retained local state or a new live acquisition. That is a real release reproducibility limitation, not just a doc note.
- EPIC-03 dependency drift could invalidate joins and semantic catalog versions. The draft records dependency digests, but it does not explain whether a changed EPIC-03 catalog should require a full rune source refresh, a join-only regeneration, or a manual review.
- The risk table does not cover fixture realism. Synthetic fixtures can prove determinism while still missing the hardest live parsing cases.
- The plan does not quantify expected record counts, review workload, or artifact sizes beyond caps. Caps alone do not make the review effort bounded enough for sprint planning.

### Missing Edge Cases

- Modifier rows that look rune-like but represent containers, upgrade components, PvP-only variants, historical/removed content, or non-player-usable records.
- Player-usable armor runes that appear in the rune inventory but lack a unique modifier row, or have multiple modifier rows for one canonical rune.
- Detail pages that represent a family or rank section rather than one page per rune.
- Canonical title collisions after redirects, capitalization normalization, punctuation normalization, or shared rank/family pages.
- Name lookup collisions across rank variants, family variants, and aliases such as "Rune of X", "Minor Rune of X", and "Superior Rune of X".
- Profession and attribute labels that are ambiguous, renamed, localized, or inconsistent with the promoted EPIC-03 catalog.
- Attribute runes whose profession restriction and affected attribute do not belong together.
- Headgear cases where common, hero, or attribute-linked headgear behavior differs from ordinary armor pieces.
- Equal highest attribute bonuses from multiple runes, where one selected adjustment needs clear evidence while every negative health penalty remains counted.
- Non-attribute rune stacking interactions that cannot truthfully be represented as `sum` or `highest`, especially condition duration and damage reduction interactions with non-rune modifiers.
- Missing, redirected, duplicate, or namespace-drifting icon file metadata.
- Unicode, HTML entity, whitespace, parenthetical, and punctuation differences between modifier rows, detail pages, and EPIC-03 names.
- Seed page revisions and detail page revisions that are internally inconsistent because the source changed between fetches.

### Definition Of Done Completeness

- The DoD is strong on governance, deterministic generation, runtime isolation, QA gates, downstream handoffs, and no app/schema changes.
- It is likely too broad to be a practical sprint DoD. Many items are full release-management requirements rather than implementation acceptance criteria, and several depend on manual review and live source availability.
- The DoD should separate "implementation complete with fixture data", "production promotion complete", and "sprint blocked because production source/review is unavailable". The current version has that concept, but the checklist still reads as though all promoted production work must happen in the same sprint.
- The DoD should define pass/fail thresholds for warnings, accepted dispositions, copied-text findings, and app/public gates instead of naming the gates only.
- The DoD should state the expected behavior if source discovery finds materially more candidates than the initial caps or expected matrix allow.

## GPT54 Draft

### Strengths

- The draft is much more executable. It has a clear phase sequence and avoids burying the executor in every possible schema and QA detail.
- The scope boundary is clean: no armor UI, no saved-build schema expansion, no template equipment import, no remote icon fetching, and no runtime import of audit artifacts.
- The plan orders contract, source set, extraction, semantics, promotion, and documentation in a sensible dependency chain.
- The use cases are practical and focused on what downstream work needs: stable runtime data, deterministic regeneration, explicit dispositions, highest attribute bonus selection, and countable duplicate health penalties.
- The draft keeps live refresh manual and avoids making live network access part of default verification.
- The DoD captures the core release shape: runtime catalog contract, source-set replay, fixtures, extraction diagnostics, semantic catalog version, exact promoted paths, `.gitignore` allowlists, QA, docs, tests, no app changes, and no commit.

### Weaknesses

- The most important architecture decision is left open: the bounded source authority. Asking whether the source graph should be an index page, category-family hybrid, or family-page seed set is too late for an execution-ready sprint.
- Identity policy is under-specified. The draft says stable `RuneId` should not derive from array position, but it does not lock whether v1 identity comes from Equipment template modifier IDs, canonical pages, generated IDs, or an explicit crosswalk.
- The effect model is too vague for the known attribute-rune problem. It names broad effects such as `attribute-bonus`, `health-penalty`, `health-bonus`, `energy-bonus`, and `note`, but does not require effect-level stacking groups or explicitly prohibit a record-level shortcut.
- The source-set strategy lacks fixed seed pages, exact caps, candidate accounting rules, and non-waivable failure behavior. "Smallest bounded page graph" is a reasonable principle, but it is not enough to prevent scope creep during live discovery.
- Phase 5 says manual live refresh is optional, but the DoD requires offline replay from a selected snapshot set and promoted production artifacts. If no live acquisition is required, the plan must explain where production source snapshots come from.
- The draft underplays QA complexity. It lists finding categories but does not require stable finding IDs, bounded evidence, source-plan dependency digests, section digest semantics, or a first-baseline review.
- Module naming is inconsistent with the other draft: `rune_extractors.py` versus `rune_extractor.py`. The final sprint should verify and use one naming convention.
- Headgear remains unsettled. The open question asks whether headgear should be a dedicated handoff field or a note effect, but the sprint needs a concrete v1 decision before implementation.

### Gaps In Risk Analysis

- The risk table does not include the open source-authority question, even though that is the largest source of architecture and scope risk in this draft.
- It does not call out the risk of using categories or broad page graphs that silently expand the sprint beyond a reviewable source set.
- It does not cover the possibility that modifier IDs, rune inventory entries, and detail pages disagree.
- It does not explicitly address EPIC-04 or shared ingestion regression risk beyond generic profile compatibility.
- It does not discuss production replay retention. If source snapshots stay ignored, future maintainers may not be able to reproduce the exact promoted bytes.
- It does not treat copied-text policy as a hard release gate. It names the risk, but the mitigation does not define non-waivable behavior.
- It omits the risk that synthetic fixtures pass while live pages expose unsupported templates, transclusion, shared pages, or inconsistent source fields.
- It does not mention manual review availability or baseline-review workload as a blocker to promotion.

### Missing Edge Cases

- Duplicate modifier IDs, duplicate canonical pages, and conflicting modifier names.
- Rune-like equipment modifier rows that are not armor runes.
- Armor-rune inventory entries with no matching modifier ID.
- Container runes, insignias, weapon modifiers, and historical or unsupported records that require explicit dispositions.
- Rank versus rarity differences, especially for families like Vitae and Attunement.
- Attribute bonus and health penalty stacking as two effects on the same rune with different composition rules.
- Equal maximum attribute bonuses from multiple equipped copies.
- Duplicate major or superior runes where the selected attribute bonus is suppressed but health penalties remain counted.
- Restoration as a condition-reduction family versus Restoration Magic as a Ritualist attribute.
- Headgear `+1` double-counting or accidental modeling as a rune effect.
- Shared family pages, section links, redirects, disambiguation pages, redirect cycles, missing pages, and unexpected namespaces.
- Missing icon metadata, duplicate icon file names, and redirected file pages.
- Attribute/profession join mismatches against EPIC-03.
- Unknown non-attribute family semantics that should block, become note-only, or remain out of v1.
- Path confinement, digest mismatch, partial snapshot, and mixed-profile replay rejection cases.

### Definition Of Done Completeness

- The DoD is concise and covers the main user-visible and release artifacts.
- It is weaker than GPT56SOL on source accounting, identity authority, exact source policy, dependency digest validation, app/public release gates, non-waivable findings, and first-baseline review.
- It should require every candidate source record to become an accepted rune, supported relationship, explicit exclusion, unsupported disposition, or blocking finding.
- It should require deterministic section digests and semantic version behavior only for consumer-visible fields, or explicitly state that the sprint is not attempting section-level semantic versioning in v1.
- It should define what "offline replay from the selected snapshot set" means if live refresh is optional.
- It should include exact gate behavior for copied-text findings, digest mismatches, incomplete replay, and missing required rune mechanics.

## Comparison

- GPT56SOL is stronger as an architecture contract. It resolves the hard decisions around identity, source authority, effect-level stacking, headgear separation, deterministic replay, and release gates.
- GPT54 is stronger as an execution document. It is shorter, easier to follow, and less likely to trap implementers in incidental detail before the code is touched.
- GPT56SOL's main failure mode is scope overload. It tries to solve source governance, production data promotion, semantic modeling, QA, docs, and process closeout with release-grade rigor in one sprint.
- GPT54's main failure mode is under-specification. It leaves source authority, identity policy, headgear modeling, and stackability details open enough that implementers could make incompatible choices.
- The drafts agree on the right broad boundaries: no app UI changes, no saved schema changes, no runtime audit imports, metadata-only icons, deterministic fixture/offline paths, EPIC-03 joins, explicit dispositions, and downstream handoffs.
- They disagree in level of commitment. GPT56SOL fixes decisions that GPT54 leaves as open questions. The combined sprint should keep the fixed decisions where they prevent bad architecture, but avoid carrying every secondary release mechanism into the first implementation increment.

## Merge Recommendations

1. Use GPT54's structure as the base document, then import GPT56SOL's non-negotiable architecture decisions:
   - v1 identity is anchored to Equipment template modifier IDs through an explicit `templateModifierId` mapping.
   - source authority is the bounded hybrid of Equipment template format, Rune, Attribute bonus, detail pages, and promoted EPIC-03 dependency data.
   - stacking is stored per effect with stable group keys, not as a record-level boolean.
   - headgear is a dedicated handoff field, not a rune effect or note-only substitute.
   - only `data/generated/epic-10/runes.catalog.json` is runtime-eligible.

2. Split or soften the production-promotion requirement. The safest merge is:
   - Sprint 011A: contract, profile, source-set planning, synthetic fixtures, extraction, semantic fixture catalog, and focused tests.
   - Sprint 011B: reviewed live source acquisition, selected offline replay, production promotion, first baseline, broad QA, docs, and closeout.
   If kept as one sprint, the DoD should explicitly allow "blocked after fixture-ready implementation" when live source acquisition or review cannot be completed.

3. Make the source-protocol refactor optional and local. Do not require EPIC-04 shared-protocol extraction for success. Prefer EPIC-10-specific helpers unless byte-preserving shared extraction is trivial and fully covered.

4. Tighten GPT54's source-set section using GPT56SOL's candidate accounting rules. Every rune-like modifier row and armor-rune inventory entry should become an accepted record, same-family relationship, explicit exclusion, unsupported disposition, or blocking finding.

5. Reduce GPT56SOL's v1 semantic scope. Attribute runes, Vigor, Vitae, Attunement, Absorption, and condition families can be represented by the schema, but only source-verified mechanics should become arithmetic effects. Ambiguous non-attribute behavior should remain `note-only` or `unknown` with QA evidence rather than blocking the whole sprint unless the rune is core to v1 completeness.

6. Choose one runtime effect vocabulary. Prefer GPT56SOL's per-effect stacking model, but avoid putting `malformed` or parser failure states inside normal runtime records. Parser failures should be QA findings or dispositions; runtime records should contain accepted effects, `note-only`, or `unknown` states with bounded provenance.

7. Add an "Alternatives Considered" section to the merged draft. It should explicitly reject or defer:
   - category crawl as source authority;
   - record-level `stackable`;
   - runtime import of manifests or QA;
   - app/editor changes in this sprint;
   - hand-authored production JSON;
   - full stat calculation;
   - headgear `+1` as a rune effect;
   - broad shared ingestion refactor as a required milestone.

8. Make release gates concrete. Define the minimum QA pass state, warning disposition format, digest mismatch behavior, copied-text failure behavior, app-consumption gate, public-release gate, and selected-snapshot replay requirement.

9. Clarify snapshot retention. If selected production snapshots are ignored, document how the team preserves or reacquires the exact source inputs for future refreshes and whether exact byte replay is expected across machines.

10. Keep the DoD readable by grouping it into implementation, data promotion, documentation, and process closeout. GPT56SOL's DoD content is valuable, but it should not be a single flat list of every concern.

11. Resolve file naming before execution. The merged plan should use either `rune_extractor.py` or `rune_extractors.py` consistently and should match repository conventions.

12. Preserve the strict non-scope items from both drafts. The merged plan should continue to state that `src/app/catalogs.ts`, editor behavior, local persistence, sharing, equipment UI, template semantic import, and full stat analysis remain unchanged.
