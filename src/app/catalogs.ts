import { createTitleRankCatalog, isSkillTypeId, skillTypeIdFromLabel } from "../domain";
import type {
  AttributeId,
  CatalogAttributeRecord,
  CatalogInsigniaRecord,
  CatalogProfessionRecord,
  CatalogRuneRecord,
  CatalogSkillRecord,
  CatalogWeaponBaseRecord,
  CatalogWeaponModRecord,
  EquipmentValidationCatalogs,
  ProfessionAttributeCatalog,
  ProfessionAttributeValidationCatalog,
  ProfessionId,
  SkillCatalog,
  SkillId,
  SkillValidationCatalog,
  SourceReference,
  TemplateAttributeId,
  TemplateProfessionId,
  TemplateSkillId,
  TitleRankCatalog
} from "../domain";
import insigniaCatalogJson from "../../data/generated/epic-11/insignias.catalog.json";
import professionAttributeCatalogJson from "../../data/generated/epic-03/professions-attributes.catalog.json";
import runeCatalogJson from "../../data/generated/epic-10/runes.catalog.json";
import skillCatalogJson from "../../data/generated/epic-04/skills.catalog.json";
import weaponModCatalogJson from "../../data/generated/epic-12/weapon-mods.catalog.json";
import weaponCatalogJson from "../../data/generated/epic-12/weapons.catalog.json";
import { localProfessionIconAsset, localSkillIconAsset, type LocalIconAsset } from "./icon-assets";

export const APPROVED_RUNTIME_CATALOG_IMPORTS = [
  "../../data/generated/epic-03/professions-attributes.catalog.json",
  "../../data/generated/epic-04/skills.catalog.json",
  "../../data/generated/epic-10/runes.catalog.json",
  "../../data/generated/epic-11/insignias.catalog.json",
  "../../data/generated/epic-12/weapons.catalog.json",
  "../../data/generated/epic-12/weapon-mods.catalog.json"
] as const;

export type CatalogSurface =
  "equipment" | "profession-selector" | "skill-browser" | "skill-bar" | "tooltip";

export interface PlaceholderIconDescriptor {
  readonly surface: CatalogSurface;
  readonly label: string;
  readonly initials: string;
  readonly mediaId: string | null;
  readonly asset: LocalIconAsset | null;
}

export interface CatalogSourceLink {
  readonly id: string;
  readonly label: string;
  readonly url: string | null;
}

export interface CatalogAttributionView {
  readonly heading: string;
  readonly notice: string;
  readonly generatedAt: string;
  readonly sourceLinks: readonly CatalogSourceLink[];
}

export interface CatalogVersionView {
  readonly professionAttributes: string;
  readonly skills: string;
  readonly runes: string | null;
  readonly insignias: string | null;
  readonly weapons: string | null;
  readonly weaponModifiers: string | null;
  readonly weaponCatalogSetVersion: string | null;
  readonly weaponCatalogSetDigest: string | null;
}

export type EquipmentCatalogFamily = "runes" | "insignias" | "weapons" | "weaponModifiers";
export type EquipmentCatalogReadinessStatus = "ready" | "error";

export interface EquipmentCatalogReadiness {
  readonly family: EquipmentCatalogFamily;
  readonly label: string;
  readonly status: EquipmentCatalogReadinessStatus;
  readonly catalogVersion: string | null;
  readonly catalogSetVersion: string | null;
  readonly catalogSetDigest: string | null;
  readonly generatedAt: string | null;
  readonly recordCount: number;
  readonly attribution: string;
  readonly issues: readonly string[];
}

export type EquipmentCatalogReadinessMap = Readonly<
  Record<EquipmentCatalogFamily, EquipmentCatalogReadiness>
>;

export interface EquipmentCatalogViews {
  readonly runes: readonly CatalogRuneRecord[];
  readonly insignias: readonly CatalogInsigniaRecord[];
  readonly weapons: readonly CatalogWeaponBaseRecord[];
  readonly weaponModifiers: readonly CatalogWeaponModRecord[];
  readonly validation: EquipmentValidationCatalogs;
  readonly readiness: EquipmentCatalogReadinessMap;
}

