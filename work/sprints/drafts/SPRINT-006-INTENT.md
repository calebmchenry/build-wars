# Sprint 006 Intent: Template Compatibility

## Seed

Create an executable sprint from `work/tickets/05-template-compatibility/EPIC.md` for ticket-burn
target `BACKLOG`, source epic `EPIC-05`.

Automation contract:

- Non-interactive planning mode.
- Use `work/tickets` and `work/sprints`.
- Write planning artifacts under `work/sprints/drafts/`.
- Create or update BW ticket files in `work/tickets/05-template-compatibility/` when useful for
  traceability.
- Update ticket planning records.
- Do not modify application code.
- Do not commit.
- Auto-approve the final sprint if it is internally consistent and executable.

EPIC-05 goal: support Guild Wars build-code formats players already use so Build Wars can import
from and export to the game and existing tools. The sprint should evaluate `@buildwars/gw-templates`,
support skill template import/export, support equipment template import/export, support chat-code
wrappers and template names, assess paw-ned2/team formats when feasible, and add fixture-based
compatibility tests.

## Context

- The repo is a private React/Vite/TypeScript app with framework-neutral domain contracts under
  `src/domain`; `src/domain` must not import React, DOM/browser APIs, browser storage, network
  clients, app modules, or data scripts.
- SPRINT-001 through SPRINT-005 are completed in `work/sprints/ledger.tsv`; `SPRINT-006` is the next
  planned sprint.
- EPIC-03 promotes `data/generated/epic-03/professions-attributes.catalog.json` with profession and
  attribute template crosswalks; EPIC-04 promotes `data/generated/epic-04/skills.catalog.json` with
  2,951 skills, 315 dispositions, known template skill IDs, and explicit unknown/dispositioned
  lookup outcomes.
- Existing lookup helpers already expose `lookupProfessionTemplateId`, `lookupAttributeTemplateId`,
  and `lookupSkillTemplateId`; `TemplateSkillId`, `TemplateProfessionId`, and
  `TemplateAttributeId` are distinct branded numeric types.
- `@buildwars/gw-templates@1.1.1` is available on npm, MIT licensed, and advertises skill,
  equipment, and paw-ned2 support. The published JS package exposes CJS/ES modules but does not
  advertise TypeScript declarations, so Build Wars should depend on it through a narrow local
  adapter after compatibility proof.

## Recent Sprint Context

- SPRINT-003 built the offline data ingestion spine, source snapshots, deterministic artifacts, QA
  report framework, and regeneration commands.
- SPRINT-004 promoted the professions/attributes catalog and established template profession and
  attribute crosswalk semantics.
- SPRINT-005 promoted the skills catalog, kept `SkillId` and `TemplateSkillId` distinct, and
  required downstream template import/export to preserve unknown authored IDs where practical.
- EPIC-06 and later UI epics expect imported builds to carry unresolved IDs safely so rule validation
  and editors can warn without losing user-authored data.

## Relevant Codebase Areas

- `src/domain/ids.ts` - branded catalog and template ID types.
- `src/domain/build.ts` - `Build`, `SkillBar`, `AttributeAllocation`, and `GameMode` contracts.
- `src/domain/equipment.ts` - current equipment template shape.
- `src/domain/catalog.ts` - EPIC-03 and EPIC-04 generated catalog contracts.
- `src/domain/catalog-lookup.ts` - template ID and name lookup helpers.
- `src/domain/source.ts` - authored document root, provenance, QA, and source policy contracts.
- `test/domain/contracts.test.ts` and `test/domain/skill-catalog.test.ts` - existing ID
  preservation and catalog lookup tests.
- `test/fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json` and
  `test/fixtures/data-ingestion/generated/fixture-skills.catalog.json` - stable catalog fixtures.
- `data/generated/epic-03/` and `data/generated/epic-04/` - runtime-eligible generated data.
- `work/tickets/05-template-compatibility/` - source epic and planned traceability tickets.
- `work/sprints/ledger.tsv` - sprint lifecycle record.

## Constraints

- Use `work/sprints`, not `docs/sprints`, for final and draft sprint artifacts.
- Planning may modify ticket/sprint/run records, but must not edit implementation code.
- Runtime app code must consume only promoted generated catalog JSON, not manifests, QA reports,
  snapshots, source plans, Python ingestion modules, or wiki APIs.
