import type { Build } from "./build";
import type { CatalogSkillRecord, SkillProgressionSeries } from "./catalog";

export const TITLE_RANK_OVERRIDE_LIMIT = 32;

export interface TitleRankOverride {
  readonly key: string;
  readonly rank: number;
}

export interface TitleRankDomain {
  readonly min: number;
  readonly max: number;
}

export interface TitleRankDeclaredDomain extends TitleRankDomain {
  readonly rawKey: string;
  readonly seriesIds: readonly string[];
}

export type TitleRankDefaultKind = "coherent" | "alias-conflict" | "unsupported";

export type TitleRankDiagnosticCode =
  | "title.alias-domain-conflict"
  | "title.duplicate-row"
  | "title.invalid-domain"
  | "title.invalid-key"
  | "title.invalid-row"
  | "title.missing-domain"
  | "title.missing-exact-row"
  | "title.missing-key"
  | "title.row-gap"
  | "title.series-missing"
  | "title.stale-key";

export interface TitleRankDiagnostic {
  readonly code: TitleRankDiagnosticCode;
  readonly severity: "warning";
  readonly key: string | null;
  readonly rawKey: string | null;
  readonly seriesId: string | null;
  readonly message: string;
}

export interface TitleRankDefinition {
  readonly key: string;
  readonly label: string;
  readonly rawKeys: readonly string[];
  readonly seriesIds: readonly string[];
  readonly declaredDomains: readonly TitleRankDeclaredDomain[];
  readonly editableDomain: TitleRankDomain | null;
  readonly editableRanks: readonly number[];
  readonly implicitMaximums: readonly {
    readonly rawKey: string;
    readonly rank: number;
  }[];
  readonly defaultKind: TitleRankDefaultKind;
}

export interface TitleRankCatalog {
  readonly definitions: readonly TitleRankDefinition[];
  readonly byCanonicalKey: ReadonlyMap<string, TitleRankDefinition>;
  readonly canonicalKeyByRawKey: ReadonlyMap<string, string>;
  readonly definitionKeyBySeriesId: ReadonlyMap<string, string>;
  readonly seriesById: ReadonlyMap<string, SkillProgressionSeries>;
  readonly diagnostics: readonly TitleRankDiagnostic[];
}

export interface TitleRankOverrideMutationFacts {
  readonly key: string;
  readonly defaultKind: TitleRankDefaultKind;
  readonly editableRanks: readonly number[];
}

export interface TitleRankSkillDependencyResolution {
  readonly seriesId: string;
  readonly rawKey: string;
  readonly key: string;
  readonly label: string;
  readonly rank: number | null;
  readonly source: "implicit" | "override";
}

export interface TitleRankSkillResolution {
  readonly ranks: Readonly<Record<string, number>>;
  readonly dependencies: readonly TitleRankSkillDependencyResolution[];
  readonly diagnostics: readonly TitleRankDiagnostic[];
}

const TITLE_RANK_KEY_PATTERN = /^title:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RAW_ALIAS_TO_CANONICAL = new Map<string, string>([
  ["allegiance:kurzick", "title:allegiance-rank"],
  ["allegiance:luxon", "title:allegiance-rank"],
  ["title:sunspear", "title:sunspear-rank"],
  ["title:title-sunspear-rank", "title:sunspear-rank"]
]);
const LABELS = new Map<string, string>([
  ["title:allegiance-rank", "Allegiance"],
  ["title:asura-rank", "Asura"],
  ["title:deldrimor-rank", "Deldrimor"],
  ["title:ebon-vanguard-rank", "Ebon Vanguard"],
  ["title:lightbringer-rank", "Lightbringer"],
  ["title:norn-rank", "Norn"],
  ["title:sunspear-rank", "Sunspear"]
]);

interface SeriesFact {
  readonly series: SkillProgressionSeries;
  readonly rawKey: string;
  readonly key: string;
  readonly domain: TitleRankDomain | null;
  readonly rowRanks: readonly number[];
}

export function normalizeTitleRankKey(rawKey: string): string | null {
  const exact = RAW_ALIAS_TO_CANONICAL.get(rawKey);
  if (exact !== undefined) {
    return exact;
  }
  return isCanonicalTitleRankKey(rawKey) ? rawKey : null;
}

