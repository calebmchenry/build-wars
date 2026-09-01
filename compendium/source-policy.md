# Source Policy

This policy defines how Build Wars may use source material before importing,
normalizing, committing, or publishing source-derived data. It is project
policy, not legal advice. Unknown, mixed, or ambiguous cases are
review-required until a maintainer records a bounded decision.

The policy is conservative by default: copied prose, cached media, and unclear
rights status do not ship by accident. Later tickets may approve narrower
exceptions, but they must record provenance, review evidence, and the exact
scope approved.

## Vocabulary

Source concepts stay separate so a generated record can describe where material
came from, what the material is, how Build Wars used it, and what decision was
made for a specific release scope.

### Source Family

`SourceFamily` identifies where material came from:

- `guild-wars-wiki`: Guild Wars Wiki pages, files, and API metadata.
- `pvx-fandom`: PvX/Fandom pages and API metadata.
- `game-client`: game UI, game files, in-game descriptions, screenshots, and
  publisher-provided material.
- `community-tool`: build tools, databases, guides, calculators, or other
  community projects.
- `manual`: maintainer-entered facts or overrides that are not copied from an
  external source payload.
- `development-reference`: screenshots, prior art, notes, or comparison
  material used only while designing or reviewing Build Wars.
- `other`: another identified source family that does not fit a current value.
- `unknown`: material whose source family is not known.

### Material Class

`SourceMaterialClass` identifies what the material is:

- `factual-metadata`: identifiers, titles, numeric values, categories, links,
  timestamps, file metadata, and other facts.
- `contributor-text`: wiki or community prose written by contributors, including
  page bodies, descriptions, notes, ratings text, and usage guidance.
- `game-publisher-material`: ArenaNet/NCSoft-owned game content, including
  official descriptions, names, icons, UI text, and screenshots.
- `community-content`: third-party builds, guide structure, ratings,
  recommendations, variants, and annotations.
- `media-metadata`: file title, canonical URL, MIME type, dimensions, byte size,
  remote timestamp, remote hash, and page/file identity without cached bytes.
- `derived-value`: values Build Wars calculates, normalizes, maps, or combines
  from one or more source facts.
- `manual-override`: maintainer-entered correction or replacement that
  supersedes generated material.
- `development-reference`: prior art or review material that informs design but
  is not runtime content.
- `unknown`: material whose class is not known.

Copied text does not become `factual-metadata` just because it appears in a
structured wiki table, API response, game UI, or generated JSON file. Classify
the field by the substance copied.

### Provenance Method

`ProvenanceMethod` records what Build Wars did with the material:

- `copied`: copied source wording or source-owned expressive content.
- `normalized`: transformed factual source values into Build Wars schema.
- `derived`: calculated, inferred, mapped, or combined from source facts.
- `linked-only`: retained only a link or external identity.
- `manual-override`: replaced or supplemented generated data by reviewer
  decision.
- `excluded`: known material intentionally omitted from the artifact.

### Rights Basis

`SourceRightsBasis` records source-declared or reviewer-recorded rights context:

- `unknown`: no reliable basis recorded.
- `ambiguous`: source status is unclear or conflicts with another signal.
- `mixed`: one page, file, or artifact contains more than one rights basis.
- `publisher-owned`: ArenaNet/NCSoft or another publisher appears to own the
  material.
- `contributor-license-declared`: the source declares contributor license terms
  for the relevant material.
- `public-domain-like`: the material is declared public-domain-like or otherwise
  low-restriction by the source.
- `community-unknown`: community-origin material with no clear reusable license.

### Use Decision

`SourceUseDecision` is the Build Wars decision for a bounded scope:

- `allowed`: may be used for the recorded scope after required provenance is
  present.
- `review-required`: may not ship to the recorded scope until manual review is
  complete.
- `prohibited`: must not be copied, committed, consumed by the app, or published
  for the recorded scope.
- `excluded`: intentionally left out of generated output or release payload.
- `explicit-ticket-required`: requires a later ticket naming the source, exact
  paths or fields, review basis, attribution plan, and release scope.

### Review State

Manual review records must include reviewer, timestamp, scope, decision,
rationale, evidence, related finding IDs, and follow-up ticket IDs. A review
decision applies only to its recorded scope. Ambiguous or unknown cases remain
`review-required` until a named reviewer closes them.

## Source Use Matrix

