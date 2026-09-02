import {
  attributeBudgetForLevel,
  calculateEffectiveAttributeRank,
  lookupSkillById,
  purchasedRankCost,
  renderSkillTooltipText,
  validateBuild,
  type AttributeBudgetPolicy,
  type AttributeId,
  type BuildValidationInput,
  type CatalogAttributeRecord,
  type CatalogSkillRecord,
  type SkillId,
  type SkillProgressionSeries,
  type SkillValueState,
  type ValidationIssue,
  type ValidationLocation,
  type ValidationResult
} from "../domain";
import type { AppCatalogViews, PlaceholderIconDescriptor } from "./catalogs";
import type {
  BrowserFilters,
  BrowserSortMode,
  EditorState,
  RawTemplateOverlayEntry,
  ResourceFilterKind,
  ResourceFilterValue
} from "./editor-state";
import type { PersistedCatalogFacts } from "./persistence-schema";
import { evaluateTemplateExport, type ExportWorkflowView } from "./template-workflow";

export interface AttributeBudgetView {
  readonly mode: "evaluated" | "not-evaluated" | "unresolved";
  readonly spend: number;
  readonly budget: number | null;
  readonly remaining: number | null;
  readonly policyLabel: string;
}

export interface AttributeEditorRowView {
  readonly key: string;
  readonly buildIndex: number | null;
  readonly attributeId: AttributeId | null;
  readonly attribute: CatalogAttributeRecord | null;
  readonly label: string;
  readonly professionLabel: string;
  readonly rank: number;
  readonly spend: number | null;
  readonly retained: boolean;
  readonly raw: RawTemplateOverlayEntry | null;
  readonly issues: readonly ValidationIssue[];
}

export interface AppDiagnostic {
  readonly severity: "warning" | "error";
  readonly location: string;
  readonly message: string;
}

export interface ValidationView {
  readonly input: BuildValidationInput;
  readonly result: ValidationResult;
  readonly appDiagnostics: readonly AppDiagnostic[];
  readonly exportPolicy: ExportWorkflowView;
}

export type CatalogFreshnessStatus = "fresh" | "stale" | "unknown";

export interface CatalogFreshnessView {
  readonly status: CatalogFreshnessStatus;
  readonly messages: readonly string[];
}

export interface SkillBrowserGroupView {
  readonly id: string;
  readonly label: string;
  readonly skills: readonly CatalogSkillRecord[];
}

export interface SkillBrowserView {
  readonly totalCount: number;
  readonly matchingCount: number;
  readonly renderedCount: number;
  readonly hasMore: boolean;
  readonly groups: readonly SkillBrowserGroupView[];
  readonly availableTypes: readonly string[];
  readonly availableAttributes: readonly CatalogAttributeRecord[];
}

export interface SkillFactView {
  readonly label: string;
  readonly value: string;
  readonly state: string;
}

export interface SkillProgressionSeriesView {
  readonly id: string;
  readonly dependencyLabel: string;
  readonly rows: readonly {
    readonly rank: number;
    readonly values: readonly string[];
  }[];
}

export type SkillDisplayView =
  | {
      readonly kind: "empty";
      readonly title: string;
      readonly subtitle: string;
      readonly placeholder: PlaceholderIconDescriptor;
      readonly raw: RawTemplateOverlayEntry | null;
    }
  | {
      readonly kind: "known";
      readonly skill: CatalogSkillRecord;
      readonly title: string;
      readonly subtitle: string;
      readonly placeholder: PlaceholderIconDescriptor;
      readonly facts: readonly SkillFactView[];
      readonly tooltipText: string;
      readonly tooltipState: "rendered" | "unresolved";
      readonly tooltipDetail: string | null;
      readonly progression: readonly SkillProgressionSeriesView[];
      readonly assumptions: readonly string[];
      readonly raw: RawTemplateOverlayEntry | null;
    }
  | {
      readonly kind: "unresolved";
      readonly title: string;
      readonly subtitle: string;
      readonly placeholder: PlaceholderIconDescriptor;
      readonly raw: RawTemplateOverlayEntry | null;
    };

export function selectValidationInput(
  state: EditorState,
  catalogs: AppCatalogViews
): BuildValidationInput {
  return {
    build: state.build,
    professionAttributes: catalogs.validation.professionAttributes,
    skills: catalogs.validation.skills,
    options: {
      profile: "editing",
      attributeBudget: selectAttributeBudgetPolicy(state)
    }
  };
}

