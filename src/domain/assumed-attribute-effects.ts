import type {
  AssumedEffectId,
  AssumedEffectPreference,
  RefrainStrength
} from "./attribute-adjustments";
import type { AttributeId } from "./ids";
import type { CatalogAttributeRecord, SkillCatalog } from "./catalog";
import type { BuildValidationContext } from "./validation-context";
import { resolveEligibleSkillSource } from "./skill-source-eligibility";

export interface AssumedAttributeEffectDefinition {
  readonly id: AssumedEffectId;
  readonly label: string;
  readonly templateIds: readonly number[];
  readonly targetTemplateAttributeIds: readonly number[] | "available";
  readonly amount: number | "configured";
  readonly modes: readonly ("pve" | "pvp")[];
  readonly external: boolean;
}

/** Source identities and targets are explicit; descriptions are never executable rules. */
export const ASSUMED_ATTRIBUTE_EFFECTS: readonly AssumedAttributeEffectDefinition[] = [
  {
    id: "glyph-of-elemental-power",
    label: "Glyph of Elemental Power",
    templateIds: [198],
    targetTemplateAttributeIds: [8, 9, 10, 11],
    amount: 2,
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "elemental-lord",
    label: "Elemental Lord",
    templateIds: [1951, 2094],
    targetTemplateAttributeIds: [8, 9, 10, 11],
    amount: 1,
    modes: ["pve"],
    external: false
  },
  {
    id: "masochism",
    label: "Masochism",
    templateIds: [2139],
    targetTemplateAttributeIds: [5, 6],
    amount: 2,
    modes: ["pve"],
    external: false
  },
  {
    id: "heroic-refrain",
    label: "Heroic Refrain",
    templateIds: [3431],
    targetTemplateAttributeIds: "available",
    amount: "configured",
    modes: ["pve"],
    external: true
  }
];

export interface AssumedAttributeEffectState {
  readonly definition: AssumedAttributeEffectDefinition;
  readonly present: boolean;
  readonly preference: AssumedEffectPreference | null;
  readonly requested: boolean;
  readonly automatic: boolean;
  readonly eligible: boolean;
  readonly active: boolean;
  readonly reason: string | null;
  readonly strength: RefrainStrength;
  readonly amount: number;
  readonly targetAttributeIds: readonly AttributeId[];
}

export function resolveAssumedAttributeEffects(input: {
  readonly context: BuildValidationContext;
  readonly skillCatalog: SkillCatalog;
  readonly availableAttributes: readonly CatalogAttributeRecord[];
}): readonly AssumedAttributeEffectState[] {
  const { context, skillCatalog, availableAttributes } = input;
  const sources = context.skillSlots.map((slot) =>
    resolveEligibleSkillSource(context, skillCatalog, slot)
  );
  return ASSUMED_ATTRIBUTE_EFFECTS.map((definition) => {
    const preferences = context.build.attributeAdjustments?.effectPreferences ?? [];
    const preference = preferences.find((row) => row.effectId === definition.id) ?? null;
    const strength =
      preference?.effectId === "heroic-refrain"
        ? preference.strength
        : definition.id === "heroic-refrain"
          ? 4
          : 1;
    const targets = availableAttributes
      .filter(
        (attribute) =>
          definition.targetTemplateAttributeIds === "available" ||
          definition.targetTemplateAttributeIds.includes(Number(attribute.templateId))
      )
      .map((attribute) => attribute.id);
    const matching = sources.filter(
      (source) =>
        source.skill !== null && definition.templateIds.includes(Number(source.skill.templateId))
    );
    const present =
      !definition.external &&
      context.skillSlots.some((slot) =>
        skillCatalog.skills.some(
          (skill) =>
            Number(skill.id) === slot.numericId &&
            (definition.templateIds.includes(Number(skill.templateId)) ||
              (definition.id === "masochism" && Number(skill.templateId) === 3054))
        )
      );
    const modeEligible = context.mode !== "unknown" && definition.modes.includes(context.mode);
    const sourceEligible = definition.external || matching.some((source) => source.eligible);
    const eligible = modeEligible && sourceEligible && targets.length > 0;
    const automatic = !definition.external && eligible;
    const requested = preference === null ? automatic : preference.preference === "on";
    const active = eligible && requested;
    const reason = !modeEligible
      ? "Unavailable in the current game mode."
      : targets.length === 0
        ? "No eligible attributes in the selected professions."
        : !sourceEligible
          ? (matching.find((source) => source.reason !== null)?.reason ??
            "Required legal skill is absent from the bar.")
          : !requested
            ? "Explicitly off."
            : null;
    return {
      definition,
      present,
      preference,
      requested,
      automatic,
      eligible,
      active,
      reason,
      strength,
      amount: definition.amount === "configured" ? strength : definition.amount,
      targetAttributeIds: targets
    };
  });
}
