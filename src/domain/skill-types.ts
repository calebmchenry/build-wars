export const SKILL_TYPES = [
  { id: "base-skill", label: "Base Skill", filterable: false },
  { id: "skill", label: "Skill", filterable: true },
  { id: "attack", label: "Attack", filterable: true },
  { id: "melee-attack", label: "Melee Attack", filterable: true },
  { id: "axe-attack", label: "Axe Attack", filterable: true },
  { id: "dagger-attack", label: "Dagger Attack", filterable: true },
  { id: "lead-attack", label: "Lead Attack", filterable: true },
  { id: "off-hand-attack", label: "Off-Hand Attack", filterable: true },
  { id: "dual-attack", label: "Dual Attack", filterable: true },
  { id: "hammer-attack", label: "Hammer Attack", filterable: true },
  { id: "pet-attack", label: "Pet Attack", filterable: true },
  { id: "scythe-attack", label: "Scythe Attack", filterable: true },
  { id: "sword-attack", label: "Sword Attack", filterable: true },
  { id: "ranged-attack", label: "Ranged Attack", filterable: true },
  { id: "bow-attack", label: "Bow Attack", filterable: true },
  { id: "spear-attack", label: "Spear Attack", filterable: true },
  { id: "ritual", label: "Ritual", filterable: true },
  { id: "binding-ritual", label: "Binding Ritual", filterable: true },
  { id: "nature-ritual", label: "Nature Ritual", filterable: true },
  { id: "ebon-vanguard-ritual", label: "Ebon Vanguard Ritual", filterable: true },
  { id: "spell", label: "Spell", filterable: true },
  { id: "enchantment-spell", label: "Enchantment Spell", filterable: true },
  { id: "flash-enchantment-spell", label: "Flash Enchantment Spell", filterable: true },
  { id: "hex-spell", label: "Hex Spell", filterable: true },
  { id: "item-spell", label: "Item Spell", filterable: true },
  { id: "touch-spell", label: "Touch Spell", filterable: true },
  { id: "touch-enchantment-spell", label: "Touch Enchantment Spell", filterable: true },
  { id: "touch-hex-spell", label: "Touch Hex Spell", filterable: true },
  { id: "ward-spell", label: "Ward Spell", filterable: true },
  { id: "weapon-spell", label: "Weapon Spell", filterable: true },
  { id: "well-spell", label: "Well Spell", filterable: true },
  { id: "signet", label: "Signet", filterable: true },
  { id: "touch-signet", label: "Touch Signet", filterable: true },
  { id: "touch", label: "Touch", filterable: true },
  { id: "touch-skill", label: "Touch Skill", filterable: true },
  { id: "chant", label: "Chant", filterable: true },
  { id: "echo", label: "Echo", filterable: true },
  { id: "form", label: "Form", filterable: true },
  { id: "glyph", label: "Glyph", filterable: true },
  { id: "preparation", label: "Preparation", filterable: true },
  { id: "shout", label: "Shout", filterable: true },
  { id: "stance", label: "Stance", filterable: true },
  { id: "trap", label: "Trap", filterable: true }
] as const;

export type SkillTypeId = (typeof SKILL_TYPES)[number]["id"];
export type SkillTypeDefinition = (typeof SKILL_TYPES)[number];

export const SKILL_TYPE_PARENT_IDS = {
  "base-skill": [],
  skill: ["base-skill"],
  attack: ["base-skill"],
  "melee-attack": ["attack"],
  "axe-attack": ["melee-attack"],
  "dagger-attack": ["melee-attack"],
  "lead-attack": ["dagger-attack"],
  "off-hand-attack": ["dagger-attack"],
  "dual-attack": ["dagger-attack"],
  "hammer-attack": ["melee-attack"],
  "pet-attack": ["melee-attack"],
  "scythe-attack": ["melee-attack"],
  "sword-attack": ["melee-attack"],
  "ranged-attack": ["attack"],
  "bow-attack": ["ranged-attack"],
  "spear-attack": ["ranged-attack"],
  ritual: ["base-skill"],
  "binding-ritual": ["ritual"],
  "nature-ritual": ["ritual"],
  "ebon-vanguard-ritual": ["ritual"],
  spell: ["base-skill"],
  "enchantment-spell": ["spell"],
  "flash-enchantment-spell": ["enchantment-spell"],
  "hex-spell": ["spell"],
  "item-spell": ["spell"],
  "touch-spell": ["spell", "touch"],
  "touch-enchantment-spell": ["enchantment-spell", "touch-spell"],
  "touch-hex-spell": ["hex-spell", "touch-spell"],
  "ward-spell": ["spell"],
  "weapon-spell": ["spell"],
  "well-spell": ["spell"],
  signet: ["base-skill"],
  "touch-signet": ["signet", "touch"],
  touch: ["base-skill"],
  "touch-skill": ["touch"],
  chant: ["base-skill"],
  echo: ["base-skill"],
  form: ["base-skill"],
  glyph: ["base-skill"],
  preparation: ["base-skill"],
  shout: ["base-skill"],
  stance: ["base-skill"],
  trap: ["base-skill"]
} as const satisfies Readonly<Record<SkillTypeId, readonly SkillTypeId[]>>;

export const FILTERABLE_SKILL_TYPE_IDS = SKILL_TYPES.filter(
  (skillType) => skillType.filterable
).map((skillType) => skillType.id);

const SKILL_TYPE_IDS = new Set<string>(SKILL_TYPES.map((skillType) => skillType.id));

const SKILL_TYPE_IDS_BY_LABEL = new Map<string, SkillTypeId>(
  SKILL_TYPES.map((skillType) => [normalizedSkillTypeLabel(skillType.label), skillType.id])
);

export function isSkillTypeId(value: string): value is SkillTypeId {
  return SKILL_TYPE_IDS.has(value);
}

export function skillTypeIdFromLabel(value: string): SkillTypeId | null {
  return SKILL_TYPE_IDS_BY_LABEL.get(normalizedSkillTypeLabel(value)) ?? null;
}

export function skillTypeLabelForId(id: SkillTypeId): string {
  return SKILL_TYPES.find((skillType) => skillType.id === id)?.label ?? id;
}

export function skillTypeMatches(skillTypeId: SkillTypeId, filterTypeId: SkillTypeId): boolean {
  if (skillTypeId === filterTypeId) {
    return true;
  }

  const visited = new Set<SkillTypeId>();
  const pending: SkillTypeId[] = [skillTypeId];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || visited.has(current)) {
      continue;
    }
    visited.add(current);
    const parents = SKILL_TYPE_PARENT_IDS[current];
    if (parents.some((parent) => parent === filterTypeId)) {
      return true;
    }
    pending.push(...parents);
  }
  return false;
}

function normalizedSkillTypeLabel(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
