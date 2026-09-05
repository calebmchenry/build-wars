import type { CatalogSkillRecord } from "./catalog";
import type { SkillId } from "./ids";

export const SKILL_METADATA_OVERLAY_SCHEMA_VERSION = 1;
export const SKILL_METADATA_OVERLAY_KIND = "build-wars-skill-metadata-overlay";

export type SkillMetadataAppliesSubject =
  | "condition"
  | "burning"
  | "bleeding"
  | "poison"
  | "disease"
  | "blind"
  | "crippled"
  | "dazed"
  | "deep_wound"
  | "weakness"
  | "cracked_armor";

export type SkillMetadataRemovesSubject = "condition" | "hex" | "enchantment" | "stance";

export type SkillMetadataDealsSubject =
  "damage" | "fire" | "cold" | "lightning" | "earth" | "holy" | "shadow" | "chaos";

export type SkillMetadataToken =
  | `applies:${SkillMetadataAppliesSubject}`
  | `removes:${SkillMetadataRemovesSubject}`
  | `deals:${SkillMetadataDealsSubject}`;

export interface SkillMetadataFilterOption {
  readonly token: SkillMetadataToken;
  readonly label: string;
}

export interface SkillMetadataFilterGroup {
  readonly id: "applies" | "removes" | "deals";
  readonly label: string;
  readonly options: readonly SkillMetadataFilterOption[];
}

export interface AuthoredSkillMetadataRecord {
  readonly skillId: SkillId;
  readonly name: string;
  readonly sourceTextDigest: string | null;
  readonly metadata: readonly SkillMetadataToken[];
  readonly notes?: string | null;
}

export interface AuthoredSkillMetadataOverlay {
  readonly schemaVersion: typeof SKILL_METADATA_OVERLAY_SCHEMA_VERSION;
  readonly kind: typeof SKILL_METADATA_OVERLAY_KIND;
  readonly records: readonly AuthoredSkillMetadataRecord[];
}

export interface SkillMetadataIndexRecord extends AuthoredSkillMetadataRecord {
  readonly expandedMetadata: readonly SkillMetadataToken[];
}

export interface SkillMetadataIndexIssue {
  readonly code:
    | "overlay-not-object"
    | "schema-version-invalid"
    | "kind-invalid"
    | "records-invalid"
    | "record-invalid"
    | "skill-id-invalid"
    | "skill-id-unknown"
    | "skill-id-duplicate"
    | "name-invalid"
    | "metadata-invalid"
    | "metadata-token-invalid"
    | "source-text-digest-invalid";
  readonly path: string;
  readonly message: string;
}

export interface SkillMetadataIndexWarning {
  readonly code: "name-mismatch" | "source-text-digest-mismatch";
  readonly path: string;
  readonly message: string;
}

export interface SkillMetadataIndex {
  readonly recordsBySkillId: ReadonlyMap<number, SkillMetadataIndexRecord>;
  readonly errors: readonly SkillMetadataIndexIssue[];
  readonly warnings: readonly SkillMetadataIndexWarning[];
}

export const SKILL_METADATA_FILTER_GROUPS: readonly SkillMetadataFilterGroup[] = [
  {
    id: "applies",
    label: "Applies Condition",
    options: [
      { token: "applies:condition", label: "Any condition" },
      { token: "applies:burning", label: "Burning" },
      { token: "applies:bleeding", label: "Bleeding" },
      { token: "applies:poison", label: "Poison" },
      { token: "applies:disease", label: "Disease" },
      { token: "applies:blind", label: "Blind" },
      { token: "applies:crippled", label: "Crippled" },
      { token: "applies:dazed", label: "Dazed" },
      { token: "applies:deep_wound", label: "Deep Wound" },
      { token: "applies:weakness", label: "Weakness" },
      { token: "applies:cracked_armor", label: "Cracked Armor" }
    ]
  },
  {
    id: "removes",
    label: "Removes",
    options: [
      { token: "removes:condition", label: "Condition" },
      { token: "removes:hex", label: "Hex" },
      { token: "removes:enchantment", label: "Enchantment" },
      { token: "removes:stance", label: "Stance" }
    ]
  },
  {
    id: "deals",
    label: "Deals Damage",
    options: [
      { token: "deals:damage", label: "Any damage" },
      { token: "deals:fire", label: "Fire" },
      { token: "deals:cold", label: "Cold" },
      { token: "deals:lightning", label: "Lightning" },
      { token: "deals:earth", label: "Earth" },
      { token: "deals:holy", label: "Holy" },
      { token: "deals:shadow", label: "Shadow" },
      { token: "deals:chaos", label: "Chaos" }
    ]
  }
] as const;

