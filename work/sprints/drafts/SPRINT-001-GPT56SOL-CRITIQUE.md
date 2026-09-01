# Combined Critique: SPRINT-001 Project Foundation

## Executive Assessment

Both drafts agree on the correct product boundary: establish a runnable local TypeScript/React application, isolate framework-neutral domain code, reserve data-ingestion locations, preserve ticket automation, and defer feature work.

The principal conflict is architectural: GPT-5.5 proposes a single-package npm application, while GPT-5.4 proposes a pnpm workspace with `apps/web` and `packages/domain`. These approaches cannot be casually merged. The final sprint should explicitly choose one based on near-term reuse needs.

GPT-5.5 is the more proportionate and internally coherent foundation for the repository’s current size. GPT-5.4 contributes stronger phase-level verification, stricter package-boundary thinking, Node pinning, and a useful closeout phase. Neither draft fully resolves runtime schema evolution, reproducible clean-checkout validation, fixture semantics, or the lifecycle of generated/source data.

## GPT-5.5 Draft

### Strengths

- Clearly limits the sprint to foundation work and repeatedly guards against parser, ingestion, validation, storage, sharing, and UI scope creep.
- Separates fixtures, source snapshots, generated data, ingestion scripts, domain code, and UI code by trust and lifecycle.
- Treats domain and data boundaries as framework-neutral without prematurely introducing a backend, database, monorepo, or cloud dependency.
- Provides a comprehensive file inventory and verification surface, including lint, typecheck, tests, build, and existing Python automation.
- Explicitly acknowledges unresolved source licensing, domain-model uncertainty, generated-data policy, and local-storage timing.
- Includes practical security constraints for remote access, raw HTML, secrets, and future untrusted inputs.

### Weaknesses

- The initial domain inventory is too broad for a foundation sprint. Defining `Rune`, `Insignia`, armor, weapon modifiers, equipment templates, parties, guides, and multiple identifier categories before ingestion and compatibility work risks making guesses look authoritative.
- “Use React + Vite + Vitest unless implementation discovers a blocking constraint” allows an executor to change a foundational choice without requiring an explicit decision record.
- The storage boundary says an abstraction “may” be defined, leaving implementers without a firm scope decision.
- `npm run verify` is not precisely defined. The draft alternates between including Python automation and documenting it separately, so there may be no single authoritative repository-wide success command.
- “Models are documented or stubbed” and “representative model construction” are weak acceptance criteria. They do not prove serializability, import boundaries, or compatibility with future generated data.
- Creating or updating the final sprint document from within the sprint is self-referential. The artifact promotion and later status-update lifecycle should be defined before execution.
- Ticket responsibilities differ from the other draft, increasing the chance of inconsistent ticket history if tickets are created before the plan is finalized.

### Gaps in Risk Analysis

- No strategy exists for schema versioning or migration of checked-in fixtures, generated catalogs, template-compatible structures, or future browser storage.
- TypeScript types alone cannot validate JSON or imported data at runtime. The draft does not say whether runtime schemas are deferred or whether model definitions must remain plain-data compatible.
- The extraction cost of moving `src/domain` into a shared package later is not discussed. Import-direction rules, path aliases, and forbidden dependencies should preserve that option.
- Source-snapshot size, Git growth, retention, refresh cadence, and generated-data commit policy remain largely unresolved.
- Dependency reproducibility is incomplete: `npm install` is specified instead of `npm ci`, and the Node version policy is still an open question.
- Browser support, ESM conventions, and jsdom-versus-browser smoke-test limitations are not addressed.

### Missing Edge Cases

- A clean checkout under the wrong Node version.
- Domain objects containing non-JSON-safe values that later break persistence, import/export, or URL sharing.
- Fixtures with missing provenance, unknown identifiers, optional fields, or duplicate IDs.
- Accidental React or browser imports entering `src/domain`.
- An app smoke test that renders but never proves the app can consume the domain boundary.
- A development-server acceptance check that hangs or depends on manual inspection.
- Ticket or ledger initialization when files already exist or contain prior rows.

### Definition of Done Completeness

The Definition of Done is broad but needs sharper evidence:

