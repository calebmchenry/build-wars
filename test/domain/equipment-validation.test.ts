import { describe, expect, it } from "vitest";

import {
  createEmptyEquipmentLoadout,
  validateBuild,
  type EquipmentValidationCatalogs
} from "../../src/domain";
import { attributes, buildFixture } from "../fixtures/rule-engine/builds";
import {
  attributeIds,
  professionAttributeCatalog,
  skillsCatalog
} from "../fixtures/rule-engine/catalogs";
import {
  equipmentInsigniaCatalog,
  equipmentRuneCatalog,
  equipmentWeaponCatalog,
  equipmentWeaponModifierCatalog,
  insigniaIds,
  runeIds,
  weaponIds,
  weaponModifierIds
} from "../fixtures/rule-engine/equipment-catalogs";
import {
  knownAttribute,
  knownInsignia,
  knownRune,
  knownWeapon,
  knownWeaponModifier,
  loadoutWithArmor,
  loadoutWithArmorRows,
  loadoutWithWeaponSets,
  unresolvedSelection,
  weaponHand,
  weaponSet
} from "../fixtures/rule-engine/equipment";

const equipmentCatalogs = {
  runes: equipmentRuneCatalog,
  insignias: equipmentInsigniaCatalog,
  weapons: equipmentWeaponCatalog,
  weaponModifiers: equipmentWeaponModifierCatalog
} satisfies EquipmentValidationCatalogs;