export interface AppCatalogViews {
  readonly professionAttributeCatalog: ProfessionAttributeCatalog;
  readonly skillCatalog: SkillCatalog;
  readonly professions: readonly CatalogProfessionRecord[];
  readonly attributes: readonly CatalogAttributeRecord[];
  readonly skills: readonly CatalogSkillRecord[];
  readonly titleRanks: TitleRankCatalog;
  readonly validation: {
    readonly professionAttributes: ProfessionAttributeValidationCatalog;
    readonly skills: SkillValidationCatalog;
  };
  readonly versions: CatalogVersionView;
  readonly attribution: CatalogAttributionView;
  readonly equipment: EquipmentCatalogViews;
  readonly placeholders: {
    readonly profession: (profession: CatalogProfessionRecord | null) => PlaceholderIconDescriptor;
    readonly skill: (
      skill: CatalogSkillRecord | null,
      surface: Exclude<CatalogSurface, "profession-selector">
    ) => PlaceholderIconDescriptor;
  };
  readonly crosswalk: {
    readonly professionCatalogIdFromTemplateId: (
      templateId: TemplateProfessionId
    ) => ProfessionId | null;
    readonly professionTemplateIdFromCatalogId: (
      catalogId: ProfessionId
    ) => TemplateProfessionId | null;
    readonly attributeCatalogIdFromTemplateId: (
      templateId: TemplateAttributeId
    ) => AttributeId | null;
    readonly attributeTemplateIdFromCatalogId: (
      catalogId: AttributeId
    ) => TemplateAttributeId | null;
    readonly skillCatalogIdFromTemplateId: (templateId: TemplateSkillId) => SkillId | null;
    readonly skillTemplateIdFromCatalogId: (catalogId: SkillId) => TemplateSkillId | null;
  };
}

export type AppCatalogLoadState =
  | {
      readonly status: "ready";
      readonly catalogs: AppCatalogViews;
    }
  | {
      readonly status: "error";
      readonly error: AppCatalogError;
    };

export class AppCatalogError extends Error {
  public readonly issues: readonly string[];

  public constructor(issues: readonly string[]) {
    super(`Build Wars catalog adaptation failed: ${issues.join("; ")}`);
    this.name = "AppCatalogError";
    this.issues = [...issues];
  }
}

export const promotedAppCatalogs = loadAppCatalogs();

export function loadAppCatalogs(input?: {
  readonly professionAttributes?: unknown;
  readonly skills?: unknown;
  readonly runes?: unknown;
  readonly insignias?: unknown;
  readonly weapons?: unknown;
  readonly weaponModifiers?: unknown;
}): AppCatalogLoadState {
  const professionAttributes =
    input?.professionAttributes ?? (professionAttributeCatalogJson as unknown);
  const skills = input?.skills ?? (skillCatalogJson as unknown);
  const runes = input?.runes ?? (runeCatalogJson as unknown);
  const insignias = input?.insignias ?? (insigniaCatalogJson as unknown);
  const weapons = input?.weapons ?? (weaponCatalogJson as unknown);
  const weaponModifiers = input?.weaponModifiers ?? (weaponModCatalogJson as unknown);
  const issues = [
    ...validateProfessionAttributeCatalog(professionAttributes),
    ...validateSkillCatalog(skills)
  ];

  if (issues.length > 0) {
    return { status: "error", error: new AppCatalogError(issues) };
  }

  return {
    status: "ready",
    catalogs: createCatalogViews(
      professionAttributes as ProfessionAttributeCatalog,
      skills as SkillCatalog,
      {
        runes,
        insignias,
        weapons,
        weaponModifiers
      }
    )
  };
}

export function requireReadyCatalogs(
  state: AppCatalogLoadState = promotedAppCatalogs
): AppCatalogViews {
  if (state.status === "error") {
    throw state.error;
  }
  return state.catalogs;
}