export function selectValidationView(
  state: EditorState,
  catalogs: AppCatalogViews
): ValidationView {
  const input = selectValidationInput(state, catalogs);
  const result = validateBuild(input);
  const appDiagnostics = selectAppDiagnostics(state);
  return {
    input,
    result,
    appDiagnostics,
    exportPolicy: evaluateTemplateExport(state, catalogs, result)
  };
}

export function selectAttributeBudgetPolicy(state: EditorState): AttributeBudgetPolicy {
  if (state.build.mode !== "pve") {
    return { kind: "none" };
  }
  return {
    kind: "level",
    level: state.pveBudget.level,
    questBonus: state.pveBudget.questBonus
  };
}

export function selectCatalogFreshnessView(
  savedWith: PersistedCatalogFacts,
  currentFacts: PersistedCatalogFacts
): CatalogFreshnessView {
  const messages: string[] = [];
  compareCatalogFact(
    messages,
    "profession/attribute catalog",
    savedWith.professionAttributeCatalogVersion,
    currentFacts.professionAttributeCatalogVersion
  );
  compareCatalogFact(
    messages,
    "skill catalog",
    savedWith.skillCatalogVersion,
    currentFacts.skillCatalogVersion
  );
  compareCatalogFact(
    messages,
    "rule engine",
    savedWith.ruleEngineVersion,
    currentFacts.ruleEngineVersion
  );
  if (messages.some((message) => message.includes("unknown"))) {
    return { status: "unknown", messages };
  }
  return messages.length === 0
    ? { status: "fresh", messages: ["Catalog facts match current data."] }
    : { status: "stale", messages };
}

export function selectAttributeBudgetView(
  state: EditorState,
  catalogs: AppCatalogViews
): AttributeBudgetView {
  const spend = state.build.attributes.reduce((total, allocation) => {
    const cost = purchasedRankCost(catalogs.professionAttributeCatalog, allocation.rank);
    return cost === null ? total : total + cost;
  }, 0);
  if (state.build.mode !== "pve") {
    return {
      mode: "not-evaluated",
      spend,
      budget: null,
      remaining: null,
      policyLabel: "Attribute budget not evaluated for PvP or unknown mode."
    };
  }
  const budget = attributeBudgetForLevel(
    catalogs.professionAttributeCatalog,
    state.pveBudget.level,
    state.pveBudget.questBonus
  );
  return {
    mode: budget === null ? "unresolved" : "evaluated",
    spend,
    budget,
    remaining: budget === null ? null : budget - spend,
    policyLabel:
      state.pveBudget.questBonus === "maximum-applicable"
        ? `Level ${state.pveBudget.level} with maximum applicable quest bonus`
        : `Level ${state.pveBudget.level} without quest bonus`
  };
}

export function selectAttributeRows(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult
): readonly AttributeEditorRowView[] {
  const rows: AttributeEditorRowView[] = [];
  const includedAttributeIds = new Set<number>();
  const issuesByRow = issuesByAttributeRow(validation.issues);

  state.build.attributes.forEach((allocation, index) => {
    const attribute =
      catalogs.attributes.find(
        (candidate) => Number(candidate.id) === Number(allocation.attributeId)
      ) ?? null;
    if (attribute !== null) {
      includedAttributeIds.add(Number(attribute.id));
    }
    const raw = state.rawTemplate.attributes[index] ?? null;
    rows.push({
      key: `authored:${index}`,
      buildIndex: index,
      attributeId: attribute?.id ?? allocation.attributeId,
      attribute,
      label:
        attribute?.name ?? raw?.label ?? `Unresolved attribute ${Number(allocation.attributeId)}`,
      professionLabel: professionNameForAttribute(attribute, catalogs),
      rank: allocation.rank,
      spend: purchasedRankCost(catalogs.professionAttributeCatalog, allocation.rank),
      retained: attribute === null || !attributeBelongsToSelectedProfessions(attribute, state),
      raw,
      issues: issuesByRow.get(index) ?? []
    });
  });

  for (const attribute of normalAttributesForSelectedProfessions(state, catalogs)) {
    if (includedAttributeIds.has(Number(attribute.id))) {
      continue;
    }
    rows.push({
      key: `catalog:${Number(attribute.id)}`,
      buildIndex: null,
      attributeId: attribute.id,
      attribute,
      label: attribute.name,
      professionLabel: professionNameForAttribute(attribute, catalogs),
      rank: 0,
      spend: purchasedRankCost(catalogs.professionAttributeCatalog, 0),
      retained: false,
      raw: null,
      issues: []
    });
  }

  return rows;
}