- Template decoding must preserve authored numeric IDs and template names/wrappers where practical;
  catalog incompleteness must not silently rewrite or drop unknown IDs.
- Do not hand-roll bitstream parsers until `@buildwars/gw-templates` has been evaluated with a
  pinned dependency, adapter boundary, type-safety plan, and fixture comparison.
- The implementation sprint should keep template compatibility in `src/domain` or a similarly
  framework-neutral adapter; UI import dialogs, local library persistence, sharing, and rule-engine
  validation belong to later epics.
- Equipment import/export can decode low-level template facts now, but full semantic equipment
  catalog joins are constrained because runes, insignias, weapons, mods, and armor content epics are
  not complete.

## Success Criteria

- The implementation sprint has clear BW ticket slices linked to EPIC-05 and `SPRINT-006`.
- Skill template imports decode professions, attributes, and eight skill slots into a Build Wars
  authored/template representation without losing unknown or dispositioned numeric IDs.
- Skill template exports round-trip known fixture builds and preserve canonical Guild Wars template
  codes or equivalent accepted encodings where the upstream library normalizes output.
- Chat-code wrappers parse and emit template names safely for supported skill/equipment codes.
- Equipment templates decode and re-encode through a bounded raw/normalized contract even when
  semantic equipment catalog records are not available yet.
- paw-ned2/team support is either implemented behind the same adapter boundary or explicitly
  dispositioned with follow-up tickets if the dependency shape, fixture availability, or scope is too
  large.
- Invalid codes fail with typed, useful errors instead of generic thrown exceptions leaking from the
  dependency.
- `npm run verify` and focused compatibility tests can prove the adapter, fixtures, and ticket-burn
  records are consistent.

## Verification Strategy

- Reference implementation: compare focused fixture results against `@buildwars/gw-templates@1.1.1`
  for decode/encode behavior before relying on any local wrapper.
- Spec/documentation: use Guild Wars skill/equipment template format expectations, package examples,
  EPIC-03 template crosswalks, and EPIC-04 skill template IDs as correctness references.
- Edge cases identified: invalid base64/template prefixes, chat code with missing name/code,
  duplicate or empty template names, profession `0`, unknown profession/attribute/skill IDs,
  dispositioned skill IDs, fewer/more than eight skill slots from malformed data, attributes from
  non-selected professions, package normalization that changes byte-equivalent encodings, equipment
  items without completed semantic catalogs, invalid item/mod/color IDs, and paw-ned2 unsupported
  charset or breaking-change headers.
- Testing approach: add focused Vitest tests under `test/domain` or `test/template-compatibility`
  using synthetic fixtures plus a small set of known real template codes; keep any source-derived
  fixture metadata within existing source-policy boundaries.
- Validation: `npm run typecheck`, focused Vitest compatibility tests, `npm run test:run`, and
  `npm run verify`.

## Uncertainty Assessment

- Correctness uncertainty: Medium - skill template semantics are well documented and the dependency
  exists, but package normalization, missing TypeScript types, and Reforged/catalog drift require
  compatibility proof.
- Scope uncertainty: Medium - skill templates and chat wrappers are bounded; equipment and paw-ned2
  can grow because semantic equipment catalogs are deferred.
- Architecture uncertainty: Medium - the repo already has plain-data contracts and template ID
  lookups, but the implementation must choose a durable adapter shape that keeps dependency quirks
  out of the core authored build model.

## Open Questions

1. Should equipment templates ship as raw codec support in this sprint even though equipment content
   catalogs are incomplete?
2. Should paw-ned2/team support be a completed feature or a formal feasibility spike with documented
   deferral criteria?
3. How should canonical export handle cases where `@buildwars/gw-templates` returns an equivalent
   but byte-different template code?
4. What minimum set of known real codes should become committed compatibility fixtures without
   pulling in source-derived prose or broader catalog data?
5. Should imported builds keep both raw template IDs and resolved catalog IDs, or should unresolved
   template IDs live in a dedicated import envelope until EPIC-06 and UI consumers decide display
   behavior?
