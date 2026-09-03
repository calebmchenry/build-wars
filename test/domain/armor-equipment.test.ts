import { describe, expect, it } from "vitest";

import {
  calculateEffectiveAttributeRank,
  collectEquipmentAttributeRankAdjustments,
  equipmentAdjustmentsForAttribute,
  type EquipmentLoadout
} from "../../src/domain";
import { attributes, buildFixture } from "../fixtures/rule-engine/builds";
import { attributeIds, professionAttributeCatalog } from "../fixtures/rule-engine/catalogs";
import { equipmentRuneCatalog, runeIds } from "../fixtures/rule-engine/equipment-catalogs";
import {
  knownAttribute,
  knownRune,
  loadoutWithArmor,
  loadoutWithArmorRows,
  unresolvedSelection
} from "../fixtures/rule-engine/equipment";

describe("armor equipment rank adjustments", () => {
  it("combines valid headgear and highest-per-attribute rune adjustments", () => {
    const build = buildFixture({
      attributes: attributes([attributeIds.axeMastery, 8]),
      equipment: loadoutWithArmor({
        head: {
          headgearAttribute: knownAttribute(attributeIds.axeMastery),
          rune: knownRune(runeIds.minorAxe)
        },
        chest: {
          rune: knownRune(runeIds.superiorAxe)
        }
      })
    });

    const summary = collectEquipmentAttributeRankAdjustments({
      build,
      professionAttributes: professionAttributeCatalog,
      runes: equipmentRuneCatalog
    });
    const effective = calculateEffectiveAttributeRank({
      build,
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.axeMastery,
      adjustments: equipmentAdjustmentsForAttribute(summary, attributeIds.axeMastery)
    });

    expect(summary.unresolved).toEqual([]);
    expect(summary.adjustments.map((item) => [item.source, item.adjustment.amount])).toEqual([
      ["headgear", 1],
      ["rune", 3]
    ]);
    expect(effective).toMatchObject({ kind: "resolved", finalRank: 12 });
  });

  it("allows a valid unallocated headgear target to resolve from base rank zero", () => {
    const build = buildFixture({
      attributes: [],
      equipment: loadoutWithArmor({
        head: { headgearAttribute: knownAttribute(attributeIds.tactics) }
      })
    });

    const summary = collectEquipmentAttributeRankAdjustments({
      build,
      professionAttributes: professionAttributeCatalog,
      runes: equipmentRuneCatalog
    });
    const effective = calculateEffectiveAttributeRank({
      build,
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics,
      adjustments: equipmentAdjustmentsForAttribute(summary, attributeIds.tactics)
    });

    expect(effective).toMatchObject({
      kind: "resolved",
      baseSource: "unallocated",
      finalRank: 1
    });
  });

  it("preserves invalid and unresolved armor selections without optimistic adjustments", () => {
    const loadout = loadoutWithArmor({
      head: {
        headgearAttribute: knownAttribute(attributeIds.marksmanship),
        rune: knownRune(runeIds.rangerMarksmanship)
      },
      chest: {
        headgearAttribute: unresolvedSelection(),
        rune: unresolvedSelection()
      }
    });
    const summary = collectEquipmentAttributeRankAdjustments({
      build: buildFixture({ equipment: loadout }),
      professionAttributes: professionAttributeCatalog,
      runes: equipmentRuneCatalog
    });

    expect(summary.adjustments).toEqual([]);
    expect(summary.unresolved.map((reason) => reason.code)).toEqual([
      "headgear-attribute-invalid",
      "rune-restricted",
      "headgear-slot-invalid",
      "rune-unresolved"
    ]);
  });

  it("keeps output stable for duplicate and non-canonical armor rows", () => {
    const canonical = loadoutWithArmor({
      head: { headgearAttribute: knownAttribute(attributeIds.axeMastery) },
      feet: { rune: knownRune(runeIds.superiorAxe) }
    });
    const shuffled: EquipmentLoadout = loadoutWithArmorRows([
      canonical.armor[4]!,
      canonical.armor[1]!,
      canonical.armor[0]!,
      canonical.armor[0]!
    ]);

    const first = collectEquipmentAttributeRankAdjustments({
      build: buildFixture({ equipment: shuffled }),
      professionAttributes: professionAttributeCatalog,
      runes: equipmentRuneCatalog
    });
    const second = collectEquipmentAttributeRankAdjustments({
      build: buildFixture({ equipment: shuffled }),
      professionAttributes: professionAttributeCatalog,
      runes: equipmentRuneCatalog
    });

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
