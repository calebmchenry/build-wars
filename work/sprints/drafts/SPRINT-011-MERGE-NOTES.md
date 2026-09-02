# SPRINT-011 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-011-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-011-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-011-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-011-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-011-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-011-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-011-GPT54-CRITIQUE.md`

## Operational Notes

- `SPRINT-011` is the next sprint because `work/sprints/ledger.tsv` lists
  `SPRINT-001` through `SPRINT-010` as completed and no `SPRINT-011.md` existed
  before planning.
- The installed Codex CLI is `codex-cli 0.152.0`. `codex exec --help` does not
  expose `--full-auto`, so the resolved lane command used the current
  non-interactive automation flag:
  `codex exec --dangerously-bypass-approvals-and-sandbox -m <model> -c 'model_reasoning_effort="xhigh"'`.
- All three draft lanes and all three critique lanes produced markdown
  artifacts. The `gpt-5.6-sol` draft child wrote a complete artifact and then
  remained alive without modifying the artifact; that post-artifact process was
  terminated after the normal wait window so no child session remained running.
- The interview is skipped under the non-interactive ticket-burn contract. No
  high-risk architecture choice blocks planning because EPIC-10 extends the
  existing source-policy and catalog-ingestion architecture.
- Planning modified sprint, draft, ticket, ledger, and manifest records only.
  No application implementation code was modified and no commit was created.

## Accepted

- Use the `gpt-5.6-sol` draft as the architecture baseline because it made the
  hardest decisions explicit: modifier-ID identity, bounded hybrid source
  authority, effect-level stacking, headgear as a handoff field, and production
  promotion gates.
- Use the `gpt-5.4` and `gpt-5.5` critiques to simplify phase presentation,
  add a source-shape checkpoint before contract freeze, and separate
  phase-local verification from final promotion verification.
- Keep EPIC-10 as one ticket-burn sprint because BW-1001 through BW-1006 are
  groomed and dependency ordered. The sprint explicitly allows a blocked
  outcome at promotion if live source acquisition or review cannot complete.
- Anchor v1 accepted rune identity to unique verified equipment-template
  modifier IDs through `templateModifierId`. If a player-usable armor rune lacks
  a unique modifier ID, production promotion blocks.
- Keep compact `sourceSet` and runtime-relevant `dispositions` in the runtime
  catalog because that matches the promoted EPIC-04 skill catalog pattern. Full
  source plans, child snapshot paths, review records, QA findings, and release
  gates stay in the manifest or QA report.
- Store stacking per effect and require duplicate attribute-rune fixtures that
  prove rank suppression does not erase health penalties.
- Keep damage and condition rune semantics structured only when source-clear.
  Ambiguous behavior remains `note-only`, `unknown`, or QA/disposition data.
- Keep `src/app` unchanged. The sprint validates runtime safety through domain
  and generated contract tests instead of adding an unused app import.
- Treat shared source-plan/snapshot-set refactoring as optional. Any reuse must
  preserve EPIC-04 behavior and bytes under tests; otherwise EPIC-10 uses
  isolated helpers.

## Rejected Or Adjusted

- Rejected using a single record-level `stackable` boolean. Composite rune
  effects need different stacking rules on the same record.
- Rejected deriving `RuneId` from array order, file order, API order, or display
  names.
- Rejected hand-authored production JSON. Production artifacts must be generated
  from reviewed source inputs.
- Rejected adding runtime app wiring, equipment UI, local-library schema
  changes, template semantic import, remote icon fetching, or full stat
  calculation in this sprint.
- Adjusted the source-authority language so the bounded hybrid is the default
  and a Phase 1 checkpoint can block or amend before schema freeze.
- Adjusted the runtime/audit critique. Moving all source accounting out of
  runtime would diverge from existing EPIC-04 practice, but detailed operational
  evidence still belongs outside the runtime catalog.
- Adjusted the production-promotion requirement to be explicit: fixture/offline
  implementation can land without current live access, but completion cannot.

## Local Feasibility Notes

- `src/domain/ids.ts` already defines `RuneId` and
  `TemplateEquipmentModifierId`.
- `src/domain/equipment.ts` already exposes `ArmorPiece.runeId`, so EPIC-10 can
  remain a catalog/data sprint without changing armor UI.
- `src/domain/catalog.ts` currently has only a lightweight `Rune` interface;
  adding `CatalogRuneRecord` beside it matches the existing `Skill` versus
  `CatalogSkillRecord` split.
- `scripts/data/build_wars_ingest/profiles.py`, `pipeline.py`, `skill_catalog.py`,
  and EPIC-04 tests provide the closest source-plan, offline replay, semantic
  version, and exact-path promotion precedent.
- `.gitignore` already uses exact allowlists for EPIC-03 and EPIC-04 generated
  artifacts, so EPIC-10 should follow the same parent-unignore pattern.
- `npm run verify` is the canonical offline repository gate. Live source
  refresh must remain separate from default verification.

## Interview

Interview skipped under the non-interactive ticket-burn contract.

## Final Assumptions

- EPIC-10 can be planned as one sprint because BW-1001 through BW-1006 are
  groomed, ready, and dependency ordered.
- The existing EPIC-02/03/04 ingestion and catalog patterns are the right
  architecture for runes; no new scraper, runtime fetch path, or app
  architecture is needed.
- V1 accepted rune records require unique verified equipment-template modifier
  IDs. If source discovery disproves that assumption, promotion blocks for
  amendment.
- Production promotion requires live source qualification, selected offline
  replay, review capacity, and passing gates. Fixture data alone is not
  production data.
- Planning may update sprint, draft, ticket, ledger, run-state, and
  result-manifest records, but it must not modify implementation code or create
  a commit.
- Final approval is auto-granted because `work/sprints/SPRINT-011.md` is
  internally consistent, executable, and bounded by phase gates.
