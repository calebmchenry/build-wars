import type { CatalogSkillRecord, SkillCatalog } from "./catalog";
import { resolveSkillModeVariant } from "./catalog-lookup";
import type { BuildValidationContext, SkillSlotContext } from "./validation-context";

export function permitsProfessionlessSkill(skill: CatalogSkillRecord): boolean {
  const c = skill.classification;
  return c.common || c.special || c.title || c.noAttribute;
}

export function skillIsPlayerSource(skill: CatalogSkillRecord): boolean {
  return !skill.classification.unsupported && !skill.classification.nonPlayer;
}

export function modeFactsConflict(skill: CatalogSkillRecord): boolean {
  const c = skill.classification;
  if (c.modeAvailability === "both") return c.pveOnly || c.pvpOnly;
  if (c.modeAvailability === "pve-only") return !c.pveOnly || c.pvpOnly;
  if (c.modeAvailability === "pvp-only") return !c.pvpOnly || c.pveOnly;
  return c.pveOnly || c.pvpOnly;
}

export function skillSourceProfessionSelected(
  context: BuildValidationContext,
  skill: CatalogSkillRecord
): boolean {
  if (context.primaryProfession.lookup.kind !== "resolved") return false;
  if (skill.professionId === null) return permitsProfessionlessSkill(skill);
  return (
    context.primaryProfession.lookup.record.id === skill.professionId ||
    (context.secondaryProfession.lookup.kind === "resolved" &&
      context.secondaryProfession.lookup.record.id === skill.professionId)
  );
}

export interface SkillSourceResolution {
  readonly slotIndex: number;
  readonly skill: CatalogSkillRecord | null;
  readonly eligible: boolean;
  readonly reason: string | null;
}

/** Resolve one source independently of aggregate bar validity and display lookups. */
export function resolveEligibleSkillSource(
  context: BuildValidationContext,
  catalog: SkillCatalog,
  slot: SkillSlotContext
): SkillSourceResolution {
  const inactive = (
    reason: string,
    skill: CatalogSkillRecord | null = null
  ): SkillSourceResolution => ({ slotIndex: slot.index, skill, eligible: false, reason });
  if (slot.lookup.kind !== "resolved") return inactive("Skill source is unresolved or ambiguous.");
  let skill = slot.lookup.record;
  if (context.mode === "unknown") return inactive("Select a game mode.", skill);
  if (skill.splitGroupId !== null || skill.classification.split) {
    const group =
      skill.splitGroupId === null ? undefined : context.splitGroupsById.get(skill.splitGroupId);
    if (
      group === undefined ||
      context.ambiguousSplitGroupIds.has(group.id) ||
      group.ambiguity !== "none" ||
      group.members.length !== 2 ||
      group.members.filter((m) => m.mode === "pve").length !== 1 ||
      group.members.filter((m) => m.mode === "pvp").length !== 1 ||
      !group.members.some((m) => m.skillId === skill.id)
    ) {
      return inactive("Skill mode split is incomplete or ambiguous.", skill);
    }
    for (const member of group.members) {
      const candidate = context.skillsById.get(Number(member.skillId));
      if (
        candidate === undefined ||
        context.ambiguousSkillIds.has(Number(member.skillId)) ||
        candidate.splitGroupId !== group.id ||
        modeFactsConflict(candidate) ||
        candidate.classification.modeAvailability !== `${member.mode}-only`
      ) {
        return inactive("Skill mode counterpart is unresolved or ambiguous.", skill);
      }
    }
    const outcome = resolveSkillModeVariant(catalog, skill, context.mode);
    if (outcome.kind !== "variant") return inactive("Skill mode counterpart is unresolved.", skill);
    skill = outcome.skill;
  }
  if (catalog.skills.filter((candidate) => candidate.templateId === skill.templateId).length !== 1)
    return inactive("Skill template identity is ambiguous.", skill);
  if (!skillIsPlayerSource(skill))
    return inactive("Source is not a supported player skill.", skill);
  if (!skillSourceProfessionSelected(context, skill))
    return inactive("Source profession is not selected.", skill);
  const availability = skill.classification.modeAvailability;
  if (
    modeFactsConflict(skill) ||
    (availability !== "both" && availability !== `${context.mode}-only`)
  )
    return inactive("Source is unavailable in the current mode.", skill);
  return { slotIndex: slot.index, skill, eligible: true, reason: null };
}
