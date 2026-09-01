# Build Wars

Build Wars is a local-first TypeScript web app for Guild Wars Reforged build tooling. The current
foundation includes a runnable React/Vite shell, framework-neutral domain contracts, synthetic
fixtures, source policy, and an offline-first data ingestion platform for future content epics.

## Prerequisites

- Node.js `22.11.0` or newer
- npm `11.10.1` or newer
- Python 3 for ticket-burn and data-ingestion unit tests

## Commands

```sh
npm ci
npm run dev
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run data:setup
npm run data:test
npm run data:regenerate
npm run verify
```

`npm run verify` is the canonical repository validation command. It runs formatting checks, linting,
type checking, Vitest tests, the production build, fast offline data-ingestion tests, and
`python3 -m unittest scripts/test_ticket_burn.py`.

Run `npm run data:setup` once after `npm ci`. It creates the ignored `.venv-data` virtualenv and
installs the pinned Python parser dependency from `scripts/data/requirements.txt`.

`npm run data:regenerate` runs fixture mode only. It uses committed minimized synthetic fixtures,
fixed timestamps, and an output root under ignored `work/runs/data-ingestion`.
The default fixture run preserves the EPIC-02 skill-ID proof and also writes the EPIC-03
professions/attributes fixture catalog. Run the EPIC-03 profile directly with
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py fixture --profile epic-03-professions-attributes`.

## Current Scope

Included now:

- Single private npm package
- React, Vite, TypeScript, Vitest, ESLint, and Prettier
- Minimal accessible app shell
- Plain-data contracts in `src/domain`
- Synthetic foundation and ingestion fixtures in `test/fixtures`
- Source-policy gate for future source-derived data, media metadata, QA review, and release
  decisions
- Shared Python ingestion tooling under `scripts/data` for MediaWiki access, snapshots, parser
  proofing, skill-ID enumeration, icon metadata, deterministic artifacts, QA reports, and fixture
  regeneration
- Runtime-eligible EPIC-03 professions/attributes catalog data at
  `data/generated/epic-03/professions-attributes.catalog.json`, with an adjacent generated manifest
  and bounded QA report

Deferred to later epics:

- Template import/export
- Importing the EPIC-03 catalog into `src/app`, including attribution UI and remote media/privacy
  decisions
- Full Guild Wars Wiki or PvX content catalog ingestion
- Runtime rule validation
- Local storage and sharing
- Equipment editor, party builder, guide authoring, PWA behavior, auth, analytics, and deployment

## Project Layout

- `src/app` contains browser UI code and may import public domain contracts.
- `src/domain` contains framework-neutral contracts and must not import React, DOM/browser APIs,
  browser storage, network clients, app modules, or data scripts.
- `scripts/data` contains offline/live ingestion and QA tooling. Runtime app code must not import it.
- `data/source-snapshots`, `data/generated`, and `data/qa` separate raw, normalized, and QA artifacts.
- `test/fixtures` contains synthetic non-authoritative fixtures for foundation and ingestion tests.
- `work/tickets` and `work/sprints` track ticket-burn planning and execution records.
- `compendium` stores project decisions and long-lived implementation notes.

## Source Policy Gate

Before future work imports, normalizes, commits, or publishes Guild Wars Wiki, PvX/Fandom,
community, icon, screenshot, or generated catalog data, it must satisfy the
[source policy](compendium/source-policy.md). Copied or source-derived runtime data needs
provenance for source identity, canonical URL, page or file identity where available, revision and
retrieval facts, material class, rights basis, use decision, and review notes. Ambiguous cases remain
review-required.

Live Guild Wars Wiki refreshes are manual-only through
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --allow-live-network --title "Guild Wars Wiki:Game integration/Skills/0"`
or a similarly bounded command. Live outputs stay ignored by default and must be reviewed before any
exact-path promotion ticket can allow them.
For EPIC-03, the locked profile command is
`PYTHONPATH=scripts/data .venv-data/bin/python scripts/data/regenerate.py live --profile epic-03-professions-attributes --root . --allow-live-network`;
only the catalog JSON, manifest JSON, and machine-readable QA JSON are exact-path allowlisted.
