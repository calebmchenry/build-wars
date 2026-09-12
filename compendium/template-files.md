# Template Files

Load and Save beside the editor's template-code field open the same modal in two modes. The modal
lists `.txt` files and immediate subfolders, supports search and Up navigation, and displays
professions, attribute allocations, and eight skill slots when a file is hovered or focused.
Selecting a file does not change the editor. Load or double-click imports the file and uses its
basename as the build name. Arrow keys, Home, and End move focus through the file list.

Save uses the current editor's exported **bare skill code**, even when a different file is selected
for preview. Enter a new name or select an existing file to fill the name field. `.txt` is added
automatically. Invalid Windows filenames are rejected. Existing files require confirmation before
replacement, including files created after the list was opened. Success is reported only after
the writable stream closes. The build name is updated after a successful save or download.

## Browser access

- Desktop Chrome/Edge: `showDirectoryPicker` grants access to the selected folder. Reading requires
  read permission; Save requests write permission from its user gesture. The root directory handle
  is stored in a dedicated IndexedDB database. Reopening checks permission and offers Reconnect
  when necessary. Private storage failures leave the chosen folder usable for the current visit.
- Other browsers: `input[type=file][webkitdirectory]` reads a selected folder's files. Saving starts
  a `.txt` download, including when no folder is selected. It cannot overwrite the original files.
  Refresh asks the user to select the folder again to obtain a fresh snapshot.

Folder access is entirely client-side. Template contents are not uploaded or stored in the folder
preferences database. There is no hardcoded filesystem path. For Guild Wars, select
`Documents/Guild Wars/Templates/Skills`; a CrossOver installation may expose this through a link
from its bottle's Windows Documents directory to the Mac Documents directory.

## State and failure handling

Native Refresh rereads the displayed directory. Native Load rereads the selected file before
importing, so game edits made after previewing are respected. Malformed, oversized, or unreadable
files are listed with an explanation without preventing other files from being used. Denied
permissions and missing folders produce recoverable errors. Cancelling a picker or replacement
leaves the editor and original files intact. The modal prevents duplicate operations and stays open
on write failure.

Skill templates contain professions, base attribute allocations, and eight skill slots. Equipment,
title overrides, party information, and notes do not fit in this format. Existing import guards
still protect authored equipment/title overrides and unsaved editor changes. Browser draft
autosave remains separate from explicit saves to game files.

## Verification

`test/fixtures/skill-template-files.json` contains copies of the nine game templates used for
compatibility testing, including Protection Monk and E Surge Hero. Tests cover exact codec round
trips, folder navigation, invalid files, filename validation, replacement confirmation, changed
files, permissions, failed writes, and fallback downloads. Live game files are never written by
tests.

For manual browser verification, choose a disposable copy of a Skills folder, load a template,
change an attribute, save under a new name, and load that file again. Also test cancellation and
replacement of the copied file, reconnecting after revoking permission, light/dark themes, narrow
viewports, hover/focus previews, Escape, and focus restoration.

Browser references: [File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access),
[persistent permissions](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api),
[folder input](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory).
