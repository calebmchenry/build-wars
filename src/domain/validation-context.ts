import { SKILL_BAR_SLOT_COUNT, type Build, type GameMode } from "./build";
import type {
  AttributePointRules,
  AttributeRankCost,
  CatalogAttributeRecord,
  CatalogInsigniaRecord,
  CatalogProfessionRecord,
  CatalogRuneRecord,
  CatalogSkillRecord,
  CatalogWeaponBaseRecord,
  CatalogWeaponModRecord,
  SkillModeVariantGroup,
  SkillProgressionSeries,
  SkillSourceSetDisposition
} from "./catalog";
import {
  TITLE_RANK_OVERRIDE_LIMIT,
  createTitleRankCatalog,
  normalizeTitleRankKey,
  type TitleRankCatalog,
  type TitleRankOverride
} from "./title-rank";
import {
  MAX_ARMOR_ROWS_TO_VALIDATE,
  MAX_MODIFIERS_PER_HAND_TO_VALIDATE,
  MAX_WEAPON_SET_ROWS_TO_VALIDATE
} from "./equipment";
import type { EquipmentRuneCatalogView } from "./equipment-attribute-rank";
import type { EquipmentWeaponCatalogView, EquipmentWeaponModifierCatalogView } from "./weapon-set";
import type { AttributeId, ProfessionId, SkillId } from "./ids";
import {
  RULE_ENGINE_VERSION,
  createValidationIssue,
  relatedEntity,
  type ValidationCatalogVersions,
  type ValidationIssue,
  type ValidationIssueCode,
  type ValidationLocation,
  type ValidationTruncation
} from "./validation";

export interface ProfessionAttributeValidationCatalog {
  readonly catalogVersion: string | null;
  readonly generatedAt?: string;
  readonly professions: readonly CatalogProfessionRecord[];
  readonly attributes: readonly CatalogAttributeRecord[];
  readonly attributePointRules: AttributePointRules;
}

export interface SkillValidationCatalog {
  readonly catalogVersion: string | null;
  readonly generatedAt?: string;
  readonly skills: readonly CatalogSkillRecord[];
  readonly dispositions: readonly SkillSourceSetDisposition[];
  readonly progressionSeries: readonly SkillProgressionSeries[];
  readonly splitGroups: readonly SkillModeVariantGroup[];
}

export interface EquipmentInsigniaCatalogView {
  readonly catalogVersion: string | null;
  readonly records: readonly CatalogInsigniaRecord[];
}

export interface EquipmentValidationCatalogs {
  readonly runes?: EquipmentRuneCatalogView;
  readonly insignias?: EquipmentInsigniaCatalogView;
  readonly weapons?: EquipmentWeaponCatalogView;
  readonly weaponModifiers?: EquipmentWeaponModifierCatalogView;
}

export type BuildValidationProfile = "editing" | "complete";

export type AttributeBudgetPolicy =
  | {
      readonly kind: "auto";
    }
  | {
      readonly kind: "none";
    }
  | {
      readonly kind: "points";
      readonly points: number;
    }
  | {
      readonly kind: "level";
      readonly level: number;
      readonly questBonus: "none" | "maximum-applicable";
    }
  | {
      readonly kind: "unresolved";
      readonly reason: string;
    };

export interface BuildValidationOptions {
  readonly profile?: BuildValidationProfile;
  readonly attributeBudget?: AttributeBudgetPolicy;
  readonly maxAttributeRows?: number;
  readonly maxIssues?: number;
}

export interface BuildValidationInput {
  readonly build: Build;
  readonly professionAttributes: ProfessionAttributeValidationCatalog;
  readonly skills: SkillValidationCatalog;
  readonly equipmentCatalogs?: EquipmentValidationCatalogs;
  readonly options?: BuildValidationOptions;
}

export type CatalogLookup<Record> =
  | {
      readonly kind: "missing";
      readonly id: number | null;
    }
  | {
      readonly kind: "ambiguous";
      readonly id: number;
    }
  | {
      readonly kind: "resolved";
      readonly id: number;
      readonly record: Record;
    };

export type SkillSlotLookup =
  | CatalogLookup<CatalogSkillRecord>
  | {
      readonly kind: "empty";
      readonly id: null;
    }
  | {
      readonly kind: "dispositioned";
      readonly id: number;
      readonly disposition: SkillSourceSetDisposition;
    };

export interface EquipmentCatalogIndex<Record> {
  readonly recordsById: ReadonlyMap<number, Record>;
  readonly ambiguousIds: ReadonlySet<number>;
}

export interface EquipmentCatalogIndexes {
  readonly runes: EquipmentCatalogIndex<CatalogRuneRecord> | null;
  readonly insignias: EquipmentCatalogIndex<CatalogInsigniaRecord> | null;
  readonly weapons: EquipmentCatalogIndex<CatalogWeaponBaseRecord> | null;
  readonly weaponModifiers: EquipmentCatalogIndex<CatalogWeaponModRecord> | null;
}

