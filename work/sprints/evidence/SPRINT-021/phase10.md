# BW-2010 reading and navigation evidence

2026-09-27 UTC, Chrome 153.0.8010.54 on macOS 15.7.7; production preview on isolated localhost:4173. Real pointer, keyboard, native app, clipboard and reload actions were used. Native composition remains unverified/deferred by user decision.

`GuideReader`, shared cards/mentions and `guide-navigation.ts` render the same applied semantic tree. Read exposes no catalog, editable document, mutation controls or guide mutation shortcuts. Details retain base/effective attributes, adjustments, titles, budget and code. Namespaced anchors resolve only against the matching restored guide and are excluded from game-template hydration. Source return retains exact raw bytes, focus and selection; read actions do not create authored transactions.

- [Initial reader run](phase10-browser.json): two independent Monk variants, detail values 14 and 11, correct per-card copied game codes, stable variant anchor and reload, native Command-Z no mutation, 200% Chrome zoom and reset. [Reader capture](phase10-reader.png), [zoom capture](phase10-reader-200pct.png).
- [Final context and source run](phase12-reader-browser.json): generic/bound/missing/detached/unknown references, long variant label, actual narrow Reader, 375 px client/scroll width with no horizontal overflow or editable DOM, Death Blossom tooltip 43 damage, exact Source selection 9915–9916 and focus restored after Read → Write. [Context tree](phase12-reader-contexts.txt), [narrow capture](phase12-reader-narrow.png).
- [Final original-example workflow](phase11-browser.json) and [Reader](final-reader.png): both independent cards survived named save/reload and Source Apply.
- `guide-reader.test.tsx` tests parity, safe links, unique anchors, copy addressing, mutation guards, matching restored fragments, raw preservation, focus/selection and no extra durable write. Phase 10 full suite: 685 tests; later full verification supersedes it.

Own implementation/browser criteria pass. Ticket acceptance stays in progress because incoming BW-2008 file reimport acceptance is still open; this record does not waive that dependency.
