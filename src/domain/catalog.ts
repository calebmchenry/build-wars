import type {
  AttributeId,
  CatalogVersionId,
  InsigniaId,
  ProfessionId,
  RuneId,
  SchemaVersion,
  SkillId,
  TemplateAttributeId,
  TemplateProfessionId,
  TemplateSkillId
} from "./ids";
import type {
  GeneratedArtifactManifest,
  ManualReview,
  RecordProvenance,
  RemoteMediaMetadata,
  SourceReference
} from "./source";

export interface CatalogRecord<Id> {
  readonly id: Id;
  readonly name: string;
  readonly provenance: RecordProvenance | null;
}

export interface Profession extends CatalogRecord<ProfessionId> {
  readonly abbreviation: string | null;
  readonly primaryAttributeId: AttributeId | null;
}

export interface Attribute extends CatalogRecord<AttributeId> {
  readonly professionId: ProfessionId | null;
  readonly isPrimary: boolean;
}

export type ProfessionCampaign = "prophecies" | "factions" | "nightfall";
export type ProfessionFamily = "core" | "factions" | "nightfall";
export type TemplateCrosswalkStatus = "none" | "known" | "reserved" | "unsupported";
export type AttributeQuestCampaign = "prophecies" | "factions" | "nightfall";

export interface CatalogFieldProvenance {
  readonly sourceIds: readonly string[];
  readonly claimIds: readonly string[];
  readonly reviewIds: readonly string[];
  readonly notes: string | null;
}

export interface CatalogSectionDigest {
  readonly section: string;
  readonly digest: string;
}

export interface ProfessionAttributeProfile {
  readonly id: "epic-03-professions-attributes";
  readonly sourceTarget: "BACKLOG";
  readonly sourceEpic: "EPIC-03";
  readonly sourceCaps: {
    readonly pageLimit: number;
    readonly requestLimit: number;
    readonly responseByteCap: number;
    readonly parserByteCap: number;
  };
}

export interface ProfessionTemplateCrosswalkRecord {
  readonly templateId: TemplateProfessionId;
  readonly catalogId: ProfessionId | null;
  readonly name: string;
  readonly status: TemplateCrosswalkStatus;
  readonly normalizedName: string;
  readonly provenance: CatalogFieldProvenance;
}

export interface AttributeTemplateCrosswalkRecord {
  readonly templateId: TemplateAttributeId;
  readonly catalogId: AttributeId | null;
  readonly name: string;
  readonly status: Exclude<TemplateCrosswalkStatus, "none">;
  readonly normalizedName: string;
  readonly provenance: CatalogFieldProvenance;
}

export interface ReservedTemplateIdFact {
  readonly templateId: TemplateAttributeId | TemplateProfessionId;
  readonly namespace: "attribute" | "profession";
  readonly status: "reserved" | "unsupported";
  readonly reason: string;
  readonly provenance: CatalogFieldProvenance;
}

export interface TemplateCrosswalk {
  readonly professionTemplateIds: readonly ProfessionTemplateCrosswalkRecord[];
  readonly attributeTemplateIds: readonly AttributeTemplateCrosswalkRecord[];
  readonly reservedTemplateIds: readonly ReservedTemplateIdFact[];
}

export interface PrimaryAttributeEffectSummary {
  readonly text: string;
  readonly provenance: CatalogFieldProvenance;
}

export interface CatalogProfessionRecord {
  readonly id: ProfessionId;
  readonly templateId: TemplateProfessionId;
  readonly name: string;
  readonly abbreviation: string;
  readonly professionFamily: ProfessionFamily;
  readonly primaryCreationCampaigns: readonly ProfessionCampaign[];
  readonly primaryAttributeId: AttributeId;
  readonly primaryAttributeTemplateId: TemplateAttributeId;
  readonly iconId: string | null;
  readonly provenance: CatalogFieldProvenance;
}