- Require `npm ci`, not merely `npm install`, in a clean checkout.
- Pin or constrain Node before declaring installation reproducible.
- State exactly what `npm run verify` executes.
- Add an explicit lint acceptance criterion.
- Require the app to import and render a small synthetic domain object.
- Require domain structures to be plain-data/JSON-compatible, or explicitly defer that constraint.
- Replace “documented or stubbed” with concrete exported types and enforced import boundaries.
- Define how `npm run dev` is verified without an indefinitely running manual step.
- Separate sprint completion from creation of the sprint artifact itself.

## GPT-5.4 Draft

### Strengths

- Uses clear phases with verification attached to each phase, making execution and failure isolation easier.
- Makes the web application consume sample domain data, which provides stronger evidence of the intended dependency direction than an isolated domain test alone.
- Calls for strict TypeScript and a framework-free domain package.
- Pins the expected Node LTS rather than leaving the environment entirely implicit.
- Provides an explicit ledger header and a closeout phase that reconciles tickets, sprint status, and the epic.
- Correctly defers CSS frameworks, service workers, backend code, auth, cloud synchronization, and external UI kits.
- Identifies package proliferation as a risk and constrains the proposed workspace to two members.

### Weaknesses

- A “pnpm workspace with one shared `package.json`” is underspecified and potentially contradictory. Workspace members normally need their own package manifests, and `pnpm --filter @build-wars/web` requires `apps/web/package.json` to declare that exact name.
- The Files Summary omits `pnpm-lock.yaml` and member package manifests, both of which are essential to the proposed architecture.
- The workspace choice adds project references, package exports, module resolution, test discovery, and build-order complexity without demonstrating an immediate second consumer of the domain package.
- Fixtures for a “valid build,” “invalid template,” and “rule-edge case” are semantically premature when template codecs and rule evaluation are explicitly out of scope. There is no implementation capable of defining or testing validity.
- Validation-message types may prematurely establish a rule-engine API before the rule engine is designed.
- `pnpm validate` is not defined precisely, while Python verification is deliberately separate. Contributors therefore still need multiple commands to establish repository health.
- The final `work/sprints/SPRINT-001.md` artifact is absent from the Files Summary and Definition of Done.
- “EPIC-00 can be marked done, or any remaining gap is captured” weakens completion: documenting an incomplete requirement should not itself satisfy the sprint Definition of Done.

### Gaps in Risk Analysis

- Package export strategy, TypeScript project references, source-versus-built imports, circular dependency prevention, and Vite/Vitest workspace configuration are not addressed.
- pnpm availability and version pinning are omitted. A Node LTS pin does not ensure contributors use the same pnpm version; `packageManager` metadata or Corepack policy is needed.
- Public API evolution for `packages/domain` is not considered. Packaging provisional types can make them appear more stable than intended.
- Generated-data scale, schema versioning, deterministic regeneration, and whether generated outputs are committed remain unresolved.
- Source-snapshot licensing, retention, revision identity, and repository growth are not covered.
- Rendering sample domain data in the initial UI could encourage premature UI dependence on provisional model fields.

### Missing Edge Cases

- Workspace filters failing because package names or manifests do not match the commands.
- `pnpm install` succeeding locally but failing with a frozen lockfile in a clean environment.
- Root tests failing to discover either domain or web tests.
- ESM/export mismatches between Vite and the domain package.
- A supposedly “valid” fixture becoming invalid once actual rules are implemented.
- Ledger timestamp format and timezone ambiguity.
- Existing sprint or ledger entries being duplicated during initialization.
- Domain types passing compilation without being serializable or safe for future persisted data.

### Definition of Done Completeness

The Definition of Done is structured but has material holes:

- Add `pnpm-lock.yaml`, member manifests, a pinned pnpm version, and a frozen-lockfile clean-install check.
- Define the exact contents of `pnpm validate`.
- Add linting or explicitly explain why it is deferred.
- Require domain-specific tests, not only exported types and app smoke coverage.
- Remove “valid,” “invalid,” and “rule-edge” fixture requirements until the corresponding semantics exist.
- Include creation or promotion of `work/sprints/SPRINT-001.md`.
- Replace the optional epic-completion criterion with a hard sprint acceptance boundary; incomplete work should fail or be formally removed from sprint scope.
- Verify that the domain package is consumable through its declared public exports, not through workspace-relative source paths.

