# Sprint 020 Intent: Composer Attribute Adjustments

## Seed

Create an executable sprint for EPIC-19 from
`work/tickets/19-composer-attribute-adjustments/EPIC.md`, covering BW-1901 through
BW-1908. The design authority is `compendium/attribute-adjustments.md`; read it and
the eight tickets completely. Existing accepted human decisions take precedence
over historical sprint descriptions. Use SPRINT-020, the next unallocated number.

The automation contract is noninteractive ticket-burn: skip routine interview,
record assumptions, auto-approve a consistent executable sprint, change planning
records only, and do not commit. Final output belongs at `work/sprints/SPRINT-020.md`;
drafts/merge notes belong here. The parent will update tickets, ledger, and
`work/runs/ticket-burn/EPIC-19/20260914T004651Z/plan-EPIC-19-result.json`.
Lane workers may write only their assigned markdown artifact; do not implement,
modify tickets/ledger, use skills, delegate, or recursively run planning workflows.

## Context

- Build Wars is a React/TypeScript/Vite local-first Guild Wars composer. All 19
  existing sprints and the source epic's ten prerequisites are complete. EPIC-19
  is ready; its eight existing tickets are backlog with an explicit dependency DAG.
- Current HEAD `41b5e41` prepared this milestone's accepted brief and backlog;
  `52f64ec` added game-file browsing and attribute-adjusted skill displays, following
  fixes to skill identities, faction icons, and mode variants. Inspect today's code
  rather than assuming historical equipment/library/party panels are mounted.
- Effective ranks already combine semantic equipment and base rank in
  `composer-selectors.ts` and `editor-selectors.ts` separately. Existing low-level
  rank math preserves unresolved inputs and does not impose this new preview cap.
- Build schema is v2; strict persisted readers have explicit key lists/cloners.
  The v2 local envelope uses `build-wars:v1`. One live EditorState feeds selected
  nested loadouts, autosave, backups, and transfers. New authored fields must reach
  all copies/fingerprints while standard game-code projection remains base-only.
- Runtime skill icons already use local generated maps and provenance, but the
  documented exception does not yet include rune paths. The user's accepted brief
  explicitly authorizes its narrow extension; no further approval is needed.

## Recent Sprint Context

SPRINT-019 completed the focused composer. Subsequent commits simplified mounted
surfaces and added file browsing; its old secondary-panel assumptions are not an
instruction to remount panels. The prior `EPIC-019-*` drafts are backlog-preparation
history, not this numbered sprint's drafts. Their instruction to leave SPRINT-020
unallocated applied only to that preparation and is superseded by this burn plan.

## Relevant Codebase Areas

- Domain: `src/domain/build.ts`, `build-set.ts`, `equipment-attribute-rank.ts`,
  `effective-attribute-rank.ts`, `skill-attribute-effects.ts`, rune facts and
  profession/skill eligibility rules.
- App projections/state: `src/app/editor-state.ts`, `composer-selectors.ts`,
  `editor-selectors.ts`, `attribute-eligibility.ts`, `workspace-state.ts`,
  `build-set-state.ts`, `party-state.ts` and selected-loadout materialization.
- Mounted UI: `src/app/App.tsx`, `src/app/components/BuildComposer.tsx`,
  `FocusedAttributeEditor.tsx`, focused skill catalog/bar/tooltip components,
  `src/app/styles.css` (verify exact style entry point during file audit).
- Persistence: `src/app/persistence-schema.ts`, `local-storage.ts`,
  `backup-restore.ts`, `build-set-transfer.ts`, `party-transfer.ts`, explicit
  `cloneBuildForBuildSetEntry` and `cloneBuild` functions.
- Template boundaries: `src/app/template-workflow.ts`, `template-import.ts`,
  `template-files.ts`, file-browser/dialog components, `share-url.ts`, and
  `src/template-compatibility/`.
- Assets: `data/generated/epic-10/runes.catalog.json`, `src/app/skill-icons.ts`,
  `icon-assets.ts`, `skill-icon-assets.generated.json`,
  `scripts/data/cache_skill_icons.py`, `scripts/data/build_wars_ingest/skill_icon_assets.py`,
  `compendium/decisions/0002-runtime-gww-icon-assets.md`, policy tests and docs.
- Tests: `test/domain/`, `test/template-compatibility/`, adjacent `src/app/*.test.*`,
  Python ingestion tests. No installed browser automation package is assumed.
- Visual reference already inspected by parent:
  `prior-art/gw-skills-and-attributes-refs/attributes-section.png` uses bright blue
  numerals for increased ranks, neutral numerals otherwise, with compact arrows.

## Constraints

- Inline primary-only None/+1/+2/+3 rune groups, one clearable headgear +1, base
  point arrows unchanged, zero-base primary attributes editable. No armor editor.
- Gear overrides are per-contribution replacements: absent inherits legacy;
  explicit None suppresses it; selection replaces it. Preserve raw and semantic
  equipment evidence. Actual primary changes clear compact gear only; same primary
  is a no-op; secondary edits retain valid primary choices. Hidden legacy armor
  reducers clear only the compact contributions they actually edit.