export function isCanonicalTitleRankKey(key: string): boolean {
  return key.length <= 80 && TITLE_RANK_KEY_PATTERN.test(key);
}

export function createTitleRankCatalog(
  progressionSeries: readonly SkillProgressionSeries[]
): TitleRankCatalog {
  const diagnostics: TitleRankDiagnostic[] = [];
  const seriesById = new Map<string, SkillProgressionSeries>();
  for (const series of progressionSeries) {
    seriesById.set(series.id, series);
  }

  const facts: SeriesFact[] = [];
  for (const series of progressionSeries) {
    if (series.dependency.kind !== "title-rank") {
      continue;
    }
    const fact = inspectTitleSeries(series, diagnostics);
    if (fact !== null) {
      facts.push(fact);
    }
  }

  const groups = new Map<string, SeriesFact[]>();
  for (const fact of facts) {
    const existing = groups.get(fact.key) ?? [];
    groups.set(fact.key, [...existing, fact]);
  }

  const definitions = [...groups.entries()]
    .sort(([left], [right]) => compareString(left, right))
    .map(([key, group]) => createDefinition(key, group, diagnostics));
  return {
    definitions,
    byCanonicalKey: new Map(definitions.map((definition) => [definition.key, definition])),
    canonicalKeyByRawKey: new Map(
      facts
        .map((fact) => [fact.rawKey, fact.key] as const)
        .sort(([left], [right]) => compareString(left, right))
    ),
    definitionKeyBySeriesId: new Map(
      facts
        .map((fact) => [fact.series.id, fact.key] as const)
        .sort(([left], [right]) => compareString(left, right))
    ),
    seriesById,
    diagnostics: diagnostics.sort(compareDiagnostics)
  };
}

export function setTitleRankOverride(
  build: Build,
  facts: TitleRankOverrideMutationFacts,
  rank: number
): Build {
  const key = normalizeTitleRankKey(facts.key);
  if (key === null || !Number.isSafeInteger(rank) || !facts.editableRanks.includes(rank)) {
    return build;
  }
  const maxEditableRank = Math.max(...facts.editableRanks);
  if (facts.defaultKind === "coherent" && rank === maxEditableRank) {
    return resetTitleRankOverride(build, key);
  }
  return withTitleRankOverrides(build, [
    ...build.titleRankOverrides.filter((override) => override.key !== key),
    { key, rank }
  ]);
}

export function resetTitleRankOverride(build: Build, key: string): Build {
  const canonicalKey = normalizeTitleRankKey(key);
  if (canonicalKey === null) {
    return build;
  }
  const next = build.titleRankOverrides.filter((override) => override.key !== canonicalKey);
  return next.length === build.titleRankOverrides.length
    ? build
    : withTitleRankOverrides(build, next);
}

export function hasAuthoredTitleRankOverrides(build: Build): boolean {
  return build.titleRankOverrides.length > 0;
}

export function titleRankOverrideFor(
  overrides: readonly TitleRankOverride[],
  key: string
): TitleRankOverride | null {
  const canonicalKey = normalizeTitleRankKey(key);
  if (canonicalKey === null) {
    return null;
  }
  return overrides.find((override) => override.key === canonicalKey) ?? null;
}

export function validateTitleRankOverridesAgainstCatalog(
  overrides: readonly TitleRankOverride[],
  catalog: TitleRankCatalog
): readonly TitleRankDiagnostic[] {
  const diagnostics: TitleRankDiagnostic[] = [];
  overrides.forEach((override) => {
    const definition = catalog.byCanonicalKey.get(override.key);
    if (definition === undefined) {
      diagnostics.push(
        diagnostic(
          "title.stale-key",
          override.key,
          override.key,
          null,
          `Title rank override ${override.key} is not present in the current catalog.`
        )
      );
      return;
    }
    if (!definition.editableRanks.includes(override.rank)) {
      diagnostics.push(
        diagnostic(
          "title.missing-exact-row",
          override.key,
          override.key,
          null,
          `${definition.label} rank ${override.rank} is not an editable exact catalog row.`
        )
      );
    }
  });
  return diagnostics;
}

