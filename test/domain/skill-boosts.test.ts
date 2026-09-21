import { describe, expect, it } from "vitest";
import {
  catalogId,
  projectAttributePreview,
  type AssumedEffectPreference,
  type Build
} from "../../src/domain";
import { createBlankBuild } from "../../src/app/editor-state";
import { adjustmentPreviewInput } from "../fixtures/attribute-adjustment-builds";

function build(
  primary: number,
  secondary: number,
  skills: number[],
  attributes: [number, number][],
  effectPreferences: AssumedEffectPreference[] = []
): Build {
  return {
    ...createBlankBuild("Skill boosts"),
    primaryProfessionId: catalogId<"Profession">(primary),
    secondaryProfessionId: catalogId<"Profession">(secondary),
    skillBar: [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
      skills[i] === undefined ? null : catalogId<"Skill">(skills[i])
    ) as unknown as Build["skillBar"],
    attributes: attributes.map(([id, rank]) => ({ attributeId: catalogId<"Attribute">(id), rank })),
    attributeAdjustments: { headgearAttributeId: null, runes: [], effectPreferences }
  };
}
const preview = (b: Build) => projectAttributePreview(adjustmentPreviewInput(b));
const rank = (p: ReturnType<typeof preview>, id: number) =>
  p.ranks.get(catalogId<"Attribute">(id))!;
const refrain: AssumedEffectPreference = {
  effectId: "heroic-refrain",
  preference: "on",
  strength: 4
};

