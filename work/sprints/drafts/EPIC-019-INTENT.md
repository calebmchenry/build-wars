# EPIC-19 Intent: Composer Attribute Adjustments

## Seed and user decisions

Prepare burn-ready markdown backlog and setup only. The user will run
`scripts/ticket-burn.py` to plan and implement the work. Do not implement product
code or start the burn. The runner owns future `SPRINT-NNN.md` files and ledger
entries; this preparation must not reserve a sprint or mark work complete.

The conversation settled the first milestone:

- Inline rune segments: None, +1, +2, +3 with actual locally cached profession/tier
  rune icons, numbers, accessible labels, and health-penalty information.
- One optional +1 headgear selection across all primary-profession attributes.
  Secondary-profession attributes have neither equipment control. No equipment
  bonuses are inferred for new builds or ordinary game-code imports.
- No armor-slot management in this milestone. Do not make a five-piece editor,
  automatically shuffle legacy armor, or require the user to resolve armor layout.
- Existing allocation arrows change base ranks and spend base attribute points.
  Effective ranks are blue when increased, per
  `prior-art/gw-skills-and-attributes-refs/attributes-section.png`. Explain base,
  rune, headgear, and active effects on hover and keyboard focus.
- Advanced assumed-active-effect checkboxes. Supported self buffs default on when
  on the active skill bar; an explicit manual choice survives unrelated changes
  and reload. Reset restores inference. Removed/ineligible self buffs contribute
  nothing, but preference can be remembered if re-added. External buffs are opt-in.
- Start with Glyph of Elemental Power (+2 elemental attributes), Elemental Lord
  (+1 elemental attributes, faction variants count as one effect), PvE Masochism
  (+2 Death Magic/Soul Reaping), and external Heroic Refrain with explicitly chosen
  +1..+4 assumed bonus. No automatic Heroic Refrain recast/fixed-point simulation.
  Verify exact IDs, mode eligibility, game cap, and scope against current sources
  before implementation; unsupported effects are not guessed from prose.
- Active-effect count remains visible when the advanced area is collapsed.
- Persist authored choices with the current working draft immediately. Named local
  saves and complete-build file/share transfer are future product work. Existing
  internal backup/build-set/party paths must still preserve the new authored state.
- Existing Guild Wars folder Load/Save semantics and standard code format stay
  unchanged: codes carry base skills/attributes only. Extend omission/replacement
  explanations for new metadata where needed without adding a new workflow or
  repeated confirmation dialogs. Preserve cancellation, exact-source replay,
  filename behavior, and browser directory permissions.

## Orientation

- Clean main at 52f64ec. EPIC-00..18 are done; SPRINT-019 is completed. An old
  paw-ned2 child ticket remains parked under completed EPIC-17 and is unrelated.
- App currently renders the focused composer directly. Secondary equipment/library
  components exist but are not mounted in App.tsx; older compendium claims about
  their first-screen accessibility are stale.
- Build schema v2 already contains equipment and title overrides. Attribute rank
  helpers support contribution lists; headgear/rune effects currently derive from
  semantic armor slots. There is not yet a compact authored bonus profile or
  persisted assumed-effect setting.
- Local storage is strict/versioned and supports old build schemas, backups, nested
  build sets, party transfers, conflict detection, and write-blocking recovery.
- Rune catalog has 138 records and remote icon metadata; skill icons already use
  a local-path manifest and provenance cache. Current icon exception names skills
  and manually imported files. User requested rune icons for this work; add the
  narrow corresponding documented scope instead of asking again.

## Relevant codebase areas

Start with AGENTS.md, this intent, src/domain/build.ts,
src/domain/effective-attribute-rank.ts, src/domain/equipment-attribute-rank.ts, src/app/composer-selectors.ts,
src/app/editor-selectors.ts, src/app/persistence-schema.ts,
src/app/components/FocusedAttributeEditor.tsx, src/app/template-import.ts,
compendium/decisions/0002-runtime-gww-icon-assets.md, and scripts/ticket-burn.py.
Other likely boundaries are workspace-state.ts, build-set-transfer.ts,
party-transfer.ts, share-url.ts, styles.css, catalogs.ts, rune-effects.ts,
scripts/data/cache_skill_icons.py, and data/generated/epic-10/runes.catalog.json.

## Architecture decisions for the planning passes

Propose the smallest explicit way to store slot-free composer equipment choices
without double counting or rewriting existing semantic armor. Consider a nullable
compact equipment-attribute profile whose absence derives legacy gear, whose
presence replaces only headgear/rune rank inputs, and whose first edit snapshots
all displayed gear bonuses. This is a planning option, not a second additive gear
layer. Preserve original equipment data. Do not silently infer totals as base ranks.

Persist automatic/forced-on/forced-off effect intent (automatic may be implicit),
not computed checked states or effective ranks. Use stable effect identities and
source attribution. Resolve all rank consumers through a common selector/domain
projection, apply stacking/caps, and keep temporary preview assumptions out of
skill-template legality/fingerprints and permanent equipment requirement claims.

## Success and verification

One new eligible EPIC-19 with bounded, dependency-ordered BW-190x tickets and a
durable product/design brief. Fully specify state, persistence/migration, game
template boundaries, inference, primary changes, visual acceptance, icon sourcing,
and regression scenarios so the burn needs no routine user interview.

Implementation verification should include meaningful math/reducer/migration and
workflow tests; real browser evidence for desktop, narrow viewport, keyboard and
blue ranks; `npm run verify` and `git diff --check`. Setup verification uses the
actual ticket parser/dependency selector, dry runs, internal markdown-link checks,
and formatting of new maintained docs. Do not run app suites for markdown alone.

## Uncertainty and interview

- Correctness: medium; verified narrow effects still need fixture/source mapping.
- Scope: low; the user explicitly accepted the first milestone and its deferrals.
- Architecture: medium; compact gear state must coexist with existing equipment
  and strict persistence without loss.
- Human interview is already complete in this conversation. Make routine design
  decisions explicit rather than asking the user again.

## Planning workflow adaptation

Use independent planning drafts/review to improve the burn input. Final synthesis
belongs in the epic, tickets, and compendium brief, not a runnable sprint document.
The burn will run its configured Codex-only sprint planner later. Leave the sprint
ledger unchanged. Model guidance resolved from the sprint-plan weather report:
Claude opus-4.8/max and Codex gpt-5.5/xhigh, subject to CLI availability.
