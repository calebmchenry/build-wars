# SPRINT-001 Combined Critique

Reviewed drafts:

- [SPRINT-001-GPT56SOL-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:1)
- [SPRINT-001-GPT55-DRAFT.md](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:1)

Intentionally not reviewed: `work/sprints/drafts/SPRINT-001-GPT54-DRAFT.md`.

`GPT56SOL` is the stronger execution base. It is significantly better on sequencing, dependency ordering, verification rigor, and Definition of Done completeness. `GPT55` contributes a simpler narrative and useful prompts about unresolved decisions, but it leaves too many implementation-shaping choices open for an executable sprint.

## GPT56SOL Critique

**Strengths**

- Sequencing is mostly executable: scaffold, then domain, then data/fixtures, then documentation and closure, with phase acceptance criteria at each step ([Phase 1](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:212), [Phase 2](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:234), [Phase 3](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:256), [Phase 4](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:275)).
- Dependency boundaries are concrete and enforceable, not just folder conventions. The draft explicitly calls for ESLint restrictions and a DOM-free domain tsconfig ([Architecture](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:114), [Enforcement](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:124), [Domain phase](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:237)).
- Verification is layered well: one authoritative command, split `domain` and `web` test projects, final Python automation test, and a runtime dependency audit ([Outcome](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:36), [Testing architecture](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:167), [Final verification](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:281)).
- The Definition of Done is unusually complete for a foundation sprint and closes the loop on security, traceability, and explicit non-goals ([DoD](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:342)).

**Weaknesses**

- The draft requires tickets to have explicit dependencies, but it never states the actual dependency graph. The ordering is inferable from phases, but the sprint should still name the dependencies directly for ticket-burn execution ([Bookkeeping](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:207)).
- Final verification is strong but still somewhat indirect for docs and ignore rules. It does not explicitly require re-running the documented clean-checkout flow after docs are updated, or checking that ignored data directories still keep policy `README.md` files tracked ([Data policy](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:157), [Docs/verify phase](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:277)).
- A few completion criteria are subjective rather than mechanically auditable, especially the requirement that no cloud/account capability is “implied” by the shell or docs ([Security DoD](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:389)).

**Gaps In Risk Analysis**

- No explicit risk is called out for `.gitignore` negation mistakes accidentally hiding tracked policy files in ignored data directories.
- No explicit risk is called out for boundary leakage through path aliases or accidental JSON/data imports into browser code despite the intended architecture.
- The draft correctly notes that compile-time types are not runtime validation, but the completion criteria could be clearer that malformed external JSON remains intentionally unhandled in this sprint ([Risk](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:404), [Open questions](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md:464)).

**Missing Edge Cases**

- Preservation of tracked `README.md` files inside ignored directories.
- Negative-path behavior for malformed serialized build data, especially wrong-length skill bars coming from non-TypeScript sources.
- Verification that browser code cannot reach `data/` through build-tool conveniences, not just conventional imports.

**Definition Of Done Completeness**

- Strong overall. The main improvement is to convert subjective security/documentation checks into observable commands or assertions.

## GPT55 Critique

**Strengths**

- The phase order is easy to understand at a high level: records, scaffold, domain, data, verification, documentation ([Implementation](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:115)).
- The draft keeps scope narrow around a local-only foundation and clearly defers major product capabilities ([Overview](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:7), [Storage boundary](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:99)).
- The open questions are honest about unresolved decisions instead of hiding them in vague prose ([Open questions](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:260)).

**Weaknesses**

- The stack choice is not actually settled. “React + Vite + Vitest unless implementation discovers a blocking constraint” makes the sprint branchy, while the files summary and commands assume that stack is fixed ([Primary decisions](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:12), [Stack](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:37)).
- Ticket decomposition and dependency ownership are muddy. The draft introduces five tickets ([Ticket boundary](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:105)), but architecture docs are deferred to Phase 6 and verification/docs are mixed together, so it is unclear when specific tickets can legitimately close.
- Verification is under-specified. `npm run verify` is named as the entrypoint, but the draft never locks what it must include. The DoD uses `npm install` instead of `npm ci`, omits lint and format gating, and does not require a final clean-checkout rehearsal ([Verify command](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:44), [Phase 5](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:155), [DoD](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:208)).
- Boundary enforcement is mostly aspirational. The draft states that domain code must not import React and raw snapshots must not flow into UI, but it does not require enforcement via linting, tsconfig separation, or test-project separation ([Package boundaries](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:62)).
- Path conventions are noisier than they need to be: `src/data/`, `scripts/data/`, `tests/`, and `fixtures/` all appear immediately, which increases the chance of misplaced artifacts before conventions are stable ([Layout](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:52)).

**Gaps In Risk Analysis**

- No explicit risks for single-package boundary erosion, lockfile drift, missing CI, or the gap between compile-time typing and runtime validation ([Risks](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:226)).
- The draft leaves room for “public compatibility strings” before `EPIC-01` settles source policy, which is a provenance/licensing risk it does not really contain ([Data boundary](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:97)).
- No reserved `data/qa/` location means later validation output has no defined home.

**Missing Edge Cases**

- Unknown numeric ID preservation.
- Exact eight-slot skill bar invariants.
- Schema version and catalog-version retention on authored documents.
- Ensuring generated data and raw snapshots cannot be consumed directly by browser code.
- Preventing fixture examples from being mistaken for canonical game data beyond a README warning.

**Definition Of Done Completeness**

- Incomplete for an executable sprint. It does not require reproducible install (`npm ci`), lint/format checks, boundary enforcement checks, security/network assertions, ticket status closure rules, or a final sprint artifact with no actionable unchecked items.
- “Domain model boundaries are documented or stubbed” is too weak and would allow completion without proving the boundary works ([DoD item](/Users/calebmchenry/code/build-wars/work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md:221)).

## Comparison

- `GPT56SOL` is materially better on sequencing discipline. It resolves more decisions up front and uses phase acceptance criteria to prevent premature closure.
- `GPT56SOL` is materially better on dependency ordering. `GPT55` implies order, but it does not tie ticket ownership, enforcement, and closure together tightly enough.
- `GPT56SOL` is materially better on verification. `GPT55` has the idea of a single entrypoint, but not the rigor needed to make it authoritative.
- `GPT55` is simpler and more readable, but that simplicity comes from deferring decisions that the execution plan actually depends on.

## Merge Recommendations

- Use `GPT56SOL` as the primary base for phase structure, acceptance criteria, verification strategy, risk framing, and Definition of Done.
- Add an explicit ticket dependency graph to the merged draft instead of relying on implied phase order.
- Keep one authoritative verification command, but define its contents concretely and verify it from a clean checkout after documentation is updated.
- Add an explicit check that ignored data directories still preserve tracked policy `README.md` files.
- Resolve convention conflicts before merge: `check` vs `verify`, four tickets vs five, `tools/data` vs `scripts/data`, and `test/fixtures` vs `fixtures`.
- If any `GPT55` open question survives into the merged draft, either answer it now or convert it into an explicit deferment. Open questions about Node pinning, fixture format, and `verify` scope should not remain unresolved in an executable sprint.
