import { describe, expect, it } from "vitest";

import {
  attributeBudgetForLevel,
  lookupAttributeByName,
  lookupAttributeTemplateId,
  lookupProfessionByName,
  lookupProfessionTemplateId,
  purchasedRankCost,
  templateAttributeId,
  templateProfessionId,
  type ProfessionAttributeCatalog
} from "../../src/domain";
import golden from "../fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json";

const catalog = golden as unknown as ProfessionAttributeCatalog;

describe("profession and attribute catalog contracts", () => {
  it("preserves profession none sentinel and playable profession records separately", () => {
    expect(catalog.professions).toHaveLength(10);
    expect(catalog.professions.some((profession) => Number(profession.templateId) === 0)).toBe(
      false
    );

    const none = lookupProfessionTemplateId(catalog, templateProfessionId(0));
    const warrior = lookupProfessionTemplateId(catalog, templateProfessionId(1));
    const unknown = lookupProfessionTemplateId(catalog, templateProfessionId(99));

    expect(none.kind).toBe("none");
    expect(none.catalogId).toBeNull();
    expect(warrior.kind).toBe("known");
    expect(warrior.catalogId).toBe(1);
    expect(unknown.kind).toBe("unknown");
  });

  it("keeps attribute template ID zero and non-contiguous gaps in the attribute namespace", () => {
    const fastCasting = lookupAttributeTemplateId(catalog, templateAttributeId(0));
    const reservedGap = lookupAttributeTemplateId(catalog, templateAttributeId(26));
    const unsupported = lookupAttributeTemplateId(
      {
        ...catalog,
        templateCrosswalk: {
          ...catalog.templateCrosswalk,
          reservedTemplateIds: [
            ...catalog.templateCrosswalk.reservedTemplateIds,
            {
              templateId: templateAttributeId(1000),
              namespace: "attribute",
              status: "unsupported",
              reason: "Synthetic unsupported fixture.",
              provenance: { sourceIds: [], claimIds: [], reviewIds: [], notes: null }
            }
          ]
        }
      },
      templateAttributeId(1000)
    );

    expect(fastCasting.kind).toBe("known");
    expect(fastCasting.catalogId).toBe(0);
    expect(reservedGap.kind).toBe("reserved");
    expect(unsupported.kind).toBe("unsupported");
  });

  it("performs deterministic reverse lookups by names and explicit abbreviations", () => {
    expect(lookupProfessionByName(catalog, "Me")?.name).toBe("Mesmer");
    expect(lookupProfessionByName(catalog, "ritualist")?.abbreviation).toBe("Rt");
    expect(lookupAttributeByName(catalog, "Earth Prayers")?.templateId).toBe(43);

    const firstProfession = catalog.professions[0];
    if (firstProfession === undefined) {
      throw new Error("Missing profession fixture");
    }
    const duplicate = {
      ...catalog,
      professions: [
        ...catalog.professions,
        {
          ...firstProfession,
          id: 999,
          templateId: 999,
          name: "Mesmer Duplicate",
          abbreviation: "Me"
        }
      ]
    } as ProfessionAttributeCatalog;
    expect(() => lookupProfessionByName(duplicate, "Me")).toThrow(/Ambiguous profession/);
  });

  it("keeps purchased ranks, level totals, quest bonus, and default budgets distinct", () => {
    expect(purchasedRankCost(catalog, 0)).toBe(0);
    expect(purchasedRankCost(catalog, 12)).toBe(97);
    expect(attributeBudgetForLevel(catalog, 20, "none")).toBe(170);
    expect(attributeBudgetForLevel(catalog, 20, "maximum-applicable")).toBe(200);
    expect(catalog.attributePointRules.questRewards).toHaveLength(6);
    expect(catalog.attributePointRules.defaultPveLevel20.deferredContexts).toContain("equipment");
  });

  it("requires reviewed primary-effect summaries and metadata-only icons", () => {
    const primaryAttributes = catalog.attributes.filter((attribute) => attribute.isPrimary);

    expect(primaryAttributes).toHaveLength(10);
    expect(primaryAttributes.every((attribute) => attribute.isPrimaryOnly)).toBe(true);
    expect(
      primaryAttributes.every((attribute) =>
        attribute.primaryEffectSummary?.provenance.reviewIds.includes(
          "review:epic-03-primary-effect-summaries:2026-09-01"
        )
      )
    ).toBe(true);
    expect(catalog.remoteMedia).toHaveLength(10);
    expect(catalog.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });
});
