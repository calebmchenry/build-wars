import { describe, expect, it } from "vitest";

import { calculateEffectiveAttributeRank, catalogId, type AttributeId } from "../../src/domain";
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
