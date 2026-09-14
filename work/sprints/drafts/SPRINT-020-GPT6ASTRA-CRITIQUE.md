# Sprint 020 combined critique

Reviewed only [GPT56SOL](SPRINT-020-GPT56SOL-DRAFT.md) and
[GPT55](SPRINT-020-GPT55-DRAFT.md), against the accepted
[attribute-adjustment contract](../../../compendium/attribute-adjustments.md),
[EPIC-19](../../tickets/19-composer-attribute-adjustments/EPIC.md), `AGENTS.md`, and
relevant source code. The GPT6ASTRA draft and other critiques were not read.
This is a source-based feasibility review; no implementation, test execution, or
browser verification is claimed. Human scope decisions remain settled.

## Recommendation

Use SOL as the technical foundation and GPT55 as the model for a shorter execution
document. SOL provides substantially stronger contracts, boundary ownership, and
ticket-specific acceptance evidence. GPT55 expresses the central solution clearly
but leaves several decisions ambiguous at precisely the persistence and projection
boundaries where ambiguity can cause durable data loss or misleading calculations.

Do not merge either draft unchanged. Resolve the serialized shape once, correct
GPT55's title-rank export statement, preserve the permanent equipment helper's
contract, and complete the recovery and unresolved-display behavior. Consolidate
repeated requirements into one contract and one acceptance matrix rather than
combining both file lists and all repeated test commands.

## GPT56SOL assessment

### Strengths

- **Coherent ownership.** The authored profile, catalog-free reducers, pure preview
  projection, and app selectors have distinct responsibilities. The consumer table
  explicitly protects title ranks, equipment requirements, base spending, and game
  export while routing skill descriptions and inherent-attribute calculations
  through one preview boundary.
- **Correct equipment precedence.** Its source-by-source replacement table and
  “Use equipped value” action make inheritance, explicit None, and replacement
  operationally distinct. This avoids both double-counting and a one-way migration
  away from preserved semantic armor.
- **Strong effect semantics.** Exact template identities, per-slot mode resolution,
  independent source eligibility, faction/slot deduplication, requested versus
  active state, and cap-independent effect counting are specified together.
  External Refrain stays independent of recipient Leadership and bar presence.
- **Concrete durability coverage.** It identifies the explicit Build cloners,
  inactive nested snapshots, pagehide, transfers, recovery, and the difference
  between document and template fingerprints. Updating the existing comparison
  internals also prevents two differently adjusted builds from appearing identical
  there without exposing new collection UI.
- **Credible acceptance gates.** The complete 1280/900/390px matrix, both themes,
  zoom, broken-image scenario, keyboard/touch behavior, and disposable-folder
  workflows match the accepted brief. Missing real browser or verified asset
  evidence explicitly leaves the affected work open.

### Weaknesses and risk gaps

1. **The hidden-armor contract is more confident than its implementation plan.**
   SOL requires old/new affected rune attribute IDs in actions, but does not name
   the caller changes that supply them. Existing
   [ArmorEquipmentEditor](../../../src/app/components/ArmorEquipmentEditor.tsx)
   dispatches only a slot and selection, and
   [equipment-editor-state](../../../src/app/equipment-editor-state.ts) has no
   catalog. Its mutation helpers also return early for identical selections or an
   already-empty field. Specify one planner at the existing app boundary, update
   those callers without mounting them, and define whether an ineffective action
   leaves overrides untouched. Unknown old/new runes must not cause a guessed
   attribute or a broad clear. SOL names the right architecture, but not yet a
   complete transition contract.
2. **Preserving unknown selections does not guarantee they are removable.** SOL
   preserves unknown attribute IDs and incompatible selected runes, then omits
   controls on unknown, retained, secondary, and Any rows. A valid imported profile
   can therefore retain a rune override whose target has no eligible row at all.
   The row-level unknown-rune removal test covers only a known eligible target.
   Add an adjustment-diagnostics removal/reset affordance outside eligible rows;
   do not make profession changes or game import the recovery mechanism.
3. **Unresolved presentation stops short of a full consumer contract.** The draft
   explicitly fixes blue-zero attribute rows and blanket inherent-rank poisoning,
   but does not explicitly remove the current progression fallback
   `result.kind === "resolved" ? result.finalRank : 0` in
   [editor-selectors](../../../src/app/editor-selectors.ts),
   `selectTooltipRankContext`. Specify missing rank keys for unresolved progression
   inputs and `null` for unresolved inherent inputs. The existing
   [tooltip renderer](../../../src/domain/skill-tooltip.ts) already supports
   `missing-rank`; this does not require a new rendering engine.
