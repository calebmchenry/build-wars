# Title Ranks

SPRINT-016 ships EPIC-15 title-rank behavior for title-scaled skills without adding account title
profiles.

## Runtime Contract

`src/domain/title-rank.ts` owns framework-neutral title discovery, exact alias normalization,
labels, editable domains, row coverage, override mutation, and skill-rank resolution. Runtime app
code derives one title catalog from EPIC-04 `SkillProgressionSeries[]` through `src/app/catalogs.ts`;
leaf components do not import generated JSON directly.

Canonical authored keys use the `title:<slug>` grammar. Known exact aliases collapse to the same
control only when explicitly listed. The promoted catalog currently exposes seven user-facing
controls from eight raw title keys because `title:title-sunspear-rank` aliases to
`title:sunspear-rank`. No fuzzy matching is used.

## Defaults And Overrides

Empty title state is meaningful. A build with no `titleRankOverrides` renders supported
title-scaled progression at each series' declared maximum rank.

Authored overrides are sparse nested `Build` schema-2 entries:

```ts
{
  key: string;
  rank: number;
}
```

Overrides are bounded, canonical, sorted, unique, and limited to exact editable integer rows.
Setting a coherent title to its maximum removes the override. Reset always removes the override.
For conflicting alias groups, reset returns to per-series implicit maximums; explicit edits are
limited to the common exact rows.

Structurally valid unknown or stale overrides are retained inertly, warned about, and kept
resettable. Malformed, unsafe, duplicate, oversized, or out-of-domain persisted overrides are
reported deterministically instead of being trusted.

## UI Behavior

The Skills workspace renders a compact title-rank panel between the skill bar and skill browser.
Relevant rows appear by default in first selected skill-slot order. A disclosure exposes the
remaining discovered titles plus retained stale overrides for preconfiguration or cleanup.

Each enabled row supports decrement, increment, direct integer entry, and reset. Inputs reject blank,
decimal, exponential, whitespace, unsafe, and out-of-range draft commits and restore the last
resolved value. Labels, current rank text, max range, and inline validation issues are connected to
the input for assistive technology.

Skill browser rows, skill bar slots, pinned tooltips, progression labels, and skill facts all use
the same resolved title-rank projection. Resolved title dependencies no longer show
maximum-title-rank assumption copy.

## Validation

`RULE_ENGINE_VERSION` is `rule-engine:v3`. Generic `skill.title-deferred` and
`skill.allegiance-deferred` emissions are replaced by narrow title issue codes.

Resolved default or overridden title dependencies do not warn. Missing title keys, missing domains,
row gaps, missing exact rows, unsupported title-classified skills, selected alias conflicts,
invalid overrides, duplicate overrides, unknown/stale overrides, and out-of-current-domain overrides
emit located warnings.

The promoted Sunspear alias/domain mismatch remains visible. The resolver never invents rows or
interpolates values. Allegiance-ranked skills use rank-first scaling and emit one narrow warning for
side/exclusivity uncertainty; account ownership and Kurzick/Luxon side selection remain deferred.

PvE-only skill-count validation is unchanged: exactly three PvE-only skills are allowed in PvE, and
fourth/later PvE-only slots retain the existing deterministic limit error. PvP and unknown-mode
restrictions and browser availability filters remain owned by the existing skill rules.

## Persistence And Sharing

The outer local-library envelope and `build-wars:v1` storage key remain unchanged. Schema-1 builds
migrate in memory to nested Build schema 2 with empty overrides and do not dirty old records merely
by loading. Working draft autosave, named saves, update, save-as-new, duplicate, load, backup,
restore, hydration, and fingerprints preserve title overrides.

Skill-template bytes, exact-source replay, raw overlays, share URL grammar, and the 1,800-character
share cap remain title-free. Non-default title overrides are local-only and show omission warnings
for template export/share. Template import warns before replacing a draft that contains authored
title overrides.

## Deferred Scope

EPIC-15 does not model account title ownership, title acquisition, reputation farming, campaign
unlocks, title guide prose, party-wide title state, hosted title sharing, or broad allegiance side
configuration. Later work may add those domains, but should consume the existing title-rank helper
instead of normalizing title keys independently.
