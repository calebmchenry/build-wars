# SPRINT-020 execution evidence

Execution began at HEAD `41b5e41ee3ad18356782425474d4d2f61e9290b2` with runner-owned
planning changes present. Strategy: orchestrated, noninteractive, no commits.
Raw logs and browser artifacts reside under ignored `work/runs/SPRINT-020/`.
This durable record reports completed gates only.

## BW-1901: contracts

- Added exact readonly profile/registry contracts with canonical clone/normalization,
  explicit None/off preservation, bounded structural validation, unknown ID retention.
- Pinned catalog versions, SHA-256 values, six skill/template identities, split
  members, attribute ownership, and representative rune rank/health facts in
  `test/fixtures/attribute-adjustments.json`. Updated the durable design brief.
- Baseline 7 files / 59 tests passed. A disposable nested v3 fixture was rejected
  with writes blocked by the original v2 reader before migration.
- Chrome 152.0.7977.83 launched in headed mode on macOS using ephemeral Playwright
  1.63.0. Disposable Skills folder established. Sample authentic Elementalist Major
  image matched its promoted SHA-1. These are capability checks, not final acceptance.
- Rechecked indexed Guild Wars Wiki articles on 2026-09-14 UTC: Glyph, Elemental
  Lord, both Masochism versions, Refrain, Rune, Attribute bonus, effect stacking,
  Template, and skill template format. Direct Attribute page access failed;
  source checks are indexed article evidence, separate from local catalog assertions.
  Links are in [the accepted brief](../../compendium/attribute-adjustments.md).
- Constructor/clone/serializer/consumer audit saved in `contracts.md`; the explicit
  Build cloners and strict nested reader require edits. Existing fingerprint and
  transfer wrappers remain the persistence mechanism.
- Passed: `npm run typecheck`; phase-1 focused test command (76 tests);
  `npm run build`; `npm run lint`; `npm run test:run` (88 files / 525 tests);
  `git diff --check`. No pre-existing test failures observed.

## BW-1902: authored state and persistence

- Build v3 requires the nullable profile. Existing envelopes/key remain unchanged.
  Strict v1/v2 migration is recursive and neutral; future v4, missing v3 fields,
  incompatible version/field combinations, and malformed profiles block unsafe writes.
- Both explicit cloners use the canonical profile clone. Shared library fixtures
  deliberately contain different non-default profiles in active/inactive records;
  existing duplicate, saved-record, party, storage/conflict/quota and transfer tests
  now exercise those fields. Added independent clone and transactional rejection tests.
- Maximum 64-rune/four-effect profiles in 16 nested loadouts round-trip through both
  existing 240,000-byte transfer limits and backups, retaining equipment, titles,
  raw overlays and notes. Oversized inputs are rejected without changing limits.
- Setters modify only authored adjustments. Actual primary changes clear compact gear,
  same primary is a no-op, secondary/mode/bar edits retain preferences. Hidden armor
  commands receive proven old/new target facts and invalidate only those contributions;
  identical/no-op edits preserve overrides. Empty loadout commands are guarded.
- Hydration, autosave and pagehide tests preserve non-default profiles. Authored
  snapshot fingerprints detect bonus-only edits while base fields remain unchanged.
- Passed: phase-2 domain/persistence tests (15 tests after fixing a duplicate party
  assignment in the new fixture), build/typechecks, lint, full suite (90 files /
  542 tests). Initial test-fixture errors were corrected; no outstanding failures.

## BW-1903: shared previews

- One domain projection now supplies base, equipment-adjusted, uncapped/capped ranks,
  ordered inherited/replaced/assumed contributions, scoped uncertainty, effect state
  and contributing counts. It proves 16, 19, uncapped 23/capped 20, zero base,
  primary-only equipment, secondary skill targets, and unknown/invalid input handling.
- Extracted shared source profession/mode/classification predicates. Effect inference
  uses collision-safe slot resolution, explicit template identity, unique complete
  mode variants, independent source gates and logical/faction deduplication.
