import type { CatalogSkillRecord, SkillModeVariantGroup } from "../catalog";
import type { BuildValidationContext, SkillSlotContext } from "../validation-context";
import { createValidationIssue, relatedEntity, type ValidationIssue } from "../validation";

export function validateSkillEligibilityRules(
  context: BuildValidationContext
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const slot of resolvedSkillSlots(context.skillSlots)) {
    if (slot.skill.classification.unsupported || slot.skill.classification.nonPlayer) {
      continue;
    }
    const professionIssue = validateSkillProfession(context, slot);
    if (professionIssue !== null) {
      issues.push(professionIssue);
    }
    issues.push(...validateSkillAttribute(context, slot));
    issues.push(...validateSkillMode(context, slot));
    issues.push(...validateSkillSplitGroup(context, slot));
    issues.push(...validateDeferredSkillRules(context, slot));
  }
  return issues;
}

interface ResolvedSkillSlot {
  readonly slot: SkillSlotContext;
  readonly id: number;
  readonly skill: CatalogSkillRecord;
}

function validateSkillProfession(
  context: BuildValidationContext,
  slot: ResolvedSkillSlot
): ValidationIssue | null {
  const skillProfessionId =
    slot.skill.professionId === null ? null : Number(slot.skill.professionId);
  if (skillProfessionId === null) {
    return permitsProfessionlessSkill(slot.skill)
      ? null
      : createValidationIssue({
          severity: "warning",
          code: "skill.professionless-unsupported",
          message:
            "Professionless skill record lacks an explicit common, special, title, or no-attribute classification.",
          path: ["skillBar", slot.slot.index],
          location: { kind: "skill-slot", index: slot.slot.index },
          relatedEntities: skillSlotEntities(slot.slot),
          sourceRule: "skill.profession"
        });
  }

  if (context.primaryProfession.lookup.kind !== "resolved") {
    return null;
  }

  const primaryProfessionId = Number(context.primaryProfession.lookup.record.id);
  const secondaryProfessionId =
    context.secondaryProfession.lookup.kind === "resolved"
      ? Number(context.secondaryProfession.lookup.record.id)
      : null;
  if (skillProfessionId === primaryProfessionId || skillProfessionId === secondaryProfessionId) {
    return null;
  }
  if (context.secondaryProfession.authoredId === null) {
    return createValidationIssue({
      severity: "warning",
      code: "skill.profession-missing-secondary",
      message: "Skill requires a secondary profession that is not selected.",
      path: ["skillBar", slot.slot.index],
      location: { kind: "skill-slot", index: slot.slot.index },
      relatedEntities: [
        ...skillSlotEntities(slot.slot),
        relatedEntity("profession", skillProfessionId, "skill-profession")
      ],
      sourceRule: "skill.profession"
    });
  }
  if (context.secondaryProfession.lookup.kind !== "resolved") {
    return null;
  }
  return createValidationIssue({
    severity: "error",
    code: "skill.wrong-profession",
    message: "Skill profession is not selected by the build.",
    path: ["skillBar", slot.slot.index],
    location: { kind: "skill-slot", index: slot.slot.index },
    relatedEntities: [
      ...skillSlotEntities(slot.slot),
      relatedEntity("profession", skillProfessionId, "skill-profession"),
      relatedEntity("profession", primaryProfessionId, "selected-primary"),
      relatedEntity("profession", secondaryProfessionId ?? "none", "selected-secondary")
    ],
    sourceRule: "skill.profession"
  });
}

