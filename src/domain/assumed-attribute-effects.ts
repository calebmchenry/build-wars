import type {
  AssumedEffectId,
  AssumedEffectPreference,
  RefrainStrength
} from "./attribute-adjustments";
import type { AttributeId } from "./ids";
import type { CatalogAttributeRecord, SkillCatalog } from "./catalog";
import type { BuildValidationContext } from "./validation-context";
import { resolveEligibleSkillSource } from "./skill-source-eligibility";
import { skillTypeMatches } from "./skill-types";

export interface AssumedAttributeEffectDefinition {
  readonly id: AssumedEffectId;
  readonly label: string;
  readonly templateIds: readonly number[];
  readonly targetTemplateAttributeIds: readonly number[] | "available";
  readonly amount: number | "configured" | "scaled";
  readonly application?: "set" | "skill-bonus" | "spell-rank" | "signet-rank";
  readonly scaling?: {
    readonly attribute: number;
    readonly zero: number;
    readonly fifteen: number;
  };
  readonly exclusiveGroup?: "glyph" | "stance";
  readonly grantsAttributes?: boolean;
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
    exclusiveGroup: "glyph",
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
  },
  {
    id: "awaken-the-blood",
    label: "Awaken the Blood",
    templateIds: [111],
    targetTemplateAttributeIds: [4, 7],
    amount: 2,
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "aura-of-the-lich",
    label: "Aura of the Lich",
    templateIds: [114],
    targetTemplateAttributeIds: [5],
    amount: 1,
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "armor-of-frost",
    label: "Armor of Frost",
    templateIds: [206],
    targetTemplateAttributeIds: [11],
    amount: 1,
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "elemental-attunement",
    label: "Elemental Attunement",
    templateIds: [164],
    targetTemplateAttributeIds: [8, 9, 10, 11],
    amount: "scaled",
    scaling: { attribute: 12, zero: 1, fifteen: 2 },
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "glyph-of-energy",
    label: "Glyph of Energy",
    templateIds: [199],
    targetTemplateAttributeIds: [8, 9, 10, 11],
    amount: "scaled",
    exclusiveGroup: "glyph",
    scaling: { attribute: 12, zero: 1, fifteen: 2 },
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "experts-dexterity",
    label: "Expert's Dexterity",
    templateIds: [1724, 2959],
    targetTemplateAttributeIds: [25],
    amount: 2,
    exclusiveGroup: "stance",
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "trappers-focus",
    label: "Trapper's Focus",
    templateIds: [946],
    targetTemplateAttributeIds: [24],
    amount: "scaled",
    scaling: { attribute: 23, zero: 0, fifteen: 4 },
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "shadow-theft",
    label: "Shadow Theft",
    templateIds: [3428],
    targetTemplateAttributeIds: "available",
    amount: "scaled",
    scaling: { attribute: 35, zero: 1, fifteen: 5 },
    modes: ["pve"],
    external: false
  },
  {
    id: "seven-weapons-stance",
    label: "Seven Weapons Stance",
    templateIds: [3426],
    targetTemplateAttributeIds: [18, 19, 20, 25, 29, 37, 41],
    amount: "scaled",
    scaling: { attribute: 17, zero: 1, fifteen: 15 },
    grantsAttributes: true,
    exclusiveGroup: "stance",
    modes: ["pve"],
    external: false
  },
  {
    id: "master-of-magic",
    label: "Master of Magic",
    templateIds: [1378],
    targetTemplateAttributeIds: [8, 9, 10, 11],
    amount: "scaled",
    application: "set",
    scaling: { attribute: 12, zero: 8, fifteen: 14 },
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "ritual-lord",
    label: "Ritual Lord",
    templateIds: [1217],
    targetTemplateAttributeIds: [32, 33, 34, 36],
    amount: "scaled",
    application: "skill-bonus",
    scaling: { attribute: 36, zero: 2, fifteen: 4 },
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "signet-of-illusions",
    label: "Signet of Illusions",
    templateIds: [1346],
    targetTemplateAttributeIds: "available",
    amount: "scaled",
    application: "spell-rank",
    scaling: { attribute: 1, zero: 0, fifteen: 15 },
    modes: ["pve", "pvp"],
    external: false
  },
  {
    id: "symbolic-celerity",
    label: "Symbolic Celerity",
    templateIds: [1340],
    targetTemplateAttributeIds: "available",
    amount: "scaled",
    application: "signet-rank",
    scaling: { attribute: 0, zero: 0, fifteen: 15 },
    modes: ["pve", "pvp"],
    external: false
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
  readonly amount: number | null;
  readonly targetAttributeIds: readonly AttributeId[];
}

