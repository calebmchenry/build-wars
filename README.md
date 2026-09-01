# Build Wars

Build Wars is a local-first TypeScript web app for Guild Wars Reforged build tooling. The current
foundation is intentionally small: a runnable React/Vite shell, framework-neutral domain contracts,
synthetic fixtures, and documented places for future data ingestion.

## Prerequisites

- Node.js `22.11.0` or newer
- npm `11.10.1` or newer
- Python 3 for ticket-burn unit tests

## Commands

```sh
npm ci
npm run dev
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run verify
```

`npm run verify` is the canonical repository validation command. It runs formatting checks, linting,
type checking, Vitest tests, the production build, and `python3 -m unittest scripts/test_ticket_burn.py`.

## Current Scope

Included now:

- Single private npm package
- React, Vite, TypeScript, Vitest, ESLint, and Prettier
- Minimal accessible app shell
- Plain-data contracts in `src/domain`
- Synthetic foundation fixtures in `test/fixtures`
- Reserved data and ingestion directories

Deferred to later epics:

- Template import/export
- Guild Wars Wiki or PvX ingestion
- Runtime rule validation
- Local storage and sharing
- Equipment editor, party builder, guide authoring, PWA behavior, auth, analytics, and deployment

## Project Layout

- `src/app` contains browser UI code and may import public domain contracts.
- `src/domain` contains framework-neutral contracts and must not import React, DOM/browser APIs,
  browser storage, network clients, app modules, or data scripts.
- `scripts/data` is reserved for future ingestion and QA tooling.
- `data/source-snapshots`, `data/generated`, and `data/qa` separate raw, normalized, and QA artifacts.
- `test/fixtures` contains synthetic non-authoritative fixtures for foundation tests.
- `work/tickets` and `work/sprints` track ticket-burn planning and execution records.
- `compendium` stores project decisions and long-lived implementation notes.
