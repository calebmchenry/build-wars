import { describe, expect, it } from "vitest";

import {
  explainWeaponModCompatibility,
  lookupWeaponBaseByName,
  lookupWeaponModByName,
  type CatalogWeaponModRecord,
  type WeaponBaseCatalog,
  type WeaponModCatalog
} from "../../src/domain";
import weaponModsGolden from "../fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json";
import weaponsGolden from "../fixtures/data-ingestion/generated/fixture-weapons.catalog.json";

const weapons = weaponsGolden as unknown as WeaponBaseCatalog;
const weaponMods = weaponModsGolden as unknown as WeaponModCatalog;

function base(name: string) {
  const record = lookupWeaponBaseByName(weapons, name);
  if (record === null) {
    throw new Error(`Missing weapon base fixture: ${name}`);
  }
  return record;
}

function mod(name: string) {
  const record = lookupWeaponModByName(weaponMods, name);
  if (record === null) {
    throw new Error(`Missing weapon modifier fixture: ${name}`);
  }
  return record;
}

describe("weapon modifier compatibility", () => {
  it("accepts structural family, slot, mode, and applicability matches", () => {
    expect(
      explainWeaponModCompatibility(base("Sword"), mod("Sundering Weapon Prefix"))
    ).toMatchObject({
      kind: "compatible",
      reasonCodes: expect.arrayContaining([
        "mode-overlap",
        "modifier-slot-available",
        "base-family-supported"
      ])
    });
    expect(
      explainWeaponModCompatibility(base("Staff"), mod("Insightful Staff Head"))
    ).toMatchObject({
      kind: "compatible",
      reasonCodes: expect.arrayContaining(["specific-family-applicability"])
    });
  });

  it("reports incompatible structural mismatches without loadout validation", () => {
    expect(
      explainWeaponModCompatibility(base("Shield"), mod("Sundering Weapon Prefix"))
    ).toMatchObject({
      kind: "incompatible",
      reasonCodes: expect.arrayContaining(["occupied-slot-unavailable"])
    });
    expect(
      explainWeaponModCompatibility(base("Focus"), mod("Insightful Staff Head"))
    ).toMatchObject({
      kind: "incompatible",
      reasonCodes: expect.arrayContaining(["occupied-slot-unavailable"])
    });
  });

  it("reports mode mismatch and unresolved applicability as stable reason codes", () => {
    const suffix = mod("Fortitude Weapon Suffix");
    const pvpOnly = { ...suffix, modeAvailability: "pvp-only" } satisfies CatalogWeaponModRecord;
    const unresolved = {
      ...suffix,
      applicability: {
        kind: "unresolved",
        reason: "Fixture unresolved applicability",
        sourceText: null,
        provenance: suffix.provenance
      }
    } satisfies CatalogWeaponModRecord;

    expect(
      explainWeaponModCompatibility({ ...base("Sword"), modeAvailability: "pve-only" }, pvpOnly)
    ).toEqual({ kind: "incompatible", reasonCodes: ["mode-mismatch"] });
    expect(explainWeaponModCompatibility(base("Sword"), unresolved)).toMatchObject({
      kind: "indeterminate",
      reasonCodes: expect.arrayContaining(["applicability-unresolved"])
    });
  });
});
