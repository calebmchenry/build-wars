import {
  cloneAttributeAdjustments,
  ASSUMED_ATTRIBUTE_EFFECTS,
  emptyAttributeAdjustments,
  isAttributeAdjustments,
  type AssumedEffectId,
  type AssumedEffectPreference,
  type AttributeId,
  type AttributeAdjustments,
  type Build,
  type RuneId
} from "../domain";

export type AttributeAdjustmentAction =
  | {
      readonly type: "set-attribute-rune";
      readonly attributeId: AttributeId;
      readonly runeId: RuneId | null;
    }
  | { readonly type: "set-attribute-headgear"; readonly attributeId: AttributeId | null }
  | { readonly type: "set-assumed-effect"; readonly value: AssumedEffectPreference }
  | { readonly type: "reset-assumed-effect"; readonly effectId: AssumedEffectId };

export function reduceAttributeAdjustmentAction(
  build: Build,
  action: AttributeAdjustmentAction
): Build {
  const current = build.attributeAdjustments ?? emptyAttributeAdjustments();
  switch (action.type) {
    case "set-attribute-rune":
      return withAttributeAdjustments(build, {
        ...current,
        runes: [
          ...current.runes.filter((row) => row.attributeId !== action.attributeId),
          ...(action.runeId === null
            ? []
            : [{ attributeId: action.attributeId, runeId: action.runeId }])
        ]
      });
    case "set-attribute-headgear":
      return withAttributeAdjustments(build, {
        ...current,
        headgearAttributeId: action.attributeId
      });
    case "set-assumed-effect": {
      const definition = ASSUMED_ATTRIBUTE_EFFECTS.find((e) => e.id === action.value.effectId);
      const alternatives =
        action.value.preference === "on" && definition?.exclusiveGroup !== undefined
          ? ASSUMED_ATTRIBUTE_EFFECTS.filter(
              (e) => e.id !== definition.id && e.exclusiveGroup === definition.exclusiveGroup
            ).map((e) => e.id)
          : [];
      return withAttributeAdjustments(build, {
        ...current,
        effectPreferences: [
          ...current.effectPreferences.filter(
            (row) => row.effectId !== action.value.effectId && !alternatives.includes(row.effectId)
          ),
          ...alternatives
            .filter((effectId) => effectId !== "heroic-refrain")
            .map((effectId) => ({ effectId, preference: "off" as const })),
          action.value
        ]
      });
    }
    case "reset-assumed-effect":
      return withAttributeAdjustments(build, {
        ...current,
        effectPreferences: current.effectPreferences.filter(
          (row) => row.effectId !== action.effectId
        )
      });
  }
}

export function clearAttributeGear(build: Build): Build {
  if (build.attributeAdjustments === null) return build;
  return withAttributeAdjustments(build, {
    ...build.attributeAdjustments,
    headgearAttributeId: null,
    runes: []
  });
}

function withAttributeAdjustments(build: Build, value: AttributeAdjustments | null): Build {
  if (!isAttributeAdjustments(value)) return build;
  const canonical = cloneAttributeAdjustments(value);
  return JSON.stringify(build.attributeAdjustments) === JSON.stringify(canonical)
    ? build
    : { ...build, attributeAdjustments: canonical };
}
