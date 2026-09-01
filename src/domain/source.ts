import type { CatalogVersionId, SchemaVersion } from "./ids";

export const FOUNDATION_SCHEMA_VERSION = 1 satisfies SchemaVersion;
export const SOURCE_POLICY_SCHEMA_VERSION = 1 satisfies SchemaVersion;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export type SourceFamily =
  | "guild-wars-wiki"
  | "pvx-fandom"
  | "game-client"
  | "community-tool"
  | "manual"
  | "development-reference"
  | "other"
  | "unknown";

export type SourceMaterialClass =
  | "factual-metadata"
  | "contributor-text"
  | "game-publisher-material"
  | "community-content"
  | "media-metadata"
  | "derived-value"
  | "manual-override"
  | "development-reference"
  | "unknown";

export type ProvenanceMethod =
  "copied" | "normalized" | "derived" | "linked-only" | "manual-override" | "excluded";

export type SourceRightsBasis =
  | "unknown"
  | "ambiguous"
  | "mixed"
  | "publisher-owned"
  | "contributor-license-declared"
  | "public-domain-like"
  | "community-unknown";

export type SourceUseDecision =
  "allowed" | "review-required" | "prohibited" | "excluded" | "explicit-ticket-required";

export type ManualReviewDecision =
  "approved" | "rejected" | "accepted-risk" | "excluded" | "needs-follow-up";

export type ArtifactCommitDecision =
  "ignored" | "tracked-readme-only" | "exact-path-allowlisted" | "prohibited";

export type DigestAlgorithm = "sha256" | "sha1" | "md5" | "source-provided";

export type RemoteMediaKind = "icon" | "screenshot" | "prior-art" | "other";

export type QaFindingCategory =
  | "missing-provenance"
  | "stale-or-unverified-revision"
  | "ambiguous-source-or-rights"
  | "copied-text-without-attribution"
  | "invalid-source-reference"
  | "manual-override"
  | "missing-icon-metadata"
  | "generated-data-diff"
  | "artifact-integrity-mismatch"
  | "schema-shape-error"
  | "unexpected-source-family"
  | "other";

export type QaFindingSeverity = "critical" | "error" | "warning" | "info";

export type QaFindingDisposition =
  "open" | "resolved" | "excluded" | "accepted-risk" | "non-waivable";

export type QaScopeKind = "artifact" | "record" | "field" | "source" | "release";
export type QaGateDecision = "pass" | "blocked" | "review-required";

export interface LicenseMetadata {
  readonly name: string | null;
  readonly url: string | null;
  readonly declaredBySource: boolean;
  readonly notes: string | null;
}

export interface SourceReference {
  readonly id: string;
  readonly name: string;
  readonly family: SourceFamily;
  readonly canonicalUrl: string | null;
  readonly pageId: string | number | null;
  readonly pageTitle: string | null;
  readonly fileId: string | number | null;
  readonly fileTitle: string | null;
  readonly revisionId: string | number | null;
  readonly sourceRevisionTimestamp: string | null;
  readonly retrievedAt: string | null;
  readonly materialClass: SourceMaterialClass;
  readonly rightsBasis: SourceRightsBasis;
  readonly useDecision: SourceUseDecision;
  readonly license: LicenseMetadata | null;
  readonly notes: string | null;
}

export interface ProvenanceEvidence {
  readonly kind: "source" | "artifact" | "review-note" | "qa-finding" | "ticket";
  readonly reference: string;
  readonly notes: string | null;
}

export interface ProvenanceClaim {
  readonly id: string;
  readonly fieldPath: string;
  readonly sourceIds: readonly string[];
  readonly method: ProvenanceMethod;
  readonly materialClass: SourceMaterialClass;
  readonly rightsBasis: SourceRightsBasis;
  readonly useDecision: SourceUseDecision;
  readonly transformationNotes: string | null;
  readonly reviewIds: readonly string[];
}

export interface ManualReview {
  readonly id: string;
  readonly reviewer: string;
  readonly reviewedAt: string;
  readonly scope: string;
  readonly decision: ManualReviewDecision;
  readonly rationale: string;
  readonly evidence: readonly ProvenanceEvidence[];
  readonly relatedFindingIds: readonly string[];
  readonly followUpTicketIds: readonly string[];
  readonly expiresAt: string | null;
  readonly reReviewTrigger: string | null;
}

