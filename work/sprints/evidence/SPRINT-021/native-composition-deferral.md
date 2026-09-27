# User-authorized native composition verification deferral

Decision date: 2026-09-27 UTC. Applies to EPIC-20 / SPRINT-021.

After the native composition evidence gap was explained, the user instructed:

> Can we just skip this verification and proceed anyway

## Scope of the decision

The remaining manual/native composition verification (accent/dead-key and IME
completion/cancellation/candidate evidence, including the origin of the reported
untrusted `compositionend`) is deferred and is not a blocking acceptance criterion
for this burn. Do not spend further burn attempts reproducing that input-tool gap
or request the manual typing check again unless the user brings it back into scope.

This changes verification scope only. Composition-safe editing, candidate buffering,
correct history grouping, and their automated regression tests remain required.
Real typing, focus, caret, native/keyboard undo and redo, drag/drop, storage, codec,
capacity and every other browser/validation requirement remain required. A newly
observed functional failure still must be fixed. Permissions, sandboxing, source
policy, dependency checks and the outer runner's checklist/validation gates remain.

## Evidence and reporting

The [previous resume evidence](resume-20260927.md) remains accurate historical
partial evidence. Native composition completion is **unverified and deferred by
user decision**, never passed. Keep that distinction in B01, the final evidence
index, ADR, execution manifest follow-ups and final user report. Once all remaining
in-scope criteria pass, this recorded deferral alone does not prevent ticket,
sprint or epic completion. Do not claim full native IME verification.

## Recovery and later verification

Restore the combined `resume-feasibility-slice.patch` on the clean product baseline,
not on top of the original patch. It contains both history fixes and seven focused
tests. Complete the remaining BW-2001 contracts, grammar, capacity and browser
checks before its dependent tickets. No ticket is completed by this decision.

A future manual check can capture actual accent/IME completion and cancellation,
then verify one logical undo/redo entry and stable caret behavior around embeds.
This is a documented follow-up outside the required checks for the present burn.