export interface ProfessionSelectionContext {
  readonly field: "primary" | "secondary";
  readonly authoredId: ProfessionId | null;
  readonly numericId: number | null;
  readonly lookup: CatalogLookup<CatalogProfessionRecord>;
}

export interface AttributeRowContext {
  readonly index: number;
  readonly original: unknown;
  readonly authoredId: AttributeId | null;
  readonly numericId: number | null;
  readonly rank: number | null;
  readonly rankIsValid: boolean;
  readonly lookup: CatalogLookup<CatalogAttributeRecord>;
  readonly rankCost: AttributeRankCost | null;
}

export interface SkillSlotContext {
  readonly index: number;
  readonly originalSkillId: unknown;
  readonly authoredId: SkillId | null;
  readonly numericId: number | null;
  readonly lookup: SkillSlotLookup;
}

export type AttributeBudgetResolution =
  | {
      readonly kind: "resolved";
      readonly policy: "auto-pve-level-20" | "explicit-level" | "explicit-points";
      readonly points: number;
    }
  | {
      readonly kind: "none";
    }
  | {
      readonly kind: "unresolved";
      readonly reason: string;
    };

export interface BuildValidationContext {
  readonly build: Build;
  readonly mode: GameMode;
  readonly profile: BuildValidationProfile;
  readonly options: Required<Pick<BuildValidationOptions, "maxAttributeRows" | "maxIssues">> & {
    readonly attributeBudget: AttributeBudgetPolicy;
  };
  readonly professionAttributes: ProfessionAttributeValidationCatalog;
  readonly skills: SkillValidationCatalog;
  readonly equipmentCatalogs: EquipmentValidationCatalogs;
  readonly equipmentIndexes: EquipmentCatalogIndexes;
  readonly professionsById: ReadonlyMap<number, CatalogProfessionRecord>;
  readonly attributesById: ReadonlyMap<number, CatalogAttributeRecord>;
  readonly skillsById: ReadonlyMap<number, CatalogSkillRecord>;
  readonly splitGroupsById: ReadonlyMap<string, SkillModeVariantGroup>;
  readonly progressionSeriesById: ReadonlyMap<string, SkillProgressionSeries>;
  readonly titleRanks: {
    readonly catalog: TitleRankCatalog;
    readonly overrides: readonly TitleRankOverride[];
  };
  readonly ambiguousProfessionIds: ReadonlySet<number>;
  readonly ambiguousAttributeIds: ReadonlySet<number>;
  readonly ambiguousSkillIds: ReadonlySet<number>;
  readonly ambiguousSplitGroupIds: ReadonlySet<string>;
  readonly primaryProfession: ProfessionSelectionContext;
  readonly secondaryProfession: ProfessionSelectionContext;
  readonly attributeRows: readonly AttributeRowContext[];
  readonly skillSlots: readonly SkillSlotContext[];
  readonly rawSkillBarLength: number | null;
  readonly budget: AttributeBudgetResolution;
  readonly catalogVersions: ValidationCatalogVersions;
  readonly issues: readonly ValidationIssue[];
  readonly truncation: ValidationTruncation | null;
}

const DEFAULT_MAX_ATTRIBUTE_ROWS = 64;
const DEFAULT_MAX_ISSUES = 200;

