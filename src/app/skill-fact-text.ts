import { SKILL_EFFECT_ATTRIBUTES } from "../domain";
import type { SkillFactView } from "./editor-selectors";

export function skillFactAccessibleLabel(fact: SkillFactView): string {
  const adjustment = skillFactAdjustmentText(fact);
  return adjustment === null
    ? `${fact.label} ${fact.value}`
    : `${fact.label} ${fact.value}. ${adjustment}`;
}

export function skillFactAdjustmentText(fact: SkillFactView): string | null {
  const label = fact.label.replace(/^.*: /, "");
  const effect = fact.attributeEffect;
  if (effect === undefined) {
    return fact.effectNote === undefined ? null : `${label}: ${fact.effectNote}`;
  }
  const unit = fact.icon === "activation" || fact.icon === "recharge" ? "s" : "";
  const source = SKILL_EFFECT_ATTRIBUTES[effect.attribute].label;
  return `${label}: ${effect.baseValue}${unit} → ${fact.value}${unit} · ${source} ${effect.rank}${effect.pveOnly ? " · PvE" : ""}`;
}
