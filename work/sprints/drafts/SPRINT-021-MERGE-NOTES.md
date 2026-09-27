# SPRINT-021 Merge Notes

## Inputs and workflow

The authoritative inputs are EPIC-20, its twelve BW tickets, the guide workspace
brief and SPRINT-021 intent. All three independent draft lanes completed using
`gpt-6-astra`, `gpt-5.6-sol`, and `gpt-5.5` at xhigh. All three combined cross-critiques completed successfully. Each model reviewed
only the other two drafts; no reviewer lane was lost.

Planning uses the explicit ticket-burn contract: no routine interview, no product
code or commits, isolated worktree only, and automatic final approval after an
executable consistency check. BW-2001 settles routine editor/syntax decisions
through a bounded feasibility experiment rather than an additional user interview.

## Draft strengths

- Astra gives the most concrete account of populated snapshots, stale async
  operations, detached fragment references, raw-source recovery limits, early
  persistence write guards, canceled-drag deletion, catalog-independent autosave,
  and truthful browser acceptance. Its extensive file audit is useful for execution.
- Sol supplies a useful generic `GuideDocument<BuildPayload>` contract with an
  injected snapshot adapter, detailed source/identity rules, explicit persistence
  branch inventory and a production-preview browser matrix. Its proposed source
  model makes unapplied edits distinct from the applied document.
- GPT-5.5 maps the twelve tickets into a straightforward dependency sequence and
  keeps each user-visible workflow represented. Its hard feasibility stop and
  requirement to leave incomplete work open preserve the epic's delivery boundary.

## Local code feasibility findings

These are static planning observations, not implementation evidence.

- The existing generic `BuildSet<Payload>` supports using a generic Guide payload
  without creating another Build schema or importing app types into the domain.
  Prefer existing complete persisted snapshots through injected adapters over a
  second neutral snapshot definition that must be kept synchronized indefinitely.
- Keep guide nodes fully populated. Existing build-set active snapshots may be
  null while `workspace.editor` owns them; copying that pattern increases save,
  tooltip and inactive-target race risk for a document with many visible cards.
  Existing composer/build-set conventions can remain unchanged behind their branches.
- `SkillBar` has both slot-only drag identity and remove-on-failed-drag behavior.
  Guide-specific target/session/outcome handling must suppress canceled deletion
  and retain legacy standalone regressions. Repeated cards also require unique
  DOM IDs; inline tooltip roots must be phrasing content rather than divs.
- `App.tsx` catalog failure and null `savedWith` guards affect both recovery UI
  and autosave/pagehide. Fixing only the visible error shell is insufficient.
- Persistence writers hardcode envelope v2 and selectors treat every non-build
  as a build-set. Adding a runtime guide kind must have an early no-write guard
  until complete envelope/backup migration and serialization support exist.
- Source/clipboard limits need a bounded raw recovery ceiling distinct from the
  applied format limit. Existing generic string limits cannot hold a guide.
- Async game-file and guide-file results need session/target/revision checks.
  Guide anchors must coexist with the existing template-share fragment parser.
- Guide scaffold consumers include the domain barrel and
  `test/domain/contracts.test.ts`; there is no persisted legacy guide migration.

## Critique decisions and final synthesis

Sources: [Astra critique](SPRINT-021-GPT6ASTRA-CRITIQUE.md),
[Sol critique](SPRINT-021-GPT56SOL-CRITIQUE.md), and
[GPT-5.5 critique](SPRINT-021-GPT55-CRITIQUE.md).

