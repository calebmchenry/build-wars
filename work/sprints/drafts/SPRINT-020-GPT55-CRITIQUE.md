# SPRINT-020 Combined Critique

Reviewed drafts:

- `work/sprints/drafts/SPRINT-020-GPT6ASTRA-DRAFT.md`
- `work/sprints/drafts/SPRINT-020-GPT56SOL-DRAFT.md`

Allowed feasibility context inspected: EPIC-19, `compendium/attribute-adjustments.md`, `AGENTS.md`, and relevant source/data paths for Build schema, persistence, selectors, equipment rank helpers, template import/export, focused attribute UI, asset policy, and promoted catalogs.

## Executive Recommendation

Use **GPT56SOL as the primary merge base**, but merge several important constraints and phrasings from **GPT6ASTRA** before executing. GPT56SOL is stronger as an implementation sprint because it is more executable: it turns BW-1901 into code-backed contracts, enumerates persistence/copy paths deeply, gives ticket-specific DoD, and ties asset/browser evidence to concrete commands and files. GPT6ASTRA is stronger at a few correctness boundaries: scoped unresolved legacy equipment, no-selected-loadout mutation guards, concise delivery boundary, and the warning that missing real assets/browser evidence leaves gates open rather than becoming a substitute acceptance.

The final sprint should keep the ticket DAG from EPIC-19 exactly:

1. BW-1901 contracts/source fixtures.
2. BW-1902 Build v3 and durable persistence/copy graph.
3. BW-1903 shared preview/effect projection.
4. BW-1904 rune assets, allowed after BW-1901 and possibly parallel with BW-1902/BW-1903, but gated before BW-1905.
5. BW-1905 inline equipment/rank UI.
6. BW-1906 advanced effect UI.
7. BW-1907 game-template and full-document boundaries.
8. BW-1908 final automated verification, actual browser/file evidence, docs, and closeout.

The final merged plan should avoid hard-coded runner artifact paths, unnecessary document churn, and any wording that marks acceptance complete without real browser or verified asset evidence.

## Source Feasibility Notes

- The current domain `Build` is schema v2 and does not yet carry adjustment state. `createBlankBuild`, persistence `cloneBuild`, and `cloneBuildForBuildSetEntry` all explicitly enumerate fields, so both drafts are correct that v3 must be wired through constructors, validation, and clone/materialization before UI authoring.
- `persistence-schema.ts` validates exact object topology, migrates older outer envelopes, and recursively validates build-set/party snapshots. A Build-level schema bump without an outer local-library or transfer-envelope bump is feasible, but only if every nested `Build` reader/cloner is updated.
- `composer-selectors.ts` and `editor-selectors.ts` currently assemble effective ranks separately from equipment helpers. `editor-selectors.ts` currently substitutes unresolved progression ranks with zero and lets any equipment unresolved reason null out inherent ranks. Both drafts correctly identify this as a shared-projection seam.
- `equipment-attribute-rank.ts` already has useful headgear/rune collection and highest-rune helpers, but it does not yet expose enough per-source replacement metadata for compact override precedence. The sprint must extend that boundary deliberately.
- Template import/export is base-only today. `projectEditorToSkillTemplate` projects professions, base attributes, and skills only; `applyTemplateImport` currently warns about equipment/title ranks only. BW-1907 must extend warnings/omission copy without changing codecs or adding prompts.
- The promoted catalogs support the fixed-effect registry. The checked skill catalog contains template IDs 198, 1951, 2094, 2139, 3054, and 3431 with the expected PvE/PvP/faction/split facts. The rune catalog contains 126 attribute-rune records for 42 attributes. Those records have 126 distinct `iconId`s, but resolving `remoteMedia` gives 30 unique URLs/SHA-1s/file titles, so the asset phase must prove dedup through media identity, not by counting icon IDs.
- The asset policy currently approves skill icons, not rune binaries. The rune plan needs an exact ADR/source-policy/`.gitignore` extension for the new EPIC-10 manifest and runtime paths.

## GPT6ASTRA Critique

### Strengths

- Strong scope discipline. The overview clearly keeps armor-slot management, named-library UI, new complete-build formats, sidecars, generic effect parsing, and combat simulation out of scope.
- Good user-facing scenario coverage. The use cases include zero-base equipment edits, inherited-rune replacement, capped Refrain examples, secondary-profession effects, same-primary no-op behavior, file preview isolation, and unknown rune recovery.
- Excellent handling of unresolved legacy equipment. Its rule that unknown inherited rune/headgear evidence affects only attributes that still inherit that source is more faithful to the accepted brief than treating unknown legacy evidence as a harmless zero.
- Good separation of rank contexts: base, equipment-adjusted preview, preview-effective, and permanent equipment validation. This maps well to the current repo split between template projection, equipment validation, and selector display.
- The projection section correctly calls out two current selector hazards: unresolved rank keys should be omitted instead of converted to zero, and unrelated equipment uncertainty should not poison all inherent ranks.
- Hidden armor invalidation is well specified, including old/new rune target union, no-op reset behavior, and unknown old/new target restraint.
- The browser acceptance matrix is concrete and correctly refuses to substitute jsdom/CSS inspection for actual browser evidence.

