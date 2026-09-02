# SPRINT-007 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-007-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-007-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-007-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-007-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-007-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-007-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-007-GPT54-CRITIQUE.md`

## Accepted

- Use the pure-domain boundary shared by all drafts: EPIC-06 lives in `src/domain`, accepts
  caller-supplied semantic catalog facts, and does not import UI, storage, network, generated audit
  artifacts, data scripts, or template compatibility.
- Use GPT-5.6 Sol's richer contract model: segment-array paths, typed locations, plural related
  entities, domain-owned rule IDs, deterministic ordering, catalog-version evidence, and explicit
  truncation/exhaustiveness state.
- Accept the critiques' recommendation to separate legality, completeness, resolution, and workflow
  policy. The final plan keeps `valid` but defines it only as no errors and adds `complete`,
  `resolved`, and `exhaustive`.
- Use GPT-5.4/GPT-5.5's more executable module decomposition and verification cadence: contract,
  context, profession/attribute rules, skill-bar rules, skill eligibility, rank calculator, then
  fixtures/docs/closeout, with `npm run verify` at each implementation phase.
- Accept stricter catalog ambiguity handling from GPT-5.6 Sol and the critiques: duplicate catalog
  keys are reported and excluded from resolved lookup instead of first-record-wins behavior.
- Use a mandatory generated runtime catalog smoke test, while keeping correctness fixtures small and
  offline.
- Adopt a conservative budget policy: automatic budget applies only to PvE level-20
  maximum-applicable quest assumptions. PvP and unknown mode require explicit budget policy before
  overspend is judged.
- Treat repeated resolved player-usable skill IDs as errors, while avoiding guessed duplicate
  verdicts for unresolved/dispositioned/non-player records and using warnings where support/special
  metadata is insufficient.
- Keep `calculateEffectiveAttributeRank` independent from `ValidationResult`; validation may call it
  internally later, but a mandatory calculations payload is not part of this MVP.
- Keep validation context internal to the MVP. Public runtime extension callbacks were removed.

## Rejected Or Adjusted

- Rejected string paths from the GPT-5.4 draft. Segment arrays are the domain contract because they
  avoid escaping and numeric-order ambiguity.
- Rejected singular `relatedEntity`; duplicate, split, budget, and conflict issues need arrays.
- Rejected `exportBlocked` as a domain result field. Export/publish policy belongs to callers and
  can choose whether warnings block.
- Rejected source-rule IDs tied to ticket IDs. Runtime rule IDs are domain-owned; ticket IDs remain
  planning traceability only.
- Rejected public `extensionRules` or callback-based validation in the MVP because purity and
  deterministic execution cannot be enforced through arbitrary caller functions.
- Rejected public export of `createBuildValidationContext` from `src/domain/index.ts` unless
  implementation proves an immediate external caller needs it.
- Adjusted GPT-5.6 Sol's numeric future rule bands into static internal order. The final sprint
  documents future domains without freezing a public plugin or band system.
- Adjusted title/allegiance handling to warn only from explicit catalog facts and leave enforcement
  to EPIC-15.
- Adjusted process closeout into Phase 7 so implementation acceptance remains focused on engine
  behavior while ticket/ledger/run records stay traceable.

## Valid Critiques Incorporated

- Add `complete`, `resolved`, and `exhaustive` to avoid overloading `valid`.
- Add result/rule-engine versioning and truncation signals.
- Require generated catalog smoke compatibility instead of making it optional.
- Add no-mutation, catalog reorder, duplicate catalog key, invalid option, runtime malformed-shape,
  issue-cap, and multi-rule collision tests.
- Avoid severity in issue sort because severity can be policy-sensitive.
- Keep messages deterministic but non-normative.
- Define cascade suppression around unresolved professions, malformed ranks, duplicate attributes,
  unresolved/dispositioned skills, and malformed skill bars.

## Local Feasibility Notes

- Existing `src/domain/build.ts` already provides `Build`, `GameMode`, `SkillBar`, and the
  eight-slot constant needed by the engine.
- Existing `src/domain/catalog.ts` already provides EPIC-03 and EPIC-04 semantic catalog contracts,
  including attribute point rules, classifications, mode availability, split groups, and
  dispositions.
- Existing `src/domain/catalog-lookup.ts` provides lookup helpers and attribute budget helpers that
  EPIC-06 can reuse without importing runtime data files.
- Existing ESLint and TypeScript boundaries already protect `src/domain`; the implementation should
  continue using those checks rather than introducing a new dependency.
- EPIC-06's seven BW tickets are already groomed and form a coherent single sprint.

## Interview

Interview skipped under the non-interactive ticket-burn contract. The remaining choices are resolved
with conservative defaults in the final sprint, and no high-risk architecture decision requires
routine user confirmation.

## Final Assumptions

- `SPRINT-007` is the next sprint because `SPRINT-001` through `SPRINT-006` exist in the ledger as
  completed and no `SPRINT-007.md` existed before this planning pass.
- EPIC-06 can be executed as one sprint because BW-0601 through BW-0607 all share the same domain
  rule-engine boundary and have clear dependencies.
- Planning may update sprint, draft, ticket, ledger, run state, and result-manifest records, but it
  must not modify application implementation code or create a commit.
- The generated EPIC-03 and EPIC-04 runtime catalog shapes are available for smoke tests, while
  correctness tests should use small local fixtures.
- Later equipment/title/allegiance domains should add built-in rule modules after their catalogs and
  authored models exist; this sprint should not invent those schemas.
