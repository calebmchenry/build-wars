import type { CatalogSkillRecord } from "../catalog";
import type { BuildValidationContext, SkillSlotContext } from "../validation-context";
import { createValidationIssue, relatedEntity, type ValidationIssue } from "../validation";

export function validateSkillBarRules(context: BuildValidationContext): readonly ValidationIssue[] {
  return [
    ...validateIncompleteBar(context.skillSlots),
    ...validateSlotResolution(context.skillSlots),
    ...validateSkillSupport(context.skillSlots),
    ...validateDuplicateSkills(context.skillSlots),
    ...validateEliteLimit(context.skillSlots),
    ...validatePveOnlyLimit(context)
  ];
}

function validateIncompleteBar(slots: readonly SkillSlotContext[]): readonly ValidationIssue[] {
  const emptySlots = slots.filter((slot) => slot.lookup.kind === "empty");
  if (emptySlots.length === 0) {
    return [];
  }
  return [
    createValidationIssue({
      severity: "warning",
      code: "skill-bar.incomplete",
      message:
        emptySlots.length === slots.length
          ? "Skill bar is blank."
          : `Skill bar has ${emptySlots.length} empty slot${emptySlots.length === 1 ? "" : "s"}.`,
      path: ["skillBar"],
      location: null,
      relatedEntities: emptySlots.map((slot) => relatedEntity("skill-slot", slot.index)),
      sourceRule: "skill-bar.incomplete"
    })
  ];
}

function validateSlotResolution(slots: readonly SkillSlotContext[]): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const slot of slots) {
    if (slot.lookup.kind === "missing" && slot.originalSkillId !== null) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "skill.unresolved",
          message: "Skill ID is not resolved in the catalog.",
          path: ["skillBar", slot.index],
          location: { kind: "skill-slot", index: slot.index },
          relatedEntities: skillSlotEntities(slot),
          sourceRule: "skill.resolve"
        })
      );
    }
    if (slot.lookup.kind === "ambiguous") {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "skill.unresolved",
          message: "Skill ID is ambiguous in the catalog.",
          path: ["skillBar", slot.index],
          location: { kind: "skill-slot", index: slot.index },
          relatedEntities: skillSlotEntities(slot),
          sourceRule: "skill.resolve"
        })
      );
    }
    if (slot.lookup.kind === "dispositioned") {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "skill.dispositioned",
          message: "Skill ID has a catalog disposition instead of a playable skill record.",
          path: ["skillBar", slot.index],
          location: { kind: "skill-slot", index: slot.index },
          relatedEntities: [
            ...skillSlotEntities(slot),
            relatedEntity("catalog-key", slot.lookup.disposition.kind, "disposition")
          ],
          sourceRule: "skill.disposition"
        })
      );
    }
  }
  return issues;
}

function validateSkillSupport(slots: readonly SkillSlotContext[]): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const slot of resolvedSlots(slots)) {
    const classification = slot.skill.classification;
    if (classification.unsupported) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "skill.unsupported",
          message: "Skill record is marked unsupported by the catalog.",
          path: ["skillBar", slot.slot.index],
          location: { kind: "skill-slot", index: slot.slot.index },
          relatedEntities: skillSlotEntities(slot.slot),
          sourceRule: "skill.support"
        })
      );
    }
    if (classification.nonPlayer) {
      issues.push(
        createValidationIssue({
          severity: "error",
          code: "skill.non-player",
          message: "Skill record is marked non-player by the catalog.",
          path: ["skillBar", slot.slot.index],
          location: { kind: "skill-slot", index: slot.slot.index },
          relatedEntities: skillSlotEntities(slot.slot),
          sourceRule: "skill.support"
        })
      );
    }
  }
  return issues;
}

