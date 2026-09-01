# Source Snapshots

Future raw source snapshots belong here after EPIC-02 introduces fetchers. Snapshot contents are
ignored by Git; this README remains tracked as the policy file.

## Allowed Locally

- Raw API responses, page payloads, file metadata payloads, and minimized diagnostic captures created
  by future ingestion tooling.
- `SourceSnapshotManifest` records that identify source family, canonical URL, page or file identity,
  revision identity, source revision timestamp, retrieval timestamp, artifact path, digest when
  available, and retention decision.

## Commit Default

Raw payloads and snapshot manifests are ignored by default. A future committed snapshot or minimized
external fixture requires an explicit ticket, exact path, provenance, material classification, manual
review, and a clear test or release need.

Raw snapshots are never consumed directly by runtime app code. Future tooling must treat source URLs,
filenames, payloads, and evidence as untrusted data.
