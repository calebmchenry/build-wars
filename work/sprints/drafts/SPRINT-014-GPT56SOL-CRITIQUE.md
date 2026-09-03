# Combined Critique: Sprint 014 Equipment Shell Model

Both listed drafts are present. GPT-5.5 provides the stronger validation and defensive-domain design; GPT-5.4 provides the more coherent end-to-end durability story. Neither is ready to execute unchanged because they disagree on persistence, serialization, validation completeness, and several core model shapes.

## GPT-5.5 Draft

### Strengths

- Establishes a disciplined semantic boundary between authored equipment, raw template fidelity, generated catalogs, UI, and later stat aggregation.
- Treats empty, unresolved, stale, partial, and structurally malformed states deliberately rather than normalizing them away silently.
- Gives unusually strong attention to validation behavior: deterministic ordering, bounded traversal, issue caps, and the meanings of `complete`, `resolved`, and `exhaustive`.
- Reuses existing rune, insignia, weapon-modifier, and effective-rank helpers instead of duplicating game rules.
- Provides detailed fixtures, dependencies, handoffs, security constraints, and file-level execution guidance.
- Explicitly prevents generated data, application modules, network concerns, and raw template identifiers from leaking into the domain layer.

### Weaknesses

- The persistence decision makes the architecture internally awkward. The sprint introduces canonical authored equipment on `Build`, yet application persistence continues rejecting or dropping every non-null loadout. This creates a public model that cannot survive normal application lifecycle operations.
- Several “binding decisions” remain open questions, including public naming and catalog-absence behavior. These should be resolved before implementation, not during closeout.
- `schemaVersion` and a singular `catalogVersion` are proposed inside the loadout without explaining their consumers. A single catalog version is especially questionable when runes, insignias, weapons, and modifiers can evolve independently.
- `armorRating` and `requirementAttributeOverride` risk storing derived catalog facts inside authored state. Their user-editable meaning and reconciliation rules are not established.
- Keeping slot-labelled arrays specifically to preserve duplicate and missing slots mixes canonical domain state with corrupt transport state. Every downstream helper must consequently defend against contradictory array position and `slot` values.
- The planned documentation and closeout surface is large relative to the implementation, increasing execution cost without resolving the central persistence and schema questions.

### Gaps in Risk Analysis

- Catalog ID rekeying or removal could turn previously known references stale; there is no migration or reconciliation policy.
- The compatibility alias has no deprecation or removal criterion and could become permanent terminology debt.
- Duplicate armor slots can produce identical source keys such as `armor:head`, making downstream rune aggregation ambiguous.
- Catalog omission, catalog version mismatch, and duplicate catalog records are not tied to explicit `resolved` or `exhaustive` outcomes.
- Runtime TypeScript types cannot reject forbidden raw or cosmetic fields. The security language promises rejection without identifying a runtime decoder responsible for it.
- Persisting only `equipment: null` postpones the most difficult compatibility work and creates a risk that later UI work must redesign the contract after users can produce data.

### Missing Edge Cases

- Non-array containers, non-object entries, unknown slot strings, invalid union tags, missing required union fields, and unexpected extra fields.
- Duplicate declared slots whose array positions disagree with their slot identifiers.
- Two-handed weapons placed in the off hand, main-hand-only weapons in the off hand, off-hand-only equipment in the main hand, and off-hand equipment without a main-hand weapon.
- Modifiers attached to an unresolved weapon, duplicate modifier IDs versus duplicate occupied modifier slots, and modifiers whose slot facts are themselves unresolved.
- Known-but-missing catalog IDs versus explicitly unresolved authored references.
- Negative, fractional, unsafe, `NaN`, or infinite armor ratings and identifiers.
- Requirement evaluation when headgear or runes change effective rank, and whether all four sets or only an active set participate.
- Extraction behavior when malformed duplicate head slots would produce multiple headgear adjustments or rune source-key collisions.
- Catalog views supplied at incompatible versions or only partially supplied.

### Definition of Done Completeness

The Definition of Done is broad and generally test-oriented, but it does not close the sprint’s architectural decisions:

- It accepts continued loss of non-null equipment during persistence without clearly declaring the model ephemeral.
- It does not specify the exact issue-to-`valid`/`complete`/`resolved`/`exhaustive` mapping.
- It does not require tests for absent catalogs, catalog-version mismatches, duplicate catalog IDs, or helper behavior over duplicate slots.
- It claims exclusion of forbidden fields but does not require a runtime decoding or rejection test.
- It does not establish a migration path or removal condition for `EquipmentTemplate`.

