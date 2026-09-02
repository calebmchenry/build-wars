import type { GameMode, ProfessionId } from "../domain";
import type { AppCatalogViews } from "./catalogs";
import { selectCatalogFreshnessView, selectValidationView } from "./editor-selectors";
import {
  hydrateEditorFromSnapshot,
  type PersistedCatalogFacts,
  type PersistedSavedBuildRecord
} from "./persistence-schema";
import type { LibrarySortMode, WorkspaceLibraryState } from "./workspace-state";

export type FreshnessState = "fresh" | "stale" | "unknown";
export type ValidationState = "valid" | "invalid";
export type ResolutionState = "resolved" | "unresolved";

export interface LibraryFilters {
  readonly query: string;
  readonly professionFilter: ProfessionId | null;
  readonly modeFilter: GameMode | "all";
  readonly favoriteOnly: boolean;
  readonly tagFilter: string | null;
  readonly sortMode: LibrarySortMode;
}

export interface LibraryDiagnostics {
  readonly freshness: FreshnessState;
  readonly validation: ValidationState;
  readonly resolution: ResolutionState;
  readonly validationIssueCount: number;
  readonly summary: string;
}

export interface LibraryRecordRow {
  readonly id: string;
  readonly record: PersistedSavedBuildRecord;
  readonly name: string;
  readonly professionPair: string;
  readonly mode: GameMode;
  readonly modeLabel: string;
  readonly updatedLabel: string;
  readonly favorite: boolean;
  readonly tags: readonly string[];
  readonly notesPreview: string | null;
  readonly skillNames: readonly string[];
  readonly rawSkillLabels: readonly string[];
  readonly diagnostics: LibraryDiagnostics;
}

export interface LibraryFacets {
  readonly tags: readonly string[];
  readonly professions: readonly { readonly id: ProfessionId; readonly name: string }[];
  readonly modes: readonly (GameMode | "all")[];
}

export interface LibraryView {
  readonly totalCount: number;
  readonly matchingCount: number;
  readonly rows: readonly LibraryRecordRow[];
  readonly facets: LibraryFacets;
  readonly emptyState: "empty-library" | "no-results" | null;
}

export function filtersFromLibraryState(library: WorkspaceLibraryState): LibraryFilters {
  return {
    query: library.query,
    professionFilter: library.professionFilter,
    modeFilter: library.modeFilter,
    favoriteOnly: library.favoriteOnly,
    tagFilter: library.tagFilter,
    sortMode: library.sortMode
  };
}

export function selectLibraryView(
  records: readonly PersistedSavedBuildRecord[],
  catalogs: AppCatalogViews,
  filters: LibraryFilters,
  currentFacts: PersistedCatalogFacts
): LibraryView {
  const rows = records.map((record) => summarizeLibraryRecord(record, catalogs, currentFacts));
  const filtered = rows
    .filter((row) => matchesQuery(row, filters.query))
    .filter((row) => matchesProfession(row, filters.professionFilter))
    .filter((row) => filters.modeFilter === "all" || row.mode === filters.modeFilter)
    .filter((row) => !filters.favoriteOnly || row.favorite)
    .filter((row) => filters.tagFilter === null || hasTag(row, filters.tagFilter));
  const ordered = sortRows(filtered, filters.sortMode);

  return {
    totalCount: rows.length,
    matchingCount: ordered.length,
    rows: ordered,
    facets: selectLibraryFacets(rows, catalogs),
    emptyState: rows.length === 0 ? "empty-library" : ordered.length === 0 ? "no-results" : null
  };
}

export function summarizeLibraryRecord(
  record: PersistedSavedBuildRecord,
  catalogs: AppCatalogViews,
  currentFacts: PersistedCatalogFacts
): LibraryRecordRow {
  const validation = selectValidationView(
    hydrateEditorFromSnapshot(record.snapshot),
    catalogs
  ).result;
  const skillNames = record.snapshot.build.skillBar.flatMap((skillId) => {
    if (skillId === null) {
      return [];
    }
    const skill = catalogs.skills.find((candidate) => Number(candidate.id) === Number(skillId));
    return skill === undefined ? [] : [skill.name];
  });
  const rawSkillLabels = record.snapshot.rawTemplate.skillBar.flatMap((entry) =>
    entry === null ? [] : [entry.label]
  );
  const diagnostics: LibraryDiagnostics = {
    freshness: selectCatalogFreshnessView(record.savedWith, currentFacts).status,
    validation: validation.valid ? "valid" : "invalid",
    resolution: validation.resolved ? "resolved" : "unresolved",
    validationIssueCount: validation.counts.total,
    summary: diagnosticSummary(
      validation.valid,
      validation.resolved,
      selectCatalogFreshnessView(record.savedWith, currentFacts).status
    )
  };

  return {
    id: record.id,
    record,
    name: record.name,
    professionPair: professionPair(record, catalogs),
    mode: record.snapshot.build.mode,
    modeLabel: record.snapshot.build.mode.toUpperCase(),
    updatedLabel: formatTimestamp(record.updatedAt),
    favorite: record.favorite,
    tags: record.tags,
    notesPreview: record.notes === null ? null : record.notes.slice(0, 160),
    skillNames,
    rawSkillLabels,
    diagnostics
  };
}

