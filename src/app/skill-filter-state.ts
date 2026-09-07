import {
  SKILL_METADATA_FILTER_GROUPS,
  skillTypeLabelForId,
  type CatalogProfessionRecord,
  type ProfessionId,
  type SkillMetadataToken
} from "../domain";
import type { Dispatch } from "react";

import type { AppCatalogViews } from "./catalogs";
import type {
  BrowserAvailabilityFilter,
  BrowserFilters,
  BrowserProfessionScope,
  BrowserSortMode,
  EditorAction,
  EditorState,
  ResourceFilterKind,
  ResourceFilterValue
} from "./editor-state";

export const RESOURCE_FILTERS: readonly ResourceFilterKind[] = [
  "energy",
  "adrenaline",
  "sacrifice",
  "upkeep",
  "overcast"
];

export const RESOURCE_FILTER_LABELS: Readonly<Record<ResourceFilterKind, string>> = {
  energy: "Energy",
  adrenaline: "Adrenaline",
  sacrifice: "Sacrifice",
  upkeep: "Upkeep",
  overcast: "Overcast"
};

export const RESOURCE_VALUE_LABELS: Readonly<Record<ResourceFilterValue, string>> = {
  any: "Any",
  explicit: "Explicit",
  zero: "Zero",
  number: "Number",
  percentage: "Percent",
  special: "Special"
};

const ALL_RESOURCE_FILTERS: Readonly<Record<ResourceFilterKind, ResourceFilterValue>> = {
  energy: "any",
  adrenaline: "any",
  sacrifice: "any",
  upkeep: "any",
  overcast: "any"
};

const AVAILABILITY_FILTERS = new Set<string>([
  "all",
  "pve",
  "pvp",
  "both",
  "pve-only",
  "pvp-only",
  "unknown"
]);

const SORT_LABELS: Readonly<Record<BrowserSortMode, string>> = {
  attribute: "Attribute",
  name: "Name",
  type: "Type"
};

export type SkillFilterChip =
  | {
      readonly kind: "profession";
      readonly key: string;
      readonly label: string;
      readonly profession: CatalogProfessionRecord;
    }
  | {
      readonly kind: "mode";
      readonly key: string;
      readonly label: string;
    }
  | {
      readonly kind: "text";
      readonly key: string;
      readonly label: string;
    }
  | {
      readonly kind: "attribute";
      readonly key: string;
      readonly label: string;
    }
  | {
      readonly kind: "skill-type";
      readonly key: string;
      readonly label: string;
    }
  | {
      readonly kind: "elite";
      readonly key: string;
      readonly label: string;
    }
  | {
      readonly kind: "metadata";
      readonly key: string;
      readonly label: string;
      readonly token: SkillMetadataToken;
    }
  | {
      readonly kind: "resource";
      readonly key: string;
      readonly label: string;
      readonly resource: ResourceFilterKind;
    }
  | {
      readonly kind: "sort";
      readonly key: string;
      readonly label: string;
    };

export function selectActiveSkillFilterChips(
  state: EditorState,
  catalogs: AppCatalogViews
): readonly SkillFilterChip[] {
  const filters = state.browser.filters;
  const chips: SkillFilterChip[] = professionFilterRecords(state, catalogs).map((profession) => ({
    kind: "profession",
    key: `profession:${Number(profession.id)}`,
    label: profession.name,
    profession
  }));
  const modeChip = modeFilterChip(state);
  if (modeChip !== null) {
    chips.push(modeChip);
  }
  const textQuery = filters.textQuery.trim();
  if (textQuery.length > 0) {
    chips.push({ kind: "text", key: "text", label: `Text: ${textQuery}` });
  }
  if (filters.attributeId !== null) {
    const attribute = catalogs.attributes.find(
      (candidate) => Number(candidate.id) === Number(filters.attributeId)
    );
    chips.push({
      kind: "attribute",
      key: "attribute",
      label: `Attribute: ${attribute?.name ?? Number(filters.attributeId)}`
    });
  }
  if (filters.skillType !== null) {
    chips.push({
      kind: "skill-type",
      key: "skill-type",
      label: `Type: ${skillTypeLabelForId(filters.skillType)}`
    });
  }
  if (filters.elite !== "any") {
    chips.push({
      kind: "elite",
      key: "elite",
      label: filters.elite === "elite" ? "Elite" : "Non-elite"
    });
  }
  for (const token of filters.metadata) {
    chips.push({
      kind: "metadata",
      key: `metadata:${token}`,
      label: metadataTokenLabel(token),
      token
    });
  }
  for (const resource of RESOURCE_FILTERS) {
    const value = filters.resources[resource];
    if (value === "any") {
      continue;
    }
    chips.push({
      kind: "resource",
      key: `resource:${resource}`,
      label:
        value === "explicit"
          ? `Cost: ${RESOURCE_FILTER_LABELS[resource]}`
          : `Cost: ${RESOURCE_FILTER_LABELS[resource]} ${RESOURCE_VALUE_LABELS[value]}`,
      resource
    });
  }
  if (filters.sortMode !== "attribute") {
    chips.push({
      kind: "sort",
      key: "sort",
      label: `Sort: ${SORT_LABELS[filters.sortMode]}`
    });
  }
  return chips;
}