describe("additional skill boosts", () => {
  it.each([
    [4, 6, 111, 4, 12, 4, 14],
    [4, 6, 111, 4, 12, 7, 2],
    [4, 6, 114, 5, 12, 5, 13],
    [6, 4, 206, 11, 12, 11, 13],
    [6, 4, 164, 12, 7, 10, 1],
    [6, 4, 164, 12, 8, 10, 2],
    [6, 4, 199, 12, 12, 10, 2],
    [1, 6, 199, 17, 12, 10, 1],
    [2, 4, 1724, 25, 12, 25, 14],
    [2, 4, 946, 23, 12, 24, 3],
    [7, 6, 3428, 35, 12, 35, 16],
    [1, 6, 3426, 17, 12, 29, 12]
  ])(
    "projects skill %i/%i/%i using its source rank",
    (primary, secondary, skill, source, value, target, expected) => {
      const p = preview(build(primary!, secondary!, [skill!], [[source!, value!]]));
      expect(rank(p, target!).effective).toBe(expected);
      expect(p.activeEffectCount).toBe(1);
    }
  );

  it("resolves Expert's Dexterity mode variants from either authored identity", () => {
    for (const id of [1724, 2959]) {
      const b = build(2, 4, [id], [[25, 12]]);
      expect(rank(preview(b), 25).effective).toBe(14);
      expect(rank(preview({ ...b, mode: "pvp" }), 25).effective).toBe(13);
    }
  });

  it("gates zero-strength, absent, wrong-profession, and PvE-only sources", () => {
    expect(
      preview(build(2, 4, [946], [])).effects.find((e) => e.definition.id === "trappers-focus")
    ).toMatchObject({ eligible: false, active: false, amount: 0 });
    expect(
      preview(build(6, 4, [], [], [{ effectId: "elemental-attunement", preference: "on" }]))
        .activeEffectCount
    ).toBe(0);
    expect(preview(build(1, 4, [164], [])).activeEffectCount).toBe(0);
    expect(preview({ ...build(7, 1, [3428, 3426], []), mode: "pvp" }).activeEffectCount).toBe(0);
  });

  it("uses other active boosts for scaling without repeatedly self-amplifying Shadow Theft", () => {
    const p = preview(build(7, 6, [3428], [[35, 12]], [refrain]));
    expect(p.effects.find((e) => e.definition.id === "shadow-theft")?.amount).toBe(5);
    expect(rank(p, 35)).toMatchObject({ effective: 20, uncapped: 21 });
    expect(rank(p, 10).effective).toBe(9);
    const traps = preview(build(2, 4, [946], [[23, 12]], [refrain]));
    expect(traps.effects.find((e) => e.definition.id === "trappers-focus")?.amount).toBe(4);
  });

  it("grants all seven weapon attributes without spreading Heroic Refrain to newly granted ones", () => {
    const b = build(1, 6, [3426], [[17, 12]], [refrain]);
    const p = preview(b);
    for (const id of [18, 19, 20, 25, 29, 37, 41]) expect(rank(p, id).available).toBe(true);
    expect(rank(p, 18).effective).toBe(20);
    expect(rank(p, 29)).toMatchObject({ base: 0, effective: 16, gearEligible: false });
    expect(rank(p, 29).contributions.map((c) => c.label)).toEqual(["Seven Weapons Stance"]);
    expect(b.attributes).toEqual([{ attributeId: 17, rank: 12 }]);
  });

  it("replaces equipment and base ranks for Master of Magic, then applies assumed skill bonuses", () => {
    const b = build(
      6,
      4,
      [1378, 1951],
      [
        [12, 12],
        [10, 12]
      ]
    );
    const p = preview({
      ...b,
      attributeAdjustments: {
        ...b.attributeAdjustments!,
        headgearAttributeId: catalogId<"Attribute">(10)
      }
    });
    expect(rank(p, 10)).toMatchObject({ base: 12, equipmentAdjusted: 13, effective: 14 });
    expect(rank(p, 8).effective).toBe(14);
    expect(rank(p, 10).contributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "headgear", active: false }),
        expect.objectContaining({ label: "Master of Magic", operation: "set", amount: 13 })
      ])
    );
    expect(rank(preview(build(6, 4, [1378], [[12, 12]], [refrain])), 10).effective).toBe(18);
  });

  it("keeps Ritual Lord and rank substitutions out of actual attribute totals", () => {
    const ritual = preview(
      build(
        8,
        5,
        [1217],
        [
          [36, 12],
          [32, 12]
        ]
      )
    );
    expect(rank(ritual, 36).effective).toBe(12);
    expect(rank(ritual, 32).effective).toBe(12);
    expect(ritual.effects.find((e) => e.definition.id === "ritual-lord")?.amount).toBe(4);
    const mesmer = preview(
      build(
        5,
        6,
        [1346, 1340],
        [
          [1, 12],
          [0, 8]
        ]
      )
    );
    expect(rank(mesmer, 1).effective).toBe(12);
    expect(rank(mesmer, 0).effective).toBe(8);
    expect(rank(mesmer, 10).effective).toBe(0);
    expect(mesmer.activeEffectCount).toBe(2);
  });

  it("never stacks two glyphs or two stances, with explicit choice overriding bar order", () => {
    const b = build(6, 4, [198, 199], [[12, 12]]);
    const p = preview(b);
    expect(rank(p, 10).effective).toBe(2);
    expect(p.effects.find((e) => e.definition.id === "glyph-of-energy")).toMatchObject({
      eligible: true,
      requested: false,
      active: false
    });
    const selected = preview({
      ...b,
      attributeAdjustments: {
        ...b.attributeAdjustments!,
        effectPreferences: [{ effectId: "glyph-of-energy", preference: "on" }]
      }
    });
    expect(selected.effects.find((e) => e.definition.id === "glyph-of-energy")?.active).toBe(true);
    expect(
      selected.effects.find((e) => e.definition.id === "glyph-of-elemental-power")?.active
    ).toBe(false);
    const stances = preview(build(1, 2, [3426, 1724], [[17, 12]]));
    expect(rank(stances, 25).effective).toBe(12);
    expect(stances.activeEffectCount).toBe(1);
  });

  it("does not fabricate a scaled bonus from unresolved equipment", () => {
    const b = build(6, 4, [164], [[12, 12]]);
    const p = preview({
      ...b,
      attributeAdjustments: {
        ...b.attributeAdjustments!,
        runes: [{ attributeId: catalogId<"Attribute">(12), runeId: catalogId<"Rune">(99999) }]
      }
    });
    expect(p.effects.find((e) => e.definition.id === "elemental-attunement")).toMatchObject({
      eligible: false,
      active: false,
      amount: null
    });
    expect(rank(p, 10).effective).toBe(0);
  });
});
