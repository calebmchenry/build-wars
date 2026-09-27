# Historical file-upload verification gap — closed

Current status: **complete in SPRINT-021**. The [interactive transfer closeout](interactive-transfer-closeout.md) records 18 passing actual-browser observations and closes B06/B08. [Final acceptance](phase12.md) and the [closeout audit](interactive-closeout.md) govern completion. Native composition remains unverified/deferred by user decision.

The phase/retry observations below are preserved as historical evidence; their pending-upload/dependency statements describe the earlier state and are superseded by this closeout.

The [second main-checkout retry](main-checkout-retry2.md) records the latest
normal-flow upload failure and fresh validation. The permission request was
again dismissed before a decision; no upload/reimport/cancel/stale or fallback
upload acceptance is claimed. All previous attempts below remain historical.

## Main-checkout retry — 2026-09-27 UTC

After the user reported fixing browser permissions, the normal Chrome upload flow
was retried from `/Users/calebmchenry/code/build-wars` against its production
preview at `http://127.0.0.1:4173/`. The file chooser opened, but `setFiles` again
returned: “Browser security check was unavailable” because “the permission request
was dismissed before a decision was made”; no explicit denial was made. This is
fresh evidence of a failed upload attempt, not a passing result or a claim that
the user's reported settings change did not happen. See the
[complete attempt and validation record](main-checkout-resume.md).

No alternate upload, native picker, clipboard transfer, permission change or
security bypass was used. The import dialog was canceled; the durable guide title
and disabled Undo/Redo remained unchanged. This does not pass the required
file-read cancellation/staleness scenarios. The nine open sprint items remain.

## Historical restriction

Required Markdown file reimport and game-template fallback upload remain unverified. They are not covered by the native-composition deferral.

The documented wait-for-filechooser/setFiles flow was attempted in Phases 5 and 8. The returned result was: “Browser security check unavailable. Permission request dismissed before decision; no explicit denial.” It allowed retry only after the issue was resolved and prohibited bypasses or indirect workarounds. The prescribed Chrome file-URL access instructions were reported to the user. No resolution was received.

After Chrome reconnected, a read-only attempt to inspect `chrome://extensions/` was rejected by the browser URL policy: only HTTP(S) protocols are allowed. The tool explicitly prohibited alternate browser surfaces or indirect workarounds. No permission setting was changed and no native picker, clipboard transfer or other mechanism was used to bypass either restriction. The remaining independent paste, backup and download checks test their own supported features; none is reported as file-upload acceptance.

To resume this gate, the user must resolve the ChatGPT Chrome extension file-upload permission/security review, then the normal authorized chooser/setFiles flow can be retried against the isolated local fixture. All required upload/reimport/cancel/stale cases must be observed before closing BW-2008 or dependent acceptance. Native composition remains separately unverified/deferred by user decision.
