import { describe, expect, it } from "vitest";

import {
  SOURCE_POLICY_SCHEMA_VERSION,
  type GeneratedArtifactManifest,
  type QaFinding,
  type QaReport,
  type RecordProvenance,
  type RemoteMediaMetadata,
  type SourceSnapshotManifest
} from "../../src/domain";
import {
  copiedTextClaim,
  provenanceWithDanglingSource,
  qaFindings,
  syntheticGeneratedArtifactManifest,
  syntheticQaReport,
  syntheticRecordProvenance,
  syntheticRemoteIconMetadata,
  syntheticSourceSnapshotManifest
} from "../fixtures/source-policy";

function expectPlainJson(value: unknown): void {
  if (value === null || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(expectPlainJson);
    return;
  }

  expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
  Object.values(value).forEach(expectPlainJson);
}

function missingSourceIds(provenance: RecordProvenance): string[] {
  const sourceIds = new Set(provenance.sources.map((source) => source.id));

  return provenance.claims
    .flatMap((claim) => claim.sourceIds)
    .filter((sourceId) => !sourceIds.has(sourceId));
}

function getFirst<T>(items: readonly T[], label: string): T {
  const first = items[0];

  if (first === undefined) {
    throw new Error(`Missing ${label}`);
  }

  return first;
}

describe("source policy contracts", () => {
  it("exports plain JSON-compatible provenance, media, artifact, and QA shapes", () => {
    const provenance: RecordProvenance = syntheticRecordProvenance;
    const media: RemoteMediaMetadata = syntheticRemoteIconMetadata;
    const snapshot: SourceSnapshotManifest = syntheticSourceSnapshotManifest;
    const generated: GeneratedArtifactManifest = syntheticGeneratedArtifactManifest;
    const qaReport: QaReport = syntheticQaReport;
    const fixtures = [provenance, media, snapshot, generated, qaReport];

    expect(SOURCE_POLICY_SCHEMA_VERSION).toBe(1);
    fixtures.forEach((fixture) => {
      const encoded = JSON.stringify(fixture);
      const decoded = JSON.parse(encoded) as unknown;

      expectPlainJson(decoded);
      expect(JSON.stringify(decoded)).toBe(encoded);
    });
  });

  it("resolves source IDs for valid claims and exposes dangling references for QA", () => {
    expect(missingSourceIds(syntheticRecordProvenance)).toEqual([]);
    expect(missingSourceIds(provenanceWithDanglingSource)).toEqual(["source:missing"]);
  });

  it("represents whole-record, nested, array-index, escaped, and overlapping field claims", () => {
    const paths = syntheticRecordProvenance.claims.map((claim) => claim.fieldPath);

    expect(paths).toContain("");
    expect(paths).toContain("/name");
    expect(paths).toContain("/progression/breakpoints/0/values/0");
    expect(paths).toContain("/effects/0/duration~1seconds");
    expect(paths).toContain("/notes/~0uncertain~1field");
    expect(
      syntheticRecordProvenance.claims.some(
        (claim) => claim.fieldPath === "" && paths.includes("/name")
      )
    ).toBe(true);
  });

  it("keeps remote icon handling metadata-only", () => {
    expect(syntheticRemoteIconMetadata.kind).toBe("icon");
    expect(syntheticRemoteIconMetadata.cachedBytes).toBe(false);
    expect(syntheticRemoteIconMetadata).not.toHaveProperty("bytes");
    expect(syntheticRemoteIconMetadata.remoteSha1).toHaveLength(40);
  });

  it("records copied text, manual review, and override supersession without approving release", () => {
    const manualOverride = getFirst(syntheticRecordProvenance.manualOverrides, "manual override");
    const review = syntheticRecordProvenance.reviews.find(
      (candidate) => candidate.id === manualOverride.reviewId
    );

    expect(copiedTextClaim.method).toBe("copied");
    expect(copiedTextClaim.useDecision).toBe("review-required");
    expect(manualOverride.supersedesClaimIds).toEqual(["claim:skill-name-normalized"]);
    expect(review?.decision).toBe("approved");
  });

  it("preserves snapshot-to-generated artifact lineage and ignored commit defaults", () => {
    expect(syntheticSourceSnapshotManifest.rawPayloadPolicy).toBe("ignored");
    expect(syntheticGeneratedArtifactManifest.inputSnapshotManifestPaths).toEqual([
      syntheticSourceSnapshotManifest.artifactPath
    ]);
    expect(syntheticGeneratedArtifactManifest.commitDecision).toBe("ignored");
    expect(syntheticGeneratedArtifactManifest.digest?.algorithm).toBe("sha256");
    expect(syntheticGeneratedArtifactManifest.qaReportPath).toBe(syntheticQaReport.artifactPath);
  });

  it("covers QA dispositions, severities, scopes, and non-waivable public-release examples", () => {
    const findings: readonly QaFinding[] = qaFindings;
    const dispositions = new Set(findings.map((finding) => finding.disposition));
    const categories = new Set(findings.map((finding) => finding.category));

    expect(dispositions).toEqual(
      new Set(["open", "resolved", "excluded", "accepted-risk", "non-waivable"])
    );
    expect(categories).toEqual(
      new Set([
        "missing-provenance",
        "stale-or-unverified-revision",
        "ambiguous-source-or-rights",
        "manual-override",
        "copied-text-without-attribution"
      ])
    );
    expect(findings.some((finding) => finding.severity === "critical")).toBe(true);
    expect(
      findings.some(
        (finding) =>
          finding.disposition === "non-waivable" && finding.scope.fieldPath === "/description"
      )
    ).toBe(true);
    expect(syntheticQaReport.publicReleaseGate).toBe("blocked");
  });
});
