import {
  SOURCE_POLICY_SCHEMA_VERSION,
  type GeneratedArtifactManifest,
  type ManualOverride,
  type ManualReview,
  type ProvenanceClaim,
  type QaFinding,
  type QaReport,
  type RecordProvenance,
  type RemoteMediaMetadata,
  type SourceReference,
  type SourceSnapshotManifest
} from "../../src/domain";

export const syntheticWikiSource: SourceReference = {
  id: "source:gww:synthetic-skill",
  name: "Guild Wars Wiki",
  family: "guild-wars-wiki",
  canonicalUrl: "https://wiki.guildwars.com/wiki/Synthetic_Skill",
  pageId: 900001,
  pageTitle: "Synthetic Skill",
  fileId: null,
  fileTitle: null,
  revisionId: 123456,
  sourceRevisionTimestamp: "2026-01-01T00:00:00Z",
  retrievedAt: "2026-01-02T00:00:00Z",
  materialClass: "unknown",
  rightsBasis: "mixed",
  useDecision: "review-required",
  license: {
    name: "source-declared contributor license",
    url: "https://wiki.guildwars.com/wiki/Guild_Wars_Wiki:Copyrights",
    declaredBySource: true,
    notes: "Synthetic metadata only; not an authoritative source assertion."
  },
  notes: "A wiki page can mix contributor text and publisher-owned game material."
};

export const syntheticGameSource: SourceReference = {
  id: "source:game-client:skill-text",
  name: "Guild Wars game client",
  family: "game-client",
  canonicalUrl: null,
  pageId: null,
  pageTitle: null,
  fileId: null,
  fileTitle: null,
  revisionId: "synthetic-client-build",
  sourceRevisionTimestamp: "2026-01-01T00:00:00Z",
  retrievedAt: "2026-01-02T00:00:00Z",
  materialClass: "game-publisher-material",
  rightsBasis: "publisher-owned",
  useDecision: "review-required",
  license: null,
  notes: "Synthetic game-client reference, not copied source content."
};

export const syntheticCommunitySource: SourceReference = {
  id: "source:pvx:synthetic-link",
  name: "PvX/Fandom",
  family: "pvx-fandom",
  canonicalUrl: "https://gwpvx.fandom.com/wiki/Build:Synthetic_Link",
  pageId: null,
  pageTitle: "Build:Synthetic Link",
  fileId: null,
  fileTitle: null,
  revisionId: 98765,
  sourceRevisionTimestamp: "2026-01-03T00:00:00Z",
  retrievedAt: "2026-01-04T00:00:00Z",
  materialClass: "community-content",
  rightsBasis: "community-unknown",
  useDecision: "allowed",
  license: null,
  notes: "Metadata-and-link-only fixture; guide prose is not copied."
};

export const syntheticIconSource: SourceReference = {
  id: "source:gww:file-synthetic-icon",
  name: "Guild Wars Wiki file metadata",
  family: "guild-wars-wiki",
  canonicalUrl: "https://wiki.guildwars.com/wiki/File:Synthetic_icon.png",
  pageId: 900002,
  pageTitle: "File:Synthetic icon.png",
  fileId: 700001,
  fileTitle: "File:Synthetic icon.png",
  revisionId: 123457,
  sourceRevisionTimestamp: "2026-01-05T00:00:00Z",
  retrievedAt: "2026-01-06T00:00:00Z",
  materialClass: "media-metadata",
  rightsBasis: "mixed",
  useDecision: "allowed",
  license: null,
  notes: "Metadata-only icon reference; no image bytes are cached."
};

export const syntheticManualSource: SourceReference = {
  id: "source:manual:reviewer-override",
  name: "Build Wars manual review",
  family: "manual",
  canonicalUrl: null,
  pageId: null,
  pageTitle: null,
  fileId: null,
  fileTitle: null,
  revisionId: null,
  sourceRevisionTimestamp: null,
  retrievedAt: "2026-01-07T00:00:00Z",
  materialClass: "manual-override",
  rightsBasis: "unknown",
  useDecision: "allowed",
  license: null,
  notes: "Manual override fixture for supersession tests."
};

export const syntheticAmbiguousSource: SourceReference = {
  id: "source:unknown:ambiguous",
  name: "Unknown community mirror",
  family: "unknown",
  canonicalUrl: null,
  pageId: null,
  pageTitle: null,
  fileId: null,
  fileTitle: null,
  revisionId: null,
  sourceRevisionTimestamp: null,
  retrievedAt: null,
  materialClass: "unknown",
  rightsBasis: "ambiguous",
  useDecision: "review-required",
  license: null,
  notes: "Ambiguous material stays review-required."
};

