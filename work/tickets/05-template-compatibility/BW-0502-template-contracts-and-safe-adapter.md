---
id: BW-0502
title: Template Contracts, Wrappers, and Safe Adapter
epic: EPIC-05
status: done
priority: critical
depends_on:
  - BW-0501
planned_sprint: SPRINT-006
completed_sprint: SPRINT-006
created: 2026-09-01
updated: 2026-09-02
---

# BW-0502: Template Contracts, Wrappers, and Safe Adapter

## Execution Notes

SPRINT-006 added public JSON-compatible template contracts in `src/domain/template.ts`, raw
equipment template ID brands, safe wrapper parsing/formatting, stable typed errors, semantic
fingerprints, exact-source/canonical export modes, a narrow vendor declaration, and a single
`gw-templates-adapter.ts` import boundary guarded by tests, TypeScript, and ESLint.

## Goal

Create the vendor-independent template compatibility boundary that turns untrusted codes into
bounded plain data, typed diagnostics, and explicit fidelity outcomes.

## Scope

- Add plain domain contracts for template source envelopes, skill/equipment documents, raw equipment
  template ID namespaces, encode/decode results, diagnostics, fidelity grades, and stable errors.
- Put executable vendor calls in a framework-neutral `src/template-compatibility` layer that imports
  domain contracts but is not imported by `src/domain`.
- Add a narrow version-specific local declaration for the vendor methods used locally.
- Implement bounded bare/chat-code classification, wrapper parsing and formatting, safe template
  name policy, kind/version discrimination, runtime shape guards, exception mapping, and semantic
  fingerprints.
- Define `preserve-source` and `canonical` export orchestration before skill/equipment features rely
  on it.

## Acceptance Criteria

- Public contracts are JSON-compatible and do not expose vendor classes, objects, errors, buffers, or
  dependency-specific field names.
- The only allowed vendor import is the dedicated adapter.
- Chat wrappers preserve `null` for no wrapper and `""` for an empty name; emitted names reject
  delimiters, brackets, control characters, and over-limit text.
- Expected malformed input returns typed failures with bounded messages and no raw stack traces.
- Exact replay, field-complete normalized re-encode, and unsupported/lossy outcomes are distinct.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test:run -- test/domain/contracts.test.ts test/template-compatibility/chat-code.test.ts test/template-compatibility/error-boundary.test.ts`
- `npm run build`