export function selectSkillBrowser(
  state: EditorState,
  catalogs: AppCatalogViews
): SkillBrowserView {
  const playableSkills = catalogs.skills.filter(
    (skill) => !skill.classification.unsupported && !skill.classification.nonPlayer
  );
  const filters = state.browser.filters;
  const normalizedQuery = normalizeQuery(filters.query);
  const filtered = playableSkills
    .filter((skill) => matchesQuery(skill, normalizedQuery))
    .filter((skill) => matchesProfessionScope(skill, state, filters))
    .filter((skill) => matchesAttributeFilter(skill, filters.attributeId))
    .filter((skill) => matchesSkillType(skill, filters.skillType))
    .filter((skill) => matchesElite(skill, filters.elite))
    .filter((skill) => matchesAvailability(skill, state, filters.availability))
    .filter((skill) => matchesResourceFilters(skill, filters.resources));
  const ordered = sortSkills(filtered, filters.sortMode, catalogs);
  const bounded = ordered.slice(0, state.browser.batchSize);

  return {
    totalCount: playableSkills.length,
    matchingCount: ordered.length,
    renderedCount: bounded.length,
    hasMore: ordered.length > bounded.length,
    groups: groupSkills(bounded, filters.sortMode, catalogs),
    availableTypes: uniqueSorted(playableSkills.map((skill) => skill.type).filter(Boolean)),
    availableAttributes: catalogs.attributes
  };
}

export function selectSkillSlotDisplays(
  state: EditorState,
  catalogs: AppCatalogViews
): readonly SkillDisplayView[] {
  return state.build.skillBar.map((skillId, index) =>
    selectSkillDisplay(
      catalogs,
      state,
      skillId,
      "skill-bar",
      state.rawTemplate.skillBar[index] ?? null
    )
  );
}

export function selectSkillDisplay(
  catalogs: AppCatalogViews,
  state: EditorState,
  skillId: SkillId | null,
  surface: "skill-browser" | "skill-bar" | "tooltip",
  raw: RawTemplateOverlayEntry | null = null
): SkillDisplayView {
  if (skillId === null) {
    return {
      kind: "empty",
      title: "Empty",
      subtitle: raw?.label ?? "No skill selected",
      placeholder: catalogs.placeholders.skill(null, surface),
      raw
    };
  }
  const skill = lookupSkillById(catalogs.skillCatalog, skillId);
  if (skill === null) {
    return {
      kind: "unresolved",
      title: raw?.label ?? `Unresolved skill ${Number(skillId)}`,
      subtitle: raw?.reason ?? "Skill ID is not resolved in the promoted catalog.",
      placeholder: catalogs.placeholders.skill(null, surface),
      raw
    };
  }

  const rankContext = selectTooltipRankContext(state, catalogs, skill);
  const tooltip = renderSkillTooltipText(catalogs.skillCatalog, skill.id, {
    mode: state.build.mode,
    ranks: rankContext.ranks
  });
  return {
    kind: "known",
    skill,
    title: skill.name,
    subtitle: subtitleForSkill(skill, catalogs),
    placeholder: catalogs.placeholders.skill(skill, surface),
    facts: [...costFacts(skill), ...timingFacts(skill)],
    tooltipText: tooltip.kind === "rendered" ? tooltip.text : tooltip.detail,
    tooltipState: tooltip.kind,
    tooltipDetail: tooltip.kind === "rendered" ? null : tooltip.detail,
    progression: progressionViews(skill, catalogs),
    assumptions: rankContext.assumptions,
    raw
  };
}

export function selectAppDiagnostics(state: EditorState): readonly AppDiagnostic[] {
  const diagnostics: AppDiagnostic[] = [];
  addRawDiagnostic(diagnostics, "primary profession", state.rawTemplate.primaryProfession);
  addRawDiagnostic(diagnostics, "secondary profession", state.rawTemplate.secondaryProfession);
  state.rawTemplate.attributes.forEach((entry, index) =>
    addRawDiagnostic(diagnostics, `attribute row ${index + 1}`, entry)
  );
  state.rawTemplate.skillBar.forEach((entry, index) =>
    addRawDiagnostic(diagnostics, `skill slot ${index + 1}`, entry)
  );
  return diagnostics;
}