export const wholeRecordClaim: ProvenanceClaim = {
  id: "claim:whole-record",
  fieldPath: "",
  sourceIds: [syntheticWikiSource.id],
  method: "normalized",
  materialClass: "factual-metadata",
  rightsBasis: "mixed",
  useDecision: "review-required",
  transformationNotes: "Whole-record scope uses the empty RFC 6901 JSON Pointer.",
  reviewIds: []
};

export const normalizedFactClaim: ProvenanceClaim = {
  id: "claim:skill-name-normalized",
  fieldPath: "/name",
  sourceIds: [syntheticWikiSource.id],
  method: "normalized",
  materialClass: "factual-metadata",
  rightsBasis: "contributor-license-declared",
  useDecision: "allowed",
  transformationNotes: "Synthetic title normalized into a catalog record name.",
  reviewIds: []
};

export const copiedTextClaim: ProvenanceClaim = {
  id: "claim:description-copied",
  fieldPath: "/description",
  sourceIds: [syntheticWikiSource.id, syntheticGameSource.id],
  method: "copied",
  materialClass: "contributor-text",
  rightsBasis: "mixed",
  useDecision: "review-required",
  transformationNotes: "Copied wiki-like prose is not treated as factual metadata.",
  reviewIds: ["review:copied-description"]
};

export const derivedProgressionClaim: ProvenanceClaim = {
  id: "claim:progression-derived",
  fieldPath: "/progression/breakpoints/0/values/0",
  sourceIds: [syntheticWikiSource.id],
  method: "derived",
  materialClass: "derived-value",
  rightsBasis: "contributor-license-declared",
  useDecision: "allowed",
  transformationNotes: "Synthetic progression value derived from source facts.",
  reviewIds: []
};

export const communityLinkClaim: ProvenanceClaim = {
  id: "claim:community-link",
  fieldPath: "/communityLinks/0/url",
  sourceIds: [syntheticCommunitySource.id],
  method: "linked-only",
  materialClass: "community-content",
  rightsBasis: "community-unknown",
  useDecision: "allowed",
  transformationNotes: "Only the community page URL is retained.",
  reviewIds: []
};

export const ambiguousMaterialClaim: ProvenanceClaim = {
  id: "claim:ambiguous-source",
  fieldPath: "/notes/~0uncertain~1field",
  sourceIds: [syntheticAmbiguousSource.id],
  method: "excluded",
  materialClass: "unknown",
  rightsBasis: "ambiguous",
  useDecision: "review-required",
  transformationNotes: "Escaped pointer covers a key containing tilde and slash.",
  reviewIds: []
};

export const arrayFieldClaim: ProvenanceClaim = {
  id: "claim:array-field",
  fieldPath: "/effects/0/duration~1seconds",
  sourceIds: [syntheticWikiSource.id],
  method: "normalized",
  materialClass: "factual-metadata",
  rightsBasis: "contributor-license-declared",
  useDecision: "allowed",
  transformationNotes: "Array index and slash escaping example.",
  reviewIds: []
};

export const danglingSourceClaim: ProvenanceClaim = {
  id: "claim:dangling-source",
  fieldPath: "/name",
  sourceIds: ["source:missing"],
  method: "normalized",
  materialClass: "factual-metadata",
  rightsBasis: "unknown",
  useDecision: "review-required",
  transformationNotes: "Invalid-source-reference QA fixture.",
  reviewIds: []
};

export const copiedDescriptionReview: ManualReview = {
  id: "review:copied-description",
  reviewer: "synthetic-reviewer",
  reviewedAt: "2026-01-08T00:00:00Z",
  scope: "/description",
  decision: "needs-follow-up",
  rationale: "Copied text requires release-scope review before public use.",
  evidence: [
    {
      kind: "source",
      reference: syntheticWikiSource.id,
      notes: "Synthetic evidence reference."
    }
  ],
  relatedFindingIds: ["finding:copied-text"],
  followUpTicketIds: ["BW-0207"],
  expiresAt: null,
  reReviewTrigger: "Before any copied runtime description ships."
};

export const manualOverrideReview: ManualReview = {
  id: "review:manual-override",
  reviewer: "synthetic-reviewer",
  reviewedAt: "2026-01-09T00:00:00Z",
  scope: "/name",
  decision: "approved",
  rationale: "Synthetic local name override supersedes normalized fixture title.",
  evidence: [
    {
      kind: "review-note",
      reference: "manual override fixture",
      notes: null
    }
  ],
  relatedFindingIds: ["finding:manual-override"],
  followUpTicketIds: [],
  expiresAt: null,
  reReviewTrigger: null
};