export interface CatalogAttributeRecord {
  readonly id: AttributeId;
  readonly templateId: TemplateAttributeId;
  readonly name: string;
  readonly professionId: ProfessionId;
  readonly professionTemplateId: TemplateProfessionId;
  readonly isPrimary: boolean;
  readonly isPrimaryOnly: boolean;
  readonly primaryEffectSummary: PrimaryAttributeEffectSummary | null;
  readonly provenance: CatalogFieldProvenance;
}

export interface AttributeRankCost {
  readonly purchasedRank: number;
  readonly marginalCost: number;
  readonly cumulativeCost: number;
}

export interface LevelAttributePointTotal {
  readonly level: number;
  readonly earnedAtLevel: number;
  readonly cumulativeTotal: number;
}

export interface AttributeQuestReward {
  readonly id: string;
  readonly name: string;
  readonly campaign: AttributeQuestCampaign;
  readonly rewardPoints: number;
  readonly nativeCharacterOnly: boolean;
  readonly rewardGroupId: string;
  readonly provenance: CatalogFieldProvenance;
}

export interface AttributeQuestRewardGroup {
  readonly id: string;
  readonly campaign: AttributeQuestCampaign;
  readonly questIds: readonly string[];
  readonly maximumApplicableReward: number;
  readonly mutuallyExclusiveWithGroupIds: readonly string[];
  readonly provenance: CatalogFieldProvenance;
}

export interface DefaultPveAttributeBudget {
  readonly level: 20;
  readonly baseAttributePoints: 170;
  readonly maximumQuestBonusPoints: 30;
  readonly totalWithoutQuestBonus: 170;
  readonly totalWithMaximumQuestBonus: 200;
  readonly policy: "level-20-pve-native-character-maximum-applicable-quest-rewards";
  readonly deferredContexts: readonly string[];
  readonly provenance: CatalogFieldProvenance;
}

export interface AttributePointRules {
  readonly purchasedRankCosts: readonly AttributeRankCost[];
  readonly levelPointTotals: readonly LevelAttributePointTotal[];
  readonly questRewards: readonly AttributeQuestReward[];
  readonly questRewardGroups: readonly AttributeQuestRewardGroup[];
  readonly maximumApplicableQuestBonus: {
    readonly points: number;
    readonly policy: "one-native-campaign";
    readonly provenance: CatalogFieldProvenance;
  };
  readonly defaultPveLevel20: DefaultPveAttributeBudget;
}

export interface ProfessionAttributeCatalog {
  readonly schemaVersion: SchemaVersion;
  readonly catalogVersion: CatalogVersionId | string;
  readonly sectionDigests: readonly CatalogSectionDigest[];
  readonly generatedAt: string;
  readonly generator: string;
  readonly profile: ProfessionAttributeProfile;
  readonly sources: readonly SourceReference[];
  readonly snapshotManifestPaths: readonly string[];
  readonly templateCrosswalk: TemplateCrosswalk;
  readonly professions: readonly CatalogProfessionRecord[];
  readonly attributes: readonly CatalogAttributeRecord[];
  readonly attributePointRules: AttributePointRules;
  readonly remoteMedia: readonly RemoteMediaMetadata[];
  readonly manualReviews: readonly ManualReview[];
  readonly generatedArtifactManifest: GeneratedArtifactManifest | null;
}

export interface SkillCatalogProfile {
  readonly id: "epic-04-skills";
  readonly sourceTarget: "BACKLOG";
  readonly sourceEpic: "EPIC-04";
  readonly sourceCaps: {
    readonly seedPageLimit: number;
    readonly detailPageLimit: number;
    readonly mediaTitleLimit: number;
    readonly requestLimit: number;
    readonly retryLimit: number;
    readonly continuationLimit: number;
    readonly responseByteCap: number;
    readonly parserByteCap: number;
    readonly aggregateByteCap: number;
    readonly catalogByteCap: number;
    readonly qaByteCap: number;
  };
}

export type SkillCampaign =
  | "core"
  | "prophecies"
  | "factions"
  | "nightfall"
  | "eye-of-the-north"
  | "bonus-mission-pack"
  | "unknown";

