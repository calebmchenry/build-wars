# SPRINT-013 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-013-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-013-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-013-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-013-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-013-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-013-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-013-GPT54-CRITIQUE.md`

## Operational Notes

- `SPRINT-013` is the next sprint because `work/sprints/ledger.tsv` lists
  `SPRINT-001` through `SPRINT-012` as completed.
- The installed Codex CLI is `codex-cli 0.152.0`. `codex exec --help` does not expose
  `--full-auto`, so all draft and critique lanes used:
  `codex exec --dangerously-bypass-approvals-and-sandbox -C /Users/calebmchenry/code/build-wars -m <model> -c 'model_reasoning_effort="xhigh"'`.
- All three draft lanes and all three critique lanes produced markdown artifacts.
- The interview is skipped under the non-interactive ticket-burn contract. No high-risk
  architecture choice blocks planning because EPIC-12 extends the existing source-policy and
  catalog-ingestion architecture with explicit Phase 1 blocker gates.
- Planning modified sprint, draft, ticket, ledger, and manifest records only. No implementation code
  was modified and no commit was created.

## Accepted

- Use `gpt-5.6-sol` as the primary architecture baseline: source authority, registry-backed public
  IDs, tagged facts, runtime/audit separation, release-set integrity, exact promotion, security, and
  Definition of Done depth.
- Use the `gpt-5.4` and `gpt-5.5` critiques to simplify execution sequencing, keep module ownership
  cleaner, and prefer a narrow EPIC-12 dual-output implementation over broad generic ingestion
  refactoring.
- Keep two runtime catalogs and six exact promoted files. A combined artifact is not an in-flight
  executor option for this sprint.
- Freeze the profile ID as `epic-12-weapons-and-mods` to avoid drift between drafts.
- Require shared `catalogSetVersion`/`catalogSetDigest`, counterpart digest checks, and
  all-or-nothing promotion across both catalogs.
- Use `WeaponBaseCatalog` and `WeaponModCatalog` as the public generated-catalog vocabulary.
- Use schema-owned `WeaponId` and `WeaponModifierId` registries. Raw template item/modifier IDs are
  crosswalk facts and lookup inputs, not public identity.
- Use tagged damage, requirement, applicability, lookup, compatibility, and effect states. `null`
  must not carry multiple meanings.
- Keep compatibility structural and pairwise. It checks static base/mod facts only and returns
  `compatible`, `incompatible`, or `indeterminate`.
- Keep template mapping additive. EPIC-12 adds pure lookups and tests around decoded raw IDs, but
  does not add a broad semantic equipment-template resolver or change EPIC-05 codec fidelity.
- Adopt the detailed QA, retention, security, and worktree checks from the stronger drafts.

## Rejected Or Adjusted

- Rejected allowing Phase 1 to collapse the two catalogs while later phases assume six exact files.
  Material artifact changes block for a future amendment.
- Rejected a generic multi-artifact platform refactor as mandatory. Profile-specific dual output is
  the default unless a small shared helper is lower risk and regression-covered.
- Rejected a separate `unsupported` lookup result alongside `dispositioned`; unsupported and
  historical states are disposition/crosswalk payloads.
- Rejected a primitive weapon shape with nullable `damageMin`, `damageMax`, or requirement fields.
  Shields, focuses, missing facts, and not-applicable facts need tagged states.
- Rejected interpreting missing applicability as universal compatibility.
- Rejected using requirement completeness or effect interpretability to decide structural
  base/modifier compatibility.
- Rejected offhand/two-handed loadout validation and duplicate active modifier evaluation in the
  helper; those require weapon-set state and belong downstream.
- Rejected source broadening, cap raising, dependency additions, runtime imports, or template-codec
  changes as non-interactive executor discretion.

## Local Feasibility Notes

- `src/domain/ids.ts` already defines `WeaponId`, `WeaponModifierId`,
  `TemplateEquipmentItemId`, and `TemplateEquipmentModifierId`.
- `src/domain/equipment.ts` already exposes lightweight `Weapon`, `WeaponModifier`, and `WeaponSet`
  authored-build placeholders. No equipment schema/UI churn is needed for the catalog sprint.
- `src/domain/catalog.ts` already contains generated catalog patterns for skills, runes, and
  insignias. Weapon base/mod records can follow that split while preserving lightweight existing
  interfaces.
- `src/domain/catalog-lookup.ts` already has known/ambiguous/dispositioned/unknown patterns for
  skills, runes, and insignias.
- `src/template-compatibility/equipment-template.ts` is already raw and exact-source oriented. EPIC-12
  should test around it, not import catalogs into it.
- `scripts/data/build_wars_ingest/profiles.py`, `pipeline.py`, `source_set_protocol.py`,
  `rune_source_set.py`, `insignia_source_set.py`, `rune_catalog.py`, and `insignia_catalog.py`
  provide the closest implementation precedents.
- `.gitignore`, `data/generated/README.md`, and `data/qa/README.md` already use exact promoted-path
  exceptions for prior catalogs.
- `npm run verify` is the canonical offline gate. Live source refresh remains explicit and outside
  default verification.

## Interview

Interview skipped under the non-interactive ticket-burn contract.

## Final Assumptions

- EPIC-12 can be planned as one sprint because BW-1201 through BW-1207 are groomed, ready, and
  dependency ordered.
- The existing EPIC-02/03/04/10/11 ingestion and catalog patterns are the right architecture for
  weapons and mods; no new scraper, runtime fetch path, app architecture, or external integration is
  needed.
- The default bounded source authority starts with `Equipment template format`, `Weapon`,
  `Weapon upgrade`, `Inscription`, explicitly planned detail/mechanics pages, metadata-only
  `imageinfo`, and the promoted EPIC-03 catalog.
- Separate weapon and weapon-mod catalogs are preferable for v1, but they must promote as one
  release set with counterpart integrity checks.
- Production promotion requires live source qualification, selected offline replay, review capacity,
  exact-path allowlisting, and passing gates. Fixture data alone is not production data.
- Planning may update sprint, draft, ticket, ledger, and result-manifest records, but it must not
  modify implementation code or create a commit.
- Final approval is auto-granted because `work/sprints/SPRINT-013.md` is internally consistent,
  executable, and bounded by phase gates.