export const syntheticManualOverride: ManualOverride = {
  id: "override:skill-name",
  fieldPath: "/name",
  replacementValue: "Synthetic Reviewed Skill",
  method: "manual-override",
  supersedesClaimIds: [normalizedFactClaim.id],
  reviewId: manualOverrideReview.id,
  rationale: "Demonstrates manual override supersession without validating inputs.",
  followUpTicketIds: []
};

export const syntheticRecordProvenance: RecordProvenance = {
  schemaVersion: SOURCE_POLICY_SCHEMA_VERSION,
  sources: [
    syntheticWikiSource,
    syntheticGameSource,
    syntheticCommunitySource,
    syntheticIconSource,
    syntheticManualSource,
    syntheticAmbiguousSource
  ],
  claims: [
    wholeRecordClaim,
    normalizedFactClaim,
    copiedTextClaim,
    derivedProgressionClaim,
    communityLinkClaim,
    ambiguousMaterialClaim,
    arrayFieldClaim
  ],
  manualOverrides: [syntheticManualOverride],
  reviews: [copiedDescriptionReview, manualOverrideReview],
  notes: "Synthetic non-authoritative provenance fixture."
};

export const provenanceWithDanglingSource: RecordProvenance = {
  ...syntheticRecordProvenance,
  claims: [danglingSourceClaim],
  manualOverrides: [],
  reviews: [],
  notes: "Synthetic invalid source reference fixture."
};

export const syntheticRemoteIconMetadata: RemoteMediaMetadata = {
  id: "media:synthetic-icon",
  kind: "icon",
  sourceId: syntheticIconSource.id,
  fileTitle: "File:Synthetic icon.png",
  canonicalUrl: "https://wiki.guildwars.com/images/synthetic-icon.png",
  mimeType: "image/png",
  width: 64,
  height: 64,
  sizeBytes: 4096,
  remoteTimestamp: "2026-01-05T00:00:00Z",
  remoteSha1: "0123456789abcdef0123456789abcdef01234567",
  cachedBytes: false,
  useDecision: "allowed",
  notes: "Metadata-only; no icon binary is part of the fixture."
};

export const syntheticSourceSnapshotManifest: SourceSnapshotManifest = {
  schemaVersion: SOURCE_POLICY_SCHEMA_VERSION,
  artifactPath: "data/source-snapshots/synthetic/wiki-skill.raw.json",
  sourceReference: syntheticWikiSource,
  retrievedAt: "2026-01-02T00:00:00Z",
  sourceRevisionId: syntheticWikiSource.revisionId,
  sourceRevisionTimestamp: syntheticWikiSource.sourceRevisionTimestamp,
  digest: {
    algorithm: "sha256",
    value: "0".repeat(64),
    notes: "Synthetic digest for contract tests."
  },
  rawPayloadPolicy: "ignored",
  notes: "Snapshot manifest fixture only; raw payload remains ignored."
};

export const syntheticGeneratedArtifactManifest: GeneratedArtifactManifest = {
  schemaVersion: SOURCE_POLICY_SCHEMA_VERSION,
  artifactPath: "data/generated/synthetic/skills.json",
  generatedAt: "2026-01-10T00:00:00Z",
  generator: "synthetic-source-policy-fixture",
  inputSnapshotManifestPaths: [syntheticSourceSnapshotManifest.artifactPath],
  sourceIds: [syntheticWikiSource.id, syntheticIconSource.id],
  recordCount: 1,
  digest: {
    algorithm: "sha256",
    value: "1".repeat(64),
    notes: "Synthetic generated artifact digest."
  },
  qaReportPath: "data/qa/synthetic/skills.qa.json",
  commitDecision: "ignored",
  notes: "Generated data remains ignored unless a future exact-path ticket approves it."
};

