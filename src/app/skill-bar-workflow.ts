import {
  SKILL_BAR_SLOT_COUNT,
  lookupSkillById,
  type CatalogSkillRecord,
  type SkillBar,
  type SkillId
} from "../domain";
import type { AppCatalogViews } from "./catalogs";
import type { EditorState, RawSkillBarOverlay } from "./editor-state";

export type SkillBarWorkflowIntent =
  | {
      readonly kind: "catalog-skill";
      readonly skillId: SkillId;
      readonly toIndex: number;
    }
  | {
      readonly kind: "bar-slot";
      readonly fromIndex: number;
      readonly toIndex: number;
    }
  | {
      readonly kind: "remove-slot";
      readonly fromIndex: number;
    };

export interface SkillBarWorkflowPlan {
  readonly skillBar: SkillBar;
  readonly rawSkillBar: RawSkillBarOverlay;
  readonly selectedSlotIndex: number | null;
  readonly announcement: string;
  readonly tone: "success" | "warning" | "info";
}

export type SkillBarWorkflowResult =
  | {
      readonly ok: true;
      readonly plan: SkillBarWorkflowPlan;
    }
  | {
      readonly ok: false;
      readonly announcement: string;
      readonly tone: "warning";
    };

export function planSkillBarWorkflow(
  state: EditorState,
  catalogs: AppCatalogViews,
  intent: SkillBarWorkflowIntent
): SkillBarWorkflowResult {
  if (intent.kind === "catalog-skill") {
    return planCatalogSkill(state, catalogs, intent.skillId, intent.toIndex);
  }
  if (intent.kind === "bar-slot") {
    return planBarSlotMove(state, intent.fromIndex, intent.toIndex);
  }
  return planRemoval(state, intent.fromIndex);
}

function planCatalogSkill(
  state: EditorState,
  catalogs: AppCatalogViews,
  skillId: SkillId,
  toIndex: number
): SkillBarWorkflowResult {
  if (!validSlotIndex(toIndex)) {
    return invalid("Skill target slot is out of range.");
  }
  const skill = lookupSkillById(catalogs.skillCatalog, skillId);
  if (skill === null || skill.classification.unsupported || skill.classification.nonPlayer) {
    return invalid("Skill payload is stale or not playable.");
  }

  const beforeSkillBar = state.build.skillBar;
  const beforeRaw = state.rawTemplate.skillBar;
  const nextSkillBar = [...beforeSkillBar] as (SkillId | null)[];
  const nextRaw = [...beforeRaw] as RawSkillBarOverlay[number][];
  const targetBefore = beforeSkillBar[toIndex] ?? null;
  const previousIndex = beforeSkillBar.findIndex(
    (candidate, index) => index !== toIndex && sameSkill(candidate, skillId)
  );
  const eliteRemovalIndexes =
    skill.classification.elite === true
      ? resolvedEliteIndexes(state, catalogs).filter(
          (index) => index !== toIndex && !sameSkill(beforeSkillBar[index] ?? null, skillId)
        )
      : [];

  if (previousIndex >= 0) {
    nextSkillBar[previousIndex] = null;
    nextRaw[previousIndex] = null;
  }
  for (const index of eliteRemovalIndexes) {
    nextSkillBar[index] = null;
    nextRaw[index] = null;
  }
  nextSkillBar[toIndex] = skillId;
  nextRaw[toIndex] = null;

  return {
    ok: true,
    plan: {
      skillBar: tupleSkillBar(nextSkillBar),
      rawSkillBar: tupleRawSkillBar(nextRaw),
      selectedSlotIndex: toIndex,
      announcement: catalogAnnouncement(
        skill,
        toIndex,
        targetBefore,
        previousIndex,
        eliteRemovalIndexes
      ),
      tone: "success"
    }
  };
}

