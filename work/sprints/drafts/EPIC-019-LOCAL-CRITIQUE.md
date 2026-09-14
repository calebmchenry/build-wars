# EPIC-19 Local Critique

Reviewed the independent Codex draft against the conversation, actual code, and
the draft backlog on 2026-09-13. Claude's draft command failed because its OAuth
session expired and could not be refreshed. No alternate auth context was tried.
With one available CLI draft, the sprint-plan workflow permits local critique.

## Strengths retained

- Uses authored Build schema migration with neutral defaults, separate from the
  existing local-library envelope/key.
- Separates compact attribute choices from full semantic equipment, avoids armor
  slot management, and centralizes rank computation.
- Uses stable logical effect identity, deduplicated faction variants, explicit
  override intent, and external-only assumed Heroic Refrain strength.
- Preserves base game templates and asks for actual browser evidence.

## Corrections required

1. The draft's acceptance statement that new imports do not infer effect choices
   contradicts the accepted on-bar defaults. Final contract: no inferred gear,
   no external buffs, but supported legal self effects infer on from the new bar.
2. A full-profile snapshot on the first edit risks losing unresolved inherited
   gear and can unexpectedly freeze every attribute. Replace only the addressed
   headgear/rune contribution. Inherit, explicit None, and selection must remain
   distinguishable. Retain the original armor; do not sum both sources.
3. An undefined first external-Refrain strength would create a blocking choice.
   Default the displayed selector to +1 at first opt-in; expose all +1..+4 values
   and persist the chosen strength. Do not infer caster stats or recast order.
4. The asset work needs a dedicated ticket. Current metadata maps 126 attribute
   rune IDs to only 30 profession/tier images. Preserve provenance, deduplicate,
   add the authorized narrow cache exception, and require local runtime mappings.
5. Name all explicit clone paths, not only local parsing. `cloneBuild` in
   persistence-schema.ts and `cloneBuildForBuildSetEntry` in domain/build-set.ts
   enumerate fields and will otherwise drop the new state.
6. Distinguish preview-effective rank from permanent equipment validation and
   standard-code export legality/fingerprints. Cover zero ranks, caps, title ranks,
   unresolved facts, and all existing skill-display consumers.
7. The override lifecycle needs tests across unrelated edits, removal/re-addition,
   mode switches, faction aliases, primary/Any changes, hydration, and reset.
8. Existing game folder behavior needs precise preservation assertions: load
   replacement/cancellation, raw-code replay, filename selection, permissions,
   fresh reads, overwrite confirmation, fallback download, and completed writes.
9. Use eight tickets to separate state/persistence, computation, icons, inline UI,
   advanced effects, game/transfer boundaries, and closeout from the contract work.
   Give each ticket dependencies and observable acceptance conditions.

## Verification of planning approach

The user asked for burn inputs, not a pre-executed or pre-numbered sprint. The
runner calls its own Codex-only sprint planner and creates sprint metadata. Final
synthesis therefore belongs in EPIC-19, BW-1901..1908, and the compendium brief.
Do not introduce a competing sprint file or change completed ledger entries.

The prior conversation already supplied the interview answers. Additional
routine approval questions would not improve this setup. Named local saves,
new complete-build transfer interfaces, and equipment codes remain follow-ups.
