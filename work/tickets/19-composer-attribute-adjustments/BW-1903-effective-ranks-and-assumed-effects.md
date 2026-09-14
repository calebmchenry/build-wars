---
id: BW-1903
title: Effective Ranks and Assumed Effects
epic: EPIC-19
status: backlog
priority: high
depends_on:
  - BW-1901
  - BW-1902
created: 2026-09-13
updated: 2026-09-13
---

# BW-1903: Effective Ranks and Assumed Effects

## Goal

Resolve consistent attribute previews from base ranks, equipment choices, and supported assumed active effects.

## Scope

- Provide a shared domain/app projection for all composer rank and skill-display consumers; reuse rune facts and existing effective-rank contributions.
- Apply the brief's compact-profile versus legacy-equipment precedence, primary-only headgear/rune eligibility, and highest-per-attribute rune behavior.
- Implement automatic and explicit effect preferences behind eligibility gates. Missing, unresolved, off-profession, or mode-ineligible self skills cannot activate an effect; duplicates and faction variants contribute once.
- Implement the four bounded effect families in the brief. Heroic Refrain is opt-in with an explicit +1..+4 bonus; never infer caster strength from the recipient or recursively simulate recasts.
- Return base, equipment-adjusted, preview-effective, contribution, inactive-reason, and capped/unresolved facts. Respect the normal cap and do not reinterpret title ranks as attributes.
- Use preview ranks for descriptions and existing Expertise/Mysticism/Fast Casting calculations in skill rows, bar tooltips, and supported alternate catalog views. Preserve catalog base values, unknown states, and standalone game-file previews.
- Keep temporary assumptions out of standard skill-template legality, base-point spending, weapon-proc simulation, and permanent equipment claims.

## Acceptance Criteria

- 12 base + 1 headgear + 3 rune = 16; replacing +1 with +3 contributes three rune ranks, not four.
- With base Fire Magic 12, headgear +1, rune +3, Glyph +2 and Lord +1, the preview is 19; adding external Refrain +4 caps at 20 with an explained cap.
- A secondary Elementalist can receive eligible elemental skill effects but cannot equip Elementalist runes/headgear.
- Mode/primary changes, effect removal/re-addition, and manual reset produce deterministic results without overwriting user preferences.
- Descriptions, effective-rank labels, and supported cost/timing calculations agree.

## Verification

Meaningful math, mode/split, override lifecycle, unresolved-data, cap, selector, and skill-display regression fixtures.

## Design Authority

[Composer attribute adjustments](../../../compendium/attribute-adjustments.md) and the
[epic contract](EPIC.md). User decisions there override older sprint scope.
