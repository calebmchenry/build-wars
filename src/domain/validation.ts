export const RULE_ENGINE_VERSION = "rule-engine:v1";

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
  | "skill.allegiance-deferred"
  | "skill.split-counterpart-unresolved"
  | "skill.title-deferred"
  | "skill.unresolved"
  | "skill.unsupported"
  | "skill.wrong-profession"
  | "skill-bar.incomplete"
  | "skill-bar.malformed";

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
  | "skill.deferred-title"
  | (string & {});

export type ValidationEntityKind =
  | "attribute"
  | "attribute-row"
  | "budget"
  | "catalog-key"
  | "option"
  | "profession"
  | "rule"
  | "skill"
  | "skill-slot"
  | "split-group";

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
      readonly catalog: "profession-attributes" | "skills";
    }
  | {
      readonly kind: "options";
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
  "attribute-row-cap" | "issue-cap" | "related-entity-cap" | "skill-slot-cap";

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
  "option.unsupported",
  "profession.primary-unresolved",
  "profession.secondary-unresolved",
  "skill.attribute-metadata-conflict",
  "skill.attribute-metadata-missing",
  "skill.attribute-unresolved",
  "skill.dispositioned",
  "skill.duplicate-uncertain",
  "skill.allegiance-deferred",
  "skill.mode-metadata-conflict",
  "skill.mode-unknown",
  "skill.profession-missing-secondary",
  "skill.professionless-unsupported",
  "skill.split-ambiguous",
  "skill.split-counterpart-unresolved",
  "skill.title-deferred",
  "skill.unresolved",
  "skill.unsupported"
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
  "skill.deferred-title"
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
  if (location.kind === "attribute-row" || location.kind === "skill-slot") {
    return `${location.kind}:${location.index}`;
  }
  if (location.kind === "profession") {
    return `profession:${location.field}`;
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