function createCatalogViews(
  professionAttributeCatalog: ProfessionAttributeCatalog,
  skillCatalog: SkillCatalog,
  equipmentInput: {
    readonly runes: unknown;
    readonly insignias: unknown;
    readonly weapons: unknown;
    readonly weaponModifiers: unknown;
  }
): AppCatalogViews {
  const equipment = createEquipmentCatalogViews(equipmentInput);
  const titleRanks = createTitleRankCatalog(skillCatalog.progressionSeries);
  const versions = {
    professionAttributes: String(professionAttributeCatalog.catalogVersion),
    skills: String(skillCatalog.catalogVersion),
    runes: equipment.readiness.runes.catalogVersion,
    insignias: equipment.readiness.insignias.catalogVersion,
    weapons: equipment.readiness.weapons.catalogVersion,
    weaponModifiers: equipment.readiness.weaponModifiers.catalogVersion,
    weaponCatalogSetVersion: equipment.readiness.weapons.catalogSetVersion,
    weaponCatalogSetDigest: equipment.readiness.weapons.catalogSetDigest
  } satisfies CatalogVersionView;

  return {
    professionAttributeCatalog,
    skillCatalog,
    professions: professionAttributeCatalog.professions,
    attributes: professionAttributeCatalog.attributes,
    skills: skillCatalog.skills,
    titleRanks,
    validation: {
      professionAttributes: {
        catalogVersion: versions.professionAttributes,
        generatedAt: professionAttributeCatalog.generatedAt,
        professions: professionAttributeCatalog.professions,
        attributes: professionAttributeCatalog.attributes,
        attributePointRules: professionAttributeCatalog.attributePointRules
      },
      skills: {
        catalogVersion: versions.skills,
        generatedAt: skillCatalog.generatedAt,
        skills: skillCatalog.skills,
        dispositions: skillCatalog.dispositions,
        progressionSeries: skillCatalog.progressionSeries,
        splitGroups: skillCatalog.splitGroups
      }
    },
    versions,
    attribution: createAttributionView(professionAttributeCatalog, skillCatalog, equipment),
    equipment,
    placeholders: {
      profession: (profession) => {
        const asset = localProfessionIconAsset(profession);
        return {
          surface: "profession-selector",
          label:
            profession === null
              ? "No profession selected"
              : asset === null
                ? `${profession.name} icon placeholder`
                : asset.label,
          initials:
            profession === null ? "--" : initialsFor(profession.name, profession.abbreviation),
          mediaId: profession?.iconId ?? null,
          asset
        };
      },
      skill: (skill, surface) => {
        const asset = localSkillIconAsset(skill);
        return {
          surface,
          label:
            skill === null
              ? "Empty skill slot"
              : asset === null
                ? `${skill.name} icon placeholder`
                : asset.label,
          initials: skill === null ? "--" : initialsFor(skill.name, null),
          mediaId: skill?.iconId ?? null,
          asset
        };
      }
    },
    crosswalk: {
      professionCatalogIdFromTemplateId: (templateId) =>
        professionAttributeCatalog.templateCrosswalk.professionTemplateIds.find(
          (record) => Number(record.templateId) === Number(templateId) && record.status === "known"
        )?.catalogId ?? null,
      professionTemplateIdFromCatalogId: (catalogId) =>
        professionAttributeCatalog.templateCrosswalk.professionTemplateIds.find(
          (record) =>
            record.catalogId !== null &&
            Number(record.catalogId) === Number(catalogId) &&
            record.status === "known"
        )?.templateId ?? null,
      attributeCatalogIdFromTemplateId: (templateId) =>
        professionAttributeCatalog.templateCrosswalk.attributeTemplateIds.find(
          (record) => Number(record.templateId) === Number(templateId) && record.status === "known"
        )?.catalogId ?? null,
      attributeTemplateIdFromCatalogId: (catalogId) =>
        professionAttributeCatalog.templateCrosswalk.attributeTemplateIds.find(
          (record) =>
            record.catalogId !== null &&
            Number(record.catalogId) === Number(catalogId) &&
            record.status === "known"
        )?.templateId ?? null,
      skillCatalogIdFromTemplateId: (templateId) =>
        skillCatalog.skills.find((skill) => Number(skill.templateId) === Number(templateId))?.id ??
        null,
      skillTemplateIdFromCatalogId: (catalogId) =>
        skillCatalog.skills.find((skill) => Number(skill.id) === Number(catalogId))?.templateId ??
        null
    }
  };
}

interface EquipmentCatalogSlice<Item> {
  readonly readiness: EquipmentCatalogReadiness;
  readonly records: readonly Item[];
}

