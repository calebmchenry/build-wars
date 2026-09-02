import { describe, expect, it } from "vitest";

import {
  catalogId,
  lookupInsigniaByName,
  lookupInsigniaTemplateModifierId,
  SOURCE_POLICY_SCHEMA_VERSION,
  templateEquipmentModifierId,
  type InsigniaCatalog
} from "../../src/domain";
import golden from "../fixtures/data-ingestion/generated/fixture-insignias.catalog.json";

const catalog = golden as unknown as InsigniaCatalog;

describe("insignia catalog contracts", () => {
  it("loads the Python-generated fixture through the runtime-safe wire contract", () => {
    expect(catalog.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(catalog.profile.id).toBe("epic-11-insignias");
    expect(catalog.dependencyDigests[0]?.id).toBe("epic-03-professions-attributes");
    expect(catalog.sourceSet.acceptedInsigniaCount).toBe(13);
    expect(catalog.identityRegistry.recordCount).toBe(45);
    expect(JSON.stringify(catalog)).not.toContain("Rune Trader");
    expect(catalog.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });

  it("keeps template modifier IDs as crosswalk facts, distinct from public IDs", () => {
    const known = lookupInsigniaTemplateModifierId(catalog, templateEquipmentModifierId(290));
    const unknown = lookupInsigniaTemplateModifierId(catalog, templateEquipmentModifierId(999999));

    expect(known.kind).toBe("known");
    expect(known.catalogId).toBe(290);
    expect(unknown.kind).toBe("unknown");
    expect(unknown.templateId).toBe(999999);
  });

  it("performs collision-safe insignia name lookups", () => {
    expect(lookupInsigniaByName(catalog, "survivor insignia")?.id).toBe(290);

    const survivor = catalog.insignias.find((insignia) => Number(insignia.id) === 290);
    const survivorCrosswalk = survivor?.templateModifiers[0];
    if (survivor === undefined || survivorCrosswalk === undefined) {
      throw new Error("Missing survivor fixture");
    }
    const duplicate = {
      ...catalog,
      insignias: [
        ...catalog.insignias,
        {
          ...survivor,
          id: catalogId<"Insignia">(999),
          templateModifiers: [
            {
              ...survivorCrosswalk,
              templateModifierId: templateEquipmentModifierId(999)
            }
          ]
        }
      ]
    } satisfies InsigniaCatalog;
    expect(() => lookupInsigniaByName(duplicate, "Survivor Insignia")).toThrow(
      /Ambiguous insignia/
    );
  });

  it("represents slot scaling, conditions, note-only facts, and local armor separately", () => {
    const survivor = lookupInsigniaByName(catalog, "Survivor Insignia");
    const sentinel = lookupInsigniaByName(catalog, "Sentinel's Insignia");
    const bloodstained = lookupInsigniaByName(catalog, "Bloodstained Insignia");
    if (survivor === null || sentinel === null || bloodstained === null) {
      throw new Error("Missing insignia fixtures");
    }

    expect("stackable" in survivor).toBe(false);
    expect(survivor.effects[0]?.kind).toBe("maximum-health-delta");
    if (survivor.effects[0]?.kind !== "maximum-health-delta") {
      throw new Error("Expected survivor health effect");
    }
    expect(survivor.effects[0].slotOutcomes.chest).toMatchObject({
      kind: "value",
      amount: 15,
      unit: "health"
    });
    expect(sentinel.effects[0]?.condition.kind).toBe("predicate");
    expect(bloodstained.effectCompleteness).toBe("note-only");
    expect(bloodstained.effects[0]?.kind).toBe("note-only");
  });
});