## Cross-Draft Contradictions

| Decision              | GPT-5.5                             | GPT-5.4                                   | Merge Recommendation                                                     |
| --------------------- | ----------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| Repository topology   | Single package                      | pnpm workspace                            | Choose one explicitly; do not create a hybrid                            |
| Package manager       | npm                                 | pnpm                                      | Prefer existing repo convention; otherwise npm is lower-cost for one app |
| Domain location       | `src/domain`                        | `packages/domain`                         | Use `src/domain` unless another runtime consumer is planned soon         |
| Canonical validation  | `npm run verify`                    | `pnpm validate` plus separate Python test | Define one repository-wide command and its exact subprocesses            |
| Ticket mapping        | Scaffold first, domain third        | Workspace first, domain second            | Freeze one stable ticket-to-deliverable mapping                          |
| Fixture scope         | Minimal typed or synthetic examples | Valid/invalid templates and rule edges    | Keep only semantics that can be tested during this sprint                |
| Node policy           | Open question                       | Pin Node LTS                              | Pin or constrain Node in the final sprint                                |
| UI proof              | Minimal shell                       | Read-only domain rendering                | Render one synthetic domain object without adding feature UI             |
| Ledger                | General baseline                    | Exact header and lifecycle                | Verify the exact schema against ticket automation before codifying it    |
| Final sprint artifact | Explicitly required                 | Missing from outputs                      | Define promotion and update lifecycle explicitly                         |
| Domain breadth        | Large concrete model inventory      | Smaller packaged public API               | Keep a narrow plain-data core and defer uncertain fields                 |
| Python verification   | Possibly included in `verify`       | Separate command                          | Prefer a single top-level repository verification command                |

## Merge Recommendations

Use GPT-5.5 as the structural base unless a second application, CLI, worker, or independently versioned consumer of the domain layer is already expected in the next few epics. A folder boundary can be extracted later with less cost than maintaining a premature workspace. If near-term reuse is confirmed, adopt GPT-5.4’s workspace fully—including member manifests, package exports, project references, lockfile, and pinned pnpm version.

The merged sprint should:

1. Select one topology and package manager as an explicit, non-overridable sprint decision.
2. Adopt GPT-5.4’s phase-level verification and closeout structure.
3. Pin Node and the package-manager version; validate a clean, lockfile-enforced install.
4. Define one canonical repository command that runs lint, typecheck, tests, build, and existing ticket-burn tests.
5. Keep the domain model minimal and plain-data-oriented. Brand identifiers and define provenance, but defer detailed equipment, rule, and parser semantics.
6. Prove dependency direction by rendering one synthetic domain object in the app and enforcing that domain code cannot import React or browser APIs.
7. Replace valid/invalid template and rule fixtures with foundation-level cases: optional fields, unknown provenance, distinct ID categories, and JSON round-tripping.
8. Document minimum future data contracts: provenance fields, schema-version ownership, deterministic generation expectations, and source/generated retention policy.
9. Freeze the BW-0001 through BW-0005 responsibility mapping before creating tickets.
10. Define how the approved draft becomes `work/sprints/SPRINT-001.md`, when ledger rows are created, and which status transitions occur during closeout.
11. Remove permissive completion language. Unfinished acceptance criteria should keep the sprint incomplete unless scope is formally amended.
12. Record unresolved architectural decisions with an owner and target epic rather than leaving them as unbounded open questions.

## Unresolved Assumptions Requiring Resolution

- Whether the domain layer will have more than one real consumer soon enough to justify a workspace.
- Which package manager, Node version, and lockfile behavior are repository policy.
- Whether generated data will be committed or rebuilt, and how schemas will be versioned.
- Whether raw snapshots belong in Git at all once their size and licensing characteristics are known.
- The exact provenance fields required before ingestion starts.
- Whether future persistence requires every domain object to be directly JSON-serializable.
- The authoritative ledger schema and supported ticket-burn test invocation.
- The distinction between a sprint plan artifact, its execution-time status updates, and closeout records.
