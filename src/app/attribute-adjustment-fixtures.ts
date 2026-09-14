import { catalogId, type AttributeAdjustments } from "../domain";

export function adjustmentProfileFixture(alternate = false): AttributeAdjustments {
  return {
    headgearAttributeId: alternate ? null : catalogId<"Attribute">(0),
    runes: alternate
      ? []
      : [{ attributeId: catalogId<"Attribute">(0), runeId: catalogId<"Rune">(22) }],
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