- App and alternate browser owners memoize by immutable Build/catalog identity;
  focused rows, bar, catalog and pinned tooltips receive the same context. Tests
  prove filters do not recompute a projection and Build changes do.
- Description inputs omit unresolved ranks; known unallocated off-profession ranks
  stay zero. Inherent cost/timing uses the same ranks, titles stay separate, and
  permanent equipment validation plus exact-source export remain unchanged.
- Corrected an old tooltip-rounding fixture to select Monk: it previously allocated
  Healing Prayers to a Warrior/Ranger, which is intentionally unresolved now.
- Passed: phase-3 focused suite (128 tests), typechecks/build, lint, full suite
  (93 files / 573 tests). No outstanding failures.

## BW-1904: local rune assets

- Acquired all 30 authentic PNGs for 126 rune IDs directly from their promoted
  image URLs. Every SHA-1 matches; provenance also records SHA-256, source/media
  identity, dimensions and byte size. Promoted catalogs remain unchanged.
- Inspected Assassin Major and Warrior Superior original images visually. All
  original non-square dimensions pass PNG/CRC/dimension checks; no crop or padding.
- Bounded tooling stages/validates all bytes, publishes immutable content-addressed
  binaries before manifests, restores both manifests on injected publication failure,
  and replays offline. Tests reject hashes, HTML, invalid dimensions, path/host escapes,
  and incomplete sets. This does not claim cross-directory crash atomicity.
- Exact paths are approved by the recorded user request and ADR 0002; the provenance
  manifest is allowlisted. Runtime descriptors contain only local paths, support
  non-root Vite bases, and leave a labeled numeric control usable after image error.
- Passed acquisition and offline replay (126/30), 11 Python asset tests, focused
  TS boundary tests, build/typechecks, lint, full suite (94 files / 578 tests),
  and diff check. A test-only macOS `/var` path comparison was corrected to use
  resolved paths before validating publication-failure recovery.

## BW-1905 / BW-1906: mounted controls

- Added native rune and global headgear radios, separate inherit/reset actions,
  recoverable unknown choices, and pointer/focus/tap rank explanations with
  Escape/focus restoration. Zero-base gear does not change points or game code.
- Chrome 152 on macOS development-server screenshots at 1280, 900 and 390 CSS
  pixels show all controls contained without horizontal overflow. Visually
  inspected desktop and narrow breakdown screenshots. The final BW-1908 production matrix below extends this early check to
  both themes and actual browser zoom.
- Assumed-effect checkboxes expose automatic/explicit status separately from
  current eligibility; absent-source on can be toggled off and survives re-addition.
  Reset of a disappearing row returns focus to the disclosure trigger.
- External Refrain defaults off/+1, retains edited strength while off, and resets
  independently. Both disclosures use the shared contributing count, including
  capped effects. The Fire 20 explanation retains uncapped 23.
- Passed: phase-5 focused suite (30 tests), phase-6 focused effect controls (5),
  build/typechecks, lint, and full suite (97 files / 589 tests). Test harness
  compile errors and icon-derived checkbox label duplication were fixed first.

## BW-1907: game and complete-document boundaries

- Shared replacement-warning data now includes explicit adjustment presence in
  both existing import paths. Explicit None/off counts; automatic defaults alone
  do not create an adjustment warning. No additional confirmation was added.
- Inline code, game-file Save, modal export, existing share controls and party
  omission data explain base-only output. Exact-source bytes and canonical base
  projection remain identical through bonus-only edits, including unknown IDs.
- The file regression harness now carries non-default profiles through cancellation,
  invalid/fresh reads, permission denial, failed close/abort and overwrite handling.
  Successful ordinary import resets to neutral; successful Save retains choices.
- Non-default active/inactive/saved fixtures cover backup, build-set and party
  transfer, duplicates, shared-draft protection and malformed/future nested rejection.
- Passed the required phase-7 suite: 20 files / 122 tests. Final verify passes
  97 Vitest files / 593 tests, 149 ingestion tests and 21 ticket-burn tests, plus
  format, lint, all typechecks and production build. Only the existing bundle-size
  warning remains. Initial test harness signature/role issues were fixed.

