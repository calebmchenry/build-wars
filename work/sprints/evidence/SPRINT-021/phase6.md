# Phase 6 — contextual inline references

Chrome 153.0.8010.54, macOS 15.7.7, production preview localhost:4173,
2026-09-27 UTC. Native desktop pointer/keyboard and Chrome's iPhone 16 device
profile (393×852, touch emulation). This is browser touch emulation, not a
physical-phone claim. Native composition remains unverified/deferred by user decision.

The shared generic projection renders catalog progression ranges and base costs
without borrowing a blank/selected build or choosing zero/default title ranks.
Bound references use their complete named snapshot through the existing selectors.
Missing and detached references retain identities and explicitly show catalog
ranges until repaired. A modal context/skill-ID editor requires an explicit choice.
Only inline mentions opt into the span tooltip wrapper; existing block surfaces
retain their wrappers. Local icon fallback and wrapping remain shared behavior.

Actual desktop checks:

- After selecting a third card, Shielding Hands under Protection A displayed 17
  damage reduction / 47 healing; B displayed 14 / 38; Generic displayed 3–18 / 5–50.
  [Captured tooltip text](phase6-context.json), [desktop screenshot](phase6-context.png).
- Explicitly rebound the missing reference to B. Neighboring characters and the
  detached identity remained intact, focus returned to Guide document, and Undo
  restored the missing identity. [DOM observations](phase6-repair.json).
- Deleted A after the reference-aware confirmation: its local mention became
  missing while the detached collision stayed detached. Undo restored A and its
  original tooltip. [Deletion capture](phase6-delete.txt).
- Inserted a bound Flare through both keyboard and pointer catalog activation.
  It became one paragraph after the trailing build, with all cards retained and
  focus returned. [Keyboard](phase6-insert.json), [pointer](phase6-insert-pointer.json).
  A gap cursor handles that explicit end target. Guide catalog titles now activate
  insertion; the standalone catalog keeps its existing wiki links.

Touch work found and fixed two issues: pointer/focus transitions could hide an
already-open tooltip by resetting its positioning flag, and tapping an atomic
mention needed to retain the tooltip without immediately opening the context
modal. A separate context action remains available. Touch details persist until
an outside tap or Escape. The final Chrome iPhone-profile run passed: a native
tap left the generic tooltip visible without a dialog, an outside tap dismissed
it, and tapping the separate context action opened repair.
[Touch screenshot](phase6-touch.png), [visible DOM result](phase6-touch.json).
Returning through Cancel restored the document caret. Native Backspace removed
one whole reference and Command-Z restored it without changing neighboring prose
([atomic editing](phase6-atomic.json)). Device emulation and DevTools were disabled
after the check.

Automated checks cover independent context after third selection, deletion/Undo,
detached collisions, generic title ranges, complete snapshot selector reuse,
inline DOM, repeated focus/touch visibility, explicit repair and end insertion.
The full suite is run with two workers while the native browser is open to avoid
unrelated 5-second catalog-render timeouts under concurrent browser/worker load;
assertions and timeout thresholds are unchanged. Final unmodified `npm run verify`
remains a separate required closeout gate.

Validation: **659 tests in 102 files**, full ESLint, focused Prettier checks and
production build/all strict TypeScript projects passed. Logs:
`work/runs/SPRINT-021/phase6-{tests,lint,build,format}.log`.
