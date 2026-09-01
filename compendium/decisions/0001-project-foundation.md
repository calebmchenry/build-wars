# Project Foundation

Date: 2026-09-01

## Decision

Build Wars starts as one private npm package using React, Vite, TypeScript, Vitest, ESLint, and
Prettier. The app is local-only for the foundation sprint.

The first durable boundary is `src/domain`, which exposes plain JSON-compatible TypeScript
contracts for professions, attributes, skills, skill progression, runes, insignias, armor, weapons,
weapon modifiers, builds, equipment templates, party builds, guides, and source metadata.

## Module Ownership

- `src/app` owns browser rendering and may import public exports from `src/domain`.
- `src/domain` owns framework-neutral contracts and is typechecked without DOM libraries.
- `scripts/data` is reserved for future ingestion and QA scripts.
- `data/source-snapshots`, `data/generated`, and `data/qa` keep raw, normalized, and QA artifacts
  separate.

## Boundary Rules

Domain code must not import React, DOM/browser APIs, storage adapters, network clients, app modules,
test fixtures, or data scripts. ESLint restricts these imports and globals, while
`tsconfig.domain.json` checks the domain without browser libraries.

## Data And Fixtures

Foundation fixtures are synthetic and non-authoritative. They exist only to test serialization,
schema versioning, unknown numeric ID preservation, and the eight-slot skill bar shape.

Real Guild Wars Wiki, PvX, template, icon, split-skill, rune, insignia, legality, and invalid-code
fixtures are deferred until source policy, ingestion, template compatibility, and rule-validation
epics define their contracts.

## Extraction Triggers

Keep the single-package layout until there is a second runtime consumer, an independent release
lifecycle, or real tooling conflicts that make package extraction cheaper than local boundaries.
