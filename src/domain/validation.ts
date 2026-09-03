export const RULE_ENGINE_VERSION = "rule-engine:v3";

export type ValidationSeverity = "error" | "warning" | "info";
export type ValidationPathSegment = string | number;
export type ValidationPath = readonly ValidationPathSegment[];

export type ValidationIssueCode =
  | "attribute.budget-overspent"
  | "attribute.budget-unresolved"
  | "attribute.duplicate"
  | "attribute.invalid-rank"
  | "attribute.primary-only"
  | "attribute.unsupported-rank"
  | "attribute.unresolved"
  | "attribute.wrong-profession"
  | "build.unsupported-mode"
  | "catalog.attribute-duplicate-id"
  | "catalog.attribute-rank-cost-gap"
  | "catalog.profession-duplicate-id"
  | "catalog.skill-duplicate-id"
  | "catalog.skill-split-group-duplicate-id"
  | "catalog.skill-split-group-duplicate-member"
  | "catalog.skill-split-group-overbroad"
  | "equipment.armor-selection-unresolved"
  | "equipment.armor-slot-duplicate"
  | "equipment.armor-slot-malformed"
  | "equipment.armor-slot-missing"
  | "equipment.catalog-duplicate-id"
  | "equipment.catalog-set-mismatch"
  | "equipment.catalog-unavailable"
  | "equipment.headgear-attribute-invalid"
  | "equipment.headgear-slot-invalid"
  | "equipment.headgear-unresolved"
  | "equipment.insignia-restricted"
  | "equipment.insignia-slot-inapplicable"
  | "equipment.insignia-unresolved"
  | "equipment.rune-restricted"
  | "equipment.rune-unresolved"
  | "equipment.schema-unsupported"
  | "equipment.weapon-mode-restricted"
  | "equipment.weapon-modifier-compatibility-unresolved"
  | "equipment.weapon-modifier-duplicate-slot"
  | "equipment.weapon-modifier-incompatible"
  | "equipment.weapon-modifier-unresolved"
  | "equipment.weapon-modifier-without-weapon"
  | "equipment.weapon-occupancy-conflict"
  | "equipment.weapon-requirement-unmet"
  | "equipment.weapon-requirement-unresolved"
  | "equipment.weapon-set-duplicate"
  | "equipment.weapon-set-malformed"
  | "equipment.weapon-set-missing"
  | "equipment.weapon-unresolved"
  | "equipment.weapon-wrong-hand"
  | "option.unsupported"
  | "profession.duplicate"
  | "profession.primary-missing"
  | "profession.primary-unresolved"
  | "profession.secondary-missing"
  | "profession.secondary-unresolved"
  | "profession.secondary-without-primary"
  | "skill.attribute-metadata-conflict"
  | "skill.attribute-metadata-missing"
  | "skill.attribute-unresolved"
  | "skill.dispositioned"
  | "skill.duplicate"
  | "skill.duplicate-uncertain"
  | "skill.elite-limit"
  | "skill.mode-metadata-conflict"
  | "skill.mode-restricted"
  | "skill.mode-unknown"
  | "skill.non-player"
  | "skill.profession-missing-secondary"
  | "skill.professionless-unsupported"
  | "skill.pve-only-limit"
  | "skill.split-ambiguous"
  | "skill.allegiance-unmodeled"
  | "skill.split-counterpart-unresolved"
  | "skill.title-alias-conflict"
  | "skill.title-domain-missing"
  | "skill.title-key-missing"
  | "skill.title-row-missing"
  | "skill.title-unsupported"
  | "skill.unresolved"
  | "skill.unsupported"
  | "skill.wrong-profession"
  | "skill-bar.incomplete"
  | "skill-bar.malformed"
  | "title.override-duplicate"
  | "title.override-invalid"
  | "title.override-out-of-domain"
  | "title.override-unknown";

export type ValidationRuleId =
  | "context.options"
  | "context.catalog-integrity"
  | "context.budget"
  | "context.skill-bar-shape"
  | "profession.primary-required"
  | "profession.secondary-required"
  | "profession.pair"
  | "profession.resolve"
  | "attribute.resolve"
  | "attribute.rank"
  | "attribute.duplicate"
  | "attribute.ownership"
  | "attribute.budget"
  | "skill-bar.incomplete"
  | "skill.resolve"
  | "skill.disposition"
  | "skill.duplicate"
  | "skill.elite-limit"
  | "skill.pve-only-limit"
  | "skill.support"
  | "skill.profession"
  | "skill.attribute"
  | "skill.mode"
  | "skill.split"
  | "skill.allegiance"
  | "skill.title-rank"
  | "title.override"
  | "equipment.structure"
  | "equipment.catalog"
  | "equipment.armor"
  | "equipment.weapon"
  | "equipment.weapon-requirement"
  | (string & {});

