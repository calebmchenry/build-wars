import {
  labelForTitleRankKey,
  lookupSkillById,
  titleRankOverrideFor,
  type TitleRankDefinition,
  type TitleRankOverrideMutationFacts,
  type ValidationIssue,
  type ValidationResult
} from "../domain";
import type { AppCatalogViews } from "./catalogs";
import type { EditorState } from "./editor-state";

export type TitleRankControlStatus = "configured" | "default" | "retained" | "unsupported";

export interface TitleRankIssueView {
  readonly code: string;
  readonly message: string;
  readonly severity: "warning" | "error" | "info";
}

export interface TitleRankControlView {
  readonly key: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly rangeText: string;
  readonly currentText: string;
  readonly status: TitleRankControlStatus;
  readonly relevant: boolean;
  readonly resettable: boolean;
  readonly disabled: boolean;
  readonly mutationFacts: TitleRankOverrideMutationFacts | null;
  readonly issues: readonly TitleRankIssueView[];
}

export interface TitleRankPanelView {
  readonly relevantRows: readonly TitleRankControlView[];
  readonly allRows: readonly TitleRankControlView[];
  readonly hasConfiguredOverrides: boolean;
  readonly hasDefinitions: boolean;
}

export function selectTitleRankPanelView(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult
): TitleRankPanelView {
  const relevantKeys = relevantTitleKeys(state, catalogs);
  const relevantKeySet = new Set(relevantKeys);
  const issues = issuesByTitleKey(validation.issues);
  const definitionsByLabel = [...catalogs.titleRanks.definitions].sort(compareDefinitionsByLabel);
  const relevantRows = relevantKeys.flatMap((key) => {
    const definition = catalogs.titleRanks.byCanonicalKey.get(key);
    return definition === undefined
      ? []
      : [definitionRow(state, definition, true, issues.get(key) ?? [])];
  });
  const allDefinitionRows = definitionsByLabel
    .filter((definition) => !relevantKeySet.has(definition.key))
    .map((definition) => definitionRow(state, definition, false, issues.get(definition.key) ?? []));
  const staleRows = state.build.titleRankOverrides
    .filter((override) => !catalogs.titleRanks.byCanonicalKey.has(override.key))
    .map((override) =>
      staleOverrideRow(override.key, override.rank, issues.get(override.key) ?? [])
    )
    .sort(compareRowsByLabel);

  return {
    relevantRows,
    allRows: [...allDefinitionRows, ...staleRows],
    hasConfiguredOverrides: state.build.titleRankOverrides.length > 0,
    hasDefinitions: catalogs.titleRanks.definitions.length > 0
  };
}

function relevantTitleKeys(state: EditorState, catalogs: AppCatalogViews): readonly string[] {
  const keys: string[] = [];
  for (const skillId of state.build.skillBar) {
    if (skillId === null) {
      continue;
    }
    const skill = lookupSkillById(catalogs.skillCatalog, skillId);
    if (skill === null) {
      continue;
    }
    for (const seriesId of skill.progressionSeriesIds) {
      const key = catalogs.titleRanks.definitionKeyBySeriesId.get(seriesId);
      if (key !== undefined && !keys.includes(key)) {
        keys.push(key);
      }
    }
  }
  return keys;
}

function definitionRow(
  state: EditorState,
  definition: TitleRankDefinition,
  relevant: boolean,
  issues: readonly TitleRankIssueView[]
): TitleRankControlView {
  const override = titleRankOverrideFor(state.build.titleRankOverrides, definition.key);
  const editableDomain = definition.editableDomain;
  const value = override?.rank ?? editableDomain?.max ?? 0;
  const disabled = editableDomain === null || definition.defaultKind === "unsupported";
  const metadataIssue =
    definition.defaultKind === "alias-conflict"
      ? [
          {
            code: "title.alias-domain-conflict",
            severity: "warning" as const,
            message: "Catalog aliases expose different maxima; reset uses per-series maximum ranks."
          }
        ]
      : [];

  return {
    key: definition.key,
    label: definition.label,
    min: editableDomain?.min ?? value,
    max: editableDomain?.max ?? value,
    value,
    rangeText:
      editableDomain === null
        ? "No editable exact rows"
        : `${editableDomain.min}-${editableDomain.max}`,
    currentText:
      override === null
        ? definition.defaultKind === "alias-conflict"
          ? "Per-series maximum"
          : `Rank ${value} by default`
        : `Rank ${override.rank} configured`,
    status:
      definition.defaultKind === "unsupported"
        ? "unsupported"
        : override === null
          ? "default"
          : "configured",
    relevant,
    resettable: override !== null,
    disabled,
    mutationFacts:
      disabled || editableDomain === null
        ? null
        : {
            key: definition.key,
            defaultKind: definition.defaultKind,
            editableRanks: definition.editableRanks
          },
    issues: [...metadataIssue, ...issues]
  };
}

function staleOverrideRow(
  key: string,
  rank: number,
  issues: readonly TitleRankIssueView[]
): TitleRankControlView {
  return {
    key,
    label: labelForTitleRankKey(key),
    min: rank,
    max: rank,
    value: rank,
    rangeText: "Retained stale override",
    currentText: `Rank ${rank} retained`,
    status: "retained",
    relevant: false,
    resettable: true,
    disabled: true,
    mutationFacts: null,
    issues:
      issues.length === 0
        ? [
            {
              code: "title.override-unknown",
              severity: "warning",
              message: "This title rank is not present in the current catalog."
            }
          ]
        : issues
  };
}

function issuesByTitleKey(
  issues: readonly ValidationIssue[]
): ReadonlyMap<string, readonly TitleRankIssueView[]> {
  const byKey = new Map<string, TitleRankIssueView[]>();
  for (const issue of issues) {
    const key = titleKeyForIssue(issue);
    if (key === null) {
      continue;
    }
    const existing = byKey.get(key) ?? [];
    existing.push({ code: issue.code, message: issue.message, severity: issue.severity });
    byKey.set(key, existing);
  }
  return byKey;
}

function titleKeyForIssue(issue: ValidationIssue): string | null {
  if (issue.location?.kind === "title-rank" && issue.location.key !== null) {
    return issue.location.key;
  }
  const entity = issue.relatedEntities.find((candidate) => candidate.kind === "title-rank");
  return typeof entity?.id === "string" ? entity.id : null;
}

function compareDefinitionsByLabel(left: TitleRankDefinition, right: TitleRankDefinition): number {
  return (
    left.label.localeCompare(right.label, "en-US") || left.key.localeCompare(right.key, "en-US")
  );
}

function compareRowsByLabel(left: TitleRankControlView, right: TitleRankControlView): number {
  return (
    left.label.localeCompare(right.label, "en-US") || left.key.localeCompare(right.key, "en-US")
  );
}