export function resolveTitleRanksForSkill(input: {
  readonly catalog: TitleRankCatalog;
  readonly skill: CatalogSkillRecord;
  readonly overrides: readonly TitleRankOverride[];
}): TitleRankSkillResolution {
  const ranks: Record<string, number> = Object.create(null) as Record<string, number>;
  const dependencies: TitleRankSkillDependencyResolution[] = [];
  const diagnostics: TitleRankDiagnostic[] = [];
  const emittedAliasConflicts = new Set<string>();

  for (const seriesId of input.skill.progressionSeriesIds) {
    const series = input.catalog.seriesById.get(seriesId);
    if (series === undefined) {
      diagnostics.push(
        diagnostic(
          "title.series-missing",
          null,
          null,
          seriesId,
          `Progression series ${seriesId} was not present in the catalog.`
        )
      );
      continue;
    }
    if (series.dependency.kind !== "title-rank") {
      continue;
    }

    const rawKey = series.dependency.titleKey;
    if (rawKey === null) {
      diagnostics.push(
        diagnostic(
          "title.missing-key",
          null,
          null,
          series.id,
          `Progression ${series.id} is missing a title key.`
        )
      );
      continue;
    }
    const key = normalizeTitleRankKey(rawKey);
    if (key === null) {
      diagnostics.push(
        diagnostic(
          "title.invalid-key",
          null,
          rawKey,
          series.id,
          `Progression ${series.id} has unsupported title key ${rawKey}.`
        )
      );
      continue;
    }
    const definition = input.catalog.byCanonicalKey.get(key);
    const domain = validDomain(series.dependency.rankDomain);
    if (domain === null) {
      diagnostics.push(
        diagnostic(
          series.dependency.rankDomain === null ? "title.missing-domain" : "title.invalid-domain",
          key,
          rawKey,
          series.id,
          `Progression ${series.id} has no usable title rank domain.`
        )
      );
      continue;
    }
    if (
      definition !== undefined &&
      definition.defaultKind === "alias-conflict" &&
      !emittedAliasConflicts.has(key)
    ) {
      emittedAliasConflicts.add(key);
      diagnostics.push(
        diagnostic(
          "title.alias-domain-conflict",
          key,
          rawKey,
          series.id,
          `${definition.label} has conflicting catalog title domains; implicit ranks remain per progression series.`
        )
      );
    }

    const override = titleRankOverrideFor(input.overrides, key);
    const rank = override?.rank ?? domain.max;
    const source = override === null ? "implicit" : "override";
    const label = definition?.label ?? labelForTitleRankKey(key);

    if (override !== null && definition !== undefined && !definition.editableRanks.includes(rank)) {
      diagnostics.push(
        diagnostic(
          "title.missing-exact-row",
          key,
          rawKey,
          series.id,
          `${label} override rank ${rank} is not an exact common row for this title.`
        )
      );
      dependencies.push({ seriesId: series.id, rawKey, key, label, rank: null, source });
      continue;
    }
    if (!seriesHasRank(series, rank)) {
      diagnostics.push(
        diagnostic(
          "title.missing-exact-row",
          key,
          rawKey,
          series.id,
          `Progression ${series.id} has no exact row for ${label} rank ${rank}.`
        )
      );
      dependencies.push({ seriesId: series.id, rawKey, key, label, rank: null, source });
      continue;
    }
    ranks[rawKey] = rank;
    dependencies.push({ seriesId: series.id, rawKey, key, label, rank, source });
  }

  return {
    ranks,
    dependencies,
    diagnostics: diagnostics.sort(compareDiagnostics)
  };
}