function planBarSlotMove(
  state: EditorState,
  fromIndex: number,
  toIndex: number
): SkillBarWorkflowResult {
  if (!validSlotIndex(fromIndex) || !validSlotIndex(toIndex)) {
    return invalid("Skill slot payload is out of range.");
  }
  if (fromIndex === toIndex) {
    return {
      ok: true,
      plan: {
        skillBar: state.build.skillBar,
        rawSkillBar: state.rawTemplate.skillBar,
        selectedSlotIndex: toIndex,
        announcement: `Slot ${toIndex + 1} already contains that skill.`,
        tone: "info"
      }
    };
  }
  const source = state.build.skillBar[fromIndex] ?? null;
  const sourceRaw = state.rawTemplate.skillBar[fromIndex] ?? null;
  if (source === null && sourceRaw === null) {
    return invalid("Source skill slot is empty.");
  }
  const nextSkillBar = [...state.build.skillBar] as (SkillId | null)[];
  const nextRaw = [...state.rawTemplate.skillBar] as RawSkillBarOverlay[number][];
  const target = nextSkillBar[toIndex] ?? null;

  if (target === null && nextRaw[toIndex] === null) {
    nextSkillBar[toIndex] = source;
    nextRaw[toIndex] = sourceRaw;
    nextSkillBar[fromIndex] = null;
    nextRaw[fromIndex] = null;
    return {
      ok: true,
      plan: {
        skillBar: tupleSkillBar(nextSkillBar),
        rawSkillBar: tupleRawSkillBar(nextRaw),
        selectedSlotIndex: toIndex,
        announcement: `Moved slot ${fromIndex + 1} to slot ${toIndex + 1}.`,
        tone: "success"
      }
    };
  }

  nextSkillBar[fromIndex] = nextSkillBar[toIndex] ?? null;
  nextRaw[fromIndex] = nextRaw[toIndex] ?? null;
  nextSkillBar[toIndex] = source;
  nextRaw[toIndex] = sourceRaw;
  return {
    ok: true,
    plan: {
      skillBar: tupleSkillBar(nextSkillBar),
      rawSkillBar: tupleRawSkillBar(nextRaw),
      selectedSlotIndex: toIndex,
      announcement: `Swapped slots ${fromIndex + 1} and ${toIndex + 1}.`,
      tone: "success"
    }
  };
}

function planRemoval(state: EditorState, fromIndex: number): SkillBarWorkflowResult {
  if (!validSlotIndex(fromIndex)) {
    return invalid("Skill removal slot is out of range.");
  }
  if (state.build.skillBar[fromIndex] === null && state.rawTemplate.skillBar[fromIndex] === null) {
    return invalid("Skill slot is already empty.");
  }
  const nextSkillBar = [...state.build.skillBar] as (SkillId | null)[];
  const nextRaw = [...state.rawTemplate.skillBar] as RawSkillBarOverlay[number][];
  nextSkillBar[fromIndex] = null;
  nextRaw[fromIndex] = null;
  return {
    ok: true,
    plan: {
      skillBar: tupleSkillBar(nextSkillBar),
      rawSkillBar: tupleRawSkillBar(nextRaw),
      selectedSlotIndex: fromIndex,
      announcement: `Cleared slot ${fromIndex + 1}.`,
      tone: "success"
    }
  };
}

function resolvedEliteIndexes(state: EditorState, catalogs: AppCatalogViews): readonly number[] {
  return state.build.skillBar.flatMap((skillId, index) => {
    if (skillId === null) {
      return [];
    }
    const skill = lookupSkillById(catalogs.skillCatalog, skillId);
    return skill?.classification.elite === true ? [index] : [];
  });
}

function catalogAnnouncement(
  skill: CatalogSkillRecord,
  toIndex: number,
  targetBefore: SkillId | null,
  previousIndex: number,
  eliteRemovalIndexes: readonly number[]
): string {
  const base = sameSkill(targetBefore, skill.id)
    ? `${skill.name} is already in slot ${toIndex + 1}.`
    : targetBefore === null
      ? `${skill.name} placed in slot ${toIndex + 1}.`
      : `${skill.name} replaced slot ${toIndex + 1}.`;
  const duplicate =
    previousIndex >= 0 ? ` Moved existing copy from slot ${previousIndex + 1}.` : "";
  const elite =
    eliteRemovalIndexes.length > 0
      ? ` Removed other elite slot${eliteRemovalIndexes.length === 1 ? "" : "s"} ${eliteRemovalIndexes
          .map((index) => index + 1)
          .join(", ")}.`
      : "";
  return `${base}${duplicate}${elite}`.trim();
}

function invalid(announcement: string): SkillBarWorkflowResult {
  return { ok: false, announcement, tone: "warning" };
}

function sameSkill(left: SkillId | null, right: SkillId | null): boolean {
  return left !== null && right !== null && Number(left) === Number(right);
}

function validSlotIndex(index: number): boolean {
  return Number.isSafeInteger(index) && index >= 0 && index < SKILL_BAR_SLOT_COUNT;
}

function tupleSkillBar(values: readonly (SkillId | null)[]): SkillBar {
  return [
    values[0] ?? null,
    values[1] ?? null,
    values[2] ?? null,
    values[3] ?? null,
    values[4] ?? null,
    values[5] ?? null,
    values[6] ?? null,
    values[7] ?? null
  ];
}

function tupleRawSkillBar(values: readonly RawSkillBarOverlay[number][]): RawSkillBarOverlay {
  return [
    values[0] ?? null,
    values[1] ?? null,
    values[2] ?? null,
    values[3] ?? null,
    values[4] ?? null,
    values[5] ?? null,
    values[6] ?? null,
    values[7] ?? null
  ];
}
