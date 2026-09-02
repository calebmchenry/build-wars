import type {
  AttributeId,
  CatalogAttributeRecord,
  CatalogProfessionRecord,
  CatalogSkillRecord,
  ProfessionAttributeCatalog,
  ProfessionAttributeValidationCatalog,
  ProfessionId,
  SkillCatalog,
  SkillId,
  SkillValidationCatalog,
  SourceReference,
  TemplateAttributeId,
  TemplateProfessionId,
  TemplateSkillId
} from "../domain";
import professionAttributeCatalogJson from "../../data/generated/epic-03/professions-attributes.catalog.json";
import skillCatalogJson from "../../data/generated/epic-04/skills.catalog.json";

export const APPROVED_RUNTIME_CATALOG_IMPORTS = [
  "../../data/generated/epic-03/professions-attributes.catalog.json",
  "../../data/generated/epic-04/skills.catalog.json"
] as const;

export type CatalogSurface = "profession-selector" | "skill-browser" | "skill-bar" | "tooltip";

export interface PlaceholderIconDescriptor {
  readonly surface: CatalogSurface;
  readonly label: string;
  readonly initials: string;
  readonly mediaId: string | null;
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
}

export interface AppCatalogViews {
  readonly professionAttributeCatalog: ProfessionAttributeCatalog;
  readonly skillCatalog: SkillCatalog;
  readonly professions: readonly CatalogProfessionRecord[];
  readonly attributes: readonly CatalogAttributeRecord[];
  readonly skills: readonly CatalogSkillRecord[];
  readonly validation: {
    readonly professionAttributes: ProfessionAttributeValidationCatalog;
    readonly skills: SkillValidationCatalog;
  };
  readonly versions: CatalogVersionView;
  readonly attribution: CatalogAttributionView;
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
}): AppCatalogLoadState {
  const professionAttributes =
    input?.professionAttributes ?? (professionAttributeCatalogJson as unknown);
  const skills = input?.skills ?? (skillCatalogJson as unknown);
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
      skills as SkillCatalog
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
  skillCatalog: SkillCatalog
): AppCatalogViews {
  const versions = {
    professionAttributes: String(professionAttributeCatalog.catalogVersion),
    skills: String(skillCatalog.catalogVersion)
  } satisfies CatalogVersionView;

  return {
    professionAttributeCatalog,
    skillCatalog,
    professions: professionAttributeCatalog.professions,
    attributes: professionAttributeCatalog.attributes,
    skills: skillCatalog.skills,
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
    attribution: createAttributionView(professionAttributeCatalog, skillCatalog),
    placeholders: {
      profession: (profession) => ({
        surface: "profession-selector",
        label:
          profession === null ? "No profession selected" : `${profession.name} icon placeholder`,
        initials:
          profession === null ? "--" : initialsFor(profession.name, profession.abbreviation),
        mediaId: profession?.iconId ?? null
      }),
      skill: (skill, surface) => ({
        surface,
        label: skill === null ? "Empty skill slot" : `${skill.name} icon placeholder`,
        initials: skill === null ? "--" : initialsFor(skill.name, null),
        mediaId: skill?.iconId ?? null
      })
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
  skillCatalog: SkillCatalog
): CatalogAttributionView {
  return {
    heading: "Catalog attribution",
    notice:
      "Profession, attribute, and skill facts are source-derived factual metadata from Guild Wars Wiki records reviewed for Build Wars. Icon records are metadata-only; this editor uses local placeholders.",
    generatedAt: latestString(professionAttributeCatalog.generatedAt, skillCatalog.generatedAt),
    sourceLinks: dedupeSourceLinks([
      ...professionAttributeCatalog.sources.slice(0, 8),
      sourceLinkFromSkillCatalog(skillCatalog)
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

function latestString(left: string, right: string): string {
  return left > right ? left : right;
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