function createEquipmentCatalogViews(input: {
  readonly runes: unknown;
  readonly insignias: unknown;
  readonly weapons: unknown;
  readonly weaponModifiers: unknown;
}): EquipmentCatalogViews {
  const runes = adaptRuneCatalog(input.runes);
  const insignias = adaptInsigniaCatalog(input.insignias);
  const weapons = adaptWeaponCatalog(input.weapons);
  const weaponModifiers = adaptWeaponModCatalog(input.weaponModifiers);

  return {
    runes: runes.records,
    insignias: insignias.records,
    weapons: weapons.records,
    weaponModifiers: weaponModifiers.records,
    validation: {
      ...(runes.readiness.status === "ready"
        ? {
            runes: {
              catalogVersion: runes.readiness.catalogVersion,
              records: runes.records
            }
          }
        : {}),
      ...(insignias.readiness.status === "ready"
        ? {
            insignias: {
              catalogVersion: insignias.readiness.catalogVersion,
              records: insignias.records
            }
          }
        : {}),
      ...(weapons.readiness.status === "ready"
        ? {
            weapons: {
              catalogVersion: weapons.readiness.catalogVersion,
              catalogSetVersion: weapons.readiness.catalogSetVersion,
              catalogSetDigest: weapons.readiness.catalogSetDigest,
              records: weapons.records
            }
          }
        : {}),
      ...(weaponModifiers.readiness.status === "ready"
        ? {
            weaponModifiers: {
              catalogVersion: weaponModifiers.readiness.catalogVersion,
              catalogSetVersion: weaponModifiers.readiness.catalogSetVersion,
              catalogSetDigest: weaponModifiers.readiness.catalogSetDigest,
              records: weaponModifiers.records
            }
          }
        : {})
    },
    readiness: {
      runes: runes.readiness,
      insignias: insignias.readiness,
      weapons: weapons.readiness,
      weaponModifiers: weaponModifiers.readiness
    }
  };
}

function adaptRuneCatalog(value: unknown): EquipmentCatalogSlice<CatalogRuneRecord> {
  const issues = validateEquipmentCatalogBase(value, "epic-10-runes", "rune");
  const record = isRecord(value) ? value : null;
  const records = Array.isArray(record?.runes)
    ? (record.runes as readonly CatalogRuneRecord[])
    : [];
  if (!Array.isArray(record?.runes) || records.length === 0) {
    issues.push("rune records are empty or missing");
  }
  return equipmentSlice("runes", "Runes", record, records, issues);
}

function adaptInsigniaCatalog(value: unknown): EquipmentCatalogSlice<CatalogInsigniaRecord> {
  const issues = validateEquipmentCatalogBase(value, "epic-11-insignias", "insignia");
  const record = isRecord(value) ? value : null;
  const records = Array.isArray(record?.insignias)
    ? (record.insignias as readonly CatalogInsigniaRecord[])
    : [];
  if (!Array.isArray(record?.insignias) || records.length === 0) {
    issues.push("insignia records are empty or missing");
  }
  return equipmentSlice("insignias", "Insignias", record, records, issues);
}

function adaptWeaponCatalog(value: unknown): EquipmentCatalogSlice<CatalogWeaponBaseRecord> {
  const issues = validateEquipmentCatalogBase(value, "epic-12-weapons-and-mods", "weapon");
  const record = isRecord(value) ? value : null;
  const records = Array.isArray(record?.weaponBases)
    ? (record.weaponBases as readonly CatalogWeaponBaseRecord[])
    : [];
  if (!Array.isArray(record?.weaponBases)) {
    issues.push("weapon base records are missing");
  }
  if (typeof record?.catalogSetVersion !== "string" || record.catalogSetVersion.length === 0) {
    issues.push("weapon catalog-set version is missing");
  }
  if (typeof record?.catalogSetDigest !== "string" || record.catalogSetDigest.length === 0) {
    issues.push("weapon catalog-set digest is missing");
  }
  return equipmentSlice("weapons", "Weapons", record, records, issues);
}

function adaptWeaponModCatalog(value: unknown): EquipmentCatalogSlice<CatalogWeaponModRecord> {
  const issues = validateEquipmentCatalogBase(value, "epic-12-weapons-and-mods", "weapon mod");
  const record = isRecord(value) ? value : null;
  const records = Array.isArray(record?.weaponMods)
    ? (record.weaponMods as readonly CatalogWeaponModRecord[])
    : [];
  if (!Array.isArray(record?.weaponMods)) {
    issues.push("weapon modifier records are missing");
  }
  if (typeof record?.catalogSetVersion !== "string" || record.catalogSetVersion.length === 0) {
    issues.push("weapon modifier catalog-set version is missing");
  }
  if (typeof record?.catalogSetDigest !== "string" || record.catalogSetDigest.length === 0) {
    issues.push("weapon modifier catalog-set digest is missing");
  }
  return equipmentSlice("weaponModifiers", "Weapon modifiers", record, records, issues);
}