export type SkillMode = "pve" | "pvp";
export type SkillModeAvailability = "both" | "pve-only" | "pvp-only" | "unknown";
export type SkillDescriptionState =
  "reviewed-text" | "structured-only" | "excluded" | "unsupported";
export type SkillValueStateKind =
  "absent" | "not-applicable" | "zero" | "number" | "percentage" | "special" | "malformed";
export type SkillProgressionDependencyKind =
  "attribute" | "title-rank" | "mode" | "constant" | "special-timing";
export type SkillSourceSetDispositionKind =
  "catalog-record" | "same-page-variant" | "unsupported" | "excluded" | "blocked";

export interface SkillValueState {
  readonly state: SkillValueStateKind;
  readonly value: number | null;
  readonly unit: string | null;
  readonly text: string | null;
  readonly source: string | null;
}

export interface SkillCostProfile {
  readonly energy: SkillValueState;
  readonly adrenaline: SkillValueState;
  readonly sacrifice: SkillValueState;
  readonly upkeep: SkillValueState;
  readonly overcast: SkillValueState;
}

export interface SkillTimingProfile {
  readonly activation: SkillValueState;
  readonly recharge: SkillValueState;
  readonly moraleBoostRecharge: SkillValueState;
}

export interface SkillClassification {
  readonly elite: boolean;
  readonly common: boolean;
  readonly title: boolean;
  readonly special: boolean;
  readonly noAttribute: boolean;
  readonly pveOnly: boolean;
  readonly pvpOnly: boolean;
  readonly sharedPage: boolean;
  readonly split: boolean;
  readonly unsupported: boolean;
  readonly nonPlayer: boolean;
  readonly modeAvailability: SkillModeAvailability;
}

export interface SkillDescriptionLiteralToken {
  readonly kind: "literal";
  readonly value: string;
}

export interface SkillDescriptionWhitespaceToken {
  readonly kind: "whitespace";
}

export interface SkillDescriptionLineBreakToken {
  readonly kind: "line-break";
}

export interface SkillDescriptionProgressionToken {
  readonly kind: "progression-reference";
  readonly seriesId: string;
  readonly valueSlot: number;
}

export interface SkillDescriptionReviewedMarkerToken {
  readonly kind: "reviewed-factual-marker";
  readonly value: string;
}

export type SkillDescriptionToken =
  | SkillDescriptionLiteralToken
  | SkillDescriptionWhitespaceToken
  | SkillDescriptionLineBreakToken
  | SkillDescriptionProgressionToken
  | SkillDescriptionReviewedMarkerToken;

export interface SkillDescriptionProjection {
  readonly state: SkillDescriptionState;
  readonly tokens: readonly SkillDescriptionToken[];
  readonly searchText: string;
  readonly sourceTextDigest: string | null;
  readonly reviewId: string | null;
  readonly limitations: readonly string[];
}

export interface SkillDependencyRef {
  readonly kind: SkillProgressionDependencyKind;
  readonly attributeId: AttributeId | null;
  readonly titleKey: string | null;
  readonly mode: SkillMode | null;
  readonly rankDomain: {
    readonly min: number;
    readonly max: number;
  } | null;
}

export interface SkillProgressionValueSlot {
  readonly index: number;
  readonly label: string;
  readonly unit: string | null;
}

export interface SkillProgressionValueRow {
  readonly rank: number;
  readonly values: readonly number[];
}

export interface SkillProgressionSeries {
  readonly id: string;
  readonly skillId: SkillId;
  readonly dependency: SkillDependencyRef;
  readonly valueSlots: readonly SkillProgressionValueSlot[];
  readonly values: readonly SkillProgressionValueRow[];
  readonly sourceForm: string;
  readonly provenance: CatalogFieldProvenance;
}

export interface SkillModeVariantGroup {
  readonly id: string;
  readonly members: readonly {
    readonly mode: SkillMode;
    readonly skillId: SkillId;
  }[];
  readonly ambiguity: "none" | "unknown-mode-differs" | "incomplete-counterpart";
  readonly provenance: CatalogFieldProvenance;
}