export type ValidationEntityKind =
  | "armor-slot"
  | "attribute"
  | "attribute-row"
  | "budget"
  | "catalog-key"
  | "equipment-selection"
  | "option"
  | "profession"
  | "rule"
  | "skill"
  | "skill-slot"
  | "split-group"
  | "title-rank"
  | "weapon"
  | "weapon-modifier"
  | "weapon-set";

export interface ValidationEntityReference {
  readonly kind: ValidationEntityKind;
  readonly id: string | number;
  readonly label?: string;
}

export type ValidationLocation =
  | {
      readonly kind: "attribute-row";
      readonly index: number;
    }
  | {
      readonly kind: "skill-slot";
      readonly index: number;
    }
  | {
      readonly kind: "profession";
      readonly field: "primary" | "secondary";
    }
  | {
      readonly kind: "catalog";
      readonly catalog:
        "insignias" | "profession-attributes" | "runes" | "skills" | "weapon-modifiers" | "weapons";
    }
  | {
      readonly kind: "armor-piece";
      readonly index: number;
      readonly slot: string | null;
    }
  | {
      readonly kind: "weapon-set";
      readonly index: number;
      readonly slot: string | null;
    }
  | {
      readonly kind: "weapon-hand";
      readonly setIndex: number;
      readonly hand: "mainHand" | "offHand";
    }
  | {
      readonly kind: "weapon-modifier";
      readonly setIndex: number;
      readonly hand: "mainHand" | "offHand";
      readonly index: number;
    }
  | {
      readonly kind: "options";
    }
  | {
      readonly kind: "title-rank";
      readonly key: string | null;
    };

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly code: ValidationIssueCode;
  readonly message: string;
  readonly path: ValidationPath;
  readonly location: ValidationLocation | null;
  readonly relatedEntities: readonly ValidationEntityReference[];
  readonly sourceRule: ValidationRuleId;
}

export interface ValidationIssueInit {
  readonly severity: ValidationSeverity;
  readonly code: ValidationIssueCode;
  readonly message: string;
  readonly path: ValidationPath;
  readonly location?: ValidationLocation | null;
  readonly relatedEntities?: readonly ValidationEntityReference[];
  readonly sourceRule: ValidationRuleId;
}

export interface ValidationIssueCounts {
  readonly error: number;
  readonly warning: number;
  readonly info: number;
  readonly total: number;
}

export type ValidationTruncationKind =
  | "armor-row-cap"
  | "attribute-row-cap"
  | "issue-cap"
  | "related-entity-cap"
  | "skill-slot-cap"
  | "title-override-cap"
  | "weapon-modifier-cap"
  | "weapon-set-row-cap";

export interface ValidationTruncation {
  readonly kind: ValidationTruncationKind;
  readonly limit: number;
  readonly observed: number;
  readonly path: ValidationPath;
}

export interface ValidationCatalogVersions {
  readonly buildCatalogVersion: string | null;
  readonly professionAttributeCatalogVersion: string | null;
  readonly skillCatalogVersion: string | null;
  readonly runeCatalogVersion?: string | null;
  readonly insigniaCatalogVersion?: string | null;
  readonly weaponCatalogVersion?: string | null;
  readonly weaponModifierCatalogVersion?: string | null;
  readonly weaponCatalogSetVersion?: string | null;
  readonly weaponCatalogSetDigest?: string | null;
  readonly weaponModifierCatalogSetVersion?: string | null;
  readonly weaponModifierCatalogSetDigest?: string | null;
  readonly ruleEngineVersion: typeof RULE_ENGINE_VERSION;
}

export interface ValidationResult {
  readonly issues: readonly ValidationIssue[];
  readonly counts: ValidationIssueCounts;
  readonly valid: boolean;
  readonly complete: boolean;
  readonly resolved: boolean;
  readonly exhaustive: boolean;
  readonly validatedAgainst: ValidationCatalogVersions;
  readonly truncation: ValidationTruncation | null;
}

