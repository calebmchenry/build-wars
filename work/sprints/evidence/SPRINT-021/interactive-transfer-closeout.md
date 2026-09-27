# Interactive transfer verification — B06 and B08 completed

2026-09-27, approximately 20:35–20:57 UTC. Main checkout
`/Users/calebmchenry/code/build-wars`, application revision `17c7e52`, Chrome
153.0.8010.54 on macOS 15.7.7, desktop viewport approximately 1283 × 618,
dark theme, no viewport or zoom override. Production preview was
`http://127.0.0.1:4173/`. These actual-browser observations supersede the earlier
blocked upload attempts; those records remain historical.

All **18 recorded checks passed** in [the observation log](interactive-transfer-checks.json).
The normal Chrome file chooser and `setFiles` accepted the real fixture paths
in the interactive Codex conversation. No browser permission setting, security
guard, upload mechanism, or application implementation was changed. The prior
noninteractive runner's dismissed consent is diagnosed separately in
[the upload diagnosis](interactive-upload-diagnosis.md).

## B06: real Markdown transfer

The initial Source field exactly matched the earlier actual download
[phase11-workflow-export.md](phase11-workflow-export.md): 9,478 bytes,
SHA-256 `4f045c842b73644cb5b7e3c5a74f69764b37efc2a4e00937ba54174c87b01140`.
Uploading that file produced the same exact import buffer and “Ready: Dagger
workflow verified; 2 builds.” Cancel preserved the complete source and disabled
Undo. [Ready screenshot](interactive-markdown-ready.png).

With the exact 28-byte invalid raw source from Phase 8 retained, uploading and
replacing with the downloaded dagger guide restored the complete applied guide.
One Undo recovered the exact invalid raw draft and prior applied guide, with Undo
then disabled. Redo correctly required the unapplied-source guard; explicitly
discarding the raw draft allowed Redo, and reopening Source matched the original
9,478 bytes. An initial automation attempt encountered that expected guard and
timed out waiting for a chooser; the guard was then handled through the UI.

The actual invalid raw download was separately uploaded and rejected with
“1:1 Invalid or ambiguous JSON at offset 1”; replacement stayed disabled.
The valid zero-build [applied download](phase8-applied-download.md) reimported
exactly, including literal code: 237 bytes, SHA-256
`4338a7351d0478d300748d83ee0c161c0b1936d496d7d111c7cf4c89d11eb28d`.
Undo restored the dagger guide.

The frozen `test/fixtures/guides/long-v1.md` was uploaded through the same normal
chooser, reported 16 builds, and applied. The reopened Source field matched all
70,233 bytes, SHA-256
`b8149f13740954f41b16378f9b0e5893e60978c16f8344bff762a716f94cdc52`.
Read displayed the section and all 16 variant navigation entries; see
[DOM](interactive-long-read-dom.txt) and [screenshot](interactive-long-read.png).
One Undo returned to the original dagger source.

## Explicitly controlled delayed reads

For deterministic race timing, a separate loopback server at
`http://127.0.0.1:4174/` served the **unchanged production assets** with a
test-only [file-read scheduler](interactive-io-scheduler.js), loaded by
[this server](interactive-io-server.py). Run the Python server from the checkout
to repeat the fixture. Its two visible controls hold the next real `File.text`
or `File.arrayBuffer` completion and release it. It invokes the native read,
retains the original result without modification, and delays only promise
completion. It does not synthesize file input, bypass chooser consent, mutate
application state, or appear in the production bundle. All guide changes used
the normal UI. This is actual Chrome/real-file coverage with controlled timing,
not a claim about naturally slow disk latency.

- A real 237-byte Markdown read remained at “Reading Markdown…” while held.
  Cancel, then Release left the original guide byte-identical.
- Cancel, edit Source to the newer invalid 28-byte draft, then Release preserved
  that exact draft and the original applied guide. [Held screenshot](interactive-markdown-held.png),
  [newer-source screenshot](interactive-markdown-stale.png).
- Cancel, explicitly confirm New Guide, then Release left the new empty guide
  unchanged with Undo disabled. The new guide ID was
  `1a1c4eb9-48ee-4477-b25a-4bf0eb009bc9`;
  [native AX observation](interactive-markdown-new-session.txt) shows only the
  scheduler changing from Held to Released. Chrome's control API retained a stale
  dialog handle after native confirmation; the last observation used native AX,
  and a fresh tab was used for the next scenario.

## B08: real game-template fallback upload

The actual Phase 5 download `Protection B.txt` was uploaded to Independent
practice. Its [24-byte contents](interactive-template-input.txt) were retained.
Canceling the import confirmation preserved both full build snapshots. Accepting
the game-format loss warning and captured-target confirmation changed only
`dagger-independent` into the Protection B Monk build. Its guide/build IDs stayed
unchanged, the imported raw bare code matched the file, and the entire Supported
practice snapshot stayed byte-for-byte equal when compared as canonical JSON.
The [resulting source](interactive-template-import.md) is retained. One Undo
restored the exact original guide.

With a real template read held, changing the target's name to “Newer target edit”
before Release produced “Template operation ignored because its target changed.
Reopen it for the current build.” The newer Assassin target and the full sibling
snapshot survived. One Undo reverted only the name edit, proving the rejected
read added no authored history. [Screenshot](interactive-template-stale.png).

A second held template read captured Independent practice, then selection moved
to Supported practice. Release still confirmed “Replace captured ‘Independent
practice’?” Accepting applied only to the originally captured card. The complete
currently selected Supported snapshot remained equal to its original JSON.
See [native result](interactive-template-selection-dom.txt) and
[visible Source capture](interactive-template-selection-source.txt).

The earlier native folder Load/Save, download bytes, delayed write guards and
automated permutations in [Phase 5](phase5.md) remain applicable. This session
closes the missing fallback upload and adds actual-browser delayed-read checks.

## Acceptance and cleanup

Together with [Phases 8](phase8.md), [9](phase9.md), [10](phase10.md),
[11](phase11.md) and the existing [B01–B10 matrix](phase12.md), the required B06
and B08 upload gaps are closed. BW-2008–BW-2012 and the nine remaining sprint
items can now be finalized after the runner's validation and record audit.
Native composition remains **unverified and explicitly user-deferred**; it is
not relabeled passed. Public discovery, PvX intake and publishing remain future
scope.

The main preview was restored to the exact original dagger guide and Read mode;
[final screenshot](interactive-transfer-complete.png). Test tabs were closed and
both preview servers stopped. No product source changed during this session.
Production JS SHA-256 values: `GuideWorkspace-D9YiX5zn.js` =
`c666bc3057f5d42931fbb6d0fa6fdba703dbc6e12ea51b0c80912acf3d752c82`;
`index-vtfdDJfd.js` =
`e89faf4ea731e31e9c935bc49b6b0e22355e870aeddda91438c0073974505f4d`.
