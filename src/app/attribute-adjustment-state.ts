import {
  cloneAttributeAdjustments,
  emptyAttributeAdjustments,
  isAttributeAdjustments,
  type AssumedEffectId,
  type AssumedEffectPreference,
  type AttributeId,
  type AttributeAdjustments,
  type Build,
  type HeadgearOverride,
  type RuneId
} from "../domain";

export type AttributeAdjustmentAction =
  | {
      readonly type: "set-attribute-rune";
      readonly attributeId: AttributeId;
      readonly runeId: RuneId | null;
    }
  | { readonly type: "reset-attribute-rune"; readonly attributeId: AttributeId }
  | { readonly type: "set-attribute-headgear"; readonly override: HeadgearOverride }
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
        runeOverrides: [
          ...current.runeOverrides.filter((row) => row.attributeId !== action.attributeId),
          { attributeId: action.attributeId, runeId: action.runeId }
        ]
      });
    case "reset-attribute-rune":
      return withAttributeAdjustments(build, {
        ...current,
        runeOverrides: current.runeOverrides.filter((row) => row.attributeId !== action.attributeId)
      });
    case "set-attribute-headgear":
      return withAttributeAdjustments(build, { ...current, headgearOverride: action.override });
    case "set-assumed-effect":
      return withAttributeAdjustments(build, {
        ...current,
        effectPreferences: [
          ...current.effectPreferences.filter((row) => row.effectId !== action.value.effectId),
          action.value
        ]
      });
    case "reset-assumed-effect":
      return withAttributeAdjustments(build, {
        ...current,
        effectPreferences: current.effectPreferences.filter(
          (row) => row.effectId !== action.effectId
        )
      });
  }
}

export function clearCompactGear(build: Build): Build {
  if (build.attributeAdjustments === null) return build;
  return withAttributeAdjustments(build, {
    ...build.attributeAdjustments,
    headgearOverride: null,
    runeOverrides: []
  });
}

export function invalidateCompactGear(
  build: Build,
  runeAttributeIds: readonly AttributeId[],
  headgear: boolean
): Build {
  const current = build.attributeAdjustments;
  if (current === null) return build;
  return withAttributeAdjustments(build, {
    ...current,
    headgearOverride: headgear ? null : current.headgearOverride,
    runeOverrides: current.runeOverrides.filter(
      (row) => !runeAttributeIds.includes(row.attributeId)
    )
  });
}

function withAttributeAdjustments(build: Build, value: AttributeAdjustments | null): Build {
  if (!isAttributeAdjustments(value)) return build;
  const canonical = cloneAttributeAdjustments(value);
  return JSON.stringify(build.attributeAdjustments) === JSON.stringify(canonical)
    ? build
    : { ...build, attributeAdjustments: canonical };
}