const INCOMPLETE_CODES = new Set<ValidationIssueCode>([
  "profession.primary-missing",
  "profession.secondary-missing",
  "equipment.armor-slot-malformed",
  "equipment.armor-slot-missing",
  "equipment.schema-unsupported",
  "equipment.weapon-set-malformed",
  "equipment.weapon-set-missing",
  "skill.profession-missing-secondary",
  "skill-bar.incomplete",
  "skill-bar.malformed"
]);

const UNRESOLVED_CODES = new Set<ValidationIssueCode>([
  "attribute.budget-unresolved",
  "attribute.unsupported-rank",
  "attribute.unresolved",
  "build.unsupported-mode",
  "catalog.attribute-duplicate-id",
  "catalog.attribute-rank-cost-gap",
  "catalog.profession-duplicate-id",
  "catalog.skill-duplicate-id",
  "catalog.skill-split-group-duplicate-id",
  "catalog.skill-split-group-duplicate-member",
  "catalog.skill-split-group-overbroad",
  "equipment.armor-selection-unresolved",
  "equipment.catalog-duplicate-id",
  "equipment.catalog-set-mismatch",
  "equipment.catalog-unavailable",
  "equipment.headgear-unresolved",
  "equipment.insignia-unresolved",
  "equipment.rune-unresolved",
  "equipment.schema-unsupported",
  "equipment.weapon-modifier-compatibility-unresolved",
  "equipment.weapon-modifier-unresolved",
  "equipment.weapon-modifier-without-weapon",
  "equipment.weapon-requirement-unresolved",
  "equipment.weapon-unresolved",
  "option.unsupported",
  "profession.primary-unresolved",
  "profession.secondary-unresolved",
  "skill.attribute-metadata-conflict",
  "skill.attribute-metadata-missing",
  "skill.attribute-unresolved",
  "skill.dispositioned",
  "skill.duplicate-uncertain",
  "skill.allegiance-unmodeled",
  "skill.mode-metadata-conflict",
  "skill.mode-unknown",
  "skill.profession-missing-secondary",
  "skill.professionless-unsupported",
  "skill.split-ambiguous",
  "skill.split-counterpart-unresolved",
  "skill.title-alias-conflict",
  "skill.title-domain-missing",
  "skill.title-key-missing",
  "skill.title-row-missing",
  "skill.title-unsupported",
  "skill.unresolved",
  "skill.unsupported",
  "title.override-duplicate",
  "title.override-invalid",
  "title.override-out-of-domain",
  "title.override-unknown"
]);

const RULE_ORDER: readonly ValidationRuleId[] = [
  "context.options",
  "context.catalog-integrity",
  "context.budget",
  "context.skill-bar-shape",
  "profession.primary-required",
  "profession.secondary-required",
  "profession.pair",
  "profession.resolve",
  "attribute.resolve",
  "attribute.rank",
  "attribute.duplicate",
  "attribute.ownership",
  "attribute.budget",
  "skill-bar.incomplete",
  "skill.resolve",
  "skill.disposition",
  "skill.duplicate",
  "skill.elite-limit",
  "skill.pve-only-limit",
  "skill.support",
  "skill.profession",
  "skill.attribute",
  "skill.mode",
  "skill.split",
  "title.override",
  "skill.title-rank",
  "skill.allegiance",
  "equipment.structure",
  "equipment.catalog",
  "equipment.armor",
  "equipment.weapon",
  "equipment.weapon-requirement"
];

export function createValidationIssue(init: ValidationIssueInit): ValidationIssue {
  return {
    severity: init.severity,
    code: init.code,
    message: boundMessage(init.message),
    path: [...init.path],
    location: init.location ?? null,
    relatedEntities: canonicalizeRelatedEntities(init.relatedEntities ?? []),
    sourceRule: init.sourceRule
  };
}

export function relatedEntity(
  kind: ValidationEntityKind,
  id: string | number,
  label?: string
): ValidationEntityReference {
  if (label === undefined) {
    return { kind, id };
  }
  return { kind, id, label };
}

export function canonicalizeRelatedEntities(
  entities: readonly ValidationEntityReference[]
): readonly ValidationEntityReference[] {
  const unique = new Map<string, ValidationEntityReference>();
  for (const entity of entities) {
    unique.set(entityKey(entity), entity);
  }
  return [...unique.values()].sort(compareRelatedEntity);
}

