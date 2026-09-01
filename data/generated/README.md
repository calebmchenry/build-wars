# Generated Data

Future normalized data produced from source snapshots belongs here. Generated contents are ignored by
Git until a later ticket approves exact paths.

## Allowed Locally

- Deterministic normalized JSON generated from approved source snapshots.
- `GeneratedArtifactManifest` records that list generator, inputs, source IDs, record count, digest,
  QA report path, commit decision, and notes.
- Metadata-only icon/file records when the source policy permits them.

## Commit Gate

Generated JSON remains ignored unless a future explicit ticket proves all of the following:

- exact generated file paths and parent-directory unignore rules are named
- deterministic regeneration is documented
- the app or tests need the committed artifact
- record or artifact provenance is complete
- generated diffs are reviewed
- QA findings are resolved, excluded, or dispositioned within the release scope

Icon binaries, screenshots, copied PvX/Fandom/community prose, ratings text, usage notes, and page
bodies are prohibited in this sprint. Synthetic fixture data belongs in `test/fixtures`, not here.