### Weaknesses And Risk Gaps

- The proposed state shape uses two top-level Build additions (`equipmentAttributeOverrides` and `assumedEffectOverrides`) rather than one canonical profile. That can work, but it is more likely to create partial-field migration and empty-state ambiguity than GPT56SOL's single nullable `attributeAdjustments` profile.
- BW-1901 is too document/fixture-heavy and delays the executable domain contract module until BW-1902. Because the persistence validator needs exact profile semantics, BW-1901 should create the contract module and contract tests before any Build v3 work begins.
- Asset work is serialized after BW-1903 even though BW-1904 only depends on BW-1901. The draft notes this, but the final plan should explicitly allow asset implementation/preflight to proceed as soon as the source matrix is frozen, while preserving the BW-1905 gate.
- Some implementation file naming is less cohesive than GPT56SOL. `attribute-preview-selectors` is a good name for projection adapters, but the authored mutation module is under-specified compared with GPT56SOL's separate catalog-free state reducer.
- DoD is strong globally but less ticket-specific. It is harder to use as a burn checklist than GPT56SOL's per-ticket DoD sections.

### Missing Edge Cases To Merge Or Tighten

- Exact v3 object topology should be explicit: dense arrays, exact key allowlists, duplicate rejection, malformed field rejection, and whole-build transactional failure.
- Add a Build v1/v2-to-v3 migration fixture matrix directly to BW-1901/BW-1902 instead of relying on prose.
- Add source-policy/ADR/`.gitignore` acceptance for rune binaries as a first-class asset gate, not just a file-summary item.
- Keep the no-selected-loadout workspace guard. GPT6ASTRA calls this out well; it should be mandatory for every new editor action.
- Specify that catalog filters and display text never affect effect inference, while mode/profession/skill-bar changes do.

### DoD Completeness

GPT6ASTRA's DoD covers the main epic outcomes and has a good final evidence standard. It is less complete as an execution checklist because it does not break DoD down by ticket and does not force the contract module/tests into BW-1901. It should be used as a compact acceptance summary, not as the final implementation plan.

## GPT56SOL Critique

### Strengths

- Best overall sequencing. Phase 0/BW-1901 creates the authored profile contract, effect registry, source IDs, target matrix, and fixtures before persistence, projection, assets, or UI consume them.
- The single nullable `Build.attributeAdjustments` profile is the cleaner schema choice. It gives one canonical empty state, one clone helper target, and one authored fingerprint boundary.
- Strong persistence/copy graph coverage. The draft names active/inactive build-set entries, party slots, saved records, backup/restore, build-set transfer, party transfer, autosave/pagehide, duplication, hydration, and corrupt/future write blocking.
- Strong consumer boundary. It identifies exactly where temporary preview ranks may flow (`composer-selectors`, `editor-selectors`, skill displays) and where they must not flow (permanent equipment validation, requirements, title ranks, codecs, share URLs).
- Strong asset pipeline. It includes exact count gates, SHA/URL/title dedup, local-only runtime paths, provenance, no partial writes, explicit live-network gating, package script/docs updates, and source-policy/ADR implications.
- Strong ticket-specific DoD. The BW-1901 through BW-1908 sections are directly useful for burn execution and review.
- The risks and security sections are unusually useful: they name double counting, schema overwrite, remote media, runtime hotlinking, file-system permissions, and manual evidence substitution.

### Weaknesses And Risk Gaps

- It is over-prescriptive in closeout. Hard-coding a burn-result path like `work/runs/ticket-burn/EPIC-19/20260914T004651Z/plan-EPIC-19-result.json` is brittle and should be replaced with "runner-owned burn result manifest." The final sprint should not bake in a timestamped run path.
- Phase numbering starts at "Phase 0" while EPIC-19 tickets are BW-1901 through BW-1908. This is easy to misread in execution. Use ticket names as the primary sequence and avoid offset phase numbers.
- Some closeout/docs scope is too broad. `work/roadmap.md`, `compendium/game-rule-engine.md`, and `compendium/runes-catalog.md` may be appropriate only if they already own this shipped behavior. Keep durable docs focused on accepted brief, template files, source policy/ADR, asset docs, and ticket/sprint evidence unless execution proves another doc must change.
- It risks expanding library/comparison internals. `library-selectors.ts` and `build-set-comparison.ts` should be changed only if existing comparison/empty-build construction would otherwise lose or hide adjustment state. No new library UI or comparison feature should slip in.
- Its unresolved legacy equipment policy is weaker than GPT6ASTRA's. "Unknown legacy evidence grants no rank" can become misleading if inherited unknown gear might apply to a primary attribute. The final plan should instead adopt scoped uncertainty: unknown inherited evidence makes only potentially affected inherited attributes unresolved until an explicit override resolves that source.
- It mentions no new browser-automation dependency, which is reasonable, but the final verification plan should still require durable evidence artifacts rather than relying on ad hoc manual claims.

