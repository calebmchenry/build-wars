# Data Scripts

Future ingestion and QA scripts live here. They may import public contracts from `src/domain`, read
raw snapshots from `data/source-snapshots`, write normalized artifacts to `data/generated`, and
publish validation reports under `data/qa`.

The intended flow is fetch, snapshot, normalize, validate, and publish. Runtime app code must not
import from this directory.

## Future Pipeline Contract

| Stage     | Inputs                                               | Outputs                                                              | Required contracts and gates                                                                                                                                                                                    |
| --------- | ---------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fetch     | Source profile and canonical URL                     | Raw source payload in `data/source-snapshots`                        | Network clients and freshness profiles are EPIC-02 work. Source values are untrusted.                                                                                                                           |
| Snapshot  | Raw payload and source metadata                      | `SourceSnapshotManifest` plus ignored raw payload                    | Must record source family, page/file identity, revision identity, source revision timestamp, retrieval timestamp, artifact path, and digest when available.                                                     |
| Normalize | Snapshot manifest and raw payload                    | Normalized JSON plus `GeneratedArtifactManifest` in `data/generated` | Must attach record or artifact provenance, field claims, transformation notes, and metadata-only media references where allowed.                                                                                |
| Validate  | Generated artifact manifest and records              | `QaReport` in `data/qa`                                              | Must report provenance gaps, stale/unverified revisions, rights ambiguity, invalid source IDs, manual overrides, copied text, icon metadata gaps, generated diffs, schema/shape errors, and integrity failures. |
| Publish   | QA report, release scope, and approved artifact list | Release attestation or excluded artifact                             | Must pass app-consumption and public-release gates before runtime use.                                                                                                                                          |

Runtime schema validation, source fetching, parsers, cache management, and release attestation
commands are intentionally deferred. This sprint defines the contracts and gates they must use.
