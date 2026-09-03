export type SkillActionIconKind =
  | "attack"
  | "chant"
  | "disguise"
  | "echo"
  | "enchantment"
  | "environment"
  | "form"
  | "glyph"
  | "hex"
  | "item"
  | "preparation"
  | "ritual"
  | "shout"
  | "signet"
  | "skill"
  | "spell"
  | "stance"
  | "title"
  | "touch"
  | "trap"
  | "ward"
  | "weapon"
  | "well"
  | "unknown";

export type SkillFactIconKind =
  | "adrenaline"
  | "energy"
  | "sacrifice"
  | "upkeep"
  | "overcast"
  | "activation"
  | "recharge"
  | "morale-recharge"
  | "title"
  | "fact";

export interface SkillActionIconView {
  readonly kind: SkillActionIconKind;
  readonly label: string;
}

export function skillActionIconForType(skillType: string): SkillActionIconView {
  const normalized = normalizeSkillType(skillType);
  return {
    kind: actionIconKindForType(normalized),
    label: `Skill type: ${skillType || "Unknown"}`
  };
}

function actionIconKindForType(type: string): SkillActionIconKind {
  if (type.length === 0 || type === "unknown") {
    return "unknown";
  }
  if (type.includes("attack")) {
    return "attack";
  }
  if (type.includes("enchantment")) {
    return "enchantment";
  }
  if (type.includes("hex")) {
    return "hex";
  }
  if (type.includes("signet")) {
    return "signet";
  }
  if (type.includes("shout")) {
    return "shout";
  }
  if (type.includes("chant")) {
    return "chant";
  }
  if (type.includes("stance")) {
    return "stance";
  }
  if (type.includes("ritual")) {
    return "ritual";
  }
  if (type.includes("preparation")) {
    return "preparation";
  }
  if (type.includes("trap")) {
    return "trap";
  }
  if (type.includes("glyph")) {
    return "glyph";
  }
  if (type.includes("form")) {
    return "form";
  }
  if (type.includes("touch")) {
    return "touch";
  }
  if (type.includes("weapon")) {
    return "weapon";
  }
  if (type.includes("well")) {
    return "well";
  }
  if (type.includes("ward")) {
    return "ward";
  }
  if (type.includes("item")) {
    return "item";
  }
  if (type.includes("echo")) {
    return "echo";
  }
  if (type.includes("title") || type.includes("party bonus")) {
    return "title";
  }
  if (type.includes("disguise")) {
    return "disguise";
  }
  if (type.includes("environment")) {
    return "environment";
  }
  if (type.includes("spell")) {
    return "spell";
  }
  if (type.includes("skill")) {
    return "skill";
  }
  return "unknown";
}

function normalizeSkillType(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}