export const qaFindings: readonly QaFinding[] = [
  {
    id: "finding:missing-provenance",
    code: "QA-MISSING-PROVENANCE",
    category: "missing-provenance",
    severity: "critical",
    scope: {
      kind: "record",
      artifactPath: syntheticGeneratedArtifactManifest.artifactPath,
      recordId: "synthetic-record-without-provenance",
      fieldPath: null,
      sourceIds: []
    },
    evidence: [],
    disposition: "open",
    reviewer: null,
    reviewedAt: null,
    rationale: null,
    followUpTicketIds: ["BW-0207"],
    expiresAt: null,
    reReviewTrigger: null
  },
  {
    id: "finding:stale-revision",
    code: "QA-STALE-REVISION",
    category: "stale-or-unverified-revision",
    severity: "warning",
    scope: {
      kind: "source",
      artifactPath: syntheticSourceSnapshotManifest.artifactPath,
      recordId: null,
      fieldPath: null,
      sourceIds: [syntheticWikiSource.id]
    },
    evidence: [{ kind: "source", reference: syntheticWikiSource.id, notes: null }],
    disposition: "resolved",
    reviewer: "synthetic-reviewer",
    reviewedAt: "2026-01-11T00:00:00Z",
    rationale: "Synthetic refresh confirmed revision metadata.",
    followUpTicketIds: [],
    expiresAt: null,
    reReviewTrigger: "Source-specific freshness profiles in EPIC-02."
  },
  {
    id: "finding:ambiguous-rights",
    code: "QA-AMBIGUOUS-RIGHTS",
    category: "ambiguous-source-or-rights",
    severity: "critical",
    scope: {
      kind: "field",
      artifactPath: syntheticGeneratedArtifactManifest.artifactPath,
      recordId: "synthetic-skill",
      fieldPath: ambiguousMaterialClaim.fieldPath,
      sourceIds: [syntheticAmbiguousSource.id]
    },
    evidence: [{ kind: "source", reference: syntheticAmbiguousSource.id, notes: null }],
    disposition: "excluded",
    reviewer: "synthetic-reviewer",
    reviewedAt: "2026-01-11T00:00:00Z",
    rationale: "Ambiguous material is excluded from release scope.",
    followUpTicketIds: ["BW-0207"],
    expiresAt: null,
    reReviewTrigger: "Before this field is considered for public release."
  },
  {
    id: "finding:manual-override",
    code: "QA-MANUAL-OVERRIDE",
    category: "manual-override",
    severity: "warning",
    scope: {
      kind: "field",
      artifactPath: syntheticGeneratedArtifactManifest.artifactPath,
      recordId: "synthetic-skill",
      fieldPath: syntheticManualOverride.fieldPath,
      sourceIds: [syntheticManualSource.id]
    },
    evidence: [{ kind: "review-note", reference: manualOverrideReview.id, notes: null }],
    disposition: "accepted-risk",
    reviewer: "synthetic-reviewer",
    reviewedAt: "2026-01-12T00:00:00Z",
    rationale: "Manual override is bounded to a synthetic test fixture.",
    followUpTicketIds: [],
    expiresAt: "2027-01-01T00:00:00Z",
    reReviewTrigger: "When generated source data changes."
  },
  {
    id: "finding:copied-text",
    code: "QA-COPIED-TEXT-UNATTRIBUTED",
    category: "copied-text-without-attribution",
    severity: "critical",
    scope: {
      kind: "field",
      artifactPath: syntheticGeneratedArtifactManifest.artifactPath,
      recordId: "synthetic-skill",
      fieldPath: copiedTextClaim.fieldPath,
      sourceIds: copiedTextClaim.sourceIds
    },
    evidence: [{ kind: "source", reference: syntheticWikiSource.id, notes: null }],
    disposition: "non-waivable",
    reviewer: null,
    reviewedAt: null,
    rationale: "Unknown copied material must be resolved or excluded for public release.",
    followUpTicketIds: ["BW-0207"],
    expiresAt: null,
    reReviewTrigger: null
  }
];

export const syntheticQaReport: QaReport = {
  schemaVersion: SOURCE_POLICY_SCHEMA_VERSION,
  artifactPath: "data/qa/synthetic/skills.qa.json",
  artifactManifestPath: syntheticGeneratedArtifactManifest.artifactPath,
  generatedAt: "2026-01-12T00:00:00Z",
  generator: "synthetic-source-policy-fixture",
  sourceIds: [
    syntheticWikiSource.id,
    syntheticGameSource.id,
    syntheticCommunitySource.id,
    syntheticIconSource.id,
    syntheticManualSource.id,
    syntheticAmbiguousSource.id
  ],
  findings: qaFindings,
  summary: {
    findingCount: qaFindings.length,
    criticalCount: 3,
    errorCount: 0,
    warningCount: 2,
    infoCount: 0,
    openBlockingCount: 2
  },
  appConsumptionGate: "blocked",
  publicReleaseGate: "blocked",
  notes: "Synthetic QA fixture covers dispositions; it is not a validator."
};
