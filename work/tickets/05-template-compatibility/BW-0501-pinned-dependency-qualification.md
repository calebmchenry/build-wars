---
id: BW-0501
title: Pinned gw-templates Dependency Qualification
epic: EPIC-05
status: done
priority: critical
depends_on: []
planned_sprint: SPRINT-006
completed_sprint: SPRINT-006
created: 2026-09-01
updated: 2026-09-02
---

# BW-0501: Pinned gw-templates Dependency Qualification

## Execution Notes

SPRINT-006 pinned `@buildwars/gw-templates@1.1.1` exactly after baseline
`npm run verify` passed at Node.js `22.11.0`. The package is MIT-licensed, exposes public
`lib/main.cjs` and `lib/browser.js` entry points, has no package-level `engines` field in the
lockfile, and brings in `windows-1252@3.0.4` as an MIT transitive dependency. Mandatory skill and
raw equipment paths are covered by package evaluation tests, TypeScript, Vitest, and Vite build.

## Goal

Prove whether `@buildwars/gw-templates@1.1.1` can be the Build Wars template codec dependency under
the current project runtime, bundler, type, license, and fixture constraints.

## Scope

- Pin the package exactly only after recording license, registry integrity, public entry points,
  distribution shape, documented runtime requirements, and transitive dependency facts.
- Test mandatory skill and equipment decode/encode paths under the repository Node.js floor, Vitest,
  TypeScript, and Vite production build.
- Inventory vendor normalization behavior, thrown errors, statefulness, wrong-kind handling, and
  decoded object shapes.
- Record a preliminary paw-ned2 capability probe without exposing a public team API.
- Block the sprint for an explicit amendment if mandatory skill or equipment paths fail; do not
  introduce a hand-rolled bitstream parser as an incidental fallback.

## Acceptance Criteria

- The package is either pinned exactly and qualified for mandatory skill/equipment work, or the
  sprint is left blocked with the exact incompatibility.
- Only public package entry points are used by probes; no vendored source, tarball, CDN import, or
  deep import becomes application code.
- The package's documented Node `>=24` expectation is compared against the Build Wars Node
  `>=22.11.0` floor with executable evidence.
- All observed lossy or normalizing behavior has a planned adapter policy.

## Verification

- `npm ls @buildwars/gw-templates windows-1252`
- `npm run test:run -- test/template-compatibility/package-evaluation.test.ts`
- `npm run typecheck`
- `npm run build`