function validateEquipmentCatalogBase(
  value: unknown,
  expectedProfile: string,
  label: string
): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) {
    return [`${label} catalog is not an object`];
  }
  const profile = isRecord(value.profile) ? value.profile : null;
  if (profile?.id !== expectedProfile) {
    issues.push(`${label} catalog profile id is not ${expectedProfile}`);
  }
  if (!Number.isSafeInteger(value.schemaVersion)) {
    issues.push(`${label} catalog schemaVersion is missing`);
  }
  if (typeof value.catalogVersion !== "string" || value.catalogVersion.length === 0) {
    issues.push(`${label} catalog catalogVersion is missing`);
  }
  if (typeof value.generatedAt !== "string" || value.generatedAt.length === 0) {
    issues.push(`${label} catalog generatedAt is missing`);
  }
  if (!isRecord(value.sourceSet) || typeof value.sourceSet.sourceSetDigest !== "string") {
    issues.push(`${label} source-set attribution is missing`);
  }
  return issues;
}

function equipmentSlice<Item>(
  family: EquipmentCatalogFamily,
  label: string,
  record: Readonly<Record<string, unknown>> | null,
  records: readonly Item[],
  issues: readonly string[]
): EquipmentCatalogSlice<Item> {
  return {
    records: issues.length === 0 ? records : [],
    readiness: {
      family,
      label,
      status: issues.length === 0 ? "ready" : "error",
      catalogVersion:
        typeof record?.catalogVersion === "string" ? String(record.catalogVersion) : null,
      catalogSetVersion:
        typeof record?.catalogSetVersion === "string" ? String(record.catalogSetVersion) : null,
      catalogSetDigest:
        typeof record?.catalogSetDigest === "string" ? String(record.catalogSetDigest) : null,
      generatedAt: typeof record?.generatedAt === "string" ? String(record.generatedAt) : null,
      recordCount: issues.length === 0 ? records.length : 0,
      attribution:
        typeof record?.sourceSet === "object" && record.sourceSet !== null
          ? `${label} source set ${String(
              (record.sourceSet as Readonly<Record<string, unknown>>).sourceSetDigest ?? "unknown"
            )}`
          : `${label} source set unavailable`,
      issues
    }
  };
}

function validateProfessionAttributeCatalog(value: unknown): readonly string[] {
  const issues: string[] = [];
  if (!isRecord(value)) {
    return ["profession/attribute catalog is not an object"];
  }
  const profile = isRecord(value.profile) ? value.profile : null;
  if (profile?.id !== "epic-03-professions-attributes") {
    issues.push("profession/attribute catalog profile id is not epic-03-professions-attributes");
  }
  if (!Number.isSafeInteger(value.schemaVersion)) {
    issues.push("profession/attribute catalog schemaVersion is missing");
  }
  if (typeof value.catalogVersion !== "string" || value.catalogVersion.length === 0) {
    issues.push("profession/attribute catalog catalogVersion is missing");
  }
  if (!Array.isArray(value.professions) || value.professions.length === 0) {
    issues.push("profession list is empty or missing");
  }
  if (!Array.isArray(value.attributes) || value.attributes.length === 0) {
    issues.push("attribute list is empty or missing");
  }
  if (!Array.isArray(value.sources) || value.sources.length === 0) {
    issues.push("profession/attribute source attribution is missing");
  }
  if (
    !isRecord(value.attributePointRules) ||
    !Array.isArray(value.attributePointRules.purchasedRankCosts)
  ) {
    issues.push("attribute point rules are missing");
  }
  return issues;
}