export function resolveAssumedAttributeEffects(input: {
  readonly context: BuildValidationContext;
  readonly skillCatalog: SkillCatalog;
  readonly availableAttributes: readonly CatalogAttributeRecord[];
  readonly equipmentRanks: ReadonlyMap<AttributeId, number | null>;
}): readonly AssumedAttributeEffectState[] {
  const { context, skillCatalog, availableAttributes } = input;
  const sources = context.skillSlots.map((slot) =>
    resolveEligibleSkillSource(context, skillCatalog, slot)
  );
  const allAttributes = context.professionAttributes.attributes;
  const effects = ASSUMED_ATTRIBUTE_EFFECTS.map((definition): AssumedAttributeEffectState => {
    const preferences = context.build.attributeAdjustments?.effectPreferences ?? [];
    const preference = preferences.find((row) => row.effectId === definition.id) ?? null;
    const strength =
      preference?.effectId === "heroic-refrain"
        ? preference.strength
        : definition.id === "heroic-refrain"
          ? 4
          : 1;
    const targets = (
      definition.grantsAttributes || definition.application === "skill-bonus"
        ? allAttributes
        : availableAttributes
    )
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
      amount:
        definition.amount === "configured"
          ? strength
          : definition.amount === "scaled"
            ? null
            : definition.id === "experts-dexterity" && context.mode === "pvp"
              ? 1
              : definition.amount,
      targetAttributeIds: targets
    };
  });

  const attributeByTemplate = (template: number) => {
    const matches = allAttributes.filter((a) => Number(a.templateId) === template);
    return matches.length === 1 ? matches[0] : undefined;
  };
  const rankFor = (template: number, excluded: ReadonlySet<AssumedEffectId>): number | null => {
    const attribute = attributeByTemplate(template);
    if (attribute === undefined) return null;
    if (!availableAttributes.some((a) => a.id === attribute.id)) return 0;
    let rank = input.equipmentRanks.get(attribute.id) ?? null;
    const applicable = effects.filter(
      (e) =>
        e.active &&
        !excluded.has(e.definition.id) &&
        e.targetAttributeIds.includes(attribute.id) &&
        isAttributeEffect(e)
    );
    const set = applicable.find((e) => e.definition.application === "set");
    if (set !== undefined) rank = amountFor(set, excluded);
    if (rank === null) return null;
    for (const effect of applicable.filter((e) => e !== set)) {
      const amount = amountFor(effect, excluded);
      if (amount === null) return null;
      rank += amount;
    }
    return Math.min(20, rank);
  };
  const amountFor = (
    effect: AssumedAttributeEffectState,
    excluded: ReadonlySet<AssumedEffectId>
  ): number | null => {
    const scaling = effect.definition.scaling;
    if (scaling === undefined) return effect.amount;
    const nextExcluded = new Set([...excluded, effect.definition.id]);
    let template = scaling.attribute;
    // Substitution affects the potency of eligible enchantments too, but never
    // replaces the Illusion/Fast Casting attribute read by a substitution effect.
    const source = sources.find(
      (s) =>
        s.eligible &&
        s.skill !== null &&
        effect.definition.templateIds.includes(Number(s.skill.templateId))
    )?.skill;
    if (
      effect.definition.application !== "spell-rank" &&
      effect.definition.application !== "signet-rank" &&
      source &&
      skillTypeMatches(source.typeId, "spell") &&
      template !== 1 &&
      effects.some((e) => e.active && e.definition.id === "signet-of-illusions")
    )
      template = 1;
    const rank = rankFor(template, nextExcluded);
    return rank === null
      ? null
      : Math.round(scaling.zero + ((scaling.fifteen - scaling.zero) * rank) / 15);
  };
  const resolved = effects.map((effect) => {
    if (!effect.eligible) return effect;
    const amount = amountFor(effect, new Set());
    const eligible =
      amount !== null &&
      (amount > 0 ||
        effect.definition.application === "spell-rank" ||
        effect.definition.application === "signet-rank");
    return {
      ...effect,
      amount,
      eligible,
      active: effect.active && eligible,
      automatic: effect.automatic && eligible,
      requested: effect.preference === null ? effect.automatic && eligible : effect.requested,
      reason: eligible
        ? effect.reason
        : amount === null
          ? "Source attribute rank is unresolved."
          : "No attribute increase at the current rank."
    };
  });
  // A preview can assume only one glyph/stance at a time. An explicit choice wins;
  // otherwise use bar order. The reducer makes changing this choice mutually exclusive.
  for (const group of ["glyph", "stance"] as const) {
    const candidates = resolved.filter((e) => e.active && e.definition.exclusiveGroup === group);
    const sourceIndex = (e: AssumedAttributeEffectState) =>
      sources.findIndex(
        (s) =>
          s.eligible &&
          s.skill !== null &&
          e.definition.templateIds.includes(Number(s.skill.templateId))
      );
    candidates.sort(
      (a, b) =>
        Number(b.preference?.preference === "on") - Number(a.preference?.preference === "on") ||
        sourceIndex(a) - sourceIndex(b)
    );
    for (const effect of candidates.slice(1)) {
      const index = resolved.indexOf(effect);
      resolved[index] = {
        ...effect,
        active: false,
        requested: effect.preference !== null && effect.requested,
        automatic: false,
        reason: `Cannot be active together with ${candidates[0]!.definition.label}.`
      };
    }
  }

  return resolved;
}

export function isAttributeEffect(effect: AssumedAttributeEffectState): boolean {
  return effect.definition.application === undefined || effect.definition.application === "set";
}
