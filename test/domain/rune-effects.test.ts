import { describe, expect, it } from "vitest";

import {
  catalogId,
  summarizeAttributeRuneEffects,
  templateEquipmentModifierId,
  type CatalogFieldProvenance,
  type CatalogRuneRecord,
  type RuneCatalog
} from "../../src/domain";

const provenance: CatalogFieldProvenance = {
  sourceIds: ["source:test"],
  claimIds: ["claim:test"],
  reviewIds: ["review:test"],
  notes: null
};

function attributeRune(
  id: number,
  attributeId: number,
  amount: number,
  penalty: number
): CatalogRuneRecord {
  return {
    id: catalogId<"Rune">(id),
    templateModifierId: templateEquipmentModifierId(id),
    name: `Rune ${id}`,
    normalizedName: `rune-${id}`,
    wikiUrl: "https://wiki.guildwars.com/wiki/Rune",
    pageIdentity: {
      requestedTitle: `Rune ${id}`,
      normalizedTitle: `Rune ${id}`,
      canonicalTitle: "Rune",
      pageId: 1,
      revisionId: 2,
      sourceRevisionTimestamp: "2026-08-31T00:00:00Z",
      redirectedFrom: null
    },
    familyKey: `attribute:${attributeId}`,
    familyKind: "attribute",
    familyRank: amount === 3 ? "superior" : amount === 2 ? "major" : "minor",
    rarityTier: amount === 3 ? "superior" : amount === 2 ? "major" : "minor",
    eligibility: "profession-armor",
    professionId: catalogId<"Profession">(1),
    affectedAttributeId: catalogId<"Attribute">(attributeId),
    effects: [
      {
        kind: "attribute-rank",
        attributeId: catalogId<"Attribute">(attributeId),
        amount,
        unit: "rank",
        target: "attribute",
        stacking: { rule: "highest", groupKey: `attribute:${attributeId}`, notes: null },
        provenance
      },
      ...(penalty === 0
        ? []
        : [
            {
              kind: "maximum-health-delta" as const,
              amount: penalty,
              unit: "health" as const,
              target: "character" as const,
              stacking: {
                rule: "sum" as const,
                groupKey: `attribute-health-penalty:${id}`,
                notes: null
              },
              provenance
            }
          ])
    ],
    headgearInteraction: "attribute-linked",
    displayState: "structured-only",
    iconId: null,
    provenance
  };
}

function catalog(runes: readonly CatalogRuneRecord[]): RuneCatalog {
  return {
    schemaVersion: 1,
    catalogVersion: "test",
    sectionDigests: [],
    generatedAt: "2026-09-01T00:00:00Z",
    generator: "test",
    profile: {
      id: "epic-10-runes",
      sourceTarget: "BACKLOG",
      sourceEpic: "EPIC-10",
      sourceCaps: {
        seedPageLimit: 3,
        detailPageLimit: 180,
        mediaTitleLimit: 160,
        requestLimit: 80,
        retryLimit: 3,
        continuationLimit: 10,
        responseByteCap: 1,
        parserByteCap: 1,
        aggregateByteCap: 1,
        catalogByteCap: 1,
        qaByteCap: 1
      }
    },
    dependencyDigests: [],
    sourceSet: {
      seedTitles: [],
      detailPageTitles: [],
      sourceSetDigest: "digest",
      sourcePlanDigest: "digest",
      acceptedRuneCount: runes.length,
      relationshipCount: 0,
      exclusionCount: 0,
      unsupportedCount: 0,
      blockingFindingCount: 0,
      sourceAuthority: "test",
      idPolicy: "test",
      planningAmendment: null
    },
    dispositions: [],
    runes,
    remoteMedia: []
  };
}

describe("attribute rune effect summary", () => {
  it("keeps one highest rank adjustment while preserving duplicate health penalties", () => {
    const summary = summarizeAttributeRuneEffects(catalog([attributeRune(95, 20, 3, -75)]), [
      { sourceKey: "head", runeId: catalogId<"Rune">(95) },
      { sourceKey: "chest", runeId: catalogId<"Rune">(95) }
    ]);

    expect(summary.attributeContributions).toHaveLength(1);
    expect(summary.attributeContributions[0]?.amount).toBe(3);
    expect(summary.rankAdjustments).toEqual([
      { kind: "rune", amount: 3, sourceId: "chest|head", label: "Rune 95" }
    ]);
    expect(summary.healthPenaltyOccurrences.map((item) => item.amount)).toEqual([-75, -75]);
    expect(summary.totalAttributeRuneHealthDelta).toBe(-150);
  });

  it("handles mixed ranks, ties, unknown IDs, duplicate keys, and note-only effects deterministically", () => {
    const noteOnly = {
      ...attributeRune(1000, 20, 1, 0),
      effects: [
        {
          kind: "note-only" as const,
          noteCode: "manual-note",
          text: "Reviewed note.",
          stacking: { rule: "unknown" as const, groupKey: "note:1000", notes: null },
          provenance
        }
      ]
    };
    const summary = summarizeAttributeRuneEffects(
      catalog([attributeRune(69, 20, 2, -35), attributeRune(95, 20, 3, -75), noteOnly]),
      [
        { sourceKey: "a", runeId: catalogId<"Rune">(69) },
        { sourceKey: "b", runeId: catalogId<"Rune">(95) },
        { sourceKey: "b", runeId: catalogId<"Rune">(1000) },
        { sourceKey: "z", runeId: catalogId<"Rune">(999999) }
      ]
    );

    expect(summary.attributeContributions[0]?.runeId).toBe(95);
    expect(summary.healthPenaltyOccurrences.map((item) => item.amount)).toEqual([-35, -75]);
    expect(summary.unresolved.map((item) => item.code)).toEqual([
      "duplicate-source-key",
      "duplicate-source-key",
      "malformed-catalog-record",
      "note-only-effect",
      "unknown-rune-id"
    ]);
  });

  it("does not mutate caller-owned catalogs or entries", () => {
    const testCatalog = catalog([attributeRune(95, 20, 3, -75)]);
    const entries = [{ sourceKey: "head", runeId: catalogId<"Rune">(95) }];
    const beforeCatalog = JSON.stringify(testCatalog);
    const beforeEntries = JSON.stringify(entries);

    summarizeAttributeRuneEffects(testCatalog, entries);

    expect(JSON.stringify(testCatalog)).toBe(beforeCatalog);
    expect(JSON.stringify(entries)).toBe(beforeEntries);
  });
});