## BW-1908: final production browser acceptance

Production: HEAD `41b5e41ee3ad18356782425474d4d2f61e9290b2` plus uncommitted
SPRINT-020 implementation, built by final `npm run verify` and served at
`http://127.0.0.1:4173/` using `npm run preview -- --host 127.0.0.1`.
Full distribution SHA-256: `ea5ff17942d0a26db7d0db072418ede55bc1999e3310dde094e472dacec48547`.
OS: macOS 15.7.7 arm64. Browsers: Chrome 152.0.7977.83 and Firefox 155.0.
Playwright 1.63.0 and its Firefox install are ephemeral, outside project dependencies.

| Scenario           | Actual result                                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout             | Chrome 1280, 900 and 390 viewport widths, both themes, repeated using Chrome’s own 200% zoom setting (640, 450, 195 effective CSS widths). Five primary/three secondary attributes, long label, all control/popover bounds contained, no horizontal overflow. The smallest case led to a final stacked header/label fix, then the complete matrix was repeated.      |
| Visual reference   | Inspected actual production screenshots against `prior-art/gw-skills-and-attributes-refs/attributes-section.png`: Fire19 blue, unchanged Energy Storage0 neutral. Real local rune images retain original proportions. At 200%, scroll reaches the 23→20 / 3-clipped explanation.                                                                                     |
| Input              | Chrome native rune/headgear arrow navigation, Space clear/checkbox/reset, visible focus; hover/focus/click rank explanations; Escape and restored focus; Chrome touch emulation at390×844 verifies taps. Firefox keyboard End+Enter selects Refrain4.                                                                                                                |
| Effects            | Independent Glyph/Lord automatic/off/on, remove/re-add, absent-on→off retained, faction substitution, mode/profession gates, reset/removal focus, external1→4, count3 including clipping, both collapsed labels, reload.                                                                                                                                             |
| Isolation          | Distinct selected/inactive nested profiles preserve the inactive snapshot and alternate strength; no-selected fixture has no adjustment controls. File hover shows its own base12 with editor bonuses active.                                                                                                                                                        |
| Missing images     | Blocked local rune image requests; numeric +2 and accessible names still work; zero remote fallback requests.                                                                                                                                                                                                                                                        |
| Native files       | Genuine Chrome FileSystemDirectoryHandle backed by disposable copied `Templates/Skills`, acquired through a CDP file drop and seeded into existing folder IndexedDB. Production app exercises remembered-folder load, edit/save/reload, fresh changed-file read and overwrite reject/accept; saved code decodes to purchased Protection11 and eight original skills. |
| Permissions/cancel | Isolated Chrome profile denies real file-system write permission; normal Save shows the permission error, creates no file and retains authored fields. Unmodified native picker cancellation by closing its owning tab, then reopening, preserves the whole document. This does not claim clicking the OS Cancel button.                                             |
| Failure/fallback   | Explicit injected write/close faults around real native streams each abort once without false success or profile loss. Real Firefox folder upload and browser download preserve choices, emit base12/eight-skill code only, and report Download started.                                                                                                             |

Full per-row metadata, actions, expected/actual outcomes, fixture setup and screenshot
links are in ignored `work/runs/SPRINT-020/browser-evidence.md`. Supporting JSON,
PNG, copied files, scripts, logs and `build-fingerprint.json` are alongside it.
This durable summary remains linked from sprint and tickets for version control.

Method limits: macOS OS-menu automation was unavailable. Picker cancellation was
therefore exercised through closing the owning tab, and native select keyboard
navigation through Firefox; neither was replaced with a fake pass. Bar actions use
the real mounted drop handler; nested selections use isolated storage fixtures.
Write/close failures are explicitly injected, not physical disk failures. Browser
screenshots use direct CDP capture at zoom to avoid the automation library’s cropped
capture. No browser or asset acceptance gap remains.

Docs describe mounted state/projection/UI/file behavior and exact rune provenance.
Named-library UI, complete-build transfer interfaces, armor management, full health
accounting, generic effects and the parked paw-ned2 work remain deferred. No commits.
