# 0002 Runtime Guild Wars Wiki Icon Assets

Date: 2026-09-03

## Status

Accepted.

## Context

The original source policy prohibited runtime icon binaries during early catalog work. The focused
composer first needed real Guild Wars Wiki skill cost/timing icons and a small cached skill-icon
smoke case, without hotlinking remote wiki media from React components. The broader skill catalog now
needs local runtime icons for every skill whose Guild Wars Wiki icon file resolves unambiguously.

## Decision

Approve cached-media exceptions for:

- the exact manually imported files under `src/app/assets/gww-icons/`;
- generated skill icon binaries under `public/gww-icons/skills/`;
- `src/app/skill-icon-assets.generated.json`, which maps skill IDs to local public paths only;
- `data/generated/epic-04/skill-icon-assets.manifest.json`, which records provenance for generated
  skill icon binaries.

The approved source URLs for manually imported files are documented in
`src/app/assets/gww-icons/README.md`. Generated skill icon source URLs, remote hashes, file titles,
and local paths are documented in `data/generated/epic-04/skill-icon-assets.manifest.json`.

Runtime TypeScript must not use remote Guild Wars Wiki URLs as image sources, preload targets, fetch
targets, CSS URLs, or service worker entries.

## Scope

Approved local files:

- `src/app/assets/gww-icons/divine-boon.jpg`
- `src/app/assets/gww-icons/hammer-bash.jpg`
- `src/app/assets/gww-icons/healing-signet.jpg`
- `src/app/assets/gww-icons/hunters-shot.jpg`
- `src/app/assets/gww-icons/mighty-blow.jpg`
- `src/app/assets/gww-icons/pin-down.jpg`
- `src/app/assets/gww-icons/profession-assassin-20.png`
- `src/app/assets/gww-icons/profession-assassin-60.png`
- `src/app/assets/gww-icons/profession-dervish-20.png`
- `src/app/assets/gww-icons/profession-dervish-60.png`
- `src/app/assets/gww-icons/profession-elementalist-20.png`
- `src/app/assets/gww-icons/profession-elementalist-60.png`
- `src/app/assets/gww-icons/profession-mesmer-20.png`
- `src/app/assets/gww-icons/profession-mesmer-60.png`
- `src/app/assets/gww-icons/profession-monk-20.png`
- `src/app/assets/gww-icons/profession-monk-60.png`
- `src/app/assets/gww-icons/profession-necromancer-20.png`
- `src/app/assets/gww-icons/profession-necromancer-60.png`
- `src/app/assets/gww-icons/profession-paragon-20.png`
- `src/app/assets/gww-icons/profession-paragon-60.png`
- `src/app/assets/gww-icons/profession-ranger-20.png`
- `src/app/assets/gww-icons/profession-ranger-60.png`
- `src/app/assets/gww-icons/profession-ritualist-20.png`
- `src/app/assets/gww-icons/profession-ritualist-60.png`
- `src/app/assets/gww-icons/profession-warrior-20.png`
- `src/app/assets/gww-icons/profession-warrior-60.png`
- `src/app/assets/gww-icons/resurrection-signet.jpg`
- `src/app/assets/gww-icons/rush.jpg`
- `src/app/assets/gww-icons/tango-activation-darker.png`
- `src/app/assets/gww-icons/tango-adrenaline.png`
- `src/app/assets/gww-icons/tango-energy.png`
- `src/app/assets/gww-icons/tango-overcast.png`
- `src/app/assets/gww-icons/tango-recharge-darker.png`
- `src/app/assets/gww-icons/tango-sacrifice.png`
- `src/app/assets/gww-icons/tango-upkeep.png`
- `src/app/assets/gww-icons/to-the-limit.jpg`

Generated skill icon files must remain under `public/gww-icons/skills/`, must be selected from
MediaWiki `imageinfo` metadata, and must be referenced in runtime only through the local-path
manifest.
