# ADR 0003: Guide editor and Markdown contract feasibility

- Status: accepted for implementation after the BW-2001 slice gate, 2026-09-27 UTC. Native composition verification remains unverified/deferred by user decision.
- Date: 2026-09-26 (America/New_York).
- Sprint: [SPRINT-021](../../work/sprints/SPRINT-021.md).
- Evidence: [execution record](../../work/sprints/SPRINT-021-EVIDENCE.md).

The current decision below supersedes the historical provisional findings retained
later in this record. It accepts the bounded integration design, not completion
of the full guide workflow or its final browser matrix.

## Accepted contract — 2026-09-27 UTC

Choose Tiptap/ProseMirror with vendor history disabled, neutral semantic frames,
atomic inline mentions/block cards and one inspector outside contenteditable.
Keyboard and native menu Undo reverse real text and inspector edits chronologically.
Composition candidates remain private until completion; canceled candidates publish
nothing. Synthetic completion/cancellation tests remain required. Native composition
completion/cancellation/candidate evidence is **unverified, deferred by user decision**.
No alternative stack or inline panel hosting was needed after these checks. React
node views carry build IDs only. Complete snapshots remain the semantic authority.

Phase 5 exposed a Chromium native-menu edge case before any prose edit. Keep a
tiny private contenteditable history target outside the semantic editor and seed
literal insertions plus a native undo, restoring the prior focus/selection. Native
history events on that target are intercepted by the same semantic owner. The
target is excluded from authored content, snapshots, clipboard and persistence.
This narrowly uses the deprecated `execCommand` editing-buffer capability
documented by [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand);
no untrusted HTML enters it. Actual controls-only native Undo/Redo passed in
[Phase 5](../../work/sprints/evidence/SPRINT-021/phase5.md). Keyboard/toolbar history
remains available in environments without that API.

Preserve editor instances during typing; reconcile external changes by minimal
content replacement and a nearby selection. Snapshot-only edits do not touch the
vendor document. Cache bound tooltip projections by immutable snapshot and catalog,
never active selection. A long-fixture stall from repeated projections was fixed
and actual typing rerun. Distinguish text changes from marks/atoms so formatting,
reference insertion and build gestures close typing groups. Source buffer lifecycle,
explicit dirty replacement guards, identity/remapping and stale command rules are
exactly the tables in [SPRINT-021](../../work/sprints/SPRINT-021.md); these are binding
requirements for subsequent phases, not features claimed complete by the slice.

### Final integration refinements

The v1 structured clipboard envelope carries `session`, `generation` and `guideId` alongside validated nodes. Only a match of all three preserves references to builds outside a copied fragment as local. Source Apply/import/Undo replacements invalidate the generation; missing generation is external. This prevents an old copied reference from binding to an equal ID after document replacement. Contained builds/references still remap together. The native collision regression and fixed rerun are recorded in [final evidence](../../work/sprints/evidence/SPRINT-021/phase12.md).

Named library and backup envelopes are v3, guide snapshot v1. Reader is an applied-tree projection with namespaced local anchors; Source focus/selection remains UI state. The final long v1 golden fixture is 70,233 bytes, 16 builds and 601 mentions. Full workflow acceptance remains open for the upload permission gate.

### Wire grammar v1

- Root metadata is the first top-level `:::bw-guide` container. Its opening line is
  exactly the name plus optional spaces; its closing line is `:::` plus optional
  spaces. LF and CRLF are accepted. Interior bytes are strict JSON with only
  `version`, `id`, `title`, `summary`, `tags`, `sources`; all are required.
- `version` is 1; IDs match `[A-Za-z0-9][A-Za-z0-9._-]{0,127}`. Title is at most
  160 code units, summary null or at most 2048; at most 24 tags of 80 code units.
  Source entries have required `label`/`url` and optional `attribution`, `license`,
  `licenseUrl`, `revision`, `notes`, each at most 2048 code units. URLs use the
  common HTTP(S), mailto or local-anchor allowlist. Metadata is capped at 64 KiB.
  Library integration must validate these fields without truncating guide content.
- `:::bw-build` is top-level only. Exact full keys: `version:1`, `id`,
  `snapshotVersion:1`, `snapshot`. The snapshot is complete current Build v4 plus
  `pveBudget` and the entire `rawTemplate`. Its nested build ID equals the embed ID.
  Names belong only to `snapshot.build.name`. Duplicate IDs are fatal.
- Input-only shorthand keys are exactly `version:1`, `id`, `template`, optional
  `mode` (`pve` default or `pvp`). No budget/title/adjustment shorthand fields are
  admitted in v1: use full snapshots for those facts. Shorthand expands through
  existing template compatibility/catalogs. Template plus snapshot/version or a
  mode beside a snapshot is fatal. Full output never includes a competing code.