export function labelForTitleRankKey(key: string): string {
  const known = LABELS.get(key);
  if (known !== undefined) {
    return known;
  }
  const slug = key.startsWith("title:") ? key.slice("title:".length) : key;
  return slug
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toLocaleUpperCase("en-US")}${part.slice(1)}`)
    .join(" ");
}

function inspectTitleSeries(
  series: SkillProgressionSeries,
  diagnostics: TitleRankDiagnostic[]
): SeriesFact | null {
  const rawKey = series.dependency.titleKey;
  if (rawKey === null) {
    diagnostics.push(
      diagnostic(
        "title.missing-key",
        null,
        null,
        series.id,
        `Progression ${series.id} is missing a title key.`
      )
    );
    return null;
  }
  const key = normalizeTitleRankKey(rawKey);
  if (key === null) {
    diagnostics.push(
      diagnostic(
        "title.invalid-key",
        null,
        rawKey,
        series.id,
        `Progression ${series.id} has unsupported title key ${rawKey}.`
      )
    );
    return null;
  }
  const domain = validDomain(series.dependency.rankDomain);
  if (domain === null) {
    diagnostics.push(
      diagnostic(
        series.dependency.rankDomain === null ? "title.missing-domain" : "title.invalid-domain",
        key,
        rawKey,
        series.id,
        `Progression ${series.id} has no usable title rank domain.`
      )
    );
  }
  const rowRanks = validRowRanks(series, key, rawKey, diagnostics);
  if (domain !== null) {
    addCoverageDiagnostics(series, key, rawKey, domain, rowRanks, diagnostics);
  }
  return { series, rawKey, key, domain, rowRanks };
}

function createDefinition(
  key: string,
  group: readonly SeriesFact[],
  diagnostics: TitleRankDiagnostic[]
): TitleRankDefinition {
  const rawKeys = uniqueSorted(group.map((fact) => fact.rawKey));
  const seriesIds = uniqueSorted(group.map((fact) => fact.series.id));
  const declaredDomains = declaredDomainsFor(group);
  const uniqueDomainKeys = new Set(declaredDomains.map(domainKey));
  const editableRanks = commonEditableRanks(group);
  const editableDomain = contiguousDomainFor(editableRanks);
  const hasDomainConflict = uniqueDomainKeys.size > 1;
  if (hasDomainConflict) {
    diagnostics.push(
      diagnostic(
        "title.alias-domain-conflict",
        key,
        rawKeys[0] ?? null,
        null,
        `${labelForTitleRankKey(key)} title definitions expose conflicting rank domains.`
      )
    );
  }

  return {
    key,
    label: labelForTitleRankKey(key),
    rawKeys,
    seriesIds,
    declaredDomains,
    editableDomain,
    editableRanks,
    implicitMaximums: implicitMaximumsFor(group),
    defaultKind:
      editableDomain === null ? "unsupported" : hasDomainConflict ? "alias-conflict" : "coherent"
  };
}

function declaredDomainsFor(group: readonly SeriesFact[]): readonly TitleRankDeclaredDomain[] {
  const byDomain = new Map<
    string,
    { rawKey: string; min: number; max: number; seriesIds: string[] }
  >();
  for (const fact of group) {
    if (fact.domain === null) {
      continue;
    }
    const key = `${fact.rawKey}:${domainKey(fact.domain)}`;
    const existing = byDomain.get(key);
    if (existing === undefined) {
      byDomain.set(key, {
        rawKey: fact.rawKey,
        min: fact.domain.min,
        max: fact.domain.max,
        seriesIds: [fact.series.id]
      });
    } else {
      existing.seriesIds.push(fact.series.id);
    }
  }
  return [...byDomain.values()]
    .map((domain) => ({
      rawKey: domain.rawKey,
      min: domain.min,
      max: domain.max,
      seriesIds: uniqueSorted(domain.seriesIds)
    }))
    .sort(
      (left, right) =>
        compareString(left.rawKey, right.rawKey) ||
        compareNumber(left.min, right.min) ||
        compareNumber(left.max, right.max)
    );
}

function commonEditableRanks(group: readonly SeriesFact[]): readonly number[] {
  const validFacts = group.filter((fact) => fact.domain !== null && fact.rowRanks.length > 0);
  if (validFacts.length !== group.length || validFacts.length === 0) {
    return [];
  }
  const [first, ...rest] = validFacts;
  if (first === undefined) {
    return [];
  }
  return first.rowRanks.filter((rank) => rest.every((fact) => fact.rowRanks.includes(rank)));
}

function implicitMaximumsFor(
  group: readonly SeriesFact[]
): readonly { readonly rawKey: string; readonly rank: number }[] {
  const byRawKey = new Map<string, number>();
  for (const fact of group) {
    if (fact.domain === null) {
      continue;
    }
    const current = byRawKey.get(fact.rawKey);
    byRawKey.set(
      fact.rawKey,
      current === undefined ? fact.domain.max : Math.max(current, fact.domain.max)
    );
  }
  return [...byRawKey.entries()]
    .map(([rawKey, rank]) => ({ rawKey, rank }))
    .sort((left, right) => compareString(left.rawKey, right.rawKey));
}

function validDomain(
  domain: SkillProgressionSeries["dependency"]["rankDomain"]
): TitleRankDomain | null {
  if (
    domain === null ||
    !Number.isSafeInteger(domain.min) ||
    !Number.isSafeInteger(domain.max) ||
    domain.min < 0 ||
    domain.max < domain.min
  ) {
    return null;
  }
  return { min: domain.min, max: domain.max };
}

function validRowRanks(
  series: SkillProgressionSeries,
  key: string,
  rawKey: string,
  diagnostics: TitleRankDiagnostic[]
): readonly number[] {
  const ranks: number[] = [];
  const seen = new Set<number>();
  for (const row of series.values) {
    if (!Number.isSafeInteger(row.rank) || !Array.isArray(row.values)) {
      diagnostics.push(
        diagnostic(
          "title.invalid-row",
          key,
          rawKey,
          series.id,
          `Progression ${series.id} contains an invalid title-rank row.`
        )
      );
      continue;
    }
    if (seen.has(row.rank)) {
      diagnostics.push(
        diagnostic(
          "title.duplicate-row",
          key,
          rawKey,
          series.id,
          `Progression ${series.id} contains duplicate title-rank row ${row.rank}.`
        )
      );
      continue;
    }
    seen.add(row.rank);
    ranks.push(row.rank);
  }
  return ranks.sort(compareNumber);
}

function addCoverageDiagnostics(
  series: SkillProgressionSeries,
  key: string,
  rawKey: string,
  domain: TitleRankDomain,
  rowRanks: readonly number[],
  diagnostics: TitleRankDiagnostic[]
): void {
  const rankSet = new Set(rowRanks);
  const missing: number[] = [];
  for (let rank = domain.min; rank <= domain.max; rank += 1) {
    if (!rankSet.has(rank)) {
      missing.push(rank);
    }
  }
  if (missing.length > 0) {
    diagnostics.push(
      diagnostic(
        "title.row-gap",
        key,
        rawKey,
        series.id,
        `Progression ${series.id} is missing ${missing.length} title-rank row${missing.length === 1 ? "" : "s"}.`
      )
    );
  }
  if (!rankSet.has(domain.max)) {
    diagnostics.push(
      diagnostic(
        "title.missing-exact-row",
        key,
        rawKey,
        series.id,
        `Progression ${series.id} has no exact row for its default maximum title rank.`
      )
    );
  }
}

function contiguousDomainFor(ranks: readonly number[]): TitleRankDomain | null {
  if (ranks.length === 0) {
    return null;
  }
  const min = ranks[0];
  const max = ranks[ranks.length - 1];
  if (min === undefined || max === undefined) {
    return null;
  }
  for (let rank = min; rank <= max; rank += 1) {
    if (!ranks.includes(rank)) {
      return null;
    }
  }
  return { min, max };
}

function seriesHasRank(series: SkillProgressionSeries, rank: number): boolean {
  return series.values.some((row) => row.rank === rank);
}

function withTitleRankOverrides(build: Build, overrides: readonly TitleRankOverride[]): Build {
  const titleRankOverrides = [...overrides]
    .map((override) => ({ key: override.key, rank: override.rank }))
    .sort(
      (left, right) => compareString(left.key, right.key) || compareNumber(left.rank, right.rank)
    );
  return { ...build, titleRankOverrides };
}

function domainKey(domain: TitleRankDomain): string {
  return `${domain.min}:${domain.max}`;
}

function diagnostic(
  code: TitleRankDiagnosticCode,
  key: string | null,
  rawKey: string | null,
  seriesId: string | null,
  message: string
): TitleRankDiagnostic {
  return {
    code,
    severity: "warning",
    key,
    rawKey,
    seriesId,
    message
  };
}

function compareDiagnostics(left: TitleRankDiagnostic, right: TitleRankDiagnostic): number {
  return (
    compareString(left.key ?? "", right.key ?? "") ||
    compareString(left.rawKey ?? "", right.rawKey ?? "") ||
    compareString(left.seriesId ?? "", right.seriesId ?? "") ||
    compareString(left.code, right.code) ||
    compareString(left.message, right.message)
  );
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareString);
}

function compareNumber(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareString(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
