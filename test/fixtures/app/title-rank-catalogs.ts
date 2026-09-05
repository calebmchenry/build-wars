import {
  catalogId,
  templateSkillId,
  type CatalogFieldProvenance,
  type CatalogSkillRecord,
  type ProfessionId,
  type SkillCatalog,
  type SkillId,
  type SkillProgressionSeries
} from "../../../src/domain";
import skillCatalogJson from "../../../data/generated/epic-04/skills.catalog.json";
import {
  loadAppCatalogs,
  requireReadyCatalogs,
  type AppCatalogViews
} from "../../../src/app/catalogs";

export const titleRankTestSkillIds = {
  lightbringer: catalogId<"Skill">(1815),
  asura: catalogId<"Skill">(2224),
  luxon: catalogId<"Skill">(19001),
  kurzick: catalogId<"Skill">(19002)
} as const;

const provenance = {
  sourceIds: ["test:title-rank-catalog"],
  claimIds: ["claim:test:title-rank-catalog"],
  reviewIds: [],
  notes: "Synthetic title-rank app test fixture."
} satisfies CatalogFieldProvenance;

export function requireTitleRankTestCatalogs(): AppCatalogViews {
  return requireReadyCatalogs(loadAppCatalogs({ skills: titleRankSkillCatalog() }));
}

function titleRankSkillCatalog(): SkillCatalog {
  const base = skillCatalogJson as unknown as SkillCatalog;
  const lightbringer = titleSkill({
    base: base.skills[0],
    id: titleRankTestSkillIds.lightbringer,
    name: "Lightbringer Signet",
    seriesId: "progression:test:lightbringer-rank",
    titleKey: "title:lightbringer-rank",
    rankMax: 12
  });
  const asura = titleSkill({
    base: base.skills[0],
    id: titleRankTestSkillIds.asura,
    name: "Summon Mursaat",
    seriesId: "progression:test:asura-rank",
    titleKey: "title:asura-rank",
    rankMax: 10
  });
  const luxon = titleSkill({
    base: base.skills[0],
    id: titleRankTestSkillIds.luxon,
    name: "Luxon Allegiance Fixture",
    seriesId: "progression:test:luxon-rank",
    titleKey: "allegiance:luxon",
    rankMax: 12,
    professionId: catalogId<"Profession">(1) as ProfessionId
  });
  const kurzick = titleSkill({
    base: base.skills[0],
    id: titleRankTestSkillIds.kurzick,
    name: "Kurzick Allegiance Fixture",
    seriesId: "progression:test:kurzick-rank",
    titleKey: "allegiance:kurzick",
    rankMax: 12,
    professionId: catalogId<"Profession">(9) as ProfessionId
  });

  return {
    ...base,
    catalogVersion: `${base.catalogVersion}+title-rank-tests`,
    sourceSet: {
      ...base.sourceSet,
      acceptedSeedCount: base.sourceSet.acceptedSeedCount + 4,
      catalogRecordCount: base.sourceSet.catalogRecordCount + 4
    },
    skills: [...base.skills, lightbringer.record, asura.record, luxon.record, kurzick.record],
    progressionSeries: [
      ...base.progressionSeries,
      lightbringer.series,
      asura.series,
      luxon.series,
      kurzick.series
    ]
  };
}

function titleSkill(input: {
  readonly base: CatalogSkillRecord | undefined;
  readonly id: SkillId;
  readonly name: string;
  readonly seriesId: string;
  readonly titleKey: string;
  readonly rankMax: number;
  readonly professionId?: ProfessionId | null;
}): {
  readonly record: CatalogSkillRecord;
  readonly series: SkillProgressionSeries;
} {
  if (input.base === undefined) {
    throw new Error("Promoted skill catalog did not include a base record for test cloning.");
  }
  const record = {
    ...input.base,
    id: input.id,
    templateId: templateSkillId(Number(input.id)),
    name: input.name,
    normalizedName: input.name.toLocaleLowerCase("en-US"),
    wikiUrl: `https://wiki.guildwars.com/wiki/${input.name.replace(/\s+/g, "_")}`,
    pageIdentity: {
      ...input.base.pageIdentity,
      requestedTitle: input.name,
      normalizedTitle: input.name,
      canonicalTitle: input.name,
      pageId: Number(input.id),
      revisionId: Number(input.id)
    },
    campaign: "eye-of-the-north",
    professionId: input.professionId ?? null,
    attributeId: null,
    type: "Signet",
    typeId: "signet",
    classification: {
      ...input.base.classification,
      common: false,
      title: true,
      special: false,
      noAttribute: true,
      pveOnly: true,
      pvpOnly: false,
      unsupported: false,
      nonPlayer: false,
      modeAvailability: "pve-only"
    },
    progressionSeriesIds: [input.seriesId],
    iconId: null,
    provenance
  } satisfies CatalogSkillRecord;

  return {
    record,
    series: {
      id: input.seriesId,
      skillId: input.id,
      dependency: {
        kind: "title-rank",
        attributeId: null,
        titleKey: input.titleKey,
        mode: null,
        rankDomain: { min: 0, max: input.rankMax }
      },
      valueSlots: [{ index: 0, label: "Duration", unit: "seconds" }],
      values: Array.from({ length: input.rankMax + 1 }, (_, rank) => ({
        rank,
        values: [rank]
      })),
      sourceForm: "synthetic title-rank test progression",
      provenance
    }
  };
}