export function createBuildValidationContext(input: BuildValidationInput): BuildValidationContext {
  const issues: ValidationIssue[] = [];
  const options = normalizeOptions(input.options, issues);
  const mode = normalizeMode(input.build.mode, issues);
  const professionIndex = indexNumericRecords(
    input.professionAttributes.professions,
    (record) => record.id,
    "catalog.profession-duplicate-id",
    ["professionAttributes", "professions"],
    "profession-attributes",
    "Duplicate profession catalog ID."
  );
  const attributeIndex = indexNumericRecords(
    input.professionAttributes.attributes,
    (record) => record.id,
    "catalog.attribute-duplicate-id",
    ["professionAttributes", "attributes"],
    "profession-attributes",
    "Duplicate attribute catalog ID."
  );
  const skillIndex = indexNumericRecords(
    input.skills.skills,
    (record) => record.id,
    "catalog.skill-duplicate-id",
    ["skills", "skills"],
    "skills",
    "Duplicate skill catalog ID."
  );
  const splitGroupIndex = indexSplitGroups(input.skills.splitGroups);
  const equipmentIndexes = indexEquipmentCatalogs(input.equipmentCatalogs, issues);
  const progressionSeriesById = indexByStringId(
    input.skills.progressionSeries,
    (record) => record.id
  );
  const titleRankCatalog = createTitleRankCatalog(input.skills.progressionSeries);
  const rankCostsByRank = indexRankCosts(input.professionAttributes.attributePointRules, issues);
  issues.push(
    ...professionIndex.issues,
    ...attributeIndex.issues,
    ...skillIndex.issues,
    ...splitGroupIndex.issues
  );

  const primaryProfession = createProfessionSelection(
    "primary",
    readProfessionId(input.build, "primaryProfessionId"),
    professionIndex
  );
  const secondaryProfession = createProfessionSelection(
    "secondary",
    readProfessionId(input.build, "secondaryProfessionId"),
    professionIndex
  );

  const attributeRows = createAttributeRows(
    input.build,
    attributeIndex,
    rankCostsByRank,
    options.maxAttributeRows,
    issues
  );
  const skillBar = createSkillSlots(input.build, skillIndex, input.skills.dispositions, issues);
  const budget = resolveBudget(
    mode,
    input.professionAttributes.attributePointRules,
    options.attributeBudget
  );
  const titleRankOverrides = createTitleRankOverrides(input.build, titleRankCatalog, issues);

  return {
    build: input.build,
    mode,
    profile: options.profile,
    options: {
      attributeBudget: options.attributeBudget,
      maxAttributeRows: options.maxAttributeRows,
      maxIssues: options.maxIssues
    },
    professionAttributes: input.professionAttributes,
    skills: input.skills,
    equipmentCatalogs: input.equipmentCatalogs ?? {},
    equipmentIndexes,
    professionsById: professionIndex.recordsById,
    attributesById: attributeIndex.recordsById,
    skillsById: skillIndex.recordsById,
    splitGroupsById: splitGroupIndex.recordsById,
    progressionSeriesById,
    titleRanks: {
      catalog: titleRankCatalog,
      overrides: titleRankOverrides
    },
    ambiguousProfessionIds: professionIndex.ambiguousIds,
    ambiguousAttributeIds: attributeIndex.ambiguousIds,
    ambiguousSkillIds: skillIndex.ambiguousIds,
    ambiguousSplitGroupIds: splitGroupIndex.ambiguousIds,
    primaryProfession,
    secondaryProfession,
    attributeRows,
    skillSlots: skillBar.slots,
    rawSkillBarLength: skillBar.rawLength,
    budget,
    catalogVersions: {
      buildCatalogVersion: stringifyVersion(input.build.catalogVersion),
      professionAttributeCatalogVersion: stringifyVersion(
        input.professionAttributes.catalogVersion
      ),
      skillCatalogVersion: stringifyVersion(input.skills.catalogVersion),
      ...equipmentCatalogVersions(input.equipmentCatalogs),
      ruleEngineVersion: RULE_ENGINE_VERSION
    },
    issues,
    truncation:
      skillBar.truncation ??
      attributeRowsTruncation(input.build, options.maxAttributeRows) ??
      titleRankOverridesTruncation(input.build) ??
      equipmentRowsTruncation(input.build)
  };
}

export function isFiniteSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export function readNumericId(value: unknown): number | null {
  return isFiniteSafeInteger(value) && value >= 0 ? value : null;
}

interface NumericIndex<Record> {
  readonly recordsById: ReadonlyMap<number, Record>;
  readonly ambiguousIds: ReadonlySet<number>;
  readonly issues: readonly ValidationIssue[];
}

interface SplitGroupIndex {
  readonly recordsById: ReadonlyMap<string, SkillModeVariantGroup>;
  readonly ambiguousIds: ReadonlySet<string>;
  readonly issues: readonly ValidationIssue[];
}

interface NormalizedOptions {
  readonly profile: BuildValidationProfile;
  readonly attributeBudget: AttributeBudgetPolicy;
  readonly maxAttributeRows: number;
  readonly maxIssues: number;
}

function normalizeOptions(
  options: BuildValidationOptions | undefined,
  issues: ValidationIssue[]
): NormalizedOptions {
  const defaultOptions: NormalizedOptions = {
    profile: "editing",
    attributeBudget: { kind: "auto" },
    maxAttributeRows: DEFAULT_MAX_ATTRIBUTE_ROWS,
    maxIssues: DEFAULT_MAX_ISSUES
  };
  if (options === undefined) {
    return defaultOptions;
  }
  if (!isRecord(options)) {
    issues.push(unsupportedOptionIssue([], "Validation options must be an object."));
    return defaultOptions;
  }

  const profile =
    options.profile === "complete" || options.profile === "editing"
      ? options.profile
      : defaultOptions.profile;
  if (options.profile !== undefined && options.profile !== profile) {
    issues.push(unsupportedOptionIssue(["profile"], "Unsupported validation profile."));
  }

  const maxAttributeRows = positiveSafeLimit(
    options.maxAttributeRows,
    defaultOptions.maxAttributeRows,
    ["maxAttributeRows"],
    issues
  );
  const maxIssues = positiveSafeLimit(
    options.maxIssues,
    defaultOptions.maxIssues,
    ["maxIssues"],
    issues
  );
  const attributeBudget = normalizeBudgetPolicy(options.attributeBudget, issues);

  return { profile, attributeBudget, maxAttributeRows, maxIssues };
}

