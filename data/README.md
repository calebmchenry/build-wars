# Data Artifacts

This directory reserves stable locations for source-derived artifacts. The default policy is
deny-by-default: raw snapshots, generated catalogs, generated manifests, and QA reports are ignored
unless a future explicit ticket approves an exact-path exception.

Artifact lifecycle:

```text
external source revision
  -> SourceSnapshotManifest + ignored raw payload
  -> GeneratedArtifactManifest + normalized records
  -> QaReport
  -> release attestation or excluded artifact
```

## Directory Policy

- `source-snapshots/` stores raw source captures and snapshot manifests written by the EPIC-02
  ingestion tooling. Contents stay ignored by default.
- `generated/` stores normalized JSON and generated artifact manifests. Contents stay ignored by
  default until an explicit ticket approves deterministic regeneration, exact paths, app or test
  need, complete provenance, and QA closeout.
- `qa/` stores generated validation, coverage, manual-review, and release-gate reports. Contents
  stay ignored by default unless a later ticket promotes a stable summary document.

## Commit Rules

Policy README files remain trackable so directory contracts are visible. Synthetic fixtures belong
under `test/fixtures` and must stay non-authoritative. Minimized external regression fixtures require
an explicit ticket, provenance, classification, review, and the smallest useful excerpt.

Icon metadata may accompany approved generated data, but icon binaries are prohibited in this sprint.
The ingestion platform records `cachedBytes: false` for remote icon metadata. Screenshots and
prior-art images are development references only and must not be committed as runtime assets by this
sprint.

Future allowlists must name exact files and any required parent-directory unignore rules. `git add
-f` is not an approval path.

`npm run data:regenerate` writes fixture-mode outputs under ignored `work/runs/data-ingestion`.
Production data in this directory must remain local until a later exact-path promotion ticket
approves it.