export interface SkillPageIdentity {
  readonly requestedTitle: string;
  readonly normalizedTitle: string;
  readonly canonicalTitle: string;
  readonly pageId: number | string | null;
  readonly revisionId: number | string | null;
  readonly sourceRevisionTimestamp: string | null;
  readonly redirectedFrom: string | null;
}

export interface SkillSourceSetDisposition {
  readonly id: string;
  readonly skillId: SkillId;
  readonly templateId: TemplateSkillId;
  readonly requestedTitle: string;
  readonly kind: SkillSourceSetDispositionKind;
  readonly reason: string;
  readonly reviewId: string | null;
  readonly provenance: CatalogFieldProvenance;
}

export interface SkillSourceSetSummary {
  readonly indexTitle: "Guild Wars Wiki:Game integration/Skills";
  readonly rangedPageTitles: readonly string[];
  readonly sourceSetDigest: string;
  readonly sourcePlanDigest: string;
  readonly acceptedSeedCount: number;
  readonly catalogRecordCount: number;
  readonly dispositionCount: number;
  readonly minimumAcceptedId: TemplateSkillId | null;
  readonly maximumAcceptedId: TemplateSkillId | null;
  readonly numericGapCount: number;
  readonly planningAmendment: string;
}

export interface SkillCatalogDependencySummary {
  readonly id: "epic-03-professions-attributes";
  readonly catalogVersion: string;
  readonly artifactDigest: string;
  readonly manifestDigest: string;
  readonly qaGate: "pass";
  readonly sectionDigests: readonly CatalogSectionDigest[];
}

export interface CatalogSkillRecord {
  readonly id: SkillId;
  readonly templateId: TemplateSkillId;
  readonly name: string;
  readonly normalizedName: string;
  readonly wikiUrl: string;
  readonly pageIdentity: SkillPageIdentity;
  readonly campaign: SkillCampaign;
  readonly professionId: ProfessionId | null;
  readonly attributeId: AttributeId | null;
  readonly type: string;
  readonly classification: SkillClassification;
  readonly costs: SkillCostProfile;
  readonly timings: SkillTimingProfile;
  readonly description: SkillDescriptionProjection;
  readonly progressionSeriesIds: readonly string[];
  readonly splitGroupId: string | null;
  readonly iconId: string | null;
  readonly provenance: CatalogFieldProvenance;
}

export interface SkillCatalog {
  readonly schemaVersion: SchemaVersion;
  readonly catalogVersion: CatalogVersionId | string;
  readonly sectionDigests: readonly CatalogSectionDigest[];
  readonly generatedAt: string;
  readonly generator: string;
  readonly profile: SkillCatalogProfile;
  readonly dependencyDigests: readonly SkillCatalogDependencySummary[];
  readonly sourceSet: SkillSourceSetSummary;
  readonly dispositions: readonly SkillSourceSetDisposition[];
  readonly skills: readonly CatalogSkillRecord[];
  readonly progressionSeries: readonly SkillProgressionSeries[];
  readonly splitGroups: readonly SkillModeVariantGroup[];
  readonly remoteMedia: readonly RemoteMediaMetadata[];
}

export interface SkillProgression {
  readonly attributeId: AttributeId | null;
  readonly breakpoints: readonly SkillProgressionBreakpoint[];
}

export interface SkillProgressionBreakpoint {
  readonly rank: number;
  readonly values: readonly number[];
}

export interface Skill extends CatalogRecord<SkillId> {
  readonly professionId: ProfessionId | null;
  readonly attributeId: AttributeId | null;
  readonly progression: SkillProgression | null;
}

export interface Rune extends CatalogRecord<RuneId> {
  readonly professionId: ProfessionId | null;
  readonly attributeId: AttributeId | null;
}

export interface Insignia extends CatalogRecord<InsigniaId> {
  readonly professionId: ProfessionId | null;
}