export function selectLibraryFacets(
  rows: readonly LibraryRecordRow[],
  catalogs: AppCatalogViews
): LibraryFacets {
  const usedProfessions = new Set<number>();
  rows.forEach((row) => {
    const build = row.record.snapshot.build;
    if (build.primaryProfessionId !== null) {
      usedProfessions.add(Number(build.primaryProfessionId));
    }
    if (build.secondaryProfessionId !== null) {
      usedProfessions.add(Number(build.secondaryProfessionId));
    }
  });

  return {
    tags: uniqueSorted(rows.flatMap((row) => row.tags)),
    professions: catalogs.professions
      .filter((profession) => usedProfessions.has(Number(profession.id)))
      .map((profession) => ({ id: profession.id, name: profession.name })),
    modes: ["all", "pve", "pvp", "unknown"]
  };
}

export function freshnessState(
  savedWith: PersistedCatalogFacts,
  currentFacts: PersistedCatalogFacts
): FreshnessState {
  return selectCatalogFreshnessView(savedWith, currentFacts).status;
}

function matchesQuery(row: LibraryRecordRow, query: string): boolean {
  const normalized = normalize(query);
  if (normalized.length === 0) {
    return true;
  }
  return [
    row.name,
    row.professionPair,
    row.modeLabel,
    row.notesPreview ?? "",
    ...row.tags,
    ...row.skillNames,
    ...row.rawSkillLabels
  ]
    .map(normalize)
    .some((value) => value.includes(normalized));
}

function matchesProfession(row: LibraryRecordRow, professionFilter: ProfessionId | null): boolean {
  if (professionFilter === null) {
    return true;
  }
  const build = row.record.snapshot.build;
  return (
    Number(build.primaryProfessionId) === Number(professionFilter) ||
    Number(build.secondaryProfessionId) === Number(professionFilter)
  );
}

function hasTag(row: LibraryRecordRow, tagFilter: string): boolean {
  const normalized = normalize(tagFilter);
  return row.tags.some((tag) => normalize(tag) === normalized);
}

function sortRows(
  rows: readonly LibraryRecordRow[],
  sortMode: LibrarySortMode
): readonly LibraryRecordRow[] {
  return [...rows].sort((left, right) => {
    switch (sortMode) {
      case "updated-desc":
        return (
          compareTimestampDesc(left.record.updatedAt, right.record.updatedAt) ||
          compareNormalizedName(left, right) ||
          compareId(left, right)
        );
      case "name-asc":
        return (
          compareNormalizedName(left, right) ||
          compareTimestampDesc(left.record.updatedAt, right.record.updatedAt) ||
          compareId(left, right)
        );
      case "profession-asc":
        return (
          left.professionPair.localeCompare(right.professionPair, "en-US") ||
          compareNormalizedName(left, right) ||
          compareTimestampDesc(left.record.updatedAt, right.record.updatedAt) ||
          compareId(left, right)
        );
    }
  });
}

function professionPair(record: PersistedSavedBuildRecord, catalogs: AppCatalogViews): string {
  const build = record.snapshot.build;
  return [
    professionName(
      build.primaryProfessionId,
      record.snapshot.rawTemplate.primaryProfession?.label,
      catalogs
    ),
    professionName(
      build.secondaryProfessionId,
      record.snapshot.rawTemplate.secondaryProfession?.label,
      catalogs
    )
  ].join(" / ");
}

function professionName(
  professionId: ProfessionId | null,
  rawLabel: string | undefined,
  catalogs: AppCatalogViews
): string {
  if (professionId === null) {
    return rawLabel ?? "None";
  }
  return (
    catalogs.professions.find((profession) => Number(profession.id) === Number(professionId))
      ?.name ??
    rawLabel ??
    `Unresolved profession ${Number(professionId)}`
  );
}

function diagnosticSummary(valid: boolean, resolved: boolean, freshness: FreshnessState): string {
  return [
    freshness === "fresh"
      ? "fresh catalogs"
      : freshness === "stale"
        ? "stale catalogs"
        : "unknown freshness",
    valid ? "valid" : "invalid",
    resolved ? "resolved" : "unresolved"
  ].join(", ");
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  const byKey = new Map<string, string>();
  values.forEach((value) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return;
    }
    const key = normalize(trimmed);
    if (!byKey.has(key)) {
      byKey.set(key, trimmed);
    }
  });
  return [...byKey.values()].sort((left, right) => left.localeCompare(right, "en-US"));
}

function compareTimestampDesc(left: string, right: string): number {
  return Date.parse(right) - Date.parse(left);
}

function compareNormalizedName(left: LibraryRecordRow, right: LibraryRecordRow): number {
  return normalize(left.name).localeCompare(normalize(right.name), "en-US");
}

function compareId(left: LibraryRecordRow, right: LibraryRecordRow): number {
  return left.id.localeCompare(right.id, "en-US");
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}
