import { describe, expect, it } from "vitest";
import {
  catalogId,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  projectAttributePreview,
  unresolvedEquipmentSelection,
  type Build
} from "../../src/domain";
import {
  elementalBuild,
  fireId,
  fireRune,
  adjustmentPreviewInput
} from "../fixtures/attribute-adjustment-builds";

const preview = (build: Build) => projectAttributePreview(adjustmentPreviewInput(build));
const fire = (build: Build) => preview(build).ranks.get(fireId)!;
function gear(rune: number | "unknown", head: number | "unknown" | null = null) {
  const blank = createEmptyEquipmentLoadout();
  return {
    ...blank,
    armor: blank.armor.map((piece) =>
      piece.slot !== "head"
        ? piece
        : {
            ...piece,
            rune:
              rune === "unknown"
                ? unresolvedEquipmentSelection({
                    label: "Unknown rune",
                    reason: "Retained evidence"
                  })
                : knownEquipmentSelection(catalogId<"Rune">(rune)),
            headgearAttribute:
              head === null
                ? null
                : head === "unknown"
                  ? unresolvedEquipmentSelection({
                      label: "Unknown headgear",
                      reason: "Retained evidence"
                    })
                  : knownEquipmentSelection(catalogId<"Attribute">(head))
          }
    )
  };
}
describe("shared attribute preview", () => {
  it("keeps equipment 16, assumed 19, uncapped 23/capped 20 with all three effects counted", () => {
    const base = elementalBuild();
    expect(fire(base)).toMatchObject({
      base: 12,
      equipmentAdjusted: 16,
      effective: 16,
      clipped: 0
    });
    const self = elementalBuild({
      skillBar: [
        catalogId<"Skill">(198),
        catalogId<"Skill">(1951),
        null,
        null,
        null,
        null,
        null,
        null
      ]
    });
    expect(fire(self)).toMatchObject({ equipmentAdjusted: 16, uncapped: 19, effective: 19 });
    const capped = {
      ...self,
      attributeAdjustments: {
        ...self.attributeAdjustments!,
        effectPreferences: [
          { effectId: "heroic-refrain" as const, preference: "on" as const, strength: 4 as const }
        ]
      }
    };
    expect(fire(capped)).toMatchObject({
      base: 12,
      equipmentAdjusted: 16,
      uncapped: 23,
      effective: 20,
      clipped: 3
    });
    expect(preview(capped).activeEffectCount).toBe(3);
    expect(
      fire(capped)
        .contributions.filter((c) => c.active)
        .map((c) => c.amount)
    ).toEqual([1, 3, 2, 1, 4]);
  });
  it("replaces inherited highest runes without double counting and distinguishes None/inherit", () => {
    const equipment = gear(Number(fireRune("minor").id), 10);
    const inherited = elementalBuild({ equipment, attributeAdjustments: null });
    expect(fire(inherited).effective).toBe(14);
    const replaced = elementalBuild({ equipment });
    expect(fire(replaced).effective).toBe(16);
    expect(
      fire(replaced)
        .contributions.filter((c) => c.suppressed)
        .map((c) => c.amount)
    ).toEqual([1, 1]);
    const none = elementalBuild({
      equipment,
      attributeAdjustments: {
        headgearOverride: { kind: "none" },
        runeOverrides: [{ attributeId: fireId, runeId: null }],
        effectPreferences: []
      }
    });
    expect(fire(none).effective).toBe(12);
    expect(none.equipment).toBe(equipment);
  });
  it("supports unallocated primary ranks without allocating points", () => {
    const build = elementalBuild({ attributes: [] });
    expect(fire(build)).toMatchObject({ base: 0, effective: 4 });
    expect(build.attributes).toEqual([]);
  });
  it("scopes unknown inherited rune/headgear evidence and resolves only overridden components", () => {
    const build = elementalBuild({
      equipment: gear("unknown", "unknown"),
      attributeAdjustments: null
    });
    expect(fire(build).effective).toBeNull();
    expect(preview(build).ranks.get(catalogId<"Attribute">(5))?.effective).toBe(0);
    const runeOnly = {
      ...build,
      attributeAdjustments: {
        headgearOverride: null,
        runeOverrides: [{ attributeId: fireId, runeId: null }],
        effectPreferences: []
      }
    };
    expect(fire(runeOnly).effective).toBeNull();
    const both = elementalBuild({ equipment: build.equipment });
    expect(fire(both).effective).toBe(16);
    expect(preview(both).ranks.get(catalogId<"Attribute">(8))?.effective).toBeNull();
    expect(
      fire(both)
        .diagnostics.filter((d) => d.uncertain)
        .every((d) => d.suppressed)
    ).toBe(true);
  });
  it("does not grant incompatible compact runes or revive suppressed legacy contributions", () => {
    const build = elementalBuild({
      equipment: gear(Number(fireRune("minor").id)),
      attributeAdjustments: {
        headgearOverride: null,
        runeOverrides: [{ attributeId: fireId, runeId: catalogId<"Rune">(22) }],
        effectPreferences: []
      }
    });
    expect(fire(build)).toMatchObject({ effective: 12 });
    expect(fire(build).diagnostics.map((d) => d.code)).toContain("rune-ineligible");
    const unknown = {
      ...build,
      attributeAdjustments: {
        ...build.attributeAdjustments!,
        runeOverrides: [{ attributeId: fireId, runeId: catalogId<"Rune">(99999) }]
      }
    };
    expect(fire(unknown).effective).toBeNull();
  });
  it.each([-1, 0.5, 13, 21, Infinity, NaN])(
    "does not hide invalid purchased rank %s behind the cap",
    (rank) => {
      expect(
        fire(elementalBuild({ attributes: [{ attributeId: fireId, rank }] })).effective
      ).toBeNull();
    }
  );
  it("keeps duplicate and retained allocations unresolved, unrelated allocations independent", () => {
    expect(
      fire(
        elementalBuild({
          attributes: [
            { attributeId: fireId, rank: 12 },
            { attributeId: fireId, rank: 1 }
          ]
        })
      ).effective
    ).toBeNull();
    const build = elementalBuild({
      attributes: [
        { attributeId: fireId, rank: 12 },
        { attributeId: catalogId<"Attribute">(9), rank: 12 },
        { attributeId: catalogId<"Attribute">(8), rank: 12 }
      ]
    });
    expect(fire(build).effective).toBe(16); // over budget remains a separate base validation issue
    expect(
      fire(
        elementalBuild({
          primaryProfessionId: catalogId<"Profession">(1),
          secondaryProfessionId: null
        })
      ).effective
    ).toBeNull();
  });
  it("provides known zero for unallocated off-profession catalog skills, including Any", () => {
    const build = elementalBuild({
      attributes: [],
      primaryProfessionId: null,
      attributeAdjustments: null
    });
    expect(fire(build)).toMatchObject({
      base: 0,
      effective: 0,
      available: false,
      gearEligible: false
    });
    expect(preview(build).activeEffectCount).toBe(0);
    expect(preview(build).ranks.has(catalogId<"Attribute">(99999))).toBe(false);
  });
});