## GPT-5.4 Draft

### Strengths

- Presents a clearer product lifecycle: semantic equipment becomes part of `Build`, survives local-library and backup/restore flows, and remains deliberately excluded from share URLs.
- Includes a useful Phase 0 to freeze naming, unresolved-reference shape, issue codes, and persistence policy before refactoring.
- Uses a smaller, easier-to-understand core model with `null` for empty selections and a known/unresolved reference union.
- Clearly states that catalog-backed checks are skipped when catalog views are absent, avoiding validation noise in existing application flows.
- Keeps application changes narrowly focused on durability rather than expanding into the editor or catalog wiring.
- Defines a concise dependency order and a full-repository verification gate.

### Weaknesses

- The proposed model lacks an explicit schema-evolution mechanism even though it becomes durable application data.
- The default assumption that persistence schema version 1 can absorb non-null equipment is unsafe. A significant new nested payload should not silently reuse a version unless compatibility is demonstrated.
- `HeadgearBonus.amount` stores an invariant value of `1`, allowing invalid authored values that could instead be derived.
- `armorRating: number | null` is less expressive than the draft’s stated goal of preserving unresolved imported facts.
- `requirementAttributeId` appears to duplicate catalog truth, while requirement rank and override semantics remain unspecified.
- The reserved validation code list is incomplete relative to the promised behavior. It omits explicit codes for duplicate/missing weapon sets, unresolved modifiers, duplicate modifier slots, invalid headgear placement, and unmet requirements.
- One use case says weapon structure should explain incompatible modifiers “later,” while later phases place compatibility validation inside this sprint.
- The persistence plan does not specify whether malformed non-null equipment rejects the whole record, drops only equipment, preserves a recoverable raw value, or triggers migration.

### Gaps in Risk Analysis

- The four listed risks omit catalog drift, schema migration, alias lifetime, hostile input bounds, issue truncation, invalid numeric values, and source-key collisions.
- There is no risk treatment for silently losing equipment through older application versions or share/export paths.
- Skipping catalog-backed checks may cause a result to appear fully validated unless `exhaustive` is explicitly downgraded.
- The draft does not examine the long-term cost of redundant slot-labelled arrays.
- It does not address how semantic unresolved references can later be reconciled without retaining prohibited raw identifiers.
- It underestimates the coupling introduced by modifying persistence before the application has a producer or editor for equipment data.

### Missing Edge Cases

- Over-limit armor, weapon-set, and modifier arrays; unknown or duplicate weapon-set slots; and noncanonical ordering.
- Unsafe numeric values, prototype-pollution keys, excessively long unresolved labels/reasons, and extra fields.
- Partial equipment catalog availability, duplicate catalog IDs, and catalog-version disagreement.
- Known references that become stale after persistence.
- Two-handed/off-hand placement variants and hand-specific base restrictions.
- Modifiers on unresolved weapons or weapons with unresolved compatibility facts.
- Corrupt backup recovery and rollback behavior after the persistence schema changes.
- Duplicate head slots producing ambiguous adjustment and rune enumeration.
- The semantic distinction between `equipment: null`, an empty loadout, and an incomplete loadout.

### Definition of Done Completeness

The Definition of Done is stronger on end-to-end usefulness because it requires non-null persistence, but it remains underspecified:

- It does not require an explicit schema-version or migration decision.
- It lacks security and bounded-input acceptance tests despite the security section’s promises.
- It does not require a complete issue-code, severity, ordering, and result-classification matrix.
- It does not cover absent or partial catalog views, catalog drift, duplicate catalog IDs, or capped validation.
- It does not define “round-trip” precisely enough to prohibit silent field loss or coercion.
- It does not establish how invalid persisted equipment is recovered.

## Cross-Draft Contradictions

