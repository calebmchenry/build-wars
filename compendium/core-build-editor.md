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
and type modes. Rendering is bounded by a batch size with explicit expansion.

## Budget Assumptions

PvE uses the same explicit level and quest-bonus controls for display and validation. The default is
level 20 with maximum applicable quest bonus. PvP and unknown mode use an explicit non-evaluated
attribute budget policy rather than inheriting PvE points.

## Interaction Model

The main column renders `Skills` and `Equipment` tabs. `Skills` is the default tab and keeps the
existing eight-slot skill bar, compact title-rank panel, and skill browser. Users can place skills
from the browser, replace a slot, move to an empty slot, swap filled slots, clear slots, and use
keyboard pick/place/cancel controls. Drag payloads are opaque app JSON under an internal MIME type
and are validated before the reducer receives an action.

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

The current promoted EPIC-04 catalog mostly exposes structured-only descriptions rather than copied
source prose. The editor renders supported structured facts and progression tables separately and
uses stable non-crashing unresolved states for gaps.

## Export Policy

Template import uses EPIC-05 `decodeSkillTemplate` and `resolveSkillTemplateDocument`. Successful
import is transactional and sets build mode to `unknown`. Failed parse, decode, or resolve leaves
the prior editor state unchanged.

Exact-source export is allowed when the current reconstructed template field fingerprint matches the
imported source fingerprint, including after UI-only changes or semantic edit/revert sequences.
Canonical export is shown only when app projection has explicit template mappings, validation has no
errors, EPIC-05 encode succeeds, and decode-back field equality proves fidelity.

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
Title-rank behavior is documented in [Title ranks](title-ranks.md). Equipment editor behavior is
documented in [Equipment editor](equipment-editor.md). Later epics own account-wide title profiles,
title ownership, allegiance side selection, party/hero builds, guide authoring, recommendations,
remote icon loading, analytics, auth, deployment, and PWA behavior.
