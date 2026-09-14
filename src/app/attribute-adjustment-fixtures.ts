import { catalogId, type AttributeAdjustments } from "../domain";

export function adjustmentProfileFixture(alternate = false): AttributeAdjustments {
  return {
    headgearOverride: alternate
      ? { kind: "none" }
      : { kind: "attribute", attributeId: catalogId<"Attribute">(0) },
    runeOverrides: [
      { attributeId: catalogId<"Attribute">(0), runeId: alternate ? null : catalogId<"Rune">(22) }
    ],
    effectPreferences: [
      { effectId: "glyph-of-elemental-power", preference: alternate ? "on" : "off" },
      {
        effectId: "heroic-refrain",
        preference: alternate ? "off" : "on",
        strength: alternate ? 2 : 4
      }
    ]
  };
}
