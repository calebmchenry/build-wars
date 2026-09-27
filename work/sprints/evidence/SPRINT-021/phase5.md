# Phase 5 — independent cards and addressed game files

Chrome 153.0.8010.54 on macOS 15.7.7, production preview at localhost:4173,
2026-09-27 UTC. The two complete Protection variants in
[the captured source](phase5-variants.md) retain different purchased ranks and
rune/headgear adjustments. Current, saved, blank and template insertions allocate
fresh identities; one inspector outside contenteditable reuses the existing
profession, attribute, bonus, title, effect, budget and validation controls.

Actual browser checks copied A's original exact code and B's normalized code
([clipboard bytes](phase5-copy.json)). Native folder Save wrote A's exact 23 bytes
to `SPRINT-021 Protection A.txt` in the isolated test folder; the preserved
[file bytes](phase5-native-file.txt) match. Undo restored the card name without
changing that external file. Native Load of `E Surge Hero.txt` into B was canceled
once, then accepted: only B became Mesmer/Ritualist. Invalid pasted code was
rejected without changing either card; Undo restored B's Monk snapshot.
The download fallback wrote B's actual normalized 24-byte code to
`work/runs/SPRINT-021/native-game-files/Protection B.txt`.

A browser regression was found: native Edit → Undo had no editing-manager target
when a new guide had only build-control edits and no prose typing. A private,
non-authored native target now enables both directions, while semantic history
remains the only document history. The failed observation is retained in
`phase5-inspector-undo.txt`. Fresh controls-only Undo and Redo now restore the
Protection rank 11→12→11; see [Undo](phase5-native-controls-only-undo.txt) and
[Redo](phase5-native-controls-only-redo.txt). Focus remains on the inspector.
Native composition remains **unverified/deferred by user decision**.

Delayed read/write/clipboard tests cover selection versus target edit, deletion,
Apply, Undo and session replacement. A delayed write reports captured bytes
already written and cannot rename a changed target. Copies preserve raw overlays
and library sources; cancel creates no transaction. All **652 tests in 101 files**,
full lint, production build/strict types, and focused formatting passed. Logs are
`work/runs/SPRINT-021/phase5-{tests,lint,build,format}.log`.

Final B08 fallback upload is still pending: the browser upload tool's security
permission request was dismissed before a decision. No upload success is claimed
and no alternate tool was used to bypass that check. This does not replace the
successful native Load evidence; final transfer verification remains required.
