# BW-2002 model and codec evidence

The public `Guide` alias now uses the generic semantic `GuideDocument`, with an
actual public-contract fixture. The old unpersisted text/build/party section
scaffold was removed after its only consumer (the domain contract test) was audited.
Domain reference helpers have no app/DOM/vendor imports.

Implemented strict node/context validation, complete snapshot validation through
the existing persistence validator, template expansion in an explicit mode, exact
unknown-field rejection, source/context escaping and opaque trailing whitespace /
CRLF preservation. Full exports contain one snapshot, never a second template.
Unsupported nested/media/unsafe/future input keeps the whole source. The codec
checks canonical growth and reinsertion equivalence before accepting a source.

- `test/domain/guide.test.ts`: contained reference/ID remapping, same-session
  external bindings, cross-document detached collisions, deletion impact and
  re-resolution on undo.
- `src/app/guide-codec.test.ts`: original Markdown fixture, two full snapshots
  with distinct mode/rune/title/effect/budget/raw facts, catalog-independent import,
  unknown identities, template shorthand, entity/backslash/quote/newline escaping,
  exact build/mention limits, deep/malformed/oversized structure and unknown fields.
- `src/app/guide-contracts.test.ts` and `guide-feasibility.test.ts`: golden
  grammar/literals/opaque bytes, hostile/conflicting versions/keys/URLs, source
  byte limits, history bounds and atomic retained-source failure.
- [All 630 tests](phase2-tests.txt) passed. The first concurrent build/lint/test
  run timed out in three existing 5-second UI tests; rerunning without competing
  compilers passed all assertions. No timeout settings or assertions were relaxed.
- [Focused final opaque/escaping checks](phase2-opaque.txt): 37 tests passed.
- Strict domain/app TypeScript, production build and ESLint passed. The final
  build log is [retained here](phase2-build.txt).

Native composition evidence remains unverified/deferred; this model/codec phase
makes no additional native-composition or completed-workflow claim.