function normalizeBudgetPolicy(policy: unknown, issues: ValidationIssue[]): AttributeBudgetPolicy {
  if (policy === undefined) {
    return { kind: "auto" };
  }
  if (!isRecord(policy) || typeof policy.kind !== "string") {
    issues.push(
      unsupportedOptionIssue(["attributeBudget"], "Attribute budget policy is unsupported.")
    );
    return { kind: "auto" };
  }
  if (policy.kind === "auto" || policy.kind === "none") {
    return { kind: policy.kind };
  }
  if (policy.kind === "points") {
    if (!isFiniteSafeInteger(policy.points) || policy.points < 0) {
      issues.push(
        unsupportedOptionIssue(
          ["attributeBudget", "points"],
          "Attribute budget points must be a non-negative safe integer."
        )
      );
      return { kind: "unresolved", reason: "invalid point-total budget" };
    }
    return { kind: "points", points: policy.points };
  }
  if (policy.kind === "level") {
    if (!isFiniteSafeInteger(policy.level) || policy.level < 1) {
      issues.push(
        unsupportedOptionIssue(
          ["attributeBudget", "level"],
          "Attribute budget level must be a positive safe integer."
        )
      );
      return { kind: "unresolved", reason: "invalid level budget" };
    }
    if (policy.questBonus !== "none" && policy.questBonus !== "maximum-applicable") {
      issues.push(
        unsupportedOptionIssue(
          ["attributeBudget", "questBonus"],
          "Attribute budget quest bonus is unsupported."
        )
      );
      return { kind: "unresolved", reason: "invalid quest bonus budget" };
    }
    return { kind: "level", level: policy.level, questBonus: policy.questBonus };
  }
  if (policy.kind === "unresolved") {
    return { kind: "unresolved", reason: stringValue(policy.reason, "unresolved budget") };
  }
  issues.push(
    unsupportedOptionIssue(
      ["attributeBudget", "kind"],
      "Attribute budget policy kind is unsupported."
    )
  );
  return { kind: "unresolved", reason: "unsupported budget policy" };
}

function positiveSafeLimit(
  value: unknown,
  fallback: number,
  path: readonly string[],
  issues: ValidationIssue[]
): number {
  if (value === undefined) {
    return fallback;
  }
  if (!isFiniteSafeInteger(value) || value < 1) {
    issues.push(unsupportedOptionIssue(path, "Validation limit must be a positive safe integer."));
    return fallback;
  }
  return value;
}

function unsupportedOptionIssue(path: readonly string[], message: string): ValidationIssue {
  return createValidationIssue({
    severity: "warning",
    code: "option.unsupported",
    message,
    path: ["options", ...path],
    location: { kind: "options" },
    relatedEntities: [relatedEntity("option", path.join(".") || "options")],
    sourceRule: "context.options"
  });
}

function normalizeMode(mode: unknown, issues: ValidationIssue[]): GameMode {
  if (mode === "pve" || mode === "pvp" || mode === "unknown") {
    return mode;
  }
  issues.push(
    createValidationIssue({
      severity: "warning",
      code: "build.unsupported-mode",
      message: "Build mode is unsupported; validation will treat it as unknown.",
      path: ["mode"],
      location: null,
      relatedEntities: [],
      sourceRule: "context.options"
    })
  );
  return "unknown";
}

function indexNumericRecords<Record>(
  records: readonly Record[],
  idForRecord: (record: Record) => unknown,
  duplicateCode: ValidationIssueCode,
  path: readonly (string | number)[],
  catalog: Extract<ValidationLocation, { readonly kind: "catalog" }>["catalog"],
  message: string
): NumericIndex<Record> {
  const buckets = new Map<number, Record[]>();
  for (const record of records) {
    const id = readNumericId(idForRecord(record));
    if (id === null) {
      continue;
    }
    const bucket = buckets.get(id);
    if (bucket === undefined) {
      buckets.set(id, [record]);
    } else {
      bucket.push(record);
    }
  }

  const recordsById = new Map<number, Record>();
  const ambiguousIds = new Set<number>();
  const issues: ValidationIssue[] = [];
  for (const [id, bucket] of buckets) {
    if (bucket.length === 1) {
      const record = bucket[0];
      if (record !== undefined) {
        recordsById.set(id, record);
      }
      continue;
    }
    ambiguousIds.add(id);
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: duplicateCode,
        message,
        path,
        location: { kind: "catalog", catalog },
        relatedEntities: [relatedEntity("catalog-key", id)],
        sourceRule: "context.catalog-integrity"
      })
    );
  }

  return { recordsById, ambiguousIds, issues };
}

