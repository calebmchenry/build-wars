# Runner validation retry and resume repair

After the execution child completed SPRINT-021, the outer runner repeated
`npm run verify`. Its initial repeat encountered a 5-second timeout in the existing
empty-build-set composer case: 691 tests passed and one timed out. The earlier
complete verification passed all 692 tests, build, 151 ingestion tests and 21
runner tests. The [timeout output](runner-validation-timeout.txt) is retained;
the unchanged composer file's [focused rerun](runner-timeout-focused-rerun.txt)
passed with two workers. No application code or test timeout changed.

Inspection before retry found a separate runner defect: `discover_epics` omitted
all done epics, even when the persisted run still had an executed or validated
sprint awaiting runner validation or commit. A resume could therefore report
completion and leave the changes uncommitted. The runner now prioritizes those
pending closeouts during resume, while retaining target selection and dependency
gates. Committed and archived epics remain excluded. Fresh runs are unchanged.

[24 runner tests pass](runner-resume-tests.txt), including regression coverage
that invokes `run_burn` for both executed and validated stages and requires the
remaining validation/commit steps without replanning or re-execution. Additional
cases enforce dependency blocking and exclude committed/archived records.

The supervisor resumes the original run with `VITEST_MAX_WORKERS=2` and the same
full `npm run verify` gate. This changes test concurrency only. The final gate
output is `work/runs/ticket-burn/EPIC-20/20260926T232847Z/validation-SPRINT-021-1.log`;
`run.json` records the final commit and outcome. The runner owns the commit.

This addendum follows the [execution closeout](interactive-closeout.md): its
preservation audit and 21-runner-test count describe the earlier child phase.
The subsequent supervisor change is limited to the burn script and its three
regression tests; application source, fixture bytes and browser evidence are
unchanged. Native composition remains unverified/user-deferred.
