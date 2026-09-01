# Data QA Reports

Future ingestion validation reports belong here. Report contents are ignored by Git; this README
stays tracked so the directory contract is visible.

The operational requirements for QA findings, manual review, and release gates live in
[`compendium/data-qa-and-release.md`](../../compendium/data-qa-and-release.md).

QA reports may contain generated evidence, source snippets, reviewer notes, local paths, and
untrusted source values. They are internal artifacts by default and are not runtime app data.

## Report Contents

Future `QaReport` files should record missing provenance, stale or unverified revision metadata,
ambiguous source or rights status, copied text without attribution, invalid source references, manual
overrides, missing icon metadata, generated-data diffs, artifact integrity mismatches,
schema/shape errors, unexpected source families, and other findings.

Each finding needs a stable code, severity, scope, evidence, disposition, reviewer metadata when
reviewed, rationale, expiration or re-review trigger when appropriate, and follow-up ticket IDs.

## Retention

Generated QA reports remain ignored by default. A future ticket may promote a stable summary document
only when it contains no prohibited source payload, secret, cached media, or unreviewed copied text.

Unknown copied material, digest mismatch, and unreadable artifacts are non-waivable for public
release and must be resolved or excluded.