function indexEquipmentCatalogs(
  catalogs: EquipmentValidationCatalogs | undefined,
  issues: ValidationIssue[]
): EquipmentCatalogIndexes {
  return {
    runes: indexEquipmentCatalog(
      catalogs?.runes,
      (record) => record.id,
      "runes",
      "Duplicate rune catalog ID.",
      issues
    ),
    insignias: indexEquipmentCatalog(
      catalogs?.insignias,
      (record) => record.id,
      "insignias",
      "Duplicate insignia catalog ID.",
      issues
    ),
    weapons: indexEquipmentCatalog(
      catalogs?.weapons,
      (record) => record.id,
      "weapons",
      "Duplicate weapon catalog ID.",
      issues
    ),
    weaponModifiers: indexEquipmentCatalog(
      catalogs?.weaponModifiers,
      (record) => record.id,
      "weapon-modifiers",
      "Duplicate weapon modifier catalog ID.",
      issues
    )
  };
}

function indexEquipmentCatalog<Record>(
  view: { readonly records: readonly Record[] } | undefined,
  idForRecord: (record: Record) => unknown,
  catalog: Extract<ValidationLocation, { readonly kind: "catalog" }>["catalog"],
  message: string,
  issues: ValidationIssue[]
): EquipmentCatalogIndex<Record> | null {
  if (view === undefined) {
    return null;
  }
  const index = indexNumericRecords(
    view.records,
    idForRecord,
    "equipment.catalog-duplicate-id",
    ["equipmentCatalogs", catalog, "records"],
    catalog,
    message
  );
  issues.push(...index.issues);
  return {
    recordsById: index.recordsById,
    ambiguousIds: index.ambiguousIds
  };
}

function indexSplitGroups(groups: readonly SkillModeVariantGroup[]): SplitGroupIndex {
  const buckets = new Map<string, SkillModeVariantGroup[]>();
  for (const group of groups) {
    const bucket = buckets.get(group.id);
    if (bucket === undefined) {
      buckets.set(group.id, [group]);
    } else {
      bucket.push(group);
    }
  }
  const recordsById = new Map<string, SkillModeVariantGroup>();
  const ambiguousIds = new Set<string>();
  const issues: ValidationIssue[] = [];
  for (const [id, bucket] of buckets) {
    if (bucket.length === 1) {
      const group = bucket[0];
      if (group !== undefined) {
        recordsById.set(id, group);
      }
      continue;
    }
    ambiguousIds.add(id);
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "catalog.skill-split-group-duplicate-id",
        message: "Duplicate skill split group ID.",
        path: ["skills", "splitGroups"],
        location: { kind: "catalog", catalog: "skills" },
        relatedEntities: [relatedEntity("split-group", id)],
        sourceRule: "context.catalog-integrity"
      })
    );
  }
  return { recordsById, ambiguousIds, issues };
}

function indexByStringId<Record>(
  records: readonly Record[],
  idForRecord: (record: Record) => string
): ReadonlyMap<string, Record> {
  const byId = new Map<string, Record>();
  for (const record of records) {
    if (!byId.has(idForRecord(record))) {
      byId.set(idForRecord(record), record);
    }
  }
  return byId;
}

function indexRankCosts(
  rules: AttributePointRules,
  issues: ValidationIssue[]
): ReadonlyMap<number, AttributeRankCost> {
  const index = indexNumericRecords(
    rules.purchasedRankCosts,
    (record) => record.purchasedRank,
    "catalog.attribute-rank-cost-gap",
    ["professionAttributes", "attributePointRules", "purchasedRankCosts"],
    "profession-attributes",
    "Duplicate purchased-rank cost entry."
  );
  issues.push(...index.issues);
  return index.recordsById;
}

function createProfessionSelection(
  field: "primary" | "secondary",
  authoredId: ProfessionId | null,
  index: NumericIndex<CatalogProfessionRecord>
): ProfessionSelectionContext {
  const numericId = readNumericId(authoredId);
  return {
    field,
    authoredId,
    numericId,
    lookup: lookupCatalogRecord(numericId, index.recordsById, index.ambiguousIds)
  };
}

function readProfessionId(
  build: Build,
  field: "primaryProfessionId" | "secondaryProfessionId"
): ProfessionId | null {
  const value = (build as unknown as Readonly<Record<string, unknown>>)[field];
  return value === null ? null : (value as ProfessionId);
}