function validateDuplicateSkills(slots: readonly SkillSlotContext[]): readonly ValidationIssue[] {
  const resolvedBySkillId = new Map<number, ResolvedSkillSlot[]>();
  for (const slot of resolvedSlots(slots)) {
    const bucket = resolvedBySkillId.get(slot.id);
    if (bucket === undefined) {
      resolvedBySkillId.set(slot.id, [slot]);
    } else {
      bucket.push(slot);
    }
  }

  const issues: ValidationIssue[] = [];
  for (const duplicateSlots of resolvedBySkillId.values()) {
    if (duplicateSlots.length < 2) {
      continue;
    }
    const uncertain = duplicateSlots.some((slot) => isDuplicateLegalityUncertain(slot.skill));
    for (const slot of duplicateSlots.slice(1)) {
      issues.push(
        createValidationIssue({
          severity: uncertain ? "warning" : "error",
          code: uncertain ? "skill.duplicate-uncertain" : "skill.duplicate",
          message: uncertain
            ? "Duplicate skill legality cannot be proven from this catalog record."
            : "Resolved player skill appears more than once on the bar.",
          path: ["skillBar", slot.slot.index],
          location: { kind: "skill-slot", index: slot.slot.index },
          relatedEntities: [
            ...skillSlotEntities(slot.slot),
            ...duplicateSlots.map((candidate) => relatedEntity("skill-slot", candidate.slot.index))
          ],
          sourceRule: "skill.duplicate"
        })
      );
    }
  }
  return issues;
}

function validateEliteLimit(slots: readonly SkillSlotContext[]): readonly ValidationIssue[] {
  const eliteSlots = resolvedSlots(slots).filter(
    (slot) => !isCompositionFactUnsupported(slot.skill) && slot.skill.classification.elite
  );
  return eliteSlots.slice(1).map((slot) =>
    createValidationIssue({
      severity: "error",
      code: "skill.elite-limit",
      message: "Only one elite skill is allowed on a skill bar.",
      path: ["skillBar", slot.slot.index],
      location: { kind: "skill-slot", index: slot.slot.index },
      relatedEntities: [
        ...skillSlotEntities(slot.slot),
        ...eliteSlots.map((candidate) => relatedEntity("skill-slot", candidate.slot.index))
      ],
      sourceRule: "skill.elite-limit"
    })
  );
}

function validatePveOnlyLimit(context: BuildValidationContext): readonly ValidationIssue[] {
  if (context.mode !== "pve") {
    return [];
  }
  const pveOnlySlots = resolvedSlots(context.skillSlots).filter(
    (slot) =>
      !isCompositionFactUnsupported(slot.skill) &&
      !slot.skill.classification.split &&
      hasConsistentPveOnlyFacts(slot.skill)
  );
  return pveOnlySlots.slice(3).map((slot) =>
    createValidationIssue({
      severity: "error",
      code: "skill.pve-only-limit",
      message: "Only three PvE-only skills are allowed on a PvE skill bar.",
      path: ["skillBar", slot.slot.index],
      location: { kind: "skill-slot", index: slot.slot.index },
      relatedEntities: [
        ...skillSlotEntities(slot.slot),
        ...pveOnlySlots.map((candidate) => relatedEntity("skill-slot", candidate.slot.index))
      ],
      sourceRule: "skill.pve-only-limit"
    })
  );
}

interface ResolvedSkillSlot {
  readonly slot: SkillSlotContext;
  readonly id: number;
  readonly skill: CatalogSkillRecord;
}

function resolvedSlots(slots: readonly SkillSlotContext[]): readonly ResolvedSkillSlot[] {
  return slots.flatMap((slot) =>
    slot.lookup.kind === "resolved" ? [{ slot, id: slot.lookup.id, skill: slot.lookup.record }] : []
  );
}

function isDuplicateLegalityUncertain(skill: CatalogSkillRecord): boolean {
  return (
    skill.classification.unsupported ||
    skill.classification.nonPlayer ||
    skill.classification.special ||
    skill.classification.sharedPage
  );
}

function isCompositionFactUnsupported(skill: CatalogSkillRecord): boolean {
  return skill.classification.unsupported || skill.classification.nonPlayer;
}

function hasConsistentPveOnlyFacts(skill: CatalogSkillRecord): boolean {
  const classification = skill.classification;
  return (
    classification.modeAvailability === "pve-only" &&
    classification.pveOnly &&
    !classification.pvpOnly
  );
}

function skillSlotEntities(slot: SkillSlotContext): readonly ReturnType<typeof relatedEntity>[] {
  return [
    relatedEntity("skill-slot", slot.index),
    relatedEntity("skill", slot.numericId ?? "invalid")
  ];
}