### Missing Edge Cases To Merge Or Tighten

- Add GPT6ASTRA's explicit no-selected-loadout mutation guard to BW-1902/BW-1905/BW-1906, including hidden editor actions.
- Add GPT6ASTRA's "actual browser access and real rune image acquisition are execution dependencies" language to every affected gate.
- Tighten file-preview isolation to say future skill-detail reuse must receive the candidate file's imported editor state, never current editor projection.
- Make same-primary no-op checks cover both reducer return identity and absence of compact cleanup.
- Preserve explicit "None" versus "inherit" in every replacement warning/copy path, not just persistence.

### DoD Completeness

GPT56SOL has the better DoD structure. It is complete enough to execute after trimming brittle closeout paths and doc sprawl, and after replacing the unknown-legacy policy with GPT6ASTRA's scoped uncertainty. Its per-ticket DoD should be the final sprint's checklist.

## Concrete Merge Decisions

1. **Use GPT56SOL as the base document.** Keep its one nullable `attributeAdjustments` profile, per-ticket DoD, risk/security sections, source/catalog fixtures, asset pipeline, and detailed verification plan.
2. **Merge GPT6ASTRA's scoped unresolved legacy-equipment policy.** Unknown inherited rune/headgear evidence should not be silently treated as zero. It should make only potentially affected inherited sources unresolved; explicit compact overrides resolve only their addressed source.
3. **Merge GPT6ASTRA's no-selected-loadout guard.** Every new adjustment action and hidden equipment action must no-op when there is no selected editable loadout.
4. **Keep BW-1901 executable.** Create the domain contract/effect registry and tests in BW-1901, not just docs and fixtures. Also record HEAD/catalog versions, source-access status, and browser/file capability preflight.
5. **Allow BW-1904 asset work after BW-1901.** It may run in parallel with BW-1902/BW-1903, but BW-1905 cannot mount rune controls until verified local runtime assets and fallback behavior exist.
6. **Do not hard-code runner run IDs.** Replace timestamped burn paths with runner-owned sprint/ticket/ledger/result-manifest updates.
7. **Trim doc scope.** Update only durable docs needed to describe shipped mounted behavior, template omission/replacement, source policy/ADR, asset provenance, and explicit deferrals.
8. **Keep template compatibility base-only.** Adjustment edits must change authored dirty state but not exact-source replay, canonical code, share payloads, or `.txt` bytes. Existing warning copy should be extended; no new prompt should be added.
9. **Preserve projection ownership.** One projection should feed focused rows, skill catalog rows, skill bar, tooltip text, descriptions, and Expertise/Mysticism/Fast Casting facts. Title ranks, permanent equipment validation, requirements, point costs, and template export stay outside it.
10. **Final verification must include actual evidence.** Automated unit/type/build/data checks are necessary but insufficient. BW-1908 remains open unless real browser, missing-asset, persistence/isolation, and disposable-folder/fallback evidence are recorded with screenshots or observable artifacts.

## Final Suggested Sprint Shape

- **BW-1901:** Freeze exact authored profile, effect registry, source IDs, target matrix, rune media dedup facts, hidden-action address contract, and unresolved policy in domain code/tests plus the accepted brief. Preflight browser/file/source/media access.
- **BW-1902:** Bump Build to v3, migrate v1/v2 neutrally, validate exact profile topology, add catalog-free mutations, wire clone/materialization/persistence/backup/transfer/party paths, and prove dirty scope.
- **BW-1903:** Implement shared projection, contribution replacement, bounded effects, cap/explanation, scoped diagnostics, and selector integration. Remove unresolved-to-zero display fabrication.
- **BW-1904:** Build verified local rune asset cache with exact policy exceptions, 126-to-30 mapping, local-only runtime paths, provenance, fallback, and no partial writes.
- **BW-1905:** Mount rune/headgear controls and accessible rank breakdown without changing base allocation behavior.
- **BW-1906:** Mount assumed effect controls from the projection, including automatic/manual/reset/inactive/Refrain lifecycle and count.
- **BW-1907:** Prove game import/export/save/load/share/preview/full-document boundaries and add concise omission/replacement copy.
- **BW-1908:** Run final focused suites, `npm run verify`, `git diff --check`, real browser matrix, disposable Skills-folder/fallback checks, docs, and runner-owned closeout.

No human scope questions remain; the merge work is about preserving the stronger execution structure while correcting the few places where the drafts differ on uncertainty, guards, and closeout discipline.
