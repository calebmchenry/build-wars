import { describe, expect, it } from "vitest";

import {
  calculateEffectiveAttributeRank,
  catalogId,
  summarizeAttributeRuneEffects,
  templateEquipmentModifierId,
  type AttributeId,
  type CatalogFieldProvenance,
  type CatalogRuneRecord,
  type RuneCatalog
} from "../../src/domain";
import { attributeIds, professionAttributeCatalog } from "../fixtures/rule-engine/catalogs";
import { attributes, buildFixture } from "../fixtures/rule-engine/builds";

describe("effective attribute rank calculator", () => {
  it("resolves allocated zero and nonzero authored base ranks", () => {
    const zero = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 0]) }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics
    });
    const nonzero = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 8]) }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics
    });

    expect(zero).toMatchObject({ kind: "resolved", authoredBaseRank: 0, finalRank: 0 });
    expect(nonzero).toMatchObject({
      kind: "resolved",
      authoredBaseRank: 8,
      baseRank: 8,
      baseSource: "authored",
      finalRank: 8
    });
  });

  it("resolves known unallocated attributes as rank zero", () => {
    const result = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: [] }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics
    });

    expect(result).toMatchObject({
      kind: "resolved",
      authoredBaseRank: 0,
      baseRank: 0,
      baseSource: "unallocated",
      finalRank: 0
    });
  });

  it("reports unknown, duplicate, and malformed authored attribute state as unresolved", () => {
    const unknown = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: [] }),
      professionAttributes: professionAttributeCatalog,
      attributeId: catalogId<"Attribute">(7777) as AttributeId
    });
    const duplicate = calculateEffectiveAttributeRank({
      build: buildFixture({
        attributes: attributes([attributeIds.tactics, 8], [attributeIds.tactics, 6])
      }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics
    });
    const malformed = calculateEffectiveAttributeRank({
      build: buildFixture({
        attributes: [{ attributeId: attributeIds.tactics, rank: Number.NaN }]
      }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics
    });

    expect(reasonCodes(unknown)).toEqual(["unknown-attribute"]);
    expect(reasonCodes(duplicate)).toEqual(["duplicate-allocation"]);
    expect(reasonCodes(malformed)).toEqual(["invalid-base-rank"]);
  });

  it("applies override precedence before canonical additive adjustments", () => {
    const result = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 8]) }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics,
      baseRankOverride: 3,
      adjustments: [
        { kind: "manual", amount: 2, sourceId: "manual:late" },
        { kind: "rune", amount: 1, sourceId: "rune:minor" },
        { kind: "headgear", amount: 1, sourceId: "headgear:tactics" },
        { kind: "temporary", amount: -1, sourceId: "effect:fixture" }
      ]
    });

    expect(result).toMatchObject({
      kind: "resolved",
      authoredBaseRank: 8,
      baseRank: 3,
      baseSource: "override",
      finalRank: 6
    });
    expect(result.adjustments.map((adjustment) => adjustment.kind)).toEqual([
      "headgear",
      "rune",
      "temporary",
      "manual"
    ]);
    expect(result.contributions.map((contribution) => contribution.kind)).toEqual([
      "base",
      "adjustment",
      "adjustment",
      "adjustment",
      "adjustment"
    ]);
  });

  it("accepts rune adjustments produced by the rune helper without owning stacking rules", () => {
    const summary = summarizeAttributeRuneEffects(
      runeCatalogForAttribute(attributeIds.tactics, [
        attributeRune(69, attributeIds.tactics, 2, -35),
        attributeRune(95, attributeIds.tactics, 3, -75)
      ]),
      [
        { sourceKey: "head", runeId: catalogId<"Rune">(69) },
        { sourceKey: "chest", runeId: catalogId<"Rune">(95) }
      ]
    );
    const result = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 8]) }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics,
      adjustments: summary.rankAdjustments
    });

    expect(summary.rankAdjustments).toEqual([
      { kind: "rune", amount: 3, sourceId: "chest", label: "Rune 95" }
    ]);
    expect(summary.totalAttributeRuneHealthDelta).toBe(-110);
    expect(result).toMatchObject({ kind: "resolved", finalRank: 11 });
  });

  it("rejects invalid overrides, invalid adjustments, overflow, and negative final ranks", () => {
    const invalidOverride = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 8]) }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics,
      baseRankOverride: -1
    });
    const invalidAdjustment = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 8]) }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics,
      adjustments: [{ kind: "manual", amount: Number.NaN }]
    });
    const overflow = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 8]) }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics,
      baseRankOverride: Number.MAX_SAFE_INTEGER,
      adjustments: [{ kind: "manual", amount: 1 }]
    });
    const negative = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 1]) }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics,
      adjustments: [{ kind: "manual", amount: -2 }]
    });

    expect(reasonCodes(invalidOverride)).toEqual(["invalid-override"]);
    expect(reasonCodes(invalidAdjustment)).toEqual(["invalid-adjustment"]);
    expect(reasonCodes(overflow)).toEqual(["rank-overflow"]);
    expect(reasonCodes(negative)).toEqual(["negative-final-rank"]);
  });
});

function reasonCodes(
  result: ReturnType<typeof calculateEffectiveAttributeRank>
): readonly string[] {
  return result.kind === "unresolved" ? result.reasons.map((reason) => reason.code) : [];
}

const runeProvenance: CatalogFieldProvenance = {
  sourceIds: ["source:test"],
  claimIds: ["claim:test"],
  reviewIds: ["review:test"],
  notes: null
};

function attributeRune(
  id: number,
  attributeId: AttributeId,
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
    familyKey: `attribute:${Number(attributeId)}`,
    familyKind: "attribute",
    familyRank: amount === 3 ? "superior" : amount === 2 ? "major" : "minor",
    rarityTier: amount === 3 ? "superior" : amount === 2 ? "major" : "minor",
    eligibility: "profession-armor",
    professionId: catalogId<"Profession">(1),
    affectedAttributeId: attributeId,
    effects: [
      {
        kind: "attribute-rank",
        attributeId,
        amount,
        unit: "rank",
        target: "attribute",
        stacking: { rule: "highest", groupKey: `attribute:${Number(attributeId)}`, notes: null },
        provenance: runeProvenance
      },
      {
        kind: "maximum-health-delta",
        amount: penalty,
        unit: "health",
        target: "character",
        stacking: { rule: "sum", groupKey: `attribute-health-penalty:${id}`, notes: null },
        provenance: runeProvenance
      }
    ],
    headgearInteraction: "attribute-linked",
    displayState: "structured-only",
    iconId: null,
    provenance: runeProvenance
  };
}

function runeCatalogForAttribute(
  attributeId: AttributeId,
  runes: readonly CatalogRuneRecord[]
): RuneCatalog {
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
      sourceSetDigest: `attribute:${Number(attributeId)}`,
      sourcePlanDigest: `attribute:${Number(attributeId)}`,
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
