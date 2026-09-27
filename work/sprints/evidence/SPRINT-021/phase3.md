# Phase 3 — workspace transactions and history

2026-09-27 UTC, isolated guide-workspace-burn worktree; no commits.

The guide is a real runtime document kind with complete snapshots, session/revision addressed commands, independent build selection and prose/slot/no-target intent. Unaddressed global editor actions are rejected. Shared reducer edits preserve full raw overlays and independent sibling snapshots. Immutable snapshot validation and projection caches preserve captured-target identity across selection and unrelated edits; replacement/Undo invalidates asynchronous generations.

One bounded semantic history owns prose, slots, attributes, delete/duplicate/reorder and source Apply. UI/no-op/stale actions create no entries; composition candidates stay private until one accepted completion, cancellation publishes nothing. Source-only edits retain exact raw/base state, dirty guards, whole-source diagnostics and explicit stale replacement acknowledgement. Apply Undo restores the preceding source recovery. Fragment intake validates before fresh-ID remapping and detaches external cross-document contexts.

Guide save/autosave/pagehide and direct v2 serialization remain explicitly blocked until Phase 9. The prior durable draft remains intact. Exhaustive union branches, library summaries, clone/materialize/fingerprint and backup clone behavior compile; guide save is visibly memory-only.

Validation: production build and all strict TypeScript projects passed; ESLint passed; all **636 tests in 99 files passed**. Includes six transaction/workspace tests, three synthetic editor composition/history tests, existing capacity/codec contracts and legacy workspace/storage/backup regressions. Logs: `work/runs/SPRINT-021/phase3-{build,lint,tests,focused}.log`. Native composition is still unverified/deferred by user decision; no new native claim is made here.
