import { describe, expect, it } from "vitest";

import {
  lookupWeaponTemplateItemId,
  lookupWeaponTemplateModifierId,
  templateEquipmentItemId,
  templateEquipmentModifierId,
  type WeaponBaseCatalog,
  type WeaponModCatalog
} from "../../src/domain";
import { decodeEquipmentTemplate, exportEquipmentTemplate } from "../../src/template-compatibility";
import weaponModsGolden from "../fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json";
import weaponsGolden from "../fixtures/data-ingestion/generated/fixture-weapons.catalog.json";

const weapons = weaponsGolden as unknown as WeaponBaseCatalog;
const weaponMods = weaponModsGolden as unknown as WeaponModCatalog;

describe("weapon template lookups", () => {
  it("resolves known item and modifier IDs outside the raw equipment codec boundary", () => {
    const decoded = decodeEquipmentTemplate("PkZwFP9FzSKA");
    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }
    const before = JSON.stringify(decoded.value);
    const item = decoded.value.items[0];
    if (item === undefined) {
      throw new Error("Missing equipment fixture item");
    }

    expect(lookupWeaponTemplateItemId(weapons, item.itemId).kind).toBe("known");
    expect(
      item.modifierIds.map(
        (modifierId) => lookupWeaponTemplateModifierId(weaponMods, modifierId).kind
      )
    ).toEqual(["known", "known", "known"]);
    expect(JSON.stringify(decoded.value)).toBe(before);
    expect(exportEquipmentTemplate(decoded.value).ok).toBe(true);
    expect(exportEquipmentTemplate(decoded.value, { mode: "canonical" }).ok).toBe(true);
  });

  it("preserves unsupported, historical, ambiguous, and unknown raw IDs as lookup outcomes", () => {
    expect(lookupWeaponTemplateItemId(weapons, templateEquipmentItemId(0)).kind).toBe(
      "dispositioned"
    );
    expect(lookupWeaponTemplateItemId(weapons, templateEquipmentItemId(999001)).kind).toBe(
      "dispositioned"
    );
    expect(lookupWeaponTemplateItemId(weapons, templateEquipmentItemId(987654)).kind).toBe(
      "unknown"
    );
    expect(lookupWeaponTemplateModifierId(weaponMods, templateEquipmentModifierId(158)).kind).toBe(
      "dispositioned"
    );
    expect(lookupWeaponTemplateModifierId(weaponMods, templateEquipmentModifierId(290)).kind).toBe(
      "dispositioned"
    );
    expect(
      lookupWeaponTemplateModifierId(weaponMods, templateEquipmentModifierId(987654)).kind
    ).toBe("unknown");
  });
});