- Stable explicit effect on/off preferences survive removal, mode/profession
  changes, and reload; automatic values are derived. No override bypasses legality.
- Bounded effects: Glyph 198 +2 elemental; Lord 1951/2094 +1 elemental in PvE once;
  Masochism 2139 +2 Death/Soul in PvE (3054 excluded); external Refrain 3431 identity,
  opt-in PvE +1..+4 to ordinary available attributes, initially +1, never self-inferred.
- Shared preview projection caps ordinary ranks at 20 with uncapped explanation;
  invalid base values remain invalid. Do not alter permanent equipment validation,
  title ranks, base points, catalog facts, or standard template legality/fingerprint.
- Build v3 with old v1/v2 migration is the default; retain storage key/envelope and
  recovery/conflict protection. Audit inactive nested loadouts and saved internals.
- Ordinary imports clear explicit adjustments, infer eligible self effects, and
  leave Refrain off. Cancel/error is transactional. Standalone file previews use
  their own isolated state. Omission/discard copy extends existing UI without an
  extra prompt. Full internal document paths retain adjustments.
- Local rune cache covers 126 attribute rune records / 30 profession-tier image
  identities per accepted brief; execution verifies these counts against catalog.
  Required real assets plus labeled runtime fallback, not generated art/hotlinks.
- No new library UI, complete-build formats/URLs, sidecars, folder sync, backend,
  generic parser/simulator, total health/armor claims, or unrelated parked work.

## Success Criteria

All eight tickets are executable in dependency order with concrete files, evidence,
and DoD. Examples: 12+1+3=16; Fire 12+1+3+Glyph 2+Lord 1=19; adding external +4 yields
20 with uncapped 23 explained. Secondary Elementalist gets legal effects but no
Elementalist gear controls. Duplicate/faction variants count once. All skill
description and existing cost/timing surfaces agree with the attribute preview.
Reload and full document transfers retain explicit settings. Bonus-only edits
dirty authored state but produce unchanged game code. Actual browser evidence
must be required before implementation closeout.

## Verification Strategy

- BW-1901 freezes identity/source fixtures and consumer/clone audits before UI work.
  Treat source URLs in the accepted brief as references; execution records current
  checks and any source-access limitations without fabricating verification.
- Domain/reducer fixtures cover inheritance vs None, unknown rune evidence,
  invalid base/duplicate allocations, cap, legality/mode, reset/re-add, Any,
  zero base, no selected loadout, unrelated invalid skills, and external Refrain.
- Persistence/transfer fixtures use non-default settings in active/inactive builds,
  explicit cloners, v1/v2 migration, duplicate IDs/fields, malformed/future schemas,
  storage conflicts/quota, pagehide, and exact-source vs canonical export.
- Component tests cover keyboard mutual exclusion, accessible breakdown/focus,
  effect counts (including clipped active contributions), title separation,
  standalone file preview isolation, failed/canceled load/save and fallback files.
- Rune tests cover exact policy paths, source identity deduplication, provenance
  hashes, local-only runtime maps, and missing-image fallback.
- Real browser matrix: 1280/900/390px, both themes, 200% zoom, long labels/five
  primary attributes, keyboard/touch breakdown, reload, missing icons, no loadout,
  disposable copied Skills folder with permission/cancel/overwrite/fallback checks.
  Record browser/scenario/viewport/results/screenshots; jsdom/CSS is insufficient.
- Implementation must pass `npm run verify` and `git diff --check`; planning uses
  document formatting, link/DAG/metadata/manifest checks and does not claim tests ran.

## Uncertainty Assessment

- Correctness: Medium — bounded source-backed rules; exact mode mapping and
  unresolved legacy contribution behavior need careful fixtures.
- Scope: Low — eight groomed tickets and a settled authoritative product brief.
- Architecture: Low — extends authored Build and existing projections/persistence.
  No high-risk architectural decision requires reopening the human interview.

## Open Questions

No blocking human question. Drafts should select concrete safe defaults for the
authored type/strict validation shape, unresolved contribution scoping, hidden
reducer invalidation, projection integration, and browser evidence acquisition.
Distinguish code paths that need changes from paths that only need regression proof.

## Workflow Checklist

- [x] Codex command set resolved: installed CLI has no `--full-auto`; use the
      same CLI with `-s workspace-write -c 'approval_policy="never"'`, preserving auth.
      All three lanes use `-c 'model_reasoning_effort="xhigh"'`; retry high only on a
      concrete unsupported-effort error. Logs are redirected per artifact.
- [x] Orientation and intent complete.
- [x] All available independent drafts received (all three CLI lanes exited successfully).
- [x] All available cross-critiques received (all three combined critiques; all CLI exits successful).
- [x] Routine interview skipped under explicit automation contract; assumptions recorded.
- [x] Merge notes and final sprint written.
- [x] Ticket planning records, ledger, and result manifest updated and validated.
- [x] Final plan auto-approved once internally consistent and executable.
