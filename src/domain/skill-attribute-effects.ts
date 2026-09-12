import type { CatalogSkillRecord, SkillMode, SkillValueState } from "./catalog";
import { catalogId } from "./ids";
import { skillTypeMatches } from "./skill-types";

// Formula sources and scope: compendium/primary-attribute-skill-effects.md.
export const SKILL_EFFECT_ATTRIBUTES = {
  expertise: { id: catalogId<"Attribute">(23), label: "Expertise" },
  mysticism: { id: catalogId<"Attribute">(44), label: "Mysticism" },
  fastCasting: { id: catalogId<"Attribute">(0), label: "Fast Casting" }
} as const;

export type SkillEffectAttribute = keyof typeof SKILL_EFFECT_ATTRIBUTES;
export type SkillInherentRanks = Readonly<Record<SkillEffectAttribute, number | null>>;
export type SkillAttributeMetric = "energy" | "activation" | "recharge";

export type SkillAttributeEffect =
  | { readonly kind: "unchanged" }
  | {
      readonly kind: "modified";
      readonly baseValue: number;
      readonly effectiveValue: number;
      readonly attribute: SkillEffectAttribute;
      readonly rank: number;
      readonly pveOnly: boolean;
    }
  | {
      readonly kind: "unresolved";
      readonly reason:
        "unknown-rank" | "unknown-mode" | "unsupported-value" | "combined-energy-effects";
    };

export type SkillAttributeEffects = Readonly<Record<SkillAttributeMetric, SkillAttributeEffect>>;

interface SkillAttributeEffectsInput {
  // The caller resolves the mode variant and supplies ranks for inherent effects,
  // excluding chance-based bonuses that apply only to a skill's progression.
  readonly skill: Pick<CatalogSkillRecord, "professionId" | "typeId" | "costs" | "timings">;
  readonly mode: SkillMode | "unknown";
  readonly ranks: SkillInherentRanks;
}

const unchanged: SkillAttributeEffect = { kind: "unchanged" };

export function calculateSkillAttributeEffects({
  skill,
  mode,
  ranks
}: SkillAttributeEffectsInput): SkillAttributeEffects {
  const ranger = Number(skill.professionId) === 2;
  const mesmer = Number(skill.professionId) === 5;
  const dervish = Number(skill.professionId) === 10;
  const matches = (type: Parameters<typeof skillTypeMatches>[1]) =>
    skillTypeMatches(skill.typeId, type);
  const expertiseEligible = ranger || matches("attack") || matches("ritual") || matches("touch");
  const mysticismEligible = dervish && matches("enchantment-spell");
  const energyAttributes = (["expertise", "mysticism"] as const).filter(
    (attribute) =>
      (attribute === "expertise" ? expertiseEligible : mysticismEligible) && ranks[attribute] !== 0
  );
  const energy =
    energyAttributes.length > 1
      ? ({ kind: "unresolved", reason: "combined-energy-effects" } as const)
      : energyAttributes[0] === undefined
        ? unchanged
        : applyEffect(
            skill.costs.energy,
            energyAttributes[0],
            ranks[energyAttributes[0]],
            false,
            (base, rank) => Math.round((base * (100 - 4 * rank)) / 100)
          );

  const activationBase = numericValue(skill.timings.activation, true);
  const activationEligible =
    (matches("spell") || matches("signet")) &&
    (mesmer || (activationBase !== null && activationBase >= 2));
  const activation = activationEligible
    ? applyEffect(
        skill.timings.activation,
        "fastCasting",
        ranks.fastCasting,
        false,
        (base, rank) => Math.round(base * 2 ** (-rank / 15) * 1000) / 1000,
        true
      )
    : (matches("spell") || matches("signet")) &&
        activationBase === null &&
        skill.timings.activation.state !== "absent" &&
        skill.timings.activation.state !== "not-applicable" &&
        ranks.fastCasting !== 0
      ? ({ kind: "unresolved", reason: "unsupported-value" } as const)
      : unchanged;

  const rechargeEligible = mesmer && matches("spell") && mode !== "pvp";
  const recharge = !rechargeEligible
    ? unchanged
    : applyEffect(
        skill.timings.recharge,
        "fastCasting",
        ranks.fastCasting,
        true,
        (base, rank) => Math.max(1, Math.round((base * (100 - 3 * rank)) / 100)),
        false,
        mode
      );

  return { energy, activation, recharge };
}

function applyEffect(
  value: SkillValueState,
  attribute: SkillEffectAttribute,
  rank: number | null,
  pveOnly: boolean,
  calculate: (base: number, rank: number) => number,
  allowFraction = false,
  mode: SkillMode | "unknown" = "pve"
): SkillAttributeEffect {
  if (rank === 0 || value.state === "absent" || value.state === "not-applicable") {
    return unchanged;
  }
  const baseValue = numericValue(value, allowFraction);
  if (baseValue === 0) {
    return unchanged;
  }
  if (baseValue === null) {
    return { kind: "unresolved", reason: "unsupported-value" };
  }
  if (rank === null || !Number.isSafeInteger(rank) || rank < 0) {
    return { kind: "unresolved", reason: "unknown-rank" };
  }
  if (pveOnly && mode === "unknown") {
    return { kind: "unresolved", reason: "unknown-mode" };
  }
  const inherentRank = Math.min(rank, 20);
  const effectiveValue = calculate(baseValue, inherentRank);
  return effectiveValue === baseValue
    ? unchanged
    : { kind: "modified", baseValue, effectiveValue, attribute, rank: inherentRank, pveOnly };
}

function numericValue(value: SkillValueState, allowFraction: boolean): number | null {
  if (value.state === "zero") {
    return value.value === 0 ? 0 : null;
  }
  if (value.state === "number") {
    return value.value !== null && Number.isFinite(value.value) && value.value >= 0
      ? value.value
      : null;
  }
  if (!allowFraction || value.state !== "special" || value.text === null) {
    return null;
  }
  const text = value.text.trim();
  const unwrapped = text.startsWith("{{") && text.endsWith("}}") ? text.slice(2, -2) : text;
  const match = /^(\d+(?:\.\d+)?)(?:\/(\d+))?$/.exec(unwrapped);
  if (match === null) {
    return null;
  }
  const result = Number(match[1]) / Number(match[2] ?? 1);
  return Number.isFinite(result) && result >= 0 ? result : null;
}