const SKILL_METADATA_TOKENS = new Set<SkillMetadataToken>(
  SKILL_METADATA_FILTER_GROUPS.flatMap((group) => group.options.map((option) => option.token))
);

export function createSkillMetadataIndex(
  value: unknown,
  skills: readonly CatalogSkillRecord[]
): SkillMetadataIndex {
  const errors: SkillMetadataIndexIssue[] = [];
  const warnings: SkillMetadataIndexWarning[] = [];
  const recordsBySkillId = new Map<number, SkillMetadataIndexRecord>();

  if (!isRecord(value)) {
    return {
      recordsBySkillId,
      errors: [
        {
          code: "overlay-not-object",
          path: "$",
          message: "skill metadata overlay is not an object"
        }
      ],
      warnings
    };
  }

  if (value.schemaVersion !== SKILL_METADATA_OVERLAY_SCHEMA_VERSION) {
    errors.push({
      code: "schema-version-invalid",
      path: "$.schemaVersion",
      message: `skill metadata overlay schemaVersion must be ${SKILL_METADATA_OVERLAY_SCHEMA_VERSION}`
    });
  }
  if (value.kind !== SKILL_METADATA_OVERLAY_KIND) {
    errors.push({
      code: "kind-invalid",
      path: "$.kind",
      message: `skill metadata overlay kind must be ${SKILL_METADATA_OVERLAY_KIND}`
    });
  }
  if (!Array.isArray(value.records)) {
    errors.push({
      code: "records-invalid",
      path: "$.records",
      message: "skill metadata overlay records must be an array"
    });
    return { recordsBySkillId, errors, warnings };
  }

  const skillsById = new Map(skills.map((skill) => [Number(skill.id), skill]));
  const seenSkillIds = new Set<number>();
  value.records.forEach((record, index) => {
    const path = `$.records[${index}]`;
    if (!isRecord(record)) {
      errors.push({
        code: "record-invalid",
        path,
        message: "skill metadata record is not an object"
      });
      return;
    }

    const skillId = readSkillId(record.skillId, path, errors);
    const name = readName(record.name, path, errors);
    const sourceTextDigest = readSourceTextDigest(record.sourceTextDigest, path, errors);
    const metadata = readMetadata(record.metadata, path, errors);

    if (skillId === null || name === null || sourceTextDigest === undefined || metadata === null) {
      return;
    }
    if (seenSkillIds.has(skillId)) {
      errors.push({
        code: "skill-id-duplicate",
        path: `${path}.skillId`,
        message: `skill metadata record duplicates skill id ${skillId}`
      });
      return;
    }
    seenSkillIds.add(skillId);

    const skill = skillsById.get(skillId);
    if (skill === undefined) {
      errors.push({
        code: "skill-id-unknown",
        path: `${path}.skillId`,
        message: `skill metadata record references unknown skill id ${skillId}`
      });
      return;
    }
    if (name !== skill.name) {
      warnings.push({
        code: "name-mismatch",
        path: `${path}.name`,
        message: `skill metadata record name "${name}" does not match catalog skill "${skill.name}"`
      });
      return;
    }
    if (sourceTextDigest !== (skill.description.sourceTextDigest ?? null)) {
      warnings.push({
        code: "source-text-digest-mismatch",
        path: `${path}.sourceTextDigest`,
        message: `${skill.name} skill metadata sourceTextDigest is stale`
      });
      return;
    }

    recordsBySkillId.set(skillId, {
      skillId: skill.id,
      name,
      sourceTextDigest,
      metadata,
      expandedMetadata: expandSkillMetadataTokens(metadata)
    });
  });

  return { recordsBySkillId, errors, warnings };
}

