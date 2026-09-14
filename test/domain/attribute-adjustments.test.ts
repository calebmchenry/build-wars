import { describe, expect, it } from "vitest";
import {
  ASSUMED_ATTRIBUTE_EFFECTS,
  catalogId,
  cloneAttributeAdjustments,
  emptyAttributeAdjustments,
  hasAuthoredAttributeAdjustments,
  isAttributeAdjustments,
  type AttributeAdjustments
} from "../../src/domain";
import fixture from "../fixtures/attribute-adjustments.json";
import skills from "../../data/generated/epic-04/skills.catalog.json";
import runes from "../../data/generated/epic-10/runes.catalog.json";

const profile: AttributeAdjustments = {
  headgearOverride: { kind: "none" },
  runeOverrides: [
    { attributeId: catalogId<"Attribute">(10), runeId: null },
    { attributeId: catalogId<"Attribute">(0), runeId: catalogId<"Rune">(0) }
  ],
  effectPreferences: [
    { effectId: "heroic-refrain", preference: "off", strength: 4 },
    { effectId: "masochism", preference: "off" }
  ]
};
describe("attribute adjustment contract", () => {
  it("normalizes neutral state, preserves explicit None/off, and clones canonically", () => {
    expect(cloneAttributeAdjustments(emptyAttributeAdjustments())).toBeNull();
    const cloned = cloneAttributeAdjustments(profile)!;
    expect(hasAuthoredAttributeAdjustments(cloned)).toBe(true);
    expect(cloned).toEqual(
      cloneAttributeAdjustments({
        ...profile,
        runeOverrides: [...profile.runeOverrides].reverse(),
        effectPreferences: [...profile.effectPreferences].reverse()
      })
    );
    expect(cloned).not.toBe(profile);
    expect(cloned.runeOverrides[0]?.attributeId).toBe(0);
    expect(cloned.runeOverrides[1]?.runeId).toBeNull();
    expect(cloned.effectPreferences[1]).toEqual({
      effectId: "heroic-refrain",
      preference: "off",
      strength: 4
    });
  });
  it("accepts unknown well-formed IDs without catalog lookup", () => {
    expect(isAttributeAdjustments(profile)).toBe(true);
    expect(
      isAttributeAdjustments({
        ...profile,
        runeOverrides: [{ attributeId: Number.MAX_SAFE_INTEGER, runeId: 999999 }]
      })
    ).toBe(true);
  });
  it.each([
    undefined,
    {},
    { ...profile, extra: true },
    { ...profile, headgearOverride: { kind: "none", attributeId: 0 } },
    { ...profile, runeOverrides: [...profile.runeOverrides, profile.runeOverrides[0]] },
    { ...profile, runeOverrides: [{ attributeId: -1, runeId: null }] },
    { ...profile, runeOverrides: [{ attributeId: 0.5, runeId: null }] },
    { ...profile, runeOverrides: [{ attributeId: 0, runeId: Infinity }] },
    {
      ...profile,
      runeOverrides: Array.from({ length: 65 }, (_, attributeId) => ({ attributeId, runeId: null }))
    },
    { ...profile, runeOverrides: Array(2) },
    { ...profile, effectPreferences: [{ effectId: "unknown", preference: "on" }] },
    { ...profile, effectPreferences: [{ effectId: "masochism", preference: "auto" }] },
    { ...profile, effectPreferences: [{ effectId: "masochism", preference: "on", strength: 2 }] },
    {
      ...profile,
      effectPreferences: [{ effectId: "heroic-refrain", preference: "on", strength: 4.5 }]
    },
    { ...profile, effectPreferences: [profile.effectPreferences[0], profile.effectPreferences[0]] }
  ])("rejects malformed authored input: %#", (input) =>
    expect(isAttributeAdjustments(input)).toBe(false)
  );
  it("pins six unique catalog/template identities and mode split members", () => {
    for (const expected of fixture.skills) {
      const matches = skills.skills.filter((skill) => skill.templateId === expected.templateId);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject(expected);
    }
    expect(
      fixture.skills.filter((s) => s.splitGroupId === "split:skill:2139").map((s) => s.templateId)
    ).toEqual([2139, 3054]);
    expect(
      ASSUMED_ATTRIBUTE_EFFECTS.map((effect) => [
        effect.id,
        effect.targetTemplateAttributeIds,
        effect.amount
      ])
    ).toEqual([
      ["glyph-of-elemental-power", [8, 9, 10, 11], 2],
      ["elemental-lord", [8, 9, 10, 11], 1],
      ["masochism", [5, 6], 2],
      ["heroic-refrain", "available", "configured"]
    ]);
    for (const rune of fixture.runes)
      expect(runes.runes.find((r) => r.id === rune.id)).toMatchObject(rune);
  });
});
