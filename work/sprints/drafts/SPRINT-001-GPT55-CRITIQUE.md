# SPRINT-001 Combined Critique

Reviewed artifacts:

- `work/sprints/drafts/SPRINT-001-GPT56SOL-DRAFT.md`
- `work/sprints/drafts/SPRINT-001-GPT54-DRAFT.md`

`work/sprints/drafts/SPRINT-001-GPT55-DRAFT.md` was not reviewed.

## GPT56SOL Draft

### Strengths

- Strong boundary discipline: `src/domain`, `src/app`, future `src/features`, future `src/adapters`, `tools/data`, and `data/*` responsibilities are clearly separated.
- Good restraint on product scope. It explicitly excludes ingestion, template codecs, rule validation, persistence, router, design system, backend, auth, analytics, PWA, and editor work.
- The domain model strategy is unusually concrete for a foundation sprint: JSON-compatible readonly data, numeric catalog IDs, authored string IDs, schema versions, eight skill slots, nullable absence, and unknown-ID preservation.
- Verification expectations are comprehensive: `npm ci`, `npm run check`, app smoke test, domain tests, fixture tests, ticket-burn tests, audit check, and lockfile use.
- The data lifecycle is well framed, especially the distinction between source snapshots, generated artifacts, QA output, and synthetic test fixtures.
- The single-package modular-monolith decision is justified with extraction triggers, which reduces premature workspace complexity.

### Weaknesses

- The sprint is very large for “Project Foundation.” It combines app scaffold, tooling, architecture docs, domain contracts, fixtures, data policy placeholders, ticket setup, audit checks, and sprint closeout. This creates a high chance of partial completion or rushed architecture.
- It over-specifies versions and future-current tooling assumptions: React 19, Vite 8, TypeScript 7, ESLint 10, Node 24 LTS. The draft treats these as settled rather than implementation-time compatibility decisions.
- The domain model surface may be too broad for sprint 1. Including `Profession`, `Attribute`, `Skill`, `SkillProgression`, `Rune`, `Insignia`, `ArmorPiece`, `Weapon`, `WeaponModifier`, `Build`, `EquipmentTemplate`, `PartyBuild`, and `Guide` risks encoding weak assumptions before source data and compatibility requirements are known.
- The decision to enforce architectural boundaries through ESLint and multiple tsconfigs is sound, but it adds hidden setup complexity and potential friction before there is much code to protect.
- `npm audit --omit=dev --audit-level=high` is not a strong control when almost all initial risk is likely in dev dependencies. The draft should clarify why runtime-only audit is sufficient for a static local app.
- “No `any` in domain code” may be too absolute if future unknown source payload handling or JSON parsing enters nearby code. It is fine for this sprint, but should be scoped to authored domain contracts.

### Gaps In Risk Analysis

- Missing fallback if selected major versions are not mutually compatible at execution time.
- Missing consideration of npm versus pnpm/workspace alternatives beyond a single-package justification.
- Missing risk that extensive domain types become pseudo-validation and mislead later implementers, despite noting TypeScript is not runtime validation.
- Missing risk that ticket/sprint automation requirements consume more effort than the app foundation itself.
- Missing risk that documentation becomes duplicative across README, compendium, tickets, sprint document, data READMEs, and decision records.
- Missing risk that `exactOptionalPropertyTypes` plus explicit `null` creates noisy models or awkward evolution patterns.

### Missing Edge Cases

- Unknown profession, attribute, rune, modifier, or equipment IDs, not only unknown skill IDs.
- Empty or duplicate authored IDs.
- Catalog version absent versus known versus stale.
- Invalid skill bar shapes loaded from JSON despite TypeScript tuple modeling.
- Fixture JSON serialization/deserialization boundaries, not just construction in TypeScript.
- Browser accidental imports from `data/source-snapshots`.
- Whether generated data belongs under `public/`, bundled assets, or runtime-loaded artifacts later.

### Definition Of Done Completeness

The DoD is strong and testable. It covers app/tooling, architecture, models, tests/data layout, documentation, traceability, and security.

Main concern: it is too broad. A foundation sprint that requires all model names, architecture docs, five-plus verification commands, data policy docs, tickets, ledger updates, audit checks, and sprint state transitions may become execution-heavy. Consider splitting “minimal runnable app plus verification” from “full domain/data boundary hardening” if time-boxing matters.

## GPT54 Draft

