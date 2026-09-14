import type { AttributeId, AuthoredDocumentId, ProfessionId, SkillId } from "./ids";
import type { EquipmentLoadout } from "./equipment";
import type { AuthoredDocumentRoot } from "./source";
import type { TitleRankOverride } from "./title-rank";
import type { AttributeAdjustments } from "./attribute-adjustments";

export const BUILD_SCHEMA_VERSION = 3;
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
  readonly titleRankOverrides: readonly TitleRankOverride[];
  readonly attributeAdjustments: AttributeAdjustments | null;
  readonly equipment: EquipmentLoadout | null;
}