export function issuesForLocation(
  issues: readonly ValidationIssue[],
  location: ValidationLocation
): readonly ValidationIssue[] {
  return issues.filter((issue) => sameLocation(issue.location, location));
}

function selectTooltipRankContext(
  state: EditorState,
  catalogs: AppCatalogViews,
  skill: CatalogSkillRecord
): {
  readonly ranks: Readonly<Record<string, number>>;
  readonly assumptions: readonly string[];
} {
  const ranks: Record<string, number> = {};
  const assumptions: string[] = [];
  for (const seriesId of skill.progressionSeriesIds) {
    const series = catalogs.skillCatalog.progressionSeries.find(
      (candidate) => candidate.id === seriesId
    );
    if (series === undefined) {
      continue;
    }
    if (series.dependency.kind === "attribute" && series.dependency.attributeId !== null) {
      const result = calculateEffectiveAttributeRank({
        build: state.build,
        professionAttributes: catalogs.validation.professionAttributes,
        attributeId: series.dependency.attributeId
      });
      ranks[`attribute:${Number(series.dependency.attributeId)}`] =
        result.kind === "resolved" ? result.finalRank : 0;
    }
    if (series.dependency.kind === "title-rank" && series.dependency.titleKey !== null) {
      const rank = series.dependency.rankDomain?.max ?? 0;
      ranks[series.dependency.titleKey] = rank;
      const assumption = `${series.dependency.titleKey} shown at maximum title rank ${rank}.`;
      if (!assumptions.includes(assumption)) {
        assumptions.push(assumption);
      }
    }
  }
  return { ranks, assumptions };
}

function progressionViews(
  skill: CatalogSkillRecord,
  catalogs: AppCatalogViews
): readonly SkillProgressionSeriesView[] {
  return skill.progressionSeriesIds.flatMap((seriesId) => {
    const series = catalogs.skillCatalog.progressionSeries.find(
      (candidate) => candidate.id === seriesId
    );
    return series === undefined
      ? []
      : [
          {
            id: series.id,
            dependencyLabel: dependencyLabel(series),
            rows: series.values.map((row) => ({
              rank: row.rank,
              values: row.values.map((value, index) => {
                const slot = series.valueSlots[index];
                const suffix =
                  slot?.unit === null || slot?.unit === undefined ? "" : ` ${slot.unit}`;
                return `${slot?.label ?? `Value ${index + 1}`}: ${value}${suffix}`;
              })
            }))
          }
        ];
  });
}

function dependencyLabel(series: SkillProgressionSeries): string {
  if (series.dependency.kind === "attribute" && series.dependency.attributeId !== null) {
    return `Attribute ${Number(series.dependency.attributeId)}`;
  }
  if (series.dependency.kind === "title-rank" && series.dependency.titleKey !== null) {
    return `${series.dependency.titleKey} maximum-title-rank assumption`;
  }
  return series.dependency.kind;
}

function costFacts(skill: CatalogSkillRecord): readonly SkillFactView[] {
  return skillValueFacts("Cost", [
    ["Energy", skill.costs.energy],
    ["Adrenaline", skill.costs.adrenaline],
    ["Sacrifice", skill.costs.sacrifice],
    ["Upkeep", skill.costs.upkeep],
    ["Overcast", skill.costs.overcast]
  ]);
}

function timingFacts(skill: CatalogSkillRecord): readonly SkillFactView[] {
  return skillValueFacts("Timing", [
    ["Activation", skill.timings.activation],
    ["Recharge", skill.timings.recharge],
    ["Morale recharge", skill.timings.moraleBoostRecharge]
  ]);
}

function skillValueFacts(
  prefix: string,
  values: readonly (readonly [string, SkillValueState])[]
): readonly SkillFactView[] {
  return values
    .filter(([, state]) => state.state !== "absent" && state.state !== "not-applicable")
    .map(([label, state]) => ({
      label: `${prefix}: ${label}`,
      value: state.text ?? (state.value === null ? state.state : String(state.value)),
      state: state.state
    }));
}

