import type { AttributeId, AuthoredDocumentId, ProfessionId, SkillId } from "./ids";
import type { EquipmentTemplate } from "./equipment";
import type { AuthoredDocumentRoot } from "./source";

export const SKILL_BAR_SLOT_COUNT = 8;

export type GameMode = "pve" | "pvp" | "unknown";

export type SkillBar = readonly [
  SkillId | null,
  SkillId | null,
  SkillId | null,
  SkillId | null,
  SkillId | null,
  SkillId | null,
  SkillId | null,
  SkillId | null
];

export interface AttributeAllocation {
  readonly attributeId: AttributeId;
  readonly rank: number;
}

export interface Build extends AuthoredDocumentRoot {
  readonly id: AuthoredDocumentId;
  readonly name: string;
  readonly mode: GameMode;
  readonly primaryProfessionId: ProfessionId | null;
  readonly secondaryProfessionId: ProfessionId | null;
  readonly attributes: readonly AttributeAllocation[];
  readonly skillBar: SkillBar;
  readonly equipment: EquipmentTemplate | null;
}