export interface ManualOverride {
  readonly id: string;
  readonly fieldPath: string;
  readonly replacementValue: JsonValue;
  readonly method: "manual-override";
  readonly supersedesClaimIds: readonly string[];
  readonly reviewId: string;
  readonly rationale: string;
  readonly followUpTicketIds: readonly string[];
}

export interface RecordProvenance {
  readonly schemaVersion: SchemaVersion;
  readonly sources: readonly SourceReference[];
  readonly claims: readonly ProvenanceClaim[];
  readonly manualOverrides: readonly ManualOverride[];
  readonly reviews: readonly ManualReview[];
  readonly notes: string | null;
}

export interface RemoteMediaMetadata {
  readonly id: string;
  readonly kind: RemoteMediaKind;
  readonly sourceId: string;
  readonly fileTitle: string;
  readonly canonicalUrl: string;
  readonly mimeType: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly sizeBytes: number | null;
  readonly remoteTimestamp: string | null;
  readonly remoteSha1: string | null;
  readonly cachedBytes: false;
  readonly useDecision: SourceUseDecision;
  readonly notes: string | null;
}

export interface ArtifactDigest {
  readonly algorithm: DigestAlgorithm;
  readonly value: string;
  readonly notes: string | null;
}

export interface SourceSnapshotManifest {
  readonly schemaVersion: SchemaVersion;
  readonly artifactPath: string;
  readonly sourceReference: SourceReference;
  readonly retrievedAt: string;
  readonly sourceRevisionId: string | number | null;
  readonly sourceRevisionTimestamp: string | null;
  readonly digest: ArtifactDigest | null;
  readonly rawPayloadPolicy: ArtifactCommitDecision;
  readonly notes: string | null;
}

export interface GeneratedArtifactManifest {
  readonly schemaVersion: SchemaVersion;
  readonly artifactPath: string;
  readonly generatedAt: string;
  readonly generator: string;
  readonly inputSnapshotManifestPaths: readonly string[];
  readonly sourceIds: readonly string[];
  readonly recordCount: number;
  readonly digest: ArtifactDigest | null;
  readonly qaReportPath: string | null;
  readonly commitDecision: ArtifactCommitDecision;
  readonly notes: string | null;
}

export interface QaScope {
  readonly kind: QaScopeKind;
  readonly artifactPath: string | null;
  readonly recordId: string | number | null;
  readonly fieldPath: string | null;
  readonly sourceIds: readonly string[];
}

export interface QaFinding {
  readonly id: string;
  readonly code: string;
  readonly category: QaFindingCategory;
  readonly severity: QaFindingSeverity;
  readonly scope: QaScope;
  readonly evidence: readonly ProvenanceEvidence[];
  readonly disposition: QaFindingDisposition;
  readonly reviewer: string | null;
  readonly reviewedAt: string | null;
  readonly rationale: string | null;
  readonly followUpTicketIds: readonly string[];
  readonly expiresAt: string | null;
  readonly reReviewTrigger: string | null;
}

export interface QaReportSummary {
  readonly findingCount: number;
  readonly criticalCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  readonly openBlockingCount: number;
}

export interface QaReport {
  readonly schemaVersion: SchemaVersion;
  readonly artifactPath: string;
  readonly artifactManifestPath: string | null;
  readonly generatedAt: string;
  readonly generator: string;
  readonly sourceIds: readonly string[];
  readonly findings: readonly QaFinding[];
  readonly summary: QaReportSummary;
  readonly appConsumptionGate: QaGateDecision;
  readonly publicReleaseGate: QaGateDecision;
  readonly notes: string | null;
}

export interface CatalogVersionRef {
  readonly catalogVersion: CatalogVersionId | string | null;
  readonly generatedAt: string | null;
  readonly provenance: RecordProvenance | null;
}

export interface AuthoredDocumentRoot {
  readonly schemaVersion: SchemaVersion;
  readonly catalogVersion: CatalogVersionId | string | null;
}
