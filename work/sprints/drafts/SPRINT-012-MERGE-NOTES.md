# SPRINT-012 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-012-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-012-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-012-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-012-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-012-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-012-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-012-GPT54-CRITIQUE.md`

## Operational Notes

- `SPRINT-012` is the next sprint because `work/sprints/ledger.tsv` lists
  `SPRINT-001` through `SPRINT-011` as completed and no `SPRINT-012.md` existed
  before planning.
- The installed Codex CLI exposes `codex exec --dangerously-bypass-approvals-and-sandbox` rather
  than `--full-auto`, so all draft and critique lanes used:
  `codex exec --dangerously-bypass-approvals-and-sandbox -C /Users/calebmchenry/code/build-wars -m <model> -c 'model_reasoning_effort="xhigh"'`.
- All three draft lanes and all three critique lanes produced markdown artifacts. The
  `gpt-5.4` critique log is large because the child process echoed its patch and final response to
  stdout after writing the target file; the artifact itself is present and usable.
- The interview is skipped under the non-interactive ticket-burn contract. No high-risk
  architecture choice blocks planning because EPIC-11 extends the existing source-policy and
  catalog-ingestion architecture.
- Planning modified sprint, draft, ticket, ledger, and manifest records only. No application
  implementation code was modified and no commit was created.

## Accepted

- Use the stricter GPT-5.6 Sol source authority, slot/locality/combination model, QA gates,
  security posture, and production-promotion language as the primary architecture baseline.
- Use the GPT-5.4 execution sequencing and categorized Definition of Done structure so the final
  sprint is easier to execute phase by phase.
- Use the GPT-5.5 identity posture: public `InsigniaId` remains schema-owned and distinct from
  `TemplateEquipmentModifierId`.
- Require a structured template-modifier crosswalk for accepted production v1 records. If the
  approved source graph cannot prove one unique active player-usable modifier mapping per accepted
  insignia, promotion blocks or the sprint receives a recorded amendment before promotion.
- Require field-level source authority and conflict precedence before schema freeze. Source
  authority is not a generic "wiki" dependency.
- Require same-page multi-variant identity rules: stable variant keys, collision checks, migration
  behavior, and QA gates.
- Require slot outcomes that distinguish value, not-applicable, and unresolved states. `null` must
  not carry multiple meanings.
- Store fixed and by-slot numeric values as one normalized per-slot projection for consumer use, and
  require source-backed values for all five canonical armor slots when an effect is deterministic
  and slot-scaled.
- Keep a single-record, single-slot helper boundary. Multi-entry summaries, legality checks,
  condition evaluation, rune composition, hit-location math, and full totals stay deferred.
- Keep EPIC-11 domain-only from an app perspective. No `src/app/catalogs.ts` import, equipment UI,
  local persistence/schema change, remote icon fetch, template semantic resolution, or full stat
  calculator belongs in SPRINT-012.
- Preserve safe unknown and note-only states as visible runtime facts with bounded review/QA
  evidence, but do not let unknowns mask failed source-clear arithmetic, identity, locality,
  restriction, or replay requirements.

## Rejected Or Adjusted

- Rejected hard-locking `InsigniaId` numerically to template modifier IDs before source discovery.
  The public ID is schema-owned; template modifiers are crosswalk evidence.
- Rejected a quiet nullable crosswalk for production v1 records. Missing or conflicting active
  player-usable modifier evidence is promotion-blocking unless a recorded amendment changes the
  policy.
- Rejected a record-level `stackable` boolean. Item stackability, effect combination, locality, and
  future aggregation are distinct fields.
- Rejected a generic chest/legs multiplier. Generated records expose exact source-backed per-slot
  outcomes.
- Rejected a general condition expression language or evaluator. Conditions are inert controlled
  data attached to effects.
- Rejected broad shared-profile migration. `source_set_protocol.py` may be added only if it avoids
  duplicated replay-security logic for EPIC-11; EPIC-04 and EPIC-10 migration is out of scope.
- Rejected claiming permanent reproducibility from ignored local snapshots. The sprint must either
  retain a durably addressable selected evidence set or document that future reproduction requires
  fresh bounded acquisition and review.
- Adjusted release-gate wording: a blocked sprint is a status outcome, not a Definition of Done
  alternative.

## Local Feasibility Notes

- `src/domain/ids.ts` already defines `InsigniaId` and `TemplateEquipmentModifierId`.
- `src/domain/equipment.ts` already exposes `ArmorPiece.insigniaId` and the canonical
  `ArmorSlot` union, so EPIC-11 can avoid equipment model churn.
- `src/domain/catalog.ts` currently has a lightweight `Insignia` interface only. Adding
  `CatalogInsigniaRecord` beside it matches the existing skill/rune generated-record split.
- `src/domain/rune-effects.ts` is a useful precedent for typed unresolved outcomes, but its
  multi-entry aggregation shape should not be copied for insignias.
- `scripts/data/build_wars_ingest/profiles.py`, `pipeline.py`, `rune_source_set.py`,
  `rune_extractor.py`, `rune_semantics.py`, and `rune_catalog.py` provide the closest concrete
  implementation precedent.
- `.gitignore`, `data/README.md`, `data/generated/README.md`, and `data/qa/README.md` already use
  exact-path exceptions for EPIC-03, EPIC-04, and EPIC-10. EPIC-11 should follow that pattern.
- `npm run verify` is the canonical offline repository gate. Live source refresh stays outside the
  default verification path.

## Interview

Interview skipped under the non-interactive ticket-burn contract.

## Final Assumptions

- EPIC-11 can be planned as one sprint because BW-1101 through BW-1106 are groomed, ready, and
  dependency ordered.
- The existing EPIC-02/03/04/10 ingestion and catalog patterns are the right architecture for
  insignias; no new scraper, runtime fetch path, app architecture, or external integration is
  needed.
- The default bounded source authority is `Equipment template format`, `Insignia`,
  `Effect stacking`, verified detail pages, metadata-only `imageinfo`, and the promoted EPIC-03
  catalog.
- Public `InsigniaId` is schema-owned. Production v1 requires a unique active verified
  template-modifier crosswalk per accepted player-usable insignia unless source discovery produces
  a recorded amendment.
- Production promotion requires live source qualification, selected offline replay, review
  capacity, and passing gates. Fixture data alone is not production data.
- Planning may update sprint, draft, ticket, ledger, run-state, and result-manifest records, but it
  must not modify implementation code or create a commit.
- Final approval is auto-granted because `work/sprints/SPRINT-012.md` is internally consistent,
  executable, and bounded by phase gates.
