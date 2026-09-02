# SPRINT-010 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-010-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-010-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-010-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-010-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-010-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-010-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-010-GPT54-CRITIQUE.md`

## Operational Notes

- `SPRINT-010` is the next sprint because `SPRINT-001` through `SPRINT-009` are completed in
  `work/sprints/ledger.tsv` and no `SPRINT-010.md` existed before planning.
- The `gpt-5.6-sol` lane created a full draft but its CLI `--output-last-message` handoff overwrote
  the artifact with a short link. The generated draft was mechanically recovered from the final
  add-file diff in `work/sprints/drafts/SPRINT-010-GPT56SOL-DRAFT.md.log`.
- The interview is skipped under the non-interactive ticket-burn contract. No high-risk architecture
  choice blocks planning because EPIC-09 already fixes the primary product decisions: single
  character, localStorage, no backend/account/routing, template-code-first sharing, and JSON only
  for whole-library backup/restore.

## Accepted

- Use the `gpt-5.6-sol` draft as the architecture and safety baseline because it had the strongest
  treatment of durable projections, raw-template fidelity, untrusted storage, restore planning,
  security, and closeout gates.
- Use `gpt-5.4`'s execution control: `0901 -> 0902 -> 0903 -> 0905 -> 0904 -> 0906 -> 0907`. Share
  URL boot behavior affects library selection and autosave, so it should settle before the panel
  becomes the primary management surface.
- Keep `gpt-5.5`'s concise scope framing, especially the explicit distinction between working draft,
  saved records, template-code sharing, and backup JSON.
- Add an app-level `WorkspaceState` / `DraftSessionState` wrapper instead of putting library
  collection state inside `EditorState`. The existing editor reducer stays focused on the current
  draft.
- Define one canonical durable snapshot that includes `Build`, `PveBudgetState`, raw template
  overlay/source, and validation catalog-version facts. Do not persist full UI state.
- Keep `build-wars:v1` as the single MVP localStorage key and include an internal schema version,
  revision, and metadata so future migrations have a documented discovery path.
- Treat localStorage conflict handling as best-effort stale-write detection, not atomic
  compare-and-swap. Cross-tab synchronization remains deferred.
- Add write-blocked recovery rules for corrupt, unsupported, or partially recovered storage:
  autosave must not rewrite the value until the user explicitly replaces it, confirms a restore
  replace, or exports and keeps recovered data.
- Resolve share URL behavior with a fragment format, exact post-encoding length cap, one-time
  fragment consumption, external-import association clearing, and stored-draft protection when a
  shared build opens over an existing draft.
- Separate catalog freshness from build resolution and validation status. A stale saved catalog
  version is a warning axis; unresolved IDs and validation errors are separate diagnostics.
- Make backup restore preview produce an immutable plan with ID remaps, skipped records, association
  rewrites, draft options, and final counts. Confirmation applies that exact plan.
- Require dirty-draft replacement guards for saved-record load, new draft, template import, share
  import over an existing draft, and backup draft restore.
- Add `compendium/local-library-and-sharing.md` during execution closeout rather than expanding the
  core editor note with a full storage schema.

## Rejected Or Adjusted

- Rejected persisting only the domain `Build`; it would lose raw imported template facts and exact
  replay eligibility.
- Rejected persisting the full `EditorState`; browser filters, dialog state, tooltip state,
  drag/keyboard placement, selected slot, transient messages, and counters are not durable schema.
- Rejected adding IndexedDB, a schema-validation package, a state library, routing, short links,
  hosted sharing, service workers, analytics, auth, sync, or remote media behavior in this sprint.
- Adjusted the initial `gpt-5.4` idea of adding `associatedRecordId` directly to `EditorState`. The
  merged sprint places association and hydration provenance in the workspace/draft-session layer.
- Adjusted the `gpt-5.6-sol` localStorage revision language so it is explicit about detection limits.
- Rejected a share URL query-string default. The merged sprint uses a hash fragment to reduce
  ordinary request/referrer exposure, while documenting that it is still public user-distributed
  data.
- Rejected treating freshness and validation as final-only polish. Minimal version facts and row
  status primitives must exist before the library panel is complete.
- Rejected restoring a backup working draft implicitly during merge or replace. Draft restoration is
  separately opt-in.

## Local Feasibility Notes

- `src/app/editor-state.ts` already provides `Build`, `PveBudgetState`, `RawTemplateOverlay`, and
  reducer operations that can hydrate a durable draft projection into fresh UI defaults.
- `src/app/template-workflow.ts` already owns import/export, exact-source replay, canonical export
  gates, and projection diagnostics. Share URLs should reuse this instead of introducing a second
  codec path.
- `ValidationResult.validatedAgainst` already includes build, profession/attribute, skill, and
  rule-engine versions. These facts can seed saved-record freshness metadata.
- `src/domain/**` and `src/template-compatibility/**` have enough public surface for the planned MVP;
  they should remain unchanged unless execution finds a narrow public-contract gap.
- Existing Testing Library, Vitest, fake timers, JSDOM, TypeScript, ESLint, Prettier, and
  `npm run verify` are sufficient for the planned implementation.

## Interview

Interview skipped under the non-interactive ticket-burn contract.

## Final Assumptions

- EPIC-09 can be executed as one sprint because BW-0901 through BW-0907 are groomed, ready, and have
  a clear dependency order.
- `build-wars:v1` is acceptable as the MVP single localStorage key, with future migration behavior
  documented in the v1 schema and closeout notes.
- App-layer persistence, sharing, backup/restore, and library UI can be implemented without changing
  framework-neutral domain or template-compatibility modules.
- Dirty-draft protection is required for user-initiated replacement flows, but backend-grade
  multi-tab merge/sync is deferred.
- Planning may update sprint, draft, ticket, ledger, run-state, and result-manifest records, but it
  must not modify application implementation code or create a commit.
- Final approval is auto-granted because `work/sprints/SPRINT-010.md` is internally consistent,
  executable, and bounded by phase gates.
