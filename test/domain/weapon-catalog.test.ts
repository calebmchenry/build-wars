import { describe, expect, it } from "vitest";

import {
  catalogId,
  lookupWeaponBaseByName,
  lookupWeaponTemplateItemId,
  SOURCE_POLICY_SCHEMA_VERSION,
  templateEquipmentItemId,
  type WeaponBaseCatalog
} from "../../src/domain";
import golden from "../fixtures/data-ingestion/generated/fixture-weapons.catalog.json";

const catalog = golden as unknown as WeaponBaseCatalog;

describe("weapon base catalog contracts", () => {
  it("loads the Python-generated fixture through the runtime-safe wire contract", () => {
    expect(catalog.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(catalog.profile.id).toBe("epic-12-weapons-and-mods");
    expect(catalog.dependencyDigests[0]?.id).toBe("epic-03-professions-attributes");
    expect(catalog.sourceSet.acceptedWeaponBaseCount).toBe(11);
    expect(catalog.releaseSet.profile).toBe("epic-12-weapons-and-mods");
    expect(catalog.catalogSetDigest).toBe(catalog.releaseSet.catalogSetDigest);
    expect(JSON.stringify(catalog)).not.toContain("Rune Trader");
    expect(catalog.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });

  it("keeps template item IDs as crosswalk facts, distinct from public IDs", () => {
    const known = lookupWeaponTemplateItemId(catalog, templateEquipmentItemId(279));
    const dispositioned = lookupWeaponTemplateItemId(catalog, templateEquipmentItemId(0));
    const unknown = lookupWeaponTemplateItemId(catalog, templateEquipmentItemId(987654));

    expect(known.kind).toBe("known");
    expect(known.catalogId).toBe(2);
    expect(dispositioned.kind).toBe("dispositioned");
    expect(unknown.kind).toBe("unknown");
    expect(unknown.templateId).toBe(987654);
  });

  it("represents damage, requirements, handedness, and modifier slots as tagged facts", () => {
    const sword = lookupWeaponBaseByName(catalog, "sword");
    const staff = lookupWeaponBaseByName(catalog, "Staff");
    const focus = lookupWeaponBaseByName(catalog, "Focus");
    if (sword === null || staff === null || focus === null) {
      throw new Error("Missing weapon fixtures");
    }

    expect(sword.damage).toMatchObject({ kind: "fixed-range", damageType: "slashing" });
    expect(sword.requirement).toMatchObject({
      kind: "attribute-rank",
      attributeName: "Swordsmanship"
    });
    expect(staff.allowedModifierSlots.map((slot) => slot.slot)).toEqual([
      "staff-head",
      "staff-wrapping",
      "inscription"
    ]);
    expect(focus.damage.kind).toBe("not-applicable");
    expect(focus.handedness).toBe("off-hand");
  });

  it("performs collision-safe weapon name lookups", () => {
    const sword = lookupWeaponBaseByName(catalog, "Sword");
    if (sword === null) {
      throw new Error("Missing sword fixture");
    }
    const duplicate = {
      ...catalog,
      weaponBases: [
        ...catalog.weaponBases,
        {
          ...sword,
          id: catalogId<"Weapon">(999),
          templateItems: [
            { ...sword.templateItems[0]!, templateItemId: templateEquipmentItemId(999) }
          ]
        }
      ]
    } satisfies WeaponBaseCatalog;

    expect(() => lookupWeaponBaseByName(duplicate, "sword")).toThrow(/Ambiguous weapon base/);
  });
});
