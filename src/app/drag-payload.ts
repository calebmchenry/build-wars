import type { SkillId } from "../domain";

export const BUILD_WARS_DRAG_MIME = "application/x-build-wars-skill";

export type SkillDragPayload =
  | {
      readonly kind: "browser-skill";
      readonly skillId: number;
    }
  | {
      readonly kind: "skill-slot";
      readonly slotIndex: number;
    };

export function browserSkillDragPayload(skillId: SkillId): string {
  return JSON.stringify({
    kind: "browser-skill",
    skillId: Number(skillId)
  } satisfies SkillDragPayload);
}

export function slotDragPayload(slotIndex: number): string {
  return JSON.stringify({ kind: "skill-slot", slotIndex } satisfies SkillDragPayload);
}

export function parseDragPayload(value: string): SkillDragPayload | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || typeof parsed.kind !== "string") {
      return null;
    }
    if (parsed.kind === "browser-skill" && Number.isSafeInteger(parsed.skillId)) {
      return { kind: "browser-skill", skillId: Number(parsed.skillId) };
    }
    if (parsed.kind === "skill-slot" && Number.isSafeInteger(parsed.slotIndex)) {
      return { kind: "skill-slot", slotIndex: Number(parsed.slotIndex) };
    }
    return null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
