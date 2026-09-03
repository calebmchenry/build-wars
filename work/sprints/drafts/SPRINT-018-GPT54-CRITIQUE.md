# SPRINT-018 Draft Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-018-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-018-GPT55-DRAFT.md`

Artifact status:

- Both requested drafts were present.
- `work/sprints/drafts/SPRINT-018-GPT54-DRAFT.md` was intentionally not read.

## `SPRINT-018-GPT56SOL-DRAFT.md`

### Strengths

- The sequencing is the stronger of the two drafts. It freezes contracts and migration first, then isolates runtime state and durability before UI, then layers validation, then sharing and recovery, with explicit phase gates between each step (`611-711`, `713-829`).
- Dependency ordering is explicit where it matters most. The draft decouples persisted build-set snapshot versioning from the neutral domain contract and makes that parser/migration work a hard prerequisite for workspace behavior (`178`, `608-609`, `962-980`).
- Verification strategy is disciplined. Each phase has a focused test slice plus `typecheck`, and the closeout criteria add full verification, `git diff --check`, and manual smoke coverage across the risky user flows (`650-656`, `705-710`, `748-753`, `817-829`, `1037-1051`).
- The draft closes high-risk state holes instead of leaving them implicit. The zero-or-one-active-entry invariant, stale slot repair, duplication re-keying, no-write-on-read migration, and empty-slot action guards are all called out as requirements rather than assumptions (`627-648`, `953-980`).
- Definition of Done coverage is materially stronger than the shorter draft. It covers state repair, recovery, validation boundaries, transfer semantics, and regression expectations in a way that is actionable for implementation and review (`916-1051`).

### Weaknesses

- BW-1702 spans Phase 0, Phase 1, and Phase 2. The technical ordering is sound, but ticket ownership is slightly muddy because contract work, persistence work, and runtime state work all stay under the same ticket label. Add an explicit statement that BW-1702 does not close until Phase 2 finishes.
- Phase 5 is overloaded (`756-829`). It combines new party transfer code, multi-code projection, build-set transfer compatibility, backup/restore parity, library summaries/search, share control behavior, and App-level regression coverage. That is a lot of late-cycle integration surface in one phase.
- The draft is very thorough, but that thoroughness sometimes hides the critical path. The plan would be easier to execute if Phase 5 had an internal gate after parser/serializer reuse is proven and before library/search/share UI work starts.

### Gaps In Risk Analysis

- The risk table is strong on product and data-integrity risks, but it does not explicitly call out execution risk from concentrating so many persistence and sharing surfaces in Phase 5. A late parser drift between `party-transfer`, `build-set-transfer`, backup/restore, and library projections is one of the likeliest delivery risks here.
- Older-client behavior is described in the persistence section, but there is no explicit operational risk entry for shipping nested snapshot v2 into an environment where older builds may still read the same saved artifacts.

### Missing Edge Cases

- Comparison behavior is referenced in state cleanup and UI visibility (`120`, `637`, `683`, `953-954`), but the Definition of Done never makes comparison correctness in enabled party mode a first-class acceptance item. Add explicit coverage for comparison state when the selected slot is empty, cleared, deleted, or reordered.
- The draft should add one explicit verification case for import or restore where both `lastSelectedPartySlotId` and the comparison target are stale in the same payload. The pieces are present separately, but the combined repair path is not called out.
- The plan covers dormant annotations well, but it does not explicitly call for library summary or search behavior tests that distinguish enabled parties from disabled-but-retained annotations.

### Definition Of Done Completeness

- This is the more complete Definition of Done. It explicitly covers selected-slot durability, selection repair, duplication identity remaps, lossless recovery, bounded import behavior, and regression preservation for neutral flows (`953-980`, `1019-1051`).
- The main completeness gap is comparison behavior under party mode. Add at least one DoD bullet that comparison targeting remains deterministic and non-destructive across empty-slot selection, clear, delete, import, and restore.
- Add one closeout bullet that the Phase 5 sharing/recovery paths must be verified against the same canonical parser and serializer helpers, not merely shown to round-trip independently.

## `SPRINT-018-GPT55-DRAFT.md`

### Strengths

- The overall macro-order is reasonable: contracts and persistence shape first, workspace behavior next, validation after that, then sharing and closeout (`313-577`).
- The draft is easier to scan and likely easier to execute for a smaller team because it avoids the level of branching and sub-contract detail in the longer draft.
- It keeps the architecture boundary mostly clear: party semantics remain annotations over build sets, and validation stays separate from game-rule quality judgments (`120-154`, `241-312`).

### Weaknesses

