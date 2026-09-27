# SPRINT-021 final closeout — 2026-09-27 UTC

The requested orchestrated, noninteractive documentation closeout runs only in
`/Users/calebmchenry/code/build-wars`. It uses the recorded interactive browser
results without recreating uploads, starting subagents or reapplying feasibility
patches. Production source, dependencies, exact exports/captures and unrelated
local edits are preserved. The original worktree is untouched. The outer runner
owns commits; no commit, merge or push is performed.

## Evidence review

The [interactive session](interactive-transfer-closeout.md) records 18 passing
observations in Chrome 153.0.8010.54/macOS 15.7.7, with screenshots, exact source
captures and the clearly labeled test-only real-file delay fixture. Closeout
review confirmed all 18 log entries pass, the linked artifacts exist, and the
9,478-byte original guide, 237-byte zero-build guide and 70,233-byte long fixture
match their recorded SHA-256 hashes. The invalid raw download remains exactly
28 bytes; the template input remains exactly 24 bytes. Target IDs/raw code and
full sibling snapshots are compared from the retained source artifacts. The
scheduler invokes native File reads and delays only promise completion; its
results are controlled-timing actual-file evidence, not naturally slow-disk proof.

[Phase 12](phase12.md) reconciles all B01–B10 rows and ticket acceptance. B06/B08
are closed by these actual interactive observations. Earlier dismissed-consent
attempts and blocked results remain historical, never relabeled passed. The
[archived prior result](main-checkout-retry2-blocked-result.json) retains the
last blocked closeout; the original-worktree result also remains unchanged.

Native composition completion/cancellation/candidate evidence remains
**unverified/deferred by user decision**, per the [amendment](native-composition-deferral.md).
Automated composition-safe editing/history tests remain required and are covered
by repository verification. No manual typing or trusted-composition proof is
claimed. Public discovery, PvX intake and publishing remain future scope.

Artifact review also identified that the six `.png`-named interactive captures
contain JPEG bytes; their original filenames and bytes are preserved. The native
new-session AX artifact is a delta showing only the scheduler release; the
session ID and before/after observation are in the structured observation log.
The initial [record-audit assertion](interactive-closeout-audit-first.txt) expected
the ID in that delta and was corrected to check the appropriate evidence fields.
These audit corrections do not recreate or change any browser observation.

## Nine individually completed sprint items

| Sprint item                                       | Evidence supporting completion                                                                                                                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phase 8 source/export/reimport test item          | [Phase 8](phase8.md) source/codec coverage plus interactive exact two-variant reimport, invalid/raw rejection, literal zero-build import, Undo/raw recovery, explicit Redo guard and canceled/stale actual reads.                                      |
| Phase 11 integrated workflow item                 | [Phase 11](phase11.md) write/reference/drop/build/Undo/source/save/reload/read/export chain plus actual reimport of its exact 9,478-byte download; state/file tests and Phases 7/9 cover detached/unresolved/ID-collision/copied-invalid-source cases. |
| Phase 11 frozen long fixture/browser item         | Canonical 70,233-byte fixture (16 builds, 601 mentions) matches its frozen hash; actual upload/Apply/Source equality, Read navigation and one-step Undo pass in interactive evidence.                                                                  |
| Phase 12 every non-deferred browser scenario item | Updated [B01–B10 matrix](phase12.md) retains all earlier applicable checks and adds actual B06/B08 uploads, cancellation, stale reads and captured-target/sibling isolation.                                                                           |
| DoD BW-2008                                       | Complete source and transfer evidence above; BW-2002–BW-2006 already done.                                                                                                                                                                             |
| DoD BW-2009                                       | [Phase 9](phase9.md) named durability, legacy migration, mixed backup, raw recovery, quota/conflict and labeled failure-port coverage pass; BW-2003 and BW-2008 done.                                                                                  |
| DoD BW-2010                                       | [Phase 10](phase10.md) and final Reader evidence cover parity, anchors/copy, no mutation/history, source selection, narrow/200% usability; BW-2005/BW-2006/BW-2008/BW-2009 done.                                                                       |
| DoD BW-2011                                       | Original two-variant workflow and source policy pass; the actual original/long reimports close the transfer chain; BW-2005–BW-2010 done.                                                                                                               |
| DoD BW-2012                                       | Every BW-2001–BW-2011 gate passes in dependency order; non-deferred B01–B10 evidence, final validation, all 68 checked items and synchronized records satisfy closeout.                                                                                |

All eight prerequisite epics are done: EPIC-01/04/05/06/09/16/18/19. BW-2001–BW-2007
retain their completed links; BW-2008–BW-2012 now record `status: done` and
`completed_sprint: SPRINT-021`. EPIC-20's Done When criteria are satisfied and it
records the same completed sprint. Sprint and ledger are completed. No actionable
unchecked item is hidden or waived beyond the explicit composition amendment.

## Validation

The final pinned command exited **0**: formatting, lint, all strict TypeScript
projects, **692 Vitest tests in 110 files**, production build, **151 Python ingestion
tests** and **21 runner tests** passed. [Complete output](interactive-closeout-verify.txt).
Node is 22.11.0; pinned npm is 11.10.1. Both rebuilt production JS hashes exactly
match the interactive-session assets recorded in the transfer closeout, confirming
the applicability of that evidence. The guide chunk remains 489.51 kB (154.58 kB
gzip); Vite's existing large-main-chunk warning is non-failing.

```sh
PATH="$PWD/work/runs/toolchain/node_modules/.bin:$PATH" work/runs/toolchain/node_modules/.bin/npm run verify
PATH="$PWD/work/runs/toolchain/node_modules/.bin:$PATH" work/runs/toolchain/node_modules/.bin/npm run format:check
python3 work/sprints/evidence/SPRINT-021/interactive-closeout-audit.py
git diff --check
```

The [record/checklist audit](interactive-closeout-record-audit.txt) invokes the
runner's real unchecked-item gate with no override, checks every ticket dependency
and completed-sprint link, validates the matching manifests and local evidence
links, and confirms all 2,631 protected pre-existing files and HEAD are unchanged.
[Final formatting](interactive-closeout-format.txt) and the empty
[diff-check log](interactive-closeout-diff.txt) record the remaining gates.
The [audit script](interactive-closeout-audit.py) uses the captured preservation
baseline under `work/runs/SPRINT-021/interactive-closeout-baseline.json`.

The [first verification attempt](interactive-closeout-verify-first.txt) failed at
lint because the new test-only scheduler did not declare its browser globals.
Adding the `/* global File, document */` declaration fixed that fixture-only
issue; the full command above then passed. No product code, test behavior or
security/dependency setting changed. Initial audit expectations were also corrected
to match the existing observation fields and original capture encodings; no
observations or exact evidence bytes were changed.

The skill weather fetch failed with curl exit 6 (DNS). No model/planning lane was
needed for this bounded continuation; the authorized orchestrated strategy was
retained. The current [durable completed result](final-result.json) matches the
[caller-requested manifest](../../../runs/ticket-burn/EPIC-20/20260926T232847Z/execute-SPRINT-021-result.json).
Historical launcher paths/logs and earlier failed results are preserved. The outer
runner retains final supervision and commit ownership.
