# SPRINT-010 Combined Critique

Reviewed only the `GPT56SOL` and `GPT55` drafts, as requested.

## GPT56SOL draft ([SPRINT-010-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-010-GPT56SOL-DRAFT.md:19))

**Strengths**
- The sequencing is mostly execution-ready: storage/ports, then hydration/autosave, then record lifecycle, then library discovery, then sharing, then backup/restore, then closeout. That is the right dependency spine for a local-first feature set.
- Dependency boundaries are explicit and disciplined. The draft keeps persistence in `src/app`, preserves `src/domain` and `src/template-compatibility` boundaries, and names prior-epic prerequisites clearly.
- Verification is the strongest part of this draft. The phase-level commands, manual reload/viewport/keyboard checks, protected-path scans, and final `npm run verify` make it much harder for subtle regressions to slip through.
- The Definition of Done is close to production-grade. It covers failure modes, recovery constraints, privacy/security exclusions, accessibility, and closeout hygiene, not just happy-path features.

**Weaknesses**
- Freshness and validation are sequenced too late. Phase 4 already needs freshness/validation summaries, and Phase 5 row sharing depends on the same record rehydration/export rules, but the draft still puts “finalize” freshness/validation work in Phase 7 (Phase 4/5 at lines 545-679 versus Phase 7 at lines 681-742). That invites rework.
- Phase 3 is overloaded. It mixes record semantics, dirty-state/replacement guards, modal extraction, focus behavior, and immediate-write-failure handling (lines 500-543). That is too much cross-cutting work in one phase, and a UI refactor problem could block core persistence semantics.
- The document repeats the same rules across Architecture, Implementation, DoD, Risks, and Open Questions. That makes the plan precise, but also increases drift risk once implementation forces even one rule change.
- Startup share precedence is explicit, but user impact is still underspecified. The draft says a valid share takes precedence after hydration (lines 221-223, 326-335), but it does not cleanly resolve what happens to an existing autosaved draft beyond “the share wins.”

**Gaps in risk analysis**
- No dedicated risk for browser API quirks or fallback behavior around `clipboard`, `history.replaceState`, `pagehide`, or missing `crypto.randomUUID()`, even though the plan depends on those degrading safely.
- No explicit risk for the Phase 4/5 to Phase 7 dependency leak around freshness/validation.
- No explicit risk for the product-level consequence of opening a share URL when `localStorage` already contains a different draft.

**Missing edge cases**
- Boot via share URL while a different autosaved draft already exists: replace, warn, preserve elsewhere, or require an explicit choice.
- Restore behavior while the workspace is already `write-blocked` or in `conflict`.
- Failure behavior if share import succeeds but fragment consumption or clipboard write fails.
- Capability fallback when UUID or clipboard APIs are unavailable.

**Definition of Done completeness**
- Strong overall.
- It still needs an explicit acceptance criterion for startup share versus existing draft behavior.
- It should also define exactly how a protected `write-blocked` or `conflict` state becomes writable again.
- One browser-capability fallback criterion would make the graceful-degradation claims testable instead of implied.

## GPT55 draft ([SPRINT-010-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-010-GPT55-DRAFT.md:20))

**Strengths**
- The macro sequencing is sound: storage contract, autosave, saved-record lifecycle, library UI, sharing, backup/restore, then freshness/docs.
- The architecture boundary is correct. Persistence stays in `src/app`, the domain/template layers stay clean, and raw template overlay/source preservation is treated as a first-class requirement.
- The shorter Definition of Done is easy to scan and less likely to drift than a very large spec.

**Weaknesses**
- The implementation section is too compressed to drive execution safely. Each phase is only a sentence or two (lines 76-104), so critical dependencies are left implicit: workspace state composition, replacement guards, startup share ordering, restore preview invalidation, modal reuse, and multi-tab conflict handling.
- Verification is materially under-specified. There are no phase-level test commands, no fake-timer or Strict Mode guidance, no keyboard/viewport matrix, and no protected-path review. A final `npm run verify` alone is not enough for this sprint.
- Some file decisions stay ambiguous in ways that weaken dependency ordering, such as whether `ShareControls` is new or folded into `TemplateDialogs.tsx` and whether `editor-state.ts` changes are actually needed.
- The DoD is too short for the failure surface involved. It misses write-lock/conflict behavior, unsaved-work replacement guards, share-fragment consumption rules, restore-preview staleness, and accessible narrow-screen behavior.

**Gaps in risk analysis**
- Missing multi-tab/conflict risk.
- Missing risk for share fragment reapplication on refresh or share import replacing a recovered draft.
- Missing restore-preview staleness risk.
- Missing unsaved-work loss risk across load/import/restore flows.
- Missing localStorage size/performance and accessibility-regression risks.

**Missing edge cases**
- Valid envelope with invalid draft, and partial recovery that must lock writes.
- Duplicate names/content, missing association on update, and associated-record deletion preserving the draft.
- Autosave timer races, React Strict Mode double effects, and `pagehide` flush behavior.
- Oversized or lossy share fallback, invalid/unknown fragments left untouched, and copy-denied behavior.
- Replace from a declared-nonempty but all-invalid backup.
- Keyboard/focus behavior for narrow-screen library and modal flows.

**Definition of Done completeness**
- Adequate for high-level scope, not adequate for execution control.
- It needs explicit criteria for write-lock/conflict handling, startup share behavior, replacement guards, restore preview invalidation, accessibility, and browser fallback behavior before it should be used as the implementation source of truth.

## Comparison and merge recommendations

- `GPT56SOL` is the stronger draft by a large margin. It is far better on dependency ordering, verification strategy, and DoD completeness, and it is the better base for the merged sprint.
- `GPT55` is still useful as the compression layer. Its overview, phase summary, and shorter DoD are easier to scan and would make a merged draft easier to maintain.
- The merged draft should keep `GPT56SOL`’s architecture, phase gates, verification plan, risks, security constraints, dependencies, and DoD.
- The merged draft should borrow `GPT55`’s concision by trimming repeated invariants from the phase task lists and keeping one authoritative rule set in Architecture plus DoD.
- Re-sequence freshness/validation so the minimum primitives land before or inside Phase 4, not first in Phase 7.
- Add one explicit merged decision that neither draft fully closes: what happens when a startup share URL is opened while a different autosaved draft already exists.
- Add one explicit merged recovery rule: which user actions can clear `write-blocked` or `conflict` state and restore normal persistence.