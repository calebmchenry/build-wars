import type {
  CatalogSkillRecord,
  SkillCatalog,
  SkillDescriptionToken,
  SkillMode,
  SkillProgressionSeries
} from "./catalog";
import type { SkillId } from "./ids";
import { lookupSkillById, resolveSkillModeVariant } from "./catalog-lookup";

export type SkillTooltipUnresolvedReason =
  | "unknown-skill"
  | "unknown-mode"
  | "missing-rank"
  | "title-dependency"
  | "unsupported-description"
  | "unsupported-progression";

export type SkillTooltipOutcome =
  | {
      readonly kind: "rendered";
      readonly skill: CatalogSkillRecord;
      readonly text: string;
    }
  | {
      readonly kind: "unresolved";
      readonly skill: CatalogSkillRecord | null;
      readonly reason: SkillTooltipUnresolvedReason;
      readonly detail: string;
    };

export interface SkillTooltipContext {
  readonly mode: SkillMode | "unknown";
  readonly ranks: Readonly<Record<string, number>>;
}

export function renderSkillTooltipText(
  catalog: SkillCatalog,
  skillId: SkillId,
  context: SkillTooltipContext
): SkillTooltipOutcome {
  const skill = lookupSkillById(catalog, skillId);
  if (skill === null) {
    return {
      kind: "unresolved",
      skill: null,
      reason: "unknown-skill",
      detail: `Unknown skill ID ${Number(skillId)}.`
    };
  }

  const variant = resolveSkillModeVariant(catalog, skill, context.mode);
  if (variant.kind === "ambiguous-mode") {
    return {
      kind: "unresolved",
      skill,
      reason: "unknown-mode",
      detail: `Skill ${skill.name} has mode variants and requires an explicit mode.`
    };
  }
  if (variant.kind === "missing-variant") {
    return {
      kind: "unresolved",
      skill,
      reason: "unknown-mode",
      detail: `Skill ${skill.name} has no ${variant.mode} variant in its split group.`
    };
  }

  const selected = variant.skill;
  if (selected.description.state === "unsupported") {
    return {
      kind: "unresolved",
      skill: selected,
      reason: "unsupported-description",
      detail: `Skill ${selected.name} has unsupported description data.`
    };
  }

  const parts: string[] = [];
  for (const token of selected.description.tokens) {
    const rendered = renderToken(catalog, token, context);
    if (rendered.kind === "unresolved") {
      return { ...rendered, skill: selected };
    }
    parts.push(rendered.value);
  }

  return {
    kind: "rendered",
    skill: selected,
    text: parts
      .join("")
      .replace(/[ \t]+\n/g, "\n")
      .trim()
  };
}

type TokenRenderOutcome =
  | { readonly kind: "rendered"; readonly value: string }
  | {
      readonly kind: "unresolved";
      readonly skill: CatalogSkillRecord | null;
      readonly reason: SkillTooltipUnresolvedReason;
      readonly detail: string;
    };

function renderToken(
  catalog: SkillCatalog,
  token: SkillDescriptionToken,
  context: SkillTooltipContext
): TokenRenderOutcome {
  if (token.kind === "literal" || token.kind === "reviewed-factual-marker") {
    return { kind: "rendered", value: token.value };
  }
  if (token.kind === "whitespace") {
    return { kind: "rendered", value: " " };
  }
  if (token.kind === "line-break") {
    return { kind: "rendered", value: "\n" };
  }

  const series = catalog.progressionSeries.find((candidate) => candidate.id === token.seriesId);
  if (series === undefined) {
    return {
      kind: "unresolved",
      skill: null,
      reason: "unsupported-progression",
      detail: `Progression series ${token.seriesId} was not present in the catalog.`
    };
  }

  return renderProgressionValue(series, token.valueSlot, context);
}

function renderProgressionValue(
  series: SkillProgressionSeries,
  valueSlot: number,
  context: SkillTooltipContext
): TokenRenderOutcome {
  if (series.dependency.kind === "title-rank") {
    const key = series.dependency.titleKey;
    if (key === null || context.ranks[key] === undefined) {
      return {
        kind: "unresolved",
        skill: null,
        reason: "title-dependency",
        detail: `Progression ${series.id} requires a title-rank value.`
      };
    }
  }

  const rankKey =
    series.dependency.kind === "attribute" && series.dependency.attributeId !== null
      ? `attribute:${Number(series.dependency.attributeId)}`
      : series.dependency.titleKey;
  const rank = rankKey === null ? 0 : context.ranks[rankKey];
  if (rank === undefined) {
    return {
      kind: "unresolved",
      skill: null,
      reason: "missing-rank",
      detail: `Progression ${series.id} requires rank key ${rankKey ?? "constant"}.`
    };
  }

  const row = series.values.find((candidate) => candidate.rank === rank);
  const value = row?.values[valueSlot];
  if (value === undefined) {
    return {
      kind: "unresolved",
      skill: null,
      reason: "missing-rank",
      detail: `Progression ${series.id} has no value for rank ${rank}.`
    };
  }

  return { kind: "rendered", value: String(value) };
}
