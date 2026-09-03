import { describe, expect, it } from "vitest";

import generatedSkills from "../../data/generated/epic-04/skills.catalog.json";
import {
  createTitleRankCatalog,
  resetTitleRankOverride,
  resolveTitleRanksForSkill,
  setTitleRankOverride,
  type Build,
  type CatalogFieldProvenance,
  type CatalogSkillRecord,
  type SkillProgressionSeries
} from "../../src/domain";
import { buildFixture } from "../fixtures/rule-engine/builds";
import { skill, skillIds } from "../fixtures/rule-engine/catalogs";

const provenance = {
  sourceIds: ["fixture:title-rank"],
  claimIds: ["claim:fixture:title-rank"],
  reviewIds: [],
  notes: "Title rank fixture."
} satisfies CatalogFieldProvenance;

describe("title rank catalog", () => {
  it("discovers promoted PvE title definitions and the Sunspear domain conflict", () => {
    const catalog = createTitleRankCatalog(
      (
        generatedSkills as unknown as {
          readonly progressionSeries: readonly SkillProgressionSeries[];
        }
      ).progressionSeries
    );
    const sunspear = catalog.byCanonicalKey.get("title:sunspear-rank");

    expect(catalog.definitions.map((definition) => definition.key)).toEqual([
      "title:allegiance-rank",
      "title:asura-rank",
      "title:deldrimor-rank",
      "title:ebon-vanguard-rank",
      "title:lightbringer-rank",
      "title:norn-rank",
      "title:sunspear-rank"
    ]);
    expect(sunspear).toMatchObject({
      label: "Sunspear",
      defaultKind: "alias-conflict",
      editableDomain: { min: 0, max: 10 }
    });
    expect(
      sunspear?.declaredDomains.map((domain) => `${domain.rawKey}:${domain.min}-${domain.max}`)
    ).toEqual(["title:sunspear-rank:0-10", "title:sunspear-rank:0-12", "title:sunspear-rank:0-15"]);
    expect(catalog.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      "title.alias-domain-conflict"
    );
  });

  it("is deterministic under reordered input and diagnoses malformed series", () => {
    const series = [
      titleSeries({ id: "b", rawKey: "title:test-rank", max: 2, omittedRanks: [1] }),
      titleSeries({ id: "a", rawKey: "title:test-rank", max: 2, duplicateRank: 2 }),
      titleSeries({ id: "c", rawKey: null, max: 2 }),
      titleSeries({ id: "d", rawKey: "bad key", max: 2 })
    ];
    const first = createTitleRankCatalog(series);
    const second = createTitleRankCatalog([...series].reverse());

    expect(JSON.stringify(first.definitions)).toBe(JSON.stringify(second.definitions));
    expect(first.diagnostics.map((diagnostic) => diagnostic.code).sort()).toEqual([
      "title.duplicate-row",
      "title.invalid-key",
      "title.missing-key",
      "title.row-gap"
    ]);
  });

  it("projects implicit per-series maxima and explicit common Sunspear overrides", () => {
    const catalog = createTitleRankCatalog([
      titleSeries({ id: "sunspear-a", rawKey: "title:sunspear-rank", max: 10 }),
      titleSeries({ id: "sunspear-b", rawKey: "title:title-sunspear-rank", max: 15 })
    ]);
    const testSkill = titleSkill(["sunspear-a", "sunspear-b"]);
    const implicit = resolveTitleRanksForSkill({
      catalog,
      skill: testSkill,
      overrides: []
    });
    const explicit = resolveTitleRanksForSkill({
      catalog,
      skill: testSkill,
      overrides: [{ key: "title:sunspear-rank", rank: 8 }]
    });
    const outOfDomain = resolveTitleRanksForSkill({
      catalog,
      skill: testSkill,
      overrides: [{ key: "title:sunspear-rank", rank: 12 }]
    });

    expect(implicit.ranks).toEqual({
      "title:sunspear-rank": 10,
      "title:title-sunspear-rank": 15
    });
    expect(explicit.ranks).toEqual({
      "title:sunspear-rank": 8,
      "title:title-sunspear-rank": 8
    });
    expect(implicit.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "title.alias-domain-conflict"
    ]);
    expect(outOfDomain.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "title.alias-domain-conflict",
      "title.missing-exact-row",
      "title.missing-exact-row"
    ]);
  });

  it("sets, sorts, and resets title overrides without mutating unrelated build fields", () => {
    const build = buildFixture();
    const lightbringerFacts = {
      key: "title:lightbringer-rank",
      defaultKind: "coherent" as const,
      editableRanks: ranks(12)
    };
    const sunspearFacts = {
      key: "title:sunspear-rank",
      defaultKind: "alias-conflict" as const,
      editableRanks: ranks(10)
    };

    const lowered = setTitleRankOverride(build, lightbringerFacts, 4);
    const withSunspear = setTitleRankOverride(lowered, sunspearFacts, 10);
    const resetLightbringer = setTitleRankOverride(withSunspear, lightbringerFacts, 12);
    const resetAll = resetTitleRankOverride(resetLightbringer, "title:sunspear-rank");
    const ignored = setTitleRankOverride(resetAll, sunspearFacts, 12);

    expect(build.titleRankOverrides).toEqual([]);
    expect(lowered).toMatchObject<Partial<Build>>({
      name: build.name,
      skillBar: build.skillBar
    });
    expect(withSunspear.titleRankOverrides).toEqual([
      { key: "title:lightbringer-rank", rank: 4 },
      { key: "title:sunspear-rank", rank: 10 }
    ]);
    expect(resetLightbringer.titleRankOverrides).toEqual([
      { key: "title:sunspear-rank", rank: 10 }
    ]);
    expect(resetAll.titleRankOverrides).toEqual([]);
    expect(ignored).toBe(resetAll);
  });
});

function titleSkill(progressionSeriesIds: readonly string[]): CatalogSkillRecord {
  return skill({
    id: skillIds.titleSkill,
    name: "Title Test",
    professionId: null,
    attributeId: null,
    classification: {
      title: true,
      noAttribute: true,
      pveOnly: true,
      modeAvailability: "pve-only"
    },
    progressionSeriesIds
  });
}

function titleSeries(input: {
  readonly id: string;
  readonly rawKey: string | null;
  readonly max: number;
  readonly omittedRanks?: readonly number[];
  readonly duplicateRank?: number;
}): SkillProgressionSeries {
  const values = ranks(input.max)
    .filter((rank) => !(input.omittedRanks ?? []).includes(rank))
    .map((rank) => ({ rank, values: [rank] }));
  return {
    id: input.id,
    skillId: skillIds.titleSkill,
    dependency: {
      kind: "title-rank",
      attributeId: null,
      titleKey: input.rawKey,
      mode: null,
      rankDomain: { min: 0, max: input.max }
    },
    valueSlots: [{ index: 0, label: "value", unit: null }],
    values:
      input.duplicateRank === undefined
        ? values
        : [...values, { rank: input.duplicateRank, values: [input.duplicateRank] }],
    sourceForm: "fixture",
    provenance
  };
}

function ranks(max: number): readonly number[] {
  return Array.from({ length: max + 1 }, (_, rank) => rank);
}
