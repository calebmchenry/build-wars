import { describe, expect, it } from "vitest";

import {
  ARMOR_SLOTS,
  EQUIPMENT_LOADOUT_SCHEMA_VERSION,
  WEAPON_SET_SLOTS,
  catalogId,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  unresolvedEquipmentSelection,
  type AttributeId,
  type Build,
  type EquipmentLoadout,
  type EquipmentTemplate,
  type RuneId,
  type WeaponId,
  type WeaponModifierId
} from "../../src/domain";
import { buildFixture } from "../fixtures/rule-engine/builds";

describe("equipment authored contract", () => {
  it("constructs canonical empty armor and weapon-set topology", () => {
    const loadout = createEmptyEquipmentLoadout();

    expect(loadout.schemaVersion).toBe(EQUIPMENT_LOADOUT_SCHEMA_VERSION);
    expect(loadout.armor.map((piece) => piece.slot)).toEqual(ARMOR_SLOTS);
    expect(loadout.armor.every((piece) => piece.rune === null)).toBe(true);
    expect(loadout.armor.every((piece) => piece.insignia === null)).toBe(true);
    expect(loadout.armor.every((piece) => piece.headgearAttribute === null)).toBe(true);
    expect(loadout.weaponSets.map((set) => set.slot)).toEqual(WEAPON_SET_SLOTS);
    expect(loadout.weaponSets.every((set) => set.mainHand === null && set.offHand === null)).toBe(
      true
    );
  });

  it("keeps EquipmentTemplate only as a compatibility alias for EquipmentLoadout", () => {
    const loadout: EquipmentLoadout = createEmptyEquipmentLoadout();
    const alias: EquipmentTemplate = loadout;

    expect(alias).toBe(loadout);
  });

  it("lets builds distinguish null equipment from an authored empty loadout", () => {
    const nullEquipment: Build = buildFixture({ equipment: null });
    const emptyEquipment: Build = buildFixture({ equipment: createEmptyEquipmentLoadout() });

    expect(nullEquipment.equipment).toBeNull();
    expect(emptyEquipment.equipment?.armor).toHaveLength(5);
    expect(emptyEquipment.equipment?.weaponSets).toHaveLength(4);
  });

  it("represents partial, known, stale, and explicitly unresolved states as plain JSON", () => {
    const staleRuneId = catalogId<"Rune">(999_999) as RuneId;
    const loadout: EquipmentLoadout = {
      schemaVersion: EQUIPMENT_LOADOUT_SCHEMA_VERSION,
      armor: [
        {
          slot: "head",
          rune: knownEquipmentSelection(staleRuneId),
          insignia: unresolvedEquipmentSelection({
            label: "Legacy insignia",
            reason: "catalog record was not promoted",
            candidateCatalogId: 7001
          }),
          headgearAttribute: knownEquipmentSelection(catalogId<"Attribute">(17) as AttributeId)
        },
        ...createEmptyEquipmentLoadout().armor.slice(1)
      ],
      weaponSets: [
        {
          slot: "set-1",
          mainHand: {
            weapon: knownEquipmentSelection(catalogId<"Weapon">(301) as WeaponId),
            modifiers: [
              knownEquipmentSelection(catalogId<"WeaponModifier">(401) as WeaponModifierId),
              unresolvedEquipmentSelection({
                reason: "modifier source is no longer resolved",
                candidateCatalogId: 402
              })
            ],
            requirement: {
              attribute: knownEquipmentSelection(catalogId<"Attribute">(18) as AttributeId),
              rank: 9,
              reason: "catalog-unresolved"
            }
          },
          offHand: null
        },
        ...createEmptyEquipmentLoadout().weaponSets.slice(1)
      ]
    };

    const decoded = JSON.parse(JSON.stringify(loadout)) as EquipmentLoadout;

    expect(decoded).toEqual(loadout);
    expect(Object.getPrototypeOf(decoded)).toBe(Object.prototype);
  });

  it("keeps prohibited raw template and cosmetic fields out of semantic state", () => {
    const encoded = JSON.stringify(createEmptyEquipmentLoadout());

    expect(encoded).not.toMatch(
      /template(Item|Modifier|Color|Slot)Id|itemId|modifierIds|colorId|skin|dye|wikiUrl|acquisition|inventory|media/i
    );
  });
});
