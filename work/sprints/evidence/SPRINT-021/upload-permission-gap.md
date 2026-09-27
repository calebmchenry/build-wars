# Remaining file-upload verification gap

Required Markdown file reimport and game-template fallback upload remain unverified. They are not covered by the native-composition deferral.

The documented wait-for-filechooser/setFiles flow was attempted in Phases 5 and 8. The returned result was: “Browser security check unavailable. Permission request dismissed before decision; no explicit denial.” It allowed retry only after the issue was resolved and prohibited bypasses or indirect workarounds. The prescribed Chrome file-URL access instructions were reported to the user. No resolution was received.

After Chrome reconnected, a read-only attempt to inspect `chrome://extensions/` was rejected by the browser URL policy: only HTTP(S) protocols are allowed. The tool explicitly prohibited alternate browser surfaces or indirect workarounds. No permission setting was changed and no native picker, clipboard transfer or other mechanism was used to bypass either restriction. The remaining independent paste, backup and download checks test their own supported features; none is reported as file-upload acceptance.

To resume this gate, the user must resolve the ChatGPT Chrome extension file-upload permission/security review, then the normal authorized chooser/setFiles flow can be retried against the isolated local fixture. All required upload/reimport/cancel/stale cases must be observed before closing BW-2008 or dependent acceptance. Native composition remains separately unverified/deferred by user decision.