| Topic | GPT-5.5 | GPT-5.4 | Architectural consequence |
| --- | --- | --- | --- |
| Non-null persistence | Remains rejected or dropped until EPIC-14 | Must round-trip in this sprint | The merged sprint cannot have both acceptance criteria. |
| Empty selection | Tagged `empty` variant | `null` | Changes serialized shape, narrowing behavior, and persistence validation. |
| Loadout versioning | Stores `schemaVersion` and `catalogVersion` | Omits both | Durable compatibility and catalog reconciliation remain unresolved. |
| Armor rating | Tagged optional/authored/unresolved state | `number \| null` | Different support for uncertainty and different runtime-validation burden. |
| Headgear | Attribute selection with derived `+1` | `HeadgearBonus` stores `amount: 1` | One derives an invariant; the other permits redundant invalid state. |
| Requirement override | Tagged attribute selection | Plain `AttributeId \| null` | Neither settles whether this is authored choice or copied catalog fact. |
| Missing catalogs | Left as an open warning/enforcement question | Catalog checks are silently skipped | Directly affects `resolved` and `exhaustive`. |
| Validation provenance | Adds equipment catalog versions | Keeps `validatedAgainst` unchanged by default | Results may or may not disclose what was actually checked. |
| Persistence ownership | EPIC-14 migration | SPRINT-014 durability | Downstream epic ownership is contradictory. |

## Strategic Trade-offs

The central choice is between scope containment and a coherent data lifecycle. GPT-5.5 limits application work, but leaves a canonical `Build` field intentionally lossy. GPT-5.4 makes the feature durable, but assumes migration and schema safety without enough design. If equipment is genuinely becoming authored `Build` state, durability belongs with the contract change; otherwise the sprint should avoid presenting non-null equipment as a supported application state.

A second trade-off concerns malformed state. Empty, incomplete, and unresolved selections are valid authored concepts. Duplicate slots, invalid tags, and non-array containers are corrupt transport shapes, not useful canonical domain states. Treating both categories identically makes every future consumer more complicated.

Finally, catalog-ID normalization keeps builds compact but creates long-range catalog-drift risk. Unresolved references need enough stable semantic identity for later reconciliation without smuggling raw template IDs into the semantic model.

## Merge Recommendations

1. Adopt GPT-5.5’s validation rigor, security limits, dependency boundaries, and detailed edge-case fixtures, combined with GPT-5.4’s Phase 0 and end-to-end durability focus.

2. Resolve persistence first. The preferred architecture is to round-trip non-null semantic equipment in this sprint with an explicit persistence schema decision and migration tests. If persistence remains deferred, remove durability language, state that non-null equipment is domain-test-only, and prohibit silent dropping.

3. Use one selection convention consistently. A practical contract is `null` for intentionally empty and a tagged `known | unresolved` union for non-empty selections. Do not mix `null` and a separate `empty` tag without a demonstrated semantic distinction.

4. Separate canonical state from corrupt input. Keep `EquipmentLoadout` canonical with exactly five armor entries and four weapon-set entries. Validate untrusted `EquipmentLoadoutInput` separately so malformed arrays can be diagnosed without infecting every typed helper.

5. Put schema versioning at the persistence-envelope level unless a loadout-local version has a concrete migration consumer. Do not store a singular catalog version when several independently versioned catalogs are involved.

6. Derive invariants and catalog facts:

   - Derive the headgear adjustment amount as `1`.
   - Omit armor rating until its authored meaning and provenance are clear.
   - Keep weapon requirements in catalog records unless the user can intentionally override them; model a true override explicitly if needed.

7. Freeze a validation truth table before coding. It must define severity and the effects on `valid`, `complete`, `resolved`, and `exhaustive` for empty selections, missing slots, malformed structure, unresolved references, stale known IDs, absent catalogs, partial catalogs, version mismatch, and issue truncation.

8. Define helper behavior on invalid input. In particular, prevent duplicate-slot source-key collisions and specify whether adjustment/enumeration helpers reject, skip, or index duplicate slots.

9. Expand weapon acceptance tests to include hand-specific legality, two-handed weapons in either hand, off-hand-only partial sets, modifier-without-resolved-base cases, duplicate modifier IDs and slots, and requirement evaluation with equipment-derived rank adjustments.

10. Make persistence acceptance explicit: old null records load unchanged, valid non-null records round-trip byte-for-byte at the semantic level, malformed equipment follows a documented recovery policy, and no supported path silently drops equipment.

11. Add catalog evolution criteria: stale IDs must remain visible, validation provenance must show which catalog views were used, and unresolved references must contain enough bounded semantic information for future reconciliation.

12. Give the `EquipmentTemplate` alias a removal target, owner, and compatibility test so the semantic/raw terminology conflict does not become permanent.

The merged Definition of Done should not be considered complete until the persistence policy, canonical serialized shape, validation-result matrix, runtime decoding boundary, and catalog-drift behavior are all explicit and testable.