---
id: BW-1901
title: Adjustment Contracts and Source Rules
epic: EPIC-19
status: backlog
priority: high
depends_on: []
created: 2026-09-13
updated: 2026-09-13
---

# BW-1901: Adjustment Contracts and Source Rules

## Goal

Freeze the authored profile, legacy-equipment precedence, effect identities, and rank contexts described in [the design brief](../../../compendium/attribute-adjustments.md) before controls are implemented.

## Scope

- Separate base allocations, compact equipment choices, effect preferences, and derived results. Keep armor-slot management outside the milestone.
- Specify a single source for each effective headgear/rune contribution; preserve existing semantic armor and unresolved imported evidence without adding the same bonus twice.
- Define profession/Any changes, zero-rank attributes, no selected loadout, automatic/on/off overrides, removal/re-addition, mode changes, and local hydration behavior.
- Record verified rules and catalog ID fixtures for Glyph of Elemental Power, both Elemental Lord variants, PvE/PvP Masochism, and external Heroic Refrain. Use explicit effect definitions, never prose parsing.
- Specify normal rank cap 20, cap explanations, attribute versus title rank separation, and preview-only temporary assumptions. Keep source facts and configured Heroic Refrain strength separate from the recipient's rank.
- Audit Build constructors/cloners, strict persistence, template fingerprints, rank consumers, and game-file behavior; update the design brief with the chosen contracts.

## Acceptance Criteria

- All decisions in the brief have executable defaults; no routine user interview or new armor editor is required.
- A small fixture matrix establishes exact affected attributes, legality/mode gates, faction deduplication, and no PvP Masochism attribute bonus.
- Baseline metadata and existing game-template behavior are recorded before implementation.

## Verification

Review current sources and promoted catalogs; record source URLs and checks. No app change is required solely to complete the contract ticket.

## Design Authority

[Composer attribute adjustments](../../../compendium/attribute-adjustments.md) and the
[epic contract](EPIC.md). User decisions there override older sprint scope.