function validateSkillAttribute(
  context: BuildValidationContext,
  slot: ResolvedSkillSlot
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const classification = slot.skill.classification;
  const skillAttributeId = slot.skill.attributeId === null ? null : Number(slot.skill.attributeId);
  if (skillAttributeId === null) {
    if (
      !classification.noAttribute &&
      !classification.common &&
      !classification.special &&
      !classification.title
    ) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "skill.attribute-metadata-missing",
          message: "Skill has no attribute metadata and no explicit no-attribute classification.",
          path: ["skillBar", slot.slot.index],
          location: { kind: "skill-slot", index: slot.slot.index },
          relatedEntities: skillSlotEntities(slot.slot),
          sourceRule: "skill.attribute"
        })
      );
    }
  } else {
    const attribute = context.attributesById.get(skillAttributeId);
    if (attribute === undefined || context.ambiguousAttributeIds.has(skillAttributeId)) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "skill.attribute-unresolved",
          message: "Skill attribute metadata does not resolve in the profession/attribute catalog.",
          path: ["skillBar", slot.slot.index],
          location: { kind: "skill-slot", index: slot.slot.index },
          relatedEntities: [
            ...skillSlotEntities(slot.slot),
            relatedEntity("attribute", skillAttributeId)
          ],
          sourceRule: "skill.attribute"
        })
      );
    } else if (
      slot.skill.professionId !== null &&
      Number(attribute.professionId) !== Number(slot.skill.professionId)
    ) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "skill.attribute-metadata-conflict",
          message: "Skill profession and attribute metadata point to different professions.",
          path: ["skillBar", slot.slot.index],
          location: { kind: "skill-slot", index: slot.slot.index },
          relatedEntities: [
            ...skillSlotEntities(slot.slot),
            relatedEntity("attribute", skillAttributeId),
            relatedEntity("profession", Number(attribute.professionId), "attribute-owner"),
            relatedEntity("profession", Number(slot.skill.professionId), "skill-profession")
          ],
          sourceRule: "skill.attribute"
        })
      );
    }
  }

  for (const seriesId of slot.skill.progressionSeriesIds) {
    const series = context.progressionSeriesById.get(seriesId);
    if (series === undefined) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "skill.attribute-metadata-missing",
          message: "Skill progression metadata is missing from the catalog.",
          path: ["skillBar", slot.slot.index],
          location: { kind: "skill-slot", index: slot.slot.index },
          relatedEntities: [
            ...skillSlotEntities(slot.slot),
            relatedEntity("catalog-key", seriesId)
          ],
          sourceRule: "skill.attribute"
        })
      );
      continue;
    }
    if (
      series.dependency.kind === "attribute" &&
      series.dependency.attributeId !== null &&
      slot.skill.attributeId !== null &&
      Number(series.dependency.attributeId) !== Number(slot.skill.attributeId)
    ) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "skill.attribute-metadata-conflict",
          message: "Skill progression attribute conflicts with skill attribute metadata.",
          path: ["skillBar", slot.slot.index],
          location: { kind: "skill-slot", index: slot.slot.index },
          relatedEntities: [
            ...skillSlotEntities(slot.slot),
            relatedEntity(
              "attribute",
              Number(series.dependency.attributeId),
              "progression-attribute"
            ),
            relatedEntity("attribute", Number(slot.skill.attributeId), "skill-attribute")
          ],
          sourceRule: "skill.attribute"
        })
      );
    }
  }

  return issues;
}

function validateSkillMode(
  context: BuildValidationContext,
  slot: ResolvedSkillSlot
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const classification = slot.skill.classification;
  const availability = classification.modeAvailability;

  if (modeFactsConflict(slot.skill)) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "skill.mode-metadata-conflict",
        message: "Skill mode availability and PvE/PvP flags conflict.",
        path: ["skillBar", slot.slot.index],
        location: { kind: "skill-slot", index: slot.slot.index },
        relatedEntities: skillSlotEntities(slot.slot),
        sourceRule: "skill.mode"
      })
    );
  }

  if (context.mode === "unknown" && (availability === "pve-only" || availability === "pvp-only")) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "skill.mode-unknown",
        message: "Skill has mode-specific availability and requires a known build mode.",
        path: ["skillBar", slot.slot.index],
        location: { kind: "skill-slot", index: slot.slot.index },
        relatedEntities: skillSlotEntities(slot.slot),
        sourceRule: "skill.mode"
      })
    );
  }

  if (
    (context.mode === "pve" && availability === "pvp-only") ||
    (context.mode === "pvp" && availability === "pve-only")
  ) {
    issues.push(
      createValidationIssue({
        severity: "error",
        code: "skill.mode-restricted",
        message: "Skill is not available in the selected build mode.",
        path: ["skillBar", slot.slot.index],
        location: { kind: "skill-slot", index: slot.slot.index },
        relatedEntities: [
          ...skillSlotEntities(slot.slot),
          relatedEntity("catalog-key", availability, "mode-availability")
        ],
        sourceRule: "skill.mode"
      })
    );
  }

  return issues;
}

