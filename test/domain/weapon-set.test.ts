import { describe, expect, it } from "vitest";

import { analyzeWeaponSet, collectEquipmentAttributeRankAdjustments } from "../../src/domain";
import { attributes, buildFixture } from "../fixtures/rule-engine/builds";
import { attributeIds, professionAttributeCatalog } from "../fixtures/rule-engine/catalogs";
import {
  equipmentRuneCatalog,
  equipmentWeaponCatalog,
  equipmentWeaponModifierCatalog,
  weaponIds,
  weaponModifierIds
} from "../fixtures/rule-engine/equipment-catalogs";
import {
  knownAttribute,
  knownWeapon,
  knownWeaponModifier,
  loadoutWithArmor,
  unresolvedSelection,
  weaponHand,
  weaponSet
} from "../fixtures/rule-engine/equipment";

describe("weapon-set analysis", () => {
  it("distinguishes empty, one-handed pair, off-hand-only, and legal two-handed occupancy", () => {
    expect(analyze(set("set-1")).occupancy).toBe("empty");
    expect(
      analyze(
        set("set-1", {
          mainHand: weaponHand({ weapon: knownWeapon(weaponIds.sword) }),
          offHand: weaponHand({ weapon: knownWeapon(weaponIds.shield) })
        })
      ).occupancy
    ).toBe("paired");
    expect(
      analyze(set("set-1", { offHand: weaponHand({ weapon: knownWeapon(weaponIds.shield) }) }))
        .occupancy
    ).toBe("off-hand-only");
    expect(
      analyze(set("set-1", { mainHand: weaponHand({ weapon: knownWeapon(weaponIds.bow) }) }))
        .occupancy
    ).toBe("two-handed");
  });

  it("reports wrong-hand and two-handed off-hand conflicts without moving selections", () => {
    const wrongHand = analyze(
      set("set-1", { offHand: weaponHand({ weapon: knownWeapon(weaponIds.bow) }) })
    );
    const conflict = analyze(
      set("set-1", {
        mainHand: weaponHand({ weapon: knownWeapon(weaponIds.bow) }),
        offHand: weaponHand({ weapon: knownWeapon(weaponIds.shield) })
      })
    );

    expect(wrongHand.occupancy).toBe("conflict");
    expect(wrongHand.issues.map((issue) => issue.code)).toEqual(["weapon-wrong-hand"]);
    expect(conflict.occupancy).toBe("conflict");
    expect(conflict.issues.map((issue) => issue.code)).toEqual(["weapon-occupancy-conflict"]);
    expect(conflict.set.offHand?.weapon).toEqual(knownWeapon(weaponIds.shield));
  });

  it("delegates modifier compatibility and enforces duplicate occupied slots per weapon", () => {
    const compatible = analyze(
      set("set-1", {
        mainHand: weaponHand({
          weapon: knownWeapon(weaponIds.sword),
          modifiers: [
            knownWeaponModifier(weaponModifierIds.swordPrefix),
            knownWeaponModifier(weaponModifierIds.swordSuffix)
          ]
        })
      })
    );
    const incompatible = analyze(
      set("set-1", {
        mainHand: weaponHand({
          weapon: knownWeapon(weaponIds.shield),
          modifiers: [knownWeaponModifier(weaponModifierIds.swordPrefix)]
        })
      })
    );
    const duplicateSlot = analyze(
      set("set-1", {
        mainHand: weaponHand({
          weapon: knownWeapon(weaponIds.sword),
          modifiers: [
            knownWeaponModifier(weaponModifierIds.swordSuffix),
            knownWeaponModifier(weaponModifierIds.secondSwordSuffix)
          ]
        })
      })
    );

    expect(compatible.issues).toEqual([]);
    expect(incompatible.issues.map((issue) => issue.code)).toContain(
      "weapon-modifier-incompatible"
    );
    expect(duplicateSlot.issues.map((issue) => issue.code)).toContain(
      "weapon-modifier-duplicate-slot"
    );
  });

  it("preserves unresolved weapons, modifiers, and modifiers without resolved weapons", () => {
    const analysis = analyze(
      set("set-1", {
        mainHand: weaponHand({
          weapon: unresolvedSelection(),
          modifiers: [unresolvedSelection(), knownWeaponModifier(weaponModifierIds.swordSuffix)]
        })
      })
    );

    expect(analysis.occupancy).toBe("unresolved");
    expect([...analysis.issues.map((issue) => issue.code)].sort()).toEqual([
      "weapon-modifier-unresolved",
      "weapon-modifier-without-weapon",
      "weapon-unresolved"
    ]);
  });

  it("uses catalog requirements before authored fallback and emits advisory unmet warnings", () => {
    const build = buildFixture({
      attributes: attributes([attributeIds.tactics, 8]),
      equipment: loadoutWithArmor({
        head: { headgearAttribute: knownAttribute(attributeIds.tactics) }
      })
    });
    const adjustments = collectEquipmentAttributeRankAdjustments({
      build,
      professionAttributes: professionAttributeCatalog,
      runes: equipmentRuneCatalog
    });
    const met = analyze(
      set("set-1", { offHand: weaponHand({ weapon: knownWeapon(weaponIds.shield) }) }),
      build,
      adjustments.adjustments
    );
    const unmet = analyze(
      set("set-1", { offHand: weaponHand({ weapon: knownWeapon(weaponIds.shield) }) }),
      buildFixture({ attributes: attributes([attributeIds.tactics, 1]) }),
      []
    );

    expect(met.issues).toEqual([]);
    expect(unmet.issues.map((issue) => issue.code)).toEqual(["weapon-requirement-unmet"]);
    expect(unmet.issues[0]?.severity).toBe("warning");
  });

  it("treats catalog-set mismatches and unresolved adjustment evidence as unresolved", () => {
    const mismatched = analyzeWeaponSet({
      weaponSet: set("set-1", {
        mainHand: weaponHand({
          weapon: knownWeapon(weaponIds.sword),
          modifiers: [knownWeaponModifier(weaponModifierIds.swordSuffix)]
        })
      }),
      weapons: equipmentWeaponCatalog,
      weaponModifiers: {
        ...equipmentWeaponModifierCatalog,
        catalogSetDigest: "different"
      }
    });
    const requirement = analyzeWeaponSet({
      weaponSet: set("set-1", {
        offHand: weaponHand({ weapon: knownWeapon(weaponIds.shield) })
      }),
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 12]) }),
      professionAttributes: professionAttributeCatalog,
      rankAdjustmentsUnresolved: true,
      weapons: equipmentWeaponCatalog,
      weaponModifiers: equipmentWeaponModifierCatalog
    });

    expect([...mismatched.issues.map((issue) => issue.code)].sort()).toEqual([
      "catalog-set-mismatch",
      "weapon-modifier-compatibility-unresolved"
    ]);
    expect(requirement.issues.map((issue) => issue.code)).toEqual([
      "weapon-requirement-unresolved"
    ]);
  });
});

function set(slot: "set-1", input = {}) {
  return weaponSet(slot, input);
}

function analyze(
  weaponSetInput: ReturnType<typeof weaponSet>,
  build = buildFixture({ attributes: attributes([attributeIds.tactics, 9]) }),
  rankAdjustments: Parameters<typeof analyzeWeaponSet>[0]["rankAdjustments"] = []
) {
  return analyzeWeaponSet({
    weaponSet: weaponSetInput,
    build,
    professionAttributes: professionAttributeCatalog,
    rankAdjustments,
    weapons: equipmentWeaponCatalog,
    weaponModifiers: equipmentWeaponModifierCatalog
  });
}