function createAttributeRows(
  build: Build,
  index: NumericIndex<CatalogAttributeRecord>,
  rankCostsByRank: ReadonlyMap<number, AttributeRankCost>,
  maxRows: number,
  issues: ValidationIssue[]
): readonly AttributeRowContext[] {
  const rawAttributes = (build as unknown as Readonly<Record<string, unknown>>).attributes;
  if (!Array.isArray(rawAttributes)) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "attribute.unresolved",
        message: "Build attributes must be an array.",
        path: ["attributes"],
        location: null,
        relatedEntities: [],
        sourceRule: "attribute.resolve"
      })
    );
    return [];
  }

  const rows: AttributeRowContext[] = [];
  for (
    let indexInBuild = 0;
    indexInBuild < Math.min(rawAttributes.length, maxRows);
    indexInBuild += 1
  ) {
    const original = rawAttributes[indexInBuild];
    const row = isRecord(original) ? original : {};
    const numericId = readNumericId(row.attributeId);
    const rank = isFiniteSafeInteger(row.rank) ? row.rank : null;
    const rankIsValid = rank !== null && rank >= 0;
    rows.push({
      index: indexInBuild,
      original,
      authoredId: numericId === null ? null : (numericId as AttributeId),
      numericId,
      rank,
      rankIsValid,
      lookup: lookupCatalogRecord(numericId, index.recordsById, index.ambiguousIds),
      rankCost: rankIsValid ? (rankCostsByRank.get(rank) ?? null) : null
    });
  }
  return rows;
}

function attributeRowsTruncation(build: Build, maxRows: number): ValidationTruncation | null {
  const rawAttributes = (build as unknown as Readonly<Record<string, unknown>>).attributes;
  if (Array.isArray(rawAttributes) && rawAttributes.length > maxRows) {
    return {
      kind: "attribute-row-cap",
      limit: maxRows,
      observed: rawAttributes.length,
      path: ["attributes"]
    };
  }
  return null;
}

function createTitleRankOverrides(
  build: Build,
  catalog: TitleRankCatalog,
  issues: ValidationIssue[]
): readonly TitleRankOverride[] {
  const rawOverrides = (build as unknown as Readonly<Record<string, unknown>>).titleRankOverrides;
  if (rawOverrides === undefined) {
    return [];
  }
  if (!Array.isArray(rawOverrides)) {
    issues.push(titleOverrideIssue("title.override-invalid", ["titleRankOverrides"], null));
    return [];
  }

  const overrides: TitleRankOverride[] = [];
  const seen = new Set<string>();
  for (
    let index = 0;
    index < Math.min(rawOverrides.length, TITLE_RANK_OVERRIDE_LIMIT);
    index += 1
  ) {
    const raw = rawOverrides[index];
    const path = ["titleRankOverrides", index] as const;
    if (!isRecord(raw)) {
      issues.push(titleOverrideIssue("title.override-invalid", path, null));
      continue;
    }
    const key = typeof raw.key === "string" ? normalizeTitleRankKey(raw.key) : null;
    const rank = isFiniteSafeInteger(raw.rank) ? raw.rank : null;
    if (key === null || rank === null) {
      issues.push(titleOverrideIssue("title.override-invalid", path, key));
      continue;
    }
    if (seen.has(key)) {
      issues.push(titleOverrideIssue("title.override-duplicate", path, key));
      continue;
    }
    seen.add(key);
    const definition = catalog.byCanonicalKey.get(key);
    if (definition === undefined) {
      issues.push(titleOverrideIssue("title.override-unknown", path, key));
    } else if (!definition.editableRanks.includes(rank)) {
      issues.push(titleOverrideIssue("title.override-out-of-domain", path, key));
    }
    overrides.push({ key, rank });
  }
  return overrides.sort(
    (left, right) => left.key.localeCompare(right.key, "en-US") || left.rank - right.rank
  );
}

function titleRankOverridesTruncation(build: Build): ValidationTruncation | null {
  const rawOverrides = (build as unknown as Readonly<Record<string, unknown>>).titleRankOverrides;
  if (Array.isArray(rawOverrides) && rawOverrides.length > TITLE_RANK_OVERRIDE_LIMIT) {
    return {
      kind: "title-override-cap",
      limit: TITLE_RANK_OVERRIDE_LIMIT,
      observed: rawOverrides.length,
      path: ["titleRankOverrides"]
    };
  }
  return null;
}

function titleOverrideIssue(
  code:
    | "title.override-duplicate"
    | "title.override-invalid"
    | "title.override-out-of-domain"
    | "title.override-unknown",
  path: readonly (string | number)[],
  key: string | null
): ValidationIssue {
  return createValidationIssue({
    severity: "warning",
    code,
    message: titleOverrideMessage(code),
    path,
    location: { kind: "title-rank", key },
    relatedEntities: key === null ? [] : [relatedEntity("title-rank", key)],
    sourceRule: "title.override"
  });
}

