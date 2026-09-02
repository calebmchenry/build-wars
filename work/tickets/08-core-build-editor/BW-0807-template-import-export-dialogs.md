---
id: BW-0807
title: Template Import Export Dialogs
epic: EPIC-08
status: ready
priority: high
depends_on:
  - EPIC-05
  - BW-0802
  - BW-0805
created: 2026-09-02
updated: 2026-09-02
---

# BW-0807: Template Import Export Dialogs

## Goal

Add user-facing skill template import and export controls for the core editor.

## Scope

- Accept bare skill template codes and `[name;code]` chat wrappers through the EPIC-05 compatibility
  APIs.
- Convert decoded skill templates into the in-memory editor state without losing unresolved raw IDs.
- Preserve imported template names where supported by the wrapper contract.
- Show typed parse/decode/export failures without leaking dependency internals.
- Allow exact-source re-export while an imported template remains semantically unchanged.
- Allow canonical edited export only when encode/decode-back proof succeeds and validation policy
  permits it.
- Handle long names, long codes, empty input, invalid wrappers, overflow, narrow screens, and dialog
  keyboard focus.

## Out Of Scope

- Saved template library, clipboard permission policy beyond basic copy/paste controls, local
  storage, share URLs, equipment templates, paw-ned2 team templates, and party builds.

## Acceptance Criteria

- A user can import a supported skill template and see its professions, attributes, and skill bar in
  the editor.
- Unknown or dispositioned skill IDs appear as unresolved placeholders and are preserved until
  replaced or cleared.
- Export returns exact-source or canonical codes according to the EPIC-05 fidelity rules.
- Dialogs have clear error, empty, overflow, and keyboard-accessible states.

## Verification

- `npm run verify`