- Inline forms `:bw-skill[]{...}` and `:bw-skill{...}` are equivalent. Canonical
  output omits `[]`. Empty label only; fields are separated by whitespace and have
  double-quoted values, with character entities for quotes/ampersands. Duplicate
  fields, shorthand attributes and backslash value escapes are rejected.
  Generic: `skill="catalog:skill:194" context="generic"`; local: that skill plus
  `build="gb-flare"`; detached: skill plus `context="detached"`, `guide`, `build`,
  `reason`. No other fields are accepted. IDs use an explicit catalog namespace;
  unknown catalog IDs and missing local builds remain unresolved facts.
- JSON has depth/token bounds, rejects duplicate/dangerous keys and nonfinite
  numbers. Reserved unsupported `bw-` forms/versions retain the whole source.
  Ordinary unmarked Markdown gets a new portable guide ID. Code is literal;
  escaping the leading colon makes annotation-looking text ordinary text.
- Supported blocks/marks: paragraphs, headings 1–6, emphasis/strong, lists,
  blockquotes, inline/fenced code, links, line breaks and thematic breaks.
  Ordinary Markdown uses canonical LF, `-` bullets, `*` emphasis, `**` strong and
  fenced code. Vendor node IDs do not participate in semantic equality.
- Unknown top-level blocks, including HTML, are inert opaque source spans with
  exact internal bytes/line endings. They render as text only. Unknown nested
  constructs, remote image syntax, unsafe links or a changed meaning after
  canonical reinsertion retain the whole raw source and block visual Apply.
  Parse/serialize/parse equivalence is checked before source is accepted. Spans
  are parser offsets and diagnostics report 1-based line/column. Parsing stops at
  the first fatal diagnostic, within the 100-diagnostic cap (none omitted).

### Accepted budgets and dependency set

Freeze `GUIDE_LIMITS`: 1 MiB canonical source, 2 MiB raw recovery, 10,000 nodes,
depth 32, 32 builds, 2,000 mentions, 64 sources, 64 KiB metadata, 100 diagnostics;
100 history entries/16 MiB retained serialized history content and 750 ms adjacent
typing. Library admission is 8 MiB UTF-8 and backup 16 MiB; also report JS code
units/UTF-16 cost. These are admission limits, not a promise of browser quota or
heap size. Native quota failure must retain memory and offer export. Oversized
intake/transactions leave prior document and recovery intact; prune whole oldest
history entries and never the current frame. Large raw buffers remain separate
from canonical source and cannot force unsupported visual editing.

The representative fixture has 419 top-level blocks (400 prose/code additions),
16 builds and 601 mentions. Production Chrome measured 70,233 UTF-8 bytes/code
units, 11.8 ms serialization, 141.1 ms checked parse, 1,225.3 ms for 110 commits,
100 retained entries / 7,023,308 serialized bytes. The candidate aggregate envelope
with eight saved copies and a draft/recovery was 1,120,264 bytes/code units,
1.8 ms JSON serialization and 3.9 ms actual temporary-storage write/read/remove.
Pending revision 1 survived actual browser reload/pagehide with all 70,233 bytes
and parsed successfully. This prototype uses separate disposable probe keys;
real envelope admission, failures and legacy mixed records remain Phase 9 gates.
Accept the observed sub-250 ms representative codec operations and roughly 12 ms
per isolated history commit. Do not serialize a library on UI-only actions or
each text edit: use revision scheduling/debounce, flush pending on pagehide, cache
per-document serialization/byte projections, and remeasure the integrated path.

Pin Tiptap core/react/pm/starter-kit 3.31.3, unified 11.0.5, remark-parse/stringify
11.0.0, remark-directive 4.0.0. Official React/Vite and MIT documentation was
rechecked; installed dependency tree and all strict TypeScript builds pass. The
slice authoring chunk is approximately 544 kB / 171 kB gzip. Browser resource
captures show it loads for the author route and is absent from standalone composer.
The prior baseline entry was 8,138.52 kB / 857.52 kB gzip; exact current build output
is retained with evidence. Remove temporary native/composition probes during
consolidation; the successful editor/codec/history modules become production code.

Browser setup: Chrome 153.0.8010.54, macOS 15.7.7, 1298×623 viewport, 100% zoom,
dark system theme, actual Chrome keyboard/menu and tab pointer/paste input. Native
folder support and upload/download fallback are checked through the existing
feature detection and must be exercised in B08. No broad browser permission or
architecture question remains. [Current phase evidence](../../work/sprints/evidence/SPRINT-021/resume2-phase1.md)
records the checks and limits of these observations.

## Historical provisional findings

## User-authorized verification amendment — 2026-09-27 UTC

