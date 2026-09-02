---
id: BW-0808
title: Validation Responsive Polish and Closeout
epic: EPIC-08
status: ready
priority: high
depends_on:
  - BW-0803
  - BW-0804
  - BW-0805
  - BW-0806
  - BW-0807
created: 2026-09-02
updated: 2026-09-02
---

# BW-0808: Validation Responsive Polish and Closeout

## Goal

Integrate rule-engine feedback into the editor, finish responsive/accessibility states, and close
out EPIC-08.

## Scope

- Run `validateBuild` against the current editor state with caller-supplied EPIC-03 and EPIC-04
  catalog facts.
- Show a compact global validation summary using `valid`, `complete`, `resolved`, and `exhaustive`.
- Show inline issues near affected professions, attributes, skill slots, and template dialogs when
  rule-engine locations are available.
- Treat warnings, incomplete state, and unresolved imports as non-blocking for editing.
- Block canonical export on proven validation errors or lossy encode failures; keep exact-source
  re-export available for unchanged imported templates.
- Verify desktop-browser-first layout plus narrow-screen behavior, focus states, loading/empty/error
  states, and dialog overflow.
- Update app tests, compendium notes, ticket status, and sprint closeout records as required by the
  execution sprint.

## Out Of Scope

- Local library persistence, hosted sharing, equipment validation, title ownership, party validation,
  guide authoring, search across saved builds/guides, analytics, auth, and deployment.

## Acceptance Criteria

- A user can create, edit, validate, import, and export a playable single-character skill bar.
- Validation is visible globally and inline without blocking normal editing flow.
- Layout is usable in a desktop browser window and does not break on narrow screens.
- `EPIC-08` completion records clearly list deferred work for EPIC-09, EPIC-15, and later UI/data
  epics.

## Verification

- `npm run verify`
