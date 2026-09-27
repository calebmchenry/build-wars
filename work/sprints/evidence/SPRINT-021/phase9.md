# Phase 9 — complete local guide durability implementation

Current status: **complete in SPRINT-021**. The [interactive transfer closeout](interactive-transfer-closeout.md) records 18 passing actual-browser observations and closes B06/B08. [Final acceptance](phase12.md) and the [closeout audit](interactive-closeout.md) govern completion. Native composition remains unverified/deferred by user decision.

The phase/retry observations below are preserved as historical evidence; their pending-upload/dependency statements describe the earlier state and are superseded by this closeout.

Status: own implementation and validation passed; dependent ticket acceptance remains in progress while BW-2008 file reimport is unverified. No completion claim overrides the dependency gate.

Library/backup v3 retains the unchanged storage key, strict guide snapshot v1, full Build v4 payloads, exact dirty raw/base/applied revisions and authored metadata. Historical v1/v2 reads do not write. Vendor/editor/history/DOM state is excluded. Unknown audit facts remain unknown; missing catalogs do not supply unrelated composer facts. Named Save, Save As, rename, duplicate, Open, working-draft autosave and pagehide use the established library revision/conflict protocol. Aggregate bytes and structure are bounded before serialization/write; unsafe, newer or corrupt payloads remain protected. Raw and applied downloads remain independent of storage.

A later integrated regression exposed hydrated source/applied guides looking clean merely because storage was durable. The replacement guard now also compares a guide to its associated named record (or an empty guide) and protects any dirty raw buffer. This fix is covered in `guide-workflow.test.tsx` and the later full suite.

## Automated validation

[Phase test log](phase9-tests.txt): 682 tests passed. [Lint](phase9-lint.txt) and [production build](phase9-build.txt) passed. Guide persistence/durability tests cover strict schemas, old readers/no-write-on-read, unknown/future payloads, mixed backups, copied invalid source repair, Save As/metadata mapping, aggregate admission, real storage-port quota/conflict/denial, catalog-independent autosave and pagehide. Later integrated validation is retained separately.

## Actual browser evidence

Chrome 153.0.8010.54 / macOS 15.7.7, 2026-09-27 UTC. Main production preview `http://127.0.0.1:4173/`, dark desktop at 100%. Native and extension UI controls were used. The old extension connection became unavailable around 04:56 UTC; native Chrome remained available. After the connected browser inventory changed from ID 1 to ID 2, the task reattached to the same Chrome profile and existing task tab. This did not authorize retrying blocked uploads.

- [Native/extension action record](phase9-browser.json): named save/open/reload retained two complete independent Monk snapshots and the exact unfinished raw source. Save As retained raw bytes and portable identities. Repairing the copy left the original unchanged. Reload rebuilt diagnostics and cleared in-session history.
- A real second tab captured an older library revision. Its edit showed Save conflict, retained the draft and export actions, and never overwrote the winning tab. [Capture](phase9-conflict.png).
- Native input pasted a generated 2 MiB ASCII raw draft. One named copy plus working draft saved. A second named copy hit actual Chrome quota: Not saved, memory retained, exports enabled. [Capture](phase9-quota.png), [exact downloaded byte comparison/hash](phase9-quota-download.json). Native AX truncation is explicitly distinguished from actual file contents. The generated second record was repaired after retaining its download; normal durable saves resumed.
- Controlled fault-injection preview `http://127.0.0.1:4174/work/runs/SPRINT-021/browser-fixture/index.html` renders the real App with explicit catalog/storage ports. It is labeled in the UI and is not a production route. These cases prove browser UI handling, **not** a native permission denial/network outage. [Actions](phase9-failure-browser.json), [reproduction source](failure-fixture-main.tsx.txt), [entry](failure-fixture-index.html.txt), [build config](failure-fixture-vite.config.ts.txt).
- Missing catalogs: native source input autosaved through the isolated port with preserved audit facts. Exact raw download was independently compared (72 bytes). [Capture](phase9-missing-catalog.png), [download](phase9-missing-catalog-source.txt). Read showed the last applied guide; Write returned the unchanged raw draft.
- Injected SecurityError: Not saved, original bytes unchanged, edited source retained. Exact raw download was compared (74 bytes). [Capture](phase9-denied-write.png), [download](phase9-denied-source.txt).
- Newer schema 999 and malformed bytes each showed Storage needs recovery. Explicitly opening the example remained write-blocked, with export available and zero attempted writes. [Newer](phase9-newer-protected.png), [corrupt](phase9-corrupt-protected.png).
- Mixed legacy build/party/guide backup used real dialogs and native download. Renaming the local guide then merging the original backup preserved three original records and added three remapped records. The restored guide snapshot, internal build IDs and raw source exactly match the original. [Before download](phase9-mixed-backup.json), [after download](phase9-mixed-merged.json), [structural comparison](phase9-mixed-comparison.json). A subsequent Replace + restore-working-draft preview/confirmation returned three records and the original guide association/raw/diagnostic. This used the backup dialog's supported text input, not a file-upload substitute.

Native composition completion/cancellation/candidate evidence remains [unverified/deferred by user decision](native-composition-deferral.md).
