import { describe, expect, it } from "vitest";

import {
  catalogId,
  lookupWeaponModByName,
  lookupWeaponTemplateModifierId,
  SOURCE_POLICY_SCHEMA_VERSION,
  templateEquipmentModifierId,
  type WeaponModCatalog
} from "../../src/domain";
import golden from "../fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json";

const catalog = golden as unknown as WeaponModCatalog;

describe("weapon modifier catalog contracts", () => {
  it("loads the Python-generated fixture through the runtime-safe wire contract", () => {
    expect(catalog.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(catalog.profile.id).toBe("epic-12-weapons-and-mods");
    expect(catalog.dependencyDigests[0]?.id).toBe("epic-03-professions-attributes");
    expect(catalog.sourceSet.acceptedWeaponModifierCount).toBe(9);
    expect(catalog.catalogSetDigest).toBe(catalog.releaseSet.catalogSetDigest);
    expect(JSON.stringify(catalog)).not.toContain("Rune Trader");
    expect(catalog.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });

  it("keeps template modifier IDs as crosswalk facts, distinct from public IDs", () => {
    const known = lookupWeaponTemplateModifierId(catalog, templateEquipmentModifierId(204));
    const dispositioned = lookupWeaponTemplateModifierId(catalog, templateEquipmentModifierId(290));
    const unknown = lookupWeaponTemplateModifierId(catalog, templateEquipmentModifierId(987654));

    expect(known.kind).toBe("known");
    expect(known.catalogId).toBe(1002);
    expect(dispositioned.kind).toBe("dispositioned");
    expect(unknown.kind).toBe("unknown");
    expect(unknown.templateId).toBe(987654);
  });

  it("represents structured, chance, and note-only modifier effects separately", () => {
    const inscription = lookupWeaponModByName(catalog, "I Have the Power!");
    const aptitude = lookupWeaponModByName(catalog, "Focus Core of Aptitude");
    const mastery = lookupWeaponModByName(catalog, "Weapon Mastery Suffix");
    if (inscription === null || aptitude === null || mastery === null) {
      throw new Error("Missing weapon modifier fixtures");
    }

    expect(inscription.effects[0]?.kind).toBe("maximum-energy-delta");
    expect(inscription.effectCompleteness).toBe("structured");
    expect(aptitude.effects[0]?.kind).toBe("casting-time-chance");
    expect(aptitude.effectCompleteness).toBe("structured");
    expect(mastery.effects[0]?.kind).toBe("note-only");
    expect(mastery.effectCompleteness).toBe("note-only");
  });

  it("performs collision-safe weapon modifier name lookups", () => {
    const fortitude = lookupWeaponModByName(catalog, "Fortitude Weapon Suffix");
    if (fortitude === null) {
      throw new Error("Missing fortitude fixture");
    }
    const duplicate = {
      ...catalog,
      weaponMods: [
        ...catalog.weaponMods,
        {
          ...fortitude,
          id: catalogId<"WeaponModifier">(9999),
          templateModifiers: [
            {
              ...fortitude.templateModifiers[0]!,
              templateModifierId: templateEquipmentModifierId(9999)
            }
          ]
        }
      ]
    } satisfies WeaponModCatalog;

    expect(() => lookupWeaponModByName(duplicate, "Fortitude Weapon Suffix")).toThrow(
      /Ambiguous weapon modifier/
    );
  });
});