4. **“Canonical” is underspecified for durable arrays.** Null collapse and duplicate
   rejection are explicit, but row ordering and concrete collection bounds are not.
   [Persistence fingerprints](../../../src/app/persistence-schema.ts) sort object
   keys while preserving array order. Equivalent edits made in a different order
   can therefore produce different fingerprints unless the new profile itself
   canonicalizes its set-like arrays. Freeze numeric attribute ordering, fixed
   logical-effect ordering, bounded counts, and no-op behavior in BW-1901/1902.
5. **Execution detail sometimes becomes unnecessary commitment.** A blanket ban on
   adding browser automation, an exact dated burn-result path, and repeated broad
   verification suites are implementation constraints rather than product needs.
   Keep honest browser evidence mandatory, permit available browser tooling, and
   obtain execution numbering and runner-owned paths from the actual burn. The
   final checks already run `npm run verify`, which includes tests, build, and
   Python data tests; preceding it with the same complete suites adds little.
6. **Asset guarantees need an achievable publication definition.** Verified staging,
   bounded downloads, and provenance are useful. However, atomically publishing
   binaries and manifests across three directories is not one filesystem rename.
   Require no publication before validation, manifest-last publication, and
   recovery from a publish failure; do not imply crash-atomic multi-directory
   replacement unless it is actually implemented. Scope the URL prohibition to
   runtime inputs: the proposed `rg` over the whole public rune directory also
   scans its README, where provenance links are legitimate.

### Missing edge cases and DoD completeness

SOL is close to acceptance-complete, but its ticket checklists need explicit proof
for an orphaned override target, unresolved progression text, and hidden reducer
no-op/unknown-target behavior. Add boundary cases for a purchased rank above the
catalog maximum, an unrelated overspent budget, equivalent profile row ordering,
and mode `unknown` or an incomplete skill split. Its broad “invalid base” and
“missing catalogs” fixtures are useful headings, but do not fix these outcomes.

Retain SOL's distinction between a source-scoped unresolved equipment selection
that contributes zero and an invalid base rank that makes that attribute
unresolved. State it once for rows, descriptions, and inherent calculations so
“unresolved” does not accidentally acquire different meanings in each consumer.

## GPT55 assessment

### Strengths

- **Readable solution and sequencing.** The overview and phase goals make the
  intended user outcome and eight-ticket dependency order easy to understand.
  The draft avoids turning the milestone into equipment management or a simulator.
- **Sound central design.** It keeps authored base allocations separate from
  compact equipment choices and effect preferences, uses a shared capped preview,
  and preserves temporary assumptions outside permanent validation.
- **Good core scenarios.** The 12+1+3 example, Fire 19, Refrain cap, primary-change
  lifecycle, external opt-in, transactional imports, and complete-document round
  trips give the work a useful functional spine.
- **Appropriately narrow asset intent.** It proposes the existing local icon
  pattern, per-rune mappings, shared profession/tier images, and no runtime fetches
  without broad catalog regeneration or unrelated media work.

### Weaknesses and risk gaps

1. **The persisted contract admits inconsistent states.** The type requires
   `attributeAdjustments`, while the semantics say a missing field means default
   behavior without limiting that rule to v1/v2 migration. Its common effect type
   allows `intensity` on every self effect and allows Refrain to omit it. That
   leaves the parser, reducer, and projection free to disagree. Adopt SOL's strict
   v3 field requirement and effect-specific parameter validation, preferably as a
   discriminated union. A missing old-version field migrates to `null`; a missing
   v3 field is malformed.
2. **A game-export sentence contradicts the rest of the draft and current code.**
   Phase 7 says exact/canonical exports include “title ranks as currently
   supported.” [projectEditorToSkillTemplate](../../../src/app/template-workflow.ts)
   emits only professions, base attributes, and skills; title overrides are
   browser-authored metadata. Remove title ranks from the export field list and
   test that they remain omitted alongside adjustments. Also replace the overview's
   “folder sync” audit wording with the existing folder Load/Save boundary; folder
   synchronization is expressly outside scope.
3. **The proposed domain API has competing sources of truth.** Phase 3 passes Build,
   selected mode, professions, and selected loadout into the projection even
   though mode/professions already belong to Build and loadout selection belongs
   to the app. It also proposes extending shared equipment collectors to
   understand compact overrides. That can make permanent callers silently read
   preview state. Adopt a pure `Build + catalogs` projection and preserve the
   existing semantic equipment collector's observable behavior.
4. **Equipment re-inheritance is missing from the UI contract.** None correctly
   suppresses inherited equipment, but neither the phase nor the DoD provides an
   action to remove an override and inherit again. Headgear Clear alone cannot
   express both operations. Bring over SOL's explicit reset action and inherited
   state labeling, plus unresolved/orphaned-selection recovery.
