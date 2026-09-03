## Combined Critique

### `SPRINT-013-GPT56SOL-DRAFT.md`

**Strengths**

- Strongest boundary discipline of the two drafts. It clearly preserves source-policy limits, exact-path promotion, runtime/non-runtime separation, `src/app/catalogs.ts` isolation, and EPIC-05 raw-template fidelity.
- The field-level source-authority matrix is valuable. It makes conflict handling explicit instead of relying on extractor behavior.
- The identity model is solid: registry-backed `WeaponId` / `WeaponModifierId`, explicit crosswalks, tombstones, supersession, and no coupling to source order or template IDs.
- Tagged damage, requirement, applicability, effect, and compatibility states are the right shape. This avoids false `null`, zero, or universal-compatibility semantics.
- The Definition of Done is unusually complete around determinism, copied-text controls, replay, source retention, exact allowlists, release gates, and downstream ownership.

**Weaknesses**

- Scope is high. It combines source discovery, two catalogs, identity registry, effect grammar, compatibility helper, template-resolution view, multi-artifact pipeline support, QA, promotion, docs, and ticket closeout in one sprint.
- It leans toward a generic ordered multi-artifact ingestion extension. That may be unnecessary platform churn if EPIC-12 can be handled by a narrower profile-specific dual-output path.
- The effect model may overreach. Source-clear chance facts, conditional predicates, life-steal, mastery-style facts, mutual exclusions, and stable effect IDs all add implementation and QA load before real source shape is known.
- The source caps are precise but not evidently source-derived. They should be initial assumptions, not architectural facts.
- Set-level QA is split across two QA files with a unioned release decision. That is workable, but the canonical home for cross-catalog/set findings must be made unambiguous.

**Risk Analysis Gaps**

- Understates the risk that the first production source census invalidates the schema shape, not just source caps.
- Does not fully address the operational risk that live review capacity blocks promotion after most engineering work is complete.
- Needs a clearer fallback if practical PvP coverage produces many unresolved but non-critical rows.
- Should call out profile-name drift as a blocking consistency risk.

**Missing Edge Cases**

- Same wiki page producing multiple accepted variants.
- Same normalized display name across weapon families, variants, or modifier slots.
- Mode-specific mappings where one raw template ID is PvP-only, PvE-only, historical, or ambiguous.
- Optional icon absence versus unsafe media metadata versus source-policy-disallowed media.
- Ensuring generated runtime JSON contains no local paths, snapshot IDs that imply filesystem structure, or copied source snippets beyond approved compact provenance.

**Definition of Done Completeness**

- Very strong overall.
- Add explicit checks for one canonical profile ID everywhere, no generated catalog imports outside the intended future app boundary, and no semantic changes to EPIC-05 encode/decode contracts.
- Consider making “no new dependencies without amendment” a DoD item, not only a security note.

### `SPRINT-013-GPT54-DRAFT.md`

**Strengths**

- More pragmatic implementation posture. Its preference for a profile-specific dual-write path over broad generic multi-artifact refactoring is the safer execution default.
- Good ownership table. It protects `src/domain`, `src/template-compatibility`, ingestion tooling, runtime artifacts, and promotion evidence from cross-layer leakage.
- Correctly preserves `src/domain/equipment.ts` authored-build placeholders instead of pushing catalog-only concerns into existing lightweight equipment types.
- Conservative effect handling reduces hidden complexity: HCT/HSR, mastery, conditional, and chance behavior default to `note-only` or `unknown`.
- DoD is more concise and easier for an executor to follow.

**Weaknesses**

- Runtime contract examples are weaker. `damageType`, `damageMin`, `damageMax`, nullable requirement fields, and `requirementState` can recreate the exact ambiguity the sprint should avoid. GPT56SOL’s tagged facts are safer.
- It lacks GPT56SOL’s explicit `catalogSet` / `catalogSetVersion` contract. Without that, the two catalogs can drift even if both individually pass.
- Source authority is described but not formalized enough. It should inherit the field-level authority and conflict-precedence matrix.
- Compatibility returns `unknown` rather than `indeterminate`, which blurs lookup failure with incomplete applicability evidence.
- The “amend and continue without waiting” language is too loose for non-interactive execution. Material source, schema, artifact, or boundary changes should be recorded and gated, not silently absorbed.

**Risk Analysis Gaps**

- Underplays selected-evidence retention and exact future reproducibility.
- Does not fully address cross-catalog version skew or where set-level QA findings live.
- Needs stronger copied-text/source-policy detail around display text and reviewed Build Wars-authored notes.
- Does not analyze the alternative of “lookups only, no compatibility helper yet” as a way to reduce scope.

**Missing Edge Cases**

- Explicit `not-applicable` damage for shields/focuses versus unresolved missing weapon damage.
- Mode-specific damage, requirement, and crosswalk facts.
- Partial applicability where silence must not mean universal support.
- Same modifier name or source key occupying different slot/component families.
- Duplicate-slot and mutual-exclusion facts needed later by EPIC-14.

**Definition of Done Completeness**

- Good but should be expanded with GPT56SOL’s tagged-state, release-set, source-policy, and exact replay checks.
- Add mandatory shared catalog-set versioning, counterpart consistency, runtime path/content scans, QA overflow/material-truncation blockers, and explicit source-retention documentation.
- Make the exact profile ID a DoD item.

## Comparison

GPT56SOL is architecturally safer but risks becoming too large and too platform-heavy. GPT54 is more executable but leaves several semantic and release-set boundaries too soft.

The merged sprint should use GPT56SOL for contracts, source authority, identity, tagged facts, raw-template preservation, QA rigor, and DoD depth. It should use GPT54 for implementation restraint: avoid broad ingestion refactors unless proven small, preserve existing authored equipment types, and keep uncertain effects conservative.

## Merge Recommendations

- Pick one profile ID and propagate it everywhere. Prefer `epic-12-weapons-and-mods` or `epic-12-weapons-mods`, but do not allow both.
- Keep two runtime catalogs and the six exact promoted paths.
- Require shared `catalogSetVersion`, counterpart version/digest checks, and release-set gating for both catalogs.
- Use tagged `damage`, `requirement`, `applicability`, and lookup outcomes. Avoid primitive nullable damage/requirement fields.
- Prefer GPT54’s narrow EPIC-12 dual-output implementation path over GPT56SOL’s generic multi-artifact platform extension unless Phase 1 proves the generic change is trivial and regression-covered.
- Use `compatible | incompatible | indeterminate` for compatibility; reserve `unknown` for lookup/data absence where appropriate.
- Default complex modifier behavior to `note-only` or `unknown`; only add structured chance/condition facts when Phase 1 proves an exact closed shape.
- Keep equipment-template resolution additive and caller-supplied. No generated catalog imports in template codec code, no raw document mutation, and no weakening of exact-source export.
- Add source-retention honesty from GPT56SOL: if selected snapshots are not retained, docs must not claim exact future reproducibility.
- Treat material amendments to sources, caps, artifacts, identity policy, effect vocabulary, runtime imports, or raw-template behavior as phase-gated changes, not executor discretion.