export function resetFocusedSkillFilters(dispatch: Dispatch<EditorAction>): void {
  dispatch({
    type: "set-browser-filters",
    filters: {
      textQuery: "",
      professionScope: { kind: "default" },
      attributeId: null,
      skillType: null,
      elite: "any",
      availability: "default",
      resources: ALL_RESOURCE_FILTERS,
      metadata: [],
      sortMode: "attribute"
    }
  });
}

export function hasCustomizedSkillFilters(state: EditorState): boolean {
  const filters = state.browser.filters;
  return (
    filters.textQuery.trim().length > 0 ||
    filters.professionScope.kind !== "default" ||
    filters.attributeId !== null ||
    filters.skillType !== null ||
    filters.elite !== "any" ||
    filters.availability !== "default" ||
    RESOURCE_FILTERS.some((resource) => filters.resources[resource] !== "any") ||
    filters.metadata.length > 0 ||
    filters.sortMode !== "attribute"
  );
}

export function advancedSkillFilterCount(filters: BrowserFilters): number {
  return [
    filters.attributeId !== null,
    filters.skillType !== null,
    filters.elite !== "any",
    filters.sortMode !== "attribute"
  ].filter(Boolean).length;
}

export function removeSkillFilterChip(
  chip: SkillFilterChip,
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>
): void {
  switch (chip.kind) {
    case "profession":
      removeProfessionFilter(state, catalogs, dispatch, chip.profession.id);
      return;
    case "mode":
      dispatch({ type: "set-browser-filters", filters: { availability: "all" } });
      return;
    case "text":
      dispatch({ type: "set-browser-filters", filters: { textQuery: "" } });
      return;
    case "attribute":
      dispatch({ type: "set-browser-filters", filters: { attributeId: null } });
      return;
    case "skill-type":
      dispatch({ type: "set-browser-filters", filters: { skillType: null } });
      return;
    case "elite":
      dispatch({ type: "set-browser-filters", filters: { elite: "any" } });
      return;
    case "metadata":
      dispatch({
        type: "set-browser-filters",
        filters: {
          metadata: state.browser.filters.metadata.filter((token) => token !== chip.token)
        }
      });
      return;
    case "resource":
      dispatch({
        type: "set-browser-filters",
        filters: {
          resources: {
            ...state.browser.filters.resources,
            [chip.resource]: "any"
          }
        }
      });
      return;
    case "sort":
      dispatch({ type: "set-browser-filters", filters: { sortMode: "attribute" } });
  }
}

export function toggleProfessionFilter(
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>,
  profession: CatalogProfessionRecord
): void {
  const selected = new Set(
    professionIdsForFilterEditing(state, catalogs).map((professionId) => Number(professionId))
  );
  const professionId = Number(profession.id);
  if (selected.has(professionId)) {
    selected.delete(professionId);
  } else {
    selected.add(professionId);
  }
  const nextProfessionIds = catalogs.professions
    .filter((candidate) => selected.has(Number(candidate.id)))
    .map((candidate) => candidate.id);
  dispatch({
    type: "set-browser-filters",
    filters: { professionScope: professionScopeFromIds(nextProfessionIds, catalogs) }
  });
}

