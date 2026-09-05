# Core Build Editor

SPRINT-009 shipped the first in-memory single-character Build Wars editor for EPIC-08.

## Catalog Ownership

Runtime app code imports promoted data only through `src/app/catalogs.ts`. That boundary adapts:

- `data/generated/epic-03/professions-attributes.catalog.json`
- `data/generated/epic-04/skills.catalog.json`
- `data/generated/epic-10/runes.catalog.json`
- `data/generated/epic-11/insignias.catalog.json`
- `data/generated/epic-12/weapons.catalog.json`
- `data/generated/epic-12/weapon-mods.catalog.json`

Equipment catalog slices expose per-family readiness and validation views. Core profession,
attribute, skill, library, and share workflows remain usable if an equipment slice fails to adapt.

Leaf components consume app-ready catalog views, attribution, validation slices, placeholder icon
descriptors, and explicit template crosswalk helpers. Components do not import generated artifacts,
QA reports, source snapshots, ingestion scripts, wiki APIs, or remote media bytes.

Attribution is rendered before the catalog-driven workspace in DOM and visual order. Source links are
ordinary user-activated anchors with safe new-context attributes. Remote icon metadata remains
metadata-only; the editor renders stable local placeholder boxes and does not pass remote media URLs
to image, CSS, preload, canvas, or fetch paths.

## Editor And Raw Template State

`src/app/editor-state.ts` owns the editor reducer for the active single-character draft. EPIC-09 now
persists only the durable projection of that draft through the app workspace layer; transient UI
state remains ephemeral. The reducer keeps a semantic domain `Build` beside an app raw-template
overlay for imported facts that may not resolve to catalog IDs.

Overlay entries are field-addressed for professions, attribute rows, and skill-bar slots. Replacing
or clearing a targeted field clears only that overlay entry. Slot move and swap operations move the
semantic slot and raw overlay atomically. Invalid or stale operations are typed no-ops.

Unresolved imported attributes and skills remain visible through app overlay diagnostics and
negative app-internal semantic IDs where a field must stay addressable. These IDs are never treated
as template IDs or catalog IDs.

## Browser Filters

`src/app/editor-selectors.ts` implements the deterministic browser query pipeline. Normal browser
results exclude unsupported and non-player skill records while imported unresolved records can still
be represented in the bar.

The browser supports name substring search, default selected-profession scoping, explicit profession
scope, attribute, skill type, elite state, mode availability, and resource-state filters for energy,
adrenaline, sacrifice, upkeep, and overcast. Results sort/group by attribute by default, with name
and type modes. Matching results render directly because the promoted skill catalog is small enough
for the browser UI to keep every filtered result present.

## Budget Assumptions

The editor assumes a level-20 character with maximum attribute points for both PvE and PvP. The
focused composer exposes mode as a PvP checkbox; unchecked means PvE.

## Interaction Model

The first screen renders the focused build composer. The left side owns the active loadout header,
Any-aware profession pickers, mode, focused attribute editor, eight-slot skill bar, and inline
skill-template import/export. The right side owns the compact skills catalog. In build-set mode,
that active loadout is the selected entry from a neutral multi-build workspace; inactive entries are
durable snapshots and are not separate live editors. In enabled party mode, the editor is bound only
to an occupied selected slot. Selecting an empty party slot snapshots the outgoing member, leaves no
selected loadout, disables selected-loadout controls, and shows create or assign actions instead of
materializing a placeholder build.

Secondary tools preserve library, build-set, party, equipment, title-rank, sharing, backup,
restore, transfer, modal template fallback, and full validation workflows behind a keyboard-reachable
disclosure. `Skills` remains the default secondary workspace tab for title ranks; `Equipment`
continues to lazy-author semantic equipment only after the first meaningful equipment edit.

Users can place skills from either catalog surface, replace a slot, move to an empty slot, swap
filled slots, clear slots, use a visible removal target, and use keyboard pick/place/cancel
controls. Catalog placement, pointer drop, click placement, and keyboard placement all route
through one app-layer planner before the catalog-free reducer applies an eight-slot plan. Drag
payloads are opaque app JSON under an internal MIME type and are validated before they can mutate
state.

The title-rank panel derives relevant rows from selected skill slots, shows remaining discovered
titles in a disclosure, and stores only non-default per-build overrides. Opening the all-title
disclosure or rendering title controls does not create authored override state.

The `Equipment` tab renders the EPIC-14 semantic equipment editor. Opening the tab does not
materialize `Build.equipment`; only the first meaningful equipment edit creates canonical equipment
state.

Dialogs use an app modal primitive with initial focus, Escape close, Tab containment, trigger focus
restoration, and bounded viewport height. Clipboard writes are best-effort only; failures leave the
template text selectable.

## Tooltips

Skill rows, grid tiles, bar slots, and tooltip panels share one display projection. Tooltip text uses
the domain `renderSkillTooltipText` helper. Attribute-scaled text receives effective authored ranks
from `calculateEffectiveAttributeRank`. Title-scaled series receive exact raw-key title ranks from
the shared title-rank resolver, using implicit maximums by default and authored overrides when
present. Resolved title scaling no longer renders maximum-title-rank assumption copy.

The current promoted EPIC-04 catalog exposes reviewed concise descriptions for skill tooltips, with
structured facts and progression tables available separately. The editor uses stable non-crashing
unresolved states for gaps.

## Export Policy

Template import uses EPIC-05 `decodeSkillTemplate` and `resolveSkillTemplateDocument`. Successful
import is transactional and preserves the current PvE/PvP mode. Failed parse, decode, or resolve
leaves the prior editor state unchanged.

In party mode, template import and export remain selected-member operations. They require an
occupied selected slot and preserve build-set entry identity plus any party slot label, role, kind,
freeform label, notes, and order.

Exact-source export is allowed when the current reconstructed template field fingerprint matches the
imported source fingerprint, including after UI-only changes or semantic edit/revert sequences.
Canonical export is shown only when app projection has explicit template mappings, validation has no
errors, EPIC-05 encode succeeds, and decode-back field equality proves fidelity.
Primary Any blocks canonical skill-template export with a field-specific reason. Secondary Any
continues to use the existing template-none semantics when the projection and codec proof pass.

## Performance Observation

`npm run build` after SPRINT-009 produced:

- JS: `dist/assets/index-DgaTWXiS.js`, 8,895.24 kB, 680.50 kB gzip
- CSS: `dist/assets/index-CI75JO7x.css`, 7.59 kB, 2.30 kB gzip

The large JS asset is expected from EPIC-08's static promoted-catalog import mandate. Runtime search
and rendering stay bounded, and a compact derived catalog or dynamic loader remains deferred until a
later evidence-backed ticket changes the architecture.

## Deferred Scope

Local library persistence, storage migrations, tags, favorites, backup/restore, share URLs, and
saved template workflows are documented in [Local library and sharing](local-library-and-sharing.md).
Build-set selection, inactive snapshots, variants, comparison, and transfer are documented in
[Multi-build workspace](multi-build-workspace.md). Title-rank behavior is documented in
[Title ranks](title-ranks.md). Equipment editor behavior is documented in
[Equipment editor](equipment-editor.md). Later epics own account-wide title profiles, title
ownership, allegiance side selection, hero catalogs, henchmen, portraits, hero AI behavior,
paw-ned2/team-template compatibility, guide authoring, recommendations, remote icon loading,
analytics, auth, deployment, and PWA behavior.