5. **Effect correctness is only partly executable.** The draft covers legality and
   faction deduplication, but does not explicitly require independent valid-source
   evaluation when another slot is invalid, duplicate-slot deduplication, the
   active count at the cap or with no targets, unavailable secondary Soul Reaping,
   outer Attributes collapse, or remembered forced-on status. These are accepted
   requirements, not optional elaboration. Refrain off/on strength retention also
   needs an exact lifecycle rather than “default +1 when enabled.”
6. **Durability verification is too generic.** “Malformed adjustment state” and
   “full internal documents” do not enumerate duplicate keys, wrong parameters,
   bounded arrays, unknown well-formed selections, write-blocking after partial
   recovery, inactive nested builds, restore remaps, or saved-record internals.
   The explicit cloners do omit fields unless changed; read-through audits alone
   cannot prove preservation. Use SOL's non-default round-trip and failure matrix.
7. **Asset fallback and browser evidence are incomplete.**
   [CatalogIcon](../../../src/app/components/CatalogIcon.tsx) has a fallback for a
   null asset descriptor, but no image-error handler for a mapped URL that fails
   to load. Keep tier numbers independently visible and test both missing mapping
   and broken image bytes. Include the rune's own health penalty as source
   information. The browser matrix omits the required 900px width and explicit
   missing-icon scenario; `1280x900` is not the 900px-width case.

### Missing edge cases and DoD completeness

GPT55 covers all eight ticket themes but is not acceptance-complete as written.
Its aggregate DoD could pass without re-inheritance, targeted recovery, precise
parameter validation, correct collapsed counts, all required viewport evidence,
or preserved save-failure behavior. “Full internal paths preserve adjustments”
needs named non-default fixtures; “game templates remain base-only” needs separate
exact-source, canonical, share/copy, file bytes, successful-save retention, and
cancellation assertions.

Its projection-specific tests should be mandatory. The new projection is the
mathematical and compatibility center of the feature, so leaving its direct
tests conditional on whether the module “warrants” them weakens the main gate.

## Cross-draft decisions to merge

| Topic | Difference or contradiction | Concrete merge decision |
| --- | --- | --- |
| Serialized profile | SOL uses flat named overrides and `strength`; GPT55 nests equipment and uses optional `intensity`. They are different wire shapes, not interchangeable examples. | Freeze SOL's `headgearOverride`, `runeOverrides`, and `effectPreferences` names; use `strength` with effect-specific types. Require the v3 field and canonicalize empty profiles to `null`. Do not support both new draft shapes. |
| Schema scope | SOL fixes Build v3 and explicitly retains outer versions; GPT55 leaves several envelope details implicit. | Bump Build only, retain supported outer envelopes and the storage key, and prove old readers reject new nested Builds safely through existing recovery behavior. |
| Projection ownership | SOL takes Build and narrow catalogs; GPT55 duplicates Build fields and selection context in the API. | Resolve selected loadout in the app, then pass that Build once. Keep UI labels/descriptors in app selectors and pure contribution/effect facts in the domain. |
| Legacy equipment | SOL extracts source-addressed facts while preserving permanent behavior; GPT55 suggests teaching existing helpers compact precedence. | Apply replacement in the preview projection. Add narrowly scoped source/diagnostic extraction only where the existing collector lacks it. Preserve permanent callers with non-default-profile regression tests. |
| Inherit versus None | SOL includes reset to inheritance; GPT55 provides only selection/clear. | Include both suppression and reset, with inherited selection visible. Add a recovery list for compact overrides whose targets have no eligible row. |
| Game-code content | SOL excludes titles/adjustments; GPT55 Phase 7 includes titles despite its base-only promise. | Export only the existing professions/base attributes/skills. Preserve title overrides and adjustments only through their existing browser/full-document boundaries. |
| Effect model | SOL separates requested, eligible, active, target set, and contributing count; GPT55 is less precise. | Adopt SOL's semantics and exact fixture matrix, including independent slots, faction dedupe, clipped contributions, and external Refrain off/on strength retention. |
| File previews | SOL describes a file's “own” mode; GPT55 leaves isolation generic. | Preserve existing mode context deliberately: game skill codes do not carry mode, and import currently inherits `currentState.build.mode`. File previews use candidate content and no current adjustments; do not invent mode metadata or new buff-preview UI. |
| Browser and closeout | SOL supplies the full matrix and evidence gates; GPT55 omits cases. | Use SOL's acceptance matrix, permit available browser tooling, and retain open status for missing evidence. Resolve runner paths at execution time. |
| Plan size | SOL is thorough but highly repetitive; GPT55 is readable but under-specified. | Keep GPT55's phase-goal format, one authoritative contract, SOL's per-ticket gates, and a single final verification gate. Treat file lists as audit targets rather than mandatory edits. |

## Shared unresolved assumptions and longer-range risk

