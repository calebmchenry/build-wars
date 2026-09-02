# Sprint 009 Intent: Core Build Editor

## Seed

Create a sprint from `work/tickets/08-core-build-editor/EPIC.md` for the ticket-burn `EPIC-08`
run.

Automation contract:

- Mode: ticket-burn
- Source target: EPIC-08
- Source epic: EPIC-08
- Sprint directory: `work/sprints`
- Draft artifacts directory: `work/sprints/drafts`
- Source epic path: `work/tickets/08-core-build-editor/EPIC.md`
- Non-interactive planning; skip routine interview unless a high-risk architecture choice appears
- Auto-approve if the sprint is internally consistent and executable
- Do not modify application implementation code during planning and do not commit

The final sprint must be executable, update planning records, and write
`work/runs/ticket-burn/EPIC-08/20260902T154644Z/plan-EPIC-08-result.json`.

## Context

- Build Wars is a local-first React/Vite TypeScript app. `src/app` owns browser UI, `src/domain`
  owns framework-neutral contracts and validation, `src/template-compatibility` owns template codec
  calls, `data/generated` contains promoted runtime catalog JSON, and `work/tickets` plus
  `work/sprints` track ticket-burn planning.
- `SPRINT-001` through `SPRINT-008` are completed in `work/sprints/ledger.tsv`; the next sprint ID
  is `SPRINT-009`.
- EPIC-03 and EPIC-04 promoted runtime-eligible professions/attributes and skills catalog JSON, but
  `src/app` does not yet import them. EPIC-08 needs one app-side boundary before leaf UI components
  display catalog facts.
- EPIC-05 provides skill template decode/export, exact-source preservation, canonical encode proof,
  chat-wrapper parsing, and unresolved template ID lookup helpers. EPIC-08 owns user-facing
  import/export dialogs, not local library persistence.
- EPIC-06 provides `validateBuild` and `calculateEffectiveAttributeRank`. EPIC-08 owns validation
  presentation and export policy wiring, while later epics own equipment, title, hero, party, and
  guide validation.
- EPIC-07 published `compendium/visual-prior-art.md` as development-reference-only UI evidence for
  the core editor, including explicit gaps for keyboard focus, responsive behavior, loading/error,
  search/filter states, inline validation, and dialog overflow.

## Recent Sprint Context

- `SPRINT-005` made structured-only skill data and renderer-neutral tooltip facts available while
  keeping copied prose and media policy-gated.
- `SPRINT-006` isolated the pinned `@buildwars/gw-templates@1.1.1` dependency behind
  `src/template-compatibility` and deferred paw-ned2/team support to EPIC-17.
- `SPRINT-007` established rule-engine result semantics where `valid`, `complete`, `resolved`, and
  `exhaustive` remain separate from caller export/publish policy.
- `SPRINT-008` documented visual prior art but deliberately did not implement UI, import runtime
  media, or prescribe pixel-perfect dimensions.
- The latest commit is `debd343 Groom EPIC-08 core build editor`, which created ready BW-0801
  through BW-0808 tickets for this epic.

## Relevant Codebase Areas

- `src/app/App.tsx`, `src/app/App.test.tsx`, and `src/app/styles.css` currently contain a minimal
  accessible app shell and empty eight-slot rail.
- `src/domain/build.ts` defines `Build`, `GameMode`, `SkillBar`, `AttributeAllocation`, and
  `SKILL_BAR_SLOT_COUNT`.
- `src/domain/catalog.ts` and `src/domain/catalog-lookup.ts` define promoted catalog contracts,
  template crosswalk lookups, name lookups, skill lookup, mode variant resolution, purchased rank
  cost, and attribute budget helpers.
- `src/domain/rule-engine.ts`, `src/domain/validation-context.ts`, and `src/domain/validation.ts`
  expose deterministic validation results and location/path-bearing issues.
- `src/domain/effective-attribute-rank.ts` and `src/domain/skill-tooltip.ts` provide effective-rank
  calculation and skill tooltip text projection.
- `src/template-compatibility/skill-template.ts` provides skill template decode/export and
  `resolveSkillTemplateDocument`.
- `data/generated/epic-03/professions-attributes.catalog.json` and
  `data/generated/epic-04/skills.catalog.json` are the only promoted runtime catalog JSON files
  EPIC-08 should import.
- `compendium/professions-and-attributes.md`, `compendium/skills-catalog.md`,
  `compendium/template-compatibility.md`, `compendium/game-rule-engine.md`,
  `compendium/visual-prior-art.md`, and `compendium/source-policy.md` define the boundaries EPIC-08
  must respect.

## Constraints

