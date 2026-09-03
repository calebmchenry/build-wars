# SPRINT-015 Merge Notes

## Source Artifacts

- Intent: `work/sprints/drafts/SPRINT-015-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-015-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-015-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-015-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-015-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-015-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-015-GPT54-CRITIQUE.md`

## Consensus

The review lanes converged on a single executable shape:

- Use the GPT-56SOL draft as the architectural base because it is strongest on catalog isolation,
  reducer boundaries, null-versus-empty semantics, stale selection preservation, persistence safety,
  validation authority, and conservative summaries.
- Use GPT-54 sequencing discipline: freeze contracts before component work, stabilize catalog/state
  interfaces early, and keep phase dependencies easy to follow.
- Pull in GPT-55's concrete repo-facing checks: remove the current `unsupported-equipment`
  persistence rejection, add library freshness coverage, and include raw-template/cosmetic boundary
  scans.

## Binding Merge Decisions

1. `SPRINT-015` is the next sprint ID. Existing sprint files end at `SPRINT-014`, and the ledger
   ends at sprint `014`.
2. The editor uses peer main-column workspace tabs: `Skills` and `Equipment`. The `Skills` tab owns
   the existing `SkillBar` and `SkillBrowser`; the `Equipment` tab owns the equipment panel. This
   avoids crowding the skill workflow and keeps skill tooltip behavior isolated.
3. `Build.equipment` remains nullable. Opening the equipment tab never materializes equipment.
   The first meaningful edit creates a canonical empty loadout plus the authored edit. Clearing the
   last meaningful field leaves an empty canonical loadout. Explicit remove/reset returns to `null`.
4. Empty canonical equipment is not meaningful equipment for share/export omission warnings.
   Meaningful equipment includes known selections, unresolved selections, modifiers, headgear
   attribute selection, or authored fallback facts.
5. Reducer actions are structural and catalog-independent. Selectors and UI view models own option
   availability, retained invalid selection presentation, and inline issue placement. Domain
   validation remains the authority for legality.
6. Runtime generated imports remain isolated to `src/app/catalogs.ts`. Equipment catalog adaptation
   and readiness can be placed in app-owned helper modules, but generated JSON must not leak into
   leaf components.
7. Catalog readiness is per family where practical: runes, insignias, weapons, and weapon modifiers
   can degrade independently. Clear/reset operations remain available during catalog failures.
8. Weapon-set-local effects are never aggregated as character-wide totals until active weapon-set
   semantics exist.
9. The sprint must prove persistence contracts early and cannot expose a completed equipment editor
   before autosave, hydration, duplicate, backup/restore, and share/template warnings are durable.
10. No new runtime dependency is planned. A custom combobox is acceptable only with focused keyboard,
    ARIA, IME, mobile, and long-label coverage.

## Trimmed Or Deferred

- Raw equipment-template import/export and exact replay remain EPIC-17 scope.
- Icons, remote media, cosmetics, skins, dyes, acquisition facts, recommendations, DPS, and full
  combat/stat aggregation remain out of scope.
- Authored requirement fallback inputs should stay schema/reducer-capable, but visible UI is exposed
  only if existing catalog data demonstrates a user-visible unresolved requirement case.
- Rich fact drill-downs are secondary to concise selected-value summaries, attribution, validation
  messages, and durability.

## Non-Interactive Approval

The automation contract requested no routine confirmation questions. The review lanes did not
surface a blocking high-risk architecture choice. The final sprint is auto-approved for planning
because it is internally consistent, dependency ordered, and contains explicit assumptions and
verification gates.