export function professionIdsForFilterEditing(
  state: EditorState,
  catalogs: AppCatalogViews
): readonly ProfessionId[] {
  const scope = state.browser.filters.professionScope;
  if (scope.kind === "all") {
    return [];
  }
  if (scope.kind === "custom") {
    return catalogs.professions
      .filter((profession) =>
        scope.professionIds.some((professionId) => Number(professionId) === Number(profession.id))
      )
      .map((profession) => profession.id);
  }
  const selected = [state.build.primaryProfessionId, state.build.secondaryProfessionId].filter(
    (professionId): professionId is ProfessionId => professionId !== null
  );
  return catalogs.professions
    .filter((profession) =>
      selected.some((professionId) => Number(professionId) === Number(profession.id))
    )
    .map((profession) => profession.id);
}

export function availabilityControlValue(
  state: EditorState
): Exclude<BrowserAvailabilityFilter, "default"> {
  const availability = state.browser.filters.availability;
  if (availability !== "default") {
    return availability;
  }
  return state.build.mode === "pvp" ? "pvp" : "pve";
}

export function availabilityFilterFromControlValue(
  value: string,
  state: EditorState
): BrowserAvailabilityFilter {
  if (!AVAILABILITY_FILTERS.has(value)) {
    return "default";
  }
  if ((value === "pve" || value === "pvp") && value === state.build.mode) {
    return "default";
  }
  return value as BrowserAvailabilityFilter;
}

function removeProfessionFilter(
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>,
  professionId: ProfessionId
): void {
  const nextProfessionIds = professionIdsForFilterEditing(state, catalogs).filter(
    (candidate) => Number(candidate) !== Number(professionId)
  );
  dispatch({
    type: "set-browser-filters",
    filters: { professionScope: professionScopeFromIds(nextProfessionIds, catalogs) }
  });
}

function professionScopeFromIds(
  professionIds: readonly ProfessionId[],
  catalogs: AppCatalogViews
): BrowserProfessionScope {
  const selected = new Set(professionIds.map((professionId) => Number(professionId)));
  const normalized = catalogs.professions
    .filter((profession) => selected.has(Number(profession.id)))
    .map((profession) => profession.id);
  if (normalized.length === 0 || normalized.length === catalogs.professions.length) {
    return { kind: "all" };
  }
  return { kind: "custom", professionIds: normalized };
}

function professionFilterRecords(
  state: EditorState,
  catalogs: AppCatalogViews
): readonly CatalogProfessionRecord[] {
  const professionIds = professionIdsForFilterEditing(state, catalogs);
  if (professionIds.length === 0 || professionIds.length === catalogs.professions.length) {
    return [];
  }
  const selected = new Set(professionIds.map((professionId) => Number(professionId)));
  return catalogs.professions.filter((profession) => selected.has(Number(profession.id)));
}

function modeFilterChip(state: EditorState): SkillFilterChip | null {
  const availability = state.browser.filters.availability;
  if (availability === "all") {
    return null;
  }
  if (availability === "default") {
    if (state.build.mode !== "pve" && state.build.mode !== "pvp") {
      return null;
    }
    return {
      kind: "mode",
      key: "mode",
      label: `Mode: ${state.build.mode === "pve" ? "PvE" : "PvP"}`
    };
  }
  return {
    kind: "mode",
    key: "mode",
    label: `Mode: ${availabilityLabel(availability)}`
  };
}

function availabilityLabel(
  availability: Exclude<BrowserAvailabilityFilter, "default" | "all">
): string {
  if (availability === "pve") {
    return "PvE";
  }
  if (availability === "pvp") {
    return "PvP";
  }
  if (availability === "both") {
    return "Both modes";
  }
  if (availability === "pve-only") {
    return "PvE only";
  }
  if (availability === "pvp-only") {
    return "PvP only";
  }
  return "Unknown";
}

function metadataTokenLabel(token: SkillMetadataToken): string {
  for (const group of SKILL_METADATA_FILTER_GROUPS) {
    const option = group.options.find((candidate) => candidate.token === token);
    if (option !== undefined) {
      return `${metadataGroupLabel(group.id)}: ${option.label}`;
    }
  }
  return token;
}

function metadataGroupLabel(groupId: (typeof SKILL_METADATA_FILTER_GROUPS)[number]["id"]): string {
  if (groupId === "applies") {
    return "Inflicts";
  }
  if (groupId === "removes") {
    return "Removes";
  }
  return "Deals";
}