The [recorded user decision](../../work/sprints/evidence/SPRINT-021/native-composition-deferral.md)
supersedes composition-only stop instructions in the historical findings below.
Native completion evidence remains unverified/deferred; composition-safe behavior
and automated regressions remain required. All other BW-2001 checks must pass
before accepting this ADR and advancing dependent work.

## Audited integration boundaries

| Existing seam                   | Finding and required integration                                                                                                                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/guide.ts`           | Section-based text/build/party scaffold; no persisted guide kind. Evolve it into a generic semantic guide while auditing existing contract fixtures. Domain tsconfig excludes DOM and app imports.                                       |
| `src/app/persistence-schema.ts` | `PersistedBuildSnapshot` contains Build v4, PvE budget and raw template overlay. Reuse its validator and clone operations through an app adapter. Library envelope is v2 at `build-wars:v1`; no guide may be written under that version. |
| `src/app/workspace-state.ts`    | Runtime union is build/build-set with one active editor. Guide needs addressed commands and complete snapshots, a runtime generation, explicit replacement guards and exhaustive union handling.                                         |
| `src/app/App.tsx`               | Tooltip values derive from the active editor. Autosave/pagehide run at this ownership boundary; catalog-error early return currently hides the composer. Guide recovery/export must remain available independently of catalogs.          |
| `FocusedSkillCatalog.tsx`       | Catalog click/keyboard handlers currently call slot-placement helpers. Prose intent requires a separate mapped selection bookmark and no fallback to a remembered build slot.                                                            |
| `drag-payload.ts`               | Current slot payload carries only a slot index. Guide placement needs a version, session, source build/slot/fingerprint and handler-owned target.                                                                                        |
| `SkillTooltip.tsx`              | Existing trigger is a `div`; an inline mention requires inline-safe trigger markup and separate generic versus addressed-build context.                                                                                                  |
| `backup-restore.ts`             | Backup v2 and build/build-set branches need the same exhaustive guide audit as the library. Historical v1/v2 handling and anti-wipe protections must remain intact.                                                                      |

## Provisional ownership contract

Keep a vendor-neutral `GuideDocument<BuildPayload>` as semantic authority; its app
instantiation contains complete `PersistedBuildSnapshot` values. The editor's
projection carries build IDs rather than a second authored payload. Guide-local
build ID equals nested `Build.id`; the build name is the only card label. Portable
guide IDs survive whole-document copies; runtime sessions and library record IDs
are separate. A build-only copy allocates a fresh nested/build ID together.

Use an atomic card inside prose and one selected inspector outside contenteditable.
Reuse the existing attribute/rune/headgear controls and reducers. The experiment
proved a real Fire Magic edit changed both the card and the named-build mention
projection without a second live build editor becoming authoritative.

One guide history owns prose and build commands. The experiment disabled Tiptap
history and used neutral semantic frames. Selection/bookmarks remain transient.
Native undo and composition must still be proved before accepting this design;
vendor step/bookmark history remains the bounded alternative if that proof fails.
Lexical was not tested: absence of native access would prevent the same required
proof for either candidate, and is not evidence that Tiptap itself failed.

The sprint's single-draft and source lifecycle tables remain requirements:
Composer/Guide replaces the working document only through a dirty guard; Source
holds exact unapplied bytes with a base revision; Apply commits atomically;
failed Apply preserves the last applied guide; Apply undo/redo restores recovery
alongside semantic state. These complete lifecycle transitions are not implemented
by the archived experiment's simple source control.

## Provisional syntax and failure policy

The experiment exercised top-level `:::bw-guide` and `:::bw-build` containers with
strict JSON, and `:bw-skill[]{skill="catalog:skill:194" build="gb-flare"}` inline
references. Ordinary text, headings, emphasis, strong, lists, links, blockquotes
and inline/fenced code have neutral node representations. Remark serializes an
empty inline label without `[]`; both forms parsed in the experiment. This detail
must be frozen with the full golden corpus before BW-2002 begins.

A full build output contains `version: 1`, its `id`, `snapshotVersion: 1` and one
`snapshot`. Input-only `template` conflicts with `snapshot`; full snapshot payloads
require Build v4. Template mode defaults to PvE, independent of selection. The
experiment supports only `template`/`mode` shorthand, so the ticket still needs
exact decisions for any permitted budget/title/adjustment shorthand fields.

Generic context uses `context="generic"`; local context uses `build`; detached
context uses `context="detached"`, `guide`, `build` and `reason`. Catalog IDs are
explicit `catalog:skill:<id>` strings in source, distinct from game template IDs.
The catalog confirmed Flare is catalog skill 194; an initial guessed ID 154 was
corrected before the recorded Fire Magic context check.

A bounded JSON tokenizer rejected duplicate/dangerous keys and nonfinite numbers.
Conflicting representations, unsupported versions, nested unsupported content,
unsafe URLs and exceeded limits leave a whole recoverable source rather than
partially applying. The focused corpus demonstrated code literalness and opaque
CRLF retention for its sample, but exact opaque boundary whitespace, arbitrary
nesting and hostile-input coverage remain incomplete. No regex rewrite over
arbitrary Markdown is proposed. Unknown IDs must remain explicit unresolved facts;
complete snapshots must be readable without catalogs.

## Dependency precheck and experiment

The [official Tiptap React instructions](https://tiptap.dev/docs/editor/getting-started/install/react)
describe React/Vite integration with React bindings, ProseMirror and StarterKit.
The experiment used [React node views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react)
for atomic mentions/cards and disabled the [Undo/Redo extension](https://tiptap.dev/docs/editor/extensions/functionality/undo-redo).
The [Tiptap license](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md) is MIT.
Registry metadata for 3.31.3 explicitly includes React/React DOM 19 peer support.

The independent Markdown candidate follows [remark's AST processor](https://github.com/remarkjs/remark)
and [remark-directive](https://github.com/remarkjs/remark-directive). Official npm
metadata reported MIT for unified 11.0.5, remark-parse 11.0.0, remark-stringify
11.0.0 and remark-directive 4.0.0. Those exact versions and Tiptap core/react/pm/
starter-kit 3.31.3 were provisionally installed with lifecycle scripts disabled.
The dependency tree, successful build and focused tests are retained in evidence.
Packages were removed from active dependency manifests after the blocked gate.

The experimental production build emitted an authoring chunk of 539.23 kB
(169.06 kB gzip) and 0.79 kB CSS (0.37 kB gzip). Entry JavaScript changed from
8,138.52 kB / 857.52 kB gzip to 8,140.73 kB / 858.85 kB gzip. The conditional
experiment route used a dynamic import. These build results show code splitting;
network loading behavior in a final integrated production preview is unverified.

## Capacity evidence and unresolved work

The synthetic sample contains 16 complete builds, 600 mentions and approximately
1,003 top-level nodes (including 400 prose/code additions and 599 separate mention
paragraphs). It is larger in block count than the intended approximately 400-block
release fixture and must be reshaped before the capacity gate is frozen.

One local Vitest measurement yielded 72,906 UTF-8 bytes / JS string code units,
7.016 ms serialization, 94.411 ms parsing and 955.326 ms for 110 history commits;
100 history entries remained. These are a single process observation, not a browser
latency guarantee. The experiment still serializes whole frames on edits; it does
not satisfy revision-cached serialization, aggregate library admission,
autosave/pagehide measurement or composition grouping. Initial limits in the
sprint remain hypotheses, not accepted performance or quota guarantees.

## Initial blocker and resumption (historical)

Native Chrome app selection returned `Computer Use was not approved to use Google Chrome`.
The approved tab API could type and route keyboard undo, but Option-E followed by E
produced plain `e`, not a demonstrated IME composition. Native menu/beforeinput
undo and actual composition were therefore not accepted as verified. Do not
substitute synthetic events or Unicode paste for this gate.

Resume only with an authorized native browser input surface or another supported
way to demonstrate real composition and native undo. Restore the archived patch
in this isolated worktree, address its documented gaps, rerun the complete BW-2001
checks, and freeze the ADR only after they pass. BW-2002–BW-2012 remain gated.

## Resumed evidence — 2026-09-27 UTC

Native Chrome permission is now verified. Native Edit → Undo emitted trusted
`beforeinput/historyUndo` events and reversed inspector and prose entries in
order. The resumed slice fixes publication of intermediate composition candidates
and double keyboard-history routing, with seven passing focused tests. These
changes remain experimental and archived; they do not select a production stack.

Native Option-E/E produced trusted composition start/update/input and an untrusted
`compositionend`. The result repeated with a passive recorder and a minimal
uncontrolled textarea without React/Tiptap. Its cause is unknown; no fully native
completion, cancellation or IME candidate proof is claimed. Permission is no
longer the blocker, and switching editor brands is not supported by this control
experiment. The complete browser, codec and measured capacity gates remain open.

See the [dated evidence](../../work/sprints/evidence/SPRINT-021/resume-20260927.md)
for actions, exact resumption question, captures, tests, cleanup and the combined
[resumed patch](../../work/sprints/evidence/SPRINT-021/resume-feasibility-slice.patch).
Original evidence and the initial blocked manifest remain historical artifacts.
Active product code and dependencies were restored again. BW-2001 is blocked,
no ticket is done, and no contract/budget is frozen by this ADR.
