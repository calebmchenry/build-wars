import type {
  AttributeId,
  CatalogVersionId,
  InsigniaId,
  ProfessionId,
  RuneId,
  SchemaVersion,
  SkillId,
  TemplateAttributeId,
  TemplateProfessionId
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
