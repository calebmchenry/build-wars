# BW-2008 source and Markdown transfer — implementation verified, file evidence pending

2026-09-27 UTC, Chrome 153/macOS 15.7.7, production preview localhost:4173,
desktop dark/100%. Implementation adds explicit Apply/Keep Editing/Discard,
whole-document stale-source acknowledgement, line/column diagnostics, staged
paste/file validation, captured session/generation/revision guards, strict UTF-8
file reading, capacity admission before reads/parsing, and one-transaction import.
Canceled/invalid/stale imports preserve both the prior document and raw source.
Source Undo uses the textarea's native history. Returning the buffer exactly to
the current canonical projection clears its dirty flag without semantic history.

[Observed browser sequence](phase8-browser.json) covers validation and Cancel of
newly typed Markdown, explicit paste replacement, literal inline annotations,
failed Apply while returning to Write, repair/Apply/Undo, explicit resolution
before Redo, source reopening and stale-source acknowledgement after metadata
rename. Native per-character input generated individual native undo units;
14 Undo events restored all 14 inserted characters without traversing semantic
history. This is not an IME test or a claim about physical typing group sizes.
[Source capture](phase8-source.png) records the applied source surface.

Chrome saved actual downloads to the isolated worktree. The
[invalid raw download](phase8-invalid-raw.md) is exactly 28 bytes, including its
missing final newline. The [applied download](phase8-applied-download.md) is 237
bytes and equals the [last-applied DOM projection](phase8-applied-expected.md)
byte for byte while the raw buffer was invalid. The two downloads are distinct.

## Required evidence still pending

The documented chooser workflow was retried for the isolated phase7-raw-swap.md
fixture. Browser security reported that its permission request was dismissed
before a decision; file upload was not performed. No native picker or paste
workaround was used to bypass that gate. The browser's prescribed extension
troubleshooting was reported to the user. File upload/reimport and the existing
game-template upload fallback remain unverified. BW-2008 stays in progress.
Unapplied Read transitions will be checked against the actual BW-2010 Reader;
network observation and final hostile/limit intake remain in integrated B06.
Independent later implementation may proceed, but no dependent ticket or final
sprint completion can claim these pending gates passed.

## Validation

Pinned npm run lint, run build (all strict typechecks), and
run test:run -- --maxWorkers=2 passed: 106 files, 674 tests. Prettier passed on
changed source/transfer files. Focused tests exercise delayed reads after edit,
Undo, Apply and switch, oversized files before read, malformed UTF-8,
catalog-independent full snapshots, failed and one-step successful import,
exact invalid-source restoration and Cancel/Apply/Discard UI outcomes.

Native composition remains unverified/deferred by user decision, separately
from the still-required upload permission gap.