- The largest sequencing problem is Phase 2 (`384-436`). It combines runtime state changes, materialization behavior, selectors, rendering, focus behavior, responsive layout, and App wiring in a single phase. That collapses the highest-risk dependency boundary in the sprint. State invariants should be proven before UI work starts.
- The persistence contract is under-specified and internally inconsistent. The contract shape still shows `PersistedBuildSetSnapshot.schemaVersion: 1` while adding `party`, but the parser notes immediately talk about accepting missing `party` from existing schema-2 data (`188-203`). That ambiguity weakens migration ordering and makes it harder to define exact verification expectations.
- Several core product decisions are still open at the end of the document (`757-778`). The optional-field versus wrapper-model question, destructive disable semantics, preset set, distinct export envelope, and empty-slot reload behavior are not minor details. They influence persistence, UI, and Definition of Done and should be closed before execution.
- The destructive-disable recommendation is materially weaker than the dormant-annotation approach in the other draft (`762-764`). It increases the chance of avoidable metadata loss and removes a useful recovery path without reducing much implementation complexity.

### Gaps In Risk Analysis

- The risk table never names the most dangerous state bug: empty-slot selection or placeholder-editor fallback overwriting a real inactive loadout.
- It also omits selection-divergence risk. There is no explicit risk for selected slot, selected entry, and downstream share/template targets drifting apart after clear, remove, import, or reload.
- There is no dedicated risk entry for duplication or restore re-keying across slot IDs, entry IDs, and nested build IDs.
- There is no explicit risk entry for the new party transfer path drifting away from the existing build-set transfer path in parser behavior, bounds checking, or diagnostics.

### Missing Edge Cases

- Empty selected-slot persistence is still an open question instead of a committed behavior (`774-775`). That is too central to leave unresolved because it affects reducer design, parser shape, and reload verification.
- The draft does not explicitly cover deterministic repair of selection and comparison state after clear, delete, shrink, import, restore, or stale persisted references.
- It does not spell out the no-phantom-editor invariant for empty slots. The tasks say empty selection clears selected-loadout actions, but the more dangerous failure mode is a placeholder editor being treated as a real member.
- It does not clearly cover disabled-versus-dormant party behavior in library summaries, search, restore, and transfer semantics because the draft still treats disable/delete behavior as unsettled.

### Verification Strategy

- Phase 2 verification is too light for the amount of behavior introduced. The tasks add `PartyWorkspace`, dialogs, keyboard flows, focus restoration, and responsive layout, but the verification list does not include dedicated component tests for those surfaces (`384-436`).
- Phase 3 relies in part on broad suite runs such as `npm run test:run -- src/app src/domain` (`472-475`). That is useful for regression coverage, but it is not a great diagnostic gate for a phase that is supposed to validate deterministic issue ordering and narrow rule boundaries.
- Final verification is weaker than the longer draft because it does not explicitly pull in `test/template-compatibility`, even though template behavior is a core dependency for member-level share and copy flows.

### Definition Of Done Completeness

- The DoD captures the broad feature shape, but it is missing several high-risk acceptance criteria that the longer draft makes explicit.
- It does not require durable selected-slot semantics, stale slot repair, deterministic comparison-target repair, or explicit no-phantom-editor behavior.
- It does not make duplication identity re-keying a first-class DoD requirement even though restore, copy, and duplication all depend on it.
- It is lighter on multi-code copy edge conditions. Oversized output handling, explicit available versus unavailable counts, and copy behavior when some members are lossy should be stated directly.
- Because disable semantics remain effectively unresolved, the DoD is weaker on recovery completeness than the GPT56SOL draft.

## Comparison

- `SPRINT-018-GPT56SOL-DRAFT.md` is the better execution draft. Its dependency ordering is clearer, its verification strategy is more granular, and its Definition of Done is much closer to implementation-ready.
- `SPRINT-018-GPT55-DRAFT.md` is easier to read, but it pays for that brevity by leaving important storage and workflow decisions unresolved and by merging the riskiest state and UI work into one phase.
- The biggest structural difference is that GPT56SOL separates contract and migration work from runtime state work, and runtime state work from UI work. GPT55 does not. For this feature, that separation matters because empty-slot semantics, no-active-entry behavior, and migration correctness are the highest-risk parts of the sprint.
- The biggest verification difference is that GPT56SOL uses targeted suites and gates for each layer, while GPT55 leans more on broad regression runs after large feature slices are already combined.
- The biggest Definition of Done difference is that GPT56SOL explicitly names selection repair, duplication re-keying, no-write-on-read migration, and lossless party recovery. GPT55 only implies several of those behaviors.

## Merge Recommendations

- Use `SPRINT-018-GPT56SOL-DRAFT.md` as the base draft.
- Keep the GPT56SOL phase split: contracts and migration first, runtime state and durability second, UI third, validation fourth, sharing and recovery fifth.
- Keep GPT56SOL's persisted snapshot v2 split and durable `lastSelectedPartySlotId` approach. The GPT55 persistence model is too ambiguous to serve as the final basis.
- Reject GPT55's destructive-disable recommendation. Retaining dormant annotations is safer and produces a cleaner reversible workflow.
- Add one internal gate inside GPT56SOL Phase 5 so parser and serializer parity across party transfer, build-set transfer, and backup/restore is proven before library/search/share UI work lands.
- Add explicit comparison-flow acceptance and test coverage to the merged DoD and verification plan. That is the main significant gap in the stronger draft.
- Borrow GPT55's concision where it improves readability, especially in the top-level architecture framing, but not at the cost of removing GPT56SOL's state, migration, and verification detail.
