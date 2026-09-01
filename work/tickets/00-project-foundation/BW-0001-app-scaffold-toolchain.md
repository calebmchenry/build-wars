---
id: BW-0001
title: App Scaffold and Toolchain
epic: EPIC-00
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-001
completed_sprint: SPRINT-001
created: 2026-09-01
updated: 2026-09-01
---

# BW-0001: App Scaffold and Toolchain

## Goal

Create the first runnable local Build Wars web app scaffold and standard Node/npm verification commands.

## Scope

- Use a single private npm package for the initial project shape.
- Add React, Vite, TypeScript, Vitest, ESLint, Prettier, and npm scripts.
- Add a minimal accessible app shell that proves the app boots locally.
- Add a smoke test for the app shell.
- Document and enforce the selected Node/npm baseline.

## Acceptance Criteria

- `npm ci` succeeds from a committed `package-lock.json`.
- `npm run dev` starts the local app.
- `npm run build` succeeds.
- `npm run test:run` includes the app smoke test.
- `npm run verify` exists as the canonical repo verification command.
- No backend, hosted sharing, auth, analytics, service worker, or persistence layer is introduced.

## Verification

- `npm run verify`
- `python3 -m unittest scripts/test_ticket_burn.py`