function validateSkillCatalog(value: unknown): readonly string[] {
  const issues: string[] = [];
  if (!isRecord(value)) {
    return ["skill catalog is not an object"];
  }
  const profile = isRecord(value.profile) ? value.profile : null;
  if (profile?.id !== "epic-04-skills") {
    issues.push("skill catalog profile id is not epic-04-skills");
  }
  if (!Number.isSafeInteger(value.schemaVersion)) {
    issues.push("skill catalog schemaVersion is missing");
  }
  if (typeof value.catalogVersion !== "string" || value.catalogVersion.length === 0) {
    issues.push("skill catalog catalogVersion is missing");
  }
  if (!Array.isArray(value.skills)) {
    issues.push("skill list is missing");
  } else {
    for (const skill of value.skills) {
      if (!isRecord(skill)) {
        issues.push("skill list contains a non-object record");
        continue;
      }
      const name = typeof skill.name === "string" ? skill.name : "unknown skill";
      if (typeof skill.typeId !== "string" || !isSkillTypeId(skill.typeId)) {
        issues.push(`${name} skill typeId is missing or unknown`);
        continue;
      }
      if (typeof skill.type === "string") {
        const sourceTypeId = skillTypeIdFromLabel(skill.type);
        const classification = isRecord(skill.classification) ? skill.classification : null;
        if (sourceTypeId !== null && sourceTypeId !== skill.typeId) {
          issues.push(`${name} skill typeId does not match source type`);
        } else if (sourceTypeId === null && classification?.unsupported !== true) {
          issues.push(`${name} skill source type is not recognized`);
        }
      } else {
        issues.push(`${name} skill type is missing`);
      }
    }
  }
  if (!Array.isArray(value.progressionSeries)) {
    issues.push("skill progression series is missing");
  }
  if (!Array.isArray(value.dispositions)) {
    issues.push("skill disposition list is missing");
  }
  if (!isRecord(value.sourceSet) || typeof value.sourceSet.sourceSetDigest !== "string") {
    issues.push("skill source-set attribution is missing");
  }
  return issues;
}

function createAttributionView(
  professionAttributeCatalog: ProfessionAttributeCatalog,
  skillCatalog: SkillCatalog,
  equipment: EquipmentCatalogViews
): CatalogAttributionView {
  return {
    heading: "Catalog attribution",
    notice:
      "Profession, attribute, skill, rune, insignia, weapon, and modifier facts are source-derived factual metadata from Guild Wars Wiki records reviewed for Build Wars. Icon records are metadata-only; this editor uses local placeholders.",
    generatedAt: latestString(
      professionAttributeCatalog.generatedAt,
      skillCatalog.generatedAt,
      ...Object.values(equipment.readiness).flatMap((readiness) =>
        readiness.generatedAt === null ? [] : [readiness.generatedAt]
      )
    ),
    sourceLinks: dedupeSourceLinks([
      ...professionAttributeCatalog.sources.slice(0, 8),
      sourceLinkFromSkillCatalog(skillCatalog),
      ...Object.values(equipment.readiness).map((readiness) =>
        sourceLinkFromEquipmentReadiness(readiness)
      )
    ])
  };
}

function sourceLinkFromSkillCatalog(skillCatalog: SkillCatalog): SourceReference {
  return {
    id: "source:gww:epic-04-skill-index",
    name: "Guild Wars Wiki",
    family: "guild-wars-wiki",
    canonicalUrl: null,
    pageId: null,
    pageTitle: skillCatalog.sourceSet.indexTitle,
    fileId: null,
    fileTitle: null,
    revisionId: null,
    sourceRevisionTimestamp: null,
    retrievedAt: skillCatalog.generatedAt,
    materialClass: "factual-metadata",
    rightsBasis: "contributor-license-declared",
    useDecision: "allowed",
    license: null,
    notes: `Source set ${skillCatalog.sourceSet.sourceSetDigest}`
  };
}

function sourceLinkFromEquipmentReadiness(readiness: EquipmentCatalogReadiness): SourceReference {
  return {
    id: `source:equipment:${readiness.family}`,
    name: "Guild Wars Wiki",
    family: "guild-wars-wiki",
    canonicalUrl: null,
    pageId: null,
    pageTitle: readiness.label,
    fileId: null,
    fileTitle: null,
    revisionId: null,
    sourceRevisionTimestamp: null,
    retrievedAt: readiness.generatedAt,
    materialClass: "factual-metadata",
    rightsBasis: "contributor-license-declared",
    useDecision: "allowed",
    license: null,
    notes: readiness.attribution
  };
}

function dedupeSourceLinks(sources: readonly SourceReference[]): readonly CatalogSourceLink[] {
  const byId = new Map<string, CatalogSourceLink>();
  for (const source of sources) {
    if (!byId.has(source.id)) {
      byId.set(source.id, {
        id: source.id,
        label: source.pageTitle ?? source.name,
        url: source.canonicalUrl
      });
    }
  }
  return [...byId.values()];
}

function latestString(first: string, ...rest: readonly string[]): string {
  return rest.reduce((latest, value) => (value > latest ? value : latest), first);
}

function initialsFor(name: string, abbreviation: string | null): string {
  if (abbreviation !== null && abbreviation.trim().length > 0) {
    return abbreviation.slice(0, 3);
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("en-US") ?? "")
    .join("");
  return initials.length > 0 ? initials : "?";
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