describe("equipment validation", () => {
  it("skips null equipment and accepts canonical empty loadouts without equipment catalogs", () => {
    const nullResult = validate(buildFixture({ equipment: null }));
    const emptyResult = validate(buildFixture({ equipment: createEmptyEquipmentLoadout() }));

    expect(equipmentCodes(nullResult)).toEqual([]);
    expect(equipmentCodes(emptyResult)).toEqual([]);
    expect(emptyResult).toMatchObject({ valid: true, complete: true, resolved: true });
  });

  it("reports malformed armor topology deterministically without mutating rows", () => {
    const duplicatedHead = loadoutWithArmorRows([
      createEmptyEquipmentLoadout().armor[0]!,
      createEmptyEquipmentLoadout().armor[0]!
    ]);
    const before = JSON.stringify(duplicatedHead);
    const result = validate(buildFixture({ equipment: duplicatedHead }), equipmentCatalogs);

    expect(equipmentCodes(result)).toEqual(
      expect.arrayContaining([
        "equipment.armor-slot-duplicate",
        "equipment.armor-slot-malformed",
        "equipment.armor-slot-missing"
      ])
    );
    expect(result.valid).toBe(false);
    expect(result.complete).toBe(false);
    expect(JSON.stringify(duplicatedHead)).toBe(before);
  });

  it("emits catalog-unavailable only for selected equipment that needs missing catalogs", () => {
    const result = validate(
      buildFixture({
        equipment: loadoutWithArmor({
          head: {
            rune: knownRune(runeIds.minorAxe),
            insignia: knownInsignia(insigniaIds.survivor),
            headgearAttribute: knownAttribute(attributeIds.axeMastery)
          }
        })
      })
    );

    expect(equipmentCodes(result)).toEqual([
      "equipment.catalog-unavailable",
      "equipment.catalog-unavailable"
    ]);
    expect(result).toMatchObject({ valid: true, complete: true, resolved: false });
  });

  it("keeps explicit unresolved armor selections recoverable", () => {
    const result = validate(
      buildFixture({
        equipment: loadoutWithArmor({
          head: {
            rune: unresolvedSelection(),
            insignia: unresolvedSelection(),
            headgearAttribute: unresolvedSelection()
          }
        })
      }),
      equipmentCatalogs
    );

    expect(equipmentCodes(result)).toEqual([
      "equipment.headgear-unresolved",
      "equipment.insignia-unresolved",
      "equipment.rune-unresolved"
    ]);
    expect(result.resolved).toBe(false);
  });

  it("checks rune, insignia, and headgear restrictions from supplied catalog facts", () => {
    const result = validate(
      buildFixture({
        equipment: loadoutWithArmor({
          head: {
            rune: knownRune(runeIds.rangerMarksmanship),
            insignia: knownInsignia(insigniaIds.chestOnly),
            headgearAttribute: knownAttribute(attributeIds.marksmanship)
          }
        })
      }),
      equipmentCatalogs
    );

    expect(equipmentCodes(result)).toEqual(
      expect.arrayContaining([
        "equipment.headgear-attribute-invalid",
        "equipment.insignia-slot-inapplicable",
        "equipment.rune-restricted"
      ])
    );
    expect(result.valid).toBe(false);
  });

  it("surfaces weapon placement, modifier compatibility, and duplicate modifier slots", () => {
    const result = validate(
      buildFixture({
        attributes: attributes([attributeIds.tactics, 9]),
        equipment: loadoutWithWeaponSets([
          weaponSet("set-1", {
            mainHand: weaponHand({ weapon: knownWeapon(weaponIds.bow) }),
            offHand: weaponHand({ weapon: knownWeapon(weaponIds.shield) })
          }),
          weaponSet("set-2", {
            offHand: weaponHand({ weapon: knownWeapon(weaponIds.bow) })
          }),
          weaponSet("set-3", {
            mainHand: weaponHand({
              weapon: knownWeapon(weaponIds.sword),
              modifiers: [
                knownWeaponModifier(weaponModifierIds.swordSuffix),
                knownWeaponModifier(weaponModifierIds.secondSwordSuffix)
              ]
            })
          }),
          weaponSet("set-4", {
            offHand: weaponHand({
              weapon: knownWeapon(weaponIds.shield),
              modifiers: [knownWeaponModifier(weaponModifierIds.swordPrefix)]
            })
          })
        ])
      }),
      equipmentCatalogs
    );

    expect(equipmentCodes(result)).toEqual(
      expect.arrayContaining([
        "equipment.weapon-modifier-duplicate-slot",
        "equipment.weapon-modifier-incompatible",
        "equipment.weapon-occupancy-conflict",
        "equipment.weapon-wrong-hand"
      ])
    );
    expect(result.valid).toBe(false);
  });

  it("keeps unmet weapon requirements advisory and suppresses false warnings on unresolved ranks", () => {
    const unmet = validate(
      buildFixture({
        attributes: attributes([attributeIds.tactics, 1]),
        equipment: loadoutWithWeaponSets([
          weaponSet("set-1", {
            offHand: weaponHand({ weapon: knownWeapon(weaponIds.shield) })
          }),
          weaponSet("set-2"),
          weaponSet("set-3"),
          weaponSet("set-4")
        ])
      }),
      equipmentCatalogs
    );
    const unresolved = validate(
      buildFixture({
        attributes: attributes([attributeIds.tactics, 9]),
        equipment: {
          ...loadoutWithArmor({
            head: { headgearAttribute: unresolvedSelection() }
          }),
          weaponSets: [
            weaponSet("set-1", {
              offHand: weaponHand({ weapon: knownWeapon(weaponIds.shield) })
            }),
            weaponSet("set-2"),
            weaponSet("set-3"),
            weaponSet("set-4")
          ]
        }
      }),
      equipmentCatalogs
    );

    expect(equipmentCodes(unmet)).toEqual(["equipment.weapon-requirement-unmet"]);
    expect(unmet).toMatchObject({ valid: true, complete: true, resolved: true });
    expect(equipmentCodes(unresolved)).toEqual([
      "equipment.headgear-unresolved",
      "equipment.weapon-requirement-unresolved"
    ]);
    expect(unresolved.resolved).toBe(false);
  });

  it("excludes duplicate catalog IDs and mismatched weapon catalog sets from resolved lookups", () => {
    const duplicateRune = validate(
      buildFixture({
        equipment: loadoutWithArmor({ head: { rune: knownRune(runeIds.minorAxe) } })
      }),
      {
        ...equipmentCatalogs,
        runes: {
          ...equipmentRuneCatalog,
          records: [equipmentRuneCatalog.records[0]!, equipmentRuneCatalog.records[0]!]
        }
      }
    );
    const mismatched = validate(
      buildFixture({
        equipment: loadoutWithWeaponSets([
          weaponSet("set-1", {
            mainHand: weaponHand({
              weapon: knownWeapon(weaponIds.sword),
              modifiers: [knownWeaponModifier(weaponModifierIds.swordSuffix)]
            })
          }),
          weaponSet("set-2"),
          weaponSet("set-3"),
          weaponSet("set-4")
        ])
      }),
      {
        ...equipmentCatalogs,
        weaponModifiers: {
          ...equipmentWeaponModifierCatalog,
          catalogSetVersion: "different"
        }
      }
    );

    expect(equipmentCodes(duplicateRune)).toEqual([
      "equipment.catalog-duplicate-id",
      "equipment.rune-unresolved"
    ]);
    expect(equipmentCodes(mismatched)).toEqual([
      "equipment.catalog-set-mismatch",
      "equipment.weapon-modifier-compatibility-unresolved"
    ]);
    expect(duplicateRune.resolved).toBe(false);
    expect(mismatched.resolved).toBe(false);
  });

  it("marks oversized equipment traversal as non-exhaustive and applies the global issue cap", () => {
    const oversized = validate(
      buildFixture({
        equipment: {
          ...createEmptyEquipmentLoadout(),
          armor: Array.from({ length: 33 }, () => createEmptyEquipmentLoadout().armor[0]!)
        }
      }),
      equipmentCatalogs
    );
    const capped = validate(
      buildFixture({
        equipment: loadoutWithWeaponSets([
          weaponSet("set-1", {
            offHand: weaponHand({ weapon: knownWeapon(weaponIds.bow) })
          }),
          weaponSet("set-1", {
            offHand: weaponHand({ weapon: knownWeapon(weaponIds.bow) })
          })
        ])
      }),
      equipmentCatalogs,
      1
    );

    expect(oversized.truncation).toEqual({
      kind: "armor-row-cap",
      limit: 32,
      observed: 33,
      path: ["equipment", "armor"]
    });
    expect(oversized.exhaustive).toBe(false);
    expect(capped.truncation).toMatchObject({ kind: "issue-cap", limit: 1, path: [] });
    expect(capped.truncation?.observed).toBeGreaterThan(1);
    expect(capped.issues).toHaveLength(1);
  });

  it("does not mutate caller-owned builds or equipment catalogs", () => {
    const build = deepFreeze(
      buildFixture({
        equipment: loadoutWithArmor({
          head: {
            rune: knownRune(runeIds.superiorAxe),
            insignia: knownInsignia(insigniaIds.survivor),
            headgearAttribute: knownAttribute(attributeIds.axeMastery)
          }
        })
      })
    );
    const catalogs = deepFreeze(equipmentCatalogs);
    const before = JSON.stringify({ build, catalogs });

    validate(build, catalogs);

    expect(JSON.stringify({ build, catalogs })).toBe(before);
  });
});

function validate(
  build: Parameters<typeof validateBuild>[0]["build"],
  catalogs?: EquipmentValidationCatalogs,
  maxIssues?: number
) {
  return validateBuild({
    build,
    professionAttributes: professionAttributeCatalog,
    skills: skillsCatalog,
    ...(catalogs === undefined ? {} : { equipmentCatalogs: catalogs }),
    ...(maxIssues === undefined ? {} : { options: { maxIssues } })
  });
}

function equipmentCodes(result: ReturnType<typeof validateBuild>): readonly string[] {
  return result.issues.map((issue) => issue.code).filter((code) => code.startsWith("equipment."));
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) {
    return value;
  }
  Object.freeze(value);
  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return value;
}