function normalAttributesForSelectedProfessions(
  state: EditorState,
  catalogs: AppCatalogViews
): readonly CatalogAttributeRecord[] {
  const selected = selectedProfessionIds(state);
  if (selected.size === 0) {
    return [];
  }
  return catalogs.attributes
    .filter((attribute) => selected.has(Number(attribute.professionId)))
    .sort((left, right) => {
      if (left.isPrimaryOnly !== right.isPrimaryOnly) {
        return left.isPrimaryOnly ? -1 : 1;
      }
      return left.name.localeCompare(right.name, "en-US");
    });
}

function attributeBelongsToSelectedProfessions(
  attribute: CatalogAttributeRecord,
  state: EditorState
): boolean {
  return selectedProfessionIds(state).has(Number(attribute.professionId));
}

function selectedProfessionIds(state: EditorState): ReadonlySet<number> {
  const selected = new Set<number>();
  if (state.build.primaryProfessionId !== null) {
    selected.add(Number(state.build.primaryProfessionId));
  }
  if (state.build.secondaryProfessionId !== null) {
    selected.add(Number(state.build.secondaryProfessionId));
  }
  return selected;
}

function compareCatalogFact(
  messages: string[],
  label: string,
  saved: string | null,
  current: string | null
): void {
  if (saved === null || current === null) {
    messages.push(`${label} freshness is unknown.`);
    return;
  }
  if (saved !== current) {
    messages.push(`${label} changed from ${saved} to ${current}.`);
  }
}

function professionNameForAttribute(
  attribute: CatalogAttributeRecord | null,
  catalogs: AppCatalogViews
): string {
  if (attribute === null) {
    return "Unresolved";
  }
  return (
    catalogs.professions.find(
      (profession) => Number(profession.id) === Number(attribute.professionId)
    )?.name ?? "Unknown profession"
  );
}

function issuesByAttributeRow(
  issues: readonly ValidationIssue[]
): ReadonlyMap<number, ValidationIssue[]> {
  const byRow = new Map<number, ValidationIssue[]>();
  for (const issue of issues) {
    if (issue.location?.kind !== "attribute-row") {
      continue;
    }
    const existing = byRow.get(issue.location.index) ?? [];
    byRow.set(issue.location.index, [...existing, issue]);
  }
  return byRow;
}

function matchesQuery(skill: CatalogSkillRecord, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }
  const normalizedName = normalizeQuery(skill.normalizedName || skill.name);
  return normalizedName.includes(normalizedQuery);
}

function matchesProfessionScope(
  skill: CatalogSkillRecord,
  state: EditorState,
  filters: BrowserFilters
): boolean {
  if (filters.professionScope.kind === "all") {
    return true;
  }
  if (filters.professionScope.kind === "profession") {
    return (
      skill.professionId === null ||
      Number(skill.professionId) === Number(filters.professionScope.professionId)
    );
  }
  const selected = selectedProfessionIds(state);
  return (
    selected.size === 0 || skill.professionId === null || selected.has(Number(skill.professionId))
  );
}

function matchesAttributeFilter(
  skill: CatalogSkillRecord,
  attributeId: AttributeId | null
): boolean {
  return (
    attributeId === null ||
    (skill.attributeId !== null && Number(skill.attributeId) === Number(attributeId))
  );
}

function matchesSkillType(skill: CatalogSkillRecord, skillType: string | null): boolean {
  return skillType === null || skill.type === skillType;
}

function matchesElite(skill: CatalogSkillRecord, elite: BrowserFilters["elite"]): boolean {
  if (elite === "any") {
    return true;
  }
  return elite === "elite" ? skill.classification.elite : !skill.classification.elite;
}

function matchesAvailability(
  skill: CatalogSkillRecord,
  state: EditorState,
  availability: BrowserFilters["availability"]
): boolean {
  const skillAvailability = skill.classification.modeAvailability;
  if (availability !== "default") {
    return skillAvailability === availability;
  }
  if (state.build.mode === "pve") {
    return skillAvailability === "both" || skillAvailability === "pve-only";
  }
  if (state.build.mode === "pvp") {
    return skillAvailability === "both" || skillAvailability === "pvp-only";
  }
  return true;
}

function matchesResourceFilters(
  skill: CatalogSkillRecord,
  filters: Readonly<Record<ResourceFilterKind, ResourceFilterValue>>
): boolean {
  return (Object.keys(filters) as ResourceFilterKind[]).every((resource) => {
    const filter = filters[resource];
    if (filter === "any") {
      return true;
    }
    const state = skill.costs[resource].state;
    if (filter === "explicit") {
      return (
        state === "zero" || state === "number" || state === "percentage" || state === "special"
      );
    }
    return state === filter;
  });
}