function titleOverrideMessage(
  code:
    | "title.override-duplicate"
    | "title.override-invalid"
    | "title.override-out-of-domain"
    | "title.override-unknown"
): string {
  if (code === "title.override-duplicate") {
    return "Duplicate title rank override keys are ignored after the first entry.";
  }
  if (code === "title.override-out-of-domain") {
    return "Title rank override is outside the current catalog's editable exact rows.";
  }
  if (code === "title.override-unknown") {
    return "Title rank override is not present in the current catalog and is retained for reset.";
  }
  return "Title rank override is malformed and cannot be applied.";
}

function equipmentRowsTruncation(build: Build): ValidationTruncation | null {
  const equipment = (build as unknown as Readonly<Record<string, unknown>>).equipment;
  if (equipment === null || equipment === undefined || !isRecord(equipment)) {
    return null;
  }
  if (Array.isArray(equipment.armor) && equipment.armor.length > MAX_ARMOR_ROWS_TO_VALIDATE) {
    return {
      kind: "armor-row-cap",
      limit: MAX_ARMOR_ROWS_TO_VALIDATE,
      observed: equipment.armor.length,
      path: ["equipment", "armor"]
    };
  }
  if (
    Array.isArray(equipment.weaponSets) &&
    equipment.weaponSets.length > MAX_WEAPON_SET_ROWS_TO_VALIDATE
  ) {
    return {
      kind: "weapon-set-row-cap",
      limit: MAX_WEAPON_SET_ROWS_TO_VALIDATE,
      observed: equipment.weaponSets.length,
      path: ["equipment", "weaponSets"]
    };
  }
  if (!Array.isArray(equipment.weaponSets)) {
    return null;
  }
  for (
    let setIndex = 0;
    setIndex < Math.min(equipment.weaponSets.length, MAX_WEAPON_SET_ROWS_TO_VALIDATE);
    setIndex += 1
  ) {
    const set = equipment.weaponSets[setIndex];
    if (!isRecord(set)) {
      continue;
    }
    for (const hand of ["mainHand", "offHand"] as const) {
      const handSelection = set[hand];
      if (!isRecord(handSelection) || !Array.isArray(handSelection.modifiers)) {
        continue;
      }
      if (handSelection.modifiers.length > MAX_MODIFIERS_PER_HAND_TO_VALIDATE) {
        return {
          kind: "weapon-modifier-cap",
          limit: MAX_MODIFIERS_PER_HAND_TO_VALIDATE,
          observed: handSelection.modifiers.length,
          path: ["equipment", "weaponSets", setIndex, hand, "modifiers"]
        };
      }
    }
  }
  return null;
}

function createSkillSlots(
  build: Build,
  skillIndex: NumericIndex<CatalogSkillRecord>,
  dispositions: readonly SkillSourceSetDisposition[],
  issues: ValidationIssue[]
): {
  readonly slots: readonly SkillSlotContext[];
  readonly rawLength: number | null;
  readonly truncation: ValidationTruncation | null;
} {
  const rawSkillBar = (build as unknown as Readonly<Record<string, unknown>>).skillBar;
  if (!Array.isArray(rawSkillBar)) {
    issues.push(
      createValidationIssue({
        severity: "error",
        code: "skill-bar.malformed",
        message: "Skill bar must be an array with exactly eight slots.",
        path: ["skillBar"],
        location: null,
        relatedEntities: [],
        sourceRule: "context.skill-bar-shape"
      })
    );
    return {
      slots: createEmptySkillSlots(),
      rawLength: null,
      truncation: null
    };
  }

  if (rawSkillBar.length !== SKILL_BAR_SLOT_COUNT) {
    issues.push(
      createValidationIssue({
        severity: "error",
        code: "skill-bar.malformed",
        message: "Skill bar must contain exactly eight slots.",
        path: ["skillBar"],
        location: null,
        relatedEntities: [relatedEntity("skill-slot", rawSkillBar.length, "observed-length")],
        sourceRule: "context.skill-bar-shape"
      })
    );
  }

  const dispositionBySkillId = indexDispositionsBySkillId(dispositions);
  const slots: SkillSlotContext[] = [];
  for (let slot = 0; slot < SKILL_BAR_SLOT_COUNT; slot += 1) {
    const originalSkillId = rawSkillBar[slot] ?? null;
    const numericId = originalSkillId === null ? null : readNumericId(originalSkillId);
    const disposition = numericId === null ? undefined : dispositionBySkillId.get(numericId);
    const lookup =
      originalSkillId === null
        ? ({ kind: "empty", id: null } satisfies SkillSlotLookup)
        : disposition !== undefined
          ? ({ kind: "dispositioned", id: numericId ?? -1, disposition } satisfies SkillSlotLookup)
          : lookupCatalogRecord(numericId, skillIndex.recordsById, skillIndex.ambiguousIds);
    slots.push({
      index: slot,
      originalSkillId,
      authoredId: numericId === null ? null : (numericId as SkillId),
      numericId,
      lookup
    });
  }

  return {
    slots,
    rawLength: rawSkillBar.length,
    truncation:
      rawSkillBar.length > SKILL_BAR_SLOT_COUNT
        ? {
            kind: "skill-slot-cap",
            limit: SKILL_BAR_SLOT_COUNT,
            observed: rawSkillBar.length,
            path: ["skillBar"]
          }
        : null
  };
}