export function sortValidationIssues(
  issues: readonly ValidationIssue[]
): readonly ValidationIssue[] {
  return [...issues].sort(compareValidationIssues);
}

export function summarizeValidationIssues(
  issues: readonly ValidationIssue[]
): ValidationIssueCounts {
  let error = 0;
  let warning = 0;
  let info = 0;
  for (const issue of issues) {
    if (issue.severity === "error") {
      error += 1;
    } else if (issue.severity === "warning") {
      warning += 1;
    } else {
      info += 1;
    }
  }
  return { error, warning, info, total: error + warning + info };
}

export function createValidationResult(
  issues: readonly ValidationIssue[],
  validatedAgainst: ValidationCatalogVersions,
  truncation: ValidationTruncation | null = null
): ValidationResult {
  const orderedIssues = sortValidationIssues(issues);
  const counts = summarizeValidationIssues(orderedIssues);
  return {
    issues: orderedIssues,
    counts,
    valid: counts.error === 0,
    complete:
      truncation === null && orderedIssues.every((issue) => !INCOMPLETE_CODES.has(issue.code)),
    resolved:
      truncation === null && orderedIssues.every((issue) => !UNRESOLVED_CODES.has(issue.code)),
    exhaustive: truncation === null,
    validatedAgainst,
    truncation
  };
}

export function compareValidationIssues(left: ValidationIssue, right: ValidationIssue): number {
  return (
    compareNumber(ruleRank(left.sourceRule), ruleRank(right.sourceRule)) ||
    comparePath(left.path, right.path) ||
    compareString(locationKey(left.location), locationKey(right.location)) ||
    compareString(left.code, right.code) ||
    compareString(
      relatedEntitiesKey(left.relatedEntities),
      relatedEntitiesKey(right.relatedEntities)
    ) ||
    compareString(left.message, right.message)
  );
}

function ruleRank(rule: ValidationRuleId): number {
  const index = RULE_ORDER.indexOf(rule);
  return index === -1 ? RULE_ORDER.length : index;
}

function comparePath(left: ValidationPath, right: ValidationPath): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const segmentComparison = comparePathSegment(left[index], right[index]);
    if (segmentComparison !== 0) {
      return segmentComparison;
    }
  }
  return compareNumber(left.length, right.length);
}

function comparePathSegment(
  left: ValidationPathSegment | undefined,
  right: ValidationPathSegment | undefined
): number {
  if (left === undefined || right === undefined) {
    return compareNumber(left === undefined ? 0 : 1, right === undefined ? 0 : 1);
  }
  if (typeof left === "number" && typeof right === "number") {
    return compareNumber(left, right);
  }
  if (typeof left === "number") {
    return -1;
  }
  if (typeof right === "number") {
    return 1;
  }
  return compareString(left, right);
}

function compareRelatedEntity(
  left: ValidationEntityReference,
  right: ValidationEntityReference
): number {
  return compareString(entityKey(left), entityKey(right));
}

function relatedEntitiesKey(entities: readonly ValidationEntityReference[]): string {
  return entities.map(entityKey).join("|");
}

function entityKey(entity: ValidationEntityReference): string {
  return `${entity.kind}:${String(entity.id)}:${entity.label ?? ""}`;
}

function locationKey(location: ValidationLocation | null): string {
  if (location === null) {
    return "";
  }
  if (
    location.kind === "attribute-row" ||
    location.kind === "skill-slot" ||
    location.kind === "armor-piece" ||
    location.kind === "weapon-set"
  ) {
    return `${location.kind}:${location.index}`;
  }
  if (location.kind === "weapon-hand") {
    return `weapon-hand:${location.setIndex}:${location.hand}`;
  }
  if (location.kind === "weapon-modifier") {
    return `weapon-modifier:${location.setIndex}:${location.hand}:${location.index}`;
  }
  if (location.kind === "profession") {
    return `profession:${location.field}`;
  }
  if (location.kind === "title-rank") {
    return `title-rank:${location.key ?? ""}`;
  }
  if (location.kind === "catalog") {
    return `catalog:${location.catalog}`;
  }
  return "options";
}

function compareNumber(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareString(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function boundMessage(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  return normalized.length <= 240 ? normalized : `${normalized.slice(0, 237)}...`;
}