export function isSkillMetadataToken(value: string): value is SkillMetadataToken {
  return SKILL_METADATA_TOKENS.has(value as SkillMetadataToken);
}

export function expandSkillMetadataTokens(
  metadata: readonly SkillMetadataToken[]
): readonly SkillMetadataToken[] {
  const expanded = new Set<SkillMetadataToken>();
  for (const token of metadata) {
    expanded.add(token);
    if (token.startsWith("applies:") && token !== "applies:condition") {
      expanded.add("applies:condition");
    }
    if (token.startsWith("deals:") && token !== "deals:damage") {
      expanded.add("deals:damage");
    }
  }
  return [...expanded].sort(compareSkillMetadataTokens);
}

export function skillMetadataTokensForSkill(
  skill: CatalogSkillRecord,
  index: SkillMetadataIndex
): readonly SkillMetadataToken[] {
  return index.recordsBySkillId.get(Number(skill.id))?.expandedMetadata ?? [];
}

export function skillHasMetadataTokens(
  skill: CatalogSkillRecord,
  requiredTokens: readonly SkillMetadataToken[],
  index: SkillMetadataIndex
): boolean {
  if (requiredTokens.length === 0) {
    return true;
  }
  const tokens = new Set(skillMetadataTokensForSkill(skill, index));
  return requiredTokens.every((token) => tokens.has(token));
}

function readSkillId(
  value: unknown,
  path: string,
  errors: SkillMetadataIndexIssue[]
): number | null {
  if (!Number.isSafeInteger(value)) {
    errors.push({
      code: "skill-id-invalid",
      path: `${path}.skillId`,
      message: "skill metadata record skillId must be an integer"
    });
    return null;
  }
  return Number(value);
}

function readName(value: unknown, path: string, errors: SkillMetadataIndexIssue[]): string | null {
  if (typeof value !== "string" || value.length === 0) {
    errors.push({
      code: "name-invalid",
      path: `${path}.name`,
      message: "skill metadata record name must be a non-empty string"
    });
    return null;
  }
  return value;
}

function readSourceTextDigest(
  value: unknown,
  path: string,
  errors: SkillMetadataIndexIssue[]
): string | null | undefined {
  if (value === null || typeof value === "string") {
    return value;
  }
  errors.push({
    code: "source-text-digest-invalid",
    path: `${path}.sourceTextDigest`,
    message: "skill metadata record sourceTextDigest must be a string or null"
  });
  return undefined;
}

function readMetadata(
  value: unknown,
  path: string,
  errors: SkillMetadataIndexIssue[]
): readonly SkillMetadataToken[] | null {
  if (!Array.isArray(value)) {
    errors.push({
      code: "metadata-invalid",
      path: `${path}.metadata`,
      message: "skill metadata record metadata must be an array"
    });
    return null;
  }

  const metadata: SkillMetadataToken[] = [];
  let valid = true;
  value.forEach((token, index) => {
    const tokenPath = `${path}.metadata[${index}]`;
    if (typeof token !== "string" || !isSkillMetadataToken(token)) {
      valid = false;
      errors.push({
        code: "metadata-token-invalid",
        path: tokenPath,
        message: `skill metadata token ${String(token)} is not supported`
      });
      return;
    }
    metadata.push(token);
  });
  return valid ? metadata : null;
}

function compareSkillMetadataTokens(left: SkillMetadataToken, right: SkillMetadataToken): number {
  return skillMetadataTokenRank(left) - skillMetadataTokenRank(right);
}

function skillMetadataTokenRank(token: SkillMetadataToken): number {
  const tokens = SKILL_METADATA_FILTER_GROUPS.flatMap((group) =>
    group.options.map((option) => option.token)
  );
  const index = tokens.indexOf(token);
  return index >= 0 ? index : tokens.length;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