function createEmptySkillSlots(): readonly SkillSlotContext[] {
  const slots: SkillSlotContext[] = [];
  for (let slot = 0; slot < SKILL_BAR_SLOT_COUNT; slot += 1) {
    slots.push({
      index: slot,
      originalSkillId: null,
      authoredId: null,
      numericId: null,
      lookup: { kind: "empty", id: null }
    });
  }
  return slots;
}

function indexDispositionsBySkillId(
  dispositions: readonly SkillSourceSetDisposition[]
): ReadonlyMap<number, SkillSourceSetDisposition> {
  const bySkillId = new Map<number, SkillSourceSetDisposition>();
  for (const disposition of dispositions) {
    const skillId = readNumericId(disposition.skillId);
    if (skillId !== null && !bySkillId.has(skillId)) {
      bySkillId.set(skillId, disposition);
    }
  }
  return bySkillId;
}

function lookupCatalogRecord<Record>(
  id: number | null,
  recordsById: ReadonlyMap<number, Record>,
  ambiguousIds: ReadonlySet<number>
): CatalogLookup<Record> {
  if (id === null) {
    return { kind: "missing", id: null };
  }
  if (ambiguousIds.has(id)) {
    return { kind: "ambiguous", id };
  }
  const record = recordsById.get(id);
  return record === undefined ? { kind: "missing", id } : { kind: "resolved", id, record };
}

function resolveBudget(
  mode: GameMode,
  rules: AttributePointRules,
  policy: AttributeBudgetPolicy
): AttributeBudgetResolution {
  if (policy.kind === "none") {
    return { kind: "none" };
  }
  if (policy.kind === "points") {
    return { kind: "resolved", policy: "explicit-points", points: policy.points };
  }
  if (policy.kind === "unresolved") {
    return { kind: "unresolved", reason: policy.reason };
  }
  if (policy.kind === "level") {
    const levelTotal = rules.levelPointTotals.find((candidate) => candidate.level === policy.level);
    if (levelTotal === undefined) {
      return { kind: "unresolved", reason: `missing level ${policy.level} budget` };
    }
    const bonus =
      policy.questBonus === "maximum-applicable" ? rules.maximumApplicableQuestBonus.points : 0;
    const points = levelTotal.cumulativeTotal + bonus;
    return Number.isSafeInteger(points) && points >= 0
      ? { kind: "resolved", policy: "explicit-level", points }
      : { kind: "unresolved", reason: "invalid level budget total" };
  }
  if (mode !== "pve") {
    return { kind: "unresolved", reason: "auto budget requires a PvE build mode" };
  }
  const points = rules.defaultPveLevel20.totalWithMaximumQuestBonus;
  return Number.isSafeInteger(points) && points >= 0
    ? { kind: "resolved", policy: "auto-pve-level-20", points }
    : { kind: "unresolved", reason: "missing default PvE level-20 budget" };
}

function stringifyVersion(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function equipmentCatalogVersions(
  catalogs: EquipmentValidationCatalogs | undefined
): Partial<ValidationCatalogVersions> {
  if (catalogs === undefined) {
    return {};
  }
  return {
    ...(catalogs.runes === undefined
      ? {}
      : { runeCatalogVersion: stringifyVersion(catalogs.runes.catalogVersion) }),
    ...(catalogs.insignias === undefined
      ? {}
      : { insigniaCatalogVersion: stringifyVersion(catalogs.insignias.catalogVersion) }),
    ...(catalogs.weapons === undefined
      ? {}
      : {
          weaponCatalogVersion: stringifyVersion(catalogs.weapons.catalogVersion),
          weaponCatalogSetVersion: stringifyVersion(catalogs.weapons.catalogSetVersion),
          weaponCatalogSetDigest: stringifyVersion(catalogs.weapons.catalogSetDigest)
        }),
    ...(catalogs.weaponModifiers === undefined
      ? {}
      : {
          weaponModifierCatalogVersion: stringifyVersion(catalogs.weaponModifiers.catalogVersion),
          weaponModifierCatalogSetVersion: stringifyVersion(
            catalogs.weaponModifiers.catalogSetVersion
          ),
          weaponModifierCatalogSetDigest: stringifyVersion(
            catalogs.weaponModifiers.catalogSetDigest
          )
        })
  };
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
