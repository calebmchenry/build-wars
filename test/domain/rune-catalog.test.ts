import { describe, expect, it } from "vitest";

import {
  catalogId,
  lookupRuneByName,
  lookupRuneTemplateModifierId,
  SOURCE_POLICY_SCHEMA_VERSION,
  templateEquipmentModifierId,
  type RuneCatalog
} from "../../src/domain";
import golden from "../fixtures/data-ingestion/generated/fixture-runes.catalog.json";

const catalog = golden as unknown as RuneCatalog;

describe("rune catalog contracts", () => {
  it("loads the Python-generated fixture through the runtime-safe wire contract", () => {
    expect(catalog.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(catalog.profile.id).toBe("epic-10-runes");
    expect(catalog.dependencyDigests[0]?.id).toBe("epic-03-professions-attributes");
    expect(catalog.sourceSet.acceptedRuneCount).toBe(18);
    expect(catalog.runes.map((rune) => Number(rune.id))).toContain(95);
    expect(JSON.stringify(catalog)).not.toContain("Rune trader");
    expect(catalog.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });

  it("keeps template modifier IDs distinct and unknown equipment modifiers representable", () => {
    const known = lookupRuneTemplateModifierId(catalog, templateEquipmentModifierId(95));
    const unknown = lookupRuneTemplateModifierId(catalog, templateEquipmentModifierId(999999));

    expect(known.kind).toBe("known");
    expect(known.catalogId).toBe(95);
    expect(unknown.kind).toBe("unknown");
    expect(unknown.templateId).toBe(999999);
  });

  it("performs collision-safe rune name lookups", () => {
    expect(lookupRuneByName(catalog, "rune of superior swordsmanship")?.id).toBe(95);

    const superiorSword = catalog.runes.find((rune) => Number(rune.id) === 95);
    if (superiorSword === undefined) {
      throw new Error("Missing superior swordsmanship fixture");
    }
    const duplicate = {
      ...catalog,
      runes: [
        ...catalog.runes,
        {
          ...superiorSword,
          id: catalogId<"Rune">(999),
          templateModifierId: templateEquipmentModifierId(999)
        }
      ]
    } as RuneCatalog;
    expect(() => lookupRuneByName(duplicate, "Rune of Superior Swordsmanship")).toThrow(
      /Ambiguous rune/
    );
  });

  it("represents distinct effect and headgear states without record-level stackability", () => {
    const superiorSword = lookupRuneByName(catalog, "Rune of Superior Swordsmanship");
    const vitae = lookupRuneByName(catalog, "Rune of Vitae");
    const restoration = lookupRuneByName(catalog, "Rune of Restoration");
    if (superiorSword === null || vitae === null || restoration === null) {
      throw new Error("Missing rune fixtures");
    }

    expect("stackable" in superiorSword).toBe(false);
    expect(superiorSword.headgearInteraction).toBe("attribute-linked");
    expect(superiorSword.effects.map((effect) => effect.kind)).toEqual([
      "attribute-rank",
      "maximum-health-delta"
    ]);
    expect(superiorSword.effects[0]?.stacking.rule).toBe("highest");
    expect(superiorSword.effects[1]?.stacking.rule).toBe("sum");
    expect(vitae.effects[0]?.kind).toBe("maximum-health-delta");
    expect(vitae.effects[0]?.stacking.rule).toBe("sum");
    expect(restoration.familyKey).toBe("condition:restoration");
    expect(restoration.affectedAttributeId).toBeNull();
    expect(restoration.effects[0]?.kind).toBe("condition-duration-reduction");
  });
});