function sortSkills(
  skills: readonly CatalogSkillRecord[],
  sortMode: BrowserSortMode,
  catalogs: AppCatalogViews
): readonly CatalogSkillRecord[] {
  return [...skills].sort((left, right) => {
    const primary = primarySortKey(left, sortMode, catalogs).localeCompare(
      primarySortKey(right, sortMode, catalogs),
      "en-US"
    );
    if (primary !== 0) {
      return primary;
    }
    const name = normalizeQuery(left.normalizedName || left.name).localeCompare(
      normalizeQuery(right.normalizedName || right.name),
      "en-US"
    );
    if (name !== 0) {
      return name;
    }
    return Number(left.id) - Number(right.id);
  });
}

function primarySortKey(
  skill: CatalogSkillRecord,
  sortMode: BrowserSortMode,
  catalogs: AppCatalogViews
): string {
  if (sortMode === "name") {
    return "";
  }
  if (sortMode === "type") {
    return skill.type;
  }
  if (skill.attributeId === null) {
    return "zz:no-attribute";
  }
  return (
    catalogs.attributes.find((attribute) => Number(attribute.id) === Number(skill.attributeId))
      ?.name ?? "zz:unknown-attribute"
  );
}

function groupSkills(
  skills: readonly CatalogSkillRecord[],
  sortMode: BrowserSortMode,
  catalogs: AppCatalogViews
): readonly SkillBrowserGroupView[] {
  if (sortMode === "name") {
    return [{ id: "all", label: "All skills", skills }];
  }
  const groups = new Map<string, CatalogSkillRecord[]>();
  for (const skill of skills) {
    const label =
      sortMode === "type" ? skill.type || "Unknown type" : attributeGroupLabel(skill, catalogs);
    const existing = groups.get(label) ?? [];
    groups.set(label, [...existing, skill]);
  }
  return [...groups.entries()].map(([label, groupSkills]) => ({
    id: normalizeQuery(label) || "unknown",
    label,
    skills: groupSkills
  }));
}

function attributeGroupLabel(skill: CatalogSkillRecord, catalogs: AppCatalogViews): string {
  if (skill.attributeId === null) {
    return "No attribute";
  }
  return (
    catalogs.attributes.find((attribute) => Number(attribute.id) === Number(skill.attributeId))
      ?.name ?? "Unknown attribute"
  );
}

function subtitleForSkill(skill: CatalogSkillRecord, catalogs: AppCatalogViews): string {
  const profession =
    skill.professionId === null
      ? "No profession"
      : (catalogs.professions.find((entry) => Number(entry.id) === Number(skill.professionId))
          ?.name ?? "Unknown profession");
  const attribute =
    skill.attributeId === null
      ? "No attribute"
      : (catalogs.attributes.find((entry) => Number(entry.id) === Number(skill.attributeId))
          ?.name ?? "Unknown attribute");
  const elite = skill.classification.elite ? "Elite" : "Non-elite";
  return `${skill.type} - ${profession} - ${attribute} - ${elite} - ${skill.classification.modeAvailability}`;
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "en-US"));
}

function addRawDiagnostic(
  diagnostics: AppDiagnostic[],
  location: string,
  entry: RawTemplateOverlayEntry | null
): void {
  if (
    entry === null ||
    entry.outcomeKind === "known" ||
    entry.outcomeKind === "none" ||
    entry.outcomeKind === "empty"
  ) {
    return;
  }
  diagnostics.push({
    severity: entry.outcomeKind === "unknown" ? "warning" : "error",
    location,
    message: `Imported ${location} preserved ${entry.outcomeKind} template ${entry.templateId}: ${
      entry.reason ?? entry.label
    }`
  });
}

function sameLocation(left: ValidationLocation | null, right: ValidationLocation): boolean {
  if (left === null || left.kind !== right.kind) {
    return false;
  }
  if (left.kind === "attribute-row" && right.kind === "attribute-row") {
    return left.index === right.index;
  }
  if (left.kind === "skill-slot" && right.kind === "skill-slot") {
    return left.index === right.index;
  }
  if (left.kind === "profession" && right.kind === "profession") {
    return left.field === right.field;
  }
  if (left.kind === "catalog" && right.kind === "catalog") {
    return left.catalog === right.catalog;
  }
  return left.kind === right.kind;
}

function normalizeQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}
