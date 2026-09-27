# BW-2007 placement and fragment clipboard

Verified 2026-09-27 UTC in Chrome 153 on macOS 15.7.7, production preview at
http://127.0.0.1:4173/, desktop dark theme, 100% zoom. The fixtures are the
independent Protection A/B snapshots from Phase 5, with B slot 8 retaining
unknown raw template skill 99999. Native pointer and keyboard input used the
connected Chrome tools, not synthetic browser event dispatch.

## Implementation and observations

Version 1 guide MIME carries session, portable guide ID, generation and addressed
source facts. Bar fingerprints include raw overlays. The shared placement planner
owns duplicate/elite rules. Nested slot capture consumes a drop once, including
inactive cards. Prose uses a visible caret; catalog references are generic and bar
references bind the source. Guide drag-end only cancels transient state. External
semantic reconciliation invalidates remembered placement instead of using a
nearby arbitrary paragraph. Raw-only entries display their retained uncertainty.

[Native observations](phase7-browser.json), [complete raw swap output](phase7-raw-swap.md),
[placement output](phase7-placement-result.md), and [capture](phase7-placement.png)
record catalog-to-prose, catalog-to-inactive-empty-slot, between-build paragraph,
same-bar empty move and filled raw swap, cross-build copy with target duplicate
removal, bar-to-prose with source isolation, own-slot no-op, reorder, scrolling,
deleted-source rejection and Undo generation rejection. The raw swap retained
99999 in B7 and moved both the resolved ID and raw overlay for Remove Hex to B8.
Browser-reported outside dropEffect was `none`; the guide remained unchanged.
The equivalent standalone outside drag cleared slot 1, preserving its existing
policy; that test slot was then restored through the catalog.

Native Enter on Pick selected slot plus target click performs the same command;
Escape cancels and returns to prose. The optional P accelerator was removed after
single-letter delivery could not be established reliably in this tool session.
All controls remain keyboard operable with Tab/Enter. Same-document native copy
carried the versioned custom MIME and plain Markdown. Native paste created two
new IDs without altering either original; one Undo removed the entire paste.
A native external-text drag attempt left the document unchanged, but did not
establish delivery of a text DataTransfer. Malformed/external drop handling is
proved by integration assertions; final B03 security intake is retained in the
integrated matrix. Cross-document reference paste is retained for final B04.

## Validation

- Pinned npm `run lint`: passed.
- Pinned npm `run build`: passed, including all strict typechecks.
- Pinned npm `run test:run -- --maxWorkers=2`: 105 files, 668 tests passed.
- Prettier on changed placement/editor files: passed.

The focused planner and component suites assert at most one transaction, unchanged
sources, raw-only same-bar behavior, stale fingerprints/generation/session,
malformed envelope fields, deleted targets, cancellation, source/cross-document
clipboard remapping, and external/malformed HTML no-op. Existing standalone
regressions are included in the full suite. Two workers avoid the observed local
browser/resource contention; the final unmodified verify command remains mandatory.

Native composition remains unverified/deferred by user decision. No final
integrated B01–B10 or persistence acceptance is claimed by this phase record.
