# BW-2001 second resume: non-deferred feasibility evidence

2026-09-27 UTC, isolated guide-workspace-burn worktree, no commits. Combined patch
SHA-256 cbe30a4b6ac2f33579c86e2b09e1c1d0cbfff7070513dd10a80383ee52123881
was checked and applied exactly once to the clean product baseline. Historical
patches and evidence were retained. Native composition completion/cancellation/
candidate verification is **unverified and deferred by user decision**, per the
[amendment](native-composition-deferral.md). Synthetic behavior tests remain required.

## Environment and dependency evidence

Chrome 153.0.8010.54, macOS 15.7.7 (24G720), production Vite preview
<http://127.0.0.1:4173/?guide-feasibility>, 1298×623 CSS pixels, scale 1, dark theme.
Input used actual browser typing, pointer clicks, native Chrome Edit menu, keyboard
shortcuts and clipboard paste. Initial and updated production builds were reloaded.

- [Author environment/resource capture](resume2-author-environment.json).
- [Composer environment/resource capture](resume2-composer-environment.txt): no
  GuideFeasibility asset loaded; author capture includes its lazy JS/CSS.
- [Installed dependency tree](resume2-dependency-tree.txt) and
  [strict TypeScript/production build](resume2-phase1-build.txt).
- [All 620 Vitest tests passed](resume2-phase1-tests.txt), including 33 focused
  feasibility/grammar/composition/history tests. Lint passed with one temporary
  entry Fast Refresh warning, then the lazy entry was moved to an exported component.
- Official documentation rechecked: [Tiptap React/Vite](https://tiptap.dev/docs/editor/getting-started/install/react),
  [Tiptap MIT license](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md),
  [remark-directive](https://github.com/remarkjs/remark-directive). Pinned versions
  retain the prior official registry/React 19 peer precheck. Offline ci lacked
  zwitch; reviewed official-registry ci with scripts disabled succeeded.
- Weather report fetch failed (DNS via shell; inaccessible via web). Orchestrated
  strategy was already explicitly selected; no planning/delegation lane was run.

## Actual actions and results

| Action                                                                                                      | Expected and observed                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Place caret after final paragraph, type ` Calm timing.`                                                     | Exact text appended; revision 13, one undo group; caret/focus retained.                                                                                    |
| Increase Fire Magic through existing inspector                                                              | Rank 8→9; named-bound Flare 44→47 damage; revision 14, two undo entries.                                                                                   |
| Command-Z in inspector, then in prose                                                                       | Attribute then complete prose group reversed separately; rank 8 and original paragraph restored.                                                           |
| Native text ` Native note.`, inspector increase, Chrome Edit → Undo                                         | Rank restored to 8 while prose remained; native menu used, not app Undo.                                                                                   |
| Focus prose, Chrome Edit → Undo again                                                                       | Whole native text entry removed; build unchanged; revision 32, zero past/two future.                                                                       |
| Select `observations`, Command-B                                                                            | Rendered strong mark and `**observations**` in source.                                                                                                     |
| Move caret, catalog generic Flare click, type after it                                                      | Mention at remembered caret, neighbor text retained; build unchanged. Found gesture/typing grouping bug and fixed it with regression coverage.             |
| Open/apply canonical source                                                                                 | Rendered text/marks/mention/full snapshot unchanged; no-op creates no history entry.                                                                       |
| Long fixture load and typing                                                                                | 419 blocks/16 cards/601 mentions rendered. Initial repeated tooltip projections stalled input; cached by immutable snapshot and reran typing successfully. |
| Long Open Source then Apply                                                                                 | Complete observed source retained the typed text and full builds/mentions; Apply succeeded.                                                                |
| Replace via source with heading/paragraph/list/quote/fenced code and no builds                              | Applied as one transaction, rendered all blocks, removed prior build inspector, catalog still available.                                                   |
| Native Return after second list item, type `Third`                                                          | Third list item created; surrounding quote/code retained.                                                                                                  |
| Paste text into paragraph, insert generic mention, Right across paragraph/list boundary, type neighbor text | Paste stayed text, generic atom retained; neighboring text inserted into the first list item without loss or slot mutation.                                |

[Writing DOM](resume2-b01-writing.txt), [writing screenshot](resume2-b01-writing.png),
[long screenshot](resume2-long.png), [observed long source](resume2-long-source.txt).
The long-source DOM evaluator timed out; the actual accessibility value and Apply
result were inspected instead. This is not treated as missing application data.

## Capacity and durability slice

[Final browser measurement](resume2-capacity-browser-final.json): 70,233 source
UTF-8 bytes/code units; 11.8 ms serialize, 141.1 ms checked parse; 1,225.3 ms for
110 history commits; 100 retained entries/7,023,308 serialized bytes. Candidate
aggregate envelope was 1,120,264 bytes/code units (about 2.24 MB UTF-16 content),
1.8 ms JSON serialization and 3.9 ms real storage write/read/remove.

The [pagehide probe](resume2-pagehide.json) queued revision 1 with a 30-second delay,
then reloaded within 6 seconds. Pagehide flushed the pending 70,233-byte source;
the next page read it, parsed successfully and removed the temporary key. The
cached source projection lookup measured 0.1 ms; this is not a total browser
pagehide latency claim. The real `build-wars:v1` key was never used by either probe.
A fake-timer regression separately proves 500 ms revision debounce, no duplicate
flush on equal revisions and pending flush cancellation of the timer.

The accepted [ADR](../../../../compendium/decisions/0003-guide-editor-and-markdown-contract.md)
freezes grammar, ownership, limits and the measured design. The complete mixed
library, quota, legacy record and final actual-browser matrix remain explicit
Phase 9/12 requirements. These slice results do not complete dependent tickets.