| Source or content class                                                      | Default decision                                    | Required handling                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Factual metadata                                                             | `allowed` after provenance                          | Normalize into generated records with source family, URL, page/file identity when available, revision facts, retrieval facts, material class, rights basis, use decision, and notes. |
| Copied contributor text                                                      | `review-required`; often `explicit-ticket-required` | Copy only with attribution, review evidence, bounded release scope, and a future explicit ticket when public runtime use is involved.                                                |
| Publisher-owned game material                                                | `review-required`                                   | Record publisher/source basis and decide field-by-field before release.                                                                                                              |
| Derived values                                                               | `allowed` after provenance                          | Record source inputs and transformation notes; do not hide copied text inside a derived field.                                                                                       |
| Manual overrides                                                             | `allowed` after review                              | Record reviewer, rationale, superseded generated claim, evidence, and follow-up tickets where needed.                                                                                |
| Icon metadata                                                                | `allowed` metadata-only                             | Store file title, canonical URL, MIME type, dimensions, byte size, remote timestamp, remote SHA-1 when provided, page/file identity, and provenance.                                 |
| Icon binaries                                                                | `prohibited` in this sprint                         | Do not add cached icon files to the repo, runtime bundle, tests, or generated catalogs. Offline/PWA caching requires a future explicit ticket.                                       |
| Screenshots and prior-art images                                             | `development-reference` only                        | Do not add new external image assets or use them as runtime assets. Future use requires explicit approval and attribution.                                                           |
| PvX/Fandom/community links                                                   | `allowed` as `linked-only` metadata                 | Keep title, canonical URL, external IDs when available, and provenance.                                                                                                              |
| PvX/Fandom/community guide prose, ratings text, usage notes, and page bodies | `prohibited` in this sprint                         | Do not copy into fixtures, generated data, runtime UI, or docs except for a future minimal reviewed excerpt approved by explicit ticket.                                             |
| Generated records                                                            | `allowed` only after QA and release gates           | Carry record or artifact provenance and pass QA closeout before app consumption or public release.                                                                                   |
| Unknown or ambiguous material                                                | `review-required`                                   | Record the uncertainty as a QA finding and exclude from public release until resolved or excluded.                                                                                   |

## Attribution Requirements

Copied or source-derived runtime data must carry enough attribution and lineage
for a reviewer to trace the field back to its source. The required attribution
facts are:

- source name
- source family
- canonical URL
- page identity, file identity, or external ID when available
- revision ID or equivalent source revision identity
- source revision timestamp
- retrieval timestamp
- material class
- rights basis
- use decision
- reviewer notes or transformation notes when applicable

Missing revision identity, missing source revision timestamp, or missing
retrieval timestamp must produce a QA finding. Source URLs are provenance
references, not trusted fetch targets.

## Field-Level Classification

Generated records may have multiple source references and different provenance
per field. Guild Wars Wiki pages can mix contributor text with ArenaNet/NCSoft
game material on the same page, so generated records must support field-level
classification where needed.

Field claims use RFC 6901 JSON Pointer:

- `""` means the whole record.
- Object keys use `/key`.
- Array indices use `/0`, `/1`, and so on.
- `~` is escaped as `~0`.
- `/` is escaped as `~1`.

TypeScript contracts describe this shape but do not prove pointer validity.
Ingestion-boundary validation belongs to EPIC-02.

## Media Rules

This sprint permits metadata and links for remote media where policy allows it.
It does not permit cached icon binaries, screenshots, prior-art images, or
other external media assets in the repo or runtime bundle.

Icon metadata may accompany approved generated data only when it remains
metadata-only and includes remote file identity, canonical URL, MIME type,
dimensions when known, byte size when known, remote timestamp, remote SHA-1
when provided, and provenance.

Screenshots and prior-art images remain development references. They must not
be imported into runtime assets, generated catalogs, tests, or public release
payloads in this sprint.

## Exceptions

An exception requires a named maintainer or reviewer, timestamp, bounded scope,
rationale, evidence, related QA finding IDs, and follow-up ticket IDs. Where
appropriate, it must include an expiration date or re-review trigger.

The following are non-waivable for public release: unknown copied material,
digest mismatch, and unreadable artifacts. Resolve them or exclude the affected
content from the public release scope.

Public copied-content or cached-media exceptions require a future explicit
ticket. `git add -f` is not an approval mechanism.

## Artifact Retention

Retention rules are documented in `data/README.md`, the data subdirectory
READMEs, and `scripts/data/README.md`. Broad deny-by-default ignore rules are
the norm. Approved generated files must be allowlisted by exact path, including
any required parent-directory unignore rules.

Raw source payloads, snapshot manifests, normalized generated JSON, and QA
reports stay ignored by default unless a future ticket explicitly approves a
minimal, deterministic, provenance-bearing exception.

## Release Gate

Source-derived runtime data must pass the QA and release gates in
`compendium/data-qa-and-release.md` before app consumption or public release.
The release owner must verify attribution, source links, generated-data notices,
license/source notes, QA dispositions, media restrictions, and exception
authority for the release scope.
