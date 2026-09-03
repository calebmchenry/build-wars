# Template Compatibility

EPIC-05 adds a framework-neutral template compatibility boundary for Guild Wars skill and raw
equipment template codes.

## Dependency

Build Wars pins `@buildwars/gw-templates` exactly at `1.1.1`.

- License: MIT.
- Public package entry points: `lib/main.cjs` for Node and `lib/browser.js` for browser builds.
- Transitive dependency: `windows-1252@3.0.4`, MIT.
- Package documentation advertises JavaScript support for Node.js `>=24`, while Build Wars keeps
  `engines.node` at `>=22.11.0`.
- The mandatory skill and equipment paths are proven by Vitest, TypeScript, and Vite production
  build at Node.js `22.11.0`; the repo Node floor is not raised.

No package tarball, extracted package source, CDN import, vendored parser, or runtime package fetch
is part of the application.

## Boundary

Public template data lives in `src/domain/template.ts`. Runtime dependency calls are isolated to
`src/template-compatibility/gw-templates-adapter.ts`; no public API returns vendor classes, buffers,
errors, stacks, or dependency-specific field names.

`tsconfig.template-compatibility.json`, ESLint restrictions, and
`test/template-compatibility/error-boundary.test.ts` enforce the framework-neutral boundary.
`src/domain` does not import `src/template-compatibility`, app modules, React, DOM/browser APIs,
storage, network clients, generated manifests, QA reports, source snapshots, data scripts, or wiki
APIs.

## Public API

`src/template-compatibility` exports:

- `decodeSkillTemplate` and `exportSkillTemplate`
- `decodeEquipmentTemplate` and `exportEquipmentTemplate`
- `resolveSkillTemplateDocument`
- `parseTemplateInput` and `formatTemplateChatCode`

Skill documents preserve primary and secondary template profession IDs, ordered attribute/rank
pairs, and exactly eight raw template skill IDs. Skill slot `0` remains an empty-slot sentinel.
Equipment documents preserve deterministic raw slot, item, color, and ordered modifier facts without
joining to semantic armor, rune, insignia, weapon, modifier, color, or dye catalogs.

EPIC-13 semantic `EquipmentLoadout` state is intentionally separate from these raw
`EquipmentTemplateDocument` facts. The raw codec keeps exact-source replay and color/item/modifier
field preservation; later EPIC-17 work may map raw template facts into semantic selections without
moving raw IDs into authored `Build.equipment`.

Catalog resolution is a pure caller-supplied view over EPIC-03 and EPIC-04 catalogs. It reports
known, none, reserved, unsupported, dispositioned, empty, and unknown outcomes without mutating the
decoded template document or caching catalog truth.

## Fidelity And Errors

Exports use two proof modes:

- `exact-source`: unchanged decoded template facts re-emit the original bare code exactly; wrapper
  names may change around that preserved code.
- `field-complete-normalized`: edited or canonical exports call the dependency, decode the result
  again, and return a code only if every modeled field matches.

Lossy canonical output returns a typed failure and no code. Stable error codes cover oversized
input, empty input, invalid character sets, invalid chat wrappers, unsafe template names,
wrong-kind inputs, unsupported headers, malformed payloads, invalid decoded shapes, invalid field
values, source changes, unsupported codec behavior, lossy encode, dependency failure, and paw-ned2
deferral.

Current code-owned limits:

- Whole input: 4096 characters.
- Bare skill/equipment code: 2048 characters.
- Template name: 256 Unicode code points.
- Skill slots: exactly 8.
- Skill attributes: at most 16.
- Equipment items: at most 7.
- Equipment modifiers per item: at most 8.
- Equipment color IDs for canonical export: raw 0-15.

## Wrapper Policy

The parser accepts a bare code or exactly one `[name;code]` wrapper after trimming only outer ASCII
whitespace. `templateName: null` means no wrapper; `templateName: ""` means an explicit empty name.

Names preserve safe text exactly and reject semicolons, square brackets, NUL/control characters,
carriage returns, line feeds, DEL, and over-limit text. Missing codes, nested wrappers, trailing
text, ambiguous delimiters, unsupported Unicode whitespace in structural positions, unsupported
headers, and cross-kind codes fail with typed errors.

## paw-ned2

paw-ned2/team support is deferred in SPRINT-006. The pinned JavaScript package can expose paw-ned2
constructors, but the Node.js `22.11.0` package-entry probe failed minimal encode with
`TypeError: $string.toBase64 is not a function`. Because the sprint requires Node/Vite/runtime proof
before shipping a team surface, no public team codec is exported.

Follow-up owner: `EPIC-17`, via `BW-1701`.

## Upgrade Gate

Any dependency upgrade must rerun the compatibility corpus, review declarations and package entry
points, compare normalization and fidelity diffs, inspect bundle/import behavior, and prove the
Node.js floor before public contracts rely on changed behavior.