### Strengths

- Clear, shorter execution plan with sensible phases: traceability, workspace/toolchain, domain, web scaffold, fixtures/data/docs, closeout.
- Good separation between `apps/web`, `packages/domain`, `data/generated`, `data/source-snapshots`, `fixtures`, and `scripts/data`.
- Better acknowledges an architectural alternative by raising whether too many packages/workspaces might slow a small repo.
- Includes useful open questions around Python versus TypeScript tooling, template codec package placement, and PWA timing.
- The DoD is readable and likely easier to execute than the GPT56SOL draft.

### Weaknesses

- It assumes a pnpm workspace and split packages immediately, but does not justify why the repo needs workspace boundaries now.
- It pulls more feature-shaped material into the foundation than it admits: template-code strings, invalid template samples, rule-edge cases, validation message shapes, empty build helpers, and sample domain data rendering.
- `packages/domain` owning “validation message shapes” is premature. That starts to shape the rule engine before the rule engine epic.
- Rendering sample domain data in the web scaffold could encourage demo UI and domain coupling. A smoke test proving importability is enough.
- `fixtures/` at the repo root is less precise than `test/fixtures/`; it may blur test fixtures, source excerpts, generated artifacts, and compatibility samples.
- It has fewer concrete model invariants than GPT56SOL. It names model categories, but does not specify critical constraints like eight skill slots, unknown numeric IDs, schema versions, null versus optional fields, or no closed catalog enums.

### Gaps In Risk Analysis

- Missing explicit risk that workspace/package setup is premature for a single deployable.
- Missing risk that template and rule fixtures accidentally encode unsupported future behavior.
- Missing licensing/provenance detail for “minimal” template samples and rule-edge cases.
- Missing risk around package import cycles and duplicated tsconfig/build configuration.
- Missing risk that `pnpm validate` and Python ticket-burn checks form two separate verification contracts.
- Missing risk that sample domain data in UI becomes a product commitment.

### Missing Edge Cases

- Unknown catalog IDs and forward compatibility.
- Serialized malformed builds from external JSON.
- Schema versioning for authored documents.
- Null versus optional absence conventions.
- Eight-slot skill bar invariant.
- Catalog version/revision mismatch.
- Ensuring `packages/domain` is DOM-free through config, not only convention.
- Preventing app code from consuming raw snapshots directly.

### Definition Of Done Completeness

The DoD is good as a concise sprint checklist, but it is under-specified for architecture correctness. It does not require enforced dependency restrictions, DOM-free domain type checking, unknown-ID serialization tests, schema-version checks, or explicit no-feature guarantees around codecs/rules/storage.

It is more executable than GPT56SOL, but less protective against foundational mistakes.

## Comparison

GPT56SOL is stronger architecturally. It makes better choices around local-only scope, domain purity, data lifecycle, unknown IDs, serialization, explicit non-goals, and verification. Its main flaw is over-completeness: it may turn a foundation sprint into a large architecture implementation.

GPT54 is stronger as an execution outline. It is easier to follow and less burdensome, but it makes bigger assumptions: pnpm workspaces, early package split, template/rule fixtures, validation message shapes, and sample domain rendering. Those choices increase scope creep risk and should not be merged without justification.

## Merge Recommendations

- Prefer GPT56SOL’s single-package modular-monolith as the default unless there is a concrete second package/runtime need now.
- Keep GPT56SOL’s domain invariants: numeric catalog IDs, unknown-ID preservation, schema versions, eight nullable skill slots, JSON-compatible plain data, and no closed enums.
- Use GPT54’s clearer phase structure, but reduce it to four tickets unless the repo automation truly benefits from five.
- Do not seed template-code samples, invalid template samples, or rule-edge cases in Sprint 001. Reserve those for template and rule-engine epics.
- Do not put validation message shapes in the initial domain baseline unless the sprint explicitly includes validation services.
- Prefer `test/fixtures/` over root `fixtures/` for foundation fixtures.
- Keep `tools/data/` or `scripts/data/`, but choose one name and document why. `tools/data/` better signals non-runtime tooling.
- Keep the UI shell minimal. Do not render sample domain data unless the import boundary needs explicit proof.
- Add an implementation-time compatibility checkpoint for Node/package manager/tool versions instead of hard-coding aspirational current major lines.
- Tighten DoD around enforced architecture, but trim documentation volume so the sprint remains executable.