| Finding / reviewer                                                                      | Disposition and final decision                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conflicting applied document / active-editor authority (all three)                      | Accepted. Every guide snapshot remains complete; controls are revision-keyed projections and immediately publish durable changes. Existing build-set/composer conventions remain behind their own branches.                                                                                                                                                     |
| External history and inline inspector are unproved assumptions (Sol)                    | Accepted with bounded scope. Start with an atomic card and separate selected inspector plus neutral history. Test native undo, IME, build edits and external replacement. Evaluate vendor steps/bookmarks as the same unified history if the default fails. Do not require every combination of two editors, two histories and two inspectors to be prototyped. |
| Repeated snapshot types risk drift (Sol; local audit)                                   | Accepted. Generic domain/codec payload plus the existing PersistedBuildSnapshot and injected adapter avoids a second handwritten durable snapshot shape. Portable snapshot v1 remains an explicit wire contract, not accidental persistence JSON.                                                                                                               |
| Too many identities / nested ID invariant missing (all three)                           | Accepted. Final plan chooses one stable guide build identity whose serialized value equals nested Build.id. Mismatches and duplicates are invalid. Prose/vendor IDs stay transient. This deliberately replaces the preliminary merge note's separate-ID proposal; there are no legacy guides needing compatibility with it.                                     |
| Card label and saved-record metadata authority unclear (Astra, Sol)                     | Accepted. Build.name is the sole card label. Guide title/tags are authored authority; saved record name/tags mirror them. Source buffers are never rewritten to fake synchronization after metadata changes.                                                                                                                                                    |
| Source-only dirtiness, Apply undo and invalid-source copies incomplete (Astra, GPT-5.5) | Accepted. Explicit lifecycle table separates applied history from recovery revisions, preserves prior buffer on Apply undo, prevents stale clean projections and guards invalid-source transitions. Whole-guide copy remaps record/session identity only; fragment paste remaps contained builds and durably detaches external targets.                         |
| Detached references not representable (Astra)                                           | Accepted. Generic/local/detached is a persisted and portable union; equal destination IDs cannot silently resolve foreign references. Missing local target remains distinct so delete undo restores it.                                                                                                                                                         |
| Raw, aggregate, export-growth and history limits missing (Astra, Sol)                   | Accepted. Separate candidate budgets, canonical export/reimport closure, precommit visual/paste checks and oversized-transaction rejection. Measure long fixture and actual localStorage/fingerprint/autosave path in BW-2001; freeze before broad implementation. Numbers are hypotheses, not demonstrated capacity.                                           |
| Synchronous whole-envelope fingerprinting can stall typing (Sol)                        | Accepted. Durable revisions drive scheduling; cache per-revision projections and debounce serialization. Hover/selection and each raw keystroke must not serialize the whole library. No implicit IndexedDB expansion.                                                                                                                                          |
| Async file/template operations can target replaced cards (Astra, Sol)                   | Accepted. Capture runtime generation, target/revision and exported snapshot; revalidate app mutations after awaits. Inspect written bytes and distinguish external writes from undoable guide changes.                                                                                                                                                          |
| One syntax and separate guide/Build/library/backup versions required (Astra)            | Accepted. One strict-JSON/directive candidate with explicit catalog IDs, literal code/escape tests and source-only fallback; no YAML dialect added. Guide/portable snapshot v1, current Build v4 and next envelope/backup v3 have separate contracts. Recheck versions at execution.                                                                            |
| Browser evidence deferred too late (GPT-5.5, Astra)                                     | Accepted. Browser-sensitive phases carry their own gates. BW-2012 replays or proves continuity against the final integrated preview. BW-2008 owns in-memory source; BW-2009 owns reload durability, avoiding a dependency cycle.                                                                                                                                |
| Provisional package setup is needed to prove feasibility (Astra, GPT-5.5; local audit)  | Accepted. Install candidates only during execution after official-doc/license precheck; final selection/pinning follows passing proof. Remove rejected experiment residue without reverting unrelated work.                                                                                                                                                     |
| Interim guide autosave can corrupt v2 (all three)                                       | Accepted. BW-2003 introduces explicit old-schema write guards and preserves the prior durable draft. BW-2009 completes migrations, exhaustive unions and catalog-independent autosave/pagehide before activation.                                                                                                                                               |
| Global cancellation change breaks standalone compatibility (Astra, GPT-5.5)             | Accepted. Guide dragend never deletes; retain separate standalone policy and its existing regression. Accepted changed gestures create one transaction; canceled/unchanged/rejected actions create zero.                                                                                                                                                        |
| Two hidden surface drafts add storage scope (Astra)                                     | Accepted. Keep one working document with explicit guarded create/open/replace. Capture current standalone build only through a named action; no fallback to a selected guide card.                                                                                                                                                                              |
| Full ingestion provenance object is excessive (Sol)                                     | Accepted. Compact guide source metadata retains attribution/license/revision facts without importing governance fields or implying rights approval.                                                                                                                                                                                                             |
| Three-engine browser requirement expands the brief (Sol)                                | Accepted. One current supported browser runs the complete matrix; targeted extra engine smoke is conditional on availability or an identified risk. Real pointer/IME, themes, narrow layout and zoom remain mandatory.                                                                                                                                          |
| Draft verbosity and ADR numbering (GPT-5.5, Sol)                                        | Accepted. One architecture contract, one phase per ticket, one browser matrix; ADR uses next repository number 0003. Proposed implementation paths are boundaries, not a requirement to multiply components.                                                                                                                                                    |

Rejected or narrowed proposals:

- GPT-5.5's selected-null-snapshot pattern is unsuitable for simultaneously
  rendered and directly targetable guide cards.
- Sol's full-guide/backup internal ID remapping would conflict with exact invalid
  source retention; only record/session identity changes for whole-document copies.
- Neither Lexical nor Tiptap is represented as proven by draft preference. The
  final ordering is a finite experiment; BW-2001 selects the passing stack.
- Vendor history is not categorically forbidden as an implementation aid; a
  second independent applied-document history is forbidden. Vendor public JSON
  is not the portable contract in either integration design.
- No mandatory YAML dialect, generic plugin architecture, public publishing,
  restored equipment/party interface, or automatic new storage backend is added.
- The critique suggestion to prototype every integration alternative is narrowed
  to a default and evidence-driven fallback. The required behaviors must pass,
  but a successful simple design need not trigger redundant experiments.

No fourth model/local critique artifact was created. The final sprint carries all
twelve ticket gates and the exact original dependency DAG, including BW-2008's
independence from BW-2007. No split is needed to begin execution; failed gates
remain explicit stops and cannot be turned into prototype completion.

## Interview, approval and records

Routine interview is skipped under the explicit noninteractive automation
contract. The reviews found engineering decisions that the bounded BW-2001 gate
can resolve; no new high-risk product choice requires a human answer now.

The final [SPRINT-021](../SPRINT-021.md) is auto-approved as an executable plan,
not as accepted implementation. All implementation checkboxes remain unchecked.
All twelve source tickets carry `planned_sprint: SPRINT-021`; BW-2001 is ready,
dependent tickets remain backlog, and EPIC-20 remains ready. The ledger adds 021
as planned and preserves the twenty completed rows. No product code, dependency,
main-checkout or commit changes were made. The outer runner owns commits.

Final artifact validation and result-manifest details are recorded in
[planning evidence](SPRINT-021-PLANNING-EVIDENCE.md).