**Invalid base ranks need a precise adapter rule.** The existing
[effective-rank primitive](../../../src/domain/effective-attribute-rank.ts) accepts
any safe nonnegative integer base rank; the purchased-rank maximum is enforced
separately by the catalog point-cost rules. Neither draft should equate primitive
success with a valid purchased rank. Check the supported purchased-rank table
before preview capping, preserve the authored invalid value and diagnostics, and
leave budget/legality validation independent. A valid attribute in an overspent
build can still have a meaningful preview; aggregate invalidity must not disable
all sources or make an illegal allocation legal.

**Unknown and unavailable inputs are different from unallocated zero.** An
unallocated eligible attribute has base zero; an unresolved base dependency does
not. Likewise, browsing a skill outside the current professions is a normal
catalog use case even though it is not an eligible buff target. Define the
base-only/fallback presentation for that skill without assigning it effects, and
preserve missing-catalog or ambiguous-variant diagnostics. Both drafts focus on
legal composer rows and leave these catalog consumers less explicit.

**A single implementation does not guarantee a single computation.**
[FocusedSkillCatalog](../../../src/app/components/FocusedSkillCatalog.tsx) calls
`selectSkillDisplay` for each visible skill. SOL's “once per top-level selector
invocation” can still resolve an entire build repeatedly for every catalog row;
GPT55 gives no reuse boundary. Allow an already-computed immutable preview context
to be passed through the display selectors, or cache at the existing Build/catalog
identity boundary if measurement justifies it. Check responsiveness in the large
catalog view without starting an unrelated performance project.

**Stable IDs require a future schema policy.** Both drafts intentionally support
only four logical effect IDs while preserving unknown catalog selections. Those
are different compatibility promises. Record that adding a newly accepted logical
effect to durable state requires an explicit schema compatibility decision;
do not let a future same-version field extension turn an older reader's complete
library into apparently corrupt data. For the current release, test well-formed
unknown rune/attribute IDs, strict unknown effect IDs, and an older-reader/newer-
Build encounter separately. Catalog updates may also change previously unresolved
selections into effective ones; the retained authored ID and explanation must
remain inspectable.

**The 126/30 asset matrix is a release fixture, not a permanent product limit.**
Keep it pinned to the promoted catalog used by this sprint. Do not silently accept
new identities during download, but document that a later catalog promotion must
update the reviewed fixture and asset map together. Reuse bounded acquisition and
hash/provenance helpers where practical without converting this sprint into a
generic asset-platform rewrite.

**Incomplete recovery threatens later local-build work.** The reason to store
adjustments on Build is that identical game codes can represent distinct authored
builds. Preserve that distinction in clones, comparisons, and fingerprints now.
Avoid using code equality to deduplicate profiles or persisting derived ranks to
make comparisons easier. Named builds and complete-build transfer UI can then
extend the existing document contract without undoing this milestone's model.

## Acceptance requirements for the merged draft

| Ticket | Retain | Add or correct before execution |
| --- | --- | --- |
| BW-1901 | SOL's identity, target, precedence, cap, and lifecycle contracts. | One wire shape; exact bounds and canonical ordering; effect-specific strength types; unknown/ambiguous mode and purchased-rank outcomes. |
| BW-1902 | SOL's Build-only migration and complete clone/recovery matrix. | Equivalent-profile fingerprint tests; missing v3 field rejection; explicit old-reader protection; planner/caller and no-op semantics for hidden equipment actions. |
| BW-1903 | Shared preview, capped/uncapped math, independent effects, permanent-boundary regressions. | Unresolved progression/inherent output, unsupported purchased ranks, off-profession catalog views, incomplete split/catalog cases, and projection reuse boundary. |
| BW-1904 | 126 mappings/30 verified local assets, provenance, bounded offline-testable acquisition. | Missing mapping versus broken image tests; achievable publication/failure guarantees; runtime-only URL checks. |
| BW-1905 | Primary-only controls, rank-zero edits, blue resolved increases, accessible breakdown. | Explicit inherit reset, inherited labels, orphaned override recovery, global radio identity/focus behavior, and health-penalty source text. |
| BW-1906 | SOL's automatic/requested/active lifecycle and external Refrain rules. | Count visible with outer Attributes collapsed; no-target and cap-clipped count fixtures; off/on strength retention; UI disclosure must not dirty state. |
| BW-1907 | Transactional import, base-only code/files, complete-document retention. | Remove title ranks from game content; preserve existing mode context and exact-source unresolved evidence; assert successful Save retains settings and failed/canceled writes do not rename or discard them. |
| BW-1908 | SOL's full browser/evidence gate plus `npm run verify` and `git diff --check`. | Use actual execution paths, a production build/preview for final browser evidence, and concise durable results; remove redundant complete-suite reruns unless changes or failures justify them. |

The merge should close these technical assumptions within the accepted scope.
They require concrete contracts and evidence, not another human planning round.