function validateSkillSplitGroup(
  context: BuildValidationContext,
  slot: ResolvedSkillSlot
): readonly ValidationIssue[] {
  if (slot.skill.splitGroupId === null && !slot.skill.classification.split) {
    return [];
  }
  const issues: ValidationIssue[] = [];
  const group =
    slot.skill.splitGroupId === null
      ? null
      : (context.splitGroupsById.get(slot.skill.splitGroupId) ?? null);

  if (
    slot.skill.splitGroupId === null ||
    group === null ||
    context.ambiguousSplitGroupIds.has(slot.skill.splitGroupId)
  ) {
    issues.push(splitAmbiguousIssue(slot));
    return issues;
  }

  if (group.ambiguity !== "none") {
    issues.push(splitAmbiguousIssue(slot, group));
  }

  const duplicateMemberIssue = validateSplitGroupMembers(group, slot);
  if (duplicateMemberIssue !== null) {
    issues.push(duplicateMemberIssue);
  }
  const overbroadIssue = validateSplitGroupBreadth(group, slot);
  if (overbroadIssue !== null) {
    issues.push(overbroadIssue);
  }

  if (context.mode === "unknown") {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "skill.mode-unknown",
        message:
          "Split skill requires a known build mode before mode-specific legality is exhaustive.",
        path: ["skillBar", slot.slot.index],
        location: { kind: "skill-slot", index: slot.slot.index },
        relatedEntities: [...skillSlotEntities(slot.slot), relatedEntity("split-group", group.id)],
        sourceRule: "skill.split"
      })
    );
    return issues;
  }

  const selectedModeMembers = group.members.filter((member) => member.mode === context.mode);
  if (selectedModeMembers.length !== 1) {
    issues.push(splitCounterpartIssue(slot, group));
    return issues;
  }
  const selectedModeMember = selectedModeMembers[0];
  if (selectedModeMember === undefined) {
    return issues;
  }
  const memberSkillId = Number(selectedModeMember.skillId);
  const memberSkill = context.skillsById.get(memberSkillId);
  if (memberSkill === undefined || context.ambiguousSkillIds.has(memberSkillId)) {
    issues.push(splitCounterpartIssue(slot, group));
  } else if (modeFactsConflict(memberSkill)) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "skill.mode-metadata-conflict",
        message: "Split counterpart has contradictory mode metadata.",
        path: ["skillBar", slot.slot.index],
        location: { kind: "skill-slot", index: slot.slot.index },
        relatedEntities: [
          ...skillSlotEntities(slot.slot),
          relatedEntity("skill", memberSkillId, "mode-counterpart"),
          relatedEntity("split-group", group.id)
        ],
        sourceRule: "skill.split"
      })
    );
  }

  return issues;
}

function validateDeferredSkillRules(
  context: BuildValidationContext,
  slot: ResolvedSkillSlot
): readonly ValidationIssue[] {
  const titleKeys = titleDependencyKeys(context, slot.skill);
  const issues: ValidationIssue[] = [];
  if (slot.skill.classification.title || titleKeys.length > 0) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "skill.title-deferred",
        message: "Title-rank legality is deferred to EPIC-15.",
        path: ["skillBar", slot.slot.index],
        location: { kind: "skill-slot", index: slot.slot.index },
        relatedEntities: [
          ...skillSlotEntities(slot.slot),
          ...titleKeys.map((key) => relatedEntity("catalog-key", key, "title-key"))
        ],
        sourceRule: "skill.deferred-title"
      })
    );
  }

  const allegianceKeys = titleKeys.filter((key) => key.startsWith("allegiance:"));
  if (allegianceKeys.length > 0) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "skill.allegiance-deferred",
        message: "Allegiance legality is deferred to EPIC-15.",
        path: ["skillBar", slot.slot.index],
        location: { kind: "skill-slot", index: slot.slot.index },
        relatedEntities: [
          ...skillSlotEntities(slot.slot),
          ...allegianceKeys.map((key) => relatedEntity("catalog-key", key, "allegiance-key"))
        ],
        sourceRule: "skill.deferred-title"
      })
    );
  }

  return issues;
}

function permitsProfessionlessSkill(skill: CatalogSkillRecord): boolean {
  const classification = skill.classification;
  return (
    classification.common ||
    classification.special ||
    classification.title ||
    classification.noAttribute
  );
}