- Follow `AGENTS.md`: keep human-facing updates concise and direct.
- Planning may modify sprint, draft, ticket, ledger, run-state, and manifest files only; it must not
  modify application implementation code or create a commit.
- Runtime app code may import only the promoted catalog JSON files from EPIC-03 and EPIC-04, and
  only through one app-side catalog boundary. Leaf UI components must not import `data/generated/**`
  directly.
- App code must not import generated manifests, QA reports, source plans, raw snapshots, Python data
  tooling, wiki APIs, or remote media bytes.
- Source-derived catalog facts require visible attribution before they are shown. Remote wiki icon
  URLs are not fetched automatically in EPIC-08; stable placeholder icon slots are required.
- EPIC-08 is in-memory only. Local library persistence, migrations, tags, favorites, backup/restore,
  and share URLs belong to EPIC-09.
- Title-rank controls, title ownership, allegiance side, runes, insignias, weapons, armor,
  equipment-derived ranks, hero/party builds, guide authoring, and cross-build search remain later
  epic scope.
- Imported templates must preserve unresolved raw IDs and support exact-source re-export while
  semantically unchanged.
- Desktop-browser usability is primary, but narrow screens, keyboard focus, loading, empty, error,
  and dialog overflow states are EPIC-08 implementation requirements.
- `npm run verify` is the canonical validation command.

## Success Criteria

- `SPRINT-009` covers BW-0801 through BW-0808 in dependency order and can be implemented without
  another planning decision.
- A user can create, edit, validate, import, and export a playable single-character skill bar in
  memory.
- Profession, mode, attribute, skill browser, skill-bar, tooltip, template, and validation surfaces
  consume shared editor state and app catalog views without bypassing domain/template boundaries.
- Catalog attribution is visible and remote icon URLs are not fetched by default.
- Unknown or stale imported profession, attribute, and skill IDs remain representable until the user
  explicitly replaces or clears them.
- Dynamic skill text reflects authored effective attribute ranks, and title-scaled text uses the
  documented max-title-rank display assumption until EPIC-15.
- Pointer and keyboard flows are usable for the core desktop editing path, and layout does not rely
  on hard-coded screenshot dimensions.
- Planning records, tickets, ledger, and manifest agree on source target, source epic, sprint ID,
  and assumptions.

## Verification Strategy

- Reference implementation: no single code reference implementation exists. Correctness is defined
  by the groomed BW-0801 through BW-0808 tickets, prior sprint compendium notes, public domain and
  template APIs, and the EPIC-08 Done When criteria.
- Spec/documentation: `work/tickets/08-core-build-editor/EPIC.md`,
  `compendium/professions-and-attributes.md`, `compendium/skills-catalog.md`,
  `compendium/template-compatibility.md`, `compendium/game-rule-engine.md`,
  `compendium/visual-prior-art.md`, and `compendium/source-policy.md`.
- Edge cases identified: null professions, unknown mode, PvE/PvP split skills, primary-only
  attributes, inaccessible imported attributes, empty skill slots, unresolved raw template IDs,
  dispositioned skills, duplicate or elite/PvE-only validation issues, long template names/codes,
  invalid wrappers, no-result filters, missing tooltip progression values, title-rank dependencies,
  placeholder icon slots, keyboard-only slot operations, narrow screens, dialog overflow, and
  non-blocking unresolved imports.
- Testing approach: focused pure tests for catalog boundary views and editor state helpers,
  app/component integration tests for profession/attribute/browser/bar/dialog/validation workflows,
  source-scan checks for forbidden imports, accessibility-oriented interaction tests for keyboard
  alternatives and dialogs, and final `npm run verify`.

## Uncertainty Assessment

- Correctness uncertainty: Medium - the domain/template primitives are established, but EPIC-08 must
  combine them into a larger app workflow with many in-progress states.
- Scope uncertainty: Medium - the tickets are groomed and bounded, but the feature surface is broad
  enough that implementation must protect against EPIC-09, EPIC-15, equipment, party, and guide
  creep.
- Architecture uncertainty: Medium - the app-side catalog boundary and editor state architecture are
  new, but they extend clear existing module boundaries and do not require a high-risk external
  integration decision.

## Open Questions

1. What exact app module split best keeps the catalog boundary, editor reducer, selectors, and UI
   components testable without over-abstracting a still-small app?
2. How should unresolved imported raw template IDs be represented in editor state so exact-source
   re-export remains possible until semantic edits occur?
3. What is the minimum visible attribution treatment before source-derived names and facts appear in
   the editor?
4. Which skill browser filters can be implemented from the current EPIC-04 catalog fields without
   inventing data or blocking on later content?
5. What export policy should the UI apply when `validateBuild` reports warnings, unresolved facts,
   proven errors, or lossy canonical encode failures?

