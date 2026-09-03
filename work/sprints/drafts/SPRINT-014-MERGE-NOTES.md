# SPRINT-014 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-014-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-014-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-014-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-014-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-014-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-014-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-014-GPT54-CRITIQUE.md`

## Operational Notes

- `SPRINT-014` is the next sprint because `work/sprints/ledger.tsv` lists
  `SPRINT-001` through `SPRINT-013` as completed and no final `SPRINT-014.md` existed before this
  planning pass.
- The installed Codex CLI is `codex-cli 0.152.0`. `codex exec --help` does not expose `--full-auto`,
  so all draft and critique lanes used:
  `codex exec --dangerously-bypass-approvals-and-sandbox -C /Users/calebmchenry/code/build-wars -m <model> -c 'model_reasoning_effort="xhigh"' -o <artifact>`.
- All three draft lanes and all three critique lanes produced markdown artifacts.
- The interview is skipped under the non-interactive ticket-burn contract. No high-risk
  architecture choice blocks planning because EPIC-13 extends existing domain and validation
  boundaries without new external integrations.
- Planning modified sprint, draft, ticket, ledger, run-state, and manifest records only. No
  implementation code was modified and no commit was created.

## Accepted

- Use the `gpt-5.6-sol` draft as the base because it gives the strongest treatment of semantic
  boundary, validation semantics, issue ordering, catalog-view behavior, and closeout gates.
- Keep `gpt-5.4`'s sequencing concern: prove `Build.equipment` compatibility early and keep
  regression checks close to the contract migration rather than delaying them until closeout.
- Keep `gpt-5.5`'s scope clarity and concise phrasing where possible.
- Introduce `EquipmentLoadout` as the preferred semantic authored type while retaining
  `EquipmentTemplate` as a temporary compatibility alias if needed.
- Preserve `equipment: null` as valid existing state and distinguish it from an authored empty
  loadout.
- Remove numeric base armor rating from the merged v1 plan. EPIC-13 has no source-policy-backed
  consumer for armor totals, so base armor remains deferred.
- Store only semantic catalog selections and explicit unresolved placeholders in authored
  equipment. Raw template item/modifier IDs, color IDs, skins, dyes, acquisition facts, and copied
  catalog records remain out of scope.
- Integrate equipment validation with the existing `ValidationIssue` and `ValidationResult`
  contracts rather than creating a separate result type.
- Use optional caller-supplied equipment catalog views. Structural validation can run without
  catalogs; catalog-backed checks emit unresolved outcomes only when selected equipment needs those
  views.
- Treat known unmet weapon requirements as advisory warnings, not equip-legality errors. Suppress
  false conclusions when rank-affecting equipment is unresolved.
- Keep local-library non-null equipment persistence, editor controls, app catalog wiring, and share
  omission presentation deferred to EPIC-14. EPIC-13 may make compile-only or rejection-path
  adjustments if the domain type migration requires them.

## Rejected Or Adjusted

- Rejected making app persistence accept non-null semantic equipment in this sprint. That would
  broaden EPIC-13 into EPIC-14's editor/persistence migration surface.
- Rejected keeping `armorRating` in the authored shell. It invites source-derived armor facts and
  full-stat aggregation before there is a validated consumer.
- Rejected storing headgear amount per build. The +1 adjustment is a fixed mechanical fact derived
  by a helper after the provenance gate passes.
- Rejected duplicating catalog-derived weapon handedness, equip role, modifier-slot compatibility,
  and requirement facts in authored state.
- Rejected treating missing catalog views as compatibility or legality success. Missing evidence
  means unresolved or non-exhaustive validation, not a green result.
- Rejected evaluating all future stat/effect totals. EPIC-13 owns loadout topology and validation
  handoffs only.

## Local Feasibility Notes

- `src/domain/equipment.ts` currently exposes a placeholder `EquipmentTemplate`, `ArmorPiece`, and
  `WeaponSet` shape. The sprint can replace this in place while preserving an alias for imports.
- `src/domain/build.ts` already carries `equipment` as nullable, so old null-equipment builds remain
  a clear regression target.
- `src/domain/catalog.ts`, `src/domain/catalog-lookup.ts`, `src/domain/rune-effects.ts`,
  `src/domain/insignia-effects.ts`, and `src/domain/weapon-mod-compatibility.ts` already provide the
  catalog records and narrow helpers EPIC-13 needs.
- `src/app/persistence-schema.ts` currently rejects persisted non-null equipment with
  `unsupported-equipment`. The final sprint preserves that behavior until EPIC-14 owns a durable
  non-null equipment migration.
- Existing tests under `test/domain`, `test/fixtures/rule-engine`, `src/app`, and
  `test/template-compatibility` provide enough precedent for focused EPIC-13 coverage.
- `npm run verify` remains the canonical offline closeout gate.

## Interview

Interview skipped under the non-interactive ticket-burn contract.

## Final Assumptions

- EPIC-13 can be executed as one sprint because BW-1301 through BW-1305 are groomed, ready, and
  dependency ordered.
- The existing domain and rule-engine architecture is the right home for the semantic equipment
  shell; no new app architecture, ingestion profile, runtime fetch path, or external dependency is
  needed.
- Fixed topology facts for five armor slots and four weapon sets can live in domain code.
- The headgear +1 attribute-rank fact can be validated against existing approved source-policy
  evidence during implementation; if not, BW-1302 blocks rather than guessing.
- EPIC-14 will own non-null equipment authoring, app catalog views, persistence migration,
  backup/restore behavior, validation presentation, and share-boundary UX.
- Planning may update sprint, draft, ticket, ledger, run-state, and result-manifest records, but it
  must not modify implementation code or create a commit.
- Final approval is auto-granted because `work/sprints/SPRINT-014.md` is internally consistent,
  executable, and bounded by phase gates.