function modeFactsConflict(skill: CatalogSkillRecord): boolean {
  const classification = skill.classification;
  if (classification.modeAvailability === "both") {
    return classification.pveOnly || classification.pvpOnly;
  }
  if (classification.modeAvailability === "pve-only") {
    return !classification.pveOnly || classification.pvpOnly;
  }
  if (classification.modeAvailability === "pvp-only") {
    return !classification.pvpOnly || classification.pveOnly;
  }
  return classification.pveOnly || classification.pvpOnly;
}

function splitAmbiguousIssue(
  slot: ResolvedSkillSlot,
  group?: SkillModeVariantGroup
): ValidationIssue {
  return createValidationIssue({
    severity: "warning",
    code: "skill.split-ambiguous",
    message: "Split skill metadata is incomplete or ambiguous.",
    path: ["skillBar", slot.slot.index],
    location: { kind: "skill-slot", index: slot.slot.index },
    relatedEntities:
      group === undefined
        ? skillSlotEntities(slot.slot)
        : [...skillSlotEntities(slot.slot), relatedEntity("split-group", group.id)],
    sourceRule: "skill.split"
  });
}

function splitCounterpartIssue(
  slot: ResolvedSkillSlot,
  group: SkillModeVariantGroup
): ValidationIssue {
  return createValidationIssue({
    severity: "warning",
    code: "skill.split-counterpart-unresolved",
    message: "Split skill counterpart for the selected mode is unresolved.",
    path: ["skillBar", slot.slot.index],
    location: { kind: "skill-slot", index: slot.slot.index },
    relatedEntities: [...skillSlotEntities(slot.slot), relatedEntity("split-group", group.id)],
    sourceRule: "skill.split"
  });
}

function validateSplitGroupMembers(
  group: SkillModeVariantGroup,
  slot: ResolvedSkillSlot
): ValidationIssue | null {
  const seen = new Set<string>();
  for (const member of group.members) {
    const key = `${member.mode}:${Number(member.skillId)}`;
    if (seen.has(key)) {
      return createValidationIssue({
        severity: "warning",
        code: "catalog.skill-split-group-duplicate-member",
        message: "Split group contains duplicate members.",
        path: ["skills", "splitGroups", group.id],
        location: { kind: "skill-slot", index: slot.slot.index },
        relatedEntities: [
          ...skillSlotEntities(slot.slot),
          relatedEntity("split-group", group.id),
          relatedEntity("skill", Number(member.skillId))
        ],
        sourceRule: "skill.split"
      });
    }
    seen.add(key);
  }
  return null;
}

function validateSplitGroupBreadth(
  group: SkillModeVariantGroup,
  slot: ResolvedSkillSlot
): ValidationIssue | null {
  const pveCount = group.members.filter((member) => member.mode === "pve").length;
  const pvpCount = group.members.filter((member) => member.mode === "pvp").length;
  if (group.members.length <= 2 && pveCount <= 1 && pvpCount <= 1) {
    return null;
  }
  return createValidationIssue({
    severity: "warning",
    code: "catalog.skill-split-group-overbroad",
    message: "Split group has more than one member for a mode or more than two members total.",
    path: ["skills", "splitGroups", group.id],
    location: { kind: "skill-slot", index: slot.slot.index },
    relatedEntities: [...skillSlotEntities(slot.slot), relatedEntity("split-group", group.id)],
    sourceRule: "skill.split"
  });
}

function titleDependencyKeys(
  context: BuildValidationContext,
  skill: CatalogSkillRecord
): readonly string[] {
  const keys: string[] = [];
  for (const seriesId of skill.progressionSeriesIds) {
    const series = context.progressionSeriesById.get(seriesId);
    if (series?.dependency.kind === "title-rank" && series.dependency.titleKey !== null) {
      keys.push(series.dependency.titleKey);
    }
  }
  return [...new Set(keys)].sort();
}

function resolvedSkillSlots(slots: readonly SkillSlotContext[]): readonly ResolvedSkillSlot[] {
  return slots.flatMap((slot) =>
    slot.lookup.kind === "resolved" ? [{ slot, id: slot.lookup.id, skill: slot.lookup.record }] : []
  );
}

function skillSlotEntities(slot: SkillSlotContext): readonly ReturnType<typeof relatedEntity>[] {
  return [
    relatedEntity("skill-slot", slot.index),
    relatedEntity("skill", slot.numericId ?? "invalid")
  ];
}
